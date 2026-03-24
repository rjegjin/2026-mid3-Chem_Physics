/**
 * [Google Apps Script] Quiz Result Handler
 * 
 * 기능:
 * 1. doPost(e): 학생의 퀴즈 결과를 받아 'responses' 시트에 저장하고 고유 토큰 반환
 * 2. doGet(e): 
 *    - action=verify: 학번과 토큰으로 학생 인증 및 결과/피드백 조회
 *    - action=get_all (교사용): 전체 제출 데이터 조회
 *    - action=save_feedback (교사용): 특정 학생에 대한 교사 피드백 저장
 */

// 시트 이름 설정
const SHEET_RESPONSES = 'responses';
const SHEET_FEEDBACK = 'feedback';
const SHEET_ESSAY_RESPONSES = 'essay_responses';
const SHEET_ESSAY_FEEDBACK = 'essay_feedback';
// ⚠️ 주의: CORS 처리를 위해 doGet, doPost 함수를 구현합니다.

/**
 * OPTIONS 요청 처리 (CORS Preflight)
 */
function doOptions(e) {
  return HtmlService.createHtmlOutput("")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 텍스트나 JSON 응답을 생성하는 헬퍼 함수 (CORS 헤더 포함)
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리: 퀴즈 또는 논술형 평가 제출
 */
function doPost(e) {
  try {
    let data;
    // e.postData.contents 파싱
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("No data received");
    }

    // assessmentType에 따라 분기
    if (data.assessmentType === 'essay_unit3') {
      return handleEssaySubmit(data);
    } else {
      return handleQuizSubmit(data);
    }

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * 객관식 퀴즈 제출 처리
 */
function handleQuizSubmit(data) {
  const studentId = data.studentId;
  const name = data.name;
  const answers = data.answers || [];
  const correct = data.correct || [];

  if (!studentId || !name) {
    throw new Error("학번과 이름은 필수입니다.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_RESPONSES);

  // 시트가 없으면 생성하고 헤더 작성
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_RESPONSES);
    const headers = ['timestamp', 'studentId', 'name', ...Array.from({length: 20}, (_, i) => `Q${i+1}`), 'total_score', 'token', 'questions_data_json'];
    sheet.appendRow(headers);
  }

  // UUID 생성 (토큰용)
  const token = Utilities.getUuid();
  const timestamp = new Date().toISOString();

  // 정답 개수 계산
  const correctCount = correct.filter(c => c === true).length;
  const totalScore = `${correctCount}/${correct.length}`;

  // 행 데이터 준비 (correct, totalScore, questions 모두 JSON에 포함)
  const questionsData = {
    correct: correct,
    questions: data.questions || [],
    totalScore: totalScore  // ← 점수도 함께 저장
  };
      const questionsData = {
      correct: correct,
      questions: data.questions || [],
      totalScore: totalScore
    };
    const rowData = [timestamp, studentId, name, ...answers, totalScore, token, JSON.stringify(questionsData)];

  sheet.appendRow(rowData);

  // 피드백 시트 초기화 (행이 없다면)
  let feedbackSheet = ss.getSheetByName(SHEET_FEEDBACK);
  if (!feedbackSheet) {
    feedbackSheet = ss.insertSheet(SHEET_FEEDBACK);
    const fbHeaders = ['studentId', 'name', 'feedback_message', ...Array.from({length: 20}, (_, i) => `Q${i+1}_comment`), 'updated_at'];
    feedbackSheet.appendRow(fbHeaders);
  }

  // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
}

/**
 * 논술형 평가 제출 처리
 */
function handleEssaySubmit(data) {
  const studentId = data.studentId;
  const name = data.name;
  const answers = data.answers || [];

  if (!studentId || !name) {
    throw new Error("학번과 이름은 필수입니다.");
  }

  if (!answers || answers.length < 3) {
    throw new Error("3개의 답변이 필요합니다.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ESSAY_RESPONSES);

  // 시트가 없으면 생성하고 헤더 작성
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ESSAY_RESPONSES);
    const headers = ['timestamp', 'studentId', 'name', 'Q1_content', 'Q1_length', 'Q2_content', 'Q2_length', 'Q3_content', 'Q3_length', 'token', 'answers_json'];
    sheet.appendRow(headers);
  }

  // UUID 생성 (토큰용)
  const token = Utilities.getUuid();
  const timestamp = new Date().toISOString();

  // 행 데이터 준비
  const rowData = [
    timestamp,
    studentId,
    name,
    answers[0]?.content || '',
    answers[0]?.content?.length || 0,
    answers[1]?.content || '',
    answers[1]?.content?.length || 0,
    answers[2]?.content || '',
    answers[2]?.content?.length || 0,
    token,
    JSON.stringify(answers)
  ];

  sheet.appendRow(rowData);

  // 피드백 시트 초기화 (행이 없다면)
  let feedbackSheet = ss.getSheetByName(SHEET_ESSAY_FEEDBACK);
  if (!feedbackSheet) {
    feedbackSheet = ss.insertSheet(SHEET_ESSAY_FEEDBACK);
    const fbHeaders = ['studentId', 'name', 'overall_feedback', 'Q1_comment', 'Q2_comment', 'Q3_comment', 'score', 'updated_at'];
    feedbackSheet.appendRow(fbHeaders);
  }

  // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
}

/**
 * GET 요청 처리: 토큰 검증, 결과 조회, 데이터 패치 등
 */
function doGet(e) {
  const action = e.parameter.action;

  try {
    if (action === 'verify') {
      return handleVerify(e.parameter);
    } else if (action === 'get_all') {
      return handleGetAll();
    } else if (action === 'get_essay_all') {
      return handleGetEssayAll();
    } else if (action === 'save_feedback') {
      return handleSaveFeedback(e.parameter);
    } else if (action === 'save_essay_feedback') {
      return handleSaveEssayFeedback(e.parameter);
    } else {
      return createJsonResponse({ success: false, error: "알 수 없는 액션입니다." });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * 학생 검증 및 결과/피드백 조회 (객관식 & 논술형)
 */
function handleVerify(params) {
  const studentId = params.studentId;
  const token = params.token;

  if (!studentId || !token) throw new Error("학번과 토큰이 필요합니다.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 먼저 객관식 응답에서 찾기
  let quizResult = findQuizRecord(studentId, token);
  if (quizResult) {
    // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
  }

  // 그 다음 논술형 응답에서 찾기
  let essayResult = findEssayRecord(studentId, token);
  if (essayResult) {
    // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
  }

  return createJsonResponse({ success: false, message: "학번 또는 토큰이 일치하지 않습니다." });
}

/**
 * 객관식 응답 기록 찾기
 */
function findQuizRecord(studentId, token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RESPONSES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // 열 인덱스 동적으로 찾기 (robust하게)
  let studentIdIndex = headers.indexOf('studentId');
  let tokenIndex = headers.indexOf('token');
  let totalScoreIndex = headers.indexOf('total_score');
  let questionsIndex = headers.indexOf('questions_json');

  if (studentIdIndex === -1) studentIdIndex = 1;
  if (tokenIndex === -1) tokenIndex = headers.length - 2;
  if (totalScoreIndex === -1) totalScoreIndex = headers.length - 3;
  if (questionsIndex === -1) questionsIndex = headers.length - 1;

  let foundRecord = null;
  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    if (String(row[studentIdIndex]) === String(studentId) && String(row[tokenIndex]) === String(token)) {
      foundRecord = row;
      break;
    }
  }

  if (!foundRecord) return null;

  // 피드백 조회
  let feedback = { message: "", comments: Array(20).fill("") };
  const fbSheet = ss.getSheetByName(SHEET_FEEDBACK);
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = fbData.length - 1; i > 0; i--) {
      if (String(fbData[i][0]) === String(studentId)) {
        feedback.message = fbData[i][2] || "";
        feedback.comments = fbData[i].slice(3, 23);
        break;
      }
    }
  }

  // name과 answers도 동적으로 찾기
  let nameIndex = headers.indexOf('name');
  if (nameIndex === -1) nameIndex = 2;

  // Q1-Q20 답변 추출 (동적)
  let q1Index = headers.indexOf('Q1');
  if (q1Index === -1) q1Index = 3; // 기본값: timestamp, studentId, name 다음
  const answerCount = 20;
  const answers = foundRecord.slice(q1Index, q1Index + answerCount);

  const questionsData = JSON.parse(foundRecord[questionsIndex] || '{}');

  return {
    studentId: foundRecord[studentIdIndex],
    name: foundRecord[nameIndex],
    answers: answers,
    totalScore: questionsData.totalScore || foundRecord[totalScoreIndex], // JSON에서 먼저 읽기
    questions: questionsData.questions || [],
    feedback: feedback.message,
    questionComments: feedback.comments
  };
}

/**
 * 논술형 응답 기록 찾기
 */
function findEssayRecord(studentId, token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ESSAY_RESPONSES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // 열 인덱스 동적으로 찾기
  let studentIdIndex = headers.indexOf('studentId');
  let tokenIndex = headers.indexOf('token');
  let answersJsonIndex = headers.indexOf('answers_json');
  if (studentIdIndex === -1) studentIdIndex = 1;
  if (tokenIndex === -1) tokenIndex = 9; // 기본값
  if (answersJsonIndex === -1) answersJsonIndex = headers.length - 1;

  let foundRecord = null;
  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    if (String(row[studentIdIndex]) === String(studentId) && String(row[tokenIndex]) === String(token)) {
      foundRecord = row;
      break;
    }
  }

  if (!foundRecord) return null;

  // name과 answers_json 인덱스 찾기
  let nameIndex = headers.indexOf('name');
  if (nameIndex === -1) nameIndex = 2;

  // 논술형 답변 추출 (Q1_content, Q2_content, Q3_content)
  const answers = JSON.parse(foundRecord[answersJsonIndex] || '[]');

  // 피드백 조회
  let feedback = { message: "", comments: ["", "", ""] };
  const fbSheet = ss.getSheetByName(SHEET_ESSAY_FEEDBACK);
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = fbData.length - 1; i > 0; i--) {
      if (String(fbData[i][0]) === String(studentId)) {
        feedback.message = fbData[i][2] || "";
        feedback.comments = [fbData[i][3] || "", fbData[i][4] || "", fbData[i][5] || ""];
        break;
      }
    }
  }

  return {
    studentId: foundRecord[studentIdIndex],
    name: foundRecord[nameIndex],
    answers: answers,
    feedback: feedback.message,
    questionComments: feedback.comments
  };
}

