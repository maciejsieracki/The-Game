# F-P1-01 — Atak wrogiego miasta z mapy strategicznej (klik)

| Pole | Wartość |
|------|---------|
| **ID** | F-P1-01 |
| **Data spec** | 2026-07-02 |
| **Grupa właściciel** | **A** (mapa, wejście, oblężenie) + **C** (preBattle, bitwa 3D) |
| **Status** | **SPEC GOTOWY** · implementacja częściowa w kanonie `de9b53e…` |
| **Decyzje bazowe** | C3-Q1…Q10 · C3-ST-1…3 · C1-Q1…Q5 · **F-P1-01-Q1=A** · **F-P1-01-Q2=A** (Maciej 2026-07-02) |

---

## Cel

Gracz na mapie 3D **klika wrogie miasto** (lub kończy ruch obok) i dostaje **jednoznaczny flow** zależny od muru, garnizonu i składu armii — bez „martwych” klików i bez preBattle przy samym oblężeniu.

---

## Wejścia gracza (mapa strategiczna)

| # | Akcja | Warunek | Oczekiwany efekt |
|---|--------|---------|------------------|
| **W1** | Klik **heks miasta wroga** | Zaznaczona własna jednostka **dist=1** | Flow ataku (patrz §Scenariusze) |
| **W2** | Klik miasta wrogiego **bez** zaznaczonej jednostki | — | Podpowiedź: „Zaznacz jednostkę obok…” (`main.ts` L5115) |
| **W3** | Ruch na heks **własnego** miasta | Jednostka w zasięgu | Wejście do miasta / merge (nie atak) |
| **W4** | Klik miasta **obleganego** | Oblegający dist=1 | Panel oblężenia (`siegeMapPanel`) |
| **W5** | Oblężenie aktywne | Próba ruchu | Blokada + hint (C3-Q9) |

**Nie w scope v1.0:** atak „z daleka” bez dist=1 · multi-select armii przed kliknięciem (skład = C1-Q4 automatyczny).

---

## Scenariusze (klasyfikacja)

Źródło: `gra/src/game/mapSiegeDetect.ts` → `classifyCityAttack()`.

| `tryb` | Warunek | UI / flow |
|--------|---------|-----------|
| **`oblezenie`** | `city.maMur === true` | `cityAttackChoice`: **Oblężaj / Szturm / Anuluj** (C3-Q1=A) |
| **`zdobycie_z_marszu`** | brak muru + garnizonUnit na heksie | **preBattle** → Auto/Ręczna (jak potyczka) → ewent. przejęcie |
| **`bitwa_polowa`** | brak muru + brak garnizonu na heksie | Szturm bez obrońców → `captureCityWithoutBattle` **lub** preBattle jeśli obrońcy dist≤1 |

### Miasto z murem (GOTOWE w kanonie)

```
dist=1 + maMur + wrogi owner
    → offerCityAttackChoice()
         Oblężaj → startMapSiege (BEZ preBattle)
         Szturm  → hasCityDefenders?
                      NIE → captureCityWithoutBattle
                      TAK → preBattle → BattleScene(deploy:false, siege wall)
         Anuluj  → brak akcji (C1-Q5)
```

Szczegóły: `docs/decyzje/C3-szturm-obrona.md`.

### Miasto bez muru (GAP-A1 — **DECYZJA Maciej F-P1-01-Q1=A**, 2026-07-02)

**Klik** wrogie miasto (jednostka gracza **dist=1**, brak muru):

| Obrońcy? | Efekt |
|----------|--------|
| **NIE** (`!hasCityDefenders`) | **Natychmiastowe zdobycie** · **bez** ekranu przed bitwą · **komunikat podsumowania** (`cityCaptureNotice` — jak C3-ST-2) |
| **TAK** | **Ekran przed bitwą** (Auto / Bitwa ręczna / Wycofaj) → walka / auto na mapie → przejęcie przy wygranej |

**Bez** okna Oblężaj/Szturm (oblężenie = tylko miasto **z murem**, C3-Q1).

**Implementacja:** gałąź w SILNIK po `classifyCityAttack` gdy `tryb !== 'oblezenie'`.

