# Koniec tury: klik „Zakończ turę” na żywo i konsola PRZED/PO (R-WEB-ENDTURN-CLICK-LIVE-Q1, ENDCLICK)

Baza kandydata: origin/main 3b23b2d4f (FALA 934 ENDQUIET). Baseline „PRZED”: 6afdec814 (sprzed ENDQUIET).
Operator HAIKU 5.5, runda 1/5. Pomiar na żywo w Chromium (headless, Playwright), bundle esbuild poza repo.
Zmiany w `gra/src`: brak (wynik: artefakt harnessu, nie błąd gry).

## 1. Ustawienia (maksimum)

Parametry z `gra/tools/endturn-click-live.cjs` (MAX_PARAMS), zapis w
`dyspozycje/autobot/runs/R-WEB-ENDTURN-CLICK-LIVE-Q1/readback-ustawien-maksimum.txt`.

- Poziom gry Trudny, barbarzyńcy Trudny, dyplomacja i wojna Trudna, kultura i religia Trudny.
- Wysoki ×4: koszt jednostek, wzrost ludności, jakość mapy, jakość renderu.
- Ziarna 4242 i 7. Świat nowej gry, czekanie na [ClusterStart].
- Niejednoznaczne: `buildingCostPace=niski` i `ruchSwiataPace=krotki` z sondy ENDPERF, nie są w dispatchu.
- NIE ZMIERZONO: odczyt ustawień z ekranu gry (wejście do `__settingsLive.startNewGame`, bez zrzutu UI).

## 2. Klik t2–t8 (pkt 1 dispatchu)

Każdy klik to `page.mouse.click` na środku `button[data-end]`. Okno oczekiwania 60 s, ponowienia co 20 s
(max 3). Przed kliknięciem tylko zdjęcie blokad harnessu (modale, bitwy, oferty AI, pokój wymuszony).

| seed | tura | wynik | kliki | czas do zmiany [ms] | aria przed kliknięciem | canEnd przed kliknięciem |
|---|---|---|---|---|---|---|
| 4242 | 2 | zmieniona | 1 | 2 575 | true | false |
| 4242 | 3 | zmieniona | 1 | 2 563 | false | true |
| 4242 | 4 | zmieniona | 1 | 3 968 | false | true |
| 4242 | 5 | zmieniona | 1 | 2 403 | true | false |
| 4242 | 6 | zmieniona | 1 | 3 334 | true | false |
| 4242 | 7 | zmieniona | 2 | 27 302 | true | false |
| 4242 | 8 | zmieniona | 1 | 3 906 | true | false |
| 7 | 2 | zmieniona | 1 | 2 418 | true | false |
| 7 | 3 | zmieniona | 1 | 2 099 | false | true |
| 7 | 4 | zmieniona | 1 | 3 091 | false | true |
| 7 | 5 | zmieniona | 1 | 1 991 | true | false |
| 7 | 6 | zmieniona | 2 | 24 761 | true | false |
| 7 | 7 | zmieniona | 1 | 3 584 | true | false |
| 7 | 8 | zmieniona | 1 | 2 301 | true | false |

Dane surowe: `dane-KLIK-CURRENT-s4242.json`, `dane-KLIK-CURRENT-s7.json` w katalogu runs.

Rozstrzygnięcie (pkt 1): 14/14 tur zmieniło się, żadna tura nie utknęła. Dwa przypadki wymagały drugiego kliku
(s4242 t7, s7 t6). Wg logu konsoli pierwszy klik trafił w ogon poprzedniej tury: wpisy
`[EndTurn] blocked: endTurnInProgress` przed `triggerPlayerEndTurn: DONE`, a dla tego kliku nie ma wpisu
`START`. Bramka zadziałała poprawnie (klik odrzucony przy `endTurnInProgress`). Gdy ogon się skończył, przycisk był
aktywny. Kolejny klik po 20 s przeszedł (`START` → zmiana tury). Oznacza to (i) artefakt harnessu: klik wykonany
zbyt wcześnie, a nie klik bez efektu przy `canEnd=true`. Nie stwierdzono przypadku (ii).

NIE ZMIERZONO: wartość `aria-disabled` w 20-sekundowej przerwie między pierwszym a drugim klikiem (harness jej nie
odpytywał). Stan „przycisk aktywny po DONE” jest wnioskiem z kolejności logów, nie pomiarem.

