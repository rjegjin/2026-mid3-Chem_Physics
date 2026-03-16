import os
import json
import re
from bs4 import BeautifulSoup

root_dir = "/home/rjegj/projects/2026-mid3-Chem_Physics"
html_files = sorted([f for f in os.listdir(root_dir) if f.endswith('.html') and f not in ['index.html', 'asset_dashboard.html']])

# 카테고리 정의 (파일명 패턴 기준)
CATEGORIES = {
    "0. Orientation & Intro": [r"0_.*", r"7_.*", r"syllabus\.html"],
    "1. Middle School Chemistry": [r"[1-6]_.*"],
    "2. Advanced Inorganic Chemistry": [r"adv_inorganic_.*"],
    "3. Others": [r".*"]
}

assets = {}
manifest = {}

def get_category(filename):
    for cat, patterns in CATEGORIES.items():
        for p in patterns:
            if re.match(p, filename):
                return cat
    return "3. Others"

print("🔍 Starting Intelligent Asset Scan (BeautifulSoup DOM Parsing)...")

for html in html_files:
    path = os.path.join(root_dir, html)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'lxml')
            
            unique_assets = set()
            
            # 1. <img> 태그 스캔
            for img in soup.find_all('img'):
                src = img.get('src')
                if src and not src.startswith('data:'): # Base64 제외
                    unique_assets.add(src)
            
            # 2. <video> 및 <source> 태그 스캔
            for media in soup.find_all(['video', 'source', 'audio']):
                src = media.get('src')
                if src and not src.startswith('data:'):
                    unique_assets.add(src)
                    
            # 3. 모든 태그의 inline style에서 background-image 스캔
            for tag in soup.find_all(style=True):
                style = tag.get('style')
                bg_matches = re.findall(r"url\(['\"]?([^'\")]+)['\"]?\)", style)
                for bg in bg_matches:
                    if not bg.startswith('data:'):
                        unique_assets.add(bg)

            # 4. <style> 태그 안의 CSS에서 스캔 (Hero Image 등)
            for style_tag in soup.find_all('style'):
                if style_tag.string:
                    bg_matches = re.findall(r"url\(['\"]?([^'\")]+)['\"]?\)", style_tag.string)
                    for bg in bg_matches:
                        if not bg.startswith('data:'):
                            unique_assets.add(bg)
            
            if unique_assets:
                sorted_assets = sorted(list(unique_assets))
                assets[html] = sorted_assets
                # 매니페스트용 데이터 구성
                manifest[html] = {}
                for i, url in enumerate(sorted_assets):
                    asset_id = f"{html.replace('.html', '')}_asset_{i+1}"
                    manifest[html][asset_id] = url
                    
    except Exception as e:
        print(f"❌ Error reading {html}: {e}")

# 팅커벨 매니페스트 로드
tinker_manifest = {}
tinker_path = os.path.join(root_dir, 'tinkerbell_manifest.json')
if os.path.exists(tinker_path):
    with open(tinker_path, 'r', encoding='utf-8') as f:
        tinker_manifest = json.load(f)

def get_tinkerbell_button(filename):
    match = re.search(r'(\d+)', filename)
    if match:
        lesson_num = f"{match.group(1)}차시"
        if lesson_num in tinker_manifest:
            info = tinker_manifest[lesson_num]
            return f"""
            <div class="mt-4 p-4 bg-cyan-50 border-2 border-cyan-200 rounded-xl flex items-center justify-between">
                <div>
                    <span class="text-[10px] font-black text-cyan-600 uppercase">Tinkerbell Quiz</span>
                    <h4 class="text-sm font-bold text-slate-800">{lesson_num} 통합 퀴즈 ({info['count']}문제)</h4>
                </div>
                <a href="https://www.tkbell.co.kr/user/player/checkRoom.do" target="_blank" 
                   class="bg-cyan-600 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-cyan-700 shadow-sm">
                   🚀 퀴즈 시작
                </a>
            </div>
            """
    return ""

# 카테고리별로 정렬된 에셋 데이터 생성
categorized_assets = {cat: {} for cat in CATEGORIES.keys()}
for html, urls in assets.items():
    cat = get_category(html)
    categorized_assets[cat][html] = urls

# image_manifest.json 저장
with open(os.path.join(root_dir, 'image_manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

# HTML 생성 (헤더/푸터)
header = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Intelligent Asset Manager (2026)</title>
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
                <h1 class="text-4xl font-black text-slate-900">Intelligent Asset Manager</h1>
                <p class="text-slate-500 mt-2">BeautifulSoup4 기반 DOM 파싱 적용. 모든 에셋이 자동으로 스캔됩니다.</p>
            </div>
            <div class="flex flex-col items-end gap-2">
                <div class="flex gap-4">
                    <span class="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> DOM Scanner Active
                    </span>
                    <a href="index.html" class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors">Home</a>
                </div>
            </div>
        </header>
        <div class="space-y-20">
"""

footer = """
        </div>
    </div>
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
        tk_btn = get_tinkerbell_button(filename)
        body += f"""
        <section>
            <div class="flex items-start justify-between mb-6">
                <h3 class="text-xl font-bold text-slate-700 flex items-center gap-3">
                    <span class="w-1.5 h-6 bg-cyan-500 rounded-full"></span> {filename}
                    <span class="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{len(urls)} Assets</span>
                </h3>
                {tk_btn}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
"""
        for url in urls:
            inputId = f"input_{card_id}"
            body += f"""
                <div class="asset-card bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 flex flex-col">
                    <div class="img-container">
                        <img src="{url}" alt="Resource" onerror="this.src='https://via.placeholder.com/150?text=Not+Found'">
                    </div>
                    <div class="p-4 flex-grow flex flex-col justify-between bg-slate-50 border-t border-slate-100">
                        <div>
                            <label class="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Extracted Path</label>
                            <input id="{inputId}" type="text" value="{url}" readonly 
                                   class="w-full text-[10px] p-2 bg-white border border-slate-200 rounded font-mono text-slate-600 outline-none">
                        </div>
                    </div>
                </div>
"""
            card_id += 1
        body += "            </div></section>"
    body += "    </div></div>"

with open(os.path.join(root_dir, 'asset_dashboard.html'), 'w', encoding='utf-8') as f:
    f.write(header + body + footer)

print(f"✅ Dashboard successfully built with {card_id} assets across {len(assets)} files.")
print(f"✅ Manifest generated: image_manifest.json")
