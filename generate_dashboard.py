import os
import re
import json

root_dir = "/home/rjegj/projects/2026-mid3-Chem_Physics"
html_files = sorted([f for f in os.listdir(root_dir) if f.endswith('.html') and f not in ['index.html', 'asset_dashboard.html']])

# 카테고리 정의 (파일명 패턴 기준)
CATEGORIES = {
    "0. Orientation & Intro": [r"0_.*", r"7_.*", r"syllabus\.html"],
    "1. Middle School Chemistry": [r"[1-6]_.*"],
    "2. Advanced Inorganic Chemistry": [r"adv_inorganic_.*"],
    "3. Others": [r".*"] # 나머지는 여기에
}

assets = {}
manifest = {}

def get_category(filename):
    for cat, patterns in CATEGORIES.items():
        for p in patterns:
            if re.match(p, filename):
                return cat
    return "3. Others"

# 에셋 스캔 및 매니페스트 생성
for html in html_files:
    path = os.path.join(root_dir, html)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            img_tags = re.findall(r'<img [^>]*src="([^"]+)"', content)
            bg_images = re.findall(r"background-image:\s*url\(['\"]?([^'\")]+)['\"]?\)", content)
            unique_assets = list(set(img_tags + bg_images))
            
            if unique_assets:
                assets[html] = unique_assets
                # 매니페스트용 (GitHub AI 대응용 JSON)
                manifest[html] = {}
                for i, url in enumerate(unique_assets):
                    asset_id = f"{html.replace('.html', '')}_asset_{i+1}"
                    manifest[html][asset_id] = url
    except Exception as e:
        print(f"Error reading {html}: {e}")

# 카테고리별로 정렬된 에셋 데이터 생성
categorized_assets = {cat: {} for cat in CATEGORIES.keys()}
for html, urls in assets.items():
    cat = get_category(html)
    categorized_assets[cat][html] = urls

# image_manifest.json 저장
with open(os.path.join(root_dir, 'image_manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

header = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>이미지 리소스 라이브 관리자 (2026)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .asset-card { transition: all 0.2s; border: 2px solid transparent; }
        .asset-card:hover { transform: translateY(-5px); border-color: #06b6d4; }
        .img-container { height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; overflow: hidden; position: relative; }
        .img-container img { max-height: 100%; object-fit: contain; z-index: 1; }
        .loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: none; align-items: center; justify-content: center; z-index: 10; }
        .category-header { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); }
    </style>
</head>
<body class="bg-slate-50 p-10 font-[Pretendard]">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-end mb-12">
            <div>
                <h1 class="text-4xl font-black text-slate-900">2026 Asset Manager</h1>
                <p class="text-slate-500 mt-2">로컬 수정은 [저장] 즉시 반영되며, GitHub 동기화용 JSON이 자동 생성됩니다.</p>
            </div>
            <div class="flex flex-col items-end gap-2">
                <div class="flex gap-4">
                    <span class="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Local Server Connected
                    </span>
                    <a href="index.html" class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors">Home</a>
                </div>
                <p class="text-[10px] text-slate-400 font-mono">Manifest: image_manifest.json (Updated)</p>
            </div>
        </header>
        <div class="space-y-20">
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

for category, files in categorized_assets.items():
    if not files: continue
    
    body += f"""
<div class="category-group">
    <div class="category-header border-b-4 border-slate-900 mb-8 py-4">
        <h2 class="text-3xl font-black text-slate-900 uppercase tracking-tighter">{category}</h2>
    </div>
    <div class="space-y-16">
"""
    
    for filename, urls in files.items():
        body += f"""
        <section>
            <h3 class="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
                <span class="w-1.5 h-6 bg-cyan-500 rounded-full"></span> {filename}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
"""
        for url in urls:
            inputId = f"input_{card_id}"
            body += f"""
                <div class="asset-card bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 flex flex-col">
                    <div class="img-container">
                        <div class="loading-overlay"><span class="text-sm font-bold">저장 중...</span></div>
                        <img src="{url}" alt="Resource" onerror="this.src='https://via.placeholder.com/150?text=Invalid+URL'">
                    </div>
                    <div class="p-4 flex-grow flex flex-col justify-between">
                        <div>
                            <label class="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Source Path</label>
                            <input id="{inputId}" type="text" value="{url}" 
                                   class="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded font-mono focus:ring-2 focus:ring-cyan-500 outline-none transition-all">
                        </div>
                        <button onclick="updateAsset('{filename}', '{url}', '{inputId}')" 
                                class="mt-3 w-full bg-slate-100 hover:bg-cyan-600 hover:text-white text-slate-600 py-1.5 rounded-lg text-xs font-bold transition-all">
                            Save Local
                        </button>
                    </div>
                </div>
"""
            card_id += 1
        body += "            </div></section>"
    body += "    </div></div>"

with open(os.path.join(root_dir, 'asset_dashboard.html'), 'w', encoding='utf-8') as f:
    f.write(header + body + footer)

print(f"✅ Dashboard updated with {card_id} assets in categories.")
print(f"✅ Manifest generated: image_manifest.json")
