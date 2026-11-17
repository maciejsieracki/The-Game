# R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 — Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2
GOAL: addytywna komenda mostu JSON `GetRenderLayers` (D-364-2), bez `StateChanged`, `CONTRACT_VERSION` = 1, eksploracja kumulowana w sesji poza `EngineState`.
BAZA: kod Operatora `201e70d15` (rodzic `1508eda34` = `origin/rust-port/parity-v2`), raport Evaluatora `fa97473fd` (PASS-WITH-NOTES).

## ZMIANY/COMMIT

- `rust-port/engine/tests/p4_364_bridge_layers.rs` (+48): nowy test `execute_get_render_layers_bezposrednio_kumuluje_i_zwraca_niezmieniony_stan` (odpowiedź na uwagę 5/6 Evaluatora).
- Ten raport.
- Kod produkcyjny (`bridge.rs`, `dto_bridge.rs`, `playable.rs`) bez zmian względem `201e70d15`.
- SHA: podany w wyniku etapu (commit „Obrona Operatora r1” na gałęzi `obrona-p4-364-bridge-layers-r2`, rodzic `201e70d15`).

## Odpowiedzi na zarzuty

| # | Zarzut / uwaga | Odpowiedź |
|---|---|---|
| Z0 | Ocena kodu `648ea087c/201e70d15`, rodzic `1508eda34` | PRZYJMUJĘ (potwierdzenie, nie zarzut). Obrona buduje na `201e70d15`. |
| Z1 | Bramki: fmt/clippy/test celu/pełny engine zielone; pierwszy EXIT 101 tylko przez sparse worktree bez `dyspozycje/`; src-tauri NIE_ZMIERZONO | PRZYJMUJĘ. Dowód Evaluatora: `p6_m00_skeleton` i `p6_m16_doc` czytają pliki z `dyspozycje/autobot/runs/...`, po dodaniu katalogu EXIT 0. To artefakt środowiska, nie kodu. `src-tauri` `cargo check --offline` nadal NIE_ZMIERZONO (brak crate `tauri` w indeksie offline). |
| Z2 | Mutacje (a)–(d) dają FAIL, allowlista OK, brak `#[ignore]`, brak usuniętych asercji | PRZYJMUJĘ (potwierdzenie). Nowy test nie osłabia żadnej asercji. Dodaje jedną nową mutację, opisaną niżej. |
| U1 | `from_state` resetuje mgłę sesji. Web zapisuje i odtwarza `exploredByHuman` (`main.ts:37229-37239`, `:46394`) | PRZYJMUJĘ jako dług, bez zmiany kodu w tym temacie. D-364-2 wprost zabrania wejścia `ExploredByHuman` do `EngineState`, zapisu i snapshotu, więc trwałość mgły to osobny temat (zapis/wczytanie P6.20–P6.22). `REJESTR-RUST.md` jest poza allowlistą Operatora. Proponowany wpis dla orkiestratora: „DŁUG-364-FOG-SAVE: `exploredByHuman` w zapisie/wczytaniu wg `main.ts:37229-37239` i `:46394`; dziś `PlayableGame::from_state` → `PlayableFogSession::for_new_game` (pusta eksploracja)”. |
| U2 | Heks startu = stolica, a web bierze `startPlacements.playerStart` (D-364-R2-3) | PRZYJMUJĘ jako dług. W pionowym wycinku stolica istnieje od tury 1, więc dla nowej gry `playerStart` = heks stolicy i wynik jest ten sam. Rozjazd pojawi się dopiero razem z fazą „czeka na pierwsze miasto” (osadnik bez miasta) i wtedy trzeba przenieść realny `playerStart`. Proponowany wpis do rejestru: „D-364-R2-3: heks startu = stolica fotela; przenieść `startPlacements.playerStart` przy fazie AWAITING-FIRST-CITY”. Bez zmiany kodu. |
| U3 | `seat: Some(id)` przyjmuje fotel AI; web `ME()` jest zawsze ludzki | PRZYJMUJĘ jako dług, bez zmiany kodu. Zaostrzenie do `is_human` złamałoby wymagany przez dispatch test (b) (`seat: Some(2)` daje inną mgłę). Most nie ma dziś drugiego fotela ludzkiego (brak hot-seatu), więc fotel 2 to jedyny sposób, żeby sprawdzić, że `seat` nie jest ignorowany. Proponowana decyzja do rejestru: „D-364-R2-4: walidacja `seat` = gracz istnieje; zaostrzenie do fotela ludzkiego w temacie hot-seat (test (b) przejdzie wtedy na drugi fotel ludzki)”. |
| U4 | Root `tests/bridge_contract.rs` ma niewyczerpujący `match` na `BridgeResult`; żaden manifest go nie kompiluje | PRZYJMUJĘ jako osobny temat porządkowy, bez zmiany w tym temacie. Dowód (za Evaluatorem): brak root `Cargo.toml`, `src-tauri/Cargo.toml` bez `[[test]]` wskazującego ten plik, więc plik nie jest kompilowany. Dispatch pozwala ruszać pliki spoza allowlisty tylko wtedy, gdy kompilacja tego wymaga, a tu nie wymaga. Proponowany temat: „PORZĄDEK-BRIDGE-CONTRACT-ROOT: usunąć martwy `tests/bridge_contract.rs` albo podpiąć go z dodaną gałęzią `RenderLayers`”. |
| U5/U6 | Ścieżka `CivEngineAdapter::execute(GetRenderLayers)` poza `EngineBridge::handle` bez testu | PRZYJMUJĘ, z poprawką. Nowy test `execute_get_render_layers_bezposrednio_kumuluje_i_zwraca_niezmieniony_stan` sprawdza: (1) `execute` zwraca `EngineState` identyczny z tym sprzed zapytania (JSON), (2) `adapter.state()` bez zmian, (3) eksploracja fotela 1 rośnie z pustej do niepustej, (4) kolejne `render_layers(None)` = `build_view_layers` na eksploracji z (3), (5) nieznany fotel `Some(999)` przez `execute` → `EngineRejected`. **Mutacja:** gałąź `execute` → no-op (`let _ = seat;`) daje FAIL nowego testu (`p4_364_bridge_layers.rs:463`, „execute(GetRenderLayers) kumuluje eksploracje”), 12 passed / 1 failed. Po przywróceniu: 13/13. |
| U5b | `#[allow(clippy::large_enum_variant)]` na `BridgeResult` | PRZYJMUJĘ (Evaluator akceptuje). Boxowanie `State` zmieniłoby wzorzec `BridgeResult::State { state }` u konsumentów, więc nie byłoby addytywne. Komentarz z uzasadnieniem jest w kodzie. |

