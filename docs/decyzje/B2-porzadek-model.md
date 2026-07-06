# B2 — Porządek: model procentowy (Szczęście + Prawo)

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | **3 — wdrożyć ustalony Spec** (2026-06-27) |
| **Status** | **ZAMKNIĘTE** — nie zmieniamy formuły; implementacja EKONOMIA + UI |
| **Powiązane** | `B2-model-szczescie-procent.md` (1C, 2A), `B2-porzadek-progi-efektow.md`, `order.ts` |

---

## Ustalenie Macieja (nie pytamy ponownie)

1. **Porządek = Szczęście + Prawo** — model z Spec / `order.ts` **zostaje**.
2. Oba składniki liczymy **procentowo** (max vs osiągnięte), z **pełną rozpiską +/-** w panelu.
3. W Porządku widać **udział procentowy** Szczęścia i Prawa oraz **końcowy % Porządku**.
4. **Efekty gameplay** (kary, bunt, bonusy) wynikają z **% Porządku**, nie z osobnych liczników ludzi.
5. Liczby progów — **założenia startowe** do balansu w Excel/playtest (nie świętość).

---

## Trzy warstwy w panelu miasta

```
┌─ SZCZĘŚCIE ─────────────────── 72% ─┐
│  + Świątynia, Wealth, …              │
│  − Wojna, podatki, zagęszczenie…     │
│  Netto / SzMax → SzPct               │
├─ PRAWO ──────────────────────── 60% ─┤
│  + Ratusz, garnizon, Pretorium…      │
│  − (kary jeśli są w Spec)            │
│  Netto / PrawMax → PrawPct           │
├─ PORZĄDEK ───────────────────── 66% ─┤
│  = 50% × SzPct + 50% × PrawPct       │
│  (wagi z JSON)                       │
│  → tier + kary/bonusy                │
└──────────────────────────────────────┘
```

Emotikony 😊/😐/😠 — **wizualizacja z SzPct** (1C), nie licznik głów.

---

## Wzory (silnik)

### Szczęście (1C + 2A — zamknięte)

```
SzMax   = szmax_baza(epoka_miasta)          // JSON: szmax_kamien, szmax_braz, …
SzNetto = Σ plusy_sz − Σ minusy_sz         // pełna lista Spec — 2A
SzPct   = clamp(0, 120, 100 × SzNetto / SzMax)
```

Patrz: `B2-model-szczescie-procent.md` — tabela składników.

### Prawo (nowe — wdrożenie v1.0)

```
PrawMax   = prawo_max_baza(epoka_miasta)    // JSON — do dopisania (propozycja: jak SzMax)
PrawNetto = Σ plusy_praw − Σ minusy_praw
PrawPct   = clamp(0, 120, 100 × PrawNetto / PrawMax)
```

#### Plusy Prawa (propozycja startowa — Excel)

| Źródło | Pts (normal) | Uwaga |
|--------|--------------|--------|
| **Ratusz** | +3 | administracja miasta |
| **Pretorium** | +2 | sądownictwo |
| **Garnizon** | **+20 pkt / jednostka** | max 5 jedn. → **PrawPct do 100%** (Maciej 2026-06-27) |
| **Posterunek** (ulepszenie?) | +1 | opcjonalnie v1.0 |
| **Sąd** (budynek) | +2 | jeśli w `buildings.json` |

#### Minusy Prawa (propozycja — opcjonalne v1.0)

| Źródło | Pts | Uwaga |
|--------|-----|--------|
| Brak garnizonu przy pop ≥ 6 | −2 | duże miasto bez wojska |
| Obca jednostka w mieście (tuż po podboju) | −3 | 1 tura lub do uspokojenia |

*Maciej może korygować w Excel — klucze `prawo_*` w `society-params.json`.*

### Porządek (łączenie — bez zmiany idei Spec)

Wagi z JSON (`porzadek_waga_szczescie`, `porzadek_waga_prawo`) — domyślnie **0,5 / 0,5**:

```
PorPct = waga_sz × SzPct + waga_praw × PrawPct
```

Przykład: SzPct=72%, PrawPct=60% → **PorPct = 66%**.

**Tier** (`unrest | neutral | order`) i mnożniki — z **PorPct**, mapowanie w `B2-porzadek-progi-efektow.md`.

Zgodność z `order.ts`: zamiast surowych punktów podajemy **znormalizowane** wartości:

```typescript
// Mostek do istniejącego evaluateOrder:
szczescie_in = SzPct / 100 * progT2   // skala jak dawniej
prawo_in     = PrawPct / 100 * progT2
// lub bezpośrednio tier z PorPct — preferowane v1.0
```

---

## UI — sekcja Porządek (B2-Q2=B)

Pełna sekcja lewa kolumna, zawsze widoczna:

1. **Pasek PorPct** + słowo tier (Spokój / Niepokój / Bunt)
2. Skład: „Szczęście 72% (50%) + Prawo 60% (50%) → **66%**”
3. Aktywne efekty: „Praca −15%, migracja 5%/turę”
4. Link/rozwinięcie → rozpiski Szczęście i Prawo (jak Zdrowie)

---

## Implementacja (lane)

| Lane | Zadanie |
|------|---------|
| EKONOMIA | `computeLawBreakdown()`, `computeOrderFromPercents()` |
| EKONOMIA | klucze `prawo_*`, `prawo_max_*` w JSON |
| UI | sekcje Szczęście + Prawo + Porządek w `cityPanel.ts` / `orderPanel.ts` |
| SILNIK | `getOrderState` zwraca breakdown %; `orderMultByCity` z tier z PorPct |
| Excel | zakładki Szczęście + **Prawo** + **Porządek-progi** |

Handoff: `dyspozycje/_handoff/EKONOMIA-do-UI_porzadek-procent.md`

---

## Historia

| Data | Zdarzenie |
|------|-----------|
| 2026-06-27 | Maciej: **3** — Porządek = Sz% + Praw%; oba procentowo; wdrożyć Spec |
| 2026-06-27 | Agent: wzory + składniki Prawa (draft) + progi PorPct |
