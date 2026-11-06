STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — pamięć renderu
TEMAT: R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1
GOAL: (A) wspólne materiały modeli z obrazem identycznym piksel w piksel; (B) prototyp scalenia statycznych części jednostek z rzetelnym pomiarem do decyzji właściciela.

## Orzeczenia zarzutów Evaluatora (r1)

| Zarzut | Orzeczenie | Dowód FC |
|---|---|---|
| Z1 — log prototypu z innej wersji narzędzia | ODDAL (usunięty w r2) | `gate-memory-static-unit-merge-prototype.txt` w `d404416fd` ma 2 przebiegi bieżącego narzędzia, każdy `EXIT=0`. Mój niezależny przebieg na `d404416fd` (`node tools/memory-static-unit-merge-prototype.cjs <scratch> 5`): `EXIT=0`, meshe 10 936 → 2 550, draw calls 11 106 → 2 720, piksele 52/101/5 z 1,6 mln, picking 170/170 — zgodne z logiem. |
| Z2 — zawyżony zysk (A), mieszana baza (B) | ODDAL (usunięty w r2) | Mój przebieg: geoOnly 67,01 / geoPlusMat 60,19 / geoMatMerge 21,40 MB (mediany z 5 powtórzeń, izolowany proces + `--single-threaded-gc`); deltaMaterials 6,82 MB, deltaMerge 38,79 MB. Odtwarza liczby r2 (−6,8 / −38,8 MB). Stara metoda `sequentialInProcess` w tym samym przebiegu dała 18,24 — potwierdza tezę o bimodalności starego pomiaru. Liczby −18,2 i −29,8 w `01-operator-r1.md` i `memory-attribution.md` przekreślone z jawną „KOREKTA r2”. |
| Z3 — niepełna bramka `*render*` | ODDAL (usunięty w r2) | `gate-render-all.txt`: 84/84 rozliczone, 0 regresji, `EXIT=0`. Weryfikacja wyrywkowa FC: `zelazo-konnica-asyryjska-real-render-test` na POST = 30 pass / 1 fail, a jedyny FAIL to asercja danych `units.json` (0g, Atak dystansowy), niezależna od renderu — zgodne z werdyktem „TAKI_SAM_JAK_BASE”. |

Brak NAPRAW. Brak DO DECYZJI CZŁOWIEKA w zakresie (A).

## Nota FC (poprawione w commicie FC, bez wpływu na dowód)

- `git diff --check ca289d8ce d404416fd` NIE był czysty, wbrew raportowi r2: pusta spacja na końcu linii 56 `gate-render-all.txt` (wiersz `render-unit-sharpness-measure`, pusta „ostatnia linia POST”). Usunąłem tę spację w commicie FC — tylko biała spacja w logu, treść pomiaru bez zmian. Po poprawce `git diff --check ca289d8ce HEAD` czysty.

## Weryfikacja FC

- Diff do allowlisty: `git diff --name-only ca289d8ce d404416fd` poza `runs/<ID>/` = `gra/src/render/{cities,geometryContentPool,materialContentPool,scene,units}.ts`, `gra/tools/memory-static-{material-pool-pixel-test,unit-merge-prototype}.cjs`. Zero zmian w `main.ts`, `gra/data/**`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `battle/**`, `vite.config.ts`.
- r2 (`a1bc877a5..d404416fd`) nie zmienia `gra/src/**` — kod gry = `5e62c5158`; bramki kodu z r1 i powtórka Evaluatora (pełna klatka pre vs post = 0 px) pozostają ważne.
- Bramki uruchomione samodzielnie na `d404416fd` (po `npm ci --ignore-scripts`):
  - `tsc --noEmit`: EXIT=0, 0 błędów.
  - `logic-test`: 213/213.
  - `memory-static-material-pool-pixel-test`: 7/0, EXIT=0 (M1 = 0 px, kontrola M3 = 51 px, picking 184/194 tak samo P i S, materiały 3 038 → 477).
  - `memory-static-unit-merge-prototype`: EXIT=0, liczby jak wyżej.
  - `zelazo-konnica-asyryjska-real-render-test` (wyrywkowo): 30/1, FAIL danych istniejący przed tematem.
- Scalenie: `git merge-tree origin/main d404416fd` bez konfliktów (origin/main = `6e5e7eac4`, 17 commitów za bazą `ca289d8ce`, żaden nie dotyka `gra/src/render`); z `origin/rust-port/parity-v2` (`b520768b0`) też bez konfliktów, a parity-v2 nie zmienia `gra/src/render`.

NIE_ZMIERZONO (FC): ai-test, war-allin, pełna klatka i MB w grze t.1/t.50 (odtworzone/zmierzone przez Operatora i Evaluatora na tym samym kodzie gry; FC nie budował vite). Powtarzalność MB w grze — jeden przebieg na stronę (przyjęte jako nota, zysk (A) w grze −8,4 / −5,9 MB, szum ~3 MB).

## Do integracji

- SHA końcowy do integracji: commit FC na `d404416fd` (podany w raporcie zwrotnym; zawiera ten plik i poprawkę białej spacji).
- Kolejność: najpierw `origin/main` (temat WEB, `gra/`), scalony na świeżym `origin/main` — razem/po R-WEB-MEMORY-DATA-URI-DUPLICATES-Q1 i R-WEB-PERF-ENDTURN-AI-PHASE-Q1 (rozłączne pliki). `origin/rust-port/parity-v2` niezależny — brak wspólnych plików; ewentualne przeniesienie przez zwykłe scalenie `main` → parity-v2 po wdrożeniu, bez wymagań kolejności.
- (B) NIE jest wdrażane: decyzja właściciela (ABC zadaje orkiestrator) z liczbami r2: ok. −39 MB sterty ponad (A), draw calls 11 106 → 2 720, koszt do 101 px z 1,6 mln i zmiana `SmallPartLod`.

BLOKADY: brak dla (A). (B) — DECISION_REQUIRED po stronie orkiestratora (pytanie ABC), nie blokuje integracji (A).
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (A) na świeżym `origin/main` → READY_FOR_DEPLOY; ABC o (B).
DEPLOY/PUSH: NIE WYKONANO
