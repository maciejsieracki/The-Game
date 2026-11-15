# Harness pomiaru ekonomii AI (R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1)

Pomiar tylko do odczytu. Hak `window.__aiEconomyMeasure` istnieje wyłącznie przy `?civTest=1`
(gra/src/main.ts, blok `__nnsMeasureDebug`). Gra bez tego parametru nie zmienia się.

Stan na tę rundę (r2 obrony): narzędzie działa i zapisuje dane, ale **cel „ekonomia AI” NIE jest osiągnięty**:
właściciele AI nie zakładają miast ani jednostek w tym przebiegu (zob. „Ograniczenia”). Dopóki to nie jest
naprawione, pomiar obejmuje wyłącznie gracza.

## Jedno polecenie (przebieg 100 tur, wznawialny)

Bundle buduje się poza repo (`vite build --outDir <abs-dist>`), potem z katalogu `gra/`:

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 100 --every 10

- Wynik: `<out>/seed4242.jsonl` (jedna linia na turę od tury 2: metryki każdego właściciela, pole `diag`
  z kolejkami spawnu i liczbą miast, bramka NNS gracza przed endTurn, dosypki, liczba automatycznie
  rozstrzygniętych bitew), `<out>/seed4242.state.json`, `<out>/seed4242.summary.json`.
  Tura 1 nie ma wiersza: wiersz powstaje po każdym endTurn, a stan startowy nie jest mierzony.
- Zapis co `--every` tur (quickSave przez realną ścieżkę gry) w trwałym profilu. Ponowne wywołanie z tym samym
  `--out` i `--profile` wznawia od zapisanej tury. Pojedyncze polecenie Bash ma limit 590 s; 100 tur na jednym
  ziarnie zajmuje ok. 50 s, więc zwykle mieści się w jednym wywołaniu.
- Bramka NNS gracza: przed endTurn, jeśli `nnsGateBlocked()`, runner dosypuje `--gold` / `--food` (domyślnie 200/200)
  przez `grantPlayerGold/grantPlayerFood` i zapisuje to w wierszu. `--bypass 0` wyłącza dosypki (wtedy
  przebieg zatrzymuje się z powodem `gate-blocked`). Harness nie ukrywa blokady AI.
  W przebiegach z tej rundy bramka nie została uruchomiona (`gate-active = 0`), więc gałąź dosypek NIE ZMIERZONO.

## Test wznowienia (kryterium c) — CZERWONY

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 50 --save-at 40 --resume-test 1

Przebieg ciągły 1..50 (skróty stanu z migawki `__detHarness.snapshotJson()` bez pola `meta`) kontra sesja
wznowiona z zapisu w turze 40. Wynik w `seed4242.summary.json` (`resumeTest.allEqual`).

Stan obecny: `allEqual = false`, `compared = 10`. Różnice (migawka tura 41, `SNAP_DUMP=ref`) to cztery pola:
`/cities/0/podzialPracy` (w przebiegu ciągłym brak pola), `wealthState.pula`, `gracze/0/1/skarbiec`,
`gracze/0/1/nauka`. Przyczyna: po wczytaniu zapisu `ensureCityPodzialDefaults` (gra/src/game/cities.ts,
ok. l. 707-720) dopisuje miastu domyślne `podzialPracy` (`procentBudynki: 70`), a żywe miasto bez pola korzysta
z globalnego podziału. Błąd jest po stronie normalizacji przy wczytaniu gry, poza allowlistą tego tematu.
Zapis (save.ts) serializuje całą tablicę miast, więc brak pola w zapisie NIE jest przyczyną.
Harness tego nie obchodzi: nie zmienia danych gry. Kryterium pozostaje niespełnione do decyzji właściciela
(poprawka normalizacji w grze albo ustalenie, że referencją jest przebieg z zapisem w tej samej sesji).

## Test haka (kryterium a)

    node tools/ai-economy-measure-hook-test.cjs --dist <abs-dist> [--mutant-dist <abs-zepsuty-dist>]

- Sprawdza kształt metryk (7 właścicieli, komplet pól i typów), brak haka bez `?civTest=1` oraz to, że
  wartości AI nie są puste: po zakończeniu startu i założeniu miasta gracza każdy właściciel AI z `aiStartHexes`
  powinien mieć co najmniej jedno miasto. **Ten warunek obecnie NIE jest spełniony (CZERWONE).**
- `--mutant-dist` to bundle z celowo usuniętym polem (np. `skarbiec` z obiektu metryk). Test MUSI na nim
  zgłosić błąd kształtu; to jest prawdziwa mutacja haka, a nie zmiana listy wymagań w samym teście.

## Ograniczenia (jawnie)

- Metryki `przychodNaTure` i `utratyNaTure` nie mają zweryfikowanego źródła w grze: są wymienione w polu
  `niezmierzone` i nie są liczone. Brak też `% kary głodu wojska` i utrzymania samych jednostek
  (Pieniądz + surowce) — te pola nie zostały dodane w tej rundzie (NIE ZMIERZONO).
- **Właściciele AI nie zakładają miast ani nie dostają jednostek w tym przebiegu** (0 przez 100 tur, oba ziarna).
  Diagnostyka (pole `diag` w wierszu, odczyt z `__aiEconomyMeasure.metrics()`) pokazuje: `aiStartHexes` = 6,
  `pendingForeignSpawnCities` = 0, `pendingSameTypeRivalHexes` = 0, `citiesAll` = 1 (tylko miasto gracza),
  `ownersOfCities` = [0]. Ta sama wartość występuje przy starcie `__nnsMeasureDebug.startGame` i przy
  `?playtest=mapa`. Przyczyna leży w starcie gry (gra/src/main.ts, ścieżka klastra i `spawnPendingForeignClusters`),
  poza allowlistą; NIE ZIDENTYFIKOWANO, czy to regresja, czy skutek parametrów startu harnessu
  (`rivals: 2`, `civTypesCount: 15`).
- Bramka NNS gracza nie wystąpiła w żadnym przebiegu tej rundy, więc sam mechanizm dosypek nie został
  zmierzony ani przetestowany (NIE ZMIERZONO).
- Instrukcja do #415 (flaga bramki utrzymania armii AI ON/OFF) NIE istnieje w tym narzędziu: kod bramki
  jest w `refs/keep/R-WEB-AI-UPKEEP-Q2-*` i nie został wprowadzony do main w tym temacie. Pomiar #415 wymaga
  najpierw naprawy zerowych metryk AI (wyżej) i decyzji, jak wprowadzić flagę.
