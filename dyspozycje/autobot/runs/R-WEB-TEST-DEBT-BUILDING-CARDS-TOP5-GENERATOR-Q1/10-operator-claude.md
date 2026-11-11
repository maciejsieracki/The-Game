STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-BUILDING-CARDS-TOP5-GENERATOR-Q1
GOAL: `node gra/tools/gen-building-cards-top5.cjs --check` zielony bez ręcznej edycji `building-cards-top5.json`; generator deterministyczny; testy kart budynków i bramki referencyjne zielone; treść kart bez regresji.
BAZA: origin/main `f8af35f87eb090883b70001a3e5332ae411f4716` (worktree detach).

## Przyczyna (dowód)

- Reprodukcja na bazie: `--check` → „building-cards-top5.json NIEZGODNY z generatorem” (exit 1).
- Diff wygenerowanego wyniku względem pliku na dysku: **jedna karta, dwa pola** — `cegielnia.top5[0].tytul` i `cegielnia.top5[0].zdanie` (8 linii diffu, wszystkie w Cegielni). Pozostałe 43 budynki identyczne.
- Źródło różnicy: commit `b1656e454` (R-WEB-BRICK-CYCLES-75-100-Q1) zmienił **ręcznie** `gra/data/building-cards-top5.json` (4 linie: tytuł „50 / 75 / 100 cykli…” i zdanie „cykle na turę: 50 (epoka 1), 75 (epoka Brązu), 100 (epoka Żelaza)…”), a **nie** wejścia generatora: `budynki-top5.csv` (sha256 `ca618953…`, nietknięty) ani `gen-building-cards-top5.korekty.json` i `card-text-corrections.cjs` nie zostały zaktualizowane.
- Ta zmiana jest **zamierzona**: test `gra/tools/brick-cycles-75-100-test.cjs` z tego samego commita (decyzja właściciela 2026-11-11: cykle Cegielni 50/75/100 per epoka właściciela, carry-forward) i `converters.ts` z tego commita. Zgodnie z dispatchem ręczna zmiana = intencja → zasymulowana w wejściach generatora, JSON nie edytowany ręcznie.
- Zmieniły się więc **wejścia** (ręczna zmiana bez korekty), nie sam generator. Wynik: brakująca warstwa korekty, nie błąd logiki generatora.

## Zmiany (allowlista)

1. `gra/tools/gen-building-cards-top5.korekty.json` — nowy blok `budynki.Cegielnia.zmiany` z jedną korektą `z: "Top1_GLOWNA"` (tytuł i zdanie = tekst z commita `b1656e454`, powód z odwołaniem do decyzji i testu).
2. `gra/tools/card-text-corrections.cjs` — usunięty wpis `{ k: 'cegielnia', p: 'top5.0.zdanie', … }`. Jego „z” (`Zamienia 2 gliny… od epoki Brązu +50%… — cegła buduje budynki epoki Żelaza.`) nie występuje już w bazie CSV po nałożeniu korekty, więc `applyCorrections` zwróciłby błąd „występuje 0×”. Jego treść (korekta J: przeniesienie „od epoki Brązu +50%…” w nawias, cegła jako koszt budowy) została zachowana w zdaniu korekty. Wpis `cegielnia cmz.0.korzysc` pozostał bez zmian.
3. `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BUILDING-CARDS-TOP5-GENERATOR-Q1/10-operator-claude.md` — ten raport.

`gra/data/building-cards-top5.json` **nie zmieniony** (zero bajtów diffu). Wynik regeneracji = plik na dysku.

## Lista zmienionych kart i pól (wymóg dispatchu)

- Zmieniona karta po naprawie względem pliku na dysku: **brak** (0 kart, 0 pól).
- Względem stanu z dysku przed naprawą: `cegielnia` — `top5[0].tytul` i `top5[0].zdanie` odtworzone w generatorze 1:1 (zamierzona zmiana z `b1656e454`, bez nowej treści).

## TESTY (liczby z surowego wyjścia)

Bramki tematu:
- `node tools/gen-building-cards-top5.cjs --check` → `--check OK (dyspozycje/analizy/karty-budynkow/budynki-top5.csv)`, exit 0; drugie uruchomienie → identycznie, exit 0 (determinizm).
- Generator, błędy walidacji: `errors 0` (przed naprawą: błędów 0, różnica tylko w treści).
- `node tools/ids-leak-audit-test.cjs` → `WYNIK: 1648 ok, 0 FAIL`, exit 0.
- `node tools/wonder-text-no-raw-ids-test.cjs` → `WYNIK: 132 ok, 0 FAIL`, exit 0.
- `node tools/building-cards-top5-test.cjs` → `[building-cards-top5-test] 1207 pass, 0 fail`, exit 0.
- `node tools/terminology-trade-vs-tax-test.cjs` → `799 pass, 0 fail`, exit 0 (dispatch oczekiwał 796/0 „lub odpowiednio”; wynik zmierzony 799/0. Baza 795/1 pochodzi z dispatchu, NIE_ZMIERZONO ponownie na bazie w tym przebiegu; przyczyna różnicy liczby asercji nieustalona — do oceny Evaluatora).
- `node tools/brick-cycles-75-100-test.cjs` → `46 passed, 0 failed`, exit 0.
- `node tools/brick-production-x2-test.cjs` → `69 passed, 0 failed`, exit 0.
- `npx tsc --noEmit` → exit 0 (0 błędów).

5 bramek referencyjnych (z `docs/decyzje/R-PROC-AUTOBOT.md` §6):
- `tools/logic-test.cjs` → `LOGIC OK (213/213)` (ref 213/213).
- `tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail` (ref w §6 R-PROC-AUTOBOT: 19/19; zmierzone 20/0; przyczyna różnicy liczby nieustalona — NIE_ZMIERZONO na bazie w tym przebiegu).
- `tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33` (ref 33/33).
- `tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)` (ref w §6: 13/13; zmierzone 21/21; przyczyna różnicy liczby nieustalona, bez fail).
- `tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass` (ref 6/6).

Uwaga o wejściu: `findCsv()` domyślnie wybiera `dyspozycje/analizy/karty-budynkow/budynki-top5.csv` (sha256 `ca618953…`). Kopia w `dyspozycje/autobot/runs/R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/budynki-top5.csv` (sha256 `b81c7b65…`) różni się od niej i daje 3 błędy walidacji (np. różnice w komórce Cegielni). Nie zmieniałem tego; `--check` z domyślnym CSV jest zielony. Do rozważenia osobno (dług: dwie kopie CSV).

## BLOKADY

Brak. Nie uruchamiano `npm run build`/`dev` (zakaz). `npm ci --ignore-scripts` wykonane w `gra/`.

## RUNDY

1/5.

## ZAŁOŻENIA

- Intencja ręcznej zmiany z `b1656e454` (cykle 50/75/100) przyjęta jako zamierzona na podstawie testu z tego samego commita i decyzji właściciela opisanej w dispatchu (ta sama runda). Gdyby właściciel chciał inaczej, zmiana wymaga decyzji, nie tylko korekty generatora.

## NASTĘPNY KROK

Evaluator r1 (Sonnet) na commicie operatora: weryfikacja diffu (tylko 2 pliki kodu + raport), zgodności `--check`, deterministyczności i liczb testów; oraz ocena zmiany liczb `terminology-trade-vs-tax` (799/0) i `tech-tree` (20/0) względem bazy.

## DEPLOY/PUSH: NIE WYKONANO
