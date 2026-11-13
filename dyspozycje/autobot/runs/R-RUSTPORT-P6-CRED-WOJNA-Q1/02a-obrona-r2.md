STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-WOJNA-Q1 (zadanie #103), obrona Operatora po FC r2 (runda 2/5, ten sam ID)
GOAL: odpowiedź na każdy zarzut FC r2 (PRZYJMUJĘ z dowodem / ODRZUCAM z dowodem), bez zmian kodu poza allowlistą.
ZMIANY/COMMIT: brak zmian kodu produkcyjnego i testowego; tylko ten plik. Kod r2 pozostaje na SHA 811f607ee.
  Baza obrony: 811f607ee (wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-r2-obrona). Plik `02a-obrona.md` z r1 NIE został nadpisany; ten plik to `02a-obrona-r2.md`.
TESTY (zmierzone przez obrońcę, 811f607ee, CARGO_TARGET_DIR poza repo, usunięty po bramkach):
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --no-fail-fast (cały crate): passed=3190 failed=0 ignored=1, EXIT 0. Jedyny ignorowany: `e2e::dump_tick1_econ_for_web_generator` (istniejący przed r2, poza diffem r2; w p6_cred_wojna_vectors.rs nie ma #[ignore]).
  - p6_cred_wojna_vectors: 4/4 ok (hook_p4_counter_matches_pin_for_all_cases, p4_milestones_and_last_war_match_pin_in_both_orders, s3_trade_stream_umowa_handlowa_three_turns_matches_pin, vectors_carry_pin_and_guard_hashes).
  - Generator: `node p6_cred_wojna_gen.mjs <esbuild 0.24.2> <pin 07d2fbd72 gra/src+gra/data> <work> <out>`: EXIT 0, wynik `{"hookCases":160,"hookWarsRecorded":147,"hookBarbarian":13,"orderSequences":60,"orderMilestonePositive":375,"orderOrderDiffers":306,"s3Cases":20,"s3TradeEntryPresent":50,"s3TradeEntryAbsent":10}`. Wygenerowany vectors.json JEST BAJT-W-BAJT zgodny z committed `rust-port/engine/tests/p6_cred_wojna_vectors/vectors.json`.
BLOKADY: patrz poniżej (zarzut 1 i 6 wymagają decyzji orkiestratora).
RUNDY: 2/5 (obrona w ramach rundy 2). Bez nowej rundy kodu.
NASTĘPNY KROK: orkiestrator — decyzja w sprawie bazy (pkt 1a) i allowlisty/#120 (pkt 1b). Dopiero po tym kolejna runda Operatora.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty FC r2

### Zarzut 1 — kryterium 1 niespełnione: pin 41931 (wojna wymuszona) nie woła haka w `declare_forced_wars` (war_turn_declare.rs:105)

**Status: PRZYJMUJĘ jako fakt dla bazy r2, ODRZUCAM wniosek, że brak pokrycia dotyczy linii parity. Naprawy nie wykonano (plik poza allowlistą r2).**

Dowody:
- Pin 07d2fbd72 `gra/src/main.ts:41931`: `const truceBreachAi = chargeWarDeclarationCredibility(ownerId, targetId);` — potwierdzone.
- Baza r2 `15d85c2ee` i `811f607ee`: `git grep note_war rust-port/engine/src/domain/war_turn_declare.rs` = brak wyników; `declare_forced_wars` (war_turn_declare.rs:105) nie woła haka. Potwierdzone (zgodnie z zarzutem).
- Linia parity: `23e33793e` (czubek origin/rust-port/parity-v2) w `war_turn_declare.rs:116` WOŁA `note_war_declarations(state, &pairs, turn)?;` na początku `declare_forced_wars`, przed mutacją stanu wymuszeń. Potwierdzone przez `git show 23e33793e:rust-port/engine/src/domain/war_turn_declare.rs`. Czyli pokrycie wojny wymuszonej (pin 41931) istnieje na linii parity.
- Przyczyna rozbieżności: `15d85c2ee` jest przodkiem `23e33793e`; `git rev-list --count 15d85c2ee..23e33793e` = 155 commitów. `merge-base(15d85c2ee, 23e33793e) = 15d85c2ee`. Baza r2 jest więc starsza o 155 commitów niż parity-v2 i nie zawiera późniejszych zmian `war_turn_declare.rs` (w tym hooka i `Result`/`WarTurnError`). `git diff --stat 23e33793e 811f607ee -- rust-port/engine/src` = 25 plików, 121 insertions, 1152 deletions: integracja kodu r2 na parity cofnęłaby 155 commitów. Dlatego nie wolno integrować `811f607ee` jako takiego.
- Zmiana r2 względem bazy `15d85c2ee` dotyka WYŁĄCZNIE: 4 plików testowych (`p6_cred_wojna_gen.mjs`, `p6_cred_wojna_vectors.rs`, `vectors.json`) i raportu `01-operator-r2.md`. Brak zmian w `src/`.

Decyzje dla orkiestratora (nie rozstrzygam sam):
- 1a. Baza: dispatch wymaga bazy `15d85c2ee`, ale ta baza jest 155 commitów za parity. Propozycja: przenieść 4 pliki testowe r2 na `23e33793e` (nowa baza) i ponownie uruchomić bramki tam; wtedy kryterium 1 należy sprawdzić na kodzie, który trafia do parity. Wymaga osobnej decyzji, bo dispatch wyraźnie zakazuje startu z `23e33793e`.
- 1b. Jeśli baza zostaje `15d85c2ee`: kryterium 1 jest niespełnione na tej bazie (zgodnie z zarzutem), a wpięcie hooka w `war_turn_declare.rs` wymaga rozszerzenia allowlisty lub #120. Pozostałe ścieżki (13168, 13205, 23806, 40441) według raportu r2 nie mają wołania haka na żadnej bazie (zweryfikowane przez FC r1 na 23e33793e); to zakres #120.

### Zarzut 2 — test kolejności D4/D8 wywołuje prymitywy, nie produkcyjny pipeline (turn_war_pipeline.rs ok. 417)

**Status: PRZYJMUJĘ. NAPRAWY NIE WYKONANO w tej rundzie.**

Dowód: w `p6_cred_wojna_vectors.rs` (test `p4_milestones_and_last_war_match_pin_in_both_orders`) D4 jest wołane jako `reg.tick_no_war_milestone(o, turn, p)` w domknięciu `d4`, a D8 jako `reg.note_war_entered(a, b, turn)` w domknięciu `d8`. Obie kolejności składane są przez test, nie przez `run_dipl_steps` (turn_war_pipeline.rs:370) ani `note_war_declarations` (turn_war_pipeline.rs:422). Zmiana kolejności w produkcyjnym pipeline NIE zostałaby wykryta. Dodatkowo: sam test importuje `note_war_declarations`, ale do D8 używa `note_war_entered`, czyli inna ścieżka niż produkcyjna.
Dlaczego nie naprawiono: podpięcie pipeline wymaga harnessu `run_war_turn` (stan, kontekst, RNG), a w tej rundzie allowlista to testy P6 i nie ma gotowego punktu wejścia do samej kolejności. Propozycja: osobny zakres (np. nowy test na poziomie `run_war_turn` z asercją kolejności), do decyzji orkiestratora.

### Zarzut 3 — test haka porównuje tylko licznik `lastWar`; N1/N2, rozejm i kasowanie oferty nie są modelowane

**Status: PRZYJMUJĘ (ograniczenie zakresu, już zapisane jako NIE_ZMIERZONO w `01-operator-r2.md`).**

Dowód: `CredibilityRegistry::note_war_entered` (credibility.rs:854) aktualizuje wyłącznie licznik P4; `p6_cred_wojna_vectors.rs` (nagłówek) jawnie zawęża porównanie do `lastWar` i kamieni milowych. Generator wykonuje N1/N2, rozejm i kasowanie oferty z pinu, ale test ich nie porównuje. Zgodnie z GOAL (a) dispatchu (pokrycie ścieżek wejścia w wojnę hakiem P4) jest to poza zakresem tego zadania; nie naprawiono.

### Zarzut 4 — kolejność w Rust pomija `update_streams_this_turn`, generator wywołuje `updateStreams` w D4

**Status: PRZYJMUJĘ (drobne). NAPRAWY NIE WYKONANO.**

Dowód: w `p4_milestones_and_last_war_match_pin_in_both_orders` domknięcia `d4` i `d8` nie wołają `update_streams_this_turn`. Wywołanie `reg.update_streams_this_turn(&active, d, p)` (linia ok. 313) występuje wyłącznie w teście S3, poza testem kolejności. Strumienie są więc poza porównaniem kolejności względem haka.

### Zarzut 5 — stary `p6_credibility_gen.mjs` wywołuje hak przed D4 (odwrotnie niż pin); plik poza allowlistą

**Status: PRZYJMUJĘ jako fakt. NIE ZMIENIANO (poza allowlistą).**

Dowód: `git show 811f607ee:rust-port/engine/tests/p6_credibility_gen.mjs`, linie ok. 278-288: `registry.lastWar.set(a/b, turn)` (hak P4, komentarz `main.ts:12223`) pojawia się PRZED `M.updateWiarygodnoscStreamsThisTurn()` i `M.tickWiarygodnoscBezWojnyMilestone(o)`. Pin: `updateWiarygodnoscStreamsThisTurn` i `tickWiarygodnoscBezWojnyMilestone` to `main.ts:24272-24273`, a hak wojny wymuszonej `main.ts:41931`; kolejność wykonania w turze poza zakresem tej obrony nie została zweryfikowana w kodzie wykonawczym. Plik stary, nie został dotknięty. Decyzja orkiestratora: dopisać adnotację w starym generatorze albo wyłączyć wektory `p6_credibility` z tej kolejności.

### Zarzut 6 — konflikt źródeł: FC r1 w gałęzi `-fc` to PASS-WITH-NOTES, dodatek r2 mówi FAIL; dodatek twierdzi, że `15d85c2ee` jest przodkiem `origin/claude/rust-sivvrn`

**Status: PRZYJMUJĘ (oba elementy są prawdziwe). Rozstrzygnięcie procesowe: orkiestrator.**

Dowody:
- `git merge-base --is-ancestor 15d85c2ee origin/claude/rust-sivvrn` = NIE. Twierdzenie dodatku r2 jest fałszywe. `15d85c2ee` JEST przodkiem `origin/rust-port/parity-v2` (potwierdzone).
- Gałąź `6a4fc2d51` (`origin/rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-fc`), plik `03-final-control.md`: STATUS PASS-WITH-NOTES, bazy 23e33793e, twierdzenie o `war_turn_declare.rs:116`. Ten wpis jest ZGODNY z kodem `23e33793e` (zweryfikowane, patrz zarzut 1), a NIE z bazą `15d85c2ee`. Oba źródła opisują różne bazy, co wyjaśnia sprzeczność, ale nie zmienia faktu, że dodatek r2 i FC r1 mają różne werdykty.
- Orkiestrator musi rozstrzygnąć, który werdykt FC r1 obowiązuje i na jakiej bazie r2 prowadzić weryfikację.

### Zarzut 7 — NIE_ZMIERZONO: brak odtworzenia generatora (brak esbuild), niedokończony pełny `cargo test`

**Status: ODRZUCAM w części dotyczącej braku dowodu — obie rzeczy zostały teraz zmierzone (dowody w sekcji TESTY powyżej).**

- Esbuild: zainstalowano `esbuild@0.24.2` w katalogu roboczym poza repo; generator uruchomiony z pinem `07d2fbd72` (`git archive gra/src gra/data`). EXIT 0. Wyjście bajt-w-bajt zgodne z committed `vectors.json`.
- `cargo test --no-fail-fast` na 811f607ee: 3190 passed, 0 failed (zgodnie z raportem r2).
- Mutacja kontrolna z raportu r2 (`note_war_entered(a, a, turn)`) NIE została powtórzona w tej obronie; dowód pozostaje ten z `01-operator-r2.md`.

## Podsumowanie dla orkiestratora

| # | Zarzut FC r2 | Decyzja obrony | Naprawa w tej rundzie |
|---|---|---|---|
| 1 | Pin 41931 bez haka w `declare_forced_wars` (baza r2) | PRZYJMUJĘ (baza r2) / ODRZUCAM (linia parity) | Nie — poza allowlistą; decyzja: baza i/lub #120 |
| 2 | Test D4/D8 bez produkcyjnego pipeline | PRZYJMUJĘ | Nie — wymaga harnessu `run_war_turn` |
| 3 | Hak tylko licznik `lastWar` | PRZYJMUJĘ (zakres) | Nie — poza GOAL (a) |
| 4 | Brak `update_streams_this_turn` w kolejności | PRZYJMUJĘ (drobne) | Nie |
| 5 | Stary generator z hakiem przed D4 | PRZYJMUJĘ (fakt) | Nie — poza allowlistą |
| 6 | Konflikt źródeł i fałszywy ancestry w dodatku | PRZYJMUJĘ | Nie — orkiestrator |
| 7 | NIE_ZMIERZONO (esbuild, pełny test) | ODRZUCAM brak dowodu — zmierzone | Tak (pomiary, bez zmian kodu) |
