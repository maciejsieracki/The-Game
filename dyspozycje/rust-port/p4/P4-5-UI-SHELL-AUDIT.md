# P4.5 — Audyt powłoki UI (webview Tauri) przy rendererze 3D w Rust

**Temat:** `R-RUSTPORT-P4-5-UI-SHELL-AUDIT-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
**Piny:** web `edb8fb56` (wyłącznie `git show`/`git grep`/`git ls-tree`); Rust/Tauri `origin/rust-port/parity-v2` = `f7aa0997` (wyłącznie `git show`/`git ls-tree`).
**Zakres:** odczyt i projekt. Zero kodu, zero buildu, zero `npm`/`cargo`/`cargo tauri`. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`.
**Kontekst decyzji:** `LEDGER.md:117` — właściciel 2026-10-21: D-REND-1 = renderer w Rust (wgpu), D-REND-3 = picking w Rust (piksel→hex), D-REND-8 = cały 3D (też bitwa, miniatury, podgląd cudów). UI (HUD, panele, dialogi, intro) zostaje w webview i ma być 1:1 z webem (P5).
**Legenda:** `plik:linia` na wskazanym pinie; „cmd → wynik” = wynik komendy z tej rundy; `NIE_ZMIERZONO` = nie sprawdzone, nie wnioskuję.

---

## 1. Stan `src-tauri/**` i `src-tauri/frontend/**` (pkt 1)

### 1.1 Pliki

`git ls-tree -r --name-only origin/rust-port/parity-v2 -- src-tauri` (bez `icons/`) → 10 plików: `.gitignore`, `Cargo.lock`, `Cargo.toml`, `build.rs`, `capabilities/default.json`, `frontend/index.html`, `frontend/main.js`, `src/lib.rs`, `src/main.rs`, `tauri.conf.json`.
`git diff --stat 78d494c7 origin/rust-port/parity-v2 -- src-tauri` → pusty (rc=0): `src-tauri/` jest identyczne z pinem użytym w P1-17B. Ostatni commit dotykający `src-tauri`: `bfec6c68 feat: integrate Rust Tauri playable slice`.

### 1.2 Konfiguracja (fakty zweryfikowane — wszystkie „znane fakty” z dispatchu potwierdzone)

| Fakt | Dowód |
|---|---|
| `frontendDist = "frontend"` | `src-tauri/tauri.conf.json:6-8` |
| brak `devUrl`, brak `beforeBuildCommand`/`beforeDevCommand` | `tauri.conf.json:6-8` (sekcja `build` ma tylko `frontendDist`) |
| `withGlobalTauri: true` | `tauri.conf.json:10` |
| jedno okno `main`, 1280×800, `resizable: true` | `tauri.conf.json:11-19` |
| bundle `msi`, `nsis` (tylko Windows) | `tauri.conf.json:21-25` |
| `tauri =2.11.5`, `tauri-build =2.6.3`, brak features | `src-tauri/Cargo.toml:13,18` |
| zależność `civ-engine` (path `../rust-port/engine`) | `Cargo.toml:16` |
| brak `wgpu`/`winit`/`raw-window-handle` w jakimkolwiek `*.toml` | `git grep -n -E "wgpu\|raw-window-handle\|winit" origin/rust-port/parity-v2 -- '*.toml'` → 0 trafień |
| uprawnienia: tylko `core:default` dla okna `main` | `src-tauri/capabilities/default.json:5-6` |

### 1.3 Komendy i zdarzenia

- Jedna komenda Tauri `engine_command` (`src-tauri/src/lib.rs:28-48`, rejestracja `:53`), jeden stan `EngineStateHandle(Mutex<EngineBridge<CivEngineAdapter>>)` (`lib.rs:17`), `bridge.rs` dołączony przez `#[path]` (`lib.rs:8-9`).
- `EngineCommand` ma 6 wariantów (`rust-port/engine/src/bridge.rs:20-40`: `create_session`, `add_player`, `select_unit`, `move_unit`, `advance_turn`, `get_state`); frontend wysyła 4: `create_session` (`main.js:551`), `select_unit` (`:647`), `move_unit` (`:655-660`), `advance_turn` (`:790`). Zgodne z P2-8 §1.
- Jedno zdarzenie `engine_state_changed` (`bridge.rs:17`, `:109-112`), subskrypcja `tauri.event.listen` (`main.js:754-764`).
- Wynik zawsze pełny snapshot: `BridgeResult::State { state }` (`bridge.rs:80-84`); `main.js:729-732` podmienia cały `gameState` i rerenderuje.
- Okno: jedyne użycie API okna to `getCurrentWindow().close()` (`main.js:256-262`).

### 1.4 Co robi `main.js` (810 linii)

