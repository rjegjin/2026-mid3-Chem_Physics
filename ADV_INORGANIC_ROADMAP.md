# 고급 무기화학 (Advanced Inorganic Chemistry) — 뼈대

한 학기 15 모듈 + Bonus 4편. 학부 상급 및 대학원 기초 수준.

이 문서는 **뼈대**다. 각 모듈의 절 구성(Section Map)과 제작 상태만 담고, 본문 서술은
담지 않는다. 실제 HTML 제작은 이 문서의 Section Map을 입력으로 시작한다.

- 발표용 syllabus: [`syllabus.html`](syllabus.html)
- 갱신: 2026-08-24 (15 모듈 재구성)

## 이 과정의 축

```
Symmetry → Electronic Structure → Bonding → Spectroscopy → Reactivity → Materials
```

"무기화학을 여러 주제로 공부한다"가 아니다. 위 하나의 축을 끝까지 잇는 것이 목표다.
각 모듈은 독립된 챕터가 아니라 **이전 모듈의 결과를 입력으로 받는다.**

```
Molecular Symmetry → Group Theory → Representations → SALCs / Selection Rules
→ Atomic Orbitals → Molecular Orbitals → Transition-Metal d Orbitals
→ Crystal Field Theory → Ligand Field Theory → Electronic States / Spectroscopy
→ Spin–Orbit Coupling → Metal–Ligand Bonding → Organometallic Reactions
→ Catalytic Cycles → Extended Solids → Band Structure → Modern Inorganic Materials
```

---

## 제작 상태 한눈에

| # | 모듈 | 파일 | 상태 |
|---|---|---|---|
| B01 | Linear Algebra for Quantum Chemistry | `adv_inorganic_bonus_01.html` | 완료 |
| B02 | Hilbert Spaces & Symmetry Operators| `adv_inorganic_bonus_02.html` | 뼈대 |
| B03 | Representation Theory (GOT 증명)| `adv_inorganic_bonus_03.html` | 뼈대 |
| B04 | Quantum Hamiltonian Symmetry| `adv_inorganic_bonus_04.html` | 뼈대 |
| 01 | Molecular Symmetry & Point Groups | `adv_inorganic_01.html` | 완료 (28절) |
| 02 | Representations & Character Tables | `adv_inorganic_02.html` | 완료 |
| 03 | Vibrational Spectroscopy & SALCs | `adv_inorganic_03.html` | 완료 |
| 04 | Atomic Orbitals & Angular Momentum | `adv_inorganic_04.html` | 완료 (14절) |
| 05 | MO Theory: Diatomics | `adv_inorganic_05.html` | 뼈대 |
| 06 | MO Theory: Polyatomics | `adv_inorganic_06.html` | 완료 (15절) |
| 07 | Crystal Field Theory | `adv_inorganic_07.html` | 뼈대 |
| 08 | Ligand Field Theory | `adv_inorganic_08.html` | 뼈대 |
| 09 | Electronic Spectra | `adv_inorganic_09.html` | 뼈대 (2회분) |
| 10 | Spin–Orbit & Relativistic Effects | `adv_inorganic_10.html` | 뼈대 |
| 11 | Organometallic Bonding | `adv_inorganic_11.html` | 뼈대 |
| 12 | Organometallic Reactions | `adv_inorganic_12.html` | 뼈대 |
| 13 | Homogeneous Catalysis | `adv_inorganic_13.html` | 뼈대 |
| 14 | Solid-State & Band Theory | `adv_inorganic_14.html` | 뼈대 |
| 15 | Modern Inorganic Materials | `adv_inorganic_15.html` | 뼈대 |

본문 완료 **6편**(01·02·03·04·06 + Bonus 01) · 뼈대 **13편**(모듈 10 + Bonus 3).
모든 모듈이 열리는 HTML을 갖고 있으며 `index.html`에 전부 노출돼 있다.

### 파일명과 모듈 번호를 일치시켰다 (해소)

`adv_inorganic_04.html`이 MO 이론·SALCs를 담고 있어 모듈 번호와 어긋나 있었다.
(A)안으로 정리했다 — 파일 번호가 곧 모듈 번호다.

