# DESIGN: cywilizacje i spawn na mapie

**Aktualizacja:** 2026-06-27 (Maciej — model kopii typu)  
**Kanon:** `docs/decyzje/D-START-miasta-kopie-typu.md` · `docs/grupa-d/MODELE-MIAST-TYPU.md`

---

## Roster

ROSTER = **GŁÓWNE TYPY** cywilizacji (NIE lista 50 nacji).  
Obecnie **9 typów** (`civs.json`). Każdy typ: religia, jednostka specjalna, `bonusy[]`, `nazwyKlastra[10]`.

---

## Miasta na mapie = kopie typu (NIE osobne nacje)

- Każde miasto AI używa **danych swojego typu** (`ikonaId`) — ta sama gospodarka, bonusy, zależności.
- **Nazwa** = wpis z `nazwyKlastra[i]` (10 nazw / typ).
- **Satelity / rywale** = miasta **tego samego typu** w klastrze — cel zwycięstwa dominacji (§8d).
- **Obcy typ** (np. Chińczycy) = **ten sam schemat**: klaster chińskich miast-kopii → **do podbicia**, defensywne AI.

### Spawn (MAPA + SILNIK)

- Klaster ~10 pozycji / typ (Poisson w regionie Voronoi).
- Gracz: stolica `[0]` + N rywali `[1..N]` (skala mapy).
- Obcy typ: **wszystkie pozycje klastra** = AI kopie typu (implementacja: częściowo — patrz luka w decyzji D-START).

### AI (CYWILIZACJE)

- **Defensywne:** nie zakładają miast, nie ekspandują, bronią się.
- Pełny ekspansyjny AI — **nie** dla miast-kopii typu.

---

## Skala mapy

| Typów aktywnych | Miast max (teoria) |
|-----------------|-------------------|
| 3 | 3 × 10 = 30 |
| 5 | 50 |
| 7 | 70 |
| 9 | 90 |

Na małej mapie **mniej typów aktywnych** (E1 / `newGameMapDefaults`), nie zawsze 9.

---

## Wnioski dla lane'ów

| Lane | Odpowiedzialność |
|------|------------------|
| **CYWILIZACJE** | `civs.json`, AI profil kopii typu, dyplomacja warstwowa, victory |
| **MAPA** | `computeClusters`, spawn wszystkich slotów |
| **SILNIK** | `main.ts` — owner meta, tick AI z flagą defensywną |
| **UNITS** | Jednostki specjalne per typ |

TODO: przenieść skrót do `PROJEKT-GRY-master.md` §8b przy bezpiecznej edycji.
