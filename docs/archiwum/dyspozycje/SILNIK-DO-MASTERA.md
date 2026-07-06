# Civ-SILNIK → MASTER (raporty Q&A + wykonanie)

Zasada: append-only na dole · najnowszy wpis też na górze sekcji START.

---

## START — DO ZROBIENIA TERAZ (2026-06-29)

> **ROZDYSponowANIE LANE** — manifest: `SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md`  
> **MASTER przekazał Ci WSZYSTKO** — od 29.06 **Ty** routujesz lane, nie MASTER.

**MASTER → SILNIK (29.06 — wykonaj):**

1. **Wpięcie P0** (moduły GOTOWE od CYW): victory 10A · barbarians 11C · Grupa D integracja — handoffy § A manifestu
2. **Przypomnij Maciejowi:** Opus (`OPUS-REVIEW-QUEUE.md`) + playtest (handoff test 28.06)
3. **Eskaluj lane ROBIA** — powiedz Maciejowi które czaty otworzyć + `start`:
   - **Civ-MAPA:** OBL-S6 · złoża E-P0-04/05
   - **Civ-UI:** menu E-P0-01…03
   - **Civ-EKONOMIA:** EKO-P2-01 tick B5
4. **NIE koduj** tematów lane bez handoffu GOTOWE
5. Meldunek poniżej (szablon w manifest § F)

**→ SILNIK: ROZDYSponuj TERAZ**

---

## START — archiwum (2026-06-28)

### [2026-06-28] SILNIK → MASTER: wynik testów sesji 2026-06-28

**Od:** Grupa F (SILNIK)

