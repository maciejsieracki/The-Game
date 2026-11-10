# P1.10 — Katalog viewportów / breakpointów UI

**Temat:** R-RUSTPORT-P1-10-VIEWPORTS-Q1 · **Runda:** 1/5 · **Rola:** Operator (odpowiedź na zarzuty, runda 1)
**Pinned main:** `edb8fb56115e9dec0a58614dfb23ca6173d60c9a` (odczyt przez `git grep`/`git show` na tym SHA, bez checkoutu). Lokalny HEAD repo: `51e5ff50` (commit `docs(rust-port): add interim P1.10 viewport/breakpoint catalog`, w którym ten plik został pierwotnie dodany); nie `e5c959c2`.
**Zakres:** `gra/src/**` (CSS w template literals TS, `<style>`, `style.cssText`, `innerHTML`, JS viewport API). Zero zapisu w `gra/**`.

## 1. Media queries (kompletna lista: 13 wystąpień `@media` w `gra/src/**`, 11 plików)

Weryfikacja: `git grep -n '@media' edb8fb56 -- 'gra/src/**'`. Cytat = dosłowny fragment reguły z edb8fb56.

| # | Plik:linia | Warunek | Cytat reguły (edb8fb56) |
|---|---|---|---|
| 1 | `gra/src/ui/techDiscoveryNotice.ts:814` | `max-width:1400px` | `#${HOST_ID}.tdn-has-side .tdn-stage{flex-direction:column;align-items:center;gap:10px;}` oraz `#${HOST_ID}.tdn-has-side .entity-card{height:calc((100vh - 56px) / 2);margin:0;}` |
| 2 | `gra/src/ui/diplomacyAudience.ts:949` | `max-width:1200px` | `.da-table-area{grid-template-columns:1fr;}` `.da-pn-balance-bar,.da-negot-actionbar{grid-column:1;}` `.da-card{flex:0 0 200px;width:200px;}` |
| 3 | `gra/src/ui/diplomacyAudience.ts:950` | `max-width:920px` | `.da-relbreak{grid-template-columns:1fr;}` `.da-relcol.pos{border-right:none;border-bottom:1px solid rgba(232,216,138,.18);}` |
| 4 | `gra/src/ui/diplomacyAudience.ts:951` | `max-width:760px` | `.da-mainrow{flex-wrap:wrap;}` `.da-card{width:100%;flex:1 1 auto;}` |
| 5 | `gra/src/ui/diplomacyTradeBasket.ts:248` | `max-width:640px` | `.civ-diplo-basket .cdb-landscape{grid-template-columns:1fr;}` `.civ-diplo-basket .cdb-land-side{max-height:none;overflow:visible;}` |
| 6 | `gra/src/ui/diplomacyNegotiationModal.ts:170` | `max-width:560px` | `.civ-diplo-neg .cdn-landscape{grid-template-columns:1fr;}` `.civ-diplo-neg .cdn-land-aside-empty{display:none;}` |
| 7 | `gra/src/ui/armyMergePanel.ts:86` | `max-width:480px` | `.civ-amp-body{grid-template-columns:1fr;}` `.civ-amp-mid{padding:4px 0;flex-direction:row;}` `.civ-amp-arrow{transform:rotate(90deg);}` |
| 8 | `gra/src/ui/siegeMapPanel.ts:149` | `max-width:480px` | `.civ-smp-overlay{top:auto;left:8px;right:8px;bottom:64px;}` `.civ-smp{width:100%;}` `.civ-smp-actions{grid-template-columns:1fr;}` `.civ-smp-stats{grid-template-columns:1fr;}` |
| 9 | `gra/src/ui/cityAttackChoice.ts:111` | `max-width:420px` | `.civ-cac-actions{grid-template-columns:1fr;}` |
| 10 | `gra/src/ui/cityForeignPick.ts:103` | `max-width:420px` | `.civ-cfp-actions{grid-template-columns:1fr;}` |
| 11 | `gra/src/ui/cityUnitPick.ts:112` | `max-width:420px` | `.civ-cup-actions{grid-template-columns:1fr;}` |
| 12 | `gra/src/ui/unitForeignPick.ts:104` | `max-width:420px` | `.civ-ufp-actions{grid-template-columns:1fr;}` |
| 13 | `gra/src/ui/unitInfoCard.ts:383` | `max-width:420px` | `.unit-info-card-3d-slot{height:128px;}` `.unit-info-card-3d-slot .unit-mini-canvas{width:96px;height:96px;}` |

Rozkład wartości: 1400px ×1, 1200px ×1, 920px ×1, 760px ×1, 640px ×1, 560px ×1, 480px ×2, 420px ×5 (łącznie 13).
Brak `@media (min-width:…)`, brak `matchMedia`, brak `pointer:coarse`/`hover:none`, brak `orientation`.

## 2. Stałe szerokości/wysokości (layout HUD, px) i wyrażenia `min()`

