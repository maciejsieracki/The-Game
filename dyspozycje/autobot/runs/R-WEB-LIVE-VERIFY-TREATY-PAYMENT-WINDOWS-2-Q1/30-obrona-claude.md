STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na żywo; zmiany logiki gry: brak)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1
GOAL: obrona r3 (Evaluator 8735e375): odpowiedź na 6 zarzutów; cel (a) bez zmian.
ZMIANY-COMMIT: baza kodu 80069f716 (kandydat r3). Commit obrony: gra/tools/diplo-treaty-pay-window-live-verify-2-test.cjs (zarzut 6), dowody/pay-window-D-case2.png (zarzut 2), dowody/pay-window-live-r4.log, dowody/pay-window-mutation-r4.log. SHA: patrz pole sha w odpowiedzi orkiestratora (commit po zapisie tego pliku). Źródło gry NIE zmienione (git diff 80069f716 -- gra/src: pusto).

ODPOWIEDZI NA ZARZUTY:
1. Wiersz D niewidoczny na zrzucie (title): PRZYJMUJĘ jako ograniczenie, NIE naprawiam (zmiana UI poza allowlistą). Treść wiersza dowodzona DOM-em (log r4: „Dopłata traktatu: 606 złoto (pokrywa 606 PN; oddane razem z zawarciem traktatu)”). Wizualnie przez człowieka: NIE ZMIERZONO.
2. Brak pay-window-D-case2.png: PRZYJMUJĘ. Bieg r4 zapisał case1/case2/case3 (402172 B, 402230 B, 403089 B; DSF 1, 1400x900) do dowody/. Każdy plik <1 MB (sumarycznie 1,2 MB; limit odczytany jako per zrzut).
3. (d-rozejm) NIE ZMIERZONO: PRZYJMUJĘ zarzut jako dług. Nie wykonano w tej rundzie (zakres R3 = cel (a)); acceptTruceForTest nie był użyty ani sprawdzony. Powód techniczny nie istnieje — to była decyzja kolejności, poprawnie zapisać jako NIE ZMIERZONO.
4. Zakres tylko AI→gracz, przemarsz: ODRZUCAM jako niespełnienie r3 — DODATEK R3 wymaga „przemarsz LUB wasal” (cel a), test pokrywa przemarsz. PRZYJMUJĘ jako NIE ZMIERZONO: wasal, sojusz oraz kierunek gracz→AI (nie były w zakresie R3).
5. Dublowanie wiersza D i PW w tooltipie (kosmetyka): ODRZUCAM w tym temacie — poza allowlistą (diplomacyAcceptanceBalance.ts nie jest na liście, main.ts tylko hooki). Zgłoszone w UWAGI-DLA-ORKIESTRATORA jako kandydat R-WEB-UI-*.
6. Ciche przejście na hak treatyPayAcceptAiPendingForTest: PRZYJMUJĘ — PRZED: gałąź else logowała UWAGA i akceptowała hakiem. PO: asercja iii0 „Przyjmij aktywny w oknie” = FAIL, brak fallbacku (plik test, linie ~160–166). Dowód: r4 nadal 29/29 (przyciski aktywne we wszystkich 3 przypadkach).

TESTY (surowe, z tego biegu):
- Live r4 (Chromium, bundle /tmp/lv4-bundle, SKIP_BUILD=1): „29/29 passed”, log dowody/pay-window-live-r4.log. W tym: iv r≈1,3 (tooltip) 3/3; iii przelew == wiersz: W-A złoto 606/606; W-B złoto 100/100 + brąz 1700/1700; W-C tech Obróbka drewna + złoto 596/596; v zero pageerror/console.error.
- Mutacja (kopia źródła, sed usunął linię 808 plainTextWithTitles(treatyPaymentRowHtml(...))) → bundle /tmp/lv4-mut: „1/4 passed”, FAIL i w 3 przypadkach (dowody/pay-window-mutation-r4.log). Źródło przywrócone z kopii /tmp/lv4-orig-dab.ts, cmp zgodne.
- Bramki: tsc --noEmit exit 0; logic 213/213 (LOGIC OK); tech-tree 20 pass, 0 fail; research 33/33; unit-replace 21/21; combat 6/6.

BLOKADY: brak. Zależności: gra/node_modules zainstalowane npm ci --ignore-scripts (nie w git). Bundle: /tmp/lv4-bundle, /tmp/lv4-mut.
UWAGI-DLA-ORKIESTRATORA:
- Kosmetyka tooltipu (zarzut 5): kandydat R-WEB-UI-* — nie w tym temacie.
- Kierunek gracz→AI i wasal/sojusz oraz (d-rozejm): do osobnego tematu, jeśli właściciel chce.
RUNDY: 3/5 (obrona zarzutów Evaluatora do r3; model obrony HAIKU 5.5).
NASTĘPNY KROK: Evaluator (weryfikacja r4 i commitu obrony); potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
