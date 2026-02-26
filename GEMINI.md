# 2026-mid3-Chem_Physics 프로젝트 가이드라인

## 🎨 디자인 및 가독성 원칙 (Presentation Design Rules)

### 1. 대비(Contrast) 최적화 (CRITICAL)
- **어두운 배경 (Dark Background):** 배경이 어두운 색(예: `bg-slate-900`, `bg-indigo-900`, `bg-prestige-navy`)일 경우, 글씨는 반드시 **밝은 색**(`text-white`, `text-slate-100`, `text-cyan-400` 등)을 사용해야 함.
- **밝은 배경 (Light Background):** 배경이 밝은 색(예: `bg-white`, `bg-slate-50`, `bg-blue-50`)일 경우, 글씨는 **어두운 색**(`text-slate-900`, `text-slate-800`, `text-blue-900` 등)을 사용해야 함.
- 시뮬레이션 로그나 박스 내부의 텍스트가 배경색에 묻히지 않도록 항상 검토할 것.

### 2. 컴포넌트 일관성
- `math-box`, `note-box`, `stage-3d` 등의 공통 클래스를 적극 활용하여 전체적인 톤앤매너를 유지함.
- 강조 텍스트는 `font-bold` 또는 `text-accent` 컬러를 사용하여 가독성을 높임.

### 3. LaTeX 렌더링 보안
- 수식의 역슬래시(``)가 HTML 소스에서 소실되지 않도록 더블 역슬래시(``)를 적절히 사용하거나 `replace` 도구 사용 시 주의할 것.

## 🛠️ 개발 지침
- 모든 화학/물리 시뮬레이션 로직은 `js/chem_sim.js`의 `coreSimulate...` 함수를 호출하여 처리함.
- 새로운 슬라이드 추가 시 `index.html`과 `ADV_INORGANIC_ROADMAP.md`의 연동성을 고려함.
