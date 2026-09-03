TEMAT: R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME (UI)
ŚCIEŻKA: gra/src/ui/minimapHud.ts, gra/src/ui/hud.ts, gra/src/main.ts (WYŁĄCZNIE wiring)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03, ze zrzutami ekranu)
"Trzeba zrobić delikatny porządek w tych ikonach. Po pierwsze, same kopalnie i ludki
postawiłbym obok tego plus minus 150 [kontrolka powiększenia UI], czyli ułożył w górnej
części minimapy. Usunąłbym włącznik kultury i religii i powiązał go z górnym panelem, gdzie
jest kultura i religia — w momencie gdy naciskamy kulturę, powinno się zaznaczać (podkreślenie
na mapie które wcześniej było w tych ikonkach), a one już nie będą potrzebne. Zostaje
wyznaczanie granic po tej stronie i trzeba dorobić jeszcze jeden — włącz/wyłącz połączenia
handlowe. Po prawej stronie będą dwie ikony: granice i połączenia handlowe, a u góry na
minimapie obok plusów/minusów chłopek i surowce."

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
5 ikon dziś w `.civ-minimap-tools` (`gra/src/ui/minimapHud.ts::ensureToolButtons()`, linie
342-411), NIE w `mapToolbarHud.ts` (osobny, niezwiązany lewy toolbar z medalionami
Miasto/Nauka/Dyplomacja/Wojsko/Budowa):

| # (góra→dół) | Nazwa w kodzie | Plik:linia | Funkcja main.ts | Co przełącza |
|---|---|---|---|---|
| 1 | `workerBtn` | minimapHud.ts:346-355 | `toggleWorkerOverlayOnMap()` (main.ts:10976-10980), stan `showWorkerOverlay` (main.ts:10932) | ikonki robotników na obrobionych polach |
| 2 | `depositBtn` | minimapHud.ts:356-365 | `toggleResourceDepositOverlayOnMap()` (main.ts:10982-10990), stan `showResourceDepositOverlay` (main.ts:10936) | ikony złóż/surowców na mapie 3D |
| 3 | `mapBtn` | minimapHud.ts:366-381 | `toggleCultureRangeOnMap()` (main.ts:11122-11128), stan `cultureRangeVisible` (main.ts:10884) | podświetlenie zasięgu KULTURY (fiolet) |
| 4 | `searchBtn` | minimapHud.ts:382-396 | `toggleReligionRangeOnMap()` (main.ts:11130-11136), stan `religionRangeVisible` (main.ts:10885) | podświetlenie zasięgu RELIGII (pomarańcz) |
| 5 | `territoryBtn` | minimapHud.ts:397-405 | `toggleTerritoryBorderOnMap()` (main.ts:11090-11096), stan `territoryBorderVisible` (main.ts:10887, domyślnie `true`) | granice terytorialne — ZOSTAJE bez zmian |

Wizualny efekt podświetlenia: `gra/src/render/rangeOverlay.ts` — `CULTURE_RANGE_STYLE`
(linie 438-444, fiolet) / `RELIGION_RANGE_STYLE` (linie 446-452, pomarańcz), budowane przez
`buildRangeOverlayGroup()`, wołane z `refreshRangeOverlays()` (main.ts:11098-11120) — te
funkcje NIE są zmieniane, tylko sposób ich wywołania.

Kontrolka zoom "-150%+" to ODDZIELNY element (`civ-ui-zoom` — powiększenie CAŁEGO interfejsu,
NIE zoom kamery/minimapy) w `gra/src/ui/hud.ts::renderUtilDock()`/`renderZoomControls()`
(hud.ts:451-454, 514-516, 518+), montowany w `.civ-hud-util-dock` (hud.ts:626-650,
`ensureUtilDockMounted` hud.ts:1259-1264), pozycjonowany względem minimapy przez
`gra/src/ui/minimapLayout.ts:111-118`, ale to OSOBNY kontener DOM niż `.civ-minimap-tools`
(minimapHud.ts:301-307, wewnątrz `.civ-minimap-wrap` flex-row, minimapHud.ts:290-293).

Górny panel kultura/religia: `gra/src/ui/hud.ts::renderBarD1B()` — chipy `act:'kultura'`
(hud.ts:1113-1120) i `act:'religia'` (hud.ts:1122-1129), obsługiwane w
`handleHudBarAction(act)` (hud.ts:1217+), gałąź `act==='religia'||act==='kultura'||...`
(hud.ts:1243-1256) — dziś otwiera WYŁĄCZNIE panel szczegółów (`onOpenEmpireDetail`)/overlay z
danymi, NIE wywołuje `toggleCultureRangeOnMap`/`toggleReligionRangeOnMap`.