/**
 * 교사용: 전체 데이터 조회
 */
function handleGetAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RESPONSES);
  const fbSheet = ss.getSheetByName(SHEET_FEEDBACK);

  if (!sheet) // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  // 열 인덱스 동적으로 찾기
  let studentIdIndex = headers.indexOf('studentId');
  let totalScoreIndex = headers.indexOf('total_score');
  let questionsIndex = headers.indexOf('questions_json');
  if (studentIdIndex === -1) studentIdIndex = 1;
  if (totalScoreIndex === -1) totalScoreIndex = headers.length - 3;
  if (questionsIndex === -1) questionsIndex = headers.length - 1;

  // 피드백 매핑 맵 생성
  const feedbackMap = {};
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = 1; i < fbData.length; i++) {
      feedbackMap[String(fbData[i][0])] = {
        message: fbData[i][2] || "",
        comments: fbData[i].slice(3, 23)
      };
    }
  }

  // name과 answers도 동적으로 찾기
  let nameIndex = headers.indexOf('name');
  if (nameIndex === -1) nameIndex = 2;
  let q1Index = headers.indexOf('Q1');
  if (q1Index === -1) q1Index = 3;

  // 데이터 조립 (헤더 제외)
  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;
  const questionsDataIndex = headers.length - 1; // Assuming it's the last column added
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sId = String(row[1]);
    
    // Parse the consolidated JSON column if it exists, otherwise fallback
    let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
    try {
        if(row.length > questionsDataIndex) {
            const rawJson = row[questionsDataIndex];
            if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
                qData = JSON.parse(rawJson);
            } else if (rawJson && typeof rawJson === 'string' && rawJson.startsWith('[')) {
                 // Fallback for older format where we only saved questions array
                 qData.questions = JSON.parse(rawJson);
            }
        }
    } catch(e) { console.error(e); }

    results.push({
      timestamp: row[0],
      studentId: sId,
      name: row[2],
      answers: row.slice(3, 23),
      // Prefer JSON score over raw column score to avoid index mismatch
      totalScore: qData.totalScore || row[totalScoreIndex] || row[23], 
      questions: qData.questions || [],
      correct: qData.correct || Array(20).fill(false),
      feedback: feedbackMap[sId] ? feedbackMap[sId].message : "",
      questionComments: feedbackMap[sId] ? feedbackMap[sId].comments : Array(20).fill("")
    });
  }

  // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
}

