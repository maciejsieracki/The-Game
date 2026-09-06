# P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 — dispatch

TEMAT: `P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`
RUNDA: 1/5
DATA: 2026-09-06
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.
(Opus dla obu ról — temat WIZUALNY, §9 poz. 6b.)

## WYZWALACZ

Znalezisko Final Control tematu `R-BUDYNEK-GARNIZON-NOWY-Q1` (runda 2), potwierdzone
przez orkiestratora własnym odczytem kodu.

**Przycisk „Więcej informacji (Civpedia)" na kartach encji nie robi NIC — dla żadnej encji
w grze.** Nie chodzi o brakujące hasła; chodzi o to, że klik nigdzie nie trafia.

## RECON (potwierdzony przez orkiestratora; POTWIERDŹ własnym odczytem)

`gra/src/ui/entityCards/renderer.ts`:

- **`:375-384`** — przycisk stopki dostaje atrybuty **`data-civpedia-folder`**
  i **`data-civpedia-slug`**, i **nie dostaje żadnego `addEventListener`**.
- **`:434`** — jedyny delegowany listener na karcie łapie selektorem
  **`button[data-entity-kind]`**. Przycisk CivPedii **nie ma** tego atrybutu, więc
  nie jest łapany. Komentarz przy tym listenerze mówi wprost, że selektor „celowo nie łapie"
  korzenia karty — o przycisku CivPedii nie wspomina wcale.
- **`openEncyEntry`** — trzy wystąpienia w całym `gra/src`, wszystkie w
  `gra/src/ui/wikiHubHud.ts` (`:41` typ, `:315` definicja, `:546` eksport w `api`).
  **Zero wywołań** z kodu kart.

**Skala: wszystkie cztery rodzaje kart** (budynek, jednostka, technologia, ulepszenie terenu)
i wszystkie tryby (dialog, inline, hover). To nie jest defekt Garnizonu ani budynków —
to jedna martwa ścieżka dla całej rodziny.

**Uwaga o skali osobnej, nie mylić:** 25 z 42 budynków **nie ma hasła** w CivPedii.
To drugi, niezależny brak. Ten temat naprawia **klik**; braki treści są osobną sprawą
i tego tematu nie dotyczą.

## GOAL

Klik w „Więcej informacji (Civpedia)" otwiera odpowiednie hasło — dla wszystkich czterech
rodzajów kart. Gdy hasła nie ma, gracz dostaje **czytelny komunikat** zamiast ciszy.

## G1 — RECON PRZED ZMIANĄ (obowiązkowy)

`renderEntityCard` jest funkcją czystą budującą DOM; `wikiHubHud` to osobny moduł z własnym
`api`. **Ustal, jak karta ma sięgnąć do huba** — i wybierz zgodnie z tym, co ten projekt
już robi dla podobnych przejść, a nie „jak byłoby elegancko". Kandydaci do sprawdzenia:
callback w danych karty (jak `action.onClick`), zdarzenie na `document`, wstrzyknięta
zależność. **Wypisz w raporcie, który wzorzec wybrałeś i który istniejący kod jest dla
niego precedensem.**

Sprawdź też, czy `civpediaLink.folder`/`slug` faktycznie odpowiadają argumentom
`openEncyEntry(folder, id)` — jeśli nie, to jest druga część defektu i ma być naprawiona
tutaj, nie zgłoszona jako osobna.

## KRYTERIA KOŃCA (binarne)

1. Klik w przycisk CivPedii **otwiera hasło** dla wszystkich czterech rodzajów kart.
   **Zrzuty z żywego Chromium** dla każdego z czterech — przed (nic się nie dzieje)
   i po (hasło otwarte) — w `dyspozycje/autobot/runs/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1/dowody/`.
   §9 poz. 6b: bez zrzutów temat jest niedomknięty.
2. **Brak hasła = czytelny komunikat, nie cisza.** Zaproponuj treść i pokaż na zrzucie.
   25 z 42 budynków nie ma hasła, więc ta ścieżka jest częstsza niż ta z punktu 1.
   **Zakaz ukrywania przycisku** jako „naprawy" — właściciel odrzucił ten wariant.
