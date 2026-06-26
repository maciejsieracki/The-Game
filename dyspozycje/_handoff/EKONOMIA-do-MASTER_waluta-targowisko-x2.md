# HANDOFF: EKONOMIA → MASTER — Handel→Pieniądz ×2 (Targowisko + Waluta, automatyczne)

**Data:** 2026-06-25. Decyzja Maciela (czat). **Superseduje** część 2A (gate „Waluta+Mennica") — gate'em jest teraz **Targowisko**, nie Mennica.

## Model (prosty, automatyczny — bez suwaka)
- Miasto produkuje **Handel**.
- Po wynalezieniu **Waluty** (tech) ORAZ wybudowaniu **Targowiska** w mieście → Handel **automatycznie** staje się **Pieniądzem** i jest mnożony **×2**. Zasób przemianowany Handel→Pieniądz (UI: pokazuj „Pieniądz" zamiast „Handel" po Walucie).
- Pieniądz dalej dzieli się istniejącym podziałem na **Skarbiec(podatek) / Wealth / Badania** → jednostki, wealth, badania.
- **Brak** osobnej konwersji Praca→Handel i **brak** dodatkowego suwaka — wszystko automatyczne.

## Co wpiąć (master, w pętli tury / ctx)
`economy.ts` już liczy `pieniadz = floor(handelNetto × %Skarbiec × ctx.mennicaMnoznik)`. Wystarczy ustawić `ctx.mennicaMnoznik`:
- `= 2` gdy `ctx.maTargowisko === true` **i** Waluta odkryta (playerState `zbadane`/`pieniadzMnoznik`),
- `= 1` w przeciwnym razie.
(Dziś `turn-economy`/`cityPanel` podają stałe `1` — to jedyna zmiana wpięcia.)
- Per-nacja: jeśli chcecie wariacji 1.7–2.4, wartość bierze CYWILIZACJE z `civs.json` (`mnoznikHandelPieniadz`); inaczej płaskie 2.

## Kolejne tiery (przyszłość, poza v0.1)
Następne currency-techy: ×10, potem ×100 (było ×100/×1000 — Maciej obniżył). `PIENIADZ_MNOZNIK=10` w `playerState` (martwa flaga) → ustaw **2** dla tieru Waluty (lub steruj tierami przez tech). Mennica = ewent. budynek wyższego tieru (×10) — do ustalenia.

## Uwaga (do zbilansowania — zadanie #31)
Po skokach przychody rosną → przeskalować koszty budynków/techów/jednostek (Maciej: „żeby nie było nieskończoności pieniędzy").
