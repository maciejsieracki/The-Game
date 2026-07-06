# INTEGRATOR F (SILNIK) → MASTER — meldunki

> **Jedna rola:** Integrator F = dawny SILNIK + publikacja ROBOCZA. Append-only.

---

## [2026-07-04] **→ MASTER: GOTOWE-ROBOCZA** — sesja map-ui-units (main.ts batch)

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_sesja-2026-07-04-map-ui-units.md`  
**md5 ROBOCZA:** `53ec508f48b7a9e13e152b1ba5d44644`

**Zmiany `main.ts` (już w źródle — MASTER weryfikuje przy kanonie):**
- `cameraControllerOpts()` — `maxDist = max(320, mapSpan * 1.2)`
- UI: usunięcie legacy `#hud` pill 0/0, toast `#civ-hint-toast`, uproszczony `updateHud()`

**Backup zalecany przed kanonem:** `main.ts.bak-SESJA-2026-07-04`

**Bramka:** pełna 17 suitów przed Opus · forest-parity 101/101 · coast 115/115

---

## [2026-07-03] **→ MASTER: GOTOWE-ROBOCZA** — CUDA-G1 (wonder-availability)

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_CUDA-G1-2026-07-03.md`  
**md5 ROBOCZA:** `e8f0ac22dcf022ed3c814f2f8e9a6077` · wonder-availability 7/7 · civ-entry-epoch 11/11 · wonder-civ-tech 5/5 · bramka PASS · main.ts pre-wired (F tylko build+publish)

---

## [2026-07-01] **→ MASTER: GOTOWE-ROBOCZA** — A-P4-UI (P2)

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_A-P4-UI-2026-07-01.md`  
**md5 ROBOCZA:** `4B360364201828D2F0D5B6C3C40EE556` · world-density 28/28 · bramka PASS

---

## [2026-07-01] **→ MASTER: GOTOWE-ROBOCZA** — D-SOJUASZ-v12 (P1)

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_D-SOJUASZ-v12-2026-07-01.md`  
**md5 ROBOCZA:** `EDF380D67364F89A9617A9AFE57C003E` · diplomacy-proposal 30/30 · diplomacy 143/143 · bramka PASS

---

## [2026-07-01] **→ MASTER: GOTOWE-KANON** — C-ODSKOK-FANOUT (P0)

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_C-ODSKOK-FANOUT-2026-07-01.md`  
**md5:** `ED4C8E2B67AC86B7245B01FE9F2A20F9` · Slack outbox `docs/obieg/SLACK-OUTBOX-F-2026-07-01.md`

---

## [2026-06-30] **→ MASTER: GOTOWE-KANON** — E2-PLAYTEST-B2Q5 (obieg 2026-06-30)

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_E2-PLAYTEST-B2Q5-2026-06-30.md`  
**md5:** `AB471657E64C0D87F3BA7E3094DE0A1B` · Slack `#grupa-f` + `#master`

---

## [2026-06-26] **→ MASTER: GOTOWE-KANON — AUTO-WALKA-v2b ZAMKNIĘTE** ⭐ CZYTAJ NA START

**Plik zbiorczy:** `_handoff/→MASTER-AUTO-WALKA-v2b-ZAMKNIETE.md`

| | |
|---|---|
| **Kanon md5** | `5D965EB74068538C18C6C0916D5CBB77` |
| **Decyzja Maciej** | auto-walka M + identyczny ruch mapy auto/ręczna |
| **Lane UNITS** | **ZAMKNIĘTY** — nie delegować ponownie |
| **Kolejka F** | **PUSTA** |
| **Czeka** | playtest Maciej · balance check (później) |

**ACK Master:** 2026-06-26 · FLOW-C-fix wpięte · docs zsynchronizowane.

---

## [2026-06-26] **→ MASTER: GOTOWE-KANON** — AUTO-WALKA-v2b

**Handoff:** `UNITS-do-MASTER_auto-walka-v2b.md`

**Decyzja Maciej:** auto-walka na M + identyczny ruch mapy auto/ręczna · temat **ZAMKNIĘTY**.

**Moduły (UNITS lane):**
- `auto-battle-power.ts` · `auto-battle-params.ts` · `post-battle-map.ts`
- `gra/data/auto-battle-params.json` ← Panel-C arkusz **Auto-walka**
- `auto-battle-power-test.cjs` **10/10**

