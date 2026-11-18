# R-WEB-DIPLO-WAR-BY-ALLIANCE-STRENGTH-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (nowa funkcja AI, za flagą OFF)
TEMAT: R-WEB-DIPLO-WAR-BY-ALLIANCE-STRENGTH-Q1
GOAL: słaba AI z sojusznikami może wypowiedzieć wojnę siłą bloku (AI + sojusznicy) przeciw partnerowi z blokiem (partner + sojusznicy); flaga `wojnaSilaSojuszuAktywna` domyślnie false = zachowanie identyczne jak dotąd.
BAZA: 7a8acd6b8fa2dc4b9b0666823e821ba7e64359c7 (origin/main, ancestor OK). `git rev-parse HEAD` przed commitem: 7a8acd6b8fa2dc4b9b0666823e821ba7e64359c7.

ZMIANY/COMMIT:
- nowy `gra/src/game/diplomacy-alliance-strength.ts`: `blockStrength(strona, owner, allies, wykluczone)`, `blockHasAdvantage(a, b, prog)`, flaga + hak `setWarByAllianceStrengthForTest`, typ `BlokSojusznik`.
- nowy `gra/data/diplomacy-alliance-war-params.json` (`wojnaSilaSojuszuAktywna: false`).
- `gra/src/game/ai.ts`: pola opcjonalne `blokSojusznicyAI` / `blokSojusznicyPartnera` w `RelacjaWejscie`; w P4 (wypowiedz_wojne) siła porównywana to siła bloku tylko za flagą; próg, Zaufanie<30, agresja, NAP, peaceLocked, okno wczesne BEZ ZMIAN; powód dopisuje `[blok sily: ...]` tylko za flagą.
- `gra/src/main.ts`: helper `blokSojusznicyDla` (aktywne sojusze sojusz_pelny/sojusz_defensywny z `activeDeals`, bez wasali, siła sojusznika mierzona `diploMilitarySideOf(x, przeciwnik, true)`, `wojnaZAI` z `getDiploRelation`); zwraca [] przy fladze OFF; wypełnienie pól przy relacji AI↔gracz i AI↔AI.
- `gra/src/game/diplomacy.ts`: bez zmian (typ pól jest w ai.ts).
- nowy `gra/tools/diplomacy-alliance-strength-unit-test.cjs`.
- commit: patrz pole sha w odpowiedzi (tylko powyższe pliki + ten raport, `git add` ścieżkami).

TESTY (surowe wyniki z tego biegu):
- `npx tsc --noEmit` (node_modules/typescript): exit 0.
- nowy `diplomacy-alliance-strength-unit-test.cjs`: 33 OK, 0 FAIL.
- mutacja kopii (`milAiSide` ignoruje blok): 31 OK, 2 FAIL → test czerwony; przywrócono, 33/0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: 21/21.
- ai-unit-replace-same-rules-test: 45 passed, 0 failed.
- combat-test: 6 pass.
- diplomacy-test: 149 passed, 0 failed.
- ai-ai-alliance-tick-test: 19 OK.
- diplomacy-zero-trust-unit-test: PASS=43 FAIL=0.
- diplo-war-declare-zero-trust-test: 43 OK, 0 FAIL.
- `git diff --check`: czysto.
- Bieg dymny w grze: NIE (brak toru sojuszy bez flag, zgodnie z dispatchem). NIE_ZMIERZONO: metryki liczby wojen blokowych i tury pierwszej wojny blokowej (wymaga biegu z flagą ON).

BLOKADY: brak.
NIE ZROBIONO (świadomie, zgodnie z dispatchem lub poza zakresem):
- dołączanie sojusznika bloku do wojny (opcjonalny krok) — nie zrobione, kaskada nietknięta;
- reguła „1 wojna epoki + 1 naturalna” — nie zaimplementowana;
- flaga pozostaje false; brak hooka w UI.

ZAŁOŻENIA (luki w dispatchu):
- Siła sojusznika mierzona wobec przeciwnika bloku (AI-strona: wobec partnera; partner-strona: wobec AI), tą samą `diploMilitarySideOf`, bez nowych źródeł danych.
- Wasal = payer traktatu Wasalizacja (`ekonomia.payerOwnerId`); bez pola ekonomii obie strony traktowane jako wasale (ostrożnie).
- Sojusznik w wojnie z AI wyklucza się tylko po stronie AI; po stronie partnera nie (wojna z AI nie zmniejsza bloku partnera).
- `peacePosMil` (pozycja pokojowa) nadal liczy siłę własną — poza zakresem P4.

WOJNY BLOKOWE W LOGACH (odróżnialność): przy fladzie ON powód komendy `wypowiedz_wojne` zawiera `[blok sily: AI=…, partner=…, sojusznicy AI=…, sojusznicy partnera=…]`; przy OFF powód bez zmian. Reguła 1+1 (wojny koalicyjne) nie jest jeszcze policzona — do zrobienia w osobnym temacie.

NASTĘPNY KROK: Evaluator (Sonnet) — przegląd diffu ai.ts/main.ts, ocena parytetu OFF i mutacji; potem Final Control.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
