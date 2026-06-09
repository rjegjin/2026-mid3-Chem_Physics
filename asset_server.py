import os
import json
import subprocess
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 상태 저장용 변수
CURRENT_STATE = {
    "active_image": None,
    "last_updated": 0
}

PROJECT_ROOT = "/home/rjegj/projects/2026-mid3-Chem_Physics"
IMAGE_DIR = os.path.join(PROJECT_ROOT, "generator/data/bank/images")
PYTHON_BIN = "/home/rjegj/projects/unified_venv/bin/python"

def run_project_command(command):
    return subprocess.run(
        command,
        cwd=PROJECT_ROOT,
        check=True,
        text=True,
        capture_output=True
    )

def commit_and_push_asset_change(filename):
    paths = [filename, "asset_dashboard.html", "image_manifest.json"]
    run_project_command(["git", "add", *paths])

    diff_check = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
        cwd=PROJECT_ROOT
    )
    if diff_check.returncode == 0:
        return "No committed changes; files were already up to date."

    commit = run_project_command([
        "git",
        "commit",
        "-m",
        f"Update assets for {filename}"
    ])
    push = run_project_command(["git", "push"])
    return (commit.stdout + push.stdout + push.stderr).strip()

@app.route('/')
def index():
    return "Science Asset Remote Server is Running."

@app.route('/api/replace_image', methods=['POST'])
def replace_image():
    data = request.json
    filename = data.get('filename')
    old_url = data.get('old_url')
    new_url = data.get('new_url')
    
    if not filename or not old_url or not new_url:
        return jsonify({"status": "error", "message": "Missing parameters"}), 400
        
    filepath = os.path.join(PROJECT_ROOT, filename)
    if not os.path.exists(filepath):
        return jsonify({"status": "error", "message": f"File {filename} not found"}), 404
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if old_url not in content:
            return jsonify({"status": "error", "message": "Old URL not found in the file"}), 404
            
        content = content.replace(old_url, new_url)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
        # Regenerate dashboard and publish the same asset state to the server.
        run_project_command([PYTHON_BIN, os.path.join(PROJECT_ROOT, "generate_dashboard.py")])
        publish_log = commit_and_push_asset_change(filename)
        
        return jsonify({
            "status": "success",
            "message": "Image replaced, dashboard regenerated, and changes pushed",
            "publish_log": publish_log
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

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
