# 02-evaluator — R-RUSTPORT-P4-1F5-REACH-PATH-VIEW (Evaluator r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F5-REACH-PATH-VIEW (P4-1F5 / PRIO-3D-5, #273 · #242)
GOAL: producent `overlays.reachable` (`reachableWithMergeTargets` + `occupiedForMove` z `passThrough` + `foreignCityHexKeys`) i `overlays.pathRoute` z `turnStops` (`marchPathPlan`, plan z `planned_marches`, hover przez `preview_path` P4-1H).
ZMIANY/COMMIT: oceniany kod `e34af8294` (raport `a3918f9e1`), rodzic `05b872fc5` = baza z DODATKU r2. Ten raport: commit na `rust-wip/R-RUSTPORT-P4-1F5-REACH-PATH-VIEW-ev-r1` (rodzic `a3918f9e1`), bez push.
TESTY: patrz §1.
BLOKADY: brak blokujących. Zarzuty niżej, żaden nie jest FAIL.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone samodzielnie (`rust-port/engine` na `e34af8294`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie sesji poza repo (usunięty po bramkach).
Dysk: `df -h /` przed bramkami pokazywał 7,7–7,8 GiB wolne (8,3 GB dziesiętnie), czyli na granicy progu 8 GB. Dlatego uruchomiłem tylko bramki z zadania Evaluatora: fmt, clippy, `--lib` i test z dispatchu. Pełnego `--all-targets` nie uruchomiłem, bo zająłby miejsce potrzebne innym sesjom. Wynik `--all-targets` (EXIT 0, 3665 passed) podaje tylko Operator, ja go nie powtórzyłem (NIE_ZMIERZONO).

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test view_overlays_reach_path` | EXIT 0, 12 passed, 0 failed, 0 ignored |
| `cargo test --lib` | EXIT 0, 124 passed, 0 failed, 0 ignored |

## 2. Co sprawdziłem

- Allowlista: `git diff --stat 05b872fc5 a3918f9e1` obejmuje 5 plików: `overlays_view.rs` (nowy), `pathfinding.rs` (+84), `mod.rs` (+1 `pub mod overlays_view;`), `tests/view_overlays_reach_path.rs` (nowy) i raport. `Cargo.lock` nie jest w commicie. `gra/`, `renderer/`, `preview_path` i `move_unit` nie zostały zmienione.
- `#[ignore]` w plikach tematu: brak. Asercje są ścisłe (`assert_eq!` na pełnych wektorach i kolejności). Jedyna luźniejsza asercja, `contains` w R2, jest uzupełniona dokładnymi wektorami w R1 i R4.
- Parytet z pinem `07d2fbd72`:
  - `compute_reachable_occ` zgadza się z `computeReachableImpl` (`setup.ts:840-975`) linia po linii: `occupied.has` → `occ.blocked`; `passThrough` jest przechodni, ale nie trafia do zasięgu (`:953`); MIN-MOVE wyklucza `passThrough` (`:974`); `min_budzet_kroku` = 1 (`ruch-jednostek-params.json:31`) odpowiada `budget >= 1`; start jest usuwany z wyniku.
  - `reachable_with_merge_targets` zgadza się z `main.ts:14706-14731` (kolejność kroków, `seenStacks`, `canJoinStackAt`, `computePath`, `pathCost <= ruchLeft`). `compute_path(..., &occ.blocked)` jest równoważne webowemu `computePath(..., occ)`, bo `MoveOccupancy extends Set` i `has` widzi tylko blokady.
  - `occupied_for_move` (P4-1H) z `add_foreign_city_block_coords` odpowiada `main.ts:14578-14585`, a R5 i R6 to sprawdzają.
  - `march_path_plan` odpowiada `main.ts:31110-31122`.
- Wektory są wyliczone ręcznie z pinu, z `plik:linia` w komentarzach, i nie są kopiowane z wyjścia Rust.
- Mutacja własna Evaluatora: zamieniłem w pętli stosów `path_cost(..) <= mover.ruch_left` na `<`. Wynik: **PRZEŻYWA** (12/12). Plik przywróciłem z kopii. Szczegóły w zarzucie 1.
- Mutacje Operatora (a), (b), (c), (d), (e) czytałem w raporcie, ale ich nie powtarzałem. Ich opis jest spójny z kodem i testami. Na przykład (b) psuje R1, R2 i R4. Sprawdziłem też ręcznie, że usunięcie wykluczenia `passThrough` w MIN-MOVE wywaliłoby R4 (`full`).

## 3. Zarzuty

1. **Granica kosztu dla celu scalenia nie jest testowana.** Mutacja `pathCost <= ruchLeft` → `<` (`overlays_view.rs`, pętla stosów, pin `main.ts:14728`) przeżywa. Żaden wektor nie ma własnego stosu w odległości dokładnie równej `ruchLeft` poza zasięgiem `computeReachable`. Brakuje wektora typu: ruch 2, własna jednostka na (2,0) i obca blokada, albo nieprzechodni układ, w którym (2,0) wchodzi do zasięgu wyłącznie przez gałąź scalenia przy koszcie = 2. Waga: średnia, bo to dokładnie ten warunek, który ma parytetować pin.
2. **Producenci nie mają wołającego w Rust.** `reachable_overlay`, `path_route_overlay`, `path_route_of` i `march_path_plan` są wołane wyłącznie z testów. W engine nie ma agregatora `OverlaysViewDto`, a `OverlaysViewDto` występuje tylko w `view-model`. Raport nie podaje jawnej zależności, czyli tematu, który je wepnie (prawdopodobnie P4-1G Q6 / PRIO-3D-2, #270). Trzeba ją dopisać w raporcie albo w rejestrze. Waga: niska, bo zakres dispatchu to producent, nie agregacja.
3. **`march_path_plan` powiela `preview_path_plan`.** `path_route_overlay` deleguje do `preview_path`, który sam robi `plan_path_turns_occ` + `apply_fog_to_path_plan` (`playable_movement.rs:323-351`). Funkcja `march_path_plan` nie jest więc na ścieżce produkcyjnej. Test P2 porównuje ją z wynikiem `preview_path` i oba wyniki są zgodne, ale tylko dlatego, że obie ścieżki są niezależnymi kopiami. Mutacje (c) i (d) Operatora dotykają `march_path_plan` i `path_route_of`, nie `preview_path`. Do rozważenia: `preview_path_plan` woła `march_path_plan`, albo `march_path_plan` zostaje usunięte. Waga: niska, to duplikacja bez rozbieżności.
4. **`isMe` jest zaimplementowane jako `isHuman`.** `is_human_owner` w `overlays_view.rs` sprawdza `players.any(is_human && id == owner)`. Pin rozróżnia `isMe(owner)` (`owner === ME()`, aktywny fotel, `main.ts:13748-13750`) od `isHuman` (którykolwiek fotel ludzki, `:13740`). Przy jednym fotelu to brak różnicy, ale w hot-seat zasięg pokazałby się dla jednostki nieaktywnego człowieka. W Rust jest `HumanSeats::is_active_human` (`player.rs:59`). Należy go użyć albo jawnie odnotować dług razem z #281 (aktywny fotel ME()). Ta sama uwaga dotyczy `isAwaitingFirstPlayerCity()` (w pinie liczone dla `ME()`, w Rust dla właściciela jednostki). Waga: niska.
5. **`pathfinding.rs` jest na granicy allowlisty.** Dispatch dopuszczał tam „TYLKO `build_move_occupancy` / `passThrough`, jeśli brak”. `build_move_occupancy` już istniało. Dodano nową funkcję `compute_reachable_occ`, czyli wariant `computeReachable` czytający `passThrough`. Mieści się to w duchu punktu („passThrough, jeśli brak”) i jest uzasadnione w raporcie. Orkiestrator powinien to jednak świadomie przyjąć. Waga: informacyjna.
6. **Wektor „trasa skrócona przez mgłę” odwrócono względem dispatchu.** Rozstrzygnięcie według pinu jest poprawne (`planned-march.ts:56-75`, C-RUCH-Q1=B: `applyFogToPathPlan` jest tożsamością). Mutacja (c) w dosłownym brzmieniu jest równoważna. Zaakceptowane zgodnie z zasadami 9 i 11. Orkiestrator powinien poprawić tekst dispatchu i ROZPOZNANIA 1F §4, żeby kolejne tematy nie powtarzały tego wektora. Waga: informacyjna.
7. **Pełnego `--all-targets` nie odtworzyłem.** Powód: dysk na granicy 8 GB (§1). FC powinno go uruchomić przy ≥ 8 GB wolnego. Waga: informacyjna.

## 4. Werdykt

PASS-WITH-NOTES. Kod odpowiada pinowi, bramki z zakresu Evaluatora mają EXIT 0, testy są behawioralne na wektorach pinu, nie ma `#[ignore]` ani osłabionych asercji. Do domknięcia przez Operatora w kolejnej rundzie lub w długu: zarzut 1 (wektor granicy `==`), zarzut 4 (`isMe` / aktywny fotel) oraz jawna zależność wpięcia z zarzutu 2.
