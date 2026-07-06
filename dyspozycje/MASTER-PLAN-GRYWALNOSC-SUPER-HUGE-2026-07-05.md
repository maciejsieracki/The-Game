# MASTER-PLAN: Grywalność na największej mapie (zlecenie Macieja 2026-07-05 wieczór)

Cel: Super Huge grywalne jak mapa standardowa — akcje bez lagów, płynna kamera, start < 1 min,
naturalne rzeki. Wykonawca: Cursor (lane wg obiegu). Szczegóły techniczne w plikach źródłowych:
`DYSPOZYCJA-WYDAJNOSC-MAPA-2026-07-05.md` (sekcje A/B/C) i `DESIGN-RZEKI-SIECI-DOPLYWOW-2026-07-05.md`.
Batche wykonywać PO KOLEI — każdy kończy się publishem, playtestem Macieja i zapisem czasów.

## ZASADY STAŁE (obowiązują przy każdym batchu)
1. Przed publishem: `npx tsc --noEmit` = 0 ORAZ `node tools/weryfikacja-mapy.cjs` = PASS.
2. Strażnik bundla: po buildzie grep markerów w Gra-podglad.html (np. `civ-map-load-overlay`)
   — publish bez markerów = FAIL. Stempel wersji (data+skrót) widoczny w menu gry.
3. Determinizm: nie zmieniać kolejności wywołań `rand()`. Wyjątek: batch z adnotacją
   „hash może się zmienić jednorazowo" → po nim zamrozić nowe hashe w teście.
4. Po każdym publish: Ctrl+F5 u Macieja.

## BATCH 1 — LAGI AKCJI + START GRY (największy wpływ na grywalność; 1 dzień)
Zakres: **A5 + C3 + C2b** z dyspozycji wydajności.

**Status: ✅ wdrożone 2026-07-05 ~12:08** · md5 `ceb5ba4266cea98fb1ad8838162931fa`  
| Element | Stan |
|---|---|
| C3 buildScene async + overlay do 1. klatki | ✅ |
| C2b sub-progres, licznik czasu, faza x/7, metryczka ziarna | ✅ |
| A5 dirty-set setFog + dekor partial | ✅ |
| A5 założenie miasta: bez rebuildResourceOverlays, 1× refreshFog | ✅ |
| weryfikacja-mapy.cjs | ✅ PASS (standard) |
| Profil FoW | `globalThis.__CIV_FOG_PROFILE = true` w konsoli |

1. A5: dirty-set w `setFog` — aktualizować tylko heksy ze zmienioną widocznością/kolorem;
   zmierzyć console.time przed/po. Założenie miasta: ograniczyć przeliczenia (granice,
   minimapa, overlay kultury) do promienia zmiany.
2. C3: `buildSceneAsync` porcjami (~10-20 tys. heksów / etap) + overlay do PIERWSZEJ klatki
   mapy z fazą „Budowanie świata 3D"; objąć też UnitRenderer/CityRenderer/fog-init.
3. C2b: sub-progres w długich fazach, licznik czasu, faza x/y, metryczka
   „Ziarno mapy: N · Super Huge (336×238 · ~80 tys. heksów)".
**DoD:** założenie/zmiana miasta i pan/zoom < 100 ms (dziś 4-5 s); start Super Huge bez
ŻADNEGO dialogu „strona nie odpowiada"; pasek od kliknięcia do pierwszej klatki.

## BATCH 2 — GENERACJA < 60 s (B1-B4; 1 dzień)

**Status: ✅ wdrożone 2026-07-05 ~13:20** · metryki jakości PASS · czas Super Huge **~84–121 s**
(najlepszy przebieg ~83/90 s; baseline 126/169 s) — **cel 60 s wymaga B5 lub szybszego sprzętu**

