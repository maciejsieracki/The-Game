# R-WEB-VERIFY-LIVE-MAX-Q1 (tag VLIVE) — dispatch (Operator HAIKU 5.5, runda 1/5; pomiary live, ZERO zmian gra/src poza hakami odczytu za ?civTest=1)
GOAL: zamknąć pozycje NIE ZMIERZONO z zadań #38/#79 na poziomie MAKSYMALNYM ustawień (reguła właściciela 26.11) w żywej grze (Chromium /opt/pw-browsers/chromium, pomocnik bramki „Zakończ turę”: gra/tools/_live-ready.cjs prepareEndTurnGate z NNSQ12; smoke: gra/tools/live-nns-gate-smoke-test.cjs). Pomiary (każdy: seed 4242 i 7, jeśli czas pozwala; wynik liczbowy albo jawne NIE ZMIERZONO z powodem):
1. Limit wojen z graczem jako celem (FALA 863/911, flagi ON domyślnie od FALI 888): 120 tur, liczba naruszeń limitu (wojny gracza + AI), poziom Dyplomacja i wojna = maksymalny.
2. Limit 2 sojuszy AI↔AI: 150 tur, max liczba sojuszy na cywilizację tura po turze.
3. Żywa zamiana Żywność→Podatek (FALA 876/883, kurs 0,2): przez hak/UI — czy surowiec rośnie/maleje zgodnie z kursem po jednej turze.
4. Pokój z cesją miast (FALA 873): scenariusz skryptowany (hak civTest), czy cesja >1 miasta przechodzi.
5. FLEEMANUAL i FORTRING: istniejące runnery (gra/tools lub dyspozycje/autobot/runs z FALI 902) — uruchom i podaj wynik; round-trip zapisu przy flagach ON (jeśli Chromium nie pada — znane crashe SIGSEGV ok. t18: ponawiaj ze slotu zgodnie z helperem).
6. Dokument dyspozycje/analizy/VERIFY-LIVE-MAX-2026-11-27.md: tabela (pomiar | wynik | poziom ustawień | NIE ZMIERZONO).
Jeśli którykolwiek pomiar wykaże błąd gry — opisz minimalne odtworzenie (kandydat na osobny temat R-WEB-*), nie naprawiaj w tym temacie.
## Allowlista
gra/tools/ (nowe runnery pomiarowe i rozszerzenia istniejących), gra/src/main.ts (WYŁĄCZNIE hak odczytu za ?civTest=1, jeśli konieczny), dyspozycje/analizy/VERIFY-LIVE-MAX-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; Chromium /opt/pw-browsers/chromium), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; po pracy usuń node_modules/tmp. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela (DECISION_REQUIRED z jednym zdaniem skutku per wariant). Reguła właściciela: testuj i mierz na poziomie MAKSYMALNYM (największe mapy/ustawienia dostępne w czasie).
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; testy tematu. Zacommituj i zwróć SHA. BAZA: args.cand = origin/main (6319eaf66); `git merge-base --is-ancestor` i `git rev-parse HEAD` w raporcie.
## Binarne kryterium
Dla każdej z pozycji 1–5: wynik liczbowy albo NIE ZMIERZONO z konkretnym powodem; dokument w repo; zero zmian reguł gry.
