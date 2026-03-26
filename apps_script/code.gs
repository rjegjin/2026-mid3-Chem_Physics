/**
 * [Google Apps Script] Quiz Result Handler
 *
 * 원칙:
 * - Submit 함수: 저장만 수행, 응답은 token + score만 반환
 * - Find 함수: 단순 조회/반환만 수행
 * - Get 함수: 응답 JSON 조립
 * - correct[]   = boolean 배열 (정오 여부)
 * - correctAnswers[] = number 배열 (실제 정답 번호, 셔플 반영됨, 0-indexed = Q1~Q20)
 */

const SHEET_RESPONSES      = 'responses';
const SHEET_FEEDBACK       = 'feedback';
const SHEET_ESSAY_RESPONSES = 'essay_responses';
const SHEET_ESSAY_FEEDBACK  = 'essay_feedback';

// ── 공통 헬퍼 ──────────────────────────────────────────────

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST 진입점 ────────────────────────────────────────────

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) throw new Error("No data received");
    const data = JSON.parse(e.postData.contents);
    if (data.assessmentType === 'essay_unit3') {
      return handleEssaySubmit(data);
    } else {
      return handleQuizSubmit(data);
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// ── GET 진입점 ─────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'verify')             return handleVerify(e.parameter);
    if (action === 'get_all')            return handleGetAll();
    if (action === 'get_essay_all')      return handleGetEssayAll();
    if (action === 'save_feedback')      return handleSaveFeedback(e.parameter);
    if (action === 'save_essay_feedback') return handleSaveEssayFeedback(e.parameter);
    return createJsonResponse({ success: false, error: "알 수 없는 액션입니다." });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// ── 객관식 제출 ────────────────────────────────────────────

function handleQuizSubmit(data) {
  if (!data.studentId || !data.name) throw new Error("학번과 이름은 필수입니다.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_RESPONSES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_RESPONSES);
    sheet.appendRow([
      'timestamp', 'studentId', 'name',
      ...Array.from({ length: 20 }, (_, i) => `Q${i + 1}`),
      'total_score', 'token', 'questions_data_json'
    ]);
  }

  const correct       = data.correct || [];
  const correctCount  = correct.filter(c => c === true).length;
  const totalScore    = `${correctCount}/${correct.length || 20}`;
  const token         = Utilities.getUuid();
  const timestamp     = new Date().toISOString();

  // correctAnswers, explanations, questions를 JSON으로 함께 저장
  const questionsData = {
    correct:        correct,
    correctAnswers: data.correctAnswers || [],   // 셔플 후 실제 정답 번호 (0-indexed)
    explanations:   data.explanations   || [],
    questions:      data.questions      || [],
    totalScore:     totalScore
  };

  const answers = data.answers || [];
  sheet.appendRow([
    timestamp, data.studentId, data.name,
    ...answers,
    totalScore, token, JSON.stringify(questionsData)
  ]);

  // 피드백 시트가 없으면 초기화
  if (!ss.getSheetByName(SHEET_FEEDBACK)) {
    const fb = ss.insertSheet(SHEET_FEEDBACK);
    fb.appendRow([
      'studentId', 'name', 'feedback_message',
      ...Array.from({ length: 20 }, (_, i) => `Q${i + 1}_comment`),
      'updated_at'
    ]);
  }

  return createJsonResponse({ success: true, token: token, totalScore: totalScore });
}

// ── 논술형 제출 ────────────────────────────────────────────

function handleEssaySubmit(data) {
  if (!data.studentId || !data.name) throw new Error("학번과 이름은 필수입니다.");
  const answers = data.answers || [];
  if (answers.length < 3) throw new Error("3개의 답변이 필요합니다.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ESSAY_RESPONSES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ESSAY_RESPONSES);
    sheet.appendRow([
      'timestamp', 'studentId', 'name',
      'Q1_content', 'Q1_length', 'Q2_content', 'Q2_length', 'Q3_content', 'Q3_length',
      'token', 'answers_json'
    ]);
  }

  const token     = Utilities.getUuid();
  const timestamp = new Date().toISOString();

  sheet.appendRow([
    timestamp, data.studentId, data.name,
    answers[0]?.content || '', answers[0]?.content?.length || 0,
    answers[1]?.content || '', answers[1]?.content?.length || 0,
    answers[2]?.content || '', answers[2]?.content?.length || 0,
    token, JSON.stringify(answers)
  ]);

  // 피드백 시트가 없으면 초기화
  if (!ss.getSheetByName(SHEET_ESSAY_FEEDBACK)) {
    const fb = ss.insertSheet(SHEET_ESSAY_FEEDBACK);
    fb.appendRow([
      'studentId', 'name', 'overall_feedback',
      'Q1_comment', 'Q2_comment', 'Q3_comment', 'score', 'updated_at'
    ]);
  }

  return createJsonResponse({ success: true, token: token });
}

// ── 학생 인증 (객관식 우선, 없으면 논술형) ──────────────────

function handleVerify(params) {
  if (!params.studentId || !params.token) throw new Error("학번과 토큰이 필요합니다.");

  const quizResult = findQuizRecord(params.studentId, params.token);
  if (quizResult) {
    return createJsonResponse({ success: true, assessmentType: 'quiz', ...quizResult });
  }

  const essayResult = findEssayRecord(params.studentId, params.token);
  if (essayResult) {
    return createJsonResponse({ success: true, assessmentType: 'essay', ...essayResult });
  }

  return createJsonResponse({ success: false, message: "학번 또는 토큰이 일치하지 않습니다." });
}

// ── 객관식 레코드 조회 ─────────────────────────────────────

function findQuizRecord(studentId, token) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RESPONSES);
  if (!sheet) return null;

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  // 열 인덱스 동적 해석 (헤더 이름 기준, 없으면 위치 기반 fallback)
  const col = (name, fallback) => {
    const idx = headers.indexOf(name);
    return idx !== -1 ? idx : fallback;
  };
  const studentIdIdx    = col('studentId', 1);
  const tokenIdx        = col('token', headers.length - 2);
  const nameIdx         = col('name', 2);
  const totalScoreIdx   = col('total_score', headers.length - 3);
  const qDataIdx        = col('questions_data_json', headers.length - 1);
  const q1Idx           = col('Q1', 3);

  // 가장 최근 제출 기록 탐색 (뒤에서부터)
  let foundRecord = null;
  for (let i = data.length - 1; i > 0; i--) {
    if (String(data[i][studentIdIdx]) === String(studentId) &&
        String(data[i][tokenIdx])     === String(token)) {
      foundRecord = data[i];
      break;
    }
  }
  if (!foundRecord) return null;

  // questions_data_json 파싱
  let qData = { correct: Array(20).fill(false), correctAnswers: [], explanations: [], questions: [], totalScore: null };
  try {
    const raw = foundRecord[qDataIdx];
    if (raw && typeof raw === 'string' && raw.startsWith('{')) {
      qData = { ...qData, ...JSON.parse(raw) };
    }
  } catch (e) {}

  // 피드백 조회
  let feedback = { message: "", comments: Array(20).fill("") };
  const fbSheet = ss.getSheetByName(SHEET_FEEDBACK);
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = fbData.length - 1; i > 0; i--) {
      if (String(fbData[i][0]) === String(studentId)) {
        feedback.message  = fbData[i][2] || "";
        feedback.comments = fbData[i].slice(3, 23);
        break;
      }
    }
  }

  return {
    studentId:       foundRecord[studentIdIdx],
    name:            foundRecord[nameIdx],
    answers:         foundRecord.slice(q1Idx, q1Idx + 20),
    totalScore:      qData.totalScore || foundRecord[totalScoreIdx],
    correct:         qData.correct         || Array(20).fill(false),
    correctAnswers:  qData.correctAnswers  || [],   // 0-indexed, 셔플 반영
    explanations:    qData.explanations    || [],
    questions:       qData.questions       || [],
    feedback:        feedback.message,
    questionComments: feedback.comments
  };
}

