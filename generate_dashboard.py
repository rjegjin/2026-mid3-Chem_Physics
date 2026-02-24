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
            
            # Find img tags
            img_tags = re.findall(r'<img [^>]*src="([^"]+)"', content)
            
            # Find background images
            bg_images = re.findall(r"background-image:\s*url\(['\"]?([^'\")]+)['\"]?\)", content)
            
            assets[html] = list(set(img_tags + bg_images))
    except Exception as e:
        print(f"Error reading {html}: {e}")

# Build HTML manually to avoid .format issues
header = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>이미지 리소스 대시보드</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .asset-card { transition: all 0.2s; }
        .asset-card:hover { transform: translateY(-5px); border-color: #06b6d4; }
        .img-container { height: 120px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; overflow: hidden; }
        .img-container img { max-height: 100%; object-fit: contain; }
    </style>
</head>
<body class="bg-slate-50 p-10 font-[Pretendard]">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-end mb-12">
            <div>
                <h1 class="text-4xl font-black text-slate-900">Asset Dashboard</h1>
                <p class="text-slate-500 mt-2">수업 자료에 사용된 모든 이미지를 확인하고 관리합니다.</p>
            </div>
            <a href="index.html" class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors">Home</a>
        </header>
        <div class="space-y-16">
"""

footer = """
        </div>
        <div class="mt-24 p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <h3 class="text-xl font-bold text-slate-400">관리 팁</h3>
            <p class="text-slate-400 mt-2 leading-relaxed">
                1. <code>pictures/</code> 폴더에 로컬 이미지 파일을 넣으세요.<br>
                2. HTML 파일의 <code>src="..."</code> 부분을 <code>pictures/파일명.jpg</code>로 수정하면 적용됩니다.
            </p>
        </div>
    </div>
</body>
</html>
"""

body = ""
for filename, urls in assets.items():
    if not urls: continue
    
    body += f"""
<section>
    <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <span class="w-2 h-8 bg-cyan-500 rounded-full"></span>
        {filename}
    </h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
"""
    for url in urls:
        body += f"""
        <div class="asset-card bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
            <div class="img-container">
                <img src="{url}" alt="Resource">
            </div>
            <div class="p-3">
                <p class="text-[10px] text-slate-400 truncate mb-2" title="{url}">{url}</p>
                <div class="text-[9px] font-mono text-slate-300 break-all">Used in {filename}</div>
            </div>
        </div>
"""
    body += "    </div></section>"

with open(os.path.join(root_dir, 'asset_dashboard.html'), 'w', encoding='utf-8') as f:
    f.write(header + body + footer)

print("Dashboard generated successfully: asset_dashboard.html")
