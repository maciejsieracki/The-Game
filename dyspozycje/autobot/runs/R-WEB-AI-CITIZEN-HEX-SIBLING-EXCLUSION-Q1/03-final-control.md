STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-CITIZEN-HEX-SIBLING-EXCLUSION-Q1
GOAL: Zbiór pól z obywatelami dla pickera ulepszeń i wycinki AI wyklucza heksy przegrane na rzecz bliższego miasta tego samego właściciela, tak jak ścieżka gracza i silnik tury.

ZMIANY/COMMIT: SHA końcowy do integracji: 65c22492604138964bb3a0c0fe15213b72a785e6 (obrona r1; na 49a12a72d / 5df619fa1 operatora; baza c9103e161). Diff c9103e161..65c224926 = ai.ts, main.ts, nowy test gra/tools/ai-citizen-hex-sibling-exclusion-test.cjs, runs/<ID>/**. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle. git diff --check czysty. Diff kodu minimalny (nowa eksportowana aiWorkedHexKeysForCity, pole AITurnOpts, obliczenie raz na turę w main.ts).

WERDYKT ZARZUTOW (NAPRAW / ODDAL / DECYZJA):
1. Brak pilnowania wiringu w T3: NAPRAWIONE przez obronę (T4 + T5). ODDAL (zamknięte). Zweryfikowane mutacją.
2. Brak metryki tartaka/drewna i liczby wyciętych pól: ODDAL. Zmiana dotyczy wyłącznie zbioru pól obywateli; tartak nie jest w pickerze żywności; regresje ai-improvements i ai-food-only zielone. Metryka NIE_ZMIERZONO (jawnie).
3. Przyczyna wczesnych chybień s42 t1-7 (oraz s18 4, s7 9): ODDAL do osobnego tematu diagnostycznego (dispatch zabrania zmiany bramki Pracy bez zgody; hipoteza oznaczona jako hipoteza). Nie blokuje.
4. s42 "po" 21/30 tur: ODDAL. Wynik 20 jak w przebiegu 30-turowym; nie wpływa na poprawność zmiany.
5. Nadpisanie scratchpad/mut: ODDAL. Higiena, poza repo.
6. Obliczenie raz na turę (nieaktualne po założeniu miasta w tej samej turze): ODDAL. Efekt znikomy, kierunek bezpieczny, spójne z main.ts ~l.37210/37366.
Brak pozycji NAPRAW pozostających -> PASS.

TESTY (powtórzone samodzielnie na 65c224926, gra/ po npm ci --ignore-scripts):
- tsc --noEmit: EXIT=0.
- ai-citizen-hex-sibling-exclusion-test: 18 OK / 0 FAIL.
- Mutacja ai.ts (excludeByCity?.get(city.id) -> undefined): 12 OK / 6 FAIL (w tym decyzje AI).
- Mutacja main.ts (usunięta linia opcji): 16 OK / 2 FAIL (T5).
- ai-improvements: 56/0. ai-food-only-worked-hexes: 66/0.
- Nie powtarzałem: pomiarów Chromium (aiRfPersistMissed s18 118->4, s7 97->9, s42 110->20 wg evidence operatora; liczby w evidence zgodne z raportem), ai-test 274/20 (jak baza), pozostałych regresji i determinizmu war-allin-capital-quick (opieram na logach gate-* operatora).
- node_modules usunięty; pliki mutacji przywrócone (git status czysty).

BLOKADY: Brak blokujących. Notatka: pozostałe chybienia AI (s42 t1-7: 20 hex-tur; s18: 4; s7: 9) — przyczyna NIE_USTALONA; rekomendacja osobnego tematu diagnostycznego (hipoteza: bramka Pracy ai.ts ~l.2797). Czas całej tury w Chromium i liczba wyciętych pól AI NIE_ZMIERZONO.

KOLEJNOSC INTEGRACJI: origin/main = 6a4b7419e (od c9103e161 doszły tylko testy/runs R-WEB-TEST-TIMING-STABILIZE-Q1). Zmiana scala się czysto na origin/main (git merge-tree bez konfliktów). Integrować do main niezależnie od origin/rust-port/parity-v2 (b520768b0): zmiana dotyczy wyłącznie gra/ (web), nie dotyka rust-portu; parity-v2 dostaje ją dopiero przy REPIN po końcu weba. Przy łącznym scalaniu z TERRAIN-ID-NAME-MAP-UNIFY i NO-CITIZEN sprawdzić konflikty w ai.ts/main.ts.

RUNDY: 1/5 (obrona r1 uwzględniona)
NASTĘPNY KROK: integracja orkiestratora (merge 65c224926 do main), potem READY_FOR_DEPLOY przy zielonych bramkach.
DEPLOY/PUSH: NIE WYKONANO
