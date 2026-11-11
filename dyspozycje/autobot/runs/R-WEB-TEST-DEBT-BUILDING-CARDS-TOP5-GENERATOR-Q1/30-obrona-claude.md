STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-BUILDING-CARDS-TOP5-GENERATOR-Q1
GOAL: `node gra/tools/gen-building-cards-top5.cjs --check` zielony bez ręcznej edycji `building-cards-top5.json`; generator deterministyczny; testy kart i bramki referencyjne zielone; brak regresji treści kart.
BAZA/KANDYDAT: kandydat b17f7345e2851bf35e3c5792985681ea517635b0 (parent f8af35f87 = origin/main). Obrona startuje od b17f7345e; ZMIAN KODU W OBRONIE BRAK.
ZMIANY/COMMIT: tylko raport obrony (ten plik). Kod bez zmian. SHA raportu: patrz pole sha w odpowiedzi.

## Odpowiedzi na zarzuty Evaluatora (8b901bfae)

Zarzut 1 (nota: korekta Cegielni hardkoduje tytuł i zdanie): PRZYJMUJĘ jako dług, bez poprawki kodu.
- Dowód: `gra/tools/gen-building-cards-top5.korekty.json` (blok `budynki.Cegielnia.zmiany`) zawiera pełny tekst tytułu i zdania; generator nie wylicza liczb 50/75/100 z danych. Zgadzam się, że przyszła zmiana liczb w danych nie zostanie wychwycona.
- Dlaczego bez poprawki: parametryzacja tekstu wymaga zmiany generatora poza allowlistą tego tematu. Zapis długu: osobny temat (parametryzacja tekstów korekt z danych).

Zarzut 2 (nota, poza zakresem: dwie kopie budynki-top5.csv): ODRZUCAM jako zarzut blokujący tego tematu; PRZYJMUJĘ jako wiedzę.
- Dowód sha256 (raw): `dyspozycje/analizy/karty-budynkow/budynki-top5.csv` = ca618953dd658db67832da4555cc3139430c3a944754f03f018f0db579139cd5 (domyślne, używane przez generator); `dyspozycje/autobot/runs/R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/budynki-top5.csv` = b81c7b6547f6ddb51c35f54dba15bf49ca7452a3626eb12252ad2b75d684e5d0. Różnią się.
- NIE_ZMIERZONO: liczba błędów walidacji drugiej kopii (zarzut operatora r1 "3 błędy" nie został zweryfikowany w tej obronie). Poza allowlistą, nie ruszam.

Zarzut 3 (nota proceduralna: referencje w dispatchu i R-PROC-AUTOBOT §6 nieaktualne): PRZYJMUJĘ.
- Dowód: `docs/decyzje/R-PROC-AUTOBOT.md` linia 584 `tech-tree-test` = 19/19; linia 586 `unit-replace-test` = 13/13. Pomiar na kandydacie b17f7345e (raw): tech-tree-test `20 pass, 0 fail`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`.
- Ścieżka `00-dispatch.md` z dispatchu NIE istnieje w origin/main (`fatal: path ... does not exist`) ani pod tą ścieżką w origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (ls-tree pokazuje tylko `00-dispatch-DODATEK-claude.md`). Dispatch odtworzony z treści zadania i DODATKU.
- Zmiana `R-PROC-AUTOBOT.md` poza allowlistą tematu; zalecany osobny temat dokumentacyjny.

## Weryfikacja obrony (wyniki surowe, kandydat b17f7345e, w gra/ po `npm ci --ignore-scripts` exit 0)
- `node tools/gen-building-cards-top5.cjs --check` -> `--check OK (dyspozycje/analizy/karty-budynkow/budynki-top5.csv)`, exit 0; drugie uruchomienie exit 0.
- Determinizm: `node tools/gen-building-cards-top5.cjs` x2 -> sha256 `data/building-cards-top5.json` = 37bdc6e881f4431b... oba razy (identyczny). `git status` po generowaniu: czysty (generator nie zmienił pliku).
- `git diff --check` -> czysto.
- `npx tsc --noEmit` -> exit 0.
- `terminology-trade-vs-tax-test` -> `799 pass, 0 fail`.
- `building-cards-top5-test` -> `1207 pass, 0 fail`.
- `ids-leak-audit-test` -> `WYNIK: 1648 ok, 0 FAIL`.
- `wonder-text-no-raw-ids-test` -> `WYNIK: 132 ok, 0 FAIL`.
- `brick-cycles-75-100-test` -> `46 passed, 0 failed`.
- `brick-production-x2-test` -> `69 passed, 0 failed`.
- Bramki referencyjne: `logic-test` -> `LOGIC OK (213/213)`; `tech-tree-test` -> `20 pass, 0 fail`; `research-test` -> `PASSED: 33 / FAILED: 0 / TOTAL: 33`; `unit-replace-test` -> `WSZYSTKIE TESTY ZIELONE (21/21)`; `combat-test` -> `COMBAT TEST: 6/6 pass`.
- Nie uruchamiano `npm run build`/`dev`.
- Baza f8af35f87 nie była ponownie mierzona w tej obronie; wartość bazowa terminology 798/1 przyjęta z pomiaru Evaluatora (NIE_ZMIERZONO przeze mnie).

## Diff karta po karcie
Brak zmian kodu w obronie. Dla kandydata zmienione karty względem pliku na dysku: 0 (wynik regeneracji = plik w repo). Względem stanu przed b17f7345e: `cegielnia.top5[0].tytul` i `.zdanie` (zamierzona zmiana z b1656e454, odtworzona 1:1 w generatorze).

## BLOKADY
Brak blokad technicznych. Zarzuty 1 i 3 przyjęte jako długi; zarzut 2 poza zakresem.

## RUNDY
Obrona Operatora r1.

## ZAŁOŻENIA
- Intencja zmiany Cegielni z b1656e454 (cykle 50/75/100) zgodna z testem `brick-cycles-75-100-test` i decyzją właściciela 2026-11-11 (wg dispatchu). Bez tego założenia korekta byłaby decyzją, nie naprawą.

## NASTĘPNY KROK
Final Control (Sonnet) na b17f7345e; nota 1 i 3 jako długi do osobnych tematów (parametryzacja korekt; aktualizacja referencji §6 R-PROC-AUTOBOT); nota 2 do osobnego przeglądu dwóch kopii CSV.

## DEPLOY/PUSH: NIE WYKONANO
