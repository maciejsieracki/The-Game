# CYWILIZACJE → UI: dyplomacja — lista + audiencja (D3 korekta)

**Status:** **GOTOWE DO STARTU** — D3-Q1…Q4 zamknięte (2026-06-27)  
**Decyzja kierunkowa Macieja:** 2026-06-27 (audiencja TW/Civ)  
**Supersedes:** bezpośrednie akcje w `diplomacyPanel.ts` (wojna/handel na liście)

Spec: `docs/decyzje/D3-audiencja-dyplomacja.md`

---

## Co Odbiorca ma zrobić

### 1. `diplomacyPanel.ts` — lista (ekran 1)

- Wiersz: **tylko nazwa** + jeden przycisk:
  - `contactEstablished === false` → **„Nawiąż kontakt"**
  - `contactEstablished === true` → **„Porozmawiaj"**
- **Usunąć** z listy: tier badge, Klaster, Zaufanie/Respekt, Akcje:, Wypowiedz wojnę, Handel.
- Callback: `onOpenAudience(ownerId)` → otwiera audiencję.

### 2. **NOWY** `diplomacyAudience.ts` — ekran 2

- Layout: lewo gracz, prawo AI (placeholder portrety / tytuły).
- Pasek relacji (Zaufanie, Respekt, status) — **tylko tutaj**.
- Siatka akcji wg **D3-Q4** (2026-06-27):
  - **Główni rywale:** 12 kart z `diplomacy.json`; locked = wyszarzone + tooltip.
  - **Poboczni / DrobnaCywilizacja:** tylko 5 kart (kontakt, pokój, wojna, handel, NAP).
- Wojna: modal D3-Q1=A.
- DECOUPLED: dane + callbacki z SILNIK, zero importów `game/*`.

### 3. Config (SILNIK wstrzykuje)

```typescript
interface DiplomacyAudienceConfig {
  getAudienceState: (ownerId: number) => {
    playerTitle: string;
    playerCivName: string;
    otherTitle: string;
    otherCivName: string;
    zaufanie: number;
    respekt: number;
    tier: number;
    layer: 'simplified' | 'full';
    contactEstablished: boolean;
    availableActions: readonly string[]; // id z diplomacy.json
  } | null;
  onAction: (ownerId: number, actionId: string) => void;
  onEstablishContact?: (ownerId: number) => void;
}
```

---

## DoD

- [ ] Lista nie pokazuje nacji poza `getRelations()` SILNIK (filtrowane)
- [ ] Brak akcji wojna/handel na liście
- [ ] Audiencja otwiera się z listy
- [ ] Modal wojny tylko z audiencji
- [ ] `diplomacy-test.cjs` bez regresji (lane testy mock)

*NIE ruszaj main.ts.*
