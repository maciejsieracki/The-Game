# Analiza: `src/main.ts` (SILNIK / punkt wejścia)

**Plik:** `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\gra\src\main.ts`
**Rozmiar:** ~123 KB, **2827 linii**, ~80 importów z ~25 modułów
**Struktura:** plik składa się z jednej gigantycznej funkcji `boot()` (linia 123–2820), w której zamknięty jest *cały* stan gry i *wszystkie* handlery. Poza `boot()` znajduje się tylko helper `showErr` (14–32) oraz globalne listenery błędów (34–39) i straż `DOMContentLoaded` (2822–2826).

## 1. Mapa importów

| Moduł | Importowane symbole | Rola |
|---|---|---|
| `three` | `* as THREE` | silnik 3D |
| `data/loader` | `loadGameData` | wczytanie JSON (units, tech, civs, buildings, societyParams, diplomacyParams, barbParams, terrainMovement) |
| `map/generator` | `generateMap`, `DEFAULT_WIDTH`, `DEFAULT_HEIGHT` | generator mapy heksowej |
| `render/scene` | `buildScene` | scena/camera/renderer + `setFog`, `dispose` |
| `render/camera` | `CameraController` | pan/zoom/WASD |
| `render/hexutil` | `HEX_R`, `axialToWorld`, `worldToAxial` | współrzędne axial↔world |
| `units/setup` | `placeStartingUnits`, `computeReachable`, `computePath`, `listUnitTypes`, `pathCost`, `configureTerrainMovement`, `hexDistance`, `categoryOf`, `type RuntimeUnit` | jednostki + pathfinding |
| `render/units` | `UnitRenderer` | rendery tokenów, highlight, route preview |
| `input/picker` | `pixelToHex`, `unitAt`, `keyOf` | hit-testing heksów |
| `game/visibility` | `computeVisible`, `addExplored`, `allHexKeys`, `DEFAULT_SIGHT` | mgła wojny |
| `game/cities` | `canFoundCity`, `foundCity`, `foundCityAt`, `cityName`, `type City` | zakładanie miast |
| `map/territory` | `isInTerritory`, `type CityNode` | terytorium (`isInTerritory` zaimportowane, ale ** nieużywane** — patrz tech debt) |
| `game/turn-economy` | `advanceCityEconomy`, `type EconUnit` | tick ekonomii per miasto |
| `game/playerState` | `createPlayerState`, `researchStep`, `availableTechs`, `setPlayerResearchTarget`, `getResearchState`, `techCost`, `type PlayerState` | stan gracza (skarbiec, nauka, era, zbadane, badana) |
| `render/cities` | `CityRenderer`, `type CityRenderOptions` | render miast |
| `render/resources` | `buildResourceOverlay` | nakładki surowców |
| `types/hex` | `TerenBazowy`, `Nakladka` | enumy terenu |
| `ui/cityPanel` | `showCityPanel`, `hideCityPanel`, `isCityPanelOpen`, `configureCityPanel` | panel miasta |
| `ui/preBattle` | `showPreBattle`, `hidePreBattle`, `isPreBattleOpen`, `type PreBattleInfo`, `type PreBattleUnit` | ekran przed-bitwy |
| `battle/battleScene` | `BattleScene`, `type BattleUnit` | bitwa taktyczna 3D |
| `game/combat` | `resolveCombat`, `type CombatUnit` | auto-rozstrzyganie walki |
| `game/production` | `advanceProduction`, `rushProduction`, `rushCost`, `populationCostOf`, `buildingLevelForEpoch`, `buildingEffectAtLevel`, `enqueue`, `buildingProductionItem`, `unitProductionItem`, `splitPraca`, `type CityProduction` | kolejka produkcji |
| `game/order` | `loadOrderParams`, `evaluateOrder` | porządek/bunt |
| `game/culture-religion` | `loadCultureParams`, `accumulateCulture`, `cultureHappiness`, `loadReligionParams`, `civReligion`, `religionHappiness`, `makeRng`, `spreadReligion`, `type CultureCity`, `type ReligionState`, `type ReligionNeighbor` | kultura + religia + szerzenie |
| `game/diplomacy` | `aiDiplomacyStance`, `initialRelation`, `relationTier`, `loadDiplomacyParams`, `applyDiplomaticEvent`, `computePotegaNacji`, `computeRespekt`, `tickDiplomacy`, `ARCHETYPE_AGGRESSION`, typy `Relation`, `AIDiplomacyContext`, `PotegaKomponenty`, `TickCtx` | dyplomacja |
| `types/player` | `Player`, `TypCywilizacji` | typy nacji |
| `game/save` | `saveToLocal`, `loadFromLocal`, `type SaveGame` | save/load |
| `ui/sciencePicker` | `configureSciencePicker`, `showSciencePicker` | drzewko badań |
| `game/ai` | `decideAITurn`, `chooseAIResearch`, `decideAIDiplomacy`, `loadDifficultyParams`, typy `AITurnOpts`, `RelacjaWejscie`, `DiplomacjaInputs`, `AIDiplomacyCommand` | AI |
| `game/victory` | `checkVictory`, `type VictoryPlayer`, `type VictoryInput` | warunki zwycięstwa |
| `game/barbarians` | `loadBarbParams`, `barbariansActive`, `spawnCamps`, `tickCamps`, `decideBarbarianMoves`, `BARBARIAN_OWNER_ID`, `isBarbarian`, typy `BarbCamp`, `BarbUnit` | barbarzyńcy |
| `game/auto-manage` | `autoManageCity` | auto-zarządca miasta |
| `ui/mainMenu` | `showMainMenu`, `hideMainMenu` | menu główne |
| `ui/newGameFlow` | `showNewGameFlow`, `hideNewGameFlow`, `type NewGameParams` | flow nowej gry |
| `game/tech-tempo` | `applyTempoKoszt`, `type TempoGry` | tempo gry (mnożnik kosztu nauki) |
| `ui/diplomacyPanel` | `showDiplomacyPanel`, `hideDiplomacyPanel`, `isDiplomacyPanelOpen`, `updateDiplomacyPanel`, `type DiploRelation` | panel dyplomacji |

