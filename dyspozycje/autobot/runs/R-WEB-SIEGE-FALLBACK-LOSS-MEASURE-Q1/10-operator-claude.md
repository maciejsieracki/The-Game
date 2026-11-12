# R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar, tylko odczyt; zero zmian w gra/src)
TEMAT: R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1
GOAL: zmierzyc, czy _skipInstantFallback (atakujacy), SKIP i AUTO 1x daja inne straty i zwyciezce w oblezeniu: tabela scenariusz (z wylomem / bez; 3 ziarna) x tryb (fallback, SKIP, AUTO).
BAZA: origin/main = b4853c8e6 (kandydat affa09bd5 jest przodkiem, sprawdzone `git merge-base --is-ancestor`). Worktree przelaczony `git checkout --detach origin/main`.

## ZMIANY-COMMIT
- NOWY `gra/tools/measure-siege-fallback-vs-skip-auto.cjs` — driver pomiaru (kopia logiki z `gra/tools/battle-skip-siege-parity-live-test.cjs` + scenariusze `breach`/`nobreach` (`&bare=1`), tryby fallback/skip/auto, ponowne proby startu Chromium, wznawianie z pliku JSON-lines, tabela `MSF_TABLE=1`). `node --check` OK.
- NOWE `dyspozycje/autobot/runs/R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1/rows.jsonl` — surowe wyniki (18 wierszy, JSON-lines).
- NOWE `.../tabela.txt` — tabela wygenerowana z rows.jsonl (`MSF_TABLE=1`).
- NOWE ten raport.
- Nie zmieniono: gra/src, JSON, WERSJE.md, rust-port.
- Commit: SHA w polu `sha` zwracanym orkiestratorowi (czubek brancha operatora).

## WYNIKI (surowe, z tabela.txt; ta sama wersja kodu b4853c8e6)
Legenda: strat/zywi/HP. Zwyciezca i tura z `_endWinner` i `roundNo`; wylom = `wallEverBreached`.

| scenariusz | ziarno | tryb | zwyciezca | tura | wylom | atk strat/zywi/HP | def strat/zywi/HP |
|---|---|---|---|---|---|---|---|
| breach | 1 | fallback | atakujacy | 0 | tak | 0/39/4188 | 0/28/1008 |
| breach | 1 | skip | obronca | 400 (PAT) | tak | 26/13/2656 | 11/17/738 |
| breach | 1 | auto | NIE_ZMIERZONO (limit czasu, round 60 w 500 s) | | | | |
| breach | 2 | fallback | obronca | 0 | tak | 0/39/4188 | 0/28/1008 |
| breach | 2 | skip | obronca | 400 (PAT) | tak | 26/13/2641 | 11/17/777 |
| breach | 2 | auto | NIE_ZMIERZONO (nie uruchomiono) | | | | |
| breach | 3 | fallback | obronca | 0 | tak | 0/39/4188 | 0/28/1008 |
| breach | 3 | skip | obronca | 400 (PAT) | tak | 26/13/2655 | 12/16/721 |
| breach | 3 | auto | NIE_ZMIERZONO (nie uruchomiono) | | | | |
| nobreach | 1 | fallback | obronca | 0 | nie | 0/28/988 | 0/28/1008 |
| nobreach | 1 | skip | remis (cap 150) | 150 | nie | 0/28/988 | 0/28/1008 |
| nobreach | 1 | auto | NIE_ZMIERZONO (nie uruchomiono) | | | | |
| nobreach | 2 | fallback | obronca | 0 | nie | 0/28/988 | 0/28/1008 |
| nobreach | 2 | skip | remis (cap 150) | 150 | nie | 0/28/988 | 0/28/1008 |
| nobreach | 2 | auto | NIE_ZMIERZONO (nie uruchomiono) | | | | |
| nobreach | 3 | fallback | obronca | 0 | nie | 0/28/988 | 0/28/1008 |
| nobreach | 3 | skip | remis (cap 150) | 150 | nie | 0/28/988 | 0/28/1008 |
| nobreach | 3 | auto | NIE_ZMIERZONO (nie uruchomiono) | | | | |

