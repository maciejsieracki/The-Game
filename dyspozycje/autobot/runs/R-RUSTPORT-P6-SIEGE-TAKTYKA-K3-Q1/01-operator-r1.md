STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K3-Q1 (klocek K3: wieże — _siegeRamTowerStep, _trySiegeTowerClimb, _siegeInfantryToTowerStep; runda 1/5, Operator)
GOAL: port czystej części decyzyjnej trzech funkcji wież do `domain/siege_tactics_tower.rs` na modułach K0b/K1/K1b (bez duplikacji marszu i BFS); wektory z WYKONANIA tekstu pinu `07d2fbd72`; efekty sceny jawnie w `TowerEvent`; wiersz 30 planu zaktualizowany.
ZMIANY/COMMIT:
- Baza: `7276ed3da` (FC K1b, kod `8241dcaa9`), wykonana jako detached checkout. Uwaga: zadanie orkiestracji podawało `origin/rust-port/parity-v2` (f207ea6b1 lub nowszy), ale `siege_tactics_walk.rs` (K1b) nie istnieje na parity-v2 (`81e7840ba`); K3 wymaga K1b, więc przyjęto bazę z dispatchu.
- Nowe: `rust-port/engine/src/domain/siege_tactics_tower.rs` (decyzja + mapowanie zdarzeń; korzysta z `bfs_first_step`, `siege_walk_to`, `do_move_gate` z K1b i `ApproachUnit`/`ApproachWallState`/`siege_move_refused` z K1).
- Nowe: `rust-port/engine/tests/p6_siege_tactics_tower_gen.mts` (generator; wykonuje linie pinu battleScene.ts 326-337, 661-662, 1011, 1043, 1552-1565, 1648, 1797, 7402-7406, 7939-7970, 7973-8103, 8686-8693 oraz city-fortification.ts 96-98; straznik SHA-256 `cd4b2e5157b4ae26bfc89924f85cefac3f290e145374effde66a81fdc69b5d36`).
- Nowe: `rust-port/engine/tests/p6_siege_tactics_tower_vectors/vectors.json` (1560 przypadków, md5 `e38a24247e9419a4072ef4d290822693`).
- Nowe: `rust-port/engine/tests/p6_siege_tactics_tower.rs` (12 testów).
- Zmienione: `rust-port/engine/src/domain/mod.rs` (1 linia: rejestracja `pub mod siege_tactics_tower;`), `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (wiersz 30; PARTIAL z listą brakujących).
- Nie zmieniono: K0b/K1/K1b (moduły i testy), `siege_tactics_walk.rs`/`approach.rs`/`move.rs` (API wystarczające), `gra/**`, `origin/main`, `WERSJE.md`, `Cargo.toml`, `Cargo.lock` (wygenerowany przez build, NIE w commicie).
- Commit kodu: SHA w sekcji DEPLOY/PUSH (commit raportu jest drugi, wskazuje SHA kodu).
TESTY:
- `cargo fmt --check`: czysto (bez diffów).
- `cargo clippy --all-targets -- -D warnings`: czysto.
- `cargo test --lib`: 48 passed.
- `cargo test --test p6_siege_tactics_approach`: 5 passed.
- `cargo test --test p6_siege_tactics_approach_k1`: 8 passed.
- `cargo test --test p6_siege_tactics_walk`: 7 passed (K1b bez zmian).
- `cargo test --test p6_siege_tactics_end`: 8 passed.
- `cargo test --test p6_siege_tactics_tower`: 12 passed (w tym `wektory_wiez_zgodne_z_wykonanym_pinem` na 1560 przypadkach oraz `kazda_galaz_ma_pokrycie_w_wektorach`).
- Kontrola czułości (mutacja, cofnięta): zmiana progu bramki `<= 1` na `<= 0` w `siege_ram_tower_step` -> 2 testy FAIL (`taran_przy_bramie_atakuje_bez_marszu`, `wektory_wiez_zgodne_z_wykonanym_pinem`). Plik przywrócony i zweryfikowany `cmp`.
- Generator: `node --experimental-strip-types rust-port/engine/tests/p6_siege_tactics_tower_gen.mts` (z `TOWER_GEN_SCRATCH` poza repo) — hash zgodny, 1560 przypadków.
- Liczniki gałęzi (kategorie z wyjść pinu, zgodne z `meta.categories` i sprawdzone po stronie Rust):
  - wartość zwracana: ram true 232 / false 288; climb true 314 / false 206; infantry true 323 / false 197.
  - zdarzenia: attackGate 36, advance 11, addRow 73, move 337, schedule 161, done 822, gate(proceed) 337.
  - wylom: breach:first 279, log:wylom 279; nan:moveLeft 59 (wyłącznie wejście na mur).
  - gate:refused = 0 (patrz BLOKADY).
- Odpowiedniki dyspozycji: wektory ≥ 500 (1560); odmowy: strukturalnie 0 w tych trzech funkcjach; granice: brzeg siatki (`bfs_omija...`), wallCol = -1, wallBase < 0; NaN: `moveLeft = NaN` przy wejściu na mur (`wspinaczka_z_nan_zeruje_ruch`), Inf: nie testowane (nie pojawia się w tych ścieżkach).
- Bramka `df >= 8 GB`: przed startem 10 GB wolne (`/dev/vda`, 75% użyte); cel bramki spełniony.
BLOKADY:
- Odmowa bramki (`_siegeMoveRefused` -> `_doMove` refusal) jest strukturalnie niedostępna w trzech funkcjach: `_siegeRamTowerStep` dotyczy jednostek oblężniczych (zawsze poza ograniczeniem), a `_siegeInfantryToTowerStep` wychodzi wcześniej bez wież. Odmowa jest pokryta w K1 (`siege_move_refused`) i K1b (`do_move_gate`).
- Pokrycie linii pinu NIE_ZMIERZONO (brak V8 coverage); liczniki gałęzi to kategorie z wyjść, nie pomiar linii.
- Klasyfikatory `isSiegeUnit` / `isSiegeTower` / `_isRam` / `canShoot` są wejściami (flagi wyliczone przez pinowy kod w harnessie); ich port 1:1 (`normName`, `stats`) to osobny temat (wiersze 27-28 planu).
- Efekty sceny poza portem (jawnie): `_doMove` poza bramką (koszt jako wejście, animacja, facing), `_schedule` (harness: synchroniczne cb), `_attackGate`, `_advanceToward` (zdarzenie bez `done`), `_siegeShooterThreats` (lista wejściowa), `cellToWorld`.
- NaN `moveLeft` w marszu zapętla się w pinie (ruch bez końca), więc marsz w wektorach ma wyłącznie skończone `moveLeft`; NaN testowany tylko w `_trySiegeTowerClimb`.
- `_siegeSafeApproach` pozostaje jak w K1 (nie w zakresie K3).
RUNDY: 1/5 (Operator).
NASTĘPNY KROK: Evaluator (Sonnet) na tej gałęzi roboczej; następnie Final Control. Orkiestrator decyduje o integracji; ten etap nie integruje ani nie pushuje.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej; brak push, brak integracji, brak zmian w `rust-port/parity-v2`).
