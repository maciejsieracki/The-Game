# R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE — Evaluator r1 (adwersarialny)

STATUS: FAIL (wąski: bramki zielone, kod zgodny z pinem; 3 niezabite mutanty nierównoważne nowych gałęzi + 1 rozbieżność filtra z tekstem pinu — kryterium dispatchu „każdy mutant zabity lub jawnie równoważny” niespełnione)
DOMAIN: GAME (port Rust: DTO akcji bitwy, silnik, renderer)
TEMAT: R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE (#370 I5b)
GOAL: jak w `00-dispatch.md` (warianty DTO 11 akcji, `actions_to_dto` bez „bez DTO”, konsument w `playback.rs`, scena = pin).
OCENIANY KOD: `rust-port-wip/i5b-battle-actions-siege` = `b59cbf5d3` (kod do `0c57ebe7c`), baza `24c8f3b75` (= `origin/rust-port/parity-v2`, zgodna z linią BAZA dispatchu).
ZMIANY/COMMIT: Evaluator nie zmienia kodu; tylko ten raport.
RUNDY: 1/5.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Bramki odtworzone samodzielnie (EXIT)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (`i5b-eval/t-*`, usunięte po bramkach). Renderer start przy 12 GB wolnego, bez innego buildu renderera, bez `--features gpu`. `renderer/Cargo.lock` zmieniony lokalnie przez cargo — przywrócony (`git checkout`), DŁUG-T1-LOCK.

| Crate | Bramka | Wynik |
|---|---|---|
| view-model | `cargo fmt --check` | EXIT 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| view-model | `cargo test --all-targets` | EXIT 0 — 119 passed, 0 failed, 0 ignored (15 binarek) |
| engine | `cargo fmt --check` | EXIT 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine | lista z dispatchu (`p4_1i5b_siege_actions`, `p4_1i5b_support`, `p4_1i3_actions`, `p4_1i5a_move_shot`, `bridge_contract`, `p6_k5loop_close_r2/r3/r4`, `p6_k5loop_siege_atk_a/atk_b/def`, `p6_k5loop_tags_rest`) | EXIT 0 — 9, 9, 6, 5, 1, 6, 6, 11, 8, 10, 10, 5 passed |
| engine | pełny `cargo test` (w tle, log) | EXIT 0 — 4127 passed, 0 failed, 1 ignored (545 binarek; jedyny `ignored` = `e2e::dump_tick1_econ_for_web_generator`, `#[ignore]` istniał na bazie `24c8f3b75`, `p6_order_lane.rs:1530`) |
| renderer | `cargo fmt --check` | EXIT 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| renderer | `cargo test --all-targets` | EXIT 0 — 736 passed, 0 failed, 0 ignored (83 binarki; zgodne z raportem Operatora) |

## 2. Allowlista i zakazy

- `git diff --stat 24c8f3b75..b59cbf5d3`: 13 plików, wszystkie w allowliście (`view-model/src/battle.rs`, `view-model/tests/battle_actions_siege.rs`, `engine/src/domain/siege_tactics_actions.rs`, `engine/tests/p4_1i5a_move_shot.rs`, `engine/tests/p4_1i5b_*.rs`, `engine/tests/p6_k5loop_close_r4.rs`, `p6_k5loop_siege_atk_a.rs`, `p6_k5loop_siege_atk_b.rs`, `renderer/src/battle/playback.rs`, `renderer/tests/battle_playback_siege.rs`, raporty runu). Nie ruszono `siege_tactics_loop.rs`, `siege_battle_session.rs`, `siege_battle_adapter*`, `bridge.rs`, `client/`, `src-tauri/`, `gra/**`, `Cargo.toml`, `renderer/Cargo.lock`, `REJESTR-RUST.md`, `dynamics.rs`, fikstur.
- „Pliki spoza allowlisty” / zmiany wymuszone: sprawdzone linia po linii. W `p6_k5loop_close_r4.rs`, `p6_k5loop_siege_atk_a.rs`, `p6_k5loop_siege_atk_b.rs` usunięto WYŁĄCZNIE testy asertujące `Err(*WithoutDto)` (`leave_i_shaken_bez_dto_to_jawny_blad`, `wejscie_na_mur_bez_dto_jawny_blad`, `akcje_muru_i_bramy_bez_dto_jawny_blad`) i nieużywane importy; zastąpione sweepami 1:1 po WSZYSTKICH wektorach z progami pokrycia. Żadnej innej asercji nie osłabiono. `p4_1i5a_move_shot.rs`: test „nadal błąd” zamieniony na „ma DTO” (wymuszone celem).
- Brak `#[ignore]` w nowych/zmienionych plikach; brak `#[non_exhaustive]`; główny `match` po `BattleActionKindDto` w `playback.rs::apply_action` i w `actions_to_dto` bez `_ =>` (jedyne `_ =>` w `playback.rs:1080` to `gate_cell`, `match` po `Option`). `git grep WithoutDto rust-port`: 0 użyć w kodzie (3 wzmianki w komentarzach testów).

## 3. Zgodność z tekstem pinu `07d2fbd72` (git show) i decyzjami

Sprawdzone bezpośrednio na tekście `gra/src/battle/battleScene.ts`:
- `_attackGate` `:7310-7335` / `_animateRam` `:7337-7360`: `startPos = ramMesh.position.clone()` (pozycja grupy w chwili akcji), `gateDir` w XZ, `duration = 320`, `if (this.finished) position.copy(startPos)` — konsument `Ram` (pozycja grupy, `RamAnim::start`, `until == t0 + RAM_MS`, krok z `finished`) zgodny. Druga animacja tej samej jednostki: pin puszcza obie równolegle; `rams.retain` usuwa pierwszą — wynik sceny identyczny (późniejsza wygrywa w każdej klatce i kończy później; mutant E8 równoważny, §4).
- `_attackWallTile` `:7540-7564` / `_spawnCatapultBoulder` `:7571-7601`: `from = (cell(ru.q, ru.r), tileTopY + 0.8)`, `to = (siegeWallCol, row, 1.5)`, `_schedule(700)`, etykieta `'-' + dmg + ' (mur)'` `#ff8800`, `wallTileHp.set` — zgodne.
- `_breachWallTile` `:7638-7741`: `wallTileHp.delete`, `_destroyTowerAtRow` (osobna akcja `TowerDestroyed` przed), `'MUR WYBURZONY!'` `#ff4400`, 7 brył gruzu, pętla obrońców (katapulta → `_startFade`, reszta → odwrót/zostaje, `onWallWalkway = false`). `_startFade` `:9926-9937` nie rusza paska HP — D-I5B-15 merytorycznie słuszna.
- `_breachGate` `:7757-7811`, `_destroyTowerAtRow` `:4194-4201`, `_trySiegeTowerClimb` `:8056-8082` (`ru.q + dc === wallBase` dla `DIRS4` ⇔ `|q − (wallCol−1)| ≤ 1`, wiersz bez zmian, `(x, 2.5, z)`), `_fleeStep` `:9845-9893` + `_removeUnitFromScene` `:9910-9925` (usunięcie w `done()` po ostatniej klatce kroku → dokończenie `MoveAnim` w `t0`), `_shakeAlliesOnLoss` `:9743-9753` — zgodne.
- Fikstura renderera = `tests/fixtures/battle3d/dynamics.json` (generator `gen_dynamics.ts` wykonuje pin); testy `battle_playback_siege.rs` porównują scenę playbacku bit w bit ze sceną wywołań i z wektorami webu (tor kamienia, taran w 12 próbkach, kafle RLE, pola odwrotu, gruz, etykiety). Wektory silnika (r4, T2a, T2b ×3 pliki) pochodzą z generatorów wykonujących pin (wcześniejsze tematy).
- D-I5B-13 (obrażenia `Infinity` → jawny `Invalid(NonFinite)`, 66 przypadków T2b, prefiks 1:1): akceptowalne jako decyzja techniczna (serde_json nie zapisze `Infinity`; dane gry go nie mają); nie jest cichym pominięciem.
- FC-U3-MISS: nie zamknięty — generator r3 poza allowlistą; warunek dispatchu („jeśli możliwe bez zmiany silnika”) nie wymusza go. Przyjęte jako dług.

**Rozbieżność z tekstem pinu (Z-4):** filtr znacznika D-I5B-15 w `playback.rs` (`WallBreach`): `!u.removed && u.on_wall_walkway && u.col == wall_col && u.row == *row`; pin `:7699-7701`: `if (u.dead || u.fadingOut || u.routed) continue; if (u.onWallWalkway && u.r === wallRow && u.q === wallCol)`. Rozbita/uciekająca jednostka obrońcy na koronie wyburzonego kafla dostaje w Rust znacznik, w pinie nie jest dotykana; jej `Kill` z ciosu w tym samym `t0` straci zapis paska HP (pin go wykona). Mała osiągalność, ale to odstępstwo od tekstu pinu bez decyzji D-I5B ani testu.

## 4. Mutanty adwersarialne Evaluatora (własny skrypt; mutant → test dotkniętych binarek `--no-fail-fast` → przywrócenie)

Renderer (`battle_playback_siege`, `battle_playback`, `battle_playback_move_shot`), view-model (`--all-targets`):

| ID | Mutant | Wynik |
|---|---|---|
| E1 | filtr znacznika wyłomu bez `u.on_wall_walkway` | **PRZEŻYŁ** |
| E2 | filtr znacznika wyłomu bez `u.col == wall_col` | **PRZEŻYŁ** (praktycznie równoważny: `on_wall_walkway` ⇒ kolumna muru; brak testu) |
| E3 | `Leave`: `removed` zawsze `true` | zabity |
| E4 | `Shaken` bez sprawdzenia `fallen` w scenie | zabity |
| E5 | `GateDamage` bez `gate_cell` (`NoSiege`) | zabity |
| E6 | `ClimbWall` bez `in_grid(to)` | zabity |
| E7 | `LeaveField` bez `in_grid(to)` | zabity |
| E8 | `Ram` bez `rams.retain` (dwie animacje tej samej jednostki) | przeżył — RÓWNOWAŻNY (pin też puszcza obie; późniejsza nadpisuje w każdej klatce, `finished` → ten sam `startPos` drugiej) |
| E9 | taran krokowany z `finished = false` | zabity |
| E10 | etykieta trafienia w kolumnie `wall_col + 1` | zabity |
| E11 | pierwsze trafienie kafla nie zapisuje HP | zabity |
| E12 | `LeaveField` NIE czyści znacznika wyłomu jednostki | **PRZEŻYŁ** — nierównoważny; doc testu `breach_mark_is_limited_to_the_tile_and_its_t0` twierdzi, że sprawdza wygaśnięcie przy `LeaveField`, a test nie zawiera żadnego `LeaveField` |
| E13 | `GateBreach` nie ustawia `gate_open` | zabity |
| E14 | `gate_hp = hpAfter + 1` | zabity |
| E15 | zejście bez wolnego pola nie zdejmuje `on_wall_walkway` | zabity |
| E16 | start taranu przesunięty o 0,01 w Y | zabity |
| E17 | wejście na mur sprawdza tylko kolumnę (wiersz dowolny) | zabity |
| E18 | taran celuje w `(gateCol, gateRow + 1)` | zabity |
| E19 | `moved = to.col != from.col` | przeżył — RÓWNOWAŻNY przy `wall_col < BF_COLS − 1` (pin: `cc = min(BF_COLS−1, wallCol+dc)`, `dc ≥ 1`) |
| E20 | `SceneCall::WallBreach.rubble` na sztywno 7 | przeżył — tylko ślad diagnostyczny (scena P == Q sprawdzana osobno); fikstura zawsze ma mur. Nota, nie blokada |
| E21 | znacznik nie wygasa przy zmianie `t0` | zabity |
| V1 | `Shaken` bez `action_finite(morale)` | **PRZEŻYŁ** — nierównoważny: `morale = Infinity` przechodzi walidację (test sprawdza tylko NaN, które łapie `>= 0`) |
| V2 | `ClimbWall` bez indeksu `toRow` | przeżył — RÓWNOWAŻNY (`toRow == fromRow` i `fromRow >= 0`) |
| V3 | `Ram` bez `action_finite(until)` | zabity |

Mutanty Operatora (43) — nie powtarzano wszystkich; próbka E9/E10/E13/E15/E17/E18/E21 pokrywa się z jego RM12/RM19/RM13/RM8/RM10/RM11/RM7 i potwierdza ich zabicie.

## 5. Zarzuty (do rundy r2 Operatora — zakres wąski, bez zmian logiki poza Z-4)

- **Z-1 (E12):** dodać test: `WallBreach(row)` → `LeaveField(d, …)` → `Kill(d)` z TYM SAMYM `t0` ⇒ pasek HP = 0 (cios). Poprawić opis testu, jeśli zostanie jak jest.
- **Z-2 (E1):** dodać test: obrońca na polu `(wall_col, row)` z `on_wall_walkway = false` (np. po wcześniejszym wyłomie) + `WallBreach(row)` + `Kill` z tym samym `t0` ⇒ pasek HP = 0. Opcjonalnie (E2) obrońca z `on_wall_walkway` poza kolumną muru — albo jawny wpis równoważności.
- **Z-3 (V1):** `walidacja_obrazen_i_hp`: `Shaken.morale = Infinity` ⇒ błąd `a.action.morale` (obie strony: `Infinity` błąd, `0` ok).
- **Z-4 (pin):** filtr znacznika D-I5B-15 zgodny z tekstem pinu (`dead || fadingOut || routed` pomijane) albo jawna decyzja D-I5B-16 z uzasadnieniem i testem (playback nie zna `routed` — jeśli brak stanu, opisać i uzasadnić, że `Kill` rozbitej jednostki w tym samym `t0` jest nieosiągalny, z dowodem z wektorów).
- Raport: dopisać E8/E19/V2 jako jawnie równoważne (lub przyjąć z tego raportu).

## 6. Długi (bez wpływu na werdykt)

- FC-U3-MISS (generator r3 poza allowlistą), D-I5B-13 (`Infinity` bez reprezentacji DTO), D-I5B-1..15 do `REJESTR-RUST.md` (orkiestrator), morale po wyłomie tylko z ramki, brak produkcyjnego wołającego playbacku — zgodnie z §7 Operatora.
- E20: ślad `SceneCall::WallBreach.rubble` niesprawdzony dla bitwy bez grupy muru.
- DŁUG-T1-LOCK: `cargo test` renderera modyfikuje `Cargo.lock` lokalnie (przywrócone).

## 7. Następny krok

Obrona (02a) → Final Control. Zalecenie: runda r2 Operatora (ten sam ID, baza `b59cbf5d3`) z Z-1..Z-4 — tylko testy w `battle_playback_siege.rs` / `battle_actions_siege.rs` i ewentualnie warunek filtra w `playback.rs`; bramki renderera + view-model ponownie.
