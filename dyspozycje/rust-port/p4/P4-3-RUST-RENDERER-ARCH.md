# P4.3 — Architektura renderera mapy w Rust (wgpu): silnik, osadzenie w Tauri, picking, potok modeli, testy 1:1, pamięć

**Temat:** `R-RUSTPORT-P4-3-RUST-RENDERER-ARCH-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 2/5 (poprawki po FAIL Evaluatora r1, zarzuty 1–11 — rejestr zmian w §10)
**Status dokumentu:** projekt architektury z punktami decyzji `D-RR-n`. Nic tu nie jest rozstrzygnięte po cichu.
**Decyzja wejściowa właściciela (LEDGER 2026-10-21):** renderer mapy i wszystkie modele 3D w Rust; picking piksel→heks w Rust; zakres 3D z D-REND-8 = B (mapa, bitwa ręczna, cuda, miniatury). P4.1 i P4.2 (wariant Three.js) są unieważnione.

**Piny (read-only):**
- web: `edb8fb56` — odczyt wyłącznie `git show edb8fb56:<ścieżka>` / `git archive edb8fb56 gra/src` do katalogu tymczasowego poza repo, potem `grep`. Zero `npm`, zero buildu, zero uruchamiania.
- Rust: `origin/rust-port/parity-v2` = `f7aa0997` (P2.8 opisywał `9e33fc77`; pliki `src-tauri/**` cytowane niżej odczytane na `f7aa0997`).
- Baza dokumentu: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` = `dc4cfdb4`.

**Legenda:** `plik:linia` = odczyt na pinie web (ścieżki względem `gra/src/`, chyba że podano inaczej). „cmd → wynik” = wynik wklejony z tej sesji. `NIE_ZMIERZONO` = nie sprawdzono; nie wnioskuję z nazw ani z pamięci.
**Wiedza zewnętrzna:** jeśli zdanie opiera się na wiedzy spoza repo i spoza cache `~/.cargo/registry`, jest oznaczone `[zewn., niezweryfikowane]`.

---

## 0. Streszczenie (dla właściciela)

1. **Silnik:** rekomendacja **wgpu bezpośrednio** (bez Bevy) + własna cienka warstwa „scena/materiały/instancing”. Bevy narzuca własną pętlę okna (winit) i ECS, a Tauri ma własną pętlę (tao). To konflikt, którego nie sprawdziłem w praktyce. → `D-RR-1`.
2. **Osadzenie:** rekomendacja **(a) jedno okno Tauri**: na spodzie natywna powierzchnia wgpu, nad nią przezroczysty webview z HUD. Warunek: **spike na Windows i Linux** przed implementacją. Kod Tauri 2.11.5/wry 0.55.1 ma potrzebne API (przezroczystość, `raw-window-handle`, webview-dziecko), ale dwa z nich stoją za flagą `unstable`, a webview-dziecko na Linuksie działa tylko pod X11. Tego, czy złożenie działa (fokus, kliknięcia przez przezroczyste piksele, DPI), **nie zmierzono**. → `D-RR-2`.
3. **Picking:** matematykę webu wyprowadziłem z kodu (§3). Ważne: **sama płaszczyzna Y=const nie daje identycznych wyników.** Web trafia promieniem w realne bryły: pryzmy terenu z bokami, bryły gór i wzgórz, modele jednostek (mają pierwszeństwo). Płaszczyzna jest tylko awaryjna, gdy nic nie trafiono (np. heks pod mgłą). Są też dwie pułapki zgodności numerycznej: `Math.round` w JS ≠ `f64::round` w Rust oraz dwie różne funkcje `worldToAxial` w webie. → `D-RR-3`.
4. **Modele:** web buduje wszystko proceduralnie z kilku prymitywów (1 494× `BoxGeometry`, 397× `CylinderGeometry`, 121× `ConeGeometry` …). W Rust potrzebny jest wspólny **„builder prymitywów” zgodny wierzchołek w wierzchołek z Three.js r169** oraz model materiałów Lambert/Standard/Basic z mgłą i tone mappingiem. Tekstury z `<canvas>` (tekst na plakietkach) to osobny, trudny problem → `D-RR-4`.
5. **Pamięć (motyw właściciela):** w kodzie są **dowiedzione ścieżki kodu bez zwolnienia zasobów i rosnące cache** zależne od tury (§7.1): przebudowa modelu miasta przy każdej zmianie populacji bez `dispose()` geometrii, rosnący cache tekstur plakietek miast, nasłuchiwacze bitwy nigdy nieusuwane. Dowód dotyczy **ścieżki kodu**, nie zmierzonej retencji pamięci GPU: to, że brak `dispose()` zatrzymuje bufor GPU, opiera się na wnętrzu Three r169 (niesprawdzonym tu, źródła brak w repo) i na tezie projektu z `mergeDecor.ts:146-150`. Wyjątki dowiedzione na poziomie JS: M2 (`Map` trzyma referencje do tekstur) i M3 (nasłuchiwacze trzymają `this`). Web sam to podejrzewał (`P-PERF-SPOWOLNIENIE-PO-60-TURACH`). **Nie dowodzę, że to jest TA przyczyna niegrywalności** — bez profilera to `NIE_ZMIERZONO`. Wymagania dla Rust: §7.3 (własność zasobów, pule, budżet, test „N tur”).
6. **Skala:** to przepisanie rzędu **tygodni, a raczej miesięcy pracy agentów, nie dni**. Do odtworzenia: ~83 tys. LOC plików z 3D — **to dolna granica**, bo nie obejmuje części 3D w `main.ts` (39 350 LOC, udział NIE_ZMIERZONO, P4-0 l.184) — 2 080 konstrukcji geometrii w `render/**`, 3D bitwy (19 493 LOC pliku). Dokładnej wyceny nie podaję — brak metody (`NIE_ZMIERZONO`). Kolejność tematów: §8.

---

## 1. Silnik / biblioteka (pytanie 1)

### 1.1 Fakty środowiska (zmierzone)

| Fakt | Komenda → wynik |
|---|---|
| Toolchain | `cargo --version` → `cargo 1.97.0 (c980f4866 2026-06-30)`; `rustc 1.97.0` |
| Shell Tauri wymaga | `src-tauri/Cargo.toml` (`f7aa0997`): `rust-version = "1.77.2"`, `tauri = "=2.11.5"`, `tauri-build = "=2.6.3"` |
| Okno Tauri w lockfile | `src-tauri/Cargo.lock`: `tao 0.35.3`, `wry 0.55.1`, `tauri-runtime-wry 2.11.4`, `raw-window-handle 0.6.2`, `webview2-com 0.38.2`, `webkit2gtk 2.0.2`, `gtk 0.18.2`, `softbuffer 0.4.8`, `windows 0.61.3`; łącznie 433 pakiety (`grep -c '^name = '` → 433). **Brak** `wgpu`, `winit`, `bevy`. |
| Cache offline `~/.cargo/registry/cache` | **Stan przed tym tematem:** 302 crate'y; `grep -iE 'wgpu|bevy|naga|winit|glam|egui|glow|metal'` → 0 trafień. **Stan po r1 (ujawnienie, zarzut 2):** `cargo info` Operatora r1 pobrał do cache same archiwa najwyższego poziomu — `ls -la --time-style=full-iso ~/.cargo/registry/cache/*/` → `wgpu-30.0.1.crate` 19:01:11, `bevy-0.20.0-rc.2.crate` 19:01:11, `three-d-0.19.0.crate` 19:01:12, `bevy-0.20.0.crate` 19:06:31 (2026-10-21 UTC); rozpakowane źródła w `~/.cargo/registry/src/*/` (z nich cytuję `Cargo.toml` niżej). Zależności przechodnich (`naga`, `wgpu-core`, `wgpu-hal`, `winit` itd.) **nadal nie ma** (`ls … | grep -iE 'wgpu|bevy|naga|winit|three'` → tylko te 4 pliki). Wniosek „offline się nie zbuduje” bez zmian. Obecne m.in.: `tao-0.35.3`, `wry-0.55.1`, `raw-window-handle-0.6.2`, `png-0.17.16`, `png-0.18.1`. Źródła `tauri-2.11.5`, `wry-0.55.1`, `tao-0.35.3` są w `~/.cargo/registry/src/` (z nich cytuję API w §2). |
| Dostępność rejestru (sieć przez proxy) | `cargo search wgpu` → `wgpu = "30.0.1"`; `cargo search bevy` → `bevy = "0.20.0"`; `cargo search three-d` → `three-d = "0.19.0"`. Rejestr jest osiągalny, **zależności nie są w cache** → pierwszy build potrzebuje sieci. |
| GPU w tym środowisku | `ls /dev/dri` → brak; `/usr/share/vulkan/icd.d` → brak (jest tylko loader `libvulkan.so.1`, brak sterownika ICD, więc brak lavapipe); Mesa: `swrast_dri.so`, `kms_swrast_dri.so`, `zink_dri.so`, `libgallium-25.2.8`; `Xvfb`/`xvfb-run` są; `libwebkit2gtk` **nie** występuje w `ldconfig -p`. 4 CPU, 15 GiB RAM. |

### 1.2 Porównanie kandydatów

`cargo info` (rejestr crates.io, dziś):

| Kryterium | **wgpu (bezpośrednio)** | **Bevy** | **three-d** |
|---|---|---|---|
| Wersja | 30.0.1 | 0.20.0 | 0.19.0 |
| Licencja | MIT OR Apache-2.0 | MIT OR Apache-2.0 | MIT |
| MSRV | 1.87.0 (`wgpu-30.0.1/Cargo.toml:14`; > 1.77.2 shella → **trzeba podnieść `rust-version` w `src-tauri`**; ≤ lokalny `rustc 1.97.0` → OK) | **1.97.1** (`bevy-0.20.0/Cargo.toml:14` `rust-version = "1.97.1"`; r1 podał błędnie 1.96.0 — to wartość z `bevy-0.20.0-rc.2/Cargo.toml:14`). **> lokalny `rustc 1.97.0 (2d8144b78 2026-07-07)` → Bevy 0.20.0 nie zbuduje się bez nowszego toolchainu** | brak pola `rust-version` w `three-d-0.19.0/Cargo.toml` (`grep rust-version` → 0) |
| Backendy / platformy | domyślne cechy: `dx12, metal, gles, vulkan, wgsl, webgpu` (`cargo info wgpu`) → Windows (DX12/Vulkan), macOS (Metal), Linux (Vulkan/GLES) | cechy `x11`, `wayland`, `webgl2`, `webgpu`, `bevy_winit`, `bevy_pbr`, `bevy_render`; domyślne `2d, 3d, ui, audio` (`cargo info bevy@0.20.0 -v`) | domyślna cecha `window = [glutin, winit, raw-window-handle, …]`; na OpenGL (glutin/glow) |
| Okno / pętla zdarzeń | **nie posiada** — powierzchnia z `raw-window-handle` (cecha `std = [raw-window-handle/std, …]`) → można podpiąć pod okno tao/Tauri | posiada przez `bevy_winit` (winit); praca w oknie hosta (tao) bez winit — **NIE_ZMIERZONO** | `winit` w cechach domyślnych; tryb bez okna przez `raw-window-handle` — **NIE_ZMIERZONO** |
| Model programowania | ręczny render graph, własne bufory i potoki | ECS + gotowy PBR, picking, UI, audio | prosty „scene-graph” zbliżony do Three.js, ale na GL |
| Rozmiar zależności | **NIE_ZMIERZONO** (bez `cargo tree`/fetch) | **NIE_ZMIERZONO**; z cech wynika, że jest znacznie większy (pełny silnik gry) | **NIE_ZMIERZONO** |
| Offline | w cache tylko archiwum `wgpu-30.0.1` (pobrane w r1), bez zależności | w cache tylko `bevy-0.20.0` i `-rc.2` (pobrane w r1), bez zależności | w cache tylko `three-d-0.19.0` (pobrane w r1), bez zależności |
| Testy wizualne headless | wgpu umie renderować do tekstury bez okna i odczytać piksele `[zewn., niezweryfikowane]`; w tym kontenerze **brak adaptera GPU** (brak ICD Vulkan, brak EGL w `ldconfig -p`) → **NIE_ZMIERZONO**, czy dostaniemy jakikolwiek adapter | jak wgpu (Bevy stoi na wgpu `[zewn., niezweryfikowane]`) | software GL przez Mesa swrast jest w systemie; czy three-d go użyje — **NIE_ZMIERZONO** |
| Ryzyko 1:1 z Three.js | pełna kontrola nad shaderami → można odtworzyć wzory Lamberta i mgłę z Three r169 linijka po linijce; tone mapping w grze (styl `roblox`) **wyłączony** — ACES tylko dla stylu `civ` (`scene.ts:1638-1641`) | trzeba nadpisać/obejść jego PBR i tone mapping; własne materiały możliwe, ale walka z domyślnymi | bliższe Three.js nazewnictwem; parzystość shaderów z r169 — **NIE_ZMIERZONO** |

**Ocena (nie decyzja):**
- **Bevy:** największe ryzyko integracyjne. Dwie pętle okien (winit i tao) w jednym procesie. Nie sprawdziłem, czy Bevy może renderować do okna utworzonego przez Tauri. ECS jest dla nas zbędny: stan gry trzyma `civ-engine`, a renderer tylko go odzwierciedla.
- **three-d:** OpenGL zamiast natywnego DX12/Metal. MSRV nieznane. Mały ekosystem. Atut: semantyka bliska Three.js.
- **wgpu:** najmniej „magii” i natywne backendy na trzech platformach. Wymaga własnej warstwy: scena, instancing, materiały, cienie, sprite'y, tekst. Tę warstwę i tak musimy napisać, żeby zgadzała się z Three.js co do wierzchołka i wzoru shadera (§4).

**Rekomendacja:** `D-RR-1 = wgpu` (+ ewentualnie `glam` do matematyki; dobór crate'ów pomocniczych to osobny punkt spike'a — `NIE_ZMIERZONO`).

---

## 2. Osadzenie w Tauri (pytanie 2)

### 2.1 Stan dziś (fakty)

- `src-tauri/tauri.conf.json` (`f7aa0997`): jedno okno `main`, 1280×800, `resizable: true`; `withGlobalTauri: true`; `frontendDist: "frontend"`; bundle `msi`, `nsis` (tylko Windows).
- `src-tauri/src/lib.rs:28-48` — jedna komenda `engine_command`; `lib.rs:42-45` — emisja `engine_state_changed`; `lib.rs:57-61` — `tauri::Builder::default().run(...)`. **Brak** jakiegokolwiek kodu okien, GPU ani `setup`.
- `src-tauri/Cargo.toml`: `tauri = { version = "=2.11.5", features = [] }` → cecha `unstable` **wyłączona**.
- Frontend Tauri rysuje mapę jako siatkę przycisków DOM: `src-tauri/frontend/main.js:668` (`gameMap.style.gridTemplateColumns = repeat(${map.width}, …)`), `:678-679` (`button.className = tile …`, `role="gridcell"`). (Rozstrzyga to wątpliwość z P4-0 §3.4 co do faktu, nie co do docelowego UI — temat P4.5.)

### 2.2 API Tauri/wry dostępne w cache (zweryfikowane w źródłach)

| Możliwość | Dowód (źródła w `~/.cargo/registry/src/*/`) | Uwaga |
|---|---|---|
| Uchwyt okna dla wgpu | `tauri-2.11.5/src/window/mod.rs:1010` `impl HasWindowHandle for Window<R>`; `:1018` `HasDisplayHandle`; `src/webview/webview_window.rs:1469` dla `WebviewWindow` | Bez flag. `raw-window-handle 0.6.2` w lockfile (`src-tauri/Cargo.lock`, `f7aa0997`). **Zgodne statycznie:** `wgpu-30.0.1/Cargo.toml:186-189` `[dependencies.raw-window-handle] version = "0.6.2"` (semver `^0.6.2`) → ta sama wersja 0.6.2 spełnia oba. Działanie w runtime — spike RR-T1 |
| Przezroczyste okno | `tauri-2.11.5/src/window/mod.rs:907-918` `transparent()`; na macOS tylko z cechą `macos-private-api` (`#[cfg(any(not(target_os = "macos"), feature = "macos-private-api"))]`) | macOS wymaga prywatnego API |
| Przezroczysty webview | `tauri-2.11.5/src/webview/mod.rs:1015-1025` `transparent()` (ten sam warunek macOS); `wry-0.55.1/src/lib.rs:912-917` `with_transparent` — „**Windows 7**: Not supported” | |
| Webview jako dziecko okna (wiele webview w oknie) | `tauri-2.11.5/src/window/mod.rs:1126-1134` `add_child` — `#[cfg(any(test, all(desktop, feature = "unstable")))]`; `Window::builder` `:1118-1123` — też `unstable`; `Cargo.toml:130` `unstable = ["tauri-runtime-wry?/unstable"]` | **Wymaga `unstable`** |
| Webview-dziecko na Linuksie | `wry-0.55.1/src/lib.rs:77-78` „`build_as_child` … supported on macOS, Windows and Linux (**X11 Only**)”; `:1451` „Linux: Only X11 is supported, if you want to support Wayland too, use `new_gtk`” | Wayland — ryzyko |
| Przepuszczanie kursora | `tauri-2.11.5/src/window/mod.rs:2225` `set_ignore_cursor_events` (całe okno) | Ustawienie per piksel/obszar — **brak takiego API w znalezionych sygnaturach**; trzeba to rozwiązać inaczej (§2.3) |
| Dostęp do natywnego webview | `tauri-2.11.5/src/webview/mod.rs:1668` `with_webview(PlatformWebview)` | furtka na kod platformowy |

