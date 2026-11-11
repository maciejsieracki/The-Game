STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-HTML-IN-RECRUIT-PANEL-STOCK-Q1
GOAL: chipy surowców w panelu Rekrutacja (i wszędzie indziej) renderują się jako ikona+liczba, nie jako surowy HTML.
ZMIANY/COMMIT: brak zmian kodu w obronie; kod = kandydat a954769c3ca1eef632d4e4a7222b286fdae83561 (empireDetailPanel.ts, test ui-resource-chip-no-raw-html-test.cjs). Zmieniony tylko ten plik raportu.

ODPOWIEDZI NA ZARZUTY EVALUATORA (status Evaluatora: PASS-WITH-NOTES, zarzuty nieblokujące):
1. ODRZUCAM jako defekt kodu; PRZYJMUJĘ jako udokumentowane ograniczenie pokrycia (NIE_ZMIERZONO). Zarzut sam mówi: "to nie regresja kodu". Sweep DOM toastów/tooltipów/HUD w żywej grze nie został wykonany; zakres pokryty testem Chromium (panel Rekrutacja, karta encji, chipy) + audytem statycznym. Dowód statyczny dla pozostałych powierzchni (odczyt w tej rundzie): konsumenci resourceAmountChipHtml w cityPanel.ts 6854, 6942, 7017/7024, 7902, 8356, 8369 oraz empireDetailPanel.ts 1022, 1090 wstawiają wynik wprost do szablonów HTML (span/join/gridDetailRow), bez esc(); entityCards/renderer.ts 135/192/203 używa innerHTML z kwotą escapowaną escapeHtmlText. Jedyny przypadek chipa w esc() był w empireDetailPanel.ts (naprawiony). Nie dopisuję sweepa na żywej grze: wykracza poza rundę obrony (bez nowego kodu), nie wykazano wadliwego miejsca; ocena zostaje Final Control.
2. ODRZUCAM (zarzut informacyjny, potwierdza poprawność). cityPanel.ts:6614-6617 fillIconElement: innerHTML dla '<svg', inaczej textContent. Wywołania fillIconElement (6621, 6631, 6637, 6643, 7264, 8225, 8251, 9207) dostają buildingIconHtml/unitIconHtml/productionItemIconHtml, nigdy chipa surowca. Chipy (iconHtml z resourceAmountChipHtml, 6831, 7128) trafiają tylko do buildingReqChipSpan (7194-7196, `${chip.iconHtml}${chip.label}` w szablonie HTML). Ścieżka textContent nie dotyczy chipów.

TESTY: nie uruchamiałem ponownie (brak zmian kodu od kandydata). Wyniki Evaluatora (raport c4df32204): tsc exit 0, test chipów 9/0, mutacja 6 PASS / 3 FAIL, logic-test 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6, empire-mass-recruitment 45/0, recruit-panel-no-inner-scroll 17/0. W tej rundzie: git diff --stat 6ade0f0ec..a954769c3 = 5 plików (raport, 2 PNG, empireDetailPanel.ts 1 linia, test), zgodnie z allowlistą.
BLOKADY: brak
RUNDY: obrona po rundzie 1/5
NASTĘPNY KROK: Final Control (ocena zarzutu 1 jako ograniczenia pokrycia).
DEPLOY-PUSH: NIE WYKONANO
