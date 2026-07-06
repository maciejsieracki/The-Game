# F → MASTER: batch D18-BALANS verify

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** (verify only) |
| **Data** | 2026-07-02 |
| **Batch** | D18-BALANS-TRUDNOSC |
| **md5** | `d5e0f62de9d287be23d444d1f23e0e7b` (bez zmian vs P-C2 — D18 już w bundle) |

---

## Verify

- `loadRevoltParams` · `stolicaEasyBonusActive` · `seedWealthImmunityAtFounding` · `getTurn` — ✅ w `main.ts`
- JSON `society-params.json` · `econ-params.json` — ✅ D18 progi/grace/immunitet

## Testy (PASS)

| Suite | Wynik |
|-------|-------|
| society-breakdown | 26/26 |
| wealth | 28/28 |
| culture-religion | 51/51 |
| smoke | OK |

---

## → MASTER: ACK D18 · playtest Maciej PT-Z05

Kanon = ROBOCZA · **nowa promocja nie wymagana**.
