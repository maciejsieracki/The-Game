# P6-M07B — rzeki część B (trace) — dossier

Temat: R-RUSTPORT-P6-M07B-RZEKI-B-TRACE-Q1. Pin web: `edb8fb56`, źródło `gra/src/map/gen-helpers.ts` (zakres 6069–7249).
Baza Rust: `rust-port/parity-v2` @ `2f35f68bc` (M07A zamknięte w `rivers_a/`).

## Stan na koniec rundy 2/5

- **Partia 1 (`rivers_b/turn.rs`, web :7051–7086): PORTOWANA i zweryfikowana** — wektory z uruchomionego weba,
  generator w repo, weryfikator Python od zera, 49 mutantów (44 KILLED, 5 SURVIVED = wszystkie równoważne, dowody niżej).
- **Partie 2–4 (30 symboli, status NIE): NIE wykonane w tym temacie.** Zamknięcie administracyjne tematu Q1
  na partii 1 (dozwolone przez dispatch, „nie przekraczaj 5 rund"). Reszta przechodzi do nowych ID (sekcja „Podział zakresu").

## Tabela statusu per symbol (44 wiersze; pin `edb8fb56`)

Status: PORTOWANE (kod + wektory web + weryfikator + mutanty), REUSE (już w `rivers_a`, bez zmiany kodu),
NIE (poza tym tematem; przypisany nowy temat). Linie = pin `edb8fb56`.

| # | Symbol | Linia web | Status | Rust / nowy temat |
|---|---|---|---|---|
| 1 | riverGrowStepPassesSep | 6070 | REUSE | `rivers_a/grow.rs:222` `river_grow_step_passes_sep` |
| 2 | CoastInlandGrowOpts (typ) | 6081 | NIE | Q2 |
| 3 | collectCoastInlandGrowCandidates | 6098 | NIE | Q2 |
| 4 | InlandDrainGrowOpts (typ) | 6129 | REUSE | parametry `rivers_a/grow.rs` (bez osobnego typu) |
| 5 | collectInlandDrainGrowCandidates | 6148 | REUSE | `rivers_a/grow.rs:306` `collect_inland_drain_grow_candidates` |
| 6 | growRiverFromCoastInland | 6181 | NIE | Q2 |
| 7 | traceRiverFromCoast | 6233 | NIE | Q3 |
| 8 | greedyRiverDrainToSea | 6276 | NIE | Q3 |
| 9 | RiverAStarOpenHeap (klasa) | 6341 | NIE | Q3 |
| 10 | aStarRiverToSea | 6387 | NIE | Q3 |
| 11 | findRiverMeanderStep | 6485 | NIE | Q2 |
| 12 | injectRiverMeanders | 6526 | NIE | Q3 |
| 13 | extendRiverToMinimumLength | 6569 | NIE | Q3 |
| 14 | extendRiverToWybrzeze | 6602 | NIE | Q3 |
| 15 | finishRiverMouthAtSea | 6647 | NIE | Q3 |
| 16 | traceRiver (export) | 6707 | NIE | Q4 |
| 17 | traceRiverForGridFill | 6821 | NIE | Q4 |
| 18 | isRiverLandTerrain | 6854 | REUSE | `rivers_a.rs:120` `is_river_land_terrain` (pub(crate)) |
| 19 | collectFoothillRiverSources | 6866 | NIE | Q4 |
| 20 | collectPlainSpringSources | 6899 | NIE | Q4 |
| 21 | collectRiverSources | 6925 | NIE | Q4 |
| 22 | capRiverQuotas | 6942 | NIE | Q4 (cap: N-1/N/N+1 na mapach) |
| 23 | pickSpreadRiverSources | 6959 | NIE | Q4 |
| 24 | neighborDirIndex | 6988 | REUSE | `rivers_a/grow.rs:40` `neighbor_dir_index` |
| 25 | RIVER_TURN_WINDOW_HEX | 6999 | REUSE | `rivers_a/grow.rs:24` |
| 26 | RIVER_TURN_WINDOW_MAX_SUM | 7000 | REUSE | `rivers_a/grow.rs:26` |
| 27 | signedRiverDirDelta | 7003 | REUSE | `rivers_a/grow.rs:52` `signed_river_dir_delta` |
| 28 | pathSegmentDirs | 7008 | REUSE | `rivers_a/grow.rs:62` `path_segment_dirs` |
| 29 | pathSignedTurnDeltas | 7017 | REUSE | `rivers_a/grow.rs:74` `path_signed_turn_deltas` |
| 30 | isRiverWindowTurnAllowed | 7026 | REUSE | `rivers_a/grow.rs:83` `is_river_window_turn_allowed` |
| 31 | riverSegmentUnitVector | 7051 | PORTOWANE (P1) | `rivers_b/turn.rs:18` `river_segment_unit_vector` |
| 32 | riverPathHasSharpUTurn | 7064 | PORTOWANE (P1) | `rivers_b/turn.rs:37` `river_path_has_sharp_u_turn` |
| 33 | riverPathViolatesTurnWindow | 7075 | PORTOWANE (P1) | `rivers_b/turn.rs:53` `river_path_violates_turn_window` |
| 34 | sanitizeRiverTurnWindow | 7094 | NIE | Q2 (używa `rivers_a.rs:260` sanitize_river_path, `:317` repair_river_path_adjacency) |
| 35 | canReceiveRiverYieldMark | 7122 | NIE | Q2 |
| 36 | markRiverEdge | 7127 | NIE | Q2 |
| 37 | markRiverEdgePair | 7137 | NIE | Q2 |
| 38 | riverHexCornerStep | 7146 | NIE | Q2 |
| 39 | walkRiverHexPerimeter | 7150 | NIE | Q2 |
| 40 | riverCornersAlongHexEdges | 7166 | NIE | Q2 |
| 41 | riverEdgeBetweenCorners | 7195 | NIE | Q2 |
| 42 | riverTransitEdgeIndices | 7202 | NIE | Q2 |
| 43 | simplifyRiverRenderPath | 7214 | NIE | Q2 |
| 44 | markRiverTransitEdgesOnPath | 7232 | NIE | Q2 |

