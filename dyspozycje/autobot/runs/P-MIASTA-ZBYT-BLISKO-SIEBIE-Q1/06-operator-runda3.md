STATUS: PASS
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozować i naprawić przypadki miast AI (główne cywilizacje i/lub miasta-państwa)
powstających poniżej minimalnego dystansu, mimo istniejącej reguły MIN_CITY_DISTANCE/
MIN_CITY_DISTANCE_START_CITY_STATE w canFoundCity (gra/src/game/cities.ts).

## Uwaga o lokalizacji artefaktów procesu (bez zmian od poprzednich rund)

Worktree `/home/user/wt-miasta-blisko` nadal nie zawiera `00-dispatch.md` (istnieje
wyłącznie w `/home/user/The-Game`). Ten raport zapisuję tu, w main repo, zgodnie z
dyspozycją tej rundy.

Odnotowuję też incydent bez wpływu na wynik: w trakcie tej rundy próbowałem odczytać
`05-evaluator-runda2.md` z `/home/user/The-Game/dyspozycje/autobot/runs/
P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/` — `ls` na początku sesji pokazał ten plik, ale kolejny
`Read`/`wc -l` chwilę później zwrócił "nie istnieje" i tak zostało (plik nietracked w
main repo, prawdopodobnie usunięty przez inny równoległy proces poza tą sesją). Nie
wpłynęło to na pracę tej rundy — treść Evaluatora rundy 2 (decyzja orkiestratora,
BLOKADA 1, dokładne 6 nazwanych regresji do pilnowania) i tak przyszła w pełni w treści
dyspozycji tej rundy, więc podjąłem naprawę na tej podstawie, niezależnie zweryfikowaną
źródłowo w `04-operator-runda2.md` (który w worktree nadal istnieje, przeczytany w
całości).

## Decyzja orkiestratora (zastosowana)

Opcja (a): rozszerzona allowlista o `typCityCopyOwners` w `cluster-start.ts`, oba pola
naprawione razem. Opcja (b) (osłabienie asercji `cluster-start-test.cjs`) NIE
zastosowana — test nietknięty (nadal poza allowlistą, zakaz edycji przestrzegany).

## Naprawa (runda 3, ponad filtrowanie z rundy 2)

`gra/src/game/cluster-start.ts::buildClusterStartPlan` — WYŁĄCZNIE pola
`foreignTypeClusters`/`clusterCapitalOwnerIds`/`typCityCopyOwners`:

W tej samej pętli budującej filtrowany `foreignTypeClusters` (runda 2), dla KAŻDEJ grupy,
która przetrwała filtrowanie (`ownerIds.length > 0` po odrzuceniu kolizyjnych slotów):
- sprawdzam, czy oryginalna stolica klastra (`group.ownerIds[0]`, sprzed filtrowania —
  `groupForeignTypeClusters` w `map/cluster-spawn.ts` gwarantuje kolejność
  "stolica → rywale") jest nadal w `acceptedOwnerIds`;
- jeśli NIE (stolica odrzucona kolizją, ale grupa przetrwała z innym slotem) —
  promuję PIERWSZY przetrwały slot tej grupy (`ownerIds[0]` z listy PO filtrowaniu) na
  substytut stolicy: dodaję go do `clusterCapitalOwnerIds` ORAZ usuwam go z
  `typCityCopyOwners` jednym `.delete()` (był tam dodany wcześniej w głównej pętli,
  na podstawie oryginalnej flagi `slot.isClusterCapital === false` — teraz formalnie
  staje się "stolicą" klastra, więc musi zniknąć z drugiego zbioru, żeby zbiory
  pozostały rozłączne, zgodnie z asercją `typCityCopyOwners = państwa bez stolic
  klastrów`);
