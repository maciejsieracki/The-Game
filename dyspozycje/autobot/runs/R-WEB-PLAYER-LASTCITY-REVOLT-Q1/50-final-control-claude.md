STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1
GOAL: pomiar, czy gracz moze stracic ostatnie miasto przez bunt i jak czesto; mechanizm t29 (V4/4242); skutek w UI; zero zmian gra/src.
ZMIANY/COMMIT: kandydat f25457465d431e437edf5bdfbaebae5a36894f21, baza 2e50241cd38d3b031b97803c1286b4b183bb1ec1. `git merge-base --is-ancestor` baza->kandydat: OK. `git diff --stat baza kandydat -- gra/src gra/data`: 0 zmian. Diff = analiza (.md), runs/** (raporty, dane), gra/tools/plrrevolt-{run,summarize,table}.cjs: zgodne z allowlista.
TESTY (wlasne uruchomienie na kandydacie, po npm ci --ignore-scripts): tsc --noEmit exit 0 (32,8 s); logic-test "LOGIC OK (213/213)"; ai-test "297 passed, 0 failed"; plrrevolt-table.cjs na dane/ odtwarza tabele z dokumentu (utrata miasta gracza: V4/4242 t29, latwy-s7 t59, normalny-s7 t58; 7 biegow bez utraty; owner -99 w ownersOfCities: 0 biegow). Pozostale bramki referencyjne nie byly przedmiotem zmian (kod gry bez zmian). Live Chromium: NIE URUCHAMIANO.

OCENA ZARZUTOW (bez etykiet rol):
- 1, 9: przyjete przez obrone, dokument poprawiony (przyczyna utraty NIE ROZSTRZYGNIETA; 0 z 10 zaobserwowanych buntow). Rzetelne.
- 7: naprawione, bramki zielone (potwierdzone).
- 6: naprawione, dokument istnieje i uczciwie opisuje braki.
- 2, 3, 4, 5, 8: obrona je przyjela, ale NIE NAPRAWILA, tylko przeniosla do "NIE ZMIERZONO". To jest sedno FAIL: dispatch r2 stwierdza wprost, ze punkty 3 (mechanizm t29 z logiem zmiany wlasciciela) i 4 (skutek w UI na zywo; hak odczytu istnieje: victory.ts:215-217, main.ts:49495-49553) sa OBOWIAZKOWE, a "NIE WYKONANO bez opisanych prob = FAIL". Zadnej proby (poza rozbudowa konsoli) nie opisano; obrona sama pisze "Live ... NIE URUCHOMIONO". Odczyt stanu ekranu porazki i zmian ownerId przez page.evaluate nie wymaga zmiany gra/src. Dane z zapisow (liczniki) nie rozstrzygaja przyczyny utraty miasta w 3/10 biegach, a to jest centralne pytanie (bunt czy barbarzyncy).
- 8: gracz pasywny (0 jednostek wojskowych) we wszystkich biegach; ustawienia maksimum nieweryfikowalne artefaktem (brak run.log w commicie). Wymog stalej zasady testowania (maksimum) nieudowodniony.

WNIOSKI MERYTORYCZNE (rzetelnie ustalone): kod NIE chroni ostatniego miasta gracza przed buntem (society-breakdown.ts:522-533, ochrona tylko AI); progi 12% / 3 tury; w 10 biegach 0 buntow gracza ([Rebelia], owner -99). Czestosc buntu przy realnej grze, Porzadek gracza, mechanizm t29 i UI po utracie: NIE ZMIERZONO.

BLOKADY (do naprawy w kolejnej rundzie, ten sam ID): (a) odtworzyc V4/4242 do t29 z logiem zmian ownerId miast gracza (stary->nowy, przyczyna: -1 barbarzyncy vs -99 bunt) przez page.evaluate/hooki odczytu, bez zmiany gra/src; (b) odczytac na zywo stan gameOver/ekran porazki po utracie ostatniego miasta (np. latwy-s7 do t59 lub normalny-s7 do t58); (c) zmierzyc Porzadek miast gracza (min/sr) dostepnym odczytem lub opisac konkretne proby, ktore zawiodly; (d) rozwazyc gracza nie calkiem pasywnego; (e) zapisac run.log z readbackiem ustawien maksimum w runs/.
RUNDY: FC r2; wg dispatchu zuzyte 2/5 (dwie nieudane rundy Haiku -> dozwolony SONNET na Operatorze z pisemnym uzasadnieniem w dispatchu).
NASTEPNY KROK: runda 3 Operatora tego samego ID z zadaniem (a)-(e); decyzja ABC o ochronie ostatniego miasta gracza dopiero po pomiarze.
UWAGI-DLA-ORKIESTRATORA: runner plrrevolt-run.cjs to cienka kopia aibal2-measure-run.cjs, nie nakladka z dispatchu; plrrevolt-summarize.cjs czyta nieskompresowany katalog.
DEPLOY/PUSH: NIE WYKONANO