### 2.3 Opcje osadzenia

| | **(a) Jedno okno: powierzchnia wgpu pod przezroczystym webview z HUD** | **(b) Osobne okno gry + okna UI** | **(c) wgpu → WASM/WebGPU w webview** | **(d) Okno gry tao/wgpu z UI rysowanym w Rust (egui itp.)** |
|---|---|---|---|---|
| Opis | Okno Tauri; wgpu dostaje `Window` (raw handle) i rysuje mapę; webview przezroczysty (lub webview-dziecko na pełny obszar) rysuje HUD/panele HTML 1:1 | Okno gry bez webview (wgpu) + osobne okna Tauri z panelami | Renderer Rust skompilowany do WASM; rysuje w `<canvas>` przez WebGPU/WebGL2 w webview | Rezygnacja z HTML |
| Fokus / wejście | Kliknięcia trafiają do webview (jest na wierzchu). Mapa dostaje wejście **przez webview**: JS przechwytuje `mousedown/up/move/wheel` nad pustym (przezroczystym) obszarem i wysyła współrzędne do Rust. `set_ignore_cursor_events` działa tylko na całe okno → nie rozwiązuje przezroczystości per piksel. Zachowanie — **NIE_ZMIERZONO** | Naturalne per okno, ale gracz przełącza fokus między oknami; panele „nad mapą” (tooltipy przy kursorze, plakietki) nie leżą nad mapą | Jak dziś w webie (canvas w DOM) | Natywne |
| DPI | Dwie skale: wgpu w pikselach fizycznych okna, webview w CSS px × `devicePixelRatio`. Konwersja musi być jedna (§3.6). Zgodność na Windows (WebView2) i Linux (WebKitGTK) — **NIE_ZMIERZONO** | Każde okno osobno | Jak web | Natywne |
| Przezroczystość | Wymaga przezroczystego webview (Win7: nie; macOS: `macos-private-api`; Linux: zależne od kompozytora — **NIE_ZMIERZONO**). Kolejność warstw (wgpu pod webview) na każdym OS — **NIE_ZMIERZONO**, główne ryzyko | niepotrzebna | niepotrzebna | niepotrzebna |
| Windows | WebView2 nad powierzchnią DX12 — **NIE_ZMIERZONO** | proste | WebGPU w WebView2 — **NIE_ZMIERZONO** | proste |
| Linux | `build_as_child` tylko X11 (wry `lib.rs:77-78`); Wayland przez `new_gtk` — **NIE_ZMIERZONO** | proste | WebGPU w WebKitGTK — **NIE_ZMIERZONO** (nie zakładam, że jest) | proste |
| Wpływ na HUD/P5 (UI 1:1 w HTML) | **Zachowany** — UI zostaje HTML w webview | Złamany układ „panele nad mapą” → nie 1:1 | Zachowany | **Złamany** — UI trzeba przepisać; sprzeczne z P5 |
| Wpływ na picking | Rust liczy picking; JS przekazuje tylko `clientX/Y` i rozmiar viewportu | Rust natywnie | Picking w WASM (to dalej kod Rust, ale w webview) | Rust natywnie |
| Wpływ na testy | Zrzut powierzchni wgpu (offscreen) + osobno DOM (Playwright/WebDriver) — złożenie na jednym obrazie trudniejsze | Proste per okno | Jeden zrzut przeglądarki | Proste |
| Zgodność z decyzją właściciela | Tak | Tak, ale UX niezgodny z webem | **Uczciwie: to znów „renderer w webview”.** Kod jest w Rust, ale wykonanie, pamięć GPU i sterownik należą do silnika przeglądarki. Motyw właściciela (pamięć w webview) jest wtedy tylko częściowo spełniony | Tak, ale łamie UI 1:1 |

**Ocena:** (a) jest jedyną opcją, która jednocześnie spełnia decyzję właściciela (natywny GPU) i P5 (UI 1:1 w HTML). Jej wykonalność to dziś hipoteza, więc najpierw spike: `RR-T1` w §8. (c) zostaje jako plan awaryjny, z jawnym zastrzeżeniem z tabeli. (b) i (d) łamią 1:1.

