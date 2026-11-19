# R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369 część B)
GOAL: sesja bitwy oblężniczej (start/step/skip/finish) z mostu, wynik zastosowany do PlayableState jak
      finishSiegeStormBattle bez gałęzi zdobycia (hak T8), długi D-ADP-11 i D-ADP-L-BARB zamknięte decyzją wg webu
BAZA: origin/rust-port/parity-v2 = 2e5bf370a434eb81eeaf0e82d104faaf5f40b57d (faktyczny SHA w chwili startu)
GAŁĄŹ: rust-port-wip/k5loop-wiring-b-q1 (worktree wf_177db0a5-845-1)
ZMIANY/COMMIT: patrz §8 (SHA końcowy w ostatniej linii §8)
TESTY: §6 (fmt, clippy -D warnings, testy tematu, testy wymienione w dispatchu, pełny cargo test)
BLOKADY: brak blokujących; długi jawne w §9
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw (pin `07d2fbd72`)

Przeczytane: `main.ts` `launchSiegeStormFromMap` (`:36799-37024`), `finishSiegeStormBattle` (`:36596-36690`, w tym
`afterSiegeUi` `:36628-36672`), `applyMapBattleOutcome` (`:34431-34746`, `opts.onCityCaptured` `:34414-34444`,
`:34683-34700`), `validateActiveSieges` (`:18019-18037`), `endMapSiege` (`:17880-17899`), `retreatHexPassable` /
`isOccupiedHex` (`:33765-33779`), `hasAllianceDealBetween` (`:22648-22655`), `areEnemyOwners` (`:13129-13133`),
`civBonusyForOwnerId` (`:9842-9846`), `difficultyCombatMultForOwner` (`:9523-9527`), `empireBuiltIdsForOwner`
(`:3493-3504`), `worldTerrainFromHex` (`:1934-1943`); `game/post-battle-map.ts` (całość, `applyPostBattleMap`
`:431-467`); `battle/battleScene.ts` `_battleUnitsForMapExport` (`:10246-10250`), `_endSurvivors` (`:9474-9477`,
`:9495`, `:10225`), `onFinish` → `BattleResult` (`:10716-10729`); `game/city-fortification.ts`, `game/siegeMachines.ts`,
`game/diplomacy-siege-war-gate.ts`, `game/veteran.ts` (`registerBattleWon`).

Wnioski pinu użyte w porcie:
* wynik sceny = `{ winner, survivors: _endSurvivors, eventLog: buildBattleEventLog(this.atk, this.def), wallBreached }`;
  `survivors` = `_battleUnitsForMapExport` strony zwycięskiej (remis: obu) = `hp > 0 && (!dead || routed)`;
* `applyManualSurvivors`: każda jednostka rosteru OBECNA w logu sceny, a nieobecna wśród ocalałych, jest usuwana
  (także żywa jednostka strony przegranej); jednostki spoza logu (rezerwa ponad `BATTLE_MAX_PER_SIDE`) nietknięte;
* `consumeReadyMachines(city)` dopiero po wyniku sceny (`:37021-37023`), mapa w trakcie sceny bez zmian;
* `stormCaptureBlocked = winner === 'atakujacy' && !canCaptureCity(cityIsFortified(...), wallBreached)`; szturm wymaga
  `maMur`, więc „mur stoi” ⇔ brak wyłomu;
* remis zawsze kończy oblężenie (`endMapSiege`, R-OBLEZENIE-REMIS-MASZYNY-Q2=A).

