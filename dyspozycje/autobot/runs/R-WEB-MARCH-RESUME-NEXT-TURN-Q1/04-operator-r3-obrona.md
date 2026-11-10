STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MARCH-RESUME-NEXT-TURN-Q1
GOAL: Obrona Operatora r3 po zarzutach Evaluatora (PASS-WITH-NOTES): odpowiedź na każdą notatkę, poprawka tam, gdzie zarzut jest błędem; bramki odtworzone.
ZMIANY/COMMIT: Baza = commit Operatora 71cb469a9 (r3), następnie merge origin/main 7b201afcd (merge acd7b8da5). Commit obrony: SHA w sekcji DOWÓD. Zmienione pliki (allowlista): gra/src/main.ts (planMarchTo: zerowanie marchStopNotified i marchStopDetail przy nowym planie), gra/tools/march-resume-next-turn-test.cjs (gate G12), dyspozycje/autobot/runs/R-WEB-MARCH-RESUME-NEXT-TURN-Q1/04-operator-r3-obrona.md. Symlink gra/node_modules nieśledzony, nie wchodzi do commita.
ODPOWIEDZI NA ZARZUTY:
- NOTATKA 1 (planMarchTo nie czyści marchStopNotified/marchStopDetail): PRZYJMUJĘ. Poprawka: w planMarchTo po plannedMarches.set(u.id, marchDest) dodano marchStopNotified.delete(u.id) i marchStopDetail.delete(u.id), przed executeMarchSegmentForUnit. Nowy plan = nowy epizod, więc ponowne przerwanie z tego samego powodu powiadomi raz. Dowód: test G12 (source gate na treści planMarchTo, kolejność set -> delete) PASS; march-resume-next-turn-test 45/0 (było 44/0 + G12).
- NOTATKA 2 (applyMarchSegmentInstant kasuje plan przy limicie stosu, tylko toast): ODRZUCAM jako zarzut do tej rundy. Poza zakresem tematu; Evaluator sam zaznacza, że to decyzja właściciela. Bez zmian. Do właściciela: czy przy przycięciu stosu plan ma przetrwać (wtedy osobny temat) czy kasowanie zostaje. Gate G2 (liczba plannedMarches.delete = 1) nadal PASS.
- NOTATKA 3 (po wczytaniu zapisu dedup jest pusty, pierwsze przerwanie powiadomi ponownie): ODRZUCAM jako poprawkę w tym temacie, z założeniem. Powód: trwały zapis stanu dedupu wymagałby nowego pola w save (poza allowlistą: tylko pole trasy). Ograniczenie jest wąskie: (a) powiadomienie w tej samej turze nie dubluje się, bo warEventLog dedupuje po evId = march-stop-<unit>-<turn>; (b) po wczytaniu wskaźnik „trasa wstrzymana” pojawia się dopiero przy kolejnym przerwaniu, a sama trasa jest zachowana (test T7 PASS). Założenie: jednorazowe powiadomienie po wczytaniu jest akceptowalne. Do potwierdzenia przez właściciela lub osobnego tematu save.
- NOTATKA 4 (brak Chromium, wskaźnik tylko w panelu): PRZYJMUJĘ jako NIE_ZMIERZONO. Sprawdzone ponownie: brak /usr/bin/chromium i brak ~/.cache/ms-playwright. Weryfikacja: test HTML buildUnitExtraStatusLinesHtml (T8) i gate'y G10/G11. Wskaźnik jest w panelu jednostki/armii zgodnie z dispatchem („na jednostce / w jej panelu”). army-stack-commander-identity-test: NIE_ZMIERZONO (wymaga Chromium).
TESTY (gra/, HEAD obrony):
- tsc --noEmit: exit 0.
- march-resume-next-turn-test: 45 pass / 0 fail.
- march-end-of-turn-only-test: exit 0.
- planned-march-test: 18/0.
- rally-point-automarch-test: 30/0.
- march-attack-queue-persist-test: 57/0.
- army-stack-limit-test: 51 OK; army-stack-ruch-test: 5/0; unit-card-3d-preview-coverage-test: 18/0.
- logic-test: LOGIC OK 213/213.
- ai-march-avoid-foreign-territory-test: 98 pass / 1 fail (C7, ten sam znany czerwony na bazie 5c96ff0eb, nie naprawiany).
- army-stack-commander-identity-test: NIE_ZMIERZONO (brak Chromium).
BLOKADY: brak technicznych. Otwarte decyzje dla właściciela: NOTATKA 2 (kasowanie planu przy limicie stosu) i założenie NOTATKI 3 (jednorazowe powiadomienie po wczytaniu).
RUNDY: 4/5 (obrona po Evaluator r3)
NASTĘPNY KROK: Evaluator r4 na commicie obrony, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
DOWÓD: SHA commita obrony: patrz git log -1 gałęzi worktree-wf_a9a5d28a-5d8-3.
