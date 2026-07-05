# UNITS → MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina),
ORAZ (2) to samo w CZACIE do uzytkownika (zeby wiedzial, co sie dzieje). Tresc identyczna.
Odpowiedzi/zadania od mastera czytaj w: dyspozycje/UNITS.md (sekcja "DO ZROBIENIA TERAZ").
NIE edytuj innych plikow w dyspozycje/.

**Trigger Macieja:** `start` → czytaj `docs/obieg/C-walka.md` · 🎯 TERAZ · tylko lane C · **NIE** `main.ts`

## [2026-07-04 ~23:30] **→ MASTER: GOTOWE** — Batch 0 + Batch 3 (units.json komplet roster-6)

**Plik:** `gra/data/units.json` — 67→**75** wpisów  
**Batch 0:** Wojownik germański → Super Brąz (koszt 0, epoka Brąz)  
**Batch 3:** Thorakites, Legionarius, Evocati, iButho z iklwa, Gwardzista z champi, Wojownik z żelaznym khopesh, Mur tarcz (Sargonid), Miecznik galijski  
**Skrypt:** `gra/tools/roster6-batch3-patch.cjs` · backup `units.json.bak-UNITS-batch3-20260704`  
**Test:** combat **6/6** ✅ · skopiowano do `gra-kanon/data/` + `gra-robocza/data/`  
**Kolejka:** rebuild `Gra-podglad.html` (MASTER) · modele 3D · staty od Grupy D (ABC)

---

## [2026-07-04 ~22:20] **→ MASTER: GOTOWE** — roster-6 + Celtowie (units.json)

**Handoff:** `dyspozycje/_handoff/GRUPA-C-do-MASTER_jednostki-roster6-20260704.md`  
**Plik:** `gra/data/units.json` — 50→67 wpisów · −Wojownik celtycki · +Soldurii · +17 roster-6  
**Test:** `node tools/combat-test.cjs` — **6/6** ✅  
**Backup:** `units.json.bak-UNITS-roster6-20260704`  
**Kolejka:** kanon czeka MASTER+Opus · 3D placeholder (kategoria) · Batch 0 germański · Batch 3 oryginalne 7

---

**Handoff:** `_handoff/F-do-MASTER_sesja-2026-07-04-map-ui-units.md`  
**Plik:** `gra/src/units/setup.ts` — `ROAD_MOVE_SPEED_MULT = 3`; `terrainMoveCost()` ÷3 na `Ulepszenie.Droga`  
**ROBOCZA md5:** `53ec508f48b7a9e13e152b1ba5d44644` · playtest: jednostka na drodze vs teren

---

## [2026-07-04] **→ GRUPA C: DYSPOZYCJA** — brief jednostek od CYW (bez statów)

**Handoff:** `dyspozycje/_handoff/CYW-do-GRUPA-C_jednostki-spec-brief-2026-07-04.md`  
**Trigger:** `działaj` · Celtowie (Soldurii/Gaesatae) + roster-6 nazwy · **CYW nie rusza units.json**

## [2026-07-03 ~23:45] **→ GRUPA C: DYSPOZYCJA** — jednostki Faza 1+2 roster

**Handoff:** `_handoff/MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md`  
**Priorytet Macieja:** Batch 0 (Wojownik germański) → Batch 1 (Asyria 2× konnica + Słowianie szczepniki) → Batch 2–3.  
**Trigger:** `działaj` w czacie Grupa C.

---

**DO TERAZ (Integrator):** 🟢 **F-P1-01 START u F** · 🔄 **P2 Panel-C balans START** (Maciej edytuje Excel)

**Lane C (walka):** 🔄 **P2 Panel-C balans** · P1 F-P1-01 → F · testy map **15/15 + 8/8**

**Lane UNITS:** 🔄 **Grupa C 1E batch 1 → MASTER** · handoff `UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md` · combat 6/6

**TW v3 F1+F3:** ✅ w kanonie md5 **`04d21f3087be8f4e85470ddad2335e70`** · balans JSON + scena T TW (2026-07-03)

## [2026-07-03 ~22:35] **→ UNITS: INFO** — Master wdrożył balans w grze (nie tylko JSON)

