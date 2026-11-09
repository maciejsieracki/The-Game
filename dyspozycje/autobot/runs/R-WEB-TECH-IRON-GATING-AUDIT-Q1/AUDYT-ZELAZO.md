# AUDYT-ZELAZO — bramki żelaza i jednostek żelaznych (R-WEB-TECH-IRON-GATING-AUDIT-Q1)

Tryb: AUDYT TYLKO DO ODCZYTU. Zero zmian w `gra/`, `WERSJE.md`, deploy i push nie wykonane.
Źródła: `gra/data/tech.json`, `gra/data/units.json`, `gra/data/buildings.json`, `gra/data/terrain-improvements.json`,
`gra/src/game/production.ts`, `gra/src/game/playerState.ts`, `gra/src/game/improvement-tech.ts`,
`gra/src/map/improvement-build.ts`, `gra/src/game/turn-economy.ts`, `gra/src/game/converters.ts`,
`gra/src/game/building-resource-gate.ts`, `gra/src/game/zelazo-access.ts`, `gra/src/game/research.ts`.
Dane sprawdzone skryptem node (odczyt JSON): każda nazwa techu w units.json i buildings.json istnieje w tech.json (0 braków).
Testów jednostkowych ani gry na żywo NIE uruchamiano — NIE_ZMIERZONO (audyt statyczny).

## 0. Wniosek w skrócie

1. Faktyczną bramką żelaza jest **Hutnictwo żelaza** (Brąz, poz. 6), NIE Obróbka żelaza. Hutnictwo ma
   `awansDoEpoki: 3` (`playerState.ts:444`: `state.era = max(era, 3)`), więc jego ukończenie otwiera całą epokę Żelaza.
   Jednostki epoki Żelaza są widoczne tylko przy `epoka == 3` (`production.ts:1049`), a więc każda z nich
   pośrednio wymaga Hutnictwa, nawet te z własnym techem Obróbka/Oblężnictwo.
2. **Obróbka żelaza** w kodzie nie daje żadnego surowca ani budynku, który byłby osiągalny: jej budynki
   (Wielka odlewnia, Wielka Kuźnia) mają `epokaWejscia: 4`, a żaden tech nie ustawia epoki 4
   (`awansDoEpoki` tylko 2 i 3). Realnie odblokowuje tylko 4 jednostki.
3. **Sztuka wojenna** nie odblokowuje żadnej jednostki — tylko budynek Akademia wojskowa (wymaga Koszar w mieście).
4. Jedyna jednostka epoki Żelaza bez bramki techu: **Hieros Lochos** (Tech `—`). Nadal wymaga epoki 3 (czyli Hutnictwa).

## 1. Kopalnia żelaza i Odlewnia żelaza — kiedy żelazo trafia do magazynu

| Krok | Warunek w kodzie | Źródło |
|---|---|---|
| Postawienie Kopalni żelaza | tech `Hutnictwo żelaza` (`isImprovementTechUnlocked`) + heks Wzgórza/Góry + `hex.zloze === 'zelazo'` + heks we własnym terytorium | `terrain-improvements.json` (`kopalnia_zelaza.tech`, `epoka: 3`); `improvement-tech.ts`; `improvement-build.ts` (`createBuildRequest`, `qualifies`, `terrainOk`) |
| Naliczanie rudy | Kopalnia żelaza na złożu daje `ruda_zelaza` do puli właściciela; **bez budynku** | `terrain-improvements.ts:oreYieldFromImprovements`; `turn-economy.ts` (~1574 podgląd, ~1814 `creditTerritory('ruda_zelaza')`) |
| Odlewnia żelaza | tech `Hutnictwo żelaza`, `epokaWejscia: 3`, koszt drewno 50 / kamień 50 / cegła 50, bez prereq miasta | `buildings.json` (`odlewnia_zelaza`) |
| Produkcja żelaza | `odlewnia_zelaza__zelazo`: 1 ruda_zelaza + 1 drewno → 1 żelazo, przepustowość 50 | `converters.ts:99` |
| Wielka odlewnia (łańcuch) | `epokaWejscia: 4` → **nieosiągalna** (filtr `b.epokaWejscia > epoch` w `production.ts:966`) | `buildings.json`, `production.ts` |

Odpowiedź na pytanie (1): **Kopalnię żelaza można postawić po Hutnictwie żelaza (epoka 3). Ruda żelaza trafia do puli
właściciela od pierwszej tury po postawieniu kopalni, bez Odlewni (surowiec się gromadzi). Żelazo (`zelazo`) powstaje
dopiero po zbudowaniu Odlewni żelaza w mieście (Hutnictwo). Wielka odlewnia nie jest osiągalna.**

