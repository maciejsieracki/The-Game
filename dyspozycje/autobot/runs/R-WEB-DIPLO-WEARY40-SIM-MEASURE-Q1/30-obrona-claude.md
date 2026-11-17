# R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1 — obrona Operatora (runda 1c, Haiku) — odpowiedź na zarzuty Evaluatora

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar i narzędzie; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1
GOAL: odpowiedzieć na każdy zarzut Evaluatora (PRZYJMUJĘ z poprawką i dowodem albo ODRZUCAM z dowodem) i domknąć luki pomiaru bez zmiany kodu gry.
BAZA: 2aeacc45e (kandydat Evaluatora; zawiera 035f313c2 i bbaa74fd8).
ZAKRES: gra/tools/weary40-sim-measure.cjs; runs/R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1/{10-operator-claude.md, raw-K3-N3-T150.jsonl, raw-K6-N3-T150.jsonl, 30-obrona-claude.md}.

## Zarzut 1 (niska) — „Śr. czas wojny” NIE ZWERYFIKOWANE z raw — PRZYJMUJĘ

Poprawka: narzędzie zapisuje teraz przy każdym zdarzeniu pokoju `warTurns` (tura pokoju − tura startu wojny, start = `warStart` zmierzony PRZED tickiem, bo `finalize` kasuje wpis w trakcie ticka) oraz w podsumowaniu `avgWarTurns` i `maxWarTurns`. Pole `durations` w kodzie było liczone z `e.turn`, a nie z czasu wojny; teraz używa `warTurns`.

Dowód (ponowny pełny przebieg 150×3×2 dla K=3 i K=6; liczby z surowego wyjścia `new-K*.jsonl`, przeliczone skryptem z pól `warTurns` zdarzeń):
- K=3 PO: 31 pokojów, średnia 30,77, max 39 (zgodne z zarzutem: 30,77).
- K=3 PRZED: 23 pokoje, średnia 10,43, max 27.
- K=6 PO: 31 pokojów, średnia 20,16, max 39.
- K=6 PRZED: 30 pokojów, średnia 10,30, max 33.
Tabele §2a/§2b w 10-operator-claude.md zgodne (30,8/39; 10,4/27; 20,2/39; 10,3/33). Definicja w raporcie: tura pokoju minus tura startu wojny.

Porównanie z committed raw (cmp po usunięciu `avgTurnMs` oraz nowych pól `warTurns`, `ownCitiesBefore`, `loserShareBefore`, `avgWarTurns`, `maxWarTurns`): K=3 — 12 wierszy = 12 wierszy, IDENTYCZNE; K=6 — 12 = 12, IDENTYCZNE. Oznacza to, że pozostałe wyniki nie zmieniły się, a zmiana jest czysto addytywna.

## Zarzut 2 (średnia) — „ten sam przypadek co §3” (K=6) bez pokrycia danymi — PRZYJMUJĘ

Raw nie zapisywał liczby miast przegrywającego ani udziału w chwili pokoju. Dodano pola `ownCitiesBefore` i `loserShareBefore` (migawka PRZED tickiem).

Dowód dla zdarzeń wymuszonych:
- K=3 PO: 17 z 17 ma `ownCitiesBefore = 3` (= minMiastPoOddaniu), więc cityCap = 3 − 3 = 0; `loserShareBefore` 0,167–0,200 (poniżej udzialWyraznie = 0,45); `priceZero = false` we wszystkich.
- K=6 PO: 2 z 2 mają `ownCitiesBefore = 3`, cityCap = 0; `loserShareBefore` 0,083 i 0,100; `priceZero = false`.
Wniosek: przyczyną w obu wariantach jest wyłącznie cityCap = 0. Przypadki „cena 0” i „brak wyraźnie przegrywającego” nie wystąpiły (0 zdarzeń). Zdanie „ten sam przypadek co §3” jest teraz poparte danymi. Uwaga: w K=6 przegrywający startuje z 6 miastami i w chwili pokoju ma 3, więc utracił je w wojnie.

Realna częstość w grze: NIE ZMIERZONO (zapisano w §5 raportu). W K=3 cityCap = 0 wynika z konstrukcji scenariusza (3 miasta na cywilizację).

