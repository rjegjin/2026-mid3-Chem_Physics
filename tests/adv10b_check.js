/* node tests/adv10b_check.js — the physics claims of Module 10B, made testable. */
var assert = require('assert');
var R = require('../js/adv_inorganic_10b.js');
var n = 0;
function ok(c, m) { assert.ok(c, m); n++; }
function close(a, b, tol, m) { ok(Math.abs(a - b) <= tol, m + ' (got ' + a + ', want ' + b + ')'); }

// 1. The whole module rests on v/c = Z*alpha. Hydrogen first.
close(R.vOverC(1), R.ALPHA, 1e-15, 'v/c of 1s in H is alpha');
close(R.gamma(1), 1.0000266, 1e-6, 'hydrogen is non-relativistic to 3e-5');

// 2. Gold: the number Pyykko quotes.
close(R.vOverC(79), 0.5765, 5e-4, 'a 1s electron in Au moves at 58% of c');
close(R.gamma(79), 1.2238, 5e-4, 'mass factor at Au is 1.22');
close(R.contraction(79), 0.8171, 5e-4, '1s in Au contracts by 18%');

// 3. Contraction is monotonic in Z for the 1s model — the non-monotonic bit is
//    a valence effect, not this formula. Keeping both straight is the point.
for (var Z = 2; Z <= 100; Z++) ok(R.contraction(Z) < R.contraction(Z - 1), 'monotonic at Z=' + Z);

// 4. No bound hydrogenic 1s above Z = 1/alpha; the model must say so, not NaN.
ok(R.gamma(138) === null && R.contraction(138) === null, 'Z=138 returns null, not NaN');
ok(R.gamma(137) !== null, 'Z=137 is still bound');

// 5. The chart exists to show one thing: the maximum sits at gold.
var g = R.goldMaximum();
ok(g.sym === 'Au' && g.Z === 79, 'the 6s contraction maximum is gold');
ok(R.DESCLAUX.every(function (e) { return e.r > 0.5 && e.r <= 1; }), 'ratios are physical');
// Hg must rebound above Au or the "gold maximum" is not a maximum.
var by = {}; R.DESCLAUX.forEach(function (e) { by[e.sym] = e.r; });
ok(by.Hg > by.Au && by.Pt > by.Au, 'Pt and Hg both sit above Au');
ok(by.Cs > by.Hf, '6s contraction grows across the row before it peaks');

console.log('OK — ' + n + ' assertions (Module 10B relativistic dial)');
