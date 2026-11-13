# R-WEB-POLISH-UI-ROUTES-AUDIT-Q2 — final control

STATUS: PASS-WITH-NOTES — zakres czterech potwierdzonych poprawek tekstowych jest zgodny z allowlistą, a wskazane testy i typecheck przechodzą. Osobna aktywna ścieżka ETA w pickerze badań nadal wymaga follow-upu.
ZAKRES: Niezależny przegląd raportów 00/10/20/30/40, macierzy pokrycia, diffu implementacji, testu rendererów i wskazanej ścieżki badań. Bez zmian produktowych, stage’owania, commita, pushu ani deployu.

## Kontrola wyniku

- `node tools/ui-language-count-renderer-test.cjs` — **39 PASS / 0 FAIL**.
- `npm run typecheck` — **PASS** (`tsc --noEmit`, exit 0).
- `git diff --check` — **PASS**.
- Test bundluje rzeczywiste renderery przez esbuild, a wynik tekstowy sprawdza w JSDOM. Nie uruchamia gry ani Chromium, więc dowodzi treści renderowanych fragmentów w tych scenariuszach, nie zachowania wizualnego w działającej przeglądarce.

Diff produkcyjny w tym runie ogranicza się do czterech zatwierdzonych rendererów (`siegeHud1E.ts`, `empireDetailPanel.ts`, `diplomacyDealDisplay.ts`, `unitRecruitCard.ts`) oraz wspólnego formattera `formatPl.ts`. Dodany test dotyczy tych rendererów. Zmiany zachowują wartości liczbowe, koszty i zachowanie wymiany bezterminowej; nie widzę zmian mechaniki ani danych gry. Pozostałe zmodyfikowane pliki Tech Cards należą do odrębnego, równoległego tematu i nie zostały objęte tą oceną.

Test sprawdza liczebniki 1, 2, 5, 11–14, 21 i 22 dla HUD-u oblężenia, tooltipu rekrutacji, ETA badania w panelu imperium oraz podglądu wymiany, a także kwotę utrzymania i wymianę bezterminową. Nie ma osobnej asercji DOM dla komórki czasu aktywnej umowy ani ETA produkcji armii; ich zmienione interpolacje przejrzałem w diffie. Werdykt pozostaje ograniczony do wskazanych ścieżek i przypadków macierzy, bez deklaracji pełnego audytu całego UI/Civpedia.

## Follow-up poza zakresem

W `gra/src/ui/sciencePicker.ts:1335` aktywny `renderProgress()` nadal buduje dodatnie ETA jako `${state.turnsLeft} tur`, a wynik trafia do renderera pickera. Dla 1 lub 2 tur będzie to niepoprawna forma. Plik nie figuruje na allowliście tej rundy, więc nie zmieniałem go. Zarejestrować tę siostrzaną usterkę w osobnym follow-upie przed uznaniem, że aktywne etykiety ETA badań w UI są w pełni poprawione.

DEPLOY/PUSH: NIE WYKONANO.
