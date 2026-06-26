# MIASTO — dokumentacja deweloperska (architekt)
> Zakres sesji **Civ-MIASTO**: miasto + produkcja + budynki + SPOŁECZEŃSTWO (porządek / kultura / religia).
> Wersja: 2026-06-23. Wszystkie moduły logiki są CZYSTE (bez DOM/THREE), przetestowane w `tools/logic-test.cjs` (163/163).
> Status integracji: logika gotowa; wpięcie do pętli tury (`main.ts`) należy do sesji SILNIK (patrz §11).

## Spis treści
1. Przegląd i granice odpowiedzialności
2. Mapa plików (kod, dane, panele, narzędzia)
3. Przepływ danych: Excel → JSON → moduł (panel sterowania)
4. Model budynków (compound / procent składany)
5. Moduł `cities.ts` — zakładanie miast
6. Moduł `production.ts` — kolejka produkcji
7. Moduł `order.ts` — Porządek (stabilność)
8. Moduł `culture-religion.ts` — kultura i religia
9. Katalog wszystkich parametrów (gdzie się steruje)
10. Zależności i graf "kto co czyta"
11. Integracja z SILNIKIEM (pętla tury)
12. Interakcje z innymi działami gry
13. Komendy (build / testy / eksport)
14. Infrastruktura i znane ograniczenia
15. Co zostaje do zrobienia

---

## 1. Przegląd i granice odpowiedzialności
MIASTO odpowiada za logikę i dane czterech obszarów:

| Obszar | Plik logiki | Panel / dane (JSON) |
|---|---|---|
| Miasto jako obiekt (zakładanie, tożsamość) | `gra/src/game/cities.ts` | `miasto-params.json` |
| Produkcja (kolejka, koszty, Wykup/rekrutacja) | `gra/src/game/production.ts` | `buildings.json`, `units.json` (read-only), `miasto-params.json` |
| Budynki (model poziomów, efekty, koszty) | (dane) | `Budynki.xlsx` → `buildings.json` |
| Społeczeństwo — Porządek | `gra/src/game/order.ts` | `Spoleczenstwo-parametry.xlsx` → `society-params.json` |
| Społeczeństwo — Kultura / Religia | `gra/src/game/culture-religion.ts` | `society-params.json` |

ZASADY ŻELAZNE: tylko SILNIK rusza `main.ts` i publikuje kanon `Gra-podglad.html`. MIASTO dostarcza czystą logikę + dane + handoff. API modułów jest **zamrożone** — zmiany tylko addytywne (ogłaszane w `_handoff/`).

## 2. Mapa plików
KOD (lane MIASTO):
- `gra/src/game/cities.ts` — zakładanie miast (WPIĘTY w `main.ts`).
- `gra/src/game/production.ts` — kolejka produkcji (gotowy, do wpięcia).
- `gra/src/game/order.ts` — Porządek (gotowy, do wpięcia).
- `gra/src/game/culture-religion.ts` — kultura/religia (gotowy, do wpięcia).

DANE (JSON, w `gra/data/`):
- `buildings.json` — definicje budynków.
- `society-params.json` — parametry społeczeństwa (zdrowie, szczescie, kultura, religia, religie_cywilizacji, **porzadek**).
- `miasto-params.json` — stałe strojeniowe miasta/produkcji (NOWE).

