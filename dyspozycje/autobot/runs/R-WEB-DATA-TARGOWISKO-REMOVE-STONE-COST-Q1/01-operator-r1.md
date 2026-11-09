STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DATA-TARGOWISKO-REMOVE-STONE-COST-Q1
GOAL: Targowisko (Rynek, `targowisko`, epoka Kamienia, tech Wymiana) nie wymaga kamienia: koszt_surowce = samo drewno 30 (jak przed FALA 573). Studnia (25/25) i Kamienne kręgi (40/40) zostają z kamieniem.
BAZA: origin/main = 264aebdf7 (FALA 574); worktree wf_68d15dcd-f3e-1 startował z tego SHA.

ZMIANY/COMMIT:
- Kod, dane, testy i SPEC: commit 331b8bf5e. Pliki:
  - gra/data/buildings.json: tylko targowisko.koszt_surowce {drewno 30, kamien 30} -> {drewno 30}.
  - gra/tools/koszty-surowcowe-test.cjs: Targowisko usunięte z mapy DREWNO_KAMIEN; studnia, kamienne_kregi, stela, kamieniarski bez zmian.
  - gra/tools/building-cost-resource-availability-test.cjs: STONE_NO_MURARSTWO_EXCEPTIONS = ['kamienne_kregi','studnia'] oraz komentarz nagłówka.
  - gra/tools/budynki-koszt-pracy-50-test.cjs: RESOURCE_BASELINE_SHA256 = 4855006679bf59f7a1a1e5709ff44374bf76a611acfa15c76bd7a7a4e4b07dea (poprzednio 71bed2878090dd9d26a88f2ade6c9a62bf2f31b00753c101f9974c71ddb5d542).
  - dyspozycje/SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md: aneks 2026-11-09 (2) oraz wpis długu REPIN Rust.
- Karty NIE zmieniane: gra/data/building-cards-top5.json dla targowisko nie zawiera tekstu o kamieniu, a top3 („Nie stawia żadnych dodatkowych wymagań surowcowych poza kosztem budowy”) pozostaje prawdziwe.
- Ten raport: dyspozycje/autobot/runs/R-WEB-DATA-TARGOWISKO-REMOVE-STONE-COST-Q1/01-operator-r1.md (commit osobny).
- Nie zmieniano: WERSJE.md, gra-robocza/, pozostałe pliki gra/. Nie użyto git add -A. Nie pushowano.

ZAŁOŻENIA (rozstrzygnięte w dokumencie, bez pytań):
- Utrzymanie surowcowe Targowiska: bez zmiany kodu, automatycznie z koszt_surowce (economy-upkeep.ts, 1 szt./turę za każdy typ obecny w koszcie). Targowisko płaci teraz 1 drewna/turę zamiast drewna i kamienia.
- Dług REPIN Rust zapisany jako wpis w aneksie SPEC. W repo nie ma osobnego rejestru REPIN w dyspozycje/rust-port, a WERSJE.md pominięto zgodnie z dispatchem.

TESTY (w gra/ przez tymczasowy symlink node_modules -> esbuild ze scratchpada; symlink usunięty przed commitem):
- koszty-surowcowe-test.cjs: 160 pass, 0 fail (zmieniony, PASS)
- building-cost-resource-availability-test.cjs: 58 pass, 0 fail (zmieniony, PASS)
- budynki-koszt-pracy-50-test.cjs: 138 pass, 40 fail. Fingerprint koszt_surowce PASS. 40 FAIL to itemCost (kosztBudowy/przyrostKosztu, np. pretorium, trybunal, mury, koszary). Na HEAD jest 41 FAIL (z nieaktualnym fingerprintem), więc 40 jest sprzed tego tematu. Targowisko nie występuje wśród FAIL.
- ekonomia-5x-inwariant-test.cjs: 228 pass / 50 fail (HEAD: 229 / 50). Jedyna różnica to licznik „sprawdzono 103 -> 102 niezerowych pól koszt_surowce”, oczekiwany skutek. Lista 50 FAIL identyczna z HEAD.
- resource-usage-breakdown-test.cjs: 98 pass / 2 fail, identycznie na HEAD (sprzed tematu).
- mennica-magazyn-test.cjs: 34 pass / 7 fail, identycznie na HEAD (sprzed tematu).
- unit-epoch-cost-test.cjs: 57 pass / 0 fail
- emporion-building-test.cjs: 47 pass / 0 fail
- granary2-tech-data-guard-test.cjs: 14 pass / 0 fail
- building-stock-visibility-test.cjs: 7 pass / 0 fail
- prereq-budynkow-test.cjs: 60 pass / 0 fail
- building-epoch-cost-implementation-test.cjs: 20 pass / 0 fail
- deposit-building-gate-test.cjs: 50 pass / 0 fail
- building-queue-refund-test.cjs: 5 pass / 0 fail
- spichlerz-widocznosc-test.cjs: 45 pass / 0 fail
- NIE_ZMIERZONO: generatory kart (--check) i testy przeglądarkowe (karta bez zmian, nie były wymagane); pełny zestaw testów gry (npm test) nie był uruchamiany, bo worktree nie ma pełnych node_modules.

BLOKADY: brak blokad merytorycznych.
Uwaga procesowa: przy starcie wolne miejsce na / wynosiło 3,9 GB, czyli poniżej progu 4 GB dla tematu webowego. Operator nie instalował zależności, używał istniejącego esbuild, a zmiana nie tworzy artefaktów w repo.

RUNDY: 1/5 (Operator, runda 1; dispatch bez DODATKU)
NASTĘPNY KROK: Evaluator (Sonnet) na commit 331b8bf5e. Sprawdzić allowlistę i diff, trzy zmienione testy oraz pre-existing FAIL-e (budynki-koszt-pracy-50: 40; ekonomia-5x: 50) jako zgodne z HEAD. Potem Final Control i integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
