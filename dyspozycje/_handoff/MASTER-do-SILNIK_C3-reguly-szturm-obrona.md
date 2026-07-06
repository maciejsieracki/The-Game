# MASTER → SILNIK (INTEGRATOR) — C3 reguły szturmu, obrony, zdobycia

**Data:** 2026-06-30  
**Od:** MASTER (na prośbę Macieja — spisanie reguł z playtestu)  
**Do:** Integrator F — jedyny editor `main.ts` + kanon  
**Status:** **GOTOWE DO WPIĘCIA** (moduł + testy + docs)  
**Playtest Maciej:** ✅ obie gałęzie (z obrońcą i bez)

---

## Kanon decyzji

| Dokument | Zawartość |
|----------|-----------|
| **`docs/decyzje/C3-szturm-obrona.md`** | **GŁÓWNY** — ST-1 obrońcy, ST-2 zdobycie bez walki, ST-3 preBattle→C2 |
| `docs/decyzje/C3-obleczenie.md` | C3-Q1…Q10 (oblężenie, głód, AI, machiny) |
| `docs/decyzje/C1-wejscie-walke.md` | preBattle, skład, Wycofaj |

---

## Co wdrożyć / utrzymać w SILNIK

### 1. Moduł czysty (NOWY)

**`gra/src/game/siegeDefenders.ts`**

```ts
hasCityDefenders(city, units)     // C3-ST-1
canCaptureCityWithoutBattle(...)  // C3-ST-2
defenderUnitsNearCity(...)        // helper
```

**`main.ts`:** import + wrapper `cityHasDefenders(city)` → `hasCityDefenders(city, units)`.

### 2. Flow w main.ts (już wpięte — weryfikacja)

| Funkcja | Reguła |
|---------|--------|
| `cityAttackChoice` | C3-Q1=A: Oblężaj / Szturm / Anuluj |
| `launchSiegeStormFromMap` | ST-2 lub ST-3 via `cityHasDefenders` |
| `captureCityWithoutBattle` | ST-2: tabliczka, zero strat, wejście na heks |
| `collectSiegeDefRoster` | Milicja tylko gdy garnizon>0 (C3-Q6) |
| `executeSilentSiegeStorm` | AI: ten sam test obrońców |
| `isSiegeMapPanelOpen` | Blokada ruchu przy panelu |

### 3. UI (lane — bez zmian w SILNIK poza importami)

- `cityAttackChoice.ts` — etap 1
- `siegeMapPanel.ts` — etap 2
- `preBattle.ts` — ST-3
- `cityCaptureNotice.ts` — ST-2

---

## Testy (DoD)

| Suite | Oczekiwane |
|-------|------------|
| **`siege-defenders-test.cjs`** | **7/7** — C3-ST-1/ST-2 |
| `map-siege-test.cjs` | 6/6 |
| `oblezenie-test.cjs` | 27/27 |
| `siege-ai-test.cjs` | 17/17 |
| `logic-test` · `combat` · `smoke` · `battle-smoke` | OK |

---

## AC integracji

| # | Kryterium |
|---|-----------|
| R1 | Miasto z murem, **brak** jednostek dist≤1 i garnizon=0 → Szturm = tabliczka, **bez** preBattle |
| R2 | **Łucznik** dist≤1 → Szturm = preBattle → bitwa z murem |
| R3 | garnizon>0, brak jednostek → preBattle z **Milicją** |
| R4 | Oblężaj **nie** otwiera preBattle |
| R5 | Panel oblężenia → brak ruchu jednostek |
| R6 | `siege-defenders-test` w bramce publikacji |

---

## Publish

Po bramce: `Gra-podglad.html` = ROBOCZA = PLAYTEST-MAPA  
Backup: `main.ts.bak-SILNIK-oblezenie-c3-*`

**Czeka:** Opus review (procedura)

---

## Pliki tego batchu

| Plik | Akcja |
|------|-------|
| `gra/src/game/siegeDefenders.ts` | **NOWY** |
| `gra/tools/siege-defenders-test.cjs` | **NOWY** |
| `docs/decyzje/C3-szturm-obrona.md` | **NOWY** |
| `gra/src/main.ts` | import siegeDefenders |
| `docs/decyzje/C3-obleczenie.md` | link do ST |

**Flaga:** → **INTEGRATOR: GOTOWE**
