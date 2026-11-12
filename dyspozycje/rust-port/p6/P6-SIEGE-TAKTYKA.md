# P6-SIEGE-TAKTYKA — pokrycie pętli taktycznej oblężenia (#217)

Temat: `R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1` (runda 3, Operator Haiku 5.5; r3 = poprawka po FC r2, zarzut 2).
Baza r3: `bdb8e6f54` (FC r2; kod Rust `3e6c3c084` bez zmian). Pierwotna baza Rust: `258afaf8f` = `origin/rust-port/parity-v2`.
Pin web (tylko odczyt, `git show`): `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.
Źródła pinu: `gra/src/battle/battleScene.ts` (pętla bitwy oblężniczej), `gra/src/battle/siegeWall.ts`, `gra/src/game/siegeAi.ts`, `gra/src/game/mapSiegeDetect.ts`, `gra/src/game/city-fortification.ts`.
Numeracja L2–L5 / L9–L10 wg `dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-LIMIT-BLOKADA.md` (tabela luk).

Legenda statusu: **PORTED** = odpowiednik Rust 1:1 (plik:linia Rust), **PARTIAL** = tylko część funkcji, **BRAK** = brak odpowiednika (powód w kolumnie), **NIE_ZMIERZONO** = nie sprawdzono (dane spoza repo lub poza zakresem deklarowanym niżej).
Klasyfikacja metod (wiersze 32.x, 33.x): **O** = oblężnicza (dotyczy muru, bramy, wieży, taranu), **M** = mieszana (ogólna z gałęzią oblężniczą), **G** = ogólna walka / UI / scena (poza oblężeniem), klasyfikacja wg treści lub, dla metod oznaczonych „wg nazwy”, wg nazwy i wywołań (treść nie czytana w tej rundzie).

Zakres „100% funkcji pętli L2–L5”: wszystkie deklaracje metod `battleScene.ts`, których nazwa pasuje do wzorca `siege|wall|gate|breach|tower|tick|round|rout|morale|check|_ff|fast|rang|_do|sortie|palis|machin|ram|stall|end|draw|winner|verdict|climb|pomin|manual|auto` (wynik `grep -nE "^  (private |public |protected )?(async )?[A-Za-z_]\w*\("` na pinie, odfiltrowany), plus funkcje modułowe z importów. Każda ma wiersz z liniami pinu i statusem. Deklaracje spoza wzorca (np. czysto deploy/kamera/HUD bez logiki) NIE są enumerowane i w tej tabeli NIE są twierdzone jako pokryte — patrz §5.

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
| 9 | `_checkEnd()` — stall, gałąź PAT bez oblężenia (`!isSiege && totalDead > 0`) | `battleScene.ts:10172-10183` (PAT: `:10178-10182`); wejście `_stalled`: `:5568` `_updateStallWatch` (wiersz 33.11) | brak | BRAK | Kandydat na następny klocek (patrz §4, K1). |
| 10 | `_checkEnd()` — „SZTURM ODPARTY" (`isSiege && !wallEverBreached` → `aliveA = false`) | `battleScene.ts:10184-10186` | `domain/siege_tactics_end.rs:41` `siege_no_breach_repels_attack` | PORTED (nowy w r1) | Wektory: `tests/p6_siege_tactics_vectors/vectors.json` (`repels`, 4 przypadki), test `wektory_repels_zgodne_z_webem`. |
| 11 | `_checkEnd()` — morale zalamane (`brokenA && aliveA` → `aliveA = false`) | `battleScene.ts:10189-10192` | brak | BRAK | Zależy od wiersza 8. |
| 12 | `_checkEnd()` — sufit tur w AUTO/ręcznej (`aliveA && aliveD` → `_roundCapVerdict`) | `battleScene.ts:10197-10206` | werdykt: `siege_no_breach.rs:69`; wiring w pętli brak | PARTIAL | Logika werdyktu PORTED (wiersz 3); wpięcie do stanu tury BRAK (D-OBL-4). |
| 13 | `_checkEnd()` — rozstrzygnięcie zwycięzcy (`return false` gdy obie żyją; `atakujacy`/`obronca`; mutual elimination po HP `hpA >= hpD`) | `battleScene.ts:10208-10220` | `domain/siege_tactics_end.rs:49` `battle_winner` | PORTED (nowy w r1) | Wektory: `vectors.json` (`winner`, 432 przypadki, seed 217); testy `wektory_winner_zgodne_z_webem` + 5 testów jawnych. Sumowanie HP z `Math.max(0, hp)` na jednostkę. |
| 14 | `_checkEnd()` — ekran końca, `_battleUnitsForMapExport`, log zwycięstwa | `battleScene.ts:10222-10240` | brak | BRAK | Efekty sceny/mapy poza zakresem. |
| 15 | `wallEverBreached` — ustawianie po wyłomie (`_breachWallTile`) | `battleScene.ts:7638-7647` (funkcja `:7638`, wiersz 33.x: `_breachWallTile`) | brak | BRAK | Stan muru (L3). Zależy od `siegeWallCol`/`wallTileHp` (`_carveWallTiles` `:4026`). |
| 16 | `wallEverBreached` — ustawianie po wyłomie bramy (`_breachGate`) | `battleScene.ts:7757-7759` (funkcja `:7757`) | brak | BRAK | L3; stan bramy `GATE_MAX_HP`. |
| 17 | `wallEverBreached` — ustawianie przez wejście na wieżę (`_trySiegeTowerClimb`) | `battleScene.ts:8056-8072` | brak | BRAK | L3; zależy od `towerAtWallRows`. |
| 18 | `wallEverBreached = true` przy „Pomiń" (machina oblężnicza w składzie) | `battleScene.ts:3718-3721` | brak | BRAK | Ścieżka skip/AUTO; zależy od warstwy bitwy (L5). |
| 19 | `_siegeApproachRestricted(ru)` (blokada zbliżania) | `battleScene.ts:7951-7962` (+ `canShoot` `:1457`, `isSiegeUnit` `:1552`) | brak | BRAK | NIE jest czystym boolem (poprawka po zarzucie 1 audytu R1). Gałęzie z pinu: (a) `return false` gdy `!(siegeWallCol >= 0)` lub `ru.side !== 'atk'`; (b) `return false` gdy `ru.routed`, `ru.onWallWalkway` lub `isSiegeUnit(ru.bu)` (`:7953`); (c) `return false` gdy `ru.primaryRanged && canShoot(ru) && ru.shootingEnabled !== false` (strzelec, `:7954`); (d) gałąź `ru.mounted`: `return !(gateOpen \|\| tileBreached)`, gdzie `tileBreached = siegeWallTilesInit > 0 && wallTileHp.size < siegeWallTilesInit`; (e) pozostali piesi: `return !(wallEverBreached \|\| towerAtWallRows.size > 0)`. Zależy od stanu sceny (`gateOpen`, `wallTileHp`, `towerAtWallRows`, `ru.routed`, `ru.onWallWalkway`) — nie jest czystą funkcją 2×2. Kandydat K2 (§4) tylko po rozbiciu na wejścia. |
| 20 | `_meleeBlockedByWall(ru, e)` (wywołanie `meleeBlockedByWall`) | `battleScene.ts:8361-8372` (wywołanie `:8363`), eksport `:10728` | brak | BRAK | Zależy od geometrii muru i `wallBreached`. Patrz 22 (czysta funkcja pod spodem). |
| 21 | L5: bitwa ręczna i „Pomiń = wynik AUTO" (wspólny `_roundCapVerdict`) | `battleScene.ts:2286`, `:3572`, `:3718-3721`, `:10197-10203` | brak | BRAK | Brak warstwy bitwy ręcznej w Rust (P6-REPIN-OBLEZENIE-LIMIT-BLOKADA L5). Wiersz 33.x `_performSiegeManualOrder` (`:18435`) też BRAK. |
| 22 | `meleeBlockedByWall(ctx)` (import `city-fortification`) | `gra/src/game/city-fortification.ts:76-79` (typ `MeleeWallContext` `:61-70`; import `battleScene.ts:114`; wywołanie `:8363`) | brak (grep `melee_blocked_by_wall` pusty) | BRAK | CZYSTA funkcja (4 pola + `wallBreached`): `wallBreached !== true && attackerIsMelee && !attackerOnWall && defenderOnWall`. Brak modułu `city_fortification` w Rust. Kandydat na klocek (K0a). Zależy od `wallBreached` (wiersze 15–17) jako `bool`. |
| 23 | `attackerWallEntryIsBreach(side, onWallWalkway)` (import `city-fortification`) | `gra/src/game/city-fortification.ts:96-98` (import `battleScene.ts:114`; wywołanie `:8072` w `_trySiegeTowerClimb`) | brak | BRAK | CZYSTA funkcja: `side === 'atk' && onWallWalkway === true`. Kandydat K0a (najmniejszy czysty klocek). Zależy tylko od wejść. |
| 23a | `autoStormBreach(hasSiegeMachine)` (wyłom dla szturmu AUTO) | `gra/src/game/city-fortification.ts:86-88` (komentarz `:81-85`) | brak (grep `auto_storm_breach` pusty) | BRAK | CZYSTA funkcja, 1 linia: zwraca `hasSiegeMachine`. Nie była w r1. Dodana do K0a (ta sama rodzina, zerowe zależności). |
| 24 | `cityFortificationKind(builtBuildingIds)` (import `city-fortification`) | `city-fortification.ts:29-36` (typ `:26`; import `battleScene.ts:114`; wywołanie `battleScene.ts:2741`) | brak | BRAK | Czysta funkcja nad listą identyfikatorów budynków (`mur` > `palisada` > `none`); zależy od danych budynków (`fortKind`). Poza pętlą taktyczną (konstruktor sceny). Także `cityHasFortification` `:39-43`, `cityIsFortified` `:46-51`, `canCaptureCity` `:57-59` — BRAK, czyste, poza pętlą. |
| 25 | `armyMoraleRatioWithoutCommander(units)` (import `game/army-leadership`) | `gra/src/game/army-leadership.ts:39-` (wywołanie `battleScene.ts:9990`, `_armyMoraleRatio` `:9988`) | `domain/army_leadership.rs:123` `army_morale_ratio_without_commander` | PORTED (istniejący, poprzedni temat) | Czysta funkcja; port istnieje — nie wymaga klocka. Zależność: `ArmyLeaderCombatant`. |
| 26 | `commandersToWithdrawAfterArmyBreak(units, threshold)` (import `game/army-leadership`) | `gra/src/game/army-leadership.ts:57-` (wywołanie `battleScene.ts:10170-10171`) | `domain/army_leadership.rs:146` `commanders_to_withdraw_after_army_break` | PORTED (istniejący) | Czysta funkcja; port istnieje. Wiersz 8 (`_checkEnd` morale) nadal BRAK, bo brakuje `_startRout` (wiersz 33.x, efekt sceny). |
| 27 | `isSiegeUnit(bu)` (funkcja lokalna) | `battleScene.ts:1552-1556` (wywołania m.in. `:3720`, `:4455`, `:6091`, `:6187`, `:7953`, `:8023`, `:8057`, `:8088`, `:8140`, `:8367`) | częściowo: `domain/brake_power_army.rs:31` `is_siege_unit(rola_linia)` | PARTIAL | Web bierze `BattleUnit` (typ, `Jednostka`, `nazwa`, nazwa normalizowana); Rust bierze tylko `rola_linia`. Nie 1:1. Czysta funkcja nad danymi jednostki — klocek po zdefiniowaniu wejścia. |
| 28 | `canShoot(ru)` (funkcja lokalna) | `battleScene.ts:1457-1459`: `ru.rangedBase && ru.ammoLeft > 0` | brak (Rust nie ma `RuntimeBattleUnit`; grep `RuntimeBattleUnit` w `rust-port/engine/src` pusty) | BRAK | Czysta (2 pola). Zależy od modelu jednostki w boju (Rust: brak). |
| 29 | `_siegeMoveRefused(ru, col, row)` | `battleScene.ts:7963-8005` | brak | BRAK | Gating ruchu oblężniczego: zależy od wierszy 19, 22 i geometrii muru (`siegeWallCol`). Wywołanie z `_doMove` `:8689`. |
| 30 | `_siegeRamTowerStep` / `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` / `_siegeSafeApproach` | `battleScene.ts:8022-8106` (`_siegeRamTowerStep` `:8022`, `_trySiegeTowerClimb` `:8056`, `_siegeInfantryToTowerStep` `:8087`), `:8107-8138` (`_siegeSafeApproach`) | brak | BRAK | Kroki taranu/wieży/piechoty przy murze; zależą od wierszy 15–17, 22, 23 i pozycji (`towerAtWallRows`). Wejście czystych podfunkcji (warunki `if` na `ru.side`, `ru.mounted`, `isSiegeUnit`, `canShoot`, `wallEverBreached`) — do rozbicia w K2/K4, bez osobnej czystej funkcji w tej rundzie. |
| 31 | Moduły oblężnicze spoza pętli: `siegeWall.ts` (`buildWallTower :1104`, `buildSiegeWall :1190`, `attachRowBreachPanels :1245`), `siegeAi.ts`, `mapSiegeDetect.ts` | `gra/src/battle/siegeWall.ts` (1273 linii), `gra/src/game/siegeAi.ts` (292), `gra/src/game/mapSiegeDetect.ts` (95) | brak | BRAK / poza zakresem | `battleScene.ts` importuje z `siegeWall.ts` wyłącznie funkcje renderu (`:137`); `siegeAi.ts` NIE jest importowany przez `battleScene.ts` (ustalenie r3: `git show 07d2fbd72:gra/src/battle/battleScene.ts \| grep -n siegeAi` → 0 trafień). Importerzy `siegeAi.ts` na pinie: `gra/src/main.ts:541`, `gra/src/game/ai.ts:27`. Szczegóły wiersza AI: 34.x. |
| 32.1 | `_compactAttackAllowsStep` | `battleScene.ts:8139-8174` | brak | BRAK (M) | Doktryna zwarcia; gałęzie `isSiegeUnit` (`:8140`, `:8157`) → wiersz 27. |
| 32.2 | `_rangedFiringStepStaysBehindMelee` | `battleScene.ts:8175-8190` | brak | BRAK (M) | Strzelcy za piechotą; `isSiegeUnit` `:8179` (wiersz 27). |
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
| 32.18 | `_doMove` | `battleScene.ts:8685-8786` | brak | BRAK (M) | Gating oblężniczy `_siegeMoveRefused` `:8689` (wiersz 29). |
| 32.19 | `_doAttack` | `battleScene.ts:8787-8808` | brak | BRAK (G) | Dyspozytor ataku. |
| 32.20 | `_singleBlow` | `battleScene.ts:8809-9018` | brak | BRAK (M) | Mnożnik muru/Cytadeli dla `onWallWalkway`: `wallDefenseMult` `:8824-8856`, `civWallDefenseMultiplier` `:8945-8948`. Reszta = ogólna formuła ciosu. |
| 32.21 | `_resolveBlowOutcome` | `battleScene.ts:9019-9078` | brak | BRAK (G) | Skutek ciosu (HP, morale). |
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
| 33.9 | `_updateStallWatch` | `battleScene.ts:5568-5596` | brak | BRAK (G) | Źródło flagi `_stalled` używanej w `_checkEnd` (wiersz 9, `:10172`). Wejście K1/K3. |
| 33.10 | rodzina AUTO batch: `_beginAutoBatchTurnFromCurrentState` `:5696`, `_beginAutoBatchPhase` `:5707`, `_snapshotAutoBatchIntents` `:5752`, `_cloneForAutoBatchPlanning` `:5822`, `_disposeAutoBatchPlanningRoster` `:5847`, `_launchAutoBatchResolution` `:5865`, `_resolveAutoBatchAttack` `:5907`, `_resolveAutoBatchMovement` `:5924`, `_finishAutoBatchPhase` `:5961` | `battleScene.ts:5696-` (do `:5961+`) | brak | BRAK (G) | Planowanie i wykonanie tury AUTO (wspólne dla sufitu tur, wiersz 12). Nie czytano treści każdej metody w tej rundzie (klasyfikacja wg nazwy). |
| 33.11 | `_rangedAction` / `_rangedForwardStep` / `_rangedBackStep` / `_rangedTargetInRange` / `_rangedApproachStep` | `battleScene.ts:6656-6775`, `:6776-7009`, `:7010-7040`, `:7041-7256`, `:7257-7309` | brak | BRAK (M) | Strzelcy; gałęzie oblężnicze (`canShoot`, `isSiegeUnit` w `:6793`, `:6868`). Klasyfikacja wg nazwy + wywołań. |
| 33.12 | `_attackGate` | `battleScene.ts:7310-7338` | brak | BRAK (O) | Atak na bramę (wg nazwy; treść nie czytana w tej rundzie). |
| 33.13 | `_animateRam` / `_sfxRamImpact` / `_isRam` | `battleScene.ts:7339-7365`, `:7366-7401`, `:7402-7458` | brak | BRAK (O/G) | `_isRam` (`:7402`) = rozpoznanie taranu (O); animacja/SFX (G, scena). |
| 33.14 | `_wallBonusProcFor` / `_isWallCrownShooter` | `battleScene.ts:7459-7466`, `:7467-7489` | brak | BRAK (O, wg nazwy) | Bonus muru i strzelec z korony muru; treść nie czytana w tej rundzie. Wejście mnożnika w 32.20 (`wallDefenseMult`). |
| 33.15 | `_applyTerrainRange` / `_attackRangeFor` | `battleScene.ts:7490-7504`, `:7522-7529` | brak | BRAK (G) | Zasięg terenu i jednostki. |
| 33.16 | `_siegeStructureDamage` / `_siegeMachineRange` | `battleScene.ts:7505-7521`, `:7530-7539` | brak | BRAK (O) | Obrażenia konstrukcji i zasięg machin. |
| 33.17 | `_attackWallTile` | `battleScene.ts:7540-7637` | brak | BRAK (O) | Atak na kafelek muru; prowadzi do `_breachWallTile` (wiersz 15). |
| 33.18 | `_breachWallTile` | `battleScene.ts:7638-7756` | brak | BRAK (O) | Wiersz 15 (`wallEverBreached`). |
| 33.19 | `_breachGate` | `battleScene.ts:7757-7813` | brak | BRAK (O) | Wiersz 16. |
| 33.20 | `_spawnWallLabel` / `_updateSiegeHud` / `_syncSiegeHudChromeVisibility` | `battleScene.ts:7814-7832`, `:7833-7881`, `:7882-7923` | brak | BRAK (G, UI) | Etykiety i HUD oblężenia — poza silnikiem. |
| 33.21 | `_siegeShooterThreats` | `battleScene.ts:7924-7950` | brak | BRAK (O) | Zagrożenia strzelców do `_siegeApproachRestricted` (wiersz 19). |
| 33.22 | `_siegeWalkTo` | `battleScene.ts:8006-8021` | brak | BRAK (O) | Marsz oblężniczy (wywołuje gating z 19/29). |
| 33.23 | `_ffEnterAuto` | `battleScene.ts:3709-` | brak | BRAK (G) | Przejście do trybu AUTO (L5). |
| 33.24 | `_tickProjectiles` / `_tickFades` / `_tickFloatLabels` | `battleScene.ts:9326-9343`, `:9344-9365`, `:9366-9414` | brak | BRAK (G, scena) | Zegar sceny; poza pętlą logiczną (D-OBL-4). |
| 33.25 | `_advanceVClock` / `_scaledWallDelta` | `battleScene.ts:9500-9511`, `:9512-9568` | brak | BRAK (G) | Zegar wirtualny; `wall` = czas ścienny, nie mur. |
| 33.26 | `_renderClashLog` / `_updateMoraleBar` / `_updateArmyMoraleBars` | `battleScene.ts:9569-9651`, `:9652-9694`, `:10097-10152` | brak | BRAK (G, UI) | Log i paski morale. |
| 33.27 | `_gainMorale` / `_applyMoraleDamage` / `_generalMoraleAura` | `battleScene.ts:9695-9719`, `:9722-9760`, `:9720` | brak | BRAK (G) | Morale jednostki; Rust: `combat.rs:254` `morale_factor` to tylko czynnik, nie odpowiednik tych metod. |
| 33.28 | `_checkMeleeScreenLost` / `_checkRout` / `_startRout` | `battleScene.ts:9761-9782`, `:9783-9798`, `:9799-` | brak | BRAK (G) | Rout; `_startRout` (efekt) blokuje wiersz 8 i 11. |
| 33.29 | `_removeCommanderMoraleBonus` / `_disableManualIfCommanderLost` / `_armyCompositionKind` | `battleScene.ts:9993-10006`, `:10007-10041`, `:10042-10071` | brak | BRAK (G, L5 dla manual) | Dowódcy i skład armii. |
| 33.30 | `_sideEndStats` / `_battleSummaryWinner` | `battleScene.ts:10257-10313`, `:10314-10353` | brak | BRAK (G) | Statystyki i zwycięzca do ekranu (wiersz 14). |
| 33.31 | `_resetSiegeForReplay` | `battleScene.ts:10518-10630` | brak | BRAK (O) | Reset stanu oblężenia (replay). |
| 33.32 | `_showEndScreen` / `_showResultBanner` | `battleScene.ts:10666-10738`, `:10739-10781` | brak | BRAK (G, UI) | Efekty końca (wiersz 14/5). |
| 33.33 | `_pickRangedTargetByPriority` / `_unitCanRangedAttack` | `battleScene.ts:17571-`, `:11319-11330` | brak | BRAK (G) | Wybór celu strzelca. |
| 33.34 | `_doRangedAttack` | `battleScene.ts:9179-9295` | brak | BRAK (M) | Atak dystansowy; gałąź machin (wg nazwy). |
| 33.35 | `_destAllowedByBlockade` / `_performSiegeManualOrder` | `battleScene.ts:17809-17930`, `:18435-` | brak | BRAK (O, L5) | Blokada celu; ręczny rozkaz oblężniczy (L5). |

Podsumowanie L2–L5 (po r3): PORTED: 1, 2, 3, 10, 13, 25, 26 (7); PARTIAL: 6, 12, 27 (3); BRAK: pozostałe z powodem. Każdy wiersz 1–35 ma status i numery linii pinu; **brak wierszy NIE_ZMIERZONO** w zakresie wzorca z §0. Wiersz 32 (dawny „NIE_ZMIERZONO 8139–9096”) rozbity na 32.1–32.23; wiersze 20/21 przeniesione na właściwe miejsce numeracji (r3 zarzut 2c).

Klasyfikacja zbiorcza (zakres §0): O (oblężnicza, BRAK) — 15, 16, 17, 19, 20, 22, 23, 23a, 29, 30, 32.9, 33.1–33.5, 33.7, 33.14, 33.16–33.19, 33.21, 33.22, 33.31, 33.35 (oraz 33.12, 33.13 częściowo); M (mieszana) — 32.1, 32.2, 32.10, 32.12–32.14, 32.16, 32.18, 32.20, 33.8, 33.11, 33.34; G (ogólna/UI, poza oblężeniem) — pozostałe.

Najmniejsze czyste funkcje wejścia (bez zależności od stanu sceny): `attackerWallEntryIsBreach` (23), `autoStormBreach` (23a), `meleeBlockedByWall` (22), `canShoot` (28), `cityFortificationKind` i pochodne (24). `_siegeApproachRestricted` (19) NIE jest czystą funkcją.

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
| K1 | `stall_pat_loser(ratio_a, ratio_d) -> BattleSide` (gałąź PAT bez oblężenia) | `:10178-10182` | Z-NB-3 (ratio policzone wejściem); flaga `_stalled` z `_updateStallWatch` (`:5568`, wiersz 33.9) jako `bool` | Czysty, ~10 wektorów. |
| K2 | `siege_approach_restricted_*`: NAJPIERW rozbić wiersz 19 na podfunkcje wejściowe (a)–(e) z tabeli; potem czysty predykat dla gałęzi (d) `mounted` i (e) piesi | `:7951-7962` | wiersze 15–17, 19 (a)–(e) jako `bool`/liczby | Poprawiony opis (zarzut 1): NIE jest 2×2 bool. Wektory obejmują każdą gałąź (a)–(e) osobno. |
| K3 | `end_check_order(...)`: złożenie kroków 10172 (stall) → 10184 → 10189 → 10197 → 10208 w jedną funkcję czystą. **Wymóg z zarzutu 3:** `siege_no_breach_repels_attack` stosować WYŁĄCZNIE wewnątrz `_stalled && alive_a && alive_d`; test K3 musi mieć przypadek `stalled=false` bez zmiany wyniku | `:10172-10220` | K0a, K1, K2, `round_cap_verdict`, `battle_winner`, wiersz 8 jako liczby | Wymaga K1 i wejść morale (wiersz 8) jako liczb. |
| K4 | Automat wyłomu (`wallEverBreached` z trzech zdarzeń) | `:7638, :7757, :8056, :3718` | model muru/bramy (L3) | Decyzja: czy L3 ma być w `domain/`, czy w warstwie stanu. |
| K5 | Pętla tur taktycznych (`_runFastForward` + wpięcie K3) | `:9415-9437`, `:10153` | D-OBL-4: warstwa pętli tur | Najwyższe ryzyko; osobna autoryzacja właściciela (ABC). |
| K6 | Bitwa ręczna / „Pomiń" (L5) | `:3572`, `:3718` | K5 | Poza zakresem engine do czasu K5. |
| K7 | AI stanowiska oblężenia (`decideAISiegeStance` + estymatory, wiersze 34.x) — POZA pętlą L2–L5, nie wchodzi w łańcuch K1–K6 | `gra/src/game/siegeAi.ts:81-292`, wpięcie `main.ts:18051-18052` | konfiguracja `SiegeAi` (`rust-port/engine/src/data/units_combat.rs:260`, już jest), typy `SiegeUnit`/`SiegeCity` | Osobny temat, nie blokuje K1–K6. Zob. §6. |

Zależności: K0a → K3; K1 → K3; K2 → K3; K4 → K2; K3 + K4 → K5 → K6. Kolejność K0a → K1 → K2 → K3 bez zmian względem r2. L9–L10 (SIEGE-NEARBY, UI) poza tą listą (D-OBL-5). K7 niezależny.

## 5. Otwarte

* D-ST-1: pin `07d2fbd72` vs baza `258afaf8f` — funkcje oblężenia w `battleScene.ts` nie były porównywane na poziomie diffu między pinem a `origin/main`; NIE_ZMIERZONO.
* D-ST-2: plik `rust-port/engine/Cargo.lock` powstał lokalnie przy `cargo` (untracked) i NIE jest częścią commita.
* D-ST-3 (zakres): deklaracje `battleScene.ts` spoza wzorca §0 (deploy, kamera, pasek minimapy, `_drawMinimap` `:11961`, `_renderDeploy*`, `_pickGroundTile`, `_tickCameraPanKeys`, `_tickZoom`, `_sfxRout`, `_isManualInputActive`) NIE są enumerowane w tabeli; traktowane jako poza zakresem silnika (UI/wejście). Nie twierdzi się dla nich pokrycia.
* D-ST-4: klasyfikacja wierszy 33.10, 33.12, 33.13, 33.23, 33.33, 33.35 wg nazw metod i wywołań; treść nie była czytana linia po linii w tej rundzie. Rozstrzygnięcie treści — przy klockach K4/K5.

## 6. Handoff UNITS-do-SILNIK_AI-siege-3poziomy.md (wiersze 34.x)

Plik `dyspozycje/_handoff/UNITS-do-SILNIK_AI-siege-3poziomy.md` (146 linii) przeczytany w r3. Jego status „CZEKA wpięcie w `main.ts`” jest **NIEAKTUALNY na pinie `07d2fbd72`**: `gra/src/main.ts:541` importuje `decideAISiegeStance`, `EMPTY_SIEGE_AI_STATE`, `estimateUnitCombatStrength`, `SiegeAiState`; `main.ts:2249-2252` trzyma mapę stanu `siegeAiStateByKey`; `main.ts:18051-18052` wywołuje `decideAISiegeStance(siegeArmy, siegeCity, persisted)`. Handoff: „CZEKA wpięcie” = stan sprzed wpięcia; wpięcie jest na pinie.

| # | Funkcja (`siegeAi.ts`, pin) | Linie | Rust | Status | Uwagi |
|---|---|---|---|---|---|
| 34.1 | `decideAISiegeStance(army, city, state, params)` | `siegeAi.ts:209-284` | brak (grep `decide_ai_siege` / `siege_stance` pusty) | BRAK | Wpięte w `main.ts:18052`. Progi T1/T2/T3 z `SiegeAi` (config). |
| 34.2 | `evaluateSiegeAiAction` (alias zwracający stance) | `siegeAi.ts:285-292` | brak | BRAK | Alias 34.1. |
| 34.3 | `estimateUnitCombatStrength(unit)` | `siegeAi.ts:81-91` | brak | BRAK | Import `ai.ts:27` i `main.ts:541`. |
| 34.4 | `estimateArmyStrength(units)` | `siegeAi.ts:92-102` | brak | BRAK | Zależy od 34.3. |
| 34.5 | `estimateDefenderStrength(units, city)` | `siegeAi.ts:103-117` | brak | BRAK | Garnizon + milicja + bonus muru/terenu (wg handoffu). |
| 34.6 | `siegeStrengthRatio(army, defender)` | `siegeAi.ts:118-130` | brak | BRAK | Stosunek sił → tier. |
| 34.7 | Konfiguracja `siegeAiCfg` (`t1_assault_ratio`, `t2_build_min_ratio`, `t3_starve_min_ratio`, `t2_max_wait_turns`, `units_per_extra_machine`) | `siegeAi.ts:24-52`, `DEFAULT_SIEGE_AI_PARAMS` `:63` | `rust-port/engine/src/data/units_combat.rs:260` `pub struct SiegeAi` (dane) | PARTIAL | Struktura danych jest; logika progów i stałe domyślne nie są w Rust. |

Klocek K7 (§4) jest poza pętlą L2–L5 i nie blokuje K1–K6. Przed startem K7 właściciel rozstrzyga, czy temat AI ma w ogóle wejść w zakres P6 (decyzja produktowa, ABC).