**Zmiany (`main.ts`):**
- `resolveAutoBattleByPower` zamiast `resolveCombat` 1v1 na mapie (gracz auto, szturm auto, AI, barbarzyńcy)
- `applyPostBattleMap` wspólne auto + ręczna 3D + szturm
- `applyCityCaptureAfterBattle` — wipe tylko centrum miasta
- `snapshotRosterPositions` przed walką (cofka W−)

**Bramka:** auto-battle **10/10** · combat **6/6** · smoke OK · oblezenie **27/27**

**Publish:** md5 **`A754EC9B39725EDA6CD7B4EDBABEDC16`** · `Gra-podglad.html`

**Czeka Master:**
1. ~~ACK md5~~ ✅ **ACK 2026-06-26** · md5 `5D965EB74068538C18C6C0916D5CBB77`
2. Review batch (retro ACK operacyjny)
3. ~~Decyzja: batch poprawek flow C~~ ✅ **WPIĘTE** w tym samym batchu (deploy:false, notice potyczki, hint szturmu)

**Uwaga:** wpięcie poza kolejką Integratora — retro-meldunek 2026-06-26.

---

## [2026-06-26] **→ MASTER: ACK** — FLOW-C-fix (follow-up AUTO-WALKA-v2b)

**Zmiany (`main.ts`):**
- `deploy: false` — atak gracza + szturm (C1-Q3 rewizja; demo T zostaje `deploy: true`)
- `applyMapBattleOutcome` — notice + `refreshMapAfterCityCapture` po zdobyciu z **potyczki polowej**
- `doSiegeAutoResolve` — usunięty duplikat hintu (zostaje `finishSiegeStormBattle`)

**Backup:** `main.ts.bak-INTEGRATOR-FLOW-C-2026-06-26`

**Publish:** md5 **`5D965EB74068538C18C6C0916D5CBB77`**

---


## [2026-06-30] **→ MASTER: GOTOWE-KANON** — MILITARY-RATIO-M-v1

**Handoff:** `INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md` § P1

**Zmiany (`main.ts`):**
- `militaryRatioFromArmyM(proposerM, responderM)` — helper
- `buildProposalEvalContext` — `militaryRatio` z `sumArmyMForOwner` (nie headcount)
- Pętla AI dyplomacji — `militaryRatio` AI/gracz z sumy M

**Backup:** `main.ts.bak-INTEGRATOR-MILITARY-RATIO-M-2026-06-30` · `Gra-podglad.html.bak-MILITARY-RATIO-M-2026-06-30`

**Bramka:** diplomacy **140/140** · ai-test **198/198**

**Publish:** md5 **`2FC4DCA9E55E5FF9515A67233372EC3D`** · `Gra-podglad.html`

---

## [2026-06-30] **→ MASTER: GOTOWE-KANON** — TW-v3-BALANS + UNIT-POWER-M-v1

**Handoffy:** `UNITS-do-INTEGRATOR_balans-tw-v3-2026-06-30.md` · `UNITS-do-SILNIK_unit-power-moc.md`

**Batch 1 — balans JSON (bez main.ts):**
- `units.json` 186 pól combat EN · marker `_tw_v3_balans: 2026-06-30`
- Maciej: strojenie parametrów **ZAMKNIĘTE**

**Batch 2 — M→Power (`main.ts`):**
- import `armyFieldPower` z `./game/unit-power`
- `sumArmyMForOwner(ownerId)` — suma M_pole (oblężnicze → 0, osadnik wg opcji)
- `buildObjectivePowerForOwner` → `jednostki: sumArmyMForOwner(ownerId)` zamiast headcount

**Backup:** `main.ts.bak-INTEGRATOR-UNIT-POWER-M-BALANS-2026-06-30` · `Gra-podglad.html.bak-BALANS-2026-06-30`

**Bramka:** unit-power **6/6** · combat **6/6** · smoke OK · power-objective **9/9**

**Publish:** md5 **`3DAE1AA5C463CFD9E90F77C5D2DCFC76`** · `Gra-podglad.html`

**Uwaga dla Macieja:** Power armii rośnie (np. 10× Hastati ≈ 500×pkt zamiast 10×pkt) — strojenie współczynnika w **Panel-B**, nie w `units.json`.

---

## [2026-06-30] **→ MASTER: GOTOWE-WPIĘCIE F-TW-v3-super** — resztki PL→EN w main.ts

**Handoff:** `UNITS-do-SILNIK_EKSPORT-TW-v3-super-2026-06-30.md` · batch **TW-v3-super**

