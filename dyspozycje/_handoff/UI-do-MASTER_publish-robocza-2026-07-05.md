# UI → MASTER: publish ROBOCZA · lane ukończone (2026-07-05)

**Status:** **A1–A7 OPUBLIKOWANE** (~23:55) · blockery §4 bez zmian · ZADANIE 2 (rzeki) nadal HOLD  
**Od:** Lane UI (sesja 2026-07-05)  
**Inwentarz:** `dyspozycje/UI-INVENTORY-DESIGN-vs-GRA.md`

---

## Historia publishów roboczej (2026-07-05) — nie kasuj

| Czas (ok.) | md5 / stempel | Zakres |
|------------|---------------|--------|
| ~00:25 | `5206766b` | Panel-C export (UNITS) |
| ~21:04 | `eac24a66` | UPGRADE + ikony (audit) |
| ~23:04 | `703e6212` HUD | W4 / lane UI (stempel; plik md5 może = `eac24a66`) |
| ~23:52 | `2d9fc522` / plik `8dd89c81` | **batch A1–A7** (Master) · stempel ROBOCZA 23:52 |
| ~23:55 | POLE `057b028c` | marker `POLE-BITWY-20260705-v4.1-A4` |

**Kanon:** promocja ~08:34 `89a870fb` + później Master ~22:40 `a001606c` — **≠** najnowsza robocza (Maciej: HOLD kanon).

**Co nadal CZEKA:** playtest Macieja §3 · blockery Design §4 · merge rzek KROK 3 (Integrator ZADANIE 2) — **HOLD** Macieja.

---

## Prośba do Mastera (reszta DoD)

1. **Sprawdź** kod w `gra/src/` (lista §1 poniżej).
2. **Bramka:** `tsc` + `smoke.cjs` (+ reszta jeśli polityka projektu wymaga).
3. **Publish ROBOCZA** — skrypt integratora (§2).
4. **Playtest Macieja** — checklist §3.
5. **NIE** publikuj kanonu (`Gra-KANON.html`) w tej turze — tylko robocza.

---

## 1. Co lane UI ukończył (kod gotowy · czeka build)

### Mapa / HUD / panel boczny

| Zmiana | Plik |
|--------|------|
| Tooltip heksa — tagi Ż/P/H zamiast emoji | `gra/src/ui/hexContextTooltip.ts` |
| Overlay kultura/religia — SVG | `gra/src/ui/empireOverlayHud.ts` |
| Panel imperium — bez `/t`, nagłówki | `gra/src/ui/empireDetailPanel.ts` |
| Minimapa — refresh + klik → kamera | `gra/src/ui/minimapHud.ts` + hook w `main.ts` *(ratyfikacja SILNIK)* |
| res-cattle, res-clay SVG | `gra/src/ui/icons/brand/` |
| Ikona rekrutacji HUD bez emoji | `gra/src/ui/hud.ts` |

### Miasto W4 + budynki Design

| Zmiana | Plik |
|--------|------|
| Handel W4 — karty SVG, suwaki | `cityPanel.ts` → `renderHandelSlidersPanel` |
| Spichlerz / Zamożność W4 | `renderMagazyn` |
| Porządek — banner W4 + chipy SVG | `buildPorzadekDetailCard` |
| Praca — pasek 26px + suwak W4 (fix konfliktu CSS) | sekcja Praca |
| **Karty budynków Poziom B** (~280px, chipy, ↗ upgrade) | `buildBuildingInfocard`, `appendBuildableItemRow` |
| Ramki W4 zakładek prawej kolumny + stopka surowce | `withW4TabCard`, `appendW4TabFooter` |
| Produkcja / szczegóły budynków — emoji → SVG | chipy koszt/utrzymanie |
| Przycisk ✕ kolejki rekrutacji → `ui-close` SVG | `cityPanel.ts` |
| Okolica 3D — badge W, litery terenu | `cityOkolicaOverlay.ts` |

### Pole bitwy 3D (osobny bundel)

| Zmiana | Plik |
|--------|------|
| Popupy deploy v5 — `FMT_SVG`, chipy, Taktyka | `battleHudTheme.ts`, `battleScene.ts` |
| Ikony typów rosteru (podkowa / miecze / łuk) | `ROSTER_TYPE_SVG` |
| Ekrany końca / szczegóły (prowizorka lane) | `endScreen1E.ts`, `endDetails1E.ts` |
| Marker buildu | `BATTLE_UI_BUILD = POLE-BITWY-20260705-end-replay` w `battleScene.ts` |

**Uwaga:** ostatni publish ROBOCZA mapy = **`703e6212`** (2026-07-05 23:04). Jeśli `gra/src` zmienił się po tym czasie — **wymagany rebuild**. POLE-BITWY może być **starszy** niż kod w `battleScene.ts` — rebuild w skrypcie i tak robi osobny build.

---

## 2. Publish — komendy (Master / Integrator)

```powershell
cd gra
npx tsc --noEmit
node tools/smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist --emptyOutDir
.\tools\publish-robocza-snapshot.ps1
node ..\gra-robocza\tools\generate-start-hub.cjs
```

