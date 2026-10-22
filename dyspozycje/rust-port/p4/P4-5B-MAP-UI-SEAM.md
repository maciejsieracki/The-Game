# P4.5B — Kontrakt granicy mapa (Rust) ↔ UI (webview)

**Temat:** `R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 2/5 (obrona po FAIL Evaluatora r1, 12 zarzutów — odpowiedzi w `runs/R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1/03-operator-r2-obrona.md`, surowe logi z EXIT w `runs/…/logi-r2/`)
**Charakter:** temat projektowo-odczytowy. Zero kodu, zero buildu, zero `npm`/`cargo`. Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/**`.
**Piny (tylko odczyt):**
- web: `edb8fb56` — `git show edb8fb56:<ścieżka>` (kopie do scratchpadu, potem `grep`/`sed`) oraz `git grep … edb8fb56`;
- Rust: `origin/rust-port/parity-v2` = `69f432ba` (`git grep`/`git show`);
- źródła Tauri w cache cargo: `tauri-2.11.5`, `tauri-runtime-2.11.3`, `tauri-runtime-wry-2.11.4`, `tao-0.35.3`, `wry-0.55.1` (`~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/`);
- gałąź dokumentacyjna: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` = `85fbdcce`.

**Legenda:** `plik:linia` na wskazanym pinie (bez prefiksu = `gra/src/…` na `edb8fb56`); `NIE_ZMIERZONO` = nie sprawdzone, nie wnioskuję; **ZAŁOŻENIE Zn** = luka rozstrzygnięta przeze mnie domyślną wartością (do rewizji); **D-SEAM-n** = punkt dla właściciela (pytania zadaje orkiestrator, nie ten dokument).

**Decyzje wejściowe (nie rewiduję):**

| Decyzja | Treść | Źródło |
|---|---|---|
| D-RR-2 = A | powierzchnia wgpu pod przezroczystym webview z UI, jedno okno | `LEDGER.md:123` |
| D-RR-3 | picking CPU, dziwactwa weba 1:1 | `LEDGER.md:123`; P4.10 |
| D-RR-4 = A | tekst na mapie rysowany w Rust | `LEDGER.md:123` |
| D-RR-10 | Rust właścicielem pętli klatek, kamery, hover-pickingu | `LEDGER.md:123`; P4-3 §3.9 |
| UI-Q1 = A | kopia paneli weba + Vite, UI w webview | `LEDGER.md:134` |
| UI-Q2 = A | wszystkie etykiety zakotwiczone na mapie rysuje Rust | `LEDGER.md:134` |
| UI-Q3 = B | natywna powierzchnia Rust zbiera zdarzenia myszy mapy; webview przekazuje prostokąty paneli | `LEDGER.md:134` |
| D-UI-5 (orkiestrator, tymczasowe) | Rust skaluje widok synchronicznie z `--civ-ui-zoom`; pełny ekran przez API okna Tauri | dispatch `00-dispatch.md` |
| D-UI-6 (orkiestrator, tymczasowe) | natywna powierzchnia zbiera zdarzenia mapy, webview raportuje prostokąty paneli | dispatch (= UI-Q3=B) |

---

## 0. Streszczenie

1. **Kontrakt logiczny (§3–§11) nie zależy od tego, jak fizycznie zdarzenie trafia do Rust.** Definiuje: komunikaty UI→Rust (prostokąty paneli, stan trybów UI, klawiatura, zoom, polecenia kamery) i Rust→UI (hover, klik/dwuklik/PPM na mapie, stan kamery i minimapy, tooltip weterana), predykaty „panel czy mapa”, zapytania pickingu i podział, kto co liczy.
2. **Nowe ustalenie, ważne dla UI-Q3=B (§1 F1–F2):** publiczne API Tauri 2.11.5 **nie dostarcza zdarzeń myszy ani klawiatury okna** — `tauri_runtime::window::WindowEvent` ma tylko `Resized`, `Moved`, `CloseRequested`, `Destroyed`, `Focused`, `ScaleFactorChanged`, `DragDrop`, `ThemeChanged` (`tauri-runtime-2.11.3/src/window.rs:30-64`, log `logi-r2/06-tauri.txt`); `tauri-runtime-wry` nie przekazuje `CursorMoved`/`MouseInput`/`MouseWheel` z tao (grep → 0). Do tego przy D-RR-2=A webview leży **na wierzchu** i system kieruje do niego całe wejście okna. „Natywna powierzchnia zbiera zdarzenia” wymaga więc kodu platformowego poza publicznym API Tauri. Trzy mechanizmy (M1/M2/M3) w §2; wykonalność każdego: `NIE_ZMIERZONO` → spike RR-T1.
3. **Zoom UI w webie nie zmienia odwzorowania świat→ekran (§1 F4, z kodu, bez uruchomienia).** `transform: scale(z)` na `<body>` ze szerokością `100/z vw` (`ui/hud.ts:485-512`) i canvas `position:fixed; 100%×100%` w `<body>` (`main.ts:1823-1831`) dają canvas wypełniający okno, z tym samym `aspect`; zmienia się tylko rozdzielczość bufora (`render/scene.ts:1615-1636`, `:3101-3109`: `clientWidth` = szerokość układu przed transformacją). Wniosek dla D-UI-5: „Rust skaluje widok” = **skaluje rozdzielczość bufora, nie kadr** (§10).
4. **Web nie kadruje kamery pod panele (§1 F5, zamyka `P4-5 §7` pkt 4):** `git grep -E "setViewOffset|filmOffset|clearViewOffset" edb8fb56 -- gra/src` → 0 trafień; panel miasta centruje kamerę na mieście (`main.ts:5690-5706`).
5. **Web blokuje mapę na dwa sposoby, nie jeden (§1 F3):** (a) stos DOM — słuchacze na `<canvas>` w ogóle nie dostają zdarzeń nad dowolnym elementem HUD; (b) predykaty `isPointOverCityPanelUi`/`blockPointerAt`/`blockWheelAt` dla ramki miasta. Natomiast słuchacze na `window` (ruch kursora dla edge-pan, `mouseup` kończący przeciąganie, klawisze) działają **nad wszystkim**. Kontrakt odwzorowuje oba poziomy (§4).
6. **Dane dzielone renderer↔UI (§8, poprawione w r2):** `CityRenderOptions` w `main.ts:2592-2648` ma 22 pola: 13 to wartości widoczne też w UI (m.in. `getCityGrowth` = WZROST%, `getProduction`, `getBuiltBuildingIds`, kolor i ikona cywilizacji) → jedno pole modelu widoku z Rust (D-UI-9); 3 to stan UI wejściowy dla renderera; 1 (`isVisible`) jest mieszane — mgła z modelu widoku + filtr panelu miasta z `UiState`; 5 to dane wyłącznie renderera.
7. Założenia: 15 (`Z1–Z15`, §13). Punkty dla właściciela: 5 (`D-SEAM-1..5`, §14). `NIE_ZMIERZONO`: 14 aktywnych + 1 zamknięty w r2 (§15). Pokrycie R1–R16 z P4-5 §2.3: §1a.

---

## 1. Ustalenia z tej rundy (zmierzone w kodzie)

| # | Ustalenie | Dowód | Skutek |
|---|---|---|---|
| F1 | Tauri 2.11.5 nie wystawia zdarzeń myszy/klawiatury okna | `tauri-runtime-2.11.3/src/window.rs:30-64` (`pub enum WindowEvent` — 8 wariantów: `Resized`, `Moved`, `CloseRequested`, `Destroyed`, `Focused`, `ScaleFactorChanged`, `DragDrop`, `ThemeChanged`); `grep -rn "CursorMoved\|MouseInput\|MouseWheel" tauri-runtime-wry-2.11.4/src/lib.rs` → 0; `grep -rln CursorMoved tauri-2.11.5/src` → 0 | UI-Q3=B nie da się zrealizować samym publicznym API; dostępne są tylko: `cursor_position()` (odpytywanie, `tauri-2.11.5/src/window/mod.rs:1748`), `set_cursor_icon` (`:2207`), `set_ignore_cursor_events` (całe okno, `:2225`), `set_fullscreen` (`:2119`), `set_focus` (`:1875`; webview `src/webview/mod.rs:1536`), `scale_factor` (`:1473`), `inner_size` (`:1490`) |
| F2 | Przy D-RR-2=A wejście trafia do webview | P4-3 §2.3 wiersz „Fokus / wejście” (`P4-3-RUST-RENDERER-ARCH.md`): webview na wierzchu przechwytuje kliknięcia; `set_ignore_cursor_events` działa tylko na całe okno; w `wry-0.55.1`/`tao-0.35.3` brak API regionu wejścia per obszar (`grep -rn "SetWindowRgn\|input_shape\|shape_combine"` → tylko `tao…/linux/event_loop.rs:458,460`, implementacja `set_ignore_cursor_events` dla całego okna) | Konflikt D-RR-2=A ↔ UI-Q3=B jest realny; mechanizmy M1–M3 (§2) |
| F3 | Dwupoziomowa blokada mapy w webie | (a) słuchacze na canvasie: `main.ts:26204` `mousedown`, `:26209` `contextmenu`, `:26230` `mousemove`, `:26328` `mouseleave`, `:13084-13089` `mouseenter`/`mouseleave` (chip budowy: `chipOverCanvas`, ukrycie chipa), `:26337` `mouseup`, `:26714` `dblclick`; kamera `render/camera.ts:226` `mousedown`, `:229` `wheel` na canvasie; (b) słuchacze na `window`/`document`: `camera.ts:227-228` `mousemove`/`mouseup`, `:230-233` `keydown`/`keyup`/`blur`, `:233` `mouseleave` (document); `main.ts:26121`, `:36106` `keydown`; (c) predykaty: `ui/cityUxFrame.ts:185-217` `isPointOverCityPanelUi`, `main.ts:1911-1924` `blockPointerAt`/`blockWheelAt`, `:1929` `edgePanActive` | Nad HUD (pasek, minimapa, panel boczny) canvas nie dostaje kliknięć/hover/kółka (stos DOM), ale edge-pan dalej czyta pozycję kursora (`camera.ts:175-179` zapis zawsze, `:251-273` sprawdza tylko `blockPointerAt` i prostokąt canvasu) |
| F4 | Zoom UI nie zmienia kadru mapy | `ui/hud.ts:458-461` (85–150%, krok 5%), `:485-512` `applyUiZoom` (`body.style.width = 100/z vw`, `transform: scale(z)`, `transformOrigin: top left`, potem `resize`); `main.ts:1823-1831` canvas `position:fixed; top/left 0; 100%×100%` dołączony do `<body>`; `render/scene.ts:1615-1616` `canvasCssW = canvas.clientWidth`; `:3101-3109` `onResize`: `camera.aspect = w/h`, `renderer.setSize(w, h, false)`; `input/picker.ts:186-187` picking przez `getBoundingClientRect` (prostokąt po transformacji) | Kadr i picking w pikselach okna niezmienne; zmienia się rozdzielczość bufora (`innerWidth/z × pixelRatio`). Zachowanie w uruchomionej przeglądarce: `NIE_ZMIERZONO` (wniosek z semantyki CSS: element `fixed` w przodku z `transform` jest liczony względem tego przodka) |
| F4a | Dziwactwo predykatu panelu miasta przy zoomie ≠ 100% | `ui/cityUxFrame.ts:155-177` `getCityUxLayoutMetrics` (stałe px i `window.innerWidth` bez `z`) używane w `:207-215` razem z `clientX` (piksele okna, po transformacji); części oparte na DOM (`:190-206`, `getBoundingClientRect`) są skalowane | Przy z≠1 strefy „lewy/prawy panel” predykatu nie pokrywają się z narysowanym panelem — `NIE_ZMIERZONO` w runtime; → Z5, D-SEAM-1 |
| F5 | Brak kadrowania pod panele | `git grep -n -E "setViewOffset\|filmOffset\|clearViewOffset" edb8fb56 -- gra/src` → 0; `main.ts:5690-5706` `applyCityPanelWorldView`: zapis `getFocusState()`, `focusAt(x_miasta, z_miasta, max(14, min(42, 10 + rad·3,8)))`, przy zamknięciu przywrócenie | Rust odtwarza 1:1: bez przesunięcia kadru, miasto w środku okna mimo asymetrii paneli (340/300 px, `ui/hudLayout.ts:20-21`) |
| F6 | `battle/manualBattle.ts` nie ma importerów | P4-4 (LEDGER `:127` — „martwy kod: … `battle/manualBattle.ts` (0 importerów)”) | Grupa R15b z P4-5 §3.2 nie wiąże kontraktu |
| F7 | Kursory mapy to SVG z punktem aktywnym i fallbackiem CSS | `ui/mapUnitCursor.ts:15` miecz `12 4, crosshair`; `:26` spinacz `6 20, pointer`; `:37` miasto `12 20, pointer`; `:51` ruch `8 12, crosshair`; `:52` `default`; tao ma tylko `pub enum CursorIcon` (`tao-0.35.3/src/window.rs:1445`), brak `CustomCursor` (grep → 0) | Kursor własny nad natywną powierzchnią wymaga kodu platformowego → Z9, D-SEAM-3 |

### 1a. Macierz pokrycia R1–R16 (`P4-5-UI-SHELL-AUDIT.md` §2.3) — dodane w r2

| R | Element | Status w tym kontrakcie | Gdzie / uzasadnienie wyłączenia |
|---|---|---|---|
| R1 | Miniatura 3D jednostki (obraz z renderera do UI) | **WYŁĄCZONE** | To nie jest wejście mapy ani kotwica w świecie, tylko transport obrazu Rust → UI (D-UI-3). Kandydat `P4-5C` (miniatury) z LEDGER `:120`. Granica tylko rezerwuje kierunek Rust → UI dla obrazów; format i wyzwalanie należą do P4-5C |
| R2 | Sonda WebGL „Test wydajności” | **WYŁĄCZONE** | Mierzy WebGL webview, nie mapę; bez wejścia i bez projekcji. Decyzja D-UI-7 (P4-5 §5) |
| R3 | Kursor kontekstowy mapy | objęte | §6, F7, Z9, D-SEAM-3 |
| R4 | Chip budowy | objęte | §7 (`GhostChip`), §3.4 (`CanvasLeave` chowa chip, `main.ts:13085-13089`) |
| R5 | Etykiety oblężenia | objęte | §7 |
| R6 | Etykiety galerii (dev) | objęte (status D-UI-7) | §7 |
| R7 | Minimapa: prostokąt widoku + klik | objęte | §9 (`CameraState`, `CameraFocusHex`) |
| R8 | Zoom UI 85–150% | objęte | §10, F4, D-SEAM-2 |
| R9 | Pełny ekran | objęte | §10 (`Window::is_fullscreen`), D-SEAM-4 |
| R10 | Panel miasta, „mapa centralna” | objęte częściowo | wejście: §4.2 `over_city_panel` (w tym prostokąt `#cs-okolica-center`, `cityUxFrame.ts:202-206`, i pasy panelu); kamera: §9 (`applyCityPanelWorldView`, F5); **rysowanie** nakładki okolicy (`render/cityOkolicaOverlay.ts`) — poza granicą, RR-T9 |
| R11 | Importy `render/**` w UI | **WYŁĄCZONE** | To zależność czasu kompilacji, nie komunikat w czasie działania: typy (`ImprovementKey`, `SceneBuildTimings`), paleta (`unitVitalsPalette`) i czysta matematyka (`cityPanel.ts:209` `axialToWorld`). Należy do szkieletu UI P5-1 (wspólny moduł TS albo DTO) |
| R12 | Tooltip gwiazdek weterana | objęte | §5.2 pkt 2, Z10 |
| R13 | Hover pigułki miasta | objęte | §5.2 pkt 3 |
| R14 | WZROST% (renderer czyta wartość z UI) | objęte | §8 (D-UI-9), Z12 |
| R15 | Liczby obrażeń w bitwie (R15a/R15b) | objęte (R15b martwy, F6) | §7, Z11, RR-T10 |
| R16 | Box-select w bitwie | objęte | §5.1 `pick_units_in_rect`, RR-T10 |

