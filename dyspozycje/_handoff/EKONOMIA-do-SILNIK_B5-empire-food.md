# EKONOMIA → SILNIK: B5 żywność imperium (pełny tick)

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** (2026-06-29, wpięte F) |
| **Decyzja Macieja** | B5 Q1 = hybryda · B5-Q2 = 70/30 default |
| **Lane zakończone** | 2026-06-29 |

---

## Co lane dostarczył

| Plik | Zmiana |
|------|--------|
| `gra/src/game/empire-food.ts` | Pełny `advanceEmpireFood` + runtime gettery |
| `gra/src/game/turn-economy.ts` | **WIRE 5:** split % rozwój (`getEmpireFoodSplit`); wojsko **nie** schodzi z netto miasta |
| `gra/src/game/army-starvation.ts` | −8% HP (już było) |
| `gra/tools/empire-food-b5-test.cjs` | **9 pass** regresja B5 |

**Testy lane:** `node tools/empire-food-b5-test.cjs` · `node tools/grupa-b-lane-test.cjs` (38 pass)

---

## Co INTEGRATOR robi (1 batch weryfikacji)

`main.ts` **już woła** `advanceEmpireFood` + `applyArmyStarvationHpLoss` (sesja 2026-06-28). Po pullu lane:

1. Build → `$env:TEMP\civ-dist` → `empire-food-b5-test.cjs` + bramka
2. Playtest: zapasy państwa rosną/malą po turze; głód wojska przy ujemnych zapasach
3. Meldunek `SILNIK-DO-MASTERA.md` + ROBOCZA md5

**Brak wymaganego patcha `main.ts`** — chyba że regresja w playteście.

**Flaga:** `docs/obieg/B-ekonomia.md` § INTEGRATOR · batch **F-B5-EMPIRE-FOOD**

---

## Model (przypomnienie)

```
advanceCityEconomy  → netto miasta (bez kosztu wojska; split 70% → wzrost)
advanceEmpireFood   → 30% netto → zapasy państwa; debit armii; glodWojska
applyArmyStarvation → −8% max HP gdy glodWojska
```

Handoffy powiązane: `EKONOMIA-do-UNITS_glod-8hp.md` · `EKONOMIA-do-UI_zywnosc-hud.md` (HUD już w silniku)
