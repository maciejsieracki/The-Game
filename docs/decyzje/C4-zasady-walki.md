# C4 — Zasady walki (logika, oba ekrany)

**Ekran:** logika — dotyczy **A2 + C1 + C2**, nie sam wygląd UI.  
**Status:** C1/C2/C3 **w kanonie** · D8=A · D10=A · **C4-Q1=A** (2026-06-29)  
**Było:** T8 (połowa)

---

## O co chodzi

Reguły, nie przyciski:

| Temat | Stan |
|--------|------|
| **Posiłki D8** | A — heks + sąsiedztwo 1; kontrakt UNITS gotowy |
| **Katapulta D10** | A — Żelazo + warsztat; Taran/Wieża in-siege |
| **Epoki machin** | Kamień / Brąz / Żelazo — dane w units.json |
| **Balans Excel** | **C4-Q1=A** — macierz v2.0 (`Macierz-walki-analiza.md`) = kanon statów Brąz/Żelazo |
| **Multi-unit / skład bitwy** | kontrakt `_handoff/UNITS-do-MASTER_kontrakt-walka-multi.md` |

---

## C4-Q1 — Balans macierzy (ZAMKNIĘTE 2026-06-29)

**Decyzja Macieja:** **A** — przyjąć analizę v2.0 (`Civ-UNITS/Macierz-walki-analiza.md`) jako kanon statystyk w `units.json` (Brąz/Żelazo).

**Wykonane (UNITS):** eksport 9 jednostek · formuła macierz v2 w `combat.ts` · testy 6/6 + battle-smoke OK.

**Handoff:** `dyspozycje/_handoff/UNITS-do-SILNIK_C4-balans-macierz.md` → **→ SILNIK: GOTOWE**

---

## Po decyzji balansu

UNITS korekty `units.json` → targeted export → testy combat 6/6.
