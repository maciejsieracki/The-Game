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
| 7 | traceRiverFromCoast | 6233 | PORTOWANE-Q3 | `rivers_b/trace_coast.rs:30` `trace_river_from_coast` |
| 8 | greedyRiverDrainToSea | 6276 | PORTOWANE-Q3 | `rivers_b/trace_coast.rs:116` `greedy_river_drain_to_sea` |
| 9 | RiverAStarOpenHeap (klasa) | 6341 | PORTOWANE-Q3 | `rivers_b/astar.rs:24` `RiverAStarOpenHeap` |
| 10 | aStarRiverToSea | 6387 | PORTOWANE-Q3 | `rivers_b/astar.rs:104` `a_star_river_to_sea` |
| 11 | findRiverMeanderStep | 6485 | NIE | Q2 |
| 12 | injectRiverMeanders | 6526 | PORTOWANE-Q3 | `rivers_b/extend.rs:26` `inject_river_meanders` |
| 13 | extendRiverToMinimumLength | 6569 | PORTOWANE-Q3 | `rivers_b/extend.rs:82` `extend_river_to_minimum_length` |
| 14 | extendRiverToWybrzeze | 6602 | PORTOWANE-Q3 | `rivers_b/extend.rs:126` `extend_river_to_wybrzeze` |
| 15 | finishRiverMouthAtSea | 6647 | PORTOWANE-Q3 | `rivers_b/extend.rs:184` `finish_river_mouth_at_sea` |
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

### Runda 3 — Operator (częściowe domknięcie 17 luk K; start `66425c633`)

