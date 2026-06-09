# 📋 Quiz 결과 수집 및 학생 피드백 시스템 설계 문서

**작성일:** 2026-03-24
**프로젝트:** 2026-mid3-Chem_Physics
**담당:** Claude Code (구현 설계)

---

## 개요

본 프로젝트는 `quiz_L2L3_chem.html` 쪽지시험 제출 시스템을 Google Sheets와 연동하여, 다음 기능을 제공합니다:

- ✅ **학생 제출 데이터 수집**: 학번, 이름, 15개 문항별 답변 및 정오표 자동 저장
- ✅ **학번 + 토큰 기반 인증**: 각 학생이 자신의 결과만 확인하도록 보안 구현
- ✅ **학생용 대시보드**: 자신의 점수, 정오표, 틀린 문항별 해설, 교사 피드백 확인
- ✅ **교사용 대시보드**: 제출 현황 모니터링, 문항별 오답률, 학생별 피드백 입력
- ✅ **GitHub Pages 호환**: 정적 HTML 형식 유지로 별도 빌드 없이 배포

---

## 시스템 아키텍처

```
┌─────────────────────────────────────┐
│  quiz_L2L3_chem.html (GitHub Pages) │
│  - 학번/이름 입력                     │
│  - 15문제 풀이                       │
│  - 제출 → POST (학번, 이름, 답변)    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│    Google Apps Script Web App        │
│  - POST 수신                         │
│  - 토큰(UUID) 자동 생성              │
│  - Google Sheets 저장                │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│        Google Sheets (데이터 저장소)          │
│                                              │
│  📊 responses 시트:                          │
│     timestamp | 학번 | 이름 | Q1~Q15       │
│     답변 | total_score | token               │
│                                              │
│  💬 feedback 시트:                           │
│     학번 | 이름 | feedback_message           │
│     Q1_comment | Q2_comment | ... | updated  │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ student_     │ │  teacher_    │
│ result.html  │ │ dashboard.   │
│ (학생용)      │ │ html(교사용) │
│              │ │              │
│ - 로그인      │ │ - 제출 현황  │
│ - 자신의      │ │ - 오답률    │
│   점수        │ │ - 피드백    │
│ - 정오표      │ │   입력/저장  │
│ - 피드백      │ │              │
└──────────────┘ └──────────────┘
```

---

## 구현 단계

### **Phase 1: 데이터 수집 인프라 구축**

#### 1-1. Google Apps Script 설정

**목표:** POST 요청을 받아 Sheets에 저장하는 Web App 배포

**작업 항목:**
- [ ] Google Drive에서 새 Apps Script 프로젝트 생성 (`quiz-result-handler`)
- [ ] 다음 엔드포인트 구현:
  ```javascript
  doPost(e) {
    // POST body: { studentId, name, answers: [Q1, Q2, ...], correct: [T/F, ...] }
    // 1. UUID 토큰 생성
    // 2. responses 시트에 행 추가
    // 3. 토큰 포함한 응답 반환
    // 반환값: { success: true, token: "...", totalScore: "12/15" }
  }
  ```
- [ ] 배포 (새 배포 > 웹 앱 > 자신의 Google 계정으로 실행)
- [ ] 생성된 Web App URL 기록

#### 1-2. Google Sheets 구조 설정

**responses 시트:**
```
A         B      C     D~R        S           T          U
timestamp 학번   이름  Q1~Q15    total_score token      created_at
2026-03-24 10101 홍길동 O O X... 12/15      abc-def-..  2026-03-24 14:32
```

**feedback 시트:**
```
A     B    C                  D~R          S          T
학번   이름  feedback_message  Q1_comment~15_comment updated_at
10101 홍길동 전반적으로 좋아요!  좋은 시도    ...       2026-03-24 15:00
```

**작업 항목:**
- [ ] Google Sheet 생성 또는 기존 시트 활용
- [ ] responses, feedback 두 시트 생성
- [ ] 헤더 행 입력

#### 1-3. quiz_L2L3_chem.html 수정

**작업 항목:**
- [ ] Outro 슬라이드 전에 "결과 제출" 슬라이드 추가
  ```html
  <div class="slide" data-slide="result">
    <h1>쪽지시험 제출</h1>
    <label>학번: <input id="studentId" type="text" /></label>
    <label>이름: <input id="studentName" type="text" /></label>
    <button onclick="submitQuiz()">제출하기</button>
  </div>
  ```
- [ ] `submitQuiz()` 함수 구현:
  ```javascript
  async function submitQuiz() {
    const response = await fetch('APPS_SCRIPT_URL', {
      method: 'POST',
      body: JSON.stringify({
        studentId: document.getElementById('studentId').value,
        name: document.getElementById('studentName').value,
        answers: window.quizAnswers,  // 기존 변수 활용
        correct: window.quizCorrect
      })
    });
    const result = await response.json();
    if (result.success) {
      alert(`제출 완료! 토큰: ${result.token}\nstudent_result.html에서 확인하세요.`);
    }
  }
  ```

---

### **Phase 2: 교사용 대시보드 구축**

**파일:** `teacher_dashboard.html`

**기능:**
- [ ] 관리자 비밀번호 인증 (기존 Score-Checker 방식)
- [ ] Sheets 실시간 읽기 (google-sheets MCP 활용)
- [ ] 제출 현황 표시:
  - 제출 인원 / 평균 점수
  - 시간별 제출 그래프
- [ ] 학생별 상세보기:
  - 정오표 표시 (O/X 배열)
  - 문항별 오답률 차트
