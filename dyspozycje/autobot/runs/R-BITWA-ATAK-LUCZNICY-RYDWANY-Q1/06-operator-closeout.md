# Operator closeout — R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1

**Runda:** 2/5 (uzupełniająca walidacja)
**Data:** 2026-10-29
**Branch:** `autobot/R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1-r2`
**Dispatch base:** `2525710c`
**Status:** `PASS-WITH-NOTES` — test Chromium potwierdza rzeczywiste otwarcie i zamknięcie potyczki 28v28 oraz brak błędów konsoli, ale nie wykonuje żywego przebiegu doktryn. Macierz planera ujawniła nadal reprodukowalny przypadek bezczynnego dystansowego. Nie kwalifikuję tego tematu jako naprawionego.

## Recon i zakres

Przed testami sprawdzono czystość drzewa: po dispatchu branch był czysty i jeden commit przed `origin/main`; HEAD: `2525710c`. Przeczytano README, playbook AutoBot, wskazany handoff, dispatch tej rundy, pierwotny dispatch i wcześniejszy Final Control. Allowlista dopuszcza zmianę `battleScene.ts` wyłącznie po potwierdzeniu defektu przez produkcyjny reproduktor.

W `battleScene.ts` planowanie ścieżki oraz aktywacja doktryny są produkcyjne. Istniejące testy skupione podmieniali target selector, `_doAttack` i `_cavalryAction`; potwierdzają routing do akcji, nie prawdziwe obrażenia ani całą aktywację w renderowanej walce. Wykryto również `_rangedFiringStepStaysBehindMelee`, ale w bieżącym kodzie nie ma wywołań tego helpera.

## Wyniki testów

Uruchomione z `gra/`:

- `node tools/battle-ranged-mounted-doctrine-test.cjs` — **PASS 9/9**. Obrona strzela z pozycji; Atak strzela do legalnego celu albo podchodzi; Atak kieruje konnicę/rydwan do planera jazdy; Szturm zachowuje strzały i manewr konnicy. Ograniczenie: test stubuje wykonanie strzału i akcję konnicy.
- `node tools/battle-initial-placement-runtime-test.cjs` — **PASS**. Potwierdza pozycje linii i skrzydeł oraz test wymuszonego fallbacku.
- `node tools/battle-formation-rules-test.cjs` — **PASS**. Potwierdza role, tempo linii Ataku i strzał dystansowych w tej samej aktywacji; nie jest testem pełnego renderu.
- `npm run typecheck -- --pretty false` — **PASS**.
- `node tools/battle-large-mixed-doctrine-matrix-test.cjs` — **FAIL / RED: 4 asercje** w macierzy 36 scenariuszy, 42 jednostki na stronę, 5 aktywacji, doktryny steady/defensive/aggressive, 1–3 rzędy ostrzału i dwa warianty terenu (`engaged`, korytarz z przeszkodami). Macierz zgłasza: łucznik i procarze, którzy kończą w zasięgu bez strzału, oraz procarz, który po 5 aktywacjach nadal jest poza zasięgiem. Reprodukcja występuje dla `steady`, priorytetu bocznego i 2–3 linii dystansowych. Szczegół ostatniego przypadku w konsoli: `atk-slinger-30`, start `(9,35)`, koniec `(11,27)`, najbliższy cel w odległości 5 przy zasięgu 4; trasa przeszła 10 kroków, nie oddał strzału.
- `node tools/battle-large-return-live-test.cjs` — **PASS** dla jego zakresu. Realny Chromium uruchomił aplikację, wygenerował mapę, otworzył produkcyjną bitwę 28v28, zakończył ją przez istniejącą ścieżkę „skip”/wyniku, wrócił na mapę i potwierdził jej dalsze renderowanie, działające wejście kamery i brak błędów strony/konsoli. Nie potwierdza ruchu/strzałów doktryn; zrzut ekranu podczas otwartej walki nie powiódł się, bo odczyt diagnostyczny przekroczył 3 sekundy. Dostępne zrzuty są wyniku bitwy i mapy po powrocie.

Macierz została uruchomiona ponownie po krótkiej próbie poprawki ograniczającej postęp łuczników do przedniej linii. Wynik czterech czerwonych przypadków pozostał bez zmian, więc próbę wycofano. Nie pozostawiłem niepotwierdzonej zmiany produktu ani modyfikacji poza allowlistą.

## Evidence

- [Wynik produkcyjnej bitwy 28v28 w Chromium](chromium-battle-result.png) i [JSON stanu przeglądarki](chromium-battle-result.json).
- [Mapa po powrocie z bitwy](chromium-map-after-return.png).
- Macierz zapisywała szczegółowy JSON, ale jej artefakt usunięto po spisaniu błędów, ponieważ należy do osobnego ticketu BTF; powyżej zapisano dokładne przypadki RED.
- Przegląd kodu: `rg -n "_rangedFiringStepStaysBehindMelee" gra/src/battle/battleScene.ts` wskazał jedynie definicję helpera, bez użycia.

## Kontrola drzewa i ograniczenia

`git diff --check` — **PASS**. Brak zmian produktowych. Usunięto tymczasowy symlink `gra/node_modules` użyty wyłącznie do testów oraz wygenerowany artefakt z katalogu sąsiedniego ticketu. Zostają tylko raport, dwa screenshoty i JSON dowodowy w katalogu tego ticketu. Niczego nie commitowano, nie integrowano, nie wypychano ani nie wdrażano.

Pełny rendering aktywnej, mieszanej bitwy z prawdziwym ruchem i pociskami pozostaje niezweryfikowany. Wyniki macierzy wskazują konkretną lukę do następnej iteracji Operatora: linia dystansowa w doktrynie Atak może zatrzymać strzelca za wolno przesuwającym się oddziałem wręcz, a test musi sprawdzić produkcyjne `_doAttack`/ruch, nie jedynie zastępować ich eventami.
