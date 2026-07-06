> ⛔ NIEAKTUALNE OD 2026-07-06 — NIE STOSUJ TEGO PROCESU.
> Obowiązujący obieg: dyspozycje/START-TU.md → dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md
> → dyspozycje/ROLE-I-ZAKRESY-2026-07-06.md. Kanał pracy: dyspozycje/_handoff/KANAL-PRACA.md.
> Wersje/md5 wyłącznie w dyspozycje/WERSJE.md. Roboczą publikuje tylko INTEGRATOR (Cowork);
> kanon/finalną tylko Grupa G (Cursor) z pakietu DO-KANONU. Zasada: TYLKO DO PRZODU (zero restore).
> Treść poniżej = HISTORIA (kontekst), nie instrukcja do wykonania.

# Grupa F (Silnik) — KOLEJKA P0

> **Czytaj TEN plik pierwszy** przy `master` / starcie czatu SILNIK.

**AKTUALNY KANON (2026-07-01):** md5 `4602e752d7e4b21f3c2460e494e82a8f` · szczegóły: `docs/obieg/INTEGRATOR-kolejka.md`

**Aktualizacja:** 2026-06-29 (P0 D3-Q2 + naprawa publikacji po raporcie lane)

---

## NASTĘPNY — wykonaj TERAZ

| ID | Notatka |
|----|---------|
| ⏸ | **Opus review** — batch **F-MOC-P-A-v1** md5 `49ab7306…` |
| ⏸ | **Playtest Macieja** — HUD **Moc** · overlay ⚜ · Respekt · Panel-B eksport |
| ✅ | **F-MOC-P-A-v1** — wpięte + kanon opublikowany 2026-06-26 |

**Dispatch:** F-MOC-P-A-v1 ✅ · poprzedni P0/P1 ✅ · kanon `49ab7306f9cafdfe7bbf6f01a7ede06b`

---

## ZROBIONE (2026-06-26 — batch F-POWER-MANPOWER-01 faza 3)

| ID | Status |
|----|--------|
| **F-POWER-MANPOWER-01** | ✅ HUD **Power** (abs.) zamiast Wpływ 0–100 · overlay pkt obiektywnych · Respekt % w panelu/🤝/audiencji |
| **Pliki** | `main.ts`, `hud.ts`, `powerOverlayHud.ts`, `diplomacyPanel.ts`, `diploListHud.ts` |
| **Testy** | manpower 22/22 · power-objective 6/6 · diplomacy 135/135 |

**Backup:** `gra/src/main.ts.bak-SILNIK-power-v2-2026-06-26`

---

## ZROBIONE (2026-06-26 — batch BONUS-C + V11 dyplomacja)

| ID | Status |
|----|--------|
| **SILNIK-D-BONUS-C** | ✅ `getCivBonusy: civBonusyForOwnerId` ×3 (panel, lista 🤝, audiencja) |
| **SILNIK-D-V11** | ✅ activeDeals, evaluateProposal, modale, tick trybutu, save/load, sojusze T2 hook, AI pending |
| **Bramka dyplomacja** | treaties 7/7 · proposal 15/15 · economy 5/5 · diplomacy 135/135 |
| **Build** | ✅ vite → `$env:TEMP\civ-dist` |

**Backup:** `gra/src/main.ts.bak-SILNIK-D-BONUS-C-V11-2026-06-26`

---

## ZROBIONE (2026-06-30 — batch CYW 5A + P1 Panel-C + typeId)

| ID | Status |
|----|--------|
| **SILNIK-D-5A-1** | ✅ `resolveArchetypeAggression` + `resolveArchetypeTrade` w main.ts |
| **E-P0-06 victory 10A** | ✅ bramka 12/12 (wpięcie wcześniejsze) |
| **E2-11 barbarians 11C** | ✅ bramka 55/55 (wpięcie wcześniejsze) |
| **P1-A Panel-C** | ✅ combat 6/6 · siege-ai 17/17 · bundel |
| **P1-B typeId mapa** | ✅ render/units.ts w bundlu |
| **KANON md5** | ✅ `9665790EE040660FC6615F8405D0DD0D` *(stary — aktualny kanon: `4602e752…`)*
| **Bramka pełna** | diplomacy 135 · ai 198 · + wszystkie standardowe |

**Backup:** `gra/src/main.ts.bak-SILNIK-CYW-5A-P1-batch-2026-06-30`

---

## ZROBIONE (2026-06-30 — batch integrator: OBL-CAP + panel v2 + manpower)

