STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1
GOAL: Ocena adwersaryjna dokumentu P4-5B (kontrakt granicy mapa Rust ↔ UI webview) z commitu Operatora `0ae5dfd5`.
ZMIANY/COMMIT: tylko ten plik (Evaluator); dokument Operatora bez zmian.
TESTY: bramki powtórzone w czystym worktree `wf_1b7cdb13-1cb-2` (detach `0ae5dfd5`):
- `git log --format='%H %P' -1 0ae5dfd5` → rodzic `85fbdcce` (baza z dispatchu) — OK
- `git diff --name-status 85fbdcce 0ae5dfd5` → `A .../01-operator-r1.md`, `A dyspozycje/rust-port/p4/P4-5B-MAP-UI-SEAM.md` — w allowliście, EXIT 0
- `git diff --check 85fbdcce 0ae5dfd5` → brak wyjścia, EXIT 0
- `git grep -n -E "setViewOffset|filmOffset|clearViewOffset" edb8fb56 -- gra/src` → brak trafień (F5 potwierdzone)
- `git grep -n -E "\.project\(|worldToClientPx\(|worldToScreen\(|hexCenterClientPx\(" edb8fb56 -- gra/src` → **17 linii** (dokument: 14)
- Tauri cache: `WindowEvent` 8 wariantów (`tauri-runtime-2.11.3/src/window.rs:30-64`), `CursorMoved|MouseInput|MouseWheel|CursorEntered|CursorLeft` w `tauri-runtime-wry-2.11.4/src` → 0, `set_cursor_icon :2207`, `set_fullscreen :2119`, `cursor_position :1748`, `set_ignore_cursor_events :2225`, `tao CursorIcon :1445`, `CustomCursor` → 0 — F1/F7 potwierdzone
- LEDGER `:123`, `:127`, `:134` — D-RR-2=A, D-RR-10, UI-Q1..3, `manualBattle.ts` 0 importerów — potwierdzone
BLOKADY: brak technicznych.
RUNDY: 1/5
NASTĘPNY KROK: Obrona/poprawki Operatora (r2), ten sam ID.
DEPLOY/PUSH: NIE WYKONANO

## Zarzuty

