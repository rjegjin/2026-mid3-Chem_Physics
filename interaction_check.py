#!/usr/bin/env python3
"""16강 애플릿이 실제로 클릭에 반응하는지 브라우저에서 확인한다.

정적 검사(make check)와 render_check.py는 '렌더는 되지만 버튼이 죽어 있는' 상태를
잡지 못한다. 실제로 그런 일이 있었다: slide_engine.js가 init에서 모든 섹션의
innerHTML을 다시 대입해, 그 전에 붙인 이벤트 리스너를 전부 날렸다.

실행: unified_venv/bin/python interaction_check.py
필요: selenium (unified_venv에 설치됨), chromium
"""
import functools
import http.server
import shutil
import sys
import threading

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

PORT = 8942
BASE = f"http://127.0.0.1:{PORT}"
URL = f"{BASE}/16_electric_power.html?view=all"
FULL_TARGET = "16_electric_power.html"   # 애플릿 검사는 이 차시 전용이다

fails = []


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=".")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    server.log_message = lambda *a, **k: None
    threading.Thread(target=server.serve_forever, daemon=True).start()


def browser():
    opts = Options()
    for arg in ("--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=1440,900"):
        opts.add_argument(arg)
    binary = shutil.which("chromium") or shutil.which("chromium-browser")
    if binary:
        opts.binary_location = binary
    return webdriver.Chrome(options=opts)



def check_common(drv, page):
    """차시와 무관하게 lesson_patterns.js가 제공하는 패턴이 살아 있는지 본다.
    새 차시를 만들 때마다 검사기를 새로 쓰지 않기 위한 최소 공통 검사."""
    drv.get(f"{BASE}/{page}?view=all")
    tag = f"[{page}]"

    if drv.execute_script("return !!document.querySelector('[data-poll]')"):
        drv.execute_script("document.querySelector('[data-poll] button').click()")
        if drv.execute_script(
                "return document.querySelector('[data-poll] button').getAttribute('aria-pressed')") != "true":
            fails.append(f"{tag} 예상 버튼이 눌린 상태를 표시하지 않는다")
        echo = drv.execute_script(
            "const p=document.querySelector('[data-poll]');"
            "const e=document.getElementById(p.id+'-echo');return e?e.textContent:''")
        if "기록됨" not in echo:
            fails.append(f"{tag} 예상 선택이 기록되지 않는다: {echo!r}")

    if drv.execute_script("return !!document.querySelector('.rule-blank')"):
        out = drv.find_element(By.ID, "rule-feedback")
        hint = drv.execute_script("return document.getElementById('rule-feedback').dataset.hint")
        drv.execute_script(
            "document.querySelector('.rule-blank button[data-correct=\"false\"]').click()")
        if hint and out.text != hint:
            fails.append(f"{tag} 규칙 오답에 되묻는 피드백이 없다: {out.text!r}")
        drv.execute_script(
            "document.querySelectorAll('.rule-blank').forEach("
            "b => b.querySelector('button[data-correct=\"true\"]').click())")
        done = drv.execute_script("return document.getElementById('rule-feedback').dataset.done")
        if done and out.text != done:
            fails.append(f"{tag} 규칙을 모두 맞혀도 완성 피드백이 없다: {out.text!r}")

    quiz = drv.execute_script(
        "const b=document.querySelector('.quiz-btn[data-correct=\"true\"]');"
        "if(!b) return null; b.click();"
        "return getComputedStyle(b.closest('.quiz-container').querySelector('.quiz-feedback')).display")
    if quiz == "none":
        fails.append(f"{tag} 퀴즈 정답을 눌러도 해설이 나오지 않는다")

    severe = [l for l in drv.get_log("browser")
              if l["level"] == "SEVERE" and "favicon" not in l["message"]]
    if severe:
        fails.append(f"{tag} console error: {severe}")


