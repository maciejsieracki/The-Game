STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-ARMY-ALL-CIVS-GATHER-UNDER-GENERAL-Q1
GOAL: Każda cywilizacja AI ma wodza zgodnie z epoką i zbiera armię pod najbliższym wodzem; Brąz: wódz #2 zbiera 5 tur i rusza; po śmierci wodza nowy w stolicy.

## Odpowiedź na zarzuty (runda 2)

1. Pomiar 3 ziarna x 100 tur: ODRZUCAM jako wykonalne, NIE_ZMIERZONO. Próba 6 tur (seed 4242) w pierwszym planie przekroczyła 580 s: sama generacja świata trwa > 8 min, zero tur. Zasada "bez tła, <= 590 s na wywołanie" wyklucza pomiar. Dodałem brakujący w repo hak `gra/tools/ai-army-all-civs-live-hook.cjs` (poprzednio hak istniał tylko w kopii poza repo; skrypt pomiarowy nie dawał się odtworzyć) oraz pola diagnostyczne gold/koszary/offer w `ai-army-all-civs-live-measure.cjs`. Pomiar nadaje się do uruchomienia przez orkiestratora poza limitem 590 s.
2. Rozproszenie 31% vs 12%: PRZYJMUJĘ jako niewykazane. Porównanie na różnych ziarnach nie jest dowodem; tezy "tranzyt" nie potwierdzam. NIE_ZMIERZONO.
3. Późny pierwszy wódz (T23-26): PRZYCZYNA ZIDENTYFIKOWANA W KODZIE (nie pomiarem): `gra/src/game/production.ts:1067` i `:1184` odrzucają jednostki epoki >= 2 bez budynku `koszary` w mieście, a `bestGeneralUnitForOwner` (`gra/src/main.ts:6938`) bierze oferty z `purchasableUnits` stolicy (wyjątek `leaderOnlyBaseItem`, main.ts:6961, też wymaga Koszar). Brąz + brak Koszar w stolicy = brak oferty = `ensureAiGeneralRoster` nic nie kupuje. To wniosek z kodu i z pomiaru r1 (wodzowie od T23-26), NIE potwierdzony odczytem koszary/offer w realnej grze (NIE_ZMIERZONO). AI dostaje bonus score Koszar (+110, +120: ai.ts:2071, 2175). Zmiana (wódz Brązu bez Koszar albo wyższy priorytet Koszar) to zmiana balansu, więc NIE wprowadzam; opcje w BLOKADY. Hipoteza o złocie niepotwierdzona (gold w hooku, NIE_ZMIERZONO).
4. Brąz #2 (wymóg właściciela): PRZYJMUJĘ, ZAIMPLEMENTOWANE. Przyjęte ZAŁOŻENIE (bez ABC): wariant B. Rezerwa zbiera `AI_GENERAL_WAR_GATHER_TURNS`=5 pełnych tur w mieście, po czym przestaje być zatrzymywana i rusza z armią jako druga fala. Licznik: nowe pola `reserveGeneralId/reserveGatherTurns/reserveLastTurn` w `AiGeneralWarCampaign` (`ai-general-war-campaign.ts`, funkcja `recordAiReserveGatherTurn`, zapis/odczyt, przeniesienie w main.ts blok zapisu kampanii). Spójność metryki: rezerwa używa teraz `leaderPathLengthFor` (realna trasa, brak trasy = nieosiągalny) jak pokój i zbiórka, zamiast `hexDistance`. Po śmierci wodza kampanii obowiązuje dotychczasowy cykl (świeży wódz); to NIE jest wariant C.
5. Test `ensureAiGeneralRoster`: PRZYJMUJĘ. Decyzję wyodrębniłem do czystej `shouldAiBuyGeneral` (`gra/src/game/generals.ts`), użytej w main.ts. Test P8 (10 asercji: limit Kamień 1 / Brąz 2, kolejka, odnowa po śmierci, brak stolicy, brak oferty, barbarzyńcy/państwa-miasta) + mutacja D (kupno wyłączone => FAIL). Sam efekt live w T23-26 nadal tylko z pomiaru poprzedniej rundy.
6. Uzasadnienie pominięcia bramek: PRZYJMUJĘ, mój błąd. Odtworzone z `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`: general-capital-recruitment-order PASS 0 failures; generals-purchase-runtime 13 pass 0 fail; ai-general-war-campaign-live 68 pass 0 fail.
7. Formalne: raport r1 miał 749 słów (limit 700), ten raport mieści się w limicie. Efekt balansowy (wydatki złota AI na wodzów): przyznaję, NIE_ZMIERZONO; koszt to 1 jednostka wodza na slot epoki (Kamień 1, Brąz 2) i odnowa po śmierci, kupno tą samą bramką co kampania i gracz.

## Nowe testy RED/GREEN
`ai-army-all-civs-general-muster-test.cjs`: 26 PASS 0 FAIL (było 10). Dodane: P6 (rezerwa trzyma 5+ tur, potem rusza), P7 (najbliższy po trasie, mur z morza), P8 (roster). Mutacje A-E zabite: A bez zbiórki u wodza w pokoju, B bez rezerwy, C bez odblokowania rezerwy, D bez kupna wodza, E metryka linii prostej (P7).

## ZMIANY/COMMIT
Pliki r2: `gra/src/game/ai.ts`, `gra/src/game/ai-general-war-campaign.ts`, `gra/src/game/generals.ts`, `gra/src/main.ts`, `gra/tools/ai-army-all-civs-general-muster-test.cjs`, `gra/tools/ai-army-all-civs-live-measure.cjs`, `gra/tools/ai-army-all-civs-live-hook.cjs` (nowy), `runs/<ID>/**`. SHA w odpowiedzi orkiestratora.

## TESTY
Wszystko w `gate-r2-podsumowanie.txt`: tsc EXIT=0; ai-test 274/20 (= baza); wszystkie regresje z dispatchu 0 FAIL; 3 testy Chromium PASS.

## BLOKADY
1. 3 ziarna x 100 tur, determinizm AI, czas decyzji, odsetek rozproszonych PO: NIE_ZMIERZONO (limit 590 s w pierwszym planie vs generacja świata > 8 min).
2. Opóźnienie pierwszego wodza w Brązie (Koszary): decyzja produktowa, opcje: A) bez zmian; B) Wódz Brązu bez wymogu Koszar (leaderOnlyBaseItem rozszerzony na wodza); C) wyższy priorytet Koszar dla AI w Brązie.
3. Wariant C po śmierci wodza #1 (rezerwa przejmuje kampanię) NIE zrobiony; założenie: wariant B.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator; pomiar live 3x100 tur do uruchomienia poza limitem pierwszego planu, decyzja o opcjach blokady 2.
DEPLOY/PUSH: NIE WYKONANO
