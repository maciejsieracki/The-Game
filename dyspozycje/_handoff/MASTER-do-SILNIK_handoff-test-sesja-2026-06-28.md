# MASTER → SILNIK — Handoff testowy sesja 2026-06-28

| Pole | Wartość |
|------|---------|
| **Status** | **→ SILNIK: TESTUJ TERAZ** |
| **Od** | MASTER (sesja pilna Maciej) |
| **Publish** | `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` (identyczne) |
| **Akcja SILNIK** | Playtest checklist poniżej + pełna bramka testów + meldunek append `SILNIK-DO-MASTERA.md` |

---

## Co wpięto w tej sesji (main.ts + UI)

| ID | Zmiana | Pliki |
|----|--------|-------|
| **B5** | Żywność państwa na HUD (zapasy + netto/t) | `main.ts` `buildHudState()` |
| **F2** | Przełączniki 🎭/⛪ przy minimapie | `minimapHud.ts`, `hud.ts`, `main.ts` |
| **F-B-TARTAK-DREWNO** | Tartak → „Drewno” w panelu Surowce | `main.ts` `extraCityPanelConfig()` |
| **Save ulepszeń** | `placedImprovements` + `hexClearingStates` w autosave | `main.ts` save/load |
| **Scalenie HTML** | Kanon = ROBOCZA (HUD + F-batchy) | root `Gra-podglad*.html` |

## Potwierdzone wcześniej w silniku (bez nowego kodu w tej sesji)

OBL-S5 machiny · OBL-S7 AI oblężenie · DST-S2/S3 klaster+AI defensywne · Wpływ środek HUD · Skarbiec · zasięgi kultury/religii 3D · dyplomacja blocking · D1B layout.

---

## Bramka automatyczna (SILNIK uruchamia)

```powershell
cd gra
node tools/smoke.cjs
node tools/logic-test.cjs
node tools/grupa-b-lane-test.cjs
node tools/oblezenie-test.cjs
node tools/map-siege-test.cjs
node tools/siege-ai-test.cjs
node tools/cluster-start-test.cjs
node tools/diplomacy-test.cjs
node tools/civ-bonusy-test.cjs
```

Oczekiwane: wszystkie ZIELONE (koszary-gate baseline-red = OK).

---

## Checklist playtest Macieja (AC)

- [ ] Ctrl+F5 `Gra-podglad.html` — HUD D1B: 6 zasobów, **Wpływ** na środku, **Skarbiec**
- [ ] **Żywność** — liczba (nie „—") po turze N
- [ ] Minimapa: 🎭/⛪ → zasięg fiolet/pomarańcz na mapie 3D
- [ ] Toolbar lewy: 🎭/⛪ — ten sam efekt co minimapa
- [ ] 🔨 tartak w zasięgu → panel miasta → **Surowce → Drewno**
- [ ] Wyrąb **nie** dodaje Drewna
- [ ] Oblężenie: panel machin, kolejka taran/wieża
- [ ] Start gry: obcy typ = więcej niż 1 miasto na mapie

---

## Poza zakresem tej sesji (NIE testować jako blocker)

| ID | Powód |
|----|--------|
| **HUD-S7** | Opus review → oficjalny kanon (proces) |
| **OBL-S6** | Pełny model obozu 3D — lane MAPA |
| **D-P0-01…03** | Excel CYW — lane CYWILIZACJE |
| **E-P0-01…06** | Menu/złoża/victory — lane UI/MAPA/CYW |

---

## NIE twoja robota, SILNIK — przekaż dalej (MASTER 2026-06-28)

**To nie dotyczy czatu SILNIK.** Nie koduj — tylko odnotuj w meldunku „przekazano do lane”.

| Temat | Kto robi | Plik startowy |
|-------|----------|----------------|
| OBL-S6 obóz 3D | **MAPA** | `MAPA.md` · `_handoff/MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| E-P0-04/05 złoża | **MAPA** | `_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| D-P0-01…03 Excel AI | **CYWILIZACJE** | `CYWILIZACJE.md` |
| E-P0-06 victory Power | **CYWILIZACJE** | `_handoff/GRUPA-E-do-CYWILIZACJE_victory-10A-star.md` |
| E-P0-01…03 menu S0 | **UI** | `UI.md` · `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` |
| HUD-S7 kanon oficjalny | **Opus** (Ask) | `docs/decyzje/OPUS-REVIEW-QUEUE.md` |
| MAP-S1 miasta 10 poziomów | **MAPA** P2 | `_handoff/A5-do-MAPA_miasta-10poziomow-mury.md` |
| A1-MOCKUP-WNETRZA ekrany | **UI** odłożone | `A1-hud-mapy.md` |

**Mapa delegacji Mastera:** `dyspozycje/MASTER-DELEGACJA-LANE-2026-06-28.md`

---

## Meldunek SILNIK (szablon)

```
### [DATA] SILNIK → MASTER: wynik testów sesji 2026-06-28

Bramka: smoke/logic/grupa-b/… PASS|FAIL
Playtest Maciej: OK|uwagi
Opus: CZEKA|APPROVE|BLOCK
```

**Flaga po PASS:** `→ MASTER: GOTOWE-ROBOCZA sesja-2026-06-28`