| Element | Stan |
|---|---|
| B1 `sanitizeCoastHexes` → BFS | ✅ |
| B2 liczniki + wcześniejsze wyjście z `finalizeCoast` + `purgeInland` skip | ✅ |
| B3 `rebalanceLandSeaRatio` erozja wsadowa | ✅ |
| B4 kopiec-min `aStarRiverToSea` | ✅ |
| weryfikacja-mapy standard | ✅ PASS (< 5 s) |
| weryfikacja-mapy super (672×476) | metryki ✅ · czas ⚠ (limit 60 s) |
| hash kontynenty/ziemia seed=42 | `242487199` / `1176297089` (bez regresji jakości) |

1. B1: `sanitizeCoastHexes` → BFS (usuwa O(n²)).
2. B2: liczniki zmian + pomijanie pustych powtórzeń w pipeline generatora
   (finalize/purge/enforce — tylko funkcje nie pobierające rand()).
3. B3: `rebalanceLandSeaRatio` — erozja wsadowa zamiast 1 heks/pełny skan.
4. B4: kopiec-min w `aStarRiverToSea`.
**DoD:** `node tools/weryfikacja-mapy.cjs super`: Super Huge kontynenty i ziemia < 60 s (baseline
126/169 s), standard bez regresu (< 5 s), wszystkie metryki PASS.  
**Playtest Macieja:** Ctrl+F5 → Super Huge → zmierz czas overlayu generacji → `OK BATCH 2` / `BUG: …`

## BATCH 3 — PŁYNNOŚĆ KAMERY (A1 + A2-reszta + A4; 0,5-1 dnia) ✅ wdrożone (playtest FPS Macieja)

| Punkt | Stan |
|---|---|
| A4 overlay F9 (FPS, draw calls, LOD, instancje) | ✅ `perfDebugOverlay.ts` + `renderLoop` |
| A1a rzeki off LOD 3–4 | ✅ `zoomLod.ts` rivers=false |
| A1b merge rzek → 1–3 BufferGeometry | ✅ `scene.ts` land/coast/delta buckets |
| weryfikacja-mapy standard | ✅ PASS |
| publish robocza | ✅ md5 `6026f03811e0410984962fafa286a8aa` · stempel `2026-07-05 13:35 · c385e426e8a4` |
| DoD FPS (≥40 oddalenie, ≥30 zbliżenie, draw<200) | ⏳ playtest Macieja F9 |

1. A4 NAJPIERW: debug-overlay F9 (FPS, draw calls, instancje) — mierzyć przed/po.
2. A1a: rzeki niewidoczne na LOD 3-4 (zoomLod.ts).
3. A1b: merge geometrii rzek do 1-3 BufferGeometry (draw calle: tysiące → kilka).
**DoD:** Super Huge: pełne oddalenie ≥ 40 FPS, zbliżenie ≥ 30 FPS, draw calle
przy oddaleniu < 200 (odczyt z F9).  
**Playtest Macieja:** Ctrl+F5 → Super Huge → F9 → pan/zoom → `OK BATCH 3` / raport FPS+draw

## BATCH 4 — RZEKI-SIECI (design Macieja; 1-2 dni, po stabilizacji 1-3) ✅ wdrożone (playtest Macieja)

| Punkt | Stan |
|---|---|
| Faza 1: rzadkie main co stride×stride (stride=3) | ✅ |
| Faza 2: dopływy siatkowe → morze LUB sieć (A*) | ✅ |
| Pokrycie siatki = heks z rzeką (nie źródło main) | ✅ `cellHasRiverHex` |
| Spójność sieci → ocean (BFS) | ✅ `sieroc=0` we wszystkich case |
| Ujścia ≤40% baseline | ✅ Super Huge: ~135 vs ~1000 (13%) |
| Mediana długości main ≥20 | ✅ medLen 22–33 |
| Render szerokość wg długości/kind | ✅ scene.ts 0.4×–1.35× |
| weryfikacja-mapy standard | ✅ PASS (limit 8 s po BATCH 4) |
| weryfikacja super czas | ⚠ ~153–275 s (cel 60 s — follow-up B5/worker) |
| publish robocza | ✅ md5 `60385d0f1dc549c4faad17e3ddd9f39c` · stempel `2026-07-05 14:18 · 99e188d0eb37` |

