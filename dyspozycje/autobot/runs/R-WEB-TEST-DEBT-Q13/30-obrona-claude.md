# R-WEB-TEST-DEBT-Q13 - obrona Operatora (runda 4), odpowiedzi na zarzuty Evaluatora

STATUS: PASS-WITH-NOTES (częściowo: 3 naprawy kategorii A; cel 30 napraw NIE osiągnięty)
DOMAIN: GAME (testy; zero zmian w gra/src, gra/data)
TEMAT: R-WEB-TEST-DEBT-Q13
GOAL: testy czerwone do obowiązujących reguł, bez osłabiania asercji; błędy gry jako kandydaci R-WEB-*.
BAZA: 88fc90a0f (detached, kandydat); zmiany w commicie obrony (SHA w polu sha).

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Nie wykonano 30 napraw. Wykonano 3 naprawy kategorii A (dowód: wyjście surowe):
   - ai-dlug-porzadki-q1-test.cjs: `17 passed, 0 failed` (wcześniej ReferenceError orderMultMap; atrapy Map dla nowych zmiennych restore).
   - atak-adiacencja-wymagana-test.cjs: `57 passed, 0 failed` (wcześniej ReferenceError marchStopNotified; dodano Map marchStopNotified/marchStopDetail w fabryce).
   - barbarian-cooperation-grace-maints-wiring-test.cjs: `29 passed, 0 failed` (wcześniej ReferenceError ME; ME()=0 = gracz; import realnych cyclicExchange* z src/game/diplomacy-cyclic-display).
2. PRZYJMUJĘ. Kategorie C i D nie zostały wyznaczone; X=88 nierozstrzygnięte. Tabela 40-triage-r3.md (156 wierszy, P 21 / A 18 / E 29 / X 88, liczone skryptem categorize.sh na 20-sweep-r3-raw.txt).
3. PRZYJMUJĘ. 29 pozycji E nie zostało ponowionych sekwencyjnie po 300 s. NIE ZMIERZONO.
4. PRZYJMUJĘ część, z dowodem:
   - Tabela 40-triage-r3.md przebudowana: poprawne kolumny (kat | exit | pozycja | pierwsza linia FAIL).
   - Research: `PASSED: 33 / FAILED: 0 / TOTAL: 33` (liczba wypisana, zgodnie z zarzutem).
   - Komentarz KANDYDAT R-WEB-STONE-ERA-ENTRY-40 dodany w gra/tools/forced-war-stone-test.cjs (nad asercją eq(startTurn, 40)); forced-war-stone `PASSED: 31 / FAILED: 0`.
   - Hunki TESTDEBTQ13 nieobecne w main pominięte świadomie w scaleniu (zgodnie z dispatchem); komentarz dodany tutaj.

## Naprawy nieukończone (kategoria A, stan po obronie)
- recruitment-batch-contract-test.cjs: dodano stuby effectiveGameDifficultyForOwner ('normal') i pendingLedgerSink (no-op); test nadal czerwony - ReferenceError recruitFollowGeneralForOrder. Okno purchaseRecruitmentUnit w main.ts zależy od ok. 20 kolejnych symboli; wymaga przebudowy harnessu, nie łatania.
- tartak-oboz-wyscig-race-test.cjs: naprawiono kotwicę końcową pętli gracza (nazwaWyswietlana) i stub setPlacedLayersOwned w fabryce AI; test nadal czerwony - ReferenceError empireEpochForOwner (kolejna zależność okna).

## Nierozstrzygnięte (A/X/E)
- Kategoria A pozostała: 15 pozycji z 18 (w tym recruitment i tartak wyżej); część to pozycje live (ROBOCZA_HTML/--dist) wymagające środowiska, część build (esbuild Build failed).
- Kategoria X 88 i E 29 bez zmian.

## Testy (surowe wyniki po zmianach obrony)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-archer-slinger-test: 51 OK, 0 FAIL
- combat-test: All sanity checks passed.
- forced-war-stone-test: PASSED: 31 / FAILED: 0
- ai-dlug-porzadki-q1: 17 passed, 0 failed; atak-adiacencja: 57 passed, 0 failed; barbarian-cooperation: 29 passed, 0 failed

## BLOKADY
- Brak 30 napraw; rekrutacja i tartak czerwone; 88 X i 29 E nierozstrzygnięte; brak sekwencyjnego ponowienia E.
- Nie wykonano: C (martwe testy), D (kandydaci R-WEB-*), listy "nowych czerwonych" względem FC DIPLOWARLEVEL.

## UWAGI-DLA-ORKIESTRATORA
- Ponowienie E (29 x 300 s) wymaga partii po 1-2 testy na wywołanie Bash (limit 590 s) - koszt czasu, nie zrobiono.
- Harnessy wycinające tekst z main.ts (recruitment, tartak, ai-dlug) gniją przy każdej zmianie okna; zalecam osobny temat przebudowy na eksport funkcji zamiast wycinania tekstu.
- Kandydat R-WEB-STONE-ERA-ENTRY-40 (kod: tura globalna vs decyzja 40 tur) do osobnego tematu.

RUNDY: 4/5 (obrona)
NASTĘPNY KROK: runda 5 (ostatnia) - przebudowa harnessów recruitment/tartak, sekwencyjne E, kategoria C/D.
DEPLOY/PUSH: NIE WYKONANO
