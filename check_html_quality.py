#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib import error, request


ROOT = Path(__file__).resolve().parent
DEFAULT_GLOB = [
    "7_physics_intro.html",
    "8_uniform_motion.html",
    "9_free_fall.html",
    "10_work_energy.html",
    "11_potential_energy.html",
    "12_kinetic_energy.html",
    "13_mechanical_energy.html",
    "14_energy_conservation.html",
    "15_electromagnetic_induction.html",
    "16_electric_power.html",
    "17_energy_chain_review.html",
    "review_motion_energy.html",
    "lecture_notes.html",
    "index.html",
    "adv_inorganic/*.html",
]

FORMULA_TOKENS = (
    "½",
    "√",
    "²",
    "E<sub>p</sub>",
    "E<sub>k</sub>",
    "v = gt",
    "d = ½gt²",
    "W = F × d",
    "E<sub>p</sub> = mgh",
    "E<sub>k</sub> = ½mv²",
)

SUSPICIOUS_FORMULA_PATTERNS = [
    (re.compile(r"(?<![A-Za-z])d\s*=\s*gt²"), "possible missing ½ in free-fall distance"),
    (re.compile(r"(?<![A-Za-z])Ek\s*=\s*mv²"), "possible missing ½ in kinetic energy"),
    (re.compile(r"(?<![A-Za-z])Ep\s*=\s*gh"), "possible missing mass in potential energy"),
]


@dataclass
class Issue:
    severity: str
    file: Path
    detail: str


@dataclass
class ParsedHtml:
    refs: list[tuple[str, str, int]]
    imgs: list[tuple[str, int]]
    iframes: list[tuple[str, int]]
    sections: list[tuple[str, str, int]]
    ids: dict[str, int] = field(default_factory=dict)


class RefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[str, str, int]] = []
        self.imgs: list[tuple[str, int]] = []
        self.iframes: list[tuple[str, int]] = []
        self.sections: list[tuple[str, str, int]] = []
        self.ids: dict[str, int] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        line = self.getpos()[0]
        for key in ("src", "href"):
            value = attr_map.get(key)
            if value:
                self.refs.append((key, value, line))
        if tag == "img" and attr_map.get("src"):
            self.imgs.append((attr_map["src"], line))
        if tag == "iframe" and attr_map.get("src"):
            self.iframes.append((attr_map["src"], line))
        if tag == "section":
            self.sections.append(
                (attr_map.get("data-slide-num", ""), attr_map.get("data-title", ""), line)
            )
        if "id" in attr_map and attr_map["id"]:
            self.ids[attr_map["id"]] = line


def is_remote(url: str) -> bool:
    return url.startswith(("http://", "https://"))


def is_skippable(url: str) -> bool:
    return url.startswith(("#", "mailto:", "tel:", "javascript:", "data:"))


def parse_html(path: Path) -> ParsedHtml:
    parser = RefParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return ParsedHtml(
        refs=parser.refs,
        imgs=parser.imgs,
        iframes=parser.iframes,
        sections=parser.sections,
        ids=parser.ids,
    )


def resolve_local_ref(base: Path, ref: str) -> Path:
    clean = ref.split("#", 1)[0].split("?", 1)[0]
    return (base.parent / clean).resolve()


def probe_remote(url: str, timeout: float) -> tuple[bool, str]:
    # Wikimedia는 UA 정책상 연락처 없는 일반 UA에 429를 준다. 살아 있는 이미지가
    # 매번 ERROR로 잡히던 원인이라 정책에 맞는 UA를 쓰고, 429도 GET으로 재시도한다.
    headers = {
        "User-Agent": (
            "2026-mid3-Chem_Physics-link-check/1.1 "
            "(https://github.com/rjegjin/2026-mid3-Chem_Physics)"
        )
    }
    req = request.Request(url, headers=headers, method="HEAD")
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            return True, f"HTTP {resp.status}"
    except error.HTTPError as exc:
        if exc.code in (403, 405, 429):
            try:
                req = request.Request(url, headers=headers, method="GET")
                with request.urlopen(req, timeout=timeout) as resp:
                    return True, f"HTTP {resp.status}"
            except Exception as inner_exc:  # noqa: BLE001
                return False, f"{type(inner_exc).__name__}: {inner_exc}"
        return False, f"HTTPError {exc.code}"
    except Exception as exc:  # noqa: BLE001
        return False, f"{type(exc).__name__}: {exc}"


def gather_files(root: Path, patterns: Iterable[str]) -> list[Path]:
    files: list[Path] = []
    for pattern in patterns:
        if any(ch in pattern for ch in "*?[]"):
            files.extend(sorted(root.glob(pattern)))
        else:
            files.append(root / pattern)
    return [f for f in files if f.exists()]


