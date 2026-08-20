/* lesson_patterns.js — 차시 공용 상호작용 패턴
 *
 * 16강이 인라인/차시 전용 JS로 갖고 있던 두 패턴을 범용화한 것.
 * 차시 고유 문구는 전부 data-* 속성으로 뺐으므로, 새 차시는 이 파일을 link 하고
 * HTML에 속성만 달면 된다. 차시마다 같은 로직을 다시 쓰지 않는다.
 *
 * ponytail: 패턴 2종만. slider→readout은 단원마다 계산식이 달라 공용화 이득이 없다.
 */
(function () {
  'use strict';

  /* 예상 투표 — 정답을 공개하지 않고 학생의 선택만 기록한다.
     교실 공용 PC를 고려해 sessionStorage만 쓴다. 탭을 닫으면 사라진다. */
  function initPolls() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-poll]'), function (poll) {
      var key = poll.dataset.poll;
      var echo = document.getElementById(poll.id + '-echo');
      var recall = document.querySelector('[data-poll-recall="' + key + '"]');
      var buttons = poll.querySelectorAll('button');
      if (!buttons.length) return;

      function render(choice) {
        if (echo) echo.textContent = choice ? '기록됨: ' + choice : '';
        if (!recall) return;
        recall.innerHTML = choice
          ? '앞에서 당신은 <b>' + choice + '</b>을(를) 골랐습니다. 지금 생각은 그대로인가요?'
          : '앞에서 고른 답과 지금 생각이 달라졌나요? 무엇 때문에 달라졌나요?';
      }

      var saved = null;
      try { saved = sessionStorage.getItem(key); } catch (e) { saved = null; }

      Array.prototype.forEach.call(buttons, function (b) {
        if (saved && b.textContent === saved) b.setAttribute('aria-pressed', 'true');
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(buttons, function (c) {
            c.setAttribute('aria-pressed', String(c === b));
          });
          try { sessionStorage.setItem(key, b.textContent); } catch (e) { /* 저장 못 해도 수업은 굴러간다 */ }
          render(b.textContent);
        });
      });
      render(saved);
    });
  }

  /* 규칙 완성 — 관찰 결과를 학생이 문장으로 완성한다. 읽기만 하는 표가 되지 않게 한다.
     안내 문구는 #rule-feedback의 data-hint / data-done으로 차시가 정한다. */
  function initRules() {
    var blanks = document.querySelectorAll('.rule-blank');
    var out = document.getElementById('rule-feedback');
    if (!blanks.length || !out) return;

    var hint = out.dataset.hint || '다시 봅시다. 그 조건만 바꾸면 결과가 어떻게 되었나요?';
    var doneMsg = out.dataset.done || '규칙이 모두 완성되었습니다.';
    var done = {};

    Array.prototype.forEach.call(blanks, function (blank) {
      var buttons = blank.querySelectorAll('button');
      Array.prototype.forEach.call(buttons, function (b) {
        b.addEventListener('click', function () {
          var right = b.dataset.correct === 'true';
          Array.prototype.forEach.call(buttons, function (c) {
            c.classList.remove('chosen-right', 'chosen-wrong');
          });
          b.classList.add(right ? 'chosen-right' : 'chosen-wrong');
          done[blank.dataset.rule] = right;

          if (!right) { out.textContent = hint; return; }
          var got = Object.keys(done).filter(function (k) { return done[k]; }).length;
          out.textContent = got === blanks.length
            ? doneMsg
            : '맞습니다. (' + got + '/' + blanks.length + ') 남은 칸도 채워 봅시다.';
        });
      });
    });
  }

  // slide_engine.js가 init에서 섹션 innerHTML을 다시 쓸 수 있으므로 그 뒤에 리스너를 붙인다.
  document.addEventListener('DOMContentLoaded', function () {
    initPolls();
    initRules();
  });
})();
