# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 — Obrona Operatora (02a), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 część A)
GOAL: zdobycie miasta po wygranym szturmie gracza z wyłomem zastosowane do `PlayableState` w kolejności pinu `07d2fbd72`.
BAZA OBRONY: `df22a1486` (raport Evaluatora na kodzie Operatora `81662fd38`; baza tematu `01abcbf5e` = `origin/rust-port/parity-v2`).
ZMIANY/COMMIT: gałąź `rust-port-wip/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1-obrona`: `92fe96869` (N1), `193377dbd` (N2/N3), `ce2d60c00` (fmt), commit raportu — SHA w wyniku Workflow. Pliki: `engine/src/domain/city_capture_apply.rs`, `engine/tests/p6_zdobycie_miasta_a.rs`, `engine/tests/p6_zdobycie_miasta_a_gen.mjs`, `engine/tests/p6_zdobycie_miasta_a_vectors/vectors.json`, ten raport. Wszystkie w allowliście.
RUNDY: 1/5 (obrona)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### N1 (economy.units po splice P9) — PRZYJMUJĘ, i znaleziony realny błąd stanu

- Poprawka testu: `diffs()` w `p6_zdobycie_miasta_a.rs` porównuje po każdym scenariuszu zbiór kluczy `state.economy.units` ze zbiorem id `state.units` (pin: jednostka to jeden obiekt, usunięcie kasuje wszystkie jej dane).
- Nowa asercja od razu wykryła błąd poza splice: scenariusz `eliminacja` zostawiał osierocone wpisy `economy.units` dla `8003`, `8100` (`rust {7001..7005, 8003, 8100}` vs `pin {7001..7005}`). Przyczyna: `eliminacja::eliminate_owner` robi tylko `state.units.retain(..)`, a pin `eliminateOwner` → `disbandOwnerUnits` usuwa obiekt jednostki w całości.
- Poprawka kodu (adapter w nowym module, `city_capture_apply.rs`, gałąź `eliminateOwner` w `capital_plunder`): przed `eliminate_owner` zbiera id jednostek ofiary, po nim usuwa ich wpisy z `economy.units`. `eliminacja.rs` nie jest w allowliście, więc poprawki tam nie robię — dług niżej (ZMA-DL-4).
- Dowód: mutanty `E02` (usunięcie `state.economy.units.remove(&uid)` w splice P9) i `MN1` (usunięcie nowego adaptera) — oba ZABITE (`obronca_na_centrum_i_splice`/`wipe_i_splice: klucze economy.units` oraz `eliminacja: klucze economy.units`).
- Commit: `92fe96869`.

### N2 (pola wyniku mostu bez dokładnej wartości) — PRZYJMUJĘ

- Generator: nowe pola `expected.hookCalled`, `removedUnitIds`, `enteredUnitIds`, `treasuryTaken`, `techsCopied` pochodzą z obserwacji wykonania tekstu pinu, bez powielania logiki:
  - `wipeDefenderOnCityCenter`: na czas `applyPostBattleMap` własność `units.splice` instancji tablicy zapisuje id usuwane, gdy stos wywołań zawiera `wipeDefenderOnCityCenter` (pin usuwa przez `removeUnitById` → `units.splice`, `post-battle-map.ts:85-88`, `:191-199`); potem `delete units.splice`;
  - splice P9: różnica id przed/po `PBM.applyCityCaptureAfterBattle`, od końca tablicy (pętla pinu `:510-515` idzie od końca);
  - wejście na heks: jednostki rosteru atakującego, które znalazły się na heksie miasta po `applyPostBattleMap`, potem dopisane po P9 (kolejność rosteru, bez powtórzeń);
  - `treasuryTaken` / `techsCopied`: różnica akcesorów `getTreasury` / `getResearchedTechs` zdobywcy wokół `runCapitalCapturePlunder`.
- Przy tym poprawiłem błędny opis wektora: w `obronca_na_centrum_i_splice` routowany obrońca `8002` znika w `applyManualSurvivors` (poza ocalałymi zwycięzcy), a nie przez `wipeDefenderOnCityCenter`. Dla pokrycia wipe dodałem scenariusz `wipe_i_splice` (obrońca rosteru `8003` spoza logu sceny stoi na centrum → wipe; `8004` spoza rosteru → splice P9): `removedUnitIds = [8003, 8004]`.
- Test: `diffs()` porównuje te 4 pola dokładnie (lista id w kolejności, `f64` przez `Debug`, lista technologii) i `res.capture.is_some() == hookCalled`; `wektory_pinu_sha_i_pokrycie` wymaga scenariuszy z niepustym `techsCopied`, `treasuryTaken > 0`, `removedUnitIds` i `enteredUnitIds` o długości ≥ 2.
- Dowód (mutanty, wszystkie ZABITE): `E10` `treasury_taken = 0` (`stolica_sukcesja: 0.0 != 75.5`, `stolica_fallback_najstarsze`, `eliminacja`), `E11` `techs_copied` puste (`eliminacja: [] != ["brąz","pismo"]`), `E20` bez deduplikacji (`zwykle_miasto: [7001,7002,7001,7002] != [7001,7002]`), `E21` bez wpisu splice P9 (`obronca_na_centrum_i_splice: [] != [8004]`, `wipe_i_splice: [8003] != [8003,8004]`).
- Commit: `193377dbd` (+ `ce2d60c00` fmt).