/**
 * 교사용: 객관식 피드백 저장
 */
function handleSaveFeedback(params) {
  const studentId = params.studentId;
  const name = params.name;
  const message = params.message;
  const comments = params.comments ? JSON.parse(params.comments) : Array(20).fill("");

  if (!studentId) throw new Error("학번이 필요합니다.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_FEEDBACK);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_FEEDBACK);
    const fbHeaders = ['studentId', 'name', 'feedback_message', ...Array.from({length: 20}, (_, i) => `Q${i+1}_comment`), 'updated_at'];
    sheet.appendRow(fbHeaders);
  }

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  // 기존 피드백 검색
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(studentId)) {
      rowIndex = i + 1;
      break;
    }
  }

  const timestamp = new Date().toISOString();

  const safeComments = Array(20).fill("");
  for(let i=0; i<20; i++) {
    if(comments[i]) safeComments[i] = comments[i];
  }

  const rowData = [studentId, name, message, ...safeComments, timestamp];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
}

/**
 * 교사용: 논술형 전체 데이터 조회
 */
function handleGetEssayAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ESSAY_RESPONSES);
  const fbSheet = ss.getSheetByName(SHEET_ESSAY_FEEDBACK);

  if (!sheet) // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  // 열 인덱스 동적으로 찾기
  let studentIdIndex = headers.indexOf('studentId');
  let nameIndex = headers.indexOf('name');
  let answersJsonIndex = headers.indexOf('answers_json');
  if (studentIdIndex === -1) studentIdIndex = 1;
  if (nameIndex === -1) nameIndex = 2;
  if (answersJsonIndex === -1) answersJsonIndex = headers.length - 1;

  // 피드백 매핑 맵 생성
  const feedbackMap = {};
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = 1; i < fbData.length; i++) {
      feedbackMap[String(fbData[i][0])] = {
        overallFeedback: fbData[i][2] || "",
        comments: [fbData[i][3] || "", fbData[i][4] || "", fbData[i][5] || ""],
        score: fbData[i][6] || ""
      };
    }
  }

  // 데이터 조립
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sId = String(row[studentIdIndex]);
    const answersData = JSON.parse(row[answersJsonIndex] || '[]');

    results.push({
      timestamp: row[0],
      studentId: sId,
      name: row[nameIndex],
      answers: answersData,
      feedback: feedbackMap[sId] ? feedbackMap[sId].overallFeedback : "",
      questionComments: feedbackMap[sId] ? feedbackMap[sId].comments : ["", "", ""],
      score: feedbackMap[sId] ? feedbackMap[sId].score : ""
    });
  }

  // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
}

