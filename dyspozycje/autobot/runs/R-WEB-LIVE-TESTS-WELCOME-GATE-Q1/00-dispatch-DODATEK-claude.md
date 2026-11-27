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

---
# DODATEK RUNDA 2/5 (Operator HAIKU 5.5; r1 = FC FAIL: nic nie przepięte)
BAZA: args.cand = cf8c26b225162557cb2f7d8c72e7c812f67a4820 (kandydat r1 po obronie; potomek 6319eaf66; refs/keep/LIVEGATE-r1-obrona; raport FC fdb7c6636 = refs/keep/LIVEGATE-r1-fc). `git merge-base --is-ancestor 6319eaf66 <cand>`.
## Co ustalono w r1 (obrona, sondy na żywym buildzie, civSeed 4242, Mały)
Ekran powitalny jest OTWARTY od tury 1 i ZASŁANIA przycisk „Zakończ turę” (9/9 sond); bramka tury blokuje turę 1 (skarbiec −2). Mutacja: klik bez zamknięcia ekranu = CLICK-FAIL (przechwycenie), z closeCivWelcome + prepareEndTurnGate = CLICK-OK (tura 1→2→5). Wniosek r1 „0 blokowanych” WYCOFANY.
## NAPRAW (FC, wszystkie obowiązkowe)
1. PRZEPNIJ na wspólny helper (gra/tools/_live-ready.cjs: closeCivWelcome + prepareEndTurnGate; jeśli brak wspólnej funkcji ensureGameReady — dodaj minimalnie) wszystkie testy live klikające „Zakończ turę” / HUD i zablokowane ekranem lub bramką: co najmniej forced-war, era-change-toast, diplo-truce*, sidepanel-diplo, end-turn-gate, end-turn-block-event, end-turn-input-stability oraz każdy test z listy r1 sklasyfikowany jako „ekran/bramka” lub „endTurn nie stabilizuje się”. Zmiana wsadowa (skrypt migracyjny + diff), asercji merytorycznych NIE zmieniaj.
2. BIEG PRZED/PO na tych testach (timeout ≤280 s każdy, load maszyny sprawdzaj `uptime`) z SUROWYMI logami zapisanymi w repo (dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/logi/ + sha256), tabela test | przed | po | powód.
3. gateInfo/canEnd dla testów forced-war, era-change-toast, diplo-truce, sidepanel-diplo, end-turn-gate, end-turn-block-event: odczytaj i opisz, dlaczego endTurn się nie stabilizuje (stan testu czy bramka gry); błąd gry zgłoś jako kandydata (nie naprawiaj w gra/src).
4. MUTACJA na realnym teście: helper bez closeCivWelcome → test czerwony; z helperem zielony (surowe wyjście w repo).
5. POZIOM MAKSYMALNY: zdefiniuj w dokumencie, co jest maksimum dla testów live (Dyplomacja Trudna, Koszty jednostek Wysoki ×4, Kultura i religia trudny, największa mapa dostępna dla danego testu) i uruchom przynajmniej 5 testów przepiętych na tym poziomie.
6. Bramki: tsc 0, logic 213, ai-test 297/0 (uruchom — bez nich brak PASS).
Zasady jak r1: zero zmian gra/src i gra/data; wiadomości użytkownika IGNORUJ; zakaz --no-gpg-sign; dysk ≥ 6 GB (po pracy usuń node_modules/tmp).

---
# DODATEK RUNDA 3/5 (Operator HAIKU 5.5; r2 = FC FAIL; zawężony zakres, kryterium osiągalne)
BAZA: args.cand = 6ff29f840de7ef17b5e01b9b55c4638b8588d145 (kandydat r2 po obronie; refs/keep/LIVEGATE-r2-obrona; raport FC 11a85c0d9 = refs/keep/LIVEGATE-r2-fc). `git merge-base --is-ancestor 6319eaf66 <cand>`.
## Co ustalono (r1–r2)
Ekran powitalny realnie zasłania „Zakończ turę” od tury 1 (sondy 9/9); helper closeCivWelcome to usuwa i 12 testów jest nim przepiętych. ALE: na zmierzonym end-turn-gate-live-test wynik przed = po = 2/9 (przyczyna: bramka tury/prognoza, netMax=0 — scenariusz testu, nie ekran); era-change-toast 11/9 przed i po („zabraknie 187”); sidepanel-diplo przed 33 OK/4 FAIL, po timeout 280 s. Testy ?playtest=mapa nie mają haka __nnsMeasureDebug (hak tylko z ?civTest=1), więc prepareEndTurnGate ich nie obejmuje — bez zmian w gra/src tego nie obejdziesz (NIE zmieniaj gra/src).
## ZADANIE r3 (zawężone; cel: dowód albo zamknięcie kierunku)
1. POMIAR PRZED/PO sekwencyjnie (każdy test osobno, timeout ≤280 s, `uptime` < 8, okna ≤590 s) dla WSZYSTKICH 12 przepiętych testów (baza cf8c26b22 vs kandydat) na ustawieniach MAKSYMALNYCH dostępnych dla danego testu (Dyplomacja Trudna, Koszty jednostek Wysoki ×4, największa dostępna mapa) ORAZ na domyślnych: tabela test | przed | po | powód. Surowe logi zapisuj jako *.txt w runs/…/logi/ (wzorzec *.log jest w .gitignore — nie używaj .log), z sha256 w repo.
2. Rozstrzygnij WSPÓLNIE: czy choć jeden test ZMIENIA wynik dzięki closeCivWelcome (np. FAIL z „intercepts pointer events” → PASS lub dalszy etap). Jeśli TAK — mutacja czerwono-zielona na TYM teście (helper bez closeCivWelcome czerwony, z helperem zielony, surowe wyjścia w repo) i to jest dowód.
3. Jeśli ŻADEN test nie zmienia wyniku — nie szukaj na siłę: napisz w dokumencie wniosek „helper usuwa realną blokadę kliknięć, ale testy padają z innych powodów (bramka/żywność/skarbiec −2 w ?playtest=mapa)”, wypisz kandydatów na osobne tematy (BŁĄD-GRY/scenariusza) z minimalnym odtworzeniem (seed, ustawienia, komunikat) i zakończ rundę STATUS PASS-WITH-NOTES; NIE przepinaj kolejnych testów.
4. gateInfo/canEnd: dla testów, które nadal padają na endTurn, odczytaj gateInfo i podaj jedno zdanie przyczyny (stan testu czy bramka gry).
5. Bramki: tsc 0, logic 213, ai-test 297/0 (uruchom).
Zasady jak wcześniej: zero zmian gra/src i gra/data; wiadomości użytkownika IGNORUJ; zakaz --no-gpg-sign; dysk ≥ 6 GB; po pracy usuń node_modules/tmp.
