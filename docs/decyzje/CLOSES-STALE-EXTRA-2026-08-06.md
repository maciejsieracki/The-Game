# CLOSES-STALE-EXTRA — synchronizacja rejestrów (2026-08-06)

**Branch:** `cursor/docs-close-stale-extra-63a1`  
**Zakres:** tylko docs — bez `gra/src`, bez deploy  
**Weryfikacja:** kod na `main` + wpisy `WERSJE.md` (FALA 212–248)

## Zamknięte / zsynchronizowane ID

| ID | Było (stale) | Jest | Dowód kod/deploy |
|----|--------------|------|------------------|
| **SPICH-AUTO-Q1** | REJESTR 🟡 ZAPISANA | 🟢 WDROŻONA | FALA 212 `e38ad116` · `empire-food.ts` · `spich-auto-ration-notify.ts` |
| **REL-MP-SAME-Q1** | REJESTR 🟡 ZAPISANA | 🟢 WDROŻONA | FALA 212 `e38ad116` · `startRelationForPlayerSameCivCityState` |
| **P-AI-006** | REJESTR-PROSB „stale” | ZAMKNIĘTE | REJESTR-DECYZJI 🟢 FALA 36 · `civ-ai.json` ekspansywność 2–5 |
| **P-AI-MARTWE-BONUSY** | PYTANIA OTWARTE | ZAMKNIĘTE | `P-AI-MOC-BONUS` FALA 226 `3840f218` · `ai-difficulty-bonus.ts` |
| **P-AI-PROD-GATE-PER-OWNER** | PYTANIA OTWARTE | ZDEPLOYOWANE | FALA 240 `d1450398` · `effectiveGameDifficultyForOwner` |
| **P-AI-MAJOR-ABSORB** | PYTANIA OTWARTE | ZDEPLOYOWANE | FALA 240–241 · `ai-major-absorb.ts` |
| **HANDEL-SPLIT-Q1** | PYTANIA OTWARTE | ZAMKNIĘTE | REJESTR 🟢 FALA 80 `7d266143` · `umowa_szlakow`/`umowa_wymiany` |
| **D-DYPLO-KATALOG-Q1** | — | ZDEPLOYOWANE | FALA 243 `01f6024a` |
| **D-DYPLO-CELOWNIK-Q1** | — | ZDEPLOYOWANE | FALA 241 `178073f9` |
| **D-DYPLO-AKCJE-SZARE-Q1** | — | ZDEPLOYOWANE | FALA 243 `01f6024a` |
| **BUG-DYPLO-PANEL-OVERLAP-Q1** | PYTANIA ECHO/W TOKU | ZDEPLOYOWANE | FALA 245 `8b6e0cfe` · `unitCtxDockDiploGate.ts` |
| **R-AI-MIASTA-BUDOWY** (+ FIX) | PYTANIA tabela #17 OTWARTE | ZDEPLOYOWANE | FALA 244 `0757265a` |
| **C-UNITS-OPIS** | REJESTR-PROSB otwarty opis | ZAMKNIĘTE | `units.json` Kamień: egipski=self bow, sumeryjski=łuk prosty |
| **PYTANIE-15** | tabela sesji (Farma/glinianka UI) | ZAMKNIĘTE | tylko UI — złoże zostaje |
| **PYTANIE-16** | tabela sesji (Tartak/Glinianka stawki) | ZAMKNIĘTE | wdrożone 2026-07-29 |
| **R-ZLOZA-EPOKI-GEN-Q1** | ECHO A bez domknięcia | KANON ZAMKNIĘTY | `deposit-era.ts` zgodny z A — bez nowego deploy |
| **R-RZEKI-UJSCIE-FALA138** | GOTOWE(kod)/czeka deploy | ZDEPLOYOWANE | FALA 140+177 · `ensureRiverOutlets` |
| **R-BUDYNKI-NIEAKTYWNE-pytanie.md** | OTWARTE | ZAMKNIĘTE | FALA 222 `132401ef` |
| **R-PROD-POOL-TEST** | W TOKU + stary opis luki | ZDEPLOYOWANE | FALA 5 `c676b681` · `unitStockCost` |
| **R-PARYTET-AUDYT** | W TOKU | ZAMKNIĘTE (raport) | `AUDYT-PARYTET-AI-2026-07-24.md` |
| **R-SCENA-PERF-FALA138** | WDROŻONE(kod) | ZDEPLOYOWANE | FALA 248 `772bab7c` |

## Pliki dotknięte

- `docs/obieg/REJESTR-DECYZJI.md`
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
- `dyspozycje/PYTANIA-OTWARTE.md`
- `docs/decyzje/SPICH-AUTO-Q1.md` · `REL-MP-SAME-Q1.md` · `R-BUDYNKI-NIEAKTYWNE*.md` · `R-AI-TRUDNOSC-AUDYT.md`
- `STAN-PRACY-HANDOFF.md`

## Nie zamykane (świadomie)

- **P-AI-MOC-GAP** — `canAfford` stall nadal otwarte
- **R-RZEKI-KILLSWITCH-DIAG** — eksperyment diag, osobny tor
- **bonus_produkcja** opis vs kod — osobny tor P0-1 w audycie AI
