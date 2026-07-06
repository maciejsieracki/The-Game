# CYWILIZACJE → SILNIK: delegacje poza lane D (2026-06-27)

**Flaga:** **→ SILNIK: ROUTING** — poniższe tematy **NIE są** w zakresie lane CYWILIZACJE. Silnik integruje własne batchy lub przekazuje właściwym lane'om.

**Kontekst:** Maciej domknął paczkę ABC Grupy D (1A–7B, D3 audiencja, Excel 5A+2A). Lane CYW dostarczył moduły, JSON, testy i handoffy. Poniżej — co **nie dotyczy CYW** i wymaga Twojej koordynacji.

---

## 1. preBattle — bonusy nacji w ekranie przed bitwą (P0-7)

| | |
|---|---|
| **Decyzja** | D4-Q3=A — pełne bonusy cywilizacji v1.0 |
| **Po co** | Gracz widzi aktywne bonusy obu stron przed walką z mapy |
| **CYW zrobił** | `civ-bonuses.ts`, `civs.json` bonusy[], test 30/30 |
| **Właściciel** | **UI** (`preBattle.ts`) |
| **Handoff** | `dyspozycje/_handoff/CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` |
| **Silnik** | Wpięcie callbacków w `main.ts` jeśli UI dostarczy kontrakt |

---

## 2. Bitwa 3D — moduł bonusów w BattleScene (P0-6)

| | |
|---|---|
| **Decyzja** | D4-Q3=A |
| **Po co** | Bonusy cyw wpływają na walkę 3D (atak, obrona, szarża itd.) |
| **CYW zrobił** | Rdzeń `civ-bonuses.ts`; handoff spec |
| **Właściciel** | **UNITS** dostarczył moduł; **SILNIK** wpina w `main.ts` |
| **Handoff** | `…-do-UNITS_bonusy-walka-bitwa-jednostki-spec.md`, hub P0 `…-F-GRUPA-D-P0-integracja.md` § D-P0-4 |
| **Uwaga** | W sesji DZIAŁAJ kod `attackerCivBonusy`/`defenderCivBonusy` mógł trafić do `main.ts` — zweryfikuj w batchu kanonu |

---

## 3. Drzewko technologii — filtr epoki (P0-4)

| | |
|---|---|
| **Decyzja** | D1-Q1 (Grupa D / nauka) |
| **Po co** | Picker badań pokazuje tylko tech z epoki gracza |
| **CYW/UI** | Moduł `sciencePicker.ts` z opcjonalnym `getPlayerEra` — **GOTOWY** |
| **Właściciel** | **SILNIK** — callback `getPlayerEra(ownerId)` w `buildSciencePickerConfig` / `main.ts` |
| **Handoff** | hub P0 integracja § D-P0-2 |

---

## 4. Kreator nowej gry — bonusy z JSON (P0-5)

| | |
|---|---|
| **Decyzja** | D4-Q3 UI |
| **Po co** | Wybór cywilizacji pokazuje `bonusy[]` z `civs.json` |
| **Status** | **GOTOWE** w `newGameFlow.ts` — brak pracy CYW/Silnik poza weryfikacją playtestu |

---

## 5. E1 roster — wpięcie startu (P0-9)

| | |
|---|---|
| **Decyzja** | E1-D-Q1=**A** — losowy roster AI, unikalne typy, seed |
| **CYW zrobił** | `civ-roster.ts` + test |
| **Właściciel** | **SILNIK** — `assignAiCivTypes` w flow startu gry |
| **Handoff** | `…-do-SILNIK_E1-roster-startowy.md` |

---

## 6. Audiencja dyplomatyczna — integracja main.ts (D3)

| | |
|---|---|
| **Decyzje** | D3-Q1=1A (modal wojny), Q2=A (kontakt po heksie), Q3=A (etykieta miasta), Q4=C+A (12/5 akcji) |
| **Po co** | UX TW/Civ: lista minimalna → ekran audiencji → akcje dyplomatyczne |
| **CYW zrobił** | Spec `docs/decyzje/D3-audiencja-dyplomacja.md`, `diplomacyPanel.ts`, `diplomacyAudience.ts` |
| **Właściciel** | **SILNIK** — `diplomaticContactEstablished`, save/load, callbacki |
| **Handoff** | `…-do-SILNIK_dyplomacja-kontakty-D3Q2.md` |
| **NIE CYW** | Pełna logika Tier 2–3 (sojusz, tech, trybut…) → v1.1; w UI szare + hint |

