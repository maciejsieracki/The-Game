STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DOCS-JSON-DESCRIPTIONS-SYNC-Q1 (zadanie #371), obrona Operatora po rundzie 1 Evaluatora
GOAL: opisy (pola `_*`) w gra/data/war-weariness-params.json i gra/data/diplomacy-tick-params.json zgodne z kodem, bez zmiany ŻADNEJ wartości nie-opisowej.
BAZA: f196422ef (origin/main); KANDYDAT Evaluatora: a8c45958c; SHA obrony (poprawki): 31711b690 (pełny: 31711b6907308b64fc97367f6de3f0cb484f2ee8); raport: ten plik, commit w osobnym kroku.

ZMIANY/COMMIT:
- 31711b690 (poprawka 1-2, test c10): gra/data/diplomacy-tick-params.json, gra/data/war-weariness-params.json, gra/tools/json-descriptions-sync-test.cjs. Diff względem a8c45958c: 21 wstawień, 2 usunięcia. Wartości nie-opisowe bez zmian (test a1 zielony).

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Zarzut 1 (diplomacy-tick-params.json, p6._uwagaKryzysTurDoWojny twierdzi "Realnie obowiazuje N=6"): PRZYJMUJĘ.
- Dowód: diplomacy-war-peace-profile.ts:130-143 (profil BEZ wiersza macierzy, hasData=false): hamulecN = clamp(round(8 - 0,5*5), 3, 7) = 6. Ten wzór NIE dotyczy cywilizacji z wierszem macierzy.
- Dowód: diplomacy-war-peace-profile.ts:188 (profil z wierszem): hamulecN = clamp(round(bazaN - wagaProgWojny*dipProg), minN, maxN), dipProg = p['dip_prog_wojny'] ?? 5. Dane: gra/data/diplomacy-war-peace-params.json hamulecRelacji: bazaN 8, wagaProgWojny 0,5, minN 3, maxN 7.
- Dowód: gra/data/civ-matrix.json, 15 wierszy, dip_prog_wojny = 2,2,3,3,4,4,4,4,5,5,6,6,6,8,9,9 (wiersze 2-9). Przeliczone na N (JS Math.round): zakres 4-7 (min 4 dla dip 8/9, max 7 dla dip 2/3).
- Dowód: main.ts:11859-11863 (diploBrakeWarParams): dla pary bierze profil strony o WYŻSZYM progWojnyRelacji i jego hamulecN; main.ts:11876 nadpisuje kryzysTurDoWojny: w.n. Jedyne miejsce odczytu kryzysTurDoWojny w gra/src (grep: diplomacy-tick-war-brake.ts:24,112,116 i main.ts:11876); wartość 5 z JSON nie jest używana w grze.
- Poprawka: opis przepisany: "N zalezy od pary, NIE jest stale 6", z trzema przypadkami i liczbami (6 dla profilu bez wiersza; 4-7 dla wierszy macierzy). Wartość 5 NIE zmieniona. Niespójność zostaje do #370.

Zarzut 2 (war-weariness-params.json zmeczenie._wzor: "wojna konczy sie juz przy 0,8" zbyt kategoryczne dla AI->gracz): PRZYJMUJĘ.
- Dowód: ai.ts:7050-7056 (warunek wearinessUnconditionalEndDue(wearyLevel)) wysyła komendę zaproponuj_pokoj z bezwarunkowy: true; komentarz w kodzie: "gracz decyduje sam". Zgodnie z docs/encyklopedia/pojecia/zmeczenie-wojna.md:39.
- Dowód: war-weariness.ts:237-264 (runWarWearinessTick, wywołanie wearinessUnconditionalEndDue(lvl, P) w linii 264): dla pary AI<->AI wojna kończy się pokojem bezwarunkowym przy 0,8, obie strony.
- Poprawka: _wzor mówi teraz: w tickach AI<->AI obie strony (także silniejsza); w wojnie AI->gracz AI tylko PROPONUJE pokój bezwarunkowy, decyzja należy do gracza (ai.ts ok. l.7050); wojna AI<->AI kończy się przy 0,8 (nie przy 100%).

Zarzut 3 (test c1-c8 to grepy tekstowe, c9 tylko obecność kluczy; zarzut 1 przechodził przez test): PRZYJMUJĘ CZĘŚCIOWO.
- Dodany c10 (tools/json-descriptions-sync-test.cjs): liczy N z civ-matrix.json i diplomacy-war-peace-params.json tym samym wzorem co kod i sprawdza, że opis _uwagaKryzysTurDoWojny zawiera "= 6" (profil bez wiersza, clampN(5) === 6) oraz zakres "4-7". Po zmianie zakresu w danych c10 czerwieni test.
- Pozostaje: c1-c8 są świadomie tekstowe (kod gra/src to TypeScript, nieimportowalny z .cjs bez kompilacji). Nie zamieniam ich na testy wykonawcze, bo to poza allowlistą tematu.

Zarzut 4 (DODATEK orkiestratora dla tego tematu nie istnieje w repo; ocena wg 00-dispatch.md): NOTATKA, bez zmian kodu.
- Dowód: git ls-tree origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 dyspozycje/autobot/runs/R-WEB-DOCS-JSON-DESCRIPTIONS-SYNC-Q1/ -> tylko 00-dispatch.md. Na origin/main ani na a8c45958c katalog nie zawiera dispatchu (w a8c45958c jest tylko 10-operator-claude.md). Ocena wg 00-dispatch.md i treści zadania orkiestratora (założenie, bez zmian).

TESTY (liczby z surowego wyjścia, komendy w katalogu gra/):
- json-descriptions-sync-test (node tools/json-descriptions-sync-test.cjs): 19 pass / 0 fail, exit 0 (dawniej 17; +2 z c10). Wszystkie a0, a1 (obie wartości nie-opisowe = f196422ef), b1-b5, c1-c10 PASS.
- JSON: oba pliki parsują się (node JSON.parse: "json ok").
- tsc (npx bez node_modules: TS5101 i brak modułu three; ta sesja nie miała zainstalowanych zależności): po `npm ci --ignore-scripts` (71 pakietów, lock-file): `node_modules/.bin/tsc --noEmit` -> TSC_EXIT=0, 0 linii wyjścia. Bez tej instalacji wynik tsc nie jest miarodajny; to naprawa środowiska, nie zmiana kodu.
- Bramki referencyjne (po zmianie): logic-test LOGIC OK (213/213) exit 0; tech-tree-test 20 pass, 0 fail exit 0; research-test ALL GREEN exit 0; unit-replace-test WSZYSTKIE TESTY ZIELONE (21/21) exit 0; combat-test All sanity checks passed. exit 0.
- Testy czytające oba pliki (grep tools po nazwach plików, 12 plików, wszystkie exit 0): .research-bundle.cjs, .logic-bundle.cjs, diplo-weariness-20-turns-test, diplo-weariness-city-only-test, ai-war-weariness-peace-test, diplo-weariness-unconditional-end-test, diplo-war-declare-zero-trust-test, diplo-tick-war-brake-mutation-test, diplo-peace-ai-ai-nonnegative-test, json-descriptions-sync-test, diplo-civpedia-values-test, diplo-tick-war-brake-unit-test. Liczby z pełnego wyjścia nie były zapisywane osobno; sprawdzono kod wyjścia i brak wierszy "FAIL" z wynikiem niezerowym.
- Uwaga z rundy 1 (diplo-war-peace-main-guard-test, 1 FAIL na bazie f196422ef): nie dotyczy tego tematu, nie uruchamiano ponownie, nie naprawiano.
- git diff --check (cached, przed commitem): czysto (CHECK_OK).

BLOKADY: brak. Zmiana wartości nie-opisowych nie została wykonana (zakaz tematu).

RUNDY: 2/5 (runda 1: Operator; runda 2: obrona). Następny werdykt: Evaluator.

NASTĘPNY KROK: Evaluator weryfikuje poprawki (diplomacy-tick-params.json p6._uwagaKryzysTurDoWojny, war-weariness-params.json zmeczenie._wzor, test c10) i ponownie sprawdza zakres N 4-7 z civ-matrix.json. Pozostałe otwarte do decyzji właściciela (poza tym tematem): #370 (niespójność N: 5 w JSON vs 4-7 w grze, wartość nie zmieniana), flagaDomyslna=false (nieczytane, realna wartość DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT=true).

UWAGI-DLA-ORKIESTRATORA:
- Worktree tematu startował z innej gałęzi (fbafec4b3); przełączono na a8c45958c (detached). Nie tworzono sesji ani zadań.
- node_modules w gra/ zainstalowane tylko do bramki tsc; usuwane po commicie raportu (sprzątanie).

DEPLOY/PUSH: NIE WYKONANO
