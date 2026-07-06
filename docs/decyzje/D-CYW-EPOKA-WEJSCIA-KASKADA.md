# D-CYW-EPOKA-WEJSCIA — kaskada dostępności typów

> **Status:** ✅ **ZAMKNIĘTE** — Maciej **2026-07-03**  
> **Lane:** CYWILIZACJE (`civs.json`) · UI (`newGameFlow.ts`) · SILNIK (`civ-roster.ts`, `civ-entry-epoch.ts`)

---

## Decyzja Macieja

**`epokaWejscia`** = pierwsza epoka, w której cywilizacja **wchodzi do gry**. Potem jest **dostępna we wszystkich późniejszych** epokach startu:

| epokaWejscia | Dostępna przy starcie gry |
|--------------|---------------------------|
| **Kamień** | Kamień, Brąz, Żelazo |
| **Brąz** | Brąz, Żelazo |
| **Żelazo** | tylko Żelazo |

**Nieprawda (stary opis):** „tylko Kamień” = wyłącznie Kamień. Chodziło o **moment debiutu**, nie o jedyną dozwoloną epokę.

### Wyjątki

**Brak.** Wchodzi w epokę X → dostępna w X i każdej późniejszej. Bez `epokiWykluczone`.

---

## Mapa 15 typów

| epokaWejscia | Cywilizacje |
|--------------|-------------|
| **Kamień** | Grecy, Rzymianie, Chińczycy, Zulusi, Egipt, Sumerowie, Harappa, **Inkowie** |
| **Brąz** | Celtowie, Germanie, Hetyci, Babilonia, Asyria, **Fenicjanie** |
| **Żelazo** | **Słowianie** |

---

## Cuda wyłączne (E) — tech ≥ epoka wejścia nacji

**Reguła dolna (Maciej 2026-07-03):** `techUnlock` cudu E — każdy wynalazek z epoki **≥ epokaWejscia** państwa. Późniejsze epoki dozwolone; zakaz tech wcześniejszych. Szczegóły: `D-CUD-TECH-WEJSCIA.md`, `wonder-civ-tech.ts`, test `wonder-civ-tech-test.cjs`.

---

## Kod

| Plik | Rola |
|------|------|
| `gra/src/game/civ-entry-epoch.ts` | reguła kaskady + wykluczenia |
| `gra/src/ui/newGameFlow.ts` | filtr kreatora |
| `gra/src/game/civ-roster.ts` | filtr puli AI po epoce startu |
| `gra/data/civs.json` | `epokaWejscia` |

Powiązane: **D-CUD4** (start budowy cudu = tech) · `E1-epoka-przed-cyw.md`
