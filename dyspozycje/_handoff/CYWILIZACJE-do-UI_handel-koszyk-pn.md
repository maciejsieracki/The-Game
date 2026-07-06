# CYWILIZACJE → UI: koszyk handlu / daru (punkty wartości)

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE (lane D)** — czeka implementacja UI |
| **Data** | 2026-06-30 |
| **Od** | Grupa D (CYWILIZACJE) |
| **Do** | Lane UI (`gra/src/ui/diplomacyAudience.ts`, ewent. `diplomacyNegotiationModal.ts`) |
| **Flaga** | **NIE ruszać `main.ts`** |

**Decyzje Macieja:** `docs/decyzje/D3-wymiana-OTWARTE-ABC.md` · `docs/decyzje/D3-dyplomacja.md`

---

## Co wdrożyć (UI)

### Ekran audiencji — dwie kolumny (wzorzec Civilization)

```
[ CO ODDAJĘ ]              [ CO DOSTAJĘ ]
  + dodaj pozycję            + dodaj pozycję
  lista + PN każdej          lista + PN każdej
  ─────────────────────────────────────────
  SUMA: XXX PN               SUMA: YYY PN
  Fair min (Rel R): ZZZ PN
  Nadmiar: NNN PN  →  +K Zauf. (max 5/turę)
  [ opcjonalnie ] Dobra wola: +1/turę × 3 (gdy nadmiar ≥ 100)
```

### Typy pozycji w koszyku (v1.0 — zamknięte decyzje)

| Typ | Etykieta gracza | Parametr |
|-----|-----------------|----------|
| `zloto` | Pieniądze (¤) | ilość |
| `praca` | Praca | ilość |
| `zywnosc` | Żywność (spichlerz) | miasto + ilość |
| `zloze` | Dostęp do złoża (1 pole) | id złoża |
| `tech` | Technologia | nazwa tech |
| `jednostka` | Jednostka | nazwa |
| `surowiec_boolean` | Dostęp do surowca | klucz ASCII |

**Wyłączone v1.0:** ulepszenia terenu, budynki miasta, hex terytorium/miasto, punkty nauki, kultura, przetworzone.

### Tryby

| Tryb | UI |
|------|-----|
| **Handel** | Dwie kolumny; wymaga **Relacji ≥ 100** |
| **Dar (prezent)** | Jedna kolumna „oddaję"; wymaga **Relacji ≥ 30** |

---

## API do podpięcia (tylko import, lane D dostarczył)

Plik: `gra/src/game/diplomacy-value-catalog.ts`

```typescript
import {
  diplomacySumPn,
  diplomacyFairGivePn,
  diplomacySurplusPn,
  diplomacyTradeTrustFromDeal,
  diplomacyGiftTrustFromPn,
  diplomacyDobraWolaFromSurplus,
  diplomacyProgDarRelacja,
  diplomacyZywnoscNaPn,
  diplomacyPnRelacjaParams,
} from '../game/diplomacy-value-catalog';
```

**Podgląd przed wysłaniem propozycji:**

```typescript
const givePn = diplomacySumPn(giveItems);
const receivePn = diplomacySumPn(receiveItems);
const fairMin = diplomacyFairGivePn(receivePn ?? 0, relacja);
const preview = diplomacyTradeTrustFromDeal(givePn, receivePn, relacja, trustGainedThisTurn);
const dobraWola = diplomacyDobraWolaFromSurplus(preview.surplusPn);
```

Wyświetl graczowi: `preview.deltaZaufanie`, `dobraWola` (jeśli active), komunikat gdy `givePn < fairMin` (W4-A ścisłe PN).

---

## DoD (kryteria akceptacji UI)

- [ ] Dwie kolumny w modalu / panelu negocjacji handlu
- [ ] Każda pozycja pokazuje **PN** obok etykiety
- [ ] Sumy PN + **minimalna fair** po kursie Relacji
- [ ] **Nadmiar** i przewidywane **+Zaufanie** (z limitem tur — stan z `getState`, patrz handoff Integrator)
- [ ] Osobny flow **dar** (jedna kolumna), aktywny od Rel ≥ 30
- [ ] Żywność: wybór miasta + ilość; podpowiedź **1 PN = 1 żywność**
- [ ] **NIE** edycja `main.ts` — callback `onProposeDeal(items)` przez istniejący kontrakt audiencji (Integrator doda handler)

---

## Zależności

- **Integrator** musi dostarczyć w `getState()`: `trustPnGainedThisTurn`, `relacja`, `tempoGry` — patrz `CYWILIZACJE-do-INTEGRATOR_wymiana-pn-zaufanie.md`
- Po UI → Integrator **1 batch** `main.ts`

---

## Testy UI (manual)

1. Rel 100: fair deal → nadmiar 0, brak +Zauf. z nadmiaru
2. Rel 100: dopłata 200 PN → +2 Zauf. (max sprawdzić z limitem tur)
3. Rel 50: dar dostępny, handel zablokowany
4. Nadmiar 150 PN → komunikat dobra wola 3 tury
