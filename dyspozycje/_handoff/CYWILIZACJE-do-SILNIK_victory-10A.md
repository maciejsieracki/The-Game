# CYWILIZACJE → SILNIK: zwycięstwo 10=A* (2026-06-28)

**Flaga:** **→ MASTER: GOTOWE-KANON** (2026-06-30, md5 `9665790E…`) *(stary — aktualny kanon: `4602e752…`)* · moduł lane · **WPIĘCIE main.ts** ✅

**Decyzja Macieja:** pyt. 10=A* — dominacja Power >50% (ostatnia epoka) + nauka (wszystkie tech + rakieta).

---

## Co dostarczył CYW

| Plik | Zmiana |
|------|--------|
| `gra/src/game/victory.ts` | Nowa logika 10=A* (zastąpiła eliminację typu) |
| `gra/tools/victory-test.cjs` | **12/12 PASS** |

---

## SILNIK — wpięcie w `main.ts` (~5196)

```typescript
import {
  checkVictory, techIdsInGameScope, allTechInScopeResearched,
  OSTATNIA_EPOKA_GRY_V1,
} from './game/victory';

// W bloku VICTORY CHECK:
const potegiWszystkich: number[] = [];
for (const oid of allOwners) {
  potegiWszystkich.push(computePotegaNacji(computePotegaComponents(oid)));
}
const scopeIds = techIdsInGameScope(data.tech, OSTATNIA_EPOKA_GRY_V1);
const vInput: VictoryInput = {
  players: vPlayers,
  cities,
  gracz: 0,
  liczbaOsadnikow: settlersCount,
  graczKiedysMialMiasto: playerEverOwnedCity,
  potegaGracza: computePotegaNacji(computePotegaComponents(0)),
  potegiWszystkich,
  graczEra: player.era,
  ostatniaEpoka: OSTATNIA_EPOKA_GRY_V1,
  wszystkieTechZbadane: allTechInScopeResearched(player.zbadane, scopeIds),
  rakietaWystrzelona: player.rakietaWystrzelona ?? false, // pole do dodania w PlayerState
};
```

**Rakieta:** v1.0 — dodaj flagę `rakietaWystrzelona` w stanie gracza; ustaw po ukończeniu projektu kosmicznego (tech + produkcja — doprecyzować z `tech.json` w kolejnym batchu).

**UI końca gry:** istniejący overlay `showGameOverOverlay` — komunikat dominacja/nauka już jest.

---

## DoD

- [x] `node tools/victory-test.cjs` — 12/12
- [x] build + smoke po wpięciu (2026-06-30)
- [ ] Playtest: dominacja w epoce Żelazo przy Power >50%
