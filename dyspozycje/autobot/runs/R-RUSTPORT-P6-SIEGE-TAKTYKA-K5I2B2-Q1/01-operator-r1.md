# R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1 — Operator, runda 1/5 (HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1 (K5I2b2: adapter pozycja + mapa + mur -> BlowEnv)
GOAL: `single_blow_full` dostaje `BlowEnv` z adaptera (pozycja obrońcy i atakującego, kierunki, mapa kafli, stan muru, teren, most/brzeg) zamiast wartości wpisywanych ręcznie. Wektory pochodzą z pinu `07d2fbd72`, a funkcje `relativeHit`, `isFordTile`, `isShoreAdjacentToFord`, `_wallBonusProcFor`, `terrainDefenseMultiplier`, `cityGatedTerrainMultiplier` są wykonywane z TEKSTU pinu (bez stubów).
BAZA: `da50d1753` (detached HEAD; zgodnie z dispatchem, `origin/rust-port/parity-v2` = ten sam commit).
ZMIANY/COMMIT: patrz sekcja „Commity” poniżej.

## Zakres zmian (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/siege_tactics_blow_env.rs` | NOWY. `TileMap` (OOB = Plains, jak `BattleTerrainMap.at` w `battle-terrain.ts:781-784`), `TerrainRow`, `BlowSceneCtx`, `BlowPlacement`, `blow_hit_arc` (relativeHit), `blow_wall_bonus_proc` (_wallBonusProcFor), `blow_env_for` (BlowEnv), `attacker_river_mult_by_name`. 5 testów jednostkowych. |
| `rust-port/engine/src/domain/mod.rs` | Tylko rejestracja `pub mod siege_tactics_blow_env;`. |
| `rust-port/engine/tests/p6_siege_tactics_blow_env.rs` | NOWY. Kopia testu `p6_siege_tactics_blow_full.rs` z `BlowEnv` składanym przez adapter z wektora; dodatkowo `env_mismatches` (obserwacje pinu vs adapter) i straźnik SHA środowiska i terenu. |
| `rust-port/engine/tests/p6_siege_tactics_blow_env_gen.mjs` | NOWY. Generator (Node 22). Wykonuje tekst pinu dla relativeHit (+facingToward, oppositeDir), isFordTile, isShoreAdjacentToFord, _wallBonusProcFor (+fortificationDefenseBonusForUnit, defenderInsideFortification), terrainDefenseMultiplier (+normTerrain, parseDefenseBonusPct), terrainRiverAttackMultiplier, cityGatedTerrainMultiplier; enumy Dir i BTerrain parsowane z pinu (z guardem liczby pozycji). |
| `rust-port/engine/tests/p6_siege_tactics_blow_env_vectors/vectors.json` | NOWY. 1200 przypadków, ~7,1 MB. |

Bez zmian: `siege_tactics_blow_full.rs` (nie potrzebny żaden minimalny adapter API), `Cargo.toml`, `Cargo.lock` (wygenerowany lokalnie, nie commitowany), `rust-port/engine/data/**`, `gra/**`, `WERSJE.md`. Brak nowych pól stanu (brak `serde`, brak migracji). Brak literałów struktur w istniejących testach do adaptacji (stary test `p6_siege_tactics_blow_full` nietknięty).

## Straźniki SHA-256 (pin 07d2fbd72)

- fragmenty ciosu (stare, bez zmian): `b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526`
- fragmenty toCombatUnit: `d1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c`
- units.json: `7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7`
- fragmenty środowiska (nowe): `c2ef94c501ea2f04e7f13e3350d7a7ff53de42db7be1afe7dcbbcdbd090c716b`
- terrain-combat.json (nowe): `b5f0f9c5c25a65273bc674d1ae1121ab09d93141085eb0c1a9b1bc911798f9bf`

## Wynik porównania (end-to-end)

