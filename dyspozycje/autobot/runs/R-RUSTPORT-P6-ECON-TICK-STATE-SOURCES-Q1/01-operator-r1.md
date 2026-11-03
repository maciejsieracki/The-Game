STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1
GOAL: źródła stanu `run_economy_tick_for_game` (ownerCivMap, orderMultMap, ownerDefaultPodzial*, etykiety aktywne, natywny dostęp do surowców + grant z trasy) 1:1 z webem (pin `4bbef081d`), baza `a262bd553`.

ZMIANY/COMMIT: WIP `49309e3be`; commit końcowy (poprawka clippy `map_entry` w `_civ`, doc, logi, ten raport) = HEAD gałęzi worktree, SHA w odpowiedzi.
* NOWE: `domain/turn_economy_inputs_{civ,podzial,native}.rs`, `tests/p6_state_src.rs`, `tests/p6_state_src_vectors/state_src.json` (4,8 MB), `dyspozycje/rust-port/p6/P6-ECON-TICK-STATE-SOURCES.md`, generator/weryfikator/mutacje w katalogu runu.
* ISTNIEJĄCE (jawna pozycja z diffem): `domain/mod.rs` +3 linie `pub mod`. `turn_economy_wire.rs`, `trade*.rs`, `resource_access*`, `okolica*`, `improvements.rs`, `gra/**` NIETKNIĘTE (pola kontekstu już były closure; źródła podpina `StateSources`).

TABELA (doc sek. 1, 100%): zaportowane 8 (civ-map, podział Handlu, podział Pracy, `placedImprovementsForOwner`, etykiety aktywne, natywny dostęp 5 kluczy, wywołanie grantów, zło­to natywne OR grant), istniały 2 (`computeEmpireLivestockUnlocks`, no-op `placed_improvements_with_zloto_trade_grant`), ZAŁOŻENIE 1 (stan fortów), DŁUG 1 z dowodem: `orderMultMap` — produkt pętli porządku `main.ts:35400-35800` (econTick, citizenUpkeepDrain, rng buntu, mieszanki kultury/religii; w Rust brak `order_effects_with_civ_matrix`, `citizen_upkeep_drain`, `law_garrison`). Proponowany osobny temat `...ECON-TICK-ORDER-LANE-Q1`. Dług Q6 sek. 9 (natywny złoto / grant z trasy) DOMKNIĘTY.

ZNALEZISKO 1:1: web `ownerHasNativeResourceAccess(.,'zelazo')` jest ZAWSZE false (`main.ts:5107` przekazuje `boolean` jako `empireStock` do `hasZelazoAccess`, `zelazo-access.ts` traktuje to jak brak zapasu). Port odtwarza literalnie; do decyzji właściciela, czy poprawiać web.

TESTY:
* `cargo test --test p6_state_src` 4/4: 260 scenariuszy (placed per owner, 5 kluczy natywnych, granty, złoto NT, etykiety), 120 civ, 80 podział, z URUCHOMIONEGO weba (funkcje modułowe z pinu; sklejka `main.ts` przepisana z numerami linii, Z-SS-8).
* e2e: tick `run_economy_tick_for_game` ze źródłami Rust == tick z wejściami policzonymi przez web (dowód składany z Q6 bit-w-bit, Z-SS-9); kontrola negatywna (odwrócony dostęp do złota zmienia wynik).
* Weryfikator `python3 -I`: 9684 sprawdzeń, 0 rozbieżności, kontrola negatywna 2/2.
* Mutacje: 36, zabitych 32, równoważnych 4 z dowodem plik:linia (doc sek. 6); brutto 88,9%, netto 100%.
* Bramki: fmt EXIT=0, clippy `-D warnings` EXIT=0, pełny `cargo test -j 2` w 8 shardach 2072 passed / 0 failed (baza 2068 + 4), po ostatniej zmianie kodu. `git diff --check` czyste.

BLOKADY: brak. NIE_ZMIERZONO: PRZED w tym samym worktree (przyjęto bazę 2068/0 z dispatchu); brak jednego przebiegu weba przez cały `main.ts` (wymaga DOM) — zastąpione dowodem składanym.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator R1 (sprawdzić: zgodność przepisanej sklejki generatora z `main.ts:5030-5184`, `:3234-3258`, `:34435-34440`, założenia Z-SS-1..9, uzasadnienie 4 mutantów równoważnych, decyzja o długu `orderMultMap`).

DEPLOY/PUSH: NIE WYKONANO