**Publish:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` · md5: **`0a049ccc2d195459a73a619b62a9b325`**

| Suite | Wynik |
|-------|--------|
| smoke | **OK** |
| logic-test | **203/203 OK** |
| grupa-b-lane | **27/27 OK** |
| oblezenie | **27/27 OK** |
| map-siege | **6/6 OK** |
| siege-ai | **17/17 OK** |
| cluster-start | **35/35 OK** |
| civ-bonusy | **30/30 OK** |
| diplomacy | **132/135 — 3 FAIL** |

**FAIL diplomacy (lane DYPLO/CYW, nie main.ts):**
- `diff main types: 20 - 5 roznica kulturowa = 15` (got 16.5)
- `main vs minor: no penalty = 20` (got 24.5)
- (+ 1 powiązany w tej samej serii)

**Delegacja lane:** ✅ przekazano → `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md` (UI · MAPA · CYW · EKO · Opus)

**Playtest Maciej:** **CZEKA** — checklist: `_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md` § AC

**Opus HUD-S7:** **CZEKA** (`OPUS-REVIEW-QUEUE.md`)

**→ MASTER: GOTOWE-ROBOCZA sesja-2026-28** (bramka **CZĘŚCIOWA** — eskalacja **3 FAIL diplomacy** do lane CYW/DYPLO; nie blokuje playtestu HUD/tartak/oblężenie)

---

## START — archiwum delegacja (2026-06-28)

---

### [2026-06-28] Grupa F → lane: PRZEKAZANIE delegacji MASTER Work

**Od:** Grupa F (SILNIK) · **Na prośbę Master:** przekazać tematy **NIE SILNIK** do właściwych działów.

**Pliki:** `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md` · routing źródło: `MASTER-do-SILNIK_ROUTING-MASTER-WORK-2026-06-28.md`

| Lane | Czat | Start | Priorytet |
|------|------|-------|-----------|
| **UI** | Civ-UI | `UI.md` § E-P0-01 | Menu S0, wideo, Kampania |
| **MAPA** | Civ-MAPA | `MAPA.md` § OBL-S6 | Obóz 3D · złoża · 3 presety mapy |
| **CYW** | Civ-CYWILIZACJE | `CYWILIZACJE.md` § D-P0 | Excel AI · victory · barbarzyńcy |
| **EKONOMIA** | Civ-EKONOMIA | `EKONOMIA.md` § EKO-P2-01 + B1 | Tick B5 · tech drzewko (po ABC Macieja) |
| **Opus** | Ask ręczny | `OPUS-REVIEW-QUEUE.md` | HUD-S7 review kanonu |
| **A (HUD)** | osobny czat Macieja | `GRUPA-A-MAPA-SWIATA.md` | D1 minimapa/HUD |

**Komenda w czacie lane:** `start` — czytaj `dyspozycje/<LANE>.md` § DO ZROBIENIA TERAZ.

**→ MASTER:** delegacja wysłana · F czeka `→ SILNIK: GOTOWE` od lane'ów · własna robota F = test sesji 28.06.

---

## START — archiwum test (2026-06-28)

> **→ SILNIK: TESTUJ** · handoff `dyspozycje/_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md`

**MASTER oddaje:** wszystkie batchy sesji w `Gra-podglad.html` (= ROBOCZA). SILNIK = bramka + playtest checklist + meldunek.

**Bramka MASTER (2026-06-28):** smoke · logic 203 · grupa-b 27 · oblezenie 27 · map-siege 6 · siege-ai 17 · cluster 35 · diplomacy 135 · civ-bonusy 30 — **ZIELONE**

---

### [2026-06-28] MASTER → SILNIK: HANDOFF TEST (sesja pilna Maciej)

**Od:** MASTER  
**Do:** SILNIK — testuj, nie koduj (chyba że FAIL bramki)

**Wpięte w silniku (suma sesji):**
- B5 żywność HUD · F2 minimapa warstwy · F-B-TARTAK-DREWNO · save ulepszeń mapy
- Wcześniej: Wpływ/ Skarbiec / zasięgi 3D / OBL-S5/S7 / D-START P0

**Plik handoff:** `_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md`

**Twoja robota:**
1. Uruchom bramkę (komendy w handoff)
2. Playtest checklist (Maciej lub Ty)
3. Append meldunek tutaj → flaga `→ MASTER: GOTOWE-ROBOCZA` lub BLOCK

---

> **F-B-TARTAK-DREWNO** ✅ · Ctrl+F5 · tartak → Drewno w panelu Surowce

---

### [2026-06-28] → MASTER: GOTOWE-ROBOCZA F-B-TARTAK-DREWNO

**Wpięte:**
1. `getResourceAccessForCity(..., placedImprovements)` — panel Surowce pokazuje **Drewno** po tartaku
2. Save/load `placedImprovements` + `hexClearingStates` + odtworzenie mesh 3D

**Testy:** grupa-b-lane PASS · smoke OK  
**Publish:** `Gra-podglad.html` + `Gra-podglad-ROBOCZA.html`

**Checklist Macieja:** 🔨 tartak w zasięgu → panel miasta → Surowce → **Drewno** widoczne

---

> **HUD-B5-F2-PILNE** ✅ · kanon + ROBOCZA zsynchronizowane · Ctrl+F5

**Batch:** B5 żywność państwa na HUD · F2 przełączniki zasięgu przy minimapie · potwierdzenie OBL-S5/S7 w silniku.

---

### [2026-06-28] → MASTER: GOTOWE — HUD B5 + F2 + scalenie kanon/ROBOCZA

**Od:** SILNIK (MASTER sesja pilna)

**Wpięte (`main.ts` + UI):**
1. **B5** — `buildHudState()`: `zywnoscLabel` = zapasy państwa (`getEmpireFoodReserve`), `zywnoscRate` = netto/tura (`doPanstwa − kosztArmii`)
2. **F2** — `minimapLayers` w `mountD1bHud()` → przyciski 🎭/⛪ obok minimapy (ten sam toggle co toolbar)
3. **Potwierdzone już w silniku:** OBL-S5 (machiny), OBL-S7 (`siegeAi.ts` + `scanAutoSiegesAfterAiTurn`), Wpływ/ Skarbiec / zasięgi 3D

**Pliki:** `main.ts`, `hud.ts`, `minimapHud.ts`

**Testy:** smoke OK · logic 203/203 · oblezenie 27/27 · map-siege 6/6 · siege-ai 17/17

**Publish:** `Gra-podglad.html` + `Gra-podglad-ROBOCZA.html` (identyczne — pełny HUD + F-batchy)

**CZEKA:** OBL-S6 obóz 3D (MAPA) · Opus review → oficjalny kanon · D-P0/E-P0 lane

---

> **F-B-WYRAB-TARTAK** ✅ · ROBOCZA md5 `e87a5ca2f8eb5e4657ab28dd3da38644` · Ctrl+F5

**Grupa F:** oba batchy Grupa B (PILNE + WYRAB-TARTAK) wdrożone — czeka playtest Maciej + Opus → kanon.

---

### [2026-06-28] → MASTER: GOTOWE-ROBOCZA F-B-WYRAB-TARTAK

**Od:** Grupa F

**Wpięte (main.ts):**
1. `researchedTechs: player.zbadane` w `refreshBuildApi`
2. `applyBuildRequest` — rozgałęzienie `wycinka` (wyrąb FREE, usuwa Las) vs `ulepszenie` (tartak bez usuwania lasu)
3. `isImprovementTechUnlocked` guard przed kosztem Pracy
4. `hexClearingStates` + tick końca tury (+20 Pracy × 3 tury)
5. `IMPROVEMENT_CHIP.tartak` = 🪚

**Testy:** grupa-b-lane 23/23 · smoke OK  
**Publish:** `Gra-podglad-ROBOCZA.html` md5 `e87a5ca2f8eb5e4657ab28dd3da38644`  
**Backup:** `main.ts.bak-SILNIK-20260628-wyrab-tartak`

**Checklist Macieja (panel Budowa):**
- Wyrąb = FREE, bez tech
- Tartak szary do „Obróbka drewna”
- Wyrąb na lesie → bonus 60P, las znika (dane; drzewa 3D mogą zostać do rebuild sceny)
- Tartak na lesie → las zostaje + model tartaku

**Łącznie w ROBOCZA (sesja):** F-B-PILNE + mgła miast AI + F-B-WYRAB-TARTAK

---

### [2026-06-28] → MASTER: GOTOWE-ROBOCZA F-B-PILNE

**Od:** Grupa F

**Wpięte (main.ts):**
1. `getResourceAccessForCity` → panel Surowce
2. `getRevolt` → `bunt || revoltWarning` (🔥 na hexie w grace)
3. `resolveOwnCultureShare` + `isForeignReligionDominant` + `hasRatusz` → evaluateOrderFromBreakdown
4. `applyArmyStarvationHpLoss` po `isArmyStarving` (−8% HP, utrata jednostki)
5. fix `accumulateCulture` → `acc.kulturaSkumulowana` (było błędne `acc.after`)

**Testy:** grupa-b-lane 23/23 · society-breakdown 18/18 · smoke OK  
**Publish:** `Gra-podglad-ROBOCZA.html` md5 `be6f0ff491e7be2e34f22fa554d8a236`  
**Backup:** `main.ts.bak-SILNIK-20260627-pilne-luki`

**Następny:** F-B-WYRAB-TARTAK

---

### [2026-06-27] FIX — mgła miast AI (Maciej playtest)

**Objaw:** Miasta obcych cywilizacji widoczne jako brązowe dyski na czarnym (nieodkrytym) terenie.

**Fix:** `CityRenderer.applyFogVisibility` + `cityFogVisible` w `refreshFog()` (jak jednostki AI).

**Publish:** md5 `db391965…` (zastąpione przez F-B-PILNE build)

---

## START — archiwum (2026-06-27)

> **FIX dyplomacja mgła + nazwy miast + nauka** · ROBOCZA md5 `855f248258e6354ee159659bd9c03103` · Ctrl+F5

**Grupa F:** hotfix wdrożony w kodzie — czeka publish ROBOCZA + Opus → kanon.

---

### [2026-06-27] FIX — dyplomacja: mgła kontaktu + nazwy miast obcych typów (Maciej playtest)

**Objaw 1:** Panel Dyplomacji pokazuje wszystkie cywilizacje od startu (Inkowie×N, Zulusi×N) mimo braku odkrycia miasta.

**Objaw 2:** Obcy typ wyświetlany jako nazwa nacji („Inkowie”) zamiast miasta („Cusco”, „uMgungundlovu”…). Rywale klastra (Ostia, Kapua) OK.

**Przyczyna:**
- `getRelations()` nie filtrowało po `computeDiplomaticContacts()` (D-START-3A).
- `displayLabelForSlot()` dla obcego typu zwracało `civDisplayName()` zamiast `nazwaMiasta` (dane `nazwyKlastra` w civs.json kompletne — 10 nazw × 9 typów).

**Fix:** `main.ts` (filtr kontaktu) · `cluster-spawn.ts` (etykieta = nazwa miasta)

**Testy:** cluster-start 35/35 · diplomacy 135/135 · smoke OK · backup `main.ts.bak-SILNIK-20260627-diplo-fog`

---

### [2026-06-27] FIX — crash po badaniach / drzewko nauki (Maciej playtest)

**Objaw:** gra „wywala się” po ukończeniu badań (koniec tury lub otwarcie drzewka Nauka).

**Przyczyna:** drzewko (`sciencePicker`) używa **slugów** węzłów (`kolo`), silnik — **nazw** z `tech.json` (`Koło`). Po zbadaniu tech lub kliknięciu celu — niespójne ID, błędny render (potencjalny crash przy awansie epoki).

**Fix:**
- `sciencePicker.ts`: `techToSlug` / `techNameFromSlug`, guard `Math.max` na pustych tablicach, try/catch renderu, `refreshSciencePickerIfOpen`
- `main.ts`: konwersja slug↔nazwa w hookach pickera, odświeżenie drzewka po `researchStep`, `console.warn` zamiast `error` w catch nauki (nie triggeruje czerwonego BOOT ERROR)
- `playerState.ts`: `playerResearchTargetId` w interfejsie
- `executeFirstBlockingEvent`: obsługa `prod-empty-*` (WYKONAJ → panel miasta)

**Testy:** logic 203/203 · diplomacy 135/135 · smoke OK

**Publish:** `Gra-podglad-ROBOCZA.html` md5 `f08545ccc2d92f67df8567b2663772b6`

**Backup:** `main.ts.bak-SILNIK-20260627-nauka-fix`

---

### [2026-06-27] FIX — dyplomacja AI2/3/4 `filter` na undefined (Maciej playtest)

**Objaw:** czerwony pasek `[Dyplomacja] Błąd dyplomacji AI2…4: Cannot read properties of undefined (reading 'filter')` po zakończeniu tury (rywale klastrowi = warstwa `simplified`).

**Przyczyna:** `filterDiplomacyCommandsForLayer` wołało `.filter()` gdy lista komend AI była `undefined`.

**Fix:** guard w `diplomacy-layers.ts`, `decideAIDiplomacy`, `main.ts`, `tickDiplomacy` (traktaty).

**Testy:** diplomacy 135/135 · ai 198/198 · smoke OK

**Publish:** `Gra-podglad-ROBOCZA.html` md5 `729f4ebc…`

---

> **KANON ZAMKNIĘTY:** OBL-MAP-01 · md5 `bf99e18b9f164dd1a734bbb5114755f1` · Maciej PLAYTEST OK (2026-06-27)

**Grupa F:** kolejka **PUSTA** — czeka dyspozycję Mastera (`OD-MASTERA.md` § F).

**Następne batchy (kolejność Mastera):**
1. **A-START** (Grupa A) — onboarding, kamera, fog rzeki, minimapa
2. **E-START-UX** (E + F) — `mainMenu.ts` sync 5=C · jeden start bez mockup HTML
3. **D-CELTOWIE** (Grupa D) — civ-bonusy FAIL
4. **E1-UX-01** (Grupa E) — nawigacja kreatora

---

### [2026-06-27] → MASTER: GOTOWE-ROBOCZA (OBL-MAP-01 oblężenie) — **ZAMKNIĘTE**

**Od:** Grupa F · **Maciej:** przekaż Masterowi do przetestowania

```
→ MASTER: GOTOWE-ROBOCZA
Plik: Gra-podglad-ROBOCZA.html (md5: bf99e18b9f164dd1a734bbb5114755f1)
PLAYTEST-WALKA: md5 bf99e18b9f164dd1a734bbb5114755f1
```

**Batch OBL-MAP-01:** oblężenie w głównej grze (modal C3-Q1=A, panel, markery, AI auto-siege, kapitulacja+capture, save/load)

**Testy F:** map-siege 6/6 · oblezenie 27/27 · smoke · battle-smoke OK · bramka ZIELONA

**Checklist Mastera:** `dyspozycje/_handoff/GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md` §5

**Maciej już potwierdził:** bitwa OK · **oblężenie + pełna gra OK** (2026-06-27)

**→ MASTER:** ~~test checklist §5 → Opus → kanon~~ **DONE** — kanon `bf99e18b` · **F czeka na nową dyspozycję**

---

> **OBL-MAP-01 kod:** handoff `GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md`

### [2026-06-27] → MASTER: PLAYTEST OK — bitwa (Maciej)

**Od:** Grupa F (przekaz od Macieja)  
**Plik:** `Gra-podglad-PLAYTEST-WALKA.html` · md5 `cd4677e6b32d08ebdbbc6218db369618`  
**ROBOCZA:** ten sam md5  
**Maciej:** **playtest OK — wszystko działa jeżeli chodzi o bitwę** (1v1 preBattle → bitwa 3D, preset PT-C3-01, panel oblężenia po fix `siegeMapPanel`)

**Pakiet:** C1/C2 flow · PT-C3-01 (Lucznik przy Atenach) · fix boot `ctx` w panelu oblężenia · + pakiet główny ROBOCZA (A-FOG, roster, Grupa B)

**→ MASTER:** Opus review ROBOCZA `cd4677e6…` → publish `Gra-podglad.html` · F czeka na dyspozycję

---

> **FIX boot PLAYTEST-WALKA:** `siegeMapPanel.ts` · md5 `cd4677e6…`

### [2026-06-27] FIX — BOOT ERROR `ctx is not defined` (PLAYTEST-WALKA)

**Przyczyna:** `siegeMapPanel.ts` linia 53 — `render()` używał `ctx` zamiast `activeCtx`  
**Trigger:** auto-oblężenie Rzymu przy starcie playtestu (`detectAutoSiegeOnCity` → `showSiegeMapPanel`)  
**Fix:** destructuring `oblegajacyOwnerId` z `activeCtx`  
**Publish:** ROBOCZA + PLAYTEST-WALKA · md5 `cd4677e6b32d08ebdbbc6218db369618`

**→ Maciej:** odśwież `Gra-podglad-PLAYTEST-WALKA.html` (Ctrl+F5)

---

> **PT-C3-01 WPIĘTE:** Lucznik przy Atenach · poprzedni md5 `11768830…` zastąpiony ↑

### [2026-06-27 ~22:47] → MASTER: GOTOWE-ROBOCZA (PT-C3-01)

**Od:** Grupa F (dyspozycja Master `OD-MASTERA` § F)  
**Zadanie:** PT-C3-01 — 2. jednostka gracza obok miasta AI w presetcie playtestu  
**Plik:** `gra/src/game/playtestWalkaMapy.ts` — +1 Lucznik na heksie sąsiadującym z Atenami  
**Hint:** zaktualizowany (scenariusz A Hastati 1v1 · B Lucznik → oblężenie)

**Publish:**
- `Gra-podglad-ROBOCZA.html` · md5 `117688301ae3079c5ed08b4b72e58c24`
- `Gra-podglad-PLAYTEST-WALKA.html` · md5 `117688301ae3079c5ed08b4b72e58c24`

**Bramka:** typecheck OK · wire · logic · combat · diplomacy · ai · smoke · battle-smoke OK

**→ MASTER:** Maciej — retest PLAYTEST-WALKA (Lucznik przy Atenach) · **nie blokuje** Opus/kanon `6aedd5ce…`

---

> **PLAYTEST Maciej PASS (2026-06-27):** ROBOCZA `6aedd5ce…` — **→ MASTER: eskalacja Opus → kanon**  
> **Poll 22:45:** PT-C3-01 od Mastera — wykonane ↑

### [2026-06-27] → MASTER: PLAYTEST OK (Maciej)

**Od:** Grupa F (przekaz od Macieja)  
**Plik:** `Gra-podglad-ROBOCZA.html` · **md5:** `6aedd5ce5bd4f5fc1cb0f5577d2385bc`  
**PLAYTEST:** `Gra-podglad-PLAYTEST-WALKA.html` · **md5:** `6aedd5ce5bd4f5fc1cb0f5577d2385bc`  
**Maciej:** **playtest OK** — z jego strony wszystko działa (pakiet: A-FOG-Q1B + E1-roster + Grupa B batch 2–7)

**Batch w ROBOCZA:**
- A-FOG-Q1B — mgła per typ jednostki
- E1-roster — unikalne cywilizacje AI
- F-B5 empire-food · F-B power · F-B4 kultura/religia panel · F-B1 okolica · F-B-city-sight · C1 flaga

**Bramka (ostatnia):** grupa-b 12/12 · logic 195/195 · society 18/18 · okolica 18/18 · smoke OK · battle-smoke OK · civ-bonusy 26/4 FAIL (lane D, baseline)

**→ MASTER:**
1. **Opus review** ROBOCZA `6aedd5ce…` (Ask, świeży agent)
2. Po APPROVE → publish `Gra-podglad.html` + md5 checkpoint
3. Kolejność lane po kanonie: C3 (A) · E1-UX kreator (UI) · B2-Q5 hex (MAPA) · F-P1-03 Excel sync

**F:** czeka na dyspozycję / nowy handoff — **nie promuje kanonu**

---

> **WPIĘTE (2026-06-27 ~21:40):** Grupa B batch 2–7 — patrz GOTOWE-ROBOCZA poniżej  
> **Poll 21:47:** bramka testów **ZIELONA** (grupa-b 12/12, logic 195/195)

### [2026-06-27 ~21:47] F — bramka testów (housekeeping, bez zmiany ROBOCZA)

**Od:** Grupa F (poll + fix testów lane)  
**ROBOCZA md5:** bez zmian `6aedd5ce5bd4f5fc1cb0f5577d2385bc`  
**Fix:** `grupa-b-lane-test.cjs` (camping + UpkeepParams) · `logic-test.cjs` (cityfix pop1→radius 5) · poll script +4 wpiecia  
**→ MASTER:** kolejka kodowa F **PUSTA** — czeka playtest + Opus

---

### [2026-06-27 ~21:40] → MASTER: GOTOWE-ROBOCZA (Grupa B batch 2–7)

**Od:** Grupa F (autonomiczna sesja)  
**Plik:** `Gra-podglad-ROBOCZA.html` · **md5:** `6aedd5ce5bd4f5fc1cb0f5577d2385bc`  
**PLAYTEST:** `Gra-podglad-PLAYTEST-WALKA.html` · **md5:** `6aedd5ce5bd4f5fc1cb0f5577d2385bc`  
**Backup:** `main.ts.bak-SILNIK-20260627-GRUPA-B-batch2-7`

**Testy:** grupa-b-lane 11/12 (1 FAIL test harness `isCamping`) · society 18/18 · okolica 18/18 · logic 194/195 (cityfix #195 znany) · smoke OK · battle-smoke OK

**Batch wpięte:**
- **F-B5-empire-food** — `advanceEmpireFood` po `advanceCityEconomy`; UI hooks suwak zapasów
- **F-B-power** — `buildPowerSnapshots` + `computePowerContributionsCityEconomy` → dyplomacja Respekt
- **F-B4-kultura-religia** — `getCultureState` + `getReligionState` w panelu miasta
- **F-B1-okolica-ui** — auto-manage, profile okolicy, ręczna korekta tile
- **F-B-city-sight** — `citySightRadius` w `currentVisible()` (miasto pop 1 → 5 hex)
- **C1** — flaga WPIĘTE (multi-unit, defaultAction, onCancel — wcześniejszy kod)

**Handoffy zamknięte:** `EKONOMIA+UI-do-SILNIK_GRUPA-B-batch-2026-06-27.md`, `EKONOMIA-do-SILNIK_city-sight-zasieg-batch.md`, `C1-do-SILNIK_batch-test.md`

**→ MASTER:** playtest Maciej (panel B: zapasy państwa, kultura/religia, okolica, zasięg mgły miasta) · Opus review → kanon

---

> **WPIĘTE (2026-06-27 ~21:10):** A-FOG-Q1B + E1 roster — patrz GOTOWE-ROBOCZA poniżej

### [2026-06-27 ~21:10] → MASTER: GOTOWE-ROBOCZA (A-FOG-Q1B + E1-roster)

**Od:** Grupa F (poll + wpięcie backlogu)  
**Plik:** `Gra-podglad-ROBOCZA.html` · **md5:** `eada39d752b561d7779ae8813b03e85d`  
**PLAYTEST:** `Gra-podglad-PLAYTEST-WALKA.html` · **md5:** `eada39d752b561d7779ae8813b03e85d`  
**Backup:** `main.ts.bak-SILNIK-20260627-A-FOG-roster`

**Testy:** civ-roster 11/11 · logic 195/195 · smoke OK · battle-smoke OK (WARN auto)

**Batch wpięte:**
- **A-FOG-Q1B** — `buildUnitSightResolver(data.units, DEFAULT_SIGHT)`; `currentVisible()` → `computeVisible(sources, map, unitSight)`; miasto tymczasowo DEFAULT_SIGHT=3
- **E1-roster (E1-D-Q1=A)** — `fillAiOwnerCivMap` → `assignAiCivTypes` + `civIdsFromRoster` + `aktywneTypyFromMapLabel`; seed `_gameSeed` sync z mapą; przelicz przy `applyMenuParams` i `doStartGame`

**Handoffy zamknięte:** `MAPA-do-SILNIK_fog-widok-pola-A-FOG-Q1B.md`, `CYWILIZACJE-do-SILNIK_E1-roster-startowy.md`

**→ MASTER:** playtest Maciej (zasięg mgły per typ jednostki + unikalne cywilizacje AI) · Opus review ROBOCZA → kanon · **F czeka:** Grupa B batch 2–5 (`EKONOMIA+UI-do-SILNIK_GRUPA-B-batch-2026-06-27.md`) · P1 C3 (Grupa A, zablokowane)

---

> **NOWE od Grupy A:** mgła per jednostka (A-FOG-Q1=B) — **WPIĘTE** ↑

### [2026-06-27] Grupa A → SILNIK: A-FOG-Q1=B ~~(PRIORYTET po F mgła)~~ WPIĘTE

**Handoff:** `_handoff/MAPA-do-SILNIK_fog-widok-pola-A-FOG-Q1B.md` — **WPIĘTE 2026-06-27**  
**Dok:** `docs/grupa-a/A-FOG-Q1-widok-jednostki.md`  
**Decyzja:** Widok = Ruch (50 typów); Zwiadowca = 5; miasto = DEFAULT_SIGHT 3 (Grupa B później)

**DoD SILNIK:**
- [x] `currentVisible()` → `computeVisible(sources, map, unitSight)`
- [ ] Playtest: piechota 2 / zwiadowca 5 / konnica 4 / katapulta 1 hex — **Maciej**
- [x] logic + smoke + battle-smoke

---

> **NOWE od F (Maciej ✓ mockupy):** weryfikacja flow UI + batch mgła/ghost — handoffy poniżej · Opus → kanon

### [2026-06-27] F → SILNIK: weryfikacja (PRIORYTET)

**Handoffy:**
1. `_handoff/F-do-SILNIK_ui-flow-kanon.md` — MENU → kreator → ROBOCZA, redirecty starych HUD
2. `_handoff/F-do-SILNIK_mgla-ghost-start-batch.md` — mgła, ghost miasta, autostart kreatora

**ROBOCZA md5:** `8839726AE1AA0CF0329E1DBA07BAD745`  
**Playtest Maciej:** kreator + mockupy **PASS** wizualnie · silnik czeka re-test po fix crash (rzymianie)

**DoD SILNIK:**
- [ ] Playtest: `UI/Gra-podglad-MENU.html` → kreator → ROBOCZA (brak czerwonego overlay)
- [ ] Stare URL → ROBOCZA
- [ ] Bramka testów + Opus APPROVE → `Gra-podglad.html`

---

### [2026-06-27] → MASTER: GOTOWE-ROBOCZA (P1 batch)

**Od:** Grupa F (autonomiczna sesja — wpięcie backlogu lane)  
**Plik:** `Gra-podglad-ROBOCZA.html` · **md5:** `365ba2835e1dc6391124458763dfc9c7`  
**PLAYTEST:** `Gra-podglad-PLAYTEST-WALKA.html` · **md5:** `365ba2835e1dc6391124458763dfc9c7`  
**Backup:** `main.ts.bak-SILNIK-20260627-P1-batch`

**Testy:** wire 29/29 · logic 195/195 · combat 6/6 · society-breakdown 18/18 · diplomacy 133/133 · ai 188/188 · smoke OK · battle-smoke OK (WARN auto) · civ-bonusy **26 PASS / 4 FAIL** (lane D baseline)

**Batch P1 wpięte:**
- **F-B2-society-pct** — `evaluateOrderFromBreakdown`, grace B2-Q12, `revolt-warn-*`, rebelia, garnizon
- **F-E1 tech epok (ABC 2=B\*)** — `grantTechEpokWczesniejszych` w `doStartGame` + era `zelazo`=3
- **F-PROD-SPAWN** — ukończona jednostka z kolejki → `units.push()` na heksie miasta

**Handoffy zamknięte:** `EKONOMIA+UI-do-SILNIK_B2-society-pct-batch.md`, `GRUPA-E-do-MASTER_start-epoka-tech-B-star.md`

**→ MASTER:** playtest Maciej · Opus review ROBOCZA → kanon · **F czeka dyspozycji P1-01 (C3 — Grupa A)**

---

### [2026-06-27] → MASTER: GOTOWE-ROBOCZA (P0)

**Od:** Grupa F (kolejka P0)  
**Plik:** `Gra-podglad-ROBOCZA.html` · **md5:** `33315eaac8694055d77c88ea2041b7ce`  
**PLAYTEST:** `Gra-podglad-PLAYTEST-WALKA.html` · **md5:** `33315eaac8694055d77c88ea2041b7ce`  
**Backup:** `main.ts.bak-SILNIK-kreator-bridge-20260627`

**Testy:** wire 29/29 · logic 195/195 · combat 6/6 · diplomacy 133/133 · ai 188/188 · smoke OK · battle-smoke OK · civ-bonusy **26 PASS / 4 FAIL** (znany baseline CYWILIZACJE)

**Batch P0 + E12=A:**
- F-P0-01…03: bramka + publish ROBOCZA + PLAYTEST
- Fix boot: `playerStartHex` przed użyciem (TDZ → crash smoke)
- Fix `diplomacy.ts`: `humanPlayer` → `otherPlayer` (133/133)
- **Kreator UI → silnik:** `Makieta-flow-nowa-gra.html` → `ROBOCZA?from=kreator` + `tryAutostartFromMockFlow()` w `main.ts`
- Mapa po starcie: `seedStartingExplored()` (cały świat przygaszony, nie „dwa kwadraty” mockupu D1B)

**→ MASTER:** playtest Maciej (checklista A-START) · Opus review ROBOCZA → promocja kanon · **F czeka dyspozycji P1**

---

## [2026-06-27] TESTY-GR-D — wykonane (Master ← Grupa D, 7B)

**Od:** Grupa F (dyspozycja `OD-MASTERA` § F + handoff `CYWILIZACJE-do-MASTER_testy-grupa-d-bramka.md`)

| Suite | Wynik |
|-------|-------|
| `diplomacy-test.cjs` | **133/133 PASS** |
| `ai-test.cjs` | **188/188 PASS** |
| `research-test.cjs` | **33/33 PASS** (opcjonalny) |
| `civ-bonusy-test.cjs` | **26 PASS, 4 FAIL** |

**FAIL civ-bonusy (lane CYWILIZACJE/EKONOMIA, nie main.ts):**
1. Grecy `handelBrutto` w `cityYieldPerTurn` — test podaje `handel:10` bez `terenBazowy`; `tileYield()` czyta teren → 0
2. Grecy porównanie `pieniadz` (kaskada z #1)
3. Celtowie szarza R1 `atk +25%` — `civCombatStatMultipliers` zwraca 0
4. Celtowie szarza `uderzenie +15%` — zwraca 0.4 zamiast 0.15

**→ MASTER:** `TESTY-GR-D: CZĘŚCIOWE` (3/4 suite ZIELONE) · eskalacja **CYWILIZACJE** na 4 FAIL bonusów · Opus ROBOCZA nadal czeka

---

## [2026-06-27] F-BRAMKA — GOTOWE-ROBOCZA

**Od:** Grupa F  
**Plik:** `Gra-podglad-ROBOCZA.html`  
**md5:** `d11f2479ac20158d38d3ba6e2ac3f253`  
**Backup ostatni batch:** `main.ts.bak-SILNIK-20260627-F-HUD-2`

**→ MASTER:** Opus review ROBOCZA → promocja `Gra-podglad.html` · **F czeka**

---

## [2026-06-27] F-B2-Q5 + A1-Q5 wywiad — GOTOWE (kod)

**Od:** Grupa F  
- B2-Q5=C: `getRevolt` callback + overlay 🔥 (`cities.ts`)  
- A1-Q5: `getKnownWarsBetweenOthers` w dyplomacji  
- F-C2: potwierdzone w kodzie (bez nowego diffu)

**→ MASTER:** kolejka F **pusta** poza bramką · czekam dyspozycji Mastera

---

**Od:** Grupa F  
**Handoff:** `UI-MAPA-do-SILNIK_D1B-A4-batch.md`  
**Backup:** `gra/src/main.ts.bak-SILNIK-20260627-F-HUD-2`

- `mapToolbar`: miasta, nauka, dyplomacja, 🔨 budowa
- `bottomBarHud`: WYKONAJ + brama końca tury (`blocking` na buncie)
- `unitPanelHud`: karta jednostki [H] przy zaznaczeniu
- `buildModeHud` + `improvement-build`: placement z mapy, koszt Pracy
- ESC wyjście z trybu budowy

**CZEKA:** MAPA `getRevolt` (🔥 hex), bramka ROBOCZA  
**→ MASTER:** kod GOTOWY; bramka lokalnie

---

## [2026-06-27] F-HUD część 2 — kulturaRate + getEvents bunt

**Od:** Grupa F  
**Pliki:** `main.ts`, `hud.ts` (kulturaRate A1-Q11; getEvents B2-Q5 część SILNIK)

- `HudState.kulturaRate` + render +X/t na pasku
- `collectTurnEvents()` — chip `Bunt: [miasto]` gdy `cityOrderState.bunt`
- Czyszczenie `bunt` na początku KeyN (koniec tury)
- **CZEKA:** MAPA `getRevolt` (ikona hex), Grupa A A1-Q9/A2-Q4

**→ MASTER:** wchodzi w następną bramkę razem z dotychczasowym kodem

---

## [2026-06-27] F-B2-porzadek — kary + migracja buntu

**Od:** Grupa F  
**Backup:** `gra/src/main.ts.bak-SILNIK-20260627-B2-porzadek`  
**Handoff:** `EKONOMIA+UI-do-SILNIK_B2-porzadek-komplet.md`

- `orderMultMap`, `orderValueMap`; `advanceCityEconomy(..., orderMultMap)`
- Bunt: migracja −1/+1 (`pickRevoltMigrationTarget`) zamiast vanish pop
- `porzadek: ord.order`; `orderEffectsToYieldMults` na następną turę
- Produkcja: `praca = pracaRaw` (bez podwójnego `productionMult`)
- Reset map przy `doStartGame`

**Bramka:** BLOK (brak Node w shellu agenta)  
**→ MASTER:** kod GOTOWY; bramka → ROBOCZA → Opus

---

## [2026-06-27] F-C1 + F-HUD — dokończenie C1 + wpięcie hud.ts

**Od:** Grupa F (sesja autonomiczna)  
**Backup:** `gra/src/main.ts.bak-SILNIK-20260627-F-C1-HUD`

**F-C1 (handoff `C1-do-SILNIK_batch-test.md`, decyzje zamknięte):**
- `{ defaultAction: 'manual' }` w `showPreBattle` (mapa + test T)
- **Q4/D8=A:** `collectBattleRoster()` — heks kotwicy + własne jednostki w promieniu 1; multi-unit do `BattleScene` i auto-resolve (lead units)
- **Q5:** `onCancel` → tylko `hidePreBattle()` (zachowany ruch/zasięg)
- Po bitwie TW: `applyMapBattleOutcome(..., res.survivors)` sync roster

**F-HUD (ABC1=A, handoffy UI D1B/A1-Q5/A1-Q6):**
- `showHud` / `refreshD1bHud` z `./ui/hud`; stary `#hud` + `#nauka-btn` + `#diplo-btn` ukryte
- `getMinimapData` z `./map/minimap` + `cameraGroundTarget()`
- `getWarsWithPlayer` z `diplomacyRelations`
- `onEndTurn` → syntetyczny KeyN; `onOpenScience` / `onOpenDiplomacy` podpięte