Statyczny moduł ES (`index.html:259` `<script type="module" src="./main.js">`), bez bundlera i frameworka, korzysta z globalnego `window.__TAURI__` (`main.js:5`). Trzy ekrany `.screen` w `index.html` (`#main-menu` `:180`, `#new-game` `:223`, `#game-screen` `:236`): menu, 5-krokowy kreator (`renderWizard` `main.js:567-590`: intro/epoch/civilization/settings/generating), ekran gry (mapa + sidebar, `renderGameState` `:712-716`). Bez `invoke` pokazuje komunikat podglądu (`:794-799`). Sonda testowa `window.__civPlayableSlice` (`:804-810`) używana przez `tests/frontend_contract.cjs` (309 linii, fake-DOM w `node:vm`, `tests/frontend_contract.cjs:1-40`).

### 1.5 Twierdzenie P1-17B:12 o „siatce DOM” — **ZAMKNIĘTE: PRAWDA**

Cytat: `P1-17B-UI-CLASSIFICATION.md:12` — „Mapa to siatka DOM (`#game-map`, `role="grid"`), a nie renderer.”

Dowody (pin `f7aa0997`):
- `src-tauri/frontend/index.html:244` — `<div id="game-map" class="game-map" role="grid" aria-label="Mapa świata"></div>`;
- `index.html:150` — `.game-map { display: grid; gap: 0.28rem; min-width: 34rem; }`;
- `index.html:151` — `.tile { … clip-path: polygon(25% 4%, 75% 4%, 98% 50%, 75% 96%, 25% 96%, 2% 50%); }` (kształt heksu to tylko maska CSS);
- `main.js:665-693` `renderMap`: `gameMap.style.gridTemplateColumns = repeat(${map.width}, …)` (`:668`), dla każdego `map.tiles` tworzy `<button role="gridcell">` (`:673-679`), markery miasta/jednostki to znaki `★`/`⌂`/`⚔` (`:686-687`), klik → `onTileClick` (`:690`).

Doprecyzowanie: siatka jest **prostokątna** (kolumny = `map.width`, brak przesunięcia nieparzystych wierszy w CSS `index.html:150-159`), więc nie odwzorowuje geometrii heksów weba (`render/hexutil.ts` pointy-top, P4-0 §1.1). Przyczyna błędnego „NIE zweryfikowane” w `P4-0 §3.4:174` i `§7 pkt 6`: grep był wykonany w `rust-port/`, a frontend leży w `src-tauri/frontend/`. Oba punkty P4-0 tym dokumentem zamknięte (odczyt, bez zmiany P4-0 — poza allowlistą).

**Wniosek dla P4/P5:** obecny frontend Tauri to rusztowanie „vertical slice” (`index.html:187,219`); nie ma w nim żadnej powierzchni renderowania (brak `<canvas>`, brak WebGL), więc nie ma czego „zachować” po stronie mapy. Przydatne pozostają: kontrakt `engine_command`/`engine_state_changed` i harness `tests/frontend_contract.cjs`.

---

## 2. UI weba `gra/src/ui/**` (pkt 2)

### 2.1 Skład

`git ls-tree -r --name-only edb8fb56 -- gra/src/ui` → 438 plików: **117 `.ts`** + 321 zasobów (SVG ikon w `icons/brand/**`, 2 PNG hero w `assets/hero`). `git grep -c '' edb8fb56 -- gra/src/ui/*.ts` → **58 177 LOC** w 117 plikach.

### 2.2 Podział na kategorie

Kategoria przypisana wg **pierwszej linii komentarza nagłówkowego** pliku (`git grep -n` komentarzy linii 1–12, plik roboczy `ui-heads.txt` w scratchpadzie Operatora) — to deklaracja autora, nie pomiar zachowania. Suma kontrolna: 117 plików, 58 177 LOC, 0 pominiętych, 0 podwójnych (skrypt `cat.py`).

