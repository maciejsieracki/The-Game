# 04 — Analiza: MAPA / RENDER

*Wygenerowano autonomicznie: 2026-06-26 | Źródła: MAPA-DO-MASTERA.md, DOKUMENTACJA-Civ-MAPA.md, DZIENNIK-MASTERA.md*

---

## 1. Zakres lane'a

**MAPA/RENDER** — świat, teren, rzeki, miasta, surowce, ulepszenia, ruch na mapie, widok główny/HUD. Pliki wyłączności:
- `src/render/scene.ts`, `src/render/stoneCity.ts`, `src/render/bronzeCity.ts`, `src/render/resources.ts`, `src/render/improvements.ts`, `src/render/cities.ts`
- `src/map/generator.ts`, `src/map/gen-helpers.ts`, `src/map/territory.ts`, `src/map/clusters.ts`
- `src/mainview/*`, `src/movepreview/*`, `src/mappreview/*`, `src/improvepreview/*`
- Makiety/podglady: `Civ-MAPA/` (Gra-podglad-MAPA/MIASTA/MIASTA-BRAZ/ULEPSZENIA/RUCH/WIDOK-GLOWNY/KLASTRY.html)

## 2. Stan obecny (~62% ukończenia)

### ZROBIONE (zsync do gra/src, podglady w Civ-MAPA/, NIE w kanonie — czeka na 6B)
- **Mapa świata F1** (zaakceptowana): teren/biomy/rzeki (trasowanie wierzcholkowe + delta)/ocean/ramka/fog
  - Rzeki na KRAWĘDZIACH heksów (graf rogów), spływ w dół do morza, kończą na pierwszym styku z wodą, delta = wachlarz strug
  - Wysokość rzeki = MAX sąsiadów (nie znika)
  - Góry: białe czapy-stożki, -50% wysokości
  - Wybrzeże: reguła "każdy ląd ≥1 heks Wybrzeża" (generator post-przebieg 1b)
  - Las/góry INSTANCJONOWANE (InstancedMesh) — brak dławienia FPS na 20k heksów (decyzja 1A); oazy doinstancjonowane; surowce/rzeki rzadkie/lekkie
- **Miasta**:
  - Kamień 10 poziomów (`stoneCity.ts`, zaakceptowane): L1-5 prymityw (lepianki/szalasy + ognisko L3+); L6-10 cegła + megalit (krąg + dolmen); sztandar L5+; murek L7+
  - Mury niezależne od poziomu (withWalls)
  - Brąz 9 nacji (`bronzeCity.ts`): Grecja (świątynia z kolumnami + fronton), Rzym (czerwone dachówki + świątynia na podium), Sumer (zikkurat), Egipt (pylon + obeliski), Inkowie (tarasy + złota platforma), Aztek (piramida schodkowa — ZAPAS na przyszłość), Chiny (hala + szerokie okapy), Zulusi (kraal + wielka chata), Celtowie (nemeton: krąg kamieni + idol), Germanie (longhouse + drewniany hof)
  - Palisada dla zulu/celt/german zamiast kamiennych murów
- **Surowce** (`resources.ts`): małe nakładki (kon/owca/krowa/lama/glina/ruda) — zaakceptowane
- **Ulepszenia terenu** (`improvements.ts`): 15 ulepszeń + `pole_irygowane` (uprawa+irygacja na jednym polu)
  - Lista: droga, irygacja, farma, pastwisko, kopalnia, glinianka, kamieniolom, obóz łowiecki, wyrąb, tarasy, łodzie rybackie, posterunek, plantacja, warzelnia soli, fort
  - IRYGACJA tylko na heksie sąsiadującym z RZEKĄ (brak łańcuchów — zasada Macieja); bez rzeki → FARMA (słabsza)
- **Widok główny / HUD** (`mainview`): 13 elementów wg Civ7 nad żywą mapą; ikona Budowa → tryb placement z ghost-preview (polprzezroczysty model na hover, solidny po kliku)
- **Zakładanie miast z mapy** (tryb Budowa): miasto L1 per cyw; warunki: teren lądowy, dystans ≥5 od miast, w terytorium; nowe miasto rozszerza granicę (r5)
- **Zasięg cywilizacji** (`territory.ts`):
  - `cityTerritoryRadius(miasto)` = `cityRangeForPopulation(pop)` = `min(pop, 15)` (radius=pop, decyzja 2026-06-25)
  - Fort +10 / posterunek +5 BEZ zmian
  - Granica LINIA (wizual, osobne) zostaje
  - **Eksport `isInTerritory(q,r,nodes)`** dla SILNIK (zakładanie miast)
  - Eksport `cityRangeForPopulation(pop)` + `CITY_RANGE_CAP=15` dla EKONOMIA
