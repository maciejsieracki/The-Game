# 01-rozpoznanie — R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1 (runda 1, Operator HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt, bez zmian kodu)
TEMAT: R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1 (rozpoznanie doktryny AUTO, strzelca i muru w ProdBody, #112)
GOAL: wskazać, co pin `07d2fbd72` robi w gałęziach doktryny AUTO, strzelca i muru oblężniczego, co z tego ma odpowiednik w Rust (`origin/rust-port/parity-v2`), i zaproponować podział na tematy portu z allowlistami.
ZMIANY/COMMIT: wyłącznie ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/01-rozpoznanie.md`). Brak zmian w `gra/` i `rust-port/`.
TESTY: nie uruchamiano cargo/npm (tryb odczytu). Weryfikacja wyłącznie przez `git show` pinu i `git grep` na bazie; polecenia odtwarzalne w §8.
BLOKADY: brak blokad technicznych. Pozycje nieprzeczytane w całości wymienione w §7 (NIE_ZMIERZONO).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje tabelę §2 na pinie i bazie; orkiestrator wybiera kolejność tematów z §5.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push do parity).

Baza: `origin/rust-port/parity-v2` = `59746d373` (zweryfikowane). Commit OUTCOME `c3e3617b2` jest przodkiem bazy (`git merge-base --is-ancestor`), więc temat #112 jest odblokowany.
Pin: `07d2fbd72:gra/src/battle/battleScene.ts` (20771 linii).

---

## §0. Korekty do dispatchu (numery linii)

- Dispatch podaje `battleScene.ts:8193-8195` dla `_effectiveMetaForUnit` / `_isUnitDoctrineAuto`. W pinie pod tymi liniami jest `_shouldAvoidAutoBacktrack` (8191-8196). Właściwe definicje: `_getEffectiveDoctrine` 17612, `_isUnitDoctrineAuto` 17621, `_effectiveMetaForUnit` 17633.
- Gałąź AUTO w `_activateUnit`: bramka 6087-6097 (`siegeDefenderNeverDoctrine` 6087, `siegeMachineNeverDoctrine` 6091, warunek 6092, wywołanie `_executeGroupDoctrineStep` 6097). Zakres 6071-6097 z dispatchu jest poprawny jako szerszy kontekst.
- Pozostałe punkty startowe z dispatchu (1938, 2040-2059, 6794, 8138-8140, 8176) potwierdzone: 1938 `type GroupDoctrine`, 2041 `unitDoctrine`, 2059 `doctrine`, 6794 `lineAllowsRangedStep`, 8139-8140 `_compactAttackAllowsStep`, 8175-8176 `_rangedFiringStepStaysBehindMelee`.

## §1. Wynik w skrócie

1. **Produkcyjna pętla Rust nie wykonuje doktryny ani strzelca.** `ProdBody` (`siege_tactics_loop.rs:1036-1046`) kieruje do `unported` każdą aktywację w jednym z czterech przypadków: tryb ręczny (`tryb-reczny`), oblężenie (`oblezenie`, gdy `wall_col >= 0`), strzelec (`strzelec`), doktryna AUTO (`doktryna`). Zwracana wartość `ProdOps::doctrine_step` to na stałe `false` (`siege_tactics_loop.rs:776-778`).
2. **Szkielet gałęzi `_activateUnit` jest przeniesiony.** `activate_unit` (`siege_tactics_activate.rs:210-473`) ma tagi `U7.0-…` do `U7.9-…`, które odpowiadają liniom pinu 6071-6298. Bramka doktryny (`siege_tactics_activate.rs:246-260`) jest zgodna z pinem 6087-6097. Ciała akcji, które wołają te gałęzie, są w większości BRAK.
3. **Ciała doktryny i strzelca nie istnieją w Rust.** `_executeGroupDoctrineStep` (pin 17966-18083) oraz ~30 funkcji, które wywołuje, nie mają odpowiednika. Nie znaleziono `priority_score`, `blockade`, `kite`, `advance_step`, `ranged_action`, `cavalry_action`, `phalanx_action`, `fall_back`, `GroupDoctrine`, `GroupMeta`, `skirmish` (zob. §8, polecenie 3).
4. **Zakres oblężenia — rozbieżność zakresu, nie logiki.** Pin blokuje doktrynę tylko dla obrońców (gdy `siegeWallCol >= 0`) i dla machin atakującego (6087-6091). Atakująca piechota i strzelcy w oblężeniu wykonują doktrynę w pinie. W Rust cała gałąź oblężenia jest poza zakresem `ProdBody` (`siege_tactics_loop.rs:1038-1039`, komentarz `:556`: „sterownik K5-LOOP obsluguje tylko oblezenie; AUTO bez oblezenia poza zakresem”). Efekt: w produkcyjnej pętli oblężenia atakująca piechota nie wykonuje doktryny. To jest ROZBIEŻNE zakresowo i zostaje zapisane w §5 (T8) i §6 (Q1).
5. **Wektory.** Nie istnieje żaden wektor z wartościami oczekiwanymi dla doktryny ani strzelca. Testy maszyny używają atrapy `doctrine_step` (`p6_siege_tactics_activate.rs:57-58, 326`). Test `p6_siege_tactics_loop_body.rs:302` sprawdza jedynie, że `doctrine_auto = true` trafia do `unported`.

---

## §2. Tabela: wywołanie → pin → klasyfikacja → Rust

Legenda klasyfikacji: PORT-JEST (odpowiednik istnieje i jest wywoływany), PORT-CZĘŚCIOWY (istnieje część), BRAK (brak odpowiednika), ROZBIEŻNE (istnieje, ale inny zakres/zachowanie), WEJŚCIE (wartość przychodzi z adaptera, nie jest wyliczana), UI (NIE_ZMIERZONO, poza portem).
Rust podano jako `plik:linia` w `rust-port/engine/src/domain/`, o ile nie zaznaczono inaczej.

### A. Bramki AUTO i stan jednostki

| # | Wywołanie | plik:linia pinu | Klasyfikacja | Odpowiednik Rust | Uwagi |
|---|---|---|---|---|---|
| A1 | `_getEffectiveDoctrine` | 17612-17619 | BRAK | — | Dziedziczenie doktryny z jednostki/grupy. W Rust brak funkcji. |
| A2 | `_isUnitDoctrineAuto` | 17621-17631; wołane 6024, 6093, 18288, 18443 | WEJŚCIE | `siege_tactics_activate.rs:81-82` (`doctrine_auto`, `doctrine_manual`) | Rust przyjmuje wynik jako bool. Wyliczenie (`ru.unitDoctrine != null`, `meta.autoPlay`) BRAK. |
| A3 | `_effectiveMetaForUnit` | 17633-~17655; wołane 6095, 6794, 8140, 8176, 18289, 18444, 18511 | BRAK | — | Zwraca `GroupMeta` z `rallyCol` = `_forwardCol(side,q,2)` dla jednostki bez grupy (typ steady/skirmish). |
| A4 | `_ensureGroupMeta` | 17585-17591 | BRAK | — | Domyślnie `{doctrine:'steady', autoPlay:true}`. |
| A5 | Typ `GroupDoctrine` | 1938 | BRAK | — | `'defensive' \| 'steady' \| 'aggressive' \| 'skirmish' \| 'manual'`. |
| A6 | Pola `unitDoctrine` / `GroupMeta.doctrine` | 2041, 2059 | BRAK | — | `ProdUnit` (`siege_tactics_loop.rs:734-760`) nie ma pola doktryny. |
| A7 | Bramka doktryny w `_activateUnit` (ręczny → pominięcie, `meta.doctrine !== 'manual'`) | 6092-6097 | PORT-JEST | `siege_tactics_activate.rs:246-260` | Zdarzenie `DoctrineStep`, gałąź `U7.0-doctrine` (`:260`). Ciało: `ProdOps::doctrine_step` = `false` (`siege_tactics_loop.rs:776`). |
| A8 | `siegeDefenderNeverDoctrine` = `ru.side==='def' && siegeWallCol>=0` | 6087 | PORT-JEST | `siege_tactics_activate.rs:246` | Bez zmian semantycznych. |
| A9 | `siegeMachineNeverDoctrine` = `ru.side==='atk' && siegeWallCol>=0 && isSiegeUnit` | 6091 | PORT-JEST | `siege_tactics_activate.rs:247` | Wejście `is_siege_unit` z `siege_tactics_classify.rs:148`. |
| A10 | Ręczny: `_performPlayerOrder` (tryb ręczny gracza) | 6068 | WEJŚCIE | `siege_tactics_activate.rs:117`; `ProdOps::perform_player_order` = `false` (`siege_tactics_loop.rs:773`) | Poza zakresem `ProdBody` (`tryb-reczny`, `:1036-1037`). |
| A11 | `_applyTerrainRange` (zasięg terenu, wołane przed bramką) | 6064; ciało 7490 | BRAK | `ProdOps::apply_terrain_range` = identyczność (`siege_tactics_loop.rs:769-771`) | `siege_tactics_approach.rs:24` potwierdza: „Nie portowano … `_applyTerrainRange`”. |
| A12 | Okrążenie (FACTOR 5, `surroundApplied`, `_checkRout`) | 6102-6119 | PORT-JEST | `siege_tactics_activate.rs:270-286` (`U7.0-surround`, `U7.0-surround-flee`); `siege_tactics_loop.rs:1348, 1360` (`check_rout`, `start_rout`) | Efekty stosowane w `ProdBody::complete` (`siege_tactics_loop.rs:1138`). |
| A13 | `_updateFacing` (zwrot ku najbliższemu wrogowi) | 8334-8341; wołane 6123 | PORT-JEST | `siege_tactics_loop.rs:941-965` (`update_facing`), zdarzenie `UpdateFacing` `:1094`; `siege_tactics_activate.rs:291` | Komentarz r4 (K5LOOP-FACING) w `:723-730`. |
| A14 | `_nearestEnemy` / `_nearestEnemyMelee` | 8296-8313; 8315-8333 | PORT-CZĘŚCIOWY | `siege_tactics_loop.rs:797-799` (`nearest_enemy_pos` = `None` w `ProdOps`); `update_facing` ma własne wyszukanie (`:941`) | Wyszukiwanie najbliższego w `ProdOps` BRAK; w `update_facing` jest. |

### B. Doktryna — ciało `_executeGroupDoctrineStep` (pin 17966-18083)

| # | Wywołanie / gałąź | plik:linia pinu | Klasyfikacja | Odpowiednik Rust | Uwagi |
|---|---|---|---|---|---|
| B1 | `_executeGroupDoctrineStep` (wejście: `ru`, `meta`, `done`) | 17966-18083 | BRAK | `ProdOps::doctrine_step` = `false` (`siege_tactics_loop.rs:776-778`) | Zwraca `true`, gdy wykonało akcję. |
| B2 | Gałąź `defensive`: strzał w zasięgu → `_pickRangedTargetByPriority`, potem sąsiad → `_pickAdjacentTargetByPriority`, inaczej `done()` | 17967-17985 | BRAK | — | Zachowuje strzelców w linii, gdy cel w zasięgu. |
| B3 | Gałąź `skirmish` → `_executeSkirmishDoctrineStep` | 17986-17990; ciało 18087-18122 | BRAK | — | Ostrzał/kit: `rangedKite=true`, `_rangedAction`. |
| B4 | `steady` + `mounted` → `_cavalryAction` | 17992-17995 | BRAK (wywołanie `_cavalryAction` = U7.7 PORT-JEST w maszynie, `siege_tactics_activate.rs:455-457`) | — | Jazda idzie do `_cavalryAction`, nie do rozkazu szyku. |
| B5 | `steady` + strzelec z amunicją + cel w zasięgu → strzał | 18001-18012 | BRAK | — | Komentarz: strzał przed krokiem szyku. |
| B6 | `steady` + strzelec bez celu w zasięgu → `_rangedAction` | 18014-18016 | BRAK | — | Wywołanie `_rangedAction` (6656). |
| B7 | `steady` (pozostali) → `_advanceStep` | 18022-18024 | BRAK | — | Marsz szykiem (`_compactAttackAllowsStep`, A9 w §2 pkt. C). |
| B8 | `aggressive`: jazda → `_cavalryAction`; strzał; sąsiad; `moveLeft<=0` → `done`; `_advanceStep` | 18027-18049 | BRAK | — | Szturm: bez szyku, BFS do wroga. |
| B9 | Gałąź domyślna (inne doktryny): strzał, sąsiad, `_doctrineMoveDest`, `_performPlayerOrder(finish)` | 18051-18082 | BRAK | — | Ścieżka `manual`/nieznane; po `_doctrineMoveDest`. |
| B10 | `_executeSkirmishDoctrineStep` | 18087-18122 | BRAK | — | Strzelec: `_rangedAction`; piechota: sąsiad, `_doctrineMoveDest`, `_destAllowedByBlockade`. |
| B11 | `_doctrineMoveDest` | 17931-17962 | BRAK | — | Gałęzie: skirmish strzelca→null; defensive→null; steady→`_attackFormationRallyPoint`; aggressive→`_chargeMoveDest`; inaczej rally/priorytet. |

### C. Pomocnicze doktryny (wybór celu, ruch, szyk)

| # | Wywołanie | plik:linia pinu | Klasyfikacja | Odpowiednik Rust | Uwagi |
|---|---|---|---|---|---|
| C1 | `_priorityScore(ru, enemy)` | 17512-17520 | BRAK | — | Zależy od `_unitBattleClass` i `_prefsForUnit` (nie zlokalizowane w tej rundzie, §7). Bonus +0.45 dla jazdy przeciw włóczni (`antiCavSpear`). |
| C2 | `_pickTargetByPriority` | 17523-~17543 | BRAK | — | Najlepszy cel wg `_priorityScore`, dystans jako tie-break. |
| C3 | `_pickAdjacentTargetByPriority` | 17545-17569 | BRAK | `ProdOps::melee_target` (wejście adaptera, `siege_tactics_loop.rs:740, 791`) | Preferencja `desiredHitForDirection` (kierunek ataku). Rust przyjmuje wynik z adaptera. |
| C4 | `_pickRangedTargetByPriority` | 17571-17583 | BRAK | — | Cel w zasięgu `d<=range && d>=1`. |
| C5 | `_destAllowedByBlockade` | 17809-17815 | BRAK | — | Blokada linii (`blockadeActive`, `blockadeCol`). `pathfinding.rs:1172` dotyczy innej reguły (rekrutacja w oblężonym mieście). |
| C6 | `_forwardCol` / `_advanceDir` / `_clampColTowardEnemy` | 6748-6758 | BRAK | — | Kierunek marszu: atk +1, def -1. |
| C7 | `_attackFormationRallyPoint` | 17707-~17777 | BRAK | — | Punkt zbiórki szyku ataku (`_groupCentroid`, `_groupSide`). |
| C8 | `_chargeMoveDest` (+ `_bestChargeStepKey`) | 17778-~17808 | BRAK | — | Szturm: najlepszy krok w kierunku celu. |
| C9 | `_moveTargetForUnit` | 11442-11446 | BRAK | — | Przesunięcie `formationOffset` + clamp do planszy. Brak `formation_offset` w Rust. |
| C10 | `_compactAttackAllowsStep` (szyk: nie cofaj się, rząd, `previous`) | 8139-8170 | PORT-CZĘŚCIOWY | `formation_rules.rs:423` (`compact_line_allows_advance`, funkcja czysta) | Opakowanie (`mounted`, `isSiegeUnit`, `formationRank`, filtr `previous`) BRAK. |
| C11 | `_rangedFiringStepStaysBehindMelee` (strzelec nie wyprzedza linii) | 8175-8189 | BRAK | — | Wywołanie z `lineAllowsRangedStep` (6794-6797). |
| C12 | `lineAllowsRangedStep` (wybór bramki kroku strzelca) | 6794-6797 | BRAK | — | Gałąź `steady` → C11; inaczej C10. |
| C13 | `_shouldAvoidAutoBacktrack` | 8191-8196 | BRAK | — | Antycofanie w doktrynie `steady`. |
| C14 | `_advanceStep` (krok piechoty w szyku/BFS) | 8198-~8290 | BRAK | — | Używa C13, `_pickTargetByPriority` (8210), `_doMove`. Ciało tylko częściowo przeczytane (§7). |
| C15 | `_doctrineMoveDest` / `_moveTargetForUnit` → `_doMove` | 8221, 8273 | BRAK | — | Wywołania `_doMove` wewnątrz `_advanceStep`. |

### D. Strzelec (zasięg, wybór celu, strzał, kite)

| # | Wywołanie | plik:linia pinu | Klasyfikacja | Odpowiednik Rust | Uwagi |
|---|---|---|---|---|---|
| D1 | `canShoot(ru)` = `rangedBase && ammoLeft > 0` | 1457-1459 | PORT-JEST | `siege_tactics_classify.rs:175` (`can_shoot`) | Kontrakt: czyta tylko `rangedBase` i `ammoLeft` (`siege_tactics_activate.rs:72`). |
| D2 | `_rangedAction` (KITE 6690-6720; SHOOT 6728; APPROACH 6738) | 6656-6738 | BRAK (ciało); gałąź U7.5 PORT-JEST | `siege_tactics_activate.rs:417-419` (`U7.5-ranged`); w `ProdBody` poza zakresem (`strzelec`, `siege_tactics_loop.rs:1042`) | Trójgałęziowy priorytet: cofnij, strzelaj, zbliżaj. |
| D3 | `_rangedForwardStep` | 6776-6814 | BRAK | — | Krok w kierunku wroga, zatrzymanie w zasięgu (`manhattan <= ru.range`, 6805). |
| D4 | `_bestForwardStep` | 6822-~6904 | BRAK | — | Wybór kroku w szyku strzelca. |
| D5 | `_bestKiteShotStep` | 6959-~7015 | BRAK | — | Krok wstecz utrzymujący cel w zasięgu. `MELEE_SAFE_GAP=2` (pin 968). |
| D6 | `_rangedTargetInRange` | 7041-~7052 | WEJŚCIE | `siege_tactics_activate.rs:123-125` (`ranged_target_in_range`); `ProdOps` = `None` (`siege_tactics_loop.rs:788-789`) | Strzał po zasięgu terenu. |
| D7 | `_targetInRange` (sąsiad lub zasięg dla `canShoot`) | 8373-~8385 | WEJŚCIE | `siege_tactics_activate.rs:126-128` (`target_in_range`); `ProdOps` = `melee_target` (`siege_tactics_loop.rs:791`) | Wybór celu przez adapter, nieportowany. |
| D8 | `_fallBackStep` (cofnięcie po wyczerpaniu amunicji, `FALLBACK_TILES`) | 7228-~7245 | BRAK (ciało); gałąź U7.6 PORT-JEST | `siege_tactics_activate.rs:424-450` (`U7.6-*`); `FALLBACK_TILES=3.0` `:43` (pin 1161) | Ciało poza zakresem `ProdBody` (`strzelec`). |
| D9 | `primaryRanged` bez amunicji (dryCol, heldAfterFallback) | 6249-6276 | PORT-JEST (maszyna) | `siege_tactics_activate.rs:424-450` | Stan `dryCol`/`heldAfterFallback` nie jest niesiony przez `ProdBody` (`siege_tactics_loop.rs:1041`). |
| D10 | `_doAttack` → `_singleBlow` (strzał i cios) | 8787; 8809 | PORT-CZĘŚCIOWY | `siege_tactics_blow.rs:234` (`single_blow`), `siege_tactics_blow_full.rs:335` (`single_blow_full`); `ProdBody::strike` `siege_tactics_loop.rs:1162`; `counter_strike` `:1431` | `rangedDamageMult` i składanie wejścia (K5I2b) są w Rust. Ścieżka strzału poza `ProdBody` nieaktywna. |
| D11 | `_skipInstantFallback` — nieistotne dla doktryny | 3715-3748 | PORT-JEST (osobny temat) | `siege_tactics_instant.rs` | Tylko kontekst. |

### E. Wyjątki muru i oblężenia (`siegeWallCol`, `onWallWalkway`, `isSiegeUnit`)

| # | Wywołanie / gałąź | plik:linia pinu | Klasyfikacja | Odpowiednik Rust | Uwagi |
|---|---|---|---|---|---|
| E1 | `isSiegeUnit(bu)` | 1552-1559 | PORT-JEST | `siege_tactics_classify.rs:148` (`is_siege_unit`) | |
| E2 | `isSiegeTower(bu)` | 1561 | PORT-JEST | `siege_tactics_classify.rs` / `siege_tactics_class_adapters.rs` | Wejście `_siegeTowerClimb`. |
| E3 | `_isRam` / `_isCatapult` | 7402, 7408 | PORT-JEST | `siege_tactics_class_adapters.rs` (K1/K3, `KLASY-WIRE`) | |
| E4 | Gałąź muru `onWallWalkway` (strzał z muru, cios w zwarciu, hold) | 6126-6171 | PORT-JEST (maszyna) | `siege_tactics_activate.rs:293-337` (`U7.1-*`) | `ProdBody` poza zakresem (`oblezenie`, `siege_tactics_loop.rs:1038-1039`). |
| E5 | Wieża: `_trySiegeTowerClimb` | 6179; ciało 8056-8086 | PORT-JEST (maszyna i moduł) | `siege_tactics_activate.rs:342-352` (`U7.2-climb`); `siege_tactics_tower.rs` | `ProdOps::tower_climb` = `false` (`siege_tactics_loop.rs:779`). |
| E6 | Wieża: `_siegeInfantryToTowerStep` | 6180; ciało 8087-~8106 | PORT-JEST (moduł) | `siege_tactics_tower.rs:439` (`siege_infantry_to_tower_step`); maszyna `:348-350` | `ProdOps::infantry_to_tower` = `false` (`siege_tactics_loop.rs:782`). |
| E7 | Taran / wieża atakującego: `_siegeRamTowerStep` | 6187-6192; ciało 8022-8055 | PORT-JEST (maszyna i moduł) | `siege_tactics_activate.rs:354-361`; `siege_tactics_tower.rs` (ram) | `ProdOps::ram_tower_step` = `false` (`siege_tactics_loop.rs:785`). |
| E8 | Katapulta: strzał w kafel muru / podejście `(wallCol-1)` | 6193-6220 | PORT-CZĘŚCIOWY | `siege_tactics_activate.rs:362-386` (`U7.3-cata-*`); `siege_tactics_breach.rs:108` (`attack_wall_tile`); podejście `siege_tactics_walk.rs` | Ciało driver-a poza zakresem. |
| E9 | `_attackWallTile` (guard `siegeWallCol>=0`) | 7540-~7560 | PORT-JEST (moduł) | `siege_tactics_breach.rs:108, 125` | |
| E10 | `_siegeMachineRange` | 7530-~7539 | BRAK | — | Nie znaleziono `siege_machine_range`. Nieczytane (§7). |
| E11 | `_advanceToward` (katapulta) | 7892 | PORT-CZĘŚCIOWY | `siege_tactics_walk.rs:235` (`siege_walk_to`), `siege_tactics_approach.rs:189, 231` | Wrapper `_advanceToward` BRAK. |
| E12 | `SIEGE DEFENDER HOLD` (obrońca nie wychodzi, strzał/cios tylko w sąsiedztwie) | 6222-6236 | PORT-JEST (maszyna) | `siege_tactics_activate.rs:396-411` (`U7.4-*`) | Poza zakresem `ProdBody`. |
| E13 | `_meleeBlockedByWall` | 8361-~8372 | PORT-JEST | `siege_city_fortification.rs:66` (`melee_blocked_by_wall`) | |
| E14 | Warunek `_siegeMoveRefused` / `_siegeSafeApproach` | 7953, 8107-8135 | PORT-JEST (moduł) | `siege_tactics_approach.rs:150-151, 189, 231` | |

### F. Gałęzie maszyny bez odpowiednika w ciele (ruch, jazda, falanga, ucieczka)

| # | Wywołanie | plik:linia pinu | Klasyfikacja | Odpowiednik Rust | Uwagi |
|---|---|---|---|---|---|
| F1 | `_cavalryAction` (cel jazdy, sąsiad nie-włócznik, manewr) | 6372-~6425 | BRAK (ciało); gałąź U7.7 PORT-JEST | `siege_tactics_activate.rs:455-457` | `ProdBody` poza zakresem (`doktryna`/`strzelec`). |
| F2 | `_cavalryTarget` / `_cavAdjacentNonSpear` | 6326-6350; 6351-~6365 | BRAK | — | |
| F3 | `_cavDirectedManeuverStep` / `_cavManeuverStep` (omijanie włóczni) | 6426-6456; 6457-~6500 | BRAK | — | Komentarz „C-FLANK” w pinie 6382-6390. |
| F4 | `_phalanxAction` (spójność szyku falangi) | 6546-~6565 | BRAK (ciało); gałąź U7.8 PORT-JEST | `siege_tactics_activate.rs:461-463` | |
| F5 | `_fleeStep` (ucieczka po rout) | 9845-~9870 | BRAK (ciało); gałąź U7.0-flee PORT-JEST | `siege_tactics_activate.rs:230`; `siege_tactics_autobatch.rs:278` (`flee_step` jako wejście env) | `ProdBody`: `ucieczka-routed` (`siege_tactics_loop.rs:1030-1031`). |
| F6 | Melee: `_advanceStep` (U7.9) | 6293-6298 | BRAK (ciało) | `siege_tactics_activate.rs:467-473` (`U7.9-advance`) | |

### G. Typy, stan gracza i UI

| # | Element | plik:linia pinu | Klasyfikacja | Uwagi |
|---|---|---|---|---|
| G1 | `_setGroupDoctrine` (ustawia `meta.doctrine`, `autoPlay`) | 17864-~17890 | BRAK (logika stanu) | Wywoływane z 17858, 19821. |
| G2 | `_setUnitsDoctrine` (per jednostka, reset `playerOrder`) | 17666-~17697 | BRAK (logika stanu) | Wywoływane z popupów taktyki. |
| G3 | `_applySkirmishFlagsForUnit` / `_applySkirmishFlags` | ~17650, ~17825 | BRAK | `rangedKite=true`, `shootingEnabled=true` dla strzelców. |
| G4 | `_doctrineLabel`, chipy AUTO, panel generała | 17698, 13002, 13167, 18131 | UI — NIE_ZMIERZONO | Poza portem silnika. |

---

## §3. Co już istnieje w Rust (potwierdzone `git grep`)

- Klasy jednostek: `can_shoot` (`siege_tactics_classify.rs:175`), `is_siege_unit` (`:148`), klasy adapterów (`siege_tactics_class_adapters.rs`), `pick_tower_target` (`siege_tactics_tower.rs:486`).
- Maszyna gałęzi `_activateUnit`: `activate_unit` (`siege_tactics_activate.rs:210`), `FALLBACK_TILES` (`:43`), bramka doktryny i muru (`:246-260`), tagi U7.0-U7.9.
- Ciało driver-a: `ProdBody` (`siege_tactics_loop.rs:852`), `update_facing` (`:941`), `strike` (`:1162`), `counter_strike` (`:1431`), `check_rout` / `start_rout` (`:1348`, `:1360`).
- Mur: `melee_blocked_by_wall` (`siege_city_fortification.rs:66`), `attacker_wall_entry_is_breach` (`:76`), `attack_wall_tile` (`siege_tactics_breach.rs:108`), `siege_infantry_to_tower_step` (`siege_tactics_tower.rs:439`), `siege_walk_to` (`siege_tactics_walk.rs:235`).
- Szyk pomocniczy: `compact_line_allows_advance` (`formation_rules.rs:423`), bez wrapper-a z pinu.

## §4. Wektory

Istniejące pliki testowe (wszystkie w `rust-port/engine/tests/`) dotyczące obszaru:

- `p6_siege_tactics_activate.rs` (+ `_gen.mjs`, `_vectors/vectors.json`): kolejność gałęzi U7.x, atrapa `doctrine_step`.
- `p6_siege_tactics_loop_body.rs` (+ `_pin.rs`, `_gen.mjs`, `_vectors/`): `ProdBody`; `doctrine_auto` → `unported` (`:302`).
- `p6_k5loop_outcome_pin.rs`: efekty ciosu (`doctrine_auto: false`).
- `p6_siege_tactics_classify.rs`, `p6_siege_tactics_class_adapters.rs`: `canShoot`, `isSiegeUnit`, `isSiegeTower`, `_isRam`, `_isCatapult`.
- `p6_siege_tactics_walk.rs`, `p6_siege_tactics_tower.rs`, `p6_siege_tactics_approach.rs`, `p6_siege_tactics_approach_k1.rs`, `p6_siege_city_fortification.rs`, `p6_siege_tactics_inputs_wall.rs`, `p6_siege_tactics_breach.rs`.
- `p6_k5_auto_vectors.rs`: tylko `_finishAutoBatchPhase` (V5) i `_haltAutoBattleTurn` (V6); V15/V16 zgłoszone jako BLOCK w nagłówku pliku.
- `p6_combat_*.rs`: walka dystansu/zwarcia (`resolveCombat`), nie doktryna.

Brakuje (do dopisania przy tematach §5): wektorów pinu dla C1-C15, D2-D9, F1-F6 oraz B1-B11. Żaden istniejący plik nie zawiera oczekiwanych wartości doktryny ani strzelca.

## §5. Propozycja podziału na tematy portu

Każdy temat = jedna funkcja logiki + wektory. Allowlisty są propozycją; nazwy plików nowych modułów wymagają zgody orkiestratora.

| Kolejność | Temat | Zakres pinu | Allowlista (propozycja) | Zależności | Równolegle z |
|---|---|---|---|---|---|
| T1 | K5DOC-MODEL | A1-A6 (`_getEffectiveDoctrine`, `_isUnitDoctrineAuto`, `_effectiveMetaForUnit` bez rally, `_ensureGroupMeta`, typy `GroupDoctrine`/`GroupMeta`), G2 | `domain/siege_tactics_doctrine_meta.rs` (nowy), `domain/mod.rs`, `tests/p6_k5doc_meta*.rs` + `_vectors/` + `_gen.mjs` | brak | T2, T6 |
| T2 | K5DOC-CELE | C1-C5, D6, D7 (`_priorityScore`, `_pickTargetByPriority`, `_pickAdjacentTargetByPriority`, `_pickRangedTargetByPriority`, `_rangedTargetInRange`, `_destAllowedByBlockade`) | `domain/siege_tactics_doctrine_target.rs` (nowy), `tests/p6_k5doc_target*.rs` | brak twardej; `_priorityScore` wymaga `_unitBattleClass`/`_prefsForUnit` (§7) | T1, T6 |
| T3 | K5DOC-GEOMETRIA | C6, C7, C8, C9 (`_forwardCol`, `_attackFormationRallyPoint`, `_chargeMoveDest`, `_moveTargetForUnit`) | `domain/siege_tactics_doctrine_geo.rs` (nowy), `tests/p6_k5doc_geo*` | T1, T2 | — |
| T4 | K5DOC-PIESZY-SZYK | C10, C13, C14, C15 (`_compactAttackAllowsStep` wrapper, `_shouldAvoidAutoBacktrack`, `_advanceStep`) | `domain/siege_tactics_doctrine_step.rs` (nowy), `domain/formation_rules.rs` (wrapper, bez zmiany funkcji czystej) | T1, T2, T3 | — |
| T5a | K5DOC-STRZELEC-KITE | D5, D2 (KITE) | `domain/siege_tactics_ranged_kite.rs` (nowy), `tests/p6_k5doc_kite*` | T2, stan `rangedKite`/`dryCol` (D9) | T5b, T6, T7 |
| T5b | K5DOC-STRZELEC-MARSZ | C11, C12, D3, D4, D2 (APPROACH) | `domain/siege_tactics_ranged_forward.rs` (nowy), `tests/p6_k5doc_forward*` | T2, T4 (C10) | T5a, T6, T7 |
| T6 | K5DOC-JAZDA | F1, F2, F3 (`_cavalryAction`, `_cavalryTarget`, `_cavAdjacentNonSpear`, manewry) | `domain/siege_tactics_cavalry.rs` (nowy), `tests/p6_k5doc_cavalry*` | T2 | T1 (równolegle), T5a, T5b, T7 |
| T7 | K5DOC-FALANGA-COFANIE | F4, D8 (`_phalanxAction`, `_fallBackStep`) | `domain/siege_tactics_phalanx_fallback.rs` (nowy), `tests/p6_k5doc_phalanx*` | T4, stan D9 | T5a, T5b, T6 |
| T8 | K5DOC-KROK-DOKTRYNY-WIRING | B1-B11, G3 (`_executeGroupDoctrineStep`, `_executeSkirmishDoctrineStep`, `_doctrineMoveDest`); wpięcie `ProdOps::doctrine_step` (`siege_tactics_loop.rs:776`) i zdjęcie `doktryna` z `out_of_scope` (`:1043-1044`) | `domain/siege_tactics_loop.rs`, `domain/siege_tactics_doctrine_dispatch.rs` (nowy), testy `p6_siege_tactics_loop_body*` | T1-T7 | — |

Uwagi do kolejności:
- T1 i T2 są niezależne i mogą iść równolegle (rozłączne allowlisty).
- T5a, T5b, T6, T7 mogą iść równolegle po zamknięciu T2/T4 (rozłączne pliki); T5b wymaga T4.
- T8 jest ostatni i dotyka `siege_tactics_loop.rs`, który jest współdzielony z #109 K5LOOP-OUTCOME, #113 K5LOOP-WIRING i #147-#150. Konflikt z tymi tematami wymaga koordynacji (§6, Q1).
- Stan `rangedKite`, `dryCol`, `heldAfterFallback` (D9, `ProdBody` nie niesie) jest przeszkodą dla T5a/T5b/T7. To zmiana modelu stanu (`ProdUnit`), nie decyzja gameplay; orkiestrator powinien dodać ją do allowlisty T5a jako pierwszy krok.

## §6. Pytania do orkiestratora

Nie podejmuję decyzji. Poniżej tylko to, czego web nie rozstrzyga w tej rundzie lub co dotyczy kolejności.

**Q1 (kolejność, nie gameplay): czy wpiąć doktrynę w pętlę oblężenia razem z portem (T8), czy zostawić ją w #113.**

- Opis: w pinie doktryna dla atakującej piechoty i strzelców działa także w oblężeniu (bramka 6087-6097 blokuje tylko obrońców i machiny). W Rust `ProdBody` wyklucza całe oblężenie przed sprawdzeniem doktryny (`siege_tactics_loop.rs:1038-1039`), więc atakująca piechota w oblężeniu nie wykonuje doktryny. Każda odpowiedź zmienia to, który temat zamyka tę lukę i kiedy pętla oblężenia jest kompletna.
- A: wpiąć T8 w tym samym temacie co #113 (pętla oblężenia zamknięta w jednym kroku). Zaleta: jedna integracja, luka zamknięta od razu. Wada: większy temat dotykający `siege_tactics_loop.rs` i konflikt z #109/#147-#150.
- B: T1-T7 jako osobne tematy z wektorami, T8 jako wpięcie w #113 po integracji wszystkich K5DOC. Zaleta: mniejsze tematy, łatwiejsza weryfikacja, mniejszy konflikt na `siege_tactics_loop.rs`. Wada: przez pewien czas Rust ma gotowe funkcje bez wpięcia, a luka w oblężeniu pozostaje.
- C: T8 jako osobny temat po #113 (wpięcie pętli oblężenia najpierw bez doktryny, doktryna dopiero potem). Zaleta: najmniej zmian naraz. Wada: pętla oblężenia zostaje niepełna w zakresie AUTO i wymaga drugiej integracji.
- Rekomendacja: **B**. Powód: T1-T7 nie dotykają `siege_tactics_loop.rs`, więc mogą iść równolegle bez konfliktu, a wpięcie T8 razem z #113 zamyka lukę jedną zmianą w pliku, który i tak jest przepisywany przez #113. Oczekiwany rezultat: parytet zakresu oblężenia po integracji #113 + T8.

## §7. NIE_ZMIERZONO (nie przeczytano lub nie rozstrzygnięto)

- `_advanceStep` (pin 8198-~8290): przeczytane tylko początek i gałęzie dotyczące `dirTarget`/`_doMove`; pełny planer nie przeczytany.
- `_priorityScore` (17512): zależności `_unitBattleClass` i `_prefsForUnit` nie zlokalizowane w pinie w tej rundzie; w Rust nie ma żadnego odpowiednika (`git grep` bez trafień dla `battle_class|prefs_for_unit|anti_cav|formation_offset`).
- `_fleeStep` (9845): ciało nieprzeczytane.
- `_cavManeuverStep` (6457) i `_cavDirectedManeuverStep` (6426): ciała tylko zasygnalizowane (wywołania 6390, 6392, 6436-6441, 6489-6496).
- `_phalanxAction` (6546): przeczytany początek (`lineFront`), reszta nieprzeczytana.
- `_siegeMachineRange` (7530): nieprzeczytane.
- `_attackFormationRallyPoint` (17707) i `_chargeMoveDest` (17778): ciała tylko częściowo; `_bestChargeStepKey` nieprzeczytane.
- `_bestForwardStep` (6822), `_bestKiteShotStep` (6959), `_rangedTargetInRange` (7041): nieprzeczytane w całości.
- Ścieżka `_performPlayerOrder` z doktryny (18280-18330, wywołanie 18288-18291): nieprzeczytana; w Rust `perform_player_order` = `false` (poza zakresem).
- UI (G4): NIE_ZMIERZONO z założenia (poza portem silnika).
- Rust: `_applyTerrainRange` (A11) — nie znaleziono nazwy `terrain_range` ani `apply_terrain_range` z implementacją (tylko passthrough w `ProdOps` i trait w `siege_tactics_activate.rs:116`). Przyjęte jako BRAK.

## §8. Odtwarzalne polecenia

Pin (odczyt):
```
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '6087,6097p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17966,18083p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17512,17583p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '8139,8200p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '6656,6738p'
```

Baza (Rust, `git grep` na `origin/rust-port/parity-v2`):
```
git grep -n -E '\bdoctrine|[Dd]octrine|skirmish|[Bb]lockade|priority_score|MELEE_SAFE_GAP|FALLBACK_TILES|kite' origin/rust-port/parity-v2 -- rust-port/engine/src
git grep -n -E 'fn (doctrine_step|ranged_target_in_range|target_in_range|apply_terrain_range|update_facing|activate_unit|compact_line_allows_advance|is_siege_unit|can_shoot|melee_blocked_by_wall|attack_wall_tile)' origin/rust-port/parity-v2 -- rust-port/engine/src/domain
git grep -n -E 'out_of_scope|oblezenie|"strzelec"|"doktryna"' origin/rust-port/parity-v2 -- rust-port/engine/src/domain/siege_tactics_loop.rs
git show origin/rust-port/parity-v2:rust-port/engine/src/domain/siege_tactics_loop.rs | sed -n '1034,1046p'
git grep -l -E 'doctrine|steady|skirmish|rangedBase|onWallWalkway' origin/rust-port/parity-v2 -- rust-port/engine/tests
```

## Wnioski krótko

- Doktryna AUTO i strzelec: w Rust nie ma żadnej logiki wyboru celu, ruchu ani strzału z pinu. Istnieje tylko bramka i szkielet maszyny.
- Mur: wyjątki z pinu (defender, machiny, hold, walkway, wieża, taran, katapulta) mają odpowiedniki w maszynie i modułach (PORT-JEST). Brakuje ich wpięcia w pętlę, bo `ProdBody` wyklucza oblężenie.
- Najpierw T1 i T2 (model i cele), potem ruch (T3, T4), strzelec i jazda (T5a/T5b, T6, T7), na końcu wpięcie (T8), zsynchronizowane z #113 wg Q1.
