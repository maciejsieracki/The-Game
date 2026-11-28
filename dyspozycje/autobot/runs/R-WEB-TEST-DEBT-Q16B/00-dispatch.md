# R-WEB-TEST-DEBT-Q16B (tag TDQ16B) — dispatch (Operator HAIKU 5.5, runda 1/5; dług testowy, zero zmian logiki gry)
DOMAIN: PROCESS/GAME-TEST (priorytet 3, konkretne czerwone testy z binarnym kryterium). Źródło: Final Control i Operator tematu R-WEB-TEST-DEBT-Q16 (main b075137340b553e5f6b599c5bc17460d624390c0; dokument dyspozycje/analizy/DLUG-TESTOWY-Q16-2026-11-28.md, run R-WEB-TEST-DEBT-Q16/10-operator-claude.md i 50-final-control-claude.md): commit 7fd21ed0c (ENDQUIET, FALA 934) zmienił sygnaturę canPlayerInitiateEndTurn() na canPlayerInitiateEndTurn(quiet = false) — zamierzone. Trzy piny naprawiono; PIĘĆ testów poza ówczesną allowlistą ma ten sam stary nagłówek i według FC są czerwone:
1. gra/tools/diplo-forced-peace-pending-test.cjs (linia ~182; wynik 39/1),
2. gra/tools/diplomacy-sensible-deals-main-guard-test.cjs (linia ~32; 20/2),
3. gra/tools/koniec-tury-f1-f4-runda3-test.cjs (linia ~168; 37/2),
4. gra/tools/koniec-tury-g1-g2-runda4-test.cjs (linia ~130; 39/2),
5. gra/tools/load-game-blockers-exec-test.cjs (linia ~73; RC 1).
ZADANIE (binarne):
1. Dla KAŻDEGO z pięciu: uruchom na bazie args.cand (w gra/, po npm ci --ignore-scripts), wskaż DOKŁADNIE które asercje padają (cytat wzorca testu i fragmentu gra/src/main.ts), czy przyczyna to stary nagłówek canPlayerInitiateEndTurn(): boolean (klasyfikacja A: pin przestarzały względem zamierzonej zmiany) czy coś innego (np. inny commit; B: regresja kodu → NIE naprawiaj, zwróć DECISION_REQUIRED/BLOCK z diagnozą dla danego testu).
2. Klasyfikacja A: zaktualizuj wzorzec tak, by dalej wykrywał regresję (nie osłabiaj: wzorzec nie może przyjmować dowolnego dopasowania; dopuszczalne jest tylko wymaganie nowej sygnatury albo akceptacja WYŁĄCZNIE obu znanych nagłówków z jawnym komentarzem) i udowodnij MUTACJĄ w kopii main.ts (czerwony po mutacji, zielony po przywróceniu) dla każdej naprawionej asercji.
3. Skan: znajdź grep-em w gra/tools WSZYSTKIE pozostałe testy z wzorcem canPlayerInitiateEndTurn(): boolean (lub inną nieaktualną sygnaturą po FALACH 931–936) i uruchom je; podaj tabelę pass/fail PRZED i PO. Testy wymagające bundla --dist lub zbyt ciężkie pomiń z opisem.
4. Dokument krótki dyspozycje/analizy/DLUG-TESTOWY-Q16B-2026-11-28.md (stan wiążący na górze; NIE ZMIERZONO tam, gdzie nie zmierzono).
BAZA: args.cand = b075137340b553e5f6b599c5bc17460d624390c0 (origin/main); sprawdź git merge-base --is-ancestor, podaj git rev-parse HEAD.
## Allowlista
Tylko piny tych pięciu testów oraz innych testów znalezionych skanem z pkt 3 (gra/tools/*-test.cjs, wyłącznie wzorce/piny), dyspozycje/analizy/DLUG-TESTOWY-Q16B-2026-11-28.md, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16B/** (logi *.txt, NIE *.log).
## Zakazy
gra/src/**, gra/data/**, gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (vite do unikalnych katalogów w /tmp, po pracy usuń), osłabianie testów (usuwanie asercji, rozluźnianie wzorca do dowolnego dopasowania), zostawianie nieśledzonych katalogów po testach (sprzątnij .endturn-exec-stubs i podobne), git add -A, push, spawn_task/create_session/create_trigger/send_later/dismiss_task, run_in_background ORAZ nohup/& (Bash w pierwszym planie, timeout ≤ 590000 ms), zmiana konfiguracji podpisu commitów, --no-gpg-sign. Gdy guard blokuje commit — pliki w stage (git add ./ścieżka).
## Bramki
tsc 0, logic 213, ai-test 297/0 (kod gry bez zmian; git diff gra/src = 0); pięć testów zielone albo jawnie sklasyfikowane (B).
## Binarne kryterium
Każdy z pięciu testów: zielony z mutacją czerwoną albo opisany jako B z dowodem; tabela skanu PRZED/PO; zero zmian gra/src.
