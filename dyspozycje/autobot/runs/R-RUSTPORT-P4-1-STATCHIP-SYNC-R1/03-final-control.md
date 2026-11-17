# R-RUSTPORT-P4-1-STATCHIP-SYNC-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer Rust, porządek typu stanu UI + komentarze pinu)
TEMAT: R-RUSTPORT-P4-1-STATCHIP-SYNC-R1
GOAL: jeden model stanu UI nakładek (`StatChipUiState` → `MapUiState`) bez zmiany zachowania oraz poprawne numery linii pinu `07d2fbd72` w komentarzach R5 i w `P4-1G-ADAPTER-ROZPOZNANIE`.
ZMIANY/COMMIT: kod oceniany = `f9f42ce23` (Obrona r1, rodzic `ef1276936` Operatora r1, rodzic `2760b4f0c` = baza r2 = obecny `origin/rust-port/parity-v2`). Ten raport: commit FC na `f9f42ce23`, gałąź lokalna `rust-port-wip/statchip-sync-r1-fc`, bez push.
TESTY: niżej (odtworzone samodzielnie na `f9f42ce23`).
BLOKADY: bramka pełna `cargo test --all-targets --no-fail-fast` NIE_ZMIERZONO (dysk 3,1–3,9 GB, dispatch wymaga ≥ 12 GB); warunek integracji.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora po bramce pełnej renderera przy ≥ 12 GB; wpis decyzji technicznej w REJESTR-RUST.
DEPLOY/PUSH: NIE WYKONANO

## Ancestry

- `git rev-parse origin/rust-port/parity-v2` = `2760b4f0c0f763306b9424ed9cb32a3b2e5c5f12` (= BAZA r2 z DODATKU r2).
- `git merge-base --is-ancestor 2760b4f0c f9f42ce23` → OK; łańcuch `2760b4f0c → ef1276936 → f9f42ce23` (+ commit FC), FF możliwy.
- `Cargo.lock` nie występuje w żadnym z commitów tematu; trailery bez nazwy modelu (#289).

## Bramki odtworzone przez FC (renderer, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test cities_sync_stat_chips` | 11/11, 0 ignored |
| `cargo test --test view_adapter_overlays` | 24/24 |
| `cargo test --test view_adapter_cities` | 17/17 |
| `cargo test --lib` | 111/111 |
| `git diff --check 2760b4f0c..f9f42ce23` | czysto |
| mutacja: `hide_stat_chips()` → `false` | `city_panel_view_and_hide_stat_chips` FAILED (10/11), przywrócone |
| `cargo test --all-targets --no-fail-fast` | NIE_ZMIERZONO (dysk < 12 GB, równoległy `cargo test` innego workera) |

## Weryfikacja treści

- `StatChipUiState` usunięty; w `rust-port` nie ma już żadnego odwołania (`git grep` na `f9f42ce23`). R5 przyjmuje `&MapUiState`.
- `MapUiState`: pole `hide_stat_chips` zastąpione metodą `hide_stat_chips() = is_city_panel_open` (pin `main.ts:2977` `hideStatChips: isCityPanelOpen()`), dodane pole `hover_stat_chip_city_id` (`main.ts:2938`, `:2987`). R5 czyta `!ui.hide_stat_chips()` tak jak `cities.ts:545/590/652` czyta `!options?.hideStatChips`. Zachowanie bez zmian.
- Numery pinu sprawdzone na `07d2fbd72`: `cities.ts:889` `hoverExpanded`, `:929` `lodLevel`, `:740` `applyFogVisibility` (do `:763`), `main.ts:2938` `statChipHoverCityId`, `:2977` `hideStatChips`, `:2987` `hoverStatChipCityId` — wszystkie trafne.
- `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` (na `origin/claude/rust-sivvrn`): brak odwołań do błędnych `cities.ts:888/928/657`, `main.ts:2988`; sprawdzone wiersze `main.ts:2949/2955/2956/2961-2966/2967-2970/2971/2972/2973-2976/2978/2995-2996` zgodne z pinem. Brak zmian = poprawne.
- Asercje `cities_sync_stat_chips.rs` nietknięte (diff: import, nazwa typu, `..MapUiState::WEB_INITIAL` w literale, 2 numery linii w komentarzach).

## Orzeczenia zarzutów

1. **Bramka pełna NIE_ZMIERZONO — ODDAL** (jako wada kodu). To blokada INFRA (dysk), nie defekt pracy. Wszystkie bramki dające się wykonać są zielone. Bramka pełna pozostaje warunkiem integracji (orkiestrator, ≥ 12 GB).
2. **Pliki testów poza dosłowną allowlistą — ODDAL.** Zmiany w `tests/cities_sync_stat_chips.rs` i `tests/view_adapter_overlays.rs` są mechanicznym następstwem usunięcia typu wymaganego przez GOAL (bez nich crate testów się nie kompiluje); asercje R5 bez zmian, w `view_adapter_overlays` `ui.hide_stat_chips` → `ui.hide_stat_chips()` (to samo znaczenie) + jedna nowa asercja (zarzut 4). Re-eksporty w `cities/mod.rs` i `cities/sync/mod.rs` mieszczą się w „`renderer/src/` (tylko typ UI)”. Do odnotowania przez orkiestratora przy integracji.
3. **Dwie kopie `hideStatChips` / `is_city_panel_open` — ODDAL (naprawione w Obronie).** Pole usunięte, `hide_stat_chips()` jest pochodną; sprzecznego stanu nie da się ustawić. Czułość potwierdzona mutacją. Decyzję techniczną („`hideStatChips` = pochodna `isCityPanelOpen`, nie osobne pole”) orkiestrator wpisuje do REJESTR-RUST.
4. **Brak asercji `hover_stat_chip_city_id == None` w `ui_web_initial_matches_pin` — ODDAL (naprawione w Obronie).** Asercja i doc-komentarz (`main.ts:2938`) dodane.
5. **Stare numery pinu poza allowlistą (`models/cities/renderer.rs:591`, `:640`, `tests/view_adapter_cities.rs:399`) — ODDAL w tym temacie.** Potwierdzone, że są błędne (`cities.ts:657-680` → `740-763`; `888-917` to `_cityMapBadgeInput`, `_syncMapOutline` od `:971`), ale dispatch zamyka allowlistę („Nic więcej”). Dług komentarzy do osobnego tematu dokumentacyjnego.

Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA → PASS-WITH-NOTES (noty: bramka pełna przed integracją; wpis decyzji w REJESTR-RUST; osobny temat na dług z zarzutu 5).

SHA końcowy kodu: `f9f42ce233d0b43dd3413a47d60d452fc58f29fc` (potomek bazy `2760b4f0c`).
