# D-RELACJA-PW-ASYMETRIA — Relacja modyfikuje tylko PW gracza (2026-08-04)

**Decyzja Macieja (ECHO):** Nie mnożyć obu stron symetrycznie przez mod Relacji.

## Model

| Strona | PW traktatu |
|--------|-------------|
| **Partner (AI)** | Stała **baza** traktatu (np. 80) |
| **Gracz** | `round(baza × (1 − signedRel/100))`, gdzie `signedRel = Relacja − 100`, clamp mod ±90% |

## Przykłady (umowa handlowa, baza 80)

| Relacja | signed | Gracz | Partner |
|---------|--------|-------|---------|
| 52 | −48 | **118** | 80 |
| 100 | 0 | 80 | 80 |
| 148 | +48 | **42** | 80 |

## Implementacja

- `gra/src/game/diplomacy-pn-engine.ts` — `playerTreatyPnRequired` / `partnerTreatyPnRequired` / `treatyPwForRole`
- `gra/src/game/diplomacy-acceptance-points.ts` — asymetryczne `computePlayerAcceptanceSides`
- `gra/src/ui/diplomacyAcceptanceBalance.ts` — panel „Ty: baza→X · Oni: baza"
- `peaceProposalOfferPn` — proponent: gracz @ Relacji, AI = baza

## UI

Karty stołu: gracz „118 PW (baza 80, Relacja +48% koszt)"; partner „80 PW".
