TEMAT:  R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat GRAFICZNY/WIZUALNY (R-PROC-AUTOBOT.md §5a) —
Operator Opus 5 effort=medium / Evaluator Opus 5 effort=high / Final Control
Sonnet 5 effort=high (Final Control zostaje na Sonnet 5, tylko Operator+
Evaluator na Opus 5).

## WYZWALACZ
Właściciel, po obejrzeniu zrzutów kart "Wojownik"/"Zwiadowca": "Wydaje mi
się, że można byłoby jakoś ładnie wkomponować grafiki jednostek, grafiki
3D... nie wygląda to zbyt ciekawie." Orkiestrator zbudował i opublikował
makietę (artefakt claude.ai) z 3 wariantami w skali 1:1 względem realnego
`ENTITY_CARD_CSS`. Właściciel wybrał: **Wariant A — diorama na całą
szerokość karty** ("wariant a zrob i potem deploy").

## RECON (wykonany, nie powtarzaj)
Mechanizm dzisiejszy: `renderEntityCard` (gra/src/ui/entityCards/renderer.ts,
zaczyna się linia 283). Header row budowany liniami 288-310: `header` div
(288), medallion (34×34px, `.entity-card-medallion`, slot z linii 274)
dołączony 289-290, `title-wrap`/`title-row`/`<h2>`/ewentualne odznaki statusu
292-303, `.entity-card-subtitle` 304-308, `header.appendChild(titleWrap)`
309, `card.appendChild(header)` 310. CSS: `.entity-card-header` linia 524,
`.entity-card-medallion{width:34px;height:34px;flex:none;}` linia 526.

Medallion zawiera: dla `kind==='unit'` (dokładniej `medallion.kind==='unit3d'`
w danych adaptera) — zamontowany, CACHE'OWANY, JEDNORAZOWY snapshot WebGL
(`unitMiniPreview.ts::mountUnitMiniPreview`, tani technicznie, nie jest
żywym/animowanym renderem); dla pozostałych 4 rodzajów (`kind==='icon'`) —
płaski SVG.

Kolejność DOM od tego sezonu (po `P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1`,
zintegrowane `5f9e8c41`): header → historia ("Rys historyczny") → body
(sekcje/statystyki). Ta kolejność MUSI zostać zachowana — diorama zastępuje
WYŁĄCZNIE dzisiejszy `header`, nie zmienia pozycji historii/body względem
siebie.

`.entity-card--compact` (renderer.ts:255, ustawiane gdy
`data.compactHeaderOnExpand===true`) JEST aktywnie używane —
`technologyAdapter.ts:291` ustawia tę flagę dla zagnieżdżonej, paginowanej
listy podglądów jednostek w karcie technologii (dokumentacja w
`types.ts:108-113`). W tym trybie medalion kurczy się do 24×24px
(`renderer.ts:619`). Diorama pełnej szerokości byłaby w tym kontekście
absurdalnie duża (wiele wierszy listy naraz) — TRYB COMPACT MA POZOSTAĆ
BEZ ZMIAN, ze starym, małym layoutem header+medallion. Diorama dotyczy
WYŁĄCZNIE normalnego (non-compact) nagłówka karty.

Testy zweryfikowane pod kątem ryzyka regresji: ŻADEN test w `gra/tools/*.cjs`
nie sprawdza rozmiaru/pikseli medalionu (34px/24px) — zmiana rozmiaru jest
bezpieczna. `unit-card-3d-preview-coverage-test.cjs` i
`unit-info-card-entitycard-migration-test.cjs` sprawdzają WYŁĄCZNIE TREŚĆ
(czy `.entity-card-medallion` zawiera zamontowany canvas 3D / fallback,
czy medalion jest dołączony do DOM przed montażem) — powinny przejść bez
zmian, JEŚLI element z klasą `entity-card-medallion` nadal istnieje i nadal
jest dołączony do drzewa PRZED montażem 3D, niezależnie od tego, gdzie
wewnątrz diaromy się znajduje. `entity-card-historia-section-test.cjs`
(zintegrowany w tej sesji) sprawdza WYŁĄCZNIE że historia poprzedza
sekcje `body` — nie odwołuje się do kształtu headera, powinien przejść BEZ
ŻADNYCH zmian, o ile diorama nadal jest dołączana do `card` PRZED historią.