PANELE STEROWANIA (Excel, źródło dla JSON):
- `Budynki.xlsx` → `buildings.json`.
- `Spoleczenstwo-parametry.xlsx` → `society-params.json`.
- `miasto-params.json` (edytowalny w skonsolidowanym `Panel-przeglad-danych.xlsx`, zakładka „Miasto-parametry").
- `Panel-przeglad-danych.xlsx` — **skonsolidowany, edytowalny** panel wszystkich danych gry (jedno źródło strojenia; moje zakładki: Budynki, Spoleczenstwo, Miasto-parametry).

NARZĘDZIA (w `gra/tools/`):
- `gen-dashboard.py` — generuje read-only `Panel-przeglad-danych.html` (podgląd wszystkich JSON).
- `gen-panel-xlsx.py` — generuje edytowalny `Panel-przeglad-danych.xlsx` (snapshot z JSON).
- `export-panel.py` — BEZPIECZNY eksport z `Panel-przeglad-danych.xlsx` → `buildings.json` + `society-params.json` + `miasto-params.json` (overlay; nie rusza cudzych JSON).
- `logic-test.cjs` — testy logiki (esbuild bundle + asercje).

DOKUMENTY: `dyspozycje/MIASTO-ZAKRES-I-PLAN.md`, `_handoff/MIASTO-do-SILNIK_integracja.md`, `_handoff/MIASTO-do-UI_kontrakt-produkcji.md`, `Schemat-dzialania-miasta.md`.

## 3. Przepływ danych (panel sterowania)
Decyzja Maciej: **jedno źródło strojenia** = `Panel-przeglad-danych.xlsx`.
```
Maciej edytuje liczby w Panel-przeglad-danych.xlsx
        │  (kolumny liczbowe = niebieskie; kolumna "Komentarz Maciej" = żółta, ignorowana przy eksporcie)
        ▼
python3 gra/tools/export-panel.py        # overlay wartości na ORYGINALNY JSON (zachowuje strukturę/typy)
        ▼
gra/data/{buildings,society-params,miasto-params}.json   # zaktualizowane liczby
        ▼
moduły TS importują JSON (Vite static import) → gra używa nowych wartości po buildzie
```
Bezpieczeństwo: `export-panel.py` nakłada tylko wartości pól istniejących w oryginale (puste komórki = brak zmiany), pisze WYŁĄCZNIE moje 3 JSON-y. Round-trip bez edycji = 0 zmian (pliki identyczne). NIGDY `npm run build` / `export-data.py` (globalny, nadpisuje cudze JSON).

## 4. Model budynków (compound / procent składany) — decyzja Maciej
Każdy budynek awansuje o **jeden poziom przy każdej zmianie epoki**. Wszystkie skalary (efekt, koszt budowy) rosną **procentem składanym** o mnożnik `budynek_mnoznik_poziomu` (= 1,10 = +10%/epokę).
```
poziom(budynek, miasto) = clamp( epoka_miasta − epokaWejścia + 1 , 1 , maksPoziom )
efekt(pole, poziom)     = baza[pole] × 1,10^(poziom−1)        # buildingEffectAtLevel()
koszt(poziom)           = round( kosztBudowy × 1,10^(poziom−1) )  # itemCost('budynek', …)
nazwa(poziom)           = nazwyPoziomow[poziom−1]
```
Przykład (baza=5, kosztBudowy=20):

| poziom | mnożnik | efekt (baza 5) | koszt (baza 20) |
|---|---|---|---|
| 1 | 1,000 | 5,00 | 20 |
| 2 | 1,100 | 5,50 | 22 |
| 3 | 1,210 | 6,05 | 24 |
| 4 | 1,331 | 6,66 | 27 |

LEGACY: pola `przyrost` (per-pole) i `przyrostKosztu` w `buildings.json` to STARY model liniowy. Compound je zastępuje, ALE pola zostają w schemacie, bo czytają je `economy.ts` (efekt ekonomiczny) i `siege.ts` (obrona murów) — migracja na compound to zadanie cross-lane (patrz §12).

## 5. `cities.ts` — zakładanie miast
Typ:
```ts
interface City { id: string; ownerId: number; q: number; r: number; name: string; population: number; magazynZywnosci?: number; }
const MIN_CITY_DISTANCE = miasto-params.min_dystans_miast (=5)
```
Reguły `canFoundCity(q, r, cities, map)` (kolejność):
1. heks istnieje w mapie — inaczej `reason='poza mapa'`,
2. nie Morze ani Wybrzeże — inaczej `reason='morze'`,
3. nie Góry — inaczej `reason='gory'`,
4. dystans (hexDistance) ≥ `MIN_CITY_DISTANCE` od KAŻDEGO miasta — inaczej `reason='za blisko innego miasta'`,
5. OK → `{ ok:true, reason:'' }`.
`foundCity(settler, cities, map, name)` → nowy `City` (population 1) lub `null` gdy `!ok`. NIE mutuje wejść (caller dodaje miasto + usuwa osadnika).
`cityName(index)` → deterministyczna nazwa z listy (Akropol, Memfis, Ur, Teby, Korynt, Sparta, Niniwa, Ateny, Knossos, Mykeny, Babilon, Tyr); fallback `'Miasto N'`.
WPIĘCIE: `main.ts` l.~978 (klawisz zakładania na osadniku) — DZIAŁA.

## 6. `production.ts` — kolejka produkcji
Typy:
```ts
type ProductionKind = 'budynek' | 'jednostka';
type ProductionItem = { kind; id; nazwa; koszt };
interface CityProduction { kolejka: ProductionItem[]; postep: number; wstrzymana?: boolean }
interface AdvanceProductionResult { prod: CityProduction; completed: ProductionItem | null }
```
API (czyste, niemutujące):
- `availableProduction(city, data, unlockedTechs, ctx?)` → lista do budowy. Budynki: epokaWejścia ≤ epoka, techUnlock spełniony, NIE zbudowane. Jednostki: epoka ≤ epoka, tech spełniony, tylko „podstawowe" (pomija nazwane zamienniki „W zamian za"). Sort: budynki→koszt→nazwa.
- `itemCost(kind, id, data, levelOrEpoch)` → budynek: `round(kosztBudowy × 1,10^(level−1))` (compound); jednostka: „Pieniadz (koszt)" → fallback wg roli → `DEFAULT_UNIT_COST` (10).
- `buildingProductionItem(id, data, level=1)`, `unitProductionItem(id, data)`.
- `frontItem(prod)`, `enqueue(prod, item)`, `dequeue(prod, index=0)` (zachowują `wstrzymana`).
- `advanceProduction(prod, pracaPerTurn)` → dolewa Pracę; gdy `wstrzymana` → brak postępu; gdy `postep ≥ front.koszt` → ukończenie (max 1/turę), reszta przechodzi na następny front.
- `rushCost(prod)` = `max(0, ceil(front.koszt − postep))` (Wykup, 1 Praca = 1 Pieniądz).
- `rushProduction(prod)` → natychmiastowe ukończenie frontu (jak `advanceProduction`).
- `setPaused(prod, bool)` — Wstrzymaj.
- `populationCostOf(item)` = jednostka → `UNIT_POPULATION_COST` (1), budynek → 0 (rekrutacja: −1 ludność; odjęcie + clamp do 1 robi caller/SILNIK).
- `buildingLevelForEpoch(epokaWejścia, cityEpoch, maksPoziom)`, `buildingEffectAtLevel(baza, poziom)`, `BUILDING_LEVEL_FACTOR` (1,10).
Stałe z `miasto-params.json`: `BUILDING_LEVEL_FACTOR`, `DEFAULT_UNIT_COST`, `UNIT_POPULATION_COST`, koszty wg roli.

