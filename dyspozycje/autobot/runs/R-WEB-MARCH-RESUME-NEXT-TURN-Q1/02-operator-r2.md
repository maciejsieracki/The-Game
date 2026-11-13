STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-MARCH-RESUME-NEXT-TURN-Q1
GOAL: Trasa zaplanowanego marszu ma wznawiac sie sama na koncu kolejnych tur; zasadne przerwanie = zatrzymanie + jedno powiadomienie z powodem + wskaznik "trasa wstrzymana"; po zdjeciu przeszkody wznowienie bez klikania.
ZMIANY/COMMIT: baza 2853b68e2 (r1). Allowlista: gra/src/game/planned-march.ts (isNotifiableMarchStop), gra/src/main.ts (noteMarchStop, marchStopNotified, hooki w finishMarchSegmentHints / applyMarchSegmentInstant / executeMarchSegmentForUnit / clearPlannedMarch / resetach gry), gra/tools/march-resume-next-turn-test.cjs (T4-T5, G4-G6), gra/tools/march-attack-queue-persist-test.cjs (+1 deklaracja stanu harnessu), raport r2. Brak zmian kosztow ruchu. Brak wskaznika "trasa wstrzymana" na jednostce (NIE ZROBIONE, patrz BLOKADY).
TESTY:
- tsc --noEmit (gra/): exit 0 (node_modules dowiazany symlinkiem z innego worktree, bez kopiowania).
- march-end-of-turn-only-test: exit 0; planned-march-test: exit 0; rally-point-automarch-test: exit 0.
- march-attack-queue-persist-test: exit 0 (57/0) po dodaniu marchStopNotified do harnessu (bez tego r2 padal ReferenceError).
- march-resume-next-turn-test: exit 0 (17 pass / 0 fail); T4 klasyfikacja obstacle/no_path/blocked_city = powiadamiane, no_movement/fog/undefined = nie; T5 plan przetrwal i dojscie po zdjeciu przeszkody (uwaga: T5 nie asertuje, ze przeszkoda faktycznie zatrzymala marsz w turach 1-2).
- ai-march-avoid-foreign-territory-test: exit 1 (98 pass / 1 fail, C7 requestWarMarchPassage no-route, logika prosby o przemarsz AI). Nie dotyczy zmienionego kodu; baza NIE_ZMIERZONO osobno w tej rundzie.
- Chromium / gra w przegladarce: NIE_ZMIERZONO (brak przegladarki). Obserwacja z kodu, nie pomiar.
DIAGNOZA (dopisek r2, zrodla na 2853b68e2):
- Plan trzymany w plannedMarches (main.ts ~30039); wykonywany tylko w runPlannedMarchesAtPlayerEndTurn (~30671, wolane z ~42558 i ~42702); pomijany gdy movedByPlayerThisTurn lub planningStackRuchLeft<=0 (ten drugi przypadek = jednostka bez MP, nie kasuje planu).
- Kasowanie planu: clearPlannedMarch (force=false zachowuje attackUnitId); trimPathToStackRoom gdy stos pelny (applyMarchSegmentInstant ~30596, plannedMarches.delete + tylko toast); arrived; force=true przy jawnych rozkazach. Start tury (runWorldEndTurn ~37062) czysci tylko movedByPlayerThisTurn i MP.
- Cicha przerwa: applyMarchSegmentInstant zwracal false przy !result.ok lub pustej trasie bez zadnego komunikatu (obstacle od pierwszego kroku w EOT) — NAPRAWIONE: teraz zglasza przerwanie.
- Zwykle pauzy nie sa bledem: no_movement (koniec MP) i fog zostaja bez powiadomienia; plan przetrwa.
- NIE ROZSTRZYGNIETE: stack-limit deletion (~30596) nadal kasuje plan z samym toastem — to kasowanie, nie przerwanie; wymaga decyzji czy ma powiadamiac.
NAPRAWA (r2):
- Zasadne przerwanie (obstacle/no_path/blocked_city) -> JEDEN wpis w karcie wydarzen kind 'enemy' (zakladka Wazne), tytul "Trasa wstrzymana", podtytul = powod; deduplikacja per jednostka i powod (marchStopNotified), reset po ruchu, dojsciu, clearPlannedMarch i resetach gry. Wpis wygasa na granicy tury (turnCreated).
- Brak pola/ikony "trasa wstrzymana" na jednostce: nie wdrozone w tej rundzie (wymaga wskaznika w gra/src/ui/**, poza zakresem tej iteracji).
- Wznowienie: automatyczne na koncu kolejnej tury gdy przeszkoda zniknie; nie dodano przycisku.
BLOKADY:
1. Brak wskaznika "trasa wstrzymana" na jednostce (GOAL pkt 3, ui/**) — niezrealizowane.
2. Brak reprodukcji w przegladarce i brak dowodu zachowania EOT z main.ts (testy to warstwa czysta + grepy zrodla) — NIE_ZMIERZONO.
3. ai-march-avoid-foreign-territory-test C7 czerwony — pre-existing wg r1, nie zbadany.
4. Decyzja wlasciciela (DECISION_REQUIRED, opcje A/B/C): czy zatrzymanie przy przeszkodzie ma byc ciche (A), powiadamiane jednorazowo (B, wdrozone), czy zatrzymujace przy kazdej widocznej obcej jednostce (C); oraz czy stack-limit kasowanie planu ma powiadamiac.
RUNDY: 2/5
NASTEPNY KROK: (a) wskaznik "trasa wstrzymana" w ui/** (r3); (b) T5 z asercja faktycznego zatrzymania; (c) reprodukcja w Chromium przy dostepnym dysku (>= 4 GB; wolne ~0,9 GB w tej rundzie); (d) decyzja wlasciciela z BLOKADY 4.
DEPLOY/PUSH: NIE WYKONANO