## GOAL
Dla NORMALNEGO (non-compact) nagłówka karty encji: zastąp dzisiejszy mały
header row (34×34 medalion obok tytułu) pełnoszerokościową dioramą
(~180-200px wysokości) na samej górze karty, wzorem zaakceptowanego
Wariantu A z makiety:
- Tło sceny: ciemny gradient spójny z istniejącą paletą karty (np.
  pochodna `linear-gradient(180deg,#232c39,#161d27,#0c1017)` lub zbliżona,
  dopasowana do istniejących tokenów `--tg-gold-primary`/kolorów karty w
  `ENTITY_CARD_CSS`), delikatna winieta (radial-gradient przyciemniający
  krawędzie) dla czytelności tekstu na dole.
- WEWNĄTRZ diaromy: TEN SAM element medalionu (`.entity-card-medallion` lub
  jego odpowiednik) z TĄ SAMĄ zawartością co dziś (zamontowany 3D
  WebGL dla jednostek / SVG dla pozostałych 4 rodzajów) — wyłącznie
  większy i wyśrodkowany, plus delikatny cień/elipsa "gruntu" pod nim.
- Tytuł (`<h2>`) i podtytuł (`.entity-card-subtitle`) przenoszą się z
  dotychczasowego wiersza headera do overlay w lewym dolnym rogu diaromy,
  czytelne dzięki text-shadow na ciemnym tle. Ewentualne odznaki
  statusu z dotychczasowego title-row (jeśli jakaś karta je ustawia) —
  zachowaj widoczne i funkcjonalne, rozsądnie umieszczone (np. obok
  tytułu w tym samym overlay) — nie jest to twarde kryterium formy, ale
  MUSZĄ pozostać widoczne i klikalne jeśli były klikalne.
- Tryb `.entity-card--compact` (uzywany przez `technologyAdapter.ts` dla
  zagnieżdżonej listy jednostek) POZOSTAJE CAŁKOWICIE BEZ ZMIAN — stary
  mały header+24px medalion, ZERO diaromy w tym trybie.
- Kolejność DOM w karcie: diorama → historia → body — diorama zastępuje
  WYŁĄCZNIE dzisiejszy `header`, nie przesuwa historii/body.
- Zero zmian w adapterach (unitAdapter.ts/buildingAdapter.ts/
  technologyAdapter.ts/improvementAdapter.ts/wonderAdapter.ts),
  `wikiHubHud.ts`, `unitMiniPreview.ts`, `gra/data/**` — to WYŁĄCZNIE
  restrukturyzacja renderer.ts (markup + CSS) konsumująca ISTNIEJĄCE pola
  `EntityCardData` (title/subtitle/medallion), nie nowe dane.
- OPCJONALNY BONUS (NIE jest kryterium końca, dodaj TYLKO jeśli trywialne
  i tanie): delikatny efekt CSS 3D tilt/rotate na hover nad diaromą
  (transformacja płaszczyzny istniejącego zamontowanego elementu, nie
  nowa logika 3D) — z makiety Wariantu A. Pomiń bez wahania jeśli
  komplikuje implementację.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywe zrzuty z prawdziwego Chromium (`page.screenshot()`, Playwright —
   R-PROC-AUTOBOT.md §9 pkt 6a, bezwarunkowa bariera dla tematu
   wizualnego/UX): (a) karta jednostki (non-compact) — diorama pełnej
   szerokości, wewnątrz WIDOCZNIE zamontowany, powiększony podgląd 3D,
   tytuł/podtytuł czytelne w lewym dolnym rogu na ciemnym tle; (b) karta
   budynku LUB cudu (non-compact) — diorama z powiększoną, wyśrodkowaną
   ikoną SVG; (c) karta technologii w trybie compact (zagnieżdżona lista
   jednostek w karcie technologii, `compactHeaderOnExpand`) — POTWIERDZONY
   BRAK diaromy, stary mały layout header+24px medalion nietknięty.
