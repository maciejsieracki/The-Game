TEMAT:  R-CIVPEDIA-CUDA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 2 (po integracji `R-CIVPEDIA-HISTORIA-INFRA-Q1`, commit `d6032099` na `main`):
batch treści, kategoria cuda.

## RECON (wykonany przez Explore, nie powtarzać)
`docs/encyklopedia/cuda/` zawiera 19 plików `.md`. Każdy ma sekcję
`## Metadane` z wierszem `**id**` — klucz łączący z `gra/data/wonders.json`,
tablica `cuda` (dopasowanie po polu `id`). Wszystkie 19 plików mapują się
1:1, wszystkie mają niepuste pole `historia` (lowercase). Zero rozbieżności,
zero duplikatów — najczystszy z 5 zbiorów. Część plików ma już ISTNIEJĄCY
nagłówek `## Historia / decyzje` — to NIEZWIĄZANY changelog wiki, nie mylić
z nową sekcją.

## GOAL
Dla KAŻDEGO z 19 plików w `docs/encyklopedia/cuda/*.md`:
1. Znajdź `id` w `## Metadane`, znajdź wpis w tablicy `cuda` w
   `gra/data/wonders.json` (dopasowanie po `id`), przeczytaj `historia`.
2. Dopisz na KOŃCU pliku `.md`: `\n\n## Rys historyczny\n\n<treść historia>\n`
   dosłownie, bez skrótów/parafraz. Jeśli plik ma `## Historia / decyzje` —
   nowa sekcja idzie PO nim, na końcu pliku.
3. Po wszystkich 19 plikach: `node gra/tools/bundle-wiki-for-game.cjs`
   (regeneracja `wikiBundle.json`, potrzebna do własnego testu; orkiestrator
   i tak zregeneruje ten plik osobno przy integracji).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wszystkie 19 plików mają na końcu `## Rys historyczny` z treścią
   DOKŁADNIE zgodną z `wonders.json` — dowód: automatyczne porównanie
   każdego pliku z JSON-em.
2. Zero zmian w istniejących sekcjach `## Historia / decyzje`.
3. Żywy dowód w headless Chromium: 3 z 19 haseł (widok 'm' lub 'full')
   pokazują wyrenderowaną sekcję "Rys historyczny" z realną treścią.
4. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + nowy/
   rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-3.

## ALLOWLISTA — nic poza tym
`docs/encyklopedia/cuda/*.md` (WYŁĄCZNIE dopisanie na końcu), 
`gra/src/data/wikiBundle.json` (regeneracja, efekt uboczny), nowy/rozszerzony
plik testowy w `gra/tools/`. Zakazane bezwzględnie:
`gra/tools/bundle-wiki-for-game.cjs`, `gra/src/ui/wikiHubHud.ts`,
`gra/data/**` (tylko odczyt), inne foldery `docs/encyklopedia/**`,
docs/decyzje/<ID>.md, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-CIVPEDIA-CUDA-Q1`, baza JAWNIE `origin/main`.
Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 3 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz uznania kryterium 1 za spełnione bez programowej
iteracji po wszystkich 19 plikach porównanych z JSON-em.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje WYŁĄCZNIE diff plików `.md`, BEZ `wikiBundle.json`
(regenerowany osobno po integracji wszystkich równoległych batchy treści).