Martwy kod znaleziony przy okazji (do usunięcia jeśli w drodze, nie szukać dodatkowo):
`mapToolbarHud.ts` ma w `MapToolbarHudConfig` (linie 18-19, 31-32) pola
`onOpenCulture`/`onOpenReligion`/`isCultureRangeActive`/`isReligionRangeActive`, ale
`render()` (linie 107-114) NIGDY ich nie używa — relikt starszej wersji toolbara.

Trasy handlowe: renderer JUŻ ISTNIEJE (`gra/src/render/tradeRoutesOverlay.ts`,
`buildTradeRoutesOverlayGroup`/`disposeTradeRoutesOverlayGroup`) i rysuje się DZIŚ ZAWSZE gdy
trasy istnieją — `refreshTradeRoutesOverlay()` (main.ts:10913-10928) nie ma flagi widoczności,
tylko warunek `tradeRoutes.length===0` (linia 10916). Brak jakiegokolwiek istniejącego
`showTradeRoutes*`/`isTradeRoutesActive` — potwierdzone grepem. Wołane z main.ts:5053 i
main.ts:13593.

GOAL
1. **Worker + Deposit → rząd zoom.** Przenieść przyciski `workerBtn`/`depositBtn` z
   `.civ-minimap-tools` (minimapHud.ts) do `.civ-hud-util-dock`/`renderUtilDock()` w `hud.ts`,
   obok kontrolki zoom "-150%+", w GÓRNEJ części (nie pod minimapą — właściciel mówi wprost
   "u góry"). Wymaga rozszerzenia `HudApi`/`HudConfig` (`hud.ts`) o hooki dziś dostępne tylko
   w `main.ts:20251-20257` (`workerOverlay`/`resourceDepositOverlay` przekazywane dziś
   wyłącznie do `createMinimapHud()`) — Operator decyduje o dokładnym kształcie (np. nowy
   config field w `HudConfig`, wspólny mały renderer przycisku reużywany przez oba miejsca).
   Zachowaj identyczne ikony/tooltips/zachowanie toggle, zmienia się WYŁĄCZNIE pozycja w DOM.
2. **Usunąć mapBtn/searchBtn z `.civ-minimap-tools`.** Podpiąć `toggleCultureRangeOnMap()` pod
   klik chipa `act:'kultura'` i `toggleReligionRangeOnMap()` pod klik chipa `act:'religia'` w
   `handleHudBarAction` (hud.ts:1243-1256) — klik chipa ma WŁĄCZAĆ/WYŁĄCZAĆ (toggle) podświetlenie
   na mapie, OPRÓCZ dotychczasowego zachowania (otwarcie panelu szczegółów) — Operator ustala
   dokładną semantykę (np. pojedynczy klik = toggle podświetlenia, tak jak dziś robiły ikony
   minimapy; obecne dblclick→panel z `mapBtn`/`searchBtn` zostaje osobno dostępne przez chip,
   jeśli już taki mechanizm dblclick istnieje na chipach — zbadaj, nie zgaduj). Wizualny stan
   "aktywne podświetlenie" na chipie (np. podświetlenie/ramka) analogiczne do dzisiejszego stanu
   `active` na `mapBtn`/`searchBtn` w minimapHud.ts.
3. **Territory zostaje.** Zero zmian w `territoryBtn`.
4. **Nowy toggle: widoczność tras handlowych.** Nowa zmienna stanu (np.
   `showTradeRoutesOverlay`, domyślnie `true`) w main.ts obok `main.ts:10884-10887`; guard w
   `refreshTradeRoutesOverlay()` (`if (!showTradeRoutesOverlay) { clearTradeRoutesOverlay();
   return; }`); nowa funkcja `toggleTradeRoutesOverlayOnMap()` wzorem
   `toggleResourceDepositOverlayOnMap()` (main.ts:10982-10990); nowy hook w
   `MinimapLayerHooks` (minimapHud.ts:56-66, np. `onToggleTradeRoutes`/`isTradeRoutesActive`)
   LUB osobny interfejs wzorem `MinimapResourceDepositOverlayHooks` (minimapHud.ts:84-88) —
   Operator decyduje, uzasadnia wybór; nowy przycisk w `.civ-minimap-tools` obok `territoryBtn`
   (prawa strona minimapy, jak dziś granice), z nową ikoną (dobrać spójną z resztą — np. wzorem
   SVG stylu `TERRITORY_SVG`/`SEARCH_SVG`, minimapHud.ts:130-131).
