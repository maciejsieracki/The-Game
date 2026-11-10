# P1.7 — Ustawienia gry i walidacja wyboru przed startem (żywy Chromium)

**Temat:** R-RUSTPORT-P1-7-SETTINGS-VALIDATION-Q1 · **Runda:** 1/5 · **Pin:** `main` = `edb8fb56`

## 1. Metoda i dowody

- Izolacja: świeży klon repo w scratchpadzie sesji, `git checkout edb8fb56`, `npm ci` w `gra/` (71 pakietów). Oryginalne repo nie zostało zmienione w `gra/**`.
- Vite bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5180 --strictPort` (PID 12195), `predev` pominięty. Odpowiedź HTTP 200, po zakończeniu proces ubity (PID 12195 nieobecny), port 5180 zwraca brak połączenia (curl exit 7).
- `git status gra/data` = 0 linii w klonie i w oryginalnym repo, przed i po sesji.
- Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, Playwright z `gra/node_modules`, viewport 1600×900.
- Trzy przebiegi sond (skrypty w scratchpadzie, nie w repo). Odczyt DOM z `.srow`, `.card`, `button.nb.next`, `button.start`.
- Zrzuty: `dyspozycje/rust-port/p1/screenshots/P1-7-settings-validation-00` … `-10` (11 plików, PNG 1600×900 RGB, realne ekrany, nie puste).
- Numery linii w §2–§4 są weryfikowane względem `git show edb8fb56:gra/src/ui/newGameFlow.ts` i `mainMenu.ts` (np. `s.idx` formuła: newGameFlow l. 1583, mainMenu l. 369; `canStart` l. 1515; `disabled` karty l. 1460; `renderSettStep` l. 1903; `SETT` l. 699; `epochHasCivs` l. 588). Working tree `gra/` na gałęzi roboczej (HEAD 26a542ba) ma inną zawartość pliku i inne numery linii; nie są one podstawą tego raportu.
- Konwencja nazw zrzutów: nazwa pliku opisuje ZAMIERZONY stan testu, nie stan widoczny na obrazie. Zrzuty `-05-nowa-gra-krok3-brak-wyboru` i `-09-hotseat-fotel2-brak-wyboru` pokazują na obrazie auto-wybraną cywilizację (Rzymianie), a nie brak wyboru (odczyt wizualny obu plików w Obronie, runda 1).
- Zrzuty `-00-menu`, `-04-nowa-gra-krok2-epoka`, `-05-nowa-gra-krok3-brak-wyboru` są BAJTOWO IDENTYCZNE z plikami wcześniejszych tematów (md5 `e0593a5e…` = `P1-3-intro-start.png`; `3449170b…` = `P1-4-epoch-selection.png`; `18d433e0…` = `P1-5-civ-selection-01-kamien.png`). Zapisane w tej rundzie (mtime 20:22), ale tożsamość bajtowa oznacza ten sam render tego samego stanu (ten sam pin, viewport, DOM). Świeżego, niezależnego porównania renderu nie wykonano w tej rundzie; to otwarte do potwierdzenia przez Final Control.

## 2. Ekran Ustawienia (menu główne → „Ustawienia”)

Źródło: `gra/src/ui/mainMenu.ts` (`renderSettings` l. 357–378, `SETTINGS` l. 64–70), dane: `gra/data/ui-params.json` → `menu.ustawienia`.

| Pozycja | Kategoria | Opcje (wartość / opis) | Domyślnie | Zachowanie w UI |
|---|---|---|---|---|
| Muzyka | audio | Wył. / Cicho / Średnio / Głośno (Bez muzyki, 20%, 55%, 90%) | Średnio (55%) | Strzałki ‹ › przełączają cyklicznie; wywołuje `onSettingsChange` |
| Efekty dźwiękowe | audio | Wył. / Cicho / Średnio / Głośno (Bez efektów, 20%, 55%, 90%) | `domyslny` = 2 (Średnio), ale w DOM pokazano Cicho (20%): `syncMenuAudioVolumes` (`mainMenu.ts` l. 101–110) dopasowuje indeks do bieżącej głośności audio | Jak wyżej |
| Język | inne | Polski / English (planowane) | Polski | Przełącznik cykliczny. Po kliknięciu wartość zmienia się na „English (planowane)”. Zmiany interfejsu na angielski nie zaobserwowano; etykieta wskazuje funkcję jako planowaną |

Wideo i sterowanie: w tym ekranie brak takich pozycji. Ekran ma `#cm-back` („← Wstecz do menu”) i nie ma zapisu do pliku. Ustawienia menu nie są walidowane.

Zrzuty: `-01-ustawienia.png`, `-02-ustawienia-po-zmianie.png`.

## 3. Kreator nowej gry — ustawienia rozgrywki (krok 4 z 5)

Źródło: `gra/src/ui/newGameFlow.ts` (`renderSettStep` l. 1903+, `SETT` l. 699), dane: `ui-params.json` → `nowa_gra.ustawienia`. Widoczne w DOM (12 wierszy z danych, bez zmian):

