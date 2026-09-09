STATUS: FAIL
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozować i naprawić przypadki miast AI (główne cywilizacje i/lub miasta-państwa)
powstających poniżej minimalnego dystansu, mimo istniejącej reguły MIN_CITY_DISTANCE/
MIN_CITY_DISTANCE_START_CITY_STATE w canFoundCity (gra/src/game/cities.ts).

## Uwaga o lokalizacji artefaktów procesu

Ten raport, jak i raport Operatora, zapisuję w `/home/user/The-Game` (nie w worktree) —
z tej samej przyczyny co odnotował Operator: `00-dispatch.md` istnieje wyłącznie tutaj.
Cała weryfikacja kodu i wszystkie live-symulacje wykonane były WYŁĄCZNIE w worktree
`/home/user/wt-miasta-blisko` (gałąź `autobot/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1`).

## Niezależna weryfikacja diagnozy i dowodu Operatora (POTWIERDZONE)

- `node ./node_modules/typescript/bin/tsc --noEmit` (uruchomione samodzielnie) → **0 błędów**,
  zgodnie z raportem.
- `node tools/miasta-zbyt-blisko-test.cjs` (uruchomione samodzielnie, niezależnie) →
  **PASS 23329/23329**, potwierdzone.
- `node tools/miasta-zbyt-blisko-test.cjs --mutate-przed-napraw` (uruchomione samodzielnie) →
  **FAIL 23209/23329 (120 naruszeń)** — bramka faktycznie nietautologiczna, potwierdzone.
- `git diff --stat` w worktree → wyłącznie `ai-difficulty-bonus.ts` i `cluster-start.ts`
  zmienione (+ nowy plik testowy) — zgodne z allowlistą, potwierdzone.
- Diagnoza kanału 1 (`pickBonusCityHex`, sąsiad odległości=1 + `clusterStartSlot: true`) —
  zweryfikowana źródłowo, poprawna.
- Diagnoza kanału 2 (`buildClusterStartPlan` bez weryfikacji dystansu międzyklastrowego) —
  zweryfikowana źródłowo, poprawna. Naprawa (sekwencyjna weryfikacja względem
  `acceptedForDistance`) jest logicznie zgodna z regułą progu z `canFoundCity`
  (próg 3 gdy `prev.isCityState || slotIsCityState`, inaczej `MIN_CITY_DISTANCE`) —
  POTWIERDZONE czytaniem `cities.ts:1159-1173` linia po linii, zgodność 1:1.
- Wniosek o zgłoszeniu (c) (podwójne miasta przy podboju = ten sam efekt co (a)/(b),
  nie osobny defekt duplikacji) — zweryfikowany żywym czytaniem `applyCityCaptureAfterBattle`
  i `resolveSiegeSurrender`: oba wyłącznie mutują `ownerId` na istniejącym obiekcie, żaden
  nie tworzy nowego City. Potwierdzone.

Powyższe punkty BINARNEGO KRYTERIUM są spełnione i nie są kwestionowane.

## ZARZUTY

**Zarzut 1 (POTWIERDZONY własną symulacją, nowy defekt wprowadzony przez naprawę
kanału 2) — "widmowi" właściciele bez ŻADNEGO miasta.**

`buildClusterStartPlan` (cluster-start.ts) wypełnia `aiOwnerCivMap`, `ownerDisplayName`,
`simplifiedDiplomacyOwners`/`foreignTypeOwners`, `typCityCopyOwners` i `startRelations`
dla KAŻDEGO slotu z `spawnPlan.slots` (linie 117-122) — **PRZED** pętlą weryfikacji
dystansu (linie 128-134), która dopiero potem, przy kolizji, robi `continue` pomijając
WYŁĄCZNIE dopisanie do `spawnCities`/`aiStartHexes`/`acceptedForDistance`. Skutek: slot
odrzucony przez nową naprawę pozostaje mimo to zarejestrowany jako pełnoprawny
właściciel/cywilizacja/miasto-państwo (z relacją dyplomatyczną, nazwą wyświetlaną,
flagą `typCityCopyOwners`) w całym pozostałym stanie gry — ale nie ma ANI JEDNEGO
miasta na całej mapie, na zawsze (main.ts w wielu miejscach iteruje
`aiOwnerCivMap.keys()` zakładając istnienie miasta danego ownera — tury AI, badania,
dyplomacja, zapis/odczyt).

