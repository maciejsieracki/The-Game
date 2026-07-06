# HANDOFF: Grupa C (Walka) → SILNIK — oblężenie mapy do głównej gry

**Data:** 2026-06-27  
**Od:** Grupa C / MASTER (na prośbę Macieja)  
**Do:** SILNIK (jedyny editor `main.ts` + publisher kanonu)  
**Status:** **WPIĘTE w kodzie (2026-06-27)** — czeka bramka F + publish ROBOCZA + test Mastera  
**Decyzja Macieja:** PLAYTEST-WALKA OK → **wgrać oblężenie do głównej mapy gry** (`Gra-podglad.html`)

---

## 1. Co przesyłam (już na dysku)

| Plik | Rola |
|------|------|
| `gra/src/game/mapSiegeDetect.ts` | Klasyfikacja ataku miasta, `detectAutoSiegeOnCity`, `canInitiateSiege` |
| `gra/src/render/siegeMarker.ts` | Czerwony pierścień, sprite ⚔, obozy na heksach oblegających |
| `gra/src/ui/siegeMapPanel.ts` | Panel: Kontynuuj / Szturm → preBattle / Odwrót |
| `gra/src/main.ts` | Częściowa integracja (klik, panel, szturm, markery, tick głodu) |
| `gra/tools/map-siege-test.cjs` | 6/6 testów detekcji |
| `Gra-podglad-PLAYTEST-WALKA.html` | Maciej sign-off · md5 `cd4677e6…` (playtest) |

**Playtest-only (NIE kopiować logiki 1:1):** `gra/src/game/playtestWalkaMapy.ts`, flaga `playtestWalkaActive`.

---

## 2. Co SILNIK ma zrobić (batch `OBL-MAP-01`)

### 2.1 Nowa gra — reset oblężenia (KRYTYCZNE)

W `doStartGame()` po rebuild sceny jest `unitRenderer` + `cityRenderer`, **brak**:
- `siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map)` (+ dispose starego)
- `siegeTurnByCity.clear()`
- `hideSiegeMapPanel()` + `clearSiegeHtmlLabels()`

**Wzór:** `doStartPlaytestWalkaMapy()` linie ~4544–4545.

### 2.2 AI — auto-oblężenie (kontrakt UNITS)

`UNITS-do-MASTER_kontrakt-start-oblezenia.md`:
- Wróg obok miasta gracza **z murem**, bez szturmu → **`city.oblegane = true` automatycznie**
- Dziś: tylko playtest woła `detectAutoSiegeOnCity` przy starcie; w normalnej grze **brak hooka**

**Minimal v1:** po turze AI (ruch jednostek wroga) — dla każdego miasta gracza z `maMur`:
```typescript
const auto = detectAutoSiegeOnCity(city, units);
if (auto && !city.oblegane) startMapSiege(auto); // bez panelu blokującego u AI? patrz 2.5
```

Jeśli brak gotowego hooka AI w `main.ts` — dodać funkcję `scanAutoSiegesAfterAiTurn()` wołaną z istniejącej pętli końca tury (przed/po ekonomii).

### 2.3 Gracz — start oblężenia (JUŻ DZIAŁA — nie psuć)

Klik: zaznaczona jednostka gracza + wrogie miasto z murem → `tryStartSiegeFromAttack` → panel.  
Klik oblegane miasto → panel (obrońca: Szturm szary).

### 2.4 Szturm → preBattle → bitwa 3D z murem (JUŻ DZIAŁA)

`launchSiegeStormFromMap` → `showPreBattle` → `BattleScene({ siege: { defCiv } })` → `finishSiegeStormBattle`.

### 2.5 Tura oblężenia — ujednolicić ścieżki

Dziś **dwie** ścieżki:
- Panel **Kontynuuj:** `applySiegeTurnTick` (ręcznie odejmuje zapasy)
- **Koniec tury gracza:** blok ~3324 w `main.ts` (atrycja garnizonu + `obleganyGlod` z economii)

**v1:** nie dublować attrition; przy end-turn dla miast `oblegane` zsynchronizować `siegeTurnByCity` i `refreshSiegeMarkers`.  
**Kapitulacja głodem** (kontrakt UNITS): przy `tick.obleganyGlod` — transfer `ownerId` na oblegającego (wymaga zapamiętania `oblegajacyOwnerId` na mieście lub mapy `siegeTurnByCity` + detekcji sąsiada). Obecnie tylko `oblegane=false` + hint.

### 2.6 Save / load

- `cities[].oblegane` — już idzie przez `cities.slice()` w `SaveGame`
- **`siegeTurnByCity` — NIE jest zapisywane** → dodać do `SaveGame.meta.siegeTurnByCity` lub osobne pole
- Po `restoreGameFromSave`: `refreshSiegeMarkers()`, opcjonalnie otworzyć panel jeśli gracz klika miasto

### 2.7 Komentarze DEFERRED

Usunąć/zaktualizować komentarz ~3328 (`DEFERRED: brak UI`) — UI jest (panel C3).

---

## 3. DoD (Definition of Done)

1. **Nowa gra:** po starcie nie ma starych markerów oblężenia; nowe oblężenie pokazuje pierścień + etykietę HTML.
2. **Gracz:** jednostka obok wrogiego miasta z murem → klik → panel → Szturm → preBattle → bitwa z murem → wynik na mapie.
3. **AI:** jednostka wroga obok miasta gracza z murem → auto `oblegane` + marker (bez crashu).
4. **Save/load:** oblężenie przetrwa zapis i wczytanie (marker + flaga).
5. **Build:** `cd gra && npx vite build --outDir $env:TEMP\civ-dist`
6. **Bramka testów:** wszystkie 17 suitów ZIELONE (baseline `koszary-gate-test` red OK) + `node tools/map-siege-test.cjs` + `node tools/oblezenie-test.cjs` + smoke + battle-smoke
7. **Opus review** → publish:
   - `Gra-podglad.html` (kanon root)
   - opcjonalnie `gra-kanon/` przez `gra/tools/publish-kanon-snapshot.ps1`
8. **NIE** nadpisywać `Gra-podglad-PLAYTEST-WALKA.html` bez osobnej dyspozycji (osobny build playtestu).

---

## 4. Poza zakresem v1 (nie blokować merge)

- Machiny oblężnicze 1/turę (Taran, Wieża)
- Milicja z populacji (UNITS D8)
- Szturm kontrataku obrońcy
- Pełna integracja AI 3-poziomowa (`C3-Q2-do-UNITS-AI_oblezenie-3poziomy.md`)

---

## 5. Test manualny Macieja (po kanonie)

1. Nowa gra → zbuduj mury → AI podchodzi → czerwony pierścień na Twoim mieście.
2. Hastati/Falanga obok wrogiego miasta z murem → oblężenie → Szturm → bitwa.
3. Zapisz w oblężeniu → wczytaj → marker nadal widoczny.

---

**Flaga handoff:** GOTOWE  
**Melduj w:** `dyspozycje/SILNIK-DO-MASTERA.md` + md5 kanonu po publish.
