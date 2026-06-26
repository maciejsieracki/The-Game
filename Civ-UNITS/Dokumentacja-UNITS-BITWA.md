# Dokumentacja — lane **Civ-UNITS** (render jednostek + bitwa taktyczna)

> Dokument dla deweloperów. Opisuje zakres Civ-UNITS: renderowanie modeli jednostek (`src/render/units.ts`)
> oraz taktyczną bitwę (`src/battle/*`). Ostatnia aktualizacja: 2026-06-25.
>
> **Panel sterowania parametrami bitwy:** `Bitwa-parametry.xlsx` (folder `Civ/`) — katalog wszystkich strojonych
> stałych bitwy, dziś zaszytych w kodzie (patrz §3 i Deliverable 2).
>
> **Konwencja kodu:** wszystkie pliki źródłowe są ASCII-only (polskie znaki w UI przez zwykłe ASCII gdzie się da).
> Wszystkie ścieżki w tym dokumencie są względem `gra/` o ile nie zaznaczono inaczej.

---

## 0. Zakres i granice lane Civ-UNITS

### Pliki NALEŻĄCE do lane (edytujemy)
| Plik | Rola |
|---|---|
| `src/render/units.ts` | **Jedyny właściciel.** Modele 3D jednostek (low-poly R6): `buildUnitModel`, ~14 kategorii, 7 super-jednostek, warianty kulturowe, hełmy, bronie, kołczany/proce, palety kolorów, `UnitRenderer` (sync na mapie + dispose). |
| `src/battle/battleScene.ts` | Scena bitwy taktycznej: siatka kwadratowa, facing, ruch, pętla tur, pojedynczy cios (wywołanie combat.ts), amunicja/pilum (B6), morale + rout-do-krawędzi, paski HP/amunicja/morale, prędkość (S / wirtualny zegar), kamera/zoom, pociski, deployment, koniec bitwy. |
| `src/battle/battle-terrain.ts` | Deterministyczny generator terenu pola bitwy: równiny/las/wzgórza/rzeka/bród/skały, gęstość, koszty ruchu, nazwy terenu dla combat.ts. |
| `src/battle/testBattle.ts` | DANE + builder bitwy testowej „T": presety (`maly`/`duzy`/`rzym_grecja` [default]/`konnica`), `MAIN_INFANTRY_COUNT`, `buildTestArmies`. |
| `src/gallery4/main.ts` | Samodzielna galeria 4-widoki (PRZÓD/LEWY/PRAWY/TYŁ) każdej jednostki z `units.json` przez `buildUnitModel`. |

### Pliki będące ZALEŻNOŚCIĄ (read-only — NIE ruszamy)
- `src/game/combat.ts` — **kontrakt `resolveCombat` (§5.1)**. Dokumentujemy, nie zmieniamy.
- `src/units/setup.ts` — `categoryOf(name, role, isSuper)` → klucz kategorii modelu (read-only).
- `src/data/loader.ts`, `src/types/*` — ładowanie danych i typy.
- `src/main.ts` — **SILNIK**. Wpięcie „T" → bitwa, sync jednostek na mapie z `typeId`, rebuild kanonu po zmianie `units.json`. Tylko Civ-SILNIK rusza `main.ts` i publikuje kanon `Gra-podglad.html`.
- `gra/data/*.json` — generowane z Excela; nie edytujemy ręcznie.

### Czego lane NIE robi
- Nie dotyka `main.ts` ani `src/render/scene.ts` (poza tym że `units.ts` jest plikiem współdzielonym — edytować POJEDYNCZO, jeden task naraz).
- Nie zmienia matematyki walki w `combat.ts`.
- Nie używa `export-data.py` / `npm run build` (patrz §3, §4).

---

## 1. RENDER JEDNOSTEK — `src/render/units.ts`

### 1.1. Wejście: `buildUnitModel(category, ownerColor_, unitName?)`
```ts
export function buildUnitModel(category: string, ownerColor_: number, unitName?: string): THREE.Group
```
- **`category`** — klucz kategorii modelu (z `categoryOf` w `setup.ts`).
- **`ownerColor_`** — kolor właściciela (tint szarf/tarcz/grzebieni/peleryn).
- **`unitName`** — OPCJONALNA nazwa wyświetlana. Gdy podana, nakładane są nadpisania per-kultura/per-nazwa, więc jednostki tej samej kategorii różnych kultur (i 7 super-jednostek) wyglądają WYRAŹNIE inaczej. Gdy pominięta → wynik identyczny jak dawne wywołanie 2-argumentowe (zero regresji dla starego `main.ts`).

Dispatch:
- `category === 'super' && unitName` → `buildSuperUnit(cultureFromName(unitName), ownerColor_, unitName)`.
- W przeciwnym razie → `buildCategoryModel(category, ownerColor_)`, a następnie (jeśli podano `unitName`) `applyCultureOverrides(...)`.

### 1.2. name → category (`setup.ts`) oraz name → culture (`units.ts`)
**`categoryOf(name, role, isSuper)`** (read-only, `setup.ts`) — case-insensitive, akcento-tolerancyjne dopasowanie po nazwie i roli; `isSuper` sprawdzane pierwsze (zawsze `'super'`). Kolejność: cywilne (osadnik/robotnik/zwiadowca) → morskie (galera) → konne (rydwan, konnica) → falanga (przed włócznikiem) → legionista (przed miecznikiem) → włócznik/miecznik/łucznik/procarz/oszczepnik/maczuga/topór → `domyslny`.

**`cultureFromName(name)`** (`units.ts`) — z nazwy wyciąga tag kultury, mirrorując pole „Kultura" z `units.json`. Tagi: `rzym | grecja | chiny | zulu | inka | egipt | sumer | neutral`. Super-jednostki najpierw (każda nazwa unikalna). `neutral` = brak markera (jednostki generyczne).

> **`testBattle.ts` ma własną kopię `categoryFor()`** (mirror `categoryOf`, ograniczony do kategorii produkowanych przez presety) — z założenia, bo `setup.ts` jest poza lane / read-only.

### 1.3. Lista kategorii (~14 gałęzi `switch`) + 7 super
Gałęzie `buildCategoryModel` (po jednej, każda inny model):
`falanga` · `legionista` · `osadnik` · `miecznik` · `wlocznik` · `lucznik` · `procarz` · `oszczepnik` · `maczuga` · `topor` · `konnica` · `rydwan` · `super` (generyczny, gdy brak nazwy) · `zwiadowca` · `robotnik` · `galera` · `domyslny` (default).

**7 SUPER-jednostek** (każda inna — `buildSuperUnit` dispatchuje po kulturze):
| Kultura | Builder | Charakterystyka |
|---|---|---|
| `rzym` | `buildSuperRome` (Evocati) | czerwona tunika, ozdobna brązowa galea (bowl+cap+poprzeczny czerwony grzebień), prostokątny scutum ze złotym trymem, gladius. |
| `grecja` | `buildSuperGreece` | hoplicki elit. |
| `chiny` | `buildSuperChina` | (Hu Ben / tygrys). |
| `zulu` | `buildSuperZulu` (uThulwana) | tarcza z krowiej skóry, pióra. |
| `inka` | `buildSuperInca` | gwardia królewska. |
| `egipt` | `buildSuperEgypt` | khopesh, motyw nemes. |
| `sumer` | `buildSuperSumer` | miedź/verdigris. |

Wszystkie 7 dzielą szkielet awatara R6, sztandar (`addSuperBanner`) i proporcje, ale mają inny kolor ciała, nakrycie głowy, tarczę i broń główną. Gdy `buildUnitModel('super', color)` wywołane BEZ nazwy → generyczna gałąź `case 'super'` (zero regresji).

### 1.4. Warianty kulturowe — `applyCultureOverrides(group, category, culture, ownerColor_)`
Lekko różnicuje oczywiste warianty kulturowe wspólnej kategorii — jako MAŁE ADDYTYWNE meshe (nakrycie/emblemat/łatka koloru) doklejone na gotowy model generyczny, NIGDY przebudowa. Dla `neutral` → no-op. **Pomijane dla `konnica`/`rydwan`/`galera`** (jeźdźca/kadłub stawia się w niestandardowych kotwicach). Dorzuca:
- emblemat-łatkę koloru „domu" kultury na torsie (`cultureHouseColor`),
- per-kultura akcent głowy: `egipt`=pasiasty brow nemes (blue+gold) · `zulu`=pióro/cowhide · `chiny`=lakierowany knob · `inka`=dwa pióra w opasce · `grecja`=karmazynowy grzebień · `rzym`=krótki poprzeczny czerwony grzebień · `sumer`=miedziana opaska.

