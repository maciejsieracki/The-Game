# EKONOMIA — Dokumentacja deweloperska (The Game / projekt Civ)

> **Zakres:** lane **EKONOMIA** gry 4X „The Game" (v0.1: epoki Kamień + Brąz).
> **Autor:** sesja Civ-EKONOMIA (architekt). **Data:** 2026-06-23.
> **Status:** moduły logiki gotowe; wpięcie w pętlę tury po stronie SILNIK (kontrakty niżej).
> **Źródła prawdy:** `Spec-ekonomia.md` (wzory §1–§8), `PROJEKT-GRY-master.md` (§2, §2a, §2b, §8e).
> Ten dokument opisuje **co faktycznie powstało w kodzie** i jak to spina się z resztą gry.

---

## 0. Skrót dla zabieganych (TL;DR)

EKONOMIA dostarcza **czyste moduły logiki** (bez DOM/THREE), które liczą gospodarkę miasta na turę:

| Plik | Rola | Stan |
|---|---|---|
| `src/game/economy.ts` | Plony pól, podział Handlu (Nauka/Pieniądz/Luksus) i Pracy, wzrost ludności, korupcja, postęp produkcji | wpięty (przez turn-economy) |
| `src/game/turn-economy.ts` | Adapter runtime→logika + tick całej gospodarki na turę | wpięty |
| `src/game/upkeep.ts` | Magazyny (żywność/surowce) + utrzymanie (budynki/jednostki) + bilans skarbca | **gotowy, niewpięty** |
| `src/game/converters.ts` | Przetwórstwo surowców (Tartak/Mielerz/Cegielnia/Huta/Garncarnia) | **gotowy, niewpięty** |
| `gra/data/econ-params.json` | Wszystkie liczby (strojone per poziom trudności) | źródło wartości |
| `Ekonomia-parametry.xlsx`, `Surowce.xlsx`, **`EKONOMIA-panel-parametrow.xlsx`** | Panele sterowania → eksport do JSON | panel dla Maciej |

Wszystkie wartości liczbowe są w `econ-params.json` i sterowalne z Excela (sekcja 9).

---

## 1. Miejsce EKONOMII w grze

Gra to tury. W każdej turze, dla **każdego miasta**, liczymy „Bilans/turę": ile Pracy, Handlu
(→ Nauka/Pieniądz/Luksus), Żywności netto, surowców i utrzymania. Rdzeń ekonomii (wyróżnik gry):

```
Waluta bazowa = PRACA.  Wynalazki pieniężne mnożą jej wartość:
Praca → Pieniądz (×10) → Pieniądz fiducjarny (×100) → Energia (×1000)
```

W v0.1 (Kamień+Brąz) liczą się przede wszystkim **plony z terenu**; budynki są dodatkiem i
**samodzielnym źródłem** Pracy/Pieniądza (master §8e). Role zasobów:

- **Praca** — prace w terenie + budowa budynków. Suwak dzieli Pracę netto na *Budynki* (kolejka produkcji) i *Teren* (ulepszenia heksów).
- **Handel** — suwak dzieli Handel netto na *Naukę*, *Pieniądz* (skarbiec) i *Luksus* (zadowolenie).
- **Pieniądz** — globalny skarbiec w stolicy; kupno/utrzymanie jednostek i budynków. Kurs 1 Pieniądz = 1 Praca.
- **Żywność** — żywi ludność i wojsko; nadwyżka rośnie w Spichlerzu → wzrost miasta.
- **Surowce** — drewno/kamień/glina/ruda + przetworzone (deski/paliwo/cegła/brąz/ceramika); magazynowane lokalnie z limitem.

---

## 2. Mapa plików (co gdzie)

```
gra/src/game/
  economy.ts        <- moje: plony, podzial Handlu/Pracy, wzrost, korupcja, produkcja
  turn-economy.ts   <- moje: adapter + tick gospodarki na ture
  upkeep.ts         <- moje: magazyny + utrzymanie + bilans skarbca
  converters.ts     <- moje: przetworstwo surowcow (s.1.5)
  player-economy.ts <- ORPHAN (cudzy/dubel; do konsolidacji z upkeep.ts; NIE moj)
gra/data/
  econ-params.json  <- wszystkie parametry ekonomii (4 grupy)
  resources.json    <- lista surowcow (typy, zrodla)
gra/tools/
  logic-test.cjs        <- Test 8 = gospodarka (advanceCityEconomy)  [wspolny harness]
  upkeep-test.cjs       <- moje: 51 asercji s.6/s.7
  converters-test.cjs   <- moje: 30 asercji s.1.5
Civ/ (dokumenty)
  Spec-ekonomia.md                 <- wzory zrodlowe §1-§8
  Ekonomia-parametry.xlsx          <- panel -> econ-params.json (ekonomia_miasta, budynki)
  Surowce.xlsx                     <- panel -> resources.json
  EKONOMIA-panel-parametrow.xlsx   <- NOWY: pelny panel wszystkich parametrow + mapowanie JSON
  dyspozycje/_handoff/EKONOMIA-*.md <- kontrakty wpiec dla SILNIK
```

**Żelazna zasada lane'u:** EKONOMIA edytuje wyłącznie `economy.ts`, `turn-economy.ts`,
`upkeep.ts`, `converters.ts` + swoje Excele. `main.ts`, render, battle, cudze `game/*` i cudze
JSON — **nie ruszamy**. Kanon `Gra-podglad.html` publikuje tylko SILNIK.

---

## 3. Przepływ danych — pełny pipeline tury (jednego miasta)

