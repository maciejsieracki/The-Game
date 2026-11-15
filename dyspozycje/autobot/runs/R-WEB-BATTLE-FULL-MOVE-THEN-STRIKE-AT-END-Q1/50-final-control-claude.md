# 50 — Final Control r5/5 — R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1

STATUS: FAIL (LIMIT-5-EXCEEDED — runda 5/5 wyczerpana; wymagana decyzja właściciela/orkiestratora)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1
GOAL: pełny ruch jednostki w bitwie; po pierwszym zderzeniu wręcz cios przy dojściu, reszta ruchu ku następnemu wrogowi, jeden cios na jednostkę na turę; równe wejście szeregu do pierwszego zderzenia wręcz nietknięte; wyjątki: doktryny Obrona/Ostrzał, rozkaz ręczny, uciekający, mur (ABC A).
ZMIANY/COMMIT: oceniany kandydat `cdfdb274d92862d93efa6ebf299560b9835291bf` (HEAD jest potomkiem origin/main `794ec9eda`; `git merge-base --is-ancestor 794ec9eda cdfdb274d` = tak). Diff vs baza: 10 plików (battleScene.ts +171, testy gra/tools/battle-*, docs encyklopedia/poradnik, wikiBundle, raporty runu) — w całości w allowliście, bez WERSJE.md/manifestu/rust-port.
Integrować (jeśli właściciel zaakceptuje resztkę T5): `cdfdb274d92862d93efa6ebf299560b9835291bf`.

## Zarzuty (werdykt per zarzut)

1. Baza/integracja — ODDAL (zamknięty): kandydat zawiera już merge origin/main 794ec9eda (aktualny origin/main = 794ec9eda); wikiBundle zregenerowany; brak konfliktu do rozwiązania. tsc 0.
2. Pokrycie mutacyjne piechoty/strzelców — NAPRAW (otwarty). Obrona dodała T5 i mutację, mutC piechoty wykrywana, ALE T5 jest CZERWONY na samym kodzie kandydata i pokazuje realne odstępstwo od reguły właściciela (patrz niżej).
3. Zakres testów (tylko mode=skip, jeden skład) — ODDAL: oddane już w r4 (M2 czerwona), dispatch DODATEK 6 pkt 4 zakazuje rozbudowy; animowany AUTO/oblężenie z murem NIE ZMIERZONO (nieblokujące).
4. battle-winning-army-* nie istnieją — ODDAL (0 plików także na origin/main); FALA 731 pokryta pośrednio, testy zielone (niżej).
5. Brak PNG z Chromium — ODDAL: log zdarzeń z realnej bitwy w Chromium (7/7) spełnia kryterium „log/zrzut”; obrazu NIE oglądałem.

## Dowód (zmierzone samodzielnie, `npm ci --ignore-scripts` w tym worktree, kandydat cdfdb274d)

- `npx tsc --noEmit`: exit 0. `git diff --check 794ec9eda..HEAD`: czysto.
- 5 bramek referencyjnych + moc: logic-test 213/213; tech-tree-test 20/20; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0.
- battle-full-move-strike-test (BFM_PART=code): 7/7. Sumy: firstContact 6, postMoveThenHit 100, postHitThenMoveRanged 81, msmInf 48, msmCav 14, doubleStrike 0, preMoveThenHit 0, preHitThenMove 0, mpUnexplained 0 (mpUsed 534/906 puli, 226 sprawdzonych aktywacji), 3 ziarna, zwycięzca atakujący. Mutacje: mutA (limit „1 cios”) doubleStrike 19 = wykryta; mutB (reguła przed zderzeniem) preMoveThenHit 4 / preHitThenMove 13 = wykryta; mutC (cios kończy aktywację) msm 0 = wykryta. Determinizm x3: identyczny skrót d5c8bff72c1310cb905eb716afefb93a.
- battle-pursuit-move-behavior-test (BPM_PART=code): 12/13. T1/T2/T3 ok (freeRatio 1.000 na 3 ziarnach, próg 0.80 bez zmian), T4 ok (konnica wastedActs 0 w 3 ziarnach, w tym ziarno 1 runda 12 — zarzut 6 z r4 NAPRAWIONY), A1–A8 ok, mutacja miary T3 wykryta. **T5 FAIL: wastedInf = 2 z 80 ocenionych aktywacji piechoty/strzelców (tury 9–16).**
- battle-pace-latch-test 5/5 (mutacja MELEE_LATCH wykryta); battle-line-advance-uniform-test PASS; battle-pace-equal-line-live-test 23/0.
- battle-line-advance-uniform-browser-test: timeout 90 s na `__e2e.ready` — IDENTYCZNIE na bazie 794ec9eda (battleScene.ts bazowy, sprawdzone) → dług bazowy, nie regresja.
- battle-doctrine-live-r3: FAIL timeout 120 s, strona zgłasza `Unexpected token '<'` x3 (sidecary ładowane jako HTML) — zgodnie z Obroną identycznie na bazie (dług bazowy). Nie uruchamiałem r4 ani large-mixed-matrix (NIE ZMIERZONO przeze mnie).

## Przyczyna FAIL (jedyna)

T5 (diagnostyka BPM_DEBUG, własny przebieg): dwie aktywacje piechoty po zderzeniu kończą się z niewykorzystaną pulą, wolną drogą i żywym wrogiem:
- runda 12 atk11: pula 3, zostało 1, freeNb 3, pathExists true, enemiesAlive 1, latched true, doctrineExempt false, struckRound false;
- runda 10 atk9: pula 3, zostało 2, freeNb 3, pathExists true, enemiesAlive 2, latched true, doctrineExempt false, struckRound false.
To nie jest blokada fizyczna wg DODATKU 5b ani wyjątek ABC A, więc narusza regułę właściciela „wykorzystuje cały ruch” — tę samą klasę, za którą r4 uznał FAIL (zarzut 6, wtedy konnica). Skala: 2/80 (2,5%) aktywacji piechoty; konnica 0. Obrona jej nie naprawiła (runda 5/5 wyczerpana), a zostawia czerwony test w repo.

## Opcje dla właściciela/orkiestratora (to nie moja decyzja)

A. Zaakceptować resztkę jako znaną (PASS-WITH-NOTES w praktyce): zintegrować `cdfdb274d`, ale T5 oznaczyć jako znany dług (np. wyłączyć z domyślnego przebiegu/zmienić na ostrzeżenie w osobnym temacie) — kandydat i tak poprawia bazę (konnica 0 zmarnowanych, T3 1.000).
B. Nowy temat naprawczy dla piechoty (ta sama `_resolveAutoBatchMovement`, gałąź piechoty/strzelców po zamrożonym planie), z T5 jako kryterium.

BLOKADY: T5 czerwony (2/80); brak decyzji po limicie 5 rund.
RUNDY: 5/5 (limit wyczerpany); ostatni werdykt FC: FAIL.
NASTĘPNY KROK: decyzja właściciela A/B; do tego czasu NIE integrować.

UWAGI-DLA-ORKIESTRATORA: (1) dług bazowy: battle-line-advance-uniform-browser-test i battle-doctrine-live-r3/r4 padają na bazie tak samo (sidecary `Unexpected token '<'`) — osobny temat harnessu; (2) dług Rust: REPIN logiki bitewnej (po integracji); (3) NIE ZMIERZONO: animowany AUTO, doctrine-live r4, large-mixed-doctrine-matrix, oblężenie z murem.

DEPLOY/PUSH: NIE WYKONANO
