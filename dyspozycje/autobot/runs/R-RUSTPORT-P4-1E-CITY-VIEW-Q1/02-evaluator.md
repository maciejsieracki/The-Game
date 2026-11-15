# R-RUSTPORT-P4-1E-CITY-VIEW-Q1 — Evaluator (adwersarialny), runda 1

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1E-CITY-VIEW-Q1
GOAL: producent widoku miast (`OwnerViewDto`, `CityViewDto`, `CityBadgeDto`) z `PlayableState`, wartości zgodne z webem (pin `07d2fbd72`)
ZMIANY/COMMIT: oceniany commit Operatora `1e24318c9` (gałąź `rust-port-wip/R-RUSTPORT-P4-1E-CITY-VIEW-Q1`, baza `a01363d5f`); ten raport to jedyna zmiana Evaluatora (commit bez push)
TESTY: bramki odtworzone, wszystkie EXIT 0 (szczegóły §1); własne mutanty: 7 z 11 zabitych, 4 przeżyły (§4)
BLOKADY: brak blokad w kodzie; FAIL wynika z kryterium końca nr 4 (test mutacji), zarzuty Z1 i Z2
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 (to samo ID): dopisać scenariusze do `gen/scenarios.json`, zregenerować wektory generatorem, dopisać mutanty E4, E14, E7 i E8 do `gen/mutacje.py`. Kod producenta zostaje bez zmian.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone niezależnie)

Środowisko: `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo (po bramkach usunięty), `Cargo.lock` usunięty lokalnie (nie commitowany).

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0, brak ostrzeżeń |
| `cargo test --all-targets` | EXIT 0: 3392 passed, 0 failed, 1 ignored (istniejący `e2e::dump_tick1_econ_for_web_generator`, nie z tego tematu) |
| `cargo test --test view_city_pin_vectors` (część pełnego przebiegu) | 11 passed, 0 failed, 0 ignored |
| `git diff --check a01363d5f 1e24318c9` | EXIT 0 |
| `gen_city_view_vectors.py --check` | EXIT 0 („blok wektorów zgodny z pinem 07d2fbd72”) |

Uwaga infra (to nie zarzut): pierwszy przebieg `cargo test` dał EXIT 101 z błędem `could not parse/generate dep info … No such file or directory`. Katalog target leżał we wspólnym scratchpadzie sesji i ktoś go równolegle usuwał. Powtórka z unikalnym `CARGO_TARGET_DIR` dała EXIT 0. Liczby zgadzają się z raportem Operatora.

## 2. Allowlista i granice

`git diff --name-only a01363d5f 1e24318c9`, 9 plików, wszystkie w allowliście:
- `rust-port/engine/src/domain/city_view.rs`: nowy plik.
- `rust-port/engine/src/domain/mod.rs`: wyłącznie `+pub mod city_view;`, alfabetycznie między `city_towers` a `civ_bonuses`.
- `rust-port/engine/Cargo.toml`: wyłącznie `+civ-view-model = { path = "../view-model" }`.
- `rust-port/engine/tests/view_city_pin_vectors.rs`: nowy plik.
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/{01-operator-impl.md, gen/*}`.

Zero zmian w `gra/`, `view-model/`, `renderer/`, `src-tauri/`, `bridge.rs`, `playable.rs`, `save_load.rs` i `state.rs`. `Cargo.lock` nie jest w commicie. `git merge-base --is-ancestor a01363d5f 1e24318c9` dało 0.

Grep diffu po `#[ignore`, `unsafe`, `allow(`, `should_panic`, `todo!` i `unimplemented!` znalazł tylko `#![forbid(unsafe_code)]` w `city_view.rs:39`. Asercje testów to pełne `assert_eq!` na całych DTO względem wektorów pinu, plus porównanie zbioru kluczy JSON. Nie znalazłem asercji osłabionych ani tolerancyjnych.

## 3. Pola DTO względem webu (sprawdzone ręcznie, plik:linia na pinie `07d2fbd72`)