**Ryzyko krytyczne opcji (a):** jeśli na którymś OS przezroczysty webview nad natywną powierzchnią nie działa lub miga, fallbackiem jest **odwrócenie warstw**: mapa jako natywne okno-dziecko **nad** webview, przycięte do obszaru mapy, a panele HTML jako osobne webview-dzieci nad mapą (`add_child`, `unstable`). To większa złożoność. Wykonalność — **NIE_ZMIERZONO**.

---

## 3. Picking piksel → heks (pytanie 3)

### 3.1 Łańcuch wywołań w webie

1. `main.ts:26204-26207` — `mousedown` zapamiętuje `mouseDownX/Y`.
2. `main.ts:26337-26350` — `mouseup` LPM. Jeśli `hypot(dx,dy) ≥ DRAG_THRESHOLD` (6 px, `main.ts:26202` = `camera.ts:25`) i nie jest to tryb stawiania (`placementClick`) → przeciągnięcie, klik ignorowany.
3. `main.ts:26369` — `pickMapTarget(clientX, clientY)`.
4. `main.ts:1894-1901` `pickMapTarget`: **najpierw** `unitRenderer.pickUnitIdAt` (raycast rekursywny w widoczne modele jednostek, `render/units.ts:5867-5893`). Trafienie zwraca **heks jednostki** `(u.q,u.r)`, nie heks pod kursorem. Dopiero potem `pickHexAt`.
5. `main.ts:1885-1891` `pickHexAt` → `input/picker.ts:175` `pixelToHex(..., HEX_R, terrainPickMeshes, resolveTerrainPick, (q,r) => unitRenderer.topYAt(q,r))`.
6. Prawy klik: `main.ts:26209-26221` (`contextmenu`) i `main.ts:26339-26343`. **Nie używa pickingu** — anuluje tryb budowy, zdejmuje zaznaczenie, zamyka panel heksa.
7. Hover: `main.ts` `mousemove` na canvasie — osobne raycasty: gwiazdki weterana (`units.ts` `pickVeteranBadgeUnitIdAt`) i pigułki miast (`cityRenderer.pickStatChipCityIdAt`). Też wymagają odpowiednika w Rust.

### 3.2 Kamera (dokładne wartości)

- Projekcja: `PerspectiveCamera(50, aspect, 0.5, farClip)` — `render/scene.ts:3078-3083`. `fov` = **50° pionowo**. `near = 0.5`. `farClip` (styl `roblox`) `= max(1200, maxZoomDist·5, mapMaxDim·R·6)` — `scene.ts:3075-3077`.
- Aspekt: `w/h` canvasu (`scene.ts:3105-3106` w `onResize`).
- Pozycja (stan ustalony przez `CameraController._syncCamera`, `camera.ts:130-144`):
  `elevation = 52°`, `azimut = yaw = 0` (stałe, `camera.ts:123`), cel `T = (tx, 0, tz)` (`camera.ts:106`, `focusAt` `:292-298` ustawia `y = 0`).
  `P = T + d·(cos52°·sin0, sin52°, cos52°·cos0) = (tx, d·sin52°, tz + d·cos52°)`; `camera.lookAt(T)`.
- Zakres `d`: `minDist = 8/3`, `maxDist = max(320, 1.85·max(W,H)·HEX_R·1.2)` (`main.ts:1904-1908`); zoom: `d ← clamp(d·(1 ± 0.12))` na skok kółka (`camera.ts:154-161`, `:215-220`).
- Pan: przeciąganie `ΔT = (-Δx_px, -Δy_px)·d·0.002` (`camera.ts:202-205`); WASD/strzałki i edge-pan `speed = 0.3·d/30` na klatkę (`main.ts:1909`, `camera.ts:275-289`, edge-pan `:251-272`).
- Uwaga: pozycja startowa przed kontrolerem to `(cx, camDist·0.9, cz + camDist·0.7)` (`scene.ts:3084-3085`, ~52,1°). Kontroler nadpisuje ją w konstruktorze (`camera.ts:126` → `_syncCamera`) dokładnym 52°.

**Baza kamery (wyprowadzenie z `lookAt`, up = +Y):** oś „do tyłu” `z_c = normalize(P − T) = (0, sin52°, cos52°)`; `x_c = normalize(up × z_c) = (1, 0, 0)`; `y_c = z_c × x_c = (0, cos52°, −sin52°)`.

### 3.3 Promień z piksela

1. NDC (`picker.ts:87-98` `clientRectToNdc`): `nx = ((cx − rect.left)/rect.width)·2 − 1`, `ny = −((cy − rect.top)/rect.height)·2 + 1`. `rect = canvas.getBoundingClientRect()` w **CSS px** — nie zależy od `devicePixelRatio`.
2. `Raycaster.setFromCamera` (`picker.ts:192-193`) dla kamery perspektywicznej: początek = `P`, kierunek = znormalizowany `unproject(nx, ny, 0.5) − P`. W czystej matematyce (równoważnie):
   `t = tan(25°)`, `dir = normalize(−z_c + nx·t·aspect·x_c + ny·t·y_c)`
   `= normalize( nx·t·a , ny·t·cos52° − sin52° , −ny·t·sin52° − cos52° )`.
3. Przecięcie z płaszczyzną `y = h`: `λ = (h − P.y)/dir.y` (`dir.y < 0` w całym kadrze, bo kamera patrzy w dół pod 52°, a pół-FOV = 25°). Punkt `X = P + λ·dir`.

### 3.4 Świat → heks (`worldToAxial`)

- Układ: **pointy-top**, `HEX_R = 1.0` (`render/hexutil.ts:24`); `x = R·√3·(q + r/2)`, `z = 1,5·R·r` (`hexutil.ts:32-36`). Pryzmy: `CylinderGeometry(·,·,h,6)` z rogiem 0 w +Z, bez obrotu (`scene.ts:1776-1778`, komentarz `:1778`). Kontur `hexShape.ts:7-14` (kąt `π/2 + i·π/3`, róg 0 w +Z) — spójne.
- Odwrotność: `rf = z/(1,5R)`, `qf = x/(√3R) − rf/2`, potem zaokrąglenie sześcienne.
- **W repo są dwie implementacje i różnią się remisem:**
  - `input/picker.ts:49-81` (**używana przy kliku**): przy `dq > ds && dq > dr` poprawia q; w przeciwnym razie przy `ds > dr` poprawia s; **w pozostałych przypadkach (także `ds == dr`) poprawia r**.
  - `render/hexutil.ts:53-71` (galeria, ustawianie tokenów): przy `dr > ds` poprawia r; **przy `dr == ds` poprawia s** (q, r bez zmian).
  - Wynik różni się tylko przy dokładnym remisie reszt `dr == ds` (zbiór miary zero, np. punkty na krawędziach i w rogach). Rust musi odtworzyć **wariant z `picker.ts`** dla kliku. Wariant z `hexutil.ts` jest potrzebny tylko tam, gdzie web go używa.
- **Zaokrąglanie:** `worldToAxial` używa `Math.round` (`picker.ts:61-63`, `hexutil.ts:59-61`). Semantyka JS: najbliższa liczba całkowita, **dokładna połówka w stronę +∞** (`Math.round(−0,5) = −0`, `Math.round(−1,5) = −1`). Rust `f64::round` zaokrągla dokładną połówkę **od zera** (`−0,5 → −1`, `−1,5 → −2`). Obie funkcje różnią się **wyłącznie na dokładnych połówkach ujemnych** (`x = k + 0,5`, `k < 0`); poza nimi wynik jest identyczny. To zbiór miary zero — realne ryzyko tylko tam, gdzie reszta cube-round wypada dokładnie na połówce (testy jednostkowe, klik dokładnie w krawędź poza mapą). r1 przesadził z zakresem.
  - **Recepta r1 `(x + 0.5).floor()` była błędna:** dla `x = 0,49999999999999994` suma `x + 0,5` zaokrągla się w IEEE do `1,0` → wynik 1, a `Math.round` daje 0; podobnie `x = 4503599627370497` (wynik o 1 za duży).
  - **Recepta poprawna:** `let f = x.floor(); if x - f >= 0.5 { f + 1.0 } else { f }` (różnica `x − floor(x)` jest dokładna w IEEE 754 dla każdego skończonego `x`). Jedyna różnica względem `Math.round` to znak zera (`−0` vs `+0`), bez znaczenia po rzutowaniu na `i32`.
  - **Dowód (emulacja w IEEE 754 double, `node -e`, ta sesja):** `0.49999999999999994` → `Math.round=0`, `floor(x+.5)=1`, recepta `0`; `-0.5` → `0 / 0 / 0`, emulowane `f64::round` `−1`; `-2.5` → `−2 / −2 / −2`, emulowane `f64::round` `−3`; `4503599627370497` → `Math.round=…497`, `floor(x+.5)=…498`, recepta `…497`; 2 mln losowych wartości o module 2^−5..2^55 oraz wszystkie `k/2 ± 1e−16` dla `k ∈ [−2000, 2000]` → **0 rozbieżności** recepty z `Math.round`. Uruchomienia w Rust brak (zakaz buildu) — potwierdzić testem jednostkowym w RR-T3 na tych samych wektorach.
- Klucze: `"${q},${r}"` (`picker.ts:260-262`).

### 3.5 Co raycast webu faktycznie trafia

`picker.ts:175-250` + `scene.ts`:

