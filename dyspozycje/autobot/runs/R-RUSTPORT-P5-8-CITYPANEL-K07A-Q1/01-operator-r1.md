STATUS: BLOCK (zakres r1 niedokończony; techniczny, do rundy 2 tym samym ID)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1
GOAL: Port nie-DOM części K07 (pasek W3 i okolica) z pinu edb8fb56 do frontend-v2 bez DOM, z harnessem i mutacjami wg dispatchu.
ZMIANY/COMMIT: base = origin/rust-port/parity-v2 a6169d5d (detached). Allowlista: `src-tauri/frontend-v2/src/ui/cityPanel/k07a-fundament.ts` (NOWY), `src-tauri/frontend-v2/tools/dom-harness/select-k07a.mjs` (NOWY), `src-tauri/frontend-v2/PORTING-QUEUE.md` (dopisek), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1/**`. ZAŁOŻENIE: ścieżki K07A jawnie w allowliście dispatchu. Commit: SHA w `git log -1` gałęzi worktree (podany w odpowiedzi orkiestratora). Zero zmian w gra/**, package.json, WERSJE.md.
TESTY:
- `node tools/dom-harness/select-k07a.mjs` (pin z `git archive edb8fb56`): blok 7 = 23 jednostki, 1 493 LOC; DOM 15 (1 074 LOC); nie-DOM 8 w tym 2 wybrane przez selektor r2 (uxSectionRefresh, W3_STAT_RES_KEY); 6 odroczonych klasą T/R, z czego 3 przeniesiono ręcznie w r1 (resolveActiveCity, w3CityChip, capitalBadgeOrButtonHtml) — łącznie 5 jednostek w pliku.
- `npm run check`: self-test 33/15 OK; check-no-logic-imports trafień=0 (183 plików); verify-pin-copies niezgodnych=0.
- `npm run typecheck`: skrypt pada na TS5101 (`baseUrl` deprecated — problem bazy, nie K07A). Po `npx tsc --noEmit --ignoreDeprecations 6.0`: 4 błędy w `ui/icons/brandAssets.ts` i `ui/leaderPortraits.ts` (bazowe, nie K07A), 0 w `k07a-fundament.ts`.
- NIE_ZMIERZONO: harness DOM `run-k07a-units.mjs` (NIE napisany w r1), mutacje (NIE wykonane), `verify-k07a-copies.mjs` (NIE napisany), przeglądarka.
BLOKADY:
- Harness i mutacje wymagają osobnej rundy (wzorzec K06A: run/mutate/verify-copies); nie zmieszczono w r1.
- Nie-DOM, nieportowane w r1: `skeleton` (pin :10247-10328, 82 LOC; wiele helperów DOM-owych z K06/K01), `buildCityOnlyW3FlankChips` (:10432-10580, 149 LOC; `cityPracaSplit`, `readPodzialHandlu`, `resolveEmpireSnap`), `buildCityResourceStatItems` (:10581-10693, 113 LOC).
- Brak odpowiednika w v2 dla `buildChipDeltaStockHtml` (pin `game/empire-hud-totals`) → wstrzykiwany przez `K07aDeps.chipDeltaStockHtml` (ZAŁOŻENIE K07A-Z2, do wiązania z DTO w kontrolerze).
BEZ DECYZJI WŁAŚCICIELA: brak pytań (ABC pominięte zgodnie z dispatchem).
RUNDY: 1/5
NASTĘPNY KROK: runda 2: (a) `verify-k07a-copies.mjs` + `run-k07a-units.mjs` + `mutate-k07a-units.mjs` dla 5 jednostek; (b) port `skeleton`, `buildCityOnlyW3FlankChips`, `buildCityResourceStatItems` po domknięciu zależności (K01/K04 DTO); (c) `P5-8-K07A.md` z tabelą było/jest.
DEPLOY/PUSH: NIE WYKONANO

## Zmiany API względem pinu (r1)
| Pin (`cityPanel.ts`) | v2 (`cityPanel/k07a-fundament.ts`) | Uwaga |
|---|---|---|
| `let uxSectionRefresh` `:10365` | `setK07aUxSectionRefresh` / `getK07aUxSectionRefresh` | K07A-Z3 (akcesor) |
| `const W3_STAT_RES_KEY` `:10384` | `W3_STAT_RES_KEY_K07` (export) | kopia 1:1 |
| `resolveActiveCity()` `:10329` | `resolveK07aActiveCity()`; stan `setK07aActiveCity`/`getK07aActiveCity` | `getCities` z `K07aDeps` |
| `w3CityChip(...)` `:10393` | `w3CityChipK07(...)` | `chipDeltaStockHtml` z `K07aDeps`; bez deps = pusty fragment tempa (różnica vs pin) |
| `capitalBadgeOrButtonHtml(city)` `:10719` | `capitalBadgeOrButtonHtmlK07(city)` | `isMe`, `getCapitalCityId`, `canSetCapital` z `K07aDeps`; `city.oblegane` z pola miasta |
| typ `City` | `CityK07` (lokalna kopia pól) | K07A-Z1; w v2 docelowo `CityRefDto` |
| `cfg.*`, `isMeCity` | `setK07aDeps(K07aDeps)` | K07A-Z2; bez wywołania `setK07aDeps` `capitalBadge` zwraca `''` |

Tabela było/jest dla pozostałych jednostek: NIE_ZMIERZONO (nieportowane w r1).
