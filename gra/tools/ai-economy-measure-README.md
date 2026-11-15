# Harness pomiaru ekonomii AI (R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1)

Pomiar tylko do odczytu. Hak `window.__aiEconomyMeasure` istnieje wyłącznie przy `?civTest=1`
(gra/src/main.ts, blok `__nnsMeasureDebug`). Gra bez tego parametru nie zmienia się.

## Jedno polecenie (przebieg 100 tur, wznawialny)

Bundle buduje się poza repo (`vite build --outDir <abs-dist>`), potem z katalogu `gra/`:

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 100 --every 10

- Wynik: `<out>/seed4242.jsonl` (jedna linia na turę: metryki każdego właściciela, bramka NNS gracza przed endTurn,
  dosypki, liczba automatycznie rozstrzygniętych bitew), `<out>/seed4242.state.json`, `<out>/seed4242.summary.json`.
- Zapis co `--every` tur (quickSave przez realną ścieżkę gry) w trwałym profilu. Ponowne wywołanie z tym samym
  `--out` i `--profile` wznawia od zapisanej tury. Pojedyncze polecenie Bash ma limit 590 s: dla 100 tur
  uruchamiać w dwóch wywołaniach (`--stop-at 50`, potem bez `--stop-at`).
- Bramka NNS gracza: przed endTurn, jeśli `nnsGateBlocked()`, runner dosypuje `--gold` / `--food` (domyślnie 200/200)
  przez `grantPlayerGold/grantPlayerFood` i zapisuje to w wierszu. `--bypass 0` wyłącza dosypki (wtedy
  przebieg zatrzymuje się z powodem `gate-blocked`). Harness nie ukrywa blokady AI.

## Test wznowienia (kryterium c)

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 50 --save-at 40 --resume-test 1

Przebieg ciągły 1..50 (skróty stanu z migawki `__detHarness.snapshotJson()` bez pola `meta`) kontra sesja
wznowiona z zapisu w turze 40. Wynik w `seed4242.summary.json` (`resumeTest.allEqual`).

## Test haka (kryterium a)

    node tools/ai-economy-measure-hook-test.cjs --dist <abs-dist>

Sprawdza kształt metryk, brak haka bez `?civTest=1` i czerwoność mutacji (wymagane pole nieistniejące).

## Ograniczenia (jawnie)

- Metryki `przychodNaTure` i `utratyNaTure` nie mają zweryfikowanego źródła w grze: są wymienione w polu
  `niezmierzone` i nie są liczone.
- Właściciele AI w zmierzonych przebiegach nie zakładają miast ani jednostek (0 przez 100 tur, oba ziarna).
  Pomiar obejmuje więc w praktyce gracza; ekonomia AI wymaga osobnego ustalenia przyczyny.
- Zapis gry nie zachowuje `city.podzialPracy` (brak w save.ts), więc wznowienie zmienia ekonomię miasta.
  Test wznowienia jest przez to czerwony (patrz raport R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1).
