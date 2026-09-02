TEMAT:  R-KARTY-HISTORIA-INFRA-CUDA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 16/17 projektu `R-KARTY-HISTORIA-Q1`. Cztery z pięciu kategorii encji
(budynki 41/41, technologie 32/32, ulepszenia terenu 22/22, jednostki 75/75)
mają już pełny rys historyczny przez wspólny system `entityCards/`. Cuda
(wonders, `gra/data/wonders.json`) są JEDYNĄ pozostałą kategorią — i, w
odróżnieniu od pozostałych czterech, NIE mają dziś ŻADNEJ karty encji do
migracji: klik cudu na liście budowy WYŁĄCZNIE uzbraja tryb postawienia na
mapie (`onSelectWonder`), nie otwiera żadnego podglądu.

## RECON (wykonany, nie powtarzać)
- `gra/data/wonders.json`: obiekt z kluczami `_meta`, `cuda` (tablica, 19
  aktywnych cudów: `id, nazwa, nazwaAlt?, dostep, cywilizacje, techUnlock,
  wymagaTerenu, epokaWejscia, absolut, maxNaSwiecie, kosztBudowy, utrzymanie,
  bonusy, uwagi?`), `panstwa` (kolejność per cywilizacja), `parkowane_epoka4plus`
  (5 nieaktywnych, `aktywne:false` — POZA ZAKRESEM tego tematu, nie dodawaj im
  karty ani pola `historia`). Zero pola `historia`/`Historia` dziś.
- `gra/src/ui/entityCards/types.ts:11`: `EntityKind = 'unit' | 'building' |
  'technology' | 'improvement'` — brak `'wonder'`.
- `gra/src/ui/entityCards/renderer.ts`: `buildEntityCardData(kind, id, ctx)`
  ma `switch` z jedną gałęzią `case '<kind>':` per typ, wołającą
  `resolve<Kind>Row(id)` z `registry.ts` i przekazującą surowy wiersz do
  adaptera. `openEntityCard(kind, id, opts)` to publiczny punkt wejścia
  (`{mode:'dialog'}` już używany np. przez ulepszenia terenu).
- `gra/src/ui/entityCards/registry.ts:60-63`: wzorzec resolvera —
  `resolveImprovementRow` odczytuje z płaskiej mapy zbudowanej z
  `terrain-improvements.json`. `wonders.json` NIE jest płaską mapą (cud żyje
  w tablicy `cuda`) — resolver dla cudów musi zbudować mapę `id → wiersz` z
  tej tablicy (WYŁĄCZNIE z `cuda`, nie z `parkowane_epoka4plus`).
- `gra/src/ui/entityCards/improvementAdapter.ts` to wzorcowy, w pełni
  wypełniony adapter (sekcje, `hasValue()`, `historicalNote:
  hasValue(row.historia) ? text(row.historia) : undefined` na końcu) —
  skopiuj ten wzorzec strukturalnie dla cudów.
- `gra/src/ui/buildModeHud.ts:700-756`: ISTNIEJĄCY, gotowy wzorzec ikonki
  info dla wierszy `.civ-build-item` (użyty dziś dla ulepszeń terenu):
  osobny `<span class="civ-build-info-ic" role="button" tabindex="0"
  title="..." aria-label="...">ⓘ</span>` na KOŃCU wiersza (po etykiecie
  kosztu — ZGŁOSZENIE właściciela `P-ULEPSZENIA-INFO-IKONA-POZYCJA-Q1`
  wymagało tej pozycji, żeby nie łapać przypadkowych kliknięć w nazwę),
  osobny listener z `stopPropagation()` wołający `openEntityCard('<kind>',
  id, {mode:'dialog'})`, DZIAŁA nawet gdy wiersz jest `locked` (podgląd karty
  to nie akcja budowy). CSS `.civ-build-info-ic` (linie 252-255) jest
  GENERYCZNY, nie scoped do ulepszeń — używalny wprost dla cudów.
  Wiersz cudu (`.civ-build-item.wonder`, linie 530-536) i jego listener
  (linie 767-786, `onSelectWonder`) NIE MAJĄ dziś tej ikonki.

## GOAL
1. `gra/src/ui/entityCards/types.ts`: dodaj `'wonder'` do unii `EntityKind`.
2. `gra/src/ui/entityCards/registry.ts`: dodaj `resolveWonderRow(id)` —
   buduje (raz, przy imporcie modułu) mapę `id → wiersz` z tablicy `cuda` w
   `wonders.json`, zwraca wiersz albo `null`. Zdefiniuj typ `WonderRow`
   (pola jak w recon wyżej) i wyeksportuj analogicznie do `ImprovementRow`.
