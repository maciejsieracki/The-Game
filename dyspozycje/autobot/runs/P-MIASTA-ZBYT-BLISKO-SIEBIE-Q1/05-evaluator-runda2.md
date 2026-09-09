STATUS: PASS
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozować i naprawić przypadki miast AI (główne cywilizacje i/lub miasta-państwa)
powstających poniżej minimalnego dystansu, mimo istniejącej reguły MIN_CITY_DISTANCE/
MIN_CITY_DISTANCE_START_CITY_STATE w canFoundCity (gra/src/game/cities.ts).

## Uwaga o lokalizacji artefaktów procesu (bez zmian od poprzednich rund)

Worktree `/home/user/wt-miasta-blisko` nadal nie zawiera `00-dispatch.md`. Ten raport
zapisuję w `/home/user/The-Game`, zgodnie z notą z rund poprzednich. Cała weryfikacja
(testy, czytanie diffu) wykonana WYŁĄCZNIE w worktree `/home/user/wt-miasta-blisko`.

## Niezależna weryfikacja — cztery punkty z dyspozycji

### (1) `node tools/cluster-start-test.cjs` — pełna lista FAIL, nie tylko licznik

Uruchomione DWA RAZY niezależnie w tej rundzie (raz z `tail -80` — niewystarczające,
FAILe drukowane przez `console.error` wcześniej w strumieniu niż ostatnie 80 linii; raz
z pełnym zrzutem do pliku, bez obcinania). Wynik pełnego przebiegu: **395 passed, 20
failed** — identyczne liczby z raportem Operatora.

Pełna lista 20 FAIL (`grep -n '^FAIL:'` na pełnym, nieobciętym logu):
1. `stolica gracza = Ateny`
2. `każdy obcy typ z miastami ma stolicę klastra (ekspansyjna AI)` ← NOWY, jawnie
   zgłoszony przez Operatora jako BLOKADA 1
3. `kandydaci runtime: poprawny łańcuch hubów`
4-6. `miasta-panstwa >= 5 hex (3)` ×3
7. `rywal min 5 hex od stolicy (3)`
8. `pre-plan MP: poprawny łańcuch hubów`
9-12. `runtimeCandidates pairwise >= 5 hex (3)` ×4
13-14. `runtimeCandidate min 5 hex od stolicy (3)` ×2
15. `runtimeCandidates: poprawny łańcuch hubów (5 slotów)`
16. `hub-chain 50×50: 6 slotów MP (got 5)`
17. `zarezerwowany slot wzrostu w klastrze`
18. `Standard: stolica obcego typu inkowie min 10 hex od morza (seaDist=9)`
19. `Standard: stolica obcego typu egipt min 10 hex od morza (seaDist=8)`
20. `Duża: minDystansObcyOdGracza=16 (got 18)`

Porównanie tekstowe (nie tylko liczbowe) z 19 FAIL bazowych z raportu Operatora: **19 z 20
to identyczny tekst** do listy bazowej Operatora (kolejność inna, treść identyczna) — POTWIERDZONE.
Jedyna różnica: pozycja 2 (`każdy obcy typ z miastami ma stolicę klastra`) — nowy FAIL,
zgodny z BLOKADĄ 1 zgłoszoną przez Operatora.

Osobno sprawdziłem `grep`-em, że ŻADEN z 5 nazwanych w dispatchu regresji rundy 1
(`owner 6/7/10 → typ rzymianie`, `owner 16 → typ inkowie`, `typCityCopyOwners = państwa
bez stolic klastrów`) nie występuje w tej pełnej liście 20 FAIL — POTWIERDZONE, wzorcem
`grep -iE "rzymian|owner|typCityCopyOwners|stolic.*klastra"` na liniach `FAIL:` (jedyne
trafienie to nowy, już zgłoszony FAIL nr 2). Dodatkowo zlokalizowałem źródło asercji
`typCityCopyOwners = państwa bez stolic klastrów` (`tools/cluster-start-test.cjs:111-112`)
i asercji `owner ${oid} → typ ${fc.typ}` (linia 176, iterująca po `plan.foreignTypeClusters`)
— obie strukturalnie zależą dokładnie od pól, które Operator filtruje tej rundy
(`foreignTypeClusters`/`clusterCapitalOwnerIds` względem `acceptedOwnerIds`), co potwierdza
przyczynowość naprawy, nie przypadek.

