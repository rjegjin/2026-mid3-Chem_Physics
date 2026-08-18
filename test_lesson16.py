#!/usr/bin/env python3
"""16강 구조·수치 검사.

애플릿 2는 '전력 × 시간 = 전력량'을 면적으로 보여주는 것이 전부이므로,
프리셋 짝의 산술이 틀리면 수업의 결론(1800 W×10분 = 50 W×6시간 = 300 Wh)이
무너진다. 슬라이드 인덱스도 슬라이드 엔진이 그대로 신뢰하는 값이라 검사한다.

실행: python3 test_lesson16.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
HTML = (ROOT / "16_electric_power.html").read_text(encoding="utf-8")
JS = (ROOT / "js" / "16_electric_power.js").read_text(encoding="utf-8")
ENGINE = (ROOT / "js" / "slide_engine.js").read_text(encoding="utf-8")

fail = []


def check(cond, msg):
    if not cond:
        fail.append(msg)


# 1. 슬라이드 18장, 인덱스는 0부터 연속
idx = [int(m) for m in re.findall(r'data-slide-index="(\d+)"', HTML)]
check(idx == list(range(18)), f"슬라이드 인덱스가 0..17 연속이 아니다: {idx}")

# 2. 두 애플릿 컨테이너가 살아 있다
for el in ("ap1-products", "ap1-outputs", "ap1-check", "ap1-reset",
           "ap2-power", "ap2-time", "meter-rect", "ap2-presets"):
    check(f'id="{el}"' in HTML, f"애플릿 요소 #{el} 없음")

# 3. 프리셋 짝의 전력량 산술 — 같은 전력량/도입 문제는 A와 B가 같아야 한다
presets = re.findall(
    r"name: '([^']+)', a: \[(\d+), (\d+)\], b: \[(\d+), (\d+)\]", JS)
check(len(presets) == 4, f"프리셋이 4개가 아니다: {len(presets)}")
by_name = {}
for name, aw, am, bw, bm in presets:
    a_wh = int(aw) * int(am) / 60
    b_wh = int(bw) * int(bm) / 60
    by_name[name] = (a_wh, b_wh)

check(by_name.get("도입 문제") == (300.0, 300.0),
      f"도입 문제 프리셋이 300 Wh 짝이 아니다: {by_name.get('도입 문제')}")
check(by_name["같은 전력량"][0] == by_name["같은 전력량"][1],
      f"'같은 전력량' 프리셋의 두 값이 다르다: {by_name['같은 전력량']}")
check(by_name["같은 시간"][0] < by_name["같은 시간"][1],
      "'같은 시간' 프리셋은 전력이 큰 쪽의 전력량이 커야 한다")
check(by_name["같은 전력"][0] < by_name["같은 전력"][1],
      "'같은 전력' 프리셋은 오래 쓴 쪽의 전력량이 커야 한다")

# 4. 슬라이더 step이 프리셋 값을 표현할 수 있어야 한다 (step 10분에 6분은 못 넣는다)
step = int(re.search(r'id="ap2-time"[^>]*step="(\d+)"', HTML).group(1))
for name, aw, am, bw, bm in presets:
    check(int(am) % step == 0, f"프리셋 '{name}'의 시간 {am}분이 슬라이더 step {step}의 배수가 아니다")

# 5. 슬라이드 엔진: 입력 요소 포커스 시 이동 단축키를 무시한다
check('[role="slider"]' in ENGINE and "return;" in ENGINE,
      "slide_engine.js에 입력 포커스 예외 처리가 없다 — 슬라이더 조작이 슬라이드를 넘긴다")

# 6. 엔진이 섹션 innerHTML을 무조건 다시 쓰면 애플릿 리스너가 전부 죽는다
check("if (!sec.innerHTML.includes('**')) return;" in ENGINE,
      "slide_engine.js가 모든 섹션의 innerHTML을 다시 쓴다 — 애플릿 이벤트 리스너가 사라진다")
check("DOMContentLoaded" in JS,
      "16강 애플릿이 DOMContentLoaded 전에 리스너를 붙인다 — 엔진 init이 그 리스너를 날릴 수 있다")

# 7. 삭제하기로 한 서술이 돌아오지 않았는지
check("약 5%만" not in HTML, "출처 없는 '약 5%만 빛' 수치가 본문에 남아 있다")
check("전류 전쟁" not in HTML, "전류 전쟁 카드가 본문에 남아 있다 (부록 대상)")

if fail:
    print("FAIL")
    for f in fail:
        print(" -", f)
    sys.exit(1)
print(f"OK: 슬라이드 {len(idx)}장, 프리셋 {len(presets)}개 검증")
