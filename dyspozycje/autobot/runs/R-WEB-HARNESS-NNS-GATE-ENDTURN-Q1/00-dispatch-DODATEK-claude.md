# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
Rejestr (LEDGER-B r3/r4, #390/#415/#417): „tura nie przechodzi” = bramka „Zakończ turę” (NNS: prognoza skarbca/spichlerza < 0) w turze 1 przy domyślnych podatkach 30/60/10 (prognoza skarbca −2 seed 4242, −3 seed 777), identycznie z księgą i bez; po obejściu bramki t57 nie zawiesza się w 2 ziarnach. Helper live istnieje: gra/tools/_live-ready.cjs (CHROMEHELPER/Harness live, main 7fb6e24a3) oraz wspólny helper Chrome z ~130 testów. Odpowiedź właściciela 12A: bramka tury 1 ZOSTAJE w grze.
## Zadanie
1. Znajdź, jak runnery/testy live obchodzą (lub nie) bramkę NNS przy endTurn (grep: nns, endTurnBlocked, „Zakończ turę”, prognoza skarbca w gra/src/main.ts oraz gra/tools/*live*, *measure*, _live-ready.cjs, chrome-helper).
2. Zaimplementuj w helperze (gra/tools/_live-ready.cjs lub wspólnym) jedną zdefiniowaną procedurę „przygotuj grę do pomiaru”: ustawia stan przez istniejący hak civTest (np. podatki/skarbiec) lub kliknięcie „potwierdź mimo ostrzeżenia”, jeśli bramka na to pozwala — zero zmian reguły w gra/src. Jeśli jedyną drogą jest nowy hak w gra/src (tylko civTest/test-only) — NIE rób tego sam; zwróć DECISION_REQUIRED z jednym zdaniem.
3. Dowód: runner dymny (3 ziarna 4242/777/7 × 60 tur, endTurn w pętli) przechodzi bez zatrzymania na bramce; zapisz tabelę (ziarno, tury zmierzone, awarie Chromium ≠ błąd gry). Test z mutacją czerwoną: helper bez procedury → test zatrzymuje się na bramce (czerwony).
4. Podłącz helper do najczęściej używanych runnerów (war-duration-measure.cjs, diplomacy-measure runner) tylko jeśli to jedna linia wywołania — bez przepisywania.
## Allowlista
gra/tools/_live-ready.cjs, wspólny helper Chrome w gra/tools/, gra/tools/war-duration-measure.cjs (tylko wywołanie helpera), nowy gra/tools/live-nns-gate-smoke-test.cjs, dyspozycje/autobot/runs/R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1/**. Zero zmian gra/src, gra/data.
## Zakazy
gra/src/**, gra/data/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), zmiana reguły bramki, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela. Chromium z /opt/pw-browsers/chromium.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; test dymny z mutacją czerwoną. Zacommituj i zwróć SHA.
## Binarne kryterium
3 ziarna × 60 tur przechodzą endTurn przez helper; mutacja czerwona; zero zmian gra/src; bramki zielone.
