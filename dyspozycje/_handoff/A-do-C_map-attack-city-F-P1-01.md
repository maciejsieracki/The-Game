# GRUPA A → GRUPA C (+ F): F-P1-01 — atak wrogiego miasta klikiem z mapy

| Pole | Wartość |
|------|---------|
| **ID** | **F-P1-01** |
| **Status** | **→ MASTER: GOTOWE (spec)** · lane A 🟢 moduł + test |
| **Data** | 2026-07-02 |
| **Od** | Grupa A (mapa świata) |
| **Do** | **Grupa C** (preBattle / szturm / zdobycie) · **Grupa F** (wpięcie `main.ts`) |
| **Warstwa** | 🟡 cross — klik mapy + `cities[]` + `units[]` + UI C3/C1 |
| **Decyzje** | C3-Q1=A · C1-Q1 · C3-ST-1…3 · **bez nowego ABC** |

**Powiązane:** F-P1-02 (`deploy:false`) — **osobny** handoff po tym batchu · `docs/decyzje/C1-wejscie-walke.md` Q3 rewizja.

---

## 1. Problem (stan dziś)

| Objaw | Przyczyna |
|-------|-----------|
| ROADMAP: „klik wrogiego miasta otwiera panel jak własne" | **Stary kanon / niepełne wpięcie** — w `src` część gałęzi jest, ale **miasto bez muru** dostaje tylko hint zamiast preBattle/zdobycia |
| Gracz klika wroga **bez** zaznaczonej jednostki | Tylko hint — brak auto-wyboru przy **1** sąsiedniej jednostce |
| Grupa C **IDLE** na F-P1-01 | Brak kontraktu A→C co dokładnie wołać z mapy |

**Cel F-P1-01:** klik w **wrogie** miasto **nigdy** nie otwiera `cityPanel` gracza; zawsze prowadzi do właściwej ścieżki walki/oblężenia/zdobycia.

---

## 2. Stan kodu (audit 2026-07-02)

### Już istnieje (lane + kanon `de9b53e…`)

| Moduł | Rola |
|-------|------|
| `game/mapSiegeDetect.ts` | `classifyCityAttack`, `canInitiateSiege` |
| `game/siegeDefenders.ts` | `hasCityDefenders`, `canCaptureCityWithoutBattle` |
| `ui/cityAttackChoice.ts` | C3-Q1: Oblężaj / Szturm / Anuluj |
| `ui/siegeMapPanel.ts` | Panel oblężenia (C3-Q7=A boczny) |
| `ui/preBattle.ts` | C1 overlay |
| `ui/cityCaptureNotice.ts` | Puste miasto bez bitwy |
| `main.ts` ~5093–5140 | Częściowy handler kliku miasta |
| `main.ts` | `offerCityAttackChoice`, `launchSiegeStormFromMap`, `captureCityWithoutBattle`, `startMapSiege` |

### Luka (do domknięcia przez F + C)

1. **`ownerId !== 0` + brak `offerCityAttackChoice`** → zawsze hint (linia ~5113), **nawet gdy** `tryb !== 'oblezenie'` (miasto bez muru).
2. **Brak** `launchFieldBattleFromMap(city)` / `launchUnwalledCityAttack` dla `zdobycie_z_marszu` / `bitwa_polowa`.
3. **Brak** auto-atacującego przy dokładnie **1** sąsiedniej jednostce bez zaznaczenia.
4. **Brak** jednego routera — logika rozproszona; ryzyko regresji przy kolejnych batchach.

---

## 3. UX flow (kanon produktowy)

### 3.1 Drzewo decyzji — klik heksu z miastem wroga (`ownerId !== 0`)

```
Klik miasto wroga
├─ city.oblegane === true
│   └─ sąsiadujący oblegający → showSiegeMapPanel (sync meta)
├─ resolveEnemyCityClick() → patrz §4
│   ├─ attack_choice → showCityAttackChoice (C3-Q1)
│   │   ├─ Oblężaj → startMapSiege (BEZ preBattle)
│   │   ├─ Szturm → launchSiegeStormFromMap → preBattle → BattleScene
│   │   └─ Anuluj → zamknij modal, bez kosztu ruchu
│   ├─ field_battle → launchFieldBattleFromMap (NOWE w F, logika C)
│   │   └─ preBattle → BattleScene (mur=0, obrońcy na heksie/sąsiedztwie)
│   ├─ capture_empty → captureCityWithoutBattle + cityCaptureNotice
│   ├─ hint_no_adjacent → hint (NIE panel miasta)
│   └─ hint_pick_attacker → hint „Zaznacz jednostkę obok" (NIE panel)
└─ NIGDY openCityPanelForPlayer dla ownerId !== 0
```