**Handoff:** `_handoff/MASTER-do-UNITS_balans-scena-T-2026-07-03.md`

**Skrót:** `_singleBlow` + skip bitwy = TW jak `combat.ts` · bundle przebudowany · **30 pocisków bez zmian** (ABC osobno).

**Lane:** opcjonalny regression sceny T · grep legacy w `manualBattle.ts` · Panel-C import → rebuild kanonu.

## [2026-07-03 ~22:45] **→ UNITS: INFO batch 2** — oblężenie + AI + pełna mapa sync

**Handoff zbiorczy:** `_handoff/MASTER-do-ALL-LANES_sync-TW-balans-2026-07-03.md`

**Skrót:** `siege.ts` → `hitChanceTw`/`damageTw` + `weaponDamage` w `SiegeUnit` · milicja baseline Wojownik TW · `siegeAi` · testy zaktualizowane.

## [2026-07-03 ~23:58] **→ UNITS: POLE-BITWY** — osobny build, był STARY

**Problem:** `Gra-podglad-POLE-BITWY.html` (root) **nie** pochodzi z `publish-robocza-snapshot` — osobny `vite.oblezenie-bitwa.config.ts` → `oblezenie/main.ts`. Po sync TW kanon miał nowy kod, POLE-BITWY **nie**.

**Fix:** rebuild + kopie w `gra-robocza/` i `gra-kanon/` · md5 **`0d1b409bfdac58268185a2806f0f5243`**.

---

**C2-FLOW (kod):**
- Po **Start**: tryb **RĘCZNY**, silnik tury **ZATRZYMANY** — jednostki nie ruszają same
- **SPACJA** = rozpocznij turę (po wydaniu rozkazów) · **R** = AUTO (od razu startuje tura)
- Faza deploy: ukryte linie rozkazów (żółte kreski)

**Belki morale na krawędziach ekranu:** lewa **niebieska (TY)**, prawa **czerwona (WRÓG)**  
**Mapa deploy:** niebieska kreska lewa / czerwona prawa przy linii podziału  
**Plik:** `battleScene.ts` · `Gra-podglad-POLE-BITWY.html` · combat **6/6**

## [2026-07-03 ~20:05] **→ MASTER: GOTOWE** — ramki grup na mapie + czystsze ghosty deploy

**Mapa:** złota ramka + numer grupy na każdym członku (cały czas)  
**Drag:** płaskie dyski zamiast cylinderów; kotwica = centroid; naprawiony offset przy przesuwaniu grupy  
**Plik:** `battleScene.ts` · `Gra-podglad-POLE-BITWY.html` · combat **6/6**

## [2026-07-03 ~19:50] **→ MASTER: DOPRECYZOWANIE C2-FLOW** — deploy PRZED regułami walki

**Korekta:** reguły R1–R4 obowiązują **dopiero po Start**, nie od wejścia na pole.  
**Kolejność:** preBattle → **rozstawianie (deploy)** → **Start** → walka ręczna (+ opcjonalnie AUTO).  
**Spec zaktualizowana:** `docs/decyzje/C2-FLOW-manual-start-tura.md` (sekcja R0 + diagram)

---
## [2026-07-03 ~19:45] **→ MASTER: DECYZJA** — C2-FLOW start walki (ręczna → opcjonalnie AUTO)

**Decyzja Macieja (C2-FLOW):**
- Po **Start**: walka **zawsze RĘCZNIE**; AUTO dopiero świadomie później (nie auto-start + ruch)
- **Gracz ATK:** pierwsza inicjatywa = gracz (ręczne rozkazy), potem może AUTO
- **Gracz DEF:** najpierw faza wroga (ATK AI), potem gracz ręcznie lub AUTO

**Spec:** `docs/decyzje/C2-FLOW-manual-start-tura.md` · rejestr: `REJESTR-DECYZJI.md`  
**Stan kodu:** `_manualMode=true` częściowo OK · brak `playerSide` (DEF) · brak blokady fazowej ATK/DEF  
**Wdrożenie:** C2v2 / UNITS — **nie w tej sesji** (tylko zapis reguł)

