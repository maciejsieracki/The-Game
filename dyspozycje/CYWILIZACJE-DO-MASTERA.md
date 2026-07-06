# CYWILIZACJE → MASTER / SILNIK (raporty Q&A)

Zasada: append-only · najnowszy wpis na górze.

**Od 2026-06-29:** dyspozycje wysyła **SILNIK** (manifest `SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md`).

---

### [2026-07-05 ~23:05] **→ MASTER: GOTOWE · JSON upgrade budynków (ABC-20…24)**

**Handoff:** `_handoff/EKONOMIA-do-MASTER_upgrade-2026-07-05.md` (sekcja JSON)  
**Plik:** `gra/data/buildings.json` — `upgradeFrom`, łańcuchy (port→port_wielki, fort, akademia…), sumy bonusów per poziom  
**Backup:** `.bak-*` jeśli lane zrobił przed edycją  
**Test:** `upgrade-budynki-test.cjs` 28/28 · robocza md5 **`eac24a66`**  
**Lane CYW:** dane tylko — logika w EKONOMIA/UI · **NIE** commitowane na GitHub (czeka Master)

---

### [2026-07-04] **→ Maciej: Panel-D** — sync JSON → Excel (bez exportu)

**Trigger:** Maciej — najpierw uzupełnij Panel-D, dopiero potem export.

| Akcja | Wynik |
|-------|--------|
| `gen-panel-d.py` | `panele-sterowania/Panel-D.xlsx` — **14 arkuszy** |
| Źródło | bieżące `civs.json`, `civ-ai.json`, `civ-params.json`, `diplomacy.json`, `ai-params.json` |

**Zawartość (15 nacji):**
- `Bonusy-cywilizacji` — 45 wierszy (3 bonusy × 15) · draft % z JSON
- `AI-archetyp` — roster-6 własne klucze (Q7=A) · **Hetyci nauka=2**
- `AI-per-nacja`, `Dyplomacja-per-nacja`, `Parametry-cyw`, `Cywilizacje-roster`

**Export:** **NIE** uruchomiony — czeka edycja Macieja w Excelu (kolumna Wartosc) → sygnał **eksportuj panel D**.

---

### [2026-07-04] **→ MASTER: KOREKTA** — Hetyci nauka +2 (Maciej)

**Trigger:** Maciej — Hetyci i Babilonia: silna nauka na epokę; minus tylko na wojsku (Babilonia), nie na nauce.

| Cywilizacja | Zmiana |
|-------------|--------|
| Hetyci | `nauka_priorytet` −1 → **+2** (biblioteki, pismo klinowe) |
| Babilonia | bez zmiany wartości: nauka **+2**, wojsko **−1** (prawo/kapłani przed armią) |

---

### [2026-07-04] **→ MASTER: BATCH** — roster-6 archetypy AI (D-ROSTER-Q7=A)

**Trigger:** Maciej — czerwone tematy CYW (własne archetypy zamiast fallbacków).

| Plik | Zmiana |
|------|--------|
| `gra/data/ai-params.json` | +24 klucze `archetype_{harappa,hetyci,slowianie,babilonia,asyria,fenicjanie}_*` |
| `gra/src/game/ai.ts` | `ArchKey` + `CIV_TO_ARCH` — 6 własnych kluczy (nie egipt/germanie/sumer/zulusi/chiny) |
| `gra/tools/ai-test.cjs` | T3e–T3h: klucze JSON + behawior Harappa/Asyria + roundtrip 6 typów |

**Backup:** `ai-params.json.bak-CYW-2026-07-04` · `ai.ts.bak-CYW-2026-07-04`

**Wpięcie kanonu:** nie wymaga `main.ts` — loader czyta `ai-params.json` + `ai.ts` przy buildzie. MASTER: build + bramka `node tools/ai-test.cjs` przy następnym batchu.

**DoD:** ai-test T3e–T3h ZIELONE · 15 typów ma unikalne archetypy produkcyjne.

---

### [2026-07-04] **→ GRUPA C: HANDOFF** — brief jednostek (CYW nie implementuje statów)

**Trigger:** korekta Macieja — lane CYW = dane cyw + dyplomacja, **nie** `units.json`.

| Deliverable | |
|-------------|---|
| Handoff | `dyspozycje/_handoff/CYW-do-GRUPA-C_jednostki-spec-brief-2026-07-04.md` |
| Decyzje | CELT-Q1/Q2=A w `docs/decyzje/D-CELT-JEDNOSTKI-2026-07-04.md` |
| Cofnięte | błędna edycja `units.json` przez CYW |

