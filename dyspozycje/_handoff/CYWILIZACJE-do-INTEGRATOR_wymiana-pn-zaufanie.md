# CYWILIZACJE → INTEGRATOR (Grupa F): wymiana PN → Zaufanie + wojna/złoże

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE (lane D)** — czeka wpięcie |
| **Data** | 2026-06-30 |
| **Od** | Grupa D (CYWILIZACJE) |
| **Do** | **Integrator F** — jedyny editor `main.ts` |
| **Flaga** | **1 batch** · backup `main.ts.bak-INTEGRATOR-2026-06-30` |

**Decyzje:** `docs/decyzje/D3-wymiana-OTWARTE-ABC.md` · kod lane D ✅ test 41/41

**UI równolegle:** `CYWILIZACJE-do-UI_handel-koszyk-pn.md` (bez main.ts)

---

## Co lane D dostarcza (już w repo)

| Plik | Zawartość |
|------|-----------|
| `gra/src/game/diplomacy-value-catalog.ts` | Katalog PN, nadmiar, limit/turę, dobra wola, żywność |
| `gra/data/diplomacy.json` | `wartosc_katalog`, `pn_relacja`, `pn_zywnosc`, `dostep_zloze_wojna` |
| `gra/tools/diplomacy-value-catalog-test.cjs` | 41/41 |

---

## Reguły produktowe (Maciej — zamknięte)

| ID | Reguła |
|----|--------|
| W1-A | Zaufanie z handlu **tylko z nadmiaru** — **bez** stałego +2 przy zawarciu |
| W2-C | Nadmiar ≥ 100 PN → flaga **dobra wola** +1 Zauf./turę × **3 tury** |
| W3-B | Czysty dar: **Relacja ≥ 30** |
| W4-A | Akceptacja AI: **ścisłe PN** (`givePn >= diplomacyFairGivePn(receive, rel)`) |
| W5-A | Tech w koszyku od **Rel ≥ 100** |
| W6b | **1 PN = 1 żywność** |
| W10-A+ | Dostęp złoża **trwały**; **wojna = utrata**; **po pokoju renegocjacja** |
| PN-ZAUF | **100 PN = +1 Zauf.**; **max +5/turę** łącznie handel+dary |

---

## INTEGRATOR — zadania w `main.ts` / silnik

### 1. Stan gry (per para cywilizacji)

Dodać do relacji / save:

```typescript
trustPnGainedThisTurn: number;      // reset na początku tury gracza
dobraWolaRemainingTur: number;      // 0 lub 1..3
// opcjonalnie: depositedAccess: Map<partnerId, ZlozeGrant[]>
```

Eksportować w `openDiplomacyAudience` → `getState()`:

- `trustPnGainedThisTurn`
- `relacjaTotal`
- `progDarRelacja` (30)

### 2. Zastąpić flat `dar_zaufanie: +6`

W `diplomacy.ts` case `'dar'` — **nie używać** stałego +6. Zamiast:

```typescript
import {
  diplomacyGiftTrustFromPn,
  diplomacyTradeTrustFromDeal,
  diplomacyDobraWolaFromSurplus,
  diplomacyClampTrustGainNaTure,
} from './diplomacy-value-catalog';

// po udanym handlu:
const { deltaZaufanie, surplusPn } = diplomacyTradeTrustFromDeal(
  givePn, receivePn, relacja, trustPnGainedThisTurn,
);
// apply deltaZaufanie; trustPnGainedThisTurn += deltaZaufanie
// dobraWola = diplomacyDobraWolaFromSurplus(surplusPn) → set flag 3 tury

// czysty dar:
const gift = diplomacyGiftTrustFromPn(givePn, trustPnGainedThisTurn);
```

**NIE** dodawać `handelZawarcie_zaufanie: +2` (W1-A).

### 3. AI akceptacja deala

Użyć `diplomacyFairGivePn` + porównanie ścisłe (W4-A). Opcjonalnie wyłączyć / nadpisać `progHandelFairRatioMin/Max` (0.8–1.2) na ścieżce PN.

### 4. Transfer zasobów po dealu

| Typ | Silnik |
|-----|--------|
| zloto, praca | istniejący transfer skarbca |
| zywnosc | odejmij/dodaj ze **spichlerza miasta** źródłowego |
| zloze | ustaw boolean dostęp + hex id w stanie imperium |
| tech, jednostka, surowiec | **batch 2** jeśli brak — wpięcie transferu per typ |
| ~~ulepszenie terenu~~ | **NIE** — D3-KAT-NO-IMP |
| ~~budynek miasta~~ | **NIE** — D3-KAT-NO-BLD |
| ~~hex terytorium~~ | **NIE v1.0** — D3-KAT-NO-HEX (W9) |

### 5. Wojna a dostęp złoża (W10-A+)

JSON: `wartosc_katalog.dostep_zloze_wojna`

- Przy **wypowiedzeniu wojny** / stanie `wojna`: **zawieś** granty złoża od/do partnera (nie kasuj definicji — tylko `active: false`)
- Przy **pokoju**: granty **nie wracają** — wymagana **nowa umowa handlowa**
- UI: komunikat „Dostęp do złoża wygasł — wojna"

Implementacja minimalna v1: tablica grantów `{ partnerId, zlozeId, hexKey, active }` + hook w `declareWar` / `makePeace`.

### 6. Dobra wola co turę

Na końcu tury gracza: jeśli `dobraWolaRemainingTur > 0` → +1 Zauf. u partnera, decrement (osobno od limitu 5/turę **nadmiaru** — dobra wola to efekt **wieloturowy**, nie liczy się do `trustPnGainedThisTurn` przy nadmiarze; **wyjaśnienie:** nadmiar limit 5 = jednorazowy skok z PN; dobra wola = bonus pasywny 3 tury).

---

## DoD Integrator

- [ ] `diplomacy-value-catalog-test.cjs` — 41/41 (bez regresji)
- [ ] `diplomacy-test.cjs`, `diplomacy-proposal-test.cjs` — zielone (dostosować test dar jeśli oczekiwał +6)
- [ ] `node tools/smoke.cjs` OK
- [ ] Build: `npx vite build --outDir $env:TEMP\civ-dist`
- [ ] **NIE** publikować kanonu bez review subagent

---

## Kolejność wpięcia

1. **UI** koszyk (mock callback)
2. **Integrator** handler deal + stan tur + wojna/złoże
3. Review → kanon

---

## Meldunek po wpięciu

Append `CYWILIZACJE-DO-MASTERA.md` + `DZIENNIK-MASTERA.md` · flaga **GOTOWE** w tym pliku.
