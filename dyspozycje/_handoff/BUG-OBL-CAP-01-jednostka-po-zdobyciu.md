# BUG — OBL-CAP-01: Jednostka znika po zdobyciu miasta

**Status:** **NAPRAWIONE** · 2026-07-01  
**Przyczyna:** (1) auto-szturm przekazywał `survivors: []` → kasowanie całego składu ataku; (2) po wygranej brak wejścia wojsk na heks miasta; (3) renderOrder tokena na mieście za niski.  
**Zgłoszenie:** Maciej · playtest 2026-06-30  
**Objaw:** Miasto **zdobyte poprawnie** (`ownerId` OK), ale **jednostka atakująca znika z mapy**  
**Scenariusz:** szturm / zdobycie (dokładna gałąź: do potwierdzenia — ST-2 bez walki vs wygrana po bitwie)

---

## Oczekiwane (kanon)

`docs/decyzje/C3-szturm-obrona.md` · `UNITS-do-MASTER_wejscie-miasta-garnizon.md`:

- Po zdobyciu jednostka **widoczna** na heksie miasta (ST-2) lub przy murze (ST-3 — do doprecyzowania)
- **NIE** `inGarnizon` automatycznie — tylko po **Ufort.**

---

## Hipotezy (do weryfikacji jutro)

| # | Miejsce | Podejrzenie |
|---|---------|-------------|
| H1 | `finishSiegeStormBattle` | Po wygranej **brak** przeniesienia `anchor` na `(city.q, city.r)` — jednostka zostaje obok; może wyglądać jak „zniknięcie” przy zmianie kamery/fog |
| H2 | `captureCityWithoutBattle` | `refreshFog()` po `syncUnitsRender()` nadpisuje listę — heks miasta chwilowo poza `visible` |
| H3 | `render/units.ts` | Token na heksie miasta (`_applyCityTokenStyle`) — **pod modelem miasta** / złe Y (niewidoczny, ale w `units[]`) |
| H4 | `computeStackDisplay` | Po teleportacji na heks miasta jednostka **nie** w `visibleIds` (stos / reprezentant) |
| H5 | `applyMapBattleOutcome` | Błędne usunięcie z `units[]` po auto-resolve / battle survivors |

---

## Pliki do sprawdzenia (SILNIK)

- `gra/src/main.ts` — `captureCityWithoutBattle`, `finishSiegeStormBattle`, `applyMapBattleOutcome`, `visibleUnitsList`, `refreshFog`
- `gra/src/render/units.ts` — `getTokenPlacement`, `_applyCityTokenStyle`, `sync`
- `gra/src/game/armyMerge.ts` — `computeStackDisplay`

---

## Fix plan (jutro)

1. Playtest: powtórzyć **ST-2** (puste miasto) i **ST-3** (bitwa) — która gałąź?
2. Console: czy `units.find(id)` istnieje po zdobyciu?
3. Minimalny fix w `main.ts`:
   - po zdobyciu: `anchor.q/r = city.q/r`, `selectedId` zachować, `forceVisibleUnitId` na 1 klatkę
   - `syncUnitsRender(units)` **po** `refreshFog` lub wywołać `finishUnitEnterCityHex` + hint
4. Regresja: `siege-defenders-test`, playtest Ateny

---

## DoD

- [ ] Po ST-2: Hastati **widoczny** na heksie zdobytego miasta
- [ ] Po ST-3 (wygrana): atakujący widoczny (miasto lub heks obok — zgodnie z decyzją)
- [ ] `inGarnizon !== true` bez Ufort.
- [ ] Meldunek w `SILNIK-DO-MASTERA.md`

**Lane:** SILNIK (Integrator) · ewentualnie UNITS/render jeśli H3/H4

**Flaga:** → **INTEGRATOR: CZEKA** (jutro)
