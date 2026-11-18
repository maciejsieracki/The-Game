STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na żywo; bez zmian logiki gry)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1
GOAL: (a) render wiersza D okna traktatu, (d) ogon płatności pokoju złoto→brąz/żelazo/rudy przy cenie >0, (f) diagnoza anomalii r = 2,3–2,5 przy zadanym 1,3.
ZMIANY-COMMIT: baza 80c4e3625eb946daed01909cdec6b6a5f33d740d (origin/main). Ten commit: tylko raport i dowody (dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1/). Brak zmian w gra/src i gra/tools.
TESTY (surowe wyniki):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- Build vite poza repo: /tmp/r1lv (exit 0)
- Chromium: istniejący tools/diplo-treaty-pay-ladder-live-verify-test.cjs: 16/16 passed (log: dowody/ladder-16of16-r1.log)
- Dowód (f): dowody/moc-probe-r1.cjs + moc-probe-r1.log (realny Chromium, ten sam ciąg wywołań co test)
BLOKADY: (a) i (d) nie zmierzone w tej rundzie, patrz tabela. Brak zrzutów (wymóg zrzutu dla (a) niespełniony, więc (a) = NIE ZMIERZONO).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o rundzie 2 dla (a) i (d). Dla (d) potrzebny hak civTest ustawiający cenę pokoju >0 w src/main.ts (poza tą rundą, bo wymaga decyzji o zakresie hooka).
DEPLOY/PUSH: NIE WYKONANO

## Tabela
| Punkt | Status | Dowód / powód |
|---|---|---|
| (a) render wiersza D + zrzut + asercja tekstu | NIE ZMIERZONO | Brak nowego testu renderu okna i zrzutu w tej rundzie (czas). Istniejący test mierzy stan zapasów, nie render okna (jego własny nagłówek to potwierdza). |
| (d) ogon pokoju złoto→brąz/żelazo/rudy, cena >0 | NIE ZMIERZONO | Brak haka do ustawienia ceny pokoju >0 w gra/src/main.ts. Pokrywa to tylko istniejący test (L-A/L-B/L-C), który mierzy ogon płatności traktatu przemarszu, a nie pokoju. |
| (f) diagnoza anomalii r | ZMIERZONO (przyczyna ustalona częściowo) | Patrz niżej. |

## (f) Diagnoza anomalii r
Pomiar (Chromium, ten sam ciąg co test):
- po setAiPowerBonusForTest(ai,0): ai=274, player=2847
- po setAiPowerBonusForTest(ai,0..5000) (osobny przebieg): ai = 274 + 2·bonus (bonus 500→1274, 1000→2274, 2000→4274, 5000→10274). Nachylenie = 2, nie 1.
- po ustawieniu bonusu wyliczonego jak w teście (round(1.3·2847 − 274) = 3427): ai=7128, player=2847, r = 2,504.
Przyczyna: test zakłada, że składnik zdobyczy wchodzi do mocy w stosunku 1:1. W grze wchodzi z współczynnikiem 2. Zatem r = (274 + 2·3427)/2847 = 2,504, dokładnie zgodnie z wynikiem. Cache Mocy NIE jest przyczyną: getPowers czyta świeżo, a setter odświeża cache (refreshObjectivePowerCache).
Otwarte: czy współczynnik 2 jest zamierzony (np. zdobycz liczona w dwóch składnikach w buildObjectivePowerForOwner, src/main.ts ~2946 i ~2998) czy to błąd gry. Nie rozstrzygnięte w tej rundzie, bo wymaga decyzji o wadze składnika. Jeśli błąd, poprawka i reprodukcja to kandydat na osobny temat R-WEB-*. Poprawka testu (dzielenie bonusu przez 2) jest po stronie testu, nie gry, i nie została wykonana.
Uwaga: istniejący test loguje r bez asercji, więc przy tym błędzie nie kłamie, ale jego cel 1,3 nie jest osiągany.

## UWAGI-DLA-ORKIESTRATORA
- Wpis w rejestrze LIVETREATY r1: „r = 2,3–2,5” jest wyjaśniony: skutek współczynnika 2 zdobyczy w Mocy, nie cache.
- Zasada przeciw samooszukiwaniu: nie wykonano mutacji źródła czerwieni dla (f), bo to diagnoza, nie PASS. Test L-A/L-B/L-C nie był mutowany.
- Nie utworzono żadnych sesji, zadań ani harmonogramów.
- Procesy w tle: brak (wszystkie uruchomienia na pierwszym planie, zakończone).
- Ścieżki /tmp: /tmp/r1lv (bundle, ok. 100 MB), /tmp/r1probe (sondy), /tmp/r1-*.log (logi). Do sprzątania przez orkiestratora.
- gra/node_modules zainstalowane (npm ci --ignore-scripts) w worktree wf_4474cbc6-012-1; do usunięcia po zakończeniu.
