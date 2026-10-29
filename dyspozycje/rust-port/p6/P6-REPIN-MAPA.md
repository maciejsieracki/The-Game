# P6-REPIN-MAPA — odświeżenie portu mapgen do pinu weba `91dc998a`

**Temat:** `R-RUSTPORT-REPIN-MAPA-Q1` · **Runda:** 1/5 · **Rola:** Operator-impl · **Baza:** `fb55afe2` (`origin/rust-port/parity-v2`, detached)
**Pin dotychczasowy:** `edb8fb56` · **Pin docelowy:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin w manifestach:** NIE przesunięty (osobny temat po krokach 1–5).

## 1. Zakres zmian webu w `gra/src/map/gen-helpers.ts`

`git diff edb8fb56 91dc998a -- gra/src/map/gen-helpers.ts` = **8 hunków**, wszystkie to zamiana `queue.shift()` na indeks głowy `queue[queueHead++]` (BFS/FIFO). Zmiana **niebehawioralna**: kolejność odwiedzin FIFO jest identyczna, pętle warunkują się na tej samej liczbie elementów, żadne `unshift` ani dodatkowe odczyty `queue.length` nie zmieniają się. Wynik każdej funkcji jest bit w bit ten sam (potwierdzone w §3).

| # | Funkcja (web, pin `edb8fb56`) | Linia hunka `edb8fb56` | Rodzaj zmiany | Zakres portu (Rust) | Status |
|---|---|---|---|---|---|
| H1 | `estimateLandCentroidFromSeed` | 5992 | shift → head index (BFS z `visitCap`) | `rivers_a.rs` (szkielet, zakres web 5121–6068) | NIE-DOTYCZY: brak portu w Rust; zmiana równoważna |
| H2 | `buildOceanReachableRiverHexKeys` | 8466 | shift → head index | `rivers_d.rs` (szkielet, 8338–9558) | NIE-DOTYCZY: brak portu; równoważna |
| H3 | `bfsNearestRiverHexOnLowland` | 10352 | shift → head index | `rivers_e1.rs` (szkielet, 9559–10530) | NIE-DOTYCZY: brak portu; równoważna |
| H4 | `bfsLowlandRiverPath` | 10392 | shift → head index | `rivers_e1.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważna |
| H5 | `maxDryLowlandPatchSize` | 10541 | shift → head index | `rivers_e2.rs` (szkielet, 10531–11928) | NIE-DOTYCZY: brak portu; równoważna |
| H6 | `fillDryLowlandPatches` | 10693 | shift → head index | `rivers_e2.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważna |
| H7 | `findAllOversizedDryLandPatches` | 10776 | shift → head index | `rivers_e2.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważna |
| H8 | `findLargestDryLowlandPatch` | 10804 | shift → head index | `rivers_e2.rs` (szkielet) | NIE-DOTYCZY: brak portu; równoważna |

Wniosek: w `relief.rs`, `terrain_class.rs`, `masks.rs`, `prims.rs` **nie ma kodu** odpowiadającego żadnemu z 8 hunków (cytowania `gen-helpers.ts` w tych plikach: 57–968, 1012–1775, 1774–3268, poza hunkami). Moduły `rivers_*.rs` to puste szkielety M00 (`//! Szkielet P6.M00 (pusty)`), więc zmiana nie ma czego portować. Kod Rust nie został zmieniony w tej rundzie (0 linii w `src/`).

## 2. Zmiany poza `gen-helpers.ts` (ustalone przy regeneracji M16)

Regeneracja M16 z weba `91dc998a` ujawniła **zmianę behawioralną spoza zakresu tego tematu**:

- `gra/src/game/terrain-improvements.ts`: nowa `terrainImprovementConstructionEraMultiplier` (Kamień 0.5×, Brąz 1×, Żelazo 2×, potem ×2) używana w `scaleTerrainImprovementWorkCost`; koszt budowy ulepszeń terenu zmienił się (np. `kosztPraca` 20 → 40 dla `oboz_lowiecki`/`farma`).
- `gra/data/units.json`: „Rydwan (woły)” Epoka/Surowiec/Dostępna w epokach z „Brąz” na „Kamień”/„Drewno”.

