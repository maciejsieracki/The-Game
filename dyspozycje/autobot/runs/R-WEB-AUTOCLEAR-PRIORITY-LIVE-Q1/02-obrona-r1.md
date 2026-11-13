STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1
GOAL: Farma przed trzodą przy rzece (rejestr #1: E1 farma, E2 wycinka+farma, E3 trzoda, E4 irygacja).
ZMIANY/COMMIT: obrona na bazie `d3b237973` (kod `auto-improvements.ts` bez zmian od `b65363410`). Zmieniony test `gra/tools/autoclear-priority-q1-test.cjs` (19 -> 44 asercji) i dowody w `dyspozycje/autobot/runs/R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1/` (commit obrony: SHA w wiadomości końcowej orkiestratora/`git log`).

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ (częściowo). Dodane scenariusze z lasem i wycinką (`skipWyrab:false`, symulacja znikania lasu): (g) Korynt K1/K2, pola obywateli = las z rzeką poza `riverPaths`: wycinka, farma, dopiero potem trzoda; (h) wycinka OFF: zero wycinki, nic na lesie; (i) las na `riverPaths`; (k) wycinka z rzeką przed wycinką poza rzeką; (l) jedyny „heks do zagospodarowania” to las z rzeką. Mutacje po jednej linii (`onRiverHex` -> `riverHexKeys.has`, `evidence/mutacje-E2-r2.txt`): ZABITE l.1348 (filtr E1), l.1504 (`riverKrok0Ok`, wycinka E2), l.1624 (`keyBlockedOnHex`, trzoda). PRZEŻYWAJĄ l.1350/1351 (sortowanie), l.1530/1540 (`rzekiDoZagospodarowania`), l.1659 (wycinka poza rzeką): to redundancje, bo kandydaci rzeki są już wyłonieni przez filtr E1 i `riverKrok0Ok`, które obsługują ten sam heks (dowód formalny równoważności: NIE_ZMIERZONO).
2. PRZYJMUJĘ z zastrzeżeniem. Żywy test PO poprawce wymaga bundla z nowym kodem; build robi orkiestrator, więc NIE_ZMIERZONO. Zrobiłem wariant hybrydowy: żywy Chromium (bundle ROBOCZA, seed 778899) dał realną mapę (`gra/tools/autoclear-priority-live-test.cjs`, 3 tury: farma, trzoda, irygacja; mapa nie zapisana w repo, bo duża), a picker PO poprawce przejechał 200 miejsc na tej mapie.
3. PRZYJMUJĘ. Rozstrzygnięcie Rodos (`evidence/sweep-sasiedztwo-r2.txt`, skrypt `sweep-sasiedztwo-r2.cjs`, 200 miejsc, K2, pula 300, +25/tura, 33%, pełne technologie, centrum + najbliższe heksy obywateli):

| Obywatele | Trzoda przed otwartą farmą PRZED | Klasa niezafarmowanego heksu PRZED | PO | Klasa PO |
|---|---|---|---|---|
| 1 (tylko centrum) | 0/200 | – | 0/200 | – |
| centrum + 1 | 59 | 40 na rzece poza paths, 19 tylko sąsiad | 26 | 26 tylko sąsiad |
| centrum + 2 | 102 | 82 na rzece poza paths, 48 tylko sąsiad | 54 | 66 tylko sąsiad, 1 daleko |

Wniosek: poprawka usuwa przypadek „heks NA rzece", ale zostaje przypadek „heks TYLKO przy rzece” (13% miejsc przy centrum+1). Dla Rodos to najbardziej prawdopodobna przyczyna pozostałego zgłoszenia, jeśli obserwowane heksy trawiaste sąsiadowały z rzeką bez własnego `rzeka.obecna`. Przykład (89,12): PRZED farma na obu heksach w turze 0; PO farma na heksie rzeki t0, trzoda t1, irygacja t2, farma na heksie przy rzece dopiero t3 (korekta zachowania względem PRZED dla tej klasy). Tabela kandydatów (heks, klasa, koszt farmy/trzody 20, irygacji 60, pula) jest w sekcji PRZYKLAD pliku dowodu.
DECYZJA_WYMAGANA (orkiestrator, ABC): sąsiedztwo rzeki w E1: A zostaje E5 (jak dziś), B farma na heksie sąsiadującym już w E1 (zmiana testów kontraktu E4). Rekomendacja operatora: B.
4. PRZYJMUJĘ. Ten raport ok. 480 słów.
5. ODRZUCAM jako niezweryfikowane: odtworzone. Podmieniono `auto-improvements.ts` na `4bbef081d` i uruchomiono: `ai4-popyt-obywatele` 1 FAIL (Q2p), `oboz-lowiecki-las` 72 OK/19 FAIL, `praca-jeden-podzial-kontrakt` 635 OK/2 FAIL, identycznie przed i po poprawce (plik przywrócony, identyczny bajtowo).

TESTY (logi `gate-*-r2.txt` z `EXIT=`): `autoclear-priority-q1-test` 44/0, `autoimprove-stages-q1-test` 302/0, `auto-improvements-test` 46/0, `tsc --noEmit` EXIT=0.
BLOKADY: brak. Żywy test po poprawce: NIE_ZMIERZONO (build orkiestratora).
RUNDY: 2/5
NASTĘPNY KROK: Final Control; orkiestrator zgłasza ABC (sąsiedztwo rzeki) i robi żywy pomiar na bundlu z poprawką.
DEPLOY/PUSH: NIE WYKONANO
