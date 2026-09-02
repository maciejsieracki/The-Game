TEMAT:  R-CIVPEDIA-JEDNOSTKI-J1-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 2 (po integracji `R-CIVPEDIA-HISTORIA-INFRA-Q1`, commit `d6032099` na `main`):
batch treści, kategoria jednostki, część 1/2 (alfabetycznie pierwsza połowa).

## RECON (wykonany przez Explore, nie powtarzać)
`docs/encyklopedia/jednostki/` zawiera 49 plików `.md` w zakresie (plus 1
archiwalny w `_archiwum/`, POZA zakresem obu batchy — nieistniejąca
jednostka, nie dotykać). `gra/data/units.json` NIE MA pola `id` — dopasowanie
jest po polu `Jednostka` (nazwa wyświetlana), pole treści to `Historia`
(Capitalized). WYJĄTEK: `jednostki/wojownik-celtycki.md` ma dodatkowy
wiersz `gra-id: soldurii` w `## Metadane`, który NADPISUJE zwykłe
dopasowanie po nazwie/id pliku — jego prawdziwy tytuł to "Soldurii", NIE
"Wojownik celtycki" (stara treść pod tą nazwą przeniosła się do osobnego
pliku `gaesatae.md`). TEN plik jest w batchu 2 (J2), nie w tym — jeśli
mimo to natrafisz na niego w tej liście, POMIŃ go (należy do J2).

TEN batch (J1) obejmuje DOKŁADNIE te 25 plików, w tej kolejności
alfabetycznej (`ls docs/encyklopedia/jednostki/*.md | grep -v _archiwum | sort`,
pozycje 1-25):
berserker-germanski.md, falanga.md, gaesatae.md, galera.md,
gwardia-krolewska-sumeru.md, halabardnik-shang.md, hastati.md,
hieros-lochos-swiety-zastep.md, hu-ben-wei-gwardia-tygrysa.md, impi.md,
jezdziec-chinski.md, katapulta.md, konnica.md, krolewska-gwardia.md,
medzaj-gwardia-faraona.md, oszczepnik-estolica.md, oszczepnik-zulu-izijula.md,
oszczepnik.md, procarz-huaracoc.md, procarz.md, rydwan-celtycki.md,
rydwan-egipski.md, rydwan-konny.md, rydwan-mykenski.md, rydwan-shang.md.
Wszystkie 25 mapują się zwykłym dopasowaniem po nazwie (bez `gra-id`),
wszystkie mają niepuste `Historia`. Część plików ma już `## Historia / decyzje`
(NIEZWIĄZANY changelog wiki) — nie mylić z nową sekcją.

## GOAL
Dla KAŻDEGO z 25 wymienionych wyżej plików:
1. Znajdź tytuł jednostki w pliku, dopasuj DOKŁADNIE do pola `Jednostka` w
   `gra/data/units.json`, przeczytaj pole `Historia`.
2. Dopisz na KOŃCU pliku `.md`: `\n\n## Rys historyczny\n\n<treść Historia>\n`
   dosłownie, bez skrótów/parafraz. Jeśli plik ma `## Historia / decyzje` —
   nowa sekcja PO nim.
3. Po wszystkich 25 plikach: `node gra/tools/bundle-wiki-for-game.cjs`
   (regeneracja `wikiBundle.json`, do własnego testu).
NIE dotykaj żadnego innego pliku w `docs/encyklopedia/jednostki/` poza tymi
25 — pozostałe 24 (w tym `wojownik-celtycki.md`) są w OSOBNYM, równoległym
temacie (J2), edycja tam kolidowałaby przy integracji.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wszystkie 25 plików mają na końcu `## Rys historyczny` z treścią
   DOKŁADNIE zgodną z `units.json` — dowód: automatyczne porównanie.
2. Zero zmian w istniejących sekcjach `## Historia / decyzje`.
3. Zero zmian w pozostałych 24 plikach folderu `jednostki/` (poza zakresem
   tego batcha) — dowód: `git diff --stat` pokazuje wyłącznie te 25.
4. Żywy dowód w headless Chromium: 3 z 25 haseł (widok 'm' lub 'full')
   pokazują wyrenderowaną sekcję "Rys historyczny" z realną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + nowy/
   rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-4.

## ALLOWLISTA — nic poza tym
DOKŁADNIE tych 25 plików wymienionych w RECON w
`docs/encyklopedia/jednostki/` (WYŁĄCZNIE dopisanie na końcu),
`gra/src/data/wikiBundle.json` (regeneracja), nowy/rozszerzony plik testowy
w `gra/tools/`. Zakazane bezwzględnie: pozostałe 24 pliki w
`docs/encyklopedia/jednostki/` (batch J2), `gra/tools/bundle-wiki-for-game.cjs`,
`gra/src/ui/wikiHubHud.ts`, `gra/data/**` (tylko odczyt), inne foldery
`docs/encyklopedia/**`, docs/decyzje/<ID>.md, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-CIVPEDIA-JEDNOSTKI-J1-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz uznania kryterium 1 za spełnione bez programowej
iteracji po wszystkich 25 plikach porównanych z JSON-em.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje WYŁĄCZNIE diff plików `.md`, BEZ `wikiBundle.json`.
Temat dotyka tego samego folderu co J2 (inne pliki) — dispatchowane
RÓWNOLEGLE w tej samej fali, bez konfliktu (rozłączne zbiory plików).
