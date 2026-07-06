# A3 — Armie na mapie świata (zaznaczenie, stacking, łączenie)

| Pole | Wartość |
|------|---------|
| **ID** | A3 |
| **Ekran** | **Mapa świata** (nie bitwa taktyczna, nie panel miasta) |
| **Lane** | UNITS, UI, MAPA, SILNIK (integracja) |
| **Mockup** | `UI/Makieta-panel-armii.html` |
| **Powiązane** | A2-Q4=A (panel [H] jednostki), D8=A (posiłki 1-heks), model ruchu stacking |

---

## Decyzje Macieja

| ID | Pytanie | Decyzja | Data |
|----|---------|---------|------|
| **A3-Q1** | Łączenie armii: proste okno vs bogaty panel | **B** — bogaty panel jak mockup **przed v1.0** | 2026-06-27 |
| **A3-Q1-SCOPE** | Zakres v1.0 panelu armii | **B** — mockup prawie w całości (drag&drop, podział, scal rannych); **Posiłki = stub** | **2026-06-26** |

### Co oznacza A3-Q1-SCOPE=B (prosty język)

- Po kliknięciu wojska / wejściu na własny hex / łączeniu sąsiednich armii → **duży panel od dołu mapy** (jak mockup).
- **Dwie kolumny** = dwie armie (np. na sąsiednich heksach) + **pula pojedynczych oddziałów**.
- **Drag & drop** kart między kolumnami i pulą.
- Akcje v1.0: **Połącz armie**, **Scal oddziały** (ranni tego samego typu), **Podział armii**, **Anuluj**.
- **Posiłki** — przycisk widoczny, po kliku komunikat „wkrótce” (mechanika osobno, D8).
- Panel **[H]** (A2-Q4) zostaje dla szybkiego podglądu **pojedynczej** jednostki; panel armii = zarządzanie **stosem / dwoma stosami**.
- Na mapie 3D: **licznik ×N** gdy więcej niż 1 jednostka gracza na heksie.

### Poza v1.0 (nie blokować merge)

- Pełny panel Total War z bitwy (Grupa C / D7 defer).
- Posiłki z miasta w panelu armii (stub w v1.0).

---

## Kolejność lane'ów

1. **UNITS** — kontrakt merge/split/stack + testy (`army-stack-test.cjs`)
2. **UI** — `armyPanelHud.ts` (+ ewent. rozszerzenie `unitPanelHud.ts`)
3. **MAPA** — licznik stosu na `UnitRenderer` / overlay
4. **SILNIK** — wpięcie w `main.ts`: ruch na własny hex, trigger panelu, callbacki UNITS

Handoffy: `dyspozycje/_handoff/A3-do-UI-UNITS_panel-armii-A3Q1B.md`, `UNITS-do-UI-SILNIK_army-stack-api.md`, `MAPA-do-SILNIK_stack-counter-3d.md`

---

## Status implementacji (2026-06-26)

| Element | Stan |
|---------|------|
| `unitPanelHud.ts` [H] | Częściowo w `main.ts` (pojedyncza jednostka) |
| `armyListHud.ts` | Wpięte (lista ⚔) |
| `armyStackPrompt.ts` | Gotowy moduł, **nie wpięty** — zastąpiony przez panel A3 |
| Merge w silniku | **Brak** |
| Licznik ×N na mapie | Tylko prototyp `movepreview` |

**Flaga:** CZEKA UNITS → UI → MAPA → SILNIK