## 2. Co zrobiono

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_battle_apply.rs` (nowy) | producent wejścia sesji ze stanu (`prepare_storm`), sterowanie sesją między komendami (zapis operacji + powtórka + pamięć podręczna wątku), ramka i akcje odpowiedzi, `apply_outcome` (zastosowanie wyniku), D-ADP-11 (`alliance_pairs_from_deals`, `siege_inputs_with_deals`) |
| `engine/src/domain/mod.rs` | `pub mod siege_battle_apply;` |
| `engine/src/domain/siege_battle_session.rs` | jedna zmiana: `prepare` bierze wejścia rosterów z `siege_inputs_with_deals` (D-ADP-11) zamiast `siege_inputs_from_playable` |
| `engine/src/domain/playable.rs` | `PlayableGame`: pola `siege_battle` (trwająca bitwa, poza `PlayableState` i zapisem) i `siege_battles_started` (numer bitwy D-WIR-5); metody `start_siege_storm` / `step_siege_battle` / `skip_siege_battle` / `finish_siege_battle` / `siege_battle`; bramka `ensure_no_siege_battle` w `advance_turn`, `move_unit_with_attack`, `cancel_planned_march`; `PlayableError::SiegeBattleInProgress`. `PlayableState` BEZ nowych pól. |
| `engine/src/bridge.rs` | addytywnie: `EngineCommand::{StartSiegeStorm{city_id,unit_id}, StepSiegeBattle{wall_ms}, SkipSiegeBattle, FinishSiegeBattle}`, `BridgeResponse.siege_battle` (`siegeBattle`, pomijane gdy brak), `EnginePort::siege_battle` (domyślnie odrzuca), `CivEngineAdapter::from_game`; `CONTRACT_VERSION` = 1 bez zmian |
| `engine/tests/bridge_contract.rs` | 4 nowe rodzaje komend w wyczerpującym `command_index` + próbki + test kształtu JSON i odrzucenia bez bitwy |
| `engine/tests/p6_k5loop_wiring_b.rs` (nowy) | E2E przez most i testy fazy/determinizmu/D-ADP-11 (10 testów) |
| `engine/tests/p6_k5loop_wiring_b_pin.rs` (nowy) | `apply_outcome` bajt w bajt z wektorami pinu (2 testy) |
| `engine/tests/p6_k5loop_wiring_b_gen.mjs` + `p6_k5loop_wiring_b_vectors/vectors.json` (nowe) | generator wykonujący tekst pinu, strażnik SHA-256 |

Bez zmian: `renderer/`, `client/`, `src-tauri/`, `view-model/`, `gra/`, `siege_tactics_loop.rs`, adaptery T6, `Cargo.*`,
`REJESTR-RUST.md`.

## 3. Decyzje techniczne (do wpisania przez orkiestratora w `REJESTR-RUST.md`)

* **D-WIRB-1 (sesja między komendami).** `SiegeBattleSession` nie jest `Send` (`Box<dyn MoveTerrain>`,
  `Box<dyn BlowComposer>`, `FireObserver` w `siege_tactics_loop.rs`), a `PlayableGame` jest stanem Tauri
  (`State<Mutex<EngineBridge<CivEngineAdapter>>>` wymaga `Send`). Gra trzyma więc `ActiveSiegeBattle` (migawka stanu
  z chwili startu, wejście sesji, pełne rostery, lista operacji `step(ms)`/`skip`) i odtwarza sesję tymi samymi
  wywołaniami. Żywa sesja jest w pamięci podręcznej wątku (`thread_local`) jako optymalizacja; chybienie (inny wątek,
  klon gry, błąd poprzedniej komendy) = odtworzenie. Dowód równoważności: test `odtworzenie_z_zapisu_rowne_sesji_zywej`
  (każda komenda po wyczyszczeniu pamięci = te same akcje, ramki, wynik i stan). Bez `unsafe`.
* **D-WIRB-2 (stan gry w trakcie bitwy).** Pin w trakcie sceny nie zmienia mapy. `StartSiegeStorm`/`Step`/`Skip` nie
  zmieniają `PlayableState` (brak `StateChanged`); `FinishSiegeBattle` stosuje wynik (`StateChanged`). `AdvanceTurn`,
  `MoveUnit`, `CancelPlannedMarch` i drugi `StartSiegeStorm` w trakcie bitwy = jawny błąd „in progress”, stan bez
  zmian. Zapis bitwy w toku poza zakresem (most nie ma komendy Save — #375; bitwa nie jest w DTO stanu, więc zapis
  stanu jej nie zawiera). `CreateSession` = nowa gra bez bitwy.
* **D-WIRB-3 (gałąź zdobycia = hak T8).** Wygrana atakującego z wyłomem: część B stosuje wspólne skutki
  `applyPostBattleMap` (ocalali/straty, weterani, punkt ruchu) i zwraca `result.captureRequested {cityId,
  attackerOwnerId, anchorUnitId}`; `wipeDefenderOnCityCenter`, `retreatDefendersAfterAtkWin`,
  `moveAtkRosterOntoBattleHex`, `applyCityCaptureToMap` = #354 (T8). `apply_transfer_with_effects` NIE wołane.
* **D-WIRB-4 (kontekst właścicieli sceny).** `OwnerContext` z `PlayableState`: `built_ids` = `empireBuiltIdsForOwner`,
  `civ_bonusy` = `civMatrixBonusyForCivKey(player.civilization)` (markery kosztu produkcji pominięte — nie są
  modyfikatorami walki), `difficulty_combat_mult` = formuła `difficultyCombatMultForOwner` w modelu stanu jak
  `render_frame.rs:644-663` (kopia, bo tamta funkcja jest prywatna — dług duplikacji). Głód armii i deficyt Złota:
  `PlayableState` nie ma tych stanów ⇒ `false` (jawny dług, nie zgadywanie liczb). Epoki: `empire_epoch_for_owner`
  (W8 r6). `defCiv` = `ikonaIdToBronzeCiv(civilization właściciela miasta)`. Teren: `terenBazowy` heksa miasta
  wg mapowania stanu (`render_frame::terrain_labels`: las = nakładka na równinie), `rzeka = false` (stan bez rzek).
* **D-WIRB-5 (odpowiedź mostu).** Komendy bitwy odpowiadają `result: State` + polem `siegeBattle` w `BridgeResponse`
  (nie nowym wariantem `BridgeResult`): `rust-port/client/tests/engine_bridge_renderer.rs` dopasowuje `BridgeResult`
  wyczerpująco (poza allowlistą), nowy wariant łamałby jego kompilację. JSON starych komend bez zmian (test
  `siege_battle_commands_have_a_fixed_wire_shape_and_old_responses_are_unchanged`). `siegeBattle` = `{cityId, phase
  (running|finished|applied), units (tylko Start: battleId → unitId/side), actions: Vec<BattleActionDto>, frame:
  BattleFrameDto (bez nowego formatu), result}`.
* **D-WIRB-6 (kolejność akcji).** Ciało pętli emituje marsz wielokrokowy jednej aktywacji z przyszłymi `t0` zanim zegar
  odpali wcześniejsze klocki (np. strzał wieży), a `validate_actions` (P4-1I3) wymaga niemalejącego `t0`. Akcje
  odpowiedzi są sortowane stabilnie po `t0` (kolejność czasu wirtualnego = kolejność wywołań sceny w pinie; remisy
  w kolejności emisji). Pomiar: bez sortowania `skip` dawał `actions[462].t0 = 137632 < 138258` (błąd walidacji).
* **D-WIR-5 (RNG).** `SessionRolls::derive(params.seed, numer bitwy sesji)`; numer = licznik `PlayableGame`
  (`siege_battles_started`, od 1; po wczytaniu gry licznik zaczyna od nowa — dług, stan nie niesie licznika, pin
  używa `Math.random`).

## 4. Długi z T7a

* **D-ADP-11 — ZAMKNIĘTY.** `hasAllianceDealBetween` (`main.ts:22648-22655`) = aktywna umowa `sojusz_pelny` /
  `sojusz_defensywny` / `SojuszWojskowy` (alias `sojusz_pelny`). `PlayableState` MA umowy
  (`war.diplomacy.deals`) — dispatch zakładał ich brak. Port czyta sojusze z umów (`alliance_pairs_from_deals`), nie ze
  statusu relacji; testy: status `Alliance` bez umowy nie dołącza sojusznika, umowa z tej samej tury dołącza, NAP to nie
  sojusz (`sojusz_z_umowy_d_adp_11`).
* **D-ADP-L-BARB — ZAMKNIĘTY decyzją (bez kodu).** `areEnemyOwners`: barbarzyńca wrogiem każdego. `PlayableState` nie ma
  barbarzyńców ani właścicieli ujemnych (`PlayerId` u64), więc reguła nie ma wejścia; mapowanie dodaje się w temacie
  stanu barbarzyńców (dodanie ich jednostek + wojna z każdym w `siege_inputs_with_deals`). Web rozstrzyga regułę, brak
  pytania ABC.

## 5. Rejestr: zastosowano / hak T8 / poza zakresem

| Skutek pinu | Linie pinu | Status |
|---|---|---|
| `consumeReadyMachines(city)` | `main.ts:37023`, `siegeMachines.ts:74-81` | ZASTOSOWANO |
| ocalali / straty (`applyManualSurvivors`, log sceny, rezerwa nietknięta) | `post-battle-map.ts:168-189`, `battleScene.ts:10246-10250` | ZASTOSOWANO (+ usunięcie wpisu `economy.units`) |
| HP ocalałych | `post-battle-map.ts:182-187` | ZASTOSOWANO (`economy.units[id].hp`) |
| weterani `registerVeteranProgressAfterBattle` | `:411-429`, `veteran.ts:95-98`, `:291-294` | ZASTOSOWANO |
| mur stoi (`holdPositionAfterWin`) | `:443-444`, `main.ts:36622` | ZASTOSOWANO (`captureBlocked`) |
| wygrana obrońcy: `retreatAtkRosterToStart` | `:450` | ZASTOSOWANO (pozycje startu; w tym przepływie bez zmiany) |
| wygrana obrońcy: `defLossesThisTurn` | `:451-454` | POZA ZAKRESEM (pola brak w stanie) |
| remis: rozejście `placeFanOutGroup` obu stron | `:455-462`, `:281-319`, `main.ts:33765-33779` | ZASTOSOWANO (`defLossesThisTurn` przy braku miejsca — poza zakresem) |
| `spendAttackMpOnLive` | `:392-402` | ZASTOSOWANO |
| `selectedId = null` po wygranej obrońcy | `main.ts:34713` | ZASTOSOWANO |
| `validateActiveSieges` szturmowanego miasta | `main.ts:34744`, `:18019-18037`, `diplomacy-siege-war-gate.ts:112-122` | ZASTOSOWANO (oblegający = właściciel kotwicy); inne miasta: POZA ZAKRESEM (stan bez `oblegajacyOwnerId`) |
| remis → `endMapSiege` | `main.ts:36660`, `:17880-17899` | ZASTOSOWANO (`oblegane`, `siege_machines_ready`; pozostałe pola endMapSiege nie istnieją w stanie) |
| wejście na heks + `wipeDefenderOnCityCenter` + `retreatDefendersAfterAtkWin` + `applyCityCaptureToMap` + `onCityCaptured` | `:445-448`, `main.ts:34646-34665` | HAK T8 (`captureRequested`) |
| zdobycie bez bitwy (brak obrońców, są machiny) | `main.ts:36826-36834` | HAK T8 (błąd `NoDefendersCaptureRequested`, stan bez zmian) |
| obóz barbarzyńców po wejściu na heks | `main.ts:34604-34613` | HAK T8 (wymaga wejścia na heks) |
| `chargeCombatCredibilityPenalties` | `main.ts:34458` | POZA ZAKRESEM |
| `battlePowerPtsByOwner` (`power_record_battle_win`) | `main.ts:34482-34492` | POZA ZAKRESEM (wymaga publicznego `sumRosterFieldM`, dziś prywatne w `render_frame`/`recruitment`) |
| milicja poległa / okres odnowy | `main.ts:34500-34520`, `:34566-34577` | POZA ZAKRESEM (stan bez `militiaRegenAtTurn`) |
| kroniki `noteBattleOutcome` | `main.ts:34553-34565` | POZA ZAKRESEM |
| `sweepFortCaptures` | `main.ts:34615` | POZA ZAKRESEM |
| łup bitwy (`computeBattleLoot`, skarbiec, surowce) | `main.ts:34617-34647` | POZA ZAKRESEM |
| UI (`showHintMessage`, podsumowanie, `refresh*`, nastrój) | `main.ts:36628-36690` | nie dotyczy silnika |

## 6. Testy i bramki

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(usunięty po bramkach; dysk po: 9.6+ GB wolne).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `p6_k5loop_wiring_b` | 10 passed |
| `p6_k5loop_wiring_b_pin` | 2 passed (7 scenariuszy pinu bajt w bajt) |
| `bridge_contract` | 10 passed |
| generator `node tests/p6_k5loop_wiring_b_gen.mjs` | EXIT 0; `pinSha256 cf81ec14…73505`; `vectors.json` MD5 `4a73ff61ca55674fb53149175ad0517a` |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **FULL_EXIT=0**: 549 × `test result: ok`, 0 × FAILED; 4166 passed / 0 failed / 1 ignored (istniejący, spoza diffu); w tym `bridge_contract`, `p6_k5loop_wiring_a`, `p6_k5loop_wiring_a_pin`, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_battle_setup*` zielone |

