# R-WEB-POLISH-UI-ROUTES-AUDIT-Q2 — ewaluacja implementacji

STATUS: PASS-WITH-NOTES — zmiany z allowlisty poprawiają cztery zarejestrowane etykiety i zachowują wartości oraz zachowanie wymiany bezterminowej. W przeglądzie sąsiedniej aktywnej ścieżki znaleziono osobną, nadal błędną etykietę ETA w pickerze badań; pozostaje poza allowlistą tej rundy.
ZAKRES: Niezależny przegląd diffu pięciu plików produkcyjnych, testu rendererów i wskazanych konsumentów `formatJednostkiCount`. Bez edycji kodu, stage’owania, przeglądarki, pushu ani deployu.

## Weryfikacja

- `node tools/ui-language-count-renderer-test.cjs` — **39 PASS / 0 FAIL**. Test bundluje rzeczywiste renderery przez esbuild i sprawdza wynikowy tekst w DOM/JSDOM dla liczebników 1, 2, 5, 11–14, 21 i 22, kwotę utrzymania oraz bezterminowy podgląd wymiany.
- `npm run typecheck` — **PASS**, `tsc --noEmit`, exit 0.
- `git diff --check` — **PASS**.

Nie uruchamiałem Chromium: test używa esbuild i JSDOM. Skrypt usunął tymczasowe wejście i bundle po zakończeniu.

## Ocena zmian

HUD oblężenia renderuje „1 oddział”, „2 oddziały”, „5 oddziałów”, „12 oddziałów”, „21 oddziałów” i „22 oddziały”. Kategoria kosztu skarbca opisuje teraz utrzymanie budynków i zachowuje wartość `utrzB`; suma nadal używa niezmienionych wartości utrzymania budynków i jednostek. Panel imperium i podgląd wymiany odmieniają czas przez ten sam poprawny wzorzec 1 / 2–4 poza 12–14 / pozostałe. Dla `turnsLeft === null` podgląd nadal pokazuje cykliczną wymianę bez dopisywania `null` ani terminu. Tooltip rekrutacji korzysta ze wspólnego `formatJednostkiCount` i nie zmienia ilości ani kosztu.

Zmiana wspólnego formattera poprawia także jego istniejących konsumentów: etykietę stosu, listę armii, panel scalania oraz komunikaty rozwiązywania rekrutów. W tych kontekstach „12 jednostek” i „21 jednostek” są poprawne; „22 jednostki” również zachowuje właściwą odmianę. Nowy test sprawdza formatter przez tooltip rekrutacji, a nie każdy z tych konsumentów osobno.

## Pozostała obserwacja

W `gra/src/ui/sciencePicker.ts` `renderProgress()` nadal składa dodatnią wartość jako `${state.turnsLeft} tur` (linia 1335), a jego wynik trafia do renderowanego pickera (linia 1414). To aktywna siostrzana ścieżka ETA badań: np. wyświetli „1 tur” i „2 tur”. Nie należy przypisywać jej do zakresu czterech kandydatów operatora ani edytować w tej ewaluacji, bo `sciencePicker.ts` nie figuruje na allowliście rundy 2. Warto zarejestrować ją osobno przed uznaniem, że wszystkie etykiety ETA badań w UI są poprawne.

To spostrzeżenie nie zmienia wyniku dla wskazanego diffu: wszystkie cztery zarejestrowane poprawki są potwierdzone, a w pięciu plikach produkcyjnych nie widzę zmian mechaniki ani wartości gry. Werdykt nie oznacza kompletnego audytu pozostałych ścieżek UI.
