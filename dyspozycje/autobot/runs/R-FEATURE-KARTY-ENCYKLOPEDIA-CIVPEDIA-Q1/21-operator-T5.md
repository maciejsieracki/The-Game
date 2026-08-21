STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T5 „MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA"
GOAL: `cityPanel.ts` (`buildBuildingDetailCard`/`buildBuildingBuildTabDetailCard`) zaczyna
budować treść przez nowy `buildingAdapter.ts` i renderować przez wspólny `renderer.ts`
(rozszerzony o tryb `hover`), zamiast własnego DOM-buildera — bez zmiany publicznych
sygnatur, bez zauważalnego opóźnienia hover w zakładce Budowa / liście posiadanych
budynków.

## Co zostało zrobione

1. `gra/src/ui/entityCards/buildingAdapter.ts` — wypełniony pełną treścią (był
   szkieletem-placeholderem z T1), czytając `buildings.json` 1:1 jak dawny
   `cityPanel.ts::buildBuildingDetailCard`: sekcje „Charakterystyka" (kategoria/epoka
   wejścia/typ/poziom w mieście), „Plony i efekty" (YIELD_BRAND + skala poziomów L1..Ln +
   bonus mnożnika jednostek `mnoznikRoleForBuildingId`/`cumulativeMnoznikForBuildingId` +
   obrona strukturalna `buildingStructuralDefenseBonusLine`), „Koszty budowy i utrzymania"
   (koszt budowy przez `itemCost`+`buildingWorkCost`, przyrost kosztu, utrzymanie przez
   `buildingUpkeep`/`buildingResourceUpkeep`, przyrost utrzymania, koszt surowcowy przez
   `buildingStockCost`), „Poziomy" (maks. poziom + nazwy przycięte do `maksPoziom`),
   „Wymagania budynku". Adapter jest SAMOWYSTARCZALNY: czyta `buildings.json` bezpośrednio
   (jak `registry.ts`/`unitAdapter.ts`) i importuje WYŁĄCZNIE czyste funkcje z `game/*`
   (`production.ts`, `economy-upkeep.ts`, `building-stock-cost.ts`,
   `unit-building-bonuses.ts`, `building-upgrades.ts`) — zero I/O, zero ciężkich obliczeń
   (wymóg wydajności hover z dispatchu).
   Stan zależny od miasta/gracza (poziom budynku w mieście, tempo kosztu, trudność —
   dziś `cfg.getEpoch`/`cfg.getUnlockedTechs`/`cfg.getBuildingCostPace`/`cfg.getDifficulty`,
   PRYWATNA konfiguracja `cityPanel.ts`), którego adapter NIE MOŻE policzyć sam, host
   wylicza RAZ i przekazuje przez `ctx.city` jako nowy typ `BuildingCardCityState`
   (`hasCity`/`displayLevel`/`buildCostPace`/`difficulty`/`ownerId`) — `ctx.city` jest
   `unknown` w ogólnym kontrakcie (`types.ts`, poza allowlistą T5), więc kształt jest
   lokalny dla tego adaptera, bez zmiany `types.ts`.
   ŚWIADOMIE NIE w adapterze (host dopełnia po `renderEntityCard()`, wzorem T3/T4):
   sekcja „Technologie" (`appendTechDetailBlock` — plan architektury §3 krok 2 explicite
   każe zostawić ją nietkniętą do T10, współdzieloną z kartą jednostki) i „Uwagi"
   (`playerFacingNote`).
2. `gra/src/ui/cityPanel.ts` — `buildBuildingDetailCard(def, data, city?)` (sygnatura BEZ
   ZMIAN): nowa wewnętrzna ścieżka `buildBuildingDetailCardViaEntityCard` woła
   `buildingAdapter(def, {city: cityState})` + `renderEntityCard(built)`, dopełnia
   Technologie/Uwagi, całość w `try/catch` z fallbackiem do **`_legacyBuildBuildingDetailCard`**
   (stara implementacja przeniesiona 1:1 pod prywatną nazwą, ZERO zmian treści — `git diff`
   potwierdza że jedyna różnica w starym kodzie to nazwa funkcji). `buildBuildingBuildTabDetailCard`
   NIE zostało w ogóle dotknięte (zero zmian w jego ciele) — nadal woła
   `buildBuildingDetailCard(def, data, city)` i operuje na zwróconym `HTMLDivElement`
   dokładnie jak dziś (insertBefore/appendChild dodatkowych kafli Wymagane/Niedostępne/
   Daje/Łańcuch/Akcje działają identycznie niezależnie od wewnętrznej implementacji karty
   bazowej).
   Style: nowy `ensureEntityCardBuildingStyles()` (wołany lazily wewnątrz
   `buildBuildingDetailCardViaEntityCard`, NIE w głównym `ensureStyles()`/`css` template,
   bo ten jest poza allowlistą T5) wstrzykuje `ENTITY_CARD_CSS` + lokalny override
   dopasowujący szerokość karty (bazowo 434px) do hover-docku panelu miasta
   (`HOVER_DETAIL_DOCK_W`=400px) i pływającego tooltipu.
