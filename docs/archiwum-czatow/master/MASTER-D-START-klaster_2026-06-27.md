# MASTER — D-START klaster, nazwy, miasta-kopie typu

## Metadane

| Pole | Wartość |
|------|---------|
| **Rola** | MASTER (czat Maciej) |
| **Temat** | Start gry: klaster, nazewnictwo, model miast AI |
| **Data sesji** | 2026-06-27 |
| **Powiązane** | `D-START-klaster-nazwy.md`, `D-START-miasta-kopie-typu.md`, `main.ts` batch SILNIK |

---

## Podsumowanie sesji

- Maciej zamknął **paczkę decyzji startowych** (klaster + nazwy + dyplomacja warstwowa).
- Master zapisał decyzje w `docs/decyzje/` i zaktualizował dziennik + STATUS.
- Zaimplementowano **4 lane'y** (CYWILIZACJE → MAPA → SILNIK prep → UI) i **wpięto w `main.ts`**.
- Maciej doprecyzował **model produktowy**: miasta AI = **kopie typu cywilizacji** (symetria dla obcych typów), AI **defensywne**, cel = **podbój**.
- Spec przekazany do **Grupy D** (CYWILIZACJE: AI, dane, dyplomacja, victory).
- **Nie opublikowano kanonu** `Gra-podglad.html` — czeka Opus + playtest.

---

## Decyzje Macieja

### Start + nazwy (`D-START-klaster-nazwy.md`)

| ID | Decyzja |
|----|---------|
| D-START-1B | Rywale w klastrze skala mapy (2–8), nie pełne 9 |
| D-START-2B | Klaster: dyplomacja uproszczona (pokój, wojna, handel) |
| D-START-3A | Obcy typ: pełna dyplomacja po kontakcie |
| N-1A | Pierwsze miasto gracza = `nazwyKlastra[0]` |
| N-2A | Etykieta rywala klastra = tylko nazwa miasta |
| N-3A | Kolejność rywali [1..N] stała z JSON |
| N-4C | Kolejne miasta gracza = nazwa ręczna (prompt) |
| N-5B | Źródło prawdy: ręczny `civs.json` |

### Model miast (`D-START-miasta-kopie-typu.md`)

- Miasto AI ≠ osobna nacja — **kopia typu** (`ikonaId`, bonusy, gospodarka).
- Obcy typ (np. Chińczycy) = **ten sam schemat** co klaster gracza, chińskie nazwy, **do zdobycia**.
- AI: **defensywne**, bez ekspansji, bez zakładania miast.

---

## Co wykonano (kod + docs)

| # | Działanie | Deliverable |
|---|-----------|-------------|
| 1 | CYWILIZACJE | `gra/src/game/civ-names.ts`, test `civ-names-test.cjs` |
| 2 | MAPA | `gra/src/map/cluster-spawn.ts` |
| 3 | SILNIK prep | `cluster-start.ts`, `diplomacy-layers.ts` |
| 4 | UI | `diplomacyPanel.ts` — badge Klaster, akcje warstwy |
| 5 | SILNIK integracja | `main.ts` — `applyClusterStartPlan`, N-4C prompt |
| 6 | Dokumentacja | decyzje, DESIGN-cywilizacje-spawn, Grupa D charter |
| 7 | Handoffy | SILNIK + CYWILIZACJE `_handoff/` |
| 8 | Testy | civ-names 5/5, cluster-start 6/6 |

---

## Luki (→ Grupa D + MAPA + SILNIK)

| Luka | Owner |
|------|-------|
| Obcy typ: spawn tylko 1 stolica | MAPA + SILNIK |
| AI ekspansyjne (`ai.ts`) | CYWILIZACJE (Grupa D) |
| Profil AI `kopia_typu_obronna` w Excel | CYWILIZACJE |
| Kanon HTML | Opus → Master |

---

## Następne kroki

1. **Grupa D** — implementacja AI defensywnego + dane (patrz `docs/grupa-d/OD-MASTERA-D-START-HANDOFF.md`)
2. **MAPA** — pełny spawn klastra obcych typów
3. **SILNIK** — batch po handoff D + MAPA
4. **Opus** review → playtest Maciej → kanon

---

## Eksport pełny

*(Maciej: opcjonalnie wklej eksport z Cursor UI)*
