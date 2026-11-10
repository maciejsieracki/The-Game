STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-ARMY-CITY-RECRUIT-ZERO-BATCH-Q1
GOAL: Armia ma niezależne drafty ilości per miasto i typ, dwa równoważne przyciski globalne zamawiają dokładnie zaznaczone ilości, a część przyjęta/odrzucona jest widoczna i zachowana. Panel „Rekrutacja — cała cywilizacja” ma jeden górny przycisk.
ZMIANY/COMMIT: Zmiany tylko w allowliście z `00-dispatch.md`; commit kandydata `10c3cdec6a25f93859b69d7611fe24d705e42e2c` na `codex/army-city-recruit`. Drafty Armii używają klucza miasto+typ i localStorage; nowa/wczytana gra czyści ten stan. Zamówienia używają istniejącej walidacji kosztu, rekrutów, surowców, blokady oblężenia i callbacku zakupu. Przy częściowym budżecie ponawiane są mniejsze partie przez tę samą ścieżkę miasta; przyjęta liczba schodzi z draftu, reszta oraz komunikat pozostają. Karty zwykłego panelu miasta nadal mają minimum/domysł 1. Panel cywilizacji zachowuje górny przycisk i usuwa tylko dolny duplikat.
TESTY: `./node_modules/.bin/tsc --noEmit -p tsconfig.json` PASS. `node tools/empire-mass-recruitment-test.cjs` PASS 45/0 w realnym Chromium: dwa miasta i dwa typy, zero startowe, izolacja draftów, twarde przeładowanie HTTP i remount zachowują ilości, górny/dolny przycisk, dokładne city/type/cost/quantity callbacki, częściowe przyjęcie 2/3, pozostały draft/komunikat, zakup pojedynczy, reset sesji i zwykły panel miasta domyślnie 1. Scenariusz ustawia 150% zoom; dolny globalny przycisk jest widoczny i klikalny, oba przyciski wykonują zakup. `node tools/empire-recruit-all-test.cjs` PASS 31/0: w panelu cywilizacji jest dokładnie jeden przycisk w górnym sticky nagłówku i zachowane są dotychczasowe zakupy/odmowy/częściowe wyniki. `node tools/recruit-card-quantity-real-render-test.cjs` PASS 25/0: kontrakt zwykłej karty min=1 bez regresji. `git diff --check` PASS. Przeglądarka użyła HTTP; brak `file://`.
BLOKADY: Brak.
RUNDY: 1/5.
NASTĘPNY KROK: Niezależny Evaluator.
DEPLOY/PUSH: NIE WYKONANO.
