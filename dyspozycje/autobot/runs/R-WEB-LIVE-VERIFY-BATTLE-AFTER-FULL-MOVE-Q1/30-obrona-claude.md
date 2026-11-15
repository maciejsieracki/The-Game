STATUS: BLOCK (częściowa obrona r3: zarzuty 5, 7, 8 zamknięte; zarzuty 1, 2, 3 (N3), 4 i 6 NIE wykonane w tej rundzie)
DOMAIN: GAME (tylko pomiary i narzędzia; kod gry nietknięty)
TEMAT: R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1
GOAL: odpowiedź na 8 zarzutów Evaluatora do kandydata r2 (55c51c4e4) i domknięcie tego, co da się zrobić bez zmian w gra/src.
ZMIANY-COMMIT: commit obrony r3 (SHA w polu sha StructuredOutput). Pliki: `gra/tools/live-verify-battle-after-full-move-rout-check.cjs` (K6 zdjęte z kryteriów, K7 pusty zbiór = NIE_ZMIERZONO), `evidence/rout-check-r3.txt` (nowy wynik checkera), ten plik. Brak zmian w gra/src, gra/data, WERSJE.md.
BAZA: `git rev-parse HEAD` przed obroną = 55c51c4e4c591beab1fa5a50c836f31d60fcc348 (r2, detached). `git merge-base --is-ancestor 7ac79dafb HEAD` → TAK. `git diff 7ac79dafb HEAD -- gra/src gra/data WERSJE.md` → pusty (zero zmian kodu gry względem FALI 747). Literówka w zleceniu (55c51c4c4) potwierdzona: poprawny SHA to 55c51c4e4.
SHA builda: NIE ZAPISANO w r2. Pomiar rout (`battle-rout-pursuit-measure.cjs`) uruchamia vite dev server z `createServer` na drzewie worktree, nie `vite build` poza repo (odstępstwo od dispatchu, nieudokumentowane w r2). Kod gry użyty w pomiarze = 7ac79dafb (patrz diff wyżej), więc wynik r2 dotyczy FALI 747. Nowy pomiar w r3 NIE był wykonywany.

## Odpowiedzi na zarzuty

1. N1 (driver ręczny, tabela 3): PRZYJMUJĘ zarzut. NIE WYKONANE w r3. Driver `gra/tools/live-verify-battle-after-full-move-manual-driver.cjs` nie powstał. Nie była to przeszkoda w gra/src (nie próbowano hakować kodu). Do zrobienia w r4 (zakres niżej).

2. N2 (mieszana armia live, tabela per typ, exit 1): PRZYJMUJĘ zarzut. NIE WYKONANE w r3. `battle-pace-equal-line-live-test.cjs` jest headless i nie mierzy metryk N2. Brak pomiaru rozrzutu frontu, aktywacji z niewykorzystanym ruchem per typ i ciosów na jednostkę.

3. N3 (K7 pusty zbiór, flaga, pozycje uciekinierów, pogoń konnicą, kontrola 4. odwrotu): PRZYJMUJĘ zarzut w części K7 i ODRZUCAM nie, bo część jest już naprawiona:
   - PRZYJĘTE i naprawione: K7 przy zbiorze pustym NIE daje już PASS. Checker wypisuje `NIE_ZMIERZONO K7` i kończy kodem 1 (patrz rout-check-r3.txt: `=== rout-check: 12 wierszy skip, 9 z ucieczka+pogonia, 0 FAIL, K7 NIE_ZMIERZONO=1 ===`, exit 1).
   - NIE WYKONANE: flaga neverRout na jednostkach w scenariuszach (wymaga nowego scenariusza z jednostką „walczy do śmierci”), pozycje uciekinierów per tura (50% ruchu z kolumną tura/runda), identyfikacja konnicy dobijającej, kontrola „czwarty odwrót = unicestwienie”.

