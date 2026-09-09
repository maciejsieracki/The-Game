STATUS: PASS
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozować i naprawić przypadki miast AI (główne cywilizacje i/lub miasta-państwa)
powstających poniżej minimalnego dystansu, mimo istniejącej reguły MIN_CITY_DISTANCE/
MIN_CITY_DISTANCE_START_CITY_STATE w canFoundCity (gra/src/game/cities.ts).

## Uwaga o lokalizacji artefaktów procesu (bez zmian od rund 1-2)

Worktree `/home/user/wt-miasta-blisko/dyspozycje/...` zawiera pełną historię tego tematu
(01-05); main repo miało dziurę po incydencie opisanym przez Operatora tej rundy (plik
05-evaluator-runda2.md widoczny `ls`, znikający przed `Read` — potwierdzam ten sam wzorzec
incydentu, bez wpływu na weryfikację: przeczytałem `05-evaluator-runda2.md` w całości z
worktree, gdzie istnieje bez przeszkód). Ten raport zapisuję w main repo `/home/user/The-Game`
zgodnie z dyspozycją. Cała weryfikacja (testy, diff, git) wykonana w
`/home/user/wt-miasta-blisko/gra`.

## Niezależna weryfikacja — cztery punkty z dyspozycji

### (1) `node tools/cluster-start-test.cjs` — pełna lista FAIL, PRE/PO na BLOKADĘ 1

Uruchomiony samodzielnie, w tle, pełny przebieg bez obcinania (~20 min, potwierdzone
`ps` — proces aktywny 100%+ CPU cały czas, bez oznak zawieszenia, zakończony kodem 0).

Wynik: **396 passed, 19 failed** — identyczne liczby z raportem Operatora.

Pełna lista 19 FAIL wyekstrahowana z surowego logu (`grep '^FAIL'`, bez `tail`/obcinania),
policzona `sort | uniq -c`:
```
1 Duża: minDystansObcyOdGracza=16 (got 18)
1 Standard: stolica obcego typu egipt min 10 hex od morza (seaDist=8)
1 Standard: stolica obcego typu inkowie min 10 hex od morza (seaDist=9)
1 hub-chain 50×50: 6 slotów MP (got 5)
1 kandydaci runtime: poprawny łańcuch hubów
3 miasta-panstwa >= 5 hex (3)
1 pre-plan MP: poprawny łańcuch hubów
2 runtimeCandidate min 5 hex od stolicy (3)
4 runtimeCandidates pairwise >= 5 hex (3)
1 runtimeCandidates: poprawny łańcuch hubów (5 slotów)
1 rywal min 5 hex od stolicy (3)
1 stolica gracza = Ateny
1 zarezerwowany slot wzrostu w klastrze
```
Suma = 19. Porównanie tekstowe (nie tylko liczbowe) z 19 FAIL bazowych potwierdzonych
niezależnie w `05-evaluator-runda2.md` (rundzie 2, sama Evaluator): **identyczne co do
tekstu i liczności każdego wariantu** — POTWIERDZONE.

Krytyczne: `FAIL: każdy obcy typ z miastami ma stolicę klastra (ekspansyjna AI)` (BLOKADA 1
rundy 2, jedyny FAIL rundy 2 poza zbiorem bazowym) **NIE występuje** w pełnym logu tej
rundy — sprawdzone wprost `grep -c` na dokładnej treści tej linii → 0 trafień. BLOKADA 1
potwierdzona jako faktycznie zniknięta, nie tylko wg deklaracji Operatora.

Osobno sprawdziłem, że żaden z 6 dotąd nazwanych FAIL regresji (5 z rundy 1: `owner 6/7/10
→ typ rzymianie`, `owner 16 → typ inkowie`, itd.; + 1 z rundy 2: `każdy obcy typ z miastami
ma stolicę klastra`) nie występuje w pełnym logu FAIL tej rundy — `grep -iE
"rzymian|owner|typCityCopyOwners|stolic.*klastra"` na liniach zawierających `FAIL` → 0
trafień. POTWIERDZONE.

Uwaga metodologiczna (nie zarzut): nie odtworzyłem osobno świeżego PRE tej rundy przez
`git stash` (kolejny ~20-minutowy przebieg) — polegam na tym, że 19/19 FAIL tej rundy jest
tekstowo identyczne z bazą, którą Evaluator rundy 2 już niezależnie zmierzył jako
odpowiadającą origin/main, oraz że BLOKADA 1 (jedyny element odróżniający stan PRZED tej
rundy od bazy) jawnie zniknęła. Uznaję to za wystarczające przy budżecie czasowym rundy —
ten sam kompromis, jaki przyjął Evaluator w rundzie 2.

