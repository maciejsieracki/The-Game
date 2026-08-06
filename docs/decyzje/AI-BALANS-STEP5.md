# AI-BALANS-STEP5 — bonus_produkcja → realna Praca major AI

**Status:** 🟡 Operator `cursor/ai-balans-step5-63a1` · 2026-08-06  
**Źródło audytu:** `R-AI-TRUDNOSC-AUDYT.md` §D **P0-1** + §C.2 Q1 / §C.3 Q2  
**UNLOCK:** `AI-BALANS-UNLOCK-Q1=B` — jedna mała dźwignia

## AC (jedna dźwignia)

1. Major AI (nie gracz, nie MP, nie barbar): mnożnik `1 + bonusProdukcja` z `loadDifficultyParams` / `trudnosc_poziomN_bonus_produkcja` mnoży **realną Pracę** używaną do budowy (`doBudynkow` + `doPuli` w ticku produkcji).
2. L1: bonus 0 → bez zmian tempa. L2: +10%. L3: +25%. Wartości **z JSON** (`ai-params.json`).
3. Tylko **major AI** — wzorzec `qualifiesForMajorAiDifficultyBonus` + `aiDiffLevelForOwner` (jak `bonusWalka`).
4. Scoring `diffProdBonus` w `chooseCityProduction` **zachowany** (scoring + realna Praca = zamierzone).
5. Test: `gra/tools/ai-balans-step5-test.cjs`.
6. ZAKAZ w tym PR: STEP1–4 regress, absorb, scout, cuda, UI, buff MP, `npm run build`.

## Pliki

| Plik | Zmiana |
|---|---|
| `gra/src/game/ai-difficulty-bonus.ts` | `difficultyProductionMultiplier` (P0-1, już na main) |
| `gra/src/main.ts` | `difficultyProductionMultForOwner` + tick produkcji ~20843-20866 |
| `gra/tools/ai-balans-step5-test.cjs` | testy mult L1/L2/L3 + major-only + mock tick |
| `docs/decyzje/AI-BALANS-STEP5.md` | ten dokument |
| `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md` | §I STEP5 |

## Wpięcie (DRY)

| Warstwa | Plik:funkcja |
|---|---|
| Mnożnik czysty | `ai-difficulty-bonus.ts` → `difficultyProductionMultiplier` |
| Gate major only | `main.ts` → `difficultyProductionMultForOwner` (wywołuje `qualifiesForMajorAiDifficultyBonus`) |
| Tick produkcji | `main.ts` → end-turn AI: `econTick.doBudynkow/doPuli × prodMult` + `pracaBudynki` |

## Efekt gameplay

Major AI na Normalnym buduje **+10%** szybciej, na Trudnym **+25%** — zgodnie z opisem Panelu trudności. Gracz i miasta-państwa **bez** bonusu.

## Evaluator (AutoBot warstwa 2)

*(uzupełni Evaluator po review)*