Wektory pinu (7 scenariuszy): wygrana z wyłomem (hak T8), wygrana bez wyłomu (mur stoi), wygrana obrońcy (2× gotowe
machiny), remis z rozejściem, remis z wodą i zajętymi heksami, wygrana obrońcy bez wojsk przy murach
(`validateActiveSieges`), wygrana z wyłomem przy pokoju (koniec oblężenia). Pokrycie: rozbity ocalały (routed),
martwy, poległa przegrana strona, rezerwa poza sceną, cywil (bez punktu ruchu, bez weterana), weteran z ułamkiem
(2.7 → 3, 1.5 → 2), sufit 3 (3 → 3), oblegający na heksie miasta (odległość 0 nie liczy się w `isSiegeStillValid`), milicja i machiny wirtualne, `defLossesThisTurn` pominięte (brak pola).

E2E przez most (`p6_k5loop_wiring_b`): `StartSiegeStorm` → `Step` → `Skip` → `Finish` (stan po wyniku = stan z
`GetState`, usunięte jednostki i wpisy ekonomii, HP, machiny); czas rzeczywisty kawałkami 16 ms vs
[7.5, 40.25, 1000, 3, 250] ms = ten sam stan, wynik i akcje; ten sam seed = ten sam wynik; ziarno gry i numer bitwy
wchodzą do RNG; ścieżka odtworzenia = sesja żywa; jawne błędy poza fazą (bez bitwy, bitwa w toku dla 4 komend,
`NotFinished`, `InvalidData` dla −1/NaN/∞ bez zapisu operacji, `AlreadyFinished`); bramki startu (miasto/jednostka,
kotwica nie gracza, bez muru, bez obrońców ±machiny); D-ADP-11; JSON odpowiedzi.