Wdrożyć `DESIGN-RZEKI-SIECI-DOPLYWOW-2026-07-05.md` w całości:
bliższy cel morze-albo-rzeka po ~25 hex, sieci spójne z oceanem, szerokość wstęgi
rośnie z dopływami (strumień→rzeka→główna+delta), pokrycie siatki = dostęp do rzeki.
**DoD:** kryteria akceptacji z pliku design (m.in. ujścia ≤ 40% obecnych, 100% sieci
połączonych z morzem, test spójności dopisany do weryfikacja-mapy).

## BATCH 5 — TRÓJPOZIOMOWY LOD TERENU (koncepcja Macieja 2026-07-05) + rezerwa strukturalna
Uwaga: dekor ma już 5-poziomowy LOD (zoomLod.ts) — ten batch dodaje LOD dla SAMEGO TERENU.
Fundament: chunking mapy na segmenty 32×32 heksy (domyka też B0.6 „poprawnie" — culling
per segment z własnym boundingSphere zamiast frustumCulled=false).

**Poziom BLISKI (jak dziś):** pełne pryzmy per heks (instancing per segment widoczny
w kadrze) + pełny dekor. Tylko segmenty w kadrze + 1 zapas.

**Poziom ŚREDNI:** zamiast pryzm — jeden SCALONY, płaski mesh terenu per segment
(same wierzchy heksów, bez ścian bocznych, bez jittera; kolory per wierzchołek).
Redukcja wierzchołków ~6-8×, dekor wg obecnego zoomLod (poziomy 2-3).