Stan: rozstrzygnięte TYLKO dowodami plik:linia dla 5 z 17 mutantów K (poniżej). Pozostałe 12 K i 16 E/L: NIE ZAMKNIĘTE w tej rundzie (patrz „Otwarte"). Numeracja linii = Rust (`rust-port/engine/src/domain/mapgen/`), web = pin `edb8fb56`.

| Mutant | Status | Dowód (Rust plik:linia; web) |
|---|---|---|
| C12 (`centerStep > 8` → `> 7`) | EKWIWALENT | `rivers_b/coast_grow.rs:89` gałąź `center_step > 8`; wartości `score_river_step_toward_centroid` ∈ {22, -12, 3, 0} (`rivers_a/walk.rs:238-250`), `score_river_step_toward_center_square` ∈ {40, 32, -22, 4, 0} (`walk.rs:262-276`). Żadna wartość nie równa się 7 ani 8, więc progi 7 i 8 dają ten sam wynik dla wszystkich wejść. Web `:6118`. |
| C21 (`seaDist(cur)` default 0 → 1) | EKWIWALENT | `coast_grow.rs:48` (`cur_d`); `collect` wywoływane zawsze z `path.len() >= 1` (`is_river_window_turn_allowed` panikuje dla pustej trasy, `rivers_a/grow.rs:84`, zanim użyty zostanie `cur_d`). Kandydat przechodzi filtr `coast_grow.rs:70-72` (`nd < RIVER_MIN_INLAND_FROM_SEA`, = 2, `rivers_a.rs:55`), więc `nd >= 2` > `cur_d` ∈ {0, 1}: gałęzie `nd > cur_d`, `nd == cur_d`, `nd < cur_d` dają ten sam wynik dla obu wartości. Web `:6100`. |
| M03 (filtr `same_river_dir` w meandrze usunięty) | EKWIWALENT | `rivers_b/meander.rs:37` (filtr `nk == tgt_k`) przed `meander.rs:40` (filtr kierunku). `to_target = target - cur` (`walk.rs:130-132`). Równość z jednostkowym wektorem kierunku oznacza `nk == target`, czyli kandydat jest już odrzucony filtrem `nk == tgt_k`. Gdy `to_target` nie jest jednostkowy, równość nie zachodzi. Web `:6504`. |
| W05 (`cut_at >= len-1` usunięte) | EKWIWALENT | `rivers_b/window.rs:32` pętla `for i in 0..deltas.len()`, `cut_at = i+1`; warunek `window.rs:46`. `deltas.len() <= dirs.len()-1 <= out.len()-2`, więc `cut_at <= out.len()-2 < out.len()-1`: warunek nigdy nie zachodzi. Web `:7114`. |
| W08 (`repair_river_path_adjacency` po cięciu pominięte) | EKWIWALENT | `rivers_b/window.rs:52-53` (`sanitize_river_path`, potem `repair`); `rivers_a.rs:260-279` (`sanitize_river_path`: pomija duplikaty i punkty niesąsiednie, więc wynik jest ciągły i bez powtórzeń). `rivers_a.rs:317-345`: dla ciągłej ścieżki każdy `target` ma `d == 1` i jest dopisywany bez zmian, czyli `repair` jest tożsamością. Web `:7116`. |

**Weryfikacja dowodów (skrypty w repo, `tests/p6_m07b2_vectors/`)**:
- W08: sprawdzono niezależnie w Pythonie (port weryfikatora): 3000/3000 przypadków `sanitize_window` daje wynik bez `repair` identyczny z wektorem webu (0 rozbieżności). Zgodne z dowodem.
- G05, G06, G11, G12 (filtr `visited` / oznaczenie w `grow`): wyczerpujący DFS po ścieżkach (`loop_window_dfs_m07b2_q2.py`, długość ≤ 18) nie znajduje kandydata-pętli dopuszczalnego oknem skrętu. Losowe przeszukiwanie (`loop_window_probe_m07b2_q2.py`, 60 000 prób, długość ≤ 60) ZNAJDUJE 6 takich kandydatów przy długości > 18. Zatem NIE są one równoważne ogólnie; zabicie wymaga wektora `grow` z taką geometrią (NIE ZREALIZOWANE).

**Otwarte (NIE zamknięte w tej rundzie)**:
- G05, G06, G11, G12: wymagany wektor `grow` z pętlą dopuszczalną oknem (długość > 18), wygenerowany z weba pinu (wyszukanie przez port Python, potem generacja z weba).
- M11 (`cur_d` meandru: default 999 → 0): ZABIJALNY wektorem: przypadki `findRiverMeanderStep`, w których `cur` nie występuje w `seaDist` (usunięcie klucza z mapy wejściowej; web `:6494`). Nie wykonano.
- E13, E14, E17, E18, E19, E25, E35 (`river_corners_along_hex_edges`, `river_transit_edge_indices`, `mark_river_transit_edges_on_path`): NIE analizowane w tej rundzie.
- 16 mutantów E/L z rundy 2 (C05, M02, M06, M13, E01, E03, E06, E07, E10, E24, E27, E31, G13, G14, W06, E28): dowody plik:linia / wektory NIE dodane.
- Tabela niezmutowanych konstrukcji plik:linia (N3): NIE wykonana.
- Logi bramek z linią `EXIT=` (N4): NIE ponowione; `mutate-m07b2-q2-r2.txt` nadal bez `EXIT=`.


### Runda 3 — Operator-pomiary (kontynuacja: weryfikacja dowodów, mutacje, bramki; kod `687d39563`)

Start: `b1088d1f8` (detach; kod nie zmieniany, zmiany tylko w testach/dossier). Log: `runs/R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1/`, raport `04-operator-r3-pomiary.md`.

**Bramki (surowe logi z `EXIT=`, cargo z `CARGO_TARGET_DIR=/dev/shm/m07b2-r3-target`):**
- `cargo fmt --check`: EXIT=0 (`gate-fmt-r3.txt`).
- `cargo clippy --all-targets`: EXIT=0, 0 ostrzeżeń (`gate-clippy-r3.txt`).
- `cargo test --test p6_m07b2_coast --test p6_m07b2_edges`: EXIT=0, 2+3 testów zielonych (`gate-test-m07b2-r3.txt`).
- Pełny `cargo test`: `--lib` 22 passed EXIT=0 (`gate-test-full-r3-lib.txt`); 252 cele integracyjne w 5 partiach po ≤60 celów (`gate-test-full-r3-c00..c04.txt`), każda EXIT=0, 0 FAILED. Partiowanie = ZAŁOŻENIE (r2: jedno wywołanie = EXIT=124 przez limit czasu).

**Weryfikator Python (ponownie):** `verify-m07b2-q2-r3.txt`: `TOTAL: 25592/25592 zgodne`, EXIT=0 (ten sam weryfikator co R2; nie jest niezależny od Operatora R2 — ZAŁOŻENIE do oceny Evaluatora).

**Mutanty K — ponowny przebieg 33 SURVIVED (`ids`, log `mutate-m07b2-q2-r3.txt`):** wszystkie 33 reprodukują SURVIVED, `RESTORED=True` dla każdego. Kod zakresu niezmieniony, więc 67 KILLED z R2 nie było ponawiane. UWAGA: wywołanie przez `| cut` — kod wyjścia skryptu nie został zachowany; brak linii `EXIT=` w logu R3 (NIE_ZMIERZONO, do uzupełnienia przy następnym przebiegu). Log R2 (`mutate-m07b2-q2-r2.txt`) nadal bez `EXIT=` (historia, nie edytowana).

**Zamknięte dowody (K → EKWIWALENT):**
- Potwierdzono zarzuty R3 dla C12, C21, M03, W05, W08 (plik:linia w tabeli poniżej; sprawdzono treść mutantów w `mutate_m07b2_q2.py`).
- C21: wywołanie `collect` ma `path` zawsze niepustą (`coast_grow.rs:138` — `path = vec![mouth]`), więc filtr `coast_grow.rs:71` działa i `nd >= 2 = RIVER_MIN_INLAND_FROM_SEA` (`rivers_a.rs:55`).
- W05: `window.rs:46` clause `cut_at >= len-1` jest nieosiągalna, bo `cut_at <= len-2`.
- W08: `sanitize_river_path` (`rivers_a.rs:264-277`) zwraca ścieżkę o kolejnych sąsiadach; `repair` (`rivers_a.rs:328-342`, gałąź `d == 1`) jest wtedy tożsamością.
- E13, E14, E17, E18, E19, E25, E35 (`edges.rs:100-146`, `162-175`, `231`): dowód wyczerpujący modelu Python `tests/p6_m07b2_vectors/corners_exhaustive_m07b2_q2.py` (log `corners-exhaustive-r3.txt`, EXIT=0). Model walidowany na 1250/1250 wektorach weba `corners`. Dziedzina: a,b in 0..5 (rem_euclid 6), parzystość w {-2..3}: 216 przypadków na mutant, roznic 0 dla E13, E14, E17, E18, E19, E35 (transit par vs par+1). E25: 0/216 przypadków z duplikatem krawędzi. Uzasadnienie ogólne: `walk_river_hex_perimeter` (`edges.rs:81-95`) zwraca prostą ścieżkę po 6-cyklu, więc pary kolejnych rogów mają różne krawędzie; korekta parzystości zmienia wynik tylko przy `score == best_score`, a wtedy nie zmienia wyboru; gałąź fallback jest nieosiągalna, bo dla a != b istnieje para wejście/wyjście o długości >= 2 (E18: 0 przypadków).

**Otwarte po R3:**
- K (LUKA, wymagany wektor `grow` z pętlą > 18 z weba pinu): G05, G06, G11, G12.
- K (LUKA, wymagany wektor meandru z `cur` poza `seaDist`): M11 (`meander.rs:27`, default 999 → 0 — nie wykonano).
- L: G13, G14, W06, E28 — nieosiągalność na mapach ≤127 nadal ZAŁOŻENIE, bez dowodu i bez wektora N-1/N/N+1 na tym samym starcie.
- E (analiza R3, do weryfikacji): C05, M02, M06, E06, E07, E10, E24, E27, E31 (plik:linia w tabeli). E01, E03, M13 — zalozenie R2, nie re-analizowane w R3.

**Tabela niezmutowanych konstrukcji (N3) — mutant → linia Rust → status** (linia = pierwsze wystąpienie `old` w pliku; generator: `/tmp/.../scratchpad/n3_table.py`, nie w repo):

| ID | oczek. | plik | linia Rust | wynik r2 | status R3 |
|---|---|---|---|---|---|
| C01 | K | coast_grow.rs | 54 | KILLED | KILLED (test) |
| C02 | K | coast_grow.rs | 57 | KILLED | KILLED (test) |
| C03 | K | coast_grow.rs | 63 | KILLED | KILLED (test) |
| C04 | K | coast_grow.rs | 67 | KILLED | KILLED (test) |
| C05 | E | coast_grow.rs | 71 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| C06 | K | coast_grow.rs | 71 | KILLED | KILLED (test) |
| C07 | K | coast_grow.rs | 74 | KILLED | KILLED (test) |
| C08 | K | coast_grow.rs | 74 | KILLED | KILLED (test) |
| C09 | K | coast_grow.rs | 85 | KILLED | KILLED (test) |
| C10 | K | coast_grow.rs | 86 | KILLED | KILLED (test) |
| C11 | K | coast_grow.rs | 87 | KILLED | KILLED (test) |
| C12 | K | coast_grow.rs | 89 | SURVIVED | EKWIWALENT (dowod R3) |
| C13 | K | coast_grow.rs | 90 | KILLED | KILLED (test) |
| C14 | K | coast_grow.rs | 92 | KILLED | KILLED (test) |
| C15 | K | coast_grow.rs | 93 | KILLED | KILLED (test) |
| C16 | K | coast_grow.rs | 88 | KILLED | KILLED (test) |
| C17 | K | coast_grow.rs | 98 | KILLED | KILLED (test) |
| C18 | K | coast_grow.rs | 99 | KILLED | KILLED (test) |
| C19 | K | coast_grow.rs | 100 | KILLED | KILLED (test) |
| C20 | K | coast_grow.rs | 102 | KILLED | KILLED (test) |
| C21 | K | coast_grow.rs | 48 | SURVIVED | EKWIWALENT (dowod R3) |
| G01 | K | coast_grow.rs | 154 | KILLED | KILLED (test) |
| G02 | K | coast_grow.rs | 156 | KILLED | KILLED (test) |
| G03 | K | coast_grow.rs | 177 | KILLED | KILLED (test) |
| G04 | K | coast_grow.rs | 179 | KILLED | KILLED (test) |
| G05 | K | coast_grow.rs | 173 | SURVIVED | LUKA K |
| G06 | K | coast_grow.rs | 182 | SURVIVED | LUKA K |
| G07 | K | coast_grow.rs | 187 | KILLED | KILLED (test) |
| G08 | K | coast_grow.rs | 191 | KILLED | KILLED (test) |
| G09 | K | coast_grow.rs | 192 | KILLED | KILLED (test) |
| G10 | K | coast_grow.rs | 194 | KILLED | KILLED (test) |
| G11 | K | coast_grow.rs | 197 | SURVIVED | LUKA K |
| G12 | K | coast_grow.rs | 140 | SURVIVED | LUKA K |
| G13 | L | coast_grow.rs | 143 | SURVIVED | LUKA L |
| G14 | L | coast_grow.rs | 150 | SURVIVED | LUKA L |
| M01 | K | meander.rs | 37 | KILLED | KILLED (test) |
| M02 | E | meander.rs | 37 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| M03 | K | meander.rs | 40 | SURVIVED | EKWIWALENT (dowod R3) |
| M04 | K | meander.rs | 44 | KILLED | KILLED (test) |
| M05 | K | meander.rs | 44 | KILLED | KILLED (test) |
| M06 | E | meander.rs | 47 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| M07 | K | meander.rs | 50 | KILLED | KILLED (test) |
| M08 | K | meander.rs | 53 | KILLED | KILLED (test) |
| M09 | K | meander.rs | 59 | KILLED | KILLED (test) |
| M10 | K | meander.rs | 58 | KILLED | KILLED (test) |
| M11 | K | meander.rs | 27 | SURVIVED | LUKA K |
| M12 | K | meander.rs | 65 | KILLED | KILLED (test) |
| M13 | E | meander.rs | 68 | SURVIVED | E (zalozenie R2, bez weryfikacji R3) |
| M14 | L | meander.rs | 65 | KILLED | KILLED (test) |
| M15 | K | meander.rs | 58 | KILLED | KILLED (test) |
| W01 | K | window.rs | 33 | KILLED | KILLED (test) |
| W02 | K | window.rs | 37 | KILLED | KILLED (test) |
| W03 | K | window.rs | 40 | KILLED | KILLED (test) |
| W04 | K | window.rs | 40 | KILLED | KILLED (test) |
| W05 | K | window.rs | 46 | SURVIVED | EKWIWALENT (dowod R3) |
| W06 | L | window.rs | 24 | SURVIVED | LUKA L |
| W07 | K | window.rs | 26 | KILLED | KILLED (test) |
| W08 | K | window.rs | 53 | SURVIVED | EKWIWALENT (dowod R3) |
| W09 | K | window.rs | 52 | KILLED | KILLED (test) |
| E01 | E | edges.rs | 19 | SURVIVED | E (zalozenie R2, bez weryfikacji R3) |
| E02 | K | edges.rs | 22 | KILLED | KILLED (test) |
| E03 | E | edges.rs | 28 | SURVIVED | E (zalozenie R2, bez weryfikacji R3) |
| E04 | K | edges.rs | 35 | KILLED | KILLED (test) |
| E05 | K | edges.rs | 42 | KILLED | KILLED (test) |
| E06 | E | edges.rs | 45 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| E07 | E | edges.rs | 51 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| E08 | K | edges.rs | 66 | KILLED | KILLED (test) |
| E09 | K | edges.rs | 72 | KILLED | KILLED (test) |
| E10 | E | edges.rs | 82 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| E11 | K | edges.rs | 87 | KILLED | KILLED (test) |
| E12 | K | edges.rs | 104 | KILLED | KILLED (test) |
| E13 | K | edges.rs | 122 | SURVIVED | EKWIWALENT (model wyczerp. R3) |
| E14 | K | edges.rs | 123 | SURVIVED | EKWIWALENT (model wyczerp. R3) |
| E15 | K | edges.rs | 131 | KILLED | KILLED (test) |
| E16 | K | edges.rs | 134 | KILLED | KILLED (test) |
| E17 | K | edges.rs | 127 | SURVIVED | EKWIWALENT (model wyczerp. R3) |
| E18 | K | edges.rs | 141 | SURVIVED | EKWIWALENT (model wyczerp. R3) |
| E19 | K | edges.rs | 116 | SURVIVED | EKWIWALENT (model wyczerp. R3) |
| E20 | K | edges.rs | 107 | KILLED | KILLED (test) |
| E21 | K | edges.rs | 151 | KILLED | KILLED (test) |
| E22 | K | edges.rs | 152 | KILLED | KILLED (test) |
| E23 | K | edges.rs | 154 | KILLED | KILLED (test) |
| E24 | E | edges.rs | 164 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| E25 | K | edges.rs | 170 | SURVIVED | EKWIWALENT (model wyczerp. R3) |
| E26 | K | edges.rs | 170 | KILLED | KILLED (test) |
| E27 | E | edges.rs | 181 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| E28 | L | edges.rs | 186 | SURVIVED | LUKA L |
| E29 | K | edges.rs | 193 | KILLED | KILLED (test) |
| E30 | K | edges.rs | 198 | KILLED | KILLED (test) |
| E31 | E | edges.rs | 213 | SURVIVED | EKWIWALENT (analiza R3 plik:linia, do weryfikacji Evaluatora) |
| E32 | K | edges.rs | 228 | KILLED | KILLED (test) |
| E33 | K | edges.rs | 218 | KILLED | KILLED (test) |
| E34 | K | edges.rs | 223 | KILLED | KILLED (test) |
| E35 | K | edges.rs | 231 | SURVIVED | EKWIWALENT (model wyczerp. R3) |
| G15 | K | coast_grow.rs | 149 | KILLED | KILLED (test) |
| G16 | K | coast_grow.rs | 169 | KILLED | KILLED (test) |
| E36 | K | edges.rs | 102 | KILLED | KILLED (test) |
| E37 | K | edges.rs | 89 | KILLED | KILLED (test) |
| E38 | K | edges.rs | 18 | KILLED | KILLED (test) |
| W10 | K | window.rs | 22 | KILLED | KILLED (test) |

**Podsumowanie R3:** 100 mutantów: KILLED 67 (R2, bez zmian kodu), EKWIWALENT dowodem 12, E zanalizowane 9 (do weryfikacji), LUKA K 5, LUKA L 4, E bez analizy 3 (E01, E03, M13). Status tematu: BLOCK, zakres niezamknięty (N1: 5 K; N2: 4 L + 3 E bez dowodu).


### Runda 4 — domknięcie N1–N5 (kod Rust zakresu bez zmian: `git diff 66425c633 HEAD -- rust-port/engine/src` puste)

Start: `69613ecf8` (detach). Uwaga: commit `wip` `69613ecf8` zawierał ZEROWY `rivers_b/window.rs` (przerwana mutacja) — plik przywrócony z `66425c633` (kod bez zmian względem `687d39563`). Częściowe logi `mutate-m07b2-q2-r4-cA/cB.txt` (wyniki INFRA z przerwanego przebiegu) usunięte jako nieważne.

**N1/N2 — nowe wektory z uruchomionego weba pinu `edb8fb56`** (generator w repo: `tests/p6_m07b2_vectors/gen_q2_r4_vectors.mjs`, deterministyczny — ponowne uruchomienie daje plik bajt-w-bajt identyczny, sha256 `13981cfff283…b9cfad`; wektory `web-rivers-b-q2r4.json` 4 095 814 B ≤ 6 MB; test `tests/p6_m07b2_q2r4.rs`, 2 testy). Pole `kills` = które WARIANTY WEBA (kopia funkcji z pinu z jedną podmianą tekstową = mutant Rust) dają INNE wyjście niż oryginał; `out` zawsze z NIEZMIENIONEJ funkcji weba:
- **G05/G06/G11/G12** (visited): mapy kołowe R=14..26 (nakładki las/złoże także na wodzie, rzeki, relief, jeziora), `stepCap` 60–200; rzeka okrąża centroid i wchodzi na własny ślad (długość ścieżki do 142). Wektory rozróżniające: G05 41, G06 39, G11 40, G12 3 (ujście inland, powrót do ujścia). G12 wymaga ujścia z `seaDist >= 2` (dla ujścia przybrzeżnego `nd < 2` w `coast_grow.rs:71` odrzuca powrót) — wektory mają takie ujścia.
- **G13/G17 (`landCenterSquare != null`)**: 80 przypadków `grow` z kwadratem `continentCenterSquare` (web `:1472`, Rust `continent_center_square`); 54 rozróżnia wariant „kwadrat nieprzekazany” (G17). G13 jest EKWIWALENTEM (dowód w tabeli), G17 ZABITY.
- **G14 (visitCap 6000)**: dwie mapy kołowe R=46 (6487 heksów, ląd 6013/6022 > 6001), centroid z `estimateLandCentroidFromMouth` dla cap 3000/5999/6001/6000. 25 przypadków `grow` z `landCentroid=null` (centroid liczony wewnątrz, cap 6000): 14 rozróżnia cap 3000, 6 cap 5999, 8 cap 6001; 2 starty rozróżniają WSZYSTKIE trzy (N-1/N/N+1 na TYM SAMYM starcie). Zabite mutanty: G14 (3000), G14b (5999), G14c (6001).
- **M11**: 1200 przypadków meandru, z czego 817 z `cur` usuniętym z `seaDist` (pole `drop`, web `?? 999`): 517 `Some`, 300 `None`.
- **W06 (cap 48)**: ścieżki zygzaka (naprzemienne kierunki `d0`, `d0±2`: każdy ząb łamie okno skrętu, jedno cięcie naprawia jeden ząb), 44–66 zębów; 10 przypadków, w tym 8 gdzie caps 47 i 49 dają inny wynik niż 48 (N-1/N/N+1 na tym samym starcie; maks. długość wejścia 138). Zabite: W06 (47), W06b (49).
- **E28 (cap 4000)**: ścieżki `A,B,A,B,…` długości 7998…8006 (każdy przebieg usuwa 2 wpisy; L=8002 wymaga dokładnie 4000 przebiegów, L=8004 zostawia 4 wpisy). Zabite: E28 (3999), E28b (4001).
- **Pełna dziedzina `corners`**: dodatkowo `i,o ∈ 0..5`, `par ∈ −3..3` (252 przypadki) obok istniejących 1250 (`i,o ∈ −12..12`, `par ∈ {0,1}`).

**N3 — tabela mutant → linia Rust → status** (generator tabeli w repo: `tests/p6_m07b2_vectors/n3_table_m07b2_q2.py`, kod wyjścia 1 przy jakiejkolwiek LUCE lub braku wyniku; wynik poniżej z EXIT=0). Linie Rust = stan HEAD; dowody EKWIWALENT podają plik:linia Rust i web pinu. Dla E13/E14/E17/E18/E19/E35 dowód obejmuje CAŁĄ skończoną dziedzinę (wejścia redukują się do `(a,b) ∈ 0..5², parzystość ∈ {parzysta, nieparzysta}`), którą pokrywają wektory `corners`/`transit_idx` weba, a mutanty je przechodzą — czyli są funkcyjnie równe oryginałowi na każdym możliwym wejściu.

| ID | oczek. | linia Rust | wynik r4 (log) | status | dowod rownowaznosci (plik:linia Rust + web) |
|---|---|---|---|---|---|
| C01 | K | coast_grow.rs:54 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C02 | K | coast_grow.rs:57 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C03 | K | coast_grow.rs:63 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C04 | K | coast_grow.rs:67 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C05 | E | coast_grow.rs:71 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | coast_grow.rs:54 wola `is_river_window_turn_allowed`, a ta robi `expect` na pustej sciezce (rivers_a/grow.rs:84; web :7026 TypeError) PRZED guardem :71 - dla pustej sciezki oryginal i mutant panikuja w tym samym miejscu; dla niepustej guard jest prawdziwy w obu |
| C06 | K | coast_grow.rs:71 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C07 | K | coast_grow.rs:74 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C08 | K | coast_grow.rs:74 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C09 | K | coast_grow.rs:85 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C10 | K | coast_grow.rs:86 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C11 | K | coast_grow.rs:87 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C12 | K | coast_grow.rs:89 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | `center_step` pochodzi wylacznie z walk.rs:232-251 {22,-12,3} i :255-279 {40,32,-22,4,0} (web :6036-6038, :6041-6056); zadna wartosc nie lezy w (7,8], wiec `> 8` == `> 7` (coast_grow.rs:89) |
| C13 | K | coast_grow.rs:90 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C14 | K | coast_grow.rs:92 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C15 | K | coast_grow.rs:93 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C16 | K | coast_grow.rs:88 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C17 | K | coast_grow.rs:98 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C18 | K | coast_grow.rs:99 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C19 | K | coast_grow.rs:100 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C20 | K | coast_grow.rs:102 | KILLED (mutate-m07b2-q2-r4-k2.txt) | KILLED |  |
| C21 | K | coast_grow.rs:48 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | `cur_d` (coast_grow.rs:48) jest czytane tylko w :74, :86, :88; do tych linii dochodza kandydaci z `nd >= 2` (:71, sciezka niepusta :54; brak klucza -> nd=0 odpada) wiec `nd > cur_d` dla cur_d 0 i 1 jednakowo (:74 falsz, :86 prawda); web :6100,:6110-6117 |
| G01 | K | coast_grow.rs:154 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G02 | K | coast_grow.rs:156 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G03 | K | coast_grow.rs:177 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G04 | K | coast_grow.rs:179 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G05 | K | coast_grow.rs:173 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| G06 | K | coast_grow.rs:182 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| G07 | K | coast_grow.rs:187 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G08 | K | coast_grow.rs:191 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G09 | K | coast_grow.rs:192 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G10 | K | coast_grow.rs:194 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| G11 | K | coast_grow.rs:197 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| G12 | K | coast_grow.rs:140 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| G13 | E | coast_grow.rs:143 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | po `.or_else(square.centroid)` (coast_grow.rs:143) centroid trafia tylko do `score_river_step_toward_land_center` (walk.rs:281-291, web :6057-6063), ktora przy kwadracie != null IGNORUJE centroid; przy kwadracie == null galaz zwraca None (to samo co usuniecie). Estymator jest bez efektow ubocznych (walk.rs:168-215). Kwadrat != null pokryty wektorami q2r4 (grow sq=true, mutant G17) |
| G14 | K | coast_grow.rs:150 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| M01 | K | meander.rs:37 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| M02 | E | meander.rs:37 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | sasiad rowny celowi nie ma sasiada rownego sobie (prims.rs:32, brak (0,0)) -> `touches_target` falsz (meander.rs:56-59) -> continue; dodatkowo odrzuca go filtr kierunku :40 (patrz M03); web :6503,:6512-6514 |
| M03 | K | meander.rs:40 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | `river_step_dir` = (to-from) (walk.rs:130-132), `same_river_dir` = rownosc krotek (walk.rs:135-137): prawda tylko gdy offset sasiada == cel-cur, czyli nk == cel, co odrzuca juz meander.rs:37; web :5879,:5883,:6503-6504 |
| M04 | K | meander.rs:44 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| M05 | K | meander.rs:44 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| M06 | E | meander.rs:47 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | brak klucza seaDist -> nd=0, a `nd < RIVER_MIN_INLAND_FROM_SEA` (=2, rivers_a.rs:55) w meander.rs:53 daje `continue` jak w oryginale (`nd > cur_d` :50 jest falszem dla nd=0 i cur_d >= 0); web :6509-6510 |
| M07 | K | meander.rs:50 | KILLED (mutate-m07b2-q2-r4-k3.txt) | KILLED |  |
| M08 | K | meander.rs:53 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| M09 | K | meander.rs:59 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| M10 | K | meander.rs:58 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| M11 | K | meander.rs:27 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| M12 | K | meander.rs:65 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| M13 | E | meander.rs:68 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | `rand()` in [0,1) (web mulberry32 /2^32, gen-helpers.ts:57; Rust prims.rs mulberry32_step), a `opts.len() <= 6`, wiec `floor(rand*len) <= len-1`; clamp meander.rs:68 jest nieosiagalny; web :6519 nie ma clampu |
| M14 | L | meander.rs:65 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| M15 | K | meander.rs:58 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| W01 | K | window.rs:33 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| W02 | K | window.rs:37 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| W03 | K | window.rs:40 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| W04 | K | window.rs:40 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| W05 | K | window.rs:46 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | `cut_at = i+1`, `i < deltas.len() = out.len()-2` (wyjscie `sanitize_river_path` ma kolejne sasiady: rivers_a.rs:264-277, wiec `path_segment_dirs` zwraca n-1 kierunkow (grow.rs:62-71), `path_signed_turn_deltas` n-2 (grow.rs:74-79)); stad `cut_at <= n-2` i klauzula `>= n-1` (window.rs:46) jest falszem; web :7104-7114 |
| W06 | K | window.rs:24 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| W07 | K | window.rs:26 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| W08 | K | window.rs:53 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | po `sanitize_river_path` (window.rs:52) kroki sa sasiednie (rivers_a.rs:264-277: odleglosc == 1), a `repair_river_path_adjacency` (rivers_a.rs:328-342, galaz `d == 1`) dla sasiednich krokow dokleja tylko `target` -> zwraca wejscie bez zmian; web :5440-5466, :7115-7116 |
| W09 | K | window.rs:52 | KILLED (mutate-m07b2-q2-r4-k4.txt) | KILLED |  |
| E01 | E | edges.rs:19 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | `is_dry_land_terrain(Sea)` = `!Sea.is_water()` = falsz (landsea.rs:77-79, :53-55) i `Sea != ShallowSea` -> linia edges.rs:22 zwraca falsz dla Morza tak samo jak :19; web :7123-7124 |
| E02 | K | edges.rs:22 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E03 | E | edges.rs:28 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | dla `edge_idx < 0` `u8::try_from` zwraca Err (edges.rs:39-41) -> `return` bez zmian stanu; kod pomiedzy :28 a :39 (`hex_key`, `get_mut`, `can_receive...`) nie ma efektow ubocznych; web :7128 |
| E04 | K | edges.rs:35 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E05 | K | edges.rs:42 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E06 | E | edges.rs:45 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | po `contains`/`push` (edges.rs:42-44) `river_edges` jest niepuste, wiec `!is_empty()` (:45) == `true` zawsze; web :7133 |
| E07 | E | edges.rs:51 | SURVIVED (mutate-m07b2-q2-r4-s1.txt) | EKWIWALENT | dla `edge_idx < 0` `mark_river_edge(-1)` jest no-op (edges.rs:28/39), a `usize::try_from(-1)` daje Err -> `return` (edges.rs:56-60) przed drugim oznaczeniem; web :7138-7144 |
| E08 | K | edges.rs:66 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E09 | K | edges.rs:72 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E10 | E | edges.rs:82 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | dla from == to petla (edges.rs:87-93) wpisuje `from`, widzi `c == to` i przerywa -> `[from]`, identycznie jak wczesny zwrot :82-84; web :7151-7164 |
| E11 | K | edges.rs:87 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E12 | K | edges.rs:104 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E13 | K | edges.rs:122 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | parzystosc wchodzi tylko przez `hex_parity % 2 == 0` (edges.rs:122) i dodaje do `score` +0 albo +0.01 (>= 0), wiec po korekcie `score < best_score` (:134) nie moze byc prawdziwe tam, gdzie `score == best_score`; korekta wplywa tylko na `fallback_score` (:127), a fallback jest nieosiagalny (patrz E18). Wektory `corners` (i,o in -12..12, par 0/1; q2r4: i,o in 0..5, par -3..3) pokrywaja CALA dziedzine (36 par x 2 klasy parzystosci) i mutant je przechodzi; model wyczerpujacy: corners-exhaustive-r3.txt (0/216); web :7166-7194 |
| E14 | K | edges.rs:123 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | jak E13: zamiana +0/+0.01 miedzy cw/ccw (edges.rs:122-126) nie moze zmienic `best` (korekta >= 0, :134 strict), tylko `fallback_score` (nieosiagalny); wektory pokrywaja cala dziedzine; web :7183 |
| E15 | K | edges.rs:131 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E16 | K | edges.rs:134 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E17 | K | edges.rs:127 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | `<=` vs `<` dotyczy tylko `fallback` (edges.rs:127), uzywanego wylacznie gdy `best` puste (:141); `best` puste jest niemozliwe dla a != b (patrz E18); wektory pokrywaja cala dziedzine; web :7185 |
| E18 | K | edges.rs:141 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | `best` puste wymaga, by kazda kombinacja wejscie/wyjscie dawala `walked.len()-1 < MIN_BOKI` (edges.rs:131), czyli entry == exit dla wszystkich 4 par; `entry_opts` (:107) ma 2 rozne wartosci, wiec istnieje para z entry != exit (a != b; a == b zwraca [] w :104). Fallback nieosiagalny; model: 0 przypadkow (corners-exhaustive-r3.txt); web :7191 |
| E19 | K | edges.rs:116 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | kolejnosc cw/ccw zmienia wynik tylko przy remisie `score` w jednej kombinacji, a remis cw/ccw w obrebie kombinacji wymaga luku dlugosci 3 (k=3, obie drogi po 4 rogi), co nie jest minimum: sasiednie kombinacje maja k in {d-1,d,d+1}, wiec zawsze istnieje luk <= 3 rogi krotszy; remisy miedzy kombinacjami rozstrzyga kolejnosc entry/exit (edges.rs:114-115), nie cw/ccw. Wektory pokrywaja cala dziedzine i mutant je przechodzi; web :7179 |
| E20 | K | edges.rs:107 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E21 | K | edges.rs:151 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E22 | K | edges.rs:152 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E23 | K | edges.rs:154 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E24 | E | edges.rs:164 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | dla `corners.len() == 1` petla `0..0` (edges.rs:168) nie dodaje krawedzi; dla 0 oba warianty zwracaja pusty wektor (:164) - wynik identyczny; web :7204 |
| E25 | K | edges.rs:170 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | `walk_river_hex_perimeter` (edges.rs:81-96) daje proste przejscie po 6-cyklu bez powtorzen rogow; kolejne pary rogow sa rozne, a pary sasiednich rogow odwzorowuja sie na krawedzie wzajemnie jednoznacznie (`river_edge_between_corners`, edges.rs:147-158), wiec `edges.contains` (:170) nigdy nie jest prawdziwe; `ei >= 0` zawsze prawda dla sasiednich rogow. Model: 0/216 duplikatow (corners-exhaustive-r3.txt); web :7208 |
| E26 | K | edges.rs:170 | KILLED (mutate-m07b2-q2-r4-k5.txt) | KILLED |  |
| E27 | E | edges.rs:181 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | dla len == 2 petla `while i + 1 < p.len()` (edges.rs:190, i=1) nie wchodzi, `changed` zostaje falszem -> zwrot `p` jak przy wczesnym zwrocie :181; web :7216 |
| E28 | K | edges.rs:186 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| E29 | K | edges.rs:193 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E30 | K | edges.rs:198 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E31 | E | edges.rs:213 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | dla len == 1 jedyny obrot (i=0) ma dir_in=-1 i dir_out=-1 (edges.rs:216-227) -> `continue` (:228); dla 0 petla `0..0` pusta i `rp.len()-1` nie jest liczone; web :7234 |
| E32 | K | edges.rs:228 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E33 | K | edges.rs:218 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E34 | K | edges.rs:223 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E35 | K | edges.rs:231 | SURVIVED (mutate-m07b2-q2-r4-s2.txt) | EKWIWALENT | parzystosc nie ma wplywu na wynik `river_corners_along_hex_edges` (patrz E13/E14), wiec `river_transit_edge_indices` (edges.rs:162-175) nie zalezy od 3. argumentu; przesuniecie o +1 w edges.rs:231 jest bez efektu; web :7244 |
| G15 | K | coast_grow.rs:149 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| G16 | K | coast_grow.rs:169 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E36 | K | edges.rs:102 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E37 | K | edges.rs:89 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| E38 | K | edges.rs:18 | KILLED (mutate-m07b2-q2-r4-k6.txt) | KILLED |  |
| W10 | K | window.rs:22 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| G14b | K | coast_grow.rs:150 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| G14c | K | coast_grow.rs:150 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| G17 | K | coast_grow.rs:163 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| W06b | K | window.rs:24 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |
| E28b | K | edges.rs:186 | KILLED (mutate-m07b2-q2-r4-k1.txt) | KILLED |  |

Podsumowanie: mutantow 105; KILLED 80; EKWIWALENT 25; LUKA 0; BRAK wyniku 0.


**Mutacje r4 (skrypt w repo `tests/p6_m07b2_vectors/mutate_m07b2_q2.py`, 105 mutantów: 100 z r2 + 5 nowych G14b, G14c, G17, W06b, E28b; testy `p6_m07b2_coast`, `p6_m07b2_edges`, `p6_m07b2_q2r4`).** Logi `mutate-m07b2-q2-r4-{k1..k6,s1,s2}.txt`, każdy z JEDNĄ linią `EXIT=0` na końcu, każdy mutant `RESTORED=True`. Wynik: KILLED 80, EKWIWALENT (dowód plik:linia) 25, LUKA 0. Wszystkie 17 mutantów K z FC r2 rozstrzygnięte: ZABITE wektorami — G05, G06, G11, G12, M11; EKWIWALENTY z dowodem plik:linia Rust+web — C12, C21, M03, W05, W08, E13, E14, E17, E18, E19, E25, E35. Mutanty E/L: G14, W06, E28 ZABITE wektorami (N-1/N/N+1 na tym samym starcie), G13 EKWIWALENT (dowód + pokrycie G17), pozostałe 12 (C05, E01, E03, E06, E07, E10, E24, E27, E31, M02, M06, M13) EKWIWALENTY z dowodem w tabeli. Uwaga: `s1/s2` (25 survivorów) uruchomione przed kosmetyczną zmianą testu pokrycia `q2r4_vectors_cover_mutant_kills` (clippy `len_zero`); funkcjonalnie mutanty nie zależą od testu pokrycia. Logi nieważne/zastąpione usunięte z runu: `mutate-m07b2-q2-r2.txt`, `mutate-m07b2-q2-r3.txt` (bez `EXIT=`), `gate-test-full-r2.txt` (4× `EXIT=`, w tym 124).

**Bramki r4 (cargo z `CARGO_TARGET_DIR=/dev/shm/m07b2-r4-target`, `CARGO_INCREMENTAL=0`; każdy log ma jedną linię `EXIT=`):** `cargo fmt --check` EXIT=0 (`gate-fmt-r4.txt`); `cargo clippy --all-targets` EXIT=0, 0 ostrzeżeń (`gate-clippy-r4.txt`); `cargo test --test p6_m07b2_coast --test p6_m07b2_edges --test p6_m07b2_q2r4` EXIT=0, 2+3+2 (`gate-test-m07b2-r4.txt`); PEŁNY `cargo test --no-fail-fast` w JEDNYM przebiegu bez timeoutu: 1934 passed / 0 failed, EXIT=0 (`gate-test-full-r4.txt`; 1932 z r1 + 2 nowe testy). Weryfikator Python `verify_m07b2_q2.py`: 25592/25592, EXIT=0 (`verify-m07b2-q2-r4.txt`; NIE obejmuje wektorów q2r4 i nie jest niezależny od Operatora — niezależność NIE_ZMIERZONO), wyczerpujący model `corners_exhaustive_m07b2_q2.py` EXIT=0 (`corners-exhaustive-r4.txt`). `Cargo.lock` nieśledzony, NIE commitowany (N5).

**Ograniczenia / ZAŁOŻENIA r4:** (1) G12 ma tylko 3 wektory rozróżniające (wystarcza do zabicia, mutant ZABITY); (2) rozróżnienie cap 5999/6001 (G14b/c) w generatorze oparte na wynikach weba z jawnym centroidem(cap) równoważnym zmianie stałej — sprawdzone kontrolą `centroid(6000) == domyślny` w generatorze oraz faktycznym zabiciem mutantów Rust; (3) dowody EKWIWALENT są argumentami z kodu plus (dla E13–E35) pokryciem całej skończonej dziedziny wektorami weba; do oceny Evaluatora.

---

## Sekcja Q3 — temat R-RUSTPORT-P6-M07B3-RZEKI-B-TRASOWANIE-Q1 (runda 1/5, Operator)

Pin web: **`4bbef081d`** (origin/main), `gra/src/map/gen-helpers.ts`. Baza Rust: `origin/rust-port/parity-v2` @ `4dbd4cff4` (Q1, Q2 zamkniete). Zakres: 8 symboli (wiersze 7-10, 12-15).

### Diff pinu `edb8fb56` -> `4bbef081d` (przed portem)

`git diff edb8fb56 4bbef081d -- gra/src/map/gen-helpers.ts`: 24 dodan, 16 usuniec, 8 hunkow — wszystkie zamieniaja `queue.shift()` na indeks glowy kolejki (`queueHead++`) w BFS-ach: `estimateLandCentroidFromSeed` (:5992), `buildOceanReachableRiverHexKeys`, `bfsNearestRiverHexOnLowland`, `bfsLowlandRiverPath`, `maxDryLowlandPatchSize`, `fillDryLowlandPatches`, `findAllOversizedDryLandPatches`, `findLargestDryLowlandPatch`. **Zaden z 8 symboli Q3 nie jest zmieniony**; numeracja linii w zakresie 6233+ przesunieta o +1 (hunk :5992 dodaje 1 linie). Zmiana jest czysto wydajnosciowa (ta sama kolejnosc FIFO). Jedyna zalezna sciezka Q3 — domyslny centroid w `traceRiverFromCoast` -> `growRiverFromCoastInland` -> `estimateLandCentroidFromSeed` — jest pokryta wektorami z pinu `4bbef081d` (przypadki `trace` bez `landCentroid`/kwadratu; wynik rowny reuse Q2 `estimate_land_centroid_from_seed`). Linie web w tabelach nizej: pin `edb8fb56` (jak w tabeli glownej); w `4bbef081d` o 1 wiecej.

### Tabela symboli per status (Q3)

| # | Symbol | Linia web (`4bbef081d`) | Status | Rust (plik:linia) | Wektory (`fn`) |
|---|---|---|---|---|---|
| 7 | traceRiverFromCoast | 6234 | PORTOWANE-Q3 | `rivers_b/trace_coast.rs:30` `trace_river_from_coast` | `trace` 2000 + sweepy `trace`, `startd` |
| 8 | greedyRiverDrainToSea | 6277 | PORTOWANE-Q3 | `rivers_b/trace_coast.rs:116` `greedy_river_drain_to_sea` | `greedy` 1800+ + sweepy `greedy` |
| 9 | RiverAStarOpenHeap | 6342 | PORTOWANE-Q3 | `rivers_b/astar.rs:24` (`push`, `pop`, `len`, `as_slice`) | `heap` 350 (117 z remisami f; uklad tablicy po operacjach bit-w-bit) |
| 10 | aStarRiverToSea | 6388 | PORTOWANE-Q3 | `rivers_b/astar.rs:104` `a_star_river_to_sea` | `astar` 2000+75 + sweepy `astar` |
| 12 | injectRiverMeanders | 6527 | PORTOWANE-Q3 | `rivers_b/extend.rs:26` `inject_river_meanders` | `inject` 2000 + sweepy `inject` |
| 13 | extendRiverToMinimumLength | 6570 | PORTOWANE-Q3 | `rivers_b/extend.rs:82` `extend_river_to_minimum_length` | `extmin` 2000+ + sweepy `extmin`, `extcap` |
| 14 | extendRiverToWybrzeze | 6603 | PORTOWANE-Q3 | `rivers_b/extend.rs:126` `extend_river_to_wybrzeze` | `wyb` 1500+80 + korytarze |
| 15 | finishRiverMouthAtSea | 6648 | PORTOWANE-Q3 | `rivers_b/extend.rs:184` `finish_river_mouth_at_sea` | `fin` 1800+30 + korytarze |

Podsumowanie: **8/8 PORTOWANE-Q3, 0 NIE**. Pliki: `trace_coast.rs` 214 LOC, `astar.rs` 235 LOC, `extend.rs` 251 LOC (kazdy <= 600). `rivers_b.rs` rejestruje moduly `astar`, `extend`, `trace_coast`. Reuse bez duplikatow (sprawdzone `git grep` przed portem): `rivers_a/walk.rs` (`can_river_drain_step`, `is_river_drainage_goal`, `path_ends_at_sea`, `infer_map_dims_from_hexes`, `reconstruct_river_path`, `river_step_dir`, `same_river_dir`), `rivers_a/grow.rs` (`TraceRiverOpts`, `is_river_window_turn_allowed`, `GrowCandidate`), `rivers_a.rs` (`can_river_flow_through`, `sanitize_river_path`, `repair_river_path_adjacency`, `is_relief_terrain`, pola odleglosci), `rivers_b/coast_grow.rs` (`grow_river_from_coast_inland`), `rivers_b/meander.rs` (`find_river_meander_step`). **Zero zmian w `rivers_a/**`, `relief.rs`, `landsea.rs`, `coast.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`** (allowlista; widocznosc bez zmian).

### Artefakty (w repo, sciezki wzgledne od `rust-port/engine/`)

- Generator wektorow z URUCHOMIONEGO weba: `tests/p6_m07b3_vectors/gen_q3_vectors.mjs` (ziarno `0x5eed2029`, deterministyczny; dwukrotne uruchomienie daje ten sam plik). Zaleznosci wyciagane DOSLOWNIE z pinu po nazwie; profiler rzek (`RIVER_PROFILE_ON`, `rpNow`, `rpEnsure`) zastapiony atrapami (wylaczony, bez wplywu na wynik). Odtworzenie: `git show 4bbef081d:gra/src/map/gen-helpers.ts > $D/gen-helpers.ts`, `git show 4bbef081d:gra/src/types/hex.ts > $D/hex.ts` (w `mktemp -d`/`/dev/shm`, bez buildu w `gra/`), `node --experimental-strip-types tests/p6_m07b3_vectors/gen_q3_vectors.mjs $D/gen-helpers.ts $D/hex.ts tests/p6_m07b3_vectors/web-rivers-b-q3.json` (Node v22.22.0).
- Wektory: `tests/p6_m07b3_vectors/web-rivers-b-q3.json` (format `p6-m07b3-q3-v1`, 14 589 przypadkow, 89 map, 5 787 693 B <= 6 MB).
- Test zgodnosci: `tests/p6_m07b3_q3.rs` (2 testy: `q3_vectors_match_web` — wszystkie przypadki i sweepy; `q3_vectors_cover_branches_and_overlays` — progi pokrycia i nakladki).
- Weryfikator niezalezny OD ZERA (Python, z zrodla TS pinu, nie z Rust i nie z .mjs): `tests/p6_m07b3_vectors/verify_m07b3_q3.py` — 14 589/14 589 zgodne, `input_field_mismatch_maps: 0` (pola odleglosci/ocean z JSON rowne policzonym od zera). Zaleznosci Q2 (sanitize/repair/okno/meander/centroid) importowane z niezaleznego weryfikatora Q2 (`../p6_m07b2_vectors/verify_m07b2_q2.py`); kopiec, A*, greedy, inject, extend, wybrzeze, ujscie, trace (z kwadratem centrum), kwadrat centrum i punktacja kwadratu — zaimplementowane tu od zera.
- Mutacje: `tests/p6_m07b3_vectors/mutate_m07b3_q3.py` (205 mutantow; mutacje stosowane na KOPII roboczej w `/dev/shm`, nie w drzewie repo — przerwanie nie zostawia pustych plikow; `git status` po etapie czysty z wyjatkiem nowych artefaktow; kontrola sha256 po kazdym mutancie, `RESTORED=True`). Log: `runs/<ID>/mutate-m07b3-q3-r1.txt`.

### Pokrycie wektorow (stats z generatora; zgodnie z lekcjami a-e)

- (a) nakladki: kazda mapa ma las/zloze (kopalina)/rzeke na heksach wodnych (Morze, PlytkieMorze) i ladowych; asercje w `q3_vectors_cover_branches_and_overlays` (>100 nakladek na wodzie i ladzie, >20 zloz na wodzie, >20 rzek na ladzie). Typy map: `flat` (otwarta nizina), `split` (brzeg z ladem na krawedziach, jeziora srodladowe, wiele skladowych oceanu), `normal`, `hilly`, `rivers` (25% heksow z rzeka), korytarze (24), duza mapa 44x44.
- Perturbacje pol (galezie `?? Infinity`, `?? 999`, `?? 0`, brak w `oceanConnected`): `pt` {`orm` usuniete klucze openOceanDist, `srm` seaDist, `ocrm` oceanConnected, `dsea` seaDist dla openOcean >= 6, `csea` seaDist <= prog} w ok. 3500+ przypadkow A*/greedy/inject/extmin/wybrzeze/ujscie.
- Remisy kolejnosci kopca A*: 117 przypadkow `heap` z silnymi remisami f (f z {1,2,3}) + 233 zroznicowanych; porownanie WYNIKU KAZDEGO `pop` oraz UKLADU TABLICY kopca po sekwencji operacji bit-w-bit (`snap`); `less`/sift-up/sift-down portowane 1:1 (kopiec jest kodem gry, nie V8: kolejnosc remisow wynika wylacznie z algorytmu). A* dodatkowo: 400+ przypadkow `rand` = 0 (maksimum remisow) i mapy otwarte (`flat`).
- N-1/N/N+1 NA TYM SAMYM STARCIE (sweepy; test wymaga, by KAZDY sweep mial przejscie wyniku): `astar` 164 (maxLen 0..L+3; zero-rand i ziarno; w tym korytarze prostych tras dl. 1-12, ktore wymuszaja granice `curG >= maxLen` i kare 0.18 za krok prosty), `greedy` 94 (maxLen), `trace` 118 (growthCap), `startd` 70 (odleglosc ujscia od morza: brak/0/1/2/3/4/5 na tym samym ujsciu -> `startD > 2`), `inject` 78 (maxExtraSteps 0..10; w tym duza mapa: >= 8 wstawek w jednym przebiegu), `extmin` 138 (minLen 0..len+18; dlugie proste, zygzaki dajace wzrost 1/przebieg -> cap 12 przebiegow), `extcap` 100 (stepCap 0..len+16 przy minLen = len+14). Cap ogona ujscia: korytarze 24 map (lad dl. 1-12, woda od L+1; Plytkie/Morze) x {wybrzeze, ujscie z 2 i 1 hexa} = 72 przypadki wokol `RIVER_MOUTH_TAIL_LEN` = 5 oraz +2 = 7.
- Sciezki wejsciowe z lukami i powrotami (`jumpyPath`) dla inject/extmin (guardy sanitize/repair), sciezki puste/1-/2-elementowe, wejscia deepsea na duzych mapach.
- Statystyki (pole `stats` w JSON): astar 1162 tras + 838 `[start]`; greedy 980 niepustych + 820 pustych; trace 265 niepustych (84 z kwadratem centrum, 54 z perturbacja oceanu) + 1735 pustych; inject 87 wzrostow + 1913 bez zmiany; extmin 76 wzrostow + 1917 bez zmiany (+40 sciezek 2-elementowych); wyb 1396 wzrostow + 104; fin 1188 wzrostow + 612; sweepy N-1/N/N+1: 762 (kazdy z przejsciem wyniku).

### Mutacje (205) — wynik

Skrypt `mutate_m07b3_q3.py`, kazdy mutant = jedna podmiana (liczba wystapien `old` = 1, `--check` bez bledow). Wynik: **KILLED 164 (161 oczekiwanych K + 3 oczekiwane U), SURVIVED 41: 37 EKWIWALENT z dowodem, 4 LUKA udokumentowana (NIE_ZMIERZONO), 0 SURVIVED z oczekiwaniem K, 0 INVALID.** Historia: pierwszy przebieg dal 60 survivorow i 19 INVALID; przyczyny: (1) INVALID = SIGKILL kompilatora (pamiec, rownolegle shardy) — powtorzone pojedynczo, wszystkie sklasyfikowane; (2) luki wektorow zamkniete dopisaniem: sweepow `startd`, map `split`, korytarzy, perturbacji (`csea`, `dsea`, silnych), sciezek z lukami, len-2, duzej mapy, zagadniec `deepsea`; (3) etykiety E z r1 skorygowane (H01, X18, X19, W14: ZABITE). Pulapka procesu (zapisana): `cargo` uzywa mtime — kopia robocza kopiowana `copyfile` (nowy mtime), baseline sprawdzany przed kazdym przebiegiem (`BASELINE ZIELONY`), by nie uzyc zmutowanego artefaktu.

Wektory: 201 mutantow uruchomionych na v3 (sha256 `9456076c...0b76`, 14 419 przypadkow); A16, F06, G10 powtorzone na v5, W14 na v6 (`8aa5dba8...5ff4`, 14 589); v6 jest NADZBIOREM v3 (dopisane wylacznie na koncu strumienia losowego; prefiks 14 419 identyczny — sprawdzone), wiec zabicia na v3 obowiazuja. Final: test i weryfikator na v6.

Konstrukcje ZABITE (id): T01, T02, T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T15, T16, T17, T18, T20, T22, T23, T24, T25, G01, G02, G04, G05, G07, G08, G09, G10, G11, G12, G13, G16, G19, G20, G21, G23, G26, G27, G28, G29, H01, H02, H03, H04, H05, H06, H07, H08, H09, H10, H11, H12, H13, A01, A08, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A21, A22, A25, A26, A27, A28, A29, A31, A34, I01, I02, I03, I04, I05, I06, I07, I08, I09, I10, I11, I12, I13, I15, I16, I17, I18, I19, I20, I21, I22, I23, I24, I25, I27, X02, X03, X04, X05, X06, X07, X08, X09, X10, X11, X12, X13, X14, X15, X16, X17, X18, X19, X20, X21, X22, X24, X25, X26, X28, W01, W02, W03, W05, W06, W07, W08, W09, W10, W12, W13, W14, W15, W16, W18, W19, W20, W21, F01, F03, F04, F05, F06, F07, F08, F09, F10, F12, F14, F15, F16, F18, F20, F21, F22, F23, F24, F26.

Konstrukcje NIE zabite (tabela plik:linia, EKWIWALENT = dowod w kolumnie, LUKA = NIE_ZMIERZONO):

| ID | oczek. | Rust plik:linia | wynik | uwaga / dowod |
|---|---|---|---|---|
| T14 | E | trace_coast.rs:104 | SURVIVED | :6278 pathEndsAtSea bez wymiarow (ocean dany -> wymiary nieuzyte) [wymiary w pathEndsAtSea nieuzyte gdy oceanConnected podany] |
| T19 | E | trace_coast.rs:86 | SURVIVED | :6271 indeks sep = optymalizacja (rowny brute force) |
| T21 | E | trace_coast.rs:54 | SURVIVED | :6243 openOcean z oceanConnected [openOceanDist przekazany do growRiverFromCoastInland jest tam nieczytany] |
| G03 | E | trace_coast.rs:140 | SURVIVED | :6297 curOd == null: break -> continue (stan niezmienny: iteracja idempotentna) |
| G06 | L | trace_coast.rs:154 | SURVIVED | :6309 visited [visited: potrzebna petla >= 36 hex na plateau openOceanDist (okno skretu 6/+-1) - NIE_ZMIERZONO] |
| G14 | E | trace_coast.rs:179 | SURVIVED | :6316 > vs >= przy calkowitym od i polowkowym progu |
| G15 | E | trace_coast.rs:179 | SURVIVED | :6316 prog 0.5 vs 0 przy calkowitych od |
| G17 | E | trace_coast.rs:182 | SURVIVED | :6318 waga 12 -> 13 (kolejnosc ta sama: od dominuje, bonus < 12) |
| G18 | E | trace_coast.rs:182 | SURVIVED | :6318 jitter 0.35 -> 0.34 [jitter 0.35 vs 0.34: kolejnosc kandydatow ta sama (skala jittera < premia 1.8 i < 12)] |
| G22 | E | trace_coast.rs:194 | SURVIVED | :6323 brak kandydatow: break -> continue (brak wolan rand, stan niezmienny) |
| G24 | L | trace_coast.rs:204 | SURVIVED | :6327 visited po wyborze [visited po wyborze: jak G06] |
| G25 | L | trace_coast.rs:131 | SURVIVED | :6285 visited startu [visited startu: jak G06] |
| H14 | E | astar.rs:63 | SURVIVED | :6363 top/last: przypisanie rownowazne mem::replace |
| A02 | E | astar.rs:119 | SURVIVED | :6399 h0 [h0 tylko startowy f/bestH: poza petla nieuzywany (fallback po petli martwy)] |
| A03 | E | astar.rs:123 | SURVIVED | :6401 start w oceanie [start w oceanie: bez galezi start jest zdejmowany pierwszy i goal-check zwraca [start]] |
| A04 | E | astar.rs:137 | SURVIVED | :6411 seq startu [seq startu: start zdjety pierwszy, kolejnosc seq potomkow zachowana] |
| A05 | E | astar.rs:148 | SURVIVED | :6420 pomin wpisy spoza open [wpis spoza open: nieaktualny wpis ma f != fScore[k] (A06 go odrzuca); h = BFS openOceanDist jest spojna (koszt >= 1)] |
| A06 | E | astar.rs:152 | SURVIVED | :6422 pomin przestarzale f [f != fScore: nieaktualny wpis wychodzi z kopca PO nowszym (nizsze f), wezel jest wtedy zamkniety (A05)] |
| A07 | E | astar.rs:167 | SURVIVED | :6431 bestH < [bestK/bestH: fallback po petli martwy (kazdy zdjety wezel jest od razu sprawdzany jako cel)] |
| A09 | E | astar.rs:175 | SURVIVED | :6439 open.delete(current) [open.delete: spojna heurystyka - zamkniety wezel nie poprawia g; nieaktualne wpisy odrzuca test f] |
| A20 | L | astar.rs:205 | SURVIVED | :6454 jitter 0.12 [jitter 0.12 -> 0.13: roznica kosztu < 0.01 na krok prosty; wymaga prawie-remisu tras - NIE_ZMIERZONO] |
| A23 | E | astar.rs:209 | SURVIVED | :6456 tg > maxLen + 2 -> >= [tg > maxLen+2 nieosiagalne: curG < maxLen i koszt < 1.3] |
| A24 | E | astar.rs:209 | SURVIVED | :6456 tg > maxLen + 3 [tg > maxLen+3 nieosiagalne: curG < maxLen i koszt < 1.3] |
| A30 | E | astar.rs:228 | SURVIVED | :6471 bestK != startK (start nie jest celem, bo odpytany jako pierwszy) [bestK != startK: start zdjety pierwszy i nie jest celem (inaczej return)] |
| A32 | E | astar.rs:165 | SURVIVED | :6429 curH ?? Infinity [curH default wplywa tylko na bestH/bestK: fallback po petli martwy] |
| A33 | E | astar.rs:218 | SURVIVED | :6462 nf: openOcean ?? Infinity [wezel w oceanConnected bez openOceanDist nie jest nigdy wstawiany: rodzic bylby juz celem drenazu] |
| A35 | E | astar.rs:168 | SURVIVED | :6432 bestK [bestK: fallback po petli martwy] |
| I14 | E | extend.rs:55 | SURVIVED | :6551 rand() >= 0.34: mulberry32 daje wielokrotnosci 2^-32, 0.34 nie jest wielokrotnoscia |
| I26 | E | extend.rs:73 | SURVIVED | :6568 sourceKey [sourceKey w repair: path[0] zawsze odwiedzony, a cel d==1 omija canRiverFlowThrough] |
| X01 | E | extend.rs:90 | SURVIVED | :6578 length >= minLen -> > [length == minLen: petla while i tak sie nie wykonuje, wynik = path] |
| X23 | E | extend.rs:113 | SURVIVED | :6595 slice(mid + 1) [duplikat out[mid] usuwa sanitize_river_path (seen) przed repair - wynik ten sam] |
| X27 | E | extend.rs:93 | SURVIVED | :6579 srcKey [sourceKey w repair: jak I26] |
| W04 | E | extend.rs:139 | SURVIVED | :6613 brak heksu konca: break -> continue (stan niezmienny, iteracje idempotentne) |
| W11 | E | extend.rs:160 | SURVIVED | :6626 seaDist ?? 999 -> 998 [seaDist ?? 999 vs 998: stala przesuwa wszystkich kandydatow bez seaDist jednakowo (finitowe < 990)] |
| W17 | E | extend.rs:169 | SURVIVED | :6633 brak kandydata: break -> continue (stan niezmienny) |
| F02 | E | extend.rs:199 | SURVIVED | :6661 wczesny return: petla sprawdza mouthReady(cur) w 1. iteracji |
| F11 | E | extend.rs:230 | SURVIVED | :6682 wyjatek PlytkieMorze (flow) [canRiverFlowThrough dla PlytkieMorze zawsze true (nie Morze, nie relief)] |
| F13 | E | extend.rs:230 | SURVIVED | :6682 allowRelief: relief odrzucony wczesniej (:6677) |
| F17 | E | extend.rs:237 | SURVIVED | :6686 PlytkieMorze -15 -> -14: shallow o=0 vs land o>=1 (w obu wypadkach shallow wygrywa) |
| F19 | E | extend.rs:244 | SURVIVED | :6693 brak kandydata: break -> continue (stan niezmienny) |
| F25 | E | extend.rs:221 | SURVIVED | :6677 Morze wykluczone [Morze odrzucane i tak przez canRiverFlowThrough (false dla Morza)] |

Dowody ekwiwalencji (skrot; numeracja Rust, numery linii web w nawiasach):

- **Fallback po petli A\*** (A02, A07, A30, A32, A35; `astar.rs:228-233`, web :6471-6476): kazdy zdjety z kopca wezel jest od razu sprawdzany `is_river_drainage_goal` z tymi samymi argumentami (`astar.rs:171`), a `bestK` to zdjety wezel — gdyby byl celem, petla juz by zwrocila trase. Zatem po petli `is_river_drainage_goal(bestK)` jest zawsze falszem i wynik = `[start]`; `bestH/bestK/h0` nie wplywaja na wynik.
- **Spojna heurystyka** (A05, A06, A09): `h` = BFS `openOceanDist` (|h(a)-h(b)| <= 1 dla sasiadow), koszt kroku >= 1, wiec zamkniety wezel nigdy nie poprawia `g`; nieaktualny wpis ma `f` > `fScore[k]` i wychodzi z kopca PO nowszym (nizsze f), gdy wezel jest juz zamkniety. Kazdy z dwoch testow (`!open.contains`, `f != entry.0`) osobno odrzuca takie wpisy; `open.remove` nie zmienia wyniku, bo nieaktualne wpisy odrzuca test f.
- **A23/A24** (`astar.rs:209`): ekspansja tylko dla `curG < maxLen` (`astar.rs:176`), koszt kroku < 1.3 (`0.18 + rand()*0.12`, `rand()<1`), wiec `tg < maxLen + 1.3` i gałąź `tg > maxLen + 2` jest NIEOSIAGALNA (tak samo `+3`, `>=`).
- **A33** (`astar.rs:217`): wezel w `oceanConnected` bez wpisu w `openOceanDist` nie jest wstawiany, bo jego rodzic (sasiad wezla oceanu, przechodniego, bo nie-Morze) byl juz celem drenazu i funkcja zwrocila trase przy jego zdjeciu.
- **A03** (`astar.rs:123`): start w oceanie: bez galezi start jest zdjety pierwszy i `is_river_drainage_goal` (oc zawiera klucz) zwraca `reconstruct([start]) = [start]`. **A04**: `seq` startu — start zdjety przed jakimkolwiek potomkiem; kolejnosc seq potomkow zachowana.
- **T14** (`trace_coast.rs:104`): wymiary w `path_ends_at_sea` nieuzywane, gdy `ocean` podany (`rivers_a/walk.rs:110-116`). **T21** (`trace_coast.rs:54`): `openOceanDist` trafia do `grow_river_from_coast_inland` jako `_open_ocean_dist` — nieczytany (`coast_grow.rs:133`, web :6181). **T19**: indeks sep = optymalizacja; przypadki `ix` w wektorach (weryfikator Python liczy brute force i zgadza sie z webem z indeksem).
- **G03, G22, W04, W17, F19** (`break` -> `continue`): stan petli niezmieniony (brak push, brak wolan `rand()` gdy brak kandydatow/ heksu), kazda kolejna iteracja identyczna; koniec petli `for` daje ten sam wynik. **F02**: wczesny `return` powtarza sprawdzenie `mouth_ready(cur)` z 1. iteracji.
- **G14, G15** (`trace_coast.rs:179`): `od` i `curOd` calkowite — `od > curOd + 0.5` <=> `od >= curOd + 1` <=> `od > curOd`. **G17**: kandydaci maja `od <= curOd`; wagi 12 vs 13 nie zmieniaja kolejnosci (roznica poziomu >= 12 > jitter 0.35 + premia 1.8). **G18**: skala jittera 0.35 vs 0.34 jest monotoniczna, premia 1.8 > roznica jittera.
- **H14**: `d[0].clone(); d[0]=last` = `mem::replace`.
- **I14**: `rand()` z mulberry32 to wielokrotnosc 2^-32; 0.34 nie jest — `>=` vs `>` nierozroznialne.
- **I26, X27** (`sourceKey` w `repair_river_path_adjacency`): `path[0]` jest od poczatku odwiedzony (pomijany jako kandydat), a przypadek `d == 1` dopisuje cel BEZ `canRiverFlowThrough`; zrodlo jest sprawdzane tylko dla heksu-kandydata, ktorym nie moze byc `path[0]` ani (przed dopisaniem) `path[1]`.
- **X01**: `len == minLen`: petla `while out.len() < min_len` sie nie wykonuje, wynik = kopia `path`. **X23**: duplikat `out[mid]` usuwa `sanitize_river_path` (zbior `seen`) przed `repair`.
- **W11**: `seaDist ?? 999` vs 998 — stala przesuwa jednakowo wszystkich kandydatow bez `seaDist` (finitowe < 990). **F13**: `allowRelief` w `can_river_flow_through` nieobserwowalne, bo relief odrzucony wczesniej (`extend.rs:221`). **F11**: PlytkieMorze zawsze przechodnie (nie Morze, nie relief). **F25**: Morze odrzucane i tak przez `can_river_flow_through`. **F17**: `-15` vs `-14` — PlytkieMorze ma `od <= 8`, wiec `od-15 < 1 <= od_lad` w obu wersjach.
- **LUKI (NIE_ZMIERZONO)**: G06, G24, G25 (`visited` w greedy): powtorna wizyta wymaga petli zamknietej na plateau `openOceanDist` (kandydat musi miec `od == curOd`) z lagodnymi skretami; okno skretu (6 heksow, suma |delta| <= 1, kazdy skret <= 60 stopni) wymaga co najmniej ~30 heksow petli, a zjazd w dol (nizsze `od`) ma nizszy wynik — wektory nie zawieraja plateau >= 30 heksow wymuszajacego petle. A20 (jitter 0.12 -> 0.13): zmiana kosztu < 0.01 na krok prosty; rozroznienie wymaga prawie-remisu dwoch tras A* (np. prosta 12 krokow vs zygzak) — brak takiego wektora. Propozycja domkniecia: zaprojektowane mapy (plateau-pierscien z blokada w dol; para korytarzy prosty/zygzak).

### ZAŁOŻENIA

1. `maxLen`/`stepCap`/`minLen`/`max_len` w Rust to `usize` (web `number`), `maxExtraSteps` to `i64`; wartosci ulamkowe/ujemne NIE_ZMIERZONO (wektory: calkowite >= 0, `maxExtraSteps` takze ujemne). `Infinity` weba jako `i64::MAX` tylko w porownaniach `nd >= 2` (`can_river_drain_step`); wyniki punktacji (`score`) w `f64` z `f64::INFINITY` (bez zmiany kolejnosci porownan).
2. `rand` w `trace_river_from_coast` domyslnie `|| 0.0` (web `() => 0`); w pozostalych funkcjach `rand` jest argumentem (`&mut dyn FnMut() -> f64`).
3. Profiler `CIV_RIVER_PROFILE` (`aStarCalls`/`aStarMs`) NIE jest portowany (nie wplywa na wynik, jak w M07A); mapa `stepDir` weba jest tylko zapisywana — pominieta.
4. `extend_river_to_wybrzeze` i `finish_river_mouth_at_sea` MUTUJA przekazana sciezke (web: `path.push` + `return path`) — Rust `&mut Vec<RiverCoord>`, wynik = zmieniona sciezka; generator sprawdza tozsamosc referencji (`out === arr`).
5. **Web rzuca `TypeError` tam, gdzie Rust panikuje** (`extend_river_to_minimum_length`, gdy po `sanitize/repair` trasa wewnatrz petli skroci sie do < 2 heksow: web `out[mid]` -> `undefined` -> `findRiverMeanderStep` czyta `.q`; Rust: indeks poza zakresem). 7 takich przypadkow wejsc z lukami wykluczono z wektorow (`extmin_web_throws`); dla wejsc prawidlowych (sasiedzi, bez powtorzen) sytuacja nie wystepuje.
6. `is_river_window_turn_allowed` ma precondycje niepustej trasy (jak web: TypeError przy pustej); w `greedy_river_drain_to_sea` trasa zawsze zawiera start.
7. `landCentroid` w Rust to `Option<(f64, f64)>` (web `{q,r}|null`); `landCenterSquare` — `Option<&ContinentCenterSquare>`; kwadrat w wektorach budowany z weba `continentCenterSquare(hexes, wszystkieKlucze, rozmiar 3..7)` i w Rust przez `continent_center_square` (M05; to zamyka ZALOZENIE Q2 nr 1 dla sciezki `traceRiverFromCoast`: 84+ przypadkow z niepustym wynikiem i kwadratem).
8. Wymiary mapy w testach prostokatne `[0,W) x [0,H)` (krawedz = ocean) — `oceanConnectedWaterKeys` zalezy od wymiarow; tryby `trace`: 0 domyslne, 1 pola jawne, 2 oceanConnected pomniejszony (open liczony z niego), 3 tylko `mapWidth`, 4 jawne wymiary (inne niz mapa) bez pol.
9. serde_json: wyniki to calkowite — brak problemu 1 ulp z Q2 (wektory nie zawieraja ulamkow; wejscia f kopca maja <= 2 miejsca po przecinku).

### Bramki (worktree `wf_ae47afd3-f36-1`, `CARGO_TARGET_DIR=/dev/shm/m07b3-q3-target`, `CARGO_INCREMENTAL=0`, debug off; kazdy log ma JEDNA linie `EXIT=`, bez pustej linii przed nia)

- `cargo fmt --check`: EXIT=0 (`gate-fmt-r1.txt`).
- `cargo clippy --all-targets`: 0 ostrzezen, EXIT=0 (`gate-clippy-r1.txt`).
- `cargo test --test p6_m07b3_q3 --test p6_m07b_turn --test p6_m07b2_coast --test p6_m07b2_edges --test p6_m07b2_q2r4`: 2+2+2+3+2 OK, EXIT=0 (`gate-test-m07b3-r1.txt`).
- PELNY `cargo test --no-fail-fast` w jednym przebiegu bez timeoutu: 1949 passed / 0 failed, EXIT=0 (`gate-test-full-r1.txt`; baza przed tematem NIE_ZMIERZONO osobnym uruchomieniem — Q2 r4 podawal 1934; w Q3 doszly 2 testy).
- Weryfikator Python: 14 589/14 589 zgodne, EXIT=0 (`verify-m07b3-q3-r1.txt`).
- Mutacje: 205 mutantow (patrz wyzej), `mutate-m07b3-q3-r1.txt` EXIT=0 (brak SURVIVED z oczekiwaniem K i brak INVALID).
- `git diff --check`: czysty przed kazdym commitem.
- `Cargo.lock` w `rust-port/engine/` nieslediony, NIE commitowany. Target usuniety po etapie.
