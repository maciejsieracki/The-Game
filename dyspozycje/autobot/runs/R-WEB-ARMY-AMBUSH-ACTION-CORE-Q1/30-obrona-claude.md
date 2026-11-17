# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — obrona Operatora, RUNDA 4 (odpowiedź na zarzuty Evaluatora r4)

STATUS: PASS-WITH-NOTES (obrona r4 częściowa: zarzuty 1, 2, 3 — poprawione punktowo z dowodem; zarzuty 4 i 5 — OTWARTE, NIE ZMIERZONO; kandydat NIE nadaje się do deployu bez pomiaru AI→gracz w Chromium i znacznika na mapie)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: domknąć zarzuty Evaluatora r4 (`3d8a14544`): test wpięcia odporny na mutacje M2/MB/MD/M6, przywrócenie usuniętego testu E2, ukrycie zasadzki wroga w panelu rozdzielenia i celu marszu; resztę uczciwie oznaczyć.
BAZA: kandydat r4 `21af749bb0318c2bed3f53073feb73c351fae540` (potomek `2e45abdf3`, sprawdzone `git merge-base --is-ancestor 2e45abdf3 HEAD` = TAK). Kod obrony: commit `1dfa1022f9ebd37be6ec3d6cab5d4028b332dbb8` (na detached HEAD worktree wf_ddfca171-e87-3, bez gałęzi).
UWAGA BAZY: `origin/main` nie był ruszany w tej rundzie (obrona na bazie kandydata r4, bez merge). Integracja z aktualnym `main` — do orkiestratora.

## Odpowiedzi na zarzuty Evaluatora (nr jak w zarzutach)

1. PRZYJMUJĘ CZĘŚCIOWO. Dodany warunek liczbowy w bloku E2 `gra/tools/ambush-wiring-test.cjs`: liczba realnych wywołań w `gra/src/main.ts` — `releaseAmbushOnMoveOrder(` = 3, `planPlayerAmbushMove(` = 3, `resolveAmbushAfterMove(` = 2, `makeAmbushPathCutter(units, ownerId, areEnemyOwners)` obecne i bez `makeAmbushPathCutter([]`, guard `if (!launchAttack) return { kind: 'blocked'…}` w `gra/src/game/ambushMove.ts`.
   - DOWÓD MUTACJI (każda na `main.ts`, przywracany po teście; surowy wynik ostatniej linii testu):
     - M2 (usunięte `releaseAmbushOnMoveOrder(playerStackAt(u))`): `Wynik: 27 OK, 1 FAIL` — FAIL: E2.
     - MB (usunięte `releaseAmbushOnMoveOrder(stack)` przy rozkazie ruchu): `Wynik: 27 OK, 1 FAIL` — FAIL: E2.
     - MD (`makeAmbushPathCutter([], …)` dla wykonawcy AI): `Wynik: 27 OK, 1 FAIL` — FAIL: E2.
     - M6 (`planPlayerAmbushMove` barbarzyńców zastąpione `{kind:"clear"}`): `Wynik: 27 OK, 1 FAIL` — FAIL: E2.
     - Baza po poprawce: `Wynik: 28 OK, 0 FAIL` (przed dopisaniem asercji widoczności E2 = 28/0 też).
   - ZASTRZEŻENIE: to nadal test strukturalny (liczenie wystąpień w źródle), a nie wykonanie realnego kroku ruchu z `main.ts`. Test dynamiczny wpięcia w `main.ts` (fixture + wywołanie `startAnimatedMove`/`applyMarchSegmentInstant`) NIE został zrobiony — OTWARTE. Dynamiczna część jądra (`ambushMove.ts`) pokryta przez `ambush-realstep-test.cjs` 14/0.

