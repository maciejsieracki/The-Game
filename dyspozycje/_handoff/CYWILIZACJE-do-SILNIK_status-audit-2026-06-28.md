# CYWILIZACJE → SILNIK: audyt stanu Grupy D + kolejka (2026-06-28)

**Flaga:** **→ SILNIK: INFO + 1 BATCH**  
**Od:** lane CYWILIZACJE (Grupa D) · audyt na prośbę Macieja  
**Cel:** zero wiszących tematów po stronie CYW; Silnik wie co wpięte, co jeszcze czeka, co delegować dalej.

---

## Werdykt lane CYW — paczka ABC Grupa D (2026-06-27)

**Wszystkie decyzje ABC 1A–7B + D3-Q1…Q4 + E1-D-Q1 — dostarczone i przekazane.**  
Lane **nie trzyma** integracji `main.ts` (to Silnik). Moduły + JSON + testy lane = **GOTOWE**.

| Test lane (dziś) | Wynik |
|------------------|-------|
| civ-bonusy-test | **30/30** |
| diplomacy-test | **135/135** |
| ai-test | **198/198** |

> **Uwaga dla bramki Silnika:** meldunek sesji-2026-28 miał **3 FAIL diplomacy** — po CYW-P1-05 (`perNacja` w `initialRelation`) suite jest **135/135**. Proszę **przebieg ponowny** przed eskalacją do CYW.

---

## Co SILNIK już wpiął (CYW weryfikuje w `main.ts` ✅)

| Temat | Decyzja | Dowód w kodzie |
|-------|---------|----------------|
| E1 roster | E1-D-Q1=A | `assignAiCivTypes` ~706 |
| Audiencja D3 | Q1–Q4 | `diplomaticContactEstablished`, `openDiplomacyAudience`, save/load |
| Drzewko epoki | D1-Q1 | `getPlayerEra` ~2815 |
| Bonusy bitwa 3D | D4-Q3 | `attackerCivBonusy` / `defenderCivBonusy` w BattleScene (wiele miejsc) |
| AI defensywne | D-START | `defensiveCopy: typCityCopyOwners.has(ownerId)` ~4784 |
| Spawn klaster obcych | D-START | DZIENNIK: MAP-P1-01 + SIL-INT-1 |

**Handoffy te pozycje:** `…-E1-roster`, `…-dyplomacja-kontakty-D3Q2`, `…-AI-defensywne-kopie`, `…-bonusy-D4-Q3`, hub `…-F-GRUPA-D-P0-integracja.md` → **można oznaczyć WPIĘTE** (poza punktem poniżej).

---

## Co SILNIK jeszcze NIE wpiął (z dostaw CYW)

| # | Temat | Decyzja | Co zrobić | Plik |
|---|-------|---------|-----------|------|
| **1** | Agresja/handlowość AI z Excela | **5A** | Zamienić `ARCHETYPE_AGGRESSION[aiTyp]` na `resolveArchetypeAggression` + `resolveArchetypeTrade` | `main.ts` ~4914 (`DiplomacjaInputs`) |
| **2** | preBattle bonusy nacji | **D4-Q3** | **NIE Silnik** — deleguj **UI** | handoff `CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` |

**Batch SILNIK-D-5A-1 (1 linia + import):**

```typescript
import { resolveArchetypeAggression, resolveArchetypeTrade } from './game/civ-ai-data';
import { ARCHETYPE_TRADE } from './game/diplomacy';

// w DiplomacjaInputs:
agresja: resolveArchetypeAggression(aiTyp, ARCHETYPE_AGGRESSION[aiTyp] ?? 0.5),
handlowosc: resolveArchetypeTrade(aiTyp, ARCHETYPE_TRADE[aiTyp] ?? 0.5),
```

**DoD:** build + diplomacy-test + ai-test bez regresji. ✅ 2026-06-30 (135/135 · 198/198)

---

## NIE dotyczy CYW — Silnik deleguje dalej

| Temat | Decyzja | Właściciel | Handoff |
|-------|---------|------------|---------|
| preBattle bonusy | D4-Q3 | **UI** | `…-do-UI_bonusy-wyswietlanie.md` |
| Banery wojny HUD | A1-Q5 | **Grupa A / UI** | spec D3 audiencja |
| Pełne akcje dyplomacji Tier 2–3 | v1.1 | **UI + Silnik** | szare w audiencji |
| Bonusy religii gameplay | 6A | **poza v1.0** | JSON 9/9 gotowy |
| Kanon / Opus | 7B | **Silnik** | bramka testów |

Pełny routing: `CYWILIZACJE-do-SILNIK_delegacje-poza-lane-D.md`.

---

## Nowa kolejka CYW (poza ABC Grupa D — od Master 2026-06-28)

Te tematy **nie wiszą w kolejce ABC**, ale Master przekazał je z powrotem na CYW — **osobna dyspozycja**, nie blokują domknięcia Grupy D:

| ID | Temat | Decyzja | Status CYW | Handoff |
|----|-------|---------|------------|---------|
| **E-P0-06** | Zwycięstwo Power + rakieta | 10=A* | **✅ DONE lane** | `CYWILIZACJE-do-SILNIK_victory-10A.md` |
| **E2-11** | Barbarzyńcy reguła epok | 11=C* | **✅ DONE lane** | `CYWILIZACJE-do-SILNIK_barbarians-11C.md` |
| **B1-tech** | Drzewko ↔ ulepszenia | Q1–Q5 OTWARTE | **CZEKA Maciej ABC** | `docs/decyzje/B1-tech-ABC-OTWARTE.md` |

**CYW nie rusza `main.ts`** dla victory — moduł `victory.ts` + test, potem handoff Silnik.

---

## Maciej — strojenie balansu (operacyjne)

Edycja Excel → targeted export (CYW na prośbę):

| JSON | Skrypt |
|------|--------|
| bonusy | `python tools/export-bonusy-cyw.py` |
| civ-ai | `python tools/export-civ-ai.py` |
| civ-params | `python tools/export-civ-params.py` |
| perNacja | `python tools/export-civ-dyplomacy-nations.py` |

---

## Podsumowanie dla Silnika (jedno zdanie)

**Grupa D ABC = domknięta u CYW.** Wpiąłeś prawie wszystko; **została 1 linia** (`resolveArchetypeAggression` w `main.ts`). **preBattle → UI.** **diplomacy-test** — przebieg ponowny (135/135 u CYW). **Victory + barbarzyńcy** = nowa kolejka CYW (Grupa E), nie Grupa D.

**Meldunek CYW:** `CYWILIZACJE-DO-MASTERA.md` § 2026-06-28.
