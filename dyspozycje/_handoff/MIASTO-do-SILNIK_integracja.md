# PACZKA: MIASTO -> SILNIK  (integracja: produkcja + porzadek + kultura/religia)
Data: 2026-06-23. Kanal _handoff (jednokierunkowy): SILNIK CZYTA, nie edytuje tego pliku.
Cel: wpiac GOTOWA i ZIELONA (logic-test 163/163) logike MIASTA w petle tury (main.ts). Tylko SILNIK rusza main.ts.

## 0. Stan: co jest gotowe (moj lane)
Wszystkie ponizsze moduly sa CZYSTE (bez DOM/THREE), przetestowane w tools/logic-test.cjs:
- game/production.ts  -- kolejka produkcji + koszty compound + Wykup/Wstrzymaj/rekrutacja.
- game/order.ts       -- Porzadek = Szczescie+Prawo, progi T1/T2, efekty (testy [102]-[125]).
- game/culture-religion.ts -- kultura->granice, zadowolenie, religia (dominacja/szerzenie/konwersja) (testy [140]-[163]).
- game/cities.ts      -- juz wpiete (zakladanie). Bez zmian.
DANE: gra/data/buildings.json (koszt compound liczy itemCost), gra/data/society-params.json (DODANY blok
`porzadek` -- 9 param easy/normal/hard). GameData (loader.ts) wystawia `data.societyParams` i `data.civs`.
USAGE-REFERENCE: tools/logic-test.cjs wola KAZDA z tych funkcji z przykladowymi wejsciami -- to wzor wywolan.

## 1. GDZIE wpiac
main.ts, blok "Per-turn economy tick" (~l.1037), zaraz po:
    const econ = advanceCityEconomy(cities, map, data);
Tam masz juz petle po miastach (econ.perCity, ownerId, praca/pieniadz/nauka/kultura/zywnosc -- patrz typ zwrotny
turn-economy.ts). Produkcje/porzadek/kulture licz w TEJ SAMEJ fali, per miasto.

Potrzebny trwaly stan miedzy turami (utworz raz, obok `cities`):
    const cityProd   = new Map<string, CityProduction>();   // kolejka per miasto (id)
    const cityBuilt  = new Map<string, string[]>();          // id budynkow zbudowanych per miasto
    const cityRelig  = new Map<string, ReligionState>();     // wyznawcy per miasto (gdy ruszasz religie)

## 2. PRODUKCJA  (import z './game/production')
import { advanceProduction, rushProduction, rushCost, setPaused, populationCostOf,
         buildingLevelForEpoch, type CityProduction } from './game/production';

Per miasto, po ekonomii:
    const cid = city.id;
    let prod = cityProd.get(cid) ?? { kolejka: [], postep: 0 };
    const praca = pracaMiasta(cid) * orderEff.productionMult;   // praca z econ.perCity * mnoznik Porzadku (sek.3)
    const { prod: prodPo, completed } = advanceProduction(prod, praca);
    cityProd.set(cid, prodPo);
    if (completed) {
      if (completed.kind === 'budynek') {
        const built = cityBuilt.get(cid) ?? []; built.push(completed.id); cityBuilt.set(cid, built);
      } else { // jednostka
        spawnUnit(city, completed.id);                 // Twoja funkcja: postaw RuntimeUnit obok miasta
        city.population = Math.max(1, city.population - populationCostOf(completed)); // rekrutacja = -1 ludnosc, min 1
      }
    }
WYKUP (przycisk UI / akcja): koszt = rushCost(prod) Pieniadza (1 Praca=1 Pieniadz). Jesli gracz placi:
    if (player.skarbiec >= rushCost(prod)) { player.skarbiec -= rushCost(prod);
      const r = rushProduction(prod); cityProd.set(cid, r.prod); /* zastosuj r.completed jak wyzej */ }
