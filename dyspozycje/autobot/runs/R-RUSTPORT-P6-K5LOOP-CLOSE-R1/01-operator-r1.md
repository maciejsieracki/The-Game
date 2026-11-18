# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — raport Operatora, runda 1

STATUS: PASS-WITH-NOTES (runda niepełna wg planu dispatchu: pkt 1 + AdvanceStep zrobione; reszta gałęzi = runda 2, lista niżej)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: `update_facing` prawdziwy po każdym kroku ruchu; każde `ActivateEvent` spoza listy wykonane wg pinu albo jawnie udowodnione jako nieosiągalne.
BAZA: `origin/rust-port/parity-v2` = `4b27bc689` (w chwili pisania dispatchu `0f77c9da3`; parity przesunęło się o DOC-DEBTS, bez konfliktu z tym tematem). Gałąź robocza: `rust-port-wip/k5loop-close-r1`.

## ZMIANY/COMMIT

Allowlista (tylko):
- `rust-port/engine/src/domain/siege_tactics_loop.rs` — kod.
- `rust-port/engine/tests/p6_k5loop_close.rs` — nowy test.
- `rust-port/engine/tests/p6_k5loop_close_gen.mjs` — nowy generator (wykonuje tekst pinu).
- `rust-port/engine/tests/p6_k5loop_close_vectors/vectors.json` — 420 wektorów.
- ten raport.

Nie ruszano: `siege_tactics_inputs_pos.rs`, `siege_tactics_move_effects.rs` (adaptery nie były potrzebne), `gra/**`, `data/**`, `Cargo.*`, istniejących wektorów/testów `p6_siege_tactics_loop*` (bez zmian, nadal zielone).

SHA commitu kodu: `aa0f55121b58448fd39988a32a45b3456694a7d4` (gałąź `rust-port-wip/k5loop-close-r1`, rodzic `4b27bc689`). Raport w osobnym commicie nad nim.

### Co zmieniono w `siege_tactics_loop.rs`
1. **`update_facing` po ruchu (pkt 1, D-K5C-1).** `ProdMoveWorld::update_facing` nie jest już no-opem: zapisuje żądanie (`facing_requested`), a `ProdBody::move_step_core` wykonuje istniejące `ProdBody::update_facing` (`_updateFacing` + `_nearestEnemy` + `facingToward`, commit `923540b65`) zaraz po `do_move_effects`, z NOWEJ pozycji. W pinie `_updateFacing(ru)` to ostatni efekt stanu `_doMove` (`battleScene.ts:8704` planowanie, `:8756` bezpośrednio), po `ru.q/ru.r` i `moveLeft` — kolejność identyczna. Zmiana facing emituje `BattleAction::Facing` w czasie kroku. Publiczne `move_step` (API T4e, bez `TurnSeqState`) bierze flagi wrogów z `ProdUnit::activate`; ścieżka produkcyjna (`start` → `advance_step`) bierze je z `TurnSeqState`.
2. **`ActivateEvent::AdvanceStep` wykonywane (`_advanceStep`, `:8198-8285`).** `ProdBody::advance_step`: decyzja K5DOC-T4b `advance_step_decide` → krok `_doMove` przez `move_step_core` (efekty T4c + facing) → callback `advance_after_move`; `Schedule` = kolejna iteracja. Klocki T4a/T4b/T4c/EXEC-T2 wołane bez zmian (D-K5C-3); cienkie adaptery w tym samym pliku:
   - `ProdAdvanceWorld: AdvanceWorld` — `_canAttackFrom`/`_makeCanAttackFromTest` (reach 1, bez muru), `_nearestEnemy`, `_shouldAvoidAutoBacktrack` (przez `player_order_move_gate::should_avoid_auto_backtrack`), `_compactAttackAllowsStep` (przez `player_order_move_gate::compact_attack_allows_step`, doktryna = `_getEffectiveDoctrine`, linia = jednostki strony z `in_play` z `TurnSeqState`).
   - `ProdPathEnv: AutoBatchEnv` — wyłącznie `passable_for_unit` (= `_passableForUnit`, `:7446`); pozostałe metody `unreachable!` (helpery T4a ich nie wołają).
   - `unit_move_cost` — wspólny `_moveCostForUnit` (`:7436-7443`) dla ruchu i ścieżki.
   - Czas: `MOVE_STEP_MS` (240, `:1010`) na krok + `STEP_GAP_MS` (70, `:1011`) na każdy `_schedule`; nowa stała `MOVE_STEP_MS` w module. `moveLeft` zapisywane do `TurnSeqState` w `complete` (`ProdPending::move_left`). `lastAutoMoveFrom` zapisywany w callbacku jak w pinie (`:8274`).