2. PRZYJMUJĘ — poprawka. Usunięty w r4 blok E2 (`cancelAmbush` / `reconcileAmbush` z realnym `hasCity` / guard `!launchAttack` / filtr renderu) został przywrócony jako E2 w wariancie liczbowym (patrz pkt 1). Literalnej asercji `reconcileAmbush(units, (q, r) => cities.some(...))` NIE przywracam: r4 przeniósł tę logikę do `reconcileAmbushInWorld(units, cities)` (wiring E1 sprawdza to wywołanie). Mutacja M3 (zmiana `hasCity` w reconcile) NIE była puszczona w tej rundzie — NIE ZMIERZONO, OTWARTE.
   - Test C6 (scalenie) pozostaje w wersji r4 (zgodnej z polityką „reszta zostaje”): `Wynik` wiring E2 zielony.

3. PRZYJMUJĘ CZĘŚCIOWO — poprawka + dowód dla dwóch miejsc z zarzutu:
   - (a) Panel rozdzielenia: `gra/src/main.ts` `openSplitPanelForSelected` — `findSplitDestHexes(unitsForViewer(units, ME()), …)` zamiast surowego `units`. Heks z ukrytą zasadzką wroga nie daje już „Cel niedostępny"; ruch na taki heks wejdzie w zasadzkę w kroku ruchu (wyzwalacz).
   - (b) Cel marszu: `gra/src/main.ts` (blok `attackTarget`, ok. l. 33830) — szukanie przez `unitsForViewer(units, ME()).find(…)` w gałęzi bez `attackUnitId`. Ukryta zasadzka nie generuje „Cel niewidoczny (mgła).” ani planu ataku; ruch idzie normalną ścieżką i wyzwalacz działa w `planPlayerAmbushMove`.
   - Dowód: asercje V1/V2 w `gra/tools/ambush-wiring-test.cjs` (E2) — zielone. Mutacji na V1/V2 NIE puszczono — NIE ZMIERZONO dynamicznie.
   - AUDYT pozostałych czytelników (tabela wymagana przez DODATEK 3 pkt 5) — NIE ZROBIONE w tej rundzie. OTWARTE: `computeDiplomaticContacts` (audiencja pierwszego kontaktu), `wakeSentryUnitsOnEnemyContact` (r4 już filtruje), tooltipy heksu, minimapa, wybór jednostki/klik, HUD „siły wroga”, zasięg widzenia/mgła. Nie deklaruję ich jako zamkniętych.
   - Barbarzyńcy: zarzut 6 z r3 nie jest w liście r4 — bez zmian, nadal `buildHexOccupancy` widzi zasadzkę jak zwykłą jednostkę (wyzwolenie przez barbarzyńcę — OTWARTE, decyzja orkiestratora).

4. PRZYJMUJĘ — NIE ZMIERZONO. W tej rundzie nie uruchomiono żywego Chromium: brak pomiaru AI→gracz (przerwanie ruchu AI, wznowienie fazy AI `aiCmdResume`, brak dwóch jednostek na jednym heksie, zrzut). Zrzut `B-bitwa-AI-wpadlo-1280x720.png` z r4 pokazuje atak AI na miasto (obrona miasta Rzym), NIE wejście w zasadzkę — nie jest dowodem kryterium (b). Kryterium e (Chromium AI→gracz) OTWARTE; PASS niemożliwy.

5. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE w tej rundzie. Znacznik „W zasadzce” nadal tylko jako tekst w nagłówku panelu armii (`gra/src/ui/armyStackHud.ts`); brak ikony/obrysu na żetonie stosu na mapie, w liście armii i w karcie jednostki. Nie zmieniano renderu żetonów. Kryterium DODATKU 3 pkt 7 niespełnione.

## ZMIANY-COMMIT
- Kod + test: commit `1dfa1022f9ebd37be6ec3d6cab5d4028b332dbb8` (2 pliki: `gra/src/main.ts` — 8 linii zmienionych; `gra/tools/ambush-wiring-test.cjs` — +17 linii). Allowlista bez zmian w stosunku do r4 (żadnych nowych plików). `git diff --check` czysty.
- Raport: osobny commit po tym pliku (SHA w polu `sha` odpowiedzi orkiestratora).
- NIE zmieniano: `gra/src/data/wikiBundle.json`, `docs/`, `save.ts`, `armyMerge.ts`, `setup.ts`, `ai.ts`, `ambush.ts`, `ambushMove.ts`.

