# B-WYZYWIENIE-SLIDER — suwak Wyżywienie 0–6

**Status:** ZAMKNIĘTE (wdrożone 2026-07-30)  
**Decydent:** Maciej

## Decyzja

- Nazwa slidera w panelu miasta: **Wyżywienie** (nie „Racja" / „wzrost ludności").
- Zakres: **0–6**, krok **0,5** — koszt żywności na mieszkańca = wartość suwaka.
- Wzrost ludności (%/turę) z tabeli:

| Wyżywienie | Wzrost |
|---:|---:|
| 0 | −10% |
| 0,5 | −6% |
| 1 | −2% |
| 1,5 | 0% |
| 2 | +1,5% |
| 2,5 | +3% |
| 3 | +3,5% |
| 3,5 | +4% |
| 4 | +4,5% |
| 4,5 | +5% |
| 5 | +5,5% |
| 5,5 | +6% |
| 6 | +7% |

## Implementacja

- `gra/src/game/population-growth-v85.ts` — `WYZYWIENIE_GROWTH_PCT`, migracja starych racji 1|2|3 → 2|4|6.
- `gra/src/ui/cityPanel.ts` — suwak `<input type="range">` zamiast batonów 1/2/3.
- Domyślne Wyżywienie: **4** (≈ dawna racja 2 przy koszcie 4 żywności).
