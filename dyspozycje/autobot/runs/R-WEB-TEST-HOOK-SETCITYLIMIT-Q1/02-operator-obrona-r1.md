STATUS: PASS
DOMAIN: GAME (WEB) — hak testowy: limit miast
TEMAT: R-WEB-TEST-HOOK-SETCITYLIMIT-Q1
ROLA: Operator (obrona), runda 1/5

ZARZUTY
1. Brak testu Chromium `?civTest=1` — PRZYJMUJE. Nowy `gra/tools/test-hook-setcitylimit-live-bundle.cjs` (esbuild, poza repo, bez `npm run build`/vite; wtyczki: `?worker&inline`, `?raw|?url`, `import.meta.glob` -> pusty rekord) buduje zywa gre; `gra/tools/test-hook-setcitylimit-live-test.cjs` (Chromium, realna gra, nowa gra, stolica, `unlockAllTech`) mierzy: `setCityLimit(1)` -> `foundCity` odrzucone toastem "Nie można założyć: limit miast na tej epoce"; `setCityLimit(5)` -> miasto zalozone. PASS=4 FAIL=0 (`gate-r2-live.txt`). Przy okazji potwierdza zgodnosc epoki: hak uzywa `empireEpochForOwner(ME())`, a `canFoundPlayerCityAt` `player.era`; gdyby sie rozjechaly, limit 1 nie dalby odmowy. Zastrzezenie: bundle bez assetow audio/portretow/ikon brandu (glob pusty) — nie dotyczy logiki limitu.
2. Brak testu podpiecia w `main.ts` — PRZYJMUJE. Sekcja G w `test-hook-setcitylimit-test.cjs` (regex: `_menuCityLimitBase = base`, `meEra: () => empireEpochForOwner(ME())`, gra czyta `cityLimitBase: _menuCityLimitBase`, podpiecie wewnatrz `installCivTestHooks(window`, brak `setCityLimit` w main.ts). Mutant `meEra: () => 1` w kopii main.ts: 1 FAIL (zabity).
3. Brak mutanta bramki — PRZYJMUJE. Mutant `if (false) return false;` w kopii `civ-test-hooks.ts`: 5 FAIL (4x sekcja A + sonda bramki), PASS=24 FAIL=5 (zabity).
4. Zmiana epoki po wywolaniu — PRZYJMUJE. Sekcja F: po `setCityLimit(1)` w epoce 1 i awansie na epoke 3 limit = 11 (niewyczerpany); ponowne `setCityLimit(1)` -> wyczerpany. Wplyw na AI (wspolny `_menuCityLimitBase`) pozostaje udokumentowanym ryzykiem tylko srodowiska `?civTest=1`; nowa gra resetuje baze (`main.ts:41154`).
5. Czerwone niezwiazane — bez zarzutu do zmiany; `autoimprove-live-hooks-test` nadal 36/1 (regex importu), identycznie jak przed; `auto-fort-claim-test` 63/0.

TESTY: unit PASS=29 FAIL=0 (`gate-r2-unit.txt`); live PASS=4 FAIL=0 (`gate-r2-live.txt`); tsc `--noEmit` EXIT=0 (`gate-r2-tsc.txt`).
NIE_ZMIERZONO: pelna macierz regresji 19 plikow po tej rundzie (zmiany rundy to wylacznie nowe pliki w `gra/tools/` — zero zmian w `gra/src`).
BLOKADY: brak. Pliki robocze i bundle w scratchpadzie poza repo; `node_modules` usuniety.
RUNDY: 2/5 (obrona)
NASTEPNY KROK: Evaluator
DEPLOY-PUSH: NIE WYKONANO
