# B0.8 — Rzeki: brakujące POŁĄCZENIA (dopływ↔rzeka, segmenty, ujście do morza)
Playtest Macieja 2026-07-05 wieczór, po wdrożeniu sieci dopływów. 3 screeny = 3 objawy.
Wykonawca: Claude Code (Opus). Obowiązują zasady z CLAUDE.md (determinizm rand()!, tsc=0,
weryfikacja-mapy PASS, strażnik markerów, backup .bak, bez promocji do kanonu).

## ⚠ WYKONYWAĆ RAZEM Z B0.7 (osierocone delty — `BLAD-B0.6-ZALANE-WYBRZEZE-2026-07-05.md`)
Kolejny playtest (zrzut z wieczora): delty/ujścia rozsiane wzdłuż CAŁYCH wybrzeży bez
dochodzącej rzeki — czyli kwalifikacja ujścia (B0.7 pkt 1-2) nadal nie działa globalnie:
dekor ujścia powstaje per heks/ścieżka zamiast WYŁĄCZNIE dla zakwalifikowanych ujść sieci.
B0.7 + B0.8 to jeden podsystem (kwalifikacja ujść + domknięcie krawędzi) — naprawiać razem,
jednym przebiegiem, z jednym zestawem testów (checkRiverEdgeContinuity + delty==ujścia).

## OBJAWY (z playtestu)
1. **Dopływ kończy się 1 heks OBOK rzeki docelowej** — miał wpadać, a między jego końcem
   a rzeką zostaje pusty heks / brak wspólnej krawędzi. Sieć wygląda na rozłączoną.
2. **Rzeki rysują się jako POSZATKOWANE odcinki** (screen 1: regularne przerwy wzdłuż
   jednego biegu — kreska-przerwa-kreska). Wcześniej biegi były ciągłe.
3. **Ujście nie WCHODZI w morze** — wstęga urywa się na krawędzi lądu/wybrzeża; delta jest,
   ale woda rzeki nie łączy się wizualnie z taflą morza (screen 2).

## KLUCZ ARCHITEKTONICZNY (dlaczego to się dzieje)
Rzeki są KRAWĘDZIOWE: `hex.rzeka.krawedzie` znakuje `markRiverPath()` wyłącznie dla PAR
KOLEJNYCH heksów ścieżki; render buduje wstęgi z tych ścieżek (`buildRiverPointsFromHexPath`)
po grafie wierzchołków. Każde „urwanie" = brakująca krawędź lub brakujący wspólny WIERZCHOŁEK
między dwiema wstęgami. Stąd trzy inwarianty do wymuszenia (poniżej).

