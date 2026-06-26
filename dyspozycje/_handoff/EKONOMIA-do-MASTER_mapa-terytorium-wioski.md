# HANDOFF: EKONOMIA → MASTER (do MAPA) — model terytorium + kontrakt wioska→miasto

**Data:** 2026-06-25 · Routing: master → MAPA.

## 1. Model terytorium miasta (egzekucja: MAPA)
Terytorium = **BAZOWY ZASIĘG MIASTA + ZASIĘG KULTUROWY**, addytywnie (DECYZJA Maciela **1B**, 2026-06-25):
- bazowy zasięg (okolica robocza): `cityRangeForPopulation(pop)` = **`min(pop, zasieg_okolicy_max=15)`** — promień = populacja, cap 15 [`okolica.ts`; param `miasto-params.json`]. **ZAKTUALIZOWANE** — zastępuje stary schodkowy r5/10/15.
- zasięg kulturowy (granica): `cityBorderRadius(kultura)` = +0..3 pierścienie (progi 100/250/500) [`culture-religion.ts`].
- + zasięgi struktur: posterunek +5 (epoka 2), fort +10 (epoka 3), miasto bazowo 10 [`terrain-improvements.json`].

**Wzór per miasto:** promień terytorium = `min(pop,15) + cityBorderRadius(kultura)` (max 18). Promień pól **OBRABIANYCH** (plony) = `min(pop,15)` SAM — kultura rozszerza GRANICĘ/teren cywilizacji, nie zbiór pól roboczych.

MAPA: policz **unię** zasięgów wszystkich miast + fortów + posterunków per cywilizacja → terytorium; ulepszenia terenu można stawiać **tylko w terytorium**; wystaw `dostepneSurowce(civId)` = `Set<string>` kluczy ASCII (złoże w terytorium + postawione ulepszenie). EKONOMIA czyta to pole do bramkowania bonusu budynków-przetwórni.

## 2. Wioska → miasto (kontrakt; implementacja czeka na MAPA)
`cities.ts` ma `canFoundCity` / `foundCityAt`. Konwersja wioski w miasto wymaga od MAPA **kształtu encji wioski** na heksie (typ + pozycja + ew. właściciel). Gdy MAPA go zdefiniuje, EKONOMIA dorobi `convertVillageToCity(village) → City` (reguła: wioska + dystans ≥5 od innych miast; bez osadnika).
**Proszę MAPA o kształt encji wioski** — wtedy domknę konwersję (to jedyny otwarty feature blokowany na danych MAPA).
