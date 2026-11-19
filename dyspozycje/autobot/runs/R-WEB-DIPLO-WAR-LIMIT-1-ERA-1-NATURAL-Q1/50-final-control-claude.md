STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1
GOAL: maks. 1 wojna epoki + 1 naturalna per cywilizacja, za flagą domyślnie OFF.
ZMIANY/COMMIT: kandydat 5d6fb1c0ba01795bbf3062f27f9c2f7f77255a1f; baza 9e84787f13e50439d5d91c19afe2fc9c4886fa01 jest przodkiem (merge-base --is-ancestor: TAK). git diff --stat: 11 plików, +659/-4: ai.ts (+7, wpięcie P4), main.ts (+78/-4), nowe: diplomacy-war-limit.ts, diplomacy-war-limit-params.json (limitWojenAktywny=false, max 1/1), diplomacy-war-concurrency-analyze.cjs, 2 testy, raporty i smoke jsonl/summary. diplomacy-pn-engine.ts NIE zmieniony (zarzut 2 zamknięty). Allowlista: OK; alliance-war-obligation.ts i diplomacy.ts nie zmieniane (dopuszczalne: bramka kaskady siedzi w main.ts applyAllianceObligationsOnWar).
TESTY (własne, surowe wyjścia, worktree na 5d6fb1c0): tsc --noEmit exit 0; diplomacy-war-limit-unit-test 48/0; diplomacy-war-limit-analyze-test 17/0; logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; diplomacy-test 149/0; alliance-strength-unit 33/0; zero-trust-unit 43/0 (dispatch podaje 45: rozbieżność dokumentacyjna, test przechodzi w całości); ai-ai-alliance-tick 19/19 + mutanty 8/8; ai-ai-coalition ZIELONE. Bieg dymny ON nie powtórzony przeze mnie (NIE_ZMIERZONO samodzielnie); artefakt obrony: seed 4242, 40 tur, 8 wierszy, stop=null, maks. 1 wojna/cyw., ale tylko 3 wojny w t40 (próba nierozstrzygająca).
OCENA ZARZUTÓW:
1 (brak wpięcia w ai.ts/obligation): zamknięty. ai.ts P4 ma !rel.limitWojenNaturalnaZablokowana; kaskada i wojna epoki bramkowane w main.ts (potwierdzone w diffie). Flaga OFF: pole undefined/false, warLimitPermits zwraca true = parytet decyzji.
2 (plik spoza allowlisty): zamknięty, diff pn-engine pusty.
3 (testy): częściowo. Czysta funkcja i collectWarTypes pokryte i zmutowane; wpięcie w main.ts (gracz jako deklarujący nieograniczony, kaskada) bez testu automatycznego: NOTA.
4 (bieg dymny): wykonany, słaby dowód (patrz wyżej): NOTA.
5 (kubełek 0): naprawiony; wykluczenie państw-miast z pomiaru to zamierzone zawężenie, decyzja semantyczna: NOTA/ABC.
6 (bramka epoki liczy wojny gracza jako celu): nie naprawiam; zachowanie zgodne z literą reguły (limit dotyczy atakującego I obrońcy), a flaga jest OFF; wymaga ABC przed włączeniem flagi. ownerDeclareWarOn (AI->gracz) podlega limitowi naturalnych, ścieżka force omija bramkę.
7 (typ dołączonej wojny gracza): naprawiony (dziedziczenie typu w enqueueAllianceWarCall accept).
UWAGA techniczna: withWarTyp zapisuje typWojny w meta pary także przy fladze OFF (nowe pole w zapisach, nieszkodliwe dla starych; brak pola = naturalna).
BLOKADY: brak blokad technicznych. Warunki przed włączeniem flagi (nie przed integracją): ABC dla zarzutu 6 i państw-miast; dłuższy pomiar ON vs OFF (wiele ziaren, 90 tur); test wpięcia gracz-deklarujący/kaskada.
RUNDY: FC 1/5 (runda tematu 2/5)
NASTĘPNY KROK: integracja orkiestratora (merge 5d6fb1c0 do main, bramki), flaga pozostaje OFF; pomiar ON/OFF jako osobny temat; ABC o włączeniu.
UWAGI-DLA-ORKIESTRATORA: dispatch podaje zero-trust 45, faktycznie 43; skorygować bramkę w dokumentacji.
DEPLOY/PUSH: NIE WYKONANO
