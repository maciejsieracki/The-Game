# R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 — obrona Operatora (runda 5, odpowiedź na zarzut Evaluatora dla kandydata c0f293c73)

STATUS: PASS-WITH-NOTES (zarzut 1 naprawiony w pinie testu; pozostałe zarzuty nie były przedmiotem tej obrony)
DOMAIN: PROCESS (poprawka testu pinującego, bez zmiany kodu gry)
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: usunąć dwa nowe czerwone asercje pinu `war-rules-multiwar-main-guard-test.cjs` (16/5 -> 18/3, jak baza 2127238ac), bez zmiany zachowania gry.
BAZA: c0f293c7357acebd9b3b4e866e49e72949f6327e (`git checkout --detach`).

## Odpowiedź na zarzuty

1. PRZYJMUJĘ, NAPRAWIONO. Przyczyna: w `gra/src/main.ts` l.47152 i l.47165 bramki `evaluateEraForcedWarGate` i `evaluateInterCivWarGate` mają postać `if (...!== 'ok') { emRej('...'); continue; }` (hak pomiarowy dopisał `emRej`). Zachowanie `continue` pozostaje; regexy pinu oczekiwały starej postaci `if (...) continue;`. Poprawka: w `gra/tools/war-rules-multiwar-main-guard-test.cjs` dwa regexy przyjmują obie postacie: `(?:continue;|\{[^}]*continue;\s*\})`. Dowód: pin po zmianie PASS dla „licznik epoki per cywilizacja” i „werdykt != ok -> continue”. Mutacja (usunięte `continue` w bloku) NIE pasuje do regexu: `node -e` -> `ok true mut false`.

## Zmiany (commit)

- `gra/tools/war-rules-multiwar-main-guard-test.cjs` — 2 linie (regexy dwóch asercji). Wartości i pozostałe asercje bez zmian.

## Wyniki testów (surowe, ten worktree)

- `node tools/war-rules-multiwar-main-guard-test.cjs` przed zmianą: 16 PASS / 5 FAIL (zgodnie z zarzutem).
- po zmianie: 18 PASS / 3 FAIL. Trzy pozostałe FAIL są przedistniejące na bazie (wg zarzutu baza 2127238ac = 18/3): „klaster państw-miast: interCivWarBlockedForAi(csOwnerId, ME()) -> continue”, „applyAllianceObligationsOnWar: sojusznik blokowany przez bramkę”, „bramka sojusznika PRZED joinAllyToWar”. NIE NAPRAWIANE w tej rundzie (poza zakresem zarzutu; nie są regresją kandydata).
- kod gry nie zmieniany, więc tsc/logic/silnik nie były uruchamiane w tej rundzie (NIE ZMIERZONO w tej rundzie; wyniki z poprzednich rund nie są tu przenoszone jako dowód).

## BLOKADY

- Trzy przedistniejące FAIL w `war-rules-multiwar-main-guard-test.cjs` (18/3 na bazie) — poza tym zarzutem.

## RUNDY

5/5 (obrona). Następny etap: Evaluator ponownie na tym SHA.

## NASTĘPNY KROK

Evaluator: potwierdzić 18/3 (nie gorzej niż baza) i brak regresji w pinie.

UWAGI-DLA-ORKIESTRATORA: w worktree leżał stary plik `30-obrona-claude.md` z rundy 4 innego kandydata (fb11e5ffa); został nadpisany treścią tej rundy. Dowody z poprzednich rund leżą poza repo (`/tmp/claude-0/ew4`) — sprzątanie po stronie orkiestratora. Brak nowych sesji, zadań, harmonogramów; brak push.

DEPLOY/PUSH: NIE WYKONANO