Wniosek (1): **BLOKADA 1 rundy 2 potwierdzona jako faktycznie usunięta, zero nowych FAIL
ponad 19 bazowych, zero powrotu któregokolwiek z 6 dotąd nazwanych regresji** — POTWIERDZONE.

### (2) `node tools/miasta-zbyt-blisko-test.cjs` — Zarzuty 1/2/3 z rundy 1

Uruchomiony samodzielnie:
```
Map wygenerowanych: 20
Par miast sprawdzonych łącznie: 23329
Naruszenia minimalnego dystansu: 0
[Zarzut 1] Widmowi właściciele (zarejestrowani bez miasta): 0
[Zarzut 2+3] Symulacja realnej kolejności spawnu: Par sprawdzonych łącznie: 25768, Naruszenia: 0
PASS — plan: 23329/23329 par w normie, widma: brak, realna kolejność: 25768/25768 par w normie
```
Identyczne z raportem Operatora — POTWIERDZONE, fixy Zarzutów 1/2/3 z rundy 1 nadal
działają, naprawa promocji substytutu stolicy (dotykająca wyłącznie pól
`foreignTypeClusters`/`clusterCapitalOwnerIds`/`typCityCopyOwners`, nieużywanych przez
tę bramkę) nie miała żadnego efektu ubocznego tutaj.

### (3) Diff `gra/src/game/cluster-start.ts` — punktowość zmiany i zgodność z decyzją orkiestratora

Uwaga metodologiczna: worktree jest 13 commitów za `origin/main` (inne, niezwiązane
tematy zintegrowane równolegle) — `git diff origin/main` myliłby, pokazując też cofnięcia
niezwiązanych plików. Zdiagnozowałem to i użyłem `git diff $(git merge-base HEAD
origin/main)`, co daje dokładnie 3 pliki zmienione, identyczne liczby linii jak
zadeklarowane przez Operatora (`ai-difficulty-bonus.ts` +41/-, `cluster-start.ts` +122/-,
`main.ts` +22/-, razem 175 insercji/10 delecji) — POTWIERDZONE zgodność deklaracji.

Przeczytałem cały diff `cluster-start.ts` linia po linii. Zmiana tej rundy (ponad
filtrowanie z rundy 2, które już zweryfikowała Evaluator rundy 2) jest dokładnie:
- nowa tablica `promotedCapitalOwnerIds` budowana w tej samej pętli po
  `spawnPlan.foreignTypeClusters`, która już filtrowała `ownerIds`/`positions` wg
  `acceptedOwnerIds` (runda 2, niedotknięta);
- dla każdej przetrwałej grupy: sprawdzenie `!acceptedOwnerIds.has(originalCapitalOwnerId)`
  (`group.ownerIds[0]`, sprzed filtrowania) — jeśli oryginalna stolica odrzucona kolizją,
  promocja `ownerIds[0]` PO filtrowaniu (pierwszy przetrwały slot) do
  `promotedCapitalOwnerIds` ORAZ `typCityCopyOwners.delete(substituteCapitalOwnerId)`;
- `clusterCapitalOwnerIds` = przefiltrowane oryginalne stolice (runda 2) +
  `promotedCapitalOwnerIds` (nowe tej rundy);
- strażnice `!== undefined` na `originalCapitalOwnerId`/`substituteCapitalOwnerId` — zgodne
  z deklarowaną poprawką typowania pod `noUncheckedIndexedAccess`, bez zmiany logiki
  (odczytane wprost, nie tylko zaufane deklaracji).

To dokładnie trzy pola zadeklarowane w rozszerzonej allowlicie orkiestratora
(`foreignTypeClusters`/`clusterCapitalOwnerIds`/`typCityCopyOwners`), wyłącznie wewnątrz
`buildClusterStartPlan`. Blok `acceptedForDistance`/kolizja z rundy 1 oraz filtrowanie z
rundy 2 — nietknięte tej rundy (widoczne w diffie jako niezmienione względem opisu
Evaluatora rundy 2). Zastosowana opcja (a) orkiestratora (rozszerzona allowlista,
NIE osłabienie testu) — POTWIERDZONE, zgodnie z deklaracją.

`tsc --noEmit` (uruchomiony samodzielnie) → 0 błędów.
`git diff --check` (uruchomiony samodzielnie) → czysto.

`main.ts`/`ai-difficulty-bonus.ts` sprawdzone przeciw temu samemu merge-base — treść
odpowiada 1:1 opisowi rundy 1/Evaluatora rundy 2 (komentarz "P-MIASTA-...-Q1 runda 2" przy
zdjęciu `clusterStartSlot=true` w `main.ts`), zero nowych zmian tej rundy — POTWIERDZONE
zgodne z deklaracją "nietknięte tej rundy".

