# C3 — Szturm, obrona i zdobycie miasta (reguły kanon)

**Ekran:** mapa świata · **Grupa:** A (mapa + oblężenie + preBattle)  
**Status:** **ZAMKNIĘTE** · Maciej + playtest 2026-06-30  
**Powiązane:** `C3-obleczenie.md` · `C1-wejscie-walke.md`  
**Kod:** `gra/src/game/siegeDefenders.ts` · `main.ts` (SILNIK)  
**Handoff:** `dyspozycje/_handoff/MASTER-do-SILNIK_C3-reguly-szturm-obrona.md`

---

## TL;DR (jedno zdanie)

Przy **mieście z murem** gracz wybiera **Oblężaj / Szturm / Anuluj**; **szturm bez obrońców** = natychmiastowe zdobycie bez walki; **szturm z obrońcami** = preBattle → bitwa (mur w C2).

---

## Flow gracza — miasto z murem (C3-Q1=A)

```
Armia obok wrogiego miasta (dist=1, maMur=true)
        │
        ▼
┌─────────────────────────────┐
│  cityAttackChoice           │
│  Oblężaj │ Szturm │ Anuluj   │
└─────────────────────────────┘
        │
   Oblężaj ──► startMapSiege → panel oblężenia (BEZ preBattle)
        │
   Szturm ───► hasCityDefenders?
                    │
              NIE ─► captureCityWithoutBattle (tabliczka)
                    │
              TAK ─► preBattle → Auto / Ręczna / Wycofaj → C2 (mur)
        │
   Anuluj ──► brak akcji, ruch zachowany (C1-Q5)
```

**Panel oblężenia (etap 2):** te same reguły szturmu + głód, atrycja, machiny (C3-Q3…Q9).

---

## C3-ST-1 — Kto jest „obrońcą”?

| Warunek | Obrońca? | Uwaga |
|---------|----------|--------|
| Jednostka właściciela miasta **dist ≤ 1** od heksu miasta | **TAK** | np. Łucznik przy murze |
| **garnizon > 0** | **TAK** | abstrakcyjna siła garnizonu |
| Tylko **populacja / ludność**, garnizon = 0, brak jednostek | **NIE** | puste miasto do szturmu |
| **Mur** (maMur) | **NIE** sam w sobie | mur = bonus w bitwie, nie „obrońca” |
| Wróg na heksie miasta (garnizonUnit) | **TAK** | dist=0 ⊆ dist≤1 |

**Implementacja:** `hasCityDefenders(city, units)` w `siegeDefenders.ts`.

---

## C3-ST-2 — Szturm bez obrońców

Gdy `hasCityDefenders === false` i gracz wybiera **Szturm**:

1. **Brak** ekranu preBattle (C1)
2. **Brak** bitwy 3D (C2)
3. Jednostka atakująca **wchodzi na heks miasta**
4. **Zero strat**
5. Tabliczka **`cityCaptureNotice`** („Miasto zdobyte — brak obrońców…”)
6. Zmiana `ownerId`, koniec oblężenia jeśli było

**Playtest Maciej 2026-06-30:** scenariusz Ateny bez Łucznika.

---

## C3-ST-3 — Szturm z obrońcami

Gdy `hasCityDefenders === true`:

1. **preBattle** (C1-Q2b=B: Enter = Bitwa ręczna)
2. Skład **C1-Q4=A** — heks starcia + posiłki dist≤1
3. **Bitwa ręczna** → Grupa C: pole 3D **z murem** (`siegeWall`)
4. **Auto** → rozstrzygnięcie na mapie bez sceny 3D
5. Wygrana atakującego → `ownerId`, koniec oblężenia, **skład ataku wchodzi na heks miasta** (widoczny, bez auto-garnizonu)

**Playtest Maciej 2026-06-30:** Ateny + Łucznik — pełna ścieżka OK. Fix OBL-CAP-01: jednostka znikała (auto-szturm `survivors:[]` + brak wejścia na heks po bitwie).

---

## Milicja vs garnizon (C3-Q6=A + ST-1)

| Stan | Szturm? | Skład obrony w preBattle |
|------|---------|---------------------------|
| Jednostki dist≤1 | TAK | te jednostki |
| garnizon>0, brak jednostek | TAK | **Milicja** (~20% populacji, `makeMilitia`) |
| garnizon=0, brak jednostek | **NIE** (ST-2) | — (zdobycie bez walki) |

**Reguła:** milicja **nie** spawnuje się tylko z populacji — wymaga **garnizon > 0** lub jednostek na mapie.

---

## UI i blokady (playtest 2026-06-30)

| Reguła | Plik |
|--------|------|
| Panel oblężenia otwarty → **brak ruchu** jednostek | `main.ts` + `isSiegeMapPanelOpen()` |
| Panel merge: Zostaw osobno \| Połącz (równe kolumny) | `armyMergePanel.ts` |
| Szturm tylko **oblegający gracz** (ownerId=0) | `launchSiegeStormFromMap` |
| Miasto **bez muru** → zwykła potyczka, nie szturm | hint w SILNIK |

---

## AI (C3-Q2=custom)

| Siła armii AI | Zachowanie |
|---------------|------------|
| Bardzo silna | Szturm od razu (`hasCityDefenders` stosuje ST-2/ST-3) |
| Średnia | Oblężenie → machiny → szturm gdy gotowe |
| Słaba | Tylko głodzenie |

Handoff: `dyspozycje/_handoff/C3-Q2-do-UNITS-AI_oblezenie-3poziomy.md`

---

## Kapitulacja z głodu (C3-Q3=B) — bez szturmu

Magazyn żywności = 0 → **alert** „kapitulacja za 1 turę” → następna tura **transfer właściciela bez bitwy 3D**.

---

## Decyzje — skrót ID

| ID | Treść | Status |
|----|-------|--------|
| C3-Q1 | Oblężaj / Szturm / Anuluj | A · zamknięte |
| C3-Q2 | AI 3 poziomy | custom · zamknięte |
| C3-ST-1 | Definicja obrońców | playtest 2026-06-30 |
| C3-ST-2 | Zdobycie bez walki | playtest 2026-06-30 |
| C3-ST-3 | Szturm → preBattle → C2 | playtest 2026-06-30 |
| C1-Q4 | Skład preBattle multi-unit | A |
| C1-Q5 | Wycofaj bez strat | A |

---

*Aktualizacja: 2026-06-30 · Integrator F · playtest Maciej potwierdzony*
