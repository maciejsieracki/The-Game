STATUS: FAIL
DOMAIN: GAME (AI)
TEMAT: R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1
GOAL: normalny/trudny AI trzyma garnizon wg potrzeby miasta i buduje budynki Prawa/Szczescia; pomiar PRZED/PO (seed 4242 i 7, 60 tur, poziom maksymalny).
ZMIANY/COMMIT: kandydat 4617cc91bd2bb688490c0e3e931bee947fe15510; baza 9bfb104fba9b40d8b43009d79fbf8ba0d41b9e3e jest jego przodkiem (merge-base --is-ancestor OK). Diff vs baza: 3 pliki, +235: ai-city-order-need.ts (nowy, nie wpiety), ai-city-order-need-test.cjs, 30-obrona-claude.md. Allowlista nie naruszona. (Uwaga: zarzut 1 Evaluatora "kandydat identyczny z baza" jest nieprawdziwy co do faktu, ale wniosek - brak dostarczenia celu - sie zgadza.)
OCENA ZARZUTOW: (1) CZESCIOWO - funkcja istnieje, ale nie jest wpieta w rekrutacje, wiec zachowanie AI niezmienione: NAPRAW. (2) PRAWDA - brak preferencji budynkow Prawa/Szczescia: NAPRAW. (3) ODRZUCONY - testy N1-N6 + M1-M3 sa dostarczone (35/0). (4) PRAWDA - brak diagnozy PRZED/PO i dokumentu analizy: NAPRAW.
TESTY (wlasne uruchomienie na 4617cc91b, po npm ci --ignore-scripts): tsc --noEmit gra/ EXIT=0; ai-city-order-need-test 35 passed, 0 failed; ai-city-garrison-min-one-test 38 passed, 0 failed. NIE URUCHOMIONO 5 bramek referencyjnych (logic/tech-tree/research/combat/ai-test): kandydat nie zmienia zadnego kodu uzywanego w grze (nowy plik nie jest importowany), wiec nie sa informatywne; werdykt FAIL wynika z braku dostarczenia celu, nie z regresji.
BLOKADY: brak wpiecia need w rekrutacje (cel gameplayowy niespelniony); brak preferencji budynkow; brak pomiaru PRZED/PO na poziomie maksymalnym; brak dokumentu analizy.
RUNDY: 1/5
NASTEPNY KROK: runda 2 do Operatora (ten sam ID): wpiecie aiCityGarrisonNeed za aiGarrisonNeedApplies, preferencja budynkow Prawa/Szczescia, pomiar PRZED/PO seed 4242 i 7 x 60 tur przy maksimum, dokument AI-KULTURA-RELIGIA-2026-11-26.md, testy wpiecia + mutacje.
UWAGI-DLA-ORKIESTRATORA: brak pytan ABC wynikajacych z tej rundy. Pytanie 36 (CULTIMPL) pozostaje w rejestrze.
DEPLOY/PUSH: NIE WYKONANO
