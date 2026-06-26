# Analiza 04-UNITS-BATTLE — Bitwa taktyczna, auto-resolve, oblężenie

*Audyt: 2026-06-26 | Źródła: `gra/src/battle/*`, `gra/src/game/siege.ts`, `gra/src/game/combat.ts`, `gra/src/oblezenie/main.ts`, `gra/src/main.ts`, `docs/analiza/04-UNITS.md`*

---

## 1. Zakres i źródła

**Katalog `gra/src/battle/` (8 plików):**
- `battleScene.ts` (~8700 linii, ~400 KB) — taktyczna scena 3D AUTO-bitwy (square grid)
- `manualBattle.ts` (~1399 linii) — recznie sterowana bitwa taktyczna (hex grid)
- `siegeWall.ts` (~935 linii) — proceduralny mur obronny dla 9 cywilizacji
- `battle-terrain.ts` (~304 linie) — deterministyczny proceduralny teren pola bitwy
- `facing.ts` (~157 linii) — HEX 6-dir facing helper (ARTEFAKT, nieużywany przez square grid)
- `testBattle.ts` (~341 linii) — DATA + builder presetów testowych
- `README-manualBattle.md` — dokumentacja `ManualBattle`
- `battleScene.ts.bak-batch` — backup po batch-edits (artifact)

**Powiązane `game/`:**
- `game/siege.ts` (~758 linii) — PURE, DOM-free logika oblężenia miasta (poza sceną 3D)
- `game/combat.ts` — kanon SS5l (`resolveCombat`, `hitChance`, `baseDamage`, `rangeDamage`, `flankRearDefensePenalty`, `terrainDefenseMultiplier`, `terrainRiverAttackMultiplier`, `counterMultiplier`)

**Launchery / integracja:**
- `src/oblezenia/main.ts` (38 linii) — demo: preset `oblezenie` + `BattleScene({siege:{civ:'rzym'}, deploy:true})`
- `src/main.ts` — integracja bitwy z mapą (`BattleScene` import, fragmenty `showPreBattle`)

---

## 2. Architektura warstwowa

```
KANON (źródło prawdy)
  game/combat.ts ─── resolveCombat (faza dystansowa → szarża → zwarcie)
                     hitChance / baseDamage / rangeDamage / counter
                     flankRearDefensePenalty / terrain * / structureDefBonusPct

LOGIKA OBLĘŻENIA (pure math, map-level, bez DOM/3D)
  game/siege.ts ──── resolveSiegeAttack (1v1 + bonus miasta)
                     cityDefenseBonus (mury + fort + teren)
                     makeMilitia (SS9c) / captureCity
                     RE-IMPLEMENTUJE hitChance/baseDamage lokalnie (lane isolation
                     — NIE importuje combat.ts)

SCENA 3D BITWY (square grid, auto)
  battle/battleScene.ts ── BattleScene (auto-bitwa, AI obie strony)
                           używa combat.ts::resolveCombat per-blow
                           własny 4-dir facing INLINE (facing.ts nieużywany)
                           siege mode: mur + brama + machiny + wall walkway

SCENA 3D BITWY (hex grid, manual)
  battle/manualBattle.ts ── ManualBattle (gracz steruje, AI wroga)
                            używa combat.ts::resolveCombat per-attack
                            BRAK siege mode (open-field tylko)

MESH MURU
  battle/siegeWall.ts ──── buildSiegeWall(civ) → THREE.Group
                           9 stylów per cywilizacja
                           segmentowany per-tile (wyłomy)

TEREN POLA BITWY
  battle/battle-terrain.ts  generateBattleTerrain (seeded PRNG)
                            Plains/Forest/Hills/River/Ford/Rocks/Wall/Gate

DATA PRESETÓW
  battle/testBattle.ts ──── PRESETS + buildTestArmies (DATA only, bez THREE)
```

**Kluczowa decyzja architektoniczna:** `siege.ts` celowo NIE importuje `combat.ts` (lane isolation) i re-implementuje fragmenty kanonu (`hitChance`, `baseDamage`). `battleScene.ts` importuje `combat.ts` bezpośrednio. To dwie równoległe ścieżki oblężenia: matematyczna (`siege.ts`, map-level) i wizualna (`battleScene.ts` siege mode, scene-level), które **nie są ze sobą spięte**.

---

## 3. Analiza per-file

### 3.1 `battleScene.ts` (~8700 linii) — Tactical 3D AUTO-battle

**Geometria (B7 rework — SQUARE grid):**
- `BF_COLS=34`, `BF_ROWS=78` (rank axis powiększony +50 per Naster), `TILE_S=1.0`
- `FRONT_GAP=5` (tiles między frontami), `ATK_FRONT_COL`/`DEF_FRONT_COL` wyliczane z centrum
- `MAX_PER_SIDE=84`, `RANK_WIDTH=20`, `MAX_RANKS=4`, `DEPLOY_MARGIN=4`
- `cellToWorld(col,row) → {x: col*S, z: row*S}`; dystans Manhattan; sąsiedztwo 4-dir (N/E/S/W)
- MAPA świata zostaje hex (`scene.ts`/`hexutil.ts`); **tylko** pole bitwy jest square

