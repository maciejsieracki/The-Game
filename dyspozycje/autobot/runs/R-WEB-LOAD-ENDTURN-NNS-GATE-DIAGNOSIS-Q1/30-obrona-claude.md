# R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1 — obrona Operatora (runda 3, odpowiedź na zarzuty Evaluatora r2)

STATUS: PASS-WITH-NOTES (obrona; wszystkie 4 zarzuty przyjęte, dwa z poprawką i dowodem; diagnoza domknięta w zakresie zadanego pytania, z jawnymi NIE USTALONO przy kolejności wywołań)
DOMAIN: GAME (bramka „Zakończ turę” NNS, tylko diagnoza; zero zmian w `gra/src`, `gra/data`)
TEMAT: R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1
BAZA: `0be818b13f5a0d1b4e5a0219e7c66cd26693e41b` (kandydat r2 Operatora; baza dispatchu `85e190d125b528f364c0762e9e1e61651d5f66ac`). Ta obrona: commit po `0be818b13` (SHA końcowy w polu `sha` odpowiedzi).
GOAL: rozstrzygnąć, czy wczytanie zapisu jest realnym defektem bramki NNS, wyjaśnić brak prognozy w świeżej turze 1, dostarczyć tabelę ≥3 zapisów (z pomiarem po wczytaniu i bez), odpowiedzieć na każdy zarzut Evaluatora.

## ODPOWIEDZI NA ZARZUTY (PRZYJMUJĘ / ODRZUCAM, z dowodem)

**Zarzut 1 (wiersz C nie zmierzony; uzasadnienie „brak haka” fałszywe) — PRZYJMUJĘ.**
Hak istnieje: `gra/src/main.ts:30478` (`__cityCessionTestDebug.foundExtraCityForTest(ownerId)`, używa `foundCityAt` + `finalizeCityFounding`). Wykorzystany w r3 w dwóch niezależnych podejściach:
- (a) NOWA gra `newgame` + `foundExtraCityForTest` (wiersz B2 i C, poniżej);
- (b) `?playtest=mapa` + `foundExtraCityForTest` (łańcuch przyczynowy, poniżej).
Wiersz C zmierzony: seed 777, 3 miasta gracza, tura 20 (`evidence/r3-C-play.json`, `evidence/r3-C-load.json`).

**Zarzut 2 (wiersz B: 1 miasto i dosypka 200/200 w t1) — PRZYJMUJĘ.**
Nowy wiersz B2: seed 4242, 2 miasta gracza (`city`, `city2`), tura 20, ZERO interwencji (`log` w `evidence/r3-B2-play.json`: 19 endTurnów, `blokadaPrzed=false` przy każdym, `interwencja=null`). Wiersz B z r2 (1 miasto, dosypka) zostaje w historii i NIE jest używany jako dowód.

**Zarzut 3 (zadanie 1: przyczyna braku prognozy w świeżej t1 niedomknięta; teza „w oknie nie ma updateHud()” niedokładna) — PRZYJMUJĘ, z poprawką tezy i pomiarem.**
- Korekta: `updateHud()` jest wywoływane w `main.ts:49064`, zaraz po pętli `cities.push` (`main.ts:48994–48998`). Nie czyści flagi `empireEconDirty`; wniosek r2 był błędny w tym punkcie.
- Pomiar łańcucha przyczynowego (`evidence/r3-chain-mapa.json`, `?playtest=mapa`, seed 4242): tura 1, 1 miasto → `prognoza: null`, `bramkaBlokuje: false` (skarbiec 5000, spichlerz 0). Po `foundExtraCityForTest` (miasto `city2`, 2 miasta) → `prognoza: {skarbiecPo: 4909, spichlerzPo: -48}`, `bramkaBlokuje: true`. Zdarzenie założenia miasta (realny wzorzec `finalizeCityFounding` → `markCityStateDirty`, `main.ts:17118`) przywraca prognozę bez żadnego nowego haka.
- Logika kodu z numerami linii (sprawdzona w `gra/src/main.ts`):
  - `refreshLiveEmpireRates` (23068): ustawia `empireEconDirty = false` PRZED `refreshLiveEmpireRatesUnsafe()`;
  - `refreshLiveEmpireRatesUnsafe` (23083–23090): przy `playerCities.length === 0` ustawia `_nnsHumanForecast = null` i wraca BEZ ustawienia dirty;
  - `nnsGateForPlayer` (41048–41050) i `nnsEndTurnTooltipText` (41086) wołają refresh (dirty-gated).
  - Preset `playtest=mapa` (48994–48998) dokłada miasta bez `markCityStateDirty`.
