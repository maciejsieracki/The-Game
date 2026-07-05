# UI → Design: C-09 roster TW v3 · karty jednostek

**Flaga:** **START Design** · hasło `START — C09-roster-tw-v3`  
**Data:** 2026-07-04  
**Priorytet:** P0 · deploy + walka ręczna (osobno od miasta W3)

---

## Co przesyłam

| Materiał | Ścieżka |
|----------|---------|
| **Brief (NOWY)** | `docs/ux/DESIGN-BRIEF-C09-roster-tw-v3.md` |
| Archiwum v2 | `The Game - C09 Karty jednostek v2 (1E).dc.html` |
| Tło deploy | `The Game - C06 Deployment v3 (1E).dc.html` |
| Playtest | `gra-robocza/START.html` → bitwa → deploy / walka manual |
| Referencja UX | Total War — deployment bar + battle unit tray (wyśrodkowany) |

---

## Co Designer ma zrobić

1. Playtest **dużej armii** (3 grupy × wiele kart) — wrap 2 rzędy
2. **Nowy plik:** `The Game - C09 Karty jednostek v3 TW (1E).dc.html`
3. Min. 3 klatki: D1 duża armia · D2 mała · B1 walka
4. Układ: **center X** · **max 2 rows Y** · ramki ARMIA n
5. Polish opcjonalny: ornamentalna rama tray (styl 1E, nie kopia TW 1:1)
6. Handoff: `DESIGN-do-UI_c09-roster-tw-v3.md`

---

## Co Designer NIE robi

- `battleScene.ts` / logika wrap
- C-07 pasek komend (Pause, Hold…)
- C-06 redesign mapy (tylko spójność kolorów docku)

---

## DoD

- [ ] Mockup pokazuje 2 rzędy przy przepełnieniu
- [ ] Wyśrodkowanie — puste boki przy małej armii
- [ ] Spójność z C-06 v3 + kolory stron (Ty niebieski)

**Po OK Macieja:** Lane UNITS port CSS z mockupu (bez zmiany logiki).

---

## Status

**HOLD** · Maciej 2026-07-04 — wygląd rostera w bitwie dopracowuje z **Grupą C** przed Designem.  
**NIE wysyłać** do Designera do sygnału Macieja. Brief gotowy na później.
