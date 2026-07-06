# CYWILIZACJE → UI (+ SILNIK): panel relacji w audiencji v2

> **Status:** ✅ **DECYZJA Macieja BBBB** (2026-06-26) — deleguj UI + SILNIK  
> **Tuning:** `docs/decyzje/D3-moc-respekt-tuning-scenariusze.md`  
> **Bloker Power:** **ZDJĘTY** (2026-06-26)  
> **NIE ruszaj:** `main.ts` (UI lane only)

---

## Co przekazujemy

Spec UX relacji per nacja po integracji **Mocy (Power P-A)** i modelu **Zaufanie + Respekt**.

Decyzja produktowa: `docs/decyzje/D3-UX-relacja-parametry-ABC.md`  
Rekomendacja CYW: **D3-UX-1=B, 2=B, 3=B, 4=B**

---

## Co UI ma zrobić

### 1. Rozszerzyć typ stanu audiencji

Plik: `gra/src/ui/diplomacyAudience.ts`

```typescript
export interface DiplomacyAudienceState {
  // … istniejące pola …
  /** Suma zaufanie + respekt (0–200). */
  relacjaTotal?: number;
  /** Obiektywna Moc gracza (P-A). */
  playerPower?: number;
  /** Obiektywna Moc rozmówcy. */
  otherPower?: number;
  /** Opcjonalnie: stosunek tekstowy „2:1" — SILNIK lub UI z power. */
  powerRatioLabel?: string;
  /** Aktywne traktaty do wyświetlenia (v1.1). */
  activeTreaties?: readonly { label: string; detail?: string }[];
  /** Tagi charakteru (D3-UX-3B) — bez liczb. */
  personalityTags?: readonly string[];
  /** Epoka rozmówcy (etykieta PL). */
  otherEpochLabel?: string;
  /** Progi na paskach (readonly z JSON). */
  thresholds?: { sojuszZaufanie?: number; techZaufanie?: number };
}
```

### 2. Layout audiencji (po akceptacji D3-UX-2B/C)

- Sekcja **relacji** pod portretami (zamiast jednej linii tekstu):
  - badge statusu (Wojna/Pokój/Sojusz)
  - **Relacja** (liczba) jeśli `relacjaTotal` dostarczone
  - **2 paski** (Zaufanie, Respekt) — CSS progress bar, monospace zachowany
  - linia **Moc** z `power-labels.ts` (`mocLabel()` / ⚜)
  - lista **Traktaty** (chipy lub `<ul>`)
  - tagi **charakteru** przy portrecie AI (D3-UX-3B)

### 3. Lista dyplomacji — wyrównanie do D3

Plik: `gra/src/ui/diploListHud.ts`

- Po **D3-UX-1A/B**: usunąć `Respekt X%` z `diploListEntryFromRelation` (obecny rozjazd z D3).
- **D3-UX-1B**: zostawić tylko `tierLabel` jako badge kolor (Wojna/Sojusz…).

### 4. Tooltip Respekt

Tekst PL (stały w UI):

> Respekt = jak duża jest wasza **Moc** w porównaniu z tą nacją. 50 = równi. Wyżej = jesteś silniejszy.

---

## Co SILNIK (integrator) ma dostarczyć w `getState()`

| Pole | Źródło |
|------|--------|
| `zaufanie`, `respekt`, `tier` | już jest |
| `relacjaTotal` | `zaufanie + respekt` |
| `playerPower`, `otherPower` | `objectivePowerForOwner(0)`, `objectivePowerForOwner(oid)` |
| `powerRatioLabel` | opcjonalnie: `"${Math.round(pSelf/pOther*10)/10}:1"` gdy pOther>0 |
| `activeTreaties` | `activeDeals` filtrowane po parze — etykiety z `RodzajTraktatu` |
| `personalityTags` | **CYW** `diplomacyPersonalityTags(civId)` → max 3 stringi |
| `otherEpochLabel` | istniejący `empireEpochForOwner` → label PL |
| `thresholds.sojuszZaufanie` | `loadDiplomacyParams().progSojusz` (nazwa z JSON) |

**Kontrakt CYW (nowy helper — lane CYW, plik `gra/src/game/diplomacy-display.ts`):**

```typescript
export function diplomacyPersonalityTags(civId: string): string[];
// czyta civ-matrix dip_* po eksporcie; fallback: perNacja z diplomacy.json
```

---

## Co CYWILIZACJE robi w swoim zakresie (bez main.ts)

- [x] Spec + ABC: `docs/decyzje/D3-UX-relacja-parametry-ABC.md` — **BBBB 2026-06-26**
- [x] `diplomacy-display.ts` (tagi z `dip_*`) — **GOTOWE** 2026-06-26 · handoff `CYWILIZACJE-do-SILNIK_diplomacy-display-v2.md`
- [ ] Po review macierzy: eksport `civ-matrix.json` z `Cyw-10-DYPLOMACJA`
- [ ] Dokumentacja formuły Respekt w `docs/decyzje/P-A-power-kanon.md` § UX (1 akapit) — opcjonalnie

---

## DoD

- [ ] Maciej: litery D3-UX-1…4 w karcie decyzji — **✅ BBBB 2026-06-26**
- [ ] Panel-B zsynchronizowany z `power-params.json`
- [ ] UI: paski + Moc + traktaty w audiencji (mockup zgodny z ASCII w decyzji)
- [ ] Lista dyplomacji zgodna z D3-UX-1 (bez rozjazdu)
- [ ] SILNIK: `getState()` wypełnia nowe pola
- [ ] Zero importów `game/*` w UI poza typami lite (jak dziś)

---

## Kolejność batchy integratora

1. **SILNIK-POWER** — kanon Mocy (bloker)
2. **UI-DYPLO-DISPLAY** — layout audiencji (ten handoff)
3. **SILNIK-D-V11** — traktaty w linii „Traktaty:"
4. **CYW-MATRIX-WIRE** — tagi charakteru z macierzy

**Flaga:** CZEKA / GOTOWE po decyzji ABC
