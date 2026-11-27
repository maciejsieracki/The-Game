STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar pod decyzje; zero zmian gra/src i gra/data)
TEMAT: R-WEB-MEASURE-ERA-WAR-Q2-Q1 (MEASQ2, #136), runda 1/5, Operator HAIKU 5.5
GOAL: zmierzyć wojny epoki na żywo (Chromium) po FALACH 906/908 z polem epoki cywilizacji i powodem końca wojny; odpowiedzieć na pytania z dispatchu albo oznaczyć NIE ZMIERZONO z przyczyną.
BAZA: origin/main 01790e5531b82e985929d4f7dd76e6ce152e4316 (ROBOCZA 7398bd08, FALA 925)
ZMIANY/COMMIT: pliki w allowliście: gra/tools/era-war-q2-measure.cjs (nowy; kopia war-duration-measure.cjs z: startem przez __settingsLive z diplomacyWarLevel=trudna + playerEpochWarEnabled=true; trybem --patch-ep dodającym pole `ep` do dumpu w KOPII; zapisem dziennika __diploWarEndLog do <out>/war-kontynenty-<seed>.warend.json; zapisem slotu co turę; soleniem PRNG przy wznowieniu MEASURE_RESALT); dyspozycje/analizy/WOJNY-EPOKI-Q2-2026-11-26.md; dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-Q2-Q1/dane/ (jsonl.gz, warend.json.gz, status.json.gz, SHA256SUMS); ten raport. Commit: patrz sekcja SHA w odpowiedzi orkiestratora. Zero zmian gra/src, gra/data, WERSJE.md, manifestu.
TESTY:
- Maksimum dyplomacji: diplomacyWarLevel = 'trudna' (najwyższy z latwa/normalna/trudna, newGameFlow.ts). Gracz: wojna epoki ON. Innych poziomów nie mierzono.
- seed 4242: tury t2–t120 KOMPLETNE (119 rekordów). Plik dane/war-kontynenty-4242.jsonl.gz. Status: DONE.
- seed 7: tury t2–t84 (83 rekordy). Ostatni zapis slotu t82, t83–t84 w statystykach. Przerwanie: Chromium „Target page … closed” w fazie odtwarzania świata przed loadSlot, 4 próby na ostatnim odcinku (w tym 3 z nową solą PRNG), bez postępu. Seed 7 do t120: NIE ZMIERZONO (awarie Chromium, nie błąd gry).
- Kontrola zgodności rekordów: pole `ep` obecne w każdym rekordzie (owners[].ep); warend.json zawiera tylko przejścia z wojny (turyWojny != null) w obu seedach.
- Bramki kodu: `node --check gra/tools/era-war-q2-measure.cjs` OK. tsc NIE URUCHOMIONO (brak node_modules z typescript w tym worktree; zero zmian w gra/src, więc bramka nie dotyczy).
- Build kopii poza repo: `vite build` (node_modules zlinkowany z innego worktree; ten link zniknął po jego sprzątnięciu — dist był już zbudowany).
BLOKADY:
- Chromium: awarie „Target page … closed” przy wznowieniach (seed 4242: 17 wpisów błędu w run.log; seed 7: 34). Przyczyna NIE ZMIERZONA; sól PRNG nie usunęła awarii.
- Dziennik powodu końca wojny pomija pary z graczem (`skipPair = isMe(a) || isMe(b)` w gra/src/main.ts ok. l. 27222). Powód końca wojen gracza NIE ZMIERZONO (decyzja: poszerzyć dziennik tylko w civTest — do rozstrzygnięcia przez orkiestratora, poza tym tematem).
- Brak pewnego ustalenia, dlaczego gracz nie wchodzi w Żelazo w 120 turach (hipoteza: autopilot nie prowadzi badań — NIE ZMIERZONO).
RUNDY: 1/5. Ostatni werdykt: brak (pierwsza runda).
NASTĘPNY KROK: (a) orkiestrator decyduje, czy seed 7 dociągnąć do t120 w osobnym temacie (wznowienie kilkukrotnie zawodne); (b) analiza wojen epoki Żelaza z wynikiem NIEZGODNE/do weryfikacji dla FALI 906 (4 z 7 wojen żelaznych startuje przed wejściem jednej lub obu stron, najbardziej rozbieżne 28-37 o 17 tur) — wymaga odtworzenia na krótkim scenariuszu w kodzie (kolejny temat R-WEB-*, bez zmian w tym pomiarze); (c) decyzja inżynierska o dzienniku końca wojny z graczem.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na pytania z dispatchu (skrót; szczegóły w analizie)

- Tura wejścia w epokę każdej strony i opóźnienie start − wejście (FALA 906): seed 4242 — 13/13 AI weszło do Żelaza w t69–t107; wojny żelazne: 1-16 (t71, 0 tur), 22-34 (t79, 0), 28-34 (seed 7, t74, 0) zgodnie; 28-37 (t77, −17), 7-10 (t89, −8), 13-31 (t80, −1), 22-37 (seed 7, t80, strona 37 nie weszła do t84) rozbieżnie. Werdykt: NIEZGODNE / do weryfikacji.
- Liczba wojen naraz u jednej cywilizacji: max 2 (w obu seedach); w świecie max 8 (4242) i 6 (seed 7).
- Powód i czas końca wojen epoki (FALA 908): zalogowane zakończenia AI–AI: oferta_zmęczenia 14, prośba o pokój AI 4, auto pokój dwa miasta 2 (4242); 5 + 1 (seed 7). Czas 3–20 tur. Werdykt FALA 908: ZGODNE co do powodów; progi zmęczenia NIE ZMIERZONO.
- Wojna gracza w epoce: gracz w wojnie z dwoma AI przez 40 tur (t40–t80) w epoce Brązu, oba seedy; koniec po dokładnie 40 turach; powód końca NIE ZMIERZONO (pominięcie w dzienniku).
- Wciąganie sojuszników: NIE ZMIERZONO (sojusze AI prawie nie występują w tym biegu; 9 tur w seed 4242 t112–120; brak w seed 7).

## UWAGI-DLA-ORKIESTRATORA

1. Znalezisko kandydat BŁĄD-GRY (do odtworzenia przed decyzją, bez poprawek): wojny żelazne (wymuszone etykietą „iron”) startują w turach, w których jedna lub obie strony jeszcze nie są w epoce Żelaza według pola `ep` (28-37: −17 tur; 7-10: −8; 13-31: −1; 22-37 w seed 7). Może to być rozbieżność definicji „wejścia” albo start po wejściu jednej strony; wymaga sprawdzenia w kodzie (FALA 906).
2. Dziennik `__diploWarEndLog` nie zapisuje końca wojen z graczem (skipPair). Decyzja: czy poszerzyć dziennik tylko pod civTest (zmiana w gra/src — poza tym tematem).
3. Pomiar dla seed 7 wymaga osobnego wznowienia do t120 (awarie Chromium w fazie startu gry). Sugestia: osobny temat z większym limitem prób lub po uspokojeniu maszyny (load average ~7 na 4 rdzeniach przy równoległych workflow).
4. Gracz pozostaje w epoce Brązu przez 120 tur (oba seedy). Jeśli to nie jest zamierzone, warto ustalić, czy autopilot gracza prowadzi badania (pytanie techniczne, nie do właściciela).
5. Higiena: w scratchpadzie zostają kopia gry i profile Chromium tematu (poza repo, nie commitowane); profile usunięte po analizie. Link node_modules do cudzego worktree został zastąpiony kopią playwright.
6. Operatorzy innych tematów: `gra/tools/era-war-q2-measure.cjs` jest nowym plikiem i nie zmienia `war-duration-measure.cjs`.

## KOREKTA (obrona, runda 2 — zob. 30-obrona-claude.md)

- Zarzut 1 PRZYJĘTY: wojna 28-37 z t77 jest naturalna (powód None w warend.json); wojna epoki 28-37 startuje w t96, gdy obie strony są w Żelazie (wejścia t94 i t86). Rozbieżność „−17 tur” nie istnieje. Pozycja w odpowiedziach i UWAGACH pkt 1 jest nieaktualna.
- Zarzut 2 PRZYJĘTY: werdykt FALA 906 to ZGODNE wg reguły 16A (task #161): wojna epoki startuje po wejściu strony, która ją zaczyna. Wszystkie 7 wojen epoki żelaznej zgodne (4242: 5, seed 7: 2). Kandydat BŁĄD-GRY „wojny przed wejściem” odrzucony.
- Werdykt „NIEZGODNE / do weryfikacji (3 zgodne, 4 rozbieżne)” z odpowiedzi FALA 906 jest nieaktualny. Autorytatywna wersja: dyspozycje/analizy/WOJNY-EPOKI-Q2-2026-11-26.md §5–§6.