## INWARIANTY (mają być prawdziwe po fixie — i sprawdzane testem)
I1. **Ciągłość biegu:** dla każdej ścieżki path[i], path[i+1] są sąsiadami hex ORAZ ich
    wspólna krawędź jest oznakowana. Render: jedna ciągła polilinia na ścieżkę
    (odległość kolejnych punktów ≤ długość krawędzi heksa; zero „skoków").
I2. **Domknięty junction:** ścieżka dopływu KOŃCZY SIĘ NA heksie należącym do sieci
    docelowej (junction hex JEST ostatnim elementem path dopływu), a krawędź
    przedostatni→junction jest oznakowana. Wstęga dopływu kończy się w WIERZCHOŁKU,
    przez który przechodzi wstęga rzeki docelowej (wspólny vertex, nie „obok").
I3. **Domknięte ujście:** ostatni punkt wstęgi ujścia leży WEWNĄTRZ pierwszego heksa wody
    (Wybrzeże przy Morzu lub Morze), ~30-40% w głąb, na poziomie tafli (riverMouthY),
    pod lejkiem delty. Zero ujść kończących się na linii brzegowej.

## NAPRAWA (kierunek, per objaw)
1. **Junction (objaw 1):** w fazie 2 generatora (dopływ do najbliższej rzeki) cel A* ma być
   osiągnięty dopiero, gdy ścieżka WEJDZIE na heks sieci (nie „sąsiad sieci"). Jeśli goal
   zatrzymuje się na sąsiedzie — DOPISAĆ heks junction do path przed markRiverPath.
   Sprawdzić też `addTributariesForMainRiver` (stare dopływy) — ten sam wymóg.
2. **Szatkowanie (objaw 2):** znaleźć, czemu wzdłuż JEDNEGO biegu brakuje co którejś
   krawędzi. Podejrzani: (a) `sanitizeRiverPath`/`repairRiverPathAdjacency` wycinają heksy
   ze środka ścieżki po zmianach sieciowych → para przestaje być sąsiadami → krawędź
   nieoznakowana (naprawa: po każdej modyfikacji ścieżki wymusić assertRiverPathAdjacent,
   a przy cięciu — dzielić na OSOBNE ścieżki, nie zostawiać dziur); (b) `neighborDirIndex`/
   `markRiverEdge` gubi część kierunków dla nowych tras (sprawdzić mapowanie 6 kierunków);
   (c) render dostaje ścieżki fragmentaryczne po splitAdjacentRiverChains. Zdiagnozować
   na seedzie z screena, naprawić u ŹRÓDŁA (dane), nie łatą w renderze.
3. **Ujście (objaw 3):** `buildRiverMouthSeaExtension` ma dociągać wstęgę do wnętrza
   pierwszego heksa Morza (punkt końcowy = środek heksa Morza przycięty do ~35% od
   krawędzi, Y = poziom tafli), a lejek delty ma być zakotwiczony w TYM SAMYM wierzchołku.
   Ujścia bez heksa Morza w sąsiedztwie końca (jezioro-Wybrzeże) — dociąg do środka
   ostatniego heksa wody.

## TEST AUTOMATYCZNY (dopisać do tools/weryfikacja-mapy.ts)
- `checkRiverEdgeContinuity(paths, hexes)`: I1 dla 100% ścieżek (zero par bez wspólnej
  oznakowanej krawędzi) — FAIL przy pierwszym naruszeniu, wypisz seed+ścieżkę+indeks.
- `checkTributaryJunctions(paths, kinds, hexes)`: I2 — każdy dopływ kończy na heksie
  z krawędziami rzecznymi innej ścieżki swojej sieci.
- I3 (render-level) — playtest wizualny Macieja + zrzut; opcjonalnie: asercja w danych,
  że ostatni hex każdej ścieżki-ujścia to woda lub sąsiad Morza.
Uruchomienie: pełny zestaw seedów (5 × 4 typy) + standard + super-only.

## KRYTERIA AKCEPTACJI
1. weryfikacja-mapy (z nowymi checkami) = PASS na wszystkich przypadkach.
2. Playtest wizualny: zero przerw wzdłuż biegów; każdy dopływ wizualnie WPADA do rzeki
   (wspólny wierzchołek); każde ujście wchodzi w taflę morza pod deltą.
3. Determinizm: hash mapy bez zmian (chyba że fix wymaga zmiany ścieżek — wtedy adnotacja
   i zamrożenie nowych hashy).
4. Bez regresu czasu generacji (±10% względem raportu z RAPORTOWANIA).

## B0.8b — FOLLOW-UP po playteście Macieja NA ŚWIEŻYM BUILDZIE (Gra-podglad-ROBOCZA)
✅ Junctiony/delty: dopływy ŁADNIE łączą się w delty — I2 potwierdzone wizualnie.
❌ **Ujście nadal nie wchodzi w morze.** Do sprawdzenia w tej kolejności:
   1. Czy bundle ROBOCZA zawiera fix I3 (`buildCoastalRiverPointChain` z tIn=0.6)? Jeśli
      build starszy niż fix — najpierw rebuild.
   2. Jeśli zawiera: HIPOTEZA Y-ORDER — wstęga ujścia na `riverMouthY` może leżeć PONIŻEJ
      tafli capa Wybrzeża (`coastWaterCapTopY = seaTopY + 0.038*1.15`) → końcówka wstęgi
      chowa się POD jasnoniebieską taflą i wygląda jak ucięta na linii brzegu. Fix: końcowy
      odcinek wstęgi (ostatnie 1-2 hexy) wynieść na `coastWaterCapTopY + 0.008` i sprawdzić
      renderOrder wstęgi > capa. Zweryfikować też, że lejek delty nie ZASŁANIA wstęgi.
⚠️ **Gęstość rzek spadła za mocno** (Maciej: „dużo mniej rzek — minus"). Sieci celowo
   redukują UJŚCIA, ale nie powinny redukować POKRYCIA. Nastroić: więcej dopływów per sieć
   (tier Rzeki „Normalnie" ma dawać wizualnie zbliżoną gęstość biegów do stanu sprzed sieci;
   kręcić liczbą dopływów siatkowych, NIE liczbą ujść). Kryterium: pokrycie komórek siatki
   ≥ poprzednie, mediana długości ≥ 20, ujścia bez zmian (≤40% starych).
Wykonać RAZEM z B0.10 (poniżej) w jednym przelocie.

## B0.10 — NOWA ZASADA (Maciej, po playteście): ZAKAZ PIERŚCIENI RZECZNYCH
Rzeka nie może tworzyć zamkniętych pierścieni wokół heksów — ma płynąć PASKAMI. Jeżeli dwa
biegi idą obok siebie, jeden ma WPAŚĆ do drugiego (junction), a nie płynąć równolegle.
**Reguły implementacyjne:**
1. Ścieżka nie może zawierać ≥4 krawędzi TEGO SAMEGO heksa (zawijanie wokół heksa =
   pierścień). Wykrywać w traceRiver/injectRiverMeanders/greedy — krok tworzący 4. krawędź
   heksa jest zabroniony (wybierz inny lub zakończ bieg).
2. Dwa biegi sąsiadujące bok-w-bok przez ≥3 kolejne heksy → skróć młodszy i domknij
   junctionem do starszego (istniejący mechanizm appendJunctionDownstreamHex).
3. Test do weryfikacja-mapy: `checkNoRiverRings` — zero heksów z ≥4 oznakowanymi
   krawędziami rzeki, chyba że heks jest junctionem ≥2 ścieżek (wtedy max 4 dozwolone,
   nigdy 5-6); + zero par ścieżek równoległych ≥3 hex bez juncji.
**Status: DO WYKONANIA po weryfikacji builda przez Macieja (następny przelot subagenta).**

## STATUS — 2026-07-05 (Claude Code, Opus)
Zaimplementowano A–E. Główna przyczyna „szatkowania" (obj. 2) NIE była w danych ścieżek
(mainy i dopływy kończą `repairRiverPathAdjacency`→`sanitizeRiverPath`, więc są sąsiednie,
a każdy hex lądu jest znakowalny) — była w RENDERZE: dopływ rysowany jako osobna wstęga
kończył się w środku krawędzi P–junction, a wstęga rzeki docelowej szła po WŁASNYCH krawędziach
junction → brak wspólnego wierzchołka → wizualnie „kreska-przerwa" i „dopływ 1 hex obok"
(obj. 1+2 to ten sam defekt I2). Osierocone delty (B0.7): `computeRiverDeltaHexKeys`
i lejek `renderCoastalRiverExtension` powstawały PER-ścieżka bez filtra `main`+koniec-w-morzu.

Zmiany:
- `src/map/gen-helpers.ts`
  - `appendJunctionDownstreamHex` + `networkDownstreamNeighbor` (nowe): domykają junction —
    dopływ dostaje +1 hex wzdłuż nurtu docelowego (wspólna, JUŻ oznakowana krawędź → wspólny
    wierzchołek wstęg). Idempotentne dla `hex.rzeka.krawedzie` → dane krawędzi i hash BEZ ZMIAN.
  - `pushTributary` (obie: `generateRivers` + `topUpRiverGridCoverage`) i inline w
    `addTributariesForMainRiver`: wołają domknięcie junction (I2).
  - `checkRiverEdgeContinuity` (I1) + `checkTributaryJunctions` (I2) — nowe eksporty testowe.
- `src/render/scene.ts`
  - `pathReachesOpenSeaRender` (nowy) — brama wstęgi ujścia+lejka: TYLKO trasy realnie
    kończące w morzu (nie junction). Dopięte w dispatchu rzek (B0.7).
  - `buildCoastalRiverPointChain`: końcowy punkt wstęgi ~35-40% W GŁĄB heksa Morza (I3),
    lejek delty kotwiczy w tym samym punkcie.
- `src/render/mapRenderStyle.ts`
  - `computeRiverDeltaHexKeys`: delta WYŁĄCZNIE dla `main`+`pathReachesOpenSea`; scalanie
    ujść bliżej niż 3 hex; limit `maxHexes` liczony PER-ujście (był globalny). (B0.7 pkt 1-3)
- `tools/weryfikacja-mapy.ts`: wpięte `checkRiverEdgeContinuity` + `checkTributaryJunctions`
  jako kryteria FAIL (I1/I2), z wypisaniem pierwszego naruszenia (seed+ścieżka+indeks).

Hash mapy (terenowy, jak w weryfikacja-mapy): BEZ ZMIAN — brak nowych `rand()`, brak zmian
terenu, domknięcia junction nie dodają nowych krawędzi. `map.riverPaths` zmienia się (część
dopływów +1 hex) — to dane renderu, nie wchodzą do hasha. Jeśli test wykaże inaczej: zamrozić.
Do uruchomienia przez właściciela: tsc=0 → weryfikacja-mapy PASS (standard + super-only) →
build+publish+Ctrl+F5 → playtest wizualny (dopływy z wspólnym wierzchołkiem, biegi ciągłe,
ujścia w morzu, zero delt bez rzeki).
