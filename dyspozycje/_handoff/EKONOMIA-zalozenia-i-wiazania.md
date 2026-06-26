# EKONOMIA: przyjete zalozenia + kontrakty wpiec (dla SILNIK + decyzje mastera)
Data: 2026-06-23 ~01:35. Powod: Maciej dal zielone "przyjmij najlogiczniejsze zalozenia i dzialaj".
Spisuje, co PRZYJALEM dla kazdego otwartego tematu i jak ma to wejsc (economy.ts/turn-economy.ts
edytuje SILNIK -- ja daje kontrakt, nie ruszam tych plikow).

## ZROBIONE TERAZ (moj lane, czyste nowe pliki -- zero kolizji)
- **src/game/converters.ts** (+ tools/converters-test.cjs, 30/30 PASS): przetworstwo surowcow
  Spec s.1.5. Tartak/Mielerz/Cegielnia/Huta/Garncarnia, 1:1 do przepustowosci, pauza przy
  braku wejscia lub pelnym magazynie wyjscia. Receptury data-driven; przepustowosc z
  econ-params.json (budynki.budynek_*_przepustowosc).

## PRZYJETE ZALOZENIA (per temat)

### Q2 -- awans budynkow: +10% SKLADANY
Przyjmuje: wartosc na poziomie = baza * 1.10^(poziom-1), floor na koncu. ZASTEPUJE liniowy
`przyrost`. Zrodlo: notatka/pamiec projektu "1 poziom/epoke, +10% skladany". Dotyczy
economy.buildingValue (yields) i dla spojnosci upkeep.buildingUpkeep (utrzymanie).
KONTRAKT: jedna funkcja valueAtLevel(base, level)=Math.floor(base*Math.pow(1.10, level-1)).
NIE wprowadzam (economy.ts read-only + wplyw na produkcje/MIASTO). >> POTRZEBNA AKCEPTACJA MASTERA
(balans). Jak potwierdzisz -- podmienie w economy/upkeep przez handoff.

### Konwertery (s.1.5) -- ZROBIONE, kontrakt wpiecia
W petli tury per miasto, PO zebraniu surowcow z pol: zbierz wybudowane budynki przetworcze ->
runConverters(recipes, citySurowce, throughputs, key=>upkeep.resourceStorageCapacityPerType(maMagazyn,p)).
Kolejnosc DEFAULT_CONVERTER_RECIPES (tartak->mielerz->cegielnia->huta->garncarnia) celowa: paliwo
z Mielerza zasila Hute/Cegielnie/Garncarnie w tej samej turze.
[ZALEZNOSC DANE/UNITS] klucze surowcow: converters uzywa ASCII (drewno/deski/paliwo/glina/cegla/
ruda/braz/ceramika); resources.json ma diakrytyki ("Cegla","Braz"). Rekomendacja: kolumna ASCII
`id` w Surowce.xlsx/resources.json, albo mapa kluczy na styku.

### Sufit magazynu zywnosci -- wpiac
Przyjmuje: economy.populationGrowth kumuluje magazynZywnosci BEZ limitu; nalozyc sufit
upkeep.foodStorageCapacity(maSpichlerz, p) (nadwyzka przepada, s.7.1). KONTRAKT (turn-economy,
po populationGrowth): magazynZywnosci = min(magazynZywnosci, foodStorageCapacity(...)). Patch gotowy
-- nie wprowadzam (turn-economy read-only/SILNIK).

### Utrzymanie + zywnosc wojska w turze -- wpiac (SILNIK)
Przyjmuje wpiecie upkeep.ts (szczegoly: _handoff/EKONOMIA-do-SILNIK-upkeep.md):
(a) militaryFoodConsumption(units) -> ctx.wojskoZuzycieZywnosci w cityYieldPerTurn;
(b) po sumie Pieniadza miast -> upkeepBalance(income, buildings, units, table, p) -> potracenie
ze skarbca + flaga deficytu (s.6.4/8.4).

### Mennica / Waluta -- gating
Przyjmuje: przed wynalezieniem Waluty ctx.mennicaMnoznik=1 (Handel->Pieniadz 1:1); po Walucie I
wybudowanej Mennicy ctx.mennicaMnoznik = params.budynekMennicaMnoznik. KONTRAKT: SILNIK czyta z
playerState czy Waluta odkryta + czy miasto ma Mennice -> ustawia ctx.mennicaMnoznik (dzis stale 1).

### Podatki (s.2a / s.8.1, [PT] "do sprecyzowania")
Przyjmuje model MINIMALNY, DOMYSLNIE WYLACZONY: podatekPieniadz = floor(populacja * stawkaPodatku),
stawkaPodatku = nowy param (domyslnie 0.0), suwak 0..X%. Wylaczony => neutralny dla balansu.
NIE buduje jeszcze modulu (spec wprost "do sprecyzowania"). >> POTRZEBNA DECYZJA MASTERA o formule;
po potwierdzeniu dodam param do Ekonomia-parametry.xlsx + funkcje taxIncome.

### Luksus -> Zadowolenie (s.2.2, [PT]) -- lane SPOLECZENSTWO/ORDER
Przyjmuje przelicznik 5 Luksus = +1 zadowolony (spec [PT]). economy juz zwraca `luksus` (per miasto)
i `totalLuksus`. To NIE moj lane -- order/culture-religion ma to skonsumowac. Flaga zaleznosci.

### Orphan player-economy.ts
Przyjmuje rekomendacje: upkeep.ts = kanon utrzymania; player-economy.ts (dubel) do konsolidacji/
usuniecia. NIE edytuje (decyzja SILNIK/master).

## CZEGO NIE RUSZAM
main.ts, render/*, battle/*, economy.ts, turn-economy.ts (read-only wg START), cudze game/*,
player-economy.ts, cudze JSON. Wszystkie zmiany w tych plikach = przez ten handoff.
