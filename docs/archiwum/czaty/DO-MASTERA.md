# Od czatów tematycznych → Master Silnik

> **Komenda Macieja w czacie Master Silnik:** `czaty`  
> Master **czyta ten plik** (sekcje Grup A–**F** + ostatnie wpisy) + `dyspozycje/*-DO-MASTERA.md` + `docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md`.

**Append-only** — czaty dopisują pod swoją Grupą. Master nie kasuje.

> **Reguła przepływu (Maciej 2026-06-27):** `docs/czaty/REGULA-PRZEPLYWU-2026-06-27.md` — lane → F (test) → Master → Maciej. Poprawka → **grupa źródłowa**. Master **nie koduje**.

> **Wpisy sprzed 2026-06-27** mogą używać `Gra-podglad-TEST.html` / `GOTOWE-TEST` — aktualny kanon: `docs/czaty/SCHEMAT-DWIE-WERSJE.md` (`ROBOCZA` + `→ MASTER: GOTOWE-ROBOCZA`).

---

---

---

### [2026-06-28] MACIEJ → lane: delegacja w imieniu decydenta

**Od:** Maciej (via Grupa F) · **Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`

| Czat otwórz | Komenda | Pierwsze zadanie |
|-------------|---------|------------------|
| **Civ-UI** | `start` | E-P0-01 menu S0 |
| **Civ-MAPA** | `start` | OBL-S6 + złoża |
| **Civ-CYWILIZACJE** | `start` | D-P0-01 Excel AI + victory |
| **Civ-EKONOMIA** | `start` | EKO-P2-01 B5 tick |
| **Opus Ask** | (ręcznie) | `OPUS-REVIEW-QUEUE.md` |
| **HUD D1** | osobny czat | `GRUPA-A-MAPA-SWIATA.md` |

**SILNIK:** nie wykonuje powyższego — tylko `→ SILNIK: GOTOWE` po lane.

---

### [2026-06-28] → MASTER: **GOTOWE-ROBOCZA sesja-2026-28** (test SILNIK)

**Od:** Grupa F (SILNIK)

| Pole | Wartość |
|------|---------|
| **Plik** | `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` |
| **md5** | `0a049ccc2d195459a73a619b62a9b325` |
| **Bramka** | 8/9 ZIELONE · diplomacy **132/135** (3 FAIL — lane DYPLO) |
| **Delegacja** | ✅ UI/MAPA/CYW/EKO/Opus — `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md` |
| **Playtest Maciej** | CZEKA checklist w handoff test |
| **Opus** | CZEKA HUD-S7 |

**→ MASTER:** playtest Maciej (Ctrl+F5) · Opus review · eskalacja 3× diplomacy-test do CYW

---

### [2026-06-28] Grupa F → lane: **PRZEKAZANIE** delegacji MASTER Work

**Od:** Grupa F (SILNIK) · **Na prośbę Master:** przekazać tematy poza silnikiem do właściwych czatów.

**Manifest:** `dyspozycje/SILNIK-PRZEKAZANIE-LANE-2026-06-28.md` · routing: `_handoff/MASTER-do-SILNIK_ROUTING-MASTER-WORK-2026-06-28.md`

| Lane | Czat | Komenda | Pierwsze zadanie |
|------|------|---------|------------------|
| UI | **Civ-UI** | `start` | E-P0-01 menu S0 (`UI.md`) |
| MAPA | **Civ-MAPA** | `start` | OBL-S6 obóz 3D (`MAPA.md`) |
| CYW | **Civ-CYWILIZACJE** | `start` | D-P0-01 Excel AI (`CYWILIZACJE.md`) |
| EKONOMIA | **Civ-EKONOMIA** | `start` | EKO-P2-01 tick B5 · B1 po ABC Macieja |
| Opus | Ask ręczny | — | `OPUS-REVIEW-QUEUE.md` § batch 28.06 |
| HUD D1 | osobny czat | — | `GRUPA-A-MAPA-SWIATA.md` |

**→ SILNIK:** własna robota = **TEST sesji 28.06** (nie kod lane'ów). Po `→ SILNIK: GOTOWE` od lane → bramka ROBOCZA.

---

### [2026-06-28] MASTER → Maciej + lane: delegacja pozostałej pracy

**Od:** MASTER (sesja pilna)  
**SILNIK:** kod sesji WPIĘTY — tylko TEST (`SILNIK.md` § TESTUJ)

**Otwórz osobne czaty (pilne):**

| Czat | Plik | Zadanie |
|------|------|---------|
| **Civ-MAPA** | `MAPA.md` | OBL-S6 obóz 3D · E-P0-04 złoża |
| **Civ-CYWILIZACJE** | `CYWILIZACJE.md` | D-P0-01 Excel AI · E-P0-06 victory |
| **Civ-UI** | `UI.md` | E-P0-01 menu S0 |
| **Opus Ask** | `OPUS-REVIEW-QUEUE.md` | HUD-S7 review kanon |

**Pełna mapa:** `dyspozycje/MASTER-DELEGACJA-LANE-2026-06-28.md`

**→ SILNIK: TESTUJ** (nie koduj) · handoff `MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md`

---

---

---

---

---

### [2026-06-29] → MASTER: **GOTOWE-ROBOCZA** — E1 + F-CITY-HEX + okolica 👤 (playtest Macieja częściowy)

**Od:** Integrator (Grupa F) · **Handoff:** `dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md`

| Batch | Wynik |
|-------|--------|
| **E1-Q-BUNDLE** | ✅ kreator Jakość mapy Niska/Średnia/Wysoka · `?mapQuality=Wysoka` · save `mapQuality` |
| **E1 las parity** | ✅ forest-parity **98/98** |
| **F-CITY-HEX** | ✅ czysty hex pod miastem (`centerWorkedTile` + `hideDecorAtHex`) |
| **Okolica 👤** | ✅ auto profile + ręczny toggle · fix podglądu siatki (promień dynamiczny) |

**Pliki (ten sam bundel):** `Gra-podglad-ROBOCZA.html` · `Gra-podglad.html` · `PLAYTEST-WALKA` · `PLAYTEST-MIASTO`  
**md5:** `611613f49b8fdb92a550cae887606db3`

**Bramka:** typecheck + pełna bramka ZIELONA · smoke · battle-smoke · forest-parity 98/98 · okolica 32/32

**Playtest Macieja (✅ potwierdzone w czacie):**
- Okolica auto/ręczny na `PLAYTEST-MIASTO` — **OK**
- E1 jakość + F-CITY-HEX — sign-off przed buildem (**OK**)

**Playtest Macieja (⬜ czeka — ISO-4):**
1. Kreator → 3 jakości mapy → start bez crash
2. Załóż miasto na lesie/owcy → brak dekoracji w murach
3. Save/load `mapQuality`
4. Pełna ścieżka: menu → nowa gra → HUD → walka (regresja)

**Kolejka Integratora:** pusta · **NASTĘPNY:** E2 gęstość świata — **blok MAPA** (`MAPA.md` § TERAZ) → potem SILNIK → dopiero rebuild

**→ MASTER — prośby routing:**
1. **Opus Ask** — review batch `611613f4…` (checklista ISO-4 powyżej) → APPROVE/BLOCK
2. **Deleguj MAPA** — E2 generator (`MASTER-do-MAPA_E2-gestosc-generator.md`) — blokuje „główną grę" z pełnym kreatorem
3. **Grupa B** — dalsza praca na `Gra-podglad-PLAYTEST-MIASTO.html` (zsynchronizowany bundel); **nie** osobny kanon
4. **Odłożone P2:** okolica overlay Civ V (`cityOkolicaOverlay.ts` — tylko sandbox, nie w main)
5. **REJESTR:** zaktualizuj E1-Q-BUNDLE md5 → `611613f4…` · F-CITY-HEX → 🟢 po playtest ISO-4

**Maciej — wpięcie głównej gry:** otwórz **`Gra-podglad-ROBOCZA.html`** (Ctrl+F5) = aktualny stan całości; ekonomia/miasto osobno → `PLAYTEST-MIASTO`.

---

### [2026-06-29] → MASTER: **GOTOWE-ROBOCZA** — batch zbiorczy (OKOLICA + E1 bundel + lane-only)

**Od:** Grupa F (Integrator)

| Batch | Handoff / źródło | Wynik |
|-------|------------------|-------|
| **F-B-OKOLICA-TOGGLE** | `EKONOMIA-DO-MASTERA` § bugfix panel | ✅ rebuild · okolica-test **21/21** · **bez main.ts** |
| **E1 bundle** | `MASTER-do-SILNIK_E1-jakosc-preset-bundle.md` | ✅ już w main.ts · w bundlu |
| **MAPA E1 las parity** | `MAPA-do-INTEGRATOR_E1-jakosc-las-parity.md` | ✅ forest-parity **98/98** |
| **UNITS P1 typeId** | `UNITS-do-INTEGRATOR_map-units-typeId-P1.md` | ✅ w bundlu |
| **MAPA P1-04 audit** | `MAPA-do-INTEGRATOR_ulepszenia-audit-P1-04.md` | ✅ w bundlu |
| **UI E1 + menu S0** | `MASTER-do-UI_E1…` · `GRUPA-E-do-UI_menu-S0…` | ✅ w bundlu |

**Pliki publikacji:** `Gra-podglad-ROBOCZA.html` · `Gra-podglad-PLAYTEST-WALKA.html` · `Gra-podglad-PLAYTEST-MIASTO.html`  
**ROBOCZA md5:** `808b87fdc6a04a729114e2835560bcc4`  
**Kanon (`Gra-podglad.html`):** nadal `0a049ccc…` — **nie promowano** (czeka Opus)

**Bramka (`bramka-test-publish.ps1`):**
- wire 29/29 · logic **203/203** · combat 6/6 · civ-bonusy **30/30** · diplomacy **135/135** · ai **198/198**
- smoke OK · battle-smoke OK (WARN: brak przycisku auto przy re-open)
- okolica **21/21** · map-deposits-era **11/11** · empire-food-b5 **9/9** · grupa-b-lane **38/38** · forest-parity **98/98**
- `tsc --noEmit` — FAIL legacy/preview (nie blokuje vite build)

**→ MASTER:** Opus review całego pakietu ROBOCZA · playtest toggle 👤 w panelu miasta · promocja kanonu po APPROVE

---

### [2026-06-29] → MASTER: **GOTOWE-ROBOCZA** — P0 batch (preBattle + obóz + złoża + C4)

**Od:** Grupa F (Integrator)

| Batch | Handoff | Wynik |
|-------|---------|-------|
| UI P0-D4 | `UI-do-INTEGRATOR_preBattle-bonusy-P0-D4.md` | ✅ `configurePreBattle` + `ownerId` w rosterze |
| MAPA OBL-S6 | `MAPA-do-INTEGRATOR_oboz-3D-OBL-S6.md` | ✅ `refreshSiegeMarkers` — machiny 3D |
| MAPA E-P0 | `MAPA-do-INTEGRATOR_zloza-epoki-E-P0.md` | ✅ `visibleZloze` + `currentEra` w panelu |
| UNITS C4 | `UNITS-do-SILNIK_C4-balans-macierz.md` | ✅ `Obrażenia` w CombatUnit (mapa + auto) |

**ROBOCZA md5:** `0ADF96DE1A7B38D2021D0BF472E3565D`  
**Backup:** `gra/src/main.ts.bak-INTEGRATOR-P0-batch-2026-06-29`  
**Bramka:** combat 6/6 · battle-smoke OK · smoke OK · map-deposits-era 11/11

**→ MASTER:** Opus review przed kanonem · playtest P0 na końcu

---

### [2026-06-29] → MASTER: **GOTOWE-ROBOCZA** — walka verify + B5 + CYW

**Od:** Grupa F (Integrator)

| Batch | Wynik |
|-------|-------|
| D-P0-4 bonusy 3D | ✅ weryfikacja (już w main.ts) |
| F-B5-EMPIRE-FOOD | ✅ empire-food 9/9 |
| CYW victory 10A | ✅ wpięte · victory-test 12/12 |
| CYW barbarians 11C | ✅ `barbariansActive(..., player.era)` · 55/55 |

**ROBOCZA md5:** `bb131a6d6ae0c9af47ea661a37ff8568`  
**Bramka:** combat 6/6 · civ-bonusy 30 · diplomacy 135 · smoke · battle-smoke · grupa-b 38

**CZEKA lane:** UI P0-D4 preBattle bonusy · MAPA OBL-S6

---

### [2026-06-29] → MASTER: **GOTOWE-ROBOCZA** — F-B-TECH-SYNC-29

**Od:** Grupa F (Integrator)

| Pole | Wartość |
|------|---------|
| **Batch** | F-B-TECH-SYNC-29 (B1 tech sync + koszt miasta) |
| **Plik** | `Gra-podglad-ROBOCZA.html` |
| **md5** | `3a13adc8f714db6f10b8581fcfebefd5` |
| **Backup** | `gra/src/main.ts.bak-SILNIK-2026-06-29` |
| **Bramka** | wire 29 · logic 203 · combat 6/6 · civ-bonusy 30 · diplomacy **135/135** · ai 198 · smoke OK · battle-smoke OK · grupa-b **38/38** |

**Wpięte w `main.ts`:**
- `evaluateFoundCityAffordance` w `tryFoundPlayerCityAt` (odejmowanie P + ludność ze źródła)
- hooki HUD: `getFoundCityCostLabel`, `getFoundCityLockHint`
- `canFoundCity` — 2. miasto widoczne (FOUND-Q2A)

**→ MASTER:** weryfikacja · Opus review · playtest AC B1 (handoff § C)

---

### [2026-06-29] → SILNIK: **F-B-TECH-SYNC-29** — ✅ WPIĘTE (2026-06-29)

**Od:** Grupa B · **Decyzje Macieja:** `docs/decyzje/B1-tech-MACIEJ-2026-06-29.md`

| Batch | Handoff |
|-------|---------|
| **F-B-TECH-SYNC-29** | `EKONOMIA+MAPA-do-SILNIK_B1-tech-sync-2026-06-29.md` |

**Lane zrobione:** Rolnictwo/Łowiectwo · fort→Wojskowosc · podgląd 🔒 · koszt miasta 20P+1👤 (moduł)

**Silnik:** wpięcie `main.ts` (koszt miasta + hooki HUD) + ROBOCZA + playtest AC w handoffie

---

**Od:** Grupa B · **Do:** Grupa F + Master

| Stan | Treść |
|------|--------|
| **SILNIK TERAZ** | **F-B-TECH-SYNC-29** — wpięcie `main.ts` (koszt miasta + HUD) |
| **ABC B1** | **ZAMKNIĘTE** — `docs/decyzje/B1-tech-MACIEJ-2026-06-29.md` |
| **Lane ROBIA** | **EKO-P2-01** (tick B5) — osobny handoff, nie blokuje B1 |
| **Inne lane'y** | UI/MAPA/CYW — patrz `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md` |

**Pełny meldunek:** `dyspozycje/_handoff/GRUPA-B-do-SILNIK_rozpoznanie-2026-06-29.md`

---

### [2026-06-28] → SILNIK: **F-B-TARTAK-DREWNO** — ✅ WPIĘTE

**Od:** Grupa B · **1 linia** w `main.ts`

| Handoff | `dyspozycje/_handoff/EKONOMIA-do-SILNIK_tartak-drewno-access.md` |
| Kolejka F | `dyspozycje/F-KOLEJKA-P0.md` § NASTĘPNY |

**Fix:** `getResourceAccessForCity(cityDto, map, placedImprovements)` — tartak na mapie → panel Surowce pokazuje **Drewno**.

**→ SILNIK: GOTOWE**

---

### [2026-06-28] → MASTER: **GOTOWE-ROBOCZA** (F-B-PILNE + F-B-WYRAB-TARTAK + mgła miast)

**Od:** Grupa F

| Batch | md5 ROBOCZA | Testy |
|-------|-------------|-------|
| F-B-PILNE + F-B-WYRAB-TARTAK + mgła miast AI | `e87a5ca2f8eb5e4657ab28dd3da38644` | grupa-b-lane 23/23 · society-breakdown 18/18 · smoke OK |

**Plik:** `Gra-podglad-ROBOCZA.html` (Ctrl+F5)

**Playtest Maciej — checklist:**
1. Panel miasta: Surowce, Społeczeństwo %, 🔥 przy grace, rozpiska 2A
2. Głód wojska przy ujemnych zapasach państwa
3. Miasta AI niewidoczne na mgle
4. Budowa: Wyrąb FREE · Tartak 🔒 do „Obróbka drewna” · wyrąb usuwa las · tartak na lesie zostawia las

**→ MASTER:** Opus review → promocja kanonu · szczegóły: `dyspozycje/SILNIK-DO-MASTERA.md` § START

---

### [2026-06-27] → SILNIK: **F-B-WYRAB-TARTAK** — ✅ ZROBIONE (Grupa F 2026-06-28)

**Od:** Grupa B (EKONOMIA + MAPA + UI) · **Priorytet:** P0 · **Batch:** `F-B-WYRAB-TARTAK`

**Decyzja Maciej (korekta):**
- **Wyrąb** — tylko las, **usuwa** las, darmowy, +20 Pracy × 3 tury
- **Tartak** — ląd w terytorium **w tym las**; **NIE usuwa** lasu (mesh tartak na wierzchu lasu)
- **Tech gate** — tartak wymaga **Obróbka drewna**; bez tech = szare w panelu Budowa

| Handoff | `dyspozycje/_handoff/MAPA+EKONOMIA-do-SILNIK_wyrab-tartak-tech.md` |
| Decyzja | `docs/decyzje/B1-wyrab-tartak-tech.md` |
| Kolejka F | `dyspozycje/F-KOLEJKA-P0.md` § P0 NASTĘPNY |

**Lane gotowe (NIE edytuj — wpinaj):** `terrain-improvements.json`, `improvement-tech.ts`, `improvement-build.ts`, `buildModeHud.ts`, `improvements.ts`, `terrain-improvements.ts`

**Silnik — krytyczne przy tartaku na lesie:** `applyBuildRequest` → ustaw `improvementKey: 'tartak'`, **NIE** zmieniaj `hex.nakladka`.

**Plony tartaku (Excel + JSON):** **+3 Pracy** / turę · drewno = **tylko dostęp** (`surowiecOdblokowany`, bez ilości v0.1).

**→ SILNIK: GOTOWE** · Po ROBOCZA: meldunek **`→ MASTER: GOTOWE-ROBOCZA F-B-WYRAB-TARTAK`**

---

### [2026-06-27] → SILNIK: **PILNE F-B-PILNE** — luki częściowe Grupa B ✅ ZROBIONE

**Od:** Grupa B (EKONOMIA + UI) · **Priorytet:** P0 natychmiast

| # | Luka | Lane | Silnik (main.ts) |
|---|------|------|------------------|
| 1 | Surowce v0.1 placeholder | ✅ `resource-access.ts` | `getResourceAccess` hook |
| 2 | 🔥 tylko po buncie, nie przy grace | — | `getRevolt` + `revoltWarning` |
| 3 | 2A: Ratusz, obca kultura/religia | ✅ `society-inputs.ts` | pola w `evaluateOrderFromBreakdown` |
| 4 | Głód −8% HP (tylko hint) | ✅ `army-starvation.ts` | po `isArmyStarving` |
| 5 | UI Społeczeństwo % + nagłówek | ✅ `cityPanel.ts` | rebuild ROBOCZA |

**Handoff:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_PILNE-luki-2026-06-27.md`  
**UNITS:** `dyspozycje/_handoff/UNITS-do-SILNIK_army-starvation-hp.md`  
**Testy lane:** `node tools/grupa-b-lane-test.cjs` PASS

