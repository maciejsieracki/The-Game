# CYWILIZACJE → MASTER (SILNIK): wpięcie gameplay cudów — batch CUDA-G1

> **Status:** **WPiĘTE** (MASTER batch CUDA-G1 · ROBOCZA) · **CZEKA:** Opus przed KANON  
> **Data:** 2026-07-03  
> **Zależność:** kanon `DB1F508B…` (epoka-wejscia-cuda)

---

## Co przesyłam

| Plik | Rola |
|------|------|
| `gra/src/game/wonder-availability.ts` | **NOWY** — bramka budowy (era, tech, E/R, maxNaSwiecie) |
| `gra/tools/wonder-availability-test.cjs` | **7 testów** — ZIELONE |
| `gra/src/game/wonders-data.ts` | istniejący — `getWondersForCiv`, `getWonderById` |
| `gra/src/game/wonder-civ-tech.ts` | reguła tech ≥ epokaWejscia państwa (**tylko E**) |

**Reguła D-CUD-TECH:** `tech_before_civ_entry` dotyczy wyłącznie cudów **E**. Cuda **R** (Wyrocznia, Ha'amonga, Brama narodów) — każde państwo z tech + epoką może startować wyścig, bez blokady epoki wejścia państwa.

### API (kontrakt dla SILNIK)

```typescript
import { evaluateWonderBuildGate, listBuildableWondersForCiv } from './game/wonder-availability';
import { getWondersForCiv } from './game/wonders-data';

// Przykład:
const gate = evaluateWonderBuildGate({
  wonder,
  civType: player.civType,
  civRow,                    // z civs.json
  playerEra: player.era,
  unlockedTechs: player.zbadane,
  completedWonderIds: [...], // globalnie ukończone cuda
  techMap,                   // buildTechEpochMap(technologie)
});
// gate.ok · gate.reasons · gate.missingTech
```

---

## Co MASTER ma zrobić (1 batch `main.ts`)

1. **Stan gry:** `completedWorldWonders: string[]` (save/load później).
2. **Panel budowy / mapa:** lista `listBuildableWondersForCiv(...)` zamiast pustego placeholdera.
3. **Start budowy:** tylko gdy `evaluateWonderBuildGate(...).ok` (D-CUD4: start = tech odkryte).
4. **Po ukończeniu:** push `wonder.id` do `completedWonderIds` (R: pierwszy wygrywa).
5. **E:** inne państwa nie widzą cudu E w panelu (`dostep === 'E'` + nie na liście).

**NIE w scope tego batcha:** bonusy cudu, utrzymanie, absolut/wygasanie (osobny CUDA-G2).

---

## DoD

- [x] `node tools/wonder-availability-test.cjs` — 7/7
- [x] `main.ts`: `completedWorldWonders`, picker toolbar (Cuda), kolejka produkcji, ukończenie
- [ ] W grze: Grecy ep.3 + Inżynieria → Kolos na liście; ep.1 → brak (playtest Maciej)
- [ ] Wyrocznia R: widoczna po Mistycyzm; po zbudowaniu — znika z listy
- [x] build + smoke + logic bramka
- [ ] Opus review przed kanonem

---

## Lane UI (opcjonalnie równolegle, bez `main.ts`)

- Wiersz cudu w panelu produkcji / build mode HUD — tylko jeśli MASTER deleguje do UI lane z kontraktem powyżej.
