STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - UI z-order plakietki oblezenia
TEMAT: R-WEB-SIEGE-BADGE-ZORDER-Q1
GOAL: plakietka "OBLEZENIE" (nakladka swiata) lezy POD panelami/oknami/tooltipami/toastami UI, NAD terenem; bez zmiany wygladu/logiki.

POMIAR PRZED (plik:linia, baza ac3698a97):
- gra/src/main.ts:16140 (refreshSiegeHtmlLabels): `div.civ-siege-html-label`, `position:fixed; z-index:340`, doklejany do document.body.
- Stos z-index (zrodla): winieta .civ-ux-dim-full 298 (cityUxFrame.ts:59), panel boczny 305 (sidePanelHud.ts:162), .civ-hud 310 (hud.ts:581), panel kontekstu 310, panele listy/jednostki/budowy 311, banner budowy 312, nauka 313-314, toast #civ-hint-toast 320 (main.ts:2026), tooltip weterana 325 (main.ts:2041), diplo backdrop 330, ghost chip/ramka UX/modale 400+.
- Plakietka 340 > panele 305-330, toast 320, tooltip 325 => przebijala je (potwierdzone zrzutem/mutacja 340: panel 305/311, toast 320, tooltip 325 NIE zaslaniaja plakietki; tylko modal 400 zaslania).
- Inne nakladki miast: nazwy/pigulki miast to sprite'y w scenie 3D (cityMapStatChip, siegeMarker) - nie DOM, nie dotyczy. Jedyna DOM-nakladka swiata z tym bledem: plakietka oblezenia (NIE_ZMIERZONO: nakladki w trybach bitwy/preBattle - poza zakresem).

NAPRAWA:
- NOWY gra/src/ui/worldOverlayLayer.ts: `WORLD_OVERLAY_Z_INDEX = 250` (< 298 najnizsza warstwa UI, > kanwa 3D z-index auto).
- gra/src/main.ts: import + `'z-index:' + WORLD_OVERLAY_Z_INDEX` (2 linie +, 1 -). Wyglad, tresc, logika bez zmian.

ZMIANY/COMMIT: allowlista: gra/src/ui/worldOverlayLayer.ts (nowy), gra/src/main.ts, gra/tools/siege-badge-zorder-test.cjs (nowy, statyczny), gra/tools/siege-badge-zorder-live-test.cjs (nowy, Chromium), runs/R-WEB-SIEGE-BADGE-ZORDER-Q1/**. SHA: patrz git log (commit tej rundy zawiera ten raport).

TESTY:
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- siege-badge-zorder-test.cjs: PASS=13 FAIL=0 (gate-static.txt); mutacja z-index 340 => 7 FAIL (wykryta), przywrocono 250.
- siege-badge-zorder-live-test.cjs (Chromium, zywa gra ?playtest=mapa&civTest=1, build vite poza repo): PASS=17 FAIL=0 (gate-live.txt). Pomiar: zLabel=250, hud=310, toast=320, side=305. elementFromPoint: bez nakladek = plakietka (nad terenem); sondy z=305/311/320/325/400 zaslaniaja plakietke; MUTACJA 340: sondy 305-325 NIE zaslaniaja (stary blad odtworzony), 400 zaslania.
- Zrzuty JPEG <=26 KB: po-panel-nad-plakietka.jpg, po-plakietka-nad-terenem.jpg, przed-mutacja-340.jpg (PRZED = wymuszona mutacja 340 na budowie PO, nie osobny build bazy).
- Regresje PRZED vs PO: city-map-badge 62/0, map-siege 6/0, siege-surrender-forecast 56/0, hint-toast-zindex-empire-panel 18/0, hud-tooltip-body-mounted-panels 16/0; load-fail-toast-zindex-test 12/3 IDENTYCZNIE na bazie i po zmianie (blad istniejacy, parser showHintMessage w tescie; poza zakresem) .
- Panel boczny/miasta/imperium/modal/tooltip: reprezentowane sondami o realnych z-index (nie otwierano realnych paneli w grze - NIE_ZMIERZONO dla realnych instancji; z-index paneli odczytane ze zrodel i zweryfikowane statycznie).

BLOKADY: brak. Notatka: load-fail-toast-zindex-test.cjs czerwony na bazie (3 FAIL) - do osobnego tematu.
RUNDY: 1/5
NASTEPNY KROK: Evaluator R1. Po wdrozeniu REPIN Rust (warstwy UI) notuje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