**Bramka:** **BLOK** — brak `npm`/`node` w PATH agenta Cursor (skrypt `bramka-test-publish.ps1` naprawiony: encoding linii 35–36)

**→ MASTER:** kod GOTOWY; uruchom bramkę lokalnie → `Gra-podglad-ROBOCZA.html` → Opus → kanon

**Wycofanie:** `Copy-Item gra/src/main.ts.bak-SILNIK-20260627-F-C1-HUD gra/src/main.ts -Force`

---

**Od:** Grupa C  
**Handoff:** `dyspozycje/_handoff/C1-do-SILNIK_batch-test.md`  
**Decyzje C1-Q1…Q5:** zamknięte w `C1-wejscie-walke.md`

**→ MASTER:** po bramce PASS — `GOTOWE-ROBOCZA`

---

## [2026-06-27] F-B2+C1 — społeczeństwo + preBattle wpiecie

**Zrobione (kod, tylko `gra/src/main.ts`):**
- Backup: `gra/src/main.ts.bak-SILNIK-20260627-F-B2-C1`
- **F-B2:** `cityOrderState: Map<string, OrderState>`; tick co turę; `getOrderState` + `getCityHealth` w `configureCityPanel`
- **F-C1:** `doQuickSave()`; `onSave` w obu `showPreBattle`; mapa → `BattleScene({ deploy: true })`; test T też deploy
- `PreBattleInfo`: `miejsce`, `lokacja`, `tura`, `canRetreat`

