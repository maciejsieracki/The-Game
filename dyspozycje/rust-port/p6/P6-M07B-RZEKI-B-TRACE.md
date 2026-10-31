# P6-M07B — rzeki część B (trace) — dossier

Temat: R-RUSTPORT-P6-M07B-RZEKI-B-TRACE-Q1. Pin web: `edb8fb56`, źródło `gra/src/map/gen-helpers.ts` (zakres 6069–7249).
Baza Rust: `rust-port/parity-v2` @ `2f35f68bc` (M07A zamknięte w `rivers_a/`).
Stan na koniec rundy 1/5: **zakres NIEDOMKNIĘTY** — zrobiona partia 1 (geometria okna skrętu).

## Tabela statusu per symbol

Status: PORTOWANE (kod + wektory web + weryfikator Python + mutanty), REUSE (już w `rivers_a`, bez zmiany),
NIE (do portu w kolejnych partiach). Linie = pin `edb8fb56`.

| Symbol | Linia web | Status | Rust / uwagi |
|---|---|---|---|
| riverGrowStepPassesSep | 6070 | REUSE | `rivers_a/grow.rs` `river_grow_step_passes_sep` (oznaczone jako przeniesione) |
| CoastInlandGrowOpts (typ) | 6081 | NIE | parametry funkcji, port w partii 2 |
| collectCoastInlandGrowCandidates | 6098 | NIE | partia 2 |
| InlandDrainGrowOpts (typ) | 6129 | REUSE | parametry `rivers_a/grow.rs` (bez osobnego typu) |
| collectInlandDrainGrowCandidates | 6148 | REUSE | `rivers_a/grow.rs` `collect_inland_drain_grow_candidates` (:306, poza zakresem M07A, jednak już w rivers_a) |
| growRiverFromCoastInland | 6181 | NIE | partia 2 |
| traceRiverFromCoast | 6233 | NIE | partia 3 |
| greedyRiverDrainToSea | 6276 | NIE | partia 3 |
| RiverAStarOpenHeap (klasa) | 6341 | NIE | partia 3 (kolejność heap: f, seq) |
| aStarRiverToSea | 6387 | NIE | partia 3; `rivers_a/profile.rs` ma tylko etykiety profilera, nie funkcję |
| findRiverMeanderStep | 6485 | NIE | partia 2 |
| injectRiverMeanders | 6526 | NIE | partia 3 |
| extendRiverToMinimumLength | 6569 | NIE | partia 3 |
| extendRiverToWybrzeze | 6602 | NIE | partia 3 |
| finishRiverMouthAtSea | 6647 | NIE | partia 3 |
| traceRiver (export) | 6707 | NIE | partia 4 (105 LOC, największa funkcja zakresu) |
| traceRiverForGridFill | 6821 | NIE | partia 4 |
| isRiverLandTerrain | 6854 | REUSE | `rivers_a.rs` `is_river_land_terrain` (:120, pub(crate)) |
| collectFoothillRiverSources | 6866 | NIE | partia 4 |
| collectPlainSpringSources | 6899 | NIE | partia 4 |
| collectRiverSources | 6925 | NIE | partia 4 |
| capRiverQuotas | 6942 | NIE | partia 4 (cap: wektory N-1/N/N+1) |
| pickSpreadRiverSources | 6959 | NIE | partia 4 |
| neighborDirIndex | 6988 | REUSE | `rivers_a/grow.rs` `neighbor_dir_index` (:40) |
| RIVER_TURN_WINDOW_HEX | 6999 | REUSE | `rivers_a/grow.rs` (:24) |
| RIVER_TURN_WINDOW_MAX_SUM | 7000 | REUSE | `rivers_a/grow.rs` (:26) |
| signedRiverDirDelta | 7003 | REUSE | `rivers_a/grow.rs` `signed_river_dir_delta` (:52) |
| pathSegmentDirs | 7008 | REUSE | `rivers_a/grow.rs` `path_segment_dirs` (:62) |
| pathSignedTurnDeltas | 7017 | REUSE | `rivers_a/grow.rs` `path_signed_turn_deltas` (:74) |
| isRiverWindowTurnAllowed | 7026 | REUSE | `rivers_a/grow.rs` `is_river_window_turn_allowed` (:83) |
| riverSegmentUnitVector | 7051 | PORTOWANE (P1) | `rivers_b/turn.rs` `river_segment_unit_vector` |
| riverPathHasSharpUTurn | 7064 | PORTOWANE (P1) | `rivers_b/turn.rs` `river_path_has_sharp_u_turn` |
| riverPathViolatesTurnWindow | 7075 | PORTOWANE (P1) | `rivers_b/turn.rs` `river_path_violates_turn_window` |
| sanitizeRiverTurnWindow | 7094 | NIE | partia 2 (używa sanitizeRiverPath z rivers_a) |
| canReceiveRiverYieldMark | 7122 | NIE | partia 2 |
| markRiverEdge | 7127 | NIE | partia 2 |
| markRiverEdgePair | 7137 | NIE | partia 2 |
| riverHexCornerStep | 7146 | NIE | partia 2 |
| walkRiverHexPerimeter | 7150 | NIE | partia 2 |
| riverCornersAlongHexEdges | 7166 | NIE | partia 2 |
| riverEdgeBetweenCorners | 7195 | NIE | partia 2 |
| riverTransitEdgeIndices | 7202 | NIE | partia 2 |
| simplifyRiverRenderPath | 7214 | NIE | partia 2 |
| markRiverTransitEdgesOnPath | 7232 | NIE | partia 2 |

