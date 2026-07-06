# UI → SILNIK: v1.1 audiencja — modale + banner wyniku

> **Status:** **→ SILNIK: GOTOWE** (moduły UI dostarczone 2026-06-30)  
> **Zależność:** batch F-D-V11 (evaluateProposal w applyAudienceAction)

---

## Moduły lane UI ✅

| Plik | Rola |
|------|------|
| `gra/src/ui/diplomacyNegotiationModal.ts` | Formularze NAP/sojusz/handel/trybut/… · `showNegotiationModal` |
| `gra/src/ui/diplomacyProposalBanner.ts` | ✅/❌ po `evaluateProposal` |
| `gra/src/ui/diplomacyAudience.ts` | Routing: karta → modal → `onAction(id, payload?)` |

Eksport pomocniczy: `proposalActionIdFromPayload(payload)` — mapuje UI actionId → CYW.

---

## Wpięcie w main.ts (SILNIK)

### 1. Import

```typescript
import {
  showDiplomacyProposalBanner,
  type NegotiationPayload,
} from './ui/diplomacyAudience';
import { proposalActionIdFromPayload } from './ui/diplomacyNegotiationModal';
import {
  evaluateProposal, applyAcceptedProposal, type ProposalEvalContext,
} from './game/diplomacy-proposals';
import { addTreaty, removeTreatiesById } from './game/diplomacy-treaties';
```

### 2. Rozszerz `showDiplomacyAudience` config

```typescript
getNegotiationContext: (actionId) => ({
  civName: ownerDiploLabel(ownerId),
  rivalOptions: getKnownRivalsFor(ownerId),      // wrogowie AI w stanie wojny z partnerem
  techOptions: getSellableTechForPlayer(),       // tech gracza do sprzedaży
  borderFeeCivil: 20,
  borderFeeMilitary: 40,
}),
onAction: (oid, actionId, payload?) => applyAudienceAction(oid, actionId, payload),
```

### 3. `applyAudienceAction(ownerId, actionId, payload?)`

- Bez payload → dotychczasowa logika (1, 10, 11, 5 uproszczony).
- Z payload → zbuduj `DiplomaticProposal`, wołaj `evaluateProposal`, pokaż `showDiplomacyProposalBanner`.
- Jeśli accepted + deal → `activeDeals = applyAcceptedProposal(activeDeals, result)`.
- Jeśli one-shot → `applyOneShotGoldTransfer` (EKO) + `applyDiplomaticEvent('handel')`.

Mapowanie actionId:

```typescript
const cywAction = payload ? proposalActionIdFromPayload(payload) : actionId;
```

### 4. Odblokuj karty v1.1 w `buildAudienceActions`

Usuń blok:

```typescript
} else if (!isSimplified && ['3', '4', '6', '7', '8', '9', '12'].includes(id)) {
  enabled = false;
  tooltip = 'Dostępne w kolejnej wersji';
```

Zastąp warunkami relacji (np. sojusz: zaufanie ≥ 60, NAP ≥ 40).

### 5. Propozycje AI (pending)

Istniejący `showDiplomacyPendingModal` + `aiCommandToPendingProposal` z CYW — po endTurn AI.

---

## DoD SILNIK

- [ ] Klik karty 2–9,12 → modal → banner wyniku
- [ ] Akceptacja tworzy `ActiveDeal` / one-shot gold
- [ ] Karty warunkowo enabled (nie szare „v1.1”)
- [ ] Zero regresji audiencji v1.0 (wojna modal, kontakt, pokój)

**NIE ruszaj:** plików `ui/diplomacyNegotiationModal.ts`, `diplomacyProposalBanner.ts` (UI lane)
