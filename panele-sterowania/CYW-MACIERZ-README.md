# Cyw-macierz — 11 zakladek tematycznych + INFO

**Plik do przegladu:** `panele-sterowania/Cyw-macierz-REVIEW.xlsx`  
**Hub (po zamknieciu Excela):** `Panel-D.xlsx` — te same arkusze Cyw-*

**Power / Potega:** **GOTOWE** (2026-06-26) — wagi globalne w **Panel-B** (`Potega-P-A`). **Nie** edytuj w macierzy cyw. Cyw-12-POTEGA **usunięte** (decyzja Macieja: bez wag per-cyw). Grupa D: handoff `EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md`.

## Arkusze (12 = INFO + 11 domen aktywnych)

| Arkusz | Tematyka | Kolumn param |
|--------|----------|--------------|
| **Cyw-00-INFO** | Spis tresci + instrukcja | — |
| Cyw-01-META | Start gry, epoki, mnoznik waluty | 5 |
| Cyw-02-WALKA | Modyfikatory bojowe % | 47 |
| Cyw-03-JEDNOSTKA | Staty jednostki specjalnej (absolut) | 18 |
| Cyw-04-EKONOMIA | Plony miasta | 10 |
| Cyw-05-PRODUKCJA | Koszty i szybkosc budowy/rekrutacji | 5 |
| Cyw-06-LUDNOSC | Wzrost, zdrowie, limit | 5 |
| Cyw-07-MANPOWER | Pula rekrutow | 3 |
| Cyw-08-SPOLECZENSTWO | Wealth, kultura, porzadek | 9 |
| Cyw-09-OBLEZENIE | Obrona miasta, machiny | 3 |
| Cyw-10-DYPLOMACJA | Per-nacja, archetypy | 8 |
| Cyw-11-AI | Priorytety AI | 8 |

**Kazdy arkusz:** wiersz 1 = `param_id`, 2 = jednostka, 3 = formula, 4 = modul TS, **wiersze 5+ = 15 cywilizacji (liczby)**.

**0** = brak efektu.

## Komendy

```powershell
python panele-sterowania/gen-cyw-macierz.py
python panele-sterowania/export-cyw-macierz.py
```

JSON: `gra/data/civ-matrix.json` · API: `gra/src/game/civ-matrix.ts`

Definicje kolumn: `panele-sterowania/cyw_macierz_schema.py`
