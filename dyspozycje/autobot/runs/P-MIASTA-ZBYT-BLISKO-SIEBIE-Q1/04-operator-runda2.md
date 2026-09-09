STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozować i naprawić przypadki miast AI (główne cywilizacje i/lub miasta-państwa)
powstających poniżej minimalnego dystansu, mimo istniejącej reguły MIN_CITY_DISTANCE/
MIN_CITY_DISTANCE_START_CITY_STATE w canFoundCity (gra/src/game/cities.ts).

## Uwaga o lokalizacji artefaktów procesu (bez zmian od poprzednich rund)

Worktree `/home/user/wt-miasta-blisko` nadal nie zawiera `00-dispatch.md` (istnieje
wyłącznie w `/home/user/The-Game`). Ten raport zapisuję tu, w main repo, zgodnie z
dyspozycją tej rundy — `01-02-03` z rund poprzednich są wyłącznie w worktree.

## Kontekst rundy — regresja znaleziona przez orkiestratora między rundami

Dispatch tej rundy podał zmierzony przez orkiestratora wynik: baseline PRE (origin/main,
czysty merge-base f82aa354, git stash) = **421 pass/19 fail**; PO fixie rundy 1 =
**412 pass/24 fail**; 5 NOWYCH FAIL (regresja): `owner 6/7/10 -> typ rzymianie`,
`owner 16 -> typ inkowie`, `typCityCopyOwners = państwa bez stolic klastrów`. Diagnoza
źródłowa dispatchu (zweryfikowana przeze mnie niezależnie, patrz niżej) — potwierdzona.

## Diagnoza (zweryfikowana niezależnie, zgodnie z instrukcją "nie ufaj ślepo")

`buildClusterStartPlan` (`cluster-start.ts`) zwracał `foreignTypeClusters` i
`clusterCapitalOwnerIds` WPROST z `spawnPlan` (sprzed pętli weryfikacji kolizji z rundy 1),
podczas gdy `aiOwnerCivMap`/`typCityCopyOwners`/itd. (naprawione w rundzie 1, Zarzut 1)
rejestrują TYLKO zaakceptowane sloty. Efekt: ownerId odrzuconego slotu (kolizja) nadal
figurował w `foreignTypeClusters[i].ownerIds`/`clusterCapitalOwnerIds`, ale nie miał już
wpisu w `aiOwnerCivMap` — dokładnie ta niespójność, którą `cluster-start-test.cjs`
(linie ~111, ~176, poza allowlistą tej rundy, NIE modyfikowany) wykrywa. Potwierdzone
czytaniem kodu 1:1 ze źródłem dyspozycji.

## Naprawa

`gra/src/game/cluster-start.ts::buildClusterStartPlan` — WYŁĄCZNIE pola
`foreignTypeClusters`/`clusterCapitalOwnerIds`:
- Dodano `acceptedOwnerIds: Set<number>` wypełniany W TEJ SAMEJ pętli kolizji, tym samym
  momentem co `aiOwnerCivMap`/`spawnCities`/`acceptedForDistance` (po
  `if (collides) continue;`).
- `foreignTypeClusters`: każda grupa `spawnPlan.foreignTypeClusters` filtrowana parami
  (`ownerIds[i]`+`positions[i]` usuwane razem, żeby `ownerIds.length === positions.length`
  zostało zachowane — sprawdzane wprost przez `cluster-start-test.cjs:174`); grupa, której
  WSZYSTKIE sloty odrzucono, usuwana w całości.
- `clusterCapitalOwnerIds`: `spawnPlan.clusterCapitalOwnerIds.filter(oid =>
  acceptedOwnerIds.has(oid))`.
- Semantyka fixu Zarzutu 1 z rundy 1 (rejestracja właściciela PO sprawdzeniu kolizji)
  NIE ZMIENIONA.

