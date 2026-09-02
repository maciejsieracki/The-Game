TEMAT:  P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel, zrzuty ekranu kart "Wojownik"/"Zwiadowca": "Poza tym opisy
przeniósłbym na samą górę, ponad statystykami, żeby gracz mógł zapoznać się
z charakterem jednostki, budynku, cudu czy badania, a potem zobaczyć inne
statystyki." Dotyczy WSZYSTKICH typów kart encji (jednostki, budynki, cuda,
technologie/badania).

## RECON (wykonany przez Explore, nie powtarzać)
Wspólny renderer: `gra/src/ui/entityCards/renderer.ts::renderEntityCard`
(zaczyna się linia 283) — JEDYNY DOM-builder używany przez wszystkie 5
rodzajów encji (unit/building/technology/improvement/wonder) i wszystkie
call site'y (techDiscoveryNotice.ts, cityPanel.ts, unitInfoCard.ts,
buildModeHud.ts dla cudów).

Dokładne miejsce (renderer.ts:313-337): najpierw budowany jest `body`
(sekcje z `data.sections[]`, w tym "Charakterystyka" — zwykła sekcja jak
każda inna, NIE wyróżniona strukturalnie), `card.appendChild(body)`.
BEZPOŚREDNIO POTEM, twardo w kodzie renderEntityCard (nie w tablicy
sections): `if (data.historicalNote) { ... card.appendChild(historia); }`
— blok "Rys historyczny" doklejany jako rodzeństwo `body`, PO nim.

Kolejność jest kontrolowana WYŁĄCZNIE sekwencją `card.appendChild()` w
`renderEntityCard`, nie pozycją w jakiejś uporządkowanej liście. Header/
tytuł/medalion (renderer.ts:288-311) jest strukturalnie osobny i zawsze
zostaje NAD wszystkim, niezależnie od zmiany.

JEDEN wspólny punkt wstawienia — potwierdzone że wszystkie 4 adaptery
(unitAdapter.ts/buildingAdapter.ts/technologyAdapter.ts/improvementAdapter.ts)
oraz wonderAdapter.ts TYLKO wypełniają `EntityCardData.sections[]` i
`.historicalNote` — żaden nie dotyka kolejności DOM. Cuda (wonderAdapter.ts)
używają TEGO SAMEGO `renderEntityCard`, nie osobnego systemu renderowania
(wcześniejsza notatka w rejestrze o "osobnym systemie" dotyczyła tylko
osobnego pliku adaptera, nie osobnego DOM-buildera).

Test asercji KOLEJNOŚCI (do naprawy w tym samym dispatchu):
`gra/tools/entity-card-historia-section-test.cjs:220-236` — dziś sprawdza
`historiaAfterSections` (historia MA być PO sekcjach). Ta asercja musi zostać
ODWRÓCONA (historia PRZED sekcjami) po zmianie.

WAŻNE, POZA ZAKRESEM: `gra/src/ui/wikiHubHud.ts:323-327` (widok CivPedia)
to NIEZALEŻNA ścieżka składania tekstu markdown (nie DOM renderEntityCard),
też dokleja `## Rys historyczny` na końcu treści (`${entry.full}${historiaBlock}`).
To OSOBNY system (CivPedia vs karty encji — ustalone architektonicznie
wcześniej w tej sesji) — NIE dotykaj go w tym temacie.

## GOAL
W `renderer.ts::renderEntityCard`: zmień kolejność `card.appendChild()` tak,
aby blok "Rys historyczny" (`historia`, budowany z `data.historicalNote`)
renderował się PRZED sekcją `body` (statystyki/Charakterystyka/etc.), ale
NADAL PO bloku header/tytuł/medalion (który zostaje na górze bez zmian).
Zero zmian w treści/zawartości którejkolwiek sekcji — wyłącznie kolejność.
Dotyczy WSZYSTKICH 5 rodzajów encji przez ten jeden wspólny mechanizm —
zero zmian w adapterach (unitAdapter.ts/buildingAdapter.ts/
technologyAdapter.ts/improvementAdapter.ts/wonderAdapter.ts).
Zero zmian w `wikiHubHud.ts` (CivPedia — osobny system, poza zakresem).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód w headless Chromium: otwórz kartę jednostki (np. Wojownik),
   kartę budynku, kartę cudu i kartę technologii (4 rodzaje z realną treścią
   `historia` w danych) — w KAŻDYM przypadku sekcja "Rys historyczny" jest
   w DOM PRZED sekcją "Charakterystyka"/blokiem statystyk, i PO bloku
   header/tytuł/medalion.
2. `entity-card-historia-section-test.cjs` zaktualizowany: asercja
   `historiaAfterSections` odwrócona na `historiaBeforeSections` (albo
   analogiczny, jawnie nazwany warunek) — test świadomie CZERWIENIEJE na
   kodzie SPRZED tej zmiany (dowód nietautologiczności, np. `git stash`),
   ZIELENIEJE po zmianie.
3. Zero zmian w zawartości/treści którejkolwiek sekcji (tylko kolejność DOM)
   — potwierdzone że wszystkie dotychczasowe testy zawartości kart
   (`entity-card-contract-test.cjs` i inne bramki kart encji) nadal PASS
   bez modyfikacji ich własnej logiki (poza ewentualną zmianą oczekiwanej
   KOLEJNOŚCI, jeśli jakiś inny test też nieumyślnie zakłada starą
   kolejność — sprawdź i napraw jeśli tak, udokumentuj w raporcie).
4. Diff ograniczony do `renderer.ts` (WYŁĄCZNIE kolejność wywołań
   `appendChild` w `renderEntityCard`) + `entity-card-historia-section-test.cjs`
   (WYŁĄCZNIE odwrócenie asercji kolejności). Zero zmian w adapterach,
   `wikiHubHud.ts`, `gra/data/**`.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   zaktualizowany test historia-section + `entity-card-contract-test.cjs`
   bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/entityCards/renderer.ts` (WYŁĄCZNIE kolejność `appendChild` w
`renderEntityCard`, zero zmian logiki budowania treści sekcji),
`gra/tools/entity-card-historia-section-test.cjs` (WYŁĄCZNIE asercja
kolejności). Zakazane bezwzględnie: `unitAdapter.ts`, `buildingAdapter.ts`,
`technologyAdapter.ts`, `improvementAdapter.ts`, `wonderAdapter.ts`,
`wikiHubHud.ts`, `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1 za spełnione bez realnego, żywego zrzutu DOM z
przeglądarki (nie samego czytania kodu). Zakaz uznania kryterium 2 za
spełnione bez faktycznego uruchomienia zaktualizowanego testu NA KODZIE
SPRZED ZMIANY i pokazania że wtedy czerwienieje (dowód że test faktycznie
coś sprawdza, nie jest tautologiczny wobec nowego kodu).

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