### 3.2 Miasto **z murem** (C3)

- Wymaga jednostki gracza **dist=1**, `ruchLeft > 0`.
- **C3-Q1=A:** modal Oblężaj / Szturm / Anuluj — **już zaimplementowany** UI.
- Oblężenie **nie** woła preBattle do momentu Szturm.

### 3.3 Miasto **bez muru** (C1)

| Obrońcy (`hasCityDefenders`) | Flow |
|------------------------------|------|
| **Nie** | `captureCityWithoutBattle` — tabliczka, zero strat, wejście na heks |
| **Tak** | **Od razu** `showPreBattle` → Auto / Ręczna / Wycofaj (C1-Q1) — **bez** modalu C3 |

Referencja: `docs/decyzje/C1-wejscie-walke.md` (atak miasta bez muru = TAK preBattle).

### 3.4 Zaznaczenie jednostki

| Sąsiednie jednostki gracza (dist=1, ruch>0) | Zaznaczenie | Zachowanie |
|---------------------------------------------|-------------|------------|
| 0 | — | Hint: „Zaznacz jednostkę obok miasta…" |
| 1 | brak | **Auto** użyj tej jednostki (F-P1-01) |
| 1 | inna / ta sama | Jak wyżej |
| ≥2 | brak | Hint: „Zaznacz którą jednostką atakujesz" |
| ≥2 | wybrana sąsiednia | Użyj wybranej |

### 3.5 Wyjątki (bez zmian)

- Klik **własnego** miasta → `openCityPanelForPlayer` (panel B).
- Panel miasta otwarty → klik mapy = okolica / blokada (istniejąca logika).
- `isSiegeMapPanelOpen()` → klik miasta obleganego = sync panelu (istniejące ~5022).

---

## 4. Kontrakt lane A — `map-attack-city.ts` (🟢 GOTOWE)

**Plik:** `gra/src/map/map-attack-city.ts`  
**Test:** `node gra/tools/map-attack-city-test.cjs` — **8/8**

```typescript
import { resolveEnemyCityClick } from './map/map-attack-city';

// W handlerze kliku mapy (main.ts — tylko F):
const action = resolveEnemyCityClick({
  city: clickedCity,
  selectedUnit: sel ?? null,
  units,
  playerOwnerId: 0,
});
switch (action.kind) {
  case 'not_enemy': /* istniejąca gałąź własnego miasta */ break;
  case 'siege_panel': showSiegeMapPanel(...); break;
  case 'attack_choice': showCityAttackChoice(action.ctx, ...); break;
  case 'field_battle': launchFieldBattleFromMap(action); break; // C+F
  case 'capture_empty': captureCityWithoutBattle(...); break;
  case 'hint_no_adjacent':
  case 'hint_pick_attacker': showHintMessage(...); break;
}
```

---

## 5. Zakres Grupy C (implementacja lane)

### 5.1 Nowa funkcja (propozycja nazwy)

**`launchFieldBattleFromMap(ctx: MapSiegeContext): void`** — logika **mirror** `launchSiegeStormFromMap`, ale:

