# AI-BALANS-STEP1 — kolonizacja major AI: pop źródła na Trudnym

**Status:** 🟢 Evaluator PASS · gotowe do Grok final / deploy FALA 242 (SOLO-Q1=A) · 2026-08-05  
**Źródło audytu:** `R-AI-TRUDNOSC-AUDYT.md` §C.3 D1 — `AI_COLONIZATION_SOURCE_MIN_POP` 5→4 na L3

## AC (jedna mała dźwignia)

1. Na poziomie trudności **3 / hard**: próg ludności miasta-źródła kolonii major AI = **4** (było globalnie 5).
2. Łatwy + Normalny: zostaje **5**.
3. Tylko major AI (nie MP) — ta sama ścieżka `planCityFounding` / helper `hasColonizationSource`.
4. Test: L3 przy pop=4 → może kolonizować; L2 przy pop=4 → nie; L3 przy pop=3 → nie.
5. ZAKAZ: inne zmiany ai-params / absorb / combat w tym PR.

## Po PASS → deploy FALA 242 (SOLO-Q1=A).

## Evaluator (AutoBot warstwa 2 — 2026-08-05)

**Werdykt:** **PASS**  
**Tip:** `9f92cbd` · branch `cursor/feat-ai-balans-small-63a1`

| # | Oś | Wynik |
|---|-----|-------|
| 1 | **SCOPE** — diff tylko `gra/src/game/ai.ts` + `gra/tools/ai-colonization-pop-test.cjs`; zero `ai-params.json` / absorb / combat / `main.ts` | ✅ |
| 2 | **AC** — L3 próg 4 (`AI_COLONIZATION_SOURCE_MIN_POP_L3`); L1/L2 = 5; ścieżka `planCityFounding` / `hasColonizationSource` / `isLocalExpansionPhase` | ✅ |
| 3 | **MAJOR-ONLY** — logika w `ai.ts` major AI; `evaluateFoundCityAffordance` / MP founding bez zmian | ✅ |
| 4 | **STRICT** — celowany test `ai-colonization-pop-test.cjs` 13/13 | ✅ |
| 5 | **STRICT-EDGE** — negacja L2+pop4, L3+pop3, L2 local phase ON, L2 founding null | ✅ |
| 6 | **STRICT-PARITY** — zmiana tylko `poziomTrudnosci` major AI; gracz (`ownerId===0`) poza diffem; AC „major only” | ✅ |
| 7 | **STRICT-SAVE** — brak nowych pól stanu; próg runtime z `opts.poziomTrudnosci` | ✅ |
| 8 | **Bramki** — `tsc --noEmit` 0 · `ai-colonization-pop-test.cjs` 13/13 | ✅ |

**Uwaga (nieblokująca):** brak jawnego asercji L1+pop4 — pokryte przez ten sam branch co L2 (T2b) + stałe T1a/T1b.
