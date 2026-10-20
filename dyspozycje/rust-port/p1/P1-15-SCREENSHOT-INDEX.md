# P1.15 — Indeks zrzutów referencyjnych (stan na rundę 1/5)

**Temat:** R-RUSTPORT-P1-15-SCREENSHOT-INDEX-Q1 · **Data:** 2026-10-20 · **Pin web:** `main` = `edb8fb56` (zgodnie z tematami źródłowymi)
**Charakter:** FINALNY dla P1.3–P1.9. Stan wg `LEDGER.md` sprawdzonego w rundzie R-RUSTPORT-P1-15C-FINAL-UPDATE-Q1 (1/5): P1.3, P1.4, P1.5, P1.6, P1.7 oraz P1.8 (PASS w rundzie 2/5) i P1.9 (PASS w rundzie 1/5) mają wpis PASS. Wpisy P1.8/P1.9 są w working tree `LEDGER.md`, niezacommitowane (HEAD ich jeszcze nie ma).

**Aktualizacja:** R-RUSTPORT-P1-15B-INDEX-UPDATE-Q1 (runda 1/5) — dopisano wiersze 20–27 (zrzuty P1.8 i P1.9 istniejące w `screenshots/` w tej rundzie) i zaktualizowano listę braków (§2). Wiersze 1–19 nie zmienione.

**Metoda:** `ls -la`, `stat` i `file -b` na każdym PNG w `dyspozycje/rust-port/p1/screenshots/` (27 plików, 24 unikalne obrazy wg MD5; wymiary: 25 × 1600×900, 1600×130 (pasek HUD), 800×260 (tooltip); RGB, 8-bit, non-interlaced). Opisy wyłącznie z odpowiednich plików `P1-<N>-*.md`. Sumy MD5 sprawdzone pod kątem duplikatów bajtowych. W tej rundzie nie wykonano żadnych zrzutów. Zapis tylko do tego pliku i do `dyspozycje/autobot/runs/R-RUSTPORT-P1-15B-INDEX-UPDATE-Q1/`.

## 1. Tabela zrzutów (27 wierszy = 27 z 27 plików PNG w `screenshots/`; 24 unikalne obrazy)

