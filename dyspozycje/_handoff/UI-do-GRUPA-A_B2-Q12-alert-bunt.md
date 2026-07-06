# Handoff EKONOMIA → Grupa A (HUD) — Alert buntu krytycznego

| Pole | Wartość |
|------|---------|
| **Status** | **GOTOWE** spec · **CZEKA** UI Grupa A |
| **Decyzja** | **B2-Q12=C** — 2 tury grace + alert strategiczny |

## Event od silnika

```typescript
interface RevoltWarningEvent {
  type: 'revolt-warning';
  cityId: string;
  cityName: string;
  graceTurnsLeft: 2 | 1 | 0;  // 0 = ostatnia tura przed rebelią
  porPct: number;
  severity: 'critical';
  blocking: true;
}
```

## UI (mapa strategiczna — prawy panel chipów)

- **Priorytet:** nad zwykłymi chipami (czerwony / ⚠)
- **Tekst:** patrz `docs/decyzje/B2-Q12-bunt-rebelia.md`
- **WYKONAJ:** otwiera panel miasta z sekcją Porządek
- Aktualizacja co turę: „2 tury” → „1 tura” → „Ostatnia szansa”

## DoD

- [ ] Chip widoczny gdy `revoltGraceRemaining > 0`
- [ ] Znika gdy PorPct ≥ 10% lub miasto odbite po rebelii
- [ ] Spójne z B2-Q5=C (chip + 🔥 hex MAPA)

## Flaga

**CZEKA** Grupa A
