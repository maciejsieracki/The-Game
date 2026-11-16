# 02a-obrona — R-RUSTPORT-P4-1F5-REACH-PATH-VIEW (Operator, obrona r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F5-REACH-PATH-VIEW
GOAL: `overlays.reachable` (reachableWithMergeTargets + occupiedForMove z passThrough) i `overlays.pathRoute` z `turnStops` wg pinu `07d2fbd72`.
ZMIANY/COMMIT: gałąź `rust-wip/R-RUSTPORT-P4-1F5-REACH-PATH-VIEW-obr-r1`, rodzic `ca1da74b5` (Evaluator r1; pod nim kod Operatora `e34af8294` na bazie `05b872fc5`). Pliki: `rust-port/engine/src/domain/overlays_view.rs`, `rust-port/engine/tests/view_overlays_reach_path.rs`, ten raport. Allowlista zachowana. `Cargo.lock` poza commitem.
TESTY: niżej (§Bramki).
BLOKADY: pełne `cargo test --all-targets` NIE_ZMIERZONO w tej rundzie, bo wolne miejsce przed tą bramką wynosiło 5,9 GB, a próg to 8 GB. Szczegóły w §Bramki.
RUNDY: obrona po Evaluatorze r1 (runda Operatora r2/5).
NASTĘPNY KROK: Final Control (pełne `--all-targets` przy ≥ 8 GB wolnego).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

**Z0 (przebieg Evaluatora)**: nie ma tu zarzutu. To opis tego, co Evaluator sprawdził. Przyjmuję go bez uwag.

**Z1 (granica `pathCost <= ruchLeft` nietestowana): PRZYJMUJĘ.** Dodałem wektor
`r7_cel_scalenia_przy_koszcie_rownym_ruch_left_dopisany`. Ruch wynosi 3, a własna jednostka stoi na (3,0).
W `computeReachable` heks (3,0) to `passThrough`, więc nie trafia do zasięgu (`setup.ts:948-949`).
Wchodzi do niego wyłącznie przez gałąź scalenia przy `pathCost` = 3 = `ruchLeft` (`main.ts:14728`).
Oczekiwany wynik to [(1,0),(2,0),(3,0)]. Dowód: mutacja M1 (`<=` → `<`) daje FAIL testu r7, wynik 13/14.

