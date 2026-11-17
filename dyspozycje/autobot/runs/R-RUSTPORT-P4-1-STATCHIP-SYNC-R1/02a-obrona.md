# R-RUSTPORT-P4-1-STATCHIP-SYNC-R1 — Obrona Operatora r1

STATUS: BLOCK (INFRA, tylko bramka pełna renderera); zarzuty merytoryczne obsłużone
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-STATCHIP-SYNC-R1
GOAL: jeden model stanu UI nakładek (`MapUiState`) bez dwóch kopii; poprawne numery linii pinu w komentarzach R5
ZMIANY/COMMIT: na `ef1276936` (Operator r1) dodany commit obrony, gałąź lokalna `rust-port-wip/statchip-sync-r1-obrona`; pliki: `rust-port/renderer/src/view/overlays.rs`, `rust-port/renderer/src/cities/sync/stat_chips.rs`, `rust-port/renderer/tests/view_adapter_overlays.rs`, ten raport. Bez `Cargo.lock`.
TESTY: patrz §Bramki
BLOKADY: bramka pełna `cargo test --all-targets --no-fail-fast` NIE_ZMIERZONO (dysk 5,7–6,2 GB < 12 GB)
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control; przy dysku ≥ 12 GB bramka pełna renderera przed integracją
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Bramka pełna NIE_ZMIERZONO — PRZYJMUJĘ jako fakt, nie do usunięcia w tej rundzie
Dysk w chwili obrony: `df -h /` → 6,1 GB, potem 5,7 GB w trakcie budowy, 6,2 GB po usunięciu targetu. Dispatch wymaga ≥ 12 GB przed bramką pełną. Nie uruchomiłem jej. Status pozostaje BLOCK (INFRA) wyłącznie dla tej bramki. Bramka pełna jest warunkiem integracji i należy do orkiestratora albo do kolejnej rundy przy ≥ 12 GB. Bramki częściowe po poprawce są w §Bramki.

### 2. Zmiany poza dosłowną allowlistą — PRZYJMUJĘ (bez dalszej zmiany kodu)
Obie zmiany w testach wynikają z usunięcia typu i pola, a asercje R5 są nietknięte. Obrona dokłada jedną zmianę w `view_adapter_overlays.rs`. Usunięte jest pole `hide_stat_chips` w literale `ui_all_off`, `assert!(!ui.hide_stat_chips)` zmienione na wywołanie metody `assert!(!ui.hide_stat_chips())` (to samo znaczenie). Dodana jest asercja z zarzutu 4. `cities_sync_stat_chips.rs` nie jest zmieniony w obronie: `git diff ef1276936 -- rust-port/renderer/tests/cities_sync_stat_chips.rs` jest pusty. Zakres do zatwierdzenia przez orkiestratora.

### 3. Dwie kopie tej samej wartości (`hide_stat_chips` i `is_city_panel_open`) — PRZYJMUJĘ
Pin: `main.ts:2977` `hideStatChips: isCityPanelOpen()`, czyli wartość zawsze wyliczana z panelu. `cities.ts:545`, `:590` i `:652` czytają `options?.hideStatChips`. W Rust nikt w `src/` nie czytał pola `hide_stat_chips` (grep), więc było martwą drugą kopią, którą GOAL każe usunąć.
Poprawka, czyli wariant „wyliczać jedno z drugiego”:
- `MapUiState`: pole `hide_stat_chips` usunięte i zastąpione metodą `pub const fn hide_stat_chips(&self) -> bool { self.is_city_panel_open }` z komentarzem pinu `main.ts:2977`.
- R5 (`stat_chips.rs:213`, `:249`): `!ui.is_city_panel_open` → `!ui.hide_stat_chips()`. Teraz odpowiada wprost `!options?.hideStatChips` z `cities.ts:652` i `:545/:590`. Zachowanie się nie zmienia.
- Nie da się już ustawić `hide_stat_chips=true` przy `is_city_panel_open=false`: jest jedno źródło prawdy.
Dowód czułości: mutacja ciała metody na `false` → `cities_sync_stat_chips` 10 passed, 1 FAILED (`city_panel_view_and_hide_stat_chips`). Po przywróceniu 11/11.
Decyzja techniczna do wpisu w `REJESTR-RUST.md` przez orkiestratora: `hideStatChips` jest pochodną `isCityPanelOpen` (metoda, nie pole).

### 4. `ui_web_initial_matches_pin` nie sprawdza `hover_stat_chip_city_id` — PRZYJMUJĘ
Dodana asercja `assert_eq!(ui.hover_stat_chip_city_id, None);`, a do doc-komentarza testu dopisane `statChipHoverCityId = null` (`:2938`). Zweryfikowane na pinie: `git show 07d2fbd72:gra/src/main.ts` linia 2938 `let statChipHoverCityId: string | null = null;`. Test przechodzi: `view_adapter_overlays` 24/24.

### 5. Stare numery pinu poza allowlistą — ODRZUCAM poprawkę w tym temacie
Dowód: to pliki spoza allowlisty dispatchu, który mówi „Nic więcej”. Chodzi o `models/cities/renderer.rs:591` i `:640` oraz `tests/view_adapter_cities.rs:399`. Evaluator sam kwalifikuje to jako dług na osobny temat i potwierdza, że wszystkie poprawki w zakresie są trafne. Proponowany osobny temat dokumentacyjny: `cities.ts:657-680` → `740-763` (`applyFogVisibility`) i `cities.ts:888-917` → `_syncMapOutline` od `:971` w tych dwóch plikach.

## Bramki (na drzewie obrony, renderer)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach.
- `cargo fmt --check` EXIT 0
- `cargo clippy --all-targets -- -D warnings` EXIT 0
- `cargo test --test cities_sync_stat_chips` 11 passed, 0 ignored (asercje bez zmian)
- `cargo test --test view_adapter_overlays` 24 passed
- `cargo test --test view_adapter_cities` 17 passed
- `cargo test --lib` 111 passed
- `git diff --check` czysto
- `cargo test --all-targets --no-fail-fast` NIE_ZMIERZONO (dysk < 12 GB)
- `Cargo.lock` zmieniony przez cargo i przywrócony `git checkout`, nie w commicie
