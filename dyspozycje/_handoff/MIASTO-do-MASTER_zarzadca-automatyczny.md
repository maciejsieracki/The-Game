# PACZKA: MIASTO -> MASTER : Zarzadca automatyczny (9A) + flaga maMur (4A)
Data: 2026-06-25. Realizacja przez Sonnet-subagenta. Gotowe do wpiecia (master integruje w petle tury; UI dostaje toggle).

## 9A -- autoManageCity (NOWY modul: src/game/auto-manage.ts)
Czysta funkcja auto-zarzadzania miastem (auto-produkcja + auto-przydzial pol + podzial Pracy). PURE -- nie mutuje wejsc.

SYGNATURA:
  autoManageCity(
    city: Readonly<City>,
    map: GameMap,
    prod: Readonly<CityProduction>,
    data: ProductionData,            // { buildings, units }
    input: AutoManageInput,
  ): AutoManageDecision

AutoManageInput: { yieldOf(q,r)->TileYield; cityPraca?; udzialBudynki?=0.7; unlockedTechs?; ctx?; isWorkable?(q,r) }
AutoManageDecision: {
  workedTiles: OkolicaTile[];                       // N najlepszych pol (N=populacja, clamp; radius z cityRangeForPopulation)
  enqueue: ProductionItem | null;                   // sugeruje element TYLKO gdy kolejka pusta (frontItem===null); null = nie ruszaj
  pracaSplit: { doBudynkow, doPuli } | null;        // podzial Pracy (null gdy brak cityPraca)
}

HEURYSTYKA auto-produkcji (deterministyczna, priorytet malejacy):
  Zywnosc -> Produkcja -> Nauka -> Pieniadz -> Wojsko/Prod+Wojsko -> Obrona -> Kultura -> Zdrowie -> reszta budynkow -> jednostki (tylko Kamien za Prace).
  W kategorii: tanszy pierwsze; remis -> alfabetycznie. NIE wymusza zakupow za Pieniadz.

WPIECIE (master): gdy miasto ma wlaczony auto-zarzadca (flaga z UI), w petli tury wywolaj autoManageCity i zaaplikuj decyzje:
  - workedTiles -> przypisanie obrabianych pol (zamiast recznego),
  - enqueue (jesli != null) -> production.enqueue(prod, item),
  - pracaSplit -> ile Pracy do kolejki vs globalnej puli.
UI: tylko wlacza/wylacza zarzadce przez callback (np. setAutoManage(cityId, bool)); sama funkcja nie trzyma stanu toggle.

## 4A -- flaga maMur
- src/game/cities.ts: interface City + `maMur?: boolean` (ustawiane po zbudowaniu budynku 'mury'; +200% obrony liczy UNITS/silnik).
- data/buildings.json: wpis budynku id 'mury' + `"odblokowuje": "maMur"`. Reszta wpisow bez zmian; JSON parsuje sie (15 budynkow).
- Wpiecie (master/UNITS): po ukonczeniu 'mury' w miescie ustaw city.maMur=true; bonus obrony egzekwuje UNITS/silnik (param miasto-params.bonus_obrona_mur_proc=200).

## WERYFIKACJA
- auto-manage-test.cjs = AUTO-MANAGE OK (26/26). Bunduje przez esbuild auto-manage.ts + production.ts + okolica.ts (+ tranzytywnie cities.ts) => moje moduly KOMPILUJA sie i przechodza.
- Pelny logic-test.cjs PADA wylacznie na data/units.json (lane DANE) -- mount ucina plik na l.2072 ("Unexpected end of file"); wersja CHMUROWA (Read) jest KOMPLETNA (ciagnie sie dalej, Taran/Katapulta...). To dehydratacja OneDrive, NIE moja regresja (units.json nietkniety). Po hydracji mountu logic-test wroci do bazowych 163/163.
- Backupy: cities.ts.bak-MIASTO, buildings.json.bak-MIASTO. Nowe pliki (auto-manage.ts, auto-manage-test.cjs) bez bak.

## ZMIENIONE PLIKI
| Plik | Akcja |
|---|---|
| src/game/auto-manage.ts | NOWY (autoManageCity) |
| tools/auto-manage-test.cjs | NOWY (26/26) |
| src/game/cities.ts | + maMur?: boolean |
| data/buildings.json | budynek 'mury' + odblokowuje: maMur |
