# Advanced Inorganic Chemistry — Roadmap

One semester: 15 modules plus 4 bonus instalments. Upper-undergraduate to
introductory-graduate level.

This document is the **skeleton**. It carries each module's section map and
production status, not its prose. Writing a module starts from the section map
here.

- Presentation syllabus: [`index.html`](index.html) — this folder's landing page
- **Layout**: this folder owns the course. The rendering platform is *not* here:
  stylesheets are `../css/`, the slide engine is `../js/slide_engine.js`, and the
  Module 07 applet lives at `../js/adv_inorganic_07.js`. Do not copy those in —
  they are shared with the middle-school lessons on purpose, so a fix to the
  engine reaches both. Pages are `NN.html` / `bonus_NN.html`; reference PDFs are
  in `refs/`.
- QA runs from the repository root: `make check` covers `adv_inorganic/*.html`,
  and `python3 render_check.py adv_inorganic/NN.html` renders one page.
- Language: the whole `adv_inorganic/` family is **English**, including code
  comments in `../js/adv_inorganic_*.js`. Modules 01, 02, 03 and Bonus 01 were
  English from the start; everything else was converted on 2026-08-26.
- Updated: 2026-08-27 (split into `adv_inorganic/`; electron transfer restored to Module 12, bioinorganic confirmed out of scope)

## The Axis of This Course

```
Symmetry → Electronic Structure → Bonding → Spectroscopy → Reactivity → Materials
```

This is not "inorganic chemistry as a collection of topics". The goal is to
follow that single axis from one end to the other. No module is a
self-contained chapter; **each takes the previous module's result as its input.**

```
Molecular Symmetry → Group Theory → Representations → SALCs / Selection Rules
→ Atomic Orbitals → Molecular Orbitals → Transition-Metal d Orbitals
→ Crystal Field Theory → Ligand Field Theory → Electronic States / Spectroscopy
→ Spin–Orbit Coupling → Metal–Ligand Bonding → Organometallic Reactions
→ Catalytic Cycles → Extended Solids → Band Structure → Modern Inorganic Materials
```

---

## Production Status at a Glance

| # | Module | File | Status |
|---|---|---|---|
| B01 | Linear Algebra for Quantum Chemistry | `bonus_01.html` | Complete |
| B02 | Hilbert Spaces & Symmetry Operators | `bonus_02.html` | Outline |
| B03 | Representation Theory (proof of the GOT) | `bonus_03.html` | Outline |
| B04 | Quantum Hamiltonian Symmetry | `bonus_04.html` | Outline |
| 01 | Molecular Symmetry & Point Groups | `01.html` | Complete (28 sections) |
| 02 | Representations & Character Tables | `02.html` | Complete |
| 03 | Vibrational Spectroscopy & SALCs | `03.html` | Complete |
| 04 | Atomic Orbitals & Angular Momentum | `04.html` | Complete (14 sections) |
| 05 | MO Theory: Diatomics | `05.html` | Complete (15 sections) |
| 06 | MO Theory: Polyatomics | `06.html` | Complete (15 sections) |
| 07 | Crystal Field Theory | `07.html` | Complete (14 sections + applet) |
| 08 | Ligand Field Theory | `08.html` | Complete (15 sections) |
| 09 | Electronic Spectra | `09.html` | Outline (two sessions) |
| 10 | Spin–Orbit & Relativistic Effects | `10.html` | Outline |
| 11 | Organometallic Bonding | `11.html` | Outline |
| 12 | Organometallic Reactions | `12.html` | Outline |
| 13 | Homogeneous Catalysis | `13.html` | Outline |
| 14 | Solid-State & Band Theory | `14.html` | Outline |
| 15 | Modern Inorganic Materials | `15.html` | Outline |

Written in full: **9** (01, 02, 03, 04, 05, 06, 07, 08 + Bonus 01).
Outlines: **10** (7 modules + 3 bonus).
Every module has a page that opens, and all of them are surfaced in `index.html`.

### File Numbering Now Matches Module Numbering (resolved)

`04.html` used to hold MO theory and SALCs, which put it out of
step with the curriculum numbering. Resolved by option (A): the file number
*is* the module number.

```
04.html (MO · SALCs) → 06.html   [git mv]
04.html                                        [new · atomic orbitals]
```

Also updated at the same time: two links and a card label in `index.html`, one
link in `index.html`, and the internal `Lecture 04` / `Module 4` strings.

