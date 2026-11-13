# R-WEB-POLISH-UI-ROUTES-AUDIT-Q2 — niezależna ewaluacja kandydatów

STATUS: POTWIERDZONE Z UWAGAMI — cztery opisane usterki są rzeczywistymi problemami tekstu w aktywnych rendererach. Nie ma podstaw do zgłoszenia technicznego fallbacku `onPurchaseUnit` jako usterki gracza.
ZAKRES: Read-only przegląd źródeł wskazanych przez operatora oraz weryfikacja, czy wartości i renderery są osiągalne na ścieżkach gracza. Bez uruchamiania gry i bez zmian w kodzie lub danych.

## Werdykty

**UI-01 — „oddziały” przy liczbie obrońców: potwierdzone.** `siegeHud1E.ts` interpoluje `st.garrison` bez odmiany i zawsze dopisuje „oddziały”. `BattleScene._updateSiegeHud()` liczy żywe, nieusunięte jednostki obrońcy i przekazuje wynik do HUD-u. W trakcie widocznej fazy szturmu m.in. liczby 1, 2 i 5 dają błędne formy. To usterka językowa aktywnego HUD-u.

**UI-02 — koszt utrzymania jako „N budynki”: potwierdzone.** W `renderSkarbiecSection()` wartość `utrzB` pochodzi z `economy.bogactwoUtrzymanieBudynkow`, jest składnikiem pieniężnych `koszty`, a gdy jest dodatnia, trafia do podsumowania jako `${utrzB} budynki`. Tabela bilansu obok jawnie renderuje tę samą kategorię jako „Utrzymanie budynków”. To myląca etykieta kwoty, nie licznik obiektów.

**UI-03 — „N tur” w etykietach czasu: potwierdzone z ograniczeniem zakresu.** Wskazane renderery sklejają liczby bez odmiany: ETA badania, komórka pozostałego czasu aktywnej umowy oraz opisy okresu wymiany w `diplomacyDealDisplay.ts`. Wartości są dynamiczne; dla 1, 2–4 i 5+ występują formy wymagające odmiany. Wyjątek „bezterminowa” dla umowy z `turnsLeft === null` jest prawidłowo obsłużony i sam w sobie nie jest usterką. Werdykt obejmuje wskazane miejsca, nie wszystkie użycia słowa „tura” w UI.

**UI-04 — „Rekrutuj N jednostki”: potwierdzone dla ilości większej niż 1.** `unitRecruitCard.ts` aktualizuje `btn.title` po zmianie licznika i dla `quantity > 1` wstawia nieodmienione „jednostki”. To tekst tytułu aktywnego przycisku rekrutacji; stan licznika i callback zakupu są spięte w produkcyjnym panelu miasta. Dla 5 i 21 widoczna wskazówka ma niepoprawną formę.

## Odrzucony kandydat

Gałąź tytułu „Wymaga podpięcia onPurchaseUnit przez silnik” w `unitRecruitCard.ts` jest warunkiem awaryjnym dla braku callbacka. Dwie produkcyjne konfiguracje miasta w `main.ts` przekazują `onPurchaseUnit`, a `cityPanel.ts` używa go do zbudowania ścieżki zakupu. Sam tekst fallbacku nie dowodzi usterki osiągalnej w normalnej konfiguracji gracza; kwalifikuję go jako fałszywy alarm.

## Pokrycie i ograniczenia

Weryfikacja potwierdza lokalne pochodzenie danych oraz przejście do rendererów dla czterech kandydatów i fallbacku. Macierz operatora sensownie rozdziela zinwentaryzowane wejścia od pełnego sprawdzenia treści. Nie odtwarzano kombinacji stanów w przeglądarce, więc nie potwierdzam wizualnego układu ani każdego scenariusza gry; nie jest to potrzebne do potwierdzenia statycznie interpolowanych etykiet. Audyt pozostaje ograniczony do ścieżek i kandydatów tej rundy i nie stanowi kompletnego audytu całej gry.