**Zmiany (`main.ts` only):**
- `runtimeUnitToSiegeUnit` — EN źródło (chargeBonus/armor/piercing, bez PL fallback)
- `militiaDefRecord` — TW v3 EN (`meleeAttack`, `meleeDefence`, `health`, `weaponDamage`…)
- auto-walka / szturm / barbarzyńcy — `unitDefFor()` zamiast `lookupUnitDef()` (milicja + override)

**NIE ruszano:** `units.json` · `battleScene.ts` 3D

**Backup:** `main.ts.bak-INTEGRATOR-TW-v3-super-2026-06-30`

**Bramka:** combat **6/6** · smoke **OK** · build `$env:TEMP\civ-dist` md5 **`4050A58D6CA3583C5253E6E870DDFA97`**

**Kanon:** **nie publikowany** (batch wpięcia only — promocja `Gra-podglad.html` = Master + Opus)

---

## [2026-06-26] **→ MASTER: GOTOWE-KANON F-PANEL-ROSTER-v1** — JSON panele + roster 15

**Handoffy:** `MAPA-do-INTEGRATOR_map-gen-params.md` · `CYWILIZACJE-do-SILNIK_roster-15-enum.md`

**Wpięcia:**
- `map-gen-params-loader.ts` + `e-start-params-loader.ts` → mgła, gęstość E2, złoża, wymiary mapy, zwycięstwo, kreator
- `export-d.py` + `import-roster-6-civs.py` → **15** cywilizacji · Sumer → `typCywilizacji: sumer`
- `TypCywilizacji` +7 · `ARCHETYPE_*` dyplomacja · `clusters.ts` roster 15 · `ai.ts` mapowanie

**Bramka:** logic **203** · diplomacy **135** · civ-bonusy **30** · civ-roster **11** · victory **12** · ai **198** · smoke OK

**Publish:** md5 **`5949422D3C7A614E9F695B07663309D9`** · `Gra-podglad.html`  
**Czeka:** Opus APPROVE/BLOCK (`docs/decyzje/OPUS-REVIEW-QUEUE.md` § F-PANEL-ROSTER-v1) · **nie** playtest Macieja (na końcu v1)

---

