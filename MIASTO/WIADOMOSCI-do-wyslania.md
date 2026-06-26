# MIASTO — gotowe wiadomości do wysłania (od Maciej)
Najprościej: wyślij wiadomość 1 do zakładki Master+SILNIK (pokrywa integrację + decyzje + routing). Wiadomości 2–4 możesz wysłać wprost do UI / EKONOMIA / DANE albo poprosić Master, żeby przekazał.

---
## 1) DO: Master + SILNIK (jedna zakładka)
MIASTO — status + prośby.

STATUS: logika MIASTA kompletna i ZIELONA — `node tools/logic-test.cjs` = 163/163 (cities, production, order, culture-religion). Dane, panele i dokumentacja zebrane w `Civ/MIASTO/` (MIASTO-DOKUMENTACJA-DEWELOPERSKA.md, Panel-przeglad-danych.xlsx [zakładki Budynki / Spoleczenstwo / Miasto-parametry], Budynki.xlsx, Spoleczenstwo-parametry.xlsx, Schemat-dzialania-miasta.md, Spec-spoleczenstwo.md).

DO WPIĘCIA (część SILNIK): paczka `dyspozycje/_handoff/MIASTO-do-SILNIK_integracja.md` — gotowa instrukcja + komendy. Wpiąć w `main.ts` (blok „Per-turn economy tick", ~l.1037, po `advanceCityEconomy`):
- produkcja: per miasto `advanceProduction(prod, praca × orderEff.productionMult)`; `completed` → budynek do listy zbudowanych / jednostka → spawn + `population −= populationCostOf` (min 1); Wykup = `rushCost`/`rushProduction`;
- porządek: `evaluateOrder({szczescie, prawo:0}, loadOrderParams(data.societyParams, difficulty))` → productionMult/tradeMult/revoltRisk;
- kultura/religia: `accumulateCulture`+`cityBorderRadius`+`cultureHappiness` (religia etap 2);
- panel: `configureCityPanel({getProduction, setProduction, getEpoch, getBuiltBuildingIds, …})`.
Build: `cd gra && npx vite build --outDir /tmp/civ-dist`; test `node tools/logic-test.cjs` (163/163). NIGDY `npm run build` / `export-data.py`.

DECYZJE / CROSS-LANE (część Master):
1. Compound efektu EKONOMICZNEGO budynków — `economy.ts` (buildingValue), `siege.ts` (mury), `player-economy.ts` (utrzymanie) wciąż LINIOWE; decyzja Maciej = compound `baza×1,10^(poziom−1)`. Zlecić EKONOMII/UNITS migrację. `buildings.json` pole `przyrost` ZOSTAJE do tego czasu. Mój helper: `production.buildingEffectAtLevel`.
2. growthMult z Porządku — potrzebny hook w `turn-economy`, żeby efekt Porządku działał na wzrost populacji.
3. Dublet religii cywilizacji — `civs.json` (DANE) vs `society-params.religie_cywilizacji` (MIASTO) → jedno źródło (DANE).
4. `Gra-podglad-MIASTA.html` / `-BRAZ.html` — czyje? jeśli moje + aktualne → przeniosę do `MIASTO/`; historyczne → archiwum; czyjeś → zostawiam.
5. `ARCHITEKTURA-PLIKI.md` / mapy plików — zaktualizować ścieżki po przeniesieniu moich plików do `Civ/MIASTO/`.

INFRA: vite build / regen są flaky przez dehydratację OneDrive (mount ucina .ts/.json/.py). Fix raz, Windows: folder Civ → „Always keep on this device" (dotyczy WSZYSTKICH sesji buildujących). `logic-test` 163/163 potwierdza poprawność kodu.

PYTANIE: czy mam dorobić „wioska → miasto" (Schemat §7.4) w v0.1? To jedyny otwarty feature w moim lane.

---
## 2) DO: UI
UI — od MIASTO. Czekam na waszą paczkę zwrotną (lista symboli z `production.ts`, które importujecie + czego wam brakuje). GOTOWE i ogłoszone w `_handoff/MIASTO-do-UI_kontrakt-produkcji.md` (AKTUALIZACJA 1+2) — nowe ADDYTYWNE API (kontrakt sek.2 niezłamany):
- Poziomy compound: `buildingLevelForEpoch(epokaWejścia, epokaMiasta, maks)`, `buildingEffectAtLevel(baza, poziom)`. „Ulepsz" = gating PO EPOCE (nie 1→2); pokazujcie poziom + nazwę z `nazwyPoziomow`; efekty już przeskalowane — NIE liczcie `1,10^` u siebie.
- Wykup: `rushCost(prod)` (Pieniądz), `rushProduction(prod)`. Wstrzymaj: `setPaused(prod,bool)` + opcjonalne `CityProduction.wstrzymana?`. Rekrutacja: `populationCostOf(item)` (jednostka = 1 ludność).
Wasz odczyt `{kolejka, postep}` działa bez zmian.

---
## 3) DO: EKONOMIA
EKONOMIA — od MIASTO (cross-lane, do uzgodnienia przez Master):
- Efekt ekonomiczny budynków: `economy.ts buildingValue` liczy LINIOWO (`baza+(poziom−1)*przyrost`). Decyzja Maciej = COMPOUND `baza×1,10^(poziom−1)`. Gotowy helper po mojej stronie: `production.buildingEffectAtLevel(baza, poziom)` + `BUILDING_LEVEL_FACTOR` (z `miasto-params.json`). To samo dotyczy `player-economy.ts` (utrzymanie / `przyrostUtrzymania`).
- `order.ts` zwraca `growthMult` (efekt Porządku na tempo wzrostu) — potrzebny hook w `turn-economy`, żeby go zastosować. Produkcję już mnożę przez `productionMult`.
- Produkcja konsumuje Pracę z waszego per-turn tick — bez zmian po waszej stronie. `buildings.json` pole `przyrost` zostaje w schemacie do czasu migracji.

---
## 4) DO: DANE (Dane Cywilizacji)
DANE — od MIASTO: dublet do uzgodnienia. Religia cywilizacji jest w DWÓCH miejscach: `civs.json` (wy) ORAZ `society-params.religie_cywilizacji` (mój panel). `culture-religion.civReligion(civName, society)` czyta religię cywilizacji → potrzebne JEDNO źródło prawdy. Propozycja: `civs.json` = źródło, mój blok = referencja (lub odwrotnie — wasza/Master decyzja). Wpływa na Dyplomację (wspólna religia = relacje) i moją Kulturę/Religię.
