# HANDOFF CYWILIZACJE → SILNIK: Wpięcie getCivBonusy (Batch C bonusów)

**Data:** 2026-06-30  
**Od:** Grupa D (CYW)  
**Do:** Integrator (F)  
**Flaga:** **CZEKA** — 3 linie w `main.ts`  
**Warstwa:** 🟡 (tylko callbacki w istniejących hookach)

## Co dostarczyła Grupa D

UI gotowe — wyświetlanie bonusów po podaniu `getCivBonusy`:

| Moduł | Efekt |
|-------|--------|
| `diplomacyAudience.ts` | Lista 3 bonusów pod portretem gracza i rywala |
| `diploListHud.ts` | Skrót 2 bonusów + tooltip pełna lista (🤝 lista D1B) |
| `diplomacyPanel.ts` | Gwiazdka ★ + tooltip przy nazwie (legacy panel) |
| `preBattle.ts` | **Już wpięte** — sekcja „Bonusy nacji” |

## Co SILNIK ma dodać w `main.ts`

Funkcja `civBonusyForOwnerId` już istnieje (~1264). Przekaż ją do trzech konfiguracji:

### 1. `buildDiplomacyPanelConfig()`

```typescript
return {
  getRelations: () => buildPlayerDiploRelations(),
  getKnownWarsBetweenOthers: collectKnownWarsBetweenOthers,
  onOpenAudience: (ownerId: number) => openDiplomacyAudience(ownerId),
  getCivBonusy: civBonusyForOwnerId,
};
```

### 2. `createDiploListHud({ ... })`

```typescript
createDiploListHud({
  getEntries: buildPlayerDiploListEntries,
  onSelectEntry: (ownerId) => { /* bez zmian */ },
  onClose: () => refreshD1bHud(),
  getCivBonusy: civBonusyForOwnerId,
});
```

### 3. `openDiplomacyAudience` → `showDiplomacyAudience({ ... })`

```typescript
showDiplomacyAudience({
  ownerId,
  getState: () => { /* bez zmian */ },
  onAction: applyAudienceAction,
  onBack: () => { /* bez zmian */ },
  getCivBonusy: civBonusyForOwnerId,
});
```

## DoD

- [ ] Playtest: 🤝 → lista → widać skrót bonusów rywala
- [ ] Audiencja → pod portretami 3 linie bonusów (gracz + AI)
- [ ] Pre-battle → sekcja bonusów (już działa — regresja OK)
- [ ] `npx tsc --noEmit` + bramka CYW bez regresji

## Po wpięciu

Melduj w `CYWILIZACJE-DO-MASTERA.md` · zamknij Batch C w `CYWILIZACJE-do-UI_bonusy-wyswietlanie.md`.
