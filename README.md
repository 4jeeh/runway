# `RUNWAY` // Swiss Minimalist Financial Ledger & Burn Rate Engine

[![System Revision](https://img.shields.io/badge/SYS--REV-2.0.0--SWISS--LEDGER-10B981?style=flat-square&labelColor=09090B)](https://github.com/4jeeh/runway)
[![Design System](https://img.shields.io/badge/AESTHETIC-SWISS%20MINIMALIST%20LEDGER-FAFAFA?style=flat-square&labelColor=09090B)](./src/styles/ledger.css)
[![Currencies](https://img.shields.io/badge/FX%20ENGINE-USD%20%7C%20EUR%20%7C%20IDR-10B981?style=flat-square&labelColor=09090B)](./src/core/currency.js)
[![Verification](https://img.shields.io/badge/TESTS-PASSING-10B981?style=flat-square&labelColor=09090B)](./tests/runwayEngine.test.js)
[![License: MIT](https://img.shields.io/badge/LICENSE-MIT-FAFAFA?style=flat-square&labelColor=09090B)](./LICENSE)

> **TECHNICAL SPECIFICATION // DOCUMENT ID: RWY-LEDGER-2026-REV2**  
> **Repository:** [https://github.com/4jeeh/runway](https://github.com/4jeeh/runway)

---

## 1.0 SYSTEM OVERVIEW

**`runway`** is a high-density personal and venture financial ledger, burn-rate analyzer, and capital runway simulator engineered with a strict **Swiss Minimalist Ledger** aesthetic.

Originally conceived as a monolithic procedural C++ university assignment (`Simulasi Manajemen Keuangan Mahasiswa.cpp`), **`runway`** re-architects the foundational cashflow logic into a decoupled, zero-dependency ES module core (`src/core/`) powering both an interactive **Data-Dense Web Terminal** and a deterministic **CLI Simulation & Verification Suite**.

### 1.1 Design Philosophy (Strict Anti-AI-Slop & High Taste)

Engineered in accordance with Swiss International Typographic Style (*Josef Müller-Brockmann* grid systems) and institutional financial terminals:

- **Zero Decorative Noise:** No cartoon piggy banks, no 3D gold coins, no rainbow gradients, and no AI marketing buzzwords.
- **Monochromatic Structural Palette:**
  - `Dark Zinc (#09090B)` — Primary canvas and ledger substrate
  - `Surface Zinc (#0D0D10)` — Header strips and input cells
  - `Hairline Border (#27272A)` — Exposed `1px solid` structural grid dividers
  - `Stark White (#FAFAFA)` — High-contrast primary readouts
- **Functional Status Accents:**
  - `Emerald (#10B981)` — Net surplus cashflow, autonomous runway, and optimal 50/30/20 compliance
  - `Crimson (#F43F5E)` — Net cash burn (deficit), reserve depletion warning, and overbudget allocation breaches
- **Tabular Monospace Discipline:** Enforces `'JetBrains Mono'` with `font-variant-numeric: tabular-nums` (`"tnum" 1, "zero" 1`) so every decimal point, percentage, and currency column aligns vertically with mathematical precision.

---

## 2.0 ARCHITECTURAL TRANSFORMATION & METRIC COMPARISON

| Dimension | Legacy Implementation (`Simulasi Manajemen Keuangan Mahasiswa.cpp`) | Modernized **`runway`** System (`v2.0.0`) |
| :--- | :--- | :--- |
| **Source Structure** | Single monolithic file with spaces in filename (`224 LOC`) | Modular ES architecture in `src/core/`, `src/ui/`, `src/styles/`, and `tests/` |
| **Language & Docs** | Indonesian classroom prompts and comments | 100% International Standard English codebase, UI, CLI, and documentation |
| **Currency Support** | Hardcoded single-currency `Rp` string insertion | Multi-Currency Engine (`USD $`, `EUR €`, `IDR Rp`) with live FX conversion |
| **Cashflow Analytics** | Basic `income - totalExpenses` & `%` of total expenses | **Monthly Gross Burn**, **Daily Burn Velocity**, **Net Cashflow**, and **Operating Margin** |
| **Runway Modeling** | *Not implemented* | Dual **Zero-Income Gross Runway** & **Deficit Depletion Net Runway** in **Months & Days** |
| **Allocation Framework** | Unclassified flat category list | **50/30/20 Rule Engine** (`NEEDS <= 50%`, `WANTS <= 30%`, `SAVINGS >= 20%`) with variance audit |
| **Interface & Output** | Blocking `cin`/`cout` loop + `Laporan_Keuangan.txt` | **Swiss Minimalist Web UI** + **CLI Simulator** + **Audit Exporter (`.TXT`)** |
| **Verification** | Manual interactive stdin entry | Automated `node:test` verification suite covering Surplus, Deficit, and FX round-trips |

---

## 3.0 MATHEMATICAL SPECIFICATION

Given Monthly Income Inflow $I$, Liquid Cash Reserve $R_0$, and $n$ categorized monthly expense items $E_1, E_2, \dots, E_n$:

### 3.1 Gross Burn, Daily Velocity & Net Cashflow

$$B_{\text{gross}} = \sum_{i=1}^{n} E_i, \qquad B_{\text{daily}} = \frac{B_{\text{gross}}}{30}$$

$$CF_{\text{net}} = I - B_{\text{gross}}, \qquad B_{\text{net}} = \max(0,\, B_{\text{gross}} - I)$$

### 3.2 Financial Runway Horizons (Months & Days)

1. **Zero-Income Gross Runway** (how long post-cycle liquid capital $R_{\text{eff}} = R_0 + \max(0, CF_{\text{net}})$ sustains total operating outflow if income drops to zero):

$$\text{Runway}_{\text{gross (months)}} = \frac{R_{\text{eff}}}{B_{\text{gross}}}, \qquad \text{Runway}_{\text{gross (days)}} = \text{round}\!\left(\frac{R_{\text{eff}}}{B_{\text{gross}}} \times 30\right)$$

2. **Deficit Depletion Net Runway** (time until liquid reserve $R_0$ is exhausted when operating in deficit $B_{\text{net}} > 0$):

$$\text{Runway}_{\text{net (months)}} = \begin{cases} \dfrac{R_0}{B_{\text{net}}} & \text{if } B_{\text{net}} > 0 \\[8pt] \infty \text{ (Self-Sustaining)} & \text{if } CF_{\text{net}} \ge 0 \end{cases}$$

### 3.3 50 / 30 / 20 Allocation Rule Audit

Each line item is assigned to $\mathcal{B} \in \{\text{NEEDS}, \text{WANTS}, \text{SAVINGS}\}$, with unallocated positive surplus automatically credited to savings capacity:

$$\text{Share}_{\text{NEEDS}} = \frac{\sum_{E_i \in \text{NEEDS}} E_i}{I} \le 50\%, \qquad \text{Share}_{\text{WANTS}} = \frac{\sum_{E_i \in \text{WANTS}} E_i}{I} \le 30\%$$

$$\text{Share}_{\text{SAVINGS}} = \frac{\sum_{E_i \in \text{SAVINGS}} E_i + \max(0, CF_{\text{net}})}{I} \ge 20\%$$

---

## 4.0 DIRECTORY ARCHITECTURE

```text
runway/
├── index.html                        # Swiss Minimalist Ledger Web Terminal DOM
├── package.json                      # Build, CLI simulation, and test scripts
├── vite.config.js                    # Vite production bundler configuration
├── .gitignore                        # Node, build, and report artifact exclusions
├── LICENSE                           # MIT License
├── README.md                         # Institutional documentation & mathematical spec
├── src/
│   ├── main.js                       # Browser application bootstrap
│   ├── cli.js                        # Headless CLI simulation runner (Surplus & Deficit)
│   ├── core/
│   │   ├── currency.js               # Multi-currency formatter & FX converter (USD, EUR, IDR)
│   │   ├── runwayEngine.js           # Burn Rate, Runway (Mo/Days), and 50/30/20 solver
│   │   ├── scenarios.js              # Canonical Surplus, Deficit, IDR, and EUR presets
│   │   └── exporter.js               # Plaintext Swiss-grid audit report generator (.TXT)
│   ├── ui/
│   │   └── ledgerView.js             # Interactive DOM controller & live FX state engine
│   └── styles/
│       └── ledger.css                # Strict #09090B / #27272A / #FAFAFA tabular-nums CSS
└── tests/
    └── runwayEngine.test.js          # Automated verification suite
```

---

## 5.0 LOCAL EXECUTION & VERIFICATION

```bash
# 1. Install dependencies
npm install

# 2. Run automated unit test suite (Surplus, Deficit, 50/30/20, Multi-Currency)
npm test

# 3. Execute CLI simulation suite (prints full ledger tables & runway metrics)
npm run simulate

# 4. Launch interactive Swiss Minimalist Web Ledger (http://localhost:5173)
npm run dev

# 5. Build production bundle
npm run build
```

---

## 6.0 LICENSE

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full terms.
