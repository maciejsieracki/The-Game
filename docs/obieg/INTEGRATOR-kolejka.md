# ⚙️ INTEGRATOR F — Kolejka wpięć (Grupa F — **wykonawca kodu**)

> **Trigger Macieja:** `start` → czytaj ten plik · sekcja **DO WPIĘCIA** · **jedyny editor `main.ts`**.
> **OBOWIĄZ playtest:** **ZERO** w czacie Macieja — dopisz [`REJESTR-PLAYTESTOW.md`](../docs/master/REJESTR-PLAYTESTOW.md) §2. [`OBOWIAZ-PLAYTEST-REJESTR.md`](OBOWIAZ-PLAYTEST-REJESTR.md)
> **OBOWIĄZ zakres:** F **nie raportuje Maciejowi** — tylko Master (`F-do-MASTER*`). [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)
> **Master hub nie koduje** — dyspozycje: [`MASTER-WATCH.md`](MASTER-WATCH.md) · zadania: [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md) · dwie wersje: [`DWIE-WERSJE-GRY.md`](DWIE-WERSJE-GRY.md)

## ⛔ OBOWIĄZ ścieżka + publish (2026-07-05 — Maciej **`ścieżka`**) — **PILNE dla F**

**📢 Broadcast:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)  
**Źródło:** `gra/src/` → **`gra/tools/publish-robocza-snapshot.ps1`** → **`gra-robocza/Gra-ROBOCZA.html`**.  
**ZAKAZ:** edycja `gra-robocza/src/` · publish **`gra-kanon/`** · **`Gra-FINALNA.html`** (to robi Master).  
**Deprecja:** `gra-robocza/tools/publish-robocza-bundle.ps1`. [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md)

**Kolejka wpieć:** **MAPA strefy A wąski** · kanon **`0fd96b6f…`** (2026-07-05) · BLEDY batch zamknięty

---

## 🔴 P0 — BLEDY audyt 2026-07-05 — **P0 MAPA ✅ · P1 TSC czeka**

| Batch | Handoff | Status | md5 / notatka |
|-------|---------|--------|---------------|
| **BLEDY-MAPA P0** | `MASTER-do-INTEGRATOR_BLEDY-2026-07-05.md` | ✅ ROBOCZA | **`b468cade…`** · meldunek `F-do-MASTER_BLEDY-2026-07-05.md` |
| **BLEDY-TSC P1** | ten sam handoff | ⏸ **START** | 157 bł. tsc · crashe main.ts |
| **BLEDY-P2** | — | ⏸ BLOCKED | combat/diplo/seed — ABC Macieja |

**Źródło:** [`dyspozycje/BLEDY-DO-NAPRAWY-2026-07-05.md`](../../dyspozycje/BLEDY-DO-NAPRAWY-2026-07-05.md)  
**Kanon bazowy:** md5 **`89a870fbecbc015cb96a2e90cba04511`** · robocza sync  
**Trigger Macieja:** audyt + potwierdzenie testem generatora (2026-07-05)

**AC skrót:** 0 rzek bez ujścia · standard < 5 s · `tsc` = 0 · P2 bez ABC = brak zmian

---

## ✅ EKO-TECH Paczka 1–5 + kanon (2026-07-05) — DONE

Sign-off Macieja `ok master` · md5 **`89a870fb…`**

---

## ~~🔴 P0 — EKO-TECH Paczka 1 (2026-07-04)~~ — archiwum

| Batch | Handoff Master | Lane | Notatka |
|-------|----------------|------|---------|
| **EKO-TECH-P1** | `MASTER-do-INTEGRATOR_eko-tech-p1-2026-07-04.md` | B+E JSON + F main.ts | Maciej `działaj` · test 9/9 eko-tech |

**Scope:** bramka Pismo↔Cegielnia · upgrade kręgi→świątynia · budynki Mielerz/Mennica/Akwedukt/Odlewnia · JSON sync  
**MAPA równolegle:** `MAPA.md` P0 droga brukowana (bez main.ts)

---

