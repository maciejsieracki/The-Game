# P4-1I — rozpoznanie: zdarzenia bitwy dla renderera (#218, D-DTO-7)

Temat: `R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1` (tylko odczyt, zero zmian kodu).
Baza: `origin/rust-port/parity-v2` = `c3e3617b2aaaede5f708d2c425b0222c4af78549` (stan przy starcie).
Pin webu: `07d2fbd72` (`gra/src/**`, odczyt przez `git archive`). Wszystkie numery linii webu odnoszą się do tego pinu.
Źródło kontraktu: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` @ `f2b246ff3`, §3.8 (l.326-329), tabela l.413, D-DTO-7 (l.440), wiersz tematu l.460.

## 0. Wniosek główny

1. **Web nie ma strumienia zdarzeń bitwy dla renderera.** `battleScene.ts` (20 771 linii) to jedna klasa, w której logika
   (`_activateUnit`, `_singleBlow`, `_resolveBlowOutcome`, `_checkEnd`) **wywołuje bezpośrednio** metody sceny 3D/DOM
   (`_doMove`, `_doMeleeAttack`, `_doRangedAttack`, `_spawnDamageLabel`, `_breachWallTile` …). Wyszukiwanie z dispatchu
   (`emit|event|Event|battleLog|onBlow|onShot`) w `battle/battleScene.ts` i `render/` nie znajduje żadnego emitera
   zdarzeń bitwy, `dispatchEvent` ani subskrypcji zdarzeń bitwy. `addEventListener` występuje (`:3329`, `:3499-3512`),
   ale wyłącznie dla wejścia UI (klik w ustawieniach, `resize`, `wheel`, klawisze zoom/pan/prędkość/paski/statystyki/pauza),
   nie dla przebiegu bitwy. Jedyne trafienia „event” dotyczące bitwy to `BattleEventLog` (`battleScene.ts:68-69`, `:597`, `:10724`).
2. **`eventLog` w webie NIE jest logiem animacji.** `BattleEventLog` (`units/battleRoster.ts:21-24`) to dwie listy ID
   (`attackerUnitIds`, `defenderUnitIds`), budowane raz przy wyjściu z bitwy (`buildBattleEventLog`, `battleRoster.ts:31-39`;
   wywołanie `battleScene.ts:10724-10727` w `onFinish`) z pełnych rosterów `this.atk`/`this.def`. Konsument:
   `game/post-battle-map.ts:96-113` (`loggedIdsForSide`, `loggedIdsForBattle`) — filtr, które jednostki mapy dostają straty.
   Wpis rejestru (`REJESTR-RUST.md:1534`, gałąź `claude/rust-sivvrn`) słusznie mówi, że to snapshot z rosteru, ale
   **łączy dwie różne rzeczy**: snapshot tożsamości (wynik bitwy → mapa) i przebieg dla renderera (animacje). Ten drugi
   w webie w ogóle nie istnieje jako dane — to wywołania metod.
3. Konsekwencja dla Rust: „snapshot wg webu” rozstrzyga **wynik** (`BattleResult` + `eventLog`), ale **nie** rozstrzyga
   przebiegu. Renderer Rust (`renderer/src/battle/dynamics.rs`) ma funkcje per akcja (`MoveAnim`, `MeleeLunge`,
   `launch_projectile`, `RamAnim`, `Boulder`, `breach_*`, `FloatLabel`, `kill_unit`); silnik Rust (`siege_tactics_*`)
   ma logikę, ale efektów sceny nie oddaje (jest tylko `SeqEvent`, `SceneEffect`, `BlowRecord`, `trace: Vec<String>`).
   Most między nimi to luka tego tematu. Patrz §4 (propozycja) i §5 (NIE_ZMIERZONO, decyzja techniczna orkiestratora).

## 1. Tabela: wywołanie sceny w pinie → dane → odpowiednik Rust

Legenda kolumny „Rust”: **logika** = gdzie silnik liczy skutek; **render** = funkcja renderera; status:
`OK` (oba istnieją, brak tylko mostu), `BRAK` (brak po jednej ze stron), `ROZBIEŻNE` (istnieje, ale inny zakres/pin).

| # | Wywołanie w pinie (plik:linia) | Dane potrzebne rendererowi | Rust — logika | Rust — render | Status |
|---|---|---|---|---|---|
| 1 | Ruch o 1 kafel: `_doMove` (`battleScene.ts:8685-8776`; 3D od `:8716`, czas `MOVE_STEP_MS`) | id, z (col,row), do (col,row), `t0`, facing po `_updateFacing` (`:8751`) | `siege_tactics_walk.rs` (marsz), `ActivateEvent::AdvanceToward/AdvanceStep/FallBackStep` (`siege_tactics_activate.rs:161-170`); w `ProdBody` ruch **nieportowany** (`prod_tag` → `unported`, `siege_tactics_loop.rs:802-818`) | `MoveAnim` (`dynamics.rs:322-400`) | BRAK (logika ruchu w pętli produkcyjnej) |
| 2 | Zwrot: `_updateFacing` (`:8334`, wołane z `:8709`, `:8751`, `:6123`) | id, facing `Dir` | `ProdBody::facing` (`siege_tactics_loop.rs:876`, `:935`), K5LOOP-FACING | `set_facing` (`dynamics.rs:503`) | OK |
| 3 | Cios wręcz: `_doMeleeAttack` (`:9096-9175`): zwrot atakującego `:9104-9105`, lunge `BLOW_LUNGE_MS`, cios w `BLOW_HIT_T` (`:9122-9125`) | atakujący, cel, `t0`, chwila trafienia | `ProdBody::strike` → `single_blow_full`; zapis `BlowRecord` (`siege_tactics_loop.rs:837-849`) | `MeleeLunge` (`dynamics.rs:404-500`) | OK (brak mostu; `BlowRecord` nie ma czasu) |
| 4 | Kontratak w tym samym starciu: `_defenderCounters` + zwrot obrońcy + `_singleBlow(defender, attacker)` (`:9134-9143`) | obrońca, atakujący, dmg | `ProdBody::counter_strike`, `counters: Vec<BlowRecord>` (`:869`) | `set_facing` + `FloatLabel::damage` | OK |
| 5 | Strzał: `_doRangedAttack` (`:9179-9241`): `ammoLeft -= 1` + `_updateAmmoBar` (`:9190-9194`), pocisk `projectiles.push` (`:9221-9224`), trafienie po `RANGED_FLY_MS` (`:9227-9233`) | strzelec, cel, rodzaj pocisku (`projectileKind(bu)`), amunicja po strzale, `t0` | gałąź strzelca w `ProdBody` **nieportowana** (`ActivateEvent::RangedAction` → `"strzelec"`, `siege_tactics_loop.rs:812`) | `projectile_kind`, `launch_projectile`, `tick_projectiles` (`dynamics.rs:142`, `:268`, `:307`); `update_ammo_bar` (`units.rs:467`) | BRAK (logika strzelca w pętli) |
| 6 | Pudło: `log.push('… chybia …')` (`:8962`), `return 0` — brak etykiety | wpis logu | `BlowRecord.missed` (`:840`) | — (log DOM) | ROZBIEŻNE (brak tekstu logu w Rust; patrz #18) |
| 7 | Trafienie: `bu.hp -= dmg`, `_updateHpBar` (`:8991-8992`), log `:8997-9000` | id, hp, maxHp | `BlowRecord.def_hp_after` (`:844`) | `update_hp_bar` (`units.rs:432`) | OK |
| 8 | Etykieta obrażeń: `_spawnDamageLabel` (`:9940-9971`; pomijana w FF `:9943`; kolor wg strony gracza `:9951`) | id celu, dmg, strona gracza, `vLastWall` | `BlowRecord.dmg` | `FloatLabel::damage` (`dynamics.rs:1210`) | OK |
| 9 | Morale: `_applyMoraleDamage` (`:9722-9741`), `_gainMorale` (`:9695`), `_boostEnemiesOnBreak` (`:9707`), `_shakeAlliesOnLoss` (`:9743`) → `_updateMoraleBar` | id, morale, moraleMax (dla wielu jednostek naraz) | `ProdBody::apply_morale_damage`/`gain_morale`/`boost_enemies_on_break` (`siege_tactics_loop.rs:1266`, `:1312`, `:1324`); `shakeAlliesOnLoss` **nieportowany** (`:1252`) | `update_morale_bar` (`units.rs:450`) | ROZBIEŻNE (ripple ShakeAllies) |
| 10 | Ucieczka: `_startRout` (`:9799-9825`): SFX, `routed`, zwrot ku krawędzi (`:9817-9818`), log `:9818` | id, facing W/E | `ProdBody::start_rout` (`:1360`); efekty dowódcy nieportowane (`:1371`) | `rout_facing` (`dynamics.rs:510`) + `set_facing` | OK (dowódca: BRAK) |
| 11 | Krok ucieczki: `_fleeStep` (`:9845-9898`) → `_doMove` | jak #1 | `ActivateEvent::Flee` → `"ucieczka-routed"` nieportowane (`:805`, `:1029-1031`) | `MoveAnim` | BRAK (logika) |
| 12 | Zejście z pola: `_removeUnitFromScene` (`:9910-9925`) z `_fleeStep` (`:9855`, `:9878`, `:9890`), z AUTO (`:5936`) | id | brak w `ProdBody` (zależy od #11) | `remove_unit_from_scene` (`units.rs:616`) | BRAK (logika) |
| 13 | Śmierć: `_startFade` (`:9927-9938`) = SFX + `_removeUnitFromScene`; z ciosu (`:9047`), z wyłomu (katapulta obrońcy na murze, `:7704`) | id | `ProdBody::start_fade` (`siege_tactics_loop.rs:1413`) | `kill_unit` (`units.rs:638`) | OK (z ciosu); wyłom — BRAK (#16) |
| 14 | Wieża muru: `_fireSiegeTowers` (`:4208-4221`, odstęp 180 ms) → `_fireOneTower` (`:4223-4270`): log `:4247`, pocisk `:4250-4261`, trafienie `:4262-4266` | rząd wieży, cel, `t0` (stagger), pocisk, dmg | `SiegeLoop::tower_shoot`/`tower_hit` (`siege_tactics_loop.rs:611-660`), `LoopTimer::TowerShot` | `fire_siege_towers`, `fire_one_tower`, `TowerShot` (`siege_towers.rs:382`, `:475`, `:459`) | OK (brak mostu) |
| 15 | Zburzenie wieży: `_destroyTowerAtRow` (`:4194-4200`, log `:4199`); z `_fireSiegeTowers` (`:4216`) i `_breachWallTile` (`:7648`) | rząd | `siege_tactics_breach.rs` jawnie poza zakresem (komentarz l.24-26); pętla: wieża bez kafla nie strzela (`siege_tactics_loop.rs:623-626`) | `destroy_tower_at_row` (`siege_towers.rs:338`) | ROZBIEŻNE (brak flagi `destroyed` w silniku) |
| 16 | Atak katapulty w mur: `_attackWallTile` (`:7540-7569`): `_spawnCatapultBoulder` (`:7552`), po 700 ms HP kafla, `_updateSiegeHud`, `_spawnWallLabel('-dmg (mur)')` (`:7561`), przy 0 → `_breachWallTile` (`:7563`) | katapulta, rząd, dmg, HP kafla, `t0` | `siege_tactics_breach::attack_wall_tile` (`:108`); w `ProdBody` `"atak-muru"` nieportowany (`:810`) | `wall_shot_endpoints`, `Boulder` (`dynamics.rs:630`, `:646`), `FloatLabel::wall` (`:1222`) | BRAK (pętla) |
| 17 | Wyłom muru: `_breachWallTile` (`:7638-7750`): kafel → Plains, `wallEverBreached`, wieża, etykieta „MUR WYBURZONY!” (`:7649`), gruz, obrońcy z muru cofają się (`:7697-7740`), morale `MORALE_WALL_BREACH` (`:7745-7750`) | rząd, nowe pozycje obrońców, morale wszystkich obrońców | `breach_wall_tile` (`siege_tactics_breach.rs:92`) — tylko stan; odwrót z muru i morale: BRAK w silniku | `breach_wall_tile_fort` (`dynamics.rs:790`), `retreat_from_wall` (`:812`) | ROZBIEŻNE |
| 18 | Taran w bramę: `_attackGate` (`:7310-7336`): `_animateRam` (`:7323`), SFX, `gateHp`, `_breachGate` (`:7329`) lub `_updateSiegeHud` | taran, kierunek, gateHp | `attack_gate` (`siege_tactics_breach.rs:142`); w pętli brak ścieżki | `RamAnim` (`dynamics.rs:581`) | BRAK (pętla) |
| 19 | Wyłom bramy: `_breachGate` (`:7757-7811`): kafle Gate → Plains, ukrycie bramy, morale `MORALE_GATE_BREACH` wszystkich obrońców (`:7804-7810`) | flaga, morale obrońców | `breach_gate` (`siege_tactics_breach.rs:131`) — stan; morale: BRAK | `breach_gate` (`dynamics.rs:833`) | ROZBIEŻNE |
| 20 | Wejście na mur po wieży oblężniczej: `_trySiegeTowerClimb` (`:8056-8083`): `ru.q = wallCol`, `onWallWalkway`, log WYŁOM `:8074`, pozycja y=2.5 | id, kafel muru | `siege_tower_climb` (`siege_tactics_tower.rs:399`, log `:431`); w `ProdBody` `"wieza-wejscie"` nieportowany | `climb_onto_wall_walkway` (`units.rs:667`) | OK (brak mostu i wpięcia w pętlę) |
| 21 | Log tekstowy bitwy `this.log` (`:3744`, `:4199`, `:4247`, `:8074`, `:8962`, `:8997`, `:9046`, `:9471-9472`, `:9493`, `:9818`, `:10179-10203`, `:10229`) | lista tekstów; trafia do `BattleResult.log` (`:10723`) | brak (komentarze „log poza portem”: `siege_tactics_blow.rs:19`, `siege_tactics_endcheck.rs:17`); jedynie `TowerScene.log` (`siege_tactics_tower.rs:119`) | — (DOM / P5) | BRAK |
| 22 | Panel „Ostatnie starcia”: `_pushClash` (`:9550-9566`, max `CLASH_LOG_MAX`), `_renderClashLog` (`:9569`) | atakujący, cel, strony, dmg, tag `''/padl/rout` | `SceneEffect::PushClash{tag}`, `ClashTag` (`siege_tactics_blow.rs:125-140`) — zwracane, w pętli pomijane (`siege_tactics_loop.rs:1247`) | — (DOM / P5) | ROZBIEŻNE (tag jest, wpisu brak) |
| 23 | Paski: `_updateHpBar` (`:9636`), `_updateMoraleBar` (`:9652`), `_updateAmmoBar` (`:9671`); też reset przy replay (`:4581-4583`, `:4725-4727`, `:5497-5499`) | id + wartości | stan `CombatUnit` w `TurnSeqState` | `update_hp_bar`/`update_morale_bar`/`update_ammo_bar` (`units.rs:432-490`) | OK (snapshot stanu wystarcza) |
| 24 | HUD oblężenia `_updateSiegeHud` (`:7833`), etykiety muru `_spawnWallLabel` (`:7814-7831`) | gateHp, HP kafli, wyłom | `WallState` (`siege_tactics_breach.rs`), `SiegeEnv.wall_ever_breached` | `FloatLabel::wall`; HUD = DOM (`siegeHud1E.ts`, P5) | OK (stan) |
| 25 | Tura/baner: `hint.textContent = 'Tura N'`, `_updateBattlePhaseBanner` | roundNo, aktywna jednostka | `SeqEvent::SetHint`, `SeqEvent::Banner` (`siege_tactics_turnseq.rs:145-171`) — ignorowane w `SiegeLoop::apply` (`siege_tactics_loop.rs:538-541`) | — (DOM / P5) | OK (zdarzenie jest) |
| 26 | Koniec: `_checkEnd` (`:10153-10239`), `_finishDraw` (`:9467-9478`), PAT z FF (`:9493-9496`), `_skipInstantFallback` (`:3715-3748`), `_showEndScreen` (`:10666-10737`: `_sideEndStats` `:10257-10269`, łup, SFX zwycięstwa) | zwycięzca, statystyki stron (total/lost/remaining/hp/hpMax), łup | `end_check_order` (`siege_tactics_endcheck.rs:202`), `LoopWinner` (`siege_tactics_loop.rs:293`), `SiegeLoop::finish` (`:529`); statystyki końca i łup: BRAK | — (DOM / P5) | ROZBIEŻNE |
| 27 | Wynik do mapy: `BattleResult` (`:588-604`) budowany w `onFinish` (`:10720-10729`): `winner` (`this._endWinner ?? winner`, `:10721`), `survivors` = `this._endSurvivors` (`:10722`), `log` (`:10723`), `eventLog` (`:10724-10727`), `wallBreached` (tylko oblężenie, `:10728`). `_endSurvivors` ma **4 źródła** (§2a.1): `_checkEnd` (`:10222-10237`), `_finishDraw` (`:9474-9477`), PAT z FF (`:9494-9495`), `_skipInstantFallback` (`:3746`, z `computeInstantResult` `:20389-20593`) | jak obok | ścieżki `_checkEnd`/`_finishDraw`/PAT: `SiegeLoop` + `LoopWinner` (`siege_tactics_loop.rs:293`, `:529-533`); ścieżka „Pomiń”: `computeInstantResult` woła `resolveCombat` na parę (`:20534`), a odpowiednik `combat::resolve` (`combat.rs:381`, wynik `CombatResult` `:160-170`) istnieje, więc `CombatResult` **dotyczy** bitwy taktycznej w ścieżce „Pomiń”; brakuje natomiast **agregacji `computeInstantResult`** (parowanie, `survivorsA/D` `:20574-20575`, werdykt HP `:20580-20589`, log `:20591`): BRAK (`git grep -i compute_instant_result` → 0); `eventLog`/`BattleEventLog`: BRAK (`git grep -i battle_event_log` → 0); `post-battle-map`: BRAK | — | BRAK |
| 28 | Dźwięki `_sfxMelee/_sfxShot/_sfxDeath/_sfxRout/_sfxRamImpact/_sfxCatapultImpact/_sfxVictory` (`:11043-11160`, `:7366`, `:7608`) | rodzaj | — | brak modułu audio bitwy w `renderer/src/battle` (`grep sfx` → 0) | BRAK (poza P4-1I; audio) |
| 29 | AUTO: odtworzenie intencji `_launchAutoBatchResolution` (`:5865-5960`) → `_doMove`/`_doAttack` | jak #1, #3, #5 | `siege_tactics_autobatch.rs`, `siege_tactics_autophase.rs`; `SeqEvent::BeginAutoBatchPhase` → `halt_unsupported` w `SiegeLoop` (`siege_tactics_loop.rs:552-556`) | te same co #1/#3/#5 | BRAK (pętla AUTO, #97/#149) |
| 30 | Przewijanie (FF): `_runFastForward` (`:9415`), bez klatek; etykiety pomijane (`:9943`), pociski/fade tickowane (`FfEvent::TickProjectiles/TickFades`) | — (renderer pokazuje tylko stan końcowy) | `run_fast_forward` (`siege_tactics_fastforward.rs:131`); `FfEvent::TickProjectiles/TickFades` ignorowane (`siege_tactics_loop.rs:704`) | — | OK (w FF wystarcza snapshot końcowy) |

## 2. Pola `BattleEventsDto` z wejściami z modelu bitwy

Nazwy robocze. Typ `UnitId` jak w `BattleUnitSpawnDto.id` (`view-model/src/battle.rs:85`). Czas = zegar wirtualny
`VirtualClock::v_now` (`siege_tactics_clock.rs:50-51`) w ms, bo web liczy wszystkie animacje od `_now()` = `vNow`.

### 2a. Wynik bitwy (snapshot wg webu, `BattleResult`) — `BattleOutcomeDto`

| Pole | Web | Wejście w Rust |
|---|---|---|
| `winner: Atk \| Def \| Draw` | `BattleResult.winner` (`:589`) | `SiegeLoop::winner` / `LoopWinner` (`siege_tactics_loop.rs:293`, `:529-533`) |
| `survivors: Vec<{id, hp}>` | `this._endSurvivors` (`:10722`) — **cztery źródła wg ścieżki końca**, patrz §2a.1; zawężenie typu uzasadnione w §2a.1 | wg §2a.1 |
| `log: Vec<String>` | `this.log` (`:10723`); w „Pomiń” dopisany `result.log` z `computeInstantResult` (`:3744`) | BRAK — wymaga producenta tekstów (#21) |
| `attacker_unit_ids`, `defender_unit_ids` | `buildBattleEventLog(this.atk, this.def)` (`:10724-10727`, `battleRoster.ts:31-39`: unikalne, w kolejności rosteru) | lista ID rosteru wejściowego bitwy (`BattleSetupDto.units`, strona) |
| `wall_breached: Option<bool>` | tylko gdy `siegeWallCol >= 0` (`:10728`); w „Pomiń” ustawiane na `true`, gdy atakujący ma żywą machinę oblężniczą (`:3720-3722`), bez rozgrywania wyłomu | `SiegeEnv.wall_ever_breached` (`siege_tactics_loop.rs:326-327`); reguła „Pomiń” (`:3720-3722`): BRAK (L9) |
| `end_stats: [SideEndStats; 2]` (`total, lost, remaining, hp, hp_max`) | `_sideEndStats` (`:10257-10269`) | `TurnSeqState` (pochodna); dla ekranu końca (P5) |

#### 2a.1 Źródła `survivors`/`winner`/`log`/`wallBreached` (cztery ścieżki końca)

`BattleResult.survivors` = `this._endSurvivors` (`:10722`). Pole jest ustawiane w czterech miejscach (plus reset `[]`
przy replay w `_resetBattleRuntimeState`, `:10542`). Producent I1/I1b musi obsłużyć wszystkie cztery:

| Ścieżka | Wywołanie (pin) | `winner` | `survivors` | `wallBreached` | `log` | Wejście w Rust |
|---|---|---|---|---|---|---|
| E1 zwycięstwo | `_checkEnd` (`:10153-10239`, przypisanie `:10222-10237`) | atak./obr. (przy obu stronach żywych werdykt HP `:10219`) | **tylko strona zwycięzcy**: `_battleUnitsForMapExport(winner ? atk : def)` (`:10224-10226`, filtr `hp > 0 && (!dead \|\| routed)` `:10246-10250`) | `wallEverBreached` | `this.log` + linia końca `:10229` | `SiegeLoop::finish(LoopWinner::Attacker/Defender)`, `TurnSeqState::atk/def[].c` (`hp`, `dead`, `routed`) |
| E2 remis (PAT / szturm odparty) | `_finishDraw` (`:9467-9478`), wołane z `_checkEnd` (`:10202`) i z FF (`:9488`) | `'remis'` (`:9473`) | **obie strony**: `[...export(atk), ...export(def)]` (`:9474-9477`), najpierw atk, potem def | `wallEverBreached` | `this.log` + `PAT …` (`:9471-9472`) | `LoopWinner::Draw` (`siege_tactics_loop.rs:296`) + `TurnSeqState` obu stron |
| E3 PAT z przewijania z rozstrzygnięciem | `_ffRoundCapResult` (`:9485-9497`) | `cap.winner` (atak./obr.) | strona zwycięzcy: `export(winner ? atk : def)` (`:9494-9495`) | `wallEverBreached` | `this.log` + `PAT (przewijanie)` (`:9493`) | jak E1; wywołanie z `run_fast_forward` (`siege_tactics_fastforward.rs:131`) |
| E4 „Pomiń” bez rozgrywki | `_skipInstantFallback` (`:3715-3748`, gdy `!started`, `:3691`) | `result.winner` (`:3745`); werdykt HP `:20580-20589`, **nigdy `'remis'`** | `result.survivors` (`:3746`): strona zwycięzcy z `computeInstantResult` (`:20574-20589`), `{...u.ru.bu, hp: u.hp}` przy `hp > 0` po `resolveCombat` na parę (`:20534`); na wejściu tylko `!u.dead` (`:3724-3725`) | `true`, gdy `siegeWallCol >= 0` i atakujący ma żywą machinę (`isSiegeUnit`, `:3720-3722`); inaczej bez zmian | `this.log` + `result.log` (`:3744`, linia końca `:20591`) | `combat::resolve` (`combat.rs:381`) na parę; agregacja `computeInstantResult`: **BRAK** (L9) |

Różnice istotne dla I1: (a) E2 jest jedyną ścieżką z ocalałymi obu stron; (b) E4 nie zna `routed` (filtr tylko `hp > 0`;
jednostki z `dead=true`, także rozbite i usunięte z pola, nie wchodzą do `computeInstantResult`); (c) E4 ustawia
`wallBreached` regułą machiny, nie wyłomem; (d) E4 bierze HP z wyniku `resolveCombat`, nie z `bu.hp`.

**Zawężenie typu `survivors` do `{id, hp}` — weryfikacja.** Web eksportuje pełny `BattleUnit` (`{...u.bu, hp}`,
`:10248-10249`; w E4 `{...u.ru.bu, hp}`, `:20574-20575`). W `battleScene.ts` bezpośrednie przypisania do pól `bu`
w trakcie bitwy (`grep -nE "\.bu\.[A-Za-z_]+ *(=|\+=|-=|\*=)[^=]"`) dotyczą tylko `hp` (`:8991`, `:11683-11684`)
oraz `armyLeaderMoraleBonusFrac = 0` (`:9999`). Konsumenci `res.survivors` w pinie czytają **wyłącznie `id` i `hp`**:
`main.ts:34514` (`survivors?.map(sv => ({ id: String(sv.id), hp: sv.hp }))`), `main.ts:34537` (`manualSurvivors` →
`{id, hp}`), `game/post-battle-map.ts:28-31` (`ManualSurvivor { id; hp? }`, użycie `:169-172`),
`game/siegeDefenders.ts:375-376`. Pozostałe użycia (`main.ts:33612`, `:34344`, `:36712`, `:36724`,
`battle/mapFieldBattle.ts:560`) tylko przekazują tablicę do `applyMapBattleOutcome(WithSummary)` (`main.ts:33701`,
`:34435`). Zmiana `armyLeaderMoraleBonusFrac` nie wraca więc na mapę przez `survivors`. Wniosek: `{id, hp}` wystarcza
konsumentom mapy w pinie. Zastrzeżenie w §5 (NIE_ZMIERZONO): mutacje `bu` w funkcjach spoza `battleScene.ts`.

### 2b. Stan po kroku (snapshot dla pasków i pozycji) — `BattleFrameDto`

| Pole | Web | Wejście w Rust |
|---|---|---|
| `v_now: f64`, `round_no: i64` | `vNow`, `roundNo` | `VirtualClock::v_now`, `TurnSeqState::round_no` |
| `units: Vec<{id, col, row, facing, hp, morale, ammo_left: Option<f64>, routed, dead, removed, on_wall_walkway}>` | pola `RuntimeBattleUnit` | `TurnSeqState` (`CombatUnit`), `ProdBody::facing` (`siege_tactics_loop.rs:876`); pozycja: BRAK w `CombatUnit` (dziś wejście adaptera) |
| `wall: {tile_hp: Vec<(row, hp)>, gate_hp, gate_open, ever_breached, towers_destroyed: Vec<row>}` | `wallTileHp`, `gateHp`, `gateOpen`, `wallEverBreached`, `siegeTowers[].destroyed` | `WallState` (`siege_tactics_breach.rs`); `towers_destroyed`: BRAK (#15) |
| `finished: bool` | `finished` | `TurnSeqState::finished` |

### 2c. Akcje przejściowe w kroku (nieodtwarzalne z różnicy stanu) — `Vec<BattleActionDto>`

Każda z `t0` (czas wirtualny startu). Dlaczego osobno: lunge, lot pocisku, kamień, taran i etykieta nie zostawiają
śladu w stanie końcowym kroku (pozycja atakującego wraca na kafel, `:9161-9166`), więc „renderer liczy różnice”
(D-DTO-7 B) nie odróżni ciosu od braku ciosu przy pudle (`:8961-8963`: brak zmiany HP).

| Wariant | Web | Wejście w Rust | Konsument |
|---|---|---|---|
| `Move{id, from, to, t0}` | `_doMove` 3D (`:8716-8776`) | ruch ciał K5H (dziś `unported`) | `MoveAnim::start` |
| `Facing{id, dir}` | `_updateFacing`, `:9104-9105`, `:9137-9138`, `:9817-9818` | `ProdBody::facing` | `set_facing` |
| `Melee{attacker, target, t0, hit_at = t0+BLOW_HIT_T}` | `_doMeleeAttack` | `BlowRecord` (+ czas) | `MeleeLunge` |
| `Shot{shooter, target, kind, t0, land_at = t0+RANGED_FLY_MS}` | `_doRangedAttack`, `_fireOneTower` | strzelec (BRAK), wieża (`tower_shoot`) | `launch_projectile` / `fire_one_tower` |
| `Damage{target, dmg, player_side_loss}` | `_spawnDamageLabel` | `BlowRecord.dmg` | `FloatLabel::damage` |
| `Miss{attacker, target}` | `:8962` | `BlowRecord.missed` | log (P5) |
| `Clash{attacker, target, dmg, tag}` | `_pushClash` | `SceneEffect::PushClash` + `BlowRecord` | panel DOM (P5) |
| `Rout{id}`, `Kill{id}`, `LeaveField{id}` | `_startRout`, `_startFade`, `_removeUnitFromScene` | `start_rout`, `start_fade`; `LeaveField`: BRAK | `rout_facing`/`kill_unit`/`remove_unit_from_scene` |
| `Boulder{catapult, row, t0, impact_at = t0+700}`, `WallDamage{row, dmg, hp_after}` | `_attackWallTile` | `attack_wall_tile` (pętla: BRAK) | `Boulder`, `FloatLabel::wall` |
| `Ram{ram, t0}`, `GateDamage{dmg, hp_after}` | `_attackGate` | `attack_gate` (pętla: BRAK) | `RamAnim` |
| `WallBreach{row, retreats: Vec<(id, col, row)>, killed: Vec<id>}` | `_breachWallTile` | `breach_wall_tile` + odwrót (BRAK) | `breach_wall_tile_fort`, `retreat_from_wall` |
| `GateBreach` | `_breachGate` | `breach_gate` | `breach_gate` |
| `TowerDestroyed{row}` | `_destroyTowerAtRow` | BRAK | `destroy_tower_at_row` |
| `ClimbWall{id, col, row}` | `_trySiegeTowerClimb` | `siege_tower_climb` | `climb_onto_wall_walkway` |
| `Log{text}` | `this.log.push` | BRAK | P5 |
| `Turn{round_no}`, `Banner{active}` | `hint`, `_updateBattlePhaseBanner` | `SeqEvent::SetHint`/`Banner` | P5 |
| `End{winner}` | `_showEndScreen` | `SiegeLoop::finish` | P5 |

Dźwięk (#28) jest pochodną wariantów (`Melee`→melee, `Shot`→shot, `Kill`→death, `Rout`→rout, `Ram`, `Boulder` przy
uderzeniu, `End`) — osobne pole niepotrzebne.

## 3. Luki (BRAK / ROZBIEŻNE) poza samym DTO

- **L1** Pętla produkcyjna nie wykonuje ruchu, strzelca, ucieczki, ataku muru/bramy ani AUTO (`ProdBody::unported`,
  `siege_tactics_loop.rs:727-731`, `:802-818`; `halt_unsupported` `:552-556`, `:697-702`). Bez tego wariantów
  `Move/Shot/Boulder/Ram/LeaveField` nie ma kto wyprodukować. Tematy kolejki: #97, #107/#123, #112, #113, #149.
- **L2** `shakeAlliesOnLoss` i efekty dowódcy nieportowane (`siege_tactics_loop.rs:1252`, `:1371`) → morale innych
  jednostek w snapshotcie będzie inne niż w webie.
- **L3** Wyłom: odwrót obrońców z muru, śmierć katapulty obrońcy na murze i spadek morale `MORALE_WALL_BREACH` /
  `MORALE_GATE_BREACH` są tylko w rendererze/webie, nie w silniku (`siege_tactics_breach.rs:24-26`).
- **L4** `siegeTowers[].destroyed` nie ma w silniku (#15 tabeli).
- **L5** Teksty logu (`this.log`) i wpisy `_pushClash` — brak producenta (#21, #22).
- **L6** `BattleResult`/`eventLog`/`post-battle-map` — brak po stronie silnika dla bitwy taktycznej (#27).
- **L7** Pozycja (`col,row`) i `on_wall_walkway` nie są polami `CombatUnit` w `TurnSeqState` — dziś wejście adaptera.
- **L8** Audio bitwy — brak modułu (poza zakresem P4-1I).
- **L9** Ścieżka „Pomiń” (E4, §2a.1): brak portu agregacji `computeInstantResult` (`battleScene.ts:20389-20593`) i reguły
  `wallBreached` przy machinie (`:3720-3722`); `combat::resolve` na parę istnieje (`combat.rs:381`).

## 4. Propozycja podziału na wdrożenia (NIE wdrażać)

Kolejność: I1 → I2 → I3; I4 równolegle po I1; I5 po I3 i L1. Wszystkie: model wg zasad orkiestratora, pin `07d2fbd72`.

| Nazwa | Zakres | Allowlista | Wektory / testy |
|---|---|---|---|
| `R-RUSTPORT-P4-1I1-BATTLE-OUTCOME` | `BattleOutcomeDto` (§2a) w `view-model`; producent dla ścieżek E1–E3 (§2a.1) z `SiegeLoop`: winner, survivors **wg ścieżki** (E1/E3 strona zwycięzcy, E2 obie strony w kolejności atk→def), ID rosterów = `buildBattleEventLog`, `wall_breached`, `end_stats`; wejście producenta = jawna ścieżka końca (enum E1/E2/E3/E4), E4 jako wariant z danymi podanymi z zewnątrz do czasu I1b; `log` jako `Vec<String>` puste + jawne `NIE_ZMIERZONO` do I3 | `rust-port/view-model/src/battle.rs`, `rust-port/view-model/tests/**` (nowy), `rust-port/engine/src/domain/siege_tactics_outcome.rs` (nowy), `rust-port/engine/src/domain/mod.rs`, `rust-port/engine/tests/p4_1i1_*.rs` | wektory z pinu: `buildBattleEventLog` (duplikaty, kolejność, ID liczbowe → `String`), `_battleUnitsForMapExport` (rout z hp>0, dead z hp 0), `_sideEndStats`, `wallBreached` obecne tylko w oblężeniu; remis E2 z ocalałymi obu stron; PAT E3; serde round-trip |
| `R-RUSTPORT-P4-1I1B-BATTLE-INSTANT` | ścieżka „Pomiń” E4 (L9): port `computeInstantResult` (`:20389-20593`) na `combat::resolve` + reguła `wallBreached` przy machinie (`:3720-3722`) + `result.log`; zasila `BattleOutcomeDto` z I1 | `rust-port/engine/src/domain/siege_tactics_instant.rs` (nowy), `rust-port/engine/src/domain/mod.rs`, `rust-port/engine/tests/p4_1i1b_*.rs` | wektory pinu: werdykt HP (`hpA >= hpD`), brak remisu, `!dead` na wejściu, `wallBreached` z/bez machiny i z/bez muru, teksty `result.log` |
| `R-RUSTPORT-P4-1I2-BATTLE-FRAME` | `BattleFrameDto` (§2b) + producent ze stanu pętli po każdym `fire`; pozycje/`on_wall_walkway` jako wejście adaptera (L7), `towers_destroyed` z flagi dodanej w silniku (L4) | `rust-port/view-model/src/battle.rs`, `rust-port/engine/src/domain/siege_tactics_loop.rs` (tylko odczyt stanu + flaga wież), nowy `siege_tactics_frame.rs`, testy | wektory pinu: kolejność jednostek = kolejność spawnu; amunicja `Infinity` → `None`; wieże zburzone przy wyłomie (`:7648`) i przy strzale bez kafla (`:4216`) |
| `R-RUSTPORT-P4-1I3-BATTLE-ACTIONS` | `Vec<BattleActionDto>` (§2c) emitowane przez `SiegeLoop`/`ProdBody` dla ścieżek JUŻ portowanych (cios, kontratak, wieża, rout, śmierć, koniec, tura) + producent tekstów logu i `_pushClash` (L5) 1:1 z pinu | `rust-port/engine/src/domain/siege_tactics_loop.rs`, `siege_tactics_blow.rs` (tylko `SceneEffect`), nowy `siege_tactics_actions.rs`, `rust-port/view-model/src/battle.rs`, testy | generator TS wykonujący tekst pinu (`_doMeleeAttack`/`_singleBlow`/`_resolveBlowOutcome`/`_fireOneTower`) z przechwyceniem wywołań sceny → oczekiwana sekwencja akcji z `t0`; teksty logu bajt-w-bajt (`toFixed(0)`, `arcTag`) |
| `R-RUSTPORT-P4-1I4-BATTLE-CONSUMER` | konsument w rendererze: `BattleActionDto` → `MoveAnim`/`MeleeLunge`/`launch_projectile`/`Boulder`/`RamAnim`/`breach_*`/`FloatLabel`/`kill_unit`; `BattleFrameDto` → paski | `rust-port/renderer/src/battle/**` (nowy `playback.rs`), `rust-port/renderer/tests/**` | ten sam scenariusz: scena po odtworzeniu akcji = scena po wywołaniach z pinu (porównanie drzewa `Scene` z istniejącymi fiksturami `tests/fixtures/battle3d/`) |
| `R-RUSTPORT-P4-1I5-BATTLE-ACTIONS-SIEGE` | warianty zależne od L1/L3: `Move`, `Shot` strzelca, `LeaveField`, `Boulder`/`WallDamage`, `Ram`/`GateDamage`, `WallBreach` z odwrotem i morale, `ClimbWall`, AUTO | jak I3 + moduły ruchu/oblężenia wskazane przez tematy L1 | wektory pinu `_attackWallTile`, `_attackGate`, `_breachWallTile` (`:7697-7750`), `_breachGate` (`:7804-7810`), `_fleeStep` |

Zależności: I1 nie zależy od L1 (wynik E1–E3 da się zbudować z obecnego `SiegeLoop`); I1b po I1. I3 i I5 zależą od rozstrzygnięcia §5.

## 5. NIE_ZMIERZONO i sprawy do decyzji

- **D-DTO-7 (decyzja techniczna orkiestratora, nie gameplay).** Kontrakt rekomendował A (zdarzenia), rejestr
  (`REJESTR-RUST.md:1534`) zapisał „snapshot wg webu”. Ustalenie z pinu: web nie ma ani zdarzeń, ani snapshotu przebiegu,
  tylko wywołania metod. Snapshot wg webu pokrywa **wynik** (§2a) i **paski** (§2b); **nie** pokrywa akcji przejściowych
  (§2c), których nie da się odtworzyć z różnicy stanu (pudło, lunge, lot pocisku). Propozycja: §2a + §2b jako snapshot,
  §2c jako lista akcji w kroku (to jest wariant A z kontraktu ograniczony do akcji, które web wykonuje przez wywołanie sceny).
  Wpis do `REJESTR-RUST.md` należy do orkiestratora. Nie jest to pytanie ABC do właściciela: gameplay się nie zmienia.
- Czy renderer ma odtwarzać akcje we własnym zegarze (D-RR-10), czy silnik ma podawać `t0` z `VirtualClock` — przyjęto
  `t0` z silnika, bo web liczy animacje od `vNow`; **NIE_ZMIERZONO** zgodności przy zmianie prędkości (`speedMult`).
- Liczba linii `battleScene.ts` w pinie: 20 771 (`wc -l`); kontrakt podaje 19 493 dla `edb8fb56` — zmiana pinu, nie błąd.
- Pełna lista wywołań `this.log.push` poza `battleScene.ts` (np. `manualBattle.ts`, martwy kod wg kontraktu l.171) —
  **NIE_ZMIERZONO**.
- `mapFieldBattle.ts` przekazuje `res.eventLog` dalej (`:566`); ścieżka mapowa bez sceny 3D buduje log z rosteru
  (`main.ts:33996`, `:34274`, `:34501`, `:36697`) — zakres P6 (post-battle-map), nie P4-1I; wpięcie **NIE_ZMIERZONO**.
- Pola `BattleUnit` zmieniane w trakcie bitwy przez funkcje **spoza** `battleScene.ts` (wołane z `u.bu` jako argument) —
  **NIE_ZMIERZONO**. Sprawdzone tylko bezpośrednie przypisania w `battleScene.ts` (§2a.1: `hp`, `armyLeaderMoraleBonusFrac`)
  i konsumenci `res.survivors` (czytają `id`, `hp`). Typ `{id, hp}` pozostaje bezpieczny dla mapy w pinie niezależnie
  od wyniku, bo konsumenci nie czytają innych pól.
- Czas `t0` akcji w trybie AUTO (wiele animacji równolegle w fazie, `autoBatchPhase.ts:1-7`) — **NIE_ZMIERZONO**,
  zależy od L1 (#97/#149).

## 6. Dowody (polecenia)

- `git rev-parse origin/rust-port/parity-v2` → `c3e3617b2…`.
- `git archive 07d2fbd72 gra/src/battle gra/src/render gra/src/units gra/src/game/combat.ts | tar -x` (scratchpad).
- `grep -n "battleEventLog\|BattleEventLog\|eventLog\|emit(\|dispatchEvent\|onBlow\|onShot\|battleLog\|this\.log" gra/src/battle/battleScene.ts`.
- `grep -rln "battle\|Battle" gra/src/render` → wyłącznie modele jednostek (`units.ts`, `unitVeteranBadges.ts` …), bez zdarzeń.
- `git grep -n "eventLog" 07d2fbd72 -- gra/src`, `git grep -n "battleEventLog" 07d2fbd72 -- gra/src`.
- Rust: `git grep -n "SeqEvent"`, `grep -n "pub fn\|pub struct" renderer/src/battle/{dynamics,units,siege_towers}.rs`,
  `git grep -n -i "event_log\|BattleEventLog" -- rust-port` → 0 trafień dla bitwy.
