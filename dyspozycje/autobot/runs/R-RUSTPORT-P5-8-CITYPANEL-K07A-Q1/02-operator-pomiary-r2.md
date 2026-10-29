STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1
GOAL: Port niedomowej części K07 (pasek W3 i okolica) z pinu edb8fb56 do frontend-v2 bez DOM, z harnessem, mutacjami i bramką kopii (runda 2).
ZMIANY/COMMIT: baza 3e921f8f (Operator-impl r1, detached). Zmiany w allowliście: `src-tauri/frontend-v2/src/ui/cityPanel/k07a-fundament.ts` (przepisany z pinu, markery bloków, LINE_SUBS), `src-tauri/frontend-v2/tools/dom-harness/{run-k07a-units.mjs,verify-k07a-copies.mjs,mutate-k07a-units.mjs}` (nowe), `src-tauri/frontend-v2/PORTING-QUEUE.md` (wpis rundy 2), `dyspozycje/rust-port/p5/P5-8-K07A.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1/r2-logi/` (logi i JSON), ten raport. Brak zmian w `gra/**`, `package.json`, `WERSJE.md`, rust-port. SHA commitu: patrz sekcja końcowa odpowiedzi orkiestratora (commit wykonany po tym raporcie).
TESTY:
- verify-k07a-copies: EXIT 0; blocks=5, units=5, lineSubs=5; TEXT OK, ORPHAN=0, COVER OK (`r2-logi/verify-k07a-copies-r2.log`).
- run-k07a-units: EXIT 0; 4 040 porównań, 0 różnic (`r2-logi/run-k07a-units-r2.log`).
- mutate-k07a-units: 34 mutantów; 33 ZABITE; 1 PRZEZYLA (`eq-null-return`, równoważna: `return activeCity` przy `activeCity === null` daje ten sam null); 0 NIE_ZMIERZONO (`r2-logi/mutacje-r2-cz0.json`, `mutacje-r2-cz1.json`).
- npm run check: EXIT 0 (self-test 33/15; 0 trafień w 183 plikach; verify-pin-copies 0 niezgodnych) (`r2-logi/check-r2.log`).
- npm run typecheck: EXIT 0 (tsc 5.9.3; plik w listFiles) (`r2-logi/typecheck-r2.log`). Uwaga: r1 raportował TS5101; w tym środowisku po `npm ci` nie wystąpił. Flaga `--ignoreDeprecations 6.0` jest odrzucana przez tę wersję (TS5103), więc nie była potrzebna.
BLOKADY:
- Odłożone (r3): `skeleton`, `buildCityOnlyW3FlankChips`, `buildCityResourceStatItems` — zależności `cityPracaSplit`, `readPodzialHandlu`, `resolveEmpireSnap` nieobecne w v2.
- Jednostki DOM (15) → K07B.
- Ograniczenie: bez `setK07aDeps` `w3CityChipK07` pomija tempo/zapas; pin zawsze go dokleja (opisane w P5-8-K07A.md §4).
- Korekta zakresów r1: `resolveActiveCity` = :10329-10334; `uxSectionRefresh` = :10365.
- NIE_ZMIERZONO: wiring kontrolera, przeglądarka, prawdziwe `buildChipDeltaStockHtml` (stub z fixture).
- Pytania ABC: brak (zgodnie z dispatchem; luki rozstrzygnięte założeniami K07A-Z1..Z3).
RUNDY: 2/5
NASTĘPNY KROK: Bramka Evaluator/Final Control na 3e921f8f + commit rundy 2; następnie r3 (skeleton, buildCityOnlyW3FlankChips, buildCityResourceStatItems) po DTO K01/K04.
DEPLOY/PUSH: NIE WYKONANO
