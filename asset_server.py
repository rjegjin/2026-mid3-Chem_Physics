import os
import json
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__)

# 상태 저장용 변수
CURRENT_STATE = {
    "active_image": None,
    "last_updated": 0
}

IMAGE_DIR = "/home/rjegj/projects/2026-mid3-Chem_Physics/generator/data/bank/images"

@app.route('/')
def index():
    return "Science Asset Remote Server is Running."

@app.route('/api/state', methods=['GET', 'POST'])
def handle_state():
    global CURRENT_STATE
    if request.method == 'POST':
        data = request.json
        CURRENT_STATE["active_image"] = data.get("image")
        CURRENT_STATE["last_updated"] += 1
        return jsonify({"status": "success", "state": CURRENT_STATE})
    return jsonify(CURRENT_STATE)

@app.route('/api/images')
def list_images():
    images = [f for f in os.listdir(IMAGE_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    return jsonify(sorted(images))

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(IMAGE_DIR, filename)

# Remote Control UI (Mobile)
@app.route('/remote')
def remote_ui():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Science Remote</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-white p-4">
        <h1 class="text-xl font-bold mb-4">Remote Asset Controller</h1>
        <div id="image-list" class="grid grid-cols-2 gap-2"></div>
        <script>
            async function loadImages() {
                const res = await fetch('/api/images');
                const images = await res.json();
                const listDiv = document.getElementById('image-list');
                images.forEach(img => {
                    const btn = document.createElement('button');
                    btn.className = "bg-slate-700 p-2 rounded text-xs truncate text-left";
                    btn.innerText = img;
                    btn.onclick = () => setImage(img);
                    listDiv.appendChild(btn);
                });
            }
            async function setImage(imgName) {
                await fetch('/api/state', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({image: imgName})
                });
                alert('Sent: ' + imgName);
            }
            loadImages();
        </script>
    </body>
    </html>
    """

# Display UI (TV/PC)
@app.route('/display')
def display_ui():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Science Display</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            #viewer { transition: all 0.5s ease-in-out; }
        </style>
    </head>
    <body class="bg-black flex items-center justify-center h-screen overflow-hidden">
        <img id="viewer" src="" class="max-h-screen max-w-full hidden">
        <div id="placeholder" class="text-slate-500 text-2xl font-bold">Waiting for Remote Command...</div>
        <script>
            let lastUpdate = -1;
            async function pollState() {
                try {
                    const res = await fetch('/api/state');
                    const state = await res.json();
                    if (state.last_updated !== lastUpdate) {
                        lastUpdate = state.last_updated;
                        updateDisplay(state.active_image);
                    }
                } catch (e) {}
                setTimeout(pollState, 1000);
            }
            function updateDisplay(imgName) {
                const img = document.getElementById('viewer');
                const placeholder = document.getElementById('placeholder');
                if (imgName) {
                    img.src = '/images/' + imgName;
                    img.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                }
            }
            pollState();
        </script>
    </body>
    </html>
    """

if __name__ == '__main__':
    # 로컬 네트워크 접속 허용을 위해 0.0.0.0 포트 5005번으로 실행
    app.run(host='0.0.0.0', port=5005)