## 2. Systemy spięte w `boot()`

1. **Error overlay** (14–39) — globalny `showErr` + listenery `error`/`unhandledrejection`.
2. **Ładowanie danych** (125–139) — `loadGameData()` + warunkowe `configureTerrainMovement(...)` gdy loader dostarcza `terrainMovement`.
3. **Generacja mapy** (175) — `generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, SEED)`; `SEED` losowy.
4. **Scena/render** (246) — `buildScene(map, canvas)` → `{scene, camera, renderer, center, setFog, dispose}`.
5. **Kamera** (248–252) — `CameraController` (minDist 8, maxDist 160, keyPanSpeed 0.3).
6. **Jednostki** (258–259) — `placeStartingUnits(map, data)` + `UnitRenderer`. Osadnik gracza natychmiast usuwany (291–293) — gracz zakłada miasto ręcznie klawiszem B.
7. **Miasta** (265–282) — `cities: City[]`, `CityRenderer`, opcje `_cityRenderOpts()` (era/civ/level/walls — level=1, walls=false).
8. **Nakładki surowców** (300–327) — `buildResourceOverlay(hex.nakladka)` na heksach z `Nakladka` ≠ Brak/Las; pozycjonowanie po `TERR_TOP_Y`.
9. **Stan per-miasto** (330–334) — `cityProd`, `cityBuilt`, `cityRelig` (Mapy) + `growthMultMap`.
10. **AI / barbarzyńcy / zwycięstwo** (340–417) — `aiResearchDone`, `aiOwnerCivMap` (przydział nacji round-robin z `civs.json`), `diplomacyRelations` + `getDiploRelation`/`setDiploRelation`, `_diplomacyParams` (załadowane, `void`-owane), `autoManageCities` Set, `barbCamps`, `barbParams`, `gameOver`.
11. **Mgła wojny** (419–475) — `explored` Set, `fogOn`, `galleryOn`, `ALL_KEYS`, `currentVisible()` (units + miasta gracza jako źródła widzenia), `visibleUnitsList`, `refreshFog()`.
12. **Stan gracza** (489) — `player: PlayerState` z `createPlayerState()`; `_lastPraca`/`_lastKultura` do HUD.
13. **Panel miasta** (617–657) — `configureCityPanel(...)` z callbackami get/set produkcji, skarbca, rush-buy, auto-manage toggle.
14. **Picker nauki** (661–691) — `window.__civ_getResearchedTechs` + `configureSciencePicker(...)` (getResearchState/getAvailableTechs/onSelectTarget).
15. **Animacja ruchu** (693–731) — `TOKEN_LIFT = 0.01*HEX_R`, `ANIM_SEG_DUR = 0.14s`, `AnimState` (waypointy world-space, segmenty, `t`).
16. **HUD + hint** (506–607) — `showHintMessage` (transient override z timerem), `updateHud` (tura, seed, mapa, skarbiec, nauka, badanie, praca, kultura, wybrana jednostka), `showGameOverOverlay`.
17. **Menu główne / new game flow** (2792–2808) — `showMainMenu({hasSave, onNewGame, onContinue, onLoad, ...})` → `showNewGameFlow` → `doStartGame` / `doLoadGame`.

