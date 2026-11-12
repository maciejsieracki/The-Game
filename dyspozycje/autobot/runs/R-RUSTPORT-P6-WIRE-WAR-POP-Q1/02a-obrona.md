# Obrona Operatora po zarzutach Evaluatora — R-RUSTPORT-P6-WIRE-WAR-POP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-POP-Q1
GOAL: obrona zarzutow Evaluatora (02-evaluator.md, da4092fa1) — przyjecie/odrzucenie kazdego punktu z dowodem.
ZMIANY/COMMIT: SHA poprawek obrony: patrz sekcja "Commit" na koncu (commit po tej obronie).
RUNDY: 1/5 tego tematu w tej rundzie obrony (poprzedni raport: 01-operator-r1.md, nazwa po zmianie zgodnej z dispatchem).
NASTEPNY KROK: Evaluator (ponowna ocena poprawek tej obrony), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

Baza: `fa480bf2a` (zgodnie z linia "Baza" dispatchu). Operator nie pushowal. Gałąź wynikowa: detached HEAD w worktree.

## Odpowiedzi na zarzuty

### Z1 — bramki odtworzone przez Evaluatora (wszystkie EXIT 0)
PRZYJMUJĘ jako potwierdzenie; bez zmiany kodu. Bramki ponownie uruchomione przez Operatora po poprawkach tej obrony (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- `cargo fmt --check` — EXIT 0
- `cargo clippy --all-targets -- -D warnings` — EXIT 0
- `cargo test --lib` — 51 passed, 0 failed, 0 ignored
- `p6_wire_war_pop` 9, `p6_wire_war_inputs` 14, `p6_wire_war_epoch` 9, `p6_wire_war_view` 5, `p6_wire_war_forced_step` 6, `p6_wire_war_march_adapter` 7 (wszystkie 0 failed, 0 ignored)
- `p6_power_producers`, `p6_power_army`, `p6_power_nozeros`, `p6_power_rest` — 0 failed
- `p6_wire_war_pipeline` 10, `p6_brake_inputs` 7 — 0 failed
Pełny `cargo test --no-fail-fast` (389 binarek) NIE_ZMIERZONO w tej obronie (tylko targetowane binarki i lib).

### Z2 — wektory granicy zregenerowane z pinu 07d2fbd72
PRZYJMUJĘ jako potwierdzenie; bez zmiany kodu. Generator nie zostal zmieniony poza przeniesieniem (patrz Z7); wektory `shared_border.json` nie zmienione.

### Z3 — producenci ludki/rekruci/kultura: asercje czesciowo nie-pinowe (rekruci tylko nierownosciami)
PRZYJMUJĘ dla rekrutow, ODRZUCAM dla reszty.
- PRZYJETE: `rekrut_ekw` mial asercje `>= 0.0` i `r2 >= r1`. Zamienione na wartosci rowne: `assert_eq!(raw.rekrut_ekw, Component::Provided(8.0))` i `assert_eq!(raw1.rekrut_ekw, Component::Provided(1.0))`. Wartosci odczytane z przebiegu producenta (`rekruci_ekw_for_owner` -> `rekrut_unit_equivalents`, epoka 1.0, costMult 1), nie z reki. Funkcja ma pin test `rekruci_ekw_match_pin_rekrut_unit_equivalents` (p6_power_producers.rs), wiec sama formula jest pinowana, a test wiringu pilnuje wejscia.
- ODRZUCONE: ludki = 8 i kultura = 11 sa definicja producentow (suma klampowanej populacji miast gracza 2: 3+5; suma kultury: 7+4), wpisana w komentarz testu; nie wymagaja wektora. Funkcje `ludki`/`kultura` sa wolane z tych samych wejsc.
- ODRZUCONE: terytorium 91 / 217 jest liczone przez `terytorium_for_owner`, ktora ma wlasne wektory z pinu (p6_power_army.rs:198 i :290). Wiring (zrodlo wezlow = miasta z populacja) jest tym, co testuje p6_wire_war_pop; liczby 91/217 to pole sumy dyskow heksowych po zrodle geometrycznym, nie zgadywanie.

### Z4 — `map_has_hex` sprawdza tylko prostokat width x height
PRZYJMUJĘ — poprawione. `map_has_hex` sprawdza teraz istnienie kafla: `u16::try_from` obu wspolrzednych i `map.tile(PositionDto::new(x, y)).is_some()` (kafel musi wystepowac w `tiles`, nie tylko w prostokacie). Zmiana w `rust-port/engine/src/domain/turn_war_inputs.rs`. Testy po zmianie: lib 51 OK, p6_wire_war_pop 9 OK, p6_wire_war_inputs 14 OK, p6_wire_war_pipeline 10 OK.
- NIE_ZMIERZONO pozostaje: zgodnosc siatki x,y z q,r wzgledem mapy weba (jawna luka KNOWN_GAPS, bez zmiany w tej rundzie).

### Z5 — fortyfikacje i posterunki nie sa w terytorium (parytet tylko dla miast)
ODRZUCAM zmiane kodu w tej rundzie; luka pozostaje jawna. Powod: `PlayableState` nie niesie fortow ani posterunkow — nie ma zrodla danych, wiec nie da sie ich policzyc. Jawnie udokumentowane: komentarz przy `territory_cities` w `turn_war_inputs.rs` (KNOWN_GAPS[1]) i raport 01-operator-r1.md.
- Otwarta decyzja (do orkiestratora/właściciela, NIE rozstrzygam sam): zamiana `heksy_terytorium` na `Missing` przy mapach z fortami zablokowalaby advance_turn dla wszystkich map, bo fortow nie da sie wykryc. To zmiana kryterium "jawnych blokerow", nie poprawka obrony.

### Z6 — brak wzrostu populacji/kultury miedzy turami; test 3 tur advance_turn niemozliwy
ODRZUCAM jako blokade. Kryterium (3) GOAL mowi: test 3 tur przechodzi, JESLI wszystkie zrodla sa dostepne. Zrodla infra/tech/religia nie sa dostepne w `PlayableState` (`UNPRODUCED_POWER_COMPONENTS = ["infra", "tech", "religia"]`, turn_war_inputs.rs:87), a test `war_turn_with_ai_cities_is_blocked_only_by_infra_tech_religia` pilnuje dokladnie tej listy jako jedynych blokerow. Brak wzrostu populacji miedzy turami (brak fazy Economy) jest jawna luka w komentarzu modulu (turn_war_inputs.rs:93), nie blokerem kryterium.

### Z7 — generator `p6_wire_war_pop_gen.mjs` poza wzorcem allowlisty
PRZYJMUJĘ — przeniesiony do `rust-port/engine/tests/p6_wire_war_pop_vectors/p6_wire_war_pop_gen.mjs` (`git mv`), czyli do allowlistowanego `tests/p6_wire_war_pop_vectors/**`. Naglowek z komenda uzycia zaktualizowany do nowej sciezki. Plik nie byl uzywany przez test Rust (test czyta tylko `shared_border.json`), wiec przeniesienie nie zmienia zachowania.

### Z8 — nazwa raportu (r4 zamiast r1) i baza
- Raport: PRZYJMUJĘ — `01-operator-r4.md` przemianowany na `01-operator-r1.md` zgodnie z dispatchem (`git mv`). Tresc raportu (wpisy o rundzie) nie zmieniona poza nazwa pliku.
- Baza: ODRZUCAM zarzut o bazie. Dowod:
  - Linia "Baza" dispatchu wskazuje wprost `fa480bf2a` (FC W8 r6 epoka) i galaz `rust-port-wip/WIRE-WAR-EPOKA-fc`. Operator pracowal na tej bazie.
  - `fa480bf2a` jest potomkiem `f207ea6b1` (`git merge-base --is-ancestor f207ea6b1 fa480bf2a` — tak), czyli spelnia "f207ea6b1 lub nowszy" z tresci zadania.
  - `origin/rust-port/parity-v2` (`81e7840ba`) nie zawiera `fa480bf2a` ani odwrotnie (merge-base `5e58876f`; 34 commity po stronie parity-v2, 14 po stronie fa480). Nie da sie na nim zbudowac bez epoki i pipeline z fa480.
  - Integracja/rebase na parity-v2 nalezy do orkiestratora (dispatch: NIE integruj, NIE pushuj do rust-port/parity-v2). Operator nie integrowal.

### Z9 — brak zarzutow blokujacych; allowlista zachowana
PRZYJMUJĘ jako potwierdzenie. Allowlista: zmienione pliki to `turn_war_inputs.rs` (allowlista: turn_war_inputs*.rs), `p6_wire_war_pop.rs` (allowlista: p6_wire_war_pop*.rs) oraz generator w `tests/p6_wire_war_pop_vectors/**`. Brak zmian w `gra/**`, `Cargo.toml`, `Cargo.lock` (nieśledzony, NIE commitowany), `WERSJE.md`. Brak `#[ignore]`. Asercje nie osłabione: jedyna zmiana asercji w tej obronie zamienia `>= 0.0` / `r2 >= r1` na wartosci rowne (wzmocnienie).

## Commit

Commit obrony: patrz SHA w odpowiedzi orkiestratora (`git log -1` w worktree po commicie). Zawiera: `turn_war_inputs.rs` (map_has_hex), `p6_wire_war_pop.rs` (asercje rekrutow), przeniesienie generatora, przemianowanie raportu, ten plik.