WSTRZYMAJ: cityProd.set(cid, setPaused(prod, true/false)) -- advanceProduction wtedy nie dodaje postepu.

WPIECIE PANELU UI (configureCityPanel w cityPanel.ts -- raz przy starcie): podaj wspolny stan:
    configureCityPanel({
      data, difficulty,
      getCities: () => cities,
      getEpoch: (ownerId) => epokaGracza(ownerId),               // 1=Kamien...; potrzebne do compound poziomu
      getUnlockedTechs: (ownerId) => odblokowaneTechy(ownerId),
      getBuiltBuildingIds: (cityId) => cityBuilt.get(cityId) ?? [],
      getProduction: (cityId) => cityProd.get(cityId) ?? null,    // <-- ta sama kolejka co petla tury
      setProduction: (cityId, p) => cityProd.set(cityId, p),
      onChange: () => refreshHud(),
    });
Uwaga compound: itemCost/availableProduction same licza koszt = kosztBudowy*1.10^(poziom-1). Poziom budynku do
wyceny ULEPSZENIA: buildingLevelForEpoch(def.epokaWejscia, epokaMiasta, def.maksPoziom).

## 3. PORZADEK  (import z './game/order')
import { loadOrderParams, evaluateOrder } from './game/order';

Raz na ture (params zaleza od trudnosci):
    const op = loadOrderParams(data.societyParams, difficulty);   // czyta blok 'porzadek' z society-params.json
Per miasto:
    const happ = szczescieMiasta(city);                            // patrz sek.5 (skladniki Szczescia)
    const ord  = evaluateOrder({ szczescie: happ, prawo: 0 }, op); // Prawo=0 do czasu podsystemu Prawa
    const orderEff = ord.effects;   // { productionMult, growthMult, tradeMult, revoltRisk }
ZASTOSUJ w v0.1:
  - produkcja: praca *= orderEff.productionMult   (juz w sek.2),
  - handel/pieniadz: pieniadzMiasta *= orderEff.tradeMult,
  - bunt: if (rng() < orderEff.revoltRisk) wywolaj bunt (np. -1 ludnosc / utrata tury produkcji),
  - ord.tier ('unrest'|'neutral'|'order') -> pokaz w panelu miasta.
  - growthMult: dotyczy wzrostu populacji liczonego w advanceCityEconomy (EKONOMIA). Do pelnego wpiecia
    trzeba hooka w turn-economy (CROSS-LANE -> przez mastera). W v0.1 mozna pominac (zostawic 1).

## 4. KULTURA + RELIGIA  (import z './game/culture-religion')
import { loadCultureParams, accumulateCulture, cityBorderRadius, cultureHappiness,
         loadReligionParams, civReligion, dominantReligion, religionHappiness,
         spreadReligion, convertViaTemple, makeRng,
         type CultureCity, type ReligionState } from './game/culture-religion';

Raz na ture:
    const cp = loadCultureParams(data.societyParams, difficulty);
    const rp = loadReligionParams(data.societyParams, difficulty);
KULTURA per miasto:
    const cc: CultureCity = { kulturaSkumulowana: city.kultura ?? 0, ownCultureShare: 1 };
    const acc = accumulateCulture(cc, kulturaMiasta(city), cp);   // kulturaMiasta = kultura/ture z econ.perCity
    city.kultura = acc.after;
    const zasieg = cityBorderRadius(acc.after, cp);               // 0..3 -> promien granic miasta (uzyj do okolicy)
    const haKult = cultureHappiness(cc, cp);                      // skladnik Szczescia (sek.5)
RELIGIA per miasto (etap 2 -- wymaga stanu wyznawcow + sasiadow):
    const own = civReligion(nazwaCywMiasta(city), data.societyParams);   // religia wlasna cywilizacji
    const st  = cityRelig.get(city.id) ?? startReligionState(own);
    const dom = dominantReligion(st, rp);                          // religia dominujaca + %
    const haRel = religionHappiness(st, own, rp);                  // skladnik Szczescia (sek.5)
    const spread = spreadReligion(st, sasiedziReligii(city), rp, { hasSwiatynia: maSwiatynie(city), seed: turn });
    // zastosuj spread.events do sasiednich cityRelig; przy zdobyciu miasta: convertViaTemple(st, own, maSwiatynie, rp)

