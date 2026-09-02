TEMAT:  R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel: „Sprawdź jeszcze, czy w kartach jednostek zostały umieszczone
grafiki 3D jednostek, bo jest na to miejsce i nie wiem, czy to było zrobione."

## RECON (wykonany, nie powtarzać)
Podgląd 3D jednostki NA KARCIE ENCJI istnieje i działa, ale jest podłączony
WYŁĄCZNIE w jednym miejscu:
- `gra/src/ui/unitInfoCard.ts::buildUnitInfoCardViaEntityCard` (linie ~68-95)
  woła `unitAdapter(unit, {})`, po czym RĘCZNIE nadpisuje
  `cardData.medallion = { kind: 'unit3d', mount: (slot) =>
  mountUnitMiniPreview(slot, unit, ownerColor, fallbackMsg) }` — import z
  `./unitMiniPreview` (linia 33: `defaultOwnerColor, mountUnitMiniPreview`).
- JEDYNY wołający tej ścieżki: `gra/src/main.ts:19457`
  (`showUnitInfoCardDialog`), wpięty pod `onOpenUnitCard` w
  `gra/src/ui/armyListHud.ts` (lista armii gracza) — czyli TYLKO klik na
  jednostkę z listy armii pokazuje model 3D.
- `gra/src/ui/entityCards/unitAdapter.ts` (komentarz nagłówka, linie 26-33):
  adapter ZAWSZE zwraca DOMYŚLNY, statyczny medalion (`unitInfographicSvg`,
  płaska ikona SVG) — 3D jest ŚWIADOMIE „sprawą konkretnego wywołania", NIE
  częścią samych danych jednostki. To jest udokumentowana decyzja
  architektoniczna (T4), nie przeoczenie co do zasady — ale dziś tylko JEDEN
  z kilku call-site'ów faktycznie z niej korzysta.
- `gra/src/ui/cityPanel.ts::buildUnitDetailCardViaEntityCard` (linie
  7553-7563) — karta jednostki w PANELU MIASTA (rekrutacja, hover na liście
  do zbudowania — `attachHoverDetail`, linie 7671/7815/7872) woła
  `unitAdapter(u, {})` i renderuje WPROST, bez żadnego nadpisania medalionu
  — pokazuje TYLKO statyczną ikonę. To jest NAJCZĘŚCIEJ oglądana karta
  jednostki w grze (za każdym razem gdy gracz wybiera co budować).
- `gra/src/ui/entityCards/renderer.ts::buildEntityCardData` (linie 37-60,
  case `'unit'`) — generyczna ścieżka wołana m.in. przy KLIKNIĘCIU LINKU
  KRZYŻOWEGO z innej karty (np. „Odblokowuje jednostki" na karcie
  technologii) — woła `unitAdapter(row, ctx)` bez żadnego nadpisania
  medalionu — też tylko statyczna ikona.
- CivPedia (`wikiHubHud.ts`) NIE korzysta w ogóle z tego mechanizmu (osobny,
  czysto tekstowy system) — POZA ZAKRESEM tego tematu.

## GOAL
Rozszerz podgląd 3D (`mountUnitMiniPreview`/`defaultOwnerColor` z
`gra/src/ui/unitMiniPreview.ts`) na DWA dodatkowe miejsca, wzorem
DOKŁADNIE tego samego mechanizmu co `unitInfoCard.ts`:
1. `gra/src/ui/cityPanel.ts::buildUnitDetailCardViaEntityCard` — po
   `unitAdapter(u, data)`, przed `renderEntityCard`, nadpisz
   `built.medallion` na `{ kind: 'unit3d', mount: (slot) =>
   mountUnitMiniPreview(slot, u, defaultOwnerColor(), fallbackMsg) }`
   (fallback message dowolny, spójny tekstowo z `unitInfoCard.ts`). Import
   `mountUnitMiniPreview`/`defaultOwnerColor` BEZPOŚREDNIO z
   `./unitMiniPreview` (NIE przez `unitInfoCard.ts`, żeby uniknąć zbędnego
   powiązania dwóch modułów kart) — sprawdź najpierw, czy taki import nie
   tworzy cyklu (raczej nie powinien, `unitMiniPreview.ts` to
   niskopoziomowy moduł renderujący, ale ZWERYFIKUJ realnie przez `tsc`/
   build, nie zakładaj).
