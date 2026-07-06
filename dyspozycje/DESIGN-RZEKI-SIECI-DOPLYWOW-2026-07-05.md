# DESIGN (decyzja Macieja 2026-07-05): Rzeki jako sieci dopływów — mniej ujść, naturalny układ

## PILNE ZANIM COKOLWIEK: PUBLISH NIE DOSZEDŁ → **ZAMKNIĘTE 2026-07-05 ~11:45**
Audyt buildów (grep po wszystkich *.html i *.js w projekcie): **żaden bundle nie zawierał**
kodu C1/C2 (marker `civ-map-load-overlay`: 0 trafień) ani fixu B0.5. Wszystkie dzisiejsze
popołudniowe zgłoszenia Macieja (rzeki bez ujść, „woda na pustyni znowu", zwis bez paska)
to playtest na STARYM bundlu.

**Wykonano:**
1. ✅ Rebuild + publish `Gra-podglad-ROBOCZA.html` + PLAYTEST z `gra-robocza/src`
2. ✅ Przyczyna: lane kończył na `tsc`, bez `publish-robocza-bundle.ps1`
3. ✅ Strażnik: `gra-robocza/tools/verify-publish-markers.ps1` + stempel w menu (`buildInfo.ts`)

**Maciej:** Ctrl+F5 → sprawdź w menu linię `build 2026-07-05 …` przed playtestem.

---

## Decyzja projektowa (Maciej, cytat z 2026-07-05)
Zamiast wymogu „źródło rzeki co ~10×10 hex i każda rzeka do morza": rzeka ma mieć długość
~25 hex, ale MOŻE zakończyć bieg wpadając do INNEJ rzeki. Mniejsze wpadają do większych,
większe do największych — powstaje jedna główna rzeka z siecią dopływów. Mniej ujść do morza,
naturalniejszy wygląd. Reszta zasad bez zmian.

## Specyfikacja implementacji (generateRivers, gen-helpers.ts)
1. **Cel siatki fair play zostaje, ale zmienia znaczenie:** komórka N×N (tier Rzeki) musi
   zawierać DOWOLNY heks z rzeką (dostęp do wody), a NIE własne źródło z ujściem do morza.
2. **Faza 1 — rzeki główne (jak dziś, ale mniej):** na masę lądową 1 główna rzeka na
   ~4-6 komórek siatki (zamiast na każdą), trasowana do morza jak obecnie (traceRiver,
   minLen z tieru = 25 na Normalnie). To są jedyne ujścia.
3. **Faza 2 — dopływy siatkowe (NOWE; doprecyzowanie Macieja 2026-07-05):** dla komórek
   bez rzeki: trasuj od źródła do **BLIŻSZEGO z dwóch celów** — morza ALBO heksa istniejącej
   sieci rzecznej. Jeśli morze jest bliżej → normalne ujście do morza; jeśli inna rzeka
   bliżej → wpada do niej i tam kończy bieg (A* z podwójnym celem; porównanie po realnym
   koszcie trasy, nie w linii prostej). Zasady:
   - cel osiągalny tylko jeśli sieć docelowa jest (transitywnie) połączona z morzem —
     gwarancja: każda kropla spływa do oceanu;
   - długość: cel 25 hex; na wąskich lądach akceptuj krócej (jak riverGridTraceMinLen);
   - zakaz cykli: dopływ nie może wpaść do własnego biegu; junction = koniec trasy;
   - istniejąca logika addTributariesForMainRiver zostaje (to ten sam mechanizm — rozszerzyć
     o cele „dopływ do dopływu", nie tylko do main).
4. **Render (cel wizualny Macieja: „naturalne delty z małymi, średnimi i dużymi rzekami"):**
   szerokość wstęgi wg SKUMULOWANEGO przepływu (liczba biegów powyżej danego odcinka,
   rząd Strahlera lub prosty licznik dopływów): strumień 0.4× → rzeka 0.7× → główna 1.0×,
   przy czym główny nurt POSZERZA SIĘ w dół biegu (po każdym junction), a przy morzu kończy
   się deltą (istniejący lejek/fan z B0.5, skalowany szerokością nurtu). Junction domknięty
   wizualnie wspólnym wierzchołkiem (jak fix B0.5).
5. **Gameplay bez zmian:** dostęp do rzeki = hex.rzeka.krawedzie (bez różnicy main/dopływ).

## Kryteria akceptacji
1. Pokrycie: każda komórka siatki (tier Rzeki) z ≥ minLand heksów lądu zawiera heks z rzeką.
2. Spójność: 100% heksów rzecznych należy do sieci zakończonej ujściem do morza
   (test: BFS po krawędziach rzek od każdego ujścia pokrywa wszystkie heksy rzeczne).
3. Ujścia: liczba ujść do morza spada do ≤ 40% obecnej (Super Huge: z ~1000 do ~300-400).
4. Długości: mediana długości pojedynczego biegu ≥ 20 hex (Normalnie).
5. Determinizm seedów + `weryfikacja-mapy.cjs` PASS (zaktualizować test o kryterium 2).
6. Bonus wydajnościowy (spodziewany): mniej nieudanych prób „do morza" → szybszy etap rzek
   (wspiera cel B1-B4 < 60 s na Super Huge).

## Kolejność
Wdrażać PO publishu zaległych fixów i po potwierdzeniu przez Macieja playtestem, że B0.5/C1/C2
działają na świeżym bundlu — żeby nie mieszać dwóch zmian rzek w jednej iteracji.
