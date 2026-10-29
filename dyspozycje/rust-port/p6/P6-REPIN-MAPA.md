# P6-REPIN-MAPA — odświeżenie portu mapgen do pinu weba `91dc998a`

**Temat:** `R-RUSTPORT-REPIN-MAPA-Q1` · **Runda:** 3/5 · **Rola:** Operator-obrona · **Baza kodu:** `a1a5ae80` (runda 2 Operatora; kod Rust i web bez zmian względem `fb55afe2`)
**Pin dotychczasowy:** `edb8fb56` · **Pin docelowy:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin w manifestach:** NIE przesunięty (DELTA §6: jednym ruchem po krokach 1–5).

## 0. Odpowiedzi na zarzuty Evaluatora (runda 2)

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| Z1 | M16 nie ma 0 rozbieżności względem `91dc998a`; port `terrainImprovementConstructionEraMultiplier` nie zrobiony | **PRZYJMUJĘ diagnozę, ODRZUCAM wykonanie w tym temacie.** Przyczyna potwierdzona pomiarem (§2.1): 100% rozbieżności M16 pochodzi z `gra/src/game/terrain-improvements.ts`. Ten plik należy do kroku 4b (`R-RUSTPORT-REPIN-EKONOMIA-Q1`, DELTA §5), a jego port zmienia `scale_terrain_improvement_work_cost`, które używa `improvement_build.rs:883,922` i testu `p6_23_improvements.rs:310` (wektory `p6_23_vectors/improvements.json`, pin `edb8fb56`). Port w 4d wymagałby allowlisty poza tematem i zrywałby `p6_23`. Kryterium literalne nie jest spełnione; ZAŁOŻENIE-3 (§6). | §2.1 (hybryda), §4 |
| Z2 | Nie przeniesiono do Rust niczego z allowlisty | **PRZYJMUJĘ.** Zgodnie z ZAŁOŻENIEM-3 nic nie jest portowane w 4d; to świadoma decyzja zakresu, nie pominięcie. Kod Rust: 0 zmian w `src/`. | §0 Z1, §6 |
| Z3 | 62 vs 40 w §3/§5a (niespójność liczb) | **PRZYJMUJĘ.** Liczba **62 wycofana**. Jedyna zmierzona wartość: **40 liści** `rules.json` (metoda w §3). §3, §5 i §5a poprawione. | §3, skrypt `cmp16-leaf-diff-r3.py` |
| Z4 | Zasięg `units.json` niezmierzony | **PRZYJMUJĘ i ROZSTRZYGAM pomiarem.** (a) `rust-port/engine/data/units.json` ma sha256 `0e031b60af2b…` = `91dc998a:gra/data/units.json` (kopia już odświeżona w kroku 1, DANE). (b) Hybryda §2.1: `units.json` ma wpływ **0** na M16. (c) Konsumenci w Rust (grep): `tests/p6_1b_vectors/web-vectors.json`, `tests/p6_1d_vectors/web-vectors.json`, `tests/p6_7b_vectors/{gate,cost}.json`, `tests/p6_6a_vectors/visibility.json`, `tests/recruitment.rs`, `tests/data_compliance.rs`, `tests/derived_values.rs`, `data/derived/*.json`, `data/tech.json`. Bramki na tym stanie: 1265/0. | §2.2 |
| Z5 | Mutacje pominięte | **ODRZUCAM jako zarzut.** Evaluator uznał dowód równoważności z kodu za wystarczający (8 hunków = wyłącznie `queue.shift()` → `queue[queueHead++]`). Brak portu H1–H8, więc nie ma czego mutować. | §1 |
| Z6 | Logi bramek wskazują sąsiedni worktree (`wf_e1ae1e19-d3b-2`) | **PRZYJMUJĘ.** Bramki r3 uruchomione w tym worktree, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_e1ae1e19-d3b-4`, logi `gate-*-r3.log` (§5). | §5 |

## 1. Zakres zmian webu w `gra/src/map/gen-helpers.ts` (H1–H8, bez zmian względem r1/r2)

`git diff edb8fb56 91dc998a -- gra/src/map/gen-helpers.ts` = **8 hunków**, każdy to `queue.shift()` → `queue[queueHead++]` (BFS/FIFO). Kolejność odwiedzin jest identyczna, warunek pętli jest ten sam, nie ma `unshift` ani nowych odczytów `queue.length`. Równoważność wyniku wynika z kodu.

| # | Funkcja (web, pin `edb8fb56`) | Linia hunka `edb8fb56` | Zakres portu (Rust) | Status |
|---|---|---|---|---|
| H1 | `estimateLandCentroidFromSeed` | 5992 | `rivers_a.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |
| H2 | `buildOceanReachableRiverHexKeys` | 8466 | `rivers_d.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |
| H3 | `bfsNearestRiverHexOnLowland` | 10352 | `rivers_e1.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |
| H4 | `bfsLowlandRiverPath` | 10392 | `rivers_e1.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |
| H5 | `maxDryLowlandPatchSize` | 10541 | `rivers_e2.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |
| H6 | `fillDryLowlandPatches` | 10693 | `rivers_e2.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |
| H7 | `findAllOversizedDryLandPatches` | 10776 | `rivers_e2.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |
| H8 | `findLargestDryLowlandPatch` | 10804 | `rivers_e2.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważne |

`rivers_a/d/e1/e2.rs` mają po 3 linie (nagłówek „Szkielet P6.M00 (pusty)”). Kod Rust w `src/` nie zmieniony w tym temacie.

## 2. Zmiany poza `gen-helpers.ts`: pomiar

### 2.1 Przypisanie wpływu na M16 (hybrydy webu)

Trzy drzewa webu w scratchpadzie (`git archive`, poza repo). Generator `gen-m16-vectors.mjs` (bez zmian) uruchomiony na każdym:

| Drzewo webu | `qualifier.json` vs stored (leafy bez `meta`) | `rules.json` vs stored | `gallery.json` vs stored |
|---|---|---|---|
| `edb8fb56` (baza) | 0 | 0 | 0 |
| `91dc998a` (pełny pin) | 11551 | 40 | 0 |
| hybryda A: `91dc998a` z `terrain-improvements.ts` z `edb8fb56` | **0** | **0** | **0** |
| hybryda B: `91dc998a` z `units.json` z `edb8fb56` | 11551 | 40 | 0 |
| hybryda C: `91dc998a` z `terrain-improvements.ts` i `units.json` z `edb8fb56` | 0 | 0 | 0 |

Wniosek: `gen-helpers.ts` nie wpływa na M16 (hybryda A = 0), a **cały** wpływ na M16 (11551 + 40) przypada na `terrain-improvements.ts` (hybryda B = pełny pin). `units.json` nie wpływa na M16 (hybryda B = pełny pin). Hybrydy A i C dają 0 rozbieżności względem stored wektorów, bo stored są na `edb8fb56`.

### 2.2 `units.json` (Rydwan woły)

- `rust-port/engine/data/units.json`: sha256 `0e031b60af2b…` = `git show 91dc998a:gra/data/units.json` (`0e031b60af2b…`). Kopia jest już na pinie docelowym (krok 1, DANE). Nie ma czego portować.
- Zmiana Rydwanu w `gra/data/units.json:523–576` jest więc już w danych Rust. Jej wpływ na wektory i testy zależy od kroku 1 i wykazuje się bramkami (1265/0 na tym stanie).

### 2.3 `terrain-improvements.ts` (krok 4b, NIE w tym temacie)

- Web `91dc998a`: `gra/src/game/terrain-improvements.ts:91` (`terrainImprovementConstructionEraMultiplier`: Kamień 0.5×, Brąz 1×, Żelazo 2×, potem ×2), `:108` (`scaleTerrainImprovementWorkCost` używa nowego mnożnika).
- Rust (nietknięte): `rust-port/engine/src/domain/improvements.rs:756` (`terrain_improvement_era_multiplier`, mnożniki 1/2/4 = upkeep), `:802–808` (`scale_terrain_improvement_work_cost`, używa starego mnożnika).
- Konsumenci: `src/domain/improvement_build.rs:883,922`; testy `tests/p6_23_improvements.rs:303–310` (wektory `tests/p6_23_vectors/improvements.json`, pin `edb8fb56`); `tests/p6_m16_rules.rs:443–451`.
- Wniosek: port zmiany zmienia wynik `scale_terrain_improvement_work_cost`, a więc wymaga równoczesnej regeneracji `p6_23_vectors` i zmian w `improvement_build.rs`. Poza allowlistą 4d. Właściwy temat: krok 4b.

## 3. Regeneracja wektorów z URUCHOMIONEGO weba `91dc998a`

Metoda: `node --experimental-transform-types` z generatorami z runów P6 (`gen-m04-vectors.mjs`, `gen-m05a-vectors.mjs`, `gen-m05b-vectors.mjs`, `gen-m16-vectors.mjs`), bez zmian w generatorach. Porównanie: `cmp16-leaf-diff-r3.py` (liście JSON, pominięty top-level `meta`).

| Wektor | Stored (repo, `edb8fb56`) vs gen@`edb8fb56` | gen@`91dc998a` vs stored (leafy danych) | Uwagi |
|---|---|---|---|
| M04 `p6_m04_vectors/web-vectors.json` | BIT W BIT | **0** danych; 3 leafy `meta` (`gen_helpers_lines` 12562→12570, `sha256/gen-helpers.ts`, `+export`) | rozmiar 9836273 B (≤10 MB) |
| M05A `p6_m05a_vectors/web-vectors.json` | BIT W BIT | **0** danych; `meta` gen_helpers (12561→12569) | rozmiar 7255936 B |
| M05B `p6_m05b_vectors/web-vectors.json` | BIT W BIT | **0** danych; `meta` gen_helpers (12562→12570) | rozmiar 8404955 B |
| M16 `p6_m16_vectors/gallery.json` | BIT W BIT | **0** | |
| M16 `p6_m16_vectors/qualifier.json` | BIT W BIT | **11551** (`cases[*]/api/requests[*]/req/kosztPraca`, np. 60→120) | wyłącznie `terrain-improvements.ts` (§2.1) |
| M16 `p6_m16_vectors/rules.json` | BIT W BIT | **40** (`work_cost_scale[*]/era[*]`, np. 1→2) | wyłącznie `terrain-improvements.ts` (§2.1). Liczba 62 z r1 wycofana (Z3). |

Regenerowane wersje z `91dc998a` (M04/M05A/M05B) mają identyczne dane jak repo; nie zapisano ich do `tests/`, bo: (a) `p6_m05a_tables.rs:619–623` asercjonuje `pin_web == "edb8fb56"` i `gen_helpers_lines == 12561`, więc podmiana przesunęłaby pin wektorów przed jednorazowym ruchem pinu (DELTA §6); (b) różnica jest wyłącznie w `meta`. (ZAŁOŻENIE-4.)

## 4. Dlaczego M16 nie może mieć 0 rozbieżności względem `91dc998a` w tym temacie

- Literalne kryterium (0 rozbieżności M16 względem `91dc998a`) wymaga portu `terrain-improvements.ts` (krok 4b) i zmiany `p6_23` (poza 4d).
- Po portowaniu 4b wektory M16 trzeba regenerować z `91dc998a` i wtedy 0 rozbieżności jest osiągalne; w 4d osiągalne jest 0 rozbieżności dla hybrydy A (§2.1).

## 5. Bramki (runda 3, surowe logi w `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-MAPA-Q1/`)

Wszystkie w `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_e1ae1e19-d3b-4 CARGO_PROFILE_DEV_DEBUG=0`, bez `--locked`.

- `cargo fmt --all -- --check`: `gate-fmt-r3.log`, EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: `gate-clippy-r3.log`, EXIT=0.
- `cargo test --no-fail-fast --no-run`: `gate-test-build-r3.log`, EXIT=0 (pierwsza próba padła na `No space left on device`; po usunięciu własnych plików scratch build przeszedł).
- `cargo test --no-fail-fast`: `gate-test-r3.log`, EXIT=0, suma **1265 passed / 0 failed** (baseline 1265/0).
- `git diff --check`: wykonany przed commitem.

## 6. Klasyfikacja (krok 5 procedury)

| Zmiana | Plik:linia weba (`91dc998a`) | Plik:linia Rust | Test/wektor | Status |
|---|---|---|---|---|
| H1–H8 (BFS queue, równoważne) | `gra/src/map/gen-helpers.ts` (hunki 5992–10804 w `edb8fb56`) | brak (szkielety `rivers_*.rs`) | M04/M05A/M05B: 0 rozbieżności danych; M16 hybryda A: 0 | NIE-DOTYCZY (równoważność FIFO z kodu; brak portu) |
| `terrainImprovementConstructionEraMultiplier` + `scaleTerrainImprovementWorkCost` | `gra/src/game/terrain-improvements.ts:91,108` | `domain/improvements.rs:802–808` (nietknięte) | M16 qualifier 11551, rules 40 (§2.1); `p6_23_vectors` | NASTĘPNA-PARTIA: krok 4b (`R-RUSTPORT-REPIN-EKONOMIA-Q1`) |
| `units.json` Rydwan (woły) | `gra/data/units.json:523–576` | `rust-port/engine/data/units.json` (sha = 91dc) | brak wpływu na M16 (hybryda B); konsumenci §Z4 | ZROBIONE w kroku 1 (DANE) |

## 7. Otwarte (ZAŁOŻENIA)

- **ZAŁOŻENIE-1:** H1–H8 nie wymagają kodu Rust, dopóki `rivers_*.rs` nie zostaną zaimplementowane (tematy M07*). Port wtedy musi zachować FIFO (`VecDeque` lub indeks głowy), jak `relief.rs:1908` (`bfs_expand_exclusion`).
- **ZAŁOŻENIE-2 (zastąpione przez ZAŁOŻENIE-3):** runda 2 zakładała rozszerzenie allowlisty na `improvements.rs`. Odrzucone: port zmienia `p6_23` i `improvement_build.rs`, a to należy do kroku 4b.
- **ZAŁOŻENIE-3 (kryterium):** literalne „M16 0 rozbieżności względem `91dc998a`” jest niespełnialne w 4d. Proponowane kryterium zawężone: (i) `gen-helpers.ts` z `91dc998a` nie zmienia M16: hybryda A (`91dc998a` z `terrain-improvements.ts` z `edb8fb56`) daje 0 rozbieżności względem stored wektorów (§2.1); (ii) pełny pin `91dc998a` różni się od stored wyłącznie w 11551 + 40 leafach, przypisanych w całości do `terrain-improvements.ts` (krok 4b): hybryda A (bez zmiany tego pliku) daje 0, a hybryda B (bez zmiany `units.json`) daje pełny pin. Decyzja: Evaluator/orkiestrator.
- **ZAŁOŻENIE-4 (wektory w repo):** M04/M05A/M05B i M16 w `tests/` zostają na `edb8fb56` do jednorazowego ruchu pinu (DELTA §6). Regenerowane z `91dc998a` wersje mają 0 rozbieżności danych (M04/M05), poza `meta`.
- **NIE_ZMIERZONO:** pełna równoważność H1–H8 dla przypadków poza wektorami M04/M05A/M05B (dowód z kodu, bez testu mutacyjnego).
- **NIE_ZMIERZONO:** wpływ `units.json` na wektory `p6_1b`, `p6_1d`, `p6_7b`, `p6_6a` i `derived/*.json` (zmierzone tylko: wskazanie konsumentów; bramki 1265/0 na tym stanie). Właściciel: krok 1 (DANE).
