# Kolejka UX — odhaczanie po kolei (Maciej + MASTER)

**Kanon:** `gra-kanon/START.html` · md5 `a8da1fcb1adc733e5d112c8768c52900`  
**Zasada:** idziemy **po kolei** wiersza po wierszu · nie wracamy do ✅ bez regresji.

Legenda: `[ ]` otwarte · `[~]` w toku · `[x]` zamknięte · `[—]` poza kolejką Macieja

---

## 0 · MASTER (hub) — przed kolejnym P1

| # | Zadanie | Status |
|---|---------|--------|
| 0.1 | Potwierdzić kanon md5 `42efefff…` | [x] 2026-07-04 ~13:29 |
| 0.2 | Bramka batchu miasto+B-26 (okolica, wire, smoke, diplomacy, koszary) | [x] |
| 0.3 | Baseline-red zapisane (logic 202/203, combat, battle-smoke — nie blokują UX) | [x] |
| 0.4 | Wpis dziennika + handoff zamknięty | [x] |
| 0.5 | Dyspozycja lane **P1 dyplomacja** przygotowana (nie startować przed „idź dyplo”) | [x] |

---

## P1 — gameplay + duży UX (kolejność oceny Macieja)

| # | ID | Temat | Status | Uwaga |
|---|-----|-------|--------|-------|
| 1 | **Dyplomacja** | Reskin 1E · `diploUiSkin` + 7 modułów UI | [x] **KANON** | md5 `55bdb2af…` · 2026-07-04 |
| 2 | **Nauka** | Hub A-28 + drzewko B-33/B-34 | [ ] **HOLD** | Najpierw **dokładny przegląd** Macieja — nie implementować przed review |
| 3 | **E-15** | Ekran końca gry · `victoryScreen.ts` | [x] **KANON** | md5 `2ebc4ee5…` · playtest odłożony |

---

## P2 — mapa + polish miasta

| # | ID | Temat | Status |
|---|-----|-------|--------|
| 4 | A-06 | Panel jednostki na mapie | [~] **SZKIC** | kod w kanonie · **Design 1E pending** — nie final |
| 5 | A-27 | Modal dyplomacji (blocking) | [ ] |
| 6 | A-10 | Panel armii | [ ] |
| 7 | A-08 | Build menu SVG | [ ] |
| 8 | B-17…B-31 | Polish zakładek miasta (opcj.) | [ ] |

---

## P3 — niski priorytet

| # | ID | Temat | Status |
|---|-----|-------|--------|
| 9 | E-06 | About | [ ] |
| 10 | A-14 | Bilans imperium | [ ] |
| 11 | — | Panel cudów | [ ] |
| 12 | A-20 | Toasty (polish opcj.) | [ ] |

---

## Zamknięte (nie wracać na listę oceny)

| Temat | Status |
|-------|--------|
| Miasto W3 shell + exit + okolica ręczna | [x] kanon |
| B-26 Zarządzanie polami (SVG Tier6) | [x] kanon |
| Modale C-04 / C-05 / A-19 | [x] kanon |
| HUD imperium layout · menu · kreator · lewa kolumna miasta · minimapa A-05 | [x] |

---

## Poza kolejką Macieja

| Temat | Kto | Status |
|-------|-----|--------|
| Bitwa C-16, layout, pre-bitwa | Maciej sam | [—] |
| logic-test [92], combat baseline | MAPA / UNITS | [—] |

---

**Aktualny krok:** **A-06** — PNG review → werdykt Macieja (treść + wygląd A/B/C). Design **nie startuje** przed werdyktem.

*Workflow:* [`workflow/DESIGN-LANE-KOLEJNOSC.md`](workflow/DESIGN-LANE-KOLEJNOSC.md) · PNG: `export/A-06-review-stary-vs-szkic.png`*
