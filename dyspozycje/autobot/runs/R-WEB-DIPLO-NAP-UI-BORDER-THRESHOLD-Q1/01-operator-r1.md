STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — dyplomacja UI: próg Relacji paktu o nieagresji
TEMAT: R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1
GOAL: UI (blokada akcji '2' + notka) i silnik (evaluateProposal::case 'nap') liczą JEDEN efektywny próg Relacji: progNapRelacja + narzut „Kara za wspólną granicę" (+20) + delta flagi agresora (+15), słodzik tylko w ocenie oferty. Zaufanie ≥ 30 bez zmian.
ZMIANY/COMMIT: 9ff88403f (baza origin/main b9d8fa546). Allowlista zachowana: `gra/src/game/diplomacy-locks.ts`, `gra/src/game/diplomacy-proposals.ts`, `gra/src/main.ts` (tylko buildDiplomacyLockContextBase, +2 pola), NOWY `gra/tools/diplo-nap-border-threshold-test.cjs`, `dyspozycje/autobot/runs/R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1/**` (evidence 2 PNG). NIE zmieniano: gra-robocza, WERSJE.md, rust-port, src-tauri, battle, diplomacy.ts, ai.ts.

POMIAR PRZED (origin/main, testy na realnych funkcjach):
- Normalny bez granicy: UI 110 / silnik 110 (zgodne)
- Normalny ze granicą: UI 110 / silnik 130 (rozjazd -20)
- Trudny bez granicy: UI 120 / silnik 120
- Trudny ze granicą: UI 120 / silnik 140 (rozjazd -20)
- Agresor + granica (Normalny): UI 110 / silnik 145 (rozjazd -35; delta agresora też nieuwzględniona w UI)
Miejsca liczenia progu NAP: diplomacy-proposals.ts evaluateProposal case 'nap'; diplomacy-locks.ts case '2'; main.ts buildDiplomacyLockContextBase (progNapRelacja); ai.ts ~6914 (inicjatywa AI); diplomacy-proposals.ts ~2153 (komentarz o luce AI).

PO ZMIANIE:
- Nowa funkcja napRelacjaProgEfektywny() (diplomacy-proposals.ts) — używana przez evaluateProposal i locks (case '2').
- locks: notka „zablokowana — wymaga Relacji 130 (masz 125; +20 za wspólną granicę)"; przy zaufaniu też nie-spełnionym — łączna notka z tą samą przyczyną.
- main.ts: karaWspolnaGranica = ten sam predykat co ścieżka silnika (obie strony > 2 miasta ∧ ownersShareLandBorderLive); napAgresorAktywny = czyAgresorAktywny(ME(), turn).
- Mutacja (wyłączenie flagi granicy w locks): 5 FAIL → przywrócone: 14/14.

TESTY (9ff88403f; gra/ npm ci --ignore-scripts, tsc --noEmit):
- tsc --noEmit: EXIT=0
- diplo-nap-border-threshold-test (NOWY): 14 OK / 0 FAIL (4 scenariusze UI=silnik, notka, Zaufanie 29, regresja bez granicy, agresor+granica)
- diplo-nap-trust-30-test: 25/25
- diplomacy-locks-test: 88/0
- diplomacy-test: 148/0
- diplomacy-war-gates-test, diplomacy-treaties-test, diplomacy-audience-actions-test, diplomacy-acceptance-points-test, diplomacy-sensible-deals-test, diplomacy-peace-lock-test: EXIT=0
- dyplo-pakt-ekspansja-granica-test, dyplo-kara-granica-realna-test, wiarygodnosc-test: EXIT=0
- diplomacy-proposal-test: 186/188 (zgodne z baseline FC; 2 pre-existing FAIL o pokoju, nie NAP)
- ai-test: 274 passed / 20 failed (zgodne z baseline 274/20)
- Chromium diplo-nap-trust-30-live-test (vite build do scratchpad, SKIP_BUILD=1): 6/6, 0 pageerror/console.error; zrzuty: evidence/01-pakt-zaufanie-29-zablokowany.png, evidence/02-pakt-zaufanie-30-dostepny.png. To jest scenariusz BEZ granicy (smoke na zmienionej ścieżce main.ts).

NIE_ZMIERZONO (uczciwie):
- Chromium z aktywną „Karą za wspólną granicę" (notka 130/140 w panelu) — brak hooka testowego do ustawienia miast i wspólnej granicy lądowej; dodanie hooka wymagałoby main.ts poza allowlistą. Próg w tej ścieżce pokryty testem jednostkowym na realnej funkcji, nie zrzutem.
- AI (ai.ts ~6914, inicjatywa AI → pakt): NIE zmieniano. AIDiplomacyInput nie niesie flagi granicy ani agresora; podłączenie wymaga zmian w main.ts/ai.ts poza allowlistą. Luka opisana w komentarzu diplomacy-proposals.ts ~2153 pozostaje: AI sama proponuje pakt przy Relacji ≥ progNapRelacja − napScoreEase, a gracz przyjmuje ręcznie bez progu (ścieżka C-DYP-Q1=A), więc przy wspólnej granicy pakt może zostać zawarty poniżej 130/140. Wymaga osobnego tematu.
- Źródło Relacji: UI liczy relTotal przez audienceRelTotal (zaufanie + objectiveRespektPctToward), silnik przez relationScore(relation.respekt zapisany). Nie zweryfikowano, czy są zsynchronizowane w każdej turze; poza tym tematem.

BLOKADY: brak dla zakresu tematu. Uwaga procesowa: przez pomyłkę w pierwszym `npm ci` przekierowanie `>/scratch` mogło utworzyć plik `/scratch` w katalogu głównym (usunięcie zablokowane przez zabezpieczenie; nie ponawiano). Do decyzji właściciela/orkiestratora.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (diff 9ff88403f, mutacja, allowlista, 3 pliki gra/src + test); FC po Evaluatorze. Opcjonalnie osobny temat: hook testowy granicy dla Chromium + przekazanie karaWspolnaGranica do inicjatywy AI (ai.ts/main.ts).
DEPLOY/PUSH: NIE WYKONANO
