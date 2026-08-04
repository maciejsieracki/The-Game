# R-DYPLO-DOBRA-KAT — Dobra handlowe: kategorie zamiast jednego pasa

**Data:** 2026-08-04  
**Status:** 🟡 ZAPISANA → 🔵 W TRAKCIE wdrożenia  
**Ekran:** Audiencja dyplomacji — karty gracza / rozmówcy → sekcja **Dobra handlowe**

## ECHO decyzji Macieja (2026-08-04)

| ID | Litera | Znaczenie |
|----|--------|-----------|
| `R-DYPLO-DOBRA-KAT-Q1` | **A** | Akordeon — klik w kategorię rozwija/zwija pozycje |
| `R-DYPLO-DOBRA-KAT-Q2` | **A** | Puste kategorie **widoczne** jako szare nagłówki (nie ukrywaj) |
| `R-DYPLO-DOBRA-KAT-Q3` | **A** | Bez limitu 7 — wszystkie pozycje w kategorii |

## Sytuacja (przed)

Jeden pas pigułek (`goodsHtml`): surowce + techy, max 4+3=7 z `tradeGoodsForOwner`.

## Cel

Podział: **Surowce · Technologie · Inne** — po kliknięciu widać pozycje; miejsce na przyszłe „Inne”.

## AC

1. UI: 3 nagłówki kategorii; klik = expand/collapse (akordeon).
2. Pusta kategoria: szary nagłówek, bez ukrywania (Q2=A).
3. `tradeGoodsForOwner` (lub helper): zwraca kategorie bez cap 7; wszystkie surowce/techy właściciela.
4. „Inne” na razie puste (szary nagłówek) — slot na przyszłość.
5. Bonusy cywilizacji poza sekcją Dóbr — bez zmian.

**Pliki:** `diplomacyAudience.ts`, `main.ts` (`tradeGoodsForOwner`), ewentualnie `diplomacy-goods.ts`.