```
adv_inorganic_04.html (MO·SALCs) → adv_inorganic_06.html   [git mv]
adv_inorganic_04.html                                       [신규 · 원자 오비탈]
```

같이 고친 것: `index.html` 링크 2곳과 카드 라벨, `syllabus.html` 링크 1곳,
파일 내부의 `Lecture 04` · `Module 4` 표기.

## 이전 로드맵에서 빠진 것 — 결정 필요

이전 15강 구성에 있었으나 새 구성에서 자리를 잃은 두 주제다.

| 주제 | 상태 | 판단 |
|---|---|---|
| 배위 화합물의 반응 메커니즘 (치환, 내부권/외부권 전자 전이) | 부분 흡수 | 치환은 Module 12의 ligand substitution이 받는다. **전자 전이(Marcus 이론, inner/outer sphere)는 어디에도 없다.** |
| 생무기화학 (헤모글로빈, 금속효소, 약물 전달) | 통째로 빠짐 | 이 과정의 축(대칭성 → 전자구조 → 물성)에서 벗어난다. 의도적 제외로 보이지만 확인이 필요하다. |

되살린다면 자리는 이렇다:

- 전자 전이 → **Module 12에 한 절 추가**가 가장 싸다. 배위 화학(Part III)과 유기금속
  반응(Part V) 사이의 자연스러운 다리이기도 하다.
- 생무기화학 → Module 15의 **Case 6**으로 넣는다. 독립 모듈로 만들면 16강이 되어
  한 학기 분량을 넘는다.

---

# Bonus Track — Mathematical Foundations

선택이 아니다. **Module 02의 선수 과정**이다. GOT를 증명 없이 받아들이면 Module 03
이후의 selection rule이 규칙 암기로 남는다.

`adv_inorganic_bonus_01.html`은 이미 군의 대수 구조(부분군·잉여류·Lagrange 정리·
켤레류·정규부분군·몫군·동형), Hilbert 공간, 선형·수반·유니터리·에르미트 연산자,
기저 변환, 대각합 불변, 직합, 텐서곱, 표현의 정의까지 담고 있다. 즉 아래 B01~B03의
범위를 한 파일에 몰아넣은 상태다. **분리 작업이지 신규 집필이 아니다.**

## Bonus 01 — Linear Algebra for Quantum Chemistry
1. 벡터 공간과 선형 연산자
2. 고윳값과 고유벡터
3. 기저 변환
4. 유니터리·에르미트 연산자
5. 직합과 텐서곱

## Bonus 02 — Hilbert Spaces & Symmetry Operators
1. Hilbert 공간
2. 브라-켓 표기
3. 양자 상태를 벡터로 보기
4. 대칭 연산자
5. 교환자
6. 동시 고유상태

## Bonus 03 — Representation Theory
1. 군의 표현
2. 가약 표현과 기약 표현
3. Schur's Lemma
4. 직교성 정리
5. **Great Orthogonality Theorem 증명**
6. 지표의 직교성

## Bonus 04 — Quantum Hamiltonian Symmetry
1. `[H, R] = 0`의 의미
2. Hamiltonian의 동시 블록 대각화
3. 대칭성 → 기약 표현 → 블록 대각 Hamiltonian → selection rule

이 네 편이 왜 필요한지를 한 줄로 말하면: **selection rule은 규칙이 아니라 정리(theorem)의
결론이라는 것**을 보여주기 위해서다.

---

# Part I. Symmetry & Group Theory

## Module 01 — Molecular Symmetry & Point Groups  ✔ 완료
**중심 질문**: 분자의 대칭성을 어떻게 수학적으로 분류하는가?

1. 대칭 조작과 대칭 요소의 구별
2. `E, Cn, σ, i, Sn`
3. 진성 회전과 비진성 회전
4. 분자 점군 — `C1, Cs, Ci, Cnv, Cnh, Dn, Dnh, Dnd, Td, Oh`
5. 점군 결정 알고리즘
6. 수학적 확장 — closure, associativity, identity, inverse
7. Abelian / non-Abelian
8. 켤레류(conjugacy class)