Podsumowanie (44 wiersze tabeli, funkcje i typy razem): PORTOWANE 3 (P1), REUSE 11, NIE 30. Partie 2–4 do wykonania w kolejnych rundach lub nowych tematach.

## Partia 1 (ta runda): `rivers_b/turn.rs`

- Kod: `rust-port/engine/src/domain/mapgen/rivers_b/turn.rs` (~70 LOC), rejestracja `pub mod turn;` w `rivers_b.rs`.
- Wektory z URUCHOMIONEGO weba: `rust-port/engine/tests/p6_m07b_vectors/web-rivers-b-turn.json` (2,26 MB, 22187 przypadków:
  unit 409, uturn 4750 (3204 true), viol 17028 (11074 true)). Generator: funkcje wyciągnięte dosłownie z kopii
  `gra/src/map/gen-helpers.ts@edb8fb56` i uruchomione pod `node --experimental-strip-types` (Node v22.22.0).
  Generator nie jest w repo (skrypt scratch); zawartość JSON jest jego jedynym wynikiem.
- Pokrycie wektorów: losowe chody (długości 0–16, tryby prosty/zwrotny/jednostajny, 40 na długość i tryb),
  chody skokowe (2000 przypadków, sąsiedzi niesąsiedzi), linie proste 0–12 we wszystkich 6 kierunkach,
  zygzaki i skręty jednakowego znaku dla długości 4–8 (granice okna 6: N-1/N/N+1 po deltach),
  warianty parametrów `windowHex` 4–8 i `maxSum` 0–2. Heksy wodne/lądowe, nakładki (las/rzeka/złoże):
  N/A — funkcje operują wyłącznie na geometrii ścieżki, bez wejścia terenowego.
- Testy: `rust-port/engine/tests/p6_m07b_turn.rs` (2 testy: zgodność wszystkich wektorów; obecność obu wyników).
  `cargo test --test p6_m07b_turn`: 2/2 OK.
- ZAŁOŻENIE (hypot): Rust używa `f64::hypot` zamiast `Math.hypot`. Ten sam wejściowy `dx,dy` daje w V8 różne
  wartości 1-ulp zależnie od tieru JIT (interpretowany vs zoptymalizowany). Wektory `x,y` porównywane z tolerancją 1e-12;
  wyniki logiczne (dot < -0.01, długości) porównywane dokładnie. Maksymalny błąd w wektorach: 2,2e-16 (weryfikator Python).
- Weryfikator niezależny od zera (Python, bez Rusta): `rust-port/engine/tests/p6_m07b_vectors/verify_m07b_turn.py`
  — 22187/22187 przypadków zgodnych, statystyki zgodne. Pokrywa WSZYSTKIE 3 funkcje partii 1 (nie całą strefę).
- Mutanty (`mutate-m07b-turn-r1.txt`): 12 mutantów na gałęziach sterujących `turn.rs`; 9 wykrytych (KILLED).
  Pozostałe 3 — równoważne, uzasadnienie:
  - M1 (`< -0.01` → `<= -0.01`): wartość dot = -0.01 dokładnie nie jest osiągalna z wektorów jednostkowych
    o kątach wielokrotności 60° (dot ∈ {±1, ±0.5, 0}) — granica nieosiągalna w zakresie wejść.
  - M3 (`path.len() < 3` → `< 2` w `river_path_has_sharp_u_turn`): dla długości 2 pętla `0..len-2` jest pusta, wynik ten sam.
  - M5 (`path.len() < 3` → `< 2` w `river_path_violates_turn_window`): dla długości 2 `deltas` jest puste, wynik ten sam.
- Brak sortowań i komparatorów w partii 1 (lekcja h: N/A).
- Limity: plik wektorów 2,26 MB ≤ 6 MB (lekcja e). Brak pustych linii na końcu plików (lekcja g — do sprawdzenia `git diff --check`).

## Bramki (runda 1)

- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r1.txt`).
- `cargo clippy --test p6_m07b_turn`: 0 ostrzeżeń, EXIT=0 (`gate-clippy-r1.txt`).
- `cargo test` (pełny zestaw silnika): 1887 passed, 0 failed, EXIT=0 (`gate-test-full-r1.txt`; poprzednio 1885 + 2 nowe).
- Weryfikator Python: EXIT=0 (`verify-m07b-turn-r1.txt`). Mutanty: 9/12 KILLED, 3 równoważne (`mutate-m07b-turn-r1.txt`).
- Target Cargo: `/dev/shm/m07b-target` (do usunięcia po etapie).

## Zakres niedomknięty i plan

Partie 2–4 (sanityzacja okna, markery krawędzi/tranzytu, meander, drenaż A*, trace, źródła, cap) — NIE wykonane.
Wymagane przed READY: wektory z pinu dla każdej partii, cap N-1/N/N+1 na mapach rozróżniających cap,
mutanty na każdej gałęzi, weryfikator Python dla całego zakresu, dossier per symbol (ten plik).
Dla każdej następnej partii: nowy plik `rivers_b/<nazwa>.rs` (≤600 LOC), wektory `web-rivers-b-<nazwa>.json`.
