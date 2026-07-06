# HANDOFF: UI → SILNIK — D3-Q1 modal wojny

**Data:** 2026-06-27 · **Status:** **GOTOWE** (UI + SILNIK wire 2026-06-27)  
**Decyzja:** `docs/decyzje/D3-dyplomacy.md` D3-Q1=A

## Co UI dostarcza

Plik: `gra/src/ui/diplomacyPanel.ts`

- Przyciski akcji per relacja (warstwa uproszczona: Pokój / Wojna / Handel)
- **Wojna** → modal: „Na pewno wypowiadasz wojnę [civ]?” → Tak / Anuluj
- Callback: `onDiplomaticAction(ownerId, action, civLabel)`

## Co SILNIK ma wpiąć w `buildDiplomacyPanelConfig()`

1. Dodać `ownerId` do każdego `DiploRelation` w `getRelations`
2. Dodać `onDiplomaticAction`:

```typescript
onDiplomaticAction: (ownerId, action, civLabel) => {
  const curRel = getDiploRelation(0, ownerId);
  if (action === 'wojna') {
    setDiploRelation(0, ownerId, applyDiplomaticEvent(curRel, 'wojna_wypowiedziana'));
    showHintMessage('Wypowiedziano wojnę: ' + civLabel, 4500);
  } else if (action === 'pokoj') {
    setDiploRelation(0, ownerId, applyDiplomaticEvent(curRel, 'pokoj'));
    showHintMessage('Pokój z: ' + civLabel, 4000);
  } else if (action === 'handel') {
    showHintMessage('Handel z ' + civLabel + ' — UI pełne w v1.1', 3500);
  }
  updateDiplomacyPanel();
  updateHud();
},
```

## DoD

- [x] Klik Wojna → modal → Tak → tier 0 + hint
- [x] Anuluj → brak zmiany relacji
- [ ] smoke OK (bramka przy następnym kanonie)

**Batch SILNIK:** `SIL-P0-05` — **→ SILNIK: GOTOWE**
