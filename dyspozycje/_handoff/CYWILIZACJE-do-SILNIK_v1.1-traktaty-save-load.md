# CYWILIZACJE → SILNIK: v1.1 traktaty, save/load, pętla tury

> **Status:** **→ SILNIK: GOTOWE** · EKO+UI moduły dostarczone — batch `SILNIK-D-V11`
> **Ważne:** v1.0 zapisuje tylko `diplomaticContactEstablished` — **bez tablicy traktatów**

---

## Stan dziś (dlaczego sojusz „nie trzyma się” po load)

| Element | v1.0 |
|---------|------|
| `main.ts` relacje | **Slim `Relation`** — zaufanie, respekt, status — **bez `traktaty[]`** |
| `tickDiplomacy` | Umie wygaszać traktaty **gdy** dostanie pełne `RelacjaDyplomatyczna` |
| Save | `meta.diplomaticContactEstablished: number[]` ✅ · traktaty ❌ |
| Sojusz AI | Czasem ustawia `status: 'sojusz'` **bez traktatu** (uproszczenie) |

**CYW dostarczy v1.1:** API traktatów; **SILNIK wpina** storage + save/load + endTurn.

---

## Co CYW dostarczy (moduł lane) ✅

Pliki:
- `gra/src/game/diplomacy-treaties.ts` — `ActiveDeal`, CRUD, sojusze, `treatiesBrokenByWar`, `tributeDeals`
- `gra/src/game/diplomacy-proposals.ts` — `evaluateProposal`, `applyAcceptedProposal`, `aiCommandToPendingProposal`

Testy: `diplomacy-treaties-test.cjs` (7/7) · `diplomacy-proposal-test.cjs` (15/15)

---

## Co SILNIK ma zrobić (1–2 batche)

### Batch F-D-V11-1 — storage

1. W `main.ts`: `activeDeals: ActiveDeal[]` (lub mapa per para).
2. Przy akceptacji NAP/sojusz/handel/trybut: `addTreaty` + sync `Relation.status`.
3. `endTurn`: `expireTreaties` + wywołaj `tickDiplomacyPayments` (EKO).
4. Przy wypowiedzeniu wojny: zerwij NAP/sojusz (CYW event `zlamany_pakt`).

### Batch F-D-V11-2 — save/load

```typescript
meta: {
  diplomaticContactEstablished: number[];
  diplomacyDeals: ActiveDeal[];  // NEW
}
```

5. Load: odtwórz `activeDeals` + przelicz status relacji.
6. HUD chipy `sojusze` / `pakty` — licz z `activeDeals`, nie tylko ze `status`.

### Batch F-D-V11-3 — sojusz a wojna (wg T2)

- Hook w deklaracji wojny / wejściu w bitwę: jeśli T2A — sprawdź czy obrońca ma sojusznika.

---

## DoD

- [ ] Save/load roundtrip z aktywnym NAP i trybutem
- [ ] diplomacy-test + nowy treaties-test bez regresji
- [ ] Meldunek `SILNIK-DO-MASTERA.md`

**Kolejność:** po **UI modale** + **EKO tick** + **CYW treaties module** = `→ SILNIK: GOTOWE`
