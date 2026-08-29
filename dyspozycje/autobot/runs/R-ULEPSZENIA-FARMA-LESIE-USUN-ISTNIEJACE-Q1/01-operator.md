# 01-operator — R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1 (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1
GOAL: Zaden stan gry — nowa partia, trwajaca partia, wczytany zapis — nie zawiera farmy
stojacej na heksie z nakladka Las. Kazda taka farma (relikt reguly 2026-07-21) znika;
las na tym polu zostaje nietkniety; praca NIE wraca.

## 1. Punkt zaczepienia — wybor i UZASADNIENIE

Rozdzielone na trzy warstwy, kazda z wlasnym powodem istnienia.

### Warstwa 1 — regula i decyzja „co usunac": `gra/src/map/improvement-build.ts`

Nowe, czyste (bez mutacji, bez DOM/THREE-owych wywolan) funkcje:
`isLegacyFarmOnForestLayer`, `stripLegacyFarmOnForest`, `planLegacyFarmOnForestRemoval`,
`removeLegacyFarmsOnForest`.

Dlaczego tu: dispatch wskazuje ten plik jako naturalny dom obok
`stripImprovementsWhenForestRemoved`, a przede wszystkim — tu juz mieszka cala wiedza
o relacji „ulepszenie ↔ nakladka Las" (`FOREST_DEPENDENT_IMPROVEMENT_KEYS`,
`FOREST_COEXIST_IMPROVEMENT_KEYS`, `FOREST_BLOCKED_IMPROVEMENT_KEYS`, `isFarmBaseTerrain`).