## 7. `order.ts` — Porządek (stabilność)
Reguła (nazewnictwo: Szczęście = happiness, Prawo = governance/law, Porządek = output):
```
Porzadek = round( wagaSzczescie × szczescie + wagaPrawo × prawo )   # wagi 0,5/0,5; prawo=0 do czasu podsystemu Prawa
```
Progi i tier:
```
Porzadek < T1            → 'unrest'   (niepokój / ryzyko buntu)
T1 ≤ Porzadek < T2       → 'neutral'  (bez modyfikatorów)
Porzadek ≥ T2            → 'order'    (bonus stabilności)
```
Efekty (`orderEffects`):
- unrest: `productionMult = max(0, 1 + karaProdukcjaT1)`, `growthMult = max(0, 1 + karaWzrostT1)`, `tradeMult = 1`, `revoltRisk = clamp01(ryzykoBuntuT1)`.
- order: `productionMult = 1 + bonusProdukcjaT2`, `tradeMult = 1 + bonusHandelT2`, `growthMult = 1`, `revoltRisk = 0`.
- neutral: wszystko 1, brak ryzyka.
API: `loadOrderParams(society, difficulty)`, `computeOrder(inputs, params)`, `orderTier(order, params)`, `orderEffects(tier, params)`, `evaluateOrder(inputs, params)` (one-shot {order, tier, effects}). `FALLBACK_ORDER_PARAMS` gdy brak danych.
Dane: `society-params.json` → blok `porzadek` (9 param easy/normal/hard). Wartości NORMAL: T1=0, T2=6, karaProdukcja=−0,15, karaWzrost=−0,25, ryzykoBuntu=0,10, bonusProdukcja=0,10, bonusHandel=0,10. Easy łagodniej, Hard ostrzej.

