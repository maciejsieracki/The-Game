# R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1
GOAL: bramka pokoju/rozejmu AI wg siły militarnej (peacePosMil), nie rw (Power); progi bez zmian; test z mutacją.
ZMIANY-COMMIT: kandydat 785d0f3e0bdc8b809134ab3ec7745130c5474eb0 (potomek a99445016 — `merge-base --is-ancestor` = tak; 2 commity: f79d03f10, 785d0f3e0). Diff vs baza: ai.ts (bramka l.7169, rodzaj l.7175, sygnały a/b wypadają z bramki), main.ts (helper aiAiMilitaryRequesterShare + komentarz), peace-gate-military-strength-test.cjs (nowy), 3 testy z dopasowaną asercją, raporty 10/30. Wszystko w allowliście; brak zmian progów (*.json), WERSJE.md, gra-robocza, rust-port.
TESTY (surowe wyjście, własny pomiar na kandydacie, npm ci --ignore-scripts):
- tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6.
- ai-test 297/0; diplomacy-test 149/0; ai-war-weariness-peace 99/0; diplo-peace-balance-accept 32/0; stance-wiring 10/0; diplo-truce-impl 94/0.
- peace-gate-military-strength 14 PASS / 0 FAIL.
- Mutacja (bramka wraca do `rw <= progPokojSlabosc || ...`): 13 PASS / 1 FAIL (s1) — test czerwienieje.
- Czerwone, baza a99445016 vs kandydat (zmierzone obie): weaker-seeks-city-only 29/3 vs 29/3 (h2,h4,h5); main-guard 34/1 vs 34/1 (R6/ZT); sim 19/3 vs 19/3 (S3,S4b,M_TUR). Identyczne = dług bazowy (#352), nie regresja.

ZARZUTY:
1. Bramka na rw — naprawione w obronie (ai.ts), potwierdzone czytaniem diffu i mutacją. ODDAL (zamknięte).
2. Brak liczb / pkt B — grep własny: respektWzgledny w diplomacy-proposals.ts tylko deklaracja (l.192-193), zero odczytów; werdykt evaluatePeaceAiGate nie czyta rw. Pomiar pasma w pełnej grze NIE_ZMIERZONO (siatka 40 przypadków identyczna przed/po). ODDAL; progi bez zmian, więc brak decyzji produktowej.
3. Brak testu behawioralnego — dodano b1–b5, ale to strażnicy (nie dyskryminują rw, bo wyjścia identyczne). Dyskryminuje test strukturalny s1 (mutacja). ODDAL: kryterium (c) spełnione; przypadek rozróżniający nie istnieje w zbadanej siatce.
4. Martwe winnerRw — pole wymagane typem PeaceAiGateInput poza allowlistą; dodano komentarz. ODDAL.
Brak zarzutu NAPRAW.

(e) Wynik: było odchylenie — bramka „AI proponuje pokój", wybór rodzaju i sygnały a/b liczyły słabość przez rw (Power); zamieniono na peacePosMil, a udział „wyraźnie przegrywa" AI↔AI w main.ts liczony siłą militarną; progi bez zmian, w zmierzonej siatce zachowanie AI się nie zmienia.

BLOKADY: brak. NIE_ZMIERZONO: pełny balans pasma w grze.
UWAGI-DLA-ORKIESTRATORA: ai.ts:1890 progUltimatumMilitaryRatio na rw (ultimatum, poza zakresem); martwe winnerRw do usunięcia osobnym tematem (typ w diplomacy-war-peace-profile.ts); dług sim/weaker-seeks/main-guard bez zmian.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora kodu 785d0f3e0.
DEPLOY/PUSH: NIE WYKONANO
