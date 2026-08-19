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

  /* 3번의 예상을 기억해 두었다가 14번에서 되돌려준다.
     설계서가 금지한 것은 '선택 비율 저장'이지 학생 본인의 회수가 아니다.
     교실 공용 PC를 고려해 sessionStorage만 쓴다 — 탭을 닫으면 사라진다. */
  var POLL_KEY = 'lesson16.introPoll';

  function showPoll(choice) {
    var echo = document.getElementById('intro-poll-echo');
    var recall = document.getElementById('poll-recall');
    if (echo) echo.textContent = choice ? '기록됨: ' + choice : '';
    if (!recall) return;
    recall.innerHTML = choice
      ? '3번 슬라이드에서 당신은 <b>' + choice + '</b>을(를) 골랐습니다. 지금 생각은 그대로인가요? 무엇 때문에 달라졌나요?'
      : '3번 슬라이드에서 고른 답과 지금 생각이 달라졌나요? 무엇 때문에 달라졌나요?';
  }

  function initPoll() {
    var poll = document.getElementById('intro-poll');
    if (!poll) return;
    var saved = null;
    try { saved = sessionStorage.getItem(POLL_KEY); } catch (e) { saved = null; }

    Array.prototype.forEach.call(poll.children, function (b) {
      if (saved && b.textContent === saved) b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(poll.children, function (c) {
          c.setAttribute('aria-pressed', String(c === b));
        });
        try { sessionStorage.setItem(POLL_KEY, b.textContent); } catch (e) { /* 저장 못 해도 수업은 굴러간다 */ }
        showPoll(b.textContent);
      });
    });
    showPoll(saved);
  }

  /* 13번 — 관찰 결과를 학생이 문장으로 완성한다. 읽기만 하는 표가 되지 않게 한다. */
  function initRules() {
    var blanks = document.querySelectorAll('.rule-blank');
    var out = document.getElementById('rule-feedback');
    if (!blanks.length || !out) return;
    var done = {};

    Array.prototype.forEach.call(blanks, function (blank) {
      Array.prototype.forEach.call(blank.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          var right = b.dataset.correct === 'true';
          Array.prototype.forEach.call(blank.querySelectorAll('button'), function (c) {
            c.classList.remove('chosen-right', 'chosen-wrong');
          });
          b.classList.add(right ? 'chosen-right' : 'chosen-wrong');
          done[blank.dataset.rule] = right;

          if (!right) {
            out.textContent = '다시 봅시다. 12번 애플릿에서 그 조건만 바꾸면 직사각형의 넓이가 어떻게 되었나요?';
            return;
          }
          var got = Object.keys(done).filter(function (k) { return done[k]; }).length;
          out.textContent = got === blanks.length
            ? '세 규칙이 완성되었습니다. 소비 전력만으로는 사용한 전기 에너지를 판단할 수 없고, 사용 시간도 함께 알아야 합니다.'
            : '맞습니다. (' + got + '/' + blanks.length + ') 남은 칸도 채워 봅시다.';
        });
      });
    });
  }

  // slide_engine.js가 init에서 섹션 innerHTML을 다시 쓸 수 있으므로, 15강과 같이
  // DOMContentLoaded 이후에 리스너를 붙인다. (엔진 init은 그 전에 동기로 끝난다)
  document.addEventListener('DOMContentLoaded', function () {
    initApplet1();
    initApplet2();
    initPoll();
    initRules();
  });
})();