---
## [2026-07-03 ~19:30] **→ MASTER: GOTOWE** — grupy numerowane + szybkie zaznaczanie (deploy)

**Funkcje:**
- Grupy: **Grupa 1, 2, 3…** (numer na karcie + panelu)
- Klik w członka grupy (mapa/karta) = **cała grupa**; Ctrl+klik = pojedyncza jednostka
- Pasek nad rosterem: przyciski **1 / 2 / 3** (per grupa), **Konnica / Piechota / Łucznicy**, **Wszystkie**
- Aktywny przycisk podświetlony gdy zaznaczenie = dokładnie ta grupa/typ/całość

**Plik:** `battleScene.ts`  
**Build:** `Gra-podglad-POLE-BITWY.html` · combat **6/6**

---
## [2026-07-03 ~19:05] **→ MASTER: GOTOWE** — mapa 2× + strefa gry 50% + pan WASD

**Zmiany:** BF 68×156 · playable ~48×110 (środek, 50% pow.) · margines nieprzejezdny · pan strzałki+WASD · zoom domyślny na strefę gry  
**Plik:** `battleScene.ts`  
**Build:** `Gra-podglad-POLE-BITWY.html` · combat **6/6**  
**Maciej:** Ctrl+F5 · WASD/strzałki przesuwają widok · złota obwódka = granica walki

---
## [2026-07-03 ~17:40] **→ MASTER: GOTOWE** — port mockupów C06 v3 + C09 v2 (deploy UI)

**Mockupy Design:** `C06 Deployment v3 (1E).dc.html` · `C09 Karty jednostek v2 (1E).dc.html`  
**Pliki:** `battleHudTheme.ts` (tokeny deploy/roster) · `battleScene.ts` (`_buildDeployOverlay`, `_buildDeployRosterDock`, karty, panel TW)  
**Build:** `vite.oblezenie-bitwa.config.ts` → `Gra-podglad-POLE-BITWY.html` ✅  
**Test:** `battle-smoke.cjs` — FAIL (pre-existing `openStartupMainMenu` w main bundle, nie deploy)  
**Maciej:** Ctrl+F5 na `Gra-podglad-POLE-BITWY.html` · porównaj z mockupami C06/C09

---
## [2026-07-03] **→ MASTER: GOTOWE** — Grupa C 1E batch 1 (battleScene + theme)

**Handoff:** `dyspozycje/_handoff/UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md`  
**Pliki UNITS:** `gra/src/battle/battleHudTheme.ts` (nowy) · `battleScene.ts` (deploy, roster, end, kolory)  
**Współlane UI:** `preBattle.ts` (kolory) — ten sam handoff  
**Testy:** combat **6/6** · build vite OK  
**MASTER:** Opus → bramka → kanon · Maciej playtest po publikacji

---
## [2026-07-02] **→ INTEGRATOR: GOTOWE** — F-P1-01 launchFieldBattleFromMap

**Handoff:** `dyspozycje/_handoff/C-do-INTEGRATOR_map-attack-F-P1-01-2026-07-02.md`  
**Moduł:** `gra/src/battle/mapFieldBattle.ts` · **NIE** `main.ts`  
**Testy:** map-field-battle **15/15** · map-attack-city **8/8** (start 2026-07-02)  
**Lane C:** IDLE · wpięcie = **Grupa F** (Master dyspozycja `MASTER-do-INTEGRATOR_F-P1-01-map-attack-2026-07-02.md`)

---
## [2026-06-26] **→ MASTER: GOTOWE-KANON ZAMKNIĘTE** — AUTO-WALKA-v2b

**Handoff:** `dyspozycje/_handoff/→MASTER-AUTO-WALKA-v2b-ZAMKNIETE.md`

**Kanon:** md5 `5D965EB74068538C18C6C0916D5CBB77` · ACK Master · FLOW-C-fix wpięte.

**Lane zamknięte.** Nie delegować M v2b / post-battle-map. Czeka: playtest Maciej.

---
## 2026-06-26 — Auto-walka v2b + ruch mapy (auto = ręczna) — **ZAMKNIĘTE**