- `gra/src/ui/hudLayout.ts:20` `CITY_RIGHT_PANEL_W_PX = 300`
- `gra/src/ui/hudLayout.ts:21` `CITY_LEFT_PANEL_W_PX = 340`
- `gra/src/ui/hudLayout.ts:22` `CITY_ICON_RAIL_W_PX = 46`
- `gra/src/ui/hudLayout.ts:23` `CITY_LEFT_ICON_RAIL_W_PX = 56`
- `gra/src/ui/hudLayout.ts:17` `CITY_EDGE_PX = 32`; `:6` `HUD_EDGE_PX = 20`; `:18` `CITY_RAIL_TOP_PX = 10`
- `gra/src/ui/hudLayout.ts:36-38` wysokości bottom bar: 52 / 60 / 30 px
- `gra/src/ui/cityUxFrame.ts:30,41` `LEFT_W`/`RIGHT_W` = powyższe; `:43` `DOCK_BOTTOM_CLEAR = 96`
- `gra/src/ui/cityUxFrame.ts:44` `LEFT_PANEL_W_EXPR = min(24vw,340px)`; `:45` `RIGHT_PANEL_W_EXPR = min(26vw,300px)`; `:65` `max-width:min(98vw,1280px)`; `:70`/`:105` `min-width:280px` / `260px`
- `gra/src/ui/minimapLayout.ts:27-28` `MINIMAP_W_PX = 280`, `MINIMAP_H_PX = 170`; `:19` dock 46px
- `gra/src/battle/battleMinimap.ts:30-31` `MINIMAP_W = 180`, `MINIMAP_H = 120` (canvas bitmapy)
- `gra/src/battle/battleScene.ts:825` `const TEMPO_PANEL_W = 236;`
- `gra/src/ui/diploListHud.ts:114` `PANEL_W = 440`; `:123` `width:min(28vw,440px);min-width:280px`
- `gra/src/ui/scienceHubHud.ts:137`, `sideListHud.css.ts:18`, `wikiHubHud.ts:81` `PANEL_W = 340`
- `gra/src/ui/sciencePicker.ts:1193` `BOTTOM_H = calc(56px + 2mm)`
- `gra/src/ui/buildModeHud.ts:262-265` `max-width:480px` tooltipu blokady (komentarz wymusza zgodność z offsetWidth)
- `gra/src/ui/diplomacyProposalBanner.ts:17` `min-width:280px;max-width:480px;`
- `gra/src/ui/powerOverlayHud.ts:102` `.civ-pow-box{min-width:340px;max-width:480px;`
- `gra/src/ui/diplomacyNegotiationModal.ts:162` `max-width:min(760px,96vw);width:100%;max-height:min(92vh,720px);`
- `gra/src/ui/diplomacyTradeBasket.ts:239` `max-width:min(1180px,96vw);width:100%;max-height:min(92vh,880px);`; `:395` `.civ-diplo-basket.cdb-treaty-only-mode{max-width:min(900px,96vw);}`
- `gra/src/battle/endDetails1E.ts:262` `width: 'min(1220px, 96vw)'`
- `gra/src/ui/cityPanel.ts:1969` `.civ-cs-drawer` `flex:0 0 45%; max-width:720px; min-width:300px`
- `gra/src/ui/cityPanel.ts:2433` `.civ-v-top-stack` `max-width:min(98vw,1280px)`; `:2530` `max-width:min(44vw,520px)`; `:2574` `max-width:min(100%,96vw)`; `:2676` `.civ-hover-detail-float` `max-width:min(400px,92vw)`
- `gra/src/ui/hudTitleTooltip.ts:84` `max-width:min(420px,92vw)`
- `gra/src/ui/perfReport.ts:222` `max-width:min(560px,96vw);max-height:min(80vh,640px)`
- `gra/src/ui/preBattle.ts:436` `max-width:min(380px,32vw)`
- `gra/src/main.ts:1842` `'max-width:min(560px,calc(100vw - 48px))'`
- `gra/src/ui/hud.ts:561-562,584,588,592,731` wyrażenia `min(calc(100vw - …px), …px)` (paski bannerów HUD, prawy klaster, `max-width:min(148px,calc(100vw - ${CITY_EDGE_PX}px))`)

Uwaga o kompletności: `git grep -E '(max|min)-?width:\s*min\(|width:\s*min\('` na edb8fb56 w `gra/src/**` daje 59 linii. Powyżej wyliczono wszystkie stałe px z zarzutów oraz wybrane wyrażenia `min()`; pozostałe linie (w tym pozostałe `min(…vw)` i `calc`) nie są tu pojedynczo wypisane (patrz sekcja 5).

## 3. Logika responsywna w JS (window.innerWidth/innerHeight, screen, resize)

