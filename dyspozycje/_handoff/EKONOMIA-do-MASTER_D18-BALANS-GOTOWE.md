# EKONOMIA → MASTER: B2-D18 balans start × trudność — GOTOWE

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **U MASTERA** (lane B done · playtest Macieja · ewent. F review main.ts) |
| **Batch** | `D18-BALANS-TRUDNOSC` |
| **Decyzja** | Formularz ABC 2026-07-02 · `docs/decyzje/B2-D18-ABC-MACIEJ.md` |
| **Dyspozycja wejściowa** | `MASTER-do-EKONOMIA_D18-balans-trudnosc-2026-07-02.md` |

---

## Decyzje Macieja (skrót)

| ID | Wybór |
|----|-------|
| D18-0 | **A** — pełny pakiet |
| D18-1 | **A** — hard ostry (+2 osada, próg 10%) |
| D18-2 | **A** — religia tylko ze świątynią |
| D18-3 | **B** — immunitet Wealth **10/5/3** |
| D18-4 | **A+C** — easy stolica T1–T10: **+1 Sz + +1 Prawo** |
| D18-5 | **A** — wagi **55/45 · 50/50 · 45/55** |
| D18-6 | **A** — osada **+4/+3/+2** |

---

## Deliverables

| Warstwa | Pliki |
|---------|--------|
| JSON | `gra/data/society-params.json` — wagi, progi buntu 5/8/10, grace 3/2/2, osada 4/3/2, bonus stolica |
| JSON | `gra/data/econ-params.json` — `wealth_immunitet_tur` **10/5/3** |
| Kod B | `society-breakdown.ts` — `loadRevoltParams`, progi per difficulty, bonus stolica w breakdown |
| Kod B | `society-inputs.ts` — `stolicaEasyBonusActive`, `isPlayerCapitalCity` |
| UI B | `cityPanel.ts` — `getTurn`, stolica w lokalnym breakdown |
| **Wpięcie silnik** | `main.ts` — stolica, `loadRevoltParams`, `population` w Prawie, immunitet W przy founding |

> **Uwaga:** dyspozycja D18 mówiła „bez main.ts”; minimalne wpięcie **konieczne** dla D18-4 (stolica + tura) i grace buntu. Handoff F: `EKONOMIA-do-INTEGRATOR_d18-main-wiring.md`.

| Dodatkowo (sesja wcześniejsza) | Religia T0 w panelu — `culture-religion.ts` + `main.ts` |

---

## Testy (PASS)

| Suite | Wynik |
|-------|-------|
| `society-breakdown-test.cjs` | **26/26** (+ D18 progi easy 5%/grace 3) |
| `wealth-test.cjs` | **28/28** |
| `culture-religion-test.cjs` | **51/51** (religia T0) |

---

## DoD playtest (Maciej — PT-Z05)

Ten sam seed · **easy / normal / hard** · T1–T5 · pierwsze miasto pop=1:

- brak fałszywego **„Bunt skrajny”** w T1
- easy: linie **„Stolica imperium”** (+1 Sz, +1 Prawo) w T1–T10
- różnica trudności odczuwalna (Wealth immunitet, wagi Porządku)

Sygnał: `playtest OK` / `BUG:`

---

## Prośba do Mastera

1. **ACK** batch D18 lub poprawki liczb po playteście.
2. **Integrator F:** review diff `main.ts` (🟡 cross) — handoff poniżej.
3. **REJESTR:** B2-D18 → ✅ po playteście Macieja + promocja ROBOCZA (jeśli F).

**Lane B:** **IDLE** po ACK.

**Powiązane:** `REJESTR-DECYZJI.md` · `docs/obieg/MASTER-WATCH.md`
