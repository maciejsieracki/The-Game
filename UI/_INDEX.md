# Civ/UI/ — katalog dzialu Civ-UI (interfejs)

Wszystkie DOSTARCZANE pliki UI w jednym miejscu (master nie musi szukac po Civ root).

## Dokumentacja + panel sterowania
- Spec-UI.md — pelna dokumentacja deweloperska UI.
- UI-parametry.xlsx — panel parametrow UI (Naster/Maciej). Eksport celowany -> gra/data/ui-params.json.

## Podglady (interaktywne, NIE kanon)
- Gra-podglad-UI.html — widok miasta.
- Gra-podglad-MENU.html — menu glowne + ustawienia.
- Gra-podglad-HUD.html — HUD w grze + Bilans + Zadowolenie/Porzadek.

## Makiety-zrodla UI (przeniesione tu — pyt. 5B)
- Makieta-HUD-mapa-swiata.html — HUD w grze.
- Makieta-flow-nowa-gra.html — kreator nowej gry.
  (Handoff do mastera o aktualizacje ARCHITEKTURA-PLIKI.md + MAPA: dyspozycje/_handoff/UI-do-MASTER_makiety.md)
- _archiwum/Makieta-widok-miasta.html — STARY mockup widoku miasta (historyczny).
- Widok-miasta.html — NIE tutaj: lezy w Civ/MIASTO/ (przejete przez MIASTO). cityPanel.ts juz to implementuje.

## CELOWO NIE w tym folderze
- Kod gry (src/ui/*): cityPanel.ts, mainMenu.ts, newGameFlow.ts, hud.ts, empireBalance.ts,
  orderPanel.ts, uiParams.ts, preBattle.ts + dane gra/data/ui-params.json. Zostaja w projekcie Vite.
- Kanal: dyspozycje/UI.md + dyspozycje/UI-DO-MASTERA.md (czyta self-check + master).
