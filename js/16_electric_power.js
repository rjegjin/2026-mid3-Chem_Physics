/* 16강 전용 상호작용
   - 애플릿 1: 가전제품 에너지 전환 탐색기 (복수 선택)
   - 애플릿 2: 소비 전력–사용 시간 에너지 미터 (면적 = 전력량)
   외부 네트워크 없이 동작한다. 이 스크립트가 실패해도 HTML의 정의·표·평가는 남는다. */
(function () {
  'use strict';

  var ENERGY = { light: '빛', thermal: '열', motion: '운동', sound: '소리' };

  var APPLIANCES = {
    lamp: { label: '전등', intended: ['light'], other: ['thermal'],
            evidence: ['주변이 밝아진다', '전구가 따뜻해진다'] },
    fan: { label: '선풍기', intended: ['motion'], other: ['sound', 'thermal'],
           evidence: ['날개와 공기가 움직인다', '모터 소리가 난다', '모터가 따뜻해진다'] },
    dryer: { label: '헤어드라이어', intended: ['thermal', 'motion'], other: ['sound'],
             evidence: ['바람이 뜨겁다', '바람이 세게 나온다', '모터 소리가 크다'] },
    speaker: { label: '스피커', intended: ['sound'], other: ['thermal'],
               evidence: ['소리가 들린다', '진동판이 떨린다', '오래 쓰면 따뜻해진다'] },
    cooker: { label: '전기밥솥', intended: ['thermal'], other: ['sound'],
              evidence: ['밥솥이 뜨겁다', '김이 빠지는 소리가 난다'] },
    washer: { label: '세탁기', intended: ['motion'], other: ['sound', 'thermal'],
              evidence: ['통이 돌아간다', '소리와 진동이 난다', '모터가 따뜻해진다'] }
  };

  function chips(keys, cls) {
    return keys.map(function (k) {
      return '<span class="echip ' + cls + '">' + ENERGY[k] + '</span>';
    }).join('');
  }

  function initApplet1() {
    var prodBox = document.getElementById('ap1-products');
    var outBox = document.getElementById('ap1-outputs');
    var feedback = document.getElementById('ap1-feedback');
    if (!prodBox || !outBox || !feedback) return;

    var current = null;
    var picked = {};

    Object.keys(APPLIANCES).forEach(function (key) {
      var b = document.createElement('button');
      b.className = 'pick';
      b.type = 'button';
      b.textContent = APPLIANCES[key].label;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        current = key;
        picked = {};
        Array.prototype.forEach.call(prodBox.children, function (c) {
          c.setAttribute('aria-pressed', String(c === b));
        });
        Array.prototype.forEach.call(outBox.children, function (c) {
          c.setAttribute('aria-pressed', 'false');
        });
        feedback.innerHTML = '<p class="text-slate-600"><b>' + APPLIANCES[key].label +
          '</b>에서 나온다고 생각하는 에너지를 모두 고른 뒤 확인을 누르세요.</p>';
      });
      prodBox.appendChild(b);
    });

    Object.keys(ENERGY).forEach(function (key) {
      var b = document.createElement('button');
      b.className = 'pick';
      b.type = 'button';
      b.textContent = ENERGY[key];
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        picked[key] = !picked[key];
        b.setAttribute('aria-pressed', String(!!picked[key]));
      });
      outBox.appendChild(b);
    });

    document.getElementById('ap1-check').addEventListener('click', function () {
      if (!current) {
        feedback.innerHTML = '<p class="text-slate-600">제품을 먼저 고르세요.</p>';
        return;
      }
      var data = APPLIANCES[current];
      var all = data.intended.concat(data.other);
      var chosen = Object.keys(picked).filter(function (k) { return picked[k]; });
      var missed = all.filter(function (k) { return chosen.indexOf(k) < 0; });
      var extra = chosen.filter(function (k) { return all.indexOf(k) < 0; });

      var html = '<p class="font-bold text-slate-800">' + data.label + '</p>' +
        '<p class="mt-1"><span class="echip input">전기</span> → ' +
        chips(data.intended, 'intended') + chips(data.other, 'other') + '</p>' +
        '<p class="text-slate-600 mt-1">실선 초록 = 주된 목적 / 점선 보라 = 함께 나타남</p>' +
        '<p class="text-slate-600 mt-1">관찰 증거: ' + data.evidence.join(' · ') + '</p>';

      if (!missed.length && !extra.length) {
        html += '<p class="text-green-700 font-bold mt-2">✅ 함께 나타나는 에너지까지 모두 찾았습니다.</p>';
      } else {
        if (missed.length) {
          html += '<p class="text-slate-600 mt-2">아직 고르지 않은 것: <b>' +
            missed.map(function (k) { return ENERGY[k]; }).join(', ') +
            '</b> — 위의 관찰 증거 중 이 에너지를 가리키는 것이 있나요?</p>';
        }
        if (extra.length) {
          html += '<p class="text-slate-600 mt-1">더 고른 것: <b>' +
            extra.map(function (k) { return ENERGY[k]; }).join(', ') +
            '</b> — 이 에너지를 확인할 관찰 증거가 있나요?</p>';
        }
      }
      feedback.innerHTML = html;
    });

    document.getElementById('ap1-reset').addEventListener('click', function () {
      current = null;
      picked = {};
      Array.prototype.forEach.call(prodBox.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
      Array.prototype.forEach.call(outBox.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
      feedback.innerHTML = '<p class="text-slate-600">제품을 먼저 고르세요.</p>';
    });
  }

  /* --- 애플릿 2 ------------------------------------------------------- */
  var PX = { x0: 60, y0: 260, w: 400, h: 220, maxW: 2000, maxMin: 480 };

  function fmtTime(min) {
    return Math.floor(min / 60) + '시간 ' + (min % 60) + '분';
  }

  function fmtEnergy(wh) {
    var s = Math.round(wh) + ' Wh';
    if (wh >= 1000) s += ' (' + (wh / 1000).toFixed(3) + ' kWh)';
    return s;
  }

  var PRESETS = [
    { name: '같은 시간', a: [50, 60], b: [500, 60],
      note: '같은 시간에는 소비 전력이 클수록 전력량이 커진다.' },
    { name: '같은 전력', a: [100, 60], b: [100, 300],
      note: '같은 소비 전력에서는 사용 시간이 길수록 전력량이 커진다.' },
    { name: '같은 전력량', a: [1200, 10], b: [100, 120],
      note: '전력과 시간이 모두 달라도 전력량은 같을 수 있다. kWh는 에너지의 단위이며 kW/h가 아니다.' },
    { name: '도입 문제', a: [1800, 10], b: [50, 360],
      note: '전력과 시간이 모두 다르면 두 값을 함께 비교해야 한다. 두 경우 모두 300 Wh이다.' }
  ];

  function initApplet2() {
    var power = document.getElementById('ap2-power');
    var time = document.getElementById('ap2-time');
    var rect = document.getElementById('meter-rect');
    if (!power || !time || !rect) return;

    var powerOut = document.getElementById('ap2-power-out');
    var timeOut = document.getElementById('ap2-time-out');
    var energyOut = document.getElementById('ap2-energy');
    var areaLabel = document.getElementById('meter-area-label');
    var live = document.getElementById('ap2-live');
    var tbody = document.querySelector('#ap2-table tbody');

    function render() {
      var w = Number(power.value);
      var min = Number(time.value);
      var wh = w * min / 60;
      // 픽셀은 값에 정확히 비례한다 — 장식으로 비례를 깨지 않는다.
      var bh = PX.h * w / PX.maxW;
      var bw = PX.w * min / PX.maxMin;
      rect.setAttribute('x', PX.x0);
      rect.setAttribute('y', PX.y0 - bh);
      rect.setAttribute('width', bw);
      rect.setAttribute('height', bh);
      areaLabel.setAttribute('x', PX.x0 + Math.max(bw, 70) / 2);
      areaLabel.setAttribute('y', PX.y0 - bh / 2 + 6);
      areaLabel.textContent = Math.round(wh) + ' Wh';

      powerOut.textContent = w + ' W';
      timeOut.textContent = fmtTime(min);
      energyOut.textContent = fmtEnergy(wh);

      var say = '소비 전력 ' + w + ' W로 ' + fmtTime(min) + ' 사용하면 전기 에너지 ' + fmtEnergy(wh) + '를 사용한다.';
      power.setAttribute('aria-valuetext', w + ' 와트');
      time.setAttribute('aria-valuetext', fmtTime(min));
      live.textContent = say;
    }

    power.addEventListener('input', render);
    time.addEventListener('input', render);

    var box = document.getElementById('ap2-presets');
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'pick';
      b.type = 'button';
      b.textContent = p.name;
      b.addEventListener('click', function () {
        power.value = p.a[0];
        time.value = p.a[1];
        render();
        tbody.innerHTML = [p.a, p.b].map(function (c, i) {
          return '<tr><td>' + (i ? 'B' : 'A') + '</td><td>' + c[0] + ' W</td><td>' +
            fmtTime(c[1]) + '</td><td class="readout">' + Math.round(c[0] * c[1] / 60) + ' Wh</td></tr>';
        }).join('') + '<tr><td colspan="4">' + p.note + '</td></tr>';
        live.textContent = p.note;
      });
      box.appendChild(b);
    });

    var reset = document.createElement('button');
    reset.className = 'pick';
    reset.type = 'button';
    reset.textContent = '초기화';
    reset.addEventListener('click', function () {
      power.value = 1000;
      time.value = 180;
      render();
      tbody.innerHTML = '<tr><td colspan="4">아래 버튼으로 두 조건을 비교해 보세요.</td></tr>';
    });
    box.appendChild(reset);

    render();
  }

  function initPoll() {
    var poll = document.getElementById('intro-poll');
    if (!poll) return;
    Array.prototype.forEach.call(poll.children, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(poll.children, function (c) {
          c.setAttribute('aria-pressed', String(c === b));
        });
      });
    });
  }

  initApplet1();
  initApplet2();
  initPoll();
})();
