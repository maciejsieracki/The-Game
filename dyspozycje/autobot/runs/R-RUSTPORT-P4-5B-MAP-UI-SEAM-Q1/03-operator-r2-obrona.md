STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1
GOAL: Obrona Operatora (r2) wobec 12 zarzutów Evaluatora r1 (`10dfd528`) do dokumentu `dyspozycje/rust-port/p4/P4-5B-MAP-UI-SEAM.md` (stan wyjściowy: commit Operatora `0ae5dfd5`, baza `85fbdcce`).
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-5B-MAP-UI-SEAM.md` (poprawki r2), ten plik, `logi-r2/01..06-*.txt` (rozszerzenie `.txt`, bo `.gitignore:20` ignoruje `*.log`) (surowe wyjście z EXIT). Commit w worktree `wf_1b7cdb13-1cb-3`, rodzic `0ae5dfd5`; SHA w odpowiedzi do orkiestratora. Bez push.
TESTY: temat dokumentacyjny, bez buildu. Ponowne pomiary: logi w `logi-r2/`. `git diff --cached --check` przed commitem.
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 (ten sam ID), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

| # | Werdykt | Poprawka / dowód |
|---|---|---|
| 1 | **PRZYJMUJĘ** (zastrzeżenie: dispatch `00-dispatch.md` dosłownie wymaga „komendy/plik:linia”, nie surowych logów — mimo to logi dodane) | `logi-r2/01..06-*.txt` (rozszerzenie `.txt`, bo `.gitignore:20` ignoruje `*.log`): każdy z poleceniem i `EXIT=`; odwołania w §16, §7, §9, §10, §3.4 |
| 2 | **PRZYJMUJĘ** | Nowy §1a — macierz R1–R16: R1, R2, R11 wyłączone z uzasadnieniem (P4-5C, D-UI-7, P5-1); R10 objęte częściowo (wejście §4.2 z `#cs-okolica-center`, kamera §9; rysowanie okolicy → RR-T9); pozostałe z odnośnikami do sekcji |
| 3 | **PRZYJMUJĘ CZĘŚCIOWO** — 14 było błędne, ale 17 też | `logi-r2/01-projekcja.txt`: 16 linii; `git grep -c`: battleScene 4, manualBattle 3, picker 2, main 7 = 16. Rozkład per grupa w §7 |
| 4 | **PRZYJMUJĘ** | §8: liczenie 13/3/1/5 = 22; `getBuiltBuildingIds`, `ownerColorFn`, `getCivIconId` → (a); `isVisible` jako pole mieszane (mgła z modelu widoku ∧ filtr panelu z `UiState`) |
| 5 | **PRZYJMUJĘ** | §3.2: dwa wiersze PPM; `MapRightUp` (bez filtrów, `main.ts:26338-26343`) i `MapContextMenu` (filtry `:26211-26212`); §5.3 typy; Z15 — kolejność i jej wpływ na tryb budowy, `NIE_ZMIERZONO` §15 pkt 13 |
| 6 | **PRZYJMUJĘ** | §3.1: `PointerLeave` usunięte, `WindowLeave` (→ `mouse_leave`, `camera.rs:340-342`) jako jedyne leave dla kamery; `CanvasLeave` wewnętrzne (§3.4, Z13): mapa → UI nie zeruje kursora kamery, edge-pan pod HUD trwa. Dodany drugi handler `mouseleave` `main.ts:13085-13089` (chip budowy) |
| 7 | **PRZYJMUJĘ** | §3.1: `MapInput { scene, over_ui, ev }`; §5.3: typ granicy `MapHit::Unit{unit_id, hex}` (z `UnitPickModel.id`, `pick/mod.rs:183`), indeks wycinka (`:216`) nie wychodzi z Rust |
| 8 | **PRZYJMUJĘ** | Z5 przepisane: twierdzenie r1 wycofane; `CityPanelGeometry` (§4.1) liczona kodem weba, formuła 1:1 z pasami/półpłaszczyzną (§4.2); F4a odtwarzane domyślnie; D-SEAM-1 odwrócone (A = 1:1); test T2 (wektory złote przy z ∈ {0,85; 1; 1,5}) |
| 9 | **PRZYJMUJĘ** | §15 pkt 9 zamknięty: `minimap.ts:9` → `hexutil` (`logi-r2/03`); §9: konsumenci `getMinimapData` `minimap.ts:241` i dźwięk `computeWaterView` `main.ts:14450-14456`; jedno źródło `minimap_viewport` (Z12) |
| 10 | **PRZYJMUJĘ** | §12: tabela T1–T14 z przypisaniem do RR-T1/RR-T8/RR-T11/RR-T12/RR-T13/P5-0/P7, w tym `scale_factor` (T6), `seq` (T7), przekazywanie i `pass_through` (T8), leave/hover (T9), kolejność `HoverChanged` (T10), D-UI-9 (T11), bufor `W/z` (T12), `FullscreenChanged` (T13) |
| 11 | **PRZYJMUJĘ** | Z14 (§3.4): hover tylko po `PointerMove{over_ui:false}`; zakaz liczenia przy ruchu kamery i co klatkę; dowód: jedyne wywołania pickingu hovera `main.ts:26235,26253,26271` (`logi-r2/04`) |
| 12 | **PRZYJMUJĘ** | §10: źródło stanu `Window::is_fullscreen()` (`tauri-2.11.5/src/window/mod.rs:1502`, `logi-r2/06`), odpytanie po `Resized`/`ScaleFactorChanged` (`on_window_event` `:1179`) i po `set_fullscreen`; niepewność → `NIE_ZMIERZONO` §15 pkt 8 |

Dodatkowo (z ponownego pomiaru): zakres `WindowEvent` poprawiony z `window.rs:30-85` na `:30-64` (§0, F1).
