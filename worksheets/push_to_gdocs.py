#!/usr/bin/env python3
"""학습지 docx를 Google Docs로 올린다 (사용자 OAuth).

왜 서비스 계정이 아닌가: 서비스 계정은 개인 Drive에 파일을 소유할 수 없다.
.secrets/service_key.json으로 만들면 storageQuotaExceeded로 거절당한다.
그래서 사용자 본인 자격으로 올린다 — 파일 주인도 사용자가 된다.

Docs API는 쓰지 않는다. docx를 올리면서 Google Docs로 변환시키면
표·밑줄·A4 여백이 그대로 넘어가므로 batchUpdate로 다시 그릴 이유가 없다.

준비 (한 번만):
  1) https://console.cloud.google.com/apis/credentials 에서
     'OAuth 클라이언트 ID' → 애플리케이션 유형 '데스크톱 앱' 생성
  2) 받은 JSON을 ~/projects/.secrets/oauth_client.json 으로 저장
  3) 이 스크립트 실행 → 브라우저에서 한 번 동의 (토큰은 .secrets에 저장됨)

실행:
  ../unified_venv/bin/python worksheets/push_to_gdocs.py
  ../unified_venv/bin/python worksheets/push_to_gdocs.py --folder <Drive폴더ID>
"""
import argparse
import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

HERE = Path(__file__).parent
SECRETS = Path.home() / "projects/.secrets"
CLIENT = SECRETS / "oauth_client.json"
TOKEN = SECRETS / "gdocs_token.json"
# 올린 문서 ID를 기억해 두어야 다시 실행할 때 새 문서가 생기지 않고 갱신된다
IDMAP = HERE / ".gdocs_ids.json"

# 이 앱이 만든 파일만 건드린다. 사용자의 다른 Drive 파일은 보이지 않는다.
SCOPES = ["https://www.googleapis.com/auth/drive.file"]
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

FILES = [
    "15강_학습지_학생용.docx",
    "15강_학습지_교사용.docx",
    "16강_학습지_학생용.docx",
    "16강_학습지_교사용.docx",
]


def credentials():
    creds = None
    if TOKEN.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        if not CLIENT.exists():
            raise SystemExit(
                f"{CLIENT} 없음.\n"
                "console.cloud.google.com/apis/credentials 에서 '데스크톱 앱' "
                "OAuth 클라이언트를 만들어 이 경로에 저장하세요."
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT), SCOPES)
        # 브라우저가 뜨지 않는 환경이면 출력되는 URL을 직접 열면 된다
        creds = flow.run_local_server(port=0)
        TOKEN.write_text(creds.to_json(), encoding="utf-8")
        TOKEN.chmod(0o600)
    return creds


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder", help="넣을 Drive 폴더 ID (없으면 내 드라이브 최상위)")
    args = ap.parse_args()

    drive = build("drive", "v3", credentials=credentials(), cache_discovery=False)
    ids = json.loads(IDMAP.read_text(encoding="utf-8")) if IDMAP.exists() else {}

    for name in FILES:
        path = HERE / name
        if not path.exists():
            print(f"건너뜀 (파일 없음): {name}")
            continue
        title = path.stem
        media = MediaFileUpload(str(path), mimetype=DOCX, resumable=False)

        if name in ids:
            # 같은 문서를 갱신한다 — 링크가 바뀌지 않는다
            f = drive.files().update(fileId=ids[name], media_body=media,
                                     fields="id,webViewLink").execute()
            action = "갱신"
        else:
            body = {"name": title, "mimeType": "application/vnd.google-apps.document"}
            if args.folder:
                body["parents"] = [args.folder]
            f = drive.files().create(body=body, media_body=media,
                                     fields="id,webViewLink").execute()
            ids[name] = f["id"]
            action = "생성"
        print(f"{action}: {title}\n  {f['webViewLink']}")

    IDMAP.write_text(json.dumps(ids, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
