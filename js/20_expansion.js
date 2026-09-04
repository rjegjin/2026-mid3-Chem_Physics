/* 20_expansion.js — 20강 '고무줄 우주' 팽창 모형
 *
 * 이 차시의 핵심 질문은 "모두가 우리에게서 멀어지면 우리가 중심인가"다.
 * 정적인 그림으로는 답이 안 나온다 — 관측자를 바꿔 가며 같은 팽창을 다시
 * 재 봐야 "어디서 봐도 똑같다"가 관찰이 된다. 그래서 애플릿이 필요하다.
 *
 * 모형: 은하 네 개가 고무줄 눈금 0·1·2·3 칸에 붙어 있다. 고무줄을 배율 a로
 * 늘이면 j번 은하의 위치는 a·x_j 가 된다. 관측자 o가 보는 j까지의 거리는
 *
 *   d  = a·|x_j − x_o|        늘어난 거리 Δ = (a−1)·|x_j − x_o|
 *
 * Δ가 처음 거리 |x_j − x_o| 에 비례한다 — 이것이 '멀수록 빠르다'이고,
 * o를 무엇으로 잡아도 성립한다는 것이 '중심이 없다'이다. 관측자를 바꾸는
 * 버튼 하나가 이 차시의 결론을 통째로 보여 준다.
 *
 * 정량 계산(허블 상수, 실제 속도)은 중3 범위 밖이므로 속도는 절대값을 쓰지
 * 않고 '가장 가까운 은하의 몇 배'라는 상대값으로만 말한다.
 */
(function () {
  'use strict';

  var X = [0, 1, 2, 3];                      // 고무줄 위의 눈금 위치 (칸)
  var NAME = ['A', 'B', 'C', 'D'];
  var SPAN = 9;                              // 가장 많이 늘였을 때의 전체 길이 (3칸 × 3배)
  var PX0 = 60, PX1 = 800, ROW = 74;

  function boot() {
    var svg = document.getElementById('exp-svg');
    if (!svg) return;                        // 이 차시가 아니다

    var slider = document.getElementById('exp-a');
    var out = document.getElementById('exp-a-out');
    var rows = document.getElementById('exp-rows');
    var live = document.getElementById('exp-live');
    var picks = [].slice.call(document.querySelectorAll('#obs-picks [data-obs]'));
    var obs = 0;

    function px(cell) { return PX0 + (PX1 - PX0) * cell / SPAN; }

    function ns(tag, attrs, text) {
      var n = document.createElementNS('http://www.w3.org/2000/svg', tag), k;
      for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
      if (text !== undefined) n.textContent = text;
      return n;
    }

    function draw(a) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(ns('rect', { x: 0, y: 0, width: 860, height: 150, fill: '#fdf2f8', rx: 14 }));

      // 고무줄. 늘어난 만큼만 그린다 — 남은 자리가 비어 있어야 '늘어났다'가 보인다.
      svg.appendChild(ns('line', {
        x1: px(0), y1: ROW, x2: px(3 * a), y2: ROW, stroke: '#f9a8d4', 'stroke-width': 9, 'stroke-linecap': 'round'
      }));

      // 눈금. 고무줄에 그은 선이므로 이것도 함께 늘어난다.
      var t;
      for (t = 0; t <= 3; t += 0.25) {
        svg.appendChild(ns('line', {
          x1: px(t * a), y1: ROW - 9, x2: px(t * a), y2: ROW + 9,
          stroke: '#fbcfe8', 'stroke-width': 2
        }));
      }

      X.forEach(function (x, j) {
        var cx = px(x * a), me = j === obs;
        svg.appendChild(ns('circle', {
          cx: cx, cy: ROW, r: me ? 15 : 11,
          fill: me ? '#9d174d' : '#db2777', stroke: '#fff', 'stroke-width': 3
        }));
        svg.appendChild(ns('text', {
          x: cx, y: ROW - 26, fill: '#9d174d', 'font-size': 17, 'font-weight': 'bold', 'text-anchor': 'middle'
        }, NAME[j]));
        if (me) {
          svg.appendChild(ns('text', {
            x: cx, y: ROW + 40, fill: '#9d174d', 'font-size': 15, 'font-weight': 'bold', 'text-anchor': 'middle'
          }, '◀ 나'));
        }
      });

      svg.appendChild(ns('text', { x: PX0, y: 132, fill: '#64748b', 'font-size': 14 },
        '고무줄 길이 ' + (3 * a).toFixed(2) + ' 칸 (처음 3 칸)'));
    }

    function render() {
      var a = Number(slider.value) / 100;
      out.textContent = '×' + a.toFixed(2);
      draw(a);

      // 관측자에서 가장 가까운 은하의 처음 거리 — 상대 빠르기의 기준이 된다.
      var base = Math.min.apply(null, X.map(function (x, j) {
        return j === obs ? Infinity : Math.abs(x - X[obs]);
      }));

      rows.innerHTML = X.map(function (x, j) {
        if (j === obs) {
          return '<tr class="me"><td>' + NAME[j] + ' (나)</td><td colspan="4">내가 사는 은하 — 나는 늘 제자리에 있는 것처럼 보인다</td></tr>';
        }
        var d0 = Math.abs(x - X[obs]);
        var d = a * d0;
        var grew = (a - 1) * d0;
        return '<tr><td><b>' + NAME[j] + '</b></td>' +
               '<td>' + d0.toFixed(0) + ' 칸</td>' +
               '<td>' + d.toFixed(2) + ' 칸</td>' +
               '<td>' + grew.toFixed(2) + ' 칸</td>' +
               '<td>' + (a > 1.001 ? (d0 / base).toFixed(0) + ' 배' : '—') + '</td></tr>';
      }).join('');

      var far = null, farD = -1;
      X.forEach(function (x, j) {
        var d0 = Math.abs(x - X[obs]);
        if (j !== obs && d0 > farD) { farD = d0; far = NAME[j]; }
      });
      // 아직 늘이지 않았는데 '멀어졌다'고 읽어 주면 관찰이 아니라 결론을 먼저 주는 셈이다.
      live.textContent = a > 1.001
        ? '관측자는 ' + NAME[obs] + ' 은하, 고무줄은 ' + a.toFixed(2) +
          '배로 늘어났다. 다른 은하는 모두 ' + NAME[obs] + '에서 멀어졌고, 가장 먼 ' + far +
          ' 은하가 가장 많이 멀어졌다.'
        : '관측자는 ' + NAME[obs] + ' 은하. 아직 고무줄을 늘이지 않았다 — 슬라이더를 오른쪽으로 밀어 보자.';
    }

    picks.forEach(function (b) {
      b.addEventListener('click', function () {
        obs = Number(b.getAttribute('data-obs'));
        picks.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        render();
      });
      // slide_engine.js가 문서 전체에서 좌우 화살표와 Space를 슬라이드 이동에 쓴다.
      // 버튼 위에서 그 키를 누르면 조작 대신 슬라이드가 넘어가므로 여기서 막는다.
      b.addEventListener('keydown', stopNavKeys);
    });
    slider.addEventListener('input', render);
    slider.addEventListener('keydown', stopNavKeys);

    function stopNavKeys(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') e.stopPropagation();
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