## ✅ P0 — MAPA brzeg C + delta A (2026-07-03) — ROBOCZA

| Batch | Meldunek | md5 ROBOCZA |
|-------|----------|-------------|
| **MAPA-P0** | `F-do-MASTER_MAPA-P0-brzeg-2026-07-03.md` | **`3ea10008dcc48efc869d5dd57e264a2f`** |

**Kanon:** **`ce71d449…`** (bez zmian do playtestu Macieja)

---

## ⏸ P1 — F-P1-01 map attack (2026-07-02) — po CUDA-G1

| Batch | Handoff | Lane | Notatka |
|-------|---------|------|---------|
| **F-P1-01** | `MASTER-do-INTEGRATOR_F-P1-01-map-attack-2026-07-02.md` | C→F | open city battle · router mapy · test 8+15 |

**Kanon bazowy:** md5 **`188437eb1b81b165aee6decafa216e0b`** (VICTORY + B1-Q3 już w bundle)

---

## ✅ VICTORY-E-P0-06 — DONE (2026-07-02)

**Meldunek:** `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` · review Master **APPROVE**

---

## ✅ KANON-BATCH-3 (2026-07-02)

| Plik | md5 |
|------|-----|
| **`Gra-podglad.html`** | **`de9b53e43997d8ec195f209054f46d3a`** |
| **`gra-kanon/`** · **`gra-robocza/`** | sync ✅ |

**Scalone:** Panel-C JSON · verify D-SOJUASZ · A1-Q12 overlay  
**Meldunek:** `F-do-MASTER_KANON-BATCH3-2026-07-02.md`

---

## ✅ BUILD F / KANON (archiwum 2026-07-02)

| Batch | Handoff | Meldunek | Status |
|-------|---------|----------|--------|
| **SILNIK-D-V11** | `MASTER-do-INTEGRATOR_SILNIK-D-V11-2026-07-02.md` | `F-do-MASTER_SILNIK-D-V11-2026-07-02.md` | ✅ DONE |

---

## ~~🔴 P0 — A-R7 rebuild kanon~~ ✅ w kanonie (KANON-SPRINT 2026-07-02)

---

**Kolejka wpieć (archiwum nagłówek):** **P4 D4-WYMIANA-PN** …

## ✅ BUILD F / KANON (2026-07-02)

| Plik | md5 | Batch |
|------|-----|-------|
| **`Gra-podglad.html`** | **`01490681afbc7e67d5182992989597df`** | KANON-SPRINT + **SILNIK-D-V11** (D3 v1.1) |
| **`gra-kanon/`** · **`gra-robocza/`** | ten sam md5 | sync ✅ |

**Scalone w kanonie (`01490681…`):** P0–P7 · D16-D18 · B2-D18 · P7 Prezent · A5 Roblox · **D3 v1.1 silnik**

**Poprzedni kanon:** `2fc963816085f41c65ccf9398ff6ed3a` · KANON-SPRINT (bez D3 wiring)

---

## ✅ → MASTER (2026-07-01) — B-B5-SPICHLERZ

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_B-B5-SPICHLERZ-2026-07-01.md`  
**md5 ROBOCZA:** `4B360364201828D2F0D5B6C3C40EE556` · B5 testy 9/9+10/10+26/26 · czeka review Master

---

## ✅ → MASTER (2026-07-01) — A-P4-UI

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_A-P4-UI-2026-07-01.md`  
**md5 ROBOCZA:** `4B360364201828D2F0D5B6C3C40EE556` · ACK Master (superseded by B5 meldunek)

---

## ✅ → MASTER (2026-07-01) — D-SOJUASZ-v12

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_D-SOJUASZ-v12-2026-07-01.md`  
**md5 ROBOCZA:** `EDF380D67364F89A9617A9AFE57C003E` · ACK Master 2026-07-01

---

## ✅ → MASTER (2026-07-01)

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_C-ODSKOK-FANOUT-2026-07-01.md`  
**md5:** `ED4C8E2B67AC86B7245B01FE9F2A20F9` · **ACK Master 2026-07-01** · promocja `gra-kanon/` ✅

