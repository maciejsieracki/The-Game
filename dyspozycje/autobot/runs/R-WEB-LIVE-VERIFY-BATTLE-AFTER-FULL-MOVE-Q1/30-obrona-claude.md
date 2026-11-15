STATUS: PASS-WITH-NOTES (obrona r4 na zarzuty 1-6 Evaluatora d003de95e; wszystkie 6 zarzutów PRZYJĘTE, żaden nie odrzucony; poprawki tylko w narzędziu i raporcie; kod gry bez zmian)
DOMAIN: GAME (tylko pomiary i narzędzia; gra/src nietknięte)
TEMAT: R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1
GOAL: odpowiedzieć na zarzuty 1-6 Evaluatora do kandydata f6d5044153a2f879ccb9a69c7472d65e95ff4319 (r3), skorygować wnioski, których dowody nie niosą, i zamknąć luki procesowe z zarzutu 3.
ZMIANY-COMMIT: (1) `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1/evidence/mutations-r3-script.cjs` — usunięto zaszyte ścieżki worktree (`-1`/`-2`) i scratchpadu; ROOT wyliczany z `__dirname`, wyjście kopii z `MUT_OUT` (zarzut 3); (2) `evidence/mutations-r4.txt` — wynik uruchomienia zmienionego skryptu; (3) ten plik. Brak zmian w gra/src, gra/data, gra/tools, WERSJE.md, `01-matrix.json`, `dowody/*.png`. `10-operator-claude.md` NIE zmieniony (korekty niżej są ERRATĄ w tym pliku).
BAZA: `git rev-parse HEAD` przed obroną = `f6d5044153a2f879ccb9a69c7472d65e95ff4319` (kandydat r3, detached). `git merge-base --is-ancestor 7ac79dafb HEAD` → TAK. `git diff --stat 7ac79dafb HEAD -- gra/src gra/data WERSJE.md` → pusty (zero zmian kodu gry od FALI 747). SHA builda: NIE ZAPISANO (testy live w tej rundzie NIE były uruchamiane, patrz TESTY).

## Odpowiedzi na zarzuty Evaluatora (d003de95e, `20-evaluator-claude.md`)

1. ZARZUT 1 (wniosek "12/12 par rozbieżne" i hipoteza jednego `_doMove`): PRZYJMUJĘ.
   - Korekta liczby z dowodem: w `evidence/manual-vs-auto.jsonl` zwycięzca różni się między trybem ręcznym a AUTO w **9 z 12 par**, nie w 10 (Evaluator podał 10). Policzone skryptem na 18 wierszach (6 × manual-march, 6 × manual-focus, 6 × auto): C1 s1 focus (obr. vs atk.); C1 s2 march i focus; C1 s3 focus; C2 s1 march i focus; C2 s2 march i focus; C2 s3 march. Zgodnie z zarzutem 1 pary z różnym zwycięzcą nie dają czystej miary „rozbieżności strat”.
   - Korekta wniosku: metryka procentowa strat zwycięzcy NIE jest dowodem defektu kodu. Dowodem jest tylko to, że przebiegi ręczne (driver wydaje jeden rozkaz całej armii) dają inny wynik niż AUTO na tych samych składach i ziarnach — kierunek, nie mechanizm.
   - Hipoteza „jeden `_doMove` na aktywację w `_performPlayerOrder`" (battleScene.ts 18889-19060) pozostaje HIPOTEZĄ NIEZWERYFIKOWANĄ eksperymentem. Kandydat `R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1` wymaga przed zleceniem naprawy powtarzalnej reprodukcji na poziomie sceny (bez klików), co jest poza zakresem tego tematu (pomiary bez zmian w gra/src).
   - Przebiegi klik-po-klik nie są bit-powtarzalne (przyznane w 10-operator), więc liczby per ziarno traktować jako orientacyjne.

