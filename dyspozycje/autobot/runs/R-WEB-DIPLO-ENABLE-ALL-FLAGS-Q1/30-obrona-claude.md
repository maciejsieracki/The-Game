# R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1 — obrona Operatora (runda 3, Haiku 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1
GOAL: odpowiedź na cztery zarzuty Evaluatora (raport 552aef709471ba698e66fc62b34415174f824e86) dla kandydata 9ea323ad07bea201bbadbf91c4b16f324aae887b; dowody z surowego wyjścia.
BAZA: 9ea323ad07bea201bbadbf91c4b16f324aae887b (checkout --detach). Brak zmian w kodzie gry i w testach w tej rundzie; commit zawiera tylko ten raport.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (wyjaśnienie zakresu, bez zmiany kodu). Usunięcie `setAiAiTreatyTickEnabledForTest` z `setAll` jest ZAMIERZONE i zgodne z dispatchem: pakiet to SEST flag (harder, tor sojuszy, koalicja, zero zaufania, siła sojuszu, limit wojen). Tor NAP AI↔AI (`torAktywny`, dane false) NIE jest w pakiecie. Potwierdzenie na żywo: `diplomacy-harder-measure-run.cjs` odczyt `flagi` = `{"harder":true,"napTor":false,"sojuszTor":true,"koalicja":true,"zeroZaufania":true,"wojnaSilaSojuszu":true,"limitWojen":true}`. Wcześniejsze pliki `pomiar-ON-*` w run-dir powstały na r1 hooku, który wymuszał `napTor=true`; NIE są porównywalne 1:1 z obecną konfiguracją domyślną. Dane OFF→ON z rejestru (3 ziarna × 150 tur) należy w rejestrze opisać z tym zastrzeżeniem. Ewentualna zmiana napTor to decyzja właściciela, nie Operatora.
2. PRZYJMUJĘ i ZWERYFIKOWANO NA ŻYWO. Bundle zbudowany POZA repo (`vite build --outDir <scratchpad>/bundle-r2`, exit 0, 26,45 s). Test uruchomiony: `node gra/tools/ai-ai-treaty-live-proof-breach-test.cjs <bundle-r2>` (argument pozycyjny DIST; zmienna DIST nie działa) → `Wynik: 12 OK / 0 FAIL -> /tmp/breach-proof-13273.json`, A6 zero pageerror/console.error. Hak `setWarLimitEnabled(false)` działa (main.ts ~34062).
3. PRZYJMUJĘ — pomiar 90 tur NIE ZMIERZONO w tej rundzie. Runner nie ma wznawiania, a foreground ograniczony jest do 590 s. Próba 1 (seed 4242, `--all-flags 1 --turns 90 --every 5`): padła w openGame (crash renderera Chromium, `Target page, context or browser has been closed`), 0 wierszy. Próba 2: timeout 585 s na t70 (14 wierszy, plik `<scratchpad>/m-r2b/seed4242-all1.jsonl`). Liczby t5–t70 (seed 4242, konfiguracja r2): wojnyRownolegleMax 0→1 (od t40, nigdy 2); sojuszeAiAi 0→4 (t70); napAiAi 0; zerwaniaZeroZaufania 0→16 (t70); paryGraczSojusz 0; brak NaN w wierszach; sekundy/tura do 22 s. Limit 2 sojuszy/cywilizację w runtime NIE ZMIERZONO do t90 (w t70 4 sojusze AI↔AI łącznie; per cywilizację nie wyliczono w tym runnerze). Seed 7 nie uruchomiony w tej rundzie. Zaufanie sąsiadów t50 w tym biegu nie policzone (NIE ZMIERZONO).
4. PRZYJMUJĘ jako dług testowy (poza zakresem tego tematu, bez zmiany). Potwierdzono na 9ea323ad0: `node gra/tools/war-rules-multiwar-main-guard-test.cjs` → `18 PASS / 3 FAIL`. Stan na origin/main wg Evaluatora (nie powtarzałem u siebie). Zarejestrować jako dług testowy osobnym tematem.

## Weryfikacja w tej rundzie
- `npm ci` w gra/ (71 pakietów, exit 0) — w worktree, node_modules nie jest śledzony przez git.
- `tsc --noEmit` → exit 0.
- `vite build` poza repo → exit 0 (index.html 15 006 297 B).
- breach-test live → 12 OK / 0 FAIL.
- war-rules-multiwar → 18 PASS / 3 FAIL (dług, jw.).
- Nie uruchamiano pozostałych bramek (logic, tech-tree, research, unit-replace, combat, ai-test, testy diplomacji): ta runda nie zmienia kodu gry ani testów. NIE ZMIERZONO.

## UWAGI-DLA-ORKIESTRATORA
- Rejestr: dopisać, że pomiary `pomiar-ON-*` i OFF→ON 3×150 tur (r1) używały napTor=true; konfiguracja domyślna r2 ma napTor=false.
- Decyzja właściciela (nie Operatora): czy tor NAP AI↔AI (`torAktywny`) ma być częścią pakietu i czy dopłata D zostaje 1.0.
- Dług testowy: `war-rules-multiwar-main-guard-test` 3 FAIL (przed kandydatem).
- Pomiar 90 tur seed 4242 i seed 7 wymaga osobnego biegu wznawialnego (VERIFY-LIVE).
- Nie tworzono żadnych sesji, zadań ani harmonogramów; nie integrowano, nie pushowano.

STATUS-BRAMEK: tsc 0; breach-live 12/0; war-rules 18/3 (dług); pomiar 90 tur NIE ZMIERZONO (t70 seed 4242).
RUNDY: 3/5 (obrona). OSTATNI WERDYKT: PASS-WITH-NOTES (Evaluator r2: zarzuty 1–4 jw.).
NASTĘPNY KROK: Evaluator — ponowna ocena z dowodami 2 i 3; decyzja właściciela o napTor i dopłacie D.
DEPLOY/PUSH: NIE WYKONANO