**→ Grupa F:** ~~wykonaj batch F-B-PILNE~~ **ZROBIONE** 2026-06-28 · następny: **F-B-WYRAB-TARTAK** (wpis powyżej)

---

## [2026-06-27] → SILNIK: **F-B-WYRAB-TARTAK** (wyrąb / tartak / tech gate) — **SUPERSEDED** wpisem § F-B-WYRAB-TARTAK wykonaj TERAZ (tartak na lesie)

**Od Maciej:** wyrąb darmowy (wycinka + 60P temp); tartak płatny + tech; szare ulepszenia bez badań; **tartak na lesie bez likwidacji lasu**.

| Handoff | `dyspozycje/_handoff/MAPA+EKONOMIA-do-SILNIK_wyrab-tartak-tech.md` |
| Decyzja | `docs/decyzje/B1-wyrab-tartak-tech.md` |
| Tech drzewko (propozycja) | `docs/decyzje/B1-tech-ulepszenia-proposal.md` |

**→ SILNIK: GOTOWE**

---


**Od:** Maciej · **Master:** bramka + publish wykonane wcześniej tej samej doby

| Pole | Wartość |
|------|---------|
| **Kanon** | `Gra-podglad.html` · `gra-kanon/` · md5 **`bf99e18b9f164dd1a734bbb5114755f1`** |
| **Maciej** | **playtest OK** — oblężenie + bitwa + pełna gra · „możemy implementować" |
| **Start bezpieczny** | `START-GRA.html` / `gra-kanon/START.html` → `?skipMenuRedirect=1` |
| **Batch** | OBL-MAP-01 (C3 oblężenie mapy, AI auto-siege, save/load, PT-C3-01) |

**Status:** **ZAMKNIĘTE** w kanonie. Grupa F kolejka **PUSTA** — czeka dyspozycję Mastera.

**Kolejka implementacji (Master → lane):**
1. **Grupa A** — A-START-01…04 (onboarding, kamera, fog rzeki, minimapa)
2. **Grupa E + F** — menu 5=C w `mainMenu.ts` + jeden oficjalny start (bez rozjazdu mockup/silnik)
3. **Grupa D** — fix bonusów Celtów (civ-bonusy 26/4 FAIL)
4. **Grupa E** — E1-UX-01 nawigacja kreatora (dolny pasek bliżej treści)

---

### [2026-06-27] → MASTER: GOTOWE-ROBOCZA — OBL-MAP-01 (test oblężenia)

**Od:** Grupa F · **Maciej:** przekaż do przetestowania

| Pole | Wartość |
|------|---------|
| **ROBOCZA** | `Gra-podglad-ROBOCZA.html` · md5 `bf99e18b9f164dd1a734bbb5114755f1` |
| **PLAYTEST-WALKA** | ten sam md5 |
| **Batch** | OBL-MAP-01 — oblężenie w głównej grze |
| **Testy** | map-siege 6/6 · oblezenie 27/27 · smoke · battle-smoke OK |

**Checklist:** `GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md` §5 (nowa gra · gracz szturm · AI oblężenie · save/load)

**Maciej:** bitwa już OK · oblężenie w kampanii → **test Mastera**

**→ MASTER:** checklist → Opus → kanon

---

### [2026-06-27] → MASTER: OBL-MAP-01 WPIĘTE (oblężenie w głównej grze)

**Od:** Grupa F · **Maciej:** wprowadzić oblężenie do silnika, test u Mastera później

**Zrobione:** reset nowej gry · AI auto-oblężenie · modal C3-Q1=A · kapitulacja z przejęciem · save/load markerów  
**Handoff:** `GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md`  
**→ MASTER:** bramka + publish ROBOCZA → checklist §5 → Opus → kanon

---

### [2026-06-27] → MASTER: C3 oblężenie w silniku (Grupa F)

**Od:** Grupa F · **Maciej:** wprowadzić oblężenie do silnika, test później u Mastera

**W silniku:**
- Modal **Oblężaj / Szturm / Anuluj** (C3-Q1=A) przy ataku miasta z murem
- Panel oblężenia + markery + ekonomia `oblegane`
- Kapitulacja z głodu → **przejęcie miasta**
- Szturm → preBattle → bitwa 3D (już OK u Macieja)

**Handoff + checklist:** `dyspozycje/_handoff/F-do-MASTER_oblezenie-C3-silnik.md`  
**→ MASTER:** bramka + publish ROBOCZA → test checklist → Opus → kanon

---

### [2026-06-27] **→ MASTER: PLAYTEST OK — bitwa** (Maciej)

**Od:** Grupa F (przekaz playtestu Macieja)

| Pole | Wartość |
|------|---------|
| **Plik** | `Gra-podglad-PLAYTEST-WALKA.html` + `Gra-podglad-ROBOCZA.html` |
| **md5** | `cd4677e6b32d08ebdbbc6218db369618` |
| **Maciej** | **playtest OK** — wszystko działa jeżeli chodzi o bitwę |

**Zakres:** scenariusz A (1v1 preBattle → bitwa 3D) · PT-C3-01 preset (Lucznik przy Atenach) · panel oblężenia (fix boot)

**→ MASTER:** Opus review → publish kanon · F kolejka **PUSTA**

---

### [2026-06-27] → MASTER: GOTOWE-ROBOCZA — PT-C3-01 (playtest oblężenia)

**Od:** Grupa F  
**Master dyspozycja:** `OD-MASTERA` § F · `DO-MASTERA` PT-C3-01

**Zrobione:** `playtestWalkaMapy.ts` — +1 Lucznik gracza na wolnym heksie sąsiadującym z Atenami (osobny od Hastati 1v1)  
**Publish:** ROBOCZA + PLAYTEST-WALKA · md5 `117688301ae3079c5ed08b4b72e58c24`  
**Bramka:** ZIELONA

**→ MASTER / Maciej:** dwuklik `Gra-podglad-PLAYTEST-WALKA.html` → Lucznik przy mieście → test oblężenia (scenariusz B)

---

### [2026-06-27] PLAYTEST Maciej — oblężenie miasta: brak 2. jednostki przy mieście (ROBOCZA)

**Od:** Maciej (Master Silnik)  
**Plik:** `Gra-podglad-ROBOCZA.html` · md5 `6aedd5ce5bd4f5fc1cb0f5577d2385bc`  
**Kontekst:** test **oblężenia / ataku miasta** (C3) — do walki **dochodzi** ✅ (preBattle → bitwa OK)

| # | Uwaga | Routing |
|---|--------|---------|
| **PT-C3-01** | Preset playtestu ma tylko **1 jednostkę gracza** (Hastati) + wroga + miasto w linii. Do testu **oblężenia miasta** potrzebna **2. jednostka gracza na heksie sąsiadującym z miastem AI** (osobny hex, nie ten sam co 1v1). | **→ Grupa F** — **WPIĘTE** 2026-06-27 (Lucznik, md5 `11768830…`) |

