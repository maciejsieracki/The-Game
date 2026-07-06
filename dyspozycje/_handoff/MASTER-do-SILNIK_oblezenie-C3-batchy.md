# MASTER → SILNIK — Oblężenie C3 (pełna logika mapy)

**Data:** 2026-06-27  
**Od:** MASTER (na prośbę Macieja)  
**Do:** SILNIK — jedyny editor `main.ts` + kanon `Gra-podglad.html`  
**Decyzje:** `docs/decyzje/C3-obleczenie.md` (C3-Q1…Q10 **ZAMKNIĘTE**)  
**Priorytet:** logika **przed** obóz 3D (C3-Q10=C → batch OBL-S6 / lane MAPA)

---

## TL;DR — kolejność wdrożenia

| Batch | ID | Cel | Blokuje grę? |
|-------|-----|-----|--------------|
| **1** | `OBL-S1` | Start C3-Q1 + jeden zegar głodu + kapitulacja Q3=B + reset nowej gry | **TAK** |
| **2** | `OBL-S2` | Save/load oblężenia + AI auto-blokada | **TAK** |
| **3** | `OBL-S3` | Panel rozszerzony (atrycja, alert, garnizon) | częściowo |
| **4** | `OBL-S4` | Milicja 20% przy szturmie (C3-Q6) | szturm |
| **5** | `OBL-S5` | Machiny + kolejka (C3-Q8=C) | UNITS współpraca |
| **6** | `OBL-S6` | Obóz 3D (C3-Q10=C) | MAPA — **po S1–S3** |

**Maciej:** obóz 3D świadomie **po** logice — inaczej modele bez stanu w silniku.

---

## Stan kodu (2026-06-27)

### Już na dysku (nie psuć)

| Moduł | Plik |
|-------|------|
| Detekcja ataku | `gra/src/game/mapSiegeDetect.ts` |
| Markery mapy | `gra/src/render/siegeMarker.ts` |
| Panel dolny | `gra/src/ui/siegeMapPanel.ts` |
| Głód w ekonomii | `gra/src/game/turn-economy.ts` (WIRE 4, `oblegane`) |
| Logika oblężenia pure | `gra/src/game/siege.ts` (milicja, captureCity) |
| Integracja częściowa | `gra/src/main.ts` |
| Testy | `tools/map-siege-test.cjs`, `tools/oblezenie-test.cjs` |

### Luki vs decyzje C3 (do zamknięcia w batchach)

| Decyzja | Gap |
|---------|-----|
| **C3-Q1=A** | Brak dialogu Oblężaj / Szturm / Anuluj — auto-start oblężenia |
| **C3-Q3=B** | Brak alertu „kapitulacja za 1 turę”; transfer nie zawsze z opóźnieniem |
| **C3-Q4=A** | Atrycja tylko licznik `garnizon`, nie HP jednostek |
| **C3-Q6=A** | Brak milicji w `collectSiegeDefRoster` |
| **C3-Q7=A** | Panel ubogi (brak atrycji, alertu, machin) |
| **C3-Q8=C** | Brak kolejki machin |
| **C3-Q9=A** | Odwrót OK; brak walidacji „armia nadal obok” |
| **C3-Q2=custom** | Brak AI 3-poziomowego oblężenia |
| **Save** | `siegeTurnByCity` / oblegający poza `cities[]` |
| **doStartGame** | Brak resetu markerów oblężenia (playtest ma wzór) |
| **Zegar** | Podwójny głód: panel Kontynuuj + koniec tury |

---

## Batch OBL-S1 — Graalna pętla (P0, wdrożyć pierwszy)

**Pliki:** `main.ts`, `cities.ts`, `siegeMapPanel.ts` (nowy prompt startu)

### S1.1 Dialog startu — C3-Q1=A

Przy kliku: jednostka gracza obok wrogiego miasta **z murem** → overlay (nie auto oblężenie):