---

## 2. Warstwy okna i fizyczna droga zdarzenia (UI-Q3=B przy D-RR-2=A)

Model warstw (D-RR-2=A): jedno okno Tauri; na spodzie powierzchnia wgpu (uchwyt okna, P4-3 §2.2); na wierzchu przezroczysty webview z całym UI.

| Mech. | Opis | Zgodność z UI-Q3=B | Wymaga | Ryzyko |
|---|---|---|---|---|
| **M1** — region wejścia webview = prostokąty UI | Webview przyjmuje wejście tylko w prostokątach z `HitRegions` (§4). Poza nimi system kieruje zdarzenie do okna-rodzica, gdzie przechwytuje je hak platformowy w `src-tauri` i podaje do Rust | **Pełna** — to dokładnie „panele/hit-test prostokątów do Rust” | kod platformowy (Windows: region/hit-test hosta WebView2; Linux: kształt wejścia GTK; macOS: `hitTest:` widoku) — poza publicznym API Tauri (F1, F2) | Na Windows region okna przycina także **rysowanie** → elementy nieinteraktywne nad mapą (tooltip weterana, podpowiedzi) muszą być w regionie, więc zabiorą zdarzenia (→ M1 + przekazywanie, §4.4). Wykonalność: `NIE_ZMIERZONO` |
| **M2** — odwrócone warstwy | Natywne okno-dziecko mapy **nad** webview, z regionem = obszar okna minus prostokąty UI (fallback z P4-3 §2.3) | Pełna | `add_child`/`Window::builder` za cechą `unstable` (P4-3 §2.2); region okna-dziecka — kod platformowy | Elementy UI nachodzące na mapę (tooltipy, menu rozwijane) muszą być wycięte z regionu, inaczej znikną pod mapą. `NIE_ZMIERZONO` |
| **M3** — webview zbiera wszystko i przekazuje (W1 z P4-5) | Przezroczysta warstwa trafień w DOM, JS wysyła zdarzenia do Rust | **Niezgodna z literą UI-Q3=B** | tylko publiczne API (`invoke`/zdarzenia) | opóźnienie IPC dla `mousemove` (`NIE_ZMIERZONO`, P4-3 §3.9 pkt 3) |

