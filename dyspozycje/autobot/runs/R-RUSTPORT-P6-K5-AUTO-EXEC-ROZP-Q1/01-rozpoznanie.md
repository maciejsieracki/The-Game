STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1 (runda 1, rozpoznanie `_executeUnitsImmediate`)
GOAL: Zmapować `_executeUnitsImmediate` (pin `07d2fbd72`, `gra/src/battle/battleScene.ts:18578`) i jego zależności, zaklasyfikować każde wywołanie stanu bitwy i zaproponować podział portu.
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1/01-rozpoznanie.md`). Kod, `rust-port/`, `gra/`, `origin/main` nietknięte.
TESTY: NIE DOTYCZY (tryb wyłącznie odczyt, bez cargo). Weryfikacja: `git grep` w `rust-port/engine/src` i `rust-port/renderer/src` (polecenia w §5), odczyt pinu przez `git show 07d2fbd72:gra/src/battle/battleScene.ts`.
BLOKADY: brak blokad odczytu. Uwaga: pin nie zawiera ciał funkcji `_findPlayerUnit`-owych ponad to, co wymienione niżej; klasyfikacja `_pickAdjacentTargetByPriority` i `_battleRosterOrder` NIE_ZMIERZONO (nie czytano ciał).
RUNDY: 1/5
NASTĘPNY KROK: Operator/Orkiestrator decyduje o kolejności tematów z §4 (propozycja: T1 najpierw, bo wszystko inne zależy od kształtu kolejki).
DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push do parity-v2, bez integracji).

Baza: `origin/rust-port/parity-v2` = `474487792` (worktree przełączony detached na tę bazę zgodnie z dispatchem). Pin `07d2fbd72`: `battleScene.ts` = 20771 linii.

---

## 1. Ciało `_executeUnitsImmediate` (pin 18578–18614)

```
18578 private _executeUnitsImmediate(unitIds: string[]): void {
18579   this._autoBattleSuspended = false;
18580   const queue = unitIds.filter(id => { u = _findPlayerUnit(id); return u && !u.dead && !u.removed && !u.routed && !u.acted && !_queuedOrderUnitIds.has(id); });
18585   const runNext = (idx) => {
18586     if (idx >= queue.length) { _refreshQueuedOrderVisuals(); return; }
18590     if (this.busy) { _schedule(40, () => runNext(idx)); return; }      // 18601
18592/18597/18605/18610 -> runNext(idx+1) (brak id, brak jednostki, acted/dead/routed)
18608   _performPlayerOrder(u, () => { u.acted = true; runNext(idx + 1); });
18613 runNext(0);
```

Wywołania z `_executeUnitsImmediate` (pin): `:3610`, `:18649` (`_issueBattleAttack`), `:18677` (`_issueBattleMove`), `:18699` (`_issueBattleAttackMove`). Komentarz `:18690` mówi wprost, że aktywacje są szeregowane i zajętość jest odświeżana między członkami.

## 2. Tabela wywołań

Legenda klasyfikacji: **PORT-JEST** = odpowiednik istnieje w Rust (plik:linia); **BRAK** = brak portu, logika gry (wymagany port); **STUB** = istnieje symbol, ale ciało zwraca wartość zastępczą; **UI** = prezentacja/animacja/komunikat (poza silnikiem, NIE_ZMIERZONO w silniku).

| Wywołanie | Pin plik:linia | Klasyfikacja | Odpowiednik Rust (plik:linia) | Uwagi |
|---|---|---|---|---|
| `_executeUnitsImmediate` | 18578 | BRAK | brak (grep: `execute_units`, `executeUnitsImmediate` — 0 trafień) | Punkt wejścia sekwencji rozkazów gracza. |
| `_findPlayerUnit(id)` | 12432 | BRAK | brak osobnej funkcji; jednostki są `UnitRef` w `TurnSeqState` (`siege_tactics_walk.rs`, `siege_tactics_turnseq.rs:342` `st.unit(unit)`) | Wyszukiwanie po id — logika trywialna, ale brak wspólnego lookupu. |
| filtr `dead/removed/routed/acted/queued` (18580–18583) | 18580–18583 | PORT-JEST (częściowo) | `siege_tactics_turnseq.rs:300–346` (`queued_order_ids`, `auto_battle_suspended`), `siege_tactics_activate.rs` (pola `dead`, `routed`, `acted`-pochodne) | Brak pola `acted` w `TurnSeqState` jako jawnego filtra kolejki — do potwierdzenia przy T1. |
| `this._autoBattleSuspended = false` | 18579 | PORT-JEST | `siege_tactics_turnseq.rs:344` (`st.auto_battle_suspended`) | Stan gry (flaga przerwania AUTO). |
| `_queuedOrderUnitIds` (Set) | 2306, 18582 | PORT-JEST | `siege_tactics_turnseq.rs:98` `pub queued_order_ids: BTreeSet<u64>`; `siege_tactics_turnseq.rs:310,342` (usuwanie) | Stan gry (kolejka rozkazów). Renderer ma osobny model `QueuedOrders` (`rust-port/renderer/src/battle/orders.rs:32`) — UI-side. |
| `runNext` (closure, rekurencja) | 18585–18613 | BRAK (sterowanie) | odpowiednik szeregowania: `siege_tactics_turnseq.rs` (`begin_turn`/`activate_next`), `siege_tactics_loop.rs:477` `SiegeLoop` | Sekwencjonowanie aktywacji — w silniku jest jako maszyna zdarzeń, nie jako callback. |
| `this.busy` (gate) | 2522, 18590 | PORT-JEST | `siege_tactics_turnseq.rs:95` `pub busy: bool`; `siege_tactics_loop.rs:678` `fn busy()`; `siege_tactics_fastforward.rs:99` `fn busy()` | Patrz §3: `busy` jest mieszany (stan vs animacja). |
| `_schedule(40, cb)` | 9595, 18601 | PORT-JEST | `siege_tactics_clock.rs:108` `VirtualClock::schedule(ms, payload, planning)`; `siege_tactics_autobatch.rs:332` `schedule` | Odpowiednik ma parametr `planning` = gałąź `_autoBatchPlanning` (pin `:9595-9606`, synchroniczne wykonanie). |
| `_performPlayerOrder(u, done)` | 18280 | STUB | `siege_tactics_loop.rs:773` `ProdOps::perform_player_order` → `false`; trait `siege_tactics_activate.rs:117`, wywołanie `:240` | Produkcyjna implementacja to atrapa. To jest główna luka. |
| `u.acted = true` (callback) | 18608 | NIE_ZMIERZONO | nie zweryfikowano ścieżki zapisu `acted` w Rust | Do sprawdzenia w T1 (`git grep -n acted rust-port/engine/src/domain`). |
| `_refreshQueuedOrderVisuals()` | 18613, 11520 | UI | `rust-port/renderer/src/battle/units.rs:1406` `refresh_queued_order_visuals`; w silniku tylko zdarzenie `SeqEvent::RefreshQueuedVisuals` (`siege_tactics_turnseq.rs:311`) | Strzałki rozkazów = prezentacja. Silnik emituje tylko zdarzenie. |
| `_performSiegeManualOrder` | 18435 | BRAK | brak | Gałąź oblężnicza: taran/wieża przy `this.siegeWallCol >= 0`, woła `_siegeRamTowerStep`. Częściowo: `siege_tactics_tower.rs` (taran/wieża, `ram_tower_step` w `siege_tactics_activate.rs`), ale delegat w produkcji STUB (`siege_tactics_loop.rs:776-780`). |
| `_isUnitDoctrineAuto` | 17621 | BRAK | brak (`git grep doctrine` w `engine/src/domain` daje tylko `siege_tactics_activate.rs` i `siege_tactics_loop.rs:1043`) | Logika gry (doktryna grupy). |
| `_effectiveMetaForUnit` | 17633 | BRAK | brak | Logika gry (meta grupy). |
| `_executeGroupDoctrineStep(ru, meta, done)` | 17966 | STUB | `siege_tactics_loop.rs:776` `ProdOps::doctrine_step` → `false`; trait `siege_tactics_activate.rs:119` | Duża gałąź logiki — osobny temat. |
| `_adjacentEnemy(ru)` → `_pickAdjacentTargetByPriority` | 17481 | BRAK | brak (`adjacent`/`priority` bez trafień w `engine/src`) | `_priorityScore` = `17512`, obie BRAK. |
| `_doAttack(attacker, defender, done)` | 8787 | BRAK (efekt) | trait `siege_tactics_autobatch.rs:276` `do_attack` (delegat, bez implementacji produkcyjnej) | Część synchroniczna (obrażenia) jest w K5I (`siege_tactics_*`), wiązanie z rozkazem — BRAK. |
| `_doMove(ru, col, row, done)` | 8685 | PORT-JEST (bramka) / BRAK (efekt) | bramka odmowy: `siege_tactics_walk.rs:208` `do_move_gate`; efekt: `siege_tactics_walk.rs:108` `WalkWorld::do_move`, `siege_tactics_autobatch.rs:271` | Bramka `_siegeMoveRefused` portowana (K1). Efekt sceny (ruch i callback) — poza silnikiem jako delegat. |
| `_canStrikeTargetFrom(ru, col, row, tgt)` | 8487 | BRAK (logika) | trait `siege_tactics_autobatch.rs:284` `can_strike_target_from` (delegat) | Logika zasięgu + `_meleeBlockedByWall` (R2). Część `meleeBlockedByWall` jest w `siege_tactics_*` (K2) — do potwierdzenia. |
| `_destAllowedByBlockade(ru, col)` | 17809 | BRAK | brak (`blockade` bez trafień w `rust-port/engine` i `renderer`) | Logika gry (blokada). Małe, czyste; dobry kandydat na pierwszy temat. |
| `_compactAttackAllowsStep(ru, col)` | 8139 | BRAK | brak | Logika gry (zwarta formacja). |
| `_shouldAvoidAutoBacktrack(ru)` | 8191 | BRAK | brak | Logika gry (doktryna `steady`, pole `lastAutoMoveFrom`). |
| `_attackMovePath(ru, col, row, allowEnemyCells)` | 18535 | BRAK | brak; najbliższe: `siege_tactics_walk.rs:116` `bfs_first_step` (inna semantyka) | BFS z `allowEnemyCells`. Nie zamienialne 1:1 bez testu. |
| `_firstStepTowardMoveDestination(...)` | 18478 | BRAK | najbliższe: `siege_tactics_walk.rs:116` `bfs_first_step` | Wymaga wektorów. |
| `_firstStepAlongPathToAttack(ru, filter, tgt)` | 8565 | BRAK | najbliższe: `siege_tactics_walk.rs:116` | j.w. |
| `_enemiesOf(ru)` | 8291 | PORT-JEST | `siege_tactics_loop.rs:976` `fn enemies_of(&self, side, st)` | Ta sama rola (lista wrogów). |
| `_passableForUnit(ru, col, row)` | 7446 | PARTIAL | `siege_tactics_walk.rs:98` `WalkWorld::passable_free` (inne wejście, bez `ru`) | Semantyka per jednostka nie jest odwzorowana. |
| `_siegeMoveRefused(ru, col, row)` | 7963 | PORT-JEST | `siege_tactics_approach.rs` (`siege_move_refused`, wskazane w `siege_tactics_walk.rs:10`) | K1. |
| `_siegeWalkTo(...)` | 8006 | PORT-JEST | `siege_tactics_walk.rs:235` `siege_walk_to` | K1b. |
| `_advanceToNextBattleUnit(skipIds)` | 20071 | UI | brak (wybór zaznaczenia: `_selectBattleUnitsByIds`, `_clearAllSelection`) | Zaznaczenie po rozkazie = UI. Rozkład kolejki (`pivot`, `preferUnacted`) to logika UI, nie silnik. NIE_ZMIERZONO w silniku. |
| `_orderMoveForUnits(col, row, ids)` | 11492 | BRAK (stan rozkazu) | brak w silniku; renderer `rust-port/renderer/src/battle/orders.rs:208` `issue_attack_move` obsługuje tylko atak-marsz | Ustawia `playerOrder` dla grupy (stan gry). |
| `_ensureGroupMeta(gid)` | 17586 | BRAK | brak | Stan gry (meta grupy). |
| `_liveGroupMemberIds(gid)` | 15394 | BRAK | brak | Stan gry (członkowie formacji). |
| `_showOrderFeedback` | 18911 | UI | brak | Komunikat. |
| `_disposeQueuedOrderArrows`, `_makeOrderArrow` | 11427, 11374 | UI | renderer `units.rs:1406` | Grafika strzałek. |

Uwaga do renderera: `rust-port/renderer/src/battle/orders.rs` (nagłówek) odnosi się do webowego `origin/main` i pinu `edb8fb56`, nie do `07d2fbd72`. Opisuje `_issueBattleAttackMove` (`:18076-18096`) i `_cancelAttackMoveSelected` (`:18098-18106`) jako już portowane do renderera. Te numery linii nie zgadzają się z pinem `07d2fbd72`, gdzie `_issueBattleAttackMove` jest w `:18690-18705`. Przed T1 trzeba potwierdzić, że porównanie idzie do właściwego commita (NIE_ZMIERZONO, czy `renderer/orders.rs` jest zgodny z `07d2fbd72`).

## 3. Zależność asynchroniczna

Sklasyfikowane pola używane przez `runNext` i jego zależności:

- **Stan gry (musi być w silniku):** `acted`, `dead`, `removed`, `routed`, `playerOrder` (move/attack/attackMove/hold/none), `_queuedOrderUnitIds`, `_autoBattleSuspended`, `groupId`/meta grupy (`doctrine`, `autoPlay`, `rallyCol/Row`), `lastAutoMoveFrom`, `blockadeCol`, pozycje `q,r` i `occByKey`. W Rust większość jest w `TurnSeqState`/`ProdUnit`/`PlayableState`. Brak: `playerOrder`, `lastAutoMoveFrom` i meta grupy nie są widoczne w `siege_tactics_*`.
- **Tylko czas / animacja (do pominięcia w porcie, zastąpić wirtualnym zegarem):**
  - `busy` jako bramka animacji ruchu i ataku (ustawiane w `:8715`, `:9097`, `:9180`, `:9228`). W Rust `busy` jest już polem `TurnSeqState` (`siege_tactics_turnseq.rs:95`). Ustawianie `busy=false` po zakończeniu ruchu/ataku jest w `siege_tactics_autobatch.rs:768` i `siege_tactics_turnseq.rs:346`.
  - `_schedule(40, ...)` jako ponowne sprawdzenie `busy` (polling co 40 ms). W silniku wystarczy zdarzenie czasowe z `VirtualClock` (`siege_tactics_clock.rs:108`). W trybie planowania (`_autoBatchPlanning`) pin wykonuje to synchronicznie (`:9595-9606`).
  - Callbacki animacji `done()` z `_doMove` / `_doAttack`: w silniku zastąpić wynikiem synchronicznym (`done` = zdarzenie w `Vec<Event>`), tak jak w `siege_tactics_autobatch.rs` (`BatchEvent::Attack`, `BatchEvent::Move`).
  - `_refreshQueuedOrderVisuals`, `_advanceToNextBattleUnit`, `_showOrderFeedback`: UI, poza silnikiem.

Wniosek: `runNext` da się przepisać jako pętlę po indeksach z jawnym stanem (`idx`, kolejka, `busy`) i zdarzeniami wynikowymi. Rekurencja callbacków nie jest stanem gry.

## 4. Propozycja podziału na tematy portu

Każdy temat = jedna funkcja logiki + wektory z pinu. Allowlisty są wstępne (do zatwierdzenia przez Operatora).

| Kolejność | Temat | Zakres logiki (pin) | Allowlista (proponowana) | Zależy od |
|---|---|---|---|---|
| T1 | EXEC-QUEUE | `_executeUnitsImmediate` 18578–18614 bez `_performPlayerOrder` (wstrzyknięty jako trait), filtr kolejki, `busy`-gate z `VirtualClock` | `rust-port/engine/src/domain/player_order_queue.rs` (nowy), `rust-port/engine/tests/p6_player_order_queue.rs` (nowy), `rust-port/engine/tests/p6_player_order_queue_gen.mjs` (nowy) | — |
| T2 | MOVE-BLOCKADE | `_destAllowedByBlockade` 17809, `_compactAttackAllowsStep` 8139, `_shouldAvoidAutoBacktrack` 8191 | `rust-port/engine/src/domain/player_order_move_gate.rs` (nowy), testy jw. | — (małe, czyste) |
| T3 | MOVE-ORDER | gałąź `move` i `attackMove` z `_performPlayerOrder` 18280–18420 (bez doktryny) z `_firstStepTowardMoveDestination` 18478 i `_attackMovePath` 18535 | `rust-port/engine/src/domain/player_order_move.rs` (nowy) + testy | T1, T2 |
| T4 | ATTACK-ORDER | gałąź `attack` z `_performPlayerOrder` (`_canStrikeTargetFrom` 8487, `_firstStepAlongPathToAttack` 8565, `_adjacentEnemy` 17481, `_priorityScore` 17512) | `rust-port/engine/src/domain/player_order_attack.rs` (nowy) + testy | T1, T3 |
| T5 | SIEGE-MANUAL | `_performSiegeManualOrder` 18435 (taran/wieża w trybie ręcznym) | `rust-port/engine/src/domain/player_order_siege.rs` (nowy); reuse `siege_tactics_tower.rs` | T1 |
| T6 | DOCTRINE | `_executeGroupDoctrineStep` 17966, `_isUnitDoctrineAuto` 17621, `_effectiveMetaForUnit` 17633, `_ensureGroupMeta` 17586 | osobny temat (duży); allowlista do ustalenia po rozpoznaniu ciała 17966 | T1 |
| T7 | WIRING | zastąpienie atrap `ProdOps::perform_player_order` (`siege_tactics_loop.rs:773`) i `doctrine_step` (`:776`) | `rust-port/engine/src/domain/siege_tactics_loop.rs` (wyłącznie te dwie metody) | T1–T6 |

Zalecenie: najpierw T1 i T2 (najmniejsza powierzchnia, wektory bez animacji), potem T3–T5, T6 jako osobny temat po ustaleniu zakresu, T7 na końcu. Zgodnie z zasadą projektu „Web najpierw, Rust potem” każdy temat ma najpierw odczyt pinu, a dopiero potem dispatch.

Pytania, które nie są gameplay (do odpowiedzi orkiestratora): czy `renderer/src/battle/orders.rs` ma być zweryfikowany względem `07d2fbd72` przed T1 (patrz §2, uwaga o numerach linii).

## 5. Odtwarzalne polecenia (użyte do weryfikacji)

```
git show 07d2fbd72:gra/src/battle/battleScene.ts            # odczyt pinu (eksport do scratchpad)
grep -n '_executeUnitsImmediate' <pin>                       # 2295, 3610, 18578, 18649, 18677, 18690, 18699
sed -n 18578,18614p <pin>                                    # ciało funkcji
sed -n 18280,18420p <pin>                                    # _performPlayerOrder
sed -n 18435,18442p <pin>; sed -n 18535,18545p <pin>         # _performSiegeManualOrder, _attackMovePath
git grep -n 'perform_player_order\|doctrine_step' -- rust-port/engine/src
git grep -n 'queued_order_ids' -- rust-port/engine/src
git grep -n 'fn enemies_of\|fn busy\|fn schedule' -- rust-port/engine/src
git grep -n 'pub fn refresh_queued_order_visuals' -- rust-port/renderer/src
git grep -n 'blockade\|attack_move\|AttackMove' -- rust-port/engine/src   # wynik: 0 trafień (poza siege_tactics_*)
```

Trafienia (`rust-port/engine/src`): `siege_tactics_activate.rs:117,119,142,144,239,240,255,259,506,509`; `siege_tactics_loop.rs:678,773,776,976,1043,1090,1091`; `siege_tactics_turnseq.rs:95,98,310,311,342,344,346`; `siege_tactics_clock.rs:108`; `siege_tactics_autobatch.rs:268,271,276,284,332,624,635,710,716,768`; `siege_tactics_walk.rs:98,108,116,208,235,245`; `siege_tactics_fastforward.rs:99,150`.
