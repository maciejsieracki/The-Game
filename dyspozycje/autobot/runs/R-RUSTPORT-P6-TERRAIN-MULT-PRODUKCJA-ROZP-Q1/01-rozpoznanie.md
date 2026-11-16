STATUS: PASS
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-TERRAIN-MULT-PRODUKCJA-ROZP-Q1 (runda 1)
GOAL: ustalić, która kopia `terrain_river_attack_multiplier` jest używana przez produkcję i czy dwie kopie dają różny wynik względem pinu `07d2fbd72`.
ZMIANY/COMMIT: tylko katalog runu `dyspozycje/autobot/runs/R-RUSTPORT-P6-TERRAIN-MULT-PRODUKCJA-ROZP-Q1/` (ten raport + kopia `00-dispatch.md`). Kod nie zmieniony. Brak push.
TESTY: NIE_ZMIERZONO (dispatch wymaga trybu wyłącznie odczytu, bez cargo). Ustalenia oparte na `git grep` / `git show` na SHA bazy oraz na porównaniu logiki z pinem.
BLOKADY: brak. Ograniczenie: osiągalność w produkcji oceniona statycznie (grep po kodzie), bez uruchomienia gry.
RUNDY: 1/5, werdykt Operatora (zgłoszenie do Evaluatora)
NASTĘPNY KROK: Evaluator (weryfikacja tabeli wywołań i równoważności logicznej obu kopii).
DEPLOY/PUSH: NIE WYKONANO

---

## 0. Baza i piny

- Baza: `origin/rust-port/parity-v2` = `de88d9d558a841ba214dad5e3df17481e102d67c` (zweryfikowane `git fetch`).
- Pin: `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.
- Odczyt bazy bez checkoutu: `git grep -n <wzorzec> de88d9d55 -- rust-port/...`, `git show de88d9d55:<plik>`.

## 1. Kopie funkcji w Rust (baza `de88d9d55`)

| Kopia | Definicja | Wejścia | Charakter |
|---|---|---|---|
| A | `rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs:148` | `defender_terrain: &str`, `terrain_data: &[TerrainEntry]`, `river_attack_mult: f64` | 1:1 z pinem, nazwa terenu + dane terenu |
| B | `rust-port/engine/src/domain/siege_tactics_blow_inputs.rs:21` | `tile_is_river: bool`, `river_row_in_terrain_data: bool`, `river_attack_mult: f64` | wersja logiczna (flagi zamiast nazw) |

## 2. Wywołujący (`git grep -n terrain_river_attack_multiplier de88d9d55 -- rust-port/engine/src rust-port/engine/tests`)

| Plik:linia | Wywołanie / import | Kopia | Produkcja czy test |
|---|---|---|---|
| `rust-port/engine/src/domain/siege_tactics_blow_full.rs:30` | `use ...siege_tactics_blow_inputs::terrain_river_attack_multiplier;` | B | import produkcyjnego modułu |
| `rust-port/engine/src/domain/siege_tactics_blow_full.rs:245` | `let river_mlt = terrain_river_attack_multiplier(env.atk_tile_is_river, env.river_row_exists, env.river_attack_mult);` | B | produkcyjny kod (`compose_blow`, składanie ciosu) |
| `rust-port/engine/src/domain/siege_tactics_blow_env.rs:26` | `terrain_river_attack_multiplier as terrain_river_by_name` (import z kopii A) | A | produkcyjny moduł, funkcja `attacker_river_mult_by_name` (`:184-188`) |
| `rust-port/engine/src/domain/siege_tactics_blow_env.rs:239` | `use ...siege_tactics_blow_inputs::terrain_river_attack_multiplier as river_logical;` | B | test wewnątrz modułu (`rzeka_flagi_daja_ten_sam_mnoznik_co_po_nazwie`, `:347-374`) |
| `rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs:767,769` | asercje w `#[cfg(test)]` | A | test jednostkowy |
| `rust-port/engine/tests/p6_siege_tactics_inputs_terrain.rs:9,197-204` | `terrain_river_attack_multiplier_wektory` (wektory z JSON, gałęzie `river_early/river_not/river_hit/river_no_row`) | A | test integracyjny |

