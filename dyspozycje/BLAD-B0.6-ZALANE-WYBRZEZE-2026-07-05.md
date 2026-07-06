# B0.6 — „Zalane wybrzeże": szeroki pas lądu renderuje się jako woda (audyt uzupełniający, 2026-07-05 po P0/P1)

## Symptom (Maciej, screeny z playtestu, mapa superogromna, TURA 1)
Po poprawkach P0 rzeki mają ujścia (B0.1 działa), ALE wzdłuż wybrzeży ciągnie się pas
(10–30 hex w głąb) jasnoniebieskich, płaskich heksów z siatką — a NA nich pływają dekoracje
lądu: drzewka, krzaki, skałki, znaczniki złóż; przez pas przechodzą też rzeki.
Z daleka pas wygląda jak płytkie morze (problem „niewidoczny"), z bliska ląd „znika pod wodą".

## Co już WYKLUCZONE (nie szukać tam)
1. Palety kolorów terenu (TERRAIN_CIV/ROBLOX/MINECRAFT, mapRenderStyle.ts:417-450) — poprawne, żaden ląd nie ma koloru wody.
2. Dekor brzegowy (buildStyleCoastWaterCap/LandCoastSandCap/BeachRing) — kładziony wyłącznie per heks Wybrzeże / 1 krawędź — nie zrobi pasa 10-30 hex.
3. Konwersje na Wybrzeże poza generatorem — brak (grep: applyCoastRing/DoubleCoastRing tylko w generator.ts przez finalizeCoastAndInlandWater).
4. Blend kolorów sąsiadów (scene.ts:324-361) — ma poprawną blokadę ląd↛woda, max lerp 0.18.
5. stripDepositsFromWater (gen-helpers.ts:5168) czyści nakladkę+złoża z Morza I Wybrzeża na końcu generacji — więc heksy z dekorem NIE powinny być wodą w danych.

## Diagnoza — dwa możliwe warianty (test rozstrzygający poniżej)

### TEST ROZSTRZYGAJĄCY (zrobić NAJPIERW, 10 sekund)
W playteście kliknąć 2-3 heksy w „zalanym" pasie i odczytać tooltip „Pole mapy":
- **Wariant A — tooltip mówi „Morze" / „Wybrzeże"** → błąd w DANYCH generatora (pas wybrzeża za szeroki + dekor na wodzie).
- **Wariant B — tooltip mówi „Łąka/Równina/Pustynia"** → błąd w RENDERZE (ląd rysowany na/pod poziomem tafli).
Dodatkowo w konsoli playtestu: `countDepositsOnWater(map.hexes)` (gen-helpers eksportuje) — musi być 0.

### Wariant A — podejrzani w generatorze (kolejność sprawdzania)
1. **`rebalanceLandSeaRatio` (gen-helpers.ts:2087)** — po fixie Morse→Morze gałąź `toFill` OŻYŁA
   (wcześniej martwa!): gdy lądu < celu, zamienia WSZYSTKIE przybrzeżne heksy morza na Łąkę
   w jednej warstwie (potencjalnie tysiące na superogromnej), potem cofa nadmiar erozją
   1 heks/pełny skan mapy. Możliwa oscylacja ląd↔morze i „poszarpany pas". Dodać limit
   wypełnienia per warstwa (np. do brakującej liczby heksów) + erozję wsadową.
2. **`applyJaggedCoastNoise` (gen-helpers.ts:2515)** — gałąź `toFill` (morze→łąka) też ożyła po
   fixie Morse. Sprawdzić zachowanie na superogromnej (noiseScale 0.28 stały — na wielkiej
   mapie daje szeroki, poszarpany front).
3. **Szerokość pierścienia Wybrzeża na wielkich mapach** — finalizeCoastAndInlandWater
   (8 wywołań × do 3 pasów × applyDoubleCoastRing) + sanitizeCoastHexes: zweryfikować
   inwariant „Wybrzeże = maks. 2 pierścienie" testem (poniżej).
4. Jeśli dekor NA wodzie w danych (countDepositsOnWater > 0): sprawdzić, czy
   `ensureDepositGridCoverage`/`ensureForestGridCoverage` (generator.ts:332,339-340) nie stawiają
   złóż/lasu na heksach Wybrzeże/Morze — i czemu strip (366) tego nie zdjął.

### Wariant B — podejrzani w renderze
1. **Wysokości stylu roblox**: `checkStyleHeights()` (mapRenderStyle.ts:202-240) — uruchomić
   i zalogować `violations` dla aktywnego stylu/jakości. Jeśli wierzchołek Łąki/Równiny
   ≤ `coastWaterCapTopY` lub ≤ seaSurfaceY → ląd pod taflą. (Precedens: Pustynia była
   podnoszona 2026-07-04 „nie zalewa morze".)
2. **seaSurfaceY** (scene.ts ~1290: „Morze/Wybrzeże: płaska tafla na wspólnym poziomie") —
   sprawdzić, czy tafla nie jest rysowana też pod lądem / ponad prismami lądu przy
   `mapDetailQuality` low/medium (robloxLite!) na wielkich mapach.
3. LOD: nakładki `styledOverlays` włączane przy zbliżeniu (scene.ts:1975) — którą grupą
   jest niebieska powierzchnia widoczna tylko z bliska?

## Kryteria akceptacji
1. Test danych (5 seedów, mapa mała + standardowa + JEDEN seed superogromnej):
   - pas Wybrzeża: żaden heks Wybrzeże nie ma odległości > 2 od najbliższego Morza;
   - `countDepositsOnWater == 0`; brak nakładki Las na Morze/Wybrzeże;
   - udział lądu w ±5 p.p. od landFraction presetu.
2. Playtest wizualny (mapa superogromna, zoom bliski): brak dekoracji/rzek „na wodzie";
   linia brzegowa czytelna; tooltip zgodny z tym, co widać.
3. `npx tsc --noEmit` = 0 po zmianach.

## WYNIK TESTU ROZSTRZYGAJĄCEGO (Maciej, 2026-07-05)
Tooltip w zalanym pasie: **„łąka" GŁÓWNIE** (część heksów może być wodą). Strefy klimatyczne
NIE są przyczyną — problem istniał przed rozpoczęciem tych prac, pojawił się po poprawkach P0.

## ✅ ROOT CAUSE ZNALEZIONY — frustum culling InstancedMesh (RENDER, scene.ts)

**Nowa obserwacja Macieja (rozstrzygająca):** przesunięcie kamery w lewo → „woda" znika
i ląd wraca. Zalanie zależy od POZYCJI KAMERY, nie od danych ani zoomu jako takiego.
Na pustyni ten sam efekt.

**Mechanizm:** w `scene.ts` NIE MA ani jednego `frustumCulled = false` (grep: 0 trafień),
a pryzmy terenu to `THREE.InstancedMesh` (scene.ts:1078, po jednej siatce na typ terenu;
analogicznie dekor instancyjny: forest/snow/shrub/peak/hillBump/beach/dune/oasis,
linie 1093-1172). Three.js cullinguje InstancedMesh po bounding sphere GEOMETRII
(jeden heks o promieniu ~R przy origin 0,0,0) — NIE uwzględnia pozycji instancji.
Gdy okolica rogu mapy (q=0,r=0) wypada poza kadr — co przy przybliżeniu jest normą —
silnik wycina CAŁĄ siatkę pryzm danego terenu na całej mapie:
- ląd znika → widać tło głębokiego oceanu (`oceanMesh` + backdrop) = „zalanie";
- panning tak, by róg mapy wrócił w kadr → siatka wraca = „woda zniknęła";
- pełne oddalenie (cała mapa w kadrze) → zawsze OK;
- przy zbliżeniu dekor to `styledOverlays` (grupy per-heks z poprawnymi otoczkami) →
  drzewka/złoża/wzgórza NIE są wycinane i „pływają" na tle wody;
- tooltip czyta dane (Łąka/Pustynia) — dane są poprawne.

**NAPRAWA (mała, deterministyczna):** po utworzeniu KAŻDEGO `InstancedMesh` w scene.ts
ustawić `mesh.frustumCulled = false;`
— minimum: pętla pryzm terenu (~1078) + wszystkie meshe dekoru instancyjnego (1093-1172).
Alternatywa (opcjonalna optymalizacja później): ręcznie ustawić
`geometry.boundingSphere = new THREE.Sphere(środekMapy, promieńMapy)` per siatka.
Sprawdzić też inne sceny (robloxScene/minecraftScene/battle*) pod ten sam wzorzec.

**Kryterium akceptacji:** przy dowolnym zoomie i panningu ląd nigdy nie znika;
brak „pływających" dekoracji; FPS bez regresu zauważalnego (mapa superogromna).

## Hipoteza wcześniejsza (do sprawdzenia PO fixie renderu, niższy priorytet) — dosypywanie lądu
Fix B0.3 (Morse→Morze) OŻYWIŁ martwe dotąd gałęzie, które teraz masowo zamieniają
przybrzeżne morze na Łąkę:
- `applyLandFractionByContinent` (gen-helpers.ts:1999, pętla z isCoastalMorseHex ~2107) —
  dosypuje ląd per kontynent aż do celu landFraction, PIERŚCIEŃ PO PIERŚCIENIU wokół brzegu;
- `rebalanceLandSeaRatio` (2087) — to samo globalnie, maxLayers = √(w·h) (≈565 warstw na superogromnej!);
- `applyJaggedCoastNoise` toFill (2538).
Przed fixem te gałęzie nic nie robiły (isCoastalMorseHex zawsze false) → mapa miała mniej
lądu niż cel, ale czyste brzegi. Po fixie: wokół każdego kontynentu narasta szeroki,
płaski „szelf" świeżej Łąki (landScore≈0), na który potem: coast-ring nakłada Wybrzeże,
fair-play siatki kładą złoża/las, a rzeki są przez niego trasowane. Wizualnie pas czyta się
jako zalany ląd (jasnoniebieskie Wybrzeże + zielone łaty Łąki + dryfujący dekor + rzeki).

**Weryfikacja hipotezy (szybka):** w teście generatora policzyć po generacji:
(a) udział lądu vs cel landFraction; (b) liczbę heksów Łąki, których landScore < 0.05
(świeżo dosypane z morza) — jeśli tysiące w pasie przybrzeżnym → potwierdzone.

**Kierunek naprawy:**
1. Ograniczyć dosypywanie: wypełniać TYLKO do brakującej liczby heksów (nie całe pierścienie),
   wybierać kandydatów wg landScore (najwyższy wynik najpierw — jak applyLandFractionByScore),
   maks. 2-3 warstwy od pierwotnego brzegu; potem STOP nawet poniżej celu.
2. Po każdym dosypaniu: finalizeCoast + ponowna walidacja, ale PRZED złożami/lasem/rzekami
   (kolejność już OK w pipeline — dosypywanie jest wcześnie; upewnić się, że nic nie dosypuje po 3f).
3. Rozważyć: cel landFraction egzekwowany miękko (±5 p.p.) zamiast twardo na wielkich mapach.
Sekundарnie (jeśli po powyższym zostają zalane heksy Łąki): sprawdzić `checkStyleHeights()`
i ukrywanie pryzmów wody vs stan hexTeren (scene.ts:2037-2045).

## B0.5 — ✅ ROOT CAUSE ZNALEZIONY: render tnie rzekę na 2 segmenty o RÓŻNYCH kotwicach
Objaw (playtest Macieja, po fixie cullingu): rzeka urywa się 1-2 heksy przed brzegiem,
delta/tafla przy morzu wisi osobno — brak połączenia. Dane rzek są POPRAWNE (pathEndsAtSea).

**Mechanizm (kod):** główna rzeka rysowana jest jako DWA niezależne kawałki:
1. `landRiverRenderPath` (gen-helpers.ts:3026) — idzie po ścieżce od źródła i **`break` na
   PIERWSZYM heksie Wybrzeże/Morze** (3033) → wstęga lądowa kończy się na ostatnim suchym heksie.
2. `coastalRiverRenderPath` (gen-helpers.ts:3044) — szuka kotwicy **od KOŃCA ścieżki wstecz
   do OSTATNIEGO Wybrzeża** (3050-3056) i rysuje [kotwica..koniec] (+1 heks lądu przez unshift).
Ścieżki ujścia często PRZEPLATAJĄ ląd i Wybrzeże (korytarz ujścia z finishRiverMouthAtSea
dopuszcza ląd przy brzegu): path = […L1 L2 W1 L3 W2…]. Wtedy segment lądowy kończy się na L2
(break na W1), a przybrzeżny zaczyna dopiero od L3/W2 — **heksy pomiędzy NIE SĄ rysowane = dziura**.
3. Dodatkowo segment przybrzeżny w ogóle powstaje tylko gdy `pathNearCoast(map, path)`
   (scene.ts:450-452) — jeśli bramka nie zadziała, ujście nie jest rysowane wcale.

**Naprawa (wybrać 1 — zalecana A):**
A. Rysować JEDNĄ ciągłą wstęgę: w `landRiverRenderPath` NIE przerywać na Wybrzeżu — pomijać
   wyłącznie heksy Morze; Y przejścia ląd→ujście już działa (`riverHexSurfaceY`: Wybrzeże →
   riverMouthY, scene.ts:696-699). Osobny pass przybrzeżny zostawić tylko dla lejka delty
   (funnel), zakotwiczonego na OSTATNIM heksie wstęgi.
B. Jeśli zostają 2 segmenty: oba muszą dzielić WSPÓLNY heks łączenia — kotwicą przybrzeżnego
   ma być PIERWSZE Wybrzeże ścieżki (to samo, na którym urywa się segment lądowy), nie ostatnie;
   bramkę `pathNearCoast` usunąć dla kind='main' (dane gwarantują ujście).
Sprawdzić też widoczność coastal-segmentów w LOD (scene.ts ~1958-1969) — mają podlegać
`zoomFlags.rivers`, bez dodatkowych warunków.

**Kryterium akceptacji:** na LOD 0-2 każda główna rzeka ma ciągłą linię od źródła do
tafli/delty (zero przerw); wizualnie potwierdzić na mapie standard i Super Huge (typ ziemia
i kontynenty).

## B0.7 — PUSTE ODPŁYWY: delty bez podłączonej rzeki (playtest Macieja, po wdrożeniu sieci dopływów)
**Objaw (screen):** wzdłuż wybrzeża wiele dekoracji ujścia (jasnoniebieski heks + piasek +
ciemny lejek), do których NIE dochodzi żadna wstęga rzeki; zdarza się też „X" dwóch wstęg
w jednym ujściu. Rzeki, które wpadają do innych rzek, MIMO TO dostają własną deltę na brzegu.

**Przyczyna (mechanizm):** dekor ujścia (przedłużenie do morza z `buildRiverMouthSeaExtension`
+ lejek + `computeRiverDeltaHexKeys`/`riverMouthEdgeKeys`) jest generowany PER ŚCIEŻKA dla
wszystkich rzek, zamiast wyłącznie dla ścieżek, które faktycznie kończą bieg w morzu.
Dopływ kończący na junction z inną rzeką nie powinien mieć żadnego własnego ujścia.

**Naprawa:**
1. Kwalifikacja ujścia: delta + lejek + przedłużenie do morza WYŁĄCZNIE gdy ścieżka
   (po ewentualnym przedłużeniu) spełnia `pathEndsAtSea` i jej ostatni hex jest przy
   oceanie. Ścieżka zakończona junction (wpada do innej rzeki) → koniec na junction,
   zero dekoru brzegowego.
2. `computeRiverDeltaHexKeys` liczyć z LISTY ZAKWALIFIKOWANYCH ujść (pkt 1), nie ze
   wszystkich riverPaths.
3. Anty-kolizja ujść: dwa ujścia bliżej niż ~3 heksy → scalić do jednego (wspólna delta)
   albo odsunąć — usuwa „X" wstęg w jednej delcie.
4. Test automatyczny (dopisać do weryfikacja-mapy): każdy heks-delta musi być ostatnim
   hexem (lub sąsiadem ostatniego hexa) ścieżki spełniającej pathEndsAtSea; liczba delt
   == liczba zakwalifikowanych ujść. 0 delt osieroconych na 5 seedach × 4 typy.
**Kryterium akceptacji (wizualne):** każda delta na mapie ma dochodzącą wstęgę; rzeki
kończące w innej rzece nie zostawiają śladów na wybrzeżu.

## Kontekst
- Zbiega się w czasie z aktywnym taskiem „MAPA strefy klimat A wąski" — jeśli lane MAPA
  zmienia klasyfikację terenu przybrzeżnego, skoordynować (nie dublować fixów).
- Test akceptacyjny generatora: `gra-robocza/tools/weryfikacja-mapy.ts` (audyt) — rozszerzyć
  o metryki z pkt 1 (szerokość pasa Wybrzeża, dekor na wodzie).
