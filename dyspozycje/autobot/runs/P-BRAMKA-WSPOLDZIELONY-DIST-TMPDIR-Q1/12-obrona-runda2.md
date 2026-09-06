# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Obrona Operatora, runda 2

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Operator (obrona) — Opus 5, effort high
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: jeden plik kodu `gra/tools/bramki-tmpdir-unikalnosc-test.cjs` + ten raport.
RUNDY: 2/5 (II faza — obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

Izolacja: HEAD `80fdf788`, drzewo czyste przed pracą. Zero plików poza allowlistą.

## OBRONA 1 — PRZYJMUJĘ (sprzeczność opisu)

Poprawka czysto opisowa, zero wpływu na wykrywanie. `„Czwarta forma TEJ SAMEJ rodziny"`
→ `„SZOSTA regula, szosta notacja"`. Odsyłacz R3 „patrz przy R3" prowadził do samego
siebie → prowadzi do komentarza przy gałęzi R3 w kodzie, gdzie historia pułapki faktycznie
stoi. Dołożony akapit „ZASIĘG TŁUMIKA" — nagłówek opisuje teraz stan po obronie 2.

## OBRONA 2 — PRZYJMUJĘ (tłumik na całej reszcie linii, R6 **i** R4)

Evaluator ma rację także co do spójności: poprawiłem OBIE reguły, nie samą R6.
Znacznik unikalności zwalnia teraz tylko wtedy, gdy stoi w SAMYM WYRAŻENIU ŚCIEŻKI.
R6 — `templateSegmentAfter()`: segment do pierwszej spacji/backticka na zerowym poziomie
`${…}`. R4 — `statementRestOf()`: reszta INSTRUKCJI, do `;` poza literałem.

| Mutacja | Przed obroną | Po |
|---|---|---|
| `` `${os.tmpdir()}/civ-x`; console.log(process.pid); `` | ZIELONA exit=0 | **CZERWONA** `[R6]` PASS=2 FAIL=1 exit=1 |
| `os.tmpdir() + '/civ-x'; console.log(process.pid);` | ZIELONA exit=0 | **CZERWONA** `[R4]` exit=1 |

Kontrole negatywne — dalej ZIELONE: `` `${tmpdir}/civ-x-${process.pid}` ``,
`tmpdir() + '/civ-' + process.pid`, `mkdtempSync`, sam korzeń w szablonie.

## OBRONA 3 — PRZYJMUJĘ (szczelina R4/R6 przy konkatenacji)

`` `${os.tmpdir()}` + '/civ-x' `` wypadało między reguły: dla R6 po `}` stał backtick
zamiast `/`, dla R4 po `os.tmpdir()` stał `}` zamiast `+`. Regex R4 przyjmuje teraz
owinięcie w szablon jako równoważny zapis tego samego wyrażenia.

| Mutacja | Przed | Po |
|---|---|---|
| `` `${os.tmpdir()}` + '/civ-x' `` | ZIELONA exit=0 | **CZERWONA** `[R4]` exit=1 |
| `` `${os.tmpdir()}` + `/civ-x` `` | ZIELONA exit=0 | **CZERWONA** `[R4]` exit=1 |
| `` `${os.tmpdir()}` + '/civ-' + process.pid `` | zielona | zielona (poprawnie) |

## Siedem kryteriów rundy 2 — przemierzone po obronie

1. `} else {` — nietknięte. 2. R6 — istnieje, wzmocniona. 3. **FC-M7** (`path.join(os.tmpdir(),
outName)` w `weterani-test.cjs:75`) → **CZERWONA** `[R3]`, PASS=2 FAIL=1, exit=1.
4. **FC-M5** (`` `${os.tmpdir()}/civ-e2-dist-${variant}` `` w `ai-buduje-budynki-test.cjs:242`)
→ **CZERWONA** `[R6]`, exit=1. 5. **Zero fałszywych alarmów**: czysty HEAD PASS=3 FAIL=0
exit=0 (63 plików z tmpdir z 825 `.cjs`); symulowane drzewo integracji (dołożony
`szczescie-przebudowa-skali-test.cjs` z `main`) PASS=3 FAIL=0, 826 `.cjs`.
6. Asercje: **3** — tyle samo, nic nie ubyło. 7. `tsc --noEmit` exit=0; `logic` 213/213,
`tech-tree` 19/19, `research` 33/33, `unit-replace` 13/13, `combat` 6/6.

Regresja R1–R5 sprawdzona osobno: literalny `path.join` (R1), korzeń (R2), konkatenacja
jedno- i wielolinijkowa oraz `require('os').tmpdir()` (R4), literał `/tmp/…` (R5) —
każda dalej czerwieni. Wszystkie mutacje cofane KOPIĄ pliku, `git diff --quiet` czysto
po każdej, plik próbny usuwany.

## BLOKADY

Brak. Obserwacje Evaluatora spoza rundy 2 (brak średnika w R2, własność obiektu,
`Date.now()` jako zachowawczy fałszywy alarm) zostawione — poza kryteriami tej rundy.