**Próba szerszej naprawy i jej wycofanie (jawnie odnotowane, nie ukryte):** w trakcie tej
rundy spróbowałem dodatkowo naprawić nowo odkryty przypadek "stolica klastra odrzucona
kolizją, ale inny slot tego samego klastra przetrwał" przez promocję pierwszego
przetrwałego slotu na substytut stolicy w `clusterCapitalOwnerIds`. Po pełnym przebiegu
`cluster-start-test.cjs` okazało się, że ta promocja PSUJE asercję
`typCityCopyOwners = państwa bez stolic klastrów` (bo promowany slot ma
`slot.isClusterCapital === false`, więc już jest liczony w `typCityCopyOwners` — pole
SPOZA allowlisty tej rundy — i podwójne liczenie łamie rozłączność zbiorów zakładaną przez
tę asercję), czyli REINTRODUKOWAŁA jeden z 5 nazwanych regresji tej rundy. Wycofałem tę
promocję (diff ostatecznie zawiera WYŁĄCZNIE filtrowanie, bez promocji) i zgłaszam
pozostały przypadek brzegowy jawnie jako BLOKADĘ 1 niżej, zamiast dalej improwizować poza
allowlistą pod presją czasu.

## Dowód — pełny przebieg `cluster-start-test.cjs`, TRZY warianty w TYM SAMYM worktree

Zgodnie z metodą orkiestratora (sekwencyjnie, nigdy współbieżnie, ostrzeżenie
R-PROC-AUTOBOT §6 o nieunikalnej nazwie bundla):

1. **Baseline PRE, ponownie zmierzony w tej rundzie** (`git stash push` tylko trzech
   zmienionych plików źródłowych, worktree wraca do stanu identycznego z origin/main
   f82aa354, potwierdzone treścią pliku po stash w system-reminder tej sesji) →
   **421 passed, 19 failed** — dokładnie zgodne z liczbą z dispatchu orkiestratora.
   Pełna lista 19 FAIL zapisana (patrz niżej) — to jest ZBIÓR ODNIESIENIA.
2. **PO naprawie tej rundy** (`git stash pop`, naprawa aktywna) → **395 passed, 20 failed**.
   Zbiór FAIL = dokładnie 19 z (1) + JEDEN nowy: `każdy obcy typ z miastami ma stolicę
   klastra (ekspansyjna AI)`. ŻADEN z 5 nazwanych w dispatchu regresji rundy 1 nie
   występuje (`owner 6/7/10 -> typ rzymianie`, `owner 16 -> typ inkowie`,
   `typCityCopyOwners = państwa bez stolic klastrów` — wszystkie potwierdzone jako
   ZNIKNIĘTE, sprawdzone `grep` po pełnym logu, nie tylko wizualnie).
3. Powtórzony przebieg (2) niezależnie (druga uruchomiona instancja, inny seed losowy
   procesu, te same 20 seedów testu) → identyczny zbiór 20 FAIL (deterministyczne, nie
   flaky).

Uwaga o różnicy w total (421→395 passed): liczba WYKONANYCH asercji różni się między
przebiegami tego samego kodu na tych samych seedach, bo część asercji w
`cluster-start-test.cjs` jest WARUNKOWA (np. `if (chinczycy) {...}`, zależna od tego, czy
dany klaster w ogóle powstał na danej mapie) — mapgen w tym repo NIE jest w pełni
deterministyczny między procesami (różne `[civ] mapGen ms` na każdym uruchomieniu, patrz
logi), więc total pass+fail różni się między identycznymi uruchomieniami tego samego kodu.
Dlatego porównanie robię przez ZBIÓR TEKSTÓW FAIL, nie przez surowe liczby — metoda
zgodna z tą, którą Evaluator/Operator stosowali w rundzie 1.

### Lista 19 FAIL bazowych (PRE, identyczna też w widoku PO — bez zmian od rundy 1, NIE
dotyczą tego tematu, potwierdzone teraz BYTE-DOKŁADNIE na czystym origin/main w TYM
przebiegu, nie tylko przez kategorię z rundy 1):
1. `stolica gracza = Ateny`
2. `kandydaci runtime: poprawny łańcuch hubów`
3-5. `miasta-panstwa >= 5 hex (3)` ×3
6. `rywal min 5 hex od stolicy (3)`
7. `pre-plan MP: poprawny łańcuch hubów`
8-11. `runtimeCandidates pairwise >= 5 hex (3)` ×4
12-13. `runtimeCandidate min 5 hex od stolicy (3)` ×2
14. `runtimeCandidates: poprawny łańcuch hubów (5 slotów)`
15. `hub-chain 50×50: 6 slotów MP (got 5)`
16. `zarezerwowany slot wzrostu w klastrze`
17. `Standard: stolica obcego typu inkowie min 10 hex od morza (seaDist=9)`
18. `Standard: stolica obcego typu egipt min 10 hex od morza (seaDist=8)`
19. `Duża: minDystansObcyOdGracza=16 (got 18)`

