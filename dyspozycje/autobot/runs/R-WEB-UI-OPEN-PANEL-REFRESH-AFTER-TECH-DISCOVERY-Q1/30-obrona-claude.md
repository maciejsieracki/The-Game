# R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora 1bc262e14)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1
GOAL: odtworzyć na żywo, czy otwarty panel miasta pokazuje nowo dostępną pozycję po odkryciu technologii bez ponownego otwierania; w razie braku defektu zostawić test strażnik z PASS/„nie odtworzono”. Reguły dostępności bez zmian.
ZMIANY-COMMIT: brak zmian kodu w tej rundzie. Kandydat 33b951736 (baza origin/main e12764b59 → 33b951736) zostaje bez zmian. Commit obrony zawiera tylko ten plik raportu.

## Stan kandydata (sprawdzone w pliku, nie z pamięci)

Dowody w `dyspozycje/autobot/runs/R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1/dowody/`, pole `verdict` z JSON:

| Katalog | Tech | Verdict | blockLinesA | Różnica B vs C (techRowsAB) |
|---|---|---|---|---|
| kandydat-murarstwo | Murarstwo | PASS | 34 | B: Stolarnia; C: Stolarnia |
| kandydat-obrobka-drewna | Obróbka drewna | PASS | 37 | (PASS wg verdict) |
| noop-murarstwo | Murarstwo | FAIL | 34 | B: Stolarnia, Palisada drewniana; C: Stolarnia |
| noop-obrobka-drewna | Obróbka drewna | FAIL | 37 | reason: „B != świeży render” |
| kandydat-kontrola-bez-techu | brak | BLOCKED (exit 2) | — | reason: „odkrycie nie zmienia listy budowy — test nie rozstrzyga” |

Warunek (a) z DODATEK 2 (PASS na kandydacie dla Murarstwo i Obróbki drewna) jest spełniony. Warunek (b) (FAIL przy odświeżeniu no-op) jest spełniony dla obu technologii. Warunek (c) (kontrola bez techu bez różnicy) jest spełniony: kontrola daje BLOCKED z `visibleChange=false`, nie FAIL. Uwaga: w (b) nowy wiersz wymieniony w dispatchu (np. „Stolarnia”) występuje w B i C także przy no-op dla Murarstwa; różnica B/C przy no-op dla Murarstwa dotyczy wiersza „Palisada drewniana”. Dowód FAIL jest więc prawdziwy, ale wiersz różnicy nie jest dokładnie tym z dispatchu. Odnotowane zamiast koryguj.

## Odpowiedzi na zarzuty Evaluatora

1. **Panele rekrutacji imperium, handel, wioska — PRZYJMUJĘ jako lukę, NIE ZMIERZONO.** DODATEK 2 wyłącza zarzuty 3–6 ze zakresu tej rundy. Brak testów.
2. **Scroll, zaznaczenia, wyszarzenie po odświeżeniu — PRZYJMUJĘ jako lukę, NIE ZMIERZONO.** DODATEK 2 wymienia scroll w zakresie oddalonym. Brak asercji.
3. **Powtarzalność (jeden przebieg na konfigurację) — ODRZUCAM jako wymóg tej rundy.** Dispatch nie wymaga powtórzeń. Wynik w tabeli to jednokrotny przebieg. Nie twierdzę, że wynik jest powtarzalny: NIE ZMIERZONO.
4. **Hak `prepareNonEraCompletion(techName?)` w main.ts poza zakresem — PRZYJMUJĘ jako notę.** Hak leży w istniejącym obiekcie `__eraTestDebug` (gra/src/main.ts, linia ~29228, obok `endTurn`, `getPlayerState`, `prepareNonEraCompletion` z komentarzem R-WEB-UI-OPEN-PANEL-REFRESH). Jest test-only i nie zmienia ścieżki odświeżania. FC orzekł (DODATEK 2), że kod w main.ts jest poprawny i nie ma go zmieniać. Zostawiam bez zmian.
5. **Root `dowody/` z plikami z wcześniejszych rund — PRZYJMUJĘ jako notę.** Pliki w korzeniu `dowody/` (`open-panel-refresh-*.txt`, `open-panel-refresh-after-tech.json`, `r2-*.json`, `w18-fix.json`, `fix-PASS.json`) pochodzą z wcześniejszych rund i nie zmieniły się w tej rundzie (`git diff --name-only e12764b59 33b951736` ich nie pokazuje). Obowiązujące są podkatalogi `kandydat-*`, `noop-*`, `kandydat-kontrola-bez-techu`. Nie usuwam: zakaz rm/unlink. Orkiestrator może uporządkować.
6. **Kontrola bez techu zwraca BLOCKED, nie PASS — ODRZUCAM jako zarzut.** Kryterium (c) dispatchu brzmi „kontrola bez techu = brak różnicy”, a nie „PASS”. Konstrukcja zamierzona: BLOCKED oznacza, że test nie rozstrzyga, gdy odkrycie nie zmienia listy. Dowód: `kandydat-kontrola-bez-techu/…json`, reason „odkrycie nie zmienia listy budowy — test nie rozstrzyga”.

