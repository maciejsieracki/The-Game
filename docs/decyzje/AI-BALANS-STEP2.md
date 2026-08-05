# AI-BALANS-STEP2 — L3 pokój: kara score Wojownika w produkcji major AI

**Status:** 🟡 **Operator done** · 2026-08-05 · branch `cursor/ai-balans-step2-63a1`  
**Źródło audytu:** `R-AI-TRUDNOSC-AUDYT.md` §C.3 Ś2 — kara −40 score Wojownika gdy `!underThreat` na L3

## AC (jedna mała dźwignia)

1. Poziom trudności **3 / Trudny** + **`!underThreat`**: score kandydata **Wojownik** w `chooseCityProduction` major AI **−40**.
2. L1/L2: brak tej kary.
3. L3 + `underThreat`: kara **nie** stosuje się.
4. Tylko major AI (`isMajorAiOwner` — nie MP `defensiveCopy`, nie gracz).
5. Stała `AI_L3_PEACE_WARRIOR_SCORE_PENALTY = 40` + helper `applyL3PeaceWarriorPenalty`.
6. Test: `gra/tools/ai-balans-step2-test.cjs`.
7. ZAKAZ w tym PR: inne ai-params, absorb, combat, kolonizacja pop, cuda, `main.ts`, buff MP, UI.

## Pliki

| Plik | Zmiana |
|---|---|
| `gra/src/game/ai.ts` | stała + `applyL3PeaceWarriorPenalty` + wywołanie po majorEarly bias |
| `gra/tools/ai-balans-step2-test.cjs` | testy helper + chooseCityProduction |
| `docs/decyzje/AI-BALANS-STEP2.md` | ten dokument |
| `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md` | wzmianka wdrożenia Ś2 |

## Evaluator

Czeka na warstwę 2 AutoBot (STRICT / SCOPE / bramki).