1. **Lista celów** `terrainPickMeshes = [...instancedMeshes, ...goraInst, ...wzgorzeInst]` (`scene.ts:3684`): pryzmy bazowe wszystkich typów terenu (InstancedMesh) oraz instancjonowane bryły gór i wzgórz. Bryły są rejestrowane w `terrainPickKeys` (`scene.ts:2717-2727`; komentarz: klik w wizualny szczyt nie może trafiać w sąsiada). Lasów, dekoracji, rzek, miast i ulepszeń **nie ma** na liście.
2. **Pryzm:** `hexPrismNoBottomGeo(hexR, vis.height)` — boki + górna pokrywa, bez dna (`scene.ts:1563-1575`). Promień `hexR = 1,008·R` w stylu `roblox` (`scene.ts:1774`), czyli **sąsiednie pryzmy nachodzą na siebie o 0,8%**. Wierzch: `surfaceTopY = vis.height + vis.yOffset − coastalDrop` (`scene.ts:2250-2256`); `coastalDrop = 0,045R` dla lądu z plażą (`landCoastSandNeeded`, styl roblox). Woda w roblox (**każda**: `Morze` i `PlytkieMorze`, bo `isDryLandTeren` w `scene.ts:578-580` zwraca `false` dla obu): środek `seaSurfaceY − h/2` (`scene.ts:2257-2261`), więc wierzch = `seaSurfaceY` = wierzch `Morze` = **0,18** (`scene.ts:2088-2089`).
3. **Wysokości wierzchu** (styl gry = `roblox`, `render/mapRenderStyle.ts:40`; `terrainVisualForStyle` `:226-242`; stałe `:164-194`): `SEA_SURFACE_TOP_Y = 0,18`; `WYBRZEZE_SURFACE_TOP_Y = 0,22` — **ale to NIE jest wierzch rysowanego i trafianego pryzmu `PlytkieMorze`** (ten leży na 0,18, pkt 2); 0,22 trafia tylko do `topYAt` ścieżki awaryjnej (`units.ts:214-217` → `terrainVisualForStyle`, `mapRenderStyle.ts:231-235`); `FLAT_LAND_SURFACE_Y = 0,18 + 0,28 = 0,46` (Łąka/Równina/Pustynia/Polarny), Wzgórza `= 0,46 + 0,18 = 0,64`, Góry `= 0,46 + 0,32 = 0,78`. Bryły gór/wzgórz wystają **ponad** te wierzchy (`scene.ts:2414-2450`, `topY + peakH/2`); ich kształt zależy od wariantu i seeda (`wariantDlaHeksa`).
4. **Kolejność decyzji** w `pixelToHex`:
   - trafienia posortowane po odległości (Three.js `intersectObjects`); pomija `visible === false` (`picker.ts:203`);
   - trafienie w instancję z kluczem: jeśli normalna świata `n.y > 0,5` (powierzchnia „od góry”) → **ten heks** (`:211-212`). W przeciwnym razie (bok pryzmu/bryły) heks jest przyjmowany tylko wtedy, gdy `worldToAxial(punkt) == heks instancji` (`:215-216`). Inaczej zapamiętywany jako `sideResolvedFallback` (pierwszy taki) i pętla idzie dalej (`:217-218`);
   - trafienie **bez rozwiązanej instancji** (obiekt nie jest `InstancedMesh`, brak `instanceId` albo `resolveTerrainInstance` zwraca `null`): jeśli `worldUpNormal(h) > 0,5` → **natychmiast** `worldToAxial(h.point)` (`:221-223`), bez czekania na `sideResolvedFallback`; inaczej pętla idzie dalej (gałąź pominięta w r1);
   - po pętli: `sideResolvedFallback` (`:225`), potem pierwsze widoczne trafienie → `worldToAxial(punkt)` (`:226-229`);
   - **awaria** (brak trafień): płaszczyzna `y = 0` → `coarse` (`:232-238`), potem korekta: `topY = unitRenderer.topYAt(coarse)` (`units.ts:6409-6412` → `terrainTopY` `units.ts:214-217`); jeśli `topY > 0`, druga płaszczyzna `y = topY` → wynik (`:239-248`).
5. **Mgła:** heksy nieznane (`!visible && !explored`, `scene.ts:3529`) mają macierz instancji zerową (`ZERO_MATRIX`, `scene.ts:3139`), więc **nie da się ich trafić**. Klik w czarny obszar zawsze idzie ścieżką awaryjną (4). Heksy „explored” są tylko przyciemnione kolorem (`render/fogDim.ts:29-43`, `FOG_EXPLORED_BRIGHTNESS = 0,175`, `game/visibility.ts:31`) i można je trafić.
6. **Sfera otaczająca:** liczona raz po budowie sceny (`picker.ts:146-150`, wywołanie `scene.ts:3691`). Opis błędu, który naprawia: `picker.ts:127-141`. W Rust: odpowiednik to „pełne AABB mapy”, bez leniwego cache.
7. **Jednostki mają pierwszeństwo** (`main.ts:1894-1901`): raycast rekursywny we wszystkie widoczne tokeny (`units.ts:5880-5891`), dowolny mesh z `userData.unitId` w łańcuchu rodziców. Model jednostki wystający nad sąsiedni heks daje więc **heks jednostki**.

### 3.6 Czy płaszczyzna `Y = const` daje identyczne wyniki? — **Nie.**

| Sytuacja | Web | Sama płaszczyzna `y = h` | Zgodne? |
|---|---|---|---|
| Płaski teren, wszystkie sąsiednie wierzchy na tej samej wysokości, klik w środek heksa | wierzch pryzmu → `worldToAxial` | `worldToAxial(X(h))` | **Tak**, jeśli `h` = faktyczny wierzch |
| Krawędź wyższego heksa przed niższym (patrząc od kamery) | trafia **bok** wyższego pryzmu → reguła `fromPoint == instancja` (zwykle wyższy heks) | płaszczyzna jednego `h` → inny heks | **Nie** |
| Wzgórze / góra (bryła ponad wierzchem) | trafia bryłę → heks wzgórza/góry, także gdy piksel wizualnie „wisi” nad sąsiadem | płaszczyzna nie widzi bryły | **Nie** |
| Pas 0,8% nakładania pryzmów (`1,008R`) | przy równych wysokościach dwie współpłaszczyznowe pokrywy w tej samej odległości → wynik zależy od kolejności sortowania trafień (meshe po typie terenu) | czysty `worldToAxial` | **Może się różnić** na pasku szerokości ~0,008R przy krawędzi |
| Heks pod mgłą (ukryty) | `y = 0` → `coarse` → `y = topYAt(coarse)` (`terrainTopY` **bez** `coastalDrop`; dla wody `TERRAIN_SURFACE_Y`) | zależy od `h` | Zgodne tylko przy odtworzeniu tej samej dwustopniowej procedury |
| Ląd z plażą (`coastalDrop`) | wierzch pryzmu 0,045 niżej niż `topYAt` | — | Ścieżka trafienia i ścieżka awaryjna różnią się wysokością o 0,045 |
| `PlytkieMorze` (Wybrzeże) | wierzch pryzmu 0,18 (`scene.ts:2257-2261`), a `topYAt` = 0,22 (`units.ts:214-217`) | — | **Drugi rozjazd, o 0,04**, między ścieżką trafienia a awaryjną (dopisany w r2) |
| Jednostka stojąca na heksie, model zachodzi na sąsiada | **heks jednostki** | heks terenu | **Nie** |
| Kursor nad panelem HTML | `isPointOverCityPanelUi` → brak kliku (`main.ts:26362`) | — | Musi to zrobić warstwa UI (webview), nie renderer |

**Wniosek:** zgodność 1:1 wymaga, żeby picking w Rust testował **tę samą geometrię, którą rysuje** (pryzmy z bokami, bryły gór i wzgórz, modele jednostek) i miał tę samą kolejność reguł. Dwie metody do wyboru (`D-RR-3`):
- **(P1) CPU, analitycznie:** promień kontra pryzmy heksów (trawersowanie siatki heksów wzdłuż promienia, test pokrywy na `surfaceTopY` i 6 boków) + trójkąty brył gór i wzgórz (te same dane CPU, z których budujemy bufor GPU) + bryły jednostek (AABB albo trójkąty). Deterministyczne, testowalne bez GPU (`cargo test`), identyczne na każdej maszynie.
- **(P2) GPU, bufor ID:** render instancji do tekstury `R32Uint`, odczyt piksela pod kursorem. „Co widzisz, to trafiasz” z definicji, ale wymaga GPU w testach, a reguła `n.y > 0,5` / `fromPoint` dla boków nie odtworzy się sama.
- **Rekomendacja:** P1 dla terenu (zgodność reguł z `picker.ts` i testy bez GPU) + P1 z bryłami dla jednostek. P2 tylko diagnostycznie.
- **Osobna decyzja:** czy odtwarzamy dziwactwa webu 1:1 (remis `dr == ds`, różnica 0,045 przy plaży i 0,04 przy `PlytkieMorze` między ścieżkami, kolejność przy nakładaniu 1,008R), czy je „poprawiamy”. Zgodnie z zasadą 1:1 rekomenduję odtworzenie, a poprawki jako osobne zgłoszenia — decyzja właściciela.

### 3.7 Przypadki brzegowe (lista do testów)

1. Środek każdego typu terenu (8 typów `TerenBazowy`).
2. Krawędź płaska–płaska (ten sam typ), punkt w odległości 0,001R od krawędzi z obu stron.
3. Krawędź niski–wysoki: morze→ląd, ląd→wzgórze, wzgórze→góra; klik w bok wyższego pryzmu.
4. Róg trzech heksów (remis cube-round, w tym dokładny `dr == ds`).
5. Szczyt bryły góry/wzgórza zachodzący na sąsiada „za” nim.
6. Heks nieznany (mgła) obok znanego; heks `explored`.
7. Ląd z plażą (`coastalDrop`), woda `PlytkieMorze` i `Morze` (obie z wierzchem pryzmu 0,18; dla `PlytkieMorze` ścieżka awaryjna używa 0,22 — testować obie ścieżki).
8. Jednostka na mieście (podbicie tokenu, `units.ts:5930-5935`) i na wzgórzu/górze (`unitTerrainRelief`, `units.ts:219-224`).
9. Jednostka zaokrętowana (łódź, `units.ts:6055-6056`).
10. Klik poza mapą (ujemne `q`/`r`, półwartości → test `Math.round`).
11. Skrajne zoomy `d = 8/3` i `d = maxDist`; skrajne krawędzie kadru (`nx, ny = ±1`).
12. Próg klik/drag: przesunięcie 5,9 px vs 6,0 px (`DRAG_THRESHOLD_PX`, warunek `≥`); tryb stawiania ignoruje próg (`main.ts:26349-26350`).
13. LOD: dekoracje ukryte (`visible = false`) nie mogą łapać kliknięć (`picker.ts:197-203`).
14. Prawy klik — bez pickingu (`main.ts:26209-26221`).

### 3.8 Weryfikacja zgodności

- **Złoty zestaw z webu:** dla stałego seeda i rozmiaru mapy, kilku stanów kamery (`T`, `d`, rozmiar viewportu) i siatki punktów ekranowych (np. 64×36 + punkty z §3.7) zapisać wynik `pickMapTarget` z webu do JSON. Wymaga **uruchomienia weba** (harness Playwright z P1.9) — w tym temacie zakazane, więc to zadanie dla `RR-T3`. Zakres zgody na uruchomienie weba — decyzja orkiestratora.
- **Test Rust:** ten sam JSON → `assert_eq!` dla każdego punktu. Dodatkowo testy jednostkowe czystej matematyki (`worldToAxial` z remisami i połówkami, `clientRectToNdc`, baza kamery) — możliwe bez GPU i bez weba (wartości oczekiwane liczone ręcznie wg §3.2–3.4).
- **Kryterium:** 100% zgodności na złotym zestawie (picking jest dyskretny — tolerancja 0). Rozbieżność = finding.

### 3.9 Pętla klatek, animacje i wejście ciągłe — właściciel w Rust (dopisane w r2, zarzut 8)

**Fakty z webu:**
- **Pętla klatek:** `main.ts:36248-36249` `renderLoop()` → `requestAnimationFrame(renderLoop)`; `dt` z `performance.now()`, przycięte do 100 ms (komentarz `:36250`); start `startRenderLoop` `:36240-36245`.
- **Animacja ruchu jednostek:** obiekt `anim` budowany przy ruchu (`main.ts:25485-25499`: `points` z `unitRenderer.getTokenPlacement`, `seg`, `t`, `isAnimating = true`), postęp co klatkę `anim.t += dt / ANIM_SEG_DUR` i przejście segmentów (`main.ts:36267-36270`).
- **Kamera ciągła:** `camCtrl.update()` w pętli klatek (`main.ts:36472`, warunek `!isBattleSceneOpen()`; komentarz `:36463-36469`: to jedyne miejsce, gdzie WASD/edge-pan ruszają kamerę mapy) oraz `main.ts:39332`. `CameraController.update()` `camera.ts:275-289`; edge-pan `:251-272`; pozycja kursora pamiętana zawsze (`camera.ts:176`).
- **Nasłuchiwacze kamery:** `camera.ts:225-234` — `mousedown`/`wheel` na canvasie, `mousemove`/`mouseup`/`keydown`/`keyup`/`blur` na `window`, `mouseleave` na `document`.
- **Hover z pickingiem:** `main.ts:26230` `mousemove` na canvasie → `pickVeteranBadgeUnitIdAt` (`:26235`) i `pickStatChipCityIdAt` (`:26253`) — raycast **przy każdym ruchu myszy**.

