# R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (POMIAR; kod gry NIE zmieniany; gra/src, gra/data nietknięte)
TEMAT: R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1
GOAL: wznawialny runner dyplomacji + pomiar flag OFF/ON (seed 4242 i 7, 90 tur) na main d42ec8560; obrona przed zarzutami Evaluatora 9ce18dd89.
ZMIANY-COMMIT: kandydat 5e28ad045 → poprawki obrony w tej rundzie (SHA w polu sha odpowiedzi orkiestratora). Zmienione tylko: `dyspozycje/analizy/POMIAR-FLAG-DYPLOMACJI-OFF-ON-2026-11-20.md` (zarzut 1), `gra/tools/diplomacy-measure-resume-test.cjs` (zarzut 3). Commit przez `git add <dwie ścieżki>`, bez -A.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ — poprawione. Usunięto cztery osierocone wiersze tabeli bez nagłówka (`| 4242 | OFF | 7 (t70) …`) i zdublowaną tabelę; zostały maksima opisane zdaniem nad tabelą „Kolumny maks.” (sekcja tabel w dokumencie). `git diff --check` = czysto.

2. ODRZUCAM z dowodem (luka poza allowlistą, nie do zrobienia w tej rundzie):
   - Metryka `owners` pochodzi z `window.__diploHarderMeasure.metrics()`, a ten hak jest zdefiniowany w `gra/src/main.ts` (grep: `gra/src/main.ts` zawiera `__diploHarderMeasure`). Dispatch: ALLOWLISTA „NIC więcej (nie ruszaj … main.ts)” oraz ZAKAZY „gra/src”. Runner nie ma skąd wziąć liczby miast AI bez zmiany `main.ts`.
   - Dopisanie pola wymagałoby ponownego biegu czterech przebiegów 90 tur w Chromium (≈ 4 × 3 odcinki, z SIGSEGV w 22 z 41 logów) — poza tą rundą i poza budżetem.
   - Zostaje NIE ZMIERZONO (dokument, sekcja „Czego NIE zmierzono”). Do orkiestratora: miasta AI wymagają osobnego tematu z hakiem w `main.ts` i powtórzenia biegów.
   - Zerwania traktatów inne niż przy zerowym zaufaniu: też NIE ZMIERZONO (hak `window.__diploAllFlagsMeasure.zerwaniaZeroZaufania` w `gra/src/main.ts` ok. linii 34174 zlicza tylko zerwania zerowego zaufania; runner `gra/tools/diplomacy-harder-measure-run.cjs` nie ma innego źródła zerwań) — to samo ograniczenie.

3. PRZYJMUJĘ — poprawione. `diplomacy-measure-resume-test.cjs` bez `--a`/`--b` i bez `--run 1` nie zgłasza już C0 jako CZERWONE; wypisuje `NIE ZMIERZONO :: C1-C4 pominiete: brak --a/--b i --run 1` i nie liczy tego jako błędu. Pin P1–P8 nadal działa. Przy podanym `--a`/`--b` bez plików C0 nadal jest CZERWONE (poprawnie, bo ścieżka została jawnie podana).

4. ODRZUCAM jako poza zakresem tej rundy (przedtemowe, nie spowodowane kandydatem):
   - Dowód: `git diff --stat d42ec856 5e28ad045` nie zawiera `gra/tools/diplomacy-harder-measure-hook-test.cjs` ani `gra/src/main.ts`; zakres dispatchu zabrania ich zmian. Ewaluator na bazie d42ec856 uzyskał 20/1 (B2b), czyli czerwone jest w bazie, nie w kandydacie.
   - Do osobnego tematu (propozycja dla orkiestratora): B2b oczekuje OFF dla `setEnabled(null)`, a po FALI 888 domyślnie jest ON.

## Testy (tej rundy)

- `node tools/diplomacy-measure-resume-test.cjs` (bez argumentów, z katalogu gra/): `ZIELONE P1..P8`, `NIE ZMIERZONO :: C1-C4 pominiete`, `WYNIK: 8 zielonych, 0 czerwonych`, exit 0.
- `node --check tools/diplomacy-measure-resume-test.cjs` — SYNTAX_OK.
- `git diff --check` — CHECK_OK.
- NIE PONOWIONO w tej rundzie: tsc --noEmit, logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, hook-testy. Powód: zmiany obrony nie dotykają `gra/src`, `gra/data` ani żadnego pliku czytanego przez te bramki (dotknięte: dokument i jeden skrypt testowy `.cjs` w `gra/tools`). Wyniki z rundy 1 (Evaluator, SHA 5e28ad045): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; all-flags-hook 35/0; harder-hook 20/1 (B2b, pkt 4).

## Dane

Surowe dane i wyniki pomiaru (cztery przebiegi, 18 wierszy każdy, tury 5..90) bez zmian względem rundy 1 — nie były ponownie mierzone. Wnioski dokumentu bez zmian (ON: więcej sojuszy AI↔AI i zerwań przy zerowym zaufaniu; „mniej współbieżnych wojen” nie potwierdzone; 2 ziarna × 1 bieg).

## UWAGI-DLA-ORKIESTRATORA

- Zarzut 2 (miasta AI, zerwania inne niż zerowe zaufanie) wymaga tematu z hakiem w `gra/src/main.ts` i ponownego biegu 4 × 90 tur; nie robiony tutaj (zakaz gra/src, budżet).
- B2b w `diplomacy-harder-measure-hook-test.cjs` czerwone w bazie d42ec856 — do osobnego tematu.
- Chromium SIGSEGV przy wczytaniu slotu: 22 z 41 logów (dokument, sekcja „Stabilność środowiska”).

BLOKADY: brak (poza pkt 2 — tematy poza zakresem, opisane wyżej).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (ponowna ocena 2. rundy) → Final Control.
DEPLOY/PUSH: NIE WYKONANO