3. **`occByKey` przy rout/śmierci.** `start_rout` i `start_fade` zwalniają pole (`release_tile`, pin `:9812`, `:9915`) — zajętość ma teraz konsumenta (ruch). `pub fn sync_occupancy(st)` odtwarza ten stan dla jednostek już `routed`/`removed` (wejście ze stanu, testy).
4. **Nowe pola (D-K5C-4)** w `ProdBody` (nie w `ProdUnit`, bo literał `ProdUnit` jest w testach spoza allowlisty):
   - `formation_rank: [Vec<Option<f64>>; 2]` — `ru.formationRank` (`:2039`, pole opcjonalne, `?? 0`), domyślnie `None`.
   - `group_meta: HashMap<String, GroupMeta>` — `this._groupMeta` (pusta mapa na starcie bitwy, pin).
   Testy: każdy wektor ustawia oba pola (grupy z `autoPlay=false`, doktryny steady/aggressive/defensive/skirmish/manual, rangi 0..3/brak).

### Jawne tagi (bez cichego pominięcia)
- `krok-naprzod-brak-terenu`: `_advanceStep` wymaga `_passableForUnit`, a ciało nie ma `MoveTerrain` (reguła D1 z K5DOC-T4e-0: brak terenu = jawny błąd, nie wartość domyślna). Dlatego istniejące wektory `p6_siege_tactics_loop_body_pin` (bez terenu) zachowują się jak dotąd (brak ruchu) i nadal przechodzą bajt w bajt. Produkcyjny adapter (#113) MUSI podać teren.
- `krok-naprzod-atak`: gałąź `Attack` w `_advanceStep` (`:8241-8244`). **Dowód nieosiągalności z `_activateUnit`:** dla melee bez muru `_targetInRange` (`:8373-8392`, `dd === 1 || dd === 0`) zwraca cel zawsze, gdy `_canAttackFrom` (`:8436-8444`, `dd === 1`) jest prawdą, więc `_activateUnit` wybiera `_doAttack` (`:6293-6297`) przed `_advanceStep` (`:6298`); wywołania z `_schedule` następują tylko, gdy callback `_doMove` sprawdził `!_canAttackFrom` z nowej pozycji (`:8277`), a w turze sekwencyjnej nic nie zmienia stanu przed nimi. W ciele osiągalne tylko przy niespójnym wejściu adaptera (`melee_target = None` przy żywym sąsiedzie) — test `atak_z_advance_step_jest_oznaczony`.

## Rozpoznanie: tabela wariantów `ActivateEvent`

Stan PO tej rundzie. „Strażnik” = `out_of_scope` w `ProdBody::start` (przed maszyną K5H): `tryb-reczny` (manual), `oblezenie` (mur), `strzelec` (`can_shoot || primary_ranged`), `doktryna` (`doctrine_auto`).

| wariant `ActivateEvent` | trafia do `skipped`? | linia pinu | gotowy klocek Rust | stan / plan |
|---|---|---|---|---|
| `Done` | nie (obsłużony) | 6049-6050, U7.1/U7.4/U7.6 hold | — | OK |
| `Flee` (routed na wejściu) | nie: wczesny powrót, tag `ucieczka-routed` | 6055 → `_fleeStep` 9845 | **brak portu `_fleeStep`** | runda 2: nowy port `_fleeStep` (ruch ku krawędzi, zniknięcie) + wektory |
| `Flee` (po okrążeniu) | **TAK** → `ucieczka-routed` | 6118-6120 → 9845 | brak portu `_fleeStep` | runda 2 (jw.); efekty stanu (morale, `_startRout`) już wykonywane |
| `ApplyTerrainRange` | nie | 6064 | wejście adaptera (`range`) | OK |
| `PerformPlayerOrder` / `ResetPlayerOrder` | nie | 6067-6069 / 6098 | — | tryb ręczny za strażnikiem `tryb-reczny` |
| `DoctrineStep` | nie: strażnik `doktryna` | 6099-6103 | `siege_tactics_doctrine_*` (T1-T7), brak `_executeGroupDoctrineStep` | #264 K5DOC-T8 (osobny temat) |
| `UpdateMoraleBar` / `StartRout` | nie | 6115-6117 | K5A + `start_rout` | OK |
| `UpdateFacing` | nie | 6125 → 8334 | `ProdBody::update_facing` | OK; **po ruchu: zrobione w r1** |
| `TowerClimb` / `InfantryToTower` / `RamTowerStep` | nie (no-op bez muru) | 6179-6180, 6190; `return false` 8023/8057/8088 | `siege_tactics_tower` | OK bez muru; z murem za strażnikiem `oblezenie` |
| `Attack` | nie | 6143-6170, 6228-6233, 6255, 6293-6297 | K5I `single_blow_full` | OK (melee); strzał za strażnikiem `strzelec` |
| `AttackWallTile` | nie: nieosiągalny bez muru (`wall_col >= 0` w U7.3), strażnik `oblezenie` | 6201-6207 | `siege_tactics_breach` | runda 3+ (zdjęcie strażnika `oblezenie`) |
| `AdvanceToward` | nie: jw. | 6208-6216 → 7892 | K1/K1b `siege_tactics_walk/approach` | runda 3+ (jw.) |
| `RangedAction` | nie: strażnik `strzelec` (`can_shoot`) | 6241 → 6656 | T5a `siege_tactics_kite`, T5b `siege_tactics_ranged_forward` | runda 2 (kolejność dispatchu: po kawalerii) |
| `FallBackStep` | nie: strażnik `strzelec` (`primary_ranged`) | 6272 → 7228 | T7b `siege_tactics_fallback` | runda 2 (razem z usunięciem strażnika `strzelec`) |
| `CavalryAction` | **TAK** → `kawaleria` | 6284 → 6372-6412 | T6 `siege_tactics_cavalry::cavalry_action_decide` | runda 2 (pierwsza w kolejce) |
| `PhalanxAction` | **TAK** → `falanga` | 6290 → 6546-6578 | T7a `siege_tactics_phalanx` (+ `_advanceStep` z r1 dla gałęzi bez linii) | runda 2 |
| `AdvanceStep` | ~~TAK~~ → **wykonywane (r1)** | 6298 → 8198-8285 | T4a/T4b/T4c/EXEC-T2 | **ZROBIONE**, 420 wektorów |

Po r1 w `skipped` mogą trafić tylko: `ucieczka-routed` (po okrążeniu), `kawaleria`, `falanga`. Pozostałe niepuste `unported` pochodzą ze strażników (`tryb-reczny`, `oblezenie`, `strzelec`, `doktryna`), z wczesnego `ucieczka-routed` oraz z wcześniejszych, niezwiązanych tagów (`shakeAlliesOnLoss`, `dowodca-*`, `wieza-resolveBlowOutcome-efekty`, `cios-bez-szablonu`, `kontratak-*`).

### Gałęzie NIEZROBIONE (runda 2+, z linią pinu)
1. `CavalryAction` — `_cavalryAction` `battleScene.ts:6372-6412` (klocek T6 gotowy; uwaga: T6 emuluje `_doMove` jako `moveLeft -= 1`, w ciele trzeba wołać `move_step_core`, czyli prawdziwy koszt + facing).
2. Strzelec: `RangedAction` `:6656` i `FallBackStep` `:7228` (wymaga usunięcia strażnika `strzelec`, celu `_rangedTargetInRange` `:7041`, `_doRangedAttack`, stanu `dryCol`/`heldAfterFallback` już w `ActivateUnit`).
3. `PhalanxAction` `:6546-6578` (+ `_phalanxStep` `:6588-6636`).
4. `Flee` — `_fleeStep` `:9845` (brak portu w Rust: wymaga nowego klocka, nie tylko wpięcia).
5. Poza tym tematem: `DoctrineStep` (#264), mur/oblężenie (`AttackWallTile`/`AdvanceToward`, wieże w ciele), tryb ręczny.

## TESTY

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach). Dysk przed pełną bramką: 14 GB wolne.

- Generator: `node rust-port/engine/tests/p6_k5loop_close_gen.mjs` → 420 wektorów, SHA-256 wycinków pinu `bdc91c510d5aa71824eb536ba08b982a390dc83bd3435ce59255f7a85ca5559c` (strażnik twardy w generatorze), statystyki: ruch 360, ≥2 kroki 276, zmiana facing po kroku 41, bez ruchu 60, z brodem 408.
- `cargo test --test p6_k5loop_close`: 3/3 PASS (`advance_step_i_facing_po_ruchu_zgodne_z_pinem` — 420 wektorów: ślad aktywacji, czas, pozycja, `moveLeft` bitowo, facing, każda zmiana facing z czasem, `occByKey`, `lastAutoMoveFrom`, `unported` puste, zero zużytych rzutów; `brak_terenu_daje_jawny_tag_bez_ruchu`; `atak_z_advance_step_jest_oznaczony`).
- Wcześniejsze testy ciała po zmianie: `p6_siege_tactics_loop_body_pin`, `p6_siege_tactics_loop_body`, `p6_k5doc_t4e`, `p6_k5loop_outcome_pin`, `p4_1i3_actions` — PASS.
- Bramki dispatchu (engine, EXIT 0 każda):
  - `cargo fmt --check` — EXIT 0
  - `cargo clippy --all-targets -- -D warnings` — EXIT 0, bez ostrzeżeń
  - `cargo test --test p6_k5loop_close` — EXIT 0 (3 passed)
  - `cargo test --test 'p6_siege*'` — EXIT 0 (wszystkie pliki `p6_siege*`, 0 failed)
  - `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) — EXIT 0: 527 binarek, 3931 passed, 0 failed, 1 ignored (istniejący `#[ignore]` sprzed tematu, nie dodany tu)
  - `git diff --check` — czysto
- `CARGO_TARGET_DIR` (scratchpad) usunięty po bramkach.

### Mutacje (każda musi dać FAIL)
Skrypt: zamiana w `siege_tactics_loop.rs`, `cargo test --test p6_k5loop_close`, przywrócenie pliku.
| mutant | zmiana | wynik |
|---|---|---|
| (a) facing po ruchu wyłączony | `if facing_requested` → `if false && …` w `move_step_core` | **FAIL** (141 rozbieżności) |
| (b) gałąź `AdvanceStep` pominięta | `AdvanceStep => advance = true` → `{}` | **FAIL** (1569 rozbieżności + test braku terenu) |
| (b2) brak kontynuacji `_schedule` | `Schedule` → `break` | **FAIL** (1178) |
| (b3) bramka kompaktu zawsze `true` | `compact_attack_allows_step(...) \|\| true` | **FAIL** (88) |
| (b4) `_passableForUnit` = samo `passable` | zamiast `isFinite(_moveCostForUnit)` | PRZESZEDŁ — mutant RÓWNOWAŻNY dla piechoty: `_moveCostForUnit` (`:7436-7438`) daje `Infinity` wyłącznie gdy `!passable`, mnożnik kawalerii (`:7440-7441`) dotyczy tylko `mounted`; różnica pojawi się w rundzie z kawalerią |

Skrypt mutacji: scratchpad `mut.sh` (lokalny, poza repo); plik źródłowy przywracany i porównany `cmp` z kopią po przebiegu.

Mutacja (c) z dispatchu (kolejność rzutów RNG w gałęzi) **nie ma zastosowania**: `_advanceStep`/`_doMove`/`_updateFacing` w pinie nie wołają `Math.random`. Test to wymusza: `SequenceRolls::new(vec![])` panikuje przy pierwszym rzucie, więc każda gałąź losująca dałaby FAIL. Mutacja (c) wróci w rundzie z kawalerią/strzelcem (rzuty ciosu).

## BLOKADY
- Brak blokad technicznych tej rundy.
- NIE_ZMIERZONO: (1) czas kroku jest nominalny (240 + 70 ms); pin animuje `_raf` do `p >= 1`, czyli z kwantyzacją klatki AUTO/FF — to wejście sterownika (jak `BLOW_HIT_T` w `body_ms`); (2) brak akcji `Move` w `BattleAction` — renderer (I5) dostanie `Facing`, ale nie animację kroku; dodanie wariantu to plik `siege_tactics_actions.rs` (poza allowlistą) → do I5/#113; (3) zwalnianie pola w `start_rout`/`start_fade` nie ma wektora (scenariusze r1 nie mają routu w trakcie aktywacji), kod = 1:1 z `:9812`/`:9915`; (4) `lastAutoMoveFrom` w scenariuszach zawsze `null`: `_shouldAvoidAutoBacktrack` = true wymaga `_isUnitDoctrineAuto` = true, a takie jednostki są za strażnikiem `doktryna` — zapis w callbacku jest zaportowany, ale w zakresie ciała nieosiągalny.
- Efekt uboczny pinu bez znaczenia dla wyniku: `_effectiveMetaForUnit` → `_ensureGroupMeta` wstawia brakującą metę `{steady, autoPlay:true}`; to te same wartości co domyślne (`?? 'steady'`, `?? true`), więc odczyty po wstawieniu dają ten sam wynik (generator wykonuje oryginał).

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator r1. Runda 2 tego ID: `CavalryAction` → strzelec (`RangedAction` + `FallBackStep`, zdjęcie strażnika `strzelec`) → `PhalanxAction` → `_fleeStep` (nowy port). Po FC PASS całości: K5LOOP-WIRING (#113), potem I5.

## DEPLOY/PUSH
NIE WYKONANO