## 7. Mutanty

Skrypt: `01-operator-mutanty.py` (werdykt = `p6_k5loop_wiring_b_pin`, `p6_k5loop_wiring_b`, `bridge_contract`).

Przebieg 1 (24 mutanty): 20 ZABITYCH, M04/M05/M23 PRZEŻYŁY (brak rozróżniającego wektora), M24 błąd wzorca skryptu.
Poprawka: wektory pinu dostały weteranów 3 i 1.5 oraz jednostkę oblegającego na heksie miasta (generator, nie liczby
ręczne); przebieg 2 (M04, M05, M23, M24): 4/4 ZABITE. **Razem 24/24 zabite, 0 równoważnych.**

| ID | Mutacja | Zabił |
|---|---|---|
| M01 | rozbity (routed) nie jest ocalałym | wektory pinu |
| M02 | remis: ocalali tylko atakującego | wektory pinu |
| M03 | rezerwa spoza logu sceny usuwana | wektory pinu |
| M04 | brak sufitu weterana 3 | wektory pinu (przebieg 2) |
| M05 | `battlesSurvived` bez `floor` | wektory pinu (przebieg 2) |
| M06 | odwrócony warunek muru (`canCaptureCity`) | E2E `most_start_krok_pomin_koniec_stosuje_wynik` |
| M07 | brak `spendAttackMpOnLive` | wektory pinu |
| M08 | cywil (nie kotwica) traci ruch | wektory pinu |
| M09 | machiny nie zużyte | E2E |
| M10 | remis nie kończy oblężenia | wektory pinu |
| M11 | `validateActiveSieges` bez bramki wojny | wektory pinu |
| M12 | obrońcy uciekają w stronę atakujących | wektory pinu |
| M13 | rozejście tylko 1 krok | wektory pinu |
| M14 | obrońcy z centrum miasta też się rozchodzą | wektory pinu |
| M15 | woda przejezdna przy odwrocie | wektory pinu |
| M16 | akcje bez sortowania po `t0` (D-WIRB-6) | 5 testów E2E |
| M17 | sojusz ze statusu zamiast z umowy (D-ADP-11) | `sojusz_z_umowy_d_adp_11` |
| M18 | każda umowa = sojusz | `sojusz_z_umowy_d_adp_11` |
| M19 | krok nie zapisany do powtórki (D-WIRB-1) | `odtworzenie_z_zapisu_rowne_sesji_zywej` |
| M20 | powtórka oddaje akcje startu ponownie | `odtworzenie_z_zapisu_rowne_sesji_zywej` |
| M21 | wynik bez `StateChanged` | E2E |
| M22 | koniec tury w trakcie bitwy (D-WIRB-2) | `komendy_poza_faza_to_jawne_bledy_bez_zmiany_stanu` |
| M23 | oblegający na heksie miasta liczy się jako „przy murach” | wektory pinu (przebieg 2) |
| M24 | usunięta jednostka zostawia wpis `economy.units` | E2E |

