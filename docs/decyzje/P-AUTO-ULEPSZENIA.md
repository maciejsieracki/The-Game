# P-AUTO-ULEPSZENIA / R-AUTO-ULEPSZENIA — automatyczne ulepszenia terenu

**Status:** Q1–Q5 ZAPISANE · wdrożone (kod) · czeka deploy  
**Data:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AUTO-ULEPSZENIA-Q1** | **C** | Profile + checkbox „Tylko pola z obywatelami” (domyślnie off = całe terytorium). Domyślnie tryb Ręczny. |
| **R-AUTO-ULEPSZENIA-Q2** | **B** (doprec.) | W opcjach ulepszeń: wybór **1 / 2 / 3** ulepszeń na miasto na turę (tempo budowy). Domyślnie **1**. |
| **R-AUTO-ULEPSZENIA-Q3** | **B** | Wyrąb **tylko ręcznie** — auto gracza **nie** wycina lasów. |
| **R-AUTO-ULEPSZENIA-Q4** | **A** | Auto stawia ulepszenie **na koniec tury** — commit od razu, **bez** pending/cofnięcia (jak AI). Ręczne budowanie na mapie nadal ma pending do EOT. |
| **R-AUTO-ULEPSZENIA-Q5** | **UI mapa** | Sterowanie z poziomu budowy ulepszeń na mapie świata (`buildModeHud`), nie w panelu miasta. |

**Cytat Q4:** *„auto robi ulepszenie na koniec tury… wtedy nie byłoby możliwości cofnięcia"*

**Cytat Q5:** *„sterowanie z poziomu budowy ulepszeń na mapie świata"*

**Cytat Q2+Q3:** *„R-AUTO-ULEPSZENIA-Q2 b w opcji ulepszenia panuje się informacja, czy chcemy jedno, dwa czy trzy ulepszenia na miasto… R-AUTO-ULEPSZENIA-Q3 b”*

## Implementacja

- `ulepszeniaPerTurn: 1 | 2 | 3` na mieście
- UI: sekcja „Auto ulepszenia" w panelu trybu budowy mapy (`buildModeHud.ts`) — wybór miasta, profile, Ręczny, checkbox, tempo 1·2·3
- EOT: `getMaxPerCity` + `skipWyrab: true` (Q3=B)
- Q4=A: auto wpisuje od razu do `placedImprovements` (bez `pendingImprovementsTurn`)

*Koniec.*