| # | Plik (`screenshots/`) | Rozmiar [B] | Wymiary | Temat | Ekran / stan | Co pokazuje (wg `.md` tematu) |
|---|---|---:|---|---|---|---|
| 1 | `P1-3-intro-start.png` | 1 333 402 | 1600×900 | P1.3 | Menu główne | Menu: ROZPOCZNIJ GRĘ, KONTYNUUJ (nieaktywne), USTAWIENIA, WIĘCEJ, WYJDŹ. Źródło: `P1-3-INTRO-START.md` §2. Bajtowo = #9. |
| 2 | `P1-4-epoch-selection.png` | 1 127 718 | 1600×900 | P1.4 | Krok 2/5 „Epoka Startowa" | Trzy kafelki: Kamień (8 cyw.), Brąz (14), Żelazo (15). Domyślnie zaznaczony Kamień. Źródło: `P1-4-EPOCH-SELECTION.md`. Bajtowo = #13. |
| 3 | `P1-5-civ-selection-01-kamien.png` | 898 783 | 1600×900 | P1.5 | Krok 3/5, Epoka Kamienia | 8 kart cywilizacji. Panel szczegółów: Rzymianie (auto-wybór). Źródło: `P1-5-CIV-SELECTION.md` §3. Bajtowo = #14 (MD5 `18d433e0…`). |
| 4 | `P1-5-civ-selection-02-zelazo.png` | 921 217 | 1600×900 | P1.5 | Krok 3/5, Epoka Żelaza | 15 kart (siatka 4-4-4-3), wszystkie odblokowane: Grecy … Fenicjanie. Źródło: `P1-5-CIV-SELECTION.md` §3. |
| 5 | `P1-5-civ-selection-03-braz.png` | 917 966 | 1600×900 | P1.5 | Krok 3/5, Epoka Brązu | 14 kart. Źródło: `P1-5-CIV-SELECTION.md` §2. |
| 6 | `P1-5-civ-selection-04-klik-grecy.png` | 918 230 | 1600×900 | P1.5 | Krok 3/5, Epoka Żelaza, po kliku „Grecy" | Panel szczegółów zmieniony z Rzymian na Greków. Jedyna zaznaczona karta: Grecy. Źródło: `P1-5-CIV-SELECTION.md` §4. |
| 7 | `P1-6-civcount-mapsize.png` | 1 118 403 | 1600×900 | P1.6 | Krok 4/5, Epoka Kamienia, Standardowy | Domyślne wartości: rozmiar Standardowy, Liczba cywilizacji 7. Źródło: `P1-6-CIVCOUNT-MAPSIZE.md` §1 (plik zamknięty w LEDGER jako PASS). |
| 8 | `P1-6-civcount-mapsize-superhuge-kamien.png` | 1 118 330 | 1600×900 | P1.6 | Krok 4/5, Epoka Kamienia, Super Huge | Rozmiar Super Huge, Liczba cywilizacji 7. Źródło: `P1-6-CIVCOUNT-MAPSIZE.md` §1. |
| 9 | `P1-7-settings-validation-00-menu.png` | 1 333 402 | 1600×900 | P1.7 | Menu główne | Bajtowo identyczny z #1 (MD5 `e0593a5e…`). Źródło: `P1-7-SETTINGS-VALIDATION.md` §1. |
| 10 | `P1-7-settings-validation-01-ustawienia.png` | 1 276 323 | 1600×900 | P1.7 | Menu → Ustawienia | Muzyka, Efekty dźwiękowe, Język (Polski). Źródło: `P1-7-SETTINGS-VALIDATION.md` §2. |
| 11 | `P1-7-settings-validation-02-ustawienia-po-zmianie.png` | 1 276 593 | 1600×900 | P1.7 | Menu → Ustawienia, po zmianie | Stan po zmianie w Ustawieniach. Md opisuje zmianę języka na „English (planowane)” bez przypisania jej do tego pliku. |
| 12 | `P1-7-settings-validation-03-nowa-gra-krok1.png` | 1 254 881 | 1600×900 | P1.7 | Kreator, krok 1/5 (Intro) | Krok wstępny kreatora. Md nie opisuje szczegółowo tego pliku. |
| 13 | `P1-7-settings-validation-04-nowa-gra-krok2-epoka.png` | 1 127 718 | 1600×900 | P1.7 | Krok 2/5, Epoka | Bajtowo identyczny z #2 (MD5 `3449170b…`). |
| 14 | `P1-7-settings-validation-05-nowa-gra-krok3-brak-wyboru.png` | 898 783 | 1600×900 | P1.7 | Krok 3/5, Kamień | **Nazwa myląca:** obraz pokazuje auto-wybrane Rzymianie, a nie brak wyboru. Bajtowo = #3 (MD5 `18d433e0…`). Źródło: P1-7 §1, §4. |
| 15 | `P1-7-settings-validation-06-nowa-gra-krok3-wybrana.png` | 895 661 | 1600×900 | P1.7 | Krok 3/5, cywilizacja wybrana | Krok 3 z wybraną cywilizacją, przycisk Dalej aktywny. Źródło: P1-7 §4. |
| 16 | `P1-7-settings-validation-07-nowa-gra-krok4-ustawienia.png` | 1 118 521 | 1600×900 | P1.7 | Krok 4/5, Ustawienia rozgrywki | 12 wierszy ustawień z domyślnymi wartościami, przełącznik hot-seat, Rozpocznij grę. Źródło: P1-7 §3. |
| 17 | `P1-7-settings-validation-08-nowa-gra-hotseat-wlaczony.png` | 1 118 333 | 1600×900 | P1.7 | Krok 4/5, hot-seat włączony | Przełącznik „Dodaj drugiego gracza (hot-seat)” włączony. Źródło: P1-7 §3. |
| 18 | `P1-7-settings-validation-09-hotseat-fotel2-brak-wyboru.png` | 1 000 984 | 1600×900 | P1.7 | Fotel 2, hot-seat | **Nazwa myląca:** karta fotela 1 (Grecy) wyłączona, Rzymianie auto-zaznaczeni, Rozpocznij grę aktywny. Brak stanu „brak wyboru”. Źródło: P1-7 §4, §5. |
| 19 | `P1-7-settings-validation-10-hotseat-fotel2-wybrany.png` | 1 021 567 | 1600×900 | P1.7 | Fotel 2, cywilizacja wybrana | Fotel 2 z wybraną cywilizacją. Źródło: P1-7 §4. |
| 20 | `P1-8-worldgen-malenki.png` | 273 921 | 1600×900 | P1.8 | Generowanie świata, rozmiar Malenki (próba 1), po ukończeniu | HUD i mapa widoczne po zakończeniu generacji (ok. 19–20 s, dev server). Źródło: `P1-8-WORLD-GENERATION.md` §2. Temat zamknięty PASS (runda 2/5, wg LEDGER). |
| 21 | `P1-8-worldgen-standardowy.png` | 502 765 | 1600×900 | P1.8 | Generowanie świata, rozmiar Standardowy (próba 2, limit 240 s), po ukończeniu | Mapa widoczna po ukończeniu generacji (211,9 s, dev server). Próba 1 (przerwana po 90,5 s) bez zrzutu. Źródło: `P1-8-WORLD-GENERATION.md` §2. |
| 22 | `P1-9-map-hud-01-mapa-ogolna.png` | 319 538 | 1600×900 | P1.9 | Mapa po starcie gry (Malenki), tryb „ZAŁÓŻ MIASTO” aktywny | Widok mapy po wygenerowaniu świata, TURA 1 · 4000 P.N.E., nakładka „ZAŁÓŻ MIASTO”. Brak miast i jednostek na starcie. Źródło: `P1-9-MAP-HUD-PANELS.md` §1–§2. Temat zamknięty PASS (runda 1/5, wg LEDGER). |
| 23 | `P1-9-map-hud-02-hud-gorny-pasek.png` | 62 569 | 1600×130 | P1.9 | Górny pasek HUD (wycinek) | Chipy zasobów (Skarbiec, Praca, Spichlerz, Nauka, Surowce, Handel), armia, miasta, obywatele, kultura, religia, przycisk MENU. Źródło: `P1-9-MAP-HUD-PANELS.md` §3. |
| 24 | `P1-9-map-hud-03-tooltip-skarbiec.png` | 83 048 | 800×260 | P1.9 | Tooltip chipa Skarbiec po najechaniu | Dymek „Skarbiec — bilans na turę … Kliknij po szczegóły.” Źródło: `P1-9-MAP-HUD-PANELS.md` §4. Wycinek 800×260. |
| 25 | `P1-9-map-hud-04-panel-miasta.png` | 275 484 | 1600×900 | P1.9 | Panel boczny „Miasta” | Sekcja „MIASTA — PRODUKCJA”, „0 miast”, „Brak miast — załóż osiedle na mapie.” Źródło: `P1-9-MAP-HUD-PANELS.md` §5. |
| 26 | `P1-9-map-hud-05-panel-armia.png` | 322 568 | 1600×900 | P1.9 | Panel boczny „Armia” | „0 jednostek na mapie”, rekrutacja i zaopatrzenie wojska (wartości zerowe). Źródło: `P1-9-MAP-HUD-PANELS.md` §5. |
| 27 | `P1-9-map-hud-06-menu-w-grze.png` | 342 431 | 1600×900 | P1.9 | Menu gry (pauza) | Suwaki Muzyka / Odgłosy natury / Odgłosy jednostek, „Autozapis co N tur”, Wróć do gry, Zapisz grę, Wczytaj grę (wyszarzony), Rozpocznij nową grę, Przejdź do menu głównego. Źródło: `P1-9-MAP-HUD-PANELS.md` §6. |

