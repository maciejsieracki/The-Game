# R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1 — obrona (runda 2, Operator Haiku 5.5)

STATUS: PASS-WITH-NOTES (poprawki wprowadzone; pomiar NIEKOMPLETNY, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1
GOAL: domyslnie ON wszystkie sześć flag dyplomacji (decyzja właściciela 2026-11-19); piny testów, hak pomiaru i komentarze zgodne z tą decyzją; OFF pokryte jawnym hakiem.
BAZA: 73a90368c (kandydat). Czubek pracy: patrz pole sha w StructuredOutput.

## Odpowiedzi na zarzuty

1. **PRZYJMUJĘ.** `DIPLO_HARDER_ENABLED_DEFAULT` było na sztywno `false`, więc flaga z JSON nie działała. Poprawka: `gra/src/game/diplomacy-harder.ts` — stała = `HARDER_PARAMS.twardaDyplomacjaAktywna === true` (źródłem prawdy są dane). Dowód: `node tools/diplomacy-harder-unit-test.cjs` → `PASS 53 FAIL 0`, w tym nowy pin `M.DIPLO_HARDER_ENABLED_DEFAULT === true`.
2. **PRZYJMUJĘ.** Pin `flaga domyslnie OFF` zmieniony na ON (dane); pokrycie OFF zachowane jawnym `setHarderDiplomacyEnabledForTest(false)` i sprawdzeniem powrotu do ON po `null` (`gra/tools/diplomacy-harder-unit-test.cjs`). Pozostałe piny ON/OFF w innych testach były już przepięte w 73a90368c; przepięte dodatkowo nagłówki `diplomacy-alliance-strength-unit-test.cjs` i `diplomacy-zero-trust-unit-test.cjs`.
3. **PRZYJMUJĘ (częściowo naprawione).** Dwie wady haka: (a) `setAll(true)` wymuszał tor NAP (`torAktywny`, spoza pakietu), (b) pomiar był na 75/70 turach zamiast 90 i bez ramienia OFF. Poprawka kodu: hak nie dotyka już toru NAP i ustawia jawne `true/false` dla sześciu flag. Runner `gra/tools/diplomacy-harder-measure-run.cjs` sprawdza teraz tylko pakiet sześciu flag (`PAKIET`), a `napTor` zostaje na wartości z danych (false). Pomiar zrobiony PONOWNIE, ale niepełny (patrz BLOKADY).
4. **PRZYJMUJĘ i naprawiono.** `setAll(false)` podawało `null` (= wartość z danych = ON), więc ramię OFF nie było OFF. Teraz `setAll(on)` podaje `on === true` (jawne false). Dowód: `node tools/diplomacy-all-flags-measure-hook-test.cjs` → `35 zielonych, 0 czerwonych` (dodane: sprawdzenie jawnego bool, brak wywołania setattera NAP, mutacja „v null" musi być czerwona).
5. **PRZYJMUJĘ i naprawiono.** Nieaktualne opisy w danych i kodzie zaktualizowane do stanu ON (tylko komentarze/opisy, bez zmiany wartości poza flagami): `ai-ai-treaty-params.json` (`_uwaga_sojusze`, `_uwaga_koalicja`), `diplomacy-harder-params.json` (`_opis`), `diplomacy-war-limit-params.json` (`opis`), `diplomacy-zero-trust-params.json` (`_uwaga_flaga`), `diplomacy-alliance-war-params.json` (`_uwaga_flaga`); komentarze w `ai-ai-coalition.ts`, `ai-ai-alliance-tick.ts`, `ai-ai-alliance-limit.ts`, `diplomacy-war-limit.ts`, `diplomacy-zero-trust.ts`, `diplomacy-alliance-strength.ts`, `main.ts`. `_uwaga_tor` / `torAktywny` pozostawione jako false (zgodnie z danymi, NAP poza pakietem). Liczba unit-replace: **21/21** (nie 45/0; wynik z tego biegu).

## Zmienione pliki (ZMIANY-COMMIT, allowlista)

- gra/src/game/diplomacy-harder.ts; gra/src/main.ts (hak `__diploAllFlagsMeasure` + komentarze)
- gra/src/game/ai-ai-coalition.ts, ai-ai-alliance-tick.ts, ai-ai-alliance-limit.ts, diplomacy-war-limit.ts, diplomacy-zero-trust.ts, diplomacy-alliance-strength.ts (komentarze)
- gra/data/ai-ai-treaty-params.json, diplomacy-harder-params.json, diplomacy-war-limit-params.json, diplomacy-zero-trust-params.json, diplomacy-alliance-war-params.json (tylko opisy/komentarze; wartości flag bez zmian względem 73a90368c)
- gra/tools/diplomacy-harder-unit-test.cjs, diplomacy-all-flags-measure-hook-test.cjs, diplomacy-harder-measure-run.cjs, diplomacy-alliance-strength-unit-test.cjs, diplomacy-zero-trust-unit-test.cjs
- dyspozycje/autobot/runs/R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1/30-obrona-claude.md, pomiar-ON-seed4242-t2-78-PARTIAL.jsonl.gz

## TESTY (liczby z surowego wyjścia tego biegu)

- `npx tsc --noEmit`: bez błędów (brak wyjścia).
- logic-test: `LOGIC OK (213/213)`
- tech-tree-test: `20 pass, 0 fail`
- research-test: `PASSED: 33 / FAILED: 0`
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test: `COMBAT TEST: 6/6 pass`
- ai-test: `292 passed, 5 failed` — **te same 5 błędów na bazie dc2f0fed0 (eksport gra/ z tej bazy): PRE-EXISTING, nie z tego tematu.** (poziom3 economy>military; T5a, T5b, T5d, T5f canAfford/build)
- diplomacy-harder-unit-test: `PASS 53 FAIL 0`
- diplomacy-alliance-strength-unit-test: `34 OK, 0 FAIL`
- diplomacy-zero-trust-unit-test: `PASS=44 FAIL=0`
- diplomacy-war-limit-unit-test: `pass=57 fail=0`; diplomacy-war-limit-analyze-test: `pass=17 fail=0`
- ai-ai-alliance-tick-test: `suite 19/19 OK; mutants 8/8`; ai-ai-alliance-limit-test: `limit suite OK; mutants 4/4 + wiring 4/4`
- ai-ai-coalition-test: ZIELONE; ai-ai-treaty-nap-wiring-test: ZIELONE
- diplomacy-all-flags-measure-hook-test: `35 zielonych, 0 czerwonych`; diplomacy-harder-measure-hook-test: `14 zielonych, 0 czerwonych`; ai-ai-alliance-measure-hook-test: ZIELONY
- war-rules-multiwar-test: `57 OK / 0 FAIL`
- war-rules-multiwar-main-guard-test: `18 PASS / 3 FAIL` — **identycznie na bazie dc2f0fed0: PRE-EXISTING.**
- ai-ai-treaty-live-proof-breach-test (żywy Chromium, bundle z tego kodu): `Wynik: 12 OK / 0 FAIL`

## POMIAR (ON, domyślne flagi przez hak all-flags=1)

- seed 4242, ON: runner zapisał tury **2–78** (77 wierszy, bez błędów, bez NaN/crashu w logu). Proces zakończył się limitem 580 s polecenia Bash, zanim doszedł do tury 90; brak pliku summary.
- Sojusze AI↔AI: licznik końcowy `sojuszeAiAi: 5`; maks. sojuszy na cywilizację (pary ze statusem `sojusz`) = **2** (w turze 61) — limit 2 nie został przekroczony w zarejestrowanym zakresie.
- Wojny (pole `wojny`): t25 0, t50 4, t75 6, t78 6. Maks. równoległych wojen jednej cywilizacji (z par) = 2.
- Zaufanie sąsiadów (średnia, pary `sasiad`): t25 58,7 (n=2), t50 11,1 (n=15), t75 19,5 (n=17), t78 25,3 (n=18). Uwaga: t50 jest wyraźnie niższe niż w rejestrze (ON 20,9, 3 ziarna, 150 tur) — różne warunki, NIE PORÓWNANO statystycznie.
- Licznik `zerwaniaZeroZaufania` = 18 (zero zaufania działa w runtime, potwierdza efekt, którego analiza nie była liczbowo zweryfikowana).
- Surowy plik: pomiar-ON-seed4242-t2-78-PARTIAL.jsonl.gz (w katalogu tematu).

## BLOKADY

1. Pomiar 90 tur × 2 ziarna × ON/OFF **NIE ZMIERZONO w całości**: jeden przebieg 90 tur trwa ok. 12–14 min, a Bash pierwszego planu ma max 600 s; runner nie wznawia. Ziarno 7 (ON i OFF) i ramię OFF w tej rundzie NIE ZMIERZONO; tury 79–90 NIE ZMIERZONO.
2. Efekt „zero zaufania" w analizie nie zweryfikowany liczbowo (tylko licznik zerwań, patrz wyżej).
3. Pięć błędów `ai-test` i trzy błędy `war-rules-multiwar-main-guard-test` istnieją na bazie — nie są regresją tego tematu.

## UWAGI-DLA-ORKIESTRATORA

- Dla pełnego pomiaru 90 tur potrzebny jest sposób na przebieg dłuższy niż 600 s (wznawianie runnera albo zgoda na tło — decyzja orkiestratora; Operator nie uruchamia w tle).
- Warto rozważyć osobny temat: wznawialny runner pomiaru (zapis stanu + `--resume`).
- Zarejestrowane zaufanie sąsiadów spadło do ~11 w t50 (ON) — przy decyzji o wdrożeniu właściciel powinien to zobaczyć w pełnym pomiarze.

## NASTĘPNY KROK

Final Control na tej rundzie; pełny pomiar 90 tur (seed 4242 i 7, ON i OFF) jako osobny etap, gdy runner będzie mógł przejść przez limit czasu.

DEPLOY/PUSH: NIE WYKONANO
RUNDY: 2/5 (poprzednia runda: 1/5; zarzuty 1–5 w tej rundzie)