**Konsekwencja dla opcji (a):** webview leży na wierzchu, więc wszystkie zdarzenia ciągłe (`mousemove`, `wheel`, `keydown/keyup`, `blur`) trafiają najpierw do JS. Bez decyzji o właścicielu pętla klatek, animacje, kamera i hover zostałyby „pomiędzy” warstwami.

**Wymagania (propozycja):**
1. **Właścicielem pętli klatek jest Rust** (wątek renderu, `dt` z zegara monotonicznego, ten sam limit 100 ms). Animacje ruchu (`anim`), kamera (`CameraController` z §3.2, WASD, edge-pan, zoom) i interpolacje żyją w Rust. JS nie wywołuje `requestAnimationFrame` dla mapy.
2. **Kanał wejścia:** JS przekazuje surowe zdarzenia (`pointermove`/`down`/`up`, `wheel`, `keydown/keyup`, `blur`, rozmiar viewportu, DPR) do Rust; stan klawiszy i pozycję kursora (edge-pan) trzyma Rust. Koalescencja `mousemove` do jednego zdarzenia na klatkę.
3. **Opóźnienie IPC:** `invoke`/zdarzenia Tauri przechodzą przez serializację JSON; dla `mousemove` co klatkę to ryzyko lagu kamery i hovera — **NIE_ZMIERZONO** (pomiar w RR-T1: opóźnienie wejście→klatka, cel do ustalenia w D-RR-10). Alternatywa: natywne zdarzenia okna (tao) dla obszaru mapy przy odwróconych warstwach (§2.3) — NIE_ZMIERZONO.
4. **Hover-picking** (gwiazdki weterana, pigułki miast, „ostatnio najechany heks” dla skrótu B, P4-0 l.134) liczony w Rust tą samą procedurą co §3.5, wynik wysyłany do UI jako zdarzenie tylko przy zmianie.
5. **DTO widoku (§4.3)** i animacje: Rust renderer konsumuje zmiany stanu z `civ-engine` (`engine_state_changed`, `src-tauri/src/lib.rs:42-45`) i sam animuje przejścia; nie czeka na JS.

→ `D-RR-10` (właściciel pętli i kanał wejścia) oraz tematy `RR-T12`, `RR-T13` w §8.

---

## 4. Potok modeli (pytanie 4 — architektura; katalog to P4.4)

### 4.1 Jak web buduje modele (fakty)

Liczby z `git archive edb8fb56 gra/src` + `grep -rhoE … | wc -l` (wystąpienia w kodzie, nie liczba obiektów w runtime):

| Element | `render/**` | `battle/ ui/ wonderpreview/ input/ main.ts` |
|---|---:|---:|
| `new THREE.*Geometry(` | 2 080 (69 plików) | 102 (5 plików) |
| `new THREE.*Material(` | 116 (73) | 60 (5) |
| `new THREE.CanvasTexture(` | 14 (9) | 2 (2) |
| `new THREE.Mesh(` | 2 394 (68) | 89 (4) |
| `new THREE.InstancedMesh(` | 20 (2) | 13 (2) |
| `new THREE.Sprite(` | 10 (7) | 2 (2) |
| `document.createElement('canvas')` | 16 (9) | 11 (8) |
| `new THREE.WebGLRenderer(` | 1 | 5 |

Rozkład konstruktorów (`render/` + `battle/`, `sort | uniq -c`): `BoxGeometry` 1 494, `CylinderGeometry` 397, `ConeGeometry` 121, `BufferGeometry` 51, `SphereGeometry` 26, `IcosahedronGeometry` 19, `TorusGeometry` 17, `PlaneGeometry` 16, `CircleGeometry` 14, `RingGeometry` 9, `DodecahedronGeometry` 7, `ExtrudeGeometry` 3, `ShapeGeometry` 2, `OctahedronGeometry` 2, `TubeGeometry` 1. Materiały: `MeshLambertMaterial` 70, `MeshStandardMaterial` 46, `MeshBasicMaterial` 39, `SpriteMaterial` 11, `LineBasicMaterial` 5, `LineDashedMaterial` 1. Światła: `DirectionalLight` 6, `AmbientLight` 3, `HemisphereLight` 2. `ShaderMaterial`/`onBeforeCompile` w `render/`: 0 trafień.

Mechanizmy:
- **Prymitywy + grupy:** modele to `THREE.Group` z wieloma `Mesh(prymityw, materiał)` (np. `render/miasto-braz.ts:113,127,140`; `render/improvements.ts:53-56`).
- **Singletony geometrii modułu:** modele jednostek trzymają geometrie we wspólnych leniwych zmiennych `x ||= new BoxGeometry(...)` (np. `render/jednostki-p4-melee.ts:172-176`; nagłówek `:14-15` „geometrie wspólne = singletony modułu (perTokenGeos puste)”). Materiały są per token (`group.userData['mats']`).
- **Scalanie:** `mergeGeometries` (`BufferGeometryUtils`), 2 miejsca w `render/`; `collapseToMergedMesh` dla ciężkich grup dekoracji (`render/mergeDecor.ts:105-120`, `main.ts:2822-2825`).
- **Instancing:** teren i dekoracje jako `InstancedMesh` (`scene.ts`), ukrywanie przez `ZERO_MATRIX` (`scene.ts:3139`), kolor per instancja (`instanceColor`, `scene.ts:1851`, `:2702`, `:2774`).
- **Mgła wojny = kolor:** mnożenie `material.color` przez jasność (`fogDim.ts:29-43`). Mutuje **materiał**, więc współdzielony materiał przyciemniłby wszystkich użytkowników. Web temu zapobiega materiałami per token.
- **Mgła odległości:** `THREE.Fog`/`FogExp2` (`scene.ts:1658`, `:1662`, `:3070`).
- **Oświetlenie i wyjście:** `ACESFilmicToneMapping`, ekspozycja 1,05 **tylko dla stylu `civ`** (`scene.ts:1638-1641`, `if (renderStyle === 'civ')`); dla stylu gry `roblox` kod nie ustawia `toneMapping`, więc obowiązuje domyślny Three r169 (`NoToneMapping` `[zewn., niezweryfikowane — wartość domyślna r169]`) → wymóg 1:1 dla mapy gry = **brak tone mappingu**; cienie `PCFSoftShadowMap` „na żądanie” (`scene.ts:1642-1652`); `setPixelRatio(min(dpr, preset.pixelRatioMax))` (`scene.ts:1626`, `:3239`); antyaliasing z presetu (`scene.ts:1624`).
- **Tekstury z canvasu:** plakietki miast, tabliczki statystyk, emblematy właściciela, gwiazdki, znaczniki oblężeń, ikony robotników (`cities.ts:718`, `cityMapStatChip.ts:1076`, `unitStatPlate.ts:437,573,618`, `unitOwnerEmblem.ts:349`, `unitUpgradeBadges.ts:324`, `units.ts:6298,6356,6386,6598`, `workerFieldOverlay.ts:56-107`). Tekst rysuje `CanvasRenderingContext2D` przeglądarki (fonty przeglądarki).
- **LOD zoomu:** `zoomLod.ts`, `scene.ts:3518-3519`.
- **Style:** w grze zawsze `GAME_MAP_RENDER_STYLE = 'roblox'` (`mapRenderStyle.ts:40`; przekazywane w `main.ts:1776`, `:1789`). Gałęzie `civ`/`minecraft` są osiągalne tylko z innych wejść (podglądy) — zakres to `D-RR-8`.

### 4.2 Odpowiednik w Rust (wgpu) — warstwy do napisania

| Warstwa Rust | Odpowiada w webie | Uwaga 1:1 |
|---|---|---|
| `geom` — builder prymitywów: Box, Cylinder (z grupami i opcją „bez dna”), Cone, Sphere, Icosa, Torus, Plane, Circle, Ring, Dodeca, Octa, Extrude/Shape, Tube | `THREE.*Geometry` r169 | **Ta sama kolejność wierzchołków, normalne, segmenty i UV.** Wymóg dla `flatShading` i pickingu. Do odtworzenia z kodu Three.js 0.169 (`gra/node_modules` nie jest w repo; źródło Three.js — **NIE_ZMIERZONO**, gdzie je wziąć offline) |
| `merge` — scalanie geometrii do jednego bufora | `mergeGeometries`, `collapseToMergedMesh` | |
| `mesh/instancing` — bufory instancji (macierz + kolor), ukrywanie przez flagę lub skalę 0 | `InstancedMesh`, `ZERO_MATRIX` | W Rust lepiej kompaktować listę widocznych niż wysyłać macierze zerowe — wynik musi być ten sam |
| `material` — Lambert, Standard (PBR Three), Basic, Sprite, Line; `flatShading`, `transparent`, `depthWrite`, `side` | materiały Three | **Shadery WGSL wiernie odtwarzające `meshlambert`/`meshphysical` r169**, z mgłą i przestrzenią sRGB; **bez tone mappingu dla stylu `roblox`**; ACES tylko, jeśli D-RR-8 obejmie styl `civ` |
| `tint` — mnożnik koloru per instancja/obiekt (mgła wojny) | `fogDim.ts` | W Rust **uniform per obiekt**, nie mutacja współdzielonego materiału |
| `shadow` — mapa cieni z aktualizacją na żądanie | `PCFSoftShadowMap`, `autoUpdate=false` | Filtr PCF-soft Three.js do odtworzenia 1:1 |
| `text/sprite` — rasteryzacja tekstu do atlasu + billboardy | `CanvasTexture` + `Sprite` | **Największe ryzyko 1:1**: inne fonty i hinting niż w przeglądarce → `D-RR-4` |
| `scene` — drzewo transformacji (grupy, rodzice), widoczność | `Object3D`/`Group` | ECS niepotrzebny |
| `camera` — §3.2 | `CameraController` | |
| `pick` — §3 | `picker.ts`, `pickUnitIdAt` | |
| `assets` — rejestr współdzielonych zasobów GPU z licznikiem odwołań | brak (ręczne `dispose`) | Wymóg z §7.3 |

**Wspólna biblioteka:** `geom` + `material` + `text/sprite` są wspólne dla mapy, bitwy (`battle/battleScene.ts` używa `buildUnitModel` z `render/units`, `battleScene.ts:104`), podglądu cudów i miniatur. To powinien być **jeden crate renderera** z wieloma „scenami” i jednym urządzeniem GPU, a nie 5 osobnych rendererów jak w webie (5× `new THREE.WebGLRenderer` poza `render/`).

