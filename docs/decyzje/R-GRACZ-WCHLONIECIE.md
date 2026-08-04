# R-GRACZ-WCHLONIECIE — wchłonięcie MP przez gracza po wasalu

**Status:** ZDEPLOYOWANE FALA 206 (`1c7e9df7`) · 2026-08-03  
**Branch:** `cursor/fix-gracz-wchloniecie-63a1`

## Decyzje Macieja (ECHO)

| ID | Decyzja |
|----|---------|
| Q1 | **A** — po aktywnym wasalu, od tury **N=10** (podczas trwania wasalu) |
| Q2 | **A** — Respekt ≥ **90** (`progWchloniecieRespekt`) |
| Q3 | **A** — drogie złoto + **zgoda wasala** (evaluateProposal accept/reject) |
| Scope v1 | Tylko **miasta-państwa** (`responderIsCityState`) |
| Koszt | `max(200, 150 + 25 × ludność)` MP (suma pop miast) |

## Implementacja

- `ProposalActionId`: `'wchloniecie'` · UI id **15** (osobny od 12 Wasalizacja)
- Parametry: `graczWchlonieciePoWasaluTur`, `graczWchloniecieKosztBaza`, `graczWchloniecieKosztPerLudnosc`, `graczWchloniecieKosztMin`
- Zgoda wasala: Relacja ≥ 60 (consent gate Q3A)
- Akceptacja: jednorazowy transfer ¤ → MP, `annexCityStateToOwner`, usunięcie dealu wasalizacji

## Pliki

`gra/src/game/diplomacy-proposals.ts` · `diplomacy-locks.ts` · `main.ts` · UI audience/trade basket · `gra/data/diplomacy.json`