- **Ruch jednostek po mapie** (prototyp `Gra-podglad-RUCH.html`):
  - Klik-by-iść z PODGLADEM ŚCIEŻKI (Dijkstra), NUMERY TUR (odległość w turach)
  - Pkt ruchu z units.json "Ruch", koszty z terrain-movement.json (99=nieprzejezdny, Las +1)
  - 1C MIN.1 POLE: tak (decyzja Macieja)
  - BRAK ZoC + HOOK REAKCJI przy wrogu (stub: flee=odsunięcie wroga / fight=stub bitwy)
  - STACKING bez limitu + licznik nad heksem (decyzja 3 Macieja)
  - Mgła wojny; koniec tury = reset pkt
  - STUB: droga 0.5 i przeprawa przez rzekę (kończy turę) — TODO
- **Oblężenie kontekst** (test `Gra-podglad-RUCH.html`): atak gracza na heks miasta → MAPA wykrywa i SKŁADA KONTEKST OBLĘŻENIA (atakujący/obrońca/miasto/teren/struktury mur-fort-posterunek/posiłki 1-heks/pozycje) + overlay "TRYB OBLĘŻENIA → UNITS"
- **Generator świata** (`generator.ts` + `gen-helpers.ts`):
  - `generateMap(width,height,seed,typ?='kontynenty')` — addytywnie (stare wywołania bez zmian)
  - NOWE `generujSwiat(seed, rozmiar, typ)` → rozmiar: 'malenki'(~1000)/'maly'(~2000)/'standardowy'(~5000)/'duzy'(~10000)/'ogromny'(~20000)
  - 3 TYPY lądu: kontynenty (2-4 masy), pangea (1 kontynent), wyspy (archipelag)
  - Wybrzeże/rzeki/złoża zachowane
  - SEED=0/undef → losowy (Date.now), zwracany w map.seed
  - ROZMIAR_DIMS: malenki 38×26 / maly 54×37 / standardowy 84×60 / duzy 120×84 / ogromny 168×119
- **Klastry** (`clusters.ts`): `computeClusters(map, opts)` → ClusterPlacement {rozmiarMapy, aktywneTypy(3/5/7/9), minDystans, playerTypIndex, klastry:[{typIndex, typ, centrum, miasta:[{q,r,isCapital}]}]}
  - Algorytm: Voronoi środki typów (≥15 od siebie) + Poisson miasta w regionie, stolica=najbliżej środka
  - **min_dist ADAPTACYJNY** (decyzja Macieja "mniejsza mapa = gęściej"): mała 4 / średnia 6 / duża 8 / ogromna 9 — cel pełne ~10 miast/klaster na każdym rozmiarze
- **Wioska entity** (kontakt dla EKONOMIA): `WioskaEntity = {q, r, typ:'wioska', owner, populacja (default 1), przypisanaDoMiasta?}`; przejęcie terytorium → owner nasz + przypisanaDoMiasta=najbliższe własne miasto; konwersja WIOSKA→MIASTO = założenie miasta (tryb Budowa)

### TESTY
- Build mainview zielony, zsync
- (testy jednostkowe MAPA = screenshot review Macieja)

## 3. Otwarte wątki / decyzje wiszące

| # | Wątek | Status | Czeka na |
|---|-------|--------|----------|
| 6 | Widok główny / HUD w grze | **BLOK** | Maciej: akceptacja układu 6B (warunek wpiecia do kanonu) |
| 9 | Ulepszenia terenu + posterunki (render gotowy) | **BLOK** | Maciej: akceptacja listy/wartości |
| #2 | Dostęp surowców = boolean | ROBI | MAPA+EKONOMIA+DANE |
| #Ruch | Traversal ruchu (front-end gotowy) | CZEKA | SILNIK wpina pathfinding/zużycie pkt w pętlę tury + mgłę |
| #Zakładanie | Akcja "załóż miasto" (front-end gotowy) | CZEKA | SILNIK wpina akcję w pętlę (zamiast Osadnika) + isInTerritory |
| #Oblężenie kontekst | Scena oblężnicza | CZEKA | UNITS scena bitwy oblężniczej (HP muru/bramy, machiny, szturm) |
| #Granica C | Render granicy politycznej | CZEKA | SILNIK wpina (isInTerritory wyeksportowane) |
| #Wynik bitwy | Nanoszenie WYNIKU bitwy na mapę | CZEKA | SILNIK sygnał zwrotny |
| #Nazwy miast | Render NAZW miast na mapie (z nazwyKlastra) | CZEKA | Maciej decyzja #4 |

