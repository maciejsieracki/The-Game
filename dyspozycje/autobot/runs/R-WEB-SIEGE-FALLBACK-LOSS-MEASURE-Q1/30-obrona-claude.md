# R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1 — raport Obrony (runda 1/5, odpowiedź na zarzuty Evaluatora)

STATUS: DECISION_REQUIRED (zarzuty 1, 2, 4 przyjęte i naprawione z dowodem; zarzut 3 przyjęty jako FAKT: tryb AUTO 1x nadal NIE_ZMIERZONO, cel GOAL w tej części NIE spełniony — wymaga decyzji właściciela/orkiestratora)
DOMAIN: GAME (pomiar; zero zmian w gra/src)
TEMAT: R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1
GOAL: zmierzyć, czy _skipInstantFallback (atakujący), SKIP i AUTO 1x dają inne straty i zwycięzcę w oblężeniu (z wyłomem / bez; 3 ziarna).
BAZA: 6b160c380 (kandydat Operatora r1; rodzic origin/main b4853c8e6). Worktree przełączony `git checkout --detach 6b160c380`. Gałąź nie była zmieniana.

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — straty fallbacku z rosteru to artefakt: PRZYJMUJĘ (fakt potwierdzony w kodzie)
- Dowód w kodzie: `_skipInstantFallback` (gra/src/battle/battleScene.ts:3733-3766) NIE mutuje `this.atk/this.def`; wynik `computeInstantResult` trafia do `this._endSurvivors = result.survivors` (linia 3764). `computeInstantResult` (battleScene.ts:20633+) buduje `atkState/defState` z `ru`/`hp` i nie zapisuje do `bu`; ocalali to `survivorsA/D` (kopie `{...u.ru.bu, hp}`). Stąd stare wpisy `0/39/4188` = HP i stan sprzed walki (4188 = suma HP rosteru), nie straty.
- Poprawka (commit tego raportu): driver w trybie `fallback` przypisuje straty z `_endSurvivors` (zob. `gra/tools/measure-siege-fallback-vs-skip-auto.cjs`, blok `if (mode === 'fallback')`). Bitwa oblężenia = `isCityDefenseBattle` (battleScene.ts:2758 `opts.siege != null`), a `computeInstantResult` zwraca ocalałych TYLKO zwycięzcy (`survivors = isCityDefense ? (winner === 'atakujacy' ? survivorsA : survivorsD) : [...]`). Przegrany ma więc 0 ocalałych w wyniku. Driver zapisuje `endSurv.city` i rzuca błąd, gdy tryb nie jest miejski.
- Sprawdzenie: nowe wiersze fallback mają `"src":"endSurvivors"` i niezerowe straty (zob. tabela niżej). Stare wiersze fallback (v1) zachowane poza repo: `scratchpad/msf/rows-v1-operator.jsonl` (ścieżka: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/msf/rows-v1-operator.jsonl), usunięte z `rows.jsonl` i zastąpione 6 nowymi przebiegami.

### Zarzut 2 — wniosek 2 (fallback niezależny od ziarna) i endLine=null: PRZYJMUJĘ
- Dane potwierdzają zależność od ziarna: breach ziarno 1 = atakujący, ziarna 2 i 3 = obrońca (nowe wiersze); nobreach = obrońca we wszystkich 3 ziarnach. Wniosek 2 z Operatora r1 jest FAŁSZYWY i wycofany. Fallback NIE jest stałą regułą; wynik zależy od `Math.random` przez `resolveCombat` (rozstrzygnięcie symulacyjne, nie wyliczenie).
- Poprawka endLine: regex w driverze to `/PAT|SZTURM|Natychmiastowy wynik/` (nowe wiersze fallback mają endLine = "=== Natychmiastowy wynik: ... ===").

### Zarzut 3 — macierz niekompletna, AUTO 1x nie zmierzony: PRZYJMUJĘ jako fakt; NIE NAPRAWIONE w tym temacie
- Fakt: AUTO 1x = 0 z 6 komórek zmierzonych (breach/1: timeout na turze 60, vNow 1 548 784 ms, 500 s; pozostałe 5 nie uruchomione). Pomiar w tabeli = NIE_ZMIERZONO (uczciwie).
- Dlaczego nie da się dowieźć w tym temacie: (a) pełny przebieg AUTO 1x do końca bitwy to ok. 400 tur; tempo z przebiegu timeoutowego to ok. 60 tur na 500 s, czyli ok. 50 min, przy limicie 590 s na jedno wywołanie Bash; (b) scenariusz nobreach (limit 150 tur) to szacunkowo ok. 1 250 s, też ponad limit jednego wywołania; (c) przebieg przerwany limitem zamyka stronę Chromium i traci postęp (`runOne` → `page.close()`), a driver pomija tylko przebiegi zakończone, więc każdy kolejny przebieg AUTO startuje od zera; (d) przyspieszenie (zmiana dt/prędkości) zmieniłoby warunki pomiaru — tego nie robiłem (sprzeczne z dispatchem i z uwagą Operatora r1).
- Naprawa wymagałaby albo wznawialnego runnera wewnątrz procesu bez limitu wywołania (sprzeczne z zasadą „jedno Bash w pierwszym planie ≤590 s”), albo zgody właściciela na inne warunki pomiaru z dowodem równoważności. To jest decyzja, nie poprawka.
- Korekta dokumentacji drivera: nagłówek `MSF_OUT` mówi teraz wprost, że wznawiane są tylko pary zakończone, a przebieg przerwany limitem startuje od nowa.

