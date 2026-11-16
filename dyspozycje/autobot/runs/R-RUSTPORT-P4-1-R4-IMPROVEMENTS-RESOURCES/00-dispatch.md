# DISPATCH R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES (runda 1) — ulepszenia, zasoby, wioski i obozy per heks (R4 kontraktu P4-1, renderer 3D)

DOMENA: renderer 3D (grafika Rust): synchronizacja modeli ulepszeń, nakładek zasobów i wiosek per heks z DTO. MODEL: OPUS we wszystkich rolach (grafika Rust, 3D).
BAZA: `origin/rust-port/parity-v2` = `2edc808d7` (zawiera R6). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/main.ts`. Lokalizacje: `git grep -n "buildImprovementVisual\|syncResourceOverlayAtHex\|rebuildResourceOverlays\|syncResourceOverlayFog\|syncImprovementMeshFog\|syncVillageMeshes\|syncCampMeshes\|computeRoadMask" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek. Kluczowe zakresy: `buildImprovementVisual` (`main.ts:3162-3173`), `syncResourceOverlayAtHex` (`:3199`), `rebuildResourceOverlays` (`:3233`), `syncResourceOverlayFog` (`:3284`), `syncImprovementMeshFog` (`:3314`), `syncVillageMeshes` (`:3360`), `syncCampMeshes` (`:3401`), wołanie z `refreshFog` (`:13488-13489`, `:13495-13496`), `computeRoadMask` (`:15836`, `:17083`). Numery zweryfikuj w pinie.
KONTRAKT: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` — przeczytaj §4 w całości, wiersz R4 i wiersze o `ulepszenia`, `zloze`, `village_present`, `road_mask` (ok. wiersze 68–74).
DTO (już w view-model, NIE zmieniać): `rust-port/view-model/src/map.rs` — `HexDynDto`: `ulepszenia: Option<Vec<String>>` (~l.144), `improvement_key: Option<String>` (~l.146), `zloze: Option<String>` (~l.148), `village_present: bool` (~l.150), `road_mask: u8` (~l.156).
Istniejące modele: `rust-port/renderer/src/models/improvements/registry.rs:290` (`build_improvement_sectored`), `models/improvements/zasoby.rs` (`build_styled_resource_overlay`), `models/misc/wioska.rs:141` (`build_wioska`).

## DECYZJE (podjęte przez orkiestratora)
- D-DTO-1 = A: producent stanu w engine; renderer tylko buduje sceny z DTO. Zero reguł gry w rendererze (nie wyprowadzaj zasobu/wioski z innych pól).
- Obozy (`syncCampMeshes`, `main.ts:3401`): w view-model NIE ma osobnego pola obozów barbarzyńców. Jeśli w DTO brak danych do obozów — zgłoś `NIE_ZMIERZONO` w raporcie i NIE wymyślaj pola. Nie dodawaj zmian w view-model ani engine.
- Mgła: sync nakładek i modeli musi respektować `vis`/`explored` (jak `syncResourceOverlayFog` / `syncImprovementMeshFog`); wartości z DTO, nie z pinu w rendererze.

## ZAKRES
1. Nowy moduł `rust-port/renderer/src/improvements/sync/` (NOWY): integrator per heks — ulepszenie (`improvement_key` + `ulepszenia` + `road_mask` → `build_improvement_sectored`), zasób (`zloze` → nakładka 1:1 z `syncResourceOverlayAtHex`), wioska (`village_present` → `build_wioska`), z zachowaniem kolejności z pinu.
2. Obsługa mgły w module (odpowiednik `syncResourceOverlayFog` i `syncImprovementMeshFog`), wejście: wartości z DTO.
3. Obozy: tylko jeśli DTO je niesie (patrz DECYZJE). Inaczej `NIE_ZMIERZONO`.
4. Test wektorowy z fixture (ulepszenie z `road_mask`, zasób z `zloze`, wioska tak/nie, heks we mgle).

## ALLOWLISTA
- `rust-port/renderer/src/improvements/**` (NOWE)
- `rust-port/renderer/src/lib.rs` lub `rust-port/renderer/src/mod.rs` (dokąd potrzeba) — TYLKO linia `pub mod improvements;`
- `rust-port/renderer/tests/improvements_sync_*.rs` (NOWE), `rust-port/renderer/tests/fixtures/improvements_sync/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES/**`

## NIE ROBIĆ
- Nie zmieniaj `rust-port/view-model/**`, `rust-port/engine/**`, `gra/`.
- Nie dotykaj `view/cities.rs`, `cities/**` (R5, R6), `rivers/**` (R3), `decor/**` (R2), `map_units/**` (R1), `view/overlays.rs` (Q5), `models/improvements/registry.rs` i `zasoby.rs` poza importem.
- Nie wdrażaj mgły jako decyzji (#253) — tylko respektuj `vis`/`explored` z wejścia.

## WEKTORY / TESTY
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) `road_mask` zignorowany przy ulepszeniu; (b) wioska pokazana, gdy heks we mgle; (c) nakładka zasobu dla `zloze` pustego/None (zaprzeczenie warunku).

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
