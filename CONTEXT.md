# CONTEXT - 2026-mid3-Chem_Physics

## MathJax 및 물리/화학 단위 표기
- 물리 및 화학 단원에서 속력(`m/s`, `km/h`), 시간(`s`, `h`), 거리(`m`, `km`) 등 물리량을 나타내는 단위와 수식을 작성할 때는 일반 텍스트 대신 MathJax (LaTeX)를 일관되게 사용해야 교재 수준의 높은 품질을 확보할 수 있습니다.
- HTML `<head>` 영역에 다음과 같이 MathJax를 설정하여 `$`를 인라인 수식 기호로 사용할 수 있도록 합니다.
  ```html
  <script>
    window.MathJax = {
      tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] }
    };
  </script>
  <script async id="MathJax-script" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  ```
- LaTeX 문법 작성 시 유의사항:
  - **이탤릭체 방지:** 변수(`v`, `t`, `d`)는 기본 이탤릭체로 두지만, **단위는 정자체(로만체)**여야 하므로 반드시 `\mathrm{}`로 감싸줍니다. (예: `\mathrm{m/s}`)
  - **띄어쓰기:** 숫자와 단위 사이는 좁은 공백(`\,`)을 넣어 가독성을 높입니다. (예: `$20\,\mathrm{m/s}$`)
  - 강조 표기가 필요할 경우 `\mathbf{}`를 사용합니다. (예: `\mathbf{30\,\mathrm{m/s}}`)