### N3 (fort nie rozstrzyga terytorium cudu w żadnym wektorze) — PRZYJMUJĘ, i błąd wejścia generatora

- Znaleziony błąd generatora: forty w wejściu miały pole `kind: 'fort'`, a `FortNode` pinu ma pole `type` (`fort-territory.ts:124-133`, `isFort: f.type === 'fort'`). Z `kind` węzeł fortu był traktowany przez pin jak MIASTO z `pop: 0` (promień 5, priorytet miasta) — dlatego fort w `cuda_terytorium` nie mógł zachowywać się jak fort. Poprawione na `type: 'fort'`; po regeneracji `expected` wszystkich 12 starych scenariuszy jest identyczne jak w `81662fd38` (sprawdzone skryptem: porównanie `expected` bez nowych pól — 12/12 równe; zmieniło się tylko wejście `forts` w `cuda_terytorium`, którego test Rust i tak nie czyta jako `kind`).
- Nowy scenariusz `cuda_fort_decyduje` (wg `territory.ts:122-160`: heks w promieniu miasta rozstrzygają tylko miasta; fort tylko teren wolny od miast): miasto 900 pop 7 (promień 7), cud `piramidy` 101 na (9,7) w odległości 7 → przed: 101. Po zdobyciu strata ludności → pop 6, promień 6 → heks poza miastami; fort gracza na (9,8) (promień 5) → po: gracz → cud przechodzi na gracza. Bez węzłów fortów heks byłby niczyj → brak przekazania.
- Dowód: mutant `E05` (pominięcie fortów w `territory_nodes`) ZABITY (`cuda_fort_decyduje: cuda rust [("piramidy", 101)]`, `cuda przekazane`). Test pokrycia wymaga tego scenariusza z niepustym `wonderTransfers` i niepustymi fortami.
- Commit: `193377dbd`.

### N4 (kolejka produkcji, Prawo, zdarzenia, kronika poza stanem) — ODRZUCAM jako zarzut wobec kodu tej rundy; decyzja i wpis należą do orkiestratora

Dowody, że w tej rundzie nie da się tego zrobić w allowliście bez zgadywania:
- `PlayableState` (`engine/src/domain/playable.rs`) nie ma pola kolejki produkcji miasta (`grep city_prod|production_queue|cityProd` w `playable.rs` = 0 trafień), pól Prawa/rebelii, magazynu zdarzeń zdobycia ani kroniki. Allowlista dopuszcza w `playable.rs` „tylko pola/metody konieczne” — dodanie pól kolejki/Prawa wymaga też zapisu/odczytu (`save_load.rs`, poza allowlistą), producentów i wektorów; to osobny temat stanu, nie adapter.
- `siege_transfer::apply_transfer_with_effects` (`siege_transfer.rs:340-347`) przyjmuje `TransferCity`, `Vec<EnterUnit>`, `Option<TransferProduction>`, `TransferExtras` — bez pól stanu dla produkcji/Prawa wywołanie mogłoby dostać tylko `None`/puste wejścia, czyli nic nie zmieniłoby w `PlayableState`. P9 złożono z tych samych klocków (`apply_capture_population_loss`) bez sztucznego wołania.
- Pominięcie jest jawne w wyniku mostu (`not_applied`, `NOT_APPLIED_ALWAYS`, test `brak_zdobycia_ma_jawny_powod_i_liste_pominietych`) i w D-ZMA-4 raportu Operatora.
- Propozycja wpisu do `dyspozycje/rust-port/REJESTR-RUST.md` (plik poza allowlistą — wpisuje orkiestrator): „#354-A: kryterium końca »kolejka produkcji« oraz `applyPostCaptureLawOnCapture`, `recordCityCaptureEvent`, `noteCityCapture` — NIE_ZASTOSOWANO (brak pól w `PlayableState`); jawne w `CityCaptureResultDto.not_applied`. Temat następczy: ZDOBYCIE-MIASTA-STAN (pola `cityProd`/Prawo/zdarzenia/kronika w `PlayableState` + save_load + podpięcie `apply_transfer_with_effects` z `TransferProduction` w `apply_storm_capture`)”.

### N5 (klej `main.ts` przepisany) — ODRZUCAM (brak wady; uwaga informacyjna)

