# R-RUSTPORT-P4-364-AWAITING-SEAT-R1 — Obrona Operatora r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-AWAITING-SEAT-R1
GOAL: `awaiting_first_city(state, owner)` odpowiada webowi (`isAwaitingFirstPlayerCity(ownerId)`) dla KAŻDEGO fotela; stan per właściciel w `PlayableState`.
ZMIANY/COMMIT: gałąź `rust-port-wip/p4-364-awaiting-seat-r1-def`, baza = raport Evaluatora `4a3ad4988` (nad kodem Operatora `f628f1f40`, baza tematu `326fd5545`). Zmiana kodu: tylko `rust-port/engine/src/domain/playable.rs` (nowy moduł testowy `awaiting_seat_rollback_tests`, kod produkcyjny bez zmian) + ten raport. SHA: patrz commit tego raportu.
TESTY: patrz §Bramki.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control r1.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź |
|---|---|---|
| 1 | Ocena `f628f1f40` na bazie `326fd5545`, raport w `4a3ad4988`, nic nie wypchnięte | PRZYJMUJĘ (informacja). Obrona zbudowana na `4a3ad4988`; nic nie pushowane. |
| 2 | Bramki odtworzone, EXIT 0, allowlista dotrzymana | PRZYJMUJĘ (informacja). Po poprawce N3 bramki powtórzone (§Bramki). |
| 3 | Mutacje (a)(a2)(b)(b2)(c) → FAIL | PRZYJMUJĘ (informacja). Kod produkcyjny nie zmieniony, więc wyniki aktualne. |
| N1 | Odstępstwo od D-AS-1: fotel główny tylko we fladze, pole `pub` z nazwą sugerującą pełny zbiór | ODRZUCAM zmianę w tej rundzie, decyzję zostawiam orkiestratorowi. Dowody: (1) pin sam traktuje flagę jako wpis fotela głównego: `graczKiedysMialMiasto: playerEverOwnedCityByOwner.has(HUMAN_OWNER_PRIMARY)` (`main.ts:34022`, `:43472`), więc jedno źródło na fakt jest wierniejsze niż dwa synchronizowane; (2) testy spoza allowlisty ustawiają flagę bezpośrednio (`tests/view_overlays_reach_path.rs:83`, `:282`) — pełny zbiór z fotelem głównym dałby FAIL w `:282` bez zmian poza allowlistą; (3) zawężenie widoczności do `pub(crate)` wymaga zmiany testu integracyjnego `tests/p4_364_awaiting_seat.rs` (`:75`, `:213`, `:235-237`, `:270`, `:273` czytają pole) i jest decyzją API, nie poprawką; (4) komentarz pola (`playable.rs`, doc przy `player_ever_owned_city`) mówi jawnie „dla właścicieli INNYCH niż fotel główny” i wskazuje `player_ever_owned_city_by_owner()` jako pełny zbiór pinu. Proponowany wpis do `REJESTR-RUST.md`: „D-AS-2: wpis fotela głównego = `gracz_kiedys_mial_miasto`; `player_ever_owned_city` = pozostali; dostęp przez `ever_owned_city`/`record_ever_owned_city`/`player_ever_owned_city_by_owner`”. |
| N2 | Punkt zapisu w fazie Victory dla każdego właściciela (AI, miasta startowe); miasto założone i utracone w tej samej turze | ODRZUCAM jako zarzut do tego tematu. Dowody: dispatch §ZAKRES 1 każe utrzymywać pole „tam, gdzie dziś ustawiany jest `gracz_kiedys_mial_miasto`” — jedynym takim miejscem w produkcji jest faza Victory (`playable.rs`, gałąź `TurnPhase::Victory` w `advance_turn`); Rust nie ma produkcyjnego założenia ani zdobycia miasta (`siege_transfer_q5::record_player_ever_owned_city` bez wołającego produkcyjnego). Różnica (i) bez skutku (oczekiwanie czytane tylko dla aktywnego fotela ludzkiego, Evaluator to potwierdza). Różnica (ii) zniknie po wpięciu założenia/zdobycia (`ZDOBYCIE-MIASTA-WIRING`, #115/#354), które ma wołać `PlayableState::record_ever_owned_city`; opisane w `01-operator-r1.md` §Uwagi. |
| N3 | Przywrócenie zbioru przy `TurnPhaseQueueIncomplete` nietestowane; mutant (d) przeżywa | PRZYJMUJĘ. Poprawka: moduł `awaiting_seat_rollback_tests` w `playable.rs` (test jednostkowy, bo `phase_queue` jest prywatne — ten sam wzorzec co `r7k7c_rollback_tests`): `pelna_kolejka_zapisuje_wpis_wlasciciela_2` (kontrola pozytywna: pełna kolejka dopisuje właściciela 2 w fazie Victory) i `niekompletna_kolejka_cofa_wpis_zbioru_z_fazy_victory` (kolejka bez fazy Ai: Victory dopisuje, `advance_turn` zwraca `TurnPhaseQueueIncomplete`, zbiór pusty, tura bez zmian). Dowód: mutant (d) = usunięcie linii `self.state.player_ever_owned_city = ever_owned_before;` → `cargo test --lib awaiting_seat_rollback_tests` EXIT 101 (`niekompletna_kolejka_cofa_wpis_zbioru_z_fazy_victory` FAILED, kontrola pozytywna ok); plik przywrócony, `cmp` OK; bez mutacji EXIT 0 (2 passed). |
| N4 | Produkcyjne wczytanie `PlayableState` nie odtwarza zbioru (`cfg(test)`) | ODRZUCAM jako zarzut do tego tematu. Dowód: Evaluator sam klasyfikuje to jako dług sprzed tematu; flaga `gracz_kiedys_mial_miasto` ma identyczny mechanizm (`odtworz_flage_zwyciestwa_ze_miast` pod `cfg(test)` sprzed zmian, baza `326fd5545`); w Rust brak produkcyjnej ścieżki wczytania `PlayableState`, więc nie ma wołającego, do którego można by to wpiąć bez wyjścia poza allowlistę. Format zapisu bez zmian (`skip_serializing`, zgodnie z pinem, który zbioru nie zapisuje). |
| 4 | Sprzątanie, DEPLOY/PUSH NIE WYKONANO | PRZYJMUJĘ (informacja). |

## Zmiana formatu zapisu: NIE
Poprawka dodaje tylko test jednostkowy; kontrakt JSON i zapis bez zmian.

## Bramki (engine, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p4_364_awaiting_seat`: EXIT 0 (6 passed)
- `cargo test --lib awaiting_seat_rollback_tests`: EXIT 0 (2 passed); mutant (d): EXIT 101
- `cargo test --all-targets --no-fail-fast`: EXIT 0 (524 bloki `test result`, 3910 passed = 3908 + 2 nowe, 0 failed, 1 ignored — ten sam co u Operatora i Evaluatora)
- `git diff --check`: czysto. `Cargo.lock` nie commitowany.
