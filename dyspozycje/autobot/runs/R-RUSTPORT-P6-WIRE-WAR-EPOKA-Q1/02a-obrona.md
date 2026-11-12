STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-EPOKA-Q1
GOAL: obrona Operatora po zarzutach Evaluatora (56e29635b, 02-evaluator.md): odpowiedz na kazdy z 8 zarzutow, poprawka + dowod albo odrzucenie z dowodem
ZMIANY/COMMIT: rust-port/engine/src/domain/turn_war_epoch.rs, rust-port/engine/src/domain/turn_war_inputs.rs (tylko tekst KNOWN_GAPS[0]), rust-port/engine/tests/p6_wire_war_epoch.rs, dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-EPOKA-Q1/01-operator-r1.md (przemianowany z 01-operator-r4.md), ten plik. SHA: patrz odpowiedz Operatora (plik nie moze zawierac wlasnego SHA).
TESTY: patrz sekcja DOWODY ponizej
BLOKADY: (1) integracja z origin/rust-port/parity-v2 po stronie orkiestratora (zarzut 5, zmierzone ponizej); (2) brak producentow populacji/kultury/budynkow/tech/religii i wspolnej granicy (bez zmian, znane luki)
RUNDY: 1/5 (obrona Operatora po Evaluatorze r1)
NASTEPNY KROK: Evaluator r2 (to samo ID), potem Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Zrodlo epoki czlowieka oznaczone jako Tracked: PRZYJMUJE
Poprawka: dodano `EpochSource::DerivedFromStartEra`. `OwnerEraFacts.human_era` niesie teraz pare `(f64, EpochSource)`;
`owner_era_facts` oznacza epoke startu czlowieka jako `DerivedFromStartEra`, a `empire_epoch_for_owner` zwraca
zrodlo z wpisu (nie na sztywno `Tracked`). Test `production_epochs_name_their_source_for_every_owner` oczekuje
`DerivedFromStartEra` dla czlowieka. Nowy test `production_source_is_never_tracked_because_state_has_no_epoch_entries`
sprawdza, ze w produkcji `owner_era_by_owner` jest puste i zadna epoka nie ma zrodla `Tracked`.
Wektory z pinu (`epoch_vectors_from_pin_match_the_decision_function`) nadal podaja `Tracked` jawnie, bo opisuja odczyt wpisu stanu.

### 2. Statyczna epoka miedzy turami bez testu i bez KNOWN_GAPS: PRZYJMUJE
Poprawka: wpis `KNOWN_GAPS[0]` (`turn_war_inputs.rs`) zawiera teraz jawne "LUKA: epoka STATYCZNA miedzy turami" z pinem
`syncOwnerEraFromResearch` / `reconcilePlayerEraFromResearch` (main.ts:2521). Naglowek `turn_war_epoch.rs` opisuje
luke i wskazuje test. Nowy test `owner_epochs_are_static_across_turns_known_gap` ustawia `state.turn = 40` i
sprawdza, ze epoki pozostaja `{1: 2.0, 2: 2.0}` (epoch_id "braz"). Test utrwala obecne zachowanie, NIE naprawia luki
(naprawa wymaga stanu badan w PlayableState, poza tematem). Liczba wpisow KNOWN_GAPS pozostaje 5, wiec asercja
`KNOWN_GAPS.len() == 5` w p6_wire_war_inputs.rs nie zostala zmieniona.

### 3. HumanEraMissing z produkcji jest niedosiegalne: PRZYJMUJE (wyjasnienie + test), bez zmiany mapowania
Fakt potwierdzony: wpisy `human_era` powstaja z tego samego zbioru `human_ids`, wiec w produkcji brak wpisu nie wystapi.
Mapowanie na `OwnerEpochUnavailable` zostaje, bo odpowiada wyjatkowi weba `playerStateByHuman.get(id)!` dla
wstrzyknietych faktow. Nowy test `production_human_era_covers_every_human_so_human_missing_is_unreachable` dodaje
drugiego czlowieka (id 3) i sprawdza, ze `owner_era_facts` ma wpisy dla kazdego czlowieka, a `epochs_from_state`
i `build_war_inputs` przechodza. Komentarz w `empire_epoch_for_owner` nazywa to wprost.

### 4. Wspolna granica jako BRAK bez wektorow: ODRZUCAM jako defekt; fakt bloka PRZYJMUJE
Dispatch (kryterium 3 GOAL) dopuszcza jawny BRAK z dowodem i opisem wejsc, jesli port wymaga danych nieobecnych w PlayableState.
Dowod, ze PlayableCity nie ma populacji (`rust-port/engine/src/domain/playable.rs:296-302`):
pola `id, owner_id, name, position, is_capital`. Pin: `ownersShareLandBorderLive` (main.ts:5690) =
`ownersHaveSharedLandBorder(a, b, buildAllTerritoryNodes(), map)`, wejscie `cityTerritoryRadius` zalezy od populacji.
Wektory nie maja sensu bez portu funkcji, a port ze stala populacja bylby cichym zalozeniem (zakazane przez dispatch).
Opis wejsc jest w `KNOWN_GAPS[1]`, a test `shared_border_producer_is_explicitly_unavailable_above_two_cities`
pokazuje jawny blad. Zgadzam sie, ze to drugi bloker obok `PowerComponentsMissing`; jest wymieniony w raporcie 01.

