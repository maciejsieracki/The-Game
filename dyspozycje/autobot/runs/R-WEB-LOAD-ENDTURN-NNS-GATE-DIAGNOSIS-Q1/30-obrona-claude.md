# R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora r1)

STATUS: PASS-WITH-NOTES (obrona; diagnoza NIE jest kompletna — pozycje B, C i przyczyna pierwotna oznaczone NIE ZMIERZONO poniżej)
DOMAIN: GAME (bramka „Zakończ turę” NNS, tylko diagnoza; zero zmian w `gra/src`, `gra/data`)
TEMAT: R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1
BAZA: `origin/main` = `439b1e1ae0a6dbec769495941dff30867aa8857e`. KANDYDAT Evaluatora: `4e8ba4c84d03d52639b1a22a1322f5abae6d8e79`. Ta obrona: commit po `076bcb543` (SHA końcowy podany w odpowiedzi do orkiestratora).
GOAL: rozstrzygnąć, czy wczytanie zapisu jest realnym defektem bramki NNS, oraz wykonać pomiary wymagane dispatchem (B, C, test H1), odpowiadając na każdy zarzut Evaluatora.

## ODPOWIEDZI NA ZARZUTY (PRZYJMUJĘ / ODRZUCAM, z dowodem)

**Zarzut 1 (kontrola „świeża strona po wczytaniu” nieważna) — PRZYJMUJĘ.**
Wycofuję w całości wnioski 2 i 4 z raportu r1 (`10-operator-claude.md`), czyli „defekt tylko w scenariuszu ta sama strona” i „w świeżej stronie brak defektu”. Kontrola w NOWYM kontekście (`browser.newContext()`) nie widzi zapisu i nic nie wczytuje: „DZIAŁA” oznaczało świeżą grę, nie wczytany zapis. Poprawny pomiar (nowa strona w TYM SAMYM kontekście, ten sam magazyn zapisów) — `evidence/modeA-raw.json`, `kroki.E2a` / `E2b`:
- przed wczytaniem (świeża gra, tura 1): `bramkaBlokuje=false`, `prognozaCache=null`;
- po `loadSlot` (zapis tury 1): `bramkaBlokuje=true`, `prognozaCache={tura:1, spichlerzObecny:0, spichlerzPo:-48, skarbiecPo:4907}`, `endTurn` 1→1 (NIE przechodzi).
Wynik identyczny jak w tej samej stronie (`kroki.E1`: `bramkaBlokuje=true`, `spichlerzPo=-48`, `endTurn` 1→1). Różnicy „ta sama strona vs świeża strona” NIE MA.

