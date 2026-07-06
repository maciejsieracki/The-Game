# Weryfikacja Master — silnik + bramka (2026-06-27)

> **AKTUALNY KANON (2026-07-01):** md5 `4602e752d7e4b21f3c2460e494e82a8f` — poniższe md5 z sesji 2026-06-27 są historyczne.

> Master Silnik uruchomił pełną bramkę lokalnie (Node zainstalowany w sesji).

## ROBOCZA

| Pole | Wartość |
|------|---------|
| Plik | `Gra-podglad-ROBOCZA.html` |
| md5 | `d813159b0726b94f8e360c53dadf72a8` *(stary — aktualny kanon: `4602e752…`)* |
| Poprzedni (F) | `d11f2479ac20158d38d3ba6e2ac3f253` *(stary)* |
| Kanon `Gra-podglad.html` | `2276ec0fe96873b32ec6ab03bc0c1f11` *(stary — aktualny kanon: `4602e752…`)*

## Wyniki testów

| Test | Wynik |
|------|-------|
| wire-ekonomia | **29/29 PASS** |
| logic-test | **195/195 PASS** |
| combat-test | **6/6 PASS** |
| diplomacy | **133/133 PASS** |
| ai-test | **188/188 PASS** |
| smoke | **PASS** |
| battle-smoke | **PASS** (WARN: brak przycisku auto przy re-open) |
| vite build | **PASS** |
| typecheck (tsc) | **FAIL** — legacy poza ścieżką gry (preview, battleScene) — **nie blokuje build** |
| civ-bonusy | **26 PASS, 4 FAIL** — patrz § Błędy |

## Błędy civ-bonusy (Grupa D — nie blokuje ROBOCZA)

1. Grecy +15% handel (`cityYieldPerTurn`) — handelBrutto=0 zamiast 11
2. Celtowie szarza R1 +25% atk — brak mnożnika
3. Celtowie szarza uderzenie +15% — 0.4 zamiast 0.15

**Routing:** lane CYWILIZACJE/UNITS — P2 po Opus; nie cofać batchy F.

## Weryfikacja statyczna kodu F

| Element | Stan |
|---------|------|
| F-START-FIX generujSwiat | ✅ L3362 |
| F-HUD-2 mountD1bHud | ✅ WYKONAJ, budowa, panel [H] |
| B2-Q5 getRevolt | ✅ L277 + cities overlay |
| defAtak0 combat | ✅ naprawione |
| cityPanel import | ✅ bez duplikatu |

## Następny krok

1. **Opus 4.8** (Ask) — review `Gra-podglad-ROBOCZA.html` + ten plik
2. Po **APPROVE** → Master promuje `Gra-podglad.html`
3. Playtest Macieja — checklista w czacie Master