**Grupa C:** trigger `działaj` · macierz TW + wpisy JSON. **EKONOMIA:** CELT-Q3 filtr Nacja (osobny handoff).

---

### [2026-07-03 ~22:45] **→ CYWILIZACJE/AI: INFO** — HP jednostek z TW `health`

**Handoff zbiorczy:** `_handoff/MASTER-do-ALL-LANES_sync-TW-balans-2026-07-03.md`  
**Kod:** `ai.ts` · `_unitMaxHealth` → `def.health ?? def.Health` (spójnie z pass balansu).  
**Lane:** bez dalszych zmian; grep `def?.Health` w AI jeśli nowe miejsca.

---

**Stan:** `completedWorldWonders` · toolbar Cuda (picker) · produkcja · save/load  
**Bramka:** 7/7 wonder · logic 203 · smoke ✅  
**Playtest:** Maciej — Grecy ep.3 + Inżynieria → Kolos  
**KANON:** CZEKA Opus (`MASTER-do-OPUS_review-epoka-cuda-2026-07-03.md`)

---

### [2026-07-03] → MASTER: CUDA-G1 wonder-availability (moduł GOTOWE · wpicie CZEKA)

**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_cuda-g1-wonder-availability.md`  
**Test:** `wonder-availability-test.cjs` **7/7**  
**API:** `evaluateWonderBuildGate` · `listBuildableWondersForCiv`  
**MASTER:** stan `completedWorldWonders` + panel budowy + 1 batch `main.ts`

---

### [2026-07-03] → MASTER: epoka wejścia państw + cuda Antyk (GOTOWE dane/testy · CZEKA kanon + silnik cudów)

**Od:** sesja Maciej + lane CYWILIZACJE (kontekst MASTER)  
**Handoff:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_epoka-wejscia-cuda-2026-07-03.md`

| Deliverable | Stan |
|-------------|------|
| Kaskada `epokaWejscia` (civs.json, kreator, AI roster) | ✅ |
| Reguła tech cudów E + poprawki wonders.json | ✅ |
| Testy `civ-entry-epoch` 11/11 · `wonder-civ-tech` 5/5 · `civ-roster` 14/14 | ✅ |
| `main.ts` — filtr AI po `_menuEpochId` | ✅ (review MASTER) |
| Gameplay budowy cudów (`wonders-data` → production/UI) | ❌ **MASTER ma zaimplementować** |
| Kanon `Gra-podglad.html` | ✅ md5 `DB1F508B…` · **Opus CZEKA** |

**Kluczowe korekty danych:** Fenicjanie **Brąz** (nie Żelazo); Kolos + Koloseum → **Inżynieria**, epoka cudu **3**.

---

### [2026-07-02] → MASTER: GOTOWE — **P2 Panel-D export** (`start`)

**Od:** Grupa D · **Trigger:** Maciej `start` · P1 victory → F ✅  
**Eksport:** `export-d.py` — dip=80 · ai/bar=76 · bonusy/roster 15 · akcje 13 · **zmian=0** (Excel = JSON)  
**Test:** `test-panel-d-roundtrip.py` **PASS**  
**P1:** F meldunek `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` · kanon md5 `188437eb…`  
**Lane D:** **IDLE**

---

### [2026-07-02] → MASTER: GOTOWE — E-P0-06 ekran zwycięstwa (D+E)

**Od:** Grupa D + E (cross-lane) · **Dyspozycja:** `MASTER-PILNE-2026-07-02.md` P1  
**Warstwa:** 🟢 `victory.ts` + `victoryScreen.ts` · 🟡 wpięcie F (`main.ts`)  
**Decyzja:** 10=A* — dominacja Power>50% + nauka (tech+rakieta)

| Deliverable | Dowód |
|-------------|--------|
| Audit | Logika ✅ w `victory.ts` · UI ❌ brak modułu — był tylko inline `showGameOverOverlay` w `main.ts` |
| `gra/src/ui/victoryScreen.ts` | **NOWY** — E-15: dominacja / nauka / przegrana + statystyki + „Nowa gra" |
| `gra/tools/victory-screen-test.cjs` | **11/11** |
| `gra/tools/victory-test.cjs` | **12/12** (bez regresji) |
| Panel-D | `export-d.py` OK · `test-panel-d-roundtrip.py` **PASS** |
| Handoff F | `CYWILIZACJE-do-INTEGRATOR_victory-screen-2026-07-02.md` |

**Nie ruszone:** `main.ts` · `gra-kanon/`

**Co sprawdzić po wpięciu (Integrator):** 3 warianty overlay (złoto dominacja/nauka, czerwień porażka) · Power % na dominacji · reload „Nowa gra".