**Zarzut 2 (przyczyna nieustalona; H1 odrzucona na błędnej podstawie) — PRZYJMUJĘ.**
- H1 w postaci z dispatchu („cache sprzed wczytania przeżywa wczytanie w tej samej stronie”) — ODRZUCAM na podstawie pomiaru: po wczytaniu w tej samej stronie cache ma `tura=1` (przeliczony po wczytaniu, nie sprzed wczytania) i `spichlerzPo=-48` równe wartości z nowej strony (`E1` vs `E2b`). Cache nie jest nieprzeliczony.
- Odwrócony obraz z zarzutu Evaluatora potwierdzam danymi: świeża gra, tura 1, 1 miasto gracza → `prognozaCache=null` po DWÓCH odczytach (`E0`, `E2a`, `E3a`), bramka wolna. Wczytanie tego samego stanu → realne −48. Ten sam stan w turze 2 świeżej gry (bez wczytania) → −48 (`E3b`).
- Hipoteza H2 (NIEZMIERZONA bezpośrednio, zgodna z kodem): `refreshLiveEmpireRates` (src/main.ts:23068) ustawia `empireEconDirty=false` PRZED `refreshLiveEmpireRatesUnsafe`; ta funkcja przy `playerCities.length===0` ustawia `_nnsHumanForecast=null` i wraca (linia 23089). Jeśli pierwsze przeliczenie w świeżej grze nastąpiło przed powstaniem miasta gracza albo po zdarzeniu bez `markCityStateDirty` (linia 2971), cache zostaje `null` aż do następnego triggera (w turze 2 — `endTurn` — cache liczony od `tura=2`). Jedyne ścieżki dające `null` przy 1 mieście to brak przeliczenia albo wyjątek (wyjątek loguje `[NNS] prognoza… nie powiodła się` — w konsoli NIE ZAOBSERWOWANO, `konsolaNns` w `modeA-raw.json`).
- Bezpośredni test H2 wymaga haka wymuszającego przeliczenie w świeżej turze 1 (`markCityStateDirty()` z civTest). Hak NIE istnieje w `src` i dodanie go jest zmianą `src` poza allowlistą tematu → NIE ZMIERZONO. Propozycja w pytaniu do orkiestratora.
- Wniosek przyczynowy: defekt NIE leży w wczytywaniu. Wczytanie jest poprawne i daje tę samą prognozę co świeża gra w tym samym stanie. Anomalia dotyczy świeżej gry w turze 1: bramka jest „ślepa” do pierwszego triggera, a realna prognoza tury 1 (−48 przy spichlerzu 0) jest blokowana dopiero po wczytaniu lub po `endTurn`.

**Zarzut 3 (brak B i C, brak tabeli ≥3 zapisów) — PRZYJMUJĘ, NIE ZREALIZOWANE w tej rundzie.**
- B (tura ≥20, kilka miast): próba w trybie `Bplay` (`evidence/modeBplay-raw.json`, `gra/tools/nns-gate-after-load-repro.cjs`): w scenariuszu `playtest=mapa` bramka blokuje turę 2; harness podnosi spichlerz (`setSpichlerzPanstwa(ME,400)`, interwencja zapisana w logu). Gra doszła do tury 3, gdzie w 3 kolejnych próbach `endTurn` nie zmienił tury w ciągu 120 s (`przed=3, po=3`). Ad hoc diagnoza (`evidence/diag-endturn-stall-t2.cjs` / `.log`) pokazała zmianę tury 2→3 po ok. 25 s, więc przyczyna opóźnień NIE ZMIERZONO (kandydaci: `preBattleOpen`, `endTurnInProgress`, długi ruch AI). Liczba miast gracza = 1 (nie „kilka”). Tabela B: NIE ZMIERZONO.
- C (kampania / większa gra): NIE ZMIERZONO (brak uruchomienia w tej rundzie).
- Kryterium „≥3 zapisy z liczbami” — NIESPEŁNIONE. Pozostaje otwarte.

**Zarzut 4 (test H1 w formie z DODATKU 1 niewykonany; narzędzie bez asercji; kontrola błędna) — PRZYJMUJĘ, z poprawkami.**
- Narzędzie przemianowane: `gra/tools/nns-gate-after-load-repro.cjs` (dawna nazwa `nns-stale-forecast-…` sugerowała nieistniejącą diagnozę). Usunięta błędna kontrola cross-context; dodana walidacja: `walidacja.wczytanieDziala_P2` (po wczytaniu w nowej stronie cache `!= null`) i `E2a_bramkaWolna`; kod wyjścia 1, gdy walidacja nie przechodzi lub są błędy strony. Dodany zbiór komunikatów konsoli `[NNS]`/`[EndTurn]`.
- Test H1 w formie DODATKU 1 (`nnsGateForPlayer` bez i po wymuszonym przeliczeniu): NIE ZMIERZONO (brak haka w `src`). Zastępczy dowód H1: pole `prognozaCache.tura` po wczytaniu = bieżąca tura zapisu (1), a wartość −48 identyczna jak w świeżej stronie → cache przeliczony po wczytaniu. H1 w sformułowaniu „stale” ODRZUCONA tym pomiarem.

