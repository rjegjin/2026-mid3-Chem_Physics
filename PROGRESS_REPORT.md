# 📊 2026 중3 화학 퀴즈 & 피드백 시스템 구축 보고서

**작성일:** 2026-03-23
**프로젝트 경로:** `/home/rjegj/projects/2026-mid3-Chem_Physics`

---

## 1. 시스템 개요
중학교 3학년 화학 단원(화학 반응식, 질량 보존) 학습 후 학생들의 성취도를 평가하고, 개인별 맞춤형 피드백을 제공하기 위한 통합 시스템입니다. GitHub Pages(프론트엔드)와 Google Sheets(데이터베이스)를 Google Apps Script로 연결하여 구축되었습니다.

## 2. 주요 구현 기능

### ✅ 퀴즈 시스템 (`quiz_L2L3_chem.html`)
- **문제 변수화(Randomization):** 주요 계산형 문항(6, 13, 14, 18, 19번)의 수치를 페이지 로드 시마다 랜덤하게 생성하여 부정행위를 방지하고 원리 이해를 유도함.
- **동적 시각 자료(Dynamic SVG):** 랜덤 수치에 맞춰 입자 모형의 개수나 실험 장치 애니메이션이 실시간으로 변화하여 가독성과 이해도를 높임.
- **통합 제출 로직:** [채점]과 [서버 전송]을 하나로 통합하여 학생 편의성 증대. 학번/이름 미입력 시 자동 유효성 검사 및 상단 스크롤 기능 포함.
- **OMR 내비게이션:** 화면 우측에 고정된 OMR 판을 통해 문제 이동 및 실시간 풀이 상태(정오 포함) 확인 가능.

### ✅ 학생 결과 대시보드 (`student_result.html`)
- **보안 인증:** 학번과 고유 토큰(UUID)을 통한 본인 확인 시스템.
- **맞춤형 피드백:** 선생님이 남긴 전체 격려 메시지와 문항별 개별 코멘트를 시각적으로 확인.
- **복기 기능:** 자신이 풀었던 당시의 '실제 문제 텍스트'와 '내가 쓴 답'을 대조하며 오답 노트 활용 가능.

### ✅ 교사용 대시보드 (`teacher_dashboard.html`)
- **실시간 모니터링:** 전체 제출 인원, 평균 점수, 학급별 제출 현황 통계 제공.
- **피드백 입력:** 학생 명단에서 클릭 한 번으로 개별 피드백 모달을 열어 코멘트 작성 및 시트 저장.
- **문항 분석:** 문항별 정답률(응답률) 차트를 통한 학습 결손 지점 파악.

---

## 3. 핵심 파일 절대 주소 목록

| 구분 | 파일명 | 절대 경로 |
| :--- | :--- | :--- |
| **메인 인덱스** | `index.html` | `/home/rjegj/projects/2026-mid3-Chem_Physics/index.html` |
| **퀴즈 페이지** | `quiz_L2L3_chem.html` | `/home/rjegj/projects/2026-mid3-Chem_Physics/quiz_L2L3_chem.html` |
| **학생 결과창** | `student_result.html` | `/home/rjegj/projects/2026-mid3-Chem_Physics/student_result.html` |
| **교사 대시보드** | `teacher_dashboard.html` | `/home/rjegj/projects/2026-mid3-Chem_Physics/teacher_dashboard.html` |
| **백엔드 코드** | `code.gs` | `/home/rjegj/projects/2026-mid3-Chem_Physics/apps_script/code.gs` |
| **설계 문서** | `QUIZ_RESULT_SYSTEM.md` | `/home/rjegj/projects/2026-mid3-Chem_Physics/QUIZ_RESULT_SYSTEM.md` |

---

## 4. 관리자 정보
- **교사용 대시보드 비밀번호:** `chemistry`
- **데이터 저장소:** 연동된 Google Spreadsheet (Apps Script Web App URL 기반)

## 5. 향후 유지보수 사항
- 문제의 난이도나 수치 조정이 필요한 경우 `quiz_L2L3_chem.html` 내의 `generateDynamicQuestions` 함수 수정.
- Apps Script 로직 변경 시 반드시 [새 버전 배포] 과정을 거쳐야 함.

---
**보고서 생성 완료.** 모든 시스템이 정상 작동하며 깃허브 원격 저장소에 동기화되었습니다.