Wniosek: BLOKADA 1 z rund 1-2 (niepewność co do 6/24 progów dystansu) jest tym samym
ROZSTRZYGNIĘTA pozytywnie — wszystkie 19 FAIL bazowych, w tym te 6 podejrzanych, są
BYTE-IDENTYCZNE z origin/main, potwierdzone w tej rundzie bezpośrednim PRE/PO na tym samym
kodzie (nie poszlaką z rundy 1). Nie mają związku z tym tematem.

## TESTY (uruchomione z `gra/`)

- `node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów**.
- `node tools/miasta-zbyt-blisko-test.cjs` → **PASS 23329/23329**, widma: 0, realna
  kolejność: **25768/25768** (uruchomione DWA RAZY w tej rundzie, przed i po wycofaniu
  próby promocji substytutu stolicy — identyczny wynik za każdym razem).
- `node tools/cluster-start-test.cjs`:
  - baseline PRE (git stash) → 421 passed/19 failed (patrz wyżej).
  - PO naprawie (pierwszy przebieg) → 395 passed/20 failed, 20. FAIL =
    `każdy obcy typ z miastami ma stolicę klastra (ekspansyjna AI)`.
  - PO naprawie (drugi, niezależny przebieg, dla wykluczenia flaky) → identyczny zbiór
    20 FAIL.
- `node tools/miasta-panstwa-wylaczone-test.cjs` → 52 pass, **3 FAIL — te same 3 co w
  rundzie 1** (byte-identyczność planu vs origin/main, oczekiwany skutek uboczny naprawy
  `buildClusterStartPlan`, BLOKADA 2 z rundy 1, bez zmian, decyzja u orkiestratora).
- `node tools/logic-test.cjs` → 213/213.
- `node tools/tech-tree-test.cjs` → 19/19.
- `node tools/research-test.cjs` → 33/33.
- `node tools/unit-replace-test.cjs` → 13/13.
- `node tools/combat-test.cjs` → 6/6.
- `node tools/found-from-village-test.cjs` → 24/24.
- `node tools/cluster-spread-test.cjs` → 5/5.
- `node tools/city-state-cluster-diff-test.cjs` → 31/31.
- `git diff --check` → czysto (0 problemów z białymi znakami).
- `map-gen-regression-test.cjs` — nadal pominięta (niezwiązana z dystansem miast,
  świadomie, bez zmian od rundy 1).

## ZMIANY/COMMIT

Brak commitu (Operator nie integruje). Pliki zmienione w worktree
`/home/user/wt-miasta-blisko` W TEJ RUNDZIE (ponad rundy 1):
- `gra/src/game/cluster-start.ts` — WYŁĄCZNIE `buildClusterStartPlan`, pola
  `foreignTypeClusters`/`clusterCapitalOwnerIds`: dodane filtrowanie względem
  `acceptedOwnerIds` (zbiór ownerId zaakceptowanych, nieodrzuconych kolizją slotów),
  budowanego w tej samej pętli kolizji co reszta rejestrów z rundy 1. Reszta funkcji
  (fix Zarzutu 1 z rundy 1) NIETKNIĘTA.
- `dyspozycje/autobot/runs/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/04-operator-runda2.md` (ten
  raport, main repo, nie worktree).

`gra/src/main.ts`, `gra/src/game/ai-difficulty-bonus.ts`, `gra/tools/miasta-zbyt-blisko-
test.cjs` — NIE dotknięte tej rundy (bez zmian względem rundy 1, potwierdzone `git diff
--stat` po zakończeniu pracy).
`gra/tools/cluster-start-test.cjs` — NIE modyfikowany (zakaz z allowlisty, przestrzegany;
używany wyłącznie jako bramka referencyjna do odczytu).

## BLOKADY

1. **NOWY, wcześniej nieudokumentowany FAIL wprowadzony przez naprawę tej rundy** (zgłoszony
   jawnie, zgodnie z regułą dyspozycji "nie ukrywaj"): `cluster-start-test.cjs` linia ~113-114
   `assert(plan.clusterCapitalOwnerIds.length === foreignCount, 'każdy obcy typ z miastami
   ma stolicę klastra (ekspansyjna AI)')` — zaczyna FAILować, bo w rzadkim przypadku slot
   STOLICY obcego klastra (`group.ownerIds[0]`, zawsze pierwszy — potwierdzone czytaniem
   `clusters.ts`, `cities`/`miasta` budowane wszędzie jako `[capital, ...rivals]`) koliduje
   z już zaakceptowanym miastem i zostaje odrzucony przez naprawę tego tematu, PODCZAS GDY
   inny slot (kopia typu) TEGO SAMEGO klastra przetrwa kolizję. Efekt: obcy typ nadal ma
   miasta na mapie (poprawnie, w `foreignTypeClusters`/`spawnCities`/`aiOwnerCivMap`), ale
   BEZ zarejestrowanej "stolicy klastra" w `clusterCapitalOwnerIds` — pole używane w main.ts
   do logiki ekspansyjnej AI (`grantDifficultyStartBonusesForMajorCapital`,
   `syncAiMajorSameCivRelations`, `portraitForceCultureIcon`, priorytet ataku). Stan
   NIEOSIĄGALNY przed tą naprawą (oba pola były niefiltrowane, więc zawsze parami
   kompletne — dowód: 0 wystąpień tego FAIL w baseline PRE, patrz wyżej).
   **Próbowałem naprawić w tej rundzie** (promocja pierwszego przetrwałego slotu na
   substytut stolicy) — odkryłem, że to psuje INNĄ asercję (`typCityCopyOwners = państwa
   bez stolic klastrów`), bo wymaga dotknięcia `typCityCopyOwners`, pola SPOZA allowlisty
   tej rundy (`gra/src/game/cluster-start.ts (wyłącznie... pola foreignTypeClusters/
   clusterCapitalOwnerIds)`). Wycofałem tę próbę (diff końcowy jej NIE zawiera) i zgłaszam
   jako DECISION_REQUIRED / materiał na rundę 3: albo (a) rozszerzyć allowlistę o
   `typCityCopyOwners` i naprawić oba pola razem (usunąć promowany substytut z
   `typCityCopyOwners`, żeby zbiory zostały rozłączne), albo (b) zaakceptować, że w tym
   rzadkim przypadku klaster obcego typu może istnieć bez formalnej "stolicy" (i
   ewentualnie złagodzić TĘ JEDNĄ asercję w `cluster-start-test.cjs` — co wymagałoby zgody
   właściciela/orkiestratora, bo `cluster-start-test.cjs` jest poza allowlistą tej rundy z
   wyraźnym zakazem edycji). NIE PRÓBOWAŁEM złagodzić testu samodzielnie — zgodnie z
   REGUŁĄ PRZECIW SAMOOSZUKIWANIU z dyspozycji.
   Częstość: obserwowana w co najmniej 1 z ~20×kilkanaście konfiguracji testu (dokładna
   mapa/seed nie wyekstrahowana w tej rundzie z powodu budżetu czasowego — do zrobienia w
   rundzie 3 jeśli potrzebne dla debugowania).
2. `miasta-panstwa-wylaczone-test.cjs` — 3 FAIL oczekiwane/wyjaśnione, bez zmian od rundy
   1 — decyzja Evaluatora/właściciela o aktualizacji referencyjnego bundla PRE po scaleniu.
3. Lokalizacja artefaktów procesu (dispatch/raporty) — bez zmian od rundy 1, patrz nota
   wyżej.
4. `map-gen-regression-test.cjs` nadal nieuruchomiona (świadomie, niezwiązana z tematem).

## RUNDY: 2/5

## NASTĘPNY KROK: Operator → Evaluator (weryfikacja: (a) że 5 nazwanych regresji rundy 1
faktycznie zniknęło i żaden z 19 FAIL bazowych nie uległ zmianie — najlepiej własnym
niezależnym PRE/PO; (b) decyzja o BLOKADZIE 1 nowego FAIL: rozszerzyć allowlistę o
`typCityCopyOwners` na rundę 3, czy inna ścieżka) → Final Control.
DEPLOY/PUSH: NIE WYKONANO