---

## ✅ → MASTER (ACK 2026-06-30) — archiwum

**Handoff:** `dyspozycje/_handoff/F-do-MASTER_E2-PLAYTEST-B2Q5-2026-06-30.md`  
**md5:** `AB471657E64C0D87F3BA7E3094DE0A1B` · Slack `#grupa-f` + `#master` · Master ACK w `MASTER-WATCH.md`

---

## 🔜 DO WPIĘCIA (kolejność)

### P2 — **→ MASTER** (meldunek 2026-07-01)

| Batch | Handoff Master | Handoff lane | Notatka |
|-------|----------------|--------------|---------|
| **A-P4-UI** | `MASTER-do-INTEGRATOR_A-P4-UI-2026-07-01.md` | `A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md` | 🟡 cross · ROBOCZA `4B360364…` · czeka review |

**Meldunek:** `F-do-MASTER_A-P4-UI-2026-07-01.md` · **`→ MASTER: GOTOWE-ROBOCZA`** ✅

---

### P1 — **ZAMKNIĘTE** ↑

| Batch | Handoff Master | Handoff lane | Notatka |
|-------|----------------|--------------|---------|
| ~~**D-SOJUASZ-v12**~~ | `MASTER-do-INTEGRATOR_D-sojusz-v12-2026-07-01.md` | lane D | ROBOCZA `EDF380D6…` · ACK Master |

---

### ~~P0 C-ODSKOK-FANOUT~~ — **ZAMKNIĘTE** · kanon `ED4C8E2B…`

### P3 — **→ MASTER** (meldunek 2026-07-01)

| Batch | Handoff Master | Handoff lane | Notatka |
|-------|----------------|--------------|---------|
| **B-B5-SPICHLERZ** | `MASTER-do-INTEGRATOR_B-B5-spichlerz-2026-07-01.md` | `EKONOMIA-do-MASTER_B5-spichlerz-GOTOWE.md` | 🟡 cross · ROBOCZA `4B360364…` · czeka review |

**Meldunek:** `F-do-MASTER_B-B5-SPICHLERZ-2026-07-01.md` · **`→ MASTER: GOTOWE-ROBOCZA`** ✅

~~Dyspozycje P1+ — Master dopisze po meldunku P0 od F.~~ — **zastąpione:** dyspozycje zapisane · F startuje sekwencyjnie po meldunkach kanonu.

---

> **Jedna rola:** Integrator F = dawny „SILNIK” + publikacja ROBOCZA (nie dwa osobne lane’y).
> Zasady → `docs/obieg/_ZASADY.md` · Słownik → `docs/obieg/NAZEWNICTWO-GRUP.md` · STAN → `dyspozycje/INTEGRATOR-STAN.md`
> Integrator F = **jedyny** edytor `main.ts` · wpinanie modułów · bramka · `Gra-podglad-ROBOCZA.html`.
> Flaga legacy `→ SILNIK: GOTOWE` = to samo co `→ INTEGRATOR: GOTOWE` (handoff od lane A–E).
> **Świadomość połączeń:** przed każdym wpięciem sprawdź `docs/obieg/MAPA-POLACZEN.md` i sklasyfikuj warstwę (🟢/🟡/🔴 wg `.cursor/rules/zmiany-izolacja.mdc`). 🟢 scalaj batchem; 🟡/🔴 pełna kontrola.
> **Test całości to TWOJA rola (SIMP-1) — stały obowiązek, bez specjalnego skryptu:** grupa robi tylko lekki self-check (typecheck + jej testy). Ty: typecheck+testy → `npx vite build --outDir %TEMP%\civ-dist` (build bez publikacji) → **otwórz i obejrzyj** mapę/miasto/HUD → dopiero zielono+wygląd OK publikuj ROBOCZA.

## 📋 DYPOZYCJA MASTER (2026-06-30)

**Od:** Master Orkiestrator (hub) · **Do:** czat Grupa F