Wniosek (1): **5 nazwanych regresji potwierdzone jako zniknięte, brak jakichkolwiek innych,
nienazwanych nowych regresji poza tą jedną jawnie zgłoszoną (BLOKADA 1)** — POTWIERDZONE.

Zastrzeżenie metodologiczne (nie zarzut, luka w pokryciu dowodu): nie odtworzyłem
samodzielnie świeżego baseline PRE przez `git stash` (kolejny ~28-minutowy przebieg) —
polegam na tym, że 19/20 tekstów FAIL jest identycznych z listą, którą Operator (i ja
niezależnie w tej rundzie) już zmierzyliśmy jako bajt-identyczną z `origin/main` w
poprzednich przebiegach. Traktuję to jako wystarczające dla tej rundy przy uwzględnieniu
budżetu czasowego (pojedynczy przebieg tej bramki to ~28 min, drugi round-trip PRE/POST
kolejne ~28-56 min).

### (2) `node tools/miasta-zbyt-blisko-test.cjs` — Zarzuty 1/2/3 z rundy 1

Uruchomione niezależnie w tej rundzie:
```
Map wygenerowanych: 20
Par miast sprawdzonych łącznie: 23329
Naruszenia minimalnego dystansu: 0
[Zarzut 1] Widmowi właściciele (zarejestrowani bez miasta): 0
[Zarzut 2+3] Symulacja realnej kolejności spawnu (rywale → obce klastry+kolonie):
Par sprawdzonych łącznie: 25768
Naruszenia: 0
PASS — plan: 23329/23329 par w normie, widma: brak, realna kolejność: 25768/25768 par w normie
```
`findGhostOwners=0`, `simulateRealSpawnOrder=0/25768` — POTWIERDZONE, identyczne z
raportem Operatora, fixy Zarzutów 1/2/3 z rundy 1 nadal działają, naprawa tej rundy
(dotykająca wyłącznie `foreignTypeClusters`/`clusterCapitalOwnerIds`, pola nieużywane
przez tę bramkę) ich nie naruszyła.

### (3) Diff `gra/src/game/cluster-start.ts` — punktowość zmiany

Przeczytany w całości (`git diff` względem `origin/main`, plus odczyt bieżącego pliku
linia po linii, sekcja `buildClusterStartPlan`). Struktura zgodna z opisem Operatora:
- Blok `acceptedForDistance`/kolizja/rejestracja-po-`continue` — to fix Zarzutu 1 z rundy 1
  (potwierdzony już w `02-evaluator-runda1.md` i obronie rundy 1), NIE dotknięty tej rundy.
- Nowy w tej rundzie: `acceptedOwnerIds: Set<number>` wypełniany w tej samej pętli
  (`.add(slot.ownerId)` zaraz po `.push(...)` do `acceptedForDistance`), oraz zastąpienie
  bezpośredniego przepisania `spawnPlan.foreignTypeClusters`/`spawnPlan.clusterCapitalOwnerIds`
  filtrowaniem przez ten zbiór — dokładnie WYŁĄCZNIE te dwa pola, zwrot funkcji (`return {...}`)
  poza tym niezmieniony (wszystkie inne pola nadal `spawnPlan.X` wprost).
- Filtrowanie `foreignTypeClusters` jest parami (`ownerIds[i]`+`positions[i]` razem), grupa
  pusta po filtrze jest usuwana — zgodne z asercją `ownerIds.length === positions.length`
  (`cluster-start-test.cjs:174`, NIE naruszona — nie ma jej na liście 20 FAIL).
- Import `hexDistance`/`MIN_CITY_DISTANCE`/`MIN_CITY_DISTANCE_START_CITY_STATE` — z rundy 1,
  progi zweryfikowane już w rundzie 1 1:1 z `cities.ts:1159-1173` (Evaluator rundy 1),
  nie ruszane tej rundy.

Sprawdziłem też `git diff --stat`: poza `cluster-start.ts` zmienione są WYŁĄCZNIE
`ai-difficulty-bonus.ts` (fix `pickBonusCityHex`, opisany w `01-operator-runda1.md`) i
`main.ts` (zdjęcie `clusterStartSlot=true` w `spawnPendingForeignClusters`, opisane tamże)
— oba to zmiany RUNDY 1, treść diffu odpowiada dokładnie opisowi z `01-operator-runda1.md`/
`03-obrona-runda1.md` (linia `foundCityAt(..., isCS, true)` → `foundCityAt(..., isCS)` w
main.ts; przepisany `pickBonusCityHex` na przeszukiwanie rosnącego promienia z realnym
`canFoundCity` w ai-difficulty-bonus.ts). Żadnych dodatkowych zmian w tych plikach w tej
rundzie — POTWIERDZONE zgodne z allowlistą i z deklaracją Operatora "main.ts/
ai-difficulty-bonus.ts niedotknięte tej rundy".

