# Wzrost ludności — tempo progu bufora (2026-07-07)

**Decyzja Macieja:** osobna opcja w kreatorze (zaawansowane ustawienia), niezależna od tempa badań, kosztów budynków i jednostek.

Bazowy próg wzrostu `Próg(N) = 10 + N × współczynnik` z `econ-params.json` zostaje bez zmian — to **Wysoki (×1)**. Tempo w kreatorze mnoży **tylko próg bufora 🍞** na +1 mieszkańca (nie cap Akweduktu 5/15). Asymetria trudności (łatwa/trudna) nakłada się osobno — patrz `B-trudnosc-koszty-asymetria-2026-07-07.md`.

| Ustawienie kreatora | Klucz `wzrostLudnosciPace` | Mnożnik progu |
|---|---|---|
| Wysoki | `wysoki` | ×1 |
| Normalny | `normalny` | ×2 |
| Wolny | `wolny` | ×4 |

Implementacja: `applyGrowthThresholdPace()` w `gra/src/game/population-growth-tempo.ts`; wywołanie w `populationGrowth()` (`economy.ts`), `growthFoodThreshold()` / `advanceCityEconomy()` (`turn-economy.ts`), panel miasta (ETA/pasek wzrostu). `wzrostLudnosciPace` zapisywane w sejwie (`gracz.wzrostLudnosciPace`).

**Przykład (pop 3→4, trudność normalna, wsp=8):**

- Bazowy próg: `10 + 3×8 = 34` 🍞
- Wysoki: **34** 🍞 (jak dotychczas)
- Normalny: **68** 🍞
- Wolny: **136** 🍞

**Oddzielnie od:** `tempoGry` (badania), `buildingCostPace`, `kosztJednostekPace`, cap Akweduktu.