| Przycisk | Akcja |
|----------|--------|
| **Oblężaj** | `startMapSiege(ctx)` — `oblegane=true`, panel, markery |
| **Szturm** | `launchSiegeStormFromMap(ctx)` — **bez** `oblegane`, od razu preBattle |
| **Anuluj** | nic |

**DoD:** klik miasto → 3 przyciski; Szturm nie włącza pierścienia.

### S1.2 Jeden zegar głodu

| Źródło | Po S1 |
|--------|--------|
| **Koniec tury gracza (N)** | `advanceCityEconomy` — jedyne miejsce odejmowania zapasów |
| **Kontynuuj w panelu** | tylko `siegeTurn++`, atrycja garnizonu, sprawdzenie pending kapitulacji — **bez** odejmowania jedzenia |

### S1.3 Kapitulacja C3-Q3=B

1. Gdy po ticku ekonomii `obleganyGlod` i **brak** pending → ustaw `city.siegeCapitulationPending=true` + hint *„kapitulacja za 1 turę”*
2. Gdy pending i kolejny tick oblężenia (Kontynuuj **lub** następny koniec tury) → `resolveSiegeSurrender(cityId)` → `ownerId = oblegajacyOwnerId`

Pole na `City`: `oblegajacyOwnerId?: number`, `siegeCapitulationPending?: boolean`

### S1.4 Przejęcie miasta z głodu

`resolveSiegeSurrender` (już częściowo w main.ts): transfer `ownerId`, wyczyść garnizon wroga na heksie, `endMapSiege`.

### S1.5 Reset nowej gry

W `doStartGame()` po rebuild sceny (wzór: `doStartPlaytestWalkaMapy`):

```typescript
siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map);
siegeTurnByCity.clear();
siegeBesiegerByCity.clear(); // lub pola City
hideSiegeMapPanel();
clearSiegeHtmlLabels();
```

### Bramka S1

- [ ] `node tools/map-siege-test.cjs`
- [ ] `node tools/oblezenie-test.cjs`
- [ ] `node tools/smoke.cjs`
- [ ] Playtest ręczny: Oblężaj / Szturm / Anuluj
- [ ] Opus → kanon (MASTER)

---

## Batch OBL-S2 — Save + AI auto-blokada (P0)

### S2.1 Save / load

W `doQuickSave` / `restoreGameFromSave`:

```typescript
meta: {
  siegeTurnByCity: Array.from(siegeTurnByCity.entries()),
  // oblegajacyOwnerId → już w cities[].oblegajacyOwnerId
}
```

Po load: `refreshSiegeMarkers()`, odtwórz mapy z `meta`.

### S2.2 AI auto-oblężenie (minimal v1)

Po pętli AI (`main.ts` ~4015), przed barbarzyńcami:

```typescript
function scanAutoSiegesAfterAiTurn(): void {
  for (const city of cities) {
    if (city.oblegane || !city.maMur) continue;
    if (city.ownerId !== 0) continue; // v1: auto tylko na miasta gracza
    const auto = detectAutoSiegeOnCity(city, units);
    if (auto) startMapSiege(auto); // bez blokującego UI u obrońcy
  }
}
```

**Kontrakt:** `UNITS-do-MASTER_kontrakt-start-oblezenia.md` §1.

### S2.3 Walidacja oblężenia co turę

Jeśli brak jednostki wroga w promieniu 1 od obleganego miasta → `endMapSiege` (oblężenie przerwane).

### Bramka S2

- [ ] Zapisz w oblężeniu → wczytaj → pierścień + panel po kliku
- [ ] AI obok miasta gracza z murem → auto `oblegane`

---

## Batch OBL-S3 — Panel C3-Q7 (P1)

Rozszerzyć `siegeMapPanel.ts`:

- wiersz: atrycja garnizonu (8%/turę)
- banner: `siegeCapitulationPending` — czerwony alert
- wiersz: liczba jednostek oblegających / garnizon HP sum
- placeholder sekcji „Machiny” (disabled do OBL-S5)

---