`node ./node_modules/typescript/bin/tsc --noEmit` (uruchomione samodzielnie) → **0 błędów**,
`git diff --check` → czysto (potwierdzone).

Wniosek (3): zmiana tej rundy jest punktowa (wyłącznie `foreignTypeClusters`/
`clusterCapitalOwnerIds` w `buildClusterStartPlan`), zgodna z allowlistą — POTWIERDZONE.

### (4) Czy Operator zmienił `cluster-start-test.cjs` (zakaz)

`git diff --stat -- tools/cluster-start-test.cjs` / `git status --short tools/cluster-start-test.cjs`
→ brak jakiegokolwiek wyniku, plik BEZ ŻADNEJ zmiany względem `origin/main` —
POTWIERDZONE, zakaz przestrzegany.

## ZARZUTY

Brak. Wszystkie cztery punkty weryfikacji z dyspozycji potwierdzone niezależnie, bez
rozbieżności z raportem Operatora.

## TESTY (uruchomione niezależnie przeze mnie, w worktree)

- `tsc --noEmit` → 0 błędów.
- `miasta-zbyt-blisko-test.cjs` → PASS 23329/23329, widma 0, realna kolejność 25768/25768.
- `cluster-start-test.cjs` (pełny przebieg, bez obcinania) → 395 passed/20 failed; pełna
  lista FAIL porównana tekstowo — 19/20 identyczne z bazą Operatora, 1 nowy (BLOKADA 1
  Operatora, zgodny opis); 0/20 pasuje do nazw 5 regresji z dispatchu.
- `git diff --stat` / `git status --short` → wyłącznie `cluster-start.ts`,
  `ai-difficulty-bonus.ts`, `main.ts` + nowy plik testowy zmienione; `cluster-start-test.cjs`
  bez zmian.
- `git diff --check` → czysto.
- Odczyt źródłowy `tools/cluster-start-test.cjs:111-112,174,176` (asercje bezpośrednio
  zależne od pól filtrowanych tej rundy) — potwierdza przyczynowość naprawy.

## BLOKADY

1. BLOKADA 1 Operatora (`cluster-start-test.cjs`: nowy FAIL "każdy obcy typ z miastami ma
   stolicę klastra") — potwierdzam jako realną, jawnie zgłoszoną, nieukrytą. Wymaga decyzji
   DECISION_REQUIRED na rundę 3: (a) rozszerzyć allowlistę o `typCityCopyOwners` i naprawić
   oba pola razem, albo (b) zaakceptować rzadki przypadek klastra obcego typu bez formalnej
   "stolicy" i złagodzić TĘ JEDNĄ asercję w `cluster-start-test.cjs` za zgodą
   właściciela/orkiestratora (plik poza allowlistą tej rundy). Rekomendacja: (a), bo
   `clusterCapitalOwnerIds` jest realnie używane w main.ts do logiki ekspansyjnej AI.
2. `miasta-panstwa-wylaczone-test.cjs` — 3 FAIL, bez zmian od rundy 1 (byte-identyczność
   planu vs `origin/main`, oczekiwany skutek uboczny), decyzja u orkiestratora/Final Control
   po integracji — nie zbadane osobno w tej rundzie (poza zakresem 4 punktów dyspozycji).
3. Lokalizacja artefaktów procesu — bez zmian od rundy 1.
4. `map-gen-regression-test.cjs` nadal pominięta — bez zmian.
5. (Metodologiczne, nieblokujące) Nie odtworzyłem samodzielnie świeżego baseline PRE przez
   `git stash` w tej rundzie z powodu budżetu czasowego (~28 min/przebieg) — polegam na
   zgodności tekstowej 19/20 FAIL z wcześniej potwierdzonym bajt-identycznym baseline.

## RUNDY: 2/5

## NASTĘPNY KROK: Evaluator → Final Control (temat gotowy do przekazania; BLOKADA 1 jako
DECISION_REQUIRED na rundę 3, nie blokuje przekazania — 5 nazwanych regresji rundy 1
potwierdzone jako naprawione, żadna nowa nienazwana regresja nie znaleziona, wszystkie
4 punkty weryfikacji z dyspozycji spełnione).
DEPLOY/PUSH: NIE WYKONANO
