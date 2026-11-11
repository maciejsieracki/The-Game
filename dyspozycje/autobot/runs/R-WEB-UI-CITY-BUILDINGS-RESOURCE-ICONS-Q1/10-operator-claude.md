STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1
GOAL: w wierszach budynków panelu miasta (utrzymanie, produkcja konwertera, łączne utrzymanie) nazwy surowców zastąpić ikonami z tego samego źródła co HUD/Spichlerz (mapResourceIconSvg, resources-map/) + liczby; nazwa w title/aria-label; zero nachodzenia przy 520 px.
BAZA: origin/main 546fdf6bf (detached HEAD w worktree).

ZMIANY/COMMIT:
- NOWY gra/src/ui/resourceAmountChip.ts: resourceAmountChipHtml(key, amountText, unitSuffix) — chip „liczba + ikona” (ikona przez mapResourceIconSvg, title/aria-label = nazwa surowca; tekstowy fallback tylko gdy brak SVG).
- gra/src/ui/cityPanel.ts: formatResourceUpkeepText (nowy 3. parametr perTurnUnit), formatConverterProductionRowHtml (Prod.: wejścia/wyjścia), formatBuildingUpkeepTotalHtml (bez regex na HTML), kompaktowy tytuł listy używa tych samych chipów; bn.title = nazwa budynku; CSS: .bld-owned-upkeep zawija się (white-space normal), nowe .bld-res-chip / .bld-res-chip-ic.
- NOWY gra/tools/resource-amount-chip-icons-real-render-test.cjs: test w Chromium (Playwright) na realnych funkcjach cityPanel.ts.
- NOWE zrzuty: dyspozycje/autobot/runs/R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1/evidence/resource-icons-przed-520px.png oraz resource-icons-po-520px.png.
- Nie zmieniano: liczb, logiki ekonomii, buildings.json, WERSJE.md, gra-robocza/**.
- SHA: commit czubka tej gałęzi detached (podany w odpowiedzi orkiestratorowi).

TESTY (surowe wyniki):
- tsc --noEmit: exit 0, brak linii wyjścia.
- resource-amount-chip-icons-real-render-test: PRZED 14 PASS / 15 FAIL (reprodukcja: wszystkie wiersze z nazwami surowców); PO 29 PASS / 0 FAIL (A1: 8/8 kluczy z SVG; A2: title/aria zgodne; B1/B2: 6 budynków bez nazw w tekście, każdy chip z ikoną; C1/C2 przy 520 px bez przepełnienia i nachodzenia; brak błędów strony).
- logic-test: LOGIC OK (213/213), exit 0.
- tech-tree-test: 20 pass, 0 fail.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- research-test: PASSED 33 / FAILED 0.
- combat-test: All sanity checks passed.
- citypanel-konwerter-produkcja-test: 100 pass, 0 fail.
- building-upkeep-resources-test: 48 passed, 0 failed.
- building-upkeep-ceramics-test: 649 passed, 0 failed.
- hex-tooltip-improvement-production-text-test: 19 passed, 0 failed.
- recruit-card-stock-chip-real-render-test: 15 passed, 0 failed.
- building-card-overlap-real-render-test: 21 pass, 0 fail.
- improvement-era-scaling-test: 144 PASS, 0 FAIL.
- owned-building-detail-side-test: exit 0.
- hex-tooltip-unlock-label-dedup-test: FAIL (1 asercja: Kamieniołom „odblok.” w „Możliwe ulepszenia”). PRZED ZMIANĄ: test czyta wyłącznie gra/src/ui/sidePanelHud.ts, którego diff względem 546fdf6bf ma 0 linii; zmiana nie dotyka tego pliku. Wniosek: awaria istnieje już w bazie (wnioskowanie z identyczności źródła, NIE_ZMIERZONO osobnym przebiegiem na bazie).
- git diff --check: czysto.

ZAŁOŻENIA (luki rozstrzygnięte założeniem):
1. Wiersz budynku w teście składany z powłoki CSS .bld-owned-row/-hd/-tail/-conv-row i z wyników prawdziwych funkcji formatujących; appendOwnedBuildingRow wymaga pełnego obiektu City, więc nie jest wywoływany wprost.
2. Liczby receptur konwertera w teście (Garncarnia: glina 50 + drewno 50 -> ceramika 50; Odlewnia brązu: ruda 50, drewno 50, ruda cyny 5 -> brąz 50) to fixture'y z citypanel-konwerter-produkcja-test (era 1).
3. Zrzut 520 px jest z fixture'ów, NIE z zrzutu właściciela z realnej partii. Zrzut właściciela (evidence/owner-screenshot.png) nie jest obecny w tym worktree.
4. Zakres: wiersze budynków, produkcja konwertera, nagłówek „Utrzymanie łącznie” i kompaktowy tytuł listy. Karty szczegółów (formatResourceUpkeepSummary, sekcje „Utrzymanie surowców budynków” w panelach imperium/miasta) pozostają tekstowe — poza wskazanym zakresem.
5. Ikony w wierszu mają 1,35 em (ok. 9 px przy tekście wiersza 0,66 em); czytelność potwierdzona na zrzucie 520 px, nie na żywej grze.
6. Dla temat upgrade (bn.title) tooltip nazwy jest nadpisywany łańcuchem ulepszeń — istniejące zachowanie, nie zmieniane.

BLOKADY:
- Brak zewnętrznych blokad. Nie integrowano, nie deployowano, nie pushowano.
- Uwaga poza zakresem tego dispatchu: wiadomość użytkownika w kontekście workflow dotyczy rekrutacji wodzem/administratorem w panelach ulepszeń i rekrutacji. To osobny temat i NIE jest realizowany w tym Operatorze.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1): weryfikacja zrzutów przed/po i testu 29/29; następnie Final Control po werdykcie PASS.
DEPLOY/PUSH: NIE WYKONANO
