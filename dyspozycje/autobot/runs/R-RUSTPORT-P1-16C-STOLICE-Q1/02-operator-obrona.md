# R-RUSTPORT-P1-16C-STOLICE-Q1 — Operator, tura 2 tej samej rundy 1/5 (obrona po zarzutach Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16C-STOLICE-Q1
GOAL: Domknąć 5 pozycji STOLICE z AUDYT-STOLICE §9.4 statusem z dowodem na pinie edb8fb56. Kryterium "zero pozycji bez statusu" spełnione.
ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (§13 przepisana po obronie; §1–§12 bez zmian, potwierdzone `git diff --check` i liczbą linii 1–712); `dyspozycje/autobot/runs/R-RUSTPORT-P1-16C-STOLICE-Q1/02-operator-obrona.md`. Brak commita. `gra/**` nietknięte.
TESTY: `git diff --check` czysty. Test `capital-sep-unit-test.cjs` NIE uruchomiony (odczyt wyłącznie `git show`). Przegląd statyczny: 121 linii, licznik PASS `passed++` przy `:49`, 29 linii z `assert`, literalne `36` nieobecne.
BLOKADY: brak decyzji do właściciela. Pozycja 3 (test 36 PASS) = NIEROZSTRZYGNIĘTY (test nie uruchomiony). Pozycja 5: rozbieżność kodu z B+C trwa, wpis decyzji 2026-09-04 nieobecny w rejestrze (porządek rejestru dla orkiestratora, nie nowe pytanie ABC).
RUNDY: 1/5 (tura 2 tej samej rundy)
NASTĘPNY KROK: Evaluator weryfikuje §13 (wersja po obronie) względem pina. Orkiestrator decyduje o zapisie `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` (2026-09-04) w `PYTANIA-OTWARTE.md`.
DEPLOY/PUSH: NIE WYKONANO

## Obrona

OBRONA: 1 -> PRZYJMUJE. Hub-chain nie ma luzowania: `packCityStatesAroundCapital` (`clusters.ts:2036`) wywołuje `packCityStatesHubChain` z `minDistLevels = [minDist]` (`:2084`), `validCandidate` używa `minSep` (`:1941–1944`), `packNearestLegalLand` używa `minSep = minDist` (`:1975`, `:2000–2001`). Luzowanie istnieje tylko w `repackClusterStateCitiesIfSparse` (`:2894`). §13.1 wiersz 1 poprawiony o zakres ścieżki.

OBRONA: 2 -> PRZYJMUJE. Dla `ki === 0`: `minDist = minDystMiastaPanstwa = opts?.minDystans ?? MIN_DIST_START_CITY_STATE` (`:3399`, `:49` = 5). Floor = `max(3, minDist − 2)` (`:2894`), czyli 3 tylko przy minDist ≤ 5. §13.1 wiersz 1 zapisuje warunek.

OBRONA: 3 -> PRZYJMUJE. Status wiersza (a) "menu 4/5/7" = NIEAKTUALNE (korekta faktu), jawnie opisane jako poza zbiorem NADAL ISTNIEJE/NAPRAWIONY/NIEROZSTRZYGNIĘTY, bo zbiór nie wyraża korekty faktu. "Min 5 MP" = osobny wiersz (b) NADAL ISTNIEJE z dowodem: `e-start-params.json:35–37` (miasta_panstwa 6), `newGameMapDefaults.ts:659–665` (min = 5), fallback `:579`/`:667` nieosiągalny przy wierszu JSON.

OBRONA: 4 -> PRZYJMUJE. Status zmieniony z "ZMIANA DECYZJI (nie błąd kodu)" na NADAL ISTNIEJE, czyli rozbieżność z wdrożonym B+C trwa. Dowód kodu: gałąź obcej stolicy `display-names.ts:184–189` → `foreignCapitalMapName` (`:247`) = nazwa miasta. Źródło zmiany: komentarze `:161–170` i `:234–235`. Nie rozstrzygam, która decyzja obowiązuje (to rejestr, nie fakt kodu).

OBRONA: 5 -> PRZYJMUJE. Zakresy poprawione: `formatCityMapLabel` = `display-names.ts:171–195` (gałąź obcej stolicy `:184–189`); `formatOwnerDiploLabel` `:198–207` i `isTechnicalOwnerLabel` `:210–217` nie są już podawane jako formatCityMapLabel; `ResolveOwnerBaseNameInput` = `:219–226`; komentarz o decyzji = `:161–170` oraz `:234–235`.

OBRONA: 6 -> PRZYJMUJE. Przegląd statyczny wykonany i dopisany do §13.1 wiersz 3: plik na pinie 121 linii; licznik PASS = `passed++` przy `console.log('PASS:', msg)` (`:49`); 29 linii zawiera `assert`; literalne `36` w pliku: 0 trafień. Status nadal NIEROZSTRZYGNIONY (bez uruchomienia).

DEPLOY/PUSH: NIE WYKONANO.