### 4.3 Dane wejściowe renderera

Renderer czyta wyłącznie model widoku (DTO) wyliczany z `GameState` w Rust (P2-2 §1 pkt 1: stan gry bez stanu renderu). Dziś `PositionDto` ma pola `x: u16, y: u16` (`rust-port/engine/src/domain/types.rs:119-122`, `f7aa0997`), a pathfinding używa osiowych `q,r` (`domain/pathfinding.rs:15`). Mapowanie `PositionDto(x,y) ↔ (q,r)` webu — **NIE_ZMIERZONO**. Do ustalenia, zanim picking odda wynik do silnika (zależność P2/P3).

---

## 5. Testy 1:1 (pytanie 5)

### 5.1 Strategia

1. **Referencja:** zrzuty z weba `edb8fb56` w Chromium (harness P1.9) przy stałym: seedzie, rozmiarze mapy, presecie jakości (`renderQuality`, `mapDetailQuality`, `main.ts:1786-1792`), rozmiarze viewportu, `devicePixelRatio = 1`, stanie kamery (`T`, `d`), stanie mgły i turze (zapis gry jako fixture). Zrzuty zamrożone jako artefakt testowy.
2. **Rust:** render offscreen (tekstura → PNG) przy tych samych parametrach.
3. **Porównanie:** metryki per scena, np. odsetek pikseli z ΔE > próg, SSIM, maska regionów (teren / modele / tekst). **Tolerancje to decyzja (`D-RR-6`)**: AA, filtr cieni i rasteryzacja tekstu różnią się między sterownikami. Proponuję dwa progi: „geometria” (tekst zamaskowany) ostrzej, „tekst” łagodniej.
4. **Testy deterministyczne bez GPU:** geometria builderów vs dane referencyjne Three.js (liczba wierzchołków, pozycje, normalne, indeksy — porównanie liczbowe); picking (§3.8); matematyka kamery; macierze instancji dla ustalonej mapy.
5. **Test sceny w webview (złożenie a):** czy HUD leży poprawnie nad mapą — zrzut całego okna na maszynie z GPU. **NIE_ZMIERZONO**, czy da się go zautomatyzować (WebDriver dla Tauri).

### 5.2 Co jest mierzalne tu, a co nie

| Test | W tym kontenerze | Dowód |
|---|---|---|
| Testy CPU (`cargo test`: geometria, picking, kamera, DTO) | **Tak** (toolchain 1.97; zależności z sieci) | §1.1 |
| Render wgpu offscreen | **NIE_ZMIERZONO** — brak `/dev/dri`, brak ICD Vulkan (brak lavapipe), brak `libEGL` w `ldconfig -p`; Mesa `swrast`/`zink` są, ale ścieżka GLES w wgpu wymaga EGL `[zewn., niezweryfikowane]` | §1.1 |
| Zrzuty referencyjne z weba (Chromium) | wymaga uruchomienia weba — w tym temacie zakazane; P1.9 pokazał, że Playwright działa w innym temacie | P1-9 §1 |
| Tauri + WebKitGTK na Linuksie | **Nie** — brak `libwebkit2gtk` | §1.1 |
| Windows (WebView2, DX12, WARP) | **Wymaga maszyny Windows** — NIE_ZMIERZONO | — |
| Test pamięci GPU „N tur” | wymaga GPU albo software adaptera — NIE_ZMIERZONO tutaj; licznik zasobów (§7.3) mierzalny na CPU | — |

