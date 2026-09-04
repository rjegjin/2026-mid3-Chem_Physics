/* Module 10B — the relativistic dial.
   Two ideas, one slider. (i) A 1s electron's speed is Z*alpha in units of c, so
   the whole of relativistic chemistry is set by one dimensionless number.
   (ii) The resulting 6s contraction does not grow monotonically with Z — it
   peaks at gold, and that peak is the reason this module exists.
   Everything here is hydrogenic and deliberately crude; the honest numbers are
   the Dirac-Fock ones in DESCLAUX below. */
(function () {
  'use strict';

  var ALPHA = 1 / 137.035999084;

  /* Speed of a 1s electron in units of c. Hydrogenic, and that is the point:
     no fitting, no parameters, just Z. */
  function vOverC(Z) { return Z * ALPHA; }

  /* Lorentz factor. Above Z = 1/alpha the point-nucleus hydrogenic model has no
     bound 1s solution at all; the caller gets null rather than a NaN. */
  function gamma(Z) {
    var b = vOverC(Z);
    if (b >= 1) return null;
    return 1 / Math.sqrt(1 - b * b);
  }

  /* <r>_rel / <r>_nonrel for 1s. The Bohr radius carries 1/m, and the mass is
     gamma times larger, so the orbital shrinks by exactly 1/gamma. */
  function contraction(Z) {
    var g = gamma(Z);
    return g === null ? null : 1 / g;
  }

  /* Relativistic / non-relativistic <r> for the valence 6s shell, from
     Desclaux's Dirac-Fock atomic calculations (1973) as reproduced in
     Pyykko, Chem. Rev. 88 (1988) 563. Values are read off the published curve
     to two decimals — good enough to locate the maximum, not to quote. */
  var DESCLAUX = [
    { Z: 55, sym: 'Cs', r: 0.98 }, { Z: 56, sym: 'Ba', r: 0.97 },
    { Z: 57, sym: 'La', r: 0.96 }, { Z: 72, sym: 'Hf', r: 0.86 },
    { Z: 73, sym: 'Ta', r: 0.85 }, { Z: 74, sym: 'W',  r: 0.84 },
    { Z: 75, sym: 'Re', r: 0.83 }, { Z: 76, sym: 'Os', r: 0.83 },
    { Z: 77, sym: 'Ir', r: 0.82 }, { Z: 78, sym: 'Pt', r: 0.81 },
    { Z: 79, sym: 'Au', r: 0.80 }, { Z: 80, sym: 'Hg', r: 0.82 },
    { Z: 81, sym: 'Tl', r: 0.83 }, { Z: 82, sym: 'Pb', r: 0.84 },
    { Z: 83, sym: 'Bi', r: 0.85 }, { Z: 86, sym: 'Rn', r: 0.87 }
  ];

  /* The claim the chart is there to make. Asserted in tests/adv10b_check.js so
     that editing the table cannot silently move the maximum off gold. */
  function goldMaximum() {
    return DESCLAUX.reduce(function (a, b) { return b.r < a.r ? b : a; });
  }

  var API = { ALPHA: ALPHA, vOverC: vOverC, gamma: gamma, contraction: contraction,
              DESCLAUX: DESCLAUX, goldMaximum: goldMaximum };

  if (typeof module === 'object' && module.exports) { module.exports = API; return; }
  window.rel10b = API;

  function init() {
    var slider = document.getElementById('rel-z');
    if (!slider) return;
    var out = {
      z: document.getElementById('rel-z-v'),
      v: document.getElementById('rel-v-v'),
      g: document.getElementById('rel-g-v'),
      c: document.getElementById('rel-c-v')
    };
    var live = document.getElementById('rel-live');
    var marker = document.getElementById('rel-marker');

    function draw(Z) {
      var g = gamma(Z), c = contraction(Z);
      out.z.textContent = String(Z);
      out.v.textContent = (vOverC(Z) * 100).toFixed(1) + '% c';
      out.g.textContent = g === null ? '—' : g.toFixed(4);
      out.c.textContent = c === null ? '—' : (100 * (1 - c)).toFixed(1) + '%';
      /* Move the chart marker only where the chart has data. Outside 55-86 the
         6s shell is not the valence shell and the curve says nothing. */
      if (marker) {
        var hit = DESCLAUX.filter(function (e) { return e.Z === Z; })[0];
        marker.setAttribute('visibility', hit ? 'visible' : 'hidden');
        if (hit) marker.setAttribute('x', String(xOf(hit.Z) - 9));
      }
      if (live) {
        live.textContent = 'Z = ' + Z + ': a 1s electron moves at ' +
          (vOverC(Z) * 100).toFixed(0) + ' per cent of the speed of light, and its orbital is ' +
          (c === null ? 'unbound in this model' : (100 * (1 - c)).toFixed(0) + ' per cent smaller than the non-relativistic one');
      }
    }
    function xOf(Z) { return 60 + (Z - 54) * 21; }

    slider.addEventListener('input', function () { draw(parseInt(slider.value, 10)); });
    /* The slide engine owns the arrow keys. Without this the slider steals them
       or the deck jumps a slide while the user is dialling Z. */
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation();
    });
    draw(parseInt(slider.value, 10));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
