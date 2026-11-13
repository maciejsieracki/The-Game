# R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1 — 30-obrona-claude (Operator, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1
GOAL: w relacji dyplomacji, gdy rozejm jest aktywny, pokazać „Rozejm do tury N” (N z danych pary, nie stała). Bez rozejmu brak napisu.
BAZA: origin/main 34584b4da; kandydat do obrony 2e90affc3 (checkout detach w worktree).
SHA: kod obrony 4089ae399 (poprawki zarzutów 1–3); raport = commit tego pliku (SHA końcowy w polu sha odpowiedzi).

## Odpowiedzi na zarzuty

### Zarzut 1 (blokujący): napis nie podłączony w main.ts — PRZYJMUJĘ
- Dowód przed poprawką: `grep -n truceUntilTurn gra/src/main.ts` w getState audiencji (ok. linii 25607–25665) nie zawierał pól `truceUntilTurn` ani `currentTurn`; `formalBannerHtml` dostawał `st.currentTurn === undefined`, więc napis był zawsze pomijany.
- Poprawka (commit 4089ae399, `gra/src/main.ts`, +2 linie w zwracanym obiekcie getState, tuż po `formalStatusDetail,`):
  `truceUntilTurn: pairMeta.truceUntilTurn ?? null,` oraz `currentTurn: turn,`
  (`pairMeta = getDiploPairMeta(ME(), ownerId)` był już w zakresie; `turn` używany wyżej w tym samym getState).
- ZAŁOŻENIE / ROZSZERZENIE ALLOWLISTY: `gra/src/main.ts` nie był na allowliście dispatchu. Bez tych dwóch linii cel tematu jest niespełniony, a nie ma innej drogi: `DiplomacyAudienceState` jest budowany wyłącznie w main.ts i diplomacyAudience.ts nie ma dostępu do tury ani metadanych pary. Rozszerzenie zakresu do 2 linii w main.ts uznaję za konieczne; Final Control / orkiestrator proszeni są o jawne zatwierdzenie tego rozszerzenia.
- Brak zmian w logice rozejmu (diplomacy.ts, diplomacy-peace-lock.ts nietknięte).

### Zarzut 2: test wiringu to regex na źródle, nie wykrywa braku podłączenia — PRZYJMUJĘ (częściowo)
- Dodano w `gra/tools/diplo-truce-until-turn-test.cjs` dwa sprawdzenia źródła `gra/src/main.ts`: obecność `truceUntilTurn: pairMeta.truceUntilTurn ?? null,` oraz wzorzec `formalStatusDetail,\s*truceUntilTurn: ...\n\s*currentTurn: turn,`. Przed poprawką main.ts te sprawdzenia dałyby FAIL (linie nieobecne), po poprawce PASS.
- NOTE: to nadal test źródłowy. NIE_ZMIERZONO: render w przeglądarce (napis widoczny w grze). Test nie dowodzi renderu ani poprawności typów w runtime; typy weryfikuje tsc (0 błędów).

### Zarzut 3: niesprzątane artefakty esbuild `.dip-truce-until-turn*.cjs` — PRZYJMUJĘ
- Dodano `fs.unlinkSync(outfile)` po `require(outfile)` w funkcji `bundle()` (try/finally). Plik ENTRY `src/.dip-truce-until-turn-entry.ts` był już sprzątany.
- Dowód: po uruchomieniu testu `ls -a gra/tools | grep dip-truce` nie zwraca nic; `git status --short` w worktree po biegu pokazuje wyłącznie pliki zamierzone (przed commitem: `M gra/src/main.ts`, `M gra/tools/diplo-truce-until-turn-test.cjs`).

## Bramki (surowe wyjścia z tego biegu, w gra/ po `npm ci --ignore-scripts`)
- `npx tsc --noEmit` → exit 0, brak wyjścia (0 błędów).
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`, exit 0.
- `node tools/diplo-truce-until-turn-test.cjs` → `WYNIK: 15 PASS / 0 FAIL`, exit 0 (w tym M1 wykryty, 2 nowe wiring-checki main.ts PASS).

## Zakres zmian (commit 4089ae399 + commit raportu)
- gra/src/main.ts (+2 linie, getState audiencji) — rozszerzenie allowlisty, patrz zarzut 1.
- gra/tools/diplo-truce-until-turn-test.cjs (+ wiring main.ts, + unlink bundli).
- dyspozycje/autobot/runs/R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1/30-obrona-claude.md (ten plik).
- Nie zmieniano: diplomacy.ts, JSON balansu, WERSJE.md, gra-robocza/, rust-port/. `git add -A` nie użyto.

## Zastrzeżenia do sprawdzenia przez FC
- Allowlista: main.ts (2 linie) — wymaga zatwierdzenia orkiestratora.
- Napis w grze NIE_ZMIERZONO w przeglądarce (brak uruchomienia UI w tej rundzie).

RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Evaluator r2 (weryfikacja 4089ae399 i testu), potem Final Control; live check napisu w przeglądarce przed deployem.
DEPLOY/PUSH: NIE WYKONANO
