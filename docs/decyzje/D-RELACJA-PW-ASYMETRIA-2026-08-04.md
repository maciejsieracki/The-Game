# D-RELACJA-PW-ASYMETRIA — Relacja modyfikuje tylko PW gracza (2026-08-04)

**Decyzja Macieja (ECHO):** Nie mnożyć obu stron symetrycznie przez mod Relacji.

**KOREKTA Maciej 2026-08-04:** odwrócono znak — Relacja modyfikuje **siłę PW** gracza (nie inflacja kosztu traktatu).

## Model

| Strona | PW traktatu |
|--------|-------------|
| **Partner (AI)** | Stała **baza** traktatu (np. 80) |
| **Gracz** | `round(baza × (1 + signedRel/100))`, gdzie `signedRel = Relacja − 100`, clamp mod ±90% |

## Przykłady (umowa handlowa, baza 80)

| Relacja | signed | Gracz | Partner |
|---------|--------|-------|---------|
| 52 | −48 | **42** | 80 |
| 100 | 0 | 80 | 80 |
| 148 | +48 | **118** | 80 |

## Implementacja

- `gra/src/game/diplomacy-pn-engine.ts` — `playerTreatyPnRequired` / `partnerTreatyPnRequired` / `treatyPwForRole`
- `gra/src/game/diplomacy-acceptance-points.ts` — asymetryczne `computePlayerAcceptanceSides`
- `gra/src/ui/diplomacyAcceptanceBalance.ts` — panel „Ty: baza→X · Oni: baza"
- `peaceProposalOfferPn` — proponent: gracz @ Relacji, AI = baza

## UI

Karty stołu: gracz „42 PW (baza 80, Relacja −48% siła)"; partner „80 PW".
Niska Relacja → niższe PW Twojej strony → dopłać do bilansu.