**Bramka:** BLOK (brak node w shellu agenta)  
**→ MASTER:** kod GOTOWY-TEST; bramka lokalnie Maciej

**Wycofanie:** `Copy-Item gra/src/main.ts.bak-SILNIK-20260627-F-B2-C1 gra/src/main.ts -Force`

---

## [2026-06-27] F-A2 — generujSwiat w doStartGame

Backup: `main.ts.bak-SILNIK-20260627-generujSwiat`  
Szczegóły: `docs/czaty/DO-MASTERA.md` § Grupa F F-A2

---

*Uwaga: starsze wpisy sprzed 2026-06-27 mogły być w poprzedniej wersji pliku — patrz `DZIENNIK-MASTERA.md` i `DO-MASTERA.md` § F.*

---

## [2026-06-27] F — mgła start + ghost miasta + kreator + ROBOCZA

**Playtest Maciej:** mockupy utracone → praca na ROBOCZA.

**ZROBIONE (F / main.ts + UI flow):**
1. **Mgła wojny przy starcie** — usunięto `seedStartingExplored()` (cała mapa jako explored). Teraz `seedStartingFog()`: `fogOn=true`, `explored` puste → ciemna mapa + jasny zasięg wokół startu. Minimapa odświeżana w `refreshFog()` → `refreshD1bHud()`.
2. **Ghost „Załóż miasto”** — półprzezroczysty model miasta + chip 🏛 przy kursorze (jak ulepszenia w mainview).
3. **Kreator** `Makieta-flow-nowa-gra.html` — ikony w ustawieniach, fazy generowania, mini-siatka hex + mgła (wizualnie).

