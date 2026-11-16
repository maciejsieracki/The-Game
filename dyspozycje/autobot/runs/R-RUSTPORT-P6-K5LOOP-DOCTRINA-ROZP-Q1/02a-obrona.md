# 02a-obrona — R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1 (obrona Operatora, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt, bez zmian kodu)
TEMAT: R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1 (rozpoznanie doktryny AUTO, strzelca i muru w ProdBody, #112)
GOAL: odpowiedzieć na zarzuty Evaluatora Z1-Z7 (`caeca2d6b`, `01-rozpoznanie.md`) dowodem z pinu `07d2fbd72` i bazy `origin/rust-port/parity-v2` = `59746d373`; poprawić to, co zarzut wykazał błędnym.
ZMIANY/COMMIT: wyłącznie ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/02a-obrona.md`). Brak zmian w `gra/` i `rust-port/`. Bez push.
TESTY: nie uruchamiano cargo/npm (tryb odczytu). Weryfikacja przez `git show` pinu i bazy oraz `git grep`; polecenia w §9.
BLOKADY: brak technicznych. Zarzut Z2 (zakres „bitwa sterowana przez gracza”) rozstrzygnięty wewnątrz zasady 9 (parytet z webem), bez pytania do właściciela; pozostają NIE_ZMIERZONO z §8.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje werdykty PRZYJMUJĘ/ODRZUCAM i poprawki §2-§7; orkiestrator decyduje o kolejności tematów wg §6 (poprawiona).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push do parity).

Baza pinu: `07d2fbd72:gra/src/battle/battleScene.ts` (20771 linii). Baza Rust: `origin/rust-port/parity-v2` = `59746d373`. Zarzuty dotyczą `01-rozpoznanie.md` z `caeca2d6b`.

---

## 0. Podsumowanie werdyktów

| Zarzut | Werdykt | Istota |
|---|---|---|
| Z1 `_unitBattleClass` / `_prefsForUnit` | PRZYJMUJĘ | Pin 17486-17510 i 17512-17520; stan gracza i domyślna tabela 2328-2332 pominięte. |
| Z2 osiągalność `groupId` / `unitDoctrine` | PRZYJMUJĘ (z korektą) | Oba pola ustawiane tylko w ścieżkach UI. Bez UI obowiązuje `steady`, ale to właśnie ta gałąź jest żywa w domyślnej bitwie (§N2). |
| Z3 martwy kod B9, C7, C8 | PRZYJMUJĘ | Potwierdzone; dodatkowo znaleziona martwa gałąź `_effectiveMetaForUnit` (§N1). |
| Z4 brak `_performSiegeManualOrder` | PRZYJMUJĘ | Pin 18435-18470 z gałęzią doktryny 18443-18444; drugie wejście z `_performPlayerOrder`. |
| Z5 T8 niewykonalny dla piechoty skirmish | PRZYJMUJĘ | Ścieżka `move` 18300-18429 nie jest w żadnym temacie; Rust `perform_player_order` = `false`. |
| Z6 łańcuch else-if w ProdBody | PRZYJMUJĘ | `oblezenie` i `strzelec` są przed `doktryna`; T8 sam nie wystarcza. |
| Z7 (a)-(d) drobiazgi | PRZYJMUJĘ wszystkie cztery | `player_unit_idle` (Rust `turnseq:139`, `350`, stub `loop.rs:456`), 18511, brakujące guardy `shootingEnabled`, precyzja linii. |

Nie odrzucam żadnego zarzutu.

---

## 1. Z1 (istotny): stan gracza w `_priorityScore`: PRZYJMUJĘ

Dowód (pin `07d2fbd72`):
- `_unitBattleClass` — definicja 17486-17490 (`mounted` → `ranged` gdy `primaryRanged || rangedBase` → `melee`).
- `_battleClassLabel` — 17492-17494 (tylko etykieta UI, poza zakresem portu).
- `_prefsForUnit` — 17496-17510. Kolejność wyboru: `ru.useUnitPriorities` + `ru.unitTargetPriorities[ac]` (długość 3) → `_groupMeta.get(ru.groupId).useGroupPriorities` + `groupTargetPriorities[ac]` → domyślne `this._targetPriorities[ac]`.
- `_priorityScore` — 17512-17520: `idx = prefs.indexOf(enemyClass)`, wynik `idx` (lub `prefs.length`), `+0.45` dla `mounted` przeciw `antiCavSpear`.
- Domyślna tabela `_targetPriorities` — pole klasy 2328-2332: `mounted: [mounted, ranged, melee]`, `ranged: [ranged, mounted, melee]`, `melee: [melee, ranged, mounted]`.
- Pola stanu gracza: `RuntimeBattleUnit.unitTargetPriorities` / `useUnitPriorities` (2044-2047), `GroupMeta.groupTargetPriorities` / `useGroupPriorities` (2074-2076), kopiowanie 5840, UI 13239-13379.

Stan w Rust (baza `59746d373`): `git grep -c -E 'battle_class|target_priorit|anti_cav|lastAutoMoveFrom|last_auto_move|unit_doctrine|GroupDoctrine' origin/rust-port/parity-v2 -- rust-port/engine/src` daje trafienia wyłącznie w `siege_tactics_activate.rs` (linie 20 i 118, komentarze). Brak typu, pola i funkcji.

Korekta do raportu:
- §7 („_priorityScore … nie zlokalizowane”) usunąć. Lokalizacja jest w §1 powyżej.
- Dodać do §2 wiersze: `C0a _unitBattleClass` (17486), `C0b _prefsForUnit` (17496), `C0c _targetPriorities` (2328, domyślne, zawsze żywe), `C0d pola stanu gracza` (2044-2047, 2074-2076, UI 13239-13379).
- Ważne: `_targetPriorities` z wartościami domyślnymi jest używane w domyślnej bitwie (§N2), więc T2 nie jest tylko opcją dla gracza.
- Allowlista T2 (§6) musi objąć pola preferencji (nowa struktura w `domain/`, wejście z adaptera) oraz domyślną tabelę.

---

## 2. Z2 (istotny): osiągalność `groupId` i `unitDoctrine`: PRZYJMUJĘ z korektą

Dowód, że pola są ustawiane tylko w ścieżkach UI:
- `groupId: null` przy tworzeniu: 4574 (`_placeSiegeDefenders` 4442), 4720 (`_placeSiegeDefenders`), 5489 (`_placeUnits` 5276), 17262 (`_placeUnitsOneSide` 17082).
- `ru.groupId = gid` tylko w 13877 (`_restoreDeployGroupSnapshot` 13871, UI wdrożenia) i 19808 (`_groupSelected` 19780, UI). Zerowanie: 13785 (`_initDeployUI` 13756), 19767 (`_detachUnitsFromGroups`), 19853 (`_disbandGroup`).
- `unitDoctrine = doctrine` tylko w 17669 (`_setUnitsDoctrine` 17666). Wywołania: 13171 (`_renderDeployTacticsPopup` 13116, popup UI).
- `_setGroupDoctrine` (17864): wywołania 17858 (`_setLineBlockadeFromSelection` 17840, przycisk `#gen-blockade-set`, 18220), 18205 (`_wireGeneralPanelEvents` 18200, panel generała), 19821 (`_groupSelected`, UI).
- `meta.autoPlay = false` tylko w 17868 i 19823 (UI).

Konsekwencja bez UI (domyślna bitwa): `_getEffectiveDoctrine` (17612-17619) zwraca `steady`, a `_isUnitDoctrineAuto` (17621-17631) zwraca `true`. Każda jednostka bez grupy jest więc „doktryną AUTO steady”. To jest prawda, nie zarzut.

Zastrzeżenie (NIE_ZMIERZONO): nie sprawdzono, czy bitwy AI-vs-AI przechodzą przez `battleScene.ts` z grupami. Nie zmierzono, więc nie twierdzę nic o tym przypadku.

Rozstrzygnięcie zakresu (zasada 9: parytet z webem, bez pytania do właściciela): web ma konfigurację doktryny przez UI i port musi przenieść ją wejściem (adapter `BattleSetupDto`), bo inaczej nie jest to parytet. To decyzja techniczna orkiestratora, nie decyzja gameplay. Zapisać w REJESTR-RUST.

Korekta do raportu: dodać kolumnę „osiągalność” (`domyślna bitwa` / `tylko UI`) do §2. Po tej korekcie kolejność tematów wg §6.

---

## 3. Z3 (istotny): martwy kod B9, C7, C8: PRZYJMUJĘ

Dowód łańcucha wywołań:
- `_executeGroupDoctrineStep` (17966) wołany tylko z 6097 (`_activateUnit`, gate 6094-6096 `meta.doctrine !== 'manual'`) i z 18291 (`_performPlayerOrder`, gate 18290 `meta.doctrine !== 'manual'`).
- Typ `GroupDoctrine` (1938) to `'defensive' | 'steady' | 'aggressive' | 'skirmish' | 'manual'`.
- Gałąź domyślna B9 (18051-18082) jest osiągalna tylko przy doktrynie spoza czterech obsłużonych. Jedyna taka wartość to `manual`, a ona jest odfiltrowana w obu wywołujących. B9 jest więc martwy.
- `_doctrineMoveDest` (17931) ma dwa wywołania: 18063 (B9, martwe) i 18103 (`_executeSkirmishDoctrineStep` 18087). Z 18103 `meta.doctrine === 'skirmish'`, więc gałęzie `steady` (17938-17944) i `aggressive` (17947-17952) są nieosiągalne.
- `_attackFormationRallyPoint` (C7, 17707): jedyne wywołanie 17939 (gałąź `steady`) — martwe.
- `_chargeMoveDest` (C8, 17778): jedyne wywołanie 17948 (gałąź `aggressive`) — martwe.
- Sprawdzenie: `git grep` w pinie nie daje innych wywołań (`_attackFormationRallyPoint(`, `_chargeMoveDest(`, `_doctrineMoveDest(`).

Żywe w `_doctrineMoveDest` (dla `skirmish`): `skirmish && (primaryRanged || rangedBase)` → `null` (17932-17934); gałąź `rallyCol` (17954-17958) z `_moveTargetForUnit` (C9) i `_destAllowedByBlockade` (C5); gałąź `_pickTargetByPriority` (17959-17962).

Korekta do raportu:
- B9 oznaczyć „martwy na pinie (nieosiągalny)”. Nie wpinać.
- C7 i C8 oznaczyć „martwe na pinie — NIE_DOTYCZY_PARYTETU”. Nie portować jako wymagane.
- T3 zawęzić do C5, C6, C9 (żywe przez gałąź `rallyCol`).
- Dodatkowo: gałąź `else` w `_effectiveMetaForUnit` (17647-17651, `_pickTargetByPriority`) jest też martwa (§N1).

---

## 4. Z4 (istotny): brak `_performSiegeManualOrder`: PRZYJMUJĘ

Dowód:
- `_performSiegeManualOrder` (18435-18470+): pierwsza linia `if (!(this.siegeWallCol >= 0) || ru.side !== 'atk' || ord.type === 'move') return false;` (18437). Dla `atk` przy murze i rozkazie innym niż `move`: maszyny oblężnicze → `_siegeRamTowerStep` (18440); bezczynny strzelec → `_rangedTargetInRange` + `_doAttack` (18445-18451); gałąź doktryny `doctrineAuto` 18443-18444 (`ord.type === 'none' && _isUnitDoctrineAuto(ru) && _effectiveMetaForUnit(ru).doctrine !== 'manual'`), która przy `none` i `doctrineAuto` przechodzi dalej do obsługi muru (`onWallWalkway` 18453, wejście na wieżę 18458-18459, podejście 18460+).
- `_performPlayerOrder` (18280): wejścia do `_performSiegeManualOrder` w 18286. Do `_performPlayerOrder` wchodzą: `_activateUnit` 6068 (gdy `_manualMode`), gałąź `none` w samym `_performPlayerOrder` (18288-18291 → `_executeGroupDoctrineStep`), `_executeUnitsImmediate` 18608 (wywołanie w funkcji od 18578, UI natychmiastowego rozkazu), B9 18082 i B10 18122 (rozkaz `move`, §5).
- Wniosek: w trybie ręcznym jednostki z doktryną AUTO wykonują doktrynę przez `_performSiegeManualOrder`/`_performPlayerOrder`, nie przez `_activateUnit` gałąź AUTO. Raport tego nie pokazał (zostało tylko w §7 jako „nieprzeczytane”).

Korekta do raportu: dodać wiersze `H1 _performSiegeManualOrder` (18435-18470) i `H2 wejścia _performPlayerOrder` (6068, 18286, 18288-18291, 18608). Klasyfikacja: BRAK w Rust; zakres `tryb-reczny` (poza ProdBody). Decyzja zakresu dla orkiestratora: dopisać do #97/#118 (K5-LOOP-AUTO, tryb ręczny i AUTO w jednej pętli), a nie do T1-T8. Nie jest to decyzja gameplay (zasada 9: parytet z webem).

---

## 5. Z5 (istotny): T8 niewykonalny dla piechoty skirmish: PRZYJMUJĘ

Dowód:
- B10 `_executeSkirmishDoctrineStep` (18087-18123): piechota bez strzału → `_pickAdjacentTargetByPriority` (18098) → `_doctrineMoveDest` (18103) → `ru.playerOrder = { type: 'move', … }` (18119) → `_performPlayerOrder(ru, finish)` (18122).
- B9 (martwe, §3) ma to samo wywołanie w 18082.
- Gałąź `move` w `_performPlayerOrder`: 18300-18429. Wewnątrz: `tc === ru.q` → `none` (18300-18304); `_adjacentEnemy` → `_doAttack` (18306-18309); kierunek greedy `dc/dr` (18311-18313); `isImmediateBacktrack` z `_shouldAvoidAutoBacktrack` (18315-18317); awaryjne ominięcie szyku przez `_firstStepTowardMoveDestination` (18329, definicja 18478) z `_compactAttackAllowsStep` (C10); `_destAllowedByBlockade` (C5); `lastAutoMoveFrom` (18347). Funkcja kończy się `done()` (18427-18428).
- Rust: `ProdOps::perform_player_order` = `false` (`siege_tactics_loop.rs:773-774`). Brak `_firstStepTowardMoveDestination` w Rust (`git grep -n 'first_step_toward\|firstStepToward' origin/rust-port/parity-v2 -- rust-port/engine/src` — nie znaleziono).
- Żaden z T1-T8 nie obejmuje gałęzi `move` 18300-18429. Zarzut trafny.

Korekta do raportu: dodać temat T9 (propozycja): `K5DOC-RUCH-ROZKAZ` — gałąź `move` `_performPlayerOrder` 18300-18429 + `_firstStepTowardMoveDestination` 18478. Allowlista propozycji: `domain/siege_tactics_player_move.rs` (nowy), `tests/p6_k5doc_player_move*`. Zależności: T4 (C10, `_compactAttackAllowsStep`), C5 (T3). Ta sama gałąź jest używana w trybie ręcznym, więc T9 jest również potrzebny dla #97.

---

## 6. Z6 (średni): łańcuch else-if w ProdBody: PRZYJMUJĘ

Dowód (baza `59746d373`, `rust-port/engine/src/domain/siege_tactics_loop.rs`):
- 1035-1045: `let out_of_scope = if self.scene.manual_mode { "tryb-reczny" } else if self.scene.wall_col >= 0 || st.siege_wall_col >= 0 { "oblezenie" } else if pu.activate.can_shoot || pu.activate.primary_ranged { "strzelec" } else if pu.activate.doctrine_auto { "doktryna" } else { None };`
- Gałąź `doktryna` jest osiągalna tylko wtedy, gdy nie zadziałały trzy wcześniejsze. Zdjęcie samego `doktryna` (jak w raporcie 1043-1044) nie uruchamia doktryny dla jednostki w oblężeniu ani dla strzelca.
- Zgodnie z pinem: w bitwie oblężniczej `oblezenie` wyłapuje każdą jednostkę (także atakującą piechotę), a strzelec — `strzelec`.

Korekta do raportu:
- T8 musi zdjąć trzy tagi: `doktryna` (T8), `strzelec` (T5a/T5b, wcześniej), `oblezenie` (#113, razem z wejściem E-wierszy do pętli).
- W §2 dodać kolumnę „działa w ProdBody”. Klasyfikacja PORT-JEST dla E4-E12 i F1-F6 oznacza wyłącznie maszynę (`siege_tactics_activate.rs`); w ProdBody są nieaktywne (tag `oblezenie`).

---

## 7. Z7 (niski): drobiazgi: PRZYJMUJĘ wszystkie cztery

(a) `player_unit_idle`: PRZYJMUJĘ.
- Pin 6020-6024 (`idlePlayerUnit` = `_manualMode && isPlayerSide && playerOrder.type === 'none' && !_isUnitDoctrineAuto(u)`).
- Rust: trait `TurnSeqEnv::player_unit_idle` w `siege_tactics_turnseq.rs:139-140` (komentarz wprost cytuje `_isUnitDoctrineAuto`); wywołanie `siege_tactics_turnseq.rs:350` (`st.manual_mode && st.is_player_side(unit.side) && env.player_unit_idle(unit, st)`); implementacja w `siege_tactics_loop.rs:456-459` to stub `false` z komentarzem „Tryb ręczny poza zakresem sterownika”.
- Wniosek: stub jest poprawny tylko, dopóki tryb ręczny jest poza zakresem. Przy wpięciu trybu ręcznego (#97) trzeba zaimplementować predykat doktryny (zależy od T1). Dopisać wiersz A15 do §2 i zależność do T1/#97.

(b) Lista wywołań `_isUnitDoctrineAuto`: PRZYJMUJĘ.
- Pełna lista w pinie (`grep -n '_isUnitDoctrineAuto('`): 6024, 6093, 13002 (chip AUTO, UI), 17641 (`_effectiveMetaForUnit`), 18288, 18443, 18511.
- 18511 (planner BFS, `_firstStepTowardMoveDestination`-podobny kontekst w `_bfs…`): `if (this._isUnitDoctrineAuto(ru) && this._effectiveMetaForUnit(ru).doctrine === 'steady' && ru.lastAutoMoveFrom?.q === col && …) continue;` — reguła anty-cofania w BFS. Trafne: wejść do T4.
- 17641 wywołanie w `_effectiveMetaForUnit`: trafne, dopisać.

(c) Warunek `shootingEnabled !== false`: PRZYJMUJĘ.
- B2 (defensive): 17971 `canShoot(ru) && ru.shootingEnabled !== false`.
- B5 (steady + strzelec, strzał przed krokiem): 18001.
- B6 (steady + strzelec → `_rangedAction`): 18014.
- B8 (aggressive, strzał): 18032.
- Dodatkowo: B3 `_executeSkirmishDoctrineStep` 18091 `isRanged && ru.shootingEnabled !== false`.
- Korekta: dopisać warunek w §2 przy B2, B5, B6, B8, B3.

(d) Numery linii: PRZYJMUJĘ.
- `_ensureGroupMeta` definicja 17586 (raport „17585-17591” obejmuje pustą linię 17585; poprawne: 17586-17591).
- `_applySkirmishFlagsForUnit` definicja 17658 (raport „~17650”).
- `_applySkirmishFlags` definicja 17817 (raport „~17825”).

---

## 8. Nowe ustalenia (poza zarzutami, znalezione przy obronie)

N1. Martwa gałąź `_effectiveMetaForUnit` 17647-17651: warunek `!groupId && doctrine ∉ {defensive, manual, aggressive}` zostawia `steady` lub `skirmish`, więc gałąź `else` (`_pickTargetByPriority`, 17648) jest nieosiągalna. Nie wpływa na parytet (martwy kod).

N2. Domyślna bitwa (bez UI) jest najbardziej istotnym faktem, a raport go nie wyeksponował. Każda jednostka bez grupy i bez doktryny (`_isUnitDoctrineAuto` = `true`, `steady`) przechodzi przez gałąź AUTO w `_activateUnit` (6093-6097) i w pinie wykonuje:
- mounted: `_cavalryAction` (B4, 17992-17995);
- strzelec w linii: `_pickRangedTargetByPriority` (B5, 18001-18012) i `_rangedAction` (B6, 18014-18016) przy `lineAllowsRangedStep`;
- piechota: `_advanceStep` (B7, 18022-18024, ciało 8198-~8290), które używa `_pickTargetByPriority` (8210), `_pickAdjacentTargetByPriority` (8242), `_shouldAvoidAutoBacktrack`, `lastAutoMoveFrom` (8259, 8274).
W Rust `ProdBody` każda taka jednostka ma tag `doktryna` (siege_tactics_loop.rs:1043-1044) i nie jest wykonywana. Oznacza to, że domyślna bitwa poza oblężeniem nie wykonuje żadnej doktryny w produkcyjnej pętli. Jest to największa luka, nie tylko oblężnicza. Zasugerować orkiestratorowi kolejność: T2, T4, T5a/T5b, T6 przed T1/T3/T7 (które są potrzebne dopiero dla konfiguracji UI).

N3. Rust `ProdOps::player_unit_idle` (`siege_tactics_loop.rs:456`) zwraca `false` — patrz §7(a).

N4. Wejście `_executeUnitsImmediate` (18578, wywołanie 18608): rozkaz natychmiastowy z UI wchodzi do `_performPlayerOrder` — tylko w trybie ręcznym (§4).

---

## 9. Odtwarzalne polecenia (obrona)

Pin (wszystkie w `gra/src/battle/battleScene.ts` @ `07d2fbd72`):
```
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17486,17520p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '2328,2332p;2044,2047p;2074,2076p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '6020,6024p;6087,6097p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17612,17660p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17931,17962p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17966,18050p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '18280,18300p;18300,18330p;18435,18470p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n '_isUnitDoctrineAuto(\|_executeGroupDoctrineStep(\|_doctrineMoveDest(\|_attackFormationRallyPoint(\|_chargeMoveDest('
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n 'lastAutoMoveFrom\|shootingEnabled !== false'
```

Baza (Rust, `git grep` na `origin/rust-port/parity-v2`):
```
git show origin/rust-port/parity-v2:rust-port/engine/src/domain/siege_tactics_loop.rs | sed -n '773,776p;1035,1046p;456,459p'
git show origin/rust-port/parity-v2:rust-port/engine/src/domain/siege_tactics_turnseq.rs | sed -n '139,140p;350p'
git grep -n 'player_unit_idle' origin/rust-port/parity-v2 -- rust-port/engine/src
git grep -c -E 'battle_class|target_priorit|anti_cav|lastAutoMoveFrom|last_auto_move|unit_doctrine|GroupDoctrine' origin/rust-port/parity-v2 -- rust-port/engine/src
git grep -n -E 'first_step_toward|firstStepToward' origin/rust-port/parity-v2 -- rust-port/engine/src
```

Commit obrony: tylko ten plik (`git add dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/02a-obrona.md`), bez push.

---

## 10. Propozycja poprawionego podziału (do §5 raportu, decyzja orkiestratora)

Zmiany względem `01-rozpoznanie.md` §5, wynikające z werdyktów:
- T1 (model): dodać wejście osiągalności (`groupId`/`unitDoctrine` z adaptera, §2) i martwą gałąź usunąć (N1). Bez zmian w allowliście.
- T2 (cele): dodać stan preferencji i domyślną tabelę (§1). Allowlista: nowa struktura w `domain/`, wejście z adaptera. Zależność: żywy w N2 (domyślna bitwa).
- T3 (geometria): zawęzić do C5, C6, C9 (§3). C7, C8 wyłączone.
- T4 (piesza szyk): dodać 18511 (Z7b) i C10 (`_compactAttackAllowsStep`) — bez zmian w allowliście.
- T5a/T5b (strzelec): bez zmian; zdjęcie tagu `strzelec` w ProdBody.
- T6 (jazda), T7 (falanga/cofanie): bez zmian.
- T8 (wiring): zdjęcie `doktryna` i ewentualnie `strzelec`/`oblezenie` z `out_of_scope` (§6). Zależność: T1-T7 i T9.
- T9 (nowy): ruch `_performPlayerOrder` `move` 18300-18429 (§5). Zależność: T4.
- H (nowy, zakres #97/#118): `_performSiegeManualOrder` 18435-18470, `player_unit_idle` (Z7a), wejścia z 18608 (§4). Poza T1-T8.

Kolejność z N2: najpierw żywa domyślna bitwa (T2, T4, T5a/T5b, T6, T9) i dopiero potem konfiguracja UI (T1, T3, T7).

---

## 11. NIE_ZMIERZONO

- Bitwy AI-vs-AI: czy przechodzą przez `battleScene.ts` z grupami (nie sprawdzono; wpływa tylko na zakres UI z Z2).
- Ciała `_cavalryAction` (6372), `_rangedAction` (6656), `_advanceStep` (8198-~8290 w całości), `_firstStepTowardMoveDestination` (18478) — czytane tylko w zakresie potrzebnym do zarzutów.
- Rust `player_unit_idle` i gałąź `move` — nie zaimplementowane, zgodnie z zakresem rozpoznania.
- UI (G4): poza zakresem z założenia.
