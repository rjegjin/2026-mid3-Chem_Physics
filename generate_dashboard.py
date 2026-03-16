import os
import re
import json
from bs4 import BeautifulSoup

root_dir = "/home/rjegj/projects/2026-mid3-Chem_Physics"
html_files = sorted([f for f in os.listdir(root_dir) if f.endswith('.html') and f not in ['index.html', 'asset_dashboard.html', 'syllabus.html']])

# 1. 디자인 레퍼런스(index.html)에서 템플릿 추출 로직
def harvest_template():
    index_path = os.path.join(root_dir, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    
    # 공통 Head (스타일 포함)
    head_content = "".join([str(c) for c in soup.head.contents if str(c).strip()])
    # Hero Section 수정 (제목만 Asset Manager로 변경)
    hero = soup.find('header', class_='hero-section')
    if hero:
        h1 = hero.find('h1')
        if h1: h1.string = "2026 Asset Manager"
        p = hero.find('p', class_='text-xl')
        if p: p.string = "로컬 수정은 [저장] 즉시 반영되며, GitHub 동기화용 JSON이 자동 생성됩니다."
        # 상단 링크 제거 또는 수정
        links_div = hero.find('div', class_='flex justify-center gap-4 mb-4')
        if links_div:
            links_div.clear()
            home_link = soup.new_tag('a', href='index.html')
            home_link['class'] = "text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 transition-all"
            home_link.string = "Home Dashboard →"
            links_div.append(home_link)
    
    footer = soup.find('footer')
    
    return str(head_content), str(hero), str(footer)

head_tmpl, hero_tmpl, footer_tmpl = harvest_template()

# 카테고리 정의
CATEGORIES = {
    "0. Orientation & Intro": [r"0_.*", r"7_.*", r"syllabus\.html"],
    "1. Middle School Chemistry": [r"[1-6]_.*"],
    "2. Advanced Inorganic Chemistry": [r"adv_inorganic_.*"],
    "3. Others": [r".*"]
}

def get_category(filename):
    for cat, patterns in CATEGORIES.items():
        for p in patterns:
            if re.match(p, filename):
                return cat
    return "3. Others"

# 2. 각 HTML 파일 메타데이터 및 에셋 정밀 스캔
assets_data = {}
manifest = {}

for html in html_files:
    path = os.path.join(root_dir, html)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
            
            # 실제 강의 제목 추출 (h1 우선, 없으면 title)
            title = "Untitled Lesson"
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text(strip=True)
            elif soup.title:
                title = soup.title.get_text(strip=True)
            
            # 이미지 스캔
            img_tags = [img['src'] for img in soup.find_all('img') if img.get('src')]
            # 배경 이미지 스캔 (정규표현식 병행)
            bg_images = re.findall(r"background-image:\s*url\(['\"]?([^'\")]+)['\"]?\)", str(soup))
            
            unique_assets = list(set(img_tags + bg_images))
            
            if unique_assets:
                assets_data[html] = {
                    "title": title,
                    "urls": unique_assets
                }
                manifest[html] = {}
                for i, url in enumerate(unique_assets):
                    asset_id = f"{html.replace('.html', '')}_asset_{i+1}"
                    manifest[html][asset_id] = url
    except Exception as e:
        print(f"Error scanning {html}: {e}")

# 카테고리 분류
categorized_assets = {cat: {} for cat in CATEGORIES.keys()}
for html, data in assets_data.items():
    cat = get_category(html)
    categorized_assets[cat][html] = data

# image_manifest.json 저장
with open(os.path.join(root_dir, 'image_manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

# 3. HTML 생성 로직
output_html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    {head_tmpl}
    <style>
        .asset-card {{ transition: all 0.3s ease; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; display: flex; flex-direction: column; background: white; }}
        .asset-card:hover {{ transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: var(--accent-cyan); }}
        .img-container {{ height: 180px; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden; position: relative; border-bottom: 1px solid #f1f5f9; }}
        .img-container img {{ max-height: 100%; object-fit: contain; z-index: 1; }}
        .category-group {{ margin-top: 4rem; }}
        .category-header {{ border-bottom: 4px solid var(--primary-blue); margin-bottom: 2rem; padding-bottom: 1rem; }}
        .lesson-section-header {{ margin-bottom: 1.5rem; display: flex; items-center: center; gap: 0.5rem; }}
        .lesson-section-header h3 {{ font-size: 1.25rem; color: var(--primary-blue); }}
    </style>
</head>
<body class="bg-[#f8fafc]">
    {hero_tmpl}

    <main class="max-w-7xl mx-auto px-6 pb-20">
"""

for cat, lessons in categorized_assets.items():
    if not lessons: continue
    
    output_html += f"""
    <div class="category-group">
        <div class="category-header">
            <h2 class="text-3xl font-black text-slate-900 uppercase tracking-tighter">{cat}</h2>
        </div>
        <div class="space-y-16">
    """
    
    for html, data in lessons.items():
        output_html += f"""
        <section>
            <div class="lesson-section-header">
                <span class="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                <h3 class="font-bold">{data['title']} <span class="text-sm font-normal text-slate-400 ml-2">({html})</span></h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        """
        
        for i, url in enumerate(data['urls']):
            input_id = f"input_{cat.replace(' ', '_')}_{html.replace('.', '_')}_{i}"
            output_html += f"""
                <div class="asset-card">
                    <div class="img-container">
                        <img src="{url}" alt="Resource" onerror="this.src='https://via.placeholder.com/150?text=Invalid+URL'">
                    </div>
                    <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Source Path</label>
                            <input id="{input_id}" type="text" value="{url}" 
                                   class="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded font-mono focus:ring-2 focus:ring-cyan-500 outline-none transition-all">
                        </div>
                        <button onclick="updateAsset('{html}', '{url}', '{input_id}')" 
                                class="w-full bg-slate-900 text-white hover:bg-cyan-600 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                            Save Changes
                        </button>
                    </div>
                </div>
            """
        output_html += """
            </div>
        </section>
        """
    
    output_html += """
        </div>
    </div>
    """

output_html += f"""
    </main>

    {footer_tmpl}

    <script>
    async function updateAsset(filename, oldUrl, inputId) {{
        const newUrl = document.getElementById(inputId).value;
        const btn = document.querySelector(`button[onclick*="${{inputId}}"]`);
        
        btn.disabled = true;
        btn.innerText = "Saving...";
        
        try {{
            const response = await fetch('http://localhost:5000/update_asset', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{ filename, old_url: oldUrl, new_url: newUrl }})
            }});
            
            if (response.ok) {{
                btn.innerText = "✓ Saved";
                btn.classList.add('bg-emerald-600');
                setTimeout(() => {{
                    btn.innerText = "Save Changes";
                    btn.classList.remove('bg-emerald-600');
                    btn.disabled = false;
                }}, 2000);
            }} else {{
                throw new Error('Save failed');
            }}
        }} catch (err) {{
            alert('Error: ' + err.message);
            btn.disabled = false;
            btn.innerText = "Retry Save";
        }}
    }}
    </script>
</body>
</html>
"""

with open(os.path.join(root_dir, 'asset_dashboard.html'), 'w', encoding='utf-8') as f:
    f.write(output_html)

print("Asset Dashboard updated successfully with modern template scanning logic.")
