STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-STARVATION-DURATION-REGRESS-Q1
GOAL: Oblezenie miasta z jednostka w srodku ma trwac: ~2 tury zapasow + glod garnizonu (6/8/10% HP/ture) do sumaHP < 50%; plakietka == faktyczne poddanie.
ZMIANY/COMMIT: SHA w sekcji na dole (commit raportu). Pliki: gra/src/game/siege-starvation.ts (nowe `siegeDefenderUnits`), gra/src/main.ts (blok N3 + `siegeSurrenderBadgeFor`), gra/tools/siege-starvation-duration-test.cjs (NOWY), gra/tools/siege-starvation-test.cjs (2 asercje strukturalne zsynchronizowane).
TESTY: patrz nizej.
BLOKADY: brak. NOTE: diagnoza statyczna + symulacja na realnych modulach (brak uruchamialnego harnessu pelnej gry; git bisect z testem scenariusza niewykonalny na main.ts). Weryfikacja na zywo w przegladarce NIE ZMIERZONO.
RUNDY: 1/5
NASTEPNY KROK: Evaluator -> Final Control (z wieloma scenariuszami na zywo: gracz oblega AI z nieufortyfikowanym obronca).
DEPLOY/PUSH: NIE WYKONANO

## Przyczyna (plik:linia)
Obroncy obleganego miasta byli liczeni WYLACZNIE jako jednostki z `inGarnizon === true` (Ufort. = "ukryty garnizon"):
- gra/src/main.ts blok N3 (`realGarnizonUnits`, ok. l. 37200) -- atrycja glodu i decyzja o poddaniu,
- gra/src/main.ts `siegeSurrenderBadgeFor` (ok. l. 16748) -- prognoza plakietki.
Jednostka stojaca w miescie bez fortyfikacji (albo zbudzona z garnizonu wypadem obleganej armii AI, `exitGarnizon` w l. ~17311, R-WEB-SIEGE-SORTIE-ANY-TURN-Q1) NIE liczyla sie -> `siegeStarvationState` widzial garnizon = 0 -> sciezka historyczna "bez garnizonu" (flaga `siegeCapitulationPending` + nastepny tick) -> poddanie ok. 2 tury po zerze zapasow, plakietka "poddanie za 2 tury" (`turnsUntilSiegeSurrender`, zwraca 2 gdy garnizon 0 i zapasy 0).

Sprawdzone i WYKLUCZONE jako sprawca:
- FALA 552 CSFOOD (183fd5d19): blok N3 rownowazny 7c23ea90a, tylko ulamek wg trudnosci wlasciciela; dane econ-params 6/8/10 poprawne.
- R_STAWKI_FALA1_FALA2_MULT x4: dotyczy utrzymania zlota i zywnosci armii (economy-upkeep.ts:979/1076), NIE zuzycia magazynu w oblezeniu (turn-economy.ts: magazyn -= ludnosc + garnizon) ani ulamka HP. Dlug 29/10 w glod-wojska-karencja-test (#112) jest odrebny i niezmieniony.
- turn-economy.ts (oblegane), siege-starvation.ts, siege-surrender-forecast.ts: logika bez zmian od 7c23ea90a; zadna zmiana `inGarnizon` w src od 7c23ea90a (git log -G).
Wniosek: to NIE regres jednego commitu, tylko luka definicji "garnizon" ujawniona przez gre (nieufortyfikowana jednostka w miescie / wypad AI). Bisect commitow: NIE ZMIERZONO (brak harnessu).

## Poprawka
`siegeDefenderUnits(units, city, isCivilian)`: obroncy = kazda wojskowa zywa jednostka wlasciciela miasta na heksie miasta, niezaleznie od `inGarnizon`. Uzyte w N3 i w plakietce (ten sam zbior). Progi 6/8/10%, <50%, etap zapasow: BEZ ZMIAN. Zuzycie zapasow nadal wg `city.garnizon` (turn-economy.ts, bez zmian).

## Wyniki (scenariusz: 3 jednostki, ludnosc 5, zapasy 10; replika N3 na realnych modulach)
| jednostki | trudnosc | zapasy | glod | poddanie w turze | prognoza plakietki |
|---|---|---|---|---|---|
| BEZ flagi, PRZED poprawka | wszystkie | - | - | 3 (garnizon=0 -> sciezka historyczna) | 3 |
| bez flagi, PO poprawce | latwy 6% | 2 | 9 | 11 | 11 |
| bez flagi, PO | normalny 8% | 2 | 7 | 9 | 9 |
| bez flagi, PO | trudny 10% | 2 | 6 | 8 | 8 |
| ufortyfikowane (bez zmian) | 6/8/10% | 2 | 9/7/6 | 11/9/8 | 11/9/8 |
(k ticków glodu = floor(0,5/frac)+1; pierwszy tick zera zapasow tylko zapisuje start.) Gracz (owner 0), AI (3), panstwo-miasto (9): >= 7 tur, prognoza == faktyczne (+-0). Miasto bez zadnej jednostki: nadal 2 tury (sciezka historyczna).

## Testy
- NOWY siege-starvation-duration-test.cjs: 27/27 OK; RED po cofnieciu poprawki: 10 FAIL (pass=16).
- siege-starvation-test 54/0 (po zsynchronizowaniu 2 asercji strukturalnych: import + hpFrac wg wlasciciela -- pierwsza byla nieaktualna od CSFOOD, FAIL juz na origin/main), siege-surrender-forecast 57/0, siege-defenders 12/0, siege-ai 17/0, siege-last-stand-sortie OK, siege-surrender-enter-city 71/0, siege-blockade-no-recruit-reinforce 32/0, oblezenie 27/0, oblezenie-remis-endsiege 271/0, oblezenie-siege-lifted-po-bitwie 16/0.
- logic-test 213/213, ai-test 289/0, tsc 0, citystate-army-food-difficulty OK, army-hunger-combat 13/0, empire-food-b5 34/0.
- glod-wojska-karencja-test 29/10 -- ISTNIEJACY dlug (#112, mnoznik x1 vs x4), niezwiazany; bez zmian.
