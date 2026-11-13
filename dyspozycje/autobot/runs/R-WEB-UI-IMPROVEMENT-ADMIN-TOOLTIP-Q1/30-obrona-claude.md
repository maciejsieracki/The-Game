STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1
GOAL: w treści panelu „AUTOMATYZACJA ULEPSZEŃ TERENU" krótki komunikat, pełne wyjaśnienie, koszt i utrzymanie w tooltipie najechanego elementu. Bez zmiany mechaniki, progów, kosztów i stanów.
BAZA: origin/main 81e357dee; KANDYDAT OBRONY START: 06cf385e5739fd014de142170108afab7e500b13 (Evaluator 8cd3a14f3)
ROLA: Operator, obrona po ocenie Evaluatora (Haiku, runda obrony)

ODPOWIEDZI NA ZARZUTY EVALUATORA:

1. (f) zrzut z żywej gry: PRZYJMUJĘ CZĘŚCIOWO.
   - Wykonano: zrzuty Chromium 1440x900 w evidence/ (harness: prawdziwy buildModeHud.ts w bundle esbuild, bez pełnej gry):
     - evidence/po-zmianie-brak-administratora-1440x900.png (po zmianie, najechanie na podpowiedź: tooltip z pełnym tekstem widoczny),
     - evidence/po-zmianie-nie-pracuje-1440x900.png (zatrudniony, nie pracuje),
     - evidence/przed-odtworzenie-dlugiego-tekstu-1440x900.png (PRZED = rekonstrukcja: długi tekst w treści przez mutację testu, NIE zrzut z bazy 81e357dee).
   - Test sprawdza najechanie: po hover na [data-imp-admin-hint] element .civ-build-lock-tip ma display:block i pełny tekst (S1, S2).
   - NIE ZROBIONO: zrzutu z żywej, uruchomionej gry (serwer gry nie był uruchamiany; zakaz npm run build/dev w gra/). Native title nie jest renderowany w zrzutach headless, dlatego widoczność tooltipa dowodzona jest przez lock-tip, nie przez natywny title.