**Nie blokuje promocji kanonu** — flow walki 1v1 PASS. Poprawka = rozszerzenie presetu pod scenariusz B (`PLAYTEST-WALKA-MAPY-SPEC.md` § scenariusz B).

**Owner C3 logika oblężenia:** Grupa A (osobno, lane C3) — ten wpis dotyczy **tylko układu jednostek do playtestu**.

---

### [2026-06-27] **→ MASTER: PLAYTEST OK** — ROBOCZA `6aedd5ce…` (Maciej)

**Od:** Grupa F (przekaz playtestu Macieja)

| Pole | Wartość |
|------|---------|
| **Plik** | `Gra-podglad-ROBOCZA.html` |
| **md5** | `6aedd5ce5bd4f5fc1cb0f5577d2385bc` |
| **PLAYTEST-WALKA** | ten sam md5 |
| **Maciej** | **playtest OK** — z jego strony wszystko działa |

**Pakiet w ROBOCZA:** A-FOG-Q1B (mgła per jednostka) · E1-roster AI · Grupa B batch 2–7 (empire-food, power, kultura/religia panel, okolica, citySight, C1)

**Bramka F:** grupa-b 12/12 · logic 195/195 · smoke · battle-smoke OK · civ-bonusy 26/4 FAIL (lane D)

**→ MASTER (teraz):**
1. **Opus review** ROBOCZA `6aedd5ce…` → APPROVE/BLOCK
2. Po APPROVE → **publish kanon** `Gra-podglad.html` + md5
3. Następne lane (po kanonie): C3 (Grupa A) · E1-UX kreator (UI) · B2-Q5 hex (MAPA)

**Grupa F:** kolejka kodowa **PUSTA** — czeka na dyspozycję / nowy handoff.

---

### [2026-06-27] **playtest OK** — Maciej (Master Silnik) — *starszy kanon*

**Plik:** `Gra-podglad.html` · md5 `2ca18022c555a86981c65af85e3b24e4`  
**Ścieżka:** MENU → kreator → mapa (ROBOCZA = redirect do kanonu)  
**Wynik:** **playtest OK** — wszystko działa (mgła, ghost miasta, start, flow kreatora).

**Uwaga:** to **starszy** pakiet kanonu — **nowszy** do Opus/kanonu: ROBOCZA `6aedd5ce…` (wpis powyżej).

---

### [2026-06-27] PLAYTEST Maciej — **start mapy** (po New Game)

Od: Maciej · Generator mapy **działa** ✅ · **całość → Grupa A (MAPA)**.

**[EKRAN: Mapa świata — pierwsza tura, brak miasta gracza]**

| # | Uwaga | Routing |
|---|--------|---------|
| **A-START-01** | **Onboarding:** po wejściu na mapę od razu **tryb budowy** + aktywne **„Załóż miasto”** (bez osadnika — model zamknięty; gracz wybiera hex w widocznej mgle). | **→ Grupa A (MAPA)** |
| **A-START-02** | **Kamera:** start z **maksymalnym przybliżeniem**, nie „w chmurach”. | **→ Grupa A (MAPA)** |
| **A-START-03** | **Fog:** **rzeki** widoczne poza mgłą — bug. | **→ Grupa A (MAPA)** (`scene.ts` / fog) |
| **A-START-04** | **Minimap:** fog jak na mapie 3D. | **→ Grupa A (MAPA)** |
| **A-START-05** | **Panel budowy (🔨):** brak **„Załóż miasto”** na otwartym terenie. | **→ Grupa A (MAPA)** |

**Master:** jeden owner — **Grupa A**. Po `→ SILNIK: GOTOWE` dopiero **F** (bramka ROBOCZA). **Nie** rozdzielać na E / osobne UI lane poza charterem A.

**Nie nowe ABC** — implementacja zamkniętego modelu (miasto z budowy, bez osadnika).

---

### [2026-06-27] Playtest Maciej — scenariusz walki na mapie (C1+C2)

**Zlecenie:** osobny plik podglądu z armią (~15 jedn.) + miasto przeciwnika + słaba jednostka do ataku → **C1 preBattle → C2 bitwa 3D** (pełny flow z mapy; **nie** sam klawisz T).

| Owner | Co |
|-------|-----|
| **Grupa F** | `Gra-podglad-PLAYTEST-WALKA.html` + preset startu |
| **Master** | playtest po GOTOWE od F |
| **Maciej** | czeka na plik |

Spec: `docs/master/PLAYTEST-WALKA-MAPY-SPEC.md` · handoff: `dyspozycje/_handoff/MASTER-do-F_playtest-walka-mapa.md`

---

## Grupa A — Mapa świata

### [2026-06-28] MACIEJ → Grupa A / MAPA (via SILNIK)

**Od Macieja:** OBL-S6 · złoża · presety mapy · MAP-S1 = **MAPA** (czat **Civ-MAPA**, `start`).  
HUD D1 / minimapa = **osobny czat** (`GRUPA-A-MAPA-SWIATA.md`).  
**Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`

---

### [2026-06-27] EKONOMIA → A — zasięg miasta + mgła (decyzja Macieja)

Od: Grupa B (EKONOMIA) · **Decyzja Macieja: Spec** (bez nowego ABC)

**Ustalenie:**
- Zasięg okolicy: **start 5**, rośnie **1:1 z pop** (cap 15) — pop 9 → zasięg 9
- **Mgła bez jednostek:** widok miasta = okolica (pop) **+ pierścienie kultury** (+0…+3)
- Jednostki: osobny zasięg (np. 10); posterunek +5 / fort +10
- Pre-city onboarding: `START_REVEAL_RADIUS = 5` (już w `startScoring.ts`)

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-GRUPA-A_zasieg-miasta-fog.md`  
**Decyzja:** `docs/decyzje/B-zasieg-miasta-fog.md`

**Rozjazd kodu:** `cityRangeForPopulation` dziś daje pop 1 → r1; fix w EKONOMIA → potem F w `currentVisible()`.

→ **Grupa A: CZEKA** (minimapa fog, kontrakt sight)  
→ **Grupa F: CZEKA** (wpięcie po GOTOWE A + fix EKONOMIA)

---

## [2026-06-27] Granica A vs C — KANON (decyzja Macieja)

Diagram zatwierdzony — źródło: `docs/grupa-c/GRANICA-C-vs-MAPA.md`

```
GRUPA A (mapa świata)
├── ruch A2, A3 · C3 oblężenie · C1 preBattle
         │ Auto LUB Ręczna
         ▼
GRUPA C: C2 pole bitwy 3D · C4 reguły w walce
```

---

| Grupa A (ten czat) | Grupa C (Walka) |
|--------------------|-----------------|
| Ruch jednostek, A2, A3 | — |
| C3 oblężenie Q1…Q10 | — |
| **C1 preBattle** (Auto/Ręczna/Wycofaj) | — |
| — | **C2** pole bitwy 3D |
| — | **C4** reguły w walce |

**Kanon (diagram Macieja):** `docs/grupa-c/GRANICA-C-vs-MAPA.md`

Od: Maciej

| ID | Decyzja |
|----|---------|
| **C3-Q1…Q10** | **ZAMKNIĘTE** — `docs/decyzje/C3-obleczenie.md` (Q2=custom AI; Q10=C polish 3D — uwaga zakresu) |
| **A1-Q16** | **A** — panel 🎭/⛪ tak; toggle zasięgu na mapie 3D **po v1.0** |
| **A1-Q17** | **C** — ikona Żywności bez liczby do B5 |
| **A1-Q18** | **C** — blocking: atak + tech + bunt + pusta produkcja + dyplomacja |
| **A5-Q2** | **A** — poziom miasta 1–10 z populacji |
| **A-OPS-Q1** | **B** — skasowano 2 stare mockupy HUD |
| **A3-Q1** | **B** — panel armii jak mockup → `A3-do-UI-UNITS_panel-armii-A3Q1B.md` |
| **A5-Q1** | **custom** — 10 poziomów × civ × mur/bez muru → `A5-wyglad-miast-mapa.md`, handoff MAPA |

---

### [2026-06-27] A1-Q15=A — Power: wyświetlanie vs wyliczanie

Od: Maciej · **A1-Q15=A** (custom routing)

| Lane | Rola |
|------|------|
| **Grupa A** | Tylko **HUD**: liczba Power + overlay składników (mockup [A′]) |
| **Grupa B** | **Wytyczne wyliczania** Potęgi (ludnosc, miasta, gospodarka) + kontrakt API |
| **Grupa D** | **Konsument** — Respekt / dyplomacja z Power |

Handoffy:
- `dyspozycje/_handoff/A1-do-GRUPA-B_power-wyliczanie.md` → **CZEKA Grupa B**
- `dyspozycje/_handoff/A1-do-GRUPA-D_power-konsument.md` → INFO

→ **Grupa B:** spec + `computePowerContributionsCityEconomy` (propozycja)  
→ **Grupa F:** agregacja po spec B + UNITS + epoka  
→ **Grupa A:** bez zmian w formułach — tylko UI

---

### [2026-06-26] A1-FLOW — punkt startu = menu główne

Od: Maciej · Potwierdzenie flow

- **[S0] Menu główne** (`Gra-podglad-MENU.html`) = **pierwszy ekran gry** (przed wyborem cywilizacji)
- **[S1] Nowa gra** → `Makieta-flow-nowa-gra.html` (5 kroków)
- **[S2] Mapa** → `Makieta-HUD-D1B-preview.html`
- Dokument: `docs/A1-FLOW-EKRANY-GRY.md`

---

### [2026-06-27] HANDOFF MASTER — mockupy HUD D1B · Maciej ABC1=A

**Od Macieja (czat MASTER):** Wyślij do Mastera. **Ja decyduję tylko gameplay ABC** — nie wybory techniczne mockupu.

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | **ABC1=A** — akceptuję mockupy P0+P1 (układ + flow kliknięć) |
| **Handoff** | `dyspozycje/_handoff/UI-do-MASTER_hud-D1B-mockupy.md` |
| **Meldunek lane** | `dyspozycje/UI-DO-MASTERA.md` (wpis 2026-06-27) |
| **Hub** | `UI/Makieta-HUD-D1B-preview.html` · start: `UI/Makieta-START.html` |

**MASTER robi:** routing do **Grupy F** (batch F-HUD `hud.ts`) → Opus po ROBOCZA → finalna. **NIE** integruje `main.ts` sam.  
**Maciej NIE decyduje:** embed.js, auto-redirect, toast vs alert — patrz sekcja „Wybory techniczne" w handoff.

**Gameplay ABC Macieja:** wyłącznie `docs/MACIEJ-KARTA-DECYZJI.md` (D1–D15).

---

### [2026-06-26] A1-MOCKUPY-faza2 — embed + launcher + handoff

Od: Grupa A · Autonomiczna sesja 2

- `UI/mockup-embed.js`, `UI/Makieta-START.html`
- Handoff: `dyspozycje/_handoff/UI-do-MASTER_hud-D1B-mockupy.md`
- Archiwum: `docs/archiwum-czatow/master/MASTER-mockupy-HUD-faza2_2026-06-26.md`

---

### [2026-06-26] A1-MOCKUPY-P0P1 — hub kliknięć GOTOWY (autonomiczna sesja)

Od: Grupa A / agent · **Bez Macieja**

**Zrobione:**
- Hub D1B: każdy klik → FS/MD/DK/MP (nie toast)
- Nowe: `Makieta-dyplomacja.html`, `Makieta-preBattle.html`, `Makieta-cuda.html`, `Makieta-panel-jednostki.html`
- Flow: Menu → Nowa gra → HUD (auto po kroku 5)
- Przewodnik: `docs/A1-HUD-KLIKI-MOCKUP-PRZEWODNIK.md`
- Checklist Macieja: `docs/MACIEJ-HUD-CHECKLIST-D1B.md`
- Archiwum: `docs/archiwum-czatow/master/MASTER-mockupy-HUD-P0-P1_2026-06-26.md`

**ZAMKNIĘTE ABC1=A (2026-06-27)** → Grupa F batch F-HUD · Opus przed finalną

**NIE ruszano:** `gra/src/main.ts`, `Gra-podglad.html`

---

### [2026-06-26] A1-MOCKUPY-KLIK — plan mockupów po kliknięciu z huba D1B

Od: Grupa A · Kolejny krok po układzie HUD

- **Hub:** `UI/Makieta-HUD-D1B-preview.html`
- **Plan:** `docs/A1-HUD-PLAN-MOCKUPY-KLIKNIECIA.md` (typ FS/MD/DK/MP, pliki, P0→P2)
- **Logika klików:** `docs/A1-HUD-MAP-KLIKNIEC.md` (bez zmian)
- **Maciej:** akceptacja kolejności P0; potem implementacja podpięć w hubie

---

### [2026-06-26] A1-Q12 — kultura/religia: MAPA toggle vs Grupa A treść kliku

Od: Maciej · Korekta lane Nauka/D (wygląd poza zakresem)

- **MAPA-F2-Q1 ZAMKNIĘTE:** obok [F] minimapy — toggle zasięgu kultury + religii (ON/OFF na [D])
- **A1-Q12 OTWARTE:** klik ikony → treść overlay (ABC w `A1-Q12-kultura-religia-minimapa.md`)
- Handoff MAPA: `dyspozycje/_handoff/MAPA-do-UI_kultura-religia-zasieg-minimapa.md`

---

### [2026-06-26] A1-KLIKI — mapa kliknięć HUD mapy

