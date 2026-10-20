# P1.10 — Katalog viewportów / breakpointów UI

**Temat:** R-RUSTPORT-P1-10-VIEWPORTS-Q1 · **Runda:** 1/5 · **Rola:** Operator
**Pinned main:** `edb8fb56115e9dec0a58614dfb23ca6173d60c9a` (odczyt przez `git grep`/`git show` na tym SHA, bez checkoutu; lokalny HEAD roboczy to `e5c959c2`, nieużywany)
**Zakres:** `gra/src/**` (CSS w template literals TS, `<style>`, `style.cssText`, `innerHTML`, JS viewport API). Zero zapisu w `gra/**`.

## 1. Media queries (kompletna lista: 13 wystąpień `@media` w `gra/src/**`, 11 plików)

| # | Plik:linia | Warunek | Zawartość reguły (skrót) |
|---|---|---|---|
| 1 | `gra/src/ui/techDiscoveryNotice.ts:814` | `max-width:1400px` | szerokość/układ noticy |
| 2 | `gra/src/ui/diplomacyAudience.ts:949` | `max-width:1200px` | `.da-table-area` → 1 kolumna; `.da-card` 200px |
| 3 | `gra/src/ui/diplomacyAudience.ts:950` | `max-width:920px` | `.da-relbreak` → 1 kolumna |
| 4 | `gra/src/ui/diplomacyAudience.ts:951` | `max-width:760px` | `.da-mainrow` wrap; `.da-card` 100% |
| 5 | `gra/src/ui/diplomacyTradeBasket.ts:248` | `max-width:640px` | `.cdb-landscape` → 1 kolumna |
| 6 | `gra/src/ui/diplomacyNegotiationModal.ts:170` | `max-width:560px` | `.cdn-landscape` → 1 kolumna |
| 7 | `gra/src/ui/armyMergePanel.ts:86` | `max-width:480px` | układ panelu scalania armii |
| 8 | `gra/src/ui/siegeMapPanel.ts:149` | `max-width:480px` | układ panelu mapy oblężenia |
| 9 | `gra/src/ui/cityAttackChoice.ts:111` | `max-width:420px` | układ wyboru ataku miasta |
| 10 | `gra/src/ui/cityForeignPick.ts:103` | `max-width:420px` | układ wyboru obcego miasta |
| 11 | `gra/src/ui/cityUnitPick.ts:112` | `max-width:420px` | układ wyboru jednostki miasta |
| 12 | `gra/src/ui/unitForeignPick.ts:104` | `max-width:420px` | układ wyboru obcej jednostki |
| 13 | `gra/src/ui/unitInfoCard.ts:383` | `max-width:420px` | układ karty jednostki |

Rozkład wartości: 1400px ×1, 1200px ×1, 920px ×1, 760px ×1, 640px ×1, 560px ×1, 480px ×2, 420px ×5 (łącznie 13).
Brak `@media (min-width:…)`, brak `matchMedia`, brak `pointer:coarse`/`hover:none`, brak `orientation`.

## 2. Stałe szerokości/wysokości (layout HUD, px)

- `gra/src/ui/hudLayout.ts:20` `CITY_RIGHT_PANEL_W_PX = 300`
- `gra/src/ui/hudLayout.ts:21` `CITY_LEFT_PANEL_W_PX = 340`
- `gra/src/ui/hudLayout.ts:22` `CITY_ICON_RAIL_W_PX = 46`
- `gra/src/ui/hudLayout.ts:23` `CITY_LEFT_ICON_RAIL_W_PX = 56`
- `gra/src/ui/hudLayout.ts:17` `CITY_EDGE_PX = 32`; `:6` `HUD_EDGE_PX = 20`; `:18` `CITY_RAIL_TOP_PX = 10`
- `gra/src/ui/hudLayout.ts:36-38` wysokości bottom bar: 52 / 60 / 30 px
- `gra/src/ui/cityUxFrame.ts:30,41` `LEFT_W`/`RIGHT_W` = powyższe; `:43` `DOCK_BOTTOM_CLEAR = 96`
- `gra/src/ui/cityUxFrame.ts:44` `LEFT_PANEL_W_EXPR = min(24vw,340px)`; `:45` `RIGHT_PANEL_W_EXPR = min(26vw,300px)`; `:70`/`:105` `min-width:280px` / `260px`
- `gra/src/ui/minimapLayout.ts:27-28` `MINIMAP_W_PX = 280`, `MINIMAP_H_PX = 170`; `:19` dock 46px
- `gra/src/battle/battleMinimap.ts:30-31` `MINIMAP_W = 180`, `MINIMAP_H = 120` (canvas bitmapy)
- `gra/src/ui/diploListHud.ts:114` `PANEL_W = 440`; `:123` `width:min(28vw,440px);min-width:280px`
- `gra/src/ui/scienceHubHud.ts:137`, `sideListHud.css.ts:18`, `wikiHubHud.ts:81` `PANEL_W = 340`
- `gra/src/ui/sciencePicker.ts:1193` `BOTTOM_H = calc(56px + 2mm)`
- `gra/src/ui/buildModeHud.ts:262-265` `max-width:480px` tooltipu blokady (komentarz wymusza zgodność z offsetWidth)
- `gra/src/ui/cityPanel.ts:1969` `.civ-cs-drawer` `flex:0 0 45%; max-width:720px; min-width:300px`
- `gra/src/ui/cityPanel.ts:2433` `.civ-v-top-stack` `max-width:min(98vw,1280px)`