## Zarzut 3 (średnia) — wariant A: „w K=3 większość pokojów przeszłaby na odroczenie” bez pokrycia — PRZYJMUJĘ

Zdanie o odroczeniu usunięto z §3 i zastąpiono oznaczeniem NIE ZMIERZONO: narzędzie nie ma przełącznika wariantu bez wymuszonego pokoju przy cityCap = 0, a w kodzie nie ma mechanizmu odroczenia poza `battlePending`. Dodano też osobną pozycję w §5 dla wariantu A.

## Zarzut 4 (niska) — sprzeczność w dokumentacji zgłoszona przez Evaluatora — PRZYJMUJĘ

Potwierdzono w kodzie:
- gra/src/game/war-weariness.ts:265 (JSDoc): „Pokój wymuszony jest ZAWSZE płatny miastami przegrywającego”.
- gra/src/game/war-weariness.ts:302 (komentarz inline): „Brak wyraźnie przegrywającego albo cena 0 → pokój BEZ miast”.
- gra/data/war-weariness-params.json:10 (`_progi`): „zawsze platny miastami”.
- gra/data/war-weariness-params.json:14 (`_wzor`): limit efektywny = min(…, miasta − minMiastPoOddaniu), 0 miast gdy battlePending.
Raport §3 cytuje teraz obie grupy i rozdziela przyczyny (cityCap = 0 vs cena 0 vs brak wyraźnej przewagi). Wariant B wymaga ujednolicenia tych komentarzy, a nie tylko wpisu w Civpedii. Zapisano to w raporcie.

## Zarzut 5 (kosmetyczna) — niespójności w raporcie — PRZYJMUJĘ

- §0 „symlink usunięty” zmienione na: symlink gra/node_modules nie jest w commicie (untracked, sprzątanie orkiestratora). Symlink nadal istnieje w worktree; `git status` go nie pokazuje (ignorowany przez node_modules).
- §0b i BLOKADY zsynchronizowane z tym stanem.
- Zdanie „Rekomendacja Operatora: B” usunięto. Dispatch wymagał dwóch wariantów do decyzji, a raport ma je przedstawić bez wyboru.

## Weryfikacja końcowa

- Smoke `node tools/weary40-sim-measure.cjs --turns 30 --seeds 1 --variant both`: exit 0 (wyjście 4 linie).
- Pełny przebieg K=3 i K=6 (150×3×2): exit 0, 22,7 s każdy.
- `git diff --check`: exit 0 (czysto).
- Kontrola allowlisty: zmiany tylko w gra/tools/weary40-sim-measure.cjs i w runs/R-WEB-DIPLO-WEARY40-SIM-MEASURE-Q1/. Zero zmian w gra/src i gra/data.

## Stan decyzji (bez zmian)

Wariant A albo B z §3 raportu wybiera właściciel. Kod gry pozostaje bez zmian.

ZMIANY-COMMIT: gra/tools/weary40-sim-measure.cjs (pola warTurns, ownCitiesBefore, loserShareBefore, avgWarTurns, maxWarTurns); raw-K3-N3-T150.jsonl i raw-K6-N3-T150.jsonl (ponowny przebieg, nowe pola, reszta identyczna); 10-operator-claude.md (korekty); 30-obrona-claude.md (ten plik). Commit tylko tymi ścieżkami, bez git add -A.
TESTY: smoke exit 0; K=3 i K=6 exit 0; cmp z raw IDENTYCZNE po usunięciu nowych pól i avgTurnMs (12=12 wierszy każdy); git diff --check czysto. Bramki gry (npm run build/dev, tsc) nie uruchamiane — zgodnie z allowlistą (zmiany tylko w gra/tools).
BLOKADY: brak.
RUNDY: 1c (obrona), po 1 rundzie Operatora r1b.
NASTĘPNY KROK: integracja i decyzja właściciela w sprawie §3 (A/B). Evaluator ponowna weryfikacja tych poprawek.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- gra/node_modules w worktree to dowiązanie do katalogu w scratchpadzie (esbuild@0.28.2 i three@0.169.0 zainstalowane poza repo); nie ma w commicie. Do usunięcia przez orkiestratora razem z worktree.
- Dispatch wymaga dopisania smoke-testu do listy deployu; w repo nie znaleziono takiego pliku (bez zmian względem r1, patrz 10-operator-claude.md §0).
