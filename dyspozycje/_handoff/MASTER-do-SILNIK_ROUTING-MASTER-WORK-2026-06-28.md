# MASTER Work → SILNIK: routing sesji (weryfikacja 2026-06-28)

**Od:** MASTER Work (czat Praca) · **Dla:** SILNIK  
**Pytanie Macieja:** czy po stronie MASTER wszystko zrobione i przekazane?  
**Odpowiedź:** **TAK** — poniżej pełna mapa: co SILNIK bierze vs co **NIE jest MASTER/SILNIK** → przekaż innemu lane.

---

## SILNIK — co od MASTER Work (kod już w repo)

| ID | Temat | Decyzja / zlecenie | Handoff | MASTER Work |
|----|-------|-------------------|---------|-------------|
| **P0-01…05** | D-START crash, klaster, kontakt, panel, AI def | D-START ABC | `MASTER-do-SILNIK_batch-potwierdzone-2026-06-27.md` | ✅ kod + testy |
| **SIL-UX-1** | Podział pracy Budynki ↔ Ulepszenia | Maciej akceptacja | `MASTER-do-SILNIK_podzial-pracy-balance.md` | ✅ `cityPanel.ts` |
| **E1-UX-02** | Kreator: Jakość mapy + modal zaawansowanych | **ABC B** | ten sam batch + `MASTER-do-UI_kreator-jakosc-mapy.md` | ✅ `newGameFlow` + `main.ts` |
| **D3=A** | Wealth pełny model | 2026-06-26 | `main.ts.bak-SILNIK-2026-06-26-wealth` | ✅ wpiecie silnik |
| **1A–4A** | Suwaki Handlu, plaster D2, Wealth panel | 2026-06-26 | `docs/MACIEJ-DECYZJE-WEALTH-UI_2026-06-26.md` | ✅ UI+EKONOMIA + `main.ts` |
| **E1 batch** | Seed, typ świata, era, reset, defaulty | defaults Maciej | `main.ts.bak-SILNIK-E1-20260626` | ✅ wpiecie silnik |
| **D-START 4 kroki** | CYW nazwy → MAPA spawn → SILNIK → UI panel | 2026-06-27 | `docs/decyzje/D-START-klaster-nazwy.md` | ✅ 4/4 w kodzie |
| **Mgła + ghost start** | Start mgła + ghost załóż miasto | Maciej 2026-06-27 | `_handoff/F-do-SILNIK_mgla-ghost-start-batch.md` | ✅ wpiecie |
| **OBL/HUD B** | S1–S7, B5, F2, tartak | backlog pilny | `MASTER-do-SILNIK_backlog-pilne-2026-06-27.md` | ✅ wpiecie |
| **Sesja 2026-06-28** | Scalenie kanon=ROBOCZA, save ulepszeń | — | `MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md` | ✅ kod done |

**Akcja SILNIK:** tylko **test + meldunek + Opus** (patrz `SILNIK.md` § TESTUJ). **NIE koduj** bez FAIL bramki.

---

## NIE SILNIK — SILNIK ma przekazać / nie blokować

| ID | Temat | Decyzja ABC | **Właściwy lane** | Dyspozycja / handoff |
|----|-------|-------------|-------------------|----------------------|
| **E-P0-01…03** | Menu S0 hybryda, Kampania Wkrótce, wideo | 5=C, 6=A, 7=A | **UI** | `UI.md` · `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` |
| **E-P0-04…05** | Złoża miedź/żelazo epok | 8=B*, 9=B | **MAPA** | `MAPA.md` · `_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| **E-P0-06** | Zwycięstwo Power+rakieta | 10=A* | **CYWILIZACJE** (+ SILNIK wpina po lane) | `_handoff/GRUPA-E-do-CYWILIZACJE_victory-10A-star.md` |
| **E2-11** | Barbarzyńcy / buntownicy reguła epok | 11=C* | **CYWILIZACJE** | `docs/grupa-e/decyzje/PACZKA-ABC-BLOKERY.md` |
| **E1-2** | Tech epok wcześniejszych (Brąz) | 2=B* | **CYW + SILNIK** batch po lane | `PACZKA-ABC-BLOKERY.md` §2 |
| **D-P0-01…03** | Excel AI kopie typu, bonusy | Grupa D 5A | **CYWILIZACJE** | `CYWILIZACJE.md` · `P0-KOLEJKA-LUKI.md` §Grupa D |
| **OBL-S6** | Obóz 3D oblężenia | Q10=C | **MAPA** | `_handoff/MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| **MAP-S1** | Miasta 10 poz + mury per cyw | A5 | **MAPA** | backlog §P2 |
| **MAPA presety** | 3 wyglądy mapy (mapQuality) | E1 spec | **MAPA** | `docs/grupa-e/SPEC-jakosc-render-i-mapa.md` |
| **HUD-S7** | Review przed kanonem | proces | **Opus 4.8** (Ask, ręczny) | `docs/decyzje/OPUS-REVIEW-QUEUE.md` |
| **Grupa A** | HUD D1B, minimapa, A2 panel… | D1–D15 część | **UI + MAPA** (osobny czat Macieja) | Maciej: „HUD w innym czacie” |
| **B1-tech** | Drzewko tech ↔ ulepszenia | Q1–Q5 OTWARTE | **CYW + EKONOMIA** | `docs/decyzje/B1-tech-ABC-OTWARTE.md` |

**Pełna lista delegacji lane:** `dyspozycje/MASTER-DELEGACJA-LANE-2026-06-28.md`

---

## Stuby w kreatorze (ABC B) — świadomie MASTER Work

Parametry zapisane w `NewGameParams.advanced` — **runtime czeka lane** (nie bloker SILNIK test):

| Pole modalu | Lane |
|-------------|------|
| Barbarzyńcy on/off | CYWILIZACJE |
| Warunki zwycięstwa | CYWILIZACJE → SILNIK wpina |
| Bitwy zawsze ręczna | UNITS |
| Jakość mapy 3 presety terenu | MAPA (`scene.ts`) |

---

## Sprint 1 (2026-06-26)

| Lane | MASTER Work | → SILNIK |
|------|-------------|----------|
| EKONOMIA, UI, MAPA, CYW, UNITS | ✅ delegacja Composer + handoffy | gated batchy SILNIK (kolejka w `DZIENNIK`) |

---

## Werdykt dla Macieja

**Po stronie MASTER Work nie wisi żadne zlecenie ani ABC z tej sesji.**  
SILNIK: test/meldunek. Reszta: **otwórz właściwy czat lane** (tabela § NIE SILNIK).