- **Werdykt auto:** `resolveAutoBattleByPower` (M składów × teren × mur) · straty v2b z `auto-battle-params.json`
- **Ruch po walce:** `applyPostBattleMap` — wspólne dla auto, ręcznej 3D, AI, barbarzyńców, szturmu
- **Przejęcie miasta:** wipe tylko obrońca na **centrum**; pierścień zostaje
- **Panel:** Panel-C → Auto-walka → `coef_zwyciezca`, `coef_przegrany`, `p_atk`, `p_def`, `L_MAX`, `remis_pct`
- **Testy:** `auto-battle-power-test` 10/10 · combat 6/6 · smoke OK
- **Kanon:** md5 `A754EC9B39725EDA6CD7B4EDBABEDC16`

---
## 2026-06-30 — Balans parametrów jednostek TW v3 — **ZAMKNIĘTE** (decyzja Maciej)

- **units.json:** pełna propozycja balansu wpisana (50 jednostek, 186 pól) · marker `_tw_v3_balans`
- **Backup:** `units.json.bak-BALANS-2026-06-30`
- **Excel:** `gra/tools/Jednostki-parametry-TW-v3-STAN.xlsx` + `…-PROPOZYCJA.xlsx` (3 zakładki + M)
- **Skrypt:** `gra/tools/gen-jednostki-excel-pelny.py` · `--apply-json` do ponownego eksportu
- **Hastati < Triari:** M 50.0 vs 51.5 (AP/Obraż 7, pilum AD=8)
- **Konnica:** AP 30→8 · **rydwany:** top Brąz M ~40–43 (HP + szarża)
- **Testy:** combat **6/6**
- **→ SILNIK/INTEGRATOR:** ✅ kanon md5 `3DAE1AA5C463CFD9E90F77C5D2DCFC76` · handoff **WPIĘTE**

---
## 2026-06-30 — M jednostki (fieldPower) → składnik Armia — GOTOWE → INTEGRATOR

- **JSON:** `fieldPower`/`siegePower` (53 jedn.) · `combat-params.json` → `unit_power`
- **Kod:** `gra/src/game/unit-power.ts` · test `unit-power-test.cjs` **6/6** (Hastati M=50, Triari 51.5)
- **Panel-C:** Moc-jednostek + Stale-moc · wallAttack zsynchronizowany
- **→ INTEGRATOR:** `UNITS-do-SILNIK_unit-power-moc.md` — suma M zamiast count w Power · batch `UNIT-POWER-M-v1`

---

- **Handoff:** `UNITS-do-SILNIK_EKSPORT-TW-v3-super-2026-06-30.md`
- **main.ts:** militia EN · siege map EN · `unitDefFor` w auto-walki/szturm/barbar
- **Testy:** combat **6/6** · smoke **OK** · build md5 `4050A58D…`
- **NIE:** units.json · battleScene 3D
- **→ MASTER:** meldunek `SILNIK-DO-MASTERA.md` · kanon czeka Opus

---
## 2026-06-29 — C4-Q1=A balans macierzy v2.0 — GOTOWE → SILNIK
- **units.json:** 9 jednostek (Wojownik, Zwiadowca, Łucznik, Woj. m+t, Włócznik, Rydwan, Konnica, Falanga, Hastati=Legionista) + pole `Obrażenia`
- **combat.ts:** `hitChanceMatrix`, `matrixDamage`, `usesMatrixCombat` (para macierz gdy obie strony mają Obrażenia)
- **battle:** `manualBattle.ts`, `battleScene.ts` — `toCombatUnit` mapuje Obrażenia
- **Skrypt:** `gra/tools/apply-matrix-v2-stats.cjs`
- **Testy:** combat **6/6** · battle-smoke **OK**
- **Backup:** `units.json.bak-UNITS-C4-2026-06-29`
- **→ SILNIK: WPIĘTE** (2026-06-29) — main.ts już miał `obrazeniaFromUnitDef` · build OK · ROBOCZA md5 `0adf96de…` · **CZEKA Opus**

---
## 2026-06-29 — UNITS P1: typeId na mapie + pasy helmów — GOTOWE