Nowe materiały/geometrie dopinane do `userData['mats']`/`userData['perTokenGeos']`, więc dispose je obejmuje.

### 1.5. Budowa modelu (proporcje, części)
Awatar w stylu **Roblox R6**, wszystko w jednostkach względem `HEX_R` (=1.0), stopy na `y=0` grupy, wysokość ~0.55·HEX_R. `buildBaseAvatar(skin, cloth, ownerCol)` daje:
- 2 nogi (`AV_LEG_*`, ciemne spodnie), tors (`AV_TORSO_*`, kolor tkaniny), 2 ramiona, szyję, głowę (skóra) z 2 ciemnymi oczami,
- **szarfę koloru właściciela** na froncie torsu (zawsze widoczna).
Zwraca też kotwice Y (`torsoTopY`, `headTopY`) i meshe ramion (do doklejania broni).

Wspólne pod-zespoły (singletony geometrii): `addGreaves`, `addPteruges`, `addHipSword`, `addBoots`, `addHands`, `addBelt`, `addTunicHem`. Koń (`buildHorse`) wspólny dla `konnica` i `rydwan` — facing −Z, zwraca Y grzbietu (gdzie siedzi jeździec).

**Geometrie = współdzielone singletony** (leniwe `getGeo*()`); **materiały = per-token** (zbierane do `userData['mats']`); unikalne per-token geometrie → `userData['perTokenGeos']`.

### 1.6. REGUŁA HEŁMÓW
**Każda jednostka WRĘCZ ma widoczny hełm**; strzelcy mogą bez. Konkretnie:
- `legionista` → **galea** (brązowy bowl owijający głowę + domed cap + brow ridge + flared neck guard + cheek guards + czerwony poprzeczny grzebień).
- `falanga` → hełm koryncki + poprzeczny grzebień z końskiego włosia.
- `miecznik` → spangenhelm stożkowy + nasal + cheek guards + czerwony grzebień.
- `wlocznik` / `domyslny` → **szeroki zaokrąglony hełm-misa** (`getGeoMeleeHelm`, promień > pół-szerokości głowy, więc wyraźnie zachodzi nad czaszkę) + domed cap + brązowy brow band + grzebień — by włócznik czytał się jako hełmowy z odległych 4 widoków galerii.
- `maczuga` / `topor` → hide/leather skull-cap (`getGeoSkullCap`) — era-appropriate dla jednostek z epoki kamienia, by nie były „gołogłowe".
- `lucznik` / `procarz` / `zwiadowca` / `robotnik` / `osadnik` → bez metalowego hełmu (czapka skórzana, opaska, kapelusz słomiany) — strzelcy/cywile.

### 1.7. Bronie i pociski (model)
- **Łucznik (`lucznik`)** — wysoki łuk recurve gripowany w lewej dłoni (segmentowany łuk z cienkich boxów, łuk gnie się w płaszczyźnie Y-Z), cięciwa, bracer skórzany, **pełny kołczan na plecach** z wystającymi strzałami (krótki shaft + lotka).
- **Procarz (`procarz`)** — **ZWISAJĄCA proca** w prawej dłoni: dwa cienkie rzemienne sznurki opadające z pięści do małej skórzanej kieszonki z pociskiem; zapasowa kieszeń na biodrze.
- **Oszczepnik (`oszczepnik`)** — jeden oszczep wzniesiony do rzutu + pęczek 2 zapasowych przy lewym ramieniu, mały puklerz.
- **Legionista** — pilum w ręce + gladius w pochwie na biodrze.

**Kształty pocisków w locie** (`makeProjectileMesh`, wybór przez `projectileKind`): wymiary × `TILE_S`.
| Typ | Kategoria/nazwa | Kształt |
|---|---|---|
| `arrow` | lucznik / rydwan (łucznik na rydwanie) | strzała: **bardzo cienki, krótki** trzon (len 0.34, R 0.009) + mały grot + lotka. |
| `javelin` | oszczepnik | oszczep: **dłuższy i grubszy** (len 0.60, R 0.028 — ~3× grubszy, ~2× dłuższy niż strzała) + większy grot. |
| `pilum` | legionista | ciężki oszczep: trzon + cienki zelazny szpikulec (0.18) + grot. |
| `sling` | procarz | mały kulisty kamyk (r 0.05), bez trzonu. |
Pociski: matowe materiały (drewno/żelazo/kamień), bez emissive (żaden fireball).

### 1.8. Paleta kolorów per kultura/rola
„Vivid distinct palette" — każda KATEGORIA ma wyraźnie inny, bardziej nasycony kolor tuniki/peleryny/tarczy w autentycznym zakresie starożytnych barwników (kermes/madder reds, woad/Egyptian blue, malachit/verdigris greens, ochry, orpiment yellow, tyryjskie purpury). Skóra, rzemienie i metale hełmów zostają realistyczne. Przykłady: `legionista`=kermes red, `miecznik`=rust, `wlocznik`=teal (sumeryjska miedź), `lucznik`=forest green, `zwiadowca`=olive (inny zielony niż łucznik), `procarz`=ochre, `oszczepnik`=terracotta, `topor`=burgundy, `super`/`konnica`=crimson, `osadnik`=woad blue, `domyslny`=indigo. Kolory „domu" kultury: `cultureHouseColor()` (rzym=red, grecja=woad, chiny=lacquer, zulu=hide-red, inka=ochre, egipt=linen, sumer=teal). Kolory właściciela: `OWNER_COLORS[8]` (0=gracz złoto, 1=czerwony, 2=zielony, 3=niebieski, 4=pomarańcz, 5=fiolet, 6=teal, 7=różowy).

### 1.9. Instancing / dispose
`UnitRenderer` (klasa) zarządza tokenami na mapie:
- **`sync(units)`** — tworzy/repozycjonuje tokeny; **przebudowa gdy `userData['cat']` różni się od `unit.category`**. Buduje przez `buildUnitModel(cat, color, unit.typeId)` — **przekazuje `typeId`**, więc model bierze rozróżnienia per-kultura/per-nazwa (Legionista vs Falanga vs uThulwana). Stoi na `terrainTopY(hex)` + `TOKEN_LIFT`.
- **`dispose()`** — usuwa wszystkie tokeny + highlighty, disposuje per-token materiały i unikalne geometrie (`_disposeToken`), a na końcu **wszystkie współdzielone singletony geometrii** (`geoAvLeg`...`geoSkullCap` = null). Highlighty (dyski `CylinderGeometry`, opacity 0.35, `0x66ccff`) i trasy (`TubeGeometry` złota + dots + torus celu) mają własne clear/dispose.

### 1.10. Galeria 4-widoki — `src/gallery4/main.ts`
Samodzielna strona (NIE galeria mapy). Dla każdego typu z `units.json` (dedup po nazwie, kolejność z pliku) renderuje: (1) nazwę + Nazwa EN (błękitna kursywa), (2) chipy Typ/Klasa/Nacja (Nacja wyróżniona złotym kolorem), (3) parametry (Epoka/Rola/Atak/Uderzenie/Obrona/Health/Ruch/Koszt), (4) **4 widoki obok siebie: PRZÓD(+Z), LEWY(−X), PRAWY(+X), TYŁ(−Z)**, (5) textarea na uwagi. Jeden współdzielony `WebGLRenderer` rysuje 4 kąty do offscreen canvas; bloki renderowane leniwie przez `IntersectionObserver`. **`buildUnitModel(category, OWNER_COLOR, name)` — PRZEKAZUJE NAZWĘ**, więc widać rozróżnienia per-kultura/super. Kamera: FOV 32, `FIT_RADIUS` 0.42, `MODEL_CENTER_Y` 0.27. file://-safe (singlefile, banner gdy brak WebGL).

---

## 2. BITWA TAKTYCZNA — `battleScene.ts` + `battle-terrain.ts` + `testBattle.ts`

### 2.1. Siatka kwadratowa N×M
B7 REWORK: mapa świata zostaje heksowa; **tylko pole bitwy** zamieniono z heksów na **regularną siatkę kwadratową** `BF_COLS × BF_ROWS` (**34 × 78**). Ruch / adjacencja wręcz / zasięg są **4-kierunkowe (N/E/S/W)**, dystans = **Manhattan w kaflach**. Geometria self-contained (bez `hexutil`):
```
cellToWorld(col, row) => { x: col*TILE_S, z: row*TILE_S }   // kafle stykają się, TILE_S=1.0
kafel = płaski BoxGeometry(S, TILE_H, S), górna ściana na y=0
```
**`tileTopY(tm, col, row)`** — Y widocznej powierzchni chodzenia: Wzgórza → `HILL_SUMMIT_Y`(=0.34); Rzeka/Bród → `−RIVER_DROP`(=−0.08); Plains/Forest/Rocks → 0. Używane przez deployment, animację ruchu, kotwice wręcz/dystans i paski/labelki, więc wszystko śledzi lift wzgórza.