---

### [2026-07-02] → MASTER: ACK **SILNIK-D-V11** (review APPROVE)

**Od:** Grupa F · **Meldunek:** `F-do-MASTER_SILNIK-D-V11-wiring-2026-07-02.md`  
**Bramka Master:** treaties 9/9 · economy 6/6 · proposal 31/31 · diplo 143/143 · smoke OK  
**Kanon:** md5 **`de9b53e43997d8ec195f209054f46d3a`**  
**Lane D / F:** **IDLE** · czeka playtest Maciej **PT-D3**

---

**Od:** Grupa D (CYWILIZACJE) · **Dyspozycja:** `MASTER-do-CYWILIZACJE_P5-P6-dyplomacja.md`  
**Warstwa:** 🟢 izolowane moduły · 🟡 po wpięciu F (relacje, save)  
**Decyzje:** `D3-przemarsz-kara-ABC.md` · W5-A tech Rel≥100 (handoff F)

| Deliverable | Dowód |
|-------------|--------|
| `gra/src/game/diplomacy-border-march.ts` | `hasAuthorizedBorderCrossing` · `applyUnauthorizedBorderPenalties` · param JSON |
| `gra/src/game/diplomacy-basket-transfer.ts` | `grantTechToOwner` · `grantSurowiecBooleanAccess` · `BasketTransferContext` |
| Test P5 | `diplomacy-border-march-test.cjs` **9/9** |
| Test P6 | `diplomacy-basket-transfer-test.cjs` **8/8** |
| Handoff F | `CYWILIZACJE-do-INTEGRATOR_P5-P6-dyplomacja.md` |
| Handoff UNITS (spec) | `CYWILIZACJE-do-UNITS_przemarsz-kara-zaufanie.md` (już był) |

**Nie ruszone:** `main.ts` · `tech.json` · `gra-kanon/`

**Co sprawdzić po wpięciu (Integrator):** endTurn −5 Zauf./para · sojusz/granice = 0 · tech/surowiec w koszyku realnie transferowane.

**Slack:** ✅ outbox `SLACK-OUTBOX-P5-P6-2026-07-01.md` · #master #grupa-d (2026-07-01)

---

### [2026-06-30] Wymiana PN — handoff UI + Integrator (Maciej: deleguj + archiwum)

**Decyzje:** D3-W1…W11 zamknięte · pakiet ABC w `docs/decyzje/D3-wymiana-OTWARTE-ABC.md`

**Handoffy:**
- `dyspozycje/_handoff/CYWILIZACJE-do-UI_handel-koszyk-pn.md` 🟢
- `dyspozycje/_handoff/CYWILIZACJE-do-INTEGRATOR_wymiana-pn-zaufanie.md` 🟢

**Archiwum:** `docs/archiwum-czatow/maciej-decyzje/D3-wymiana-PN-handel-dar_2026-06-30.md`

**Kod lane D:** `diplomacy-value-catalog.ts` · test 41/41 · **bez main.ts**

**Kolejność:** UI koszyk → Integrator 1 batch → review → kanon

---

### [2026-06-30] Sojusz v1.2 — siła proponenta UŁATWIA pakt (decyzja Maciej)

**Problem:** `partnerRw ∈ [0.4, 0.7]` blokował silnego gracza — odwrócona logika.

**Nowy model:**
- Usunięto blokadę „tylko równi partnerzy”
- `diplomacyProposerStrengthEase()` — przewaga Mocy/Respektu **obniża progi** (Panel-D: `progSojuszPremia*`)
- Słaby proponent (mil < 0.5) bez pełnej relacji → odrzucenie
- `willingnessAlly` rośnie gdy rozmówca silniejszy

**Testy:** proposal 17/17, diplomacy 140/140

---

**Od:** Grupa D · **Do:** Integrator + UI

| Deliverable | Status |
|-------------|--------|
| 20 progów propozycji → `diplomacy.json` + `getEffectiveDiplomacyParams()` | ✅ |
| 9 progów AI → `ai-params.json` + `loadDefaultAIDiplomacyProgs()` | ✅ |
| `dyplomacja_relacja_handel` podpięte (handel AI) | ✅ |
| Opis `jednostka_wojskowa` = suma M | ✅ power-params.json |
| BBBB display w grze | ⬜ handoff Integrator+UI |

**Handoffy:**
- `CYWILIZACJE-do-INTEGRATOR_diplomacy-display-ui-batch.md`
- `CYWILIZACJE-do-UI_diplomacy-params-GOTOWE.md`

**Testy:** diplomacy-proposal + diplomacy (uruchomione w sesji)

