STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MINT-CAPITAL-WHOLE-CIV-Q1
GOAL: Mennica w stolicy podnosi podatek WSZYSTKICH miast cywilizacji (przewodnik 08 §49.3b), bez zmiany wartości bonusu; test H2e zielony bez osłabiania asercji.
BAZA: origin/main 35f601ae304471593c4921a61bfecbddbb9de14a (detach); kod gry NIE zmieniony.

## Ustalenia (dochodzenie)
- Zasięg Mennicy JUŻ jest owner-wide w kodzie: gra/src/game/turn-economy.ts `ownersWithMennica` (liczy właściciela, gdy Mennica stoi w KTÓRYMKOLWIEK jego mieście) oraz `maMennicaEmpireWide = mennicaOwners.has(ownerId) && resolveOwnerZlotoAccess(ownerId)` (dwa miejsca: ok. l. 2281 i 2966); flaga trafia do ctx.maMennica (ok. l. 2326 i 3011).
- Mnożnik stosuje gra/src/game/economy.ts (ok. l. 994-998: walutaActive = walutaOdkrytaOnly && ctx.maMennica; handelNetto = handelNettoRaw * mnoznik). Ten sam kod dla gracza i AI (brak gałęzi po ownerId).
- Dlatego test H2e nie wykrywa braku zasięgu, lecz błąd pomiaru: w scenariuszu miasto pH2 (populacja 4) Mennica podnosi Naukę 3->5 i Luksus 0->1 (mnożnik działa), ale Podatek (pieniadzBrutto) zostaje 2->2, bo po podziale 30% i floor() przyrost jest zjedzony przez zaokrąglenie. Sprawdzone: populacja 8 -> Podatek 2->4; populacja 12 -> 4->6.
- Wniosek: zmiana wartości/balansu NIE jest potrzebna, a w gra/src nie ma czego naprawiać w zasięgu. Brak DECISION_REQUIRED.
- Uwaga (nie zweryfikowana): nie znalazłem w gra/src jawnej bramki "Mennica tylko w stolicy" przy budowie (grep 'mennica' w cities.ts / building-resource-gate.ts bez trafienia dla 'stolic/capital'). Jeśli Mennica może stanąć poza stolicą, `ownersWithMennica` i tak da zasięg całej cywilizacji (rozbieżne z decyzją 70/B). Nie zmieniałem — poza zakresem tej rundy.

## Zmiany (ZMIANY-COMMIT)
- gra/tools/trade-routes-income-test.cjs:
  1. Scenariusz: populacja miasta pH2 ustawiona na 8 (linia po `makeRuntimeCity('pH2', 0, 205)`). Asercje H2e NIE zmienione. Uzasadnienie: przy populacji 4 zaokrąglenie maskuje efekt.
  2. Nowa asercja negatywna H2g: miasto fH obcej cywilizacji (owner 1) bez Mennicy nie dostaje bonusu (`mintWithoutRoute.fH.pieniadzBrutto == base.fH.pieniadzBrutto`).
- Nie dodano nowego pliku testowego (wystarczyło rozszerzenie istniejącego).
- gra/src: BEZ zmian.

## Mutacja
- Tymczasowo w turn-economy.ts zawężono bonus do miasta lokalnego (`maMennicaBuiltEmpireWide = (builtByCity.get(city.id) ?? []).includes("mennica")`, 2 miejsca). Wynik: `trade-routes-income-test: 134 passed, 1 failed` — FAIL: H2e ... (mint=2, noMint=2). Po mutacji plik przywrócony (git checkout).

## TESTY (liczby z surowego wyjścia)
- trade-routes-income-test.cjs (po zmianach): 135 passed, 0 failed (przed zmianą: 133 passed, 1 failed).
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, ALL GREEN.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: All sanity checks passed (exit 0).
- ai-test.cjs: 297 passed, 0 failed.
- era-war-pairing-alliance-test: 19 pass, 0 fail.
- ai-ai-alliance-surcharge-test: ALL GREEN (live + mutants detected).
- Testy ekonomii podatków/Mennicy: mennica-magazyn-test 56/0; mennica-uspienie-test 49/0; waluta-mennica-test 61/0; food-to-tax-conversion-test 71/0; labor-to-tax-conversion-gold-test 58/0; default-tax-split-test 28/0; work-tax-conversion-test 10 assertions passed; danina-podatek-nazwa-test 15/0; terminology-trade-vs-tax-test 799/0; zloto-szlak-test 48/0; zloto-test 45/0.

## BLOKADY
Brak. Otwarte: czy właściciel chce bramki "Mennica tylko w stolicy" (patrz Uwagi).

## RUNDY
1/5. Ostatni werdykt: brak (runda operatora).

## NASTĘPNY KROK
Evaluator: sprawdzić, że fixture (populacja 8) nie osłabia asercji H2e, oraz czy H2g jest właściwą negatywną. Opcjonalnie: decyzja właściciela o budowie Mennicy wyłącznie w stolicy.

## DEPLOY/PUSH: NIE WYKONANO
