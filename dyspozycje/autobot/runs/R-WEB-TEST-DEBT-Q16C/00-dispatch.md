# R-WEB-TEST-DEBT-Q16C (tag TDQ16C) — dispatch (Operator HAIKU 5.5, runda 1/5; dług testowy, zero zmian logiki gry)
DOMAIN: PROCESS/GAME-TEST (priorytet 3, konkretne czerwone testy; możliwy ślad błędu gry po oknie łaski 15 tur). Źródło: tematy R-WEB-TEST-DEBT-Q16 i Q16B (main dbcc12f71afe14b578c2936858ba4e58dc7aee7c; dokument dyspozycje/analizy/DLUG-TESTOWY-Q16B-2026-11-28.md, runs/R-WEB-TEST-DEBT-Q16B/10-operator-claude.md i 50-final-control-claude.md): dwa testy są czerwone przed i po naprawie pinów nagłówka, z innych przyczyn, NIEZBADANYCH:
1. gra/tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs — 2/2 FAIL: fast-forward endTurn nie osiągnął stanu settled w t17 (podejrzenie: po FALI 935 okno łaski kończy się w t16 i bramka „Zakończ turę” blokuje z powodu żywności/skarbca u gracza pasywnego w t16–19; test jedzie pętlą endTurn bez obsługi bramki; to byłby artefakt testu, nie błąd gry).
2. gra/tools/hotseat-drugi-fotel-tura-test.cjs — RC 2 (Chromium; przyczyna NIE ZBADANA).
3. (dodatkowo) gra/tools/hotseat-etap4-noop-test.cjs — live Chromium, 580 s bez wyniku (przerwany).
ZADANIE (binarne):
1. Dla KAŻDEGO: uruchom na bazie args.cand (w gra/, po npm ci --ignore-scripts; testy live: segmenty ≤ 590 s, kopie pomocnicze helper Chrome z gra/tools/_live-ready.cjs; po SIGSEGV ponów ≤ 3 razy), wskaż DOKŁADNIE co pada (asercja/komunikat/tura), od którego commitu (git log -S / bisect po gra/src i teście).
2. Klasyfikacja: A — artefakt testu (stary pin, brak obsługi bramki NNS po t16 w pętli fast-forward, harness Chromium); naprawa testu bez osłabiania (np. test przechodzi bramkę realnie: rozwiązanie/zakup w UI lub dozwolona ścieżka testowa jak w gra/tools/nnsq12-*.cjs; wynik niezmienionego kodu gry) + mutacja czerwona→zielona; B — błąd gry → NIE naprawiaj, zwróć DECISION_REQUIRED/BLOCK z diagnozą (minimalne odtworzenie, liczby); C — środowisko/infrastruktura Chromium → opis prób i NIE ZMIERZONO.
3. Dokument krótki dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md (stan wiążący na górze; NIE ZMIERZONO tam, gdzie nie zmierzono). Testuj na poziomie MAKSYMALNYM ustawień tam, gdzie test ma ustawienia gry.
BAZA: args.cand = dbcc12f71afe14b578c2936858ba4e58dc7aee7c (origin/main); sprawdź git merge-base --is-ancestor, podaj git rev-parse HEAD.
## Allowlista
gra/tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs, gra/tools/hotseat-drugi-fotel-tura-test.cjs, gra/tools/hotseat-etap4-noop-test.cjs (tylko piny/harness testów; nie logika gry), nowe pomocniki gra/tools/tdq16c-*.cjs, dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16C/** (logi *.txt, NIE *.log).
## Zakazy
gra/src/**, gra/data/**, gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (vite do unikalnych katalogów w /tmp, po pracy usuń), osłabianie testów (usuwanie asercji, rozluźnianie wzorca), zostawianie nieśledzonych katalogów po testach, git add -A, push, spawn_task/create_session/create_trigger/send_later/dismiss_task, run_in_background ORAZ nohup/& (Bash w pierwszym planie, timeout ≤ 590000 ms), zmiana konfiguracji podpisu commitów, --no-gpg-sign. Gdy guard blokuje commit — pliki w stage (git add ./ścieżka).
## Bramki
tsc 0, logic 213, ai-test 297/0 (kod gry bez zmian; git diff gra/src = 0); trzy testy zielone albo sklasyfikowane (B/C) z dowodem.
## Binarne kryterium
Każdy z trzech: zielony z mutacją czerwoną (A) albo opisany jako B/C z dowodem; zero zmian gra/src; dokument zapisany.
