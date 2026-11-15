# R-WEB-DIPLO-WEARINESS-PW-FOLLOWUP-C615-BOTH-CITIES-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-PW-FOLLOWUP-C615-BOTH-CITIES-Q1
GOAL: (1) cena pokoju C = 615 PW jako jedna stała (bez zależności od tury i mnożnika cywilizacji); (2) przy ofercie AI→gracz C bez mnożnika cywilizacji (potwierdzone w kodzie); (3) licznik zmęczenia = miasta utracone przez OBIE strony, ta sama liczba w tabeli PW i w ticku AI↔AI.
BAZA: origin/main 78af786ed (ROBOCZA 942060c9, FALA 723). UWAGA: dispatch podaje 3fab00ce0, ale kod FALI 722 (zmęczenie jako pozycja PW) jest w origin/main (78af786ed, ancestor 159d443b4), a NIE w 3fab00ce0 — start od 3fab00ce0 nie miałby funkcji do zmiany. Założenie: baza = origin/main, zgodnie z DODATKIEM („bazą kodu jest origin/main”).

## ZMIANY (commit: SHA w polu sha zwrotki orkiestratora)

- `gra/data/diplomacy-acceptance-points.json`: `traktaty.pokoj.punkty` 500 → 615 (jedna prawda; `treatyBasePnFromConfig('pokoj')` i AI↔AI price czytają tę wartość).
- `gra/src/game/diplomacy-war-peace-profile.ts` (`evaluatePeaceAiGate`): `priceMultiplier = 1` zawsze; usunięta gałąź `turns >= turyBezOgraniczenAi ? min(1,civ) : civ`. ZAŁOŻENIE: „stała C” = bez mnożnika cywilizacji także dla pokoju gracz→AI (dispatch: „wariant C, bez zależności od tury”; 615 było wartością tylko dla cywilizacji z mnożnikiem 1,23). `peaceCivPriceMultiplier` zostaje w pliku (nieużywany w bramce).
- `gra/src/game/war-weariness.ts`: nowa funkcja `lostCitiesForWeariness(lostA, lostB) = max(0,lostA)+max(0,lostB)`; tick AI↔AI używa jej (`lostCitiesTotal`).
- `gra/src/main.ts` (`diploProposalWarState`): `lostCitiesResponder` = `lostCitiesForWeariness(miasta respondenta, miasta proponującego)`. Nazwa pola historyczna, wartość = suma obu stron; tabela PW (`diplomacy-proposals.ts`, Z i wiersz „Zmęczenie wojną”) czyta to pole, więc tabela i tick liczą z tych samych danych.
- `gra/src/data/wikiBundle.json`: regenerowany (`tools/bundle-wiki-for-game.cjs`), 22 rozdz. + 182 hasła.
- `docs/encyklopedia/pojecia/zmeczenie-wojna.md`: zdanie o cenie pokoju = stałe 615 PW.
- `dyspozycje/PROPOZYCJA-ZMECZENIE-JAKO-PW-POKOJ.md`: tabela przeliczona dla C=615 z funkcji (patrz niżej).
- `gra/tools/diplo-war-peace-profile-unit-test.cjs`: jedna oczekiwana wartość 1.32 → 1 (mnożnik ceny = 1 wg decyzji C).
- `gra/tools/diplo-weariness-c615-both-cities-test.cjs` (NOWY): 9 asercji — (a) punkty=615; (b) priceMultiplier=1 dla tur 0..40 i 2 profili; (c) suma symetryczna; (d) tabela i tick dla tych samych danych (lostA,lostB) dają ten sam licznik/poziom/Z dla tur 0..24 oraz mutacja „licznik zależny od strony” wykrywalna; (e) Z(615) tury 10..16 z funkcji; (f) wiązanie w kodzie (main.ts dodaje miasta proponującego, tick używa funkcji, brak literału 615 w diplomacy-proposals.ts / war-weariness.ts).

## TABELA C=615 (z funkcji, bez utraconych miast)

| Tura | L | x | Z kw. (wdrożone) | R do dopłaty |
|---|---|---|---|---|
| 10 | 0,50 | 0 | 0 | 615 |
| 11 | 0,55 | 0,167 | 17 | 598 |
| 12 | 0,60 | 0,333 | 68 | 547 |
| 13 | 0,65 | 0,5 | 154 | 461 |
| 14 | 0,70 | 0,667 | 273 | 342 |
| 15 | 0,75 | 0,833 | 427 | 188 |
| 16 | 0,80 | 1 | 615 | 0 |

Rozbieżność z dispatchem: dispatch podaje Z = 0/15/62/154/273/427/615. Funkcja `wearinessPeaceItemPw` daje dla tur 11 i 12 wartości 17 i 68 (wzór C×x², zaokrąglenie Math.round). Wartości 15/62 nie wynikają z tego wzoru; przyjęto wartości z funkcji (dispatch: „po zmianie licz z funkcji”).

## TESTY (surowe wyniki z tego przebiegu)