**Następny:** UI audiencja v2 → Integrator main.ts → Opus → kanon

---

### [2026-06-30] → GRUPA D: M jednostki WPIĘTE w Power — **dyplomacja ma wpiąć**

**Od:** Integrator F · **Do:** Grupa D (dyplomacja, AI, Panel-D)

**Handoff:** `dyspozycje/_handoff/INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md`

| Co | Status |
|----|--------|
| M w JSON + `unit-power.ts` | ✅ UNITS |
| Suma M → składnik Armia Power | ✅ Integrator (`sumArmyMForOwner` w main.ts) |
| Respekt z objective Power | ✅ **automatycznie widzi M** |
| `militaryRatio` (propozycje + AI) | ✅ suma M · batch `MILITARY-RATIO-M-v1` |
| Panel-D progi po wyższym Power | ⬜ weryfikacja Grupa D |

**Kanon:** md5 `3DAE1AA5C463CFD9E90F77C5D2DCFC76`

**Hasło czatu D:** `start` → handoff powyżej · **nie** edytować `main.ts` bez handoffu Integratora

---

### [2026-06-30] Moc jednostki (M) → Power — handoff dla Grupy D

- **Plik:** `dyspozycje/_handoff/CYWILIZACJE-do-GRUPA-D_moc-jednostek-power.md`
- **M w JSON:** ✅ `fieldPower` / `siegePower` w `units.json`
- **M w TS:** ✅ `gra/src/game/unit-power.ts` · test 6/6
- **Panel-C:** ✅ Stale-moc + Moc-jednostek (formuły Excel)
- **SILNIK handoff:** `UNITS-do-SILNIK_unit-power-moc.md` (wpięcie sumy M → Power)
- **Hasło Macieja:** `Grupa D: odczytaj moc-jednostek-power`

---

### [2026-06-26] START D3-UX — `diplomacy-display.ts` 🟢

**Moduł:** `gra/src/game/diplomacy-display.ts` — tagi, ratio Mocy, tooltip Respekt  
**Test:** `diplomacy-display-test.cjs` **8/8**  
**Handoff SILNIK:** `_handoff/CYWILIZACJE-do-SILNIK_diplomacy-display-v2.md`  
**Czeka:** UI layout audiencji + SILNIK `getState()` (lane UI/SILNIK, nie CYW)

---

### [2026-06-26] D3-UX **ZAMKNIĘTE** — Maciej **BBBB**

**Decyzja:** `docs/decyzje/D3-UX-relacja-parametry-ABC.md` — lista badge statusu · audiencja pełna · tagi PL · Moc+stosunek  
**→ UI + SILNIK:** handoff `CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md`  
**→ CYW:** `diplomacy-display.ts` (tagi) — można startować

---

### [2026-06-26] RAPORT SESJI — dyplomacja · Moc · Respekt · UX (Grupa D)

**Zakres:** wyjaśnienia modelu, tuning v1, spec UX audiencji, backlog armia ważona.

| Temat | Status | Dokument |
|-------|--------|----------|
| Moc P-A w silniku | ✅ wpięte | `P-A-power-kanon.md` |
| Tuning progów 60/70/90 | ✅ **zostają** | `D3-moc-respekt-tuning-scenariusze.md` |
| Wyjaśnienie Respekt (ratio) | ✅ w czacie + scenariusze | np. 4000:2000→67, 40k:2k→95/5 |
| UX panel relacji audiencja | ⏳ **CZEKA ABC** Macieja | `D3-UX-relacja-parametry-ABC.md` |
| Handoff integrator | 🟢 | `CYWILIZACJE-do-INTEGRATOR_diplomacy-power-ready.md` |
| Armia flat 25 pkt/jedn. | 📋 **backlog P-C4** (bez kodu) | rekom. A: reuse `estimateUnitCombatStrength` |
| JSON / `main.ts` | bez zmian w sesji | — |

**Testy:** power 9/9 · diplomacy 135/135.

**Decyzje czekające Macieja:** `D3-UX-1=B, D3-UX-2=B, D3-UX-3=B, D3-UX-4=B` (rekomendacja).

**Następne:** SILNIK+UI batch audiencja (Moc obu stron) · opcj. P-C4 ABC (waga armii per typ).

---

### [2026-06-26] Tuning dyplomacji v1 (Moc P-A) — **ZAMKNIĘTY** · → INTEGRATOR 🟢

**Wejście MASTER:** `EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md` + `EKONOMIA-POWER-RESPEKT-SPEC.md`