## 3. Pętla tury (klawisz `N`, linie 1691–2440)

Sekwencja po naciśnięciu `N` (zablokowane w galerii oraz po `gameOver`):

1. **Snap animacji** (1698–1708) — jeśli trwa ruch, natychmiast teleportuje jednostkę do celu i odejmuje `cost`.
2. **Reset ruchu** (1710–1712) — `u.ruchLeft = u.ruch` dla wszystkich jednostek.
3. **Czyszczenie selekcji** + `turn++`.
4. **Tick ekonomii** (1724–1751) — `advanceCityEconomy(cities, map, data, difficulty, econUnits, growthMultMap, cityBuilt, player.era, player.zbadane)` → per-miasto plony (praca/pieniądz/nauka/kultura/żywność), wzrost/głód, upkeep; refresh `cityRenderer.sync`.
5. **Oblężenie** (1759–1790) — dla miast z `tick.oblegany`: atrycja garnizonu **-8%/turę**, kapitulacja z głodu gdy `magazyn=0` (zdejmuje flagę `oblegane`). *DEFERRED*: brak UI do startowania oblężenia i machin.
6. **Bank + badania** (1799–1843) — sumuje `pieniadz`/`nauka` tylko dla ownerId=0, dodaje do `player.skarbiec`/`nauka`, odejmuje upkeep (z warningiem przy deficycie), `researchStep(player, data.tech)` → auto-badanie najtańszej dostępnej technologii, awans epoki, pieniądz×10.
7. **Per-miasto: kultura/religia/porządek/produkcja** (1846–1992):
   - `accumulateCulture` + `cultureHappiness`
   - `civReligion` + `religionHappiness` + `spreadReligion` do sąsiadów (z `swiatynia` bonus)
   - szczęście z budynków (`buildingEffectAtLevel`)
   - `evaluateOrder({szczescie, prawo:0})` → revolt risk (losuje utratę pop), `growthMult` zapisywany na kolejną turę
   - `autoManageCity` gdy włączony (enqueue gdy kolejka pusta)
   - `advanceProduction(prod0, praca*productionMult)` → completed → budynek (`cityBuilt`) lub jednostka (koszt populacji)
8. **Pętla AI** (2003–2315) — dla każdego ownerId>0:
   - `decideAITurn(ownerId, units, cities, map, data, opts)` → komendy
   - **AI research**: `chooseAIResearch` → *natychmiast* kompletuje 1 tech/turę (uproszczenie v0.1, bez kosztu)
   - **Dyplomacja**: `aiDiplomacyStance` + `computePotegaNacji`/`computeRespekt` (komponenty uproszczone: `wygraneBitwy=0.5`, `gospodarka=0.5`, `epoka=0.5`) + `tickDiplomacy` + `decideAIDiplomacy` → komendy (`wypowiedz_wojne`/`zaproponuj_pokoj` aplikowane; `zadaj_trybut`/`oferuj_trybut_za_pokoj`/`zaproponuj_sojusz`/`zaproponuj_handel` = **TODO v0.2**, tylko log)
   - **Egzekucja komend**: `move` (computePath + teleport), `foundCity` (canFoundCity + foundCity + usunięcie osadnika), `attack` (resolveCombat z structureDefenseBonus), `build` (enqueue budynku/jednostki), `endTurn` (no-op)
