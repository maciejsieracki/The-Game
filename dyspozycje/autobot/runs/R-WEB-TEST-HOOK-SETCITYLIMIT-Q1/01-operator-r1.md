STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — hak testowy: limit miast
TEMAT: R-WEB-TEST-HOOK-SETCITYLIMIT-Q1
GOAL: hak `__civTest.setCityLimit(n)` (tylko `?civTest=1`), by testy fortow mogly wymusic WYCZERPANY limit miast; zero zmiany zachowania gry bez parametru.

## Pomiar PRZED
- Limit liczony wzorem `baza + (max(1,epoka)-1)*5`: `gra/src/game/cities.ts` ~1276-1280 (`canFoundCity`, odmowa "limit miast na tej epoce") oraz `gra/src/game/auto-improvements.ts` ~632-641 (`isCityLimitExhausted`, flaga dla E-FORT). Baza = `_menuCityLimitBase` (`gra/src/main.ts` 1911, ustawiana 41152 z kreatora; uzycia 11668, 37079, 37926, 39349).
- Dlaczego test fortow nie wyczerpuje limitu: `unlockAllTech` (hak, main.ts ~26985) ustawia `player.zbadane` na cala technologie, co podnosi epoke gracza (`empireEpochForOwner`), wiec limit baza=1 daje 1+(E-1)*5; potwierdzone dla E=3 jako 11 (zgodne z dispatchem, test A. w `auto-fort-claim-test.cjs:233`). Realna epoka w zywej grze po unlockAllTech: NIE_ZMIERZONO w przegladarce (patrz BLOKADY).

## Zmiany (allowlista)
- `gra/src/game/civ-test-hooks.ts` (+18): `cityLimitBaseForTarget(limit, era)`, dep `setCityLimitBase`/`meEra`, metoda `setCityLimit(n)` w `__civTest` (ignoruje NaN/ujemne/nieskonczone; floor). Hak istnieje tylko gdy `isCivTestEnabled` (`?civTest=1`) — bez parametru `__civTest` w ogole nie jest instalowany.
- `gra/src/main.ts` (+2 linie, w istniejacym wywolaniu `installCivTestHooks`): `setCityLimitBase: base => { _menuCityLimitBase = base; }`, `meEra: () => empireEpochForOwner(ME())`. Zadna sciezka gry nie zmieniona.
- NOWY test `gra/tools/test-hook-setcitylimit-test.cjs` (20 asercji, realne `isCityLimitExhausted`, `canFoundCity`, `pickAutoImprovements`).
- Logi: `gate-new-test.txt`, `gate-tsc.txt`, `gate-regresja-przed.txt`, `gate-regresja-po.txt`.

## Semantyka (ZALOZENIA)
- `setCityLimit(n)` ustawia limit gracza dokladnie na n w JEGO BIEZACEJ epoce (baza = n-(E-1)*5, moze byc ujemna). Wolac PO `unlockAllTech`; pozniejszy awans epoki podniesie limit o 5/epoke.
- Baza jest wspolna: zmienia tez limity AI przy ich bazie (`ai.ts` uzywa `_menuCityLimitBase`). Dla testow fortow gracza akceptowalne; nowa gra resetuje baze (41152).

## TESTY
- Nowy test: PASS=20 FAIL=0 (`gate-new-test.txt`): A brak hooka bez `?civTest=1` (4 warianty), B bez wywolania limit jak dotad (baza 10, 0 fortow), C limit 1/epoka 3 -> baza -9, wyczerpany, automat wybiera fort@(27,22), realny `canFoundCity` odmawia, D epoki 1 i 5, E wejscia niepoprawne.
- Mutacje (kopie `src` poza repo, `HOOK_SRC_DIR`): m1 usuniecie skladnika epoki -> 5 FAIL (zabita); m2 usuniecie walidacji n -> 1 FAIL (zabita). Brak mutanta na bramke `?civTest=1` (pokryta asercjami A; osobnego mutanta NIE_ZMIERZONO).
- tsc `--noEmit`: EXIT=0.
- Regresje `*fort*`, `*auto-improve*`, `*city-limit*` (19 plikow): PRZED (kopia origin/main 95a4b25ab) vs PO — identyczne wyniki, poza `unit-frozen-fortified-unselectable` (PRZED exit 1 = artefakt kopii bez plikow vite; PO exit 0). Dwa czerwone w OBU stanach, niezwiazane: `autoimprove-live-hooks-test` (36/1, FAIL "main.ts importuje installCivTestHooks" — identyczny PRZED i PO) oraz `fort-outpost-territory-live-test` (exit 2, wymaga `--out`).

## BLOKADY
- Test przegladarkowy Chromium `?civTest=1` NIE_ZMIERZONO: istniejace sterowniki wymagaja gotowego bundla `gra-robocza/Gra-ROBOCZA.html` (nie zawiera zmiany), a `npm run build`/`dev` zakazane, `gra-robocza/**` poza allowlista. Zamiast tego test na realnych modulach (hak + `isCityLimitExhausted` + `canFoundCity` + automat). Wpiecie w `main.ts` zweryfikowane tsc, nie zywa gra. Rekomendacja dla Evaluatora/orkiestratora: smoke live po najblizszym buildzie ROBOCZEJ (`T.unlockAllTech(); T.setCityLimit(1); T.foundCity(...)` ma dac toast "limit miast na tej epoce").

## RUNDY: 1/5
## NASTEPNY KROK: Evaluator
## DEPLOY-PUSH: NIE WYKONANO