**도착점**: 분자 구조를 보고 점군을 체계적으로 판별하고, 분자 대칭성을 추상적 군과 연결한다.

## Module 02 — Representations & Character Tables  ✔ 완료
**중심 질문**: 대칭 operation을 어떻게 선형대수로 표현하는가?

1. 대칭 조작 → 행렬 표현
2. 상사 변환(similarity transformation)
3. 가약 표현 `Γ`과 기약 표현
4. 지표(character)와 지표표
5. Great Orthogonality Theorem
6. 약분 공식 `a_i = (1/h) Σ_R n_R χ^Γ(R) χ^i(R)*`
7. Mulliken 기호 읽기
8. 실전 — `C2v, C3v, D3h, Td, Oh`

## Module 03 — Vibrational Spectroscopy & SALCs  ✔ 완료
**중심 질문**: 대칭성으로 IR/Raman spectrum을 어떻게 예측하는가?

1. 정규 진동 모드 수 — 비선형 `3N−6`, 선형 `3N−5`
2. Cartesian displacement 표현
3. 병진·회전 모드 제거
4. 정규 모드의 대칭성
5. IR selection rule — `Γ_vib ⊃ x, y, z`
6. Raman selection rule — `x², y², z², xy, xz, yz`
7. SALC — `ψ = Σ c_i φ_i`
8. Projection operator로의 연결

---

# Part II. Electronic Structure & Bonding

## Module 04 — Atomic Orbitals, Electron Configurations & Angular Momentum  ✔ 완료
**파일**: `adv_inorganic_04.html` (14절)
**중심 질문**: 원자의 전자상태는 어떻게 결정되는가?

이전 구성보다 **범위를 넓힌다.** 각운동량과 Slater 행렬식을 여기에 넣어야 Module 09의
term symbol이 갑자기 튀어나오지 않는다.

1. 수소꼴 슈뢰딩거 방정식
2. 양자수 `n, l, m_l, m_s`
3. 방사·각 파동함수와 node
4. 궤도 각운동량 — `L² = l(l+1)ℏ²`
5. 스핀 각운동량
6. Pauli 원리와 반대칭성
7. **Slater 행렬식**
8. Aufbau 원리
9. Hund 규칙과 exchange stabilization
10. 전이금속의 `ns`와 `(n−1)d` 에너지
11. 이온화 시 `s` 전자가 먼저 제거되는 이유

**후속 의존**: 7·9·11번이 Module 09(term symbol)와 Module 10(LS coupling)의 전제다.

## Module 05 — MO Theory: Diatomic Molecules  ◻ 뼈대
**중심 질문**: 원자 orbital은 어떻게 분자 orbital을 만드는가?

1. LCAO — `ψ = c_A φ_A + c_B φ_B`
2. 결합·반결합 오비탈
3. 중첩 적분(overlap integral)
4. 결합 차수 — `BO = (N_b − N_a)/2`
5. 등핵 계열 — `H₂ He₂ Li₂ B₂ C₂ N₂ O₂ F₂`
6. `s–p` mixing
7. HOMO / LUMO
8. O₂의 상자성
9. 이핵 이원자 분자 — CO, NO

## Module 06 — MO Theory: Polyatomic Molecules  ✔ 완료
**중심 질문**: 대칭성으로 복잡한 MO를 어떻게 구성하는가?
**파일**: `adv_inorganic_06.html` (15절)

여기서 **군론과 MO 이론이 본격적으로 결합**한다.

```
Ligand orbitals → SALCs → 중심 원자 오비탈 → Molecular orbitals
```

1. LCAO-MO 복습 ✔
2. SALC의 목표와 필요성 ✔
3. Projection operator 방법 ✔
4. 사례 — H₂O ✔
5. 중심 원자 오비탈 ✔
6. MO 도표 구성 ✔
7. `Oh` σ 결합 ✔
8. Ligand Field Theory로의 전환 ✔
9. 사례 — NH₃(`C3v`), BF₃(`D3h`) ✔ 추가
10. 사례 — CH₄(`Td`), SF₆(`Oh`) ✔ 추가
11. Walsh 도표와 Walsh 규칙 ✔ 추가
12. `AH₂` 전자수 → 결합각 (BeH₂ ~ H₂O 6종 표) ✔ 추가

