# CYWILIZACJE → INTEGRATOR (Grupa F): ekran zwycięstwa E-P0-06

> **Status:** **→ INTEGRATOR: GOTOWE** · **Warstwa:** 🟡 cross (main.ts + UI)  
> **Decyzja Macieja:** 10=A* — dominacja Power>50% (ostatnia epoka) + nauka (tech+rakieta)  
> **Data:** 2026-07-02 · **Lane:** D (logika) + E (UI shell)

---

## Co dostarczył lane D+E

| Plik | Opis |
|------|------|
| `gra/src/game/victory.ts` | Logika 10=A* (już w kanonie) — **bez zmian** |
| `gra/src/ui/victoryScreen.ts` | **NOWY** — pełnoekranowy ekran końca gry (E-15) |
| `gra/tools/victory-test.cjs` | 12/12 — logika |
| `gra/tools/victory-screen-test.cjs` | **NOWY** — formatowanie UI |

---

## F — wpięcie w `main.ts` (OBOWIĄZKOWE)

### 1. Import

```typescript
import {
  showVictoryScreen,
  buildVictoryScreenData,
} from './ui/victoryScreen';
import { powerShare } from './game/victory';
```

### 2. Usuń / zastąp `showGameOverOverlay`

Usuń lokalną funkcję `showGameOverOverlay` (~2737–2777) i wywołania.

### 3. W bloku VICTORY CHECK (~7672)

Zastąp:

```typescript
showHintMessage('<b>' + msg + '</b>', 4000);
showGameOverOverlay(msg, isVictory2);
```

Przez:

```typescript
const eraLabels = ['', 'Kamień', 'Brąz', 'Żelazo'];
const screenData = buildVictoryScreenData(vResult, {
  turn,
  powerShare: potegiWszystkich.length > 0
    ? powerShare(objectivePowerForOwner(0), potegiWszystkich)
    : undefined,
  eraLabel: eraLabels[player.era] ?? ('Epoka ' + player.era),
  civLabel: player.civType, // lub etykieta PL z civs.json
});
showVictoryScreen(screenData, () => location.reload());
if (isVictory2) {
  showHintMessage('<b>' + formatVictoryTitle(vResult.rodzaj, turn) + '</b>', 4000);
}
```

*(opcjonalnie import `formatVictoryTitle` z `./ui/victoryScreen` zamiast ręcznego `msg`)*

### 4. Legacy ID

`victoryScreen.ts` usuwa `#__gameover_overlay__` przy show — po wpięciu baseline E-15 zaktualizować na `#__victory_screen__`.

---

## AC (Definition of Done — Integrator)

- [ ] `main.ts` używa `showVictoryScreen` — brak inline `showGameOverOverlay`
- [ ] Dominacja → tytuł złoty + stat Power % + opis progu 50%
- [ ] Nauka → tytuł złoty + opis rakiety
- [ ] Przegrana → tytuł czerwony + CTA „Nowa gra" (reload)
- [ ] `node tools/victory-test.cjs` — **12/12**
- [ ] `node tools/victory-screen-test.cjs` — **PASS**
- [ ] `npx tsc --noEmit` + smoke OK
- [ ] Bramka wizualna: overlay E-15 (złoto/czerwień)

---

## Co sprawdzić po wpięciu (playtest Master)

1. Wygrana dominacją w epoce Żelazo przy Power >50% — statystyki Power na ekranie
2. Wygrana naukowa (gdy `rakietaWystrzelona=true`) — komunikat rakiety
3. Przegrana (zero miast + zero osadników) — wariant czerwony
4. Przycisk „Nowa gra" → reload

---

## NIE w scope tego batchu

- Rankingi cywilizacji (backlog E2)
- Ścieżka produkcji rakietowej w mieście (Grupa B)
- Aktualizacja `baseline-screenshots-E.cjs` (opcjonalnie po wpięciu)

**Flaga:** **GOTOWE** (moduł lane) · czeka F
