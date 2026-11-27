# R-WEB-VERIFY-LIVE-MAX-Q2 (tag VLIVE2) — dispatch (Operator HAIKU 5.5, runda 1/5; pomiary live; ZERO zmian gra/src poza hakami odczytu za ?civTest=1)
GOAL: domknąć pozycje NIE ZMIERZONO z VLIVE Q1 (dokument dyspozycje/analizy/VERIFY-LIVE-MAX-2026-11-27.md i dane w dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q1/dane/ — w main; FC PASS-WITH-NOTES). Reguła właściciela: poziom MAKSYMALNY — dla WSZYSTKICH pomiarów: Dyplomacja i wojna = Trudna, Koszty jednostek = Wysoki ×4 (w Q1 biegi 1–2 szły na Niski — to był błąd rundy, nie powtarzaj), flagi dyplomacji ON, Kultura i religia = trudny.
BAZA: args.cand = origin/main (01795c329…; użyj dokładnego SHA z args). `git merge-base --is-ancestor` i `git rev-parse HEAD` w raporcie.
## Zadanie (każdy pomiar: wynik liczbowy albo NIE ZMIERZONO z powodem)
1. Limit wojen z graczem: seed 4242 do t120 i seed 7 do t120 (Q1: seed 4242 t2–99, 0 naruszeń przy Niski — powtórz na Wysoki ×4, pełne 120 tur).
2. Limit 2 sojuszy AI↔AI: seed 4242 i 7 do t150. Q1 zaobserwował 0 sojuszy AI↔AI przez 98 tur przy Trudnej (limit nie został przetestowany dla wartości >0). Porównaj w TYM SAMYM ziarnie z Dyplomacja = Łatwa i Normalna (też do t100): ile sojuszy powstaje; rozstrzygnij: zamierzone (Trudna ×3 kary/÷3 bonusy ogranicza sojusze) czy podejrzenie błędu — z liczbami, bez zmiany reguł.
3. Żywa tura z Targowiskiem (Żywność→Podatek, kurs 0,2): zbuduj/wymuś Targowisko hakiem civTest i zmierz zmianę zasobów po jednej turze zgodnie z kursem.
4. Cesja >1 miasta na żywo: skrypt z hakiem civTest (pokój z cesją 2 miast), wynik PASS/FAIL.
5. FORTRING: runner z FALI 902 (gra/tools lub dyspozycje/autobot/runs z FORTRING), wymuś powstanie fortów hakiem jeśli 0 fortów; round-trip zapisu przy flagach ON.
6. Dokument dyspozycje/analizy/VERIFY-LIVE-MAX-Q2-2026-11-27.md (tabela: pomiar | wynik | poziom | NIE ZMIERZONO). Dane surowe (jsonl + sha256) w repo w runs/…/dane/ (nie tylko w /tmp).
Chromium pada (SIGSEGV) przy wznowieniach ze slotu: dziel bieg na kawałki ≤25 tur z zapisem stanu, ponawiaj wg helpera (gra/tools/_live-ready.cjs, helper Chrome); mierz kiedy load maszyny jest niski (sprawdź `uptime`; przy load > 8 poczekaj/przełóż pomiar, nie wymuszaj).
## Allowlista
gra/tools/ (nowe runnery pomiarowe i rozszerzenia), gra/src/main.ts (WYŁĄCZNIE hak odczytu/wymuszenia stanu za ?civTest=1, jeśli konieczny), dyspozycje/analizy/VERIFY-LIVE-MAX-Q2-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; Chromium /opt/pw-browsers/chromium), zmiana reguł/balansu, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash, --no-gpg-sign. Dysk ≥ 6 GB; po pracy usuń node_modules/tmp. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela (DECISION_REQUIRED z jednym zdaniem skutku per wariant). Błąd gry wykryty w pomiarze → minimalne odtworzenie jako kandydat na osobny temat.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0 (uruchom — w Q1 Operator je pominął).
## Binarne kryterium
Dla pozycji 1–5 wynik liczbowy albo NIE ZMIERZONO z konkretnym powodem; wszystkie biegi na Wysoki ×4 + Trudna; dane w repo; bramki uruchomione.
