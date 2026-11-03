STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1
GOAL: `orderMultMap` (pętla porządku `main.ts:35358-35789`, pin `4bbef081d`) liczony w Rust 1:1 z webem i podpięty jako źródło stanu `run_economy_tick_for_game`; baza `40c358d6f`.

ZMIANY/COMMIT: (SHA w odpowiedzi orkiestratora; ostatni commit gałęzi worktree)
* NOWE: `domain/order_effects_culture.rs`, `domain/order_effects_lane.rs`, `tests/p6_order_lane.rs`, `tests/p6_order_lane_vectors/order_lane.json` (5,6 MB), `dyspozycje/rust-port/p6/P6-ECON-TICK-ORDER-LANE.md`, generator/weryfikator/mutacje/gate-* w katalogu runu.
* ISTNIEJĄCE (jawna pozycja): `domain/mod.rs` +2 `pub mod`; `turn_economy_inputs_native.rs` +metoda `StateSources::order_mult_map` (addytywnie). Reszta bez zmian (`trade*`, `turn_economy_wire`, `mapgen`, `gra/**` nietknięte). Poza allowlistą: brak. `Cargo.lock` nieśledzony artefakt buildu (nie commitowany).

TABELA (doc sek. 1): zaportowane 15 grup (kultura/religia/presja, civ-matrix efekty, post-capture-law, garnizon prawa, wojna, pętla, hak StateSources), istniały 9 grup (m.in. `compute_citizen_resource_drain` — tabela STATE-SOURCES błędnie sugerowała brak), wejścia wołającego 2 (Z-OL-4), pominięte UI 1.

ZNALEZISKO 1:1: `makeRng` z `culture-religion.ts:974` ≠ `Mulberry32::new` (`civ-roster`): ziarno 0 → stan 1. Tabela macierzy w pinie ma WSZYSTKIE parametry porządku/kultury/religii = 0 (wektory z łatką macierzy, Z-OL-8).

TESTY: `cargo test --test p6_order_lane` 10/10 (+1 ignored): 750 scenariuszy pętli bit-w-bit z URUCHOMIONEGO weba (58 buntów z seeded RNG, 6 rebelii, drenaż obywateli, presja, spread, post-capture); funkcje czyste (RNG, efekty, kultura, religia, presja, wojna, garnizon); e2e 80 światów: stan → tick 1 Rust → porządek (przez `StateSources::order_mult_map`) → `orderMultMap` == web → tick 2 Rust(mapa Rust) == tick 2 (mapa weba), kontrola negatywna (pusta mapa zmienia tick). Weryfikator `python3 -I` 16 501 sprawdzeń / 0 rozbieżności, kontrola negatywna 2/2. Mutacje 69: zabite 62 (brutto 89,9%), 6 równoważnych z dowodem plik:linia (doc sek. 3), 1 luka [68] → netto 98,4%. fmt EXIT=0, clippy `-D warnings` EXIT=0, pełny `cargo test -j 2` w 8 shardach 2082/0 (baza 2072/0 + 10) po ostatniej zmianie kodu. `git diff --check` czyste. PRZED w tym samym worktree: NIE_ZMIERZONO (przyjęto bazę z dispatchu).

BLOKADY: brak. Brutto mutacji 89,9% < 90% o 1 mutant (6 ekwiwalentów udowodnionych; luka [68] opisana, niski wpływ: tylko mnożnik ryzyka podboju).

RUNDY: 1/5

NASTĘPNY KROK: Evaluator R1 (sprawdzić: zgodność przepisanej sklejki `runLane` z `main.ts:35358-35789`, założenia Z-OL-1..9, 6 mutantów równoważnych, łatka macierzy, luka [68]); -Q2: wektor ukierunkowany [68] + wiązanie wejść Z-OL-4.

DEPLOY/PUSH: NIE WYKONANO
