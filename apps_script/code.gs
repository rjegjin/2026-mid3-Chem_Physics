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
 * POST 요청 처리: 퀴즈 제출
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

    const studentId = data.studentId;
    const name = data.name;
    const answers = data.answers || []; // ["1", "3", "2", ...]
    const correct = data.correct || []; // [true, false, true, ...]
    
    if (!studentId || !name) {
      throw new Error("학번과 이름은 필수입니다.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_RESPONSES);
    
    // 시트가 없으면 생성하고 헤더 작성
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_RESPONSES);
      const headers = ['timestamp', 'studentId', 'name', ...Array.from({length: 20}, (_, i) => `Q${i+1}`), 'total_score', 'token', 'questions_json'];
      sheet.appendRow(headers);
    }

    // UUID 생성 (토큰용)
    const token = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    
    // 정답 개수 계산
    const correctCount = correct.filter(c => c === true).length;
    const totalScore = `${correctCount}/${correct.length}`;

    // 행 데이터 준비
    const rowData = [timestamp, studentId, name, ...answers, totalScore, token, JSON.stringify(data.questions || [])];
    
    // 기존에 제출한 이력이 있다면 업데이트(마지막 제출 인정)하거나 새로 추가
    // 여기서는 무조건 새로 추가하는 방식으로 구현 (히스토리 보존)
    sheet.appendRow(rowData);

    // 피드백 시트 초기화 (행이 없다면)
    let feedbackSheet = ss.getSheetByName(SHEET_FEEDBACK);
    if (!feedbackSheet) {
      feedbackSheet = ss.insertSheet(SHEET_FEEDBACK);
      const fbHeaders = ['studentId', 'name', 'feedback_message', ...Array.from({length: 20}, (_, i) => `Q${i+1}_comment`), 'updated_at'];
      feedbackSheet.appendRow(fbHeaders);
    }

    // 성공 응답 반환
    return createJsonResponse({
      success: true,
      token: token,
      totalScore: totalScore,
      message: "성공적으로 제출되었습니다."
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
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
    } else if (action === 'save_feedback') {
      // GET 방식의 편법으로 피드백 저장 (JSONP 형태 지원 위해)
      // 실제 프로덕션에서는 POST가 좋으나, 간단한 연동을 위해 허용
      return handleSaveFeedback(e.parameter);
    } else {
      return createJsonResponse({ success: false, error: "알 수 없는 액션입니다." });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * 학생 검증 및 결과/피드백 조회
 */
function handleVerify(params) {
  const studentId = params.studentId;
  const token = params.token;
  
  if (!studentId || !token) throw new Error("학번과 토큰이 필요합니다.");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RESPONSES);
  if (!sheet) throw new Error("데이터 시트가 없습니다.");
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let foundRecord = null;
  // 가장 최신 제출 기록을 찾기 위해 뒤에서부터 검색
  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    // index 24 = token (headers.length - 2)
    if (String(row[1]) === String(studentId) && String(row[headers.length - 2]) === String(token)) {
      foundRecord = row;
      break;
    }
  }
  
  if (!foundRecord) {
    return createJsonResponse({ success: false, message: "학번 또는 토큰이 일치하지 않습니다." });
  }
  
  // 피드백 조회
  let feedback = { message: "", comments: Array(20).fill("") };
  const fbSheet = ss.getSheetByName(SHEET_FEEDBACK);
  if (fbSheet) {
    const fbData = fbSheet.getDataRange().getValues();
    for (let i = fbData.length - 1; i > 0; i--) {
      if (String(fbData[i][0]) === String(studentId)) {
        feedback.message = fbData[i][2] || "";
        feedback.comments = fbData[i].slice(3, 23); // Q1~Q15 코멘트
        break;
      }
    }
  }
  
  return createJsonResponse({
    success: true,
    studentId: foundRecord[1],
    name: foundRecord[2],
    answers: foundRecord.slice(3, 23),
    totalScore: foundRecord[headers.length - 3], // shifted due to questions_json
    questions: JSON.parse(foundRecord[headers.length - 1] || '[]'),
    feedback: feedback.message,
    questionComments: feedback.comments
  });
}

/**
 * 교사용: 전체 데이터 조회
 */
function handleGetAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RESPONSES);
  const fbSheet = ss.getSheetByName(SHEET_FEEDBACK);
  
  if (!sheet) return createJsonResponse({ success: true, data: [] });
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  
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
  
  // 데이터 조립 (헤더 제외)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sId = String(row[1]);
    results.push({
      timestamp: row[0],
      studentId: sId,
      name: row[2],
      answers: row.slice(3, 23),
      totalScore: row[headers.length - 3],
      questions: JSON.parse(row[headers.length - 1] || '[]'),
      feedback: feedbackMap[sId] ? feedbackMap[sId].message : ""
    });
  }
  
  return createJsonResponse({ success: true, data: results });
}

/**
 * 교사용: 피드백 저장
 */
function handleSaveFeedback(params) {
  const studentId = params.studentId;
  const name = params.name;
  const message = params.message;
  // params.comments 는 JSON 문자열 배열로 받음 (예: "['코멘트1','','코멘트3',...]")
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
      rowIndex = i + 1; // 1-based index
      break;
    }
  }
  
  const timestamp = new Date().toISOString();
  
  // 15개 코멘트 길이를 맞춰줌
  const safeComments = Array(20).fill("");
  for(let i=0; i<15; i++) {
    if(comments[i]) safeComments[i] = comments[i];
  }

  const rowData = [studentId, name, message, ...safeComments, timestamp];
  
  if (rowIndex > -1) {
    // 업데이트
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // 새로 추가
    sheet.appendRow(rowData);
  }
  
  return createJsonResponse({ success: true, message: "피드백이 저장되었습니다." });
}
