STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1
GOAL: AI w wojnie nie prowadzi wojsk przez teren trzeciej cywilizacji bez umowy przemarszu; twarda przeszkoda, trasa okrezna (ladowa albo morska), brak trasy = odroczenie + prosba wg cooldownu; gracz bez zmian.

ODPOWIEDZI NA ZARZUTY (baza: e728a594d zmergowany do galezi worktree-wf_89d6b9b2-427-3)
1. PRZYJMUJE. main.ts: aiMarchPassageRequestTurn czyszczona przy nowej grze i wczytaniu, zapisywana w save (meta) i odczytywana jak siostrzane mapy. Cooldown wydzielony do czystej funkcji isMarchPassageCooldownActive (ai-march-guard.ts): wpis z przyszlosci (last > turn) nie wycisza prosb. Test F1-F2 (behawioralnie), E3/E7-E9 (okablowanie), mutacja C9 czerwieni F2.
2. PRZYJMUJE, zaimplementowane. Guard dostaje seaCostFn (main.ts: moveCostFnForUnit, woda tylko przy Zegludze). guardedMarchPath: brak trasy ladowej omijajacej zakazany teren -> trasa morska (zakazany teren nadal Infinity, tez na wodzie); zaokretowana jednostka planuje po wodzie dalej. Planer wojny: przy noPath i Zegludze przeplanowanie z allowSea; zaokretowane jednostki zostaja w planerze. Test B7 (obie sciezki): 0 wejsc, dociera/zdobywa, jednostki faktycznie na wodzie; B7d: bez Zeglugi nadal odroczenie. Mutacje C8, C10 czerwienia B7. NIE_ZMIERZONO: symulacja pelnej gry z morzem (swiat sim jest ladowy).
3. DOPELNIAM. Dodano scenariusz symetryczny 'sym' (jednostki r=8 i r=12, trzecia na osi r=10) z asercjami progowymi B8/B8b/B8c (0 wejsc, dociera za teren trzeciej, zmiany kierunku sredniego q <= 6). Wynik: obie sciezki 0 zmian kierunku, brak oscylacji (zgodnie z odtworzeniem Evaluatora). Oscylacja z raportu R1 nie odtwarza sie w zadnym moim scenariuszu; czestosc w grze NIE_ZMIERZONO; test zabezpiecza regresje w tym ukladzie.
4. PRZYJMUJE. Cooldown ma test behawioralny (F), lifecycle sprawdzony E7-E10. requestAiMarchPassage/enqueueDiplomacyPendingFromCmd nadal nie sa uruchamiane headless (main.ts bez przegladarki) -- NIE_URUCHOMIONE; logika cooldownu to teraz czysta funkcja pod testem. Wyjatek wyjscia ma console.log "[AI-marsz] wyjatek wyjscia ..." (ai.ts, obie sciezki) i asercje B5d.
5. PRZYJMUJE. D4 dwustronne: D4a PRZED 1,17x <= 1,5; D4b PO 1,32x <= 1,5; D4c lacznie 1,25x <= 1,3. Szum pomiaru ok. +-0,15, stad progi stronne 1,5; straz dziala tylko w wojnie z cywilizacja.
6. ODRZUCAM. main.ts jest niezbedny do okablowania (AI dostaje straz, autoryzacja, egzekutor); allowlista dispatchu obejmuje "pliki AI/ruchu". Zmiany main.ts: R1 71 linii + R2 ok. 20 linii (cooldown, seaCostFn); wpisane jawnie tutaj.

ZMIANY: gra/src/game/ai-march-guard.ts, ai.ts, gra/src/main.ts, gra/tools/ai-march-avoid-foreign-territory-test.cjs, run/**. Bez gra-robocza, WERSJE.md, rust-port.
TESTY: tsc --noEmit EXIT=0; nowy test 99 OK / 0 FAIL (EXIT=0); symulacja bez zmian: 2336 -> 0 jednostko-tur, 492 -> 0 par-tur, N7 19 -> 0, przejecia 14 -> 20. Regresje zielone: ai-general-war-campaign, ai-war-gate, ai-early-no-major-war, alliance-war-obligation, border-march-scan, diplomacy-border-march, planned-march, rally-point-automarch, territory-border*, diplo-war-peace-gate, diplomacy-war-gates, ai-move-*, forced-war-stone/bronze/iron (poza ponizszymi). Czerwone zastane (ten sam kod na bazie 2d9b6aac8, moj diff go nie dotyka): forced-war-bronze-main-guard (1 FAIL: diploInp bronzeForceWarTargetId), forced-war-bronze-new-game-reset (forcedEraPeaceUntilNextEraByPairKey is not defined). NIE_URUCHOMIONE: *-live-test (przegladarka).
BLOKADY: brak. DECYZJA_WYMAGANA: brak (trasa morska zrobiona).
RUNDY: 2/5
NASTEPNY KROK: Evaluator
DEPLOY-PUSH: NIE WYKONANO
