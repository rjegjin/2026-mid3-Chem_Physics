#!/usr/bin/env python3
"""형성평가 퀴즈 무결성 검사.

2026-08: 11~15강이 인라인 checkAnswer()를 쓰면서 오답에도 "✅ 정답!" 해설이
그대로 노출되는 버그가 있었다. 인라인 핸들러를 걷어내고 js/slide_engine.js의
setupQuiz() 하나로 통일했으므로, 그 상태가 유지되는지 확인한다.

실행: python3 test_quiz_integrity.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
ENGINE = ROOT / "js" / "slide_engine.js"

failures = []


def check(condition, message):
    if not condition:
        failures.append(message)


# --- 1. 퀴즈 채점은 공용 엔진만 담당한다 ---------------------------------
for html in sorted(ROOT.glob("*.html")):
    text = html.read_text(encoding="utf-8")
    check(
        'onclick="checkAnswer' not in text,
        f"{html.name}: 인라인 onclick=checkAnswer 복귀 — 오답에도 정답 해설이 뜬다",
    )
    check(
        "function checkAnswer" not in text,
        f"{html.name}: 인라인 checkAnswer() 정의 복귀 — slide_engine.js와 충돌한다",
    )

engine = ENGINE.read_text(encoding="utf-8")
check(
    "hasAttribute('onclick')" not in engine,
    "slide_engine.js: onclick 감지 시 조기 return 하는 분기가 되살아났다",
)
check(
    "defaultFeedback" in engine.split("classList.add('wrong'")[-1][:400],
    "slide_engine.js: 오답 분기가 해설(defaultFeedback)을 더 이상 보여주지 않는다",
)

# --- 2. 각 퀴즈는 정답 1개 + 해설 1개를 갖는다 ---------------------------
CONTAINER = re.compile(
    r'class="[^"]*\bquiz-container\b[^"]*"(.*?)(?=class="[^"]*\bquiz-container\b|</main>)',
    re.S,
)
total = 0
warnings = []
for html in sorted(ROOT.glob("*.html")):
    text = html.read_text(encoding="utf-8")
    if "quiz-container" not in text:
        continue
    for idx, block in enumerate(CONTAINER.findall(text), start=1):
        total += 1
        correct = block.count('data-correct="true"')
        options = block.count('data-correct=')
        check(
            correct >= 1,
            f"{html.name} 퀴즈 {idx}: 정답이 없다 — 무엇을 눌러도 오답 처리된다",
        )
        if correct > 1:
            # setupQuiz()는 첫 클릭에 모든 선택지를 잠그는 단일 선택 UI다.
            # 다중 정답 문항은 학생이 정답 하나만 고르고 끝난다 — 교사 판단 필요.
            warnings.append(
                f"{html.name} 퀴즈 {idx}: 정답 {correct}개인데 UI는 단일 선택"
            )
        check(
            options >= 2,
            f"{html.name} 퀴즈 {idx}: 선택지가 {options}개 (2개 이상이어야 함)",
        )
        check(
            "quiz-feedback" in block,
            f"{html.name} 퀴즈 {idx}: .quiz-feedback 해설 블록이 없다",
        )

check(total > 0, "퀴즈를 하나도 찾지 못했다 — 셀렉터가 바뀌었는지 확인할 것")

for w in warnings:
    print(f"WARN  {w}")

if failures:
    print(f"FAIL ({len(failures)}건)")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)

print(f"OK — 퀴즈 {total}개, 인라인 핸들러 0개, 공용 엔진 단일 경로")
