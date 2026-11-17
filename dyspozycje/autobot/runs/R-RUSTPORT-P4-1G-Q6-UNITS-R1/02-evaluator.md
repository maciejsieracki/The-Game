# R-RUSTPORT-P4-1G-Q6-UNITS-R1 — Evaluator r1 (adwersarialny)

STATUS: FAIL (powód główny: INFRA — bramki kompilowane nieodtworzone, pełna bramka renderera nieuruchomiona; kod bez wady blokującej)
DOMAIN: GAME=nie (DTO → renderer)
TEMAT: R-RUSTPORT-P4-1G-Q6-UNITS-R1
GOAL: podpięcie adaptera jednostek/stosów, reachable, path_route, build_highlight, selection do renderera
ZMIANY/COMMIT: oceniany kod 92a91bcc3, raport Operatora dc4eb3423 (rodzic: baza r2 2760b4f0c = origin/rust-port/parity-v2, zweryfikowane `git rev-parse`). Ten raport: wyłącznie ten plik.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdzono realnie

| Sprawdzenie | Wynik |
|---|---|
| Baza = dodatek r2 (`2760b4f0c`), rodzic kodu | zgodne |
| `git diff --stat 2760b4f0c dc4eb3423` | 6 plików: engine/src/domain/overlays_view.rs (+254), renderer/src/view.rs (+8/-1), renderer/src/view/overlays.rs (+8), renderer/src/view/units.rs (nowy, 217), renderer/tests/overlays_units_q6.rs (nowy, 377), runs/01-operator-r1.md |
| Cargo.lock w commicie | brak (OK) |
| `git diff --check` | czysto |
| Trailery | bez nazwy modelu (OK, #289) |
| `#[ignore]` w nowych/zmienionych plikach | brak |
| renderer `cargo fmt --check` | EXIT 0 |
| engine `cargo fmt --check` | EXIT 0 |
| renderer `cargo clippy --all-targets -- -D warnings` | NIE URUCHOMIONO — dysk 2,9–3,0 GB wolnego (`df -h /`), równoległe buildy innych workerów; reguła < 8 GB / < 2 GB marginesu |
| renderer `cargo test --test overlays_units_q6` | NIE URUCHOMIONO (j.w.) |
| renderer `cargo test --lib` | NIE URUCHOMIONO (j.w.) |
| renderer `cargo test --all-targets --no-fail-fast` (≥ 12 GB) | NIE URUCHOMIONO, NIE_ZMIERZONO |
| engine `cargo test --lib q6_` | NIE URUCHOMIONO (j.w.) |
| Mutacje (a)(b)(c) | NIE ODTWORZONO (wymaga buildu); tylko deklaracja Operatora |
| Kod web na pinie 07d2fbd72 (`main.ts:7115-7134`, `:16351-16395`) | przeczytany, porównany z units.rs |

## Weryfikacja odstępstw Operatora

1. Ścieżka producenta: `rust-port/view-model/src/overlays_view.rs` nie istnieje na bazie; `build_highlight` (:223), `reachable_overlay` (:420), `path_route_overlay` (:449) są w `rust-port/engine/src/domain/overlays_view.rs` — numery linii dispatchu pasują do tego pliku. Interpretacja Operatora poprawna; zmiana w engine addytywna (nowa funkcja + testy), kształt DTO bez zmian. Formalnie plik poza dosłowną allowlistą — wymaga akceptacji orkiestratora.
2. Renderer bez zależności od engine (D-DTO-1 = A) — potwierdzone; podział łańcucha na dwa ogniwa uzasadniony.

## Zarzuty (ponumerowane)

1. **[BLOKUJĄCY, INFRA] Bramki kompilowane nieodtworzone przez Evaluatora i pełna bramka renderera nieuruchomiona ani przez Operatora, ani przez Evaluatora.** Wolne 3,0 GB. Kryterium końca dispatchu („Zielone bramki”, w tym `--all-targets --no-fail-fast`) niespełnione. Następna runda/FC musi uruchomić: clippy -D warnings, `--test overlays_units_q6`, `--lib`, pełną bramkę renderera (≥ 12 GB, bez równoległych buildów renderera) oraz `engine cargo test --lib q6_` i `--test view_overlays_reach_path`, z kodami wyjścia, i odtworzyć mutacje (a)(b)(c).
2. **[GOAL nie w pełni] Brak wołającego w produkcji.** `unit_overlays_view`, `UnitOverlayInputs::apply`, `sync_units` i (już wcześniej) `overlay_layers` są wołane wyłącznie z testów (`git grep` na 92a91bcc3). GOAL mówi „podpiąć w produkcji”. Zależność jest jawnie wskazana (most DTO engine→renderer, #308 / audyt L6), więc nie jest to cicha luka, ale orkiestrator powinien zapisać w REJESTR-RUST, że Q6 = „adapter gotowy, niewołany do #308”, a nie „ZINTEGROWANE w produkcji” (por. #309).
3. **[PARYTET, decyzja do rejestru] Q6-2 rozjeżdża się z pinem przy aktywnym trybie z zerem heksów.** Web: `foundCityMode` / `activeWonderId` → `setHighlight(pusty Set)` (main.ts:16359, :16366), czyli zasięg znika; tryb kopalni → `clearHighlight()` (:16387) niezależnie od liczby heksów. Rust (`units.rs::build_highlight_call`): puste `hexes` → `None` → pokazywany jest `reachable`. Przypadek realny: osadnik zaznaczony, tryb zakładania miasta bez żadnego dopuszczalnego heksu → web nie pokazuje nic, Rust pokazuje zasięg ruchu. Przyczyną jest kontrakt DTO (§3.7: puste `hexes` = brak warstwy; producent `no_layer()` daje kind=Improvement), który nie odróżnia „brak trybu” od „tryb aktywny, 0 heksów”. Wymagane: wpis decyzji technicznej z tą znaną rozbieżnością albo osobny temat zmiany kontraktu (np. `Option<BuildHighlightDto>`); nie blokuje kodu, ale rejestr nie może opisać Q6-2 jako „zgodne z pinem”.
4. **[KONTRAKT] Q6-1 sprzeczne z dokumentacją w tym samym pliku.** `SelectionUi` w engine ma doc: „przekazywany do producenta przez wołającego; `PlayableState.selected_unit_id` nie jest czytany” (D-CMD-12). `unit_overlays_view` buduje `SelectionUi` z `state.selected_unit_id`, nie aktualizując tego komentarza. Spójność z `reachable_overlay`/`path_route_overlay` jest argumentem merytorycznym, ale to zmiana kontraktu D-CMD-12 — decyzja orkiestratora i korekta docu `SelectionUi` (lub przyjęcie `SelectionUi` w `UnitOverlaysInput`).
5. **[TESTY] Wektory ręczne, nie generowane z pinu.** Testy engine reużywają wektorów R1/P1 opisanych jako „policzone ręcznie z pinu”; test renderera używa literałów DTO przepisanych ręcznie z wyniku engine, a oczekiwany stan renderera buduje tymi samymi wywołaniami `MapUnitRenderer`, które adapter ma wykonać (częściowo tautologiczne dla `apply`). Brak automatycznego spięcia ogniw (fixture JSON wygenerowany przez engine i konsumowany przez renderer). Do decyzji orkiestratora (wymaga pliku poza allowlistą); w obecnej formie mutacja zmieniająca jednocześnie producenta i literał nie zostałaby wykryta.
6. **[POKRYCIE] Agregator engine nie testuje trybu Mine.** `q6_tryby_budowy_przez_agregator` sprawdza FoundCity, Wonder, Improvement; Mine tylko po stronie renderera na literale. Dodać przypadek klucza kopalni złoża przez `unit_overlays_view`.
7. **[ALLOWLISTA, drobny] `rust-port/renderer/src/view.rs`** (mod + re-eksport) jest poza dosłownym wzorcem `renderer/src/view/`; zmiana czysto wiring — akceptowalne po potwierdzeniu orkiestratora.
8. **[DROBNY] `with_siege_map_panel_open` nie jest wołany przez `overlay_layers`** (panel oblężenia nie należy do `MapUiState`); produkcyjny wołający musi to zastosować sam — udokumentowane w komentarzu, ale łatwe do pominięcia przy moście #308.

## Ocena kodu (bez bramek)
Mapowanie DTO → wywołania renderera zgodne z pinem w zakresie: kolejność `setSelectionHex` → highlight → route (`main.ts:7119-7132`), krycie Improvement = `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY`, Mine → `clearHighlight` + warstwa Q5, panel oblężenia czyści tylko zasięg, `turnStops` przekazywane bez zmian, `None` → `clear*`. Brak osłabionych asercji, brak `#[ignore]`.

## NASTĘPNY KROK
Runda r2 (ten sam ID) po zwolnieniu dysku do ≥ 12 GB: odtworzenie wszystkich bramek z EXIT i mutacji; zarzuty 3, 4, 6 do poprawy lub jawnej decyzji w REJESTR-RUST; zarzuty 2, 5, 7 — decyzja orkiestratora.

TESTY: fmt renderer EXIT 0, fmt engine EXIT 0; pozostałe NIE URUCHOMIONO (dysk 3,0 GB).
BLOKADY: INFRA dysk (3,0 GB wolnego < 8/12 GB).
