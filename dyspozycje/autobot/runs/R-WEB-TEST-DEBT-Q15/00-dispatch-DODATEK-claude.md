# R-WEB-TEST-DEBT-Q15 (tag TDQ15) — dispatch (Operator HAIKU 5.5, runda 1/5; dług testowy — priorytet 3, wolny slot; tylko testy/piny/dokumenty, ZERO zmian gra/src)
DOMAIN: PROCESS/GAME (dług testowy). Dwa znane czerwone testy na bazie (potwierdzone przez FC GRACE15 i FC ENDQUIET jako istniejące PRZED zmianami):
1. gra/tools/unit-upkeep-cost-pace-test.cjs: 80 ok / 1 FAIL — pin tekstowy dotyczący podglądu UI utrzymania jednostek w main.ts (~34592–34595, ~34884; paceUtrzymaniaWlasciciela). Ustal, KTÓRA asercja pada i dlaczego (czy kod zmienił się zgodnie z decyzją właściciela — np. FALA 887 koszty jednostek, FALA 935 okno łaski — a pin jest stary, czy to realny błąd podglądu). Jeśli pin stary i zmiana kodu zgodna z decyzją właściciela (udokumentowaną w rejestrze) → zaktualizuj pin z uzasadnieniem i mutacją czerwoną; jeśli realny błąd podglądu → NIE poprawiaj w gra/src, opisz minimalne odtworzenie i zwróć DECISION_REQUIRED jednozdaniowo.
2. gra/tools/wydarzenia-eliminacja-podboj-karta-test.cjs: 1 czerwona asercja „0.5c” (identyczna na bazie wg FC CAPRECAP). Ustal przyczynę (stary pin vs błąd); jak wyżej.
3. Przeskanuj szybkie testy (bez przeglądarki; każdy <60 s) w gra/tools/*-test.cjs powiązane z zmianami FAL 931–935 (stolica/capital, plunder, endturn/bottomBarHud, barbarzyńcy/barbarians, ai-difficulty-bonus, early-grace, upkeep, save-load, society-breakdown, ai-city-rebellion) i zapisz tabelę test × wynik (OK/FAIL/czas). Nie naprawiaj więcej niż pkt 1–2 bez zgody: pozostałe czerwone tylko wypisz z krótką klasyfikacją (stary pin / błąd / środowisko).
4. Dokument dyspozycje/analizy/DLUG-TESTOWY-Q15-2026-11-27.md; NIE ZMIERZONO tam, gdzie nie zmierzono.
BAZA: args.cand = origin/main (dokładny SHA z args).
## Allowlista
gra/tools/unit-upkeep-cost-pace-test.cjs, gra/tools/wydarzenia-eliminacja-podboj-karta-test.cjs (piny/asercje — tylko z uzasadnieniem decyzji właściciela w rejestrze), dyspozycje/analizy/DLUG-TESTOWY-Q15-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q15/**.
## Zakazy
gra/src/**, gra/data/**, osłabianie asercji bez uzasadnienia, usuwanie testów, gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (vite do unikalnych katalogów w /tmp, po pracy usuń), git add -A, push, spawn_task/create_session/create_trigger/send_later/dismiss_task, run_in_background ORAZ nohup/&, --no-gpg-sign. Commituj w swoim worktree (git add ./ścieżka; jeśli strażnik izolacji blokuje commit — zostaw staged i napisz jednym zdaniem w raporcie). Dysk ≥ 6 GB. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela.
## Bramki
tsc 0, logic 213, ai-test 297/0 (po npm ci --ignore-scripts); oba poprawione testy zielone z mutacją czerwoną (cofnięcie kodu/pinu → czerwone) albo opisana przyczyna braku poprawki.
## Binarne kryterium
Oba testy: przyczyna ustalona z linią; naprawione (pin z uzasadnieniem + mutacja) albo opisany błąd z odtworzeniem; tabela skanu; zero zmian gra/src.
