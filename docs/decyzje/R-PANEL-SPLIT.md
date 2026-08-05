# R-PANEL-SPLIT — panel imperium: jedna sekcja per żeton HUD

**Status:** 🟢 **WDROŻONE**  
**Data:** 2026-08-05  
**Źródło:** `dyspozycje/REJESTR-PROSB-I-ZADAN.md` · decyzja C-PANEL=B (Maciej 2026-07-24)

## Problem

Prawy panel imperium (żetony Skarbiec / Praca / Surowce / Nauka / Zaopatrzenie / Ludność / …) pokazywał **całą przewijaną listę** sekcji albo mylący widok — np. klik „Surowce" z Nauką w tym samym bloku ekonomii.

## Rozwiązanie

`gra/src/ui/empirePanelSectionMap.ts` + `empireDetailPanel.ts`:

1. **`empirePanelBlockForSection`** — `ekonomia` zwraca blok `ekonomia` (nie `all`); `econ-*` → `ekonomia` z filtrem jednego wiersza; `surowce` / `spichlerz` / `armia` / `handel` / `kultura` / `moc` → własny blok.
2. **`render()`** — składa `body` tylko z bloku wybranego żetonu; scroll do podsekcji tylko w pełnym widoku (`block === 'all'`).
3. **Żeton ekonomii** (`econ-skarbiec`, `econ-nauka`, …) — nagłówek i treść tylko dla tego zasobu.

## Dowód

| Element | Plik / test |
|---------|-------------|
| Mapowanie bloków | `empirePanelSectionMap.ts` · `empirePanelBlockForSection()` |
| HUD → sekcja | `empireSectionFromHudAct()` |
| Test regresji | `gra/tools/empire-panel-split-test.cjs` |
| Wiring HUD | `hud.ts` → `onOpenEmpireDetail(section)` — **bez zmian w `main.ts`** |

## Zakres

- **Bez deploy** w tej paczce (AutoBot OPERATOR).
- **Bez `main.ts`** — logika wyłącznie w `empireDetailPanel.ts`.
