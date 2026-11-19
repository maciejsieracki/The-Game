# R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1: Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1 (#371, klient: wołający komend bitwy oblężniczej)
GOAL: klient (rust-port/client) jest produkcyjnym wołającym StartSiegeStorm / StepSiegeBattle / SkipSiegeBattle /
      FinishSiegeBattle i karmi nimi odtwarzanie bitwy w rendererze (headless, gpu OFF); E2E przez most
ZMIANY/COMMIT: oceniany kod = 3c2464d21 (obrona r1, gałąź rust-port-wip/p4-1i6-siege-battle-client-obrona-r1),
               baza origin/rust-port/parity-v2 = a5fdb91b8; FC dodaje tylko ten raport
               (gałąź rust-port-wip/p4-1i6-siege-battle-client-fc nad 3c2464d21)
TESTY: §2 (client fmt/clippy/test EXIT 0; renderer fmt EXIT 0; engine bridge_contract 10, p6_k5loop_wiring_b 15,
       p6_k5loop_wiring_b_pin 2 — EXIT 0); mutanty FC 5/5 zabite (§4)
BLOKADY: brak blokujących; bramka clippy/testów renderera nieodtworzona (dysk 4.5–8.9 GB < 12 GB, równoległe buildy
         innych workerów) — renderer bez zmian w diffie tematu (§3 R)
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree na aktualny parity-v2, pełne bramki klienta; bramka renderera przy
               >= 12 GB wolnego, jeśli orkiestrator jej wymaga), wpis długów do REJESTR-RUST.md
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Pochodzenie i allowlista (sprawdzone samodzielnie)

* Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1/00-dispatch.md`.
* BAZA: `origin/rust-port/parity-v2` = `a5fdb91b8` (zgodna z dispatchem); `git merge-base --is-ancestor
  origin/rust-port/parity-v2 3c2464d21` = prawda.
* Commity nad bazą: `ace976672`, `2855fc698`, `da87d95e1`, `83ef14fba` (Operator r1), `12b7b7c35` (Evaluator),
  `546e81c01`, `3c2464d21` (obrona r1).
* `git diff --stat a5fdb91b8 3c2464d21`: `rust-port/client/src/lib.rs` (+818), `rust-port/client/tests/siege_battle_client.rs`
  (+1407, nowy), 6 plików w katalogu runu. Wszystko w allowliście.
* `engine/*`, `renderer/*`, `view-model/*`, `src-tauri`, `gra/`, `Cargo.lock`, `client/Cargo.toml`: 0 zmian.
* `git diff --check`: czysto. `#[ignore]`: 0. Trailery: 7 × `Claude-Session:`, 0 × `Co-Authored-By`.

## 2. Bramki odtworzone przez FC (CARGO_INCREMENTAL=0, DEBUG=0, własny `CARGO_TARGET_DIR` w scratchpadzie, usunięty)

| Bramka | Wynik |
|---|---|
| `client`: `cargo fmt --all -- --check` | EXIT 0 |
| `client`: `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `client`: `cargo test --all-targets --no-fail-fast` | EXIT 0 — lib 0, `engine_bridge_renderer` 18 passed, `siege_battle_client` 18 passed (39 s) |
| `renderer`: `cargo fmt --all -- --check` | EXIT 0 |
| `renderer`: clippy `-D warnings`, `battle_playback_*` | NIE WYKONANO — wolne 8.9 → 4.5 GB < 12 GB, równoległe buildy innych workerów; renderer 0 zmian (§3 R) |
| `engine`: `bridge_contract` / `p6_k5loop_wiring_b` / `p6_k5loop_wiring_b_pin` | 10 / 15 / 2 passed, EXIT 0 |

## 3. Orzeczenia

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie / dowód |
|---|---|---|---|
| Z1 | flaga muru spawnu z ramki przy `Move` → `ClimbWall`/`LeaveField` (Evaluator) | **ODDAL** (naprawione w obronie) | `compose_siege_battle_setup` cofa komórkę i flagę osobno (pierwsza akcja zmieniająca flagę wygrywa); test `setup_spawn_komorka_i_mur_przed_akcjami_startu`; O24/O26/O27 zabite |
| Z2 | `on_session_created` nie zeruje `battle_closed` (Evaluator) | **ODDAL** (naprawione) | `lib.rs` zeruje `battle`, `battle_end`, `battle_closed`; test `ostatnia_bitwa_po_nowej_sesji_i_nowym_starcie`; E08/O25 zabite |
| M | 11 przeżytych mutantów Evaluatora | **ODDAL** (zabite) | raport 02a §3: 27 zabitych testem + E21 (kompilacja); FC sprawdził niezależnie 5 nowych mutantów — wszystkie zabite (§4) |
| Z3 | D-1I6-ORPHAN: błąd `Setup`/`Adapter` przy starcie zostawia bitwę otwartą w silniku | **ODDAL jako dług** | ścieżka opcjonalna (sceny dostarcza wołający), web nie ma tej gałęzi (scena zawsze powstaje przed `bs.play`), zamknięcie wymaga zmiany mostu (`engine/*` poza allowlistą) albo nowego API klienta; udokumentowane w doc-komentarzu `start_siege_storm`. Decyzja techniczna orkiestratora → wpis w REJESTR-RUST.md jako dług |
| Z4 | E2E przez `CivEngineAdapter::from_game` zamiast literalnego `CreateSession` | **ODDAL** | scenariusz `CreateSession` nie ma miasta wroga, a most nie ma `Load` (#375); `CreateSession` przez klienta sprawdzony osobno (`create_session_i_bledy_startu`: jawny błąd silnika, brak bitwy, UI bez zmian). Odchylenie techniczne, nie gameplay; do zapisu w rejestrze |
| R | bramka renderera nieodtworzona | **ODDAL** (z notą) | `git diff --name-only a5fdb91b8 3c2464d21 -- rust-port/renderer` = pusto; kod renderera bajt w bajt z bazą parity-v2, na której bramki renderera były zielone przy integracji I4/I5; renderer kompiluje się jako zależność klienta w clippy/test klienta (EXIT 0); `renderer` fmt EXIT 0. Reguła dysku dispatchu (>= 12 GB) uniemożliwia odtworzenie; nie ma czego weryfikować w kodzie tego tematu |
| F1 | (FC) doc-komentarz `last_siege_battle_view` mówi „`None` po `Aborted`”, ale `Finish` bez `result` daje `SiegeBattleEnd::Aborted` z zachowanym ekranem (`battle_closed = Some`) | **ODDAL** (kosmetyka dokumentacji) | zachowanie jest celowe i przetestowane (`finish_bez_wyniku_to_aborted`: „ekran zostaje, jedno odświeżenie”); niespójny jest wyłącznie opis. Dług D-1I6-DOC: doprecyzować komentarz przy najbliższym dotknięciu `client/src/lib.rs` |
| F2 | (FC) `step_siege_battle` zwiększa `wall_clock` przed strażnikiem `feed`, więc odrzucona odpowiedź (`Order`) zmienia zegar | **ODDAL** | zegar nie jest stanem renderera (kontrakt „naruszenie przed zmianą stanu renderera” dotyczy kolejki/sceny i jest zachowany: `StreamOrder::accept` przed `push_actions`); po `Order` silnik i tak już przesunął bitwę, więc zegar ścienny = rzeczywisty upływ czasu jest poprawny |

Zgodność z webem (pin `07d2fbd72`, `git show 07d2fbd72:gra/src/main.ts:36628-36672`) sprawdzona: kolejność gałęzi
`afterSiegeUi` zdobycie → `stormCaptureBlocked` → `obronca` → `remis` odpowiada `SiegeAfterUi::of`; brak gameplay
spoza webu.

Brak zarzutu z orzeczeniem NAPRAW. Brak zarzutu DO DECYZJI CZŁOWIEKA (Z3, Z4 to decyzje techniczne orkiestratora).

## 4. Mutanty FC (niezależne, `cargo test --test siege_battle_client`, plik przywracany `git checkout`, `git status` czysty)

| ID | Mutacja (`client/src/lib.rs`) | Wynik |
|---|---|---|
| F1 | `StreamOrder::accept`: `t < prev` → `t <= prev` (równe czasy odrzucane) | ZABITY |
| F2 | `exit_battle_ui`: hover nie czyszczony | ZABITY |
| F3 | start nie zamyka panelu oblężenia (`siege_map_panel_open`) | ZABITY |
| F4 | `Skip` bez `apply_snapshot` | ZABITY |
| F5 | `actions_received` liczy max 1 akcję na odpowiedź | ZABITY |

Łącznie z mutantami Operatora (M01–M22) i obrony (E01–E23, O24–O28): wymóg dispatchu „≥ 12 mutantów” spełniony.

## 5. Długi do rejestru (orkiestrator)

* Bez zmian: D-1I6-SETUP, D-1I6-ERR, D-1I6-ABORT-E2E, D-1I6-FIXTURE, D-1I6-SPAWN-FACING.
* D-1I6-ORPHAN (Z3), D-1I6-RENDERER-GATE (R; do odtworzenia przy integracji, jeśli >= 12 GB), D-1I6-DOC (F1).

## 6. Sprzątanie

`CARGO_TARGET_DIR` FC (`scratchpad/fc-1i6/tgt`) usunięty. Worktree FC czysty poza tym raportem. Brak push.