def main():
    serve()
    drv = browser()
    try:
        drv.get(URL)

        # --- 애플릿 1: 제품 선택 → 에너지 복수 선택 → 확인 → 초기화 ---
        drv.execute_script(
            "[...document.querySelectorAll('#ap1-products button')]"
            ".find(b => b.textContent === '선풍기').click()")
        if "선풍기" not in drv.find_element(By.ID, "ap1-feedback").text:
            fails.append("제품 버튼 클릭에 반응이 없다")

        drv.execute_script(
            "[...document.querySelectorAll('#ap1-outputs button')]"
            ".find(b => b.textContent === '운동').click()")
        pressed = drv.execute_script(
            "return [...document.querySelectorAll('#ap1-outputs button')]"
            ".filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent)")
        if pressed != ["운동"]:
            fails.append(f"에너지 복수 선택이 동작하지 않는다: {pressed}")

        drv.find_element(By.ID, "ap1-check").click()
        feedback = drv.find_element(By.ID, "ap1-feedback").text
        if "소리" not in feedback or "관찰 증거" not in feedback:
            fails.append(f"확인 버튼이 피드백을 만들지 않는다: {feedback!r}")

        drv.find_element(By.ID, "ap1-reset").click()
        if "제품을 먼저" not in drv.find_element(By.ID, "ap1-feedback").text:
            fails.append("초기화 버튼이 동작하지 않는다")

        # --- 애플릿 2: 프리셋 → 표·수치·면적이 함께 움직인다 ---
        drv.execute_script(
            "[...document.querySelectorAll('#ap2-presets button')]"
            ".find(b => b.textContent === '도입 문제').click()")
        if "300 Wh" not in drv.find_element(By.ID, "ap2-energy").text:
            fails.append("프리셋 버튼이 전력량을 바꾸지 않는다")
        rows = drv.find_element(By.ID, "ap2-table").text.replace("\n", " ")
        if "A 1800 W" not in rows or "B 50 W" not in rows:
            fails.append(f"프리셋 비교표가 두 조건을 보여주지 않는다: {rows!r}")

        rect = drv.find_element(By.ID, "meter-rect")
        width = float(rect.get_attribute("width"))
        height = float(rect.get_attribute("height"))
        # 1800 W × 10분 — 픽셀은 값에 정확히 비례해야 한다
        if abs(width - 400 * 10 / 480) > 0.01 or abs(height - 220 * 1800 / 2000) > 0.01:
            fails.append(f"직사각형이 값에 비례하지 않는다: {width}x{height}")

        drv.execute_script(
            "const s = document.getElementById('ap2-power');"
            "s.value = 500; s.dispatchEvent(new Event('input'));")
        if drv.find_element(By.ID, "ap2-power-out").text != "500 W":
            fails.append("슬라이더 조작이 표시에 반영되지 않는다")

        # --- 도입 예상 버튼 ---
        drv.execute_script("document.querySelector('#intro-poll button').click()")
        if drv.execute_script(
                "return document.querySelector('#intro-poll button')"
                ".getAttribute('aria-pressed')") != "true":
            fails.append("예상 선택 버튼이 눌린 상태를 표시하지 않는다")

        # --- 3번 예상이 14번에서 회수되는가 ---
        if "드라이어" not in drv.find_element(By.ID, "poll-recall").text:
            fails.append("3번에서 고른 예상이 14번에 되돌아오지 않는다")

        # --- 13번 규칙 완성 ---
        drv.execute_script(
            "document.querySelector('[data-rule=\"rule1\"] button[data-correct=\"false\"]').click()")
        if "다시 봅시다" not in drv.find_element(By.ID, "rule-feedback").text:
            fails.append("규칙 오답에 되묻는 피드백이 없다")
        for rule in ("rule1", "rule2", "rule3"):
            drv.execute_script(
                f"document.querySelector('[data-rule=\"{rule}\"] button[data-correct=\"true\"]').click()")
        if "세 규칙이 완성" not in drv.find_element(By.ID, "rule-feedback").text:
            fails.append("세 규칙을 모두 맞혀도 완성 피드백이 나오지 않는다")

        # --- 공용 퀴즈 엔진 ---
        drv.execute_script(
            "document.querySelector('#slide-17 .quiz-btn[data-correct=\"true\"]').click()")
        if drv.execute_script(
                "return getComputedStyle(document.querySelector('#slide-17 .quiz-feedback'))"
                ".display") == "none":
            fails.append("퀴즈 정답을 눌러도 해설이 나오지 않는다")

        severe = [log for log in drv.get_log("browser")
                  if log["level"] == "SEVERE" and "favicon" not in log["message"]]
        if severe:
            fails.append(f"console error: {severe}")
        for page in (sys.argv[1:] or ["17_energy_chain_review.html"]):
            check_common(drv, page)
        drv.quit()
    except Exception:
        drv.quit()
        raise

    if fails:
        print("FAIL")
        for f in fails:
            print(" -", f)
        return 1
    print("OK — 16강 애플릿 1·2, 그리고 공용 패턴(예상·규칙·퀴즈)이 모두 클릭에 반응한다")
    return 0


if __name__ == "__main__":
    sys.exit(main())
