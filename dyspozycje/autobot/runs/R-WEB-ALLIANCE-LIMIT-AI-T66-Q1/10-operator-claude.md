STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ALLIANCE-LIMIT-AI-T66-Q1
GOAL: ustalić, czy limit 2 sojuszy AI↔AI (FALA 865) został przekroczony w t66–67 seed 4242 (AI 1), ustalić ścieżkę albo błąd danych pomiaru, naprawić minimalnie lub zgłosić DECISION_REQUIRED.
BAZA: 536ccd093f9749059e9a1e4810a93e29b6c547c7 (origin/main), checkout detached w worktree wf_9af93e99-b06-1.

ZMIANY-COMMIT: tylko ten raport (dyspozycje/autobot/runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/10-operator-claude.md). Brak zmian w gra/src, gra/tools, analizatorze i runnerze.

## 1. Reguła (cytaty z kodu w 536ccd093)
- gra/src/game/ai-ai-alliance-limit.ts: "limit dotyczy sojuszy cywilizacji AI z DOWOLNĄ stroną liczoną do limitu: inną główną AI albo graczem (liczoneStrony = główne AI ∪ {gracz})"; "państwa-miasta (city-state) NIE liczą się do limitu"; "para (a,b) liczy się do limitu obu stron raz".
- liczbaSojuszyCywilizacji liczy rodzaje z isAllianceDealKind (main.ts:24517: sojusz_pelny | sojusz_defensywny | SojuszWojskowy). Brak wyjątków dla sojuszu z graczem po wojnie, umowy wielostronnej ani sióstr: sojusz z graczem i sojusz_siostry (main.ts ~24938, rodzaj sojusz_pelny) wchodzą do licznika.
- Status=sojusz przy pokoj=pokoj NIE jest osobnym typem umowy w regule limitu. Limit liczy wyłącznie wpisy w activeDeals. Pole `status` w pomiarze pochodzi z relacji (diplomacyRelations), a pole `pokoj` z resolvePokojTrustTier(activeDeals, ...) (main.ts ~34180; diplomacy-treaties.ts:450).
- Bramki: tickAiAiAllianceRequests (main.ts ~25850) planuje przez planAiAiAllianceTickFull, którego licznik startowy pochodzi z activeDeals i jest inkrementowany per akceptacja (ai-ai-alliance-tick.ts:167–270). Gałąź sióstr (main.ts ~24930) sprawdza aiAiAllianceLimitPozwala na żywym activeDeals dla każdej pary. Obie ścieżki są chronione, o ile licznik z activeDeals jest poprawny.

## 2. Dane pomiaru (dane/diplo-seed4242-harder0.jsonl.gz, ten sam bieg co WARS4242)
Pola: status / pokoj.
- t62–65: 1–13 = sojusz / sojusz; 1–19 = sojusz / sojusz; 1–10 = neutralni / pokoj.
- t66: 1–10 = sojusz / sojusz (nowy); 1–13 = sojusz / POKOJ; 1–19 = sojusz / sojusz; 7–13 = sojusz / sojusz (nowy).
- t67: 1–10 = sojusz / sojusz; 1–13 = sojusz / pokoj; 1–19 = sojusz / sojusz; 7–13 = sojusz / sojusz.
Pole pokoj wg activeDeals mówi, że w t66–67 nie ma sojuszu 1–13, a relacja (status) nadal mówi sojusz. Liczba sojuszy AI 1 w t66 wg status = 3 (10, 13, 19); wg pokoj = 2 (10, 19).

## 3. Ustalenia (dowód statyczny, NIE runtime)
- Hipoteza A (porządek stron): helpery hasTreaty (diplomacy-treaties.ts:307), dealInvolvesOwners (main.ts:24543) i resolvePokojTrustTier (diplomacy-treaties.ts:458) dopasowują strony WYŁĄCZNIE w porządku posortowanym (strony[0]=min, strony[1]=max). liczbaSojuszyCywilizacji jest niezależny od kolejności. Umowa z odwróconym strony byłaby policzona w limicie, a niewidoczna dla pokoj/hasTreaty/prefiltra planera (pairPrefilter używa dealInvolvesOwners), co mogłoby też dopuścić powtórną parę. NIE ZMIERZONO, czy taka umowa powstała (nie zrzucono activeDeals).
- Hipoteza B (relacja po zniknięciu umowy): pole status może zostać na 'sojusz' po zniknięciu umowy z activeDeals. Wtedy realnie AI 1 ma w t66 dwa sojusze (10, 19), a 13 jest błędnie liczone po statusie. NIE ZMIERZONO.
- Ścieżka zawarcia 1–10 i 7–13 w t66 NIE ZMIERZONA. Gdyby 1–13 było w activeDeals na starcie kroku (licznik 2 dla AI 1), planer nie dodałby 1–10. Że dodał, sugeruje, że 1–13 nie było w activeDeals (zgodnie z hipotezą B) albo że licznik widział inny stan. To wymaga logu, nie jest ustalone.

## 4. Czego NIE zrobiono i dlaczego
- Nie powtórzono biegu seed 4242 do t67 (wymaga npm install w worktree, vite build poza repo i ~10+ min Chromium w odcinkach <590 s z --stop-at). Brak dowodu ścieżki.
- Nie dodano logu zawierania umów ani testu alliance-limit-ai-t66-test.cjs. Brak naprawy, bo bez dowodu nie wiadomo, czy błąd jest w bramce (kod) czy w danych (pomiar).

## 5. Bramki
NIE URUCHOMIONO (brak zmian kodu). Nie uruchamiano tsc, logic, tech-tree, research, unit-replace, combat, ai-test, era-war-pairing-alliance, ai-ai-alliance-surcharge, testów alliance-limit ani war-rules-multiwar-main-guard.

## RUNDY
1/5. Ostatni werdykt: BLOCK (brak dowodu ścieżki t66, brak runtime).

## NASTĘPNY KROK
Runda 2: (a) zbudować bundle poza repo i uruchomić diplomacy-harder-measure-run.cjs (seed 4242, harder 1, --stop-at 60, potem do 67) z logiem zawierania umów (kto, z kim, ścieżka, wynik sojuszLimitPozwala) i zrzutem activeDeals dla pary 1–13 w t65–67; (b) sprawdzić, czy w activeDeals jest wpis 1–13 z odwróconym strony, czy zniknął w t66 i przez jaką ścieżkę; (c) jeśli bramka przepuściła za dużo: poprawka na właściwej ścieżce + test z asercją negatywną; jeśli to pole pomiaru: normalizacja porządku stron w helperach (diplomacy-treaties.ts) i aktualizacja analizatora.
Uwaga do orkiestratora: hipoteza A (porządek stron w helperach) warta sprawdzenia niezależnie od limitu, bo dotyczy też prefiltra planera.

DEPLOY/PUSH: NIE WYKONANO
