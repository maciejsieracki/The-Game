# R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora 86061177a)

STATUS: PASS-WITH-NOTES (poprawka zarzutu 1 + częściowe przyjęcie zarzutu 2; reszta odrzucona lub zgłoszona jako uwagi)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1
GOAL: Cena 0 → pokój bez miasta; na końcu zmęczenia (>= progKoncaZmeczenia, domyślnie 0,8) pokój BEZWARUNKOWY także dla silniejszej strony, zarówno AI↔AI jak i AI→gracz (bez miasta i bez płatności; gracz decyduje).
BAZA: d4d261e3b (origin/main). Kandydat r1: 2f8128bf2. Poprawka: commit w tej samej gałęzi (SHA w polu sha wyniku).

## Odpowiedzi na zarzuty

### Zarzut 1 (WYSOKI, AI→gracz płatność/odrzucenie) — PRZYJMUJĘ, poprawka + dowód
Zweryfikowane odczytem kodu: w kandydacie `zaproponuj_pokoj` z ai.ts (payload {}) przechodził przez `enqueueNegotiationFromAiCmd` z `peaceBareAllowed` tylko dla `rodzaj === 'rozejm'`; przy `neededPn > 0` dopisywał `receiveItems` (płatność od gracza); przy `neededPn <= 0` goły pokój był odrzucany przez guard `!giveItems && !receiveItems && !goldOnce`.
Poprawka:
- `gra/src/game/ai.ts` typ `zaproponuj_pokoj` dostał pole opcjonalne `bezwarunkowy?: boolean`; gałąź końca zmęczenia ustawia `bezwarunkowy: true` (komentarz w kodzie).
- `gra/src/main.ts` `enqueueNegotiationFromAiCmd`, blok `zaproponuj_pokoj`: `const unconditionalEnd = workingCmd.bezwarunkowy === true;`, `neededPn = unconditionalEnd ? 0 : peaceOfferAiRequestPn(...)`, `peaceBareAllowed = (rodzaj === 'rozejm' || unconditionalEnd) && neededPn <= 0 && brak pozycji && goldOnce <= 0`. Zwykły pokój (poza końcem zmęczenia) bez zmian.
- Konwerter `aiCommandToPendingProposal` dla `zaproponuj_pokoj` (diplomacy-proposals.ts ok. :2114) zwraca payload {} dla pokoju bez rozejmu, więc goły payload przechodzi guardy.
Uwaga zakresowa dla FC: zmiana w main.ts leży w `enqueueNegotiationFromAiCmd`, a allowlista dispatchu dla main.ts mówi „WYŁĄCZNIE tickAiAiWarWeariness i wywołania ścieżki zmęczenia”. Uznałem, że to jest okablowanie ścieżki zmęczenia AI→gracz (żądane wprost w zarzucie 1). Do rozstrzygnięcia przez FC.
NIE ZMIERZONO: uruchomiona gra / przeglądarka — ścieżka AI→gracz nie była odtworzona end-to-end.

### Zarzut 2 (ŚREDNI, brak testu behawioralnego AI→gracz) — PRZYJMUJĘ CZĘŚCIOWO
Dodano statyczne wiązania z mutacją: `aiWiringOk` sprawdza też `bezwarunkowy: true` w ai.ts (1 wystąpienie); nowe `mainWiringOk(MAIN_SRC)` sprawdza trzy linie w main.ts (flaga, neededPn, peaceBareAllowed); mutant MAIN-U7 (`const unconditionalEnd = false;`) jest wykrywany przez `mainWiringOk`.
Nie dodano testu behawioralnego ścieżki AI→gracz: `enqueueNegotiationFromAiCmd` to domknięcie wewnątrz funkcji w main.ts, nieeksportowane, więc nie da się go wywołać z testu cjs bez uruchamiania całej gry. To jest luka, zgłaszam ją jako NIE ZMIERZONO (zob. UWAGI-DLA-ORKIESTRATORA).

### Zarzut 3 (NISKI, st.peak w tick vs wearyLevel w ai.ts) — PRZYJMUJĘ jako znane ograniczenie, NIE NAPRAWIAM
Potwierdzone: war-weariness.ts:245 `lvl = st.peak` (monotoniczny), ai.ts używa bieżącego `wearyLevel`. Dispatch nie wymagał ujednolicenia; zmiana źródła poziomu w ai.ts dotknęłaby ogólnej mechaniki zmęczenia poza zakresem. Ryzyko: oferta AI→gracz może pojawić się/zniknąć wokół progu, gdy zmęczenie spadnie po zmianie miasta. Do decyzji orkiestratora.

### Zarzut 4 (NISKI, cooldown powtórek AI→gracz) — NIE ZBADANO w pełni
Komentarz ai.ts ok. :7026 mówi, że powtórki ogranicza „istniejący cooldown odrzuconych ofert”. Nie prześledziłem mechanizmu do końca. Najbliższa znana bramka to `peaceProposalIsTooEarly` (main.ts:11767, wywoływana w enqueueNegotiationFromAiCmd), która dotyczy tylko czasu wojny, nie odrzuceń. Brak dowodu na ograniczenie powtórek — NIE ZMIERZONO.

### Zarzut 5 (NISKI, forced-peace runAiAiPeaceTick bez zmian) — PRZYJMUJĘ jako lukę do rejestru, NIE NAPRAWIAM
Dispatch wymagał wylistowania ścieżki „forced-peace po limicie tur” (zrobione w sekcji ŚCIEŻKI), a nie zmiany jej zachowania. Luka: przy cenie 0 plan płatności jest pusty; nie zbadano, czy decideAiPeaceRequest zwróci accept_paid bez miasta.

