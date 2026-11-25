# R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1 — ekran powitalny blokuje testy live; diplo-truce brudzi repo i pada na bramce żywności

DOMAIN: INFRA/GAME (testy live) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 547ca34b56f45a7d81da262c4720289b90d01cd2. Bez deployu, zero zmian w gra/src i gra/data (błędy gry tylko opisać jako kandydatów R-WEB-*).

## Kontekst (raport TMPLIVE: runs/R-WEB-TEST-HYGIENE-TMPDIR-LIVE-VERIFY-Q1/10-operator-claude.md i 30-obrona-claude.md)
1. army-panel-general-label-multiselect-live-test.cjs: klik zablokowany przez #civ-welcome-screen-root (ekran powitalny dodany w a3141e943) — HARNESS; prawdopodobnie dotyczy wielu testów live (grep po gra/tools: testy live bez zamknięcia ekranu powitalnego).
2. determinism-save-load-resume-live.cjs: FATAL waitForFunction 180 s także przed zmianą tmp — HARNESS (ekran powitalny? SIGSEGV? sprawdź; harness ma teraz ponawianie startu ze slotu).
3. diplo-truce-live-test.cjs: 15 pass / 1 fail — blokada końca tury (żywność, Spichlerz; komunikat z gra/src/ui/sidePanelEventFilter.ts:125, bramka z 006268ea8/c7c2ae352/a356f5e54); zapisuje zrzut do ŚLEDZONEGO pliku dyspozycje/autobot/runs/R-WEB-TRUCE-Q1/evidence/truce-01-modal-rozejm-5.png (brudzi repo).
## Zadanie
1. Znajdź wspólne miejsce zamknięcia ekranu powitalnego (helper w gra/tools, np. _chrome-path.cjs lub nowy gra/tools/_live-ready.cjs) i naprawiaj TYLKO przez helper (jedno miejsce), bez zmiany asercji; zastosuj w army-panel-…-live i determinism-save-load-resume-live; policz ile innych testów live dotyka tego samego problemu (grep) — wypisz listę, napraw wyłącznie te, które uruchomisz solo i potwierdzisz zielone (max 12), resztę zostaw jako listę kandydatów.
2. diplo-truce-live: zapis zrzutu poza repo (os.tmpdir() z _tmp-unique lub katalog podany argumentem) — plik w dyspozycje/ nie może się zmieniać po biegu (dowód: git status czysty); blokada żywności: ustal obowiązującą regułę (komunikat sidePanelEventFilter.ts:125, rejestr FAL 875–897, przewodnik): STARY-PIN (test ma wcześniej dostarczyć żywność/pominąć bramkę zgodnie z regułą — popraw), czy BŁĄD-GRY (minimalne odtworzenie + cytat reguły; kandydat R-WEB-*, test zostaje czerwony).
3. Mutacja czerwona tam, gdzie zmieniasz asercje/warunki; testy live po jednym, jeden Chromium naraz, limit 10 min; po pracy zabij WŁASNE procesy po PID.
Paczki, commit po każdej. ZAKAZ BLOCK bez blokady technicznej.
## Allowlista
gra/tools/{army-panel-general-label-multiselect-live,determinism-save-load-resume-live,diplo-truce-live}-test.cjs (ostatni z '-test'; sprawdź nazwy plików: determinism-save-load-resume-live.cjs bez '-test'), helper w gra/tools (nowy _live-ready.cjs lub _chrome-path.cjs), do 12 testów live potwierdzonych zielonymi, dyspozycje/autobot/runs/R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build tylko vite --outDir poza repo), zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po pracy usuń bundle, logi, node_modules; przywróć każdy zmodyfikowany przez test śledzony plik (git checkout -- ścieżka).
## Bramki
tsc 0; logic 213; ai-test 297/0; bramki-tmpdir-unikalnosc PASS (0 trafień). Zacommituj i zwróć SHA.
## Binarne kryterium
Testy live z listy zielone solo po naprawie helpera (surowe wyjście), diplo-truce nie zmienia plików w repo, blokada żywności sklasyfikowana z dowodem, mutacja czerwona tam gdzie zmieniono warunek; bramki zielone.
