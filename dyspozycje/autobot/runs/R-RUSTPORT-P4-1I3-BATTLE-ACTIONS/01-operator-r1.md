# R-RUSTPORT-P4-1I3-BATTLE-ACTIONS — Operator, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I3-BATTLE-ACTIONS
GOAL: Vec<BattleActionDto> (recon §2c) dla ścieżek już portowanych (cios, kontratak, strzał wieży, rout, śmierć, koniec, tura)
      emitowane przez SiegeLoop/ProdBody + producent tekstów logu i _pushClash (L5) 1:1 z pinu 07d2fbd72.
ZMIANY/COMMIT: kod facb6f3d5 (rodzic = baza FC P4-1I2 43709ed0a); raport w commicie następnym na gałęzi
      wip/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS-op-r1 (worktree wf_53456dc3-0dd-1). Bez push.
TESTY: view-model fmt/clippy/test EXIT 0 (13 binarek, 109 testów); engine fmt EXIT 0, clippy --all-targets -D warnings
      EXIT 0, testy wszystkich 496 binarek --all-targets EXIT 0 (3666 passed, 0 failed, 1 ignored — istniejący
      p6_order_lane, nie z tego tematu). Mutacje (a)(b)(c): FAIL (szczegóły niżej).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i środowisko

- Baza: `43709ed0a` (FC P4-1I2 r2, PASS-WITH-NOTES), gałąź robocza `wip/R-RUSTPORT-P4-1I3-BATTLE-ACTIONS-op-r1`.
- Pin webu: `07d2fbd72` (`gra/src/**`, tylko odczyt przez `git show`/`git archive`).
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo,
  usunięty po bramkach. `Cargo.lock` usunięty, nie commitowany.
- Dysk: przed bramką engine 9,5 GB wolne (≥ 8 GB, bramka wykonana); w szczycie budowy testów 3,4 GB; po sprzątaniu 8,5 GB.

## Zmiany (allowlista)

| Plik | Zakres |
|---|---|
| `rust-port/view-model/src/battle.rs` | `BattleActionDto { t0, action }`, `BattleActionKindDto` (Turn, Facing, Melee, TowerShot, Damage, Clash, Rout, Kill, Log, End), `BattleActorDto` (Unit/Tower), `BattleClashTagDto`; `validate_at` + `validate_actions` (t0 skończone ≥ 0 i niemalejące, hitAt/landAt ≥ t0, dmg > 0, dir 0..3, roundNo ≥ 1, teksty niepuste, melee attacker ≠ target); nagłówek modułu (D-DTO-7 wg recon §5). |
| `rust-port/view-model/tests/battle_actions.rs` (nowy) | klucze JSON, round-trip, `deny_unknown_fields`, 9 przypadków walidacji. |
| `rust-port/engine/src/domain/siege_tactics_actions.rs` (nowy) | `BattleAction`/`TimedAction`/`Actor`; teksty 1:1 z pinu: `miss_log` (`:8962`, `toFixed(0)` → `js_to_fixed0`), `hit_log` + `arc_tag` (`:8993-9000`), `eliminated_log` (`:9046`), `rout_log` (`:9819`), `tower_shot_log` (`:4247`), `tower_shooter_name` (`:4241`), `clash_line` + `side_tag` + `push_clash_entry` (`:9550-9566`, `:1091`, `CLASH_LOG_MAX`); logi końca `check_end_logs` (`:10153-10239`), `finish_draw_logs` (`:9471-9472`), `ff_round_cap_logs` (`:9485-9497`), `round_cap_reason` (`:9449-9464`); `actions_to_dto` (+ walidacja). |
| `rust-port/engine/src/domain/mod.rs` | tylko `pub mod siege_tactics_actions;`. |
| `rust-port/engine/src/domain/siege_tactics_loop.rs` | wyłącznie emisja: `LoopBody` dostał domyślne `set_now`, `set_tower_row`, `take_actions`, `unit_name` (bez zmiany istniejących implementacji); `SiegeLoop`: pola `actions`, `tower_in_flight`, `actions()/take_actions()/actions_dto()`, Turn przy `SetHint`, log+TowerShot w `tower_shoot`, `set_now` przed `start/complete/tower_blow`, logi + End w `finish` (z `EndCheck` i `RoundCapResult`); `ProdBody`: pola `names`, `tower_shooter_nazwa`, emisja Facing (`_updateFacing` tylko przy zmianie; zwrot atakującego przy starcie lunge), Melee, log ciosu, Rout/Facing/log w `start_rout`, log `wyeliminowany` + Kill, Clash (tag wg pinu), Damage (warunki `:9125`, `:9142`, `:4265`), akcje trafienia wieży. Logika walki i wynik `resolve` bez zmian (stare testy pętli/ciała zielone). |
| `rust-port/engine/tests/p4_1i3_actions_gen.mjs` (nowy) | generator TS wykonujący tekst pinu (opis niżej). |
| `rust-port/engine/tests/p4_1i3_actions_vectors/vectors.json` (nowy) | 320 sekwencji ciosu (1743 aktywacje), 160 scenariuszy wieży, 240 scenariuszy końca; generator deterministyczny (MD5 przed/po ponownym uruchomieniu: `96de3349fadff8f9072e47d579928893`). |
| `rust-port/engine/tests/p4_1i3_actions.rs` (nowy) | 6 testów (niżej). |

