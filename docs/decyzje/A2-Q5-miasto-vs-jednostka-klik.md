# A2-Q5 — Klik na heks: miasto + jednostka gracza

**Ekran:** mapa świata · **Data:** 2026-07-01 · **Decyzja Maciej:** **A**  
**Playtest Maciej:** ✅ OK (2026-07-01) · handoff Integrator: `dyspozycje/_handoff/MASTER-do-INTEGRATOR_A2-Q5-city-unit-pick.md`

---

## Problem

Jednostka stoi na heksie **własnego** miasta. Klik w ten heks otwierał **panel miasta** — nie dało się zaznaczyć wojska.

---

## Decyzja A — Picker (split)

Gdy na heksie jest **twoje miasto** i **co najmniej jedna widoczna jednostka** (nie w garnizonie):

→ mały modal **Miasto | Jednostka** (`cityUnitPick.ts`)

| Wybór | Efekt |
|--------|--------|
| **Miasto** | Panel miasta (produkcja, budynki, okolica) |
| **Jednostka** | Zaznaczenie reprezentanta stosu + panel armii |
| **Anuluj / Esc** | Zamknięcie, bez akcji |

Skróty: **1** = miasto, **2** = jednostka.

---

## Wyjątki (bez pickera)

| Sytuacja | Zachowanie |
|----------|------------|
| Tylko miasto, brak wojska na heksie | Od razu panel miasta |
| Wojsko w **garnizonie** (`inGarnizon`) | Od razu panel miasta |
| Zaznaczona jednostka **wchodzi** na miasto (ruch) | Animacja ruchu (domek), bez pickera |
| Wrogie / oblężone miasto | Dotychczasowe reguły (C3, podpowiedź) |

---

## Kod

| Plik | Rola |
|------|------|
| `gra/src/ui/cityUnitPick.ts` | UI pickera |
| `gra/src/main.ts` | gałąź kliku mapy (~4175) |

Powiązane: `UNITS-do-MASTER_wejscie-miasta-garnizon.md` (ruch domek ≠ klik zarządzaj).