## TESTY (surowe wyniki, worktree `wf_ddfca171-e87-3` na `1dfa1022f`, `npm ci --ignore-scripts` wykonane)
- `npx tsc --noEmit` → exit 0 (brak wyjścia).
- `node tools/ambush-wiring-test.cjs` → `Wynik: 28 OK, 0 FAIL`, exit 0.
- Mutanty na `main.ts` (przywracane po każdym): M2 → `Wynik: 27 OK, 1 FAIL`; MB → `27 OK, 1 FAIL`; MD → `27 OK, 1 FAIL`; M6 → `27 OK, 1 FAIL` (FAIL: E2 we wszystkich czterech).
- `node tools/ambush-realstep-test.cjs` → `Wynik: 14 OK, 0 FAIL`, exit 0.
- `node tools/ambush-core-test.cjs` → `Wynik: 40 OK, 0 FAIL`, exit 0.
- `node tools/ambush-ui-reason-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0.
- `node tools/ambush-save-roundtrip-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0.
- `node tools/load-game-regression-test.cjs` → `load-game-regression: 34 PASS / 0 FAIL`, exit 0.
- `node tools/determinism-same-seed-test.cjs` → `WYNIK: PASS`, exit 0.
- NIE ZMIERZONO w tej rundzie: pozostałe bramki referencyjne (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6), `army-merge-*`, `determinism-digest-stackgroup`, Chromium (zarzut 4, 5), mutacje M3 i V1/V2.

## BLOKADY
1. Zarzut 4: pomiar AI→gracz w żywym Chromium — NIE ZMIERZONO. Blokuje PASS.
2. Zarzut 5: znacznik „W zasadzce” na mapie/liście/karcie — OTWARTE.
3. Zarzut 1: dynamiczny test wpięcia w `main.ts` na realnym kroku ruchu — OTWARTE (w tej rundzie tylko test liczbowy).
4. Zarzut 3: audyt pozostałych czytelników `units` wroga (tabela) — OTWARTE; tooltipy/minimapa/HUD nieobjęte.
5. Barbarzyńcy wyzwalający zasadzkę — decyzja orkiestratora (poza listą r4).
6. Baza: kandydat nie jest na aktualnym `origin/main` — integracja do orkiestratora.

## RUNDY
4/5 (obrona). Obrona prowadzona na Haiku (rola Operator (obrona)).

## UWAGI-DLA-ORKIESTRATORA
- Lista testów do deployu (nowe/zmienione): `gra/tools/ambush-wiring-test.cjs` (zmieniony), `gra/tools/ambush-realstep-test.cjs`, `gra/tools/ambush-core-test.cjs`, `gra/tools/ambush-ui-reason-test.cjs`, `gra/tools/ambush-save-roundtrip-test.cjs`.
- `gra/node_modules` zainstalowane w worktree (`npm ci --ignore-scripts`) — do sprzątania po tym temacie.
- Dług do osobnego tematu: test wpięcia dynamiczny (fixture kroku ruchu w `main.ts`); audyt widoczności (tabela); barbarzyńcy; znacznik UI na mapie; pomiar AI→gracz w Chromium.
- Nie puszczałem nowych sesji ani zadań; nie pushowałem; nie integrowałem na main.

NASTĘPNY KROK: Evaluator r5 na `1dfa1022f`. Przed kolejną rundą orkiestrator decyduje: (a) czy dynamiczny test wpięcia i audyt widoczności wchodzą w tę gałąź, czy osobny temat; (b) barbarzyńcy wyzwalają zasadzkę?; (c) zakres Chromium AI→gracz i znacznika UI.
DEPLOY/PUSH: NIE WYKONANO