## 8. `culture-religion.ts` — kultura i religia
KULTURA:
- `loadCultureParams(society, difficulty)` (blok `kultura`).
- `accumulateCulture(city, perTurn, params)` → kumuluje punkty kultury miasta.
- `cityBorderRadius(culturePoints, params)` → 0|1|2|3 (zasięg granic rośnie przy progach kultury).
- `cultureHappiness(city, params)` → wkład kultury w Szczęście (zależny od `ownCultureShare`).
RELIGIA:
- `loadReligionParams(society, difficulty)` (blok `religia`).
- `civReligion(civName, society)` → religia cywilizacji (z `religie_cywilizacji`).
- `dominantReligion(state, params)` → religia dominująca + % (próg `prog_dominacji`).
- `religionHappiness(state, ownReligion, params)` → wkład religii w Szczęście.
- `spreadReligion(source, neighbors, params, {hasSwiatynia, pressure, seed})` → szerzenie na sąsiednie miasta (deterministyczne dla seed; `makeRng`).
- `convertViaTemple(state, targetReligion, hasTemple, params)` → konwersja (np. po zdobyciu miasta).
Dane: `society-params.json` bloki `kultura`, `religia`, `religie_cywilizacji`.

## 9. Katalog parametrów (gdzie się steruje)
| Parametr(y) | Plik JSON | Panel (Excel) | Czyta (kod) |
|---|---|---|---|
| baza{praca,pieniadz,zywnosc,nauka,kultura,zadowolenie,obrona,mnoznik}, kosztBudowy, utrzymanie, epokaWejscia, maksPoziom, nazwyPoziomow, techUnlock | `buildings.json` | Budynki / Panel-przeglad-danych | production.ts, economy.ts*, siege.ts* |
| przyrost*, przyrostKosztu, przyrostUtrzymania (LEGACY) | `buildings.json` | jw. | economy.ts*, siege.ts*, player-economy.ts* |
| zdrowie_*, szczescie_*, kultura_*, religia_* (easy/normal/hard) | `society-params.json` | Spoleczenstwo / Panel | culture-religion.ts, (zdrowie→EKONOMIA) |
| religie_cywilizacji[] | `society-params.json` | Spoleczenstwo / Panel | culture-religion.ts |
| porzadek_* (waga_szczescie, waga_prawo, prog_t1, prog_t2, kara_produkcja_t1, kara_wzrost_t1, ryzyko_buntu_t1, bonus_produkcja_t2, bonus_handel_t2) | `society-params.json` | Spoleczenstwo / Panel | order.ts |
| min_dystans_miast | `miasto-params.json` | Miasto-parametry / Panel | cities.ts |
| budynek_mnoznik_poziomu | `miasto-params.json` | jw. | production.ts |
| jednostka_koszt_ludnosci, jednostka_koszt_domyslny, jednostka_koszt_rola_* | `miasto-params.json` | jw. | production.ts |

(* = konsument w innym lane — patrz §10/§12.)