- Przypadki: 1200 (ziarno 2201), 75/75 wierszy units.json użytych, 323 z nadpisaniem NaN/Inf/-Inf w statystyce.
- Obserwacje pinu porównane z adapterem: `hitArc`, `tdm`, `gated`, `wallBonus`, mnożnik rzeki po nazwie, `atkFord`, `defFord`, `shore`, `riverRow`. Każda wartość null w wektorze oznacza, że pin nie wołał tej funkcji w tym przypadku, więc nie jest porównywana.
- Skład ciosu (`hitChanceTw` argumenty, `baseDamage` / `rangeDamage`, wynik trafienia, obrażenia, HP, morale, `engaged`) porównany z `single_blow_full` na `BlowEnv` z adaptera. Bez rozbieżności.
- Pokrycie gałęzi (z `coverage` w wektorze): pudło 669, trafienie wręcz 354, trafienie dystansowe 177, szarża 332, flank 252, tył 147, front 132, obrońca na murze 256, bitwa o miasto 348, bitwa w polu 852, obrońca w brodzie 241, bonus brzegu 100, atak przez rzekę 224, łucznik dystansowy 12, procarz 2 (słaba gałąź), NaN 125, Inf 221.

## Testy i bramki (EXIT zapisany)

- `cargo fmt --check` (rust-port/engine): exit 0.
- `cargo clippy --all-targets -- -D warnings`: czysto.
- `cargo test --lib`: 93 passed, 0 failed (w tym 5 nowych testów adaptera).
- `cargo test --test p6_siege_tactics_blow_env`: 3 passed.
- `cargo test --test p6_siege_tactics_blow_full`: 3 passed (test starszy, bez zmian).
- `CARGO_TARGET_DIR` poza repo; katalog usunięty po bramkach.
- Pełny `cargo test` nie uruchamiany (zgodnie z dispatchem: wykona runda integracyjna).

## Uwagi i zakres (NIE_ZMIERZONO tam, gdzie nie zmierzono)

- W pinie `combatTerrainName` (TerrainMap) nie jest wykonywane: gen czyta nazwy z mapy testowej. To świadome: TerrainMap nie jest częścią zakresu K5I2b2. Adapter przyjmuje gotową mapę nazw i kodów.
- Stubami pozostają wyjścia spoza zakresu: `civCombatStatMultipliers`, `mergeBuildingBonusIntoStatMultipliers`, `battleUnitCivBonusy`, `civWallDefenseMultiplier`, `battleUnitDifficultyCombatMult`, `counterMultiplier`, `bracesAgainstCharge`, stałe MORALE, obiekt `Math`. Zgodnie z dispatchem są podawane jako wejścia `FullBlowInput`.
- Wejścia środowiska są skończone (mapa, teren, mur, kolumna muru). NaN/Inf nie są wstrzykiwane w tym zakresie. NaN występuje tylko przez nadpisania statystyk jednostek. NIE_ZMIERZONO: NaN w `wallDefenseTotalProc` / `siegeWallCol` / mnożnikach terenu.
- Dwie funkcje `terrain_river_attack_multiplier` (dispatch): `siege_tactics_blow_inputs` (flagi logiczne, używana w `compose_blow`) i `siege_tactics_inputs_terrain` (po nazwie, używana w adapterze do sprawdzenia). Adapter ustawia flagi tak, by wynik logiczny był równy wynikowi po nazwie; porównanie jest w teście jednostkowym i w `riverMult` testu end-to-end.
- Procarz (`Slinger`) w 2 przypadkach to słaba gałąź pokrycia; nie zwiększałem liczby przypadków, bo wymagałoby to zmiany generatora poza zakresem.
- Brak mutacji testu (nie sprawdzałem, że każda rozbieżność jest wykrywana). Dowodem jest zielony przebieg 1200 przypadków z porównaniami obserwacji.

## Commity

- Commit kodu (adapter, mod.rs, test, generator, wektory): SHA podany w odpowiedzi orkiestratora (gałąź `r-rustport-k5i2b2-wip/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1`, lokalna, bez push).
- Nie pushowano do `rust-port/parity-v2`, `origin/main` ani żadnej gałęzi zdalnej. Brak integracji, brak deployu.

BLOKADY: brak (zakres K5I2b2 wykonany w całości; luki opisane wyżej jako NIE_ZMIERZONO).
RUNDY: 1/5, ostatni werdykt: brak (pierwsza runda Operatora).
NASTĘPNY KROK: Evaluator (SONNET) na tym SHA; następnie Final Control (SONNET); integracja orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO
