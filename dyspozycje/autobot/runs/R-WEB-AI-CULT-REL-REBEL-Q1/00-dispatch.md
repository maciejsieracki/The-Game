# R-WEB-AI-CULT-REL-REBEL-Q1 (tag AICULTREBEL) — dispatch (Operator HAIKU 5.5, runda 1/5)
GOAL: wyjaśnić LICZBAMI i kodem, dlaczego przy „Kultura i religia: trudny” 60–75 miast AI (ok. 40–50% miast) ma Porządek poniżej progu buntu skrajnego (14%) przez 60 tur, a rebelii jest 0 (dane z AICULTDIAG: dyspozycje/analizy/AI-KULTURA-RELIGIA-DIAG-2026-11-26.md, tabele t60). Czy to ZAMIERZONE (okres łaski „po 3 turach”, ochrona garnizonem, brak buntów dla AI) czy BŁĄD (licznik łaski nie rośnie/nie zeruje, AI pomijane w pętli buntów)? Tylko diagnoza; zero zmian reguł i balansu.
BAZA: args.cand = origin/main (0e4790cd1, zawiera hak cityStateTurn i narzędzia pomiarowe AICULTDIAG). `git merge-base --is-ancestor`, `git rev-parse HEAD` w raporcie.
## Zadanie
1. Kod: znajdź w gra/src (society-breakdown.ts, main.ts pętla końca tury, rebelia/bunt skrajny, okres łaski) pełną ścieżkę „bunt skrajny → licznik tur łaski → rebelia” i sprawdź, czy działa dla miast AI tak samo jak dla gracza (kto wywołuje, jakie warunki, ochrona garnizonem/Pałacem/budynkami). Wypisz miejsca z numerami linii.
2. Pomiar (poziom MAKSYMALNY: gra „Trudny”, Kultura i religia trudny, Koszty jednostek wysoki, Porządek hard; seed 4242 i 7, 60 tur; runner gra/tools/ai-cult-rel-measure-run.cjs --city-state 1 + ai-cult-rel-measure-flow.cjs): rozszerz hak (tylko odczyt, za ?civTest=1) o licznik tur łaski per miasto AI, liczbę miast w buncie skrajnym ≥3 tur z rzędu i powód braku rebelii (warunek, który ją blokuje). Dla odniesienia policz to samo dla miasta gracza w tej samej grze, jeśli występuje bunt skrajny.
3. Wynik: tabela (miasta AI w buncie skrajnym ≥3 tur: ile; ile ma garnizon ≥ potrzebny; co blokuje rebelię; czy to samo działa dla gracza). Rozstrzygnięcie: ZAMIERZONE / BŁĄD / NIE ROZSTRZYGNIĘTE (z powodem).
4. Jeśli BŁĄD bez wpływu na balans reguł (np. licznik nie rośnie dla AI) — minimalna poprawka z testem i mutacją czerwoną; jeśli to ZAMIERZONE albo poprawka zmienia balans → DECISION_REQUIRED (jedno zdanie skutku per wariant, bez rozwiązania).
5. Dokument dyspozycje/analizy/AI-KULTURA-RELIGIA-REBELIA-2026-11-26.md.
## Allowlista
gra/tools/ai-cult-rel-measure-*.cjs, gra/src/main.ts (WYŁĄCZNIE liczniki odczytu za civTest), poprawka wg pkt 4 (society-breakdown.ts/miejsce wskazane w kodzie, z testem), dyspozycje/analizy/AI-KULTURA-RELIGIA-REBELIA-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-REBEL-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; Chromium /opt/pw-browsers/chromium), zmiana parametrów kultury/Porządku/progów, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash, --no-gpg-sign. Dysk ≥ 6 GB; po pracy usuń node_modules/tmp. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; society-breakdown 56/0; ai-city-order-need-wiring 231/0.
## Binarne kryterium
Tabela z liczbami dla seed 4242 i 7 + rozstrzygnięcie ZAMIERZONE/BŁĄD/NIE ROZSTRZYGNIĘTE z numerami linii kodu; zero zmian reguł.
