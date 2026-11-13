# Ponowne otwarcie — rozpoznawalność karty wodza w aktywnym panelu

**Etap 3/11 — przyczyna odtworzona w aktywnej ścieżce UI.**

Zrzut użytkownika po wcześniejszym wydaniu pokazuje wszystkie karty jako zwykłych „Wojowników”. Audyt potwierdził, że `main.ts` przygotowuje metadane roli tylko dla starszego `ArmyStackHud`, którego ścieżka jest wyłączona (`buildArmyStackHudState()` zwraca `null`). Aktywny `.sp-unit-stack-card` w `hexContextTooltip.ts` przekazuje i renderuje wyłącznie `name`; nie przenosi etykiety, roli ani znacznika dowódcy. Dotychczasowy test 5/5 sprawdzał nieaktywny renderer, więc nie zamykał zgłoszenia.

Operator kontynuuje poprawkę aktywnej karty i test tej konkretnej ścieżki Chromium. Nie wdrażano jeszcze zmiany.