2. ZARZUT 2 (B1: „po pierwszym rozbiciu innych zadały 5, 9 i 6 ciosów"; słaby warunek „przeżył bez ciosu"): PRZYJMUJĘ.
   - Dowód: `live-verify-battle-after-full-move-live.cjs` blok B1 (okolice linii 117-131) liczy ciosy od `firstRout`; w danych `firstRoutRound = 1` we wszystkich ziarnach R1 (`live-n2-n3.jsonl`), więc „po pierwszym rozbiciu" = „od rundy 1". Liczby 5/9/6 NIE są oknem po rozbiciu i nie mogą być cytowane jako taki dowód.
   - Dowód z danych (liczba żywych neverRout na początku rundy, zgodnie z Evaluatorem): s1 4,4,1,0; s2 4,4,3,1,1,0; s3 4,4,2,0. Neverrout giną w rundach 3-5.
   - Gałąź „przeżył, a nie zadał ciosu" (ten sam blok B1) NIE była ćwiczona na prawdziwych danych: w R1 nie ma ocalałego neverRout (wszystkie `killed`). Status tej gałęzi: NIE_ZMIERZONO (nie PASS).
   - Poprawny wniosek: NEVERROUT-HOLD-FIGHT potwierdzone przez: 0 zdarzeń rout z flagą `neverRout=true` w 6 bitwach R1 (auto i skip) oraz brak ucieczki tych jednostek; neverRout zadają ciosy w rundach 2-5 (nie „po rozbiciu innych"). Zamiana sformułowania w ERRACIE poniżej.
   - Zmiana asercji: NIE wykonana w tej rundzie (brak ocalałych = brak danych do sensownej asercji; wymaga scenariusza z ocalałym neverRout — kandydat na r5, jeśli właściciel chce tę gałąź).

3. ZARZUT 3 (skrypt mutacji z zaszytymi ścieżkami worktree `-1` i scratchpadu): PRZYJMUJĘ i NAPRAWIONO w tym commicie.
   - `evidence/mutations-r3-script.cjs`: `ROOT = path.resolve(__dirname, '../../../../..')` (repo-root z `dyspozycje/autobot/runs/<ID>/evidence/`), `EV = __dirname/`, `OUT = $MUT_OUT || os.tmpdir()/mut-r3`.
   - Weryfikacja po poprawce (uruchomione w tym worktree, zapis kopii do scratchpadu): `MUTACJE: 28 sprawdzen, 0 niezgodnych`, wyjście w `evidence/mutations-r4.txt` (29 linii, z czego ostatnia `MUTACJE: 28 sprawdzen, 0 niezgodnych`). Skrypt NIE nadpisuje danych w evidence (kopie w OUT).
   - Uwaga z zarzutu 3 (dowód mutacyjny dotyczy kopii JSONL, nie źródła telemetrii) — PRZYJĘTE jako ograniczenie: mutacje sprawdzają checker, nie instrumentację. Nie rozszerzane w tej rundzie.

4. ZARZUT 4 (zrzuty ekranu nie dowodzą opisanych zachowań; tooltip identyczny na zrzutach 1 i 2; brak identyfikacji Chaska; brak ucieczki na zrzucie 3): PRZYJMUJĘ.
   - W 10-operator §(1) opisy zrzutów („neverRout żyje i stoi w walce", „pierwsze ciosy konnicy w uciekinierów") są opisami NIEZWERYFIKOWALNYMI z obrazu. Dowodem tych zdarzeń są wyłącznie wiersze jsonl (`live-n2-n3.jsonl`, R1/R3) i tabela, nie PNG.
   - Zrzuty PNG w tej rundzie NIE były ponownie oglądane przez Operatora (Evaluator oglądał je narzędziem Read; ocena zgodna). Status zrzutów: ilustracyjne, NIE dowodowe.

5. ZARZUT 5 (rozrzut frontu M1 = 2 dokładnie na limicie; próg A3 10% = założenie; Hastati jako strzelec, brak piechoty z włócznią): PRZYJMUJĘ jako uwagę ryzyka, BEZ zmiany progu.
   - Dowód: `evidence/live-n2-n3-table.txt` linie 3-5: M1 s1/s2/s3, „max rozrzut frontu = 2" (limit dispatchu ≤ 2). M2: 1.
   - Próg ≤2 jest z dispatchu (decyzja zlecającego), nie zmieniany przez obronę. Ryzyko: przy kolejnej zmianie battleScene.ts (RESIDUAL-INFANTRY-Q2, COLLISION-ARB) test A1 może czerwienieć bez regresji reguły — oczekiwać i nie traktować automatycznie jako regresji.
   - Próg 10% (A3) był założeniem Operatora (dispatch nie podaje liczby); zmierzone ≤1,8% w tabeli.
   - Ograniczenie zakresu składów: piechotę reprezentuje Wojownik, Hastati liczony jako strzelec. Odnotowane, bez zmian.

6. ZARZUT 6 (wiersze `mode:instant` w R2: winner `atakujacy`, round 0, exportedHpDef 0, survived 12/12 po obu stronach; AUTO i SKIP dają `obronca` w s1 i s2): PRZYJMUJĘ jako fakt do opisania; wyjaśnienie w raporcie niewystarczające, dopisuję.
   - Dane (`live-n2-n3.jsonl`, wiersze R2 z trzech trybów, ziarna 1-3):
     - s1: auto = obronca (r37, atk killed 0 / fled 12, def survived 10); skip = obronca (identycznie); instant = atakujacy (r0, def survived 12, exportedHpDef 0).
     - s2: auto = obronca (r35); skip = obronca (r35); instant = atakujacy (r0).
     - s3: auto = atakujacy (r43, def fled 11); skip = atakujacy (r43); instant = atakujacy (r0).
   - Wniosek: instant NIE jest symulacją. `_skipInstantFallback` (battleScene.ts 3746, 3770) rozstrzyga bez rozgrywania (round 0, killed 0, fled 0), więc zera są oczekiwane; ale rozstrzygnięcie zwycięzcy w s1 i s2 różni się od AUTO/SKIP na tym samym składzie i ziarnie. To jest znana sprawa #257/#281 (decyzja właściciela: udokumentować bez zmian, ścieżka nieosiągalna w UI).
   - Nie jest to regresja NEVERROUT-HOLD-FIGHT: w R2 wszystkie 24 jednostki mają `neverRout=false` w eksporcie (`events.rout[].neverRout`), a anomalia 12/12 uciekających w AUTO/SKIP dotyczy rozbić morale, nie flagi.
   - Wiersze instant zostają tylko z asercją K1 (brak asercji zwycięzcy). Bez zmian kodu i bez zmian kryteriów.

## ERRATA do 10-operator-claude.md (korekty tego raportu; plik operatora nie był edytowany)
- §(1) B1: zdanie „po pierwszym rozbiciu innych zadały 5, 9 i 6 ciosów" → NIEPRAWDA jako okno po rozbiciu (firstRoutRound = 1). Poprawnie: neverRout zadają ciosy w rundach 2-5; gałąź „przeżył bez ciosu" NIE_ZMIERZONO (brak ocalałych).
- §(1) zrzut 2 i 3: opisy zawartości obrazu (Chaska, „stoi w walce", „pierwsze ciosy konnicy w uciekinierów") NIE zweryfikowane z PNG; dowodem są jsonl.
- §(3) wniosek kandydata: „12/12 par rozbieżne" → POPRAWNIE 9/12 par z różnym zwycięzcą (patrz zarzut 1); hipoteza jednego `_doMove` NIEZWERYFIKOWANA.

## TESTY (w tej rundzie, po `npm ci` w `gra/`, exit codes z surowego wyjścia)
- `npm ci` w gra/: exit 0.
- `npx tsc --noEmit -p tsconfig.json`: exit 0.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`, exit 0.
- `git diff --check`: wyjście puste (czysto).
- Mutacje (zmieniony skrypt, zarzut 3): `MUTACJE: 28 sprawdzen, 0 niezgodnych`, zapis `evidence/mutations-r4.txt`.
- Testy LIVE (Chromium) w tej rundzie NIE były uruchamiane: NIE_ZMIERZONO. Dane wyjściowe są wyłącznie z zapisanych plików evidence, a zarzuty 1, 2, 5, 6 zostały zamknięte korektą wniosku i odczytem danych, nie nowym pomiarem.
- Matrix test `battle-large-mixed-doctrine-matrix-test.cjs`: NIE uruchamiany w tej rundzie (nie był wymagany do zarzutów; nie nadpisuje plików).

## BLOKADY
- Brak blokad procesowych dla zarzutów 1-6.
- NIE_ZMIERZONO: (a) gałąź B1 „ocalały neverRout bez ciosu" (brak ocalałych w danych); (b) build SHA (brak zapisu w r2/r3; testy live nie uruchamiane w r4); (c) ponowne oglądanie PNG (zrzuty tylko jako ilustracja, oceniane wg Evaluatora).
- Do decyzji właściciela (NIE defekt tematu): czy kandydat `R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1` ma być zlecony po powtarzalnej reprodukcji na poziomie sceny (propozycja: tak, najpierw pomiar sceny bez klików).

## RUNDY
Operator: runda 4 (Haiku, ten sam temat; poprzednie r1-r3 zużyte, Sonnet użyty w r3 po dwóch nieudanych rundach Haiku, zgodnie z dispatchem DODATEK 2). Ta odpowiedź to obrona po Evaluator r3.

## NASTĘPNY KROK
Final Control (Sonnet) na kandydacie po commicie obrony. Otwarte pozycje dla FC: (1) decyzja o B1 ocalałych (r5 opcjonalnie); (2) kandydat R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1 — wymaga reprodukcji sceny (nie w tym temacie); (3) sprawdzenie zrzutów PNG przez FC, jeśli FC chce dowodu wizualnego.

DEPLOY/PUSH: NIE WYKONANO

---

# Historia: obrona r3 (poprzednia runda, zachowana bez zmian)

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