Od: Grupa A · Maciej: **każdy element na mapie/HUD — opis co robi klik**

- Markdown: `docs/A1-HUD-MAP-KLIKNIEC.md` (32 wpisy stref A–I2)
- Excel: `Status-projektu-The-Game.xlsx` → arkusz **`HUD-mapa-kliki`**
- Skrypt odświeżenia: `gra/tools/append-hud-kliki-xlsx.py`
- Civ-UI w Excel: nowy krok #7 „HUD mapy D1B: mockup + mapa kliknięć"

---

### [2026-06-26] A1-revA — kolumna zasobów [A] + toolbar bez Zasoby

Od: Grupa A · Maciej

**[A] lewa kolumna (kolejność):** Żywność (bez kliku) · Złoto · Praca · Badania (klik→drzewko) · Bogactwo (Wealth PL) · Ludność (+X/t).

**[A] prawa:** Epoka · Nacja · Osiedla · Tura · Dyplomacja.

**OUT:** osobny blok Żywność · osobny blok Epoka&Badania · toolbar 📦 Zasoby.

**[C] v1.0:** 🏛️ Cuda · 🔨 Budowa (2 ikony).

**OTWARTE A1-Q11:** Kultura + Wpływ na liście? → `docs/decyzje/A1-revA-zasoby-pasek.md`

Docs: `A1-HUD-SCHEMAT-MAPA-D1B.md` · `A1-HUD-HUMO-CAP-SPECYFIKACJA.md` (sync pending OneDrive lock)

---

### [2026-06-26] A1-Q6 — toolbar: Zasoby, Cuda, Budowa *(superseded rev. A1-revA — Zasoby OUT)*

Od: Grupa A · Decyzja: **4 Doktryny NIE** · **7 Odblokowane NIE** · v1.0 **[C] = 📦 Zasoby · 🏛️ Cuda · 🔨 Budowa** · bez duplikatów [A]/[F2]

---

Decyzja Macieja: **oba** — przycisk na **dolnym pasku** + **duży okrąg** prawy-dół (prototyp MAPA). Ta sama akcja, ta sama brama G1. WYKONAJ tylko na pasku.

→ UI: mockup D1B + `hud.ts` — `#end-turn` floating obok `#bottom-bar`.

---

### [2026-06-26] A1 — Badania = Nauka (jeden wpis)

Decyzja Macieja: nauka i badania to **to samo**. Na HUD tylko wiersz **Badania** (tech, %, +PN/t, klik→drzewko). Usunąć osobny **Nauka +X/t** z grupy zasobów.

→ UI: mockup D1B — jeden blok epoka+badania.

---

### [2026-06-26] A1 — nawigacja: Nauka + Dyplo na górze

Decyzja Macieja: **Nauka** i **Dyplomacja** tylko na **[A] górnym pasku** (klik Badania/Nauka; przycisk Dyplomacja przy turze).  
**[I] dolny:** Miasta · WYKONAJ · Koniec tury · Menu — **bez** Nauka/Dyplo.

→ UI: mockup D1B + `hud.ts` — usunąć duplikaty z bottom-bar.

---

### [2026-06-26] A1 — schemat HUD mapy D1B (tekstowy)

Od: Grupa A  
Zrobione: `docs/A1-HUD-SCHEMAT-MAPA-D1B.md` — strefy A–I, mini-ramki, bramki G1–G3, [F2] wszystkie toggles mapy przy minimapie  
Decyzja Maciej: #3 idee OUT; #9–10 + kolejne toggles → pod minimapą (nie toolbar)

→ UI: zaktualizować mockup HTML (WYKONAJ, F2, usunąć chip idei) — **bez** graficznego mockupu na razie

---

### [2026-06-26] A1-Q6 — toolbar (częściowo)

Decyzja Macieja:
- **#1 ⚗️ Epoka, #2 🔬 Badania** — **NIE** w toolbarze (duplikat [A]/[I] — bez szumu).
- **#3 💡 Idee** — **NIE** (A1-Q7).
- **#9 🗺️ Zasięg** i **#10 🏷️ Nazwy** — **nie** w toolbarze; **[F2] pod minimapą** (wszystkie toggles mapy).

Otwarte: overlaye **4–8** — które na v1.0 (propozycja: min. **8 Budowa**).

Handoff: `dyspozycje/_handoff/UI-do-MASTER_map-layers-minimap-A1Q6.md`

→ UI/MAPA: `#map-layer-toggles` pod minimapą · mockup D1B · **nie** wdrażać idee z mainview

---

### [2026-06-26] A1-Q9 — WYKONAJ = A + brama końca tury

Decyzja Macieja: przycisk **WYKONAJ** obok **Koniec tury** (dolny pasek D1B).

**Rozszerzenie:** bez rozstrzygnięcia chipów **wymagających decyzji** (panel A1-Q8) — **nie można** zakończyć tury (UI disabled + ta sama brama na skrót Enter/N).

Handoff: `dyspozycje/_handoff/UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md`

→ UI: dodać `btn-wykonaj` do mockupu D1B + `hud.ts` · `SidePanelEvent.blocking`  
→ SILNIK: kolejka `pendingTurnDecisions`, `getEvents()` z flagą blocking, gate przed `endTurn`

---

### [2026-06-26] A1-Q8 — wydarzenia z tury = A

Decyzja Macieja: **panel chipów po prawej** (D1B). Bez dziennika pod minimapą.

Zgodne z mockupem `#side-panel` i lane `sidePanelHud.ts` (już w `hud.ts`).

→ SILNIK: wpięcie przy batch HUD D1B; silnik dostarcza `getEvents()` (nauka, miasto, jednostka, wróg…).

---

### [2026-06-26] A1-Q7 — brak Idee, tylko Kultura

Decyzja Macieja: nie ma mechaniki Idee; HUD = Kultura (+ Nauka itd.), bez osobnego paska Idee. Prototyp MAPA/toolbar „Opracowanie idei" → **NIE wdrażać**.

