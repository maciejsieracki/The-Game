# A3-P0-REDESIGN — marsz jednostki: ścieżka bez Shift (2026-07-07)

**Status:** ZAMKNIĘTE  
**Data:** 2026-07-07 (wieczór)  
**Grupa:** A (mapa świata + ruch jednostek) → Integrator F (`main.ts`)  
**Poprzednik:** `A3-shift-auto-marsz.md` (A3-Q1 — Shift+click auto-marsz, MVP wdrożone 2026-07-07)

---

## Cytat Macieja (pełny)

> - Klikanie BEZ Shift — wskazujesz miejsce na mapie
> - Pokazuje się ścieżka + gdzie jednostka kończy każdy ruch (szacunek tur)
> - Napotka przeszkodę → STOP w tym miejscu, czeka na decyzję; NIE kontynuuje, NIE szuka obejścia
> - Przerwanie: (1) wskazanie nowego celu LUB (2) komenda Stop/Zatrzymaj na pasku jednostki

---

## Decyzja

**A3-P0-REDESIGN** zastępuje model **Shift+marsz** z A3-Q1 jako docelowy UX ruchu jednostki na mapie świata.

| Aspekt | Stary A3-Q1 (Shift+marsz) | Nowy A3-P0-REDESIGN |
|--------|---------------------------|---------------------|
| Wejście gracza | **Shift+klik** na cel | **Zwykły klik** na cel |
| Podgląd trasy | Tylko przy trzymanym Shift (hover); etykieta „X tur" przy celu | **Zawsze** przy hover/kliku: ścieżka + **markery końca każdego ruchu** (tur) |
| Cel poza zasięgiem tej tury | Shift pozwala ruszyć częściowo + ustawia `autoMarch` | Klik na daleki cel → podgląd pełnej trasy; ruch startuje w kierunku celu (szczegóły tur — do doprecyzowania) |
| Kontynuacja co turę | `continueAutoMarchAfterTurn()` — auto-ruch aż do `destQ/destR` lub błąd | Segment po **end-turn** lub **Kontynuuj**; **STOP przy przeszkodzie** — bez obejścia ([`A3-P0-3-timing-marszu.md`](A3-P0-3-timing-marszu.md)) |
| Przerwanie | Nowy cel bez Shift → `clearAutoMarch()` | (1) nowy cel **lub** (2) **Stop/Zatrzymaj** na pasku jednostki |
| Szukanie obejścia | Brak (A* jedna trasa) | **Jawnie zakazane** — nie kontynuować, nie szukać detouru |

---

## Implikacje techniczne (skrót)

1. **`main.ts` — usunąć warunek Shift** z `beginMoveSelectedUnitTo`, hover preview i handlerów kliknięcia (`e.shiftKey` → domyślne zachowanie).
2. **`units.ts` — rozszerzyć `setPathRoute`** — markery per-tura (gdzie kończy się ruch w turze 1, 2, 3…), nie tylko jedna etykieta „X tur" przy celu.
3. **Stan marszu** — przeprojektować `AutoMarchState`: rozróżnić *cel docelowy* vs *hex zatrzymania*; przy przeszkodzie (wróg, blokada, brak ruchu) → stan „czeka", bez `continueAutoMarchAfterTurn` w tej sytuacji.
4. **UI paska jednostki** (Grupa E) — **Stop/Zatrzymaj** + **Kontynuuj** ([`A3-P0-3-timing-marszu.md`](A3-P0-3-timing-marszu.md)); handoff → Integrator F.
5. **Regresja A3-Q1** — MVP Shift+marsz (`docs/decyzje/A3-shift-auto-marsz.md`) staje się **nieaktualne**; po wdrożeniu oznaczyć poprzednik jako ⚪ ZMIENIONA/ODRZUCONA.

**Warstwa:** 🟡 cross — `main.ts` + `render/units.ts` + HUD paska jednostki.

---

## Poddecyzje (zamknięte)

| ID | Temat | Link |
|----|-------|------|
| **A3-P0-2** | Save/load marszu (**B** — zapis + kontynuacja po wczytaniu) | [`A3-P0-2-save-marsz.md`](A3-P0-2-save-marsz.md) |
| **A3-P0-3** | Timing ruchu (**A** — planowanie bez natychmiastowego ruchu; segment po end-turn lub Kontynuuj) | [`A3-P0-3-timing-marszu.md`](A3-P0-3-timing-marszu.md) |

**Spec wdrożenia (checklist AC):** [`A3-SPEC-WDROZENIA.md`](A3-SPEC-WDROZENIA.md)

---

## Powiązane pliki (stan kodu 2026-07-07)

| Plik | Co dotyczy |
|------|------------|
| `gra/src/main.ts` ~6592–6744 | `autoMarch`, `beginMoveSelectedUnitTo(..., shiftHeld)`, `continueAutoMarchAfterTurn` |
| `gra/src/main.ts` ~6865–6894, 7092, 7326 | hover/klik z `e.shiftKey` |
| `gra/src/main.ts` ~10205 | hook auto-marszu po end-turn |
| `gra/src/render/units.ts` ~7771 | `setPathRoute` + `turnLabel` |
| `docs/decyzje/A3-shift-auto-marsz.md` | poprzednik — do deprecacji |
| [`docs/decyzje/A3-P0-2-save-marsz.md`](A3-P0-2-save-marsz.md) | save/load auto-marszu — **B** zapis + kontynuacja po load |
| [`docs/decyzje/A3-P0-3-timing-marszu.md`](A3-P0-3-timing-marszu.md) | timing — planowanie vs end-turn vs Kontynuuj |
| [`docs/decyzje/A3-SPEC-WDROZENIA.md`](A3-SPEC-WDROZENIA.md) | pełna spec + checklist AC dla implementera |

---

## Następny krok

Decyzja + poddecyzje zamknięte — **bez wdrożenia kodu**. Handoff wg [`A3-SPEC-WDROZENIA.md`](A3-SPEC-WDROZENIA.md): A (render) → E (Kontynuuj/Stop) → Integrator F (`main.ts` + save).