5. Rezultat końcowego układu: u góry minimapy (w `.civ-hud-util-dock`, obok zoom) — worker +
   deposit. Po prawej stronie minimapy (`.civ-minimap-tools`) — WYŁĄCZNIE territory + nowy
   trade-routes toggle (2 przyciski, nie 5). Kultura/religia — bez osobnych ikon minimapy,
   sterowane z chipów górnego paska.

KRYTERIA KOŃCA (binarne)
1. `.civ-minimap-tools` zawiera dokładnie 2 przyciski (territory, trade-routes) — zero
   worker/deposit/mapBtn/searchBtn.
2. Worker i deposit toggle są widoczne i klikalne w rzędzie zoom (`.civ-hud-util-dock`),
   funkcjonalnie identyczne jak wcześniej (żywy test: klik przełącza `showWorkerOverlay`/
   `showResourceDepositOverlay`, overlay na mapie 3D faktycznie się pojawia/znika).
3. Klik chipa "Kultura" w górnym pasku przełącza `cultureRangeVisible` i podświetlenie na
   mapie faktycznie się pojawia/znika (żywy dowód, nie tylko wywołanie funkcji) — analogicznie
   dla "Religia"/`religionRangeVisible`. Dotychczasowe zachowanie chipów (panel
   szczegółów/`onOpenEmpireDetail`) NIE ginie — działa OBOK nowego toggle, nie zamiast niego
   (Operator dokumentuje dokładny UX w raporcie).
4. Nowy przycisk widoczności tras handlowych: klik przełącza `showTradeRoutesOverlay`; przy
   `false` istniejące trasy znikają z mapy 3D (żywy dowód), przy `true` wracają.
5. Territory toggle (granice) działa dokładnie jak dziś — zero regresji.
6. Żywy test Chromium (Playwright) potwierdzający kryteria 2-4 na faktycznie wyrenderowanej
   stronie (DOM przed/po klik, nie tylko odczyt kodu).
7. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone, istniejące testy minimap/hud (grep
   `gra/tools/*minimap*-test.cjs`, `gra/tools/*hud*-test.cjs`) nadal zielone lub świadomie
   zaktualizowane.

ALLOWLISTA (nic poza tym)
- gra/src/ui/minimapHud.ts (usunięcie mapBtn/searchBtn/workerBtn/depositBtn z `tools`,
  ewentualne rozszerzenie `MinimapLayerHooks` o trade-routes, nowy przycisk trade-routes).
- gra/src/ui/hud.ts (rozszerzenie `HudConfig`/`renderUtilDock` o worker/deposit, podpięcie
  toggle kultury/religii pod chipy w `handleHudBarAction`).
- gra/src/main.ts (WYŁĄCZNIE: nowa zmienna `showTradeRoutesOverlay` + guard +
  `toggleTradeRoutesOverlayOnMap()`, przeniesienie wiring worker/deposit hooks z
  `createMinimapHud()` do nowego miejsca w hud config, wpięcie toggle kultury/religii do
  wywołania z hud.ts — żadnych innych zmian).
- gra/src/ui/mapToolbarHud.ts — WYŁĄCZNIE jeśli Operator usuwa martwy kod
  `onOpenCulture`/`onOpenReligion`/`isCultureRangeActive`/`isReligionRangeActive` z
  `MapToolbarHudConfig` (opcjonalne, nie blokuje GOAL — jeśli pomija, zostawia jawną notatkę).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: gra/src/render/rangeOverlay.ts, gra/src/render/tradeRoutesOverlay.ts
(sama logika renderowania — jeśli Operator uzna zmianę tam za konieczną, DECISION_REQUIRED),
zmiana `territoryBtn`/`toggleTerritoryBorderOnMap`, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-minimapa-pasek-narzedzi, gałąź
autobot/R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania tematu wizualnego za zamknięty bez zrzutu/dowodu z ŻYWEGO Chromium pokazującego
faktyczny nowy układ (worker/deposit w rzędzie zoom, tylko 2 przyciski po prawej stronie
minimapy) — sam odczyt kodu nie jest dowodem. Zakaz założenia że przeniesienie hooków
worker/deposit do hud.ts jest bezproblemowe bez sprawdzenia cyklu życia (czy `createMinimapHud`
nadal działa poprawnie bez tych dwóch hooków, czy nie zostają osierocone odwołania).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
