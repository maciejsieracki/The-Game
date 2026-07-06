# HANDOFF: EKONOMIA → UI — żywność hybrydowa (HUD mapy + panel miasta)

**Data:** 2026-06-26 · **Od:** EKONOMIA · **Do:** UI (+ MASTER wpiecie getterów) · **Status:** SPEC — czeka implementacja · **Decyzja:** Maciej Q1 HUD mapa

**Źródło:** `_handoff/MACIEJ-do-EKONOMIA_zywnosc-hybrid.md` · `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` §Pytanie 1.

---

## Co przesyłam

Kontrakt pól UI dla **dwóch warstw żywności**:

| Warstwa | Gdzie w UI | Co pokazujemy |
|---------|------------|---------------|
| **Miasto** | Panel miasta (istniejący) | Magazyn lokalny, netto/turę, wzrost — **bez zmiany intencji** |
| **Imperium** | **HUD mapy świata** | Zapasy państwa (wojsko) + alert głodu |
| **Suwak splitu** | Panel miasta (sekcja imperium / żywność) | % rozwój miast vs % zapasy państwa |

---

## API do odczytu (MASTER wpina gettery w `main.ts` → UI)

```typescript
import {
  getEmpireFoodReserve,
  isArmyStarving,
  getLastEmpireFoodTick,
  type EmpireFoodTick,
} from '../game/empire-food';

// HUD mapy (ownerId = gracz ludzki, zazwyczaj 0):
const zapasyPanstwa = getEmpireFoodReserve(playerOwnerId);
const glod          = isArmyStarving(playerOwnerId);
const tick          = getLastEmpireFoodTick(playerOwnerId);  // opcjonalnie: stawki +X
```

---

## Rozszerzenie `HudState` (`gra/src/ui/hud.ts`)

**Nowe pola (propozycja — UI lane dodaje do interfejsu + render):**

```typescript
export interface HudState {
  // ... istniejące zloto, praca, nauka, ...

  /** Zapasy państwa na wojsko (skalar, bez limitu góry v1.0). */
  zapasyPanstwa: number;
  /** Przyrost netto zapasów państwa w ostatniej turze (+ wpływ − koszt armii). */
  zapasyPanstwaRate?: number;
  /** true → czerwony alert „Głód wojska”. */
  glodWojska: boolean;
}
```

### Render HUD mapy (minimum Macieja)

1. **Nowy wiersz zasobu** w grupie HUD (np. obok Kultury / Osiedli):
   - Ikona: 🌾 lub 🛡️🌾 (spójnie z panelem miasta 🍞)
   - Etykieta: `ZAPASY` lub `ŻYWNOŚĆ WOJSKA`
   - Wartość: `Math.floor(zapasyPanstwa)` — **bez** `/limit` (brak capu v1.0)
   - Rate (opcjonalnie): `+N/t` zielony / `-N/t` pomarańczowy z `zapasyPanstwaRate`

2. **Alert głodu** gdy `glodWojska === true`:
   - Klasa CSS `.red` na wartości **lub** badge `GŁÓD WOJSKA` obok paska
   - Hint po `onEndTurn` (SILNIK): „Armia głoduje: −8% HP/turę” — tekst stały, param z `glod_wojska_hp_frac`

3. **Stan ujemny:** wyświetlaj liczbę ujemną (np. `-3`) — gracz widzi deficyt; **nie** clampuj do 0 w UI.

**Mockup referencyjny:** `UI/Gra-podglad-HUD.html` — dodać analogiczny `.res` (lane UI).

---

## Panel miasta (`cityPanel.ts`)

### Istniejące (bez psucia)

Sekcja **Żywność** miasta (`view.zywnoscNetto`, `view.magazyn`, ETA wzrostu) — dotyczy **warstwy lokalnej** po splitcie „rozwój”. EKONOMIA dostosuje netto miasta (bez kosztu wojska w `cityYieldPerTurn`).

### Nowe — suwak splitu imperium

**Decyzja spec:** suwak **globalny per gracz** (`ownerId`), nie per miasto — jak polityka imperium (analogia: suwak Handlu per miasto już jest 1A, ale żywność wojskowa = całe imperium).

| Pole UI | Typ | Default | Zapis |
|---------|-----|---------|-------|
| `% → rozwój miast` | slider 0–100 | **70** | `EmpireFoodState.procentRozwoj` |
| `% → zapasy państwa` | slider 0–100 (powiązany) | **30** | `100 − procentRozwoj` |

**Etykiety (PL):**

- „Rozwój miast” — żywność idzie do magazynów / wzrostu (istniejący model).
- „Zapasy państwa” — żywność karmi armię (pula globalna).

**UX:** jeden suwak dwustronny lub dwa zsynchronizowane (suma = 100). Zapis przez callback `onEmpireFoodSplitChange(procentRozwoj: number)` → MASTER mutuje stan EKONOMIA.

**Umiejscowienie:** sekcja na dole panelu miasta lub zakładka „Imperium” — decyzja UI; minimum = widoczny suwak gdy panel miasta otwarty (Maciej: „w panelu miasta **oraz** na mapie”).

### Pola tylko do odczytu w panelu miasta (opcjonalnie v1.0)

- `Zapasy państwa: {zapasyPanstwa}` — duplikat skrótu z HUD (OK dla gracza w mieście).
- `Koszt armii: −{kosztArmii}/t` z `EmpireFoodTick` (edukacyjne).

---

## Bilans tury (`sidePanelHud` / panel po lewej)

Jeśli Maciej wybierze w Q2 panel bilansu — dodać wiersz:

| Klucz | Etykieta | Wartość |
|-------|----------|---------|
| `zywnoscPanstwo` | Żywność wojska | `+doPanstwa − kosztArmii` netto |

Źródło: `EmpireFoodTick.doPanstwa`, `.kosztArmii` — **nie** mylić z `bal.zywnosc` miasta (już w mocku HUD).

---

## Typy stanu (EKONOMIA — UI tylko czyta)

```typescript
/** Globalny suwak splitu żywności imperium (per owner). */
export interface EmpireFoodState {
  zapasyPanstwa:  number;   // persist save/load
  procentRozwoj:  number;   // 0..100; default z econ-params
}

export interface EmpireFoodTick {
  doPanstwa:   number;
  kosztArmii:  number;
  zapasyPo:    number;
  glodWojska:  boolean;
}
```

---

## Persist / save

- `EmpireFoodState` per `ownerId` — MASTER serializuje obok `PlayerState` / AI rivals.
- UI **nie** trzyma własnego stanu — tylko gettery co klatkę lub po turze.

---

## DoD (UI)

- [ ] `HudState` + render: `zapasyPanstwa`, opcjonalnie rate, `glodWojska` alert.
- [ ] Panel miasta: suwak splitu 70/30 default, callback do silnika.
- [ ] Brak regresji istniejącej sekcji żywności **miasta**.
- [ ] Mock `UI/Gra-podglad-HUD.html` zaktualizowany (opcjonalnie, nie kanon).

---

## Zależności

| Bloker | Kto |
|--------|-----|
| `advanceEmpireFood` + stan | EKONOMIA → MASTER |
| Atrycja HP | UNITS (`EKONOMIA-do-UNITS_glod-8hp.md`) |
| Gettery w `main.ts` | MASTER |

**Status handoff:** SPEC **GOTOWE** — implementacja UI po wpieciu getterów.
