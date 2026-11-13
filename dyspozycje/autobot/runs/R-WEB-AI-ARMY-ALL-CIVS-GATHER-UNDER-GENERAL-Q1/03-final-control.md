STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-ARMY-ALL-CIVS-GATHER-UNDER-GENERAL-Q1
GOAL: Każda cywilizacja AI ma wodza zgodnie z epoką i zbiera armię pod najbliższym wodzem; Brąz: wódz #2 zbiera 5 tur i rusza; po śmierci wodza nowy w stolicy.

ZMIANY/COMMIT: oceniany 49aa12e0d (na 9cfbcc179, baza 6efe338c7). Allowlista OK: ai.ts, ai-general-war-campaign.ts, generals.ts, main.ts (ensureAiGeneralRoster/zapis kampanii), 3 pliki gra/tools/ai-army-all-civs-*, runs/<ID>/**. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle. Merge 49aa12e0d na aktualny origin/main (401e9d5dc): BEZ konfliktów (git merge-tree + faktyczny merge testowy).
SHA do integracji: SHA commitu z tym raportem (potomek 49aa12e0d). Kolejność: PO wszystkich już wdrożonych tematach na origin/main (401e9d5dc, w tym MOVE-PASS-THROUGH-OWN-UNITS i NO-SIEGE-WITHOUT-WAR); względem origin/rust-port/parity-v2 (b520768b0): niezależne, web nie dotyka rust-port, kolejność dowolna. Integracja = zwykły merge na świeży origin/main.

TESTY (odtworzone samodzielnie, na 49aa12e0d oraz na merge z origin/main 0b5be9bd4, lokalny, niepushowany):
- tsc --noEmit: EXIT=0 (obie wersje).
- ai-army-all-civs-general-muster-test: 26 PASS 0 FAIL (obie).
- ai-general-war-campaign 51/0; ai-army-scattered-merge 33/0; army-to-nearest-leader 43/0; army-concentration 56/0; ai-army-replacement-concentration 35/0; ai-war-defend-home 30/0 (na merge z main).
- Chromium (general-capital-recruitment-order, generals-purchase-runtime, ai-general-war-campaign-live), ai-test 274/20, war-allin-*, ai-home-defense-*, ai-move-full-range: nie powtarzane, opieram się na logach gate-r2-* Operatora (spójne z moją weryfikacją r1: Chromium PASS).
- Pomiar live 3 ziarna x 100 tur, determinizm i czas AI na 100 turach: NIE_ZMIERZONO.
- Przegląd diffu: rezerwa Brązu (recordAiReserveGatherTurn: 5 pełnych tur, potem zwolnienie; pola zapisu/odczytu), metryka trasy leaderPathLengthFor zamiast hexDistance, sortowanie rezerw po id (determinizm), shouldAiBuyGeneral (czysta funkcja, limit epoki). Bez błędów logicznych.

WERDYKT ZARZUTÓW:
1. Pomiar 3x100: ODDAL. Nie błąd kodu; tworzenie świata > 8 min uniemożliwia pomiar w limicie 590 s. Skrypt i hak są w repo (ai-army-all-civs-live-measure.cjs, -live-hook.cjs); orkiestrator uruchamia poza limitem po integracji (pomiar nie blokuje, brak dowodu regresji).
2. Odsetek rozproszonych: ODDAL (Operator przyjął, tezy o tranzycie nie twierdzi; NIE_ZMIERZONO).
3. Późny pierwszy wódz (T23-26): ODDAL / DO DECYZJI CZŁOWIEKA. Przyczyna wskazana w kodzie (Koszary w production.ts:1067/1184, bestGeneralUnitForOwner), niepotwierdzona pomiarem; usunięcie wymogu lub priorytet Koszar = zmiana balansu, której dispatch zabrania bez decyzji. Opcje A/B/C poniżej.
4. Brąz #2 5 tur + metryka trasy: NAPRAWIONE w r2 (testy P6/P7, mutacje B,C,E zabite). Brak naprawy: po śmierci wodza #1 rezerwa nie przejmuje kampanii; dotychczasowy cykl ze świeżym wodzem + roster kupuje nowego w stolicy, więc wymaganie 4 właściciela spełnione inaczej. ODDAL.
5. Test rosteru: NAPRAWIONE (P8, mutacja D zabita).
6. Pominięte bramki Chromium: NAPRAWIONE w r2 (PASS).
7. Formalne: raport r2 636 słów (OK). Wpływ na wydatki złota AI: ODDAL (koszt = 1 jednostka wodza na slot epoki, ta sama bramka co gracz i kampania).
Zero zarzutów NAPRAW pozostałych, więc PASS-WITH-NOTES.

BLOKADY (do orkiestratora, nie blokują integracji):
- DO DECYZJI CZŁOWIEKA (ABC zadaje orkiestrator): opóźnienie pierwszego wodza w Brązie bez Koszar. A) bez zmian; B) wódz Brązu bez wymogu Koszar; C) wyższy priorytet Koszar dla AI w Brązie.
- Pomiar live 3x100 poza limitem; jeśli pokaże brak wodza dłużej niż ~20 tur, wrócić z opcją B/C.

RUNDY: 3/5 (FC)
NASTĘPNY KROK: integracja orkiestratora (merge na origin/main, bramki), potem pomiar live i ABC w sprawie Koszar.
DEPLOY/PUSH: NIE WYKONANO