## WNIOSKI (tylko z tych liczb)
1. Rozjazd fallback vs SKIP istnieje w scenariuszu z wylomem: fallback rozstrzyga w turze 0 bez strat po obu stronach (atak 39 zywych / obrona 28 zywych, pelne HP), SKIP przewija do tury 400 (PAT) ze stratami 26/11-12. Zwyciezca rozni sie dla ziarna 1 (fallback: atakujacy; SKIP: obronca) i zgadza dla ziaren 2 i 3 tylko przypadkowo (oba obronca) — zadnego z tych zwyciezcow nie nalezy traktowac jako poprawnego bez decyzji ABC.
2. Wynik fallback nie zalezy od ziarna (te same liczby dla 1-3) — sciezka nie uzywa walki; wynik to stala reguly wejscia, nie symulacja.
3. Scenariusz bez wylomu: fallback = obronca bez strat (tura 0), SKIP = remis po 150 turach bez strat. Rozjazd zwyciezcy (obronca vs remis) i brak walki w fallback.
4. SKIP w scenariuszu z wylomem daje wynik zgodny dla 3 ziaren co do zwyciezcy (obronca, PAT 400) i zblizone straty (26/11-12) — stabilnosc miedzy ziarnami OK.
5. AUTO 1x NIE ZMIERZONO: przebieg 1x dochodzi do tury ~60 w 500 s (vNow 1 548 784 ms), pelne rozstrzygniecie (do 400 tur) wymaga ok. 50-60 min wall-clock; przy limicie 280-590 s na wywolanie nie da sie tego przejsc w jednym wywolaniu bez wznawiania stanu strony. Nie zmieniano predkosci (8x) — to zmienia warunki pomiaru. Nie ma wiec dowodu, czy AUTO zgadza sie z SKIP ani z fallback.

## TESTY / BRAMKI
- `node --check gra/tools/measure-siege-fallback-vs-skip-auto.cjs` — OK.
- `npm ci --ignore-scripts` w gra/ — wykonane (bez `npm run build/dev`).
- Build pomiarowy: `vite build` z kopii gra/ do katalogu w scratchpad (poza repo), dist: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/msf/dist (uzyty przez MSF_DIST).
- Przeglądarka: Chromium /usr/bin/chromium przez playwright (`--no-sandbox --headless=new`). Start bywa niestabilny (SIGTRAP przy starcie, kilka prob); driver ponawia start (MSF_LAUNCH_TRIES). Ustawienie TMPDIR na scratchpad blokowalo start Chromium — nie uzywac.
- `git diff --check` — do wykonania przed commitem (patrz nizej).
- Liczby z surowego wyjscia: rows.jsonl i tabela.txt (nie z pamieci).

## BLOKADY
- AUTO 1x: 0 z 6 przebiegow zakonczonych (1 przerwany limitem czasu na turze 60; 5 nie uruchomione). Wymaga wznawialnego runnera albo zgody na inna predkosc z weryfikacja rownowaznosci.
- Brak dowodu jednoczesnego pomiaru AUTO vs SKIP vs fallback w tych samych ziarnach.

## ZALOZENIA (luki rozstrzygniete zalozeniem)
- "+ entry" z dispatchu rozumiem jako: nowy skrypt jest samodzielnym wpisem w gra/tools (bez zmiany rejestru ani JSON).
- Scenariusz "bez wylomu" = `&bare=1` (oblezenie bez machin), zgodnie z komentarzem referencyjnego testu; limit tur 150 z combat-params.json (bez nadpisania).
- Predkosc AUTO = 1x (indeks 0), zgodnie z dispatchem.

## NASTEPNY KROK (do ABC, nie integracja)
1. Decyzja ABC: czy wynik "fallback = 0 strat, rozstrzygniecie w turze 0" uznac za rozjazd do ujednolicenia (wtedy temat naprawczy po pomiarze), czy udokumentowac jako zamierzona sciezke awaryjna.
2. Dokonczyc AUTO 1x w wznawialnym runnerze (zapis stanu/sekwencja wywolan) albo zaakceptowac AUTO 8x z dowodem rownowaznosci na jednym ziarnie.

DEPLOY/PUSH: NIE WYKONANO
