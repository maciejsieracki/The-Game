STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B-Q1 (klocek K5i-2b: skladanie BlowInput + rangedDamageMultFor, kompletne _singleBlow)
GOAL: zlozyc funkcje _singleBlow end-to-end: z jednostek i otoczenia zbudowac BlowInput dla rdzenia K5I, podpiac ranged_class_mult z unit_power, zweryfikowac wektorami wykonujacymi tekst pinu 07d2fbd72.
ZMIANY/COMMIT:
- Baza: a2bcdbdc6 (FC K5I2a4). KROK 0: merge fe3264a39 (K5I2a3, mur), konflikt domain/mod.rs rozwiazany z zachowaniem obu rejestracji (commit 4b10b18c9).
- Kod operatora: c298c3f8e (siege_tactics_blow_full.rs, domain/mod.rs, tests/p6_siege_tactics_blow_full.rs, tests/p6_siege_tactics_blow_full_gen.mjs, tests/p6_siege_tactics_blow_full_vectors/vectors.json).
- Nowe: rust-port/engine/src/domain/siege_tactics_blow_full.rs (compose_blow, single_blow_full, typy wejsc/wyjsc).
- Rejestracja: rust-port/engine/src/domain/mod.rs (jedna linia `pub mod siege_tactics_blow_full;`).
- Adaptery w siege_tactics_blow*.rs / siege_tactics_inputs_*.rs: NIE wykonano (API istniejacych modulow uzyte bez zmian).
- Cargo.lock NIE zacommitowany (niesledzony, wygenerowany przez build). gra/, rust-port/engine/data/, WERSJE.md, Cargo.toml: nietkniete. Brak push, brak integracji.
TESTY:
- cargo fmt --check: OK (exit 0) po rustfmt na nowych plikach.
- cargo clippy --all-targets -- -D warnings: OK.
- cargo test --lib: 64 passed, 0 failed.
- cargo test --test p6_siege_tactics_blow: 3 passed (K5I, bez oslabien).
- p6_siege_tactics_inputs_terrain 7/7, p6_siege_tactics_inputs_pos 1/1, p6_siege_tactics_inputs_unit 2/2, p6_siege_tactics_inputs_wall 6/6 (a1-a4 bez oslabien).
- p6_siege_tactics_blow_full: 3 passed: zgodnosc_z_pinem_end_to_end (1200 przypadkow, seed 2201), ranged_class_mult_z_unit_power_nie_z_wektora (slinger x3, lucznik piesi x2, reszta x1), nan_w_atak_dystansowy_propaguje_jak_math_max.
- Wektory: generator WYKONUJE cale cialo _singleBlow (battleScene.ts 8812-9010, lacznie z `return this._resolveBlowOutcome(...)`) przez new Function, z this = stub sceny. Wykonane tekstem pinu takze: helpery combat.ts 440-517, rangedShotAccuracy 476-478, flankRearDefensePenalty 589-606, rangedDamageMultFor unit-power.ts 26-32, applyMultiplier civ-bonuses.ts 229-231, fieldFortifyDefenseBonus city-defense.ts 237-245. Straznik SHA-256 fragmentow: b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526 (sprawdzany w generatorze i w ttescie).
- Porownania Rust vs JS: argumenty hitChanceTw (atak, defFinalObrona, bonus szarzy), argumenty baseDamage/rangeDamage, rangedDamageMultFor, isCharge, hitPct, roll, missed, dmg, wartosc zwrotu, HP obroncy po ciosie, extraMorale, engaged_add i engaged po ciosie.
- Pokrycie (liczniki generatora, wszystkie > 0 i asertowane w tescie): pudlo 602, trafienie wrecz 370, trafienie dystansowe 228, isCharge 303, braces blokuje szarze 146, nie-pierwszy cios pary 324, flanka 212, tyl 206, front 180, konny w szarzy (morale) 50, obronca na murze 215, bitwa miejska 339, bitwa polowa 861, fortyfikacja w polu 355, brod obroncy 171, brzeg (shore) 31, rzeka atakujacego 134, Slinger 22, Lucznik piesi 9, zabicie (HP=0 po trafieniu) 78, przypadki z NaN 399, z Infinity 60.
- Liczby w wektorach zapisane jako String(x) i parsowane przez str::parse::<f64> (serde_json w tym repo nie ma float_roundtrip i zmienia ostatni bit).
BLOKADY:
1. NIE ZROBIONO (zakres polecenia): wektory NIE uzywaja danych units.json z pinu. Generator losuje statystyki jednostek (meleeAttack, armor, kary flanki itd.) zamiast brac wiersze gra/data/units.json pinu. Brakuje mapowania wierszy units.json na CombatUnit (toCombatUnit, battleScene.ts:1355), a to zakres K5I2a4, ktory nie jest jeszcze portem Rust na tej galezi. Rozbieznosci units.json Rust vs pin (zadanie 27) NIE rozstrzygane, zgodnie z poleceniem.
2. STUBY POZA ZAKRESEM (jawne w naglowku generatora, nie sa portem w tej rundzie): toCombatUnit, relativeHit (wejscie hit_arc), civCombatStatMultipliers i mergeBuildingBonusIntoStatMultipliers (wejscia atk_mods/def_mods), civWallDefenseMultiplier, battleUnitDifficultyCombatMult (wejscia diff), counterMultiplier (wejscie counter_mult, tabela counters poza zakresem), bracesAgainstCharge (wejscie, stan sceny), isFordTile i isShoreAdjacentToFord (wejscia flagowe), terrainRiverAttackMultiplier (wejscie logiczne: nazwa 'Rzeka' i wiersz rzeki), terrainDefenseMultiplier, cityGatedTerrainMultiplier, _wallBonusProcFor (wejscia liczbowe). Rust sklada reszte (defFinalObrona, atkMelee, atkShootAcc, atkMissile, defArmor, roundAtkCharge, chargeHitBonus, isCharge, ranged_class_mult) z tych wejsc.
3. ZNALEZISKO POZA ALLOWLISTA (nie zmieniane): rust-port/engine/src/domain/unit_power.rs `ranged_shot_accuracy` uzywa `melee_attack.max(missile_attack)` (f64::max IGNORUJE NaN), a pin `rangedShotAccuracy` to Math.max (propaguje NaN). compose_blow uzywa wiec lokalnie js_max zgodnie z pinem; funkcja w unit_power.rs jest rozbiezna dla NaN. NIE_ZMIERZONO: czy ranged_shot_accuracy z unit_power ma produkcyjnych wywolujacych na sciezce bitwy. Propozycja: osobny temat R-* poza tym klockiem.
4. Zakres single_blow_full nie obejmuje rozstrzygania (_resolveBlowOutcome, _applyMoraleDamage): routed_after_morale jest wejsciem; rozstrzygniecie pokrywa K5I (p6_siege_tactics_blow).
RUNDY: 1/5 (Operator HAIKU, runda 1). Brak FAIL, wynik do oceny Evaluatora.
NASTEPNY KROK: Evaluator (Sonnet) na commicie c298c3f8e. W szczegolnosci: weryfikacja blokady 1 (units.json z pinu jako zrodlo statystyk, po dostarczeniu toCombatUnit z K5I2a4) oraz decyzja, czy blokada 1 wymaga rundy 2 przed Obrona/FC. Potem Obrona (Haiku) i Final Control (Sonnet).
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje, nie integruje; brak push do rust-port/parity-v2 i origin/main).
