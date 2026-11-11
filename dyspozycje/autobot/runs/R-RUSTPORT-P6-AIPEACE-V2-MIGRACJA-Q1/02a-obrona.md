STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-AIPEACE-V2-MIGRACJA-Q1
GOAL: obrona r1 na zarzuty Evaluatora (02-evaluator.md, commit 26711baee): odpowiedz na kazdy zarzut, poprawka tam, gdzie zarzut jest zasadny.
ZMIANY/COMMIT: kod obrony 7bd333cec (baza: 26711baee; poprzedni kod operatora fb0113eb3). Allowlista zachowana: rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs (tylko komentarze), rust-port/engine/tests/p6_wire_war_siege_aiai_seq.rs (+1 test). Cargo.lock nie commitowany (untracked). Nie ruszono gra/, Cargo.toml, WERSJE.md, origin/main, rust-port/parity-v2.
TESTY: cargo fmt --check EXIT 0 (po rustfmt obu plikow); cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib: 37 passed, 0 failed; cargo test --test p6_wire_war_siege_aiai_seq: 4 passed (w tym nowy loser_balance_none_checks_only_winner_balance); 9 binarow integracyjnych z dispatchu: lacznie 44 passed, 0 failed, EXIT 0 (sumy z jednego biegu; przypisanie liczb do binarow NIE_ZMIERZONO).
BLOKADY: zarzut 1 wymaga decyzji wlasciciela (patrz nizej) - nie zmieniam wektorow pinu ani nie usuwam V1 bez decyzji.
RUNDY: 1/5 (obrona operatora, runda 1)
NASTEPNY KROK: decyzja wlasciciela w sprawie zarzutu 1 (ABC); potem Evaluator ponownie tylko dla zmienionych plikow, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (push tylko na wip/R-RUSTPORT-P6-AIPEACE-V2-MIGRACJA-Q1-wip; bez integracji i bez rust-port/parity-v2).

---

## Odpowiedzi na zarzuty

### Zarzut 1 (istotny, DECYZJA): tick_scenarios_match_web zostaje na V1 z #[allow(deprecated)]
Odpowiedz: PRZYJMUJE fakt. Nie poprawiam samodzielnie.
- Stan: tests/p6_dyplo_multiwar2_peace_ai.rs:358 (`#[allow(deprecated)]`) i literal AiPeaceTickEnv ~463 zostaja na V1; run_ai_ai_peace_tick jest `#[deprecated]` (diplomacy_ai_forced_peace.rs ~728), nie usuniety.
- Dlaczego nie poprawiam: zrobienie tego na V2 wymaga zmiany oczekiwanych wektorow (pin web 07d2fbd72 jest tylko do odczytu, wektory pochodza z weba) albo decyzji, czy V1 usunac wraz z ta obsluga testu. To decyzja wlasciciela, nie Operatora.
- Rozjazd V2 (gate:too_early vs balance_blocked dla bramka_too_early_wait_potem_force_przy_limicie) pochodzi z raportu operatora r1; NIE_ZMIERZONO w tej rundzie (nie odtwarzalem).
- Opcje do ABC (rekomendacja: A):
  A) zostawic V1 dla tego jednego testu do czasu regeneracji wektorow z pinu (zero zmian danych; V1 pozostaje #[deprecated]);
  B) zregenerowac oczekiwane wektory tick_scenarios_match_web z pinu web 07d2fbd72 pod V2 (zmiana danych testowych, wymaga zgody);
  C) usunac V1 i przepisac ten test na V2 razem z wektorami (najwieksza zmiana).

### Zarzut 2 (drobny): komentarz diplomacy_ai_forced_peace.rs:421 mowi, ze V1 "zostaje bez zmian"
Odpowiedz: PRZYJMUJE. Poprawka w 7bd333cec: naglowek bloku (diplomacy_ai_forced_peace.rs ~419-423) opisuje teraz `run_ai_ai_peace_tick` jako `#[deprecated]` bez wolajacych w produkcji. Dodatkowo poprawiony docstring decide_ai_peace_request (~277): obejscie w war_turn_ai_ai.rs opisane jako "dawniej", usuniete w tym temacie.

### Zarzut 3 (drobny): usuniety min_balance_pn, test nie wykryje zmiany progu w pinie
Odpowiedz: ODRZUCAM (dowod istniejacego testu).
- tests/p6_aipeace_balans.rs:163-171, test `min_balance_constant_matches_data_file`: `assert_eq!(AI_AI_PEACE_MIN_BALANCE, from_json)` gdzie from_json = `pokojAiAi.minBilansPW` z `PEACE_PARAMS = include_str!("../data/derived/diplomacy-war-peace-params.json")` (p6_aipeace_balans.rs:17). Zmiana progu w pliku danych albo w stalej Rust czerwieni ten test.
- Wektory W7 maja minBalancePn=0 i nie sa jedynym strażnikiem progu; to nie jest luka.
- NIE_ZMIERZONO: zgodnosc derived/diplomacy-war-peace-params.json z gra/data/diplomacy-war-peace-params.json w tej rundzie nie byla sprawdzana osobno.

### Zarzut 4 (drobny): migrowane testy zawsze podaja loser_balance_for = Some, brak pokrycia None w run_ai_ai_peace_turn
Odpowiedz: PRZYJMUJE. Dodany test w tests/p6_wire_war_siege_aiai_seq.rs: `loser_balance_none_checks_only_winner_balance`.
- Semantyka (web `isAiAiPeaceBalanceAllowed(winner, loser|undefined, min)`, diplomacy_ai_forced_peace.rs ~535): None = bilans przegranego nie jest sprawdzany.
- Ten sam wpis, bilans zwyciezcy po zaplacie = 10: loser = None -> AcceptPaid, jedna zaplata (1, 10.0); loser = Some(-1000) -> Wait, brak zaplaty, wpis zostaje w magazynie.
- Test przechodzi (4/4 w binarce seq).
- Commit kodu: 7bd333cec.
