STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I2-BATTLE-FRAME
GOAL: BattleFrameDto (§2b) i producent ramki po każdym `fire` w SiegeLoop; pozycje i on_wall_walkway jako wejście adaptera (L7); towers_destroyed z nowej flagi silnika (L4).
ZMIANY/COMMIT: baza `d303607bf` (Operator r1, baza tematu `585bb48e0`). Commit obrony na lokalnej gałęzi `wip/R-RUSTPORT-P4-1I2-BATTLE-FRAME-obrona-r1`, SHA w wyniku. Pliki (wszystkie na allowliście): `rust-port/engine/src/domain/siege_tactics_loop.rs` (sygnatura obserwatora i dokumentacja), `rust-port/engine/src/domain/siege_tactics_frame.rs` (`TileHpStale`), `rust-port/engine/tests/p4_1i2_frame.rs` (+asercja), `rust-port/engine/tests/p4_1i2_frame_fire.rs` (NOWY), `rust-port/view-model/src/battle.rs` (tylko komentarze), ten raport oraz kopia `02-evaluator.md` z `851816336`. Cargo.lock nie commitowany. Logika walki i kolejność kroków SiegeLoop bez zmian.
TESTY: niżej.
BLOKADY: brak. Zarzut 3 wymaga dopisku w #113 przez orkiestratora (poza allowlistą).
RUNDY: 2/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Evaluator albo Final Control na commicie obrony.
DEPLOY/PUSH: NIE WYKONANO

## Bramki (CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpad, katalog usunięty po bramkach)

| Crate | Bramka | EXIT |
|---|---|---|
| view-model | `cargo fmt --check` | 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | 0 |
| view-model | `cargo test --all-targets --no-fail-fast` | 0 (12 binarek, 0 failed) |
| engine | `cargo fmt --check` | 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | 0 (start przy 8,9 GB wolnego) |
| engine | `cargo test --all-targets --no-fail-fast` | PEŁNE, 495/495 binarek EXIT 0 (szczegóły niżej) |

Pełny test engine: dysk przed bramką 8,7 GB (≥ 8 GB). `cargo test --all-targets --no-run` EXIT 0 (495 plików wykonywalnych). Następnie `cargo test --all-targets --no-fail-fast` z limitem 585 s: przerwany przez `timeout` (EXIT 124, to limit czasu, nie błąd testu) po 259 ukończonych binarkach, wszystkie `test result: ok` (2008 passed, 0 failed). Pozostałe 236 binarek (od `p6_m09_rivals`, w trakcie którego nastąpiło przerwanie) uruchomiono bezpośrednio z tego samego katalogu `target` (cwd = `rust-port/engine`, `CARGO_MANIFEST_DIR` ustawione): 236/236 EXIT 0, 1650 passed, 0 failed, 1 ignored (istniejący `p6_order_lane`, nie z tego tematu). Razem: 495/495 binarek, 3658 passed, 0 failed.

## Odpowiedzi na zarzuty

### 1. [BLOKUJĄCY] Brak testu behawioralnego „ramka po KAŻDYM fire, stan PO kroku” — PRZYJMUJĘ

Poprawka:
- `FireObserver<B>` dostaje odpalony klocek: `FnMut(&SiegeLoop<B>, f64, LoopTimer)`. Wywołanie pozostaje jedno, po `apply`, więc logika się nie zmienia.
- Nowy test `rust-port/engine/tests/p4_1i2_frame_fire.rs`. Ciało `CountingBody` zmienia stan: `complete` odejmuje 1 HP aktywnej jednostce, a cios wieży odejmuje 0,25 HP celowi. Wartości po kroku zapisuje w dzienniku. Asercje:
  - liczba ramek jest równa liczbie odpaleń liczonej NIEZALEŻNIE od obserwatora. Odpalenia z kolejki to `clock.timer_seq − clock.timers.len()`; bitwa w budżecie się nie kończy, co sprawdza asercja, więc nic nie jest czyszczone ani `Dropped`. Do tego dochodzą odpalenia `RunNow` policzone w ciele;
  - ramki mają wszystkie rodzaje klocków: `BeginTurn`, `ActivateNext`, `BodyDone`, `TowerShot`, `TowerHit` (≥ 2 każdego). Liczba `BodyDone` jest równa liczbie `complete`, a liczba `TowerHit` liczbie ciosów;
  - stan PO kroku: ramka `BodyDone(u)` ma HP jednostki `u` z chwili po `complete`; ramka `TowerHit(t)` ma HP celu po ciosie; ramka `BeginTurn` ma `roundNo` równe poprzedniej ramce + 1;
  - zagnieżdżony `RunNow`: przy pierwszym `complete` ciało włącza `auto_batch_planning`, przy następnym je wyłącza. Daje to dokładnie jedno zagnieżdżone `ActivateNext` (wewnątrz `BodyDone`) i jeden zagnieżdżony `TowerHit` (wewnątrz `TowerShot`); oba mają ramkę, a liczba się zgadza.

Mutacje Evaluatora odtworzone na nowym kodzie (plik przywrócony z kopii, `cmp` = SAME):