## 3. Logika responsywna w JS (window.innerWidth/innerHeight, screen, resize)

- Brak globalnego mechanizmu breakpointów w TS; reakcja na rozmiar to clamp przy pozycjonowaniu popupów:
  - `gra/src/ui/cityUxFrame.ts:166,173` `Math.min(window.innerWidth * 0.24, LEFT_W)` / `0.26, RIGHT_W`; `:212` pozycja prawego panelu
  - `gra/src/ui/buildModeHud.ts:438-439` `vw/vh = innerWidth/innerHeight`
  - `gra/src/ui/hoverDetailDock.ts:111-116`, `gra/src/ui/hudTitleTooltip.ts:179-187`, `gra/src/ui/sciencePicker.ts:1557-1558`, `gra/src/ui/techTreeView.ts:785-787` — clamp do krawędzi (pad 8/12 px)
  - `gra/src/battle/battleScene.ts:3213` (`settingsPopup.style.right`), `:12002-12004` (clamp popupu), `:13617`
- Rozmiar canvasu gry: `gra/src/render/scene.ts:1615-1616` `canvas.clientWidth || innerWidth` (fallback); `:3112` `window.addEventListener('resize', onResize)`; `:3113-3128` dodatkowy `fullscreenchange` (bug 2026-07-25/26); `:1626` pixelRatio = `min(devicePixelRatio, preset.pixelRatioMax)`.
- `gra/src/main.ts:14584-14585`, `:36426-36427` — fallback do `innerWidth/innerHeight`.
- `gra/src/battle/battleScene.ts:3390,3608` i `gra/src/battle/manualBattle.ts:615,637` — `resize` listenery bitwy; `battleScene.ts:13263,18107` — `_deployLayoutListener`.
- `gra/src/perf/hardwareProfile.ts:236-237` — `screen.width/height` tylko do profilu sprzętowego (nie layout).

## 4. Wniosek: stały rozmiar okna czy responsywność?

- **Nie ma stałego rozmiaru okna.** Canvas gry wypełnia viewport (`main.ts` ustawia position:fixed + 100%, `scene.ts` reaguje na `resize`/`fullscreenchange`).
- **UI jest częściowo responsywne i w większości oparte na stałych px** z ograniczeniem do vw (`min(24vw,340px)`, `min(26vw,300px)`, `min(28vw,440px)`, `min(98vw,1280px)`) i `max-width:min(…,96vw)` w modalach dyplomacji.
- **Osobne układy dla małych ekranów:** tak, ale punktowe — 13 `@media` w 11 plikach, każdy dla pojedynczego komponentu (kolumna → wiersz, zawijanie). Brak globalnego układu mobilnego, brak progu dla dużych ekranów (poza `max-width:1400px` w `techDiscoveryNotice.ts`).
- **Brak** `matchMedia`, `pointer:coarse`, `orientation`, `visualViewport`.

## 5. Pominięte / ograniczenia (jawnie)

- Nie enumerowano pojedynczo 143 linii zawierających `vw`/`vh`/`vmin`/`vmax`/`100vw`/`100vh` (`git grep` w `gra/src/**`) ani ~75 plików z `style.cssText`/`innerHTML`/`style=` (inline style w stringach HTML). Są to jednostki względne, nie breakpointy; opisane zbiorczo w sekcji 4.
- Nie sprawdzano CSS w plikach `.css` ani w `index.html` poza `gra/src/**` (zakres allowlisty).
- Nie uruchamiano builda ani przeglądarki (izolacja: wyłącznie odczyt).
