STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-H-MANUAL-ROZP-Q1 (runda 1, Operator HAIKU: rozpoznanie trybu ręcznego bitwy oblężniczej, `_performSiegeManualOrder`)
GOAL: Zmapować tryb ręczny oblężenia (`_performSiegeManualOrder` i jego wejścia) na odpowiedniki w Rust, zaklasyfikować każde wywołanie i zaproponować podział na tematy portu z allowlistami i kolejnością. Zakres #97/#118.
ZMIANY/COMMIT: tylko ten plik. Kod, `gra/`, `rust-port/` nietknięte. Bez push na parity.
TESTY: NIE DOTYCZY (tryb odczytu: bez cargo, npm, build). Weryfikacja: `git show 07d2fbd72:gra/src/battle/battleScene.ts` oraz `git grep ... 316ded4b7 -- rust-port/...` (polecenia w §5).
BLOKADY: brak blokad odczytu. Ciał kilku funkcji nie czytano (lista NIE_ZMIERZONO w §6); ich klasyfikacja opiera się na nazwie, użyciu i grep po Rust.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator wybiera kolejność tematów z §4 (rekomendacja: H1 zwinąć do T1 #266, potem H3, na końcu H4). Pytanie ABC w §4a (techniczne, bez gameplay).
DEPLOY/PUSH: NIE WYKONANO

## §0. Baza, pin, korekty do dispatchu

- BAZA: `origin/rust-port/parity-v2` = `316ded4b7e2ed836cddc76c53c04090d449c6c4a` (potwierdzone `git rev-parse`). Wszystkie `git grep` po Rust z tym SHA. HEAD worktree (`459354a12`) nie jest bazą i nie był używany do wniosków.
- PIN: `07d2fbd72`, `gra/src/battle/battleScene.ts`, 20771 linii.
- Korekty do dispatchu (zmierzone w pinie):
  - (a) `_performSiegeManualOrder` = **18435-18475** (nie 18435-18470). Komentarz (docstring) `R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1` = 18430-18434.
  - (b) `_performPlayerOrder` = **18280-18428**. Gałęzie: `hold` 18282, wywołanie `_performSiegeManualOrder` 18286, `move` 18297, `attackMove` 18353, `attack` 18396.
  - (c) `_manualMode`: linia **6068 to odczyt** (`if (this._manualMode && this._isPlayerSide(ru.side))`), a nie zerowanie. Zapisy w pinie: 2286 (pole, init `true`), 3572 (start bitwy: `!gate || (gate && hasCommander)`), 10539 (reset `= true`), 17353 (`_toggleManualMode`). Wywołania `_toggleManualMode`: 3710, 10012, 11813 (przycisk AUTO), 17419 (klawisz R).

## §1. Tabela: wywołanie → pin → Rust

Legenda klasyfikacji: ZINTEGROWANE (w produkcji), PORT-NIEPODŁĄCZONY (zportowane, brak wołającego w produkcji), STUB (atrapa w produkcji), BRAK, UI (prezentacja, poza silnikiem).

| # | Wywołanie / warunek | Pin plik:linia | Klasyfikacja | Rust plik:linia | Uwagi |
|---|---|---|---|---|---|
| 1 | `_activateUnit` → `_performPlayerOrder` (gałąź `_manualMode && _isPlayerSide`) | 6066-6069 (wywołanie 6068) | STUB + PORT-NIEPODŁĄCZONY | `siege_tactics_activate.rs:238-241` (gałąź `U7.0-manual`); `siege_tactics_loop.rs:773` (`ProdOps::perform_player_order` → `false`); `siege_tactics_loop.rs:1036-1039` | W produkcji tryb ręczny nie wchodzi do maszyny: sterownik klasyfikuje `tryb-reczny` jako poza zakresem (`unported`) i zwraca 0.0 przed `activate_unit`. |
| 2 | `_executeGroupDoctrineStep` → `_performPlayerOrder(ru, finish)` (rozkaz `move`) | 18082 (w 17966) | BRAK | `siege_tactics_loop.rs:776` (`ProdOps::doctrine_step` → `false`) | Doktryna AUTO w trybie ręcznym wraca przez `_performPlayerOrder`. Temat T8 (#264). |
| 3 | `_executeSkirmishDoctrineStep` → `_performPlayerOrder(ru, finish)` | 18122 (w 18087) | BRAK | brak | Drugie wejście doktrynowe (potyczka). |
| 4 | `_executeUnitsImmediate` → `_performPlayerOrder(u, cb)`; cb: `u.acted = true; runNext(idx+1)` | 18608-18609 (funkcja 18578) | STUB + BRAK (kolejka) | `siege_tactics_turnseq.rs:335-353` (`activation_done`, pole `acted`); `siege_tactics_loop.rs:456` (`player_unit_idle` → `false`) | Temat T1 (#266). Ścieżka `acted` dla rozkazu natychmiastowego. |
| 5 | Gałąź `hold` w `_performPlayerOrder`: `done(); return true` | 18282-18285 | BRAK | brak | Pierwsza gałąź przed siege; `hold` nie dochodzi do `_performSiegeManualOrder`. |
| 6 | Wywołanie `this._performSiegeManualOrder(ru, ord, done)` → true = obsłużone | 18286 | BRAK (funkcja) | brak | Wywoływane dla każdego rozkazu innego niż `hold`. Zwraca `true` → reszta `_performPlayerOrder` pominięta. |
| 7 | Guard: `!(siegeWallCol >= 0) \|\| ru.side !== 'atk' \|\| ord.type === 'move'` → `return false` | 18437-18438 | BRAK | brak | Dla `move` i obrońców zawsze `false`, więc rozkaz `move` (także doktrynowy, pin 18082/18122) idzie dalej. |
| 8 | `isSiegeUnit(ru.bu)` i (`_isRam(ru.bu) && !gateOpen` lub `isSiegeTower`) → `return this._siegeRamTowerStep(ru, done)` | 18439-18440 | PORT-NIEPODŁĄCZONY | `siege_tactics_tower.rs:344` (`siege_ram_tower_step`); `siege_tactics_activate.rs:480-495` (adapter `tower_ops::ram_tower`); `siege_tactics_loop.rs:785` (STUB → `false`) | Taran/wieża w trybie ręcznym. Logika K3 zportowana; brak wiązania w produkcji. |
| 9 | `isSiegeUnit` pozostałe (np. katapulta, taran z otwartą bramą) → `return false` | 18441 | BRAK | brak | Brak fallthrough: jednostka oblężnicza nie idzie do strzelca/melee. |
| 10 | `doctrineAuto = ord.type==='none' && _isUnitDoctrineAuto(ru) && _effectiveMetaForUnit(ru).doctrine !== 'manual'` | 18443-18444 | BRAK (funkcje) / wejście flagowe | `siege_tactics_activate.rs` (pola `doctrine_auto`, `doctrine_manual` w `ActivateUnit`); `siege_tactics_loop.rs:1043` | `_isUnitDoctrineAuto` (17621) i `_effectiveMetaForUnit` (17633): BRAK funkcji. Zależy od T0 (#255) i T8/MODEL-UI (#263). W H3 wystarczą dwie flagi wejściowe. |
| 11 | Bezczynny strzelec: `ord.type==='none' && !doctrineAuto` → `canShoot(ru) && ru.shootingEnabled !== false` → `_rangedTargetInRange(ru)` → `_doAttack(ru, tgt, done)`; brak → `return false` | 18445-18451 | BRAK (cel) / PORT (klasa) | `siege_tactics_classify.rs` (`canShoot`, `is_siege_*`, `is_ram`); `shootingEnabled`: `siege_tactics_approach.rs`, `siege_tactics_class_adapters.rs`; `_rangedTargetInRange`: `siege_tactics_loop.rs:788` (STUB → `None`); `_doAttack`: `siege_tactics_autobatch.rs:276` (trait, bez implementacji produkcyjnej) | Ciało `_rangedTargetInRange` (7041) przeczytane: najbliższy wróg w zasięgu Manhattan `1..=range`, remis → niższe `hp`. Port wymagany (§2). |
| 12 | `ru.onWallWalkway` → `adj = _targetInRange(ru)`; `adj ? _doAttack : done()`; `return true` | 18453-18457 | BRAK (cel) | `siege_tactics_activate.rs:293-338` (U7.1 walkway, osobna gałąź maszyny); `_targetInRange` → `siege_tactics_loop.rs:791` (STUB → `melee_target`) | Ścieżka ręczna działa PRZED wieżą (18458), w AUTO walkway jest w U7.1. Ciało `_targetInRange` (8373) przeczytane: dla strzelca `1 <= dd <= range`, dla melee sąsiedztwo Manhattan == 1 (pionowe walki przy murze wg komentarza). |
| 13 | `_trySiegeTowerClimb(ru, done)` → true = return | 18458 | PORT-NIEPODŁĄCZONY | `siege_tactics_tower.rs:399` (`siege_tower_climb`); `siege_tactics_activate.rs:486-487`; `siege_tactics_loop.rs:779` (STUB) | Wejście piechoty na mur po wieży. |
| 14 | `_siegeInfantryToTowerStep(ru, done)` → true = return | 18459 | PORT-NIEPODŁĄCZONY | `siege_tactics_tower.rs:439`; `siege_tactics_activate.rs:489-491`; `siege_tactics_loop.rs:782` (STUB) | Piechota pod wieżę. |
| 15 | `(attack \|\| attackMove) && _siegeApproachRestricted(ru)` | 18460 | PORT-NIEPODŁĄCZONY (predykat) | `siege_tactics_approach.rs:155` (`siege_approach_restricted`) | Predykat K1 zportowany; wołający w produkcji brak. |
| 16 | W gałęzi 15: `adj = _targetInRange(ru)`; `adj` → `_doAttack` + `return true` | 18461-18462 | BRAK (cel) | `siege_tactics_loop.rs:791` (STUB) | j.w. #12. |
| 17 | Cel: `attackMove` → `tc,tr = ord.col,ord.row`; `attack` → `t = _enemiesOf(ru).find(u.bu.id === ord.targetId && !dead && !fadingOut)`; brak `t` → `playerOrder = none`, `_refreshQueuedOrderVisuals()`, `done()`, `return true`; inaczej `tc,tr = t.q,t.r` | 18463-18469 | PORT (`_enemiesOf`) + BRAK (logika celu) | `siege_tactics_loop.rs:976` (`enemies_of`, ZINTEGROWANE w pętli); `siege_tactics_turnseq.rs:310-311, 342-343` (`SeqEvent::RefreshQueuedVisuals`) | Komunikat odświeżenia = zdarzenie silnika, render po stronie UI. |
| 18 | `ru.q === tc && ru.r === tr` → `playerOrder = none`, refresh, `done()`, `return true` | 18470-18472 | BRAK | brak | Dotarcie na cel. |
| 19 | `_siegeSafeApproach(ru, tc, tr, cb)`: false → `done()`; `return true` | 18471-18473 | PORT-NIEPODŁĄCZONY (K1) | `siege_tactics_approach.rs:231` (`siege_safe_approach_goal`); `siege_tactics_walk.rs:235` (`siege_walk_to`), `:208` (`do_move_gate`) | Ciało `_siegeSafeApproach` (8107) nie czytane w tym przebiegu; klasyfikacja z opisu modułu K1. |
| 20 | `return false` (koniec funkcji) | 18474-18475 | — | — | — |
| 21 | `player_unit_idle`: `_manualMode && _isPlayerSide && u.playerOrder.type==='none' && !_isUnitDoctrineAuto(u)` → nie ustawiaj `acted` | 6020-6025 (blok callbacku aktywacji, 6012-6030) | STUB | `siege_tactics_turnseq.rs:139-140` (trait), `:350` (użycie), `siege_tactics_loop.rs:456` (STUB → `false`) | Przy zmianie pola `acted` w T1 należy zrobić razem z H1. Zależy od `_isUnitDoctrineAuto` (BRAK funkcji, flaga `doctrine_auto` istnieje). |
| 22 | `_isUnitDoctrineAuto` (17621), `_effectiveMetaForUnit` (17633) | 17621, 17633 | BRAK (funkcje) | brak funkcji; flagi: `siege_tactics_activate.rs`, `siege_tactics_loop.rs:1043` | Logika grupy doktryny. Temat T0/T8. |
| 23 | Klasy: `isSiegeUnit`, `isSiegeTower`, `_isRam` (7402), `canShoot` | 1561-1564 (isSiegeTower), 7402-7405 (_isRam) | ZINTEGROWANE w klasyfikatorze | `siege_tactics_classify.rs:147-169` (`is_siege_tower` 163, `is_ram` 169) | Wejścia klas już w K1/K3/K5H (#92 KLASY-WIRE). |
| 24 | `_refreshQueuedOrderVisuals()` (11520) | 11520 | UI | `siege_tactics_turnseq.rs:310-311, 342-343` (zdarzenie); renderer: `rust-port/renderer/src/battle/units.rs:1406` (z K5-AUTO-EXEC-ROZP, nie weryfikowane w tym przebiegu) | Prezentacja. Silnik emituje tylko zdarzenie. |
| 25 | `_toggleManualMode()` (17348): blokada `_manualCommanderGate && !_manualMode && brak dowódcy` (17351-17352); przełączenie (17353); przy wyłączeniu: `_attackMoveMode=false`, czyszczenie zaznaczenia, `playerOrder = none` dla całego rostera (17357-17359+) | 17348-17360+ | BRAK (stan) + UI | brak; `battle_mode.rs` to tylko ustawienie zapisu `battleAlwaysManual` (REPIN-WOJNA-2), NIE przełącznik | Bramka `manualControlAllowed` (pin 2718: `_manualCommanderGate = opts.manualControlAllowed !== undefined`) BRAK w Rust. |
| 26 | `_onKeyManual` (17406-17420): Esc anuluje atak-marsz; `r`/`R` (bez modyfikatorów, nie w deploy/!started/finished) → `_toggleManualMode()` | 17406-17420 | UI | brak | Obsługa klawiatury: poza silnikiem. |
| 27 | `_manualMode` jako wejście bitwy | 2286 (init), 3572 (start), 10539 (reset), 17353 (toggle) | BRAK w engine (wejście jawne) | `siege_tactics_turnseq.rs:89` (`pub manual_mode: bool`, wejście) | Silnik przyjmuje tryb jako dane; przełącznik i bramka dowódcy są po stronie UI/sceny. |

## §2. Co już jest w Rust dla taranu i wieży

Polecenia w §5. Wynik:

- `rust-port/engine/src/domain/siege_tactics_tower.rs`: `siege_ram_tower_step` (344), `siege_tower_climb` (399), `siege_infantry_to_tower_step` (439), `pick_tower_target` (486). Odpowiednik `_siegeRamTowerStep` (pin 8022), `_trySiegeTowerClimb` (8056), `_siegeInfantryToTowerStep` (8087). Logika modułu K3 jest w pliku; czy jest kompletna względem pinu, tego w tym przebiegu nie sprawdzano.
- `rust-port/engine/src/domain/siege_tactics_activate.rs`: trait `ActivateOps` (117-128: `perform_player_order`, `doctrine_step`, `tower_climb`, `infantry_to_tower`, `ram_tower_step`, `ranged_target_in_range`, `target_in_range`); adapter `tower_ops` (480-495) składa K3.
- Wołający produkcyjny: `siege_tactics_loop.rs:773-791` (`ProdOps`): wszystkie metody zwracają atrapy (`false`, `None`), poza `target_in_range` (`melee_target`). Oznacza to: K3 nie jest podłączony do produkcyjnej pętli.
- Brak w Rust jakichkolwiek wektorów dla `_performSiegeManualOrder`: `git grep -n -i "performSiegeManual\|R-WEB-SIEGE-MANUAL" 316ded4b7 -- rust-port` → tylko w `dyspozycje/` (dokumenty), 0 trafień w kodzie i testach.
- Istniejące testy odnoszące się do tematu (wektory nie pokrywają trybu ręcznego): `rust-port/engine/tests/p6_siege_tactics_activate.rs` (stub `perform_player_order`, gałąź `U7.0-manual`), `p6_siege_tactics_tower.rs`, `p6_tower_target.rs`, `p6_tower_target_wiring.rs`, `p6_siege_wylom_tower.rs`, `p6_k5_auto_vectors.rs` (V5e: `_manualMode` blokuje finish, pin 5962), `p6_k5loop_outcome_pin.rs` (`manual_mode: false`).
- Web-side weryfikacja trybu ręcznego (do użycia przy generatorze): `gra/tools/siege-manual-battle-behavior-test.cjs` i `gra/tools/siege-manual-battle-live.cjs` (pin `07d2fbd72`, nagłówki R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1).

## §3. Wektory pinu: co potrzeba, czego brakuje

Potrzebne, nieistniejące (nazwy do utworzenia):
- `rust-port/engine/tests/p6_player_order_siege.rs` + `p6_player_order_siege_gen.mjs` + `p6_player_order_siege_vectors/vectors.json` dla pinu 18435-18475 (wzorzec: `p6_siege_tactics_activate_gen.mjs`, czyli wykonanie tekstu pinu ze stubami, SHA-256 strażnik).
- `rust-port/engine/tests/p6_player_order_idle.rs` (+ gen) dla `player_unit_idle` (pin 6020-6025).
- Wektory dla `_rangedTargetInRange` (7041) i `_targetInRange` (8373): brak; wspólne z #148 i #179.

Istniejące do ponownego użycia (bez zmian): `p6_siege_tactics_activate.rs`, `p6_siege_tactics_tower.rs`, `p6_siege_tactics_approach.rs`, `p6_siege_tactics_approach_k1.rs`, `p6_siege_tactics_walk.rs`, `p6_siege_tactics_classify.rs`.

## §4. Propozycja podziału na tematy (allowlisty, kolejność)

Nazwy zgodne z planem K5-AUTO-EXEC-ROZP (T1–T8, #266–#268, #264) i K5LOOP (#97, #113, #118, #148, #179). H-tematy są nowe.

| Temat | Zakres pinu | Allowlista (nowe / zmieniane) | Zależności | Wspólny plik |
|---|---|---|---|---|
| **H1** IDLE-ACTED (rekomendacja: zwinąć do T1 #266) | 6020-6025, 18608-18609 | `rust-port/engine/src/domain/player_order_queue.rs` (nowy, z T1); `rust-port/engine/tests/p6_player_order_queue.rs` + `_gen.mjs` (nowe) | brak (startuje pierwszy) | TAK: `siege_tactics_loop.rs:456` (jedna metoda) |
| **H2** TARGET-HELPERS (do #179 i #148) | 7041 `_rangedTargetInRange`, 8373 `_targetInRange` | `rust-port/engine/src/domain/siege_tactics_targets.rs` (nowy); `rust-port/engine/tests/p6_siege_tactics_targets.rs` + `_gen.mjs` (nowe) | `_enemiesOf` (ZINTEGROWANE) | TAK: `siege_tactics_loop.rs:788, 791` (dwie atrapy) |
| **H3** SIEGE-MANUAL-HEAD (= T5 SIEGE-MANUAL z K5-AUTO-EXEC-ROZP) | 18435-18475 | `rust-port/engine/src/domain/player_order_siege.rs` (nowy); `rust-port/engine/tests/p6_player_order_siege.rs` + `_gen.mjs` + `_vectors/` (nowe) | T1 (#266), H2, flagi `doctrine_auto`/`doctrine_manual` (T0 #255 do wejścia). Reuse read-only: `siege_tactics_tower.rs`, `siege_tactics_approach.rs`, `siege_tactics_walk.rs`, `siege_tactics_classify.rs`, `siege_tactics_activate.rs` | NIE (tylko nowe pliki) |
| **T2** MOVE-BLOCKADE (z K5-AUTO-EXEC-ROZP) | 17809, 8139, 8191 | `player_order_move_gate.rs` (nowy) + testy | brak | NIE |
| **T3/T4** MOVE/ATTACK-ORDER (z K5-AUTO-EXEC-ROZP) | 18297-18352 (move), 18353-18395 (attackMove), 18396-18427 (attack) | `player_order_move.rs`, `player_order_attack.rs` (nowe) | T1, T2 | NIE |
| **T8** DOCTRINE-STEP (#264) | 17966 `_executeGroupDoctrineStep`, 18087 `_executeSkirmishDoctrineStep`, `_performPlayerOrder` (wejścia 18082, 18122) | osobny temat, zakres po rozpoznaniu 17966 | T0 (#255), MODEL-UI (#263), H3, T3 | TAK: `siege_tactics_loop.rs:776` |
| **H4** WIRING-MANUAL (łączy z T7 #113) | atrapy: 773, 779, 782, 785; bramka: 1036-1039 (`tryb-reczny`) | tylko `rust-port/engine/src/domain/siege_tactics_loop.rs` (4 miejsca) + testy pętli | H3, T3, T4, T8 | TAK, ostatni |

Kolejność rekomendowana: **H1 (w T1) → T2 → H2 → H3 → T3 → T4 → T8 → H4/T7**.

Współdzielony `rust-port/engine/src/domain/siege_tactics_loop.rs` (wyraźnie): dotykany wyłącznie w 4 miejscach: `:456` (`player_unit_idle`, H1/T1), `:773-791` (atrapy `ProdOps`, H2/H3/H4/T8), `:1036-1039` (bramka `tryb-reczny`, H4), `:1073` (konstrukcja `ProdOps`, bez zmiany). Te tematy nie mogą iść równolegle na tym pliku. Na plik działa jednocześnie najwyżej jeden temat.

Uwaga do #97 (K5-LOOP-AUTO): wejście `tryb-reczny` (`siege_tactics_loop.rs:1036-1039`) jest celowo zablokowane w sterowniku. Odblokowanie należy do H4, nie do #97.

### §4a. Pytanie ABC (techniczne, nie gameplay) dla orkiestratora

Przedmiot: `_targetInRange` (pin 8373) i `_rangedTargetInRange` (pin 7041) są wymagane przez `_performSiegeManualOrder` (pin 18454, 18461, 18448) i przez `ProdBody` w K5 (#148, #179). Dziś obie funkcje w Rust to atrapy w `siege_tactics_loop.rs:788` i `:791`. Odpowiedź zmienia tylko to, w którym temacie powstaną. Nie zmienia zachowania gry, bo web jest jedynym wzorcem.

- **A) Zwinąć H2 do #179 (`_targetInRange`) i #148 (`_rangedTargetInRange`).** Za: jedna logika celu, jedna zmiana w `siege_tactics_loop.rs`, mniej konfliktów. Przeciw: #179/#148 są BLOCKED, więc H3 czeka dłużej.
- **B) Osobny temat H2 przed H3.** Za: H3 może ruszyć wcześniej, z własnymi wektorami. Przeciw: dwie implementacje tej samej funkcji w dwóch tematach, ryzyko rozjazdu.
- **C) Wpisać oba helpery do H3 jako część zakresu.** Za: jeden temat. Przeciw: H3 staje się duży, a funkcje używa też K5 (poza trybem ręcznym).

**Rekomendacja: A.** Jedno źródło prawdy dla celu strzelca i walki w zwarciu, a H3 nie rośnie. Koszt to dłuższe czekanie na odblokowanie #179/#148, które i tak musi nastąpić przed H4.

Gameplay: brak pytań. Zachowanie trybu ręcznego jest zdefiniowane w webie: docstring `R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1` (pin 18430-18434) oraz testy `gra/tools/siege-manual-battle-behavior-test.cjs` i `siege-manual-battle-live.cjs`.

## §5. Odtwarzalne polecenia (użyte do weryfikacji)

```
git rev-parse origin/rust-port/parity-v2                                  # 316ded4b7...
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '18435,18475p'  # _performSiegeManualOrder
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '18280,18300p'  # _performPlayerOrder, head
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '6012,6030p'    # player_unit_idle (blok callbacku)
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '6066,6070p'    # wywołanie z _activateUnit
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17348,17360p;17406,17420p'  # _toggleManualMode, _onKeyManual
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '7041,7056p;8373,8384p'     # _rangedTargetInRange, _targetInRange
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n -E "_performPlayerOrder\(|_performSiegeManualOrder"
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n -E "^\s+private (_adjacentEnemy|_priorityScore|_destAllowedByBlockade|_compactAttackAllowsStep|_shouldAvoidAutoBacktrack|_attackMovePath|_firstStepTowardMoveDestination|_doAttack|_doMove|_isUnitDoctrineAuto|_effectiveMetaForUnit|_executeUnitsImmediate)\("
git grep -n "fn player_unit_idle\|fn perform_player_order\|fn doctrine_step\|fn ram_tower_step\|fn tower_climb\|fn infantry_to_tower\|fn ranged_target_in_range\|fn target_in_range" 316ded4b7 -- rust-port/engine/src
git grep -n "pub fn siege_ram_tower_step\|pub fn siege_tower_climb\|pub fn siege_infantry_to_tower_step" 316ded4b7 -- rust-port/engine/src
git grep -n "tower_ops\|ProdOps" 316ded4b7 -- rust-port/engine/src
git grep -n "tryb-reczny\|out_of_scope" 316ded4b7 -- rust-port/engine/src/domain/siege_tactics_loop.rs
git grep -n -i "performSiegeManual\|R-WEB-SIEGE-MANUAL" 316ded4b7 -- rust-port
git grep -n "pub fn siege_approach_restricted\|pub fn siege_move_refused\|pub fn siege_safe_approach_goal" 316ded4b7 -- rust-port/engine/src
git grep -n "fn is_ram\|fn is_siege_tower" 316ded4b7 -- rust-port/engine/src
```

Każdy wynik został odczytany ręcznie. Numery linii Rust pochodzą z tych poleceń.

## §6. NIE_ZMIERZONO

- Ciała nie czytane w tym przebiegu: `_isUnitDoctrineAuto` (17621), `_effectiveMetaForUnit` (17633), `_doAttack` (8787), `_canStrikeTargetFrom` (8487), `_siegeSafeApproach` (8107), `_siegeRamTowerStep` (8022), `_trySiegeTowerClimb` (8056), `_siegeInfantryToTowerStep` (8087), `_refreshQueuedOrderVisuals` (11520), `_passableForUnit` (7446), `_adjacentEnemy` (17481), `_priorityScore` (17512), `_destAllowedByBlockade` (17809), `_compactAttackAllowsStep` (8139), `_shouldAvoidAutoBacktrack` (8191), `_attackMovePath` (18535), `_firstStepTowardMoveDestination` (18478), `_firstStepOnAttackMovePath` (18570). Ich klasyfikacja w tabeli pochodzi z nazwy, miejsca wywołania i grep po Rust.
- Renderer (`rust-port/renderer/src`) nie przeszukiwany w tym przebiegu; wiersze UI (#24, #26) to klasyfikacja po nazwie.
- Zachowanie w grze (uruchomienie web lub testu `*-live.cjs`) nie sprawdzano. Tryb odczytu.
- Nie zweryfikowano, czy `ProdBody` (K5LOOP) przejmuje którąś z atrap poza `ProdOps` (`siege_tactics_loop.rs:773-791`). Przeszukanie `git grep` wskazuje, że atrapy są jedynymi implementacjami w produkcji dla tych metod.
