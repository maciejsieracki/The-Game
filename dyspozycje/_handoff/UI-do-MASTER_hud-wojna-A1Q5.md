# UI → MASTER: HUD wojna z graczem + wywiad w Dyplomacji (A1-Q5)

**Data:** 2026-06-26 · **Decyzja Macieja:** A1-Q5 = A+C custom  
**Status:** GOTOWE (lane UI) — czeka wpięcie haka w `main.ts` przy `showHud` / `configureDiplomacyPanel`

---

## Decyzja (skrót)

- **Mapa świata:** tylko wojny **z graczem** — chip: nazwa nacji + ⚔, czerwone tło; klik → Dyplomacja.
- **Dyplomacja:** pełne relacje gracza + sekcja **„Wojny znane (wywiad)”** — pary cywilizacji at war (gdy gracz ma dostęp/wywiad), także bez udziału gracza.

---

## API

### `hud.ts`

```typescript
getWarsWithPlayer?: () => { civName: string; civId?: string }[];
// Klik chip → istniejące onOpenDiplomacy
```

### `diplomacyPanel.ts`

```typescript
getKnownWarsBetweenOthers?: () => { civA: string; civB: string }[];
```

---

## Wpięcie SILNIK (przykład)

```typescript
showHud({
  // ...
  getWarsWithPlayer: () =>
    relations.filter(r => r.tier === 0).map(r => ({ civName: r.civ })),
  onOpenDiplomacy: () => showDiplomacyPanel(),
});

configureDiplomacyPanel({
  getRelations: () => /* ... */,
  getKnownWarsBetweenOthers: () => /* z diplomacy.ts gdy wywiad */,
});
```

**Flaga:** GOTOWE DO WPIĘCIA (razem z batch HUD D1B).