**Wynik oczekiwany:**
- `gra-robocza/Gra-ROBOCZA.html` — nowa pieczętka md5 (≠ `703e6212` jeśli były diffy)
- `gra-robocza/Gra-ROBOCZA-POLE-BITWY.html` — marker roster `POLE-BITWY-20260705-end-replay`
- `gra-robocza/ROBOCZA-MANIFEST.json` zaktualizowany
- `gra-robocza/START.html` — odświeżone md5 na kartach

**NIE:** `npm run build` · **NIE** `gra/dist/` (OneDrive).

---

## 3. Playtest Macieja (po publish)

**Hub:** `gra-robocza/START.html` · Ctrl+F5

| # | Gdzie | Co sprawdzić |
|---|--------|----------------|
| 1 | Gra robocza | Miasto → Buduj: **karty Poziom B** (nie lista tekstowa) |
| 2 | Gra robocza | Handel / Spichlerz / Praca / Porządek — layout W4, bez emoji |
| 3 | Gra robocza | Klik heksu — panel plonów (litery Ż/P/H) |
| 4 | Gra robocza | Minimapa — klik przesuwa kamerę |
| 5 | Pole bitwy | Deploy → R → popupy Formacja/Konnica/Linie/Taktyka — SVG v5 |
| 6 | Pole bitwy | Title rosteru = `POLE-BITWY-20260705-end-replay` |

---

## 4. BLOCKERY — nie w kodzie · Master musi routing (nie tylko publish)

**Dlaczego tego nie ma:** lane **nie dokończył** albo **czeka mockup Design**. Publish §2 **tego nie wprowadzi**.

| ID | Brak w grze | Dlaczego lane nie domknął | Właściciel następnego kroku | Akcja Mastera |
|----|-------------|---------------------------|----------------------------|---------------|
| **A-08** | Panel budowy mapy (emoji, Posterunek overlap) | Brak mockupu panelu 1E · `buildModeHud.ts` nieportowany · SVG `imp-*` leżą bez mapy | **Design START** (Maciej już prosił ≥2×) | WYMIANA P0 · wklejka `docs/ux/WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md` (sekcja A-08) · po zip → dyspozycja lane UI port |
| **HEX-C1** | Panel heksu (plony, lista ulepszeń) | Tylko provizorka (`hexContextTooltip.ts` litery Ż/P/H) · **brak mockupu C1** od Design | **Design START** | j.w. wklejka sekcja HEX · po zip → `hexContextTooltip.ts` + `sidePanelHud.ts` |
| **W4-REK** | Rekrutacja W4 + wnętrza zakładek 1:1 | Mockup W4 v2 jest · lane zrobił ramki `withW4TabCard` · **Rekrutacja** = stary `renderPurchasableUnits` · wnętrza Zdrowie/Kultura/Religia/Porządek ≠ mockup | **Lane UI batch 2** (bez Design) | Po publish §2: dyspozycja `UI.md` — port W4 v2 rekrutacja + wnętrza · ref. `Miasto Zakładki W4 v2 (1E).dc.html` |
| **IMP-MOC** | Panel Moc imperium + raporty 6C | **Zero mockupu** od Design · stary `powerOverlayHud.ts` | **Design START P0** | Brief `dyspozycje/_handoff/MASTER-do-UI_panel-moc-i-imperium.md` · wklejka `docs/ux/WKLEJKA-DESIGN-P0-IMP-MOC-C23-2026-07-05.md` |
| **C23** | Szczegóły bitwy (pełny ekran) | Design **nie dostarczył** v1 · lane ma provizorkę `endDetails1E.ts` | **Design START P0** | j.w. wklejka · po zip → `endDetails1E.ts` |
| **C12-v3** | Koniec bitwy | W repo tylko mockup **v2** · Design chce **v3** · lane ma provizorkę v2 | **Design START P0** | j.w. wklejka · po zip → `endScreen1E.ts` |

**Kanał Design (zarejestrowane 2026-07-05):** `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` → `queue_design` A-08 + HEX-CONTEXT.

**Lane winy (uczciwie):** A-08/HEX — briefy leżały w repo od 07-03/05, **nie poszły przez WYMIANA do czasu dziś** · W4 rekrutacja — lane priorytetyzował Handel/Buduj, nie domknął reszty mockupu bez Design.

**Master po publish §2:** nie obiecuj Maciejowi tych ekranów w roboczej · playtest §3 **świadomie** pomija te punkty · routing Design/lane wg tabeli.

Szczegóły inventory: `dyspozycje/UI-INVENTORY-DESIGN-vs-GRA.md` §B + §C.

---

## 5. DoD dla Mastera (publish tej tury)

- [x] Bramka zielona (tsc + smoke)
- [x] Publish ROBOCZA wykonany (batch A1–A7 ~23:55)
- [x] Nowy md5 w `UI-DO-MASTERA.md` + wpis `DZIENNIK-MASTERA.md`
- [ ] Maciej playtest §3 (**bez** oczekiwania A-08/HEX/Moc/C23 — §4)
- [ ] **Przekaż Maciejowi routing §4** (Design vs lane batch 2) — nie tylko „robocza gotowa"
- [ ] **NIE** kanon bez Opus (osobna decyzja)

**Flaga po publish:** `→ MASTER: GOTOWE-ROBOCZA-A-BATCH` · meldunek append `UI-DO-MASTERA.md` · **dołącz skrót §4 blockery**