- Brak globalnego mechanizmu breakpointów w TS; reakcja na rozmiar to clamp przy pozycjonowaniu popupów:
  - `gra/src/ui/cityUxFrame.ts:166,173` `Math.min(window.innerWidth * 0.24, LEFT_W)` / `0.26, RIGHT_W`; `:212` pozycja prawego panelu
  - `gra/src/ui/buildModeHud.ts:438-439` `vw/vh = innerWidth/innerHeight`
  - `gra/src/ui/hoverDetailDock.ts:111-116`, `gra/src/ui/hudTitleTooltip.ts:179-187`, `gra/src/ui/sciencePicker.ts:1557-1558`, `gra/src/ui/techTreeView.ts:785-787` — clamp do krawędzi (pad 8/12 px)
  - `gra/src/battle/battleScene.ts:3213` (`settingsPopup.style.right`), `:12002-12004` (clamp popupu), `:13617`
- Listenery `resize` / `fullscreenchange` (pełna lista `git grep` na edb8fb56, `gra/src/**`):
  - `gra/src/render/scene.ts:3112` `window.addEventListener('resize', onResize)` (rejestracja); `:3117` `document.addEventListener('fullscreenchange', onResize)` (rejestracja); `:3128-3129` teardown (`removeEventListener` dla obu)
  - `gra/src/battle/battleScene.ts:3390` `window.addEventListener('resize', this._onResize)` (rejestracja); `:3608` `window.removeEventListener('resize', this._onResize)` (teardown)
  - `gra/src/battle/manualBattle.ts:615` `window.addEventListener('resize', this._onResize)` (rejestracja); `:637` `window.removeEventListener('resize', this._onResize)` (teardown)
  - `gra/src/battle/battleScene.ts:13263,18107` `window.addEventListener('resize', this._deployLayoutListener)` (rejestracja)
  - `gra/src/ui/hud.ts:428` `document.addEventListener('fullscreenchange', () => { renderBar(); … })` (rejestracja, guard `fsListenerBound`)
  - `gra/src/wonderpreview/main.ts:273` `window.addEventListener('resize', onResize)` (rejestracja)
- Rozmiar canvasu gry: `gra/src/render/scene.ts:1615-1616` `canvas.clientWidth || innerWidth` (fallback); `:1626` pixelRatio = `min(devicePixelRatio, preset.pixelRatioMax)`. Reakcja na zmianę rozmiaru: `scene.ts:3112` (resize) i `:3117` (fullscreenchange, bug 2026-07-25/26).
- `gra/src/main.ts:14584-14585`, `:36426-36427` — fallback do `innerWidth/innerHeight`.
- `gra/src/perf/hardwareProfile.ts:236-237` — `screen.width/height` tylko do profilu sprzętowego (nie layout).

## 4. Wniosek: stały rozmiar okna czy responsywność?

- **Nie ma stałego rozmiaru okna.** Canvas gry wypełnia viewport (`main.ts` ustawia position:fixed + 100%, `scene.ts` reaguje na `resize`/`fullscreenchange`).
- **UI jest częściowo responsywne i w większości oparte na stałych px** z ograniczeniem do vw (`min(24vw,340px)`, `min(26vw,300px)`, `min(28vw,440px)`, `min(98vw,1280px)`) oraz `max-width:min(…,96vw)` w modalach dyplomacji (`diplomacyNegotiationModal.ts:162`, `diplomacyTradeBasket.ts:239,395`).
- **Osobne układy dla małych ekranów:** tak, ale punktowe — 13 `@media` w 11 plikach, każdy dla pojedynczego komponentu (kolumna → wiersz, zawijanie). Brak globalnego układu mobilnego, brak progu dla dużych ekranów (poza `max-width:1400px` w `techDiscoveryNotice.ts`).
- **Brak** `matchMedia`, `pointer:coarse`, `orientation`, `visualViewport`.

## 5. Pominięte / ograniczenia (jawnie)

- Nie enumerowano pojedynczo linii z `vw`/`vh`/`vmin`/`vmax`/`100vw`/`100vh` ani pozostałych 59 − (wypisanych w sekcji 2) wyrażeń `min()` w szerokościach. Liczby z pierwszej rundy („143 linie, ~75 plików”) **nie zostały potwierdzone**. W tej rundzie prosty regex `vw|vh` na edb8fb56 (`gra/src/**`) daje 1498 linii w 141 plikach, ale zawiera trafienia niebędące jednostkami CSS; poprawny, zawężony regex jednostek nie był uruchamiany, więc liczba jednostek pozostaje nieprzeliczona. Są to jednostki względne, nie breakpointy; opisane zbiorczo w sekcji 4.
- Inline style w stringach HTML (`style.cssText`, `innerHTML`, `style=`) nie zostały przeliczone; nie są częścią katalogu breakpointów.
- Nie sprawdzano CSS w plikach `.css` ani w `index.html` poza `gra/src/**` (zakres allowlisty).
- Nie uruchamiano builda ani przeglądarki (izolacja: wyłącznie odczyt).
