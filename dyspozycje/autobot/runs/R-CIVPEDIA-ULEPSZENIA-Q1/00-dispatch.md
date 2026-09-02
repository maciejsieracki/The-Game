TEMAT:  R-CIVPEDIA-ULEPSZENIA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 2 (po integracji `R-CIVPEDIA-HISTORIA-INFRA-Q1`, commit `d6032099` na `main`):
batch treści, kategoria ulepszenia terenu.

## RECON (wykonany przez Explore, nie powtarzać)
`docs/encyklopedia/ulepszenia/` zawiera 17 plików `.md`. Klucz łączący z
`gra/data/terrain-improvements.json` (słownik kluczowany po id) to zwykle
wiersz `**id**` w `## Metadane`. 16 z 17 plików mapuje się 1:1 wprost.
WYJĄTEK: `ulepszenia/kopalnia.md` — jego własny `id` to `kopalnia`, którego
NIE MA jako klucza w JSON-ie wprost; plik ma dodatkowy wiersz `gra-id` w
`## Metadane` wskazujący CZTERY osobne klucze: `kopalnia_miedzi`,
`kopalnia_zelaza`, `kopalnia_cyny`, `kopalnia_zlota` — wszystkie cztery mają
niepuste `historia` (788-880 znaków każde). Wszystkie 17 plików ma gotową
treść źródłową. Część plików ma już `## Historia / decyzje` (NIEZWIĄZANY
changelog wiki) — nie mylić z nową sekcją.

## GOAL
Dla 16 "zwykłych" plików w `docs/encyklopedia/ulepszenia/*.md` (wszystkie
poza `kopalnia.md`):
1. Znajdź `id` w `## Metadane`, znajdź klucz w `gra/data/terrain-improvements.json`,
   przeczytaj `historia`.
2. Dopisz na KOŃCU pliku: `\n\n## Rys historyczny\n\n<treść historia>\n`
   dosłownie. Jeśli plik ma `## Historia / decyzje` — nowa sekcja PO nim.

Dla `ulepszenia/kopalnia.md` (WYJĄTEK, jeden plik dokumentujący 4 warianty
kopalni w grze):
3. Dopisz na KOŃCU pliku JEDNĄ sekcję `## Rys historyczny` zawierającą
   WSZYSTKIE 4 teksty `historia` (kopalnia_miedzi, kopalnia_zelaza,
   kopalnia_cyny, kopalnia_zlota), każdy poprzedzony krótkim pogrubionym
   podnagłówkiem z nazwą surowca (np. `**Kopalnia miedzi**`), w kolejności
   miedź/żelazo/cyna/złoto, każdy tekst DOKŁADNIE (bez skrótów) jak w JSON-ie,
   oddzielone pustą linią. To ŚWIADOMA decyzja orkiestratora na udokumentowaną
   niejednoznaczność 1-plik-do-4-encji — nie pytaj, wykonaj dokładnie tak.

4. Po wszystkich 17 plikach: `node gra/tools/bundle-wiki-for-game.cjs`
   (regeneracja `wikiBundle.json`, do własnego testu).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wszystkie 16 "zwykłych" plików mają `## Rys historyczny` z treścią
   DOKŁADNIE zgodną z JSON-em — dowód: automatyczne porównanie.
2. `kopalnia.md` ma `## Rys historyczny` zawierającą wszystkie 4 teksty,
   każdy pod własnym podnagłówkiem z nazwą surowca, treść DOKŁADNIE zgodna
   z odpowiadającymi 4 kluczami w JSON-ie.
3. Zero zmian w istniejących sekcjach `## Historia / decyzje`.
4. Żywy dowód w headless Chromium: 3 "zwykłe" hasła + `kopalnia` (widok 'm'
   lub 'full') pokazują wyrenderowaną sekcję "Rys historyczny" z realną
   treścią (dla kopalni: wszystkie 4 podnagłówki obecne w DOM).
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + nowy/
   rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-4.

## ALLOWLISTA — nic poza tym
`docs/encyklopedia/ulepszenia/*.md` (WYŁĄCZNIE dopisanie na końcu),
`gra/src/data/wikiBundle.json` (regeneracja), nowy/rozszerzony plik testowy
w `gra/tools/`. Zakazane bezwzględnie: `gra/tools/bundle-wiki-for-game.cjs`,
`gra/src/ui/wikiHubHud.ts`, `gra/data/**` (tylko odczyt), inne foldery
`docs/encyklopedia/**`, docs/decyzje/<ID>.md, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-CIVPEDIA-ULEPSZENIA-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz potraktowania `kopalnia.md` jak zwykłego pliku (np.
skopiowania tylko JEDNEGO z 4 tekstów) — Evaluator ma to sprawdzić wprost
jako osobny punkt.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje WYŁĄCZNIE diff plików `.md`, BEZ `wikiBundle.json`.
