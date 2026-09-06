# P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 — dispatch

TEMAT: `P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.

## WYZWALACZ

Evaluator A rundy 6 miast barbarzyńców (werdykt PASS-WITH-NOTES ×3): jednostka barbarzyńska
**krąży między dwoma lub więcej niebronionymi miastami i nigdy nie dochodzi do bronionego**.
Zmierzony **stabilny cykl o okresie 22 tur** (2 miasta) / **44 tur** (3 miasta); bronione
miasto nieosiągnięte w 300 turach. Na poziomie trudnym problem znika sam, bo przejęcie
usuwa miasto z puli.

## ECHO WŁAŚCICIELA (2026-09-05) — WIĄŻĄCE

**„NAPRAWIĆ — barbarzyńca ma dokonać wyboru i iść."** Jedna reguła na **wszystkich** poziomach
trudności; właściciel jawnie odrzucił wariant „naprawić tylko na normalnym" i wariant
„zostawić jako ulgę na łatwym".

**Świadomie przyjęty skutek: barbarzyńcy robią się wyraźnie groźniejsi na łatwym poziomie.**
Zgłoszenie tego jako defektu będzie błędem Evaluatora.

## GOAL

Barbarzyńca stojący przed wyborem celu **podejmuje decyzję i ją realizuje** — albo zajmuje
niebronione miasto, albo idzie na bronione. Oscylacja bez dotarcia do żadnego celu ma zniknąć.

## PIĘĆ PUNKTÓW DO DOMKNIĘCIA (z werdyktu zbiorowego, poza samą oscylacją)

1. **Fałszywe zdanie w komentarzu** — „reżim ≥2 niebronionych daje samo-gojący się
   1-2-turowy artefakt" jest NIEPRAWDĄ (realnie stabilny cykl 22/44). Sprostuj w PL i EN.
   To nie jest regresja — przed naprawą było tak samo źle — ale overclaim zostaje w kodzie.
2. **Reżim „1 niebronione osiągalne + ≥1 bronione NIEOSIĄGALNE (inna wyspa)"** — F1 zamienia
   dawny livelock na **TRWAŁE zamrożenie** (idle 23/25 tur od t5, bez obozu). To jest
   poszerzenie znanego, świadomie-poza-zakresem defektu `if(raidReady) continue` (F3).
   **Udokumentuj jawnie w kodzie** — zamieniony błąd też był błędem; jeśli naprawa oscylacji
   go domyka, tym lepiej, ale nie zamiataj go pod dywan.
3. **Dwa nowe przypadki testowe** (Evaluator B):
   - **M2b** — etykietowanie terenu ostrzejsze niż runtime (np. Wzgórza nieprzechodnie
     w etykietowaniu, przechodnie w `computePath`) → fałszywe odrzucenie osiągalnego celu.
     Tryb ostrzegany w komentarzu kodu, **niepokryty testem**.
   - **M3** — usunięcie fallbacku `unitComp === undefined` daje 0 komend; odtwarza klasę
     „jednostka zamiera na stałe" z rundy 5.
4. **Zdanie F3 przeuogólnia** — „raidReady oznacza zero komend do końca gry" jest nieprawdą
   dla jednostek osieroconych (`orphanedActive` wygasa po `orphanedChaseTurnLimit`, dziś 10).
   Trzyma się tylko dla jednostek z żywym obozem. Dopnij jednym zdaniem.
5. **Uzupełnij tabelę 12 reżimów** o oś OSIĄGALNOŚCI i pełną listę **ośmiu** reżimów
   bit-identycznych (rejestr Operatora wymieniał trzy — niekompletność opisu, nie nieprawda).

## KRYTERIA KOŃCA (binarne)

1. **Symulacja odtwarzająca objaw:** scenariusz 2 niebronione + 1 bronione, 300 tur.
   PRZED naprawą — cykl o okresie 22, bronione nieosiągnięte. PO — barbarzyńca dociera
   do celu (dowolnego) w skończonej, podanej liczbie tur. **Podaj obie liczby.**
   To samo dla 3 niebronionych (okres 44).
2. To samo dla wszystkich trzech poziomów trudności — jedna reguła, brak warunku per trudność.
   **Udowodnij grepem**, że w naprawie nie ma odwołania do poziomu trudności.
3. Nowa bramka `gra/tools/barbarzyncy-krazenie-test.cjs` z asercjami: brak oscylacji
   w trzech reżimach (2, 3 i 4 niebronione), M2b i M3 z punktu 3 powyżej.
4. Mutacja: cofnij naprawę — bramka ma zaczerwienić, podaj liczbę faili. Cofnij przez
   KOPIĘ pliku, `git diff --quiet`.
5. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
6. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
7. Cała rodzina barbarzyńców zielona — wyznacz grepem po `gra/tools/` (`barbar`, `raid`,
   `oboz`), wypisz listę i wynik każdej.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — NAPRAWA BEZ SYMULACJI.** Ten mechanizm ma za sobą SZEŚĆ rund i w każdej
ktoś ogłaszał go naprawionym. Kryterium 1 wymaga liczb z przebiegu 300 tur przed i po,
nie rozumowania o kodzie.

**Tryb drugi — ZAMIANA JEDNEGO BŁĘDU NA DRUGI.** F1 zamieniło livelock na trwałe zamrożenie
w innym reżimie. Sprawdź **wszystkie cztery osie** (liczba niebronionych, liczba bronionych,
osiągalność, stan `raidReady`) i podaj tabelę — nie tylko ten reżim, który naprawiasz.

**Tryb trzeci — OVERCLAIM W KOMENTARZU.** Trzy z pięciu punktów tego dispatchu to zdania
w kodzie, które twierdzą więcej, niż jest prawdą. Nie dopisuj kolejnego. Każde zdanie
o zachowaniu mechanizmu ma mieć pokrycie w Twoim własnym pomiarze.

## ALLOWLISTA

- `gra/src/game/barbarians.ts`
- `gra/tools/barbarzyncy-krazenie-test.cjs` (NOWY)
- `gra/tools/*` — istniejące bramki barbarzyńców, **wyłącznie dodanie asercji**;
  zakaz usuwania i osłabiania
- `gra/data/*.json` — **wyłącznie** jeśli naprawa wymaga nowego parametru; wtedy podaj
  jego wartość domyślną i uzasadnij. Zakaz zmiany istniejących wartości balansu.
- `dyspozycje/autobot/runs/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1/` (raporty etapów)

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/src/game/ai.ts` (trzyma go temat
`P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`, §2b), pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-barbarzyncy`, gałąź `autobot/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1`.

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

## RATYFIKACJA ORKIESTRATORA (2026-09-06, odpowiedź na W1 Final Control)

**W1** (`09-final-control.md`): ubytek jednego żywego dowodu mutacyjnego w
`barb-city-behavior-test.cjs` (`expectSelfCheckFails` 8 → 7, netto 178 → 177 asercji),
wymuszony naprawą nakazaną ECHO 2026-09-05 — zmutowany wariant stał się zachowaniowo
martwy (potwierdzone przez Final Control własną sondą: 36 przebiegów × 400 tur, 3
geometrie, logi bit-identyczne).

**Decyzja właściciela: akceptuję udokumentowany ubytek — zabity dowód wypada.** Zamiennik
(trzy asercje przesłanki, czerwienieją niezależnie od Operatora, Evaluatora i Final Control)
stoi w miejscu usuniętego dowodu; nie jest wymagane zachowywanie martwego mutanta w formie
historycznej. Temat **nie wraca** do Operatora — zero `NAPRAW` w agregacie Final Control,
jedyna pozycja `DO DECYZJI CZŁOWIEKA` zamknięta tą ratyfikacją.

**Warunki integracji z §7 Final Control — do wykonania przez orkiestratora, poza pracą
Operatora:**
1. Wpis nowej bramki `gra/tools/barbarzyncy-krazenie-test.cjs` (249/0) do §6
   `R-PROC-AUTOBOT.md`.
2. Sprostowanie dwóch zdezaktualizowanych wpisów w `dyspozycje/PYTANIA-OTWARTE.md`
   (`:16636` stare `ECHO = A (2026-08-13)` sprzeczne z wiążącym ECHO 2026-09-05;
   `:16180` status ABC mimo odpowiedzi właściciela).
3. Rejestracja jako nowy temat (nie naprawa w tym temacie): bramki
   `gra/tools/barb-karencja-czas-trwania-real-render-test.cjs` i dwie
   `barbarian-cooperation-grace*` piszą dowody PNG do śledzionego katalogu runu
   `R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1` — naruszenie §2b.

**NASTĘPNY KROK:** integracja do `main` (allowlist-only, po wykonaniu trzech warunków
wyżej), nie kolejna runda Operatora.