## Batch OBL-S4 — Milicja + szturm (P1, C3-Q6=A)

**Pliki:** `main.ts` (+ ewent. import z `siege.ts`)

W `collectSiegeDefRoster` / preBattle: jeśli brak wojska na heksie → dołącz syntetyczne jednostki z `makeMilitia(population)` (20% pop, `siege.ts`).

**Handoff UNITS:** kontrakt składu szturmu — `_handoff/UNITS-do-MASTER_kontrakt-start-oblezenia.md` §2.

---

## Batch OBL-S5 — Machiny (P2, C3-Q8=C)

**Wymaga:** nowy stan na mieście lub mapie:

```typescript
siegeMachines?: { queue: ('taran'|'wieza')[]; ready: ('taran'|'wieza')[] };
```

Tempo: `+1 postęp/turę oblężenia` skalowane `floor(armiaOblegajaca / N)` (parametr w `data/` lub stała 10).

**UI:** w panelu — wybór Taran/Wieża, lista gotowych.

**Szturm:** przekazać gotowe machiny do `BattleScene` (`siege:` w preBattle).

**Lane UNITS:** walidacja kontraktu bitwy oblężniczej — `_handoff/UNITS-do-MASTER_oblezenie-mapy-bitwy.md`.

---

## Batch OBL-S6 — Obóz 3D (P2, C3-Q10=C) → lane MAPA

**Nie SILNIK-only** — MASTER integruje po OBL-S5:

- Źródło: `gra/src/siegepreview/main.ts` (taran, katapulta, wieża, żołnierze)
- Wpięcie: `SiegeSceneOverlay` wołany z `refreshSiegeMarkers` gdy `oblegane`
- **SILNIK:** tylko hook `syncSiegeCampVisuals(cityId)` z main.ts

Handoff MAPA: utworzyć `_handoff/SILNIK-do-MAPA_oboz-3D-hook.md` po zamknięciu S3.

---

## Batch OBL-S7 — AI 3 poziomy (P2, C3-Q2=custom)

**Lane CYWILIZACJE/UNITS** + hook w SILNIK:

| Siła armii | Zachowanie |
|------------|------------|
| Bardzo silna | Szturm od razu |
| Średnia | Oblężaj + machiny → szturm |
| Słaba | Tylko głodzenie |

Handoff: `dyspozycje/_handoff/C3-Q2-do-UNITS-AI_oblezenie-3poziomy.md`

---

## Pliki — wyłączność

| Plik | Lane |
|------|------|
| `gra/src/main.ts` | **SILNIK only** |
| `gra/src/game/cities.ts` | SILNIK (pola City) lub EKONOMIA handoff |
| `gra/src/ui/siegeMapPanel.ts` | UI (SILNIK wpina w main) |
| `gra/src/game/siege.ts` | UNITS — **czytać, nie edytować** bez handoff |
| `gra/src/render/siegeCamp.ts` | MAPA (OBL-S6) |

---

## Testy obowiązkowe (każdy batch)

```powershell
cd gra
node tools/map-siege-test.cjs
node tools/oblezenie-test.cjs
node tools/smoke.cjs
node tools/logic-test.cjs
```

Build: `npx vite build --outDir $env:TEMP\civ-dist` → kopiuj `Gra-podglad.html`.

---

## Playtest Macieja (po OBL-S2)

1. Nowa gra → mury → AI podchodzi → pierścień na Twoim mieście.
2. Hastati obok wrogiego miasta → **Oblężaj / Szturm / Anuluj**.
3. Oblężaj → Kontynuuj → zapasy spadają **raz na turę gry** (N), nie podwójnie.
4. Zapasy = 0 → alert → następna tura → miasto przejęte.
5. Zapisz → wczytaj → stan oblężenia OK.

---

**Flaga:** GOTOWE do wdrożenia  
**Melduj:** `dyspozycje/SILNIK-DO-MASTERA.md` + wpis `DZIENNIK-MASTERA.md`