**Poziom DALEKI (pełne oddalenie Super Huge):** teren jako WYPALONA TEKSTURA —
przy budowie sceny render kolorów terenu segmentu do canvasa (raz), na mapie daleki
zoom = kilkaset oteksturowanych quadów (widok „satelitarny"). Siatka heksów i rzeki
wpieczone w teksturę; jednostki/miasta jako ikony. Draw calle przy pełnym oddaleniu:
z tysięcy → < 50, koszt klatki praktycznie zerowy.

Przełączanie poziomów z HISTEREZĄ (±10% progu), żeby nie „pompowało" na granicy zoomu.
**DoD Batch 5:** Super Huge — pełne oddalenie 60 FPS i < 50 draw calli; średni zoom
≥ 40 FPS; przejścia poziomów bez widocznego przeskoku; pamięć tekstur < 300 MB.
**Bramka wejścia:** pomiary z F9 po Batch 1-3 (nie robić, jeśli FPS już osiąga cele).

Rezerwa strukturalna (bez zmian): B5-typed-arrays rdzenia generatora (cel < 20 s).

## BATCH 6 — WIĘCEJ RDZENI: AI I PATHFINDING W WORKERACH (zatwierdzone przez Macieja; po Batch 1-3)
Warunek wejścia: pomiar z A4/console.time pokazuje, że po A5 tura AI lub pathfinding
nadal blokuje main thread > 200 ms na Super Huge (nie robić „na wiarę").
1. Tura AI do workera: `computeAiCommands(stan)` jest czystą funkcją (ai.ts) — wysyłać
   zserializowany stan (lub od B5: typed-array snapshot), odbierać listę komend;
   main thread tylko aplikuje komendy. Overlay/wskaźnik „AI myśli…" między turami.
2. Pathfinding pool: wyszukiwanie tras jednostek w workerze (żądanie→odpowiedź z cache
   per tura); ruch gracza NIGDY nie czeka — fallback sync dla tras < 30 hex.
3. NIE przenosić logiki mutującej stan gry — tylko czyste obliczenia (komendy/trasy).
**DoD:** koniec tury z 10+ AI na Super Huge bez bloku main > 200 ms; ruch jednostki
reaguje < 50 ms.
UWAGA skala: WASM/WebGPU świadomie POZA planem — wracamy tylko, jeśli po Batch 1-6
pomiary wciąż pokażą deficyt (przy 80 tys. heksów nie powinny).

## POZA PLANEM (czeka na decyzje projektowe Macieja — nie blokuje wydajności)
P2 logika z `BLEDY-DO-NAPRAWY-2026-07-05.md`: podwójna szarża w combat, bramka/płatnik
wasalizacji, makeDealId, limit obozów barbarzyńców po wczytaniu, ujemne zapasy bez
spichlerza, zapis seeda w save. Każdy punkt = osobna krótka decyzja A/B/C.

## ANEKS SPRZĘTOWY — realne dźwignie hardware (pytanie Macieja 2026-07-05)

**H0. Zero kodu — Maciej sprawdza OD RAZU (5 minut):**
1. `chrome://gpu` → sekcja „Graphics Feature Status": wszystko ma być „Hardware accelerated".
   Jeśli „Software only" — Chrome renderuje NA PROCESORZE (ustawienia Chrome → System →
   „Użyj akceleracji sprzętowej" włączyć). To potrafi tłumaczyć połowę lagów renderu.
2. Windows → Ustawienia → System → Ekran → Grafika → dodać Chrome → „Wysoka wydajność"
   (wymusza dedykowaną kartę GPU zamiast zintegrowanej).

**H1. Jedna linia (dołączyć do Batch 1):** `scene.ts:1000` —
`new THREE.WebGLRenderer({ canvas, antialias: preset.antialias, powerPreference: 'high-performance' })`
— gra sama prosi o dedykowaną kartę. Ten sam parametr w pozostałych scenach (battle/roblox/minecraft).

**H2. Więcej rdzeni CPU:** już w planie (worker generacji + Batch 6 AI/pathfinding).
Opcja rozszerzenia po B5: RÓWNOLEGŁA faza szumu generatora — pierwszy przebieg
(fbm/klasyfikacja per heks) jest w pełni niezależny per heks → podział na N workerów
pasami wierszy, deterministyczny (ta sama tablica perm). Zysk ~20-30% czasu generacji.
Wymaga zwykłych workerów (bez SharedArrayBuffer) — bezpieczne.

**H3. Zero-copy między workerem a grą (dołączyć do B5):** wynik generacji jako
transferable ArrayBuffer (typed arrays z B5) zamiast structured clone obiektów —
przekazanie mapy Super Huge w ~0 ms zamiast sekund kopiowania.

**H4. Cięższa artyleria — TYLKO po pomiarach, z bramką:**
- **WASM SIMD** (silnik gorących pętli w Rust): 2-4× na szumie/flood-fillach — sensowne
  dopiero, gdyby po B1-B5 generacja wciąż > 30 s (nie powinna).
- **WebGPU compute** (szum + pola odległości na GPU: 320k heksów w pojedyncze ms):
  UWAGA — ryzyko dla determinizmu (różnice float per karta → inne hashe map między
  komputerami). Decyzja projektowa: albo seed przestaje gwarantować identyczną mapę
  między maszynami, albo trzymamy generator na CPU. Odkładamy do osobnej decyzji.
- **OffscreenCanvas** — cały render Three.js w osobnym wątku (main thread tylko UI/input):
  największa architektoniczna dźwignia płynności, ale duży refaktor (HUD, picking).
  Rozważyć dopiero, jeśli po Batch 1-3 FPS przy zbliżeniu nadal < 30.

## TRYB AUTONOMICZNY (zlecenie Macieja 2026-07-05: „wykonaj do Batch 6", nieobecność ~2 h)
Kolejność i zasady na czas pracy bez nadzoru:
0. **NAJPIERW B0.7** (puste odpływy/osierocone delty — `BLAD-B0.6-ZALANE-WYBRZEZE-2026-07-05.md`)
   — to regresja wizualna spoza batchy, ma iść przed nimi.
1. Batche ściśle PO KOLEI: 1 → 2 → 3. Każdy batch = osobny commit/backup (.bak) →
   `tsc --noEmit`=0 → `weryfikacja-mapy.cjs` PASS (po Batch 2 także wariant `super-only`) →
   publish robocza → wpis czasów przed/po do sekcji RAPORTOWANIE.
2. Przy okazji Batch 1 zaimplementować zasady stałe jako kod: strażnik markerów bundla
   w kroku publish + stempel wersji (data+skrót) w menu gry.
3. Batch 4: sieci rzek są już częściowo wdrożone — NIE zaczynać od zera; domknąć wyłącznie
   kryteria akceptacji z `DESIGN-RZEKI-SIECI-DOPLYWOW` (w tym test spójności sieci
   dopisany do weryfikacja-mapy).
4. Batch 5 i 6 WYŁĄCZNIE przez bramki: najpierw A4 (debug F9), pomiar FPS/draw calli
   i czasu tury AI na Super Huge; wdrażać tylko elementy z nieosiągniętymi celami.
   Cele osiągnięte → STOP, raport, czekać na playtest Macieja.
5. Kanon: ZERO promocji podczas nieobecności Macieja (wymaga jego playtestu).
6. Jeśli batch nie przechodzi swojego DoD — nie wchodzić w kolejne zależne batche;
   zapisać stan + problem w RAPORTOWANIU i zatrzymać się.

## RAPORTOWANIE
Po każdym batchu Integrator dopisuje do tego pliku: datę, czasy przed/po, wynik
weryfikacji, md5 bundla. Maciej potwierdza playtestem na Super Huge.

### Sesja autonomiczna Claude/Cowork + subagenci Opus 4.8 · 2026-07-05 późny wieczór
WYKONANE (kod w src, WYMAGA: tsc + weryfikacja-mapy + build + publish + Ctrl+F5):
1. ✅ REGRES C1/C2: przywrócone `await generujSwiatAsync` + overlay we WSZYSTKICH 5 ścieżkach
   generacji (nowa gra + pauza + 3 playtesty); zero synchronicznych `generujSwiat(` w main.ts.
2. ✅ BATCH 7 w całości: `src/perf/hardwareProfile.ts` (detekcja + recommendedWorkerLimit,
   localStorage `civ-hw-profile-v1`) + `src/ui/perfTestPanel.ts` (detekcja ✅/⚠️/❌, benchmark
   CPU 1w/4w + GPU z timeoutami, Kopiuj raport, Zastosuj zalecane) + przycisk w menu
   + auto-preset w kreatorze (preferencje gracza mają pierwszeństwo).
3. ✅ A4 rozszerzone: perfDebugOverlay (F9, istniał z Batch 3) + linia `fog X.X ms`
   (pomiar setFog w scene.ts ~980) + FPS = prawdziwa średnia 1 s.
4. ✅ **A5 dirty-set w setFog** (scene.ts): sygnatura visible/explored/hidden per heks,
   cache w domknięciu buildScene, unieważnienie przy zmianie showOceanBackdrop.
   Oczekiwane: akcje (miasto/ruch) z 4-5 s → <30 ms od DRUGIEJ akcji po wczytaniu.
5. ⛔ BATCH 5 chunking: ŚWIADOMIE WSTRZYMANY (bramka jakości agenta) — chunk 32×32 w axial
   to równoległobok ⇒ naiwna boundingSphere = powrót B0.6; ~3000 meshy może pogorszyć
   ODDALENIE (<200 draw calli nieosiągalne bez LOD-scalania); wymaga pomiarów F9 po A5.
   PEŁNY plan implementacji (z wyliczeniem otoczki po 4 narożnikach + kill-switch ?chunks=0)
   jest w raporcie agenta — patrz sekcja planu w tym pliku wyżej + zapis w tej notatce.
KOLEJNE KROKI: pomiar F9 na Super Huge (fog ms, draw) → decyzja o chunkingu;
B0.7+B0.8 (rzeki) i B0.9 (plony miasta) czekają na Claude Code/Cursor — pełna pętla builda.
