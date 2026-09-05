# P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1 — dispatch

TEMAT: `P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.
(Opus dla obu ról, bo N2 jest tematem WIZUALNYM — §9 poz. 6b.)

## WYZWALACZ

Cztery uwagi Evaluatora (N2/N3/N5/N6) z werdyktu PASS-WITH-NOTES dla `b0f9bcb9`
(`R-KOPALNIA-PODSWIETLENIE-HEKSOW-Q1`), zarejestrowane jako niepilne i nienaprawione.

- **N2 — artefakt wizualny.** `depthTest:false` maluje warstwę podświetlenia PRZEZ bryłę
  terenu **globalnie**, nie tylko nad własnym heksem: heks zasłonięty grzbietem góry i tak
  dostaje krążek, a modele jednostek na podświetlonym terenie dostają niebieską poświatę
  od spodu. Świadomy kompromis — bez tego nic nie widać pod bryłą kopalni.
- **N3 — kosmetyczna niespójność.** `applySceneResult()` (`main.ts:29346-29362`) nie zeruje
  `mineEligibleGroup` po nowej grze/wczytaniu, niespójnie z trzema pozostałymi warstwami.
  Nie jest to wyciek pamięci (sprząta `clearMineEligibleOverlay`).
- **N5 — martwy kod w teście.** Tautologiczna alternatywa w asercji
  `gra/tools/kopalnia-podswietlenie-heksow-test.cjs:277`.
- **N6 — komentarz przeszacowuje efekt.** `rangeOverlay.ts:284-296` twierdzi, że krążek
  „zniknąłby w całości" pod bryłą — realnie widoczny byłby wąski pierścień na obrzeżu
  (promień tinta 0,97·HEX_R > footprint bryły 0,87–0,92·HEX_R).

## GOAL

Zamknąć N3, N5 i N6 — trzy naprawy o zerowym ryzyku. **N2 rozstrzygnąć POMIAREM**, nie
opinią: albo znaleźć rozwiązanie zachowujące widoczność pod bryłą bez globalnego
`depthTest:false`, albo udokumentować, dlaczego kompromis zostaje.

**N2 szczegółowo.** Nie zmieniaj `depthTest` „na próbę". Najpierw ustal, czy istnieje
wariant celowany — np. `depthTest:true` z `polygonOffset`, osobna warstwa renderu,
albo `depthWrite:false` przy zachowanym teście. **Zweryfikuj w ŻYWYM Chromium
(headless, zrzut ekranu), nie rozumowaniem** — §9 poz. 6b wymaga realnej weryfikacji
w przeglądarce dla tematów wizualnych. Zrób zrzut PRZED i PO, oba zapisz w
`dyspozycje/autobot/runs/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1/dowody/`.
Jeśli żaden wariant nie zachowuje widoczności pod bryłą — **zostaw `depthTest:false`**
i zapisz pomiar w raporcie; to jest wynik, nie porażka.

**N6:** popraw komentarz na zgodny z arytmetyką (0,97·HEX_R vs 0,87–0,92·HEX_R = widoczny
pierścień). **Przelicz sam** — nie przepisuj tych liczb z tego dispatchu na wiarę.

## KRYTERIA KOŃCA (binarne)

1. N3 — `applySceneResult()` zeruje `mineEligibleGroup` spójnie z trzema pozostałymi
   warstwami; asercja w bramce, która czerwienieje po cofnięciu tej zmiany.
2. N5 — tautologiczna alternatywa w `kopalnia-podswietlenie-heksow-test.cjs:277` usunięta,
   a asercja **nadal coś sprawdza**: pokaż mutację, która ją czerwieni. Liczba asercji
   w tym pliku nie może spaść.
3. N6 — komentarz zgodny z policzoną przez Ciebie arytmetyką.
4. N2 — dwa zrzuty z żywego Chromium (przed/po albo przed/„zostaje jak jest") plus jedno
   zdanie werdyktu z pomiarem.
5. `node gra/tools/kopalnia-podswietlenie-heksow-test.cjs` — zielone, z liczbą asercji
   nie mniejszą niż przed.
6. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
7. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — TEMAT WIZUALNY ZAMKNIĘTY BEZ PRZEGLĄDARKI.** §9 poz. 6b: zakaz uznania
tematu wizualnego za zamknięty bez zrzutu z żywego Chromium. N2 jest wizualny. Rozumowanie
o `depthTest` bez zrzutu nie jest dowodem.

**Tryb drugi — USUNIĘCIE ASERCJI ZAMIAST NAPRAWY TAUTOLOGII.** N5 mówi „ta asercja jest
tautologiczna". Najprostsza reakcja to ją skasować — i wtedy bramka mierzy o jedno mniej.
Napraw ją tak, żeby zaczęła cokolwiek sprawdzać, i udowodnij mutacją.

**Tryb trzeci — RACHUNEK „NA OKO".** Liczby 0,97·HEX_R i 0,87–0,92·HEX_R pochodzą
z raportu Evaluatora. Przelicz je z kodu samodzielnie i **zgłoś rozbieżność, jeśli ją
znajdziesz**, zamiast przepisywać do komentarza cudzy wynik.

## ALLOWLISTA

- `gra/src/render/rangeOverlay.ts`
- `gra/src/main.ts` — **wyłącznie** `applySceneResult()` w zakresie zerowania
  `mineEligibleGroup` (N3). Nic więcej w tym pliku.
- `gra/tools/kopalnia-podswietlenie-heksow-test.cjs`
- `dyspozycje/autobot/runs/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1/` (raporty i `dowody/`)

Zakazane bezwzględnie: pozostałe `gra/src/**`, `gra/data/**`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-kopalnia`, gałąź `autobot/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1`.

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