Wylosowane i sprawdzone (więcej niż wymagane 3):
1. `CityBadgeDto.prodCategoryLabel`: web `render/cities.ts:899-901` (`front ? (front.kind === 'budynek' ? 'Budynek' : 'Jednostka') : null`). Rust `city_view.rs:563-566`. Zgodne.
2. `CityViewDto.level`: web `main.ts:2956-2959` (`Math.max(1, Math.min(10, c.population ?? 1))`). Rust `city_view.rs:628` (`population.clamp(1.0, 10.0)`, populacja `u32`, więc bez NaN). Zgodne.
3. `OwnerViewDto.ringHex`: web `main.ts:10381-10383` (`isBarbarian || portraitForceCultureIcon ? null : civRingHexFn`) i `:4080-4082` (`'#' + …toString(16).padStart(6,'0')`). Rust `city_view.rs:453-457`, `:230-232`. Zgodne.
4. `CityBadgeDto.growthPercent` i `growthStarving`: web `render/cities.ts:904` (callback tylko dla `isPlayerCity`) i `:914-915`. Rust `city_view.rs:543-569`. Zgodne.
5. `OwnerViewDto.mapOutlineKind`: web `main.ts:22659-22672`, `isAllianceDealKind` `:22653-22656`, `dealInvolvesOwners` `:22679-22682` (para znormalizowana). Rust `city_view.rs:329-350`. Zgodne.
6. `capitalCityId`: web `main.ts:34999-35003` i `game/capital-capture.ts:66-85` (`cityFoundOrder('city'+N)`). Rust `city_view.rs:300-316`. Zgodne co do logiki; konwencja „jawna stolica = pierwsze miasto z `is_capital`” to założenie, zob. Z3.
7. `color` i `parseHexColor`: web `game/civ-visual.ts:22-31`, `:59-70`. Rust `city_view.rs:173-198`. Zgodne (różnice `trim()` JS i Rust dla U+FEFF nie występują w `civs.json`).
8. `bronzeCiv`: web `render/bronzeCity.ts:23-40`. Rust `city_view.rs:201-216`, tabela 1:1.
9. `fogVisible`: web `main.ts:13082-13086`. Rust `city_view.rs:613-615`. Zgodne.
10. `relationToViewer`: web `main.ts:4065-4068` z `getDiploRelation` `:10312-10335`. Status pary bez wpisu = `'neutralni'`, bo `applyWiarygodnoscD4ToRelation` (`game/diplomacy-layers.ts:166-175`) zmienia tylko `zaufanie`, nie `status`. Rust `city_view.rs:320-367`. Zgodne.

Typy DTO (`rust-port/view-model/src/owners.rs:82-189`) bez zmian, pola 1:1 z kontraktem §3.4.

## 4. Własny test mutacji Evaluatora (niezależny od `gen/mutacje.py`)

Skrypt podmienia jeden fragment w `city_view.rs`, uruchamia `cargo test --test view_city_pin_vectors` i przywraca plik (po przebiegu `git status` czysty).

| # | Mutant | Wynik |
|---|---|---|
| E1 | `RelationStatus::Alliance => return Ally` → `{}` (sojusz z relacji pominięty) | zabity (101) |
| E3 | `is_alliance_deal_kind` bez `DefensiveAlliance` | zabity (101) |
| **E4** | jawna stolica pominięta (`find(|c| false && c.is_capital …)`, zawsze najstarsze miasto) | **PRZEŻYŁ (0)** |
| E5 | mgła: `contains(&(r, q))` zamiast `(q, r)` | zabity (101) |
| **E7** | `ring_hex` bez dopełnienia do 6 cyfr (`{color:x}`) | **PRZEŻYŁ (0)** |
| **E8** | paleta zapasowa `owner_id % 7` zamiast `% 8` | **PRZEŻYŁ (0)** |
| E9 | relacja `War` → `Neutralni` | zabity (101) |
| E10 | relacja `Alliance` → `Pokoj` | zabity (101) |
| **E14** | `unitCountOnHex` liczy tylko jednostki właściciela miasta | **PRZEŻYŁ (0)** |
| E16 | pula surowców liczona dla widza zamiast właściciela miasta | zabity (101) |
| E17 | `playerCivKey` = właściciel zamiast widza (`portraitForceCultureIcon`) | zabity (101) |

## 5. Zarzuty

**Z1 (FAIL, kryterium końca 4).** Gałąź jawnej stolicy w `capital_city_id_for_owner` (`city_view.rs:301-307`, web `main.ts:35000-35001`, `capitalCityIdByOwner`) nie jest pokryta żadnym wektorem. Mutant E4 usuwa ją w całości i 11/11 testów dalej przechodzi. Żaden scenariusz nie ma właściciela, którego miasto z `isCapital` nie jest jego najstarszym miastem (najmniejsze N w `'city'+N`). Wtedy `capitalCityId`, `isCapital` i etykieta stolicy obcego państwa (`formatCityMapLabel`, nazwa cywilizacji) nie odróżniają jawnej stolicy od zapasowej. Web rozróżnia te dwa przypadki po przeniesieniu stolicy (follow-up „przenieś stolicę”, `capital-capture.ts:88+`). Naprawa: scenariusz w `gen/scenarios.json` z właścicielem obcym dla widza (żeby było widać też etykietę), w którym miasto `isCapital` ma większy id niż inne miasto tego właściciela. Potem regeneracja wektorów i E4 w `gen/mutacje.py`.

