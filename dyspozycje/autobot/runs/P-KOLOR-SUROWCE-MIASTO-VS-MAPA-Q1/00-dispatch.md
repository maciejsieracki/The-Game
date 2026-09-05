# P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 — dispatch

TEMAT: `P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.
(Opus dla obu ról — temat WIZUALNY, §9 poz. 6b.)

## WYZWALACZ (właściciel, 2026-08-09)

> „trzeba ujednolicić zasady kolorów prezentacji surowców między panelem miasta a głównym
> HUD-em mapy świata — różne miejsca używają różnych konwencji kolorystycznych dla tych
> samych sześciu surowców"

Sześć surowców: **Praca, Żywność, Skarbiec, Nauka, Kultura, Religia.**
Właściciel dodał: *„to jest temat na później"* — dziś „później" nadeszło.

## GOAL

Jeden surowiec = jeden kolor w całej grze, wzięty z **jednego źródła prawdy**.

## G1 — RECON OBOWIĄZKOWY, PRZED JAKĄKOLWIEK ZMIANĄ

Orkiestrator sprawdził: **nie ma dziś centralnej palety surowców** — grep po
`RESOURCE_COLOR`, `SUROWCE_KOLOR`, `resourceColor`, `kolorSurowca` daje zero trafień.
Kolory są rozsiane. **Twoim pierwszym zadaniem jest je znaleźć i policzyć**, nie zgadnąć.

Wynikiem G1 jest **tabela w raporcie**: dla każdego z sześciu surowców — każde miejsce
w kodzie, które nadaje mu kolor (plik + linia + wartość). Szukaj w `gra/src/ui/`,
`gra/src/render/`, `gra/src/ui/brandTokenVars.ts`, w CSS-ach i w tokenach marki.
**Jeśli tabela pokaże, że kolory są już spójne** — to jest wynik, zgłoś `PASS`
z dowodem i nie zmieniaj niczego. Zgłoszenie właściciela jest z sierpnia; od tamtej pory
przeszło przez ten obszar kilka tematów.

## G2 — JEDNO ŹRÓDŁO PRAWDY

Jeśli G1 wykaże rozjazd: utwórz jedną, jawną paletę (moduł TS albo tokeny CSS —
**wybierz zgodnie z tym, co ten projekt już robi**, uzasadnij wybór w raporcie) i przepnij
wszystkie znalezione miejsca. **Nie wymyślaj nowych kolorów** — wybierz spośród już
używanych i uzasadnij, który wariant wygrywa (np. „ten z HUD mapy, bo pojawia się
w 7 miejscach wobec 2"). **To NIE jest decyzja projektowa o nowej kolorystyce** —
gdyby okazało się, że żaden istniejący wariant nie jest dobry, to jest `DECISION_REQUIRED`
do właściciela, nie Twój wybór.

## KRYTERIA KOŃCA (binarne)

1. Tabela G1 w raporcie: sześć surowców × wszystkie miejsca nadania koloru.
2. Jeśli był rozjazd — jedno źródło prawdy istnieje i **wszystkie** znalezione miejsca
   z niego czytają. Grep po starych literałach kolorów daje zero trafień poza paletą.
3. **Nowa bramka `gra/tools/kolor-surowce-spojnosc-test.cjs`**: skanuje źródła i czerwienieje,
   gdy którykolwiek z sześciu surowców dostaje kolor z pominięciem palety. To jest
   zabezpieczenie przed nawrotem — bez niego rozjazd wróci przy następnym panelu.
4. **Zrzuty z żywego Chromium** (§9 poz. 6b): panel miasta i HUD mapy, PRZED i PO,
   zapisane w `dyspozycje/autobot/runs/P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1/dowody/`.
   Bez nich temat jest niedomknięty.
5. Mutacja: zmień kolor jednego surowca w palecie i pokaż, że nowa bramka czerwienieje
   ORAZ że zmiana widać na obu zrzutach. Cofnij, `git diff --quiet`.
6. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
7. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6. Plus wszystkie bramki UI, które znajdziesz grepem
   po `cityPanel`, `hud`, `empire` — wypisz listę i wynik każdej.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — ZGADYWANIE ZAMIAST RECONU.** Nazwy plików i stałych w tym dispatchu
są HIPOTEZAMI orkiestratora. Nie ma centralnej palety; nie zakładaj, gdzie „powinny"
być kolory. G1 jest obowiązkowe i jego wynik może obalić cały plan.

**Tryb drugi — TEMAT WIZUALNY BEZ PRZEGLĄDARKI.** §9 poz. 6b. Zmiana koloru, której nikt
nie zobaczył na ekranie, nie jest zweryfikowana.

**Tryb trzeci — CICHA ZMIANA KOLORYSTYKI GRY.** Ujednolicenie znaczy „wybierz jeden
z istniejących", nie „zaprojektuj nową paletę". Każdy surowiec, którego kolor się zmienia,
ma być wymieniony w raporcie z wartością przed i po. Kolorystyka jest domeną właściciela.

## ALLOWLISTA

- Pliki wskazane przez recon G1 — **wyłącznie w zakresie kolorów sześciu surowców**.
  Wypisz je jawnie w raporcie rundy; jeśli lista wyjdzie poza `gra/src/ui/` i
  `gra/src/render/`, zgłoś to jako BLOKADĘ przed zmianą.
- Nowy moduł palety (ścieżkę wybierasz zgodnie z konwencją projektu, podaj w raporcie)
- `gra/tools/kolor-surowce-spojnosc-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1/` (raporty i `dowody/`)

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/data/**`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-kolor-surowce`, gałąź `autobot/P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1`.

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
`node gra/tools/*-test.cjs` nie są nim objęte. `--outDir` musi wskazywać katalog POZA
drzewem repo i z UNIKALNYM sufiksem (PID albo losowy).

## GUARD IZOLACJI (§2b, obowiązkowy przed pracą)

`git -C <worktree> log -1 --oneline` i `git -C <worktree> status --short`. Oczekiwana baza
i czyste drzewo. Rozbieżność → `BLOCK`, bez zapisu. Mutacje cofaj przez KOPIĘ pliku,
nigdy przez `git checkout`.