1. **Rola:** wykonawca kodu only — `main.ts`, build, bramka, meldunek `→ MASTER: GOTOWE-ROBOCZA`.
2. **Hub Master nie koduje** — czekasz dyspozycji batch + handoff w `_handoff/`.
3. **Kolejka:** pusta — nie startuj nowych wpięć bez dyspozycji Master.
4. **Po każdym batchu:** aktualizuj sekcję AKTUALNY KANON (md5) w tym pliku.

Handoff: `dyspozycje/_handoff/MASTER-do-GRUPA-F_executor-only-2026-06-30.md`

---

## ✅ MASTER CZEKA (2026-07-01) — **ARCHIWUM**

**Zastąpione przez:** [`MASTER-WATCH.md`](MASTER-WATCH.md) · dyspozycja `MASTER-do-INTEGRATOR_czekam` → archiwum

| Priorytet | Co | Status |
|-----------|-----|--------|
| **P0** | BONUS-C · F-POWER-MANPOWER | ✅ w kanonie |
| **P1** | D-V11 · P1-C MAPA · scalenie md5 | ✅ w kanonie |
| **P2** | E2 generator (kod) | ✅ main.ts · playtest Maciej ⏸ |
| **P2** | Panel JSON→TS · Grupa B reszta | ⏸ lane E/B |
| **⏸** | Opus · playtest Maciej | MASTER / Maciej |

**→ MASTER: KANON = `4602e752d7e4b21f3c2460e494e82a8f`, ROBOCZA = `4602e752d7e4b21f3c2460e494e82a8f`, scalone: [BONUS-C, F-POWER, D-V11, P1-C MAPA, OBL-CAP, CYW 5A, Panel-C, A2-Q5, FOOD], czeka: [Opus, playtest Maciej, map-gen-params P3]**

---

## ✅ WPIĘTE → MASTER (czeka weryfikacji / Opus)

**→ MASTER: GOTOWE-KANON** · md5 **`3DAE1AA5C463CFD9E90F77C5D2DCFC76`** · **2026-06-30 batch UNITS scalony** · meldunek: `dyspozycje/SILNIK-DO-MASTERA.md`

- **[2026-06-30] TW-v3-BALANS-units-json + UNIT-POWER-M-v1** — jeden kanon, jeden md5
  - Balans: `units.json` 186 pól · Hastati/Triari/Konnica · combat 6/6
  - Power: `sumArmyMForOwner` → suma `fieldPower` (nie headcount) · `armyFieldPower` z `unit-power.ts`
  - Bramka: unit-power **6/6** · combat **6/6** · smoke OK · power-objective **9/9**
  - Backup: `main.ts.bak-INTEGRATOR-UNIT-POWER-M-BALANS-2026-06-30` · `Gra-podglad.html.bak-BALANS-2026-06-30`
  - **Czeka:** Maciej strojenie `jednostka_wojskowa.pkt` w Panel-B (Power może być wyższy)

**→ MASTER: GOTOWE-KANON** · md5 **`4602e752d7e4b21f3c2460e494e82a8f`** · **2026-07-01 batch P0+P1 scalony** · meldunek: `dyspozycje/SILNIK-DO-MASTERA.md`

- **[2026-07-01] BONUS-C + F-POWER + D-V11 + P1-C MAPA + scalenie** — jeden kanon, jeden md5
  - BONUS-C: `getCivBonusy` ×3 · F-POWER: HUD Power + overlay + Respekt %
  - D-V11: traktaty, modale, tick trybutu, save/load · P1-C: map-improvement 34/34
  - Bramka: logic 203 · combat 6 · diplomacy suite · smoke · battle-smoke
  - **Gotowe do Opus:** C4 + Panel-C + CYW + OBL-CAP + dyplo v1.1 + Power
  - **Czeka:** playtest Maciej · Opus ręczny

**→ MASTER: GOTOWE-KANON** · md5 **`9665790EE040660FC6615F8405D0DD0D`** *(stary — patrz AKTUALNY KANON)* · **2026-06-30 batch CYW+P1** · meldunek: `dyspozycje/SILNIK-DO-MASTERA.md` *(superseded by 4602e752…)*

