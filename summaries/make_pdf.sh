#!/bin/sh
# 요약본 HTML -> PDF. chromium은 render_check.py가 이미 쓰는 것을 그대로 쓴다.
# 새 의존성(weasyprint 등)을 들이지 않는 이유는, 슬라이드와 같은 엔진으로 찍어야
# 글꼴·여백이 화면에서 본 것과 어긋나지 않기 때문이다.
#
#   sh summaries/make_pdf.sh            # 전부
#   sh summaries/make_pdf.sh unit1      # 하나만
set -e
cd "$(dirname "$0")/.."

CHROME=$(command -v chromium-browser || command -v chromium || command -v google-chrome)
[ -n "$CHROME" ] || { echo "chromium을 찾을 수 없다"; exit 1; }

PORT=8931
python3 -m http.server $PORT >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1

mkdir -p summaries/pdf
PAT="${1:-unit}"
for f in summaries/${PAT}*.html; do
  [ -e "$f" ] || continue
  out="summaries/pdf/$(basename "${f%.html}").pdf"
  "$CHROME" --headless --disable-gpu --no-sandbox \
    --no-pdf-header-footer \
    --print-to-pdf="$out" \
    --virtual-time-budget=4000 \
    "http://127.0.0.1:$PORT/$f" 2>/dev/null
  printf '%-46s %s\n' "$out" "$(du -h "$out" | cut -f1)"
done
