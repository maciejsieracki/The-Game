# R-WEB-WAR-LIMIT-AI-NATURAL-VIOLATION-Q1 — limit wojen naturalnych AI↔AI bywa przekraczany (seed 4242, AI 28, tury 60–67)

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 78c6d8bf6d5a080fd4f427817e0d8f6a29e7abcd. Wdrożenie jako kolejna FALA po FC, jeśli zmieniasz gra/src.

## Kontekst (pomiar MEAS79, doc dyspozycje/analizy/POMIAR-LIMITY-FLEE-FORTRING-2026-11-25.md, dane runs/R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1/dane/*.jsonl.gz, analizator gra/tools/limits-measure.cjs)
Flagi domyślnie ON (limitWojenAktywny=true). W biegu seed 4242 AI 28 ma w turach 60–67 dwie wojny naturalne (1↔28 i 22↔28) przy limicie 1 wojny naturalnej na cywilizację (reguła z FALI 863 „limit wojen z graczem/natural”; sprawdź dokładne brzmienie decyzji w rejestrze FALA 863 i dyspozycje/autobot/runs/*WAR-LIMIT*). Pary 1↔22 sojusz, 1↔28 wojna, 22↔28 wojna. Ścieżka deklaracji 22↔28 nieustalona.
## Zadanie
1. Ustal DOKŁADNĄ regułę limitu (czy wyjątki: przyłączenie przez sojusz, przejęcie miasta, wojna epoki, obrona) — z rejestru/decyzji/warLimitPermits w gra/src (main.ts ~26068–26075) — i zacytuj ją w raporcie.
2. Zlokalizuj ścieżkę deklaracji 22↔28: powtórz bieg seed 4242 (runner diplomacy-harder-measure-run.cjs, wznowienie slotu daje SIGSEGV — rób bieg ciągły do tury 67, ok. 10 min; bundle zbudowany POZA repo vite --outDir w /tmp) z logiem deklaracji (kto, kogo, przez którą funkcję: ownerDeclareWarOn force=true main.ts ~14386, mustDeclareWarOn ~22769/26121/26149, przyłączenie przez sojusz). Zapisz minimalne odtworzenie (seed, tura, stos wywołań).
3. Jeśli ścieżka łamie regułę (nie jest wyjątkiem z pkt 1): napraw minimalnie, tak by limit obowiązywał; test z asercją negatywną i mutacją (usunięcie poprawki → czerwony). Jeśli ścieżka jest wyjątkiem zgodnym z regułą (np. przejęcie miasta wymusza wojnę): STOP, status DECISION_REQUIRED z jednym zdaniem konfliktu per wariant (bez proponowania rozwiązania), bez kodowania dalej; to idzie do pytania wg ZASAD ABC.
4. Po naprawie: bieg weryfikujący seed 4242 do tury 67 — maksimum wojen naturalnych AI ≤ limit (analizator limits-measure.cjs), 0 naruszeń; NIE ZMIERZONO jeśli bieg niewykonalny, z powodem.
## Allowlista
gra/src (minimalny zestaw, wypisz w raporcie — kandydaci: gra/src/main.ts, gra/src/game/war-rules-multiwar.ts), nowy gra/tools/war-limit-ai-natural-test.cjs, gra/tools/limits-measure.cjs, dyspozycje/analizy/POMIAR-LIMITY-FLEE-FORTRING-2026-11-25.md (dopisek), dyspozycje/autobot/runs/R-WEB-WAR-LIMIT-AI-NATURAL-VIOLATION-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build tylko vite z --outDir poza repo), osłabianie asercji, zmiana wartości balansu (limit ma zostać taki, jaki zdecydował właściciel), git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki. Jeden Chromium naraz; po pracy pkill własnych chrome. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; era-war-pairing-alliance 19/0; ai-ai-alliance-surcharge ALL GREEN; testy wojen/limitu (grep tools: war-limit, war-rules-multiwar, forced-war, era-war) zielone. Zacommituj i zwróć SHA.
## Binarne kryterium
Ścieżka deklaracji ustalona z dowodem (log); albo naprawa z asercją negatywną + mutacją czerwoną + bieg weryfikujący, albo DECISION_REQUIRED z konfliktem; bramki zielone.