## 10. Zależności — graf "kto co czyta"
```
buildings.json   ── production.ts (koszt/dostępność, compound)
                 ├─ economy.ts   (buildingValue: efekt ekonomiczny — LINIOWO z przyrost)   [CROSS-LANE]
                 └─ siege.ts     (mury.baza/przyrost.obrona — obrona)                       [CROSS-LANE]
miasto-params.json ── cities.ts (MIN_CITY_DISTANCE), production.ts (factor/koszty)
society-params.json ─ order.ts (porzadek), culture-religion.ts (kultura/religia/religie_cyw),
                       economy.ts (zdrowie/szczescie — częściowo)                            [STYK EKONOMIA]
units.json        ── production.ts (koszt jednostek — READ-ONLY; właściciel UNITS)
civs.json         ── culture-religion.civReligion (przez argument society/owner)             [STYK DANE]
production.ts     ── cityPanel.ts (UI: availableProduction/advanceProduction/enqueue/dequeue/itemCost…)
cities.ts         ── main.ts (SILNIK — WPIĘTE)
order/culture/production ── main.ts (SILNIK — DO WPIĘCIA, patrz §11)
GameData (loader.ts) wystawia: buildings, units, civs, societyParams, … (import statyczny Vite)
```

## 11. Integracja z SILNIKIEM (pętla tury)
Pełna instrukcja z komendami: **`dyspozycje/_handoff/MIASTO-do-SILNIK_integracja.md`**. Skrót:
- Miejsce: `main.ts`, blok „Per-turn economy tick" (~l.1037, po `advanceCityEconomy`).
- Stan trwały: `Map<cityId, CityProduction>`, `Map<cityId, string[]>` (zbudowane), `Map<cityId, ReligionState>`.
- Produkcja: per miasto `advanceProduction(prod, praca × orderEff.productionMult)`; `completed` → budynek do listy / jednostka → spawn + `population −= populationCostOf` (min 1). Wykup: `rushCost`/`rushProduction`. Panel: `configureCityPanel({ getProduction, setProduction, getEpoch, getBuiltBuildingIds, … })`.
- Porządek: `evaluateOrder({szczescie, prawo:0}, loadOrderParams(data.societyParams, difficulty))` → mnożniki produkcji/handlu + ryzyko buntu.
- Kultura/Religia: `accumulateCulture`+`cityBorderRadius`+`cultureHappiness`; religia (etap 2): `dominantReligion`/`religionHappiness`/`spreadReligion`/`convertViaTemple`.
- Szczęście (wejście Porządku) = suma zadowolenia budynków (`buildingEffectAtLevel(baza.zadowolenie, poziom)`) + `cultureHappiness` (+ `religionHappiness` w etapie 2).

## 12. Interakcje z innymi działami gry
Działy (sesje) projektu: **Master, EKONOMIA, Dyplomacja, DANE (Dane Cywilizacji), UNITS (Units/Battle), MAPA, SILNIK, UI, AI** oraz **MIASTO** (ten dokument). Poniżej styki MIASTA z każdym działem.

