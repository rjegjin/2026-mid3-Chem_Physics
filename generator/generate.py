import json
import os
import glob
import re
from jinja2 import Template

def process_inline_answers(text, teacher_mode):
    """
    [[정답]] 형태의 텍스트를 찾아 모드에 따라 변환합니다.
    어떤 상황에서도 학생용에서 정답이 유출되지 않도록 설계합니다.
    """
    if not text:
        return ""
    
    # 1. [[...]] 패턴 정의 (내부 텍스트 캡처)
    pattern = r'\[\[(.*?)\]\]'
    
    def replace_func(match):
        ans_content = match.group(1)
        if teacher_mode:
            # 교사용: 정답을 빨간색으로 표시
            return f'<span class="ans-text">{ans_content}</span>'
        else:
            # 학생용: 정답을 완전히 지우고 일정한 길이를 가진 공란(&nbsp;)으로 대체
            # 정답의 길이에 상관없이 일정한 가독성을 위해 고정 폭 공란 제공
            return '<span class="ans-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'

    # 2. 치환 실행
    return re.sub(pattern, replace_func, text)

def generate_worksheets(json_path, template_path, output_dir):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    template = Template(template_content)
    base_name = os.path.splitext(os.path.basename(json_path))[0].split('_')[0]
    
    for mode in ["student", "teacher"]:
        is_teacher = (mode == "teacher")
        processed_data = json.loads(json.dumps(data))
        
        # 헤더 개행 처리
        processed_data['lesson_info']['unit_id'] = processed_data['lesson_info']['unit_id'].replace('\n', '<br>')
        
        for section in processed_data['sections']:
            # 요약문 및 본문 처리
            section['summary'] = process_inline_answers(section.get('summary', ''), is_teacher)
            if 'contents' in section:
                for item in section['contents']:
                    item['text'] = process_inline_answers(item.get('text', ''), is_teacher)
                    if 'explore' in item:
                        item['explore'] = process_inline_answers(item['explore'], is_teacher)
                    if 'sub_items' in item:
                        item['sub_items'] = [process_inline_answers(sub, is_teacher) for sub in item['sub_items']]
                    if 'table' in item:
                        item['table']['rows'] = [[process_inline_answers(td, is_teacher) for td in row] for row in item['table']['rows']]
        
        # 퀴즈 섹션 정답 처리
        if 'quizzes' in processed_data:
            for q in processed_data['quizzes']:
                q['question'] = process_inline_answers(q['question'], is_teacher)
                if 'box' in q:
                    q['box'] = [process_inline_answers(line, is_teacher) for line in q['box']]
                if 'choices' in q:
                    q['choices'] = [process_inline_answers(ch, is_teacher) for ch in q['choices']]
        
        html_content = template.render(data=processed_data, teacher_mode=is_teacher)
        output_file = os.path.join(output_dir, f"{base_name}_{mode}.html")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
    
    return base_name

if __name__ == "__main__":
    BASE_DIR = "2026-mid3-Chem_Physics/generator"
    JSON_FILES = glob.glob(os.path.join(BASE_DIR, "data/lessons/*.json"))
    TEMPLATE_FILE = os.path.join(BASE_DIR, "templates/worksheet_template.html")
    OUTPUT_DIR = "2026-mid3-Chem_Physics/worksheets"
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"🚀 [마스터 레이아웃 버전] 학습지 자동 생성 시작")
    for json_f in sorted(JSON_FILES):
        name = generate_worksheets(json_f, TEMPLATE_FILE, OUTPUT_DIR)
        print(f"✅ {name} 단원 완료")
