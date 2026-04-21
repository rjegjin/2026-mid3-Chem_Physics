# 좀비 공장: 화학 반응식 퀘스트

중학교 3학년 과학 `화학 반응의 규칙` 단원을 복습하기 위한 반응형 방탈출 웹앱입니다. React + Vite + Tailwind CSS 기반으로 제작되었고, 퀘스트 진행, 오답 노트, 제한 시간, 결과 JSON 제출 흐름까지 포함합니다.

## 위치

- 앱 경로: `apps/zombie-factory-escape`
- 상위 저장소: `2026-mid3-Chem_Physics`

## 실행

```bash
npm install
npm run dev
```

브라우저에서 개발 서버를 열면 바로 플레이할 수 있습니다.

## 기능

- 10분 제한 타이머
- 인벤토리 기반 단서 수집
- 물리 변화/화학 변화 문제
- 화학 반응식 계수 맞추기
- 질량 보존 법칙 문제
- 기체 반응 법칙 문제
- 최종 자물쇠 단답 입력
- 오답 시 화면 흔들림과 힌트 제공
- Web Audio 기반 효과음 구조
- 이름, 학번, 소요 시간, 오답 노트를 JSON으로 출력
- 선택적으로 API `POST` 제출

## 결과 제출

기본 동작은 화면에 JSON 결과를 출력하는 것입니다.

API 전송도 함께 사용하려면 앱 실행 전에 전역 변수를 설정하면 됩니다.

```js
window.__ZOMBIE_ESCAPE_SUBMIT_ENDPOINT = 'https://example.com/api/results'
```

이 값이 존재하면 결과 제출 버튼 클릭 시 JSON 생성 후 해당 주소로 `POST`를 시도합니다.

## 핸드오프

다른 AI 도구가 이 프로젝트를 바로 이해하고 이어서 수정할 수 있도록 [RAW_SPEC.md](./RAW_SPEC.md)를 함께 제공합니다.
