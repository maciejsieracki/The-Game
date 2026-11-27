# R-WEB-MAP-ANTARCTICA-DOC-PIN-Q1 (tag ANTARDOC) — dispatch (Operator HAIKU 5.5, runda 1/5; dokumentacja i test, bez zmian gra/src)
GOAL: zapisać decyzję właściciela 5B (R-WEB-MAP-EARTH-ANTARCTICA-Q1, 2026-11-26): Antarktyda zostaje USUNIĘTA z mapy Ziemi (pas polarny południowy bez lądu na Ziemi; potwierdzone pomiarem POLARZERO: r=85 bez lądu). Poprawić dokument docs/decyzje/A-MAP-ZIEMIA-1.md (zdania o Antarktydzie jako lądzie) oraz stary pin w gra/tools/earth-template-test.cjs (9 pass / 1 fail: pin oczekujący Antarktydy) tak, by test odzwierciedlał decyzję, bez osłabiania pozostałych asercji.
## Zadanie
1. Zbadaj earth-template-test.cjs: który pin oczekuje lądu polarnego/Antarktydy; uzasadnij zmianę cytatem decyzji 5B i danymi gra/src/map (earth-land-mask.ts, generator Ziemi po FALI 925); asercję zamień na przeciwną (brak lądu Antarktydy) zamiast usuwać; dodaj asercję dowodową (liczba heksów lądu w pasie polarnym południowym = 0 na mapie Ziemi, rozmiary Duży/Ogromny).
2. Popraw docs/decyzje/A-MAP-ZIEMIA-1.md z odnośnikiem do ECHO 5B w dyspozycje/REJESTR-PROSB-I-ZADAN.md (nie edytuj rejestru).
3. Mutacja: przywrócenie lądu w pasie polarnym czerwieni nowy pin.
## Allowlista
gra/tools/earth-template-test.cjs, docs/decyzje/A-MAP-ZIEMIA-1.md, dyspozycje/autobot/runs/R-WEB-MAP-ANTARCTICA-DOC-PIN-Q1/**. ZERO zmian w gra/src i gra/data (jeśli test wykaże błąd generatora — DECISION_REQUIRED).
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; Chromium /opt/pw-browsers/chromium), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; po pracy usuń node_modules/tmp. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela (DECISION_REQUIRED z jednym zdaniem skutku per wariant). Reguła właściciela: testuj i mierz na poziomie MAKSYMALNYM (największe mapy/ustawienia dostępne w czasie).
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; testy tematu. Zacommituj i zwróć SHA. BAZA: args.cand = origin/main (6319eaf66); `git merge-base --is-ancestor` i `git rev-parse HEAD` w raporcie.
## Binarne kryterium
earth-template-test zielony (10/10 lub więcej) z mutacją czerwoną; dokument zgodny z 5B; bramki ogólne zielone.