- Wniosek z pomiaru: przy 1 mieście gracza forecast = null to możliwe TYLKO wtedy, gdy flaga była już `false` (inaczej Unsafe przeliczyłby prognozę dla 1 miasta). Flaga została wyzerowana przez wywołanie refresh przy 0 miastach, a potem nie było dirty. Ścieżka ta występuje wyłącznie w presecie testowym.
- NIE USTALONO: dokładne wywołanie, które wyzerowało flagę przy 0 miastach (nie instrumentowano kolejności wywołań; brak haka). Prześledzone ścieżki: `refreshLiveEmpireRates` 23068–23080; `Unsafe` 23083–23090; `nnsGateForPlayer` 41048–41050; `nnsEndTurnTooltipText` 41086; `updateHud` 49064 (nie czyści flagi). Kandydat do wskazania: aktualizacja HUD podczas budowy świata przed pushem miast presetu.
- Newgame: NIE MA problemu. Założenie pierwszego miasta w `tryFoundPlayerCityAt` → `finalizeCityFounding` → `markCityStateDirty` (17118), więc t1 newgame ma prognozę: seed 4242, 1 miasto: `skarbiecPo -2, spichlerzPo -4` (`evidence/r2-B-newgame-play-do-tury20.json` → `t1_start`); seed 777, 3 miasta: `skarbiecPo 1, spichlerzPo -4` (`evidence/r3-C-play.json` → `t1`). Obie wartości są nie-null.

**Zarzut 4 (test H1 z DODATKU 1 niewykonany; zarzut o kolejności odczytu hooka `nnsDiag`) — PRZYJMUJĘ.**
- Hook `nnsDiag` (`main.ts:31187–31192`) czyta `forecast: _nnsHumanForecast` PRZED `nnsGateForPlayer()` w tym samym literale. Pierwsze wywołanie może więc zwrócić nieprzeliczony cache.
- Konsekwencja: wartości `prognoza null` z pojedynczego odczytu (w tym E0/E2a/E3b w `evidence/r2-A-repro-playtest-tura1.json`) NIE są dowodem stanu gry i je odrzucam jako dowód. Pole `bramkaBlokuje` pochodzi z osobnego wywołania `nnsGateForPlayer()` i jest wiarygodne.
- W r3 KAŻDA wartość w tabeli pochodzi z DRUGIEGO wywołania `nnsDiag` (funkcja `odczyt` w `gra/tools/nns-gate-r3-measure.cjs`).
- Test H1 w formie DODATKU 1 (bez/po wymuszonym przeliczeniu) — NIE WYKONANO: wymagałby haka `markCityStateDirty()`/`refreshLiveEmpireRates()` w civTest (zmiana src poza allowlistą). Zastąpiony pomiarem łańcucha przez istniejące zdarzenie `foundExtraCityForTest` (zob. zarzut 3), który wykazuje to samo zjawisko (forecast null → −48 po dirty) bez zmiany src.

## TABELA ZAPISÓW (wartości z drugiego odczytu `nnsDiag`; surowe JSON w `evidence/`)

| Zapis | Tura | „Zakończ turę” po wczytaniu | Warunek blokady i liczby | To samo bez wczytania (ta sama sesja) |
|---|---|---|---|---|
| A1: `playtest=mapa`, 1 miasto, przed zdarzeniem | 1 | n/d (bez wczytania) | bramka wolna, `prognoza null`, skarbiec 5000, spichlerz 0 | `prognoza null` (stale cache, zob. zarzut 3) |
| A2: `playtest=mapa`, po `foundExtraCityForTest` (2 miasta) | 1 | NIE (`endTurn` 1→1, `przeszedl=false`) | `bramkaBlokuje=true`; `spichlerzPo -48`, `skarbiecPo 4909` | to samo: blokada, `t2_po_endTurn` tura nadal 1 |
| A z r2 (wczytanie w tej samej / nowej stronie) | 1 | NIE (endTurn 1→1) | `spichlerzPo -48`; wartości z pierwszego odczytu odrzucone (zarzut 4), gate z osobnego wywołania | świeża strona przed wczytaniem: bramka wolna |
| B2: newgame seed 4242, 2 miasta, zero interwencji | 20 | TAK (endTurn 20→21, `przeszedl=true`); bramka wolna | po wczytaniu: `skarbiec 151, spichlerz 25, prognoza skarbiecPo 161 / spichlerzPo 26` | bez wczytania (ta sama sesja): identycznie `skarbiec 151, spichlerz 25, skarbiecPo 161 / spichlerzPo 26` |
| C: newgame seed 777, 3 miasta, zero interwencji | 20 | TAK (endTurn 20→21); bramka wolna | po wczytaniu: `skarbiec 167, spichlerz 45, skarbiecPo 179 / spichlerzPo 50` | bez wczytania: identycznie `skarbiec 167, spichlerz 45, skarbiecPo 179 / spichlerzPo 50` |

