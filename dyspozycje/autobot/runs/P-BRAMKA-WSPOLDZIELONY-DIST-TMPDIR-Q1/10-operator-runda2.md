# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Operator, runda 2

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Operator — Opus 5, effort high
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: `d4936081`, jeden plik: `gra/tools/bramki-tmpdir-unikalnosc-test.cjs`.
Zero plików poza allowlistą; drzewo czyste przed i po każdej mutacji.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator, runda 2
DEPLOY/PUSH: NIE WYKONANO

## Co zmieniłem — dwie pozycje, obie z ratyfikacji

**R2-FC1.** `} else if (!fileHasUniqueMark) {` → `} else {`. Warunek działał na poziomie
CAŁEGO pliku, więc po naprawie 57 plików R3 była w nich martwa. Rozstrzyga teraz wyłącznie
treść argumentu: znacznik unikalności gdziekolwiek indziej w pliku nie czyni unikalną
tej konkretnej ścieżki. Deklaracja `fileHasUniqueMark` straciła jedyne użycie i poszła
razem z nim — zostawienie jej to martwy kod w bramce, której cały sens to brak martwych
reguł. W jej miejscu komentarz, dlaczego tłumika tu nie ma.

**R2-FC2.** Nowa reguła **R6** na `` `${os.tmpdir()}/nazwa` ``. Wymaga, by po `}` stał `/`
(prefiks ścieżki); samo `${…}` bez segmentu to korzeń, który ma już R2 — inaczej dublowałbym
zgłoszenia. `UNIQUE_MARK` w reszcie linii zwalnia, tak samo jak w R4. Nagłówek pliku mówił
„TRZY REGUŁY", gdy plik miał ich pięć — poprawiony na sześć, z jednozdaniowym opisem każdej.

## Dowody — moje uruchomienia, mutacje cofane KOPIĄ pliku

| # | Sprawdzenie | Wynik |
|---|---|---|
| 1 | HEAD przed zmianą | `PASS=3 FAIL=0`, exit=0 |
| 2 | **Zero fałszywych alarmów** po FC1+FC2 na czystym HEAD | `PASS=3 FAIL=0`, exit=0, 63 plików z tmpdir z 825 `.cjs` |
| 3 | **FC-M7** — oryginalny defekt z powrotem w `weterani-test.cjs:75` (`path.join(os.tmpdir(), outName)`) | **CZERWONA**: `[R3] weterani-test.cjs:75`, `PASS=2 FAIL=1`, exit=1 (w rundzie 1: zielona) |
| 4 | **FC-M5** — `` `--outDir ${os.tmpdir()}/civ-fc-m5-dist` `` w `ai-buduje-budynki-test.cjs` | **CZERWONA**: `[R6] :243`, `PASS=2 FAIL=1`, exit=1 |
| 5 | M-OP1 (moja) — NOWY plik `tools/` wyłącznie z formą interpolowaną, scenariusz „55. bramka" | **CZERWONA**: `[R6] :3`, exit=1 |
| 6 | M-OP2 (moja, kontrola negatywna) — ta sama linia z `${process.pid}` | **ZIELONA**, exit=0 — R6 nie jest ślepym zakazem `${tmpdir}` |
| 7 | `git diff --quiet` po każdej z czterech mutacji | czysto za każdym razem |

Liczba asercji: **3**, tyle samo co po rundzie 1 — nic nie ubyło.

`tsc --noEmit` (5.9.3): **exit=0, 0 błędów**. Bramki referencyjne: `logic` **213/213**,
`tech-tree` **19/19**, `research` **33/33**, `unit-replace` **13/13**, `combat` **6/6**.

## BLOKADY

Brak. FC-4, FC-5, FC-6 i zarzut 6 zostawione nietknięte zgodnie z ratyfikacją; rejestracja
bramki w §6 jest zadaniem orkiestratora. Raportów rundy 1 nie przepisywałem (§13b).
