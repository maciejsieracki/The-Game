STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-START-AT-ERA-ENTRY-Q1
GOAL: Wojna epoki Brązu i Żelaza może wybuchnąć w pierwszej turze po wejściu właściciela w epokę (zamiast po 40 turach); przy trwającej wojnie innej epoki (np. Kamienia) nowa wojna startuje dopiero po pokoju tamtej, bez przepadku. Kamień bez zmian (40).
ZMIANY/COMMIT: baza e2b06492d (origin/main). Allowlista:
  - gra/data/war-rules-params.json: eraForcedWarStartTurnsFromEra { stone 40 (bez zmian), bronze 40 -> 0, iron 40 -> 0 }; opis _opisEraDelay zaktualizowany.
  - gra/tools/era-war-delays-test.cjs (E1 i E2 przepięte na próg 0; asercje 40 dla Brązu/Żelaza w P przepięte na 0).
  - gra/tools/forced-war-bronze-test.cjs (stała = 0; przykłady 139/140/274 przepięte: 39-turowa blokada znika, tura wejścia = eligible).
  - gra/tools/forced-war-iron-test.cjs (próg = 0; kryterium 1: 0 tur -> eligible).
  - gra/tools/forced-war-reguly-multi-turn-simulation-test.cjs (K5: Brąz A w t10 -> wojna t10, B w t40 -> t40).
  - gra/tools/era-war-bronze-player-target-test.cjs (S6 = 0; S4: AI1 jest kandydatem; S2e: gracz poza pulą przez OFF zamiast przez próg).
  - gra/tools/era-war-engine-scenario-test.cjs (S1, S3, S7, S8, S8b przepięte na próg 0; logika testu bez zmian).
  - NOWY gra/tools/era-war-start-at-entry-test.cjs (A1 Brąz, A2 Żelazo, A3 cel, A4 gracz, D1 Kamień->Brąz po pokoju, D2 Kamień 40).
  - dyspozycje/autobot/runs/R-WEB-ERA-WAR-START-AT-ERA-ENTRY-Q1/10-operator-claude.md.
  Kod TS (src/main.ts, forced-war-*.ts) NIE zmieniony: stałe czytają JSON, a próg 0 wystarcza. Zmiana w main.ts (pula/parowanie) nie była potrzebna — patrz D1.
TESTY (liczby z surowego wyjścia tej rundy):
  - npx tsc --noEmit: exit 0
  - era-war-delays-test: 54 OK / 0 FAIL (na bazie przed zmianą JSON: 55 OK / 0 FAIL)
  - forced-war-bronze-test: 48 PASS / 0 FAIL (baza: 48/0)
  - forced-war-reguly-multi-turn-simulation-test: 48 PASS / 0 FAIL
  - era-war-engine-scenario-test: 27 OK / 0 FAIL
  - era-war-start-at-entry-test (NOWY): 18 OK / 0 FAIL
  - mutacja: bronze 0 -> 40 w JSON => era-war-start-at-entry-test FAIL (got 40 want 0; A1 eligible w t100 false). JSON przywrócony (bronze/iron = 0).
  - forced-war-bronze-main-guard 22/0; forced-war-iron-main-guard 36/0; forced-war-stone-main-guard 15/0; forced-war-bronze-new-game-reset 41/0; era-war-defer-not-cancel 29/0; era-war-all-eras 10/0; era-war-ignore-treaties 22/0; era-war-pairing-alliance 19/0; era-war-player-included 10/0; war-rules-multiwar-main-guard 21/0
  - forced-war-iron-test: 53 PASS / 2 FAIL. Dwa FAIL ("sojusz z celem nadal blokuje wojnę Żelaza", "sojusz z celem blokuje DOW") są NIEZALEŻNE od tej zmiany: na bazie e2b06492d dają te same 2 FAIL (zmiana FALA 891 „sojusz nie blokuje”). Nie naprawiane tutaj.
  - era-war-bronze-player-target-test: S5 FAIL („sojusz formalny blokuje wojnę epoki z graczem”) — ta sama przyczyna (sojusz nie blokuje, FALA 891); NIE ZMIERZONO na bazie w tej rundzie.
  - NIE URUCHOMIONO: wszystkie *live*-testy (Chromium), hotseat e-source 77/0, ai-test 297/0, logic 213, tech-tree 20, research 33, unit-replace, combat 6, hud-me-literal-zero, bramki-tmpdir PASS=18. Wpływ na ai-test: NIE ZMIERZONO (zmiana progu dotyka wojen epoki AI).
  - gra/node_modules zostaje w worktree (gitignored) do usunięcia przez orkiestratora.
BLOKADY: brak blokady kodu. Punkty DO POTWIERDZENIA (nie rozstrzygane tu):
  (a) Interpretacja „wszyscy AI po własnym wejściu w epokę” (Brąz/Żelazo) — zastosowana, jak w dispatchu.
  (b) Zapisy legacy bez znaczników wejścia: backfillMissingEraEntryTurns ustawia wejście na turę wczytania; przy progu 0 każdy owner Brązu/Żelaza z takiego zapisu jest eligible OD RAZU przy wczytaniu. Dispatch pyta o brak nagłej serii wojen przy wczytaniu — NIE ZMIERZONO na żywo; to realne ryzyko serii przydziałów (ograniczonej parowaniem). Możliwa korekta (np. wejście legacy = tura wczytania + N) wymaga decyzji właściciela.
  (c) Stary zapis z wojną trwającą: logika bez zmian, pending działa jak wcześniej.
UWAGI-DLA-ORKIESTRATORA:
  - Test D1 działa na czystych funkcjach (assignForcedWarPairings z isEraWarExhausted = aktywna wojna dowolnej epoki). Bramka w main.ts (isOwnerInActiveEraWar w isEraWarExhausted i playerFirst.isPlayerPairGateOpen) już wyklucza podmiot z aktywną wojną Kamienia, więc main.ts nie wymagał zmiany. Pełny przebieg silnika NIE ZMIERZONO.
  - Gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0 nie była zmieniana.
  - Tool Bash raz przeniósł długi pętlowy run w tło mimo zakazu; zadanie zatrzymano (TaskStop).
RUNDY: 1/5
NASTĘPNY KROK: FC (Final Control) na commit tego tematu; przed integracją: pełne bramki z listy (hotseat, ai-test, logic, live) i decyzja (b) o zapisach legacy.
DEPLOY/PUSH: NIE WYKONANO
