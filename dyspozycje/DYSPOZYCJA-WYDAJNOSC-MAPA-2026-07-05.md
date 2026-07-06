# DYSPOZYCJA: Wydajność mapy — FPS, szybsza generacja Super Huge, ekran ładowania (2026-07-05)

Zlecenie Macieja: (A) płynność ruchu po mapie, zwłaszcza przy oddaleniu; (B) szybsza generacja
mapy, zwłaszcza Super Huge (dziś kilka minut); (C) panel ładowania — gracz ma widzieć postęp,
a przeglądarka nie może wyświetlać „strona nie odpowiada".
Stan zastany zweryfikowany w kodzie (audyt zewn.). Super Huge = 672×476 = ~320 000 heksów (16× standard).

---

## C. EKRAN ŁADOWANIA + WEB WORKER (zrobić NAJPIERW — usuwa „zwis" niezależnie od tempa)

**Stan:** `generujSwiat()` woła się SYNCHRONICZNIE na głównym wątku (main.ts:9038 nowa gra;
9197/9415/9573 playtesty). Przy Super Huge blokuje UI na minuty → dialog „strona nie odpowiada".
Brak Web Workera w projekcie (grep: 0 użyć do generacji).

**C1. Web Worker dla generatora.** Generator jest czystym TS bez DOM — nadaje się wprost.
- Nowy plik `src/map/genWorker.ts`: przyjmuje `{seed, rozmiar, typ, genOpts}`, woła `generujSwiat`,
  odsyła wynik. Vite: `new Worker(new URL('./map/genWorker.ts', import.meta.url), { type: 'module' })`.
