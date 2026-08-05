# R-SOLO-ABC — pełny zestaw na nieobecność (2026-08-05)

**Status:** ✅ WSZYSTKIE PACZKI ECHO · praca solo WG poniżej  
**ROBOCZA bazowa:** FALA 231 `283de421` · SOLO-Q1=A → deploy po PASS OK

## ECHO paczka 1 (wcześniej)

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **SOLO-Q1** | **A** | Deploy po AutoBot PASS bez osobnego hasła |
| **SOLO-Q2** | **B** | Pomiń scenę (bez F12) |
| **SOLO-Q3** | **A** | Kamień już spójny (Wzgórza+Góry) — STALE rejestr |

## ECHO paczki 2–4 (Maciej 2026-08-05)

> SUR-WEGIEL b / BITWA-FACING b / BITWA-BUGI a / a + b / DOTYK a / MUZYKA a / PLAYTEST-GATE a / AI-PLAYTEST b + a / SCENA-PRIORYTET a+b

| ID | Odpowiedź | Skutek operacyjny |
|----|-----------|-------------------|
| **SUR-WEGIEL** | **B** | Ukryj węgiel (generacja OFF + UI hide); dane dyplomacji zostają |
| **BITWA-FACING** | **B** | Gracz ustawia kierunek FRONT/BOK/TYŁ — **audyt: C-FLANK dropdown JUŻ JEST** w deploy; domykamy braki + czytelność jeśli coś dziurawe |
| **BITWA-BUGI** | **A** | K1+K2 **już w kodzie**; dokończyć **I** (powtórka zachowuje ręczne grupy) |
| **WIAR-START** | **A+B** | Etap 0 (typy/save) **oraz** przegląd Dźwigni 2–4 (docs) przed strumieniem D1 |
| **DOTYK** | **A** | Dalej ODŁOŻONE — zero pracy |
| **MUZYKA** | **A** | `muzyka_opoznienie_startu_ms=2500`, tylko pierwszy start menu |
| **PLAYTEST-GATE** | **A** | R-AUTO/pigułka/budynki zostają otwarte; kod idzie dalej |
| **AI-PLAYTEST** | **B+A** | Wolno metryki/logi diagnostyczne; **zakaz** dostrajania balansu P-AI-MOC/008 |
| **SCENA-PRIORYTET** | **A+B** | Bez F12 (Q2=B): kolejka **bitwa-bugi → SUR/muzyka → …**; gdy kiedyś będzie pomiar → scena wraca na górę |

## Kolejka solo (teraz)

1. MUZYKA A — ✅  
2. SUR-WEGIEL B — ✅  
3. BITWA-BUGI I (replay grupy) — ✅  
4. **BITWA-FACING B** — ✅ JUŻ WDROŻONE (C-FLANK) + replay kierunku natarcia (minimal fix 2026-08-05)  
5. **WIAR A+B** — ✅ Etap 0 (`wiarygodnosc-types.ts`) + przegląd Dźwigni 2–4 (docs)  
5b. **WIAR R1 / R1b** — ✅ tempo w ticku + one-shot `applyDiplomaticEvent` (FALA 234–235)  
5c. **WIAR R3+R4** — ✅ Wasal bez W-gate + harness D4+D1 (docs/testy)  
5d. **WIAR UI** — ✅ rozbicie życiorys vs bieżące w audiencji (FALA 236)  
6. Deploy FALA (Q1=A) po PASS  

**Nie ruszam:** DOTYK · scena (bez liczb) · balans AI
