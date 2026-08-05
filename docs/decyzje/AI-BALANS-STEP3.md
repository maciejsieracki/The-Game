# AI-BALANS-STEP3 — L3 cuda: throttle 3→2

**Status:** 🟢 **ZDEPLOYOWANE** FALA 247 ROBOCZA `540d2490` · 2026-08-05  
**Źródło audytu:** `R-AI-TRUDNOSC-AUDYT.md` §C.3 Ś1 — `cuda_poziom3_throttle_tur` 3→2

## AC (jedna mała dźwignia)

1. Poziom trudności **3 / Trudny**: AI rozważa kolejkowanie cudu **co 2 tury** (było 3).
2. `cuda_poziom3_prog_koszt_x` **bez zmian** (70).
3. L1/L2 throttle **bez zmian** (8 i 5).
4. Fallback `loadAiWonderParams` dla n===3: default throttle **2** (spójność z JSON).
5. Test: `gra/tools/ai-balans-step3-test.cjs`.
6. ZAKAZ w tym PR: STEP2 warrior, kolonizacja, absorb, bonus_nauka, `main.ts`, buff MP, UI.

## Pliki

| Plik | Zmiana |
|---|---|
| `gra/data/ai-params.json` | `cuda_poziom3_throttle_tur.wartosc` 3→2 + opis |
| `gra/src/game/ai.ts` | fallback `loadAiWonderParams` L3 throttle 2 |
| `gra/tools/ai-balans-step3-test.cjs` | testy throttle + `decideAiWonderBuild` edge |
| `docs/decyzje/AI-BALANS-STEP3.md` | ten dokument |
| `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md` | wzmianka wdrożenia Ś1 throttle |

## Efekt gameplay

Major AI na Trudnym **częściej** sprawdza warunki cudu (co 2 tury zamiast co 3), bez zmiany progu kosztu — więcej szans na zakolejkowanie cudu przy stabilnej ekonomii.

## Evaluator (AutoBot warstwa 2)

*(uzupełni Evaluator po review)*