**ZAŁOŻENIE Z1:** kontrakt logiczny (§3–§11) jest **wspólny dla M1, M2 i M3**: te same komunikaty i predykaty; mechanizm zmienia tylko to, *kto fizycznie* odbiera zdarzenie. Kolejność prób w RR-T1: M1 → M2 → M3. Przejście na M3 to odstępstwo od UI-Q3=B → wymaga zgody właściciela (D-SEAM-5), nie wolno go zrobić po cichu.

**ZAŁOŻENIE Z2:** hak platformowy żyje w `src-tauri` (tam dopuszczalny jest `unsafe`), a crate `rust-port/renderer` pozostaje `#![forbid(unsafe_code)]` (P4-6, LEDGER `:129`) i dostaje już znormalizowane zdarzenia (§3.1).

---

## 3. Zdarzenia wejścia

### 3.1 Postać zdarzenia (do `rust-port/renderer`)

Współrzędne: **piksele CSS okna** (logiczne), tak jak `clientX/clientY` w webie. Natywne zdarzenia (piksele fizyczne) dzielone przez `scale_factor` okna (`tauri-2.11.5/src/window/mod.rs:1473`). Prostokąt „canvasu” = całe wnętrze okna (web: `main.ts:1826-1830`), przekazywany do istniejącego `CameraController::set_canvas_rect` (`rust-port/renderer/src/camera.rs:209` @ `69f432ba`).

```text
MapInput = { scene: Map | Battle,              // Z11
             over_ui: bool,                    // true = zdarzenie przekazane z webview znad prostokąta UI (Z4);
                                               //   false = natywna powierzchnia albo pass_through (§4.4)
             ev: MapInputEvent }
MapInputEvent =
  PointerMove { x, y }                         // koalescowane do 1 na klatkę (P4-3 §3.9 pkt 2)
  PointerDown { x, y, button: 0|1|2, mods }
  PointerUp   { x, y, button, mods }
  DoubleClick { x, y, button }
  ContextMenu { x, y }
  Wheel       { x, y, delta_y }
  WindowLeave                                  // web: document 'mouseleave' camera.ts:213,233 → CameraController::mouse_leave
                                               //   (camera.rs:340-342 @ 69f432ba); TYLKO wyjście kursora z obszaru okna
  Blur                                         // web: window 'blur' camera.ts:212,232
  Key { key: String (lowercase jak e.key.toLowerCase()), down: bool }
mods = { shift, ctrl, alt, meta }
```

`CanvasLeave` (web: canvas `mouseleave` `main.ts:26328-26335` i `:13085-13089`) **nie jest** zdarzeniem wejściowym: Rust wyprowadza je sam z przejścia `over_ui: false → true` albo z `WindowLeave` (§3.4, Z13). Do kamery nie trafia.

Normalizacja: natywne współrzędne fizyczne / `scale_factor` (`tauri-2.11.5/src/window/mod.rs:1473`); zdarzenia z webview już są w pikselach CSS (`clientX/Y`).

### 3.2 Tabela: kto zbiera, kto konsumuje

| Zdarzenie | Web (źródło) | Kto zbiera (UI-Q3=B) | Konsument w Rust | Reguła 1:1 |
|---|---|---|---|---|
| L-down na mapie | canvas `mousedown` `main.ts:26204` (zapamiętanie punktu), kamera `camera.ts:164-173` | natywna powierzchnia | kamera (drag), detektor klik/drag | kamera pomija, gdy `block_pointer_at` (`camera.ts:166`) |
| ruch kursora | canvas `mousemove` `main.ts:26230` (hover); `window` `mousemove` `camera.ts:175-203` (drag + edge-pan) | natywna nad mapą; **webview nad UI przekazuje pozycję** (Z4) | kamera zawsze; hover tylko poza UI | F3: edge-pan działa też pod HUD |
| L-up | canvas `mouseup` `main.ts:26337`; `window` `mouseup` `camera.ts:208` | natywna; webview przekazuje `PointerUp` nad UI (Z4) | koniec drag zawsze; klik tylko poza UI i gdy `dist < 6` lub tryb stawiania (`main.ts:26345-26349`) | wspólny próg `DRAG_THRESHOLD_PX = 6` (`camera.ts:25`, `main.ts:26202`) |
| PPM — puszczenie | canvas `mouseup` z `button === 2` `main.ts:26338-26343` | natywna | `MapRightUp` → UI (§5.3) | **bez** filtrów `galleryOn`/`isAnimating`/`isPostBattleSummaryOpen`/`isPointOverCityPanelUi` i bez progu drag (web wychodzi z handlera przed `:26346`); jedyny filtr = `¬over_ui` (canvas dostał zdarzenie). Skutek w webie: `exitBuildMode()` albo `dismissPlayerUnitSelectionIfAny()` |
| PPM — menu kontekstowe | canvas `contextmenu` `main.ts:26209-26221` | natywna (Rust generuje je sam przy PPM) | `MapContextMenu` → UI (§5.3) | pomiń w galerii/animacji/po-bitwie (`:26211`), nad panelem miasta (`:26212`); skutek: `exitBuildMode()` albo `dismissPlayerUnitSelectionIfAny()` + `hideHexContextPanel()`. Kolejność względem `MapRightUp`: Z15 |
| dwuklik | canvas `dblclick` `main.ts:26714-26725` | natywna | `MapDoubleClick{hex}` → UI (panel kontekstowy heksu) | warunki `:26716-26718`; `pickHexAt` (nie `pickMapTarget`) `:26720` |
| kółko | canvas `wheel` `camera.ts:215-220`, `:229` (`passive:false`) | natywna | kamera | pomiń, gdy `block_wheel_at` |
| klawisze | `window` `keydown/keyup` `camera.ts:222-223`, `:230-231`; `main.ts:26121` (F9/F10…), `:36106` (Escape i skróty) | **webview** (fokus, Z3) | kamera: stan klawiszy (`camera.rs`); skróty globalne: kontroler UI | web dodaje klawisz do zbioru bez filtra pola tekstowego (`camera.ts:222`) — zachowane 1:1 (Z3) |
| utrata fokusu okna | `window` `blur` `camera.ts:232` | Tauri `WindowEvent::Focused(false)` (`tauri-runtime…/window.rs:45`) + webview | kamera: zeruje pozycję kursora (`camera.ts:212-213`) | — |

**ZAŁOŻENIE Z3 (klawiatura):** fokus klawiatury pozostaje w webview (pola tekstowe, skróty, `Escape`-łańcuch w `main.ts:36106+` należą do UI). Webview przekazuje do Rust `Key{key, down}` **dla każdego** `keydown/keyup` na `window` (jak kamera weba, która nie filtruje), Rust używa tylko klawiszy kamery (`w a s d arrowup arrowdown arrowleft arrowright`, `camera.ts:277-280`). Po kliknięciu w mapę Rust oddaje fokus webview (`Webview::set_focus`, `tauri-2.11.5/src/webview/mod.rs:1536`) — czy klik w okno-rodzica odbiera fokus WebView2/WebKitGTK: `NIE_ZMIERZONO`.

**ZAŁOŻENIE Z4 (pozycja kursora nad UI):** w M1/M2 zdarzenia nad prostokątami UI trafiają do webview; webview przekazuje do Rust `PointerMove` (koalescowane) i każde `PointerUp`, oznaczone `over_ui = true`. Rust: kamera je konsumuje (drag trwa, edge-pan działa jak w webie, F3), hover/klik — nie.

**ZAŁOŻENIE Z15 (kolejność `MapRightUp` ↔ `MapContextMenu`):** w webie oba handlery reagują na jeden PPM, a kolejność zdarzeń `mouseup`/`contextmenu` zależy od platformy przeglądarki (Windows: `contextmenu` po `mouseup`; Linux/macOS: po `mousedown`) — `NIE_ZMIERZONO` w WebView2/WebKitGTK (§15 pkt 13). Kolejność zmienia wynik w trybie budowy: `mouseup` najpierw → `exitBuildMode`, potem `contextmenu` widzi `buildModeOpen = false` → odznacza i chowa panel heksu; odwrotnie → `contextmenu` wychodzi z trybu budowy i kończy, `mouseup` tylko odznacza. Domyślnie Rust emituje **`MapRightUp`, potem `MapContextMenu`** (kolejność Windows/Chromium = WebView2); na Linuksie kolejność WebKitGTK do potwierdzenia w RR-T1 i ewentualnie per platforma; test w RR-T12 (§12).

### 3.3 Bitwa

Bitwa ma osobny canvas i własne słuchacze: `battle/battleScene.ts:3418` `pointerdown` (canvas), `:3419-3420` `pointermove`/`pointerup` (window), `:3422` `contextmenu`, `:3423-3424` hover, `:3392` `wheel`, `:3393-3415` klawisze; box-select przez `worldToClientPx` (`:16505`). **ZAŁOŻENIE Z11:** ten sam `MapInput` z polem `scene: Map | Battle`; szczegóły reguł bitwy (pan prawym/środkowym, box-select lewym w trybie ręcznym — komentarz `:3416-3417`) → RR-T10. Kontrakt pickingu prostokątnego w §5.