- `generateMap()` dostaje opcjonalny callback `onProgress(faza: string, pct: number)` wywoływany
  między przebiegami (nazwy faz PL: „Kształt kontynentów", „Wybrzeża", „Ukształtowanie i lasy",
  „Złoża", „Rzeki", „Pozycje startowe"). Worker przekazuje to przez `postMessage` (throttling ~10/s).
- Wynik wraca structured clone (1-2 s przy Super Huge — akceptowalne; optymalizacja transferables
  = etap 2, tylko jeśli będzie potrzeba).
- Fallback (gdyby worker sprawiał kłopoty w build): generacja na main thread, ale z `await`
  (yield `setTimeout(0)`) między fazami — UI nie zamarza całkiem; preferowany jest worker.

**C2. Panel ładowania (UI).** Overlay modalny nad grą przy nowej grze/regeneracji:
pasek postępu + nazwa fazy + seed + rozmiar; animacja CSS (kręci się płynnie, bo main thread
wolny); blokada inputu; po błędzie workera — komunikat i przycisk „Spróbuj ponownie".
Styl spójny z Brand Bookiem menu.

**Kryterium akceptacji C:** przy generacji Super Huge główny wątek nigdy nie jest zablokowany
> 200 ms (test: animacja spinnera nie przycina), zero dialogów przeglądarki, pasek postępu
idzie przez wszystkie fazy.

**C2b — szlif „widać, że żyje" (feedback Macieja po pierwszym publishu, 2026-07-05):**
Overlay działa, ale na Super Huge pierwsza faza trwa długo i pasek wygląda na zawieszony.
1. Sub-progres w długich fazach: raportować pct co ~5% wewnątrz fazy (np. co N wierszy
   pętli terenu, co etap pipeline'u wybrzeży), nie tylko na granicach faz.
2. Licznik czasu na overlayu: „upłynęło: 1:23" tykający co sekundę (niezależny dowód,
   że nic nie wisi) + numer fazy „3/7".
3. Po 100% generacji NIE chować overlaya do pierwszej klatki mapy (patrz C3) — inaczej
   po pasku wróci pozorny „zwis" na budowie sceny.
4. Czytelniejsza metryczka (Maciej pomylił seed z liczbą heksów): zamiast
   „Seed 508711 · Super Huge · Ziemia" → „Ziarno mapy: 508711 · Super Huge
   (336×238 · ~80 tys. heksów) · Ziemia".

---

## C3. ETAP 2 ŁADOWANIA: budowa sceny 3D też blokuje main thread ⬅ NOWE (playtest Macieja 2026-07-05)

**Objaw:** Super Huge, klik „Rozpocznij grę" → generacja w workerze OK, ale potem Chrome
pokazuje „Strona nie odpowiada" przy wciąż widocznym kreatorze — bez overlaya.
**Przyczyna (potwierdzona w kodzie):** `main.ts:9063` — `loading.hide()` wykonuje się OD RAZU
po `generujSwiatAsync`, a następnie `buildScene(map,…)` (`main.ts:9070`) buduje CAŁĄ scenę
(setki tysięcy macierzy instancji, styledOverlays lasów per heks, meshe rzek, minimapa)
JEDNYM synchronicznym blokiem na głównym wątku → wielosekundowa blokada = dialog przeglądarki.

**Naprawa:**
1. `loading.hide()` przenieść ZA pierwszą wyrenderowaną klatkę mapy (pierwszy rAF pętli
   renderu) — overlay ma zakrywać także budowę sceny; dodać fazę „Budowanie świata 3D" z pct.
2. `buildScene` → `buildSceneAsync` z porcjowaniem (yield `await new Promise(r=>setTimeout(r,0))`
   albo `scheduler.yield()` co ~10-20 tys. heksów / co etap):
   teren (0-40%) → dekor/styledOverlays (40-75%) → rzeki (75-90%) → minimapa/fog/renderery (90-100%).
   Każda porcja < 50 ms. Wywołania w main.ts (9070 i pozostałe buildScene) na `await`.
3. Tą samą fazą objąć `UnitRenderer`/`CityRenderer`/init fog po buildScene (9086-9092).
**Kryterium akceptacji:** Super Huge: overlay widoczny NIEPRZERWANIE od kliknięcia do pierwszej
klatki mapy; main thread bez bloków > 200 ms; zero dialogów „Strona nie odpowiada".
UWAGA: nie zmieniać kolejności rand() — porcjowanie nie może zmienić WYNIKU budowy (determinizm).

---

## B. SZYBSZA GENERACJA (Super Huge z minut do kilkunastu sekund)

**Stan po P0:** `pathEndsAtSea` dostaje już `oceanConnected` (3896/4576/4693 ✅ — to dało
standard 26 s → 4,4 s). Zostały (wg profilu CPU i odczytu kodu):

**B1. `sanitizeCoastHexes` (gen-helpers.ts:2253) — NADAL O(n²).** Pętla `while(propagated)`
(linia ~2270) skanuje CAŁĄ mapę w każdej rundzie propagacji. Na 320k heksów × długie łańcuchy
wybrzeża = dominujący koszt. Zamienić na BFS z kolejką startującą od heksów „valid"
(identyczna semantyka, O(n)). To był #2 na profilu CPU (12,5% już przy małej mapie).

**B2. Pipeline w generator.ts — redundantne pełne przebiegi.** `finalizeCoastAndInlandWater` ×8,
`purgeInlandWaterForMultiLandTyp` ×7, `enforceMapBorderOcean` ×5, każdy = kilka pełnych skanów.
Wprowadzić licznik zmian: każda funkcja zwraca liczbę zmienionych heksów (większość już zwraca);
jeśli poprzedni przebieg fazy dał 0 zmian — pomiń kolejne powtórzenie tej samej funkcji
w bloku. UWAGA determinizm: NIE ruszać kolejności wywołań `rand()` — pomijać wolno tylko
funkcje, które nie pobierają rand() (czyszczenia/finalize tak — nie losują).

**B3. `rebalanceLandSeaRatio` (2087) — erozja nadmiaru 1 heks / pełny skan mapy.**
Pętla `while (land > targetLand)` szuka najlepszego kandydata skanem całej mapy per JEDEN heks.
Zamienić na: zbierz wszystkich kandydatów raz, posortuj po score, eroduj wsadowo do celu,
odśwież kandydatów tylko przy wyczerpaniu listy.

**B4. A* rzek (`aStarRiverToSea`, 3500) — open-set skanowany liniowo** przy zdejmowaniu minimum.
Na długich drenażach dużej mapy → kwadratowo. Podmienić na prostą kopiec-min (binary heap).

**B5 (etap 2, największy zysk strukturalny).** Gorące przebiegi (flood-fille, pola odległości,
klasyfikacje) operują na kluczach stringowych `"q,r"` (hexKey/parseHexKey — miliony konkatenacji
i split(',') + GC). Wprowadzić wewnętrzny bufor `Uint8Array`/`Int32Array` indeksowany `r*w+q`
dla fazy generacji i konwersję do `Record<string,Hex>` raz, na końcu. Oczekiwane 5-10× na
Super Huge. Wykonać dopiero po B1-B4 i po zamrożeniu testem determinizmu.

**Kryterium akceptacji B:** Super Huge (672×476): < 60 s po B1-B4; < 20 s po B5.
Determinizm: dla seedów 42/123/777 hash mapy (posortowane `key:teren`) identyczny przed i po
każdej zmianie. Standard bez regresu (≤ 5 s). Test: `tools/weryfikacja-mapy.ts` + dodać wariant super.

---

## A. PŁYNNOŚĆ RUCHU PO MAPIE (zwłaszcza oddalenie, Super Huge)

**A1. Rzeki = setki osobnych meshy → draw calle.** Każda rzeka ma własne `waterMesh`+`bankMesh`
(+funnel u ujścia); na Super Huge to tysiące draw calli, a `zoomLodFlags.rivers === true` na
KAŻDYM poziomie LOD (zoomLod.ts — nawet level 4). Dwa kroki:
  a) szybki: na LOD 3-4 ukrywać rzeki (przy pixelRatio 0,35 i tej skali są ledwo widoczne) —
     zmiana w zoomLod.ts (`rivers: false` dla 3 i 4) + istniejące przełączanie w scene.ts;
  b) docelowy: scalić geometrie wszystkich rzek do 1-3 `BufferGeometry` (merge; są statyczne,
     w world-space) — draw calle spadają z tysięcy do kilku niezależnie od LOD.

