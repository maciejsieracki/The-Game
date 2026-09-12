TEMAT:  P-TEST-ENTITYCARD-DIORAMA-SEKCJA-D-NIEAKTUALNA-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Final Control tematu `P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1`
(zintegrowane, commit `e5ecf4b6`): sekcja D `gra/tools/entity-card-diorama-
real-render-test.cjs` (5 FAIL+timeout) testuje wprost przycisk „Pokaż
pozostałe"/`compactHeaderOnExpand` dla kart technologii — mechanizm usunięty
świadomie i legalnie tym tematem (ECHO właściciela: zawsze pokazuj wszystkie
jednostki, bez limitu i bez przycisku). Sekcje A/B/C/E (diorama jednostek/
budynków/cudów) nadal 100% zielone — problem jest lokalny do sekcji D.

## GOAL

Naprawić/usunąć sekcję D tego pliku testowego, żeby nie testowała trwale
usuniętego mechanizmu (przycisk „Pokaż pozostałe"/`compactHeaderOnExpand`
dla kart technologii), bez utraty realnego pokrycia testowego diorama 3D dla
kart technologii — jeśli sekcja D testowała TEŻ coś innego poza tym
usuniętym mechanizmem (np. samo renderowanie diorama 3D dla technologii),
to zachowaj tamtą część, usuń/przepisz tylko część dotyczącą przycisku.

## DOKŁADNE MIEJSCA

`gra/tools/entity-card-diorama-real-render-test.cjs` — przeczytaj sekcję D w
całości, zidentyfikuj DOKŁADNIE które z 5 asercji FAIL+timeout dotyczą
bezpośrednio usuniętego przycisku/`compactHeaderOnExpand` (te usuń/przepisz)
a które (jeśli jakieś) testują coś niezwiązanego (np. sam fakt że diorama 3D
renderuje się dla kart technologii — te zachowaj, napraw selektor/asercję
jeśli tylko przez to failują).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Sekcja D nie odwołuje się już do usuniętego przycisku „Pokaż pozostałe"/
   `compactHeaderOnExpand` dla kart technologii.
2. Cały plik `entity-card-diorama-real-render-test.cjs` zielony (sekcje
   A/B/C/D/E), zero timeoutów.
3. Sekcje A/B/C/E NIETKNIĘTE (zero regresu ich pokrycia — diff ograniczony do
   sekcji D).
4. Jeśli sekcja D testowała cokolwiek poza usuniętym przyciskiem (np. samo
   renderowanie diorama), to pokrycie zachowane w przeprojektowanej wersji —
   opisz w raporcie co dokładnie sekcja D sprawdza PO zmianie.
5. `tsc --noEmit` 0 błędów.
6. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.

## DOWÓD

Log pełnego przebiegu `entity-card-diorama-real-render-test.cjs` PRZED (dla
dokumentacji stanu wyjściowego) i PO (wszystkie sekcje zielone).

## Allowlista

- `gra/tools/entity-card-diorama-real-render-test.cjs`

Zakazane: `gra/src/**` (zero zmian produkcyjnych — to naprawa testu),
`gra/data/*.json`, pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-entitycard-diorama-sekcja-d`, gałąź
`autobot/P-TEST-ENTITYCARD-DIORAMA-SEKCJA-D-NIEAKTUALNA-Q1`, baza
`origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/` — dozwolona
wyłącznie `node ./node_modules/vite/bin/vite.js build --outDir <katalog
SPOZA repo> --emptyOutDir` (jeśli test wymaga świeżego builda do żywego
Chromium) oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 350 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