/**
 * 교사용: 논술형 피드백 저장
 */
function handleSaveEssayFeedback(params) {
  const studentId = params.studentId;
  const name = params.name;
  const overallFeedback = params.overallFeedback || "";
  const comments = params.comments ? JSON.parse(params.comments) : ["", "", ""];
  const score = params.score || "";

  if (!studentId) throw new Error("학번이 필요합니다.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ESSAY_FEEDBACK);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ESSAY_FEEDBACK);
    const fbHeaders = ['studentId', 'name', 'overall_feedback', 'Q1_comment', 'Q2_comment', 'Q3_comment', 'score', 'updated_at'];
    sheet.appendRow(fbHeaders);
  }

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  // 기존 피드백 검색
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(studentId)) {
      rowIndex = i + 1;
      break;
    }
  }

  const timestamp = new Date().toISOString();
  const rowData = [studentId, name, overallFeedback, comments[0] || "", comments[1] || "", comments[2] || "", score, timestamp];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Parse the consolidated JSON column
  const questionsDataIndex = headers.length - 1;
  let qData = { questions: [], correct: Array(20).fill(false), totalScore: null };
  try {
      if(foundRecord.length > questionsDataIndex) {
          const rawJson = foundRecord[questionsDataIndex];
          if(rawJson && typeof rawJson === 'string' && rawJson.startsWith('{')) {
              qData = JSON.parse(rawJson);
          }
      }
  } catch(e) {}

  const totalScoreIndex = headers.indexOf('total_score') !== -1 ? headers.indexOf('total_score') : headers.length - 3;

  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: qData.totalScore || foundRecord[totalScoreIndex] || foundRecord[23],
    questions: qData.questions || [],
    correct: qData.correct || Array(20).fill(false),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
}