Uwaga do `siege_tactics_blow_env.rs`: `blow_env_for` (`:191`) nie woła żadnej kopii bezpośrednio. Wylicza flagi logiczne `atk_tile_is_river` (`:215`) i `river_row_exists` (`:216`) i przekazuje je w `BlowEnv` do `siege_tactics_blow_full.rs:245` (kopia B).

Ścieżka produkcyjna: `siege_tactics_blow_full::single_blow_full` / `compose_blow` jest importowana tylko przez `siege_tactics_loop.rs` (`:36-37`, `:282`, `:1212`) oraz testy. Żaden moduł poza `siege_tactics_loop` nie wywołuje `siege_tactics_loop` poza testami (grep po `siege_tactics_loop` w `rust-port/`, bez `/tests/`: tylko `domain/mod.rs:127` i komentarze). `siege_tactics_outcome.rs:35` wprost oznacza podpięcie pętli jako temat `#113 K5LOOP-WIRING` (jeszcze niezrobione). Wniosek: kopia B jest na ścieżce obliczeń ciosu w kodzie domeny, ale brak produkcyjnego wejścia (K5LOOP-WIRING) do tej ścieżki z gry. Potwierdzić przy Evaluatorze.

## 3. Pin (`07d2fbd72`)

- Definicja: `gra/src/game/combat.ts:677-687` (dokumentacja `:674-676`):
  ```ts
  export function terrainRiverAttackMultiplier(defenderTerrain, terrainData) {
    if (!defenderTerrain || terrainData.length === 0) return 1.0;
    const terrNorm = normTerrain(defenderTerrain);
    const isRiver = terrNorm.includes('rzek') || terrNorm.includes('river');
    if (!isRiver) return 1.0;
    const entry = terrainData.find((t) => normTerrain(t['Teren']).includes('rzek'));
    return entry ? combatParamsRaw.river_attack_mult : 1.0;
  }
  ```
- Wywołania w pinie:
  - `gra/src/battle/battleScene.ts:8861` — `terrRiverMlt = terrainRiverAttackMultiplier(atkTerrain, this.terrainData)`; `atkTerrain = this.terrainMap.combatTerrainName(attacker.q, attacker.r)` (`:8843`). To jest ścieżka oblężnicza (`_singleBlow`), czyli ta, którą odwzorowuje Rust.
  - `gra/src/game/combat.ts:997` — `terrainRiverAttackMultiplier(defenderTerrain, terrainData)` w `resolveCombat` (inna, starsza ścieżka, nie objęta `siege_tactics_*`).
- Pin używa mnożnika ataku z `combat-params.json` (`river_attack_mult`, w Rust `units_combat.rs:304` / `blow_env` `river_attack_mult`). W obu kopiach wartość przychodzi jako parametr.

## 4. Porównanie logiki: kopia A vs pin vs kopia B

Dla kopii A (`siege_tactics_inputs_terrain.rs:148-163`) warunki są dokładnie te z pinu:
- pusty teren lub pusta tabela → `1.0`;
- `norm_terrain(defender_terrain)` zawiera `rzek` lub `river`, inaczej `1.0`;
- jeśli jakikolwiek wiersz `norm_terrain(t.teren)` zawiera `rzek` → `river_attack_mult`, inaczej `1.0`.

Dla kopii B (`siege_tactics_blow_inputs.rs:21-27`):
- `tile_is_river && river_row_in_terrain_data` → `river_attack_mult`, inaczej `1.0`.

Przy wejściach z produkcji (`blow_env_for`, `siege_tactics_blow_env.rs:184-217`):
- `atk_tile_is_river = norm_terrain(atk_terrain).contains("rzek") || .contains("river")` — jest to dokładnie warunek `isRiver` z pinu, zastosowany do nazwy kafla atakującego (`atk_terrain = ctx.map.name(aq, ar)`, czyli odpowiednik `combatTerrainName(attacker.q, attacker.r)`);
- `river_row_exists = rows.iter().any(|r| norm_terrain(r.teren).contains("rzek"))` — dokładnie `terrainData.find(... includes('rzek'))` z pinu.

