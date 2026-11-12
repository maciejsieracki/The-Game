STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2-Q1
GOAL: dokończyć _singleBlow: port 1:1 toCombatUnit i mnożników wejść ciosu oraz rangedDamageMultFor jako czyste funkcje; złożenie w kompletne ciało _singleBlow (BlowInput z mnożnikami -> wynik); wektory z pinu porównują hit_pct/roll/extra_morale; test engaged_add.
ZMIANY/COMMIT: baza ff8688bf9 (detached), praca na gałęzi rust-port-wip/SIEGE-TAKTYKA-K5I2-op, commit kodu 61de6152d (lokalnie, bez push). Allowlista: domain/mod.rs (rejestracja), domain/siege_tactics_blow_inputs.rs (nowy), tests/p6_siege_tactics_blow.rs, tests/p6_siege_tactics_blow_gen.mjs, tests/p6_siege_tactics_blow_vectors/vectors.json, dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md (wiersze 32.20-32.21). Cargo.lock nie commitowany (untracked). Brak zmian w gra/**, Cargo.toml, WERSJE.md.
TESTY:
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 53/53 (49 poprzednio + 3 nowe testy siege_tactics_blow_inputs + js_round; wynik "53 passed")
- cargo test --test p6_siege_tactics_blow: 3/3 (wektory 626 przypadkow: 620 losowych + 6 brzegowych; asercje: missed, isCharge, dmg, defHpAfter, efekty, NOWE: hitPct, roll, extraMorale, engaged_add, klucz engaged po ciosie; pokrycie galezi asertowane)
- p6_siege_tactics_breach 15/15, p6_siege_tactics_end 8/8, p6_siege_tactics_endcheck 9/9, p6_siege_tactics_walk 7/7 (wszystkie EXIT 0)
- Generator p6_siege_tactics_blow_gen.mjs (Node v22.23.4) uruchomiony ponownie: straznik SHA-256 fragmentow pinu 39bee8db...e511bc zgodny; wektory wygenerowane deterministycznie.
- Zmiana formatu liczb w wektorach: liczby zapisane jako String(x) (round-trip JS), bo serde_json bez float_roundtrip (Cargo.toml bez zmian) zaokraglal r01 o 1 ulp (wykryte przez nowy assert roll: R0008 22.498922841623422 != 22.498922841623425). Rust parsuje tekst przez str::parse::<f64> (dokladny).
- Zrodlo wartosci NIE z pinu (uczciwie): hitPct/roll/extraMorale z instrumentacji stubu w generatorze (hitChanceTw opakowane spy, MathStub.random, argument _resolveBlowOutcome); engagedKeyAfter z obiektu Set stubu. Pudlo: extraMorale = 0 (jak w pinie, _resolveBlowOutcome nie wolane).
- Testy helperow wejsc (siege_tactics_blow_inputs.rs) to testy jednostkowe z recznie policzonymi wartosciami wzorowanymi na pinie, NIE wektory z wykonania pinu (brak generatora dla tych funkcji w tej rundzie).
BLOKADY:
1. KRYTERIUM 1 NIE SPELNIONE: brak kompletnego _singleBlow z BlowInput z mnoznikami. Nie zportowano w tej rundzie: toCombatUnit (battleScene.ts:1355), relativeHit (battleScene.ts:385; wymaga facingToward/oppositeDir), terrainDefenseMultiplier z nazwami terenu (normTerrain, fuzzy match), cityGatedTerrainMultiplier (city-defense.ts:180), _wallBonusProcFor i wallDefenseMult (:8824-8856), civWallDefenseMultiplier wpiety do zlozenia (istnieje w civ_bonuses.rs:594, nie podpiety), isFordTile/isShoreAdjacentToFord (:1897, :1907), battleUnitDifficultyCombatMult (battle-unit-context.ts:9), zlozenie defFinalObrona/atkMelee/roundAtkCharge/ctrAtkVsDef z pinu :8880-8956.
2. Pelny port rangedDamageMultFor NIE wykonany jako nowa funkcja: istnieje juz port domain/unit_power.rs::ranged_damage_mult_for (zgodny z gra/src/game/unit-power.ts:26-33); nie duplikowano, nie podpieto do BlowInput (BlowInput.ranged_class_mult przyjmuje wynik).
3. Efekty sceny (_startFade, _shakeAlliesOnLoss, _boostEnemiesOnBreak, _pushClash, log) nadal poza portem (zgodnie z K5I).
4. Dokument P6-SIEGE-TAKTYKA.md: wiersz 32.20 i 32.21 zmieniony na PARTIAL (dispatch: tylko wiersze tego klocka). Rejestr ogolny nie byl ruszany.
5. Nie wykonano mutacji ani sprawdzenia, czy wektory wykryja celowy blad w hitPct/roll/extraMorale (brak czasu w rundzie).
6. Zrodla stubow generatora dla wejsc spoza pinu (civ, teren, mur) pozostaja jawnymi wejsciami wektora, jak w K5I; to nie jest port tych funkcji.
RUNDY: 1/5 (Operator, runda 1 tego ID; dispatch nie zawiera zadnej wczesniejszej rundy K5I-2)
NASTEPNY KROK: runda 2 Operatora na 61de6152d: (a) portowac toCombatUnit + relativeHit + terrainDefenseMultiplier/cityGatedTerrainMultiplier/isFordTile jako czyste funkcje z wejsciami jawnymi; (b) rozszerzyc generator o wykonanie zakresow pinu 8880-8956 i wektory dla funkcji wejsc (hitPct/roll/extraMorale juz porownywane); (c) zlozenie BlowInput z istniejacych portow civ_bonuses/combat/unit_power; (d) wtedy ponowna ocena Evaluatora. Rekomendacja: podzielic na dwa tematy (wejscia pozycyjne/teren vs. civ/kontry), bo zakres przekracza jedna runde Haiku.
DEPLOY/PUSH: NIE WYKONANO (lokalny commit 61de6152d i ten raport; brak push do rust-port/parity-v2, brak integracji, brak push gałęzi wip).
