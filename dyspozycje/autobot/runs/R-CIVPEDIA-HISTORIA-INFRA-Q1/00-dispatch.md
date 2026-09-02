TEMAT:  R-CIVPEDIA-HISTORIA-INFRA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 2 zlecenia właściciela (po zamknięciu Fazy 1 — projekt
`R-KARTY-HISTORIA-Q1`, 17/17 tematów, wszystkie 5 kategorii encji mają pełny
rys historyczny w polu `historia`/`Historia` w `gra/data/*.json`): przenieść
tę samą treść historyczną do CivPedii (encyklopedii w grze). CivPedia to
CAŁKOWICIE OSOBNY system od kart encji (`entityCards/`) — ręcznie pisane
pliki markdown w `docs/encyklopedia/**`, pakowane przez skrypt do
`gra/src/data/wikiBundle.json`, renderowane przez `gra/src/ui/wikiHubHud.ts`.
Ten temat to WYŁĄCZNIE mechanizm (infrastruktura) — bez dopisywania treści
do jakichkolwiek plików `.md` ani regeneracji `wikiBundle.json`. Treść to
osobne, kolejne tematy (batch po kategorii, analogicznie do serii
`R-KARTY-HISTORIA-Q1`).

## RECON (wykonany, nie powtarzać)
- `gra/src/data/wikiBundle.json`: `{ version, generated, poradnik: [...],
  encyklopedia: [...168 wpisów] }`. Generowany przez
  `gra/tools/bundle-wiki-for-game.cjs` z plików `docs/encyklopedia/**/*.md`
  (171 plików, foldery: `budynki`, `jednostki`, `ulepszenia`, `cuda`,
  `cywilizacje`, `pojecia`, `technologie`).
- `bundleEncyklopedia()` (`bundle-wiki-for-game.cjs:103-135`): dla każdego
  pliku `.md` wyciąga `wikiS`=`extractSection(md, ['Wiki‑S','Wiki-S'])`,
  `wikiM`=`extractSection(md, ['Wiki‑M','Wiki-M'])`, `full`=cała treść bez
  frontmatter. `extractSection(md, names)` (linie 42-54) to generyczna
  funkcja: regex `##\s+<nazwa>[\s\S]*?(?=\n##\s|$)` — łapie sekcję markdown
  od nagłówka `## <nazwa>` do następnego `##` albo końca pliku.