- [x] **Pkt 1** `UnitRenderer.sync`: zapis `userData['typeId']`; rebuild gdy `cat` **lub** `typeId` się zmieni (fix: ta sama kategoria, różne typy — np. Legionista vs Falanga — miały ten sam model)
- [x] **Pkt 2** `addOwnerHelmStripe()` — pas ownerColor na hełmie melee: `miecznik`, `wlocznik`, `falanga`, `legionista`, `domyslny` (maczuga/topor już miały opaskę)
- [x] Strzelcy bez pasa (bez zmian)
- [x] Backup: `gra/src/render/units.ts.bak-UNITS-20260629`
- [x] Handoff: `dyspozycje/_handoff/UNITS-do-INTEGRATOR_map-units-typeId-P1.md`
- **→ INTEGRATOR: GOTOWE** — rebuild kanonu `Gra-podglad.html` (wizualia mapy); **bez** `main.ts`
- **Nie powtarzać:** D-P0-4 / `battleScene.ts` (bonusy mechaniczne GOTOWE)

---
## 2026-06-30 — TW v3 walka Rome 2 — dane GOTOWE · silnik CZEKA → SILNIK

- **Maciej:** parametry jednostek **zamknięte** (melee ÷10 + wyjątki Hastati/Konnica · dystans z Excela · audyt 0 błędów)
- **Silnik:** `combat.ts` **NADAL macierz v2** — TW Rome 2 **nie wdrożony**
- **Handoff:** `dyspozycje/_handoff/UNITS-do-SILNIK_TW-v3-walka-rome2.md` — **GOTOWE**
- **Rekomendacja:** Faza 1 UNITS (`combat.ts` + testy) → Faza 3 SILNIK (`main.ts` wpięcie) — **łatwiej niż wszystko naraz**
- **→ SILNIK/INTEGRATOR:** **Faza 3** — `battleUnitToCombatUnit` + kanon (Faza 1 silnik **GOTOWA** 2026-06-30, combat-test 6/6)

---
## 2026-06-30 — TW v3 Faza 1 silnik — GOTOWE

- **combat.ts:** `hitChanceTw`, `damageTw`, `rangeDamageTw` · `CombatUnit` EN · macierz v2 usunieta z resolveCombat
- **civ-bonuses.ts:** `missileAttack` zamiast `Atak dystansowy`
- **combat-test.cjs:** adapter EN z units.json · assert hit=38% (Hastati vs Falanga)
- **Testy:** `node tools/combat-test.cjs` **6/6 PASS**
- **Backup:** `combat.ts.bak-UNITS-TW-v3-2026-06-30`
- **→ SILNIK/INTEGRATOR:** ✅ **WPIĘTE F3** — kanon md5 `B62150A905CEE4A4BFF5F7A807E73582` (2026-06-26)

---
## 2026-06-30 — Super-jednostki TW v3 (7×) — ZAMKNIĘTE (decyzja Maciej)

- **Problem:** migracja ÷10 zniszczyła AP/OBR/Panc (1/1/1); archiwum miało Obraż=0
- **Decyzja Maciej:** AP/OBR 1:1 ze starego backupu · **Obraż=10** dla wszystkich super · Panc 6 · Przeb 4 · Szarża 8 (Triari/uThulwana 10)
- **units.json:** 7 jednostek zaktualizowanych · backup `units.json.bak-SUPER-fix-2026-06-30`
- **migrate-units-tw-v3.py:** OVERRIDES super (anty-regresja przy re-migracji)
- **Silnik:** dane EN w JSON → `combatUnitFromDef` / `battleUnitToCombatUnit` w main.ts (bez zmian kodu)
- **Testy:** combat-test **6/6 PASS** (test 3 Gwardia Sumeru, test 6 Medżaj)
- **→ Eksport SILNIK:** `dyspozycje/_handoff/UNITS-do-SILNIK_EKSPORT-TW-v3-super-2026-06-30.md`

---
## 2026-06-30 — Panel-C zsynchronizowany z balansem TW v3