3. **Nowa bramka `gra/tools/entitycard-civpedia-klik-test.cjs`**: buduje kartę, URUCHAMIA ją
   (esbuild + jsdom, wzorem `szczescie-przebudowa-skali-test.cjs` sekcja 2i(8)) i asertuje,
   że klik faktycznie woła handler z poprawnym `folder`/`slug` — **dla każdego z czterech
   rodzajów kart osobno**. Asercja na sam fakt ustawienia atrybutu jest **niewystarczająca**:
   to dokładnie ten rodzaj asercji, który przepuścił obecny defekt.
4. Mutacja: usuń rejestrację handlera → bramka czerwona, podaj liczbę faili. Druga mutacja:
   podmień `slug` na nieistniejący → ma zadziałać ścieżka z punktu 2, nie wyjątek.
   Obie cofnij przez KOPIĘ pliku, `git diff --quiet`.
5. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
6. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
7. **Cała rodzina kart encji zielona** — wyznacz grepem po `gra/tools/` (`entity-card`,
   `entitycard`, `civpedia`, `karty`), wypisz listę i wynik każdej. Szczególnie
   `entity-card-contract-test.cjs` (75/0) i `civpedia-budynki-historia-test.cjs`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — ASERCJA NA ATRYBUT ZAMIAST NA ZACHOWANIE.** Ten defekt przeżył migrację
całej rodziny kart (dziesięć tematów T1–T10), bo istniejące bramki sprawdzają, że atrybuty
`data-civpedia-*` **są ustawione** — i one są. Nikt nie sprawdził, czy klik cokolwiek robi.
Kryterium 3 wymaga uruchomienia karty i wywołania kliku, nie odczytu DOM.

**Tryb drugi — NAPRAWA JEDNEGO RODZAJU KARTY.** Najłatwiej zrobić to dla budynków i uznać
za zrobione. Kryteria 1 i 3 wymagają czterech rodzajów osobno.

**Tryb trzeci — TEMAT WIZUALNY BEZ PRZEGLĄDARKI.** §9 poz. 6b. Handler, którego nikt nie
kliknął na ekranie, nie jest zweryfikowany.

**Tryb czwarty — CICHE UKRYCIE PRZYCISKU.** Właściciel rozważył ten wariant i **odrzucił go**.
Przycisk ma działać, a nie znikać.

## ALLOWLISTA

- `gra/src/ui/entityCards/renderer.ts`
- `gra/src/ui/entityCards/` — pozostałe pliki, jeśli recon G1 wykaże, że kontrakt danych
  karty wymaga rozszerzenia (np. o callback); wypisz je jawnie w raporcie
- `gra/src/ui/wikiHubHud.ts` — **wyłącznie** jeśli hub musi wystawić wywołanie na zewnątrz;
  zakaz zmiany jego zachowania dla istniejących wywołujących
- `gra/tools/entitycard-civpedia-klik-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1/` (raporty i `dowody/`)

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/data/**`, `docs/encyklopedia/**`
(braki treści to osobna sprawa), pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .` — dodawaj po jawnych ścieżkach.

## IZOLACJA

Worktree `/home/user/wt-civpedia-klik`, gałąź `autobot/P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1`,
baza wskazana jawnie przy zakładaniu.
PRZED pracą: `git -C <worktree> log -1 --oneline` i `git status --short`. Rozbieżność →
`BLOCK`, bez zapisu. Mutacje cofaj przez KOPIĘ pliku, nigdy przez `git checkout`.

C-001 (bariera CHRONIONA), brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/`
(export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". Jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`. `--outDir` poza drzewem repo,
z UNIKALNYM sufiksem (PID albo losowy).
**Uwaga:** `civpedia-gra-id-mostek-test.cjs` przy uruchomieniu nadpisuje śledzony
`gra/src/data/wikiBundle.json` (stempel `generated`) — po jej uruchomieniu sprawdź `git diff`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Przy decyzji produktowej zatrzymujesz się
ze statusem `DECISION_REQUIRED` i zapisujesz `decision-abc.md` (C-054).
Raport ok. 400 słów, destylat.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.
