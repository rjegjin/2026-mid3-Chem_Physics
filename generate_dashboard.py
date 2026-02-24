import os
import re

root_dir = "/home/rjegj/projects/2026-mid3-Chem_Physics"
html_files = sorted([f for f in os.listdir(root_dir) if f.endswith('.html') and f not in ['index.html', 'asset_dashboard.html']])

assets = {}

for html in html_files:
    path = os.path.join(root_dir, html)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            img_tags = re.findall(r'<img [^>]*src="([^"]+)"', content)
            bg_images = re.findall(r"background-image:\s*url\(['\"]?([^'\")]+)['\"]?\)", content)
            assets[html] = list(set(img_tags + bg_images))
    except Exception as e:
        print(f"Error reading {html}: {e}")

header = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>이미지 리소스 라이브 관리자</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .asset-card { transition: all 0.2s; border: 2px solid transparent; }
        .asset-card:hover { transform: translateY(-5px); border-color: #06b6d4; }
        .img-container { height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; overflow: hidden; position: relative; }
        .img-container img { max-height: 100%; object-fit: contain; z-index: 1; }
        .loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: none; align-items: center; justify-content: center; z-index: 10; }
    </style>
</head>
<body class="bg-slate-50 p-10 font-[Pretendard]">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-end mb-12">
            <div>
                <h1 class="text-4xl font-black text-slate-900">Live Asset Manager</h1>
                <p class="text-slate-500 mt-2">이미지 주소를 수정하고 [저장]을 누르면 즉시 파일에 반영됩니다.</p>
            </div>
            <div class="flex gap-4">
                <span class="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Server Connected (Port 8000)
                </span>
                <a href="index.html" class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors">Home</a>
            </div>
        </header>
        <div class="space-y-16">
"""

footer = """
        </div>
    </div>
    <script>
        async function updateAsset(filename, oldSrc, inputId) {
            const input = document.getElementById(inputId);
            const newSrc = input.value.trim();
            const card = input.closest('.asset-card');
            const overlay = card.querySelector('.loading-overlay');
            
            if (oldSrc === newSrc) {
                alert('변경사항이 없습니다.');
                return;
            }

            overlay.style.display = 'flex';
            
            try {
                const response = await fetch('http://localhost:8000/update-asset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, old_src: oldSrc, new_src: newSrc })
                });

                if (response.ok) {
                    alert('성공적으로 수정되었습니다! 페이지를 새로고침하면 반영된 이미지를 볼 수 있습니다.');
                    location.reload();
                } else {
                    alert('수정 실패: 서버 오류가 발생했습니다.');
                }
            } catch (err) {
                alert('서버와 연결할 수 없습니다. asset_server.py가 실행 중인지 확인하세요.');
            } finally {
                overlay.style.display = 'none';
            }
        }
    </script>
</body>
</html>
"""

body = ""
card_id = 0
for filename, urls in assets.items():
    if not urls: continue
    body += f"""
<section>
    <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <span class="w-2 h-8 bg-cyan-500 rounded-full"></span> {filename}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
"""
    for url in urls:
        inputId = f"input_{card_id}"
        body += f"""
        <div class="asset-card bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex flex-col">
            <div class="img-container">
                <div class="loading-overlay"><span class="text-sm font-bold">저장 중...</span></div>
                <img src="{url}" alt="Resource" onerror="this.src='https://via.placeholder.com/150?text=Invalid+URL'">
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Image Source (URL or Path)</label>
                    <input id="{inputId}" type="text" value="{url}" 
                           class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-mono focus:ring-2 focus:ring-cyan-500 outline-none transition-all">
                </div>
                <button onclick="updateAsset('{filename}', '{url}', '{inputId}')" 
                        class="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">
                    변경사항 저장하기
                </button>
            </div>
        </div>
"""
        card_id += 1
    body += "    </div></section>"

with open(os.path.join(root_dir, 'asset_dashboard.html'), 'w', encoding='utf-8') as f:
    f.write(header + body + footer)

print("Direct-edit Dashboard generated: asset_dashboard.html")
