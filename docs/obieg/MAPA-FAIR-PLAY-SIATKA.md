# MAPA — Fair play siatka (Maciej 2026-07-04)

**Hasło w czacie:** `reguły mapa fair play`

## Zasada: minimum + bonus z kreatora

| Warstwa | Minimum (fair play) | Dodatkowo (tier kreatora) |
|---------|---------------------|---------------------------|
| **Rzeki** | 1 źródło / komórkę siatki | gęstość siatki + min. długość |
| **Wzgórza (miedź)** | 2 / komórka **15×15** | % z tieru „Relief” |
| **Góry (żelazo)** | 2 / komórka **25×25** | % z tieru „Relief” |
| **Las** | min. **1** / komórka **10×10** | % z tieru „Las” (bonus w komórce) |

Minimum **zawsze** (ensure). Bonus **losowo rozproszony** (applyReliefByNoiseRank + cap tier; las — `reapplyForestOverlay`).

## Rzeki — tier kreatora „Rzeki”

| Ustawienie | Siatka N×N | Min. długość nurtu |
|------------|------------|---------------------|
| **Mało** | 15 | **15** boków hex |
| **Normalnie** | **10** | **25** katalog · **12** min. przy stawianiu siatki |
| **Dużo** | **5** | **35** boków hex |

## Relief — tier kreatora „Góry i wzgórza”

| Tier | Siatka gór (żelazo) | Siatka wzgórz (miedź) | Minimum / komórkę |
|------|---------------------|------------------------|-------------------|
| **Mało** | 35×35 | 21×21 | 2× Góry · 2× Wzgórza |
| **Normalnie** | **25×25** | **15×15** | j.w. |
| **Dużo** | 20×20 | 12×12 | j.w. |

Bonus gór/wzgórz: `reliefLandFractions` — low ~3%/7% · medium ~6%/11% · high ~12%/18% lądu w komórce (rozstaw Poisson).

## Las — tier kreatora „Las”

| Tier | Siatka N×N | Minimum / komórkę |
|------|------------|-------------------|
| **Mało** | 15×15 | 1× Las |
| **Normalnie** | **10×10** | j.w. |
| **Dużo** | 5×5 | j.w. |

Bonus lasu: próg szumu z tieru (Dużo = więcej hexów z lasem ponad minimum siatki).

## Testy

`relief-grid-coverage-test.cjs` · `river-grid-coverage-test.cjs` · `fair-play-grid-test.cjs`
