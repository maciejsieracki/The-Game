# R-RUSTPORT-P4-364-AWAITING-SEAT-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-AWAITING-SEAT-R1
GOAL: `awaiting_first_city(state, owner)` odpowiada webowi (`isAwaitingFirstPlayerCity(ownerId)`, pin `07d2fbd72` `main.ts:12882-12884`) dla KAŻDEGO fotela; stan per właściciel w `PlayableState`.
ZMIANY/COMMIT: oceniany stan `96608f24c` (obrona) nad `4a3ad4988` (Evaluator) nad `f628f1f40` (kod Operatora); baza `326fd5545` zgodna z dispatchem (`merge-base --is-ancestor` OK). FC nie zmienia kodu; dodaje tylko ten raport (gałąź `rust-port-wip/p4-364-awaiting-seat-r1-fc`).
TESTY: odtworzone samodzielnie, §Bramki.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` (FF/merge `96608f24c` + ten raport) + wpis D-AS-2/D-AS-3 w `REJESTR-RUST.md`.
DEPLOY/PUSH: NIE WYKONANO

## Allowlista (zweryfikowana: `git diff --stat 326fd5545 96608f24c`)
`rust-port/engine/src/domain/playable.rs`, `overlays_view.rs`, `dto_bridge.rs` (tylko komentarz modułu D-BR-1, API bez zmian), `rust-port/engine/tests/p4_364_awaiting_seat.rs` (nowy), 3 raporty w katalogu runs. Renderer, view-model, `Cargo.lock`, kontrakt JSON mostu: nietknięte. `git diff --check`: czysto. Brak nowych `#[ignore]`. Trailery commitów bez nazwy modelu (#289): OK.

## Pin (sprawdzony `git grep playerEverOwnedCityByOwner 07d2fbd72 -- gra/src/main.ts`)
`:3042` deklaracja; `:12883` odczyt `has(ownerId)`; `add`: `:16508`, `:17816`, `:36218`, `:45646`, `:45878`; `clear`: `:45071`, `:45397`, `:45645`, `:45877`, `:46368`; wczytanie `:46369-46370` (tylko `saved.humanOwnerIds` z miastem); flaga = `has(HUMAN_OWNER_PRIMARY)` `:34022`, `:43472`. Cytaty Operatora zgodne.

## Bramki (FC, engine; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p4_364_awaiting_seat`: EXIT 0 (6 passed, 0 ignored)
- `cargo test --all-targets --no-fail-fast`: EXIT 0 — 524 bloki `test result`, 3910 passed, 0 failed, 1 ignored (zgodne z Obroną; obejmuje golden zapisów `old_state_pre_pop.json` itd. i `awaiting_seat_rollback_tests`).

## Mutacja niezależna FC
`ever_owned_city`: gałąź nie-głównego fotela zwraca `gracz_kiedys_mial_miasto` (= stan sprzed tematu, jedna flaga dla każdego fotela) → `cargo test --test p4_364_awaiting_seat` EXIT 101, 5 FAIL / 1 ok. Plik przywrócony, `git status` czysty. Mutacje (a)(b)(c) Operatora/Evaluatora i (d) Obrony — raporty spójne z kodem; kryterium dispatchu (a)(b)(c) → FAIL spełnione.

## Orzeczenia zarzutów
| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| N1 | D-AS-2: fotel główny tylko we fladze, `player_ever_owned_city` bez fotela głównego; pole `pub` z nazwą sugerującą pełny zbiór (Evaluator) | ODDAL (nota dla orkiestratora) | Pin sam utożsamia flagę z `has(HUMAN_OWNER_PRIMARY)` (`:34022`, `:43472`) — jedno źródło na fakt; dispatch D-AS-1 wymaga pola obok bool bez zmiany znaczenia bool — spełnione; pełny zbiór pinu dostępny przez `player_ever_owned_city_by_owner()`, doc pola mówi jawnie „INNYCH niż fotel główny”. Decyzja techniczna → wpis D-AS-2 do `REJESTR-RUST.md` (orkiestrator, zasada 8); ewentualne zawężenie widoczności = osobny dług. |
| N1b | D-AS-3: `skip_serializing` obok `default` zamiast samego `default` (FC) | ODDAL | Dispatch zabrania zmiany kontraktu JSON; pin zbioru nie zapisuje (odtwarza przy wczytaniu, `:46368-46370`); `default` zachowany, mutacja (c) daje FAIL. Zmiana formatu zapisu: NIE. |
| N2 | Zapis wpisu w fazie Victory dla każdego właściciela (AI, miasta startowe); miasto założone i utracone w tej samej turze (Evaluator) | ODDAL | Dispatch §ZAKRES 1: „tam, gdzie dziś ustawiany jest `gracz_kiedys_mial_miasto`” — to faza Victory. Pin też dopisuje AI (`:17816`, `:36218`); oczekiwanie czytane tylko dla aktywnego fotela ludzkiego. Przypadek (ii) to dług wpięcia założenia/zdobycia (#115/#354) — tam wołać `record_ever_owned_city`. |
| N3 | Brak testu cofnięcia zbioru przy `TurnPhaseQueueIncomplete` (Evaluator) | ODDAL (naprawione w Obronie) | `awaiting_seat_rollback_tests` (2 testy) w `playable.rs`; mutant (d) → EXIT 101; w pełnym przebiegu FC zielone. |
| N4 | Produkcyjne wczytanie nie odtwarza zbioru (cfg(test)) (Evaluator) | ODDAL | Dług sprzed tematu, identyczny dla flagi; brak produkcyjnej ścieżki wczytania `PlayableState` w allowliście. |
| U1 | Test tury używa właściciela 2 jako AI, bo hotseat z dwoma `is_human` pada w fazie wojny (`turn_war_pipeline.rs:292`) (Operator, uwaga poza zakresem) | ODDAL | Ograniczenie fazy wojny spoza tematu; logika zapisu nie filtruje `is_human`, więc test pokrywa ścieżkę. Do rejestru długów orkiestratora. |

Żadnego NAPRAW, żadnej DECYZJI CZŁOWIEKA (sprawa techniczna, web rozstrzyga semantykę).

## Zmiana formatu zapisu: NIE