| Kat. | Pliki | LOC | Skład |
|---|---:|---:|---|
| A. Shell / intro / kreator / pełne ekrany | 10 | 4 876 | `mainMenu`, `newGameFlow` (2 373), `aiCivPicker`, `mapLoadingOverlay`, `gamePauseMenu`, `saveLoadDialog`, `hotSeatHandoff`, `victoryScreen`, `turnTransitionOverlay`, `buildStampToggle` |
| B. HUD mapy (stały) | 20 | 6 437 | `hud` (1 861), `hudChip6c`, `hudLayout`, `bottomBarHud`, `sidePanelHud`, `sidePanelLayout`, `sidePanelEventFilter`, `contextPanelHud`, `leaderBannersHud`, `mapToolbarHud`, `minimapHud`, `minimapLayout`, `armyStackHud`, `unitPanelHud`, `mapUnitHudSkin`, `unitActionBarHtml`, `orderPanel`, `hudPanelDismiss`, `escapeOverlayStack`, `buildModeHud` |
| C. Panele imperium / listy boczne / huby | 17 | 9 018 | `empireDetailPanel` (4 433), `empireDetailTypes`, `empireMiastaTable`, `empireBalance`, `empireOverlayHud`, `empirePanelSectionMap`, `powerOverlayHud`, `power-labels`, `armyListHud`, `cityListHud`, `sideListHud.css`, `treasuryBalanceFormat`, `diploListHud`, `scienceHubHud`, `scienceHubSnapshotLogic`, `wikiHubHud`, `markdownLite` |
| D. Miasto | 11 | 14 555 | `cityPanel` (11 986), `cityUxFrame`, `unitRecruitCard`, `hoverDetailDock`, `cityAttackChoice`, `cityForeignPick`, `cityUnitPick`, `cityCaptureNotice`, `improvementBuildConfirm`, `siegeMapPanel`, `buildingHoverTooltip` |
| E. Jednostki / armia | 12 | 2 533 | `unitInfoCard`, `unitMiniPreview`, `unitCardStatus`, `unitInfographic`, `unitForeignPick`, `unitReplacePicker`, `unitCtxDockDiploGate`, `armyMergePanel`, `armyMergePickPanel`, `armySplitPanel`, `armyStackPrompt`, `mapUnitCursor` |
| F. Dyplomacja | 10 | 8 248 | `diplomacyTradeBasket` (2 851), `diplomacyAudience` (2 443), `diplomacyAcceptanceBalance`, `diplomacyNegotiationModal`, `diplomacyPanel`, `diplomacyDealDisplay`, `diplomacyPendingHud`, `diplomacyProposalBanner`, `diploUiSkin`, `interHumanDiplomacyHud` |
| G. Badania | 6 | 3 889 | `sciencePicker`, `techTreeView`, `techDiscoveryNotice`, `techIcons`, `techUnlockParse`, `naukaLabel` |
| H. Bitwa (UI 2D) | 2 | 1 521 | `preBattle`, `postBattleSummary` |
| I. Powiadomienia modalne | 3 | 379 | `civElimNotice`, `triumphCityStateNotice`, `wonderCompletedNotice` |
| J. Karty encji / Civpedia | 10 | 3 146 | `entityCards/*` (adaptery `buildings/tech/units/wonder/improvement` → `EntityCardData`, `renderer.ts`, `registry.ts`) |
| K. Tooltipy | 2 | 1 270 | `hudTitleTooltip`, `hexContextTooltip` |
| L. Ikony / tokeny / formatowanie | 11 | 1 101 | `icons/*` (5), `brandTokenVars`, `civBrandDisplay`, `leaderPortraits`, `resourceColors`, `formatPl`, `uiParams` |
| M. Diagnostyka / perf | 3 | 1 204 | `perfReport`, `perfTestPanel`, `sceneTimingReport` |
| **Razem** | **117** | **58 177** | |

### 2.3 Elementy UI zależne od renderera 3D (tabela z dowodami)

