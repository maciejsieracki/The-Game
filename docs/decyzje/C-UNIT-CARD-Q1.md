# C-UNIT-CARD-Q1 — Atak/obrona efektywne na karcie (forma)

**Status:** 🔵 **W TRAKCIE** (kod w `gra/src`, 2026-07-27)  
**Ekran:** Karta jednostki na mapie  
**Cytat Macieja:** „tak, wolę" efektywny atak/obrona · formularz **C**

## Decyzja: **C**

Efektywna liczba **duża**, baza z JSON **małym szarym tekstem** (np. Atak **12** · baza 10).

## Skala efektywna

`efektywny = baza × (1 + bonus_parametrów% + bonus_weterana%)` — ten sam układ co w walce dla ścieżki parametrów + weteran (pancerz osobno, Q3).

## Wdrożenie

- `gra/src/game/unit-card-stats.ts` (liczenie)
- `hexContextTooltip.ts`, `armyStackHud.ts`, `unitPanelHud.ts` (prezentacja)