**Facing (4-dir, INLINE — NIE z `facing.ts`):**
- `Dir {N=0, E=1, S=2, W=3}`, `DIR_DELTA`, `facingToward`, `facingFromTo`, `oppositeDir`, `relativeHit` (front/flank/rear) — wszystkie eksportowane z `battleScene.ts` (linie 93–178)
- Komentarz wyjaśnia: `facing.ts` (HEX 6-dir) jest geometrycznie niekompatybilny ze square grid, ale lane-rule zabrania nadpisania — square facing żyje tutaj

**Placement:**
- Atk left (front=E, +X), def right (front=W, -X), czyste kolumny, gap między frontami
- `arrangeFlankCavalry` — Konnica/Rydwan na skrzydła front-rank (top/bottom rows)

**Turn loop:**
- `_beginTurn` → snapshot living units atk/def, **interleaved atk/def** (inicjatywa), każdy dostaje `moveLeft = movementPoints(bu)`
- `_activateNext` → `_activateUnit` (JEDNA akcja/turę: ruch LUB cios; counter pada na **własną późniejszą turę** celu)
- `_activateUnit` decision tree:
  1. `routed` → `_fleeStep` (ucieczka ku home edge, nigdy atak)
  2. `_manualMode && side==='atk'` + `playerOrder` (hold/move/attack) → sterowanie gracza
  3. SURROUND check (≥3 wrogów adjacent → `-MORALE_SURROUND_HIT` raz)
  4. `_updateFacing` ku najbliższemu wrogowi
  5. `onWallWalkway` (siege) → hold wall, shoot +1 range, melee base/walkway
  6. RANGED (`canShoot`) → `_rangedAction`: shoot in-range / kite / approach to farthest in-range
  7. MELEE (lub out-of-ammo) → phalanx line keep / cavalry target priority / skirmish fallback

**Ruch:**
- BFS do pozycji ataku (`_firstStepAlongPathToAttack`), greedy fallback (`_stepToward`)
- `_advanceStep`, `_advanceToward` (dla machin), `_phalanxStep` (utrzymuje linię, minimalizuje lateral drift)
- Ranged: `_rangedAction` z kiting (utrzymuje `MELEE_SAFE_GAP=2` od melee threats), out-of-ammo FALL-BACK (`FALLBACK_TILES=3`, `heldAfterFallback` latch)

**Combat:**
- `_doAttack` → `resolveCombat` (kanon SS5l) + animowany blow-for-blow (lunge/recoil), float damage labels, HP/morale/ammo bars
- `attackerPosition = relativeHit(...)` (front/flank/rear) przekazywane do `resolveCombat`
- `defenderTerrain = terrainMap.combatTerrainName(...)` (per-tile teren obrońcy)
- Projectiles: arrow/javelin/pilum/sling (meshes), trajektoria łukowa, `ammoLeft`/`ammoMax`

**Morale (rozbudowany model scene-side):**
- Per-unit `morale` (0..`MORALE_START=100`), `fleeMorale` per-unit, `moraleMax`
- `_checkRout`, `_startRout`; army-morale ratio (L/R edge meters + top bar)
- `ARMY_MORALE_LOSS_THRESHOLD=0.25` — strona poniżej przegrywa (army collapse)
- `MORALE_SURROUND_HIT=10`, `MORALE_FLANK_HIT=8`, `MORALE_REAR_HIT=15`, `MORALE_CHARGE_HIT=15`, `MORALE_KILL_GAIN=6`, `MORALE_ENEMY_BREAK_GAIN=5`
- `MORALE_GATE_BREACH=5` (wszyscy obrońcy), `MORALE_WALL_BREACH=0` (per-kafel compounding WYŁĄCZONE)
- `MORALE_GENERAL_AURA=0` — **PLACEHOLDER** (patrz §8)
- Stall watch: `STALL_TURN_LIMIT=6` brak postępu → rozstrzygnięcie po morale armii (ale **NIE w siege**, **NIE gdy 0 strat**)

**End:**
- `_checkEnd` → winner `atakujacy`/`obronca`; mutual elimination → tiebreak po HP sumie
- Freeze end-screen (TASK D) z per-side stats + "Szczegoly" breakdown (destroyed/routed/survived per unit name) + "Zakoncz bitwe" → `onFinish` + `dispose`

**Speed / czas wirtualny:**
- `vNow` (virtual clock) + `SPEED_STEPS=[1,2,4,8,16,32,64,128,256,512]`; `P` pause, `S` cycle, `H` toggle bars, `M` mute
- `_drainTimers` per-frame; wall-delta clamped do 100 ms (tab background safe)

**Audio (procedural Web Audio, bez plików):**
- Lazy `AudioContext` na first gesture; `_masterGain` (~0.25 SFX), `_ambGain` (~0.07 ambient drone+drum)
- SFX: `_sfxMelee`, `_sfxShot`, `_sfxDeath`, `_sfxRout`, `_sfxVictory`, `_sfxRamImpact`, `_sfxCatapultImpact`
- Throttling (min gap + thinning at high speed)

**Camera:** dolly-zoom + drag-pan, `camDist` 6–70, eased

