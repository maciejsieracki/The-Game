# DODATEK orkiestratora (R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1, 2026-11-12)
BAZA: origin/main 81e357dee. MODEL: Operator HAIKU 5.5, Obrona HAIKU, Evaluator/FC SONNET (CLAUDE.md zasada modeli). Priorytet: błąd blokujący grę — pierwszy w kolejce.
Wskazówki: pomiar najpierw (licznik zdarzeń przez window.addEventListener('error') w skrypcie testu, nie w kodzie gry); w poprawce unikaj rozwiązań maskujących (np. wyciszanie wszystkich błędów window.onerror — ZAKAZANE, tylko ten jeden komunikat). Jeśli okaże się, że przyczyna jest inna niż hipoteza — napisz to w raporcie z dowodem i zaproponuj poprawkę, nie zgaduj. Nie integrujesz, nie pushujesz. ŚRODOWISKO: worktree, npm ci --ignore-scripts, zakaz npm run build/dev (vite przez node ./node_modules/vite/bin/vite.js build --outDir <tmp> do testu live), tsc --noEmit, Chromium przez Playwright z /opt/pw-browsers/chromium.

## DODATEK 2 (właściciel, 2026-11-12): drugi wyzwalacz tej samej pętli
Zrzut właściciela: overlay BOOT ERROR pojawia się TAKŻE w momencie kliknięcia „Więcej szczegółów” w karcie jednostki (sidePanelHud.ts ~597, hexContextTooltip.ts ~739; przycisk data-sp-expand). Ten przycisk poszerza kartę o UNIT_CARD_EXPAND_EXTRA_W_PX (minimapLayout.ts, 280 px) = zmiana układu, którą obserwuje ta sama pętla RO. Dodatkowe kryteria:
(g) pomiar licznika „ResizeObserver loop” także dla kliknięcia „Więcej szczegółów” i „Mniej szczegółów” w karcie jednostki (oba przed i po poprawce);
(h) po poprawce overlay BOOT ERROR nie pojawia się przy tym kliknięciu.
Jeśli po naprawie cityUxFrame wyzwalacz z pkt (g) nadal produkuje zdarzenia — to inna przyczyna (np. inny obserwator lub wyjątek JS w obsłudze data-sp-expand); zbadaj i napraw przyczynę, zakres allowlisty bez zmian, a raport opisz z dowodem.