### 2.2. FACING (SS5l) — `Dir`, `facingToward`, `relativeHit`
- **`enum Dir { N, E, S, W }`** (N=−row, E=+col, S=+row, W=−col). `DIR_DELTA`/`DIRS4` = kroki N/E/S/W.
- **`facingToward(dCol, dRow, fallback)`** — dominująca oś wygrywa; remis (|dCol|==|dRow|) preferuje poziom (E/W); wektor zerowy → `fallback`.
- **`relativeHit(defenderFacing, atkCol, atkRow, defCol, defRow)`** → `'front' | 'flank' | 'rear'`: kierunek OD obrońcy DO atakującego; == facing → front; przeciwny → rear; prostopadłe → flank.
- **Reguła:** ATAKUJĄCY obraca się, by FACE kafel który uderza (front → cel). OBROŃCA zachowuje SWÓJ facing, więc cios w bok/tył = FLANKA/TYŁ — ten łuk idzie do `flankRearDefensePenalty` / `resolveCombat.attackerPosition`, które stosują karę §5.1 do obrony.
- `dirYaw(d)` — Dir → `rotation.y` modelu (model patrzy w +X przy yaw 0).

### 2.3. RUCH 4-kier Manhattan + koszt terenu + animacja Y
- Każda jednostka ma punkty ruchu = `movementPoints(bu)` (stat „Ruch w bitwie (heksy)", domyślnie 2, min 1).
- Ruch krok-po-kaflu (`_doMove`), animowany; Y lerpowane między `tileTopY` źródła i celu (jednostka jedzie po terenie, wchodzi na szczyt wzgórza).
- Koszt wejścia per kafel: `terrainMap.moveCost` (Plains 1, Forest 2, Hills 2, **River INF=ściana**, Ford 3, Rocks 2).
- Pathing: BFS do najbliższego kafla z którego można atakować (`_firstStepAlongPathToAttack`) + greedy fallback (`_stepToward`) akceptujący tylko kroki ściśle zmniejszające dystans (brak bocznego błądzenia).

### 2.4. WALKA: jak wołany `resolveCombat` + pętla tur
**Pętla tur** (`_beginTurn` → `_activateNext` → `_activateUnit`): TURA = jeden przebieg po WSZYSTKICH żywych, nie-routujących jednostkach (interleave atk/def wg inicjatywy). Każda jednostka robi DOKŁADNIE JEDNĄ akcję: jeden ruch ALBO jeden cios. Na początku tury każdy dostaje świeże `moveLeft`. Bitwa NIGDY nie blokuje się na jednej parze walczącej do śmierci.

**Pojedynczy cios** (`_singleBlow(attacker, defender, ranged)`) — cios-za-cios; kontrcios pada na WŁASNEJ późniejszej turze ofiary. Per cios woła kanoniczne helpery z `combat.ts` (NIE pełny `resolveCombat` per cios — patrz niżej):
1. teren per-kafel: `terrainDefenseMultiplier(defTerrain obrońcy, rola atk, terrainData)` + `terrainRiverAttackMultiplier(atkTerrain atakującego, terrainData)`,
2. facing: `relativeHit(...)` → `flankRearDefensePenalty(cuD, hitArc)` → `defEffObrona = Obrona*(1−pen)`,
3. `defFinalObrona = defEffObrona * terrDefMult`, `atkEffAtak = Atak * terrRiverMlt`,
4. `counterMultiplier(...)`,
5. `hitChance(atkEffAtak, defFinalObrona)` vs `Math.random()*100`,
6. dmg: ranged → `rangeDamage(atkDyst*riverMlt, Pancerz)`; wręcz → `baseDamage(Atak, Pancerz, Przebicie, Uderzenie, isCharge)` (szarża = pierwszy cios danej pary, chyba że obrońca brace'uje — `bracesAgainstCharge`), × counter, min 1.
> Kolejność identyczna jak w `resolveCombat` (Obrona·(1−pen)·terr), więc cios-po-ciosie odpowiada modelowi kanonicznemu.

**SKIP → wynik** (`computeInstantResult`, wołane przez `skip()`): paruje żywych atk×def falami i woła **pełny `resolveCombat(cu_a, cu_d, { maxRounds:30, defenderTerrain, terrainData, counters, attackerPosition: arc })`** — facing i teren per-kafel jak w bitwie oglądanej.

### 2.5. B6 — AMUNICJA / PILUM
- `ammoCount(bu)` czyta **„Ilość pocisków"** (akcentowany klucz): liczba skończona → tyle rzutów; blank/nieliczbowe → `Infinity` (czyści strzelcy strzelają w nieskończoność).
- `canShoot(ru)` = `rangedBase && ammoLeft > 0`. Gdy ammo→0 jednostka jest traktowana jako **czysto wręcz** wszędzie (targeting, in-range, dispatch).
- **Legionista**: „Ilość pocisków" = 2 → rzuca 2 pila (`_doRangedAttack` zmniejsza `ammoLeft`), potem walczy gladiusem. (Pasek amunicji niebieski pokazuje 2 i znika przy 0.)
- `attackRange(bu)`: reach ≥ 2 → tyle; inaczej jeśli „Atak dystansowy" > 0 → `DEFAULT_RANGED_REACH`(2); inaczej 0 (czysto wręcz, wymaga adjacencji). Pole „(hex)" na siatce kwadratowej czytane jako liczba kafli.

### 2.6. POCISKI (lot, kształt per typ)
`_doRangedAttack` spawnuje pocisk lecący od torsu strzelca do torsu celu (każdy podniesiony o swój `tileTopY`+0.5, więc strzał z/na wzgórze leci na właściwej wysokości), aimowany jedną quaternion na +X. Czas lotu `RANGED_FLY_MS`=380, pauza po `RANGED_GAP_MS`=320. Kształt wg `projectileKind` (§1.7). Cios pada gdy pocisk ląduje (`_schedule(RANGED_FLY_MS, ...)`).

### 2.7. MODEL MORALE + rout-do-krawędzi

#### Podstawy
Każda jednostka ma dwie wartości morale z `units.json`: **„Morale bazowe"** (startowe, np. 100–120 dla elite) i **„Morale ucieczki"** (absolutny próg ucieczki, np. 18–25). Scena trzyma te wartości jako `morale` (bieżące), `moraleMax` (start = „Morale bazowe"), `fleeMorale` („Morale ucieczki"). `resolveCombat` pozostaje **NIENARUSZONY** — morale to księgowanie wyłącznie po stronie `battleScene`.

**Obliczanie straty morale z ciosu:** `loss = (dmg / maxHp) * MORALE_HIT_LOSS_SCALE` gdzie `MORALE_HIT_LOSS_SCALE=100`. Innymi słowy: utrata 10% maksymalnego HP = −10 morale (stała skala off 100, nie off bazy — każdy traci tyle samo punktów za ten sam proporcjonalny cios). Do tego dolicza się `extraMorale` (modyfikatory taktyczne poniżej).

**Próg ucieczki (rout):** jednostka łamie się gdy `morale <= fleeMorale` (jej per-unit „Morale ucieczki"). Gdy na stojącym kaflu jest teren obronny (wzgórze/las — `terrainDefenseMultiplier > 1`), efektywny próg jest obniżany o `MORALE_TERRAIN_RESIST=5` (jednostka trzyma się dłużej w dobrej pozycji).

**Rout-before-death:** cios, który rzutowo złamałby morale ofiary (`projMorale <= fleeMorale`) powoduje ucieczkę ZAMIAST śmierci, nawet jeśli HP > 0. Dopiero cios, który NIE łamie morale, może od razu zabić.

**ARMY_MORALE_LOSS_THRESHOLD = 0.25:** gdy sumaryczny wskaźnik morale CAŁEJ armii (suma bieżących morale / suma startowych morale, łącznie z poległymi i rozbitymi jako 0 / ich startową) spadnie poniżej 0.25 — strona PRZEGRYWA. Klęska morale armii, nie tylko jednostek.

#### 8 czynników modyfikujących morale
| # | Czynnik | Wartość | Szczegóły |
|---|---|---|---|
| 1 | Flanka | −8 | cios trafiony w bok obrońcy (`relativeHit='flank'`) |
| 2 | Tył | −15 | cios trafiony od tyłu (`relativeHit='rear'`) |
| 3 | Szarża jazdy | −15 | szarżujący (mounted) zadaje ten modyfikator przy pierwszym ciosie |
| 4 | Zabicie/rozbicie przez siebie | +6 | atakujący zyskuje gdy jego cios zabija lub routuje ofiarę |
| 5 | Wróg pada obok | +5 | pobliskie WROGIE jednostki (w promieniu `MORALE_DEATH_RADIUS=3`) zyskują morale gdy ktoś pada |
| 6 | Osaczenie | −10 (raz) | gdy ≥3 wrogów przylega jednocześnie (flaga `surroundApplied` zapobiega powtórzeniu) |
| 7 | Teren obronny — próg | −5 do progu ucieczki | na wzgórzu/lesie efektywny `fleeMorale` jest obniżony o 5 |
| 8 | Aura załamania armii | ×1.3 HP-strat | gdy `armyMoraleRatio < 0.40` straty HP-based mnożone przez 1.3 (spirala klęski) |
| (9) | Generał (placeholder) | +0 | `MORALE_GENERAL_AURA=0`, logika niezaimplementowana — przyszła funkcja |

Dodatkowo: **„Osłona wręcz"** — gdy strona traci OSTATNIĄ żywą jednostkę wręcz (`_checkMeleeScreenLost`), jej strzelcy jednorazowo tracą 50% bieżącego morale (flagowane przez `screenLostApplied`). Efekt realistycznie kończy sytuacje, gdy na polu zostają sami kiting-strzelcy.

#### Przebieg ucieczki
Po złamaniu morale (`_startRout`): jednostka natychmiast zwalnia swój kafel z mapy zajęcia, odwraca się ku WŁASNEJ krawędzi (atakujący → W/−X, obrońca → E/+X) i w kolejnych turach maszeruje na krawędź przez `_fleeStep` (normalny animowany ruch, jeden kafel/ruch). Po osiągnięciu krawędzi → `_removeUnitFromScene` (model + paski usunięte, dispose), liczy się jako OUT i rozsiewa morale jak strata (`_shakeAlliesOnLoss`). **Jeśli zablokowany przez teren/jednostki ≥2 tury (`fleeStuck >= 2`)** → usuwany z pola (zapobiega zamrożeniu na krawędzi).

**Niezłomni nie routują:** `isNeverRout(bu)` — null/blank „Morale ucieczki" LUB Uwagi zawierają „walczy do smierci"/„niezlomny". Tacy tracą morale (pasek czerwienieje) ale NIE łamią się morale — giną tylko przy HP ≤ 0.

**Hook pod „rally generała":** `routedUnits: { typeId, side, owner }[]` — `_startRout` dopisuje każdą routującą jednostkę. `// TODO: general rally recovery` — przyszła funkcja mogłaby konsumować tę listę.

### 2.8. PASKI (HP / amunicja / morale) + obwódka frakcji
Trzy paski billboardowane do kamery, follow-Y (incl. wysokość na wzgórzu). Od DOŁU do GÓRY: **HP** (zielony `>0.60` / żółty `>0.30` / czerwony) · **MORALE** (gradient zielony→czerwony wg ułamka morale) · **AMUNICJA** (NIEBIESKI `AMMOBAR_COLOR`, tylko ranged z ammo skończoną, szerokość = ammoLeft/ammoMax, chowa się przy 0 / dla melee). Jednostki wręcz i bez ammo nieskończonej = **2 paski** (HP + morale); strzelcy z ammo = **3 paski** (HP + morale + ammo).

**Obwódka frakcji:** za stosem pasków (bardziej ujemne Z w lokalnych współrzędnych) leży cienka ramka w kolorze strony: atakujący = czerwony (`0xe53935`), obrońca = niebieski (`0x1e88e5`). Ramka liczy się jako część grupy billboardowej, więc automatycznie śledzi teren i kamerę.

Rozmiary: **`HPBAR_W`=0.32**, **`HPBAR_H`=0.08/3**. Stack od `HPBAR_Y`=0.72 nad kaflem (tuż nad głową). **Toggle klawiszem H** (`barsVisible`, `_onKeyToggleBars`) — chowa/pokazuje grupę paska każdej żywej jednostki.

**Paski morale armii (lewy/prawy ekran):** dwa pionowe mierniki przyklejone do krawędzi ekranu (`TASK 5`). Lewa krawędź = atakujący (czerwony), prawa = obrońca (niebieski). Wysokość wypełnienia = bieżący `armyMoraleRatio` (0..1); kolor zmienia się wraz z wartością. Odświeżane co klatkę przez `_updateArmyMoraleBars`. Pokazują sumę morale wszystkich żywych / suma startowa.

### 2.9. PRĘDKOŚĆ (wirtualny zegar + kolejka timerów)
Całe TEMPO (chody, zamachy, lot pocisku, gapy `_schedule`, fade, labelki) liczone wobec **wirtualnego zegara `vNow`** (nie wall-clock). `_advanceVClock`: `vNow += min(wallDelta,100) * speedMul`. **Czysty time-scale** — `resolveCombat`/`_singleBlow`/rzuty/dmg NIE widzą mnożnika, więc WYNIK bitwy identyczny na wszystkich prędkościach; zmienia się tylko tempo odtwarzania.
- **`SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]`**, `_setSpeedIdx`/`_cycleSpeed`. **Klawisz S** cykluje (`_onKeySpeed`, na window, bail na polach edytowalnych i Ctrl/Meta/Alt). Wskaźnik „Predkosc: Nx" (zawsze-widoczny HUD na mapie).
- **Klawisz P** — pauza/wznowienie (`paused` = `true/false`); gdy zapauzowane wirtualny zegar stoi; na ekranie pojawia się nakładka `|| PAUZA (P)`.
- **Kolejka timerów wirtualnych** (`_schedule` → `vTimers`, drenowana raz/klatkę przez `_drainTimers`) zastąpiła polling rAF — fix root-cause: łańcuch krótkich gapów (tury/akcje) dogania się w pełni w klatce, więc tempo skaluje liniowo (guard 100000 by nie kręcić w nieskończoność).

### 2.10. TEREN BITWY — `battle-terrain.ts`
Deterministyczny (xmur3+mulberry32, seed `'bf:'+teren`). `enum BTerrain { Plains, Forest, Hills, River, Ford, Rocks }`. Gęsto zterraformowane (B9 „za łyso" fix), porównywalne do mapy świata:
- **Rzeka** kręta 1-2 kafle przez pas centralny + krótszy dopływ (tributary) ku flance; **brody (Ford)** gwarantują przejścia (`fordCount`=max(3, rows/6) + gwarantowany środkowy) — rzeka nigdy nie muruje pola.
- **Las**: `forestBlobs`=max(6, area/90) (~10-11 @34×78), promień 1-2 (czasem 3). **Wzgórza**: `hillBlobs`=max(5, area/120). **Skały**: `rockCount`=max(8, area/60).
- `deployMargin` zewnętrzne kolumny zostają równinami; `_carveBattleBox` dodatkowo czyści pasma szeregów + gwarantuje **korytarz starcia** przez rzekę, więc gęsty teren nigdy nie psuje grywalności.
- `combatTerrainName(col,row)` zwraca nazwę pasującą do „Teren" w `terrain-combat.json` (Plains/Rocks→„Plaskie (rownina/laka)", Forest→„Las", Hills→„Wzgorza", River/Ford→„Rzeka") — efekty §5.1 (obrona +50% na wzgórzu/lesie, −25% Atak przy przekraczaniu rzeki) + koszt ruchu.
- Render: `HILL_LIFT`=0.18, `HILL_SUMMIT_Y`=0.34, `RIVER_DROP`=0.08; kolory podłoża/dekoracji imitują low-poly mapy świata (stożki drzew, kopce trawy, plama wody, skały).

### 2.11. DEPLOYMENT — rozstawienie jednostek
`_placeUnits`: obie armie tworzą rozstawienie **według roli** — jedna ciągła linia wręcz (front), za nią rząd oszczepników, za nimi rząd łuczników/procarzy; jazda/rydwany na skrzydłach linii. Konkretnie:
- **Rank 0 (front):** wszyscy piechurzy wręcz (nie-strzelcy, bez konnych) → jedna szeroka linia.
- **Rank 1:** oszczepnicy (kategoria zawiera „oszczep").
- **Rank 2:** pozostali strzelcy (łucznicy, procarze).
- **Skrzydła:** jazda/rydwany na górnych i dolnych wierszach najszerszej linii.

Każda grupa wycentrowana na polu; gdy szerokość grupy > BF_ROWS → automatycznie dodatkowe szeregi za nią. Jazda w pierwszej kolumnie (front). Kolizje/kafle nieprzejezdne rozwiązywane skanem innych wierszy/szeregów w obrębie docelowej kolumny. Każda strona cap `MAX_PER_SIDE`=84 (`.slice(0, 84)`). Presety z `testBattle.ts`; `MAIN_INFANTRY_COUNT`=20 skaluje naglówkowe `rzym_grecja` (domyślny preset: 84 jednostki na stronę). `FRONT_GAP=5` kafli między frontami; `RANK_WIDTH=20` figur w jednym szeregu.

> **BRIDGE „T":** `main.ts` na „T" podaje scenie kanoniczny roster → `expandTestBattleComposition` WYKRYWA tę sygnaturę i przebudowuje OBIE armie z domyślnego presetu (`buildTestArmies(data.units)`). Każda inna bitwa przechodzi bez zmian.

### 2.12. AI taktyczna — oba obozy
SS5h: AI steruje OBOMA stronami w bitwie oglądanej. Logika w `battleScene._activateUnit`. Oto reguły zaimplementowane:

**Targeting ogólny:** `_nearestEnemy` (Manhattan). Routujący nie są celami (`_enemiesOf` filtruje routed).

**Jednostki wręcz:** jeśli wróg jest adjacentny → cios; w przeciwnym razie `_advanceStep` (BFS do najbliższego kafla z którego można atakować). Out-of-ammo strzelec spada na tę ścieżkę (TASK 4): cofa się `FALLBACK_TILES` w kierunku własnego tyłu, potem `HOLD` — walczy melee tylko gdy wróg dosięga go (adjacent).

**Dystansowe (kite & shoot):** priorytetowa logika w `_rangedAction` (deterministyczna, bez oscylacji):
1. **KITE:** jeśli zagrożenie wręcz (`primaryRanged` + wróg wręcz w odległości ≤ `MELEE_SAFE_GAP=2`) → krok wstecz na kafel skąd można jeszcze strzelać (`_bestKiteShotStep`), po kroku strzał w tej samej turze. Cornered → strzela w miejscu.
2. **SHOOT:** wróg w zasięgu strzału i żadne zagrożenie wręcz → strzela od razu (stoi, nie rusza). Shooting beats moving.
3. **APPROACH:** żaden wróg w zasięgu → krok naprzód wzdłuż osi natarcia (advance axis), trzymając własny rząd (LANE), zatrzymuje się gdy wróg wchodzi w zasięg.

**Jazda/rydwany (`_cavalryAction`):** priorytet celów: jazda wroga (0) → strzelcy (1) → piechota wręcz (2) → włócznicy/falanga (najgorszy cel, 2.5). Manewruje omijając spear wall (`_cavManeuverStep`): kary za sąsiedztwo z anti-cav włócznikami/falangą. Atakuje włócznika tylko gdy cornered (żadnego innego celu adjacent i brak lepszego manewru).

**Falanga (`_phalanxAction`):** trzyma linię i NIE goni skirmisherów. Logika spójności linii: `_phalanxLineFront` wyznacza kolumnę marudera; każda falanga czeka gdy wyprzedziła marudera o więcej niż `PHALANX_LEAD_TOLERANCE` kafli. Przy ataku kieruje się ku najbliższemu wrogowi NIE-dystansowemu (ignoruje uciekających strzelców). Gdy ostatni wróg wręcz to sami kiting-strzelcy → trzyma linię, nie goni.

**Rout = ruch turowy do własnej krawędzi:** `_fleeStep` (opisany w §2.7). `fleeStuck >= 2` → znika, nie zamraża pola.

**Watchdog anty-pat (`STALL_TURN_LIMIT=6`):** jeśli przez 6 kolejnych tur nie zmienił się żaden HP/morale/liczba strat — `_stalled = true` → natychmiastowe rozstrzygnięcie (`computeInstantResult`).

### 2.13. KAMERA / zoom / pan
PerspectiveCamera **FOV 48**; patrzy na `camTarget` wzdłuż stałego `camDir`(0,0.92,0.92). **Zoom = dolly** wzdłuż `camDir` (`camDist`, ease 0.18/klatkę), clamp `[camDistMin, camDistMax]` = `[max(4, span·0.16), span·1.5]` (`span`=max(BF_COLS,BF_ROWS)·TILE_S). Domyślnie `span·1.05` (całe pole). **Kółko** = dolly (`exp(deltaY·0.0012)`), **+/−** = krok ×0.88/÷0.88. **Pan** = lewy-drag po canvas przesuwa `camTarget` po płaszczyźnie ziemi.

### 2.14. KONIEC BITWY — ekran wyników
`_checkEnd`: jednostka liczy się jako OUT gdy **dead LUB routed**. Strona przegrywa gdy (a) WSZYSTKIE jej jednostki są dead/routed, LUB (b) `armyMoraleRatio < ARMY_MORALE_LOSS_THRESHOLD=0.25`. Remis (mutual elimination) rozstrzyga suma pozostałego HP.

**Ekran końca (`_showEndScreen`):** modalny panel: tytuł „Zwyciestwo ATAKUJACEGO/OBRONCY!", statystyki obu stron (padli/rozbici, pozostali, HP), dwa przyciski — **„Szczegoly"** (per-unit tabela `_showEndDetails`: dwie kolumny, status każdej jednostki dead/routed/survived + pozostałe HP) oraz **„Zakoncz bitwe"** (wywołuje `onFinishCb` z wynikiem + `dispose` sceny). Fanfara AUDIO (`_sfxVictory`) przy pokazaniu ekranu.

### 2.15. AUDIO proceduralny (Web Audio API)
Brak zewnętrznych plików. Jeden `AudioContext` tworzony **leniwie** po pierwszym geście użytkownika (autoplay policy). Każda metoda jest guardowana — brak WebAudio → cichy no-op. Master gain bus (SFX) + ambient gain bus.

**SFX:**
- `_sfxMelee()` — metaliczny clash: 3 inharmoniczne oscylatory (triangle/sine, ~2100/3100/4500 Hz) + noise transient high-pass 3kHz. Throttling: min ~40ms gap; przy prędkości ≥16× losowe przerzedzenie.
- `_sfxShot()` — świst/twang: swept sine (1900→650 Hz, 0.18–0.22s) + airy noise bandpass 2300→1500 Hz.
- `_sfxDeath()` — padnięcie: sine drop (150→55 Hz, 0.22s).
- `_sfxRout()` — złamanie morale: sawtooth falling (280→90 Hz, lowpass 900 Hz, 0.5s).
- `_sfxVictory()` — fanfara: 3 nuty G4/C5/E5, trójkąt, rosnąco z przesunięciem 130ms.

**Ambient bed (`_startAmbient`):** spokojny, startuje raz po geście. Slow drone + miękki perkusyjny beat, bardzo niski gain (~0.05). Lekki flavour z nazwy terenu (las → wolniej, wzgórza → jaśniej, równina → rzadziej). Melodia pentatoniczna (major-ish) z feedback delay (0.38s, wet 0.18). Nigdy nie gra podniosłych dramatycznych motywów — celowo spokojny/ambient.

**Klawisz M** (`_onKeyMute`) — toggle całego audio (SFX + ambient). Stan widoczny w małym HUD pod wskaźnikiem prędkości: „Dzwiek: WL (M)" / „Dzwiek: WYL (M)".

---

## 2b. OBLĘŻENIE (mur + brama + machiny)

> Aktualny stan: SIEGE v2. Interfejs `SiegeOpts` / flaga `siege` w `BattleOpts` (`battleScene.ts`). Implementacja obejmuje: mur 3D z bramą (`siegeWall.ts`), dwa nowe typy kafli (`BTerrain.Wall/Gate`), trzy machiny (`units.json` Typ=Siege), AI oblężnicza i walka na koronie. Integracja z silnikiem gry (`siege.ts`) = lane SILNIK/MASTER.

### 2b.1. Kiedy bitwa staje się oblężeniem

Miasto bez muru jest zdobywane z marszu — zwykła bitwa polowa, bez dodatkowych warunków. Miasto z murem uruchamia tryb oblężenia: atakujący musi poświęcić turę na budowę machin, dopiero potem ruszają szturmem. W `testBattle.ts` preset `'oblezenie'` wyzwala ten tryb; w `BattleScene` przekazanie `siege?: SiegeOpts` w `BattleOpts` aktywuje całą mechanikę.

### 2b.2. Reguły oblężenia (projektowe)

- **Miasto bez muru** — zdobycie z marszu, żadnych machin.
- **Miasto z murem** — wymagana 1 tura budowy machin przed szturmem.
- **Mur** daje +200% obrony miastu (całemu celowi, nie tylko jednostkom); odpowiednik silnika oblężenia `siege.ts` (lane Master).
- **Brama** jest niedostępna dopóki machina nie zada jej wystarczających obrażeń; zwykłe jednostki obrażeń bramie nie zadają.

### 2b.3. Machiny oblężnicze (`units.json`)

Trzy jednostki z `Typ = "Siege"` i `Rola (linia) = "Oblężnicza"`. Wszystkie mają `Morale ucieczki = null` (niezłomne — machina nie routuje, ginie tylko przy HP ≤ 0). Ruch = 1 kafel/turę.

| Jednostka | Nazwa EN | Epoka | Atak | Udz. | Obrona | Pancerz | Przeb. | HP | Atak dyst. | Rola |
|---|---|---|---|---|---|---|---|---|---|---|
| Taran | Battering Ram | Kamień | 3 | 10 | 2 | 8 | 8 | 70 | 0 | łamie bramę/mur w zwarciu |
| Wieża oblężnicza | Siege Tower | Brąz | 0 | 0 | 4 | 6 | 0 | 90 | 0 | umożliwia piechocie wejście na mur |
| Katapulta | Catapult | Żelazo | 1 | 0 | 1 | 0 | 6 | 25 | 16 | dystansowa, burzy mur/bramę zza linii |

**Modele 3D** (`units.ts`): dispatch po nazwie (PL + EN) w `buildNamedUnit` — `buildBatteringRam`, `buildCatapult`, `buildSiegeTower`. Bryły Box/Cylinder/Cone (brak awatara humanoidalnego); kolory właściciela na dekoracjach. Kategoria fallback `'obleznicza'` (gdy brak nazwy) kieruje do `buildBatteringRam`.

**Wykrywanie:** `isSiegeUnit(bu)` — `Typ === 'Siege'` albo nazwa zawiera `'taran'`/`'battering'`/`'catapult'`/`'siege tower'`. `isSiegeTower(bu)` — nazwa zawiera `'wieza oblezn'` lub `'siege tower'`.

### 2b.4. Mur bitewny — `siegeWall.ts`

`buildSiegeWall(civ, opts)` zwraca `THREE.Group` — proceduralny mur z bramą. Parametry: `lengthTiles`, `tileSize`, `height` (domyślnie 3), `ownerColor`, `gateWidthTiles` (domyślnie 2). Funkcja jest deterministyczna (zero `Math.random()`).

**Architektura geometrii:**

- Głębokość muru (`wallD`) = co najmniej 1 tileSize — mur ma pełną głębię, nie jest cienką linią.
- **Chodnik bojowy** (`wallWalkY = H`) na górnej powierzchni, szerokość = `wallD` — jednostka stoi na koronie.
- **Blanki** wyłącznie na zewnętrznej krawędzi (`+Z` = strona atakującego).
- **Schody** (`addStairs`) — bieg stopniowy od dziedzińca ku murowi po stronie wewnętrznej; dwa biegi (lewy/prawy).
- **Brama** pośrodku; dwa warianty zamknięcia:
  - **Portcullis** (krata żelazna, `addPortcullis`) — cywilizacje kamienne/ceglane: Grecja, Rzym, Sumer, Egipt, Inka, Chiny.
  - **Wrota z bali** (`addWoodenGate`) — cywilizacje drewniane: Zulu, Celtowie, Germanie.

**`userData` grupy:**

| Klucz | Opis |
|---|---|
| `wallWalkY` | Y chodnika bojowego (wierzchołek muru, = `height`) |
| `depth` | głębokość muru (`wallD`) |
| `gateCenterX` | X środka bramy (= 0, mur centrowany) |
| `gate` | `THREE.Group` bramy (portcullis lub wrota) |
| `gateOpen` | boolean; `false` = zamknięta, `true` = wyłamana (grupa ukryta) |

**9 stylów per cywilizacja:**

| Cywilizacja | Materiał | Charakterystyka |
|---|---|---|
| `grecja` | jasny kamień (0xd4c5a9) | blanki + nadproże bramy + filary + portcullis |
| `rzym` | kamień 0xc8b99a | blanki + 2 cylindryczne wieżyczki przy bramie + portcullis |
| `sumer` | muł ceglana (0xc2956c) | gruby mur, podstawa cofnięta, półkolisty łuk nad bramą + portcullis |
| `egipt` | piaskowiec (0xd4a96a) | 2 pylony trapezowe z piramidkami + portcullis |
| `inka` | cyklopowy granit (0x6b6b5a) | dwuczęściowy mur zwężający się ku górze, trapezowa brama + portcullis |
| `chiny` | cegła 0x8b3a2a | kwadratowa wieża bramna (menglou) z zielonym dachówkowym dachem + portcullis |
| `zulu` | drewno (0x5c3d1e) | palisada 2-rzędowa, cierniowy wał u podstawy, platforma + wrota z bali |
| `celtowie` | murus gallicus (kamień+drewno) | dwa kamienne lica + drewniany rdzeń + palisada na koronie + wrota z bali |
| `germanie` | ziemny wał (0x5a4530) | szeroki (wallD × 1,3) ziemny nasyp dwuczęściowy + palisada zewnętrzna + wrota z bali |

### 2b.5. Teren oblężniczy — `battle-terrain.ts`

Dwa nowe typy `BTerrain` (enum wyliczeniowy):

- `BTerrain.Wall = 6` — kafle muru; koszt ruchu = Infinity (nieprzechodny). Obrońcy na koronie (`onWallWalkway`) stoją na kaflu Wall, ale nie wchodzą doń od dołu — do nich dotrzeć można tylko od góry (przez wieżę) albo z sąsiedniego kafla Wall. Nazwa terenu do walki = `'Plaskie (rownina/laka)'` (chodnik bojowy traktowany jak otwarte pole).
- `BTerrain.Gate = 7` — kafle bramy (1–2 kafle pośrodku muru); koszt ruchu = Infinity dopóki brama zamknięta. Po wyłamaniu (`_breachGate`) kafle Gate zamieniane w Plains — pełne przejście.

Kafle Wall/Gate są wcinane w mapę terenu przez `_initSiegeWall` **przed** budową sceny (w konstruktorze `BattleScene` gdy `opts.siege` ustawione).

### 2b.6. Integracja na polu bitwy — `battleScene.ts`

**Ustawienie muru:** `_initSiegeWall` wyznacza `siegeWallCol` (kolumna muru = `DEF_FRONT_COL + 4`), zapisuje `siegeWallRowLo/Hi` i `siegeGateRow`, wycina kafle Wall/Gate w `terrainMap.tiles`, ustawia `gateHp = 200`. Następnie `_placeSiegeWall(civ)` buduje mesh 3D i wstawia go do sceny — cywilizacja pochodzi z `SiegeOpts.defCiv ?? SiegeOpts.civ ?? 'rzym'` (zawsze styl obrońcy).

**Deployment oblężniczy (`_placeUnits` → `_repositionSiegeAttackers` + `_placeSiegeDefenders`):**

- Atakujący: standardowe rozstawienie; machiny przesuwane do kolumny `siegeWallCol - 1` (wprost przed bramą, rozłożone po co 2 wiersze od `gateRow`).
- Obrońcy: piechota wręcz (nie-strzelcy, bez konnych, bez machin) rozmieszczana NA koronie muru (`col = siegeWallCol`, `y = 2.5`), flagowana `onWallWalkway = true`; strzelcy i pozostałe jednostki za murem (kolumny > `siegeWallCol`).

**Chodnik bojowy i walka na murze:**

- Jednostka z `onWallWalkway = true` **nigdy nie schodzi z muru** dobrowolnie; w swojej turze pozostaje na kaflu Wall i walczy.
- **+1 zasięg** dla obrońców na koronie (wyliczane w `_activateUnit` przy AI taktycznej).
- **+50% obrony** jak na Wzgórzach: `_singleBlow` podstawia `defTerrain = 'Wzgorza'` gdy `defender.onWallWalkway == true`, niezależnie od kafla pod spodem.
- Walka u podnóża: atakujący na kaflu `wallCol - 1` może bić w obrońcę na `wallCol` i odwrotnie — Manhattan == 1 w siatce, standardowa adjacencja pokrywa ten przypadek. Walka między dwiema jednostkami na tym samym kaflu (obie na koronie) = Manhattan == 0, traktowana jak wręcz.

**Atakowanie bramy (`_attackGate`):**

Wywołane gdy machina oblężnicza jest w odległości ≤ 1 kafla od `siegeGateCol/Row` i brama jeszcze zamknięta. Obrażenia = `max(10, round(Atak × 5))` — dla Tarana (Atak 3) daje ~15 na hit, HP bramy = 200. Zwykłe jednostki (nie-Siege) bramie obrażeń nie zadają. Po wyczerpaniu HP bramy — `_breachGate`:

- Kafle Gate w `terrainMap.tiles` zamieniane w Plains.
- Obiekt `gate` w `siegeWallGroup.userData` ukrywany (`gate.visible = false`).
- `gateOpen = true` — machiny przestają atakować bramę i przechodzą do ataku zwykłych celów.

**Wejście na mur przez Wieżę oblężniczą (`towerAtWallRows`):**

Gdy wieża oblężnicza atakującego dotrze do `col = siegeWallCol - 1`, jej rząd trafia do zbioru `towerAtWallRows`. Każdy nieumieszczony na murze piechur atakujący, sąsiadujący z wieżą (kafle `wallCol - 1` i pasujący rząd), może wspiąć się na mur: kafle Wall w bezpośrednim sąsiedztwie wieży stają się dla niego przejezdne i jednostka dostaje `onWallWalkway = true`.

### 2b.7. Podglądy oblężenia

- **`Gra-podglad-MUR-BITWA.html`** — statyczna galeria 9 murów (jeden per cywilizacja), bez bitwy.
- **`Gra-podglad-OBLEZENIE-BITWA.html`** — żywa bitwa oblężnicza z preset `'oblezenie'` (8 legionistów + Taran + Katapulta vs 8 legionistów + 6 łuczników za murem `rzym`).
- **`Gra-podglad-OBLEZENIE.html`** (lane MAPA) — pełne modele miast z murami, widok z mapy świata.

### 2b.8. Otwarte kwestie i uproszczenia

- **Balans bramy i machin prowizoryczny** — wartości `gateHp = 200` i `dmg = Atak × 5` dobrane szacunkowo; strojenie po obserwacji bitew testowych.
- **Warianty epokowe machin** — Taran (Kamień), Wieża (Brąz), Katapulta (Żelazo) to trzy odrębne wpisy; nie ma jeszcze mechanizmu upgrade'u per-epoka machin.
- **Integracja z `siege.ts`** (reguła +200% obrony miasta, 1 tura budowy machin) — po stronie lane SILNIK/MASTER; `battleScene` nie liczy kosztów ani czasu budowy, otrzymuje gotowe armie ze zbudowanymi maszynami.

---

## 3. DANE I PARAMETRY (panel sterowania)

### 3.1. Pola `units.json` (46 jednostek; 43 klucze/wiersz)
Kluczy istotnych dla bitwy/renderu (akcentowane nazwy w JSON, ASCII-fallback w `combat.ts`):

**Podstawowe:** `Jednostka` · `Epoka` · **`Kultura`** · `Tech` · `Pieniądz (koszt)` · `Ludność` · `Surowiec` · `Surowiec (ilość)` · `Utrzymanie (Pieniądz/turę)` · `żywność/turę` · `Atak` · `Uderzenie` · `Obrona` · `Ruch` · **`Ruch w bitwie (heksy)`** · `Health` · **`Próg dezercji (% health)`** · `Widok pola` · **`Atak dystansowy`** · **`Zasięg ataku (hex)`** · **`Ilość pocisków`** · **`W zamian za`** · **`Super-jednostka`** (TAK/—) · `Uwagi` (np. „walczy do smierci"/„niezlomny") · `Rola (linia)` (Wręcz/Dystans/Flanka/Wsparcie/Morska) · `Pancerz` · `Przebicie` · **`Kara obrony z flanki (%)`** · **`Kara obrony z tyłu (%)`**.

**Model morale (NOWE):** **`Morale bazowe`** (startowe morale jednostki, np. 60–120) · **`Morale ucieczki`** (absolutny próg złamania, np. 5–25; null/blank = niezłomny).

**Identyfikacja i lineup (NOWE):** **`Nazwa EN`** (angielski alias) · **`Typ`** (`Swordsman` / `Spearman` / `Falangite` / `Offensive` / `Distance` / `Mount` / `Civilian`) · **`Klasa`** (`Standardowa` / `Specjalna` / `Super`) · **`Nacja`** (Grecja, Rzym, Chiny, Zulu, Inkowie, Egipt, Sumer, Ludy Morza, Celtowie, Germanie, lub puste = generyczna) · **`Bonus vs Swordsman/Spearman/Falangite/Offensive/Distance/Mount %`** (6 pól; per-Typ bonus ataku) · **`Zmiana na`** (następna jednostka/klucz technologii) · **`Dostępna w epokach`** (okno 2 epok, np. „Brąz–Żelazo"; null = brak ograniczenia).

Sentinel braku: `—` / `null`. (`toCombatUnit` mapuje na `CombatUnit` z fallbackami.)

### 3.2. `counters.json` — trójkąt +50%
5 wpisów; przewaga typu daje +50% obrażeń atakującemu. Przykład: `{Typ atakujący: 'Włócznik', Cel (typ): 'Konnica/Rydwan', Bonus: '+50%', Rodzaj: 'Atak', Status: 'potwierdzone'}`. `counterMultiplier` matchuje substringowo, tylko `Status='potwierdzone'` i `Rodzaj='Atak'`.

### 3.3. `terrain-combat.json` (7 wierszy) / `terrain-movement.json`
- **terrain-combat**: Płaskie · Las (+50% obrony TYLKO vs łucznicy/konnica/rydwany; −1 zasięg) · Wzgórza (+50% obrony; +1 zasięg) · Góry (+50-100%; tylko piechota) · Rzeka (−25% Atak przy przekraczaniu; STOP 1 turę) · Pustynia · Wybrzeże/Morze (tylko Galera).
- **terrain-movement**: `{ costs: { Laka:1, Rownina:1, Pustynia:2, Wybrzeze:99, Wzgorza:2, Gory:99, Morze:99 }, forestExtra:1 }` (99 = sentinel Infinity).

### 3.4. REGUŁA strojenia danych
**Stroisz w `Jednostki.xlsx`** (arkusze „Jednostki"/„Countery"/„Teren") → **targeted export** do `units.json` + `counters.json` + `terrain-combat.json`. **NIE `export-data.py`.** Analizy balansu (kto kogo bije, ile rund) wpisuj do `Macierz-walki.xlsx`.

### 3.5. Parametry bitwy DZIŚ hardcoded w kodzie → `Bitwa-parametry.xlsx`
Większość parametrów bitwy (pole, morale, prędkość, paski, pociski, tempo, kamera, teren, presety) to **stałe w `battleScene.ts` / `battle-terrain.ts` / `testBattle.ts` / `units.ts`** — NIE w JSON. Skatalogowane w **`Bitwa-parametry.xlsx`** (Deliverable 2, arkusze „Bitwa-parametry" + „Legenda"). **Wpięcie `battleScene` → odczyt `battle-params.json` to PRZYSZŁY krok implementacji (niezrobiony).** Na dziś xlsx jest katalogiem / powierzchnią sterowania.

---

## 4. BUILD / DYSTRYBUCJA

- **Podgląd UNITS/bitwy:** `npx vite build --outDir /tmp/civ-dist` → single-file IIFE → kopiuj do **`Gra-podglad-BITWA.html`** (istnieje w `Civ/`). `vite.config.ts` używa `viteSingleFile` + `fixScriptTag` (strip `crossorigin`, `type="module"`→`text/javascript`) by działało z `file://` bez czarnego ekranu (IIFE).
- **Galeria 4-widoki:** osobny config — `npx vite build --config src/gallery4/vite.gallery.config.ts` (root=`.`, outDir `dist-gallery4`, input `src/gallery4/index.html`) → **`Galeria-jednostek-4widoki.html`**.
- **Kanon** `Gra-podglad.html` buduje SILNIK (cały silnik); my budujemy tylko osobny podgląd. **NIGDY `npm run build` / `export-data.py`** (`npx vite build` zwykły pada na blokadzie OneDrive `dist/` — buduj do `/tmp` z autorytatywnych odczytów Read).
- **OneDrive mount caveat:** edytowane pliki bywają ucięte/stale przez bash mount → buduj w `/tmp` ze świeżych kopii, deployuj `cp`.
- **Testy:** `tools/logic-test.cjs`, `tools/combat-test.cjs`, `tools/battle-smoke.cjs`, `tools/smoke.cjs`.

---

## 5. ZALEŻNOŚCI

### 5.1. `src/game/combat.ts` — kontrakt `resolveCombat` (READ-ONLY)
```ts
resolveCombat(attacker: CombatUnit, defender: CombatUnit, opts?: ResolveCombatOpts): CombatResult
```
**`CombatUnit`** (snapshot statów; nazwy pól = `units.json`): `typNazwa`, `rola`, `Atak`, `Obrona`, `Uderzenie`, `Pancerz`, `Przebicie`, `Health`, `'Prog dezercji (% health)': number|null`, `'Atak dystansowy'`, `'Zasieg ataku (hex)'`, `'Ilosc pociskow'`, `'Ruch w bitwie (heksy)'`, `'Kara obrony z flanki (%)'`, `'Kara obrony z tylu (%)'`, `'Super-jednostka'?`, `unbreakable?`.

**`ResolveCombatOpts`**: `defenderTerrain?`, `terrainData?: TerrainEntry[]`, `attackerPosition?: 'front'|'flank'|'rear'` (default 'front'), `counters?: CounterEntry[]`, `attackerAmmo?`, `defenderAmmo?`, `attackerMoved?` (default true — bracing spear neguje szarżę), `maxRounds?` (default 30), `rng?: ()=>number` (default `Math.random`).

**`CombatResult`**: `winner: 'attacker'|'defender'|'draw'`, `attackerHpLeft`, `defenderHpLeft`, `rounds`, `routed: ('attacker'|'defender')[]`, `log: string[]`.

**Eksportowane helpery (też używane per cios w `battleScene`)**:
- `hitChance(atk, def) = clamp(50 + (Atak−Obrona)·5, 10, 90)`.
- `baseDamage(atk, panc, przeb, uderzenie, isCharge) = max(1, Atak−Pancerz+Przebicie) + (isCharge?Uderzenie:0)`.
- `rangeDamage(atkDyst, pancCelu) = max(1, atkDyst − Pancerz)`.
- `counterMultiplier(...) = 1.5 | 1.0` (substring, `potwierdzone`, `Atak`).
- `flankRearDefensePenalty(unit, pos) = ułamek [0..1)` z „Kara obrony z flanki/tylu (%)" (front → 0).
- `terrainDefenseMultiplier` (Wzgórza 1.5, Góry 1.75, Las 1.5 tylko vs Dystans/Flanka, reszta 1.0), `terrainRiverAttackMultiplier` (rzeka → 0.75).

**Fazy modelu (SS5l):** Faza 0 ranged (oba strzelają aż ammo/rout) → Faza 1 szarża (R1, +Uderzenie chyba że bracing) → Faza 2 zwarcie (R2+, jednoczesne ciosy, bez Uderzenia). Rout: HP < `Prog_dezercji%·Health` (unbreakable → do HP≤0). **Deterministyczny przy danym `rng()`; brak globalnego stanu. NIE ZMIENIAĆ.**

### 5.2. Pozostałe
- `loader.ts` — ładuje JSON do pamięci (`GameData`, `UnitDef`); `configureTerrainMovement` (z `setup.ts`) nadpisuje koszty ruchu mapy z `terrain-movement.json`.
- `setup.ts` — `categoryOf` (name→category), `RuntimeUnit` (zawiera `category` i `typeId`), `listUnitTypes`, pathing mapy (Dijkstra). Read-only.
- `types/*` — `Unit`/`UnitType`, konwencja morale.
- **`main.ts` (SILNIK):** wpięcie „T" → bitwa (przez bridge `expandTestBattleComposition`); `UnitRenderer.sync` z `unit.typeId` (rozróżnienie jednostek na mapie — `units.ts`); rebuild kanonu po zmianie `units.json`.

---

## 6. INTERAKCJE Z INNYMI DZIAŁAMI

> Aktualizacja wg zrzutu działów (sesje Civ) 2026-06-25.
>
> **GRANICA AI (ważne):** dział „AI opponent intelligence" = AI STRATEGICZNA przeciwnika (mapa świata: kogo/kiedy atakować, skład armii, ekspansja). Civ-UNITS odpowiada **wyłącznie za AI TAKTYCZNĄ w bitwie** (ruch/cel/kiting jednostek w `battleScene._activateUnit`). Wejściem do mojej bitwy jest gotowy skład armii + strona; dobór armii i decyzja o starciu = poza moim lane.

| Dział | Co Civ-UNITS BIERZE | Co DOSTARCZA |
|---|---|---|
| **SILNIK** (`main.ts`, `scene.ts`) | wpięcie „T"→bitwa, sync tokenów na mapie z `typeId`, publikację kanonu | modele `buildUnitModel`, `UnitRenderer`, scenę bitwy (`BattleScene`), bridge `buildTestArmies` |
| **MAPA** (`map/generator.ts`, `Plony-terenow.xlsx`) | spójność wysokości terenu (`terrainTopY` musi pasować do `TERRAIN_VISUALS` w `scene.ts`), palety low-poly, koszty ruchu (`terrain-movement.json`) | spójny styl figur i terenu bitwy (imituje low-poly mapy) |
| **DANE-CYW** (`Cywilizacje.xlsx`, `Jednostki.xlsx`) | definicje jednostek (`units.json`), pole „Kultura", nowe jednostki (Celtowie, Germanie itp.) | wizualną reprezentację każdej nacji/typu (warianty kulturowe, super-jednostki) |
| **LOGIKA** (`game/combat.ts`) | kontrakt `resolveCombat` + SS5l helpery (read-only) | wywołania per-cios i skip-resolve zgodne z kanonem; facing/teren per-kafel jako wejście |
| **UI** | — | overlay bitwy (paski, prędkość, zoom, audio HUD), galerię 4-widoki, labelki obrażeń |
| **MIASTO** (`game/cities.ts`, siege) | armie z miast do bitwy (garnizon/oblężenie = MIASTO/siege) | scenę bitwy do rozegrania starcia armii; wynik oblężenia (`siege.ts`) |
| **EKONOMIA** (`game/economy.ts`, Ekonomia-parametry) | koszty jednostek (ludzie/surowce) → jakie armie realnie powstają | — (bitwa konsumuje gotowy skład, nie liczy kosztów) |
| **Dyplomacja** (`game/diplomacy.ts`, Dyplomacja.xlsx) | stan wojny/pokoju → wyzwala starcie (kto z kim) | rozegranie starcia + wynik (straty, zwycięzca) |
| **AI opponent intelligence** (`game/ai.ts`) | decyzje STRATEGICZNE: skład armii, kogo/kiedy atakować (GRANICA) | — moja AI taktyczna działa dopiero w bitwie na gotowym składzie |
| **Master** (`dyspozycje/UNITS.md`) | priorytety i rozstrzygnięcia | raporty/pytania (`UNITS-DO-MASTERA.md`) + buildy podglądu |

Przepływ danych: `Excel → JSON (targeted export) → loader.ts → silnik`. Synchronizacja między taskami przez dysk (OneDrive) + `ARCHITEKTURA-PLIKI.md` jako mapa.

---

## 7. OTWARTE DECYZJE / TODO

1. **Balans jednostek (z `Macierz-walki.xlsx`):** deadlock Włócznik vs Włócznik/Falanga (Przebicie/HP), Falanga 100% win rate (koszt vs nerf), super-jednostki jednorodne 100% (tiery?), słabe Impi/Galera (podbić?) — do strojenia przez Macieja.
2. **Sterowanie graczem + faza rozstawiania** — czeka na projekt UX; dziś AI steruje oboma stronami.
3. **Wiązanie `battle-params.json`** (PRZYSZŁY krok): wpiąć `battleScene` w odczyt `gra/data/battle-params.json` (z fallbackiem na stałe w kodzie). Dziś parametry bitwy żyją jako stałe; `Bitwa-parametry.xlsx` jest katalogiem/powierzchnią sterowania. Targeted export, NIE `export-data.py`.
4. **Rally generała** (przyszła funkcja): konsumpcja hooka `routedUnits` w `battleScene` by przywrócić zrajdowane jednostki (`// TODO: general rally recovery` — `_startRout` już zbiera dane). `MORALE_GENERAL_AURA=0` = placeholder.
5. **Morale-exemption dla cywilizacji czysto dystansowych** — jeśli jakaś nacja ma TYLKO jednostki dystansowe, mechanizm „osłony wręcz" (−50% gdy ostatnia wręcz ginie) wymaga wyjątku lub modyfikacji. Przyszłość.
6. **Nowe jednostki / nacje** (punkt 5 planu lane, wg spec od Civ-DANE) — dodać warianty kulturowe/super gdy dostępne dane.
7. **§6 uściślone** wg zrzutu działów (2026-06-25). **DO UZGODNIENIA:** granica AI — taktyczna w bitwie (Civ-UNITS) vs strategiczna przeciwnika (dział „AI opponent intelligence").

---

### Załączniki / powiązane pliki
- **`Bitwa-parametry.xlsx`** (`Civ/`) — strojone parametry bitwy (arkusze „Bitwa-parametry" + „Legenda").
- **`Jednostki.xlsx`** (`Civ/`) — panel statów jednostek (→ `units.json` / `counters.json` / `terrain-combat.json`).
- **`Macierz-walki.xlsx`** (`Civ/`) — analizy balansu walki.
- Lane: `Civ/dyspozycje/UNITS.md` · inwentarz: `Civ/ARCHITEKTURA-PLIKI.md`.