**Build ROBOCZA:** md5 `824D2591AF6BFD4A9C12429C300696FF` · smoke OK

**MAPA (nadal CZEKA):** rzeki przez mgłę — `_handoff/F-do-MAPA_fog-rzeki.md`

**Test:** MENU → kreator → ROBOCZA → mgła na mapie i minimapie · 🔨 → Załóż miasto → ghost za kursorem.

**→ SILNIK: GOTOWE** — handoff `_handoff/F-do-SILNIK_mgla-ghost-start-batch.md` (bramka + Opus → `Gra-podglad.html`).

**Hotfix 2026-06-27 (playtest FAIL — czerwony overlay):**
- **Crash:** `TypeError: p[e] is not a function` — ghost miasta wołał `buildBronzeCity('rzymianie')` bez mapowania → `ikonaIdToBronzeCiv()` w `bronzeCity.ts` + fix w `main.ts`
- **Mgła:** pierścień **explored** r=14 wokół startu (przygaszony kontynent); unknown = sylwetka terenu (×0.14), nie czarna dziura
- **ROBOCZA md5:** `8839726AE1AA0CF0329E1DBA07BAD745` · smoke OK

---

## [2026-06-27] F → SILNIK: flow UI + mockupy (Maciej ✓)

**Handoff:** `_handoff/F-do-SILNIK_ui-flow-kanon.md`  
**Flow:** MENU → kreator → ROBOCZA · stare HUD = redirect  
**→ SILNIK:** weryfikacja + bramka + Opus → `Gra-podglad.html`

