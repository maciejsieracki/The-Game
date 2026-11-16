# 02a OBRONA OPERATORA — R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1
GOAL: wektory pinu 07d2fbd72 dla `terrain_river_attack_multiplier` i flag z `blow_env_for`
BAZA: 7d8993c42 (operator 1c82ab4b6, obrona na 1c82ab4b6 + commit obrony, patrz niżej)
ZMIANY/COMMIT: obrona = commit na lokalnej gałęzi `R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1-wip/obrona-r1` (bez push); SHA: patrz sekcja SHA
TESTY: patrz sekcja TESTY
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 (weryfikacja poprawek z obrony) albo FC wg decyzji orkiestratora
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (niski): flagi `expAtkIsRiver` / `expRowExists` przepisane ręcznie, nie wycięte z pinu
Werdykt: PRZYJMUJĘ. Poprawka w `rust-port/engine/tests/p6_k5_blow_env_vectors/gen.mjs`:
- `isRiver` jest teraz ewaluowane z wyrażenia wyciętego z pinu `combat.ts:680` (regex `const isRiver = ([^;]+);` na fragmencie 677-687) przez `new Function`, a nie przez przepisany `nAtk.includes(...)`.
- Wiersz rzeki (`combat.ts:683`) jest ewaluowany z wyrażenia wyciętego regexem `normTerrain\(t\['Teren'\]\)\.includes\('...'\)` z tego samego fragmentu.
- Brak dopasowania któregokolwiek wyrażenia kończy generator kodem 4 (STRAZNIK).
- Dowód: ponowne wygenerowanie z pinu (`git archive 07d2fbd72`, SHA-256 zgodne) daje `blow_env.json` bajt-w-bajt identyczny z commitowanym (`cmp` = IDENTICAL, 56 przypadków).
- Pozostaje ręczne jest tylko opakowanie `.some` / `.find` (jedno wywołanie, bez logiki pinu).

### Zarzut 2 (niski): asercja `env.river_attack_mult == river_mult_pin` tautologiczna
Werdykt: ODRZUCAM. Asercja sprawdza tylko, że `blow_env_for` przekazuje wartość z kontekstu bez zmian. Wartość mnożnika nie jest weryfikowana wyłącznie przez tę asercję: w tym samym teście wynik `terrain_river_attack_multiplier(...)` oraz `attacker_river_mult_by_name(...)` jest porównywany z `exp_mult`, czyli wartością wyliczoną przez wycięte `terrainRiverAttackMultiplier` (`combat.ts:677-687`) z `combatParamsRaw` wstrzykniętym z `gra/data/combat-params.json` (SHA-256 strażnik). Gdyby wartość w `blow_env_for` była inna (np. 1.0), przypadki z `expMult` 0.75 dałyby FAIL. Poza zakresem tego tematu zostaje źródło `ctx.river_attack_mult` w produkcji (wczytanie z `combat-params.json`) — NIE_ZMIERZONO w tym temacie.

### Zarzut 3 (niski): kody BTerrain 0-3 only; brod (4) i kody 5-7 niepokryte
Werdykt: PRZYJMUJĘ (częściowo, z dodaniem testu). Dispatch wymieniał brod w zestawie wejść, więc pokrycie było niepełne.
- Dodano test `blow_env_kody_4_7_nazwy_jak_w_pinie` w `rust-port/engine/tests/p6_k5_blow_env.rs`.
- Oczekiwane nazwy z pinu: `battle-terrain.ts:42-46` (enum BTerrain: Ford=4, Rocks=5, Wall=6, Gate=7) oraz `battle-terrain.ts:150-158` (`COMBAT_NAME`): Ford(4) -> `Rzeka` (linia 155), Rocks(5)/Wall(6)/Gate(7) -> `Plaskie (rownina/laka)` (linie 156-158).
- Test sprawdza dla kodów 4, 5, 6, 7: nazwę kafla atakującego, `atk_tile_is_river` (brod = true, pozostałe = false), `river_row_exists`, mnożnik kopii B i mnożnik po nazwie (0.75 dla brodu, 1.0 dla 5-7).
- Wektory JSON nadal operują na nazwach (4 nazwy), więc kody 4-7 są pokryte testem Rust z oczekiwaniami wyprowadzonymi z pinu, nie generatorem.

### Zarzut 4 (informacyjny): `terrainRiverAttackMultiplier` nie czyta terenu obrońcy
Werdykt: PRZYJMUJĘ jako informację, bez zmiany kodu. Właśnie dlatego wektory z `defTerrain` są testem niezależności od obrońcy; mutacja atk->def je łapie (patrz TESTY).

## Zmiany w obronie
- `rust-port/engine/tests/p6_k5_blow_env_vectors/gen.mjs`: flagi z wyciętych wyrażeń pinu (zarzut 1).
- `rust-port/engine/tests/p6_k5_blow_env.rs`: test kodów 4-7 (zarzut 3); `rustfmt` na tym pliku.
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1/02a-obrona.md`: ten raport.
- Zero zmian w `src/`, `gra/`, `origin/main`; `blow_env.json` bez zmian; brak `#[ignore]`; brak `Cargo.lock` w commicie.

## TESTY
- Regeneracja wektorów z pinu po zmianie gen.mjs: OK, 56 przypadków; `cmp` z commitowanym `blow_env.json` = IDENTICAL.
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p6_k5_blow_env`: 3 passed, 0 failed (w tym nowy `blow_env_kody_4_7_nazwy_jak_w_pinie`).
- Mutacja w `siege_tactics_blow_env.rs:215` (`atk_tile_is_river` liczone z `def_terrain` zamiast `atk_terrain`): FAIL w `blow_env_river_vectors_match_pin` (`atk-rzeka-wiersz: atk_tile_is_river left=false right=true`) i w `blow_env_kody_4_7_nazwy_jak_w_pinie` (`kod 4: atk_tile_is_river`). Plik przywrócony z `git checkout` (zero diffu w `src/`).
- Pełny `cargo test --all-targets --no-fail-fast` (CARGO_TARGET_DIR poza repo): EXIT 0, łącznie 3627 passed, 0 failed, 1 ignored (ignored w `p6_order_lane.rs`, nie z tego tematu). Operator podał 3626 przed dodaniem nowego testu, różnica = +1 test z tego tematu.
- Przed poprawką (operator): 3626 passed, 0 failed, 1 ignored.

## SHA
- Baza operatora: 1c82ab4b6 (gałąź lokalna `R-RUSTPORT-P6-K5-BLOW-ENV-WEKTORY-Q1-wip/operator-r1`).
- Commit obrony: patrz sekcja SHA w raporcie zwrotnym do orkiestratora (wpisany po commicie).

## BLOKADY
Brak. Brak push. Brak integracji. `Cargo.lock` nieskomitowany (untracked).
