# R-KOLEJKA FALA207 + Design Badania — paczka kolejki deploy

**Status:** ECHO 2026-08-03 · Maciej opcja **1** (rekomendacja)  
**Źródło:** paczka R-KOLEJKA (FALA207 / Design / priorytet następny)

## Decyzje

| ID | Odpowiedź | Treść |
|----|-----------|--------|
| **R-KOLEJKA-FALA207-Q1** | **A** | Następny deploy **FALA 207** = **tylko** handel AI + Połącz (już na `main`, merge PR #42). **Bez** Design w tym deployu. |
| **R-DESIGN-BADANIA-Q1** | **A** | Merge Design Badania PR #44 **teraz** (na `main`); Klatka D (#46) później. Design może leżeć na `main` do osobnego deployu. |
| **R-KOLEJKA-NASTEPNY-Q1** | **B** | Kolejność: **najpierw** deploy FALA 207, **potem** implementacja kolonizacji AI. |

(Maciej: opcja 1 = rekomendacja, 2026-08-03 wieczór.)

## Plan wykonania

1. **ECHO** — ten plik + rejestry + kanał.
2. **Merge PR #44** — Design v1 reskin `scienceHubHud.ts` na `main` (bez deploy).
3. **Deploy FALA 207** — czeka na hasło Macieja **`deploy`**; zakres: handel AI + Połącz tylko.
4. **Kolonizacja AI** — po deploy 207 (PR #59 / implementacja).
5. **Design Badania** — na `main` po merge #44; wchodzi do ROBOCZA dopiero gdy Maciej uwzględni w deployu (nie w FALA 207 per Q1A).

## Powiązane

- `docs/decyzje/R-HANDEL-AI-FALA.md` — R-HANDEL-AI-FALA-Q1=B (kod na main)
- BUG-ARMIA-BRAK-POLACZ — fix Połącz (PR #42)
- PR #44 Design · PR #46 Klatka D (później) · PR #59 kolonizacja (po 207)
