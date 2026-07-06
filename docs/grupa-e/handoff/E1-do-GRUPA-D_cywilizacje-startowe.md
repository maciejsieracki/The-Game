# E1 → GRUPA D: cywilizacje startowe (roster 9 + skala mapy)

> **Status:** OTWARTE — **Master → Grupa D** (priorytet po ABC E1 **1–4**)  
> **Trigger:** Maciej 2026-06-27 przy **4=A** — „oprócz gracza 9 innych tego samego typu, na małej mapie proporcjonalnie mniej"

---

## Kontekst (E1 — już zamknięte)

| ABC | Decyzja |
|-----|---------|
| 1 | A — Nowa gra = pełny reset |
| 2 | B* — tech epok wcześniejszych |
| 3 | A — Ziemia = stały preset |
| 4 | A — wybór rywali ±1 od zalecanej |

**Roster:** `civs.json` — **9 typów** (gracz wybiera 1 w kreatorze).  
**Skala mapy:** `newGameMapDefaults.ts` — liczba **aktywnych typów** i **domyślnych rywali**:

| Etykieta menu | Aktywne typy | Domyślni rywale AI | Menu ±1 (4=A) |
|---------------|--------------|---------------------|---------------|
| Mała | 3 | 2 | 1–3 |
| Średnia | 5 | 4 | 3–5 |
| Standard / Duża | 7 | 6 | 5–7 |
| Ogromna | 9 | 8 | 7–8* |

\* górna granica `min(aktywneTypy−1, default+2)` w kodzie — przy ogromnej max w menu może być 8, nie 9 AI.

---

## Co Grupa D ma domknąć (bez nowego ABC od Macieja — audyt + implementacja)

0. **Model miast-kopii typu** (Maciej 2026-06-27) — **`docs/decyzje/D-START-miasta-kopie-typu.md`**. AI defensywne, pełny klaster obcych typów. Priorytet nad punktem 2 poniżej tam gdzie koliduje.
1. **Reguła produktowa (potwierdzenie):** na mapie max **tyle unikalnych typów z rosteru 9**, ile pozwala rozmiar; **mała mapa = mniej typów**, nie 9.
2. **Przypisanie typów AI** przy starcie — które `ikonaId` dostają ownerId 1…N (losowo z rosteru minus gracz? kolejność? brak duplikatów?).
3. **Spójność z MAPA** — `clusters.ts` / rozmieszczenie startowe per typ (handoff MAPA↔CYW jeśli brak).
4. **Spójność z AI** — `aiOwnerCivMap`, archetypy z `civs.json`, bonusy `civBonusy[]` (nie fallback `'grecy'`).
5. **UI kreatora** — opis liczby rywali w `ui-params.json` vs faktyczna liczba typów aktywnych.
6. **Test:** start Standard 6 rywali → 6 unikalnych typów AI + gracz ≠ duplikat typu gracza.

---

## Pliki do przeglądu

| Plik | Lane |
|------|------|
| `gra/data/civs.json` | CYWILIZACJE |
| `gra/src/map/newGameMapDefaults.ts` | MAPA (kontrakt menu) |
| `gra/src/main.ts` — `aiOwnerCivMap`, `placeStartingUnits` | SILNIK (wpiecie po D) |
| `gra/src/units/setup.ts` — `placeStartingUnits` | UNITS |
| `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_defaulty-startu-D13A.md` | **superseded** częściowo (Mała/3) — archiwum |

---

## DoD

- [ ] Dokument `docs/decyzje/D4-cywilizacje-startowe.md` (lub sekcja w `D4-bonusy-cyw.md`) — reguła skali + przypisanie typów
- [ ] Handoff do SILNIK jeśli wymaga zmiany `main.ts` / `setup.ts`
- [ ] Meldunek: `CYWILIZACJE-DO-MASTERA.md` + `DO-MASTERA.md` § Grupa D
- [ ] Maciej **nie** pyta ponownie o ±1 rywali (4=A zamknięte) — tylko weryfikacja implementacji

**Flaga:** CZEKA Grupa D
