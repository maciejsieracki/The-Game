# R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1
GOAL: AI atakuje oblegajacych swoje miasto, gdy ma przewage >= 20% w zasiegu (priorytet przed ofensywa).
ZMIANY-COMMIT: kod 6bfac73267d9816d0037e4149a1b209396ac1eab (ai.ts, ai-siege-relief.ts, ai-params.json, testy). Ten raport: commit-czubek gałęzi (SHA w polu sha wyniku Operatora).

## Reprodukcja (przed poprawka)
Skrypt gra/tools/ai-siege-relief-repro.cjs: miasto AI (4,10), oblegajacy wrog (5,10),(5,11), armia AI 10 jednostek.
- Armia q=2, oblegane=false: 0 atakow; rozkazy move a2->(4,10), a3/a7->(4,11), reszta ->(2,11).
- Ta sama armia, oblegane=true: rozkazy IDENTYCZNE (flaga nie wplywa na zadna komende).
- Armia q=8: identyczne przy obu flagach; armia odchodzi na (8,11) i (6,10) (ofensywa na miasto b1).
- Armia q=6 (sasiaduje): atak juz dzisiaj; to nie jest objaw.
Przyczyna: ZMIERZONO — ai.ts nie czyta `oblegane` (0 trafien przed zmiana) i nie ma reguly odsieczy. Dlaczego nakladka obrony domu nie atakuje w tych scenariuszach: NIE_ZMIERZONO.

## Poprawka
- gra/src/game/ai-siege-relief.ts (planer, czysty): cel = wrogie jednostki na heksie miasta i w pierscieniu, w wojnie i kontakcie; sila wlasna = jednostki w zasiegu ruchu, bez garnizonu i zablokowanych; warunek ratio >= 1 + minAdvantage; jedna grupa na ture (najlepsze ratio).
- gra/src/game/ai.ts: applySiegeRelief jako ostatnie slowo nad ruchami tury: atak gdy przylega, inaczej krok do wolnego heksu przy oblegajacym (nie heks miasta).
- gra/data/ai-params.json: siege_relief_min_advantage = 0,2. Stala w kodzie to tylko fallback.
- Gracz, zasady bitwy, balans jednostek: bez zmian.

## Testy (na kodzie 6bfac7326)
- tsc --noEmit: exit 0, 0 bledow.
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test: all sanity checks passed.
- Nowy gra/tools/ai-siege-relief-test.cjs: 12 OK / 0 FAIL: (a) ratio >= 1,2 zmienia rozkazy; (b) 2 vs 2 identyczne z brakiem oblezenia; (c) rozejm bez ataku; (d) dwa miasta -> jedna grupa; (e) prog 1000 wylacza, 0,2 wlacza, JSON = 0,2; (f) determinizm; (g) symulacja 4 tury: zdjecie oblezenia PRZED tura 4, PO tura 3.
- Istniejace testy AI/oblezen bez regresji (bez zmiany asercji): ai-war-defend-home 30/0; army-concentration 56/0; siege-ai 17/0; siege-last-stand-sortie 71/0; ai-war-army-seeks-army 22/0; ai-home-defense-civilian-filter 8/0; ai-home-defense-vs-barbarians 46/0; ai-war-city-garrison 20/0; ai-siege-requires-war 49/0; ai-war-gate 24/0.

## Ograniczenia / NIE_ZMIERZONO
- Mutacja: zamiast kopii z usunietym kodem uzyto progu 1000 (overlay nie dziala); czerwien PRZED w (a), (e), (g).
- Zywa gra w Chromium (zrzut PRZED/PO): NIE_ZMIERZONO.
- Panstwa-miasta: NIE_ZMIERZONO (ta sama decideAITurn, bez osobnego testu).
- Efekt (g) jest w symulatorze, nie w grze.
- Znane ograniczenie: krok odsieczy moze przechodzic przez wlasne miasto jako punkt posredni (firstStep).
- Nie ruszano: gra/src/main.ts, gra-robocza, gra-kanon, WERSJE.md, manifest, rust-port.

BLOKADY: brak.
RUNDY: 1/5; ostatni werdykt: brak (Operator).
NASTEPNY KROK: Evaluator — przeglad planera i testow (a)-(g); decyzja o zywej weryfikacji w przegladarce przed Final Control.
DEPLOY-PUSH: NIE WYKONANO
