# P-AUTO-ULEPSZENIA — automatyczne ulepszenia terenu

**Status:** WDROŻONE (kod)  
**Data decyzji:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AUTO-ULEPSZENIA-Q1** | **C** | Profile (Żywność / Surowce / Infrastruktura / Zrównoważone) + checkbox **„Tylko pola z obywatelami”** (domyślnie **wyłączony** = całe terytorium). Max 1 ulepszenie / miasto / turę. Domyślnie tryb **Ręczny**. |

## Implementacja (v1)

- Wspólny picker z AI (`auto-improvements.ts`)
- Stan miasta: `ulepszeniaTryb` / `ulepszeniaFocus` / `ulepszeniaOnlyWorked`
- UI: toolbar w panelu miasta (jak Budowa)
- EOT: po ekonomii gracza, przed AI; commit od razu (bez pending)
- `wyrab`: pomijany w auto gracza v1 (osobna ścieżka multi-turn)