---

## Dropped From the Earlier Roadmap — Decided 2026-08-27

Two topics present in the previous 15-lecture plan have lost their place.

| Topic | Status | Assessment |
|---|---|---|
| Reaction mechanisms of coordination compounds (substitution, inner/outer-sphere electron transfer) | **Restored** | Substitution is taken up by ligand substitution in Module 12. Electron transfer is now **section 6 of Module 12** (Marcus theory, inner versus outer sphere). |
| Bioinorganic chemistry (haemoglobin, metalloenzymes, drug delivery) | **Stays out** | Falls outside this course's axis (symmetry → electronic structure → properties). Confirmed deliberate. |

Outcome:

- Electron transfer → **section 6 of Module 12**, written when Module 12 is
  written. It is a natural bridge between coordination chemistry (Part III) and
  organometallic reactivity (Part VI), and it closes a real gap: Marcus theory
  appeared nowhere in the fifteen modules.
- Bioinorganic chemistry → **out of scope**, deliberately. The course axis runs
  symmetry → electronic structure → properties, and a metalloenzyme survey does
  not sit on it. Making it a module would also push the course past one
  semester. The Module 15 placeholder is removed.

---

# Bonus Track — Mathematical Foundations

Not optional. It is **a prerequisite for Module 02.** Accept the Great
Orthogonality Theorem without its proof and every selection rule from Module 03
onward stays a rule to be memorised.

`bonus_01.html` already contains the algebraic structure of
groups (subgroups, cosets, Lagrange's theorem, conjugacy classes, normal
subgroups, quotient groups, isomorphisms), Hilbert space, linear, adjoint,
unitary and Hermitian operators, change of basis, invariance of the trace,
direct sums, tensor products, and the definition of a representation. In other
words, it holds the scope of B01 to B03 in a single file. **The work is a split,
not new writing.**

## Bonus 01 — Linear Algebra for Quantum Chemistry
1. Vector spaces and linear operators
2. Eigenvalues and eigenvectors
3. Change of basis
4. Unitary and Hermitian operators
5. Direct sums and tensor products

## Bonus 02 — Hilbert Spaces & Symmetry Operators
1. Hilbert space
2. Bra–ket notation
3. Quantum states as vectors
4. Symmetry operators
5. Commutators
6. Simultaneous eigenstates

## Bonus 03 — Representation Theory
1. Group representations
2. Reducible and irreducible representations
3. Schur's lemmas
4. The orthogonality theorem
5. **Proof of the Great Orthogonality Theorem**
6. Character orthogonality

## Bonus 04 — Quantum Hamiltonian Symmetry
1. What `[H, R] = 0` means
2. Simultaneous block diagonalisation of the Hamiltonian
3. Symmetry → irreducible representations → block-diagonal Hamiltonian → selection rules

Why these four exist, in one sentence: **to show that a selection rule is not a
rule but the conclusion of a theorem.**

---

# Part I. Symmetry & Group Theory

## Module 01 — Molecular Symmetry & Point Groups  ✔ Complete
**Central question**: How is molecular symmetry classified mathematically?

1. Symmetry operations against symmetry elements
2. `E, Cn, σ, i, Sn`
3. Proper and improper rotations
4. Molecular point groups — `C1, Cs, Ci, Cnv, Cnh, Dn, Dnh, Dnd, Td, Oh`
5. The point-group decision algorithm
6. Mathematical extension — closure, associativity, identity, inverse
7. Abelian and non-Abelian groups
8. Conjugacy classes

**Destination**: given a structure, assign the point group systematically, and
connect molecular symmetry to the abstract group.

## Module 02 — Representations & Character Tables  ✔ Complete
**Central question**: How are symmetry operations expressed in linear algebra?

1. Symmetry operations as matrices
2. Similarity transformations
3. Reducible `Γ` and irreducible representations
4. Characters and character tables
5. The Great Orthogonality Theorem
6. The reduction formula, `a_i = (1/h) Σ_R n_R χ^Γ(R) χ^i(R)*`
7. Reading Mulliken symbols
8. Worked examples — `C2v, C3v, D3h, Td, Oh`

## Module 03 — Vibrational Spectroscopy & SALCs  ✔ Complete
**Central question**: How does symmetry predict an IR or Raman spectrum?

