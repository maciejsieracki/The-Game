# R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1 — niezależny Evaluator (2026-11-10)

## Werdykt

**PASS — kandydat `8784fdd49c5eadb432ebb0e8e23359740bd7d9b5`. OBRONA: POMINIĘTA — BRAK ZARZUTÓW.** Nie znalazłem błędu produktu w zakresie składu oblężenia, doboru stron, zachowania odwodów ani zachowania oddzielnych ścieżek sortii i walki o miasto bez szturmu.

## Niezależne sprawdzenie

Samodzielnie uruchomiłem w izolowanym worktree test skupiony oraz najistotniejsze regresje. Wszystkie zakończyły się powodzeniem:

- `battle-siege-nearby-units-join-test.cjs`: 14/14 — uczestnicy miasta i sześciu sąsiadów, sojusz formalny i wojna z przeciwną stroną, niezależny wróg, pokojowy sojusznik, neutralny i barbarzyńca hostile wobec obu stron, cywile, odległość 2, limit 500, identyfikatory zdarzeń, bonusy per właściciel oraz rozdzielenie sortii i walki otwartej.
- `battle-cap-500-test.cjs`: 59 asercji; `battle-undeployed-units-test.cjs`: 35; `siege-defenders-test.cjs`: 12; `siege-manual-battle-behavior-test.cjs`: 40; `siege-last-stand-sortie-test.cjs`: 71; `ai-siege-requires-war-test.cjs`: 49; `map-siege-test.cjs`: 6; `battle-skip-siege-parity-test.cjs`: 13.
- `siege-nearby-lock-join-test.cjs`: 23/23 logiki i asercji strukturalnych.
- `npm run typecheck -- --pretty false`: PASS.

Przejrzałem również wszystkie użycia `collectSiegeAtkRoster`, `collectSiegeDefRoster` i `cityHasDefenders`. Manualny wall storm, Auto wall storm, cichy szturm AI oraz konsumenci siły/szans AI trafiają we wspólne helpery oblężnicze. Sortia pozostaje na zwykłej ścieżce walki jednostka–jednostka, a walka o nieobwarowane miasto zachowuje osobny builder. W taktycznej bitwie ręcznej nadal instancjonuje się maksymalnie 500 jednostek na stronę; pełny roster służy rozstrzygnięciu po bitwie, a identyfikatory event logu ograniczają straty i postęp weteranów do faktycznie wystawionych jednostek. Auto-rozstrzygnięcie zachowuje dotychczasową alokację strat do pełnego rosteru.

## Ocena zmiany i zakresu

Warunek członkostwa sprawdza formalny aktywny sojusz z głównym właścicielem strony oraz wojnę z głównym przeciwnikiem. Samodzielna wojna z obrońcą nie dołącza trzeciego państwa, a barbarzyńca hostile wobec obu stron nie zostaje automatycznie przypisany. Zbiór przestrzenny pozostaje ograniczony do dystansu heksowego `<= 1`, cywile na sąsiednich polach są odfiltrowani, a priorytet kotwicy/pryncypała utrzymuje dotychczasowego lidera przejęcia i kolejność limitu 500. Wirtualna milicja nadal należy do właściciela miasta. Kontekst cywilizacji, trudności i morale liczony jest per właściciel dołączonej jednostki.

Rozszerzenie dotyka istniejącego `gra/src/game/diplomacy-siege-war-gate.ts`. To jeden dodatkowy plik poza szczegółową listą Operatora w `10-operator-source-model-tests.md`, choć funkcjonalnie jest to najwęższe miejsce do współdzielenia predykatu formalnego sojuszu i wojny bez duplikowania reguł dyplomacji. Zmiana ogranicza się do dodania helpera dla dwóch stron szturmu i nie zmienia ogólnej bramki wojny. Pozostałe zmienione ścieżki są zgodne z listą Operatora; plik testu odwodów aktualizuje wyłącznie oczekiwaną liczbę komunikatów rezerwy po dodaniu komunikatu dla szturmu ręcznego. Nie widzę tu niepowiązanego rozszerzenia zakresu.

## Chromium i ograniczenia pomiaru

`/usr/bin/chromium` jest zainstalowany (`Chromium 154.0.8037.57`). Nie uruchomiłem testu przeglądarkowego: test `siege-blockade-no-recruit-reinforce-test.cjs` próbuje uruchamiać wyłącznie `/opt/pw-browsers/chromium`, więc wykryta przez Operatora odmowa startu jest niezgodnością ścieżki testu/środowiska, a nie brakiem Chromium ani błędem produktu. `siege-nearby-lock-join-test.cjs` również kończy sekcję live jako `NIE_ZMIERZONO`, bez próby uruchomienia przeglądarki. Test nowej zmiany jest źródłowy i nie zawiera scenariusza live. Wynik przeglądarkowy pozostaje zatem **NIE_ZMIERZONO**; nie przypisuję mu statusu PASS.

Test `defense-breakdown-test.cjs` z raportu Operatora nie jest dowodem przeciw poprawce: zgłoszone przerwanie na brakującym `grecy.bonusy` następuje w fixture przed ścieżką zmiany. Nie uruchamiałem go ponownie. Nie stwierdziłem błędu produktu ani niezgodności wymagającej odpowiedzi Operatora.