- **Maciej:** edycja parametrów przez **Panel-C.xlsx** (Grupa C), nie legacy Jednostki.xlsx
- **gen-panel-c.py:** przebudowa z `units.json` · 50 jednostek bojowych · `is_combat_unit` = Oblężnicza/Dystans/Morska/…
- **Jednostki-staty:** wallAttack (Atak vs Mur) — Katapulta 16, Taran 14, Wieża 6
- **export-c.py roundtrip:** 0 zmian po gen (OK)
- **TW-dystans-edycja.xlsx:** 17 jednostek · import nie kasuje wallAttack Taran/Wieża
- **→ INTEGRATOR:** handoff §8 Panel-C workflow w `UNITS-do-INTEGRATOR_balans-tw-v3-2026-06-30.md`

---
## 2026-06-30 — Moduł Moc jednostki (M) — GOTOWE

- **unit-power.ts:** `fieldPower`, `siegePower`, `armyFieldPower`, `sumArmyFieldPower`
- **units.json:** `fieldPower` / `siegePower` (53 jedn. · auto gen-panel-c / export-c)
- **combat-params.json:** sekcja `unit_power` · Panel-C **Stale-moc** + **Moc-jednostek** (formuły Excel)
- **Test:** `node gra/tools/unit-power-test.cjs` **6/6 PASS**
- **→ SILNIK:** `UNITS-do-SILNIK_unit-power-moc.md` (suma M → składnik Armia Power)
- **→ Grupa D:** zaktualizowany `CYWILIZACJE-do-GRUPA-D_moc-jednostek-power.md`

---
## 2026-07-01 — Fix szans preBattle (M armii) + rebuild PLAYTEST

- **Problem playtestu:** pasek preBattle pokazywał ~19/81 (hitChance TW lidera), Auto używało M v2b (~53/47 dla Hastati vs Falanga)
- **Kod:** `auto-battle-power.ts` · `preBattleSzanseAtkPct()` w `main.ts` · `preBattle.ts` (etykieta + suma M)
- **Test:** `auto-battle-power-test.cjs` **14/14 PASS**
- **Docs:** `docs/grupa-c/PLAYTEST-WALKA-MACIEJ.md` — główny link `?playtest=mapa`
- **Publish (częściowy, bez kanonu):** PLAYTEST-WALKA + ROBOCZA + PLAYTEST-MAPA · md5 **`9AC325821135770E38831FF33C3A985C`**
- **→ INTEGRATOR F:** `dyspozycje/_handoff/C-do-INTEGRATOR_rebuild-playtest-2026-07-01.md` (pełna bramka → kanon)

---
## 2026-07-01 — P5 przemarsz + P6 transfer jednostki (dyplomacja) — **→ MASTER: GOTOWE**

- **MAPA:** `territoryOwnerAt` + `TerritoryNode` w `gra/src/map/territory.ts`
- **UNITS P5:** `gra/src/game/border-march-scan.ts` — `collectUnauthorizedBorderPairs`, `BorderMarchPair`
- **UNITS P6:** `gra/src/game/diplomacy-unit-transfer.ts` — `spawnTransferredUnit`, koszt z `units.json`
- **Testy:** `border-march-scan-test.cjs` **11/11** · `diplomacy-unit-transfer-test.cjs` **13/13**
- **Handoff F:** `dyspozycje/_handoff/UNITS-do-INTEGRATOR_P5-P6.md` · warstwa 🟡
- **→ MASTER: GOTOWE** — czeka CYW `diplomacy-border-march.ts` + batch Integrator F

---
## 2026-07-01 — Fix odskoku obrońcy (fan-out) + morze — → MASTER

- **Playtest:** Maciej · `PLAYTEST-ODSKOK.html` 3v3 · obrońcy lądowali w stronę ATK + na morzu
- **Fix:** `post-battle-map.ts` — ucieczka **od centroidu ATK** (nie losowy hex); remis: DEF/ATK osobne kierunki
- **Fix:** `main.ts` `mapHexPassableForUnit` — enum `TerenBazowy` (morze/wybrzeże/góry blok)
- **Test:** `post-battle-map-test.cjs` **5/5** · docs `AUTO-WALKA-MOC-ALGORYTM.md` § fan-out
- **Publish C:** PLAYTEST-ODSKOK md5 **`5E1A1C9F7F5D7F5A6FA402C757D1B3F9`**
- **→ MASTER:** `dyspozycje/_handoff/C-do-MASTER_odskok-fanout-2026-07-01.md` · czeka F + Opus → kanon

