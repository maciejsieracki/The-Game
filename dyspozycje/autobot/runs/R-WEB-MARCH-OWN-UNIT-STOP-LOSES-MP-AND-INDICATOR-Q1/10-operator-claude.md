STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MARCH-OWN-UNIT-STOP-LOSES-MP-AND-INDICATOR-Q1 (runda 1/5, baza 862eaae4a)
GOAL: (1) S6: jednostka z aktywnym planem i ruchLeft>0 wykorzystuje ruch na koniec tury gracza, takze gdy byla ruszona przez gracza w tej turze; (2) znacznik „marsz ruszy na koniec tury”; (3) brak cichego przepadania ruchu.
ZMIANY/COMMIT: gra/src/main.ts (runPlannedMarchesAtPlayerEndTurn: usunieto pominiecie movedByPlayerThisTurn; plan z MP kontynuuje; reszta bez zmian; znacznik w stackStatusBase), gra/src/ui/unitCardStatus.ts + gra/src/ui/armyStackHud.ts (pole marchQueuedEndTurn, linia „marsz ruszy na koniec tury”, pauza ma pierwszenstwo), gra/tools/march-multiturn-live-test.cjs + march-multiturn-live-vite.config.ts (test zywy z predecessora 34560f8e5 + kolumny stop/indicator/dom + asercja S6 „pozostaly ruch nie przepada”), gra/tools/march-end-of-turn-only-test.cjs (E6/M5 do nowej reguly), gra/tools/march-resume-next-turn-test.cjs (G3 + asercje S8). Commit: SHA w polu sha odpowiedzi.
TESTY:
- tsc --noEmit: exit 0.
- Live Chromium (headless_shell; chromium-1194 pada SIGTRAP w tym sandboxie), build poza repo: S1 2 kliki, S2 2, S3 2, S4 2, S6 2, S7 2. ALL PASS (6). S6 PRZED: EOT#1 (36,22) ruchLeft 6, MP przepadal. S6 PO: EOT#1 (36,22)->(36,21), leftover ruchu wykorzystany; dojscie po 2 klikach.
- Mutacja (b) zywa: przywrocenie pominiecia movedByPlayerThisTurn w petli -> S6 FAIL („pozostaly ruch przepadl na koniec tury 1”); plik main.ts przywrocony i zweryfikowany (cmp).
- march-end-of-turn-only 0 FAIL (mutacja M5 wykryta); march-resume-next-turn 50/0; planned-march 18/0; rally-point-automarch 30/0; logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat 6/6.
- march-attack-queue-persist 55/57: 2 FAIL g5/g8 identyczne jak na bazie ac35200a1; nie dotykane.
BLOKADY:
1. Znacznik „marsz ruszy” NIE ZMIERZONO na zywo: w tescie zywym panel armii (.ash-status) nie jest renderowany (0 elementow). Pokryte testem jednostkowym buildUnitExtraStatusLinesHtml (znacznik; pauza przesuwa znacznik; brak planu = brak znacznika).
2. Zmiana reguly konca tury (swiadoma, wymagana przez GOAL 1): jednostki ruszone przez gracza z planem i MP kontynuuja na koniec tury. Zmienia znaczenie asercji E6 (zaktualizowane). Do decyzji orkiestratora przy Evaluatorze.
3. S6 osiaga dojscie w tej samej liczbie klikow (2); na EOT#1 jednostka idzie o 1 heks blizej, bez klikania.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) + Final Control; ocena zmiany E6 i brak zywego dowodu znacznika.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Predecessor 34560f8e5 mial tylko testy w gra/tools; rozwiazanie jest w gra/src/main.ts.
- chromium-1194 pada (SIGTRAP) w tym sandboxie; dziala /opt/pw-browsers/chromium_headless_shell-1194 (MM_CHROMIUM).
- Srodowisko: npm ci --ignore-scripts w gra/ (node_modules, gitignored); build zywy w TMPDIR scratchpad; brak sesji/zadan/harmonogramow.
