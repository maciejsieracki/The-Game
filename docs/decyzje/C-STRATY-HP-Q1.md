# C-STRATY-HP-Q1 — Bitwa ręczna 3D: straty zwycięzcy / pasek siły

**Status:** ZAMKNIĘTE (wyjaśnienie właściciela, bez fixu)  
**Data:** 2026-07-27

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | — zamknięte wyjaśnieniem Macieja, **bez fixu** |
| **Kod `gra/src`** | — (brak zmian) |
| **Deploy `gra-robocza`** | — |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Sytuacja

Zgłoszenie: po bitwie ręcznej 3D zwycięzca nie traci HP / pasek siły wygląda na pełny. Audyt silnika + test 25/25: mechanizm strat zwycięzcy działa (podłoga L_MIN, zapis `hp` po bitwie).

## Odpowiedź Macieja

> **Zamknięte bez fixu** (2026-07-27) — „To była jakaś nadreprezentacyjna siła obrońcy AI. Jak się będzie powtarzać, wrócimy do tematu."

## Decyzja (skrót)

**Interpretacja:** objaw nie był bugiem „zwycięzca nie traci HP", lecz **mylącą prezentacją siły obrońcy AI** (UI/percepcja). Temat **zamknięty** bez zmiany kodu. Reopen tylko przy powtórzeniu z konkretnym repro/save.

## Dowód techniczny (bez zmian)

- Test regresji strat zwycięzcy: 25/25 PASS (stan przed zamknięciem).
- Powiązane: R-BITWA-STRATY, ZNALEZISKO 86 (panel Szczegóły bitwy bez `maxHp` — osobny temat UI).