| # | Element | Zależność | Dowód (`edb8fb56`) | Skutek przy rendererze Rust |
|---|---|---|---|---|
| R1 | Miniatura 3D jednostki (karta jednostki, panel miasta, karta encji) | własny `THREE.WebGLRenderer` + `buildUnitModel` z `render/units` | `ui/unitMiniPreview.ts:4-5,29-32`; render do canvasu offscreen i kopia do 2D `:103-106`; importerzy: `unitInfoCard.ts:33`, `cityPanel.ts:168`, `entityCards/renderer.ts:19` | Modele są w Rust → miniatura musi przyjść z Rust jako obraz (D-UI-3) |
| R2 | Sonda WebGL w „Teście wydajności” | `THREE.WebGLRenderer` | `ui/perfTestPanel.ts:17,295-301,363` | Mierzy WebGL webview, nie renderer Rust → do przeprojektowania (D-UI-7) |
| R3 | Kursor mapy kontekstowy (miecz/merge/miasto/ruch) | CSS `cursor` na `<canvas>` mapy | definicje `ui/mapUnitCursor.ts:6-40`; ustawianie `main.ts:12041-12042` `canvas.style.cursor = cursor`, wywołania `:26267-26329` | Bez `<canvas>` w DOM kursor musi ustawiać okno/warstwa nad mapą (§3.3) |
| R4 | Chip budowy zakotwiczony w heksie (ghost chip) | projekcja świat→ekran przez kamerę Three | `main.ts:12939-12941` `hexCenterClientPx` → `input/picker.ts:101-118` `worldToClientPx` (`v.project(camera)`); użycie `main.ts:12949` | Projekcję zna tylko Rust → per-klatka pozycja z Rust albo rysowanie w rendererze (§3.2) |
| R5 | Etykiety HTML oblężenia nad miastami | jw. | `main.ts:14570-14603` (`position:fixed`, `wp.project(camera)` `:14592`) | jw. |
| R6 | Etykiety galerii jednostek | jw. | `main.ts:36417-36455` | jw. (tryb deweloperski — status do D-UI-7) |
| R7 | Minimapa: prostokąt widoku kamery + klik → ruch kamery | `viewport` z kamery; `onMinimapClick(q,r)` | `ui/minimapHud.ts:44-51` (`viewport?: {x,y,w,h}` „prostokąt widoku kamery”), `:111-113`; rysunek 2D `:223`; klik `:398-401`; drugi canvas w `hud.ts:1452,1553-1585` | Minimapa zostaje 2D w DOM; Rust musi wystawiać stan kamery i przyjmować „skocz do (q,r)” |
| R8 | Zoom UI 85–150% | `transform: scale` na `<body>` — skaluje też canvas mapy (canvas jest w DOM) | `ui/hud.ts:458-461,501-511` | Natywna powierzchnia nie jest w `<body>` → zoom UI przestaje skalować mapę; rozjazd 1:1 (D-UI-5) |
| R9 | Pełny ekran | `document.documentElement.requestFullscreen()` | `ui/hud.ts:389,447`; reakcja renderera web `render/scene.ts:3117` | Zachowanie Fullscreen API w webview Tauri i jego wpływ na powierzchnię natywną: NIE_ZMIERZONO |
| R10 | Panel miasta „mapa centralna” | układ panelu zostawia środek dla mapy 3D | `ui/cityUxFrame.ts:2` (lewo produkcja, prawo okolica, mapa centralna); okolica rysowana w render: `render/cityOkolicaOverlay.ts` (P4-0 §1.1) | Panel DOM musi „wyciąć” środek nad powierzchnią Rust; kamera miasta sterowana z Rust |
| R11 | Importy z `render/**` w UI | 5 modułów | `buildModeHud.ts:7`, `hexContextTooltip.ts:25` i `techDiscoveryNotice.ts:53` (`import type ImprovementKey` z `render/improvements`); `hexContextTooltip.ts:36` (`render/unitVitalsPalette`); `perfReport.ts:8`, `sceneTimingReport.ts:8` (`import type SceneBuildTimings`); `cityPanel.ts:209` (`axialToWorld, HEX_R` z `render/hexutil`, użycie `:10196-10197` — sortowanie nawigacji miast wg X/Z świata) | Typy/paleta/matematyka — do przeniesienia do wspólnego modułu albo DTO; bez WebGL |

**Nie-zależne (sprawdzone):**
- **Tooltip heksu nie jest kotwiczony nad mapą** — to treść dokowanego panelu kontekstowego: `ui/hexContextTooltip.ts:2` („treść panelu kontekstowego mapy… D17=A”), `ui/contextPanelHud.ts:2,9-12` (`getMessage`), budowa w `main.ts:5882-5884,6093,6112`. Pozycja nie zależy od kamery.
- Tooltipy HUD (`hudTitleTooltip.ts:175-187`), dock hover (`hoverDetailDock.ts:104-116`), drzewko technologii (`techTreeView.ts:780-1082`, własny pan/zoom w DOM/SVG) — kotwiczone do elementów DOM, nie do świata.
- Podgląd cudów `wonderpreview/main.ts` to **osobny punkt wejścia** (`gra/vite.wonderpreview.config.ts`), nie używany z `ui/` ani `main.ts`: `git grep -n -i "wonderpreview" edb8fb56 -- gra/src/ui gra/src/main.ts …` → 0. `wonderCompletedNotice.ts` nie ma WebGL (`git grep getContext|WebGLRenderer` w `ui/` → tylko `hud.ts`, `minimapHud.ts` (2D), `perfTestPanel.ts`, `unitMiniPreview.ts`).
- Plakietki, emblematy, chipy miast, odznaki weteranów na mapie są **w rendererze** (`THREE.Sprite`/`CanvasTexture`, P4-0 §1.1 wiersz „Etykiety/plakietki”, §1.3) — nie w `ui/`. Przy rendererze Rust idą do P4.3/P4.4, nie do UI.

### 2.4 Jak UI dostaje dane i co wywołuje

Pomiar: `git grep -n -E "from ['\"]" edb8fb56 -- gra/src/ui` → 573 linie importów; analiza skryptem (`an.py`, rozwiązanie `../` względem katalogu pliku):

| Cel importu | Linie | Pliki UI | Moduły | w tym `import type` (linie) |
|---|---:|---:|---:|---:|
| `game/**` | 142 | 31 | 67 | 45 |
| `data/**` (JSON/dane) | 41 | 23 | 11 | 11 |
| `map/**` | 13 | 8 | 6 | 3 |
| `render/**` | 8 | 7 | 5 | 5 |
| `types/**` | 7 | 3 | 2 | 5 |
| `units/**` | 6 | 6 | 1 | 0 |
| `battle/**` | 2 | 2 | 1 | 0 |
| `three` | 2 | 2 | — | — |

