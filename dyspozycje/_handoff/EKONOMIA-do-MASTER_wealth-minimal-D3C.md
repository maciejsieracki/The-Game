# HANDOFF: EKONOMIA → MASTER — Wealth minimalny (D3=C)

**Data:** 2026-06-26. **Lane:** EKONOMIA. **Decyzja Macieja:** D3=C (pula + 1 zarabianie + 1 wydawanie). **Status:** GOTOWE w lane; wpięcie w grze = MASTER (`main.ts` + cross-lane).

---

## Co dostarczone (lane, bez main.ts)

| Plik | Rola |
|---|---|
| `gra/src/game/wealth.ts` | API: `loadWealthParams`, `advanceWealth`, `freshWealthState`, `wealthMnoznik/Zadowolenie/Cap/...` |
| `gra/data/econ-params.json` | Grupa `"wealth"` (8 kluczy easy/normal/hard) |
| `gra/src/game/turn-economy.ts` | **WIRE 3** już podłączony: `luksus → advanceWealth → mnoznik na pieniadz` |
| `gra/tools/wealth-test.cjs` | **25/25 PASS** |

---

## Model D3=C (minimalny — co wchodzi do v1.0)

1. **Pula + poziom** per miasto: `WealthState { poziom, pula }`, cap = `epoka × 10`.
2. **1 zarabianie:** strumień `luksus` z `cityYieldPerTurn` (= suwak Handlu „Społeczeństwo/Wealth") trafia do `advanceWealth(..., spoleczMoney=luksus, ...)`.
3. **1 wydawanie:** `wealthMnoznik(poziom)` mnoży **cały** strumień Pieniądz miasta tej tury (`pieniadzPoWealth = floor(pieniadzBrutto × mnoznik)`). Nauka i luksus **nie** są mnożone.

Pełny model W1–W6 (6× zarabianie/wydawanie) **poza** scope D3=C — odłożony po v1.0.

---

## Co MASTER wpina w `main.ts` (checklist)

### Już działa po wywołaniu `advanceCityEconomy` (lane)

- `turn-economy` zapisuje `(city as any).wealthState` między turami.
- `econ.totalPieniadz` i `tick.pieniadz` zawierają już mnożnik Wealth.
- `tick.wealthMnoznik`, `tick.wealthZadowolenie` w `CityEconomyTick`.

### Do zrobienia przez MASTER

1. **Typ City** — dodać opcjonalne `wealthState?: WealthState` w `playerState.ts` / `cities.ts` (dziś pole dynamiczne na runtime).
2. **Szczęście miasta** — przekazać `tick.wealthZadowolenie` do lane MIASTO (zastępuje stary wkład „luksus → zadowolony"; kontrakt w `_handoff/EKONOMIA-do-MASTER_wealth.md` §4).
3. **HUD** — lane UI: pasek Wealth (poziom/pula/prog) po sygnale wpiecia; EKONOMIA nie rusza UI.
4. **ownerCivMap** — osobny handoff RDY-11 (`_handoff/EKONOMIA-do-MASTER_mnoznik-per-cyw.md`); nie blokuje Wealth.
5. **Playtest** — suwak luksus > 0 przez kilka tur → poziom Wealth rośnie → Pieniądz miasta rośnie (mnoznik > 1).

---

## Kontrakt tick (kolejność w `advanceCityEconomy`)

```
cityYieldPerTurn → yld.luksus, yld.pieniadz
advanceWealth(prev, yld.luksus, yld.pieniadz, epoka, params) → wt
pieniadzPoWealth = floor(yld.pieniadz × wt.mnoznik)
splitPraca(yld.praca, udzialBudynki) → doBudynkow / doPuli
```

---

## DoD (po wpieciu MASTER)

- [ ] `node tools/wealth-test.cjs` — 25/25 zielony.
- [ ] `node tools/wire-ekonomia-test.cjs` — WIRE 3 OK.
- [ ] WealthState persystuje między turami (reload save — opcjonalnie v1.0).
- [ ] `wealthZadowolenie` widoczne w breakdown szczęścia (MIASTO).
- [ ] Build kanonu bez regresji testów.

---

## Nie ruszano

- Pełny Wealth W1–W6 (6 źródeł / 6 sinków).
- Panel Wealth UX (lane UI, po wpieciu silnika).
- `main.ts` — lane EKONOMIA nie edytuje.

**Flaga:** GOTOWE / czeka MASTER na batch wpiecia D3=C.
