TEMAT:  R-CIVPEDIA-JEDNOSTKI-J2-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Faza 2 (po integracji `R-CIVPEDIA-HISTORIA-INFRA-Q1`, commit `d6032099` na `main`):
batch treści, kategoria jednostki, część 2/2 (alfabetycznie druga połowa).

## RECON (wykonany przez Explore, nie powtarzać)
`docs/encyklopedia/jednostki/` zawiera 49 plików `.md` w zakresie (plus 1
archiwalny w `_archiwum/`, POZA zakresem obu batchy — nieistniejąca
jednostka, nie dotykać). `gra/data/units.json` NIE MA pola `id` — dopasowanie
jest po polu `Jednostka` (nazwa wyświetlana), pole treści to `Historia`
(Capitalized).

TEN batch (J2) obejmuje DOKŁADNIE te 24 pliki, w tej kolejności
alfabetycznej (`ls docs/encyklopedia/jednostki/*.md | grep -v _archiwum | sort`,
pozycje 26-49):
rydwan-sumeryjski.md, rydwan-wo-y.md, taran.md, triari.md,
ucznik-akadyjski.md, ucznik-egipski.md, ucznik-sumeryjski.md, ucznik.md,
uthulwana-bia-e-tarcze.md, w-ocznik-sumeryjski.md, w-ocznik.md,
wieza-obleznicza.md, wojownik-celtycki.md, wojownik-germanski.md,
wojownik-mykenski.md, wojownik-sherden.md, wojownik-szekelesz.md,
wojownik-tyrrenski.md, wojownik-z-khopesh.md, wojownik-z-maczuga-chaska.md,
wojownik-z-mieczem-i-tarcza.md, wojownik-z-toporem.md, wojownik.md,
zwiadowca.md.

WYJĄTEK w tym batchu: `wojownik-celtycki.md` ma dodatkowy wiersz
`gra-id: soldurii` w `## Metadane`, który NADPISUJE zwykłe dopasowanie po
nazwie pliku/tytule — prawdziwy klucz do `units.json` dla TEGO pliku jest
`Jednostka === "Soldurii"`, NIE "Wojownik celtycki" (ta nazwa/treść
przeniosła się do osobnego pliku `gaesatae.md`, który jest w batchu J1 —
nie dotykaj go tutaj). Użyj `gra-id`/wartości "Soldurii" do znalezienia
właściwego pola `Historia` dla tego jednego pliku, NIE tytułu/nazwy pliku.
Pozostałe 23 pliki mapują się zwykłym dopasowaniem po nazwie (bez `gra-id`).
Wszystkie 24 mają niepuste `Historia`. Część plików ma już
`## Historia / decyzje` (NIEZWIĄZANY changelog wiki) — nie mylić z nową
sekcją.

## GOAL
Dla KAŻDEGO z 24 wymienionych wyżej plików:
1. Dla `wojownik-celtycki.md`: użyj `gra-id: soldurii` → znajdź wpis w
   `units.json` gdzie `Jednostka === "Soldurii"`, przeczytaj `Historia`.
   Dla pozostałych 23: dopasuj tytuł pliku DOKŁADNIE do pola `Jednostka`,
   przeczytaj `Historia`.
2. Dopisz na KOŃCU pliku `.md`: `\n\n## Rys historyczny\n\n<treść Historia>\n`
   dosłownie, bez skrótów/parafraz. Jeśli plik ma `## Historia / decyzje` —
   nowa sekcja PO nim.
3. Po wszystkich 24 plikach: `node gra/tools/bundle-wiki-for-game.cjs`
   (regeneracja `wikiBundle.json`, do własnego testu).
NIE dotykaj żadnego innego pliku w `docs/encyklopedia/jednostki/` poza tymi
24 — pozostałe 25 (w tym `gaesatae.md`) są w OSOBNYM, równoległym temacie
(J1), edycja tam kolidowałaby przy integracji.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wszystkie 24 pliki mają na końcu `## Rys historyczny` z treścią
   DOKŁADNIE zgodną z `units.json` — dowód: automatyczne porównanie.
2. `wojownik-celtycki.md` konkretnie: treść sekcji odpowiada wpisowi
   "Soldurii" w `units.json`, NIE jakiemukolwiek wpisowi zawierającemu
   "Wojownik" — dowód: osobna, jawna asercja w teście na ten jeden plik.
3. Zero zmian w istniejących sekcjach `## Historia / decyzje`.
4. Zero zmian w pozostałych 25 plikach folderu `jednostki/` (poza zakresem
   tego batcha) — dowód: `git diff --stat` pokazuje wyłącznie te 24.
5. Żywy dowód w headless Chromium: 3 z 24 haseł, w tym KONIECZNIE
   `wojownik-celtycki.md`, (widok 'm' lub 'full') pokazują wyrenderowaną
   sekcję "Rys historyczny" z realną treścią.
6. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + nowy/
   rozszerzony trwały test w `gra/tools/` pokrywający kryteria 1-5.

## ALLOWLISTA — nic poza tym
DOKŁADNIE tych 24 plików wymienionych w RECON w
`docs/encyklopedia/jednostki/` (WYŁĄCZNIE dopisanie na końcu),
`gra/src/data/wikiBundle.json` (regeneracja), nowy/rozszerzony plik testowy
w `gra/tools/`. Zakazane bezwzględnie: pozostałe 25 plików w
`docs/encyklopedia/jednostki/` (batch J1, w tym `gaesatae.md`),
`gra/tools/bundle-wiki-for-game.cjs`, `gra/src/ui/wikiHubHud.ts`,
`gra/data/**` (tylko odczyt), inne foldery `docs/encyklopedia/**`,
docs/decyzje/<ID>.md, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-CIVPEDIA-JEDNOSTKI-J2-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 5 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz uznania kryterium 2 (Soldurii) za spełnione bez
programowego porównania treści z KONKRETNIE wpisem "Soldurii" w JSON-ie —
łatwa pomyłka to podstawienie treści "Wojownika" pod ten plik przez
literalne dopasowanie tytułu, zamiast honorowania `gra-id`.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje WYŁĄCZNIE diff plików `.md`, BEZ `wikiBundle.json`.
Temat dotyka tego samego folderu co J1 (inne pliki) — dispatchowane
RÓWNOLEGLE w tej samej fali, bez konfliktu (rozłączne zbiory plików).