- `city.maMur === false`
- `collectBattleRoster` / `collectSiegeDefRoster` wg C1-Q4 (heks + sąsiedztwo 1)
- `PreBattleInfo.miejsce` = nazwa miasta (bez „mur")
- Po preBattle → `BattleScene` z **`deploy: true` (tymczasowo)** — docelowo F-P1-02 → `false`
- `canRetreat: true` (C1-Q5)
- Zwycięstwo → `applyCityCaptureAfterBattle` / istniejący post-battle map sync

### 5.2 Pliki C (szacunek)

| Plik | Zmiana |
|------|--------|
| `game/combat.ts` / helpers | ewent. wrapper rosteru pod miasto otwarte |
| `game/post-battle-map.ts` | reuse capture po bitwie polowej |
| Test | rozszerzyć `combat-test.cjs` lub nowy `map-city-attack-test.cjs` |

### 5.3 AC Grupy C

| # | Kryterium |
|---|-----------|
| C-AC1 | Miasto **bez muru** + obrońcy + adjacent unit → preBattle → bitwa → capture lub odparte |
| C-AC2 | Miasto **bez muru** + brak obrońców → capture bez preBattle (wywołane z F, logika `siegeDefenders`) |
| C-AC3 | Szturm z muru → bez regresji (playtest path C3) |
| C-AC4 | preBattle Wycofaj → ruch zachowany (C1-Q5) |
| C-AC5 | Testy lane zielone + handoff `C-do-INTEGRATOR_F-P1-01-field-battle.md` |

---

## 6. Zakres Grupy F (`main.ts` — wyłącznie F)

### 6.1 Hooki do wpięcia (spec — **nie edytować w A/C**)

| Miejsce | Akcja |
|---------|--------|
| Import | `resolveEnemyCityClick` z `./map/map-attack-city` |
| Handler kliku ~5093–5140 | Zastąpić gałąź `ownerId !== 0` wywołaniem routera §4 |
| Nowy callback | `launchFieldBattleFromMap` — import z modułu C po handoff C |
| `offerCityAttackChoice` | Może zostać; router zwraca `attack_choice` → to samo UI |
| Regresja | **Nie** wołać `openCityPanelForPlayer` gdy `action.kind !== 'not_enemy'` |

### 6.2 AC Integratora F

| # | Kryterium |
|---|-----------|
| F-AC1 | Klik wrogie miasto **nigdy** nie otwiera panelu miasta gracza |
| F-AC2 | Walled + adjacent → Oblężaj/Szturm modal |
| F-AC3 | Open + defenders → preBattle |
| F-AC4 | Open + empty → tabliczka capture |
| F-AC5 | 1 adjacent bez select → działa bez hintu |
| F-AC6 | `map-attack-city-test` + `map-siege-test` + combat suite PASS |
| F-AC7 | Bramka wizualna: mapa + atak miasta + powrót z bitwy |

### 6.3 Hint copy (PL)

| `kind` | Tekst |
|--------|-------|
| `hint_no_adjacent` | `{name} — miasto wrogie. Ustaw jednostkę na sąsiednim heksie i kliknij miasto.` |
| `hint_pick_attacker` | `{name} — kilka jednostek obok. Zaznacz którą atakujesz, potem kliknij miasto.` |

---

## 7. Kolejność wdrożenia

```
A (ten handoff) → C (launchFieldBattleFromMap + testy)
                → F (router w main.ts + bramka)
                → Master review → gra-robocza → kanon
```

**Grupa C może startować** po odczytaniu tego pliku — moduł `map-attack-city.ts` już w repo.

---

## 8. Blokery

| Dla | Bloker | Kto odblokowuje |
|-----|--------|-----------------|
| **C** | Brak `launchFieldBattleFromMap` spec §5 — **ten plik** | ✅ odblokowane |
| **C** | `deploy:false` (F-P1-02) — pozycje z mapy na polu bitwy | **A** osobny handoff po F-P1-01; C może zrobić v1 z `deploy:true` |
| **F** | Czeka handoff **C→F** z gotową funkcją + testami | Grupa C |
| **F** | Wszystkie edycje `main.ts` | Tylko F |
| **Master** | Batch 🟡 — wymaga bramki wizualnej oblężenia + nowy path open-city | Integrator |

---

## 9. Self-check Grupa A (2026-07-02)

| Test | Wynik |
|------|--------|
| `npx tsc --noEmit` (gra/) | do weryfikacji F przy wpięciu |
| `node tools/map-attack-city-test.cjs` | **8/8** |
| `node tools/map-siege-test.cjs` | **6/6** (bez regresji) |
| `main.ts` | **NIE ruszony** ✅ |

---

## 10. Poza zakresem F-P1-01

- F-P1-02 `deploy:false` na BattleScene
- AI auto-atak miasta (C3-Q2) — osobny lane D/C
- Zmiana balansu oblężenia / Panel-C
- Playtest Macieja — Master po kanonie

---

*Grupa A · F-P1-01 spec · blokuje C do implementacji §5 · F do wpięcia §6*
