STATUS: BLOCK (część GOAL wykonana i zmierzona mikro; cel 2x łącznego końca tury NIE_ZMIERZONO i NIE osiągnięty — brak Chromium w środowisku R2, tylko 1 z kilku napraw wdrożona)
DOMAIN: GAME
TEMAT: R-WEB-PERF-ENDTURN-AI-PHASE-Q1
GOAL: JS końca tury (137 miast / 321 jednostek) >= 2x niżej vs 55e098dc5, bez zmiany wyników i determinizmu AI.
ZMIANY/COMMIT: BAZA R2 = 24186ef52 (okno stawek 39f96124c zostaje), origin/main już zawarty (merge: Already up to date). R2: gra/src/game/resource-access.ts (getResourceAccessForCity liczy tylko collectActiveAccess+sortLabels; nie woła collectDepositPotential), NOWY gra/tools/perf-endturn-resource-access-equiv-test.cjs, logi gate-*.txt. SHA commitu R2: patrz odpowiedź końcowa (git log). Zero zmian w render/, gra/data, WERSJE.md, rust-port.
TESTY:
- Równoważność wartościowa (prawdziwe funkcje przez esbuild): 300 przypadków miasto x losowy stan (276 niepustych), różnic=0; niezależność od epoki OK. Mutacje WYKRYTE: ignoruj placedImprovements (252 różnice), odwrócone sortowanie (252), ignoruj options (126). gate-equiv-resource-access.txt EXIT=0.
- Mikro-benchmark (syntetyczny stan 137 miast / 6561 heksów, NIE zapis prawdziwej gry; n=9 naprzemiennie, load 3.2): przed (getCityResourceAccessForCity.active) min 22.2 / med 22.7 / max 24.5 ms; po min 13.1 / med 13.5 / max 14.3 ms (-40%, wynik identyczny). Dotyczy kosztu 1 przebiegu po wszystkich miastach.
- tsc --noEmit EXIT=0 (gate-tsc-r2.txt); logic-test 213/213 EXIT=0 (gate-logic.txt); ai-test 274 passed / 20 failed (= baza, te same; EXIT=1 tak jak na bazie; gate-ai-test.txt).
- Regresje (82 testy: resource*, deposit*, diplomacy*, trade-*, okolica*, war-allin*, building-resource*, ai-resource*, turn-economy*): kandydat vs baza (resource-access.ts cofnięty) wynik rc identyczny, 11 FAIL/timeout preegzystujących na obu (m.in. war-allin-capital-test hashe 6b, diplomacy-*, okolica-*, trade-ilosc, deposit-coast timeout). gate-regr-vs-base.txt.
NIE_ZMIERZONO / NIE_ZROBIONE (uczciwie):
(a) łączny koniec tury A/B/A/B n>=5 i profil CDP top-15 udziałów: NIE wykonane — w tym środowisku nie ma Chromium (which: brak), harness live niedostępny; brak zapisu stanu dużej gry. Nie mam więc tabeli udziałów ani stosunku median.
(b) kolejne naprawy z poszerzonej allowlisty (computePathImpl/siegeBlocksEntry/marchPathFor, pickAutoImprovements, tyAll/computeWorkedMagazynYieldsByCity): NIE wdrożone — bez profilu nie wolno ich dobierać (dispatch: tylko dominujące). Szacunek z R1: łącznie ~20% EOT, 2x nieprawdopodobne bez nowych napraw i render/ (syncUnitsRender 0.34-1.5 s, kandydat na osobny temat, render/ wykluczony).
(c) test "tyAll wspólny Map w oknie" (zarzut FC 8): niedomknięty testem dynamicznym (main.ts nie jest headless).
Determinizm AI: zmiana to czysty odczyt (bez losowań, wynik bit-w-bit równy .active), ai-test i hashe war-allin niezmienione względem bazy.
BLOKADY: brak Chromium/stabilnego hosta do pomiaru E2E i profilu CDP; zapis dużej gry niedostępny. Wymagane: środowisko z Chromium + zapisem stanu (decyzja orkiestratora) albo przyjęcie wyniku częściowego.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator oceni częściowy wynik; orkiestrator decyduje: środowisko z Chromium na rundę 3 (profil CDP, naprawy dominujące, A/B n>=5) albo zamknięcie tematu jako częściowego.
DEPLOY/PUSH: NIE WYKONANO
