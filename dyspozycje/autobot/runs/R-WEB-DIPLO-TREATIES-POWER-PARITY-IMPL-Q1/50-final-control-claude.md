STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1
GOAL: parytet siły (S = X·r, W = X/r, D = S − W płaci słabsza) i ceny ×10 dla rozejmu, NAP, przemarszu, sojuszy i wasala; runda 3: ścieżka AI i AI↔AI, testy, Civpedia/wikiBundle.
ZMIANY/COMMIT: kandydat kodu fd46227922f8c1a99bf8f820de09021361f05ca7 (potomek bazy 7cc59b10f i origin/main 2b950566f — `merge-base --is-ancestor` potwierdzone dla obu). Diff vs 7cc59b10f: 15 plików (ai.ts, diplomacy-proposals.ts, war-weariness.ts, main.ts, wikiBundle.json, rozejm-pokoj.md, 7 testów gra/tools, 2 raporty) — wszystko w allowliście (war-weariness tylko wspólna funkcja; main.ts tylko ścieżki diplo/AI). wikiBundle idempotentny: generator bundle-wiki-for-game.cjs nie zmienia pliku. Ten raport: osobny commit (tylko 50-final-control-claude.md).

TESTY (surowe wyjście, moje uruchomienie na fd46227922; node_modules = symlink do sąsiedniego worktree z identycznym package-lock, brak npm ci przy 3 GB wolnego)
- tsc --noEmit: exit 0, 0 linii.
- 5 bramek: logic-test 213/213; tech-tree 20/0; research 33/0 (ALL GREEN); unit-replace 21/21; combat 6/6. Wszystkie zielone na kandydacie, więc porównanie z bazą dla czerwonych niepotrzebne.
- Temat: diplo-treaties-ai-parity 80/0; diplo-rozejm-parity 25/0; diplo-peace-balance-accept 32/0; diplo-peace-pw-power-ratio 48/0; diplo-peace-price-wiring 14/0; diplo-peace-price-production-paths 15/0; diplo-truce-r4-ai 24/0; diplo-truce-r1 31/0; diplo-truce-impl 94/0; dyplo-bilans-gate-n-e1-reprodukcja 22/0; diplo-json-descriptions-sync 46/46; diplo-wiki-weariness-rate-consistency PASS; diplo-peace-winner-proposal-flow 49/0; diplo-war-peace-sim 25/0.
- Zmiany asercji w 5 istniejących testach przejrzane w diffie: uzasadnione (baza rozejmu 200→2000; A1/A2 przeniesione na 20 tur = pokój + nowa A1r dla rozejmu; zbiór TREATY_GATED z 'rozejm' dodany wcześniej przez TRUCE-Q1; B1 skala ceny rozejmu). Żadna nie osłabia kontroli pokoju.
- Żywy Chromium: NIE ZMIERZONO (build zakazany w dispatchu; dyspozycja dopuszcza NIE ZMIERZONO z powodem).
- Testy browserowe nadpisały PNG w dyspozycje/.../dowody — przywrócone `git checkout`, nie wchodzą do commita.

WERDYKT PER ZARZUT
1. Brak żądania D od gracza przy sojuszu/NAP/przemarszu (AI silniejsze): DO DECYZJI CZŁOWIEKA. Weryfikacja: pozycja 'miasto' jest w koszykach dozwolona tylko dla pokoju/wasala, płatność surowcami/złotem zakazana dispatchem, więc nośnik D nie istnieje bez nowej decyzji produktowej (miasta w pakcie/sojuszu albo zatwierdzenie płatności surowcami — spójne z otwartą decyzją PEACEPWAUD). Kandydat robi bezpieczną stronę: AI słabsze nie składa oferty (przetestowane B1/B5/F3 + mutacje), a gracz-autor słabszy płaci D (bramka treatyParityPowerGate). Silniejsza AI proponująca słabszemu graczowi sojusz/NAP bez D jest asymetrią, ale nie błędem implementacji; to zapis założenia, nie NAPRAW.
2. AI↔AI dla każdego z 6: ODDAL. Zweryfikowane w main.ts (~45700-45750): komendy zaproponuj_sojusz/zaproponuj_pakt są kierowane tylko gdy targetId === 0 (gracz); dla AI↔AI istnieje wyłącznie tor pokój/rozejm i przemarsz — czyli tory dla NAP/sojuszu/wasala AI↔AI nie istnieją w kodzie. Pokryte: rozejm AI↔AI i przemarsz. Zastrzeżenie (nieblokujące): wiring main.ts F1-F4/M3 testowany regexem po źródle, nie wykonaniem; pure-logic (aiTreatyParityDuePn, decideAIDiplomacy) testowane behawioralnie.
3. Pomiar częstości tylko dla decideAIDiplomacy: ODDAL (NIE_ZMIERZONO dla AI↔AI i main.ts, jawnie oznaczone). Zmierzone przez operatora: rozejm AI 185 vs 107 ofert, gorzej 0 z 600 komórek. Spadek sojuszy/NAP/przemarszu AI słabszej mocą jest zamierzony (wybór właściciela B, bez sufitu).
4. Raport 765 słów i etykieta Z3: ODDAL. Etykieta Z3 poprawiona w fd46227922 (diplo-peace-balance-accept 32/0); długość raportu to kwestia formy, bez wpływu na kod.
Brak NAPRAW ⇒ nie FAIL.

BLOKADY: brak. Znane długi bazowe niezależne od kandydata: json-descriptions-sync-test a1 (war-weariness-params.json) i 5 czerwonych dyplo-* w bazie (wg raportu operatora; nie weryfikowane osobno — poza zakresem i bez wpływu na bramki).

UWAGI-DLA-ORKIESTRATORA
- Decyzja produktowa do ewentualnego ABC (nieblokująca wdrożenia): nośnik dopłaty D dla sojuszu/NAP/przemarszu, gdy autorem jest silniejsza AI (miasto w pakcie vs płatność surowcami/złotem). Dziś AI silniejsze proponuje je bez żądania D.
- Wpływ gry: AI słabsze mocą przestaje proponować NAP/sojusz/prośbę o przemarsz; rozejmy AI nie spadają. Tabela S/W/D w 10-operator-claude.md (zgodna z kodem).
- Integrować: SHA commita z raportem (zawiera kod fd46227922 bez zmian) albo samo fd46227922. Przed deployem: merge z main + regeneracja wikiBundle generatorem (main = 2b950566f, bez dryfu).

RUNDY: 3/5 (FC)
NASTĘPNY KROK: integracja orkiestratora (merge, bramki), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
