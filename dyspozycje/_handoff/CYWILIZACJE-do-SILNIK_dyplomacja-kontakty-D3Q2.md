# CYWILIZACJE → SILNIK: kontakty formalne + filtr listy (D3-Q2)

**Status:** **GOTOWE DO STARTU** — D3-Q2=A, D3-Q3=A zapisane  
**BLOK:** SILNIK-D-P0-1 (stary panel z akcjami) — **nie wdrażać**

Spec: `docs/decyzje/D3-audiencja-dyplomacja.md`

---

## Problem (playtest Macieja)

- Lista pokazuje wiele wpisów tego samego typu (Inkowie×N, Zulusi×N).
- Akcje wojna/handel na liście — UX odrzucony.
- Filtr `computeDiplomaticContacts` (odkryty heks) ≠ oczekiwane „spotkaliśmy się dyplomatycznie".

---

## Co SILNIK ma zrobić (po decyzji ABC)

### Stan gry

```typescript
/** ownerId AI z formalnym kontaktem dyplomatycznym (audiencja odblokowana). */
const diplomaticContactEstablished = new Set<number>();

/** ownerId widoczny na liście — zależy od D3-Q2 (A/B/C). */
function getDiplomacyListEntries(): DiploListEntry[] { ... }
```

| D3-Q2 | Reguła widoczności |
|-------|-------------------|
| A | `computeDiplomaticContacts` ∩ lista; przycisk Nawiąż vs Porozmawiaj |
| B | tylko `diplomaticContactEstablished` |
| C | po odkryciu heksu wpis „nieznana" → po kontakcie pełna nazwa |

### Etykiety (D3-Q3)

- Preferencja Macieja (screen): **nazwa miasta** (Ostia), nie typ cyw.
- `ownerDiploLabel` → zawsze `ownerDisplayName` (miasto klastra); fallback dopiero gdy brak.

### `buildDiplomacyPanelConfig` → nowy kontrakt

- `getRelations`: wpisy **minimalne** (ownerId, civ, contactEstablished, hasMetInFog)
- `onOpenAudience` / `onEstablishContact` zamiast onDeclareWar na liście
- Akcje wojna/pokój → **tylko** z callbacku audiencji UI

### Auto-kontakt (opcjonalnie)

Przy pierwszym spotkaniu jednostek w zasięgu wzroku: `diplomaticContactEstablished.add(oid)` + hint — jeśli D3-Q2=A lub C.

---

## DoD

- [ ] Zero wpisów dla nacji niespotkanych (wg D3-Q2)
- [ ] Brak duplikatów „Inkowie" bez nazwy miasta (D3-Q3)
- [ ] save/load: `diplomaticContactEstablished` w zapisie
- [ ] Test: nowy case w `diplomacy-test.cjs` lub `logic-test`
