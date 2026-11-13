# Operator Defense — R-BATTLE-MODE-SETTING-WIRING-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-BATTLE-MODE-SETTING-WIRING-Q1
GOAL: Zachować wybór Auto/Ręczna zgodnie z ustawieniem nowej gry, zapisem i obecnością wodza.
ZMIANY/COMMIT: Dodano wersję semantyki ustawienia do metadanych zapisu i regresję roundtrip; commit do wykonania po tej obronie.
TESTY: `battle-mode-save-reload-contract-test.cjs` PASS; `battle-manual-choice-contract-test.cjs` 12/12 PASS; `pre-battle-defender-retreat-test.cjs` PASS; `battle-mode-choice-labels-test.cjs` PASS w Chromium; `tsc --noEmit` PASS; build Vite PASS (918 modułów); `git diff --check` PASS.
BLOKADY: Brak blokady produktu. Pełny test gameplay end-to-end obejmujący realne wczytanie slotu i wywołanie ataku nie jest dostępny bez dodania nowego publicznego haka do zamknięć `boot()`.
RUNDY: obrona Operatora / runda 1
NASTĘPNY KROK: Niezależny Evaluator powinien zweryfikować migrację semantyki starych zapisów i roundtrip obu opcji.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedź na notę Evaluatora

Nota o brakującym end-to-end save/reload ujawniła lukę semantyczną: stare zapisy mogą już zawierać `meta.newGameParams.advanced.battleAlwaysManual: false`, mimo że w tej wersji gry wartość była nieaktywna. Odczyt samej flagi zmieniłby takie zapisy w „Bitwa automatyczna” bez decyzji gracza.

Naprawa dodaje znacznik `meta.battleModeSettingVersion = 1` do snapshotów nowych gier. Odczyt trybu automatycznego wymaga jednocześnie tego znacznika i wartości `false`; stary zapis bez znacznika nadal otwiera wybór bitwy. Znacznik i opcja pozostają w `meta`, które jest zachowywane przez istniejące `serializeGame`/`deserializeGame`; bump `SAVE_VERSION` nie jest potrzebny, bo pole metadanych jest opcjonalne.

## Granica dowodu

`main.ts` trzyma budowanie snapshotu, odtwarzanie `_lastNewGameParams` i trzy ścieżki walki wewnątrz `boot()`; repo nie udostępnia ich jako importowalnego API ani nie ma obecnie testu, który ładuje kompletny slot i inicjuje walkę w tym samym Chromium przebiegu. Nie dodałem szerokiego haka diagnostycznego do produkcyjnego runtime. Zamiast tego nowa regresja uruchamia rzeczywiste `serializeGame` i `deserializeGame` dla obu nowych wartości oraz starego zapisu z dawnym `false`, testuje produkcyjny helper polityki, a asercje źródłowe spinają znacznik z zapisem/odczytem i polityką wejścia. Istniejący Chromium test potwierdza, że obie etykiety można wybrać; istniejący JSDOM test przechodzi ścieżkę bez wodza: wybór Ręczna pozostaje dostępny, a gate sterowania jest osobny od wyboru.

## Wyniki

- `node tools/battle-mode-save-reload-contract-test.cjs` — PASS; oba ustawienia zachowane po roundtrip, stary zapis bez znacznika nadal wybiera zwykły prompt.
- `node tools/battle-manual-choice-contract-test.cjs` — 12/12 PASS; komplet trzech wejść oraz niezależna bramka wodza.
- `node tools/pre-battle-defender-retreat-test.cjs` — PASS; automatic-only uruchamia callback Auto bez overlay, no-general nadal ma wybór i może wejść do automatycznie rozegranej sceny.
- `node tools/battle-mode-choice-labels-test.cjs` — PASS w Chromium.
- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS.
- `node ./node_modules/vite/bin/vite.js build --outDir dist-battle-mode-wiring-check --emptyOutDir` — PASS, 918 modułów; katalog testowy usunięty po buildzie.
- `git diff --check` — PASS.

Bez merge, deployu ani pushu.
