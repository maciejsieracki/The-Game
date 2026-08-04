# R-REKRUT-LUDNOSC-UI — teksty rekrutacji vs ludność miasta

**Data:** 2026-08-04  
**Status:** WDROŻONE (kod) · czeka deploy  
**Branch:** `cursor/fix-rekrut-ludnosc-ui-63a1`

## Problem

Intro w panelu miasta (Rekruci / Rekrutacja — szczegóły) sugerowało spadek ludności przy werbie (np. „−1 obywatela”), podczas gdy mechanika od dawna zużywa tylko pulę Manpower imperium — ludność miasta nie spada.

## Fix (kod)

`gra/src/ui/cityPanel.ts`:

- `buildTopBarRekruciDetailCard` (~4749) — „ludność miasta nie spada”
- intro Rekrutacja — szczegóły (~7316) — „Werb zużywa tylko rekrutów imperium — ludność miasta nie spada”

Bez zmiany logiki gry — tylko copy UI.

## Deploy

Osobno, na hasło `deploy`.
