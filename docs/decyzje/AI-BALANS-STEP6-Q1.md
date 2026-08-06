# AI-BALANS-STEP6-Q1 — kara score drugiego zwiadowcy

**Status:** 🟡 **ZAPISANA** · **A** (2026-08-06)  
**Cytat Macieja:** „Kara score drugiego zwiadowcy (−80 pkt po pierwszym scoutcie) w `chooseCityProduction`"  
**Źródło:** [`ABC-PACZKA-2026-08-06-KOLEJKA.md`](ABC-PACZKA-2026-08-06-KOLEJKA.md) · audyt `R-AI-TRUDNOSC-AUDYT.md` §C.2 Q3 / rank #5  
**UNLOCK:** `AI-BALANS-UNLOCK-Q1=B` — jedna mała dźwignia na falę

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **AI-BALANS-STEP6-Q1** | **A** | Po zbudowaniu pierwszego Zwiadowca w major AI: obniżyć score kolejnego Zwiadowca w `chooseCityProduction` o **80 punktów**. Major AI częściej wybierze Spichlerz/Koszary zamiast drugiego scouta. |

## Skutek (1–3 zdania)

Major AI przestaje „wyścigowo” budować drugiego zwiadowcę — scoring produkcji miasta karze kolejnego scouta po pierwszym. Zmiana dotyczy logiki wyboru produkcji w `ai.ts` (+ test regresji), bez ruszania mapy ani ekonomii MP. Zgodne z zasadą jednej małej dźwigni na falę po STEP5.

## Wdrożenie

Czeka na hasło **`działaj`** → AutoBot Operator (🟢 izolowana warstwa scoringu AI).