---

## [2026-06-27] Civ-SILNIK — weryfikacja handoff F (ui-flow + mgla/ghost)

**Status:** **VERIFIED** (bramka techniczna ROBOCZA; kanon **nie** publikowany)

| Check | Wynik |
|-------|--------|
| Gra-podglad-ROBOCZA.html md5 | **8839726AE1AA0CF0329E1DBA07BAD745** — zgodne z handoff |
| node tools/smoke.cjs | **SMOKE OK** (canvas 2, rAF 1) |
| node tools/battle-smoke.cjs | **BATTLE SMOKE OK** (WARN: brak przycisku auto-rozstrzygnij w Phase C — znany) |
| UI/Gra-podglad-HUD.html | redirect → ../Gra-podglad-ROBOCZA.html |
| UI/Makieta-HUD-mapa-swiata.html | redirect → ../Gra-podglad-ROBOCZA.html |
| UI/Makieta-HUD-D1B-preview.html | redirect → ../Gra-podglad-ROBOCZA.html |
| Gra-podglad.html (kanon) | **bez zmian** (tylko weryfikacja ROBOCZA) |

**Handoffy:** F-do-SILNIK_ui-flow-kanon.md, F-do-SILNIK_mgla-ghost-start-batch.md

**→ MASTER:** Opus 4.8 (Ask, adversarial) na build ROBOCZA md5 powyżej → po APPROVE kopia do Gra-podglad.html + playtest Maciej (MENU → kreator → ROBOCZA, brak czerwonego overlay).

