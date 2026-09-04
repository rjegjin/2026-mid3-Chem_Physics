/** cdn.tailwindcss.com 대체용 정적 빌드 설정.
 *  js/도 스캔한다 — slide_engine.js가 런타임에 ring-4 / animate-bounce 등을 붙인다. */
module.exports = {
  // adv_inorganic/ 은 별도 폴더라 ./*.html 에 걸리지 않는다. 이게 빠져 있으면
  // test_css_classes.py 가 검사하는 파일을 빌드가 스캔하지 않아, 다시 빌드할 때마다
  // 그쪽 클래스가 통째로 사라진다.
  content: ["./*.html", "./adv_inorganic/*.html", "./js/*.js"],
  theme: { extend: {} },
  plugins: [],
};
