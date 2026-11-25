# R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1 — obrona Operatora (runda 2/5, odpowiedź na raport Evaluatora 6e7ce6c98)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1 (A1)
GOAL: przywrócić pas polarny (TerenBazowy.Polarny) dla map „kontynenty” bez zmiany asercji climate-band-test; wyspy, ziemia i pangea bez zmian wyniku.
KANDYDAT (wejście obrony): 80d716759 (baza aa96cfc618de124e48b74408870115854293e6c5).
ZMIANY-COMMIT: patrz sekcja końcowa (SHA czubka obrony w polu sha raportu orkiestratora).

## Odpowiedź na zarzuty Evaluatora

1. PRZYJMUJĘ — pangea-land-determinism-test czerwony. Uruchomiony (surowo): kandydat 80d716759 — `FAIL: kontynenty:1/42/99/7777` i `wyspy:1/42/7777` (7 hashów, exit 1); po poprawce obrony (pkt 2) i re-pinie kontynentów — `PASS: hashe 3 typow identyczne z baza, Pangea 59-61%` (patrz tabela niżej). Re-pin wykonany TYLKO dla kontynentów 1/42/99/7777 (wyspy, ziemia, pangea — bajt-identyczne z bazą, wynik `hash=` = pin).
   Uzasadnienie re-pinu (przed/po): baza aa96cfc polar 0/0/0/0; po poprawce polar 387/402/404/371 (seedy 1/7/42/4242, z osobnego testu). Hashe: przed d4129ac5a700b221 / 4db90d6e807ceb5f / be3f9c573ab42d05 / eac663ea51e76718; po d7684fe0975e74e5 / 2d321c9b3ea215d5 / a84baa20de2c56d4 / e53c36f4d1e8d64e.

2. PRZYJMUJĘ — zmiana typu „wyspy” była nadmiarowa. Przyczyna: `rebalanceLandFractionWithMargins` (generator.ts, gałąź `else`) i `enforceTargetDryLandFraction` dostawały ochronę pasa dla każdego typu ≠ pangea, więc wyspy też ją dostawały. Poprawka obrony: ochrona pasa wyłącznie dla `typ === 'kontynenty'` (we wszystkich trzech miejscach: applyLandFractionByContinent, enforceTargetDryLandFraction, rebalanceLandFractionWithMargins; purgeOpenOceanLandSpecks także tylko dla kontynentów).
   Pomiar po poprawce (surowe hashe z tego samego generatora, baza vs kandydat obrony): wyspy 1/42/99/7777 — hash IDENTYCZNY z bazą (5af15091… / 58191dcb… / 90a0b2438… / aea744461…), polar wysp = baza (599/468/567/588). Wyspy nie miały braku polarnego (baza już ma 468–599), więc nie wymagały poprawki.
   Ziemia 1/42/99/7777 i pangea 1/42/99/7777: hash IDENTYCZNY z bazą; polar ziemi 0 (zamierzone), pangea 182/146/168/154 = baza.

