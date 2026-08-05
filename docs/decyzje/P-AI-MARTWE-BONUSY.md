# P-AI-MARTWE-BONUSY — martwe parametry trudności AI

**Status:** **ZAMKNIĘTE** (wchłonięte w `P-AI-MOC-BONUS-Q1=A`, FALA 226)  
**Powiązane:** `P-AI-MOC-BONUS.md` · `P-AI-MOC-GAP` · `R-AI-TRUDNOSC-AUDYT.md`

## Co było martwe

Pola z `loadDifficultyParams` / `ai-params.json` **nieczytane** w gameplay poza `bonusProdukcja` (scoring):

- `startoweJednostki`
- `startoweMiasta`
- `bonusWalka`
- `bonusNauka`

## Zamknięcie

Maciej **P-AI-MOC-BONUS-Q1=A** → podpięcie wszystkich 4 · deploy FALA 226 (`ebe4548f`) → w łańcuchu do FALA 238.

Dodatkowo **R-AI-TRUDNOSC P0** (FALA 229): `bonus_produkcja` mnoży realną Pracę major AI (nie tylko scoring).

## Skutek rejestru

Nie traktować `P-AI-MARTWE-BONUSY` jako otwartego buga wiring — reszta gapu Mocy = playtest + osobne tematy (`P-AI-MAJOR-ABSORB`, `P-AI-PROD-GATE-PER-OWNER`).
