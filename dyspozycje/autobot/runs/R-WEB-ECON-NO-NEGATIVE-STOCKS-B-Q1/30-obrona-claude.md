STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-B-Q1
GOAL: blokada „Zakończ turę” gracza przy prognozie skarbca/spichlerza < 0 (tury >= 11, tylko gdy istnieje ruch naprawczy) + komunikat; obrona wobec zarzutów Evaluatora r1.
ZMIANY-COMMIT: baza kandydata 28b6c4828 (Operator r1, na 507d312ce). Kod obrony: c35744c632bcf3cff98d1226a99b34a2df7384d3 (gra/src/main.ts, gra/tools/no-negative-stocks-endturn-test.cjs). Raport: ten plik (commit raportu w gałęzi obrony, SHA w polu sha zwrotki). Allowlista: brak zmian w hud.ts, bottomBarHud.ts, no-negative-stocks.ts, WERSJE.md, gra-robocza/, rust-port/.
TESTY (surowe wyniki, 2026-11-13, worktree wf_6f09e786-42a-3, gra/ z `npm ci --ignore-scripts`; bez build/dev):
- npx tsc --noEmit: exit 0 (bez flagi); npx tsc --noEmit --ignoreDeprecations 5.0: exit 0. Brak TS5101 w tym środowisku (rozbieżność z raportem Operatora odnotowana, zgodna z zarzutem 6 Evaluatora).
- node tools/no-negative-stocks-endturn-test.cjs: 19 passed, 0 failed (było 14/0; dodano wiring źródłowy i sprawdzenia dryfu).
- node tools/no-negative-stocks-projection-test.cjs: 49 passed, 0 failed (regresja A).
- node tools/no-negative-stocks-test.cjs: 25 passed, 0 failed.
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN; unit-replace-test: 21/21; combat-test: All sanity checks passed.
- DOWÓD MUTACYJNY (kolejno, każda przywracana z kopii `main.ts.good` w scratchpadzie, po mutacji plik przywrócony i test ponownie zielony 19/0):
  - M1 `if (nnsGateForPlayer().blokada) {` -> `if (false && nnsGateForPlayer().blokada) {` w canPlayerInitiateEndTurn: test CZERWONY, „FAIL: (f) canPlayerInitiateEndTurn: ... (nie wyłączone)”, 18 passed, 1 failed, exit 1.
  - M2 (zarzut 1 Evaluatora, prognoza w refresh) `skarbiecPo: skarbiecObecnyNns + _lastBogactwoRate` -> `skarbiecPo: 0`: test CZERWONY, „FAIL: (e) prognoza HUD: skarbiecPo = obecny + _lastBogactwoRate”, exit 1.
  - M2b (zarzut 4, żywe saldo w bramce) `skarbiecPo: skLive + (f.skarbiecPo - f.skarbiecObecny)` -> `skarbiecPo: 0`: test CZERWONY, „FAIL: (f) nnsGateForPlayer: saldo żywe + delta prognozy”, exit 1.
- Chromium / zrzut zablokowanego przycisku / mutacja w żywej grze: NIE_ZMIERZONO (gra wymaga dev/build, zakazanego w gra/; /usr/bin/chromium istnieje, ale bez uruchomionego serwisu gry nie wykonano).
- end-turn-modal-sequencing-test: NIE ponownie uruchomiony w tej rundzie; Evaluator podał 40/1 identycznie na bazie 507d312ce ([A5] launchSiegeStormFromMap) — dług bazowy.
- end-turn-gameplay-runtime-test, end-turn-input-stability-test: NIE_ZMIERZONO (wymagają działającego dev-serwera/przeglądarki).

ODPOWIEDZI NA ZARZUTY EVALUATORA r1:

Zarzut 1 (brak dowodu mutacyjnego i wiringu; test (e) tautologia): PRZYJMUJĘ.
  Poprawka: test (f) sprawdza treść funkcji (wyciętą licznikiem klamer) — w canPlayerInitiateEndTurn warunek `if (nnsGateForPlayer().blokada) { ...; return false; }`, w hintEndTurnBlocked gałąź `nnsHint.blokada` z `showHintMessage(nnsHint.komunikat ...)`, w nnsGateForPlayer żywe saldo. Test (e) sprawdza wzorzec prognozy HUD (`skarbiecPo: skarbiecObecnyNns + _lastBogactwoRate`, `_lastBogactwoRate = playerEcon.pieniadz - bogactwoUpkeepPreview.utrzymanieRazem`) oraz realny tick (`hState.skarbiec += hEcon.pieniadz;`, `hState.skarbiec -= hBalance.utrzymanieRazem;`, `_lastBogactwoRate = hEcon.pieniadz - (hBalance?.utrzymanieRazem ?? 0);`) — tę samą arytmetykę, nie wywołanie bloku. Dowód: M1, M2, M2b czerwienią test (sekcja TESTY). Zastrzeżenie: to nadal testy źródłowe (wzorce w kodzie), nie runtime; Operator nie ma testu wywołania bloku „Bank treasury” w działającej grze.

