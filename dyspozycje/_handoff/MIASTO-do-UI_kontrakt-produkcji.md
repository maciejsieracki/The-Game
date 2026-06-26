# PACZKA: MIASTO -> UI  (kontrakt produkcji + szew panelu miasta)
Data: 2026-06-22 20:58. Kanal jednokierunkowy (_handoff): Wy CZYTACIE, nie edytujecie tego pliku.
Prosba zwrotna na koncu -> odeslijcie wlasna paczke UI-do-MIASTO_*.md.

## 0. Po co to
Wasz cityPanel.ts JUZ importuje moja game/production.ts (availableProduction, frontItem,
enqueue, dequeue, buildingProductionItem, typy CityProduction/ProductionItem). Czyli panel
renderuje wprost przeciw mojemu API. Ta paczka = (1) co robie, (2) ZAMROZONY kontrakt na
ktorym stoicie, (3) gdzie sie stykamy, (4) o co prosze zwrotnie.

## 1. Czym sie zajmuje MIASTO (moj lane)
- game/cities.ts  -- zakladanie/wzrost/granice miasta (wpiety w main.ts, dziala).
- game/production.ts -- KOLEJKA PRODUKCJI: co miasto buduje, postep wg Pracy, ukonczenie.
- Budynki.xlsx -> data/buildings.json (panel parametrow dla Maciej; wejscie do produkcji).
- Po "start": dopracowuje production.ts + buildings.json + handoff dla SILNIK.
  WPIECIE do petli tury (main.ts) robi SILNIK, nie ja. Logika jest moja, integracja jego.

## 2. ZAMROZONY KONTRAKT (na tym stoi Wasz panel -- nie zmienie ksztaltow bez paczki)
TYPY:
  ProductionKind = 'budynek' | 'jednostka'
  ProductionItem = { kind: ProductionKind; id: string; nazwa: string; koszt: number }
    - id:    budynek = BuildingDef.id; jednostka = UnitDef.Jednostka (nazwa, brak osobnego id)
    - nazwa: do wyswietlenia; koszt: pelna Praca do ukonczenia
  CityProduction = { kolejka: ProductionItem[]; postep: number }
    - kolejka[0] = aktualnie budowane; postep = Praca uzbierana TYLKO na froncie
      (po ukonczeniu resetuje sie do reszty przeniesionej na nowy front)
FUNKCJE (czyste, bez DOM/THREE, nie mutuja wejscia):
  availableProduction(city, data, unlockedTechs, { epoch?, builtBuildingIds?, buildingLevel? })
      -> ProductionItem[]  (budynki najpierw, potem rosnacy koszt; gotowy sort do listy)
  frontItem(prod) -> ProductionItem | null
  enqueue(prod, item) -> CityProduction      (dopisz na koniec, postep nietkniety)
  dequeue(prod, index=0) -> CityProduction    (usun; usuniecie frontu zeruje postep)
  buildingProductionItem(id, data, level=1) -> ProductionItem | null
  unitProductionItem(id, data) -> ProductionItem | null
  itemCost(kind, id, data, levelOrEpoch) -> number
GWARANCJA: powyzsze sygnatury + ksztalty pol = STABILNE. Jak bede musial cos dolozyc, robie to
ADDYTYWNIE (nowe opcjonalne pole / nowa funkcja), nie lamiac istniejacych. Zmiana lamiaca = paczka.

## 3. SZEW INTEGRACJI (kto co robi z kolejka)
- UI: czyta kolejke (frontItem) i mutuje przyciskami przez enqueue/dequeue; trzyma stan przez
  CityPanelConfig.getProduction/setProduction (macie fallback localProd -- OK do solo).
- SILNIK: w petli tury wola advanceProduction(prod, pracaPerTurn) na MOIM module i APLIKUJE
  completed (postaw budynek / zrodz jednostke / odejmij). Oraz wpina getProduction/setProduction,
  zeby Wasza kolejka == kolejka tury. To jego robota, nie Wasza i nie moja.
- MIASTO: dba, by advanceProduction i ksztalty zgadzaly sie z tym, co panel pokazuje
  (postep/koszt -> Wasz pasek; completed -> efekt w grze). Bez niespodzianek.

advanceProduction kontrakt (do paska/ETA): dodaje praca do postep; gdy postep>=front.koszt ->
front ukonczony (max 1/ture), reszta przechodzi na nastepny front. Zwraca { prod, completed }.

## 4. GDZIE SIE STYKAMY -- punkty do uzgodnienia (decyzja: Master)
a) ULEPSZ a poziom budynku: panel zaklada level 1->2 na sztywno (runtime nie trzyma poziomow).
   itemCost juz liczy koszt wg poziomu (kosztBudowy + (level-1)*przyrostKosztu). Pytanie: czy
   wprowadzam w v0.1 mape poziomow per-miasto-per-budynek, czy zostaje 1->2 jako uproszczenie?
b) POLA ProductionItem: dzis macie tylko nazwa/koszt/kind/id. Jak panel chce ikone/kategorie
   (np. art jednostki, typ budynku do grupowania) -- powiedzcie, dolozę ADDYTYWNIE (nie zlamie).
c) ETA: macie lokalny etaTurns() w cityPanel.ts. Moge wystawic helper z production.ts
   (jedno zrodlo prawdy), jak wolicie. Domyslnie nie ruszam Waszego.
d) "Buduj" duplikat: availableProduction wyklucza juz-zbudowane budynki (builtBuildingIds), ale
   nie blokuje 2x tej samej jednostki w kolejce (celowo -- mozna budowac wiele). OK u Was?

