# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Operator r1

```text
STATUS: BLOCK (częściowy: kod sesji, sterowniki czasu, RNG, kompozytor ciosu, skutki trafienia wieży i testy Rust
        GOTOWE i zielone; kryterium końca „wektory pinu pełnej bitwy, ≥ 6 scenariuszy, bajt w bajt” NIESPEŁNIONE —
        brak harnessu całej BattleScene, §6 B1)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A)
GOAL: SiegeBattleSession (start/step/skip/finish) nad SiegeLoop+ProdBody z adaptera T6 i pola T5, bez mostu
BAZA: origin/rust-port/parity-v2 = 32006733ba65bb22ff7776b104d1afb329841491 (faktyczny SHA w chwili startu)
GAŁĄŹ: rust-port-wip/k5loop-wiring-a-q1
ZMIANY/COMMIT: patrz §1 (SHA końcowy w §9)
TESTY: patrz §4
BLOKADY: §6
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (decyzja orkiestratora, czy B1 = osobny temat harnessu pinu, §6)
DEPLOY/PUSH: NIE WYKONANO (push tylko lokalnej gałęzi WIP, jeśli dozwolony; brak push na parity-v2)
```

## 0. Web najpierw (pin `07d2fbd72`)

| Pin | Ustalenie | Port |
|---|---|---|
| `main.ts:36980-37018` `new BattleScene({... deploy: atk ma generała, manualControlAllowed: atk ma generała, siege:{defCiv, builtBuildingIds}, attackerCivBonusy/defenderCivBonusy, era, głód, deficyt, trudność})` | `attackerOwnTerritory`/`defenderOwnTerritory`/`shallowSea` NIE są podawane → `false` (`battleScene.ts:2727-2729`); `isCityDefenseBattle = opts.siege != null` (`:2740`) | `SessionBlowComposer` (`own_territory = false`, `shallow_sea = false`, `is_city_defense_battle = true`) |
| `main.ts:37019-37024` `bs.play(res => { consumeReadyMachines(city); finishSiegeStormBattle(...) })` | machiny zużywane wszystkie po wyniku | `SessionOutcome::consumed_machines` = gotowe machiny miasta (DANE; zastosowanie = część B) |
| `play` `:3547`, `_startBattle` `:3558-3600`, `_kickoffBattleTurn` `:3615-3631` | AUTO bez generała: `_manualMode = false`, kickoff → `_beginTurn` tury 0 | `SiegeBattleSession::play` = `SiegeLoop::start` |
| `skip()` `:3680-3707` | po starcie `_ffActive = true`, `_ffVirtualMs = 0`, kolejka pusta, `_ffEnterAuto`; przed startem `_skipInstantFallback` | `skip()` = `SiegeLoop::resume`; przed `play` = `SessionError::SkipBeforeStartNotPorted` (R7) |
| `_startLoop` `:9245-9291` | klatka czasu rzeczywistego: `_advanceVClock(t)` → `_drainTimers()` → ticki renderu | `SiegeLoop::step_realtime` (nowe, publiczne) |
| `_runFastForward` `:9415-9437` | `FF_STEP_MS = _scaledWallDelta(BATTLE_FRAME_WALL_MS = 16)` „ta sama kwantyzacja co klatka AUTO” | D-WIRA-3 |
| **R5** `_updateStallWatch` `:5568-5582` | w oblężeniu `if (this.siegeWallCol >= 0) return;` — w czasie rzeczywistym NIE ma licznika PAT; sufit tur `_roundCapVerdict` (`:9440-9465`, komentarz „wspólne dla przewijania, walki AUTO i ręcznej (_checkEnd)”) działa w obu trybach przez `_checkEnd`; przewijanie dodatkowo sprawdza go przed każdą iteracją (`:9424`) | Rust: `siege_tactics_endcheck.rs:229` (`round_cap_verdict` w `_checkEnd`) + `FfHost::round_cap`; test `M11` (sufit 10) |
| `_fireOneTower` `:4222-4269` | strzelec wieży syntetyczny `dead: true`; trafienie `_singleBlow(shooter, target, true)` → pełne `_resolveBlowOutcome` (`:9019-9068`) | `ProdBody::tower_blow_full` (D-WIRA-2) |
| `_singleBlow` `:8811-8960` | teren obu kafli, `_wallBonusProcFor`, brod, `relativeHit`, `civCombatStatMultipliers(..., isChargeRound)` + budynki, trudność, kontry — liczone W CHWILI CIOSU | `BlowComposer` / `SessionBlowComposer` (D-WIRA-1) |

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/siege_battle_session.rs` (nowy) | `SiegeBattleSession` (`prepare`/`start`/`play`/`step`/`skip`/`finish`), `SessionError`, `SessionRolls` (RNG D-WIR-5), `SessionData::engine()`, `SiegeSessionInput`, `SessionOutcome`, `SessionBlowComposer` |
| `rust-port/engine/src/domain/mod.rs` | `pub mod siege_battle_session;` |
| `rust-port/engine/src/domain/siege_tactics_loop.rs` | (a) `SiegeLoop::step_realtime` (publiczny krok czasu rzeczywistego, pin `:9274-9277`); (b) `BlowSite` + `BlowComposer` + `ProdBody::blow_composer` (wejście ciosu złożone w chwili ciosu; szablony zostają dla starych testów); (c) `ProdBody::tower_outcome_effects` + `tower_blow_full` (skutki `_resolveBlowOutcome` trafienia wieży; domyślnie `false` = dotychczasowe zachowanie i wektory `p4_1i3`/`p4_1i2`) |
| `rust-port/engine/tests/p6_k5loop_wiring_a.rs` (nowy) | 11 testów (§4) |

Nie ruszano: `bridge.rs`, `bridge_contract.rs`, `renderer/`, `view-model/`, `client/`, `src-tauri/`, `gra/**`,
`Cargo.toml`/`Cargo.lock`, `REJESTR-RUST.md`, `siege_battle_adapter*.rs` (nie było potrzeby).

## 2. Decyzje techniczne (D-WIRA-n, do REJESTR-RUST przez orkiestratora)

- **D-WIRA-1 (kompozytor ciosu, dług U5/F4 T4 + D-ADP-6 T6).** `ProdBody` brał wejście ciosu z szablonu `ProdUnit::blow`
  na JEDEN cel (`melee_target`), kontrataku z `counter_blows[i]`, strzału z `ranged_blows`; cel ciała ≠ szablon =
  tag `cios-bez-szablonu` (325 w sondzie T4). Pin liczy wejście w `_singleBlow` w chwili ciosu z bieżących pozycji.
  Dodano `BlowComposer::compose(&BlowSite)` wołane w `ProdBody::strike` po wyliczeniu `firstBlow` i łuku; sesja
  podaje `SessionBlowComposer` (szablon jednostki `unit_blow_template` = `toCombatUnit`, `blow_env_for` z mapą pola
  T5, `civ_combat_stat_multipliers` + `merge_building_bonus_into_stat_multipliers` z `isChargeRound`,
  `civ_wall_defense_multiplier` dla obrońcy na koronie, macierz `counter_matrix`, trudność właściciela). Przy
  kompozytorze tagi `*-bez-szablonu` są nieosiągalne; szablony i tagi zostają dla testów sprzed T7 (bez zmian asercji).
- **D-WIRA-2 (skutki trafienia wieży).** `ProdBody::tower_blow` tagował `wieza-resolveBlowOutcome-efekty` dla każdego
  trafienia z wynikiem (sesja z machinami: tag w każdej bitwie). Pin `_fireOneTower` → `_singleBlow` → pełne
  `_resolveBlowOutcome` ze strzelcem `dead: true`. Nowe `tower_blow_full` (flaga `tower_outcome_effects`, sesja =
  `true`): morale/rout, zabicie (`_startFade`, `_shakeAlliesOnLoss`, `_boostEnemiesOnBreak`), `_pushClash` z aktorem
  wieży, bez `_gainMorale` strzelca. Domyślnie `false`, bo wektory `p4_1i3_actions_gen.mjs:28,556` STUBUJĄ te skutki
  (cel wieży `neverRout`, brak ripple) — zmiana domyślna zmieniłaby ich asercje.
- **D-WIRA-3 (czas rzeczywisty).** `step(wall_delta_ms)` dzieli czas ścienny klienta na klatki 16 ms
  (`BATTLE_FRAME_WALL_MS`, ta sama kwantyzacja co `FF_STEP_MS` przewijania), reszta przechodzi dalej, więc wynik zależy
  tylko od sumy czasu, nie od podziału na wywołania (test). Każda klatka = `_advanceVClock(t)` + `_drainTimers()`,
  pierwsza tylko ustawia `vLastWall` (pin `:9502`). Rzeczywisty FPS klienta przy grze w przeglądarce zmienia kwantyzację
  w pinie (NIE_ZMIERZONO, jak D-WIR-3).
- **D-WIRA-4 (RNG, D-WIR-5).** `SessionRolls::derive(params.seed, battle_index)` = `Rng::from_seed(seed ^
  battle_index·0x9E3779B9 ^ 0x53494547)`; jeden `next_f64` na `Math.random` (`_singleBlow` `:8961`). Numer bitwy podaje
  wołający (część B prowadzi licznik). Rozkład jak web; strumień inny niż `Math.random` (powtarzalność zapisu).
- **D-WIRA-5 (start/`play`).** `prepare` = `new BattleScene` (`started = false`), `play` = `_startBattle`; `start` =
  oba. `skip` w `Prepared` = R7; `step` w `Prepared` wykonuje `play` (jak klatka po `bs.play`).
- **D-WIRA-6 (zasięg korony).** `crownRangeDelta = 0`: korona stoi na kaflu muru/bramy, `combatTerrainName` = teren
  płaski, `terrainRangeDelta(płaski) = 0`.
- **D-WIRA-7 (dane).** `SessionData::engine()` = dane wbudowane silnika (`units.json`, `counters.json`,
  `combat-params.json`, `terrain-combat.json`); dryf wobec pinu = D-ADP-4 (REPIN). `wall_params` = wartości domyślne pinu.
- **D-WIRA-8 (wejścia spoza stanu).** `OwnerContext` właścicieli, epoka właściciela miasta/obrońcy, `defCiv`, `dTeren`,
  `worldTerrainFromHex` = `SiegeSessionInput` (producent: część B). `PlayableState` ich nie ma (D-ADP-7).
- **D-WIRA-9 (identyfikatory).** `SeqUnit::id`: atakujący `i`, obrońca `2^32 + i`; mapowanie na id rosteru:
  `roster_ids()` i `OutcomeUnit::roster_id`.
- **D-WIRA-10 (`terrain_defence_mult`).** Liczone raz z kafla startowego (`terrainDefenseMultiplier(teren, cu.rola)`);
  pin `_checkRout` `:9790-9792` liczy z bieżącego kafla — dług §7 (wymaga zmiany ciała).
- **D-WIRA-11 (budżet przewijania).** `skip` wykonuje do `SKIP_STEP_BUDGET` iteracji; wyczerpanie = jawny
  `LoopUnsupported` (pin kończy przez `_roundCapVerdict`, więc stan bez końca = błąd portu, nie gameplay).

## 3. Kryterium startu #369: `ProdBody::unported` w pełnej bitwie AUTO z murem

Przed T7 (sonda tej rundy, 6 bitew przewijania): tagi `wieza-resolveBlowOutcome-efekty` (każda bitwa z wieżami i
trafieniem); `cios-bez-szablonu`/`kontratak-bez-szablonu`/`strzal-bez-szablonu` przy szablonach testowych (T4 U5).
Po T7: **puste** w 6 scenariuszach przewijania i 2 w czasie rzeczywistym (test
`pelna_bitwa_auto_z_murem_unported_puste_skip`, `czas_rzeczywisty_damage_i_koniec`, wynik w `zlote_wyniki_sesji`).

Scenariusze (stan gry → sesja, dane silnika): `mur` (piechota+łucznik, remis po 150 turach bez wyłomu), `mur_machiny`
(taran+wieża oblężnicza, obrońca, tura 19), `palisada_liczni` (9 vs 3, remis), `mury_kamienne_jazda` (remis),
`fort_slaby_atak` (obrońca, tura 10), `mur_taran_katapulta` (atakujący, wyłom, tura 43).

## 4. Testy

`rust-port/engine/tests/p6_k5loop_wiring_a.rs` (11 testów, wszystkie zielone):
`pelna_bitwa_auto_z_murem_unported_puste_skip`, `czas_rzeczywisty_damage_i_koniec` (Damage obecne),
`czas_rzeczywisty_niezalezny_od_podzialu_krokow` (16 / 7,5,11,9 / 1000 / 33,0,15 ms: identyczny wynik i akcje),
`skip_po_starcie_w_trakcie_bitwy` (brak Damage po skip, `AlreadyFinished`), `skip_przed_startem_to_jawny_blad`,
`general_atakujacego_to_tryb_reczny_nieportowany`, `bledy_wejscia_sa_jawne` (bez muru, kotwica, NaN/ujemny czas),
`rng_z_ziarna_gry_i_numeru_bitwy`, `wynik_jako_dane`, `zlote_wyniki_sesji` (skrót FNV `dcd224435100671a` wyników 8
bitew — RUST-ONLY, zamrożenie regresji, NIE wektor pinu).

Bramki: patrz §8.

## 5. Mutanty

Skrypt: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1/01-operator-r1-mutanty.py` (każdy mutant = jedna
gałąź/warunek sesji albo zmian w pętli; zabity = `cargo test --test p6_k5loop_wiring_a` FAIL; plik przywracany po
każdym). 24 mutanty: **20 zabitych, 4 jawnie równoważne**. Pierwszy przebieg: M07, M09, M14, M15 przeżyły → dopisane
testy `klatki_czasu_rzeczywistego_i_zegar` i `kompozytor_ciosu_szarza_i_kontry`, drugi przebieg: zabite. M01/M03 w
pierwszym przebiegu nie miały wzorca po `cargo fmt` (poprawione wzorce, zabite w drugim).

| Mutant (gałąź) | Wynik |
|---|---|
| M01 RNG bez numeru bitwy | ZABITY (`rng_z_ziarna…`, `zlote…`) |
| M02 RNG stała 0,5 | ZABITY (4 testy) |
| M03 generał → `Adapter` zamiast `ManualModeNotPorted` | ZABITY |
| M04 `skip` przed startem przewija | ZABITY |
| M05 `step` w `Prepared` = błąd | ZABITY |
| M06 `step` bez reszty klatki | ZABITY (niezależność od podziału) |
| M07 warunek klatki `>` | ZABITY (`klatki_…`) |
| M08 czas rzeczywisty `ff_active = true` | ZABITY (brak Damage) |
| M09 czas rzeczywisty bez `_advanceVClock` | ZABITY (`klatki_…`) |
| M10 `finish` przed końcem | ZABITY |
| M11 sufit tur 10 | ZABITY (4 testy) |
| M12 wieża bez skutków (`tower_outcome_effects`) | ZABITY (`unported`) |
| M13 bez kompozytora ciosu | ZABITY (`unported`) |
| M14 szarża zawsze (kompozytor) | ZABITY (`kompozytor_…`) |
| M15 kontry odwrócone dla obrońcy | ZABITY (`kompozytor_…`) |
| M16 `def_on_wall = false` w kompozytorze | RÓWNOWAŻNY na danych: pole steruje tylko `defOnFord` (brak brodu na polu oblężenia z presetem `None`) i `wallCivMult` (tylko przy niezerowym bonusie muru cywilizacji, `civWallDefenseMultiplier`); bonus muru korony liczy `blow_env_for` z położenia, nie z tego pola |
| M17 łuk z szablonu (Front) zamiast `relativeHit` | ZABITY (`zlote…`) |
| M18 bez kary morale startowej | ZABITY (`zlote…`) |
| M19 NaN czasu przechodzi | ZABITY |
| M20 wieża bez `_applyMoraleDamage` | ZABITY |
| M21 `wall_now` nie rośnie | ZABITY |
| M22 `first_blow_of_pair = false` w kompozytorze | RÓWNOWAŻNY ściśle: `ProdBody::strike` nadpisuje pole wartością z `engaged` zaraz po `compose` |
| M23 teren obrońcy zawsze płaski (kontekst civ) | RÓWNOWAŻNY na danych: `terrain` kontekstu civ działa tylko przy bonusach leśnych (`fragment_las`); obrońcy oblężenia stoją na koronie/dziedzińcu bez lasu |
| M24 `skip` zostawia fazę `Running` | RÓWNOWAŻNY: `after_drive` ustawia `Finished` po przewinięciu; faza `Skipping` jest obserwowalna tylko przy wyczerpaniu `SKIP_STEP_BUDGET` (błąd jawny, nieosiągalny w pinie) |

## 6. BLOKADY

- **B1 (kryterium końca, wektory pinu pełnej bitwy).** Wymagany generator TS wykonujący tekst pinu od `new BattleScene`
  do `_showEndScreen` dla ≥ 6 scenariuszy i porównanie bajt w bajt. Istniejące harnessy (`p6_k5loop_siege_atk_b_gen.mjs`,
  `p6_k5loop_tags_rest_siege_gen.mjs`) wykonują POJEDYNCZE aktywacje z atrapami (`_singleBlow` = 0 obrażeń, cel z
  wejścia). Pełna bitwa wymaga dodatkowo: konstruktora (teren `generateBattleTerrain`, `_carveBattleBox`,
  `_fencePlayableZone`, `_carveWallTiles`, `_placeSiegeTowers`, `_placeUnits`/`_placeSiegeDefenders` — `battleScene.ts:2717-3490`),
  `rosterToBattleUnits`/`runtimeToBattleUnit` z `main.ts:33158`, `_startBattle`, `_beginTurn`/`_activateNext`/`_checkEnd`,
  `_schedule`/`_drainTimers`/`_runFastForward`, `_fireSiegeTowers`, pełnego `_singleBlow`/`_resolveBlowOutcome`, wszystkich
  gałęzi `_activateUnit` i deterministycznego `Math.random` (podmiana na ten sam LCG). To osobny, duży temat
  (rekomendacja: `R-RUSTPORT-P6-K5LOOP-WIRING-A-PIN-Q1`, Opus, harness = złożenie istniejących wycinków + konstruktor;
  wejście = te same stany gry co `scenarios()`; RNG wspólny przez wstrzyknięcie `Math.random`). W tej rundzie
  wektory pinu dla gałęzi istnieją per klocek (T1–T6), a całość jest zamrożona tylko po stronie Rust (`zlote_wyniki_sesji`).
- **B2 (brak).** Gameplay poza webem: nie było.

## 7. Długi (przekazane z T4/T6 i nowe)

| ID | Dług | Stan |
|---|---|---|
| U5/F4 (T4) | szablon ciosu dla każdego celu `_pickAdjacentTargetByPriority` | **ZROBIONE** (D-WIRA-1, kompozytor w chwili ciosu; pełna bitwa bez ręcznych szablonów) |
| D-ADP-6 (T6) | `FullBlowInput` per cios | **ZROBIONE** (D-WIRA-1) |
| T6 `army_leader_bonus_frac`/`morale_base_plain`/`is_army_commander` | wypełnienie ciała z adaptera | **ZROBIONE** (`bu.army_leader_morale_bonus_frac`, `morale_base_for` z frakcją 0, `install_body_inputs`) |
| `wieza-resolveBlowOutcome-efekty` (nowy w T7) | skutki trafienia wieży | **ZROBIONE** (D-WIRA-2) |
| D-ADP-11 / T7-SOJUSZ-UMOWA | sojusz = umowa (`hasAllianceDealBetween`) | **ODROCZONE do części B**: sesja czyta `war.diplomacy` przez adapter; synchronizacja statusu z umów przed szturmem należy do wołającego (most, #104 `sync_relation_status_from_deals`); `PlayableState` nie ma `deals` |
| D-ADP-L-BARB | barbarzyńcy wrogami wszystkich | **ODROCZONE** (nieosiągalne: `PlayerId` u64, brak barbarzyńców w `PlayableState`) |
| `ucieczka-konflikt-zegara` | osiągalność w pętli produkcyjnej | **ZMIERZONE (sonda 8 bitew)**: 0 wystąpień (`unported` puste); większa sonda — patrz §5a/uwagi |
| `attack_pre` E8/E22/E30 | cios po kroku w oknie `STEP_GAP_MS` | NIE_ZMIERZONO (wymaga instrumentacji ciała; poza allowlistą tej rundy w sensie „minimalne poprawki”) |
| `doktryna-rozkaz-ruchu` | rozkaz `skirmish` | **ODROCZONE** do K5EXEC-T3: w AUTO bez grup doktryna = `steady` (pin `:17612-17630`), tag nieosiągalny; 0 wystąpień w sondzie |
| U4 (T4) | pusty `_schedule(0)` z `_disableManualIfCommanderLost` | **ODROCZONE**: `PlayableState` nie ma generałów (D-ADP-7) → dowódca nie istnieje w sesji |
| D-FC-ADP-1 | asercja `ratio` w (1; 1,5) | **ODROCZONE** (test T6 nietknięty) |
| D-WIRA-10 | `terrain_defence_mult` z bieżącego kafla w `_checkRout` | NOWY (zmiana ciała) |
| D-WIRA-T | szablon strzału wieży statyczny (`tower_shot_from_row`); pin liczy `_singleBlow` wieży z terenem kafla celu | NOWY |
| B1 | wektory pinu pełnej bitwy | NOWY (osobny temat) |

## 8. Bramki (na kodzie z §9, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `wiringa/target`, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (bez ostrzeżeń) |
| `cargo test --test p6_k5loop_wiring_a` | 12 passed |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, `EXIT` w logu) | **EXIT=0**, 543 × `test result: ok`, 0 × FAILED (w tym `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_battle_setup*`, `bridge_contract`, `p4_1i3_actions`, `p4_1i2_frame*`) |
| wektory generatora (MD5) | NIE DOTYCZY w tej rundzie — generator pinu pełnej bitwy nie powstał (B1) |

Dysk: start 15 GB wolnego; w trakcie spadek do 6,4 GB przez inne workery (bez nowych buildów w tym czasie poza
mutantami w istniejącym targecie); pełny test przy 10–11 GB.

## 9. Commit

Gałąź `rust-port-wip/k5loop-wiring-a-q1` (baza `32006733b`). Commity WIP: `6e6afbd99` (raport wczesny), `bb1509b57`
(sesja, kompozytor, krok czasu rzeczywistego), `bfcc58708` (skutki wieży, testy), `2443f8716` (złote wyniki),
`8bbbf3288` (testy klatek i kompozytora), końcowy: patrz StructuredOutput / `git log` (raport + skrypt mutantów).
Push na `parity-v2`: NIE (zakaz). Push zdalny gałęzi WIP: NIE WYKONANO (Operator nie pushuje; gałąź lokalna w worktree).