def check_file(path: Path, remote_cache: dict[str, tuple[bool, str]], timeout: float) -> list[Issue]:
    issues: list[Issue] = []
    text = path.read_text(encoding="utf-8")
    parsed = parse_html(path)

    if text.count("<section") != text.count("</section>"):
        issues.append(Issue("ERROR", path, "mismatched <section> tags"))

    # 파일명 앞 두 자가 숫자면 차시 슬라이드로 본다. adv_inorganic/은 01.html처럼
    # 이름이 겹치지만 data-slide-* 대신 <section id="sN">을 쓰는 다른 문서형이다.
    is_slide_deck = path.parent.name != "adv_inorganic" and path.name[0:2].rstrip("_").isdigit()
    seen_slide_nums: set[str] = set()
    for slide_num, title, line in parsed.sections:
        if slide_num and slide_num in seen_slide_nums:
            issues.append(Issue("WARN", path, f"duplicate data-slide-num '{slide_num}' near line {line}"))
        seen_slide_nums.add(slide_num)
        if is_slide_deck and (not slide_num or not title):
            issues.append(Issue("WARN", path, f"section missing slide metadata near line {line}"))

    for attr, ref, line in parsed.refs:
        if is_skippable(ref):
            continue
        if is_remote(ref):
            if ref not in remote_cache:
                remote_cache[ref] = probe_remote(ref, timeout)
            ok, detail = remote_cache[ref]
            if not ok:
                issues.append(Issue("ERROR", path, f"remote {attr} failed at line {line}: {ref} ({detail})"))
            continue

        target = resolve_local_ref(path, ref)
        if not target.exists():
            issues.append(Issue("ERROR", path, f"missing local {attr} at line {line}: {ref}"))

    if path.name.startswith(tuple(str(i) for i in range(7, 16))) or path.name == "review_motion_energy.html":
        if "MathJax-script" in text and "\\(" not in text and "\\[" not in text:
            issues.append(Issue("WARN", path, "MathJax loaded but TeX delimiters were not found"))

    # 역학 공식(E_p, ½gt² …)을 요구하는 규칙이다. 전자기·전기 에너지·종합 복습
    # 차시는 그 공식을 쓰지 않는 것이 정상이므로 면제한다.
    NO_MECHANICS_FORMULA = {
        "7_physics_intro.html", "index.html",
        "15_electromagnetic_induction.html",
        "16_electric_power.html",
        "17_energy_chain_review.html",
        # 천체·전자기 유도 차시는 역학 공식을 쓰지 않는다
        "18_stars.html",
        "19_milky_way.html",
        "exp_self_generation.html",
        "18_appendix.html",
    }
    # 고급 무기화학 계열은 역학 차시가 아니다. 모듈이 늘 때마다 이름을 더하지
    # 않도록 폴더 단위로 면제한다.
    if path.parent.name == "adv_inorganic":
        pass
    elif path.name not in NO_MECHANICS_FORMULA:
        for token in FORMULA_TOKENS:
            if token in text:
                break
        else:
            issues.append(Issue("WARN", path, "expected formula tokens not found"))

    for pattern, message in SUSPICIOUS_FORMULA_PATTERNS:
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            context = text[max(0, match.start() - 120): min(len(text), match.end() + 120)]
            if any(token in context for token in ("오개념", "오류", "틀리", "누락", "혼용", "주의")):
                continue
            issues.append(Issue("WARN", path, f"{message} near line {line}: '{match.group(0)}'"))

    if "<sub>" in text and "</sub>" not in text:
        issues.append(Issue("ERROR", path, "found <sub> without closing </sub>"))
    if "<sup>" in text and "</sup>" not in text:
        issues.append(Issue("ERROR", path, "found <sup> without closing </sup>"))

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Check HTML slides for broken refs and suspicious formulas.")
    parser.add_argument("patterns", nargs="*", default=DEFAULT_GLOB, help="Files or glob patterns relative to repo root")
    parser.add_argument("--timeout", type=float, default=8.0, help="Remote URL timeout in seconds")
    args = parser.parse_args()

    files = gather_files(ROOT, args.patterns)
    if not files:
        print("No files matched.", file=sys.stderr)
        return 2

    remote_cache: dict[str, tuple[bool, str]] = {}
    issues: list[Issue] = []
    for path in files:
        issues.extend(check_file(path, remote_cache, args.timeout))

    errors = [i for i in issues if i.severity == "ERROR"]
    warns = [i for i in issues if i.severity == "WARN"]

    print(f"Scanned {len(files)} files")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warns)}")
    for issue in issues:
        rel = issue.file.relative_to(ROOT)
        print(f"{issue.severity}: {rel}: {issue.detail}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