- Evaluator sam zweryfikował klej z tekstem pinu (`:11488-11493`, `:11543-11550`, `:36034-36264`) i potwierdził zgodność. Funkcje `main.ts` są domknięciami nieładowalnymi bez całej gry; wszystko, co ładowalne (P9, `capital-capture.ts`, `barbarians.ts`, `wonder-transfer.ts`, `territory.ts`, `fort-territory.ts`, `siegeMachines.ts`, `diplomacy-siege-war-gate.ts`, `battleScene`), jest wykonywane z tekstu pinu pod strażnikiem SHA-256 (`a5810e8a…8979`, niezmieniony po tej rundzie).
- W tej rundzie nowe pola wektorów są wyłącznie obserwacją wykonania pinu (N2), a jedyny znaleziony błąd generatora (pole `kind` zamiast `type` fortu, N3) dotyczył kształtu danych wejściowych, nie przepisanego kleju — poprawiony, wyniki starych scenariuszy bez zmian.

### N6 (`captured_from_owner_by_city` w save_load) — ODRZUCAM w tej rundzie (poza allowlistą); dług potwierdzony i zmierzony

- Pomiar: `grep captured_from_owner_by_city` w `engine/src` — odwołania wyłącznie w `playable.rs` (pole + 2 inicjalizatory) i `city_capture_apply.rs`; w `save_load.rs` brak. Zapis w formacie webu NIE przenosi pola (`capturedFromOwnerId` gubione przy zapisie/odczycie). Serde `PlayableState` ma `#[serde(default, skip_serializing_if = "BTreeMap::is_empty")]`, więc stan bez wpisów jest bajt w bajt jak przed tematem.
- `save_load.rs` nie jest w allowliście → dług ZMA-DL-2 (bez zmian): mapowanie `capturedFromOwnerId` w zapisie/odczycie + ustawianie przez kapitulację W4 przy jej wpięciu.

### N7 (D-ZMA-5, mapowanie id 1↔0 bez obserwowalnego testu) — ODRZUCAM w tej rundzie; dług potwierdzony

- Skutek mapowania w `run_capital_capture_plunder` dotyczy tylko wywołań UI (triumf, `recordCivElimEvent`, `siege_capital_plunder.rs:672-724`), których wynik mostu nie przenosi; stan jest identyczny (E01 równoważny wg Evaluatora). Test z obserwowalnym skutkiem będzie możliwy przy wpięciu skutków UI zjednoczenia/triumfu (dług ZMA-DL-5 dla tego tematu następczego).

## Mutanty obrony (7, bramka: `p6_zdobycie_miasta_a` + `p6_zdobycie_miasta_a_bridge`, skrypt na kopii źródła, plik przywrócony)

| Mutant | Opis | Wynik |
|---|---|---|
| E02 | bez `economy.units.remove` w splice P9 | ZABITY |
| E05 | `territory_nodes` bez fortów | ZABITY |
| E10 | `treasury_taken = 0` | ZABITY |
| E11 | `techs_copied` puste | ZABITY |
| E20 | wejście na heks bez deduplikacji | ZABITY |
| E21 | brak wpisu splice P9 w `removed_unit_ids` | ZABITY |
| MN1 | bez nowego adaptera `economy.units` po eliminacji | ZABITY |

Łącznie z Operatorem i Evaluatorem: 6 luk z 02 zamkniętych; brak przeżywających nierównoważnych.

## Bramki (z `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target w scratchpadzie `zma-obrona/target`, usunięty po bramkach)

- `cargo fmt --all -- --check`: EXIT 0 (po `cargo fmt`, commit `ce2d60c00`).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p6_zdobycie_miasta_a --test p6_zdobycie_miasta_a_bridge`: 6 + 7 passed, 0 failed.
- Pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, checkout z `dyspozycje/`, na `ce2d60c00`): EXIT 0 — 551 binarek, 4188 passed, 0 failed, 1 ignored (istniejący przed tematem). Liczba testów bez zmian względem 02, bo obrona dodała asercje i scenariusze w istniejących testach, a nie nowe funkcje testowe.
- Generator `node rust-port/engine/tests/p6_zdobycie_miasta_a_gen.mjs`: pinSha256 `a5810e8a71a92c5422914e24de5e00170a7b000250ad6b242e7c4e3411878979` (strażnik bez zmian), MD5 `vectors.json` = `8bac5a9332f5ad8707a4b0f6137368af` (nowy; 14 scenariuszy), plik w commicie = wynik generatora.

## Długi

- ZMA-DL-2 (bez zmian, zmierzone): `captured_from_owner_by_city` poza `save_load.rs`; kapitulacja W4 musi go ustawiać.
- ZMA-DL-4 (nowy): `eliminacja::eliminate_owner` nie usuwa wpisów `economy.units` jednostek ofiary (pin `disbandOwnerUnits` usuwa obiekt w całości). W tym temacie domknięte adapterem w `city_capture_apply.rs`; poprawka u źródła (`eliminacja.rs`, poza allowlistą) dla pozostałych przyszłych wołających.
- ZMA-DL-5 (N7): test z obserwowalnym skutkiem mapowania id 1↔0 przy wpięciu skutków UI zjednoczenia/triumfu.
- N4: temat następczy ZDOBYCIE-MIASTA-STAN (kolejka produkcji, Prawo po podboju, zdarzenia zdobycia, kronika) + wpis w `REJESTR-RUST.md` (orkiestrator).

## Następny krok

Final Control (03) na commicie obrony.
