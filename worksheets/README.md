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

Google Docs로 올리려면 Drive에 드래그하면 자동 변환된다. API로 바로 만들려면
GCP 프로젝트에서 Docs API를 켜고 **사용자 OAuth 클라이언트**가 필요하다 —
서비스 계정은 개인 Drive에 파일을 소유할 수 없다(storageQuotaExceeded).

레이아웃 확인:

```bash
libreoffice --headless --convert-to pdf worksheets/*.docx --outdir /tmp/ws
```

## 기존 HTML 학습지

`01_student.html` ~ `06_teacher.html` 등은 이전 방식의 HTML 학습지다.
