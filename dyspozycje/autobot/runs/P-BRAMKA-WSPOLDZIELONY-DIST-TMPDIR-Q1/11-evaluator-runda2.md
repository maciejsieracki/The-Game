# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Evaluator, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Evaluator — Opus 5, effort high
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: bez zmian w kodzie; wyłącznie ten raport. Oceniany commit `d4936081`
(1 plik: `gra/tools/bramki-tmpdir-unikalnosc-test.cjs`, +38/−5) i `0b99156f` (raport).
RUNDY: 2/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Izolacja i zakres — sprawdzone samodzielnie

`git log -1` → `0b99156f`, `git status --short` pusty, `merge-base --is-ancestor af4d1e5e HEAD`
→ prawda. `git diff --name-only af4d1e5e..HEAD` → dokładnie dwa pliki, oba w allowliście.
Zero `gra/src/**`, zero `gra/data/**`, zero plików trzymanych przez `R-SZCZESCIE-*`.
Commity dodawane po jawnych ścieżkach.

## Siedem kryteriów rundy 2 — mój własny przebieg, nie odczyt raportu

| # | Kryterium | Mój wynik |
|---|---|---|
| 1 | `} else {` zamiast tłumika | `:198` — potwierdzone; `fileHasUniqueMark` już tylko w komentarzu |
| 2 | Reguła na `` `${os.tmpdir()}/nazwa` `` | R6, `:240–251` — istnieje |
| 3 | **FC-M7** — `path.join(os.tmpdir(), outName)` z powrotem w `weterani-test.cjs:75` | **CZERWONA**: `[R3] weterani-test.cjs:75`, PASS=2 FAIL=1, exit=1 |
| 4 | **FC-M5** — `` const outDir = `${os.tmpdir()}/civ-e2-dist-${variant}` `` w `ai-buduje-budynki-test.cjs:242` | **CZERWONA**: `[R6] :242`, PASS=2 FAIL=1, exit=1 |
| 5 | Zero fałszywych alarmów, czysty HEAD | PASS=3 FAIL=0, exit=0; 63 plików z tmpdir z 825 `.cjs` |
| 5b | Zero fałszywych alarmów, **symulowane drzewo integracji** (dołożony `szczescie-przebudowa-skali-test.cjs` z `main`, jedyny plik `tools/` obecny tylko tam) | PASS=3 FAIL=0, exit=0, 826 `.cjs` |
| 6 | Liczba asercji ≥ runda 1 | 3 vs 3 (`af4d1e5e:113/222/235` → HEAD `:120/255/268`) |
| 7 | `tsc --noEmit`; pięć bramek referencyjnych | exit=0; `logic` 213/213, `tech-tree` 19/19, `research` 33/33, `unit-replace` 13/13, `combat` 6/6 |

Każda mutacja cofnięta **kopią pliku** (`/…/scratchpad/bak/*.orig`), po każdej
`git diff --quiet` czysto i `git status --short` pusty. Liczby operatora zgadzają się
z moimi co do jednej (63/825).

## Trzecia i czwarta mutacja — własna bateria prób obejścia

Plik próbny `tools/zz-eval-probe.cjs` (scenariusz „55. bramka"), 19 form, po każdej usuwany.
Złapane: `path.join` literal (R1), wieloargumentowy `join` (R1), korzeń `= os.tmpdir();` (R2),
przez zmienną pośrednią `const t = os.tmpdir(); path.join(t, …)` (R2), zmienna w argumencie
(R3), `String(outName)` (R3), szablon bez znacznika (R3), konkatenacja jedno- i
wielolinijkowa (R4), `require('os').tmpdir() + …` (R4), literal `'/tmp/…'` (R5),
interpolacja (R6). Kontrole negatywne `${process.pid}` i `mkdtempSync` — zielone,
więc R6 nie jest ślepym zakazem `${tmpdir}`.

## ZARZUTY — trzy, wszystkie NOTA (żaden nie jest niespełnieniem kryterium 1–7)

**1. Sprzeczność opisu wewnątrz pliku zmienionego w tej rundzie.** Komentarz przy R6
(`:235`) mówi „Czwarta forma TEJ SAMEJ rodziny", a nagłówek zmieniony tym samym commitem
deklaruje sześć reguł i R6 jako szóstą. Dodatkowo opis R3 (`:32`) odsyła „patrz przy R3",
czyli do samego siebie. Bramka anty-nawrotowa jest czytana przez następnego autora — to
jedyne, co ją utrzymuje przy życiu.

**2. Tłumik R6 działa na całą resztę linii.** `` const D = `${os.tmpdir()}/civ-x`;
console.log(process.pid); `` → **zielona**, exit=0. Znacznik unikalności użyty w linii
z zupełnie innego powodu wycisza zgłoszenie. To dokładnie ta sama klasa błędu, którą
runda 2 usunęła z R3 — tam był na poziomie pliku, tu został na poziomie linii. Identyczny
tłumik ma R4 z rundy 1, więc poprawka tylko w R6 byłaby niespójna; to pozycja na osobną
rundę, nie na zwrot.

**3. Warunek `rest.startsWith('/')` przepuszcza wariant z konkatenacją.**
`` const D = `${os.tmpdir()}` + '/civ-x'; `` → **zielona**, exit=0: dla R6 po `}` stoi
backtick, dla R4 po `os.tmpdir()` stoi `}` zamiast `+`. Forma sztuczna, ale to jedyna
szczelina między dwiema regułami tej samej rodziny.

## Obserwacje spoza zakresu rundy 2 (R1–R5, praca rundy 1 — nie zwracam)

- `const D = os.tmpdir()` **bez średnika** → zielona; R2 wymaga `\s*;`.
- `{ dir: os.tmpdir() }` (własność obiektu, nie przypisanie) → zielona.
- `path.join(os.tmpdir(), \`civ-${Date.now()}\`)` → **czerwona**, choć ścieżka jest
  unikalna per przebieg. Fałszywy alarm zachowawczy: `UNIQUE_MARK` nie zna `Date.now`.
  Zgodne z wzorcem naprawy z dispatchu (`process.pid`/`mkdtemp`), więc nie szkodzi dziś.

## BLOKADY

Brak. Werdyktu nie wydaję.