**Otwarte (nie blokuje):** mgła/rzeki — F-do-MAPA_fog-rzeki.md.

---

## [2026-06-27] HUD D1B pełny — A1-Q15/Q16/Q17/Q18 (Maciej PILNE)

**Status:** **GOTOWE** · kanon md5 `CA1055C658FC0754E4CF49BD9D29C368`  
**Testy:** smoke OK · logic 203/203

| Decyzja | Wdrożenie |
|---------|-----------|
| A1-Q15 Power | Środek paska + klik → overlay 6 składników + ranking + Respekt |
| A1-Q16 kultura/religia | Overlay imperium (toolbar 🎭/⛪) |
| A1-Q17 żywność | Ikona 🍞 z „—" (placeholder B5) |
| A1-Q18 dyplomacja | Inbox blocking + modal Akceptuj/Odrzuć |
| A1-revA pasek | 6 zasobów + Power + Epoka/Osiedla/chipy + Menu |

**Pliki:** `hud.ts`, `powerOverlayHud.ts`, `empireOverlayHud.ts`, `diplomacyPendingHud.ts`, `main.ts`

---

**Status:** **GOTOWE** · kanon roboczy md5 `372238D073B803F77E85887417626498`  
**Testy:** oblezenie 27/27 · map-siege 6/6 · logic 203/203 · smoke OK  
**Pliki:** `main.ts`, `siegeMapPanel.ts` (import besieger count)

