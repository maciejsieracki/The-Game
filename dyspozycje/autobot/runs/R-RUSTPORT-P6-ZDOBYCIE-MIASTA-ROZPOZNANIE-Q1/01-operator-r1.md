STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 (rozpoznanie zdobycia miasta #115/#175 i drugiej ścieżki przegranej po utracie miasta w bitwie)
GOAL: Dla każdego miejsca zdobycia miasta z pina 07d2fbd72 (bitwa, dyplomacja, kapitulacja) ustalić odpowiednik w Rust i status; wskazać braki i plan tematów wykonawczych. Bez zmian kodu.
ZMIANY/COMMIT: tylko dokumenty. Allowlista: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (nowy) oraz `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1/**`. Brak zmian w `src/**`, `tests/**`, `gra/**`, `Cargo.*`. SHA commitu: w raporcie operatora (gałąź wip/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1).
TESTY: NIE DOTYCZY (zmiany wyłącznie dokumentacyjne; brak uruchomienia cargo).
BLOKADY: brak blokad procesowych. NIE_ZMIERZONO: pełna semantyka `applyMapBattleOutcome` (pin 34431–~34700) i jej odpowiednik w Rust; wołający poza `rust-port/` (`src-tauri/`, `gra-robocza/`); mapowanie `playerEverOwnedCityByOwner` na stan Rust; wpływ #106 i #120 na kolejność wojny przy zdobyciu.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o kolejności tematów Z1–Z7 z sekcji 4 raportu rozpoznania (proponowana: Z1 → Z2/Z3/Z7 → Z4/Z5 → Z6). Przed startem tematu z kodem Rust: wolne ≥ 8 GB na `/` (obecnie 8,9 GB).
DEPLOY/PUSH: NIE WYKONANO

## Wynik rozpoznania (skrót)

Pin: `07d2fbd72:gra/src/main.ts`. Potwierdzone węzły: `applyCityCaptureToMap` 36034 (wywołuje `runCapitalCapturePlunder` 36221), `captureCityWithoutBattle` 36368, `runCapitalCapturePlunder` 35558, `resolveSiegeSurrender` 17662 (plądrowanie 17828), `transferCityByTreaty` 36449 (cesja bez plądrowania; komentarz 36401–36404), gałąź zdobycia w `applyMapBattleOutcome` 34656–34679, `sprawdzPrzegranaPoUtracieMiasta` 34017 (checkDefeat 34018–34025).

Rust (poza `tests/`):
- `apply_transfer_with_effects` — `rust-port/engine/src/domain/siege_transfer.rs:340`: PORT-NIEPODPIĘTY (brak wołającego w produkcji; `playable.rs:553` jawnie).
- `run_capital_capture_plunder` — `siege_capital_plunder.rs:504`: PORT-NIEPODPIĘTY.
- `record_city_capture_event` — `siege_capture_events.rs:182`: PORT-NIEPODPIĘTY.
- `check_defeat` — `victory.rs:261`, `check_victory` — `victory.rs:273`: PORT-NIEPODPIĘTY (wołający tylko w module i testach).
- `handle_siege_capitulation_phase` — `siege_surrender.rs:119`, `resolve_surrender_path` — `siege_surrender.rs:171`: PORT-NIEPODPIĘTY.
- `can_capture_empty_city` — `barbarians.rs:551`: predykat, bez odpowiednika `captureCityWithoutBattle`.
- `power_record_city_capture` — `playable.rs:554`: BRAK wołającego w produkcji.
- BRAK: `applyCityCaptureToMap` (producent zdobycia), `captureCityWithoutBattle`, gałąź zdobycia bitwy (W1), `transferCityByTreaty` / cesja (`cession`, `transfer_city` nieobecne).

Pełna tabela W1–W14 z plik:linia po obu stronach, lista braków i plan Z1–Z7 z zależnościami są w `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1-ROZPOZNANIE.md`. Liczby rund w planie są szacunkiem, nie pomiarem.