### Ruch na hex wrogiego miasta bez muru (GAP-A2 — **DECYZJA Maciej F-P1-01-Q2=A**, 2026-07-02)

Po **zakończeniu animacji ruchu** na hex wrogiego miasta (bez muru) → **ten sam flow** co klik miasta (tabela wyżej).

**Implementacja:** handler po `anim` complete w `main.ts` (SILNIK/F) — nie duplikować logiki, wspólna funkcja `resolveUnwalledCityAttack(ctx)`.

---

## Kontrakt mapa → C1 → C2

| Parametr | Wartość kanon | Plik |
|----------|---------------|------|
| `deploy` | **`false`** — pozycje z mapy (C1-Q3 rewizja 2026-06-27) | `main.ts` `launchSiegeStormFromMap`, map battle |
| `defaultAction` | `'manual'` (Enter = Bitwa ręczna, C1-Q2b=B) | `showPreBattle(..., { defaultAction: 'manual' })` |
| `canRetreat` | `true` · Anuluj **nie** zużywa ruchu (C1-Q5) | preBattle callbacks |
| Skład ATK/DEF | heks starcia + posiłki **dist≤1** (C1-Q4, D8=A) | `collectSiegeAtkRoster` / `collectSiegeDefRoster` |
| Mur | `BattleScene({ siege: { defCiv } })` przy szturmie | `launchSiegeStormFromMap` L6277 |
| Oblężenie bez szturmu | **brak** preBattle | `startMapSiege` |

**F-P1-02 (osobny temat):** pełna mapa pozycji startowych na polu bitwy z heksów mapy — poza minimalnym scope F-P1-01; C1-Q3 już zapisane jako MAPA.

---

## AI symetria (obrońca atakuje gracza)

| Trigger | Zachowanie |
|---------|------------|
| AI dist=1 + miasto gracza + mur | `scanAutoSiegesAfterAiTurn` → `decideAISiegeStance` (C3-Q2 custom) |
| AI szturm | `executeSilentSiegeStorm` → ten sam pipeline co gracz (auto-resolve) |

---

## Stan implementacji (kanon `de9b53e…`)

| Element | Status | Dowód |
|---------|--------|-------|
| Klik miasto + mur + dist=1 | ✅ | `main.ts` L5093–5112 · `cityAttackChoice.ts` |
| Panel oblężenia Q7=A | ✅ | `siegeMapPanel.ts` |
| Szturm + preBattle + deploy:false | ✅ | `launchSiegeStormFromMap` |
| Zdobycie bez obrońców | ✅ | `captureCityWithoutBattle` · C3-ST-2 |
| `hasCityDefenders` | ✅ | `siegeDefenders.ts` |
| **Miasto bez muru — klik ataku** | ❌ → **F-P1-01-Q1=A** | wdrożenie SILNIK/F |
| **Ruch na hex wrogiego miasta** | ❌ → **F-P1-01-Q2=A** | ten sam handler po animacji ruchu |
| Testy lane | ✅ | `map-siege-test.cjs` 6/6 · `obleczenie-test.cjs` 27/27 |

---

## DoD F-P1-01 (Grupa A — spec)

- [x] Dokument ten + scenariusze W1–W5
- [x] Tabela GAP vs GOTOWE
- [x] Handoff do **C** i **Integrator F**
- [x] **ABC Maciej:** F-P1-01-Q1=A · F-P1-01-Q2=A (2026-07-02)
- [ ] Kod GAP-A1/A2 — **SILNIK/F** (nie lane A)

---

## Powiązane pliki

| Plik | Rola |
|------|------|
| `gra/src/game/mapSiegeDetect.ts` | klasyfikacja trybu |
| `gra/src/ui/cityAttackChoice.ts` | modal Oblężaj/Szturm |
| `gra/src/ui/siegeMapPanel.ts` | panel oblężenia |
| `gra/src/ui/preBattle.ts` | overlay C1 (lane C) |
| `docs/decyzje/C3-obleczenie.md` | decyzje oblężenia |
| `docs/decyzje/C1-wejscie-walke.md` | most do C2 |

---

*Grupa A · 2026-07-02 · trigger Master PILNE*
