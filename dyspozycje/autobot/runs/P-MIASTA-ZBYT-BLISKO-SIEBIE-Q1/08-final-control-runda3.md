STATUS: PASS
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozować i naprawić przypadki, w których miasta AI (główne cywilizacje i/lub
miasta-państwa) powstają zbyt blisko siebie — bezpośrednio sąsiadujące hexy, poniżej
istniejącego minimalnego dystansu — mimo że silnik ma już zaimplementowaną regułę
minimalnego dystansu (MIN_CITY_DISTANCE/MIN_CITY_DISTANCE_START_CITY_STATE, canFoundCity
w gra/src/game/cities.ts).

## Uwaga o lokalizacji artefaktów procesu

Zgodnie z notą powtarzaną przez wszystkie trzy rundy: `00-dispatch.md` istnieje wyłącznie
w `/home/user/The-Game`; `01`–`07` istnieją w worktree `/home/user/wt-miasta-blisko`. Ten
raport zapisuję w worktree (ścieżka wskazana wprost w dyspozycji Final Control). Cała
weryfikacja (kod, testy, git) wykonana WYŁĄCZNIE w `/home/user/wt-miasta-blisko`.

## Stan worktree na starcie (potwierdzone)

`git log -1 --oneline` → `f82aa354 Dyspozycje: dispatch runda 2 lucznicy-auto + dwa nowe
tematy (stadnina, karta)` — zgodne z dyspozycją ("HEAD nadal f82aa354"). `git status --short`
→ dokładnie trzy zmienione pliki źródłowe (`ai-difficulty-bonus.ts`, `cluster-start.ts`,
`main.ts`) + dwa untracked (`dyspozycje/autobot/runs/.../`, `gra/tools/miasta-zbyt-blisko-
test.cjs`) — nic nie zresetowane/scommitowane, zgodne z oczekiwaniem. `origin/main` jest 13
commitów PRZED worktree od strony przeciwnej (worktree 13 commitów ZA `origin/main` przez
niezwiązane integracje równoległe) — potwierdza notę Evaluatora rundy 3; użyty
`git merge-base HEAD origin/main` = `f82aa354` (== HEAD), więc `git diff f82aa354` jest
tożsame z `git diff <merge-base>` i nie niesie szumu z innych tematów.

## WERDYKTY (9 punktów, niezależna weryfikacja)

**1. `tsc --noEmit` → PASS.**
Uruchomione samodzielnie z `gra/`: `node ./node_modules/typescript/bin/tsc --noEmit` →
**0 błędów**, exit 0. Zgodne z trzema poprzednimi rundami.

**2. `cluster-start-test.cjs` (pełny przebieg, ~23 min, SYNCHRONICZNIE, bez przerywania)
→ PASS.**
Uruchomiony samodzielnie (real 22m56.935s, exit kodu testu = 1 — oczekiwane, bo test
kończy `process.exit(failed > 0 ? 1 : 0)`, a 19 pre-istniejących FAIL bazowych zawsze tam
jest niezależnie od tego tematu). Wynik: **396 passed, 19 failed** — identyczne liczby jak
w rundzie 3 (Operator i Evaluator). Pełna lista FAIL wyekstrahowana `grep -E '^FAIL' | sort
| uniq -c`:
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
Suma = 19. Porównanie TEKSTOWE (nie liczbowe) z listą 19 FAIL bazowych z
`04-operator-runda2.md` §"Lista 19 FAIL bazowych" (potwierdzoną tam bajt-identyczną z
`origin/main` metodą `git stash`/`pop`) — **identyczne co do treści i liczności każdego
wariantu, zero rozbieżności**. Sprawdzone też wprost `grep -iE` na wszystkie 6 dotąd
nazwanych regresji (5 z rundy 1: `owner 6/7/10 → typ rzymianie`, `owner 16 → typ inkowie`,
`typCityCopyOwners = państwa bez stolic klastrów`; 1 z rundy 2: `każdy obcy typ z miastami
ma stolicę klastra`) → **0 trafień w pełnym logu FAIL**. Total pass+fail (415) różni się
nieznacznie od poprzednich przebiegów (421/412/395+20) z powodu niedeterministycznego
mapgen między procesami (część asercji warunkowa, np. `if (chinczycy) {...}`) — zgodnie z
wyjaśnieniem Operatora/Evaluatora rundy 2, zbiór FAIL, nie surowa liczba, jest miarodajny.
**Zero nowych FAIL spoza 19 bazowych — REGUŁA PRZECIW SAMOOSZUKIWANIU spełniona, nie
znaleziono niczego do naprawy.**

