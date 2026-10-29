# R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1 — Operator Defense, runda 2

**Verdict:** uwagi Evaluatora dotyczące reprezentatywności Chromium są zaadresowane. Stage 7/11. Nie zmieniałem logiki produktu w rundzie Defense; poprawiłem fixture i poszerzyłem dowody browserowe.

## Uwagi Evaluatora

1. Chromium test ręcznie nadpisywał flagi jednostek, by uczynić Hastati/Falangę piechotą wręcz.
2. Test nie dowodził zachowania łuczników.
3. Ruch do zwarcia był testowany wyłącznie adapterem, poza Chromium.

## Odpowiedź i zmiana fixture

- Z `gra/data/units.json` pobieram rzeczywisty rekord `Wojownik` (Kamień) i podstawiam go do dziesięciu przednich slotów na każdą stronę wejściowego presetu 28v28. Pozostałe sloty wciąż zawierają łuczników i konnicę z produkcyjnego presetu.
- `BattleScene` sam wylicza role z prawdziwych danych jednostki. Harness nie ustawia `rangedBase`, `phalanx` ani innych flag roli. W JSON-ie potwierdzają to `probeFixture.sceneRoleFlagsOverridden=false` i `warriorDataRow="Wojownik (Kamień)"`.
- Harness znajduje w scenie czteropolowy pas przejezdnego terenu, ustawia Wojownika atakującego trzy pola od celu i pozostawia pełną 28v28 obsadę oraz kolizje sceny. Sprawdza ruch pierwszej linii oraz atak w zwarciu w kolejnej aktywacji.
- Dodałem jawny bezpiecznik łuczników w obu doktrynach: test wymaga zarejestrowanych strzałów w „Ataku” i „Szturmie”. Konnica także pozostaje włączona jako kontrola zachowania.

## Wynik Chromium

`node gra/tools/battle-manual-melee-browser-test.cjs` — PASS:

- 28 jednostek na stronę: 20 Wojowników, 20 dystansowych i 16 konnych łącznie.
- W „Ataku” Wojownik przeszedł dwa pola z dystansu 3 do zwarcia, a następnie zadał cios. Zapisano 3 ataki wręcz i 2 zdarzenia utraty HP.
- W „Szturmie” zapisano 2 ataki wręcz i jedno zdarzenie utraty HP.
- Kontrola strzelców: 4 strzały w „Ataku”, 1 w „Szturmie”. Konnica wykonała 14 akcji w „Ataku”.
- Zero błędów strony/konsoli; zrzut sceny zapisany.

Dowody: `evidence-chromium/paired-attack-charge-trace.json` i `evidence-chromium/battle-scene-after.png`.

## Regresja i bramki

- `node gra/tools/battle-melee-attack-doctrine-test.cjs` — PASS, 24v24; oba tryby dochodzą do zwarcia i zadają obrażenia; pusty cel nie powoduje ataku.
- `node gra/node_modules/typescript/bin/tsc -p gra/tsconfig.json --noEmit` — PASS.
- `git diff --check` — PASS.

Browser run aktywuje reprezentatywne jednostki z pełnego rosteru, nie całą 56-osobową armię w każdym kroku. Jest bezpośrednim dowodem ruchu i ataku zwykłej piechoty w produkcyjnej scenie oraz kontrolą, że dystansowi i konnica nadal działają; nie jest pełnym testem wydajności dużej bitwy.

Nie wykonano merge, deploymentu ani pushu.
