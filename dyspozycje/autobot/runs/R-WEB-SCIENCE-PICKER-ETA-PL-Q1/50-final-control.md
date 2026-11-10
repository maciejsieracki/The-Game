# Final Control — R-WEB-SCIENCE-PICKER-ETA-PL-Q1

STATUS: PASS
DOMAIN: GAME / UI
TEMAT: R-WEB-SCIENCE-PICKER-ETA-PL-Q1
GOAL: Poprawna polska odmiana ETA w pickerze technologii przy zachowaniu wartości badań i zachowania stanu null.

ZMIANY/COMMIT: Final Control, etap 8/11, kandydat `772ddf78276fff4d9790b1036ad63e6261d5dc17`. Kandydat jest przodkiem bieżącego `HEAD` (`e68aa2e2feeec6e53f3af35c435bf204e461f1da`). Diff kandydata zawiera tylko cztery pliki z allowlisty: `gra/src/ui/sciencePicker.ts`, focused test `gra/tools/science-picker-eta-real-render-test.cjs`, raport Operatora i zrzut ekranu runu. `git diff --check 772ddf782^ 772ddf782` przechodzi. W checkoutcie pozostały dwa nieśledzone raporty: `20-evaluator.md` tego runu oraz `10-diagnosis.md` innego runu; nie zmieniałem ich.

KONTROLA: PASS. W kodzie dodatnia ETA jest wyłącznie formatowana tekstowo: `1 tura`, `2–4 tury` z wyjątkiem 12–14, w pozostałych przypadkach `tur`. Wartość `turnsLeft` nie jest modyfikowana; pula, cel, procent postępu, warunek `<1 tury` dla niedodatnich wartości oraz renderowanie stanu `null` pozostają na dotychczasowej ścieżce. Dispatchowe przykłady 1/2/5/12/21/22 są pokryte, a test sprawdza pola sąsiednie i oba miejsca wyświetlania ETA.

NIEZALEŻNE POTWIERDZENIA:
- Typecheck uruchomiony w Final Control: `node ./node_modules/typescript/bin/tsc --noEmit` z `gra/` — PASS, exit 0.
- Niezależny pomiar Evaluatora: test realnego DOM w Chromium — PASS, 16/16 asercji, obejmuje 0/1/2/5/12/21/22, stan `null`, oba miejsca ETA, brak błędów strony oraz niezmienność celu/puli/progresu.
- Mutant wymuszający `tur` dla każdej liczby został zabity przez przypadki 2 i 22 (oczekiwany FAIL, exit 1); pozostałe asercje stanu przeszły. Potwierdza to, że focused test wykrywa badaną regresję.
- Nie uruchamiałem drugiej sesji Chromium: niezależny zapis Evaluatora zapewnia wymagane pokrycie rzeczywistego renderera, a operator zgłosił współdzieloną blokadę przeglądarki.

BLOKADY: brak dla zakresu Final Control. Brak potrzeby szerszej regresji dla tej lokalnej, tekstowej zmiany. Integracja pozostaje etapem 9 i należy do orkiestratora; etapy 9–11 nie są zaliczone.
RUNDY: 1/5 (Final Control)
NASTĘPNY KROK: Integracja przez orkiestratora po odczycie niniejszego werdyktu.
DEPLOY/PUSH: NIE WYKONANO
