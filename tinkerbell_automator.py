import os
import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

def automate_quiz_creation():
    # 1. 환경 설정
    CHROME_DRIVER_PATH = "/usr/bin/chromedriver"  # Lubuntu 환경 확인 필요
    QUIZ_CSV = "/home/rjegj/projects/2026-mid3-Chem_Physics/tinkerbell_quizzes.csv"
    
    if not os.path.exists(QUIZ_CSV):
        print(f"❌ CSV 파일을 찾을 수 없습니다: {QUIZ_CSV}")
        return

    # 2. 데이터 로드
    df = pd.read_csv(QUIZ_CSV)
    print(f"📊 로드된 퀴즈 데이터: {len(df)}개")

    # 3. 브라우저 실행
    chrome_options = Options()
    # chrome_options.add_argument("--headless") # 필요 시 활성화
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 15)

    try:
        # 4. 팅커벨 로그인 페이지 접속
        print("🔗 팅커벨 접속 중...")
        driver.get("https://www.tkbell.co.kr/user/login.do")
        
        print("\n⚠️  [수동 작업 필요]")
        print("1. 브라우저에서 로그인을 진행해주세요.")
        print("2. '퀴즈 만들기' -> '새 퀴즈' 페이지까지 이동해주세요.")
        input(">>> 준비가 되었으면 Enter를 누르세요...")

        # 5. 문제 입력 루프
        for idx, row in df.iterrows():
            print(f"\n📝 문제 {idx+1} 입력 중: {row['질문'][:20]}...")
            
            # 유형 판별 (OX, 객관식, 단답형)
            q_type = str(row['유형']).strip()
            
            try:
                # [문제 추가 버튼 클릭] - 실제 사이트의 버튼 ID/Class 확인 필요
                # 여기서는 시뮬레이션 로그만 남기고, 실제 연동 시 아래 주석 해제하여 사용
                
                if q_type == "OX":
                    print(f"  > [OX 퀴즈] 정답: {row['정답']}")
                    # TODO: driver.find_element(By.ID, "ox_btn").click()
                elif "객관식" in q_type:
                    print(f"  > [객관식] 보기: {row['보기']}")
                    # TODO: driver.find_element(By.ID, "choice_btn").click()
                else:
                    print(f"  > [단답형] 정답: {row['정답']}")
                    # TODO: driver.find_element(By.ID, "short_btn").click()

                # 공통 질문 입력
                # driver.find_element(By.ID, "question_area").send_keys(row['질문'])
                
                # 해설 입력
                if pd.notna(row['해설']):
                    print(f"  > 해설 포함: {row['해설'][:15]}...")
                    # driver.find_element(By.ID, "comment_area").send_keys(row['해설'])

                time.sleep(1) # 입력 안정성을 위한 대기
                
            except Exception as e:
                print(f"  ⚠️ 문제 {idx+1} 입력 중 오류 발생: {e}")

        print("\n✅ 모든 퀴즈 데이터의 입력 시뮬레이션이 완료되었습니다.")
        print("실제 사이트의 HTML 구조(XPath/Selector)가 확정되면 위 코드를 즉시 실전용으로 전환할 수 있습니다.")

    finally:
        print("\n브라우저를 닫으려면 Enter를 누르세요.")
        input()
        driver.quit()

if __name__ == "__main__":
    automate_quiz_creation()