### 5. Rozjazd bazy z origin/rust-port/parity-v2: ODRZUCAM jako blad Operatora; fakt ZMIERZONY
Dispatch wskazuje baze 74c8456ff (FC W8 r5), nie parity-v2. Operator pracowal na bazie z dispatchu i zglosil odchylenie
w raporcie 01 (sekcja "Odchylenie od bazy"). Pomiar (tylko odczyt, bez zapisu do repo):
- `git merge-base 1f9665d93 origin/rust-port/parity-v2` = 5e58876fb,
- `git merge-base --is-ancestor 74c8456ff origin/rust-port/parity-v2` = nie (exit 1),
- `git rev-list --left-right --count 1f9665d93...origin/rust-port/parity-v2` = 13 / 26,
- `git merge-tree --write-tree origin/rust-port/parity-v2 1f9665d93` = exit 0 (brak konfliktow tekstowych w drzewie).
Clean merge w drzewie NIE dowodzi, ze po merge kompiluje sie i przechodzi testy. Ta bramka nie byla wykonana
(NIE_ZMIERZONO) i nalezy do orkiestratora (integracja). Operator nie integruje.

### 6. Nazwa raportu 01-operator-r4.md zamiast 01-operator-r1.md: PRZYJMUJE
Plik przemianowany `git mv` na `01-operator-r1.md`; odwolania w tresci poprawione.

### 7. Generator wektorow nie jest odtwarzany w bramkach: PRZYJMUJE, zweryfikowane
Odtworzenie: `git show 07d2fbd72:gra/src/main.ts` (poza repo, pin tylko do odczytu), esbuild 0.24.2 zainstalowany poza repo,
`node p6_wire_war_epoch_gen.mjs --main <pin> --esbuild <esbuild> --out <poza repo>`.
Wynik: `cases 44`, plik wynikowy BAJT-W-BAJT identyczny z `p6_wire_war_epoch_vectors/vectors.json` (11811 B, `cmp` = 0).
Generator nie jest czescia `cargo test` (wymaga node i pinu spoza repo); procedura jest w naglowku generatora.

### 8. Trzy zmienione asercje to oslabienie: ODRZUCAM
Zmiany (dokladnie trzy, zgodnie z dispatchem "blad znika"):
- `playable.rs` (test `advance_turn_with_ai_city_fails_explicitly_...`): nadal oczekuje `PlayableError::WarTurn`
  oraz cofniecia kolejki, tury i stanu wojny (linie bez zmian). Zmienil sie tylko komunikat: teraz musi zawierac
  "skladniki mocy bez zrodla" i "ludki" oraz NIE moze zawierac starego "epoki wlasciciela" (asercja wzmocniona).
- `p6_wire_war_inputs.rs` `production_owner_epochs_are_unavailable_...` -> `..._come_from_the_epoch_producer_...`:
  stara asercja "build_war_inputs = Err" (kontrakt, ktory dispatch kaze usunac) zastapiona asercja rownosci
  epok `{1: 3.0, 2: 3.0}` i wartosci `built.epochs`. Asercje wstrzyknietych epok (brak wlasciciela = `OwnerEpochUnavailable`) zostaly.
- `p6_wire_war_inputs.rs` `production_path_fails_with_explicit_blockers_for_ai_with_cities`: poprzednie `is_err()` na
  produkcyjnym `build_war_inputs` zastapione `expect("inputs")`; po nim ta sama sciezka `run_war_turn` asertuje
  `PowerComponentsMissing` (wynik bez zmian w logice bramki).
Asercje wstrzyknietych epok i pustego swiata nie zostaly oslabione. Zadna asercja nie zostala usunieta bez zastapienia
mocniejszym lub rownowaznym sprawdzeniem nowego zachowania. Brak `#[ignore]`.

## DOWODY
Srodowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo.
- cargo fmt --check: EXIT 0 (po rustfmt na p6_wire_war_epoch.rs)
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 51 passed, EXIT 0
- p6_wire_war_pipeline 7, p6_wire_war_inputs 14, p6_wire_war_diplo 13, p6_brake_inputs 10, p6_power_nozeros 9, p6_power_rest 9, p6_wire_war_epoch 9: wszystkie passed (`cargo test --test <nazwa>`, osobno dla kazdego pliku)
- pelny cargo test --no-fail-fast: patrz sekcja NOTATKA ponizej

## NOTATKA (pelny cargo test)
Pelny `cargo test --no-fail-fast` uruchomiony w tle po poprawkach: kompilacja i testy lib (51) oraz wszystkie binarki do p6_8i_pick przeszly; test `pick_auto_improvements_matches_pinned_web_vectors` byl w toku ponad 3 min CPU i zostal PRZERWANY przez Operatora (pelny cargo test: NIE_ZMIERZONO do konca; test nie dotyka kodu epoki).