| ID | Co wdrożone |
|----|-------------|
| OBL-S3 | `setSiegePanelBesiegerCount` + sync przy show/update panelu |
| OBL-S4 | `collectSiegeDefRoster` → milicja 20% (`makeMilitia`) gdy brak garnizonu |
| HUD-S1 | `prod-empty-{cityId}` blocking w `collectTurnEvents` + klik → `showCityPanel` |

**→ MASTER:** Opus review przed oficjalnym kanonem · następny batch **OBL-S5**  
**Delegacja lane:** DST-S2→MAPA · DST-S3/S4/OBL-S7→CYW · HUD-S2…S6→UI

---

## [2026-06-27] SIL-INT batch — OBL-S5 + OBL-S7 + handoffy lane (MASTER wpiął)

**Status:** **WPIĘTE** · ROBOCZA md5 `b1eb8091fc43127833aeebdf0b7b0e5a`

| ID | Co |
|----|-----|
| SIL-INT-1 | Pełny klaster obcych (`spawnCities`) |
| SIL-INT-2 | `siegeAi.ts` — AI 3 poziomy, `executeSilentSiegeStorm` |
| SIL-INT-3 | OBL-S5 — `siegeMachines.ts`, panel Taran/Wieża, save/load |
| SIL-P0-05 | Dyplomacja D3-Q1 + `getPlayerEra` |

**Pliki:** `main.ts`, `siegeMachines.ts`, `siegeMapPanel.ts`, `cities.ts`

**Testy:** map-siege 6/6 · oblezenie 27/27 · siege-ai 17/17 · cluster 35/35 · smoke OK · vite build OK

**Handoff:** `_handoff/MASTER-do-SILNIK_SIL-INT-batch-2026-06-27.md`

**→ SILNIK:** Opus review → kanon `Gra-podglad.html` · playtest Maciej

**CZEKA lane:** MAP-P1-02 obóz 3D · UI-P1-02 · CYW-P1-03/04 · EKO-P2-01

---

## 2026-06-29 — C4-Q1=A balans macierzy — WPIĘTE (MASTER w sesji Maciej)

- **Decyzja:** C4-Q1=A · macierz v2.0 w `units.json` (9 jedn.) + `combat.ts`
- **main.ts:** `obrazeniaFromUnitDef` już obecne we wszystkich ścieżkach walki z mapy
- **Build:** `$env:TEMP\civ-dist` OK
- **Bramka:** combat 6/6 · battle-smoke OK · smoke OK · logic 203/203
- **ROBOCZA:** `Gra-podglad-ROBOCZA.html` md5 `0adf96de1a7b38d2021d0bf472e3565d`
- **→ CZEKA Opus** przed kanonem · **NIE** publikować `Gra-podglad.html` bez sign-off