| Wynik | Szczegóły |
|-------|-----------|
| **Progi Panel-D** | **Bez zmian JSON** — 60 (NAP AI) / **70** (wasal) / **90** (wchłonięcie) spójne z ratio Mocy |
| **Scenariusze** | `docs/decyzje/D3-moc-respekt-tuning-scenariusze.md` (8 par + mapowanie 1,5:1 … 9:1) |
| **Testy** | `power-objective-test.cjs` **9/9** · `diplomacy-test.cjs` **135/135** |
| **Integrator** | `_handoff/CYWILIZACJE-do-INTEGRATOR_diplomacy-power-ready.md` 🟢 |
| **UI** | D3-UX czeka ABC Macieja — bloker Power zdjęty |
| **Legacy** | `respekt_-_czynniki` / Potęga 0–100 — **nie używać** |

**Przykład kalibracji:** Moc 3020 vs 1295 → Respekt **70** (próg wasala). vs 336 → **90** (wchłonięcie).

---

### [2026-06-26] **→ GRUPA D: MOC GOTOWA** — liczcie dyplomację (Respekt = ratio Mocy)

**Maciej:** Grupa D czekała na Power — **odblokowane**.

| Co | Gdzie |
|----|--------|
| Handoff | `_handoff/EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md` |
| Spec kanon | `_scalone/EKONOMIA/EKONOMIA-POWER-RESPEKT-SPEC.md` |
| Wklejka czat D | `docs/grupa-d/OD-MASTERA-MOC-RESPEKT-GOTOWE.md` |
| Moc (pkt) | Panel-B `Potega-P-A` |
| Dyplo (progi) | Panel-D `Dyplomacja` |

**NIE używać:** `diplomacy.json` → `panel_sterowania.A` (stare wagi Potęgi 0–100).  
**D3-UX bloker Power:** zdjęty — można iść w UI relacji po tuningu Panel-D.

---

**Kontekst:** Respekt = ratio Mocy; wytyczne UX per nacja do plików.  
**Decyzja:** `docs/decyzje/D3-UX-relacja-parametry-ABC.md` (D3-UX-1…4)  
**Handoff UI:** `_handoff/CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md`  
**Bloker integratora:** ~~eksport Panel-B Power~~ **ZDJĘTY** — tuning Panel-D + D3-UX możliwy  
**Rekomendacja CYW:** lista lekka (B) · audiencja pełna (B) · tagi charakteru (B) · Moc para+stosunek (B)

### [2026-06-26] D3-UX — panel relacji audiencja (Moc + dyplomacja) — CZEKA ABC (tylko decyzje UX)

### [2026-07-01] D-ROSTER ABC — ZAMKNIĘTE (formularz)

**Q1=A** Sumer/Babilonia osobno · **Q2=A** nazwy jednostek · **Q3=B** pula **15** typów do losowania (mapa=E1 bez zm.) · **Q4=B** Excel first · **Q5=A** Tyrski miecznik · **Q6=A** Tier2 zaraz po Tier1 · **Q7=A** nowe archetypy  
**Dok:** `docs/decyzje/D-cyw-roster-6-REZERWA.md` · **Czeka:** Panel-D + eksport Macieja

---

**Tier 1 (wdrożyć pierwsze):** Harappa · Hetyci · Słowianie  
**Tier 2 (rezerwa):** Babilonia · Asyria · Fenicjanie  
**Dok:** `docs/decyzje/D-cyw-roster-6-REZERWA.md` · JSON draft `Civ-CYWILIZACJE/draft/roster-6-REZERWA.json`  
**Zawartość:** charakterystyki, bonusy draft, AI, dyplomacja, nazwy jednostek spec. (+ W zamian za), plan wdrożenia, ABC Q1–Q7  
**Gra:** **nie dotykana** — czeka decyzje + sygnał implementacji Tier 1

---

### [2026-07-01] Maciej — 3 brakujące cywilizacje v1 (backlog)

**Decyzja:** dodać na początkowym etapie **Harappa** (Indusowie, ep. kamień) · **Hetyci** (ep. brąz) · **Słowianie** (ep. żelazo); reszta rosteru później.  
**Uzupełnienie:** Indusowie → nazwa kanoniczna **Harappa** (Maciej 2026-07-01).  
**Dok:** `docs/decyzje/D-cyw-brakujace-v1.md`  
**Stan dziś:** 9 typów w `civs.json` → docelowo 12  
**Implementacja:** czeka sygnał + opcjonalnie charakter/jednostka spec. per nacja  
**Nie blokuje:** dyplo v1.1 kod ✅ · Figma D STOP · Power (osobny wątek)

---

### [2026-06-30] EKO + UI v1.1 — moduły dostarczone → **SILNIK-D-V11**