| Mutacja | p4_1i2_frame (7) | p4_1i2_frame_fire (2) |
|---|---|---|
| M1: obserwator na POCZĄTKU `fire` (przed krokiem) | 7/7 ok | **2/2 FAIL** |
| M2: obserwator tylko dla `LoopTimer::BodyDone` | 7/7 ok | **2/2 FAIL** |
| bez mutacji | 7/7 ok | 2/2 ok |

Mutacje Operatora r1 (a)–(d) dotyczą plików, w których logika się nie zmieniła; testy p4_1i2_frame się nie zmieniły poza dodaną asercją w `niespojne_wejscie_adaptera_odrzucone`.

### 2. [BLOKUJĄCY, bramka] Brak pełnego `cargo test --all-targets` w engine — PRZYJMUJĘ

Bramka wykonana przy 8,7 GB wolnego: 495/495 binarek zielonych, 0 failed (szczegóły w tabeli wyżej). Pełny test uruchomiono w dwóch częściach z powodu limitu czasu polecenia 590 s; obie części użyły tych samych skompilowanych binarek.

### 3. [UWAGA] Wektor `:7648` tylko przez bezpośrednie `breach_wall_row`; brak strażnika `if (!tiles) return;` — PRZYJMUJĘ (dokumentacja) / wpis w #113 dla orkiestratora

- Pin `07d2fbd72` `battleScene.ts:7638-7648` zweryfikowany przez `git show`: `const tiles = this.terrainMap.tiles; if (!tiles) return;` (`:7639-7640`). Strażnik dotyczy mapy terenu bitwy, której `SiegeLoop` nie ma, więc należy do wołającego (adapter w #113).
- Do doc-komentarza `SiegeLoop::breach_wall_row` dopisałem jawny wymóg dla #113: (1) każdy wyłom w produkcji ma iść przez `breach_wall_row` w chwili wyłomu, bo inaczej flaga powstanie dopiero przy `:4216`; (2) strażnik `!tiles` jest po stronie wołającego, a bez mapy terenu metody nie wolno wołać.
- Dla orkiestratora: dopisać te dwa wymogi do #113 (K5LOOP-WIRING). Rejestr leży poza allowlistą tego tematu.

### 4. [UWAGA] Dwa źródła stanu muru; nadmiarowy wiersz u adaptera cicho pomijany — PRZYJMUJĘ

Nowy wariant `FrameError::TileHpStale(i32)`: adapter ma HP dla wiersza, którego nie ma wśród żywych kafli pętli. Zbiór żywych kafli wyznacza pętla (`wall_tile_rows`), a adapter podaje tylko HP. Klucze `wall_tile_hp` muszą się zgadzać z tym zbiorem w obie strony (`TileHpMissing` / `TileHpStale`); opisuje to doc `FrameInput::wall`. Test w `niespojne_wejscie_adaptera_odrzucone`: po `breach_wall_row(2)` z adapterem mającym `{2, 4}` producent zwraca `Err(TileHpStale(2))`.

### 5. [UWAGA] Kolejność ramek przy zagnieżdżonym `RunNow` — PRZYJMUJĘ (dokumentacja + test)

Kolejność jest udokumentowana w `FireObserver`: ramka odpalenia zagnieżdżonego poprzedza ramkę zewnętrznego, obie mają to samo `vNow`, a ramka zewnętrzna pokazuje stan po obu krokach. Wynika to z synchronicznego callbacku `_schedule` w pinie (`:9595-9606`). Test `ramka_po_kazdym_odpaleniu_stan_po_kroku` sprawdza oba przypadki:
- `ActivateNext` (RunNow) stoi bezpośrednio przed `BodyDone` pierwszej jednostki, z równym `vNow`, i obie ramki mają HP po `complete`;
- `TowerHit` (RunNow) stoi bezpośrednio przed `TowerShot`, z równym `vNow`, a jednostki w obu ramkach są identyczne.

### 6. [UWAGA, drobne] `LengthMismatch` dla duplikatów; `floor` w `non_negative` — ODRZUCAM (z dopiskiem komentarzy)

- Duplikaty: `ViewError` jest zdefiniowany w `rust-port/view-model/src/validate.rs`, który NIE jest na allowliście dispatchu (jest tylko `battle.rs`). Konwencja jest istniejąca: `BattleOutcomeDto::validate` na bazie `585bb48e0` (`battle.rs:293-304`, pole `{name} (unique)` w `:300`; temat I1B `991556084`) zgłasza duplikaty `attackerUnitIds`/`defenderUnitIds` przez `LengthMismatch { field: "… (unique)", expected: distinct, actual: len }`. Nowy kod używa tego samego wzorca i pola `(unique …)`. Dedykowany wariant to zmiana kontraktu `ViewError` poza zakresem tematu. Dopisałem komentarz z uzasadnieniem.
- `floor`: wybór celowy. Dla skończonego `v < 0` `floor(v) ≤ −1 < min = 0`, więc zgłoszona `value` sama leży poza `min..=max`. `trunc(-0.5) = 0` wyglądałoby na wartość w zakresie. To ta sama konwencja co istniejące `survivors[i].hp` (`ceil` dla progu `min = 1`, `battle.rs:265-273` na bazie, `:267`). Dopisałem komentarz.
