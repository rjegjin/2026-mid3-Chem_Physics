/* adv_inorganic_07.js — Module 07 crystal field splitting / CFSE explorer
 *
 * Geometry × d-electron count × spin state is 3 × 11 × 2, so a static figure
 * cannot teach it. This is one of the three modules that gets an applet
 * (see the production standards in ADV_INORGANIC_ROADMAP.md).
 * js/chem_sim.js could not be reused: it animates symmetry operations on
 * molecules and displays their matrices, which is a different job.
 *
 * All energies are model values referred to a barycentre of zero.
 *   Oh    t2g = -0.4,  eg = +0.6                     [units of Δo]
 *   Td    e   = -0.6,  t2 = +0.4                     [units of Δt, Δt ≈ (4/9)Δo]
 *   D4h   dxz,dyz = -0.514 · dz2 = -0.428 ·
 *         dxy = +0.228 · dx2-y2 = +1.228             [units of Δo]
 * The D4h numbers are the standard point-charge values; the order of dz2 and
 * dxy can invert with the ligand. Slide 3 of the module says so explicitly.
 */
(function () {
  'use strict';

  function sub(base, s) {   // subscript for SVG text
    return base + '<tspan baseline-shift="sub" font-size="10">' + s + '</tspan>';
  }

  var GEOM = {
    Oh: {
      label: 'Octahedral (Oh)', unit: 'Δo',
      levels: [
        { svg: sub('t', '2g'), plain: 't2g', e: -0.4, n: 3 },
        { svg: sub('e', 'g'), plain: 'eg', e: 0.6, n: 2 }
      ],
      note: 'The two e<sub>g</sub> orbitals point straight at the ligands and rise; the three t<sub>2g</sub> orbitals point <b>between</b> them and fall.',
      spinChoice: true
    },
    Td: {
      label: 'Tetrahedral (Td)', unit: 'Δt',
      levels: [
        { svg: 'e', plain: 'e', e: -0.6, n: 2 },
        { svg: sub('t', '2'), plain: 't2', e: 0.4, n: 3 }
      ],
      note: 'The labels <b>invert</b>. With only four ligands and no axis aimed at directly, Δ<sub>t</sub> ≈ (4/9)Δ<sub>o</sub> — much smaller.',
      spinChoice: false
    },
    D4h: {
      label: 'Square planar (D4h)', unit: 'Δo',
      levels: [
        { svg: sub('d', 'xz') + ', ' + sub('d', 'yz'), plain: 'dxz, dyz', e: -0.514, n: 2 },
        { svg: sub('d', 'z²'), plain: 'dz²', e: -0.428, n: 1 },
        { svg: sub('d', 'xy'), plain: 'dxy', e: 0.228, n: 1 },
        { svg: sub('d', 'x²−y²'), plain: 'dx²−y²', e: 1.228, n: 1 }
      ],
      note: 'The limit reached by pulling the two z-axis ligands away. Only d<sub>x²−y²</sub> is left far above the rest, which is what makes d<sup>8</sup> diamagnetic and low spin.',
      spinChoice: true
    }
  };

  /* Filling rules.
     High spin: one electron into every orbital of the whole d set first
                (Hund), then start pairing.
     Low spin:  fill the lowest level completely before climbing, but
                **Hund's rule still applies inside a level** —
                t2g^4 is up-down up up (two unpaired), not up-down up-down (zero).
                Low spin means "crowd into the lower level", not "pair up as
                much as possible". */
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
    if (Math.abs(cfse) < 1e-9) cfse = 0;      // keep "-0.00" off the readout
    return {
      slots: slots, cfse: cfse, unpaired: unpaired,
      // pairs the free ion already had are not the ligand field's doing
      extraPairs: pairs - Math.max(0, n - 5),
      mu: Math.sqrt(unpaired * (unpaired + 2))
    };
  }

  /* Do high spin and low spin actually give different configurations?
     "d4 to d7" is an octahedral rule only. Square planar has four levels, so
     the two differ at d8 — and diamagnetic square-planar d8 is a headline case
     of this module. So compare the two fillings instead of hard-coding a range. */
  function spinChoiceMatters(geomKey, n) {
    if (!GEOM[geomKey].spinChoice) return false;
    return analyse(geomKey, n, false).unpaired !== analyse(geomKey, n, true).unpaired;
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
      p.push('<text x="' + (W - 18) + '" y="' + (y(0) - 8) + '" fill="#94a3b8" font-size="11" text-anchor="end">barycentre 0</text>');
      p.push('<text x="12" y="24" fill="#475569" font-size="12" font-weight="bold">Energy (units of ' + g.unit + ')</text>');

      /* Nearby levels collide: in D4h, dz2 (-0.428) and dxz,dyz (-0.514) are only
         0.086 Δo apart, so drawn at the same x their lines and labels overlap.
         Walk down from the highest level; when the gap is tight, push the label
         down and move the level line into a second lane. */
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
        if (Math.abs(labelY - yy) > 2) {   // leader line back to the level it names
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
        return c + ' in ' + L.plain;
      }).join(', ');

      host.setAttribute('aria-label',
        g.label + ' crystal field splitting diagram. A d' + n + ' ' + (lowSpin ? 'low-spin' : 'high-spin') +
        ' configuration with ' + levelText + '. ' + a.unpaired + ' unpaired electrons, CFSE ' +
        a.cfse.toFixed(2) + ' ' + g.unit + extra + '.');

      out.cfse.textContent = a.cfse.toFixed(2) + ' ' + g.unit + extra;
      out.unp.textContent = String(a.unpaired);
      out.mu.textContent = a.mu.toFixed(2) + ' μB';
      out.cfg.textContent = 'd' + n + ' · ' + (lowSpin ? 'low spin' : 'high spin');
      out.nOut.textContent = 'd' + n;
      out.note.innerHTML = g.note;

      var canChoose = spinChoiceMatters(geomKey, n);
      spinBtns.forEach(function (b) {
        b.disabled = !canChoose;
        b.setAttribute('aria-pressed', String(canChoose && (b.dataset.spin === 'low') === lowSpin));
        b.style.opacity = canChoose ? '' : '0.45';
      });

      var why = !g.spinChoice
        ? 'Delta t is too small to beat the pairing energy, so tetrahedral complexes are high spin in practice.'
        : !canChoose
          ? 'At d' + n + ' the high-spin and low-spin fillings coincide — there is no choice to make.'
          : 'Which one occurs is decided by Delta against the pairing energy P.';
      out.live.textContent = g.label + ' d' + n + ' ' + (lowSpin ? 'low spin' : 'high spin') +
        ' — ' + levelText + '. ' + a.unpaired + ' unpaired, CFSE ' + a.cfse.toFixed(2) + ' ' + g.unit + extra +
        ', spin-only mu = ' + a.mu.toFixed(2) + ' μB. ' + why;
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
