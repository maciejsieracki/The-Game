# ⛔ KRYZYS: cofnięte pliki rzek + zepsuta kompilacja (2026-07-05 wieczór) — INSTRUKCJA NAPRAWCZA
Wykonawca: Claude Code Opus (integrator). Testy i publish WYŁĄCZNIE przez `gra-robocza/START.html`
— żadnych innych plików Gra-podglad-* (decyzja ostateczna Macieja; stare linki = źródło chaosu).

## ⚠ KOREKTA DIAGNOZY (Cursor, wieczór): DWA DRZEWA ŹRÓDŁOWE, nie tylko rollback
Ustalone: **START.html/publish F buduje z `gra/src/`**, a cała nowa praca (overlay, mapGenAsync,
genWorker, hardwareProfile, perfTestPanel, A5, rzeki B0.7/B0.8) trafiała do **`gra-robocza/src/`**
→ bundle nigdy ich nie zawierał; ROBOCZA-MANIFEST.json kłamie o markerach; strażnik
verify-publish-markers.ps1 = FAIL (civ-map-load-overlay: 0).
**NAPRAWA (nadrzędna nad planem niżej):**
1. DECYZJA JEDNEGO DRZEWA: publish F ma budować z drzewa, w którym jest nowa praca
   (zalecane: przenieść/zmergować `gra-robocza/src` nowe moduły+wpięcia → `gra/src`,
   ALBO przepiąć build na gra-robocza/src — jedno albo drugie, nigdy dwa naraz).
2. Migracja obejmuje CAŁOŚĆ dzisiejszej pracy, nie tylko overlay: ui/mapLoadingOverlay.ts,
   map/mapGenAsync.ts, map/genWorker.ts, perf/hardwareProfile.ts, ui/perfTestPanel.ts,
   wpięcia w main.ts (async doStartGame + 3 playtesty + przycisk Test wydajności),
   A5 dirty-set + fog-ms w render/scene.ts + perfDebugOverlay, funkcje rzek B0.7/B0.8
   w gen-helpers/scene/mapRenderStyle (sekcja STATUS w BLAD-B0.8) + Z1-Z3 poniżej,
   tools/weryfikacja-mapy.ts (już zgodny z nowymi eksportami).
3. Manifest naprawić, strażnik markerów = PASS obowiązkowo przed ogłoszeniem publish.

## CO SIĘ STAŁO (pierwotna diagnoza — częściowo zastąpiona korektą wyżej)
`src/map/gen-helpers.ts` (08:14) i `src/render/scene.ts` (08:15) są SPRZED pracy B0.7/B0.8 —
OneDrive/równoległa sesja COFNĘŁA zapisy dużych plików. Skutki:
1. `tools/weryfikacja-mapy.ts` importuje 6 funkcji, których NIE MA w gen-helpers
   (verifyRiverNetworkConnectivity, countRiverOutletsToSea, medianRiverPathLength,
   checkRiverEdgeContinuity, checkTributaryJunctions, checkNoRiverRings) → **tsc i test FAILUJĄ**.