## TESTY (ta runda)

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo), `--offline`. Dysk: 14 GB wolne.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --offline --all-targets -- -D warnings` (engine) | EXIT 0 (`Finished`, brak ostrzeżeń) |
| `cargo test --offline --test p4_364_bridge_layers` | EXIT 0: 13 passed / 0 failed / 0 ignored (12 dotychczasowych + 1 nowy) |
| Mutacja U6 (`execute` GetRenderLayers → no-op) | FAIL: 1 test (nowy), przywrócone, `git diff` pokazuje tylko plik testu |
| Pełny `cargo test --all-targets` (engine) | NIE_ZMIERZONO w tej rundzie. Kod produkcyjny jest bajt w bajt ten sam co w `201e70d15`, gdzie Evaluator zmierzył 3927/0/1. Zmienił się tylko jeden plik testu integracyjnego (osobny binarny cel), a ten cel przeszedł 13/13. `clippy --all-targets` skompilował wszystkie cele. |
| `src-tauri` `cargo check` | NIE_ZMIERZONO (brak `tauri` offline) |

Po bramkach `CARGO_TARGET_DIR` usunięty. `Cargo.lock` nie był commitowany.

## BLOKADY

Brak. Długi U1–U4 przekazuję orkiestratorowi do `REJESTR-RUST.md`, bo ten plik jest poza allowlistą Operatora.

## RUNDY

1/5 (obrona po Evaluatorze r1)

## NASTĘPNY KROK

Final Control na commicie obrony (kod `201e70d15` + test U6).

## DEPLOY/PUSH

NIE WYKONANO.
