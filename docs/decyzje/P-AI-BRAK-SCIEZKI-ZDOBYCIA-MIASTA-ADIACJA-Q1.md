# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACJA-Q1 — przejęcie pustego miasta przez AI

**Status:** 🟢 GOTOWE / ZWERYFIKOWANE — Evaluator PASS-WITH-NOTES; bez deployu
**Decyzja właściciela:** **A**
**Rejestry:** `dyspozycje/REJESTR-PROSB-I-ZADAN.md` · `docs/obieg/REJESTR-DECYZJI.md` · `dyspozycje/PYTANIA-OTWARTE.md`

## ECHO (cytat)

> „AI major ma móc zdobyć puste, niebronione miasto przez wejście na sąsiedni heks,
> taką samą podstawową ścieżką przejęcia jak gracz/barbarzyńcy. Nie przywracaj ataków
> bez adiacencji ani teleportu.”

## Kontrakt wdrożeniowy

1. Zwykłe AI może wykonać przejęcie wyłącznie przy adiacencji i wyłącznie po wejściu na heks pustego, niebronionego obcego miasta.
2. Mury, garnizon i obrońcy pozostają blokadą tej ścieżki; broniące miasto wymaga istniejącej ścieżki walki/odwrotu.
3. Zachować parytet ownerów, w tym miasta-państwa, oraz istniejące przejęcie barbarzyńców.
4. Nie zmieniać teleportu, zasięgu ataku ani ogólnego marszu.
5. Testy obejmują realną egzekucję komendy, minimum dwa edge case’y i mutację.

## Dowód

- `gra/src/game/city-hex-movement.ts` — bramka adiacencji, murów i obrońców.
- `gra/src/game/ai-city-capture-executor.ts` — egzekucja komendy z `targetCityId` i ponowną widocznością.
- `gra/src/main.ts` — wpięcie egzekutora do ruchu AI.
- `ai-city-capture-integration-test.cjs` — 14/14 PASS.
- `city-hex-movement-test.cjs` — 13/13 PASS.
- typecheck — PASS.

Uwagi Evaluatora: brak pełnego testu E2E z rzeczywistym pathfindingiem; nie blokuje kontraktu paczki.