1. Number of normal modes — `3N−6` non-linear, `3N−5` linear
2. The Cartesian displacement representation
3. Removing translations and rotations
4. Symmetry of the normal modes
5. The IR selection rule — `Γ_vib ⊃ x, y, z`
6. The Raman selection rule — `x², y², z², xy, xz, yz`
7. SALCs — `ψ = Σ c_i φ_i`
8. Connecting to the projection operator

---

# Part II. Electronic Structure & Bonding

## Module 04 — Atomic Orbitals, Electron Configurations & Angular Momentum  ✔ Complete
**File**: `04.html` (14 sections)
**Central question**: What determines the electronic state of an atom?

Scope was **widened** relative to the earlier plan. Angular momentum and Slater
determinants belong here, or the term symbols of Module 09 arrive out of nowhere.

1. The hydrogenic Schrödinger equation
2. Quantum numbers `n, l, m_l, m_s`
3. Radial and angular functions, nodes
4. Orbital angular momentum — `L² = l(l+1)ℏ²`
5. Spin angular momentum
6. The Pauli principle and antisymmetry
7. **Slater determinants**
8. The Aufbau principle
9. Hund's rules and exchange stabilisation
10. `ns` against `(n−1)d` in the transition metals
11. Why the `s` electrons ionise first

**Downstream dependency**: items 7, 9 and 11 are the premises of Module 09
(term symbols) and Module 10 (LS coupling).

## Module 05 — MO Theory: Diatomic Molecules  ✔ Complete
**File**: `05.html` (15 sections)
**Central question**: How do atomic orbitals combine into molecular orbitals?

1. LCAO — `ψ = c_A φ_A + c_B φ_B`
2. Bonding and antibonding orbitals
3. The overlap integral
4. Bond order — `BO = (N_b − N_a)/2`
5. The homonuclear series — `H₂ He₂ Li₂ B₂ C₂ N₂ O₂ F₂`
6. `s`–`p` mixing
7. HOMO and LUMO
8. The paramagnetism of O₂
9. Heteronuclear diatomics — CO, NO

## Module 06 — MO Theory: Polyatomic Molecules  ✔ Complete
**Central question**: How does symmetry build up a complicated MO scheme?
**File**: `06.html` (15 sections)

This is where group theory and MO theory properly meet.

```
Ligand orbitals → SALCs → central-atom orbitals → molecular orbitals
```

1. LCAO-MO review ✔
2. The goal of a SALC and why it is needed ✔
3. The projection operator method ✔
4. Case study — H₂O ✔
5. Central-atom orbitals ✔
6. Constructing the MO diagram ✔
7. `Oh` σ bonding ✔
8. Transition to ligand field theory ✔
9. Cases — NH₃ (`C3v`), BF₃ (`D3h`) ✔ added
10. Cases — CH₄ (`Td`), SF₆ (`Oh`) ✔ added
11. Walsh diagrams and Walsh's rule ✔ added
12. `AH₂` electron count → bond angle (six species, BeH₂ to H₂O) ✔ added

**Two things the added sections nail down**:

- The photoelectron spectrum of CH₄ shows **two** ionisations. The `sp³` hybrid
  picture predicts four degenerate bonds and so does not match that
  observation. Hybrids describe bond **directions**, never orbital **energies**.
- SF₆ needs no `3d` participation (no expanded octet). Its six bonds come from
  four sulfur-based bonding orbitals plus two ligand-based `eg` combinations.
  Hypervalency is a **delocalisation** result, and that same `Γσ` is reused for
  `[ML6]` in Module 08.

---

# Part III. Coordination Chemistry

## Module 07 — Crystal Field Theory  ✔ Complete
**File**: `07.html` (14 sections) · applet `../js/adv_inorganic_07.js`
**Central question**: How does a ligand change the energy of the d orbitals?

1. What this model is and is not — the point-charge assumption and its price
2. Where the splitting comes from; why `dz²` belongs to `eg`
3. The barycentre rule — `2(+0.6) + 3(−0.4) = 0`
4. Tetrahedral and square planar — inverted labels, `Δt ≈ (4/9)Δo` as an estimate
5. **Applet** — geometry × d-electron count × spin state
6. CFSE — the `d³`–`d⁸` high/low-spin table
7. Traces in data — the double-humped hydration enthalpy, with a warning against
   circular reasoning
8. High spin against low spin — `Δo` versus `P`, and the exchange term inside `P`
   (recovered from Module 04 §9)
