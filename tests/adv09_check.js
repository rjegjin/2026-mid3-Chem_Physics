/* tests/adv09_check.js — physics check for the Module 09 Tanabe–Sugano applet.
 *
 *   node tests/adv09_check.js
 *
 * No framework on purpose: the module ships four formulas and two limits, and
 * the limits are what pin the off-diagonal element down. A failure here means
 * the diagram in 09.html is drawing curves nobody should trust.
 */
'use strict';
const assert = require('assert');
const TS = require('../js/adv_inorganic_09.js');

let n = 0;
function ok(cond, msg) { n++; assert.ok(cond, msg); }
function near(a, b, tol, msg) { n++; assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`); }

const A2_FAMILY = [3, 8];      // A2g ground state
const T1_FAMILY = [2, 7];      // T1g ground state
const ALL = [2, 3, 7, 8];

/* 1. Zero-field limit — the free ion. F-derived states degenerate at 0, P at 15B. */
for (const dn of ALL) {
  for (const B of [500, 725, 1041]) {
    const L = TS.levels(dn, 0, B);
    near(L.A2, 0, 1e-9, `dn=${dn} B=${B} A2 at zero field`);
    near(L.T2, 0, 1e-9, `dn=${dn} B=${B} T2 at zero field`);
    near(L.T1F, 0, 1e-9, `dn=${dn} B=${B} T1F at zero field`);
    near(L.T1P, 15 * B, 1e-9, `dn=${dn} B=${B} T1P at 15B`);
  }
}

/* 2. Strong-field limit — B = 0 must return the pure configuration energies
 *    t2g^3, t2g^2 eg, t2g eg^2 = -12, -2, +8 Dq (twice for -2). This is the
 *    assertion that rejects a 6Dq off-diagonal element. */
for (const dn of A2_FAMILY) {
  const dOct = 20000, Dq = dOct / 10;
  const L = TS.levels(dn, dOct, 0);
  const got = [L.A2, L.T2, L.T1F, L.T1P].map(e => e / Dq).sort((a, b) => a - b);
  const want = [-12, -2, -2, 8];
  got.forEach((v, i) => near(v, want[i], 1e-6, `dn=${dn} strong-field level ${i}`));
}
for (const dn of T1_FAMILY) {
  const dOct = 20000, Dq = dOct / 10;
  const L = TS.levels(dn, dOct, 0);
  const got = [L.A2, L.T2, L.T1F, L.T1P].map(e => e / Dq).sort((a, b) => a - b);
  const want = [-8, 2, 2, 12];        // the same set with Dq → -Dq
  got.forEach((v, i) => near(v, want[i], 1e-6, `dn=${dn} strong-field level ${i}`));
}

/* 3. Trace invariance. The full Hamiltonian trace cannot depend on the field:
 *    1·E(A2) + 3·E(T2) + 3·[E(T1F) + E(T1P)] = 45B for every Dq. */
for (const dn of ALL) {
  for (const dOct of [0, 5000, 17400, 33000]) {
    for (const B of [400, 725, 1100]) {
      const L = TS.levels(dn, dOct, B);
      near(L.A2 + 3 * L.T2 + 3 * (L.T1F + L.T1P), 45 * B, 1e-6, `dn=${dn} trace at Δo=${dOct}`);
    }
  }
}

/* 4. Hole–electron equivalence (module §8): d^n at +Δo is d^(10-n) at -Δo. */
for (const B of [600, 900]) {
  for (const dOct of [8000, 22000]) {
    const a = TS.levels(3, dOct, B), b = TS.levels(2, -dOct, B);
    for (const k of ['A2', 'T2', 'T1F', 'T1P']) near(a[k], b[k], 1e-6, `hole/electron ${k}`);
  }
}

/* 5. For an A2 ground state the first band IS Δo — the fact the worked example
 *    of §15 leans on. For a T1 ground state it is not. */
for (const dn of A2_FAMILY) {
  for (const dOct of [6000, 17400, 30000]) {
    for (const B of [500, 725, 1041]) {
      near(TS.bands(dn, dOct, B)[0].e, dOct, 1e-6, `dn=${dn} band1 = Δo`);
    }
  }
}
for (const dn of T1_FAMILY) {
  for (const dOct of [6000, 17400]) {
    const b1 = TS.bands(dn, dOct, 800)[0].e;
    ok(Math.abs(b1 - dOct) / dOct > 0.01, `dn=${dn} band1 must not equal Δo`);
  }
}

/* 6. Bands rise with the field, for every ion. */
for (const dn of ALL) {
  let prev = -Infinity;
  for (let dOct = 5000; dOct <= 30000; dOct += 2500) {
    const e = TS.bands(dn, dOct, 800)[0].e;
    ok(e > prev, `dn=${dn} band1 monotonic in Δo`);
    prev = e;
  }
}

/* 7. [Cr(H2O)6]3+ — the worked example. Δo = 17400, B = 725 must reproduce the
 *    measured 24600 cm^-1 second band and over-predict the third (37800). */
{
  const b = TS.bands(3, 17400, 725).map(x => x.e);
  near(b[0], 17400, 1, 'Cr(H2O)6 band 1');
  near(b[1], 24574, 5, 'Cr(H2O)6 band 2 against 24600 measured');
  near(b[2], 38501, 10, 'Cr(H2O)6 band 3');
  ok(b[2] > 37800, 'band 3 is over-predicted, as §15 states');
  ok((b[2] - 37800) / 37800 < 0.03, 'band 3 error stays inside 3%');
}

/* 8. The fit is the inverse of the prediction. Round-trip every ion. */
for (const dn of ALL) {
  for (const dOct of [7000, 12000, 17400, 26000]) {
    for (const B of [520, 725, 980]) {
      const b = TS.bands(dn, dOct, B);
      const f = TS.fit(dn, b[0].e, b[1].e);
      near(f.dOct, dOct, dOct * 0.01, `dn=${dn} round-trip Δo`);
      near(f.B, B, B * 0.01, `dn=${dn} round-trip B`);
      near(f.predicted[2].e, b[2].e, b[2].e * 0.02, `dn=${dn} round-trip band 3`);
    }
  }
}

/* 9. Fitting the measured chromium bands returns the textbook parameters. */
{
  const f = TS.fit(3, 17400, 24600);
  near(f.dOct, 17400, 50, 'fitted Δo for [Cr(H2O)6]3+');
  near(f.B, 727, 12, 'fitted B for [Cr(H2O)6]3+');
  ok(f.B / TS.IONS[3].B0 < 1, 'β must be below 1 — nephelauxetic, §16');
  near(f.B / TS.IONS[3].B0, 0.79, 0.02, 'β for [Cr(H2O)6]3+');
}

/* 10. A fit that returns nonsense has to say so (§15: β out of range means the
 *     assignment is wrong). The chromium spectrum read as d7 is the test case. */
{
  ok(TS.fit(3, 17400, 24600).plausible, 'the correct assignment is plausible');
  const wrong = TS.fit(7, 17400, 24600);
  ok(!wrong.plausible, 'the same bands read as d7 must be flagged');
  ok(wrong.beta < 0.25 || wrong.beta > 1, 'the flag is raised by β, not by the residual alone');
}

/* 11. Only the four non-crossover ions exist. d4–d6 are excluded by design. */
for (const dn of [1, 4, 5, 6, 9]) ok(!(dn in TS.IONS), `d${dn} must not be offered`);

console.log(`OK — adv09 physics: ${n} assertions passed`);
