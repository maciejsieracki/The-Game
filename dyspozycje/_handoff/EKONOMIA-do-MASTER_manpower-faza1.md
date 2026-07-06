# EKONOMIA → MASTER / UI — Manpower faza 1

**Status:** WPIĘTE (logika + odejmowanie przy rekrutacji) · **CZEKA** HUD panel miasta

## Model (potwierdzony Maciej)

| Warstwa | Źródło |
|---------|--------|
| **ludki** | `city.population` (1–10) — bez zmian |
| **epoka** | imperium `getEra(ownerId)` (1=Kamień … 10) |
| **ludność absolutna** | `ludki × ludekNaLudka[epoka]` |
| **manpower max** | `ludki × manpowerNaLudka[epoka]` (= 10% ludności abs.) |
| **koszt 1 jednostki** | `manpowerNaJednostke[epoka]` (= **10%** jednego slotu manpower) |

Przykład epoka 1, 10 ludków: **100 000** ludzi, **10 000** manpower, rekrutacja **−100** MP / jednostka.

## Pliki (EKONOMIA)

- `gra/data/epoka-ludnosc-manpower.json` — tabela 10 epok (Maciej Excel)
- `gra/src/game/manpower.ts` — API czyste
- `gra/src/game/production.ts` — `manpowerCostOf(item, epoka)`
- `gra/src/game/cities.ts` — opcjonalne `city.manpower`
- `gra/tools/manpower-test.cjs` — 10 asercji

## DoD integratora (SILNIK)

1. ~~Po ukończeniu jednostki~~ **ZROBIONE:** `tryDeductUnitSpawnCosts` w turze produkcji + `advanceRecruitmentGated`.
2. Brak MP → jednostka zostaje w kolejce (produkcja/rekrutacja); rush zwraca złoto.
3. ~~Po wzroście population~~ **ZROBIONE:** `turn-economy.ts` → `refreshManpowerAfterPopChange`.
4. HUD / panel miasta: `cityManpowerSnapshot` + format — **UI lane**.

## Faza 3 (później)

Uzupełnianie HP jednostki z puli Manpower (osobna dyspozycja).

## Test

```bash
cd gra && node tools/manpower-test.cjs
```
