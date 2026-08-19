# worksheets

## 15·16강 학습지 (docx)

`make_worksheets.py`가 `docs/WORKSHEET_CREATION_WORKFLOW.md`에 따라 4개 파일을 만든다.

```bash
../unified_venv/bin/python worksheets/make_worksheets.py
```

- `15강_학습지_학생용.docx` / `15강_학습지_교사용.docx`
- `16강_학습지_학생용.docx` / `16강_학습지_교사용.docx`

문구를 고칠 때는 docx가 아니라 **스크립트를 고치고 다시 생성**한다. 손글씨 공간
규칙(서술형은 1열 전체 폭, 최소 2줄, 이유 설명 3줄, 표의 서술 셀 높이, 표·문항의
페이지 분할 금지)이 코드에 들어 있어서 직접 편집하면 그 규칙이 조용히 깨진다.

## Google Docs로 올리기

Drive에 드래그해도 자동 변환되지만, `push_to_gdocs.py`로 한 번에 올릴 수 있다.

```bash
../unified_venv/bin/python worksheets/push_to_gdocs.py
```

준비는 한 번만 하면 된다.

1. https://console.cloud.google.com/apis/credentials 에서
   **OAuth 클라이언트 ID → 데스크톱 앱** 생성
2. 받은 JSON을 `~/projects/.secrets/oauth_client.json`으로 저장
3. 스크립트 실행 → 브라우저에서 한 번 동의 (토큰은 `.secrets/gdocs_token.json`)

**Docs API는 켤 필요 없다.** docx를 올리면서 변환시키므로 Drive API만 쓴다.
서비스 계정(`service_key.json`)으로는 안 된다 — 개인 Drive에 파일을 소유할 수
없어 `storageQuotaExceeded`가 난다. 그래서 사용자 본인 자격으로 올린다.

다시 실행하면 `.gdocs_ids.json`에 기억된 문서를 **갱신**한다. 링크가 바뀌지 않는다.

레이아웃 확인:

```bash
libreoffice --headless --convert-to pdf worksheets/*.docx --outdir /tmp/ws
```

## 기존 HTML 학습지

`01_student.html` ~ `06_teacher.html` 등은 이전 방식의 HTML 학습지다.