| Ustawienie | Opcje | Domyślnie |
|---|---|---|
| Poziom trudności | Łatwy / Normalny / Trudny | Normalny |
| Rozmiar mapy | Malenki / Mały / Standardowy / Duży / Ogromny / Super Huge | Standardowy |
| Typ świata | Kontynenty / Pangea / Wyspy / Ziemia | Kontynenty |
| Prędkość gry | Standardowa / Szybka / Długa | Standardowa |
| Miasta-państwa | liczba (6 wartości) | 6 |
| Liczba cywilizacji | liczba (7 wartości) | 7 |
| Surowce na mapie | Mało / Normalnie / Dużo | Normalnie |
| Rzeki | Mało / Normalnie / Dużo | Normalnie |
| Pustynie | Mało / Normalnie / Dużo | Normalnie |
| Jakość grafiki mapy | Niska / Średnia / Wysoka | Średnia |
| Las | Mało / Normalnie / Dużo | Normalnie |
| Góry i wzgórza | Mało / Normalnie / Dużo | Normalnie |
| Chatki z nagrodami | Włączone / Wyłączone | Włączone (domyślny indeks 0) |

Dodatkowe elementy kroku 4: przełącznik „☐ Dodaj drugiego gracza (hot-seat)”, przycisk „⚙ Zaawansowane opcje” (nie rozwijany w tej rundzie), przycisk „◆ ROZPOCZNIJ GRĘ ◆”, „← Wstecz”.

Zachowanie strzałek: `newGameFlow.ts` l. 1583 `s.idx = (s.idx + d + s.opts.length) % s.opts.length`. Wartości zawijają się cyklicznie, bez zakresu z błędem.

Zrzut: `-07-nowa-gra-krok4-ustawienia.png`, `-08-nowa-gra-hotseat-wlaczony.png`.

## 4. Reguły walidacji przy starcie nowej gry

Kod (`newGameFlow.ts`):

| Bramka | Warunek | Źródło | Efekt UI |
|---|---|---|---|
| Krok 2 → 3 („Dalej”) | `epochHasCivs(selEpoch)` (l. 588–590, przycisk l. 2285–2292) | każda epoka ma cywilizacje | przycisk aktywny |
| Krok 3 → 4 („Dalej”) | `selCiv` ∈ `civsForEpoch(selEpoch)` (l. 2285–2291) | `ensureSelCivForEpoch` (l. 592–600) auto-wybiera cywilizację domyślną lub pierwszą z listy | przycisk aktywny |
| Start fotela 2 (hot-seat) | `selCiv2 && selCiv2 !== selCiv && civsForEpoch(...)` (l. 1515–1516) | karta fotela 1 ma klasę `disabled` (l. 1460) | przycisk „ROZPOCZNIJ GRĘ” aktywny |

Zaobserwowane w przeglądarce (DOM):
- Krok 3 (epoka Kamienia): 8 kart cywilizacji. Przycisk „Dalej →” jest aktywny już przed kliknięciem karty, bo cywilizacja jest auto-wybrana. Stan „brak wyboru” nie jest osiągalny z UI (`-05-nowa-gra-krok3-brak-wyboru.png` pokazuje krok z auto-wyborem).
- Po wyborze karty („Dalej”) przechodzi do kroku 4.
- Hot-seat włączony: ekran fotela 2 ma przyciski „Blisko / Daleko / Losowo” (rozmieszczenie fotela 2, nie zbadane szczegółowo) i „ROZPOCZNIJ GRĘ”. Karta cywilizacji fotela 1 (Grecy w tym przebiegu) ma klasę `disabled`. Cywilizacja fotela 2 (Rzymianie) jest auto-zaznaczona. Przycisk start był aktywny także przed wyborem (`SEAT2_START_DISABLED_INITIAL false`). Stan zablokowany nie jest osiągalny z normalnego UI.

Zrzuty: `-06-nowa-gra-krok3-wybrana.png`, `-09-hotseat-fotel2-brak-wyboru.png` (UWAGA: nazwa oznacza zamierzony stan testu; obraz pokazuje fotel 2 z auto-wybranymi Rzymianami, Grecy wyłączeni, „ROZPOCZNIJ GRĘ” aktywny; stanu braku wyboru ten zrzut NIE pokazuje), `-10-hotseat-fotel2-wybrany.png`.

Reguły liczby graczy (min/max): w UI nie znaleziono walidacji min/max dla liczby graczy. Liczba cywilizacji i miast-państw jest zawijana cyklicznie (patrz wyżej). Limit wyboru przeciwników AI (`cap`) występuje w panelu „Cywilizacje przeciwnika (opcjonalnie)” (`newGameFlow.ts` l. 1861–1866). Komunikat: „Wybrano N z cap możliwych przy obecnym ustawieniu „Liczba cywilizacji”". Jego stan nie był wywoływany w tej rundzie.

## 5. Stan błędu walidacji — wprost

Nie wywołano wizualnego stanu błędu walidacji. W kodzie istnieją bramki wyłączające przyciski, ale w normalnym przebiegu UI nie prowadzą do stanu blokady: cywilizacja jest auto-wybierana, a karta fotela 1 jest wyłączona. Nie wprowadzano danych poza UI i nie modyfikowano kodu.

## 6. Anomalie

- Konsola: 1 błąd `Failed to load resource: 404 (Not Found)` na starcie, jak w P1.3 i P1.5. Odpowiedzi HTTP ≥400 nie zarejestrowano przez `page.on('response')`, więc URL zasobu nie jest ustalony. Nie blokuje ekranów. Odłożone do P1.16.
- Zakładka „Język” zmienia etykietę na „English (planowane)”, ale tekst interfejsu w tej rundzie pozostał polski. Nie zweryfikowano pełnego zachowania.