3. Nowy `gra/src/ui/entityCards/wonderAdapter.ts` — wzorem
   `improvementAdapter.ts`: sekcje np. „Dostępność" (Cywilizacje/Dostęp/
   Epoka wejścia/Wymagany teren), „Koszt i utrzymanie" (Koszt budowy/
   Utrzymanie/Maks. na świecie), „Bonusy" (rozbicie `bonusy`), link do
   `techUnlock` przez `resolveTechnologyRow`/`technologyIdFromName` jeśli
   pasujący wiersz istnieje (wzorem `improvementAdapter.ts` dla `tech`).
   `historicalNote: hasValue(wonder.historia) ? text(wonder.historia) :
   undefined` — pole `historia` (lowercase, konwencja spójna z
   `buildings.json`/`terrain-improvements.json`) NIE jest jeszcze w danych,
   ta runda to WYŁĄCZNIE mechanizm. Pole `uwagi` (istniejące w danych) MA
   POZOSTAĆ NIERENDEROWANE na karcie — ta sama zasada co dla pozostałych 4
   kategorii (zapobieganie wyciekowi tekstu deweloperskiego).
4. `gra/src/ui/entityCards/renderer.ts`: zarejestruj `wonderAdapter` +
   `case 'wonder':` w `buildEntityCardData`, importuj `resolveWonderRow`.
5. `gra/src/ui/buildModeHud.ts`: dodaj DOKŁADNIE analogiczną ikonkę ⓘ do
   wiersza cudu (obok linii 530-536, na końcu wiersza jak dla ulepszeń) +
   osobny listener (obok linii 767-786) wołający `openEntityCard('wonder',
   id, {mode:'dialog'})` z `stopPropagation()`, niezależny od
   `onSelectWonder` (klik reszty wiersza nadal uzbraja tryb postawienia —
   ZERO zmian w tym zachowaniu). Ikonka działa też dla `locked` cudów.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `openEntityCard('wonder', <dowolne id z cuda>, {mode:'dialog'})` renderuje
   realną kartę encji (nie pustkę/błąd) w headless Chromium.
2. Klik ikonki ⓘ na wierszu DOWOLNEGO cudu (w tym `locked`) w panelu budowy
   otwiera tę kartę; klik POZA ikonką (reszta wiersza) nadal uzbraja tryb
   postawienia cudu na mapie DOKŁADNIE jak dotychczas (zero regresu —
   `onSelectWonder` wywoływane z tymi samymi argumentami co przed zmianą).
3. Karta NIE renderuje pola `uwagi` (dev-tekst) w żadnej sekcji.
4. Karta pokazuje sekcję „Rys historyczny” TYLKO gdy `historia` niepuste
   (dziś zawsze puste — sekcja ma być nieobecna dla wszystkich 19 cudów w
   tej rundzie; to weryfikuje że mechanizm honoruje pusty warunek, nie że
   działa na pusto przypadkiem).
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy trwały test w `gra/tools/` (Playwright/headless Chromium) pokrywający
   kryteria 1-4, w tym scenariusz mutacyjny: wstrzyknij tymczasowo `historia`
   w pamięci testu dla jednego cudu i pokaż że sekcja SIĘ POJAWIA (dowód
   nietautologiczności identyczny wzorem `entity-card-historia-section-test.cjs`).

## ALLOWLISTA — nic poza tym
`gra/src/ui/entityCards/types.ts`, `gra/src/ui/entityCards/registry.ts`,
`gra/src/ui/entityCards/wonderAdapter.ts` (nowy), `gra/src/ui/entityCards/renderer.ts`,
`gra/src/ui/buildModeHud.ts`, nowy plik testowy w `gra/tools/`. Zakazane
bezwzględnie: `gra/data/wonders.json` (ZERO dopisywania pola `historia` w tej
rundzie — to wyłącznie mechanizm, treść to osobny, kolejny temat),
`gra/src/ui/wonderCompletedNotice.ts` (osobny, jednorazowy popup — NIETKNIĘTY),
wszelkie inne pliki `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-INFRA-CUDA-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryteriów 1-4 za spełnione bez realnego zrzutu z żywej
przeglądarki (headless Chromium, nie jsdom/test kontraktowy — R-PROC-AUTOBOT.md
§9 pkt 6a). Zakaz uznania kryterium 4 za spełnione bez faktycznego
wstrzyknięcia `historia` i pokazania że sekcja się pojawia — inaczej test nie
odróżnia „mechanizm działa i honoruje pusty warunek” od „mechanizm w ogóle
nie renderuje sekcji dla żadnego cudu, bo coś jest zepsute”. Zakaz łączenia
klika ikonki z klikiem wiersza (musi być realny, niezależny listener z
`stopPropagation`, zweryfikowany przez faktyczne kliknięcie w obu miejscach
osobno, nie przez czytanie kodu).

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
orkiestrator integruje allowlist-only. Po integracji: dispatch treści
(pole `historia` dla 19 cudów, prawdopodobnie 2 batche ~10 sztuk) jako
OSTATNI, 17. temat serii `R-KARTY-HISTORIA-Q1`.
