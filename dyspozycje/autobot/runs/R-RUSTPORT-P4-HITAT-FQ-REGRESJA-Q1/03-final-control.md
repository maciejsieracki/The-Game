# R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1
GOAL: przywrócić zgodność kontraktu silnik ↔ renderer po FRAME-QUANT (`PlaybackError::HitAt` w E2E klienta) przy niezmienionych 42 wektorach pinu.
OCENIANY SHA: `4b59f9277` (gałąź `rust-port-wip/hitat-fq-q1-obrona`; kod Operatora `5e6614e00` + `a9d96a33f`, test Obrony `1b014bd7c`), baza `3e5db0673b26c0838d23f621e8727ffd051a9c88` (zgodna z linią BAZA dispatchu; `git merge-base --is-ancestor` OK).
ZMIANY/COMMIT: tylko ten raport (gałąź `rust-port-wip/hitat-fq-q1-fc` = `4b59f9277` + raport). Bez zmian kodu.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge na `rust-port/parity-v2`, po merge bramki `engine` + `client` + `renderer`).
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone samodzielnie

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, jeden target poza repo
(`scratchpad/hitat-fc/target`, usunięty po bramkach), pełny test silnika w tle (`setsid nohup`, skrypt `hitat-fc/gates.sh`).

| Bramka | EXIT | Wynik |
|---|---|---|
| engine `cargo fmt --check` | 0 | — |
| engine `cargo clippy --all-targets -- -D warnings` | 0 | — |
| engine `cargo test --all-targets --no-fail-fast` | 0 | 4226 passed, 0 failed, 1 ignored (istniejący); `wektory_pinu_pelnej_bitwy_bajt_w_bajt` ok, `kontrakt_czasu_akcji_z_rendererem_klatka_16ms` ok, `kontrakt_czasu_ciosu_po_krokach_advance_step` ok |
| client `cargo fmt --check` | 0 | — |
| client `cargo clippy --all-targets -- -D warnings` | 0 | pierwszy przebieg EXIT 101 (E0463 „can't find crate”) był artefaktem FC: w trakcie clippy usunąłem z targetu binaria testów silnika (>1 MB, wykonywalne), co objęło też biblioteki proc-macro. Powtórka na tym samym kodzie: EXIT 0 |
| client `cargo test` | 0 | 36 passed (`engine_bridge_renderer` 18, `siege_battle_client` 18), 0 failed |
| renderer `cargo fmt --check` (gpu OFF, `default = []`) | 0 | — |
| renderer `cargo clippy --all-targets -- -D warnings` (gpu OFF) | 0 | — |
| renderer `cargo test` (gpu OFF) | 0 | 745 passed, 0 failed, 0 ignored; `hitat_fq_*` (3) ok |

Dysk: przed bramką renderera ok. 10,3–11,0 GB wolnego (próg dispatchu 12 GB). Bramka nie została pominięta,
przeszła w całości. Równolegle budował wyłącznie inny proces silnika (`cargo test --release`, nie renderer).
Minimum w trakcie: 7,4 GB (po pełnym teście silnika, przed zwolnieniem binariów testów). Po usunięciu targetu: 9,9 GB.

## 2. Regresja odtworzona na bazie (V0, własny pomiar)

`renderer/src/battle/playback.rs` z `3e5db0673` w drzewie `4b59f9277`, potem `cargo test --test siege_battle_client`:
EXIT 101, `10 passed; 8 failed`, wszystkie 8 z `HitAt { t0: 137600.0, hit_at: 137760.0 }` (objaw z dispatchu).
Na kodzie tematu: 18/18. Plik przywrócony (`git status` czysty).

## 3. Pin `07d2fbd72` (`gra/src/battle/battleScene.ts`, `git show`)

- `_doMeleeAttack` `:9115-9122`: `t0 = this._now()`, cios przy `!hitDone && localT >= BLOW_HIT_T` w pętli `_raf`.
  `_now()` = `vNow` (`:9403`), krok FF = `_scaledWallDelta(BATTLE_FRAME_WALL_MS)` (`:9419`). Przy klatce 16 ms
  cios pada w pierwszej klatce z `localT >= 150`, czyli `t0 + 160`.
- `_doRangedAttack` `:9224`: `_schedule(RANGED_FLY_MS, …)`; `_drainTimers` (`:9616-9634`) odpala timer z `due <= vNow`
  klatki, czyli `t0 + 384`.
- Wektory pinu nie zawierają `hitAt/hit_at/landAt/land_at` (0 plików), więc wariant B nie był wymuszony, a wybór A
  (renderer akceptuje chwilę z siatki klatek) jest zgodny z tekstem pinu. Wariant Operatora jest ostrzejszy niż
  przedział z dispatchu `[t0+150, t0+166)`: akceptuje tylko dwa punkty (`t0+150` i `t0+160`), co nie osłabia kontroli.
- Silnik (`siege_tactics_loop.rs:4845-4881`): `t0 = saved + attack_pre`, `hit_at = saved + attack_pre + frame_raf(frame, 150)`;
  odstęp 160 przy klatce 16. `TowerShot` (`:1095`, `TOWER_FLY_MS`) i `Boulder` (`:6276`) emitują czasy nominalne,
  a renderer nadal wymaga dla nich równości z nominałem (`playback.rs:806`, `:962`), więc spójne.

## 4. Allowlista i zakazy (sprawdzone samodzielnie)

`git diff --stat 3e5db0673 4b59f9277`: `renderer/src/battle/playback.rs`, `renderer/tests/battle_playback.rs`,
`renderer/tests/battle_playback_move_shot.rs`, `engine/tests/p6_k5loop_wiring_a_pin.rs` (0 usuniętych linii), raporty
i skrypty mutantów w katalogu runu. Wszystko w allowliście. `engine/src/**`, `client/**`,
`p6_k5loop_wiring_a_pin_vectors/` bez zmian (diff pusty), więc 42 wektory i lista wyjątków nietknięte.
`#[ignore]`/`should_panic` dodane: 0. Trailery commitów: tylko `Claude-Session:` (bez nazwy modelu).
`renderer/Cargo.lock` przepisywany przez cargo nie jest commitowany (przywrócony).

## 5. Mutanty FC (własne, renderer, `--test battle_playback --test battle_playback_move_shot hitat_fq`)

| ID | Mutacja | Wynik |
|---|---|---|
| F1 | `is_pin_event_time` bez gałęzi nominalnej (tylko siatka) | ZABITY (2 testy) |
| F2 | `pin_frame_time`: `round` zamiast `ceil` (150/16 → 144) | ZABITY (2 testy) |
| F3 | `Shot` z powrotem na ścisłe `t0 + RANGED_FLY_MS` | ZABITY (`hitat_fq_shot_on_frame_grid_is_played_like_nominal`) |

Razem z mutantami Operatora (18, 17 zabitych), Evaluatora (V0–V11) i Obrony (M-OB1) wymóg ≥ 10 spełniony.

## 6. Orzeczenia zarzutów

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| N1 | E3 przeżył; brak testu ciosu po `_advanceStep` (`attack_pre > 0`) (Evaluator) | **ODDAL** | Obrona dopisała `kontrakt_czasu_ciosu_po_krokach_advance_step` (wszystkie wektory i bliźniaki klatek, zielony u mnie). Licznik „po kroku” = 0 na 537 ciosów, a analiza `advance_step` (D-WIRA-18) pokazuje, że gałąź jest dziś nieosiągalna, więc E3 jest mutantem równoważnym. Kod silnika poprawny (§3). Po MARCH-INCREMENTAL trzeba powtórzyć E3; to zadanie orkiestratora. |
| N2 | Niespójna semantyka `land_at` (TowerShot/Boulder nominalne, Shot na siatce); V4 przeżył (Evaluator) | **ODDAL** | Dispatch: „napraw tylko to, co faktycznie łamie”. TowerShot/Boulder nie łamią klienta ani renderera (bramki zielone). Ujednolicenie do siatki pinu (`_fireOneTower` `:4261-4262`, kamień `:7555`, czyli 384/704) to osobny temat, w którym jednocześnie zmienia się silnik, `playback.rs` i test kontraktu. Dług do rejestru: SHOT-LAND-AT-RENDER/TOWER-BOULDER. |
| N3 | `PIN_FRAME_MS = 16` stałe w rendererze (Evaluator) | **ODDAL** | Produkcyjna klatka sesji jest stała 16 ms (`siege_battle_session.rs:1049`); `speedMul ≠ 1` tylko przez `#[doc(hidden)] diag_set_speed_mul`. Przekazanie klatki przez `PlaybackOpts` wymaga `client/src/lib.rs` (poza allowlistą). Dług do tematu przyspieszenia bitwy. |
| N4 | Reguła „zmiana strumienia akcji silnika ⇒ bramki `client` + `renderer`” tylko jako propozycja (Evaluator) | **ODDAL** (wobec Operatora) | `REJESTR-RUST.md` poza allowlistą. Wpis reguły do procesu integracji należy do orkiestratora (decyzja techniczna, nie człowieka). |
| N5 | Bramka renderera poniżej progu 12 GB (Evaluator, także FC) | **ODDAL** | Bramka nie została pominięta: wykonana w całości (Evaluator i FC niezależnie), EXIT 0, bez równoległego budowania renderera, bez wyczerpania dysku. Odstępstwo od progu ujawnione w §1. |
| FC-1 | Pierwszy przebieg clippy klienta EXIT 101 | **ODDAL** | Artefakt FC (usunięcie bibliotek z targetu w trakcie budowy), nie kod tematu. Powtórka na tym samym SHA: EXIT 0. |

Brak zarzutów NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA (sprawę rozstrzyga technicznie pin, zgodnie z dispatchem).

## 7. Uwagi dla integracji (orkiestrator)

- `origin/rust-port/parity-v2` przesunął się na `35d6e8da2`. `git merge-tree --write-tree origin/rust-port/parity-v2 4b59f9277`
  daje czyste drzewo (`a1f20140d`, bez konfliktów); od bazy `parity-v2` nie zmienia `renderer/`, `client/` ani
  `p6_k5loop_wiring_a_pin.rs`. Zmienia jednak silnik, więc po merge trzeba uruchomić `engine` + `client` + `renderer`
  (reguła z N4).
- Do rejestru: D-HFQ-1 (wariant A, dwa punkty: nominał i siatka 16 ms), długi N2 i N3, powtórka E3 po MARCH-INCREMENTAL,
  stała reguła bramek z N4.

## BLOKADY

Brak.