Uwagi do tabeli:
- B2 i C: po wczytaniu i w ciągłej sesji wartości są identyczne co do jednostki; po jednym endTurnie też (B2 po endTurn tura 21: `skarbiec 161→172`; C: `skarbiec 167→179`). Stan po wczytaniu = stan ciągłej sesji.
- newgame t1 (1 miasto, seed 4242) i t1 (3 miasta, seed 777): bramka wolna przy `spichlerzPo -4` (B2 t1: `skarbiecPo 0, spichlerzPo -4`, bramka wolna). Dlaczego bramka nie blokuje przy ujemnej prognozie, NIE USTALONO: `decideEndTurnGate` (`gra/src/game/no-negative-stocks.ts`) najpierw uwzględnia reakcję automatu (`extra.automat`) i dopiero wynik po niej ocenia; pole `automatPoprawil` nie jest zapisywane w odczycie.
- Dla 1-miastowego newgame (seed 4242, r2) t1 jest blokowany (`skarbiec 0, spichlerz -4`, `komunikat: zabraknie 2`); t1 seeda 4242 z 2 miastami już nie. Różnicę przypisuję liczbie miast (dochód), NIE ZMIERZONO bezpośrednio.

## WNIOSEK (NIE ZMIERZONO tam, gdzie nie zmierzono)

1. **Realny defekt wczytania zapisu: NIE.** Wczytany zapis daje w każdym zmierzonym przypadku (A z r2, B2, C) ten sam stan bramki i te same liczby prognozy co ciągła sesja: B2 i C co do jednostki, przed i po endTurnie. Wczytanie samo w sobie nie psuje bramki.
2. **Brak prognozy w świeżej turze 1: NIE jest defektem newgame.** W newgame t1 prognoza jest obecna (założenie miasta ustawia dirty). Brak prognozy (null przy 1 mieście) występuje w presecie testowym `playtest=mapa` (`doStartPlaytestMiasto`, pushe miast bez `markCityStateDirty`). Mechanizm: stary cache po wyzerowaniu flagi przy 0 miastach. Zmierzone: zdarzenie założenia miasta przywraca prognozę. NIE USTALONO: które wywołanie wyzerowało flagę przy 0 miastach.
3. **Realny efekt dla gracza w newgame: brak** (t1 ma prognozę; po założeniu pierwszego miasta jest liczona). Efekt tylko w scenariuszu testowym `playtest=mapa`, gdzie t1 bez zdarzenia jest „ślepy” (bramka wolna mimo prognozy −48 po zdarzeniu).
4. **Pytanie produktowe (decyzja właściciela, NIE rozstrzygam):** czy tura 1 nowej gry (lub presetu testowego) ma blokować „Zakończ turę” przy prognozie −48 (zapas 0, skarbiec 5000 w presecie). Dziś w newgame prognoza t1 to −4 i bramka jest wolna; w presecie −48 pojawia się dopiero po pierwszym zdarzeniu dirty.

## KANDYDACI NAPRAWY (bez implementacji; decyzja właściciela)
- K1 (bezpieczny, mały): w `doStartPlaytestMiasto` po pushu miast wywołać `markCityStateDirty()` (przywraca prognozę t1 w presecie). Zmiana tylko w presecie testowym; wymaga zmiany `gra/src` (poza allowlistą tego tematu).
- K2 (ogólny, ochronny): zerować `empireEconDirty` dopiero po udanym przeliczeniu w `refreshLiveEmpireRatesUnsafe` i ustawiać dirty przy 0 miastach (`main.ts:23068–23090`). Zmiana zachowania: kosztów CPU minimalne, ale zmienia moment pojawienia się prognozy; wymaga decyzji.
- K3: NIE rekomendowane — hak `forceNnsRecompute` w civTest nie jest już potrzebny do dowodu (zob. zarzut 3).
- K4 (decyzja produktowa): zob. pkt 4 wniosku.