**Z2 (producenci wołani tylko z testów): PRZYJMUJĘ jako jawną zależność.** Nie wpinam ich w tym temacie,
bo dispatch zabrania ruszać `renderer/`, a adapter to P4-1G Q6 / PRIO-3D-2. W nagłówku
`overlays_view.rs` dopisałem zależność: wpięcie `reachable_overlay` i `path_route_overlay` należy do
P4-1G Q6 / PRIO-3D-2 (#237 / #270). Agregatora `OverlaysViewDto` w engine nie ma. Budują go równolegle tematy 1F
(1F3, 1F4) i powstanie przy integracji. Decyzja należy do orkiestratora.

**Z3 (`march_path_plan` powiela `preview_path_plan`): PRZYJMUJĘ, usuwam duplikat.** Nie mogę wołać
`march_path_plan` z `preview_path_plan`, bo `playable_movement.rs` jest poza allowlistą i obowiązuje zakaz zmiany
kontraktu P4-1H. Usunąłem więc `march_path_plan` i `path_route_of` z `overlays_view.rs`. Skład
`planPathTurns` + `applyFogToPathPlan` ma teraz w produkcji jedno miejsce: `preview_path_plan`.
Test P2 składa plan bezpośrednio z `plan_path_turns_occ` i `apply_fog_to_path_plan` (funkcje pathfinding)
i porównuje wynik z `path_route_overlay`. Mutacje działają teraz na kodzie produkcyjnym:
- M3: `apply_fog_to_path_plan` (pathfinding.rs) ucina `fullPath` do heksów widocznych bez przeliczenia
  `turnStops`. FAIL p2, 13/14.
- M4: puste `turn_stops` w produkcyjnym DTO `preview_path` (playable_movement.rs). FAIL hover, p1, p2
  i trasa_przez_wlasne, 10/14.
Obie mutacje były tymczasowe. Plik przywróciłem i sprawdziłem `cmp` (RESTORED). W commicie nie ma zmian w tych plikach.

**Z4 (`isHuman` zamiast `isMe`): PRZYJMUJĘ.** Pin: `isMe(o) = o === ME()` (`main.ts:13748-13750`),
`ME() = humanSeats.activeHumanOwnerId` (`main.ts:13729-13731`), bramka `!isMe(u.ownerId)` (`main.ts:7118`).
Zastąpiłem `is_human_owner` funkcją `is_me`, która używa `HumanSeats::is_active_human` (`player.rs:59`). `PlayableState` nie ma
pola aktywnego fotela, więc aktywny fotel = pierwszy gracz `is_human`, czyli web `HUMAN_OWNER_PRIMARY`, jedyny fotel w pinie.
Dług hot-seat (aktywny fotel w stanie) zapisałem przy #281 w nagłówku modułu.
`isAwaitingFirstPlayerCity()` liczy się dla `ME()`. Wołanie następuje po bramce `isMe(u.ownerId)`, więc `u.ownerId == ME()`,
a argument jest tożsamy z domyślnym argumentem pinu. Opisałem to w doc-komentarzu.
Nowy wektor: `hot_seat_zasieg_tylko_dla_aktywnego_fotela`. Są w nim dwa fotele ludzkie, 1 i 3, a jednostka fotela 3 dostaje pusty zasięg.
Mutacja M2 (`is_active_human` → `is_human_owner`) daje FAIL hot_seat, 13/14. Mutacja M5 (pominięta bramka isMe) daje FAIL bramki i hot_seat, 12/14.

**Z5 (`compute_reachable_occ` w pathfinding.rs): PRZYJMUJĘ do świadomej decyzji orkiestratora.** Kodu nie zmieniam.
Funkcja to wariant `computeReachable` z `passThrough` (`setup.ts:840-975`). Bez niej zakres 1 i 4 dispatchu nie jest
osiągalny. To jest granica allowlisty, więc decyzja należy do orkiestratora.

**Z6 (tekst dispatchu i ROZPOZNANIA 1F §4 o mgle): PRZYJMUJĘ, poprawka po stronie orkiestratora.** W pinie mgła
nie skraca trasy (`planned-march.ts:56-75`, C-RUCH-Q1=B). Dokumentów orkiestratora nie edytuję, bo leżą poza allowlistą.

**Z7 (all-targets nie puszczone przez Evaluatora): PRZYJMUJĘ, w tej rundzie również NIE_ZMIERZONO.** Wolne miejsce przed
bramką wynosiło 5,9 GB, a próg to 8 GB. Po drodze wahało się od 5,3 do 8,3 GB, bo dysk zajmują inne sesje. Puściłem bramki
mieszczące się w zasięgu: fmt, clippy --all-targets, --lib i test tematu. Pełne `--all-targets` przekazuję Final Control.
Ostatni pełny pomiar pochodzi z raportu Operatora r1 na `e34af8294`: EXIT 0, 3665 passed.

## Bramki (rust-port/engine, kod tej obrony)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo), po bramkach usunięty.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test view_overlays_reach_path` | EXIT 0, 14/14 (12 dotychczasowych + r7 + hot_seat) |
| `cargo test --lib` | EXIT 0, 124/124 |
| `cargo test --all-targets --no-fail-fast` | NIE_ZMIERZONO, wolne 5,9 GB < 8 GB |

Mutacje, wszystkie z FAIL i przywróceniem (cmp RESTORED):

| Mutacja | Wynik |
|---|---|
| M1 `<=` → `<` (pętla stosów, `main.ts:14728`) | FAIL r7, 13/14 |
| M2 `is_active_human` → `is_human_owner` | FAIL hot_seat, 13/14 |
| M3 mgła ucina `fullPath` bez przeliczenia `turnStops` (pathfinding.rs) | FAIL p2, 13/14 |
| M4 puste `turnStops` w produkcyjnym `preview_path` | FAIL hover, p1, p2, trasa_przez_wlasne, 10/14 |
| M5 bramka `isMe` pominięta | FAIL bramki, hot_seat, 12/14 |

`#[ignore]` w plikach tematu: brak. `march_path_plan` i `path_route_of`: usunięte, odwołań w kodzie brak.

## Sprzątanie

Sprzątałem tylko po sobie: usunąłem `CARGO_TARGET_DIR` tej obrony i kopie zapasowe mutacji. Prośbę użytkownika
o sprzątanie dysku obsługuje orkiestrator w głównym czacie. Ten etap Workflow to wyłącznie obrona tematu,
a katalogi innych sesji (`/tmp/claude-0/**/scratchpad/*_target`, worktree `wf_*`) mogą jeszcze być w użyciu.