2. Regres na Super Huge: powrót oceanów-na-lądzie + wolna generacja (~3-5 min zwis na
   „Przygotowanie…") — bo build leci ze starego drzewa.
ZASADA OD TERAZ: **jeden wykonawca naraz** na src (teraz Cursor). Świeży bundle ZAWSZE
publikowany i do `gra-robocza/START.html`-ścieżki, i do `Civ\Gra-podglad-ROBOCZA.html`.

## PLAN NAPRAWCZY (kolejność)
1. **Odblokować kompilację:** przywrócić/odtworzyć w gen-helpers.ts funkcje z listy wyżej
   ALBO tymczasowo zakomentować ich importy+użycia w tools/weryfikacja-mapy.ts (żeby tsc=0).
2. **Odtworzyć B0.7/B0.8:** pełny zapis CO było zrobione → sekcja „STATUS — 2026-07-05
   (Claude Code, Opus)" w `BLAD-B0.8-POLACZENIA-RZEK-2026-07-05.md` (appendJunctionDownstreamHex,
   networkDownstreamNeighbor, pathReachesOpenSeaRender, buildCoastalRiverPointChain tIn=0.6,
   filtr computeRiverDeltaHexKeys, checkRiverEdgeContinuity/JunctionS). Playtest POTWIERDZIŁ,
   że delty/junctiony działały na buildzie z tą pracą — warto ją odzyskać, nie pisać od zera
   (szukać też w hist. Cursora / kopiach OneDrive „wersje poprzednie" dla gen-helpers/scene).
3. **Dołożyć gotowe poprawki Z1-Z3** (kod do wklejenia w raporcie poniżej, sekcja „GOTOWY KOD"):
   - Z1 ujście NAD taflą: `riverMouthY = coastWaterCapTopY(renderStyle) + R*0.026` (helper
     `coastWaterCapTopY` JUŻ jest w mapRenderStyle.ts); renderOrder wstęgi ujścia 58 > lejek 50.
     Uwaga-decyzja Macieja (alternatywa): podnieść poziom morza minimalnie pod ląd zamiast
     podnosić wstęgę — ODRZUCONE na teraz (ryzyko prześwitów morza pod terenem); zostaje rampa.
   - Z2 gęstość: `riverTributaryCellSize` (7 dla Normalnie) TYLKO w topUpRiverGridCoverage
     (ujścia bez zmian); tributaryCountForLength podniesione.
   - Z3 pierścienie: `trimRiverPathRings` przy każdym markRiverPath + eksport `checkNoRiverRings`
     (wpięcie w weryfikacja-mapy JUŻ zrobione, czeka na funkcję).
4. **Z4 (GOTOWE, na dysku, małe pliki ocalały):** kalibracja progów perfTest
   (hardwareProfile.ts 900/2500 + 4/12 + classifyHardwareDetailed z „Zdecydował:") — po
   buildzie RTX5070 = MOCNY.
5. tsc=0 → weryfikacja-mapy PASS (standard + super-only; kolumny ciaglosc/junction/pierscienie=0)
   → build → publish do OBU ścieżek → Ctrl+F5 → playtest Macieja.

## SPEC ODTWORZENIOWY — 6 brakujących eksportów gen-helpers (sygnatury z użycia w teście)
Wszystkie czyste, bez rand(), deterministyczne. `RiverCoord={q,r}`, kinds: 'main'|'tributary'.
1. `verifyRiverNetworkConnectivity(hexes, paths, kinds, w, h): {connected:boolean; orphanCount:number}`
   — ujścia = ścieżki main z pathEndsAtSea; BFS po heksach ścieżek (ścieżki połączone, gdy
   dzielą heks LUB heksy sąsiednie z oznakowaną wspólną krawędzią); orphan = ścieżka
   nieosiągalna z żadnego ujścia; connected = orphanCount===0.
2. `countRiverOutletsToSea(hexes, paths, kinds, w, h): number` — liczba main z pathEndsAtSea,
   z deduplikacją ujść bliżej niż 3 heksy (hexDistanceAxial ostatnich heksów).
3. `medianRiverPathLength(paths, kinds, mainOnly: boolean): number` — mediana path.length
   (gdy mainOnly tylko kinds==='main'); pusta lista → 0.
4. `checkRiverEdgeContinuity(paths, hexes): {ok:boolean; violations:number; firstFail?:string}`
   — I1: dla każdej ścieżki każda para (i,i+1) sąsiadami hex ORAZ wspólna krawędź oznakowana
   w hex.rzeka.krawedzie PO OBU stronach; firstFail = `path#N idx=I (q,r)->(q,r)`.
5. `checkTributaryJunctions(paths, kinds, hexes, w, h): {ok; violations; firstFail?}` — I2:
   każdy nie-main kończy na heksie, który ma oznakowane krawędzie należące też do INNEJ
   ścieżki (junction domknięty) albo sam spełnia pathEndsAtSea (dopływ-ujście po scaleniu).
6. `checkNoRiverRings(hexes, paths): {ok; violations; firstFail?}` — heks z ≥5 oznakowanymi
   krawędziami rzeki = FAIL zawsze; dokładnie 4 = OK tylko gdy heks występuje w ≥2 ścieżkach.
Funkcje junction z B0.8 (semantyka w STATUS BLAD-B0.8): `appendJunctionDownstreamHex(path,
hexes)` — jeśli ostatni hex dopływu NIE dzieli oznakowanej krawędzi z siecią docelową, doklej
1 hex sieci sąsiadujący z końcem (wybór: hex sieci o wspólnej krawędzi z przedostatnim
kierunkiem nurtu); idempotentne. `pathReachesOpenSeaRender(map, path)` (scene.ts) — brama
dekoru ujścia: true tylko gdy pathEndsAtSea dla tej ścieżki.

## GOTOWY KOD Z1-Z3 — PEŁNE BLOKI 1:1 (z raportu subagenta Opus)

**Z1 (scene.ts, sekcja dispatchu rzek).** Diagnoza liczbowo (HEX_R=1, seaTop=0.18):
riverMouthY=seaTop+0.026=0.206 leżało PONIŻEJ coastWaterCapTopY=0.2237 i tafli laguny delty
(~0.2397) → wstęga chowała się pod capem. Helper `coastWaterCapTopY(style)` +
`COAST_WATER_CAP_THICKNESS = 0.038*1.15` JUŻ SĄ w mapRenderStyle.ts (linie ~208/211):
```ts
const capTopY = coastWaterCapTopY(renderStyle);
const riverMouthY = capTopY + R * 0.026;   // ~0.070 nad seaTop — NAD base/lagoon/tongue capa (≤0.060)
```
Rampa (hipoteza „nurkuje pod ląd") jest strukturalnie OK: riverHexSurfaceY zwraca topY lądu
dla lądu, riverMouthY tylko dla Wybrzeże/Morze — spadek zaczyna się na granicy ląd→woda
(uśrednienie Y na wspólnej krawędzi). renderOrder: wstęga ujścia (wodna i „deltowa") = 58
(> land 55 > cap 0/1 > lejek 50); lejek estuary zostaje 50; flush lejka PRZED wstęgą.
(W wersji z RiverGeoBucket: coastRiverBucket 58, coastRiverDeltaTopBucket 58 z materiałem
delty, coastFunnelBucket 50.)

**Z2 (gen-helpers.ts).** Gęstsza siatka WYŁĄCZNIE dla top-upu (dopływy, nie ujścia):
```ts
export function riverTributaryCellSize(tier: DensityTier = 'medium'): number {
  if (tier === 'high') return 4;
  if (tier === 'low') return 11;
  return 7;   // 10→7 dla „Normalnie" = ~(10/7)^2 ≈ 2× komórek ≈ 2× biegów
}
```
W `topUpRiverGridCoverage`: `const cellSize = riverCoverageCellSize(riversTier)` →
`riverTributaryCellSize(riversTier)` (generateRivers ZOSTAJE na riverCoverageCellSize →
ujścia bez zmian). `tributaryCountForLength`: `<12→0; <22→2; else min(4, floor(len/8))`.

**Z3 (gen-helpers.ts).** `trimRiverPathRings(hexes, path)` — deterministyczne, bez rand():
idąc ścieżką liczy krawędzie kładzione przez ten bieg + już oznakowane; UCINA bieg PRZED
krokiem, który dałby 4. krawędź na heksie bez wcześniejszych krawędzi (czysty pierścień)
lub 5. na jakimkolwiek (junction: max 4, nigdy 5). Wywołanie w KAŻDYM miejscu znakowania:
`markRiverPath(hexes, trimRiverPathRings(hexes, path))` — pushMain/pushTributary w
generateRivers i topUpRiverGridCoverage oraz addTributariesForMainRiver.
Eksport testowy `checkNoRiverRings(hexes, paths)`: heks z ≥5 krawędziami zawsze FAIL;
dokładnie 4 OK tylko gdy heks należy do ≥2 różnych ścieżek (junction). Wpięcie w
tools/weryfikacja-mapy.ts JUŻ ISTNIEJE (import + kolumna pierscienie=) — czeka na funkcję.

## GOTOWY KOD Z1-Z3 (skrót — patrz pełne bloki wyżej)
Pełne fragmenty w raporcie subagenta zapisane w sekcji poniżej (skopiowane 1:1):
- Z1: `const capTopY = coastWaterCapTopY(renderStyle); const riverMouthY = capTopY + R*0.026;`
  (scene.ts, dispatch rzek; bucket wstęgi ujścia renderOrder 58; lejek 50; flush lejka przed wstęgą).
- Z2: `export function riverTributaryCellSize(tier){ high:4, low:11, medium:7 }` + podmiana
  w topUpRiverGridCoverage; `tributaryCountForLength`: `<12→0; <22→2; else min(4,floor(len/8))`.
- Z3: `trimRiverPathRings(hexes,path)` — ucina krok dający 4. krawędź na heksie bez wcześniejszych
  krawędzi lub 5. na jakimkolwiek; `checkNoRiverRings(hexes,paths)`: ≥5 zawsze FAIL, ==4 OK tylko
  na heksie należącym do ≥2 ścieżek.
Wpływ na hashe terenu: ZERO (rzeki po terenie); zmieniają się riverPaths/krawedzie → jeśli coś
je snapshotuje, zamrozić.

---

## MUTEX — jeden wykonawca + LOCK.json + publish bez `src/` (Maciej 2026-07-05)

> **Cel:** koniec sytuacji „czat A na `gra/`, czat B na `gra-robocza/src/`”.  
> Reguły w markdownie **nie wystarczą** — twardy plik + brak drugiego drzewa kodu.

### Zasada

| Warstwa | Jedyna ścieżka |
|---------|----------------|
| **Kod** | **`gra/src/**`** |
| **Wykonawca kodu** | **jeden naraz** (teraz: czat KRYZYS / Opus integrator) |
| **Maciej gra** | **`gra-robocza/START.html`** + pieczętka ROBOCZA · md5 |
| **Inne czaty (Master, A–E)** | **ZAKAZ zapisu** w `gra/src/` — tylko spec, ABC, handoff |

### `gra/LOCK.json` — mutex między czatami

Plik: **`gra/LOCK.json`** (czytaj **przed** pierwszą edycją `gra/src/**`).

```json
{
  "owner": "KRYZYS-Opus",
  "ownerChat": "integrator / KRYZYS 2026-07-05",
  "since": "2026-07-05T18:30:00",
  "until": "2026-07-06",
  "reason": "KRYZYS-COFNIETE-PLIKI — merge gra-robocza→gra, B0.7/B0.8, Z1-Z3, publish",
  "expectedMd5AfterPublish": null
}
```

**Agent przed zapisem w `gra/src/`:**
1. Jeśli `LOCK.json` istnieje i **`owner` ≠ ten czat** → **STOP**, odpowiedź:  
   `ZABLOKOWANE · właściciel: <owner> · czekam na zwolnienie LOCK`
2. Jeśli jesteś właścicielem → pracujesz normalnie.
3. Po udanym publish → ustaw `expectedMd5AfterPublish` na md5 bundla + dopisz wpis w DZIENNIK.

**Zwolnienie LOCK (wyłącznie właściciel lub Maciej):**
- Usuń plik **albo** ustaw `"owner": null` + `"releasedAt": "…"`  
- Dopisz w DZIENNIK: `LOCK zwolniony · md5=…`

**Inne czaty:** trigger Macieja **`ścieżka`** → czytaj [`OBOWIAZ-SCIEZKA-KODU.md`](../docs/obieg/OBOWIAZ-SCIEZKA-KODU.md) · **nie zapisuj** kodu dopóki LOCK aktywny.

### Publish — tylko bundle (bez odtwarzania pułapek)

Po PASS KRYZYS **zmienić** `gra/tools/publish-robocza-snapshot.ps1` i `publish-kanon-snapshot.ps1`:

| Robić | **NIE** robić |
|-------|----------------|
| `Gra-podglad.html` + pieczętka | kopiować `gra/src/` → `gra-robocza/src/` |
| `START.html`, `ROBOCZA-MANIFEST.json` | kopiować `data/` / `package.json` do roboczej (opcjonalnie tylko manifest) |
| root `Gra-podglad-ROBOCZA.html` | zostawiać `gra-robocza/tools/publish-robocza-bundle.ps1` |

**Kanon:** kopia **tylko** bundli + manifestów z roboczej — **bez** `src/`.

### Kasacja pułapek (po zielonym publishu — **USUNĄĆ**, nie archiwum w repo)

Maciej: archiwum w projekcie = agent znowu to znajdzie. Backup poza Civ: `C:\Users\macie\Backups\Civ\`.

| Usunąć | Powód |
|--------|--------|
| `gra-robocza/src/` | fork kodu |
| `gra-kanon/src/` | fork kodu |
| `gra-kanon-archiwum/` | snapshoty bundli (backup zewnętrzny wystarczy) |
| `gra-robocza-kopia/` | duplikat backupu |
| `gra-robocza/tools/publish-robocza-bundle.ps1` | build ze złego źródła |
| `gra-kanon/tools/publish-robocza-bundle.ps1` | j.w. |

**Zostaje w `gra-robocza/`:** `START.html`, `Gra-podglad.html`, `PLAYTEST-*.html`, `ROBOCZA-MANIFEST.json` (+ opcjonalnie `Gra-podglad-POLE-BITWY.html`).

### Kolejność wykonania (MUTEX + KRYZYS)

```
1. Ustaw gra/LOCK.json (właściciel = ten czat)
2. Merge gra-robocza/src (nowe moduły) → gra/src + B0.7/B0.8 + Z1-Z3 + Z4
3. tsc=0 · weryfikacja-mapy PASS · verify-publish-markers PASS
4. Publish (tylko HTML) → START + ROBOCZA
5. Kasacja pułapek (tabela wyżej)
6. Zwolnij LOCK · md5 w DZIENNIK · Maciej: Ctrl+F5 START.html
```

### Meldunek do Macieja (jedyna linia playtestu)

```
PLAYTEST: gra-robocza/START.html · md5=<32hex> · Ctrl+F5 · LOCK zwolniony
```

Bez md5 / bez zwolnionego LOCK = **nie testuj**.

