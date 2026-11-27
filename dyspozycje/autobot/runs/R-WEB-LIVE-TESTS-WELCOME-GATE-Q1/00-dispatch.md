# R-WEB-LIVE-TESTS-WELCOME-GATE-Q1 (tag LIVEGATE) — dispatch (Operator HAIKU 5.5, runda 1/5; tylko testy i dokumentacja, ZERO zmian gra/src i gra/data)
GOAL: ustalić LICZBAMI, ile z ok. 102 testów live (gra/tools/*-test.cjs używających Chromium/Playwright i kliknięcia w interfejs) jest blokowanych przez ekran powitalny / bramkę „Zakończ turę” i naprawić je wspólnym helperem zamiast poprawiania testu po teście (task #108). Helpery istnieją: gra/tools/_live-ready.cjs (prepareEndTurnGate, z NNSQ12) i helper Chrome z CHROMEHELPER (ponawianie startu ze slotu). Reguła właściciela: testuj na poziomie MAKSYMALNYM.
## Zadanie
1. INWENTARYZACJA: wylistuj testy live (grep po launch/chromium/playwright/page.click w gra/tools), pogrupuj wg sposobu startu gry (civTest hak / kreator / ekran powitalny / bez UI).
2. POMIAR: uruchom reprezentatywną próbkę (co najmniej 20 testów, w tym wszystkie z kliknięciem w „Zakończ turę” lub w przyciski HUD), każdy z timeoutem; klasyfikacja: PASS / FAIL z powodem „ekran powitalny/bramka” / FAIL z innym powodem / TIMEOUT / crash Chromium (SIGSEGV, znany ~t18 — ponów ze slotu wg helpera).
3. NAPRAWA: tam, gdzie powodem jest ekran powitalny lub bramka tury — użyj wspólnego helpera (rozszerz _live-ready.cjs minimalnie, np. funkcja dismissWelcome/ensureGameReady) i przepnij testy wsadowo (skrypt migracyjny + diff), bez zmiany asercji merytorycznych. Testy z innym powodem: tylko klasyfikacja do dokumentu (kandydaci na osobne tematy), bez naprawy.
4. Dokument dyspozycje/analizy/TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md: tabela test | start | wynik przed | wynik po | powód; NIE ZMIERZONO tam, gdzie nie zmierzono (np. testy poza próbką).
5. Mutacja: helper bez dismissWelcome → wybrany test czerwony; z helperem zielony.
## Allowlista
gra/tools/_live-ready.cjs, gra/tools/*-test.cjs (WYŁĄCZNIE przepięcie startu/bramki na helper), nowy skrypt migracyjny w dyspozycje/analizy/ lub gra/tools/, dyspozycje/analizy/TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/**.
## Zakazy
gra/src i gra/data (jeśli test wykaże błąd gry — opisz jako kandydata, nie naprawiaj), gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; Chromium /opt/pw-browsers/chromium), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; po pracy usuń node_modules/tmp. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela.
## Bramki
tsc 0 (bez zmian w src); logic 213; ai-test 297/0; testy przepięte zielone jak przed zmianą (lub NIE ZMIERZONO z powodem). BAZA: args.cand = origin/main (6319eaf662d6055490a37f5f580f9c81d2feec58) — `git merge-base --is-ancestor` i `git rev-parse HEAD` w raporcie.
## Binarne kryterium
Tabela z liczbami (próbka >= 20 testów); testy zablokowane ekranem powitalnym naprawione wspólnym helperem z mutacją czerwoną; zero zmian w gra/src i gra/data.