3. `gra/src/ui/entityCards/renderer.ts` — NOWY tryb `openEntityCard(kind, id, {mode:'hover',
   container: anchor})`: doczepia się do `attachHoverDetail(anchor, buildContent, 220, 'left')`
   (`hoverDetailDock.ts`) zamiast backdropu (`dialog`)/natychmiastowego appendChild (`inline`).
   `opts.container` jest REUŻYTY jako anchor (types.ts poza allowlistą T5, brak osobnego pola
   `anchor` w kontrakcie — udokumentowane w kodzie). KRYTYCZNE dla wydajności: `buildEntityCardData`/
   `renderEntityCard` wołane DOPIERO wewnątrz callbacku `attachHoverDetail`, czyli dopiero po
   faktycznym hoverze + delayu — zero kosztu przy samym `openEntityCard(...)` (zweryfikowane
   testem realnej przeglądarki, patrz TESTY).

## Znane, świadome delty (jak nakazuje dispatch — analogia do T3/T4)

- **Wartości bez inline-ikon.** Kontrakt `EntityCardRow.value` to `.textContent` (zwykły
  tekst), nie `.innerHTML` jak dawny `gridDetailRow()` (przez `cpInlineIcons()`). Wartości,
  które dawniej miały wtrąconą ikonkę zasobu obok liczby (Praca/Pieniądz/itd.), dziś pokazują
  SAM TEKST (np. "150 pkt Pracy" zamiast "150[ikona] pkt Pracy") — treść identyczna, brak
  dekoracyjnej ikonki inline. Ten sam rodzaj delty co „Kontry" w T4.
- **Mnożnik/obrona strukturalna jako zwykłe wiersze**, nie osobne chipy — treść (wartości %)
  identyczna z dawnym `buildBuildingDetailCard`, układ (wiersz siatki zamiast wolnostojącego
  tekstu) inny.
- **Medalion**: prawdziwa ikona budynku (`buildingIconSvg(building, building.id)`, ten sam
  SVG co dawny `makeBuildingThumb`/`buildingIconHtml`) — BEZ delty (lepsza parytet niż
  placeholder-owy szkielet T1, który miał generyczny kwadrat z literą „B").

## TESTY

- `cd gra && npx tsc --noEmit` → **czysto, exit 0** (żaden błąd; brak nawet
  pre-istniejącego ostrzeżenia TS5101 widocznego w tym przebiegu).
- `node gra/tools/entity-card-contract-test.cjs` (T1, renderer+wszyscy adapterzy) →
  **75 pass, 0 fail** — `building` kind nadal poprawny z NOWĄ treścią adaptera.
- `node gra/tools/unit-info-card-contract-test.cjs` → **23 pass, 0 fail** (bez zmian).
- `node gra/tools/unit-info-card-wiring-test.cjs` → **6 pass, 0 fail**.
- `node gra/tools/unit-info-card-army-interaction-test.cjs` → **7 pass, 0 fail**.
- `node gra/tools/unit-info-card-badges-real-render-test.cjs` (real Chromium) →
  **19 pass, 0 fail**.
- `node gra/tools/unit-info-card-entitycard-migration-test.cjs` → **26 pass, 0 fail**.
- `node gra/tools/technology-discovery-card-visual-test.cjs` → **48 PASS, 0 FAIL**.
- `node gra/tools/tech-discovery-card-click-test.cjs` → **13 PASS, 0 FAIL**.
- `node gra/tools/tech-discovery-card-real-click-test.cjs` (real Chromium) →
  **12 PASS, 0 FAIL**.
- **NOWY** `node gra/tools/building-detail-card-entitycard-migration-test.cjs` (esbuild+jsdom,
  bunduje PRAWDZIWY `entityCards/renderer.ts`, real `buildings.json`) → **52 pass, 0 fail**:
  (A) treść `buildingAdapter` na realnym budynku „stolarnia" wiersz-po-wierszu (Charakterystyka/
  Plony/Koszty/Poziomy/Wymagania/civpediaLink, w tym numeryczna weryfikacja
  `buildingEffectAtLevel`/skali poziomów/kosztu surowcowego ×2 FALA2), tryb podglądu bez
  miasta (L1 fallback); (B) `mode:'hover'` — lazy build potwierdzony (brak karty w DOM zaraz
  po `openEntityCard`, nadal brak tuż po `mouseenter`, obecna dopiero po >220ms); (C)
  text-anchor + mutacyjny self-check na `cityPanel.ts` (fallback try/catch, wołanie
  `buildingAdapter`/`renderEntityCard`, `buildBuildingBuildTabDetailCard` bez zmian) — mutacja
  usuwająca fallback złapana czerwono.
