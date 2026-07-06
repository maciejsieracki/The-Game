# CYWILIZACJE → UI: v1.1 audiencja — karty + modale negocjacji

> **Status:** **→ SILNIK: GOTOWE** (UI moduły dostarczone 2026-06-30)  
> **Bazuje na:** `diplomacyAudience.ts`

---

## Co UI ma zrobić

### 1. Rozszerzyć flow kliknięcia karty

Dziś: `onAction(ownerId, actionId)` → SILNIK od razu wykonuje.

**v1.1:** dla akcji z `needsNegotiation: true` → **modal negocjacji** → dopiero `onAction(ownerId, actionId, payload)`.

| actionId | Modal |
|----------|--------|
| 2 NAP | Slider **10–20 tur** + Podgląd kar za złamanie |
| 5 Handel | T3A: jednorazowo — dropdown surowiec + ilość · T3B: X ¤/turę × N tur |
| 8 Trybut | **Żądaj** / **Zaproponuj** · kwota ¤/turę · czas (N tur / bezterminowy wasal) |
| 7 Namów | Lista **znanych wrogów** drugiej strony (callback `getRivalOptions`) |
| 3 Sojusz | Tekst warunków (T2A/B) + Tak/Nie od AI (propozycja AI w osobnym bannerze) |
| 4 Granice | Checkbox: cywilne / wojskowe · opłata jednorazowa (readonly z JSON) |
| 6 Tech | Lista tech **do sprzedania** (readonly z SILNIK) · cena sugerowana |
| 9 Ultimatum | Preset warunków (wycofaj wojska / X ¤) — v1.1 **1 preset** |
| 12 Wasal | Podgląd trybutu + akceptacja |

Wojna (11), pokój (10), kontakt (1) — **bez zmian** (modal wojny już jest).

### 2. Nowy komponent

`diplomacyNegotiationModal.ts` — DECOUPLED, styl jak `showWarConfirmModal`.

```typescript
export interface NegotiationPayload {
  actionId: string;
  /** pola zależne od akcji */
  turns?: number;
  goldPerTurn?: number;
  goldOnce?: number;
  resource?: string;
  amount?: number;
  targetOwnerId?: number;
  borderMilitary?: boolean;
  techId?: string;
}

export function showNegotiationModal(
  action: AudienceAction,
  ctx: { civName: string; aiCounterOffer?: string },
  onSubmit: (payload: NegotiationPayload) => void,
  onCancel: () => void,
): void;
```

### 3. Odpowiedź AI (v1.1)

Po Submit → SILNIK woła CYW `evaluateProposal` → UI pokazuje **banner**:

- ✅ „Przyjęto” / ❌ „Odrzucono: …” (tekst z CYW)

### 4. Wizual — siatka kart (bez zmian layoutu)

- Aktywne karty: pełny kolor (jak dziś).
- Locked v1.0: szare + „Dostępne w kolejnej wersji” → **po v1.1** zamienić na locked **warunkowe** (np. „Zaufanie < 60”).

---

## DoD

- [x] Modale dla akcji 2–9,12 (T4B)
- [x] Zero importów `game/*`
- [x] `→ SILNIK: GOTOWE` — `UI-do-SILNIK_v1.1-diplomacy-negocjacje.md`

**NIE ruszaj:** `main.ts`
