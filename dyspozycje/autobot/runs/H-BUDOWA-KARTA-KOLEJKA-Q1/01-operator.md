STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: H-BUDOWA-KARTA-KOLEJKA-Q1
GOAL: Umożliwić otwieranie podstawowej karty szczegółów budynku z listy dostępnych budynków przed zakolejkowaniem, po dodaniu do kolejki oraz dla aktywnej pierwszej pozycji, bez zmiany stanu kolejki.
ZMIANY/COMMIT: `gra/src/ui/cityPanel.ts` — interaktywny, read-only podgląd karty na ikonie aktywnego frontu i oczekujących budynków kolejki; istniejąca ścieżka listy dostępnych zachowana. `gra/tools/building-queue-detail-card-test.cjs` — kontrakt 3 stanów i mutacja kontrolna. Commit funkcji: `8b65a5b1318bd4c82484aa1df372ffa01c464b65`.
TESTY/DOWODY: `node tools/building-queue-detail-card-test.cjs` — PASS, 9/9 (dostępny, oczekujący, aktywny, rozróżnienie jednostek, brak mutacji, mutacja kontrolna). `npx tsc --noEmit` — exit 0, 0 błędów. `node tools/logic-test.cjs` — 213/213. `node tools/city-state-prod-audit-test.cjs` — 17/17. `git diff --check` — exit 0. Podgląd kolejki budynku wywołuje `buildBuildingBuildTabDetailCard` bez `item`, więc karta nie dostaje przycisków mutujących kolejkę; sam callback tylko buduje kartę.
BLOKADY: Brak blokady funkcjonalnej. W drzewie pozostaje nieśledzony katalog `dyspozycje/autobot/runs/H-BUDYNKI-KOSZT-PRACY-50-Q1/` należący do równoległego operatora — nieedytowany i nieobjęty commitami tego tematu.
RUNDY: 1/5
NASTĘPNY KROK: Niezależny Evaluator, następnie ewentualna Obrona i Final Control; Operator nie wykonuje tych ról.
DEPLOY/PUSH: NIE WYKONANO
