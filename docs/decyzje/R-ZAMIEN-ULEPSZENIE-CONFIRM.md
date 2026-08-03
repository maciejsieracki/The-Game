# R-ZAMIEN-ULEPSZENIE-CONFIRM — potwierdzenie zamiany ulepszeń

**Status:** ZAMKNIĘTE · 2026-08-03  
**Decyzja Macieja:** `R-ZAMIEN-ULEPSZENIE-CONFIRM-Q1 = A`

## ECHO

Cytat odpowiedzi: „R-ZAMIEN-ULEPSZENIE-CONFIRM-Q1 a”

**A — Zawsze przy zastąpieniu.** Każde usunięcie istniejącego ulepszenia (ten sam sektor / impact) → modal potwierdzenia.

## Stan kodu (bez zmian)

Zachowanie A **już działa**:
- `computeImprovementBuildImpact` — `gra/src/map/improvement-build.ts`
- `showImprovementBuildConfirmModal` — `gra/src/ui/improvementBuildConfirm.ts`
- wywołanie z `main.ts` przed budową, gdy impact ≠ null

## Uwaga do playtestu

Przykład „Tartak → Owce na lesie” **nie** jest scenariuszem zamiany w kodzie: Owce na lesie są zablokowane; Tartak (las) i Owce (hodowla) to różne sektory. Realne zamiany z modalem: np. Bydło→Owce, Farma→Tarasy, Wyrąb lasu z Tartakiem.

## Playtest

Budowa ulepszenia kolidującego w sektorze → dialog „zastąpić?” → potwierdź / anuluj.