**Zarzut 5 (bramki referencyjne nieuruchomione; nieścisłość linii) — PRZYJMUJĘ i wykonuję.**
Uruchomione w tej obronie na `076bcb543` (`gra/`, `node_modules` przez `npm ci`, surowe wyjścia):
- `node ./node_modules/typescript/bin/tsc --noEmit -p .` → TSC_EXIT=0, brak komunikatów (`/tmp/…/scratchpad/tsc.out`, pusty).
- `tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- `tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`, exit 0.
Linie poprawione (wg `grep -n` na bazie): `markCityStateDirty` 2971; `_nnsHumanForecast` deklaracja 23050 (poprzednio podano ~22908); `refreshLiveEmpireRates` 23068; hak `nnsDiag` 31187 (poprzednio ~31186); `nnsGateForPlayer` 41048; `canPlayerInitiateEndTurn` 41092 (poprzednio ~40737); `doLoadGame` 49545; `restoreGameFromSave` 49576.

## POMIARY (liczby z `evidence/modeA-raw.json`, `evidence/modeBplay-raw.json`; Chromium `/usr/bin/chromium`, build vite poza repo do scratchpada)

Odczyt bramki = `nnsDiag()` wykonany dwa razy (drugi odczyt).

| Zapis | Tura | „Zakończ turę” po wczytaniu | Warunek blokady i liczby | To samo bez wczytania |
|---|---|---|---|---|
| A, wczytany w TEJ SAMEJ stronie (E1) | 1 | NIE (endTurn 1→1) | `bramkaBlokuje=true`; cache `tura=1`, `spichlerzObecny=0`, `spichlerzPo=-48`, `skarbiecPo=4907` | świeża gra tura 1 (E0): bramka wolna, cache null, endTurn 1→2 TAK |
| A, wczytany w NOWEJ stronie tego samego kontekstu (E2b) | 1 | NIE (endTurn 1→1) | identycznie jak E1: `spichlerzPo=-48`, `tura=1` | świeża strona przed wczytaniem (E2a): bramka wolna, cache null |
| Świeża gra, endTurn 1→2, bez wczytania (E3b) | 2 | NIE (blokada w turze 2) | `spichlerzObecny=0`, `spichlerzPo=-48`, `skarbiecPo=4810`; komunikat „zabraknie 46” | — |
| B (zapis tura ≥20, kilka miast) | 3 (osiągnięte) | NIE ZMIERZONO | scenariusz mapa: 1 miasto gracza; interwencja `setSpichlerzPanstwa`; endTurn bez zmiany tury 3× po 120 s | NIE ZMIERZONO |
| C (kampania / większa gra) | — | NIE ZMIERZONO | nie uruchomiono | NIE ZMIERZONO |

Logi: `konsolaNns` w `modeA-raw.json` zawiera wyłącznie `[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)` (blokady) i `[NNS-AI 1] tura 2: po ticku skarbiec=1 spichlerz=-4` (AI). Brak `[NNS] … nie powiodła się`. `bledy`: `[]`.

## WNIOSEK (NIE ZMIERZONO tam, gdzie nie zmierzono)

1. Realny defekt wczytania (wczytany zapis daje INNĄ prognozę niż świeża gra w tym samym stanie): NIE (zmierzone na zapisie tury 1, scenariusz mapa; świeża strona i ta sama strona dają identyczne −48 po wczytaniu).
2. Anomalia do decyzji: w świeżej grze tury 1 prognoza NNS nie jest liczona (`null`, hipoteza H2: cache nie przeliczony od startu, NIEZMIERZONE bezpośrednio). Realna prognoza tury 1 tego stanu to −48 (zmierzone przez wczytanie tego samego stanu), więc tura 1 świeżej gry przechodzi tylko dzięki braku przeliczenia.
3. Pytanie produktowe (decyzja właściciela, NIE rozstrzygam): czy start nowej gry (spichlerz 0, racja 6, deficyt −48 po turze) ma blokować „Zakończ turę” już w turze 1. Dziś blokada pojawia się dopiero w turze 2 albo po wczytaniu.
4. Dla B i C: NIE ZMIERZONO (pełne wyniki wymagają rundy 3 i poprawy harnessu — patrz niżej).

## KANDYDACI NA NAPRAWĘ (bez implementacji; decyzja właściciela)
- K1 (pomiar, najpierw): hak civTest `forceNnsRecompute()` (wywołanie `markCityStateDirty()` + `refreshLiveEmpireRates()`) w `src` — zmiana poza allowlistą tego tematu, wymaga osobnej decyzji. Pozwoli rozstrzygnąć H2 i wykonać test H1 z DODATKU 1.
- K2 (jeśli H2 potwierdzona): przy starcie gry i przy powstaniu pierwszego miasta gracza wywołać `markCityStateDirty()` (cache przeliczony od tury 1) — zmiana zachowania: turę 1 zablokuje realny deficyt (zależy od decyzji z pkt 3).
- K3 (ochrona, bez znajomości przyczyny): zerować `empireEconDirty` dopiero po udanym przeliczeniu (poprawka kolejności w `refreshLiveEmpireRates`, linie 23068–23080: flaga zerowana przed `Unsafe`, a `Unsafe` przy 0 miastach zwraca bez ustawienia dirty).
- K4 (decyzja projektowa): pkt 3 wyżej.

## TESTY
- `tsc --noEmit`: exit 0 (surowe wyjście pusta). 5 bramek referencyjnych: zielone, wyniki jak w zarzucie 5 (wszystkie exit 0).
- Repro: `gra/tools/nns-gate-after-load-repro.cjs` tryb `A` → exit 0, walidacja `wczytanieDziala_P2=true`, `E2a_bramkaWolna=true`.
- Pomiar Bplay: exit 0 (osiągnięta tura 3, NIE tura 20). Walidacja tury 20: NIE ZMIERZONO.
- Dowód mutacyjny: NIE DOTYCZY (brak poprawki kodu gry).

## BLOKADY
- Harness `playtest=mapa`: endTurn nie zmienia tury w oknie 120 s (tura 3), przyczyna NIE ZMIERZONO → B nie domknięty.
- Brak haka civTest do wymuszenia przeliczenia → H2 i test H1 w formie DODATKU 1 NIE ZMIERZONO.

## RUNDY
Operator, runda 2/5 (obrona r1 → odpowiedź na zarzuty Evaluatora r1, to samo ID).

## NASTĘPNY KROK
Orkiestrator: (a) decyzja właściciela o haku civTest (K1) — bez niego H2 nie jest dowiedziona; (b) decyzja o pkt 3 (blokada tury 1 = K4); (c) osobny temat pomiaru B (harness: diagnoza przyczyny stałego braku zmiany tury w turze 3 mapy, potem zapis ≥20 i pomiar bez/z wczytaniem) oraz C (kampania). Rekomendacja Operatora: NIE implementować żadnej poprawki przed decyzją z pkt (a)–(b).

## UWAGI-DLA-ORKIESTRATORA
- Nie zakładano sesji, zadań, harmonogramów ani wiadomości do innych agentów (zakaz z dispatchu zachowany).
- Stary plik `gra/tools/nns-stale-forecast-after-load-repro.cjs` przemianowany (`git mv`) na `nns-gate-after-load-repro.cjs`; treść zmieniona.
- Dodatkowe dowody ad hoc: `evidence/diag-endturn-stall-t2.cjs` (skrypt poza repo w scratchpadzie, skopiowany do runs/) i `.log`.
- `gra/node_modules` zainstalowany przez `npm ci` tylko w worktree (gitignore), usunięty po pracy.

DEPLOY/PUSH: NIE WYKONANO