**EKO:** `diplomacy-economy.ts` · test 5/5 · handoff tick T1A  
**UI:** `diplomacyNegotiationModal.ts` · `diplomacyProposalBanner.ts` · audiencja payload  
**Batch F:** `EKONOMIA+UI+CYW-do-SILNIK_v1.1-diplomacy-batch.md` · kolejka `F-KOLEJKA-P0.md`

---

### [2026-06-30] D3 v1.1 — **MODUŁ CYW DOMKNIĘTY** ✅

**Decyzje:** T1A · T2 dwa sojusze · T3A · T4B — `docs/decyzje/D3-v1.1-MACIEJ-2026-06-30.md`  
**Kod lane CYW (bez main.ts):**
- `gra/src/game/diplomacy-treaties.ts` — traktaty, sojusze def/pełny, NAP expiry, wojna zerwie pakt, tributeDeals
- `gra/src/game/diplomacy-proposals.ts` — `evaluateProposal`, `applyAcceptedProposal`, `aiCommandToPendingProposal`, pending AI  
**Testy:** `diplomacy-treaties-test.cjs` **7/7** · `diplomacy-proposal-test.cjs` **15/15** · `diplomacy-test.cjs` **135/135**  
**Handoffy → GOTOWE (moduł):**
- `CYWILIZACJE-do-SILNIK_v1.1-traktaty-save-load.md`
- `CYWILIZACJE-do-EKONOMIA_v1.1-trybut-handel-tick.md`
- `CYWILIZACJE-do-UI_v1.1-audiencja-negocjacje.md`
- `CYWILIZACJE-do-UI_v1.1-CYW-logika-AI.md`  
**Następne:** F wpina storage/save · EKO tick · UI modale · potem odblokowanie kart audiencji w main

---

### [2026-06-30] D3 v1.1 — decyzje Macieja + start modułu traktatów

**ABC:** `T1A` · T2 **dwa sojusze** (def+pełny, brak wojny=zryw) · `T3A` · `T4B` sprint  
**Dok:** `docs/decyzje/D3-v1.1-MACIEJ-2026-06-30.md`  
**Kod:** `gra/src/game/diplomacy-treaties.ts` · enum `SojuszDefensywny`/`SojuszPelny` · test `diplomacy-treaties-test.cjs`  
**Następne:** EKO tick trybut · UI modale · F storage/save

---

**Od:** Grupa D · **Do:** F (`F-KOLEJKA-P0.md`, `SILNIK-DO-MASTERA.md`)  
**Handoff:** `CYWILIZACJE-do-SILNIK_bonusy-display-wire.md`

---

**UI:** audiencja + lista 🤝 + panel legacy — hook `getCivBonusy`  
**Handoff:** `CYWILIZACJE-do-SILNIK_bonusy-display-wire.md`  
**Pre-battle:** już działa (Batch B, wcześniej wpięte)

---

**Integrator batch:** SILNIK-D-5A-1 + bramka CYW + P1 Panel-C w jednym buildzie  
**5A:** `resolveArchetypeAggression` / `resolveArchetypeTrade` w main.ts ✅  
**E-P0-06 / E2-11:** wpięcie wcześniejsze · bramka victory 12/12 · barbarians 55/55 ✅  
**Kanon md5:** `9665790EE040660FC6615F8405D0DD0D` *(stary — aktualny kanon: `4602e752d7e4b21f3c2460e494e82a8f`)*  
**Czeka:** Opus · playtest · `rakietaWystrzelona` (ścieżka nauki — osobny batch)

---

### [2026-06-29] UX-INWENTARZ — Grupa D (dyspozycja `DYSPOZYCJA-INWENTARYZACJA-UX-A-E.md`)

**Rejestr:** `docs/ux/REJEST-UX-MASTER.md` § Grupa D — **15 wpisów** (D-01…D-15)  
**Status:** UX-INWENTARZ GOTOWE · lane CYW  
**Integrator:** nie wymagany (same docs)

---

**Zadanie PANEL (spec §3):** hub balansu D — **GOTOWE u lane** (czeka akceptacja Macieja → PANEL-2 w REJESTR).  
**Dostarczone:** `gen-panel-d.py` · `export-d.py` (+ `--xlsx`/`--data-dir`) · `test-panel-d-roundtrip.py` · `Panel-D.xlsx` (7 arkuszy)  
**Test:** round-trip OK (dyplomacja + barbarzyńcy) · dry-run: 38 + 60 param.  
**Maciej:** otwórz `Panel-D.xlsx` → kręć **Wartość** → w czacie: **eksportuj panel**  
**Integrator:** **NIE wymagany** (same JSON) · 🟢

