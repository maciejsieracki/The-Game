# R-RUSTPORT-P4-364-AWAITING-SEAT-R1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-AWAITING-SEAT-R1
GOAL: `awaiting_first_city(state, owner)` odpowiada webowi (`isAwaitingFirstPlayerCity(ownerId)`) dla KAŻDEGO fotela; stan per właściciel w `PlayableState`.
ZMIANY/COMMIT: oceniany commit Operatora `f628f1f40` (gałąź `rust-port-wip/p4-364-awaiting-seat-r1`), baza `326fd5545` zgodna z dispatchem. Evaluator nie zmieniał kodu; dodaje tylko ten raport.
TESTY: patrz §Bramki (odtworzone niezależnie).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / Final Control r1.
DEPLOY/PUSH: NIE WYKONANO

## Allowlista
`git diff --stat 326fd5545 f628f1f40`: `playable.rs` (+88/-?), `overlays_view.rs`, `dto_bridge.rs` (tylko komentarz modułu D-BR-1, API bez zmian), `tests/p4_364_awaiting_seat.rs` (nowy), `01-operator-r1.md`. Wszystko w allowliście. Renderer, view-model, `Cargo.lock`: nietknięte. `git diff --check`: czysto. Brak `#[ignore]` w nowym teście, brak usuniętych asercji w diffie. Trailer commitu bez nazwy modelu (#289): OK.

## Pin (sprawdzony `git show 07d2fbd72:gra/src/main.ts`)
Potwierdzone: `:3042` deklaracja zbioru; `:12883` odczyt `has(ownerId)`; zapisy `:16508` (ME), `:17816` (newOwner), `:36218` (atkOwner), `:45645-45646` i `:45877-45878` (clear + primary); `:45071`, `:45397` (clear przy resecie / playtest — Operator ich nie cytuje, bez skutku dla Rust); `:46368-46370` (wczytanie: tylko fotele ludzkie z miastem); `:34022`, `:43472` (flaga = `has(HUMAN_OWNER_PRIMARY)`).

## Bramki (engine, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p4_364_awaiting_seat`: EXIT 0 (6 passed, 0 ignored)
- `cargo test --all-targets --no-fail-fast`: EXIT 0 — 524 bloki `test result`, 3908 passed, 0 failed, 1 ignored (zgodnie z raportem Operatora; ignorowany test nie pochodzi z tego diffu). Obejmuje golden zapisów (`old_state_pre_pop.json` itp.).

## Mutacje (niezależny skrypt Evaluatora, plik przywrócony, `cmp` OK, `git status` czysty)
| Mutacja | Wynik testu tematu |
|---|---|
| (a) `ever_owned_city`: zbiór ignorowany (`contains` → `false`) | EXIT 101, 4 FAIL |
| (a2) jedna flaga dla każdego fotela (stan sprzed zmiany) | EXIT 101, 5 FAIL |
| (b) usunięta pętla `record_ever_owned_city` w fazie Victory | EXIT 101, 1 FAIL (`first_city_of_second_seat_is_recorded_on_turn`) |
| (b2) `record_ever_owned_city` nie dopisuje do zbioru | EXIT 101, 4 FAIL |
| (c) `#[serde(skip_serializing)]` bez `default` | EXIT 101, 1 FAIL (`old_save_without_field_loads_and_json_has_no_new_key`) |
| (d) brak przywrócenia zbioru przy niekompletnej kolejce faz | EXIT 0 — **mutant przeżywa** (uwaga N3) |

Kryteria dispatchu (a)(b)(c) → FAIL: spełnione.

## Ocena merytoryczna
- `awaiting_first_city` w `overlays_view` czyta teraz `state.is_awaiting_first_city(owner)` — per fotel; wektory pinu (12 przypadków `vectors.json`, fotele 0 i 1, z miastem/bez, z wpisem/bez) przechodzą przez obie ścieżki (fotel 1 = flaga, fotel 0 = zbiór, bo `HUMAN_PLAYER_ID = 1`).
- `fog_off_no_reveal_awaiting`: mgła OFF ⇒ brak kluczy rzek; wektory renderera bez zmian.
- Format zapisu/kontrakt JSON: bez zmian (`skip_serializing`), zgodnie z zakazem dispatchu i z pinem, który zbioru nie zapisuje.

## Uwagi (nie blokują)
- **N1 (odstępstwo od D-AS-1 → decyzja orkiestratora):** dispatch: „pole `BTreeSet<PlayerId>` per właściciel, utrzymywane obok bool”. Operator (D-AS-2) trzyma fotel główny wyłącznie we fladze, a w `player_ever_owned_city` tylko pozostałych właścicieli. Uzasadnienie (testy spoza allowlisty ustawiają flagę bezpośrednio) jest rzeczowe, a dostęp idzie przez metody, ale pole jest `pub` i jego nazwa sugeruje pełny zbiór pinu — bezpośredni czytelnik dostanie zbiór bez fotela głównego. Orkiestrator powinien zatwierdzić D-AS-2 w `REJESTR-RUST.md` (albo zawęzić widoczność pola w kolejnym temacie).
- **N2 (semantyka punktu zapisu):** wpis powstaje w fazie Victory dla KAŻDEGO właściciela miasta (także AI i miast ze scenariusza startowego), a pin dopisuje przy założeniu (tylko ME), kapitulacji i zdobyciu; przy nowej grze tylko fotel główny. Różnice: (i) AI z miastem startowym jest w zbiorze Rust, w pinie nie — bez skutku, bo oczekiwanie liczy się tylko dla aktywnego fotela ludzkiego; (ii) miasto założone i utracone w tej samej turze — pin: nie czeka, Rust: czeka. Rust nie ma dziś produkcyjnej ścieżki założenia/zdobycia, więc to dług do wpięcia (`ZDOBYCIE-MIASTA-WIRING` / założenie miasta) — Operator to opisał.
- **N3 (pokrycie):** przywrócenie `player_ever_owned_city` przy `TurnPhaseQueueIncomplete` nie jest testowane (mutant d przeżywa). Poza kryteriami dispatchu; warto dopisać test w kolejnej rundzie albo osobnym długu.
- **N4:** wczytanie produkcyjne `PlayableState` nie odtwarza zbioru (odtworzenie jest `cfg(test)`, jak dla flagi) — istniejący dług, nie z tego tematu.