2. `unit-card-3d-preview-coverage-test.cjs` i
   `unit-info-card-entitycard-migration-test.cjs`: PASS. Dozwolona
   aktualizacja WYŁĄCZNIE selektorów ścieżki DOM do medalionu (jeśli
   diorama go zagnieżdża inaczej) — asercje TREŚCI (czy 3D się zamontował,
   czy fallback się pokazał) muszą pozostać semantycznie identyczne.
3. `entity-card-historia-section-test.cjs`: PASS BEZ JAKICHKOLWIEK zmian w
   tym pliku (dowód że kolejność diorama→historia→body jest zachowana).
4. Szerokość karty NIENARUSZONA: `.entity-card{width:min(434px,calc(100vw
   - 32px))}` bez zmian, diorama nie powoduje poziomego overflow przy
   żadnej szerokości karty (test przy min. 2 szerokościach viewportu).
5. Diff ograniczony do `renderer.ts` (markup+CSS w `renderEntityCard`/
   `ENTITY_CARD_CSS`) + WYŁĄCZNIE niezbędne aktualizacje selektorów w
   `unit-card-3d-preview-coverage-test.cjs`/
   `unit-info-card-entitycard-migration-test.cjs` (jeśli w ogóle
   potrzebne) + nowy plik testowy w `gra/tools/` pokrywający layout
   diaromy i tryb compact. Zero zmian w adapterach, `wikiHubHud.ts`,
   `unitMiniPreview.ts`, `gra/data/**`, `entity-card-historia-section-test.cjs`.
6. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + WSZYSTKIE istniejące testy kart encji bez regresu: `entity-card-
   contract-test.cjs`, `entity-card-historia-section-test.cjs`,
   `entity-card-action-buttons-real-render-test.cjs`, `entity-card-cross-
   links-nested-overlay-test.cjs`, `entity-card-wonder-test.cjs` (lub jego
   aktualna nazwa), `unit-card-3d-preview-coverage-test.cjs`,
   `unit-info-card-entitycard-migration-test.cjs`, plus nowy test.

## ALLOWLISTA — nic poza tym
`gra/src/ui/entityCards/renderer.ts` (markup+CSS w `renderEntityCard` i
`ENTITY_CARD_CSS`), `gra/tools/unit-card-3d-preview-coverage-test.cjs` i
`gra/tools/unit-info-card-entitycard-migration-test.cjs` (WYŁĄCZNIE jeśli
selektor ścieżki do medalionu musi się zmienić — preferuj NIE ruszać jeśli
się da), nowy plik testowy w `gra/tools/`. Zakazane bezwzględnie:
`unitAdapter.ts`, `buildingAdapter.ts`, `technologyAdapter.ts`,
`improvementAdapter.ts`, `wonderAdapter.ts`, `wikiHubHud.ts`,
`unitMiniPreview.ts`, `gra/data/**`, `entity-card-historia-section-test.cjs`
(musi przejść BEZ zmian), `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Temat wizualny/UX — zakaz uznania KTÓREGOKOLWIEK z kryteriów wizualnych za
spełnione bez realnego zrzutu `page.screenshot()` z żywego Chromium
(R-PROC-AUTOBOT.md §9 pkt 6a, bezwarunkowe, bez ECHO na osłabienie). Zakaz
uznania kryterium 3 za spełnione bez faktycznego uruchomienia
`entity-card-historia-section-test.cjs` w stanie NIETKNIĘTYM. Zakaz
"naprawienia" trybu compact przez przypadkowe zastosowanie diaromy też tam
— kryterium 1c wymaga jawnego, żywego dowodu że compact PRZETRWAŁ
nietknięty.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Opus 5) → Evaluator (Opus 5, zarzuty, lista może być pusta) →
Operator (Obrona, Opus 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
