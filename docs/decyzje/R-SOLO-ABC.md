# R-SOLO-ABC — pełny zestaw na nieobecność (2026-08-05)

**Status:** 🟡 Paczka 1 ZAPISANA · paczki 2–4 CZEKAJĄ  
**ROBOCZA:** FALA 231 `283de421`

## ECHO (Maciej 2026-08-05)

> SOLO-Q1 a / SOLO-Q2 b / v a

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **SOLO-Q1** | **A** | Kod + AutoBot + **deploy samodzielnie** po PASS |
| **SOLO-Q2** | **B** | Pomiń R-SCENA-PERF (bez F12) → SUR / inne |
| **SOLO-Q3** | **A** (interpretacja „v a” = Q3=A) | Patrz korekta niżej |

### Korekta faktów SOLO-Q3 (audyt przy ECHO)

Rejestr mówił „kod tylko Góry vs JSON Wzgórza+Góry” — **NIEAKTUALNE**.  
Dziś w `improvement-build.ts` (komentarz Maciej 2026-07-24) oraz `terrain-improvements.json`:

- **Kod:** `kamieniolom` → Wzgórza **i** Góry  
- **JSON:** `"teren": "Wzgórza, Góry (kamień)"`

**SOLO-Q3=A** w intencji = „nie zmieniaj gameplayu na ślepo; spójność docs↔kod”.  
**NIE** wdrażamy cofnięcia do „tylko Góry” (to byłaby regresja względem decyzji 2026-07-24).  
**R-SUR kamień:** **ZAMKNIĘTE — już spójne, zero zmian kodu.**

## Spis paczek

| Paczka | ID | Status |
|--------|-----|--------|
| 1/4 | SOLO-Q1 · SOLO-Q2 · SOLO-Q3 | ✅ ECHO |
| 2/4 | SUR-WEGIEL · BITWA-FACING · BITWA-BUGI | ⏳ |
| 3/4 | WIAR-START · DOTYK · MUZYKA | ⏳ |
| 4/4 | PLAYTEST-GATE · AI-PLAYTEST · SCENA-PRIORYTET | ⏳ |

**Rekomendacje 2–4 (gdy nie zdążysz):** `A A A · A A A · A A B`
