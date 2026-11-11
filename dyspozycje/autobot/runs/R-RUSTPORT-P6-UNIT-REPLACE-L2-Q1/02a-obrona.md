# 02a — Obrona Operatora — R-RUSTPORT-P6-UNIT-REPLACE-L2-Q1 (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L2-Q1
GOAL: klucz `ai_zamiana_jednostek_limit_udzial` (0,1, pin 07d2fbd72) w danych Rust, wczytany przez loader, test behawioralny (wartość z danych steruje loaderem zamiast domyślnej).
ZMIANY/COMMIT:
- Kod operatora r1: 2213f00b8 (ai-params.json, economy_society_part2.rs, unit_replace.rs, tests/p6_unit_replace_l2.rs).
- Obrona (poprawki): 084321020 — branch lokalny `R-RUSTPORT-P6-UNIT-REPLACE-L2-Q1-wip/operator-obrona` (bez push).
- Baza: origin/rust-port/parity-v2 = 8bb118dc7 (`git merge-base --is-ancestor` OK).
- Cargo.lock wygenerowany przez build, NIE commitowany.

## Odpowiedzi na zarzuty

### Z1 — allowlista: economy_society_part2.rs nie wymieniony z nazwy — PRZYJMUJĘ (odchylenie udokumentowane)
Dowód konieczności: `AiParams` ma `#[serde(deny_unknown_fields)]` (rust-port/engine/src/data/economy_society_part2.rs:250-251). Bez pola struktury klucz w ai-params.json powoduje błąd `parse_ai_params()`, a loader dostaje `None`. Pole `ai_zamiana_jednostek_limit_udzial` jest więc wymagane do wczytania klucza. Zmiana to 2 linie (pole + `#[serde(rename)]`), w strukturze `AiParams` (moduł wczytania parametrów AI), nie w innym module domeny. Odchylenie od allowlisty zgłaszam tu jawnie; dispatchu nie zmieniam.

### Z2 — test nie odróżnia wartości z danych od domyślnej (pin 0,1 == AI_UNIT_REPLACE_MAX_FRACTION) — PRZYJMUJĘ (poprawka + dowód)
Poprawka (084321020):
- nowa funkcja `ai_unit_replace_max_fraction_from_json(json: &str) -> f64` (unit_replace.rs): parsuje JSON, zwraca wartość z klucza albo domyślną;
- test `wartosc_z_danych_rozna_od_domyslnej_steruje_limitem`: podmienia `"wartosc": 0.1,` na `0.25` w realnym pliku danych (`include_str!`), asercja `assert_ne!(patched, original)`, wynik `0.25` (różny od domyślnej 0.1), cap(100) = 25;
- test `blad_parsowania_daje_wartosc_domyslna`: `"{ nie json"` i `"{}"` → domyślna 0.1 (ścieżka błędu jest teraz jawnie testowana).
Test z pinem 0,1 przemianowany na `limit_zamiany_dla_pinu_0_1_rowny_10_proc` — nie udaje już, że dowodzi źródła danych.

### Z3 — `ai_unit_replace_max_fraction_from_params` bez wywołań poza testami — ODRZUCAM (dowód)
- `grep -rn "load_ai_unit_replace_max_fraction\|ai_unit_replace_max_fraction_from_params\|ai_unit_replace_cap" rust-port/engine/src` (poza `domain/unit_replace.rs`): brak wywołań produkcyjnych. Pierwotna funkcja `load_ai_unit_replace_max_fraction` i `ai_unit_replace_cap` też nie mają wywołań w src przed tym tematem, więc luka istnieje od wcześniejszych tematów P6, nie wynika z L-2.
- GOAL tematu (dispatch) wymaga: wczytany parametr = wartość z pinu i „jest używany przez load_ai_unit_replace_max_fraction”. To jest spełnione i testowane.
- Podpięcie do rozgrywki (tura AI) wymagałoby zmiany modułu poza allowlistą (`ai_era_unit_promotion.rs` / ścieżka tury AI) i jest osobnym tematem. Wpisane do BLOKAD jako dług do dalszego tematu, nie jako błąd L-2.

### Z4 — nazwa testu `parametr_z_danych_steruje_limitem_zamiany` obiecuje za dużo — PRZYJMUJĘ (poprawka)
Przemianowanie na `limit_zamiany_dla_pinu_0_1_rowny_10_proc` oraz nowy test z wartością 0,25 (pkt Z2) — teraz to dowodzi sterowania danymi.

## Testy (po poprawce; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo)
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --lib` → 28 passed, EXIT 0
- `cargo test --test p6_unit_replace_l2` → 6 passed, EXIT 0 (było 4; dodane 2)
- `cargo test --test p6_repin_unit_replace_pure` → 7 passed, EXIT 0
- `cargo test --test p6_repin_unit_replace_execute` → 1 passed, EXIT 0
- `cargo test --test data_economy_society` → 9 passed, EXIT 0
- `git diff --check` → OK
- NIE_ZMIERZONO: mutacja (ręczny powrót do fallbacku) nie była uruchamiana; odróżnialność opiera się na asercji 0,25 ≠ 0,1 oraz na tym, że fallback zwraca 0,1.

Uwaga do raportu operatora: jego liczby dla testów regresji są odwrócone — zmierzone tu: `p6_repin_unit_replace_pure` = 7, `data_economy_society` = 9 (raport: 9 i 7). Wszystkie przechodzą; liczby w raporcie r1 nie zgadzają się z pomiarem.

## BLOKADY
- Brak blokad dla tematu.
- Dług (poza L-2): podpięcie `ai_unit_replace_cap` / limitu do tury AI — osobny temat, wymaga modułu spoza allowlisty.
- Odchylenie allowlisty: rust-port/engine/src/data/economy_society_part2.rs (pole struktury `AiParams`, konieczne przez deny_unknown_fields).

RUNDY: 1/5 (obrona operatora, runda 1)
NASTĘPNY KROK: Evaluator r2 na commicie 084321020 (baza 8bb118dc7); Final Control po Evaluatorze. Integracja tylko przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (brak push; gałąź lokalna `R-RUSTPORT-P6-UNIT-REPLACE-L2-Q1-wip/operator-obrona`).
