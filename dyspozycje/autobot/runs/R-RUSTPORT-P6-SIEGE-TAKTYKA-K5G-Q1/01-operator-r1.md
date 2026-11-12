STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5G-Q1
GOAL: port 1:1 faz AUTO z battleScene.ts (migawka, planowanie na klonach, fala, token, przerwanie, _checkEnd) jako czysta maszyna stanu `siege_tactics_autobatch.rs` skladajaca K5G0 + K5E + K5F
ZMIANY/COMMIT: allowlista: rust-port/engine/src/domain/siege_tactics_autobatch.rs (nowy), rust-port/engine/src/domain/mod.rs (jedna linia rejestracji), rust-port/engine/tests/p6_siege_tactics_autobatch.rs + _gen.mjs + _vectors/vectors.json, dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5G-Q1/**. Cargo.lock nie commitowany. SHA: patrz odpowiedz Operatora / git log gałęzi roboczej.
TESTY: patrz sekcja TESTY nizej.
BLOKADY: brak
RUNDY: 1/5 (Operator SONNET, uzasadnienie w dispatchu). Raport nazwany `01-operator-r1.md` wg dispatchu; harness prosil o `01-operator-r4.md` -- ten plik istnieje jako wskaznik na r1 (w runie nie ma rund 1-3).
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

## BAZA i KROK 0
Worktree: `git checkout --detach bcb64cead` (FC K5F), potem `git merge e40f9c710` (FC K5G0) -- czysty, bez konfliktow w mod.rs. Rejestracja nowego modulu: jedna linia `pub mod siege_tactics_autobatch;` przed `siege_tactics_autophase`.

## Mapa pin -> Rust (pin 07d2fbd72, battleScene.ts)
| Web | Linie | Rust |
|---|---|---|
| `_beginAutoBatchTurnFromCurrentState` | 5696-5704 | `begin_auto_batch_turn_from_current_state` |
| `_beginAutoBatchPhase` (migawka :5710-5722, `++_autoBatchToken` :5730, baner :5731-5732, pending==0 -> finish :5734, launch bez ACT_GAP :5741) | 5707-5745 | `begin_auto_batch_phase`, `build_snapshots` |
| `_snapshotAutoBatchIntents` (klony per jednostka, filtr cloneOcc, fix-up special-move q/r) | 5752-5815 | `snapshot_auto_batch_intents` |
| `_cloneForAutoBatchPlanning`, `_disposeAutoBatchPlanningRoster` (zasoby 3D) | 5822-5860 | `BatchBoard: Clone` + `CombatUnit: Copy` (K5A); dispose nie ma odpowiednika |
| `_launchAutoBatchResolution` (+ `complete` liczony raz, token) | 5865-5905 | `launch_auto_batch_resolution`, `complete_resolution` |
| `_resolveAutoBatchAttack` | 5907-5921 | `resolve_auto_batch_attack` |
| `_resolveAutoBatchMovement` | 5924-5958 | `resolve_auto_batch_movement` |
| `_finishAutoBatchPhase` (w tym `_checkEnd` :5963, faza def :5964-5967, TURN_GAP :5972) | 5961-5973 | `finish_auto_batch_phase` |
| `_haltAutoBattleTurn` (wejscie przerwania, `_autoBatchToken++`) | 17333-17344 | `halt_auto_battle_turn` |
| `_schedule` / `_drainTimers` | 9595 / 9616 | zegar K5E `VirtualClock<BatchTimer>`, `fire_timers` |
| planowanie `_doMove` / `_doAttack` | 8694-8712 / 8788-8794 | `planning_move`, `planning_attack` (pomocnicze dla wstrzyknietego `plan_unit`) |
| wejscie z K5F (`_beginAutoBatchPhase('atk', a)`) | 5685 | `units_from_seq_refs` (adapter `SeqEvent::BeginAutoBatchPhase`) |

Skladanie: `resolve_auto_batch_phase` (K5G0), `ACT_GAP_MS`/`TURN_GAP_MS` (K5F), `VirtualClock` (K5E: planowanie = zdarzenia na zegarze wirtualnym, `FinishPhase{token}` / `BeginTurn`), `CombatUnit` (K5A: klon = kopia wartosci). Po zakonczeniu fali timer `BeginTurn` emituje `BatchEvent::BeginTurn` = wywolanie `begin_turn` z K5F (test `full_turn_from_k5f_begin_turn_event` sklada K5F -> K5G -> K5G0 -> K5E).

## Model
* `BatchState` = pola sceny (atk/def/occByKey, `_autoBatchPhase/Resolutions/Pending/Token`, flagi) + zegar K5E (`clock.finished` = `this.finished`) + liczniki galezi.
* Efekty sceny = jawne `BatchEvent` (Banner, Move, ApplyTerrainRange, Attack, Flee, RemoveUnitFromScene, ShakeAlliesOnLoss, Schedule, EndCheck, BeginTurn). Czesc SYNCHRONICZNA efektow (aktualizacja occ/q/r w `_doMove`, obrazenia w `_doAttack`) jest wstrzykiwana przez `AutoBatchEnv` (`do_move`, `do_attack`, ...), bo web mutuje stan natychmiast, a kolejne jednostki tej samej fali to widza (potwierdzone wektorami).
* Callbacki async (`done`) = `LaunchCtx {token, idx, resolution}` w zdarzeniu; wywolujacy wola `resolve_auto_batch_movement(step+1)` / `complete_resolution`. Ctx niesie KOPIE rozstrzygniecia, bo po `halt` tablica jest czyszczona, a spozniony callback ma byc odrzucony tokenem.
* Bez RNG: cios/obrazenia, `_activateUnit` na klonie (K5h/K5i), `_passableForUnit`, `_canStrikeTargetFrom`, `_checkEnd` = trait `AutoBatchEnv` (K5i nie importowany).

## Kryteria binarne
1. Fazy AUTO Ported z wektorami z pinu i licznikami galezi: 420 sekwencji, 5921 operacji; wektory = WYKONANIE tekstu pinu w node 22.23.4, fragmenty strazowane SHA-256 (`e483d86e...`; autoBatchPhase.ts `eb6f7d55...`). Po kazdej operacji porownanie sladu efektow i pelnego stanu (jednostki, occ, timery due/id/rodzaj, token, faza, pending, rozstrzygniecia, flagi, liczba odlozonych callbackow). NaN/Inf/-0 w hp i wspolrzednych. Liczniki galezi (`BRANCHES`, 35 etykiet): test wymaga >0 dla kazdej poza dwiema nieosiagalnymi z wyjscia K5G0 (patrz uwagi).
2. Token fazy i przerwanie: `++token` przy kazdym starcie fazy, `halt` (token+1, czyszczenie timerow/rozstrzygniec, `suspended`); ops `halt`/`finishTok`(delta -1/+1)/`cb` w losowej kolejnosci odtwarzaja wyscigi (complete_stale, finish_stale, halt > 0 trafien). Test jednostkowy `halt_invalidates_in_flight_callbacks`.
3. Testy istniejace bez osłabień: zadne istniejace pliki nie edytowane (poza 1 linia rejestracji w mod.rs).
4. Bramki: patrz TESTY.

## Uwagi (PASS-WITH-NOTES)
* Rozbite (`routed`) jednostki sa odfiltrowane przez K5G0 (`outside_live_roster`), wiec galezie routed w `launch`/`movement` (flee, ruch do domu, `RemoveUnitFromScene`) sa osiagalne tylko, gdy jednostka rozbije sie MIEDZY rozstrzygnieciem a startem fali (hook `update_battle_phase_banner` w wektorach modeluje to; dwie sekwencje kierowane pokrywaja dojscie do krawedzi domowej atk i def). Wektory potwierdzaja zgodnosc z pinem.
* `launch_no_target` (atak bez celu) i `complete_double` nie wystepuja na wyjsciu K5G0 -- pokryte testem obronnym na sztucznym rozstrzygnieciu i jawnie wyjete z wymogu licznikow w tescie wektorowym.
* `resolve_auto_batch_movement` przy `finished/suspended/manual` wraca BEZ `done` (jak web) -- `pending` nie maleje; faza i tak jest uniewazniana tokenem. 1:1 z pinem.
* `Banner` emitowane zawsze; wczesne wyjscia `_updateBattlePhaseBanner` (`finished`, `deployPhase`) po stronie sceny.
* Koszt ruchu/kierunek (`moveLeft`, `_updateFacing`) w planowaniu `_doMove` nie portowane (modul ich nie czyta); `routedUnits`/`log` klonow: planowanie dziala na osobnej `BatchBoard`, wiec nie ma czego obcinac.
* Wektory 6 MB (jak turnseq); generator `node rust-port/engine/tests/p6_siege_tactics_autobatch_gen.mjs` (seed 217).
* Cargo.lock (untracked, generowany przez cargo) nie commitowany; `CARGO_TARGET_DIR=/tmp/claude-0/target-k5g` (do usuniecia po bramkach).

## TESTY
Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo. df przed startem: 11 GB wolne (>= 8 GB).
* `cargo fmt --check`: EXIT 0
* `cargo clippy --all-targets -- -D warnings`: EXIT 0
* `cargo test --lib`: 53 passed, EXIT 0
* `cargo test --test p6_siege_tactics_end --test p6_siege_tactics_endcheck --test p6_siege_tactics_walk --test p6_siege_tactics_siege_tactics_unit --test p6_siege_tactics_siege_tactics_clock --test p6_siege_tactics_turnseq --test p6_siege_tactics_autophase --test p6_siege_tactics_autobatch`: wszystkie ok, EXIT 0 (autobatch: 6 testow -- wektorowy 420 sekwencji/5921 ops, planowanie na klonach nie rusza zywej planszy, wyscig tokenu po halt, pelna tura K5F->K5G->BeginTurn, galezie obronne, unikalnosc etykiet)