- `npx tsc --noEmit` (gra/): exit 0, brak wyjścia.
- `git diff --check`: czysty.
- `diplo-weariness-c615-both-cities-test.cjs` (nowy): PASS=9 FAIL=0.
- `diplo-war-peace-profile-unit-test.cjs`: 198 pass / 0 fail (po zmianie jednej oczekiwanej wartości).
- `diplo-weariness-as-pw-peace-item-test.cjs`: PASS=76 FAIL=0.
- `diplo-weariness-20-turns-test.cjs`: PASS=30 FAIL=0.
- `diplo-weariness-city-only-test.cjs`: PASS=30 FAIL=0.
- `diplo-weariness-display-test.cjs`: PASSED 52 / FAILED 0.
- `diplo-weariness-unconditional-end-test.cjs`: PASS=22 FAIL=0.
- `ai-war-weariness-peace-test.cjs`: PASS=101 FAIL=0.
- `peace-gate-military-strength-test.cjs`: 14 PASS / 0 FAIL.
- `diplo-peace-ai-ai-nonnegative-test.cjs`: 21 PASS / 0 FAIL.
- `diplo-war-peace-gate-test.cjs`, `diplo-peace-weaker-seeks-city-only-test.cjs`, `diplo-peace-balance-accept-test.cjs`, `diplomacy-proposal-test.cjs`, `diplo-weariness-pw-behavior-test.cjs`, `diplo-weariness-pw-row-ui-test.cjs`: exit 0 (bez liczby w wyjściu).
- `pw-weary-table-browser-test.cjs` (Chromium /usr/bin/chromium): BROWSER PASS. DOM: wiersze „Zmęczenie wojną (AI) +17 PW” (tura 11) i „+427 PW” (tura 15); komunikat silnej AI „wymaga miasta o wartości ≥ 615 PW”. To renderowanie tabeli w stronie testowej, NIE zrzut stołu w grze (?civTest=1) z wojną z utratą miasta — NIE ZMIERZONO (patrz niżej).
- `diplo-peace-gate-mutation-run.cjs`: MUTACJE BRAMEK 15/16 zabite. M2 = NIE_ZASTOSOWANO: fragment `if (!(cityGivePn >= basePn)) {` nie istnieje w kodzie od FALI 722 (dziś `cityGivePn >= cenaPokojuPn`, diplomacy-proposals.ts ~l.1451). Plik diplomacy-proposals.ts nie był zmieniany w tym temacie; mutator jest nieaktualny jeszcze z poprzedniego tematu.
- `diplomacy-stol-pw-sum-test.cjs`: 167 pass / 1 fail: „aggregated: label z liczbą umów” (oczekiwano „2 umów”, `formatPl.ts` zwraca „2 umowy” zgodnie z regułą polskiej odmiany). Nie dotyczy zmian tego tematu (formatPl.ts i diplomacyAcceptanceBalance.ts nietknięte); NIE ZWERYFIKOWANO na bazie 78af786ed.

## NIE ZMIERZONO / NIE WYKONANO

- Zrzut Chromium stołu w grze (?civTest=1) z wierszem „Zmęczenie wojną +N PW” dla wojny z utratą miasta po jednej stronie (dispatch pkt d). Powód: czas; test DOM powyżej pokrywa render tabeli, nie grę.
- Pomiar live-audit W66/W80B (wojny AI↔AI kończą się pokojem bez eliminacji). Powód: długi pomiar na żywo nie był w zakresie tej rundy Operatora; ma być wykonany przez Evaluatora/FC albo osobno.
- „5 bramek referencyjnych” z dispatchu: lista bramek nie była w dostępnym dispatchu; uruchomiono tsc i powyższe testy diplo-*/ai-war-weariness. Pełnej piątki nie zweryfikowano.
- Dowód, że AI→gracz nie używa mnożnika cywilizacji: potwierdzone w kodzie (`diplomacy-proposals.ts`, gałąź `!r5PlayerAuthors && !r5RespondentIsAi`, `wearinessPeaceItemPw(basePnCfg, …)`, gdzie basePnCfg = treatyBasePnFromConfig, bez mnożnika). Osobnego testu behawioralnego tej gałęzi nie dodano.

## BLOKADY / UWAGI-DLA-ORKIESTRATORA

1. Baza: patrz nagłówek — dispatch wskazuje 3fab00ce0, kod wymaga origin/main 78af786ed. Orkiestrator decyduje, czy integrować na origin/main (zalecane).
2. Poza allowlistą, do decyzji: `gra/src/ui/diplomacyTradeBasket.ts:862` tekst „baza ~500 PW” dla zakończenia wojny; `gra/src/main.ts` ok. l.21142 komentarz „500 PW” (main.ts poza allowlistą — nie ruszano poza liczbą w kodzie). Obie to teksty/komentarze, nie logika.
3. Test `diplomacy-stol-pw-sum-test` (label „2 umów”) jest czerwony — pre-existing, osobny temat.
4. Mutator M2 w `diplo-peace-gate-mutation-run.cjs` jest nieaktualny — osobny dług testowy.
5. Dwa pliki PNG (`evidence/stol-pozna.png`, `stol-wczesna.png`) nadpisał test przeglądarki; przywrócone `git checkout`, nie są częścią commitu.
6. W worktree zainstalowano zależności `gra/node_modules` (`npm install --ignore-scripts`); katalog jest ignorowany przez git.

## RUNDY / NASTĘPNY KROK

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET): sprawdzić zgodność z dispatchem (C=615 bez mnożnika; licznik = suma obu stron; Z z funkcji), rozstrzygnąć rozbieżność Z(11)/Z(12) i bazę 3fab00ce0 vs 78af786ed; zrzut Chromium z wojną z utratą miasta; live-audit W66/W80B.
DEPLOY/PUSH: NIE WYKONANO
