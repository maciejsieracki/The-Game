# R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE — 03 Final Control (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust: DTO akcji oblężniczych, silnik, renderer)
TEMAT: R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE (#370 I5b)
GOAL: jak w `00-dispatch.md` — warianty `BattleActionKindDto` dla 11 akcji, `actions_to_dto` bez błędów „bez DTO”, wyczerpujący konsument w `playback.rs`, scena = pin `07d2fbd72`.
OCENIANY KOD: `rust-port-wip/i5b-obrona-r1` = `0488f5b51` (kod do `89e0c5503`), łańcuch Operator `b59cbf5d3` → Evaluator `06b03d752` → Obrona `89e0c5503`/`0488f5b51`.
BAZA: `origin/rust-port/parity-v2` = `24c8f3b75` (zgodna z linią BAZA dispatchu; `merge-base --is-ancestor` OK; na dziś parity-v2 nadal `24c8f3b75`, FF możliwy).
ZMIANY/COMMIT: FC nie zmienia kodu; tylko ten raport (commit na lokalnej gałęzi `fc/i5b-r1`, potomek `0488f5b51`).
RUNDY: 1/5.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Bramki odtworzone samodzielnie

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `i5b-fc/*` (usunięte po bramkach). Renderer bez `--features gpu`, start bramki renderera przy **12 GB** wolnego (czekałem na zakończenie obcego `cargo test` innego workera), bez równoległego buildu renderera. `renderer/Cargo.lock` zmieniany lokalnie przez cargo — przywrócony `git checkout` (DŁUG-T1-LOCK); drzewo czyste.

| Crate | Bramka | Wynik |
|---|---|---|
| view-model | `cargo fmt --check` | EXIT 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| view-model | `cargo test --all-targets` | EXIT 0 — 119 passed, 0 failed, 0 ignored (15 binarek) |
| engine | `cargo fmt --check` | EXIT 0 |
| engine | `cargo clippy --lib` + 12 testów dotkniętych/z listy `-- -D warnings` | EXIT 0 |
| engine | `cargo test` listy dispatchu + dotkniętych: `bridge_contract` 9, `p4_1i3_actions` 9, `p4_1i5a_move_shot` 6, `p4_1i5b_siege_actions` 5, `p4_1i5b_support` 1, `p6_k5loop_close_r2` 6, `close_r3` 6, `close_r4` 11, `siege_atk_a` 8, `siege_atk_b` 10, `siege_def` 10, `tags_rest` 5 | EXIT 0 — wszystkie passed, 0 failed |
| engine | pełny `cargo test` / clippy `--all-targets` | NIE URUCHAMIANO przez FC: `engine/` identyczny między `06b03d752` a `0488f5b51` (diff obrony dotyka tylko renderera i testów view-model), Evaluator ma na nim EXIT 0 (4127/0/1, ignored = istniejący na bazie `dump_tick1_econ_for_web_generator`). Dispatch dopuszcza `--lib` + testy dotknięte. |
| renderer | `cargo fmt --check` | EXIT 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| renderer | `cargo test --all-targets` | EXIT 0 — **742 passed**, 0 failed, 0 ignored (83 binarki); `battle_playback_siege` 16 passed |

## 2. Allowlista i zakazy (sprawdzone samodzielnie)

`git diff --stat 24c8f3b75...0488f5b51`: 15 plików — `view-model/src/battle.rs`, `view-model/tests/battle_actions_siege.rs`, `engine/src/domain/siege_tactics_actions.rs`, `engine/tests/p4_1i5a_move_shot.rs`, `engine/tests/p4_1i5b_siege_actions.rs`, `engine/tests/p4_1i5b_support.rs`, `engine/tests/p6_k5loop_close_r4.rs`, `p6_k5loop_siege_atk_a.rs`, `p6_k5loop_siege_atk_b.rs`, `renderer/src/battle/playback.rs`, `renderer/tests/battle_playback_siege.rs`, raporty runu. Wszystkie w allowliście. Nie ruszono: `siege_tactics_loop.rs`, `siege_battle_session.rs`, `siege_battle_adapter*`, `bridge.rs`, `client/`, `src-tauri/`, `gra/**`, `Cargo.toml`, `renderer/Cargo.lock`, `REJESTR-RUST.md`.
- Zmiany w `p6_k5loop_close_r4/siege_atk_a/siege_atk_b` i `p4_1i5a_move_shot`: usunięte wyłącznie testy asertujące `Err(*WithoutDto)`, zastąpione sweepami 1:1 po wektorach z progami pokrycia (np. `climbs >= 30`, liczniki per wariant) — wymuszone celem, bez osłabienia.
- `#[ignore]` / `#[non_exhaustive]` w dodanych liniach: 0 (trafienia tylko w tekstach raportów). `WithoutDto` w kodzie produkcyjnym: 0. Linie `Co-Authored-By` w commitach tematu: 0.

## 3. Weryfikacja poprawki obrony (Z-4, D-I5B-16) na tekście pinu

`git show 07d2fbd72:gra/src/battle/battleScene.ts` `:7699-7701`: `if (u.dead || u.fadingOut || u.routed) continue; if (u.onWallWalkway && u.r === wallRow && u.q === wallCol)`. Kod `playback.rs` po obronie: `u.removed || !u.on_wall_walkway || u.col != wall_col || u.row != *row` → `continue`, dalej `!self.routed.contains(&id)`; `routed` zasilane z `Rout` (`_startRout` `:9802`) i z klatek (`fu.routed`), bez resetu (jak pin). Zgodne.

Mutanty FC (`renderer/src/battle/playback.rs`, `battle_playback_siege` + `battle_playback`):

| ID | Mutant | Wynik |
|---|---|---|
| FC1 | `!self.routed.contains(&id)` → `true` | ZABITY (2 testy) |
| FC2 | filtr bez `u.removed \|\|` | przeżył — **RÓWNOWAŻNY**: `Kill` jednostki `removed` jest no-opem przed odczytem `breach_fades` (`playback.rs` gałąź `Kill`, strażnik `_startFade` `:9928`), a `removed` nigdy nie wraca do `false` poza konstrukcją (`units.rs:611`); znacznik na usuniętej jednostce jest nieobserwowalny |
| FC3 | `Rout` nie wstawia do `routed` | ZABITY |
| FC4 | `apply_frame` ignoruje `fu.routed` | ZABITY |

## 4. Orzeczenia zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z-1 (E12, `LeaveField` nie czyści znacznika; mylący opis testu) | Evaluator | **ODDAL** (usunięty w obronie) | nowy test `leave_field_clears_the_breach_mark_within_the_same_t0` + poprawiony opis; zielone w mojej bramce |
| Z-2 (E1/E2, warunki `on_wall_walkway`, `col == wall_col`) | Evaluator | **ODDAL** (usunięty) | testy `breach_mark_needs_the_wall_walk`, `breach_mark_needs_the_wall_column` + kontrola; zielone |
| Z-3 (V1, `Shaken.morale = Infinity` przechodzi) | Evaluator | **ODDAL** (usunięty) | `walidacja_obrazen_i_hp` z `±Infinity`; view-model 119/0 |
| Z-4 (filtr wyłomu bez `routed` vs pin `:7699`) | Evaluator | **ODDAL** (naprawiony, D-I5B-16) | zgodność z tekstem pinu potwierdzona (§3), mutanty FC1/FC3/FC4 zabite |
| Nota E8/E19/V2/E20 | Evaluator | **ODDAL** | E8, E19, V2 jawnie równoważne (uzasadnienia w 02/02a, sprawdzone); E20 to ślad diagnostyczny, scena P == Q sprawdzana osobno |
| D-I5B-13 (`Infinity` w obrażeniach → jawny `Invalid(NonFinite)`, 66 przypadków T2b) | Operator | **ODDAL** | to nie jest błąd „bez DTO”, lecz walidacja skończoności (jak I5a); źródłem są syntetyczne wejścia wektorów (`wallAttack: Infinity`), JSON nie przenosi `Infinity`; prefiks przed akcją 1:1; jawny błąd, nie ciche pominięcie |
| FC-U3-MISS niezamknięty | Operator | **ODDAL** | dispatch: „zamknij, jeśli możliwe bez zmiany silnika pętli” — wymaga generatora r3 spoza allowlisty; pozostaje długiem |
| Próg dysku 12 GB naruszony w bramce obrony (8,3 GB) | Obrona (jawnie) | **ODDAL** | odstępstwo procesowe bez wpływu na wynik: FC powtórzył bramkę renderera przy 12 GB, wynik identyczny (742/0/0) |
| FC2 (mutant FC) | FC | **ODDAL** | równoważny (§3) |

Brak zarzutów NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA (wszystkie decyzje D-I5B-1..16 techniczne, zgodne z pinem; gameplay bez odstępstw od webu).

## Długi

- FC-U3-MISS (wektor pudła) — wymaga generatora r3 poza allowlistą.
- D-I5B-13: `Infinity` w obrażeniach bez reprezentacji DTO (jeśli dane kiedyś dopuszczą — osobna reprezentacja).
- D-I5B-1..16 do `REJESTR-RUST.md` (orkiestrator; plik poza allowlistą).
- E20: ślad `SceneCall::WallBreach.rubble` niesprawdzony dla bitwy bez grupy muru (diagnostyczny).
- DŁUG-T1-LOCK: `cargo test` renderera modyfikuje `Cargo.lock` lokalnie.
- Brak produkcyjnego wołającego playbacku oraz morale po wyłomie tylko z ramki — poza I5b.

## Następny krok

Integracja orkiestratora: FF `rust-port/parity-v2` (`24c8f3b75`) → kod `0488f5b51` (lub ten commit FC), `refs/keep/I5B-fc`, wpis D-I5B-1..16 w `REJESTR-RUST.md`, pełny `cargo test` engine po integracji wg zwyczaju.
