STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-VERIFY-Q1 (tag REALDEF4)
GOAL: zmierzyć na żywo, czy pasywny gracz i gracz-obrońca (suwak podatku 100% Pieniądz) tracą jedyne miasto na świecie nowej gry, w 3 konfiguracjach (max / domyślna / Wysoki ×4 z barbarzyńcami Łatwymi), na 5 ziarnach, do t20; zmierzyć Drewno na ziarnie 778899 i potwierdzić suwak. Zero zmian gry.
ZMIANY/COMMIT: allowlista. Nowe/zmienione: gra/tools/realdef-econ-live.cjs (zmienna REALDEF_CFG: max|domyslna|wysoki-latwi; bez zmian zachowania domyślnego); dyspozycje/analizy/OBRONA-STARTU-WERYFIKACJA-2026-11-27.md (tabela i wnioski); dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-VERIFY-Q1/dane/ (3 pliki econ-REALDEF4-*.jsonl + logi, narzędzie probe). Zero zmian w gra/src, gra/data, WERSJE.md, manifeście, rust-port (git diff --stat potwierdzony: pusty). SHA: patrz pole sha w odpowiedzi (czubek commita).
TESTY:
- Pomiar (liczby z surowego wyjścia runnera / econ.jsonl, 3 konfiguracje × 5 ziaren, po 1 przebiegu, do t20):
  - max P0: strata miasta t10 (4242), t21 (7, po zakończeniu t20), t13 (778899), t16 (11), t10 (2024). 5/5 utrat.
  - max P2: blokada tury t7 (4242, obrońca kupiony t5), t6 (7, obrońca t5), strata t13 (778899), t16 (11), t10 (2024) — na 3 ziarnach brak Drewna, obrońca niekupiony.
  - domyślna P0: blokada „Zakończ turę” w t1 na 5/5 (prognoza Skarbu −5/−6, Skarb 0).
  - domyślna P2: przeżycie do t20 na 4242, 11, 2024 (bez utraty miasta); blokada t1 na 7 (zabraknie 3) i 778899 (zabraknie 2) nawet przy 100% Pieniądz.
  - wysoki-latwi P0: przeżycie do t20 na 4242, 7, 778899, 11; strata t17 na 2024.
  - wysoki-latwi P2: blokada t7 (4242), t6 (7); przeżycie t20 (778899, 11); strata t17 (2024).
- Drewno 778899: zasób = 0 przez 12 tur (P0 i P2). Liczba lasu w promieniu miasta NIE ZMIERZONO (brak hooka do kafelków).
- Suwak: wywołana funkcja UI (applyPodzialHandluGracza); prognoza Skarbu w t2 = 6/turę (4242) i 4/turę (7) przy P0 = 1/turę. Klik w panel NIE ZMIERZONO. Skutek Nauki 0 NIE ZMIERZONO.
- Bramki: git diff gra/src gra/data WERSJE.md = pusty (potwierdzone). tsc / logic / ai-test NIE URUCHAMIANO: kod gry nie zmieniony (dispatch dopuszcza to potwierdzenie).
- Ziarna powtórzone nie były (gra deterministyczna wg r3; dispatch: powtórzenia tylko dla pewności).
- Uwaga środowiskowa: `npm ci` w gra/ (tylko instalacja zależności, bez `npm run build/dev`); bundle live zbudowany narzędziem tools/test-hook-setcitylimit-live-bundle.cjs do katalogu w scratchpad. Żadnych run_in_background, spawn_task, create_session, create_trigger, send_later (długie biegi, które przekroczyły 590 s, zostały przeniesione przez narzędzie w tło automatycznie; czekałem na nie przez tail, nie uruchamiałem ich ręcznie).
BLOKADY:
- NIE ZMIERZONO: konfiguracja „barbarzyńcy wyłączeni”; liczba lasu i dostępność Drewna w t1–10 na 778899; klik suwaka w UI i skutek Nauki 0; liczebność fal barbarzyńców w t15–20 (tylko odległości i obecność jednostek); powtórzenia ziaren.
- Niejednoznaczność: „Wysoki ×4” zinterpretowano jako ustawienie kosztu jednostek (`kosztJednostekPace: wysoki`), zgodnie z runnerem r3 i `settingsReadback`. Maksimum przyjęto jak w r3.
- Pole runnera `firstDefenderTurn` = 2 na domyślnej P2 ziarno 4242 mimo braku zakupu — niezweryfikowane.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje (po Final Control): (a) czy domyślna gra blokuje „Zakończ turę” w t1 dla pasywnego gracza zamierzenie — sprawdzić przyczynę (kandydat: domyślny podział podatku Nauka 60 / Pieniądz 30 / Luksus 10); (b) czy zlecić osobny temat na mapę lasu w promieniu miasta 778899 i na konfigurację „barbarzyńcy wyłączeni”. Decyzje balansu — pytania ABC do właściciela po turnieju.
UWAGI-DLA-ORKIESTRATORA:
- Kandydat BŁĄD-GRY (do weryfikacji, nie zmieniano): w domyślnej grze pasywny gracz nie może zakończyć tury 1 na 5/5 ziaren (Skarb 0, prognoza −5/−6); w max prognoza tury 1 = +2. Dane: dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-VERIFY-Q1/dane/econ-REALDEF4-domyslna.jsonl (pole notes, bramka).
- Pasywna utrata miasta jest zjawiskiem max (5/5), a nie domyślnej gry (tam P0 nie przechodzi t1) — wniosek r3 „utrata na świecie nowej gry” dotyczy max i wysoki-latwi (1/5 w tej ostatniej).
- Wskazówka dla następnego pomiaru: P0 w domyślnej grze nie daje danych o utracie; trzeba by odblokować turę 1 realną akcją (poza zakresem tej rundy).
DEPLOY/PUSH: NIE WYKONANO