**보완에서 함께 못박은 것 두 가지**:

- CH₄의 광전자 스펙트럼에 이온화가 **2개** 나온다는 사실. `sp³` 혼성 그림은
  네 결합이 축퇴라고 예측하므로 이 관측과 맞지 않다. 혼성은 결합 **방향**을
  말하고 오비탈 **에너지**를 말하지 않는다.
- SF₆에 `3d` 참여(확장 옥텟)가 필요 없다는 것. 여섯 결합은 S 기반 결합성
  오비탈 4개 + 리간드 기반 `eg` 2개에서 나온다. hypervalency는 **비편재화**의
  결과이고, 이 `Γσ`가 Module 08의 `[ML6]`에서 그대로 재사용된다.

---

# Part III. Coordination Chemistry

## Module 07 — Crystal Field Theory  ◻ 뼈대
**중심 질문**: ligand가 d orbital energy를 어떻게 변화시키는가?

1. 자유 이온 5개 d 오비탈의 축퇴
2. 팔면체 갈라짐 — `d → t2g + eg`
3. 사면체 갈라짐
4. 평면사각 갈라짐
5. `Δo`, `Δt ≈ (4/9)Δo`
6. CFSE — `(−0.4 n_t2g + 0.6 n_eg)Δo`
7. High spin / low spin과 pairing energy
8. 자기 모멘트 — spin-only `μ = √(n(n+2)) μ_B`
9. Jahn–Teller 왜곡

## Module 08 — Ligand Field Theory  ◻ 뼈대
**중심 질문**: metal–ligand bonding을 MO 관점에서 어떻게 설명하는가?

CFT에서 MO 이론으로 넘어가는 핵심 모듈이다. Module 06의 SALC가 여기서 회수된다.

1. 금속–리간드 σ 결합
2. Ligand SALCs
3. 팔면체 MO 도표
4. `eg`, `t2g`의 대칭성
5. **π donor ligand** — `t2g(ligand) ↔ t2g(metal)`, `Δo` 감소
6. **π acceptor ligand** — `d_π → π*`, back bonding, `t2g` 안정화, `Δo` 증가
7. 분광화학적 계열 — `I⁻ < Br⁻ < Cl⁻ < F⁻ < H₂O < NH₃ < en < NO₂⁻ < CN⁻ < CO`

**서술 원칙**: 7번을 암기 목록으로 주지 않는다. σ donor / π donor / π acceptor
세 관점으로 계열의 순서를 **유도**한다.

---

# Part IV. Electronic States & Spectroscopy

## Module 09 — Electronic Spectra of Transition-Metal Complexes  ◻ 뼈대 (2회분)
**중심 질문**: 전이금속의 absorption spectrum은 어디에서 오는가?

분량이 커서 한 모듈에 두 회차를 배정한다. spin–orbit coupling은 여기서 다루지 않고
Module 10으로 넘긴다 — 그것이 09/10을 분리한 이유다.

1. `d^n`의 microstate 계산 — 가능한 `(m_l, m_s)` 조합
2. Russell–Saunders coupling — `L = Σ l_i`, `S = Σ s_i`, `J = L + S`
3. Term symbol `^{2S+1}L_J` (예: `³F₂`)
4. Hund 규칙 — `S` 최대, `L` 최대, half-filled 여부에 따른 `J`
5. 자유 이온 → ligand-field 상태 — `³F → ³T1g + ³T2g + ³A2g`
6. Spin selection rule — `ΔS = 0`
7. Laporte 규칙 — 중심대칭 착물에서 `g ↮ g`, 따라서 팔면체 d–d 전이는 원칙적으로 금지
8. Orgel 도표 — 정성적 들뜬 상태 분석
9. Tanabe–Sugano 도표 — `E/B` 대 `Δ/B`
10. 실제 흡수 스펙트럼에서 `Δo`와 Racah `B` 추정

**전제**: Module 04의 Slater 행렬식과 각운동량. 없으면 1~3번이 공중에 뜬다.

