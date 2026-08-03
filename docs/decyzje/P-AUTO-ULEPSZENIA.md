# P-AUTO-ULEPSZENIA / R-AUTO-ULEPSZENIA — automatyczne ulepszenia terenu

**Status:** Q1–Q3 ZAPISANE · Q2/Q3 wdrożenie w toku · **Q4 czeka**  
**Data:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AUTO-ULEPSZENIA-Q1** | **C** | Profile + checkbox „Tylko pola z obywatelami” (domyślnie off = całe terytorium). Domyślnie tryb Ręczny. |
| **R-AUTO-ULEPSZENIA-Q2** | **B** (doprec.) | W opcjach ulepszeń: wybór **1 / 2 / 3** ulepszeń na miasto na turę (tempo budowy). Domyślnie **1**. |
| **R-AUTO-ULEPSZENIA-Q3** | **B** | Wyrąb **tylko ręcznie** — auto gracza **nie** wycina lasów. |
| **R-AUTO-ULEPSZENIA-Q4** | *(brak)* | Commit od razu vs pending — **czeka na literę**. |

**Cytat Q2+Q3:** *„R-AUTO-ULEPSZENIA-Q2 b w opcji ulepszenia panuje się informacja, czy chcemy jedno, dwa czy trzy ulepszenia na miasto… R-AUTO-ULEPSZENIA-Q3 b”*

## Implementacja

- `ulepszeniaPerTurn: 1 | 2 | 3` na mieście
- UI: przyciski 1·2·3 w toolbarze auto-ulepszeń
- EOT: `getMaxPerCity` + `skipWyrab: true` (Q3=B)

*Koniec.*
