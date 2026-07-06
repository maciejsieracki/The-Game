# Grupa F — backlog wpięć i audytów

> **Źródło prawdy operacyjne:** `docs/decyzje/STATUS.md` + `dyspozycje/DZIENNIK-MASTERA.md`  
> **Ten plik** = skonsolidowana kolejka dla Grupy F (kopiowane dyspozycje + handoffy).  
> Aktualizuje **Master Silnik** w `OD-MASTERA.md` § F; Grupa F wykonuje po `master`.

---

## Pipeline (od 2026-06-27)

Zobacz `docs/czaty/SCHEMAT-DWIE-WERSJE.md`. **F** publikuje tylko **`Gra-podglad-ROBOCZA.html`**.

---

| # | Zadanie | AC (Definition of Done) | Handoff / pliki |
|---|---------|-------------------------|-----------------|
| **P0-PILNE** | **F-B-PILNE** luki Grupa B | getResourceAccess · getRevolt+warning · 2A inputs · −8% HP · rebuild ROBOCZA | `EKONOMIA+UI-do-SILNIK_PILNE-luki-2026-06-27.md` |
| **P0-1** | Dokończ migrację save/load podziału per-city | Po Ctrl+L i `doLoadGame()` każde `City` ma `podzialHandlu` + `podzialPracy` (wywołaj `ensureCityPodzialDefaults`) | ✅ batch 1+2 (`ensureCitySaveDefaults`) |
| **P0-1b** | (opcjonalnie) Wyrównaj `doLoadGame` z Ctrl+L | Menu „Wczytaj" restore tyle samo co Ctrl+L | ✅ `restoreGameFromSave` wspólne |
| **P0-2** | Audyt wpięcia B3 (1A/3A) | `configureCityPanel` ma callbacks; `advanceCityEconomy` czyta per-city; 2 miasta różny luksus → różny Wealth w playteście | `UI-DO-MASTERA.md` 2026-06-26; `EKONOMIA-do-MASTER_podzial-per-city.md` |
| **P0-3** | Bramka | typecheck PASS; `wire-ekonomia-test.cjs` PASS; build `/tmp` PASS | Skrypt: `gra/tools/bramka-test-publish.ps1` |
| **P0-4** | Raport | E1 + E2 z wynikami testów | `SILNIK-DO-MASTERA.md`, `DO-MASTERA.md` § F |
| **P1-E1b** | **generujSwiat** w `doStartGame` | ✅ kod 2026-06-27 | backup `main.ts.bak-SILNIK-20260627-generujSwiat` |

**Uwaga P0-1:** `ensureCitySaveDefaults` w `restoreGameFromSave` — ✅ (batch F1/F2).

---

## Już WPIĘTE (tylko audyt, nie przerabiaj)

| Temat | Co w main | Raport |
|-------|-----------|--------|
| **B3/B4 suwaki + Wealth** | `configureCityPanel`: `onPodzialHandluChange`, `onPodzialPracyChange`, `onPurchaseUnit`, `getPodzialHandlu/Pracy` | `UI-DO-MASTERA.md` 2026-06-26 |
| **EKONOMIA per-city** | `City.podzialHandlu/Pracy`; `toEconomyCity` w turn-economy | `EKONOMIA-DO-MASTERA.md` 2026-06-27 |
| **Nauka pula** | `research.ts`, picker | DZIENNIK #1 WPIĘTE |
| **Auto-zarządca** | toggle cityPanel | batch 2026-06-25 |
| **Save/load** | Ctrl+S/L, autosave menu | batch 2026-06-25 |
| **Atak z mapy** | klik wróg → combat | batch 2026-06-25 |
| **preBattle** | import `showPreBattle` | UNITS/UI — weryfikacja wizualna |

---

## BLOKADY — NIE wpinaj bez sygnału Mastera

| Temat | Powód | Odblokowanie |
|-------|--------|--------------|
| ~~**A1 HUD D1B**~~ | **USUNIĘTE** — ABC1=A | F wpinaj F-HUD po bramce |
| **hud.ts / minimapa** | Lane UI | **ABC1=A** — F-HUD po bramce (nie blokada) |
| **B5 żywność imperium** | `advanceEmpireFood` = stub (throws) | EKONOMIA lane + GOTOWE |
| **C2 battleScene UX** | ~~Czeka D5=B~~ | **ODBLOKOWANE** 2026-06-27 — Q2–Q7 zamknięte; batch F-C2 |
| **Granica C / terytorium** | `isInTerritory` w MAPA, nie eksport | handoff MAPA |