### 3.4 Opuszczenie mapy i wyzwalanie hovera (dodane w r2)

Web ma **dwa różne** zdarzenia „leave” (log `logi-r2/04-hover-wejscie.txt`):

| Zdarzenie weba | Kiedy w webie | Skutek w webie | Odpowiednik w Rust |
|---|---|---|---|
| canvas `mouseleave` `main.ts:26328-26335`, `:13085-13089` | kursor schodzi z canvasu: na element HUD nad nim **albo** poza okno | kursor domyślny, `hideVeteranBadgeTip`, wyzerowanie hovera pigułki + `syncStatChips`, `chipOverCanvas = false`, ukrycie chipa budowy. **Nie** zeruje `hoverKey`, trasy podglądu ani `lastBHex`; **nie** dotyka kamery | `CanvasLeave` — wewnętrzne, emitowane przez Rust (Z13) |
| document `mouseleave` `camera.ts:213,233` | kursor opuszcza dokument (okno) | `mouseClientX/Y = null` → edge-pan stop | `MapInputEvent::WindowLeave` → `CameraController::mouse_leave` (`camera.rs:340-342`) |

**ZAŁOŻENIE Z13 (reguła leave):** Rust emituje `CanvasLeave` przy (a) pierwszym zdarzeniu z `over_ui = true` po zdarzeniu z `over_ui = false` oraz (b) `WindowLeave`. Przejście mapa → UI **nie** wywołuje `mouse_leave` kamery: pozycja kursora dalej płynie z `PointerMove{over_ui:true}` (Z4), więc edge-pan pod HUD działa jak w webie (F3, P4-11). `WindowLeave` pochodzi z natywnego „leave” okna (M1/M2) albo z `document mouseleave` przekazanego przez webview, gdy kursor wychodzi z okna przez prostokąt UI. Fizyczne źródło natywnego „leave” na każdej platformie: `NIE_ZMIERZONO` → RR-T1. Powrót na mapę (`over_ui: true → false`) = odpowiednik `mouseenter` (`:13084`, `chipOverCanvas = true`).

**ZAŁOŻENIE Z14 (wyzwalanie hovera):** w webie hover-picking (odznaka weterana, pigułka, `pickMapTarget`, kursor, trasa, `lastBHex`) liczy się **wyłącznie** w handlerze canvas `mousemove` `main.ts:26230-26326`; `pickMapTarget(`/`pickStatChipCityIdAt(`/`pickVeteranBadgeUnitIdAt(` nie występują w pętli renderu (jedyne wywołania: `:26235`, `:26253`, `:26271`, `:26369` — klik). Rust liczy hover **tylko** po `PointerMove` z `over_ui = false` (raz na klatkę po koalescencji, dla ostatniej pozycji). **Zakaz** przeliczania hovera przy ruchu kamery (WASD, edge-pan, kółko, `focusAt`) i co klatkę — po takim ruchu kursor, trasa i tooltip zostają nieaktualne aż do następnego ruchu myszy, jak w webie. Nad UI (`over_ui = true`) hover zostaje zamrożony (web: canvas nie dostaje `mousemove`), z wyjątkiem skutków `CanvasLeave`. Koalescencja nie zmienia stanu końcowego: wszystkie efekty hovera zależą tylko od ostatniej pozycji (strażnik `hoverKey` `:26302-26303` pomija jedynie ponowne liczenie dla tego samego heksu).

---

## 4. Reguły „panel czy mapa”

### 4.1 Komunikat `HitRegions` (UI → Rust)

```text
HitRegions {
  seq: u64,                       // rośnie monotonicznie; Rust używa najnowszego
  viewport: { w, h },             // innerWidth/innerHeight (piksele CSS okna)
  ui_zoom: f64,                   // 0.85..1.5 (informacyjnie; prostokąty są już po transformacji)
  rects: [ { id: String, kind: Hud | CityPanel | Modal | Tooltip,
             x, y, w, h,          // getBoundingClientRect() — piksele okna
             pass_through: bool } ],  // true dla elementów pointer-events:none (Tooltip)
  full_block: bool,               // pełnoekranowa nakładka/dialog modalny: cała mapa zablokowana
  city_panel: Option<CityPanelGeometry>   // None = ramka miasta zamknięta (cityUxFrame.ts:186); r2, Z5
}
CityPanelGeometry {               // liczby liczone przez skopiowany kod UI (UI-Q1=A) DOKŁADNIE jak w cityUxFrame.ts:187-215
  top_bottom: f64,                // .civ-ux-top getBoundingClientRect().bottom, gdy element istnieje; inaczej TOP_H (:190-196)
  bottom_stack: Option<Rect>,     // .civ-v-map-bottom-stack (:197-201), porównania <=/>= włącznie
  okolica_center: Option<Rect>,   // #cs-okolica-center (:202-206), włącznie
  left_margin: f64, left_panel_end: f64,           // pas x ∈ [left_margin, left_panel_end), KAŻDE y (:207, :210)
  left_rail_left: f64, left_rail_right: f64,       // x ∈ [l, r] (włącznie) ∧ y >= rail_top (:208-211)
  rail_top: f64,
  right_rail_left: f64, right_dock_end: f64,       // x ∈ [right_rail_left, right_dock_end) ∧ y >= rail_top (:213-214)
  right_panel_left: f64                            // półpłaszczyzna x >= right_panel_left, KAŻDE y (:212, :215)
}
```

Wysyłka: przy zmianie (ResizeObserver/MutationObserver na kontenerach zarejestrowanych atrybutem, np. `data-map-blocker`, zmiana zoomu, `resize`), nie co klatkę. **ZAŁOŻENIE Z6:** rejestr kontenerów jest jawny (atrybut), nie „wszystkie elementy DOM” — lista kontenerów do ustalenia przy P5-1 (szkielet UI); w webie odpowiada im zbiór elementów HUD nad canvasem (P4-5 §2.2 kategorie B–K).

### 4.2 Predykaty w Rust (odpowiedniki 1:1)

| Rust | Web | Definicja |
|---|---|---|
| `over_ui(x,y)` | stos DOM nad canvasem (F3a) | `full_block` ∨ ∃ rect: `!pass_through` ∧ zawiera (x,y) |
| `over_city_panel(x,y)` | `isPointOverCityPanelUi` `ui/cityUxFrame.ts:185-217` | `city_panel = None` → `false` (`:186`); inaczej formuła weba 1:1 na `CityPanelGeometry`, w tej samej kolejności i z tymi samymi operatorami: `y < top_bottom` (pas na całą szerokość) ∨ `bottom_stack ∋ (x,y)` ∨ `okolica_center ∋ (x,y)` ∨ `left_margin <= x < left_panel_end` (pas na całą wysokość) ∨ (`left_rail_left <= x <= left_rail_right` ∧ `y >= rail_top`) ∨ (`right_rail_left <= x < right_dock_end` ∧ `y >= rail_top`) ∨ `x >= right_panel_left` (półpłaszczyzna). **Nie** są to prostokąty DOM (Z5) |
| `block_pointer_at(x,y)` | `main.ts:1911-1915` | `over_city_panel(x,y)` ∨ `found_city_mode` ∨ (`build_mode_open` ∧ (`active_improvement` ∨ `active_wonder`)) |
| `block_wheel_at(x,y)` | `main.ts:1924` | `over_city_panel(x,y)` |
| `edge_pan_active()` | `main.ts:1929` → `isWorldMapUnitMode` `:5833-5850` | `UiState.world_map_unit_mode` (§4.3) |

Implementacja trafia w istniejący `trait InputGate` (`rust-port/renderer/src/camera.rs:95-108` @ `69f432ba`: `block_pointer_at`, `block_wheel_at` z domyślną = `block_pointer_at`, `edge_pan_active`) — P4.11 już zweryfikował bitowo zachowanie kamery z tymi predykatami.

**Kolejność filtrów dla zdarzeń mapy (1:1 z webem):** najpierw `over_ui` (odpowiednik „canvas nie dostał zdarzenia”), potem reguły handlera (`galleryOn`, `isAnimating`, `isPostBattleSummaryOpen`, `over_city_panel`) w kolejności z `main.ts:26211-26212`, `:26345-26360`, `:26716-26718`.

**ZAŁOŻENIE Z5 (r2, zastępuje wersję r1):** `over_city_panel` **nie** jest liczony z prostokątów DOM kontenerów. Predykat weba to w części pasy i półpłaszczyzny bez ograniczenia drugiej osi (`:193` całą szerokość, `:210` i `:215` całą wysokość), więc zamiana na `getBoundingClientRect` zmieniłaby wynik także przy z = 1 wszędzie tam, gdzie panel nie wypełnia pasa (wersja r1 twierdziła inaczej bez dowodu — wycofane). Domyślnie: UI liczy pola `CityPanelGeometry` **tym samym kodem** co web (`getCityUxLayoutMetrics`, `getActiveDetailDockWidths`, `window.innerWidth`, stałe bez `z`), a Rust stosuje formułę 1:1. Dziwactwo F4a przy z ≠ 1 jest więc **odtwarzane** 1:1. Wysyłka `city_panel` przy otwarciu/zamknięciu ramki, `resize`, zmianie zoomu i zmianie szerokości docku szczegółów. Poprawienie F4a = osobna decyzja D-SEAM-1.

