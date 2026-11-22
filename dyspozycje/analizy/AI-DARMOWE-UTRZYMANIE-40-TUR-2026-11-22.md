# AI: darmowe utrzymanie jednostek w turach 1–40 — pomiar kierunkowy (2026-11-22)

TEMAT: R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1 (runda obrony Operatora, kandydat b090128c6 + poprawki z tej rundy)

## Status pomiaru: NIE ZMIERZONO

Pomiar kierunkowy z zadania 4 dispatchu (bundle poza repo, hak `?civTest=1` / `__aiEconomyMeasure`,
seed 4242, ok. 60 tur, PRZED = origin/main a6fb5061a vs PO = poprawiona gałąź) NIE został wykonany.

Powód: runner `gra/tools/ai-economy-measure-run.cjs` jest wznawialny i wymaga pełnego bundla przeglądarkowego
oraz Chromium w trybie live. Chrome jest w środowisku (`/usr/bin/google-chrome`), ale w tej rundzie nie
uruchomiono żadnego odcinka pomiaru. Brak liczb, więc nie ma żadnego wniosku o kierunku zmiany.

## Co jest zmierzone (bez przeglądarki)

Liczby z `gra/tools/ai-free-unit-upkeep-test.cjs` na silniku (prawdziwe `units.json` / `econ-params.json`,
tempo „wysoki” = ×4), wynik surowy: `34 ok, 0 FAIL`.

| Wielkość (właściciel AI, 3 jednostki) | Tura 40 | Tura 41 |
|---|---|---|
| Utrzymanie złota (previewTurn) | 0 | > 0, = 4 × „niski” |
| Żywność armii (militaryFoodConsumptionWithSpichlerz) | 0 | > 0 |
| Surowce utrzymania (totalUnitResourceUpkeep) | 0 | > 0, = 4 × „niski” |
| Bramka rekrutacji AI (aiUpkeepRunwayAllowsRecruit, dane z silnika) | dozwolona | zablokowana |

Gracz-człowiek w turze 40 płaci pełny koszt (test: `gracz tura 40 wysoki > 0`).

Uwaga o zakresie: test nie uruchamia `runWorldEndTurn` ani `advanceCityEconomy` w `main.ts`.
Poprawność przesunięcia tury tiku (N zamiast N+1) potwierdzono czytaniem kodu i pinem tekstowym
(`aiUpkeepTickTurnOverride`), nie wykonaniem ticku.

## Pozostaje do zrobienia

- Pomiar live PRZED/PO (Chromium, seed 4242, ~60 tur, odczyty w turach 30/40/41/60) — osobny odcinek.
- Karty jednostek (`src/ui/unitInfoCard.ts`, `src/ui/entityCards/unitAdapter.ts`) nadal liczą utrzymanie
  globalnym tempem gracza (bez właściciela w sygnaturze). Dla jednostki AI w oknie karta może pokazać
  koszt, którego AI nie płaci. Wymaga przekazania właściciela do kart — poza minimalnym zbiorem tej rundy.
- Pomiar z dispatchu nie obejmuje efektu na skarbiec AI w czasie (pytanie: czy AI zacznie kupować
  więcej jednostek i jak to wpłynie na balans od tury 41).
