# RZEKI — pełny model (Maciej 2026-07-09). PLAN WYKONAWCZY

Decyzja: rzeki tylko przez **równiny/łąki/pustynie**, na **stałej płaskiej wysokości**, wstęga w
**wewnętrznej części heksa** (nie „pomiędzy", nie przez środek). Logika: rzeka nie płynie w górę→dół→w górę.

## Stan obecny (zbadany)
- **Dane:** `hex.rzeka = { obecna, krawedzie[] }` — model KRAWĘDZIOWY (rzeka na granicach heksów).
- **Routing:** `generateRivers` + `canRiverDrainStep` (gen-helpers ~3313) — dobór kroku po **odległości od
  morza** (bufor + korytarz ujścia), **BEZ sprawdzania terenu** → rzeki mogą iść przez wzgórza/góry.
- **Render Y:** `riverHexSurfaceY` (scene.ts ~795) = `terrainSurfaceTopY(teren) + surfaceOffset`
  (+`0.05R` wzgórza, +`0.08R` góry). `surfaceOffset = RIVER_LIFT_ABOVE_TERRAIN_FRAC = 0.22×R`
  (mapRenderStyle.ts:131) → lewitacja. Historycznie 0.10 tonęło za ścianą pryzmu → podbito do 0.22.
- **Render ścieżka:** `landRiverRenderPath` / `coastalRiverRenderPath` (gen-helpers 3106/3124) budują
  łańcuch heksów; wstęga rysowana po krawędziach.

## Cel — 3 części
1. **ROUTING (generator, ZMIENIA HASH):** rzeka może wchodzić tylko na `Rownina/Laka/Pustynia`
   (+ Wybrzeże/Morze na ujściu). Wzgórza/Góry = zakaz. Zmiana w doborze kroku (canRiverDrainStep/goal
   + pathfinding). Ryzyko: rzeka może nie znaleźć drogi do morza (mniej rzek). Bramka: map-gen-regression
   (0 rzek bez ujścia zostaje), **przebić baseline determinizmu** (zmiana zamierzona).
2. **WYSOKOŚĆ (render):** stała, na poziomie płaskiego terenu (`Rownina/Laka/Pustynia` mają jedną
   wysokość + małe podniesienie ~0.06–0.10R). Zdjąć bonusy wzgórz/gór (skoro rzek tam nie ma).
   `riverHexSurfaceY` → zwraca stałą płaską wysokość.
3. **POZYCJA (render):** wstęgę wsunąć do WNĘTRZA płaskiego heksa (odsunięta od krawędzi z sąsiadem,
   nie przez sam środek). Modyfikacja budowy wstęgi (offset ścieżki do wnętrza heksa wzdłuż płaskiego boku).

## Kolejność
1. **Część 1 (routing)** — fundament; bez niej stała wysokość zatapia rzekę na wzgórzu. Osobny commit,
   przebicie baseline. Prześledzić 1 rzekę: czy dochodzi do morza po ograniczeniu do płaskich.
2. **Część 2 (wysokość)** — po routingu bezpieczna; render-only.
3. **Część 3 (pozycja/wnętrze)** — render-only; iteracyjnie wizualnie (zrzuty).

## Gates
tsc=0 · smoke OK · map-gen-regression (0 rzek bez ujścia + determinizm; po części 1 **nowy baseline**) ·
wzrokowo: rzeka na płaskiej wysokości, we wnętrzu heksa, widoczna obok wzgórza, dochodzi do morza.

## Niezależne od tego: kawałek 2 (rename brąz→miedź/żelazo) — dalej w kolejce.