9. **Barbarzyńcy** (2320–2391) — jeśli `barbariansActive(turn)`: `spawnCamps`, `tickCamps` → instantiate spawnów, `decideBarbarianMoves` → `move`/`attack` (resolveCombat).
10. **Victory check** (2396–2435) — `checkVictory({players, cities, gracz:0, liczbaOsadnikow})` → dominacja/nauka/przegrana → `showGameOverOverlay`.
11. **updateHud + refreshFog**.

## 4. Handlery zdarzeń

- **`window.error` / `unhandledrejection`** (34–39) → `showErr`.
- **`canvas.mousedown`** (741–744) — zapis `mouseDownX/Y` do detekcji drag vs click.
- **`canvas.mousemove`** (753–788) — hover route preview: `pixelToHex` → `keyOf`; guard `hoverKey` (jedno przeliczenie na heks); `computePath` + `setPathRoute`; aktualizuje `lastBHex`.
- **`canvas.mouseup`** (790–1002) — detekcja drag (próg 6px); blokady w galerii/animacji; klik:
  - miasto → `showCityPanel`
  - jednostka gracza → select + `computeReachable` + `setHighlight`
  - heks w zasięgu → buduje waypointy, startuje `anim`, `isAnimating=true`
  - wroga jednostka sąsiadująca → `showPreBattle` (szanse `50+(atkAtk-defObrona)*5` clamp 10–90) → `onAuto`/`onBattlefield` wywołują `doMapAutoResolve` (resolveCombat, usunięcie przegranego, hint)
  - inaczej → deselect
- **`window.keydown`** (1490–2441):
  - `Escape` → hideCityPanel
  - `G` → toggle galerii (`enterGallery`/`exitGallery`)
  - `F` → toggle mgły
  - `B` → załóż miasto na `lastBHex`/`hoverKey`/pozycji wybranej jednostki; `canFoundCity` + `foundCityAt`; refresh fog
  - `T` → `launchTestBattle` (4× Hastati vs 4× Falanga, preBattle + BattleScene lub auto)
  - `Ctrl+S` → save (patrz 5)
  - `Ctrl+L` → load (patrz 5)
  - `N` → end turn (patrz 3)

## 5. Save / Load

**`Ctrl+S`** (1587–1632): buduje `SaveGame` (wersja 1) z:
`tura, seed, units, cities, explored, gracz{skarbiec,nauka,era,zbadane,badana}, cityProd, cityBuilt, aiResearchDone, diploRelations, meta.savedAt` → `saveToLocal('autosave', sg)`. Hint potwierdzający.

**`Ctrl+L`** (1634–1689): `loadFromLocal('autosave')` → przywraca *wszystko* powyżej (units, cities, explored, player, cityProd, cityBuilt, aiResearchDone, diplomacyRelations) + resync renderers + refreshFog + updateHud.

**`doLoadGame`** (2762–2789, wywoływane z menu): **niekompletne** — przywraca tylko `tura, units, cities, explored` i sync renderers. **Nie przywraca** `cityProd`, `cityBuilt`, `aiResearchDone`, `diplomacyRelations`, ani `player.*` (skarbiec/nauka/era/zbadane/badana). *Tech debt: rozjazd z Ctrl+L.*

Slot jest jeden: `'autosave'`. Brak multi-slotu.

## 6. Punkty integracji (callbacki `configure*`)

- **`configureCityPanel`** (617–657 oraz ponownie 2636–2654): `data, difficulty, getCities, getEpoch, getUnlockedTechs, getBuiltBuildingIds, getProduction, setProduction, getTreasury, onRushBuy, onChange, onAutoManage`.
- **`configureSciencePicker`** (663–691): `getResearchState, getResearchedTechs, getAvailableTechs, onSelectTarget`.
- **`showDiplomacyPanel`** (207–231): `getRelations` — buduje `DiploRelation[]` z `diplomacyRelations` (klucz `a_b`, normalizacja zaufania /200*100, respekt min/max 0–100).
- **`showMainMenu`** (2792–2808): `hasSave, onNewGame, onContinue, onLoad, onAbout, onQuit`.
- **`showNewGameFlow`** (2798–2802): `data, onStart, onCancel`.
- **Global `window.__civ_getResearchedTechs`** (661) — hook dla drzewka badań (zewnętrzny UI).
- **`applyMenuParams`** (2575–2655): mapuje UI stringi → klucze silnika (`difficulty`, `civId`, `mapSize`, `rivals`, `speed`→`TempoGry`), wypina `player.civType`/`civBonusy` z `civs.json`, przebudowuje `aiOwnerCivMap`, re-`configureCityPanel`.