9. What makes `Δo` large — and where CFT runs out
10. Magnetism — the spin-only formula and the conditions under which it fails
11. Jahn–Teller — why `eg` degeneracy distorts strongly and `t2g` weakly
12. The working life of the model — Bethe 1929, Van Vleck 1932, the 1950s
13. Key competencies

**Method kept**: the spectrochemical series is presented as CFT's **failure**,
which is what motivates Module 08.

## Module 08 — Ligand Field Theory  ✔ Complete
**File**: `08.html` (15 sections)
**Central question**: How does molecular orbital theory account for metal–ligand bonding?

The hinge from CFT into MO theory. The SALCs of Module 06 are recovered here.

1. Metal–ligand σ bonding
2. Ligand SALCs
3. The octahedral MO diagram
4. Symmetry of `eg` and `t2g`
5. **π donor ligands** — `t2g(ligand) ↔ t2g(metal)`, `Δo` decreases
6. **π acceptor ligands** — `d_π → π*`, back-donation, `t2g` stabilised, `Δo` increases
7. The spectrochemical series — `I⁻ < Br⁻ < Cl⁻ < F⁻ < H₂O < NH₃ < en < NO₂⁻ < CN⁻ < CO`

**Method**: item 7 is never handed over as a list to learn. The order is
**derived** from three classes — σ donor, π donor, π acceptor.

---

# Part IV. Electronic States & Spectroscopy

## Module 09 — Electronic Spectra of Transition-Metal Complexes  ◻ Outline (two sessions)
**Central question**: Where does the absorption spectrum of a transition metal come from?

Large enough for two sessions. Spin–orbit coupling is excluded here and deferred
to Module 10 — that separation is the reason 09 and 10 are distinct modules.

1. Counting the microstates of `d^n` — the allowed `(m_l, m_s)` combinations
2. Russell–Saunders coupling — `L = Σ l_i`, `S = Σ s_i`, `J = L + S`
3. The term symbol `^{2S+1}L_J` (e.g. `³F₂`)
4. Hund's rules — maximum `S`, then maximum `L`, then `J` by shell filling
5. Free ion to ligand field — `³F → ³T1g + ³T2g + ³A2g`
6. The spin selection rule — `ΔS = 0`
7. The Laporte rule — `g ↮ g` in a centrosymmetric complex, so octahedral d–d
   transitions are formally forbidden
8. Orgel diagrams — qualitative excited-state analysis
9. Tanabe–Sugano diagrams — `E/B` against `Δ/B`
10. Extracting `Δo` and the Racah parameter `B` from a measured spectrum

**Premise**: the Slater determinants and angular momentum of Module 04. Without
them, items 1 to 3 have nothing to stand on.

---

# Part V. Advanced Electronic Structure

## Module 10 — Spin–Orbit Coupling, Relativistic Effects & Magnetism  ◻ Outline
**Central question**: Why is the electronic structure of a heavy element different in kind?

The junction between Module 09 and this one is the most important in the course.
The difference between Russell–Saunders and `jj` coupling gets its proper place here.

1. LS coupling — light atoms: couple `L` and `S`, then `J = L + S`
2. The spin–orbit interaction — `H_SO ≈ λ L·S`
3. `jj` coupling — heavy atoms: couple each `j_i = l_i + s_i`, then `J = Σ j_i`
4. Intermediate coupling
5. Spin–orbit splitting
6. The orbital contribution to magnetism
7. Quenching of orbital angular momentum
8. The effective magnetic moment
9. The Zeeman effect
10. Relativistic chemistry — contraction of `s`, `p_{1/2}`; expansion of `d`, `f`
11. Cases — the colour of gold · the melting point of mercury · the inert-pair
    effect in lead

---

# Part VI. Organometallic Chemistry

## Module 11 — Metal–Ligand Bonding & Electron Counting  ◻ Outline
**Central question**: How is a metal–organic ligand bond to be read?

The crossing from inorganic into organometallic chemistry.

1. The ionic (oxidation-state) method
2. The covalent (neutral) method
3. The 18-electron rule — `N_e = d^n + ligand electrons`
4. Principal ligands — CO, CN⁻, phosphines, alkenes, alkynes, hydride, alkyl, Cp, allyl
5. Hapticity `η^n` (e.g. `η⁵-C₅H₅`)
6. Representative complexes — `Fe(CO)₅`, `Ni(CO)₄`, `Cr(CO)₆`, ferrocene
7. The Dewar–Chatt–Duncanson model — `π_alkene → d_metal` σ donation together
   with `d_metal → π*_alkene` back-donation

