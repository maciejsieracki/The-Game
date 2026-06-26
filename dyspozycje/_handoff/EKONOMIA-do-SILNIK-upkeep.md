# HANDOFF: EKONOMIA -> SILNIK  (nowy plik src/game/upkeep.ts)
Data: 2026-06-23

Powod: Plan task 2 / sekcja START ("zacznij od upkeep.ts -- NOWY plik, zero kolizji").
Plik powstal jako czysty modul (pure, no DOM/THREE), import TYLKO typu `BuildingRecord`
z economy.ts. main.ts / render/* / battle/* / cudze game/* / cudze JSON -- NIE ruszane.

## Co dostarczone: src/game/upkeep.ts
Pokrywa Spec-ekonomia.md s.6 (utrzymanie) + s.7 (magazyny).

A. MAGAZYNY (s.7 -- nowa logika, nikt jej wczesniej nie liczyl):
   - loadStorageParams(raw, diff)            -> StorageParams (czyta globalne.magazyn_*)
   - foodStorageCapacity(maSpichlerz, p)     -> 20, ze Spichlerzem 100 (s.7.1)
   - resourceStorageCapacityPerType(maMagazyn, p) -> 10, z Magazynem 50 (s.7.2)
   - clampStore(amount, cap)                 -> {stored, overflow}  (nadwyzka przepada)
   - applyFood(current, delta, cap)          -> naklada netto + przycina do pojemnosci
   - applyResourceIntake(stores, intake, capPerType) -> nowe stores + overflow per typ
   - globalResourceCapacityPerType(flagiMagazynow[], p) -> suma panstwa (s.7.3)
   - onCityLost() / onCityConquered(...)     -> zdarzenia magazynu (s.7.3)
   - typy: CityStores { zywnosc; surowce: Record<string,number> }, ClampResult

B. UTRZYMANIE (s.6):
   - loadUpkeepParams(raw, diff) -> UpkeepParams (budynki.utrzymanie_budynek,
     globalne.utrzymanie_jednostka_standard, ekonomia_miasta.zywnosc_jednostka_ruch/oboz)
   - buildingUpkeep(b, level, flatOverride?) / totalBuildingUpkeep(...)   (s.6.1)
   - unitUpkeep(u, table, std) / totalUnitUpkeep(...) / buildUnitUpkeepTable(rows) (s.6.2)
   - militaryFoodConsumption(units, p) -> 1/ture marsz, 0.5/ture oboz (s.6.3)
   - upkeepBalance(income, budynki, jednostki, table, p)
       -> {utrzymanieBudynki, utrzymanieJednostki, utrzymanieRazem, saldo, deficyt} (s.6.4)

## Jak wpiac (sugestia -- decyzja kolejnosci nalezy do SILNIK)
1. PUŁAP MAGAZYNU ŻYWNOŚCI: economy.ts populationGrowth akumuluje magazynZywnosci, ale
   NIE przycina go do pojemnosci. Po populationGrowth w turn-economy.ts:
     city.magazynZywnosci = clampStore(city.magazynZywnosci, foodStorageCapacity(maSpichlerz, sp)).stored
   (maSpichlerz: czy miasto ma budynek id 'spichlerz').
2. ŻYWNOŚĆ WOJSKA: turn-economy.ts l.~249 ma na sztywno wojskoZuzycieZywnosci=0.
   Podmien na militaryFoodConsumption(jednostkiMiasta, up) -> realne zuzycie (s.6.3).
3. SKARBIEC/DEFICYT: do bilansu gracza uzyj upkeepBalance(totalPieniadz, budynki, jednostki,
   buildUnitUpkeepTable(data.units), up). income = EconomyTickResult.totalPieniadz.
4. MAGAZYN SUROWCÓW: gdy ruszy zbieranie drewno/kamien/glina/ruda do stanu miasta,
   applyResourceIntake(stores, intake, resourceStorageCapacityPerType(maMagazyn, sp)).
   (maMagazyn: budynek id 'magazyn'.)

## Parametry -- BEZ nowych kluczy (Task 3 przeglad: komplet juz w econ-params.json)
   globalne.magazyn_baza_zywnosc=20, magazyn_baza_surowce=10, magazyn_mnoznik_spichlerz=5,
   utrzymanie_jednostka_standard=1; budynki.utrzymanie_budynek=1;
   ekonomia_miasta.zywnosc_jednostka_ruch=1, zywnosc_jednostka_oboz=0.5.
   Loadery czytaja je 1:1 (klucze ASCII, bez diakrytykow -> brak buga z loadEconParams).
   Excele panelu NIE wymagaja zmian.

## Weryfikacja
- Logika: 33/33 PASS na REALNYM module (esbuild transpile prawdziwego upkeep.ts -> node).
  Pokryte przyklady spec: pojemnosc 20/100 i 10/50, suma panstwa 160 (s.7.3), podboj/utrata
  magazynu, zywnosc wojska 4 marsz / 2 oboz (s.6.3), bilans s.8.4 (12 bud + 5 jedn, income 8
  -> saldo -9, deficyt), loadery vs realne klucze econ-params.
- Typy: `tsc --strict --noEmit` CZYSTE (upkeep.ts vs wierny stub BuildingRecord).
- Pelny `vite build` NADAL zablokowany: DEHYDRACJA OneDrive -- bash/tsc widza economy.ts
  (i in. lane: battleScene/diplomacy/mappreview) jako UCIETE -> falszywe 'TS1010 */ expected'
  na economy.ts:590 (Read pokazuje plik w calosci). upkeep.ts sam jest hydrowany i kompiluje.
  PROSBA do Maciej: folder Civ -> "Always keep on this device" odblokuje kanoniczny build.
- Build do testu (po hydratacji) WYLACZNIE: `npx vite build --outDir /tmp/civ-dist` (cp do celu).

## Nakladka z player-economy.ts (orphan -- importowany nigdzie; save.ts tylko wspomina w komentarzu)
player-economy.ts DUBLUJE per-encje buildingUpkeep/unitUpkeep jako czesc agregatu skarbca gracza.
Zgodnie z decyzja START ("nowy upkeep.ts" zamiast "rozbudowa player-economy.ts") to upkeep.ts jest
teraz KANONICZNYM domem prymitywow s.6/s.7. Sygnatury trzymam zgodne, zeby dalo sie skonsolidowac.
REKOMENDACJA (decyzja master/SILNIK -- ja player-economy.ts NIE ruszam, nie moj lane):
  (a) przy wpinaniu warstwy gracza przepiac ja na upkeep.ts i wycofac player-economy.ts, ALBO
  (b) zrefaktorowac player-economy.ts tak, by importowal prymitywy z upkeep.ts (bez trzeciej kopii).

## Prosba do SILNIK
Zintegruj/zwaliduj przy wpinaniu ekonomii (Test 8 economy moglby dostac przypadki magazyn/utrzymanie
z mojego /tmp testu -- moge je sformatowac pod logic-test.cjs, jesli chcesz; logic-test.cjs to plik
wspoldzielony, wiec sam go NIE edytuje). Jak chcesz inna kolejnosc wpiec lub zmiany -> wpisz w
dyspozycje/EKONOMIA.md (ODPOWIEDZ MASTERA).