## 7. Tech debt

- **Monolityczna `boot()`** (~2700 linii w jednym domknięciu) — cały stan gry to zmienne lokalne; brak modularyzacji, niemożliwy unit-test.
- **Masowe `as any`**: `data.civs.cywilizacje as any[]`, `city as any`, `rel as any`, `(data as any).terrainMovement`, `(hex as any).ulepszenie`, `aiStub as unknown as Player` — omijanie typów.
- **Zduplikowany kod**:
  - Konstrukcja `CombatUnit` powtórzona 4× (atak gracza na mapie 911–938, atak AI 2240–2265, atak barbarzyńcy 2373–2377, helper `battleUnitToCombatUnit` 1286–1305 istnieje, ale nie wszędzie używany).
  - `configureCityPanel` wywołane 2× z niemal identycznym ciałem (617 i 2636).
  - Pętla nakładek surowców 2× (300–327, 2729–2750) z duplikatem `TERR_TOP_Y`.
  - Przydział `aiOwnerCivMap` 3× (352–380, 2608–2622, 2697–2714).
- **Nieużywane importy/zmienne**: `isInTerritory` (terytorium wyłączone decyzją 1B), `rushCost`, `splitPraca`, `techCost`, `_diplomacyParams` (void), `_menuRivals` częściowo.
- **Hardcody**: kolory `0xffd54a`/`0xc84040`, fallbacki statów (HP 30, Atak 5, Obrona 5, Uderzenie 2...), `TERR_TOP_Y`, `ANIM_SEG_DUR`, `DRAG_THRESHOLD`, `GALLERY_SPACING`.
- **AI research**: „natychmiast 1 tech/turę, bez kosztu" ( komentarz 2042–2044) — niezbalansowane.
- **Oblężenie**: flaga `city.oblegane` nigdy nie ustawiana (brak UI), machiny 1/turę niezaimplementowane, mechanizm przejęcia właściciela bez UI — tylko atrycja + kapitulacja z głodu.
- **Dyplomacja gracza**: `zadaj_trybut`/`oferuj_trybut_za_pokoj`/`zaproponuj_sojusz`/`zaproponuj_handel` = TODO v0.2 (tylko `console.log`).
- **`doLoadGame`** rozjeżdża się z `Ctrl+L` (patrz 5).
- **`yieldOf` w autoManage** (1949–1960) — stub zwraca średnie per capita z `econ.perCity`, nie realne per-tile yields.
- **`_lastPraca`/`_lastKultura`** liczone z econ, ale `praca` w produkcji mnożona przez `orderEff.productionMult` — HUD nie odzwierciedla mnożnika.
- **Gallery labels** projekcja co klatkę (potencjalna kosztowność przy dużej liczbie typów).
- **`B` używa `lastBHex`** zaktualizowanego też przez hover — może być „stale" gdy kursor poza mapą.
- **`normFieldVal`** — lokalna w main.ts; powinna trafić do `units/setup.ts`.
- **Brak multi-slot save**, brak autosave'u per-tura (tylko manualny Ctrl+S).

## 8. Co zrobione vs czego brakuje

