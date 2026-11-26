# R-WEB-TEST-DEBT-Q14-MUTATIONS-Q1 — raport obrony Operatora, runda 2/5

STATUS: FAIL (częściowo: kryterium binarne NADAL NIESPEŁNIONE; ta runda nie domknęła listy)
DOMAIN: INFRA (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-MUTATIONS-Q1
GOAL: każdy naprawiony test Q14 bez mutacji czerwonej ma mutację czerwoną albo klasyfikację SŁABY/RÓWNOWAŻNY z dowodem.
BAZA/KANDYDAT: 3cf88c51a409a7cafd377d2334294b66840f53dd (checkout --detach, bez zmian w repo poza tym raportem).

## Odpowiedź na zarzuty Evaluatora (137a4a58e)

1. Kryterium binarne niespełnione (pozycje bez mutacji/klasyfikacji) — PRZYJMUJĘ. Ta runda NIE domknęła listy. Stan:
   - Wykonano czerwone bazy (tylko zielona baza, bez mutacji): administracja-stolica, budynki-koszt-pracy-50, currency, drewno-gate, culture-religion, ai-praca-split-parity, forced-war-iron, era-war-bronze-player-target, diplo-forced-peace-pending, autoimprove-irrigation-after-farms. To NIE jest dowód czerwieni; wszystkie pozostają NIE ZROBIONE (mutacja nie wykonana).
   - earth-template-test: w kopii przekroczył 300 s (exit 124), NIE ZMIERZONO; proces przerwany (pkill), nic nie zostało.
   - map-coast-buffer-test, ai-march-avoid-foreign-territory-test, ai-city-render-batch-test: pętla bazowa została przerwana przed nimi; NIE ZMIERZONO.
   - Pozycje z DODATKU (forced-war-iron, era-war-bronze, diplo-forced-peace-pending, autoimprove-irrigation-after-farms, earth-template, map-coast-buffer): tylko zielona baza powyżej; mutacji brak.
2. war-allin-capital-test — PRZYJMUJĘ (klasyfikacja nieukończona). Wyniki w tej rundzie na kopii (plik src/game/warAllInCapital.ts, mutacja jednej linii, przywracana z .orig, cmp nie robiony — wynik z exit code):
   - baza: `node tools/war-allin-capital-test.cjs` exit 0, `88 passed, 0 failed`.
   - M-A: usunięto `if (st.occupied.has(nk) && !st.vacated.has(nk)) return false;` -> exit 1, `87 passed, 1 failed` (CZERWONY).
   - M-B: `if (st.claimed.has(nk)) return false;` -> zamienione na `if (false) return false;` NIE uruchomione poprawnie (anchor nieunikalny, COUNT 2). NIE ZMIERZONO.
   - M-C: `a.defenders < b.defenders` -> `a.defenders > b.defenders` (sortowanie celu) -> exit 0, `88 passed, 0 failed` (NIE czerwienieje).
   - M-D: `seaTargets.length > 0` -> `> 1000` (wybór celów morskich) -> exit 0, `88 passed, 0 failed` (NIE czerwienieje).
   - Cztery mutacje z r1 (w ai.ts) nadal nie są rozstrzygnięte. Klasyfikacja SŁABY/RÓWNOWAŻNY dla M-C i M-D NIE wykonana (wymaga analizy gałęzi i dopisania asercji albo dowodu równoważności). Nie zgadywano.
3. Niespójność „49 asercji” — PRZYJMUJĘ. Poprawny stan: po zmianie ai-jednostki-tylko-zakup-test ma 47 asercji (45 bazowych + 2 A-PRICE), zgodnie z wynikiem `47 passed, 0 failed`. Wpis „49” w 10-operator-claude.md jest błędny; korekta tutaj, plik r1 nie jest edytowany.
4. Wiersze mutacji 1–4, 6, 7 NIE ZMIERZONO przez Evaluatora — PRZYJMUJĘ. W tej rundzie NIE odtworzono ich ponownie (brak dowodu w tym raporcie). Dane r1 pozostają jako dane Operatora, nie jako dowód niezależny.

## Wynik bramek (ta runda, kopia poza repo, surowe)
Bramki z dispatchu (tsc, logic 213, ai-test 297/0) NIE uruchomiono w tej rundzie — repo nie zmieniło się względem r1 (commit r1 dotyczy tylko ai-jednostki-tylko-zakup-test.cjs, zgodnie z zielonymi bramkami r1 wg Evaluatora). Oznaczam NIE ZMIERZONO w tej rundzie.

## ZMIANY-COMMIT
Brak zmian w repo w tej rundzie (kod testów nie dotknięty; mutacje tylko w kopii scratchpad, przywracane z .orig). Commit tego raportu jest jedyną zmianą.

## TESTY
- Kopia gra/ poza repo (scratchpad mir2), npm ci exit 0.
- Zielone bazy (surowe): budynki-koszt-pracy-50 183 pass/0 fail; currency 37/0; drewno-gate 20/20; culture-religion 65/0; ai-praca-split-parity 27/0; forced-war-iron 54/0; era-war-bronze-player-target 45/0; diplo-forced-peace-pending 40/0 PASS=40 FAIL=0; autoimprove-irrigation-after-farms 42 OK/0; administracja-stolica exit 0 (bez linii podsumowania).
- Czerwone (mutacje): war-allin-capital M-A exit 1; pozostałe z r1 wg raportu Operatora r1.

## BLOKADY
- Brak czasu/przepustowości w tej rundzie na pełną listę (≈12 pozycji bez mutacji + 6 z DODATKU + klasyfikacja war-allin). Stan pozostaje w tabeli powyżej.
- earth-template-test przekracza 300 s w kopii (przerwano); wymaga dłuższego okna lub osobnego uruchomienia.

## RUNDY
2/5 (obrona). Pozostało 3 rundy na domknięcie listy.

## UWAGI-DLA-ORKIESTRATORA
1. Temat nie jest zamknięty. Następna runda: mutacje dla pozycji z „NIE ZROBIONE” oraz DODATKU, klasyfikacja M-C/M-D war-allin.
2. Operatorem jest Haiku; po tej rundzie kryterium nadal FAIL. Rozważ Sonnet dopiero po dwóch nieudanych rundach Haiku (tu: r1 FAIL, r2 FAIL — warunek spełniony, wymaga pisemnego uzasadnienia w dispatchu).
3. Brak zarzutów poza zakresem. Nie tworzono zadań ani sesji.

NASTĘPNY KROK: runda 3 — mutacje (surowe wyniki) dla pozostałych pozycji z listy i DODATKU, klasyfikacja war-allin M-C/M-D, następnie Evaluator.
DEPLOY/PUSH: NIE WYKONANO