**3. `miasta-zbyt-blisko-test.cjs` → PASS.**
Uruchomiony samodzielnie: `PASS — plan: 23329/23329 par w normie, widma: brak, realna
kolejność: 25768/25768 par w normie`. Dokładnie zgodne z oczekiwaniem dyspozycji
(23329/23329, widma 0, 25768/25768) i z raportami wszystkich trzech rund.

**4. `miasta-panstwa-wylaczone-test.cjs` → PASS (z potwierdzonym wyjaśnieniem 3 FAIL).**
Uruchomiony samodzielnie: **52 pass, 3 fail** — identyczne z trzema rundami. Przeczytany
CAŁY plik testu (`gra/tools/miasta-panstwa-wylaczone-test.cjs`): sekcja C buduje bundle
`PRE` z zamrożonego snapshotu `origin/main` (katalog w scratchpadzie, `bundleOf`) i bundle
`POST` z bieżącego worktree, po czym asercjuje BAJT-IDENTYCZNOŚĆ (`JSON.stringify` po
normalizacji) wyniku `buildClusterStartPlan` dla n=1/5/9 — dokładnie ta funkcja, którą ten
temat CELOWO zmienia (rejestracja po kolizji, filtrowanie `foreignTypeClusters`/
`clusterCapitalOwnerIds`/`typCityCopyOwners`, promocja substytutu stolicy). Test jest
zaprojektowany jako regresja NA INNYM temacie (`P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1`)
i explicite zakłada niezmienność `buildClusterStartPlan` między PRE a POST — założenie,
które ten temat świadomie łamie. 3 FAIL (n=1, n=5, n=9, wszystkie "plan PRZED === plan PO,
byte-identyczne") są DOKŁADNIE oczekiwanym, bezpośrednim skutkiem ubocznym naprawy tego
tematu, nie regresją logiki gry — potwierdzone czytaniem testu wprost, nie tylko przyjęciem
raportu. **Rekomendacja (potwierdzona rozumowaniem z kodu testu, nie tylko raportem):
referencyjny bundel PRE (`bundleOf`/snapshot origin/main) w tym pliku wymaga aktualizacji
PRZY integracji orkiestratora (po scaleniu tego tematu do main), nie w tej rundzie —
inaczej sekcja C tego testu będzie trwale FAIL-ować na każdym przyszłym worktree.**

**5. Pięć bramek referencyjnych → PASS, wszystkie zgodne z §6 R-PROC-AUTOBOT.**
- `logic-test.cjs` → 213/213.
- `tech-tree-test.cjs` → 19/19.
- `research-test.cjs` → 33/33 (ALL GREEN).
- `unit-replace-test.cjs` → 13/13.
- `combat-test.cjs` → 6/6.
Wszystkie zgodne z wynikiem referencyjnym tabeli §6 i z deklaracjami trzech rund.

**6. `found-from-village-test.cjs`, `cluster-spread-test.cjs`,
`city-state-cluster-diff-test.cjs` → PASS, zielone bez zmian.**
- `found-from-village-test.cjs` → 24/24.
- `cluster-spread-test.cjs` → 5 passed, 0 failed.
- `city-state-cluster-diff-test.cjs` → 31 passed, 0 failed.
Identyczne z deklaracjami wszystkich trzech rund.

**7. `git diff --check` → PASS.**
Uruchomione w worktree: exit 0, brak wyjścia (czysto, zero problemów z białymi znakami).

**8. Diff trzech plików allowlisty względem `merge-base` (=`f82aa354`) → PASS, punktowe,
zgodne z allowlistą; `buildCityCaptureReportRows` NIEDOTKNIĘTE.**
Przeczytany CAŁY diff (nie streszczenie z raportów):
- `gra/src/game/ai-difficulty-bonus.ts` (+41/−~10 w obrębie funkcji): WYŁĄCZNIE
  `pickBonusCityHex` przepisana z "bezpośredni sąsiad + `clusterStartSlot: true`" na
  przeszukanie rosnącego promienia (dolna/górna granica = wielokrotność
  `MIN_CITY_DISTANCE`, żadna nowa liczba balansu) z realnym `canFoundCity(...)` BEZ
  żadnych opts (czyli bez obejścia) — potwierdzone treścią diffu 1:1.
- `gra/src/main.ts` (+22/−1): WYŁĄCZNIE jedna linia w `spawnPendingForeignClusters` —
  `foundCityAt(sc.q, sc.r, sc.ownerId, cities, map, sc.name, isCS, true)` →
  `foundCityAt(..., isCS)` (usunięty ostatni argument `clusterStartSlot=true`), plus
  komentarz wyjaśniający. Zgrepowany cały diff pod kątem `buildCityCaptureReportRows` →
  **0 trafień** — funkcja istnieje w main.ts, ale poza diffem tego tematu, POTWIERDZONE
  nietknięta.
- `gra/src/game/cluster-start.ts` (+122/−~3, w `buildClusterStartPlan`): (a) nowa pętla
  kolizji `acceptedForDistance`/`hexDistance` vs próg `MIN_CITY_DISTANCE`/
  `MIN_CITY_DISTANCE_START_CITY_STATE` z rejestracją właściciela PRZENIESIONĄ po
  `if (collides) continue` (fix Zarzutu 1, runda 1); (b) `acceptedOwnerIds`-owe
  filtrowanie `foreignTypeClusters`/`clusterCapitalOwnerIds` parami, z usuwaniem pustych
  grup (runda 2); (c) promocja pierwszego przetrwałego slotu na substytut stolicy w
  `clusterCapitalOwnerIds` + korygujący `.delete()` w `typCityCopyOwners` (runda 3,
  rozszerzona allowlista, opcja (a) orkiestratora zastosowana — NIE osłabiono testu).
  Wszystko WYŁĄCZNIE wewnątrz `buildClusterStartPlan`, dokładnie te pola co w
  rozszerzonej allowliście. Reszta zwracanego obiektu (`spawnCities`, `aiStartHexes`,
  `pendingSameTypeRivals`, `placement`, itd.) nietknięta.
`git diff --stat` cumulatywnie: `ai-difficulty-bonus.ts` +41/−, `cluster-start.ts`
+122/−, `main.ts` +22/− → 175 insertions/10 deletions, identyczne z deklaracją rundy 3.
Żadnych zmian poza tymi trzema plikami (plus nowy plik testowy i katalog raportów, oba
w allowliście).

**9. `gra/tools/cluster-start-test.cjs` NIE zmodyfikowany → PASS.**
`git diff --stat f82aa354 -- gra/tools/cluster-start-test.cjs` → pusty wynik (exit 0, brak
linii). Plik bez żadnej zmiany względem merge-base przez wszystkie 3 rundy — zakaz z
dyspozycji przestrzegany.

## AGREGAT

Wszystkie 9 punktów: **PASS**, z dowodem własnej, niezależnej weryfikacji (nie tylko
odczyt raportów). Zero rozbieżności między moim przebiegiem a raportami Operatora/
Evaluatora we wszystkich trzech rundach. Zero nowych FAIL/regresji spoza już nazwanych i
wyjaśnionych. Diagnoza (dwa kanały: `pickBonusCityHex` z sąsiadem odległości=1 +
`clusterStartSlot: true`; brak weryfikacji dystansu międzyklastrowego w
`buildClusterStartPlan`/`spawnPendingForeignClusters`) potwierdzona źródłowo i empirycznie
w trzech niezależnych rundach + w tej weryfikacji. Zgłoszenie (c) właściciela ("podwójne
miasta przy zdobywaniu miast-państw") — wyjaśnione w rundzie 1 jako TO SAMO zjawisko (a)/(b),
nie osobny defekt duplikacji (`applyCityCaptureAfterBattle`/`resolveSiegeSurrender` tylko
mutują `ownerId`, nie tworzą nowego `City`) — nie kwestionowane w żadnej kolejnej rundzie,
nie zbadane ponownie przeze mnie źródłowo w tej rundzie (poza zakresem 9 punktów zleconych
Final Control), ale nie ma żadnego sygnału sprzecznego w żadnym z 7 raportów.

**GOTOWE DO INTEGRACJI.**

## DOWÓD WŁASNEJ WERYFIKACJI (skrót komend i wyników)

```
$ git -C /home/user/wt-miasta-blisko log -1 --oneline
f82aa354 Dyspozycje: dispatch runda 2 lucznicy-auto + dwa nowe tematy (stadnina, karta)
$ git -C /home/user/wt-miasta-blisko status --short
 M gra/src/game/ai-difficulty-bonus.ts
 M gra/src/game/cluster-start.ts
 M gra/src/main.ts
?? dyspozycje/autobot/runs/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/
?? gra/tools/miasta-zbyt-blisko-test.cjs

$ node ./node_modules/typescript/bin/tsc --noEmit   (z gra/)
(0 błędów, exit 0)

$ node tools/cluster-start-test.cjs   (pełny przebieg, real 22m56.935s)
396 passed, 19 failed
(pełna lista 19 FAIL — patrz punkt 2 wyżej — identyczna tekstowo z bazą rund 2-3, zero
nowych, zero z 6 dotąd nazwanych regresji)

$ node tools/miasta-zbyt-blisko-test.cjs
PASS — plan: 23329/23329 par w normie, widma: brak, realna kolejność: 25768/25768 par w normie

$ node tools/miasta-panstwa-wylaczone-test.cjs
52 pass, 3 fail   (3 FAIL = sekcja C, byte-identyczność vs PRE-bundle origin/main — wyjaśnione
czytaniem testu, oczekiwany skutek uboczny zmiany buildClusterStartPlan)

$ node tools/logic-test.cjs            → LOGIC OK (213/213)
$ node tools/tech-tree-test.cjs        → 19 pass, 0 fail
$ node tools/research-test.cjs         → PASSED: 33 / FAILED: 0 (ALL GREEN)
$ node tools/unit-replace-test.cjs     → 13/13
$ node tools/combat-test.cjs           → 6/6
$ node tools/found-from-village-test.cjs        → FOUND-FROM-VILLAGE OK (24/24)
$ node tools/cluster-spread-test.cjs            → 5 passed, 0 failed
$ node tools/city-state-cluster-diff-test.cjs   → 31 passed, 0 failed

$ git diff --check   (worktree root)
(czysto, exit 0)

$ git merge-base HEAD origin/main
f82aa354a395aaf10f3ed0e151921ccd0b3c1fdb   (== HEAD; origin/main 13 commitów dalej)

$ git diff --stat f82aa354
 gra/src/game/ai-difficulty-bonus.ts |  41 +++++++++---
 gra/src/game/cluster-start.ts       | 122 +++++++++++++++++++++++++++++++++++-
 gra/src/main.ts                     |  22 ++++++-
 3 files changed, 175 insertions(+), 10 deletions(-)

$ git diff --stat f82aa354 -- gra/tools/cluster-start-test.cjs
(pusty wynik — plik nietknięty)

$ git diff f82aa354 -- gra/src/main.ts | grep -n buildCityCaptureReportRows
(0 trafień — funkcja nietknięta tym tematem)
```

## ZMIANY-COMMIT

Brak commitu (Final Control nie integruje, nie commituje). Pliki zmienione w worktree
względem merge-base `f82aa354`, wszystkie WYŁĄCZNIE w allowliście dyspozycji:
- `gra/src/game/ai-difficulty-bonus.ts` — `pickBonusCityHex` (przeszukanie rosnącego
  promienia, realny `canFoundCity` bez obejścia).
- `gra/src/game/cluster-start.ts` — `buildClusterStartPlan`: kolizja dystansu +
  rejestracja po kolizji (runda 1); filtrowanie `foreignTypeClusters`/
  `clusterCapitalOwnerIds` (runda 2); promocja substytutu stolicy +
  korekta `typCityCopyOwners` (runda 3, rozszerzona allowlista).
- `gra/src/main.ts` — `spawnPendingForeignClusters`: usunięty `clusterStartSlot=true` z
  jednego wywołania `foundCityAt`.
- `gra/tools/miasta-zbyt-blisko-test.cjs` — nowa bramka dowodowa (plan + widma +
  symulacja realnej kolejności spawnu), 20 seedów.
- `dyspozycje/autobot/runs/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/*` — artefakty procesu.

`gra/tools/cluster-start-test.cjs` — potwierdzone NIETKNIĘTY (punkt 9).

## TESTY

Pełne wyniki — patrz WERDYKTY punkty 1-6 i DOWÓD WŁASNEJ WERYFIKACJI wyżej. Podsumowanie:
- `tsc --noEmit`: 0 błędów.
- `cluster-start-test.cjs`: 396/19, zbiór FAIL identyczny z bazą origin/main (19),
  zero nowych, zero z 6 dotąd nazwanych regresji.
- `miasta-zbyt-blisko-test.cjs`: PASS 23329/23329, widma 0, realna kolejność 25768/25768.
- `miasta-panstwa-wylaczone-test.cjs`: 52/3, 3 FAIL wyjaśnione i oczekiwane.
- 5 bramek referencyjnych: wszystkie zielone zgodnie z §6.
- `found-from-village-test.cjs`/`cluster-spread-test.cjs`/`city-state-cluster-diff-test.cjs`:
  zielone bez zmian.
- `git diff --check`: czysto.
- `map-gen-regression-test.cjs`: świadomie pominięty przez wszystkie 3 rundy (niezwiązany
  z dystansem miast, wolny — rzędu minut) — Final Control NIE miał go w zleconym zakresie
  9 punktów, nie uruchamiany.

## BLOKADY

1. **`miasta-panstwa-wylaczone-test.cjs` — 3 FAIL, oczekiwany skutek uboczny.**
   Rekomendacja: orkiestrator aktualizuje referencyjny bundel PRE (`bundleOf`/snapshot
   `origin/main` w scratchpadzie, użyty przez sekcję C tego testu) PRZY integracji tego
   tematu do `main` — potwierdzone czytaniem testu, że to jest jedyny sposób, by sekcja C
   przestała trwale FAIL-ować po scaleniu (test asercjuje bajt-identyczność
   `buildClusterStartPlan` z zamrożonym PRE, a ten temat świadomie zmienia tę funkcję).
   Nie blokuje integracji tego tematu — to konsekwencja integracji, nie przeszkoda przed nią.
2. Lokalizacja artefaktów procesu (rozjazd worktree/main repo, w tym powtarzający się
   incydent znikania plików w `/home/user/The-Game/dyspozycje/.../`) — bez wpływu na tę
   weryfikację (cała treść odczytana z worktree), zgłoszone przez wszystkie 3 rundy,
   nierozwiązane, poza zakresem tego tematu.
3. `map-gen-regression-test.cjs` nadal nieuruchomiony — świadomie, niezwiązany z tematem
   (dystans miast), zgodnie z decyzją wszystkich trzech rund.

## NASTĘPNY KROK

Integracja orkiestratora: scalenie trzech plików allowlisty (`ai-difficulty-bonus.ts`,
`cluster-start.ts`, `main.ts`) + nowej bramki `miasta-zbyt-blisko-test.cjs` (wpisanie do
tabeli §6 R-PROC-AUTOBOT jako nowa bramka referencyjna, zgodnie z regułą "nowa bramka
istnieje dopiero, gdy jest w tabeli") + artefaktów procesu tego tematu. Po integracji:
aktualizacja referencyjnego PRE-bundla w `miasta-panstwa-wylaczone-test.cjs` (BLOKADA 1).
Następnie `READY_FOR_DEPLOY` może wystawić wyłącznie orkiestrator po faktycznej integracji.

## DEPLOY/PUSH: NIE WYKONANO