```
                       ┌──────────────────────────────────────────────────────────┐
  MAPA/teren  ──────►  │ workedTilesForCity(city, map)  (centrum + 6 sasiadow)     │
  (hex.terenBazowy,    └──────────────────────────────────────────────────────────┘
   nakladka, rzeka)                       │  WorkedTile[]
                                          ▼
  econ-params.json ─► buildEconParams ─► ┌───────────────────────────────────────────┐
                       (EconParams)      │ cityYieldPerTurn(city, tiles, buildings,    │
  budynki miasta ───────────────────────►│   params, ctx)  =  RDZEN (economy.ts)      │
  ctx (Mlyn/Cegielnia/                   └───────────────────────────────────────────┘
   Targowisko/Biblioteka/                                │ CityYieldResult
   Mennica, korupcja,                                    │ {praca, pieniadz, zywnosc,
   zuzycie zywnosci wojska)                              │  nauka, luksus, kultura,...}
                                                         ▼
                                   ┌─────────────────────────────────────────┐
                                   │ populationGrowth(city, zywnosc, params)  │  (economy.ts)
                                   │  -> wzrost/ubytek + magazynZywnosci       │
                                   └─────────────────────────────────────────┘
                                                         │
        (SUFIT magazynu — KONTRAKT, jeszcze niewpiety)   ▼
                          upkeep.foodStorageCapacity ─► min(magazyn, pojemnosc)

  Praca (na Budynki) ─► productionProgress(koszt, postep, pracaPerTurn) ─► ukonczony budynek/jedn.

  Surowce z pol ─► (KONTRAKT) converters.runConverters(...) ─► deski/paliwo/cegla/braz/ceramika
                                          │ (limit: upkeep.resourceStorageCapacityPerType)
  Jednostki ─► (KONTRAKT) upkeep.militaryFoodConsumption ─► ctx.wojskoZuzycieZywnosci
  Skarbiec  ─► (KONTRAKT) upkeep.upkeepBalance(income, budynki, jednostki) ─► saldo/deficyt
```

`advanceCityEconomy(cities, map, data, difficulty)` (turn-economy.ts) wykonuje to dla wszystkich
miast i zwraca agregat `EconomyTickResult` dla HUD. **Linie przerywane = kontrakty, które wpina SILNIK**
(sekcja 11).

---

## 4. Moduł `economy.ts` — rdzeń gospodarki miasta

Czysty moduł. Importuje tylko typy terenu (`TerenBazowy`, `Nakladka`) z `../types/hex`.

### 4.1 Plony pól — `tileYield(tile: WorkedTile): TileYield`

Bazowe plony terenu (tabela wbudowana, zgodna ze `Spec §1.1` / `Plony-terenow.xlsx`):

| Teren | Żywność | Praca | Handel | Drewno | Kamień |
|---|---|---|---|---|---|
| Łąka | 4 | 1 | 1 | 1 | 0 |
| Równina | 2 | 1 | 1 | 2 | 1 |
| Wzgórza | 1 | 2 | 0 | 2 | 2 |
| Góry | 0 | 0 | 0 | 2 | 5 |
| Wybrzeże | 3 | 2 | 2 | 0 | 0 |
| Morze | 2 | 0 | 2 | 0 | 0 |
| Pustynia | 0 | 0 | 1 | 0 | 0 |

Nakładki (dodawane do pola): **Rzeka** `+3 żywność, +2 Praca, +2 Handel`; **Las** `−1 żywność, −1 Handel, +3 Drewno`.
Wynik per pole jest podłogowany do 0 (`Math.max(0, …)`).

