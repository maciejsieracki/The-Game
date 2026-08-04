# R-MP-HARD-WAVE — Trudne państwa-miasta: wojsko + fala + sync DOW

**Data:** 2026-08-04 · **Status:** ZDEPLOYOWANE FALA 214 `adefb5b8` · **PR:** #80

## Decyzje Macieja (zamknięte)

| ID | Wybór | Treść |
|----|-------|-------|
| **Q1** | **A** | Trudność PM=Hard: wcześniej/więcej wojska — osłabiona supresja Wojownik/Łucznik/Koszary w bootstrapie infra, wyższy priorytet Koszar; marsz ofensywny dopiero gdy armia polowa ≥3 (garnizon min. 1). Easy/Normal bez zmian. |
| **Q2** | **A** | Fala ataku: na Hard w wojnie z graczem — brak solo-raidów; atak sąsiedni tylko przy stosie ≥3 na hex (lub zagrożenie własnego miasta → solo obrona OK). Łączenie z siostrami/sojusznikami i wspólny cel kampanii. |
| **Q3** | **A** | Sync DOW: jeden rzut wojny na klaster siostrzanych PM / turę (60%); przy sukcesie wszystkie kwalifikujące się siostry DOW gracza razem (NAP/handiel/pokój respektowane). |

## Implementacja

| Obszar | Plik | Mechanizm |
|--------|------|-----------|
| Q1 produkcja | `gra/src/game/ai.ts` `chooseCityProduction` | `cityStateOffensiveSupport`: supresja wojska −60 zamiast −250, Koszary −25 zamiast −90, bonus Koszary +400, +70/+55 Wojownik/Łucznik |
| Q1 marsz | `gra/src/game/ai.ts` `planCityStateOffensiveMove` | `minFieldArmyBeforeSend = CS_WAVE_ATTACK_MIN_STACK (3)` |
| Q2 fala | `gra/src/game/ai.ts` `decideDefensiveCopyTurn` | Solo atak na engageable wroga zakazany gdy `stack < 3` i brak zagrożenia domu; max 3 marsze ofensywne/turę na Hard |
| Q3 DOW | `gra/src/game/city-state-difficulty.ts` | `resolveClusterCityStateWarOnPlayer` + `isCityStateEligibleForPlayerWar` |
| Q3 silnik | `gra/src/main.ts` | Jeden blok przed `ownerLoop` (nie per-owner `shouldCityStateRollWarOnPlayer`) |

## Testy

- `gra/tools/city-state-alliance-test.cjs` — T10 (4 garnizony), T12 (solo vs fala)
- `gra/tools/city-state-cluster-diff-test.cjs` — T8 (cluster sync DOW)

## Bramki

```bash
cd gra && npx tsc --noEmit
node tools/city-state-alliance-test.cjs
node tools/city-state-cluster-diff-test.cjs
```
