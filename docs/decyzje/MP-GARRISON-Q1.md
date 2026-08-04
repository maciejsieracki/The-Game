# MP-GARRISON-Q1 — Hard: garnizon istniejący vs nowa produkcja

| Pole | Wartość |
|------|---------|
| **ID** | MP-GARRISON-Q1 |
| **Ekran** | Garnizon miasta-państwa · produkcja wojskowa MP |
| **Status** | 🟢 **WDROŻONE** — FALA 220 `8a3c6d6d` · commit `b47a2e8` |
| **Decyzja** | **A** |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> **Hard:** zostaw **istniejące** (garnizon na mapie), **zakaz nowej produkcji** wojskowej.

---

## Reguła gameplay

| Tryb | Zachowanie |
|------|------------|
| **Hard (cap 0)** | Jednostki już na mapie / w garnizonie **nie są usuwane**. Produkcja nowych wojsk **zablokowana** (`milCap=0` → filtr w `chooseCityProduction`). |
| **Normal (cap 1)** | Odbudowa do 1 łącznie (garnizon wliczony w cap). |
| **Easy** | Bez capu — jak major AI. |

Cap wojskowy = **produkcja**, nie kasowanie istniejących jednostek.

---

## Implementacja

- Wspólny mechanizm z `MP-ARMY-Q1` — `cityStateMilitaryProductionCap('hard') === 0`
- Garnizon liczy się w `countOwnerMilitaryUnits` → na Hard po spawnie startowym MP nie produkuje dalej wojska

---

## Powiązane

- `MP-ARMY-Q1.md` · `FORTIFY-MP0-Q1.md`
