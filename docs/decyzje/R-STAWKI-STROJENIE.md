# R-STAWKI-STROJENIE — ×2 kosztów (playtest)

**Status:** WDROŻONE (kod)  
**Data decyzji:** 2026-08-03  
**Cytat Macieja:** *„nie zmieniałbym samej produkcji… podwoiłbym koszt badań… utrzymania jednostek… budowy wszystkich budynków… zużycie jedzenia dla ludności i dla wojska… Zobaczę potem w Playtestie"*

## Decyzja (bez ABC — dyspozycja bezpośrednia)

| Obszar | Zmiana | Bez zmian |
|--------|--------|-----------|
| Badania (Koszt nauki) | **×2** na wszystkich ustawieniach (tempo × trudność dalej działają) | — |
| Utrzymanie jednostek (Pieniądz/turę) | **×2** wszystkie typy | utrzymanie budynków |
| Koszt budowy budynków (Praca) | **×2** względem obecnej gry | dochody/`baza` budynków |
| Żywność ludności (racje) | **×2** | plony żywności |
| Żywność wojska | **×2** | — |
| Produkcja / plony / dochody | **NIE** | zostają |

## Implementacja

Jedna stała `R_STAWKI_KOSZT_MULT = 2` w `gra/src/game/r-stawki-strojenie.ts` (łatwy rewind → 1).
Wpięta w: badania, `buildingWorkCost`, `unitUpkeep`, `rationFoodCostPerPop` / koszt racji, `unitFoodPerTurn`.
