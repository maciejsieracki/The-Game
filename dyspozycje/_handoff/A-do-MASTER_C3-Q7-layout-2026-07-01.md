# GRUPA A → MASTER: C3-Q7 layout (supplement do paczki P1–P4)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **→ MASTER: GOTOWE** |
| **Data** | 2026-07-01 |
| **Decyzja** | **C3-Q7=A** — panel boczny (prawa krawędź), mapa widoczna |
| **Paczka nadrzędna** | `A-do-MASTER_PACZKA-P1-P4-2026-07-01.md` |
| **Obieg** | Maciej **nie wkleja** do hubu Mastera — Master czyta repo |

---

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/siegeMapPanel.ts` | Panel boczny zamiast pełnoekranowego dim overlay |

**Warstwa:** 🟢 izolowana (UI lane A) · **wymaga rebuild kanonu F** (batch A1-Q12-UI)

---

## Bramka lane

| Test | Wynik |
|------|-------|
| `map-siege-test.cjs` | **6/6** |
| `oblezenie-test.cjs` | **27/27** |
| `main.ts` | **NIE ruszany** |

---

## Handoff Integrator

`dyspozycje/_handoff/A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md` — P4 A1-Q12 + ten layout w jednym batchu F.

---

## DoD Master

- [ ] ACK supplement w `MASTER-WATCH.md` (lub razem z paczką P1–P4)
- [ ] Deleguj F: batch **A-P4-UI** (jeśli jeszcze nie w kolejce)

**Maciej:** zero wklejania — tylko `działaj` / ABC w tym czacie.
