# R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1 — raport Evaluatora (runda 1/5)

STATUS: PASS-WITH-NOTES (ocena: kandydat NIE spełnia kryteriów binarnych — 5 zarzutów poniżej; werdykt końcowy należy do Final Control)
DOMAIN: GAME (diagnoza bramki „Zakończ turę” NNS po wczytaniu zapisu; bez zmian w gra/src)
TEMAT: R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1
GOAL: ocenić niezależnie kandydata Operatora (diagnoza przyczyny blokady NNS po wczytaniu; repro; kandydaci naprawy; rekomendacja).
BAZA: 439b1e1ae0a6dbec769495941dff30867aa8857e (origin/main). KANDYDAT: 4e8ba4c84d03d52639b1a22a1322f5abae6d8e79 (merge-base z bazą = baza; kandydat = 1 commit na bazie).

## ZMIANY/COMMIT
- Allowlista (`git diff --name-only baza..kandydat`): 6 plików — `runs/<ID>/10-operator-claude.md`, `runs/<ID>/evidence/{probe-fresh-turn1-forecast-null.cjs, probe-topup-gate-turn2.cjs, repro-stale-forecast-after-load.json, run1-A-B-diag-timeline-raw.json}`, `gra/tools/nns-stale-forecast-after-load-repro.cjs`. Wszystko w allowliście; zero zmian w `gra/src`, `gra/data`, WERSJE.md, manifeście. OK.
- Ten raport + `evidence/eval-probe-control-validity.cjs` (sonda Evaluatora). Commit tylko tych dwóch ścieżek.

## TESTY (odtworzone samodzielnie na kandydacie, `npm ci` w gra/, build vite poza repo)
- `npx tsc --noEmit -p .` — exit 0 (TSC_EXIT=0, brak komunikatów).
- 5 bramek referencyjnych (surowe wyjście): logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0 / TOTAL: 33`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`. Wszystkie zgodne z wartościami referencyjnymi (R-PROC-AUTOBOT §Bramki). Brak regresji, brak długu bazowego do rozróżniania. (Operator tych bramek NIE uruchamiał — zob. zarzut 5.)
- Repro Operatora odtworzone bez zmian (`nns-stale-forecast-after-load-repro.cjs`): wynik identyczny z `repro-stale-forecast-after-load.json` (krok 3: bramka blokuje, spichlerzPo −48; krok 4: bramka wolna, cache null).
- Sonda Evaluatora (`evidence/eval-probe-control-validity.cjs`, 1 przeglądarka, 3 konteksty), surowy wynik:
  - świeża gra tura 1: myCities=1, gate=false, forecast=null (po DWÓCH odczytach nnsDiag), treasury 5000, spichlerz 0;
  - quickSave('probeslot') = true;
  - NOWA STRONA W TYM SAMYM KONTEKŚCIE (współdzielony localStorage), świeża gra, potem REALNE `loadSlot('probeslot')`: PRZED wczytaniem gate=false, forecast=null; PO wczytaniu gate=TRUE, forecast {turn 1, skarbiecObecny 5000, skarbiecPo 4907, spichlerzObecny 0, spichlerzPo −48};
  - NOWY KONTEKST (kontrola Operatora): `loadSlot` zwraca „resolved”, ale stan po = gate=false, forecast=null, czyli nic nie zostało wczytane (izolowany magazyn zapisów).
- Dowód mutacyjny: NIE DOTYCZY (brak poprawki kodu; temat tylko diagnoza). Operator nie dostarczył testu, który mógłby „czerwienieć po cofnięciu poprawki”; tool repro nie ma asercji (tylko wydruk JSON) — zob. uwaga w zarzucie 4.

## ZARZUTY (każde niespełnienie)