- **NOWY** `node gra/tools/building-detail-card-hover-layout-real-render-test.cjs`
  (Playwright/Chromium realny, WYMAGANY dispatchem dla twierdzeń o layoucie/hover-timingu —
  precedens `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1`) → **11 pass, 0 fail**: REALNA geometria
  Chromium potwierdza kartę budynku (bazowo 434px) mieszczącą się w 400px-owym hover-docku po
  CSS override (ten test w pierwszym przebiegu ZŁAPAŁ realną regresję — karta o 2px szersza
  od docku, `box-sizing` domyślny content-box + border 1px×2 — naprawione dodaniem
  `box-sizing:border-box` do override'u, potwierdzone drugim zielonym przebiegiem); hover
  end-to-end (`page.hover()` realny, nie syntetyczny dispatch) pokazuje kartę dopiero >220ms
  po najechaniu, chowa po `mouseleave`+`HIDE_DELAY`; zero błędów konsoli/pageerror.
- Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir <scratch>
  --emptyOutDir` (z `gra/`) → **✓ built in 22.06s**, 845 modułów, brak błędów. (Procedura
  jak w T3/T4: worktree bez `node_modules` — tymczasowy symlink do `node_modules` głównego
  repo po weryfikacji identycznego `package.json`/`package-lock.json`; symlink i katalog
  scratch usunięte po weryfikacji, `git status` czysty poza plikami produkcyjnymi/testowymi
  tego kroku.)

## ZMIANY/COMMIT

Pliki zmienione (poza tym raportem):
- `gra/src/ui/entityCards/buildingAdapter.ts` (pełna treść zamiast szkieletu T1)
- `gra/src/ui/entityCards/renderer.ts` (nowy tryb `mode:'hover'` w `openEntityCard`,
  addytywne — `dialog`/`inline` bez zmian)
- `gra/src/ui/cityPanel.ts` (nowa ścieżka T5 w `buildBuildingDetailCard` + fallback prywatny
  `_legacyBuildBuildingDetailCard`; `buildBuildingBuildTabDetailCard` NIETKNIĘTE — zero
  zmian w jego ciele; dodane 2 importy modułowe i 1 stała/funkcja pomocnicza stylów —
  nieuniknione minimalne wyjątki od dosłownej allowlisty „TYLKO te dwie funkcje", bo importy
  są z natury na poziomie modułu, ten sam precedens co T3/T4 dodające importy do swoich
  plików-hostów)
- `gra/tools/building-detail-card-entitycard-migration-test.cjs` (nowy test, 52 asercji)
- `gra/tools/building-detail-card-hover-layout-real-render-test.cjs` (nowy test, real
  Chromium, 11 asercji)

Zero zmian w: `main.ts`, `entityCards/{types,slug,registry,unitAdapter,technologyAdapter,
improvementAdapter}.ts`, `unitInfoCard.ts`, `techDiscoveryNotice.ts` — potwierdzone
`git diff --stat` (puste dla tych plików). Commit lokalny na branchu
`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (SHA — patrz `git log -1` po commicie
tego raportu razem z kodem).

## BLOKADY

Brak. Rozszerzenie renderera o tryb `hover` było możliwe BEZ zmiany `types.ts`
(`opts.container` już istniejące w kontrakcie zostało reużyte jako punkt zaczepienia hover),
więc allowlista T5 (renderer.ts rozszerzenie, bez types.ts) została w pełni dotrzymana bez
potrzeby zgłaszania BLOCK. Jedyne odstępstwa od dosłownej allowlisty `cityPanel.ts` to
nieuniknione importy modułowe (patrz ZMIANY/COMMIT) — udokumentowane, nie ukryte.

## NASTĘPNY KROK

Evaluator → Final Control tego kroku (T5) → integracja orkiestratora. Rozważyć dla
właściciela (poza zakresem T5): T6 (MIGRACJA-KARTA-JEDNOSTKI-PANEL-MIASTA, zależny od T5)
może reużyć ten sam wzorzec `mode:'hover'` w `renderer.ts` bez dalszych zmian kontraktu.

DEPLOY/PUSH: NIE WYKONANO
