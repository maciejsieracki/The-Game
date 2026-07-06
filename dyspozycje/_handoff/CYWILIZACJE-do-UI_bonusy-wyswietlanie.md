# HANDOFF CYWILIZACJE → UI: Wyświetlanie bonusów cywilizacji

**Data:** 2026-06-26  
**Od:** CYWILIZACJE (Grupa D)  
**Do:** UI  
**Flaga:** **→ INTEGRATOR: GOTOWE** (Batch B — preBattle)

### Batch B — Pre-battle

- [x] `gra/src/ui/preBattle.ts` — sekcja „Bonusy nacji” (atakujący/obrońca) — read-only z `civBonusy` przekazanych z silnika
- [x] **Bez** liczenia mechaniki — tylko wyświetlanie `opis`
- [x] Hook `configurePreBattle({ getCivBonusy })` — handoff `UI-do-INTEGRATOR_preBattle-bonusy-P0-D4.md`

### Batch C — dyplomacja (2026-06-30)

- [x] `diplomacyAudience.ts` — bonusy pod portretami (hook `getCivBonusy`)
- [x] `diploListHud.ts` — skrót + tooltip na liście 🤝
- [x] `diplomacyPanel.ts` — ★ + tooltip (legacy panel)
- [ ] **Wpięcie SILNIK:** `getCivBonusy: civBonusyForOwnerId` ×3 — handoff `CYWILIZACJE-do-SILNIK_bonusy-display-wire.md`

---

## Kontrakt od SILNIKA

UI potrzebuje callbacków w `PreBattleInfo` lub rozszerzenia:

```typescript
bonusyAtakujacy?: { opis: string; realizuje?: string }[];
bonusyObronca?: { opis: string; realizuje?: string }[];
```

SILNIK wypełnia z `player.civBonusy` / lookup AI — **UI nie czyta civs.json bezpośrednio** (preferowane: przez hook jak `getCivBonusy`).

---

## DoD

- Maciej widzi 3 bonusy przy wyborze Rzymu/Grecji (tekst z JSON)
- Pre-battle pokazuje aktywne bonusy obu stron (tekst)

*— CYWILIZACJE, 2026-06-26*
