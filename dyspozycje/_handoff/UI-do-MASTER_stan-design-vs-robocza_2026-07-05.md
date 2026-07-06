# UI → MASTER: stan Design vs ROBOCZA (2026-07-05)

**Status:** CZEKA — Integrator publish po review  
**Bundel roboczy:** `gra-robocza/Gra-ROBOCZA.html` (md5 w pieczętce)  
**Playtest Macieja:** batch Handel/Buduj/Spichlerz/minimapa/imperium — OK na pieczętce `1b169cfd`

---

## Co NIE jest prawdą

- „Cały Plot Design w grze” — **NIE**
- „5 minut = wszystkie mockupy” — **NIE** (130+ ekranów w rejestrze UX)

## Co JEST w roboczej

Jeden bundel z `gra/src/` + osobny `Gra-ROBOCZA-POLE-BITWY.html`.

### Wdrożone w kodzie (UI lane)

| Obszar | Pliki |
|--------|-------|
| Handel W4 (karty SVG, suwaki) | `cityPanel.ts` |
| Spichlerz / Zamożność polish | `cityPanel.ts` |
| Porządek W4 banner + chipy | `cityPanel.ts` |
| Praca W4 pasek + suwak | `cityPanel.ts` |
| Produkcja bez emoji 🔨 | `cityPanel.ts` |
| Stopka surowce SVG | `cityPanel.ts` |
| Tooltip heksa | `hexContextTooltip.ts` |
| Overlay kultura/religia | `empireOverlayHud.ts` |
| Okolica 3D W badge | `cityOkolicaOverlay.ts` |
| Imperium bez /t | `empireDetailPanel.ts` |
| res-cattle, res-clay | `icons-manifest.json` |

### Integrator (do ratyfikacji)

| Zmiana | Plik | Uwaga |
|--------|------|-------|
| `onMinimapClick` | `main.ts` | Wpięte poza lane SILNIK — ratyfikować lub przenieść |

---

## NIE wdrożone (mockup Design)

- Nauka hub/drzewko 1E final (HOLD)
- A-06 panel jednostki, A-10 armia, A-27 modal dyplo
- A-08 build menu SVG
- A-14 bilans imperium (moduł nie wpięty w main)
- UX bitwy Q2–Q7 (BLOCKED D5)
- Pełne 1:1 W4 wszystkich 7 zakładek (częściowo)
- `/t` poza panelem miasta (nauka, dyplo, oblężenie)

---

## Integrator — DoD publish kanonu

1. `npx tsc --noEmit` = 0
2. smoke + bramka testów (baseline-red dokumentowany)
3. Opus review
4. `publish-kanon-snapshot.ps1` → `gra-kanon/Gra-KANON.html`
5. Wpis `DZIENNIK-MASTERA.md`

---

**Flaga:** → MASTER: CZEKA · → INTEGRATOR: publish robocza/kanon po AC
