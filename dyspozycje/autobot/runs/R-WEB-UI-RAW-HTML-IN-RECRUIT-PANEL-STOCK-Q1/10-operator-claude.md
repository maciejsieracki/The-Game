STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-HTML-IN-RECRUIT-PANEL-STOCK-Q1
GOAL: chipy surowców w linii „Magazyn" panelu Rekrutacja imperium renderują się jako ikona+liczba (nie surowy HTML); audyt wszystkich miejsc użycia chipów; twardy test regresyjny.

ZMIANY/COMMIT:
- gra/src/ui/empireDetailPanel.ts:2955 — `<b>${esc(stock)}</b>` -> `<b>${stock}</b>` (stock to już HTML z resourceAmountChipHtml; chip escapuje label w title/aria-label przez escapeAttr, kwotę dostarcza formatRawCount — liczba; ochrona XSS zachowana, escapowanie raz we właściwym miejscu).
- gra/tools/ui-resource-chip-no-raw-html-test.cjs (nowy) — test Chromium przez Vite HTTP (createServer), prawdziwe ikony.
- evidence/przed/recruit-pool.png, evidence/po/recruit-pool.png (zrzuty).

AUDYT (stan origin/main 6ade0f0ec):
| plik:linia | co renderowane | ocena | działanie |
|---|---|---|---|
| empireDetailPanel.ts:2940-2955 | stock chipy -> esc() w <b> | BŁĘDNE (podwójny escape) | naprawione |
| empireDetailPanel.ts:1022, 1090, 1880, 1988 | formatResourceUpkeepEmpireLine(+Colored) -> miniRow/HTML | poprawne | brak |
| cityPanel.ts:4935/4947 | formatResourceUpkeepSummary, html:true -> innerHTML | poprawne | brak |
| cityPanel.ts:6057,6073,8192,7902 | gridDetailRow -> innerHTML (cpInlineIcons nie escapuje) | poprawne | brak |
| cityPanel.ts:6831,7128 (iconHtml) -> buildingReqChipSpan | template/innerHTML | poprawne | brak |
| cityPanel.ts:6854,6900-6934,9706,9770 | upkeep/konwerter -> HTML | poprawne | brak |
| cityPanel.ts:8356,8369 -> unitRecruitCard.ts:272,291 | stockChipsHtml/resourceUpkeepChipsHtml -> innerHTML | poprawne | brak |
| cityPanel.ts:6616 fillIconElement | textContent tylko gdy nie <svg (nie chip) | poprawne | brak |
| entityCards/renderer.ts:135,192,203 | chip.innerHTML, kwota przez escapeHtmlText | poprawne | brak |
| main.ts:1821,4747,4889,18368,39121; siegeMapPanel.ts:334; empireRecruitPanel.ts:132,153 | zwykły tekst „N Etykieta" (bez chipów) w toastach/hintach | poprawne | brak |

Wynik: jedyny realny przypadek to empireDetailPanel.ts:2955. Grep esc(...Chip|iconHtml|...) oraz textContent/title/aria-label z helperami chipów: 0 trafień poza tym. Tooltipy/title używają zwykłego tekstu.

TESTY (surowe wyjście):
- ui-resource-chip-no-raw-html-test.cjs: 9 PASS, 0 FAIL (Chromium; Rekrutacja/Magazyn 364/937/4 z 3 ikonami svg; karta encji resources+valueParts; XSS kwota/klucz).
- MUTACJA (przywrócone esc(stock)): 6 PASS, 3 FAIL — textContent zawiera "<span", "class=\"bld-res-chip", "<svg"; zrzut przed/ pokazuje dokładnie surowy kod ze zgłoszenia. Po cofnięciu mutacji zielono.
- tsc --noEmit: 0 błędów.
- logic-test 213/213; tech-tree-test 20 pass 0 fail (dokument ref.: 19 — dryf punktu odniesienia, nie regresja); research-test 33/33; unit-replace-test 21/21 (ref. 13 — jw.); combat-test 6/6.
- empire-mass-recruitment-test 45/45; empire-recruit-panel-no-inner-scroll-test 17/17.
- NIE ZMIERZONO: sweep DOM wszystkich paneli miasta/toastów/HUD w żywej grze (pokryte audytem statycznym + testem sekcji imperium i karty encji).

BLOKADY: brak
ZAŁOŻENIA: test używa danych syntetycznych (stock glina 364, drewno 937, kamien 4) na prawdziwych modułach UI.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
