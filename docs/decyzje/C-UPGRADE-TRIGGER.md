# C-UPGRADE-TRIGGER — kiedy jednostka dostaje bonus Kuźni/Koszar

**Status:** 🟢 **WDROŻONA** — FALA 44 `95021308` (2026-07-28)  
**Grupa:** C (jednostki) + Integrator (`main.ts`)  
**Powiązane:** `C-UPGRADE-KUMULACJA` (1A — skąd bierze %, bez zmian)

## Decyzja Macieja (2026-07-27)

Bonus budynków wojskowych (ścieżka A = Pancerz/Kuźnia, ścieżka B = Parametry/Koszary) **nie czeka do końca tury**.

Nalicza się **natychmiast**, gdy jednostka **wchodzi lub przechodzi** przez heks **własnego miasta** w trakcie ruchu.

Gracz dostaje **komunikat toast** po każdym realnym przyroście, np.:

`Wojownik — Ateny: Kuźnia +15% pancerza (razem +15%) · Koszary +20% parametrów (razem +20%)`

## Co się NIE zmieniło

| Temat | Reguła |
|-------|--------|
| Kumulacja miast | **1A** — jednostka pamięta **najlepszy** % z odwiedzonych miast (nie suma ze wszystkich) |
| Trwałość | Bonus **zostaje** po wyjściu z miasta |
| Rekrutacja | Jednostka rodzi się z bonusem miasta produkcji — **bez** dodatkowego toastu |
| AI | Ten sam trigger — **bez** komunikatu UI |

## Dowód wdrożenia

- `gra/src/game/unit-building-bonuses.ts` — `applyCityVisitBonusGain`, `formatBuildingBonusGainHint`
- `gra/src/main.ts` — `applyCityVisitBonusesAlongPath`, `applyCityVisitBonusesAtHex` (ruch gracza po animacji, snap przy End Turn, ruch AI, auto-explore zwiadowców); **usunięte** `applyCityVisitBuildingBonuses()` z końca tury
- `gra/tools/unit-building-bonuses-test.cjs` — sekcja F, **82/82**
- Deploy: commit `65e3ddd` · md5 `95021308eb1eb918bc95149d6928a8ef`