2. `gra/src/ui/entityCards/renderer.ts::buildEntityCardData`, case `'unit'`
   — analogiczne nadpisanie PO zbudowaniu danych przez `unitAdapter(row,
   ctx)`, tak żeby KAŻDE otwarcie karty jednostki (w tym linki krzyżowe z
   innych kart) miało 3D, nie tylko wybrane call-site'y. Jeśli to wymaga
   importu `unitMiniPreview.ts` bezpośrednio w `renderer.ts` (plik dziś
   generyczny, wspólny dla wszystkich 5 kinds) — to jest AKCEPTOWALNE
   (jednostki są jednym z kinds, ten import dotyczy wyłącznie ścieżki
   `case 'unit'`), ale NIE zmieniaj zachowania pozostałych 4 kinds
   (building/technology/improvement/wonder) — ich medalion ma zostać
   DOKŁADNIE taki jak dziś.
   UWAGA: jeśli po realnym sprawdzeniu ownerColor nie jest dostępny w
   `ctx: EntityCardCtx` na tym poziomie (generyczna ścieżka nie zna
   właściciela jednostki inaczej niż przez opcjonalny parametr) — użyj
   `defaultOwnerColor()` jako fallbacku (dokładnie jak w `unitInfoCard.ts`
   linia 73), NIE blokuj się na tym i nie zgaduj — to jest już istniejący,
   sprawdzony wzorzec w kodzie.
Zero zmian w istniejącym call-site `unitInfoCard.ts`/`armyListHud.ts` (już
działa poprawnie, ma zostać nietknięty).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód w headless Chromium: otwarcie karty JAKIEJKOLWIEK jednostki w
   panelu rekrutacji miasta (hover LUB klik na pozycji do zbudowania w
   `cityPanel.ts`) pokazuje faktycznie zamontowany podgląd 3D (canvas/WebGL
   renderer), NIE statyczną ikonę SVG — dowód: obecność realnego elementu
   canvas w DOM tej karty (ten sam marker/hook co na już działającej karcie
   z listy armii, np. `dataset.unit3dHook`), NIE sam fakt wywołania funkcji.
2. Żywy dowód: otwarcie karty jednostki przez link krzyżowy z INNEJ karty
   (np. klik „Odblokowuje jednostki" na karcie dowolnej technologii, która
   faktycznie odblokowuje jednostkę) pokazuje ten sam podgląd 3D.
3. Karta jednostki z listy armii (`armyListHud.ts` → `unitInfoCard.ts`,
   już istniejąca ścieżka) działa DOKŁADNIE jak dotychczas — zero regresu,
   dowód: ten sam żywy test co przed zmianą nadal przechodzi.
4. Pozostałe 4 kinds kart encji (building/technology/improvement/wonder) —
   ich medalion (statyczna ikona) BEZ ŻADNYCH zmian — dowód: żywy render
   po jednej karcie z każdego z 4 kinds, porównanie z zachowaniem sprzed
   zmiany.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy/rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-4.

## ALLOWLISTA — nic poza tym
`gra/src/ui/cityPanel.ts` (WYŁĄCZNIE `buildUnitDetailCardViaEntityCard`),
`gra/src/ui/entityCards/renderer.ts` (WYŁĄCZNIE ścieżka `case 'unit'` w
`buildEntityCardData`), nowy/rozszerzony plik testowy w `gra/tools/`.
Zakazane bezwzględnie: `gra/src/ui/unitInfoCard.ts`, `gra/src/ui/armyListHud.ts`,
`gra/src/ui/unitMiniPreview.ts` (istniejący mechanizm 3D — WYŁĄCZNIE
importowany, zero zmian w jego wnętrzu), `gra/data/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryteriów 1-4 za spełnione bez realnego zrzutu z żywej
przeglądarki (headless Chromium, realny render WebGL/canvas w DOM — nie sam
fakt, że kod WYWOŁUJE `mountUnitMiniPreview`, tylko że coś faktycznie
renderuje się w slocie). Jeśli WebGL jest niedostępny w headless Chromium
(realne ograniczenie środowiska CI) — dopuszczalne jest wykazanie że
`mountUnitMiniPreview` FAKTYCZNIE zostało wywołane z poprawnymi argumentami
(jednostka, kolor właściciela, slot DOM) i że fallback tekstowy („Render 3D
niedostępny...") renderuje się identycznie jak na już działającej karcie
listy armii w TYM SAMYM środowisku testowym — czyli parytet zachowania,
niekoniecznie realny obraz 3D, jeśli środowisko testowe tego nie pozwala
zweryfikować na ŻADNEJ karcie (udokumentuj wprost który przypadek zaszedł).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
