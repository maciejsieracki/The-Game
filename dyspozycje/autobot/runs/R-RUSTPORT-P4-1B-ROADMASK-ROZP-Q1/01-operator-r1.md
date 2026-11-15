# 01 — Operator r1 · R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (DTO renderera, rozpoznanie tylko do odczytu)
TEMAT: R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1
GOAL: ustalić, co trzeba przenieść z webu (pin `07d2fbd72`) do Rust przed producentem `MapViewDto` (P4-1B / #211): `computeRoadMask`, `trimMediumRenderPathAtMain`/`trimMediumTailAlongMain`, `river_render_paths`; D-DTO-4 = A.
ZMIANY/COMMIT: baza `f7baa3848` (gałąź robocza wyzerowana na bazę dispatchu). Nowe pliki wyłącznie z allowlisty:
- `dyspozycje/rust-port/p4/P4-1B-ROADMASK-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1/01-operator-r1.md` (ten raport)
Zero zmian kodu. SHA: w wiadomości commita / odpowiedzi Operatora (commit zawiera ten plik, więc nie może podać własnego SHA).
TESTY: nie dotyczy (zero kodu, bez `cargo`). Wykonane pomiary odczytu:
- `git grep` na pinie `07d2fbd72` (`computeRoadMask`, `trim…`, `roadMask`, `riverPaths`, `riverPathKinds`, `hexHasRoad`, `terenBazowy =`);
- porównanie treści 11 funkcji rzek między pinem portu `edb8fb56` a `07d2fbd72` (`md5sum` ciała funkcji) — wszystkie identyczne;
- `grep` w `rust-port/` na bazie: `compute_road_mask` → 0, `trim_medium` → 0, `river` w `view-model/src/validate.rs` → 0.
BLOKADY: brak dla rozpoznania. Dla wdrożenia Q3: brak jednego modelu mapy rozgrywki w Rust z kompletem pól (teren 8 wariantów + rzeki z rodzajami + ulepszenia) — `PlayableMap` go nie ma, pełny jest tylko `SnapshotMap`; wymaga decyzji technicznej orkiestratora (dokument §2, §4 pkt 5).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 — weryfikacja tabeli §1 (plik:linia pinu i Rust), listy wejść §2 i podziału §3 (Q1 ROADMASK, Q2 RIVER-TRIM równolegle, Q3 MAP-VIEW-PRODUCER po nich).
DEPLOY/PUSH: NIE WYKONANO

## Najważniejsze ustalenia
1. `computeRoadMask` (`map/road-network.ts:75-86`) — BRAK w silniku; reguła `hexHasRoad` jest (`engine/src/domain/roads.rs:46`, `improvement_build.rs:1001`). Kolejność bitów = `HEX_DIRECTIONS` (`mapgen/prims.rs:32`) = renderer `droga.rs:21-29`.
2. `trimMediumRenderPathAtMain` (`gen-helpers.ts:8194-8203`) i `trimMediumTailAlongMain` (`:7623-7634`) — BRAK w Rust; `rivers_c.rs` to pusty szkielet.
3. `landRiverRenderPath` / `mediumRiverRenderPath` i pomocnicze — są (`mapgen/rivers_a.rs:397`, `:436`), z wektorami (`engine/tests/p6_m07a_rivers_a.rs:213`, `:223`); ciała identyczne na obu pinach.
4. `MapViewDto.river_render_paths` potrzebuje niezmiennika `len == rivers.len()` (indeks ↔ `rivers[i]`); walidacja go nie sprawdza.
5. Lista NIE_ZMIERZONO: dokument §4 (6 pozycji).
