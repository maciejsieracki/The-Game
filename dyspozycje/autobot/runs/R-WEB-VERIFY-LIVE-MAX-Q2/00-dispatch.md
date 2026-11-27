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

## DODATEK runda 2/5 (orkiestrator) — BAZA: FC r1 FAIL, kandydat 522f5cb929f121cfc5b680d7305591f6c3fea1b3 (kod/dane obrony dd5b6d0073bdae266e72244e7da2431bd6588148); args.cand = 522f5cb929f121cfc5b680d7305591f6c3fea1b3
Decyzja inżynierska orkiestratora (zawężenie zakresu rundy 2, bez wpływu na grę): pozycje 3–5 (Targowisko Żywność→Podatek, cesja >1 miasta, FORTRING) NIE wchodzą do rundy 2 — wymagają haków civTest w main.ts i dostaną OSOBNY temat (VLIVE3), bo dwa tematy dotykają dziś main.ts równolegle. Binarne kryterium rundy 2 = tylko pozycje 1–2 (poniżej). Wyniki pozycji 3–5 wpisz w dokumencie jako „→ VLIVE3 (osobny temat)”.
Stan: dane runnera w dane/seed4242-max-trudny (t2–120, Trudna + Wysoki ×4; culture=trudny NIE potwierdzone w logach seed 4242), dane/seed7-max-trudny (t2–40, culture=trudny w logu), runner wznawialny (state.json, gra/tools/diplomacy-harder-measure-run.cjs, opcje --unit-pace, --culture; readback ustawień z getSettings).
Zadanie rundy 2:
1. Seed 4242 na PEŁNYM maksimum: Dyplomacja Trudna + Koszty jednostek Wysoki ×4 + Kultura i religia trudny (NIE Łatwy), tury 2–150. Zacznij od nowego katalogu danych (np. dane/seed4242-max-trudny-kultura/), bo poprzedni bieg miał kulturę Łatwy; w logu KAŻDEGO segmentu zapisz linie readback unit-pace/culture/diploLevel. Do jsonl DOPISZ pole „kto wypowiedział wojnę” (deklarujący) dla wojen z graczem (żeby rozstrzygnąć 41 tur t40–80 z >1 wojną naturalną z graczem: zamierzone czy błąd) — zmiana w runnerze, nie w grze (jeśli konieczny read-only odczyt z civTest: istniejące haki; zmian gra/src nie rób).
2. Seed 7 na maksimum t2–150 (wznów z dane/seed7-max-trudny, kultura trudny już ustawiona); jeśli Chromium pada przy wznowieniu slotu (SIGSEGV), ponów do 3 razy na segment, zapisuj raw logi .txt.
3. Porównanie Dyplomacja Łatwa i Normalna do t100 (seed 4242; reszta ustawień jak max) — ile tur z sojuszami AI↔AI, ile sojuszy na cywilizację; wniosek: czy 0 sojuszy AI↔AI przy Trudnej jest zamierzone (reguły trudności), czy błąd.
4. Limity: wojen z graczem (max 1 naturalna + 1 epoki), sojuszy AI↔AI (max 2/cywilizację) — wynik liczbowy z analiza-limitow-q2.py na nowych danych.
5. Bramki: tsc 0, logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0.
6. Jeśli czas/obciążenie nie pozwala dobiec do t150 — zapisz dokładnie do której tury, i które pozycje NIE ZMIERZONO z powodem; nie zgaduj. Maszyna ma 4 równoległe tematy — biegi rób sekwencyjnie.
Kryteria FC (NAPRAW): seed 4242 t2–150 i seed 7 t2–150 (lub jawne NIE ZMIERZONO z numerem tury i powodem technicznym), kultura trudny w logach każdego segmentu, porównanie Łatwa/Normalna do t100 z wnioskiem, pole deklarującego wojnę.
