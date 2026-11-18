STATUS: FAIL (częściowy wynik: (f) zmierzone; (a) i (d) NIE ZMIERZONO)
DOMAIN: GAME (pomiar; zero zmian w gra/src i gra/tools)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1
GOAL: (a) render wiersza D + zrzut; (d) ogon pokoju przy cenie >0; (f) diagnoza r
ZMIANY-COMMIT: baza f172a83bd (kandydat); commit obrony: SHA w polu sha. Pliki: dowody/moc-probe-r1.cjs (PW_DIR/PROBE_URL z env, seria bonusów), dowody/moc-probe-r2.log (nowy przebieg), 30-obrona-claude.md.
TESTY: sonda (realny Chromium headless, bundle /tmp/r1lv zbudowany z 80c4e3625, poza repo), EXIT=0, wynik surowy: bonus_ai=0 → ai 274; 500 → 1274; 1000 → 2274; 2000 → 4274; 5000 → 10274; target 1,3 (bonus 3427) → ai 7128; player 2847 we wszystkich wierszach. Bramki gry nie uruchamiane ponownie (zero zmian w kodzie gry).
BLOKADY: (a) i (d) bez kodu testu i bez zrzutów w tej rundzie; brak hak civTest. Czas nie jest blokadą formalną — to przyznaję.
RUNDY: 2/5 (obrona); ostatni werdykt Evaluatora: FAIL
NASTĘPNY KROK: runda 3 Operatora tylko dla (a) i (d): test renderu + zrzut + asercje tekstu + hak civTest (cena pokoju >0) + mutacja przez kopię pliku; (f): poprawka założenia testu (bonus/2) jako osobny ruch.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. (a) PRZYJMUJĘ. Brak zrzutu i asercji tekstu, wynik = NIE ZMIERZONO. Naprawy w tej rundzie nie ma (wymaga Chromium i nowego testu).
2. (d) PRZYJMUJĘ, bez naprawy. Hak civTest jest w allowliście i nie został dodany; niezbudowany, niezmierzony hak nie jest dowodem. NIE ZMIERZONO, do rundy 3.
3. STATUS PRZYJMUJĘ: zmieniony na FAIL (częściowy).
4. PRZYJMUJĘ. Ladder 16/16 mierzy zapasy, nie render okna i nie ogon pokoju; nie liczę go jako postępu (a) ani (d).
5. PRZYJMUJĘ i NAPRAWIAM. Sonda ma PW_DIR i PROBE_URL z env (bez twardej ścieżki do wf_4474cbc6-012-1). Przebieg r2 (moc-probe-r2.log) potwierdza nachylenie 2: 274/1274/2274/4274/10274 dla bonusów 0/500/1000/2000/5000 przy stałym player=2847.
6. PRZYJMUJĘ część, ODRZUCAM część.
   - Przyczyna nie jest błędem gry: współczynnik „zdobycze” 1→2 to decyzja P-MOC-BALANS-WAGI (Maciej, 2026-08-12), patrz gra/src/game/power-objective.ts:257 i komentarz nad nim. Błąd leży w założeniu testu (bonus 1:1). r = (274 + 2·3427) / 2847 = 2,504.
   - ODRZUCAM „cache nie jest przyczyną, bo to czytanie kodu”. Sonda r2 odczytuje wartość zaraz po setAiPowerBonusForTest (bez przeładowania): po bonus 500 od razu 1274. Stary cache dałby 274, a zmierzona wartość zgadza się z wagą 2. To jest pomiar, nie wniosek z kodu.
   - Test nadal nie osiąga celu 1,3 (założenie nie poprawione); poprawka testu w rundzie 3.
7. PRZYJMUJĘ. Raport skrócony poniżej limitu 400 słów.

## UWAGI-DLA-ORKIESTRATORA
- Wpis LIVETREATY r1 „r = 2,3–2,5” jest wyjaśniony (waga zdobyczy 2, P-MOC-BALANS-WAGI), nie cache.
- Nie utworzono sesji, zadań ani harmonogramów. Procesy w tle: brak.
- /tmp/r1lv (bundle) i /tmp/r1-*.log do sprzątania przez orkiestratora.
