STATUS: PASS
DOMAIN: GAME (komentarze i opisy w danych; BEZ zmiany zachowania)
TEMAT: R-WEB-DOC-WEARINESS-STALE-5PCT-20TURNS-COMMENTS-Q1
GOAL: usunąć stare opisy zmęczenia wojną („5%/turę”, „20 tur”, „tura 8”) zgodne z parametrami 2,5%/turę i pełne po 40 turach (war-weariness-params.json pelneTur=40, diplomacy-war-peace-params.json progSygnaluPokoju=0,4).
ZMIANY/COMMIT: baza ba2d59d17ceffb6c079ed6f9fedee9ee7a433696; commit z kodem i raportem = czubek gałęzi detached (SHA w polu sha wyniku). Zmienione pliki (tylko komentarze i opisy, 6 linii +/-6):
- gra/src/game/diplomacy-war-peace-profile.ts:306 — komentarz (e): 2,5%/turę, pełne po 40 turach, 0,4 = tura 16 bez strat (było: 5%/turę, tura 8).
- gra/data/diplomacy-war-peace-params.json:57 — pole _wzor: 2,5%/ture, pelne po 40 turach.
- gra/tools/peace-gate-military-strength-test.cjs:91 — komentarz: zmęczenie (2,5%/turę).
- gra/tools/diplo-weariness-20-turns-test.cjs nagłówek — opis zgodny z asercjami (0,5 w turze 20, 0,8 w turze 32, 1,0 w turze 40; pelneTur=40). Asercje bez zmian.
Przeszukano rg docs, gra/src, gra/data, gra/tools: poza powyższym brak starych opisów zmęczenia. docs/encyklopedia/pojecia/zmeczenie-wojna.md jest już poprawny.
TESTY (przed i po, wyniki identyczne):
- tsc --noEmit: exit 0 (przed i po).
- JSON diplomacy-war-peace-params.json bez _wzor/_opis: identyczny (JSON_EQUAL_NO_DESC=true).
- diplo-weariness-20-turns-test.cjs: 31 PASS / 0 FAIL.
- peace-gate-military-strength-test.cjs: 14 PASS / 0 FAIL.
- diplo-json-descriptions-sync-test.cjs: 46/46 OK.
- json-descriptions-sync-test.cjs: 19 PASS.
- logic-test: LOGIC OK 213/213; tech-tree-test: 20 pass 0 fail; research-test: ALL GREEN; unit-replace-test: 21/21; combat-test: All sanity checks passed. Wszystkie exit 0 przed i po.
BLOKADY: brak.
RUNDY: 1/5 (ostatni werdykt: brak).
NASTĘPNY KROK: Evaluator (diff tylko komentarze i opisy) → Final Control.
UWAGI-DLA-ORKIESTRATORA: (1) gra/node_modules zainstalowany w worktree przez `npm ci --ignore-scripts` (katalog ignorowany przez git, nie usunięty, bo brak uprawnień do rm); do sprzątania po tym temacie. (2) Nazwy plików testów i identyfikatory R-WEB-*-20-TURNS-Q1 zostawione celowo (to ID zadań, nie opis). (3) Pola maxTur=20 i bazaTur=15 w sekcji zmeczenie diplomacy-war-peace-params.json są nieużywane (opisane w _opis); osobny temat porządkowy, nie ruszane.
DEPLOY/PUSH: NIE WYKONANO