---

# Part V. Advanced Electronic Structure

## Module 10 — Spin–Orbit Coupling, Relativistic Effects & Magnetism  ◻ 뼈대
**중심 질문**: 무거운 원소에서 전자구조는 왜 달라지는가?

Module 09와 이 모듈 사이가 이 과정에서 가장 중요한 연결점이다.
Russell–Saunders coupling과 `jj` coupling의 차이가 여기서 정확한 자리를 갖는다.

1. LS coupling — 가벼운 원자: `L`, `S`를 먼저 합성한 뒤 `J = L + S`
2. Spin–orbit 상호작용 — `H_SO ≈ λ L·S`
3. `jj` coupling — 무거운 원자: 개별 전자의 `j_i = l_i + s_i`를 먼저, 그 뒤 `J = Σ j_i`
4. Intermediate coupling
5. Spin–orbit splitting
6. 자성의 orbital 기여
7. Orbital angular momentum의 quenching
8. 유효 자기 모멘트
9. Zeeman 효과
10. 상대론 화학 — `s, p_{1/2}` 수축과 `d, f` 팽창
11. 사례 — Au의 금색 · Hg의 낮은 녹는점 · Pb의 inert-pair effect

---

# Part VI. Organometallic Chemistry

## Module 11 — Metal–Ligand Bonding & Electron Counting  ◻ 뼈대
**중심 질문**: 금속–유기 ligand 결합을 어떻게 해석하는가?

무기화학에서 유기금속화학으로 넘어가는 자리다.

1. 산화수법(oxidation-state method)
2. 중성·공유결합법(neutral/covalent method)
3. 18전자 규칙 — `N_e = d^n + ligand electrons`
4. 주요 ligand — CO, CN⁻, phosphine, alkene, alkyne, hydride, alkyl, Cp, allyl
5. Hapticity `η^n` (예: `η⁵-C₅H₅`)
6. 대표 착물 — `Fe(CO)₅`, `Ni(CO)₄`, `Cr(CO)₆`, ferrocene
7. Dewar–Chatt–Duncanson 모형 —
   `π_alkene → d_metal` σ donation과 `d_metal → π*_alkene` π back-donation을 동시에

**Module 08과의 연결**: 6번의 CO back-bonding은 Module 08의 π acceptor를 그대로 쓴다.

## Module 12 — Elementary Organometallic Reactions  ◻ 뼈대
**중심 질문**: 금속 착물은 어떤 elementary step으로 반응하는가?

촉매 cycle을 배우기 전에 각 elementary step을 분리해서 이해해야 한다.

1. Ligand substitution — `ML_n + L' → ML_{n−1}L' + L`, associative / dissociative
2. Oxidative addition — `M^n → M^{n+2}`, 배위수 +2, 전자수 +2
3. Reductive elimination — 2번의 역반응
4. Migratory insertion — `M–R + CO → M–C(O)R`, alkene insertion
5. β-Hydride elimination — `M–CH₂CH₂R → M–H + CH₂=CHR`

**분석 틀 (모든 절에 공통)**:

```
산화수(oxidation state) + 전자수(electron count) + 배위수(coordination number)
```

세 가지를 동시에 추적하며 해석한다. 이 틀이 Module 13의 전제다.

**추가 검토**: 내부권/외부권 전자 전이를 여기에 한 절로 넣을지 결정 필요(위 "빠진 것" 참조).

## Module 13 — Homogeneous Catalysis & Catalytic Cycles  ◻ 뼈대
**중심 질문**: elementary reactions가 어떻게 catalytic cycle을 구성하는가?

1. 수소화 — Wilkinson 촉매 `RhCl(PPh₃)₃`
2. Hydroformylation — `alkene + CO + H₂ → aldehyde`
3. Monsanto / Cativa 공정 — 메탄올 카보닐화
4. 교차 결합 — Suzuki, Heck, Negishi, Kumada

**서술 원칙**: cycle 그림을 암기시키지 않는다. 각 단계마다

1. 금속 산화수
2. d 전자수
3. 총 전자수
4. 배위수
5. elementary reaction 유형

