# 🧪 2026-mid3-Chem_Physics (Asset Hub)

## 🎯 비전
2026학년도 과학 수업을 위한 고품질 인터랙티브 수업 에셋과 HTML5 기반 프레젠테이션을 관리하고 실시간 배포하는 **"수업 자산 관제 플랫폼"**.

## 📈 현재 상태 (Active)
- [x] `generate_dashboard.py`를 이용한 전 단원 HTML 에셋 자동 스캔 및 인덱싱
- [x] `asset_server.py` 기반의 안정적인 미디어 자산 공급 체계 수립
- [x] 고급 무기화학(Advanced Inorganic) 심화 과정 로드맵 연계
- [ ] `Project-SCOPE` 빌드 결과물(units/dist)과의 실시간 파일 동기화
- [x] `image_manifest.json`을 통한 GitHub AI 및 외부 에셋 참조 최적화

## 🛠️ 기술적 과제 (Roadmap)
1. **에셋 버전 관리**: 수업 자료 수정 시 에셋 경로가 깨지지 않도록 하는 해시 기반 매니페스트 관리.
2. **인터랙티브 대시보드**: `asset_dashboard.html`을 Streamlit으로 포팅하여 실시간 수업 상태 모니터링 및 퀴즈 제어 기능 통합.
3. **하이브리드 연동**: 로컬 HTML 프레젠테이션과 클라우드 에셋 간의 끊김 없는 통신을 위한 로컬 프록시 설정 자동화.


# 현재 상태
- [x] 15강 탐구 애플릿 NaN 버그 수정 + 상시기록·자기력선·자기장세기 컨트롤 + 라벨 안정화 (PR #16), 고급 무기화학 19편 (PR #15)
- [x] 자가 발전 실험 페이지 신규 + 18·19강 아키타입 보강 (PR #13)
- [x] Stage 1 카탈로그로 17강 신설 + 토큰 실측(읽기 -50%, 쓰기 -8%), 세션 고정비 -21%
- [x] Stage 0: 16강 인라인 컴포넌트를 공용 css/components.css로 승격, 공통화 로드맵 작성
- [x] 15·16강 학습지 Google Docs 업로드 완료 + Docs 변환 기준 레이아웃 교정 (PR #9, #10)
- [x] 15·16강 학습지 4종 docx 생성기 추가 (WORKSHEET_CREATION_WORKFLOW 적용, PR #8)
- [x] 16강 QA 반영: 대비 2건, 3번 예상 회수, 13번 규칙 완성 상호작용, 9번 과학사 보강, 8강 죽은 이미지 SVG 교체 (PR #7)
- [x] 16강 애플릿 버튼 무반응 수정(엔진 innerHTML 재작성), interaction_check.py 신설, PR #6 머지
- [x] 16강을 18장 수업 서사로 재구성, 애플릿 2종 신설, 슬라이드 엔진 키 충돌 수정 (PR #5)
- [x] Add BBC vacuum experiment video slide after slide 9
- [x] Add misconception slide about free fall feeling and update vacuum experiment image
- [x] Update images for free fall and uniform motion slides
- [x] MathJax 적용 및 CSS 단위 표시(uppercase) 충돌 문제 해결
- [x] quiz_L4L5_chem.html 선지 중복(Q2, Q3, Q17, Q20) 수정
- [x] Implement parameterized quiz system with student/teacher dashboards and index linking
- [x] Redesign 5_gas_reaction.html with bright theme and hotel analogy