**Deploy phase** (`opts.deploy=true`):
- Gracz przesuwa atakujących przed walką; `_buildDeployZone`, `_moveDeployUnit`, `_endDeployPhase`
- Box-select, selection rings, groups 1–5, `playerOrder` hold/move/attack, `rangedKite`/`shootingEnabled` flags

**Siege mode** (`opts.siege`) — szczegóły w §6.

**Auto-resolve (wewnątrz sceny):** `computeInstantResult()` (L8461) — patrz §5.

---

### 3.2 `manualBattle.ts` (~1399 linii) — recznie sterowana bitwa (HEX grid)

**Rola:** równoległa implementacja, NIE modyfikuje `battleScene.ts`. README: "istnieje obok (różne tryby walki)".

**Geometria:** HEX pointy-top (axial), `axialToWorld`; `DEFAULT_COLS=20`, `DEFAULT_ROWS=12`; `MB_R=HEX_R`; siatka budowana identycznie jak `scene.ts` (`CylinderGeometry(6)` bez `rotateY`)

**API:** `constructor(opts: ManualBattleOpts)` → `start(onFinish)` → `dispose()`; `selfTest()` (lekki test bez WebGL)

**Sterowanie:**
- Klik własnej jednostki → zaznaczenie (złoty pierścień) + BFS zasieg ruchu (niebieskie) + cele ataku (czerwone)
- Klik hexu w zasięgu → ruch animowany (hop); klik wroga adjacent → ATAK (`resolveCombat` + animacja cios-za-cios)
- Pan: drag/WASD/strzałki; zoom: kołko; przyciski "Zakoncz ture" / "Wyjscie"
- `BattleCamera` (wzorzec z `camera.ts`) z detekcją drag-vs-klik

**AI wroga** (`_runEnemyTurn`, `_enemyAct`): atakuj adjacent (cel = najniższe HP) albo podejdź ku najbliższemu wrogowi; kontynuuj zbliżanie w tej samej turze jeśli zostaly punkty

**Combat:** `_doAttack` → `resolveCombat` (maxRounds=30, attackerMoved=true, defenderTerrain=this.teren) + animowane rundy (LUNGE/RECOIL/ROUND_PAUSE, `MAX_VIS_ROUNDS=10`)

**BRAK:** siege mode, teren proceduralny (tylko kolor podłogi per `teren`), morale/ammo bars, ranged kiting, phalanx line, cavalry priority, speed control, audio. Implementacja jest **znacznie uboższa** niż `battleScene.ts` — prosta bitwa taktyczna open-field.

**Duplikacja:** pomocnicze (`toCombatUnit`, `norm`, `terrainFloorColor`, `makeHpBar`, `worldToScreen`, `lerp/easeOut/easeIn`) zduplikowane lokalnie, bo w `battleScene.ts` są prywatne dla modulu.

---

### 3.3 `siegeWall.ts` (~935 linii) — proceduralny mur obronny

**Eksport:** `buildSiegeWall(civ: BronzeCiv, opts: SiegeWallOpts) → THREE.Group`; `attachRowBreachPanels(wallGroup, wallCenterRow, rowLo, rowHi, gateRowLo, gateRowHi, tileSize)`

**9 cywilizacji** (per-civ builder):
- **Kamień/cegła + portcullis (krata):** `grecja`, `rzym`, `sumer`, `egipt`, `inka`, `chiny`
- **Drewno + wooden gate (wrota z bali):** `zulu` (palisada), `celtowie` (murus gallicus), `germanie` (wal ziemny)
- `aztek` → fallback na `buildGrecja`

**Architektura muru (wymog Naster/Total War):**
- `wallD ≥ tileSize` — mur ma GŁĘBIĘ (chodnik bojowy), nie jest cienką linią
- `walkY = H` — górna powierzchnia = chodnik bojowy szerokości `wallD`
- Blanki (merlons) TYLKO na zewnętrznej krawędzi (−Z = strona atakującego)
- Schody (stopnie) po stronie wewnętrznej (+Z = strona obrońcy), dostęp na chodnik

**`buildWallBodySegmented`:** N segmentów per-tile (`BoxGeometry(T, H, wallD)`), `Map<segmentIdx, Mesh>` w `userData['wallSegsByLocalX']` — **umożliwia ukrycie konkretnego segmentu przy wyłomie** (per-rząd wyrwa)

**`addStairs`:** bieg schodów ze stopniami `BoxGeometry`, i=0 najniżej (najdalej od muru), i=nSteps-1 najwyżej (przy wew. licu, dociera do `walkY=H`)

**`addPortcullis`:** pionowe prety + 3 poziome poprzeczki + rama obwodowa (iron materiał), wypełnia otwór bramy

**`addWoodenGate`:** 2 skrzydła z bali (pionowe plany) + pozioma belka wzmacniająca + skośne wzmocnienie (krzyż) + środkowy zamek

**Per-civ akcenty:** wieże cylindryczne (rzym), pylony trapezowe (egipt), menglou kwadratowa wieża + dach (chiny), łuk polkolisty (sumer), palisada na koronie (celtowie/germanie), cierniowy wal u podstawy (zulu), most nad bramą, filary