Wniosek (3): zmiana punktowa, wyłącznie trzema polami rozszerzonej allowlisty, wewnątrz
`buildClusterStartPlan`, zgodna z decyzją orkiestratora (opcja a) — POTWIERDZONE.

### (4) Czy Operator zmienił `cluster-start-test.cjs` (zakaz)

`git diff --stat $(git merge-base HEAD origin/main) -- tools/cluster-start-test.cjs` →
brak wyniku (exit 0, pusty diff). `git status --short tools/cluster-start-test.cjs` →
brak wyniku. Plik BEZ ŻADNEJ zmiany — POTWIERDZONE, zakaz przestrzegany.

## ZARZUTY

Brak. Wszystkie cztery punkty weryfikacji z dyspozycji potwierdzone niezależnie, zero
rozbieżności z raportem Operatora.

## TESTY (uruchomione niezależnie przeze mnie, w worktree `/home/user/wt-miasta-blisko/gra`)

- `tsc --noEmit` → 0 błędów.
- `cluster-start-test.cjs` (pełny przebieg, bez obcinania, w tle, ~20 min, exit 0) →
  396 passed / 19 failed; pełna lista FAIL wyekstrahowana i policzona `sort | uniq -c`,
  tekstowo identyczna z bazą rundy 2 co do treści i liczności każdego wariantu; BLOKADA 1
  rundy 2 (`każdy obcy typ z miastami ma stolicę klastra`) potwierdzona nieobecna (0
  trafień `grep`); 0/19 pasuje do nazw 6 dotąd nazwanych regresji (5 rundy 1 + 1 rundy 2).
- `miasta-zbyt-blisko-test.cjs` → PASS 23329/23329, widma 0, realna kolejność 25768/25768
  — identyczne z raportem Operatora.
- `miasta-panstwa-wylaczone-test.cjs` → 52 pass / 3 fail — te same 3 (`plan PRZED ===
  plan PO, byte-identyczne`, seed=4242, n=1/5/9) co rundy 1-2, bez zmian.
- `logic-test.cjs` → 213/213. `tech-tree-test.cjs` → 19/19. `research-test.cjs` → 33/33.
  `unit-replace-test.cjs` → 13/13. `combat-test.cjs` → 6/6. `found-from-village-test.cjs`
  → 24/24. `cluster-spread-test.cjs` → 5/5. `city-state-cluster-diff-test.cjs` → 31/31.
  Wszystkie zgodne z deklaracją Operatora.
- `git diff --stat $(git merge-base HEAD origin/main)` → dokładnie 3 pliki
  (`ai-difficulty-bonus.ts`, `cluster-start.ts`, `main.ts`), identyczne liczby linii jak w
  raporcie Operatora; `tools/cluster-start-test.cjs` bez zmian.
- `git diff --check` → czysto.
- Odczyt źródłowy całego diffu `cluster-start.ts` (nie tylko deklaracji Operatora) —
  potwierdza punktowość i zgodność z decyzją orkiestratora.

## BLOKADY

Brak nowych. BLOKADA 1 rundy 2 — POTWIERDZONA ROZWIĄZANA niezależnie (nie tylko wg
deklaracji Operatora). Bez zmian od rund 1-2, poza zakresem tej weryfikacji:
1. `miasta-panstwa-wylaczone-test.cjs` — 3 FAIL oczekiwane (byte-identyczność planu vs
   `origin/main`), decyzja u orkiestratora/Final Control o aktualizacji bundla
   referencyjnego po scaleniu.
2. Lokalizacja artefaktów procesu (rozjazd worktree/main repo) — bez zmian, w tym
   ponowny incydent zniknięcia pliku w main repo (bez wpływu na tę weryfikację, treść
   odczytana z worktree).
3. `map-gen-regression-test.cjs` świadomie pominięty, bez zmian od rundy 1.
4. (Metodologiczne, nieblokujące) Nie odtworzyłem osobno świeżego PRE tej rundy przez
   `git stash` — polegam na tekstowej zgodności z bazą już zmierzoną w rundzie 2 i na
   jawnym zniknięciu jedynego FAIL odróżniającego stan PRE od bazy (BLOKADA 1).

## RUNDY: 3/5

## NASTĘPNY KROK: Evaluator → Final Control. Temat gotowy: BLOKADA 1 rundy 2 potwierdzona
rozwiązana niezależnie (nie tylko deklaratywnie), zero nowych regresji ponad 19 FAIL
bazowych, żaden z 6 dotąd nazwanych regresji (rundy 1-2) nie powrócił, zmiana punktowa i
zgodna z rozszerzoną allowlistą (opcja a orkiestratora), `cluster-start-test.cjs`
nienaruszony.
DEPLOY/PUSH: NIE WYKONANO