---
## 2026-06-26 — Playtest oblężenie 3v3 + pierścień B + preBattle UI — **→ MASTER: GOTOWE**

- **Maciej:** playtest `PLAYTEST-OBLEZENIE-3v3.html` · decyzja **B** (pierścień fan-out −1 heks po sztur mie)
- **Fix OBL-CAP-01:** jednostki ATK nie znikają po auto-szturmie (`post-battle-map.ts` — brak pustego `manualSurvivors`)
- **Fix OBL-RING-B:** pierścień obrońców fan-out przy wygranej ATK na mieście (jak pole)
- **Fix OBL-ROSTER-3:** preset 3× Hastati na pierścieniu (`playtestOdskok3v3.ts`)
- **C1-BONUS:** preBattle — tylko bonusy bojowe (`civ-bonuses.ts`, `preBattle.ts`)
- **C1-UI:** usunięty pionowy słupek szans między wodzami (mockup `Makieta-preBattle.html`)
- **Kanon ruchu:** `docs/AUTO-WALKA-MOC-ALGORYTM.md` — skorygować „pierścień zostaje” (v2b) → **fan-out B**
- **Testy:** `post-battle-map-test.cjs` **10/10** · `civ-bonusy-test.cjs` **33/33**
- **Publish C (playtest):** `Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html` md5 **`A416D5ECACA0DBF2E2B157FD0D8093C5`**
- **Warstwa:** 🟡 cross · **NIE** `main.ts`
- **→ MASTER:** `dyspozycje/_handoff/C-do-MASTER_oblezenie-playtest-2026-06-26.md` · delta po P0 `ED4C8E2B…` · **nowy batch F** (nie P0)
- **Slack:** `docs/obieg/SLACK-OUTBOX-C-2026-06-26.md` · **WYSŁANE** · Maciej nie wkleja do Mastera

---
## [2026-07-05 ~13:30] **→ MASTER: GOTOWE** — Popupy Deploy v5 · P1 (UNITS lane)

**Dyspozycja:** `dyspozycje/_handoff/MASTER-do-UNITS_deploy-popups-v5-P1.md`  
**Handoff Design:** `docs/ux/claude-design/HANDOFF-Cursor-Popupy-Deploy-v5.md`  
**Pliki:** `gra/src/battle/battleScene.ts` · `gra/src/battle/battleHudTheme.ts` · **NIE** `main.ts`

### Zrobione (P1)
| # | AC | Status |
|---|-----|--------|
| 1 | Ikona hełmu na toolbarze „Konnica" (`FMT_SVG.cavHelm`, `rotate(180 12 12)`) | ✅ |
| 2 | Kanon SVG: `FMT_SVG.f1/f2/f3`, `DEPLOY_TACTIC_SVG` (Szturm ↓, Ostrzał celownik) | ✅ |
| 3 | Pixel-perfect wierszy: padding 11×13, gap 12, typografia 14/11px; popup gap 8, pad 12×14; Taktyka siatka 2×2 wyśrodkowana | ✅ |
| 4 | Spójność deploy + walka R: ten sam `_renderDeployTacticsPopup` po SPACJA→RĘCZNY (Taktyka/Strategia widoczne) | ✅ |

**Bramka:** `npx tsc --noEmit` w `gra/` — **OK** (0 błędów)  
**Test ręczny:** `cd gra && npm run dev` → POLE-BITWY → deploy toolbar + faza R (Taktyka) — **Maciej playtest**

### Czeka na Design (opcjonalnie P2)
- Chip 34×34 z gradientem w wierszach Formacja/Konnica (mockup 1E ma tło radialne na ikonie — obecnie ikona inline)
- Hover stan wierszy popup (mockup nie definiuje — domyślnie cursor:pointer)

**Kolejka MASTER:** build/test po review Opus → wpine do kanonu (SILNIK batch)