- jeśli klaster nie ma ŻADNEGO przetrwałego slotu — usuwany w całości pętlą z rundy 2
  (`ownerIds.length === 0 → continue`), więc nie ma czego promować — przypadek
  nieistotny dla tej naprawy (zgodnie z dyspozycją tej rundy, punkt "nie dotyczy tego
  przypadku").
- `clusterCapitalOwnerIds` = (przefiltrowane oryginalne stolice, jak w rundzie 2) +
  (nowo dodane promowane substytuty) — każda przetrwała grupa wnosi DOKŁADNIE jedną
  pozycję, więc `clusterCapitalOwnerIds.length === foreignTypeClusters.length`
  zachowane niezależnie od tego, czy oryginalna stolica przetrwała, czy nie.

Nic więcej w `buildClusterStartPlan` nie zmienione (filtrowanie `foreignTypeClusters` z
rundy 2, fix Zarzutu 1 z rundy 1 — nietknięte).

## Dowód — `cluster-start-test.cjs`, PRZED/PO w tym samym worktree

1. **Stan wejściowy tej rundy** (filtrowanie z rundy 2 bez promocji, dokładnie stan
   opisany w `04-operator-runda2.md`) → 395 passed/**20 failed**, 20. FAIL = `każdy obcy
   typ z miastami ma stolicę klastra (ekspansyjna AI)` (BLOKADA 1 rundy 2).
2. **PO naprawie tej rundy** → **396 passed, 19 failed**. Pełna lista 19 FAIL (`grep -n
   "^FAIL" `, sprawdzone 1:1 z listą bazową z rundy 2):
   `stolica gracza = Ateny`; `kandydaci runtime: poprawny łańcuch hubów`;
   `miasta-panstwa >= 5 hex (3)` ×3; `rywal min 5 hex od stolicy (3)`;
   `pre-plan MP: poprawny łańcuch hubów`; `runtimeCandidates pairwise >= 5 hex (3)` ×4;
   `runtimeCandidate min 5 hex od stolicy (3)` ×2; `runtimeCandidates: poprawny łańcuch
   hubów (5 slotów)`; `hub-chain 50×50: 6 slotów MP (got 5)`; `zarezerwowany slot
   wzrostu w klastrze`; `Standard: stolica obcego typu inkowie min 10 hex od morza
   (seaDist=9)`; `Standard: stolica obcego typu egipt min 10 hex od morza (seaDist=8)`;
   `Duża: minDystansObcyOdGracza=16 (got 18)`.
   **Dokładnie te same 19 co zbiór bazowy z rundy 2 (byte/tekst-identyczne po `grep`),
   ZERO nowych FAIL. `każdy obcy typ z miastami ma stolicę klastra (ekspansyjna AI)`
   (jedyny FAIL rundy 2 poza zbiorem bazowym) — POTWIERDZONY ZNIKNIĘTY.**
   Wynik odpowiada BINARNEMU KRYTERIUM SUKCESU tej rundy: dokładnie 19 FAIL bazowych,
   zero nowych.
3. Żaden z 6 dotąd nazwanych FAIL regresji (5 z rundy 1 + 1 z rundy 2) nie występuje.

Uwaga o czasie: `cluster-start-test.cjs` w tej rundzie trwał ok. 20 minut (proces
aktywny 101% CPU cały czas, potwierdzone `ps`, bez oznak zawieszenia — wyłącznie długi,
bo generuje wiele map 50×50/większych z rzekami; nie flaky/deadlock, dokończył się
poprawnie).

## TESTY (uruchomione z `gra/`)

- `node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów** (po jednej poprawce
  typowania: `group.ownerIds[0]`/`ownerIds[0]` mają typ `number | undefined` pod
  `noUncheckedIndexedAccess` — dodana jawna strażnica `!== undefined` przed użyciem,
  bez zmiany logiki).
- `node tools/cluster-start-test.cjs` → **396 passed, 19 failed** — patrz dowód wyżej.
- `node tools/miasta-zbyt-blisko-test.cjs` → **PASS**: plan 23329/23329 par w normie,
  widma (Zarzut 1): 0, realna kolejność spawnu (Zarzut 2+3): 25768/25768 par w normie.
  Zielone, bez zmian względem rundy 2.
- `node tools/miasta-panstwa-wylaczone-test.cjs` → 52 pass, **3 FAIL — te same 3 co w
  rundach 1-2** (bez zmian, BLOKADA 2 z rundy 1, decyzja u orkiestratora, poza zakresem
  tej rundy).
- `node tools/logic-test.cjs` → 213/213.
- `node tools/tech-tree-test.cjs` → 19/19.
- `node tools/research-test.cjs` → 33/33.
- `node tools/unit-replace-test.cjs` → 13/13.
- `node tools/combat-test.cjs` → 6/6.
- `node tools/found-from-village-test.cjs` → 24/24.
- `node tools/cluster-spread-test.cjs` → 5/5.
- `node tools/city-state-cluster-diff-test.cjs` → 31/31.
- `git diff --check` (w `gra/`) → czysto (0 problemów z białymi znakami).
- `map-gen-regression-test.cjs` — nadal pominięta (niezwiązana z dystansem miast,
  świadomie, bez zmian od rundy 1).

## ZMIANY/COMMIT

Brak commitu (Operator nie integruje). Plik zmieniony w worktree
`/home/user/wt-miasta-blisko` W TEJ RUNDZIE (ponad rundy 1-2):
- `gra/src/game/cluster-start.ts` — WYŁĄCZNIE `buildClusterStartPlan`, pola
  `foreignTypeClusters`/`clusterCapitalOwnerIds`/`typCityCopyOwners`: dodana promocja
  pierwszego przetrwałego slotu klastra na substytut stolicy, gdy oryginalna stolica
  klastra odrzucona kolizją a inny slot przetrwał (opisane wyżej), z korygującym
  `.delete()` w `typCityCopyOwners` dla rozłączności zbiorów. Filtrowanie z rundy 2 i
  fix Zarzutu 1 z rundy 1 NIETKNIĘTE.
- `dyspozycje/autobot/runs/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/06-operator-runda3.md` (ten
  raport, main repo, nie worktree).

`gra/src/main.ts`, `gra/src/game/ai-difficulty-bonus.ts`, `gra/tools/miasta-zbyt-blisko-
test.cjs` — NIE dotknięte tej rundy (potwierdzone `git diff --stat`, identyczne co
runda 2). `gra/tools/cluster-start-test.cjs` — NIE modyfikowany (zakaz z allowlisty,
przestrzegany).

`git diff --stat` (worktree, cumulatywnie rundy 1-3):
```
gra/src/game/ai-difficulty-bonus.ts |  41 +++++++++---
gra/src/game/cluster-start.ts       | 122 +++++++++++++++++++++++++++++++++++-
gra/src/main.ts                     |  22 ++++++-
3 files changed, 175 insertions(+), 10 deletions(-)
```
(plus untracked `dyspozycje/autobot/runs/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/` i
`gra/tools/miasta-zbyt-blisko-test.cjs`.)

## BLOKADY

Brak nowych. BLOKADA 1 z rundy 2 (stolica klastra odrzucona kolizją) — ROZWIĄZANA tą
rundą zgodnie z decyzją orkiestratora (opcja a). Nieusunięte, bez zmian od rund 1-2 (nie
dotyczą tego zadania rundy 3, decyzja pozostaje u orkiestratora):
1. `miasta-panstwa-wylaczone-test.cjs` — 3 FAIL oczekiwane/wyjaśnione, bez zmian od
   rundy 1 — decyzja Evaluatora/właściciela o aktualizacji referencyjnego bundla PRE po
   scaleniu.
2. Lokalizacja artefaktów procesu (dispatch/raporty) — bez zmian od rundy 1.
3. `map-gen-regression-test.cjs` nadal nieuruchomiona (świadomie, niezwiązana z
   tematem).

## RUNDY: 3/5

## NASTĘPNY KROK: Operator → Evaluator (weryfikacja: (a) że BLOKADA 1 rundy 2 faktycznie
zniknęła — najlepiej własnym niezależnym PRE/PO na `cluster-start-test.cjs`; (b) że
żaden z 19 FAIL bazowych ani 6 dotąd nazwanych regresji rund 1-2 nie wrócił; (c) że
zmiana w `typCityCopyOwners` jest wyłącznie korygującym `.delete()` promowanego
substytutu, bez innych efektów ubocznych) → Final Control.
DEPLOY/PUSH: NIE WYKONANO