- **49 z 117 plików UI** importuje logikę/dane (`game|map|units|data|battle|render`); **68** nie importuje żadnej. Ograniczenie metody: `import type` liczone tylko w jednoliniowych importach (wieloliniowe liczone jako wartościowe) — liczba „type-only” jest dolnym oszacowaniem.
- Najczęstsze moduły: `game/cities` 11, `game/diplomacy-display` 6, `game/production` 5, `game/diplomacy-proposals` 5, `game/difficulty-cost` 5, `game/manpower`/`economy`/`diplomacy-acceptance-points`/`diplomacy-pn-engine`/`tech-tempo` po 4.
- **UI liczy reguły gry lokalnie.** Przykład: `cityPanel.ts` ma 37 linii importu z `game/**` (m.in. `game/production` `:113`, `game/research.parsePrerequisites` `:83`, `game/unit-power` `:82`, `game/empire-hud-totals` `:78`); komentarz `cityPanel.ts:1538-1546` opisuje wołanie `getCityGrowth`/`previewCityEconomy` z gorącej ścieżki `mousemove`. To bezpośrednio sprzeczne z P5.13 (`PLAN-PORT-RUST-TAURI-20261020.md:192` „zero lokalnej symulacji w JS/frontend”) przy kopii 1:1.
- **Zależność odwrotna** (logika → UI): `game/eot-event-defer.ts:4`, `game/side-panel-event-priority.ts:1`, `game/spich-auto-ration-notify.ts:6` (`import type SidePanelEvent` z `ui/sidePanelHud`); `battle/battleScene.ts:230-231,252`, `battle/mapFieldBattle.ts:30`.
- **Okablowanie przez `main.ts`:** `main.ts` ma 313 linii `import`, w tym importy z 62 różnych modułów `./ui/` (`git grep -o "from './ui/…'"` → `sort -u` = 62). UI dostaje dane przez callbacki konfiguracyjne (np. `MinimapHudConfig.getMinimapData` `minimapHud.ts:111`, `ContextPanelHudConfig.getMessage` `contextPanelHud.ts:9-12`), a akcje zwraca callbackami (`onMinimapClick` `:113`). Pełne mapowanie 174 callbacków `main.ts` na komendy jest poza zakresem (P4-0 §3.2:139, P2-5 §2.13).
- **Zależności narzędziowe:** `import.meta.glob` (Vite) w 4 plikach: `icons/brandAssets.ts`, `leaderPortraits.ts`, `powerOverlayHud.ts`, `sidePanelEventFilter.ts` → kopia `ui/**` wymaga bundlera zgodnego z Vite. `localStorage` w 7 plikach (`buildStampToggle` 2, `hud` 3, `newGameFlow` 4, `perfReport` 8, `preBattle` 1, `saveLoadDialog` 6, `sceneTimingReport` 2) — `saveLoadDialog` (zapisy gry) musi przejść na komendy Rust (P2 save/load, P2-8 §6 „Save/load BRAK”).

---

## 3. Granica UI ↔ natywny renderer Rust (pkt 3)

### 3.1 Co jest pewne, a co nie

- Pewne (repo): dziś nie ma żadnej zależności graficznej w shellu (`Cargo.toml:12-18`; brak `wgpu`, §1.2). Webview ładuje statyczny `frontend/` (`tauri.conf.json:7`).
- **NIE_ZMIERZONO** (brak dowodu w repo, nie uruchamiano): (a) czy Tauri 2.11 / wry pozwala narysować powierzchnię wgpu w tym samym oknie **pod** przezroczystym webview; (b) czy przezroczystość webview działa na docelowych platformach (bundle tylko Windows, `tauri.conf.json:23` → WebView2); (c) multi-webview / child-window jako alternatywa; (d) koszt przesyłu klatek przez IPC; (e) WebGPU/WebGL2 w WebView2 dla wariantu wasm. To zakres **P4.3** (`R-RUSTPORT-P4-3-RUST-RENDERER-ARCH-Q1`, „osadzenie w Tauri”, `GOAL-RUST-PORT-20261020.md:31`). Ten dokument nie rozstrzyga i nie zakłada żadnej z tych możliwości.

### 3.2 Kto rysuje elementy kotwiczone w heksach (R4–R6, plakietki)

