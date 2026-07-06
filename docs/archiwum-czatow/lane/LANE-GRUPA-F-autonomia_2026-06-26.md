# LANE-GRUPA-F-autonomia — sesja autonomiczna

**Data:** 2026-06-26  
**Rola:** Grupa F (integracja silnik / `main.ts`)  
**Trigger:** Maciej — „działaj samodzielnie ~2h, podsumowanie + decyzje do wycofania”

---

## Podsumowanie sesji

Kontynuacja prac Grupy F po batchu 1 (save/load). Wdrożono batch 2: migracja zapisów Wealth, trudność AI, flaga murów obronnych, wyrównanie panelu miasta po NewGame.

**Nie opublikowano** `Gra-podglad-TEST.html` ani kanonu — brak Node/npm w środowisku Cursor (build wymaga Macieja lokalnie).

---

## Wykonane zmiany kodu

### `gra/src/game/cities.ts`
- Nowa funkcja **`ensureCitySaveDefaults(city)`** — woła `ensureCityPodzialDefaults` + ustawia `wealthState` przez `freshWealthState()` gdy brak.

### `gra/src/main.ts`
| Obszar | Zmiana |
|--------|--------|
| **Load** | `restoreGameFromSave`: `ensureCitySaveDefaults(c)`; migracja `maMur` gdy `cityBuilt` zawiera `mury` |
| **AI** | `decideAITurn` opts: `poziomTrudnosci` z `_menuDifficulty` (easy=1, normal=2, hard=3) |
| **Produkcja** | Po ukończeniu budynku `mury` → `city.maMur = true` |
| **RushBuy** | Oba bloki `configureCityPanel`: przy completed budynek `mury` → `maMur=true` |
| **NewGame panel** | Drugi `configureCityPanel`: dodano onChange, onAutoManage, pełny onRushBuy+completed, updateHud na podziałach, getCivBonusy |

### Backup
- `gra/src/main.ts.bak-SILNIK-2026-06-26-batch2`
- Wcześniejszy: `main.ts.bak-SILNIK-2026-06-26-save-migrate` (batch 1)

---

## Decyzje podjęte przez agenta (do ewentualnego wycofania)

| # | Decyzja | Uzasadnienie | Jak wycofać |
|---|---------|--------------|-------------|
| D-F1 | Wealth na starym zapisie = **`freshWealthState()`** (domyślny) | Spójność z `foundCity`; brak serializacji wealth w SAVE_VERSION | Przywróć tylko `ensureCityPodzialDefaults` w restore |
| D-F2 | AI difficulty **easy/normal/hard → 1/2/3** | Ten sam mapping co dyplomacja (~2184) | Usuń `poziomTrudnosci` z opts AI |
| D-F3 | **`maMur` tylko przy budynku `mury`** | Zgodne z `buildings.json` `"odblokowuje": "maMur"` i DZIENNIK #4 | Usuń 4 miejsca ustawiające `maMur` |
| D-F4 | **Nie** refaktor `buildCityPanelConfig()` | Duplikacja panelu zostaje; mniejsze ryzyko regresji | — |
| D-F5 | **Nie** ruszać hud / empire-food / C2 / E1-Q | Blokady charteru F + brak ABC Macieja | — |
| D-F6 | **Nie** publikować TEST bez buildu | Brak npm w Cursor | — |

---

## NIE wykonane

- Bramka: `tsc`, `wire-ekonomia-test.cjs`, `logic-test.cjs`, `vite build`
- `Gra-podglad-TEST.html`
- Kanon `Gra-podglad.html` (Master Silnik + Opus)
- E1-Q1…Q5 (nowa gra UI) — czeka ABC Macieja
- DRY jednej funkcji konfiguracji cityPanel

---

## Jak wycofać cały batch 2

```powershell
cd "C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ"
Copy-Item gra\src\main.ts.bak-SILNIK-2026-06-26-save-migrate gra\src\main.ts -Force
# cities.ts: usuń ensureCitySaveDefaults ręcznie lub git checkout gra/src/game/cities.ts
```

Batch 1 (save/load) zostaje w backup `save-migrate`; batch 2 nakłada się na batch 1.

---

## Bramka u Macieja (po weryfikacji)

```powershell
cd gra
npm run typecheck
node tools/wire-ekonomia-test.cjs
node tools/logic-test.cjs
npx vite build --outDir $env:TEMP\civ-dist --emptyOutDir
Copy-Item "$env:TEMP\civ-dist\index.html" "..\Gra-podglad-TEST.html"
```

Playtest: wczytaj stary zapis (Ctrl+L) → suwaki Handlu działają; zbuduj Mury → obrona hexu miasta 200%; AI na Hard vs Easy.

---

## Następne kroki

1. Maciej: bramka → TEST.html jeśli PASS  
2. Master Silnik: Opus review → kanon  
3. F batch 3 (opcjonalnie): `buildCityPanelConfig()` DRY, `_cityRenderOpts.getWalls` z `maMur`

---

## Eksport pełny

*(placeholder — Maciej może wkleić Export z Cursor UI)*
