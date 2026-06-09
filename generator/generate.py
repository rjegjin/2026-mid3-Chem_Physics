import json
import os
import glob
import re
from jinja2 import Template

# 이미지 뱅크 경로 설정
IMAGE_BANK_DIR = "2026-mid3-Chem_Physics/generator/data/bank/images"

def get_image_map():
    """이미지 뱅크를 스캔하여 키워드와 파일명 매핑 딕셔너리 생성"""
    image_map = {}
    if not os.path.exists(IMAGE_BANK_DIR):
        return image_map
    
    for f in os.listdir(IMAGE_BANK_DIR):
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg')):
            # 파일명 자체를 키워드로 등록 (확장자 제외)
            name_key = os.path.splitext(f)[0]
            image_map[name_key] = f
    return image_map

IMAGE_MAP = get_image_map()

def process_content_tags(text, teacher_mode):
    """
    [[정답]] 패턴과 [[image:키워드]] 패턴을 모두 처리합니다.
    """
    if not text:
        return ""
    
    # 1. 이미지 태그 처리: [[image:키워드]] 또는 [[image:키워드|캡션]]
    img_pattern = r'\[\[image:(.*?)\]\]'
    def img_replace(match):
        content = match.group(1)
        parts = content.split('|')
        keyword = parts[0].strip()
        caption = parts[1].strip() if len(parts) > 1 else ""
        
        # 이미지 맵에서 검색 (부분 일치 지원)
        found_file = None
        if keyword in IMAGE_MAP:
            found_file = IMAGE_MAP[keyword]
        else:
            # 키워드가 파일명에 포함된 경우 탐색
            for k in IMAGE_MAP:
                if keyword in k:
                    found_file = IMAGE_MAP[k]
                    break
        
        if found_file:
            # 웹 경로로 변환 (worksheets 폴더 기준 상대 경로)
            web_path = f"../generator/data/bank/images/{found_file}"
            cap_html = f'<p class="img-caption">{caption}</p>' if caption else ""
            return f'<div class="img-container"><img src="{web_path}" alt="{keyword}">{cap_html}</div>'
        else:
            return f'<span class="img-error">[Image Not Found: {keyword}]</span>'

    text = re.sub(img_pattern, img_replace, text)

    # 2. 정답 태그 처리: [[정답]]
    ans_pattern = r'\[\[(.*?)\]\]'
    def ans_replace(match):
        ans_content = match.group(1)
        if teacher_mode:
            return f'<span class="ans-text">{ans_content}</span>'
        else:
            return '<span class="ans-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'

    return re.sub(ans_pattern, ans_replace, text)

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
            section['summary'] = process_content_tags(section.get('summary', ''), is_teacher)
            if 'contents' in section:
                for item in section['contents']:
                    item['text'] = process_content_tags(item.get('text', ''), is_teacher)
                    if 'explore' in item:
                        item['explore'] = process_content_tags(item['explore'], is_teacher)
                    if 'sub_items' in item:
                        item['sub_items'] = [process_content_tags(sub, is_teacher) for sub in item['sub_items']]
                    if 'table' in item:
                        item['table']['rows'] = [[process_content_tags(td, is_teacher) for td in row] for row in item['table']['rows']]
        
        # 퀴즈 섹션 정답 처리
        if 'quizzes' in processed_data:
            for q in processed_data['quizzes']:
                q['question'] = process_content_tags(q['question'], is_teacher)
                if 'box' in q:
                    q['box'] = [process_content_tags(line, is_teacher) for line in q['box']]
                if 'choices' in q:
                    q['choices'] = [process_content_tags(ch, is_teacher) for ch in q['choices']]
        
        html_content = template.render(data=processed_data, teacher_mode=is_teacher)
        output_file = os.path.join(output_dir, f"{base_name}_{mode}.html")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
    
    return base_name

def generate_exams(json_path, template_path, output_dir):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'quizzes' not in data:
        return None
        
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    template = Template(template_content)
    base_name = os.path.splitext(os.path.basename(json_path))[0].split('_')[0]
    
    for mode in ["student", "teacher"]:
        is_teacher = (mode == "teacher")
        # 퀴즈 전용 데이터 가공
        questions = []
        for q in data['quizzes']:
            q_proc = json.loads(json.dumps(q))
            q_proc['question'] = process_content_tags(q_proc['question'], is_teacher)
            if 'box' in q_proc:
                q_proc['box'] = [process_content_tags(line, is_teacher) for line in q_proc['box']]
            if 'choices' in q_proc:
                q_proc['choices'] = [process_content_tags(ch, is_teacher) for ch in q_proc['choices']]
            q_proc['correct_answer'] = process_content_tags(str(q_proc['correct_answer']), True) # 정답은 항상 공개용으로 처리 후 ans-key에서 제어
            questions.append(q_proc)
            
        exam_title = f"{data['lesson_info']['lesson_id']} 미니 퀴즈 ({'교사용' if is_teacher else '학생용'})"
        
        html_content = template.render(
            exam_title=exam_title,
            questions=questions,
            teacher_mode=is_teacher
        )
        
        exam_dir = os.path.join(output_dir, "exams")
        if not os.path.exists(exam_dir):
            os.makedirs(exam_dir)
            
        output_file = os.path.join(exam_dir, f"mini_quiz_{base_name}_{mode}.html")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
    return base_name

if __name__ == "__main__":
    # 경로 설정 (실행 위치에 상관없이 작동하도록 절대경로 권장하나 여기선 상대경로 유지)
    BASE_DIR = "2026-mid3-Chem_Physics/generator"
    JSON_FILES = glob.glob(os.path.join(BASE_DIR, "data/lessons/*.json"))
    WS_TEMPLATE = os.path.join(BASE_DIR, "templates/worksheet_template.html")
    EXAM_TEMPLATE = os.path.join(BASE_DIR, "templates/exam_template.html")
    OUTPUT_DIR = "2026-mid3-Chem_Physics/worksheets"
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"🚀 [통합 빌드 시스템] 학습지 및 미니 퀴즈 자동 생성 시작")
    for json_f in sorted(JSON_FILES):
        # 1. 학습지 생성
        ws_name = generate_worksheets(json_f, WS_TEMPLATE, OUTPUT_DIR)
        # 2. 미니 퀴즈 생성
        exam_name = generate_exams(json_f, EXAM_TEMPLATE, OUTPUT_DIR)
        
        status = f"WS: ✅ | Exam: {'✅' if exam_name else '❌'}"
        print(f"  > 단원 {ws_name}: {status}")
    
    print(f"\n✨ 모든 빌드 작업이 완료되었습니다. (출력: {OUTPUT_DIR})")
