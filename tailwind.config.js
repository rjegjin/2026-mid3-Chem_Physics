/** cdn.tailwindcss.com 대체용 정적 빌드 설정.
 *  js/도 스캔한다 — slide_engine.js가 런타임에 ring-4 / animate-bounce 등을 붙인다. */
module.exports = {
  content: ["./*.html", "./js/*.js"],
  theme: { extend: {} },
  plugins: [],
};