---

### [2026-06-28] PANEL — Grupa D: gen + export + inwentaryzacja

**Zadanie PANEL (spec §3):** hub balansu D dla Macieja.  
**Dostarczone:** `panele-sterowania/gen-panel-d.py` · `export-d.py` · `docs/obieg/D-PANEL-INWENTARYZACJA.md`  
**Maciej lokalnie:** `python panele-sterowania/gen-panel-d.py` → otwórz `Panel-D.xlsx`  
**Integrator:** **NIE wymagany** (same JSON przez export) · 🟢 izolowana, chyba że nowy param w `.ts`

---

### [2026-06-29] Maciej — paczka v1.1 Tier 2–3 dyplomacji (spec + handoffy)

**Spec ABC:** `docs/decyzje/D3-v1.1-TIER23-paczka.md` (T1–T4 czeka litery)  
**Handoffy:** `…-do-EKONOMIA_v1.1-trybut-handel-tick.md` · `…-do-UI_v1.1-audiencja-negocjacje.md` · `…-do-SILNIK_v1.1-traktaty-save-load.md` · `…-do-UI_v1.1-CYW-logika-AI.md` (zakres CYW)

---

### [2026-06-29] `start` — bramka OK · lane bez roboty kodowej

**Maciej dyspozycja:** bonusy walki + victory/barbarians = GOTOWE u lane · walka CYW **tylko** przy diplomacy FAIL · **NIE** preBattle (UI) · **NIE** battleScene (UNITS).

| Test | Wynik | Akcja CYW |
|------|-------|-----------|
| diplomacy-test | **135/135** | **brak** — `diplomacy.ts` nietknięty |
| civ-bonusy-test | **30/30** | **GOTOWE** (`civs.json` + `civ-bonusy.ts`) |
| victory-test | **12/12** | **→ SILNIK: GOTOWE** (moduł lane) |
| barbarians-test | **55/55** | **→ SILNIK: GOTOWE** (moduł lane) |

**Handoffy na F:** `…-victory-10A.md` · `…-barbarians-11C.md` · reszta D (5A 1 linia) — patrz audit 2026-06-28.

**Lane CYW:** **PUSTY** · **NIE** `main.ts` · **NIE** `preBattle.ts` · **NIE** `battleScene`

---

### [2026-06-29] CYW — start sesji: bramka diplomacy OK · kolejka lane pusta

**Test:** `node tools/diplomacy-test.cjs` → **135/135 PASS** — **bez zmian** w `diplomacy.ts`

**Potwierdzenie modułów (nie powtarzać):**
| ID | Status | Test |
|----|--------|------|
| D-P0-01 | ✅ DONE | — |
| E-P0-06 victory 10A | ✅ lane → **→ SILNIK: GOTOWE** | 12/12 |
| E2-11 barbarians 11C | ✅ lane → **→ SILNIK: GOTOWE** | 55/55 |

**Handoffy czekające na F/SILNIK (main.ts):**
- `_handoff/CYWILIZACJE-do-SILNIK_victory-10A.md`
- `_handoff/CYWILIZACJE-do-SILNIK_barbarians-11C.md`

**Lane CYW:** brak nowej pracy kodowej · **NIE** `main.ts` · **CZEKA Macieja:** D3 audiencja (ABC)

---

### [2026-06-28] Maciej — routing: tech + nauka → Grupa B

**Decyzja:** drzewko technologii i parametry nauki = **EKONOMIA/Miasto (Grupa B)**. CYW = dyplomacja + cywilizacje + AI + zwycięstwo/barbarzyńcy.

**Dokument:** `docs/decyzje/ROUTING-tech-nauka-Grupa-B.md`  
**Handoff:** `CYWILIZACJE-do-EKONOMIA_transfer-tech-nauka.md`  
**CYW od dziś:** nie edytuje `tech.json` — tylko odczyt (`ai.ts`, `victory.ts`).

---

### [2026-06-29] SILNIK → CYW: status + wpiecenie F

**Moduły GOTOWE (lane):** victory 10A · barbarians 11C · D-P0 bonusy — handoffy `CYWILIZACJE-do-SILNIK_*.md`  
**SILNIK:** wpina do `main.ts` (sekcja A manifestu) — **CYW nie rusza main.ts**

**Jeśli diplomacy-test FAIL:** napraw w `diplomacy.ts` + meldunek.

---

(historia archiwum: `docs/archiwum/dyspozycje/CYWILIZACJE-DO-MASTERA.md`)

---

### [2026-07-01] Roster 6 → Panel-D (Q4B pipeline)

