STATUS: PASS-WITH-NOTES
DOMAIN: GAME (ulepszenia terenu / drogi; kwalifikator budowy, koszt, tooltip)
TEMAT: R-WEB-ROAD-PAVED-DIRECT-BUILD-OR-UPGRADE-Q1 (runda 1/5, Operator HAIKU 5.5)
GOAL: Gracz może na heksie bez drogi zbudować Drogę brukowaną OD RAZU (koszt = Droga + Droga brukowana), a na heksie z już zbudowaną Drogą — ulepszyć ją do brukowanej (koszt jak dotąd, = koszt samej brukowanej). Auto-ulepszenia i AI zachowują dotychczasową regułę „najpierw droga”.
BAZA: origin/main = cb077b588ee37abcf210ed5c00e893de30aa27b9 (merge-base potwierdzone, jest przodkiem HEAD).

ZMIANY/COMMIT:
- gra/src/map/improvement-build.ts — kwalifikator `droga_brukowana`: heks z Drogą (warstwa lub hex.ulepszenie) -> ulepszenie (bez zmian); heks BEZ Drogi -> dozwolone, o ile heks łączy się z siecią dróg (`roadAdjacencyOk`, jak zwykła droga), gdy `opts.direktBruk !== false`. Nowy opcjonalny parametr `buildImprovementQualifier(state, { direktBruk })` (domyślnie gracz = true). Nowa funkcja `workCostAt` w `createImprovementBuildApi`: koszt na konkretnym heksie = Droga+Brukowana (bez Drogi) albo sama Brukowana (z Drogą); używana w `createBuildRequest` (req.kosztPraca jest później sprawdzany i odejmowany w main.ts bez zmian).
- gra/src/game/auto-improvements.ts — `buildImprovementQualifier(state, { direktBruk: false })`: auto-ulepszenia NIE stawiają brukowanej od zera (ich koszt meta = 25, a od zera gracz płaci 40 — rozjazd byłby błędem).
- gra/src/ui/hexContextTooltip.ts — usunięty filtr `droga_brukowana` wymagający Drogi; tooltip pokazuje brukowaną na heksie bez Drogi (budowa od zera) i z Drogą (ulepszenie). Komentarz zaktualizowany.
- gra/data/terrain-improvements.json — tylko `teren` i `warunek` pozycji `droga_brukowana` (opis: na heksie bez drogi budowa od zera, koszt = Droga + Droga brukowana; z Drogą — ulepszenie). Koszty `koszt_praca` bez zmian (15 / 25).
- gra/tools/map-road-movement-test.cjs — asercja „no bruk without existing droga” zamieniona na nowe zachowanie gracza + kontrolę `direktBruk:false` (zmiana zamierzona, opisana w teście).
- gra/tools/hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs — usunięte źródłowe asercje starej reguły (warunek w `REQUIRED_LINES`, lustro `computePossibleKeys`); sekcja [4] odwrócona (Łąka bez Drogi ZAWIERA brukowaną); mutant [3b] usunięty razem z warunkiem (opisane w komentarzu).
- gra/tools/road-paved-direct-build-test.cjs (NOWY) — test regresyjny: (a) kwalifikator gracz/auto, brak techu, heks poza siecią; (b) stan po budowie od zera (warstwy = ['droga_brukowana'], ruch ÷ROAD_BRUK_MOVE_SPEED_MULT, bonus handlu > 0); (c) koszt od zera = droga+brukowana, ulepszenie = brukowana; (d) MUTANT na kopii improvement-build.ts (`return false` w gałęzi budowy od zera) — asercje muszą wykryć zmianę. Wynik: 13 pass / 0 fail.
- dyspozycje/autobot/runs/R-WEB-ROAD-PAVED-DIRECT-BUILD-OR-UPGRADE-Q1/10-operator-claude.md — ten raport.
Allowlista zachowana: nie dotknięto gra/src/main.ts, rust-port/, WERSJE.md, manifestu, gra-robocza/. Brak `npm run build/dev`; `git add` tylko wskazanymi ścieżkami.

ZAŁOŻENIE KOSZTU (do potwierdzenia przez właściciela — nie zmieniano sumy): budowa od zera = koszt `droga` + koszt `droga_brukowana` z danych (`getWorkCost`, czyli już skalowane przez epokę), bez zniżki i bez premii; ulepszenie = koszt samej brukowanej. Konkretne liczby z danych w testach liczone są z API (nie wpisane na sztywno).

