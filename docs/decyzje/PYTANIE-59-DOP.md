# PYTANIE-59-DOP — kumulacja redukcji korupcji (Pałac + Sąd + Pretorium)

**Status:** 🟢 **ZAMKNIĘTE**  
**Data:** 2026-07-27  
**Odpowiedź:** **B** — addytywna kumulacja 30% + 30% + 30% (Maciej: już ustalone i powinno być w kodzie)

## Cytat Macieja

> PYTANIE-59-DOP: **B** — addytywna kumulacja redukcji korupcji 30+30+30 — to już było ustalone i powinno być w kodzie.

## Implikacja

- Sąd, Pretorium i Pałac: każdy **−30 punktów procentowych** straty korupcji w **tym mieście**.
- Kumulacja **addytywna**: `strata_po = strata_bazowa × (1 − suma_redukcji)`.
- Naturalny sufit w jednym mieście: **60%** (max 2 budynki — Pałac tylko stolica, Pretorium tylko region).
- **Nie** mnożna (~34% zostaje przy trzech budynkach).

## Stan kodu (audyt 2026-07-27)

| Element | Stan | Dowód |
|---------|------|-------|
| `corruptionBuildingReduction()` addytywna | ✅ | `economy.ts` ~1202–1207 |
| `KORUPCJA_REDUKCJA_NA_BUDYNEK = 0.30` | ✅ | `economy.ts` ~1183 |
| `KORUPCJA_REDUKCJA_SUFIT = 0.60` | ✅ | `economy.ts` ~1190 |
| Budynki: `sad`, `pretorium`, `palac` | ✅ | `economy.ts` ~1181 |
| Wołanie w ticku ekonomii | ✅ | `turn-economy.ts` ~1240, ~1650 |

**Werdykt kodu:** **ZGODNY** — implementacja = decyzja B.

## Co dalej

Brak zmian kodu — ewentualnie test regresji `corruptionBuildingReduction` przy **`działaj`** jeśli jeszcze nie ma dedykowanego harnessu.
