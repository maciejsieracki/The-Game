# 02a — obrona Operatora r1 (R-RUSTPORT-P6-UNIT-REPLACE-L3-KOSZT-Q1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-KOSZT-Q1
GOAL: odpowiedź na zarzuty Evaluatora r1 (5 zarzutów + 1 uwaga informacyjna) z dowodem.
ZMIANY/COMMIT: kod obrony 057b93612 (gałąź wip `rust-port-wip/UNIT-REPLACE-L3-KOSZT-Q1` jest checked out w worktree `wf_e8c19444-ed2-1`, więc ref NIE został przesunięty; orkiestrator wykonuje fast-forward z 96e3d8541 na 057b93612). Poprzednik: 96e3d8541. Allowlista: playable.rs, unit_replace_defs.rs, tests/p6_unit_replace_cost.rs, tests/p6_unit_replace_l3_state.rs, tests/p6_unit_replace_cost_vectors/{gen-*.mjs, unit-replace-cost-vectors.json}, runs/R-...-KOSZT-Q1/**. Cargo.lock nie commitowany.
BLOKADY: brak blokujących. Deploy/push/integracja NIE WYKONANE.
RUNDY: 1/5 (obrona).
NASTĘPNY KROK: Evaluator r2 na 057b93612 (ponowna weryfikacja pinu i bramek).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Regresja etykiet trudności — PRZYJMUJĘ
- Problem był prawdziwy: `replace_difficulty_of` nie znał `Łatwy` / `Trudny`, a stan niesie etykiety polskie.
- Poprawka: `rust-port/engine/src/domain/playable.rs`, `replace_difficulty_of`: `"Normalny" | "normal" -> Normal`, `"Łatwy" | "easy" -> Easy`, `"Trudny" | "hard" -> Hard`, reszta = `ReplaceDifficultyUnknown`.
- Źródło mapy w pinie 07d2fbd72: `gra/src/main.ts:44372-44374` (`'Łatwy': 'easy'`, `'Normalny': 'normal'`, `'Trudny': 'hard'`). Uwaga: Evaluator podał `main.ts:36153`; tam tego mapowania nie ma. Poprawny numer to 44372.
- Dowód: test jednostkowy `replace_difficulty_label_tests::kazda_etykieta_trudnosci_ma_mapowanie` (wszystkie 6 etykiet) i `nieznana_etykieta_trudnosci_jest_bledem` — PASS. E2E `produkcyjna_zamiana_ustawia_kategorie_hp_i_koszt_z_pinu` przechodzi po każdej z 6 etykiet — PASS.
- Ograniczenie: w pinie koszt jednostki gracza dla `Łatwy` jest identyczny jak dla `Normalny` (mnożnik Easy = 1, Hard = 2). E2E tego nie rozróżnia; rozróżnia to test jednostkowy mapowania.

### 2. Brak wektorów pinu na ścieżce produkcyjnej — PRZYJMUJĘ
- Dodano sekcję `productionMoney` w `gen-unit-replace-cost-vectors.mjs`. Generator wykonuje w node tekst pinu: `civProductionCostBonusyForCivKey` (production.ts) oraz `loadCivMatrix` / `resolveRow` / `civMatrixParam` (civ-matrix.ts, `DATA` = `gra/data/civ-matrix.json` z pinu). Markery powstają więc z pinu, nie z ręcznych zestawów.
- Zakres: 15 cywilizacji z macierzy + klucz `""` (brak wiersza), 66 jednostek z kosztem, tempa `niski` / `normalny` / `wysoki`, trudności `normal` / `easy` / `hard`. Razem 9504 wpisów.
- Rust: `tabela_produkcyjna_koszt_zgodny_z_pinem_per_cywilizacja` (`p6_unit_replace_cost.rs`) woła `production_replace_defs_for_civ(civ, pace, difficulty)` — tę samą drogę co komenda gracza `replace_defs()`. Wynik: porównano 9216 przypadków, zgodność 100%. Zulusi (jedyna cywilizacja z rabatem kosztu jednostek w pinie; zmierzone: wynik różny od przypadku bez markerów tylko dla `zulusi`) — 576 przypadków z rabatem i tempem.
- Pominięte z powodu rozbieżności DANYCH (baza kosztu `units.json` Rust != pin): `Konnica` (22 vs 44) i `Jeździec chiński` (28 vs 56). Test wypisuje je w `eprintln` jako `POMINIETE`, a nie ukrywa. Rozstrzygnięcie = zadanie 27 (decyzja gameplay), nie ruszane tutaj.
- Ograniczenie: gałąź `civ bonus` rekrutacji (`civRecruitmentDiscount`, marker `walka_koszt_rekrutacji_proc`) nie jest zasilana przez produkcyjne markery pinu (`civProductionCostBonusyForCivKey` zwraca tylko dwa markery). Pokryte wektorami w `markerSets` testu B2 (`impi-0.15`, `rekrut-*`), nie na tabeli produkcyjnej.
- Dowód: `generator` daje `money=22176 hp=525 pinData=75 productionMoney=9504`; sekcje `money`/`hp`/`pinData` są bit-identyczne z poprzednią generacją (sprawdzone `JSON.stringify`). SHA-256 tekstu produkcyjnego pinu: `250c5c69...6eb4` (stała `EXPECTED_PRODUCTION_SHA256` w teście); SHA-256 tekstu funkcji kosztu z poprzedniej generacji bez zmian: `6d734a83...9e69`.

### 3. Tautologiczny test e2e — PRZYJMUJĘ
- Stary test brał oczekiwane wartości z `production_replace_defs_for_civ("rzymianie", ...)`, czyli z kodu, który testuje.
- Nowy test `produkcyjna_zamiana_ustawia_kategorie_hp_i_koszt_z_pinu` używa wartości LITERALNYCH z wektorów pinu: zulusi, tempo `normalny`, Procarz baza 8. Koszt: Normal 14, Easy 14, Hard 28 (`productionMoney`); kategoria `procarz` (categoryOf 1:1, wektory defs); HP = 16 (`pinData.baseHealth`). Pętla po 6 etykietach.
- Dodany negatywny e2e `nieznana_etykieta_trudnosci_odrzuca_zamiane`: błąd `ReplaceDifficultyUnknown("Koszmar")`, skarbiec bez zmian.

### 4. HP po zamianie bez postępu jednostki — PRZYJMUJĘ jako ograniczenie
- Stan Rust nie ma `battlesSurvived` ani `parametryBonusProc` (`PlayableUnit` / `PlayableReplaceUnit`). Wejście jest jawnie zerowe: stała `PLAYABLE_UNIT_PROGRESS` w `playable.rs` z komentarzem; `ReplaceUnitProgress::default()` w testach wiringu.
- Parytet HP dotyczy więc jednostek bez awansu i weterana. Wektory `hp` (525) obejmują pełną macierz postępu w czystej funkcji `replace_max_hp`; w ścieżce stanu gracza postęp = 0.
- Zapisane jako ograniczenie w raporcie końcowym, nie jako parytet.

### 5. Odstępstwo od allowlisty w playable.rs — PRZYJMUJĘ jako odstępstwo jawnie opisane
- Dodano wariant `PlayableError::ReplaceDifficultyUnknown` i mapowanie etykiety trudności. Uzasadnienie: trudność jest wejściem `unitMoneyCost` (koszt Pieniądza po zamianie), więc jej źródło należy do „źródła kosztu”. Nieznana etykieta musi być błędem, nie zgadywaniem.
- Zakres zmian w `playable.rs` ograniczony do: `replace_defs()` (źródło tabeli), `replace_difficulty_of`, `PLAYABLE_UNIT_PROGRESS`, przekazania `progress` do `replace_unit_wired`, wariantu błędu i dwóch testów mapowania. Bez zmian w innej logice `PlayableGame`.
- Mapowanie etykiet było w obronie błędne (zarzut 1) i jest poprawione; wariant błędu dostał test e2e.

### Uwaga informacyjna (rozbieżność danych Konnica 22 vs 44, Jeździec chiński 28 vs 56) — zgoda
- Nie rozstrzygane. Teraz wypisywane przez test produkcyjny jako `POMINIETE` (nie tylko `eprintln` w teście danych).

## Bramki (uruchomione w worktree, CARGO_TARGET_DIR poza repo, po bramkach usunięty)

- `cargo fmt --check`: 0 różnic (po `cargo fmt` na dwóch plikach, tylko formatowanie).
- `cargo clippy --all-targets -- -D warnings`: czysto (EXIT 0).
- `cargo test --lib`: 62 passed (60 + 2 nowe testy etykiet).
- `p6_unit_replace_defs` 7, `p6_unit_replace_l3` 8, `p6_unit_replace_l3_state` 13 (w tym 2 nowe), `p6_repin_unit_replace_pure` 7, `p6_repin_unit_replace_execute` 1, `p6_repin_b2_production` 17, `p6_unit_replace_cost` 4 (w tym nowy produkcyjny). Wszystkie zielone.
- `git diff --check`: czysto.
- Pełny `cargo test` NIE_ZMIERZONO.
- Brak `#[ignore]` i osłabionych asercji w zmienionych testach (stare asercje zostały, dodano nowe).

## Pliki zmienione w 057b93612

- `rust-port/engine/src/domain/playable.rs`
- `rust-port/engine/src/domain/unit_replace_defs.rs` (`production_base_gold`)
- `rust-port/engine/tests/p6_unit_replace_cost.rs`
- `rust-port/engine/tests/p6_unit_replace_cost_vectors/gen-unit-replace-cost-vectors.mjs`
- `rust-port/engine/tests/p6_unit_replace_cost_vectors/unit-replace-cost-vectors.json`
- `rust-port/engine/tests/p6_unit_replace_l3_state.rs`
