# R-RUSTPORT-P4-1H-MOVE-Q6 — 02a Obrona Operatora (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-MOVE-Q6
GOAL: `move_unit` = `planMarchTo` + `executeMarchSegmentForUnit` (bez reguły „tylko sąsiad”, ruch `f64`), odpowiedź na zarzuty Evaluatora (`02-evaluator.md`, commit `fa15185f5`).
ZMIANY/COMMIT: baza = commit Operatora `b5057adea` (rodzic `9f1a29af3` = baza z dispatchu). Gałąź lokalna `rust-port/wip/R-RUSTPORT-P4-1H-MOVE-Q6-obrona-r1`, bez push. Zmienione pliki (oba z allowlisty): `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/tests/p4_1h_move_q6.rs`, oraz ten raport. SHA: patrz wynik końcowy (commit obrony).
TESTY: patrz §Bramki.
BLOKADY: brak technicznych. Zarzuty 2 i 3 to zależności od tematów poza zakresem Q6. Wpis do rejestru należy do orkiestratora (rejestr jest poza allowlistą), propozycja wpisu jest niżej.
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (allowlista, proceduralny): ODRZUCAM jako wadę wymagającą poprawki. Fakt jest prawdziwy i był ujawniony w raporcie Operatora.

Dowód:
- `git grep -l 'PlayableUnit {' 9f1a29af3 -- rust-port/engine/tests` daje 11 plików. Nie ma na tej liście ani `playable_slice.rs`, ani `p6_unit_replace_l3_state.rs`. Literalne naruszenie kryterium 3 jest więc faktem.
- `p6_unit_replace_l3_state.rs:336`: `before.units[0].movement = 0;` przestaje się kompilować po zmianie typu wymaganej przez erratę 1 dispatchu (`u8` → `MovementPoints`). Cofnięcie tej jednej linii daje błąd kompilacji celu testowego, czyli pełna bramka `cargo test --all-targets` nie przejdzie. Errata 1 wymusza tę zmianę, a polecenie `git grep` z erraty jej nie wykrywa, bo plik nie zawiera literału `PlayableUnit {`, tylko przypisanie pola.
- `playable_slice.rs:58-68` sprawdzał regułę „tylko sąsiad”. ZAKRES pkt 2 dispatchu każe tę regułę usunąć, a obowiązkowe źródło (`P4-1H-COMMANDS-ROZPOZNANIE.md` §4, wiersz Q6) wprost wskazuje aktualizację tego testu. Zostawienie starego testu oznacza czerwoną bramkę albo `#[ignore]`, a jedno i drugie zabrania kryterium 3.
- Obie zmiany są minimalne (1 linia oraz zamiana jednej asercji), nie osłabiają innych asercji i nie dodają `#[ignore]`.

Wniosek: w tej rundzie nic nie cofam, bo cofnięcie łamie kryteria 1–3. Rozszerzenie allowlisty o te 2 pliki to decyzja proceduralna dla Final Control i orkiestratora (Evaluator rekomenduje akceptację).

### Zarzut 2 (stos na heksie wroga, zależność): PRZYJMUJĘ wpis zależności. Bez zmiany kodu, bo bitwa jest poza zakresem dispatchu.

Dowód z pinu `07d2fbd72`:
- `main.ts:44100-44107` (koniec animacji segmentu): stos dostaje `su.q = destQ; su.r = destR` i `deductStackRuchLeft`. Dopiero później, w `:44180-44184`, wywoływane jest `tryLaunchMarchAttack(u, attackTargetId)`. Także w webie stos najpierw staje na końcu odcinka, a bitwa startuje dopiero potem.
- `tryLaunchMarchAttack` (`main.ts:31132-31144`) robi `clearPlannedMarch(atkUnit.id, true)` i `openPlayerMapUnitAttack`. Wywołują ją `:31663` (`executeMarchSegmentForUnit`, ścieżka bez animacji) i `:44184` (koniec animacji).
- ZAKRES pkt 3 dispatchu: „cel = wróg: zapisz plan, bitwa poza zakresem”. Rust zachowuje się zgodnie z dispatchem: plan z `attack_unit_id` zostaje, bitwa nie startuje.

