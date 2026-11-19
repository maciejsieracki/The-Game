STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-CITY-FOUNDING-NO-FORT-TAKEOVER-Q1
GOAL: zalozenie miasta NIE przejmuje cudzych fortow/posterunkow ani ich ulepszen (R0); spor fort/miasto = territoryOwnerAt (R1); zdobycie fortu tylko silowo w wojnie (R2).
ZMIANY/COMMIT: gra/src/game/fort-territory.ts (applyFortTakeoverOnCityFounded: usunieta galaz przejecia, zostaje F1); gra/src/main.ts (tylko komentarz applyFortTakeoverAndEvacuation); gra/tools/fort-strazniaca-zasieg-zakladania-test.cjs (asercje A4/A4b/E1 odwrocone, patrz nizej); gra/tools/city-founding-no-fort-takeover-test.cjs (NOWY, 21 asercji). Commit: SHA w polu sha orkiestratora.
TESTY:
- city-founding-no-fort-takeover-test.cjs: 21 passed, 0 failed
- fort-strazniaca-zasieg-zakladania-test.cjs: 82 passed, 0 failed
- fort-outpost-hard-territory-test.cjs: 80 passed, 0 failed
- tsc --noEmit: exit 0
- logic-test: ostatnia asercja [213] PASS, exit 0
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: 6 PASS (All sanity checks passed)
- Mutacja w produkcji (przywrocenie galezi przejecia w zywym kodzie): NIE ZMIERZONO. Mutacja w tescie R0-M1 odtwarza stara regule lokalnie (dowod, ze stara regula daje przejecie), nie jest mutacja kodu produkcyjnego.
- Dowod w zywym Chromium (przed/po, scenariusz R2 pokoj vs wojna): NIE ZMIERZONO (brak bundla vite i uruchomienia przegladarki w tym przebiegu).

ZMIENIONE ASERCJE (odwrocona regula 4, decyzja wlasciciela 2026-11-19):
- A4a: bylo 1 przejecie -> jest 0 zdarzen (cudzy posterunek w zasiegu nie przechodzi).
- A4e: bylo ownerId=2 -> jest ownerId=1 (zostaje u wlasciciela).
- A4f: bylo contestedUseless=false po przejeciu -> jest true (brak resetu).
- A4g/A4h: bez zmian semantyki (poza zasiegiem; brak zniknietego wezla poza hexem miasta).
- A4b-rival-1: zdarzenie generowane tylko przez F1 (fort fizycznie znika z hexu miasta).
- A4b-mixed-1/-4: 1 zdarzenie zamiast 2; sasiedni fort zostaje ownerId=1 zamiast 2.
- E1 (ewakuacja): scenariusz przeniesiony z miasta w zasiegu (odl. 5) na hex fortu (galaz F1); oczekiwane: fort usuniety z rejestru zamiast przepisanego. Asercje ewakuacji (E2, E3, E4) bez zmian.
Pozostale asercje nie oslabione.

ANALIZA R2 — ścieżki zmiany ownerId fortu/posterunku (stan po zmianie):
| sciezka | warunek | zgodna z R2? |
| applyFortTakeoverOnCityFounded (zakladanie miasta) | galaz przejecia usunieta; zostaje F1 (wezel na hexie miasta znika, nie przepisywany) | tak (nie zmienia ownerId innego wlasciciela) |
| applyFortCaptureByOccupation przez sweepFortCaptures | wojna (areEnemyOwners = status 'wojna'; barbarzynca nie atakuje), jednostka !isCivilianUnit, brak jednostki wlasciciela na hexie | tak — jedyna droga zmiany wlasciciela przez gre |
| isHexReservedByRivalFort (budowa fortu) | ustawia contestedUseless, NIE zmienia ownerId | nie dotyczy |
| ewakuacja (findEvacuationHexOutsideCity) | przesuwa jednostki, NIE zmienia ownerId fortu | nie dotyczy |
| traktat/pokoj z cesja fortu | NIE ZMIERZONO — nie wykazano pozycji cesji fortu w tym przebiegu | NIE ZMIERZONO |
| wczytanie zapisu | stare zapisy z juz przejetymi fortami NIE sa naprawiane wstecz | luka swiadoma |
Luka R2 (brak zdobycia silowego): NIE — zdobycie przez wejscie wojska w wojnie juz istnieje (sweepFortCaptures, wolany po ruchu/bitwie/koncu tury). Nie dodano nowych blokad: nie znaleziono innej drogi zmiany ownerId fortu w tym przebiegu (poza pozycja cesji — NIE ZMIERZONO).

R1 — tabela miasto vs fort (z kodu, nie zmieniano):
| regula | miasto | fort/posterunek |
| sporny heks | territoryOwnerAt, miasto przed fortem | to samo (fort-fort: wczesniejszy wygrywa) |
| zakladanie miasta w cudzym terytorium fortu | blokowane (isHexInForeignFortTerritory) | n/d |
| zakladanie fortu w cudzym terytorium | n/d | brak blokady, tylko kontestacja (contestedUseless) |
| lokalizacja | wg canFoundCity | posterunek: isOutpostPlacementAllowed (wlasne, przy granicy); fort: gdziekolwiek (decyzja 2026-11-03) |
Roznice posterunek/fort celowe wg wczesniejszych decyzji — NIE ujednolicono. DECISION_REQUIRED dla wlasciciela: czy fort ma miec ograniczenie lokalizacji jak posterunek/miasto.

WPLYW NA WYSCIG AI (FALA 868): zmiana usuwa przejecia fortow przez miasta; forty AI nie maja juz tej drogi do zdobycia terenu. NIE ZMIERZONO na pomiarze (ai-territory-race-params.json nie uruchomiono).

BLOKADY: dowod Chromium NIE ZMIERZONO; R1 ujednolicenie lokalizacji fortu — decyzja wlasciciela; cesja fortu w pokoju — NIE ZMIERZONO.
RUNDY: 1/5
NASTEPNY KROK: Evaluator: przeglad diffu i testow; osobny temat dowodu w Chromium (scenariusz pokoj vs wojna); decyzja wlasciciela o lokalizacji fortu.
UWAGI-DLA-ORKIESTRATORA: pliki .city-nofort-*-bundle/entry powstaja w gra/tools i sa ignorowane przez git (zgodnie z istniejacym wzorcem .fort-*).
DEPLOY/PUSH: NIE WYKONANO
