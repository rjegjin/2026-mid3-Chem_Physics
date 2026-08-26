/* adv_inorganic_07.js — Module 07 결정장 갈라짐·CFSE 조작기
 *
 * 기하 × d 전자수 × 스핀 상태의 조합이 3 × 11 × 2 로 66가지라 정적 그림으로는
 * 가르칠 수 없다. 그래서 이 모듈만 애플릿을 만든다 (ADV_INORGANIC_ROADMAP 제작 기준).
 * js/chem_sim.js는 대칭 조작 데모(분자 회전·행렬 표시)여서 재사용하지 못했다.
 *
 * 에너지는 모두 무게중심(barycentre)을 0으로 둔 모형값이다.
 *   Oh   t2g = -0.4,  eg = +0.6                       [Δo 단위]
 *   Td   e   = -0.6,  t2 = +0.4                       [Δt 단위, Δt ≈ (4/9)Δo]
 *   D4h  dxz,dyz = -0.514 · dz2 = -0.428 ·
 *        dxy = +0.228 · dx2-y2 = +1.228               [Δo 단위]
 * D4h 값은 교과서 표준 모형값이고, dz2와 dxy의 순서는 리간드에 따라 뒤집힐 수 있다.
 * 그 점은 본문 슬라이드에 적어 두었다.
 */
