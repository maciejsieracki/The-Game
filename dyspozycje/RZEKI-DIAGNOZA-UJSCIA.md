# DIAGNOZA: rzeki nie dochodzą do morza (kończą 1–2 heksy przed) + więcej odpływów niż rzek

Zgłoszenie Macieja 2026-07-09 (zrzuty). Do naprawy jako PIERWSZY temat następnej sesji —
diagnoza zamknięta, wejść od razu w fix z prześledzeniem realnej trasy + testem wzrokowym.

## Mechanizm (rzeka = DWA osobne rendery, które się rozjeżdżają)

1. **Wstęga LĄDOWA** — `render/scene.ts:renderLandRiversFromPaths` (~1001), używa
   `map/gen-helpers.ts:landRiverRenderPath` (3106). Ta funkcja robi **`break` na PIERWSZYM
   heksie Morze LUB Wybrzeże** (3113) → wstęga kończy się na ostatnim LĄDZIE przed wybrzeżem.
   To jest ta rzeka, którą widać. Krótkie ścieżki (`landPath.length < 2`) są pomijane (1021).

2. **Ujście / delta** (dojście do morza) — `render/scene.ts` pętla ~2120, funkcja
   `renderCoastalRiverExtension`. Renderowane TYLKO gdy:
   - `pathKinds[pi] === 'main'` (2123 — **dopływy pomijane**), ORAZ
   - `pathReachesOpenSeaRender(map, path)` (scene:482 — ostatni hex = Morze / Wybrzeże z sąsiadem
     Morza / land tuż przy takim Wybrzeżu) ORAZ `pathNearCoast(map, path)` (2125).
   Używa `coastalRiverRenderPath` (gen-helpers:3124) + szerokości `RIVER_MAIN_HALF_WIDTH` (2138).

## Objawy → przyczyny
- **Rzeka kończy 1–2 heksy przed morzem** = wstęga lądowa urwana przed Wybrzeżem, a ujście
  NIE renderowane (dopływ, albo main z niezaliczonym `pathReachesOpenSeaRender`/`pathNearCoast`,
  albo ścieżka generatora kończy się w buforze `RIVER_MIN_INLAND_FROM_SEA` — `canRiverDrainStep`
  gen-helpers:3296, `isRiverDrainageGoal` 3311 kończą na heksie SĄSIADUJĄCYM z oceanem).
- **Więcej odpływów niż rzek** = delta renderowana (main+sea), gdy wstęga lądowa < 2 heksy
  (pomijana w 1021) → widać deltę bez rzeki.

## Kandydaci na fix (KAŻDY z minusem — wybrać po prześledzeniu realnej trasy)
- (A) Zdjąć restrykcję `main` (2123) → dopływy sięgające morza dostają ujście. MINUS: delta w
  szerokości głównej rzeki (za szeroka dla dopływu) + WIĘCEJ odpływów (pogłębia drugi zarzut).
  Łagodzenie: przekazać szerokość zależną od `kind` do `renderCoastalRiverExtension`.
- (B) Przedłużyć wstęgę lądową przez Wybrzeże do wody (`landRiverRenderPath` break tylko na Morzu).
  MINUS: ryzyko zawiśnięcia wstęgi nad coastem (inne Y) / cienka linia zamiast delty.
- (C) Poprawić generator: ścieżka ma REALNIE dochodzić do Wybrzeża/Morza (nie kończyć w buforze).
  Wtedy `pathReachesOpenSeaRender` zalicza i ujście się rysuje. MINUS: zmienia hash mapy.

## KROK 1 następnej sesji
Prześledzić 1 konkretną urwaną rzekę: sprawdzić jej `kind`, ostatni hex ścieżki (teren + odległość
od morza), i który warunek (2123 vs 2125 vs długość wstęgi) ją wyklucza. Potem wybrać (A)/(B)/(C).
Bramka: hashe mapy (jeśli (C) — zmiana zamierzona, zaktualizować baseline).