Wniosek: CI tego środowiska obsłuży testy CPU i ewentualnie software rendering (do sprawdzenia w spike'u). Porównania 1:1 obrazu wymagają maszyny docelowej z GPU (Windows — bundle `msi`/`nsis` w `tauri.conf.json`).

---

## 6. Rekomendacja i decyzje właściciela

### 6.1 Rekomendacja (nie decyzja)

- **Silnik:** wgpu bezpośrednio + własny crate renderera (`geom`/`material`/`text`/`scene`/`pick`/`assets`).
- **Osadzenie:** (a) — jedno okno, wgpu pod przezroczystym webview z HUD; najpierw spike na Windows i Linux (X11 i Wayland); plan awaryjny: odwrócone warstwy (okno-dziecko) albo (c) z jawną świadomością, że to znów renderer w webview.
- **Picking:** P1 (CPU analitycznie, ta sama geometria i kolejność reguł co `picker.ts` + jednostki pierwsze), złote dane z weba.
- **Kolejność:** spike → rdzeń (kamera + teren + mgła + picking) → biblioteka prymitywów i materiałów → modele partiami wg P4.4 → plakietki/tekst → bitwa/cuda/miniatury → twarde testy 1:1 i pamięci.

### 6.2 `D-RR-n` (do rozstrzygnięcia przez właściciela)

- **D-RR-1 — Silnik.** A: wgpu bezpośrednio (rekomendowane). B: Bevy. C: three-d. Konsekwencja: podniesienie `rust-version` w `src-tauri/Cargo.toml` z 1.77.2 do ≥ 1.87 (wgpu; lokalny `rustc 1.97.0` wystarcza) lub ≥ **1.97.1** (Bevy 0.20.0, `bevy-0.20.0/Cargo.toml:14`). **Wariant B wymaga dodatkowo aktualizacji toolchainu** środowiska i CI: lokalny `rustc 1.97.0` < 1.97.1, więc Bevy 0.20.0 się nie zbuduje (alternatywa: przypięcie starszej wersji Bevy — MSRV i API takiej wersji NIE_ZMIERZONO).
- **D-RR-2 — Osadzenie.** (a) rekomendowane po spike'u / (b) / (c) / (d) (§2.3). Dodatkowo: czy akceptujemy cechę `unstable` Tauri (`add_child`, `Window::builder`) oraz `macos-private-api` (przezroczystość na macOS)? Czy macOS jest platformą docelową (bundle ma dziś tylko `msi`, `nsis`)?
- **D-RR-3 — Picking.** P1 (CPU, rekomendowane) / P2 (GPU ID-buffer). Podpunkt: odtwarzamy dziwactwa webu 1:1 (remis `dr == ds` z `picker.ts`, różnica `coastalDrop` 0,045 oraz różnica 0,04 dla `PlytkieMorze` (0,18 vs 0,22) między ścieżką trafienia i awaryjną, kolejność przy nakładaniu `1,008R`) czy je poprawiamy?
- **D-RR-4 — Tekst i tekstury z canvasu.** A: rasteryzacja tekstu w Rust (font dołączony do gry; 1:1 z Chromium niemożliwe co do piksela). B: plakietki/tabliczki jako elementy HTML w webview, pozycjonowane z Rust przez `worldToClient` (wierne fonty, ale synchronizacja pozycji co klatkę przez IPC i ryzyko „pływania” przy panowaniu). C: hybryda (tekst statyczny w atlasie, dynamiczny w HTML). Wpływa na tolerancje `D-RR-6`.
- **D-RR-5 — Minimalny GPU / tryb awaryjny.** Web nie ma fallbacku mapy (P4-0 §1.1). Czy wymagamy trybu software (WARP na Windows, llvmpipe/lavapipe na Linuksie), czy komunikat „brak GPU”?
- **D-RR-6 — Kryterium 1:1.** Metryka i progi (ΔE/SSIM, maska tekstu), lista scen referencyjnych, kto zatwierdza wyjątki. Czy referencją jest Chromium (web dziś), czy WebView2?
- **D-RR-7 — Budżet pamięci i test „N tur”.** Wartości graniczne (np. „zasoby GPU po 200 turach AI ≤ zasoby po 10 turach + X%”) i rozmiar mapy testowej (§7.3).
- **D-RR-8 — Zakres stylów.** Port tylko stylu `roblox` (jedyny używany w grze, `mapRenderStyle.ts:40`, `main.ts:1776,1789`), czy także gałęzi `civ`/`minecraft` (osiągalne z podglądów)? Łączy się z D-REND-7.
- **D-RR-10 — Pętla klatek i wejście ciągłe (dopisane w r2).** A: Rust jest właścicielem pętli, animacji, kamery i hover-pickingu; JS przekazuje surowe zdarzenia (rekomendowane, §3.9). B: JS zostaje właścicielem `requestAnimationFrame`/kamery i co klatkę wysyła stan kamery do Rust (mniej IPC wejścia, ale logika kamery w JS — sprzeczne z „raz, a porządnie”). Próg akceptowalnego opóźnienia wejście→klatka — do ustalenia po pomiarze w RR-T1.
- **D-RR-9 — Jeden renderer, wiele scen.** Czy bitwa ręczna, podgląd cudów i miniatury korzystają z jednego urządzenia GPU i jednej biblioteki (rekomendowane), czy z osobnych okien/kontekstów (jak 5 `WebGLRenderer` w webie)?

---

## 7. Pamięć (pytanie 7 — motyw właściciela)

**Zastrzeżenie:** wszystko poniżej to analiza statyczna kodu na `edb8fb56`. Nie uruchamiałem gry ani profilera. „Wyciek” oznacza: kod tworzy zasób i w pokazanej **ścieżce kodu** go nie zwalnia (brak `dispose()` albo brak usunięcia z cache). **To nie jest dowód retencji pamięci GPU:** że bufor lub tekstura bez `dispose()` zostaje w GPU, wynika z wnętrza Three r169 (zwalnianie zasobu WebGL na zdarzenie `dispose`) — źródła Three nie ma w repo, więc to `[zewn., niezweryfikowane]`, wsparte tylko tezą projektu z `mergeDecor.ts:146-150`. Dowiedzione na poziomie JS: **M2** (`statTexCache` — `Map` trzyma referencje do `CanvasTexture`, więc nawet GC JS ich nie zbierze) i **M3** (nasłuchiwacze na `document`/`window` trzymają domknięcia z `this`). M1, M4, M5: dowód ścieżki kodu; retencja GPU — NIE_ZMIERZONO. **Czy to on powoduje niegrywalność po kolejnych turach — NIE_ZMIERZONO.**

### 7.1 Ustalenia z dowodami

**Kontekst historyczny w repo:** web sam badał spowolnienie po ~60 turach. `main.ts:1803-1816` (flaga `?perfDebug=1`), `main.ts:35864-35872` (liczniki `renderer.info.memory.geometries/textures` na starcie tury), `main.ts:14088-14100` (naprawiony wyciek geometrii i materiału ulepszeń przy przebudowie heksa), `render/mergeDecor.ts:146-150`: „sam wyciek jest architektonicznie pewny (bez dispose() gl.deleteBuffer nigdy nie leci, a GC JS buforów GPU nie zwalnia) … że TŁUMACZY spowolnienie … jest HIPOTEZĄ”. Projekt sam więc przyjmuje zasadę: bez `dispose()` bufor GPU nie jest zwalniany.

| # | Ustalenie | Dowód | Zależność od tury |
|---|---|---|---|
| M1 | **Model miasta przebudowywany przy każdej zmianie populacji bez zwolnienia geometrii i materiałów.** `visualKey = style|era|civ|level|wallKind`. `level = population` (1–10). Zmiana klucza → `scene.remove(grp)` + `_disposeModel` + nowy model. `_disposeModel` zwalnia tylko `userData['mats']` i `userData['perCityGeos']`. Builderzy używani w grze (`buildMiastoBraz`, `buildMiastoKamien`) tworzą świeże `BoxGeometry`/`CylinderGeometry`/`ConeGeometry`/`CircleGeometry` i `MeshLambertMaterial` przy każdym wywołaniu i **nie ustawiają** żadnego z tych kluczy. `perCityGeos` ustawia tylko prosty model zapasowy | `render/cities.ts:474-481` (`level`, `visualKey`); `main.ts:2600-2603` (`getLevel` = populacja); `cities.ts:504-511` (usunięcie + `_disposeModel`); `cities.ts:516` (przebudowa); `cities.ts:229-248` (roblox → `buildMiastoBraz`/`buildMiastoKamien`); `cities.ts:934-946` (`_registerModel`/`_disposeModel`); `cities.ts:216` (jedyne `perCityGeos`); `miasto-braz.ts:104,113,127,140,225,367-383` i `miasto-kamien.ts:94,103,117,130,190,460-477` (konstrukcje per wywołanie); `grep "userData\['mats'\]\|perCityGeos"` w `miasto-braz.ts`/`miasto-kamien.ts` → 0 | **Tak**: każda zmiana populacji (1–10), ery, murów. Liczba: miasta × zmiany. Rozmiar w bajtach — NIE_ZMIERZONO |
| M2 | **Cache tekstur plakietek miast rośnie z turą.** Klucz zawiera nazwę, populację, budynek/jednostkę w produkcji, etykietę wzrostu %, ostrzeżenie surowców, hover, erę, stolicę i LOD. Każda zmiana tekstu = nowa `CanvasTexture` w cache. Stare wpisy są usuwane **tylko** przy zmianie poziomu LOD (usuwa wpisy innego LOD) i przy `dispose()` całego renderera miast. Przy stałym zoomie stare tekstury zostają do końca sesji | `cityMapStatChip.ts:960-1012` (`cityMapBadgeKey`); `:1068-1080` (nowa tekstura przy braku klucza); `:1034-1048` (czyszczenie tylko innego LOD); `cities.ts:415` (`statTexCache`); `cities.ts:575` i `:697` (jedyne wywołania czyszczenia); `cities.ts:750-761` (komentarz: tekstura nie jest zwalniana przy zdjęciu plakietki) | **Tak**: wzrost % i produkcja zmieniają się co turę |
| M3 | **Nasłuchiwacze bitwy nigdy nie są zdejmowane.** `document.addEventListener('click', this._deployToolbarDocClick)` i `window.addEventListener('resize', this._deployLayoutListener)`. Oba domknięcia trzymają `this` (`BattleScene`). `grep removeEventListener` dla tych pól → 0. `BattleScene` powstaje przy każdej bitwie | `battle/battleScene.ts:11919-11929`, `:13258-13263`, `:13513-13524`, `:18102-18107`; brak `remove…` (porównanie `comm` add/remove w `battle/`); `new BattleScene(` w `main.ts` — **5 miejsc** (r1 podał 3): `:27514`, `:28160`, `:29884` (fabryka `createBattleScene`), `:30250`, `:30384` (`grep -n "new BattleScene(" main.ts`) | **Tak**: każda bitwa ręczna. Czy `dispose()` sceny (`battleScene.ts:3657`) zeruje referencje do grafu (czyli ile pamięci JS zostaje) — NIE_ZMIERZONO |
| M4 | **Nakładki surowców:** przy usuwaniu zwalniane są tylko grupy po `collapseToMergedMesh` (≥ 7 meshy). Mniejsze grupy są zdejmowane ze sceny bez `dispose`. Celowo — dzieci mogą być współdzielonymi singletonami | `main.ts:2826-2840` (`clearResourceOverlays`), `:2843-2852`; `mergeDecor.ts:10-11`, `:154-175` | Częściowo (przebudowa przy zakładaniu miasta). Czy małe grupy mają geometrie per wywołanie (wtedy wyciek GPU) — NIE_ZMIERZONO per builder |
| M5 | **`collapseToMergedMesh` usuwa dzieci bez `dispose`.** Jeśli grupa nigdy nie była renderowana, bufory GPU nie powstały (ryzyko tylko w JS). Jeśli była — wyciek | `mergeDecor.ts:105-120` | Zależy od ścieżki — NIE_ZMIERZONO |
| M6 | **24 z 32 eksportowanych funkcji `dispose*` w `render/` nie ma żadnego wywołania** (np. `disposeBrazKonnicaOpus5Geometries`, `disposeUnitStatPlateResources`, `disposeWorkerFieldSpriteCache`, `disposeRiverBuckets`). Singletony modułów nie są więc zwalniane nawet przy nowej grze | `grep -hoE "^export function dispose…" render/*.ts` → 32; wywołania `fn(` poza definicją i komentarzami → 0 dla 24 funkcji (lista w metodzie §9) | **Nie** (zbiory ograniczone liczbą typów), ale nie spadają po „nowej grze” |
| M7 | **Mgła mutuje kolor materiału** (`material.color`), z zapamiętaniem bazy w `userData.fogBaseColor` | `fogDim.ts:29-43` | Nie jest wyciekiem; to pułapka poprawności dla współdzielonych materiałów (§4.1) |

**Sprawdzone i ograniczone (bez dowodu wycieku):**
- Tokeny jednostek: przy zmianie wyglądu `scene.remove` + `_disposeToken` (materiały i `perTokenGeos`). Geometrie to singletony modułu (`units.ts:6058-6072`, `:6758-6779`; `jednostki-p4-melee.ts:14-15`, `:172-176`). Czy **wszystkie** buildery rejestrują swoje materiały w `userData['mats']` — NIE_ZMIERZONO (P4.4).
- Podświetlenia heksów: materiał zwalniany, geometria wspólna (`units.ts:6420-6461`).
- Miniatury jednostek: jeden `WebGLRenderer` modułu + cache canvasów `nazwa:kolor` (`ui/unitMiniPreview.ts:24-58`, `:77-81`) — ograniczony liczbą typów × kolorów.
- Cache'e materiałów tabliczek (`unitStatPlate.ts:474-500`, `:543-546`) i ikon robotników (`workerFieldOverlay.ts:56-61`) — klucze ograniczone (pasma HP, właściciele).
- Logi zdarzeń w `main.ts` przycinane (`warEventLog.length = 8`, `main.ts:8767`; pozostałe logi mają operacje przycinania: `splice/length/shift` ≥ 3 na log).
- `CameraController` jest zwalniany przed odtworzeniem (`main.ts:37030`, `:37144`, `:37494`, `:37743`, `:37967`).

**Liczniki globalne** (`render/**`; `dispose()` nie paruje się 1:1 z `new`, liczby tylko orientacyjne): `new …Geometry(` 2 080 vs `.dispose()` 214 (35 plików). `scene.add(` 45 vs `scene.remove(` 16. Nasłuchiwacze: `render/` 4 add / 3 remove; `ui/` na `window|document` 27 / 18; `battle/` 26 / 22; `main.ts` 17 / 2 (jednorazowe przy starcie, `main.ts:1883`; kanwa żyje całą sesję).

### 7.2 Co z tego wynika dla Rust

Wycieki M1–M3 to klasa błędów: **ręczne `dispose()` przy każdej ścieżce usuwania, rozproszone po 88 plikach**. Przepisanie w Rust nie usuwa ich automatycznie. Rust zwolni pamięć przy `Drop`, ale cache bez polityki usuwania (M2) albo trzymanie uchwytów w strukturze sceny dalej rośnie. Wymagana jest architektura, w której wzrost jest **niemożliwy z konstrukcji** i **wykrywany testem**.

### 7.3 Wymagania dla renderera Rust

1. **Własność zasobów:** każdy bufor/tekstura/pipeline GPU ma jednego właściciela w `assets` (rejestr z kluczem treści). Obiekty sceny trzymają tylko uchwyty (indeksy z generacją). Zwolnienie = `Drop` w rejestrze po spadku licznika odwołań do 0. Żadnych „gołych” `wgpu::Buffer` poza rejestrem.
2. **Geometria współdzielona z kluczem parametrów:** builder prymitywów zwraca uchwyt z cache `(typ, parametry) → mesh`. Modele miast i jednostek to listy instancji tych samych meshy, a nie świeże bufory przy każdej przebudowie. To eliminuje klasę M1.
3. **Instancing jako domyślny tryb** dla terenu, dekoracji, jednostek, budynków. Przebudowa obiektu = zmiana danych instancji (bufor o stałej pojemności, rosnący geometrycznie, nigdy nie zwalniany w trakcie gry).
4. **Cache tekstur/tekstu z polityką:** atlas o stałym rozmiarze + LRU albo licznik odwołań. Wpis bez żywego odwołania jest zwalniany najpóźniej na końcu tury. Klasa M2.
5. **Brak domknięć trzymających sceny:** wejście z webview przez jeden kanał zdarzeń; sceny bitwy niszczone w całości (`Drop`) przy wyjściu. Klasa M3.
6. **Budżet:** jawny limit pamięci GPU per kategoria (teren, modele, tekst, cienie) i telemetria (`liczba buforów`, `bajty`, `tekstury`) dostępna w trybie debug — odpowiednik `renderer.info.memory` z `main.ts:35870`.
7. **Test regresyjny „N tur nie zwiększa pamięci”:**
   - **CPU (zawsze, w CI):** licznik zasobów w rejestrze `assets` (liczba i suma bajtów) po turze 10 i po turze N (np. 200) w symulacji z AI na stałym seedzie. Warunek: stan stacjonarny, czyli wzrost ≤ próg wynikający z realnego wzrostu gry (nowe miasta/jednostki), a po normalizacji na liczbę obiektów — 0. Bez GPU renderer pracuje na backendzie atrapie, który liczy alokacje.
   - **GPU (maszyna docelowa):** to samo + licznik pamięci adaptera, jeśli wgpu go udostępnia (**NIE_ZMIERZONO**) albo narzędzie systemowe.
   - **Test „przebudowa w miejscu”:** 1 000 cykli zmiany populacji miasta 1→10→1, zmiany produkcji, wejścia/wyjścia z bitwy → licznik zasobów wraca do wartości początkowej (dokładnie).
   - **Odpowiednik w porównaniu z webem:** zebrać `?perfDebug=1` z weba (liczniki `geometries/textures`, `main.ts:35864-35872`) na tym samym scenariuszu jako tło porównawcze. Wymaga uruchomienia weba (poza tym tematem).
8. **Wartości progów:** `D-RR-7`.

---

## 8. Tematy-kandydaci (podział implementacji)

Nazwy robocze `RR-Tn`; numer P4.x nada orkiestrator (P4-0 używa już numerów P4.6/P4.11/P4.14 w innym znaczeniu). Model dla wszystkich tematów graficznych: **Opus 5.5 medium** (decyzja właściciela, R-PROC-AUTOBOT §5a). Allowlisty są propozycją. Nowy crate np. `rust-port/renderer/**` — nazwa do decyzji.

| # | Temat | Cel | Allowlista (propozycja) | Zależy od | GPU? | Rozmiar (orientacyjnie) |
|---|---|---|---|---|---|---|
| RR-T1 | Spike osadzenia wgpu w oknie Tauri | Trójkąt + kolorowa siatka heksów pod przezroczystym webview z jednym przyciskiem HTML; kliknięcia przez przezroczysty obszar → Rust; resize/DPI; Windows + Linux X11/Wayland | `src-tauri/**` (gałąź spike), `rust-port/renderer/**` | D-RR-1, D-RR-2 | **Tak** (maszyny docelowe) | Mały kod, duża niepewność |
| RR-T2 | Rdzeń: kamera + teren (pryzmy roblox, wysokości, kolory, plaże) + mgła (ukrycie/przyciemnienie) | §3.2, §4.2 | `rust-port/renderer/**` | RR-T1 | do obrazu tak; testy CPU nie | Średni |
| RR-T3 | Picking CPU + złote dane z weba | §3.5–3.8; jednostki pierwsze | `rust-port/renderer/src/pick/**`, fixture JSON | RR-T2 (geometria), zgoda na harness web | Nie | Średni |
| RR-T4 | Biblioteka prymitywów zgodna z Three r169 + testy liczbowe | `geom`, `merge` | `rust-port/renderer/src/geom/**` | źródło Three.js 0.169 (NIE_ZMIERZONO) | Nie | Średni |
| RR-T5 | Materiały/shadery Lambert/Standard/Basic + mgła + cienie PCF; tone mapping: brak (roblox), ACES tylko przy D-RR-8 ⊇ `civ` | `material`, `shadow` | `rust-port/renderer/src/material/**`, `*.wgsl` | RR-T2 | **Tak** | Duży (wierność 1:1) |
| RR-T6 | Rejestr zasobów + budżet + test „N tur” (CPU) | §7.3 | `rust-port/renderer/src/assets/**`, testy | RR-T2 | Nie | Średni |
| RR-T7..T7n | Modele partiami wg katalogu P4.4 (jednostki, miasta, ulepszenia, dekoracje, cuda, obozy, statki) | odtworzenie 1:1 | `rust-port/renderer/src/models/<partia>/**` | RR-T4, RR-T5, P4.4 | Tak (porównanie) | **Największy**: 2 080 konstrukcji geometrii w `render/**`, ~30+ plików modeli |
| RR-T8 | Tekst/plakietki/sprite'y | wg D-RR-4 | `rust-port/renderer/src/text/**` (+ ew. UI) | D-RR-4, RR-T5 | Tak | Duży |
| RR-T9 | Nakładki: zasięg, trasy, okolica, robotnicy, oblężenia, rzeki, drogi, LOD | | `rust-port/renderer/src/overlays/**` | RR-T5 | Tak | Średni–duży |
| RR-T10 | Bitwa ręczna 3D + oblężenia + podgląd cudów + miniatury | D-REND-8 = B | `rust-port/renderer/src/{battle,preview}/**` | RR-T7, RR-T8 | Tak | Duży (`battleScene.ts` 19 493 LOC pliku) |
| RR-T11 | Harness 1:1 (referencje z weba, porównanie, maski) | §5 | `rust-port/renderer/tests/**`, artefakty | D-RR-6, RR-T2 | Tak | Średni |
| RR-T12 | Pętla klatek + animacje ruchu + kamera ciągła (WASD, edge-pan, zoom) + kanał wejścia z webview + pomiar opóźnienia IPC (dopisane w r2) | §3.9 | `rust-port/renderer/src/{frame,input,camera}/**`, `src-tauri/**` (kanał zdarzeń), frontend JS przekazujący zdarzenia | D-RR-10, RR-T1, RR-T2 | Tak (pomiar opóźnienia) | Średni |
| RR-T13 | DTO widoku (`PositionDto` ↔ `(q,r)`, §4.3) + hover-picking (gwiazdki, pigułki miast, ostatnio najechany heks) (dopisane w r2) | §3.9, §4.3 | `rust-port/renderer/src/{view,pick}/**`, ew. `rust-port/engine/**` (tylko DTO, wg P2) | RR-T3, P2-2 | Nie (CPU) | Średni |

**Kolejność:** RR-T1 → (RR-T2 ∥ RR-T4 ∥ RR-T6) → RR-T12 → RR-T3 → RR-T13 → RR-T5 → RR-T11 → RR-T7 (partie) ∥ RR-T9 → RR-T8 → RR-T10.

**Uczciwa wycena:** do odtworzenia jest ~59 tys. LOC plików `render/**` i ~23 tys. LOC plików 3D poza nim (P4-0 §4) — **razem ~83 tys. LOC jako dolna granica**, bo nie liczy części 3D i pętli renderu w `main.ts` (39 350 LOC; m.in. pętla klatek, animacje ruchu, nakładki, hover — §3.9; udział NIE_ZMIERZONO, P4-0 l.184, l.242), w tym 2 080 konstrukcji geometrii i 116 materiałów w `render/**`. Wierność shaderów Three.js i tekstu na canvasie to otwarte ryzyka. To **tygodnie, a raczej miesiące pracy, nie dni**. Liczby dni nie podaję (`NIE_ZMIERZONO`). Realną prędkość pokaże RR-T1 + RR-T2 + pierwsza partia RR-T7.

---

## 9. Metoda i lista `NIE_ZMIERZONO`

**Komendy (wybór):**
- `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 rust-port/parity-v2`; `git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
- `git show origin/rust-port/parity-v2:src-tauri/{tauri.conf.json,Cargo.toml,Cargo.lock,src/lib.rs,frontend/index.html,frontend/main.js}`.
- `git archive edb8fb56 gra/src | tar -x -C <scratch>` → `grep -rhoE "<wzorzec>" <katalog> --include=*.ts | wc -l` (liczniki §4.1, §7.1).
- `git show edb8fb56:gra/src/{input/picker.ts,render/hexutil.ts,render/hexShape.ts,render/camera.ts,render/fogDim.ts,render/scene.ts,main.ts,render/units.ts}`.
- `cargo search|info wgpu|bevy|three-d`; `ls ~/.cargo/registry/cache/*/`; `ls /dev/dri /usr/share/vulkan/icd.d`; `ldconfig -p | grep …`.
- Funkcje `dispose*` bez wywołań (M6): `disposeBraz{Konnica,LucznikNubijski,Miecznik,Procarz,RydwanKapadokijski,RydwanKonny,RydwanWoly,Taran,Wlocznik}Opus5Geometries`, `disposeHastatiOpus5Geometries`, `disposeKamien{Bazowe,Inka,Lucznicy,ZuluTaran}Opus5Geometries`, `disposeKopalnia{Cyny,Zlota}Geometrie`, `disposeRiverBuckets`, `disposeUnit{OwnerEmblem,StatPlate,UpgradeBadge,VeteranBadge}Resources`, `disposeWorkerFieldSpriteCache`, `disposeZelazo{JezdziecOszczepami,KonnicaAsyryjska}Opus5Geometries` (24).

**NIE_ZMIERZONO:**
1. Rozmiar drzewa zależności wgpu/Bevy/three-d (brak `cargo tree`).
2. Czy Bevy lub three-d mogą renderować do okna Tauri (tao) bez własnego winit.
3. ~~Zgodność `raw-window-handle`~~ — zmierzone statycznie w r2 (§2.2): wgpu 30.0.1 wymaga `^0.6.2`, Tauri ma 0.6.2 → zgodne.
4. Wykonalność opcji (a): kolejność warstw, przezroczystość, fokus, DPI na Windows/Linux X11/Wayland/macOS.
5. WebGPU/WebGL2 w WebView2 i WebKitGTK (opcja c).
6. Dostępność adaptera wgpu (software) w tym kontenerze.
7. Źródło Three.js 0.169 offline do odtworzenia builderów i shaderów (brak `node_modules` w repo).
8. Mapowanie `PositionDto(x,y)` ↔ osiowe `(q,r)` webu.
9. Złote dane pickingu z weba (wymaga uruchomienia weba).
10. Rozmiar wycieków M1–M5 w bajtach i ich udział w niegrywalności po N turach (brak profilera).
11. Czy `BattleScene.dispose()` zeruje referencje do grafu sceny (M3, pamięć JS).
12. Kompletność `userData['mats']` we wszystkich builderach jednostek (P4.4).
13. Licznik pamięci GPU dostępny z wgpu.
14. Czas realizacji w dniach/tygodniach (tylko rząd wielkości).
15. Automatyzacja zrzutów okna Tauri (WebDriver).
16. Opóźnienie IPC wejście→klatka w opcji (a) (`mousemove`/`wheel` co klatkę, §3.9).

## 10. Rejestr zmian r2 (odpowiedź na FAIL Evaluatora r1)

| Zarzut | Werdykt | Gdzie poprawione |
|---|---|---|
| 1 MSRV Bevy | PRZYJĘTY — 1.97.1 (`bevy-0.20.0/Cargo.toml:14`); 1.96.0 pochodziło z `-rc.2`; wniosek o toolchainie w D-RR-1 | §1.2, §6.2 D-RR-1 |
| 2 cache „0 trafień” | PRZYJĘTY — ujawnione pobranie 4 archiwów przez `cargo info` r1 (znaczniki czasu) | §1.1, §1.2 |
| 3 wierzch `PlytkieMorze` | PRZYJĘTY — 0,18 (`scene.ts:578-580`, `:2257-2261`, `:2089`); drugi rozjazd 0,04 z `topYAt` | §3.5, §3.6, §3.7, D-RR-3 |
| 4 `Math.round` | PRZYJĘTY — nowa recepta + emulacja IEEE; zakres zawężony do dokładnych połówek ujemnych | §3.4 |
| 5 gałąź `picker.ts:221-223` | PRZYJĘTY | §3.5 pkt 4 |
| 6 ACES | PRZYJĘTY — tylko `civ`; roblox bez tone mappingu | §1.2, §4.1, §4.2, RR-T5 |
| 7 `raw-window-handle` | PRZYJĘTY — zgodne statycznie (`^0.6.2` vs 0.6.2) | §2.2, §9 pkt 3 |
| 8 pętla/animacje/wejście/hover/DTO | PRZYJĘTY — nowa §3.9, D-RR-10, RR-T12, RR-T13 | §3.9, §6.2, §8 |
| 9 ~83 tys. LOC | PRZYJĘTY — oznaczone jako dolna granica | §0, §8 |
| 10 `new BattleScene(` | PRZYJĘTY — 5 miejsc | §7.1 M3 |
| 11 „dowiedzione wycieki” | PRZYJĘTY — przeformułowane na dowód ścieżki kodu; M2/M3 dowiedzione na poziomie JS | §0, §7 |