Dodatkowe fakty:
- `zelazo-access.ts`: natywny dostęp do żelaza = Kopalnia na złożu w imperium AND Odlewnia/Wielka odlewnia w TYM mieście
  (`ownerHasNativeZelazoAccess`) — używane w `main.ts` (~3491, ~5642).
- Jednostki żelazne są bramkowane zapasem `zelazo` w magazynie państwa (`production.ts:1091-1097`), z wyjątkiem widoku panelu
  (`showStockGatedUnits`, `cityPanel.ts:8263`), gdzie pozycja jest tylko wyszarzona.
- `ruda_zelaza` i `zelazo` nie mają bramki wieku w `turn-economy` — zapas rośnie niezależnie od tego, czy Odlewnia działa.

## 2. Jednostki epoki Żelaza — tabela (pełna: `AUDYT-ZELAZO-JEDNOSTKI.csv`)

Dane: 25 jednostek `Epoka = Żelazo`, każda z `Surowiec = Żelazo`.

| Tech w units.json | Liczba | Jednostki |
|---|---|---|
| Hutnictwo żelaza | 19 | Falanga, Hastati, Triari, Evocati, Rydwan celtycki, Konnica lancowa asyryjska, Konnica łucznicza asyryjska, Drużynnik, Jeździec z oszczepami, Garnizon Harappy, Gwardia hetycka, Piechota neobabilońska, Tyrski miecznik, Gwardia Tyreńska, Thorakites, iButho z iklwa, Wojownik z żelaznym khopesh, Mur tarcz (Sargonid), Miecznik galijski |
| Obróbka żelaza | 4 | Gaesatae, Soldurii, Wojownik germański, Berserker germański |
| Oblężnictwo | 1 | Katapulta |
| `—` (brak) | 1 | Hieros Lochos (Święty Zastęp) |

Uwaga rozbieżności: tech.json w opisie Hutnictwa („Jednostki: …”) wymienia 17 jednostek. Brakuje w nim Triari, Evocati
i Hieros Lochos, choć units.json ma dla Triari i Evocati Tech = Hutnictwo żelaza. Tekst opisowy nie jest bramką, ale jest
niespójny z danymi.

Egzekwowanie w `availableProduction` (`production.ts:1036-1110`), dla każdej jednostki wszystkie warunki AND:
1. Epoka: `unitEpoch` ∈ {epoka gracza, epoka gracza − 1} (`production.ts:1051`). Jednostki Żelaza = epoka 3.
2. Nacja (`unitAllowedForCivNation`) i zamienniki (`W zamian za`).
3. Tech: `tech` ∈ `unlockedTechs`, blank `-`/`—` pomija bramkę (`production.ts:1063-1069`).
4. Koszary w TYM mieście dla epoki ≥ 2 (`production.ts:1075`), z obejściem przez budynek nadrzędny.
5. Morskie (`Typ=Naval`) wymagają wody (`production.ts:1082`).
6. Zapas `zelazo` w magazynie państwa (`production.ts:~1095`) — pominięty w widoku panelu.
7. Super-jednostka: max 1 żywa na cywilizację (`production.ts:1108`).
Prerekwizyty techów NIE są sprawdzane w production.ts; egzekwuje je `research.ts` (`parsePrerequisites`, `canResearch`).

Kto dostaje jednostki żelazne i kiedy (przy założeniu, że gracz ma Koszary i zapas żelaza):
- Hutnictwo żelaza → 19 jednostek + epoka 3 (awans) + Hieros (przez epokę).
- Obróbka żelaza → 4 jednostki (wymaga Hutnictwa + Drogi brukowane).
- Oblężnictwo → Katapulta.

## 3. Jednostki z Tech `—` (brak bramki techu)

Z 14 jednostek bez techu tylko jedna jest w epoce Żelaza: **Hieros Lochos**. Pozostałe to epoka Kamienia (Wojownik,
Procarz, Oszczepnik, Zwiadowca, Oszczepnik Zulu, Wojownik z maczugą, Procarz Huaracoc, Oszczepnik Estólica) i Brązu
(Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Królewska Sumeru). Dla Hieros:
- w praktyce bramką jest epoka 3, czyli Hutnictwo żelaza (awans), plus Koszary, zapas żelaza i Super-limit;
- nie ma bramki Sztuki wojennej ani Obróbki, więc jest jedyną jednostkę Żelaza, która nie zależy od żadnego techu
  poza epoką.