Zatem `kopia A(atk_terrain, rows, m) == kopia B(atk_tile_is_river, river_row_exists, m)` dla wszystkich wejść, bo obie strony liczą ten sam predykat na tych samych danych. Przypadki brzegowe (pusty napis, brak wiersza, teren bez słowa „rzek"/„river") dają w obu kopiach `1.0`. Także `terrain_river_by_name` używany w `attacker_river_mult_by_name` (kopia A) i `river_logical` w teście (kopia B) są w teście `rzeka_flagi_daja_ten_sam_mnoznik_co_po_nazwie` porównywane ze sobą (`blow_env.rs:347-374`).

Różnica w sygnaturze (A: nazwa + dane; B: flagi) nie zmienia wyniku. Kopia A ma nazwę parametru `defender_terrain`, a w ścieżce oblężniczej przekazywany jest teren atakującego (zgodnie z pinem `battleScene.ts:8861`). Nazwa jest myląca, ale semantyka funkcji (predykat na przekazanym terenie) jest zgodna z pinem.

## 5. Przypadki różnicujące

Nie znaleziono wejść, dla których wynik kopii A i B się różni, przy wejściach budowanych przez `blow_env_for`. Przykład zgodności, który można odtworzyć w teście:
- `atk_terrain = "Rzeka"`, dane z wierszem `"Rzeka"`, `river_attack_mult = 0.75` → pin `0.75`, kopia A `0.75`, kopia B (`true, true`) `0.75`.
- `atk_terrain = "Rzeka"`, dane bez wiersza rzeki → pin `1.0`, kopia A `1.0`, kopia B (`true, false`) `1.0`.
- `atk_terrain = "Plaskie (rownina/laka)"`, dane z wierszem rzeki → pin `1.0`, kopia A `1.0`, kopia B (`false, true`) `1.0`.

Wektory pinu dla kopii A są w `rust-port/engine/tests/p6_siege_tactics_inputs_terrain.rs:197` (gałęzie `river_*`, min. 500 przypadków). Nie uruchamiano ich (brak cargo w tym temacie). Stan: NIE_ZMIERZONO w sensie wykonania testu.

## 6. Ocena wpływu

- Wynik: ZGODNE. Kopia B używana w `siege_tactics_blow_full.rs:245` daje tę samą wartość co pin `battleScene.ts:8861` dla wejść składanych w `blow_env_for`.
- Rozbieżność w produkcji: NIE stwierdzono.
- Osiągalność: `siege_tactics_blow_full.rs:245` jest na ścieżce składania ciosu w `siege_tactics_loop`, ale ta pętla nie ma jeszcze produkcyjnego wywołania z gry (temat #113 K5LOOP-WIRING). Realny wpływ na wynik gry w tej bazie: NIE_ZMIERZONO (wymaga uruchomienia gry lub wpięcia pętli).
- Ryzyko na przyszłość: po podpięciu pętli obie kopie mają się zgadzać. Gdy zmieni się sposób liczenia flag w `blow_env_for`, test `rzeka_flagi_daja_ten_sam_mnoznik_co_po_nazwie` (`siege_tactics_blow_env.rs:347`) wychwyci rozjazd.

## 7. Wniosek

ZGODNE. Obie kopie dają ten sam wynik dla wszystkich wejść osiągalnych z `blow_env_for`, a kopia logiczna (B) jest zgodna z pinem `battleScene.ts:8861` / `combat.ts:677-687`. Nie ma zmiany kodu do wykonania w tym temacie. Pozostaje dług dokumentacyjny: nazwa parametru `defender_terrain` w kopii A nie oddaje faktu, że w ścieżce oblężniczej przekazywany jest teren atakującego.

## 8. Odtwarzalne polecenia

```bash
git fetch origin rust-port/parity-v2
git rev-parse origin/rust-port/parity-v2           # de88d9d55...
git grep -n terrain_river_attack_multiplier de88d9d55 -- rust-port/engine/src rust-port/engine/tests
git show de88d9d55:rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs | sed -n '148,163p'
git show de88d9d55:rust-port/engine/src/domain/siege_tactics_blow_inputs.rs | sed -n '21,27p'
git show de88d9d55:rust-port/engine/src/domain/siege_tactics_blow_full.rs | sed -n '245,249p'
git show de88d9d55:rust-port/engine/src/domain/siege_tactics_blow_env.rs | sed -n '184,217p'
git show 07d2fbd72:gra/src/game/combat.ts | sed -n '674,687p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '8843p;8861p'
git grep -n 'siege_tactics_loop' de88d9d55 -- rust-port | grep -v /tests/
```
