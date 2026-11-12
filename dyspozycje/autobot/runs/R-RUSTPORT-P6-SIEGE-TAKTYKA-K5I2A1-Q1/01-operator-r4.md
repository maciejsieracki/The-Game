STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A1-Q1
GOAL: port 1:1 czystych funkcji terenowych (normTerrain, parseDefenseBonusPct, terrainDefenseMultiplier, terrainRiverAttackMultiplier, cityGatedTerrainMultiplier) z pinu 07d2fbd72 do nowego modulu z wektorami z wykonania tekstu pinu
ZMIANY/COMMIT: baza a097600e1. Pliki (allowlista): rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs (nowy), src/domain/mod.rs (tylko `pub mod`), tests/p6_siege_tactics_inputs_terrain.rs, tests/p6_siege_tactics_inputs_terrain_gen.mjs, tests/p6_siege_tactics_inputs_terrain_vectors/vectors.json, ten raport. SHA commitu: patrz `git log` gałęzi roboczej (SHA podany w odpowiedzi orkiestratorowi; commit zawiera ten raport).
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib 57 passed EXIT 0; cargo test --test p6_siege_tactics_blow (3) --test p6_siege_tactics_end (8) --test p6_siege_tactics_endcheck (9) --test p6_siege_tactics_inputs_terrain (7): wszystkie ok, EXIT 0. Testy K5I bez zmian.
BLOKADY: brak
RUNDY: 4/5 wg numeracji dispatchu (pierwsza runda K5I2a1 na bazie a097600e1; plik raportu 01-operator-r4.md wg polecenia)
NASTĘPNY KROK: Evaluator

## Lokalizacja w pinie (potwierdzona grepem)
Wbrew dispatchowi pliki sa w `gra/src/game/`, NIE `gra/src/battle/`:
- combat.ts: normTerrain 620-624, parseDefenseBonusPct 632-637, terrainDefenseMultiplier 639-671, terrainRiverAttackMultiplier 677-687.
- city-defense.ts: cityGatedTerrainMultiplier 180-190.
Strażnik SHA-256 fragmentow w generatorze: 2ac3548a5b1b9a0fbe25ab368f6bb6063ca06761756c7f57288c934039b6e4f6.

## Metoda wektorow
Generator (Node 22.23) wycina fragmenty pinu przez `git show`, zdejmuje typy TS (`module.stripTypeScriptTypes`) i WYKONUJE je w `new Function`. `combatParamsRaw.river_attack_mult` (import JSON) = wejscie wektora (wartosc z pinu 0.75 oraz NaN/Inf/0/-0/1e308 itd.). Dane terenu: realny `terrain-combat.json` z pinu + syntetyczne zestawy. Ziarno 2211.

## Liczby
- normTerrain: 631 przypadkow + test po WSZYSTKICH 1 112 064 punktach kodowych (skrot FNV-1a 64 zgodny z Node).
- parseDefenseBonusPct: 340 przypadkow (undefined, '', '+0%', '---', '+-5', '++5', '12abc34', cyfry pelnoszerokosciowe i arabskie (nie sa \d), 400 cyfr -> Infinity, '-0', itd.).
- terrainDefenseMultiplier: 700; terrainRiverAttackMultiplier: 700; cityGatedTerrainMultiplier: 700.
- Pokrycie galezi (liczniki z wektorow, wszystkie > 0): def_early 149, def_no_entry 190, def_las_bonus 26, def_las_plain 21, def_pct 137, def_pct_null 177; river_early 88, river_not 340, river_hit 209, river_no_row 63; city_no_wall 243, city_elev 179, city_flat 278.
- Wszystkie liczniki sa asertowane w tescie Rust (osobno kazda galaz > 0) oraz porownanie bitowe wynikow (NaN==NaN, rozroznione +0/-0).

## Decyzje i granice (NIE_ZMIERZONO tam, gdzie dotyczy)
- Brak NFD w Rust std, brak nowych zaleznosci (Cargo.toml zakazany): tabela "znak -> NFD bez U+0300..U+036F" (2189 wpisow, wygenerowana z Node `normalize('NFD')`, flaga `--table` generatora) + algorytmiczny Hangul. Zgodnosc dowiedziona na wszystkich punktach kodowych (poza surogatami). Granice: kanoniczne przestawianie (ccc) wielu znakow laczacych spoza U+0300..U+036F nie jest odtwarzane; zgodnosc `toLowerCase` JS vs `to_lowercase` Rust udowodniona na pojedynczych punktach kodowych i 631 napisach, nie na kontekstach (np. final sigma poza wektorami: `ΣΊΣΥΦΟΣ` jest w wektorach i przechodzi).
- `terrain_river_attack_multiplier` w nowym module ma pelna sygnature (nazwa terenu + dane + `river_attack_mult`); istniejacy helper o tej samej nazwie w `siege_tactics_blow_inputs.rs` (wejscia logiczne) NIE zostal zmieniony (zakres a2-a4); po stronie wolajacego pozostaje wybor wersji.
- `siege_tactics_blow_inputs.rs` i `combat.rs` nie edytowane.
- Dysk: wolne 7,3 GB przy starcie (< 8 GB) - kompilacja mimo to, CARGO_TARGET_DIR w /tmp/claude-0/k5/target poza repo, usuniety po bramkach.
