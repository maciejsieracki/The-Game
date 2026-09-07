# P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1 — Final Control, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1
GOAL: W obu miejscach przejęcia miasta (`gra/src/main.ts`) usunąć z kolejki budynki
`lokalizacja:'stolica'` niemożliwe do dokończenia przez zdobywcę, zwracając CAŁĄ zebraną
Pracę (front + zbankowany postęp nie-frontowych pozycji) do puli ZDOBYWCY, zero regresji na
legacy-jednostkach (`oldOwner`).

## WERYFIKACJA (worktree `/home/user/wt-kolejka-podboj`, HEAD `3e68ba17`)

1. **Allowlista/diff.** `git diff origin/main --stat`: wyłącznie `gra/src/main.ts`
   (+79/-2, oba bloki), nowa bramka `podboj-kolejka-budynek-niemozliwy-test.cjs`, runy
   dyspozycji. `git diff origin/main -- gra/src/game/production.ts` → puste, `filterQueue()`
   nietknięta. `git diff --check` czyste. `setOwnerPracaPool(oldOwner, ...)` nadal dokładnie
   2 wystąpienia (13386, 26933-okolica) — potwierdzone grepem.

2. **Naprawa ZARZUTU 1 — wielokrotność, WŁASNY test niezależny** (nie kopia bramki obrony;
   ten sam harness wycinania/bundlingu bo inaczej nie da się uruchomić prawdziwego
   `main.ts`, ale scenariusze nowe): 3 budynki-stolica z NIEZEROWYM zbankowanym postępem na
   wszystkich nie-frontowych (suma 12+15+8=35 — zgadza się), 3 budynki z ZEREM wszędzie
   (suma=0, brak NaN/undefined), 4 budynki (cała lista z danych) z MIESZANYMI wartościami
   (0/30/0 + front 50 = 80 — zgadza się), dla OBU bloków (kapitulacja, podbój). Wszystkie
   sumy zgodne co do grosza — naprawa działa ogólnie, nie tylko na Scenariuszu E (2
   budynki).

3. **Legacy — zero regresji, test MIESZANY** (własny, nowy scenariusz): kolejka z legacy
   jednostką ORAZ budynkiem-stolica jednocześnie, w obu kolejnościach (legacy na froncie +
   budynek-stolica zbankowany nie-frontowo; i odwrotnie, budynek-stolica na froncie +
   legacy zbankowana nie-frontowo). W obu układach i obu blokach: Praca legacy trafia
   WYŁĄCZNIE do `oldOwner`, Praca budynku-stolica WYŁĄCZNIE do zdobywcy, żadnego
   przeciekania między pulami. Zero regresji potwierdzone.

4. **Dwa przedistniejące FAIL — weryfikacja NIEZALEŻNA** (własny `git worktree add
   --detach` na `origin/main` `17c4c55f`, świeży checkout, node_modules przez symlink, BEZ
   `git stash` żadnego wcześniejszego agenta): `barb-city-capture-cluster-test.cjs` 92/1 —
   identyczny FAIL (`2h-static` snapshot-lock offset), `building-queue-refund-test.cjs`
   2/3 — identyczne 3 FAIL (dryf `koszt_surowce.drewno` stolarni). Oba potwierdzone
   pre-istniejące, poza allowlistą tego tematu.

5. **Brzegowy przypadek nowej stolicy — INNY scenariusz niż Evaluatora**: własny test z
   WIELO-elementową kolejką (2 budynki-stolica + 1 budynek region wymieszane) gdy zdobyte
   miasto JEST nową stolicą zdobywcy → wszystkie 3 pozycje zostają w NIETKNIĘTEJ kolejności,
   zero zwrotu, dla obu bloków. Potwierdzone.

6. **Od zera:** `npx tsc --noEmit` czysto. 5 bramek referencyjnych: `logic-test` 213/213,
   `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test`
   6/6. Bramka tematu `podboj-kolejka-budynek-niemozliwy-test.cjs`: 75/75. Cała rodzina
   produkcji/kolejki/podboju/capital (grep z GOAL, pominięte `.ps1`/preview/compare):
   `ai-city-capture-integration-test` 14 OK, `ai-production-priority-test` 9/9,
   `barb-city-capture-cluster-test` 92/1 (pre-istniejący), `building-queue-refund-test`
   2/3 (pre-istniejący), `capital-capture-test` 86/86, `capital-sep-pangea-test` 3/3,
   `capital-sep-unit-test` 36/36, `march-attack-queue-persist-test` 57/57,
   `panel-kolejka-pasek-postepu-test` 82/82, `post-capture-law-test` 25/25,
   `production-overflow-test` 201/201, `religia-konwersja-po-podboju-test` 12/12 —
   wszystkie zgodne z raportami Operatora/Evaluatora/Obrony.

## ZMIANY/COMMIT
Brak zmian w kodzie produkcyjnym z tej rundy — tylko ten raport (`dyspozycje/autobot/runs/
P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1/03-final-control-runda1.md`), zgodnie z allowlistą.

## TESTY
Jak w §1-6 wyżej. Zero rozbieżności z raportami wcześniejszych ról.

## BLOKADY
Dwa przedistniejące FAIL, potwierdzone NIEZALEŻNIE (worktree na `origin/main`, nie
`git stash`) jako identyczne przed i niezwiązane z tym tematem — zgłaszam do
orkiestratora jako osobne tematy:
- `barb-city-capture-cluster-test.cjs`: FAIL `2h-static` (snapshot-lock offsetu tekstu).
- `building-queue-refund-test.cjs`: 3 FAIL, dryf danych `koszt_surowce.drewno` stolarni.

Nie blokują PASS całości tego tematu.

## WERDYKT
**PASS — gotowe do integracji z main.** Naprawa Obrony (lokalne sumowanie zbankowanego
`item.postep` wszystkich usuwanych nie-frontowych budynków-stolica, wzorowane na
`sanitizeBuildQueue`/`refundedWaiting`) działa poprawnie dla dowolnej liczby
budynków-stolica i dowolnej kombinacji zbankowanego postępu, nie wprowadza regresji na
legacy-jednostkach nawet w kolejkach mieszanych, poprawnie obsługuje brzegowy przypadek
nowej stolicy w wielo-elementowych kolejkach, i nie narusza allowlisty (`production.ts`
nietknięty). Żaden nowy defekt nie został znaleziony.

## RUNDY
1/5

## NASTĘPNY KROK
Integracja orkiestratora (allowlist-only) → `READY_FOR_DEPLOY`. Dwa przedistniejące FAIL
do zarejestrowania jako osobne tematy poza tą falą.

## DEPLOY/PUSH
NIE WYKONANO
