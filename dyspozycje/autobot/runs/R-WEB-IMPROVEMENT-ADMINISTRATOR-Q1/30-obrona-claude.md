STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1
GOAL: Administrator ulepszeń rekrutowany w panelu ulepszeń; auto-ulepszenia terenu gracza w mieście działają TYLKO przy działającym administratorze ulepszeń.

ODPOWIEDZI NA ZARZUTY (start c7a866c62):
1. PRZYJMUJĘ. Migracja siedziała w bloku `if (!cityAdministratorNoticeShown)`. Teraz OSOBNA flaga `improvementAdministratorNoticeShown` (meta zapisu, odczyt: `=== true`, nowa gra = true), niezależny blok migracji w main.ts, decyzja w czystej `shouldShowImprovementAdminMigration` (auto-build-gate.ts). Test: zapis z cityAdministratorNoticeShown=true bez nowej flagi => powiadomienie pokazane; sonda, że blok flagi administratora miasta nie zawiera już `city-impadmin-migration`.
2. PRZYJMUJĘ. Filtr EOT wyniesiony do czystej `selectCitiesForAutoImprovement` (auto-build-gate.ts), używanej w main.ts i w teście. Nowa sekcja (F) improvement-administrator-test: TEN SAM świat (miasta a,b,m-ręczne,AI): bez administratora = '' ; z administratorem w a = 'a'; skarbiec 0 (administrator przypisany, pracuje=false) = ''; skarbiec wraca = 'a'; AI = 'ai'. Rozróżnia przypadki. Uwaga: dowód Chromium "19->19" z oryginalnej rundy nie rozróżniał (tura 3 z adminem też 19->19) — nie traktuję go jako dowodu; dowodem jest test behawioralny. Zaktualizowano sondę autobuild-toggle-test (linia 68) pod nową nazwę funkcji.
3. ODRZUCAM jako zmianę w tej rundzie (nie moja decyzja): parytet AI zmieniłby balans AI (ai.ts, zatrudnianie AI); wymaga decyzji ABC właściciela (CLAUDE.md zasada 3: decyzje produktowe -> ABC). Flaga JSON `ai_wymaga_administratora` (domyślnie false) i bramka `isCityAutoImprovementAllowed(..., aiRequires)` gotowe i przetestowane (test (D)/(F)); włączenie wymaga jeszcze filtra miast + zatrudniania AI w ai.ts. Pozycja do ABC: TAK/NIE parytet AI (rekomendacja: NIE do czasu decyzji o balansie AI; gracz płaci 2/turę — świadome odstępstwo do potwierdzenia). Ta sama sprawa co administrator miasta.
4. ODRZUCAM w tej rundzie (zakres do decyzji właściciela): dodanie administratora ulepszeń do nagłówka miasta, Civpedii/wiki (wymaga regeneracji wikiBundle) i wariantu ikony powiadomień (warEventLog.icon to tekst 'A', zmiana renderu poza allowlistą) to rozszerzenie zakresu ponad GOAL ("rekrutowany w panelu ulepszeń"), przyznane w 10-operator zał. 7. Rejestrowane jako dług: R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE (chip/wiki/lista kosztów/wariant powiadomień).

ZMIANY/COMMIT: gra/src/game/auto-build-gate.ts, gra/src/main.ts, gra/tools/improvement-administrator-test.cjs, gra/tools/autobuild-toggle-test.cjs, ten raport. SHA końcowy = pole sha.
TESTY (surowe wyjście): tsc --noEmit czysty; improvement-administrator-test 53 passed 0 failed (było 43); city-administrator-test 117/0; auto-improvements-test 46/0; autobuild-toggle-test 40/0; auto-improve-q3-test 41 OK/0 FAIL. Pozostałych bramek referencyjnych i Chromium NIE PONOWIONO (zmiana: refaktor filtra bez zmiany logiki + osobna flaga migracji) — do ponownego przebiegu Evaluatora.
BLOKADY: brak. Decyzje ABC: parytet AI (zarzut 3), zakres ikony (zarzut 4).
RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Final Control (ponowny przebieg bramek referencyjnych + Chromium).
DEPLOY/PUSH: NIE WYKONANO