`siege_tactics_blow.rs` (dozwolony „tylko SceneEffect”) — **bez zmian**: lista `SceneEffect` wystarcza; tag `_pushClash`
liczony w `ProdBody` ze stanu po `_applyMoraleDamage` (pin `:9067`), bo `strike` podaje `routed_after_morale = true`.

## Kolejność i czas akcji (= kolejność wywołań sceny w pinie)

Cios (`_doMeleeAttack`): `t0` = start aktywacji: [Facing (gdy `_updateFacing` zmienia), Facing atakującego (`:9104-9105`),
Melee{hitAt = t0 + body_ms}] → w `t0 + body_ms` (adapter `BLOW_HIT_T` = 150): log ciosu → skutki (`_startRout`: Rout,
kaskada osłony, Facing W/E, log; zabicie: log `wyeliminowany`, Kill) → Clash → Damage (gdy `dmg > 0 && !dead`) →
kontratak: Facing obrońcy (`:9137-9138`), log, skutki, Clash, Damage. Wieża: log `Wieza strzelnicza …` + TowerShot w chwili
wystrzału, trafienie w pierwszej klatce `vNow ≥ landAt`. Koniec: linie `_checkEnd`/`_finishDraw`/`_ffRoundCapResult`, potem End.

## Wektory (generator TS) i testy

Generator wykonuje tekst pinu `_activateUnit` → `_doAttack` → `_doMeleeAttack` (`:9096-9175`, z prawdziwą pętlą klatek
`_raf`/`_now`) → `_singleBlow` (`:8809-9011`) → `_resolveBlowOutcome` (`:9019-9068`), `_pushClash` (`:9550-9566`),
`_startRout`, `_startFade`, `_fireOneTower` (`:4223-4270`) + `pickTowerTarget` (city-towers.ts:141), `_checkEnd`,
`_finishDraw`, `_ffRoundCapResult`, `_roundCapVerdict`, `commandersToWithdrawAfterArmyBreak`; helpery ciosu i `toCombatUnit`
na units.json pinu (harness K5-LOOP-BODY, te same strażniki SHA). Przechwycenie: setter `rotation.y`, pierwszy `_raf`,
`this.log.push`, `_spawnDamageLabel`, `_renderClashLog`, strażnik `_startRout`/`_startFade`, `projectiles.push`,
`_showEndScreen`. Strażnik fragmentów akcji `ACTIONS_SHA256 = 07ee4ff4…2cf5` (test `straznik_fragmentow_pinu`).

| Test | Wynik |
|---|---|
| `zgodnosc_akcji_ciosu_i_kontrataku_z_pinem` | 1743 aktywacje, pełna sekwencja akcji bajt w bajt; pokrycie ≥ 10 każdego rodzaju (melee, pudło, trafienie, kill, rout, damage, clash plain/padl, FLANKA, TYL). |
| `wektory_zawieraja_kontrataki_po_ciosie` | ≥ 100 aktywacji z dwoma ciosami i zwrotem obrońcy między nimi. |
| `zgodnosc_akcji_strzalu_wiezy_z_pinem` | pełny `SiegeLoop` w oblężeniu, 160 scenariuszy (strzały ≥ 80, zabicia ≥ 5, pudła ≥ 20). |
| `zgodnosc_logow_konca_z_pinem` | 240 scenariuszy: `end_check_order` + `check_end_logs` / `round_cap_verdict` + `ff_round_cap_logs`, zgodność z `_checkEnd()` (zwrot bool) i liniami logu. |
| `petla_emituje_ture_wieze_i_koniec_jako_dto` | Turn{1} na początku, Kill przed End, linia `:10229`, `actions_dto()` przechodzi walidację, `take_actions` opróżnia. |
| `straznik_fragmentow_pinu` | SHA fragmentów, `BLOW_HIT_T`. |

