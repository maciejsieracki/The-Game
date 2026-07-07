# Koszty jednostek — mnożnik rekrutacji (2026-07-07)

**Decyzja Macieja:** osobna opcja w kreatorze (zaawansowane ustawienia), niezależna od kosztów budynków i tempa badań.

Bazowe wartości `Pieniądz (koszt)` w `units.json` zostają bez zmian — to **Niski (×1)**. Prędkość kosztów jednostek w kreatorze mnoży wymagane złoto rekrutacji:

| Ustawienie kreatora | Klucz `kosztJednostekPace` | Mnożnik kosztu |
|---|---|---|
| Niski | `niski` | ×1 |
| Normalny | `normalny` | ×2 |
| Wysoki | `wysoki` | ×4 |

Implementacja: `applyUnitCostPace()` w `gra/src/game/unit-cost-tempo.ts`, wywoływana w `production.ts` (`unitMoneyCost`) po ulgach cywilizacji. `kosztJednostekPace` zapisywane w sejwie (`gracz.kosztJednostekPace`).

Przykład: **Wojownik** (bazowy koszt 10 zł) → Niski 10 / Normalny 20 / Wysoki 40 zł.

**Oddzielnie od:** `buildingCostPace` (Praca budynków) i `tempoGry` (koszt badań).
