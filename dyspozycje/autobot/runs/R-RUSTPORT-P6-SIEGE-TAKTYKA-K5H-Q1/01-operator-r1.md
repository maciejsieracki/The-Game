STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5H-Q1
GOAL: port 1:1 `_activateUnit` (U7.1-U7.9, pin 07d2fbd72 :6048-6299) jako maszyna decyzyjna `siege_tactics_activate.rs` z wektorami z wykonania tekstu pinu.
ZMIANY/COMMIT: baza 1a119b78e + KROK 0a merge K5I (ff8688bf9; konflikt mod.rs: zachowano obie rejestracje) + KROK 0b merge K5J (bbbc17b6b). `git merge-base --is-ancestor 46c42deab 1a119b78e` = TAK, wiec K2/K3/K4 sa na bazie, KROK 0c pominiety. Nowe pliki: rust-port/engine/src/domain/siege_tactics_activate.rs, mod.rs (rejestracja `siege_tactics_activate`), rust-port/engine/tests/p6_siege_tactics_activate.rs, p6_siege_tactics_activate_gen.mjs, p6_siege_tactics_activate_vectors/vectors.json, ten raport. Cargo.lock nie commitowany. SHA: patrz commit na gałęzi roboczej (git log -1).
TESTY:
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 56 passed, EXIT 0
- cargo test --test p6_siege_tactics_end/endcheck/breach/walk/tower/blow/autobatch + activate (nowy) + roundcap/fastforward/turnseq/autophase/approach: wszystkie ok (activate 2/2, tower 12, walk 7, autobatch 6, blow 3, breach 15, end 8, endcheck 9, roundcap 7, fastforward 3, turnseq 1, autophase 2, approach 5), EXIT 0
- Generator: node rust-port/engine/tests/p6_siege_tactics_activate_gen.mjs wykonuje TEKST pinu (_activateUnit 6048-6299, _checkRout 9783-9797, _enemiesOf 8291-8294), straznik SHA-256 fragmentow 3be85ac2fba725bf618b61c817c891c1d994d2b7df3615d01552c6c2774ddb00. Jedyna ingerencja: znaczniki `__b('tag')` wstawiane dokladnie raz (asercja), bez zmiany przeplywu.
- Wektory: 700 sekwencji (1-4 aktywacji, stan przenoszony: dryCol, heldAfterFallback, surroundApplied, morale, range, playerOrder), 319 przypadkow z NaN/Infinity. Test porownuje slad zdarzen, tagi galezi, stan jednostki po kazdej aktywacji oraz liczniki meta (branchCounts, traceCounts).
- Liczniki galezi (wszystkie > 0): U7.0 finished 46/dead/flee/manual/doctrine/surround/surround-flee; U7.1 walkway 191, cata, shoot-std/attack/hold, melee-attack/hold; U7.2 climb 128, inf 124; U7.3 ramtower, cata-fire, cata-advance; U7.4 hold, shoot, shoot-hold, melee, melee-hold; U7.5 ranged; U7.6 primary, dry-record, adj-attack, set-held, hold, fallback; U7.7 cavalry; U7.8 phalanx; U7.9 attack, advance (dokladne liczby w vectors.json meta).
- Test integracyjny adaptera K3 (`tower_ops`): wieza przy murze konczy na U7.3-ramtower i K3 rejestruje rzad w towerAtWallRows.
BLOKADY: brak. Uwagi projektowe (do Evaluatora):
1. Delegaty akcji (_fleeStep, _rangedAction, _cavalryAction, _phalanxAction, _advanceStep, _fallBackStep, _doAttack, _attackWallTile, _advanceToward) sa zdarzeniami-zamiarami; ich tresc to osobne klocki (zgodnie z GOAL: bez efektow sceny).
2. Zapytania (_rangedTargetInRange, _targetInRange, _advanceCoord, _nearestEnemy, _applyTerrainRange, _performPlayerOrder, _executeGroupDoctrineStep, trzy funkcje wiez K3) wstrzykniete przez trait `ActivateOps`; K3 wpiete adapterem `tower_ops` (dowod: test adapter_k3...), w wektorach skryptowane po obu stronach.
3. KLASY nie ma na bazie: canShoot/isSiegeUnit/isSiegeTower/_isRam/_isCatapult jako jawne flagi.
4. Przywrocenie `ru.range = origRange` w galezi muru jest no-op (nic nie zmienia range), brak zdarzenia. `ru.playerOrder = {type:'none'}` ma zdarzenie ResetPlayerOrder (nie w sladzie pinu, stan porownywany osobno).
5. Cios przez K5I (BlowInput) nie jest wolany tutaj: _doAttack jest zamiarem; mnozniki K5I-2 w toku nie dotykaja tej maszyny.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator K5H.
DEPLOY/PUSH: NIE WYKONANO
