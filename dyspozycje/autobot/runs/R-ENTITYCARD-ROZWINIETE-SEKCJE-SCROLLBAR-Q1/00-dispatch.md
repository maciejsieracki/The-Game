STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
GOAL: (A) Karta technologii (CivPedia entity card) ma mieć WSZYSTKIE sekcje domyślnie
ROZWINIĘTE (dziś "Ulepszenia terenu" i "Zmiany ekonomiczne" startują zwinięte, wymagają
kliknięcia). (B) Okno karty (`entity-card-dialog`) ma mieć TRWALE WIDOCZNY pasek
przewijania, nie poleganie na geście scrolla/kółku myszy, żeby było od razu widać że
poniżej jest więcej treści.

WYZWALACZ (właściciel, żywa rozmowa, zrzut karty technologii "Gospodarka wodna"):
"Wszystkie możliwe elementy w karcie technologii powinny być rozwinięte, a nie zwinięte.
Za każdym razem muszę klikać i rozwijać, na przykład budynki czy ulepszenia. Wszystkie
powinny być rozwinięte i zastanawiam się, czy nie bardziej funkcjonalny byłby pasek
przesuwania, bo w tej chwili trzeba to robić scroll-upem, a nie każdy będzie miał
myszkę. Powinien być pasek przewijania, żeby było widoczne, że poniżej jest jeszcze
treść. To nie jest intuicyjne."

KONTEKST TECHNICZNY (zlokalizowany przez orkiestratora, oszczędza czas Operatorowi):
- `gra/src/ui/entityCards/technologyAdapter.ts:219-222` — sekcja "Ulepszenia terenu"
  (`key: 'improvements'`) ma `collapsible: true, openDefault: false`.
- `gra/src/ui/entityCards/technologyAdapter.ts:301` — sekcja "Zmiany ekonomiczne"
  (`key: 'econ'`) ma `collapsible: true, openDefault: false`.
  To JEDYNE dwa miejsca w CAŁYM `gra/src/ui/entityCards/` z `openDefault: false`
  (zweryfikowane grepem) — wszystkie inne sekcje (Budynki, Jednostki, Kolejne
  technologie, Wymagania itd.) już mają `openDefault: true` albo w ogóle nie są
  `collapsible`. Zmiana: `openDefault: false` → `openDefault: true` w OBU miejscach.
- Mechanizm akordeonu: `gra/src/ui/entityCards/renderer.ts:256-280`
  (`buildSectionEl`, gałąź `if (section.collapsible)`) — sam mechanizm zwijania
  ZOSTAJE (użytkownik nadal MOŻE zwinąć sekcję ręcznie, klika chevron), zmienia się
  WYŁĄCZNIE stan startowy.
- Scrollowalny kontener: `gra/src/ui/entityCards/renderer.ts` CSS,
  `.entity-card-dialog` (linia ok. 702) — `overflow:auto`, dziś polega na domyślnym
  zachowaniu przeglądarki/systemu (na macOS/dotykowych overlay-scrollbary są
  niewidoczne, dopóki użytkownik nie zacznie przewijać — to jest dokładnie problem
  zgłoszony przez właściciela).

ZADANIE:
1. Zmień `openDefault: false` na `openDefault: true` w obu miejscach w
   `technologyAdapter.ts` (linie 221, 301).
2. Dodaj CSS wymuszający TRWALE WIDOCZNY, stylowany pod motyw pasek przewijania na
   `.entity-card-dialog` — dla WebKit/Chromium `::-webkit-scrollbar` (szerokość,
   kolor toru/uchwytu spójny z paletą karty — złoto/kremowy akcent na ciemnym tle,
   jak reszta UI), dla Firefox `scrollbar-width: thin` + `scrollbar-color`. Użyj
   `scrollbar-gutter: stable` jeśli to pomaga uniknąć przeskoku layoutu przy
   pojawianiu się/znikaniu paska. Cel: pasek ma być WIDOCZNY OD RAZU (nie tylko
   podczas aktywnego przewijania) na każdej platformie, na której CSS to pozwala
   (macOS Safari z overlay-scrollbarami może być ograniczone przez system — jeśli
   napotkasz twardy limit platformy, opisz to w raporcie zamiast obiecywać coś,
   czego CSS nie potrafi wymusić).
3. Zweryfikuj ŻYWYM zrzutem (Chromium/Playwright): (a) otwarta karta technologii z
   niezerową zawartością w obu sekcjach pokazuje je ROZWINIĘTE bez klikania, (b) pasek
   przewijania jest widoczny w renderze dla karty na tyle długiej, że przekracza
   wysokość okna (użyj technologii z wieloma wierszami we wszystkich sekcjach, żeby
   wymusić przewijanie).

BINARNE KRYTERIUM SUKCESU: żywy zrzut pokazuje sekcje "Ulepszenia terenu" i "Zmiany
ekonomiczne" rozwinięte od razu po otwarciu karty (bez kliknięcia), oraz widoczny pasek
przewijania w `.entity-card-dialog` gdy treść przekracza wysokość okna.

ALLOWLISTA:
- `gra/src/ui/entityCards/technologyAdapter.ts` (wyłącznie linie z `openDefault`)
- `gra/src/ui/entityCards/renderer.ts` (wyłącznie blok CSS `.entity-card-dialog`,
  ewentualnie nowe reguły `::-webkit-scrollbar`/`scrollbar-*` — nie ruszać reszty pliku,
  w szczególności nie ruszać mechanizmu `buildSectionEl`/akordeonu poza dispatchem)
- `gra/tools/*.cjs` (nowa albo rozszerzona bramka real-render)
- `dyspozycje/autobot/runs/R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1/*`
Zakaz usuwania mechanizmu zwijania (użytkownik nadal ma móc ręcznie zwinąć sekcję —
zmienia się WYŁĄCZNIE stan domyślny). Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania zmiany za gotową bez żywego zrzutu
Chromium/Playwright pokazującego OBIE sekcje rozwinięte od razu po otwarciu i pasek
przewijania widoczny bez interakcji — sam kod źródłowy CSS nie jest dowodem, przeglądarki
różnie honorują `scrollbar-width`/`::-webkit-scrollbar`.

IZOLACJA: worktree `/home/user/wt-entitycard-rozwiniete-scrollbar`, gałąź
`autobot/R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1`, baza `origin/main` @ `e29a772f`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
