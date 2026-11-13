STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1
GOAL: Usunąć pętlę "ResizeObserver loop" przy otwarciu panelu miasta i przy "Więcej/Mniej szczegółów" (karta jednostki), które powodowały overlay BOOT ERROR; filtr tylko dla tego jednego komunikatu.
ZMIANY/COMMIT: baza origin/main 81e357dee (worktree HEAD = 81e357dee przed pracą). Allowlista zachowana: gra/src/ui/cityUxFrame.ts (naprawa), gra/index.html i gra/src/main.ts (filtr jednego komunikatu RO), gra/tools/city-ro-loop-boot-error-test.cjs (nowy, pomiar panelu miasta + mutant), gra/tools/city-ro-loop-expand-click-test.cjs (nowy, pomiar kliknięć "Więcej/Mniej szczegółów" + mutant), dyspozycje/autobot/runs/R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1/10-operator-claude.md. armyMergePanel.ts NIE zmieniany (pomiar nie wykazał w nim pętli). SHA: patrz pole sha w odpowiedzi (commit na gałęzi roboczej worktree, bez push).

PRZYCZYNA (potwierdzona pomiarem, nie hipotezą): fitCitySideTop() tworzyła NOWY ResizeObserver przy każdym wywołaniu; świeżo utworzony obserwator wysyła powiadomienie początkowe, callback wywoływał fitCitySideTop() -> kolejny nowy obserwator -> pętla co klatkę. Chromium raportuje to jako "ResizeObserver loop completed with undelivered notifications" (zdarzenie window 'error'), a łapacz BOOT ERROR w index.html (window.onerror) i main.ts (window 'error') traktował je jak błąd startu.

NAPRAWA: (1) obserwator tworzony raz (lazy), elementy dopisywane/usuwane ze zbioru Set (observe/unobserve tylko przy zmianie zbioru); (2) callback obserwatora planuje przeliczenie na następną klatkę (requestAnimationFrame), bez synchronicznej rekursji; (3) hideCityUxFrame czyści zbiór. Pozycja paneli pod banerami (SIDE_TOP_VAR) bez zmian logiki pomiaru.
Filtr: index.html window.onerror i main.ts window 'error' pomijają WYŁĄCZNIE komunikat zawierający "ResizeObserver loop completed with undelivered notifications". Brak wyciszania innych błędów.

TESTY (surowe liczby z wyjścia):
- Pomiar BEFORE (kod przed poprawką, node tools/city-ro-loop-boot-error-test.cjs): "ZDARZENIA RO w oknie 5000 ms (KOD): 302" -> FAIL (302 > 1).
- Pomiar AFTER: "ZDARZENIA RO w oknie 5000 ms (KOD): 0" -> PASS. WYNIK PASS=1 FAIL=0.
- Mutant (kryterium c, przywrócony stary blok obserwatora): "ZDARZENIA RO ... (MUTANT): 302" -> FAIL. WYNIK PASS=0 FAIL=1. Test czerwieni się przed poprawką.
- Kliknięcia (DODATEK 2, g/h), node tools/city-ro-loop-expand-click-test.cjs:
  - KOD: RO po otwarciu panelu miasta 0; RO w 2 s po "Więcej szczegółów" 0; RO w 2 s po "Mniej szczegółów" 0; brak wyjątków strony. WYNIK PASS=5 FAIL=0.
  - MUTANT (przed poprawką): RO po otwarciu 20; RO po "Więcej szczegółów" 120; RO po "Mniej szczegółów" 121. WYNIK PASS=3 FAIL=2.
- node tools/city-side-panels-below-topbanners-test.cjs (kryterium d): WYNIK (after) PASS=61 FAIL=0.
- tsc --noEmit (npm run build/dev NIE uruchamiane): exit 0, brak wyjścia błędów.
- Bramki referencyjne: logic-test "LOGIC OK (213/213)"; tech-tree-test "20 pass, 0 fail"; research-test "PASSED: 33 / FAILED: 0 / TOTAL: 33"; unit-replace-test "WSZYSTKIE TESTY ZIELONE (21/21)"; combat-test "COMBAT TEST: 6/6 pass". Wszystkie exit 0.
- git diff --check: czysto.

BLOKADY / NIE ZMIERZONO:
- (f) zrzuty ekranu przed/po panelu miasta w evidence/ NIE WYKONANO (skrypt nie zapisuje zrzutów; brak czasu w rundzie 1).
- (h) pełny overlay BOOT ERROR w całej grze (vite + ?playtest=, realne kliknięcie w UI) NIE ZMIERZONO: pomiar odtwarza panel miasta i kliknięcia w bundlu esbuild (bez pełnego index.html z ładowaniem main.ts). Filtr w index.html/main.ts jest zweryfikowany tylko statycznie (kod + tsc), nie na żywo.
- Rekomendowane: przed deployem uruchomić weryfikację na żywo w pełnej grze (vite build do katalogu tymczasowego + Chromium) i potwierdzić brak overlaya przy otwarciu gry i panelu miasta.
- Test ma krok rozpoczęcia RO liczony od zdarzeń window 'error' (zgodnie z dispatchem); nie sprawdza konsoli.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET): zweryfikować diff (3 pliki kodu + 2 testy), powtórzyć pomiar KOD/MUTANT, rozważyć dodanie zrzutów (f) i weryfikacji live (h) przed deployem. Final Control i integracja po stronie orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