## 8. Commity

Gałąź `rust-port-wip/k5loop-wiring-b-q1` nad bazą `2e5bf370a` (bez trailerów `Co-Authored-By`; `git diff --check` czysty):

| SHA | Opis |
|---|---|
| `420720036` | `siege_battle_apply` + komendy `PlayableGame` |
| `4c6fdad72` | komendy mostu (addytywnie) + `bridge_contract` |
| `9b3b44ca9` | testy E2E, wektory pinu, pamięć podręczna sesji, sortowanie akcji |
| `5af82e173` | clippy, fmt |
| `c6026c3e3` | wektory rozróżniające (weteran, odległość oblegającego), skrypt mutantów |
| (ten commit) | raport `01-operator-r1.md` |

Pliki (`git diff --name-only 2e5bf370a..HEAD`): wyłącznie allowlista — `engine/src/bridge.rs`,
`engine/src/domain/{mod,playable,siege_battle_apply,siege_battle_session}.rs`, `engine/tests/bridge_contract.rs`,
`engine/tests/p6_k5loop_wiring_b{,_pin}.rs`, `engine/tests/p6_k5loop_wiring_b_gen.mjs`,
`engine/tests/p6_k5loop_wiring_b_vectors/vectors.json`, raporty runu. Brak `#[ignore]`.

