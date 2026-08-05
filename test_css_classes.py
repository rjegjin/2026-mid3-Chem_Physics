#!/usr/bin/env python3
"""HTML이 쓰는 Tailwind 클래스가 실제로 CSS에 존재하는지 검사.

cdn.tailwindcss.com은 브라우저에서 클래스를 즉석 생성했지만, 정적 빌드로 옮긴
뒤에는 빌드 시점에 스캔되지 않은 클래스가 조용히 사라진다. 그래서 새 클래스를
추가하고 `make css`를 잊으면 스타일이 통째로 빠진다.

이 검사는 그 사고와 함께, 원래부터 존재하지 않던 오타 클래스도 잡는다.
2026-08 시점에 `bg-slate-90`(→900) 계열 오타가 16개 파일 약 130곳에 있었고,
`bg-slate-90 text-white`는 흰 배경에 흰 글씨라 텍스트가 보이지 않았다.

주의: 셀렉터 비교는 반드시 경계까지 봐야 한다. 단순 substring 비교를 쓰면
`.text-slate-90`이 `.text-slate-900`에 매치돼 오타를 전부 놓친다.

실행: python3 test_css_classes.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
BUILT = ROOT / "css" / "tailwind.build.css"

# Tailwind 유틸리티로 보이는 토큰만 검사한다. 프로젝트 고유 클래스
# (slide-content, quiz-btn, case-card …)는 대상이 아니다.
TAILWIND_SHAPED = re.compile(
    r"^(?:(?:sm|md|lg|xl|2xl|hover|focus|odd|even|focus-visible|group-hover):)*"
    r"(?:bg|text|border|rounded|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|"
    r"min|max|flex|grid|gap|items|justify|self|col|row|space|font|leading|tracking|"
    r"shadow|opacity|z|top|left|right|bottom|inset|object|overflow|ring|animate|"
    r"uppercase|lowercase|capitalize|italic|underline|truncate|absolute|relative|"
    r"fixed|sticky|block|inline|hidden|transition|transform|translate|scale|rotate|"
    r"order|aspect|backdrop|decoration)(?:-|$)"
)


def escape_for_selector(cls):
    return "".join("\\" + ch if ch in ":/.[]()%#!," else ch for ch in cls)


def main():
    if not BUILT.exists():
        print(f"FAIL: {BUILT} 없음 — `make css`로 생성할 것")
        return 1

    css = BUILT.read_text(encoding="utf-8")
    for path in (ROOT / "css").glob("*.css"):
        if path.name != BUILT.name:
            css += "\n" + path.read_text(encoding="utf-8")

    htmls = {p: p.read_text(encoding="utf-8") for p in ROOT.glob("*.html")}
    for text in htmls.values():  # 파일 내부 <style> 블록도 정의로 인정
        css += "\n" + "\n".join(re.findall(r"<style>(.*?)</style>", text, re.S))

    used = {}
    for path, text in htmls.items():
        for attr in re.findall(r'class=["\']([^"\']*)["\']', text):
            for token in attr.split():
                if token:
                    used.setdefault(token, set()).add(path.name)

    missing = {}
    for cls, files in used.items():
        if not TAILWIND_SHAPED.match(cls):
            continue
        # (?![\w\-]) 가 핵심 — 이게 없으면 -90 오타가 -900 에 묻힌다
        if not re.search(r"\." + re.escape(escape_for_selector(cls)) + r"(?![\w\-])", css):
            missing[cls] = files

    checked = sum(1 for c in used if TAILWIND_SHAPED.match(c))
    if missing:
        print(f"FAIL — Tailwind 클래스 {checked}개 중 {len(missing)}종이 CSS에 없다")
        print("  (오타이거나, 새 클래스를 추가하고 `make css`를 안 돌렸거나)")
        for cls, files in sorted(missing.items(), key=lambda kv: -len(kv[1])):
            shown = ", ".join(sorted(files)[:4])
            more = "…" if len(files) > 4 else ""
            print(f"  - {cls:24} {len(files)}개 파일 ({shown}{more})")
        return 1

    print(f"OK — Tailwind 클래스 {checked}개 전부 CSS에 존재")
    return 0


if __name__ == "__main__":
    sys.exit(main())