Port tych zmian leży w `rust-port/engine/src/domain/improvements.rs` (oraz danych w `recruitment.rs`/kopiach `units.json`) — **poza ALLOWLISTĄ** tematu. Nie zostały ruszone.

## 3. Regeneracja wektorów z URUCHOMIONEGO weba (generatory z runów P6, bez zmian)

Web wyeksportowany przez `git archive <pin> gra/src gra/data` do katalogów w scratchpadzie (poza repo). Generatory uruchomione na obu pinach; stored wektory w repo są na pinie `edb8fb56`.

| Wektor | Stored (repo, pin `edb8fb56`) = gen na `edb8fb56` | gen na `91dc998a` | Rozbieżności (dane) |
|---|---|---|---|
| M04 `p6_m04_vectors/web-vectors.json` | BIT W BIT (`cmp`) | różni się tylko `meta`: `gen-helpers.ts` sha256 (`ab934703…` → `72b51871…`), liczba linii (12562 → 12570) | **0** (cała zawartość `cases`/`counts`/`stats` identyczna) |
| M05A `p6_m05a_vectors/web-vectors.json` | BIT W BIT | tylko `meta/gen_helpers_*` (12561 → 12569 linii; sha jak wyżej) | **0** |
| M05B `p6_m05b_vectors/web-vectors.json` | BIT W BIT | tylko `meta/gen_helpers_*` (12562 → 12570) | **0** |
| M16 `p6_m16_vectors/gallery.json` | BIT W BIT | identyczny | **0** |
| M16 `p6_m16_vectors/qualifier.json` | BIT W BIT | 11551 różnic, wszystkie w polach `kosztPraca`/`work_cost` (np. `work_cost/kamieniolom` 22 → 44) | **11551 (poza zakresem, §2)** |
| M16 `p6_m16_vectors/rules.json` | BIT W BIT | 62 różnice, wszystkie w `kosztPraca` (w tym `era[0..4]`) | **62 (poza zakresem, §2)** |

Sumy kontrolne (sha256, pierwsze 16 znaków): M04 gen-91 `a307d5abdeef16f4`, gen-base `bbaeee3a97ba82e8`; M05A gen-91 `33ab1b92dd7bca24`, gen-base `238ebe04ccff97d8`; M05B gen-91 `d3971843088b70e9`, gen-base `fc6afe31ed7f1051`; M16 qualifier gen-91 `e13c8debccc37f1f`, gen-base `2117c0cb7c09ccaa`; M16 rules gen-91 `2c22735b826e5220`, gen-base `92b4a5b851e3cde6`.

Decyzja dla wektorów w repo: **nie nadpisano** plików `web-vectors.json`/`*.json` (zostają na pinie `edb8fb56`, zgodnie z manifestami). Nadpisanie M16 zerwałoby `p6_m16_*` testy Rust bez portu §2 (a dane wejściowe M16 zależą od `terrain-improvements.ts`).

## 4. Testy portu (Rust, bez zmian kodu)

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --no-fail-fast`: **1265 passed / 0 failed** (baseline 1265/0).
- Logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-MAPA-Q1/` (gate-*-r1.log, `git add -f`).

## 5. Tabela klasyfikacji (krok 5 procedury)

| Zmiana | Plik:linia weba (`91dc998a`) | Plik:linia Rust | Test/wektor | Status |
|---|---|---|---|---|
| H1–H8 (BFS queue, równoważne) | `gen-helpers.ts` hunki 5992–10804 (pin `edb8fb56`) | brak (szkielety `rivers_*.rs`) | M04/M05A/M05B: 0 rozbieżności danych | NIE-DOTYCZY (równoważność FIFO; brak portu) |
| terrain-improvements: `terrainImprovementConstructionEraMultiplier` | `gra/src/game/terrain-improvements.ts:90–99` | `domain/improvements.rs` (NIE w allowliście) | M16 qualifier: 11551 rozbieżności, rules: 40 liści (62 wg rundy 1, metoda liczenia NIE_ZMIERZONO) | NASTĘPNA-PARTIA |
| `units.json` Rydwan (woły) Epoka/Surowiec | `gra/data/units.json:523–576` | `engine/data/units.json` (kopia bajtowa) | M16 rules (część) | NASTĘPNA-PARTIA |

