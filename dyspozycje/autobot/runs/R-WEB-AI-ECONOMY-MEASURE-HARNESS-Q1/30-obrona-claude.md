STATUS: DECISION_REQUIRED (obrona r2; cele 1, 3 i 5 nie są osiągnięte, kryterium (c) czerwone; przyczyny leżą po stronie gry, poza allowlistą tematu, więc wymagają decyzji orkiestratora/właściciela)
DOMAIN: GAME (narzędzia pomiarowe + hak civTest; bez zmian logiki gry)
TEMAT: R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1
GOAL: (1) metryki ekonomii AI per owner per tura; (2) runner wznawialny 100+ tur; (3) obejście bramki NNS gracza z licznikiem; (4) dowód 100 tur x2 ziarna + test wznowienia; (5) instrukcja dla #415.
BAZA: 5f18f4d42a872dd6f425227142f75afc97bb6e6e; KANDYDAT (start obrony): 2579e5b28; ZARZUTY: Evaluator 4a3cebdc7 (8 zarzutów).
ZMIANY/COMMIT: commit obrony = SHA w polu sha wyniku (ten plik nie zawiera własnego SHA). Zmienione pliki: gra/src/main.ts (+8 linii: pole `diag` w odczycie `__aiEconomyMeasure.metrics()`, tylko odczyt, za ?civTest=1), gra/tools/ai-economy-measure-hook-test.cjs (asercja wartości AI + prawdziwa mutacja przez --mutant-dist), gra/tools/ai-economy-measure-run.cjs (pole `diag` w wierszu JSONL), gra/tools/ai-economy-measure-README.md (poprawiona diagnoza, ograniczenia), runs/<ID>/30-obrona-claude.md, runs/<ID>/evidence/* (przebiegi ponowione na bieżącym kodzie). Nie zmieniono logiki gry, gra/data, WERSJE.md, manifestu ani żadnych testów istniejących. Allowlista zachowana.

## ODPOWIEDZI NA ZARZUTY

Zarzut 1 (AI metryki puste) — PRZYJMUJĘ (potwierdzone, przyczyna zlokalizowana, NIE naprawiona).
- Dowód: `evidence/seed4242-100t.jsonl` i `seed777-100t.jsonl` (ponowione, 99 wierszy każdy, tury 2..100): owners 1..6 mają miasta=0, jednostki=0 w turach 2 i 100. Nowe pole `diag` ostatniego wiersza: `aiStartHexes`=6, `pendingForeignSpawnCities`=0, `pendingSameTypeRivalHexes`=0, `citiesAll`=1, `ownersOfCities`=[0].
- Odtworzenie (osobny przebieg, sprawdzony też wariant ?playtest=mapa): po foundFirstCity miasta AI = 0, `__nnsMeasureDebug.snapshot().owners` = [] mimo 6 wpisów w aiStartHexes.
- Wniosek: AI nie dostaje miast przy starcie w ścieżce harnessu; kolejka spawnu jest pusta, więc `spawnPendingForeignClusters` nie ma co założyć. Przyczyna leży w starcie gry (gra/src/main.ts, ścieżka klastra ok. l. 11376-11840), poza allowlistą. NIE ZIDENTYFIKOWANO, czy to regresja, czy skutek parametrów startu harnessu (`rivals: '2'`, `civTypesCount: 15`). Nie wiem, czy zwykły start z UI też tak się zachowuje (w zapisie z live-testów raportowano 26 miast — to inny start).
- Co zrobiono: dodano pole `diag` (odczyt) i asercję wartości w teście haka: "AI ma >=1 miasto po zalozeniu miasta gracza" — obecnie CZERWONA (zgodnie z prawdą). Nie wymyślałem obejścia (np. ręcznego zakładania miast AI), bo zmieniłoby to grę.

Zarzut 2 (kryterium c, diagnoza podzialPracy) — PRZYJMUJĘ (moja diagnoza była błędna; zarzut poprawny).
- Dowód: `evidence/resume-t41-snapshot-diff.txt` (ponowiony przebieg, seed 4242, wznowienie z tury 40): 4 różnice: `/cities/0/podzialPracy` (brak w przebiegu ciągłym, w wznowionym `{procentBudynki:70}`), `wealthState.pula` 1.821 vs 1.26, `gracze/0/1/skarbiec` 251 vs 254, `gracze/0/1/nauka` 112 vs 112.5. Identyczne z ustaleniem Evaluatora.
- Przyczyna: gra/src/game/cities.ts `ensureCityPodzialDefaults` (ok. l. 707-720) dopisuje `DEFAULT_PODZIAL_PRACY` miastu bez pola przy wczytaniu; żywe miasto bez pola używa globalnego podziału. To błąd normalizacji przy load poza allowlistą.
- Wycofuję: twierdzenie, że „save.ts nie zapisuje podzialPracy" (zapis serializuje całą tablicę miast). README poprawiony.
- Nie naprawiono: wymaga zmiany w grze (cities.ts) albo decyzji, że referencją jest przebieg z zapisem w tej samej sesji. Kryterium (c) pozostaje CZERWONE.

Zarzut 3 (gałąź obejścia bramki NNS niezmierzona) — PRZYJMUJĘ.
- Dowód: w obu przebiegach 100-tur `gateActiveTurns`=0, `bypassApplied`=0, `gateBlockedBeforeEnd`=false w 99/99 wierszach (summary: `seed4242.summary.json`, `seed777.summary.json`). Gałąź dosypek nie została wykonana, więc nie ma danych o jej wpływie.
- Nie napisano testu tej gałęzi: wymagałby scenariusza, w którym bramka się włącza (np. podatki 30/60/10 przy niskim zapasie), a w tym przebiegu gracz miał skarbiec rosnący do 1332. NIE ZMIERZONO. Uwaga: `grantPlayerGold/grantPlayerFood` należą do istniejącego hooka `__aiTradeWiringTestDebug` (nie dodałem ich); brak dowodu, że nie wpływają na AI — przyjmuję to jako lukę.

Zarzut 4 (pozorna mutacja testu haka) — PRZYJMUJĘ (naprawione).
- Usunięto fałszywą „mutację" (lista wymagań z dopisanym nieistniejącym kluczem). Dodano prawdziwą mutację: `--mutant-dist <bundle>` — test ma zgłosić błąd kształtu na zepsutym bundle.
- Dowód: `evidence/hook-test.log`: zbudowano bundle bez pola `skarbiec` w main.ts (poza repo, po czym źródło przywrócono i zweryfikowano grep). Wynik: `CZERWONE` „mutacja realna ... jest CZERWONA :: owner 0 bez skarbiec; owner 1 bez skarbiec; owner 2 bez skarbiec" oznacza wykrycie (asercja mutacji = zielona). Ostatnie zdanie: `PODSUMOWANIE 4/5 zielone` — jedyny czerwony to asercja wartości AI (zarzut 1), zgodnie z prawdą.
- Asercja wartości (AI >=1 miasto) dodana; obecnie CZERWONA.

Zarzut 5 (mutacja wznowienia nie uruchomiona) — PRZYJMUJĘ częściowo.
- Uruchomiono: `evidence/resume-test-mutant-seed4242-summary.json`: `allEqual=false`, `compared=10`, `mutant=true`.
- ODRZUCAM wniosek, że to dowód: baza (bez mutacji) też jest czerwona, więc mutacja nie rozstrzyga niczego. Zielona baza wymaga naprawy normalizacji podziału pracy (zarzut 2). Do tego czasu mutacja jest NIE ROZSTRZYGNIĘTA.

Zarzut 6 (braki metryk względem dispatchu) — PRZYJMUJĘ (NIE ZROBIONE w tej rundzie).
- Brak: `% kary głodu wojska` (jest tylko flaga), utrzymanie samych jednostek (Pieniądz + surowce), przychód/utrata na turę (świadomie w `niezmierzone`). Nie dodano, bo nie zweryfikowałem źródeł tych wartości w grze w tej rundzie. README wymienia te braki.

Zarzut 7 (braki dowodów) — PRZYJMUJĘ (uzupełniono).
- Dodano: `evidence/hook-test.log`; `evidence/seed4242.summary.json` i `seed777.summary.json` (czasy z pliku: 51 s i 52 s, endTurn 100, stop null); JSONL zawiera pole `diag`. Tura 1 nie ma wiersza: runner zapisuje wiersz po każdym endTurn, a stan startowy nie jest mierzony — opisane w README.
- Stare pliki JSONL zostały zastąpione przebiegami na bieżącym kodzie (ta sama procedura, z dodanym `diag`).

Zarzut 8 (README) — PRZYJMUJĘ (naprawione).
- README przepisany: diagnoza podzialPracy poprawiona; sekcja „Test wznowienia" opisuje CZERWONY stan; sekcja „Ograniczenia" opisuje zerowe metryki AI z dowodem `diag`.
- Instrukcji ON/OFF bramki utrzymania armii NIE dopisano: flaga nie istnieje w narzędziu (kod jest w `refs/keep/R-WEB-AI-UPKEEP-Q2-*`, nie w main). README mówi to wprost. Brak instrukcji = cel 5 NIE ZREALIZOWANY.

## TESTY (ZMIERZONE w tym worktree po `git checkout --detach 2579e5b28` i pracy na bieżącym kodzie; liczby z surowego wyjścia)
- `tsc --noEmit`: EXIT 0 (po zmianie w main.ts).
- logic-test: `LOGIC OK (213/213)`, EXIT 0.
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, EXIT 0.
- research-test: `ALL GREEN`, EXIT 0.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT 0.
- combat-test: `All sanity checks passed.`, EXIT 0.
- resource-ledger-hook-gate-test: NIE ISTNIEJE w repo (NIE ZMIERZONO).
- ai-economy-measure-hook-test.cjs: `PODSUMOWANIE 4/5 zielone` — CZERWONE: wartość AI (>=1 miasto), zgodnie z prawdą; EXIT 1.
- resume-test seed 4242 (turns 50, save-at 40): `allEqual=false`, `compared=10` — CZERWONE (kryterium c).
- resume-test mutant: `allEqual=false` (nierozstrzygające, zob. zarzut 5).
- 100 tur, seed 4242: endTurn 100, stop null, gateActiveTurns 0, wallSec 51 (`evidence/seed4242.summary.json`, JSONL 99 wierszy).
- 100 tur, seed 777: endTurn 100, stop null, gateActiveTurns 0, wallSec 52 (`evidence/seed777.summary.json`, JSONL 99 wierszy).
- Tabela (b): seed 4242 | tura końcowa 100 | tury z aktywną bramką NNS gracza 0 | 51 s; seed 777 | 100 | 0 | 52 s. Miasta/jednostki AI w obu: 0.
- `git diff --check`: czysto.

## BLOKADY
1. Zerowe metryki AI: przyczyna w starcie gry (main.ts, ścieżka klastra), poza allowlistą. Wymaga decyzji orkiestratora (poprawka gry vs. zaakceptowanie stanu jako faktu do pomiaru).
2. Kryterium (c): normalizacja `ensureCityPodzialDefaults` przy load (cities.ts ~707-720), poza allowlistą. Wymaga decyzji: poprawka gry albo referencja z zapisem w tej samej sesji.
3. Gałąź bramki NNS nie wystąpiła — NIE ZMIERZONO.
4. Brakujące metryki (kara głodu, utrzymanie jednostek, przychód/utrata) — NIE ZROBIONE.
5. Instrukcja #415 — NIE ZREALIZOWANA (flagi nie ma w main).

## UWAGI-DLA-ORKIESTRATORA
- W worktree leżą nieśledzone pliki innego tematu (`dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1/`, `gra/tools/live-verify-battle-after-full-move-measure.cjs`). Nie są mojego tematu; nie dodawano ich do commita.
- Wpływ na decyzje: AI nie zakłada miast w harnessie — jeśli to wada startu gry, dotyczy też pomiaru #415 i #418 (t57 timeout) i może być ta sama przyczyna; to hipoteza, NIE ZMIERZONO.

NASTĘPNY KROK: decyzja orkiestratora (poprawka gry w cities.ts i ścieżce startu AI osobnym tematem gry, albo akceptacja stanu i zmiana kryteriów) → dopiero potem Evaluator r3.
RUNDY: obrona r2 (Operator r1 = 2579e5b28; Evaluator r1 = 4a3cebdc7; limit 5).
DEPLOY/PUSH: NIE WYKONANO
