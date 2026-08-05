# BUG-DYPLO-PANEL-OVERLAP-Q1 — panel dyplomacji vs panel jednostki

**Status:** 🟢 WDROŻONE (2026-08-05) — branch `cursor/fix-dyplo-panel-overlap-63a1`  
**Źródło:** Maciej 2026-07-29 ~01:06 · odpowiedź 2026-08-05 (literówka „UG-” = BUG-)

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **BUG-DYPLO-PANEL-OVERLAP-Q1** | **A** | Napraw teraz — przy otwartej dyplomacji nie nachodzić na panel jednostki |

## AC

1. Gdy otwarta audiencja / lista dyplo / panel dyplo: panel jednostki (side context / karta jednostki) **nie nachodzi** wizualnie (ukryty lub odsunięty). ✅
2. Po zamknięciu dyplo: panel jednostki wraca, jeśli jednostka nadal zaznaczona. ✅
3. ZAKAZ zmiany silnika dyplomacji / PW — tylko UI layout / show-hide. ✅
4. Test: helper `isDiploObscuringUnitDock()` w `unitCtxDockDiploGate.ts` + ścieżka kodu poniżej. ✅

## Dowód wdrożenia (2026-08-05)

### Przyczyna overlapu

- Karta jednostki: `.civ-side-ctx-dock` — `left: SIDE_PANEL_LEFT`, `z-index: 316` (`sidePanelHud.ts`).
- Lista dyplo: `.civ-diplo-list-hud` — ten sam `left`, `z-index: 311` (`diploListHud.ts`) → karta jednostki **nad** listą.
- Audiencja: pełny overlay `z-index: 400`, ale karta jednostki nadal renderowana (widoczna na krawędzi / interakcja).

### Fix (przed → po)

| Przed | Po |
|-------|-----|
| `sidePanelHud.render()` zawsze pokazuje unit dock gdy `getContextPanel().kind === 'unit'` | Gdy `isDiploObscuringUnitDock()` → unit dock **nie** dostaje klasy `open` (ukryty) |
| Otwarcie dyplo bez odświeżenia side panel | `notifyDiploUiVisibilityChange()` w `show`/`hide` listy i audiencji → `refreshSidePanel()` |
| Brak wspólnego helpera | `unitCtxDockDiploGate.ts`: checker z `hud.ts` (`isDiploListHudOpen \|\| isDiplomacyAudienceOpen`) |

### Ścieżka repro + oczekiwany wynik

1. Mapa → zaznacz jednostkę → karta w lewym docku widoczna.
2. Toolbar **Dyplomacja** (lista) **lub** audiencja z listy → karta jednostki **znika**.
3. Esc / zamknij dyplo → przy nadal zaznaczonej jednostce karta **wraca**.

### Pliki

- `gra/src/ui/unitCtxDockDiploGate.ts` — nowy: `isDiploObscuringUnitDock()`, notify/listener
- `gra/src/ui/sidePanelHud.ts` — gate w `render()` dla unit ctx
- `gra/src/ui/hud.ts` — rejestracja checkera + listener → `refreshSidePanel()`
- `gra/src/ui/diploListHud.ts` — notify przy `show` / `closeList`
- `gra/src/ui/diplomacyAudience.ts` — notify przy `showDiplomacyAudience` / `hideDiplomacyAudience`

### Bramka

`npx tsc --noEmit` z `gra/` — **0 błędów** (2026-08-05).

### Uwaga

`diplomacyPanel.ts` (panel relacji po prawej) — poza overlapiem z lewym dockiem; nie w checkerze.

## Evaluator (AutoBot warstwa 2 — 2026-08-05)

**Werdykt:** **PASS**  
**Tip:** `3e03514` · branch `cursor/fix-dyplo-panel-overlap-63a1`

| # | Oś | Wynik |
|---|-----|-------|
| 1 | SCOPE — tylko UI (`unitCtxDockDiploGate.ts`, `sidePanelHud.ts`, `hud.ts`, `diploListHud.ts`, `diplomacyAudience.ts`); zero `gra/src/game/diplomacy*` / PW / save | ✅ PASS |
| 2 | AC — `isDiploObscuringUnitDock()` → unit dock bez klasy `open`; `notifyDiploUiVisibilityChange()` przy show/hide listy + audiencji → `refreshSidePanel()` | ✅ PASS |
| 3 | STRICT — ścieżka repro: zaznacz jednostkę → dyplo lista/audiencja → dock ukryty; Esc/close → dock wraca przy nadal zaznaczonej jednostce (`hideUnitDock` w `render()`) | ✅ PASS |
| 4 | STRICT-SAVE — brak nowych pól persist; checker/listenery tylko w runtime UI | ✅ PASS |
| 5 | Bramki — `cd gra && npx tsc --noEmit` **0 błędów** (evaluator 2026-08-05) | ✅ PASS |