**Link to Module 08**: the CO back-donation of item 6 is the π acceptor of
Module 08, unchanged.

## Module 12 — Elementary Organometallic Reactions  ◻ Outline
**Central question**: What elementary steps are available to a metal complex?

Each elementary step must be understood separately before any catalytic cycle.

1. Ligand substitution — `ML_n + L' → ML_{n−1}L' + L`, associative and dissociative
2. Oxidative addition — `M^n → M^{n+2}`, coordination number +2, electron count +2
3. Reductive elimination — the reverse of item 2
4. Migratory insertion — `M–R + CO → M–C(O)R`, and alkene insertion
5. β-Hydride elimination — `M–CH₂CH₂R → M–H + CH₂=CHR`
6. Electron transfer — outer sphere (no bond broken, Marcus theory) versus inner
   sphere (a bridging ligand, the Taube Cr(II)/Co(III) experiment). The
   reorganisation energy λ, and why self-exchange rates span twelve orders of
   magnitude. This is also the bridge from coordination chemistry (Part III) to
   organometallic reactivity: substitution moves ligands, electron transfer
   moves the d count, and Module 07's high-spin/low-spin distinction decides
   which is fast.

**Analytical frame (common to every section)**:

```
oxidation state + electron count + coordination number
```

All three are tracked at once. That frame is the premise of Module 13.

**Restored 2026-08-27**: inner/outer-sphere electron transfer is section 6.
It was missing from the whole course; this is its cheapest home.

## Module 13 — Homogeneous Catalysis & Catalytic Cycles  ◻ Outline
**Central question**: How do elementary reactions assemble into a catalytic cycle?

1. Hydrogenation — Wilkinson's catalyst `RhCl(PPh₃)₃`
2. Hydroformylation — `alkene + CO + H₂ → aldehyde`
3. The Monsanto and Cativa processes — methanol carbonylation
4. Cross-coupling — Suzuki, Heck, Negishi, Kumada

**Method**: no cycle is offered as a picture to memorise. At each step, tabulate

1. metal oxidation state
2. d-electron count
3. total electron count
4. coordination number
5. type of elementary reaction

so that the cycle is understood as **a sequence of changes in electronic structure.**

---

# Part VII. Solid-State & Materials Chemistry

## Module 14 — Solid-State Chemistry & Band Theory  ◻ Outline
**Central question**: How does the MO picture extend to the band structure of a solid?

The pivot is this:

```
AO → MO → many MOs → bands
```

1. Crystal structures — unit cell, lattice, Bravais lattices, coordination number, packing
2. Representative structures — simple cubic, BCC, FCC, HCP, NaCl, CsCl, zinc blende, fluorite
3. Reciprocal space — the reciprocal lattice, Brillouin zones, the `k` vector
4. Band theory — `E = E(k)`
5. Valence band · conduction band · Fermi level · band gap
6. Classification — metal / semiconductor / insulator
7. Semiconductors — intrinsic, n-type, p-type, donor and acceptor levels

## Module 15 — Modern Inorganic Materials & Integrated Case Studies  ◻ Outline
**Central question**: How do electronic structure and symmetry decide a material's properties?

**No new theory.** This module applies everything preceding it to real materials.

### Case 1 — Transition-metal oxides
`TiO₂, Fe₂O₃, MnO₂`

```
crystal symmetry → d orbitals → band structure → optical properties
```

### Case 2 — Perovskites
`ABX₃` — crystal symmetry, octahedral coordination, structural distortion,
electronic structure. Oxide and halide perovskites.

### Case 3 — Coordination polymers and MOFs
`metal nodes + organic linkers → extended network`.
Coordination geometry, topology, porosity, gas adsorption, catalysis.

### Case 4 — Luminescent complexes
Ru, Ir and lanthanide complexes. Transition types — `d–d`, LMCT, MLCT,
ligand-centred.

### Case 5 — Inorganic energy materials
Photocatalysts, electrocatalysts, battery materials, fuel-cell catalysts.
The link between electronic structure and measured performance.

---

# Recommended Production Order

Dependencies make the numerical order the cheapest, with two exceptions.

