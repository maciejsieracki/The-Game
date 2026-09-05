# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — dispatch (sufit dwóch kart)

TEMAT: `R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high;
Final Control — Sonnet 5, effort high. (Temat WIZUALNY — §9 poz. 6b.)

## WYZWALACZ — sprzeczność DWÓCH zatwierdzonych tematów, nie błąd wykonawcy

Znalezione przy wyjaśnianiu, dlaczego dwie bramki są czerwone (29 asercji łącznie:
`civpedia-caly-wiersz-przyciskiem` 19, `entity-card-cross-links-nested-overlay` 10).
**Nic nie jest zepsute** — karta docelowa otwiera się poprawnie, `cardTop` jest właściwy.
Spór dotyczy tego, co ma się stać z kartą ŹRÓDŁOWĄ.

**Strona A — „jedna karta naraz".** `openDialog()` (`gra/src/ui/entityCards/renderer.ts:474-479`)
bezwarunkowo woła `activeDialog.dismiss()`. To celowy wynik
`P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1`, zamówionego przez właściciela słowami „żeby nie
wszystkie włączały się naraz […] poprzednia powinna zniknąć". Kryterium K1 tamtego tematu
żąda: po kliknięciu linku krzyżowego zostaje **dokładnie 1** backdrop.

**Strona B — „stos zagnieżdżony".** `entity-card-cross-links-nested-overlay-test.cjs:163-165`
żąda `depthAfterB === 2`. Około 10 asercji `depthAfter === 2` siedzi też w
`civpedia-caly-wiersz-przyciskiem-test.cjs`.

## ECHO WŁAŚCICIELA (AskUserQuestion): „Stos, ale maksymalnie dwie karty"

**Żadna ze stron sporu nie wygrywa w całości.** Karta źródłowa **zostaje widoczna** pod
docelową (wbrew dzisiejszemu bezwarunkowemu `dismiss()`), ale **głębokość stosu jest twardo
ograniczona do 2** (wbrew nieograniczonemu stosowi). Otwarcie trzeciej karty zamyka najstarszą.

Intencja właściciela z pierwotnego tematu („żeby nie wszystkie włączały się naraz") zostaje
spełniona przez **SUFIT**, a nie przez zamykanie poprzedniej.

## GOAL

1. `openDialog()` przestaje bezwarunkowo zamykać poprzednią kartę, a zaczyna **egzekwować
   sufit 2**: przy otwarciu trzeciej karty zamykana jest **najstarsza**, nie najnowsza.
2. Nowa bramka na sekwencję **A→B→C** z asercją, że po C żyją **dokładnie dwie** karty
   i że zamknięta jest **A**, nie B.
3. Przegląd 29 czerwonych asercji w dwóch istniejących bramkach: **które zzielenieją same,
   a które utrwalały stos NIEOGRANICZONY** i wymagają aktualizacji. Każdą zmienioną asercję
   wypisz w raporcie z wartością przed i po oraz uzasadnieniem.
4. **Martwy komentarz `renderer.ts:406-411`** opisuje zachowanie „NIE zamykając karty
   źródłowej", którego kod od czasu `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` nie realizuje.
   Do poprawienia **niezależnie od reszty** — dziś wprowadza w błąd każdego, kto tam zajrzy.

## PYTANIE, NA KTÓRE WYTWÓR SAM NIE ODPOWIADA — ZATRZYMAJ SIĘ, NIE WYBIERAJ

Przy sufcie 2 trzeba rozstrzygnąć, **co znaczy zamknięcie karty B**: czy odsłania A
(naturalne przy stosie), czy zamyka obie. **Wytwór tego nie rozstrzyga i właściciel tego
nie powiedział.** Jeśli na to trafisz — zatrzymaj się ze statusem `DECISION_REQUIRED`
i przedstaw obie opcje z konsekwencjami, zamiast wybierać samodzielnie.

To samo dotyczy zachowania klawisza Escape przy dwóch kartach.

## KRYTERIA KOŃCA (binarne)

1. Sekwencja A→B: żyją **dwie** karty, A pod B, obie w DOM z niezerową powierzchnią.
2. Sekwencja A→B→C: żyją **dokładnie dwie** karty; zamknięta jest **A**; B i C żyją.
3. Nowa bramka `gra/tools/entitycard-sufit-dwoch-kart-test.cjs` pokrywa 1 i 2
   i **czerwienieje po cofnięciu zmiany** — pokaż wynik po mutacji.
4. Bramki `entity-card-cross-links-nested-overlay` i `civpedia-caly-wiersz-przyciskiem`
   **zielone** albo — jeśli któraś asercja utrwalała stos nieograniczony — zaktualizowane
   z jawnym uzasadnieniem per asercja. **Cicha zmiana oczekiwań jest niedopuszczalna.**
5. Komentarz `renderer.ts:406-411` zgodny z kodem.
6. Zrzut z żywego Chromium pokazujący **dwie karty naraz**, A widoczna pod B (§9 poz. 6b).
7. `tsc --noEmit` zielone; `civpedia-karty-nazwa-przyciskiem`, `improvement-card-callsites`,
   `unit-info-card-viewport-height-real-render`, `tech-discovery-card-real-click` zielone.
8. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Zakaz uznania tematu za zamknięty bez sprawdzenia TRZECIEJ karty.** Sekwencja A→B jest
łatwa i sama w sobie nie odróżnia „stosu z sufitem 2" od „stosu nieograniczonego" —
różnica ujawnia się dopiero przy C. Dziś **nigdzie nie ma asercji na trzecią kartę**;
to jest nowa praca, nie przegląd istniejącej.

**Drugi tryb: zzielenienie bramek przez ich osłabienie.** 29 czerwonych asercji kusi, żeby
je „dostosować". Część z nich jest teraz POPRAWNA i zzielenieje sama — te zostaw nietknięte.
Zmieniaj wyłącznie te, które wprost zakładały stos nieograniczony, i **udowodnij per asercja**,
że taka była jej treść.

**Trzeci tryb: naprawa w `openDialog()` bez sprawdzenia, kto jeszcze woła `dismiss()`.**
Przeszukaj kod i wypisz **wszystkie** miejsca zamykające kartę — jeśli któreś omija nowy
sufit, mechanizm będzie działał zależnie od drogi wywołania.

## ALLOWLISTA

- `gra/src/ui/entityCards/renderer.ts`
- `gra/tools/entitycard-sufit-dwoch-kart-test.cjs` (NOWY)
- `gra/tools/entity-card-cross-links-nested-overlay-test.cjs` — wyłącznie asercje utrwalające
  stos nieograniczony, jawnie uzasadnione
- `gra/tools/civpedia-caly-wiersz-przyciskiem-test.cjs` — jak wyżej
- `dyspozycje/autobot/runs/R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1/`

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-entitycard-stos`, gałąź `autobot/R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1`,
baza jawnie: `origin/main` na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA): „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON)
— dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir".
Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc --noEmit`.
`--outDir` POZA drzewem repo.

**UWAGA INFRA:** część bramek real-render buduje do WSPÓLNEGO katalogu w `os.tmpdir()`.
Przy porównywaniu bazy z HEAD używaj OSOBNYCH katalogów `dist` albo przebiegów
SEKWENCYJNYCH — inaczej dostaniesz fałszywy parytet.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt. Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów. **Raport commituj OD RAZU po zapisaniu.**

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta). Final Control osobnym
wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.
