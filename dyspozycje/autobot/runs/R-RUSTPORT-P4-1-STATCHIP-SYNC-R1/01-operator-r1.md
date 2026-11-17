# R-RUSTPORT-P4-1-STATCHIP-SYNC-R1 — Operator r1

STATUS: BLOCK (INFRA, tylko bramka pełna: dysk 8,1–8,3 GB < 12 GB; kod gotowy, bramki cząstkowe zielone)
DOMAIN: GAME (renderer, typ stanu UI + komentarze)
TEMAT: R-RUSTPORT-P4-1-STATCHIP-SYNC-R1 (#324/#333, #325/#355)
GOAL: jeden typ stanu UI nakładek (`MapUiState`) zamiast `StatChipUiState`; poprawione numery linii pinu w komentarzach R5.
BAZA: `origin/rust-port/parity-v2` = `2760b4f0c` (DODATEK r2; sprawdzone `git rev-parse` przed startem).
GAŁĄŹ: `rust-port-wip/statchip-sync-r1` (lokalna w worktree, bez push).

## ZMIANY/COMMIT
SHA: patrz commit na gałęzi `rust-port-wip/statchip-sync-r1` (wpisany w odpowiedzi Operatora; ten plik jest w tym samym commicie).

1. `rust-port/renderer/src/view/overlays.rs`: `MapUiState` dostaje pole
   `hover_stat_chip_city_id: Option<vm::CityId>` (`statChipHoverCityId`, `main.ts:2938`, `:2987`),
   `WEB_INITIAL` = `None`. Doc: R5 czyta `is_city_panel_open` jako `hideStatChips`
   (pin: `hideStatChips: isCityPanelOpen()`, `main.ts:2977`).
2. `rust-port/renderer/src/cities/sync/stat_chips.rs`: usunięty struct `StatChipUiState`
   (z `WEB_INITIAL`); `stat_chip_city_visible`, `sync_stat_chips`, `sync_after_city_models`,
   `sync_stat_chip` biorą `&MapUiState`. Logika bez zmian (te same pola, te same warunki:
   `city_panel_view_city_id`, `is_city_panel_open`, `hover_stat_chip_city_id`).
3. `rust-port/renderer/src/cities/sync/mod.rs`, `rust-port/renderer/src/cities/mod.rs`:
   usunięty re-eksport `StatChipUiState`.
4. Numery linii pinu (zweryfikowane na `07d2fbd72`):
   - `cities.ts:888` → `:889` (`const hoverExpanded = options?.hoverStatChipCityId === city.id;`)
     w `stat_chips.rs` (2×), `view/cities.rs` (1×), test R5 (1×);
   - `cities.ts:928` → `:929` (`lodLevel: this.badgeLodLevel,`) w `stat_chips.rs`, `view/cities.rs`;
   - `main.ts:2988` → `:2987` (`hoverStatChipCityId: statChipHoverCityId,`; 2988 to `playerOwnerId`)
     w `stat_chips.rs` (moduł; komentarz pola przeniesiony do `MapUiState`);
   - `applyFogVisibility`: test R5 cytował `cities.ts:657-680` → `:740-763` (sygnatura 740, `}` 763).
5. Testy (zmiany tylko konstrukcji/importu i komentarzy, ŻADNA asercja nie zmieniona):
   - `rust-port/renderer/tests/cities_sync_stat_chips.rs`: `StatChipUiState` → `MapUiState`
     (import z `civ_renderer::view`); literał `panel_only` dostał `..MapUiState::WEB_INITIAL`
     (pozostałe pola = start pinu, chipy ich nie czytają); 2 komentarze linii.
   - `rust-port/renderer/tests/view_adapter_overlays.rs`: w pełnym literale `ui_all_off()`
     dopisane `hover_stat_chip_city_id: None` (inaczej nie kompiluje się).
   Uwaga allowlisty: pliki testów nie są wymienione w allowliście, ale dispatch wymaga zielonego
   testu R5 „bez zmiany asercji”, a usunięcie typu bez dotknięcia literałów testu jest niemożliwe
   (pełny literał 3 pól w `city_panel_view_and_hide_stat_chips`). Zmiana minimalna, jawnie zgłoszona.

Dokument `P4-1G-ADAPTER-ROZPOZNANIE.md` (żyje tylko na `claude/rust-sivvrn`, nie ma go w bazie
parity): sprawdzone wszystkie numery pinu `main.ts` w wierszach §3 (2949, 2955, 2956, 2961-2966,
2967-2970, 2971, 2972, 2973-2976, 2977, 2978, 2995-2996, 14563, 32265, 13475-13520, 13483,
13491-13494, 13503, 13504) i L4 (15583, 15381-15382, 15434, 14550) — wszystkie poprawne;
dokument nie cytuje `cities.ts:888/928/740` ani `main.ts:2988`. Brak zmian w dokumencie.

## TESTY
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR=/tmp/claude-0/statchip_target` (poza repo, usunięty po bramkach).
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --test cities_sync_stat_chips` → 11 passed, 0 failed (asercje bez zmian)
- `cargo test --test view_adapter_overlays` → 24 passed
- `cargo test --lib` → 111 passed; `cargo test --test view_adapter_cities` → 17 passed
- `cargo test --all-targets --no-fail-fast` (renderer) → NIE_ZMIERZONO: dysk 8,1 GB < 12 GB
  (dispatch: „DYSK ≥ 12 GB przed bramką pełną”). Do wykonania przez Evaluatora/FC przy ≥ 12 GB.
- grep `StatChipUiState` w `rust-port/**/*.rs` → 0 trafień.

## BLOKADY
- Bramka pełna renderera niewykonana (dysk). Reszta gotowa.
- Notatka poza allowlistą (nie ruszane): błędne numery pinu także w
  `renderer/src/models/cities/renderer.rs:591` (`applyFogVisibility` `cities.ts:657-680` → `:740-763`),
  `renderer/src/models/cities/renderer.rs:640` (`_syncMapOutline` `cities.ts:888-917` → zaczyna się na `:971`),
  `renderer/tests/view_adapter_cities.rs:439` (`cities.ts:657-680`). Kandydat na osobny temat komentarzy.
- `MapUiState.hide_stat_chips` pozostaje (asercja `view_adapter_overlays.rs:354`), jest równy
  `is_city_panel_open` w pinie; R5 czyta `is_city_panel_open` jak dotąd (zero zmiany zachowania).
  Decyzja techniczna orkiestratora: czy w przyszłości usunąć dublujące pole.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator; bramka pełna `cargo test --all-targets --no-fail-fast` (renderer) przy ≥ 12 GB.
DEPLOY/PUSH: NIE WYKONANO
