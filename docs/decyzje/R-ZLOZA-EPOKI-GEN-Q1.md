# R-ZLOZA-EPOKI-GEN-Q1 — generacja złóż przyszłych epok

**Status:** 🟢 ECHO **A** (2026-08-05) — kanon zapisany · kod metali już zgodny  
**Źródło:** follow-up do `R-KOPALNIA-WEGIEL-Q1` (węgiel epoka 6–7; rezerwa gór)

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **R-ZLOZA-EPOKI-GEN-Q1** | **A** | Złoża późnych epok: **generuj przy Nowej grze**, **ukrywaj / niedostępne do epoki** |

## Cytat

Maciej: `R-ZLOZA-EPOKI-GEN-Q1 a`

## Kanon (A)

1. Przy generacji mapy złoża przyszłych epok **już zajmują heksy** (rezerwa terenu / gór).
2. Do osiągnięcia min. epoki: **niewidoczne** na mapie i **niedostępne** do eksploatacji (rozszerzenie wzorca `deposit-era`).
3. **Nie** dopisywać typów złóż mid-game przy awansie epoki (to była opcja B).
4. Węgiel: nadal `SUR-WEGIEL=B` (wyłączony z mapy) do czasu epok 6–7; gdy wróci — ten sam wzorzec A (`zlozeMinEra` + widoczność), nie spawn przy epoce.

## Dowód — stan kodu (zgodny z A, bez zmian w tej fali)

| Element | Plik | Rola |
|---------|------|------|
| Widoczność per epoka | `gra/src/map/deposit-era.ts` | `isDepositVisible` / `visibleZloze` / `zlozeMinEra` |
| Meta przy gen/load | `ensureDepositEraMeta` (wołane z `main.ts`) | uzupełnia `zlozeMinEra` |
| Miedź/żelazo przy gen | `gra/src/map/gen-helpers.ts` | `zlozeMinEra` 2 / 3 |
| Dostęp zasobów | `gra/src/game/resource-access.ts` | bramka `isDepositVisible` |
| Węgiel OFF | `deposit-era.ts` + `SUR-WEGIEL=B` | `wegiel` → nigdy nie pokazuj (do decyzji późnych epok) |

**ZAKAZ w tej fali:** re-enable węgla, spawn mid-game, zmiana generatora quota — tylko dokumentacja kanonu.

## Następne (gdy epoki 6–7)

- Przywrócenie węgla: `zlozeMinEra` = 6 lub 7 + ulepszenie `kopalnia_wegla` (osobna fala).
- Ewentualna rezerwa „pustych” gór tylko jeśli playtest pokaże brak miejsca — **nie** domyślnie (A = pełne złoża od startu, ukryte).