## Bramki

Nie uruchamiałem ponownie w tej rundzie (brak zmian kodu; wyniki przy kandydacie zapisane w raporcie Evaluatora 1bc262e14 i w `dowody/`). Wyniki zgłoszone przez Evaluatora (tsc exit 0, 213/213, 20/0, ALL GREEN, 21/21, combat sanity) to jego pomiary, nie moje — NIE ZMIERZONO przeze mnie w tej rundzie.

## TESTY (dowody)
- Kandydat Murarstwo: PASS (`kandydat-murarstwo/open-panel-refresh-after-tech.json`).
- Kandydat Obróbka drewna: PASS (`kandydat-obrobka-drewna/…json`).
- No-op Murarstwo: FAIL (`noop-murarstwo/…json`).
- No-op Obróbka drewna: FAIL (`noop-obrobka-drewna/…json`).
- Kontrola bez techu: BLOCKED exit 2 (`kandydat-kontrola-bez-techu/…json`).

## BLOKADY
- NIE ZMIERZONO: odświeżenie panelu Rekrutacja imperium, ścieżek handlu technologią i nagrody wioski (zarzut 1).
- NIE ZMIERZONO: zachowanie scrolla, zaznaczeń i wyszarzenia pozycji po odświeżeniu (zarzut 2).
- NIE ZMIERZONO: powtarzalność wyniku (jeden przebieg na konfigurację; zarzut 3).
- Dwa czerwone testy paneli (konwerter-produkcja 107/1, tech-tile 16/1) są długiem bazowym wg Evaluatora; NIE ZMIERZONO na bazie w tej rundzie.

## RUNDY
2/5 (runda 1: 84ee3723d; runda 2: 33b951736 z odpowiedziami Operatora). Ta runda: obrona bez zmian kodu.

## NASTĘPNY KROK
Evaluator / Final Control: przyjąć wynik dowodów (kandydat PASS, no-op FAIL, kontrola BLOCKED) i zdecydować o lukach NIE ZMIERZONO. Integracja i deploy wyłącznie przez orkiestratora.

## UWAGI-DLA-ORKIESTRATORA
- Wiersz różnicy przy no-op dla Murarstwa to „Palisada drewniana”, nie „Stolarnia” (patrz tabela wyżej). Dispatch podaje „Stolarnia” jako przykład; orkiestrator może to zaktualizować w swoich rejestrach.
- Root `dowody/` zawiera pliki z wcześniejszych rund (patrz zarzut 5).
- Zauważone poza zakresem: panel miasta nie jest odświeżany po samym EOT bez technologii (kontrola) — to ten sam obszar co luka 1 Evaluatora, osobny temat, jeśli ma być poprawne. Nie zakładam, że to defekt.

DEPLOY/PUSH: NIE WYKONANO