→ SILNIK: doprecyzować **D2-kultura.md** (korekta sprzeczności z wcześniejszym „pasek Idee").

---

Od: Grupa A  
Decyzja Macieja: **A1-Q5 = A+C** — mapa tylko wojny z nami (minimal); Dyplomacja = szczegóły + wojny innych (wywiad)  
Zrobione: `hud.ts` (`getWarsWithPlayer`, pasek czerwony), `diplomacyPanel.ts` (`getKnownWarsBetweenOthers`); usunięto Zadowolenie z paska (Q3)  
Testy: nie uruchomiono (brak node w sandboxie)  
→ SILNIK: **CZEKA** wpięcie haków przy batch HUD D1B · handoff `_handoff/UI-do-MASTER_hud-wojna-A1Q5.md`

---

### [2026-06-27] HANDOFF → SILNIK — mockupy HUD D1B (ABC1=A) + kolejka testów

Od: Grupa A (Maciej → przekazanie do wdrożenia)

**Wykonane (mockupy HTML — NIE kanon):**
- Hub: `UI/Makieta-HUD-D1B-preview.html` · launcher `UI/Makieta-START.html`
- Handoff: `dyspozycje/_handoff/UI-do-MASTER_hud-D1B-mockupy.md` · **Flaga: GOTOWE**
- Decyzja Macieja: **ABC1=A** (2026-06-27) — układ + flow kliknięć P0+P1
- Powiązane: `UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md`, `UI-do-MASTER_hud-wojna-A1Q5.md`, `C1-do-UI_preBattle-TW-layout.md`

**→ SILNIK / Grupa F — kolejność wdrożenia:**
1. **Bramka P0** (Maciej lokalnie, Node): `npm run typecheck` · `node tools/*.cjs` · `npx vite build --outDir $env:TEMP\civ-dist` — batchy F1, F-A1/A2, F-B2, F-C1 (kod w `main.ts`, czeka PASS)
2. **Opus review** mockupów D1B (Ask, osobny czat)
3. **Batch F-HUD:** wpięcie `hud.ts` wg `A1-revB-uklad-mockup.md` + `A1-HUD-MAP-KLIKNIEC.md` (jeden DOM, bez iframe)
4. Po PASS → `Gra-podglad-ROBOCZA.html` → Opus → kanon

**Blokada gameplay (Maciej ABC przed pełnym HUD):**
- **A1-Q11** — Kultura/Wpływ na pasku [A]
- **A2-Q4** — panel jednostki [H]
- **E1-Q9…Q12** — defaulty nowej gry (Grupa E, kod provisional)

**NIE ruszano:** `gra/src/main.ts`, `Gra-podglad.html` (sesja mockupów).

→ **SILNIK: GOTOWE DO WPIĘCIA** (mockupy + handoffy lane) · **BLOK BRAMKA** (Node u Macieja) · ~~CZEKA ABC A1-Q11, A2-Q4~~ **A1-Q11=A, A2-Q4=A 2026-06-27**

---

### [2026-06-27] A1-Q11=A + A2-Q4=A — Grupa A

Od: Grupa A · Maciej w czacie MASTER

**A1-Q11=A:** Kultura na [A] (7. zasób, +X/t) — nie Wpływ  
**A2-Q4=A:** Pełna karta [H] na dole mapy

Zrobione: revA zaktualizowany · mockup HUD + panel jednostki · handoff `UI-do-MASTER_A2-Q4-panel-jednostki.md`  
→ **SILNIK: GOTOWE DO WPIĘCIA** w batch F-HUD (`kultura`/`kulturaRate` w HudState + panel jednostki)

### [2026-06-27] F → Grupa A: prośba (blokery F-HUD)

Od: Grupa F · **Bez ABC Macieja**

**F zrobiło częściowo:** `kulturaRate` w `hud.ts` + `getEvents()` chipów buntu (B2-Q5 część SILNIK).

**Prośba do Grupy A — `→ SILNIK: CZEKA` na Was:**

| # | Temat | Handoff | Dlaczego F czeka |
|---|--------|---------|------------------|
| 1 | **A1-Q9** — przycisk WYKONAJ + `SidePanelEvent.blocking` + gate Końca tury | `UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md` | Brak `onExecutePending` / `btn-wykonaj` w `hud.ts` (lane UI) |
| 2 | **A2-Q4** — panel jednostki [H] | `UI-do-MASTER_A2-Q4-panel-jednostki.md` | Brak modułu/komponentu do wpięcia w `main.ts` (klik jednostka → karta) |
| 3 | **B2-Q5** część 1 — chip 🔥 w `sidePanelHud` | `UI-do-GRUPA-A_B2-Q5-bunt-chip.md` | F dostarcza `getEvents()`; UI lane — styl/kind `revolt` jeśli potrzeba |

**Po GOTOWE od A:** F batch F-HUD-2 (1 batch `main.ts`).

---


## Grupa B — Miasto i ekonomia

### [2026-06-28] MACIEJ → Grupa B / EKONOMIA (via SILNIK)

**Od Macieja:** EKO-P2-01 tick B5 · B1 tech (po ABC) = **EKONOMIA** (czat **Civ-EKONOMIA**, `start`).  
**Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`

---

### [2026-06-27] Maciej — paczka ABC 5–14 (formularz)

Od: Maciej · **Grupa B** · formularz Cursor

| ID | Decyzja |
|----|---------|
| **B1-Q2** | **A** — Wykup zostaje (budynki + jednostki) |
| **B1-Q3** | **A** — Auto-zarządca ⚙ + widać ON/OFF |
| **B4-Q1** | **A** — Pełna sekcja Kultura v1.0 |
| **B4-Q2** | **A** — Religia w sekcji z kulturą v1.0 |
| **B5-Q1** | **A** — Suwak split w panelu, sekcja Imperium/wojsko |
| **B5-Q2** | **A** — Default 70% miasta / 30% państwo |
| **B1-Q11** | **A** — Wszystkie 15 ulepszeń → plony v1.0 |
| **B-Power-Q1** | **A** — Ludność vs max na mapie |
| **B-Power-Q2** | **B** — Miasta 50% + heksy terytorium 50% |
| **B-Power-Q3** | **A** — Gospodarka = dochód Pieniądz/t |

**Zapis:** `docs/decyzje/B-power-skladniki.md`, `B1-ulepszenia-plony.md`, `B1-panel-budowa.md`, `B4-wealth.md`, `B5-zywnosc.md`

**Następny lane:** handoffy EKONOMIA+UI → `→ SILNIK: GOTOWE` (kultura/religia UI, empire-food, tileYield×15, power API)

---

### [2026-06-27] Grupa B — paczka 5–14 lane GOTOWE → SILNIK

Od: Grupa B (EKONOMIA + UI) · **Decyzje Macieja zamknięte** (ABC 5–14)

**Zrobione (bez `main.ts`):**
- `terrain-improvements.ts`, `power.ts`, `empire-food.ts` (tick)
- `economy.ts` / `turn-economy.ts` — plony × 15 ulepszeń (B1-Q11=A)
- `cityPanel.ts` — auto-zarządca ⚙ ON/OFF, okolica 4 profile + 👤, kultura+religia, split imperium/wojsko
- `tools/grupa-b-lane-test.cjs`

**Handoff zbiorczy:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_GRUPA-B-batch-2026-06-27.md`

**Kolejność wpiecia Grupa F (6 batchy):**
1. F-B2-society-pct (`EKONOMIA+UI-do-SILNIK_B2-society-pct-batch.md`)
2. F-B5-empire-food
3. F-B-power
4. F-B4-kultura-religia
5. F-B1-okolica-ui
6. F-B1-improvements (weryfikacja)

**Bramka F:** `grupa-b-lane-test.cjs` + `society-breakdown-test.cjs` + `logic-test.cjs` → ROBOCZA → Master

→ **SILNIK: GOTOWE**  
→ **MASTER:** kanon po Opus + playtest Macieja

---

### [2026-06-27] Grupa B — fix zasięg + citySight → SILNIK (batch 7)

Od: Grupa B (EKONOMIA)

**Zrobione:** `okolica.ts` max(5,pop) · `citySightRadius` · `territory.ts` re-export · testy okolica + grupa-b · fix Grecy civ-bonusy

**Handoff F:** `EKONOMIA-do-SILNIK_city-sight-zasieg-batch.md` → **→ SILNIK: GOTOWE**

→ **Grupa F:** batch 7 w kolejce (po 1–6)

---

### [2026-06-27] AUDYT autonomiczny — porządki + raport

Od: Grupa B · **Bez Macieja** (sesja 2h)

**Zrobione:**
- Utworzono katalog roboczy **`docs/grupa-b/`** (README, STAN, AUDYT, USUNAC-KANDYDACI, PANEL-B-SPEC, handoff index)
- Audyt subagentów: historia decyzji B + luka okolica/ulepszenia
- Zaktualizowano: `B-OTWARTE-PYTANIA.md`, `EKONOMIA-STAN.md`, `B2-bunt-efekty-PLAN.md` (archiwum)
- Nowy: `docs/decyzje/B2-model-szczescie-procent.md` (propozycja B2-Q7-D)

**Do decyzji Macieja po powrocie:**
- `docs/grupa-b/USUNAC-KANDYDACI.md` — które pliki archiwizować/usunąć
- ABC: B2-Q7 (+ propozycja %), B1.4 (pola pracy), B2-Q8–Q9

**NIE ruszano:** `main.ts`, `Gra-podglad.html`, kod gry

→ Raport: **`docs/grupa-b/AUDYT-2026-06-27.md`**

---

### [2026-06-27] B2-Q5 = C — alert buntu (chip + ikona heks)

Od: Maciej · **B2-Q5=C**

**Decyzja:** chip `🔥 Bunt: [miasto]` w panelu wydarzeń **oraz** ikona 🔥 na heksie miasta (do końca tury).

**Handoffy:**
- `dyspozycje/_handoff/UI-do-GRUPA-A_B2-Q5-bunt-chip.md` (część 1 — Grupa A)
- `dyspozycje/_handoff/MAPA-do-SILNIK_B2-Q5-bunt-hex.md` (część 2 — MAPA + SILNIK)

**Paczka B2 Macieja:** **ZAMKNIĘTA** (Q1…Q6).

→ **Grupa A:** chip w `sidePanelHud`  
→ **MAPA:** overlay w `cities.ts`  
→ **SILNIK:** `getEvents` + `getRevolt` w main (po batch B2-porzadek)

### [2026-06-27] F → Grupa B/MAPA: status B2-Q5

Od: Grupa F

**SILNIK (B2-porzadek):** ✅ migracja buntu, `cityOrderState.bunt`, **`getEvents()`** chipów w HUD.  
**SILNIK:** ⏳ **`getRevolt` w `_cityRenderOpts`** — **CZEKA MAPA** (`getRevolt` w `CityRenderOptions` + overlay 🔥 w `cities.ts`).  
Handoff: `MAPA-do-SILNIK_B2-Q5-bunt-hex.md` — flaga nadal **CZEKA MAPA**.

---

### [2026-06-27] B2-Q6 + kary Porządku — lane GOTOWE → SILNIK

Od: Grupa B (EKONOMIA + UI) · Decyzje Macieja **zamknięte** (nie pytaj ponownie)

**Zrobione (bez `main.ts`):**
- `order.ts` — kary Pieniądz/Nauka/Kultura, `ryzyko_buntu` 5%, `orderEffectsToYieldMults`, `pickRevoltMigrationTarget`
- `society-params.json` — nowe klucze kara + ryzyko 0.05 normal
- `turn-economy.ts` — param `orderMultByCity` (mnożniki plonów jak `growthMult`)
- `logic-test.cjs` — assercje B2

**Handoff:** `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_B2-porzadek-komplet.md`

**SILNIK w main.ts:** `orderMultMap`, migracja zamiast −1 pop vanish, `porzadek: ord.order`, usuń podwójny `* productionMult` na praca.

→ **SILNIK: GOTOWE DO WPIĘCIA** (batch B2-porzadek → ROBOCZA → raport MASTER)  
→ **MASTER:** kanon po Opus  
→ **B2-Q5** (chip mapa): nadal OTWARTE → Grupa A

---

### [2026-06-26] B2 — IMPLEMENTACJA UI społeczeństwo (sesja autonomiczna)

Od: Grupa B · **Bez Macieja na końcu sesji** (prowizoryczne Q4/Q5)

**Zrobione (lane UI + export EKONOMIA):**
- `cityPanel.ts` — lewa kolumna: Mieszkańcy (B2-Q1=A), Porządek inline (B2-Q2=B), Zdrowie +/- (B2-Q3=A)
- Usunięci Specjaliści (**B2-Q4=C prowizorycznie**)
- `orderPanel.ts` — eksport `buildOrderSectionHtml` (współdzielony HTML)
- `turn-economy.ts` — eksport `computeCityHealthBreakdown`
- Backup: `cityPanel.ts.bak-UI-20260626`
- Typecheck: `tsc --noEmit` OK (lokalnie)

**Decyzje agenta (DO POTWIERDZENIA / wycofania):**
- B2-Q4 = **C** (usuń specjalistów)
- B2-Q5 = **A** (chip buntu na mapie → Grupa A)

**Handoffy:**
- `dyspozycje/_handoff/UI-do-MASTER_B2-spoleczenstwo.md` — haki `getOrderState`, `getCityHealth` w main.ts
- `dyspozycje/_handoff/UI-do-GRUPA-A_B2-Q5-bunt-chip.md`

**NIE ruszano:** `main.ts`, `Gra-podglad.html`

→ SILNIK: **CZEKA** wpięcie haków + build kanon  
→ Grupa A: **CZEKA** chip buntu (po SILNIK)

---

### [2026-06-26] B2-Q3 — Zdrowie = A

Od: Grupa B · Decyzja: **B2-Q3=A** (osobna sekcja Zdrowie, lewa kolumna, rozpiska +/-)
→ SILNIK: **CZEKA**

---

### [2026-06-26] B2-Q2 — Porządek = B

Od: Grupa B · Decyzja: **B2-Q2=B** (pełna sekcja porządku zawsze widoczna, lewa kolumna)
→ SILNIK: **CZEKA** (kod po B2-Q3…Q5)

---

### [2026-06-26] B2-Q1 — Mieszkańcy 3 koszyki = A

Od: Grupa B · Decyzja Macieja: **B2-Q1=A** (emotikony + liczby, prawdziwe dane z silnika)
Zrobione: zapis `docs/decyzje/B2-spoleczenstwo.md`
Testy: —
Otwarte: B2-Q2…Q5
→ SILNIK: **CZEKA** (kod UI po pełnym ABC B2)

---

### [2026-06-26] B2 — paczka pytań wysłana

Od: Grupa B · B2-Q1…Q5 wysłane · Q1 zamknięte powyżej

---

## Grupa C — Walka

### [2026-06-27] Maciej — deployment Z WALKI → NA MAPĘ (korekta C1-Q3)

**Decyzja Maciej (Master):** Faza **rozstawiania / „free movement" na polu bitwy 3D** (deployment w `battleScene`) **nie należy do Walki (C2)**.  
**Pozycjonowanie przed walką** = **ruch jednostek na mapie świata** (miasto, heksy, zasięg) → **Grupa A (MAPA)**.

| Było (C1-Q3=A) | Teraz |
|----------------|--------|
| `BattleScene({ deploy: true })` — rozstawianie na kwadracie bitwy | **deploy wyłączone** — C2 startuje **od razu w walce** |
| Grupa C rozwija deployment w `battleScene.ts` | **STOP** — tylko kontrakt wejścia z mapy |

**Implikacja F:** po spec od A → `main.ts` **`deploy: false`** (batch po A-START / C1-rev).

**→ Grupa C (ten czat) — co robisz:**
1. **Nie** rozwijasz fazy deployment w `battleScene` (ani nowych ABC o rozstawianiu na polu bitwy).
2. **Czekasz** na bramkę / playtest **ROBOCZA** — testujesz **C2** (UX walki **po** wejściu Auto/Ręczna), nie mapę.
3. **C4** — jedyne otwarte ABC u Ciebie (balans **w trakcie** walki, `[EKRAN: Mapa bitwy]`).
4. **Handoff** (opcjonalnie, 1 plik): `dyspozycje/_handoff/C-do-MAPA_pozycje-przed-walka.md` — jakie dane z mapy przekazać do `BattleScene` (hex, skład D8).

**→ Grupa A:** przejmuje ustawianie jednostek przed starciem (ruch na mapie + C1 preBattle bez deploy).

**C1-Q1…Q5** nadal zamknięte · **Q3** implementacyjnie: pozycje z mapy (A2/A3), nie deploy C2 — patrz `C1-wejscie-walke.md`.

---

**Decyzja:** Wszystkie pytania **C3 (Q1…Q10)** = **mapa i strategia** → **MAPA / Grupa A**, nie Walka.  
**Grupa C** = **C1 preBattle** (auto vs ręczna) → **C2** → **C4** w walce.

**Przekaz dla MAPA:** `dyspozycje/_handoff/C3-do-MAPA_paczka-ABC-Q1-Q10.md`  
**Granica:** `docs/grupa-c/GRANICA-C-vs-MAPA.md`

**→ Grupa C:** nie pytaj C3; otwarte: **C4 balans bitwy**, playtest C1/C2 po ROBOCZA.

---

### [2026-06-27] Maciej — granica A vs C (korekta): preBattle = Grupa A

**Decyzja Macieja:** Ruch jednostek + **pre-battle (C1)** + **C3 oblężenie** = **Grupa A (mapa świata)**.  
**Grupa C (Walka)** = **tylko od wyboru Auto / Bitwa ręczna** → C2 + C4.

**Zapisano:** `docs/grupa-c/GRANICA-C-vs-MAPA.md` (nadpisuje „C1 = Grupa C").

**→ Grupa A:** C3-Q1…Q10, C1 preBattle, A1-Q17/Q18/A5-Q2 — pytania ABC w czacie mapy.  
**→ Grupa C:** C2-Q*, C4 balans — **nie** C3, **nie** preBattle.

---

### [2026-06-27] Maciej — granica zakresu: C3-Q1 → MAPA (archiwum — patrz korekta powyżej)

**Decyzja Macieja:** C3-Q1 (start oblężenia na mapie) = **temat MAPA / Grupa A**, nie Walka.  
**Grupa C zaczyna** od **planszy preBattle (C1)** — auto vs bitwa ręczna, Wycofaj, skład → C2/C4.

**Zapisano:**
- `docs/grupa-c/GRANICA-C-vs-MAPA.md`
- `docs/czaty/GRUPA-C-WALKA.md` (charter)
- Handoff dla MAPA: `dyspozycje/_handoff/C3-Q1-do-MAPA_start-oblezenia.md`

**→ MAPA (Grupa A):** zadaj Maciejowi **C3-Q1** (pełne ABC w handoffie).  
**→ Grupa C:** nie pytaj C3-Q1; otwarte u Ciebie: **C4 balans** (bitwa), ewent. doprecyzowania **C1/C2** po playteście ROBOCZA.

---

### [2026-06-26] C2-Q2 — minimapa w bitwie = A

Od: Grupa C  
Decyzja Macieja: **C2-Q2=A** (minimapa lewy-dół, TW: kropki jednostek, viewport, klik/drag = pan kamery)  
Zrobione: zapis `docs/decyzje/C2-ux-bitwy.md`; lane UNITS już ma kod zgodny z A (`battleScene.ts`, `battleMinimap.ts`)  
Testy: nie uruchomiono (sandbox)  
Otwarte: **C2-Q3, Q4, Q6, Q7** — lub skrót `akceptuję D5=B`  
→ SILNIK: **CZEKA** (pełny pakiet C2 przed kanonem bitwy)

---

### [2026-06-26] C2-Q3 — tooltip + panel = A

Od: Grupa C  
Decyzja Macieja: **C2-Q3=A** (hover 0,3 s: nazwa, typ, HP, morale, atk/obr; klik → panel ~220 px po prawej z rozkazami)  
Zrobione: zapis `C2-ux-bitwy.md`; lane UNITS zgodny (`battleScene.ts`)  
Testy: nie uruchomiono (sandbox)  
Otwarte: **C2-Q4, Q6, Q7**  
→ SILNIK: **CZEKA**

---

### [2026-06-26] C2-Q4 — górny pasek = A

Od: Grupa C  
Decyzja Macieja: **C2-Q4=A** (pełny pasek: faza, prędkość, morale×2, straty, pauza, pomiń/wyjście)  
Zrobione: zapis `C2-ux-bitwy.md`; lane UNITS zgodny (`battleScene.ts`)  
Testy: nie uruchomiono (sandbox)  
Otwarte: **C2-Q6, Q7**  
→ SILNIK: **CZEKA**

---

### [2026-06-26] C2-Q6 — styl ciemny+złoto = A

Od: Grupa C  
Decyzja Macieja: **C2-Q6=A** (ciemny granat + złoto, frakcje czerwony/niebieski, spójnie z preBattle/D1B)  
Zrobione: zapis `C2-ux-bitwy.md`; lane zgodny  
Testy: nie uruchomiono (sandbox)  
Otwarte: **C2-Q7** (ostatnie w C2)  
→ SILNIK: **CZEKA**

---

### [2026-06-26] C2 — ZAMKNIĘTE (Q7=A + efekty TW v1.0)

Od: Grupa C  
Decyzja Macieja: **C2-Q7=A** + efekty Total War w v1.0 (łuk/miecz, linie rozkazów, Ctrl+M / drag roster = scalanie rannych)  
Zrobione: `battleScene.ts` (UNITS), `C2-ux-bitwy.md`, backup `.bak-UNITS-20260626-twfx`  
Testy: nie uruchomiono (sandbox)  
→ **SILNIK: GOTOWE DO WPIĘCIA** (build + battle-smoke + Opus)

---

### [2026-06-26] C1-Q1 — kiedy preBattle (A + oblężenie)

Od: Grupa C  
Decyzja Macieja: **C1-Q1=A** — preBattle przy każdej **faktycznej bitwie** (gracz i wróg symetrycznie); **wyjątek:** oblężenie miasta **bez szturmu** → tylko mapa świata (C3), bez overlay  
Zrobione: `C1-wejscie-walke.md`, handoff `C1-do-MAPA_oblezenie-bez-preBattle.md`, `C1-PYTANIA-DO-SILNIKA.md`, link w `C3-obleczenie.md`  
Testy: —  
Otwarte: C1-Q2…Q5 · MAPA/C3 implementacja wizualna oblężenia  
→ SILNIK: **CZEKA** (routing Q1 w main.ts po panelu C3)

---

### [2026-06-26] C1-Q2 — mockup preBattle TW AKCEPTOWANY

Od: Grupa C  
Decyzja Macieja: **mockup OK** — layout Total War (`UI/Makieta-preBattle.html`, jedyny plik; stary `Civ-UNITS/` → redirect)  
Zrobione: scalony mockup, handoff `C1-do-UI_preBattle-TW-layout.md` → **GOTOWE** do portu `preBattle.ts`  
Otwarte: **C1-Q2b** (Enter) · **C1-Q3** deployment · **C1-Q4** skład · **C1-Q5** Wycofaj  
→ UI lane: implementacja `preBattle.ts` — **ZROBIONE** (moduł)

---

### [2026-06-26] C1 — preBattle.ts port TW (moduł UI)

Od: Grupa C / UI lane  
Zrobione: `preBattle.ts` layout TW, backup `.bak-UI-C1TW-20260626`, handoff `C1-do-SILNIK_preBattle-wpiecie.md`  
Testy: nie uruchomiono (brak node w sandbox)  
→ **Grupa F / F-C1:** moduł **GOTOWY**; `main.ts` **po ABC Macieja**

---

### [2026-06-26] Master — C1 handoff + zasada decyzji (Maciej)

Od: Grupa C → **Master Silnik**  
**Zasada Macieja (2026-06-26):** decyzje gameplay **wyłącznie ABC** — **nie pytaj ponownie**, jeśli już zamknięte.

**Zamknięte C1 (Maciej — nie pytać):**
| ID | Decyzja | Źródło |
|----|---------|--------|
| C1-Q1 | A + wyjątek oblężenie | ABC 2026-06-26 |
| C1-Q2 | TW mockup OK | akceptacja 2026-06-26 |
| C1-Q2b | **B** Enter=Bitwa ręczna | mockup |
| C1-Q3 | **A** zawsze deploy | D5=B |
| C1-Q4 | **A** pełny skład | D8=A |
| C1-Q5 | **A** Wycofaj bez strat | mockup |

**Deliverable Grupa C:** `preBattle.ts` TW layout — **GOTOWE**

**→ Grupa F / SILNIK:** `dyspozycje/_handoff/C1-do-SILNIK_batch-test.md`  
Test + dokończenie `main.ts` (Q4 multi-unit, Q2b opts) → `Gra-podglad-ROBOCZA.html` → **Master** → Opus → kanon.

---

## Grupa D — Nauka, dyplomacja, cywilizacja

### [2026-06-28] MACIEJ → Grupa D / CYWILIZACJE (via SILNIK)

**Od Macieja:** D-P0-01 Excel AI · E-P0-06 victory · barbarzyńcy · fix diplomacy 3 FAIL = **CYWILIZACJE** (czat **Civ-CYWILIZACJE**, `start`).  
**Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`

---

### [2026-06-27] **KOREKTA D3** — audiencja dyplomatyczna (Maciej playtest)

**Problem:** lista pokazuje tier/wojna/handel + duplikaty typów (Inkowie×N); nacje „niespotkane" widoczne.

**Kierunek Macieja:** lista = tylko spotkane + **Porozmawiaj/Nawiąż kontakt** → **ekran audiencji** (król vs król) → akcje TW/Civ.

**Spec + pakiet 12 akcji:** `docs/decyzje/D3-audiencja-dyplomacja.md`  
**ABC otwarte:** D3-Q2 (kiedy na liście), D3-Q3 (jeden wpis = co), D3-Q4 (akcje v1.0)

**BLOK:** SILNIK-D-P0-1 (stary panel) · handoffy: UI audiencja + SILNIK kontakty formalne

---

Od: Grupa D (Maciej: „pilnie do zadań / Silnika”)

**Zrobione (lane CYW/UI):**
| ID | Co | Status |
|----|-----|--------|
| P0-1 | Fix civ-bonusy (Celtowie atk) | **30/30 PASS** |
| P0-2/3 | `diplomacyPanel.ts` modal wojny + akcje 4B | **GOTOWE** |
| P0-4 | `sciencePicker.ts` filtr epoki D1-Q1 | **GOTOWE** (hook `getPlayerEra`) |
| P0-5 | `newGameFlow.ts` bonusy z `bonusy[]` | **GOTOWE** |
| P0-9 | E1 roster | **wpięte** (SILNIK) |

**→ Grupa F / SILNIK — WYKONAJ TERAZ:**
Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_F-GRUPA-D-P0-integracja.md`
- Batch **D-P0-1:** callbacki dyplomacji w `buildDiplomacyPanelConfig`
- Batch **D-P0-2:** `getPlayerEra` w `configureSciencePicker`
- Batch **D-P0-3:** bramka testów + build

**→ UNITS:** ~~bitwa 3D~~ **GOTOWE** — SILNIK batch **D-P0-4** (wiązanie bonusów w main.ts)

**→ UI (pozostałe):** preBattle bonusy — `UI.md` § P0-D4

**Backlog:** `dyspozycje/CYWILIZACJE-P0-BACKLOG.md`

---

### [2026-06-27] **P0 OD MASTERA:** D-START — klaster + miasta-kopie typu

Od: Master (czat Maciej) · **Decyzje ZAMKNIĘTE** — implementacja lane CYWILIZACJE

**Temat:** Model startu gry — miasta AI = **kopie typu cywilizacji** (nie osobne nacje). Symetria: Chińczycy na mapie = chiński klaster do podbicia. AI **defensywne** (bez ekspansji). Nazwy z `nazwyKlastra`. Dyplomacja warstwowa (klaster vs obcy typ).

**START Grupa D:** `docs/grupa-d/OD-MASTERA-D-START-HANDOFF.md` (wklejka na otwarcie czatu)

| Dokument | Rola |
|----------|------|
| `docs/decyzje/D-START-miasta-kopie-typu.md` | Kanon produktowy |
| `docs/decyzje/D-START-klaster-nazwy.md` | Nazwy + D-START-1B/2B/3A |
| `docs/grupa-d/MODELE-MIAST-TYPU.md` | Charter Grupa D |
| `dyspozycje/CYWILIZACJE.md` § P0 | Dyspozycja lane |
| `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_miasta-kopie-typu.md` | Handoff |

**Co Master już zrobił:** `civ-names.ts`, `cluster-spawn.ts`, `cluster-start.ts`, `diplomacy-layers.ts`, wpięcie `main.ts` (klaster gracza + N rywali + UI dyplomacji). Testy ZIELONE.

**Co Grupa D robi teraz:**
1. Profil AI `kopia_typu_obronna` (AI-zachowanie / `ai.ts`)
2. Audyt bonusów per `ikonaId`
3. Koordynacja MAPA: pełny spawn obcych klastrów (handoff)
4. Meldunek: `CYWILIZACJE-DO-MASTERA.md`

**Archiwum sesji Master:** `docs/archiwum-czatow/master/MASTER-D-START-klaster_2026-06-27.md`

**Flaga:** **ROBIĄ Grupa D** · SILNIK czeka na handoff AI + MAPA spawn

---

### [2026-06-27] E1 → Grupa D: **cywilizacje startowe** (roster 9 + skala mapy)

Od: Grupa E / Maciej · ABC **4=A** + uwaga przy **3=A**

**Temat:** gracz + AI z rosteru **9 typów** (`civs.json`); **mała mapa = proporcjonalnie mniej typów**, nie 9. Wybór liczby rywali w menu **±1** (4=A) — bez zmiany; do domknięcia: **które typy AI**, unikalność, spójność MAPA/AI.

**Handoff:** `docs/grupa-e/handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`  
**Heurystyka dziś:** `newGameMapDefaults.ts` — aktywne typy 3/5/7/9, rywale 2/4/6/8.  
**→ Grupa D:** audyt + implementacja + raport § D · potem SILNIK batch E1 jeśli wymaga `main.ts`.

---

### [2026-06-26] D4-RDY01 — bonusy cywilizacji: delegacja do lane'ów (Master → UNITS/EKONOMIA/UI/SILNIK)

Od: Grupa D · Decyzja Macieja: **wdrażaj efekty teraz**; Excel (`Panel-efekty-cyw-dyplomacja.xlsx`) poprawi później — napisze gdy zmieni

**Model:** `civs.json` → `bonusy[]` per nacja; pole **`realizuje`** routuje lane (walka→UNITS, ekonomia/miasto→EKONOMIA, wyświetlanie→UI, wiązanie→SILNIK).

**Zrobione (RDY-01 częściowo):**
- `gra/src/game/civ-bonuses.ts` — kontrakt walki + ulga budynków
- EKONOMIA: handel, nauka, rekrutacja, koszt budynków (`economy.ts`, `turn-economy.ts`, `production.ts`)
- SILNIK: auto-resolve mapy + `getCivBonusy` w panelu miasta (częściowo)
- Test: `gra/tools/civ-bonusy-test.cjs`

**TODO per lane (Master rozsyla):**
| Lane | Batch |
|------|--------|
| **CYWILIZACJE** | `export-bonusy-cyw.py` (Excel → JSON) |
| **UNITS** | bitwa 3D (`battleScene`, `manualBattle`) + jednostki spec. w produkcji |
| **EKONOMIA** | regresja RDY-01 (implementacja gotowa) |
| **UI** | bonusy w newGameFlow + preBattle |
| **SILNIK** | dokończyć wiązania ownerId→bonusy (bez nowej logiki) |

**Handoff hub:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_bonusy-RDY01-delegacja.md`  
**Handoffy lane:** `…-do-UNITS_bonusy-walka-bitwa-jednostki-spec.md`, `…-do-EKONOMIA_bonusy-ekonomia-miasto.md`, `…-do-UI_bonusy-wyswietlanie.md`  
**Excel kanon:** `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` → „Bonusy cywilizacji”

→ **MASTER:** rozdać dyspozycje w `UNITS.md` / `UI.md`; CYW zlecić export; **SILNIK** tylko integracja

---

### [2026-06-27] Paczka ABC Grupa D — decyzje Macieja (1A–7B)

**Odpowiedź:** `1A, 2A, 3A, 4C, 5A, 6A, 7B`

| # | Decyzja | Skutek |
|---|---------|--------|
| **1A** | Modal potwierdzenia wojny | Handoff UI: `…-do-UI_dyplomacja-D3Q1-modal.md` |
| **2A** | JSON bonusów bez zmian; Excel później | Brak `export-bonusy-cyw.py` do „Excel OK" |
| **3A** | Pełne bonusy v1.0 | Master: UNITS (bitwa 3D + jedn. spec.) + UI (newGame, preBattle) **P1** |
| **4C** | Porządki plików | lock usunięty; PROPOZYCJA → `_archiwum/`; `_scalone/` = historia |
| **5A** | AI arkusze — wartości startowe od CYW | TODO lane: wypełnić 3 arkusze w `Cywilizacje.xlsx` |
| **6A** | Religie 9/9 | `society-params.json` + Celtowie + Germanie |
| **7B** | Testy → Master bramka | Handoff: `…-do-MASTER_testy-grupa-d-bramka.md` |

**→ Grupa F / Master Silnik:** uruchomić w bramce ROBOCZA:

```powershell
cd gra
node tools/civ-bonusy-test.cjs
node tools/diplomacy-test.cjs
node tools/ai-test.cjs
```

Plik decyzji: `docs/decyzje/GRUPA-D-PACZKA-ABC-2026-06-27.md`

---

### [2026-06-27] TESTY-GR-D: CZĘŚCIOWE (Grupa F, bramka 7B)

Od: Grupa F (dyspozycja Master `OD-MASTERA` § F)

| Suite | Wynik |
|-------|-------|
| diplomacy-test | **133/133 ZIELONE** |
| ai-test | **188/188 ZIELONE** |
| research-test | **33/33 ZIELONE** |
| civ-bonusy-test | **26 PASS, 4 FAIL** |

**FAIL (lane CYWILIZACJE/EKONOMIA):** Grecy handelBrutto×2, Celtowie szarza atk/uderzenie — szczegóły w `SILNIK-DO-MASTERA.md` § TESTY-GR-D.

**→ MASTER:** eskalacja CYWILIZACJE · Opus ROBOCZA może iść równolegle lub czeka fix bonusów (decyzja Mastera)

--- · **Raport:** `AUDYT-GRUPA-D-2026-06-26.md` · **Kandydaci usunięcia:** `PLIKI-DO-USUNIECIA.md`

**Zaktualizowano:** `export-bonusy-cyw.py`, `sync-panel-efekty-from-json.py`, `CYWILIZACJE-STAN.md`, `docs/decyzje/STATUS.md`, `D4-bonusy-cyw.md` (Excel OK flow).

**Blokada:** `Panel-efekty-cyw-dyplomacja.xlsx` zablokowany (otwarty u Macieja) — sync/regeneracja wide odłożona.

**Jedyna otwarta decyzja Gr-D:** **D3-Q1** (potwierdzenie wojny).

---

**Plik dla Macieja:** `Civ-CYWILIZACJE/Bonusy-cywilizacji-9x3.xlsx` (9 nacji, 27 bonusów).  
**Kanon review (preferowany):** `Panel-efekty-cyw-dyplomacja.xlsx`.  
Generator wide: `gra/tools/gen-bonusy-cyw-xlsx.py`. Implementacja **w toku** — patrz wpis D4-RDY01 powyżej.

---

## Grupa E — Meta / start / AI

### [2026-06-28] MACIEJ → Grupa E / UI (via SILNIK)

**Od Macieja:** E-P0-01…03 menu S0 = **UI** (czat **Civ-UI**, `start`).  
**Manifest:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`

---

### [2026-06-27] EKONOMIA → E — start meta + zasięg/mgła (decyzja Macieja)

Od: Grupa B (EKONOMIA) · **Decyzja Macieja: Spec**

**Dla kreatora / `doStartGame`:**
- Mapa czarna → tymczasowy krąg **5 heksów** wokół hexu startu (wybór miasta)
- Po założeniu miasta (pop 1): widok **5 heksów** od miasta; rośnie z populacją
- Spójność z A-START-01…05 (implementacja mapy u **Grupy A**)

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-GRUPA-E_start-zasieg-fog.md`  
**Decyzja:** `docs/decyzje/B-zasieg-miasta-fog.md`

→ **Grupa E: CZEKA** (kontrakt kreatora + uzupełnienie handoff F §3)  
→ **Grupa A + F:** wpięcie fog po lane

---

### [2026-06-27] PLAYTEST Macieja — UX kreatora (kroki 2–5)

Od: Maciej (playtest `Gra-podglad-ROBOCZA.html`) · Master Silnik → routing

**[EKRAN: Menu — Kreator nowej gry]**

| # | Uwaga | Routing |
|---|--------|---------|
| **E1-UX-01** | Pasek nawigacji dolny (`← WSTECZ` · `KROK X Z 5` · `DALEJ →`) jest **za daleko** od treści kroku. Dotyczy **wszystkich kroków poza INTRO** — potwierdzone playtestem: **krok 2 Cywilizacja**, **krok 3 Epoka**, **krok 4 Ustawienia rozgrywki** (+ krok 5 jeśli ten sam layout). Górny stepper OK na kroku 1. Dolna nawigacja + „KROK X Z 5” (+ ewent. `ROZPOCZNIJ GRĘ` na kroku 4) **tuż nad/pod** kartami wyboru. | **→ Grupa E** (lane **UI**, `gra/src/ui/newGameFlow.ts`) → po fix `→ SILNIK: GOTOWE` → F bramka |

### [2026-06-27] Playtest Maciej — potwierdzenie krok 2 (screen)

**Krok 2 CYWILIZACJA:** dolna nawigacja (`WSTECZ` / `KROK 2 Z 5` / `DALEJ`) **nadal za nisko** — duża pusta przestrzeń między siatką cywilizacji + panelem opisu a stopką. **Nie Grupa A** — **Grupa E** (`newGameFlow.ts`). Status: **nadal NIE NAPRAWIONE** (oczekiwane — fix u E).


**Nie F** (to layout modułu UI, nie wpięcie `main.ts`).

*(E1-START-02 / start mapy — przeniesione do Grupy A, tabela A-START-01…05 w `DO-MASTERA`.)*

---

### [2026-06-26] E1 — decyzje Macieja (defaulty nowej gry)

Decyzje zapisane: `docs/decyzje/E1-nowa-gra.md`

Skrót: Rzym default · Kamień default (Brąz wybór) · Normal · **Standardowy** map · rywale **skala MAPA** (std→6 AI / 7 typów) · typ świata **4×** (Kontynenty default + Pangea/Wyspy/**Ziemia** nowy). Menu główne (Kampania/Multi/media) — wizja, ABC Q6–Q8 czeka.

→ SILNIK: **CZEKA** (UI+MAPA lane przed wpięciem main.ts)

---

### [2026-06-26] E1 — lane UI+MAPA WYKONANE

Od: Grupa E · Implementacja defaultów kreatora (bez `main.ts`)

Zrobione:
- UI: `newGameFlow.ts` — default Rzymianie (`ikonaId`), epoka Kamień, typ świata, skala rywali
- UI: `ui-params.json` — pole `world_type` (4 opcje)
- MAPA: `TypSwiata` + `ziemia` + `landMaskZiemia`, `newGameMapDefaults.ts`
- Handoff: `dyspozycje/_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md`

→ **SILNIK: GOTOWE DO WPIĘCIA** (`main.ts`: typ mapy, seed, epoka Brąz)

---

### [2026-06-26] E1 — SILNIK wpięty (main.ts batch)

Od: Grupa E / Master · Autonomiczna sesja (Maciej offline)

Wpięte w `main.ts`:
- `generateMap(w,h,seed,typSwiata)` — seed z kreatora, typ z menu (w tym Ziemia)
- `player.era` z `epochId` (kamien=1, braz=2)
- Reset skarbiec/nauka/zbadane przy nowej grze
- Defaulty boot: rzymianie, Standardowy

Backup: `gra/src/main.ts.bak-SILNIK-E1-20260626`

Testy: **Maciej lokalnie** (tsc + smoke + build kanon)

→ Kanon: **CZEKA** build + Opus

---

### [2026-06-26] E1 — przekaz do Master Silnika (Maciej)

Od: Grupa E · Maciej: **„Wyślij do Mastera"** · **decyzje gameplay tylko ABC**

**Reguła potwierdzona:** Maciej decyduje **wyłącznie** przez format ABC (gameplay). Agent **nie** podejmuje sam decyzji D1–D4 poniżej — kod wpięty **provisional**, czeka ABC.

**Gotowe do bramki (zatwierdzone E1 Macieja):**
- UI+MAPA: kreator defaulty, typ świata ×4, skala rywali, `ikonaId`
- SILNIK: `generateMap(w,h,seed,typSwiata)`, seed z kreatora, `civId=rzymianie`

**Wpięte bez ABC — Master przedstawia Maciejowi paczkę:**
- `docs/decyzje/E1-PYTANIA-DO-SILNIKA.md` → **E1-Q9…Q12** (reset gracza, Brąz+tech, kształt Ziemi, zakres rywali)

**Master wykonuje (bez ABC):**
1. Bramka: tsc + smoke + build → `Gra-podglad-TEST.html`
2. Po ABC Macieja (Q9–Q12): jeden batch korekty `main.ts` / MAPA
3. Opus → kanon `Gra-podglad.html`

**Pliki:** handoff `_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md` · backup `main.ts.bak-SILNIK-E1-20260626` (jeśli brak — git diff)

→ **SILNIK: GOTOWE-TEST** po bramce · **ABC Q9–Q12 OTWARTE** u Macieja

---

### [2026-06-26] E1-Q9…Q12 — paczka ABC wysłana Maciejowi

Od: Grupa E

**Wysłane w czacie E:** E1-Q9, Q10, Q11, Q12 — `docs/decyzje/E1-PYTANIA-DO-SILNIKA.md`  
**Czeka:** litery Macieja → zapis `E1-nowa-gra.md` → batch korekty **Grupa F**

**Informacja dla Silnika — już zrobione:** UI+MAPA+`main.ts` E1 (Rzym, seed, typSwiata, eraId, kreator)  
**Silnik — do wykonania:** (1) bramka TEST (2) po ABC korekta Q9–Q12 (3) Opus → kanon  
**Później:** E1-Q6…Q8 menu główne

→ **SILNIK: CZEKA ABC Q9–Q12** · bramka F-E1 równolegle OK

---

### [2026-06-27] E1 — audyt + katalog roboczy `docs/grupa-e/`

Od: Grupa E · sesja autonomiczna (Maciej offline)

**Uporządkowano:**
- Nowy katalog **`docs/grupa-e/`** (decyzje, handoff, audyt, spec paneli)
- Stuby **E2**, **E3** · indeks **E1-pytania-abc.md**
- Redirecty z `docs/decyzje/E1-*` → grupo-e
- **`AUDYT-2026-06-27.md`**, **`USUNAC-KANDYDACI.md`**
- Skrypt **`gra/tools/append-e1-status-xlsx.py`** (Status tracker)
- KARTA D13 + STATUS zaktualizowane

**Silnik — informacja (zrobione):** UI+MAPA+main.ts E1  
**Silnik — do wykonania:** bramka TEST · batch po ABC Q9–Q12 · Opus → kanon

**Czeka Maciej:** Q9–Q12 · potem Q6–Q8

→ Master: **`czaty`** · czytaj `docs/grupa-e/AUDYT-2026-06-27.md`

---

### [2026-06-27] E1 — paczka ABC **1–12** (blokery)

Plik: `docs/grupa-e/decyzje/PACZKA-ABC-BLOKERY.md`  
Odpowiedź Macieja: `1=A 2=B …` · **Priorytet SILNIK:** pytania **1–4**

→ **SILNIK: CZEKA ABC 1–4** przed kanonem produktowym

---

### [2026-06-26] F1 — audyt (przed utworzeniem charteru F)

### [2026-06-26] F1 — save/load + audyt B3 — WYKONANE

Od: Grupa F (integracja silnik)
Zrobione: `restoreGameFromSave()`, `ensureCityPodzialDefaults`, parity Ctrl+L/doLoadGame, audyt B3 OK
Testy: **Maciej lokalnie** (typecheck + wire-ekonomia + build)
→ **SILNIK: GOTOWE DO BRAMKI** — kanon po PASS

Szczegóły: `dyspozycje/SILNIK-DO-MASTERA.md` § batch 1 WYKONANE

*(Grupa F dopisuje nowe wpisy poniżej po każdym batchu)*

### [2026-06-27] → MASTER: PLAYTEST OK — ROBOCZA `6aedd5ce…`

Od: Grupa F · **Maciej: playtest OK**

```
→ MASTER: PLAYTEST OK — eskalacja Opus → kanon
Wersja robocza: Gra-podglad-ROBOCZA.html (md5: 6aedd5ce5bd4f5fc1cb0f5577d2385bc)
PLAYTEST: Gra-podglad-PLAYTEST-WALKA.html (md5: 6aedd5ce5bd4f5fc1cb0f5577d2385bc)
```

**Batch:** A-FOG-Q1B · E1-roster · Grupa B batch 2–7 (empire-food, power, kultura/religia, okolica, citySight, C1)  
**→ MASTER:** Opus review → publish kanon · F kolejka **PUSTA**

### [2026-06-27] → MASTER: GOTOWE-ROBOCZA (P1 batch)

Od: Grupa F (autonomiczna sesja)

```
→ MASTER: GOTOWE-ROBOCZA
Wersja robocza: Gra-podglad-ROBOCZA.html (md5: 365ba2835e1dc6391124458763dfc9c7)
PLAYTEST: Gra-podglad-PLAYTEST-WALKA.html (md5: 365ba2835e1dc6391124458763dfc9c7)
```

**Batch:** F-B2-society-pct · F-E1 grantTech · F-PROD-SPAWN  
**Testy:** wire 29/29 · logic 195/195 · combat 6/6 · society 18/18 · diplomacy 133/133 · ai 188/188 · smoke OK · battle-smoke OK · civ-bonusy 26/4 FAIL (D)  
**Backup:** `main.ts.bak-SILNIK-20260627-P1-batch`  
**→ MASTER:** Opus review → kanon · playtest Maciej

### [2026-06-27] Master → Grupa F: **P0 KOLEJKA OTWARTA** (playtest Maciej)

**Przyczyna:** kolejka F była zamknięta jako „PUSTA” mimo otwartych bugów Macieja — **błąd Mastera**.

**F MUSI wykonać (plik operacyjny):** `dyspozycje/F-KOLEJKA-P0.md`

| ID | Zadanie |
|----|---------|
| F-P0-01 | Bramka + publish ROBOCZA + PLAYTEST-WALKA |
| F-P0-02 | A-START: 0 jednostek, Załóż miasto, fog rzeki, minimap fog, brak przegranej t1, diplo |
| F-P0-03 | Playtest walki na mapie |
| F-P0-04 | `→ MASTER: GOTOWE-ROBOCZA` + md5 |

**Kod A-START / PLAYTEST może być już w `main.ts`** — F **weryfikuje buildem**, nie zakłada „zrobione”.

**Maciej:** czeka na **potwierdzony** build od F, nie na słowa Mastera.

### [2026-06-26] F2 — migracja wealth + AI trudność + mury — WYKONANE

Od: Grupa F (integracja silnik, sesja autonomiczna)
Zrobione:
- `ensureCitySaveDefaults()` w `cities.ts` (podział + `wealthState` na starych zapisach)
- `restoreGameFromSave`: `ensureCitySaveDefaults`, migracja `maMur` z `cityBuilt['mury']`
- AI: `poziomTrudnosci` w `decideAITurn` opts z `_menuDifficulty`
- Mury: `city.maMur=true` po ukończeniu budynku `mury` (tick produkcji + rushBuy)
- Parity drugiego `configureCityPanel` (NewGame): onChange, onAutoManage, pełny onRushBuy, updateHud, getCivBonusy
Testy: **Maciej lokalnie** — brak `node`/`npm` w środowisku Cursor
→ **SILNIK: GOTOWE DO BRAMKI** — `Gra-podglad-TEST.html` po PASS (nie kanon)

Backup: `gra/src/main.ts.bak-SILNIK-2026-06-26-batch2`
Szczegóły: `dyspozycje/SILNIK-DO-MASTERA.md` § batch 2

**NIE ruszano:** hud.ts, advanceEmpireFood, C2, E1-Q1…Q5 bez ABC Macieja.

### [2026-06-27] F-A1/A2 — generujSwiat w doStartGame — KOD OK, BRAMKA BLOK

Od: Grupa F (integracja silnik)
Zrobione:
- `doStartGame`: `rozmiarFromMenuLabel(_menuMapSize)` + `generujSwiat(newSeed, rozmiar, _menuTypSwiata)` z `./map/generator`
- Mapowanie menu → `RozmiarSwiata` (malenki/maly/standardowy/duzy/ogromny) zgodne z `ROZMIAR_DIMS`
- `_menuTypSwiata` bez zmian
Backup: `gra/src/main.ts.bak-SILNIK-20260627-generujSwiat`
Testy: **BLOK** — brak `node`/`npm`/`npx` w PATH środowiska agenta Cursor
→ **MASTER: BLOK BRAMKA** — kod gotowy; typecheck + wire-ekonomia + smoke + vite build wymagają terminala Macieja z Node. Po PASS: `Gra-podglad-TEST.html` + md5.

Szczegóły: `dyspozycje/SILNIK-DO-MASTERA.md` § 2026-06-27 BATCH F-A1/A2

### [2026-06-27] F-B2 + F-C1 — społeczeństwo + preBattle — KOD OK, BRAMKA CZEKA

Od: Grupa F (Master routing po `czaty`)
Zrobione:
- **F-B2:** `cityOrderState` Map, tick per tura, `getOrderState` + `getCityHealth` w obu `configureCityPanel`
- **F-C1:** `doQuickSave`, `onSave` w preBattle, map-click → `BattleScene({ deploy: true })`, test battle deploy
Backup: `gra/src/main.ts.bak-SILNIK-20260627-F-B2-C1`
Testy: **CZEKA** — bramka P0 (`bramka-test-publish.ps1`)
→ **MASTER: BLOK BRAMKA** — jeden TEST dla F1+F-A2+B2+C1 po PASS

Szczegóły: `dyspozycje/SILNIK-DO-MASTERA.md` § 2026-06-27 F-B2+C1

### [2026-06-26] F-C1 dokończenie — handoff Grupa C

Od: Grupa C → Grupa F  
Decyzje: C1-Q1…Q5 **ZAMKNIĘTE** — nie pytaj Macieja (`C1-wejscie-walke.md`)  
UI: `preBattle.ts` TW GOTOWE  
Handoff: `C1-do-SILNIK_batch-test.md` — Q4 multi-unit, Q2b opts, bramka  
→ **MASTER:** `Gra-podglad-ROBOCZA.html` po PASS → Opus → kanon

### [2026-06-27] F-C1 + F-HUD — KOD OK, BRAMKA BLOK (npm)

Od: Grupa F (sesja autonomiczna — wdrożenie zamkniętych decyzji A–E bez ponownych ABC)

**F-C1 dokończenie** (`C1-do-SILNIK_batch-test.md`, decyzje zamknięte):
- `defaultAction: 'manual'` (mapa + test T)
- Skład multi-unit Q4/D8=A: `collectBattleRoster` (hexDistance ≤ 1, ten sam owner)
- Q5 onCancel: tylko zamknięcie overlay — bez czyszczenia `reachable`/selection
- Sync po TW: `applyMapBattleOutcome` + `BattleResult.survivors`

**F-HUD** (ABC1=A, handoffy UI):
- Wpięcie `hud.ts`: pasek zasobów D1B, minimapa (wariant B `getMinimapData`), chipy wojen A1-Q5
- Ukryty legacy `#hud`, `#nauka-btn`, `#diplo-btn`
- `onEndTurn` → KeyN; nauka/dyplomacja z HUD

Backup: `gra/src/main.ts.bak-SILNIK-20260627-F-C1-HUD`  
Testy: **BLOK** — brak Node/npm w PATH środowiska agenta  
→ **MASTER: BLOK BRAMKA** — Maciej lokalnie: `cd gra; .\tools\bramka-test-publish.ps1`  
Po PASS dopisać: `→ MASTER: GOTOWE-ROBOCZA` + md5

Szczegóły: `dyspozycje/SILNIK-DO-MASTERA.md` § 2026-06-27 F-C1+F-HUD

**NIE wpinano:** F-C2, F-D4, A1-Q9 gate, A2-Q4 panel jednostki, B2-Q5 chip (czeka A+MAPA)

### [2026-06-27] F-B2-porzadek — KOD OK, BRAMKA BLOK

Od: Grupa F  
Zrobione: orderMultMap, migracja buntu, porzadek w UI state, kary yield następna tura  
Backup: `main.ts.bak-SILNIK-20260627-B2-porzadek`  
→ **MASTER:** bramka → ROBOCZA

### [2026-06-27] F-B2-Q5 hex + A1-Q5 wywiad — wpięte

**Od:** Grupa F  
- `getRevolt` w `_cityRenderOpts` + sprite 🔥 w `cities.ts` (handoff MAPA-do-SILNIK_B2-Q5)  
- `getKnownWarsBetweenOthers` w panelu dyplomacji (A1-Q5)  
- **F-C2:** już w kodzie (BattleScene deploy + survivors) — brak nowego diffu UNITS  

**→ MASTER:** cały kod F **GOTOWY DO BRAMKI** · testy = Node lokalnie

---

### [2026-06-27 ~21:40] → MASTER: GOTOWE-ROBOCZA (Grupa B batch 2–7)

Od: Grupa F (autonomiczna sesja)

```
→ MASTER: GOTOWE-ROBOCZA
Wersja robocza: Gra-podglad-ROBOCZA.html (md5: 6aedd5ce5bd4f5fc1cb0f5577d2385bc)
```

**Testy:** grupa-b-lane 11/12 · society 18/18 · okolica 18/18 · logic 194/195 · smoke OK · battle-smoke OK  
**Batchy:** empire-food · power · kultura/religia panel · okolica UI · citySight · C1 zamknięty  
**→ MASTER:** playtest Maciej (panel B) · Opus → kanon

---

### [2026-06-27 ~21:10] → MASTER: GOTOWE-ROBOCZA (A-FOG + E1-roster)

Od: Grupa F (poll handoffów + wpięcie)

```
→ MASTER: GOTOWE-ROBOCZA
Wersja robocza: Gra-podglad-ROBOCZA.html (md5: eada39d752b561d7779ae8813b03e85d)
```

**Testy:** civ-roster 11/11 · logic 195/195 · smoke OK · battle-smoke OK  
**Batchy:** A-FOG-Q1B (mgła per typ jednostki) · E1-roster (deterministyczne przypisanie cywilizacji AI)  
**Backup:** `main.ts.bak-SILNIK-20260627-A-FOG-roster`  
**→ MASTER:** playtest Maciej (zasięg mgły + roster AI) · Opus → kanon · **F czeka:** Grupa B batch 2–5 · ui-flow/mgła-ghost weryfikacja

---

### [2026-06-27] → MASTER: GOTOWE-ROBOCZA

Od: Grupa F

```
→ MASTER: GOTOWE-ROBOCZA
Wersja robocza: Gra-podglad-ROBOCZA.html (md5: d11f2479ac20158d38d3ba6e2ac3f253)
```

**Testy:** wire 29/29 · logic 195/195 · combat 6/6 · smoke OK · battle-smoke OK  
**Batchy w ROBOCZA:** F1–F2, F-A2, F-B2, F-C1, F-C2, F-HUD 1–2, F-HUD-2, B2-porzadek, B2-Q5 hex, A1-Q5 wywiad  
**Fixy poza main.ts:** cityPanel (dup import), hud (typy), combat (`defAtak0`) — lane UI/UNITS powinny zreviewować  
**→ MASTER:** Opus review → kanon · **F czeka na dyspozycję**

---

### [2026-06-27] F-HUD-2 — D1B batch WPIĘTE (KOD OK, BRAMKA CZEKA)

Od: Grupa F  
Handoff: `UI-MAPA-do-SILNIK_D1B-A4-batch.md`  
Zrobione: toolbar [C], WYKONAJ + brama tury, panel jednostki [H], tryb budowy A4 + `improvement-build`  
Backup: `main.ts.bak-SILNIK-20260627-F-HUD-2`  
→ **MASTER: BLOK BRAMKA** — `gra/tools/bramka-test-publish.ps1` → `GOTOWE-ROBOCZA`

### [2026-06-27] F → MASTER: prośby i stan kolejki

Od: Grupa F

| Priorytet | Prośba | Kto |
|-----------|--------|-----|
| **P0** | Bramka → `Gra-podglad-ROBOCZA.html` + md5 → Opus | **Master** (Node; agent F bez npm) |
| **P1** | F-C2 bitwa TW | F (UNITS GOTOWE) |
| **P1** | F-HUD-2 (A2-Q4, A1-Q9) | **→ SILNIK GOTOWE** (UI lane) — `UI-MAPA-do-SILNIK_D1B-A4-batch.md` |
| **P1** | B2-Q5 ikona hex | **CZEKA MAPA** — § A wpis F→MAPA |
| **P2** | A4-D4 BLK-04 | **→ SILNIK GOTOWE** (MAPA+UI lane) |
| **P2** | F-D4 bonusy | F po delegacji |

**Nowe od innych czatów:** A4-D4 (Grupa A) — backlog P2, nie blokuje P0.  
**Kod F:** + F-HUD część 2 (`kulturaRate`, `getEvents` bunt).

### [2026-06-27] A4-D4 — ulepszenia terenu (Grupa A)

Od: Grupa A (Maciej ABC)  
Decyzje: **A4-D4-Q1=A** · **A4-Q1=A**  
**Implementacja lane (2026-06-27):** MAPA kwalifikacja + złoża · UI buildMode/toolbar/bottomBar/unitPanel  
Handoff: `dyspozycje/_handoff/UI-MAPA-do-SILNIK_D1B-A4-batch.md`  
→ **SILNIK:** wpięcie `main.ts` + testy → ROBOCZA

### [2026-06-27] F → Grupa A/MAPA/UI: A4-D4 — notatka SILNIK

Od: Grupa F · **Przyjęto do backlogu P2**

**Decyzje Macieja zamknięte** — F **nie blokuje** obecnej kolejki P0/P1 (bramka + F-C2 + F-HUD-2).  
**Wpięcie SILNIK BLK-04** dopiero po **→ SILNIK: GOTOWE** od MAPA (kwalifikacja placementu) + UI (tryb 🔨 Budowa).  
**Prośba:** lane'y dopisz `→ SILNIK: GOTOWE` + handoff gdy moduły gotowe.

---

### [2026-06-27] F → MAPA: prośba B2-Q5 hex

Od: Grupa F

**Potrzebne przed wpięciem SILNIK:** `getRevolt?: (cityId) => boolean` w `CityRenderOptions` + sprite 🔥 w `cities.ts` sync.  
**SILNIK gotowy przekazać:** `(cityId) => cityOrderState.get(cityId)?.bunt === true` w `_cityRenderOpts()`.  
Handoff: `MAPA-do-SILNIK_B2-Q5-bunt-hex.md` · **→ MAPA: CZEKA implementacja**

---

## Format wpisu (czat tematyczny)

```markdown
### [YYYY-MM-DD HH:MM] <ID> — tytuł
Od: Grupa X
Decyzje Macieja: … (jeśli były w tym czacie)
Zrobione: …
Testy: …
→ SILNIK: GOTOWE | CZEKA | BLOK: …
```

**Grupa F** dodaje po bramce:

```markdown
→ MASTER: GOTOWE-ROBOCZA
Wersja robocza: Gra-podglad-ROBOCZA.html (md5: …)
```

Schemat: `docs/czaty/SCHEMAT-DWIE-WERSJE.md`