## Mutacje (wymagane dispatchem) — wszystkie FAIL

| Mutacja (w kodzie, potem cofnięta) | Wynik |
|---|---|
| (a) pominięcie akcji kontrataku (`self.actions.truncate` po `strike` w `counter_strike`) | `zgodnosc_akcji_ciosu_i_kontrataku_z_pinem` FAILED, 293 rozbieżności (`damage def0 1` zamiast `facing atk2 2`). |
| (b) zamiana kolejności cios/kontratak (blok akcji ciosu przeniesiony za kontratak w `complete`) | ten sam test FAILED, 293 rozbieżności (`facing atk2 2` zamiast logu ciosu). |
| (c) `toFixed(1)` zamiast `toFixed(0)` w `miss_log` (`format!("{roll:.1}")`) | FAILED: cios 374 rozbieżności (`95.0>=` vs `95>=`), wieża 51. |

## NIE_ZMIERZONO / uwagi

1. **Czas trafienia wieży w przewijaniu.** `SiegeLoop` odpala `TowerHit` w pierwszej klatce FF z `vNow ≥ landAt` (krok
   `BATTLE_FRAME_WALL_MS` = 16; pin `_drainTimers` tak samo), a generator woła callback dokładnie w `landAt`. Test sprawdza,
   że czas trafienia leży w `[landAt, landAt + 16)`, i porównuje go jako `landAt`. Pole `TowerShot.landAt` = nominalne
   `t0 + RANGED_FLY_MS`.
2. **Etykiety w FF.** Pin pomija `_spawnDamageLabel` przy `_ffActive` (`:9943`); silnik emituje `Damage` zawsze (pętla Rust
   = ścieżka przewijania). Decyzja o pokazaniu należy do konsumenta (I4).
3. **Trafienie wieży — skutki poza zabiciem** pozostają nieportowane (wpis `wieza-resolveBlowOutcome-efekty`); emitowane
   są log, przy zabiciu log `wyeliminowany` + Kill, Clash i Damage. Wektory wieży mają cel `neverRout` (bez rout w pinie).
4. **Zwrot atakującego** emitowany w `start` (wartość liczona z tego samego wejścia co w `strike`); stan `facing` nadal
   zmienia `strike` w `complete` (bez zmiany logiki).
5. **W pętli oblężniczej `ProdBody` nie zadaje ciosów** (ścieżka `oblezenie` nieportowana, #113/#280), więc akcje ciosu
   są dziś osiągalne przez `ProdBody` wywoływane jak w pętli (test (1)); przez `SiegeLoop` w oblężeniu: tura, wieża, koniec.
6. Poza zakresem (jawnie): `_shakeAlliesOnLoss`, efekty dowódcy (`commandersToWithdrawAfterArmyBreak` → `_startRout`),
   `_destroyTowerAtRow` log (`:4199`), `Banner`, ruch, strzelec, taran, katapulta, wyłom, wspinaczka (I5), konsument (I4).
7. Logi końca liczone w `apply` ze zrzutu `end_check_snapshot` wywołanego ponownie przy obsłudze `EndCheck` (stan HP/morale/
   flag nie zmienia się między testem a obsługą zdarzenia). W `SiegeEnv` `stalled = false` (bez zmian w tym temacie).
8. Bramka `cargo test --all-targets --no-fail-fast` jednym poleceniem przekracza limit 590 s (zabita po 585 s przy 258
   zielonych binarkach). Wykonano: `cargo test --all-targets --no-run` (EXIT 0) i uruchomienie wszystkich 496 binarek
   testowych kolejno (2 partie po ≤ 480 s): 496 × rc=0, 3666 passed, 0 failed.