### Zarzut 6 (NISKI, pokój AI↔AI pomija isAiAiPeaceBalanceAllowed i d.battlePending) — PRZYJMUJĘ jako uwagę, NIE ZMIENIAM
Potwierdzone: gałąź końca zmęczenia w war-weariness.ts (ok. :256-268) jest przed regułami miast i nie sprawdza battlePending. Pokój bezwarunkowy na końcu zmęczenia ma z definicji nie wymagać bilansu miast; sprawdzenie battlePending nie było w dispatchu. Decyzja dla właściciela/orkiestratora: czy odroczyć koniec wojny przy oczekującej bitwie.

### Zarzut 7 (INFO, próg 0,8 to założenie; PRE_END_PARAMS w testach) — PRZYJMUJĘ jako informację
Próg 0,8 jest jawnym założeniem z dispatchu (do potwierdzenia przez właściciela). Testy ai-war-weariness-peace-test i diplo-peace-ai-ai-nonnegative-test wyłączają koniec zmęczenia przez PRE_END_PARAMS dla całych plików (zgodnie z zasadą nieosłabiania asercji — asercje bez zmian). Produkcyjny próg testuje nowy test. Dokumentacja/Civpedia niezaktualizowane (poza allowlistą, zadanie #353).

## ZMIANY-COMMIT
- gra/src/game/ai.ts: typ `zaproponuj_pokoj` + pole `bezwarunkowy?`; gałąź końca zmęczenia z `bezwarunkowy: true` (+4/-1 linia).
- gra/src/main.ts: `enqueueNegotiationFromAiCmd` — flaga bezwarunkowy znosi neededPn i wymaga bezpłatnego pokoju (+6/-2 linie).
- gra/tools/diplo-weariness-unconditional-end-test.cjs: MAIN_TS, mainWiringOk, aiWiringOk rozszerzony, mutant MAIN-U7 (+17/-1).
- dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1/30-obrona-claude.md (ten raport).
Commit: patrz SHA w wyniku. Nie użyto git add -A; gra/node_modules (ignorowane) pochodzi z `npm ci --ignore-scripts`.

## TESTY (liczby z surowego wyjścia tej sesji)
- `npx tsc --noEmit` (gra/): exit 0.
- logic-test: PASS [213] (rc 0). research-test: PASSED 33 / FAILED 0. combat-test: "All sanity checks passed" (rc 0). ai-test: 297 passed, 0 failed. diplomacy-test: 149 passed, 0 failed. tech-tree-test i unit-replace-test: rc 0, bez linii podsumowania w grepie (rc 0 potwierdzony).
- diplo-weariness-city-only-test: PASS=29 FAIL=0. ai-war-weariness-peace-test: PASS=99 FAIL=0. diplo-peace-ai-ai-nonnegative-test: 21 PASS, 0 FAIL. diplo-peace-weaker-seeks-city-only-test: PASS (rc 0). diplo-peace-stance-wiring-test: PASS (rc 0).
- diplo-weariness-unconditional-end-test (nowy): PASS=22 FAIL=0 (było 20; dodano 2 sprawdzenia wiązania main.ts). Mutanty U1–U5 i MAIN-U7 czerwienią testy (U1: c1,c2,c3,d1,e1,e2; U3: a1,a2,a3; U5: c1,c2,c3,d1; MAIN-U7: wykryty statycznie).
- diplo-war-peace-sim-test: 3 FAIL (S3, S4b, M_TUR) — ten sam dług co baza (DODATEK). Output: $SP/sim-after.txt (scratchpad). NIE PORÓWNANO z bazą na tej samej sesji; liczba zgodna z zarzutem Evaluatora.
- Git: `git diff --check` czysty.

## BLOKADY
- Ścieżka AI→gracz nie zweryfikowana w uruchomionej grze (NIE ZMIERZONO).
- Zarzuty 4 i 5 niezbadane / luka do rejestru.

## RUNDY
1/5 (runda obrony odpowiadająca na zarzuty r1).

## NASTĘPNY KROK
Evaluator r2 na commit poprawki: sprawdzić poprawkę zarzutu 1 (main.ts ~20541-20562, ai.ts ~7040-7056) i mainWiringOk; FC: rozstrzygnąć zakres main.ts vs allowlista oraz decyzję o battlePending (zarzut 6).

## UWAGI-DLA-ORKIESTRATORA
1. Zakres main.ts: zmiana w enqueueNegotiationFromAiCmd jest poza dosłownym brzmieniem allowlisty (tickAiAiWarWeariness); wymaga akceptacji FC.
2. Battle pending: pokój bezwarunkowy AI↔AI nie sprawdza d.battlePending (zarzut 6) — decyzja właściciela.
3. Cooldown odrzuconych propozycji AI→gracz nie został zweryfikowany (zarzut 4).
4. Forced-peace (runAiAiPeaceTick) przy cenie 0 nie zbadany (zarzut 5) — kandydat do osobnego tematu.
5. Źródło poziomu zmęczenia: st.peak (tick) vs wearyLevel (ai.ts) (zarzut 3).
6. Dokumentacja/Civpedia zmęczenia nieaktualna (zadanie #353 w kolejce) — poza allowlistą tego tematu.
7. Nie zakładano sesji ani tasków (zakaz respektowany).

DEPLOY/PUSH: NIE WYKONANO
