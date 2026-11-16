# 03 — Final Control, R-RUSTPORT-P4-1H-PREVIEW-Q5 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-PREVIEW-Q5 (#251)
GOAL: czyste zapytanie `preview_path(&PlayableState, UnitId, Option<PositionDto>) -> Option<PathRouteDto { hexes, turn_stops }>`
odpowiadające `refreshPlannedMarchPreview` / `refreshHoverPathPreview` z pinu `07d2fbd72`, `budget = None`.

## Baza i ancestry

- Baza z dispatchu: `b3c0b2209` = `origin/rust-port/parity-v2` (sprawdzone `git rev-parse`: `b3c0b2209578a09000a45040ec5b03c3aa444e5f`).
- Kod Operatora: `8408a2535` (rodzic `b3c0b2209`), `git merge-base --is-ancestor b3c0b2209 8408a2535` → prawda.
- Obrona: `c9f538309` (rodzic `8408a2535`, tylko raport 02a).
- FC: ten raport na gałęzi `wip/R-RUSTPORT-P4-1H-PREVIEW-Q5-fc`, rodzic `c9f538309`.
- Raport Evaluatora (`66c968055`, gałąź `-ev`) leży poza tą linią; do integracji wystarczy linia Operator → Obrona → FC.
- SHA do integracji (kod): `8408a2535`. Linia z raportami: SHA FC (commit tego pliku).

## Allowlista (samodzielnie, `git diff --stat b3c0b2209 c9f538309`)

| Plik | Na allowliście |
|---|---|
| `rust-port/engine/src/domain/playable_movement.rs` (+155/-1) | tak |
| `rust-port/engine/tests/p4_1h_preview_path.rs` (nowy, 281) | tak (`p4_1h_preview_*.rs`) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-PREVIEW-Q5/{01-operator-r1.md,02a-obrona.md,mutacje-r1.sh}` | tak |

Brak `Cargo.lock`, brak `gra/`, brak `bridge.rs` i view-model (typ `PathRouteDto` z `turn_stops`
już istnieje: `view-model/src/overlays.rs:218-222`, walidacja `validate.rs:357`). `git diff --check` czysty.
Brak `#[ignore]` w nowym pliku testów; asercje to `assert_eq!` na pełnych wektorach.

## Weryfikacja kodu względem pinu (samodzielnie)

Przeczytane `git show 07d2fbd72:gra/src/main.ts`: `perTurnMoveForUnit` 31084-31095, `marchPathPlan` 31110-31122,
`refreshPlannedMarchPreview` 31146-31179, `refreshHoverPathPreview` 31181-31209, handler hovera 32296-32342.
Zgodne: stos `playerStackAt` → `occupiedForMove(owner, ...stack ids)` → `unitWithPlanningStackRuch`;
`perTurn` z `u` (nie z `mover`); `budget = undefined` → `None`; plan ma pierwszeństwo (32335-32340);
`[{q:u.q,r:u.r}, ...plan.fullPath]` + `turnStops`; `fullPath.length === 0` → `None`; funkcja przyjmuje `&PlayableState` (brak zapisu).

## Orzeczenia zarzutów

1. **Strażnik `isMe` — ODDAL.** W pinie strażnik `!isMe(uSel.ownerId)` jest w handlerze hovera (main.ts:32301-32306),
   nie w `refreshHoverPathPreview`/`refreshPlannedMarchPreview` — zapytanie jest wierne pinowi. Przekazanie
   (wiążące dla #237/#242): wołający sprawdza właściciela (z erratą PlayerId: gracz = 1) i test „wróg → brak trasy”.
2. **Gałąź garnizonu `activeUnitStack` — ODDAL.** Nieosiągalna dziś (adapter Q4: `in_garnizon = false`, brak garnizonów
   w `PlayableState`); dopisanie wykracza poza zakres. Warunek zamknięcia: temat dodający garnizony portuje
   `garrisonUnitsOnHex` (armyMerge.ts:248-250) do `player_stack_at` z testem.
3. **Żegluga — ODDAL (NIE_ZMIERZONO zgodnie z erratą dispatchu).** `ownerHasSeafaring` (main.ts:14589-14593) ma gałąź
   `ownerId === 0`; dispatch każe zatrzymać się i zapisać NIE_ZMIERZONO, co zrobiono. Przechodzi do Q6 / mapowania PlayerId.
4. **Pełny `cargo test --all-targets` jednym poleceniem — ODDAL z notą.** Operator wykonał ten sam zakres w częściach
   (lib/bins/examples/benches EXIT 0, 124 testy lib; 485/485 binariów `tests/*.rs` EXIT 0, 3449 passed, 0 failed).
   Evaluator powtórzył fmt, clippy `--all-targets -D warnings` (kompiluje wszystkie testy), `--lib`, `p4_1h_preview_path` 11/11 — EXIT 0.
   FC: **NIE_ZMIERZONO** — wolne miejsce w chwili FC: 946 MB → 875 MB (`df -h /`), poniżej progu 8 GB; kompilacja silnika
   groziłaby zapełnieniem dysku i padnięciem innych tematów. FC wykonał `cargo fmt --check` w `rust-port/engine` → EXIT 0
   (bez kompilacji). **Bramka dla orkiestratora:** pełny `cargo test --all-targets --no-fail-fast` silnika po integracji
   przy ≥ 8 GB wolnego przed FF parity-v2.
5. **Brak testu przez `validate.rs` — ODDAL.** Wektory `turn_stops` (`[(2,1),(4,2)]`, `[(1,1)..(4,4)]`, `[(3,1),(5,2)]`, `[(2,1)]`)
   są porównywane `assert_eq!` i każdy spełnia regułę validate.rs:351-366; test walidacji należy do producenta `path_route` (#237/#242).

Brak zarzutów NAPRAW → PASS-WITH-NOTES.

ZMIANY/COMMIT: kod `8408a2535` (2 pliki w allowliście); raport FC na `wip/R-RUSTPORT-P4-1H-PREVIEW-Q5-fc`.
TESTY: FC: `cargo fmt --check` (engine) EXIT 0; `git diff --check` czysty; pełny test silnika NIE_ZMIERZONO (dysk 875 MB).
Wyniki Operatora/Evaluatora jak wyżej (EXIT 0).
BLOKADY: brak blokad tematu; bramka pełnego testu przeniesiona na integrację.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora `8408a2535` na parity-v2 + pełny `cargo test --all-targets` silnika i view-model przy ≥ 8 GB wolnego.
DEPLOY/PUSH: NIE WYKONANO.