---

## 7. `main.ts` — agresja AI z Excela (reszta 5A)

| | |
|---|---|
| **Decyzja** | 5A — wartości AI per nacja w Excel → JSON |
| **Po co** | Maciej stroi agresję/handlowość w Excelu bez rekompilacji logiki |
| **CYW zrobił (2026-06-27)** | `civ-ai.json`, `diplomacy.json` perNacja, `civ-ai-data.ts`, **wpięcie w `diplomacy.ts`**: `aiDiplomacyStance` + `initialRelation` czytają Excel |
| **SILNIK — 1 linia** | W `main.ts` ~4906 `DiplomacjaInputs.agresja` zamienić `ARCHETYPE_AGGRESSION[aiTyp]` na: |

```typescript
import { resolveArchetypeAggression, resolveArchetypeTrade } from './game/civ-ai-data';
// ...
agresja: resolveArchetypeAggression(aiTyp, ARCHETYPE_AGGRESSION[aiTyp] ?? 0.5),
handlowosc: resolveArchetypeTrade(aiTyp, ARCHETYPE_TRADE[aiTyp] ?? 0.5),
```

| **DoD** | build + ai-test + diplomacy-test bez regresji |

---

## 8. Bonusy religii w gameplay (P0-10)

| | |
|---|---|
| **Decyzja** | 6A — religie 9/9 w JSON |
| **CYW zrobił** | `society-params.json` komplet 9/9 |
| **Właściciel** | **poza v1.0** — Silnik/EKONOMIA po decyzji Macieja o mechanice bonusów religii |
| **CYW** | tylko re-export gdy Maciej zmieni Excel |

---

## 9. Banery wojny na HUD (D3 / A1-Q5)

| | |
|---|---|
| **Decyzja** | A1-Q5 (Grupa A — UI/HUD), powiązane z D3 |
| **Po co** | Widoczny stan wojny/pokoju na pasku gry |
| **Właściciel** | **Grupa A (UI lane)** — nie CYW |
| **Spec** | `D3-audiencja-dyplomacja.md` § banery |

---

## 10. Spawn pełnego klastra obcych typów (D-START)

| | |
|---|---|
| **Decyzja** | D-START — miasta = kopie typu, AI defensywne |
| **CYW zrobił** | Gałąź `defensiveCopy` w `ai.ts`, profil Excel `kopia_typu_obronna` |
| **Właściciel** | **MAPA** — rozszerzenie spawnu obcych o pełny klaster |
| **Handoff** | `…-do-MAPA_spawn-obcy-klaster.md` |

---

## 11. Bramka testów kanonu (7B)

| | |
|---|---|
| **Decyzja** | 7B — Master uruchamia testy w bramce, nie lokalnie u Macieja |
| **CYW zrobił** | civ-bonusy 30/30, diplomacy 135/135, ai-test zielone |
| **Właściciel** | **SILNIK** przed publikacją `Gra-podglad.html` |
| **Handoff** | `…-do-MASTER_testy-grupa-d-bramka.md` |

---

## 12. Kanon + review Opus

| | |
|---|---|
| **Właściciel** | **SILNIK** build `/tmp/civ-dist` + **Opus Ask** (ręczny) |
| **CYW** | nie publikuje kanonu |

---

## Podsumowanie dla Silnika

| Lane docelowy | Tematy |
|---------------|--------|
| **UI** | preBattle bonusy, ewent. dopracowanie audiencji |
| **UNITS** | moduł bitwy 3D (Silnik wpina) |
| **MAPA** | spawn klastra obcych |
| **Grupa A / UI** | banery wojny HUD |
| **SILNIK** | main.ts (roster, dyplomacja, getPlayerEra, resolveArchetype*, BattleScene), bramka testów, kanon |
| **Maciej** | strojenie Excel → CYW odpala targeted `export-*.py` na prośbę |

**Lane CYW — ZAMKNIĘTY** na Grupa D ABC. **Grupa E victory+barbarians:** moduły **GOTOWE** (2026-06-28) → handoffy `…-victory-10A.md`, `…-barbarians-11C.md`.
