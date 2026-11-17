# R-RUSTPORT-P4-1-DOC-DEBTS-R1 — raport Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dokumentacja kodu Rust, zero zmian zachowania)
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R1
GOAL: zamknąć trzy długi dokumentacyjne po integracjach 3D (Q6-2, L1/L2-FOGOFF, R5/STATCHIP).

BAZA: `origin/rust-port/parity-v2` = `0f77c9da3741da76df7cd8a99a56371e1ab75129`.
Gałąź robocza: `rust-port-wip/R-RUSTPORT-P4-1-DOC-DEBTS-R1`.

## ZMIANY/COMMIT
Pliki (tylko komentarze):
- `rust-port/renderer/src/view/units.rs` — sekcja „KNOWN DIVERGENCE of Q6-2” zastąpiona opisem
  „Former divergence of Q6-2, now CLOSED”: co było (pin `refreshBuildHighlight`, `main.ts:16351-16396`,
  czyści krążki przy aktywnym trybie budowy i pustym zbiorze), co jest (producent
  `engine/src/domain/overlays_view.rs::unit_overlays_view` zwraca pusty `reachable`, gdy
  `build_highlight_mode_active`, także dla pustego zbioru — od `f263ad77a`), gdzie test
  (`engine/tests/p4_1q6_2_build_highlight.rs`), kontrakt wołającego (otwarcie panelu budowy bez klucza
  nie jest trybem budowy; wołający czyści zaznaczenie jak `onOpenBuild` → `clearPlayerUnitSelection()`,
  `main.ts:26702-26703`).
  Przy okazji poprawione numery linii pinu w tej sekcji (zweryfikowane `git show 07d2fbd72:gra/src/main.ts`):
  `:16359` → `:16360` (`setHighlight(qual)`), `:16391-16394` → `:16392-16395` (`setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)`);
  `:16366` i `:16387` potwierdzone.
- `rust-port/view-model/src/map.rs` — dokumentacja `FogRevealDto::river_reveal_keys`: przy WYŁĄCZONEJ
  mgle zawsze `None`; pin `setFog(ALL_KEYS, ALL_KEYS)` bez opcji (`main.ts:13506`, zweryfikowane),
  `lastRiverRevealKeys = opts?.riverRevealKeys ?? null` (`render/scene.ts:3531`, zweryfikowane);
  producent `engine/src/domain/dto_bridge.rs::build_fog_layers` zwraca `None` (gałąź `else`, linie 185-190).

Punkt 3 (numery linii R5/STATCHIP) — JUŻ POPRAWIONE na bazie, bez zmian w allowliście:
- `renderer/src/cities/sync/stat_chips.rs` cytuje już `:889` (`hoverExpanded`, l. 35 i 307),
  `:929` (`lodLevel`, l. 308), `main.ts:2938`/`:2987` (`statChipHoverCityId`, l. 34) — wszystkie
  zweryfikowane w pinie (`cities.ts:889`, `:929`, `main.ts:2938`, `:2987`). Brak cytatów `:888`, `:928`,
  `:2988`, `657-680`, `740` w `renderer/src/cities/**` i `renderer/src/view/cities.rs` (grep pusty).
- Sprawdzone przykładowo w `view/cities.rs`: `cities.ts:875` (`_buildBadgeInput`), `main.ts:13503-13504`,
  `:13512-13513` (`applyFogVisibility`), `main.ts:2939` (`_cityRenderOpts`) — zgodne z pinem.

Commit: patrz sekcja SHA niżej (commit kodu i raportu jednym commitem na gałęzi roboczej).

## Dowód: diff tylko komentarze
Skrypt: `git diff -U0 | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*//'` → `0`
(zero zmienionych linii, które nie zaczynają się od `//`, `///`, `//!`). `git diff --stat`:
`renderer/src/view/units.rs | 29 +++---`, `view-model/src/map.rs | 7 ++-` (2 pliki, +24/−12).

## TESTY
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w
scratchpadzie (usunięty po bramkach). Dysk przed bramką: 16 GB wolnego (≥ 12).
- view-model: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
  `cargo test --all-targets --no-fail-fast` EXIT 0 (13 binarek, 109 passed, 0 failed).
- renderer: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
  `cargo test --all-targets --no-fail-fast` EXIT 0 (80 binarek, 687 passed, 0 failed).
- `Cargo.lock` renderera zmieniony przez build — przywrócony (`git checkout`), nie commitowany.

## BLOKADY / UWAGI
- DŁUG POZA ALLOWLISTĄ: `rust-port/renderer/src/models/cities/renderer.rs:591` nadal cytuje
  `cities.ts:657-680` dla `apply_fog_visibility`; w pinie `applyFogVisibility` zaczyna się w
  `cities.ts:740` (`657-660` to koniec `syncStatChips`). Ścieżka `models/cities/**` nie należy do
  allowlisty (`renderer/src/cities/**`, `view/cities.rs`), więc NIE poprawiono. Propozycja: dopisek do
  allowlisty w r2 albo osobny mikrotemat (jedna linia komentarza: `657-680` → `740-763`).
- Inne numery w `stat_chips.rs` i `view/cities.rs` poza wymienionymi w dispatchu nie były przedmiotem
  pełnego audytu (sprawdzone wyrywkowo, zgodne).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (weryfikacja diffu tylko-komentarze, numerów pinu i decyzji o linii poza allowlistą).
DEPLOY/PUSH: NIE WYKONANO
