/* 15_induction.js — 15강 전자기 유도의 애플릿 3종
 *
 * 인라인 <script> 265줄을 그대로 옮긴 뒤 탐구 애플릿에 세 가지를 추가했다.
 * (SLIDE_ARCHETYPES: 200줄 넘는 인라인 스크립트를 만들지 않는다)
 *
 *   1) 그래프 상시 기록 모드 — 손으로 끌 때도 기록이 남는다
 *   2) 자기력선 표시 토글
 *   3) 자기장 세기 슬라이더
 *
 * 그리고 sweep()의 0-나눗셈 버그를 고쳤다. 아래 sweep() 주석 참조.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ── 탐구 애플릿 ─────────────────────────────
       Φ(x): 코일을 통과하는 자기장을 종 모양으로 두고
       유도 기전력 e = -dΦ/dt = -(dΦ/dx)·v 를 매 프레임 계산한다.
       기록은 이동이 끝나도 남고, '기록 지우기'로만 사라진다. */
    var svg = document.getElementById('lab-svg');
    if (svg) {
      var magnet = document.getElementById('magnet'),
          body = document.getElementById('magnet-body'),
          labels = document.querySelectorAll('.pole-label'),
          needle = document.getElementById('needle'),
          arrow = document.getElementById('cur-arrow'),
          obs = document.getElementById('obs-text'),
          vOut = document.getElementById('v-out'),
          iOut = document.getElementById('i-out'),
          dirOut = document.getElementById('dir-out'),
          wave = document.getElementById('lab-wave'),
          wctx = wave.getContext('2d'),
          speedBtn = document.getElementById('btn-speed'),
          alwaysBtn = document.getElementById('btn-always'),
          fieldBtn = document.getElementById('btn-field'),
          fieldG = document.getElementById('field-lines'),
          strRange = document.getElementById('bstr'),
          strOut = document.getElementById('bstr-out'),
          strLive = document.getElementById('bstr-live');

      var COIL_X = 257, WIDTH = 62;
      var LEFT_END = -20, RIGHT_END = 440;
      var x = 40, prevX = x, v = 0, emfShown = 0;
      var polarity = 1, flipped = false, drag = false, anim = null, slowMode = true;
      var runs = [], cur = null;          // 실행 기록 (스윕 최대 2개: 느리게 / 빠르게 비교)
      var alwaysOn = false, live = null;  // 상시 기록 모드의 굴러가는 기록
      var fieldOn = false, strength = 1;  // 자기력선 표시 / 자기장 세기 배율

      function dFluxdx(px) { var u = (px - COIL_X) / WIDTH; return -2 * u / WIDTH * Math.exp(-u * u); }

      function drawWave() {
        // 캔버스의 픽셀 크기를 CSS 크기의 2배로 맞춘다. 어긋나면 그림이 늘어나 글자가 뭉개진다.
        var W = wave.width = wave.clientWidth * 2,
            H = wave.height = wave.clientHeight * 2,
            mid = H / 2, padL = 64, padR = 14, padT = 34, F = 30;
        wctx.clearRect(0, 0, W, H);

        // 눈금선
        wctx.strokeStyle = '#e2e8f0'; wctx.lineWidth = 2;
        [-1, -0.5, 0.5, 1].forEach(function (k) {
          var y = mid - k * (mid - padT);
          wctx.beginPath(); wctx.moveTo(padL, y); wctx.lineTo(W - padR, y); wctx.stroke();
        });
        // 0선과 세로축
        wctx.strokeStyle = '#64748b'; wctx.lineWidth = 3;
        wctx.beginPath(); wctx.moveTo(padL, mid); wctx.lineTo(W - padR, mid); wctx.stroke();
        wctx.beginPath(); wctx.moveTo(padL, padT - 12); wctx.lineTo(padL, H - padT + 12); wctx.stroke();

        wctx.fillStyle = '#475569'; wctx.font = F + 'px sans-serif';
        wctx.textAlign = 'right';
        wctx.fillText('+', padL - 12, mid - (mid - padT) + 12);
        wctx.fillText('0', padL - 12, mid + 11);
        wctx.fillText('−', padL - 12, mid + (mid - padT) + 12);
        wctx.textAlign = 'left';
        wctx.fillText(alwaysOn ? '시간 → (계속 흐름)' : '시간 →', W - padR - 260, mid + F + 8);

        runs.forEach(function (run) {
          wctx.strokeStyle = run.live ? '#0891b2' : (run.fast ? '#dc2626' : '#2563eb');
          wctx.lineWidth = 6; wctx.lineJoin = 'round'; wctx.beginPath();
          run.pts.forEach(function (e, i) {
            var px = padL + (i / 260) * (W - padL - padR);
            var py = mid - Math.max(-1, Math.min(1, e / 45)) * (mid - padT);
            i ? wctx.lineTo(px, py) : wctx.moveTo(px, py);
          });
          wctx.stroke();
          if (run.live) return;   // 굴러가는 기록에는 봉우리 이름표를 붙이지 않는다
          [1, -1].forEach(function (sgn) {
            var bi = -1, bv = 0;
            run.pts.forEach(function (e, i) { if (e * sgn > bv) { bv = e * sgn; bi = i; } });
            if (bi < 0 || bv < 8) return;
            var px = padL + (bi / 260) * (W - padL - padR);
            var py = mid - Math.max(-1, Math.min(1, (bv * sgn) / 45)) * (mid - padT);
            wctx.fillStyle = run.fast ? '#dc2626' : '#2563eb';
            wctx.beginPath(); wctx.arc(px, py, 9, 0, 6.3); wctx.fill();
            wctx.font = 'bold ' + F + 'px sans-serif'; wctx.textAlign = 'center';
            wctx.fillText(sgn > 0 ? '들어갈 때' : '나올 때',
                          Math.min(W - 100, Math.max(100, px)), py + (sgn > 0 ? -18 : F + 12));
            wctx.textAlign = 'left';
          });
        });

        // 범례
        wctx.font = 'bold ' + F + 'px sans-serif';
        wctx.fillStyle = '#2563eb'; wctx.fillRect(padL + 8, 12, 26, 8);
        wctx.fillText('느리게', padL + 42, 26);
        wctx.fillStyle = '#dc2626'; wctx.fillRect(padL + 170, 12, 26, 8);
        wctx.fillText('빠르게', padL + 204, 26);
        if (live) {
          wctx.fillStyle = '#0891b2'; wctx.fillRect(padL + 332, 12, 26, 8);
          wctx.fillText('상시 기록', padL + 366, 26);
        }
      }

      function narrate() {
        var mag = Math.abs(emfShown);
        if (mag < 3) {
          obs.textContent = Math.abs(v) < 0.3
            ? '멈춰 있다 → 통과하는 자기장이 변하지 않아 전류가 흐르지 않는다.'
            : '지금은 통과 자기장의 변화가 작은 구간이다 → 움직여도 전류가 작다.';
        } else if (x < COIL_X) {
          obs.textContent = '코일에 가까워지는 중 → 통과 자기장이 세지며 전류가 흐른다.';
        } else {
          obs.textContent = '코일에서 멀어지는 중 → 통과 자기장이 약해지며 전류의 방향이 반대가 된다.';
        }
      }

      /* 자기력선 — 자석 세기에 따라 진하기가 달라진다.
         #field-lines는 #magnet-body 안에 있으므로 자석과 함께 움직이고,
         극을 뒤집으면 같이 180° 돌아 화살표 방향도 알아서 반대가 된다. */
      function drawField() {
        if (!fieldG) return;
        fieldG.setAttribute('opacity', fieldOn ? (0.28 + 0.36 * (strength / 2)).toFixed(2) : 0);
      }

      var last = 0;
      function loop(ts) {
        var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
        v = (x - prevX) / dt; prevX = x;
        emfShown += (-dFluxdx(x) * v * polarity * 2.2 * strength - emfShown) * 0.35;

        magnet.setAttribute('transform', 'translate(' + x + ',0)');
        needle.style.transform = 'rotate(' + Math.max(-78, Math.min(78, emfShown * 0.9)) + 'deg)';
        var mag = Math.abs(emfShown);
        arrow.setAttribute('opacity', mag > 3 ? Math.min(1, mag / 40) : 0);
        arrow.textContent = emfShown > 0 ? '→' : '←';
        vOut.textContent = (Math.abs(v) * 0.02).toFixed(1);
        iOut.textContent = (emfShown / 10).toFixed(1);
        dirOut.textContent = mag < 3 ? '' : (emfShown > 0 ? '(오른쪽)' : '(왼쪽)');

        // 상시 기록: 260칸이 차면 앞을 버리며 굴린다 (오실로스코프처럼)
        if (alwaysOn) {
          if (!live) { live = { live: true, pts: [] }; runs.push(live); }
          if (live.pts.length >= 260) live.pts.shift();
          live.pts.push(emfShown);
        }
        if (cur && cur.pts.length < 260) cur.pts.push(emfShown);
        drawWave(); narrate();
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      drawWave(); drawField();

      function toLocal(e) { var r = svg.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 460; }
      svg.addEventListener('pointerdown', function (e) {
        // 슬라이더를 만지는 중에는 자석을 끌지 않는다
        if (e.target.closest && e.target.closest('input')) return;
        drag = true; anim = null; svg.setPointerCapture(e.pointerId); x = toLocal(e);
      });
      svg.addEventListener('pointermove', function (e) { if (drag) x = Math.max(LEFT_END, Math.min(RIGHT_END, toLocal(e))); });
      svg.addEventListener('pointerup', function () { drag = false; });

      /* 자석을 한쪽 끝까지 쓸어 보낸다.
         버그였던 것: 이미 오른쪽 끝에 있는데 '오른쪽'을 또 누르면 from === to 가 되어
         duration = 0 → k = 0/0 = NaN → x = NaN 이 되고, 그 뒤 모든 계산이 NaN으로
         오염돼 애플릿이 죽었다. '왼쪽'을 눌러도 from이 NaN이라 돌아오지 못했다.
         이제 목표 끝에 이미 있으면 반대쪽으로 순간 이동한 뒤 다시 쓸어, 같은 조작을
         반복해서 관찰할 수 있게 한다. */
      function sweep(dir) {
        var to = dir > 0 ? RIGHT_END : LEFT_END;
        var start = dir > 0 ? LEFT_END : RIGHT_END;
        if (Math.abs(to - x) < 8) { x = start; prevX = x; }   // 순간 이동은 속도로 세지 않는다
        var from = x;
        var dist = Math.abs(to - from);
        if (dist < 1) return;                                  // 0으로 나누지 않는다
        var duration = dist / (slowMode ? 0.17 : 0.5), t0 = null, token = {};
        anim = token;
        cur = { fast: !slowMode, pts: [] };
        // 스윕 기록은 2개까지만 남긴다. 상시 기록(live)은 이 회전에서 제외한다.
        var sweeps = runs.filter(function (r) { return !r.live; });
        if (sweeps.length >= 2) runs.splice(runs.indexOf(sweeps[0]), 1);
        runs.push(cur);
        function step(ts) {
          if (anim !== token) return;
          if (t0 === null) t0 = ts;
          var k = Math.min(1, (ts - t0) / duration);
          x = from + (to - from) * k;
          if (k < 1) requestAnimationFrame(step); else { anim = null; cur = null; }   // 기록은 남긴다
        }
        requestAnimationFrame(step);
      }

      function setAlways(on) {
        alwaysOn = on;
        alwaysBtn.setAttribute('aria-pressed', String(on));
        alwaysBtn.textContent = on ? '그래프: 상시 기록' : '그래프: 구간 기록';
        if (!on && live) { runs.splice(runs.indexOf(live), 1); live = null; }
        drawWave();
      }

      function setField(on) {
        fieldOn = on;
        fieldBtn.setAttribute('aria-pressed', String(on));
        fieldBtn.textContent = on ? '자기력선: 표시' : '자기력선: 숨김';
        drawField();
        obs.textContent = on
          ? '자기력선은 N극에서 나와 S극으로 들어간다. 코일이 이 선을 몇 개 지나는지가 통과 자기장이다.'
          : '자기력선을 숨겼다. 검류계 바늘만 보고 판단해 보자.';
      }

      var lab = svg.closest('section') || document;
      lab.querySelectorAll('[data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var a = b.dataset.act;
          if (a === 'right') sweep(1);
          else if (a === 'left') sweep(-1);
          else if (a === 'speed') { slowMode = !slowMode; speedBtn.textContent = slowMode ? '속도: 느리게' : '속도: 빠르게'; }
          else if (a === 'always') setAlways(!alwaysOn);
          else if (a === 'field') setField(!fieldOn);
          else if (a === 'flip') {
            flipped = !flipped; polarity *= -1;
            body.style.transform = flipped ? 'rotate(180deg)' : 'rotate(0deg)';
            labels.forEach(function (el) { el.style.transform = flipped ? 'rotate(180deg)' : 'rotate(0deg)'; });
            obs.textContent = '극을 뒤집었다 → 같은 방향으로 움직여도 전류의 방향이 반대가 된다.';
          } else {
            anim = null; cur = null; runs = []; live = null; x = 40; prevX = x; emfShown = 0; drawWave();
          }
        });
      });

      if (strRange) {
        strRange.addEventListener('input', function () {
          strength = parseFloat(strRange.value) || 1;
          strOut.textContent = '×' + strength.toFixed(1);
          drawField();
          if (strLive) {
            strLive.textContent = '자기장 세기 ×' + strength.toFixed(1) + ' — 같은 속도로 움직여도 유도 전류가 '
              + (strength > 1.05 ? '더 세진다.' : strength < 0.95 ? '더 약해진다.' : '기준과 같다.');
          }
        });
      }
    }

    /* ── 발전기 ─────────────────────────────
       코일은 세로축을 중심으로 기울며 돈다.
       화면에서 보이는 폭 ∝ |sin α|, 자기장에 수직인 투영 면적 ∝ |cos α|.
       통과 자기장 Φ ∝ cos α 이므로 유도 전압 ∝ -dΦ/dt ∝ sin α. */
    var face = document.getElementById('coil-face');
    var gwave = document.getElementById('gen-wave');
    if (face && gwave) {
      var gctx = gwave.getContext('2d');
      var alpha = Math.PI / 4, speed = 0.035, spinning = false, snapMode = false;
      var angOut = document.getElementById('ang-out'),
          fluxOut = document.getElementById('flux-out'),
          voltOut = document.getElementById('volt-out'),
          fluxBar = document.getElementById('flux-bar');

      function drawCoil() {
        var cx = 170, halfW = 78 * Math.abs(Math.sin(alpha)), top = 62, bot = 158;
        var lean = 10 * Math.cos(alpha);   // 원근: 앞으로 기운 모서리를 살짝 내린다
        face.setAttribute('points',
          (cx - halfW) + ',' + (top + lean) + ' ' + (cx + halfW) + ',' + (top - lean) + ' ' +
          (cx + halfW) + ',' + (bot - lean) + ' ' + (cx - halfW) + ',' + (bot + lean));
        face.setAttribute('stroke', Math.cos(alpha) >= 0 ? '#b45309' : '#0e7490');
      }

      function drawWave2() {
        var W = gwave.width = gwave.clientWidth * 2, H = gwave.height = gwave.clientHeight * 2, mid = H / 2, pad = 52;
        gctx.clearRect(0, 0, W, H);
        gctx.strokeStyle = '#94a3b8'; gctx.lineWidth = 2;
        gctx.beginPath(); gctx.moveTo(pad, mid); gctx.lineTo(W - 6, mid); gctx.stroke();
        gctx.fillStyle = '#475569'; gctx.font = '28px sans-serif';
        gctx.fillText('회전각 →', W - 160, mid + 36);
        gctx.fillText('0', pad - 30, mid + 10);
        gctx.strokeStyle = '#2563eb'; gctx.lineWidth = 5; gctx.beginPath();
        for (var i = 0; i <= 300; i++) {
          var a = i / 300 * (3 * Math.PI);
          var px = pad + i / 300 * (W - pad - 6);
          var py = mid - Math.sin(a) * (mid - 26);
          i ? gctx.lineTo(px, py) : gctx.moveTo(px, py);
        }
        gctx.stroke();
        var ca = ((alpha % (3 * Math.PI)) + 3 * Math.PI) % (3 * Math.PI);
        var cpx = pad + ca / (3 * Math.PI) * (W - pad - 6);
        var cpy = mid - Math.sin(ca) * (mid - 26);
        gctx.strokeStyle = '#f59e0b'; gctx.lineWidth = 3; gctx.setLineDash([6, 6]);
        gctx.beginPath(); gctx.moveTo(cpx, 8); gctx.lineTo(cpx, H - 8); gctx.stroke();
        gctx.setLineDash([]);
        gctx.fillStyle = '#f59e0b'; gctx.beginPath(); gctx.arc(cpx, cpy, 9, 0, 6.3); gctx.fill();
        gctx.fillStyle = '#2563eb'; gctx.font = 'bold 28px sans-serif';
        gctx.fillText('유도 전압', pad + 8, 30);
      }

      function readout() {
        var deg = ((Math.round(alpha * 180 / Math.PI) % 360) + 360) % 360;
        angOut.textContent = deg + '°';
        var proj = Math.abs(Math.cos(alpha)), rate = Math.abs(Math.sin(alpha));
        fluxOut.textContent = proj > 0.9 ? '최대' : proj < 0.15 ? '0' : '중간';
        voltOut.textContent = rate > 0.9 ? '최대' : rate < 0.15 ? '0' : '중간';
        fluxBar.style.width = (proj * 100).toFixed(0) + '%';
      }

      function tick() {
        if (spinning) {
          alpha += speed;
          if (snapMode) {
            var next = Math.round(alpha / (Math.PI / 2)) * (Math.PI / 2);
            if (Math.abs(alpha - next) < speed) { alpha = next; spinning = false; }
          }
        }
        drawCoil(); drawWave2(); readout();
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);

      document.getElementById('btn-gen').addEventListener('click', function () { snapMode = false; spinning = !spinning; });
      document.getElementById('btn-gen-fast').addEventListener('click', function () {
        speed = speed > 0.06 ? 0.035 : 0.09;
        this.textContent = speed > 0.06 ? '천천히' : '빠르게';
        spinning = true; snapMode = false;
      });
      document.getElementById('btn-snap').addEventListener('click', function () {
        snapMode = true; spinning = true; alpha += 0.02;
      });
    }

    /* ── 세기 비교 (정성) ── */
    var emfChart = document.getElementById('chart-emf');
    if (emfChart && window.Chart) new Chart(emfChart.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['정지', '기준', '더 빠르게', '센 자석', '코일 많이'],
        datasets: [{ data: [0, 1, 2, 2, 2],
                     backgroundColor: ['#cbd5e1', '#0891b2', '#0e7490', '#0e7490', '#0e7490'] }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false },
                   tooltip: { callbacks: { label: function (c) { return ['없음', '보통', '큼'][c.raw]; } } } },
        scales: { y: { beginAtZero: true, max: 2.4,
                       ticks: { stepSize: 1, font: { size: 15 },
                                callback: function (v) { return ['없음', '보통', '큼'][v] || ''; } },
                       title: { display: true, text: '유도 전류의 세기 (정성 비교)', font: { size: 15 } } },
                  x: { ticks: { font: { size: 15 } } } }
      }
    });
  });
})();