---

## Kolejka P1 — po P0 + flaga GOTOWE

| Priorytet | ID | Temat | → SILNIK | Handoff |
|-----------|-----|-------|----------|---------|
| P1 | **C2** | UX bitwy — **GOTOWE lane** | **F-C2** deploy + map BattleScene | `UNITS-DO-MASTERA.md` C2 zamknięte |
| P1 | **B2** | Społeczeństwo panel haki | **F-B2** | `UI-do-MASTER_B2-spoleczenstwo.md` |
| P1 | **C1** | preBattle TW wpiecie | **F-C1** | `C1-do-SILNIK_preBattle-wpiecie.md` |
| P1 | **B5** | Żywność tick imperium | NIE (stub) | `EKONOMIA-DO-MASTERA.md` SPEC 2026-06-26 |
| P1 | **Gr-D1** | Drzewko nauki HUD | NIE | `UI-do-MASTER_drzewko-nauki-rewire.md` |
| P1 | **Gr-D2** | Pasek kultury HUD | NIE | decyzje D2 zamknięte |
| P1 | **Gr-D3** | Dyplomacja panel akcje | NIE | lane raport |
| P1 | **Gr-D4** | Bonusy Excel + RDY-01 | NIE | `CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md` |
| P1 | **E1** | Nowa gra flow | częściowo | `MAPA-do-MASTER_domyslne-decyzje-nowa-gra.md` |
| P1 | **#4 DZIENNIK** | Mur +200% obrony | ✅ flaga `maMur` w main (build/load) | `UNITS-do-MASTER_bonusy-obronne-mapa.md` |

---

## Kolejka P2 — cross-lane (gdy Master przydzieli)

| Temat | Handoff |
|-------|---------|
| Plaster D2A (split praca) | `EKONOMIA-do-MASTER_plaster-D2A.md` |
| Wealth minimal D3C | `EKONOMIA-do-MASTER_wealth-minimal-D3C.md` |
| Mnożnik per-cyw | `EKONOMIA-do-MASTER_mnoznik-per-cyw.md` |
| AI wpiecie | `CYWILIZACJE-do-MASTER_ai-wpiecie.md` |
| Miasta Brązu D12A | `MAPA-do-MASTER_miasta-brazu-D12A.md` |
| Defaulty startu D13A | `CYWILIZACJE-do-MASTER_defaulty-startu-D13A.md` |
| Żelazo/Stal D14A | `CYWILIZACJE-do-MASTER_zelazo-stal-D14A.md` |
| Oblężenie tura | `UNITS-do-MASTER_oblezenie-tura.md` |
| Obrona struktur | `MAPA-do-MASTER_obrona-i-zasiegi.md` |

Pełna lista handoffów: `dyspozycje/_handoff/*-do-MASTER*`

---

## Bramka testów (obowiązkowa przed kanonem)

```powershell
cd gra
npm run typecheck
node tools/wire-ekonomia-test.cjs
node tools/logic-test.cjs
node tools/combat-test.cjs
node tools/smoke-test.cjs
npx vite build --outDir $env:TEMP\civ-dist --emptyOutDir
```

**NIE:** `npm run build` (prebuild kasuje JSON-y).

**OneDrive:** jeśli „Unexpected end of file” — „Zawsze przechowuj na tym urządzeniu” na folderze `gra/`.

---

## Skrót raportów lane (ostatni stan 2026-06-27)

| Lane | Ostatni wpis | Dla F |
|------|--------------|-------|
| **UI** | 2026-06-26 suwaki WPIĘTE | audyt P0-2 |
| **EKONOMIA** | 2026-06-27 podział per-city | migracja P0-1 |
| **UNITS** | 2026-06-26 battleScene Q2–Q7 | BLOK C2 |
| **MAPA** | handoffy | P2 |
| **CYWILIZACJE** | bonusy, start | P2 |

---

## Komunikacja z Master Silnikiem

| Kierunek | Plik |
|----------|------|
| Master → F | `docs/czaty/OD-MASTERA.md` § Grupa F |
| F → Master | `docs/czaty/DO-MASTERA.md` § Grupa F |
| F szczegóły | `dyspozycje/SILNIK-DO-MASTERA.md` |
| Master czyta F | komenda Macieja: `czaty` w czacie Master Silnik |
