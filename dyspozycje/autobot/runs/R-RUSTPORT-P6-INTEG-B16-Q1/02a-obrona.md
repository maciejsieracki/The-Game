STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-INTEG-B16-Q1
GOAL: obrona Operatora (HAIKU, runda 1) na 3 zarzuty Evaluatora (02-evaluator.md, PASS-WITH-NOTES) przy SHA integracji 1b487f72f.
ZMIANY/COMMIT: brak zmian kodu. Dodany tylko ten plik (allowlista: dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-B16-Q1/**). SHA tego raportu: patrz sekcja DEPLOY/PUSH.
TESTY: nie uruchamiałem ponownie cargo (zarzuty są weryfikowalne przez grep i odczyt kodu; bramki zostały już odtworzone przez Evaluatora). Dowody: git grep na 1b487f72f, odczyt war_turn_state.rs, turn_war_inputs.rs, tests/p6_wire_war_inputs.rs. Ancestry: da50d1753, 73c92bb04, 0c90e2bf1, d842b9866 są ancestorami 1b487f72f (TAK). Zmiany poza dyspozycje/ leżą tylko w rust-port/engine/src/domain i rust-port/engine/tests (brak gra/, Cargo.*, WERSJE.md, data/). Jedyny #[ignore] (tests/p6_order_lane.rs:1530) istnieje już na da50d1753.
BLOKADY: brak nowych. Zarzut 1 wymaga zarejestrowania tematu wiringu przez orkiestratora (poza uprawnieniami Operatora); opisane niżej.
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control r1 na 1b487f72f z tą obroną; orkiestrator rejestruje temat wiringu akumulatorów (propozycja ID poniżej) jako dług.
DEPLOY/PUSH: NIE WYKONANO (zakaz push w dispatchu).

## Odpowiedzi na zarzuty

### Zarzut 1 — akumulatory bitew i zdobyczy bez wołających w produkcji: PRZYJMUJĘ stwierdzenie faktu i dług; ODRZUCAM wniosek, że blokuje B16

Dowód faktu (potwierdzony):
- `git grep` na 1b487f72f: `record_battle_win`, `record_capture_power_gain`, `clear_power_accumulators_for_owner` mają definicje w `rust-port/engine/src/domain/war_turn_state.rs:609,617,631` i wołających tylko w `rust-port/engine/tests/p6_power_battle_acc.rs` i `rust-port/engine/tests/p6_power_sources.rs`. Poza testami brak wywołań w `src/`.
- `brake_power_rest.rs:35` i `:55` podają `RestSource::RustProducer` dla `bitwy` i `zdobycze`, a `brake_power_producers.rs:39` i `:70` mają je w `COMPONENT_SOURCES`. Producent czyta akumulator, ale nic w produkcji go nie zapisuje, więc wkład mocy w grze wynosi 0. Etykieta `RustProducer` nie oznacza więc pełnego parytetu mocy AI w grze.
- Stan jest opisany jawnie w `war_turn_state.rs:150-152` (STAN WDROZENIA: producenci nie są jeszcze wołani z bitwy, zdobywania ani eliminacji). Zgadzam się, że brakuje tam ID tematu.

Dlaczego to nie blokuje B16 (ODRZUCAM blokadę):
- Dispatch B16 (linie „(2)” i „ZAKAZ”) zakresuje to scalenie jako `war_turn_state.rs, turn_war_inputs.rs, brake_power_rest.rs, testy p6_power_*, p6_wire_war_inputs`. Wiring wołających z bitwy i eliminacji nie jest w zakresie.
- Allowlista dispatchu nie obejmuje `src/domain/brake_power_producers.rs`, modułów bitwy ani eliminacji. Podłączenie wymagałoby zmiany poza allowlistą, więc nie wprowadzam go tutaj.
- Scalenie nie zmienia zachowania względem bazy da50d1753 (nowy kod to typowany stan i producenci; wołający to osobny temat).

Zalecenie Evaluatora przyjęte jako dług (nie jako poprawka tej rundy):
- Propozycja ID tematu wiringu: `R-RUSTPORT-P6-POWER-AKUMULATORY-WIRING-Q1`. Zakres: wołający `record_battle_win` z rozstrzygnięcia bitwy, `record_capture_power_gain` przy zdobyciu stolicy/obozu, `clear_power_accumulators_for_owner` przy eliminacji. Zależności: W8 (siege, zdobycie) i bitwa. Rejestr wpisuje orkiestrator (poza allowlistą Operatora).
- Do czasu wiringu dług jest widoczny w `POWER_ACC_META_KEYS` (STAN WDROZENIA). Proponuję dopisać do tej notatki ID tematu, ale to zmiana kodu poza allowlistą tej rundy.

### Zarzut 2 — `power_acc_of`: duplikat klucza z `null` daje inną wartość niż web: PRZYJMUJĘ jako znany, udokumentowany brzeg (bez poprawki)

- Brzeg jest opisany w doc-komentarzu `power_acc_of` (`war_turn_state.rs`, ok. linii 637-641): duplikat, w którym drugi wpis ma `null`, daje w Rust poprzednią wartość, a web zapisałby `null`. Wejście jest według komentarza niemożliwe z zapisu webowego (`Array.from(Map.entries())` daje unikalne klucze).
- Zgodnie z zarzutem: nieblokujące, bez zmiany kodu w tej rundzie.
- NIE_ZMIERZONO: twierdzenie o niemożliwości wejścia z zapisu webowego opieram na komentarzu w kodzie; nie sprawdziłem tego w kodzie web w tej rundzie.

### Zarzut 3 — `EXPLICIT_ZERO_REASONS` jako martwy mechanizm: ODRZUCAM określenie „martwy”; przyjmuję, że lista jest pusta

Dowód:
- `turn_war_inputs.rs:85`: `pub const EXPLICIT_ZERO_REASONS: [(&str, &str); 0] = [];`. Lista jest pusta (przyjmuję).
- Stała nie jest martwa: czytają ją dwa testy w `rust-port/engine/tests/p6_wire_war_inputs.rs`:
  - ok. linii 277-282: każdy wpis ma pin `plik:linia` i lista kluczy jest pusta (`assert!(keys.is_empty())`);
  - ok. linii 613-620, test `explicit_zero_reasons_match_no_producer_components_in_both_tables`: asercja `EXPLICIT_ZERO_REASONS == no_producer_keys()` (COMPONENT_SOURCES) oraz `== rest_no_producer_keys()` (REST_COMPONENT_SOURCES).
- Obecnie obie tabele NoProducer są puste, więc test przechodzi. Jeśli jakiś składnik dostanie NoProducer bez wpisu w liście (lub odwrotnie), test staje na czerwono. To żywa kontrola dryfu, a nie martwy kod.
- Dodatkowa uwaga (nie dotyczy zarzutu, do rejestru): `ulepszenia_terenu` w `power_raw_for_owner` jest `ExplicitZero` (`turn_war_inputs.rs:337-342`), a w tabeli `COMPONENT_SOURCES` ma producenta. Ta niezgodność jest zamierzona w B14A i opisana w komentarzu, ale kontrola z zarzutu 3 jej nie łapie, bo nie porównuje wartości `Component` z tabelą.

## Wnioski
- Zarzut 1: dług przyjęty, blokada odrzucona (poza zakresem dispatchu, brak zmiany kodu).
- Zarzut 2: przyjęty jako znany brzeg, bez zmiany kodu.
- Zarzut 3: określenie „martwy” odrzucone (test czyta stałą); lista pusta zgodna z faktem.
- Brak commitów kodu w tej rundzie.
