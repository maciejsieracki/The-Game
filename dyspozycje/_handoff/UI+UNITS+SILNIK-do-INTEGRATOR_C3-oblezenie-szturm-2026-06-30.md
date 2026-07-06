# UI + UNITS + SILNIK → INTEGRATOR — C3 oblężenie + szturm (playtest ✅)

**Status:** **GOTOWE — zintegrowane w `main.ts` + kanon opublikowany**  
**Data:** 2026-06-30  
**Playtest Maciej:** ✅ pełna ścieżka (Oblężaj → Szturm → preBattle → bitwa ręczna z murem)

---

## Co przesyłamy

### UI (`gra/src/ui/`)

| Plik | Opis |
|------|------|
| `cityAttackChoice.ts` | Etap 1: Oblężaj / Szturm / Anuluj (modal złoto/slate) |
| `siegeMapPanel.ts` | Etap 2: panel oblężenia (Oblegaj, Szturm, Odwrót, machiny) — wyśrodkowany overlay |
| `preBattle.ts` | Uwarunkowania bitwy — odświeżony modal (spójny z powyższymi) |
| `cityCaptureNotice.ts` | Tabliczka zdobycia pustego miasta (bez bitwy) |
| `armyMergePanel.ts` | Merge armii: Zostaw osobno \| Połącz armie (równe kolumny) |

### UNITS / render (`gra/src/render/units.ts`)

- Złota heksagonalna obwódka zaznaczenia (~94% promienia hexa)
- Jednostki na heksie miasta: wyżej, skala ~1.22×, przesunięcie ku krawędzi
- `setCityHexKeys()` + `getTokenPlacement()` — animacja ruchu respektuje pozycję na mieście

### SILNIK (`gra/src/main.ts`) — wpiecia

| Funkcja / hook | Opis |
|----------------|------|
| `hasCityDefenders(city)` | Obrońcy = jednostka wroga dist≤1 **lub** garnizon>0 (ludność ≠ obrońcy) — **kanon:** `gra/src/game/siegeDefenders.ts` + `docs/decyzje/C3-szturm-obrona.md` |
| `captureCityWithoutBattle()` | Puste miasto → tabliczka, zero strat, wejście na heks |
| `launchSiegeStormFromMap()` | Są obrońcy → preBattle → BattleScene (Grupa C, mur) |
| `isSiegeMapPanelOpen()` | Blokada ruchu jednostek gdy otwarty panel oblężenia |
| `showCityAttackChoice` / `showSiegeMapPanel` / `showPreBattle` / `showCityCaptureNotice` | Pełny flow C3 |
| `unitRenderer.setCityHexKeys()` | Sync przy init / new game |
| `playtestMapaSwiata.ts` | Preset `?playtest=mapa` (dev only — Łucznik w Atenach do testu szturmu) |

---

## Co Integrator zrobił

1. Backup: `gra/src/main.ts.bak-SILNIK-oblezenie-c3-2026-06-30`
2. Weryfikacja importów + callbacków w `main.ts` (już wpięte w sesji playtest)
3. Fix bramki: `tools/battle-smoke.cjs` — etykiety przycisków preBattle (`Bitwa ręczna` / `Auto`)
4. Build: `npx vite build --outDir $env:TEMP\civ-dist`
5. Publish kanon

---

## Bramka testów (2026-06-30)

| Suite | Wynik |
|-------|--------|
| logic-test | 203/203 OK |
| combat-test | 6/6 OK |
| smoke | OK |
| battle-smoke | OK |
| map-siege-test | 6/6 OK |
| oblezenie-test | 27/27 OK |
| siege-ai-test | 17/17 OK |
| food-hodowla-test | 26/26 OK |
| map-improvement-qualify-test | 34/34 OK |
| manpower-test | 22/22 OK |
| ai-test | 198/198 OK |
| diplomacy-test | 135/135 OK |

---

## Publish

| Plik | md5 (pełny) |
|------|-------------|
| `Gra-podglad.html` | **`363DC110315AA91CFE94857D67CCAC32`** *(stary — aktualny kanon: `4602e752…`)*
| `Gra-podglad-ROBOCZA.html` | identyczny |
| `Gra-podglad-PLAYTEST-MAPA.html` | identyczny |

---

## DoD (kryteria akceptacji)

| # | Kryterium | Status |
|---|-----------|--------|
| I1 | Atak na miasto z murem → wybór Oblężaj/Szturm | ✅ playtest |
| I2 | Panel oblężenia blokuje ruch jednostek | ✅ kod + playtest |
| I3 | Szturm z obrońcą → preBattle → bitwa 3D z murem | ✅ playtest Maciej |
| I4 | Szturm bez obrońców → tabliczka zdobycia, bez bitwy | ✅ kod (`hasCityDefenders`) |
| I5 | Merge armii — layout lewo/prawo równy | ✅ playtest wcześniejszy |
| I6 | Obwódka złota + jednostka widoczna na heksie miasta | ✅ playtest wcześniejszy |
| I7 | Bramka testów ZIELONA | ✅ |

---

## Czeka

- **Opus review** przed formalnym sign-off v1.0 (reguła workflow)
- Decyzje produktowe ABC — bez zmian w tym batchu (execution już zatwierdzonego flow C3)

---

## Pliki lane (nie ruszać bez handoff)

- UI: `gra/src/ui/cityAttackChoice.ts`, `siegeMapPanel.ts`, `preBattle.ts`, `cityCaptureNotice.ts`, `armyMergePanel.ts`
- UNITS/render: `gra/src/render/units.ts`
- SILNIK: `gra/src/main.ts` (tylko Integrator)
