# Operator rerun — macierz mieszanych armii na `main` `862568e`

**Status: niezaliczone; etap 3/11 (reprodukcja aktualnego ograniczenia).** Nie wykonywano
zmian produktu, integracji, deployu ani pushu.

## Zakres i środowisko

- Commit sprawdzanego produktu: `862568e26212ea733def53fc5f6b59214d753534`.
- `npm run typecheck`: PASS.
- Harness: `gra/tools/battle-large-mixed-doctrine-matrix-test.cjs`, ładuje produkcyjne
  `BattleScene`; animacja/render są stubowane, ruch, dobór celu i doktryny wywołują metody
  produktu.
- Macierz: 36 scenariuszy, 42 aktywne jednostki na stronę, trzy doktryny, trzy ustawienia
  linii strzelców, dwa warianty priorytetu celu, teren zwarcia i korytarza, 5 aktywacji.
- Wynik: **3 czerwone warunki**; polecenie zakończyło się kodem 1. Brak `illegal-attack`.

## Odtworzenie

W trzech kombinacjach `steady` / `rangedLines=2` / `engaged` łucznicy zajmujący tylną
pozycję w wielotypowym szeregu nie wykonali ani ruchu, ani strzału, pozostając poza
zasięgiem na dystansie 4 przy zasięgu 3:

- priority 0: `atk-archer-26`, dystans `4 → 4`;
- priority 1: `atk-archer-25` i `atk-archer-26`, dystans `4 → 4`.

Izolowana próba dwóch kombinacji przez 8 aktywacji odtworzyła wszystkie trzy czerwone
warunki. `atk-archer-26` ma dostępny sąsiedni heks cofający się, natomiast heks do przodu
jest zajęty sojuszniczym łucznikiem; boczne heksy także zostają zajęte w czasie przebiegu.
W każdym z 8 aktywacji `ranged-pick` nie znalazł celu w zasięgu, a jednostka kończyła
bez zmiany pozycji i bez zużycia amunicji. To wskazuje na zakleszczenie podejścia w
zatłoczonym wielorzędowym szyku, a nie na brak celu przeciwnika.

Pozostałe role w tych scenariuszach działały: oszczepnicy oddali 48 strzałów na wariant,
część łuczników i procarzy strzelała lub się poruszała, a konnica i rydwany wykonały ruch
lub atak. W szerszej macierzy korytarz nadal ujawnił przypadki, w których strzelcy ruszali
się, ale nie doszli do zasięgu w pięciu aktywacjach; to nie zostało uznane za ten sam błąd
bez dłuższego kryterium dojścia.

## Artefakty

- `evidence/main-862568e-full-36-scenarios.json` — pełna macierz, SHA-256
  `9218ae15611e697c5a83c14200c562b9d81833b73a476a9731d0a44ff8568f91`.
- `evidence/main-862568e-steady-lines2-engaged-8-rounds.json` — odtworzenie 8 aktywacji,
  SHA-256 `8964eb9c5d695eced9f44429b502f22d92869bb3b2681b8f92aa67f6516b4673`.

Następny krok: operator ma przygotować korektę planowania kroku dla strzelców w
`steady`, tak aby szukali wolnego heksa do przodu/boku blisko własnej linii, gdy
bezpośrednie wejście do przodu blokuje sojusznik; zachować nieprzekraczanie linii
piechoty oraz nie dopuścić do wycieczek przez tyły. Potem ponowić macierz i przekazać
zmianę niezależnemu Evaluatorowi.