**A2. `setFog`/aktualizacja instancji — pilnować „dirty set".** Pętla po WSZYSTKICH heksach
(setColorAt + setMatrixAt + needsUpdate) kosztuje przy 320k instancji. Upewnić się, że wykonuje
się wyłącznie przy zmianie widoczności/tury (nie per klatka / nie per ruch kamery) i przerabiać
tylko heksy, którym stan faktycznie się zmienił (zbiór zmian zamiast pełnej pętli).

**A3. Po hotfixie B0.6 (`frustumCulled = false`)** wszystkie instancje rysują się zawsze — przy
oddaleniu bez zmian (i tak widać całość), przy zbliżeniu GPU przetwarza całą mapę. Docelowe
rozwiązanie (etap 2, zamyka też B0.6 elegancko): **chunking** — InstancedMesh per typ terenu
per segment mapy (np. 32×32 heksy) z poprawnie ustawionym `boundingSphere` środka segmentu.
Culling zaczyna działać POPRAWNIE per segment: przy zbliżeniu rysuje się tylko widoczny wycinek
(duży zysk FPS z bliska), przy oddaleniu koszt jak dziś. Dekor instancyjny — ten sam podział.

**A4. Diagnostyka pod rękę:** debug-overlay (klawisz, np. F9): FPS, `renderer.info.render.calls`,
liczba widocznych instancji/grup. Bez tego nie da się rzetelnie mierzyć A1-A3.

**A5. ⬅ PRIORYTET (playtest Macieja, Super Huge, 2026-07-05 wieczór): 4-5 s lagu przy KAŻDEJ
akcji** — pan/zoom, założenie miasta, zmiany w mieście. Symptom wskazuje pełnomapowe
przeliczenia per akcja, nie koszt klatki:
1. `setFog` po każdej akcji iteruje WSZYSTKIE ~80k heksów (setColorAt + setMatrixAt +
   needsUpdate na 7 siatkach → pełny re-upload buforów instancji na GPU). Zmierzyć
   (console.time wokół setFog) i przejść na DIRTY-SET: aktualizować wyłącznie heksy,
   którym zmieniła się widoczność/kolor (akcja miasta zmienia promień ~5-10 hex, nie 80k).
2. Założenie miasta: sprawdzić, co jeszcze leci po całej mapie (granice/territory,
   minimapa — przerysowanie 80k pikseli?, culture/religion overlay). Wszystko ograniczyć
   do promienia zmiany albo przenieść do idle-callbacku.
3. needsUpdate ustawiać TYLKO na siatkach, w których faktycznie coś się zmieniło
   (touchedMeshes już istnieje w kodzie — egzekwować).
**Kryterium akceptacji A5:** założenie miasta / zmiana w mieście / pan na Super Huge
< 100 ms reakcji; console.time(setFog) po akcji < 30 ms.

**Kryterium akceptacji A:** Super Huge, sprzęt Macieja: pan/zoom przy pełnym oddaleniu płynny
(cel ≥ 40 FPS), przy zbliżeniu ≥ 30 FPS; draw calle przy oddaleniu < 200 (dziś: tysiące przez rzeki).

---

## Kolejność wykonania (zalecana)
1. **C1+C2** (worker + panel) — od razu znika „zwis" i dialogi przeglądarki, nawet zanim generator przyspieszy.
2. **B1-B4** — Super Huge < 60 s.
3. **A1a + A2 + A4** — szybkie zyski FPS.
4. **A1b, A3 (chunking), B5** — etap 2, po playtestach powyższych.

Przy KAŻDEJ zmianie: `npx tsc --noEmit` = 0 oraz test determinizmu seedów (hash mapy).