**Z2 (FAIL, kryterium końca 4).** `unitCountOnHex` (`city_view.rs:617-621`, web `main.ts:2901-2907` liczy wszystkie `units` na heksie, bez filtra właściciela) nie ma wektora z obcą jednostką na heksie miasta. Mutant E14 (filtr po właścicielu) przeżywa. Naprawa: scenariusz z jednostką innego właściciela na heksie miasta (w webie np. wróg w oblężeniu albo jednostka sojusznika w przemarszu) i E14 w `gen/mutacje.py`.

**Z3 (uwaga, pokrycie).** Paleta zapasowa `OWNER_COLORS_FALLBACK[ownerId % 8]` (`civ-visual.ts:69`) i dopełnienie `padStart(6,'0')` w `civRingHexFn` (`main.ts:4081`) są sprawdzane tylko dla właściciela 4 z nieznaną cywilizacją (`player-4` → `0xfb8c00`). Dla 4 zachodzi 4 % 7 = 4 % 8, a kolor ma 6 cyfr bez zera wiodącego, więc E7 i E8 przeżywają. Ścieżka nie zachodzi dla kluczy z `civs.json` (każdy wiersz ma 6-cyfrowy `kolorHex`), ale jest osiągalna dla kluczy spoza `civs.json` (np. `PlayableGame::add_player` daje `player-{id}`, `playable.rs:819`). Proponuję dodać właściciela 6 (`0x00acc1`, zero wiodące w `ringHex`) albo 7 z nieznanym kluczem i E7/E8 do `gen/mutacje.py`. Sama ta uwaga nie dawałaby FAIL.

**Z4 (uwaga, zakres pokrycia wektorów, bez zmiany wymaganej teraz).** Klej z `main.ts` jest w `gen/harness.cjs` przepisany, a nie wykonywany. Dwie konwencje są wspólne dla harnessu i Rust, więc wektory ich nie zweryfikują: (a) `empireEpochForOwner` = `gameStartEra()` dla wszystkich (harness `:96-99`), a web ma epokę per człowiek i per AI, `main.ts:2419-2422`; (b) jawna stolica = pierwsze miasto z `isCapital`. Obie są jawne w raporcie Operatora §7 (pkt 4 i 6) jako NIE_ZMIERZONO lub założenie. Wymagam tylko, żeby zostały w rejestrze jako dług. Przy (b) Z1 i tak wymaga wektora rozróżniającego obie gałęzie.

**Z5 (uwaga, bez akcji).** `PlayableState` nie ma barbarzyńców ani epok per właściciel. `is_barbarian = false` (`city_view.rs:444`) i błąd `UnknownOwner` zamiast webowego `'grecy'` to jawne odstępstwa udokumentowane w §7 raportu Operatora (pkt 5 i 7). Nie są wymyślonymi regułami. Akceptuję je jako NIE_ZMIERZONO.

## 6. Co jest w porządku

- Producent jest czystym odczytem stanu. Wejścia spoza `PlayableState` są jawne (`CityViewInputs`), a brak danych daje błąd zamiast cichej wartości domyślnej.
- Wektory naprawdę pochodzą z kodu pinu: `--check` odtworzony, harness wykonuje `_buildBadgeInput`, `_cityMapLabel` i `_isCapitalCity` z `render/cities.ts` skompilowane przez `tsc`.
- Pozostałe ścieżki (mur, palisada, bunt, oblężenie, mgła, kolejka, wstrzymanie, pusty koszt, głód, miasta-państwa trzema ścieżkami, hot-seat, epoka brązu) są pokryte, a mutanty Operatora (26/26) i moje E1, E3, E5, E9, E10, E16, E17 je zabijają.

## 7. Metoda

`git show 07d2fbd72:gra/src/{main.ts,render/cities.ts,render/bronzeCity.ts,render/cityMapStatChip.ts,game/civ-visual.ts,game/capital-capture.ts,game/production.ts}`, `git grep applyWiarygodnoscD4ToRelation 07d2fbd72`; kontrakt `origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` §3.4; bramki jak w §1; skrypt mutantów w scratchpadzie sesji (lista mutantów w §4, każdy zastępuje dokładnie jedno wystąpienie).