### Decyzje Macieja wymagane (OD MAPA)
1. **6B**: akceptacja układu WIDOKU GŁÓWNEGO/HUD (warunek wpiecia do kanonu)
2. Ocena miast BRAZU: Sumer / Egipt / Inkowie / Zulusi (reszta nacji OK)
3. Wybór docelowego STYLU GRANICY (rekom. C=tint+linia w grze, A=mocna linia na hover/klik miasta)
4. Czy renderować NAZWY miast na mapie (z nazwyKlastra) — jeśli tak, podepnę

### Dane wiszące OD INNYCH DZIAŁÓW (przez mastera)
- **MIASTO/EKONOMIA**: realne dane granic/zasiegu miast (ludnosc/poziom) → kontrakt `isInTerritory`; koszty/bonusy ulepszeń
- **MIASTO**: czy `pole_irygowane` = pełne ulepszenie → dodać klucz do terrain-improvements.json
- **UNITS/walka**: bonusy obrony (mur +200%, fort +100%, posterunek +50% dla jednostek obozujących)
- **MASTER**: wpiecie renderu miast/ulepszeń/widoku do kanonu — PO akceptacji Macieja (6B)

## 4. Decyzje Macieja zamknięte

- **F1 mapa + miasta + surowce** ZAAKCEPTOWANE (2026-06-22)
- **Inka/Aztek**: roster = INKOWIE (kanon); styl 'aztek' zostaje jako ZAPAS
- **Zasięg miasta = POPULACJA** (min(pop,15), cap 15) — decyzja 2026-06-25
- **1B terytorium** = bazowy zasięg (min(pop,15)) + zasięg kulturowy (cityBorderRadius +0..3, max r18) — addytywnie
- **Generator**: rozmiary 1000/2000/5000/10000/20000 (Malenki..Ogromny); typ gracz wybiera (kontynenty/pangea/wyspy); losowy seed co grę; instanced dla dużych (1A)
- **1A instancjonowanie** dekoracji — POTWIERDZONE (las/góry już instancjonowane, oazy dodane)
- **TYP świata domyślny** = KONTYNENTY; ekran "Nowa gra" NIE blokuje
- **min_dist adaptacyjny** (mniejsza mapa = gęściej): mała 4 / średnia 6 / duża 8 / ogromna 9
- **Ekspansja**: terytorium NIE blokuje zakładania (≥5 pól od miast) — master luzuje bramkę (1B)

## 5. Właściciele

| Rola | Model |
|------|-------|
| Implementacja ( Composer ) | `composer-2.5-fast` subagent |
| Generator spec, layout ( GLM ) | `glm-5.2-max` subagent |
| Screenshot review ( Opus ) | Opus 4.8 Ask/Agent |
| Decyzje 6B, U1, layout, nazwy miast | Maciej |

## 6. Quick wins / next

| # | Co | Effort | Impact |
|---|-----|--------|--------|
| QW2 | Granica C render (isInTerritory już wyeksportowane) | S | 🟠 Wizualna informacja terytorium |
| EP2 | Pełny generator mapy (typy + rozmiary z menu) | L | MAPA + SILNIK (GOTOWE) |
| #4 | Render nazw miast (po decyzji Macieja) | S | 🟡 Czytelność mapy |

## 7. Ryzyka

- **ROZBIEŻNOŚĆ rozmiarów**: SILNIK main.ts ma TYMCZASOWĄ tabelę `mapSizeToDims` (mala 30×22 / srednia 50×36 / duza 80×55 / ogromna 100×70) ≠ kanon MAPA (5 rozmiarów). Należy podmienić na `MAPA.generujSwiat`.
- **Spec-generator-mapy.md** ma stare wartości (5 typów, min_dist 5) — NIEAKTUALNY
- **computeStartPositions O(n²)** przy 20k heksów (NISKI priorytet)
- **Mount OneDrive tnie świeże pliki** — buduje z oczyszczonej kopii lokalnej; źródła w chmurze POPRAWNE