> ⚠️ **Znana luka:** `economy.ts` ma te modyfikatory **zaszyte na sztywno** (`RIVER_MODIFIER`,
> `FOREST_MODIFIER` = wartości „normal"), a nie czyta `econ-params.json → teren_mapa.*`
> (`teren_rzeka_*`, `teren_las_*`). Skutek: różnice easy/hard dla rzeki/lasu nie działają.
> TODO: podpiąć `teren_mapa.*` (kontrakt do uzgodnienia z DANE/SILNIK). Bazowe plony terenów
> z założenia są w `Plony-terenow.xlsx` (lane MAPA/DANE), nie w mojej gestii.

### 4.2 RDZEŃ — `cityYieldPerTurn(city, workedTiles, cityBuildings, params, ctx): CityYieldResult`

Kolejność obliczeń (każdy krok wg `Spec §1–§3`):

1. **Suma plonów pól** (Żywność/Praca/Handel) z obrabianych pól.
2. **Młyn** (jeśli `ctx.maMlyn`): `Praca = Σ × mnoznikPracy + bonusPracy` (np. ×2 +2). **Cegielnia** (`ctx.maCegielnia`): `×(1 + bonusCegielni)` (np. +25%), nakładana po Młynie.
3. **Targowisko** (`ctx.maTargowisko`): `Handel = Σ × (1 + bonusTargowiska)` (np. +50%).
4. **Budynki jako baza** (master §8e): sumuje `baza` budynków dla `praca, pieniadz, zywnosc, nauka, kultura, zadowolenie` przez `buildingValue`.
5. **Mnożnik budynków** (pole `mnoznik`, tylko niemilitarne): `Praca_łączna = (PracaPól + PracaBudynków) × (1 + Σmnoznik%/100)`.
6. **Korupcja/marnotrawstwo** (`ctx.strataFraction`, cap `params.korupcjaCap`): `Praca_netto = … × (1 − strata)`, `Handel_netto = Handel_brutto × (1 − strata)`.
7. **Podział Handlu** suwakiem (`city.podziałHandlu`): `Nauka = floor(Handel_netto × %Nauka)`, `Pieniądz = floor(Handel_netto × %Pieniądz × ctx.mennicaMnoznik)`, `Luksus = floor(Handel_netto × %Luksus)`.
8. **Biblioteka** (`ctx.maBiblioteka`): `Nauka_lokalna = floor((NaukaZHandlu + NaukaBudynków) × (1 + bonusBiblioteki))`.
9. **Pieniądz razem** = PieniądzZHandlu + PieniądzBudynków + specjaliści (Poborca +2/turę).
10. **Żywność netto** = ŻywnośćBrutto − (ludność × zużyciePop + `ctx.wojskoZuzycieZywnosci`).

Wszystkie wyniki podłogowane (`Math.floor`). Zwraca:

```ts
interface CityYieldResult {
  praca; pieniadz; zywnosc; nauka; luksus; kultura; zadowolenie;   // strumienie netto
  zywnoscBrutto; handelBrutto; pracaTerenu; pracaBudynkow;          // pod HUD/debug
}
```

> **Co dodała EKONOMIA w tej sesji (pkt 1):** pole `luksus` (strumień Luksus ze suwaka — wcześniej
> przepadał, §2.1); bonus **Biblioteki → +Nauka%** (`ctx.maBiblioteka` opcjonalne + param); naprawa
> zepsutego `loadEconParams`; wyniesienie współczynnika zdrowia z hardkodu do parametru. Zmiany są
> **additive/wstecznie kompatybilne** (oddane SILNIK przez `_handoff/EKONOMIA-do-SILNIK-economy-edits.md`).

### 4.3 Wzrost ludności — `populationGrowth(city, zywnoscNetto, params): PopulationGrowthResult`

Reguły (`Spec §4`):

- **Modyfikator zdrowia:** `mod = max(0, 1 + zdrowie × params.zdrowieModyfikatorWspolczynnik)` (domyślnie 0.05). `efektywnaŻywność = zywnoscNetto × mod`.
- **Bez Spichlerza:** nadwyżka przepada; przy deficycie i ludności > 1 → −1 ludność (głód). Magazyn = 0.
- **Ze Spichlerzem:** `magazyn += floor(efektywnaŻywność)`. Jeśli magazyn < 0 → głód (−1 ludność, magazyn=0).
- **Próg wzrostu:** `Próg(N) = 10 + N × params.progWzrostuWspolczynnik`. Gdy `magazyn ≥ Próg` i `ludność < cap` → +1 ludność; `magazyn = floor(magazyn × spichlerzZachowaniePoPrzroscie)` (zostaje ~50%).
- **Cap bez Akweduktu:** `params.akweduktProgLudnosci` (np. 6). Z Akweduktem cap zdjęty.

> ⚠️ **Sufit magazynu (§7.1) NIE jest tu stosowany** — `populationGrowth` kumuluje żywność bez
> górnego limitu. Limit (Spichlerz ×5 itd.) liczy `upkeep.foodStorageCapacity` i musi być nałożony
> przy wpięciu (kontrakt 11.2).

### 4.4 Postęp produkcji — `productionProgress(koszt, postep, pracaPerTurn)`

`nowyPostęp = postep + floor(pracaPerTurn)`; gdy `≥ koszt` → `{completed:true, remainder}`. Praca na
budynki = `floor(yield.praca × %Budynki)` (suwak Pracy). Wykup za Pieniądz: kurs 1:1 (kontrakt MIASTO).

### 4.5 Korupcja — `corruptionRate(dystans, liczbaMiast, params)`

`Strata% = min(cap, dystans × wsp.Dystansu + liczbaMiast × wsp.Miast)`, zwraca ułamek [0, cap].
Stolica: dystans = 0. Wynik podajesz jako `ctx.strataFraction`.

### 4.6 Wartość budynku — `buildingValue(b, level, key)`

**Obecnie LINIOWO:** `baza[key] + (level − 1) × przyrost[key]`.
> 🟠 **Decyzja otwarta (Q2):** projekt zakłada **+10% składany** `floor(baza × 1,10^(level−1))`
> zamiast liniowego. Czeka na akceptację mastera (dotyka MIASTO/produkcji). Patrz sekcja 10.

### 4.7 Parametry — `EconParams` i `loadEconParams(raw, difficulty)`

`loadEconParams` czyta `econ-params.json` (grupy `ekonomia_miasta`, `budynki`) z **bezpiecznymi
fallbackami** i tolerancją metadanych (`jednostka`, `opis`). Klucz `próg_wzrostu_wspolczynnik` ma
polski znak — czytany dosłownie (jak w działającym `buildEconParams`). Pełna lista pól → sekcja 9.

---

## 5. Moduł `turn-economy.ts` — adapter + tick tury

Spina sparse'owe runtime `City` z bogatym `EconomyCity` i wykonuje gospodarkę całego świata.

- **`buildEconParams(data, difficulty='normal')`** — runtime'owy loader `EconParams` (czyta zagnieżdżony JSON z fallbackami; ścieżka używana przez grę i testy).
- **`workedTilesForCity(city, map)`** — w v0.1 miasto obrabia **centrum + do 6 sąsiednich heksów** (offsety pointy-top). Pola spoza mapy pomijane.
- **`toEconomyCity(city, params, isCapital)`** — adapter; ustawia domyślne suwaki z params; pierwsze miasto właściciela = stolica.
- **`advanceCityEconomy(cities, map, data, difficulty)`** — dla każdego miasta: adapter → `cityYieldPerTurn` → `populationGrowth` → zapis `population`/`magazynZywnosci`. Zwraca `EconomyTickResult` (agregaty `totalPraca/Pieniadz/Nauka/Luksus/Kultura/Zywnosc`, `growth`, `starved`, `perCity[]`).

> **Stan integracji (ważne):** w obecnym tick **`ctx` jest zerowy**: `maMlyn/Cegielnia/Targowisko/
> Biblioteka/Mennica=false`, `strataFraction=0`, `wojskoZuzycieZywnosci=0`, brak budynków/specjalistów.
> Czyli gra liczy **tylko surowy teren**. Wpięcie budynków, korupcji, specjalistów, utrzymania i
> Mennicy to zadanie SILNIK (kontrakty 11). EKONOMIA dostarcza całą logikę — wystarczy podać `ctx`.

> **Co dodała EKONOMIA:** `CityEconomyTick.luksus` + `EconomyTickResult.totalLuksus` (agregat pod HUD).

---

## 6. Moduł `upkeep.ts` — magazyny + utrzymanie (gotowy, niewpięty)

Czysty moduł; importuje tylko **typ** `BuildingRecord` z `economy.ts`. Dwie części:

### 6.A Magazyny (Spec §7)

- **Parametry** `StorageParams` z `loadStorageParams(raw, diff)` (grupa `globalne`): `bazaZywnosc` (20), `bazaSurowce` (10/typ), `mnoznikMagazynu` (×5).
- **`foodStorageCapacity(maSpichlerz, p)`** = baza, lub baza×mnożnik ze Spichlerzem (20→100).
- **`resourceStorageCapacityPerType(maMagazyn, p)`** = 10→50 z Magazynem.
- **`clampStore(amount, capacity)`** → `{stored, overflow}`; nadwyżka ponad pojemność **przepada** (§7.1/7.2); ujemne → 0.
- **`applyFood(current, delta, capacity)`** — net żywności + sufit. **`applyResourceIntake(stores, intake, capPerType)`** — dorzuca surowce per typ z capem, zwraca nowy `CityStores` + `overflow` per typ (pod „pauzę" konwerterów).
- **`globalResourceCapacityPerType(flagiMagazynów, p)`** — pojemność globalna państwa per typ (§7.3).
- **`onCityLost()`** → pusty magazyn (utrata miasta = surowce przepadają). **`onCityConquered(winner, loser, foodCap, resCap)`** — zwycięzca przejmuje magazyn, przycięty do swojej pojemności (§7.3).

### 6.B Utrzymanie (Spec §6)

- **Parametry** `UpkeepParams` z `loadUpkeepParams`: `budynekUtrzymanieFlat` (1; gdy `undefined` → koszt per budynek z buildings.json), `jednostkaUtrzymanieStd` (1), `zywnoscJednostkaRuch` (1), `zywnoscJednostkaOboz` (0.5).
- **`buildingUpkeep(building, level, flatOverride?)`** — `flatOverride` (v0.1 płaski 1) albo `utrzymanie + (level−1)×przyrostUtrzymania`. **`totalBuildingUpkeep(...)`** sumuje.
- **`unitUpkeep(unit, table, std)`** — kolejność: dokładny `typeId` z `units.json` → domyślny per kategoria (`DEFAULT_UNIT_UPKEEP_BY_CATEGORY`: wsparcie/dystans ~1, wręcz ~2, konni/morskie ~3, super 0) → standard. **`buildUnitUpkeepTable(rows)`** buduje tabelę z `units.json`.
- **`militaryFoodConsumption(units, p)`** — Σ żywności: marsz/garnizon 1, obóz 0.5 (§6.3). **To zasila `ctx.wojskoZuzycieZywnosci`.**
- **`upkeepBalance(income, buildings, units, table, p)`** → `{utrzymanieBudynki, utrzymanieJednostki, utrzymanieRazem, saldo, deficyt}` (§6.4/§8.4). `income` = suma Pieniądza miast (np. `totalPieniadz` z ticku) + ewentualne podatki.

**Test:** `tools/upkeep-test.cjs` → **51/51 PASS** (przykłady spec: 20→100, 10→50, global 160, podbój, 4 obozy=2, saldo 8−17=−9).

---

## 7. Moduł `converters.ts` — przetwórstwo surowców (gotowy, niewpięty)

Realizuje `Spec §1.5`: budynki przetwórcze zamieniają surowce 1:1 do swojej przepustowości/turę,
pauzują przy braku wejścia lub pełnym magazynie wyjścia. **Data-driven** (receptury jako dane).

Domyślne receptury `DEFAULT_CONVERTER_RECIPES` (kolejność = łańcuch; paliwo z Mielerza zasila resztę):

| id | Wejście | Wyjście | Param przepustowości |
|---|---|---|---|
| tartak | 1 drewno | 1 deski | `budynek_tartak_przepustowosc` |
| mielerz | 1 drewno | 1 paliwo | `budynek_mielerz_przepustowosc` |
| cegielnia | 1 glina + 1 paliwo | 1 cegla | `budynek_cegielnia_przepustowosc` |
| huta | 1 ruda + 1 paliwo | 1 braz | `budynek_huta_przepustowosc` |
| garncarnia | 1 glina + 1 paliwo | 1 ceramika | `budynek_garncarnia_przepustowosc` |

- **`runConverter(recipe, stores, throughput, outputCapacity)`** → `{produced, cykle, consumed, stores, reason}`. `cykle = min(przepustowość, limitWejścia, wolneMiejsceWyjścia)`. `reason ∈ {ok, brak-wejscia, pelny-magazyn, zero-przepustowosci}`.
- **`runConverters(recipes, stores, throughputs, capacityOf)`** — uruchamia łańcuch po kolei na wspólnym magazynie.
- **`loadThroughput(raw, paramKey, diff, fallback)`** — czyta `budynki.budynek_*_przepustowosc`.

> ⚠️ **Zależność kluczy:** `converters.ts` używa kluczy **ASCII** (`drewno, deski, paliwo, glina,
> cegla, ruda, braz, ceramika`), a `resources.json` ma diakrytyki (`Cegła`, `Brąz`, `Kamień`).
> **Wymagany mapping** na styku integracji — rekomendacja: dodać kolumnę ASCII `id` w `Surowce.xlsx`
> → `resources.json` (zadanie DANE). Moduł jest receptur owy, więc integrator może podać własne klucze.

**Test:** `tools/converters-test.cjs` → **30/30 PASS** (limit przepustowości/wejścia/wyjścia, pauza, łańcuch Mielerz→Huta w jednej turze).

---

## 8. Reguły ekonomii (Spec §1–§8) → mapowanie na kod

| Reguła (Spec) | Gdzie w kodzie |
|---|---|
| §1.1 Plony terenów + nakładki | `economy.tileYield` (+ TODO `teren_mapa.*`) |
| §1.2 Praca brutto + Młyn/Cegielnia | `economy.cityYieldPerTurn` krok 2 |
| §1.3 Handel brutto + Targowisko + Poborca | `cityYieldPerTurn` kroki 3, 9 |
| §1.4 Żywność netto | `cityYieldPerTurn` krok 10 |
| §1.5 Konwertery surowców | **`converters.ts`** |
| §2 Podział Handlu (Nauka/Pieniądz/Luksus) + Mennica | `cityYieldPerTurn` kroki 7–8 |
| §3 Podział Pracy (Budynki/Teren) | suwak w `EconomyCity.podziałPracy`; `productionProgress` |
| §4 Wzrost miast (Spichlerz, próg, zdrowie, Akwedukt) | `economy.populationGrowth` |
| §5 Korupcja/marnotrawstwo | `economy.corruptionRate` → `ctx.strataFraction` |
| §6 Utrzymanie budynków/jednostek + żywność wojska | **`upkeep.ts`** (część B) |
| §7 Magazyny: pojemność, overflow, globalna, podbój | **`upkeep.ts`** (część A) |
| §8 Skarbiec centralny + bilans + kurs 1:1 | `upkeep.upkeepBalance` (+ skarbiec: playerState/SILNIK) |
| §8e Budynki = płaska baza Pracy/Pieniądza | `cityYieldPerTurn` krok 4 (`buildingValue` baza) |

---

## 9. Parametry — panel sterowania i mapowanie na JSON

**Wszystkie liczby ekonomii są w `gra/data/econ-params.json`** w 4 grupach, każdy parametr ma
`easy/normal/hard` + `jednostka` + `opis`. Panel do edycji: **`EKONOMIA-panel-parametrow.xlsx`**
(arkusz „Parametry" — pełna lista; „Proponowane" — parametry do dodania; „Surowce-konwertery";
„Jak-uzywac"). Workflow: zmieniasz liczbę w Excelu → przepisujesz tę samą liczbę pod właściwy
**klucz JSON** w `econ-params.json` → SILNIK przebudowuje (`npx vite build`).

### 9.1 ⚠️ Konwencja jednostek (krytyczne przy edycji!)

Parametry mają **dwie konwencje** procentów — pomyłka = błędny balans:

- **Ułamek** (`0.25` = 25%, używane wprost jako `1 + x`): `budynek_cegielnia_bonus_pracy`, `budynek_targowisko_bonus_handlu`, `budynek_biblioteka_bonus_nauki`, `spichlerz_zachowanie_po_wzroscie`, (proponowany) `zdrowie_modyfikator_wspolczynnik`.
- **Liczba procentowa** (`60` = 60%, kod dzieli przez 100): `suwak_handel_*`, `suwak_praca_*`, `korupcja_cap`.
- **Mnożnik** (`×`): `budynek_mlyn_mnoznik_pracy`, `budynek_mennica_mnoznik`, `mennica_mnoznik_po_walucie`, `magazyn_mnoznik_spichlerz`.
- **Liczba bezwzględna**: progi, pojemności, koszty utrzymania, plony.

### 9.2 Pełna lista (wartość = normal; pełne easy/normal/hard w Excelu)

**Grupa `ekonomia_miasta`** (czyta `loadEconParams`/`buildEconParams`):

| Klucz JSON | normal | Jedn. | Używane przez |
|---|---|---|---|
| `próg_wzrostu_wspolczynnik` | 8 | per ludność | `populationGrowth` |
| `spichlerz_zachowanie_po_wzroscie` | 0.5 | ułamek | `populationGrowth` |
| `akwedukt_prog_ludnosci` | 6 | ludność | `populationGrowth` (cap) |
| `zywnosc_zuzytka_populacja` | 1 | żywność/os | `cityYieldPerTurn` (k.10) |
| `zywnosc_jednostka_ruch` | 1 | żywność | `upkeep.militaryFoodConsumption` |
| `zywnosc_jednostka_oboz` | 0.5 | żywność | `upkeep.militaryFoodConsumption` |
| `suwak_handel_nauka_domyslnie` | 60 | % | podział Handlu |
| `suwak_handel_pieniadz_domyslnie` | 30 | % | podział Handlu |
| `suwak_handel_luksus_domyslnie` | 10 | % | podział Handlu (**Luksus**) |
| `suwak_praca_budynki_domyslnie` | 70 | % | podział Pracy |
| `suwak_praca_teren_domyslnie` | 30 | % | podział Pracy |
| `korupcja_wspolczynnik_dystansu` | 2 | per pole | `corruptionRate` |
| `korupcja_wspolczynnik_miast` | 1 | per miasto | `corruptionRate` |
| `korupcja_cap` | 50 | % | `corruptionRate`/`cityYieldPerTurn` |

**Grupa `budynki`:**

| Klucz JSON | normal | Jedn. | Używane przez |
|---|---|---|---|
| `budynek_mlyn_mnoznik_pracy` | 2 | × | `cityYieldPerTurn` (Młyn) |
| `budynek_mlyn_bonus_pracy` | 2 | Praca | `cityYieldPerTurn` (Młyn) |
| `budynek_cegielnia_bonus_pracy` | 0.25 | ułamek | `cityYieldPerTurn` (Cegielnia) |
| `budynek_targowisko_bonus_handlu` | 0.5 | ułamek | `cityYieldPerTurn` (Targowisko) |
| `budynek_mennica_mnoznik` | 1 | × | `cityYieldPerTurn` (Mennica, bazowy) |
| `budynek_biblioteka_bonus_nauki` | 0.5 | ułamek | `cityYieldPerTurn` (**Biblioteka**) |
| `budynek_tartak_przepustowosc` | 2 | szt/turę | `converters` (Tartak) |
| `budynek_mielerz_przepustowosc` | 2 | szt/turę | `converters` (Mielerz) |
| `budynek_cegielnia_przepustowosc` | 2 | szt/turę | `converters` (Cegielnia) |
| `budynek_huta_przepustowosc` | 1 | szt/turę | `converters` (Huta) |
| `budynek_garncarnia_przepustowosc` | 1 | szt/turę | `converters` (Garncarnia) |
| `utrzymanie_budynek` | 1 | Pieniądz/turę | `upkeep.buildingUpkeep` |

**Grupa `globalne`:**

| Klucz JSON | normal | Jedn. | Używane przez |
|---|---|---|---|
| `kurs_pieniadz_praca` | 1 | 1:1 | wykup budynków (MIASTO) |
| `mennica_mnoznik_po_walucie` | 1.5 | × | **gating Mennicy po Walucie** (kontrakt) |
| `luksus_przelicznik_zadowolenie` | 5 | Luksus/+1 | **Luksus→Zadowolenie** (lane ORDER) |
| `magazyn_baza_zywnosc` | 20 | żywność | `upkeep.foodStorageCapacity` |
| `magazyn_baza_surowce` | 10 | szt/typ | `upkeep.resourceStorageCapacityPerType` |
| `magazyn_mnoznik_spichlerz` | 5 | × | `upkeep` (pojemności) |
| `utrzymanie_jednostka_standard` | 1 | Pieniądz/turę | `upkeep.unitUpkeep` |
| `skarbiec_centralny_lokalizacja` | stolica | miasto | reguła skarbca (playerState) |

**Grupa `teren_mapa`** (rzeka/las/ulepszenia): `teren_rzeka_{zywnosc,praca,handel}`, `teren_las_{zywnosc,handel,drewno}`, `ulepszenie_{farma,irygacja,kopalnia,droga,pastwisko_*}`. ⚠️ Część (`teren_rzeka_*`, `teren_las_*`) **na razie nie jest czytana** przez `economy.ts` (hardkod) — TODO 4.1. Ulepszenia (farma/irygacja/kopalnia/pastwisko) konsumuje lane MAPA/MIASTO przy budowie heksów.

### 9.3 Parametry PROPONOWANE (do dodania do JSON)

| Klucz (proponowany) | Grupa | normal | Po co |
|---|---|---|---|
| `zdrowie_modyfikator_wspolczynnik` | ekonomia_miasta | 0.05 | wsp. zdrowia we wzroście (kod już czyta, dziś fallback) |
| `awans_budynku_mnoznik` | budynki | 1.10 | jeśli master zatwierdzi +10% składany (Q2) |
| `podatek_stawka_domyslnie` | ekonomia_miasta | 0.0 | podatki (domyślnie wyłączone, §2a) — po decyzji mastera |

---

## 10. Przyjęte założenia i decyzje otwarte

| Temat | Przyjęte założenie | Status |
|---|---|---|
| **Q2 awans budynków** | +10% składany `floor(baza×1,10^(lvl−1))` zamiast liniowego | 🟠 czeka na mastera (dotyka MIASTO) |
| **Sufit magazynu żywności** | nałożyć `upkeep.foodStorageCapacity` na `magazynZywnosci` | kontrakt do SILNIK (11.2) |
| **Mennica/Waluta** | przed Walutą mnożnik=1; po Walucie+Mennicy = `mennica_mnoznik_po_walucie` | kontrakt (11.4) |
| **Podatki** | minimalny `floor(populacja×stawka)`, domyślnie 0 (neutralny) | 🟠 czeka na decyzję mastera o formule |
| **Luksus→Zadowolenie** | 5 Luksus = +1 (`luksus_przelicznik_zadowolenie`) | należy do lane ORDER (11.5) |
| **player-economy.ts** | konsolidacja do `upkeep.ts` (kanon utrzymania) | rekomendacja, decyzja SILNIK |

Pełny opis: `dyspozycje/_handoff/EKONOMIA-zalozenia-i-wiazania.md`.

---

## 11. Stan integracji + kontrakty wpięcia (dla SILNIK)

Logika jest gotowa; brakuje podania jej danych w pętli tury. Co trzeba wpiąć:

**11.1 Kontekst miasta (`ctx`) w `advanceCityEconomy`.** Dziś zerowy. Wypełnić z realnego stanu
miasta: flagi budynków (`maMlyn/Cegielnia/Targowisko/Biblioteka/Mennica`), `strataFraction` z
`corruptionRate(dystans, liczbaMiast, params)`, lista budynków (`cityBuildings`), specjaliści,
`wojskoZuzycieZywnosci` (11.3).

**11.2 Sufit magazynu żywności.** Po `populationGrowth`: `city.magazynZywnosci = min(city.magazynZywnosci, upkeep.foodStorageCapacity(maSpichlerz, storageParams))`. (Patch po stronie `turn-economy.ts` — plik read-only dla EKONOMII, więc przez handoff.)

**11.3 Utrzymanie i żywność wojska.** `ctx.wojskoZuzycieZywnosci = upkeep.militaryFoodConsumption(unitsWMieście)`; po sumie Pieniądza → `upkeep.upkeepBalance(income, budynki, jednostki, table, p)` → potrącenie ze skarbca + flaga deficytu.

**11.4 Konwertery.** Po zebraniu surowców per miasto: `converters.runConverters(receptury_wybudowanych, magazynMiasta, throughputs, key => upkeep.resourceStorageCapacityPerType(maMagazyn, p))`.

**11.5 Mennica gating.** `ctx.mennicaMnoznik = (Waluta_odkryta && maMennica) ? params.mennica_mnoznik_po_walucie : 1`.

Handoffy: `_handoff/EKONOMIA-do-SILNIK-economy-edits.md`, `…-upkeep.md`, `EKONOMIA-zalozenia-i-wiazania.md`.

---

## 12. Interakcje z innymi działami gry

> ℹ️ Zmapowane na **realną listę sesji** (z ekranu Maciej): Civ-Master, Civ-EKONOMIA,
> Civ-Dyplomacja, Civ-Dane Cywilizacji, Civ-Units/Battle, Civ-MAPA, Civ-Silnik, Civ-UI,
> Civ-MIASTO, Civ-AI. Poniżej każdy dział + kontrakt z ekonomią.

**Civ-Master (koordynacja).** Nie koduje — recenzuje dostawy wg DoD i wydaje dyspozycje. Odbiorca
moich raportów (`EKONOMIA-DO-MASTERA.md`) i decydent w sprawach spornych (Q2, podatki, lek OneDrive).

**SILNIK (pętla tury / kanon).** Właściciel `main.ts`. Wpina moje moduły (sekcja 11), woła
`advanceCityEconomy` co turę, publikuje kanon. Ja dostarczam logikę + `ctx`; on dostarcza realny stan.

**MIASTO (produkcja / budynki).** Konsumuje **Pracę→Budynki** przez `productionProgress`; korzysta z
`buildingValue` i `buildings.json`. **Q2 (+10% składany) dotyczy go wprost** — koszty/efekty
poziomów budynków. Styk produkcja↔ekonomia przez `_handoff/`.

**UI (panel miasta / HUD / suwaki).** `cityPanel.ts` buduje `CityYieldContext` i pokazuje
`CityYieldResult` (w tym **nowe `luksus`**). HUD „Bilans/turę" czyta `EconomyTickResult`
(w tym `totalLuksus`, `growth`, `starved`). Suwaki Handlu (Nauka/Pieniądz/Luksus) i Pracy
(Budynki/Teren) ustawiają `city.podziałHandlu`/`podziałPracy`. Bibliotekę UI poda przez istniejący
hook `getCityBuildingFlags` (`maBiblioteka` jest opcjonalne → zero zmian wymaganych w UI).

**SPOŁECZEŃSTWO / ORDER + kultura-religia.** Odbiera **Luksus → Zadowolenie**
(`luksus_przelicznik_zadowolenie`, 5=+1). `zadowolenie` z budynków liczy już `cityYieldPerTurn`;
sumę Luksus (`totalLuksus`/per-miasto `luksus`) ma skonsumować order/culture-religion. To **nie mój
lane** — tylko udostępniam wartość.

**RESEARCH / playerState.** Trzyma skarbiec (Pieniądz) i pulę Nauki oraz epokę/technologie.
`nauka` z ekonomii zasila drzewko. Technologia **Waluta** odblokowuje mnożnik Mennicy (11.5).
Skarbiec centralny (stolica) przyjmuje Pieniądz i płaci utrzymanie (`upkeepBalance`).

**UNITS / BITWA.** Jednostki niosą `typeId`/`category` (→ `unitUpkeep`) oraz stan **obozowania**
(→ `militaryFoodConsumption`: marsz 1 / obóz 0.5). `units.json` dostarcza tabelę utrzymania
(`buildUnitUpkeepTable`). Koszt jednostki = Praca + 1 ludność + surowiec (master §6), kupno za Pieniądz.

**Civ-Dane Cywilizacji (DANE).** `resources.json` (klucze surowców — potrzebny mapping ASCII dla
konwerterów, 7) i `civs.json`. `Plony-terenow.xlsx`/`Budynki.xlsx` → bazowe plony i definicje
budynków. **Cechy ekonomiczne cywilizacji** (np. bonus do Handlu/Pracy/wzrostu, tańsze budynki,
ograniczenia zwierzęce wpływające na Pastwisko) wchodzą jako modyfikatory do `ctx`/`EconParams`
per gracz — kontrakt do uzgodnienia (dziś ekonomia jest cywilizacyjnie neutralna).

**Civ-MAPA (teren).** Dostarcza teren (`hex.terenBazowy`, `nakladka`, `rzeka`) konsumowany przez
`workedTilesForCity`/`tileYield`; rzeki na krawędziach (`map.riverPaths`). Ulepszenia heksów
(farma/irygacja/kopalnia/pastwisko, `econ-params.teren_mapa.ulepszenie_*`) — budowa po stronie MAPA/MIASTO.

**Civ-Dyplomacja.** Handel międzycywilizacyjny (master §2/§2a): **kupno Pracy/surowców od innego
gracza za Pieniądz**, umowy handlowe podnoszące Handel, trybut/transfery złota, embarga. Styk:
dyplomacja modyfikuje strumienie (Pieniądz/Handel) i może przesuwać surowce między graczami —
operuje na wynikach ekonomii (skarbiec, magazyny `upkeep`), nie na jej wzorach. Kontrakt: transfer
Pieniądza ze skarbca i surowców z magazynu (`upkeep` zna pojemności/zawartość) realizuje
dyplomacja+SILNIK; ja udostępniam wartości i kurs 1 Pieniądz = 1 Praca.

**Civ-AI (rywale).** AI prowadzi **tę samą ekonomię** (moje moduły są czyste → AI woła je tak samo
jak gracz). AI **czyta** wyniki, by decydować: `CityYieldResult`/`EconomyTickResult` (co produkować,
kiedy stawiać budynek), `upkeep.upkeepBalance` (czy stać go na jednostki — unikać deficytu),
`corruptionRate` (czy opłaca się nowe miasto), magazyny (czy budować Spichlerz/Magazyn). Kontrakt:
ekonomia nie zna AI — udostępnia deterministyczne funkcje i wyniki; `ai.ts` na ich podstawie planuje
budżet/rozbudowę. Ważne: utrzymanie i deficyt muszą być policzalne PRZED decyzją AI (stąd `upkeepBalance`).

**Diagram zależności (kto czego dostarcza/konsumuje):**

```
MAPA ─teren─► EKONOMIA ─CityYieldResult─► UI (panel/HUD)
DANE ─resources/budynki/cechy-cyw─► EKONOMIA ─luksus─► ORDER/kultura (zadowolenie)
UNITS/Battle ─typeId/oboz─► upkeep ─utrzymanie/zywnosc─► EKONOMIA ─Pieniadz/nauka─► RESEARCH(Waluta)/playerState
EKONOMIA ─Praca→Budynki─► MIASTO (produkcja)
EKONOMIA ─wyniki+upkeepBalance─► AI (decyzje budzet/rozbudowa)
Dyplomacja ─kupno Pracy/surowcow, trybut─► skarbiec/magazyny (upkeep) ◄─► EKONOMIA
SILNIK = wpina i wola wszystko w turze;  Master = recenzja + decyzje
```

---

## 13. Testy

| Test | Zakres | Wynik |
|---|---|---|
| `tools/logic-test.cjs` (Test 8) | `advanceCityEconomy` — tick, agregaty, magazyn ≥ 0, ludność ≥ 1 | zielony (gdy hydratacja OK) |
| `tools/upkeep-test.cjs` | §6 + §7: pojemności, overflow, global, podbój, utrzymanie, bilans | **51/51 PASS** |
| `tools/converters-test.cjs` | §1.5: limity, pauzy, łańcuch | **30/30 PASS** |
| niezależny check formuł | §2.1 (5/2/0), §4.4 (0.9/0.75/0) | **12/12 PASS** |

Uruchamianie z `gra/`: `node tools/upkeep-test.cjs`, `node tools/converters-test.cjs`.
Build do testu: `npx vite build --outDir /tmp/civ-dist` (**nigdy** `npm run build`/`export-data.py`).

---

## 14. Znane ryzyka i pułapki

- **Dehydratacja OneDrive:** pliki edytowane narzędziem Write/Edit bywają **ucięte** w sandboxie bash → fałszywe błędy build/tsc (`Unexpected end of file`, `'*/' expected`). Read pokazuje pliki w całości. Lek: ustawić folder `Civ` na „Always keep on this device" (jednorazowo, Maciej). Workaround buildu w pamięci projektu (`civ-build-from-outputs-workflow`).
- **Konwencja procentów** (9.1) — ułamek vs liczba-procentowa vs mnożnik. Łatwo o pomyłkę przy edycji.
- **Diakrytyki w kluczach** (`próg_…`, klucze surowców) — kod ASCII, ale klucze JSON mają polskie znaki; konwertery wymagają mappingu ASCII (7).
- **`buildingValue` liniowy vs +10%** (Q2) — do rozstrzygnięcia przed strojeniem balansu budynków.
- **`teren_mapa` rzeka/las** — zaszyte w `economy.ts`, nie czyta paramów (4.1).

---

## 15. TODO / roadmap EKONOMIA

1. (master) decyzje: **Q2 +10% składany**, **formuła podatków**, lek OneDrive.
2. (SILNIK) wpięcia 11.1–11.5: `ctx`, sufit magazynu, utrzymanie, konwertery, Mennica.
3. (EKONOMIA) po decyzji Q2: podmiana `buildingValue` na składany (+ spójnie `upkeep`).
4. (EKONOMIA) podpięcie `teren_mapa.*` (rzeka/las) zamiast hardkodu — uzgodnić z DANE/MAPA.
5. (DANE) kolumna ASCII `id` w `Surowce.xlsx`/`resources.json` (mapping konwerterów).
6. (SILNIK) konsolidacja/usunięcie orphana `player-economy.ts`.
7. (po decyzji) podatki: param + `taxIncome` + suwak w UI.

---
*Koniec dokumentacji EKONOMIA. Pytania/zmiany kieruj do sesji Civ-EKONOMIA (kanał `dyspozycje/EKONOMIA.md`).*