- [ ] 피드백 입력 기능:
  - 전체 피드백 메시지 입력
  - 문항별 코멘트 입력
  - 저장 버튼 (Sheets 업데이트)

**기술 스택:**
- HTML + Tailwind CSS
- Fetch API (Apps Script 호출)
- Chart.js (오답률 시각화)

---

### **Phase 3: 학생용 대시보드 구축**

**파일:** `student_result.html`

**기능:**
- [ ] 로그인 섹션:
  - 학번 입력
  - 토큰 입력 (또는 비밀번호 대체 옵션)
  - 검증 (Apps Script `/api/verify` 호출)
- [ ] 결과 표시 페이지 (로그인 후):
  - **내 점수**: "12/15 (80%)"
  - **정오표**: `[O O X O ...]` (시각적)
  - **틀린 문항**:
    ```
    Q3: 내 답 "2" → 정답 "3"
        해설: N₂ + 3H₂ → 2NH₃...
    Q8: ...
    ```
  - **교사 피드백**: feedback 시트에서 읽어 표시
  - **다시 풀기**: quiz_L2L3_chem.html 링크

**기술 스택:**
- HTML + Tailwind CSS
- Fetch API + async/await
- localStorage (선택사항: 토큰 저장)

**인증 플로우:**
```javascript
async function verifyStudent() {
  const response = await fetch('APPS_SCRIPT_URL/verify', {
    method: 'POST',
    body: JSON.stringify({
      studentId: document.getElementById('studentId').value,
      token: document.getElementById('token').value
    })
  });
  const result = await response.json();
  if (result.success) {
    displayResult(result);  // 결과 화면 표시
  } else {
    alert('학번 또는 토큰이 맞지 않습니다.');
  }
}
```

---

## Google Apps Script 상세 코드 명세

### 엔드포인트 1: `doPost()` (결과 제출)

```
POST Body:
{
  "studentId": "10101",
  "name": "홍길동",
  "answers": ["2", "3", "1", ...],        // 15개 답변
  "correct": [true, true, false, ...]     // 정오표
}

Response:
{
  "success": true,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "totalScore": "12/15",
  "message": "제출 완료"
}
```

### 엔드포인트 2: `doGet()` (토큰 검증 및 결과 조회)

```
GET Query: ?action=verify&studentId=10101&token=550e8400...

Response:
{
  "success": true,
  "studentName": "홍길동",
  "totalScore": "12/15",
  "answers": ["2", "3", ...],
  "correct": [true, true, false, ...],
  "correctAnswers": ["2", "3", "3", ...],  // 정답지
  "feedback": "전반적으로 좋아요!",
  "questionComments": ["좋은 시도", "", "다시 생각해봐", ...]
}
```

---

## 데이터 보안 고려사항

1. **개인정보 보호**
   - 토큰은 UUID v4 사용 (예측 불가능)
   - 학번 + 토큰 조합으로 인증 (추측 어려움)
   - Sheets는 Google 계정으로만 접근 가능

2. **Apps Script 보안**
   - Web App 배포 시 "자신의 Google 계정으로 실행" 선택
   - POST 수신 시 CORS 고려 (GitHub Pages에서 호출 가능하도록)

3. **향후 확장**
   - 로그인 로그 추가 가능 (접속 시간, IP)
   - 토큰 만료 시간 설정 가능

---

## 구현 체크리스트

### Phase 1: 데이터 수집
- [ ] Apps Script 프로젝트 생성 및 코드 작성
- [ ] Web App 배포 및 URL 획득
- [ ] Google Sheets 초기화 (responses, feedback 시트)
- [ ] quiz_L2L3_chem.html 수정 및 테스트

### Phase 2: 교사용 대시보드
- [ ] teacher_dashboard.html 작성
- [ ] 비밀번호 인증 로직
- [ ] Sheets 읽기 및 표시
- [ ] 피드백 입력 및 저장 기능

### Phase 3: 학생용 대시보드
- [ ] student_result.html 작성
- [ ] 토큰 검증 로직
- [ ] 결과 페이지 레이아웃
- [ ] 피드백 표시 기능

### Phase 4: 테스트 및 배포
- [ ] 전체 흐름 E2E 테스트
- [ ] GitHub Pages에 배포
- [ ] 학생 실제 사용 테스트

---

## 파일 목록

| 파일명 | 위치 | 설명 |
|---|---|---|
| `quiz_L2L3_chem.html` | 루트 | 기존 파일 수정 (결과 제출 슬라이드 추가) |
| `student_result.html` | 루트 | 신규 (학생용 대시보드) |
| `teacher_dashboard.html` | 루트 | 신규 (교사용 대시보드) |
| Apps Script 코드 | Google Drive | 신규 Web App |

---

## 참고 자료

- **기존 Score-Checker**: `/home/rjegj/projects/School-Admin-Suite/Score-Checker/app.py`
- **Google Sheets API**: https://developers.google.com/sheets/api
- **Apps Script 가이드**: https://developers.google.com/apps-script/guides

---

**다음 진행자를 위한 메모:**

1. Google Apps Script에서 CORS 설정이 자동으로 처리되지 않을 수 있습니다. 필요시 `Access-Control-Allow-Origin` 헤더를 명시적으로 설정하세요.
2. 학생의 토큰 분실 시 재발급 프로세스를 정의해주세요 (교사가 학번으로 조회 후 토큰 재생성).
3. 나중에 이메일/Telegram 피드백 자동 통지를 추가할 때를 대비해 피드백 데이터 구조를 확장 가능하게 설계했습니다.

---

**최종 업데이트:** 2026-03-24