TESTY (surowe wyniki z tej rundy, node w gra/tools):
- `npx tsc --noEmit` (gra/): exit 0, brak błędów.
- road-paved-direct-build-test.cjs (nowy): 13 pass, 0 fail (w tym mutant wykryty).
- Bramki referencyjne: logic-test exit 0; tech-tree-test 20 pass/0 fail; research-test 33/0; unit-replace-test exit 0; combat-test exit 0 („All sanity checks passed”).
- load-game-regression-test.cjs: 34 PASS / 0 FAIL.
- roads-reach-city-hex-test.cjs: 24 OK / 0 FAIL.
- roads-city-links-only-test.cjs: 57 OK / 0 FAIL.
- road-connectivity-test.cjs: 99 passed / 0 failed.
- road-build-player-parity-test.cjs: 17 OK / 0 FAIL.
- road-hook-mainguard-test.cjs: 19 passed / 0 failed.
- map-road-movement-test.cjs: 27 pass / 0 fail (po zmianie zamierzonej asercji).
- hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs: 63 passed / 0 failed (po odwróceniu asercji [4]).
- auto-improvements-test.cjs: 46 passed / 0 failed.
- autoimprove-stages-q1-test.cjs: 299 passed / 0 failed.
- era-improvement-cost-upkeep-test.cjs: 52 pass / 0 fail.
- auto-improve-q3-test.cjs, auto-improve-no-item-cap-test.cjs, autoimprove-irrigation-after-farms-test.cjs, autoimprove-river-forest-first-q1-test.cjs, terrain-improve-farm-availability-test.cjs: exit 0.
- Testy NIE ZAKOŃCZONE ZIELONO, ale PRZED tematem TAKIE SAME (zweryfikowane przez tymczasowy powrót do cb077b588): map-improvement-qualify-test.cjs (1 FAIL: „stadnina KWALIFIKUJE SIE na Lace+Las po odblokowaniu Konia”) i auto-fort-claim-test.cjs (2 FAIL: „bez limitu … droga JEST budowana”, „fort stoi, brak innych kandydatow -> drogi ruszaja”). Oba czerwone na bazie — dług przedtematowy, NIE naprawiany tutaj. Uwaga: w auto-fort-claim fail dotyczy drogi, więc orkiestrator/Evaluator powinien to potwierdzić przy porównaniu z bazą.
- civpedia-caly-wiersz-przyciskiem-test.cjs: NIE URUCHAMIANY (wymaga przeglądarki; poza zakresem bez Chromium).
- Chromium / żywa weryfikacja kryterium (e): NIE ZMIERZONO (nie zbudowano vite poza repo ani nie uruchomiono playwright w tej rundzie). Tooltip/panel bez drogi i z drogą zweryfikowany tylko logicznie (test [4] i funkcja listy).

BLOKADY / OTWARTE (jawnie):
1. UI kosztu w panelu budowy: `listTypes` pokazuje koszt TYPU (25 dla droga_brukowana), bo lista nie jest per heks. Przy budowie od zera gracz zobaczy 25 w panelu, a zostanie pobrane 40 (req.kosztPraca). Brak wyświetlenia 40 „od zera” w panelu/tooltipie — kryterium (c) w części UI NIE spełnione. Rekomendacja: osobny mały temat UI (podpis kosztu zależny od heksu w buildModeHud / tooltipie).
2. Tooltip wykazuje brukowaną na heksie bez Drogi bez sprawdzenia połączenia z siecią (tak jak dotąd droga); kwalifikator (createQualifier) to egzekwuje przy kliknięciu. Możliwa niespójność „pokazuje, a nie da się” dla heksów nieprzyłączonych — NIE ZMIERZONO w grze.
3. Wiki/Civpedia: tekst `teren`/`warunek` zmieniony w JSON, ale wiki bundle (src/data/wikiBundle.json, generowany przez tools/bundle-wiki-for-game.cjs) NIE zsynchronizowany — poradnik/encyklopedia nadal mogą mówić „upgrade Drogi”. Wymaga procedury regeneracji bundla (osobny krok, nie wykonany).
4. Rust (rust-port/engine/src/domain/improvements.rs i powiązane) ma własną definicję `droga_brukowana` — kwalifikator/koszt NIE zbadane i NIE zmienione (dług Rust, zgodnie z dispatchem).
5. Stan heksa w `hex.ulepszenie`: `syncHexUlepszenieFields` mapuje tylko `droga` (nie brukowaną), więc po budowie od zera `hex.ulepszenie` pozostaje Brak; ruch i bonusy liczone są z warstw (`improvementKeysForHex`) — działa w testach, ale warto to potwierdzić w grze (zgodne z obecnym zachowaniem ulepszeń).
6. Zapis/wczytanie: nie dodawano nowych pól; warstwa ['droga_brukowana'] to ten sam format co dotąd — NIE ZMIERZONO na prawdziwym zapisie (load-game-regression-test przeszedł).

UWAGI-DLA-ORKIESTRATORA:
- Hipoteza do Evaluatora: w `hexContextTooltip.ts` tooltip nie sprawdza `roadAdjacencyOk` — tak samo jak dla zwykłej Drogi (przed tematem); ewentualne domknięcie to osobny temat.
- Dwa czerwone testy na bazie (map-improvement-qualify-test, auto-fort-claim-test) — warto dopisać do długu testowego.
- Patch-stan: wszystkie zmiany są w jednym commicie wraz z raportem (patrz pole sha w odpowiedzi).

NASTĘPNY KROK: Evaluator (SONNET) — przegląd diffu (improvement-build.ts workCostAt/qualifier; auto-improvements direktBruk:false; tooltip), decyzja właściciela o kosztach 15+25 (ABC) i zakres UI kosztu (blokada 1) przed FC/integracją.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
