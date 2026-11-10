STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-MARCH-RESUME-NEXT-TURN-Q1
GOAL: Zaplanowana trasa marszu jednostki gracza ma byc kontynuowana automatycznie w kolejnych turach (na koncu tury gracza, zgodnie z R-WEB-MARCH-END-OF-TURN-ONLY-Q1) az do celu; zasadne przerwanie = zatrzymanie + jedno powiadomienie z powodem + wskaznik "trasa wstrzymana"; po usunieciu przeszkody wznowienie jednym klikiem.
ZMIANY/COMMIT: allowlista uzyta tylko dla nowego testu: gra/tools/march-resume-next-turn-test.cjs (nowy). Brak zmian w gra/src/**. Raport: dyspozycje/autobot/runs/R-WEB-MARCH-RESUME-NEXT-TURN-Q1/01-operator-r1.md. SHA: patrz commit tej rundy (zapisany przez orkiestratora w rejestrze).
TESTY:
- tsc --noEmit (gra/): exit 0 (przed zmianami, baza origin/main 0f20c1bf9).
- march-end-of-turn-only-test.cjs: exit 0.
- planned-march-test.cjs: exit 0.
- march-attack-queue-persist-test.cjs: exit 0.
- rally-point-automarch-test.cjs: exit 0.
- ai-march-avoid-foreign-territory-test.cjs: exit 1 na bazie (PRZED zmianami; problem istnieje w origin/main, nie wynika z tego tematu, nie diagnozowany).
- march-resume-next-turn-test.cjs (NOWY): 7 pass, 0 fail, exit 0. Zawartosc: T1 trasa 8 heksow zasieg 2 (4 tury) dociera bez klikania; T2 zasieg 3 dociera; T3 przeszkoda -> dojscie lub jawne zatrzymanie z powodem; G1-G3 bramki zrodla main.ts (applyMarchSegmentInstant kasuje plan tylko przy przycieciu stosu; koniec tury pomija jednostki ruszone recznie).
- Chromium / gra w przegladarce: NIE_ZMIERZONO (brak przegladarki w srodowisku; brak dowodu na zywej turze).
BLOKADY:
1. Nie odtworzono objawu w przegladarce ani w srodowisku headless (main.ts jest domknieciem bez eksportu; brak Chromium). Warstwa czysta (executeMarchStep w petli tur) dociera do celu, wiec przyczyna lezy w przeplywie main.ts, ktorego nie da sie uruchomic bez przegladarki.
2. Diagnoza przeplywu (main.ts, plik:linia wg stanu origin/main 0f20c1bf9):
   - Stan trasy: plannedMarches (Map unitId -> PlannedMarchDest), main.ts ~30044-30057; zapis/odczyt: plannedMarchesToSave/FromSave (game/planned-march.ts:451-500), main.ts ~36110 i ~45101 (load: wpisy przetrwaja, jesli jednostka istnieje i nie stoi na celu).
   - Wykonanie: koniec tury gracza -> runPlannedMarchesAtPlayerEndTurn (main.ts ~30671), wolane z ~42558 (koniec tury gracza) i ~42702 (koniec tury fotela hot-seat). Segment liczy applyMarchSegmentInstant (main.ts ~30565) przez executeMarchStep (game/planned-march.ts:353).
   - Pominiecie w EOT: jednostka z movedByPlayerThisTurn (ustawiane w planMarchTo main.ts ~30308 i w continuePlannedMarchForSelected ~30697) nie idzie w tym EOT; flaga czyszczona w runWorldEndTurn ~37062 (start nowej tury).
   - Kasowanie planu: (a) przycieciu stosu trimPathToStackRoom: main.ts ~30512 i ~30596 (jedyne kasowanie w EOT poza dojsciem); (b) dojscie: finishMarchSegmentHints ~30458; (c) reset gry ~43889 / wczytanie ~45092 (clear przed odbudowa); (d) jawne rozkazy force=true (Zatrzymaj, Pomin, Czuwaj, Ufortyfikuj, Zwiedzaj, ruch natychmiastowy, rozwiazanie jednostki): main.ts 25193-25358, 31090, 30718, 7240. Zadnego kasowania w starcie tury (runWorldEndTurn) nie znaleziono.
   - Zatrzymania w EOT (nie kasuja planu): executeMarchStep zwraca stopReason no_movement/obstacle/no_path/blocked_city (planned-march.ts:372-410, 419-431). Powod trafia wylacznie do showHintMessage (main.ts finishMarchSegmentHints ~30462): krotki toast, bez wpisu w powiadomieniach i bez wskaznika na jednostce.
   - Wniosek: wedlug kodu plan NIE jest kasowany przez przejscie tury; w EOT kontynuuje co koniec tury gracza. Objaw zglaszany przez wlasciciela ("nie wznawia sie w nowej turze bez klikniecia") pasuje do: (i) wykonania dopiero w koncu tury (zamierzone wg END-OF-TURN-ONLY), oraz (ii) cichego zatrzymania (tylko toast) przy przeszkodzie, ktore wyglada jak "przestal isc". Nie potwierdzone w grze.
3. Naprawa punktu (2) (jednostka zatrzymana z powodem: jedno powiadomienie w zakladce Wazne + wskaznik "trasa wstrzymana") wymaga poznania systemu powiadomien (zakladki Dyplomacja/Wazne/Inne, R-WEB-UI-NOTIFICATIONS) i wskaznika na jednostce w gra/src/ui/** — nie wykonano w tej rundzie.
4. Decyzja wlasciciela potrzebna, jesli diagnoza na zywej grze potwierdzi, ze zasadne zatrzymanie ma byc ciche albo ma zatrzymywac marsz przy KAZDEJ widocznej obcej jednostce (wtedy DECISION_REQUIRED wg dispatchu, pkt 3).
RUNDY: 1/5
NASTEPNY KROK: (a) orkiestrator/FC z przegladarka (Chromium lub playwright) reprodukuje: jednostka z trasa 3+ tur, kilka tur bez klikania, zapis i wczytanie, z zapisem stopReason z EOT; (b) po reprodukcji Operator r2: powiadomienie + wskaznik "trasa wstrzymana" przy stopReason (obstacle/no_movement/no_path/blocked_city), bez zmian kosztow ruchu; (c) rozstrzygniecie czy ciche zatrzymanie to zamierzona zasada.
DEPLOY/PUSH: NIE WYKONANO