## [2026-06-26] **→ MASTER: GOTOWE-KANON F-MOC-P-A-v1** — Moc P-A + Panel-B

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_moc-v1-GOTOWE.md`

**Weryfikacja (już w main.ts — brak nowych diffów kodu):**
- `buildObjectivePowerForOwner` · 9 składników P-A · cache co turę
- HUD: `mocLabel()` → **Moc** (Panel-B `Potega-opcje`)
- Overlay ⚜: ranking + składniki pkt + Respekt %
- Respekt dyplomacji: `objectiveRespektPctToward` / `computeRespekt(objective…)`
- Dominacja zwycięstwa: `checkVictory` z `objectivePowerForOwner` (10=A*)
- Manpower → ekw. rekrutów w składniku Mocy
- `power-params.json` · `epoka-ludnosc-manpower.json` · `power-labels.ts`

**Bramka:** power-objective **9/9** · power-options **5/5** · manpower **22/22** · victory **12/12** · diplomacy **135/135** · logic **203/203** · combat **6/6** · smoke · battle-smoke

**Publish:** md5 **`49ab7306f9cafdfe7bbf6f01a7ede06b`** · `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html`  
**Backup:** `main.ts.bak-INTEGRATOR-moc-v1-2026-06-26`  
**Gotowe do Opus:** F-MOC-P-A-v1 + wcześniejsze batche w bundlu  
**Czeka:** playtest Maciej (checklist handoff § Playtest) · Opus ręczny

---

## [2026-07-01] **→ MASTER: GOTOWE-KANON** — P0+P1 scalenie jednego md5

**Batch (jeden build):**
1. **SILNIK-D-BONUS-C** — `getCivBonusy: civBonusyForOwnerId` ×3 (panel legacy, 🤝, audiencja) + preBattle
2. **F-POWER-MANPOWER-01** — HUD **Power** (abs.) · overlay pkt obiektywnych · **Respekt %** w panelu/🤝/audiencji
3. **SILNIK-D-V11** — activeDeals, evaluateProposal, modale/traktaty, tick trybutu, save/load, AI pending, sojusze
4. **P1-C MAPA** — `improvement-build.ts` w bundlu · map-improvement-qualify **34/34**
5. **Scalenie** — suma wcześniejszych: OBL-CAP `30DBBBAF…` + CYW/P1 `9665790E…` + A2-Q5 `27B69A47…` *(stare md5 batchy — aktualny kanon: `4602e752…`)*

**Publish:** md5 **`4602e752d7e4b21f3c2460e494e82a8f`** · `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html`  
**Bramka:** map-improvement 34 · manpower 22 · power-objective 6 · treaties 7 · proposal 15 · economy 5 · diplomacy 135 · civ-bonusy 30 · logic 203 · combat 6 · smoke · battle-smoke  
**Grupa A E2:** `worldDensity` w `doStartGame` ✅ — playtest Maciej Mało/Dużo; `map-gen-params.json` nadal P3 P0 (lane E)  
**Gotowe do Opus:** C4 + Panel-C + CYW + OBL-CAP + dyplo v1.1 + Power HUD  
**Czeka:** playtest Maciej (Power, dyplo v1.1, OBL-CAP ST-2/3) · Opus ręczny

---

## [2026-06-26] SILNIK-D-BONUS-C + SILNIK-D-V11 — dyplomacja v1.1 w main.ts

**Batch:** Integrator F · backup `main.ts.bak-SILNIK-D-BONUS-C-V11-2026-06-26`

### BONUS-C
- `getCivBonusy: civBonusyForOwnerId` w `buildDiplomacyPanelConfig`, `createDiploListHud`, `showDiplomacyAudience`

### V11
- `activeDeals[]` + `aiSkarbiecByOwner` (treasury AI dla T1A)
- `applyAudienceAction(oid, id, payload?)` → `evaluateProposal` + banner + `applyAcceptedProposal`
- `getNegotiationContext` w audiencji (wrogowie, tech, opłaty granic)
- Karty 2–9,12 odblokowane (warunki relacji zamiast „v1.1”)
- Wojna → `treatiesBrokenByWar` + `zlamana_obietnica` + `allianceObligations`
- `runDiplomacyTurnTick()` na endTurn: `expireTreaties` + `tickDiplomacyPayments`
- Save/load: `meta.diplomacyDeals`, `meta.diplomaticContactEstablished` (fix zapisu kontaktów)
- AI pending: `aiCommandToPendingProposal` + `evaluatePendingFromAI` w `resolvePendingDiplomacy`
- Fix: `potegaAI/potegaPlr` → `potAI/potPlr` w pętli AI

### Bramka
- diplomacy-treaties 7/7 · proposal 15/15 · economy 5/5 · diplomacy 135/135
- vite build OK → `$env:TEMP\civ-dist` (bez kopi do `Gra-podglad.html` — czeka Opus)

**Status:** ✅ GOTOWE-ROBOCZA · ⏸ Opus · ⏸ playtest Maciej

---

## [2026-06-26] F-POWER-MANPOWER-01 — faza 3 HUD + dyplomacja UI

- HUD środek: **Power** (abs.) z `objectivePowerByOwner`, etykieta „Power” (nie Wpływ 0–100)
- Overlay ⚜: breakdown `power-objective` components (pkt × współczynnik), ranking Power, Respekt %
- Dyplomacja: `buildPlayerDiploRelations` → Zaufanie + **Respekt %** (objective); panel + lista 🤝 + audiencja
- Testy: manpower 22/22 · power-objective 6/6 · diplomacy suite zielona
- Backup: `main.ts.bak-SILNIK-power-v2-2026-06-26`

---

### [2026-06-30] CYW → SILNIK: **SILNIK-D-BONUS-C** (Batch C bonusów — dyspozycja)

**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_bonusy-display-wire.md`  
**Zakres:** 3× `getCivBonusy: civBonusyForOwnerId` w main.ts (panel legacy, lista 🤝, audiencja). UI gotowe u lane D.  
**DoD:** bonusy widoczne w dyplomacji · pre-battle bez regresji · bramka CYW.  
**Kolejka:** `F-KOLEJKA-P0.md` § NASTĘPNY.

---

### [2026-06-30] **→ MASTER: GOTOWE-KANON** — CYW 5A + P1 Panel-C + batch zbiorczy

**Batch:**
1. **SILNIK-D-5A-1** — `resolveArchetypeAggression` + `resolveArchetypeTrade` w `DiplomacjaInputs` (~6251)
2. **E-P0-06 victory 10A** — już w main.ts · bramka `victory-test` 12/12
3. **E2-11 barbarians 11C** — już w main.ts · bramka `barbarians-test` 55/55
4. **P1-A Panel-C** — `combat-params.json` + combat/siege/siegeAi w bundlu · combat 6/6 · siege-ai 17/17
5. **P1-B typeId** — `render/units.ts` w bundlu (bez main.ts)

