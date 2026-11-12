STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1 (zadanie #115, ZDOBYCIE-MIASTA-WIRING), runda 1
GOAL: podpiac `run_capital_capture_plunder` i akumulacje zdobyczy do produkcyjnej sciezki zdobycia stolicy (pin 07d2fbd72: main.ts:17828 -> 35558).
BAZA: 23e33793e (czubek origin/rust-port/parity-v2, zgodnie z dispatchem). Branch: wip/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1.

ZMIANY/COMMIT:
- rust-port/engine/src/domain/siege_transfer.rs: nowy wrapper `apply_capital_capture_with_plunder` (Transfer -> lost_power -> plundrowanie -> zapis zdobyczy przez `PlayableState::power_record_city_capture`), struktury `CapitalTransferArgs`, `CapitalPlunderCtx`, `CapitalCaptureResult`. Zapis zdobyczy tylko gdy plundrowanie zapisalo zdobycz (galaz eliminacji, zdobywca != barbarzynca).
- rust-port/engine/tests/p6_zdobycie_wiring.rs: nowy test (3 przypadki) z wartosciami z wektorow pinu h05, h04, h09 (plik vectors.json).
- Cargo.lock NIE commitowany (niesledzony w repo, wygenerowany przez cargo).
- COMMIT: SHA w raporcie orkiestratora (commit na wip/R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1).

TESTY:
- cargo fmt --check: EXIT 0.
- cargo clippy --all-targets -- -D warnings: EXIT 0 (po refaktorze argumentow do struktury CapitalTransferArgs).
- cargo test --lib: 99 passed, 0 failed.
- cargo test --test p6_zdobycie_wiring: 3 passed, 0 failed, 0 ignored.
- cargo test --test 'p6_siege*': wszystkie passed (w tym p6_siege_capital_plunder 3/3, p6_siege_surrender 10/10).
- CARGO_TARGET_DIR poza repo (scratchpad), CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0.

BLOKADY (jawne):
1. KRYTERIUM 1 NIESPELNIONE: brak produkcyjnego wolajacego. W engine Rust nie istnieje zadna produkcyjna sciezka zdobycia miasta (`apply_transfer_with_effects` i `resolve_surrender_path` nie maja wolajacego poza testami; patrz komentarze w playable.rs:553 i siege_transfer.rs TRANSFER_EFFECTS). Wrapper jest gotowy, ale nie ma miejsca wywolania w kodzie produkcyjnym. Wymagany osobny temat: driver zdobycia (surrender/Transfer) w produkcji, ktory wola `apply_capital_capture_with_plunder`. NIE_ZMIERZONO: numer linii produkcyjnego wolajacego.
2. KRYTERIUM 2 NIESPELNIONE w calosci: test NIE korzysta z generatora .mjs ani z kontroli SHA-256 wektorow; wartosci sa zapisane jawnie wg case'ow h05/h04/h09 z `tests/p6_siege_capital_plunder_vectors/vectors.json`. Dodanie generatora/SHA wykracza poza allowlist (tylko nowy test + siege_transfer.rs). Liczniki niepustosci: asercje na niepuste ui_calls i na zdobycze 120 (h05).
3. KOLEJNOSC ENTERCITY: wejscie garnizonu (`enterCityAfterSurrender`, `sync_city_garnizon`, `playerEverOwnedCityByOwner`) przed plundrowaniem w pinie NIE jest wolane przez wrapper (granica jawna w doc-komentarzu). Wg analizy nie wplywa na wynik plundrowania (plundrowanie nie czyta jednostek), ale kolejnosc nie jest pelna jak w pinie.
4. `lost_power` jest wejsciem wolajacego (closure po transferze, przed plundrowaniem). Pin liczy `buildObjectivePowerForOwner(oldOwner)` PO applyBarbarianAware (wewnatrz plundrowania), a ta funkcja zmienia skarbiec/techy ofiary. Wrapper NIE odtwarza tej kolejnosci; closure musi byc dostarczony przez wolajacego zgodnie z kontraktem z siege_capital_plunder.rs (temat W8). NIE_ZMIERZONO: czy wartosc z closure rowna sie wartosci z pinu w prawdziwym przebiegu.
5. Akumulator: plundrowanie zapisuje zdobycz w lokalnym `PlunderState.zdobycze_power_by_owner`; wrapper przenosi przyrost do stanu gry przez `PlayableState::power_record_city_capture` (ten sam akumulator co `WarTurnState::zdobycze_power_for`). Test potwierdza przyrost 120 dla h05 i brak przyrostu dla h04/h09.
6. Brak zmian w gra/, origin/main, rust-port/parity-v2 (nie pushowano, nie integrowano).

RUNDY: 1/5
NASTEPNY KROK: Evaluator r1 (weryfikacja: kryterium 1 i 2 niespelnione -> decyzja orkiestratora: osobny temat na driver produkcyjny i generator SHA, albo zawezenie kryteriow).
DEPLOY/PUSH: NIE WYKONANO
