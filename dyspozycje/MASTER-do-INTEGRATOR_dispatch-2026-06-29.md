# MASTER → INTEGRATOR — dyspozycja wpięć (2026-06-29)

> **Od:** Master (czat Maciej) · **Playtest Maciej:** E1-EPOKA-PRZED-CYW ✅  
> **Kanon dziś:** md5 `95BBCD3FAB26D4C4F0C35BF0C5A42EA7` *(stary — aktualny kanon: `4602e752d7e4b21f3c2460e494e82a8f`)*  
> **Kolejka operacyjna:** `docs/obieg/INTEGRATOR-kolejka.md`

---

## ✅ Już w kanonie (nie powtarzać)

| Batch | md5 | Uwagi |
|-------|-----|-------|
| **E1-EPOKA-PRZED-CYW** | `95bbcd3f…` *(stary — aktualny kanon: `4602e752…`)* | Epoka→Cywilizacja · `epokiStartowe` · playtest OK |
| E1 bundle + F-CITY-HEX + batchy wcześniejsze | w tym samym buildzie | las parity, czysty hex miasta |

---

## 🎯 PRIORYTET 1 — wpięcie bez ABC (możesz teraz)

### 1A. Panel-C — `combat-params.json` 🟢

**Handoff:** `dyspozycje/_handoff/C-do-INTEGRATOR_panel-C.md`  
**Pliki:** `combat.ts`, `siege.ts`, `siegeAi.ts`, `gra/data/combat-params.json`  
**Bez `main.ts`.** Testy: combat 6/6 · siege-ai 17/17 · round-trip OK.  
**DoD:** rebuild ROBOCZA/kanon · md5 w meldunku · ISO-4 walka + mapa.

### 1B. UNITS — typeId na mapie 🟢

**Handoff:** `dyspozycje/_handoff/UNITS-do-INTEGRATOR_map-units-typeId-P1.md`  
**Bez `main.ts`** — tylko render wizualny. Scal z 1A w jednym rebuildzie.

### 1C. MAPA — ulepszenia audit P1-04 🟢

**Handoff:** `dyspozycje/_handoff/MAPA-do-INTEGRATOR_ulepszenia-audit-P1-04.md`  
Fixy lane MAPA — bez main.ts jeśli tylko render/data.

---

## 🎯 PRIORYTET 2 — wymaga `main.ts` (SILNIK → potem Ty)

Te batche mają flagę **`→ SILNIK: GOTOWE`** — najpierw SILNIK wpinie, potem Ty publikujesz:

| # | Batch | Handoff |
|---|-------|---------|
| 2A | **Grupa B** (7 batchy: szczęście %, okolica, B5 żywność, ulepszenia…) | `EKONOMIA+UI-do-SILNIK_GRUPA-B-batch-2026-06-27.md` + `city-sight-zasieg` |
| 2B | **UI preBattle P0-D4** bonusy nacji | `UI-do-INTEGRATOR_preBattle-bonusy-P0-D4.md` (sprawdź czy wymaga main.ts) |
| 2C | **CYW** barbarians 11C + victory 10A | `CYWILIZACJE-DO-MASTERA.md` § 2026-06-29 |
| 2D | **D3 audiencja** dyplomatyczna | `CYWILIZACJE-do-UI_dyplomacja-audiencja-D3Q2.md` |

**Master prosi SILNIK:** zamknij 2A–2D w jednym lub dwóch batchach → **`→ INTEGRATOR: GOTOWE`** z listą plików.

---

## ⏸ PRIORYTET 3 — łańcuch (nie zaczynaj przed końcem poprzednika)

| Kolejność | Temat | Blokada |
|-----------|-------|---------|
| P2 | **FOOD-HODOWLA** | EKONOMIA ✅ · **MAPA P2** ▶ · SILNIK ⬜ · potem Integrator |
| P3 | **E2 gęstość świata** | UI ✅ w kreatorze · **MAPA generator** ⬜ · SILNIK ⬜ |
| P0 | **Panel JSON → TS** | `e-start-params.json`, `map-gen-params.json` → `newGameMapDefaults.ts`, `victory.ts`, `tech-tempo.ts` (decyzja PANEL-P0-FIX) |

Handoffy: `INTEGRATOR-kolejka.md` § F-FOOD · § E2 · `E-start.md` § wpięcie.

---

## 📋 Bramka po każdym publishu

```
cd gra
node tools/logic-test.cjs
node tools/combat-test.cjs
node tools/smoke.cjs
node tools/battle-smoke.cjs
npx vite build --outDir %TEMP%\civ-dist
```

Kopiuj do: `Gra-podglad-ROBOCZA.html`, `Gra-podglad.html`, `PLAYTEST-WALKA`, `PLAYTEST-MIASTO`.  
Meldunek: **`→ MASTER: GOTOWE-ROBOCZA`** + md5 + lista batchy.

---

## ⛔ Znane problemy (nie blokują P1)

- `map-deposits-era-test` — 1 fail seed 424242 (MAPA triage)
- `tsc --noEmit` — błędy w `newGameFlow.ts`, `sciencePicker.ts` (sprzątanie osobno)
- `koszary-gate-test` — baseline red (znane, decyzja Maciej)

---

**Maciej odłożył:** `zadanie panel` (Panel-D, audyt B) — **nie priorytet** tej dyspozycji.