### Zarzut 4 — „18 wierszy” i reprezentatywność fallbacku: PRZYJMUJĘ obie części
- Liczba: `rows.jsonl` ma 13 linii (7 wierszy skip/auto + 6 fallback po poprawce; w tym 1 timeout AUTO). Liczba „18” dotyczyła komórek tabeli (18 = 2 scenariusze × 3 ziarna × 3 tryby), nie wierszy. Wpis w raporcie Operatora r1 był błędny.
- Reprezentatywność (dowód w kodzie): w grze `skip()` podczas rozstawiania wywołuje `_endDeployPhase()` (battleScene.ts:17555-17568), które ustawia `deployPhase=false` i wywołuje `_startBattle()` (`started=true`). Ścieżka `_skipInstantFallback` (`if (!this.started)`, linia 3709) jest więc osiągalna tylko, gdy `skip()` zostanie wywołane przy `deployPhase=false` i `started=false`, czyli w trybie `fallback` wymuszonym przez driver. NIE ZNALAZŁEM w kodzie ani w driverze dowodu, że gra UI doprowadza do tego stanu. Realny „Pomiń” w rozstawianiu to tryb `skip` w tym pomiarze. Wniosek: „fallback” jest pomiarem ścieżki wymuszonej, nie zmierzonej realnej ścieżki UI.

