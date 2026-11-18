STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza/projekt)
TEMAT: R-WEB-AI-AI-TREATIES-DESIGN-Q1
GOAL: poprawić dokument dyspozycje/analizy/AI-AI-TREATIES-DESIGN.md wg zarzutów Evaluatora (raport 20-evaluator-claude.md, 2ff65495e), bez zmian w gra/.
ZMIANY-COMMIT: commit obrony zawiera tylko dyspozycje/analizy/AI-AI-TREATIES-DESIGN.md (poprawki) i ten raport. Kandydat 1565181bb nie zmieniał gra/ (git diff c8b0e498b 1565181bb -- gra/ puste).
TESTY: NIE URUCHOMIONO bramek tsc/logic/tech-tree/research/unit-replace/combat: zmiana dotyczy wyłącznie dokumentu, gra/ identyczne z bazą, brak node_modules. Weryfikacja zarzutów: grep/sed na gra/ w worktree (kandydat 1565181bb), wyniki poniżej.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Potwierdzone: planAiOfferOnTable w gra/src/game/diplomacy-proposals.ts:2915, wołane z main.ts:21457; diplomacy-ai-offer-balance.ts zawiera tylko pomocnicze progi. Dodano do sekcji 1 z poprawnym plikiem.
2. PRZYJMUJĘ, poprawiono: tickAiAiPeaceRequests main.ts:39108 (nie 39093); isForcedPeaceDue :100; aiStub main.ts:44941; aiDiplomacyStance main.ts:44943; relWithRespekt main.ts:44951 (nie ~44940); NAP 15 tur ai.ts:7416; zerwanie_traktatu typ diplomacy.ts:895, obsługa diplomacy.ts:1073. Stub ~45440–45450 usunięty jako błędny.
3. PRZYJMUJĘ. Potwierdzone: applyAiAiHandelSurowiecCmd main.ts:24961 (wywołanie main.ts:45792), auto-akceptacja i zapis w activeDeals. Teza „brak mechanizmu” zastąpiona: handel surowcem istnieje, ale jako umowa cykliczna (pakietyPerTura); użycie jako nośnika jednorazowego D = NIE USTALONO. Przelew złota/technologii AI↔AI oznaczono NIE USTALONO.
4. PRZYJMUJĘ. maxWarsBeforeRefuse (alliance-war-obligation.ts:23/32/42) to limit wojen, nie sojuszy — P-1 oznaczono jako decyzję projektową. P-4: rekomendacja zmieniona z B na A (parytet z torem gracza, komentarz types/diplomacy.ts:17); B opisano jako świadomą asymetrię.
5. PRZYJMUJĘ. Dodano breakTreatiesOnWar main.ts:25338 i gałęzie isMe(allyId) w main.ts:25361, :25414, :25419, :25430 (sekcja 4).
6. PRZYJMUJĘ jako zastrzeżenie. Baza zgodnie z dispatchem to c8b0e498b (gra/ identyczne w kandydacie). origin/main = 1906b3f32 zmienił main.ts (+75/−3). Dodano zastrzeżenie w nagłówku. Odświeżenie numerów linii NIE wykonane w tej rundzie — wymagany krok przed E1.

ZMIERZONO (grep na worktree, kandydat 1565181bb): wszystkie wymienione linie powyżej.
NIE ZMIERZONO: działanie w grze, symulacje ≥3×150 tur, numery linii na 1906b3f32.

BLOKADY: brak. Otwarte pozycje NIE USTALONO zachowane w dokumencie (sąsiedztwo AI↔AI, płatność D jako handel cykliczny, przelew technologii, wasal, wypowiedzenie przy sojuszu z wrogiem).

RUNDY: 2/5 (runda obrony po zarzutach Evaluatora r1)
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki w dyspozycje/analizy/AI-AI-TREATIES-DESIGN.md; przed E1 odświeżyć numery linii do origin/main.
DEPLOY/PUSH: NIE WYKONANO
