# R-WEB-TEST-DEBT-TRUCE-L2B-RELABEL-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy live; kod gry nie zmieniany)
TEMAT: R-WEB-TEST-DEBT-TRUCE-L2B-RELABEL-Q1
GOAL: odpowiedź na 5 zarzutów Evaluatora (eecefc2ee) dla kandydata ca200b430; przyjęcie tylko tam, gdzie zarzut wskazuje realną lukę w teście; reszta odrzucona z dowodem.
BAZA: ca200b430 (dziecko 0218ac0d9; origin/main = 0218ac0d9 jako przodek)

## Odpowiedzi na zarzuty

| Nr | Zarzut Evaluatora | Decyzja | Dowód |
|---|---|---|---|
| 1 | Brak asercji na obecność/brak oferty w skrzynce przed akceptacją | ODRZUCAM (z wyjaśnieniem) | `pairState` w `gra/src/main.ts` ok. linii 30354–30361 zwraca tylko `status`, `truceUntilTurn`, `peaceUntilTurn`, `turn`. Pole `truceEndOffer` nie jest eksponowane. Dodanie odczytu wymaga zmiany `gra/src/main.ts` (poza allowlistą tematu). Dispatch podaje przykład jako „np.”. Ograniczenie opisane w nagłówku testu (POKRYCIE, linie 25–34 i komentarz przy L2b). Rozróżnienie wariantów opiera się na `peaceUntilTurn === null` (L2b2). |
| 2 | L2b2 i L2h czerwieją razem przy mutacji, brak izolacji | ODRZUCAM | Mutacja „AI akceptuje od razu” zmienia tę samą gałąź `truceEndTickPair`, którą pokrywa L2h (timeout). Dwie asercje czerwone przy jednej mutacji to nakładanie się diagnostyki, nie błąd. L2b2 pozostaje jedyną asercją wiążącą wariant „AI akceptuje od razu” z testem poza L2h. Brak zmiany. |
| 3 | L2g nie sprawdza `peaceUntilTurn === null` | PRZYJMUJĘ | Dodano asercję `L2g2` (gra/tools/diplo-truce-live-test.cjs, po linii `L2g`). Wynik live: `32 pass / 0 fail` (poprzednio 31/0). Mutacji osobno dla L2g2 nie wykonano (NIE_ZMIERZONO); asercja korzysta z tego samego pola co L2b2, które mutacja Evaluatora już wykazała. |
| 4 | `00-dispatch.md` nie istnieje na origin/main | ODRZUCAM (brak zmiany kodu) | Dodatek orkiestratora (`00-dispatch-DODATEK-claude.md`) i dispatch są na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, a dodatek wprost podaje tę ścieżkę. Na origin/main w katalogu runu jest tylko `10-operator-claude.md` (`git ls-tree ca200b430` potwierdza). Nie wpływa na ocenę kodu. |
| 5 | Testy live na pierwszym planie, nie `setsid nohup` | ODRZUCAM (brak zmiany) | Zasada sesji i polecenie orkiestratora: NIGDY `run_in_background`; każde Bash w pierwszym planie z timeoutem poniżej 590000 ms. Dispatch z `setsid nohup` jest w tym punkcie nadpisany. Przebieg live trwał ok. 3 min na pierwszym planie, exit 0. |

## ZMIANY-COMMIT

- Kod testu: commit z `gra/tools/diplo-truce-live-test.cjs` (jedna linia: asercja `L2g2`). SHA podany w raporcie końcowym (pole `sha`).
- Raport: `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-TRUCE-L2B-RELABEL-Q1/30-obrona-claude.md` (ten plik), osobny commit.
- Allowlista zachowana: zmieniono wyłącznie `gra/tools/diplo-truce-live-test.cjs` i katalog runu. `git diff --check` czysty.
- Nic nie wypchnięto na main. Nic nie zintegrowano.

## TESTY (liczby z surowego wyjścia)

- `node tools/diplo-truce-live-test.cjs` (SKIP_BUILD=1, bundle z `vite build` do `/tmp/claude-0-truce-bundle`, dowody do `/tmp/claude-0-truce-evidence`, nic w repo): `32 pass / 0 fail`, exit 0. W tym L2b OK, L2b2 OK, L2g OK, L2g2 OK, C OK.
- `npm run typecheck` (tsc --noEmit): exit 0.
- logic-test: exit 0, wyjście `LOGIC OK (213/213)`.
- tech-tree-test: exit 0, `tech-tree-test: 20 pass, 0 fail`.
- research-test: exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- unit-replace-test: exit 0 (wyjście zawiera linie `[OK]`; liczby fail nie odczytano z wyjścia, więc nie podaję jej jako zmierzonej).
- combat-test: exit 0, `COMBAT TEST: 6/6 pass`.
- `git diff --check`: czysty.
- Instalacja: `npm ci` w `gra/` (exit 0, 71 pakietów). Po pracy usunięto `gra/node_modules` i bundle w `/tmp`.

## BLOKADY

- Brak. Odmowa AI wobec propozycji GRACZA nadal NIE_ZMIERZONO (wymaga haka w main.ts; poza allowlistą), zgodnie z POKRYCIE w nagłówku testu.

## RUNDY

- 2/5 (runda obrony po zarzutach Evaluatora eecefc2ee).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch na origin/main nie istnieje; obowiązujący jest na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (patrz zarzut 4).
- Dispatch sugerował `setsid nohup`; obowiązuje zakaz `run_in_background` z zasad sesji (patrz zarzut 5).
- Hak do odczytu `truceEndOffer` i do odpowiedzi AI na propozycję gracza (NIE_ZMIERZONO) wymaga osobnego tematu z allowlistą `gra/src/main.ts`. Nie zakładano nowej sesji ani zadania (zakaz właściciela).

## NASTĘPNY KROK

- Evaluator: ponowna ocena kandydata z commitem testu i raportem obrony. Jeśli zarzut 1 zostanie uznany za wiążący, wymagany byłby osobny temat z allowlistą `gra/src/main.ts`.

DEPLOY/PUSH: NIE WYKONANO
