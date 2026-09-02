/* adv_inorganic_09.js — Module 09, reading a Tanabe–Sugano diagram
 *
 * The applet exists because extracting Δo and B is a *procedure*, not a fact
 * (ROADMAP.md, Production Standards §2). A static diagram can show the curves;
 * it cannot let a student run the fit and watch the third band come out wrong.
 *
 * Physics — spin-allowed (maximum-multiplicity) states only, weak-field basis,
 * F and P parentage, in units of cm^-1 with Dq = Δo/10:
 *
 *   d3, d8  (A2 ground)      d2, d7  (T1 ground)
 *     E(A2) = -12 Dq           E(A2) = +12 Dq
 *     E(T2) =  -2 Dq           E(T2) =  +2 Dq
 *     T1: [[ 6Dq,  4Dq],       T1: [[-6Dq, -4Dq],
 *          [ 4Dq, 15B]]             [-4Dq, 15B]]
 *
 * The d2/d7 column is the d3/d8 column with Dq → -Dq: hole–electron
 * equivalence (module §8), so one pair of formulas covers four ions.
 *
 * Both limits are forced and are asserted in tests/adv09_check.js:
 *   Dq → 0 : levels collapse to {0, 0, 0, 15B} — the free-ion F and P terms.
 *   B  → 0 : levels → {-12, -2, -2, +8} Dq — the strong-field configurations
 *            t2g^3, t2g^2 eg (twice), t2g eg^2. This is what fixes the
 *            off-diagonal element at 4Dq; 6Dq, which several sources quote,
 *            reproduces neither limit.
 * Trace invariance 1·E(A2) + 3·E(T2) + 3·tr(T1) = 45B at any Dq is the third check.
 *
 * C is not implemented. Spin-forbidden states (the 2Eg of the ruby) cannot be
 * placed without it, and no pair of spin-allowed bands can supply it — the
 * module says so rather than drawing a curve it cannot defend.
 * d4–d7 crossover cases are excluded on purpose: which side of the vertical
 * discontinuity a complex sits on is a decision, not a calculation.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;   // node, for the check script
  else { root.AdvTS09 = api; if (root.document) api.boot(root.document); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Free-ion B, cm^-1. Anchors for β only — sources differ by tens of cm^-1.
  var IONS = {
    2: { label: 'd² V³⁺',  mult: 3, ground: 'T1', B0: 861 },
    3: { label: 'd³ Cr³⁺', mult: 4, ground: 'A2', B0: 918 },
    7: { label: 'd⁷ Co²⁺', mult: 4, ground: 'T1', B0: 971 },
    8: { label: 'd⁸ Ni²⁺', mult: 3, ground: 'A2', B0: 1041 }
  };

  function levels(dn, dOct, B) {
    var s = IONS[dn].ground === 'A2' ? 1 : -1;      // sign of the field on the hole/electron
    var Dq = s * dOct / 10;
    var half = (6 * Dq + 15 * B) / 2;
    var gap = (6 * Dq - 15 * B) / 2;
    var r = Math.sqrt(gap * gap + 16 * Dq * Dq);
    return { A2: -12 * Dq, T2: -2 * Dq, T1F: half - r, T1P: half + r };
  }

  /* Transition energies from the ground state, in the conventional assignment
   * order for each family. Labels carry the parentage because the fit depends
   * on knowing which curve a measured band belongs to. */
  function bands(dn, dOct, B) {
    var L = levels(dn, dOct, B), m = IONS[dn].mult, g = IONS[dn].ground;
    var sup = m === 3 ? '³' : '⁴';
    if (g === 'A2') {
      return [
        { label: sup + 'A₂g → ' + sup + 'T₂g',      e: L.T2 - L.A2 },
        { label: sup + 'A₂g → ' + sup + 'T₁g(F)',   e: L.T1F - L.A2 },
        { label: sup + 'A₂g → ' + sup + 'T₁g(P)',   e: L.T1P - L.A2 }
      ];
    }
    return [
      { label: sup + 'T₁g(F) → ' + sup + 'T₂g',     e: L.T2 - L.T1F },
      { label: sup + 'T₁g(F) → ' + sup + 'A₂g',     e: L.A2 - L.T1F },
      { label: sup + 'T₁g(F) → ' + sup + 'T₁g(P)',  e: L.T1P - L.T1F }
    ];
  }

  /* Inverse problem: two assigned bands → Δo and B.
   * For the A2-ground family band 1 *is* Δo, so only B is unknown and a
   * bisection on the monotonic residual suffices. For the T1-ground family the
   * ground state itself moves with both parameters, so nothing decouples and a
   * coarse grid followed by a local refinement is the honest answer. */
  function fit(dn, n1, n2) {
    var best = null, dOct, B, r1, r2, err;
    function residual(dOct, B) {
      var b = bands(dn, dOct, B);
      var e1 = (b[0].e - n1) / n1, e2 = (b[1].e - n2) / n2;
      return e1 * e1 + e2 * e2;
    }
    var lo = 2000, hi = 45000, stepD = 100, stepB = 5;
    for (dOct = lo; dOct <= hi; dOct += stepD) {
      for (B = 200; B <= 1400; B += stepB) {
        err = residual(dOct, B);
        if (best === null || err < best.err) best = { dOct: dOct, B: B, err: err };
      }
    }
    // Local refinement, two passes of halving steps around the grid winner.
    var sD = stepD, sB = stepB, i, j, cD, cB;
    for (i = 0; i < 24; i++) {
      sD /= 2; sB /= 2;
      cD = best.dOct; cB = best.B;
      for (j = -2; j <= 2; j++) {
        dOct = cD + j * sD;
        if (dOct <= 0) continue;
        for (r1 = -2; r1 <= 2; r1++) {
          B = cB + r1 * sB;
          if (B <= 0) continue;
          err = residual(dOct, B);
          if (err < best.err) best = { dOct: dOct, B: B, err: err };
        }
      }
    }
    r2 = bands(dn, best.dOct, best.B);
    var rms = Math.sqrt(best.err / 2), beta = best.B / IONS[dn].B0;
    /* A fit always returns something. Whether it means anything is a separate
     * question, and the module (§15) names the test: β outside its physical
     * range says the *assignment* is wrong, not the arithmetic. Feed a d3
     * spectrum in as d7 and this is what catches it. */
    return {
      dOct: best.dOct, B: best.B, rms: rms, beta: beta, predicted: r2,
      plausible: rms < 0.02 && beta <= 1 && beta >= 0.25
    };
  }

  var api = { IONS: IONS, levels: levels, bands: bands, fit: fit };

  /* ---------- DOM ---------- */
  api.boot = function (doc) {
    var svg = doc.getElementById('ts-svg');
    if (!svg) return;                        // not this page

    var state = { dn: 3, mode: 'fwd', dOct: 17400, B: 725 };
    var el = {
      doIn: doc.getElementById('ts-do'), bIn: doc.getElementById('ts-b'),
      doOut: doc.getElementById('ts-do-out'), bOut: doc.getElementById('ts-b-out'),
      n1: doc.getElementById('ts-n1'), n2: doc.getElementById('ts-n2'),
      fwd: doc.getElementById('ts-fwd'), inv: doc.getElementById('ts-inv'),
      doV: doc.getElementById('ts-do-v'), bV: doc.getElementById('ts-b-v'),
      ratio: doc.getElementById('ts-ratio'), beta: doc.getElementById('ts-beta'),
      rows: doc.getElementById('ts-bands'), live: doc.getElementById('ts-live')
    };
    var ionBtns = [].slice.call(doc.querySelectorAll('[data-dn]'));
    var modeBtns = [].slice.call(doc.querySelectorAll('[data-mode]'));

    var X0 = 56, X1 = 386, Y0 = 206, Y1 = 20, XMAX = 45, YMAX = 95;
    function px(x) { return X0 + (X1 - X0) * Math.min(x, XMAX) / XMAX; }
    function py(y) { return Y0 + (Y1 - Y0) * Math.min(y, YMAX) / YMAX; }
    function ns(tag, attrs, text) {
      var n = doc.createElementNS('http://www.w3.org/2000/svg', tag), k;
      for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
      if (text !== undefined) n.textContent = text;
      return n;
    }

    function curve(dn, key, B) {   // E/B against Δo/B, ground state subtracted
      var pts = [], i, x, bandSet, g = IONS[dn].ground, L, base;
      for (i = 0; i <= 90; i++) {
        x = XMAX * i / 90;                       // Δo/B
        L = levels(dn, x * B, B);
        base = g === 'A2' ? L.A2 : L.T1F;
        pts.push(px(x) + ',' + py((L[key] - base) / B));
      }
      return pts.join(' ');
    }

    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var B = state.B, g = IONS[state.dn].ground;
      var keys = g === 'A2' ? ['A2', 'T2', 'T1F', 'T1P'] : ['T1F', 'T2', 'A2', 'T1P'];
      var colour = { A2: '#0f172a', T2: '#1d4ed8', T1F: '#059669', T1P: '#b45309' };
      var name = { A2: 'A₂g', T2: 'T₂g', T1F: 'T₁g(F)', T1P: 'T₁g(P)' };

      svg.appendChild(ns('rect', { x: 0, y: 0, width: 470, height: 250, fill: '#f8fafc', rx: 12 }));
      svg.appendChild(ns('line', { x1: X0, y1: Y0, x2: X1 + 6, y2: Y0, stroke: '#334155', 'stroke-width': 2 }));
      svg.appendChild(ns('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: '#334155', 'stroke-width': 2 }));
      svg.appendChild(ns('text', { x: (X0 + X1) / 2, y: 240, fill: '#334155', 'font-size': 12, 'font-weight': 'bold', 'text-anchor': 'middle' }, 'Δo / B'));
      svg.appendChild(ns('text', { x: 6, y: 110, fill: '#334155', 'font-size': 12, 'font-weight': 'bold' }, 'E / B'));
      [0, 15, 30, 45].forEach(function (t) {
        svg.appendChild(ns('text', { x: px(t), y: Y0 + 16, fill: '#64748b', 'font-size': 10, 'text-anchor': 'middle' }, String(t)));
      });
      [0, 30, 60, 90].forEach(function (t) {
        svg.appendChild(ns('text', { x: X0 - 6, y: py(t) + 4, fill: '#64748b', 'font-size': 10, 'text-anchor': 'end' }, String(t)));
      });

      keys.forEach(function (k) {
        var pts = curve(state.dn, k, B);
        svg.appendChild(ns('polyline', { fill: 'none', stroke: colour[k], 'stroke-width': 2.5, points: pts }));
        // Label at the right-hand end of the curve. Putting it at the marker
        // instead made the four labels pile onto one another.
        var last = pts.split(' ').pop().split(',');
        svg.appendChild(ns('text', { x: Number(last[0]) + 5, y: Number(last[1]) + 4, fill: colour[k],
                                     'font-size': 10, 'font-weight': 'bold' }, name[k]));
      });

      // Marker at the current field strength, with a dot on every curve it cuts.
      var x = state.dOct / B;
      if (x <= XMAX) {
        svg.appendChild(ns('line', { x1: px(x), y1: Y0, x2: px(x), y2: Y1, stroke: '#94a3b8', 'stroke-width': 1, 'stroke-dasharray': '4 4' }));
        var L = levels(state.dn, state.dOct, B), base = g === 'A2' ? L.A2 : L.T1F;
        keys.forEach(function (k) {
          var y = (L[k] - base) / B;
          if (y > YMAX) return;
          svg.appendChild(ns('circle', { cx: px(x), cy: py(y), r: 3.5, fill: colour[k] }));
        });
      }
    }

    function render() {
      var B = state.B, ion = IONS[state.dn];
      var bs = bands(state.dn, state.dOct, B);
      el.doV.textContent = Math.round(state.dOct);
      el.bV.textContent = Math.round(B);
      el.ratio.textContent = (state.dOct / B).toFixed(1);
      el.beta.textContent = (B / ion.B0).toFixed(2);
      el.rows.innerHTML = bs.map(function (b) {
        return '<tr><td style="text-align:left">' + b.label + '</td><td>' + Math.round(b.e) + '</td></tr>';
      }).join('');
      draw();
      el.live.textContent = ion.label + ': Δo = ' + Math.round(state.dOct) + ', B = ' + Math.round(B) +
        ' cm⁻¹, Δo/B = ' + (state.dOct / B).toFixed(1) + ', β = ' + (B / ion.B0).toFixed(2) +
        '. Bands at ' + bs.map(function (b) { return Math.round(b.e); }).join(', ') + ' cm⁻¹.';
    }

    function recompute() {
      if (state.mode === 'fwd') {
        state.dOct = Number(el.doIn.value);
        state.B = Number(el.bIn.value);
        el.doOut.textContent = Math.round(state.dOct);
        el.bOut.textContent = Math.round(state.B);
      } else {
        var n1 = Number(el.n1.value), n2 = Number(el.n2.value);
        if (!(n1 > 0 && n2 > n1)) {                  // band 2 above band 1, or there is nothing to fit
          el.live.textContent = 'Band 2 must lie above band 1.';
          return;
        }
        var f = fit(state.dn, n1, n2);
        state.dOct = f.dOct;
        state.B = f.B;
        render();
        if (!f.plausible) {
          el.live.textContent += ' — β = ' + f.beta.toFixed(2) + ' is outside the physical range, so these two bands are almost certainly not ' +
            IONS[state.dn].label + ' band 1 and band 2. Check the assignment before the arithmetic.';
        }
        return;
      }
      render();
    }

    ionBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.dn = Number(b.getAttribute('data-dn'));
        ionBtns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        recompute();
      });
    });
    modeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.mode = b.getAttribute('data-mode');
        modeBtns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        el.fwd.hidden = state.mode !== 'fwd';
        el.inv.hidden = state.mode !== 'inv';
        recompute();
      });
    });
    [el.doIn, el.bIn].forEach(function (r) { r.addEventListener('input', recompute); });
    [el.n1, el.n2].forEach(function (r) { r.addEventListener('change', recompute); });

    /* slide_engine.js binds Space and the arrow keys on the document for slide
     * navigation. A range slider needs the same keys, so swallow them here
     * rather than patching the shared engine for one page. */
    [el.doIn, el.bIn, el.n1, el.n2].forEach(function (r) {
      r.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') e.stopPropagation();
      });
    });

    recompute();
  };

  return api;
}));