- ISTNIEJE JUŻ nagłówek `## Historia / decyzje` w niektórych plikach `.md` —
  to jest CHANGELOG strony wiki (np. „rev. G2 2026-08-04 — Nauka/Kultura
  lokalnie…"), CAŁKOWICIE NIEZWIĄZANY z rysem historycznym Civilopedii. NIE
  wolno pomylić/nadpisać tej sekcji — nowa sekcja MUSI mieć INNĄ nazwę
  nagłówka: `## Rys historyczny` (dokładnie taki tekst, spójny z nazwą
  sekcji na kartach encji w `entityCards/renderer.ts`).
- `gra/src/ui/wikiHubHud.ts`: interfejs `EncyEntry` (linie 54-67, pola
  `id, slug, folder, category, title, gameIds, wikiS, wikiM, full`).
  `pickEncyContent(entry, depth)` (linie ~319-322): `depth==='s'` →
  `## ${title}\n\n${wikiS}`; `depth==='m'` → `## ${title}\n\n${wikiM}`;
  `depth==='full'` → `entry.full`. Wynik renderowany przez
  `markdownToHtml(detailMd)` (linia 367, `markdownLite.ts`).
- Zero pola `historia`/rysu historycznego w CivPedii dziś. Zero testów
  CivPedii w `gra/tools/`.

## GOAL
1. `gra/tools/bundle-wiki-for-game.cjs`, `bundleEncyklopedia()`: dodaj
   `const historia = extractSection(md, ['Rys historyczny']);` (WZOREM
   linii 120-121, ta sama funkcja `extractSection`, NOWA, jedna nazwa —
   NIE dodawaj wariantu z myślnikiem typograficznym, w przeciwieństwie do
   `Wiki‑S`/`Wiki-S`, bo ta nazwa nie ma historycznego wariantu zapisu).
   Dodaj pole `historia: historia || '',` do zwracanego obiektu (obok
   `wikiS`/`wikiM`/`full`, linie 130-132) — WYŁĄCZNIE dodanie pola, zero
   zmian w istniejącej logice `wikiS`/`wikiM`/`full`/`gameIds`/`title`/
   `category`.
2. `gra/src/ui/wikiHubHud.ts`: dodaj `historia: string;` do interfejsu
   `EncyEntry` (obok `full`, linia ~66). W `pickEncyContent(entry, depth)`:
   dla `depth==='m'` i `depth==='full'` (NIE dla `'s'` — widok skrócony ma
   zostać zwięzły), jeśli `entry.historia` jest niepuste, dopisz na końcu
   zwracanego markdownu blok `\n\n## Rys historyczny\n\n${entry.historia}`
   (dokładnie ten nagłówek, żeby `markdownToHtml` wyrenderował go jako
   osobną sekcję — nie musisz stylizować kursywą, to inny system renderujący
   niż karty encji, wystarczy że sekcja jest widoczna i odróżnialna
   nagłówkiem). Dla `depth==='s'` zero zmian.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Uruchomienie `node gra/tools/bundle-wiki-for-game.cjs` na TYMCZASOWYM
   pliku testowym (fixture w `gra/tools/` albo tymczasowym katalogu, NIE w
   `docs/encyklopedia/**` — zero zmian w prawdziwych plikach `.md` w tej
   rundzie) z sekcją `## Rys historyczny\n\nTekst testowy.` daje w wyniku
   obiekt z polem `historia: "Tekst testowy."`. Plik BEZ tej sekcji daje
   `historia: ""`.
2. Plik `.md` mający ISTNIEJĄCĄ sekcję `## Historia / decyzje` (changelog)
   ale BEZ `## Rys historyczny` — `historia` MUSI być `""` (dowód, że nowa
   ekstrakcja nie myli się z istniejącym, podobnie nazwanym nagłówkiem).
3. Żywy dowód w headless Chromium: przy `depth==='m'` LUB `depth==='full'`
   dla wpisu z niepustym `historia`, wyrenderowany DOM zawiera nagłówek
   „Rys historyczny" i treść pola. Przy `depth==='s'` — NIE zawiera (nawet
   jeśli `historia` niepuste).
4. Realny wpis w dzisiejszym `wikiBundle.json` (żaden nie ma jeszcze pola
   `historia` w tej rundzie, bo pliki `.md` nietknięte) renderuje się
   DOKŁADNIE jak dotychczas — zero regresu istniejącego wyglądu.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy trwały test w `gra/tools/` (Playwright/headless Chromium dla
   kryterium 3, plus bezpośrednie wywołanie funkcji bundlera na fixture dla
   kryteriów 1-2) pokrywający wszystkie kryteria końca.

## ALLOWLISTA — nic poza tym
`gra/tools/bundle-wiki-for-game.cjs`, `gra/src/ui/wikiHubHud.ts`, nowy plik
testowy w `gra/tools/` (i ewentualny tymczasowy fixture `.md` UŻYWANY
WYŁĄCZNIE przez ten test, poza `docs/encyklopedia/`). Zakazane bezwzględnie:
`docs/encyklopedia/**` (ZERO zmian w prawdziwych hasłach — to osobny,
kolejny temat), `gra/src/data/wikiBundle.json` (ZERO regeneracji w tej
rundzie — nie ma jeszcze żadnej realnej treści do spakowania), `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-CIVPEDIA-HISTORIA-INFRA-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 3 za spełnione bez realnego zrzutu z żywej
przeglądarki (headless Chromium, nie samo wywołanie funkcji renderującej
poza DOM). Zakaz uznania kryterium 2 za spełnione bez realnego testu z
plikiem zawierającym OBIE sekcje (`## Historia / decyzje` I NIE
`## Rys historyczny`) — literówka w regexie (np. zbyt szeroki wzorzec
łapiący obie nazwy) dawałaby fałszywe poczucie sukcesu bez tego testu.

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
orkiestrator integruje allowlist-only, następnie dispatchuje batch'e treści
per kategoria (budynki 25 istniejących haseł, technologie 32, ulepszenia
terenu 17, jednostki 49, cuda 19 — kopiowanie już zatwierdzonego tekstu z
`gra/data/*.json` do plików `.md`, plus regeneracja `wikiBundle.json` w
każdym batchu). Encje BEZ istniejącego hasła CivPedii (16 budynków, część
jednostek/ulepszeń) są ŚWIADOMIE POZA zakresem tej fazy — tworzenie nowych
stron CivPedii to osobny, większy temat.