## 5. SZCZESCIE (wejscie do Porzadku) -- jak je policzyc
szczescieMiasta(city) = SUMA:
  + zadowolenie z budynkow: dla kazdego built id -> buildingEffectAtLevel(def.baza.zadowolenie, poziom)
    (poziom = buildingLevelForEpoch(def.epokaWejscia, epokaMiasta, def.maksPoziom)) -- import buildingEffectAtLevel z production.ts,
  + cultureHappiness (sek.4),
  + religionHappiness (sek.4),
  + ew. Luksus z suwaka handlu (gdy bedzie).
W v0.1 MINIMUM: sama suma zadowolenia budynkow + cultureHappiness wystarczy, by Porzadek dzialal; religie dolozysz w etapie 2.

## 6. KOMENDY (build + testy) -- ZELAZNE
Build do testu (zwykly `npx vite build` pada na blokadzie OneDrive dist/):
    cd gra && npx vite build --outDir /tmp/civ-dist
Publikacja kanonu (TYLKO SILNIK):
    cp /tmp/civ-dist/index.html "<sciezka>/Gra-podglad.html"
Testy logiki (musi byc zielone):
    node tools/logic-test.cjs        # oczekiwane: "LOGIC OK (163/163)"; order [102-125], culture-religion [140-163]
    node tools/smoke.cjs /tmp/civ-dist/index.html
    node tools/combat-test.cjs ; node tools/battle-smoke.cjs /tmp/civ-dist/index.html   # gdy dotyczy
NIGDY: `npm run build` (odpala felerny prebuild export-data.py -> zaszyta sciezka + regeneruje cudze JSON),
ani `python export-data.py`.
INFRA (uwaga!): jesli build/test rzuca "Unexpected end of file" / "Unterminated string literal" / "const GO"
-> to DEHYDRACJA OneDrive (mount podaje uciety .ts), NIE blad kodu. Pliki realne (Read = chmura) sa cale.
Lekarstwo: powtorz build (mount bywa chwilowo zhydratowany) albo Windows: folder Civ -> "Always keep on this device".
logic-test 163/163 udowadnia, ze logika jest poprawna.

## 7. CROSS-LANE (NIE rob sam -- przez mastera)
- growthMult Porzadku + compound EFEKTU EKONOMICZNEGO budynkow: economy.ts (buildingValue) i siege.ts (mury.przyrost)
  nadal LINIOWE -> migracja na compound = lane EKONOMIA/siege, przez mastera. buildings.json schema `przyrost` ZOSTAJE do tego czasu.
- Religie cywilizacji: dublet civs.json (DANE) vs blok religie_cywilizacji w society-params -> uzgodnic jedno zrodlo (DANE/master).

## 8. KOLEJNOSC WPINANIA (proponowana)
1) PRODUKCJA (sek.2) + panel (configureCityPanel) -> najszybszy widoczny efekt, build+smoke.
2) PORZADEK (sek.3) z Szczesciem v0.1 (sek.5 minimum) -> productionMult/tradeMult/bunt + tier w panelu.
3) KULTURA (sek.4) -> granice + cultureHappiness do Szczescia.
4) RELIGIA (sek.4 etap 2) -> stan wyznawcow + szerzenie.
Po kazdym kroku: `npx vite build --outDir /tmp/civ-dist` + `node tools/logic-test.cjs` + nowy kanon.

Pytania do mnie: dyspozycje/MIASTO-DO-MASTERA.md (przez mastera). API moich modulow jest zamrozone -- zmiany tylko addytywne.