## 5a. Weryfikacja niezależna (runda 2, Operator-pomiary)

Baza: `52fb5b4e` (kod Rust i web bez zmian względem `fb55afe2`: `git diff --stat fb55afe2 HEAD -- rust-port gra src-tauri Cargo.toml WERSJE.md` = pusty).

- **H1–H8**: `git show 91dc998a:gra/src/map/gen-helpers.ts` (eksport do scratchpadu) potwierdza, że 8 hunków to wyłącznie `queue.shift()` → `queue[queueHead++]`; w każdej z 8 funkcji `queue` jest czytana tylko przez warunek pętli i indeks głowy, `push` dopisuje na koniec, brak odczytu `queue.length` poza warunkiem pętli. Równoważność FIFO z kodu (dowód, nie mutacja).
- **Szkielety Rust**: `rivers_a.rs`, `rivers_d.rs`, `rivers_e1.rs`, `rivers_e2.rs` mają po 3 linie (nagłówek „Szkielet P6.M00 (pusty)"), zero kodu. Potwierdzone.
- **Dane wektorów (niezależny skrypt, porównanie liści JSON z pominięciem `meta`, skrypt w scratchpadzie)**:

| Wektor | stored vs gen@edb8fb56 | gen@edb8fb56 vs gen@91dc998a (liście danych) |
|---|---|---|
| M04 web-vectors.json | 0 | 0 danych (3 liście meta: `gen_helpers_lines`, `sha256/gen-helpers.ts`, `+export`) |
| M05A web-vectors.json | 0 | 0 |
| M05B web-vectors.json | 0 | 0 |
| M16 gallery.json | 0 | 0 |
| M16 qualifier.json | 0 | 11551 (`cases[*]/api/requests[*]/req/kosztPraca`) |
| M16 rules.json | 0 | 40 liści (`work_cost_scale[*]/era[*]`) |

- **Sprzeczność w rundzie 1 (korygowana)**: §5 podawał „11613", §3 podaje 11551 — poprawna wartość to 11551 (zmierzona niezależnie). Liczba 62 dla rules (§3) różni się od 40 liści; metoda liczenia nieustalona — NIE_ZMIERZONO, bez wpływu na decyzję (wszystkie różnice w `kosztPraca`/`work_cost`).
- **Bramki (runda 2, surowe logi w `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-MAPA-Q1/`)**: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, suma 1265 passed / 0 failed.
- **Mutacje**: nie wykonano na kodzie Rust (brak portu H1–H8, zmiana niebehawioralna); podstawą jest dowód równoważności z kodu (wyżej).

## 6. Otwarte (ZAŁOŻENIA)

- ZAŁOŻENIE-1: zmiany H1–H8 nie wymagają kodu Rust, dopóki moduły `rivers_*.rs` nie zostaną zaimplementowane (ich właściciele to tematy M07*). Port od razu wtedy musi użyć FIFO (`VecDeque`/indeks głowy) — to jest już zachowane w istniejącym kodzie `relief.rs:1908` (`bfs_expand_exclusion`).
- ZAŁOŻENIE-2: pierwszy krok następnej partii to port §2 (`improvements.rs` + kopia `units.json`) z rozszerzeniem allowlisty; po nim M16 do zregenerowania z `91dc998a` z wynikiem 0 rozbieżności.
- NIE_ZMIERZONO: pełna równoważność wyników funkcji H1–H8 dla przypadków spoza wektorów M04/M05A/M05B (dowód jest z kodu i z identyczności wektorów, nie z testu mutacyjnego).
