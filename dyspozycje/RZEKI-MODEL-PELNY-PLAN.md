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

## DOPRECYZOWANIE (Maciej): rzeki ZOSTAJĄ krawędziowe
Wstęga dalej biegnie po krawędziach, ale rysowana **wewnątrz krawędzi właściwego heksa** (płaskiego),
a NIE na granicy dwóch heksów. Routing/dane BEZ zmian → **hash bez zmian, baseline nietknięty**.
Część 1 (generator) ODPADA. Zostaje wyłącznie RENDER (2 + 3).

## Cel — RENDER (2 części, render-only)
2. **WYSOKOŚĆ:** wstęga na wysokości **płaskiego sąsiada** (Rownina/Laka/Pustynia) + małe podniesienie
   (~0.06–0.08R zamiast 0.22). `riverHexSurfaceY`/`RIVER_LIFT_ABOVE_TERRAIN_FRAC` — użyć płaskiej wys.,
   nie per-hex-ze-wzgórzem.
3. **POZYCJA:** dla każdej krawędzi rzeki wybrać sąsiadujący PŁASKI heks i **wsunąć wstęgę do jego wnętrza**
   (offset od granicy wzdłuż normalnej krawędzi, ~0.15–0.25R do środka), rysować na jego wysokości.
   Gdy oba sąsiady płaskie → dowolny/niższy; gdy oba wzgórza (rzadkie) → fallback niższy hex.

## Kolejność
1. Zrozumieć builder wstęgi (scene.ts ~943–1035, `landRiverRenderPath` + geometria) — gdzie punkty
   krawędzi → offset do wnętrza + wybór płaskiego heksa.
2. Część 3 (offset do wnętrza) + część 2 (płaska wysokość) razem — render-only, iteracyjnie zrzuty.

## ZASADA TOPOLOGII (Maciej): BRAK ROZGAŁĘZIANIA — generator, ZMIENIA HASH
Rzeka płynie w JEDNYM kierunku i się NIE rozwidla. Gdy dochodzi do innej rzeki — **tam kończy swój bieg**
(dopływ kończy się przy zbiegu, nie tworzy widelca „Y"). Implementacja: w `generateRivers` przy prowadzeniu
trasy — jeśli kolejny krok trafia na hex/krawędź już zajętą przez inną rzekę, **zakończyć trasę** (stop),
nie kontynuować ani nie rozdwajać. Efekt: rzeki liniowe, zbiegają się (koniec dopływu), zero delt/widelców.
Osobny tor od renderu (2+3). Bramka: map-gen-regression (0 rzek bez ujścia zostaje) + **nowy baseline**.
UWAGA: dopływ kończący się przy zbiegu vs „nie dochodzi do morza" — dopływ MOŻE kończyć się przy rzece
(to jego ujście), nie liczyć tego jako błąd „bez ujścia".

## DWA TORY RZEK
- **Tor RENDER (render-only, bez hasha):** inset do wnętrza płaskiego heksa + stała płaska wysokość (2+3 wyżej).
- **Tor GENERATOR (hash+baseline):** brak rozgałęziania (topologia). Prześledzić `generateRivers` — gdzie
  powstają widelce/dopływy — i zakończyć trasę przy zbiegu.

## Gates
tsc=0 · smoke OK · map-gen-regression (render-tor: determinizm bez zmian; generator-tor: nowy baseline,
0 rzek bez ujścia) · wzrokowo: rzeka we wnętrzu płaskiej strony, płaski poziom, brak widelców, dochodzi do morza/zbiegu.

## Niezależne od tego: kawałek 2 (rename brąz→miedź/żelazo) — dalej w kolejce.
