STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1 (zadanie #115), obrona Operatora po zarzutach Evaluatora, runda 1
GOAL: podpiac `run_capital_capture_plunder` i akumulacje zdobyczy do produkcyjnej sciezki zdobycia stolicy (pin 07d2fbd72: main.ts:17828 -> 35558).
BAZA: 23e33793e (zgodnie z dispatchem). Commit obrony nalezy do detached HEAD na 5b4d41f2a (gałąź `wip/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1` jest zajęta przez inny worktree; nie przełączano).
ZMIANY/COMMIT: SHA obrony w sekcji „COMMIT” ponizej. Zmieniono wylacznie `rust-port/engine/tests/p6_zdobycie_wiring.rs` (przepisany test) i ten raport. `siege_transfer.rs` NIE zmieniony w tej rundzie. Cargo.lock nie commitowany.

## Odpowiedzi na zarzuty

### Zarzut 1 (kryterium 1: brak produkcyjnego wolajacego `run_capital_capture_plunder`): PRZYJMUJE
Dowod (grep po `rust-port`, `*.rs`): `apply_capital_capture_with_plunder` nie ma zadnego wolajacego poza definicja i testem; `run_capital_capture_plunder` wolany tylko przez wrapper i testy; `apply_transfer_with_effects` wolany tylko w `siege_transfer.rs` i testach. Brak produkcyjnego drivera zdobycia miasta w engine (zaleznosc W8). Dopisanie drivera wymaga plikow poza allowlista. Kryterium 1 NIESPELNIONE. Numer linii produkcyjnego wolajacego: NIE_ZMIERZONO (nie istnieje).

### Zarzut 2 (generator .mjs i straznik SHA-256 wektorow; liczniki niepustosci): CZESCIOWO PRZYJMUJE
- ODRZUCAM zarzut, ze wartosci sa wpisane recznie bez zwiazku z wektorami: generator `tests/p6_siege_capital_plunder_gen.mjs` istnieje i wygenerowal `vectors.json`. Nowy test czyta `vectors.json` przez `include_str!` i pobiera z niego wszystkie wejscia i oczekiwania (`pin_case`), bez wartosci wpisanych w kodzie testu.
- PRZYJMUJE brak straznika SHA-256: `Cargo.toml` nie ma zaleznosci `sha2`/`sha256`; dodanie jej lezy poza allowlista. Kryterium „strazniak SHA-256” NIESPELNIONE.
- PRZYJMUJE i NAPRAWIAM liczniki niepustosci: test asertuje, ze wektor pinu ma niepusta liste `calls` i ze wrapper zwraca niepusta liste `ui_calls`.

### Zarzut 3 (test h09 nie odtwarza wejscia pinu; asercja treasury(-1)==0 trywialna): CZESCIOWO PRZYJMUJE
- PRZYJMUJE: stary test uzywal `player_store` bez wpisu dla -1 i miasta o populacji 9. NAPRAWIONO: wejscie czytane z pinu (store -1: skarbiec 20, praca 5, nauka 7, techy {b}; populacja 12; cap {0:40,-1:50}). Asercja: `store.get_treasury(-1) == 20` (pin, bez zmian) oraz `treasury(2) == 0`.
- ODRZUCAM zarzut o `elimination.is_none()` jako bezpodstawnej: pin h09 ma `"ret": null` (main.ts:35722 i dalej nie zwraca szczegolow). Kod zwraca `Some` tylko gdy `new == 0 && !is_triumph` (siege_capital_plunder.rs, koniec `run_capital_capture_plunder`), wiec dla zdobywcy-barbarzyncy `None` jest zgodne z pinem.

### Zarzut 4 (lost_power podawane przez closure; kolejnosc wzgledem applyBarbarianAware nie odtworzona): PRZYJMUJE jako realne ryzyko, NIEZAMKNIETE
Dowod z pinu (`git show 07d2fbd72:gra/src/main.ts`): `applyBarbarianAwareCapitalCapturePlunder` w linii 35611 mutuje skarbiec i techy ofiary, a `const lostPower = buildObjectivePowerForOwner(oldOwner).power` jest w linii 35672, czyli PO tej mutacji. Wrapper wola closure `lost_power()` PRZED `run_capital_capture_plunder`, wiec kolejnosci nie odtwarza. Naprawa wymaga zmiany kontraktu `run_capital_capture_plunder` (closure zamiast wartosci, wolane po `apply_barbarian_aware...`) i aktualizacji `tests/p6_siege_capital_plunder.rs` (poza allowlista). Wplyw na wynik: NIE_ZMIERZONO (nie sprawdzono, czy `buildObjectivePowerForOwner` czyta skarbiec lub techy ofiary). Test uzywa stalej 120 z wektora, wiec nie wykrywa tego bledu.

### Zarzut 5 (wejscie garnizonu `enterCityAfterSurrender` / `sync_city_garnizon` nie wolane przed plundrowaniem): PRZYJMUJE
Granica byla jawna w doc-komentarzu wrappera. Kryterium „kolejnosc zgodna z pinem” NIESPELNIONE. Wolanie lezy poza allowlista (inny modul); nie dodawano.

### Zarzut 6 (`zdobycze_recorded = (after != seed)`; brak testu dla lost_power = 0): CZESCIOWO PRZYJMUJE
- ODRZUCAM zarzut o rozjechaniu z pinem: w `run_capital_capture_plunder` akumulacja jest tylko w galezi eliminacji (po `return` dla PrzejecieStolicy) i tylko przy `power_gain > 0.0`. Pin: main.ts:35674 `if (powerGain > 0)`. Dla skonczonych wartosci `after != seed` jest rownowazne `power_gain > 0`.
- PRZYJMUJE brak testu dla lost_power = 0: w wektorach pinu nie ma takiego przypadku (h21 ma lostPower 120), a test na wymyslonym wejsciu nie bylby dowodem zgodnosci z pinem. Nie dodawano.

### Zarzut 7 (test porownuje tylko wybrane pola; brak asercji na main.store, ui_calls, slot, spectacle, capitalMap): PRZYJMUJE i NAPRAWIAM
Nowy test porownuje z wektorem pinu: stan ekonomii wszystkich 6 wlascicieli (skarbiec, praca, nauka, techy, zywnosc), `zdobycze` Power, `ret` (eliminacja), `slot` raportu, `spectacle`, mape stolic oraz cala sekwencje `ui_calls` (fn + args po normalizacji liczb) wzgledem `calls` z pinu. h04 teraz sprawdza tez nauke i techy.

## Testy (EXIT kodow)
- `cargo fmt --check` (caly crate): EXIT 0 (po `rustfmt --edition 2021` na tescie).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: 99 passed, 0 failed, 0 ignored.
- `cargo test --test p6_zdobycie_wiring`: 3 passed (`pin_h04_...`, `pin_h05_...`, `pin_h09_...`), 0 ignored.
- `cargo test --test 'p6_siege*'`: wszystkie passed.
- CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (scratchpad), usuniety po bramkach.

## BLOKADY (jawne, stan po obronie)
1. Kryterium 1: brak produkcyjnego wolajacego `apply_capital_capture_with_plunder` / `run_capital_capture_plunder` (zalezne od drivera zdobycia = W8, poza allowlista). NIESPELNIONE.
2. Kryterium 2: brak straznika SHA-256 wektorow (brak zaleznosci sha2; poza allowlista). Generator i odczyt wektorow SA zrobione. CZESCIOWO.
3. Kolejnosc `lost_power` wzgledem `applyBarbarianAware` (pin 35611 vs 35672) nie jest odtworzona; wymaga zmiany kontraktu plundrowania. NIEZAMKNIETE.
4. Wejscie garnizonu przed plundrowaniem nie jest wolane (granica jawna). NIEZAMKNIETE.
5. Brak testu lost_power = 0 (brak wektora pinu). NIE_ZMIERZONO.

RUNDY: 2/5 (runda 1 = Operator r1, obrona = runda 2 tego samego ID; obrona nie zmienia werdyktu Operatora)
NASTEPNY KROK: Evaluator r2 na commicie obrony. Decyzja orkiestratora: (a) osobny temat na driver zdobycia (W8) z wpieciem wrappera i zmiana kontraktu `lost_power` na closure po `applyBarbarianAware`, albo (b) zawezenie kryteriow 1 i 2 do „wrapper + test wektorowy” z jawnym odlozeniem driver/SHA.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji; detached HEAD, bez zmian w `gra/`, `origin/main`, `rust-port/parity-v2`).