**Decyzje Macieja:** D-ROSTER ABC (Q1A sumer/babilonia osobno, Q3A pula 15, Q4B Excel first, Q6A Tier2 razem, Q7A archetypy AI).

**Wykonano (lane D, bez gra/data):**
- `merge-roster-6-panel-d.py` → `panele-sterowania/Panel-D.xlsx` (+6 nacji, Sumer ikonaId/typCywilizacji → sumer)
- `import-roster-6-civs.py` gotowy (dry-run: 9→15 wpisów)

**CZEKA Macieja:** otwórz Panel-D → popraw Wartości (bonusy, AI, dyplomacja) → w czacie: **eksportuj panel**

**Potem agent:** `export-d.py` + `import-roster-6-civs.py` → handoff `_handoff/CYWILIZACJE-do-SILNIK_roster-15-enum.md`

**NIE wdrożono:** `civs.json`, enum TS, archetypy diplomacy.ts (do eksportu)

**Rejestr parametrów (globalny, bez haseł):** `docs/decyzje/D-cyw-REJESTR-PARAMETROW-GLOBAL.md` — ~78 slotów, propozycja `param_id` + Excel `Cyw-parametry`

**Macierz liczb (118 params × 15 cyw, 12 zakladek):** `Cyw-macierz-REVIEW.xlsx` lub `Panel-D.xlsx` (Cyw-00-INFO … Cyw-12-POTEGA) · JSON `gra/data/civ-matrix.json` · `CYW-MACIERZ-README.md`

---

### [2026-06-30] start — M→Power wpięte · militaryRatio kontrakt

**Handoff Integrator:** `INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md` 🟢 (kanon md5 `3DAE1AA5…`)

**Wykonano (lane D):**
- `computeMilitaryRatioFromArmyM()` w `diplomacy.ts` + 5 asercji w `diplomacy-test.cjs`
- Handoff: `CYWILIZACJE-do-INTEGRATOR_militaryRatio-army-m.md` (2 miejsca w `main.ts`)
- Respekt bez zmian — już liczy M przez objective Power

**Czeka Integrator:** podmiana headcount → M w `buildProposalEvalContext` + pętla AI

**Panel-D:** progi 60/70/90 — ocena po playteście Macieja (bez zmian bez ABC)


**Od:** Grupa C / UNITS · **Do:** SILNIK + Grupa D (weryfikacja po wpięciu)

| Deliverable | Status |
|-------------|--------|
| `units.json` → `fieldPower` (50) + `siegePower` (3) | ✅ |
| `gra/src/game/unit-power.ts` + test 6/6 | ✅ |
| `combat-params.json` → `unit_power` | ✅ |
| Panel-C Moc-jednostek + Stale-moc | ✅ |
| Handoff Integrator balans TW v3 | ✅ |
| Handoff SILNIK M→Power | ✅ `UNITS-do-SILNIK_unit-power-moc.md` |
| Wpięcie `sumArmyFieldPower` w `main.ts` | ⬜ SILNIK |

**Grupa D:** handoff zaktualizowany `CYWILIZACJE-do-GRUPA-D_moc-jednostek-power.md` · Respekt/AI bez zmian kodu do batchu SILNIK.

---

### [2026-07-01] **PANEL-P0 sprint · Grupa D — sync Panel-D → JSON**

**Temat:** PANEL-P0-FIX · Excel ≠ JSON (dry-run ~76 zmian AI/barbarzyńcy)  
**Warstwa:** 🟢 izolowana (tylko `gra/data/*.json` D) · **bez `main.ts`**

**Panel-D.xlsx:** brakowało w repo → wygenerowano `gen-panel-d.py` (14 arkuszy)

**Eksport:** `export-d.py` — **OK**
| Cel | Wynik |
|-----|-------|
| `diplomacy.json` (params) | 80 parametrów |
| `ai-params.json` (+ barbarzyńcy) | 76 parametrów |
| `civs.json` (bonusy + roster) | 15 nacji |
| `civ-params.json` | 15 nacji |
| `civ-ai.json` | 15 nacji |
| `diplomacy.json` (akcje + perNacja) | 13 akcji + 15 nacji |

**Test:** `test-panel-d-roundtrip.py` — **PASS** (Dyplomacja `handelZawarcie_zaufanie` + Barbarzyńcy `barbarzyncy_start_tura`)

**Blokery:** brak — sync wykonany; xlsx nie było w workspace — odświeżone generatorem (Maciej może nadpisać własną kopią z edycjami).

**Co sprawdzić po wpięciu:** playtest dyplomacji/sojuszu v1.2 z nowymi progami z Excela.

