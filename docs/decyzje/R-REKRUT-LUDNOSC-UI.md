# R-REKRUT-LUDNOSC-UI — teksty rekrutacji vs ludność miasta

**Data:** 2026-08-04  
**Status:** ZDEPLOYOWANE FALA 224 `38df6ad7`  
**Branch:** `cursor/fix-rekrut-ludnosc-ui-63a1`

## Audyt (Maciej)

Wrażenie: ludność spada po rekrutacji wojska.  
**Werdykt:** rekrutacja **nie** odejmuje `city.population` (`jednostka_koszt_ludnosci=0` od 2026-07-21). Realny −1 = głód / założenie miasta / bunt. Spichlerz tylko pośrednio (łatwiej o głód).

## Problem UI

Intro w panelu miasta (Rekruci / Rekrutacja — szczegóły) kłamało: „−1 obywatela”, podczas gdy mechanika zużywa tylko Manpower.

## Fix (kod)

`gra/src/ui/cityPanel.ts`:

- ~4749 — „ludność miasta nie spada”
- ~7316 — „Werb zużywa tylko rekrutów imperium — ludność miasta nie spada”

Bez zmiany logiki gry — tylko copy UI.

## Deploy

Osobno, na hasło `deploy`.
