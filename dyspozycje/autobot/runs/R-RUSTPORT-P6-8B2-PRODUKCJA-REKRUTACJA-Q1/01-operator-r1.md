STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B2-PRODUKCJA-REKRUTACJA-Q1
GOAL: 8B-P2 (28 symboli, production.ts 2004-2541 @91dc998a): port do Rust, wektory z uruchomionego weba, testy progow NaN/N-1/N/N+1/brakujacych kluczy. Baza: origin/rust-port/parity-v2 @ efc0ee829 (B3 i recruitment.rs zamkniete: ostatnia zmiana recruitment.rs = 71d6af2cb).
ZMIANY/COMMIT:
- Kod: `rust-port/engine/src/domain/production_units.rs` (nowa sekcja P6.8B2-P2, +679 linii; podzial <600 LOC, wiec bez `production_queue.rs`).
- Testy: `rust-port/engine/tests/p6_8b2_p2_vectors.rs` (NOWE, 14 testow); wektory `rust-port/engine/tests/p6_8b2_vectors/p2-{recruit,praca,output,unit-cost,catalog}.json` (lacznie ok. 1,3 MB); generator `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B2-PRODUKCJA-REKRUTACJA-Q1/gen-p6-8b2-vectors.mjs`.
- Dokument: `dyspozycje/rust-port/p6/P6-8B-PRODUKCJA-DOSTEPNOSC.md` (wiersz 8B-P2 -> ZROBIONE, z zastrzezeniem o mutacjach).
- Commit kodu: `cae511811` (branch `rust-port-p6-8b2`, lokalnie, NIE pushowany). Raport i dowody: commit w tym samym branchu (SHA podany w odpowiedzi orkiestratorowi).
- Nie zmieniano: `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`, `recruitment.rs`, `mod.rs`.

MAPA SYMBOLI (web -> Rust, production_units.rs): enqueueRecruitment/dequeueRecruitment -> enqueue_recruitment/dequeue_recruitment; advanceRecruitment -> advance_recruitment; advanceRecruitmentGated -> advance_recruitment_gated (manpower z recruitment::manpower); rushCost/rushProduction/dropFrontItem -> rush_cost/rush_production/drop_front_item; cityPracaInteger/splitPraca/pracaImperialPoolGain/previewPracaPoolBrutto -> city_praca_integer/split_praca/praca_imperial_pool_gain/preview_praca_pool_brutto; unitCostMode/unitPurchaseCost -> unit_cost_mode/unit_purchase_cost; buildableProduction/purchasableUnits -> buildable_production/purchasable_units; EPOCH_NUMBER_TO_NAME -> EPOCH_NUMBER_TO_NAME; eraBuildingCatalog -> era_building_catalog; splitOutput/cityScienceOutput/cityMoneyOutput -> split_output/city_science_output/city_money_output; DEFAULT_OUTPUT_SHARES -> default_output_shares.

TESTY (wszystkie EXIT=0; logi w `dowody/`):
- `cargo fmt --all -- --check`: EXIT=0 (po `cargo fmt --all`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --test p6_8b2_p2_vectors`: 14/14 (9 wektorowych: enqueue/dequeue 44, advance 444, rush 36, praca 232, output 360, koszt jednostki 158, katalog 450 kontekstow z realnym buildings.json; 5 progowych).
- `cargo test --no-fail-fast`: passed=1694, failed=0 (baseline 1680/0 + 14 nowych).
- `git diff --check`: czysto.
- Wektory: wygenerowane z PRAWDZIWEGO production.ts @91dc998a przez loader z runu 8B (bez stubow).

BLOKADY / NIE_ZMIERZONO:
1. Mutacje: NIE wykonane w tej rundzie (dispatch: BEZ dlugich pomiarow dla Operatora-impl). Warunek "mutacje lub dowod rownowaznosci" NIE jest spelniony; do zrobienia przez Obrone/Evaluatora.
2. Sortowanie `eraBuildingCatalog`: `polish_locale_compare` to przyblizenie ICU 'pl' (polskie litery po bazie, `ch` po `h`). Zgodne z 450 kontekstami webu; ogolny ICU poza nazwami budynkow NIE_ZMIERZONO.
3. `cityPracaInteger` nalezy wg dispatchu do R-RUSTPORT-REPIN-EKONOMIA-D2-Q1 i NIE mialo byc portowane. W parity-v2 go nie ma (grep: brak), wiec port byl konieczny jako zaleznosc `splitPraca`. Ryzyko: duplikat przy D2 - D2 powinien zreusowac `city_praca_integer` z production_units.rs.
4. `buildableProduction`/`purchasableUnits`: tylko filtry na `available_production` + test pustego wejscia; bez wektorow.
5. `unitPurchaseCost`: wektory bez civBonusy i tempa (markery puste, pace None); sciezka markerow nie pokryta w P2.
6. `wielokrotny` nie wystepuje w `buildings.json` pinu: w Rust `None` (web `!undefined` = true).
7. `advanceRecruitment` z NaN: web `slice(0,NaN)` = pusty, Rust = 0 zdjetych (pokryte testem).

ZALOZENIA (ZALOZENIE, do weryfikacji):
- `advanceRecruitment(prod, maxPerTurn: f64)`; brak argumentu = RECRUIT_UNITS_PER_TURN (1).
- `advanceRecruitmentGated`: `city` = (population, manpower Option); `costMult` domyslnie = `maxMult` (jak w c2a).
- `splitPraca` z udzialem nieskonczonym = 1 (web `Number.isFinite`), brak argumentu = NaN w tescie.
- Sortowanie katalogu: stabilne (`sort_by`), identyczne z web przy spojnym komparatorze; koszt NaN nie jest kluczem sortowania, wiec emulacja V8 nie jest potrzebna.

RUNDY: 1/5 (licznik tematu; raport operatora tej rundy).
NASTEPNY KROK: Obrona/Operator-mutacje (M1-Mn na galeziach P2, `dowody/`), potem Evaluator (Sonnet 5.5) i Final Control; zalecana weryfikacja z pkt 3 (D2) i pkt 2 (ICU pl) przez Evaluatora.
DEPLOY/PUSH: NIE WYKONANO