## TESTY
- `node ./node_modules/typescript/bin/tsc --noEmit -p .` → TSC_EXIT=0, wyjście pusta (`evidence/r3-tsc.out`, 0 bajtów).
- 5 bramek referencyjnych (surowe wyjście, `evidence/r3-*.out`):
  - `tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0;
  - `tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0;
  - `tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0;
  - `tools/unit-replace-test.cjs` → `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0;
  - `tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`, exit 0.
- Pomiary Chromium (r3): `/usr/bin/chromium`, build vite POZA repo (`scratchpad/nnsr3/build`, `npx vite build --outDir ... --emptyOutDir`, exit 0). Każdy przebieg: `bledy: []` w JSON (wyjątek: pierwsza próba łańcucha przerwana timeoutem — powtórzona z krótszym oczekiwaniem na endTurn; wynik z powtórki).
- Obciążenie hosta przy pomiarach: load average 8–13 (dispatch wymagał < 3). Warunek NIE SPEŁNIONY; pomiary są deterministyczne (seed + te same wartości w sesji ciągłej i po wczytaniu), ale czasy nie są ocenami wydajności.
- Dowód mutacyjny: NIE DOTYCZY (brak poprawki kodu gry).

## NARZĘDZIE
- `gra/tools/nns-gate-r3-measure.cjs` (nowe, tylko diagnostyka): tryby `play` (nowa gra, N dodatkowych miast przez `foundExtraCityForTest`, pętla do tury, quickSave), `load` (nowa strona w tym samym profilu, loadSlot, odczyt, endTurn), `chain` (playtest=mapa: odczyt, zdarzenie założenia miasta, odczyt, endTurn). Odczyt = drugie wywołanie `nnsDiag`. Zmienna `LOOP_MS` ogranicza pętlę (domyślnie 330 s). Narzędzie NIE ma asercji pass/fail; wynik to JSON z liczbami (zgodnie z zakresem diagnozy).
- Narzędzia r1/r2 (`nns-gate-after-load-repro.cjs`, `nns-gate-r2-measure.cjs`, `nns-gate-r2-h2-probe.cjs`) bez zmian.

## BLOKADY
- Brak blokad technicznych (Chromium działa; build poza repo; `npm ci` tylko w worktree, `gra/node_modules` usuwany po pracy).
- NIE ZMIERZONO: kolejność wywołań zerującego flagę przy 0 miastach (brak haka bez zmiany src).
- NIE ZMIERZONO: dlaczego `decideEndTurnGate` zwalnia bramkę przy `spichlerzPo -4` w newgame (automat; pole `automatPoprawil` nie zapisywane).
- NIE ZMIERZONO: wiersz A z wczytaniem w czystym t1 newgame (zapis t1 nie był wykonany; wiersz B2/C startują od t20).

## RUNDY
Operator, runda 3/5 (odpowiedź na zarzuty Evaluatora r2, to samo ID).

## NASTĘPNY KROK
Evaluator (r3) i Final Control. Decyzja właściciela: K1 (mała zmiana w presecie testowym) albo K2 (ogólna zmiana kolejności flagi), oraz pytanie K4 (czy tura 1 ma blokować przy prognozie −48). Bez decyzji nie implementować.

## UWAGI-DLA-ORKIESTRATORA
- Nie zakładano sesji, zadań, harmonogramów ani wiadomości do innych agentów (zakaz z dispatchu zachowany).
- Pierwsza próba łańcucha (mapa + zdarzenie) przekroczyła 580 s z powodu czekania na endTurn zablokowany bramką; poprawka: `endTurnPokaz(page, 20)` w trybie `chain`. Wynik z powtórki.
- `gra/node_modules` zainstalowany przez `npm ci` tylko w worktree (gitignore); usuwany po zakończeniu.
- Build vite i profile Chromium leżą w katalogu scratchpad (`scratchpad/nnsr3`), nie w repo.
- Worktree przełączony `git checkout --detach 0be818b13` (zgodnie z dispatchem r3, baza kandydata).

DEPLOY/PUSH: NIE WYKONANO
