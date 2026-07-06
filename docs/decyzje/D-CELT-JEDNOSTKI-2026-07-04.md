# D-CELT-JEDNOSTKI — Celtowie: Soldurii + Gaesatae (Maciej · 2026-07-04)

**Status:** **ZAMKNIĘTE**  
**Decyzja Macieja:** poprawka historyczna nazewnictwa jednostek celtyckich.

---

## Decyzja

| Element | Było | Jest |
|---------|------|------|
| **Jednostka specjalna** (`civs.json`) | Miecznik galijski | **Soldurii** |
| **Wojownik celtycki** (`units.json`) | — | **Gaesatae** (tylko nazwa; **staty bez zmian**) |
| **Stara Gaesatae** (nagi szturmowiec) | osobny wiersz | **Soldurii** — elita wodza (nowy wiersz, staty elitarne — lane UNITS może stroić) |

**Uzasadnienie:** rys historyczny — soldurii = elitarna gwardia wodza; gaesatae = najemnicy z Alp (miecz + tarcza).

---

## Pliki zmienione

- `gra/data/civs.json` — `Jednostka specjalna`, bonus `jednostka_specjalna`
- `gra/data/units.json` — rename + Soldurii
- `gra/data/tech.json` — lista odblokowań Brązownictwo / Żelazo
- `gra/src/render/units.ts` — model 3D: Gaesatae + Soldurii → `buildCeltWarrior`

---

## Produkcja (technicznie)

- **Soldurii** — w kolejce Celtów zamiast Wojownika (`W zamian za: Wojownik`, token z `civs.json`).
- **Gaesatae** — jednostka elitarna po tech Brązownictwo (`W zamian za: —`), staty jak dawniej Wojownik celtycki.

---

## Otwarte (opcjonalnie)

- Model 3D Soldurii — odróżnienie od Gaesatae (złoty torc / pióra).
- Balans Soldurii vs Gaesatae — Panel jednostek (Grupa C).
- Sync Excel Panel jednostek + export round-trip.

## Wymaga decyzji Macieja (2026-07-04 audyt)

| ID | Pytanie | Opcje |
|----|---------|-------|
| **CELT-Q1** | Gaesatae w produkcji: `W zamian za` | **A** = `—` ✅ **2026-07-04** |
| **CELT-Q2** | Staty Soldurii vs Gaesatae | **A** = identyczne ✅ **2026-07-04** |
| **CELT-Q3** | Filtr `Nacja` per cyw. | **A** = bug — filtr ✅ **2026-07-04** (wiring main.ts → handoff) |

---

## Wdrożenie (podział ról)

- **CYW:** `civs.json` + brief → Grupa C (`CYW-do-GRUPA-C_jednostki-spec-brief-2026-07-04.md`)
- **Grupa C:** `units.json` — staty, macierz TW, modele
- **EKONOMIA:** filtr `Nacja` w `production.ts` (CELT-Q3=A)
