# 03 — Final Control r1 — R-RUSTPORT-P4-1B-Q1-ROADMASK

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q1-ROADMASK
GOAL: `ROAD_DIRS` + `compute_road_mask` w silniku jako port 1:1 pinu `07d2fbd72` `gra/src/map/road-network.ts:32-34`, `:75-86`, z wektorami pinu.
ZMIANY/COMMIT: weryfikowany kod = `a389c361c` (Obrona r1) nad `fc26b270c` / `8b16792ae` (Operator r1); baza `1b8b67173` jest przodkiem (`git merge-base --is-ancestor` OK). Ten raport = commit FC na lokalnej gałęzi `rust-port-wip/R-RUSTPORT-P4-1B-Q1-ROADMASK-fc-r1` (SHA w odpowiedzi FC).
TESTY: patrz niżej (uruchomione samodzielnie przez FC).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` (uwaga: parity przesunęła się do `83f5fd654`, baza tematu `1b8b67173` — orkiestrator robi merge-tree / rebase).
DEPLOY/PUSH: NIE WYKONANO.

## Allowlista (samodzielnie, `git diff --stat 1b8b67173 a389c361c`)
- `rust-port/engine/src/domain/road_network.rs` (nowy, 39 linii)
- `rust-port/engine/src/domain/mod.rs` (+1: `pub mod road_network;`)
- `rust-port/engine/tests/p4_1b_road_mask.rs` (nowy)
- `rust-port/engine/tests/p4_1b_road_mask_vectors/{gen.mjs,vectors.json}` (nowe)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q1-ROADMASK/{01-operator-r1.md,02a-obrona.md}`
Wszystko w allowliście. `Cargo.lock` nie zacommitowany. `git diff --check` czysty. `gra/` nietknięte.
(`02-evaluator.md` żyje na gałęzi Evaluatora `023de9406`, nie na linii Obrony — do dołączenia przy integracji, jeśli orkiestrator chce komplet raportów.)

## Zgodność z pinem (odczyt `git show 07d2fbd72:gra/src/map/road-network.ts`)
- `ROAD_DIRS` = `[+1,0],[+1,-1],[0,-1],[-1,0],[-1,+1],[0,+1]` — Rust identycznie.
- `computeRoadMask`: pętla po kierunkach, `mask |= roadDirBit(i)` gdy `hasRoadAt(q+dq, r+dr)` — Rust identycznie (`1 << i`).
- `main.ts:3144-3147` `hexHasRoadAt`: brak heksa = false — po stronie wołającego, poprawnie poza silnikiem.

## Bramki (rust-port/engine, CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR poza repo — usunięty)
| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_1b_road_mask` | EXIT 0 — 8 passed, 0 failed, 0 ignored |
| `cargo test --lib` | EXIT 0 — 119 passed, 0 ignored |
| `node .../gen.mjs --check` (Node v22.23.4) | EXIT 0, wektory zgodne, SHA strażników :32-34, :75-86, :170-182 bez zmian |

Mutacja FC (własna, inna niż Operatora/Evaluatora): zamiana kierunków 4 i 5 w `ROAD_DIRS` w `road_network.rs` → 5 FAIL (`compute_road_mask_matches_pin_vectors`, `map_edge_masks_have_out_of_map_bits_cleared`, `road_dirs_match_pin_and_hex_directions`, `refresh_vectors_agree_with_mask_bit_order`, `vectors_detect_swapped_direction_order_mutant`). Plik przywrócony (`git checkout`), drzewo czyste.
Brak `#[ignore]`. Pełnego `cargo test` całego crate nie uruchomiono (NIE_ZMIERZONO; poza bramkami dispatchu).

## Orzeczenia zarzutów
| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 0 | Podsumowanie Evaluatora (bramki zielone) | ODDAL | Nie jest zarzutem; potwierdzone samodzielnie. |
| 1 | Mylący komentarz o „obciętych bitach” | ODDAL (usunięte w Obronie) | Komentarz poprawiony; dodany jawny test `map_edge_masks_have_out_of_map_bits_cleared`, zielony i czuły na mutację FC. |
| 2 | Reguła „sąsiad poza mapą = brak drogi” tylko w teście/gen | ODDAL | Pin trzyma ją w predykacie wołającego (`main.ts:3144-3147`), nie w `computeRoadMask`; port 1:1 zachowuje ten podział. Przekazanie do Q3: producent HexDynDto — predykat „brak heksa = false” + test brzegu na prawdziwym modelu mapy (NIE_ZMIERZONO do Q3). |
| 3 | Mutant zdefiniowany w teście | ODDAL (usunięte w Obronie) | Test przemianowany i opisany jako dowód czułości wektorów; czułość implementacji potwierdzona mutacją produkcyjną (Operator ×2, Evaluator ×1, FC ×1). |
| 4 | Brak minimalnej wersji Node w gen.mjs | ODDAL (usunięte w Obronie) | Nagłówek: Node ≥ 22.18.0 / ≥ 23.6.0 + strażnik EXIT 2. Gałąź „za stary Node” NIE_ZMIERZONO (brak starszego Node). |
| 5 | `road_hexes_to_refresh` nieprzeniesione; brak wołającego | ODDAL | Dispatch: port opcjonalny; kryterium 4 każe zapisać brak wołającego jako NIE_ZMIERZONO (wołający w Q3). |

Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA. Werdykt: PASS-WITH-NOTES (noty = przekazania do Q3: predykat brzegu + test na modelu mapy, ewentualny port `road_hexes_to_refresh`, wołający produkcyjny).