다섯 가지를 표로 추적해, 촉매 cycle을 **전자구조의 변화로** 이해시킨다.

---

# Part VII. Solid-State & Materials Chemistry

## Module 14 — Solid-State Chemistry & Band Theory  ◻ 뼈대
**중심 질문**: MO 개념이 고체의 band structure로 어떻게 확장되는가?

가장 중요한 연결은 이것이다:

```
AO → MO → many MOs → bands
```

1. 결정 구조 — 단위 세포, 격자, Bravais 격자, 배위수, packing
2. 대표 구조 — simple cubic, BCC, FCC, HCP, NaCl, CsCl, zinc blende, fluorite
3. 역격자 기초 — reciprocal lattice, Brillouin zone, `k` 벡터
4. Band theory — `E = E(k)`
5. 원가띠 · 전도띠 · Fermi 준위 · 띠 간격
6. 분류 — 금속 / 반도체 / 절연체
7. 반도체 — 진성, n형, p형, donor/acceptor 준위

## Module 15 — Modern Inorganic Materials & Integrated Case Studies  ◻ 뼈대
**중심 질문**: 전자구조와 대칭성이 실제 물성을 어떻게 결정하는가?

**새 이론을 추가하지 않는다.** 앞의 내용을 실제 물질에 통합 적용하는 모듈이다.

### Case 1 — 전이금속 산화물
`TiO₂, Fe₂O₃, MnO₂`

```
crystal symmetry → d orbitals → band structure → 광학적 성질
```

### Case 2 — Perovskite
`ABX₃` — crystal symmetry, 팔면체 배위, 구조 왜곡, 전자구조.
산화물 perovskite와 할라이드 perovskite.

### Case 3 — 배위 고분자와 MOF
`금속 노드 + 유기 링커 → 확장 네트워크`.
배위 기하, topology, 기공성, 기체 흡착, 촉매.

### Case 4 — 발광 착물
Ru · Ir · 란타넘족 착물. 전자 전이 유형 — `d–d`, LMCT, MLCT, ligand-centered.

### Case 5 — 무기 에너지 재료
광촉매, 전기촉매, 전지 재료, 연료전지 촉매. 전자구조와 실제 물성의 연결.

### Case 6 — (검토 중) 생무기화학
헤모글로빈·미오글로빈의 금속 중심, 금속효소. 되살리기로 결정되면 여기에 들어간다.

---

# 제작 순서 권고

의존 관계 때문에 번호 순서대로 만드는 것이 가장 싸다. 단 두 가지 예외가 있다.

1. **Module 04를 가장 먼저.** Module 09·10이 여기에 의존하는데 지금 비어 있다.
   이 구멍을 두고 07·08을 만들면 09에서 되돌아와야 한다.
2. **Module 06의 보완(4절 추가)을 Module 05보다 먼저.** 이미 있는 파일에 붙이는 것이
   신규 집필보다 싸고, Module 08의 ligand SALC가 06을 전제한다.

권고 순서 (앞의 두 칸은 완료):

```
~~04~~ → ~~06 보완~~ → 05 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15
Bonus 02·03 분리 → Bonus 04
```

다음은 **Module 05 (MO Theory: Diatomics)** 다. 04(원자 오비탈)와 06(다원자 MO)이
양쪽에 다 있으므로, 05는 그 사이를 메우는 작업이고 참조할 것이 가장 많다.

# 제작 규칙

- 시각 계열은 기존 `adv_inorganic_*.html`을 따른다 — 흰 배경, 무채색 학술체,
  `math-box` / `info-card` / `step-box`, MathJax 3. 수업 차시의 색채 계열과 섞지 않는다.
- 슬라이드 골격은 `main > section` + `js/slide_engine.js`. `data-slide-index`를 쓰지 않고
  `id="s1"` 방식을 쓰는 것이 이 계열의 관례다.
- 마지막 절은 `<section id="s40" class="end">`.
- 새 Tailwind 클래스를 쓰면 `make css`를 다시 돌린다. `test_css_classes.py`가 잡는다.
- 완료 전: `make check` · `make render-check FILE=<파일>`.