**Pliki:** `gra/src/main.ts` (5A) · reszta lane już w drzewie  
**Backup:** `gra/src/main.ts.bak-SILNIK-CYW-5A-P1-batch-2026-06-30`  
**Bramka:** logic 203 · combat 6 · siege-ai 17 · victory 12 · barbarians 55 · diplomacy 135 · ai 198 · oblezenie 27 · siege-defenders 11 · smoke · battle-smoke · okolica 32/32  
**Publish:** md5 **`9665790EE040660FC6615F8405D0DD0D`** *(stary — aktualny kanon: `4602e752…`)*  
**Czeka:** playtest Macieja · **Opus** (C4 + Panel-C + CYW)

---

### [2026-06-30] **→ MASTER: GOTOWE-KANON** — OBL-CAP-01 + panel miasta v2 + manpower

**Batch (4 tematy):**
1. **OBL-CAP-01** — `refreshMapAfterCityCapture`: `syncUnitsRender` + `forceVisibleUnitId` przed `refreshFog`; szturm → `applyCityCaptureToMap` + ten sam refresh
2. **Panel v2** — `mountUnitMiniPreview` (D-JEDNOSTKI B); hover budynków tylko na `thumb` (D-BUDYNKI A)
3. **Manpower** — pasek ⚔ rekruci w top bar panelu + detail card; hooki już w `configureCityPanel`
4. **Bramka + publish** — md5 poniżej

**Pliki:** `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`  
**Backup:** `gra/src/main.ts.bak-SILNIK-obl-cap-manpower-2026-06-30`  
**Bramka:** logic 203/203 · oblezenie 27 · siege-defenders 11 · smoke · battle-smoke · okolica 32/32  
**Publish:** md5 **`30DBBAF608E423E00C49E184297F65BD`** *(stary — aktualny kanon: `4602e752…`)*  
**Czeka:** playtest Macieja · Opus

---

### [2026-07-01] **→ MASTER: FIX** — OBL-CAP-01 jednostka po zdobyciu

**Przyczyna:** auto-szturm `survivors:[]` kasował atak · brak wejścia na heks miasta po wygranej ST-3  
**Fix:** `applyCityCaptureToMap`, `survivorsLiveSet`, `forceVisibleUnitId`, renderOrder 55  
**Test:** siege-defenders 11/11 · bramka OK  
**Publish:** md5 **`6449407489B4CF684B8EDDB9D30CCA0F`**

---

**Kanon:** `docs/decyzje/C3-szturm-obrona.md`  
**Moduł:** `gra/src/game/siegeDefenders.ts` · test 7/7  
**Handoff:** `MASTER-do-SILNIK_C3-reguly-szturm-obrona.md`  
**main.ts:** import `hasCityDefenders` z modułu (nie inline)

---

### [2026-06-30] **→ MASTER: GOTOWE-KANON** — C3 oblężenie + szturm (playtest Maciej ✅)

**Playtest Maciej:** pełna ścieżka z obrońcą — Oblężaj → Szturm → preBattle → bitwa ręczna z murem  
**Handoff:** `dyspozycje/_handoff/UI+UNITS+SILNIK-do-INTEGRATOR_C3-oblezenie-szturm-2026-06-30.md`  
**Backup:** `gra/src/main.ts.bak-SILNIK-oblezenie-c3-2026-06-30`  
**Fix bramki:** `battle-smoke.cjs` — etykiety preBattle (`Bitwa ręczna` / `Auto`)

**Publish:**

| Plik | md5 |
|------|-----|
| `Gra-podglad.html` | **`363DC110315AA91CFE94857D67CCAC32`** *(stary — aktualny kanon: `4602e752…`)*
| `Gra-podglad-ROBOCZA.html` | identyczny |
| `Gra-podglad-PLAYTEST-MAPA.html` | identyczny |

**Bramka:** logic 203/203 · combat 6/6 · smoke · battle-smoke · oblezenie 27/27 · map-siege · siege-ai · food-hodowla · ai · diplo — OK  
**Czeka:** Opus review

---

### [2026-06-26] **→ MASTER: SIGN-OFF Maciej** — F-FOOD-HODOWLA-01 render fix

