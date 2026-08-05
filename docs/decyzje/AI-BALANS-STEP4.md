# AI-BALANS-STEP4 — L3 cuda: prog_koszt_x 70→80

**Status:** 🟢 **ZDEPLOYOWANE** FALA 248 ROBOCZA `772bab7c` · 2026-08-06
**Źródło audytu:** `R-AI-TRUDNOSC-AUDYT.md` §C.3 Ś1 — `cuda_poziom3_prog_koszt_x` 70→80

## AC (jedna mała dźwignia)

1. Poziom trudności **3 / Trudny**: AI akceptuje cud gdy koszt ≤ **80×** Praca/turę miasta (było 70).
2. `cuda_poziom3_throttle_tur` **bez zmian** (2 — STEP3).
3. L1/L2 prog i throttle **bez zmian** (25/8 · 45/5).
4. Fallback `loadAiWonderParams` dla n===3: default prog **80** (spójność z JSON).
5. Test: `gra/tools/ai-balans-step4-test.cjs`.
6. ZAKAZ w tym PR: STEP2 warrior, kolonizacja, absorb, bonus_nauka, `main.ts`, buff MP, UI.

## Pliki

| Plik | Zmiana |
|---|---|
| `gra/data/ai-params.json` | `cuda_poziom3_prog_koszt_x.wartosc` 70→80 + opis |
| `gra/src/game/ai.ts` | fallback `loadAiWonderParams` L3 prog 80 |
| `gra/tools/ai-balans-step4-test.cjs` | testy prog L3=80 + L1/L2 bez zmian + throttle L3=2 |
| `docs/decyzje/AI-BALANS-STEP4.md` | ten dokument |
| `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md` | wzmianka wdrożenia Ś1 prog_koszt_x |

## Efekt gameplay

Major AI na Trudnym **łatwiej** kwalifikuje cuda przy stabilnej ekonomii (wyższy mnożnik kosztu), bez zmiany częstotliwości sprawdzania (throttle 2 z STEP3).

## Evaluator (AutoBot warstwa 2)

*(uzupełni Evaluator po review)*