1. **Module 04 first.** Modules 09 and 10 depend on it and it was empty.
   Building 07 and 08 around that hole means coming back later.
2. **Fill the gaps in Module 06 before writing Module 05.** Adding to an
   existing file is cheaper than writing a new one, and the ligand SALCs of
   Module 08 presuppose 06.

Order (the first two are done):

```
~~04~~ → ~~06 gaps~~ → ~~07~~ → ~~05~~ → ~~08~~ → 09 → 10 → 11 → 12 → 13 → 14 → 15
Split Bonus 02 and 03 out of Bonus 01 → Bonus 04
```

Coordination chemistry is the body of the subject and Module 09 needs the `Δo`
of 07 and 08, so **07 → 08 → 09** runs first. Module 05 follows: Module 06
already reviews LCAO, so 05 is not blocking, but Modules 11 and 14 want it.

---

# Production Standards (fixed 2026-08-26)

Three rules for filling in the outlines. Letting the standard drift between
instalments costs far more to repair afterwards.

## 1. Depth — the level of Modules 04 and 06

1.6 to 2.5 KB per section: prose body plus tables, SVG, history, and explicit
refutation of misconceptions. Target size is **13 to 15 body sections plus an
end slide**, 25 to 37 KB.

Measured spread among the finished modules is wide — 02, 03 and Bonus 01 run
about 1.0 KB per section (equations and bullet points), while 04 runs 2.5 KB
(prose). New instalments follow 04 and 06. The narrative principles of this
roadmap — derive a series rather than making it memorised, weave in history,
refute misconceptions by name — cannot be met by bullet points.

## 2. Applets — Modules 07, 09 and 14 only

Built only where a static figure genuinely cannot teach the material.

| Module | Applet | Why it is needed |
|---|---|---|
| 07 | d splitting / CFSE explorer | geometry × d^n × spin state is too many combinations for one figure |
| 09 | Reading a Tanabe–Sugano diagram | extracting Δo and B is a procedure, not a fact |
| 14 | AO → MO → band | the process of a band forming as N grows *is* the content |

The other ten stay static. `js/chem_sim.js` (125 lines, a symmetry-operation
simulator) is loaded by 01 and Bonus 01, but both files contain zero buttons and
zero canvases — it is dormant code. It was checked for reuse while building the
07 applet and did not fit: it animates molecules and prints matrices, a
different job.

Applet conventions follow the `explore` section of `docs/SLIDE_ARCHETYPES.md` —
controls are `.pick`-style buttons or `<input type="range">`, 44 px touch
targets, any change announced in words through `aria-live`, and the script split
into `../js/adv_inorganic_{NN}.js`.

## 3. Process — one module per pull request

Write one module, open a PR, take corrections, then start the next. Do not batch
by phase. This is what prevents discovering a drifted standard thirteen
instalments later — and it is how the Korean-language mistake in this family was
caught after one module rather than fourteen.

## Progress

- [x] **07 Crystal Field Theory** — 14 sections + CFSE applet
- [x] **05 MO Diatomics** — 15 sections
- [x] **08 Ligand Field Theory** — 15 sections
- [ ] **09 Electronic Spectra** ← next (two sessions, applet)
- [ ] 10 Spin–Orbit & Relativistic
- [ ] 11 → 12 → 13 Organometallic
- [ ] 14 Band Theory (applet) → 15 Materials
- [ ] Split Bonus 02 and 03 → Bonus 04

---

# Production Rules

- Visual family follows the existing `adv_inorganic/*.html`: white ground,
  achromatic academic type, `math-box` / `info-card` / `step-box`, MathJax 3.
  Do not mix in the colour scheme of the school-lesson pages.
- **Language is English** throughout the family, including code comments in
  `../js/adv_inorganic_*.js`. Modules 01, 02, 03 and Bonus 01 set that precedent.
- Slide skeleton is `main > section` plus `js/slide_engine.js`. This family uses
  `id="sN"` rather than `data-slide-index`; keep to that convention.
- The last section is `<section id="s40" class="end">`.
- Adding a new Tailwind class means re-running `make css`. `test_css_classes.py`
  will catch a forgotten rebuild.
- Before finishing: `make check` and `make render-check FILE=<file>`.
- Applet logic gets a runnable check. The 07 applet is verified against
  textbook values by a Node script over its own source (54 assertions), plus a
  Selenium pass over the DOM contract.
