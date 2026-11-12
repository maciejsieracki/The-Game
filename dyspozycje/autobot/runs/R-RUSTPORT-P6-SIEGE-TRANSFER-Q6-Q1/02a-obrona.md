# Obrona Operatora r1 — R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1
GOAL: port runCapitalCapturePlunder z pinu 07d2fbd72 jako czyste funkcje + wektory; odpowiedź na zarzuty Evaluatora r1.
ZMIANY/COMMIT: kod Operatora 738eec5ad (baza lokalna: 70d7a231d); raport 01-operator-r1 cd1a86e92; commit obrony r1 = HEAD gałęzi `rust-port-wip/SIEGE-TRANSFER-Q6-Q1-obrona-r1` (nie pushowano). Allowlista zachowana: siege_capital_plunder.rs (komentarze), siege_transfer.rs (komentarz + tekst statusu), p6_siege_capital_plunder.rs (+1 test), 02a-obrona.md. Cargo.lock wygenerowany przez cargo, NIE commitowany.

## Odpowiedzi na zarzuty

### 1. [ISTOTNY, proces] Rozbieżność bazy — PRZYJMUJĘ (fakt), bez zmiany kodu
Zweryfikowane git-em:
- `70d7a231d` (baza z dispatchu) jest przodkiem `738eec5ad` (merge-base --is-ancestor = TAK).
- `70d7a231d` NIE jest przodkiem `origin/rust-port/parity-v2`; `f207ea6b1` jest przodkiem parity-v2; `738eec5ad` nie jest przodkiem parity-v2.
- W `origin/rust-port/parity-v2` brak `rust-port/engine/src/domain/siege_transfer_q5.rs` oraz `tests/p6_siege_transfer_q5*.rs`.
Operator wykonał zlecenie zgodnie z dispatchem (baza 70d7a231d). Wybór bazy (przeniesienie łańcucha Q3–Q5 na parity-v2 albo zmiana bazy) jest decyzją orkiestratora. Operator nie rozstrzyga jej samodzielnie i nie integruje. Blokada: NIE do Final Control na parity-v2 bez tej decyzji.

### 2. [DROBNY, kontrakt] Kolejność `lost_power` — PRZYJMUJĘ, kontrakt doprecyzowany w komentarzu
Potwierdzone w pinie (gra/src/main.ts): `applyBarbarianAwareCapitalCapturePlunder` (L35611) → `buildObjectivePowerForOwner(oldOwner)` (L35672) → `shouldShowPlayerTriumphCityStateUnification` (L35734) → `eliminateOwner(oldOwner)` (L35769). Dodano w `PlunderInput::lost_power` dokumentację wymogu kolejności dla wolającego. Rust nie egzekwuje kolejności (wartość jest wejściem); egzekwuje ją wiring W8, zapisane jako zależność jawna. Kod funkcji bez zmian.

### 3. [DROBNY, pokrycie] Gałąź `civDisplayNameForOwner(0) == None` — PRZYJMUJĘ, dodano test
Dodano `triumph_display_name_none_falls_back_to_civ_label` (tests/p6_siege_capital_plunder.rs). Atrapa `LabelsNoDisplayName` zwraca `None`. Test sprawdza, że po `civDisplayNameForOwner(0)` następuje `civLabelForOwner(0)` (fallback JS `??`, pin main.ts ok. L35746) i że etykieta `showTriumphCityStateNotice` = `civ_label(0)`. Wynik: ok.
NaN/Inf w kwotach: ODRZUCAM jako zarzut blokujący. Założenie Z-PL-2 (`js_max0`, NaN propaguje jak w JS) jest jawne w nagłówku modułu. Wektory z pinu nie zawierają NaN. Wygenerowanie wektorów NaN wymagałoby zmiany generatora poza zakresem dispatchu (kryteria: ≥30 przypadków i gałęzie są spełnione). Pozostaje NOTA, nie FAIL.
Brak wołającego w Rust: PRZYJMUJĘ jako notę. Status `Ported` w TRANSFER_EFFECTS oznacza port logiki z wektorami. Komentarz i tekst statusu zaktualizowano, żeby to jawnie mówiły (wolający niepodpięty, zależność W8).

### 4. [DROBNY] `shouldShowPlayerTriumphCityStateUnification` z `null` dla `typCityCopyOwners`/`aiOwnerCivMap` — PRZYJMUJĘ jako notę (bez zmiany zachowania)
Potwierdzone: pin przekazuje realne Set/Map (main.ts L35734–35741). Moduł nie posiada tych kolekcji (granica jawna), więc rejestruje `null` jak atrapa generatora. Dodano komentarz przy wywołaniu: wektory potwierdzają kolejność i pozostałe argumenty, NIE zawartość kolekcji. Funkcja `shouldShowPlayerTriumphCityStateUnification` nie jest portowana w tym temacie; jej port musi zweryfikować te argumenty.

## Bramki (ten sam worktree; CARGO_TARGET_DIR poza repo; CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0)
- cargo fmt --check: EXIT 0 (po jednokrotnym `cargo fmt` na nowym teście).
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --lib: 48 passed, EXIT 0.
- p6_siege_capital_plunder: 3 passed (w tym nowy test), EXIT 0.
- p6_siege_transfer 2, _effects 4, _effects_q4 12, _prod 5, _q5 6, p6_siege_surrender 10: wszystkie passed.
- git diff --check: EXIT 0.

## Zakres zmian obrony
- siege_capital_plunder.rs: komentarze (kontrakt kolejności lost_power, granica triumph/null). Logika bez zmian.
- siege_transfer.rs: komentarz i tekst statusu dla runCapitalCapturePlunder. Lista BRAK bez zmian.
- p6_siege_capital_plunder.rs: +1 test (gałąź civDisplayNameForOwner=None).

BLOKADY: (1) rozbieżność bazy: decyzja orkiestratora przed FC i integracją (zarzut 1). Reszta bez blokad.
RUNDY: 2/5 (obrona r1 po Evaluatorze r1; zarzuty PASS-WITH-NOTES)
NASTĘPNY KROK: Evaluator r2 / Final Control po decyzji orkiestratora o bazie (zarzut 1).
DEPLOY/PUSH: NIE WYKONANO