**Zrobione:**
- Renderer mapy heksowej 3D + mgła wojny (toggle F) + explored persistence.
- Sterowanie kamerą (pan/zoom/WASD), click-vs-drag, hover route preview.
- Jednostki: placement, selekcja, animowany ruch po `computePath`, pathfinding z kosztami terenu.
- Miasta: zakładanie (B), panel, kolejka produkcji, rush-buy, auto-manage toggle.
- Ekonomia per-tura (żywność/wzrost/głód, praca/pieniądz/nauka/kultura, upkeep/deficyt).
- Drzewko nauki + wybór celu + auto-badanie + awans epoki + tempo gry.
- Kultura, religia (z szerzeniem), porządek/szczęście/bunt.
- Dyplomacja backend (stance, respekt, tick, komendy AI: wojna/pokój działają).
- AI: move/foundCity/attack/build + AI research + dyplomacja.
- Barbarzyńcy: obozy, spawn, ruch, atak.
- Walka: `resolveCombat` (auto) + `showPreBattle` + `BattleScene` (taktyczna 3D).
- Warunki zwycięstwa: dominacja / nauka / przegrana (utrata miast) + overlay końcowy.
- Save/load (autosave, Ctrl+S/L + menu Continue/Load).
- Menu główne + flow nowej gry (nacja, trudność, rozmiar mapy, liczba rywali, tempo).
- Galeria jednostek (G), testowa bitwa (T).

**Brakuje / TODO:**
- UI oblężenia (start oblężenia, szturm, machiny, przejęcie miasta).
- UI dyplomacji gracza (akcept/odrzut ofert wojny/pokoju/trybutu/sojuszu/handlu).
- Realne per-tile yields dla auto-manage (stub).
- Koszt badań dla AI (free techs/turę).
- Multi-slot save + autosave per-tura.
- Parzystość `doLoadGame` z `Ctrl+L` (brak restore produkcji/dypl/AI/player).
- Toggle „stand-by"/obozowanie dla jednostek (posterunek/fort z `structureDefenseBonusFor` działają, ale nie ma UI ustawiania `ulepszenie`).
- Mury miejskie render (`getWalls` zawsze false) i poziomy miast (`getLevel` zawsze 1).
- Handel / wymiany mapowe / diplomatic trades.
- Retret/pościg na mapie po walce.

## 9. Połączenia z innymi modułami

- **`data/loader.ts`** → jedyny źródło danych JSON (units, tech, civs, buildings, societyParams, diplomacyParams, barbParams, terrainMovement).
- **`map/*`** → `generator` (mapa), `territory` (CityNode używany, `isInTerritory` nie), `gen-helpers`/`clusters` pośrednio przez generator.
- **`render/*`** → `scene`, `camera`, `hexutil`, `units`, `cities`, `resources`, `bronzeCity` (typ `BronzeCiv` przez inline `import()` cast w `_cityRenderOpts`), `stoneCity`, `improvements` (pośrednio).
- **`units/setup.ts`** → jednostki + pathfinding + `categoryOf` + `configureTerrainMovement`.
- **`input/picker.ts`** → hit-testing.
- **`game/*`** → cała logika: `visibility`, `cities`, `turn-economy` (+ `economy`, `economy-upkeep` pośrednio), `playerState`, `production`, `order`, `culture-religion`, `diplomacy`, `ai`, `barbarians`, `victory`, `combat`, `save`, `auto-manage`, `tech-tempo`, `okolica` (pośrednio).
- **`battle/*`** → `battleScene` (taktyczna), `combat` (auto), `siegeWall`/`battle-terrain`/`testBattle` (pośrednio).
- **`ui/*`** → `cityPanel`, `sciencePicker`, `preBattle`, `diplomacyPanel`, `mainMenu`, `newGameFlow`, `hud` (istnieje, ale **nie importowany** — HUD budowany inline w main.ts), `armyStackPrompt` (nie podpięty).
- **`types/*`** → `hex` (TerenBazowy/Nakladka), `player` (Player/TypCywilizacji).
- **Podglądy/previewy** (`mappreview`, `mainview`, `movepreview`, `wallpreview`, `zasiegpreview`, `siegepreview`, `placementpreview`, `clusterpreview`, `oblezenie`) — osobne entry-pointy Vite, **nie importowane** przez główny `main.ts` (służą do izolowanego testowania renderu).

**Strumień danych w turze:** `loader → generator → buildScene → placeStartingUnits` (init) · potem co turę: `turn-economy → (siege) → playerState.researchStep → per-city (culture-religion, order, auto-manage, production) → ai.decideAITurn → barbarians → victory → refreshFog`.