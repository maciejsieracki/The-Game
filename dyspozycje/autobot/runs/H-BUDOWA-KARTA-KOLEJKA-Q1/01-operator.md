# Operator — H-BUDOWA-KARTA-KOLEJKA-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: H-BUDOWA-KARTA-KOLEJKA-Q1
GOAL: Umożliwić otwieranie podstawowej karty szczegółów budynku z listy dostępnych budynków przed zakolejkowaniem, po dodaniu do kolejki oraz dla aktywnej pierwszej pozycji, bez zmiany stanu kolejki.
ZMIANY/COMMIT: Trwała poprawka wyłącznie oracle testu `gra/tools/building-queue-detail-card-test.cjs`: `.detail-card` → rzeczywisty selektor `.entity-card.bld-detail-card` (także licznik kart). Brak zmian produkcyjnego UI. Commit: `04e1f73627354882fa95cde9b19eda93b098208f`.
TESTY/DOWODY: Tymczasowa kopia testu z fallbackiem Chromium `/snap/bin/chromium` — PASS, `building-queue-detail-card: all assertions passed (8)` (8/8: brak pageerror, dostępny hover, oczekujący click, aktywny click, snapshot kolejki, brak callbacków, mutant FAIL, mutant bez pageerror). `npx tsc --noEmit` — exit 0. `node tools/logic-test.cjs` — `LOGIC OK (213/213)`. `node tools/city-state-prod-audit-test.cjs` — `17 passed, 0 failed`. `git diff --check` — exit 0.
BLOKADY: Brak blokady funkcjonalnej. Nieśledzony `01-operator-r3.md` był stanem zastanym i nie został zmieniony ani dodany do commita.
RUNDY: 5/5
NASTĘPNY KROK: Niezależny Evaluator i Final Control; Operator nie integruje, nie deployuje ani nie pushuje.
DEPLOY/PUSH: NIE WYKONANO
