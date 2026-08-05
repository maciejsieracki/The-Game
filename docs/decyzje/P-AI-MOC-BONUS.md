# P-AI-MOC-BONUS — podpięcie martwych bonusów trudności AI

**Status:** 🟢 WDROŻONE (kod) · Q1=**A** (Maciej 2026-08-05)  
**Powiązane:** `P-AI-MOC-GAP` · `P-AI-MARTWE-BONUSY`

## ECHO
`P-AI-MOC-BONUS-Q1 A` — podpiąć wszystkie 4 martwe pola z `DifficultyParams`:
- `startoweJednostki`
- `startoweMiasta`
- `bonusWalka`
- `bonusNauka`

Źródło parametrów: `loadDifficultyParams` / `ai-params.json` (`trudnosc_poziomN_*`).

## Zakres wdrożenia
- Spawn AI major: dodatkowe jednostki / miasta wg poziomu trudności
- Combat: `bonusWalka` dla AI (nie MP defensiveCopy, chyba że ten sam path)
- Nauka: `bonusNauka` w dochodzie badań AI

## Deploy
Po kodzie + Evaluator → ROBOCZA na hasło (ta sesja: Maciej chce deploy po zamknięciu paczki).
