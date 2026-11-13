STATUS: PASS-WITH-NOTES
TEMAT: R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1 — Obrona r1

Zarzut 1: ODRZUCAM (nieblokujący). Dowód behawioralny = gate-live-10-tur.txt (Chromium, 5/5 true) + mutacja AUTO_BUILD_ENABLED_DEFAULT=true daje FAIL (potwierdził Evaluator). Test jednostkowy bramki wykonuje czystą funkcję; sondy tekstowe pilnują okablowania.
Zarzut 2: PRZYJMUJĘ. cityPanel.ts: Zarządca ⚙ przy OFF ma disabled + aria-disabled, a listener ignoruje klik. Test autobuild-toggle-test 39/0.
Zarzut 3: ODRZUCAM. autoManageCity jest PURE (auto-manage.ts docstring "nie mutuje"); main.ts konsumuje wyłącznie amDecision.enqueue (37092-37103), workedTiles i pracaSplit są odrzucane. Za bramką jest jedyny efekt budowy.
Zarzut 4: PRZYJMUJĘ. main.ts onAutoBuildToggle woła updateHud() i refreshCityPanelIfOpen(). Test sondą + mutacja (usunięcie refresh daje FAIL). Nie sprawdzono na żywo w Chromium (NIE_ZMIERZONO).
Zarzut 5: ODRZUCAM jako zarzut do kodu (NIE_ZMIERZONO uczciwie; auto-improvements.ts i ai.ts nietknięte, test to sprawdza; ai4-popyt 18 FAIL identycznie na bazie).
Zarzut 6: kosmetyka, NIE_ZMIERZONO, bez zmian.
Zarzut 7: po stronie orkiestratora (scalenie na świeżym main, powtórka testu układu 13 kart).
