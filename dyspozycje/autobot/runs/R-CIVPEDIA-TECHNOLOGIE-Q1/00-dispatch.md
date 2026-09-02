TEMAT:  R-CIVPEDIA-TECHNOLOGIE-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 2 (po integracji `R-CIVPEDIA-HISTORIA-INFRA-Q1`, commit `d6032099` na `main`):
batch treści, kategoria technologie.

## RECON (wykonany przez Explore, nie powtarzać)
`docs/encyklopedia/technologie/` zawiera 32 pliki `.md`. `gra/data/tech.json`
NIE MA pola `id` na wpisie technologii — dopasowanie jest po polu
`Technologia` (nazwa wyświetlana) w tablicy `technologie`, dokładnie
zgodnie z tytułem/nazwą w `## Metadane` pliku `.md` (sprawdź nagłówek/pole
tytułu w każdym pliku i dopasuj TEKSTOWO, dokładnie, do wartości pola
`Technologia`). Wszystkie 32 pliki mapują się 1:1 po nazwie, wszystkie mają
niepuste pole `Historia` (Capitalized, nie `historia`). Zero rozbieżności,
zero duplikatów. Część plików ma już `## Historia / decyzje` (NIEZWIĄZANY
changelog wiki) — nie mylić z nową sekcją.

## GOAL
Dla KAŻDEGO z 32 plików w `docs/encyklopedia/technologie/*.md`:
1. Znajdź nazwę technologii w pliku, dopasuj DOKŁADNIE (case-sensitive,
   pełny string) do pola `Technologia` w tablicy `technologie` w
   `gra/data/tech.json`, przeczytaj pole `Historia`.
2. Dopisz na KOŃCU pliku `.md`: `\n\n## Rys historyczny\n\n<treść Historia>\n`
   dosłownie, bez skrótów/parafraz. Jeśli plik ma `## Historia / decyzje` —
   nowa sekcja PO nim.
3. Po wszystkich 32 plikach: `node gra/tools/bundle-wiki-for-game.cjs`
   (regeneracja `wikiBundle.json`, do własnego testu).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wszystkie 32 pliki mają na końcu `## Rys historyczny` z treścią
   DOKŁADNIE zgodną z polem `Historia` w `tech.json` — dowód: automatyczne
   porównanie każdego pliku z JSON-em (dopasowanie po nazwie technologii).
2. Zero zmian w istniejących sekcjach `## Historia / decyzje`.
3. Żywy dowód w headless Chromium: 3 z 32 haseł (widok 'm' lub 'full')
   pokazują wyrenderowaną sekcję "Rys historyczny" z realną treścią.
4. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + nowy/
   rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-3.

## ALLOWLISTA — nic poza tym
`docs/encyklopedia/technologie/*.md` (WYŁĄCZNIE dopisanie na końcu),
`gra/src/data/wikiBundle.json` (regeneracja), nowy/rozszerzony plik testowy
w `gra/tools/`. Zakazane bezwzględnie: `gra/tools/bundle-wiki-for-game.cjs`,
`gra/src/ui/wikiHubHud.ts`, `gra/data/**` (tylko odczyt), inne foldery
`docs/encyklopedia/**`, docs/decyzje/<ID>.md, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-CIVPEDIA-TECHNOLOGIE-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 3 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz uznania kryterium 1 za spełnione bez programowej
iteracji po wszystkich 32 plikach porównanych z JSON-em — dopasowanie po
NAZWIE (nie po id, którego json nie ma) jest łatwym miejscem na literówkę,
test musi to złapać automatycznie.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje WYŁĄCZNIE diff plików `.md`, BEZ `wikiBundle.json`.