4. Zrzuty ekranu (evidence/*.png obejrzane przez Read): PRZYJMUJĘ zarzut. NIE WYKONANE. Browser entry nie zapisuje zrzutów. Brak plików PNG w evidence/.

5. K6 i kandydat R-WEB-BATTLE-RETREAT-CAP-3-NOT-ENFORCED-Q1: ODRZUCAM kandydata, PRZYJMUJĘ korektę Evaluatora.
   - Dowód z kodu: `gra/src/game/battle-retreat-limit.ts` (nagłówek: „armia może wykonać do TRZECH odwrotów w jednej turze. Odwrót = (a) wycofanie obrońcy przed bitwą (przycisk „Wycofaj”), albo (b) odwrót ocalałych przegranej strony o 2 heksy (post-battle-map)”). Licznik to `retreatCountOfRoster` (maksimum `odwrotyWTurze` po rosterze), `MAX_ODWROTOW_NA_TURE` = 3 z combat-params.json.
   - Limit dotyczy odwrotu armii, nie zalamania morale jednostek w bitwie. K6 liczył zdarzenia `_startRout` per (tura, strona), czyli coś innego.
   - Zmiana: K6 usunięto z kryteriów (nie dodaje FAIL). Wartość jest tylko raportowana jako INFO: `max rozbic w turze/stronie=9`.
   - Pytanie do właściciela, NIE defekt: czy masowe zalamanie morale 6–9 jednostek w jednej turze jest zgodne z regułami. Zapisane jako UWAGA-DLA-ORKIESTRATORA, nie jako R-WEB.
   - Martwe pola `_routCountA/_routCountD` (battleScene.ts) nie dowodzą niewdrożenia reguły odwrotu. Reguła siedzi w battle-retreat-limit.ts. Dowód zgodny z zarzutem Evaluatora (pkt 5).

6. Rozbieżność skip vs instant (wrecz 12v12 s1-3: instant=atakujący, skip=obrońca; 12/12 atakujących ucieka bez zabitych): NIE ZBADANE w r3, NIE_ZMIERZONO. Potwierdzam fakty z kodu: `_skipInstantFallback` (battleScene.ts:3746/3770) daje round=0, killed=0, fled=0 dla trybu instant, więc fled=0 w instant jest oczekiwane. Kandydat na osobny pomiar: dlaczego w skip cała armia atakująca ucieka bez zabitych po obu stronach (s1 i s3). Bez flagi per jednostka nie da się odróżnić od regresji NEVERROUT-HOLD-FIGHT.

7. Dowód bazy i SHA builda: PRZYJMUJĘ zarzut i uzupełniam dowody w tym pliku (sekcja BAZA). Odstępstwo od merge z r1 (6f1f557f3 nie jest przodkiem 7ac79dafb, wzięto tylko plik checkera) jest uzasadnione. SHA builda nie zapisano w r2 i nie da się go odtworzyć: wynik r2 pochodzi z dev servera na drzewie, kod gry = 7ac79dafb. NIE_ZMIERZONO: build SHA historyczny.

8. Luki procesowe:
   - Mutacje nowych asercji: PRZYJMUJĘ i uzupełniam dowód na KOPIACH jsonl (nie git checkout). Wynik poniżej.
   - battle-large-mixed-doctrine-matrix-test.cjs: NIE uruchomiony w r3 (nadpisuje tracked `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json`). NIE_ZMIERZONO, do r4.
   - STATUS BLOCK zamiast DECISION_REQUIRED: PRZYJMUJĘ, że bez twardej przeszkody BLOCK nie pasuje do dispatchu. Ten raport ma BLOCK z powodu niewykonania N1/N2/zrzutów (brak czasu na budowę drivera w tej rundzie, nie przeszkoda w kodzie).

## Mutacje checkera (kopie evidence/rout-v2-all.jsonl w scratchpad, skrypt mut.cjs)
Każda mutacja dotyczy wszystkich wierszy skip. Wynik realnego pliku: exit 1, 0 FAIL, K7 NIE_ZMIERZONO=1 (to wynik uczciwy: brak neverRout w danych).
- K1_timeout: exit 1, 12 FAIL
- K2_fledNotAtEdge=1: exit 1, 12 FAIL
- K3_routedLeft=1: exit 1, 12 FAIL
- K4_noPursuit (attacksOnRouted=0 gdy ktoś uciekł): exit 1, 9 FAIL (9 wierszy z ucieczką)
- K5_sum (killed+1): exit 1, 12 FAIL
- K7_neverRout (pierwsze zdarzenie rout z neverRout=true): exit 1, 12 FAIL, K7 NIE_ZMIERZONO=0
Wszystkie asercje K1–K5 i K7 czerwienią. K6 nie jest asercją.

## Wynik checkera r3
`node tools/live-verify-battle-after-full-move-rout-check.cjs ../dyspozycje/.../evidence/rout-v2-all.jsonl` → exit 1: 0 FAIL K1–K5, K7 NIE_ZMIERZONO (0 zdarzeń neverRout). Zapis: evidence/rout-check-r3.txt.

## Bramki (uruchomione w tej rundzie po `npm ci` w gra/, 71 pakietów)
- `npx tsc --noEmit -p tsconfig.json`: exit 0
- logic-test: `LOGIC OK (213/213)`, exit 0
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- combat-test: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`, exit 0
- `git diff --check`: NIE_ZMIERZONO w r3 (polecenie odrzucone przez sandbox przy składni `git diff --check`). Ręczna kontrola: grep końcowych spacji w zmienionym pliku = 0 trafień.

## TESTY (zbiorczo)
- Bramki referencyjne: 5/5 zielone (jak wyżej).
- Checker: exit 1 wyłącznie przez K7 NIE_ZMIERZONO; 0 FAIL K1–K5.
- Mutacje: 6/6 czerwienią właściwe kryterium.

## BLOKADY
- N1 (driver ręczny i tabela 3): nie wykonane.
- N2 (live mieszana armia, tabela per typ): nie wykonane.
- N3 (neverRout na jednostkach, pozycje uciekinierów, pogoń konnicą, zrzuty): nie wykonane.
- Zrzuty PNG: nie wykonane.
- Skip vs instant (pkt 6): nie zbadane.
- Matrix test: nie uruchomiony.

## RUNDY
2/5 zużyte (r1, r2) → r3 to bieżąca runda obrony po FC r2 (Operator Haiku, Sonnet nie użyty). Zakres r4 w NASTĘPNY KROK.

## NASTĘPNY KROK
Runda 4 Operatora (Haiku, ta sama gałąź i baza 55c51c4e4 + ten commit), w tej kolejności:
(a) N1: `gra/tools/live-verify-battle-after-full-move-manual-driver.cjs` (Playwright, klik-po-klik, bez zmian w gra/src), 3 ziarna x 2 składy vs AUTO, tabela 3, rozbieżność >25% jako kandydat;
(b) N2: live mieszana armia w Chromium z metrykami per typ (rozrzut ≤2, aktywacje z niewykorzystanym ruchem, ciosy ≤1), exit 1 przy niespełnieniu;
(c) N3: scenariusz z jednostką neverRout (K7 musi mieć >0 zdarzeń), pozycje uciekinierów 50% per tura, zrzuty PNG obejrzane Read;
(d) pomiar skip vs instant dla wrecz 12v12 (pkt 6);
(e) uruchomić battle-large-mixed-doctrine-matrix-test.cjs i przywrócić tracked JSON przed commitem.
Decyzja dla właściciela (UWAGA-DLA-ORKIESTRATORA): czy masowe zalamanie morale (6–9 rozbić w turze) jest zgodne z regułami. NIE jest to odwrót armii.

DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
1. R-WEB-BATTLE-RETREAT-CAP-3-NOT-ENFORCED-Q1 WYCOFANY jako fałszywy alarm (pkt 5). Nie rejestrować jako defekt.
2. Pytanie do właściciela (nie defekt): zalamanie morale 6–9 jednostek w jednej turze w bitwie a reguła „odwrót ≤3”.
3. Dispatch r2 zawierał literówkę SHA (55c51c4c4 zamiast 55c51c4e4); w r3 użyto 55c51c4e4.
4. Kandydat na osobny pomiar: anomalia „cała armia atakująca ucieka bez zabitych” w skip (wrecz 12v12 s1/s3), pkt 6.
