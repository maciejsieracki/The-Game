# 02a-obrona — R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B-Q1 (runda 1, obrona Operatora)

STATUS: PASS-WITH-NOTES (zarzut 4 NIE ZAMKNIĘTY — patrz niżej)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B-Q1
GOAL: złożenie kompletnego `_singleBlow` z jednostek (units.json pinu) i otoczenia; rangedDamageMultFor z unit_power; wektory z pinu end-to-end.
ZMIANY/COMMIT: commit obrony na gałęzi `rust-port-wip/SIEGE-TAKTYKA-K5I2B-Q1` (SHA w raporcie orkiestratora). Allowlista: `siege_tactics_blow_full.rs`, `p6_siege_tactics_blow_full.rs`, `p6_siege_tactics_blow_full_gen.mjs`, `p6_siege_tactics_blow_full_vectors/vectors.json`, ten katalog runs. Cargo.lock NIE commitowany (untracked).
BLOKADY: zarzut 4 (otoczenie: relativeHit / isFordTile / isShoreAdjacentToFord / _wallBonusProcFor nadal stubami; brak adaptera pozycja+mapa+mur -> BlowEnv) — poza zakresem tej poprawki, wymaga osobnego kroku. Zarzut 6 (unit_power `f64::max`) — poza allowlistą, osobny temat R-*.
RUNDY: 1/5 (obrona), ostatni werdykt Evaluatora: FAIL zarzutów 1–4, 6.
NASTĘPNY KROK: Evaluator/Final Control na nowym commicie; zarzut 4 jako osobny klocek (K5I2b2) albo decyzja orkiestratora o rozszerzeniu tego tematu.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje i nie integruje).

## Odpowiedzi na zarzuty

0. Stwierdzenie „bramki zielone, brak #[ignore], brak osłabionych asercji, brak wołających w Rust" — przyjęte bez zmian.

1. **PRZYJMUJĘ (naprawione).** Generator nie losuje już statystyk. `cuA`/`cuD` buduje TEKST pinu `toCombatUnit` (battleScene.ts:1355-1378) z `combatUnitFromDef` (combat.ts:194-234), `applyVeteranFracToCombatUnit`, `applyArmyHungerStatMultToCombatUnit`, `applyGoldDeficitStatMultToCombatUnit` — te same zakresy co K5I2a4 (SHA fragmentu `d1b401a2…`, zgodny z generatorem a4). Wiersze: `gra/data/units.json` pinu, SHA-256 `7b509817…`, 75/75 wierszy użytych w wektorach. Wejścia wywołania: weteran, głód, deficyt zlota, hp z przypadku. Dowód: `unitRowsUsed=75`, `unitOverride=314` (NaN/Inf w jednej statystyce wiersza w 15% przypadków — jedyna ingerencja w dane, udokumentowana w nagłówku generatora). Test Rust liczy `to_combat_unit` na wierszu i porównuje z observed `CombatUnit` pinu (melee/weapon/armor/piercing/charge/missile/kara flanka/tył): 0 rozbieżności w 1200 przypadkach.

2. **PRZYJMUJĘ (naprawione).** Dodano `attacker_from_cu(&CombatUnitModel)` i `defender_from_cu(&CombatUnitModel)` w `siege_tactics_blow_full.rs`. Test buduje łańcuch: wiersz pinu -> `BattleUnitIn` -> `to_combat_unit` (K5I2a4) -> adaptery -> `FullBlowInput` -> `single_blow_full`. Stare losowe pola `AttackerCu`/`DefenderCu` z JSON usunięte. Adapter nie używa ręcznych wartości poza wierszem i wejściami przypadku. Ryzyko `missileAttack ?? 0`: `CombatUnitModel.missile_attack` jest już znormalizowane przez `combat_norm_field(.., 0)`, co odpowiada `?? 0` z pinu. `kara_*` mapowane jako `Some(model)` (model już zawiera wartość po normalizacji pinu) — potwierdzone testem end-to-end.

3. **PRZYJMUJĘ (naprawione wcześniej).** Raport `01-operator-r1.md` był brakujący w `c298c3f8e`; dodany commitem `84645400d` (30 linii) na tej samej gałęzi. Ten plik jest raportem obrony.

4. **PRZYJMUJĘ — CZĘŚCIOWO, ZARZUT NIE ZAMKNIĘTY w tej rundzie.** Zarzut jest zasadny: `compose_blow` przyjmuje `hit_arc` i `BlowEnv` jako gotowe wejścia, a generator nadal stubuje `relativeHit`, `isFordTile`, `isShoreAdjacentToFord`, `_wallBonusProcFor`, `terrainMap.combatTerrainName`. Istnieją prymitywy Rust (`relative_hit`, `is_ford_tile`, `is_shore_adjacent_to_ford` w `siege_tactics_inputs_pos.rs`; `wall_bonus_proc_for` w `siege_tactics_inputs_wall.rs`) z własnymi wektorami, ale brak (a) tekstu pinu dla tych funkcji w generatorze, (b) adaptera pozycja+mapa+mur -> `BlowEnv`. To nie mieści się w bezpiecznym zakresie tej poprawki. NIE ODRZUCAM. Proponuję osobny klocek.

5. **Uwaga bez poprawki — przyjęta.** Brak działania.

6. **PRZYJMUJĘ jako osobny temat R-*.** `unit_power::ranged_shot_accuracy` używa `f64::max` (ignoruje NaN), pin używa `Math.max`. Plik poza allowlistą tej rundy, więc nie zmieniany. `compose_blow` omija to przez `js_max`. Do osobnego tematu.

## Dowody (bramki, uruchomione w tej rundzie)

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target poza repo (usunięty po bramkach).

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: 64 passed, 0 failed
- `p6_siege_tactics_blow`: 3/3
- `p6_siege_tactics_inputs_terrain`: 7/7
- `p6_siege_tactics_inputs_pos`: 1/1
- `p6_siege_tactics_inputs_wall`: 6/6
- `p6_siege_tactics_inputs_unit`: 2/2
- `p6_siege_tactics_blow_full`: 3/3 (1200 przypadków; 75 wierszy pinu; cuA/cuD 0 rozbieżności; fragment body `b2f9e19f…`, fragment toCombatUnit `d1b401a2…`, units.json `7b509817…`)
- Pokrycie (z generatora): miss 644, hitMelee 353, hitRanged 203, charge 328, flankHit 186, rearHit 199, frontHit 171, onWall 241, fordDefender 127, shoreBonus 16, riverAttack 119, defHpZeroAfter 50, nanCase 116, infCase 224, unitOverride 314, hungerOrGoldDeficit 891.

NIE_ZMIERZONO: wydajność (czas kompilacji nie jest kryterium); typNazwa `Undef` przechodzi przez `js_to_string` jako "undefined" (w danych pinu nie występuje, nie testowane wprost).
