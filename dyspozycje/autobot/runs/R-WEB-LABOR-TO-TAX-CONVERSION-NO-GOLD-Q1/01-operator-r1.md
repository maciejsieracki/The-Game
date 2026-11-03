STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LABOR-TO-TAX-CONVERSION-NO-GOLD-Q1
GOAL: Zamiana Pracy na podatek ma byc widoczna i zgodna ze stanem (zgloszenie: 20 000 Pracy -> podatek, nic w Skarbcu).

## 1. Mechanizm (jedyny pobierajacy Prace na podatek)
- Panel Imperium "ZAMIANA PRACY NA PODATEK": gra/src/ui/empireDetailPanel.ts:1420-1447 -> hook onConvertOwnerWorkToTax gra/src/main.ts:~24775 -> executeManualWorkTaxConversion gra/src/game/work-tax.ts (Praca z puli -> `pendingManualWorkTaxByOwner`, main.ts:12733).
- Wymaga Targowiska i gracza-czlowieka (work-tax.ts ownerCanConvertWorkToTax); AI nie uzywa (brak sciezki) -> NIE_DOTYCZY.
- Kredyt na koniec tury: main.ts:34626 (manualWorkTaxByCity do stolicy) -> turn-economy.ts:2578 -> economy.ts:936 (handelBrutto += podatek) -> korupcja/Mennica (941-952) -> suwak Podatek/Nauka/Zamoznosc stolicy (957-964; domyslnie 60/20/20, cities.ts:437) -> mnoznik Zamoznosci (turn-economy.ts:2622) -> hEcon.pieniadz += skarbiec (main.ts:35157). Inne konwertery/mennica/handel nie zamieniaja Pracy na zloto (konwertery to surowce).

## 2. Przyczyny (zmierzone / odczytane)
A. BLAD: hook nie ustawial `empireEconDirty` (brak markCityStateDirty), a `refreshLiveEmpireRates` ma bramke `if (!empireEconDirty) return` (main.ts:19884). Skutek: zakolejkowany podatek NIE byl doliczany do "+N/ture" przy Skarbcu (preview main.ts:19931-19964) az do nastepnej niezwiazanej zmiany -> gracz po zamianie widzial brak wplywu na Skarbiec.
B. Brak komunikatu: hook nie pokazywal nic (sukces ani odmowa, `return 0` cicho); panel cicho wychodzil przy 0 Pracy / 0 Podatku.
C. Zgodnie z regulami (NIE zmieniono): do Skarbca idzie tylko udzial "Podatek" suwaka po korupcji/Mennicy. Pomiar prawdziwym cityYieldPerTurn (domyslny podzial 60/20/20, bez korupcji): 20 000 Podatku = +12 000 Skarbca, +4 000 Nauki, +4 000 Zamoznosci; z korupcja 20%: ok. +9 600 Skarbca. UI tego nie mowilo.
Kredyt w silniku dziala (testy praca-na-pieniadz, currency PASS); brak utraty w cappie/kursie 0 (kurs 1 w econ-params, work-tax.ts:10-13 chroni przed odjeciem Pracy bez podatku).

## 3. Poprawka
- main.ts (hook ~24775): pomiar projekcji przed, markCityStateDirty()+refreshLiveEmpireRates() po, showHintMessage(workTaxResultMessage(...)) zawsze (sukces: Praca/Podatek/+Skarbiec/+Nauka z silnika; odmowa: powod); import workTaxResultMessage.
- work-tax.ts: nowa czysta funkcja workTaxResultMessage (powody: brak Targowiska, ilosc <1/NaN/ujemna, pusta pula, kurs daje 0 Podatku).
- empireDetailPanel.ts: odmowa nie jest juz cicha (hook dostaje 0/0-podatek i pokazuje powod); opis mowi, ze do Skarbca idzie tylko udzial "Podatek".
- Kurs/balans/reguly ekonomii BEZ ZMIAN.

## ZMIANY/COMMIT
Allowlista: gra/src/main.ts, gra/src/game/work-tax.ts (poza lista wprost, ale to modul zamiany; konieczny - NOTA), gra/src/ui/empireDetailPanel.ts, NOWY gra/tools/labor-to-tax-conversion-gold-test.cjs, runs/R-WEB-LABOR-TO-TAX-CONVERSION-NO-GOLD-Q1/**. Commit SHA: patrz koniec (uzupelnione w wiadomosci zwrotnej).

## TESTY
- labor-to-tax-conversion-gold-test: RED na kodzie bazowym 23 passed / 6 failed (gate-red.txt), GREEN 36 passed / 0 failed (gate-green.txt). Pokrycie: 20 000 Pracy -> Praca -20 000, kolejka 20 000, Skarbiec +12 000/Nauka +4 000/Luksus +4 000 (prawdziwy cityYieldPerTurn), komunikaty sukcesu/odmowy, graniczne (cala pula, ponad pule, 0, ujemna, NaN, kurs 0.5, mala kwota), sondy hooka (usuniecie markCityStateDirty/komunikatu lamie test - potwierdzone przez RED na kodzie bazowym).
- Regresje PO: work-tax-conversion 10, praca-na-pieniadz 6/0, converters 49/0, converter-era-scaling 87/0, waluta-mennica 61/0, mennica-uspienie 49/0, empire-skarbiec-bilans 11/0, trade-routes-income 131/0, currency 37/0, owner-economy 20/0, trade-grant 62/0.
- PRE-EXISTING (identyczne PRZED i PO, nie z tej zmiany): mennica-magazyn 34/7 fail, hud-skarbiec 33/1 fail, resource-usage-breakdown 98/2 fail.
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- NIE_ZMIERZONO: pomiar w zywym Chromium (hooki ?civTest=1 nie obejmuja panelu/zamiany; budowa bundla main.ts poza zakresem rundy 1); przyczyna A ustalona z kodu (plik:linia), nie z odtworzenia w przegladarce.

## DECYZJA_WYMAGANA (z domyslnym zalozeniem)
Czy podatek z zamiany ma isc w 100% do Skarbca (z pominieciem suwaka Podatek/Nauka/Zamoznosc i ewentualnie korupcji)? ZALOZENIE: nie - zachowano regule "zwykly strumien podatku" (decyzja wczesniejszego tematu, praca-na-pieniadz-test); zmiana to decyzja produktowa/balansowa.

## BLOKADY
Brak (node_modules usuniete po pracy).

## RUNDY
1/5

## NASTEPNY KROK
Evaluator: odtworzenie w Chromium (zamiana 20 000, "+N/ture" przed/po, komunikat, koniec tury, Skarbiec +12 000 przy 60%), ocena DECYZJI.

## DEPLOY/PUSH
NIE WYKONANO
