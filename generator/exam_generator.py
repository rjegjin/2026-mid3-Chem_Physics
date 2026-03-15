import json
import os
import random
from jinja2 import Template

def load_bank(bank_path):
    with open(bank_path, 'r', encoding='utf-8') as f:
        return json.load(f)['questions']

def generate_exam(bank_path, template_path, output_dir, config):
    """
    config = {
        "title": "2026학년도 1학기 중간고사 대비 쪽지시험",
        "units": ["1. 물질 변화와 화학반응식", "2. 화학 반응의 규칙"],
        "count": 10,
        "filename": "midterm_mini_01"
    }
    """
    all_questions = load_bank(bank_path)
    
    # 1. 단원 필터링
    filtered = [q for q in all_questions if q['unit'] in config['units']]
    
    # 2. 개수만큼 랜덤 추출
    count = min(len(filtered), config['count'])
    selected = random.sample(filtered, count)
    
    # 3. 템플릿 렌더링
    with open(template_path, 'r', encoding='utf-8') as f:
        template = Template(f.read())
    
    for mode in ["student", "teacher"]:
        is_teacher = (mode == "teacher")
        html = template.render(
            exam_title=config['title'],
            questions=selected,
            teacher_mode=is_teacher
        )
        
        output_file = os.path.join(output_dir, f"{config['filename']}_{mode}.html")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
            
    print(f"✅ 시험지 생성 완료: {config['filename']}_student/teacher.html (문제 수: {count})")

if __name__ == "__main__":
    BASE_DIR = "2026-mid3-Chem_Physics/generator"
    BANK_FILE = os.path.join(BASE_DIR, "data/bank/question_bank.json")
    TEMPLATE_FILE = os.path.join(BASE_DIR, "templates/exam_template.html")
    OUTPUT_DIR = "2026-mid3-Chem_Physics/worksheets/exams"
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    # 시험지 생성 설정
    exam_config = {
        "title": "제1회 과학(화학) 심화 쪽지 시험",
        "units": ["1. 물질 변화와 화학반응식", "2. 화학 반응의 규칙"],
        "count": 4, # 현재 뱅크에 4문제 있으므로 4개 추출
        "filename": "mini_quiz_01"
    }
    
    generate_exam(BANK_FILE, TEMPLATE_FILE, OUTPUT_DIR, exam_config)
