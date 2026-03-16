import os
import json
from bs4 import BeautifulSoup

root_dir = "/home/rjegj/projects/2026-mid3-Chem_Physics"
html_files = sorted([f for f in os.listdir(root_dir) if f.endswith('.html') and f not in ['index.html', 'asset_dashboard.html']])

CATEGORIES = {
    "0. Orientation & Intro": ["0_", "7_", "syllabus"],
    "1. Middle School Chemistry": ["1_", "2_", "3_", "4_", "5_", "6_"],
    "2. Advanced Inorganic": ["adv_inorganic"],
    "3. Others": []
}

def get_category(filename):
    for cat, keywords in CATEGORIES.items():
        for kw in keywords:
            if filename.startswith(kw):
                return cat
    return "3. Others"

assets = {}
manifest = {}

print("🔍 AST 파싱(BeautifulSoup)으로 에셋을 스캔합니다...")

# BeautifulSoup을 이용한 강건한 파싱
for html in html_files:
    path = os.path.join(root_dir, html)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            
            extracted_urls = set()
            
            # 1. <img> 태그 추출
            for img in soup.find_all('img'):
                if img.get('src'):
                    extracted_urls.add(img['src'])
            
            # 2. 인라인 CSS background-image 추출 (제한적이지만 유용)
            for tag in soup.find_all(style=True):
                style = tag['style']
                if 'background-image' in style:
                    # 간단한 문자열 파싱으로 url 추출
                    start = style.find("url(") + 4
                    end = style.find(")", start)
                    if start > 3 and end > 0:
                        url = style[start:end].strip("'\"")
                        extracted_urls.add(url)
                        
            # 3. <iframe> (PhET 시뮬레이션 등) 추출
            for iframe in soup.find_all('iframe'):
                if iframe.get('src'):
                    extracted_urls.add(iframe['src'])
            
            if extracted_urls:
                assets[html] = list(extracted_urls)
                manifest[html] = {}
                for i, url in enumerate(assets[html]):
                    asset_id = f"{html.replace('.html', '')}_asset_{i+1}"
                    manifest[html][asset_id] = url
                    
    except Exception as e:
        print(f"⚠️ {html} 파싱 중 오류: {e}")

# Tinkerbell 데이터 로드
tinker_manifest = {}
tinker_path = os.path.join(root_dir, 'tinkerbell_manifest.json')
if os.path.exists(tinker_path):
    with open(tinker_path, 'r', encoding='utf-8') as f:
        tinker_manifest = json.load(f)

def get_tinkerbell_button(filename):
    import re
    match = re.search(r'(\d+)', filename)
    if match:
        lesson_num = f"{match.group(1)}차시"
        if lesson_num in tinker_manifest:
            info = tinker_manifest[lesson_num]
            return f"""
            <div class="p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center justify-between shadow-sm">
                <div>
                    <span class="text-[10px] font-black text-cyan-600">Tinkerbell Quiz</span>
                    <p class="text-sm font-bold text-slate-800">{lesson_num} 퀴즈 ({info['count']}문제)</p>
                </div>
                <a href="https://www.tkbell.co.kr/user/player/checkRoom.do" target="_blank" class="bg-cyan-600 text-white px-4 py-2 rounded-md text-xs font-black hover:bg-cyan-700 transition-colors">Start</a>
            </div>
            """
    return ""

categorized_assets = {cat: {} for cat in CATEGORIES.keys()}
for html, urls in assets.items():
    cat = get_category(html)
    categorized_assets[cat][html] = urls

with open(os.path.join(root_dir, 'image_manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

header = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>2026 Asset Dashboard (AST Powered)</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans p-8">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-end mb-12 border-b-4 border-slate-900 pb-6">
            <div>
                <h1 class="text-5xl font-black tracking-tighter text-slate-900">Asset Dashboard</h1>
                <p class="text-slate-500 mt-2 font-bold">Powered by BeautifulSoup AST Parsing</p>
            </div>
            <a href="index.html" class="bg-slate-900 text-white px-8 py-3 rounded-full font-black hover:bg-blue-600 transition-all shadow-lg">Home</a>
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
for category, files in categorized_assets.items():
    if not files: continue
    
    body += f"""
    <div>
        <h2 class="text-3xl font-black text-blue-800 mb-8 flex items-center gap-4">
            <span class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">📁</span> {category}
        </h2>
        <div class="space-y-12">
"""
    
    for filename, urls in files.items():
        tk_btn = get_tinkerbell_button(filename)
        body += f"""
            <div class="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                <div class="flex justify-between items-start mb-8">
                    <h3 class="text-2xl font-bold text-slate-800 underline decoration-blue-200 underline-offset-8">{filename}</h3>
                    {tk_btn}
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
"""
        for url in urls:
            is_iframe = url.startswith('http') and 'phet' in url
            preview = f'<iframe src="{url}" class="w-full h-full pointer-events-none"></iframe>' if is_iframe else f'<img src="{url}" class="max-h-full object-contain mx-auto" />'
            
            body += f"""
                    <div class="bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden flex flex-col group hover:border-blue-500 transition-colors">
                        <div class="h-32 p-2 flex items-center justify-center bg-white border-b border-slate-100 relative">
                            {preview}
                        </div>
                        <div class="p-3">
                            <input type="text" readonly value="{url}" class="w-full text-[10px] p-2 bg-slate-100 border border-slate-200 rounded font-mono text-slate-500 outline-none">
                        </div>
                    </div>
"""
        body += "</div></div>"
    body += "</div></div>"

with open(os.path.join(root_dir, 'asset_dashboard.html'), 'w', encoding='utf-8') as f:
    f.write(header + body + footer)

print("✅ BeautifulSoup 파싱 기반 대시보드 생성이 완료되었습니다.")