- **[2026-06-30] CYW 5A + P1-A Panel-C + P1-B typeId** — agresja/handlowość z Excela · combat-params · modele per typeId
  - `main.ts`: `resolveArchetypeAggression` + `resolveArchetypeTrade` (5A)
  - Lane: victory 10A · barbarians 11C · Panel-C JSON · units render typeId
  - Bramka: logic **203** · combat **6** · siege-ai **17** · victory **12** · barbarians **55** · diplomacy **135** · ai **198** · oblezenie **27** · siege-defenders **11** · smoke · battle-smoke · okolica **32/32**
  - **Czeka:** playtest Macieja · **Opus** (C4 + Panel-C + CYW)

**→ MASTER: GOTOWE-KANON** · md5 **`30DBBAF608E423E00C49E184297F65BD`** *(stary — patrz AKTUALNY KANON)* · **2026-06-30 batch** · meldunek: `dyspozycje/SILNIK-DO-MASTERA.md`

- **[2026-06-30] OBL-CAP-01 + panel miasta v2 + manpower** — jednostka widoczna po zdobyciu · mini 3D jednostek · tooltip budynków na ikonie · pasek rekrutów w panelu
  - `main.ts`: `refreshMapAfterCityCapture` (sync przed fog) · szturm → `applyCityCaptureToMap` · `getOwnerColor` + `getManpowerSnapshot`
  - `cityPanel.ts`: `mountUnitMiniPreview` · hover thumb-only budynki · stat ⚔ rekruci w top bar
  - Bramka: logic **203/203** · oblezenie **27** · siege-defenders **11** · smoke · battle-smoke · okolica **32/32**
  - **Czeka:** playtest Macieja (Ateny/szturm) · Opus przed formalnym sign-off

**→ MASTER: GOTOWE-ROBOCZA** · md5 **`C0A64D12312563D83ADB62A695A9BDA6`** *(stary — patrz AKTUALNY KANON; PLAYTEST-WALKA nadal ten build)* · **F-FOOD-HODOWLA-01** · meldunek: `dyspozycje/SILNIK-DO-MASTERA.md`

- **[2026-06-26] F-FOOD-HODOWLA-01** — hodowla + złoże + warstwy heks (`main.ts` integracja)
  - Złoże bydła/owiec = implicit pastwisko · Farma na złożu = stack Farma+Bydło · save/load `string[]`
  - Handoff: `MAPA-do-INTEGRATOR_hodowla-zloze-SILNIK.md` · kanon: `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`
  - Bramka: food-hodowla **21/21** · qualify **34/34** · logic **203/203** · smoke · battle-smoke OK
  - **Maciej:** playtest odłożony → Master weryfikuje; bugfix w kolejnym batchu jeśli potrzeba
  - **Czeka:** Opus przed formalnym sign-off kanonu · **Konie = osobny batch**

**→ MASTER: GOTOWE-ROBOCZA** · md5 `95bbcd3f…` *(stary — patrz AKTUALNY KANON)* · **E1-EPOKA-PRZED-CYW** · handoff: `dyspozycje/_handoff/UI-do-INTEGRATOR_E1-epoka-przed-cyw.md`

- **[2026-06-29] E1-EPOKA-PRZED-CYW** — kreator Epoka→Cywilizacja + filtr `epokiStartowe` · playtest Maciej ✅
  - Pliki: `newGameFlow.ts`, `civs.json` (Celt/German tylko Brąz/Żelazo)
  - Publish: **kanon = ROBOCZA = PLAYTEST-*** · md5 **`95BBCD3FAB26D4C4F0C35BF0C5A42EA7`** *(stary — patrz AKTUALNY KANON)*
  - Bramka: logic **203/203** · smoke · battle-smoke · combat OK
  - Silnik bez zmian (`epochId` + tech kaskada E1-Q2)

