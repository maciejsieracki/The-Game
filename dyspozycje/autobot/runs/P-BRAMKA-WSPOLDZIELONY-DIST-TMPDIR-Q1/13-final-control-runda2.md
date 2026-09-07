# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Final Control, runda 2

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Final Control — Opus 5, effort high
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: sędzia nie zmienia kodu; ten raport. Oceniany HEAD `6a9cd78a`, drzewo czyste
przed i po (wszystkie mutacje cofane KOPIĄ pliku, `git diff --quiet` czysto po każdej).
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora
DEPLOY/PUSH: NIE WYKONANO

## WERDYKTY

1 → ODDAL. 2 → ODDAL. 3 → ODDAL.

## Odtworzenie nakazane dispatchem (własne, nie z raportu)

| Mutacja | Wynik | Reguła |
|---|---|---|
| FC-M7 `path.join(os.tmpdir(), outName)` w `weterani-test.cjs:75` | **CZERWONA** PASS=2 FAIL=1 exit=1 | `[R3]` |
| FC-M5 `` `${os.tmpdir()}/civ-fc-m5-dist` `` w `ai-buduje-budynki-test.cjs:242` | **CZERWONA** PASS=2 FAIL=1 exit=1 | `[R6]` |
| czysty HEAD | **ZIELONA** PASS=3 FAIL=0 exit=0 (63 plików z tmpdir z 825 `.cjs`) | — |

## Własna bateria — 10 mutacji, zero rozbieżności z oczekiwaniem

| # | Mutacja | Oczek. | Wynik |
|---|---|---|---|
| M-A | `` `${os.tmpdir()}/civ-x`; console.log(process.pid); `` | RED | RED `[R6]` |
| M-B | `` `${os.tmpdir()}` + '/civ-x' `` (szczelina R4/R6) | RED | RED `[R4]` |
| M-C | `os.tmpdir() + '/civ-x'; console.log(process.pid);` | RED | RED `[R4]` |
| M-F | `` `${require('os').tmpdir()}/civ-x` `` | RED | RED `[R6]` |
| M-G | dwie ścieżki w linii, `pid` tylko w drugiej | RED | RED `[R6]` |
| M-I | `` `${os.tmpdir()}/civ-x/dist` `` | RED | RED `[R6]` |
| M-D | `` `${os.tmpdir()}/civ-x-${process.pid}` `` | GREEN | GREEN |
| M-E | `` `${os.tmpdir()}` + '/civ-' + process.pid `` | GREEN | GREEN |
| M-H | `fs.mkdtempSync(path.join(os.tmpdir(), 'civ-x-'))` | GREEN | GREEN |
| M-J | `` `${os.tmpdir()}` + path.sep + String(process.pid) `` | GREEN | GREEN |

M-A/M-C dowodzą zarzutu 2 w OBU regułach, M-B zarzutu 3. M-D/M-E/M-H/M-J dowodzą, że to nie
jest ślepy zakaz — tłumik dalej działa, gdy znacznik stoi w SAMYM wyrażeniu ścieżki.

## Siedem kryteriów końca rundy 2

1. `} else {` — **TAK**, linia 241 kodu żywego. Jedyne wystąpienie `else if (!fileHasUniqueMark)`
   to komentarz historyczny w linii 242, nie warunek.
2. Reguła R6 — **TAK**, linie 281–303.
3. FC-M7 czerwieni — **TAK** (tabela wyżej). Poprzednio zostawała zielona.
4. FC-M5 czerwieni — **TAK**.
5. Zero fałszywych alarmów — **TAK**, mocniej niż mierzyła obrona: obrona dołożyła jeden plik
   z `main` (`szczescie-przebudowa-skali-test.cjs`), a `main` ma wobec HEAD **trzy** pliki
   nadmiarowe. Symulowane drzewo integracji z KOMPLETEM trzech (`+ai-zdobycie-miasta-adiacencja`,
   `+barbarzyncy-krazenie`) → **PASS=3 FAIL=0 exit=0**, 64 plików z tmpdir z 828 `.cjs`.
6. Asercje: **3** na HEAD, **3** po rundzie 1 (`af4d1e5e`) — nic nie ubyło.
7. `tsc --noEmit` exit=0. Bramki referencyjne: `logic` 213/213, `tech-tree` 19/19,
   `research` 33/33, `unit-replace` 13/13, `combat` 6/6 — wszystkie exit=0.

Dodatkowo: sama bramka uruchomiona 4× równolegle → 4× exit=0, identycznie. Nie wprowadza
klasy błędu, którą ściga.

## Uwaga bez rangi NAPRAW (poza kryteriami rundy 2)

R4 czyta tylko PIERWSZĄ linię instrukcji, więc `os.tmpdir() +` z nazwą i znacznikiem
przeniesionymi do następnej linii zgłosi się zachowawczo. To zachowanie z rundy 1, nie
regresja rundy 2, i na HEAD oraz na drzewie integracji nie produkuje ani jednego trafienia.
Kierunek błędu jest bezpieczny (fałszywy alarm, nie przeoczenie). Zostawiam jako obserwację.

## ZMIANY/ALLOWLISTA

Commit `6a9cd78a` dotknął `gra/tools/bramki-tmpdir-unikalnosc-test.cjs` i raportu rundy —
oba w allowliście. Zero plików spoza. `gra/src/**` i `gra/data/**` nietknięte.

## BLOKADY

Brak.
