STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1
GOAL: Zdiagnozuj i napraw przypadki, w których miasta AI (główne cywilizacje i/lub
miasta-państwa) powstają zbyt blisko siebie — bezpośrednio sąsiadujące hexy, poniżej
istniejącego minimalnego dystansu — mimo że silnik ma już zaimplementowaną regułę minimalnego
dystansu (`MIN_CITY_DISTANCE`/`MIN_CITY_DISTANCE_START_CITY_STATE`, `canFoundCity` w
`gra/src/game/cities.ts`).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dosłowne, 2026-09-08, z trzema zrzutami ekranu): "Ostatnio pojawił
  się jakiś dziwny regres, mianowicie inne cywilizacje stawiają miasta obok siebie. Raz, że
  powinno być to zakazane, dwa, że jest to dosyć dziwne podczas zdobywania państw-miast,
  jakieś podwójne miasta, nie wiem, o co chodzi." Dwie osobne obserwacje w jednym zgłoszeniu —
  traktuj je jako DWA kandydatów do zbadania, mogą mieć wspólną lub różną przyczynę:
  a. Ogólne "miasta obok siebie" — dwa zrzuty pokazują PARY okrągłych, otoczonych palisadą
     osad (wygląd typowy dla wczesnej epoki) leżących na SĄSIADUJĄCYCH heksach (odległość ~1,
     rozdzielone tylko rzeką w jednym przypadku) — to jest wyraźnie PONIŻEJ jakiegokolwiek
     rozsądnego minimalnego dystansu.
  b. Trzeci zrzut, DOSŁOWNY, zweryfikowany żywy dowód: etykieta "URUK — KOLONIA" (miasto typu
     Budynek·Garncarnia, poziom 4) leży na hexie BEZPOŚREDNIO SĄSIADUJĄCYM ze stolicą "Uruk"
     tej samej cywilizacji — to NIE jest domysł, to jest dokładnie ten mechanizm bonusowego
     miasta startowego dla trudności (`gra/src/game/ai-difficulty-bonus.ts`), patrz niżej.
  c. Druga obserwacja właściciela ("podczas zdobywania państw-miast, jakieś podwójne
     miasta") może być OSOBNYM zjawiskiem od (a)/(b) — zbadaj żywo proces
     podboju/aneksji miasta-państwa (przejęcie stolicy miasta-państwa przez inną cywilizację)
     i sprawdź czy powstaje wtedy jakikolwiek duplikat wpisu miasta / dwa nakładające się City
     na tym samym lub sąsiednim hexie, zamiast zakładać że to to samo co (a)/(b).
- ŚWIEŻO ZWERYFIKOWANY PRZEZ ORKIESTRATORA, KONKRETNY, POTWIERDZONY ROOT CAUSE DLA
  PRZYNAJMNIEJ JEDNEGO KANAŁU (zweryfikuj świeżo, kod mógł się przesunąć):
  - `gra/src/game/cities.ts::canFoundCity` (~linia 1125-1190): pętla sprawdzająca
    `hexDistance(q, r, city.q, city.r) < minDist` (gdzie `minDist` = `MIN_CITY_DISTANCE`=5
    domyślnie z `miastoParams.min_dystans_miast`, albo `MIN_CITY_DISTANCE_START_CITY_STATE`=3
    gdy state-city) jest CAŁKOWICIE POMIJANA gdy `opts?.clusterStartSlot === true`
    (`if (!opts?.clusterStartSlot) { ... }` — cała pętla wewnątrz tego warunku).
  - `gra/src/game/ai-difficulty-bonus.ts::pickBonusCityHex` (~linia 143-156): dla bonusowego
    "miasta startowego" trudności (mechanizm dający major AI dodatkowe miasto na starcie,
    nazywane w main.ts `<Stolica> — kolonia`) — funkcja bierze `hexNeighborCoords(capitalQ,
    capitalR)` (WYŁĄCZNIE BEZPOŚREDNI SĄSIAD stolicy, odległość=1!) i wywołuje
    `canFoundCity(n.q, n.r, cities, map, { clusterStartSlot: true })` — czyli WPROST prosi o
    hex odległy o 1 od stolicy I JEDNOCZEŚNIE każe pominąć jedyny mechanizm, który mógłby to
    odrzucić. To jest bezpośrednia przyczyna zrzutu (b) "URUK — KOLONIA" tuż przy "Uruk".
  - `gra/src/main.ts::spawnPendingForeignClusters` (~linia 8808-8825): spawn miast
    obcych cywilizacji/miast-państw z planu klastra (`pendingForeignSpawnCities`, wypełniane z
    `buildClusterStartPlan(...).spawnCities` w `gra/src/game/cluster-start.ts`) TAKŻE woła
    `foundCityAt(sc.q, sc.r, sc.ownerId, cities, map, sc.name, isCS, true)` — ostatni parametr
    `true` = `clusterStartSlot`, więc TAKŻE pomija sprawdzenie dystansu. Komentarz przy
    definicji pola w `cities.ts` twierdzi "dystans do innych miast już zweryfikowany w
    map/clusters" — ŚWIEŻO SPRAWDŹ czy `cluster-start.ts`/`buildClusterStartPlan` FAKTYCZNIE
    weryfikuje dystans MIĘDZY RÓŻNYMI klastrami/miastami-państwami (nie tylko wewnątrz
    jednego klastra) — orkiestrator NIE znalazł żadnego wywołania `hexDistance`/sprawdzenia
    minimalnego dystansu w `cluster-start.ts` przy pobieżnym przeglądzie, ale NIE jest to
    potwierdzone wyczerpująco (mogła być w innym pliku wywoływanym przez ten moduł) — TY
    zweryfikuj to źródłowo i/lub żywą symulacją generowania mapy, nie zgaduj.
- WŁAŚCICIEL WPROST: "powinno być to zakazane" — jego oczekiwanie jest jednoznaczne: ŻADNE
  miasto (główna cywilizacja, kolonia bonusowa, miasto-państwo) nie powinno powstawać poniżej
  rozsądnego minimalnego dystansu od innego ISTNIEJĄCEGO miasta, niezależnie od mechanizmu,
  który je zakłada. To NIE jest prośba o zachowanie obecnego zachowania "kolonii bonusowej
  tuż przy stolicy" z jakimś wyjątkiem — potraktuj to jako jednoznaczną ABC: dystans ma
  obowiązywać WSZĘDZIE, bez wyjątków dla mechanizmów bonusowych/startowych.

ZADANIE:
1. Odtwórz problem z dowodem — headless symulacja generowania kilku map (różne seedy) ORAZ/LUB
   żywa gra do momentu ujawnienia "kolonii" bonusowej: zmierz FAKTYCZNĄ odległość między
   każdą parą miast tej samej cywilizacji i między sąsiadującymi cywilizacjami/miastami-
   państwami zaraz po wygenerowaniu mapy startowej. Policz ile par miast łamie
   `MIN_CITY_DISTANCE`/`MIN_CITY_DISTANCE_START_CITY_STATE` i przez który dokładnie kanał
   (`pickBonusCityHex` / `spawnPendingForeignClusters` / inny, jeśli znajdziesz kolejny).
2. Ustal DOKŁADNĄ przyczynę (może być więcej niż jedna) z dowodem — w tym zbadaj OSOBNO
   zgłoszenie (c) "podwójne miasta przy zdobywaniu miast-państw" (podbój/aneksja) —
   potwierdź żywo czy to jest TO SAMO zjawisko (widoczność dwóch blisko postawionych miast
   staje się bardziej rzucająca się w oczy dopiero PO podboju, gdy oba trafiają pod tego
   samego właściciela) czy NIEZALEŻNY defekt w kodzie podboju/aneksji tworzący duplikat.
3. Napraw: reguła minimalnego dystansu ma obowiązywać dla WSZYSTKICH ścieżek zakładania
   miasta, w tym bonusowej "kolonii" startowej i spawnu miast-państw/obcych cywilizacji z
   planu klastra. Konkretnie dla `pickBonusCityHex` — zamiast ograniczać się do bezpośrednich
   sąsiadów stolicy, przeszukaj szerszy promień i wybierz NAJBLIŻSZY legalny hex, który
   FAKTYCZNIE spełnia normalny warunek dystansu (nie przekazuj `clusterStartSlot: true` bez
   uzasadnienia — jeśli to pole ma zostać, jego semantyka musi się zmienić na coś, co
   NAPRAWDĘ gwarantuje wystarczający dystans, a nie tylko deklaruje że jest gwarantowany).
   Dla `spawnPendingForeignClusters`/`buildClusterStartPlan` — jeśli diagnoza pokaże, że
   `cluster-start.ts` nie weryfikuje dystansu międzyklastrowego, dodaj tam realną weryfikację
   (odrzucenie/przesunięcie slotu, który koliduje z już przydzielonym slotem innego
   klastra/miasta-państwa) zamiast polegać na milczącym założeniu.
4. Jeśli naprawa (3) wymaga zmiany liczby/promienia, którą trudno wyprowadzić jednoznacznie z
   istniejących stałych (np. jak daleko szukać zamiast "sąsiad"), użyj już istniejących stałych
   (`MIN_CITY_DISTANCE`, `MIN_CITY_DISTANCE_START_CITY_STATE`) jako dolnej granicy promienia
   wyszukiwania — NIE wymyślaj nowej liczby balansu bez wyraźnego uzasadnienia; jeśli mimo to
   uznasz że potrzebna jest nowa decyzja liczby, ZATRZYMAJ SIĘ i zgłoś DECISION_REQUIRED.
5. Żywy dowód PRZED/PO: ta sama symulacja z punktu 1, po naprawie ŻADNA para miast (główne
   cywilizacje, kolonie bonusowe, miasta-państwa) nie łamie minimalnego dystansu odpowiedniego
   dla danej pary.

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt przyczyny/przyczyn (z dowodem —
symulacja/żywa gra, nie domysł). Po naprawie: 0 par miast naruszających minimalny dystans w
wielu wygenerowanych mapach (różne seedy), potwierdzone PRZED/PO. Jeśli zgłoszenie (c) okaże
się osobnym defektem — naprawione i udowodnione osobno w tym samym temacie (albo jawnie
wydzielone jako osobny temat z uzasadnieniem, jeśli okaże się dużo szersze niż to, co się da
zrobić w ramach jednego dispatchu — zgłoś to jako BLOKADA, nie milcz). `tsc --noEmit` czysty,
5 bramek referencyjnych zielone, istniejące testy dystansu miast/klastra (plik z
"city-distance"/"cluster"/"miasta-panstwa" w nazwie w `gra/tools/`) nadal zielone lub
świadomie rozszerzone.

ALLOWLISTA:
- `gra/src/game/ai-difficulty-bonus.ts` (WYŁĄCZNIE `pickBonusCityHex`/logika wyboru hexa
  bonusowej kolonii)
- `gra/src/game/cluster-start.ts` (WYŁĄCZNIE jeśli diagnoza potwierdzi brak weryfikacji
  dystansu międzyklastrowego — dodaj ją tam, nie gdzie indziej)
- `gra/src/game/cities.ts` (WYŁĄCZNIE jeśli `canFoundCity`/`clusterStartSlot` wymaga zmiany
  semantyki, nie samego usunięcia — jeśli usuwasz `clusterStartSlot` całkowicie, potwierdź że
  żaden dzisiejszy, PRAWIDŁOWY przypadek użycia (jeśli taki istnieje) się nie psuje)
- `gra/src/main.ts` (WYŁĄCZNIE miejsca wywołania `foundCityAt` z `clusterStartSlot=true`
  wskazane w KONTEKŚCIE — nie przepisuj całej logiki spawnu)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1/*`
Zakaz `git add -A`. Zakaz wymyślania nowych liczb balansu bez wyraźnego uzasadnienia (patrz
ZADANIE pkt 4).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej
symulacji/generowania mapy (nie samo czytanie kodu — orkiestrator już zidentyfikował
najbardziej prawdopodobny kanał (`pickBonusCityHex`), ale to NIE zwalnia z potwierdzenia
żywym dowodem i sprawdzenia CZY jest to JEDYNY kanał). Zakaz "naprawienia" przez zwykłe
usunięcie `clusterStartSlot`/pominięcie parametru bez zrozumienia dlaczego został tam
pierwotnie wprowadzony (mogła być jakaś przyczyna wydajnościowa/funkcjonalna — sprawdź git
blame/komentarze przed usunięciem, nie tylko przed zmianą zachowania).

IZOLACJA: nowy worktree `/home/user/wt-miasta-blisko`, gałąź
`autobot/P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1`, baza `origin/main` @ najświeższy commit w chwili
startu (sprawdź `git fetch origin main` przed założeniem worktree).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki generowania mapy/AI, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
