# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — domknięcie `ProdBody`: wszystkie gałęzie `_activateUnit` wykonane, `update_facing` prawdziwy (K5LOOP, ścieżka odblokowania I5)

STATUS: dispatch orkiestratora. Opus na wszystkich etapach (zlecenie właściciela 2026-11-17: zdejmować blokady tematów 3D autonomicznie, dziś wszystko 3D na Opus; ten temat jest blokadą I5 #280/#336). Decyzje techniczne podejmuje orkiestrator (reguła 8); web najpierw (reguła 11): każdy port czyta kod webu z pinu `07d2fbd72` (`git show`/`git grep` na `gra/src/battle/battleScene.ts` i pokrewnych), nic nie zgaduj.
BAZA: `origin/rust-port/parity-v2` (aktualny; wpisz SHA w raporcie; w chwili pisania `0f77c9da3`). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Produkcyjne ciało bitwy oblężniczej `ProdBody` (`rust-port/engine/src/domain/siege_tactics_loop.rs`) nadal ma dwie jawne luki, które blokują wpięcie pętli (#113) i akcje oblężnicze I5:
1. `ProdMoveWorld::update_facing` jest no-op (~linia 1224; „znany dług #107, decyzja r4"): po każdym kroku ruchu (`_doMove`: `battleScene.ts:8709`, `:8751`) pin wywołuje `_updateFacing`. Zrób go prawdziwego: użyj już zaportowanych `nearest_enemy`/`update_facing` z `ProdBody` (`nearest_enemy_pos` ~1044, ścieżka `ActivateEvent::UpdateFacing` ~1623, commit `923540b65`) tak, by ruch ustawiał `facing` jak w pinie (łuk trafienia `relative_hit` zależy od facing).
2. W `ProdBody::start` (~linie 1614-1640) zdarzenia `ActivateEvent` spoza listy (`other => skipped.push(prod_tag(other))`) trafiają do `self.unported` i jednostka nie wykonuje akcji (ucieczka po okrążeniu, marsz, kawaleria, falanga, odwrót, strzelec itd.). Zbadaj, które warianty `ActivateEvent` (`siege_tactics_activate.rs`) realnie trafiają do `skipped` i dla KAŻDEGO z nich: wykonaj akcję wg pinu przy użyciu zaportowanych modułów (`siege_tactics_advance`, `_cavalry`, `_approach`, `_move_effects`, `_doctrine_*`, `_actions`, `_blow*`, `_breach` — to są gotowe klocki T4/T5/T6/T7), albo — jeśli wariant jest w pinie nieosiągalny w kontekście `ProdBody` — udowodnij to z linii pinu i zostaw jawną, uzasadnioną asercję (nie ciche pominięcie).
Cel końcowy: `ProdBody::unported` jest puste dla wszystkich scenariuszy wektorowych z pinu, a `p6_siege_tactics_loop*` pokrywają każdą dotychczas pominiętą gałąź wektorem z pinu.

## KOLEJNOŚĆ I ZAKRES RUND
Rundy 1-5 tego samego ID. Runda 1: (a) rozpoznanie tabelą `wariant ActivateEvent | trafia do skipped? | linia pinu | gotowy klocek Rust | plan` (zapisz w `01-operator-r1.md`), (b) pkt 1 (`update_facing` po ruchu) z wektorami, (c) tyle gałęzi z pkt 2, ile mieści się w rundzie, w kolejności: ruch pieszego (`AdvanceStep`), odwrót falangi (`FallBackStep`), kawaleria (`CavalryAction`), strzelec; reszta = jawna lista w raporcie i runda 2. Nie zostawiaj gałęzi ukrytych: każdy `unported` ma tag w raporcie.

## ZASADY DECYZYJNE (D-K5C)
- D-K5C-1: facing ustawiany WYŁĄCZNIE tak jak w pinie (po kroku w `_doMove`, plus istniejące `UpdateFacing`); zakaz własnej heurystyki.
- D-K5C-2: RNG tylko przez wstrzyknięty `RollSource` jak dotąd; kolejność rzutów jak w pinie; wektory z pinu muszą zgadzać się co do liczby i kolejności rzutów.
- D-K5C-3: zakaz zmiany zachowania zaportowanych modułów (T4/T5/T6/T7, blow, outcome); wolno tylko je WOŁAĆ z `ProdBody` i dodać cienkie adaptery wejść/wyjść.
- D-K5C-4: jeśli gałąź wymaga stanu, którego `ProdUnit`/`ActivateScene` nie niesie, dodaj pole z domyślną wartością zgodną z pinem i test; wypisz w raporcie.
- D-K5C-5: jeśli okaże się, że jakaś gałąź w pinie zależy od UI/czasu rzeczywistego (np. `setTimeout`/animacje), zasymuluj jak dotąd wirtualnym zegarem (`siege_tactics_clock`) zgodnie z istniejącym wzorcem K5E; nie wymyślaj nowego.

## PIN (pin = `07d2fbd72`)
`gra/src/battle/battleScene.ts`: `_doMove` 8709/8751, `_updateFacing`, `_nearestEnemy`, `_activateUnit`, `_advanceStep`, `_fallBackStep`, `_cavalryAction`, `_rangedAction`, `_phalanxAction` (numery weryfikuj `git grep -n` na pinie — numery z dispatchu mogą się przesunąć). Rust: `engine/src/domain/siege_tactics_*.rs`, testy `engine/tests/p6_siege_tactics_loop*`, `p6_k5doc_*`, `p6_k5loop_*`.

## WEKTORY / TESTY
Generator wektorów w stylu istniejących (`p6_siege_tactics_loop_body_gen.mjs` lub najbliższy: wykonuje TEKST pinu, nie reimplementację; strażnik SHA pinu). Nowe wektory `rust-port/engine/tests/p6_k5loop_close_vectors/`, test `rust-port/engine/tests/p6_k5loop_close.rs`. Każdy wektor z `plik:linia` pinu. Asercja końcowa: `unported` puste dla wszystkich scenariuszy z wektorów, które miały `unported`.
Mutacje FAIL: (a) `update_facing` po ruchu wyłączone, (b) pominięcie jednej z dołączonych gałęzi (każda osobno), (c) zmieniona kolejność rzutów RNG w jednej gałęzi.

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs`; cienkie adaptery w `siege_tactics_inputs_pos.rs`, `siege_tactics_move_effects.rs` (tylko jeśli konieczne — wypisz); nowe `rust-port/engine/tests/p6_k5loop_close*` i generator; istniejące wektory `p6_siege_tactics_loop*` tylko dopisywane (nie osłabiać); katalog runs. Zakaz: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, osłabianie/usuwanie asercji, `#[ignore]`, push do parity.

## BRAMKI (EXIT 0)
`cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_k5loop_close`; `cargo test --test 'p6_siege*'`; pełny `cargo test --all-targets --no-fail-fast` (engine; >10 min: w tle `setsid nohup` z zapisem EXIT do logu). Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunąć po bramkach. Dysk >= 8 GB przed pełną bramką; mniej -> BLOCK INFRA z liczbą GB.

## KRYTERIA KOŃCA
Zielone bramki, mutacje dają FAIL, tabela wariantów `ActivateEvent` w raporcie, lista gałęzi jeszcze nie zrobionych (jeśli runda niepełna) z linią pinu. Commit jawnym `git add` z allowlisty, bez linii `Co-Authored-By` z nazwą modelu (#289). Raport `01-operator-r1.md` w kontrakcie (STATUS, DOMAIN, TEMAT, GOAL, ZMIANY/COMMIT, TESTY, BLOKADY, RUNDY, NASTĘPNY KROK, DEPLOY/PUSH: NIE WYKONANO). Po FC PASS następny temat ścieżki: K5LOOP-WIRING (#113), potem I5.