## 4. Gdzie kończy się epoka 3 i co jest „epoką Żelaza" w kodzie

- `awansDoEpoki` ustawione tylko na: Brązownictwo → 2, Hutnictwo żelaza → 3 (`research.ts:71`, `playerState.ts:316`).
- Żaden tech nie daje epoki 4, więc `epokaWejscia: 4` (Wielka odlewnia, Wielka Kuźnia) jest martwe. Wstrzymany temat
  `#57` (nowe epoki) jest zgodny z tym stanem.
- Sztuka wojenna: `Oblężnictwo + Obróbka żelaza` (prereq). Obróbka: `Hutnictwo żelaza + Drogi brukowane`.
  Drogi brukowane: `Inżynieria + Budownictwo` (Żelazo, poz. 8, koszt 680). Oblężnictwo: `Matematyka + Wojskowość`
  (Żelazo, poz. 7, koszt 560). Prereq Wojskowości nie sprawdzano.

## 5. Ocena postulatu właściciela

Postulat: „Obróbka żelaza powinna dawać dostęp do samego żelaza, a Sztuka wojenna umożliwiać dopiero rekrutację wszystkich
jednostek z epoki żelaza."

### 5a. Część pierwsza: żelazo ← Obróbka żelaza

Zmiana danych (bez zmian kodu, jeśli bramki są czytane z JSON):
- `terrain-improvements.json` → `kopalnia_zelaza.tech`: `Hutnictwo żelaza` → `Obróbka żelaza`;
- `buildings.json` → `odlewnia_zelaza.techUnlock` i `kuznia_zelaza.techUnlock`: `Hutnictwo żelaza` → `Obróbka żelaza`.

Skutki:
- Żelazo (surowiec) pojawi się dopiero po Obróbce, czyli po Drogach brukowanych (Żelazo poz. 8, koszt 680) i Hutnictwie.
  Kolejność Brąz → Żelazo zostaje, ale surowiec przesuwa się w dół o łańcuch Inżynierii i Budownictwa.
- Hutnictwo nadal daje awans do epoki 3 (`awansDoEpoki: 3`). Bez decyzji o awansie epoka 3 otworzy się bez żelaza
  i bez Odlewni. Trzeba zdecydować, czy awans przenieść na Obróbkę (ABC 1).
- Wielka odlewnia i Wielka Kuźnia (epoka 4) pozostają martwe; po zmianie Obróbka nadal nie odblokuje żadnego budynku
  osiągalnego w grze. Można je przypisać do epoki 3 lub zostawić (ABC 3).
- Łańcuch `stal` (`wielka_odlewnia__stal`) jest nieosiągalny z tego samego powodu. Tekst „stal (prereq)” w tech.json
  dla Obróbki wymaga osobnej decyzji.
- AI: `ai.ts:2263-2268` i `2642` priorytety budowy odlewni (`odlewnia_zelaza`) przesuną się wraz z techem.
  Rozmiar wpływu NIE_ZMIERZONO (brak symulacji).

### 5b. Część druga: wszystkie jednostki epoki Żelaza ← Sztuka wojenna

Zmiana danych (bez zmian kodu): `units.json` → kolumna `Tech` dla 23 jednostek (19 × Hutnictwo, 4 × Obróbka) oraz
Hieros Lochos (`—` → `Sztuka wojenna`). Katapulta (Oblężnictwo) zostaje, bo Oblężnictwo jest prereqem Sztuki wojennej
(pełne zamknięcie wszystkich jednostek epoki Żelaza na Sztuce wojennej wymagałoby też Katapulty — ABC 4).

Skutki i ryzyka:
- Sztuka wojenna wymaga `Oblężnictwo + Obróbka żelaza`, a Obróbka wymaga `Hutnictwo + Drogi brukowane`. Pierwsza
  rekrutacja wszystkich jednostek Żelaza przesunie się za Drogi brukowane, Oblężnictwo, Obróbkę i Sztukę wojenną
  (cały łańcuch Żelaza poz. 7–9). Zapis do balansu: znaczne opóźnienie rekrutacji Żelaza względem obecnego stanu.
- Epoka 3 bez jednostek Żelaza: w oknie epoki (epoka i epoka−1) pozostają jednostki Brązu. Skutek: w epoce 3 do czasu
  Sztuki wojennej dostępna będzie tylko armia Brązu i Katapulta. To dziura w balansie i w AI (ai-production-priorities
  wybiera jednostki wg dostępności). Wymaga decyzji (ABC 2).
