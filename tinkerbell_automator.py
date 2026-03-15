
import os
import time
import csv
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# ---------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUIZ_FILES = [f"lesson{i}_quiz.csv" for i in range(1, 7)]
TINKERBELL_URL = "https://www.tkbell.co.kr/"

# ---------------------------------------------------------------------
# SELENIUM SETUP
# ---------------------------------------------------------------------
def setup_driver():
    chrome_options = Options()
    # 크롬 프로필을 사용하고 싶다면 아래 주석을 해제하고 경로를 본인의 것으로 수정하세요.
    # chrome_options.add_argument(f"user-data-dir={os.path.expanduser('~')}/.config/google-chrome/Default")
    
    # 일반적인 상황에서는 새 창을 띄워 수동 로그인을 유도합니다.
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    return driver

def wait_and_click(driver, selector, by=By.CSS_SELECTOR, timeout=10):
    element = WebDriverWait(driver, timeout).until(EC.element_to_be_clickable((by, selector)))
    element.click()
    return element

def wait_and_send_keys(driver, selector, text, by=By.CSS_SELECTOR, timeout=10):
    element = WebDriverWait(driver, timeout).until(EC.presence_of_element_located((by, selector)))
    element.clear()
    element.send_keys(text)
    return element

# ---------------------------------------------------------------------
# MAIN AUTOMATION LOGIC
# ---------------------------------------------------------------------
def automate_quiz_creation():
    print("🚀 팅커벨 퀴즈 자동화 봇을 시작합니다.")
    driver = setup_driver()
    driver.get(TINKERBELL_URL)
    
    print("\n[STEP 1] 브라우저에서 팅커벨에 로그인해 주세요.")
    print("로그인이 완료되어 '만들기' 화면으로 이동할 준비가 되었다면 터미널에서 Enter를 눌러주세요.")
    input(">>> 로그인을 마쳤으면 Enter 키를 누르세요...")

    for quiz_file in QUIZ_FILES:
        file_path = os.path.join(BASE_DIR, quiz_file)
        if not os.path.exists(file_path):
            print(f"⚠️ 파일을 찾을 수 없습니다: {quiz_file}")
            continue

        print(f"\n[STEP 2] {quiz_file} 데이터 처리를 시작합니다.")
        
        # CSV 읽기 (utf-8-sig)
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            questions = list(reader)

        print(f"✅ 총 {len(questions)}개의 문제를 발견했습니다.")
        
        # 팅커벨 내비게이션 (여기서부터는 팅커벨 사이트의 실제 구조에 따라 셀렉터 수정이 필요함)
        print("💡 이제 팅커벨에서 '퀴즈 만들기'를 수동으로 시작해 주세요.")
        print("문제 입력 창이 활성화된 상태에서 'Enter'를 누르면 자동 입력을 시작합니다.")
        input(">>> 문제 입력 화면을 띄웠나요? 시작하려면 Enter...")

        for i, q in enumerate(questions):
            print(f"📝 {i+1}번 문제 입력 중: {q['질문'][:20]}...")
            
            # TODO: 실제 팅커벨 웹 요소의 셀렉터를 파악한 후 아래를 수정해야 합니다.
            # 팅커벨은 동적 요소가 많으므로 세밀한 조정이 필요합니다.
            
            # 예시 코드 (실제 작동을 위해서는 class/id 수정 필수):
            # 1. 질문 입력
            # wait_and_send_keys(driver, ".question-input-area", q['질문'])
            
            # 2. 유형 선택 (객관식/OX/단답형)
            # q_type = q['유형']
            
            # 3. 보기 입력 및 정답 체크
            # if q_type == '객관식':
            #     options = q['보기'].split(',')
            #     for idx, opt in enumerate(options):
            #         wait_and_send_keys(driver, f".option-{idx+1}", opt.strip())
            #     # 정답 체크
            #     wait_and_click(driver, f".correct-btn-{q['정답']}")
            
            # 4. 다음 문제 추가 버튼 클릭
            # wait_and_click(driver, ".add-question-btn")
            
            print(f"   - 데이터: {q}")
            print("   --- (현재는 화면 구조 분석이 필요하여 데이터만 출력합니다) ---")
            # time.sleep(1)

        print(f"\n🎉 {quiz_file} 입력 시뮬레이션 종료.")
        print("실제 웹 요소(Selectors) 정보가 확보되면 위 주석 처리된 코드를 활성화하여 완전 자동화가 가능합니다.")
        
    print("\n✅ 모든 작업이 끝났습니다. 브라우저를 닫으려면 아무 키나 누르세요.")
    input(">>> 종료하려면 Enter...")
    driver.quit()

if __name__ == "__main__":
    automate_quiz_creation()