**`userData`:** `wallWalkY`, `depth`, `gateCenterX`, `gate` (Group), `gateOpen=false`, `wallSegsByLocalX`

**`attachRowBreachPanels`:** przekształca `segsByLocalX` → `rowWallMeshes` (`Map<row, Mesh[]>`) używając `localX = (r - wallCenterRow) * T`; zachowuje pustą `rowBreachPanels` dla compat. wstecznej

**Zero `Math.random()` — całkowicie deterministyczne.**

---

### 3.4 `battle-terrain.ts` (~304 linie) — deterministyczny teren bitwy

**`BTerrain` (const enum):** `Plains=0`, `Forest=1`, `Hills=2`, `River=3` (IMPASSABLE), `Ford=4`, `Rocks=5`, `Wall=6` (IMPASSABLE — units chodzą po koronie, nie przez), `Gate=7` (IMPASSABLE aż do breach)

**PRNG:** xmur3 (hash stringa) → mulberry32 (stream); seeded z `'bf:'+teren+':'+cols+'x'+rows` → **identyczny teren co run dla samego matchupu**

**`generateBattleTerrain`:**
- MAIN river: winding 1–2 wide vertical strip przez central band (random walk clamped do `riverLo..riverHi`, nigdy w deploy zone)
- TRIBUTARY: krótsza gałąź od main river ku flanku (mid rows)
- FORDS: `fordCount = max(3, round(rows/6))`, bias do centrum + gwaranted center-row crossing → rzeka nigdy nie walia pola
- FOREST clusters: `max(6, round(fieldArea/90))` blobów (radius 1–3), scatterowane po WHOLE field (nie tylko flanks)
- HILLS clusters: `max(5, round(fieldArea/120))`
- ROCKS: `max(8, round(fieldArea/60))` scatter
- `deployMargin` columns po obu stronach = PLAINS (deployment ground)
- `stampBlob` z soft edge (skip ~25% fringe)

**`BattleTerrainMap`:** `at(c,r)`, `passable(c,r)` (false dla River/Wall/Gate), `moveCost(c,r)` (Plains=1, Forest/Hills/Rocks=2, Ford=3, River/Wall/Gate=Infinity), `combatTerrainName(c,r)` → string matchujący `data/terrain-combat.json` (Las/Wzgorza/Rzeka/Plaskie)

**`tileJitter`:** deterministyczny per-tile jitter dla decoration placement

---

### 3.5 `facing.ts` (~157 linii) — HEX 6-dir facing (ARTEFAKT)

**Status:** NIEUŻYWANY przez `battleScene.ts` (square grid). Geometrycznie niekompatybilny.

**Co robi:** pointy-top axial 6-dir (`FACE_DIRS`), `facingTowards(dq,dr)` (cube dot product scoring), `facingFromTo`, `classifyAttack` / `classifyOffset` — 2/2/2 split (offset 0,1→front, 2,5→flank, 3,4→rear)

**Dlaczego istnieje:** równoległa sesja stworzyła go dla poprzedniej HEX bitwy; lane-rule zabrania nadpisania; `battleScene.ts` ma własny square 4-dir facing INLINE (linie 93–178) z komentarzem wyjaśniającym konflikt.

**Wniosek:** techniczny dług — do deduplikacji gdy hex battle zniknie całkowicie.

---

### 3.6 `testBattle.ts` (~341 linii) — DATA + builder presetów

**Eksport:** `PRESETS`, `PresetName`, `DEFAULT_PRESET='rzym_grecja'`, `MAIN_INFANTRY_COUNT=40`, `buildTestArmies(units, preset)`, `presetTotalUnits(preset)`

**Presety:**
- `maly` — 4 vs 4 (Hastati vs Falanga)
- `duzy` — 40 vs 40 (mieszane linie)
- `rzym_grecja` (DEFAULT) — 64 vs 64 / 128 jednostek: 40 lead infantry + 20 Oszczepnik + 20 Łucznik + 2 Konnica + 2 Rydwan konny per side
- `konnica` — rydwany + jazda + Wlocznik anvil (~36 per side)
- `oblezenie` — atk: 20 Hastati + 10 Katapulta + 1 Taran + 2 Wieża oblężnicza; def: 20 Hastati + 20 Łucznik + 10 Katapulta (na murze)

**Lookups:**
- `normalizeForMatch` — NFD + strip diacritics + `ł→l` + lowercase (accent-tolerant: `Łucznik` ≡ `Lucznik`)
- `categoryFor` — mirror `units/setup.ts::categoryOf` (osadnik/robotnik/zwiadowca/galera/rydwan/konnica/falanga/legionista/wlocznik/miecznik/lucznik/procarz/oszczepnik/maczuga/topor/super/domyslny)
- `findUnitRow` — accent/spacing-tolerant lookup po `Jednostka` lub `Nazwa EN`
- `buildSide` — buduje `BattleUnit[]` z real stats z `units.json` (HP, kategoria, ownerColor)

**Kolory:** atk = warm gold (`0xffd54a`, Rzym), def = blue (`0x4060c8`, Grecja)

