STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-STARVATION-DESIGN-Q42C (tag STARVEQ42C)
GOAL: obrona Operatora po ocenie Evaluatora 73035e211 (kandydat 7d7f5f0e7). Poprawić dokument inwentarza, model i opis w odpowiedzi na zarzuty 1–6. Bez zmian kodu gry (gra/src, gra/data).
ZMIANY-COMMIT: commit obrony (SHA w polu sha wyniku). Allowlista: dyspozycje/analizy/GLOD-ZAMIAST-BLOKADY-2026-11-28.md, gra/tools/starvation-model.cjs, dyspozycje/autobot/runs/R-WEB-STARVATION-DESIGN-Q42C/model-output.txt, dyspozycje/autobot/runs/R-WEB-STARVATION-DESIGN-Q42C/30-obrona-claude.md. Zero zmian gra/src i gra/data. Baza kandydata 7d7f5f0e7 (checkout --detach).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Dokument (G2 „Koniec okna łaski”, §5 DECISION_REQUIRED G2, §5 pkt G2) podawał „barbarzyńcy atakują od t17” jako fakt. Poprawiono: od t17 są obozy i spawny (12–13 obozów w t17); atak na gracza do t30 NIE zaobserwowano (foreignNear = 0 w turach 1–30, OKNO-LASKI-15-TUR-SKUTKI l. 24); brak obrony w t17–t30 oznaczono jako hipotezę NIE ZMIERZONO.
2. PRZYJMUJĘ. Pomiar żywy nie został podjęty. STAN WIĄŻĄCY pkt 1 i §8 zapisują: „nie podjęty (brak próby; nie wykazano niemożliwości pomiaru)”. Nie uruchamiałem Chromium w tej poprawce; pomiar G1–G3 zostaje do zlecenia jako osobny temat.
3. PRZYJMUJĘ. Dodano jawny blok „Założenia modelu i wrażliwość” (§3): S0 stałe t16–t30, bez wzrostu miasta, racji i zapasu Spichlerza (w t16 = 1, pominięty), koszt 16/jednostkę, rozbieżność HUD −30 vs bramka −18 niewyjaśniona. Dodano do modelu sekcję WRAŻLIWOŚĆ (S0 10–18 × HP_FRAC 0,06/0,08/0,10, 15 wierszy). Wynik: pierwsza utrata jednostki = t27 we WSZYSTKICH 15 wierszach; zgony do t30 = 1–2 (2 tylko dla HP 0,10 i S0 10–14); tury głodu 12–15. Wynik „t27” jest stabilny względem tych założeń; liczba jednostek zależy od S0 i HP_FRAC. Zachowano pierwszą część pliku model-output.txt bez zmian (diff: tylko 20 dopisanych linii).
4. PRZYJMUJĘ. Dowód z kodu: `nnsUnitIsDefender` (main.ts l. 7780–7784) zwraca true dla oblegaCityId, isGeneral, embarked oraz chronionych id; w pętli AI (l. 7955) pole `obronna` jest przekazywane, a `no-negative-stocks.ts` l. 622–631 kieruje obronne do osobnej listy, które nie są rozwiązywane (rozwiązanie tylko wsparcia). Stąd „AI de facto G2” było błędne. Poprawiono §2 (AI), §4 G2 (ryzyko dla AI), §5 DECISION_REQUIRED G2, §6 UWAGI. Model G2 usuwa obrońcę w mieście (Łucznik kupiony w t5 w pomiarze żywym).
5. CZĘŚCIOWO PRZYJMUJĘ. Dodano treść z nagłówków (przeczytane ręcznie w tej rundzie) dla 7 testów: no-negative-stocks-c2, end-turn-block-event, end-turn-gate-live, live-nns-gate-smoke, early-grace-15, no-negative-stocks-c3-turn, no-negative-stocks-projection (+ no-negative-stocks-test). Nadal NIE przeczytano pełnej treści i asercji; `no-negative-stocks-endturn-test.cjs` pozostaje oznaczony „nazwa, treść NIE przeczytana”. Zakres do potwierdzenia przy implementacji.
6. PRZYJMUJĘ. (a) SHA: podaję w polu sha wyniku (czubek tej pracy). (b) G1: dodano akapit „Mnożnik ubytku”: model ignoruje `lud_spadek_proc` i wiele miast; `applyHungerPenaltyV85` (population-growth-v85.ts l. 385–410) dodaje mnożnik do długu, więc przy mnożniku > 1 ubytek rośnie; przy 0 wynik się nie zmienia. Sumy dla wielu miast NIE ZMIERZONO.

TESTY (surowe wyniki w tej rundzie):
- node gra/tools/starvation-model.cjs: wyjście zapisane do model-output.txt; pierwsze 20 wierszy (baseline + G1/G2) bez zmian względem poprzedniej wersji (diff: 20 dopisanych linii, 0 usuniętych). Sekcja WRAŻLIWOŚĆ: 15 wierszy, t27 we wszystkich.
- Bramki kodu gry NIE uruchamiano ponownie: zmiany nie dotyczą gra/src ani gra/data; ostatnie wyniki bramek (tsc 0, endgate-lever-baseline 5/0, no-negative-stocks-end-turn-gate-levers 34/0, end-turn-gate-projection-only 49/0 itd.) pochodzą z rundy 1 (Operator) i Evaluatora 73035e211.
- git diff --check: CHECK-OK.

BLOKADY: brak (podpis commitów: /tmp/code-sign jest dowiązaniem do /opt/env-runner/environment-manager; zobacz wynik commita).
RUNDY: 2/5 (obrona po ocenie Evaluatora 73035e211; kod rundy 1: 7d7f5f0e7).
NASTĘPNY KROK: Evaluator (ponowna ocena 2/5) → Final Control. Przed pytaniem ABC o kształt głodu: (a) pomiar żywy G1–G3 jako osobny temat (Chromium, maksimum, t16–t30, ziarna 11 i 7); (b) decyzja, czy parytet z AI obejmuje ochronę obrońców w G2; (c) decyzja, czy atrycja HP zostaje (G3). Pytania ABC wg zasad orkiestratora, bez mechanizmu w pytaniu.
UWAGI-DLA-ORKIESTRATORA: rozbieżność HUD −30 vs bramka −18 (OKNO-LASKI l. 13) wymaga wyjaśnienia w kodzie przed implementacją C; komunikat bramki proponuje „obniżkę racji +12” przy suwaku zablokowanym na 0 (OKNO-LASKI §2.1) — osobna obserwacja do oceny właściciela; testy `no-negative-stocks-endturn-test.cjs` do przeczytania przed implementacją.
DEPLOY/PUSH: NIE WYKONANO
