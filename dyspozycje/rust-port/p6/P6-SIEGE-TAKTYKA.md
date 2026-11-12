# P6-SIEGE-TAKTYKA — pokrycie pętli taktycznej oblężenia (#217)

Temat: `R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1` (runda 5, ostatnia, Operator Haiku 5.5; r5 = poprawka po FC r4, zarzut 1: 3 metody doctrine bez wiersza).
Baza r3: `bdb8e6f54` (FC r2; kod Rust `3e6c3c084` bez zmian). Pierwotna baza Rust: `258afaf8f` = `origin/rust-port/parity-v2`.
Pin web (tylko odczyt, `git show`): `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.
Źródła pinu: `gra/src/battle/battleScene.ts` (pętla bitwy oblężniczej), `gra/src/battle/siegeWall.ts`, `gra/src/game/siegeAi.ts`, `gra/src/game/mapSiegeDetect.ts`, `gra/src/game/city-fortification.ts`.
Numeracja L2–L5 / L9–L10 wg `dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-LIMIT-BLOKADA.md` (tabela luk).

Legenda statusu: **PORTED** = odpowiednik Rust 1:1 (plik:linia Rust), **PARTIAL** = tylko część funkcji, **BRAK** = brak odpowiednika (powód w kolumnie), **NIE_ZMIERZONO** = nie sprawdzono (dane spoza repo lub poza zakresem deklarowanym niżej).
Klasyfikacja metod (wiersze 32.x, 33.x): **O** = oblężnicza (dotyczy muru, bramy, wieży, taranu), **M** = mieszana (ogólna z gałęzią oblężniczą), **G** = ogólna walka / UI / scena (poza oblężeniem), klasyfikacja wg treści lub, dla metod oznaczonych „wg nazwy”, wg nazwy i wywołań (treść nie czytana w tej rundzie).

Zakres „100% funkcji pętli L2–L5” (stan po obronie r5, zarzut 1 FC r4 + zarzut 1 obrony): wszystkie deklaracje `battleScene.ts` na pinie, których nazwa pasuje do wzorca `siege|wall|gate|breach|tower|tick|round|rout|morale|check|_ff|fast|rang|_do|sortie|palis|machin|ram|stall|end|draw|winner|verdict|climb|pomin|manual|auto`, **w tym metody `static`** i **pola-funkcje strzałkowe** (`private readonly _x = (...) => {`), których poprzedni wzorzec nie łapał. Enumeracja (skrypt w repo: `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/enum-decl.py`, pin podawany argumentem): `git show 07d2fbd72f758705f8e1d59cc4968027ffbafe75:gra/src/battle/battleScene.ts` → (A) metody: `^  (private |public |protected )?(static )?(async )?[A-Za-z_]\w*\(`, (B) pola-funkcje: `^  (private |public |protected )?(readonly )?[A-Za-z_]\w* = (async )?\(` → filtr słów kluczowych po pełnej linii (bez rozróżniania wielkości liter). Wynik: **143 trafienia linii wzorca**. Dwa z nich to `tri(...)` (wiersze 1303–1304): wywołania w funkcji modułowej, nie deklaracje — pominięte. Pozostaje **141 deklaracji** (przed obroną 138 = wynik wzorca bez `static` i pól-funkcji, minus `tri`; obrona dopisuje 3: `_threatSlack` (`static`, `:7939`), `_onResize` (`:12386`), `_onKeyManual` (`:17406`)). Sprawdzenie nazwa po nazwie: każda z 141 deklaracji ma wiersz w §1, §1a, §1b, §1c lub §1d (wynik zbiorów: `02a-obrona.md`). Deklaracje spoza wzorca NIE są enumerowane i NIE są twierdzone jako pokryte — patrz §5 D-ST-3. Uwaga: wzorzec dopasowuje całą linię deklaracji (także typy parametrów i treść w jednej linii), więc część metod kamery/UI (`_tickZoom`, `_drawMinimap` itd.) również wchodzi w zakres — mają wiersze w §1c.

## 1. Tabela pokrycia — poziomy L2–L5 (pętla taktyczna)

| # | Funkcja / element webowy | Linie pinu | Odpowiednik Rust | Status | Uwagi / zależności |
|---|---|---|---|---|---|
| 1 | `SIEGE_NO_BREACH_MAX_ROUNDS` (stała z `combat-params.json`) | `battleScene.ts:1128` | `domain/siege_no_breach.rs:53` `siege_no_breach_cap`; `:27` `siege_no_breach_max_rounds_from_data` | PORTED | Wartość 150 z danych (runda 2 r-OBL). |
| 2 | pole `siegeNoBreachMaxRounds` | `battleScene.ts:2505` | parametr `no_breach_cap` w `siege_no_breach.rs:69` | PORTED | Pole instancji = argument wywołania (brak stanu obiektu). |
| 3 | `_roundCapVerdict()` (L2) | `battleScene.ts:9449-9465` | `domain/siege_no_breach.rs:69` `round_cap_verdict` | PORTED | Wektory z weba: `tests/p6_repin_oblezenie_limit_web.rs`. |
| 4 | `_runFastForward()` (pętla przewijania) | `battleScene.ts:9415-9437` | brak | BRAK | Pętla rAF/timerów sceny (`_drainTimers`, `_tickProjectiles`, `_tickFades`, `_ffQueue`). Brak warstwy pętli taktycznej w Rust (D-OBL-4). |
| 5 | `_ffRoundCapResult()` (L4) | `battleScene.ts:9485-9499` | brak | BRAK | Efekty sceny (`finished`, `_ffActive`, log, `_endSurvivors`, `_showEndScreen`). Werdykt tury: `round_cap_verdict` (wiersz 3). |
| 6 | `_finishDraw(reason, cap)` (L4) | `battleScene.ts:9467-9480` | brak (werdykt `RoundCapVerdict::Draw` w `siege_no_breach.rs:37`) | PARTIAL | Część logiczna = werdykt remis; efekty UI/log/survivors BRAK. |
| 7 | `_checkEnd()` — warunek `if (this.finished)` i zbudowanie `aliveA/aliveD` | `battleScene.ts:10153-10158` | brak (flagi podawane z zewnątrz) | BRAK | Wymaga modelu jednostek (`!dead && !fadingOut && !routed`). |
| 8 | `_checkEnd()` — morale: `_armyMoraleRatio`, `brokenA/brokenD`, rout dowódców | `battleScene.ts:10160-10171`, `:9988` (`_armyMoraleRatio`) | brak (`army_leadership.rs:123` ma tylko `army_morale_ratio_without_commander`) | BRAK | Wymaga modelu morale armii (Z-NB-3); `commandersToWithdrawAfterArmyBreak` poza zakresem tematu. |
| 9 | `_checkEnd()` — stall, gałąź PAT bez oblężenia (`!isSiege && totalDead > 0`) | `battleScene.ts:10172-10183` (PAT: `:10178-10182`); wejście `_stalled`: `:5568` `_updateStallWatch` (wiersz 33.9) | `domain/siege_tactics_endcheck.rs` `stall_pat_loser` (PAT) + `end_check_order` (złożenie kroków 10172→10184→10189→10197→10208), ENDCHECK-Q1 | PORTED (O) | Wejścia jawne: `stalled` (po `update_stall_watch`), flagi życia, `total_dead` (tylko `dead`), `ratio_a/d` przed `_startRout` oraz `ratio_*_at_cap` po nim (`:10197`), `round_no`, `no_breach_cap`, `hp` jednostek. Gałęzie: PAT (`ratioA <= ratioD` → atakujący, inaczej obrońca; NaN → obrońca), odparcie szturmu WYŁĄCZNIE w bloku `stalled && alive_a && alive_d` (test `oblezenie_bez_stall_nie_odpiera_szturmu`), morale < 0,25, sufit tur (`round_cap_verdict`: remis / obrońca / atakujący), rozstrzygnięcie `battle_winner`. Wektory: `tests/p6_siege_tactics_endcheck_vectors` (1200 przypadków `endCheck`, 300 `pat`), generowane przez WYKONANIE wyciętego tekstu pinu (`p6_siege_tactics_endcheck_gen.mjs`, strażnik SHA-256 fragmentów). NIE PORTOWANO (efekty sceny, poza funkcjami): logi `this.log.push`, `_startRout` (rozbicie dowódców), `_finishDraw` / `finished` / `_showEndScreen` / `_endWinner` / `_battleUnitsForMapExport`, `if (this.finished) return true` — wywołujący. |
| 10 | `_checkEnd()` — „SZTURM ODPARTY" (`isSiege && !wallEverBreached` → `aliveA = false`) | `battleScene.ts:10184-10186` | `domain/siege_tactics_end.rs:41` `siege_no_breach_repels_attack` | PORTED (nowy w r1) | Wektory: `tests/p6_siege_tactics_vectors/vectors.json` (`repels`, 4 przypadki), test `wektory_repels_zgodne_z_webem`. |
| 11 | `_checkEnd()` — morale zalamane (`brokenA && aliveA` → `aliveA = false`) | `battleScene.ts:10189-10192` | brak | BRAK | Zależy od wiersza 8. |
| 12 | `_checkEnd()` — sufit tur w AUTO/ręcznej (`aliveA && aliveD` → `_roundCapVerdict`) | `battleScene.ts:10197-10206` | werdykt: `siege_no_breach.rs:69`; wiring w pętli brak | PARTIAL | Logika werdyktu PORTED (wiersz 3); wpięcie do stanu tury BRAK (D-OBL-4). |
| 13 | `_checkEnd()` — rozstrzygnięcie zwycięzcy (`return false` gdy obie żyją; `atakujacy`/`obronca`; mutual elimination po HP `hpA >= hpD`) | `battleScene.ts:10208-10220` | `domain/siege_tactics_end.rs:49` `battle_winner` | PORTED (nowy w r1) | Wektory: `vectors.json` (`winner`, 432 przypadki, seed 217); testy `wektory_winner_zgodne_z_webem` + 5 testów jawnych. Sumowanie HP z `Math.max(0, hp)` na jednostkę. |
| 14 | `_checkEnd()` — ekran końca, `_battleUnitsForMapExport`, log zwycięstwa | `battleScene.ts:10222-10240` | brak | BRAK | Efekty sceny/mapy poza zakresem. |
| 15 | `wallEverBreached` — ustawianie po wyłomie (`_breachWallTile`) | `battleScene.ts:7638-7647` (funkcja `:7638`, wiersz 33.x: `_breachWallTile`) | `domain/siege_tactics_breach.rs` `breach_wall_tile` + `attack_wall_tile` (K4, r1; callback `_attackWallTile` `:7555-7564`) | PORTED (K4, r1) — skutek flagi i kafla; efekty terenu, siatki, logu i zdejmowania jednostek (`:7660-7756`) BRAK (poza zakresem automatu) | Stan muru (L3). Zależy od `siegeWallCol`/`wallTileHp` (`_carveWallTiles` `:4026`). |
| 16 | `wallEverBreached` — ustawianie po wyłomie bramy (`_breachGate`) | `battleScene.ts:7757-7759` (funkcja `:7757`) | `domain/siege_tactics_breach.rs` `breach_gate` + `attack_gate` (K4, r1; guard `:7311`, `:7327-7329`) | PORTED (K4, r1) — flaga i `gateOpen`; efekty terenu (`tiles`) BRAK | L3; stan bramy `GATE_MAX_HP`. |
| 17 | `wallEverBreached` — ustawianie przez wejście na wieżę (`_trySiegeTowerClimb`) | `battleScene.ts:8056-8076` (zapis flagi `:8073`, blok `:8071-8075`) | `domain/siege_tactics_breach.rs` `tower_climb_enter_wall` (K4, r1; wykonany fragment `:8071-8075`) | PARTIAL (K4, r1) — tylko skutek flagi; warunki ruchu (`canClimb`, `towerAtWallRows.has`, kafel) i przesunięcie jednostki BRAK (K2/K5) | L3; zależy od `towerAtWallRows`. |
| 18 | `wallEverBreached = true` przy „Pomiń" (machina oblężnicza w składzie) | `battleScene.ts:3718-3721` | `domain/siege_tactics_breach.rs` `skip_instant_fallback` (K4, r1) | PORTED (K4, r1) — flaga; guard `finished` i reszta `_skipInstantFallback` (wynik natychmiastowy) poza automatem | Ścieżka skip/AUTO; zależy od warstwy bitwy (L5). |
| 19 | `_siegeApproachRestricted(ru)` (blokada zbliżania) | `battleScene.ts:7951-7962` (+ `canShoot` `:1457`, `isSiegeUnit` `:1552`) | `siege_tactics_approach::siege_approach_restricted` (K0b, r1) | PORTED | NIE jest czystym boolem (poprawka po zarzucie 1 audytu R1). Gałęzie z pinu: (a) `return false` gdy `!(siegeWallCol >= 0)` lub `ru.side !== 'atk'`; (b) `return false` gdy `ru.routed`, `ru.onWallWalkway` lub `isSiegeUnit(ru.bu)` (`:7953`); (c) `return false` gdy `ru.primaryRanged && canShoot(ru) && ru.shootingEnabled !== false` (strzelec, `:7954`); (d) gałąź `ru.mounted`: `return !(gateOpen \|\| tileBreached)`, gdzie `tileBreached = siegeWallTilesInit > 0 && wallTileHp.size < siegeWallTilesInit`; (e) pozostali piesi: `return !(wallEverBreached \|\| towerAtWallRows.size > 0)`. Zależy od stanu sceny (`gateOpen`, `wallTileHp`, `towerAtWallRows`, `ru.routed`, `ru.onWallWalkway`) — nie jest czystą funkcją 2×2. Stan sceny wchodzi jako pola `ApproachUnit`/`ApproachWallState`. Gałęzie (a)–(e) są już rozbite na wejścia w K0b (`siege_approach_restricted`, wektory per gałąź) — wiersz 19 nie wymaga dalszego rozbicia przed K2. |
| 20 | `_meleeBlockedByWall(ru, e)` (wywołanie `meleeBlockedByWall`) | `battleScene.ts:8361-8372` (wywołanie `:8363`), eksport `:10728` | brak | BRAK | Zależy od geometrii muru i `wallBreached`. Patrz 22 (czysta funkcja pod spodem). |
| 21 | L5: bitwa ręczna i „Pomiń = wynik AUTO" (wspólny `_roundCapVerdict`) | `battleScene.ts:2286`, `:3572`, `:3718-3721`, `:10197-10203` | brak | BRAK | Brak warstwy bitwy ręcznej w Rust (P6-REPIN-OBLEZENIE-LIMIT-BLOKADA L5). Wiersz 33.x `_performSiegeManualOrder` (`:18435`) też BRAK. |
| 22 | `meleeBlockedByWall(ctx)` (import `city-fortification`) | `gra/src/game/city-fortification.ts:76-79` (typ `MeleeWallContext` `:61-70`; import `battleScene.ts:114`; wywołanie `:8363`) | `domain/siege_city_fortification.rs` `melee_blocked_by_wall` (K2 r1; wektory `tests/p6_siege_city_fortification_vectors`, 324 przyp., galezie a-e) | PORTED | CZYSTA funkcja (4 pola + `wallBreached`): `wallBreached !== true && attackerIsMelee && !attackerOnWall && defenderOnWall`. Zależy od `wallBreached` (wiersze 15–17) jako `bool` (web `=== true`; brak = `false`). |
| 23 | `attackerWallEntryIsBreach(side, onWallWalkway)` (import `city-fortification`) | `gra/src/game/city-fortification.ts:96-98` (import `battleScene.ts:114`; wywołanie `:8072` w `_trySiegeTowerClimb`) | `domain/siege_city_fortification.rs` `attacker_wall_entry_is_breach` (K2 r1; 206 przyp., 3 galezie) | PORTED | CZYSTA funkcja: `side === 'atk' && onWallWalkway === true`. Zależy tylko od wejść. |
| 23a | `autoStormBreach(hasSiegeMachine)` (wyłom dla szturmu AUTO) | `gra/src/game/city-fortification.ts:86-88` (komentarz `:81-85`) | brak (grep `auto_storm_breach` pusty) | BRAK | CZYSTA funkcja, 1 linia: zwraca `hasSiegeMachine`. Nie wołana z `battleScene.ts`; wołana z `gra/src/main.ts:1046` (import), `:34480`, `:36365`, `:36629` (zmierzone grepem na pinie). Nie była w r1. |
| 24 | `cityFortificationKind(builtBuildingIds)` (import `city-fortification`) | `city-fortification.ts:29-36` (typ `:26`; import `battleScene.ts:114`; wywołanie `battleScene.ts:2741`) | `domain/siege_city_fortification.rs` `city_fortification_kind` (K2 r1; 214 przyp., `None` = web null/undefined) | PORTED | Czysta funkcja nad listą identyfikatorów budynków (`mur` > `palisada` > `none`); zależy od danych budynków (`fortKind`). Poza pętlą taktyczną (konstruktor sceny). |
| 24a | `cityHasFortification(builtBuildingIds)` | `city-fortification.ts:39-43` | brak | BRAK | Czysta. Nie wołana z `battleScene.ts`. Wołana pośrednio przez `cityIsFortified` (24b). |
| 24b | `cityIsFortified(maMur, builtBuildingIds)` | `city-fortification.ts:46-51` | brak | BRAK | Czysta. Nie wołana z `battleScene.ts`. Wołana z `gra/src/main.ts:1049` (import), `:34479`, `:36363`, `:36631`, `:43329` (zmierzone grepem na pinie 07d2fbd72). |
| 24c | `canCaptureCity(fortified, wallBreached)` | `city-fortification.ts:57-59` | brak | BRAK | Czysta. Nie wołana z `battleScene.ts`. Wołana z `gra/src/main.ts:1047` (import), `:34478`, `:36365`, `:36631`. |
| 25 | `armyMoraleRatioWithoutCommander(units)` (import `game/army-leadership`) | `gra/src/game/army-leadership.ts:39-` (wywołanie `battleScene.ts:9990`, `_armyMoraleRatio` `:9988`) | `domain/army_leadership.rs:123` `army_morale_ratio_without_commander` | PORTED (istniejący, poprzedni temat) | Czysta funkcja; port istnieje — nie wymaga klocka. Zależność: `ArmyLeaderCombatant`. |
| 26 | `commandersToWithdrawAfterArmyBreak(units, threshold)` (import `game/army-leadership`) | `gra/src/game/army-leadership.ts:57-` (wywołanie `battleScene.ts:10170-10171`) | `domain/army_leadership.rs:146` `commanders_to_withdraw_after_army_break` | PORTED (istniejący) | Czysta funkcja; port istnieje. Wiersz 8 (`_checkEnd` morale) nadal BRAK, bo brakuje `_startRout` (wiersz 33.x, efekt sceny). |
| 27 | `isSiegeUnit(bu)` (funkcja lokalna) | `battleScene.ts:1552-1559` (wywołania m.in. `:3720`, `:4455`, `:6091`, `:6187`, `:7953`, `:8023`, `:8057`, `:8088`, `:8140`, `:8367`) | `domain/siege_tactics_classify.rs` `is_siege_unit(&ClassifyUnit)` (KLASY-Q1, r1); inne: `domain/brake_power_army.rs:31` `is_siege_unit(rola_linia)` = OSOBNY klasyfikator (`Rola (linia)`), nie ten sam predykat | PORTED | 1:1 z pinem: `Typ` po trim = `Siege`, albo `normName(Jednostka ?? nazwa)` zawiera `taran`/`katapult`/`wieza oblezn`/`battering`/`catapult`/`siege tower`. Wejście jawne `ClassifyUnit` (typ/jednostka/nazwa jako `Option<String>`; `None` = null/undefined); Rust nie ma modelu `BattleUnit` z `stats`. Wektory: `tests/p6_siege_tactics_classify_vectors/vectors.json` (1132 przypadki: 872 nazw, 20 `canShoot`, 240 `normName` = pelny zakres U+00C0..U+017F znak po znaku + przypadki zlozone; wykonanie linii pinu w `p6_siege_tactics_classify_gen.mts`, straznik SHA-256 `10c0ec94…c41`); testy `tests/p6_siege_tactics_classify.rs`. Pokrycie: wszystkie gałęzie (`isSiegeUnit:typ` 146, `:name` 231, `:false` 495) i 75 jednostek z `gra/data/units.json` (pin). |
| 28 | `canShoot(ru)` (funkcja lokalna) | `battleScene.ts:1457-1459`: `ru.rangedBase && ru.ammoLeft > 0` | `domain/siege_tactics_classify.rs` `can_shoot(&ShootUnit)` (KLASY-Q1, r1) | PORTED | 1:1 (`ranged_base && ammo_left > 0.0`; NaN daje fałsz jak w JS). Wektory: 20 przypadków siatki `rangedBase` × `ammoLeft` (w tym NaN, ±Infinity, -0) w `p6_siege_tactics_classify_vectors/vectors.json`, sprawdzane przez `can_shoot_matches_pin_and_covers_branches`. Flagi `can_shoot` w K1/K3 (`siege_tactics_approach.rs`, `siege_tactics_tower.rs`) pozostają wejściami wywołującego (bez refaktoru w tym temacie). |
| 29 | `_siegeMoveRefused(ru, col, row)` | `battleScene.ts:7962-7970` | `domain/siege_tactics_approach.rs` `siege_move_refused` (K1, r1) | PORTED | Wejścia jawne: `ApproachUnit`, `ApproachWallState`, lista zagrożeń (wynik `siege_shooter_threats`), `from`, `to`. Gałęzie: nieograniczone / brak zagrożeń / `slack(to) > 0` / odmowa `slack(to) < slack(from)` / dopuszczone. Wektory: sekcja `moveRefused` (1320 przypadków, z tego 60 bez zagrożeń, 347 safe-to, 804 nieograniczone, 59 odmowa, 50 dopuszczone, 100+ przypadków NaN/Infinity) w `tests/p6_siege_tactics_approach_vectors/vectors.json`, testy `tests/p6_siege_tactics_approach_k1.rs`. Efekt uboczny webowego `_applyTerrainRange` (mutacja `d.range`) jest po stronie wywołującego, nie tej funkcji. Wywołanie z `_doMove` `:8689` BRAK (efekty sceny). |
| 30 | `_siegeRamTowerStep` / `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` / `_siegeSafeApproach` | `battleScene.ts:8022-8106` (`_siegeRamTowerStep` `:8022`, `_trySiegeTowerClimb` `:8056`, `_siegeInfantryToTowerStep` `:8087`), `:8107-8136` (`_siegeSafeApproach`) | `domain/siege_tactics_tower.rs` (K3, r1): `siege_ram_tower_step`, `siege_tower_climb`, `siege_infantry_to_tower_step` = CZĘŚĆ DECYZYJNA trzech funkcji (wartość zwracana, wybór gałęzi, cel marszu przez K1b `bfs_first_step`/`siege_walk_to`, dopisanie wiersza wieży, ustawienie `wallEverBreached` i komunikat WYLOM); `domain/siege_tactics_approach.rs` `siege_safe_approach_goal` (K1) = część decyzyjna `_siegeSafeApproach` | PARTIAL | Wektory K3: `tests/p6_siege_tactics_tower_vectors/vectors.json`, 1560 przypadków **wykonanych z linii pinu** przez `tests/p6_siege_tactics_tower_gen.mts` (Node `--experimental-strip-types`, straznik SHA-256 `cd4b2e51…36`); testy `tests/p6_siege_tactics_tower.rs` (12 testów, zgodność zdarzeń, stanu i rozkładu kategorii z `meta.categories`). Liczniki kategorii (zachowanie pinu): ram true/false 232/288, climb true/false 314/206, infantry true/false 323/197; zdarzenia: move 337, schedule 161, done 822, addRow 73, attackGate 36, advance 11 (z `then_arrive` = callback `arrive` wiezy: 5; `advance:arrive` w `meta.categories`); breach:first 279; log:wylom 279; nan:moveLeft 59 (tylko wejście na mur). **Odmowa bramki (`gate:refused`) = 0: strukturalnie niedostępna** w tych trzech funkcjach (patrz modul); pokryta w K1/K1b. POWÓD PARTIAL — co pozostaje NIE PORTOWANE: (a) klasyfikatory wejścia `isSiegeUnit`/`isSiegeTower`/`_isRam`/`canShoot` są już PORTED jako czyste funkcje w `siege_tactics_classify.rs` (wiersze 27-28, KLASY-Q1), więc NIE są brakiem; pozostaje tylko wiązanie: flagi w `TowerUnit` (`siege_tactics_tower.rs:69-77`) nadal podawane przez wywołującego; (b) efekty sceny jawne, nie portowane: `_doMove` poza bramką (koszt `_moveCostForUnit` jako wejście, animacja, facing, `busy`), `_schedule` (kolejka timerów), `_attackGate`, `_advanceToward` (zdarzenie `AdvanceToward` bez `done`; flaga `then_arrive` niesie callback `arrive` wiezy: wolajacy po dojsciu wykonuje `arrive` = dopisz `ru.r` do `towerAtWallRows`, gdy `ru.q >= wallBase`, potem `done`; K3 r2, zarzut 1 FC r1), `cellToWorld`; (c) `_siegeShooterThreats` jako wejście jawne (wiersz 29); (d) `_siegeSafeApproach` (K1) bez zmian. NIE_ZMIERZONO: pokrycie linii pinu (nie mierzono V8 coverage); liczniki gałęzi to kategorie wyprowadzone z wyjść pinu. Ograniczenie wykonania: NaN `moveLeft` w marszu zapętla się w pinie (ruch bez końca), więc marsz testowany wyłącznie dla skończonych `moveLeft`. Nieprzetestowane: `Infinity` jako `moveLeft` (generator losuje tylko skończone wartości; zapis JSON nie koduje Inf). Pokrycie gałęzi = kategorie wyjść, nie V8 coverage (NIE_ZMIERZONO). |
| 31 | Moduły oblężnicze spoza pętli: `siegeWall.ts` (`buildWallTower :1104`, `buildSiegeWall :1190`, `attachRowBreachPanels :1245`), `siegeAi.ts`, `mapSiegeDetect.ts` | `gra/src/battle/siegeWall.ts` (1273 linii), `gra/src/game/siegeAi.ts` (292), `gra/src/game/mapSiegeDetect.ts` (95) | brak | BRAK / poza zakresem | `battleScene.ts` importuje z `siegeWall.ts` wyłącznie funkcje renderu (`:137`); `siegeAi.ts` NIE jest importowany przez `battleScene.ts` (ustalenie r3: `git show 07d2fbd72:gra/src/battle/battleScene.ts \| grep -n siegeAi` → 0 trafień). Importerzy `siegeAi.ts` na pinie: `gra/src/main.ts:541`, `gra/src/game/ai.ts:27`. Szczegóły wiersza AI: 34.x. |
| 32.1 | `_compactAttackAllowsStep` | `battleScene.ts:8139-8174` | brak | BRAK (M) | Doktryna zwarcia; gałęzie `isSiegeUnit` (`:8140`, `:8157`) → wiersz 27. Predykat `isSiegeUnit` dostępny jako `siege_tactics_classify::is_siege_unit` (KLASY-Q1); sama gałąź doktryny nie portowana. |
| 32.2 | `_rangedFiringStepStaysBehindMelee` | `battleScene.ts:8175-8190` | brak | BRAK (M) | Strzelcy za piechotą; `isSiegeUnit` `:8179` (wiersz 27); predykat dostępny jako `siege_tactics_classify::is_siege_unit` (KLASY-Q1). |
| 32.3 | `_shouldAvoidAutoBacktrack` | `battleScene.ts:8191-8197` | brak | BRAK (G) | Anty-cofanie AUTO; bez logiki muru. |
| 32.4 | `_advanceStep` | `battleScene.ts:8198-8290` | brak | BRAK (G) | Krok marszu po BFS; komentarze „wall" (`:8255`) dotyczą terenu, nie oblężenia. |
| 32.5 | `_enemiesOf` | `battleScene.ts:8291-8295` | brak | BRAK (G) | Filtr wrogów. |
| 32.6 | `_nearestEnemy` | `battleScene.ts:8296-8314` | brak | BRAK (G) | Najbliższy wróg. |
| 32.7 | `_nearestEnemyMelee` | `battleScene.ts:8315-8333` | brak | BRAK (G) | Najbliższy wróg w zwarciu. |
| 32.8 | `_updateFacing` | `battleScene.ts:8334-8360` | brak | BRAK (G) | Zwrot jednostki. |
| 32.9 | `_meleeBlockedByWall` | `battleScene.ts:8361-8372` | brak | BRAK (O) | = wiersz 20. |
| 32.10 | `_targetInRange` | `battleScene.ts:8373-8412` | brak | BRAK (M) | Zasięg; bramka R2 `_meleeBlockedByWall` `:8389`, `canShoot` `:8376`. |
| 32.11 | `_stepToward` | `battleScene.ts:8413-8435` | brak | BRAK (G) | Krok ku celowi. |
| 32.12 | `_canAttackFrom` | `battleScene.ts:8436-8453` | brak | BRAK (M) | Bramka R2 `:8439`. |
| 32.13 | `_makeCanAttackFromTest` | `battleScene.ts:8454-8486` | brak | BRAK (M) | Filtr wrogów przez `_meleeBlockedByWall` `:8456`. |
| 32.14 | `_canStrikeTargetFrom` | `battleScene.ts:8487-8508` | brak | BRAK (M) | Bramka R2 `:8490`. |
| 32.15 | `_firstStepTowardDirectedAttack` | `battleScene.ts:8509-8564` | brak | BRAK (G) | Pierwszy krok do ataku kierowanego; „wall body" `:8534` = teren `Wall`, nie mur oblężniczy. |
| 32.16 | `_firstStepAlongPathToAttack` | `battleScene.ts:8565-8633` | brak | BRAK (M) | SIEGE v2 `:8595-8603`: podejście do podstawy muru (`wallCol-1`) i atak `onWallWalkway`. |
| 32.17 | `_firstStepTowardMelee` | `battleScene.ts:8634-8684` | brak | BRAK (G) | Pierwszy krok do zwarcia. |
| 32.18 | `_doMove` | `battleScene.ts:8685-8786` | `domain/siege_tactics_walk.rs` `do_move_gate` (K1b, r1) | PARTIAL (M) | PORTED: bramka odmowy `:8689-8693` (`siegeWallCol >= 0 && _siegeMoveRefused`, wiersz 29) z kontraktem `moveLeft = 0`. BRAK (efekty sceny, poza zakresem czystego portu): przeniesienie w `occByKey`, koszt wejścia `_moveCostForUnit` i bród (`BROD_RUCH_MULT`), `_updateFacing`, `intent.steps`, animacja `tileTopY`/`cellToWorld`, `busy`, `_autoBatchPlanning`. Wejście: `WalkWorld::do_move` w scenie. |
| 32.19 | `_doAttack` | `battleScene.ts:8787-8808` | brak | BRAK (G) | Dyspozytor ataku. |
| 32.20 | `_singleBlow` | `battleScene.ts:8809-9018` | `domain/siege_tactics_blow.rs` `single_blow` (K5I r1 + K5I-2 r1: `hitPct`, `roll`, `extraMorale`, `engaged_add`); `domain/siege_tactics_blow_inputs.rs` (K5I-2 r1: `flank_rear_defense_penalty`, `terrain_river_attack_multiplier`, `field_fortify_defense_bonus`) | PARTIAL (K5I-2, r1) — rdzeń ciosu i wektory z pinu (626 przypadków) zgodne; NIE PORTOWANE: `toCombatUnit` (`:1355`), `relativeHit` (`:385`), mnożniki wejść (civ/teren/rzeka-kafel/brod/brzeg/mur `wallDefenseMult` `:8824-8856`, `civWallDefenseMultiplier` `:8945-8948`, kontra), `rangedDamageMultFor` w module wejść, złożenie `BlowInput` z pinu `:8880-8956`. | K5I-2 r2. |
| 32.21 | `_resolveBlowOutcome` | `battleScene.ts:9019-9078` | `domain/siege_tactics_blow.rs` `resolve_outcome` (K5I r1) | PARTIAL (K5I r1) — rozstrzygnięcie (rout przed zabiciem, zabicie, morale) w wektorach; efekty sceny zwracane jako `SceneEffect`, ich cialo (`_startFade`, `_shakeAlliesOnLoss`, `_boostEnemiesOnBreak`, `_pushClash`, log) BRAK. | K5 (wpięcie). |
| 32.22 | `_defenderCounters` | `battleScene.ts:9079-9095` | brak | BRAK (G) | Kontratak obrońcy. |
| 32.23 | `_doMeleeAttack` | `battleScene.ts:9096-9178` | brak | BRAK (G) | Zwarcie; `_doRangedAttack` (`:9179`) = wiersz 33.x. |
| 33.1 | `_placeSiegeWall` | `battleScene.ts:4075-4157` | brak | BRAK (O) | Ustawienie muru (L3). |
| 33.2 | `_carveWallTiles` | `battleScene.ts:4026-4074` | brak | BRAK (O) | Kafelki muru (`wallTileHp`). |
| 33.3 | `_placeSiegeTowers` | `battleScene.ts:4158-4193` | brak | BRAK (O) | Wieże oblężnicze. |
| 33.4 | `_destroyTowerAtRow` | `battleScene.ts:4194-4207` | brak | BRAK (O) | Zniszczenie wieży. |
| 33.5 | `_fireSiegeTowers` / `_fireOneTower` | `battleScene.ts:4208-4222`, `:4223-4289` | brak | BRAK (O) | Ostrzał z wież. |
| 33.6 | `_buildSiegeInteriorBuildings` | `battleScene.ts:4290-4426` | brak | BRAK (G) | Budynki wnętrza (scena). |
| 33.7 | `_repositionSiegeAttackers` / `_placeSiegeDefenders` | `battleScene.ts:4427-4441`, `:4442-` | brak | BRAK (O) | Rozstawienie stron oblężenia. |
| 33.8 | `_placeUnits` (`siegeMode`) | `battleScene.ts:5276-` | brak | BRAK (M) | Rozstawienie; gałąź `siegeMode`. |
| 33.9 | `_updateStallWatch` | `battleScene.ts:5568-5581` (stała `STALL_TURN_LIMIT` `:1119`) | `domain/siege_tactics_endcheck.rs` `update_stall_watch` + `StallWatchState` (ENDCHECK-Q1) | PORTED | Rdzeń bez `this`: stan (`sig`, `turns`, `stalled`) jako jawne wejście/wyjście; `is_siege` (`siegeWallCol >= 0`) zwraca stan bez zmian; sygnatura `Math.round(hp)|Math.round(morale)|out` porównywana jako napis (JS: NaN równa się sobie w postaci napisu). Wektory: sekcja `stall` (500 sekwencji, 2470 kroków, także NaN/Infinity). NIE PORTOWANO: zbieranie jednostek `[...atk, ...def]` i `this.siegeWallCol` (wejścia wywołującego). |
| 33.10 | rodzina AUTO batch: `_beginAutoBatchTurnFromCurrentState` `:5696`, `_beginAutoBatchPhase` `:5707`, `_snapshotAutoBatchIntents` `:5752`, `_cloneForAutoBatchPlanning` `:5822`, `_disposeAutoBatchPlanningRoster` `:5847`, `_launchAutoBatchResolution` `:5865`, `_resolveAutoBatchAttack` `:5907`, `_resolveAutoBatchMovement` `:5924`, `_finishAutoBatchPhase` `:5961` | `battleScene.ts:5696-` (do `:5961+`) | brak | BRAK (G) | Planowanie i wykonanie tury AUTO (wspólne dla sufitu tur, wiersz 12). Nie czytano treści każdej metody w tej rundzie (klasyfikacja wg nazwy). |
| 33.11 | `_rangedAction` / `_rangedForwardStep` / `_rangedBackStep` / `_rangedTargetInRange` / `_rangedApproachStep` | `battleScene.ts:6656-6775`, `:6776-7009`, `:7010-7040`, `:7041-7256`, `:7257-7309` | brak | BRAK (M) | Strzelcy; gałęzie oblężnicze (`canShoot`, `isSiegeUnit` w `:6793`, `:6868`). Klasyfikacja wg nazwy + wywołań. |
| 33.12 | `_attackGate` | `battleScene.ts:7310-7338` | brak | BRAK (O) | Atak na bramę; treść przeczytana r4: `gateOpen`/`siegeGateCol`, `_siegeStructureDamage`, `gateHp`, przy zerze `_breachGate` (wiersz 16) — O potwierdzone. |
| 33.13 | `_animateRam` / `_sfxRamImpact` / `_isRam` | `battleScene.ts:7339-7365`, `:7366-7401`, `:7402-7458` | brak | BRAK (O/G) | `_isRam` (`:7402`) = rozpoznanie taranu (O); animacja/SFX (G, scena). |
| 33.14 | `_wallBonusProcFor` / `_isWallCrownShooter` | `battleScene.ts:7459-7466`, `:7467-7489` | brak | BRAK (O, wg nazwy) | Bonus muru (`_wallBonusProcFor`, treść przeczytana r4: wywołuje `fortificationDefenseBonusForUnit` z `city-fortification`) — O potwierdzone; strzelec z korony (`_isWallCrownShooter`) treść nie czytana w r4, wg nazwy. Wejście mnożnika w 32.20 (`wallDefenseMult`). |
| 33.15 | `_applyTerrainRange` / `_attackRangeFor` | `battleScene.ts:7490-7504`, `:7522-7529` | brak | BRAK (G) | Zasięg terenu i jednostki. |
| 33.16 | `_siegeStructureDamage` / `_siegeMachineRange` | `battleScene.ts:7505-7521`, `:7530-7539` | brak | BRAK (O) | Obrażenia konstrukcji i zasięg machin. |
| 33.17 | `_attackWallTile` | `battleScene.ts:7540-7637` | brak | BRAK (O) | Atak na kafelek muru; prowadzi do `_breachWallTile` (wiersz 15). |
| 33.18 | `_breachWallTile` | `battleScene.ts:7638-7756` | brak | BRAK (O) | Wiersz 15 (`wallEverBreached`). |
| 33.19 | `_breachGate` | `battleScene.ts:7757-7813` | brak | BRAK (O) | Wiersz 16. |
| 33.20 | `_spawnWallLabel` / `_updateSiegeHud` / `_syncSiegeHudChromeVisibility` | `battleScene.ts:7814-7832`, `:7833-7881`, `:7882-7923` | brak | BRAK (G, UI) | Etykiety i HUD oblężenia — poza silnikiem. |
| 33.21 | `_siegeShooterThreats` | `battleScene.ts:7924-7937` | `siege_tactics_approach::siege_shooter_threats` (K0b, r1) | PORTED (O) | Wejscia jawne: obroncy z `canShoot` i `terrain_range` (zamiast `_applyTerrainRange`), wieze `siegeTowers`, `siegeWallCol`, `towerRange`. Zob. §4 K0b. Zagrożenia strzelców do `_siegeApproachRestricted` (wiersz 19). |
| 33.22 | `_siegeWalkTo` | `battleScene.ts:8006-8021` | `domain/siege_tactics_walk.rs` `walk_decide` / `walk_after_move` / `siege_walk_to` (K1b, r1) | PORTED (rdzeń decyzyjny i pętla jako lista zdarzeń) | Warunki zakończenia (`finished`, `dead`, `fadingOut`, `moveLeft <= 0`, `isGoal`) i wybór kroku PORTED 1:1; kontynuacja po `_doMove` i `_schedule(STEP_GAP_MS)` jako zdarzenie `Schedule`. Efekty sceny NIE są portowane i są jawnym kontraktem `WalkWorld::do_move` (`occByKey`, koszt wejścia, bród, facing, animacja): patrz opis modułu. Wektory: sekcja `siegeWalkTo` (910 przypadków: 710 ogólnych, 200 ukierunkowanych na odmowę, 165 odmów łącznie; przypadki jawne) w `tests/p6_siege_tactics_walk_vectors/vectors.json`, testy `tests/p6_siege_tactics_walk.rs`. |
| 33.23 | `_ffEnterAuto` | `battleScene.ts:3709-` | brak | BRAK (G) | Przejście do trybu AUTO (L5); treść przeczytana r4: `_toggleManualMode` (jeśli RECZNY) + `_kickoffBattleTurn` — G potwierdzone. |
| 33.24 | `_tickProjectiles` / `_tickFades` / `_tickFloatLabels` | `battleScene.ts:9326-9343`, `:9344-9365`, `:9366-9414` | brak | BRAK (G, scena) | Zegar sceny; poza pętlą logiczną (D-OBL-4). |
| 33.25 | `_advanceVClock` / `_scaledWallDelta` | `battleScene.ts:9500-9511`, `:9512-9568` | brak | BRAK (G) | Zegar wirtualny; `wall` = czas ścienny, nie mur. |
| 33.26 | `_renderClashLog` / `_updateMoraleBar` / `_updateArmyMoraleBars` | `battleScene.ts:9569-9651`, `:9652-9694`, `:10097-10152` | brak | BRAK (G, UI) | Log i paski morale. |
| 33.27 | `_gainMorale` / `_applyMoraleDamage` / `_generalMoraleAura` | `battleScene.ts:9695-9719`, `:9722-9760`, `:9720` | brak | BRAK (G) | Morale jednostki; Rust: `combat.rs:254` `morale_factor` to tylko czynnik, nie odpowiednik tych metod. |
| 33.28 | `_checkMeleeScreenLost` / `_checkRout` / `_startRout` | `battleScene.ts:9761-9782`, `:9783-9798`, `:9799-` | brak | BRAK (G) | Rout; `_startRout` (efekt) blokuje wiersz 8 i 11. |
| 33.29 | `_removeCommanderMoraleBonus` / `_disableManualIfCommanderLost` / `_armyCompositionKind` | `battleScene.ts:9993-10006`, `:10007-10041`, `:10042-10071` | brak | BRAK (G, L5 dla manual) | Dowódcy i skład armii. |
| 33.30 | `_sideEndStats` / `_battleSummaryWinner` | `battleScene.ts:10257-10313`, `:10314-10353` | brak | BRAK (G) | Statystyki i zwycięzca do ekranu (wiersz 14). |
| 33.31 | `_resetSiegeForReplay` | `battleScene.ts:10518-10630` | brak | BRAK (O) | Reset stanu oblężenia (replay). |
| 33.32 | `_showEndScreen` / `_showResultBanner` | `battleScene.ts:10666-10738`, `:10739-10781` | brak | BRAK (G, UI) | Efekty końca (wiersz 14/5). |
| 33.33 | `_pickRangedTargetByPriority` / `_unitCanRangedAttack` | `battleScene.ts:17571-`, `:11319-11330` | brak | BRAK (G) | Wybór celu strzelca wg `_priorityScore` i dystansu; treść przeczytana r4 — G potwierdzone. |
| 33.34 | `_doRangedAttack` | `battleScene.ts:9179-9295` | brak | BRAK (M) | Atak dystansowy; gałąź machin (wg nazwy). |
| 33.35 | `_destAllowedByBlockade` / `_performSiegeManualOrder` | `battleScene.ts:17809-17930`, `:18435-` | brak | BRAK (G / O, L5) | Reklasyfikacja r4: `_destAllowedByBlockade` (`:17809`, treść przeczytana) = blokada linii `_generalSettings.blockadeCol`, NIE mur → G; `_performSiegeManualOrder` (`:18435`) treść nie czytana w r4 → O/L5 wg nazwy. |

Podsumowanie L2–L5 (po r3): PORTED: 1, 2, 3, 10, 13, 25, 26 (7); PARTIAL: 6, 12, 27 (3); BRAK: pozostałe z powodem. Każdy wiersz 1–35 ma status i numery linii pinu; **brak wierszy NIE_ZMIERZONO** w zakresie wzorca z §0. Wiersz 32 (dawny „NIE_ZMIERZONO 8139–9096”) rozbity na 32.1–32.23; wiersze 20/21 przeniesione na właściwe miejsce numeracji (r3 zarzut 2c).

Klasyfikacja zbiorcza (zakres §0): O (oblężnicza, BRAK) — 15, 16, 17, 19, 20, 22, 23, 23a, 29, 30, 32.9, 33.1–33.5, 33.7, 33.14, 33.16–33.19, 33.21, 33.22, 33.31, 33.35 (oraz 33.12, 33.13 częściowo); M (mieszana) — 32.1, 32.2, 32.10, 32.12–32.14, 32.16, 32.18, 32.20, 33.8, 33.11, 33.34; G (ogólna/UI, poza oblężeniem) — pozostałe.

Najmniejsze czyste funkcje wejścia (bez zależności od stanu sceny): `attackerWallEntryIsBreach` (23), `autoStormBreach` (23a), `meleeBlockedByWall` (22), `canShoot` (28), `cityFortificationKind` i pochodne (24). `_siegeApproachRestricted` (19) NIE jest czystą funkcją.

## 1a. Uzupełnienie enumeracji (r4, zarzut 1 audytu) — deklaracje wzorca bez wiersza w r3

Dopisane 36 deklaracji z enumeracji §0 (pin `07d2fbd72`), których r3 nie miał w tabeli. Wszystkie BRAK / PARTIAL; żadna nie jest PORTED. Klasyfikacja: „treść r4” = ciało przeczytane w tej rundzie; bez tego znacznika = wg nazwy i liczby trafień słów kluczowych (siege/wall/gate/manual/auto/end/rout) w ciele.

| # | Metoda (pin) | Linie pinu | Rust | Status | Uwagi |
|---|---|---|---|---|---|
| 35.1 | `_syncManualRailHighlight` | `battleScene.ts:3675-3679` | brak | BRAK (G, UI) | Podświetlenie przycisku RECZNY; treść r4. Tylko UI. |
| 35.2 | `_debugRecordSiegeColumns` | `battleScene.ts:4753-4768` | brak | BRAK (G, debug) | Zapis do `window.__siegeColTestDebug`; treść r4. Diagnostyka testów, nie logika. |
| 35.3 | `_applyStartingMoralePowerPenalty` | `battleScene.ts:5597-5630` | brak | BRAK (G) | Kara morale/mocy na starcie przez `toCombatUnit` i `UnitPowerInput`; treść r4. Zależy od modułu mocy (POWER-*), nie od pętli oblężniczej. |
| 35.4 | `_syncRendererSize` | `battleScene.ts:9296-9308` | brak | BRAK (G, UI) | Rozmiar renderera; treść r4. |
| 35.5 | `_renderSideRoster` | `battleScene.ts:10072-10081` | brak | BRAK (G, UI) | Render listy strony; treść r4. |
| 35.6 | `_showBattleStatsOverlay` | `battleScene.ts:10354-10386` | brak | BRAK (G, UI, koniec bitwy) | Overlay statystyk; wg nazwy i trafień `end`. |
| 35.7 | `_toggleBattleStatsOverlay` | `battleScene.ts:10387-10395` | brak | BRAK (G, UI) | Przełącznik overlay; wg nazwy. |
| 35.8 | `_buildEndDetailsSide` | `battleScene.ts:10396-10424` | brak | BRAK (G, UI, koniec bitwy) | Szczegóły końca po stronie; wg nazwy (wiersz 14). |
| 35.9 | `_showEndDetails` | `battleScene.ts:10425-10453` | brak | BRAK (G, UI, koniec bitwy) | Pokaz szczegółów końca; wg nazwy i trafień `end` (wiersz 14). |
| 35.10 | `_hideEndDetails` | `battleScene.ts:10454-10471` | brak | BRAK (G, UI) | Ukrycie szczegółów; wg nazwy. |
| 35.11 | `_hideEndScreen` | `battleScene.ts:10472-10485` | brak | BRAK (G, UI, koniec bitwy) | Ukrycie ekranu końca; wg nazwy i trafień `end` (wiersz 14). |
| 35.12 | `_setBattleChromeForEndScreen` | `battleScene.ts:10631-10665` | brak | BRAK (G, UI) | Chrom ekranu końca; w treści trafia w HUD oblężenia (`siege` x3) → wiersz 33.20 (`_syncSiegeHudChromeVisibility`); treść r4. |
| 35.13 | `_playerWonFromBattleWinner` | `battleScene.ts:12401-12406` | PARTIAL | PARTIAL (G, mapowanie) | Mapuje wynik `atakujacy`/`obronca` (wiersz 13, `battle_winner`) na wygraną gracza przez `_playerControlSide()`; treść r4. Część logiczna = wiersz 13 (PORTED); mapowanie strona→gracz BRAK (UI/sesja). |
| 35.14 | `_appendDeployPriorityBlock` | `battleScene.ts:13054-13115` | brak | BRAK (G, deploy) | Blok priorytetu w popupie rozstawienia; poza zakresem silnika (D-ST-3). |
| 35.15 | `_renderDeployTacticsPopup` | `battleScene.ts:13116-13195` | brak | BRAK (G, deploy UI) | Popup taktyki rozstawienia; D-ST-3. |
| 35.16 | `_renderDeployStrategyPopup` | `battleScene.ts:13196-13425` | brak | BRAK (G, deploy UI) | Popup strategii rozstawienia; D-ST-3. |
| 35.17 | `_renderDeployLinesPopup` | `battleScene.ts:13426-13484` | brak | BRAK (G, deploy UI) | Popup linii rozstawienia; D-ST-3. |
| 35.18 | `_syncSiegeHudLayout` | `battleScene.ts:13851-13870` | brak | BRAK (G, UI oblężenie) | Układ panelu HUD oblężenia (`layoutSiegeHud1E`); treść r4. Nie logika muru. |
| 35.19 | `_autoGroupDeployByKind` | `battleScene.ts:13929-13948` | brak | BRAK (G, deploy) | Auto-grupowanie rozstawienia; D-ST-3. |
| 35.20 | `_deployRowKind` | `battleScene.ts:14542-14546` | brak | BRAK (G, deploy) | Rodzaj wiersza rozstawienia; D-ST-3. |
| 35.21 | `_selectDeployByKind` | `battleScene.ts:15449-15456` | brak | BRAK (G, deploy) | Zaznaczenie wg rodzaju; D-ST-3. |
| 35.22 | `_selectDeployByKindToggle` | `battleScene.ts:15457-15468` | brak | BRAK (G, deploy) | Przełącznik zaznaczenia; D-ST-3. |
| 35.23 | `_isDeploySelectionExactlyKind` | `battleScene.ts:15550-15558` | brak | BRAK (G, deploy) | Predykat zaznaczenia; D-ST-3. |
| 35.24 | `_appendDeployCellOutline` | `battleScene.ts:16160-16190` | brak | BRAK (G, deploy UI) | Kontur komórki rozstawienia; D-ST-3. |
| 35.25 | `_deployRoleOf` | `battleScene.ts:16287-16296` | brak | BRAK (G, deploy) | Rola jednostki do rozstawienia (`siege` x2 — rozpoznanie machin, nie mechanika); wg nazwy. |
| 35.26 | `_placeUnitsOneSide` | `battleScene.ts:17082-17283` | brak | BRAK (M) | Rozstawienie jednej strony; gałąź `siegeWallCol` (14 trafień `siege`) → powiązane z 33.8 (`_placeUnits`, siegeMode); wg nazwy i trafień. |
| 35.27 | `_placeUnitsAtkOnly` | `battleScene.ts:17284-17291` | brak | BRAK (M) | Rozstawienie samej strony atakującej; wg nazwy. |
| 35.28 | `_endDeployPhase` | `battleScene.ts:17292-17332` | brak | BRAK (M) | Koniec fazy rozstawiania: `formationRank` względem `siegeWallCol` (gałąź oblężnicza), snapshot grup, `_startBattle`; treść r4. Sekwencja startu bitwy, nie pętla tur. |
| 35.29 | `_haltAutoBattleTurn` | `battleScene.ts:17333-17347` | brak | BRAK (M, L5/AUTO) | Przerwanie tury AUTO (token `_autoBatchToken`, `_autoBatchPhase`, `_autoBattleSuspended`); treść r4. Stan tury → wejście K5/K6. |
| 35.30 | `_toggleManualMode` | `battleScene.ts:17348-17447` | brak | BRAK (M, L5) | Przełączenie RECZNY/AUTO; treść częściowo r4 (`gateOpen`/`siegeGateCol` w 1 gałęzi, `_disableManualIfCommanderLost`). Klocek L5 = K6. |
| 35.31 | `_doBoxSelect` | `battleScene.ts:17448-17480` | brak | BRAK (G, UI) | Zaznaczenie prostokątem; wg nazwy i trafień `manual`/`auto`. |
| 35.32 | `_groupHasRanged` | `battleScene.ts:17800-17808` | brak | BRAK (G) | Czy grupa ma strzelców; wg nazwy (0 trafień słów oblężniczych). |
| 35.33 | `_removeGroupFrameMarker` | `battleScene.ts:19934-19949` | brak | BRAK (G, UI) | Znacznik ramki grupy; wg nazwy. |
| 35.34 | `_updateGroupFrameMarker` | `battleScene.ts:19950-19996` | brak | BRAK (G, UI) | Znacznik ramki grupy; wg nazwy. |
| 35.35 | `_syncAllGroupFrameMarkers` | `battleScene.ts:19997-20007` | brak | BRAK (G, UI) | Synchronizacja znaczników; wg nazwy. |
| 35.36 | `_selectBattleByKindToggle` | `battleScene.ts:20221-20240` | brak | BRAK (G, UI) | Przełącznik wyboru wg rodzaju; wg nazwy. |

Podsumowanie 1a: 36 wierszy; PARTIAL 1 (35.13); BRAK 35; PORTED 0.

## 1b. Uzupełnienie enumeracji (r5, zarzut 1 FC r4) — 3 deklaracje doctrine bez wiersza w r4

Dopisane 3 deklaracje z enumeracji §0 (pin `07d2fbd72`), których r4 nie miał w tabeli (wynik porównania nazwa-po-nazwie: `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/01-operator-r5.md`). Klasyfikacja wg treści przeczytanej w tej rundzie. Rust: `grep -rniE 'doctrin|doktryn' rust-port/engine/src` → 0 trafień (brak modelu doktryn grupy).

| # | Metoda (pin) | Linie pinu | Rust | Status | Uwagi |
|---|---|---|---|---|---|
| 36.1 | `_isUnitDoctrineAuto(ru)` | `battleScene.ts:17621-17630` | brak | BRAK (G) | Czy jednostka idzie w AUTO wg doktryny: `_getEffectiveDoctrine` (`manual` → false), `ru.unitDoctrine`, `_groupMeta.autoPlay`. Treść (przeczytana w całości w obronie r5): nie zawiera gałęzi muru ani oblężniczej. Zależy od `_getEffectiveDoctrine` i `_groupMeta` (stan grup, poza zakresem). |
| 36.2 | `_doctrineLabel(d)` | `battleScene.ts:17698-17704` | brak | BRAK (G, UI) | Etykieta doktryny (`defensive`→OBRONA, `steady`→ATAK, `aggressive`→SZTURM, `skirmish`→OSTRZAL, inaczej RECZNIE). Czysta funkcja nad `GroupDoctrine`, ale wyłącznie UI; poza pętlą taktyczną. |
| 36.3 | `_doctrineMoveDest(ru, meta)` | `battleScene.ts:17931-17963` | brak | BRAK (M) | Cel ruchu wg doktryny: `skirmish` (strzelec → null), `defensive` → null, `steady` (`_attackFormationRallyPoint`, `_moveTargetForUnit`), `aggressive` (`_chargeMoveDest`), `rallyCol/rallyRow`, fallback `_pickTargetByPriority`; każda gałąź przechodzi przez `_destAllowedByBlockade` (blokada, gałąź oblężnicza pośrednia). Zależy od kilku metod spoza tabeli (wiersze 32.x/33.x zakresu) i od `GroupMeta`. |

Podsumowanie 1b: 3 wiersze; BRAK 3 (2 × G, 1 × M, PORTED 0). Rust nie ma żadnego z nich.

## 1c. Uzupełnienie enumeracji (r5, kontrola nazwa-po-nazwie) — 6 deklaracji wzorca bez wiersza

Porównanie programowe (`01-operator-r5.md`) wykazało 6 deklaracji z listy wzorca (§0, 140 linii grepu = 138 metod + 2 × `tri`) występujących tylko w prozie §0, bez wiersza w tabeli. Dopisane w r5. Ciała wszystkich 6 przeczytane w całości w obronie r5 (klasyfikacje bez zmian; 37.4 = predykat trybu, M/L5). Rust: brak (0 trafień nazw w `rust-port/engine/src`). Wszystkie BRAK; żadna nie jest PORTED.

| # | Metoda (pin) | Linie pinu | Rust | Status | Uwagi |
|---|---|---|---|---|---|
| 37.1 | `_tickZoom()` | `battleScene.ts:10782-10790` | brak | BRAK (G, kamera) | Wygładzanie zoomu kamery (`camDist`). Nie mechanika. |
| 37.2 | `_tickCameraPanKeys()` | `battleScene.ts:10847-10863` | brak | BRAK (G, kamera) | Przesuwanie kamery klawiszami (`_camPanKeys`). Nie mechanika. |
| 37.3 | `_sfxRout()` | `battleScene.ts:11134-11150` | brak | BRAK (G, audio) | Dźwięk rozbicia/ucieczki (Web Audio, `_sfxOff`). Efekt dźwiękowy, nie logika routu (logika routu = wiersz 33.x `_startRout`). |
| 37.4 | `_isManualInputActive()` | `battleScene.ts:11304-11309` | brak | BRAK (M, L5) | Predykat: `deployPhase` lub (`started && !finished && (_manualMode \|\| _battleAwaitingOrders)`). Stan trybu RECZNY = L5, zależy od wiersza 21 i K6. |
| 37.5 | `_pickGroundTile(cx, cy)` | `battleScene.ts:11331-11348` | brak | BRAK (G, UI) | Wybór kafla przez raycast (`pickBattleGroundTileFromMeshes` / `pickBattleGroundTilePlane`). Wejście UI, nie mechanika. |
| 37.6 | `_drawMinimap()` | `battleScene.ts:11961-11966` | brak | BRAK (G, UI) | Rysowanie minimapy (`drawBattleMinimap`). Tylko UI. |

Podsumowanie 1c: 6 wierszy; BRAK 6; PORTED 0.

## 1d. Uzupełnienie enumeracji (r5, obrona na zarzut 1 — `static` i pola-funkcje strzałkowe) — 3 deklaracje

Dopisane w obronie r5: poprzedni wzorzec §0 (`^  (private |public |protected )?(async )?[A-Za-z_]\w*\(`) nie łapał metody `static` ani pól-funkcji `= (...) =>`. Wynik nazwa-po-nazwie: `02a-obrona.md`. Rust: brak (`grep -rn 'threat_slack\|ThreatSlack\|on_resize\|on_key_manual' rust-port/engine/src` → 0 trafień).

| # | Metoda (pin) | Linie pinu | Rust | Status | Uwagi |
|---|---|---|---|---|---|
| 38.1 | `_threatSlack(threats, col, row)` (`private static`) | `battleScene.ts:7939-7943` | `siege_tactics_approach::threat_slack` (K0b, r1) | PORTED (O) | CZYSTA funkcja: `min_t(\|col−t.q\| + \|row−t.r\| − t.range)`, bez `this` i bez stanu; pusta lista → `Infinity`. Wołana z `_siegeMoveRefused` (`:7967`, `:7969`; wiersz 29) i `_siegeSafeApproach` (`:8109`; wiersz 30). Wejście: lista zagrożeń `{q,r,range}` z `_siegeShooterThreats` (wiersz 33.21). Kandydat K0b (§4). |
| 38.2 | `_onResize` (pole-funkcja, `= (): void => {...}`) | `battleScene.ts:12386` | brak | BRAK (G, UI) | Jedna linia: `_syncRendererSize()`. Zmiana rozmiaru renderera; nie mechanika. Trafienie wzorca wyłącznie przez treść (`Renderer` zawiera `end`). |
| 38.3 | `_onKeyManual` (pole-funkcja) | `battleScene.ts:17406-17420` | brak | BRAK (M, L5) | Klawisz R → `_toggleManualMode()` (przełącznik RECZNE/AUTO, wiersz 21 / K6); Esc anuluje atak-marsz; strażnik `deployPhase \|\| !started \|\| finished`. Obsługa wejścia UI, zależy od stanu trybu L5. |

Podsumowanie 1d: 3 wiersze; BRAK 3 (38.1 O, 38.2 G, 38.3 M); PORTED 0.

## 2. Tabela pokrycia — SIEGE-NEARBY-STAN L9–L10

| # | Element | Linie pinu | Rust | Status | Powód |
|---|---|---|---|---|---|
| L9 | `commitBesiege` / `startMapSiege` / `siegeArmyGroupId` | `main.ts` (web) | brak (pole `oblega_city_id`: `domain/siege_sortie.rs:68`, `domain/recruitment.rs:430`) | BRAK (UI) | Warstwa UI/mapy, D-OBL-5. |
| L10 | `inheritSiegeOnJoin` (dołączanie do armii oblegającej poza miastem) | `armyMerge.ts` (web) | brak (`domain/siege_enter_city.rs` tylko wejście po kapitulacji) | BRAK | Wymaga warstwy stanu gry (D-OBL-5). |

Dla L6–L8 (`besiegeArmyGroups`, `besiegeLockTargets`, `stackGroupIdOf`) status PORTED jest w `domain/siege_nearby_lock.rs:38,55,76` (poprzedni temat, poza tą rundą).

## 3. Port w r1 (klocek K0) — bez zmian w r3

* Moduł: `rust-port/engine/src/domain/siege_tactics_end.rs` (nowy), rejestracja `domain/mod.rs` (`pub mod siege_tactics_end;`).
* Funkcje: `siege_no_breach_repels_attack` (pin `:10184-10186`), `battle_winner` (pin `:10208-10220`), enum `BattleSide`.
* Wektory: generator `rust-port/engine/tests/p6_siege_tactics_gen.mjs` (Node 22, wycięte fragmenty JS bez typów TS, bez `this.`); wynik `rust-port/engine/tests/p6_siege_tactics_vectors/vectors.json` (4 + 432 przypadki, seed 217).
* Testy: `rust-port/engine/tests/p6_siege_tactics_end.rs` (8 testów po r2).
* ZAŁOŻENIE Z-ST-1: wycięta funkcja JS jest kopią 1:1 logiki pinu, a NIE wynikiem uruchomienia bundla weba (`battleScene.ts` ciągnie cały DOM/Three.js). Wektory dowodzą równoważności wycinka, nie całej sceny.
* ZAŁOŻENIE Z-ST-2: `battle_winner` przyjmuje już policzone flagi `alive` (web `!dead && !fadingOut && !routed`); ich wyliczenie to wiersz 7 (BRAK).

## 4. Plan kolejnych klocków (kolejność i zależności)

| Krok | Klocek | Pin | Zależy od | Uwagi |
|---|---|---|---|---|
| K0a | `attacker_wall_entry_is_breach(side_atk, on_walkway)` + `melee_blocked_by_wall(ctx)` + `auto_storm_breach(has_machine)` (wiersze 22, 23, 23a) | `city-fortification.ts:76-79, 86-88, 96-98` | wiersze 15–17 jako `bool` | Trzy czyste funkcje, zerowe zależności (zarzut 2). Wektory z pinu jak K0. Zalecane przed K1. Zmiana r3: dodano 23a. |
| K0b | `threat_slack(threats, col, row)` (`static`, wiersz 38.1) | `battleScene.ts:7939-7943` | brak zależności od stanu sceny; wejście = lista `{q,r,range}` jako dane | Czysta funkcja bez `this` (zarzut 1 obrony r5: najmniejszy czysty klocek tej pętli, obok K0a). Pusta lista → `Infinity` (typ wyniku do ustalenia w porcie). Wektory z pinu jak K0. Wejście do K2 (wiersze 29/30 wołają `threat_slack`). PORTED (K0b, r1): `threat_slack`, `siege_shooter_threats`, `siege_approach_restricted` (wiersz 19, galezie a-e); wektory `rust-port/engine/tests/p6_siege_tactics_approach_vectors/`, test `p6_siege_tactics_approach`. |
| K1 | `stall_pat_loser(ratio_a, ratio_d) -> BattleSide` (gałąź PAT bez oblężenia) + rdzeń `_updateStallWatch` | `:10178-10182`, `:5568-5581` | Z-NB-3 (ratio policzone wejściem); flaga `_stalled` z `_updateStallWatch` (`:5568`, wiersz 33.9) jako `bool` | **ZREALIZOWANE w R-RUSTPORT-P6-SIEGE-TAKTYKA-ENDCHECK-Q1 (runda 1, Operator)**: `stall_pat_loser` i `update_stall_watch` PORTED (wiersze 9, 33.9); wektory 300 PAT + 500 sekwencji watchdoga z wykonania pinu. |
| K2 | `siege_approach_restricted_*`: Rozbicie wiersza 19 na wejścia (a)–(e) zrobione w K0b (PORTED); K2 zostaje jako ewentualny czysty predykat dla gałęzi (d) `mounted` i (e) piesi, tylko jeśli K3 go wymaga | `:7951-7962` | wiersze 15–17, 19 (a)–(e) jako `bool`/liczby | Poprawiony opis (zarzut 1): NIE jest 2×2 bool. Wektory obejmują każdą gałąź (a)–(e) osobno. |
| K3 | `end_check_order(...)`: złożenie kroków 10172 (stall) → 10184 → 10189 → 10197 → 10208 w jedną funkcję czystą. **Wymóg z zarzutu 3:** `siege_no_breach_repels_attack` stosować WYŁĄCZNIE wewnątrz `_stalled && alive_a && alive_d`; test K3 musi mieć przypadek `stalled=false` bez zmiany wyniku | `:10172-10220` | K0a, K1, K2, `round_cap_verdict`, `battle_winner`, wiersz 8 jako liczby | **ZREALIZOWANE w ENDCHECK-Q1 (runda 1)**: `end_check_order` w `siege_tactics_endcheck.rs`; wymóg bramki spełniony (test `oblezenie_bez_stall_nie_odpiera_szturmu`, przypadki `stalled=false` w wektorach). Zob. status tematu niżej. |
| K4 | Automat wyłomu (`wallEverBreached`: cztery miejsca zapisu `:3721, :7647, :7759, :8073`; źródła wg funkcji `:3715, :7638, :7757, :8056`) | `:3721, :7647, :7759, :8073` | model muru/bramy (L3) | **Rozstrzygnięte (r2):** L3 w `domain/` jako czyste przejścia `WallState -> WallState` w `siege_tactics_breach.rs` (stan jawny, wołane przez warstwę pętli K5). Wynik zasila `to_approach_state()` (`siege_approach_restricted`) i `wall_ever_breached` (`siege_no_breach_repels_attack`, `battle_winner`). Wektory: `p6_siege_tactics_breach_vectors/` (1180 pojedynczych przypadków + 90 sekwencji / 721 kroków, straznik SHA-256 `17ba1ab6…`) generowane przez WYKONANIE fragmentów pinu (r2). Reset przy replayu (`:10520-10529`) i wpięcie do pętli: BRAK (K5). |
| K5 | Pętla tur taktycznych (`_runFastForward` + wpięcie K3) | `:9415-9437`, `:10153` | D-OBL-4: warstwa pętli tur | Najwyższe ryzyko; osobna autoryzacja właściciela (ABC). |
| K5g0 | `resolveAutoBatchPhase` (`autoBatchPhase.ts:64-190`, pin `07d2fbd72`) | `gra/src/battle/autoBatchPhase.ts` | `domain/siege_tactics_autophase.rs` `resolve_auto_batch_phase` (K5g0, r1) | PORTED (K5g0, r1) — czysta funkcja: migawka zajętości, bariera zajętego kafelka, rezerwacja ścieżek, cele z migawki, ostatni zamiar wygrywa. Wektory: `tests/p6_siege_tactics_autophase_vectors/vectors.json` (2914 przypadków, wykonanie pliku pinu przez `p6_siege_tactics_autophase_gen.mjs`, SHA-256 `eb6f7d55…`); test `tests/p6_siege_tactics_autophase.rs`. NIE portowano: klonowanie roster, animacja, `_launchAutoBatchResolution`, `_finishAutoBatchPhase`, token `_autoBatchToken`, wpięcie do pętli tur (K5g/K5). Zależności K5g: K5g0, K5e, K5f. |
| K6 | Bitwa ręczna / „Pomiń" (L5) | `:3572`, `:3718` | K5 | Poza zakresem engine do czasu K5. |
| K7 | AI stanowiska oblężenia (`decideAISiegeStance` + estymatory, wiersze 34.x) — POZA pętlą L2–L5, nie wchodzi w łańcuch K1–K6 | `gra/src/game/siegeAi.ts:81-292`, wpięcie `main.ts:18053` i `main.ts:18135` | konfiguracja `SiegeAi` (`rust-port/engine/src/data/units_combat.rs:260`, już jest), typy `SiegeUnit`/`SiegeCity` | Osobny temat, nie blokuje K1–K6. Zob. §6. |

**Status tematu `R-RUSTPORT-P6-SIEGE-TAKTYKA-ENDCHECK-Q1` (runda 1, Operator; realizuje plan-K1 + plan-K3 oraz `_updateStallWatch`, wiersze 9, 33.9):** PORTED: `stall_pat_loser`, `update_stall_watch` (rdzeń bez `this`), `end_check_order` (złożenie `_checkEnd` bez efektów sceny). Bramki: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib` (48), `p6_siege_tactics_end` (8), `p6_siege_tactics_approach` (5), `p6_siege_tactics_walk` (7), nowy `p6_siege_tactics_endcheck` (9). Zmiana API: `siege_tactics_end.rs` bez zmian. Nowe pliki: `domain/siege_tactics_endcheck.rs`, `tests/p6_siege_tactics_endcheck*`. Otwarte (NIE_ZMIERZONO w tej rundzie): integracja `_checkEnd` z pętlą tur (K5, osobna autoryzacja); logi i `_startRout` pozostają po stronie sceny; wpływ `_startRout` na `ratio_*_at_cap` sprawdzony tylko przez wykonanie pinu ze stubem rozbicia.

**Status tematu `R-RUSTPORT-P6-SIEGE-TAKTYKA-K5D-Q1` (runda 1, Operator Haiku 5.5; klocek K5d: sufit tur i licznik `roundNo`):** PORTED: `siege_tactics_roundcap.rs` (`RoundCapState`, `cap_gate` = bramka `_checkEnd` `:10199-10206`, `ff_cap_step` = `_runFastForward` `:9424` + `_ffRoundCapResult` `:9485-9497`, `begin_turn` = `_beginTurn` `:5635-5636`). Werdykt przez istniejące `round_cap_verdict` (`siege_no_breach.rs`). Wektory: `p6_siege_tactics_roundcap_vectors/vectors.json` (gate 600, beginTurn 400, ff 500; generator `p6_siege_tactics_roundcap_gen.mjs`, straznik SHA-256 `c57676d0…`, pin `07d2fbd72`). Poza zakresem (K5c/K5f/K5j): blok stall `:10172-10188`, reszta `_checkEnd` `:10208-10240`, efekty sceny, petla tur. Otwarte: brak wpięcia do pętli (K5).

**Status tematu `R-RUSTPORT-P6-SIEGE-TAKTYKA-K1-Q1` (wiersze 29–30, runda 1, Operator; etykieta „K1-Q1” NIE oznacza klocka K1 z tabeli klocków):** wiersz 29 PORTED; wiersz 30 PARTIAL (część decyzyjna `_siegeSafeApproach` PORTED, marsz `_siegeWalkTo` + `_bfsFirstStep` + `_doMove` + `_schedule` BRAK). Kryterium (1) dispatchu dla wiersza 30 NIESPEŁNIONE do decyzji właściciela (A: zaakceptować PARTIAL, B: K1b). Klocek K1 z tabeli klocków (stall PAT, `_checkEnd`, wiersz 9) jest odrębnym, niezrealizowanym klockiem.

Zależności: K0a → K3; K1 → K3; K2 → K3; K4 → K2; K3 + K4 → K5 → K6. Kolejność K0a → K1 → K2 → K3 bez zmian względem r2. L9–L10 (SIEGE-NEARBY, UI) poza tą listą (D-OBL-5). K7 niezależny.

## 5. Otwarte

* D-ST-1: pin `07d2fbd72` vs baza `258afaf8f` — funkcje oblężenia w `battleScene.ts` nie były porównywane na poziomie diffu między pinem a `origin/main`; NIE_ZMIERZONO.
* D-ST-2: plik `rust-port/engine/Cargo.lock` powstał lokalnie przy `cargo` (untracked) i NIE jest częścią commita.
* D-ST-3 (zakres): deklaracje `battleScene.ts` spoza wzorca §0 (deploy, kamera, pasek minimapy, `_drawMinimap` `:11961`, `_renderDeploy*`, `_pickGroundTile`, `_tickCameraPanKeys`, `_tickZoom`, `_sfxRout`, `_isManualInputActive`) NIE są enumerowane w tabeli; traktowane jako poza zakresem silnika (UI/wejście). Nie twierdzi się dla nich pokrycia. Obrona r5: `static` i pola-funkcje strzałkowe są objęte wzorcem (§0) i mają wiersze 38.1–38.3; konstanty `static readonly` i pola nie-funkcyjne (typy, liczby) pozostają poza enumeracją.
* D-ST-4 (r4): treść przeczytana dla 33.12, 33.14 (`_wallBonusProcFor`), 33.23, 33.33, 33.35 (`_destAllowedByBlockade`) — klasyfikacje zaktualizowane powyżej. Nadal wg nazw i wywołań: 33.10 (rodzina AUTO batch, ~260 linii), 33.13 (`_animateRam`/`_sfxRamImpact`/`_isRam`), 33.14 (`_isWallCrownShooter`), 33.35 (`_performSiegeManualOrder`), oraz wszystkie wiersze 35.x (klasyfikacja wg nazwy i liczby trafień słów kluczowych, bez czytania ciał). Rozstrzygnięcie treści — przy klockach K4/K5.

## 6. Handoff UNITS-do-SILNIK_AI-siege-3poziomy.md (wiersze 34.x)

Plik `dyspozycje/_handoff/UNITS-do-SILNIK_AI-siege-3poziomy.md` (146 linii) przeczytany w r3. Jego status „CZEKA wpięcie w `main.ts`” jest **NIEAKTUALNY na pinie `07d2fbd72`**: `gra/src/main.ts:541` importuje `decideAISiegeStance`, `EMPTY_SIEGE_AI_STATE`, `estimateUnitCombatStrength`, `SiegeAiState`; `main.ts:2249-2252` trzyma mapę stanu `siegeAiStateByKey`; `main.ts:18053` wywołuje `decideAISiegeStance(siegeArmy, siegeCity, persisted)` (odczyt `persisted` w `:18052`); drugie wywołanie `main.ts:18135` (ścieżka z `collectSiegeAtkRoster`, bez `siegeAiStateByKey`). Handoff: „CZEKA wpięcie” = stan sprzed wpięcia; wpięcie jest na pinie.

| # | Funkcja (`siegeAi.ts`, pin) | Linie | Rust | Status | Uwagi |
|---|---|---|---|---|---|
| 34.1 | `decideAISiegeStance(army, city, state, params)` | `siegeAi.ts:209-284` | brak (grep `decide_ai_siege` / `siege_stance` pusty) | BRAK | Wpięte w `main.ts:18053` oraz `main.ts:18135`. Progi T1/T2/T3 z `SiegeAi` (config). |
| 34.2 | `evaluateSiegeAiAction` (alias zwracający stance) | `siegeAi.ts:285-292` | brak | BRAK | Alias 34.1. |
| 34.3 | `estimateUnitCombatStrength(unit)` | `siegeAi.ts:81-91` | brak | BRAK | Import `ai.ts:27` i `main.ts:541`. |
| 34.4 | `estimateArmyStrength(units)` | `siegeAi.ts:92-102` | brak | BRAK | Zależy od 34.3. |
| 34.5 | `estimateDefenderStrength(units, city)` | `siegeAi.ts:103-117` | brak | BRAK | Garnizon + milicja + bonus muru/terenu (wg handoffu). |
| 34.6 | `siegeStrengthRatio(army, defender)` | `siegeAi.ts:118-130` | brak | BRAK | Stosunek sił → tier. |
| 34.7 | Konfiguracja `siegeAiCfg` (`t1_assault_ratio`, `t2_build_min_ratio`, `t3_starve_min_ratio`, `t2_max_wait_turns`, `units_per_extra_machine`) | `siegeAi.ts:24-52`, `DEFAULT_SIEGE_AI_PARAMS` `:63` | `rust-port/engine/src/data/units_combat.rs:260` `pub struct SiegeAi` (dane) | PARTIAL | Struktura danych jest; logika progów i stałe domyślne nie są w Rust. |

Klocek K7 (§4) jest poza pętlą L2–L5 i nie blokuje K1–K6. Przed startem K7 właściciel rozstrzyga, czy temat AI ma w ogóle wejść w zakres P6 (decyzja produktowa, ABC).

## Runda 1 K4 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K4-Q1, Operator Haiku 5.5)

* Baza: `7276ed3da` (FC K1b, gałąź `rust-port-wip/SIEGE-TAKTYKA-K1B-fc`), nie `origin/rust-port/parity-v2` (K4 wymaga `siege_tactics_walk`, którego nie ma w `parity-v2` na `81e7840ba`).
* Kod: `rust-port/engine/src/domain/siege_tactics_breach.rs` (nowy), rejestracja w `mod.rs`.
* Wektory: `rust-port/engine/tests/p6_siege_tactics_breach_gen.mjs` (wycięta logika z pinu `07d2fbd72` + straznik SHA-256; NIE jest to pełne wykonanie metod sceny, bo `_breachWallTile` i `_attackWallTile` zawierają wywołania THREE.js/`_schedule`).
* Testy: `rust-port/engine/tests/p6_siege_tactics_breach.rs` (12 testów, w tym kompozycja sekwencji z `siege_approach_restricted`, `siege_no_breach_repels_attack`, `battle_winner`).
* Nie portowano: `_resetSiegeForReplay`, efekty sceny, mutacje terenu, ruch wejścia na mur.

## Runda 2 K4 (obrona Operatora na zarzuty R-RUSTPORT-P6-SIEGE-TAKTYKA-K4-Q1, zob. `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K4-Q1/02a-obrona.md`)

* Zarzut 1 (PRZYJĘTY): generator r1 przepisywał logikę ręcznie. R2: `p6_siege_tactics_breach_gen.mjs` WYKONUJE zakresy tekstu pinu `07d2fbd72` w `new Function` z `this` = stan sceny. Zakresy zbalansowane (parsują się samodzielnie): `:3720-3722`, `:7311`, `:7327-7332`, `:7541`, `:7556-7564`, `:7639-7647`, `:7758-7759`, `:8071-8075`, `:7952-7959`, `:10184-10187`, `:10208`, `:10213-10220`; `gra/src/game/city-fortification.ts:97`. Poza wykonaniem: parametry wejściowe (`dmg`, `wallRow`, `ru`, `isSiege`, `aliveA/aliveD`), stuby efektów (`_updateSiegeHud`, `_spawnWallLabel`, `_schedule` = natychmiastowe wywołanie callbacka), stałe `BF_COLS`/`BTerrain`. Straznik SHA-256 zlaczonych fragmentów: `17ba1ab668a06679155a8b5c1b88afdbeace955db0a9f400b8db6e44db01e042`.
* Zarzut 2 (PRZYJĘTY): wektory `approachRestricted` (300 przypadków: isSiege/routed/onWallWalkway/strzelec/wierzchowiec/shootingEnabled) i `repelsAttack` (120, isSiege=false pokryte) wykonują pin `:7952-7959` i `:10184-10187`. Sekwencje liczą approach/repels/winner z wykonanych fragmentów pinu. Winner: `:10208` + `:10213-10220` (wektory `winner`, 120 przypadków).
* Zarzut 3 (PRZYJĘTY): `assert_state` sprawdza pełny stan: `wallCol`, `gateCol`, `wallTilesInit`, `towerRows` (oprócz `gateHp`, `gateOpen`, `wallEverBreached`, `wallTileHp`).
* Zarzut 4 (CZĘŚCIOWO PRZYJĘTY): guard `siegeWallCol < 0` jest w pinie w `_attackWallTile` (`:7541`), przed `_schedule`, a nie w callbacku `:7556-7564`. Port zostaje rozdzielony: `wall_attack_allowed` (guard) + `attack_wall_tile` (callback). Test kompozycji stosuje guard przed callbackiem; wektory mają `wallCol = -1` (wymagane asercją `any(wallCol == -1)`). Przeniesienie guardu do `attack_wall_tile` ODRZUCONE: pin nie ma go w callbacku.
* Zarzut 5 (PRZYJĘTY): numery linii poprawione (zapis flagi wieży `:8073`, blok `:8071-8075`; cztery miejsca zapisu `:3721, :7647, :7759, :8073`). Liczba źródeł = 4 (dispatch mówił o trzech; kod ma cztery zapisy, wszystkie PORTED).
* Zarzut 6 (ODRZUCONY jako wymóg zmiany): baza `7276ed3da` zgodna z dispatchem. Dowód: `git ls-tree origin/rust-port/parity-v2 -- rust-port/engine/src/domain/ | grep siege_tactics_walk` = 0 trafień. Scalenie z `parity-v2` (konflikt `mod.rs`) to zadanie integracji, nie tego tematu.
* Wynik bramek r2: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --lib` 48 passed; `p6_siege_tactics_end` 8; `p6_siege_tactics_approach` 5; `p6_siege_tactics_approach_k1` 8; `p6_siege_tactics_walk` 7; `p6_siege_tactics_breach` 15 (w tym kompozycja 721 kroków). Mutacja kontrolna (`gate_hp <= 0` -> `< 0`) wywala `wektory_attack_gate` i `wektory_sekwencje`; po przywróceniu zielono.
* Nadal BRAK (poza K4): `_resetSiegeForReplay`, efekty sceny, mutacja terenu, zdejmowanie jednostek z muru, ruch wejścia na mur, wpięcie do pętli (K5).

## K5 — projekt (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5-AUDYT-Q1, runda 1, Operator Haiku 5.5)

Baza: `a70375e52` (FC K4; kod `161e7f9a8`), gałąź `rust-port-wip/SIEGE-TAKTYKA-K4-fc`, detached.
Pin web: `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, plik `gra/src/battle/battleScene.ts` (20771 linii; SHA-256 `d784735e185c63f03d95c12a5de33855106b79432001dcc382c5ef335989d21d`). Odczyt wyłącznie przez `git show` do katalogu scratch. Kopia `gra-robocza/srcKopiaMaster/battle/battleScene.ts` w tym samym pinie NIE była porównywana (NIE_ZMIERZONO).
Zakres rundy: dokument. Brak klocka kodowego (powód: §K5.10). Kryterium (4) dispatchu: `git diff --stat` bez plików `.rs`.
Numery linii poniżej = pin `gra/src/battle/battleScene.ts`. Każdy krok pętli ma wskazanie linii. Wnioski z odczytu kodu są oznaczone jako takie.

### K5.1 Stałe, pola i zegar (pin)

| Element | Pin | Wartość / rola |
|---|---|---|
| `ACT_GAP_MS` | `:1014` | 160 ms, przerwa między aktywacjami sekwencyjnymi i po fazie AUTO |
| `TURN_GAP_MS` | `:1023` | 240 ms, przerwa między turami |
| `STALL_TURN_LIMIT` | `:1119` | 6 tur bez zmiany sygnatury |
| `FF_MAX_ROUNDS` | `:1125` | 400 tur (sufit ogólny) |
| `SIEGE_NO_BREACH_MAX_ROUNDS` | `:1128` | `max(1, round(combat-params.oblężenie.bez_wylomu_max_tur \|\| 400))`, wartość 150 z danych |
| `SPEED_STEPS` | `:2551` | `[1,2,4,8,16,32,64,128,256,512]` |
| `BATTLE_FRAME_WALL_MS` | `:2552` | 16 |
| `BATTLE_FRAME_MAX_WALL_DELTA_MS` | `:2553` | 100 (clamp delty ściennej) |
| pola stallu | `:2559` | `_stallSig`, `_stallTurns`, `_stalled` |
| pola przewijania | `:2573-2576` | `_ffActive`, `_ffVirtualMs`, `_ffPendingAuto` (plus `_ffQueue`) |
| token AUTO | `:2302` | `_autoBatchToken` (inkrement przy starcie fali, `:5730` = `const token = ++this._autoBatchToken`, i przy przerwaniu `:17339`) |
| tura | `:2698` | `roundNo` (jedyne zwiększenie: `:5636`) |
| zegar wirtualny | `:9403`, `:9500-9515` | `vNow`, `vLastWall`, `vTimers` `{due,cb,id}`, `vTimerSeq` |
| `siegeWallCol` | `:4033` | ustawiane JEDNOKROTNIE w `_carveWallTiles` (`:4026`). Grep `siegeWallCol\s*=` nie daje innego przypisania |
| `wallEverBreached` | `:3721, :7647, :7759, :8073` | cztery zapisy (zgodnie z K4). Reset `:10522` w `_resetSiegeForReplay` (`:10518-10531`) |
| reset stanu sceny | `:10533` | `_resetBattleRuntimeState` (zeruje m.in. `_stallTurns`, `_stallSig`, `_stalled`, `roundNo`, `vTimers`, `_ffActive`) |

### K5.2 Wejście w pętlę

1. `_kickoffBattleTurn` `:3615-3631`: start tury po fazie planowania. `roundNo === 0` → `_beginTurn` (`:3625`). AUTO bez oblężenia → `_beginAutoBatchTurnFromCurrentState` (`:5696-5705`). Inaczej `_activateNext` (`:3629`).
2. Wejście SKIP = `skip()` `:3680-3706` (deklaracja `:3680`; guard `if (this.finished || this._ffActive) return;` `:3681`; zapis `lastInstantDefBonus` `:3685`; `_endDeployPhase` przy `deployPhase`).
   - 2a. Gałąź bez startu bitwy: `if (!this.started) { this._skipInstantFallback(); return; }` `:3691`. `_skipInstantFallback` `:3715-3749` NIE idzie przez pętlę: ustawia `finished = true` (`:3717`), opcjonalnie `wallEverBreached = true` (`:3721`, machina atakującego przy murze), wywołuje `computeInstantResult` (`:20389-20421`, czysty rachunek, `:3723`), ustawia `_endWinner`, `_endSurvivors` i woła `_showEndScreen` (`:3747`). NIE wywołuje `_checkEnd` ani `_beginTurn`. To drugi, niepętlowy tor końca bitwy; w K5 musi mieć własny wiersz (L30).
   - 2b. Gałąź z startem (`started`): `paused = false` (`:3692`), start FF: `_ffActive = true` (`:3696`), `_ffVirtualMs = 0` (`:3697`), `_ffQueue = []` (`:3698`), `_ffPendingAuto = _manualMode && busy` (`:3703`). Gdy `!_ffPendingAuto` → `_ffEnterAuto` (`:3704`; `:3709-3712`: jeśli RĘCZNY → `_toggleManualMode`; jeśli `_battleAwaitingOrders` → `_kickoffBattleTurn`).
3. Ramka `_startLoop` `:9245-9294`: w fazie rozstawiania zamrożony zegar (`deployPhase`). Gdy `_ffActive && !paused` (`:9267`) → `_runFastForward`. Inaczej `_advanceVClock` + `_drainTimers` + tickery klatki.

### K5.3 Jedna tura: kolejność kroków

**T0. `_beginTurn` `:5631-5689`** (kolejność dosłowna):
- T0.1 `:5632-5633`: `finished` lub `_battleAwaitingOrders` → wyjście.
- T0.2 `:5634` `_updateStallWatch()` (`:5568-5581`): pominięte gdy `siegeWallCol >= 0` (`:5571`). Sygnatura = `round(Σhp) | round(Σmorale) | liczba(dead lub routed)`. Taka sama jak poprzednio → `_stallTurns++`, inaczej reset i zapis sygnatury. `_stallTurns >= 6` → `_stalled = true` (`:5580`).
- T0.3 `:5635` `_checkEnd()` (`:10153-10240`): `true` → wyjście bez zwiększenia tury.
- T0.4 `:5636` `roundNo++`.
- T0.5 `:5640` `_counterBudget.beginTurn()`.
- T0.6 `:5643` `_fireSiegeTowers()` tylko przy oblężeniu (`:4208`).
- T0.7 `:5646-5660` kolejność: tryb ręczny → jednostki gracza, potem wrogów. AUTO → przeplot `a[i], d[i]` (atakujący pierwszy).
- T0.8 odnowienie: dla każdej jednostki w `order` `acted = false`, `moveLeft = _movementPointsFor(bu)`. Następnie `turnOrder`, `turnIdx = 0`.
- T0.9 `:5685`: AUTO bez oblężenia → `_beginAutoBatchPhase('atk', a)` i koniec. `:5688`: inaczej `_activateNext()`.

**Faza AUTO bez oblężenia (fale). `_beginAutoBatchPhase` `:5707-5744`:**
- A1 migawka wszystkich jednostek (`:5708-5719`). Potem `_snapshotAutoBatchIntents` (`:5752`) planuje na klonach (`_cloneForAutoBatchPlanning` `:5822`). Przy `_autoBatchPlanning` `_schedule` wykonuje callback synchronicznie (`:9596-9600`).
- A2 `:5728` `resolveAutoBatchPhase(side, snapshots, intents)` (import `./autoBatchPhase`, `:282`, `:289`, `:295`). Wynik → `_autoBatchResolutions`. `token = ++_autoBatchToken`.
- A3 `_launchAutoBatchResolution` `:5865-5904`: wszyscy członkowie fali startują z tym samym czasu wirtualnego, bez odstępu. `complete()` ustawia `acted = true`. Gdy `_autoBatchPending` spadnie do 0 → `_schedule(ACT_GAP_MS, _finishAutoBatchPhase)` (`:5874`).
- A4 `_finishAutoBatchPhase` `:5961-5973`: strażnik `token`, `finished`, `_autoBattleSuspended`, `_manualMode`. Potem `_checkEnd()` (`:5963`). Faza `atk` → `_beginAutoBatchPhase('def', niezaktywowani obrońcy)`. Faza `def` → czyszczenie stanu fali i `_schedule(TURN_GAP_MS, _beginTurn)` (`:5972`).

**Ścieżka sekwencyjna (oblężenie lub tryb ręczny). `_activateNext` `:5979-6030`:**
- S1 `:5981-5982`: `finished` / `_battleAwaitingOrders` → wyjście; `_checkEnd()`.
- S2 szukanie kandydata od `turnIdx`: pomija martwych, `fadingOut`, `removed`, `acted`. W trybie ręcznym czyści `_queuedOrderUnitIds`.
- S3 brak kandydata → `_schedule(TURN_GAP_MS, _beginTurn)` (`:6002`).
- S4 `:6008` `_activateUnit(u, done)`. Callback `done`: strażnik `_autoBattleSuspended` (`busy = false`, koniec). `acted = true`, chyba że bezczynna jednostka gracza w trybie ręcznym (`:6019-6025`). Potem `_schedule(ACT_GAP_MS, _activateNext)` (`:6028`).

**`_activateUnit` `:6048-6299`** (r1-obrona: każda gałąź ma numer linii pinu; kolejność = kolejność w kodzie):
- U1 `finished` lub `dead/fadingOut` → `done`.
- U2 `routed` → `_fleeStep` (`:9845`), koniec. Rozbita jednostka nigdy nie atakuje.
- U3 `_applyTerrainRange(ru)` przed gałęziami (zasięg z pola, na którym stoi).
- U4 tryb ręczny i strona gracza → `_performPlayerOrder` (`:18280`), K6.
- U5 doktryna AUTO: pominięta dla obrońców w oblężeniu (`siegeDefenderNeverDoctrine`) i dla taranów/wież atakującego (`siegeMachineNeverDoctrine`, `isSiegeUnit`). Inaczej `_isUnitDoctrineAuto` → `_executeGroupDoctrineStep` (`:17966`).
- U6 SURROUNDED: raz na jednostkę (`surroundApplied`), gdy ≥3 wrogów przy Manhattan = 1.
- U7 gałęzie w kolejności kodu (każda z pinem):
  - U7.1 `:6129-6171` `ru.onWallWalkway`: strzał (`canShoot` `:6136`, `_doAttack` `:6157`, `done` `:6162`), walka (`:6168`), `done` `:6170-6171`. Nigdy nie schodzi z muru.
  - U7.2 `:6179-6180` wejście na wieżę: `_trySiegeTowerClimb` (`:8056`), `_siegeInfantryToTowerStep` (`:8087`).
  - U7.3 `:6187-6220` machiny oblężnicze atakującego: taran `:6191` (brama z dystansu 1), katapulta `:6194` (najbliższy kafel muru), wieża `:6191`. Wszystkie wewnątrz `isSiegeUnit && side==='atk' && siegeWallCol>=0` (`:6187`).
  - U7.4 `:6225-6235` SIEGE DEFENDER HOLD: `canShoot` `:6226`, `_doAttack` `:6228` / `:6232`, `done` `:6229` / `:6233`, `return` `:6235`.
  - U7.5 `:6241` strzelec z amunicją → `_rangedAction` (`:6656`).
  - U7.6 `:6249-6276` `primaryRanged` bez amunicji: `dryCol` `:6251`, atak z sąsiedztwa `:6257`, cofanie `FALLBACK_TILES` `:6266`, trzymanie `:6269-6271`, `return` `:6276`.
  - U7.7 `:6284` kawaleria → `_cavalryAction` (`:6372`).
  - U7.8 `:6290` falanga → `_phalanxAction` (`:6546`).
  - U7.9 `:6293-6298` melee: `_targetInRange` `:6293`, `_doAttack` `:6295` (sąsiad), w przeciwnym razie `_advanceStep` `:6298`.
  - Wspólne ruch/cios: `_doMove` `:8685`, `_doAttack` `:8787`, `_doMeleeAttack` `:9096` → `_singleBlow` `:8809`. Losowość w logice rozgrywki: tylko `roll = Math.random() * 100` `:8960`. Pozostałe `Math.random` w pinie (`:4890`, `:5014`, `:11030-11084`) są w kolorze terenu lub dźwięku, poza logiką.
- Efekty ruchu i ciosu idą przez `_raf`/`_schedule` (czas wirtualny). Zakończenie wywołuje `done`, które planuje kolejną aktywację po `ACT_GAP_MS`.

### K5.4 Zegar, kolejka timerów, przewijanie

- `_now()` = `vNow` (`:9403`).
- `_advanceVClock(wall)` `:9500-9511`: `dw = wall - vLastWall`. Przy `paused` brak przesunięcia. `vNow += _scaledWallDelta(dw)`.
- `_scaledWallDelta(d)` `:9512-9515`: clamp do `[0, 100]` ms, potem `× speedMul`.
- `_schedule(ms, cb)` `:9595-9606`: `due = vNow + max(0, ms)`, `id = vTimerSeq++`. Po `finished` nic nie dodaje.
- `_drainTimers()` `:9616-9634`: wybiera najwcześniejszy `due <= vNow` (remis → mniejsze `id`), usuwa i wykonuje. Guard 100000 na klatkę. Po `finished` czyści kolejkę.
- `_runFastForward` `:9415-9437`: `while (!finished && budżet_ściany < 40 ms)` (`:9422-9423`). Jedyne `performance.now()` wpływające na przebieg, i tylko na liczbę iteracji na klatkę. W każdej iteracji: (a) `_roundCapVerdict()` → `_ffRoundCapResult()` i `return`; (b) `_ffPendingAuto && !busy` → `_ffEnterAuto`; (c) `vNow += FF_STEP_MS` (`= 16 × speedMul`); (d) `_drainTimers`; (e) `_tickProjectiles(vNow)`; (f) `_tickFades(vNow)`; (g) wykonanie `_ffQueue` (`_raf` w trybie FF kolejkuje krok, `:9407`).
- Wniosek z kodu: sekwencja kroków przewijania zależy tylko od `vNow` i kolejki. Czas ścienny wpływa wyłącznie na granice klatek. Zwykłe AUTO (poza FF) liczy `vNow` z czasu ściennego (`vLastWall`), więc jego tempo nie jest deterministyczne.

### K5.5 Kończenie: `_checkEnd` `:10153-10240`, kolejność warunków

1. `:10154` `finished` → `true`.
2. `:10159-10160` `aliveA/aliveD = !dead && !fadingOut && !routed`.
3. `:10166-10169` `ratioA/ratioD = _armyMoraleRatio` (`:9988`). `brokenX = ratio < ARMY_MORALE_LOSS_THRESHOLD` (25 %).
4. `:10170-10171` przy złamaniu: `commandersToWithdrawAfterArmyBreak` → `_startRout` dla każdego zwróconego dowódcy.
5. `:10172-10188` blok stall, tylko gdy `_stalled && aliveA && aliveD`:
   - PAT `:10177-10181`: `!isSiege && totalDead > 0` → log. `ratioA <= ratioD` → `aliveA = false`, inaczej `aliveD = false`.
   - SZTURM ODPARTY `:10184-10187`: `isSiege && !wallEverBreached` → `aliveA = false`.
6. `:10189-10195` złamane morale strony żywej → `alive = false` (z logiem).
7. `:10197-10206` sufit tur, gdy oba żywe: `cap = _roundCapVerdict()`. `remis` → `_finishDraw` i `return true`. Inaczej log PAT i wymuszenie (`obronca` → `aliveA = false`, `atakujący` → `aliveD = false`).
8. `:10208` `if (aliveA && aliveD) return false`, po składaniu wyniku.
9. `:10208-10220` zwycięzca: jedna strona żywa → ona. Obie martwe → suma `Σmax(0,hp)` (`hpA >= hpD` → atakujący).
10. `:10222-10240` survivors (`_battleUnitsForMapExport`), log, `_showEndScreen`, `return true`.

Miejsca wywołań `_checkEnd`: `:5635` (początek tury), `:5963` (koniec fazy AUTO), `:5982` (każda aktywacja sekwencyjna). Werdykt przewijania (`:9486`) woła `_roundCapVerdict`, nie `_checkEnd`. Wniosek z kodu: `_checkEnd` ma efekty uboczne (`finished`, `_startRout`, log). Czy wielokrotne wywołania duplikują logi lub `_startRout`: NIE_ZMIERZONO, do potwierdzenia w K5c.

### K5.6 Werdykt sufitu `_roundCapVerdict` `:9449-9464` i remis `_finishDraw` `:9467-9479`

- Oblężenie bez wyłomu (`siegeWallCol >= 0 && !wallEverBreached`): `cap = min(siegeNoBreachMaxRounds, 400)`. `roundNo < cap` → `null`. Inaczej remis (SZTURM ODPARTY, `reason` z kodu).
- Pozostałe bitwy: `roundNo < 400` → `null`. Inaczej `ratioA <= ratioD ? obronca : atakujący` (rozstrzygnięcie po morale).
- `roundNo` to liczba rozpoczętych tur, zwiększana wyłącznie w `:5636`.

### K5.7 Wejścia i wyjścia warstwy pętli

- Wejścia: jednostki `atk`/`def` (`bu.hp`, `bu.maxHp`, `morale`, `q`, `r`, `dead`, `fadingOut`, `routed`, `removed`, `acted`, `moveLeft`, `onWallWalkway`, `isSiegeUnit`, `rangedBase`, `ammoLeft`). Teren (`terrain`, `terrainMap`), `counters`, `siegeWallCol`, `siegeNoBreachMaxRounds`, `wallEverBreached` (K4), wieże (`siegeTowers`, `towerShooterRow`), tryb (ręczny/AUTO), `speedMul`, `paused`, `deployPhase`, RNG (`Math.random`, `:8960`), zegar ścienny (tylko AUTO/UI).
- Wyjścia: `finished`, `endWinner` (`atakujący` / `obronca` / `remis`), `endSurvivors`, `roundNo`, `log`, `wallEverBreached`, statystyki (`_sideEndStats`, plan wiersz 33.30), `_showEndScreen` (UI, wiersz 33.32).

### K5.8 Tabela: funkcja pinu → moduł Rust / BRAK

Stan bazy `a70375e52`. Wiersze K1, K1b i K4 dotyczą modułów z bazy. K2 i K3 NIE są na bazie.

| # | Funkcja pinu (linie) | Odpowiednik Rust | Status | Uwagi |
|---|---|---|---|---|
| L1 | `_kickoffBattleTurn` (3615-3631) | brak | BRAK | wejście. Tryb ręczny = K6 |
| L2 | `_ffEnterAuto` (3709-3712), wiersz 33.23 | brak | BRAK (G) | tryb AUTO po przewinięciu |
| L3 | start przewijania (3696-3704) | brak | BRAK | pola `_ffActive`, `_ffPendingAuto` |
| L4 | `_startLoop` (9245-9294) | brak | BRAK (scena) | zegar rAF, poza silnikiem |
| L5 | `_beginTurn` (5631-5689) | brak | BRAK | K5f |
| L6 | `_updateStallWatch` (5568-5581), wiersz 33.9 | brak | BRAK | K5b (czysta funkcja) |
| L7 | `_checkEnd` (10153-10240) | częściowo: `battle_winner` (`siege_tactics_end.rs:56`), `siege_no_breach_repels_attack` (`:48`), `round_cap_verdict` (`siege_no_breach.rs:69`), `commanders_to_withdraw_after_army_break` (`army_leadership.rs:146`), `army_morale_ratio_without_commander` (`:123`) | PARTIAL | BRAK: bramka `_stalled` (blok 10172), PAT, `_startRout`, log, `_showEndScreen`. `repels` bez bramki: K5.9 |
| L8 | `_armyMoraleRatio` (9988-9991) | `army_leadership.rs:123` (`army_morale_ratio_without_commander`) | PORTED | Pin ma JEDNĄ wersję: `return armyMoraleRatioWithoutCommander(arr)` (`:9990`). Sprawdzone r1-obrona: `grep` po pinie nie pokazuje wariantu z dowódcą (`armyMorale*` tylko `:103`, `:9988-9990`, wywołania). Brak luki. |
| L9 | `_roundCapVerdict` (9449-9464) | `siege_no_breach.rs:69`, cap `:53`, dane `:27` | PORTED | wiring w pętli BRAK |
| L10 | `_finishDraw` (9467-9479) | werdykt `RoundCapVerdict::Draw` (`siege_no_breach.rs:37`) | PARTIAL | efekty (log, survivors, UI) BRAK |
| L11 | `_ffRoundCapResult` (9485-9497) | werdykt jak L9 | PARTIAL | efekty BRAK |
| L12 | `_runFastForward` (9415-9437) | brak | BRAK | K5j |
| L13 | `_advanceVClock`, `_scaledWallDelta` (9500-9515), wiersz 33.25 | brak | BRAK (G) | K5e. Tylko zegar wirtualny |
| L14 | `_schedule`, `_drainTimers` (9595-9634) | brak. `domain/events.rs:412` (`schedule(turn, phase, event)`) sprawdzone r1-obrona: klucz kolejki to `(tura, faza, sekwencja)`; pin ma `due = vNow + ms` i `id = vTimerSeq++`, wybór `due <= vNow` (remis `id`). NIE jest równoważne. Odrzucone jako baza. | BRAK | K5e (własna kolejka po czasie wirtualnym) |
| L15 | `_tickProjectiles`, `_tickFades`, `_tickFloatLabels` (9326-9414), wiersz 33.24 | brak | BRAK (G) | `_tickFades` ustawia `dead = true` po zaniku. Wpływa na `aliveA/aliveD` w L7 |
| L16 | `_beginAutoBatchTurnFromCurrentState` (5696-5705) | brak | BRAK | |
| L17 | `_beginAutoBatchPhase`, `_snapshotAutoBatchIntents`, `_cloneForAutoBatchPlanning`, `_launchAutoBatchResolution`, `_finishAutoBatchPhase` (5707-5973), wiersz 33.10 | brak (`grep -rn auto_batch` pusty) | BRAK | zależy od `autoBatchPhase.ts` (osobny port) |
| L18 | `_activateNext` (5979-6030) | brak | BRAK | K5f |
| L19 | `_activateUnit` (6048-6299) | brak. Podzbiory: `_siegeMoveRefused` → `siege_tactics_approach.rs:199` (PORTED); `_siegeSafeApproach` → `:241` (PARTIAL); `_siegeWalkTo` → `siege_tactics_walk.rs:235` (PORTED) | BRAK (całość) | gałęzie kawaleria/falanga/strzelcy: BRAK. `meleeBlockedByWall` i `attackerWallEntryIsBreach`: BRAK (K2 nie na bazie) |
| L20 | `_fleeStep` (9845) | brak | BRAK | |
| L21 | `_startRout`, `_checkRout`, `_checkMeleeScreenLost` (9799, 9783, 9761), wiersz 33.28 | brak | BRAK | |
| L22 | `_doMove` (8685), `_doAttack` (8787), `_doMeleeAttack` (9096), `_singleBlow` (8809) | brak. `combat.rs::resolve_combat` jest jednorazowe (Z-NB-2) | BRAK | |
| L23 | losowość: `Math.random` (`:8960`) | brak wstrzykiwanego RNG w pętli | BRAK | decyzja techniczna T1 |
| L24 | `_fireSiegeTowers` (4208), wiersz 33.5 | brak na bazie (K3 nie na bazie) | BRAK | |
| L25 | bramka `siegeWallCol` w `_updateStallWatch` (`:5571`) | brak | BRAK | ta sama pozycja co L6 |
| L26 | `_resetSiegeForReplay` (10518-10531), `_resetBattleRuntimeState` (10533) | brak | BRAK | reset ma być częścią stanu początkowego K5 |
| L27 | `_haltAutoBattleTurn` (17333-17345), wiersz 35.29 | brak | BRAK | K6 |
| L28 | `_performPlayerOrder` (18280), `_executeGroupDoctrineStep` (17966) | brak | BRAK | K6 / wiersze 36.x |
| L29 | `_showEndScreen` (10666-10738), wiersz 33.32 | brak | BRAK (UI) | poza silnikiem |
| L30 | `_skipInstantFallback` (3715-3749) + `computeInstantResult` (20389-20421), wiersz 35.x (Pomiń) | brak. Najbliższe: `computeInstantResult` (K-owe `resolve_combat` jednorazowe, Z-NB-2) | BRAK | Drugi tor końca (K5.2 pkt 2a): ustawia `finished` i `_endWinner` bez `_checkEnd`, bez pętli tur. Decyzja: K6 (Pomiń) albo osobny port; nie wchodzi do K5a–K5j. Wymaga zachowania `wallEverBreached` z `:3721` (K4). |

### K5.9 Odkrycie: gałąź SZTURM ODPARTY jest w pinie nieosiągalna

Wnioskowane z odczytu kodu, NIE_ZMIERZONO w runtime:
- Cały blok `:10172-10188` (w tym SZTURM `:10184-10187`) jest bramkowany przez `this._stalled`.
- Jedyne przypisanie `_stalled = true` to `:5580`. `_updateStallWatch` wychodzi wcześniej przy `siegeWallCol >= 0` (`:5571`).
- `siegeWallCol` jest ustawiane raz w `_carveWallTiles` (`:4033`) i nigdzie indziej nie zmieniane. `_resetBattleRuntimeState` zeruje `_stalled` (`:10550`, w `:10533-`).
- Wniosek: w bitwie oblężniczej `_stalled` pozostaje `false`, więc gałąź SZTURM ODPARTY nie wykonuje się. Oblężenie bez wyłomu kończy się wyłącznie sufitem `_roundCapVerdict` (remis po 150 turach).
- Konsekwencja dla portu: `siege_no_breach_repels_attack` (`siege_tactics_end.rs:48`) nie może być wpięte bez bramki `_stalled`. Wektory K4 `repelsAttack` (isSiege=true) testują predykat poza kontekstem, który w pinie nie występuje. Wiersz 10 planu (PORTED) jest poprawny jako predykat, ale nie jako zachowanie gry.
- Zmiana wyniku gry (aktywacja gałęzi) to decyzja gameplay: pytanie Q1.

### K5.10 Propozycja podziału K5 na klocki (kolejność i zależności)

- **K5a**: minimalny model jednostki boju (`hp`, `morale`, `dead`, `fadingOut`, `routed`, `removed`, `acted`, `moveLeft`) i predykaty `alive`/`broken`. Zależności: brak. Rust nie ma `RuntimeBattleUnit` (wiersz 28 planu).
- **K5b**: `_updateStallWatch` jako czysta maszyna stanu. Wejście: lista `(hp, morale, out)` i flaga `siege`. Stan: `{sig, turns, stalled}`. Zależności: brak. **Kandydat na pierwszy klocek kodowy**: czysty, bez zależności. Wektory z pinu `:5568-5581` przez node z SHA-256.
- **K5e**: zegar wirtualny i kolejka timerów (deterministyczna). Zależności: brak. Decyzja modelu: własna kolejka, nie `events.rs` bez weryfikacji (T2).
- **K5c**: `_checkEnd` jako funkcja decyzji. Wejście: `{flagi, ratio, stalled, isSiege, wallEverBreached, cap}`. Wyjście: `Continue | Finish{winner, draw}` i lista efektów (log, rout). Musi zawierać bramkę `_stalled` (K5.9). Zależności: K5a, K5b, K1, K1b, K4 (są na bazie), `army_leadership.rs` (jest).
- **K5d**: sufit tur i licznik `roundNo` (wiring `round_cap_verdict` w K5c). Zależności: K5c.
- **K5f**: sekwencja tury sekwencyjnej (`_beginTurn`, `_activateNext`, `turnOrder`, `acted`) z wywołaniami `_checkEnd` w tych samych miejscach (`:5635`, `:5982`). Zależności: K5a, K5c, K5e.
- **K5j**: `_runFastForward` jako pętla bez czasu ściennego (budżet 40 ms poza logiką; krok = `FF_STEP_MS`). Zależności: K5c, K5e.
- **K5i**: RNG i cios (`_singleBlow`, `:8960`). Zależność: decyzja T1 (źródło losowości). Bez niej wektory mogą testować tylko sekwencje z wstrzykniętymi rzutami.
- **K5g0**: port `autoBatchPhase.ts` (`resolveAutoBatchPhase`). Zależności: brak w Rust. Osobny klocek.
- **K5g**: fazy AUTO (migawka, planowanie na klonach, fala). Zależności: K5g0, K5e, K5f. Najwyższe ryzyko po RNG.
- **K5h**: gałęzie `_activateUnit` (flee, strzelcy, kawaleria, falanga, melee). Zależności: K1b (jest), K2 i K3 (NIE na bazie), K5i.
- **K6**: ręczna i „Pomiń” (L5), po K5f i K5j (zgodnie z §4).

Kolejność: K5a → K5b → K5e → K5c → K5d → K5f → K5j → K5i → K5g0 → K5g → K5h → K6. K5a, K5b i K5e nie mają wzajemnych zależności i mogą iść równolegle.

Dlaczego brak klocka w tej rundzie: pierwszy czysty klocek (K5b) jest mały, ale jego wektory wymagają wykonania pinu w node (SHA-256), testów i pełnych bramek cargo na dysku z 11 GB wolnych. Dispatch dopuszcza wariant „tylko dokument”. Wybrano go. Klocek K5b zaplanowano na następną rundę.

### K5.11 Ryzyka

- R1 (wysokie) martwa gałąź SZTURM (K5.9): wpięcie bez bramki `_stalled` zmieni wynik oblężeń.
- R2 (wysokie) niedeterminizm RNG: `Math.random` w `:8960` nie jest seedowany. Pełna zgodność z pinem wymaga decyzji T1.
- R3 (średnie) dwie ścieżki kolejności: fale AUTO (bez oblężenia) i sekwencja (oblężenie i ręczny). Dwa modele do odwzorowania.
- R4 (średnie) zegar ścienny w AUTO (`vLastWall`): tempo nieodtwarzalne. Deterministyczne tylko FF w czasie wirtualnym.
- R5 (średnie) `_checkEnd` ma efekty uboczne i jest wołany z 3 miejsc pętli. Powtarzalność logów i `_startRout`: NIE_ZMIERZONO, do K5c.
- R6 (niskie) moment `dead = true` po zaniku (`_tickFades`) wpływa na `_checkEnd`. K5 musi go odwzorować.

### K5.12 Decyzje dla właściciela

Pytania ABC (wyłącznie gameplay):
- **Q1**: oblężenie bez wyłomu. Obecne zachowanie: remis po 150 turach (ABC 2026-11-10, komentarz pinu `:9442-9444`). Gałąź SZTURM jest martwa (K5.9). Opcje: (A) zachować obecne zachowanie; (B) aktywować wcześniejsze zakończenie SZTURM (zmiana gry, wymaga zmiany bramki `_stalled` w pinie, poza portem). **Rekomendacja: A.** Martwą gałąź udokumentować w K5c.

Decyzje techniczne (rekomendacje, bez ABC):
- **T1**: RNG wstrzykiwany do pętli jako źródło rzutów z seedem. **Rekomendacja.**
- **T2**: kolejka timerów własna i deterministyczna. Nie reużywać `events.rs` bez weryfikacji. **Rekomendacja.**
- **T3**: `_checkEnd` jako funkcja decyzji zwracająca listę efektów, bez stanu sceny. **Rekomendacja.**
- **T4**: tempo AUTO nie jest celem parytetu. Parytet dotyczy kolejności i wyniku, nie klatek. **Rekomendacja.**

### K5.13 Status

- Tabela §1 (wiersze 1–38) i §4 NIE zmienione. K5 nadal wymaga osobnej autoryzacji właściciela (§4).
- Stan K5 na bazie `a70375e52`: brak kodu pętli w Rust. Wejściami są predykaty L7 (częściowo), L9 (PORTED) i podzbiory L19 (K1 i K1b).

## Stan integracji K5 po B14B (R-RUSTPORT-P6-INTEG-B14B-Q1, runda 1, Operator Haiku 5.5)

- **Scalenia na gałęzi `rust-port-wip/INTEG-B14B-Q1` (baza `513e1a56c` = `rust-port/parity-v2` po INTEG-B14A):**
  1. `86223e037` (łańcuch K5 K5A…K5H, `rust-port-wip/SIEGE-TAKTYKA-K5H-fc`) → merge `b6bb8500e`. Konflikt w `rust-port/engine/src/domain/mod.rs` (rejestracje `siege_tactics_classify` i `siege_tactics_clock`) rozwiązany przez zachowanie obu stron.
  2. `fb7ac73d1` (R7-K7, `rust-port-wip/WIRE-WAR-R7K7-fc`) → merge `b959ba486`. Bez konfliktu.
  3. `eee18680c` (K5I2a1, `rust-port-wip/SIEGE-TAKTYKA-K5I2A1-fc`) → merge `e98b2e6c1`. Konflikt w `mod.rs` (rejestracje `siege_tactics_fastforward`, `siege_tactics_inputs_terrain`, `siege_tactics_roundcap`) rozwiązany przez zachowanie wszystkich trzech.
- **Kolizja nazw:** `terrain_river_attack_multiplier` istnieje w `siege_tactics_blow_inputs.rs` i w `siege_tactics_inputs_terrain.rs`. Oba moduły są publiczne; test `p6_siege_tactics_inputs_terrain.rs` importuje wersję z `siege_tactics_inputs_terrain` przez pełną ścieżkę. Adaptacji testów nie wykonano (wynik bramki w raporcie).
- **Brak wołającego poza testami** (sprawdzone grepem w `rust-port/engine/src`, poza `tests/`):
  - `activate_unit` (`siege_tactics_activate.rs`) — wywołuje go tylko moduł testów.
  - `begin_auto_batch_phase`, `fire_timers` (`siege_tactics_autobatch.rs`) — wywołania tylko w module lub testach; brak pętli wejściowej w Rust.
  - `run_fast_forward` (`siege_tactics_fastforward.rs`) — brak wołającego.
  - `begin_turn` i `activate_next` — wywołania tylko wewnątrz `siege_tactics_turnseq.rs` / `siege_tactics_roundcap.rs` oraz w testach; brak pętli sterującej w produkcji.
  - `siege_tactics_blow_full` (`blow_full`) — BRAK wołającego w `src` poza testami (sprawdzone grepem 2026-11-12, B14C); zależy od `siege_tactics_inputs_pos`, `_inputs_wall`, `_inputs_unit`. Podpięcie wymaga zadania składającego pętlę (K5-LOOP / KLASY-WIRE, #91/#92), nie zrobionego.
  - `siege_tactics_inputs_pos`, `siege_tactics_inputs_wall`, `siege_tactics_inputs_unit` — niepodpięte w produkcji; wołane tylko przez `blow_full` i między sobą (`inputs_unit` tylko z `blow_full`) oraz w testach. Status: BRAK/niepodpięte do czasu K5-LOOP / KLASY-WIRE.
  Konsekwencja: łańcuch K5 jest portem warstwy funkcji i kontraktów, bez działającej pętli taktycznej w produkcji.
- **Wymagana pętla K5F/K5G:** produkcyjna pętla musi wywoływać sekwencję K5F (`begin_turn` → `activate_next` → faza AUTO K5G z `begin_auto_batch_phase`/`fire_timers` → `_checkEnd`), zachowując kolejność z pinu `07d2fbd72`.
- **Kontrakt kolejności `ru.range` i flag klas (K5H):** `_targetInRange` i `_rangedTargetInRange` czytają `ru.range` (dla `canShoot`), więc wynik zależy od `range` po `_applyTerrainRange`. Predykat `can_shoot` nie czyta `range`; `isSiegeUnit`, `isSiegeTower`, `_isRam` czytają właściwości jednostki. Kontrakt jest opisany w dokumentacji traitu `ActivateOps` i pola `ActivateUnit::can_shoot`. Wektory nie zapisują liczby wywołań zapytań (NIE_ZMIERZONO jako dowód testowy).
- **Rozbieżność halt vs web (K5G):** web `battleScene.ts` @`07d2fbd72` iteruje `for (const resolution of this._autoBatchResolutions)` po starej tablicy, a `_haltAutoBattleTurn` przypisuje nową pustą tablicę (`:5739-5742`, `:17333-17344`). Rust (`siege_tactics_autobatch.rs`, indeks `0..len` z `get` i `break` na `None`, `halt_auto_battle_turn` czyści `st.resolutions`) nie odtwarza tej różnicy. Obecne wywołania `_haltAutoBattleTurn` (`:10568`, `:17379`) nie leżą w łańcuchu `_launchAutoBatchResolution`, więc różnica nie jest osiągalna w obecnym modelu; decyzja o zachowaniu do właściciela.

## 7. Tabela statusu tematów K5I2 / K5-LOOP / KLASY-WIRE / NFD-CCC / CRED (R-RUSTPORT-P6-DOC-TAKTYKA-WIERSZE-Q1, runda 1, Operator HAIKU)

Dane z raportów Final Control (`dyspozycje/autobot/runs/<ID>/03-final-control.md`) i raportów operatora/obrony tam, gdzie FC brak. Liczby, których raport nie podaje, oznaczono `NIE_ZMIERZONO`. Wiersze nie zmieniają §1 (pokrycie funkcji pinu) ani §4.

| Temat | Moduł Rust | Testy (raport) | Wektory (raport) | Kod (SHA) | FC (SHA, werdykt) | Status |
|---|---|---|---|---|---|---|
| K5I2a1 | `domain/siege_tactics_inputs_terrain.rs` | `p6_siege_tactics_inputs_terrain` 7 ok; `--lib` 57 ok | norm 631, bonus 340, def/river/city po 700 (gałęzie pinu) | `e5fd83368` (obrona `0f1eb3b73`) | `eee18680c`, PASS-WITH-NOTES | PORTED (scalony w B14B, merge `e98b2e6c1`) |
| K5I2a2 | `domain/siege_tactics_inputs_pos.rs`, `siege_tactics_blow_inputs.rs` (usunięty martwy kod) | `p6_siege_tactics_inputs_pos` 1 ok; `p6_siege_tactics_blow` 3 ok; `--lib` 57 ok | `inputs_pos` 1542 przypadki; `blow` 626 | `3db73fa36` | `4b6595876`, PASS-WITH-NOTES | PORTED (scalony w B14C) |
| K5I2a3 | `domain/siege_tactics_inputs_wall.rs` | `p6_siege_tactics_inputs_wall` 6 ok; `--lib` 52 ok | NIE_ZMIERZONO (FC nie podaje liczby przypadków) | `1c572c448` | `fe3264a39`, PASS-WITH-NOTES | PORTED (scalony w B14C) |
| K5I2a4 | `domain/siege_tactics_inputs_unit.rs` | `p6_siege_tactics_inputs_unit` 2 ok; `--lib` 65 ok | 2447 przypadków (regeneracja z pinu bajt w bajt) | `2f8b69ccd` (obrona `588b6eca1`) | `a2bcdbdc6`, PASS-WITH-NOTES | PORTED (scalony w B14C) |
| K5I2b | `domain/siege_tactics_blow_full.rs` | `p6_siege_tactics_blow_full` 3/3; `--lib` 64/64 | NIE_ZMIERZONO (FC nie podaje liczby przypadków) | `c460f4830` | `f42dddfcd`, PASS-WITH-NOTES | PORTED w warstwie funkcji; BRAK wołającego w produkcji (patrz §8) |
| K5I2b2 | `domain/siege_tactics_blow_env.rs` | `p6_siege_tactics_blow_env` 3 ok; `p6_siege_tactics_blow_full` 3 ok; `--lib` 94 ok | NIE_ZMIERZONO (FC nie podaje liczby przypadków) | `7bd75cf2c` | `0c90e2bf1`, PASS-WITH-NOTES | PORTED w warstwie funkcji; BRAK wołającego w produkcji (patrz §8) |
| K5-LOOP | `domain/siege_tactics_loop.rs` (nowy; sterownik z `trait LoopBody`) | `p6_siege_tactics_loop` 2/2 (raport operatora r1); `--lib` 88 (raport operatora) | 360 sekwencji z pinu (`p6_siege_tactics_loop_vectors/vectors.json`); po obronie r1 aktywacje 123394 | obrona `ec7a0ff78` (operator r1 `73ad43f25`) | BRAK: FC nie wykonany | CZĘŚCIOWE. Operator r1 PASS-WITH-NOTES; obrona r1 przyjęła zarzuty (morale z pinu, wieże bez schedule). Ciało jednostki i wieże to stuby, patrz §8 |
| KLASY-WIRE | `domain/siege_tactics_class_adapters.rs` (nowy) | `p6_siege_tactics_class_adapters` 5 ok; `--lib` 85 ok | NIE_ZMIERZONO (FC nie podaje liczby przypadków) | `cb9db56ba` | `3d7ed90f7`, PASS | PORTED: flagi klas w K1/K3/K5H podmienione na `siege_tactics_classify` |
| NFD-CCC | `normTerrain` (kanoniczne przestawianie znaków łączących; moduł podany w raporcie FC) | moduł 11/11; `--lib` 88/88 | NIE_ZMIERZONO w raporcie FC | `c25fd6edf` (kod `08957bab1`, poprawka SHA `6493f83a5`) | `e6a815d53`, PASS | PORTED (dług zamknięty) |
| CRED | `domain/credibility.rs` (rejestr wiarygodności, strumienie D2/D4) | `p6_credibility` 15; `p6_tickdiplo` 1; `p6_wire_war_dipl_steps` 8; `p6_wire_war_diplo` 13; `p6_wire_war_inputs` 16; `p6_wire_war_pipeline` 7; `--lib` 60 | NIE_ZMIERZONO w raporcie FC | `8cf5b49c5` | `9d4a2c17b`, PASS-WITH-NOTES | PORTED. NIE_ZMIERZONO: pełny `cargo test --no-fail-fast` (FC opiera się na raporcie operatora: 410 binarek ok) |

Uwagi do tabeli:
- SHA kodu i SHA FC różnią się celowo: SHA FC to ref `refs/keep/<ID>-fc` (gałąź `rust-port-wip/<ID>-fc`), SHA kodu to commit operatora lub obrony.
- Nazwy modułów i plików testów są podane według raportów; nie były ponownie sprawdzone grepem na bazie `82bb87fb1`.

## 8. Znane luki pętli taktycznej (stan na bazę 82bb87fb1)

Pętla taktyczna oblężenia nie działa w produkcji. Warstwa funkcji i kontraktów jest portowana (tabela §7), ale składanie w pętlę nie. Każda pozycja poniżej jest jawna; do czasu własnego tematu pozostaje NIE_ZMIERZONO.

1. **Ciało jednostki `_activateUnit` (K5H/K5I) niepodpięte w pętli.** `siege_tactics_loop.rs` przyjmuje ciało przez `trait LoopBody`. W wektorach K5-LOOP ciało to stub (czas trwania + efekt nop/kill/hurt). `single_blow_full` (K5I2b/K5I2b2) nie jest wołane z produkcyjnego kodu; `blow_full`, `inputs_pos`, `inputs_wall`, `inputs_unit` są wołane tylko w testach i między sobą (stan z sekcji „Stan integracji K5 po B14B”).
2. **Wieże: stub zamiast timingu pina.** Pin `_fireSiegeTowers` (`battleScene.ts:4208`) planuje `_fireOneTower` ze staggerem 180 ms i niszczy wieżę przez `_destroyTowerAtRow`. Rust i generator K5-LOOP robią natychmiastowe `dead = true` na jednej jednostce. Wektory `withTower` (117 sekwencji) nie testują timingu wież. Port `_schedule` (kolejka timerów) pozostaje poza zakresem.
3. **Morale.** Obrona r1 K5-LOOP zastąpiła stub `_armyMoraleRatio` formułą `armyMoraleRatioWithoutCommander` z `game/army-leadership.ts` (pin 07d2fbd72, wycinek w generatorze). Zmiana nie przeszła FC, więc status pozostaje NIE_ZMIERZONO.
4. **Brak wektorów dla ścieżek:** ucieczka (flee), rozbicie i wycofanie (rout; `_startRout`, `commandersToWithdrawAfterArmyBreak` stubowane pustą listą), `moveLeft` w trakcie walki, wyłom w trakcie bitwy (`_breachWallTile`/`_breachGate`; w wektorach tylko flaga początkowa `wallEverBreached`).
5. **AUTO bez oblężenia i tryb ręczny nie są składane.** Zdarzenie `BeginAutoBatchPhase` powoduje panikę sterownika K5-LOOP; wektory są tylko dla oblężenia (`siegeWallCol = 3`) w trybie AUTO sekwencyjnym.
6. **Halt vs web (K5G).** Web iteruje starą tablicę `_autoBatchResolutions`, a `_haltAutoBattleTurn` przypisuje nową pustą tablicę (`battleScene.ts:5739-5742`, `:17333-17344`). Rust nie odtwarza tej różnicy. Wg dokumentu nie jest osiągalna w obecnym modelu; decyzja o zachowaniu należy do właściciela.
7. **Przewijanie (K5J).** Rust używa jawnego `max_steps` zamiast budżetu 40 ms ściennych; pin w node używa stubowanego zegara 10 ms. Wg raportu K5-LOOP wynik nie zależy od podziału na kroki; nie zweryfikowano tego na pinie z prawdziwym zegarem.
8. **Brak produkcyjnego wołającego.** Żadna pętla sterująca nie wywołuje `begin_turn` → `activate_next` → faza AUTO (`begin_auto_batch_phase`/`fire_timers`) → `_checkEnd` w `src` poza testami.
9. **Rozmiar wektorów K5-LOOP.** `vectors.json` ma ok. 10,8 MB (trace aktywacji). Raport operatora proponuje skrócenie; po obronie liczba aktywacji zmieniła się z 188802 na 123394, a rozmiar pliku nie był ponownie mierzony (NIE_ZMIERZONO).
10. **FC K5-LOOP nie wykonany.** Gałąź `rust-port-wip/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-Q1` (`ec7a0ff78`) zawiera operatora r1 i obronę r1, bez `03-final-control.md`. K5-LOOP nie może być oznaczony jako PORTED przed FC.