- Akademia wojskowa (budynek Sztuki wojennej) nadal wymaga Koszar. Bez zmian.
- Teksty opisowe do aktualizacji po ewentualnej zmianie: tech.json (kolumny „Odblokowuje jednostki” w Hutnictwie, Obróbce,
  Sztuce wojennej), Civpedia/encyklopedia (`docs/encyklopedia/technologie/*.md`, `docs/PORADNIK-GRACZA/57-katalog-jednostek.md`),
  ikony techów (`ui/techIcons.ts`) bez zmian funkcjonalnych. Źródło `Technologie-drzewko.xlsx` nie było czytane.
- Testy: nie sprawdzano, które testy zakładają Hutnictwo jako bramkę jednostek żelaznych (NIE_ZMIERZONO).

## 6. Minimalny plan zmian (propozycja, NIE implementowane)

Zakres minimalny zgodny z postulatem:
1. `units.json`: `Tech` = `Sztuka wojenna` dla 23 jednostek Hutnictwa/Obróbki i Hieros Lochos (lista w CSV).
2. `terrain-improvements.json`: `kopalnia_zelaza.tech` = `Obróbka żelaza`.
3. `buildings.json`: `odlewnia_zelaza.techUnlock` i `kuznia_zelaza.techUnlock` = `Obróbka żelaza`.
4. `tech.json`: przenieść tekst „Odblokowuje” (Hutnictwo, Obróbka, Sztuka wojenna) zgodnie z 1–3; decyzja o `awansDoEpoki`.
5. Testy: wyszukać asercje na Hutnictwo jako bramkę jednostek/Kopalni (NIE_ZMIERZONO) i poprawić.

Brak zmian kodu gry jest możliwy, bo bramki czytane są z danych (`production.ts`, `improvement-tech.ts`).
Wyjątek: jeśli testy lub kod zakładają `Hutnictwo` jako tech Odlewni/Kopalni (np. `zelazo-access.ts`
komentarze, `ai.ts`), to wymaga osobnego przeglądu.

Skutki dla drzewka technologii: Hutnictwo staje się wyłącznie kamieniem milowym epoki (jeśli awans zostanie), Obróbka
otwiera surowiec, Sztuka wojenna otwiera armię Żelaza. Drzewko wymaga przebudowy kolumny „Odblokowuje”.

## 7. Pytania ABC do właściciela (do zadania przez orkiestratora)

- ABC 1: Awans do epoki Żelaza (`awansDoEpoki: 3`) — zostaje na Hutnictwie żelaza, czy przenieść na Obróbkę albo Sztukę wojenną?
  Rekomendacja: przenieść na Obróbkę (żelazo i epoka otwierają się razem), a Sztukę zostawić na jednostki.
- ABC 2: Okno epoki Żelaza bez jednostek Żelaza do Sztuki wojennej (tylko Brąz + Katapulta). Akceptować opóźnienie czy dodać
  część jednostek (np. Hastati, Falanga) pod Hutnictwo? Rekomendacja: pełny postulat, z decyzją o tymczasowej armii.
- ABC 3: Wielka odlewnia i Wielka Kuźnia (`epokaWejscia: 4`) — przypisać do epoki 3 (dziś martwe), czy zostawić do wdrożenia
  epoki 4 (temat `#57` wstrzymany)? Rekomendacja: zostawić, dopóki epoka 4 nie wraca, i oznaczyć w tabeli jako martwe.
- ABC 4: Katapulta (Oblężnictwo) i Hieros Lochos — Katapulta zostaje na Oblężnictwie (rekomendacja), Hieros przechodzi na
  Sztukę wojenną (usuwa dziś jedyną jednostkę Żelaza bez techu).

## 8. Zgodność i ograniczenia audytu

- Zmiany w `gra/`: NIE. `WERSJE.md`: NIE. `git add -A`: NIE. Push i deploy: NIE.
- Testy i gra na żywo: NIE_ZMIERZONO.
- Wpływ na balans i AI: NIE_ZMIERZONO (brak symulacji); tylko wnioski z kodu i danych.
- Rozbieżności danych wykryte przy audycie: (a) Triari/Evocati/Hieros nie są w opisie Hutnictwa w tech.json, (b) `kopalnia_zelaza.epoka = 3` nie jest sprawdzane osobno (działa przez tech Hutnictwo), (c) epoka 4 w buildings.json bez techu ustawiającego epokę 4.