**ASCII-only, NO THREE/DOM** — czysta data, trivially testable.

---

### 3.7 `game/siege.ts` (~758 linii) — PURE city-siege logic (map-level)

**Natura:** SELF-CONTAINED, DECOUPLED — jak `economy.ts` definiuje własne `EconomyCity`, ten plik definiuje `SiegeUnit`/`SiegeCity` i re-implementuje fragment kanonu (NIE importuje `combat.ts`). "Integration into the turn loop / battle is intentionally NOT done here".

**Stałe (z data + fallback):**
- `WALL_BASE_OBRONA=5`, `WALL_PER_LEVEL_OBRONA=3` (buildings.json "mury"), `WALL_MAX_LEVEL=10`
- `WALL_PANCERZ_FRACTION=0.5` — część bonusu muru hartuje Pancerz (cover)
- `HILL_DEFENSE_MULT=1.5`, `MOUNTAIN_DEFENSE_MULT=1.75` (terrain-combat.json)
- `FORTIFY_OBRONA_BONUS=2`, `MILITIA_POP_FRACTION=0.2` (SS9c), `MILITIA_STRENGTH_FRACTION=0.5`, `SIEGE_MAX_ROUNDS=30`

**`cityDefenseBonus(city, params)`:**
- Mury: `buildingEffectAtLevel(wallBase, level)` — **compound scaling** `wallBase × 1.10^(L-1)` (nie linear `wallPer`)
- Część muru → Pancerz (`wallPancerz = wallObrona × 0.5`)
- Fortify: +2 flat gdy `city.fortified`
- Terrain: `terrainDefenseMult` (hill ×1.5, mtn ×1.75)
- Zwraca `obronaBonus`, `pancerzBonus`, `terrainMult` + breakdown

**`applyCityBonus`:** `effObrona = (Obrona + obronaBonus) × terrainMult`, `effPancerz = Pancerz + pancerzBonus`

**`makeMilitia` (SS9c):** `count = floor(pop × 0.2)`; stats = `STONE_WARRIOR × 0.5` (Atak 6→3, Obrona 6→3, itd.); pooled HP = `count × Warrior_HP × 0.5`; `progDezercji=null`, `unbreakable=true` (defends to last)

**`effectiveGarrison`:** real garrison (Health>0) first, else militia

**`resolveSiegeAttack(attacker, city, opts)`:**
- Pick top defender (garrison[0] lub militia), fold `cityDefenseBonus` przez `applyCityBonus`
- Trade blows: atk first (R1 = charge, +Uderzenie), def strikes back if alive; rout checks; `maxRounds=30`
- Outcome: `attackerWins`/`defenderWins`/`stalemate` (both down → defenderWins = miasto się trzyma)
- Zwraca HP loss / death / `engagedDefender` / `appliedBonus` / `rounds` / `log`
- Pure, injectable RNG (`opts.rng`) dla determinism

**`canCaptureCity`:** garrison pusty (wszystkie Health≤0); militia NIE liczy się (transient)

**`captureCity`:** NEW `SiegeCity` (ownerId=newOwner, garrison=[], fortified=false) — no mutation

**`canEnemyCapture`:** different owner + undefended + axial hex distance == 1

**`hexDistanceAxial`:** self-contained (cube formula)

---

### 3.8 `game/combat.ts` — kanon SS5l

**`resolveCombat(attacker, defender, opts)`:**
- Phase 0 (Ranged): while ammo + HP + no rout — atk shoots, def shoots back, rout/death checks
- Phase 1&2 (Melee): szarża (R1, +Uderzenie unless `defBracing` negates) → zwarcie; simultaneous blows per round; rout/death checks
- Modifiers: `flankRearDefensePenalty` (reduces def Obrona), `counterMultiplier` (trójkąt włócznik/konnica/dystans), `terrainDefenseMultiplier` (def), `terrainRiverAttackMultiplier` (atk), `structureDefBonusPct` (mur+200/fort+100/posterunek+50 → `structMult = 1 + pct/100`)
- `AttackerPosition = 'front'|'flank'|'rear'` (opts.attackerPosition)
- `CombatResult`: winner, attackerHpLeft, defenderHpLeft, rounds, routed[], log[]

**Eksportowane helpery:** `hitChance`, `baseDamage`, `rangeDamage`, `counterMultiplier`, `flankRearDefensePenalty`, `terrainDefenseMultiplier`, `terrainRiverAttackMultiplier`, `normTerrain`, `routThreshold`, `resolveAmmo`, `isRangedUnit`, `negatesCharge`

---

### 3.9 `src/oblezenie/main.ts` (38 linii) — demo launcher

Wczytuje `data = loadGameData()`, buduje armie z `buildTestArmies(data.units, 'oblezenie')`, uruchamia `new BattleScene({attacker, defender, teren, data, siege:{civ:'rzym'}, deploy:true})`, `scene.play(() => scene.dispose())`.

---

### 3.10 `src/main.ts` — integracja z mapą (PARTIAL / DEFERRED)