Dlaczego OSOBNO od `stripImprovementsWhenForestRemoved`, a nie przez dopisanie `farma` do
`FOREST_DEPENDENT_IMPROVEMENT_KEYS`: tamten zbior odpowiada na PRZECIWNE pytanie — „co
znika, gdy znika LAS". Tu las jest przeszkoda, nie warunkiem: znika farma, las zostaje.
Zlanie tych dwoch regul w jedna liste kasowaloby farme przy wyrebie — dokladnie odwrotnie
niz kanon („wyrab zostaje jedyna droga do farmy na zalesionym heksie"). Bramka pilnuje tego
asercja (mutacja M14 potwierdza, ze asercja dziala).

### Warstwa 2 — ladunek zapisu: `gra/src/game/save.ts`

`migrateLegacyFarmsOnForestInSave(save)` wolana na koncu `deserializeGame`. Czysci
`mapSnapshot` (kolumna gesta `ulepszenieIdx`, kolumny rzadkie `ulepszenia` i
`improvementKey`) oraz `meta.placedImprovements`.

Dlaczego `deserializeGame`, a nie wyzej: to JEDYNE wejscie wszystkich sciezek wczytania —
localStorage/IndexedDB (`loadFromLocal`) i plik autozapisu FSA
(`fsa-autosave.ts::loadFsaAutosaveFile`). Jedno wpiecie zamiast trzech.

**Ograniczenie tej warstwy, zapisane wprost w kodzie i tu:** nakladke heksa da sie odczytac
WYLACZNIE z `mapSnapshot`. Zapis sprzed wprowadzenia mapSnapshotu (mapa regenerowana
z `seed`) nie niesie tej wiedzy, wiec ta funkcja go NIE rusza i tego nie udaje — zwraca 0.
Taki zapis sprzata dopiero warstwa 3. Bramka ma na to osobna asercje (sekcja 5b).

**Dlaczego regula jest w `save.ts` wyrazona drugi raz, zamiast importu z
`improvement-build.ts`:** `improvement-build.ts` ciagnie `render/improvements` → `three`.
Import stamtad wciagnalby caly render 3D do `game/save.ts` — modulu bez zaleznosci
renderowych, bundlowanego samodzielnie przez 4 narzedzia w `gra/tools/`
(`barb-camp-blacklist-test`, `barb-city-behavior-test`, `barb-city-capture-cluster-test`,
`planned-march-test`). Uznalem te cene za wyzsza niz koszt dwoch linijek reguly trzymanych
we wzajemnych odsylaczach — to ten sam wzorzec, co istniejacy „DRUGI, niezalezny gate"
`FOREST_BLOCKED_IMPROVEMENT_KEYS`. **To jest swiadoma decyzja projektowa, nie przeoczenie —
zglaszam ja Evaluatorowi do oceny.**

### Warstwa 3 — zywy stan gry: `gra/src/main.ts` (zmiana punktowa)

Jedna funkcja `sweepLegacyFarmsOnForest(reason)` + DWA wywolania. W main.ts zostaje
WYLACZNIE to, czego nie da sie stamtad wyjac: synchronizacja pol heksa
(`syncHexUlepszenieFields`), czyszczenie legacy `hex.ulepszenie` i odbudowa mesha.
Cala decyzja „co usunac" jest delegowana do warstwy 1.

**Wywolanie A — `restorePlacedImprovementsFromSave` (stan a: wczytanie zapisu).**
Tu, a nie wczesniej: `map` jest juz zbudowana (ze snapshotu ALBO zregenerowana z `seed`),
a `placedImprovements` odtworzone — to pierwszy moment, w ktorym znany jest komplet
„nakladka heksa + warstwy". Dzieki temu sciezka wczytania dziala TAKZE dla zapisow
sprzed mapSnapshotu, ktorych warstwa 2 dosiegnac nie moze.

**Wywolanie B — tuz po `turn++` w sekwencji konca tury (stan b: trwajaca partia,
stan c: nowa partia).** Trzy powody, dla ktorych to jest lepszy punkt niz „jednorazowy
przebieg przy starcie silnika":
1. To jedyny punkt, przez ktory przechodzi KAZDA partia niezaleznie od tego, jak powstala
   (nowa gra, wczytany zapis, partia trwajaca od przed ta zmiana) — bez wymogu
   przeladowania strony i bez zgadywania, gdzie „zaczyna sie" gra.
2. Stoi PRZED rotacyjnym autozapisem kilka linii nizej — pierwszy zapis po wejsciu zmiany
   w zycie utrwala juz posprzatany stan.
3. Trafia dokladnie w kryterium 2: „miasto traci zywnosc z tej farmy od KOLEJNEJ tury" —
   ekonomia nowej tury liczy sie nizej w tej samej sekwencji EOT, juz z czystego heksa.

Koszt: petla po heksach z natychmiastowym odrzuceniem wszystkiego, co nie jest lasem
(1008 heksow na mapie testowej, 20160 na `standardowy`) — raz na ture, po ustabilizowaniu
bez zadnej zmiany (idempotencja).

**Dlaczego pola heksa, a nie tylko `placedImprovements`:** zrodlem PLONOW w
`turn-economy.ts` jest `improvementKeysForHex(hex)`, czyli pola `hex.ulepszenia` /
`hex.ulepszenie` — NIE rejestr `placedImprovements`. Sprzatanie samego rejestru
zostawiloby farme dajaca zywnosc. Sprzatanie widzi oba nosniki, takze heks, ktory ma farme
wylacznie w polach (z mapSnapshotu, bez wpisu w `meta.placedImprovements`).

## 2. Skutek usuniecia — zdefiniowany jawnie

Heks wraca do stanu „las, bez ulepszenia": nakladka `Las` nietknieta, `hex.ulepszenia` /
`hex.improvementKey` / legacy `hex.ulepszenie` wyczyszczone, wpis w `placedImprovements`
usuniety (albo zredukowany do warstw nie-farmowych). Praca NIE wraca — raport sprzatania
nie ma zadnego pola zwrotu pracy/surowca (asercja pilnuje skladu raportu; mutacja M18
dodajaca pole `pracaZwrocona` czerwieni ja).

Pomiar realnymi funkcjami ekonomii (`hexToWorkedTile` → `tileYield`):
spadek zywnosci heksa = **dokladnie** `FARMA_POTENTIAL_FOOD_BONUS` z
`terrain-improvements.json`, a heks po sprzataniu daje **identyczny plon jak goly las**.
Farmy na Wzgorzach znikaja bez wyjatku terenowego (byly farmami lesnymi z definicji starej
reguly) — osobna asercja.

## 3. Pomiar PRZED / PO — 4 ziarna, dwie niezalezne sciezki

Scenariusz odtwarza uchylona regule 2026-07-21 („Laka/Rownina zawsze, Wzgorza gdy Las")
i stawia farmy wg niej na realnej mapie z `generateMap(36, 28, seed, 'kontynenty')`,
zapisujac je tak, jak robil to silnik (`ulepszenia` + `improvementKey` + legacy
`ulepszenie` + wpis w `placedImprovements`). Czesc heksow lesnych dostaje `farma+tartak`.

`MEASURE=1 node tools/farma-lesie-usun-istniejace-test.cjs`:

```
seed   | farmy na LESIE PRZED -> PO | farmy na OTWARTYM PRZED -> PO | heksy z Las PRZED -> PO
42     | 163 -> 0                   |  94 ->  94                    | 163 -> 163
4242   | 160 -> 0                   |  91 ->  91                    | 160 -> 160
777    | 164 -> 0                   |  85 ->  85                    | 164 -> 164
90210  | 148 -> 0                   |  88 ->  88                    | 148 -> 148
```

Ten sam pomiar wykonany DRUGA, niezalezna sciezka — pelny round-trip produkcyjny bez
zadnej repliki: `serializeMapForSave` → `serializeGame` → `deserializeGame` (tam siedzi
migracja ladunku) → `buildGameMapFromSnapshot` — daje identyczne PO = 0 na wszystkich
czterech ziarnach, przy nietknietych farmach na otwartym terenie i nietknietej liczbie
heksow z lasem. `isValidMapSnapshot` po migracji nadal zwraca `true` (migracja nie psuje
ksztaltu zapisu); `tura`/`seed` nietkniete.

Liczenie „farm na lesie" idzie przez REALNA sciezke plonow (`improvementKeysForHex`),
nie przez rejestr — czyli mierzy to, co widzi ekonomia.

## 4. Nowa partia (kryterium 1c) — POMIAR, nie zalozenie

Na tych samych 4 ziarnach, tuz po `generateMap`, bez zadnej ingerencji:
0 farm na lesie, `planLegacyFarmOnForestRemoval(...).removed === 0`, przy jednoczesnym
potwierdzeniu, ze mapa MA lasy (163/160/164/148 heksow) i ze plan przejrzal cala mape
(1008 heksow). Straznik istotnosci „mapa MA lasy" jest niezaleznie zaczerwieniany
mutacja M23 (generator przestaje sadzic las).

## 5. Idempotencja (kryterium 4)

`removeLegacyFarmsOnForest` jest idempotentna z konstrukcji — drugi przebieg nie znajduje
juz farmy na lesie. Asercje: drugi przebieg zwraca `removed: 0`, NIE wola `onHexChanged`
ani razu, nie zmienia rejestru, nie kasuje kontrolnych farm; trzeci przebieg BEZ callbacku
nie rzuca bledu. To samo dla migracji ladunku: drugie wywolanie
`migrateLegacyFarmsOnForestInSave` na juz zmigrowanym zapisie zwraca 0 (4 ziarna).
Mutacja M7 (plan zglasza zmiane takze gdy nic nie usunieto) i M11 (migracja klamie
o liczbie zmian) czerwienia te asercje.

## 6. Dowod nie-tautologiczny (kryterium 5) — 28 mutacji

Bramka przyjmuje `USUN_SRC_DIR=<kopia src>`, wiec mutacje sa robione na kopii zrodla, nie
w repo. Wynik pelnej baterii (`143 OK / 0 FAIL` na czystym zrodle):

| # | mutacja (plik → zmiana) | wynik |
|---|---|---|
| M1 | improvement-build: `isLegacyFarmOnForestLayer` porownuje do `'tartak'` zamiast `'farma'` | 114/29 FAIL |
| M2 | save.ts: `migrateLegacyFarmsOnForestInSave` → `return 0` na wejsciu | 131/12 FAIL |
| M3 | improvement-build: `stripLegacyFarmOnForest` bez straznika terenu | 142/1 FAIL |
| M4 | main.ts: usuniete wywolanie `sweepLegacyFarmsOnForest('granica tury')` | 140/3 FAIL |
| M5 | improvement-build: zdjete WSZYSTKIE TRZY straznice terenu (naprawa za szeroka) | 119/24 FAIL |
| M6 | improvement-build: sprzatanie kasuje TAKZE nakladke Las | 136/7 FAIL |
| M7 | improvement-build: plan zglasza zmiane bez usuniecia (lamie idempotencje) | 132/11 FAIL |
| M8 | terrain-improvements: `improvementKeysForHex` zawsze dokleja `'farma'` | 111/32 FAIL |
| M9 | terrain-improvements: `improvementKeysForHex` zawsze `[]` | 115/28 FAIL |
| M10 | save.ts: migracja psuje ksztalt snapshotu i zeruje `tura` | 135/8 FAIL |
| M11 | save.ts: migracja zwraca `touched.size + 1` | 137/6 FAIL |
| M12 | save.ts: migracja rejestru bez straznika lasu | 137/6 FAIL |
| M13 | improvement-build: regula obejmuje glinianke/oboz/irygacje/owce (§14) | 138/5 FAIL |
| M14 | improvement-build: `farma` dopisana do `FOREST_DEPENDENT_IMPROVEMENT_KEYS` | 142/1 FAIL |
| M15 | improvement-build: przywrocona uchylona regula 2026-07-21 (kwalifikacja) | 141/2 FAIL |
| M16 | improvement-build: sprzatanie dopisuje do rejestru mimo `fromPlaced === false` | 141/2 FAIL |
| M17 | main.ts: usuniete wywolanie `sweepLegacyFarmsOnForest('wczytanie zapisu')` | 140/3 FAIL |
| M18 | improvement-build: raport dostaje pole `pracaZwrocona` | 142/1 FAIL |
| M19 | improvement-build: zepsute liczniki `scanned` / `farmsOnOpenTerrain` | 137/6 FAIL |
| M20 | save.ts: migracja ZGADUJE las (czysci rejestr bez mapSnapshotu) | 137/6 FAIL |
| M21 | save.ts: migracja kolumn snapshotu bez straznika lasu | 135/8 FAIL |
| M22 | save.ts: migracja kasuje TAKZE las w snapshotcie | 139/4 FAIL |
| M23 | gen-helpers: generator nie sadzi lasu (straznik istotnosci) | 131/12 FAIL |
| M24 | improvement-build: oboz lowiecki przestaje zalezec od lasu | 142/1 FAIL |
| M25 | terrain-improvements: `migrateImprovementLayers` zaczyna kasowac farme w lesie | 142/1 FAIL |
| M26 | main.ts: przemianowana funkcja `sweepLegacyFarmsOnForest` | 140/3 FAIL |
| M27 | improvement-build: `stripLegacyFarmOnForest` wymysla warstwe na pustej liscie | 142/1 FAIL |
| M28 | improvement-build: regula obejmuje hodowle + zdjete straznice terenu | 118/25 FAIL |

**Pokrycie: 80 / 80 rodzin asercji** (asercje parametryzowane ziarnem policzone jako jedna
rodzina) czerwieni sie pod co najmniej jedna z tych mutacji. Zadna nowa asercja nie jest
tautologiczna.

Uwaga metodologiczna warta zapisania: wlasnosc „naprawa nie jest za szeroka" okazala sie
**potrojnie strzezona** (`isLegacyFarmOnForestLayer` → `stripLegacyFarmOnForest` →
straznik w `planLegacyFarmOnForestRemoval`). Zadna JEDNOLINIJKOWA mutacja jej nie lamie —
dlatego M5 i M28 zdejmuja wszystkie trzy straznice naraz. To wlasnosc konstrukcji, nie
luka testu, ale zglaszam to jawnie, zeby nie wygladalo na naciagniecie definicji
„jednej celowanej mutacji".

## 7. Zmiana w bramce sasiedniego tematu (`farma-nie-w-lesie-test.cjs`)

Sekcja (7) tamtej bramki nosila komentarz „ZAKRES NIEROZSTRZYGNIETY: farmy JUZ STOJACE na
lesie — osobne pytanie ABC" i opisy asercji twierdzace, ze farma w lesie „przezywa"
migracje. Po rozstrzygnieciu (wariant C) te opisy byly juz nieprawdziwe co do stanu gry.

Zmienilem WYLACZNIE komentarze i opisy dwoch asercji — **zero zmian w logice testu, zero
asercji dodanych/usunietych**. Bramka nadal 136/0. Asercje zostaja i nadal pelnia rolę
straznika: pilnuja, ze sprzatanie NIE zostalo wlozone do `migrateImprovementLayers` ani do
`stripImprovementsWhenForestRemoved` (zlanie warstw kasowaloby farme przy wyrebie).

## 8. Bramki

| bramka | wynik | odniesienie |
|---|---|---|
| `tools/logic-test.cjs` | **213/213** | 213/213 |
| `tools/tech-tree-test.cjs` | **19 pass, 0 fail** | 19/0 |
| `tools/research-test.cjs` | **33/33** | 33/33 |
| `tools/unit-replace-test.cjs` | **13/13** | 13/13 |
| `tools/combat-test.cjs` | **6/6** | 6/6 |
| `tools/farma-nie-w-lesie-test.cjs` | **136 passed, 0 failed** | 136/0 |
| `tools/map-improvement-qualify-test.cjs` | **117 pass, 0 fail** | 117/0 |
| `tools/farma-lesie-usun-istniejace-test.cjs` (NOWA) | **143 OK / 0 FAIL** | — |
| `tsc --noEmit` | **0 bledow** | — |
| build (`vite build --outDir /tmp/civ-dist-farma-legacy-op --emptyOutDir`) | **OK, 848 modulow, 25.84 s** | — |

## 9. §13a — czego NIE udowodnilem

- **Wpiecie w `main.ts` nie jest dowiedzione POMIAREM.** `main.ts` (32 tys. linii, DOM +
  THREE) nie da sie zbundlowac samodzielnie. Sekcja (7) bramki sprawdza je STRUKTURALNIE
  po zrodle: istnienie funkcji, delegacja do `removeLegacyFarmsOnForest`, obecnosc obu
  wywolan, dokladnie 3 wystapienia nazwy (1 definicja + 2 wywolania), pozycja wzgledem
  `restorePlacedImprovementsFromSave` / `syncLivestockAndPlacedMeshes` oraz wzgledem
  `turn++` / `doRotatingAutosave()`. To slabszy rodzaj dowodu (regex po zrodle) i jest
  w bramce jawnie tak oznaczony. Mutacje M4, M17, M26 potwierdzaja, ze te asercje reaguja.
- **ZERO weryfikacji w przegladarce.** Nie uruchamialem gry. Nie mam dowodu, ze mesh farmy
  faktycznie znika z ekranu ani ze panel miasta pokazuje nizszy plon — mam wylacznie dowod
  na poziomie danych i funkcji ekonomii. Zielona bramka NIE jest dowodem zachowania
  w rozgrywce.
- **Nie zmierzylem realnego kosztu przebiegu na mapie `standardowy` (20160 heksow)**
  w warunkach gry — argument o taniosci opiera sie na ksztalcie petli (wczesne odrzucenie
  po `nakladka !== Las`), nie na pomiarze FPS.
- **AI CYWILIZACJI (komputerowi przeciwnicy) i AI GRACZA (automat wspierajacy gracza):**
  sprzatanie jest globalne po `map.hexes` + `placedImprovements`, wiec z konstrukcji
  obejmuje farmy KAZDEGO wlasciciela, nie tylko gracza. Nie mam jednak POMIARU na
  rozgrywce z aktywnymi AI CYWILIZACJI — `placedImprovements` jest jedna globalna mapa bez
  ownera (patrz `placedImprovementsForOwner`), wiec dowod jest strukturalny, nie
  behawioralny. Zglaszam to jako brak dowodu, nie jako potwierdzenie.
- **Decyzja projektowa do oceny Evaluatora:** powtorzenie reguly „farma + las" w `save.ts`
  zamiast importu z `improvement-build.ts` (uzasadnienie w §1, warstwa 2).

ZMIANY/COMMIT: patrz naglowek kontraktu na koncu.

TESTY: sekcja 8 (wszystkie bramki referencyjne + dwie bramki tematyczne + nowa bramka
143/0 + tsc 0 + build OK), sekcja 3 (pomiar PRZED/PO na 4 ziarnach, dwie sciezki),
sekcja 6 (28 mutacji, pokrycie 80/80 rodzin asercji).

BLOKADY: brak.

RUNDY: 1/5

NASTEPNY KROK: Evaluator (Opus 5, effort high).

DEPLOY/PUSH: push WYLACZNIE galezi tematu
`autobot/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`. Do `main` NIE pushowano, nie
integrowano, nie deployowano.
