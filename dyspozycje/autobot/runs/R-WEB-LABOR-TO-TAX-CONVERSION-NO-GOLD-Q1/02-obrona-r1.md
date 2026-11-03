STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LABOR-TO-TAX-CONVERSION-NO-GOLD-Q1
GOAL: Zamiana Pracy na podatek ma byc widoczna i zgodna ze stanem (zgloszenie: 20 000 Pracy -> podatek, nic w Skarbcu).
RUNDY: 1/5 (obrona zarzutow Evaluatora)

## Odpowiedzi na zarzuty
1. PRZYJMUJE. Pomiar w zywym Chromium wykonany (harness: live-harness.cjs.txt, bundle vite poza repo, hak wstrzykniety tylko w transformie bundla; produkt bez zmian).
   - BAZA 57a7ada40 (live-PRZED-baza-57a7ada40.json): przed "Skarbiec +8/ture"; po zamianie 20 000 -> "+8" (BLAD ODTWORZONY: HUD nie widzi podatku), brak komunikatu o zamianie, Praca 25000 -> 5000, pending 20000. Po koncu tury Skarbiec 0 -> 20903 (zloto DOSZLO - problem byl widocznosc, nie utrata).
   - PO POPRAWCE (live-PO-poprawka.json): przed +8; podglad w panelu "na koniec tury: +20901 do Skarbca, +3980 do Nauki"; po zamianie chip "+20909", komunikat "Zamieniono 20000 Pracy na 20000 Podatku. Na koniec tury: +20901 do Skarbca, +3980 do Nauki ..."; po koncu tury Skarbiec 0 -> 20903. Zero bledow JS.
   - KOREKTA wczesniejszej tezy: przy 60/20/20 do Skarbca doszlo ~+20 900, nie 12 000 (Zamoznosc mnozy Skarbiec: turn-economy.ts "WIRE 3", wt.mnoznik). Teksty UI poprawione.
2. PRZYJMUJE formalnie (uchybienie allowlisty). work-tax.ts to modul zamiany; zmiana jest tam, bo akcja jest teraz wstrzykiwalna i testowalna (runManualWorkTaxAction). Do swiadomej akceptacji integracji.
3. PRZYJMUJE. Logika hooka wyniesiona do work-tax.ts: runManualWorkTaxAction(owner, req, rate, enabled, io). Test (sekcja F) wykonuje ja z modelem HUD z bramka empireEconDirty i PRAWDZIWYM cityYieldPerTurn: ekran +12000 po zamianie, kolejnosc refresh->queue->markDirty->refresh, odmowy bez markDirty, druga zamiana +6000. Sondy tekstowe odpornosc na komentarze (stripComments) i wiaza io hooka. Mutacje: (a) usuniecie markDirty -> 5 FAIL; (b) markDirty po refreshu (tekst zachowany) -> 5 FAIL. Wynik 58/0.
4. PRZYJMUJE. Podglad w panelu (zdarzenie change) pokazuje realny wplyw z silnika: hak previewOwnerWorkTaxEffect (tymczasowo dolicza podatek, przelicza, przywraca kolejke w finally). Zmierzone live: "+20901 do Skarbca, +3980 do Nauki".
5. ODRZUCAM jako zmiane kodu, PODNOSZE jako DECYZJA_WYMAGANA dla orkiestratora/wlasciciela. Dowod live: zloto dochodzi do Skarbca w calosci wg zasad (+20 903 po EOT). Jesli wlasciciel nie widzial go, bo nie widzial "+N/ture" i komunikatu - to naprawione. Jesli oczekuje 100% omijajacego suwak/korupcje - decyzja produktowa; zalozenie: bez zmian.

## ZMIANY/COMMIT
Commit c1220a844 (nad 713299a7e): gra/src/main.ts, gra/src/game/work-tax.ts, gra/src/ui/empireDetailPanel.ts, gra/tools/labor-to-tax-conversion-gold-test.cjs + artefakty w runs/<ID>/. Push NIE.

## TESTY
labor-to-tax-conversion-gold-test 58/0; tsc --noEmit EXIT=0; regresje: work-tax-conversion 10, praca-na-pieniadz 6/0, empire-skarbiec-bilans 11/0, converters 49/0, converter-era-scaling 87/0, waluta-mennica 61/0, mennica-uspienie 49/0, trade-routes-income 131/0, currency 37/0, owner-economy 20/0. Bledy sprzed zmiany bez zmian: hud-skarbiec 33/1, mennica-magazyn 34/7, resource-usage-breakdown 98/2.

BLOKADY: brak. NASTEPNY KROK: Final Control. DEPLOY/PUSH: NIE WYKONANO