- Import `BattleScene` (L75)
- `battleUnitToCombatUnit` mapuje RuntimeUnit → CombatUnit (L1247)
- **Path aktywny (L1464):** `showPreBattle` → `onBattlefield` → `new BattleScene({attacker, defender, teren, data})` → `bs.play(...)` → `showHintMessage` + `dispose`
- **Path DEFERRED (L972):** `"P4: BattleScene deferred — fall back to auto"` → `doMapAutoResolve()` (druga ścieżka bitwy pominięta)
- `onAuto` (L1444): szybki auto-resolve na **LEAD units only** (`atkLead = attackerUnits[0]`, `defLead = defenderUnits[0]`, `resolveCombat(cu_atk, cu_def, {defenderTerrain: teren})`) — uproszczone vs pełna symulacja

---

## 4. Tactical battle scene — podsumowanie sygnałów

| Aspekt | Realizacja |
|---|---|
| Grid | SQUARE 34×78 (B7); mapa świata HEX |
| Facing | 4-dir INLINE (N/E/S/W); `relativeHit` front/flank/rear → `resolveCombat.attackerPosition` |
| Turn | interleaved atk/def, 1 akcja/turę (ruch LUB cios), counter na własnej turze celu |
| Ranged | kite, ammo, out-of-ammo FALL-BACK, projectile meshes (arrow/javelin/pilum/sling) |
| Melee | phalanx line-keep, cavalry priority, skirmish, surround morale |
| Morale | per-unit + army ratio; surround/flank/rear/charge/kill/break; gate breach −5; wall breach −0 (per-tile off) |
| End | annihilation OR army-morale<25% OR stall (nie w siege); freeze end-screen z breakdown |
| Speed | virtual clock 1×–512×, P pause, S cycle, H bars, M mute |
| Audio | procedural Web Audio (SFX + ambient drone/drum), lazy gesture |
| Deploy | opcjonalny `deploy:true` — gracz rozstawia atakujących |
| Manual | toggle AUTO/RĘCZNE; roster bar, box-select, groups 1–5, playerOrder |

---

## 5. Auto-resolve — trzy ścieżki

### 5.1 `battleScene.ts::computeInstantResult()` (L8461) — pełna symulacja rosteru
- Wywoływane z `skip()`
- Wave-based: `maxWaves = (atkLen+defLen)*6+10`; per wave pair-up `atk[i%lA] vs def[i%lD]`
- `resolveCombat` per pair z `attackerPosition = relativeHit(...)` (flank/rear z facing) + `defenderTerrain = terrainMap.combatTerrainName(...)` (per-tile)
- Survivor = wygrana strona; tiebreak po HP sumie
- **Pełny roster**, uwzględnia facing + per-tile teren

### 5.2 `main.ts::onAuto` (L1444) — LEAD-only quick resolve
- `atkLead = attackerUnits[0]`, `defLead = defenderUnits[0]`
- `resolveCombat(cu_atk, cu_def, {defenderTerrain: teren})` — JEDNA para lead-units, bez facing, bez per-tile teren
- **Uproroszczone** — pokazuje winner + rounds via `showHintMessage`; nie aplikuje strat do reszty rosteru

### 5.3 `game/siege.ts::resolveSiegeAttack()` — single engagement (map-level)
- 1 atakujący vs TOP garrison defender (z `cityDefenseBonus` folded)
- `maxRounds=30`, rout checks, pure + injectable RNG
- Zwraca HP loss / death / `engagedDefender` / `appliedBonus`
- **NIE wpięte w pętlę tury / BattleScene** (intentional — patrz §8)

**Różnica:** `computeInstantResult` = pełna symulacja roster vs roster; `main.ts onAuto` = lead-only quick; `resolveSiegeAttack` = single 1v1 z bonusami miasta (matematyka map-level, bez 3D).

---

## 6. Siege mechanics — warstwy

### Warstwa 1: `game/siege.ts` (pure math, map-level) — NIE WPIĘTE
- `cityDefenseBonus`: mury (compound `wallBase × 1.10^(L-1)`) + fortify (+2) + terrain (hill ×1.5, mtn ×1.75); 50% muru → Pancerz
- `makeMilitia` SS9c: 20% pop × ½ Warrior, pooled HP, `unbreakable`
- `resolveSiegeAttack`: 1v1 z bonusami, 30 rund
- `canCaptureCity`/`captureCity`/`canEnemyCapture` (adjacency hex dist==1)
- **Status:** pure, deterministic, ale "integration into turn loop/battle intentionally NOT done"

