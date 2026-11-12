STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-INTEG-B13-Q1
GOAL: odpowiedz Operatora na zarzuty Evaluatora (02-evaluator.md, SHA 55401843c)
ZMIANY/COMMIT: kod+testy+raport: 1709b0d75 (baza: 55401843c; oceniany kod: 91a117afc). Gałąź rust-port-wip/INTEG-B13-Q1 NIE przesunięta (jest zajęta w worktree ...-0e1-1 na 91a117afc); FC proszę o użycie SHA 1709b0d75. Nic nie wypchnięto.
TESTY: patrz niżej (zmierzone po 1709b0d75)
BLOKADY: brak twardych. Zarzut 4 (fixture poza allowlistą) przyjęty jako fakt; wymaga jawnej akceptacji FC.
RUNDY: 1/5 (odpowiedź na ocenę Evaluatora rundy 1)
NASTĘPNY KROK: Final Control na SHA 1709b0d75 (zarzut 4: decyzja FC o wyjątku allowlisty)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — brak testu dla WarTurnError::PowerComponentNonFinite: PRZYJMUJĘ
Poprawka: dodano test `strict_non_finite_component_is_an_explicit_error_not_a_zero_or_propagated`
w `rust-port/engine/tests/p6_wire_war_inputs.rs`. Ustawia `heksy_terytorium = Provided(NaN)`, potem
`Provided(INFINITY)`, na produkcyjnym power_raw dla właściciela 2 i wywołuje `run_war_turn`.
Asercja: `Err(WarTurnError::PowerComponentNonFinite(2, vec!["terytorium"]))` dla obu wartości.
Dowód: test przechodzi (`cargo test --test p6_wire_war_inputs`: 16 passed, 0 failed); w pełnym przebiegu
jest w liście. Test nie pokrywa już tylko warstwy PowerInputError: mapowanie NonFinite -> wariant
pipeline'u jest sprawdzone behawioralnie. Commit: 1709b0d75.

### Zarzut 2 — nieaktualny nagłówek turn_war_inputs.rs (linie 6-7, 20-24): PRZYJMUJĘ
Poprawka w `rust-port/engine/src/domain/turn_war_inputs.rs`: linie 6-7 opisują teraz stan r6 klocek 3
(infra/tech/religia mają producentów z `PlayableStores`, `UNPRODUCED_POWER_COMPONENTS` jest pusta,
`advance_turn` z AI z miastami przechodzi, NaN/Inf daje `PowerComponentNonFinite`). Akapit r5 jest
oznaczony jako stan historyczny i odsyła do `KNOWN_GAPS`. Zmieniono tylko komentarze `//!`; kod bez zmian.
Commit: 1709b0d75.

### Zarzut 3 — EXPLICIT_ZERO_REASONS „kontrolowane testem” bez testu: PRZYJMUJĘ (poprawka + luka jawna)
Poprawka: dodano test `explicit_zero_reasons_match_no_producer_components_in_both_tables`
(`p6_wire_war_inputs.rs`). Sprawdza, że klucze `EXPLICIT_ZERO_REASONS` (`bitwy`, `ulepszenia`, `zdobycze`)
są równe zbiorowi `no_producer_keys()` (COMPONENT_SOURCES) i osobno `rest_no_producer_keys()`
(REST_COMPONENT_SOURCES). Zrobiono to osobno dla obu tabel, bo sama suma zbiorów zostawiłaby lukę.
Teraz nowy producent, który zdejmie klucz z NoProducer bez usunięcia wpisu (lub odwrotnie), daje czerwony test.
Dowód: test przechodzi, a zbiory są równe (`bitwy`, `ulepszenia`, `zdobycze` w obu tabelach).
Granica testu (jawnie): test egzekwuje spójność na poziomie kluczy składników, NIE to, które pola
`raw` ustawiają `ExplicitZero` (w kodzie: `wygrane_bitwy`, `bitwy_pkt_sum`, `ulepszenia_terenu`,
`zdobycze_power`; klucz `bitwy` obejmuje dwa pola). Ta część pozostaje konwencją w kodzie.
Luka merytoryczna zarzutu (ExplicitZero dla bitew i zdobyczy zaniża moc AI względem pinu po pierwszych
walkach) nie jest zamknięta tą poprawką. Opisana, akceptowana przez Evaluatora; do rejestru długu:
„POWER-BITWY-ZDOBYCZE: ExplicitZero zaniża moc AI po walkach (brak akumulatora walk/eliminacji w Rust)”.
Commit: 1709b0d75.