**Playtest Maciej:** ✅ galeria + hodowla OK — wprowadzić do gry  
**Fix:** solo `bydlo`/`owce` = tylko zwierzęta · `farma+bydlo` = chaty+krowy · mgła na `improvementMeshes`  
**Publish:** md5 **`B3FCE79AF5688D6AF5DF0F8CBB7DDAC6`** (`Gra-podglad.html` = ROBOCZA)  
**Bramka:** food-hodowla 21/21 · map-improvement-qualify 34/34 · smoke · battle-smoke OK

---

### [2026-06-26] **→ MASTER: GOTOWE-ROBOCZA** — F-FOOD-HODOWLA-01

**Od:** Integrator F (Grupa F)  
**Decyzja Macieja:** wysłać do Mastera bez pełnego playtestu (2h+) — bugi poprawimy w kolejnym batchu.

**Batch:** **F-FOOD-HODOWLA-01** — hodowla + złoże + warstwy na heksie  
**Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`  
**Handoff:** `dyspozycje/_handoff/MAPA-do-INTEGRATOR_hodowla-zloze-SILNIK.md` · `MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md`

**Publish:**

| Plik | md5 |
|------|-----|
| `Gra-podglad.html` | **`C0A64D12312563D83ADB62A695A9BDA6`** *(stary — aktualny kanon: `4602e752…`)* |
| `Gra-podglad-ROBOCZA.html` | **`C0A64D12312563D83ADB62A695A9BDA6`** (identyczny) *(stary — aktualny kanon: `4602e752…`)*

**Backup:** `gra/src/main.ts.bak-SILNIK-hodowla-2026-06-26`

**Zmiany w `main.ts` (integracja):**

1. `placedImprovements: Map<string, string[]>` — warstwy gracza
2. `mergedImprovementLayers()` — merge złoże hodowl. + placed
3. `buildImprovementStack` — jeden mesh dla Farma+Bydło/Owce
4. `rebuildResourceOverlays()` — skip `ZlozeBydla/Owiec` gdy jest mesh
5. `syncLivestockAndPlacedMeshes()` — init / new game / load / save restore
6. `restorePlacedImprovementsFromSave()` — obsługa `string[]` + fallback string
7. Kwalifikacja: bydło/owce **nie** budowalne na złożu (auto-warstwa z `improvementKeysForHex`)

**Bramka (Integrator F, 2026-06-26):**

| Suite | Wynik |
|-------|--------|
| food-hodowla-test | **21/21 OK** |
| map-improvement-qualify-test | **34/34 OK** |
| logic-test | **203/203 OK** |
| smoke | **OK** |
| battle-smoke | **OK** |
| tsc --noEmit | baseline-red (minimapHud, newGameFlow, sciencePicker — pre-existing, nie ten batch) |

**AC integracji (do weryfikacji Master / playtest skrócony):**

| # | Kryterium | Status |
|---|-----------|--------|
| I1 | Złoże krowy = pastwisko wizualnie (bez duplikatu overlay + mesh) | 🟡 bramka kod + testy; playtest Maciej odłożony |
| I2 | Farma na złożu bydła → mesh Farma+Bydło, plony +5/+3 | 🟡 j.w. |
| I3 | Nie można budować bydła/owiec na złożu | ✅ qualify-test |
| I4 | Unlock imperium po farmie na złożu | ✅ food-hodowla-test |
| I5 | Save/load `placedImprovements` jako `string[]` | 🟡 kod OK; playtest odłożony |
| I6 | Inkowie ep1–2: brak bydło/owce w panelu | ✅ food-hodowla-test |
| I7 | Overlay hodowli pomijany gdy mesh | ✅ kod w main.ts |

**Podglądy offline (Master / QA):**

- `Gra-podglad-HODOWLA.html` → `?view=hodowla` (5 wariantów stack)
- `Civ-MAPA/Gra-podglad-PLACEMENT-FOOD.html` — sandbox placement

**Prośba do MASTER:**

1. Przyjąć **GOTOWE-ROBOCZA** batch F-FOOD-HODOWLA-01.
2. Skrócony playtest / Opus przed formalnym sign-off kanonu (Maciej nie robił 2h sesji).
3. **NIE** otwierać batchu **Konie** — osobny temat (MAPA + EKONOMIA).
4. Kolejka Integratora: P1 scalenie (Panel-C + UNITS + MAPA P1-04) → E2 (po MAPA).

**Nie dotknięte w tym batchu:** konie, E2 generator, Panel-C combat-params wpięcie (🟢 czeka scalenie).

---