### Warstwa 2: `battleScene.ts` siege mode (3D scene) — AKTYWNE
- `opts.siege = {civ?, defCiv?}` aktywuje tryb (SIEGE v2: `defCiv` określa styl muru)
- `_carveWallTiles`: `wallCol = DEF_FRONT_COL+4`; mur od krawędzi do krawędzi (rows 0..BF_ROWS-1); brama 2-row na `midRow`; `BTerrain.Wall/Gate`; `gateHp=400` (`GATE_MAX_HP`); `wallTileHp` per-tile = 640 (`WALL_TILE_HP`)
- `_placeSiegeWall`: `buildSiegeWall(civ)` → `THREE.Group`, `rotation.y=π/2`, pozycja `wallCol × TILE_S`; `attachRowBreachPanels` → `rowWallMeshes`; siege HUD (pasek HP bramy + kafla muru, blokowe ASCII)
- `_placeSiegeDefenders`: melee + archers + def catapults **NA koronie muru** (`col=siegeWallCol`, `onWallWalkway=true`, +1 range elevation); konnica/non-cata machiny **ZA murem**; katapulty obrońcy skupione ±4 od bramy (kontrbateria); `DEFENSE_HALF_SPAN=12`
- `_repositionSiegeAttackers`: machiny na col adjacent to wall (Taran zasięg 1, Katapulta zasięg 5)
- `_attackGate`: **tylko machiny** zadają real dmg (`imp×2`, min 12); `_isRam`/`_isCatapult`/`_isSiegeTower` detektory (`Typ==='Siege'` lub name match); animacja taranu (triangle lunge) + SFX boom 55Hz; `gateHp→0` → `_breachGate`
- `_attackWallTile`: Katapulta ostrzeliwuje kafel (`base×2`, min 16); boulder parabola anim + SFX 80Hz; po 700 ms `wallTileHp→0` → `_breachWallTile`
- `_breachWallTile`: `BTerrain.Wall→Plains`; ukryj segment muru (`visible=false` via `rowWallMeshes`); dodaj gruz (4 boxy); **obrońca na kaflu cofa się o 1** (`wallCol+1`) — piechota/łucznik; **KATAPULTA obrońcy ginie** (nie ma jak zejść); morale `−MORALE_WALL_BREACH=0` (per-tile compounding OFF)
- `_breachGate`: `gateOpen=true`; `Gate→Plains`; ukryj portcullis + lintel + bridge + pillars (gateCenterX prox); morale `−MORALE_GATE_BREACH=5` wszystkim obrońcom
- `towerAtWallRows`: siege tower dotarł do wall base → atk infantry adjacent może "climb" onto walkway (`onWallWalkway=true`)
- `_updateSiegeHud`: pasek HP bramy (400) + ostatnio atakowany kafel muru (640)
- Morale siege: `MORALE_GATE_BREACH=5`, `MORALE_WALL_BREACH=0`; stall watch **NIE rozstrzyga w siege** (`isSiege` bypass)

### Warstwa 3: `siegeWall.ts` (mesh) — patrz §3.3

**Luka architektoniczna:** Warstwa 1 (`siege.ts`) i Warstwa 2 (`battleScene` siege mode) **nie są spięte**. `battleScene` re-implementuje bonusy muru po swojej stronie (gateHp=400, wallTileHp=640, +1 range elevation, retreat-on-breach), a `siege.ts` żyje własnym życiem jako pure math do wpięcia w pętlę tury (START-OBL kontrakt — CZEKA).

---

## 7. Multi-unit status

**`BattleUnit` shape (wspólny `battleScene` + `manualBattle`):** `{id, nazwa, kategoria, ownerColor, stats, hp, maxHp}`

**`main.ts::battleUnitToCombatUnit`** (L1247) — mapuje RuntimeUnit → CombatUnit

**Aktualnie:** `BattleScene` przyjmuje `BattleUnit[]` per side; **BRAK scalania wielu jednostek z jednego heksa** w jeden roster bitwy — każda jednostka = osobny `BattleUnit`. Nie ma "składu bitwy zbiorowej z heksa".

**Z `docs/analiza/04-UNITS.md`:**
- "Kontrakt **multi-unit** (skład bitwy zbiorowej z heksa) — **IN PROGRESS**"
- "Stacking bez limitu + okno połącz/nie — **ZAMKNIĘTE** (UI `showArmyStackPrompt` gotowe)" — ale **merge wounded w bitwie** jeszcze CZEKA
- Handoff: "multi-unit battle roster | `UNITS-do-SILNIK_multi-unit.md` | **CZEKA**"
- Handoff: "merge/stacking API | `UNITS-do-UI_army-merge.md` | **CZEKA**"

**Wniosek:** multi-unit battle roster (z heksa → `BattleUnit[]`) jest **ODOROCZONY** — kontrakt CZEKA na handoff do SILNIK. Aktualnie bitwa dostaje **płaską listę `BattleUnit`** (każda jednostka mapy = 1 `BattleUnit`).

---

## 8. Co jest DEFERRED / PLACEHOLDER

