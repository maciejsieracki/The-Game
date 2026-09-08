# Operator runda 4 — H-BUDOWA-KARTA-KOLEJKA-Q1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: H-BUDOWA-KARTA-KOLEJKA-Q1
GOAL: Zweryfikować rzeczywisty FAIL runtime karty dostępnego budynku po udostępnieniu Chromium i naprawić wyłącznie realny defekt w allowliście.
ZMIANY/COMMIT: Brak zmian produkcyjnych. Zapisano wyłącznie ten raport. Wymagana decyzja, czy zaktualizować wadliwy oracle testu z `.detail-card` na produkcyjny selektor `.entity-card` / `.entity-card.bld-detail-card`.
TESTY: Tymczasowa kopia `gra/tools/building-queue-detail-card-test.cjs` z fallbackiem `/snap/bin/chromium` uruchomiła Chromium i odtworzyła FAIL: `PASS brak błędów runtime/pageerror`, następnie `FAIL dostępny budynek renderuje i pokazuje kartę przez realny hover`. Diagnostyka wyniku: `availableCard=false`, `queueCard=false`, `activeCard=false`, przy `queueIcon=true`, `activeIcon=true`, bez mutacji kolejki i bez callbacków zapisu. Przyczyna: test szuka `document.querySelector('.detail-card')`, natomiast produkcyjny `renderEntityCard()` tworzy klasę `entity-card`, a karta budynku dostaje dodatkowo `bld-detail-card`; w aktualnym `cityPanel.ts` nie istnieje klasa `.detail-card`. Tymczasowa kopia z jedyną zmianą diagnostyczną `.detail-card` → `.entity-card` przeszła Chromium: 8/8 (brak pageerror, dostępny hover, oczekujący click, aktywny click, snapshot kolejki, brak callbacków, mutant FAIL, mutant bez pageerror). Kopie i artefakty tymczasowe usunięto. `npx tsc --noEmit` PASS. `node tools/logic-test.cjs` PASS (`LOGIC OK (213/213)`). `node tools/city-state-prod-audit-test.cjs` PASS (`17 passed, 0 failed`). `git diff --check` PASS.
BLOKADY: Test tematu jest niespójny z aktualnym produkcyjnym rendererem kart po migracji do `entity-card`; jego aktualizacja wymaga jawnej decyzji, nie może zostać wykonana po cichu. Nie ma potwierdzonego defektu w ścieżce UI. Nie zmieniano `cityPanel.ts`, testu produkcyjnego ani plików poza raportem.
RUNDY: 4/5
NASTĘPNY KROK: DECISION_REQUIRED — właściciel/Evaluator powinien zatwierdzić poprawkę oracle testu na `.entity-card.bld-detail-card`; po decyzji uruchomić test tematu w wersji kanonicznej i ponowić bramki. Bez decyzji nie deklaruję PASS kanonicznego testu.
DEPLOY/PUSH: NIE WYKONANO