Zarzut 2 (dźwignie: bramka liczy tylko rozwiązanie jednostek, bez podatków i kolejki): ODRZUCAM wprowadzenie podatków do bramki w tej rundzie; PRZYJMUJĘ fakt niezgodności z dispatchem.
  Dowód: decideEndTurnGate (gra/src/game/no-negative-stocks.ts) buduje dźwignie wyłącznie `rozwiaz-skarbiec` i `rozwiaz-spichlerz`. W no-negative-stocks.ts nie istnieje żadna projekcja podatków ani wycofania z kolejki (grep `podatk` trafia tylko w komentarze i komunikat). Podatek nie ma wiarygodnej wartości zysku w module, a jej wyliczenie wymagałoby zmian w logice podatków poza allowlistą tematu (main.ts tylko canPlayerInitiateEndTurn i komunikat). Skutek: bramka jest węższa niż dispatch (gracz bez jednostek z deficytem pokrywalnym samymi podatkami NIE jest blokowany). Kierunek jest bezpieczny (brak zakleszczenia). Zmiana prognozy po podatkach działa: gdy gracz podniesie podatki, _lastBogactwoRate i tym samym prognoza się zmieniają, więc blokada zniknie. ZAŁOŻENIE dla FC: ograniczenie zostaje do decyzji FC/orkiestratora (rozszerzenie wymaga projekcji podatków i kolejki jako osobnego tematu).

Zarzut 3 (HUD: brak stałego tekstu/tooltipu na przycisku; hud.ts, bottomBarHud.ts bez zmian): ODRZUCAM jako brak wymogu dispatchu; zrzut NIE_ZMIERZONO.
  Dowód: dispatch GOAL B mówi „przycisk/podpowiedź pokazuje po polsku czego brakuje” — alternatywa. Podpowiedź istnieje: hintEndTurnBlocked wywołuje `showHintMessage(nnsHint.komunikat, 6000)` przy blokadzie (main.ts, funkcja hintEndTurnBlocked). Kryterium (d) wymaga zrzutu w Chromium, którego nie wykonano — NIE_ZMIERZONO. Stały tooltip nie został wdrożony; to ZAŁOŻENIE dla FC.

Zarzut 4 (cache prognozy nieświeży: grantGold/transfer bez markCityStateDirty): PRZYJMUJĘ.
  Poprawka: nnsGateForPlayer (main.ts) czyta saldo skarbca i spichlerza NA ŻYWO (playerStateByHuman.get(ME())?.skarbiec, empireFoodStates.get(ME())?.zapasyPanstwa) i dokłada z cache tylko deltę netto prognozy (skarbiecPo − skarbiecObecny, spichlerzPo − spichlerzObecny). Delta zależy wyłącznie od ekonomii (dirty-gated), więc zmiana salda bez markCityStateDirty już nie daje starego salda. Dowód: M2b czerwieni test (f); tsc 0; regresja 19/0. Live-test (grantGold z wioski) NIE_ZMIERZONO.

Zarzut 5 (zakres prognozy: bez zakupów/rekrutacji z kolejki, spichlerz z podglądu HUD; koszt klonowania NIE_ZMIERZONO): ZAŁOŻENIE, bez zmiany kodu.
  Prognoza jest celowo bez zakupów z kolejki (zgodnie z nagłówkiem modułu). Skutek: prognoza bywa optymistyczna → bramka może nie zablokować przy zakupach z kolejki (niedoszacowanie blokady, nie zakleszczenie). Spichlerz z econ podglądu HUD (nie po autoracjach) — rozjazd możliwy, NIE_ZMIERZONO. Koszt projectEmpireFoodAfterTick (klon stanów właścicieli) przy refresh NIE_ZMIERZONO (brak pomiaru czasu w tej rundzie). Brak testu zgodności z realnym tickiem — dług dla FC.

Zarzut 6 (brak runtime end-turn i Chromium; rozbieżność TS5101): PRZYJMUJĘ jako stan faktyczny, bez poprawki.
  Testy runtime i Chromium NIE_ZMIERZONO (sekcja TESTY). tsc w tym środowisku daje exit 0 bez flagi i z --ignoreDeprecations 5.0; rozbieżność z TS5101 z raportu Operatora nie została odtworzona.

BLOKADY:
- Brak żywego dowodu w grze (Chromium/zrzut/mutacja w grze, testy runtime end-turn) — NIE_ZMIERZONO.
- Zarzut 2 (podatki i kolejka nie są dźwigniami bramki) — ODSTĘPSTWO od dispatchu, do decyzji FC.

RUNDY: 2/5 (Obrona r1 na kandydacie 28b6c4828).
NASTĘPNY KROK: Evaluator r2 (Sonnet): zweryfikować M1/M2/M2b na c35744c63 i decyzję o zarzucie 2 (ODSTĘPSTWO) oraz 3 (brak stałego tooltipu); Final Control rozstrzyga ZAŁOŻENIA 2, 3, 5 i brak live-dowodu.
UWAGI-DLA-ORKIESTRATORA:
- Gałąź obrony: obrona-nns-b-q1-r1 (lokalnie w worktree wf_6f09e786-42a-3), nie wypchnięto (zakaz push).
- Dług do rejestru (nie w tym temacie): test sim `end-turn-modal-sequencing-test` 40/1 [A5] — dług bazowy, nie wynik tego tematu.
- Zgłoszenie poza zakresem: tsc bez flagi u Evaluatora i tu daje exit 0; TS5101 z raportu Operatora wymaga sprawdzenia konfiguracji środowiska.
DEPLOY/PUSH: NIE WYKONANO
