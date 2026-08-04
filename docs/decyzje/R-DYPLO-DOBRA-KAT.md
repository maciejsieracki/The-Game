# R-DYPLO-DOBRA-KAT — Dobra handlowe: kategorie zamiast jednego pasa

**Data:** 2026-08-04  
**Status:** CZEKA-NA-DECYZJĘ  
**Ekran:** Audiencja dyplomacji — karty gracza / rozmówcy → sekcja **Dobra handlowe**

## Sytuacja dziś

Sekcja **Dobra handlowe** to jedna lista pigułek (`goodsHtml` → `.da-goods`):

- surowce z ilością (`Drewno ×169`, `Glina ×138`) i technologie (`Obróbka drewna`, `Rolnictwo`…) **w jednym pasmie**;
- źródło: `tradeGoodsForOwner` w `main.ts` — max **4** surowce + **3** techy, razem **7** pozycji;
- poniżej sekcji są bonusy cywilizacji (np. Falanga / Hoplita) — to **nie** są dobra handlowe.

Przy większej liczbie surowców i techów lista staje się nieczytelna; limit 7 i tak ucina resztę bez podziału.

## Cel Macieja (z czatu)

Podział: **Surowce · Technologie · Inne** — po kliknięciu w kategorię widać pozycje (np. Surowce → Drewno, Glina). Miejsce na przyszłe dobra handlowe poza surowcami i techami.

## Pliki (po decyzji)

- `gra/src/ui/diplomacyAudience.ts` — render kategorii + klik
- `gra/src/main.ts` — `tradeGoodsForOwner` → struktura kategorii (nie płaska `string[]`)
- ewentualnie `gra/src/game/diplomacy-goods.ts` — klasyfikacja wpisów

## ABC

Patrz czat / `dyspozycje/PYTANIA-OTWARTE.md` — paczka `R-DYPLO-DOBRA-KAT-Q1…Q3`.

## Rekomendacja pakietu

**Q1=A** (akordeon) · **Q2=B** (puste kategorie ukryte) · **Q3=A** (bez limitu 7 wewnątrz kategorii).