// ── 논술형 레코드 조회 ─────────────────────────────────────

function findEssayRecord(studentId, token) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ESSAY_RESPONSES);
  if (!sheet) return null;

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  const col = (name, fallback) => {
    const idx = headers.indexOf(name);
    return idx !== -1 ? idx : fallback;
  };
  const studentIdIdx   = col('studentId', 1);
  const tokenIdx       = col('token', 9);
  const nameIdx        = col('name', 2);
  const answersJsonIdx = col('answers_json', headers.length - 1);

  let foundRecord = null;
  for (let i = data.length - 1; i > 0; i--) {
    if (String(data[i][studentIdIdx]) === String(studentId) &&
        String(data[i][tokenIdx])     === String(token)) {
      foundRecord = data[i];
      break;
    }
  }
  if (!foundRecord) return null;

  // 피드백 조회
  let feedback = { message: "", comments: ["", "", ""] };
  const fbSheet = ss.getSheetByName(SHEET_ESSAY_FEEDBACK);
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = fbData.length - 1; i > 0; i--) {
      if (String(fbData[i][0]) === String(studentId)) {
        feedback.message  = fbData[i][2] || "";
        feedback.comments = [fbData[i][3] || "", fbData[i][4] || "", fbData[i][5] || ""];
        break;
      }
    }
  }

  return {
    studentId:        foundRecord[studentIdIdx],
    name:             foundRecord[nameIdx],
    answers:          JSON.parse(foundRecord[answersJsonIdx] || '[]'),
    feedback:         feedback.message,
    questionComments: feedback.comments
  };
}

// ── 교사용: 객관식 전체 조회 ───────────────────────────────