**→ MASTER: GOTOWE-ROBOCZA** · md5 `611613f49b8fdb92a550cae887606db3` *(stary — patrz AKTUALNY KANON; superseded by 4602e752…)* · meldunek = ten wpis (poniżej) · handoff: `dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md`
> Opus kolejkuje **Master** (nie Integrator). Maciej: zero przenoszenia treści — Master czyta tę kolejkę po `czaty`.

  - **[2026-06-29] E1 bundle + F-CITY-HEX** — rebuild ROBOCZA + PLAYTEST-* + kanon (bramka) → md5 `611613f49b8fdb92a550cae887606db3` *(stary — patrz AKTUALNY KANON)*
  - E1: kreator Jakość mapy Niska/Średnia/Wysoka · las parity · `?mapQuality=Wysoka`
  - F-CITY-HEX: czysty hex pod miastem (`centerWorkedTile` + `hideDecorAtHex`)
  - Bramka: typecheck + testy + smoke + battle-smoke + forest-parity **98/98**
  - **Czeka:** playtest wizualny Macieja (ISO-4) · Opus przed formalnym sign-off kanonu
- **[2026-06-29] Batch zbiorczy** — OKOLICA toggle + E1 bundle + lane-only (las, P1 units, P1-04, UI E1/S0) → ROBOCZA md5 `808b87fdc6a04a729114e2835560bcc4` *(stary — patrz AKTUALNY KANON; zastąpiony powyżej)*
- **[2026-06-29] F-B5 + CYW + walka + P0 + B1-tech + E1 main.ts** — w ROBOCZA powyżej

## 📥 DO WPIĘCIA (od grup — czeka Integrator)

> **Dyspozycja Master 2026-06-29:** `dyspozycje/MASTER-do-INTEGRATOR_dispatch-2026-06-29.md`  
> **Kolejność:** P1 scalenie 🟢 (bez main.ts) → **F-FOOD-HODOWLA-01** (main.ts + ROBOCZA) → E2 łańcuch

### P1 — TERAZ (🟢 izolowane, bez main.ts)

~~PANEL-C · typeId~~ → **✅ zamknięte 2026-06-30** (md5 `9665790E…` *(stary — patrz AKTUALNY KANON; scalone w 4602e752…)*) — w kanonie

### PANEL-C — combat-params.json (Grupa C) · **P1-A** — ✅ 2026-06-30

**Warstwa:** 🟢 · **Handoff:** `C-do-INTEGRATOR_panel-C.md` · md5 test `00b38606…` · combat 6/6 · siege-ai 17/17

- `combat.ts` + `siege.ts` czytają z `gra/data/combat-params.json` (bez `main.ts`).
- Scal z ROBOCZA → bramka → publish kanon.

### UNITS — typeId na mapie · **P1-B**

**Warstwa:** 🟢 · **Handoff:** `UNITS-do-INTEGRATOR_map-units-typeId-P1.md` · bez `main.ts`

### MAPA — ulepszenia P1-04 · **P1-C**

**Warstwa:** 🟢 · **Handoff:** `MAPA-do-INTEGRATOR_ulepszenia-audit-P1-04.md`

### F-FOOD-HODOWLA-01 — kanon żywność + hodowla + warstwy na heksie

**Status:** ✅ **→ MASTER: GOTOWE-ROBOCZA** (2026-06-26) — md5 `C0A64D12…` *(stary — patrz AKTUALNY KANON; scalone w 4602e752…)* · playtest Maciej odłożony

**Warstwa:** 🟡 cross · **Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

| Krok | Lane | Status | Handoff |
|------|------|--------|---------|
| T0a | **EKONOMIA (B)** | ✅ | moduły + JSON · test **21/21** |
| T0b | **MAPA (A)** | ✅ | kwalifikacja + render · qualify **32/32** |
| **T1** | **Integrator F** | ✅ | `MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md` · ROBOCZA md5 `C0A64D12…` *(stary — patrz AKTUALNY KANON)* |

**Weryfikacja (2026-06-29):** lane A+B GOTOWE · Panel-A export hodowli ✅ · czeka wpięcie F