3. PRZYJMUJĘ (luka domknięta tylko częściowo — patrz NIE ZMIERZONO). Bramki generatora uruchomione w tej rundzie, wyniki surowe:
   - land-sea-ratio-test: części `maly` (typy kontynenty/pangea/wyspy + domyślne %): `7 pass, 0 fail` (exit 0). Części `superogromny` (suwak 70% i Super Huge 336×238): NIE ZAMKNIĘTE — pojedyncza mapa superogromny > 580 s (timeout) na 4 rdzeniach przy load average ~8.
   - map-gen-regression-test, map-continents-rivers-test, relief-grid-coverage-test: NIE ZAMKNIĘTE (timeout 560 s, bez wyniku).
   - map-coast-buffer-test: NIE ZAMKNIĘTE (timeout 560 s). Porównanie wyniku częściowego z bazą: 23 linie FAIL o identycznych etykietach i identycznych współrzędnych dla kontynenty/pangea/wyspy/ziemia (te błędy są już na bazie). Liczby zbiorcze `generujSwiat` różnią się: baza malenki 81 / maly 28 / standardowy 44; kandydat 85 / 56 / 26 (liczba „ląd w buforze brzegu”). Test był czerwony także na bazie; nie jest to nowa czerwień, ale wzrost liczby naruszeń dla „maly” (28 → 56) jest zmierzony i należy go ocenić w FC.
   - stranded-land-test: NIE ZAMKNIĘTE (timeout 560 s). Częściowy wynik kandydata: Standard kontynenty seed 42 i 7 — PASS (specks=0, pustynia w oceanie n=0). Porażki Ziemia 7/42 (specks=5) z bazy nie są sprawdzone w tym biegu.
   - world-density-test, deposit-coast-test: NIE ZAMKNIĘTE (timeout 560 s, bez wyniku).
   - Testy rdzenia (zielone na kandydacie obrony, surowe liczby z wyjścia): logic-test 213/213 (`LOGIC OK (213/213)`); tech-tree-test 20 pass, 0 fail; research-test PASSED 33 / FAILED 0 / TOTAL 33; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`.
   - Pozostałe testy (ai-*, war-*, diplomacy-*, era, fort, army, road itp.) NIE były w zakresie zadania — nie uruchamiane w tej rundzie.
   Kryterium „testy suwaka lądu zielone” pozostaje NIEDOWODZONE w całości (superogromny, land-sea). Patrz NASTĘPNY KROK.

4. PRZYJMUJĘ — nagłówek testu zmieniony: mutacja opisana jako wyłączenie ochrony pasa (`polarBandLastForErosion` zwraca kolejkę bez zmian); usunięta nieistniejąca nazwa `isProtectedPolarBandKey`; komentarz pomiarów zaktualizowany do faktycznych wartości.

5. PRZYJMUJĘ — sufit luźny. Sufit zmieniony ze stałej „połowa pasa” (1008) na stałe 600 (~1,35 × najwyższy pomiar 449, seed 7777 — ten seed jest poza testem; w teście najwyższy 404). Pomiar w teście: 387/402/404/371 — wszystkie < 600.

## Dowody mutacji (test czerwony przy wyłączonej ochronie)
- Mutacja A (wyłączenie tylko jednego z trzech miejsc, bramka `typ === 'kontynenty'` → `false` w applyLandFractionByContinent): test ZIELONY (polar 352/386/384/303). Wniosek: ochrona działa w wielu miejscach i jedno wyłączenie nie wystarcza — ta mutacja NIE jest dowodem; nie przyjmuję jej jako mutacji dowodowej.
- Mutacja B (`polarBandLastForErosion` zwraca kolejkę bez zmian — wyłącza ochronę wszędzie): `map-polar-continents-test: FAIL (5)`, polar = 0 dla seedów 1/7/42/4242 i malenki 42 (`FAIL: kontynenty seed 1: polar > 0 (0)` … `FAIL: kontynenty malenki seed 42: polar > 0 (0)`). Mutacja cofnięta (weryfikacja `grep` — brak `if (true ||`).

## Zmiana kształtu kontynentów — UWAGA DLA FC (nie ukrywam)
Poprawka przesuwa erozję lądu także poza pas polarny: liczba heksów różniących się od bazy (kontynenty, 20160 heksów na mapę): seed 1 — 3805 (terenBazowy 2903); seed 42 — 4294 (3373); seed 99 — 4389 (3517); seed 7777 — 5103 (4136). Wiersze różnic: 3–115/116 (cała mapa), NIE tylko pas polarny. Mechanizm: każdy chroniony heks pasa nie jest zjadany, więc ta sama kwota lądu jest zdejmowana z innych wierszy. To jest konsekwencja wyboru „kandydaci pasa na koniec kolejki” (wariant „wyłączenie całkowite” dał wyspy-szumy, patrz poprzednia runda). FC/właściciel ocenia, czy taka zmiana kształtu kontynentów jest akceptowalna. Wyspy, ziemia i pangea — bez zmian.

## TESTY (surowe wyniki, worktree wf_cf09d21a-ede-3, po poprawkach obrony)
- `npx tsc --noEmit`: exit 0.
- climate-band-test: `climate-band-test: PASS` (exit 0), asercja polar > 0 bez zmian.
- map-polar-continents-test: exit 0, `map-polar-continents-test: PASS`; `seed=1 polar=387`, `seed=7 polar=402`, `seed=42 polar=404`, `seed=4242 polar=371`, sufit 600, `malenki seed 42 polar=57`, `ziemia seed 42 polar=0`.
- pangea-land-determinism-test: exit 0, `PASS: hashe 3 typow identyczne z baza, Pangea 59-61%` (po re-pinie kontynentów).
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6 (exit 0 każdy).
- land-sea-ratio-test część maly: 7 pass / 0 fail. Część superogromny: NIE ZMIERZONO (timeout).
- map-coast-buffer-test: NIE ZMIERZONO na pełnym biegu (timeout 560 s); częściowe porównanie z bazą jak w pkt 3.
- stranded-land-test, world-density-test, deposit-coast-test, map-gen-regression-test, map-continents-rivers-test, relief-grid-coverage-test: NIE ZMIERZONO (timeout 560 s; load average ~8 na 4 rdzeniach).

## Pomiary (zmierzone w tej rundzie, baza aa96cfc vs kandydat obrony, `generujSwiat(seed,'standardowy',typ)`, rzeki wyłączone jak w teście determinizmu)
| typ:seed | polar baza | polar kandydat | hash baza | hash kandydat |
|---|---|---|---|---|
| kontynenty:1 | 0 | 387 | d4129ac5a700b221 | d7684fe0975e74e5 |
| kontynenty:42 | 0 | 404 | 4db90d6e807ceb5f | 2d321c9b3ea215d5 |
| kontynenty:99 | 0 | 381 | be3f9c573ab42d05 | a84baa20de2c56d4 |
| kontynenty:7777 | 0 | 449 | eac663ea51e76718 | e53c36f4d1e8d64e |
| wyspy:1 | 599 | 599 | 5af15091eec73d5d | 5af15091eec73d5d |
| wyspy:42 | 468 | 468 | 58191dcbaf2f237f | 58191dcbaf2f237f |
| wyspy:99 | 567 | 567 | 90a0b2438aa2c44d | 90a0b2438aa2c44d |
| wyspy:7777 | 588 | 588 | aea744461a035d68 | aea744461a035d68 |
| ziemia:1/42/99/7777 | 0 | 0 | identyczne | identyczne |
| pangea:1/42/99/7777 | 182/146/168/154 | 182/146/168/154 | identyczne | identyczne |

(Uwaga: wartości polar dla kontynenty:99 i 7777 pochodzą z pomiaru obrony; seedy 7 i 4242 — z testu map-polar-continents: 402 i 371.)

## Re-pin — uzasadnienie (wymagane przez dispatch)
- Zmieniony: wyłącznie `kontynenty:1/42/99/7777` w gra/tools/pangea-land-determinism-test.cjs (komentarz z przed/po i wyjaśnieniem zakresu zmiany).
- Nie zmieniony: wyspy, ziemia, pangea; climate-band-test (asercja i wynik bez zmian); żadnego innego testu.

## BLOKADY
- Pełny zestaw bramek map/generatora NIE domknięty (lista w pkt 3). Kryterium „testy suwaka lądu zielone” NIEDOWODZONE w całości.
- Zmiana kształtu kontynentów na ~19–25% heksów (pkt „UWAGA DLA FC”) — decyzja FC/właściciela.
- Wzrost liczby naruszeń „ląd w buforze” dla „maly” (28 → 56) na teście coast-buffer (test czerwony już na bazie).

## UWAGI-DLA-ORKIESTRATORA
- Każdy test generatora z timeoutem 560 s to skutek obciążenia hosta (load average ~8 przy 4 rdzeniach; bieg równoległy 4 testów też przekroczył 560 s). Nie uruchamiano nic w tle.
- W katalogu scratchpad są logi z wcześniejszych sesji o tych samych nazwach; w raporcie cytuję wyłącznie wyniki z tej rundy.
- Worktree bazowy (scratchpad/base-aa96) utworzony do porównania; usuwany po commicie.

NASTĘPNY KROK: FC (Sonnet) — ocenić zmianę kształtu kontynentów (pkt UWAGA DLA FC) i wynik map-coast-buffer („maly” 28→56); dokończyć bramki superogromny land-sea, map-gen-regression, map-continents-rivers, relief-grid-coverage, stranded-land (Ziemia 7/42), world-density, deposit-coast na czystym środowisku z większym limitem czasu. Decyzja właściciela wymagana, jeśli FC uzna zmianę kształtu kontynentów za zbyt szeroką.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 2/5 (Operator, obrona)
