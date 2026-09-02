TEMAT:  R-CIVPEDIA-BUDYNKI-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 2 (po integracji `R-CIVPEDIA-HISTORIA-INFRA-Q1`, commit `d6032099` na `main`):
mechanizm sekcji `## Rys historyczny` w CivPedii już działa (bundler wyciąga
tę sekcję do pola `historia`, `wikiHubHud.ts` dokleja ją na widokach 'm'/'full').
Ten temat to PIERWSZY batch treści: kategoria budynki.

## RECON (wykonany przez Explore, nie powtarzać)
`docs/encyklopedia/budynki/` zawiera 25 plików `.md`. Każdy ma sekcję
`## Metadane` z wierszem `**id**` (slug w backtickach) — to jest klucz
łączący z `gra/data/buildings.json` (pole `id`). Wszystkie 25 plików mapują
się 1:1 na wpis w `buildings.json`, wszystkie mają niepuste pole `historia`
(lowercase, ≥100 znaków). Zero rozbieżności, zero duplikatów. Część plików
(sprawdź per plik) ma już ISTNIEJĄCY nagłówek `## Historia / decyzje` —
to jest NIEZWIĄZANY changelog strony wiki, nie wolno go pomylić z nową
sekcją ani nadpisać.

## GOAL
Dla KAŻDEGO z 25 plików w `docs/encyklopedia/budynki/*.md`:
1. Znajdź `id` w sekcji `## Metadane`, znajdź odpowiadający wpis w
   `gra/data/buildings.json` (dopasowanie po polu `id`), przeczytaj jego
   pole `historia`.
2. Dopisz na KOŃCU pliku `.md` nową sekcję:
   `\n\n## Rys historyczny\n\n<dokładna treść pola historia>\n`
   Bez zmian w treści pola — kopiuj dosłownie, bez skrótów/parafraz.
   Jeśli plik ma istniejący `## Historia / decyzje` — nowa sekcja idzie
   PO nim (na samym końcu pliku), nie w jego miejsce.
3. Po przetworzeniu wszystkich 25 plików, uruchom
   `node gra/tools/bundle-wiki-for-game.cjs` żeby zregenerować
   `gra/src/data/wikiBundle.json` (potrzebne WYŁĄCZNIE do własnego testu
   żywego w tej rundzie — orkiestrator przy integracji zregeneruje ten
   plik ponownie na czystym `main`, więc commituj go, ale wiedz że finalny
   stan i tak nadpisze orkiestrator).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wszystkie 25 plików `.md` mają na końcu sekcję `## Rys historyczny`
   z treścią DOKŁADNIE zgodną z polem `historia` w `buildings.json` —
   dowód: automatyczne porównanie każdego pliku z JSON-em (skrypt/test).
2. Zero zmian w istniejących sekcjach `## Historia / decyzje` tam gdzie
   występują — dowód: diff pokazuje wyłącznie DOPISANIE na końcu pliku,
   zero modyfikacji istniejących linii.
3. Żywy dowód w headless Chromium: otwarcie DOWOLNYCH 3 z tych 25 haseł
   w CivPedii (widok 'm' lub 'full') pokazuje wyrenderowaną sekcję
   "Rys historyczny" z realną treścią (nie fixture).
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   nowy/rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-3.

## ALLOWLISTA — nic poza tym
`docs/encyklopedia/budynki/*.md` (WYŁĄCZNIE dopisanie sekcji na końcu,
zero innych zmian w tych plikach), `gra/src/data/wikiBundle.json`
(regeneracja, wynik uboczny bundlera), nowy/rozszerzony plik testowy w
`gra/tools/`. Zakazane bezwzględnie: `gra/tools/bundle-wiki-for-game.cjs`,
`gra/src/ui/wikiHubHud.ts` (mechanizm już gotowy, zero zmian), `gra/data/**`
(źródło treści, tylko odczyt), inne foldery `docs/encyklopedia/**`,
docs/decyzje/<ID>.md, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-CIVPEDIA-BUDYNKI-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 3 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz uznania kryterium 1 za spełnione przez ręczne
sprawdzenie kilku plików — test MUSI iterować po wszystkich 25 i porównywać
programowo z JSON-em, żeby literówka w kopiowaniu na 1 z 25 plików nie
przeszła niezauważona.

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
orkiestrator integruje WYŁĄCZNIE diff plików `.md` (cherry-pick per hunk,
BEZ `wikiBundle.json` — orkiestrator regeneruje go osobno na czystym `main`
po integracji wszystkich równoległych batchy treści CivPedii, żeby uniknąć
konfliktu współdzielonego generowanego pliku między batchami).
