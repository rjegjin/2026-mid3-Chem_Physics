/* 21_timeline.js — 21강 우주 탐사 연표
 *
 * 이 차시의 요구는 "역사 + 최신"이다. 70년치 사건을 카드로 나열하면 슬라이드가
 * 열여섯 장 필요하고, 그러면 학생은 구조가 아니라 목록만 읽는다. 연표에서 점을
 * 고르면 사진과 설명이 바뀌는 한 장이 그 열여섯 장을 대신한다.
 *
 * 각 사건에는 '무엇을 처음 해냈나'를 한 줄로 붙인다. 연도를 외우게 하려는 것이
 * 아니라, 탐사가 매번 한 칸씩 나아갔다는 것을 보게 하려는 것이다.
 * 사진은 본문에서 쓰는 img/spx_* 를 그대로 공유한다 — 새로 받지 않는다.
 */
(function () {
  'use strict';

  var EVENTS = [
    { y: 1957, label: '스푸트니크 1호', img: 'img/spx_sputnik.jpg',
      credit: 'U.S. Air Force · PD',
      alt: '스푸트니크 1호. 반짝이는 금속 공에 가느다란 안테나 네 개가 뒤로 뻗어 있다.',
      desc: '지름 58 cm짜리 금속 공이 삐- 소리만 보내며 지구를 돌았다. 그 소리에 세계가 뒤집혔고, 이듬해 NASA가 세워졌다.',
      first: '최초의 인공위성' },
    { y: 1961, label: '가가린', img: 'img/spx_gagarin.jpg',
      credit: 'Arto Jousi / 핀란드 사진박물관 · PD',
      alt: '유리 가가린의 사진. 정복 차림으로 정면을 보며 웃고 있다.',
      desc: '유리 가가린이 108분 만에 지구를 한 바퀴 돌았다. 스물일곱 살이었다. "지구는 푸른빛이었다"는 말을 남겼다.',
      first: '최초의 유인 우주 비행' },
    { y: 1969, label: '아폴로 11호', img: 'img/spx_apollo_boot.jpg',
      credit: 'NASA / B. Aldrin · PD',
      alt: '달 표면의 흙에 찍힌 우주화 발자국. 격자무늬 밑창 자국이 또렷하다.',
      desc: '스푸트니크로부터 12년 만이었다. 착륙선 컴퓨터가 경보를 울리자 사람이 직접 조종해, 연료가 20초 남았을 때 내려앉았다.',
      first: '최초의 달 착륙' },
    { y: 1977, label: '보이저 1·2호', img: 'img/spx_voyager.png',
      credit: 'NASA · PD',
      alt: '보이저 탐사선의 모형. 커다란 접시 안테나와 긴 안테나 두 개가 뻗어 있다.',
      desc: '목성·토성·천왕성·해왕성을 차례로 지나도록 176년에 한 번 오는 행성 배열을 노려 쏘았다. 49년째 날고 있다.',
      first: '최초로 태양계를 벗어난 탐사선' },
    { y: 1990, label: '창백한 푸른 점', img: 'img/spx_pale_blue_dot.png',
      credit: 'NASA/JPL-Caltech · PD',
      alt: '거의 검은 화면에 옅은 빛줄기가 지나가고, 그 안에 지구가 아주 작은 점으로 찍혀 있다.',
      desc: '보이저 1호가 60억 km 밖에서 카메라를 뒤로 돌려 찍었다. 지구는 0.12화소였다. 같은 해 허블 우주망원경도 올라갔다.',
      first: '가장 먼 곳에서 찍은 지구' },
    { y: 2018, label: '파커 태양 탐사선', img: 'img/spx_parker.jpg',
      credit: 'NASA/JHU APL · PD',
      alt: '커다란 흰색 열 차폐막을 앞세운 탐사선이 태양의 붉은 빛을 향해 날아가는 상상도.',
      desc: '태양의 대기 안까지 들어갔다. 앞면은 1,400 ℃인데 뒤쪽 장비는 30 ℃다. 인류가 만든 가장 빠른 물체이기도 하다.',
      first: '최초로 태양 대기 안에 들어간 탐사선' },
    { y: 2022, label: '웹의 첫 사진', img: 'img/spx_webb_deepfield.jpg',
      credit: 'NASA, ESA, CSA, STScI · PD',
      alt: '검은 하늘에 은하 수천 개가 흩어져 있고, 뒤쪽 은하들이 활처럼 휘어 보인다.',
      desc: '거울을 접어서 올린 뒤 우주에서 펼쳤다. 첫 사진이 담은 넓이는 팔을 뻗어 든 모래 한 알만 하다.',
      first: '인류가 본 가장 깊은 사진' },
    { y: 2022, label: 'DART', img: 'img/spx_dart.jpg',
      credit: 'NASA/JHU APL · PD',
      alt: '충돌 3초 전에 찍은 소행성 디모르포스. 잿빛 바위가 화면을 가득 채운다.',
      desc: '소행성에 우주선을 일부러 부딪쳐 궤도를 바꿨다. 성공이었다. 만일에 대비한 연습이다.',
      first: '최초로 천체의 궤도를 바꾼 실험' },
    { y: 2022, label: '다누리', img: 'img/spx_danuri.png',
      credit: '과학기술정보통신부 · 공공누리 제1유형',
      alt: '달 궤도를 도는 다누리 탐사선의 상상도. 태양 전지판을 펼친 본체가 달 위를 지난다.',
      desc: '연료를 아끼려고 곧장 가지 않고 태양 쪽으로 크게 돌아가는 길을 택했다. 4개월 반이 걸렸고, 지금도 달을 돌고 있다.',
      first: '우리나라 최초의 달 궤도선' },
    { y: 2025, label: '누리호 4차', img: 'img/spx_nuri.jpg',
      credit: '한국항공우주연구원 · 공공누리 제1유형',
      alt: '누리호가 화염을 뿜으며 발사대를 떠나는 장면.',
      desc: '2025년 11월 27일. 민간 기업이 제작과 조립을 총괄한 첫 발사이자, 우주항공청이 문을 연 뒤 첫 발사였다.',
      first: '민간이 주도한 우리나라 첫 발사' },
    { y: 2026, label: '아르테미스 II', img: 'img/spx_artemis2_launch.jpg',
      credit: 'NASA HQ Photo · PD',
      alt: '아르테미스 2호 SLS 로켓이 눈부신 화염을 뿜으며 솟아오르는 장면.',
      desc: '2026년 4월 1일, 우주인 네 명이 달을 돌아 열흘 만에 돌아왔다. 사람이 달 근처까지 간 것은 1972년 이후 53년 만이다.',
      first: '53년 만의 유인 달 비행' },
    { y: 2026, label: '로만 망원경', img: 'img/spx_roman_launch.jpg',
      credit: 'NASA/Joel Kowsky · PD',
      alt: '로만 우주망원경을 실은 로켓이 어두운 하늘로 긴 불꽃 기둥을 남기며 올라가는 장면.',
      desc: '2026년 8월 30일 발사. 허블만 한 눈에 100배 넓은 시야를 가졌다. 지금 3개월짜리 항해 중이고 첫 사진은 2027년 초에 온다.',
      first: '이 수업을 만들 때 가장 최근의 발사' }
  ];

  var Y0 = 1955, Y1 = 2028, X0 = 40, X1 = 840, ROW = 52;

  function boot() {
    var svg = document.getElementById('tl-svg');
    if (!svg) return;                       // 이 차시가 아니다

    var picks = document.getElementById('tl-picks');
    var el = {
      img: document.getElementById('tl-img'), credit: document.getElementById('tl-credit'),
      year: document.getElementById('tl-year'), name: document.getElementById('tl-name'),
      desc: document.getElementById('tl-desc'), first: document.getElementById('tl-first'),
      live: document.getElementById('tl-live')
    };
    var cur = 0;

    function px(y) { return X0 + (X1 - X0) * (y - Y0) / (Y1 - Y0); }

    function ns(tag, attrs, text) {
      var n = document.createElementNS('http://www.w3.org/2000/svg', tag), k;
      for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
      if (text !== undefined) n.textContent = text;
      return n;
    }

    // 버튼은 한 번만 만든다. 엔진이 슬라이드를 다시 그려도 리스너가 살아 있어야 한다.
    EVENTS.forEach(function (e, i) {
      var b = document.createElement('button');
      b.className = 'pick';
      b.type = 'button';
      b.style.fontSize = '0.92rem';
      b.style.padding = '0.3rem 0.6rem';
      b.setAttribute('aria-pressed', String(i === 0));
      b.textContent = e.y + ' ' + e.label;
      b.addEventListener('click', function () { select(i); });
      // slide_engine.js가 문서 전체에서 좌우 화살표를 슬라이드 이동에 쓴다.
      b.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
          ev.stopPropagation();
          ev.preventDefault();
          select((i + (ev.key === 'ArrowRight' ? 1 : EVENTS.length - 1)) % EVENTS.length, true);
        } else if (ev.key === ' ') {
          ev.stopPropagation();
        }
      });
      picks.appendChild(b);
    });

    function drawAxis() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(ns('rect', { x: 0, y: 0, width: 880, height: 96, fill: '#ecfdf5', rx: 12 }));
      svg.appendChild(ns('line', { x1: X0, y1: ROW, x2: X1, y2: ROW, stroke: '#6ee7b7', 'stroke-width': 5, 'stroke-linecap': 'round' }));

      [1960, 1980, 2000, 2020].forEach(function (y) {
        svg.appendChild(ns('line', { x1: px(y), y1: ROW - 8, x2: px(y), y2: ROW + 8, stroke: '#a7f3d0', 'stroke-width': 2 }));
        svg.appendChild(ns('text', { x: px(y), y: 88, fill: '#047857', 'font-size': 14, 'text-anchor': 'middle' }, String(y)));
      });

      EVENTS.forEach(function (e, i) {
        var on = i === cur;
        svg.appendChild(ns('circle', {
          cx: px(e.y), cy: ROW, r: on ? 11 : 6,
          fill: on ? '#065f46' : '#059669', stroke: '#fff', 'stroke-width': on ? 3 : 2
        }));
        if (on) {
          svg.appendChild(ns('text', {
            x: Math.min(Math.max(px(e.y), 70), X1 - 30), y: 26,
            fill: '#065f46', 'font-size': 16, 'font-weight': 'bold', 'text-anchor': 'middle'
          }, e.y + ' ' + e.label));
        }
      });
    }

    function select(i, focus) {
      cur = i;
      var e = EVENTS[i];
      el.img.src = e.img;
      el.img.alt = e.alt;
      el.credit.textContent = e.credit;
      el.year.textContent = e.y;
      el.name.textContent = e.label;
      el.desc.textContent = e.desc;
      el.first.textContent = '처음 해낸 일 — ' + e.first;
      // 화면에 이미 같은 문장이 보이므로 aria-live에는 요약만 넣는다.
      // 같은 문단을 두 번 찍으면 읽는 사람에게도 듣는 사람에게도 군더더기다.
      el.live.textContent = '선택: ' + e.y + '년 ' + e.label + ' — ' + e.first;
      Array.prototype.forEach.call(picks.children, function (b, j) {
        b.setAttribute('aria-pressed', String(j === i));
      });
      if (focus) picks.children[i].focus();
      drawAxis();
    }

    select(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