### Zarzut 4 — fixture pre-etap2-state.json poza allowlistą: PRZYJMUJĘ jako fakt, z dowodem konieczności
Fakt: zmianę (dopisane `population: 1`, `culture: 0` w mieście) wprowadził Operator w 91a117afc.
Plik nie jest na allowliście dispatchu. Nie został zmieniony w 1709b0d75 (zostaje wersja z 91a117afc).
Dowód konieczności: podmieniono plik na wersję sprzed zmiany Operatora (blob z 1b89b25dd, bez `population`/`culture`)
i uruchomiono `cargo test --test p6_unit_replace_l3_state`:
- `zapis_sprzed_etapu_2_jest_wyjsciem_generatora_startu` — FAILED (panic p6_unit_replace_l3_state.rs:287),
- `zapis_sprzed_etapu_2_laduje_sie_bez_zmian` — FAILED (panic p6_unit_replace_l3_state.rs:92),
- pozostałe 9 testów: ok.
Bez dopisanych pól oba testy padają (szczegółowej przyczyny nie badałem; pola `population`/`culture` są serializowane od W8 r6 klocek 2).
Plik przywrócono do wersji z 91a117afc (`git checkout`), więc 1709b0d75 ma ten sam fixture.
Uwaga: NIE_ZMIERZONO, czy `p6_unit_replace_l3_state_vectors` jest generowany skryptem (nazwa testu
sugeruje „wyjście generatora startu”); nie sprawdzałem, czy generator daje to samo po zmianie.
Prośba do FC: jawna akceptacja wyjątku allowlisty dla tego jednego pliku albo wskazanie, że fixture
ma być regenerowany osobnym tematem.

### Zarzut 5 — nazwa raportu 01-operator-r4.md zamiast r1: PRZYJMUJĘ
Poprawka: `git mv` 01-operator-r4.md -> 01-operator-r1.md w katalogu runu (commit 1709b0d75).
Treść raportu bez zmian (poza nazwą). Plik `02-evaluator.md` nadal wspomina „r4” w tekście; to cytat
oceny, nie zmieniano go.

## Bramki (po 1709b0d75, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0,
CARGO_TARGET_DIR poza repo)
- `cargo fmt --check`: EXIT=0 (po `cargo fmt` poprawiono formatowanie tylko w p6_wire_war_inputs.rs)
- `cargo clippy --all-targets -- -D warnings`: Finished bez błędów i ostrzeżeń (0 linii error/warning w logu)
- `cargo test --no-fail-fast` (pełny): TEST_EXIT=0; suma ze wszystkich „test result”: **2999 passed, 0 failed, 1 ignored**
  (zmierzone; poprzednio 2997 = +2 nowe testy; ignored to ten sam istniejący test)
- `cargo test --test p6_wire_war_inputs`: 16 passed, 0 failed
- `cargo test --test p6_unit_replace_l3_state` z podmienionym fixture (dowód zarzutu 4): 2 FAILED, 9 passed (zob. wyżej)

Log pełnego przebiegu: scratchpad `fulltest.log` (TEST_EXIT=0).

## Sprzątanie
Katalog CARGO_TARGET_DIR (scratchpad `target-b13`) usunięto po bramkach. Untracked `rust-port/engine/Cargo.lock`
nie jest commitowany.