| Opcja | Opis | Koszt / ryzyko | Zgodność 1:1 |
|---|---|---|---|
| **K1. Renderer rysuje wszystko kotwiczone w świecie** | Chipy budowy, etykiety oblężenia, galerii, plakietki — jako sprite/tekst w wgpu | Wymaga w Rust rasteryzacji tekstu i stylów odpowiadających CSS (`main.ts:14570-14576` cssText chipu oblężenia); brak IPC per klatka | Ryzyko rozjazdu typografii CSS↔Rust (fonty, cienie, `border-radius`) — porównanie P4.14 |
| **K2. HTML nad powierzchnią, pozycje z Rust** | Rust co klatkę (lub przy ruchu kamery) wysyła `[{id, x, y, visible}]`; DOM ustawia `left/top` jak `main.ts:14596-14600` | IPC na klatkę przy pan/zoom; opóźnienie 1+ klatki = „pływanie” etykiet względem mapy: NIE_ZMIERZONO | Wygląd HTML 1:1 z webem (ten sam CSS) |
| **K3. Hybryda** | Elementy „żywe” przy kamerze (plakietki — już dziś w rendererze web) w K1; rzadkie, interaktywne (chip budowy z powodem blokady `main.ts:12953-12960`) w K2 | Najmniej tekstu w Rust, mało pozycji per klatka | Zachowuje dzisiejszy podział weba (sprite w render, HTML w `main.ts`) |

Rekomendacja Operatora: **K3**, bo odwzorowuje istniejący podział weba (plakietki już są w rendererze — P4-0 §1.1; tylko 3 grupy DOM są projektowane: R4, R5, R6). Wymaga D-UI-2.

### 3.3 Wejście (kursor, klik, klawiatura)

- Web: wejście mapy zbierane na `<canvas>` (`main.ts:26204` `mousedown`, `:26209` `contextmenu`, `:26230` `mousemove`, `:26337` `mouseup`, `:26714` `dblclick`; kamera `render/camera.ts:226,229` `mousedown`/`wheel`), klawiatura globalnie (`main.ts:26121`, `:36106`), picking przez `pickHexAt` (4 wywołania `git grep -c` w `main.ts`).
- Przy rendererze Rust (D-REND-3 = picking w Rust) możliwe są dwie drogi:
  - **W1. Webview zbiera wszystkie zdarzenia** (przezroczysty element „map-hit-layer” nad powierzchnią), wysyła `(x, y, przyciski, modyfikatory)` do Rust; Rust zwraca hex/encję i kursor. Plus: jeden punkt wejścia, UI DOM naturalnie przechwytuje kliki na panelach, kursor CSS jak web (`mapUnitCursor.ts`). Minus: IPC na `mousemove` (hover heksu, ghost) — przepustowość/opóźnienie NIE_ZMIERZONO.
  - **W2. Natywne okno zbiera zdarzenia mapy**, webview tylko swoje panele. Wymaga rozstrzygnięcia „kto dostaje klik” na granicy panel/mapa (hit-test DOM po stronie natywnej) — mechanizm w Tauri: NIE_ZMIERZONO.
- Kursor: W1 → CSS na warstwie trafień (identyczne SVG z `mapUnitCursor.ts:6-40`); W2 → kursor natywny, odtworzenie SVG-kursorów: NIE_ZMIERZONO.

### 3.4 Zoom / pan / resize

- Pan/zoom kamery web: drag z progiem 6 px (`camera.ts:25`), kółko (`camera.ts:218-219,229`), WASD i edge-pan (`camera.ts:247`) — P4-0 §1.1. Przy W1 webview przekazuje zdarzenia, Rust prowadzi kamerę; przy W2 Rust obsługuje sam.
- Resize: web `scene.ts:3112` (`resize`), `:3117` (`fullscreenchange`), canvas wypełnia viewport (P1-10 §4). Rust musi znać rozmiar okna i obszar zasłonięty przez HUD (np. `CITY_LEFT_PANEL_W_PX=340`, `CITY_RIGHT_PANEL_W_PX=300`, `hudLayout.ts:20-21`, P1-10 §2) — jeśli kadrowanie kamery uwzględnia panele. Czy web to robi: NIE_ZMIERZONO.
- Zoom UI (R8) i pełny ekran (R9) — wymagają decyzji (D-UI-5).

---

## 4. Szkielet UI — opcje (pkt 4)

Wspólne założenie wszystkich opcji: Rust trzyma stan i reguły (P5.13), UI dostaje **model widoku** z Rust (D-REND-2 przestał obowiązywać dla renderera, ale „UI w webview nadal potrzebuje kontraktu” — `LEDGER.md:117`).

