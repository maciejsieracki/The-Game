# R-KOLEJKA FALA207 + Design Badania — paczka kolejki deploy

**Status:** ECHO 2026-08-03 (korekta wieczorna) · Maciej zmienił A/A/B → **B/B/A+C**  
**Źródło:** paczka R-KOLEJKA (FALA207 / Design / priorytet następny)

## Decyzje (AKTUALNE)

| ID | Odpowiedź | Treść |
|----|-----------|--------|
| **R-KOLEJKA-FALA207-Q1** | **B** | Następny deploy **FALA 207** = handel AI + Połącz + **Design Badania** (#44 już na `main`). |
| **R-DESIGN-BADANIA-Q1** | **B** | Design Badania **razem z Klatką D (#46)** — merge #46 teraz. |
| **R-KOLEJKA-NASTEPNY-Q1** | **A+C** | (1) **działaj kolonizacja AI teraz**; (2) paczka Design (w tym Klatka) + Design w deploy FALA 207. Kolejność: merge #46 → implementacja kolonizacji → czeka na hasło Macieja **`deploy`** FALA 207 (handel+Połącz+Design+Klatka+kolonizacja jeśli gotowa). **Agent NIE deployuje sam.** |

**Korekta:** pierwszy ECHO (opcja 1) miał A/A/B — Maciej 2026-08-03 wieczór zmienił na B/B/A+C.

## Plan wykonania

1. **ECHO korekta** — ten plik + rejestry + kanał.
2. **Merge PR #46** — Klatka D (numerek planu na drzewku) na `main`.
3. **Implementacja R-AI-KOLONIZACJA** — kod (bez deploy).
4. **Deploy FALA 207** — czeka na hasło Macieja **`deploy`**; zakres: handel AI + Połącz + Design Badania + Klatka D + kolonizacja AI (jeśli gotowa).

## Powiązane

- `docs/decyzje/R-HANDEL-AI-FALA.md` — R-HANDEL-AI-FALA-Q1=B (kod na main)
- `docs/decyzje/R-AI-KOLONIZACJA.md` — Q1A Q2A Q3B + dystans 4
- BUG-ARMIA-BRAK-POLACZ — fix Połącz (PR #42)
- PR #44 Design (main) · PR #46 Klatka D · kolonizacja AI (kod)