Własny, niezależny dowód (skrypt `tools/.orphan-owner-eval-test.cjs`, usunięty po
weryfikacji, TE SAME 20 seedów i konfiguracja co bramka Operatora): **3/20 map
generuje "widmowego" właściciela** — seed=5 (owner 33), **seed=42 (owner 37 — DOKŁADNIE
ten sam przypadek, który Operator sam zmierzył w swojej diagnozie jako "owner11-CS i
owner37-CS w odległości 2 heksów"!)**, seed=610 (owner 38 i 40). Wszystkie 4 to
`typCityCopyOwners` (miasta-państwa/kopie typu z obcego klastra), wszystkie mają wpis w
`startRelations` (a więc główna pętla dyplomacji w main.ts je "widzi" jako aktywnego
gracza). Przed naprawą tego tematu taki stan był NIEOSIĄGALNY — `clusterStartSlot: true`
gwarantowało, że KAŻDY slot z planu zawsze faktycznie zakłada miasto. To jest nowy,
nieprzeanalizowany przez Operatora efekt uboczny naprawy kanału 2, nieukryty przez żadną
z bramek referencyjnych (żadna nie sprawdza "czy każdy ownerId w aiOwnerCivMap ma >=1
miasto"). Operator nazywa to "tym samym wzorcem co `extraCitiesBlocked`" — nieprawda:
`extraCitiesBlocked` dotyczy ownera, który JUŻ MA stolicę (major AI) i tylko traci
DODATKOWĄ kolonię (zastąpioną jednostkami); tu odrzucony slot to CAŁY, jedyny wpis
danego ownera — po odrzuceniu nie ma dla niego żadnej rekompensaty ani usunięcia z
rejestru.

**Zarzut 2 (zidentyfikowany źródłowo, NIE zweryfikowany jako faktycznie występujący
w 20-seedowej próbce Operatora — luka w POKRYCIU dowodu, nie potwierdzone naruszenie).**

Bramka `miasta-zbyt-blisko-test.cjs` i cały dowód PRZED/PO w raporcie Operatora
**świadomie i jawnie pomijają miasta-państwa tego samego typu co gracz
(`pendingSameTypeRivalHexes`/realny spawn przez `buildSameTypeRivalCandidateHexes`)** —
uzasadnienie w komentarzu bramki ("ta ścieżka już dziś stosuje realny, nieobchodzony
`canFoundCity`") jest PRAWDZIWE tylko dla kolizji rywala z miastami zało­żonymi
WCZEŚNIEJ (stolica gracza), a NIE dowodzi bezpieczeństwa w drugą stronę: kolejność
realna w main.ts (linia 12700-12701) to `spawnPendingSameTypeRivals` **najpierw**,
potem `spawnPendingForeignClusters` **później** — a `spawnPendingForeignClusters`
zakłada każde miasto klastra obcego typu przez `foundCityAt(..., clusterStartSlot=true)`,
co **całkowicie pomija `canFoundCity`** (patrz `cities.ts:1159`) i polega WYŁĄCZNIE na
statycznej liście `acceptedForDistance` z `buildClusterStartPlan` — lista ta jest
budowana raz, w całości PRZED jakimkolwiek runtime'owym spawnem, i nie zawiera ani
jednej pozycji miasta-państwa tego samego typu (te są dobierane osobną funkcją,
`buildSameTypeRivalCandidateHexes`, w map/clusters.ts, wywoływaną z realną pozycją
stolicy gracza DOPIERO w main.ts). Dodatkowo `buildSameTypeRivalCandidateHexes`
(cluster-spawn.ts:130-155) jest jedynym miejscem wywołania `packCityStatesAroundCapital`
w całym repo, które NIE przekazuje `opts.foreignBuffers` (w przeciwieństwie do
kilkunastu wywołań w `clusters.ts` budujących plan klastrów) — więc dobór kandydatów
na rywali gracza nie ma żadnej wbudowanej wiedzy o pozycjach klastrów obcych typów.
Innymi słowy: ANI kierunek (rywal → obcy klaster), ANI (obcy klaster → rywal) nie ma
podwójnego zabezpieczenia — a jedno z tych dwóch ogniw (obcy klaster wobec
już-founded rywala) jest CAŁKOWICIE nieweryfikowane przez `canFoundCity` w runtime.

Własna próba empirycznej reprodukcji (skrypt `.kanal3-eval-test.cjs`, ta sama
konfiguracja co bramka Operatora, 20 seedów) odtwarzająca realną kolejność spawnu:
**0/20 naruszeń krzyżowych zmierzonych** — czyli na TEJ próbce nie zmaterializowało
się. To NIE zamyka zarzutu: bramka referencyjna Operatora explicite deklaruje, że
w ogóle nie testuje tej pary kanałów (własny komentarz w pliku, linie 25-31), więc
BINARNE KRYTERIUM „0 par miast naruszających dystans, potwierdzone PRZED/PO" pozostaje
NIEUDOWODNIONE dla tej konkretnej kombinacji ścieżek — nie ma dowodu POZYTYWNEGO ani
NEGATYWNEGO poza tą jedną próbką 20 seedów przy jednej konfiguracji gęstości
(rywaleNaKlaster=6, aktywneTypy=7). Traktuję to jako zarzut o NIEPEŁNYM pokryciu dowodu
(braku wykluczenia kanału), nie jako potwierdzone naruszenie.

**Zarzut 3 (zidentyfikowany źródłowo, próba empirycznej weryfikacji NIEROZSTRZYGNIĘTA
z powodu czasu wykonania — luka w pokryciu dowodu).**

Kolonia bonusowa (`pickBonusCityHex`, kanał 1, sam w sobie poprawnie naprawiony) NIGDY
nie jest dopisywana do `acceptedForDistance` w `cluster-start.ts` — bo `acceptedForDistance`
jest budowane raz, w całości, PRZED jakimkolwiek runtime'owym spawnem, a kolonie powstają
dopiero w trakcie pętli `spawnPendingForeignClusters` (main.ts), interleaved z zakładaniem
KOLEJNYCH, już wcześniej zaplanowanych stolic/miast-kopii innych klastrów. Ponieważ każde
z tych kolejnych miast jest zakładane przez `foundCityAt(..., clusterStartSlot=true)`
(dystans NIE sprawdzany w runtime), JEDYNĄ ochroną przed kolizją z kolonią założoną
chwilę wcześniej dla INNEJ stolicy jest ta sama statyczna, przed-runtime'owa lista —
która z definicji nie może znać pozycji kolonii (nie istnieją w momencie liczenia planu).
`pickBonusCityHex` przeszukuje promień aż `MIN_CITY_DISTANCE*3` (=15) od stolicy, więc
geometrycznie może wylądować bliżej centrum mapy / bliżej sąsiedniego klastra niż promień
separacji kapitałów. Próba live-symulacji tej dokładnej interakcji (`.kanal2b-eval-test.cjs`,
3 konfiguracje gęstości × 20 seedów = 60 map, odtwarzająca krok po kroku kolejność
`spawnPendingForeignClusters`) **nie zdążyła się zakończyć w rozsądnym czasie** (timeout
590s, ukończyła tylko część map bez sfinalizowanego wyniku) — więc NIE MAM ani
potwierdzenia, ani wykluczenia tego kanału. Zgłaszam to jako zarzut o niekompletnym
dowodzie (ta sama kategoria co Zarzut 2), z rekomendacją dla Final Control/kolejnej rundy:
dokończyć tę symulację z większym budżetem czasowym i/lubańszą liczbą seedów (np. 20
zamiast 60 kombinacji), zanim binarne kryterium zostanie uznane za w pełni potwierdzone.

## Ocena BLOKAD 1-2 zgłoszonych przez Operatora

- **BLOKADA 1 (`cluster-start-test.cjs` nieukończony)**: potwierdzam jako wciąż otwartą —
  nie próbowałem uruchomić pełnego przebiegu (Operator dokumentuje 20+ minut, poza
  rozsądnym budżetem tej rundy weryfikacji); traktuję częściowy dowód Operatora
  (18 identycznych FAIL PRE/PO na etapie main+medium) jako poszlakę, nie pełny dowód —
  zgodnie z własną kwalifikacją Operatora. Nie jest to nowy zarzut, tylko potwierdzenie
  że BLOKADA pozostaje nierozwiązana.
- **BLOKADA 2 (`miasta-panstwa-wylaczone-test.cjs`, 3 FAIL byte-identyczności)**: zbadane
  źródłowo (`tools/miasta-panstwa-wylaczone-test.cjs`, komentarz linii ~10-25) —
  potwierdzam charakterystykę Operatora: test C asercjuje byte-identyczność planu
  z `origin/main`, a ten temat CELOWO zmienia `buildClusterStartPlan`, więc FAIL jest
  oczekiwanym, udokumentowanym skutkiem, nie regresją logiki. Decyzja o aktualizacji
  referencyjnego PRE-bundla należy do orkiestratora/Final Control po integracji — zgadzam
  się z Operatorem, że nie do rozstrzygnięcia jednostronnie teraz.

## TESTY (uruchomione niezależnie przeze mnie, w worktree)

- `tsc --noEmit` → 0 błędów (potwierdzone).
- `miasta-zbyt-blisko-test.cjs` → PASS 23329/23329 (potwierdzone).
- `miasta-zbyt-blisko-test.cjs --mutate-przed-napraw` → FAIL 23209/23329 (potwierdzone).
- `git diff --stat` → tylko pliki z allowlisty zmienione (potwierdzone).
- Nowy, własny skrypt dowodowy `orphan-owner-eval-test.cjs` (20 seedów, konfiguracja
  Operatora) → 3/20 map z widmowym właścicielem (Zarzut 1, POTWIERDZONE).
- Nowy, własny skrypt `kanal3-eval-test.cjs` (rywal-tego-samego-typu × obcy-klaster,
  20 seedów) → 0/20 naruszeń na tej próbce (Zarzut 2, NIE potwierdza ani nie wyklucza).
- Nowy, własny skrypt `kanal2b-eval-test.cjs` (kolonia × późniejszy zaplanowany slot,
  60 kombinacji) → NIEUKOŃCZONY (timeout), (Zarzut 3, nierozstrzygnięte).
- Wszystkie trzy własne skrypty testowe USUNIĘTE z worktree po weryfikacji (nie są
  częścią allowlisty, nie zostały scommitowane) — `git status --short` w worktree po
  sprzątaniu pokazuje wyłącznie zmiany Operatora + jego nowy plik bramki.

## BLOKADY

1. Zarzut 2 i Zarzut 3 wymagają dokończenia symulacji z większym budżetem czasowym
   (rekomendacja: kolejna runda, mniejsza liczba kombinacji seed×config, dedykowany
   czas na pełny przebieg zamiast timeoutu 300-600s) zanim orkiestrator uzna binarne
   kryterium za w pełni, wyczerpująco potwierdzone dla WSZYSTKICH par miast.
2. BLOKADA 1 Operatora (`cluster-start-test.cjs`) — nierozwiązana, przeniesiona.
3. BLOKADA 2 Operatora (`miasta-panstwa-wylaczone-test.cjs` PRE-bundle) — wymaga decyzji
   orkiestratora/Final Control po integracji, nie Evaluatora.

## RUNDY: 1/5

## NASTĘPNY KROK: Operator (runda 2) — naprawić Zarzut 1 (usunąć rejestrację
właściciela/relacji dla slotu odrzuconego przez kolizję w `buildClusterStartPlan`, albo
przenieść wypełnianie `aiOwnerCivMap`/`ownerDisplayName`/`simplifiedDiplomacyOwners`/
`foreignTypeOwners`/`typCityCopyOwners`/`startRelations` PO sprawdzeniu kolizji, symetrycznie
do `spawnCities`/`aiStartHexes`/`acceptedForDistance`) oraz dokończyć/rozstrzygnąć Zarzuty
2-3 dowodem empirycznym o wystarczającym budżecie czasowym. Następnie ponowna Evaluacja.
DEPLOY/PUSH: NIE WYKONANO
