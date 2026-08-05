---
target: "https://rjegjin.github.io/2026-mid3-Chem_Physics/14_energy_conservation.html"
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-05T05-46-19Z
slug: 14-energy-conservation-html
---
Method: dual-agent (A: a01c2f312a5853dc9 · B: acd6823407a89054b)

Target: https://rjegjin.github.io/2026-mid3-Chem_Physics/14_energy_conservation.html
Resolved to source: 14_energy_conservation.html (paths outlive URLs)
Mode: Read — 중3 과학 수업용 슬라이드 13장

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 진행바·`n/13` 인디케이터 양호. 퀴즈 채점 결과가 보조기술에 전달되지 않음 |
| 2 | Match System / Real World | 3 | 한국어 교과 용어·일상 사례 자연스러움. Ep/Ek가 이 페이지에서 한 번도 풀어쓰이지 않음 |
| 3 | User Control and Freedom | 2 | Escape 미바인딩, 퀴즈 재시도 불가, 페이지 이동이 native `prompt()` |
| 4 | Consistency and Standards | 2 | 프로젝트가 스스로 선언한 디자인 표준 위반 + 퀴즈 로직 2벌 |
| 5 | Error Prevention | 2 | 클릭 즉시 확정, 되돌리기 없음 |
| 6 | Recognition Rather Than Recall | 2 | 슬라이드 개요 없음, 단축키가 `title` 툴팁에만 존재 |
| 7 | Flexibility and Efficiency | 3 | 방향키·`V`·`F`·`?view=all` 존재하나 발견 불가 |
| 8 | Aesthetic and Minimalist Design | 2 | 카드 격자 반복으로 시각적 노이즈 플로어, 중복 정보 2건 |
| 9 | Error Recovery | 1 | 오답에도 "✅ 정답!" 피드백 표시 |
| 10 | Help and Documentation | 1 | 키 안내·범례 전무 |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict

내용은 이 수업의 것이지만 시각 언어는 교체 가능하다. 13장 중 9장이 `border border-slate-200 rounded-xl` 카드 격자로 동일하다. "에너지 전환"이 주제인데 화면에서 실제로 전환되는 것은 없고 `↓` 문자만 반복된다.

결정적 증거: `css/common.css:5-14`에 프로젝트가 직접 선언한 표준이 있다 — *"1 accent per unit (teal #0d9488). Slate neutrals only. No rainbow cards."* 이 페이지는 blue-600 표 헤더, green/yellow/orange/red 효율 막대, purple/orange 차트선, red/blue CTA를 쓴다. 자기 계약 위반.

결정론적 스캔: findings 1건 (`em-dash-overuse`, advisory). false positive로 판단 — 한국어에서 `—`는 정당한 구분자다.

브라우저 오버레이: SKIPPED (브라우저 자동화 미노출). 오버레이는 존재하지 않는다.

## Priority Issues

### [P0] 오답에도 "✅ 정답!" 피드백이 표시됨
`:449-457` 인라인 `checkAnswer()`는 정오 판정을 `isCorrect` 변수로 계산해 버튼 색만 바꾸고(:454), 피드백 div는 무조건 노출한다(:455). 그 div 내용은 `✅ 정답! ② 운동 에너지가 최대이다.`로 하드코딩(:354, :376, :398). `slide_engine.js:210-212`는 `onclick` 속성 감지 시 정상 핸들러를 포기하므로 깨진 인라인이 이긴다. 오개념이 강화된다.
Fix: 인라인 함수와 `onclick` 3×4개 제거 → `setupQuiz()`에 위임. 피드백 div는 해설만.
Command: /impeccable harden

### [P1] 커버 배경 이미지 404
`:14` `images.unsplash.com/rl0VdGm0sKA` → HTTP 404 (`photo-` 접두사 누락). 첫 화면이 회색 바탕 + 블러 대상 없는 `backdrop-filter`로 렌더된다.
Fix: `img/phys_rollercoaster.svg` 등 로컬 자산으로 교체.
Command: /impeccable polish

### [P1] 모바일 격자 붕괴 4건
`:47` `grid-cols-2` / `:78` `grid-cols-3` / `:263` `grid-cols-2` / `:317` `grid-cols-2` — 전부 브레이크포인트 접두사 없음. 슬라이드 6 표는 5열이라 375px에서 카드 내부 가로 스크롤 발생. `←`/`→` 탭 타깃 ~19px (44px 기준 미달, `presentation_mode.css:303-308`).
Fix: `grid-cols-1 md:grid-cols-*`, 버튼에 `min-width/height: 44px`, 표는 모바일에서 카드 목록으로.
Command: /impeccable adapt

### [P1] 접근성 5종 결함
`.slide-caption` #94a3b8 on white = 2.6:1 (AA 4.5:1 미달, `presentation_mode.css:479`) · `←`/`→`에 aria-label 없음(title만) · 두 canvas에 대체 텍스트 없음(`:75`, `:216`) · 퀴즈 피드백에 aria-live 없음 · CSS 3개 파일 전체에 `:focus`/`:focus-visible` 규칙 0건.
Command: /impeccable audit

### [P2] 외부 의존 7건, 폴백 0건
Tailwind CDN(302, 브라우저 JIT 컴파일 = 개발용), Chart.js, Pretendard @import, GmarketSans woff → 첫 페인트 렌더 차단 3건. 학교 방화벽이면 수업 자료가 무너진다.
Command: /impeccable optimize

## Persona Red Flags

Jordan: 오답에 "정답!"이 떠 오개념 고착. Ep/Ek가 풀어쓰이지 않아 13강 결석 시 슬라이드 3부터 해독 불가. `v = √(2gh)`가 유도 없이 등장(:300).
Sam: 진자 그래프가 canvas뿐이라 정보 경로 0. 채점 결과 미낭독. 포커스 링 없음. 캡션 2.6:1. 퀴즈가 `<fieldset>`/radio가 아닌 button 4개라 "4지선다"로 인지되지 않음.
Casey: `←`/`→` ~19px가 유일한 이동 수단(스와이프 없음). 새로고침 시 1번 슬라이드로 초기화 + 퀴즈 리셋. 격자 붕괴 4건.

## Minor Observations

- 슬라이드 6 `보존?` 열 6행 전부 ✅ — 정보량 0. 표 하단 한 줄로 대체 가능.
- 슬라이드 7 LED 85%가 도넛과 막대에 중복 표시. 도넛을 4종 비교로 바꾸면 "효율은 왜 다른가"에 답할 수 있다.
- 슬라이드 6 표에 zebra striping 없음 — 교실 투사 거리에서 행 추적이 어렵다.
- `slide_engine.js:17`이 전 section innerHTML을 마크다운 볼드 치환으로 재작성. `**` 문법이 0건이라 순수 비용이자 향후 리스너 소실 함정.
- keydown 핸들러(`:109`)에 `e.target` 가드 없음. Escape/Home/End 미바인딩.
- `<meta description>`, og 태그, favicon 부재.
- 형광등 효율 ~60% 표기 — 한국 교과서 통용치(40% 안팎) 대비 높다. 형성평가 소재가 될 수 있으니 근거 확인 필요.
- 슬라이드 9(정리) → 10~12(평가) 사이에 함께 푸는 예제가 없다. Present → Review → Practice에서 guided practice 단계 누락.