| Dział | Pliki / lane | Styk z MIASTEM | Kierunek |
|---|---|---|---|
| **Master** | koordynacja, recenzja DoD | Raporty MIASTO-DO-MASTERA.md + czat; rozstrzyga cross-lane (compound economy/siege, dublet religii); przekazuje paczki `_handoff/` | MIASTO → Master |
| **EKONOMIA** | `economy.ts`, `turn-economy.ts`, `player-economy.ts`; Ekonomia-parametry/Surowce | (a) dostarcza per-turn Praca/Pieniądz/Nauka/Kultura/Żywność per miasto → produkcja konsumuje **Pracę**; (b) wzrost populacji liczony w `turn-economy` (ja trzymam obiekt City); (c) `buildingValue` czyta **liniowy** `przyrost` → migracja na compound = CROSS-LANE; (d) `growthMult` z Porządku wymaga hooka w `turn-economy`; (e) `zdrowie_*` (mój panel society-params) konsumuje EKONOMIA do wzrostu | dwustronny |
| **Dyplomacja** | `diplomacy.ts`; Dyplomacja.xlsx → diplomacy.json | **Religia**: wspólna religia dominująca = bonus relacji, różna = napięcia (Schemat §6.2). `culture-religion.dominantReligion`/`civReligion` dostarczają religię miasta/cywilizacji, którą dyplomacja czyta. Presja kulturowa (granice) też może wpływać na relacje | MIASTO → Dyplomacja |
| **DANE** (Dane Cywilizacji) | Cywilizacje.xlsx → `civs.json` | Cywilizacje + religia własna + warunki startowe (ownerId → cywilizacja → religia). **DUBLET**: religia cywilizacji jest w `civs.json` (DANE) **i** `society-params.religie_cywilizacji` (mój panel) → JEDNO ŹRÓDŁO (decyzja DANE/master). `culture-religion.civReligion` czyta tę religię | dwustronny (uzgodnić) |
| **UNITS** (Units/Battle) | `units.json`, `render/units.ts`, `battle/*`; Jednostki.xlsx | Koszty/definicje jednostek — produkcja czyta `units.json` **read-only** (właściciel = UNITS); rekrutacja z kolejki tworzy jednostkę typu; garnizon + obrona miasta (mury z budynków → `siege.ts`) | MIASTO → UNITS (read) |
| **MAPA** | `map/*`, `render/scene.ts`, `render/cities.ts` | Siatka heksowa + teren: `canFoundCity` sprawdza Morze/Wybrzeże/Góry; granice z kultury (`cityBorderRadius` → 0..3) wyznaczają promień obrabianej okolicy; render miasta na mapie = `render/cities.ts` (MAPA, nie ja) | dwustronny |
| **SILNIK** | `main.ts` + wpinanie game/* | Integruje produkcję/porządek/kulturę w pętli tury (paczka `_handoff/MIASTO-do-SILNIK_integracja.md`); jedyny publisher kanonu Gra-podglad.html | MIASTO → SILNIK |
| **UI** | `ui/cityPanel.ts`, HUD, menu | Renderuje plony + kolejkę produkcji + listę budowy + (docelowo) Porządek/Kulturę; importuje moje `production.ts`; nowe addytywne API ogłoszone w `_handoff/MIASTO-do-UI_…` (AKTUALIZACJA 2) | MIASTO → UI |
| **AI** | `ai.ts`, `victory.ts`, `barbarians.ts`; AI-parametry.xlsx | Miasta rywali używają tej samej logiki: AI woła `availableProduction` i wybiera co budować; Porządek/bunt dotyczy też miast AI; zwycięstwo (`victory.ts`) zależy m.in. od liczby miast/kultury; barbarzyńcy atakują miasta (`siege.ts`) | MIASTO → AI (read logic) |

DWA GŁÓWNE STYKI CROSS-LANE (decyzja przez Mastera, NIE robię sam):
1. **Compound dla efektu ekonomicznego + obrony + utrzymania budynków** — `economy.ts` (`buildingValue`), `siege.ts` (mury), `player-economy.ts` (utrzymanie) wciąż liniowe (`przyrost*`). Mój `production.ts` (koszt) już compound. Migracja tych trzech = EKONOMIA/UNITS-Battle przez Mastera; do tego czasu `przyrost*` ZOSTAJE w `buildings.json`.
2. **Jedno źródło religii cywilizacji** — `civs.json` (DANE) vs `society-params.religie_cywilizacji` (MIASTO) — wpływa na Dyplomację i Kulturę/Religię. Decyzja DANE/Master.

## 13. Komendy
```bash
# Build do testu (zwykły `npx vite build` pada na blokadzie OneDrive dist/):
cd gra && npx vite build --outDir /tmp/civ-dist
# Testy logiki (oczekiwane: "LOGIC OK (163/163)"; order [102-125], culture-religion [140-163]):
node tools/logic-test.cjs
node tools/smoke.cjs /tmp/civ-dist/index.html
# Panel sterowania (jedno źródło):
python3 gra/tools/export-panel.py        # Panel-przeglad-danych.xlsx -> buildings/society-params/miasto-params .json
python3 gra/tools/gen-panel-xlsx.py      # regeneruj edytowalny Excel ze snapshotu JSON
python3 gra/tools/gen-dashboard.py       # regeneruj read-only HTML
# NIGDY: npm run build  /  python export-data.py  (globalny prebuild nadpisuje cudze JSON)
```

## 14. Infrastruktura i znane ograniczenia
- **Dehydracja OneDrive (sandbox):** mount bash bywa NIEŚWIEŻY — podaje ucięte/uszkodzone pliki (`.ts`, czasem `.json`/`.py`): objawy „Unexpected end of file", „Unterminated string literal", „const GO". To NIE błąd kodu (pliki w chmurze są całe). Skutek: `npx vite build` i czasem `logic-test` bywają flaky. LEKARSTWO (raz, Windows): folder Civ → „Always keep on this device" (hydratacja na stałe dla WSZYSTKICH sesji). Dowód poprawności logiki: `logic-test` 163/163 w oknie zhydratowanym.
- API modułów ZAMROŻONE (zmiany tylko addytywne) — kontrakt dla UI/SILNIK stabilny.

## 15. Co zostaje
- WPIĘCIE do pętli tury (production/order/culture-religion) — SILNIK (paczka gotowa).
- CROSS-LANE (przez mastera): compound efektu ekonomicznego budynków (`economy.ts`/`siege.ts`/`player-economy.ts`), hook `growthMult` w `turn-economy`, dublet religii cywilizacji (civs.json vs society-params).
- UI: panel Porządku/Kultury + podpięcie Wykup/Wstrzymaj/poziomów (API gotowe i ogłoszone).
- Po stronie MIASTA logika produkcji + społeczeństwa jest KOMPLETNA i ZIELONA (163/163).

---

## CHANGELOG API — 2026-06-25 (nowe funkcje v0.1)

Sekcja addytywna — nie modyfikuje istniejacych sekcji. Opisuje funkcje dodane w sesjach poprzedzajacych te date.

### A. `okolica.ts` — dynamiczny zasieg okolicy

| Funkcja | Sygnatura | Status |
|---|---|---|
| `cityRangeForPopulation` | `(population: number) -> 5 \| 10 \| 15` | GOTOWA |
| `assignWorkedTiles` | `(..., radius?: number, ...) -> WorkedTiles` | GOTOWA |

**`cityRangeForPopulation(population)`**
- Plik: `gra/src/game/okolica.ts`
- Zwraca dynamiczny promien okolicy/granicy na podstawie populacji:
  - `population < 5` → `5`
  - `population >= 5` → `10`
  - `population >= 10` → `15`
- Strojenie przez `miasto-params.json`: `zasieg_okolicy_baza=5`, `zasieg_okolicy_pop5=10`, `zasieg_okolicy_pop10=15`.

**`assignWorkedTiles(...)`**
- Gdy `radius` nie podany — pobiera promien z `cityRangeForPopulation(city.population)` automatycznie.
- Nie trzeba recznie przekazywac promienia przy standardowym przydziale pol.

---

### B. `auto-manage.ts` — NOWY MODUL: Zarzadca automatyczny (9A)

| Funkcja | Sygnatura | Status |
|---|---|---|
| `autoManageCity` | `(city, map, prod, data, input) -> AutoManageResult` | GOTOWA; PURE |

**`autoManageCity(city, map, prod, data, input)`**
- Plik: `gra/src/game/auto-manage.ts` (**nowy modul**)
- Typ wyniku: `{ workedTiles, enqueue: ProductionItem \| null, pracaSplit }`
- PURE — nie mutuje wejsc; UI toggluje tryb auto przez callback.
- Dziala w trzech fazach:
  1. **Auto-przydial pol** — wola `assignWorkedTiles` z promieniem z populacji.
  2. **Auto-produkcja** — heurystyka priorytetow kolejki:
     ```
     zywnosc > produkcja > nauka > pieniadz > wojsko > obrona
     > kultura > zdrowie > pozostale budynki > jednostki
     ```
  3. **Podzial Pracy** — ustawia `pracaSplit` (procent Pracy na budynki vs. pula).
- Testy: `auto-manage-test` — **26/26**.

---

### C. `production.ts` — podzia output miasta na strumienie

| Funkcja / Stala | Sygnatura | Status |
|---|---|---|
| `splitOutput` | `(total: number, shares?: OutputShares) -> OutputSplit` | GOTOWA; PURE |
| `cityScienceOutput` | `(total: number, shares?: OutputShares) -> number` | GOTOWA; PURE |
| `cityMoneyOutput` | `(total: number, shares?: OutputShares) -> number` | GOTOWA; PURE |
| `DEFAULT_OUTPUT_SHARES` | `OutputShares` (stala) | GOTOWA |

**`splitOutput(total, shares?)`**
- Plik: `gra/src/game/production.ts`
- Normalizuje udzialy (suma = 1), zwraca: `{ produkcja, pieniadz, nauka, rozwoj }`.
- Gwarancja: suma wszystkich pol == `total` (bez bledu zaokraglenia).

**`cityScienceOutput` / `cityMoneyOutput`**
- Pojedyncze strumienie do agregacji globalnej w module EKONOMIA.

**`DEFAULT_OUTPUT_SHARES`**
- Wartosci domyslne z `miasto-params.json`:
  - `udzial_output_produkcja = 0.4`
  - `udzial_output_pieniadz = 0.3`
  - `udzial_output_nauka = 0.2`
  - `udzial_output_rozwoj = 0.1`

Kontekst architektury nauki: nauka = mechanika per-miasto (MIASTO, `cityScienceOutput`) + agregacja globalna (EKONOMIA) + pula/zakup tech (architektura A/B — decyzja otwarta, do Mastera).
Testy: `split-output-test` — **46/46**.

---

### D. `order.ts` — wizualny rozklad nastrojow

| Funkcja | Sygnatura | Status |
|---|---|---|
| `happinessBreakdown` | `(population: number, szczescie: number) -> MoodBreakdown` | GOTOWA; PURE |

**`happinessBreakdown(population, szczescie)`**
- Plik: `gra/src/game/order.ts`
- Typ wyniku: `{ zadowoleni: number, kontentni: number, niezadowoleni: number }`
- Gwarancja: `zadowoleni + kontentni + niezadowoleni == population`.
- WYLACZNIE wizualny — nie wplywa na mechanike Porzadku (`computeOrder`/`evaluateOrder`).
- Uzycie: panel UI mieszkancow, tooltip nastrojow.
- Testy: `happiness-test` — **38/38**.

---

### E. `cities.ts` — konwersja wioski + flaga muru

| Funkcja / Pole | Sygnatura | Status |
|---|---|---|
| `foundCityFromVillage` | `(q, r, cities, map, opts?) -> Result` | READY-TO-WIRE |
| `City.maMur` | `maMur?: boolean` | GOTOWA (pole) |

**`foundCityFromVillage(q, r, cities, map, opts?)`**
- Plik: `gra/src/game/cities.ts`
- Wynik: `({ ok: true } & City)` lub `{ ok: false, reason: string }`.
- Reuzywia `canFoundCity` / `foundCityAt` — ta sama walidacja co standardowe zakladanie.
- Po sukcesie MAPA usuwa wioske z heksu (wola MAPA/caller).
- **Aktywacja = decyzja master/Maciej** (READY-TO-WIRE, nie wpiety do main.ts).
- Testy: `found-from-village-test` — **24/24**.

**`City.maMur?: boolean`**
- Flaga muru miejskiego na obiekcie `City`.
- Ustawiana po zbudowaniu budynku `'mury'` (w `buildings.json`: pole `odblokowuje: 'maMur'`).
- Efekt mechaniczny: +200% obrony miasta (`bonus_obrona_mur_proc = 200` w `miasto-params.json`); liczony przez UNITS/silnik.
- Podzial odpowiedzialnosci: MIASTO ustawia flage, UNITS/silnik stosuje bonus.

---

### F. Infrastruktura testow (stan 2026-06-25)

- **Pelny logic-test** (`tools/logic-test.cjs`): **163/163** — wszystkie poprzednie testy zielone.
- **Testy modulowe** (bundluja przez esbuild pojedyncze moduly, nie wymagaja pelnego buildu):
  - `okolica` — zielony
  - `auto-manage-test` — 26/26
  - `split-output-test` — 46/46
  - `happiness-test` — 38/38
  - `found-from-village-test` — 24/24
- **Dehydracja OneDrive**: jesli pelny build lub regen Excela blokuje sie (uciety plik / „Unexpected end of file"), lekarstwo: folder Civ w Eksploratorze Windows → prawy klik → „Always keep on this device". Dotyczy wszystkich sesji naraz.
