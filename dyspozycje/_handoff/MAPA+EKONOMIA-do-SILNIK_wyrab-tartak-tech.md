# MAPA + EKONOMIA + UI → SILNIK — Wyrąb / Tartak / tech gate

| Pole | Wartość |
|------|---------|
| **Status** | **→ SILNIK: GOTOWE — wykonaj TERAZ** |
| **Batch ID** | `F-B-WYRAB-TARTAK` |
| **Decyzja** | Maciej 2026-06-27 — `docs/decyzje/B1-wyrab-tartak-tech.md` |
| **Korekta 2026-06-27** | Tartak na **lesie** dozwolony — **nie** usuwa `nakladka Las` |
| **Priorytet** | P0 — **następny** po `F-B-PILNE` ✅ |

---

## Co dostarczył lane (NIE edytuj — tylko wpinaj)

| Plik | Rola |
|------|------|
| `gra/data/terrain-improvements.json` | wyrąb `typ:wycinka`, koszt 0; **tartak** nowy |
| `gra/src/game/improvement-tech.ts` | tech gate, clearing tick |
| `gra/src/map/improvement-build.ts` | tartak qualify, `action`, `researchedTechs` |
| `gra/src/ui/buildModeHud.ts` | szare 🔒 bez tech, FREE dla wyrąbu |
| `gra/src/render/improvements.ts` | model `tartak`, klucz w IMPROVEMENTS |
| `gra/src/game/terrain-improvements.ts` | tartak ≠ alias wyrab |

---

## 1. `refreshBuildApi` — przekaż zbadane tech

```typescript
import { freshClearingState, tickHexClearing, type HexClearingState } from './game/improvement-tech';

const hexClearingStates = new Map<string, HexClearingState>();

// w refreshBuildApi state:
researchedTechs: player.zbadane, // Set<string> z tech.json Technologia
```

---

## 2. `applyBuildRequest` — rozgałęzienie wycinka vs ulepszenie

**Było:** zawsze koszt Pracy + `placedImprovements` + mesh.

**Ma być:**

```typescript
function applyBuildRequest(req: ImprovementBuildRequest): void {
  const hex = map.hexes[req.hexKey];
  if (!hex) return;

  if (req.action === 'wycinka') {
    // WYRAZ — darmowy
    if (hex.nakladka !== Nakladka.Las) return;
    hex.nakladka = Nakladka.Brak;
    rebuildResourceOverlays(); // opcjonalnie: usuń overlay lasu na tym heksie
    hexClearingStates.set(req.hexKey, freshClearingState('wyrab', 0)!);
    // NIE: placedImprovements.set, NIE mesh wyrab permanent
    showHintMessage('Wyrąb: +20 Pracy/turę przez 3 tury (łącznie 60)', 3500);
    refreshBuildApi();
    refreshBuildHighlight();
    return;
  }

  // standard ulepszenie (tartak, farma, …)
  // TARTAK na lesie: NIE zmieniaj hex.nakladka — las zostaje.
  if (_lastPraca < req.kosztPraca) {
    showHintMessage('Za mało Pracy (potrzeba ' + req.kosztPraca + ')', 3000);
    return;
  }
  _lastPraca -= req.kosztPraca;
  placedImprovements.set(req.hexKey, req.key);
  // … reszta jak dziś (ulepszenie, mesh buildImprovement)
}
```

**Blokada tech przed kosztem:**
```typescript
if (!isImprovementTechUnlocked(req.key, player.zbadane)) {
  showHintMessage('Wymaga technologii', 2500);
  return;
}
```

---

## 3. Tick końca tury — bonus Pracy z wycinki

Po `advanceCityEconomy` / przed końcem tury gracza:

```typescript
for (const [hexKey, st] of hexClearingStates) {
  if (st.ownerId !== 0) continue;
  const { pracaGrant, expired } = tickHexClearing(st);
  if (pracaGrant > 0) {
    player.skarbiec += 0; // NIE złoto
    _lastPraca += pracaGrant; // lub dedykowana pula Pracy gracza — jak macie w HUD
    showHintMessage('Wyrąb: +' + pracaGrant + ' Pracy (pozostało ' + st.turnsLeft + ' tury)', 2000);
  }
  if (expired) hexClearingStates.delete(hexKey);
}
```

**Uwaga:** jeśli Praca jest tylko w `_lastPraca` per tura — dodaj do puli gracza zgodnie z istniejącym modelem skarbca Pracy.

---

## 4. Plony tartaku (tileYield — lane już w `terrain-improvements.ts`)

Po postawieniu tartaku heks w `placedImprovements` / `improvementKey: 'tartak'` → ekonomia czyta JSON:

| Pole | Wartość |
|------|---------|
| `bonus.praca` | **+3** / turę (produkcja miasta z obrabianego pola) |
| `bonus.drewno` | **brak** (v0.1 nie liczymy ilości surowców) |
| `surowiecOdblokowany` | **`drewno`** → panel Surowce pokazuje „Drewno” (dostęp dla budynków) |
| `koszt_praca` | 25 (ulepszenie płatne) |

**Wyrąb** — `bonus: {}`; jedyny efekt = `wycinka` (+20P×3) + usunięcie lasu. **Nie** odblokowuje drewna w v0.1 (wycinka ≠ tartak).

**Silnik — getResourceAccess:** przekaż `placedImprovements` jako 3. argument (osobny batch **F-B-TARTAK-DREWNO** — handoff `EKONOMIA-do-SILNIK_tartak-drewno-access.md`).

---

## 5. `IMPROVEMENT_CHIP` + `improvementKeyToUlepszenie`

Dodać:
```typescript
tartak: '🪚',
// wyrab nie potrzebuje chipa permanentnego (akcja jednorazowa)
```

`tartak` → `Ulepszenie.Brak` (jak inne bez enum) + `improvementKey: 'tartak'` na heksie dla `tileYield`.

---

## 6. Save/load (v1.1 opcjonalnie)

- `hexClearingStates` → meta save
- `hex.nakladka` już w mapie

---

## 7. DoD (test Macieja po ROBOCZA)

- [ ] Panel Budowa: **Wyrąb** = `FREE`, klikalny bez tech
- [ ] **Tartak** szary do momentu badania **Obróbka drewna**
- [ ] Wyrąb na lesie → las znika, +20 Pracy × 3 tury
- [ ] **Tartak** na lesie → las **zostaje**, widać tartak + drzewa
- [ ] **Tartak** na lądzie bez lasu (np. po wyrębie) → OK
- [ ] **Tartak** obrabiane pole → **+3 Pracy** / turę (bez bonus.drewno w tileYield)
- [ ] **Tartak** w zasięgu → panel Surowce: **Drewno** (dostęp, nie ilość)
- [ ] **Wyrąb** na lesie → las **znika**, bonus 60P temp (bez stałego bonusu plonów)
- [ ] Inne ulepszenia szare bez właściwej technologii

**Bramka:** smoke + `node tools/grupa-b-lane-test.cjs`

**Melduj:** `→ MASTER: GOTOWE-ROBOCZA F-B-WYRAB-TARTAK`

---

## Flaga

**→ SILNIK: GOTOWE**
