# 05 — EVALUATOR (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-PRACA-JEDEN-PODZIAL-Q1`
GOAL: **Jeden** podział Pracy budynki/ulepszenia, suma 100%, stosowany **dokładnie raz**,
cap ulepszeń ≤50%, identycznie globalnie i w mieście; usunięty duplikat liczenia; nazwy
opisują to, czym rzeczy naprawdę są. (Zgodny z `00-dispatch.md` co do słowa — §16a pkt 9
bez zastrzeżeń.)

ZMIANY/COMMIT: oceniane `814fe172`, merge-base `9c6eef00` (§9 poz. 9). Własny worktree
`/home/user/wt-EVAL-R-PRACA-PODZIAL-r2`, własny harness i własny real render — bramek Operatora
użyłem dodatkowo, nie zamiast. Diff wyłącznie w allowliście (8 plików `gra/src`, 10 bramek
`gra/tools`, artefakty runu); `gra/data/**` i `WERSJE.md` nietknięte, `git diff --check` czysty,
zero sekretów, zero usunięć spoza F1/F2.

## F1 ZAMKNIĘTY — pomiarem, nie odczytem (to ja go w rundzie 1 złapałem)

`main.ts` nie podaje już `improvementBudgetCap`; pułap liczy picker jako `pracaAutoPercent% ×
pracaAvailable` (pula SKUMULOWANA), AI dostaje `floor(aiPool×aiPct/100)` z tej samej bazy
(`aiPracaPoolByOwner` nie zmienia się między naliczeniem a użyciem — parytet realny).
Koszty (rząd 1): droga 30, oboz_lowiecki 36, farma/glinianka 40, kamieniolom 44, irygacja 60.

| pula skumulowana | 300 | 500 | 5 000 | 50 000 | 1 000 000 |
|---|---|---|---|---|---|
| ulepszeń — runda 2 | **2** | **4** | **41** | **217** | **217** |
| ulepszeń — runda 1 (cap = wpływ 12) | 0 | 0 | 0 | 0 | 0 |

| wpływ do puli / turę | 3 | 6 | 9 | 12 | 20 | 24 | 36 |
|---|---|---|---|---|---|---|---|
| ulepszeń w 60 turach (runda 2) | **2** | **6** | **11** | **15** | **27** | **33** | **51** |
| pierwsze w turze | 41 | 21 | 14 | 11 | 7 | 6 | 4 |
| runda 1, to samo wejście | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Próg „zero ulepszeń niezależnie od wielkości puli" **zniknął**; wbudowana kontrola negatywna
(stary wiring, ten sam harness) nadal daje zero — pomiar nie jest tautologią.

## F2 ZAMKNIĘTY — real render Chromium (mój własny, 14/0)

Trzy panele czytają JEDNĄ stałą (`PODZIAL_PRACY_PULA_LBL*` w `game/cities.ts`). W żywej
przeglądarce zmierzyłem faktyczny HTML obu paneli zmienionych w rundzie 2: hero „Ulepszenia
(pula) 30%", etykiety 30% + Budynki 70% = 100%, suwak `min=0 max=50`, tooltip bez „Nadrzędny
podział całej puli", HUD „Podział Pracy: Budynki / Ulepszenia (pula)". Zero błędów konsoli, zero
przepełnienia w poziomie; mutacja etykiety na gołe „Ulepszenia" czerwieni te asercje. Sygnatura
`onEmpirePracaSplitChange?: (procentPuliImperium: number)`; wzorzec `doUlepszen = doPuli` nie
występuje już w kodzie (tylko w komentarzach historycznych).

## F3 ZAMKNIĘTY — dowód behawioralny zamiast regexa

Sprawdziłem mutacją, nie odczytem: mutant w formule pułapu `auto-improvements.ts` czerwieni
8 asercji bramki tematu, w tym „konsument puli DOSTAŁ Pracę: automat ulepszeń" (0 Pracy) —
sekcja 7 realnie mierzy zachowanie i domyka księgę (wpływ = wydatki + saldo). Dwie samospełniające
się „mutacje" z rundy 1 usunięte. Własny pomiar mutacyjny czterech konsumentów (automat, cuda,
założenie miasta, utrzymanie): każdy przy puli 0 schodzi do zera.

TESTY (moje uruchomienia): własny harness **56/0**, własny real render **14/0**; `tsc --noEmit`
0 błędów; `vite build --outDir /tmp/civ-dist-eval-r2` ✓ (C-001). Bramki tematu: kontrakt 634/0,
real-render 36/0, budmode-slider-max 13/0. Regresja: praca-limit-50 34/0, praca-miasto-limit-50
33/0, praca-miasto-limit-50-cap 50/0, ulepszenia-praca-percent 28/0, praca-split-ui 25/0,
praca-pula-rate-parity 20/0, praca-global-default-live 7/0, ai-praca-split-parity 22/0,
praca-cap-migracja-luka 11/0, auto-improvements 45/0, production-overflow 201/0,
empire-praca-panel-coverage 15/0. Referencyjne: 213/213, 19/19, 33/33, 13/13, 6/6. Cztery bramki
czerwone pre-istniejąco: 57/3, 6/2, 2/7, 4/2 — identycznie, diff ich nie dotyka. Podział z rundy 1
nadal działa: 6 wartości × 400 wielkości Pracy — suma 100% zawsze, cap ≤50% zawsze, odchyłka
≤0,5 Pracy; 70/30 przy 10 Pracy → 3, 50/50 → 5. Nietautologiczność bramki tematu (moje mutacje
na kopii źródła): wiring F1 → 1 FAIL, nazwa F2 → 1 FAIL, cap 50→40 → 17 FAIL, pułap → 8 FAIL.
Aktualizacje bramek są jawnie uzasadnione (co pilnowała / dlaczego przestało być prawdą / co
pilnuje teraz) i zacieśniają pokrycie — sprawdziłem każdą.

## UWAGI (§3b: żadna nie dotyczy GOAL, dowodu kryteriów, zakresu, §9 ani gotowości do integracji)

1. Efektywny budżet automatu ulepszeń to teraz 33% salda puli na turę (polityka imperium,
   `R-AUTO-PRACA-BUDZET-PROCENT-Q1=B`) — zmiana widoczna w rozgrywce wobec stanu sprzed tematu,
   do nazwania w rejestrze, nie do naprawy.
2. `production-overflow` stracił pin „wpływ do puli = poolGain + overflowToPool" (sekcja 13 padła
   razem z nieistniejącą już mapą). Zachowanie w `main.ts` bez zmian, ale bez straży.
3. Z rundy 1, nadal otwarte: pusta kolejka → 100% Pracy miasta do puli (sensowne, nienazwane
   w kontrakcie); `toggleCityPodzialPracyOverride` zostawia override przy wartości równej globalnej;
   migracja legacy nadpisuje wynik `migratePodzialPracyOnLoad` (nieosiągalne dla realnych zapisów).
4. `04-operator-r2.md` nie ma pól `GOAL` i `BLOKADY` z §4 — skutek awarii infra (raport pisał
   orkiestrator), nie wada pracy kodowej.

5. Ten raport przekracza orientacyjne ~400 słów z §11 — tabele pomiarowe F1 są jawnie zamówione
   w dyspozycji rundy 2 („brak dowodu zgłaszaj jako brak dowodu"), więc zostawiam je w całości.

Uwagi 1–3 do zapisania jako osobne tematy w `REJESTR-PROSB-I-ZADAN.md` przed zamknięciem (§3b).

BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: Final Control (runda 2).
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej z tym raportem — tak; deploy — nie).