| | **S1 — kopia `gra/src/ui/**` (117 plików) jako frontend Tauri + bundler Vite + nowa warstwa „kontroler” zamiast `main.ts`** | **S2 — przepisanie UI od zera (np. framework lub wanilla jak `main.js`)** | **S3 — rozszerzanie obecnego `src-tauri/frontend/main.js`** |
|---|---|---|---|
| Co się przenosi | 58 177 LOC `ui/**` + 321 zasobów; refaktor 49 plików importujących logikę (§2.4) na DTO; nowy kontroler zamiast okablowania z 62 modułami UI w `main.ts` | Nic z kodu; tylko wygląd ze zrzutów i CSS | 810 LOC `main.js` + 261 LOC `index.html` |
| Koszt | Wysoki, głównie w refaktorze importów `game/**` (142 linie, 67 modułów) i w kontrolerze; czas NIE_ZMIERZONO | Bardzo wysoki — odtworzenie 58 177 LOC zachowań i stylów | Najwyższy w praktyce — to S2 bez narzędzi (brak bundlera, brak `import.meta.glob`) |
| Ryzyko rozjazdu z webem | **Niskie** dla wyglądu (ten sam DOM/CSS); średnie dla danych (DTO musi dać te same liczby co lokalne obliczenia `game/**`) | **Wysokie** — każdy panel to nowy finding P5.14 | Wysokie |
| „Druga uproszczona gra” (plan §1 pkt 4) | Ryzyko, jeśli importy `game/**` zostaną „na chwilę” — trzeba je wyciąć mechanicznie (brama: zero importów `game|map|units` w frontendzie) | Niskie co do symulacji, wysokie co do zachowań UI | jw. |
| Testy 1:1 (P5.14 zrzuty DOM/ekran) | Ten sam DOM → porównanie DOM web↔Tauri możliwe selektorami weba; zrzut ekranu wymaga harnessu webview (D-REND-6, NIE_ZMIERZONO) i ukrycia/zamrożenia powierzchni Rust | Porównanie tylko wizualne | Jak S2 |
| Harness istniejący | `tests/frontend_contract.cjs` (fake-DOM) — do zastąpienia/rozszerzenia | jw. | Wprost działa dziś |
| P5.13 | Spełnione po usunięciu importów logiki (49 plików) i przeniesieniu `localStorage`-zapisów do Rust | Spełnione z założenia | Spełnione (`main.js` nie liczy reguł, P2-8 §7) |

Rekomendacja Operatora: **S1** z twardą bramą „frontend nie importuje `game/`, `map/`, `units/`, `battle/`, `render/`, `three`” (mierzalna `git grep`). Uzasadnienie: jedyne realne źródło 1:1 to istniejący DOM/CSS; koszt S1 leży w granicy danych, którą i tak trzeba zbudować dla P5.13. S3 odrzucam jako bazę (rusztowanie, §1.5). **To nie jest rozstrzygnięcie** — D-UI-1.

Uwaga o `data/**` (41 linii, 23 pliki): dane statyczne (JSON) mogą zostać w frontendzie jako treść (Civpedia, karty encji `entityCards/*Adapter.ts`), pod warunkiem że są tym samym plikiem co w Rust — czy wolno: D-UI-4.

---

## 5. Decyzje właściciela `D-UI-n` (nie rozstrzygane po cichu)

- **D-UI-1 — Szkielet UI:** S1 (kopia `ui/**` + Vite + kontroler), S2 (przepisanie), S3 (rozbudowa `main.js`). Rekomendacja: S1.
- **D-UI-2 — Elementy kotwiczone w heksach:** K1 (renderer rysuje), K2 (HTML z pozycjami z Rust), K3 (hybryda wg dzisiejszego podziału weba). Rekomendacja: K3. Zależy od P4.3.
- **D-UI-3 — Miniatury 3D jednostek w UI (R1):** obraz z renderera Rust (PNG/atlas na żądanie lub prebake), czy wyłącznie fallback tekstowy jak web bez WebGL (`unitInfoCard.ts:74`, P4-0 D-REND-5)? D-REND-8 = B obejmuje miniatury, więc fallback jako docelowy stan byłby odstępstwem od 1:1.
- **D-UI-4 — Dane statyczne w frontendzie:** czy `data/**` (JSON) wolno czytać bezpośrednio w webview (treść, opisy), czy wszystko przez Rust DTO?
- **D-UI-5 — Zoom UI 85–150% i pełny ekran (R8, R9):** zoom tylko DOM (mapa bez skalowania, niezgodne z webem), czy Rust skaluje widok synchronicznie z `--civ-ui-zoom`? Pełny ekran przez Fullscreen API webview czy API okna Tauri (dostępność: NIE_ZMIERZONO)?
- **D-UI-6 — Wejście (W1/W2):** webview zbiera wszystkie zdarzenia i przekazuje do Rust, czy natywne okno zbiera zdarzenia mapy? Zależy od P4.3.
- **D-UI-7 — Narzędzia deweloperskie zależne od WebGL (R2, R6):** `perfTestPanel` (sonda WebGL), galeria jednostek (`main.ts:36417`), raporty czasów sceny (`perfReport.ts`, `sceneTimingReport.ts`, typ `SceneBuildTimings`) — przenosić, przeprojektować pod renderer Rust, czy wyłączyć z zakresu P5?
- **D-UI-8 — Los obecnego `src-tauri/frontend/` i `tests/frontend_contract.cjs`:** zastąpić w całości po S1/S2, czy utrzymać jako „smoke” do czasu P5?