function handleGetAll() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(SHEET_RESPONSES);
  const fbSheet = ss.getSheetByName(SHEET_FEEDBACK);

  if (!sheet) return createJsonResponse({ success: true, data: [] });

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  const col = (name, fallback) => {
    const idx = headers.indexOf(name);
    return idx !== -1 ? idx : fallback;
  };
  const studentIdIdx  = col('studentId', 1);
  const nameIdx       = col('name', 2);
  const totalScoreIdx = col('total_score', headers.length - 3);
  const qDataIdx      = col('questions_data_json', headers.length - 1);
  const q1Idx         = col('Q1', 3);

  // 피드백 맵 생성
  const feedbackMap = {};
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = 1; i < fbData.length; i++) {
      feedbackMap[String(fbData[i][0])] = {
        message:  fbData[i][2] || "",
        comments: fbData[i].slice(3, 23)
      };
    }
  }

  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row  = data[i];
    const sId  = String(row[studentIdIdx]);
    let qData  = { correct: Array(20).fill(false), correctAnswers: [], questions: [], totalScore: null };
    try {
      const raw = row[qDataIdx];
      if (raw && typeof raw === 'string' && raw.startsWith('{')) {
        qData = { ...qData, ...JSON.parse(raw) };
      }
    } catch (e) {}

    results.push({
      timestamp:        row[0],
      studentId:        sId,
      name:             row[nameIdx],
      answers:          row.slice(q1Idx, q1Idx + 20),
      totalScore:       qData.totalScore   || row[totalScoreIdx],
      correct:          qData.correct      || Array(20).fill(false),
      correctAnswers:   qData.correctAnswers || [],
      questions:        qData.questions    || [],
      feedback:         feedbackMap[sId]?.message  || "",
      questionComments: feedbackMap[sId]?.comments || Array(20).fill("")
    });
  }

  return createJsonResponse({ success: true, data: results });
}

// ── 교사용: 논술형 전체 조회 ───────────────────────────────

function handleGetEssayAll() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(SHEET_ESSAY_RESPONSES);
  const fbSheet = ss.getSheetByName(SHEET_ESSAY_FEEDBACK);

  if (!sheet) return createJsonResponse({ success: true, data: [] });

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  const col = (name, fallback) => {
    const idx = headers.indexOf(name);
    return idx !== -1 ? idx : fallback;
  };
  const studentIdIdx   = col('studentId', 1);
  const nameIdx        = col('name', 2);
  const answersJsonIdx = col('answers_json', headers.length - 1);

  const feedbackMap = {};
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = 1; i < fbData.length; i++) {
      feedbackMap[String(fbData[i][0])] = {
        overallFeedback: fbData[i][2] || "",
        comments:        [fbData[i][3] || "", fbData[i][4] || "", fbData[i][5] || ""],
        score:           fbData[i][6] || ""
      };
    }
  }

  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sId = String(row[studentIdIdx]);
    results.push({
      timestamp:        row[0],
      studentId:        sId,
      name:             row[nameIdx],
      answers:          JSON.parse(row[answersJsonIdx] || '[]'),
      feedback:         feedbackMap[sId]?.overallFeedback || "",
      questionComments: feedbackMap[sId]?.comments        || ["", "", ""],
      score:            feedbackMap[sId]?.score            || ""
    });
  }

  return createJsonResponse({ success: true, data: results });
}

// ── 교사용: 객관식 피드백 저장 ─────────────────────────────

function handleSaveFeedback(params) {
  if (!params.studentId) throw new Error("학번이 필요합니다.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_FEEDBACK);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_FEEDBACK);
    sheet.appendRow([
      'studentId', 'name', 'feedback_message',
      ...Array.from({ length: 20 }, (_, i) => `Q${i + 1}_comment`),
      'updated_at'
    ]);
  }

  const comments     = params.comments ? JSON.parse(params.comments) : [];
  const safeComments = Array.from({ length: 20 }, (_, i) => comments[i] || "");
  const timestamp    = new Date().toISOString();
  const rowData      = [params.studentId, params.name || "", params.message || "", ...safeComments, timestamp];

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(params.studentId)) { rowIndex = i + 1; break; }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true });
}

// ── 교사용: 논술형 피드백 저장 ─────────────────────────────

function handleSaveEssayFeedback(params) {
  if (!params.studentId) throw new Error("학번이 필요합니다.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ESSAY_FEEDBACK);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ESSAY_FEEDBACK);
    sheet.appendRow([
      'studentId', 'name', 'overall_feedback',
      'Q1_comment', 'Q2_comment', 'Q3_comment', 'score', 'updated_at'
    ]);
  }

  const comments  = params.comments ? JSON.parse(params.comments) : ["", "", ""];
  const timestamp = new Date().toISOString();
  const rowData   = [
    params.studentId, params.name || "", params.overallFeedback || "",
    comments[0] || "", comments[1] || "", comments[2] || "",
    params.score || "", timestamp
  ];

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(params.studentId)) { rowIndex = i + 1; break; }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true });
}