| ID | Status |
|----|--------|
| **BUG OBL-CAP-01** | ✅ `refreshMapAfterCityCapture` sync przed fog · szturm → `applyCityCaptureToMap` |
| **PANEL-MIASTO-UX-02** | ✅ mini 3D (`mountUnitMiniPreview`) · hover budynków na `thumb` · D-BUDYNKI A / D-JEDNOSTKI B |
| **Manpower w panelu** | ✅ pasek ⚔ rekruci + detail card · hook `getManpowerSnapshot` (main.ts) |
| **KANON md5** | ✅ `30DBBAF608E423E00C49E184297F65BD` *(stary — aktualny kanon: `4602e752…`)*
| **Bramka** | logic 203/203 · oblezenie 27 · siege-defenders 11 · smoke · battle-smoke · okolica 32/32 |

**Backup:** `gra/src/main.ts.bak-SILNIK-obl-cap-manpower-2026-06-30`

---

## ZROBIONE (2026-06-29 — P0 raport lane EKONOMIA+UI)

| ID | Status |
|----|--------|
| **D3-Q2 diplomaticContactEstablished** | ✅ `const diplomaticContactEstablished = new Set<number>()` w main.ts |
| **Publikacja HTML** | ✅ kanon + ROBOCZA + PLAYTEST-* = pełny bundel (nie redirect) |
| **bramka-test-publish.ps1** | ✅ przywrócony schemat Silnika (kopia bundla do ROBOCZA) |
| **KANON / ROBOCZA md5** | ✅ `798910e6d00b4cdf180a5b6f688c3a8e` |
| **Bramka** | smoke OK · diplomacy 135 · okolica 24/24 |
| **Handoff** | `EKONOMIA+UI-do-SILNIK_raport-spieprzenia-2026-06-29.md` P0 zamknięte |

**Backup:** `gra/src/main.ts.bak-SILNIK-D3Q2-diplo-fix-2026-06-29`

---

## ZROBIONE (2026-06-29 — fix OKOLICA playtest)

| ID | Status |
|----|--------|
| **F-B-OKOLICA-FIX** | ✅ `refreshCityPanelIfOpen` · reczny isWorked z `reczne` · health tiles = economy |
| **ROBOCZA** | ✅ md5 `F56696E7123F458D580E048CE3FBC98E` |

---

## ZROBIONE (2026-06-29 — batch zbiorczy rebuild)

| ID | Status |
|----|--------|
| **F-B-OKOLICA-TOGGLE** | ✅ okolica-test 21/21 · rebuild ROBOCZA (bez main.ts) |
| **E1 bundle + lane-only** | ✅ las parity 98/98 · typeId UNITS · P1-04 MAPA · UI E1/menu S0 w bundlu |
| **ROBOCZA** | ✅ md5 `808B87FD…` · bramka pełna ZIELONA |

---

## ZROBIONE (2026-06-29 wieczór)

| ID | Status |
|----|--------|
| **UI P0-D4** | ✅ configurePreBattle + ownerId w preBattleSideFromRoster |
| **OBL-S6** | ✅ refreshSiegeMarkers — obóz 3D (machinesByCampHex) |
| **E-P0 złoża** | ✅ visibleZloze + currentEra w panelu miasta |
| **UNITS C4** | ✅ Obrażenia w battleUnitToCombatUnit + inline CombatUnit |
| **ROBOCZA** | ✅ md5 `0ADF96DE1A7B38D2021D0BF472E3565D` |

---

## ZROBIONE (2026-06-29)

| ID | Status |
|----|--------|
| **F-B5-EMPIRE-FOOD** | ✅ empire-food 9/9 · tick już w main.ts |
| **CYW-victory+barb** | ✅ victory 12/12 · barbarians 55/55 |
| **D-P0-4 walka** | ✅ bonusy 3D w main.ts · battle-smoke OK |
| **F-B-TECH-SYNC-29** | ✅ md5 `3a13adc8…` |

---

## P0 Grupa B — wcześniejsze (ZROBIONE)

| ID | Status |
|----|--------|
| F-B-PILNE | ✅ 2026-06-28 |
| F-B-WYRAB-TARTAK | ✅ 2026-06-28 |
| F-B-TARTAK-DREWNO | ✅ 2026-06-28 |
| F-B-TECH-SYNC-29 | ✅ 2026-06-29 |

---

## Lane dalej (NIE F dopóki brak GOTOWE)

| ID | Lane | Notatka |
|----|------|---------|
| B1.4 | EKONOMIA | auto-pola pracy — niski priorytet |
| B1-tech-Q3 | — | posterunek tech **odłożone** (Maciej) |

**Archiwum pełnej kolejki:** `docs/archiwum/dyspozycje/F-KOLEJKA-P0.md`
