# DISPATCH R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1 (runda 1)

TEMAT: WIEZE-2A — port helperów wieżyczek miejskich z `city-towers.ts` (`strongestRangedUnitForEra`, `towerRangeFor`, `towerRows`, `missilePower`, `unitReach`). Etap 2A z podziału WIEZE-MERGE (etap 2B = strzał i odroczenie 180 ms, osobny dispatch po tym temacie).
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `7193f5de2` (czubek `origin/rust-port/parity-v2`, FF 14.11 po WIEZE etap 1). PRZED pracą: `git merge-base --is-ancestor 7193f5de2 HEAD` musi być prawdą; inaczej przestaw na `7193f5de2`. Gałąź robocza: `wip/R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/city-towers.ts` (cały plik, ok. 140 linii: `towerRows`, `towerMaterialFor`, `missilePower`, `unitReach`, `availableIn`, `nationOk`, `strongestRangedUnitForEra`, `towerRangeFor`, `eraName`, `CIV_TO_NACJA`). Pin `battleScene.ts:4167-4168` (wywołanie tych funkcji) — tylko odczyt, bez portu sceny.

## GOAL
W Rust istnieją czyste funkcje o identycznym zachowaniu jak w pinie `city-towers.ts`, pokryte wektorami wygenerowanymi z tekstu pina. Bez wiringu do produkcji (wiring = etap 2B). Zakaz zmiany `SiegeEnv`, `fire_siege_towers`, `pick_tower_target`.

## ZAŁOŻENIA (zasada 9: parytet 1:1, nie pytać)
- Funkcje portujesz bez zmiany semantyki, łącznie z fallbackiem „najlepsza z wcześniejszych epok” (pin oznacza go jako „do akceptacji”; na razie implementujemy pin).
- Nazwy kolumn jednostki (`Rola (linia)`, `missileAttack`, `Atak dystansowy`, `Zasięg ataku (hex)`, `Dostępna w epokach`, `Epoka`, `Nacja`) — dokładnie jak w pinie.
- Wektory NIE czytają `units.json` z repo (rozbieżności Rust vs pin są znane). Wektory generator buduje z SYNTETYCZNYCH wierszy jednostek zapisanych w pliku wektorów (wiersze i oczekiwany wynik wykonane przez tekst pina w node).

## ZAKRES (tylko to)
1. NOWY `rust-port/engine/src/domain/city_towers.rs`: porty funkcji z pinu. Typy wejściowe: wiersz jednostki jako mapa klucz→wartość (wzorem `serde_json::Value`/`BTreeMap<String, Value>`, jak operator uzna za spójne z resztą domeny; NIE wymyślaj nowego modelu jednostki).
2. `rust-port/engine/src/domain/mod.rs`: wyłącznie `pub mod city_towers;`.
3. NOWY test `rust-port/engine/tests/p6_city_towers.rs` + generator `rust-port/engine/tests/p6_city_towers_gen.mjs` (wzorem `p6_r7k7b_zloze_sync_gen.mjs`: wykonuje tekst pina z `git show 07d2fbd72:gra/src/game/city-towers.ts` w node, strażnik SHA-256 wejściowego pliku pina, zmienna środowiskowa lub argument dla typescript.js) + `rust-port/engine/tests/p6_city_towers_vectors/vectors.json`.
4. Testy: (a) `towerRows` na wektorach (w tym brama i spacing); (b) `strongestRangedUnitForEra` na wektorach (era 1–3, remis mocy → zasięg → kolejność danych, narodowe tylko dla swojej nacji, cofanie się do wcześniejszej epoki); (c) `towerRangeFor` z minRange; (d) liczniki niepustości > 0 dla każdej gałęzi; (e) brak wywołań `unwrap()` na ścieżkach wejścia z danych.

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/city_towers.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (tylko jedna linia)
- `rust-port/engine/tests/p6_city_towers.rs` (NOWY), `p6_city_towers_gen.mjs` (NOWY), `p6_city_towers_vectors/` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `siege_tactics_loop.rs`, `siege_tactics_turnseq.rs`, `siege_tactics_tower.rs`, `git add -A`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Każda funkcja z listy ZAKRES 1 ma odpowiednik w `city_tower.rs`; sygnatury opisane w raporcie.
2. Wektory z generatora (wykonuje pin), SHA-256 zgodny, liczniki > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak wiringu do produkcji (raport: „wołający w produkcji: brak — etap 2B” jest dopuszczalny).
4. Bramki EXIT 0 w `rust-port/engine` (z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_city_towers`; `cargo test --test p6_siege_tactics_loop` (regresja).
5. `git diff --stat` tylko na allowliście; `git diff --check` czysty.

## RAPORT I COMMIT
`01-operator-r1.md` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1/`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (SHA, allowlista)/TESTY (dokładne kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit na `wip/R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1`, BEZ push do parity-v2. Treść commita: bez nazwy modelu; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