Uwagi do tabeli:
- Pliki #1/#9, #2/#13 i #3/#14 są parami bajtowo identyczne. Plików PNG jest 27, unikalnych obrazów 24 (27 minus 3 duplikaty). Pliki #20–#27 nie duplikują żadnego wcześniejszego obrazu wg MD5.
- Pliki w `dyspozycje/autobot/runs/R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1/` (np. `probe-epoch-step2-braz-selected.png`, `probe-epoch-to-civ-step3.png`) leżą poza `screenshots/` i nie są indeksowane. Są wymienione w `P1-4-EPOCH-SELECTION.md` §"Zrzuty tej rundy".

## 2. Braki względem P1.3–P1.9 (stan na tę rundę)

| Temat | Status materiału | Braki zrzutów (ekrany bez PNG w `screenshots/`) |
|---|---|---|
| P1.3 Intro/start | Plik `.md` jest, zrzut 1 | Rozwinięty panel „WIĘCEJ ▾” (opis tylko z kodu). HUD pod menu (`P1-3` §4: nieobserwowany). |
| P1.4 Epoka | Plik `.md` jest, zrzut 1 w `screenshots/` | Stan po kliku „Epoka Brązu” i krok 3 z P1.4 istnieją tylko w `runs/` (poza indeksem). |
| P1.5 Cywilizacja | Plik `.md` jest, 4 zrzuty | Brak zrzutu klikniętej cywilizacji w Epoce Brązu lub Kamienia. Brak zrzutu pełnego panelu szczegółów (tylko Rzymianie i Grecy). |
| P1.6 Liczba cywilizacji i rozmiar mapy | **PASS (zamknięty w LEDGER).** Plik `.md`, 2 zrzuty tylko dla Kamienia | Brak zrzutów zakresów Malenki–Ogromny oraz Super Huge w Brązie i Żelazie (zakresy zmierzone klikaniem, bez zrzutów, `P1-6` §3, §7). Brak zrzutu anomalii „›” na Super Huge (`P1-6` §5). |
| P1.7 Ustawienia i walidacja | Plik `.md` jest, 11 zrzutów | Brak zrzutu stanu błędu walidacji (`P1-7` §5: nieosiągalny z UI). Brak zrzutu rozwiniętych „Zaawansowanych opcji” (`P1-7` §3). Brak zrzutu panelu „Cywilizacje przeciwnika” z komunikatem limitu (`P1-7` §4). Plik #14 i #18 mają mylące nazwy (patrz tabela). |
| P1.8 Generowanie świata (kilka seedów) | **PASS (runda 2/5, wpis w LEDGER).** Plik `.md` jest, 2 zrzuty (Malenki, Standardowy) | Brak zrzutu ekranu generowania/loadera i postępu (`mapLoadingOverlay`). Brak zrzutu Standardowy próba 1 (przerwana po 90,5 s, `P1-8` §2). Brak zrzutów Mały, Duży, Ogromny, Super Huge (nie przetestowano, `P1-8` §5). Brak zrzutów mapy dla różnych seedów (seed nie jest ustawialny w UI, `P1-8` §3). |
| P1.9 Mapa, HUD, panele, tooltipy, dialogi | **PASS (runda 1/5, wpis w LEDGER).** Plik `.md` jest, 6 zrzutów | Tooltip pola mapy (nie wywołany, `P1-9` §4). Zaznaczenie jednostki i panel miasta na mapie (brak obiektów na starcie, `P1-9` §7). Dialogi zakończenia tury i zakładanie miasta (klik na hex nie wykonany, `P1-9` §2, §7). Zawartość paneli Skarbiec/Praca/Spichlerz/Nauka/Surowce/Handel/Kultura/Religia/Obywatele (tylko wzmianka, bez zrzutów, `P1-9` §7). |

Liczba tematów z listy P1.3–P1.9 bez żadnego zrzutu w `screenshots/`: **0** (P1.8 i P1.9 mają zrzuty; oba PASS wg LEDGER). Tematy P1.3, P1.4, P1.5, P1.7, P1.8, P1.9 mają zrzuty. P1.6 ma zrzuty tylko dla Kamienia.

## 3. Anomalie zgłoszone w materiale źródłowym (do P1.16)

- Konsola: 1× `404 (Not Found)` na starcie w P1.3, P1.4, P1.5, P1.6, P1.7, P1.8, P1.9. Zasób nie zidentyfikowany.
- Nazwy plików #14 i #18 nie odpowiadają obrazom. Nie zmieniono ich, bo allowlista zakazuje modyfikacji plików innych tematów.
- Pliki #1/#9, #2/#13 i #3/#14 są bajtowymi duplikatami zapisanymi w różnych tematach.