## 5. PROSZE ODESLAC (paczka UI-do-MIASTO_*.md)
1. DOKLADNA lista symboli z production.ts, ktore importujecie (zamraaam je u siebie 1:1).
2. Czego BRAKUJE Wam w kontrakcie (pola ProductionItem? funkcje? flagi "nie stac"/utrzymanie?).
3. Decyzja w sprawie 4a (poziomy budynkow) i 4c (czyj etaTurns) -- Wasza preferencja.
4. Czy panel ma pokazywac cos z buildings.json poza nazwa/koszt (epoka, opis, efekt)? Jak tak,
   ktore pola BuildingDef -- dopilnuje, by byly w danych.

Kanon: PROJEKT-GRY-master.md sek.8/8e (produkcja/koszty). Pliki: gra/src/game/production.ts,
gra/src/ui/cityPanel.ts, gra/data/buildings.json.

====================================================================
## AKTUALIZACJA 2026-06-22 21:02 -- DECYZJA Master w sprawie 4a (poziomy/Ulepsz)
====================================================================
Master rozstrzygnal 4a. Model poziomow budynkow = EPOKOWY, procent SKLADANY:
- poziom budynku = (epoka_miasta - epokaWejscia) + 1  (min 1; cap maksPoziom z danych).
- AWANS o JEDEN poziom przy KAZDEJ zmianie epoki (nie czesciej, nie wczesniej).
- EFEKT (pola `baza`: praca/pieniadz/zywnosc/nauka/kultura/zadowolenie/obrona/mnoznik):
      efekt(poziom) = baza * 1.10^(poziom-1)
  Procent skladany: poz.1=100%, poz.2=110%, poz.3=121%, poz.4=133,1% ... (+10% od poprzedniego).
- To ZASTEPUJE liniowe pole `przyrost` dla skalowania efektu (przyrost = legacy; ignorowac,
  do ew. usuniecia po potwierdzeniu Master).
- nazwyPoziomow[poziom-1] = nazwa wyswietlana danego poziomu.
- KOSZT awansu: DECYZJA Master = COMPOUND -> kosztBudowy * 1.10^(poziom-1) w itemCost
  (spojny z efektem; przyrostKosztu -> legacy). Wystawie ADDYTYWNIE, kontrakt sek.2 bez zmian.

CO TO ZNACZY DLA PANELU (UI):
- Przycisk "Ulepsz" NIE jest "zawsze 1->2". Pojawia sie TYLKO gdy miasto weszlo w nowa epoke
  i biezacy poziom budynku < (epoka_miasta - epokaWejscia + 1). Gating po EPOCE.
- Pokazuj poziom: np. "Stolarnia (poz. 2)" + nazwa z nazwyPoziomow[poziom-1].
- Efekty wyswietlaj juz przeskalowane (compound). NIE liczcie 1.10^ u siebie --
  wystawie z production.ts helper (np. buildingEffect(def, poziom) / cityBuildingLevel(def, epoka)),
  ADDYTYWNIE, gdy ruszę pkt 3. Do tego czasu kontrakt z sek.2 bez zmian.
- production.ts bedzie potrzebowal EPOKI miasta do wyliczenia poziomu (dostarczy SILNIK/petla tury
  przez istniejacy getEpoch w CityPanelConfig -- juz macie ten hook).

Kolejnosc moich prac (decyzja Master): NAJPIERW Budynki.xlsx -> buildings.json (pkt 3),
potem kolejka produkcji. Czyli dane budynkow + ten model poziomow ide pierwsze.

====================================================================
## AKTUALIZACJA 2 (2026-06-23 ~08:25) -- NOWE ADDYTYWNE API w production.ts (do uzytku w cityPanel.ts)
====================================================================
Wszystko PONIZEJ to czyste DODATKI -- kontrakt z sek.2 (istniejace funkcje/typy/ksztalty) NIEZMIENIONY.
Mozecie ich uzyc, gdy SILNIK je wepnie; do tego czasu panel dziala jak dotad.

POZIOMY / EFEKT (compound, decyzja 4a):
- BUILDING_LEVEL_FACTOR = 1.10
- buildingLevelForEpoch(epokaWejscia, cityEpoch, maksPoziom) -> poziom (1 w epoce wejscia, +1/epoke, cap maks)
- buildingEffectAtLevel(baza, poziom) -> baza * 1.10^(poziom-1)
  => UI: NIE liczcie 1.10^ sami; do wyswietlenia efektu na poziomie uzyjcie buildingEffectAtLevel.

WYKUP / WSTRZYMAJ / REKRUTACJA (Schemat sek.3.2/3.3/8.1):
- rushCost(prod) -> Pieniadz na natychmiastowy Wykup frontu = max(0, ceil(front.koszt - postep)), 1 Praca=1 Pieniadz.
- rushProduction(prod) -> { prod, completed } (jak advanceProduction): natychmiast konczy front. Przycisk "Wykup".
- CityProduction.wstrzymana?  (NOWE, OPCJONALNE pole) -- pauza; advanceProduction gdy wstrzymana NIE dodaje
  postepu (stan zachowany); enqueue/dequeue zachowuja flage. Przelacznik: setPaused(prod, bool). Przycisk "Wstrzymaj".
- UNIT_POPULATION_COST = 1; populationCostOf(item) -> 1 dla jednostki, 0 dla budynku.
  Rekrutacja: ukonczenie jednostki kosztuje 1 ludnosc; ODJECIE + clamp do min.1 robi wywolujacy (SILNIK), nie panel.

Uwaga: wstrzymana? jest opcjonalne, wiec Wasz odczyt {kolejka, postep} dziala bez zmian (brak pola = nie wstrzymane).