1. **Kontrola „świeża strona po wczytaniu” jest nieważna, więc wniosek „w świeżej stronie brak defektu” jest błędny.** Krok 4 repro (i pomiar „Wczytanie A w świeżej stronie” w raporcie) otwiera `browser.newContext()`, a zapis leży w magazynie kontekstu 1; w kontekście 2 `loadSlot` zwraca bez błędu, ale niczego nie wczytuje (sonda: p3 po „wczytaniu” = czysta świeża gra, forecast null, nie −48). „Świeża strona: DZIAŁA, endTurn 1→2” to więc po prostu świeża gra, nie wczytany zapis. Gdy zapis jest realnie dostępny (ten sam kontekst, nowa strona), wczytanie w ŚWIEŻEJ stronie również daje bramkę blokującą (−48). Wnioski 2 i 4 raportu Operatora („różnica same-page vs fresh-page”, „defekt tylko w scenariuszu ta sama strona”) są nieprawdziwe; sformułowanie „defekt TAK tylko w tej samej stronie, w świeżej brak” musi zostać odwołane.
2. **Przyczyna nie ustalona; hipoteza H1 „odrzucona” na błędnej podstawie, a trafniejsza interpretacja pominięta.** Dane wskazują odwrócony obraz: w świeżej grze tura 1 prognoza NNS nigdy się nie przelicza (forecast=null stabilnie po dwóch odczytach, mimo że gracz ma 1 miasto), a po wczytaniu (które ustawia dirty) wychodzi realne −48 — takie samo jak w turze 2 świeżej gry. To sugeruje, że „defektem” jest raczej brak prognozy/bramki przy starcie świeżej gry (cache nie liczony do pierwszego `markCityStateDirty`), a nie artefakt wczytania; ta hipoteza (i jej odpowiednik: czy `empireEconDirty` jest false na starcie) nie została sformułowana ani zmierzona. Operator sam przyznaje „NIE ZMIERZONO” dla przyczyny; kryterium dispatchu (DODATEK 2: „wynik = przyczyna”) niespełnione.
3. **Brak wymaganej tabeli ≥ 3 zapisów (kryterium binarne).** Zmierzono tylko A (tura 1). B (tura ≥ 20, kilka miast) i C (kampania/większa gra) — NIE ZMIERZONO. Wiersz „A w tej samej stronie” i „fresh game tura 2” to ten sam scenariusz zapisu z różnymi interwencjami, nie trzy zapisy. Brak także „to samo bez wczytania” dla B/C. Kryterium „≥ 3 zapisy z liczbami” niespełnione.
4. **Brak testu H1 w formie zadanej w DODATKU 1 oraz brak asercji w narzędziu.** Dispatch wymagał sprawdzenia `nnsGateForPlayer()` „bez i po `markCityStateDirty()`/`refreshLiveEmpireRates()`” (hak civTest) i porównania z pierwszym wczytaniem w świeżej stronie. Operator tego nie wykonał (nie próbował wymusić przeliczenia w świeżej grze tury 1, co od razu rozstrzygnęłoby zarzut 2). Narzędzie `nns-stale-forecast-after-load-repro.cjs` tylko wypisuje JSON — bez asercji, bez kodu wyjścia ≠ 0, a jego „kontrola” (zarzut 1) jest błędna, więc narzędzie utrwala fałszywy wniosek; nazwa „stale-forecast” sugeruje diagnozę (przeterminowany cache), której dane nie potwierdzają (turaPrognozy=1 po wczytaniu = świeżo przeliczone, co Operator sam zauważa).
5. **Niespełnione bramki procesu w raporcie Operatora.** Raport przyznaje: „5 bramek referencyjnych: NIE URUCHAMIANO”, a dispatch wymaga tsc 0 i 5 bramek. (Evaluator uruchomił je — zielone — więc stan jest dowiedziony, ale raport Operatora nie spełnia kryterium.) Dodatkowo: wskazane w raporcie linie `src/main.ts` (~49576, ~22908) nie zgadzają się z kodem bazy (cache `_nnsHumanForecast` ~23050, `nnsGateForPlayer` ~41048) — drobna nieścisłość, nie wpływa na wynik.

Pozytywne ustalenia (bez zarzutu): allowlista czysta; zero zmian w kodzie gry; nie osłabiono żadnych testów (nie dotykano testów); repro w Chromium jest odtwarzalne; surowe dowody w `evidence/`; uczciwe „NIE ZMIERZONO” dla B, C, przyczyny i domyślnego startu spichlerza; wniosek, że blokada w turze 2 (−48, spichlerz 0) nie jest artefaktem wczytania, jest poprawny.

## UWAGI-DLA-ORKIESTRATORA
- Dla rundy 2 (nie wdrażam, bez nowych sesji): (a) naprawić kontrolę — oba scenariusze w TYM SAMYM kontekście (lub zrzut zapisu przez `loadFromLocal` do pliku i wstrzyknięcie do drugiego kontekstu); (b) zmierzyć w świeżej grze tury 1 wynik po wymuszonym przeliczeniu (jeśli hak istnieje; w src brak — rozważyć hak, ale to zmiana src, poza allowlistą tego tematu, więc decyzja orkiestratora); (c) dodać zapisy B i C; (d) pokazać, czy domyślny start (spichlerz 0, racja 6, brak zapasu) naprawdę daje −48 w turze 1 — jeśli tak, to bramka w świeżej grze jest „ślepa” w turze 1 do pierwszego triggera, a zmierzone „−48 po wczytaniu” jest prawidłową ochroną.
- Pytanie produktowe dla właściciela (nie ma tu decyzji): czy start nowej gry ma dawać prognozę −48 w turze 1 (zapas 0), co blokowałoby pierwszą turę; dziś tego nie widać tylko dlatego, że prognoza nie jest liczona.
- Nie zakładano sesji/zadań/harmonogramów.

## BLOKADY
Brak blokad technicznych. NIE ZMIERZONO: zapisy B i C; przyczyna braku prognozy w świeżej grze tury 1 (dlaczego `refreshLiveEmpireRates` nie ustawia forecastu bez triggera) — nie badano w src poza lekturą `refreshLiveEmpireRatesUnsafe`/`nnsGateForPlayer`.

## RUNDY
Evaluator, runda 1/5 (niezależna ocena kandydata Operatora r1 w tym dispatchu).

## NASTĘPNY KROK
Final Control; rekomendacja Evaluatora: FAIL kandydata 4e8ba4c84 z powrotem do Operatora (to samo ID, runda 2) z zarzutami 1–4.

DEPLOY/PUSH: NIE WYKONANO