Uwaga o hakach: `__nnsMeasureDebug.gateInfo()` NIE jest odczytem bez skutków. Woła
`canPlayerInitiateEndTurn()`, która przy blokadzie loguje `console.warn` i wywołuje `healStaleEndTurnBlockers()`.
W pierwszym biegu (odpytywanie co 500 ms przez `gateInfo`) hak ten zaśmiecał konsolę i mógł zmieniać stan. Ten bieg
został odrzucony. W wersji końcowej `gateInfo` wołany jest tylko przed i po kliku, a numer tury czytany
z `__turnSlowdownTestDebug.getTurn()`.

## 3. Konsola PRZED/PO (pkt 2 dispatchu)

Liczby z 30-sekundowych okien (`warn` = `console.warn`, wszystkie typy wpisów, liczone w oknie):

| stan | build | seed 4242 (wpisy / 30 s) | seed 7 (wpisy / 30 s) | rodzaje (seed 4242) |
|---|---|---|---|---|
| (a) start gry przed założeniem miasta | 6afdec814 (PRZED) | 38 (`EndTurn blocked` 37) | NIE ZMIERZONO | 37× `blocked: awaitingFirstPlayerCity` (cykl HUD co 500 ms) + 1× WebGL |
| (a) start gry przed założeniem miasta | 3b23b2d4f (PO) | 1 | 1 | 1× WebGL; 0 wpisów `[EndTurn]` |
| (b) po „Zakończ turę”, tura 2 (AI) | 6afdec814 (PRZED) | 17 (`EndTurn blocked` 14) | NIE ZMIERZONO | 14× `blocked: endTurnInProgress` (cykl HUD) + START + DONE + log |
| (b) po „Zakończ turę”, tura 2 (AI) | 3b23b2d4f (PO) | 4 (`EndTurn blocked` 1) | 3 (`EndTurn blocked` 1) | START, DONE, 1× blocked z gestu gracza, logi AI |
| (b) po „Zakończ turę”, tura 3 (AI) | 6afdec814 (PRZED) | 16 (`EndTurn blocked` 14) | NIE ZMIERZONO | jak wyżej |
| (b) po „Zakończ turę”, tura 3 (AI) | 3b23b2d4f (PO) | 4 (`EndTurn blocked` 2) | 3 (`EndTurn blocked` 1) | START, DONE, 1–2× blocked z gestu gracza |
| (c) bramka NNS (podatek 100%, obrońca w t5, ziarno 4242 lub 7) | oba | NIE ZMIERZONO | NIE ZMIERZONO | nie wykonano ustawienia podatku ani zakupu |

Wniosek (pkt 2): oczekiwanie z dispatchu spełnione dla (a) i (b). W stanie PO wpisy `[EndTurn]` pochodzą tylko z
gestu gracza (START, DONE, pojedyncze `blocked` z kliku). Cykl HUD nie produkuje już wpisów. Zmierzony spam PRZED to
około 1,2 wpisu/s w (a) i około 0,5 wpisu/s w (b).

Pomiar (c) nie został wykonany. Wymaga ustawienia podatku i zakupu obrońcy klikiem w turze 5, czego ten bieg nie robi.

Liczby pochodzą z pól `byType`/`warnTotal` w plikach JSON w runs:
`dane-KLIK-CURRENT-s4242.json`, `dane-KLIK-CURRENT-s7.json`, `dane-KLIK-BASE-s4242.json`.

## 4. Bramki i zmiany

- Zmiany w `gra/src`: brak. Nie było błędu gry do naprawy, więc pkt 3 nie został uruchomiony.
- Dodany plik narzędzia: `gra/tools/endturn-click-live.cjs` (pomiar, nie wpływa na grę).
- `node tools/endturn-quiet-test.cjs`: 10 pass, 0 fail (sanity po FALI 934).
- Pozostałe bramki z dispatchu (tsc, logic, ai-test itd.): NIE URUCHOMIONO, bo nie ma zmiany w `gra/src`.

## 5. Ograniczenia

- Pomiar na jednym przebiegu na ziarno; t2–t8 w jednym procesie, bez segmentów.
- Chromium SIGSEGV: jeden przebieg PRZED (ziarno 4242, tura 3) padł (`Target page ... closed`), powtórka zakończyła się OK.
- `aria-disabled` i `endTurnInProgress` nie są odczytywane bezpośrednio (brak haka tylko do odczytu). Stan wnioskowany z logów.
- NIE ZMIERZONO: tury 30 i 60, odczyt aria w przerwach, bramka NNS (c), readback UI ustawień.