## 🔜 NASTĘPNY: E2 — gęstość świata (**P3**, po Panel-A)

**Status:** ⏸ **CZEKA** — nie równolegle z Panel-A P1

**Warstwa:** 🟡 cross · **Decyzja:** `docs/decyzje/E2-gestosc-swiat-kreator.md` · **Plan:** `dyspozycje/_handoff/MASTER-PLAN-E2-gestosc-swiat.md`

Integrator F **nie publikuje** E2 dopóki MAPA nie dostarczy generatora — sam rebuild UI nic nie da w grze.

| Krok | Lane | Status | Handoff |
|------|------|--------|---------|
| 1 | **UI (E)** | 🔄 | kreator gęstości (UI-only częściowo w src) |
| 2 | **MAPA (A)** | 🎯 | generator opts → `MAPA-do-SILNIK_E2-world-opts.md` |
| 3 | **Integrator F** | ⬜ po 2 | `MASTER-do-SILNIK_E2-gestosc-wpiecie.md` · `main.ts` + ROBOCZA |

**AC Integratora F (E2):**
1. Weryfikacja: `generujSwiat` przyjmuje `WorldGenerationPreset` + `civTypesCount` z `NewGameParams`
2. Playtest: Mało vs Dużo surowców — widoczna różnica · suwak typów cywilizacji zmienia liczbę klastrów
3. `.\tools\bramka-test-publish.ps1` + forest-parity 98/98
4. Wpis tutaj + `DZIENNIK-MASTERA.md` + MD5 ROBOCZA

**Odłożone (osobny batch, nie E2):** okolica overlay Civ V (`cityOkolicaOverlay.ts` — tylko sandbox `okolicapreview`, handoff `okolica-overlay-2026-06-26.md`).

## 🛠️ ZADANIA INTEGRATORA (proces — od Mastera)

- **[ISO-4] Bramka wizualna (render smoke)** — dodać do bramki zrzut ekranu mapy + miasta + HUD i porównanie z odniesieniem, żeby regresje wizualne („mapa się wykrzaczyła") wykrywały się **przed** publikacją `ROBOCZA`. Status: 🟡 ZAPISANA.
- **[ISO-3] Mapa połączeń** — utrzymywać `docs/obieg/MAPA-POLACZEN.md` (uzupełniać po każdym nowym couplingu). Status: 🔵 W TRAKCIE.
- **[PANEL-P0-FIX #3] Wpięcie paneli w kod (audyt zweryfikowany 2026-06-28)** — silnik NIE czyta wyeksportowanych JSON-ów (potwierdzone: brak odwołań w `gra/src`):
  - `e-start-params.json` → wpiąć w `victory.ts`, `tech-tempo.ts`, `newGameMapDefaults.ts` (dziś czytają stałe z kodu).
  - `map-gen-params.json` → wpiąć w `generator.ts` (dziś nieimportowany; P3 E2).
  - Bez tego balans z Excela (E + część A) jest „na papierze", nie w grze. Status: 🟡 ZAPISANA. Czeka handoff od A/E lub decyzję kolejności E2.

## ⛔ BLOK (konflikt techniczny → MASTER)

- (brak)

---

## Bramka testów (po każdym wpięciu — musi być ZIELONA)

```
cd gra
node tools/okolica-test.cjs
.\tools\bramka-test-publish.ps1
node tools/map-quality-forest-parity-test.cjs
```

Ostatni stan bramki: ✅ ZIELONA · ROBOCZA md5 **`4B360364201828D2F0D5B6C3C40EE556`** (2026-07-01 batch P3 B-B5-SPICHLERZ) · spichlerz 9/9 · empire-food-b5 10/10 · food-hodowla 26/26 · logic 203/203 · combat 6/6 · smoke · battle-smoke · diplo 143/143 · ai 193/198 (5× T2S pre-existing)

---
🔗 Historia kolejek: `docs/archiwum/` · Kontrakty: `dyspozycje/_handoff/`
