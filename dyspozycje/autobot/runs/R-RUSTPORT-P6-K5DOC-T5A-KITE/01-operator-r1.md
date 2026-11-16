STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T5A-KITE (#257, K5DOC-T5a STRZELEC-KITE), runda 1, rola Operator
GOAL: czyste funkcje galezi KITE strzelca (`_bestKiteShotStep`, `_nearestEnemyMelee`, `_enemiesOf`, warunek galezi 1 z `_rangedAction`, `MELEE_SAFE_GAP`) portowane 1:1 z pinu `07d2fbd72` i sprawdzone wektorami wykonanymi z tekstu pina; cialo galezi (T5b/T8) i wpiecie w `ActivateOps` poza zakresem.
BAZA: `origin/rust-port/parity-v2` = `2edc808d7` (worktree detached od tej bazy; przed startem worktree stal na `cb077b588`, przelaczony wg dispatchu).
KOD: `7de3417e8` na galezi roboczej `wf-d3b365ce/k5doc-t5a-kite` (commit kodu, testow, generatora i wektorow). Ten raport jest w osobnym commicie nad `7de3417e8`.

ZMIANY/COMMIT (allowlista):
- `rust-port/engine/src/domain/siege_tactics_kite.rs` (NOWY): `MELEE_SAFE_GAP`, `KiteUnit`, `enemies_of_kite`, `nearest_enemy_melee`, `kite_branch_applies`, `best_kite_shot_step`.
- `rust-port/engine/src/domain/mod.rs`: tylko `pub mod siege_tactics_kite;`.
- `rust-port/engine/tests/p6_k5doc_t5a.rs` (NOWY): 18 testow (17 nazwanych z komentarzem `battleScene.ts:linia` + test wektorowy `vectors_zgodne_z_pinem`).
- `rust-port/engine/tests/p6_k5doc_t5a_gen.mjs` (NOWY): generator; wykonuje pin `6689-6691`, `6743-6745`, `6959-7002`, `8291-8294`, `8315-8324`, `968`, `326-337`, `661-662`, `1797`, `1917-1919` przez TypeScript; straznik linii dla kazdego wycinka.
- `rust-port/engine/tests/p6_k5doc_t5a_vectors/vectors.json` (NOWY): 718 przypadkow (best_kite=409, z krokiem=102, nearest_melee=154, kite_gate=155), w tym 18 nazwanych z oczekiwaniem zapisanym recznie i sprawdzonym przez pin.
- Poza allowlista: nic. `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_pathstep.rs`, `siege_tactics_doctrine_*`, `ActivateOps`, `ProdBody`, `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**` nietkniete. `Cargo.lock` nie zmieniony i nie zacommitowany.

ODSTEPSTWA OD DISPATCHU (swiadome):
1. `best_kite_shot_step` zwraca `Option<Tile>` (kafelek `(f64,f64)`), a nie `Option<CellKey>`. Powod: `CellKey` = `(u64,u64)` z bitow JS, nie da sie go odwrocic do wspolrzednych w testach; `Tile` jest zgodny z T4a.
2. Funkcje dostaja jawne `KiteUnit` (pozycja, strona, zasieg, `primaryRanged`, flagi `dead/fadingOut/routed`) zamiast `RuntimeBattleUnit`, a predykaty zajetosci/przejezdnosci jako `&dyn Fn`. `advance_dir` i `manhattan` sa lokalne w module (`siege_tactics_doctrine_state::advance_dir` jest prywatne, a dispatch zakazuje zmian w `siege_tactics_doctrine_*`).
3. Trailery commitu: dispatch zabrania nazwy modelu w tresci i trailerach, wiec commit ma tylko linie `Claude-Session`, bez `Co-Authored-By`. Decyzja operatora, do potwierdzenia przez orkiestratora.

TESTY:
- `cargo fmt -- --check` (caly crate): EXIT 0 (po `rustfmt --edition 2021` na dwoch nowych plikach Rust).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p6_k5doc_t5a`: EXIT 0, 18 passed, 0 failed.
- `cargo test --all-targets --no-fail-fast`: PATRZ SEKCJA "PELNY SUITE" ponizej.
- Wektory: 718/718 zgodne z pinem (`vectors_zgodne_z_pinem`); asercje pokrycia: >=50 wektorow z krokiem KITE (jest 102) i >=700 przypadkow (jest 718).

MUTACJE (kazda na `siege_tactics_kite.rs`, przywracana po pomiarze; wynik `cargo test --test p6_k5doc_t5a`):
- (a) `if gap <= d_now` -> `if gap < d_now`: PASS (18/18). MUTANT RownowaznY, NIE DA SIE GO ZABIC. Dowod: krok o jedno pole zmienia odleglosc manhattan do dowolnego punktu dokladnie o +1 albo -1 (|a±1-t|-|a-t| in {+1,-1} dla calkowitych a,t), wiec `gap` jest zawsze rowne `d_now-1` albo `d_now+1`, nigdy `d_now`. Warunki `gap <= d_now` i `gap < d_now` odrzucaja dokladnie te same kandydatury. Dispatch wymagal FAIL; to wymaganie jest niewykonalne i wymaga decyzji orkiestratora (zmiana kryterium albo akceptacja jako mutant rownowazny).
- (b) usuniecie bonusu `movedBackAxis` (`+50`): FAIL (1 nieprzechodzacy: `vectors_zgodne_z_pinem`, plus wektory z `movedBackAxis`).
- (c) `if d_min_any <= 1.0` -> `if d_min_any < 1.0`: FAIL (2 nieprzechodzace: `best_dmin_any_le_1_odrzuca`, `vectors_zgodne_z_pinem`).
- (d) dodatkowa, poza dispatchem: usuniecie kontroli `gap <= d_now` (`if false`): FAIL (3 nieprzechodzace: `best_gap_nie_wiekszy_od_dnow_odrzuca`, `best_nieprzejezdny_odrzucony`, `vectors_zgodne_z_pinem`). Dowodzi, ze sama kontrola jest pokryta testami.

PELNY SUITE (`cargo test --all-targets --no-fail-fast`):
- Pierwsza proba (z `p6_8i_pick` wlaczonym) zawiesila sie na tescie `pick_auto_improvements_matches_pinned_web_vectors` (binarka `p6_8i_pick`, >10 min bez postepu). Test jest w module, ktorego nie dotyka ten temat (zadnego importu z `siege_tactics_kite`); ten sam test jest w liscie otwartych zadan jako `#291` ("zawieszajacy sie test"). NIE_ZMIERZONO: nie sprawdzono osobno na bazie `2edc808d7` bez zmian (koszt: drugi pelny build).
- Druga proba: `cargo test --all-targets --no-fail-fast -- --skip pick_auto_improvements_matches_pinned_web_vectors`: w chwili zamykania raportu 2003 passed, 0 failed, 0 ignored w 252 zakonczonych blokach wynikow; run jeszcze nie dotarl do konca (brak `TEST_EXIT`, binarki nadal sie wykonuja). Wynik koncowy NIE ZOSTAL ZMIERZONY w tym raporcie; log: `scratchpad/alltests3.log` (w katalogu sesji Operatora). Pelne zamkniecie bramki wymaga powtorki po zakonczeniu runu.
- Dysk: po buildzie `df -h /` pokazal 3.4G wolnego (<8 GB). Katalog `CARGO_TARGET_DIR` (`scratchpad/tgt-t5a`) do usuniecia po zakonczeniu runu.

BLOKADY:
- Mutacja (a) z dispatchu jest rownowazna (patrz wyzej). Wymagana decyzja: zmiana kryterium mutacji albo akceptacja.
- `pick_auto_improvements_matches_pinned_web_vectors` (p6_8i_pick) zawiesza sie w pelnym runie; nie zwiazany z T5a, nie zbadany na bazie.
- Dysk 3.4 GB wolne po buildzie; reguła procesu wymaga >= 8 GB dla Rust. Zwolnic przed kolejnym tematem Rust.

RUNDY: 1/5 (Operator, runda 1). Ostatni werdykt: brak (Operator nie wystawia FC).
NASTEPNY KROK: Evaluator (Sonnet) weryfikuje kod, wektory i mutacje; decyzja orkiestratora w sprawie mutanta (a) i zawieszajacego sie testu `#291`; Final Control po werdykcie Evaluatora.
DEPLOY/PUSH: NIE WYKONANO (push do `rust-port/parity-v2` zabroniony dispatchem; gałąź `wf-d3b365ce/k5doc-t5a-kite` tylko lokalnie).
