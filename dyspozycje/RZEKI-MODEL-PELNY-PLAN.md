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
- **Tor GENERATOR:** brak rozgałęziania (topologia). ZBADANE: rzeki = główne (źródło→morze) + DOPŁYWY
  (`aStarRiverToTarget` gen-helpers:4334 — A* dopływ→konkretny hex na głównej) + domykanie junction (B0.8 I2,
  ~4263) + walidacja ujść (~4736 „każdy dopływ na wspólnej krawędzi z inną ścieżką"). `tributaryCountForLength`
  (4328) daje 0–4 dopływów. Widelce „Y" = zbiegi dopływów.
  PODEJŚCIE (do zrobienia, ostrożnie): dopływ ma **zatrzymać się przy PIERWSZYM kontakcie** z rzeką (nie
  celować w hex NA głównej + domykać junction). Zmienić: cel A* = hex SĄSIEDNI do sieci (nie na niej) i
  stop; ALBO w budowie ścieżki przerwać przy trafieniu na `riverHexSet`. Dostosować walidację ujść (dopływ
  kończący przy rzece = OK, nie „bez ujścia"). Uwaga: to intrykowany podsystem — robić na świeżo, mały krok,
  bramka map-gen-regression (0 rzek bez ujścia + determinizm). Test = determinizm (NIE złoty hash) → brak baseline.

## Gates
tsc=0 · smoke OK · map-gen-regression (render-tor: determinizm bez zmian; generator-tor: nowy baseline,
0 rzek bez ujścia) · wzrokowo: rzeka we wnętrzu płaskiej strony, płaski poziom, brak widelców, dochodzi do morza/zbiegu.

## Niezależne od tego: kawałek 2 (rename brąz→miedź/żelazo) — dalej w kolejce.

---

## STAN NA 2026-07-10 15:00 — ROZSTRZYGNIĘTE (styl finalny = KANCIASTY)

Po tym planie temat przeszedł **6 iteracji renderu** w ciągu 2026-07-09/10, wszystkie render-only
(routing/generator bez zmian, determinizm A=B zachowany przez cały ciąg):
1. `5a04f72`/`5a9bbc7` (07-09) — usunięcie pętli heksagonalnych (najkrótszy łuk).
2. `8a3d983`/`8854c92` (07-10 08:13, **79eb3159**) — **centrolinia** (punkty przez środek heksa) —
   ODRZUCONE przez Macieja: „biegnie przez heksy, nie po ściance".
3. `06faee2`/`eb77b67` (07-10 09:19, **33527d79**) — powrót do krawędzi, wall-hugging + Chaikin 2× —
   superseded.
4. `ec2a186`/`70755cf` (07-10 13:42, **9c58ebc2**) — „naturalny ciek" splajn CatmullRom (`sharp=false`) —
   ODRZUCONE po teście wizualnym Macieja (za miękkie/nienaturalne w porównaniu do referencji).
5. **`3d5da76` (07-10 14:31, stempel `3dec388b`) — FINALNE:** powrót do trasowania krawędziowego
   (jak pkt 3) z `sharp=true` — **zero wygładzania, kanciasty styl „Roblox"**. Rzeka biegnie wewnętrzną
   stroną ścianki, próg `MIN_BOKI` = **≥2 boki właściciela/heks** (prosty odcinek = 3 ścianki, łagodny
   skręt = 2), usunięty środkowy punkt przejścia przez ściankę (koniec „domków"). Fix ujść zachowany
   (patrz `RZEKI-DIAGNOZA-UJSCIA.md` — root cause: `coastalRiverRenderPath` dawał łańcuch dł.1 dla
   505/507 rzek; naprawione w kroku 4, zachowane w kroku 5).

**Decyzja Macieja (ABC, dorozumiana z odrzuceń):** a) centrolinia — NIE; b) gładki splajn naturalny —
NIE; **c) kanciasty wall-tracing — TAK, to jest wygląd docelowy.**

Zasada topologii „brak rozgałęziania" (sekcja wyżej) — status: NIE weryfikowany osobno w tym ciągu
(tor render, nie generator; pozostaje odrębnym zadaniem, jeśli jeszcze aktualne).

**UWAGA:** w chwili tego wpisu (2026-07-10 ~15:00) rzeki są PONOWNIE w iteracji w równoległej sesji —
traktuj powyższe jako stan na commit `3d5da76`, zweryfikuj `git log -1 -- gra/src/render/scene.ts`
przed założeniem, że to nadal ostatnie słowo. Zbiorczy stan sesji: `STAN-SESJI-RZEKI-DRZEWKO.md`.