## 9. Długi i obserwacje

| ID | Opis |
|---|---|
| D-WIRB-1-PERF | odtworzenie sesji przy chybieniu pamięci podręcznej = O(długość bitwy) na komendę; NIE_ZMIERZONO w release. Trwałe usunięcie: `Send` dla `MoveTerrain`/`BlowComposer`/`FireObserver` w `siege_tactics_loop.rs` (poza allowlistą) |
| D-WIRB-4 | głód armii / deficyt Złota w `OwnerContext` = `false` (stan bez tych danych); kopia formuły trudności z `render_frame` (prywatna) |
| D-WIRB-6-CHUNK | akcje są posortowane w obrębie jednej odpowiedzi; między odpowiedziami może wystąpić `t0` mniejszy niż w poprzedniej (marsz z przyszłym `t0` w jednej porcji) — konsument renderera (I5) ma odtwarzać po `t0`, nie po kolejności porcji; źródło: emisja ciała pętli |
| SERDE-U64-KEYS | `BridgeResponse` z `State` nie daje się zdeserializować, gdy `economy.units` jest niepusta (wewnętrznie tagowany `BridgeResult` buforuje treść; klucze `u64`) — istniejące ograniczenie mostu, spoza tematu (test czyta samo `siegeBattle`) |
| RNG-LICZNIK | numer bitwy (D-WIR-5) liczony w sesji gry, nie w stanie; po wczytaniu zaczyna od 1 |
| POZA ZAKRESEM | wiarygodność, punkty mocy bitwy, milicja, kroniki, forty, łup, `defLossesThisTurn`, `validateActiveSieges` innych miast (§5) |
| T8 (#354) | konsument `captureRequested` i `NoDefendersCaptureRequested` |
| B-WIRA-PIN-2 | bez zmian (część A) |