### 4.3 Komunikat `UiState` (UI → Rust)

Stan trybów, który dziś żyje w `main.ts` i warunkuje wejście mapy:

```text
UiState {
  world_map_unit_mode: bool,    // isWorldMapUnitMode() main.ts:5833-5850 (panel miasta, pre-bitwa, bitwa,
                                //   podsumowanie, merge/split, oblężenie, wybór jednostki miasta → false)
  city_panel_open: bool,        // też: hideStatChips (main.ts:2621), isVisible-tylko-to-miasto (:2617-2620)
  city_panel_city_id: Option<CityId>,
  found_city_mode: bool,
  build_mode_open: bool, active_improvement: Option<String>, active_wonder: Option<String>,
  pre_battle_open: bool, post_battle_open: bool, gallery_on: bool,
}
```

**ZAŁOŻENIE Z7:** UI wysyła **wynik** `world_map_unit_mode` (jedno pole), nie 11 flag paneli — warunki to stan paneli DOM, a ich lista w webie może rosnąć. `isAnimating` jest stanem Rust (animacje w Rust, D-RR-10), więc nie przychodzi z UI.

### 4.4 Elementy przepuszczające (`pass_through`)

Tooltip weterana (`main.ts:1853-1873`, `pointer-events:none`, `position:fixed`, `left/top = clientX/Y + 14`), etykiety HTML oblężenia w webie (`main.ts:14570`, `pointer-events:none`) — w webie nie blokują canvasu. W M1 region webview musi je zawierać, żeby były widoczne (F2), więc fizycznie zabiorą zdarzenia. Reguła: webview przekazuje do Rust **każde** zdarzenie wskaźnika, które trafi w prostokąt `pass_through`, jako zwykłe `MapInput` z `over_ui = false`. Tooltip weterana jest przesunięty o 14 px od kursora, więc ten przypadek jest rzadki; obsługa i tak obowiązkowa.

---

## 5. Kontrakt pickingu

### 5.1 Zapytania (wszystkie liczone w Rust, CPU, D-RR-3)

| Zapytanie | Web | Rust (stan) | Wynik |
|---|---|---|---|
| `pick_hex(x,y)` | `main.ts:1885-1891` `pickHexAt` → `input/picker.ts:175-250` `pixelToHex` | `pick::pixel_to_hex` (`rust-port/renderer/src/pick/mod.rs:165`) — zrobione, P4.10 | `Option<Hex>` |
| `pick_map_target(x,y)` | `main.ts:1894-1901` (jednostki pierwsze) | `pick::pick_map_target` (`pick/mod.rs:238`), `MapPick::{Unit{index,hex}, Terrain}` (`:212-222`) — zrobione | `Option<MapPick>` |
| `pick_veteran_badge(x,y)` | `render/units.ts:5900` `pickVeteranBadgeUnitIdAt`, użycie `main.ts:26235` | brak — RR-T13 | `Option<UnitId>` |
| `pick_stat_chip(x,y)` | `render/cities.ts:609` `pickStatChipCityIdAt`, użycie `main.ts:26253` | brak — RR-T13 | `Option<CityId>` |
| `pick_units_in_rect(rect)` | `battle/battleScene.ts:16505` (projekcja jednostek `worldToClientPx`, `input/picker.ts:101-117`) | brak — RR-T10 | `Vec<UnitId>` |
| `world_to_client(p)` (wewnętrzne) | `input/picker.ts:101-117` | potrzebne tylko wewnątrz Rust (UI-Q2=A: etykiety rysuje Rust) | — |

Żadne z tych zapytań nie jest wołane przez UI synchronicznie. UI dostaje **wyniki** jako zdarzenia (§5.2–5.4). **ZAŁOŻENIE Z8:** brak synchronicznego `invoke("pick", x, y)` z UI; jeśli UI kiedyś potrzebuje trafienia dla własnego punktu (np. przeciągnięcie z panelu na mapę), to osobny temat.

### 5.2 Hover — `HoverChanged` (Rust → UI), tylko przy zmianie

Kolejność 1:1 z `main.ts:26230-26323`:

1. `gallery_on` → nic (`:26231`).
2. Odznaka weterana, gdy `world_map_unit_mode ∧ ¬pre_battle_open` (`:26234-26249`) → `VeteranTip { show: bool, x: px+14, y: py+14, text }`; `text` = `veteranStarsTooltipText(u)` (`game/veteran.ts:189-191`) — **logika gry, więc tekst liczy Rust** (P5.13) i podaje w zdarzeniu.
3. Pigułka miasta, gdy `world_map_unit_mode` (`:26252-26261`) → Rust sam przełącza stan hover i przebudowuje pigułki (renderer); UI dostaje tylko `stat_chip_hover: Option<CityId>` (informacyjnie).
4. Tryb budowy z celem (`:26264-26269`) → ghost (Rust, §7) i kursor domyślny.
5. `pick_map_target` (`:26271`) → kursor (§6) i podgląd trasy (`refreshHoverPathPreview`, `:26322`) — rysuje Rust.
6. `last_b_hex` (cel skrótu B, `main.ts:11091`, `:26318`) — stan w Rust, wysyłany w `HoverChanged` (skrót B obsługuje UI, `:36183`).

`CanvasLeave` (§3.4, Z13) → schowaj tooltip, wyzeruj hover pigułki, kursor domyślny (`main.ts:26328-26335`), ukryj chip budowy (`:13085-13089`); `hoverKey`, trasa i `last_b_hex` bez zmian. Wyzwalanie hovera: wyłącznie Z14.

**ZAŁOŻENIE Z10:** tooltip weterana pozostaje elementem DOM w webview (kotwiczony do kursora, nie do świata — UI-Q2=A dotyczy etykiet zakotwiczonych na mapie, P4-5 R12). Rust podaje pozycję i tekst; webview tylko pokazuje.

### 5.3 Klik — `MapClick` (Rust → UI)

```text
MapClick { x, y, button, mods, hit: Option<MapHit>, placement_click: bool }
MapHit =                                 // typ GRANICY (r2), nie wewnętrzny MapPick z P4-10
  Unit    { unit_id: UnitId, hex: Hex }  // z MapPick::Unit{index,hex}: unit_id = units[index].id
                                         //   (UnitPickModel.id, pick/mod.rs:183; index jest indeksem wycinka, :216 — nie wychodzi poza Rust)
  Terrain { hex: Hex }                   // z MapPick::Terrain(HexPick).hex
MapDoubleClick { hex: Option<Hex> }      // pickHexAt, nie pickMapTarget (main.ts:26720)
MapRightUp { x, y }                      // mouseup button 2 (main.ts:26338-26343), bez filtrów poza ¬over_ui
MapContextMenu { x, y }                  // contextmenu (main.ts:26209-26221), z filtrami :26211-26212; kolejność Z15
```

Uwaga 1:1: web `pickMapTarget` zwraca do handlera klika tylko `{q, r}` (`main.ts:1894-1901`), więc `unit_id` w `MapHit` jest informacją dodatkową; kontroler P5 nie może na jej podstawie zmieniać rozstrzygnięcia klika względem weba (rozstrzyga heks).

Rust wysyła `MapClick` dopiero po przejściu filtrów z §4.2 i progu klik/drag. Rozstrzygnięcie, co klik znaczy (zaznaczenie, ruch, atak, wejście do miasta, panel — `main.ts:26362-26712`), należy do warstwy kontrolera i silnika (P5), nie do granicy. Granica gwarantuje tylko: to samo trafienie i te same warunki odrzucenia co web.

---

## 6. Kursor kontekstowy

- Rodzaje i punkty aktywne (F7): `Sword (12,4)`, `Merge (6,20)`, `EnterCity (12,20)`, `Move (8,12)`, `Default`.
- Wybór: `resolveMapUnitCursor` (`ui/mapUnitCursor.ts:72-116`, kolejność: miecz > własne miasto > spinacz > ruch > domyślny) korzysta z `reachable`, widoczności, jednostek i miast — to stan gry, więc **liczy Rust** (moduł UI nie może tego liczyć bez lokalnych reguł, P5.13). Warunki „kursor domyślny” 1:1 z `main.ts:26266`, `:26274-26300`.
- Ustawianie tylko przy zmianie (web: `main.ts:12041-12043`) i tylko przy zmianie heksu (`:26303-26304` — `hoverKey`).
- Nad mapą (M1/M2) kursor należy do okna natywnego. Publiczne API daje tylko standardowe ikony (`set_cursor_icon`, `tauri-2.11.5/src/window/mod.rs:2207`; tao `CursorIcon`, brak `CustomCursor`). **ZAŁOŻENIE Z9:** kursory własne (te same SVG zrasteryzowane do obrazu z tym samym punktem aktywnym) przez kod platformowy w `src-tauri`; fallback = ikony z deklaracji CSS weba (`crosshair` dla miecza i ruchu, `pointer` dla spinacza i miasta), co jest odstępstwem wizualnym → D-SEAM-3. W M3 kursor zostaje w CSS warstwy trafień (jak web).
- Nad UI kursor ustawia CSS webview (bez zmian).