2. (c) przycisk disabled bez wrappera: ODRZUCAM (z dowodem).
   - Przycisk [data-imp-admin-open] jest disabled tylko przy hardBlock (buildModeHud.ts ~l.180–189: `hardBlock = !st.hired && ...blockReasonText !== null`).
   - Atrybut title tego przycisku NIE został zmieniony w tym temacie (linia `title="${title...}"` jest identyczna w bazie i kandydacie; zmienia się tylko komentarz i notatka pod nim).
   - Wyjaśnienie (wyjaśnienie + koszt + utrzymanie) jest na elemencie nieaktywnym NIE: notatka div [data-imp-admin-hint] nie ma disabled, więc mouseenter działa; test S1 sprawdza najechanie na tę notatkę.
   - Test (c) sprawdza title przycisków disabled (pre-existing blockReasonText zawierający „Wymaga administratora ulepszeń"). Nie twierdzę, że natywny title disabled przycisku pokazuje się we wszystkich przeglądarkach (ryzyko zostawiam FC).

3. Odstępstwo od DODATKU (showLockTip zamiast title): PRZYJMUJĘ (poprawka + commit).
   - Dwie notatki [data-imp-admin-hint] (brak administratora; nie pracuje) mają teraz `data-lock-hint` zamiast `title`.
   - Dodano wiązanie: querySelectorAll('[data-found-city][data-lock-hint], [data-imp-admin-hint][data-lock-hint]') → showLockTip / hideLockTip (buildModeHud.ts, blok po renderze panelu).
   - Atrybut title z tych notatek usunięty (brak podwójnego tooltipa).
   - Notatki państwa/miasta (data-ulepszenia-locked-note, civ-build-auto-eff) pozostają z natywnym title: nie były w zakresie DODATKU (DODATEK dotyczy hintu administratora). Odnotowane jako pozostawione.

4. Drobne:
   a) Nieśledzony katalog gra/tools/.improvement-admin-tooltip-tmp/: PRZYJMUJĘ. Sprzątanie przeniesione do cleanTmp() wywoływanego przed process.exit i w catch (test nie zostawia katalogu; po przebiegu `ls gra/tools/.improvement-admin-tooltip-tmp` → brak).
   b) Koszt jako zwykły tekst „40 Pieniądza” zamiast ikon: ODRZUCAM ikony (z dowodem). showLockTip ustawia lockTip.textContent = '🔒 ' + text (buildModeHud.ts ~l.546), czyli nie renderuje HTML; ikony wymagałyby zmiany mechanizmu tooltipa poza zakresem tematu. Tekst pozostaje czytelny i zgodny z polszczyzną UI.
   c) tools/live-verify-improvement-administrator.cjs czyta textContent [data-imp-admin-hint] (teraz zwraca krótki tekst): ODRZUCAM edycję. Plik jest poza allowlistą (allowlista: gra/tools/*-test.cjs). Zostawiam jako dług do zgłoszenia orkiestratorowi (do dostosowania przy następnej weryfikacji na żywo).

ZMIANY-COMMIT:
- gra/src/ui/buildModeHud.ts: notatki administratora z data-lock-hint (bez title); rozszerzone wiązanie showLockTip; (wcześniejsze zmiany kandydata 06cf385e5 bez zmian).
- gra/tools/improvement-admin-tooltip-real-render-test.cjs: odczyt data-lock-hint (hintLock), test najechania (lock-tip shown + tekst) dla S1 i S2, zrzuty do evidence/, cleanTmp() na każdej ścieżce wyjścia.
- dyspozycje/autobot/runs/R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1/evidence/*.png (3 zrzuty 1440x900).
- dyspozycje/autobot/runs/R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1/30-obrona-claude.md (ten raport).
- Commit: SHA końcowy w polu sha odpowiedzi orkiestratora (commit zawiera kod, test, zrzuty i raport). Allowlista zachowana: brak WERSJE.md, JSON, rust-port, auto-build-gate.ts.
- git diff --check: czysto (brak wyjścia, exit 0).

TESTY (surowe wyjście, uruchomienie na commicie obrony, gra/ z npm ci --ignore-scripts, bez build/dev):
- npx tsc --noEmit: exit 0 (bez wyjścia).
- node tools/improvement-admin-tooltip-real-render-test.cjs: 14 pass, 0 fail, exit 0 (poprzednio 12 pass; dodano 2 testy najechania).
  - S1 (a): wszystkie komunikaty w treści ≤ 60 znaków: PASS.
  - S1 (b): pełny tekst w data-lock-hint (Auto-ulepszenia…, Koszt 40 Pieniądza, utrzymanie 2 Pieniądza na turę): PASS.
  - S1 najechanie: .civ-build-lock-tip shown=true, text „🔒 Auto-ulepszenia terenu w tym mieście wymagają działającego administratora ulepszeń. Kliknij przycisk, aby zobaczyć, czym jest administrator i co daje. Koszt 40 Pieniądza, utrzymanie 2 Pieniądza na turę.”: PASS.
  - S1 (c): zablokowane przyciski mają title z „Wymaga administratora ulepszeń”: PASS.
  - S2 najechanie i (b) „brak środków w skarbcu państwa” w data-lock-hint: PASS.
  - (d) mutacja (długi tekst w treści) wykryta przez kryterium (a): PASS.
  - (e) brak błędów konsoli/pageerror: PASS.
- tools/logic-test.cjs: exit 0, „LOGIC OK (213/213)”.
- tools/tech-tree-test.cjs: exit 0, „tech-tree-test: 20 pass, 0 fail”.
- tools/research-test.cjs: exit 0, „ALL GREEN”.
- tools/unit-replace-test.cjs: exit 0, „WSZYSTKIE TESTY ZIELONE (21/21)”.
- tools/combat-test.cjs: exit 0, „All sanity checks passed.”.
- tools/improvement-administrator-test.cjs: exit 0, „53 passed, 0 failed”.
- Nie uruchamiano ponownie: empire-panel-miasto-obywatele-content-test (wg Evaluatora: dług bazowy esbuild .svg, identyczny na 81e357dee; nie dotykany tym tematem).
- NIE_ZMIERZONO: liczba asercji w gate'ach poza wypisanymi wyżej (wyjście z ostatniej linii i exit code).

BLOKADY: brak w zakresie tematu. Otwarte: żywa gra (zrzut i natywny tooltip w prawdziwej grze) do wykonania przez orkiestratora; tools/live-verify-improvement-administrator.cjs do dostosowania (poza allowlistą).

RUNDY: 2/5 (obrona po ocenie 1 Evaluatora)

NASTĘPNY KROK: Final Control na commicie obrony (SHA w odpowiedzi); orkiestrator decyduje o zrzucie live (f) i o live-verify.

ZAŁOŻENIA:
- Zrzuty z harnessu (real Chromium + buildModeHud.ts) uznane za dowód wizualny zastępczy; „przed” jest rekonstrukcją mutacją.
- Natywny title na disabled przycisku nie jest gwarantowany przez test; wyjaśnienie dostępne przez notatkę (nie disabled).
- Notatki państwa/miasta zachowują natywny title (poza zakresem DODATKU).

DEPLOY/PUSH: NIE WYKONANO
