STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I-Q1 (klocek K5i, runda 1/5, Operator)
GOAL: port _singleBlow (battleScene.ts ok. :8960) i czystych funkcji trafienia/obrazen jako domain/siege_tactics_blow.rs z wejsciami jawnymi, RNG wstrzyknietym (T1), wektorami z wykonania pinu 07d2fbd72 (>= 500, SHA-256), efektami sceny jako jawnym wyjsciem.
BAZA: 46c42deab (= origin/rust-port/parity-v2), worktree detached; galaz robocza wip/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I-Q1.
ZMIANY/COMMIT: kod i wektory 195e5ba7981638f8ac7a61ec5ed992dcb02fe375; raport - commit nastepujacy po nim (SHA w logu galezi wip/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I-Q1). Nie wypchnieto.
  Allowlista: rust-port/engine/src/domain/siege_tactics_blow.rs (nowy, 381 linii); rust-port/engine/src/domain/mod.rs (+1 linia rejestracji); rust-port/engine/tests/p6_siege_tactics_blow.rs (nowy); rust-port/engine/tests/p6_siege_tactics_blow_gen.mjs (nowy); rust-port/engine/tests/p6_siege_tactics_blow_vectors/vectors.json (626 przypadkow); ten raport.
  Brak zmian w gra/, WERSJE.md, Cargo.toml. Cargo.lock wygenerowany lokalnie przez cargo (w repo nie bylo), NIE dodany do commita.
ZAKRES PORTU (linie pinu 07d2fbd72: gra/src/battle/battleScene.ts, gra/src/game/combat.ts):
  * isCharge: :8894-8900 (klucz engaged i bracesAgainstCharge jako wejscia).
  * rdzen ciosu: :8958-9010 (chargeHitBonus, hitPct, rzut Math.random()*100, pudlo, rangeDamage/baseDamage, dmg = max(1, round(raw*kontra)), HP, flanka/tyl, extraMorale szarzy).
  * _resolveBlowOutcome: :9020-9068 (rout przed smiercia, zabicie, zwykly spadek morale).
  * helpery combat.ts:440-517 (hitChanceTw, damageTw, rangeDamageTw, rangeDamage, baseDamage) - w Rust: hit_chance, damage_tw, range_damage.
  * Rust przed tym nie mial blow-core; combat.rs::resolve_combat (jednorazowe) to inna sciezka.
NIE PORTOWANO (BLOKADY kryterium 1 w calosci):
  * toCombatUnit i obliczenia wejsc (cuA/cuD, civ, teren, fortyfikacja, kara skrzydla, kontra counterMultiplier, relativeHit) - linie 8809-8957 - wejscia jawne.
  * rangedDamageMultFor (unit-power.ts) - wejscie rangedClassMult.
  * ciala efektow sceny: _applyMoraleDamage, _gainMorale, _startFade, _shakeAlliesOnLoss, _boostEnemiesOnBreak, _pushClash, _updateHpBar - zwracane jako SceneEffect; wynik _applyMoraleDamage (routed) jako wejscie routed_after_morale.
  * _sfxMelee, tekst logu (this.log.push), stan engaged (jako wejscie first_blow_of_pair).
  * Zrodlo RNG: wstrzykiwane przez trait RollSource (jeden rzut na cios). Pin uzywa Math.random() (niesiewany), wiec nie ma osobnego portu PRNG.
TESTY:
  * cargo fmt --check: EXIT 0.
  * cargo clippy --all-targets -- -D warnings: EXIT 0.
  * cargo test --lib: 49 passed, 0 failed.
  * cargo test --test p6_siege_tactics_end --test p6_siege_tactics_endcheck --test p6_siege_tactics_breach --test p6_siege_tactics_walk --test p6_siege_tactics_blow: end 8/8, endcheck 9/9, breach 15/15, walk 7/7, blow 3/3 - wszystkie zielone (istniejace testy bez zmian).
  * Wektory: 626 przypadkow (620 losowych seed 217 + 6 brzegowych). Pokrycie galezi (liczniki z testu): miss 322; hit_melee_charge 128; hit_melee_plain 96; hit_ranged 80; flank 61; rear 59; charge_extra_morale 41; outcome rout_before_death 62; kill 91; morale_only 151 (z tagiem rout 62); dmg_floor (dmg=1) 60; NaN w wejsciu 52; Infinity w wejsciu 51.
  * Straznik SHA-256 fragmentow pinu: 39bee8dba9f6f20b785700402fd4ee73638a9a2467715a58b55f49b927e511bc (generator sprawdza zgodnosc; zmiana pinu = blad).
  * Zgodnosc TW: combat-params.json tw_v3 w pinie i w repo identyczne (hit_base 40, hit_min 15, hit_max 75).
  * Nie uruchamiano: gra/ (zakaz), testy przegladarki (nie dotyczy).
BLOKADY: kryterium (1) "_singleBlow Ported" - PARCJALNE: port obejmuje rdzen ciosu i rozstrzygniecie; pelne cialo _singleBlow wymaga portu wejsc z linii 8809-8957 i ciala efektow sceny (kolejne klocki). Dyspozycja mowi o galeziach "krytyk/obrona": w pinie _singleBlow nie ma galezi krytycznej; galezie obrony to rout/zabicie/morale.
RUNDY: 1/5 (ostatni werdykt: brak - Evaluator i Final Control jeszcze nie uruchomione).
NASTEPNY KROK: Evaluator (Sonnet) na commit 195e5ba79 -> Final Control; kolejny klocek: wejscia cuA/cuD i kontra (linie 8809-8957) z wektorami, potem cialo efektow sceny.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje i nie integruje).
