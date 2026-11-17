# R-RUSTPORT-P4-1G-Q6-UNITS-R1 — adapter jednostek i nakładek ruchu (PRIO-3D-2, #270/#328)

STATUS: dispatch orkiestratora. Opus (grafika/3D). Operator Opus, Obrona Opus, Evaluator i FC Sonnet (wg skryptu grafiki).
DOMAIN: GAME=nie (DTO → renderer). Gameplay bez zmian.

## GOAL
Podpiąć w produkcji adapter jednostek/stosów, zasięgów (`reachable`), trasy (`path_route`), podświetlenia budowy
(`build_highlight`) i zaznaczenia (`selection`) do renderera. Dziś składacze istnieją, ale producent nakładek
nie woła `reachable_overlay` ani `path_route_overlay` (registry: „składacz nie jest wołany w produkcji”).

## BAZA (absolutny priorytet)
`origin/rust-port/parity-v2` = `c120f2373`. Worktree świeży: `git worktree add --detach <ścieżka> c120f2373`.

## STAN W PARITY (zweryfikuj przed zmianą)
- Typy DTO: `view-model/src/overlays_view.rs` (`build_highlight` ~:223, `path_route_overlay` ~:449, `reachable` w `OverlaysViewDto`).
- Renderer: `renderer/src/view/overlays.rs` (`overlay_layers` ~:814, `build_highlight` / `mine_eligible_group` ~:621),
  `renderer/src/models/misc/build_highlight.rs`.
- Zależność R1 (żetony jednostek) jest zintegrowana (`3dec6ac5d` ∈ parity). R6 zintegrowane (`c120f2373`).
- Brak wołającego: `reachable_overlay` i `path_route_overlay` (view-model) nie są wołane przez producenta nakładek.

## ZAKRES
1. Producent nakładek w adapterze (`view/overlays.rs`): wołać `reachable_overlay` i `path_route_overlay` z danych
   `PlayableState` (plany marszu, `preview_path`, `PathRouteDto` z `turn_stops`) — tylko gdy stan je zawiera.
2. Stosy/jednostki: `units`/`stacks` → renderer, z `StackViewDto` z `compute_stack_display` (P4-1D, już w parity).
3. `selection` i `build_highlight` (4 tryby) — wpiąć do tej samej ścieżki `overlay_layers`, bez zmian kształtu DTO.
4. Test integracyjny w `renderer/tests/` (nowy plik `overlays_units_q6.rs`): sekwencja `PlayableState` → DTO →
   `overlay_layers` → asercje: zasięg zawiera heksy z `reachable`, trasa ma `turn_stops`, `build_highlight` ma właściwy tryb.
5. Mutacje FAIL: (a) pominięcie `reachable_overlay`; (b) `path_route` bez `turn_stops`; (c) build_highlight z błędnym trybem.

## ALLOWLISTA
`rust-port/renderer/src/view/overlays.rs`, `rust-port/renderer/src/view/` (tylko wiring), `rust-port/view-model/src/overlays_view.rs`
(tylko wywołanie, nie zmiana kształtu), `rust-port/renderer/tests/overlays_units_q6.rs`, katalog runs.
Nie ruszać `cities/mod.rs` ani `revolt`. Nie ruszać `gra/`.

## BRAMKI (EXIT 0)
`rust-port/renderer`: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test overlays_units_q6`;
`cargo test --all-targets --no-fail-fast` (timeout 1700 s), zero FAILED/panicked. Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` poza repo, usuń po bramkach. DYSK ≥ 12 GB przed bramką pełną (`df -h /`); inaczej BLOCK INFRA z liczbą GB
(reguła bramki renderera: bez równoległych buildów).

## KRYTERIA KOŃCA
Zielone bramki, mutacje FAIL, commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`, trailer bez nazwy modelu (#289).
Raport `01-operator-r1.md`. Nie pushować do `rust-port/parity-v2`.

## DODATEK r2 (orkiestrator, 2026-11-17 14:0x): BAZA przesunięta
- BAZA r2: `origin/rust-port/parity-v2` = `2760b4f0c` (T4e-0 `732ef51a0` zintegrowany). Worktree detached na `2760b4f0c`.
- Zakres bez zmian. Bramka renderera (≥12 GB, bez równoległych buildów renderera) obowiązuje przy bramce pełnej; start Operatora dozwolony przy ≥8 GB.

## DODATEK r2 (orkiestrator, po FAIL FC: INFRA + GOAL): zakres i bramka
- DECYZJA (orkiestrator, techniczna): wołający produkcyjny (`unit_overlays_view`, `UnitOverlayInputs::apply`, `sync_units`) NIE wchodzi w ten temat. Podpięcie zależy od drogi DTO engine → renderer (#308, audyt L6), która jest osobnym tematem DTO-BRIDGE. Ten temat kończy się na adapterze i testach. Cel „podpiąć w produkcji” w tym temacie zostaje przeniesiony do DTO-BRIDGE.
- KOD: bez zmian względem zatwierdzonego wcześniej (zabezpieczenie w commitach roboczych Operatora r1, gałąź `rust-port-wip/P4-1G-Q6-UNITS-r1`). Nie przepisywać.
- BRAMKA (INFRA): odtworzyć pełną bramkę na tym samym kodzie: `cargo fmt --check` i `cargo clippy --all-targets -- -D warnings` w engine i renderer; `cargo test --test overlays_units_q6`; `cargo test --lib`; `cargo test --all-targets --no-fail-fast` w obu crate'ach. Zero FAILED/panicked.
- DYSK: ≥ 12 GB przed bramką renderera (reguła renderera). Przy mniejszym: BLOCK INFRA z liczbą GB, bez zmian w kodzie.
- BAZA r2: `2760b4f0c`.
- Trailery commitów: bez nazwy modelu (#289). Raport `02-operator-r2.md`. Nie pushować do parity.
