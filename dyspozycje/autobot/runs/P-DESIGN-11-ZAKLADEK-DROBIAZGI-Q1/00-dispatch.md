# P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1 — dispatch

TEMAT: `P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.
(Opus dla obu ról — temat WIZUALNY, §9 poz. 6b.)

## WYZWALACZ

Pięć uwag Evaluatora (N1/N5/N9/N11/N12) do `a6ed0553` (panel imperium, runda 2), świadomie
nienaprawionych i zarejestrowanych jako kosmetyczne. Przy przeglądzie backlogu wyszło,
że **jedna z nich nie jest kosmetyczna** — patrz N1.

- **N1 — ⚠ TO JEST REALNA PRACA, NIE SPROSTOWANIE.** Opis commita twierdził „wszystkie
  zielone" dla bramek panelu, pomijając, że `gra/tools/empire-panel-moc-scroll-preserve-test.cjs`
  jest **pre-istniejąco CZERWONY (38/9)**, potwierdzone identycznie na commicie-rodzicu.
  Historii commita nie da się przepisać — ale **czerwoną bramkę da się naprawić** i to jest
  główny cel tego tematu.
- **N5** — box „DOCHÓD SZLAKÓW" w zakładce Handel drukuje tę samą liczbę co hero (bonus
  cudów pokazany osobno jako %). Nie myli gracza (liczby spójne, nie sprzeczne).
- **N9** — „−0 / turę" przy zerowym koszcie żywności armii; zachowanie PRE-ISTNIEJĄCE,
  teraz tylko w bardziej widocznej czerwonej plakietce.
- **N11** — komentarz przy `cityPoborMiniRekruci()` mówi „domyślne wywołanie bez zmian",
  a tabela dostała nową klasę wyrównania i wiersz RAZEM zmienił styl.
- **N12** — ikona przy eyebrow występuje tylko w zakładce Surowce (`chip-crate`); makieta
  ma ją też w Handlu, Armii i Kulturze. Niespójność między czterema zakładkami tego samego
  commita.

## GOAL

1. **N1 — `empire-panel-moc-scroll-preserve-test.cjs` zielony.** To jest rdzeń tematu.
   Najpierw ustal **grzebiąc w kodzie, nie zgadując**, czy 9 faili to (a) realny defekt
   zachowania panelu, czy (b) bramka opisująca stan, którego już nie ma. Odpowiedź decyduje
   o naprawie: (a) napraw kod, (b) przepisz asercje na aktualny kontrakt — **nigdy nie usuwaj
   asercji, liczba nie może spaść**. Uzasadnij wybór dowodem z kodu.
2. **N12 — ikona eyebrow spójna w czterech zakładkach**, zgodnie z makietą.
3. **N11 — komentarz zgodny z faktem.**
4. **N5 i N9 — zostają BEZ ZMIAN.** Oba to zachowania pre-istniejące i niemylące. Zapisz
   w raporcie jedno zdanie, dlaczego świadomie ich nie ruszasz. **Nie „naprawiaj przy okazji"**
   — N9 dotyka formatowania liczb w całym panelu i wykracza poza ten temat.

## KRYTERIA KOŃCA (binarne)

1. `node gra/tools/empire-panel-moc-scroll-preserve-test.cjs` — zielone, liczba asercji
   **nie mniejsza niż 47** (dziś 38 pass + 9 fail).
2. Dla N1 — jawny werdykt (a) albo (b) z dowodem z kodu; przy (b) tabela „co asercja
   sprawdzała przed / przez co jest sprawdzane po" dla każdej z 9.
3. N12 — ikona obecna w czterech zakładkach; **zrzut z żywego Chromium** wszystkich czterech,
   PRZED i PO, w `dyspozycje/autobot/runs/P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1/dowody/`.
4. Mutacja: usuń ikonę z jednej zakładki i pokaż, że bramka to łapie. Jeśli żadna bramka
   tego nie łapie — **dołóż asercję**, inaczej niespójność wróci.
5. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
6. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
7. Cała rodzina panelu imperium zielona — wyznacz grepem po `gra/tools/` (`empire`,
   `panel`), wypisz listę i wynik każdej.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — „PRE-ISTNIEJĄCY, WIĘC NIE MÓJ".** Ta bramka jest czerwona od dawna
i łatwo ją opisać jako cudzy problem. Zgłoszenie właściciela dotyczy właśnie tego, że
takie rzeczy zostają. Naprawa jest celem, nie opcją.

**Tryb drugi — ZIELONO PRZEZ SKASOWANIE DZIEWIĘCIU ASERCJI.** Kryterium 1 podaje minimalną
liczbę asercji właśnie po to.

**Tryb trzeci — TEMAT WIZUALNY BEZ PRZEGLĄDARKI.** §9 poz. 6b. N12 jest wizualne.

**Tryb czwarty — ROZLANIE ZAKRESU NA N5/N9.** Kuszące, bo wyglądają na „przy okazji".
GOAL 4 mówi wprost: zostają. Ruszenie ich = naruszenie zakresu.

## ALLOWLISTA

- `gra/src/ui/empireDetailPanel.ts`
- `gra/src/ui/empireMiastaTable.ts` (jeśli recon wykaże, że tam żyje N11/N12)
- `gra/tools/empire-panel-moc-scroll-preserve-test.cjs`
- `dyspozycje/autobot/runs/P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1/` (raporty i `dowody/`)

Jeśli recon wskaże, że N12 mieszka w innym pliku UI — **zgłoś to i poproś o rozszerzenie
allowlisty**, nie rozszerzaj jej sam.

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/data/**`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-design-zakladki`, gałąź `autobot/P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów, destylat.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

## C-001 (bariera CHRONIONA)

Brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON) —
dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir".
Jedyna dozwolona kompilacja to `node ./node_modules/typescript/bin/tsc --noEmit`; bramki
`node gra/tools/*-test.cjs` nie są nim objęte. `--outDir` poza drzewem repo, z UNIKALNYM
sufiksem (PID albo losowy).

## GUARD IZOLACJI (§2b, obowiązkowy przed pracą)

`git -C <worktree> log -1 --oneline` i `git -C <worktree> status --short`. Oczekiwana baza
i czyste drzewo. Rozbieżność → `BLOCK`, bez zapisu. Mutacje cofaj przez KOPIĘ pliku,
nigdy przez `git checkout`.