---

## 7. Kotwice w świecie (UI-Q2=A: rysuje Rust)

Wszystkie grupy DOM pozycjonowane projekcją kamery (pomiar: `git grep -n -E "\.project\(|worldToClientPx\(|worldToScreen\(|hexCenterClientPx\(" edb8fb56 -- gra/src` → **16 linii** (r1 podawał 14 — błąd; Evaluator r1 podał 17 — też niezgodne z logiem `logi-r2/01-projekcja.txt`, `git grep -c`: `battleScene.ts` 4, `manualBattle.ts` 3, `input/picker.ts` 2, `main.ts` 7). Rozkład: R4 3 (`main.ts:12939,12941,12949`), R5 1 (`:14592`), R6 3 (`:36417`, `:36421` — komentarze, `:36439`), R15a 3 (`battleScene.ts:8635,19419,19424`), R16 1 (`:16505`), R15b 3 (`manualBattle.ts:221,226,1207`), definicja `worldToClientPx` 2 (`picker.ts:101,109`); razem 5 grup + box-select:

| Grupa | Web | Treść (wejście dla Rust) | Kotwica | Styl do odtworzenia (P4.14/D-RR-6) |
|---|---|---|---|---|
| R4 chip budowy | `main.ts:12939-12968` | ikona etykiety, „Kliknij hex” / „Niedozwolone”, powód blokady (≤ 220 px) | środek heksu, `topYAt + 1,5`, przesunięcie `+14, −40` px (`:12967-12968`) | `:12957-12965` (kolory ramki `:12964`) |
| R5 etykiety oblężenia | `main.ts:14560-14603` | „⚔ OBLĘŻENIE” + nazwa miasta, dla `city.oblegane` | `topYAt + 1,1`, `translate(-50%,-100%)`, ukryte gdy `z > 1` (`:14593-14596`) | cssText `:14570-14576` |
| R6 etykiety galerii (dev) | `main.ts:36417-36455` | nazwa typu jednostki | nad tokenem | zależne od D-UI-7 |
| R15a liczby obrażeń (bitwa) | `battle/battleScene.ts:8635`, `:19419-19430` | wartość obrażeń, animacja | pozycja jednostki | RR-T10 |
| R15b (bitwa ręczna) | `battle/manualBattle.ts:1207` | — | — | martwy kod (F6) |

Skutek dla granicy: **brak strumienia pozycji per klatka Rust → UI** (to była główna wada K2 w P4-5). Przez granicę idą tylko dane treści: dla R4 — `GhostChip { hex, label, valid, reason }` (UI → Rust, bo tryb budowy i jego teksty żyją dziś w UI; powód blokady to reguła gry, więc docelowo z silnika), dla R5 — z modelu widoku miasta (`oblegane`, `name`). Chip budowy jest widoczny tylko, gdy kursor jest nad mapą (`chipOverCanvas`, `main.ts:12835`, `:13084-13086`) → w Rust: `¬over_ui`.

---

## 8. Dane dzielone renderer ↔ UI (D-UI-9)

`CityRenderOptions` budowane w `main.ts:2585-2649` (`_cityRenderOpts`, literał obiektu `:2592-2648`), konsument `render/cities.ts`. Podział 22 pól (r2: przeliczone i przeklasyfikowane; r1 podawał 9/4/9, co nie zgadzało się z własną listą 10/4/8):

| Klasa | Liczba | Pola (linia `main.ts`) | Reguła |
|---|---|---|---|
| **(a) wartości widoczne też w UI** — jedno pole modelu widoku z Rust, czytane przez renderer i UI | 13 | `getCityGrowth` `:2647` (WZROST%, ten sam `cityGrowthLive` co panel, `ui/cityPanel.ts:1527`), `getProduction` `:2628`, `getOwnerResourceStock` `:2629`, `getProductionItemStockCost` `:2630`, `getLevel` `:2600` (populacja 1–10), `getCapitalCityId` `:2639`, `getCivDisplayName` `:2640`, `getRevolt` `:2611`, `getWalls` `:2604`, `getWallKind` `:2605-2610` (wyprowadzane z listy zbudowanych budynków), `getBuiltBuildingIds` `:2623` (lista budynków, widoczna w panelu miasta), `ownerColorFn` `:2622` (`civColorFn` — kolor cywilizacji, też w UI), `getCivIconId` `:2627` (`civTypeForOwner` — ikona cywilizacji, też w UI) | zakaz liczenia w rendererze; rozjazd = błąd klasy `P-WZROSTPROCENT-PLAKIETKA-ROZJAZD` |
| **(b) stan UI wejściowy dla renderera** | 3 | `hideStatChips = isCityPanelOpen()` `:2621`, `hoverStatChipCityId` `:2631` (w Rust: stan własny, §5.2), `playerOwnerId` `:2632` (fotel aktywny, hot-seat) | przez `UiState` (§4.3) lub stan sesji silnika |
| **(a)+(b) pole mieszane** | 1 | `isVisible` `:2617-2620`: gdy otwarty panel miasta → tylko to miasto (stan UI, `cityPanelViewCityId`); inaczej `cityFogVisible(city, currentVisible())` (mgła = logika widzenia gry) | rozbite w Rust na: widoczność z mgły (model widoku silnika, ta sama co w UI) ∧ filtr `UiState.city_panel_city_id` |
| **(c) dane tylko renderera** | 5 | `getEra` `:2593`, `getCiv` `:2599` (model 3D cywilizacji), `getUnitCountOnHex` `:2615`, `getMapOutlineKind` `:2616`, `isCityStateOwner` `:2633` | z modelu widoku / danych statycznych, bez udziału UI i bez liczenia reguł w rendererze; czy UI pokazuje tę samą wartość (np. epokę) — `NIE_ZMIERZONO` (§15 pkt 14); jeśli tak, pole przechodzi do (a) |

Suma: 13 + 3 + 1 + 5 = 22.

**ZAŁOŻENIE Z12:** renderer i UI czytają **ten sam** snapshot modelu widoku z silnika (zdarzenie `engine_state_changed`, `src-tauri/src/lib.rs:42-45`, P4-3 §3.9 pkt 5); granica mapa↔UI nie przenosi liczb gry w żadną stronę (wyjątek: teksty trybu budowy z §7 do czasu przeniesienia trybu budowy do silnika). Katalog pól modelu widoku — temat równoległy `R-RUSTPORT-P5-0-…` (nie dotykam).

---

## 9. Stan kamery dla minimapy i polecenia kamery

- Web liczy dla minimapy `cameraGroundTarget()` (`main.ts:14426-14440`: `targetX`, `targetZ`, `distance`, `fov`, `aspect`), a prostokąt widoku w heksach — `computeViewport` (`map/minimap.ts:128-148`, z `worldToAxial` i przycięciem do mapy; `undefined`, gdy pusty). Minimapa rysuje prostokąt (`ui/minimapHud.ts:257-258`).
- Kontrakt: Rust → UI `CameraState { target_x, target_z, dist, minimap_viewport: Option<{x,y,w,h}> }` **przy zmianie**, maks. raz na klatkę. Prostokąt liczy Rust (ta sama formuła co `computeViewport`, `minimap.ts:128-148`), z wariantem **`hexutil`**: `map/minimap.ts:9` `import { worldToAxial, HEX_R } from '../render/hexutil'` (log `logi-r2/03-minimap-worldToAxial.txt`; def. `render/hexutil.ts:53`) → w Rust `pick::hex::world_to_axial_hexutil` (P4-10, wiersz `hexutil.ts:53-71`), **nie** wariant `picker.ts:49`. UI tylko rysuje.
- **Drugi i trzeci konsument `computeViewport` (r2):** `getMinimapData` (`minimap.ts:241`, ramka na minimapie) oraz dźwięk pozycyjny `computeWaterView` (`main.ts:14450-14456`: udział wody w kadrze, wołane z `renderLoop()` co ~0,5 s, nie co klatkę). **ZAŁOŻENIE (w Z12):** `CameraState.minimap_viewport` jest **jedynym** źródłem prostokąta kadru dla wszystkich konsumentów; moduł dźwięku (gdziekolwiek trafi w porcie — webview albo Rust, poza tym tematem) czyta ten sam prostokąt, a próbkowanie terenu (`map.hexes`) robi na danych mapy z modelu widoku, z tym samym krokiem `stride` (`:14461`) i tą samą częstotliwością ~0,5 s. Umiejscowienie dźwięku: `NIE_ZMIERZONO` / poza zakresem (§15 pkt 15).
- UI → Rust: `CameraFocusHex { q, r, dist: Option }` — minimapa (`main.ts:22954-22958`: `focusAt(axialToWorld(q,r), dist bez zmian)`), „pokaż na mapie” (cuda `:4659-4664`, jednostka `:6185-6188`, stolica `:11437`), oraz `CameraFocusWorld { x, z, dist }`. Zapis/odtworzenie widoku panelu miasta (`:5690-5706`) — w Rust, wyzwalane `UiState.city_panel_open` (F5).

## 10. Zoom UI 85–150% i pełny ekran (D-UI-5, rozstrzygnięcie orkiestratora)

- **Interpretacja „Rust skaluje widok synchronicznie z `--civ-ui-zoom`”** w świetle F4: kadr, kamera i współrzędne wejścia **bez zmian**; Rust zmienia tylko rozdzielczość bufora renderu na `(W/z) × min(DPR, pixelRatioMax)` × `(H/z) × …` (web: `scene.ts:1626` `setPixelRatio(min(devicePixelRatio, preset.pixelRatioMax))`, `:3109` `setSize(w,h)` z `w = clientWidth = innerWidth/z`) i skaluje obraz do okna. Komunikat UI → Rust: `UiZoom { z }` przy zmianie (web: `hud.ts:514-519` `setUiZoom` → `resize`). Prostokąty `HitRegions` przychodzą już w pikselach okna (po transformacji), więc predykaty nie potrzebują `z`.
- Czy właściciel woli pełną rozdzielczość (ostrzej przy z > 1, inaczej niż web) → D-SEAM-2.
- **Pełny ekran:** przycisk UI (`hud.ts:438-449`) wywołuje komendę Tauri → `Window::set_fullscreen` (`tauri-2.11.5/src/window/mod.rs:2119`). Stan czytany „na żywo” jak w webie (`hud.ts:384-386` `document.fullscreenElement`). **Źródło stanu (r2):** `Window::is_fullscreen()` (`tauri-2.11.5/src/window/mod.rs:1502`, log `logi-r2/06-tauri.txt`). Rust odpytuje `is_fullscreen()` (a) po każdym `WindowEvent::Resized`/`ScaleFactorChanged` z `Window::on_window_event` (`:1179`) i (b) zaraz po wykonaniu komendy `set_fullscreen`; Rust → UI `FullscreenChanged(bool)` tylko przy zmianie wartości. Czy przełączenie pełnego ekranu na WebView2/WebKitGTK zawsze daje `Resized` (np. okno już zmaksymalizowane w tym samym rozmiarze) i czy przełączenie z poziomu systemu (np. skrót okna) w ogóle jest widoczne: `NIE_ZMIERZONO` (§15 pkt 8) — dlatego dodatkowe odpytanie (b), a heurystyka „tylko `Resized`” nie jest jedynym źródłem. Podpowiedź pełnego ekranu (`hud.ts:404-431`) zostaje w UI. Renderer zmienia rozmiar na `Resized`/`ScaleFactorChanged` (web dopina też `fullscreenchange`, `scene.ts:3117`). Wyjście klawiszem `Escape` (w przeglądarce obsługuje je sama przeglądarka, poza kodem gry) — w Tauri trzeba je obsłużyć jawnie w łańcuchu `Escape` UI: kolejność względem `main.ts:36106+` `NIE_ZMIERZONO` → D-SEAM-4.

## 11. Katalog komunikatów granicy (transport UI-Q3=B)

| Kierunek | Komunikat | Kiedy | Uwagi |
|---|---|---|---|
| UI → Rust | `HitRegions` | przy zmianie | §4.1; `seq` |
| UI → Rust | `UiState` | przy zmianie | §4.3 |
| UI → Rust | `MapInput` (przekazane: `PointerMove/Up` nad UI, `pass_through`, `Key`) | zdarzenie; `PointerMove` koalescowane | §3.2 Z3, Z4, §4.4 (w M3 — wszystkie zdarzenia) |
| UI → Rust | `UiZoom`, `SetFullscreen`, `CameraFocusHex/World`, `GhostChip` | akcja | §7, §9, §10 |
| natywne → Rust | `MapInput` nad mapą | zdarzenie | M1/M2: hak platformowy w `src-tauri` (Z2) |
| Rust → UI | `HoverChanged` (`VeteranTip`, `stat_chip_hover`, `last_b_hex`, `hex`) | przy zmianie | §5.2 |
| Rust → UI | `MapClick`, `MapDoubleClick`, `MapRightUp`, `MapContextMenu` | zdarzenie | §5.3, Z15 |
| Rust → UI | `CanvasLeave` (skutki §3.4 po stronie UI: tooltip, pigułka) | przejście mapa → UI / wyjście z okna | §3.4, Z13 |
| Rust → UI | `CameraState` | przy zmianie, ≤ 1/klatkę | §9 |
| Rust → UI | `FullscreenChanged` | przy zmianie | §10 |

Wymiary wydajności (opóźnienie `HitRegions` → skutek, koszt serializacji `invoke`/zdarzeń przy `PointerMove` nad UI, liczba zdarzeń/s, wyścig „stary `seq` przy szybkim otwarciu panelu”): **`NIE_ZMIERZONO`** — wchodzą do spike RR-T1 (maszyna z GPU), zgodnie z LEDGER `:134`. **Reguła wyścigu (ZAŁOŻENIE w Z6):** zdarzenie oceniane jest wobec najnowszego posiadanego `seq`; webview wysyła `HitRegions` synchronicznie przed pokazaniem nowego kontenera (tak, by panel nie „przepuścił” pierwszego kliknięcia), a Rust nie cofa już wykonanych akcji.

## 12. Weryfikacja przy implementacji (propozycja testów)

Przypisanie do tematów z P4-3 §8 (`RR-Tn`), kandydatów P4-5 §6 (`P5-0`, `P5-1`) i P7 (integracja Tauri/okno). „CPU” = test jednostkowy bez GPU; „okno” = wymaga uruchomionej aplikacji Tauri na maszynie docelowej.

| # | Test | Co sprawdza | Temat | Rodzaj |
|---|---|---|---|---|
| T1 | Predykaty §4.2 na fiksturach | `over_ui` (`full_block`, `pass_through`), `over_city_panel` z `CityPanelGeometry` — pasy bez drugiej osi, półpłaszczyzna `x >= right_panel_left`, krawędzie `<`/`<=` jak `cityUxFrame.ts:193-215`; `block_pointer_at`/`block_wheel_at`/`edge_pan_active` | RR-T12 | CPU |
| T2 | Wektory złote predykatu panelu miasta | wynik `isPointOverCityPanelUi` z uruchomionego weba dla siatki punktów przy z ∈ {0,85; 1; 1,5} vs Rust (potwierdza Z5 i F4a) | RR-T12 (harness: RR-T11) | okno weba + CPU |
| T3 | `computeViewport` | wektory złote z kodu weba, wariant `hexutil`, tolerancja 0 | RR-T13 | CPU |
| T4 | Kolejność filtrów klik/dwuklik/PPM | tabela przypadków `main.ts:26209-26360`, `:26714-26725`; `MapRightUp` bez filtrów vs `MapContextMenu` z filtrami; Z15 (kolejność w trybie budowy) | RR-T12 | CPU |
| T5 | Wybór kursora | wektory `resolveMapUnitCursor` (`mapUnitCursor.ts:72-116`) | RR-T13 | CPU |
| T6 | Normalizacja współrzędnych | natywne px fizyczne / `scale_factor` ∈ {1; 1,25; 1,5; 2} = px CSS; zdarzenia z webview bez dzielenia; zmiana `ScaleFactorChanged` w trakcie | RR-T1 (pomiar), RR-T12 (test CPU funkcji) | okno + CPU |
| T7 | Wyścig `seq` w `HitRegions` | starszy `seq` po nowszym jest odrzucany; klik tuż po pokazaniu panelu nie przechodzi na mapę (Z6); opóźnienie `HitRegions` → skutek | RR-T12 (CPU: logika `seq`), RR-T1 (pomiar opóźnienia) | CPU + okno |
| T8 | Przekazywanie nad UI | `PointerMove/Up{over_ui:true}` → kamera kończy drag i robi edge-pan, hover/klik nie; `Key` z webview → stan klawiszy kamery; `pass_through` → `over_ui:false` (§4.4) | RR-T12 | CPU (+ okno w P7) |
| T9 | Leave i hover (Z13, Z14) | przejście mapa → UI daje `CanvasLeave` bez `mouse_leave` kamery (edge-pan trwa); `WindowLeave` zeruje kursor kamery; brak przeliczenia hovera przy WASD/edge-pan/kółku; zamrożenie hovera nad UI | RR-T12 | CPU |
| T10 | Kolejność kroków `HoverChanged` | sekwencja §5.2 pkt 1–6 dla fikstur (galeria, pre-bitwa, tryb budowy, brak zaznaczenia, ten sam heks) | RR-T13 | CPU |
| T11 | D-UI-9 | plakietka (renderer) i panel miasta (UI) czytają **to samo** pole modelu widoku dla 13 pól klasy (a) §8; brak funkcji liczących je w `rust-port/renderer` | P5-0 (katalog pól) + RR-T8 (plakietki) | CPU |
| T12 | Bufor `W/z` przy zoomie UI | rozdzielczość bufora = `(W/z)·min(DPR, pixelRatioMax)` dla z ∈ {0,85…1,5}; kadr i picking niezmienne (F4) | RR-T12 (CPU), RR-T11 (porównanie obrazu) | CPU + okno |
| T13 | `FullscreenChanged` | `set_fullscreen(true/false)` → jedno `FullscreenChanged` z wartością `is_fullscreen()`; przełączenie przy oknie zmaksymalizowanym | P7 | okno |
| T14 | Spike mechanizmu M1/M2 | Windows (WebView2), Linux (X11/Wayland): czy zdarzenie poza prostokątem dochodzi do Rust, opóźnienie, fokus klawiatury po kliknięciu mapy (Z3), kursor własny (Z9), źródło natywnego „leave” (Z13), kolejność PPM (Z15) | RR-T1 | okno |

---

## 13. Założenia (luki rozstrzygnięte domyślnie, do rewizji)

| ID | Założenie | § |
|---|---|---|
| Z1 | Kontrakt logiczny wspólny dla M1/M2/M3; kolejność prób M1 → M2 → M3 | §2 |
| Z2 | Hak platformowy (z `unsafe`) w `src-tauri`; `rust-port/renderer` bez `unsafe` | §2 |
| Z3 | Fokus klawiatury w webview; webview przekazuje wszystkie `keydown/keyup`; Rust oddaje fokus po kliknięciu mapy | §3.2 |
| Z4 | Nad UI webview przekazuje `PointerMove` i `PointerUp` (kamera: drag i edge-pan jak w webie) | §3.2 |
| Z5 | (r2) `over_city_panel` = formuła weba 1:1 na `CityPanelGeometry` liczonej kodem weba (pasy, półpłaszczyzny); F4a przy z ≠ 1 odtwarzane | §4.1, §4.2 |
| Z6 | Jawny rejestr kontenerów-blokerów; `HitRegions` przy zmianie, z `seq`, wysyłane przed pokazaniem kontenera | §4.1, §11 |
| Z7 | `UiState.world_map_unit_mode` jako jedno pole (wynik), nie lista flag | §4.3 |
| Z8 | Brak synchronicznego pickingu na żądanie UI | §5.1 |
| Z9 | Kursory własne przez kod platformowy; fallback = ikony z deklaracji CSS weba | §6 |
| Z10 | Tooltip weterana zostaje w DOM (kotwica: kursor), tekst i pozycja z Rust | §5.2 |
| Z11 | Bitwa: ten sam `MapInput` z polem `scene`; szczegóły w RR-T10 | §3.3 |
| Z12 | Renderer i UI czytają ten sam snapshot modelu widoku; granica nie przenosi liczb gry; `CameraState.minimap_viewport` jedynym źródłem kadru (minimapa, dźwięk pozycyjny) | §8, §9 |
| Z13 | (r2) `CanvasLeave` wyprowadza Rust z przejścia `over_ui` false → true i z `WindowLeave`; tylko `WindowLeave` woła `mouse_leave` kamery | §3.4 |
| Z14 | (r2) Hover tylko po `PointerMove{over_ui:false}`; zakaz liczenia przy ruchu kamery i co klatkę | §3.4 |
| Z15 | (r2) PPM: `MapRightUp` (bez filtrów) potem `MapContextMenu` (z filtrami) — kolejność Windows | §3.2 |

## 14. Punkty dla właściciela (`D-SEAM-n`, przez orkiestratora)

- **D-SEAM-1 — Dziwactwo predykatu panelu miasta przy zoomie UI ≠ 100% (F4a):** A: odtworzyć 1:1 (stałe bez `z` — domyślne w r2, Z5, zgodne z zasadą 1:1); B: poprawić (geometria liczona z uwzględnieniem `z`) — odstępstwo od weba, zmiana zachowania widoczna dla gracza.
- **D-SEAM-2 — Rozdzielczość renderu przy zoomie UI:** A: jak web, bufor `W/z` (rekomendacja dla 1:1); B: zawsze pełna rozdzielczość okna.
- **D-SEAM-3 — Kursory mapy nad natywną powierzchnią:** A: własne SVG przez kod platformowy (rekomendacja); B: standardowe ikony (`crosshair`/`pointer`) — odstępstwo wizualne.
- **D-SEAM-4 — `Escape` a pełny ekran w Tauri:** A: `Escape` najpierw wychodzi z pełnego ekranu (jak przeglądarka); B: najpierw łańcuch gry (`main.ts:36106+`), pełny ekran tylko przyciskiem.
- **D-SEAM-5 — Gdy RR-T1 pokaże, że M1 i M2 nie działają:** A: M3 (webview zbiera wszystko — odstępstwo od UI-Q3=B); B: zmiana osadzenia (D-RR-2).

## 15. `NIE_ZMIERZONO`

1. Wykonalność M1 (region wejścia hosta WebView2 / kształt wejścia GTK / `hitTest:` macOS) i M2 (okno-dziecko z regionem) — RR-T1.
2. Czy klik w okno-rodzica odbiera fokus klawiatury webview; czy `Webview::set_focus` go przywraca bez efektów ubocznych.
3. Opóźnienie i przepustowość IPC dla `HitRegions`, `PointerMove` nad UI, `HoverChanged`, `CameraState`.
4. Wyścig `HitRegions` przy szybkim otwieraniu paneli (pierwsze kliknięcie po pokazaniu panelu).
5. F4 w uruchomionej przeglądarce (kadr mapy niezmienny przy zoomie UI) — wniosek z kodu i semantyki CSS.
6. F4a w runtime (rozjazd strefy panelu miasta przy z ≠ 1).
7. Kursory własne na Windows/Linux (kod platformowy).
8. Zachowanie `Escape` i `set_fullscreen` w WebView2/WebKitGTK.
9. ~~Która funkcja `worldToAxial` jest użyta w `map/minimap.ts`~~ — **ZAMKNIĘTE w r2:** `hexutil` (`minimap.ts:9`, log `logi-r2/03-minimap-worldToAxial.txt`), §9.
10. Lista kontenerów-blokerów w kopii UI (zależy od P5-1).
11. Dlaczego web potrzebuje predykatu `isPointOverCityPanelUi` mimo stosu DOM (np. elementy ramki miasta z `pointer-events:none`) — nie sprawdzałem CSS ramki; kontrakt nie zależy od przyczyny.
12. Reguły wejścia bitwy w szczegółach (pan PPM/środkowym, box-select) — RR-T10.
13. (r2) Kolejność `mouseup`/`contextmenu` dla PPM w WebView2 i WebKitGTK (Z15) oraz natywne źródło „leave” okna (Z13) — RR-T1.
14. (r2) Czy UI pokazuje te same wartości co pola klasy (c) §8 (np. epoka `getEra`) — P5-0.
15. (r2) Umiejscowienie dźwięku pozycyjnego w porcie (webview czy Rust) — poza tym tematem; kontrakt wymaga tylko wspólnego `minimap_viewport` (§9).

## 16. Metoda (komendy)

- `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (HEAD `85fbdcce`).
- `git -C <worktree> show edb8fb56:gra/src/{main.ts,render/camera.ts,render/scene.ts,ui/hud.ts,ui/minimapHud.ts,ui/hudLayout.ts,ui/cityUxFrame.ts,ui/mapUnitCursor.ts,input/picker.ts,map/minimap.ts} > <scratchpad>/…` (pojedynczo), potem `grep -n`/`sed -n` na kopiach; `battle/battleScene.ts` z kopii w scratchpadzie (`cmp` z drugą kopią → identyczne).
- `git grep -n -E "setViewOffset|filmOffset|clearViewOffset" edb8fb56 -- gra/src` → 0; `git grep -n -E "\.project\(|worldToClientPx\(|worldToScreen\(|hexCenterClientPx\(" edb8fb56 -- gra/src` → 16 linii (r2; surowe wyjście z EXIT: `logi-r2/01-projekcja.txt`); `git grep -n -E "pickVeteranBadgeUnitIdAt\(|pickStatChipCityIdAt\(|export function computeViewport|function cityGrowthLive" edb8fb56 -- …` → `units.ts:5900`, `cities.ts:609`, `minimap.ts:128`, `cityPanel.ts:1527`.
- `git grep -n -E "pub trait InputGate|fn block_pointer_at|…|pub enum MapPick" origin/rust-port/parity-v2 -- rust-port/renderer/src` (`69f432ba`).
- Źródła Tauri: `grep -n "pub fn (set_cursor_icon|set_focus|set_fullscreen|…)" tauri-2.11.5/src`; `grep -n "pub enum WindowEvent" -A40 tauri-runtime-2.11.3/src/window.rs`; `grep -rn "CursorMoved|MouseInput|MouseWheel" tauri-runtime-wry-2.11.4/src/lib.rs` → 0; `grep "CustomCursor|pub enum CursorIcon" tao-0.35.3/src/window.rs` → tylko `:1445`; `grep -rn "SetWindowRgn|input_shape|shape_combine"` w `wry-0.55.1`/`tao-0.35.3` → `tao…/linux/event_loop.rs:458,460`.
- **Surowe logi z EXIT (r2)** w `dyspozycje/autobot/runs/R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1/logi-r2/`: `01-projekcja.txt` (§7), `02-viewoffset.txt` (F5; EXIT=1 = brak trafień w `git grep`), `03-minimap-worldToAxial.txt` (§9), `04-hover-wejscie.txt` (§3.2, §3.4, Z14), `05-rust-camera-pick.txt` (`InputGate`, `mouse_leave`, `MapPick`, `UnitPickModel.id`), `06-tauri.txt` (F1, F7, `is_fullscreen`).
- Zero `npm`, `cargo`, buildu; zero zapisu poza allowlistą.
