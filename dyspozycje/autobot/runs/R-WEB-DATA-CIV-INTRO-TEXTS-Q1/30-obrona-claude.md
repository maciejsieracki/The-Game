STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane tekstowe, bez zmian kodu gry)
TEMAT: R-WEB-DATA-CIV-INTRO-TEXTS-Q1
GOAL: Obrona po recenzji Evaluatora (kandydat 17363f2c, raport 423800b0). Odpowiedź na każdy z 6 zarzutów: poprawka z dowodem albo odrzucenie z dowodem. Bez zmiany allowlisty (4 pliki) i bez zmian poza nią.
ZMIANY-COMMIT: baza fast-forward do 423800b01 (zawiera 17363f2c + raport Evaluatora). Commit obrony zmienia: `gra/data/civ-intro-texts.json`, `gra/tools/civ-intro-texts-test.cjs`, `dyspozycje/autobot/runs/R-WEB-DATA-CIV-INTRO-TEXTS-Q1/TEKSTY-DO-AKCEPTACJI.md`, ten raport. SHA końcowy: patrz pole sha w odpowiedzi Operatora (commit obrony na gałęzi worktree, nic nie wypchnięte). Symlink `gra/node_modules` (gitignored, z worktree wf_4e6cd08e-fe6-1) zostawiony, bo usunięcie wymaga rm/unlink, a to jest zakazane.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. „na kamiennej stelii" → „na kamiennej steli" (Babilonia, rys). Dowód: grep po pliku, 0 trafień „stelii".
2. PRZYJMUJĘ CZĘŚCIOWO (6 linii zmienionych, 8 zostawionych z uzasadnieniem). Zmienione jako aluzje do natychmiastowego ataku:
   - Grecy, nieprzyjazne 2: „moi hoplici wciąż trzymają włócznie w pogotowiu" → „a zaufanie trzeba mi dopiero udowodnić".
   - Rzymianie, nieprzyjazne 3: „ciężar naszych legionów za plecami" → „mów z należytym szacunkiem i wykaż uczciwe zamiary".
   - Chińczycy, nieprzyjazne 3: „groźne chmury", „szeregi są czujne" → „trudne czasy", „fałszywe obietnice szybko wychodzą na jaw".
   - Egipt, nieprzyjazne 2: „Rydwany moich wojsk stoją gotowe na granicy" → „Na moim dworze każde słowo ma wagę".
   - Celtowie, nieprzyjazne 2: „gotowi do szarży… przekroczysz granicę" → „czuwają przy granicy plemienia, więc mów otwarcie".
   - Hetyci, nieprzyjazne 2: „rydwany gotowe do wymarszu" → „pamięć o dawnych zdradach jest długa".
   ODRZUCAM dla pozostałych linii o czujności (bez zapowiedzi wojny i bez gotowości do ataku): Zulusi nieprzyjazne 1 („wojownicy… nie zapominają o czujności"), Germanie nieprzyjazne 2 („drużyny czuwają na granicach"), Asyria nieprzyjazne 2 („łucznicy dbają o porządek na granicach"), Słowianie nieprzyjazne 1 („wojownicy z drużyny czekają na wieści"), Sumer, Harappa („gwardia czujna", „strażnicy czujni"). Dowód: to opis postawy obronnej, zgodny z dispatchem „chłodny/podejrzliwy, bez gróźb wojny z góry". Ograniczenie testowe: słowa WAR_WORDS (patrz zarzut 6) nie łapią tych linii, ale łapią wszystkie sześć zmienionych.
3. PRZYJMUJĘ. Grecy przyjazne 1: „nad twoją drogą i nad waszym przyjazdem" → „nad twoją drogą i nad twoim przyjazdem". Zulusi przyjazne 1: „a przodkowie czuwają" → „a przodkowie niech czuwają".
4. PRZYJMUJĘ. Egipt przyjazne 3: „Mądrość przodków uczy, że…" → „Bogowie cenią przymierza zawarte w zgodzie, bo są silniejsze od każdej armii." Chińczycy przyjazne 3 zostaje. Dowód: w pliku 1 trafienie „Mądrość przodków".
5. PRZYJMUJĘ CZĘŚCIOWO. Harappa rys: „handlowali wewnątrz swojego obszaru" → „handlowali w swoim obszarze i z odległymi krainami" (dodany handel poza obszar, bez wymieniania Mezopotamii, bo nie weryfikowano źródeł). „chroniły przed najazdami i kaprysami rzek" → „chroniły przed najazdami" (mury nie chronią przed wylewami). Brak weryfikacji historycznej, nadal NIE_ZMIERZONO względem źródeł.
6. PRZYJMUJĘ CZĘŚCIOWO. Dodane asercje w `civ-intro-texts-test.cjs`:
   - surowe ID: brak `_`, brak camelCase, brak samodzielnego ikonaId w rysie i powitaniach (RAW_ID_RE, pętla po civIds);
   - ton: w nieprzyjaznych powitaniach brak słów WAR_WORDS = rydwan, szarż, wymarsz, legion, włóczn, pogotowi, przekrocz.
   Nie dodano automatu na cały ton ani na angielskie słowa (brak wiarygodnej listy); to pozostaje przeglądem ręcznym, NIE_ZMIERZONO automatycznie.

TESTY:
- `node gra/tools/civ-intro-texts-test.cjs` → `civ-intro-texts-test: OK (15 cywilizacji, 90 powitan)`, exit 0.
- Mutacje na kopiach w scratchpad (`mutate.py`), oryginał nietknięty:
  - m1 usunięty klucz `egipt`: exit 1, 3 FAIL;
  - m2 puste powitanie `sumer`: exit 1, 3 FAIL;
  - m3 duplikat powitania: exit 1, 2 FAIL;
  - m4 imię władcy w powitaniu: exit 1, 2 FAIL;
  - m5 apostrof w rysie: exit 1, 1 FAIL;
  - m6 czwarte powitanie nieprzyjazne: exit 1, 2 FAIL;
  - m7 surowe ID `inkowie_przyjazny` w powitaniu: exit 1, 1 FAIL;
  - m8 słowo „rydwany" w nieprzyjaznym: exit 1, 1 FAIL.
- Bramki: `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0; logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`. Wszystkie exit 0.
- `git diff --check` czysty. `git status`: tylko 3 zmienione pliki (+ raport).

BLOKADY: brak.
RUNDY: 2/5 (runda Operatora po recenzji). Ostatni werdykt Evaluatora: PASS-WITH-NOTES.
NASTĘPNY KROK: Evaluator weryfikuje poprawki (zmienione linie + nowe asercje + mutacje m7/m8). Po akceptacji właściciela poprawki tekstów jako osobny temat; potem UI (ekran „Odkryłeś nową cywilizację").
UWAGI-DLA-ORKIESTRATORA:
- Poza zakresem, nie zmieniano: „herbata" w Chińczycy przyjazne 2 może być anachronizmem zależnie od epoki gry (NIE_ZMIERZONO, do decyzji właściciela przy akceptacji).
- Symlink `gra/node_modules` w worktree wf_c37c17bd-043-3 wskazuje na `wf_4e6cd08e-fe6-1/gra/node_modules`; do usunięcia przy sprzątaniu worktree (nie commitowany).
DEPLOY/PUSH: NIE WYKONANO