| # | Element | Status | Lokalizacja |
|---|---|---|---|
| 1 | `MORALE_GENERAL_AURA=0` | **PLACEHOLDER** — future +morale aura generala, not wired | `battleScene.ts:452` |
| 2 | "TODO: general rally recovery" — `routedUnits` lista do respawn rallied | **TODO** | `battleScene.ts:1448, 6044` |
| 3 | `main.ts` L972 "P4: BattleScene deferred — fall back to auto" | **DEFERRED** — drugi path bitwy pominięty, używa `doMapAutoResolve` | `main.ts:972` |
| 4 | `expandTestBattleComposition` — BRIDGE: main.ts canned 4v4 → DEFAULT preset detect-and-swap | **BRIDGE** — "main.ts can later build the test battle directly in ONE line — out of this lane" | `battleScene.ts:1184` |
| 5 | `facing.ts` (HEX 6-dir) — artefakt, niekompatybilny ze square grid | **ARTEFAKT** — lane-rule zabrania nadpisania; square 4-dir facing inline w `battleScene` | `battle/facing.ts` |
| 6 | Multi-unit battle roster (z heksa → `BattleUnit[]`) | **CZEKA** — handoff `UNITS-do-SILNIK_multi-unit.md` | — |
| 7 | Start siege + garnizon HP (flaga oblegane) | **CZEKA** — handoff `UNITS-do-SILNIK_oblezenie-start.md` | — |
| 8 | Machiny in-siege queue | **CZEKA** — handoff `UNITS-do-EKONOMIA_machiny.md` | — |
| 9 | Merge/stacking API w bitwie (merge wounded) | **CZEKA** — handoff `UNITS-do-UI_army-merge.md` | — |
| 10 | Fight/flee heurystyka (reakcja adjacency) | **CZEKA** — handoff `CYWILIZACJE-do-SILNIK_reakcja.md` | — |
| 11 | `siege.ts` integration into turn loop / battle | **INTENTIONALLY NOT DONE** — pure, do wpięcia później | `siege.ts:10` |
| 12 | `manualBattle.ts` siege mode | **BRAK** — hex grid, tylko open-field | `manualBattle.ts` |
| 13 | `main.ts::onAuto` — LEAD-only quick resolve (nie full roster) | **Uproszczone** vs `computeInstantResult` | `main.ts:1444` |
| 14 | `MORALE_WALL_BREACH=0` — per-kafel compounding wyłączone | **Decyzja projektowa** (nie TODO) | `battleScene.ts:454` |
| 15 | `battleScene.ts.bak-batch` — backup po batch edits | **Artifact** | `battle/battleScene.ts.bak-batch` |

---

## 9. Testy / smoke (z `docs/analiza/04-UNITS.md`)

| Suite | Wynik |
|---|---|
| combat-test | 6/6 |
| oblezenie-test | 27/27 |
| barbarians-test | 53/53 |
| battle-smoke.cjs | OK |

`README-manualBattle.md`: "npx tsc --noEmit — 0 błędów w `manualBattle.ts`".
`testBattle.ts`: self-contained data, `findUnitRow` accent-tolerant (`Łucznik` ≡ `Lucznik`).

---

## 10. Następne kroki (rekomendacje)

1. **`facing.ts` dedup** — albo wydzielić square 4-dir facing z `battleScene.ts` do `facing-square.ts`, albo zaktualizować `facing.ts` do square (gdy hex battle definitywnie zniknie)
2. **Spiąć Warstwę 1 z Warstwą 2** — `siege.ts` bonusy miast + `resolveSiegeAttack` jako kanon dla `battleScene` siege mode (lub odwrotnie — obecnie dwie równoległe implementacje bonusów muru)
3. **Wpiąć `siege.ts` w pętlę tury** (kontrakt START-OBL) — flaga oblegane + HP garnizon
4. **Dostarczyć multi-unit roster** (z heksa → `BattleUnit[]`) — kontrakt CZEKA
5. **Machiny in-siege queue** (EKONOMIA → UNITS handoff)
6. **General rally recovery** — skonsumować `routedUnits` do respawn rallied units
7. **`main.ts::onAuto` → pełny `computeInstantResult`** zamiast LEAD-only
8. **Drugi path bitwy (P4 deferred)** — włączyć `BattleScene` zamiast fall-back do auto
9. **`manualBattle.ts` siege mode** — dodać mur/bramę jeśli ma być pełną alternatywą dla `battleScene`

---

## Podsumowanie (brief)

- **Tactical battle scene** (`battleScene.ts`, ~8700 linii): square 34×78 grid, auto-bitwa z rozbudowanym AI (ranged kite, phalanx line, cavalry priority, surround morale), 4-dir facing, morale per-unit + army ratio, virtual clock 1×–512×, procedural audio, deploy phase, manual toggle. Jeden plik-monolit.
- **Auto-resolve**: 3 ścieżki — `computeInstantResult` (pełna roster symulacja, skip), `main.ts::onAuto` (LEAD-only, uproszczone), `siege.ts::resolveSiegeAttack` (1v1 + bonusy miasta, pure, NIE wpięte).
- **Siege mechanics**: 3 warstwy NIESPIĘTE — `siege.ts` (pure math, map-level, compound wall scaling + SS9c militia + capture), `battleScene` siege mode (3D: gateHp=400, wallTileHp=640, machiny, wall walkway +1 range, retreat-on-breach, tower climb), `siegeWall.ts` (9 proceduralnych stylów muru z segmentami per-tile dla wyłomów).
- **Multi-unit status**: ODOROCZONY — bitwa dostaje płatką listę `BattleUnit`; kontrakt "skład bitwy zbiorowej z heksa" CZEKA na handoff do SILNIK.
- **Deferred/placeholder**: `MORALE_GENERAL_AURA`, general rally recovery, P4 BattleScene path, `facing.ts` artefakt, `siege.ts` integration, `manualBattle` siege, pełny auto-resolve w `main.ts`. 5 kontraktów handoff CZEKA.