1. **Brak pełnych surowych logów z EXIT** (wymóg dispatchu). Raport i §16 podają tylko streszczenia („→ 0”, „→ 14 linii”), bez surowego wyjścia i kodów wyjścia.
2. **Brak macierzy pokrycia R1–R16 z P4-5 §2.3.** Dokument nie mapuje wierszy na kontrakt. Bez kontraktu i bez jawnego wyłączenia z uzasadnieniem: R1 (miniatury 3D jednostek — obraz z renderera Rust do UI, D-UI-3, transport przez tę granicę), R2 (sonda WebGL), R10 (panel miasta „mapa centralna”, `cs-okolica-center` w `cityUxFrame.ts:200-204`, nakładka okolicy), R11 (importy `render/**` w UI, np. `cityPanel.ts:209` `axialToWorld`). R3/R7/R8/R9/R13/R14/R16 są opisane, ale bez ID, więc nie da się tego prześledzić.
3. **Liczba w §7 jest błędna:** grep z §7/§16 zwraca 17 linii na `edb8fb56`, nie 14.
4. **§8 źle liczy i niespójnie klasyfikuje pola.** Wg listy samego dokumentu klasa (a) ma 10 pól (`getWalls` i `getWallKind` to dwa pola), a (c) ma 8, a nie 9/9 (`main.ts:2592-2648`). Klasyfikacja jest niespójna z regułą D-UI-9: `getBuiltBuildingIds` (zbudowane budynki widoczne w panelu miasta), `ownerColorFn`/`getCivIconId` (kolor i ikona cywilizacji, też w UI) są w (c). `isVisible` (mgła = logika widzenia gry, `cityFogVisible`) jest w (b) jako „stan UI”.
5. **PPM sprzeczny z webem.** `mouseup` z `button===2` (`main.ts:26338-26343`) wywołuje `exitBuildMode`/`dismissPlayerUnitSelectionIfAny` **bez** filtrów `galleryOn`/`isAnimating`/`isPostBattleSummaryOpen`/`isPointOverCityPanelUi`. Filtry ma tylko `contextmenu` (`:26211-26212`). §3.2 przypisuje filtry całemu PPM, a §5.3 scala dwa handlery w jeden `MapContextMenu`, co łamie 1:1.
6. **`PointerLeave` scala dwa różne zdarzenia weba.** Pierwsze to `mouseleave` canvasu (`main.ts:26328`: reset hovera i kursora; w webie odpala się też przy wejściu na element HUD). Drugie to `mouseleave` dokumentu (`camera.ts:213`: zeruje pozycję kursora). W Rust `CameraController::mouse_leave` (`camera.rs:340-342` @ `69f432ba`) zeruje `mouse_client`. Jeśli Rust zgłosi „leave” przy wejściu kursora w prostokąt UI, edge-pan pod HUD przestanie działać, wbrew F3/Z4 i P4-11. Kontrakt nie określa, kiedy Rust emituje leave przy przejściu mapa → UI.
7. **Niespójne typy i sprzeczność z P4-10.** `MapInput` (§3.1) nie ma pola `over_ui` (używanego w Z4 i §4.4) ani `scene` (Z11). `MapClick.hit: Option<MapPick>` przenosi `MapPick::Unit{index}`, czyli indeks w wycinku `units` (`pick/mod.rs:214-219`), który dla UI nic nie znaczy. Brak id jednostki (`UnitPickModel.id`, `:183-184`).
8. **Z5 twierdzi „przy z=1 wynik ten sam co w webie” bez dowodu, a twierdzenie jest wątpliwe.** Predykat weba to częściowo pasy geometryczne bez ograniczenia drugiej osi: `x >= rightPanelLeft` → true dla każdego y (`cityUxFrame.ts:215`), `x∈[leftMargin,leftPanelEnd)` dla każdego y (`:210`), `y < tr.bottom` na całej szerokości (`:193`). To nie są prostokąty DOM. Zamiana na `getBoundingClientRect` kontenerów zmienia wynik także przy z=1 tam, gdzie panel nie wypełnia pasa. Twierdzenie trzeba oznaczyć jako NIE_ZMIERZONO albo zdefiniować prostokąty `CityPanel` jako te pasy.
9. **NIE_ZMIERZONO §15 pkt 9 da się zmierzyć jednym poleceniem:** `map/minimap.ts:9` importuje `worldToAxial` z `../render/hexutil`. Do tego pominięto drugiego konsumenta `computeViewport`: dźwięk pozycyjny (`main.ts:14451-14456`). Kontrakt przenosi liczenie do Rust i wysyła wynik tylko do UI.
10. **Testowalność.** §12 nie przypisuje testów do tematów P4.x/P7 (wymóg dispatchu). Brak testów dla:
    - normalizacji współrzędnych (`scale_factor`, §3.1);
    - wyścigu `seq` z `HitRegions` (Z6);
    - przekazywania `Key`/`PointerMove`/`PointerUp` nad UI (Z3/Z4) i `pass_through` (§4.4);
    - kolejności kroków `HoverChanged` (§5.2);
    - D-UI-9 (plakietka i panel czytają to samo pole);
    - bufora `W/z` przy zoomie (§10) i `FullscreenChanged`.
11. **Brak reguły wyzwalania hovera.** W webie hover-picking liczy się tylko przy `mousemove` canvasu (`main.ts:26230`), a nie przy ruchu kamery (WASD, edge-pan, kółko). Przy D-RR-10 (pętla klatek w Rust) kontrakt nie zabrania przeliczania hovera co klatkę. Grozi to odstępstwem 1:1: kursor, trasa i tooltip zmieniają się bez ruchu myszy.
12. **§10: `FullscreenChanged` „po `WindowEvent::Resized`” bez źródła stanu.** Nie wskazano `Window::is_fullscreen` (`tauri-2.11.5/src/window/mod.rs:1502`) i nie oznaczono heurystyki jako NIE_ZMIERZONO.

Sprawdzone bez zarzutu: baza i allowlista, UI-Q2=A (§7: kotwice w świecie rysuje Rust, przez granicę idzie tylko treść) i UI-Q3=B (§2, §4, M3 jako odstępstwo z D-SEAM-5) są uwzględnione. Zgodność z P4-11 `InputGate` (`camera.rs:95-108`) i z sygnaturami P4-10 `pixel_to_hex`/`pick_map_target` (`pick/mod.rs:165,238`) zachowana, z wyjątkiem zarzutów 6 i 7. Ustalenia F1, F4 (z kodu), F5 i F6 są potwierdzone.