## ZMIANY-COMMIT (allowlista)
- ZMIENIONE `gra/tools/measure-siege-fallback-vs-skip-auto.cjs` (poza wpisem „+ entry”; zero gra/src, JSON, WERSJE.md, rust-port): fallback z `_endSurvivors` + pole `endSurv` + `src` + endLine regex + poprawiony nagłówek.
- ZMIENIONE `dyspozycje/autobot/runs/R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1/rows.jsonl`: usunięte 6 wierszy fallback v1, dopisane 6 wierszy fallback v2 (kolejność: breach 1-3, nobreach 1-3). 13 linii.
- ZMIENIONE `.../tabela.txt`: wygenerowane `MSF_TABLE=1` z nowego rows.jsonl.
- NOWE ten raport `.../30-obrona-claude.md`.
- Uwaga procesowa: dispatch każe commitować „tylko ten plik”. Poprawka zarzutu 1 i 2 wymaga zmiany drivera i danych, więc commit obejmuje 4 pliki, wszystkie w allowliście (gra/tools/measure-…cjs i dyspozycje/…/runs/R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1/**). Commit zrobiony przez `git add <ścieżki>`, bez `-A`.
- Nie zmieniano `gra/src`. `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` (bez build/dev), nie są śledzone.

## WYNIKI (surowe, z tabela.txt po poprawce; ten sam commit driver, Chromium /usr/bin/chromium, Vite build poza repo)

Legenda: strat/zywi/HP. Fallback: straty = różnica względem stanu początkowego, żywi/HP = ocalali zwycięzcy z `_endSurvivors` (przegrany = 0). SKIP/AUTO: straty/żywi/HP z rosteru (`_sideEndStats`) po zakończeniu.

```
scenariusz | ziarno | tryb     | zwyciezca | tura | wylom | atk strat/zywi/HP | def strat/zywi/HP | status
breach     | 1       | fallback | atakujacy | 0    | tak   | 28/11/991         | 28/0/0            | OK
breach     | 1       | skip     | obronca   | 400  | tak   | 26/13/2656        | 11/17/738         | OK
breach     | 1       | auto     | -         | r60  | -     | -                 | -                 | NIE_ZMIERZONO (limit czasu, vNow 1548784 ms)
breach     | 2       | fallback | obronca   | 0    | tak   | 39/0/0            | 16/12/585         | OK
breach     | 2       | skip     | obronca   | 400  | tak   | 26/13/2641        | 11/17/777         | OK
breach     | 2       | auto     | -         | -    | -     | -                 | -                 | NIE_ZMIERZONO (brak przebiegu)
breach     | 3       | fallback | obronca   | 0    | tak   | 39/0/0            | 10/18/845         | OK
breach     | 3       | skip     | obronca   | 400  | tak   | 26/13/2655        | 12/16/721         | OK
breach     | 3       | auto     | -         | -    | -     | -                 | -                 | NIE_ZMIERZONO (brak przebiegu)
nobreach   | 1       | fallback | obronca   | 0    | nie   | 28/0/0            | 22/6/99           | OK
nobreach   | 1       | skip     | remis     | 150  | nie   | 0/28/988          | 0/28/1008         | OK
nobreach   | 1       | auto     | -         | -    | -     | -                 | -                 | NIE_ZMIERZONO (brak przebiegu)
nobreach   | 2       | fallback | obronca   | 0    | nie   | 28/0/0            | 13/15/478         | OK
nobreach   | 2       | skip     | remis     | 150  | nie   | 0/28/988          | 0/28/1008         | OK
nobreach   | 2       | auto     | -         | -    | -     | -                 | -                 | NIE_ZMIERZONO (brak przebiegu)
nobreach   | 3       | fallback | obronca   | 0    | nie   | 28/0/0            | 12/16/497         | OK
nobreach   | 3       | skip     | remis     | 150  | nie   | 0/28/988          | 0/28/1008         | OK
nobreach   | 3       | auto     | -         | -    | -     | -                 | -                 | NIE_ZMIERZONO (brak przebiegu)
```

Uwaga: wiersze „auto” z „brak przebiegu” w tabeli wynikają z tego, że w tym temacie nie uruchomiono AUTO poza jednym przerwanym timeoutem (zob. zarzut 3).

Wniosek z liczb (bez interpretacji ponad dane):
1. Fallback i SKIP różnią się wyraźnie w scenariuszu z wyłomem: fallback kończy w turze 0 z wynikiem zależnym od ziarna (atakujący wygrywa ziarno 1; obrońca ziarna 2-3, straty atakującego 28-39 jednostek), SKIP przewija do tury 400 (PAT), obie strony żywe (atakujący 13 żywych, obrońca 16-17 żywych wg rosteru (def 17/17/16 w SKIP)).
2. Bez wyłomu fallback daje obrońcę po stracie 12-22 jednostek obrońcy i 28 jednostek atakującego; SKIP daje remis po 150 turach bez strat. Rozjazd zwycięzcy (obrońca vs remis) jest realny.
3. Definicje strat nie są identyczne: fallback (miejski) zeruje ocalałych przegranego, SKIP/PAT zostawia żywych na rosterze. Porównanie liczbowe fallback–SKIP wymaga decyzji, którą definicję uznać za właściwą. Ten pomiar tego nie rozstrzyga.
4. Stabilność SKIP między ziarnami: zwycięzca PAT w scenariuszu z wyłomem (obrońca) i straty atakującego 26 w każdym ziarnie; straty obrońcy 11-12.

## TESTY / BRAMKI (liczby z surowego wyjścia)
- `node --check gra/tools/measure-siege-fallback-vs-skip-auto.cjs` → SYNTAX_OK (po obu edycjach).
- `npm ci --ignore-scripts` w gra/ → exit 0 (log tylko w scratchpad, nie w repo).
- Pomiar fallback (nowy driver, `MSF_MODES=fallback`, 6 przebiegów): wszystkie `error` brak (`errors: []`), exit 0, log: scratchpad/msf/run-fallback.log.
- `MSF_TABLE=1` → tabela 19 linii (nagłówek + 18 komórek), zapisana w tabela.txt.
- `git diff --check` → exit 0 (przed commitem; zob. wynik w sekcji poniżej).
- Bramki gra/ (tsc, logic-test itd.) NIE uruchamiane w tym temacie: zmiana dotyczy wyłącznie skryptu w gra/tools (nie jest częścią bundla); zero zmian w gra/src. Ryzyko regresji: brak.

## BLOKADY
- AUTO 1x: 0 z 6 komórek zmierzonych (zob. zarzut 3, dowód czasowy). Nie da się dowieźć w jednym wywołaniu ≤590 s bez zmiany warunków pomiaru.
- Fallback jest ścieżką wymuszoną w driverze (zob. zarzut 4); nie zmierzono, czy UI może do niej dojść.

## ZAŁOŻENIA (luki rozstrzygnięte założeniem)
- Zwycięzca w bitwie miejskiej zachowuje ocalałych, przegrany ma 0 ocalałych (kod `computeInstantResult`, gałąź `isCityDefense`). Założenie: `isCityDefenseBattle` = true dla scenariusza oblężenia (`opts.siege != null`, battleScene.ts:2758); driver to sprawdza i rzuca błąd, gdy jest false.
- Straty fallbacku liczone względem stanu początkowego: `total` = długość rosteru na początku (przed fallbackiem).

## RUNDY
Obrona r1 (odpowiedź na Evaluator r1). Limit 5 nie przekroczony.

## NASTĘPNY KROK
DECYZJA ORKIESTRATORA/WŁAŚCICIELA (przed kolejną rundą Evaluatora):
1. Czy zamknąć temat z AUTO NIE_ZMIERZONO jako udokumentowanym ograniczeniem (i wpisać osobny temat „wznawialny runner AUTO w obrębie procesu” albo zgodę na tryb przyspieszony z dowodem równoważności), czy wymagać AUTO w tym temacie (wtedy nie da się w limicie 590 s/Bash).
2. Wybór definicji strat dla porównania fallback–SKIP (ocalali na rosterze vs ocalali zwycięzcy wg `computeInstantResult`) przed ABC o ujednoliceniu.
3. Ustalić, czy ścieżka `_skipInstantFallback` jest osiągalna w grze (skip przy `started=false`) — to decyduje, czy wynik fallback dotyczy realnej gry.

DEPLOY/PUSH: NIE WYKONANO
