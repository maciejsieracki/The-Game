# Dispatch Operator R6 — confirm the next Archer activation from R5 state

TEMAT: `R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1`
RUNDA: 6
BAZA: `28639c45b5e1ab3e4f38e6adf2d1ccb29f52a835`
WORKTREE: `/tmp/autobot-battle-closeout`

## Zakres

Użyj snapshotu końca rundy 4 z naturalnego testu Chromium R5 i odtwórz dokładnie pozycje, HP, amunicję oraz rangę jednostek 8v8 w nowej produkcyjnej scenie. Uruchom wyłącznie następne wywołanie produkcyjnej aktywacji Łucznika `atk60` przez `_activateUnit`; nie uruchamiaj kolejnej pełnej bitwy. Zarejestruj picker, odległości do wrogów, realny `_doAttack` / `_doRangedAttack`, amunicję i HP.

Zapisz pozycję `atk60`, poprzedni rząd, `formationOffset`, punkt zbiórki oraz status sąsiednich pól: zajętość, przechodniość, wynik `_compactAttackAllowsStep` i diagnostyczny wynik `_rangedFiringStepStaysBehindMelee`. Wykaż, czy przy odległości równej zasięgowi picker celuje wroga mimo jednostek sojuszniczych na linii. Utrzymaj poprawkę wyłącznie w zakresie testów i raportu; nie zmieniaj produktu, jeśli ten snapshot potwierdza prawidłową akcję.

## Ograniczenia

Dozwolone są tylko ten dispatch, raport R6, JSON/obraz dowodowy i harness testowy `gra/tools/battle-natural-near-range-r6-test.cjs`. Harness musi filtrować skład do 8v8 przed konstruktorem sceny. Nie uruchamiaj matrycy, kolejnej wieloturowej bitwy ani unrelated testów. Nie commituj, nie integruj, nie pushuj i nie deployuj.

## Warunek zamknięcia

Zapisz `17-operator-r6.md`, wynik i ograniczenia. Wyraźnie rozróżnij produkcyjne wykonanie następnej aktywacji na zhydratowanym snapshocie od pełnego organicznego przebiegu kolejnej rundy. Jeśli `_pickRangedTargetByPriority` wybierze cel w zasięgu i wykona się produkcyjny strzał, R5 `null` wyjaśnij jako pomiar przed ruchem do legalnego zasięgu, a nie błąd linii wzroku. Bez twierdzeń o szkodzie HP, jeśli losowanie zada zero.
