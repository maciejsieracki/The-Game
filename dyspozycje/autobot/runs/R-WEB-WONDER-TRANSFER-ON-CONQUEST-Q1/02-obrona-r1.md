STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — cuda świata
TEMAT: R-WEB-WONDER-TRANSFER-ON-CONQUEST-Q1
GOAL: po zmianie właściciela miasta lub hexa z wybudowanym cudem zdobywca przejmuje cud wraz z bonusami, a poprzedni właściciel je traci (wariant B).
ZMIANY/COMMIT: baza fbf564b17 (Operator r1). Commit obrony: patrz SHA w odpowiedzi końcowej. Allowlista: gra/src/main.ts (+2 linie: wpięcie w sweepFortCaptures), gra/tools/wonder-transfer-on-conquest-test.cjs (scenariusz fortu, bramka fortu, inwentarz city.ownerId), ten katalog runu (02-obrona-r1.md). Bez zmian w gra-robocza/**, WERSJE.md, rust-port/**, render/**, wonders-data.ts, ui/.

ODPOWIEDZI NA ZARZUTY:

Z1 (siła testu, ścieżki zmiany właściciela): PRZYJMUJĘ.
- Dowód luki: w main.ts zmiana właściciela HEXA bez miasta to też zdobycie fortu przez wejście wojska (sweepFortCaptures → applyFortCaptureByOccupation, fort/posterunek to twarde terytorium w territoryOwnerAt). Ta ścieżka nie była opleciona migawkami.
- Poprawka: sweepFortCaptures bierze migawkę przed applyFortCaptureByOccupation i stosuje plan po zdarzeniu (tylko gdy evs.length > 0). Jedno wpięcie obejmuje wszystkie 6 wywołań sweepu.
- Test: scenariusz 7 (fort bez miasta w zasięgu, zdobycie przenosi cud i bonusy), bramka strukturalna „zdobycie fortu owinięte migawkami”, inwentarz: main.ts ma dokładnie 7 nie-komentarzowych przypisań city.ownerId (4 zdarzenia owinięte, 3 nie-zdarzenia), post-battle-map.ts ma 1.
- Mutacja: usunięcie linii settleWonderTransfer(wonderWatchFort) → 1 FAIL (bramka fortu). Przywrócono plik z kopii, cmp zgodny.
- RESZTA (NIEZAMKNIĘTE, zapisane jako założenie): (a) zakładanie miasta (finalizeCityFounding → applyFortTakeoverAndEvacuation → applyFortTakeoverOnCityFounded) też zmienia właściciela fortów i terytorium, ale NIE jest na liście zdarzeń dyspozycji (podbój, cesja, aneksja, rewolta, odbicie) i ma 6 miejsc wywołania; nie wpięto. Założenie: zakładanie miasta nie przenosi cudu. Luka do ABC/następnej rundy. (b) Test nie uruchamia main.ts; kolejność „migawka przed zmianą” jest sprawdzana strukturalnie (regex), nie wykonaniem.

Z2 (cud do frakcji rebeliantów -99 i barbarzyńców -1): ODRZUCAM.
- Dowód: dispatch, punkt (1) „zmień ownerId cudu na nowego właściciela hexa” oraz lista zdarzeń obejmuje rewoltę. Cud idzie z hexem do właściciela terytorium, a frakcja nią jest. Kod zgodny z dispatchem.
- Pytanie do ABC (nieblokujące, dla orkiestratora): czy frakcje nie-graczy (rebelianci, barbarzyńcy) mają posiadać cud i jego bonusy. Do decyzji właściciela; nie zmieniam bez niej.

Z3 (allowlista: nowy plik gra/src/game/wonder-transfer.ts): ODRZUCAM.
- Dowód: dispatch, sekcja ALLOWLISTA, dosłownie: „moduły zdobywania/cesji/aneksji w `gra/src/game/**`”. Nowy moduł jest modułem przenoszenia cudu przy zdobyciu, cesji i aneksji, leży w gra/src/game/. Nie jest poza allowlistą.

Z4 (punkty 4, 6, budowa cudu w toku): częściowo PRZYJMUJĘ (dokumentacja), ODRZUCAM w zakresie zmiany kodu.
- Punkt 4 (bonusy cywilizacji bez zdolności budowy): dispatch każe opisać i zostawić, jeśli bonus ma warunek, oraz zgłosić do ABC. Operator to zrobił. Brak zmiany kodu zgodny z dispatchem. ODRZUCAM zarzut o niedomknięciu.
- Punkt 6 (migracja niespójnych zapisów): dispatch wprost każe DECISION_REQUIRED, bez zgadywania. Brak migracji zgodny. ODRZUCAM.
- Budowa w toku (wonderBuildSites): dispatch zakłada, że przenosimy tylko ukończone. ZAŁOŻENIE: site przejętego terytorium zostaje przy dotychczasowym ownerId do ukończenia. Fakt z kodu: completeWonderOnHex (main.ts, ok. wiersza 4976) ustawia ownerId = site.ownerId. Skutek: cud ukończony po zmianie terytorium może mieć ownerId ≠ właściciel terytorium. Moduł takiego stanu NIE przepisuje (test „niespójny zapis”). To jest ta sama klasa co punkt 6, DECISION_REQUIRED. Bez zmiany completeWonderOnHex (poza dispatchem).

NOTATKI DLA ORKIESTRATORA (pytania ABC, nieblokujące):
1. Frakcje nie-graczy jako właściciele cudu (rebelianci -99, barbarzyńcy -1) — tak/nie.
2. Zakładanie miasta / przejęcie fortów przy zakładaniu: czy ma przenosić cud (obecnie NIE).
3. Migracja niespójnych zapisów (cud ownerId ≠ terytorium) i wygaszanie/przenoszenie wonderBuildSites na przejętym terytorium.
4. Bonusy ekskluzywne (dostęp „E”) u cywilizacji, która nie może postawić cudu.

TESTY (po commicie obrony, node_modules zainstalowany na czas testów):
- node tools/wonder-transfer-on-conquest-test.cjs: 32/32 PASS (było 26; +3 asercje scenariusza fortu, +1 bramka fortu, +2 inwentarz city.ownerId w main.ts i post-battle-map.ts).
- Mutacja settle fortu: 1 FAIL (test łamie mutację), plik przywrócony.
- logic-test: LOGIC OK 213/213.
- tsc --noEmit: exit 0.
- ai-test: 274 passed, 20 failed (identycznie jak Operator i baza; ai-test nie importuje main.ts, wzmianki w komentarzach).
- NIE WYKONANO: weryfikacja w przeglądarce (zmiana logiczna, brak nowego UI poza istniejącym modalem), npm run build.

BLOKADY: brak (pytania ABC wyżej są nieblokujące; założenia zapisane).
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator, potem Final Control; pytania ABC zgłasza orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