---

## 6. Kandydaci-tematy (propozycje, nie dispatch)

| ID (propozycja) | Cel | Allowlista | Zależności |
|---|---|---|---|
| `R-RUSTPORT-P5-0-UI-VIEWMODEL-CATALOG-Q1` | Katalog danych, które 49 plików UI bierze z `game/map/units/data/battle/render` (per plik: funkcja, typ/wartość, propozycja pola DTO) | `dyspozycje/rust-port/p5/P5-0-UI-VIEWMODEL-CATALOG.md`, `dyspozycje/autobot/runs/<ID>/**` | P2-2, P2-5; niezależny od P4.3 |
| `R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1` | Szkielet frontendu wg D-UI-1 (np. S1: Vite + kopia `ui/**` bez importów logiki, pusty kontroler) | nowy katalog frontendu w `src-tauri/**` (dokładna ścieżka po D-UI-1), `dyspozycje/autobot/runs/<ID>/**` | D-UI-1, D-UI-4, P5-0 |
| `R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1` | Kontrakt granicy UI↔renderer: zdarzenia wejścia, kursor, kotwice heksów, stan kamery dla minimapy, kadrowanie pod panele | `dyspozycje/rust-port/p4/P4-5B-MAP-UI-SEAM.md`, `dyspozycje/autobot/runs/<ID>/**` | P4.3, D-UI-2, D-UI-5, D-UI-6 |
| `R-RUSTPORT-P4-5C-UNIT-THUMBNAILS-Q1` | Miniatury jednostek z renderera Rust dla UI (format, cache, rozmiar 96/128 px wg `unitInfoCard.ts:383`) | dokument w `p4/`, później kod renderera | P4.3, P4.4, D-UI-3 |
| `R-RUSTPORT-P5-14A-UI-PARITY-HARNESS-Q1` | Harness porównania DOM web↔Tauri (selektory weba, zamrożenie powierzchni Rust) | `tests/**` (wskazane po D-REND-6), `dyspozycje/autobot/runs/<ID>/**` | D-REND-6, D-UI-1 |

---

## 7. Lista `NIE_ZMIERZONO`

1. Osadzenie wgpu w oknie Tauri pod/obok webview, przezroczystość webview, multi-webview — P4.3 (§3.1).
2. Opóźnienie i przepustowość IPC dla `mousemove` (W1) i pozycji etykiet per klatka (K2).
3. Fullscreen API w webview Tauri vs API okna (R9).
4. Czy web kadruje kamerę z uwzględnieniem paneli HUD (§3.4).
5. Kursory SVG w trybie W2 (natywne).
6. Liczba `import type` w importach wieloliniowych (§2.4 — dolne oszacowanie).
7. Harness zrzutów ekranu dla webview Tauri (D-REND-6).
8. Kategoryzacja §2.2 oparta na nagłówkach plików, nie na pomiarze zachowania.

## 8. Metoda (komendy)

- `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (HEAD `dc4cfdb4`); `git fetch origin rust-port/parity-v2` (`f7aa0997`).
- `git show origin/rust-port/parity-v2:src-tauri/{tauri.conf.json,Cargo.toml,capabilities/default.json,build.rs,src/main.rs,src/lib.rs,frontend/index.html,frontend/main.js}`; `git show …:rust-port/engine/src/bridge.rs`; `git show …:tests/frontend_contract.cjs`.
- `git ls-tree -r --name-only edb8fb56 -- gra/src/ui` → 438 / 117 `.ts`; `git grep -c '' edb8fb56 -- 'gra/src/ui/*.ts' 'gra/src/ui/**/*.ts'` → 117 plików, 58 177 LOC.
- `git grep -n -E "from ['\"]" edb8fb56 -- gra/src/ui` → 573 linie → skrypt analizy importów (scratchpad, `python3 -I`).
- `git grep -n -E "\.project\(" edb8fb56 -- gra/src`; `git grep -n "worldToClientPx\("`; `git grep -n -E "getContext\(|WebGLRenderer|createElement\('canvas'\)" edb8fb56 -- gra/src/ui`; `git grep -l "import.meta.glob"`, `git grep -c "localStorage"` w `gra/src/ui`.
- Zero `npm`, `cargo`, `cargo tauri`, buildu; zero zapisu w `gra/**`, `rust-port/**`, `src-tauri/**`.
