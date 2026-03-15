# 🧪 2026-mid3-Chem_Physics (Asset Hub)

## 🎯 비전
2026학년도 과학 수업을 위한 고품질 인터랙티브 수업 에셋과 HTML5 기반 프레젠테이션을 관리하고 실시간 배포하는 **"수업 자산 관제 플랫폼"**.

## 📈 현재 상태 (Active)
- [x] `generate_dashboard.py`를 이용한 전 단원 HTML 에셋 자동 스캔 및 인덱싱
- [x] `asset_server.py` 기반의 안정적인 미디어 자산 공급 체계 수립
- [x] 고급 무기화학(Advanced Inorganic) 심화 과정 로드맵 연계
- [ ] `Project-SCOPE` 빌드 결과물(units/dist)과의 실시간 파일 동기화
- [ ] `image_manifest.json`을 통한 GitHub AI 및 외부 에셋 참조 최적화

## 🛠️ 기술적 과제 (Roadmap)
1. **에셋 버전 관리**: 수업 자료 수정 시 에셋 경로가 깨지지 않도록 하는 해시 기반 매니페스트 관리.
2. **인터랙티브 대시보드**: `asset_dashboard.html`을 Streamlit으로 포팅하여 실시간 수업 상태 모니터링 및 퀴즈 제어 기능 통합.
3. **하이브리드 연동**: 로컬 HTML 프레젠테이션과 클라우드 에셋 간의 끊김 없는 통신을 위한 로컬 프록시 설정 자동화.
