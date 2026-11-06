STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (Obrona R2, seria 2/5)
GOAL: Odpowiedz na zarzuty FC/Evaluatora do raportu Operatora da31331af; poprawki tam, gdzie to możliwe bez zmiany reguł i determinizmu AI.
ZMIANY/COMMIT: odtworzony stan Operatora da31331af. Kod obrony: ef9a7af76aa27a6f6fbd4e6a60dbbb708348253d (smallPartLod.ts, units.ts, cities.ts: domyślny minPx 2 -> 3; 10 logów gate-r6-* z EXIT=NIE_ZAPISANO; 01-operator-r1.md skrócony z 669 do 475 słów). Allowlista czysta: gra/src/render/{smallPartLod,units,cities}.ts, runs/<ID>/**. Zero zmian w gra/data, WERSJE.md, rust-port, src-tauri, gra-robocza. git diff --check czysty; tsc --noEmit EXIT=0 (po korekcie). node_modules usunięte po pracy. PUSH NIE.

ODPOWIEDZI NA ZARZUTY:
Z1 (cel 5x nie osiągnięty: buildHudState 4,7x, endTurn 3,3x, wybór jednostki 4,5x): PRZYJMUJĘ jako notatkę. Dowód: pomiary w 01-operator-r1.md (buildHudState 49,8 -> 10,7 ms; endTurn JS 16,5 -> 5,2 s). Poprawa nie wykonana w tej rundzie: wymaga profilu runAiPhase/pickResourceTradeRelOffer i nowej serii pomiarów przy load ~10.
Z2 (n < 7 dla endTurn, wyboru jednostki, panelu miasta): PRZYJMUJĘ. Dowód: raport Operatora (endTurn n=2, wybór jednostki n=2 skuteczne, panel 1 z 7). Nie uzupełniono pomiarów.
Z3 (NIE_ZMIERZONO: PRZED ruchu i panelu miasta, osobny profil runAiPhase i pickResourceTradeRelOffer, tabela panel/ruch): PRZYJMUJĘ. Dowód: sekcja NIE_ZMIERZONO w 01-operator-r1.md (po skróceniu). Braków nie uzupełniono w tej rundzie.
Z4 (LOD: zrzuty 3 px i ocena wizualna nie wykonane; próg 2 px bez dowodu): PRZYJMUJĘ i NAPRAWIAM część. Próg 2 px był niezgodny z dispatchem R5 (h), który dopuszczał obniżenie tylko przy widocznym znikaniu drobnych części. Domyślny próg przywrócono do 3 px w ef9a7af76 (3 wywołania: smallPartLod.ts, units.ts, cities.ts). Dowód: small-part-lod-test 24 PASS / 0 FAIL po zmianie; tsc EXIT=0. Zrzutów 3 px i oceny wizualnej nadal brak: NIE_ZMIERZONO, otwarte. Draw calle przy 3 px: 28 881 -> 5 255 (wynik R4, nieponowiony).
Z5 (punkt 6 dispatchu niedomknięty: river-path-adjacency, hotseat-etap6e-render-noop, oboz-lowiecki-las-znika-render, player-moves-before-ai-turn): PRZYJMUJĘ. Dowód: wyniki timeout w raporcie, sekcja NIE_ZMIERZONO. hud-tooltip-body-mounted-panels: EXIT=0 (evidence/gate-r6-hud-tooltip-body-mounted-panels-test.txt). Nie ma dowodu braku regresji w czterech testach render/live.
Z6 (higiena: logi bez EXIT=, raport 669 słów > 600): PRZYJMUJĘ i NAPRAWIAM. Dowód: 10 logów gate-r6-* bez kodu wyjścia dostało linię EXIT=NIE_ZAPISANO z opisem (bez fabrykowania kodu wyjścia; JSON-y pomiarowe nie były ponownie uruchamiane). Raport: wc -w = 475 (limit 600). Commit ef9a7af76.
Z7 (ryzyko: klucz map.hexes zakłada niezmienność zbioru heksów; hudPureScope zakłada brak mutacji stanu): PRZYJMUJĘ jako notatkę ryzyka, bez zmiany kodu. Sprawdzono pickResourceTradeRelOfferRaw (gra/src/main.ts ok. linii 21770): w treści są deklaracje const i wywołania pickResourceDeficitForOwnerPair, bez przypisań do stanu gry w samym ciele. Pełnej czystości pickResourceDeficitForOwnerPair nie weryfikowano w tej rundzie. Zarzut o niewymuszeniu niezmienności kluczy testem: przyjęty jako otwarty; komentarz w kodzie dokumentuje założenie.

WERDYKT OBRONY: 2 zarzuty naprawione w commicie (Z4 częściowo, Z6), 5 przyjętych jako notatki (Z1, Z2, Z3, Z5, Z7). Zarzut Z4 o zrzutach LOD pozostaje NIE_ZMIERZONO.
RUNDY: 2/5 nowej serii (obrona tej serii)
NASTĘPNY KROK: Evaluator (R2) -> Final Control z tym samym ID. Priorytety bez zmian: endTurn (runAiPhase, pickResourceTradeRelOffer), zrzuty LOD 3 px, pomiar PRZED panelu/ruchu.
DEPLOY/PUSH: NIE WYKONANO