(function () {
  'use strict';

  function sub(base, s) {   // SVG용 아래첨자
    return base + '<tspan baseline-shift="sub" font-size="10">' + s + '</tspan>';
  }

  var GEOM = {
    Oh: {
      label: '팔면체 (Oh)', unit: 'Δo',
      levels: [
        { svg: sub('t', '2g'), plain: 't2g', e: -0.4, n: 3 },
        { svg: sub('e', 'g'), plain: 'eg', e: 0.6, n: 2 }
      ],
      note: '리간드를 정면으로 겨누는 e<sub>g</sub> 두 개가 올라가고, 리간드 <b>사이</b>를 향하는 t<sub>2g</sub> 세 개가 내려간다.',
      spinChoice: true
    },
    Td: {
      label: '사면체 (Td)', unit: 'Δt',
      levels: [
        { svg: 'e', plain: 'e', e: -0.6, n: 2 },
        { svg: sub('t', '2'), plain: 't2', e: 0.4, n: 3 }
      ],
      note: '라벨이 <b>뒤집힌다</b>. 리간드가 4개뿐이고 어느 축도 정면으로 겨누지 않아 Δ<sub>t</sub> ≈ (4/9)Δ<sub>o</sub> 로 작다.',
      spinChoice: false
    },
    D4h: {
      label: '평면사각 (D4h)', unit: 'Δo',
      levels: [
        { svg: sub('d', 'xz') + ', ' + sub('d', 'yz'), plain: 'dxz, dyz', e: -0.514, n: 2 },
        { svg: sub('d', 'z²'), plain: 'dz²', e: -0.428, n: 1 },
        { svg: sub('d', 'xy'), plain: 'dxy', e: 0.228, n: 1 },
        { svg: sub('d', 'x²−y²'), plain: 'dx²−y²', e: 1.228, n: 1 }
      ],
      note: 'z축 리간드를 무한히 멀리 보낸 극한. d<sub>x²−y²</sub>만 유난히 높아 d<sup>8</sup>이 반자성 저스핀이 된다.',
      spinChoice: true
    }
  };

  /* 전자를 채운다.
     고스핀: d 집합 전체에 하나씩 먼저(Hund) → 그 뒤 짝짓기
     저스핀: 낮은 준위를 다 채우고 올라간다. 단 **준위 안에서는 Hund를 지킨다** —
             t2g⁴는 ↑↓ ↑ ↑ (홀전자 2)이고 ↑↓ ↑↓ (홀전자 0)이 아니다.
             저스핀은 '최대한 짝짓기'가 아니라 '낮은 준위에 몰기'다. */
  function hundWithin(group, left) {
    for (var pass = 0; pass < 2 && left > 0; pass++) {
      for (var i = 0; i < group.length && left > 0; i++) {
        if (group[i].c === pass) { group[i].c++; left--; }
      }
    }
    return left;
  }

  function fill(levels, n, lowSpin) {
    var slots = [];
    levels.forEach(function (L, li) {
      for (var k = 0; k < L.n; k++) slots.push({ li: li, e: L.e, c: 0 });
    });
    var left = n;
    if (lowSpin) {
      levels.map(function (L, i) { return i; })
            .sort(function (a, b) { return levels[a].e - levels[b].e; })
            .forEach(function (li) {
              left = hundWithin(slots.filter(function (s) { return s.li === li; }), left);
            });
    } else {
      left = hundWithin(slots.slice().sort(function (a, b) { return a.e - b.e; }), left);
    }
    return slots;
  }

  function analyse(geomKey, n, lowSpin) {
    var g = GEOM[geomKey];
    var slots = fill(g.levels, n, lowSpin);
    var cfse = 0, unpaired = 0, pairs = 0;
    slots.forEach(function (s) {
      cfse += s.c * s.e;
      if (s.c === 1) unpaired++;
      if (s.c === 2) pairs++;
    });
    if (Math.abs(cfse) < 1e-9) cfse = 0;      // -0.00 이 찍히지 않게 한다
    return {
      slots: slots, cfse: cfse, unpaired: unpaired,
      extraPairs: pairs - Math.max(0, n - 5),   // 자유 이온에서도 어쩔 수 없는 짝은 뺀다
      mu: Math.sqrt(unpaired * (unpaired + 2))
    };
  }

  /* 고스핀과 저스핀이 실제로 다른 배치를 주는가.
     'd4~d7'은 팔면체에서만 맞는 규칙이다 — 평면사각은 준위가 4단이라 d8에서
     바로 갈리고, 그것이 반자성 d8 평면사각이라는 이 모듈의 핵심 사례다.
     그래서 하드코딩하지 않고 두 배치를 실제로 비교한다. */
  function spinChoiceMatters(geomKey, n) {
    if (!GEOM[geomKey].spinChoice) return false;
    var a = analyse(geomKey, n, false), b = analyse(geomKey, n, true);
    return a.unpaired !== b.unpaired;
  }

  function fmt(e) {
    return (e > 0 ? '+' : '') + (Math.abs(e * 10 - Math.round(e * 10)) < 1e-9 ? e.toFixed(1) : e.toFixed(3));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.getElementById('cf-svg');
    if (!host) return;

    var geomKey = 'Oh', n = 5, lowSpin = false;
    var out = {
      cfse: document.getElementById('cf-cfse'),
      unp: document.getElementById('cf-unpaired'),
      mu: document.getElementById('cf-mu'),
      cfg: document.getElementById('cf-config'),
      note: document.getElementById('cf-note'),
      live: document.getElementById('cf-live'),
      nOut: document.getElementById('cf-n-out')
    };
    var spinBtns = Array.prototype.slice.call(document.querySelectorAll('[data-spin]'));

    function draw() {
      var g = GEOM[geomKey];
      var a = analyse(geomKey, n, lowSpin);
      var W = 470, H = 300;
      function y(e) { return 252 - (e + 0.75) / 2.1 * 210; }
      var p = ['<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#f8fafc" rx="12"></rect>'];

      p.push('<line x1="74" y1="' + y(0) + '" x2="' + (W - 16) + '" y2="' + y(0) +
             '" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 5"></line>');
      p.push('<text x="' + (W - 18) + '" y="' + (y(0) - 8) + '" fill="#94a3b8" font-size="11" text-anchor="end">무게중심 0</text>');
      p.push('<text x="12" y="24" fill="#475569" font-size="12" font-weight="bold">에너지 (' + g.unit + ' 단위)</text>');

      /* 준위가 가까우면 겹친다 — D4h의 dz²(-0.428)와 dxz,dyz(-0.514)는 0.086 Δo 차이라
         같은 x에 그리면 선과 라벨이 포개진다. 에너지 높은 것부터 내려오며,
         간격이 좁으면 라벨을 밀어 내리고 준위선을 옆 차선으로 옮긴다. */
      var order = g.levels.map(function (L, li) { return { L: L, li: li, yy: y(L.e) }; })
                          .sort(function (a, b) { return a.yy - b.yy; });
      var lastLabelY = -999, lastYY = -999;
      order.forEach(function (it) {
        var L = it.L, yy = it.yy;
        var crowded = (yy - lastYY) < 16;
        var x0 = 100 + (crowded ? 78 : 0), seg = 40, gap = 9;
        var labelY = Math.max(yy, lastLabelY + 19);
        lastLabelY = labelY; lastYY = yy;

        p.push('<text x="' + (x0 - 8) + '" y="' + (labelY + 5) + '" fill="#0f172a" font-size="13" font-weight="bold" text-anchor="end">' + L.svg + '</text>');
        if (Math.abs(labelY - yy) > 2) {   // 라벨을 밀었으면 어느 준위인지 이어 준다
          p.push('<line x1="' + (x0 - 6) + '" y1="' + labelY + '" x2="' + x0 + '" y2="' + yy +
                 '" stroke="#94a3b8" stroke-width="1"></line>');
        }
        var mine = a.slots.filter(function (s) { return s.li === it.li; });
        for (var k = 0; k < L.n; k++) {
          var xs = x0 + k * (seg + gap);
          p.push('<line x1="' + xs + '" y1="' + yy + '" x2="' + (xs + seg) + '" y2="' + yy +
                 '" stroke="#0f172a" stroke-width="3"></line>');
          var occ = mine[k] ? mine[k].c : 0;
          if (occ >= 1) p.push('<text x="' + (xs + 9) + '" y="' + (yy - 5) + '" fill="#1d4ed8" font-size="17" font-weight="bold">&#8593;</text>');
          if (occ === 2) p.push('<text x="' + (xs + 24) + '" y="' + (yy + 15) + '" fill="#b91c1c" font-size="17" font-weight="bold">&#8595;</text>');
        }
        var lastX = x0 + (L.n - 1) * (seg + gap) + seg;
        p.push('<text x="' + (lastX + 10) + '" y="' + (yy + 4) + '" fill="#64748b" font-size="11">' + fmt(L.e) + '</text>');
      });

      host.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      host.innerHTML = p.join('');

      var extra = a.extraPairs > 0 ? ' + ' + a.extraPairs + 'P' : '';
      var levelText = g.levels.map(function (L, li) {
        var c = a.slots.filter(function (s) { return s.li === li; }).reduce(function (t, s) { return t + s.c; }, 0);
        return L.plain + '에 ' + c + '개';
      }).join(', ');

      host.setAttribute('aria-label',
        g.label + ' 결정장 갈라짐 도표. d' + n + ' ' + (lowSpin ? '저스핀' : '고스핀') + ' 배치로 ' + levelText +
        '. 홀전자 ' + a.unpaired + '개, 결정장 안정화 에너지 ' + a.cfse.toFixed(2) + ' ' + g.unit + extra + '.');

      out.cfse.textContent = a.cfse.toFixed(2) + ' ' + g.unit + extra;
      out.unp.textContent = a.unpaired + '개';
      out.mu.textContent = a.mu.toFixed(2) + ' μB';
      out.cfg.textContent = 'd' + n + ' · ' + (lowSpin ? '저스핀' : '고스핀');
      out.nOut.textContent = 'd' + n;
      out.note.innerHTML = g.note;

      var canChoose = spinChoiceMatters(geomKey, n);
      spinBtns.forEach(function (b) {
        b.disabled = !canChoose;
        b.setAttribute('aria-pressed', String(canChoose && (b.dataset.spin === 'low') === lowSpin));
        b.style.opacity = canChoose ? '' : '0.45';
      });

      var why = !g.spinChoice
        ? '사면체는 Δt가 작아 짝지음 에너지를 이기지 못한다 — 사실상 늘 고스핀이다.'
        : !canChoose
          ? 'd' + n + '에서는 고스핀과 저스핀이 같은 배치가 된다 — 선택지가 생기지 않는다.'
          : 'Δ와 짝지음 에너지 P의 크기 비교가 이 배치를 정한다.';
      out.live.textContent = g.label + ' d' + n + ' ' + (lowSpin ? '저스핀' : '고스핀') +
        ' — ' + levelText + '. 홀전자 ' + a.unpaired + '개, CFSE ' + a.cfse.toFixed(2) + ' ' + g.unit + extra +
        ', spin-only μ = ' + a.mu.toFixed(2) + ' μB. ' + why;
    }

    document.querySelectorAll('[data-geom]').forEach(function (b) {
      b.addEventListener('click', function () {
        geomKey = b.dataset.geom;
        if (!spinChoiceMatters(geomKey, n)) lowSpin = false;
        document.querySelectorAll('[data-geom]').forEach(function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
        draw();
      });
    });

    spinBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        lowSpin = b.dataset.spin === 'low';
        draw();
      });
    });

    var range = document.getElementById('cf-n');
    range.addEventListener('input', function () {
      n = parseInt(range.value, 10);
      if (!spinChoiceMatters(geomKey, n)) lowSpin = false;
      draw();
    });

    document.querySelector('[data-geom="Oh"]').setAttribute('aria-pressed', 'true');
    draw();
  });
})();