Proponowany wpis do `dyspozycje/rust-port/REJESTR-RUST.md` (wykonuje orkiestrator):
> ZALEŻNOŚĆ Q6 → `R-RUSTPORT-P4-1H-MARCH-ATTACK-LAUNCH` (nowe ID): port `tryLaunchMarchAttack` (`main.ts:31132-31144`) z wołaniami `:31663` i `:44184`. Obejmuje: widoczność celu (`:31135`), `hexDistance ≤ 1` (`:31136`), `clearPlannedMarch(force=true)` i start bitwy (`openPlayerMapUnitAttack`). Do czasu wpięcia `PlayableState` po `move_unit` z `attack_unit_id` może mieć stos gracza na heksie wroga z zachowanym planem ataku. Zależy od P4-1C (mgła) oraz od wpięcia bitwy mapy (P4-1I).

### Zarzut 3 (widoczność celu ataku): PRZYJMUJĘ jako NIE_ZMIERZONO z zależnością. Bez zmiany kodu.

Dowód:
- Pin: `planMarchTo` `main.ts:31248-31251` (`currentVisible().has(...)` → „Cel niewidoczny (mgła).”, `return false`) i `tryLaunchMarchAttack` `:31135`.
- `PlayableState` (`playable.rs`, `pub struct PlayableState`) nie ma pola mgły ani widoczności. Mgła to temat P4-1C FOG-VIEW, który czeka na decyzję właściciela. Sprawdzenia nie da się przenieść bez wymyślania zbioru widoczności, a zasada 11 tego zabrania.
- Luka jest jawnie zapisana w `01-operator-r1.md` (NIE_ZMIERZONO). Ten sam wpis zależności co w zarzucie 2 plus zależność od P4-1C: po wpięciu mgły `move_unit` ma odmówić planu ataku na niewidoczny cel.

### Zarzut 4 (niezmiennik `Eq` dla `MovementPoints`): PRZYJMUJĘ. Poprawka wprowadzona.

Zmiana (`rust-port/engine/src/domain/playable.rs`):
- `MovementPoints::new` dostał `debug_assert!(value.is_finite(), "MovementPoints: wartosc nieskonczona lub NaN")`. `is_finite` jest `const` od Rust 1.83, a toolchain to 1.97.
- `From<f64>` przechodzi przez `Self::new`, więc oba publiczne konstruktory pilnują niezmiennika.
- Odczyt JSON (`Deserialize`) zostaje bez zmian. Standardowy JSON nie ma NaN ani Inf, a serde_json zwraca błąd dla liczby spoza zakresu.

Testy (`rust-port/engine/tests/p4_1h_move_q6.rs`, 3 nowe):
- `movement_points_new_odrzuca_nan_w_debug` (`#[should_panic]`, `cfg(debug_assertions)`);
- `movement_points_from_f64_odrzuca_nieskonczonosc_w_debug` (`#[should_panic]`, `cfg(debug_assertions)`);
- `movement_points_skonczone_wartosci_bez_zmian` (1/3, 2,5 oraz `-0 == ZERO`).

Mutacja (usunięcie `debug_assert!`): `cargo test --test p4_1h_move_q6` daje `FAILED. 21 passed; 2 failed` (oba testy `should_panic`). Po przywróceniu: `ok. 23 passed; 0 failed`.

### Zarzut 5 (`PlayableGame::from_state` bez wołającego produkcyjnego): ODRZUCAM jako wadę. Zarzut informacyjny.

Dowód: to publiczny konstruktor scenariuszy testowych, opisany w `01-operator-r1.md`. Nie zmienia ścieżki produkcyjnej `move_unit`, którą woła `bridge.rs` (oba adaptery, potwierdził Evaluator), i nie wpływa na parytet. Sam Evaluator klasyfikuje ten punkt jako informacyjny.

## Bramki (rust-port/engine, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --all-targets --no-fail-fast`: EXIT 0. Wszystkie 489 binarek testowych, łącznie 3613 passed, 0 failed, 1 ignored (istniejący wcześniej). To o 3 testy więcej niż w przebiegu Evaluatora (3610), czyli dokładnie 3 nowe testy z zarzutu 4. Przebieg w jednym ciągu, bez dzielenia na partie.

Cargo.lock nie jest w commicie. CARGO_TARGET_DIR został usunięty po bramkach.
