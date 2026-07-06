# F -> MASTER: KANON-BATCH-3 (2026-07-02)

**Flaga:** `-> MASTER: GOTOWE-ROBOCZA`

## Zakres batch
- Panel-C JSON sync (python export-c.py — OK, stale=0)
- Weryfikacja w bundle (bez zmian main.ts):
  - D-SOJUASZ / dyplomacja: formatPowerRelationLine import + uzycie (~L314, ~L4162)
  - A1-Q12: warstwy zasiegu kultury/religii na mapie 3D (~L2138) + powiazane overlay HUD
- Backup: gra/src/main.ts.bak-INTEGRATOR-KANON-BATCH3-2026-07-02

## Bramka testow
| Suite | Wynik |
|-------|-------|
| diplomacy-proposal-test.cjs | 31/31 PASS (exit 0) |
| diplomacy-test.cjs | 143/143 PASS (exit 0) |
| combat-test.cjs | 6/6 PASS (exit 0) |
| logic-test.cjs | 203/203 PASS (exit 0) |
| smoke.cjs | SMOKE OK (exit 0) |
| battle-smoke.cjs | BATTLE SMOKE OK (exit 0; Phase C: jsdom stack overflow w logu, harness zaliczony) |

Suma: 383+ PASS, 0 FAIL, wszystkie exit 0

## Build + publikacja ROBOCZA
- npx vite build --outDir %TEMP%\civ-dist — OK
- gra/tools/publish-robocza-snapshot.ps1 — OK

## MD5 gra-robocza/Gra-podglad.html
de9b53e43997d8ec195f209054f46d3a

(Zrodlo: gra-robocza/ROBOCZA-MANIFEST.json, publishedAt 2026-07-01T14:31:28)

## Co sprawdzic przed kanonem (Master)
- Panel dyplomacji: linia mocy (formatPowerRelationLine) przy relacji z AI
- Mapa: toggle warstw kultury/religii (A1-Q12) + toolbar [C]
- Propozycje sojuszu (D-SOJUASZ progi) — regresja w gra-robocza

## Blokery
- Brak.

---
Integrator F | KANON-BATCH-3 | warstwa cross (Panel-C data + weryfikacja UI/map/diplo w bundle)