Podsumowanie: 44 wiersze; PORTOWANE 3 (wiersze 31–33); REUSE 11 (1, 4, 5, 18, 24–30); NIE 30 = Q2 15 (2, 3, 6, 11, 34–44) + Q3 8 (7–10, 12–15) + Q4 7 (16, 17, 19–23).

## Podział zakresu (administracyjne zamknięcie, runda 2)

- Q1 (ten temat): zamknięty na partii 1. Wynik: PASS-WITH-NOTES dla partii 1; temat jako całość NIE spełnia kryteriów końca.
- Q2: partia 2 — wiersze 2, 3, 6, 11, 34–44 (sanityzacja okna, markery krawędzi/tranzytu, perymetr, rogi, simplify, meander, collect/grow z wybrzeża). Wymaga wektorów z nakładkami (las/rzeka/złoże) na heksach wodnych i lądowych (lekcja a) oraz mutantów na każdej gałęzi.
- Q3: partia 3 — wiersze 7–10, 12–15 (trace z wybrzeża, drenaż greedy, A* z kolejką heap, meander, minimalna długość, wybrzeże, ujście).
- Q4: partia 4 — wiersze 16, 17, 19–23 (traceRiver 105 LOC, źródła, cap N-1/N/N+1 na mapach, pickSpread).
Decyzja o utworzeniu Q2–Q4 należy do orkiestratora (dispatch: „zamknięcie administracyjne części i nowe ID na resztę").

## Partia 1: `rivers_b/turn.rs` — kod i wektory

- Kod: `rust-port/engine/src/domain/mapgen/rivers_b/turn.rs` (78 LOC), rejestracja w `rivers_b.rs`. Brak zmian w `rivers_a/**` (reuse bez zmiany widoczności: `path_segment_dirs`, `path_signed_turn_deltas` są już `pub`).
- Generator (w repo): `rust-port/engine/tests/p6_m07b_vectors/gen_turn_vectors.mjs`. Wyciąga DOSŁOWNIE z pinu (po nazwie, do `}` na poziomie zerowym)
  `HEX_DIRECTIONS`, `riverHexDirDelta`, `neighborDirIndex`, `RIVER_TURN_WINDOW_*`, `signedRiverDirDelta`, `pathSegmentDirs`, `pathSignedTurnDeltas`,
  `riverSegmentUnitVector`, `riverPathHasSharpUTurn`, `riverPathViolatesTurnWindow`; uruchamia je pod `node --experimental-strip-types` (Node v22.22.0).
  Ziarno `0x5eed2026`, domena |q|,|r| ≤ 29. Wyjście = wynik funkcji weba.
  Odtworzenie: `git archive edb8fb56 gra/src | tar -x -C <mktemp -d>` (poza repo), potem
  `node --experimental-strip-types rust-port/engine/tests/p6_m07b_vectors/gen_turn_vectors.mjs <DIR>/gra/src/map/gen-helpers.ts <wyjście.json>`.
- Wektory: `rust-port/engine/tests/p6_m07b_vectors/web-rivers-b-turn.json` (format `p6-m07b-turn-v2`, 3,99 MB ≤ 6 MB, 36200 przypadków:
  unit 1200, uturn 7000 (3330 true), viol 28000 (16780 true; 5600 z domyślnymi parametrami)).
  Pokrycie: punkty tego samego heksa, sąsiedzi, skoki niesąsiednie (tryb `jump`), proste, zygzaki, skręty jednakowego znaku, losowe chody;
  długości 0–18; okno 1–9, maxSum 0–4 z N-1/N/N+1 względem maksimum |sumy okna| tej samej trasy.
- Testy: `rust-port/engine/tests/p6_m07b_turn.rs` (2 testy: zgodność wszystkich wektorów; obie gałęzie wyników).
- Weryfikator niezależny od zera (Python, bez Rusta): `rust-port/engine/tests/p6_m07b_vectors/verify_m07b_turn.py`
  — 36200/36200 zgodne, `max_unit_err` 2,2e-16, statystyki zgodne (`verify-m07b-turn-r2.txt`).
- ZAŁOŻENIE (hypot): Rust `f64::hypot` vs web `Math.hypot`; wektory `x,y` porównywane z tolerancją 1e-12; wyniki logiczne dokładne.
- Lekcja (a) nakładki: N/A dla partii 1 — funkcje operują wyłącznie na geometrii ścieżki (brak argumentu `hexes`/terenu w :7051–7086).
- Lekcja (b) cap N-1/N/N+1: dotyczy `maxSum` okna (parametr) — pokryte; cap na mapach (`capRiverQuotas`) należy do partii 4 (Q4).
- Lekcja (h) sortowania: N/A (partia 1 nie ma komparatorów).
- Lekcja (g): pliki bez pustych linii na końcu (`git diff --check`, patrz sekcja Bramki).

## Mutanty (`mutate_m07b_turn.py`, log: `mutate-m07b-turn-r2.txt`)

Każda mutacja = jedna podmiana tekstu (liczba wystąpień musi wynosić 1), `cargo test --test p6_m07b_turn`, przywrócenie pliku, RESTORED=True.
Wynik r2: **49 mutantów: 44 KILLED, 5 SURVIVED (M1, M3, M5, M33, M37 — wszystkie równoważne, dowody niżej).**

| Gałąź / konstrukcja (turn.rs, chyba że wskazano) | Mutanty |
|---|---|
| :19 `3f64.sqrt()` | M31 |
| :20 x1 (`sqrt3`, `a.q`, `a.r/2`) | M11, M19 |
| :21 y1 (`1.5 * a.r`) | M12 |
| :22 x2 (`sqrt3`, `b.r/2`) | M21, M38 |
| :23 y2 (`1.5 * b.r`) | M18, M32 |
| :24 dx, :25 dy | M22, M17 |
| :26 `len = hypot` | M23 |
| :27 `if len < 1e-9` | M6, M33 (EQ) |
| :28 `return {0,0}` | M29 |
| :31 x=dx/len, :32 y=dy/len | M24, M34 |
| :38–39 guard has_sharp `len<3` | M3 (EQ), M26, M39 |
| :41 pętla `0..len-2` | M20 |
| :42–43 v1, v2 (argumenty) | M40, M41 |
| :44 predykat `< -0.01` | M1 (EQ), M2, M15, M30 |
| :45 `return true` | M42 |
| :46 końcowe `false` (has_sharp) | M43 |
| :58–59 guard violates `len<3` | M5 (EQ), M25, M44 |
| :61–62 wczesny return sharp | M4, M45 |
| :64 `deltas(path_segment_dirs(path))` | M35 |
| :65 pętla `0..deltas.len()` | M27 |
| :66–67 `if |d|>1` | M7, M13 |
| :69–70 `if i+1<w { continue }` | M8, M28 |
| :72 wycinek okna | M10, M16 |
| :73–74 `if |suma|>maxSum` | M9, M14 |
| :76 końcowe `false` (violates) | M46 |
| grow.rs:40–49 `neighbor_dir_index` (`&&`) | M47 |
| grow.rs:62–71 `path_segment_dirs` (`d>=0`) | M36 |
| grow.rs:52–59 `signed_river_dir_delta` (`raw<=3`, `raw-6`) | M37 (EQ), M48 |
| grow.rs:74–79 `path_signed_turn_deltas` (`windows(2)`) | M49 |

### Dowody równoważności (EQUIV)

- **M3** (`has_sharp`: `len<3` → `len<2`), turn.rs:38: dla len=2 pętla `0..len-2 = 0..0` jest pusta → `false`, jak w oryginale. Dla len<2 wynik `false` w obu wersjach.
- **M5** (`violates`: `len<3` → `len<2`), turn.rs:58: dla len=2 wywołanie `has_sharp` daje `false` (jak wyżej); `path_segment_dirs` (grow.rs:64 `windows(2)` na 2 punktach) daje ≤1 kierunek, a `path_signed_turn_deltas` (grow.rs:76 `windows(2)`) z ≤1 elementu daje pusty wektor → pętla turn.rs:65 nie wykonuje się → `false`. Oryginał: `false` od razu. Równe.
- **M33** (`if len < 1e-9` → `1e-3`), turn.rs:27: wejścia są punktami kratowymi (i64). Dla niezerowego przesunięcia (Δq,Δr): gdy Δr≠0 to |dy| = 1.5|Δr| ≥ 1.5; gdy Δr=0, Δq≠0 to |dx| = √3|Δq| ≥ √3. Zatem `len ∈ {0} ∪ [1.5, ∞)` i oba progi dają ten sam wynik.
- **M37** (`signedRiverDirDelta`: `raw<=3` → `raw<3`, grow.rs:54): raw=3 daje +3 zamiast −3 (oba |·|=3). W `violates` każda wartość |d|=3 zwraca `true` w pętli turn.rs:65–67 **przed** użyciem w jakiejkolwiek sumie okna (sumy liczone są tylko z indeksów już sprawdzonych jako |d|≤1), a `has_sharp` nie używa delt. Znak ±3 nie wpływa na wynik turn.rs. (Mutant mógłby być zabity testami M07A w `rivers_a`, poza zakresem tego tematu.)
- **M1** (`< -0.01` → `<= -0.01`), turn.rs:44. Mutant zmienia wynik tylko, gdy obliczony iloczyn skalarny (f64) jest równy dokładnie `-0.01`.
  1. *Arytmetyka dokładna — dowód:* segment `a→b` ma postać `z = √3·e`, gdzie `e = Δq + Δr·ω'`, `ω' = e^{iπ/3}` (Eisenstein); skala √3 się skraca. Dla e1, e2 ≠ 0 niech `M = N1·N2` (N = |e|²∈ℤ), `e1·ē2 = a/2 + i·n√3/2` (a, n ∈ ℤ), więc `a²/4 + 3n²/4 = M`.
     Równość `cos = −1/100` oznacza `a/2 = −√M/100`, czyli `√M = −50a`, stąd `3n² = 9999a²`, czyli `n² = 3333a²`. 3333 = 3·11·101 nie jest kwadratem, więc `a = n = 0` — sprzeczność z e1,e2 ≠ 0 (wtedy iloczyn = 0 wg guard). Zatem cos ≠ −0.01 dokładnie.
  2. *Margines f64:* z identyczności `(s+100p)(s−100p) = M − 2500a² =: K ∈ ℤ`, `K ≠ 0` (jak wyżej), mamy `|cos+0.01| ≥ 1/(10100·M)`. Dla |q|,|r| ≤ R=29 każdy wektor różnicy ma składowe ≤ 2R, więc `N ≤ 12R²` i `M ≤ 144R⁴ ≈ 1,02·10⁸`, czyli `|cos+0.01| ≥ 9,7·10⁻¹³`.
     Błąd obliczenia f64 (x=√3·(q+r/2) z błędem względnym ~10⁻¹⁶ przy |x| ≤ 75; dx, len, składowe jednostkowe): ≤ ~2·10⁻¹³ w iloczynie skalarnym. Margines ~5× — equality f64 nie zachodzi.
  3. *Zakres:* dowód obejmuje |q|,|r| ≤ 29 (domena generatora). Dla większych współrzędnych ekwiwalencja jest **ZAŁOŻENIEM** (rozmiary map gry NIE_ZMIERZONO w tym temacie). Kod portu zachowuje `<` z webu — mutant jest tylko testem adekwatności.

Zauważone błędy poprzedniej rundy (korekta): w r1 dossier podawał M1 jako równoważny tylko dla kroków sąsiednich — poprawiono do dowodu powyżej.

## Ustalenia rundy 2 (odpowiedź na zarzuty)

| # | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Zakres 3/44 | PRZYJMUJĘ (zakres niedomknięty) — zamknięcie administracyjne Q1 na partii 1, partie 2–4 → Q2–Q4 | sekcja „Podział zakresu" |
| 2 | Wektory tylko w scratchpadzie | PRZYJMUJĘ — generator w repo; wektory odtwarzalne (ziarno, domena, pin) | `gen_turn_vectors.mjs`, `web-rivers-b-turn.json` (36200) |
| 3 | Brak skryptu mutacji / lista niezmutowanych | PRZYJMUJĘ — `mutate_m07b_turn.py` (49 mutantów z treścią podmian); tabela konstrukcji z plik:linia | `mutate_m07b_turn.py`, `mutate-m07b-turn-r2.txt`, sekcja mutantów |
| 4 | Równoważność M1 tylko założeniem | PRZYJMUJĘ częściowo — dowód arytmetyczny (Eisenstein) + margines f64 dla |q|,|r| ≤ 29; poza domeną ZAŁOŻENIE | sekcja M1 |
| 5 | Brak artefaktów runu / 00-dispatch / raport etapu | PRZYJMUJĘ — dodano `00-dispatch.md` (kopia z gałęzi dispatch) i `01-operator-r2.md` w formacie kontraktu | katalog runu |
| 6 | Provenance logów (worktree -1, usunięty test) | PRZYJMUJĘ — stare logi usunięte (historia w 296287607); nowe `gate-*-r2.txt` i `verify-*-r2.txt` powstały w tym worktree z linią `EXIT=` | katalog runu |
| 7 | Brak weryfikatora dla całego zakresu / nakładki i cap | PRZYJMUJĘ dla całości (Q2–Q4); dla partii 1 N/A z uzasadnieniem (lekcja a, cap przypisany do Q4) | sekcja „Partia 1" |
| 8 | Niespójność mutantów r1/pom | PRZYJMUJĘ — jedna tabela, jeden log, jedna liczba (49) | sekcja mutantów |

## Bramki (ten worktree, commit tej rundy: SHA w raporcie Operatora)

- `cargo fmt --check`: EXIT=0 (`gate-fmt-r2.txt`). Po zmianie formatowania wyłącznie pliku `tests/p6_m07b_turn.rs`.
- `cargo clippy --lib --tests`: 0 ostrzeżeń, EXIT=0 (`gate-clippy-r2.txt`).
- `cargo test --test p6_m07b_turn`: 2/2 OK.
- `cargo test` (pełny silnik): 1887 passed, 0 failed, EXIT=0 (`gate-test-full-r2.txt`).
- Weryfikator Python: 36200/36200, EXIT=0 (`verify-m07b-turn-r2.txt`).
- Mutanty: 44 KILLED, 5 SURVIVED (równoważne), RESTORED=True we wszystkich (`mutate-m07b-turn-r2.txt`).
- `git diff --check`: sprawdzane przed commitem.
- `Cargo.lock` w `rust-port/engine/` jest niesledzony i NIE jest częścią commita.
- Target Cargo: `/dev/shm/m07b-r2-target` (usunięty po etapie).

---

## Sekcja Q2 — temat R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1 (runda 1/5, Operator)

Pin `edb8fb56`, źródło `gra/src/map/gen-helpers.ts`. Baza: `origin/rust-port/parity-v2` (silnik 1927/0 przed tematem).
Zakres dispatchu: wiersze 2, 3, 6, 11, 34–44 (15 symboli). Kod: `rust-port/engine/src/domain/mapgen/rivers_b/`.

### Tabela statusu per symbol (Q2)

Status: PORTOWANE-Q2 = kod Rust + wektory z weba + test zgodności (`tests/p6_m07b2_*`). Mutanty i weryfikator Python: **NIE WYKONANE w tej rundzie** (patrz „Luki").

| # | Symbol | Linia web | Status Q2 | Rust (plik:symbol) | Wektory (`fn`) |
|---|---|---|---|---|---|
| 2 | CoastInlandGrowOpts (typ) | 6081 | PORTOWANE-Q2 (struct, bez wektorów: typ) | `rivers_b/coast_grow.rs` `CoastInlandGrowOpts` | przez `collect`/`grow` |
| 3 | collectCoastInlandGrowCandidates | 6098 | PORTOWANE-Q2 | `rivers_b/coast_grow.rs` `collect_coast_inland_grow_candidates` | `collect` (3000) |
| 6 | growRiverFromCoastInland | 6181 | PORTOWANE-Q2 | `rivers_b/coast_grow.rs` `grow_river_from_coast_inland` | `grow` (1500) |
| 11 | findRiverMeanderStep | 6485 | PORTOWANE-Q2 | `rivers_b/meander.rs` `find_river_meander_step` | `meander` (2000) |
| 34 | sanitizeRiverTurnWindow | 7094 | PORTOWANE-Q2 | `rivers_b/window.rs` `sanitize_river_turn_window` | `sanitize_window` (3000) |
| 35 | canReceiveRiverYieldMark | 7122 | PORTOWANE-Q2 | `rivers_b/edges.rs` `can_receive_river_yield_mark` | `canreceive` (3000) |
| 36 | markRiverEdge | 7127 | PORTOWANE-Q2 | `rivers_b/edges.rs` `mark_river_edge` | `mark_edge` (2500) |
| 37 | markRiverEdgePair | 7137 | PORTOWANE-Q2 | `rivers_b/edges.rs` `mark_river_edge_pair` | `mark_pair` (2500) |
| 38 | riverHexCornerStep | 7146 | PORTOWANE-Q2 | `rivers_b/edges.rs` `river_hex_corner_step` | `corner_step` (12, wyczerpująco) |
| 39 | walkRiverHexPerimeter | 7150 | PORTOWANE-Q2 | `rivers_b/edges.rs` `walk_river_hex_perimeter` | `walk` (72, wyczerpująco) |
| 40 | riverCornersAlongHexEdges | 7166 | PORTOWANE-Q2 | `rivers_b/edges.rs` `river_corners_along_hex_edges` | `corners` (1250, wyczerpująco, parzystość 0/1) |
| 41 | riverEdgeBetweenCorners | 7195 | PORTOWANE-Q2 | `rivers_b/edges.rs` `river_edge_between_corners` | `edge_between` (36, wyczerpująco) |
| 42 | riverTransitEdgeIndices | 7202 | PORTOWANE-Q2 | `rivers_b/edges.rs` `river_transit_edge_indices` | `transit_idx` (722, wyczerpująco) |
| 43 | simplifyRiverRenderPath | 7214 | PORTOWANE-Q2 | `rivers_b/edges.rs` `simplify_river_render_path` | `simplify` (3000) |
| 44 | markRiverTransitEdgesOnPath | 7232 | PORTOWANE-Q2 | `rivers_b/edges.rs` `mark_river_transit_edges_on_path` | `mark_transit` (3000) |

Podsumowanie Q2: 15/15 symboli zakresu ma kod; wektory z weba: 19092 (edges) + 6500 (coast/grow/meander).

### Pliki i rozmiary

- `tests/p6_m07b2_vectors/gen_edges_vectors.mjs` → `web-rivers-b-edges.json` (2 215 786 B, format `p6-m07b2-edges-v1`, 19 092 przypadków).
- `tests/p6_m07b2_vectors/gen_coast_grow_vectors.mjs` → `web-rivers-b-coast-grow.json` (2 346 962 B, format `p6-m07b2-coast-v1`, 6 500 przypadków: collect 3000 / grow 1500 / meander 2000).
- Oba ≤ 6 MB (lekcja e). Generatory deterministyczne (mulberry32, ziarna `0x5eed2027`, `0x5eed2028`), wyciągają tekst z pinu po nazwie.
- Testy: `tests/p6_m07b2_edges.rs` (3 testy), `tests/p6_m07b2_coast.rs` (2 testy).
- Pokrycie gałęzi (asercje w testach): canReceive true/false; zmiany stanu rzeki dla mark_edge/mark_pair/mark_transit; sanityzacja zmienia ścieżkę; uproszczenie zmienia ścieżkę; collect niepusty ≥300; grow ≥3 heksy ≥200; grow z indeksem sepIndex ≥100; meander Some ≥300 i None ≥300.
- Lekcja (a) nakładki: mapy generatorów zawierają `las`/`zloze_*` na heksach wodnych (morze, płytkie) i lądowych; asercja w teście `edges_vectors_cover_branches_and_overlays`.
- Lekcja (b) cap: w zakresie Q2 nie ma capów pętli z parametrem N (pętle: `guard < 48`, `< 4000`, `< 7` — stałe sztywne, NIE dotyczy wektorów N-1/N/N+1; ZAŁOŻENIE: zachowanie guardów pokryte pośrednio losowymi ścieżkami 0..16 kroków, NIE zmierzono osobno).
- Lekcja (h) komparatory: NaN nie występuje w wektorach; sortowanie kandydatów przez `cmp_candidates_desc` (współdzielone z M07A, stabilne jak `Array.prototype.sort`).

### Zmiany w obszarze rivers_a (dozwolone allowlistą: tylko widoczność)

- `rivers_a/grow.rs:290`: `fn cmp_candidates_desc` → `pub(crate) fn cmp_candidates_desc` (użycie w `coast_grow.rs`). Logika bez zmian.

### ZAŁOŻENIA (luki rozstrzygnięte założeniem)

1. Gałąź kwadratu centrum (`ContinentCenterSquare`, `landCenterSquare` != null) NIE jest generowana w wektorach Q2: pole `square` = null. Powód: konstruktor `ContinentCenterSquare` w Rust (`relief.rs:298`) nie ma publicznego konstruktora, a zmiana `relief.rs` jest poza allowlistą. Gałąź `scoreRiverStepTowardCenterSquare` pozostaje pokryta testami M07A (`rivers_a/walk.rs`, `score_river_step_toward_land_center`); przekazywanie `square` w Q2 jest kodem 1:1 (`Option` forward). Do zamknięcia w kolejnym temacie.
2. `openOceanDist` w `growRiverFromCoastInland` nie jest używany przez web (argument przekazywany, nieczytany). Rust: parametr `_open_ocean_dist` (zachowana sygnatura).
3. `serde_json` (bez feature `float_roundtrip`) potrafi dać 1 ulp błędu przy parsowaniu długich dziesiętnych z wektora (`221.33434182980562` → `221.3343418298056`). Zweryfikowano w node: wartość obliczona przez web-formułę = wartość Rust (`EQ`). Porównanie score w `coast_grow_vectors_match_web` z tolerancją 1e-12 (ZAŁOŻENIE: rozbieżność wyłącznie w parserze testu). Cargo.toml bez zmian (poza allowlistą).
4. `ContinentCenterSquare.centroid` w Rust jest niepustym `(f64,f64)`; web: `landCenterSquare?.centroid` może być `null` -> przejście do `estimateLandCentroidFromMouth`. W wektorach square = null, więc gałąź nie jest testowana; zgodność przy square != null i centroid == null to ZAŁOŻENIE (w webie pole typu `{q,r}` zawsze ustawione przy konstrukcji, zob. gen-helpers.ts:1532-1536).

### Luki (NIE WYKONANO w tej rundzie)

- **Mutanty (lekcja d)**: WYKONANO w rundzie 2 (patrz „Runda 2 — Operator-pomiary" niżej): 100 mutantów, 67 KILLED, 33 SURVIVED; 17 SURVIVED z oczekiwaniem K to LUKI TESTOWE (otwarte). Tabela niezmutowanych konstrukcji plik:linia NIE ZREALIZOWANA w tej rundzie (luka).
- **Weryfikator Python od zera (lekcja c)**: WYKONANO w rundzie 2 — 25 592/25 592 zgodne, EXIT=0 (`verify-m07b2-q2-r2.txt`).
- **Długie pomiary**: nie wykonywano (zgodnie z rolą Operator-impl w dispatchu).

### Bramki (worktree `wf_4f4325d0-462-1`, gałąź `r-rustport-m07b2-q2`)

- `cargo fmt --check`: EXIT=0 (`runs/R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1/gate-fmt-r1.txt`).
- `cargo clippy --lib --tests`: 0 ostrzeżeń, EXIT=0 (`gate-clippy-r1.txt`).
- `cargo test --test p6_m07b2_edges --test p6_m07b2_coast --test p6_m07b_turn`: 2+3+2 OK, EXIT=0 (`gate-test-m07b2-r1.txt`).
- `cargo test` (pełny silnik): 1932 passed, 0 failed, EXIT=0 (`gate-test-full-r1.txt`; baza 1927 + 5 nowych testów).
- `git diff --check`: sprawdzane przed commitem.
- `Cargo.lock` w `rust-port/engine/` jest niesledzony i NIE jest częścią commitów.
- Target Cargo: `/dev/shm/m07b2-q2-target` (do usunięcia po etapie).

### Runda 2 — Operator-pomiary (weryfikator, mutanty)

Commit kodu badany: `b443131af` (kod Q2 = `687d39563`; tracked pliki czyste, `git diff` pusty). Logi: `runs/R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1/`.

- **Weryfikator Python od zera**: `tests/p6_m07b2_vectors/verify_m07b2_q2.py` (implementacja z TS pinu, nie z Rust/.mjs). Wynik: `TOTAL: 25592/25592 zgodne`, `EXIT=0` (`verify-m07b2-q2-r2.txt`; ponowne uruchomienie tej rundy daje identyczny wynik). Pokrycie: canreceive 3000, collect 3000, grow 1500, meander 2000, mark_edge 2500, mark_pair 2500, mark_transit 3000, sanitize_window 3000, simplify 3000, corner_step 12, corners 1250, edge_between 36, transit_idx 722, walk 72, input_sea_mismatch_maps 0.
- **Mutanty**: `tests/p6_m07b2_vectors/mutate_m07b2_q2.py` (100 mutantów: C01–C21, G01–G16, M01–M13, W01–W10, E01–E38; każdy = jedno asercyjne podstawienie, przywrócenie pliku z kontrolą sha256). Log: `mutate-m07b2-q2-r2.txt`, 100/100 wpisów, wszystkie `RESTORED=True`. Wynik: **67 KILLED, 33 SURVIVED**.
- **SURVIVED z oczekiwaniem E/L (równoważność lub nieosiągalność; ZAŁOŻENIE z uzasadnieniem w logu, do weryfikacji przez Evaluatora)**: C05, M02, M06, M13, E01, E03, E06, E07, E10, E24, E27, E31 (E); G13, G14, W06, E28 (L).
- **SURVIVED z oczekiwaniem K = LUKI TESTOWE (otwarte, NIE zamknięte)**: C12 (`center_step > 8`→`> 7`), C21 (`sea_dist(cur)` default), G05 i G06 (filtr `visited` w przebiegach), G11 (oznaczenie wybranego heksa), G12 (oznaczenie ujścia), M03 (filtr kierunku celu), M11 (`sea_dist(cur)` default 999), W05 (break przy cięciu na końcu), W08 (naprawa sąsiedztwa okna), E13, E14, E17, E18, E19 (gałęzie parzystości i fallback w `river_corners_along_hex_edges`), E25 (deduplikacja w `river_transit_edge_indices`), E35 (parzystość heksa w `mark_river_transit_edges_on_path`). Razem 17.
- **Tabela niezmutowanych konstrukcji plik:linia**: NIE ZREALIZOWANA w tej rundzie. Mutanty są opisane w linii web (`:NNNN`), brak mapowania na linie Rust; wymagane w następnej rundzie razem z zamknięciem 17 luk.
- **Wniosek dla bramki**: lekcja (d) NIE spełniona (17 luk K + brak tabeli). Lekcje (c) i gate fmt/clippy/test — spełnione.
