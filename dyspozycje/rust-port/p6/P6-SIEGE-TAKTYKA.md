# P6-SIEGE-TAKTYKA — pokrycie pętli taktycznej oblężenia (#217)

Temat: `R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1` (runda 1, Operator Haiku 5.5).
Baza Rust: `rust-port/parity-v2` = `258afaf8f` (zweryfikowane `git rev-parse origin/rust-port/parity-v2`).
Pin web (tylko odczyt, `git show`): `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.
Źródła pinu: `gra/src/battle/battleScene.ts` (pętla bitwy oblężniczej), `gra/src/battle/siegeWall.ts`, `gra/src/game/siegeAi.ts`, `gra/src/game/mapSiegeDetect.ts`.
Numeracja L2–L5 / L9–L10 wg `dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-LIMIT-BLOKADA.md` (tabela luk).

Legenda: **PORTED** = odpowiednik Rust 1:1 (plik:linia Rust), **PARTIAL** = tylko część funkcji, **BRAK** = brak odpowiednika (powód w kolumnie), **NIE_ZMIERZONO** = nie sprawdzono w tej rundzie.

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
| 8 | `_checkEnd()` — morale: `_armyMoraleRatio`, `brokenA/brokenD`, rout dowódców | `battleScene.ts:10160-10171`, `:9988` (`_armyMoraleRatio`) | brak | BRAK | Wymaga modelu morale armii (Z-NB-3); `commandersToWithdrawAfterArmyBreak` poza zakresem tematu. |
| 9 | `_checkEnd()` — stall, gałąź PAT bez oblężenia (`!isSiege && totalDead > 0`) | `battleScene.ts:10172-10183` (PAT: `:10178-10182`) | brak | BRAK | Kandydat na następny klocek (patrz §4, K1). |
| 10 | `_checkEnd()` — „SZTURM ODPARTY" (`isSiege && !wallEverBreached` → `aliveA = false`) | `battleScene.ts:10184-10186` | `domain/siege_tactics_end.rs:41` `siege_no_breach_repels_attack` | PORTED (nowy w tej rundzie) | Wektory: `tests/p6_siege_tactics_vectors/vectors.json` (`repels`, 4 przypadki), test `wektory_repels_zgodne_z_webem`. |
| 11 | `_checkEnd()` — morale zalamane (`brokenA && aliveA` → `aliveA = false`) | `battleScene.ts:10189-10192` | brak | BRAK | Zależy od wiersza 8. |
| 12 | `_checkEnd()` — sufit tur w AUTO/ręcznej (`aliveA && aliveD` → `_roundCapVerdict`) | `battleScene.ts:10197-10206` | werdykt: `siege_no_breach.rs:69`; wiring w pętli brak | PARTIAL | Logika werdyktu PORTED (wiersz 3); wpięcie do stanu tury BRAK (D-OBL-4). |
| 13 | `_checkEnd()` — rozstrzygnięcie zwycięzcy (`return false` gdy obie żyją; `atakujacy`/`obronca`; mutual elimination po HP `hpA >= hpD`) | `battleScene.ts:10208-10220` | `domain/siege_tactics_end.rs:49` `battle_winner` | PORTED (nowy w tej rundzie) | Wektory: `vectors.json` (`winner`, 432 przypadki, seed 217); testy `wektory_winner_zgodne_z_webem` + 5 testów jawnych. Sumowanie HP z `Math.max(0, hp)` na jednostkę. |
| 14 | `_checkEnd()` — ekran końca, `_battleUnitsForMapExport`, log zwycięstwa | `battleScene.ts:10222-10240` | brak | BRAK | Efekty sceny/mapy poza zakresem. |
| 15 | `wallEverBreached` — ustawianie po wyłomie (`_breachWallTile`) | `battleScene.ts:7638-7647` | brak | BRAK | Stan muru (L3). Zależy od `siegeWallCol`/`wallTileHp` (`_carveWallTiles` `:4026`). |
| 16 | `wallEverBreached` — ustawianie po wyłomie bramy (`_breachGate`) | `battleScene.ts:7757-7759` | brak | BRAK | L3; stan bramy `GATE_MAX_HP`. |
| 17 | `wallEverBreached` — ustawianie przez wejście na wieżę (`_trySiegeTowerClimb`) | `battleScene.ts:8056-8072` | brak | BRAK | L3; zależy od `towerAtWallRows`. |
| 18 | `wallEverBreached = true` przy „Pomiń" (machina oblężnicza w składzie) | `battleScene.ts:3718-3721` | brak | BRAK | Ścieżka skip/AUTO; zależy od warstwy bitwy (L5). |
| 19 | `_siegeApproachRestricted(ru)` (blokada zbliżania) | `battleScene.ts:7951-7959` (+ `canShoot` `:1457`, `isSiegeUnit` `:1552`) | brak | BRAK | NIE jest czystym boolem (poprawka po zarzucie 1 audytu R1). Gałęzie z pinu: (a) `return false` gdy `!(siegeWallCol >= 0)` lub `ru.side !== 'atk'`; (b) `return false` gdy `ru.routed`, `ru.onWallWalkway` lub `isSiegeUnit(ru.bu)`; (c) `return false` gdy `ru.primaryRanged && canShoot(ru) && ru.shootingEnabled !== false` (strzelec); (d) gałąź `ru.mounted`: `return !(gateOpen \|\| tileBreached)`, gdzie `tileBreached = siegeWallTilesInit > 0 && wallTileHp.size < siegeWallTilesInit`; (e) pozostali piesi: `return !(wallEverBreached \|\| towerAtWallRows.size > 0)`. Zależy od stanu sceny (`gateOpen`, `wallTileHp`, `towerAtWallRows`, `ru.routed`, `ru.onWallWalkway`) — nie jest czystą funkcją 2×2. Kandydat K2 (§4) tylko po rozbiciu na wejścia. |
| 22 | `meleeBlockedByWall(ctx)` (import `city-fortification`) | `gra/src/game/city-fortification.ts:76-79` (import `battleScene.ts:114`; wywołanie `:8363`) | brak (grep `melee_blocked_by_wall` pusty) | BRAK | CZYSTA funkcja (4 pola + `wallBreached`). Brak modułu `city_fortification` w Rust. Kandydat na klocek mniejszy niż K1 (zarzut 2). Zależy od `wallBreached` (wiersze 15–17). |
| 23 | `attackerWallEntryIsBreach(side, onWallWalkway)` (import `city-fortification`) | `gra/src/game/city-fortification.ts:96-98` (import `battleScene.ts:114`; wywołanie `:8072` w `_trySiegeTowerClimb`) | brak | BRAK | CZYSTA funkcja: `side === 'atk' && onWallWalkway === true`. Najmniejszy czysty klocek w tabeli — kandydat do K1/K2 zamiast większego. Zależy tylko od wejść. |
| 24 | `cityFortificationKind(builtBuildingIds)` (import `city-fortification`) | `city-fortification.ts:29` (import `battleScene.ts:114`; wywołanie `:2741`) | brak | BRAK | Czysta funkcja nad listą identyfikatorów budynków; zależy od danych budynków (`fortKind`). Poza pętlą taktyczną (konstruktor sceny), NIE_ZMIERZONO zakres danych. |
| 25 | `armyMoraleRatioWithoutCommander(units)` (import `game/army-leadership`) | `gra/src/game/army-leadership.ts:39-` (wywołanie `battleScene.ts:9990`, `_armyMoraleRatio` `:9988`) | `domain/army_leadership.rs:123` `army_morale_ratio_without_commander` | PORTED (istniejący, poprzedni temat) | Czysta funkcja; port istnieje — nie wymaga klocka. Zależność: `ArmyLeaderCombatant`. |
| 26 | `commandersToWithdrawAfterArmyBreak(units, threshold)` (import `game/army-leadership`) | `gra/src/game/army-leadership.ts:57-` (wywołanie `battleScene.ts:10170-10171`) | `domain/army_leadership.rs:146` `commanders_to_withdraw_after_army_break` | PORTED (istniejący) | Czysta funkcja; port istnieje. Wiersz 8 (`_checkEnd` morale) nadal BRAK, bo brakuje `_startRout` (efekt sceny). |
| 27 | `isSiegeUnit(bu)` (funkcja lokalna) | `battleScene.ts:1552-1556` (wywołania m.in. `:3720`, `:7953`, `:8023`, `:8057`, `:8088`, `:8140`) | częściowo: `domain/brake_power_army.rs:31` `is_siege_unit(rola_linia)` | PARTIAL | Web bierze `BattleUnit` (typ, `Jednostka`, `nazwa`, nazwa normalizowana); Rust bierze tylko `rola_linia`. Nie 1:1. Czysta funkcja nad danymi jednostki — klocek po zdefiniowaniu wejścia. |
| 28 | `canShoot(ru)` (funkcja lokalna) | `battleScene.ts:1457-1459`: `ru.rangedBase && ru.ammoLeft > 0` | brak (Rust nie ma `RuntimeBattleUnit`) | BRAK | Czysta (2 pola). Zależy od modelu jednostki w boju (Rust: brak). |
| 29 | `_siegeMoveRefused(ru, col, row)` | `battleScene.ts:7963-` | brak | BRAK | Gating ruchu oblężniczego: zależy od wierszy 19, 22 i geometrii muru (`siegeWallCol`). |
| 30 | `_siegeRamTowerStep` / `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` / `_siegeSafeApproach` | `battleScene.ts:8022-8106`, `:8107-8138` | brak | BRAK | Kroki taranu/wieży/piechoty przy murze; zależą od wierszy 15–17, 22, 23 i pozycji (`towerAtWallRows`). Pojedynczych klocków czystych nie wyodrębniono (NIE_ZMIERZONO). |
| 31 | Moduły oblężnicze spoza pętli: `siegeWall.ts` (`buildWallTower :1104`, `buildSiegeWall :1190`, `attachRowBreachPanels :1245`), `siegeAi.ts`, `mapSiegeDetect.ts`, `UNITS-do-SILNIK_AI-siege-3poziomy.md` | `gra/src/battle/siegeWall.ts` (1273 linii), `gra/src/game/siegeAi.ts` (292), `gra/src/game/mapSiegeDetect.ts` (95) | brak | BRAK / poza zakresem | `battleScene.ts` importuje z `siegeWall.ts` wyłącznie funkcje renderu (`:137`); `siegeAi.ts` i `mapSiegeDetect.ts` NIE są importowane przez `battleScene.ts` (grep importów) — są poza pętlą taktyczną. Handoff `UNITS-do-SILNIK_AI-siege-3poziomy.md` NIE_ZMIERZONO (nie czytano w tej rundzie). |
| 32 | Metody `_compactAttackAllowsStep`, `_rangedFiringStepStaysBehindMelee`, `_shouldAvoidAutoBacktrack`, `_enemiesOf`, `_nearestEnemy*`, `_stepToward`, `_canAttackFrom`, `_doAttack`, `_singleBlow`, `_doMeleeAttack`, … (`battleScene.ts:8139-9096`) | `battleScene.ts:8139-9096` | częściowo (silnik walki poza pętlą oblężenia) | NIE_ZMIERZONO | Ogólna mechanika walki (nie oblężnicza) lub zależna od sceny; NIE rozstrzygnięto każdej metody. Nie twierdzi się „100%” dla tego zakresu. |
| 20 | `_meleeBlockedByWall(ru, e)` (`wallBreached` w eksporcie) | `battleScene.ts:8361-8366`, eksport `:10728` | brak | BRAK | Zależy od geometrii muru i `wallBreached`. |
| 21 | L5: bitwa ręczna i „Pomiń = wynik AUTO" (wspólny `_roundCapVerdict`) | `battleScene.ts:2286`, `:3572`, `:3718-3721`, `:10197-10203` | brak | BRAK | Brak warstwy bitwy ręcznej w Rust (P6-REPIN-OBLEZENIE-LIMIT-BLOKADA L5). |

Podsumowanie L2–L5 (po r2, wiersze 1–32): PORTED: 1, 2, 3, 10, 13, 25, 26 (7); PARTIAL: 6, 12, 27 (3); BRAK: pozostałe z powodem; NIE_ZMIERZONO: 32 (zakres metod 8139–9096). Pokrycie „co do funkcji wymienionych w wierszach z numerami linii pinu” = 100% wierszy (każdy ma status). Pokrycie „100% funkcji pętli L2–L5” NIE jest wykazane: wiersz 32 jest NIE_ZMIERZONO, a metody `battleScene.ts:8139-9096` nie zostały rozstrzygnięte pojedynczo. Czyste funkcje wejścia (wiersze 22–26, 28) — patrz §3 i §4.

## 2. Tabela pokrycia — SIEGE-NEARBY-STAN L9–L10

| # | Element | Linie pinu | Rust | Status | Powód |
|---|---|---|---|---|---|
| L9 | `commitBesiege` / `startMapSiege` / `siegeArmyGroupId` | `main.ts` (web) | brak (pole `oblega_city_id`: `domain/siege_sortie.rs:68`, `domain/recruitment.rs:430`) | BRAK (UI) | Warstwa UI/mapy, D-OBL-5. |
| L10 | `inheritSiegeOnJoin` (dołączanie do armii oblegającej poza miastem) | `armyMerge.ts` (web) | brak (`domain/siege_enter_city.rs` tylko wejście po kapitulacji) | BRAK | Wymaga warstwy stanu gry (D-OBL-5). |

Dla L6–L8 (`besiegeArmyGroups`, `besiegeLockTargets`, `stackGroupIdOf`) status PORTED jest w `domain/siege_nearby_lock.rs:38,55,76` (poprzedni temat, poza tą rundą).

## 3. Port w tej rundzie (klocek K0)

* Moduł: `rust-port/engine/src/domain/siege_tactics_end.rs` (nowy), rejestracja `domain/mod.rs` (`pub mod siege_tactics_end;`).
* Funkcje: `siege_no_breach_repels_attack` (pin `:10184-10186`), `battle_winner` (pin `:10208-10220`), enum `BattleSide`.
* Wektory: generator `rust-port/engine/tests/p6_siege_tactics_gen.mjs` (Node 22, wycięte fragmenty JS bez typów TS, bez `this.`); wynik `rust-port/engine/tests/p6_siege_tactics_vectors/vectors.json` (4 + 432 przypadki, seed 217).
* Testy: `rust-port/engine/tests/p6_siege_tactics_end.rs` (7 testów).
* ZAŁOŻENIE Z-ST-1: wycięta funkcja JS jest kopią 1:1 logiki pinu, a NIE wynikiem uruchomienia bundla weba (`battleScene.ts` ciągnie cały DOM/Three.js). Wektory dowodzą równoważności wycinka, nie całej sceny.
* ZAŁOŻENIE Z-ST-2: `battle_winner` przyjmuje już policzone flagi `alive` (web `!dead && !fadingOut && !routed`); ich wyliczenie to wiersz 7 (BRAK).
* NIE_ZMIERZONO: `cargo test` na całym workspace poza `--lib` i `--test p6_siege_tactics_end`; bramki z dispatchu wykonano w crate `rust-port/engine`.

## 4. Plan kolejnych klocków (kolejność i zależności)

| Krok | Klocek | Pin | Zależy od | Uwagi |
|---|---|---|---|---|
| K0a | `attacker_wall_entry_is_breach(side_atk, on_walkway)` + `melee_blocked_by_wall(ctx)` (wiersze 22–23) | `city-fortification.ts:76-79, 96-98` | wiersze 15–17 jako `bool` | Dwie czyste funkcje, najmniejsze w tabeli (zarzut 2). Wektory z pinu jak K0. Zalecane przed K1. |
| K1 | `stall_pat_loser(ratio_a, ratio_d) -> BattleSide` (gałąź PAT bez oblężenia) | `:10178-10182` | Z-NB-3 (ratio policzone wejściem) | Czysty, ~10 wektorów. |
| K2 | `siege_approach_restricted_*`: NAJPIERW rozbić wiersz 19 na podfunkcje wejściowe (a)–(e) z tabeli; potem czysty predykat dla gałęzi (d) `mounted` i (e) piesi | `:7951-7959` | wiersze 15–17, 19 (a)–(e) jako `bool`/liczby | Poprawiony opis (zarzut 1): NIE jest 2×2 bool. Wektory obejmują każdą gałąź (a)–(e) osobno. |
| K3 | `end_check_order(...)`: złożenie kroków 10172 (stall) → 10184 → 10189 → 10197 → 10208 w jedną funkcję czystą. **Wymóg z zarzutu 3:** `siege_no_breach_repels_attack` stosować WYŁĄCZNIE wewnątrz `_stalled && alive_a && alive_d`; test K3 musi mieć przypadek `stalled=false` bez zmiany wyniku | `:10172-10220` | K0a, K1, K2, `round_cap_verdict`, `battle_winner`, wiersz 8 jako liczby | Wymaga K1 i wejść morale (wiersz 8) jako liczb. |
| K4 | Automat wyłomu (`wallEverBreached` z trzech zdarzeń) | `:7638, :7757, :8056, :3718` | model muru/bramy (L3) | Decyzja: czy L3 ma być w `domain/`, czy w warstwie stanu. |
| K5 | Pętla tur taktycznych (`_runFastForward` + wpięcie K3) | `:9415-9437`, `:10153` | D-OBL-4: warstwa pętli tur | Najwyższe ryzyko; osobna autoryzacja właściciela (ABC). |
| K6 | Bitwa ręczna / „Pomiń" (L5) | `:3572`, `:3718` | K5 | Poza zakresem engine do czasu K5. |

Zależności: K1 → K3; K2 → K3; K4 → K2; K3 + K4 → K5 → K6. L9–L10 (SIEGE-NEARBY, UI) poza tą listą (D-OBL-5).

## 5. Otwarte

* D-ST-1: pin `07d2fbd72` vs baza `258afaf8f` — funkcje oblężenia w `battleScene.ts` nie były porównywane na poziomie diffu między pinem a `origin/main`; NIE_ZMIERZONO.
* D-ST-2: plik `rust-port/engine/Cargo.lock` powstał lokalnie przy `cargo` (untracked) i NIE jest częścią commita.
