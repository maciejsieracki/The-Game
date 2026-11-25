# R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1 — spójny czas lądowania TowerShot/Boulder (siatka klatek pinu) w silniku i rendererze

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Zadanie #400 (dług N2 z HITAT-FQ, `REJESTR-RUST.md` wpis „HITAT … ZINTEGROWANE” oraz „MARCH-INCREMENTAL … ZINTEGROWANE”).
BAZA: `origin/rust-port/parity-v2` = `11c4a5805` (merge MARCH-INCREMENTAL) w dniu dispatchu; wpisz faktyczny SHA (`git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## KONTEKST (zmierzone przez Evaluatora HITAT, N2)
Pin `07d2fbd72` (`gra/src/battle/battleScene.ts`, `git show 07d2fbd72:gra/src/battle/battleScene.ts`): `_fireOneTower` (`:4223-4262`) wystawia pocisk z lotem `RANGED_FLY_MS = 380` (`:1012`) i `_schedule(RANGED_FLY_MS, …)` (`:4262`); `_attackWallTile` (`:7540-7560`) → `_spawnCatapultBoulder` (`:7571`) i `_schedule(700, …)` (`:7555`). `_schedule` odpala klocek w pierwszej klatce `_raf`, w której `vNow >= due` (klatka 16 ms × speedMul), więc przy klatce 16 ms trafienie wieży ląduje w `t0+384`, kamień w `t0+704`, a nie w nominalnych 380/700. Silnik (`siege_tactics_loop.rs`, `TOWER_FLY_MS` `:232`, `land_at: clock.v_now + TOWER_FLY_MS` `:1147`; `fire_wall_hit` `land_at = self.now + WALL_HIT_FLY_MS` `:~6276`) emituje w `BattleAction::TowerShot`/`Boulder` nominalne 380/700 i test kontraktu czasów silnika (HITAT, `p6_k5loop_wiring_a_pin.rs`) je zamraża. Strzał `Shot` i `Melee` mają już siatkę klatek (D-HFQ-1: `pin_frame_time`, `is_pin_event_time` w `renderer/src/battle/playback.rs`).

## GOAL
NAJPIERW web: przeczytaj pin (`git show`), zmierz, kiedy NAPRAWDĘ odpala się trafienie wieży i kamienia w pinie (wektory K5LOOP-WIRING-A pochodzą z wykonania TS pinu — sprawdź, czy któryś ślad zawiera czasy trafień wieży/kamienia; jeśli nie, wyprowadź z kodu pinu i dodaj wektor/test z uzasadnieniem). Następnie jednym spójnym commitem (silnik + renderer + test kontraktu):
1. `land_at` TowerShot i Boulder w silniku = czas, w którym pin faktycznie wykonuje trafienie (siatka klatek `frame_ms = 16 × speedMul`, wg tej samej reguły co `Shot` w `siege_tactics_loop.rs:4157`), albo — gdy pin rozstrzyga inaczej — decyzja techniczna z uzasadnieniem w raporcie;
2. renderer `playback.rs` przyjmuje dla `TowerShot`/`Boulder` dokładnie dwa punkty (nominalny i siatkowy), analogicznie do `Melee`/`Shot` (D-HFQ-1); odrzuca pozostałe (`PlaybackError::*LandAt` zostaje, test negatywny);
3. test kontraktu czasów akcji silnika obejmuje wszystkie scenariusze sesji i pokazuje liczniki TowerShot/Boulder > 0 (pokrycie), mutant „stary nominał” musi dać FAIL;
4. wektory pinu K5LOOP-WIRING-A (45) i pełny test silnika bez regresji; 128/128 kandydatów c1 @1 i @16 ms bez zmian.
Poza zakresem: FQ-SPEED (#401, speedMul ≠ 1 — tylko nie psuj przypadku 16 ms), MARCH-RESZTA (#402), `gra/`, `src-tauri`, Save/Load. Jeśli pin nie rozstrzyga jednoznacznie → STOP i zgłoś (ABC tylko dla odstępstwa gameplay od webu).

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs` (tylko miejsca emisji `land_at` wieży i kamienia oraz stałe), `engine/src/domain/siege_tactics_atk_b.rs` (jeśli `WALL_HIT_FLY_MS` wymaga zmiany), `engine/tests/p6_k5loop_wiring_a_pin.rs`, nowe `engine/tests/p4_landat_tower_boulder*.rs`, `rust-port/renderer/src/battle/playback.rs`, `renderer/tests/battle_playback*.rs` (w tym nowy plik), `client/tests/siege_battle_client.rs` (tylko gdy test czasów tego wymaga), `dyspozycje/autobot/runs/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/*`. Nie ruszać: `gra/`, `src-tauri`, `view-model`, generatory wektorów (chyba że konieczne — uzasadnić), `Cargo.lock`.

## KRYTERIA KOŃCA
`land_at` TowerShot/Boulder w silniku = faktyczny czas trafienia w pinie (z dowodem: wektor/pomiar), renderer akceptuje nominał i punkt siatki, test kontraktu z pokryciem > 0, mutanty ≥ 12 (zabite lub jawnie równoważne), tabela „zamknięte / zostaje długiem” (N2, SHOT-LAND-AT-RENDER, D-PIN3-3-SHOT-ID).

## BRAMKI (EXIT 0)
Zmiana strumienia akcji silnika ⇒ trzy crate'y (reguła z HITAT): engine `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`; client fmt/clippy/test (`engine_bridge_renderer`, `siege_battle_client`); renderer (gpu OFF) fmt/clippy/test. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu, w tle `setsid nohup`, po bramce usuń własny target. Bramka renderera tylko przy ≥ 12 GB wolnego i bez równoległego builda renderera, inaczej opisz jako NIE ODTWORZONO. Pliki tymczasowe z ID tematu w nazwie (wspólny scratchpad).

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
