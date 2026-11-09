STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-THRESHOLD-130-TRUST-90-Q1
GOAL: DODATEK 2 (runda 3): merge origin/main (konflikt wikiBundle.json -> regeneracja), próg gotowości AI do sojuszu 0,68 -> 0,54
ZMIANY/COMMIT: gałąź web-wip/ALLY13090-r3, BAZA 1fcd29f5b (FC r2) + merge origin/main b765e4994. Commit 1 = merge + wikiBundle regenerowany; commit 2 = próg 0,54 (gra/data/diplomacy.json, DIPLOMACY_PARAMS w gra/src/game/diplomacy.ts, gra/tools/diplomacy-proposal-test.cjs, ten raport). SHA w komunikacie orkiestratora (git rev-parse web-wip/ALLY13090-r3).

## 1. Merge / konflikt
Jedyny konflikt: gra/src/data/wikiBundle.json. Wzięto wersję z main (git show origin/main:...) i WYGENEROWANO od nowa `node gra/tools/bundle-wiki-for-game.cjs` (22 rozdz., 170 haseł). Bundle zawiera "Relacja 130, Zaufanie 90"; 0 trafień "Relacja 151" / "Zaufanie 91" / "151/91". Brak konfliktów w kodzie gry (ai.ts, diplomacy*.ts) - zero hunków do zgłoszenia.

## 2. Próg gotowości
Porównanie w kodzie to ">=" (diplomacy.ts: willingnessAlly >= progSojuszWillingnessMin; evaluateProposal: >= prog - ulga + kara). Wartość 0,54 -> neutralne civ (dokładnie 0,54) PRZECHODZĄ. Zmieniono dwa miejsca źródłowe tej samej wartości: diplomacy.json (dane) i domyślne DIPLOMACY_PARAMS w diplomacy.ts (lustro/fallback). Parametr nie jest współdzielony z handlem (progHandelWillingnessMin osobny, 0,5). UWAGA: sisterAllianceDiplomacyParams skaluje progSojuszWillingnessMin x0,6/0,3/0,15 - siostrzane miasta-państwa dostają proporcjonalnie niższy próg (0,324/0,162/0,081 zamiast 0,408/0,204/0,102); testy city-state-alliance (74/0) przechodzą. Do decyzji właściciela, jeśli to niepożądane.

Tabela willingnessAlly (równa siła, stancja Rzymianie jako proponent), próg 0,54:
| Cywilizacja | 90/130 | wynik przy 0,68 | wynik przy 0,54 | 100/175 |
| Chińczycy | 0,74 | PASS | PASS | 1,00 PASS |
| Inkowie | 0,69 | PASS | PASS | 1,00 PASS |
| Grecy | 0,64 | NIE | PASS | 1,00 PASS |
| Rzymianie, Egipt, Babilon, Sumer, Celtowie, Germanie, Harappa, Hetyci, Słowianie, Babilonia, Asyria, Fenicjanie (12) | 0,54 | NIE | PASS | 0,90 PASS |
| Zulusi | 0,34 | NIE | NIE | 0,70 PASS |
| DrobnaCywilizacja (miasto-państwo) | 0,00 | NIE | NIE | 0,00 NIE |
Przy 90/130: 15 z 16 cywilizacji przechodzi (było 2 z 16); Zulusi (0,34) nadal odmawiają z komunikatem "Brak gotowości do sojuszu (gotowość X, wymagana 0,54)". Przy 100/175 wszystkie 16 przechodzi także przy 0,68 (Zulusi 0,70) - bez zmiany.
Skrypt pomiarowy: scratchpad meas.cjs (poza repo).

Testy: diplomacy-proposal-test - test "Grecy 90/130 odrzut" odwrócony na accept (gotowość 0,64 >= 0,54); nowy test Egipt 130/90 równa siła accept (0,54 >= 0,54); test Zulusi 130/90 -> odrzut z "Brak gotowości do sojuszu" zostaje; komentarz Chińczycy zaktualizowany na 0,54. Wiki/poradnik/encyklopedia: brak cytatów 0,68 (grep docs/PORADNIK-GRACZA, encyklopedia, bundle = 0), nic do aktualizacji.

## 3. Dług (opis, bez naprawy)
Ulga słodzika (givePn) nie wpływa na gotowość w aiDiplomacyStance: stancja liczy willingnessAlly bez uwzględnienia oferty w koszyku; ulga proponenta obniża tylko próg w evaluateProposal. Efekt: AI "chce" sojuszu (ai.ts/stance) niezależnie od słodzika. Wymaga ABC przed zmianą.

## TESTY
diplomacy-proposal-test 0 FAIL (część jsdom NIE_URUCHOMIONE - brak jsdom), diplo-alliance-gate 18/0, diplomacy-test 148/0, diplomacy-locks 88/0, city-state-alliance 74/0, ai-test 296/0, diplo-aggressor-unit 73/0, diplo-aggressor-wiring 15/0, diplomacy-bilans-unifikacja 27/0, alliance-war-obligation 14/0. diplomacy-alliance-sim uruchomione (output OK). NIE URUCHOMIONO: build/dev (zakaz), testy jsdom.

## LEDGER (REPIN Rust)
rust-port dyplomacja: progSojuszWillingnessMin 0,68 -> 0,54 (diplomacy.json; DIPLOMACY_PARAMS); porównanie >=; skalowanie siostrzanych miast-państw wynika z tego parametru.

BLOKADY: brak
RUNDY: 3/5
NASTĘPNY KROK: Evaluator R3
DEPLOY/PUSH: NIE WYKONANO
