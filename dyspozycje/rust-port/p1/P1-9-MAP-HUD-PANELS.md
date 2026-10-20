# P1.9 — Ekran mapy, HUD, panele, tooltipy i menu w grze (żywy Chromium)

**Temat:** R-RUSTPORT-P1-9-MAP-HUD-PANELS-Q1 · **Runda:** 1/5 · **Pin:** `main` = `edb8fb56`

## 1. Metoda i dowody

- Izolacja: świeży klon repo w scratchpadzie sesji, `git checkout edb8fb56`, `npm ci` w `gra/`. Oryginalne repo `gra/**` nie zmienione.
- Vite bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5185 --strictPort`, PID 17268 (zapisany przez `$!`), `predev` pominięty.
- Ubicie: wyłącznie PID 17268 (`kill`), potwierdzone: proces nieobecny, `curl` na 5185 zwraca brak połączenia (exit 7).
- `git status gra/data` = 0 linii w klonie i w oryginalnym repo, przed i po sesji.
- Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, viewport 1600×900, Playwright z `gra/node_modules`.
- Ścieżka do rozgrywki: menu → ROZPOCZNIJ GRĘ → Rozpocznij konfigurację → Dalej → Dalej → krok ustawień (Rozmiar mapy: Malenki) → ◆ ROZPOCZNIJ GRE ◆. Czas generacji świata nie jest udokumentowany w artefaktach tej rundy (brak logu/pomiaru) — pominięty.
- Zrzuty (`dyspozycje/rust-port/p1/screenshots/`):
  - `P1-9-map-hud-01-mapa-ogolna.png` (1600×900) — widok mapy po starcie, z nakładką „ZAŁÓŻ MIASTO”.
  - `P1-9-map-hud-02-hud-gorny-pasek.png` (1600×130) — górny pasek zasobów i przyciski.
  - `P1-9-map-hud-03-tooltip-skarbiec.png` (800×260) — tooltip po najechaniu na chip Skarbiec.
  - `P1-9-map-hud-04-panel-miasta.png` (1600×900) — panel boczny „Miasta”.
  - `P1-9-map-hud-05-panel-armia.png` (1600×900) — panel boczny „Armia”.
  - `P1-9-map-hud-06-menu-w-grze.png` (1600×900) — Menu gry (pauza).

## 2. Stan startowy

Po wygenerowaniu świata: TURA 1 · 4000 P.N.E., epoka „Epoka kamienia”, gracz Rzymianie. Brak miast i jednostek (wszystkie liczniki 0). Od razu aktywny tryb „🏛️ ZAŁÓŻ MIASTO — kliknij podświetlony hex (ESC = wyjście)” z przyciskiem „Załóż miasto — FREE (pierwsze miasto)”. Dlatego **nie wykonano kliku na miasto gracza** (nie istnieje na starcie) i nie założono miasta.

## 3. Elementy HUD (zrzut 01/02)

| Element | Co pokazuje | Źródło (`gra/src/…`) |
|---|---|---|
| Skarbiec, Praca, Spichlerz, Nauka, Surowce, Handel | Chipy zasobów: wartość i przyrost na turę; tooltip z bilansem | `ui/hud.ts` ok. l. 808 (Skarbiec), 857 (Praca), 884–893 (Spichlerz), Surowce/Handel w tym samym pliku |
| MOC | Moc imperium (środek górnej belki) | `ui/hud.ts` |
| Armia, Miasta, Obywatele, Kultura (widoczne na zrzutach 01/02); Religia (tylko z kodu — patrz §7) | Chipy: jednostki/rekruci, miasta, populacja, kultura, wierni | `ui/hud.ts` ok. l. 931 (Armia), 945 (Miasta), 955 (Obywatele), 1214 (Religia, etykieta warstwy minimapy) |
| Etykieta epoki („Epoka kamienia”) | Bieżąca epoka | `ui/hud.ts` |
| CIVPEDIA | Poradnik i encyklopedia | `ui/hud.ts` (przycisk górny prawy) |
| MENU („Menu główne”, klasa `b-menu`) | Otwiera menu gry (pauza) | `ui/hud.ts` ok. l. 1261 |
| Pasek dolny: „−  100%  +  ⛶”, „WYKONAJ”, „ZAKOŃCZ TURĘ” (w kodzie: „Wykonaj”, „Zakończ turę”, wyświetlane wielkimi literami) | Zoom i pełny ekran, wykonanie pierwszego oczekującego wydarzenia, koniec tury | Zoom: `ui/hud.ts` (`UI_ZOOM_STORAGE_KEY`, l. 458); WYKONAJ: `ui/bottomBarHud.ts` l. 243; ZAKOŃCZ TURĘ: `ui/bottomBarHud.ts` l. 252 |
| „WYDARZENIA” (prawy górny róg, pod MENU) | Lista zdarzeń tury z nagłówkiem-licznikiem; pasek narzędzi z chipem filtra „🌍 Inne cyw.” (przełącza wpisy handlu AI↔AI, domyślnie wyłączony) i przyciskiem „Zamknij wszystkie informacyjne”; w stanie startowym „Brak wydarzeń w tej turze.” | `ui/sidePanelHud.ts` l. 718 (chip „Inne cyw.”), l. 729 („Brak wydarzeń w tej turze.”). Chip NIE jest widoczny na zrzucie 01 — obszar nagłówka i paska narzędzi jest przykryty panelem „Miasto” (przycisk Załóż miasto) |
| „TURA 1 · 4000 P.N.E.” (prawy dolny róg) | Numer tury i rok | `ui/bottomBarHud.ts` l. 255 (`et-turn-lbl`) |
| Mini-mapa i lewy pasek ikon | Podgląd mapy; przyciski otwierające panele (ikony w lewym pasku) | `ui/hud.ts`, `ui/sidePanelHud.ts` |
| Banner „🏛️ ZAŁÓŻ MIASTO — kliknij podświetlony hex (ESC = wyjście)” z przyciskiem „✕ Wyjdź” (u góry, na środku, ok. x 570–1030 na zrzucie 01) | Tryb zakładania pierwszego miasta | `ui/buildModeHud.ts` l. 494 |
| Przycisk „Załóż miasto — FREE (pierwsze miasto)” (prawy panel „Miasto”, pod WYDARZENIAMI, zrzut 01) | Przycisk założenia miasta; koszt z silnika | `ui/buildModeHud.ts` l. 511 (etykieta „Załóż miasto”); `game/city-founding.ts` l. 159 (etykieta kosztu „FREE (pierwsze miasto)”) |

## 4. Tooltipy

- **Tooltip chipa HUD (zrzut 03):** po najechaniu na Skarbiec pojawia się dymek `#civ-hud-title-tip-el` z tekstem „Skarbiec — bilans na turę: … Kliknij po szczegóły.” Źródło: `ui/hudTitleTooltip.ts` (`TIP_ID`, l. 12); treść z `ui/hud.ts`.
- **Tooltip pola mapy:** NIE wywołany w tej rundzie (brak automatycznego najechania na pole z jednostką/miastem; na starcie brak obiektów). Nie opisano.

## 5. Panele boczne (zrzuty 04, 05)

Otwierane klikiem w chip HUD. Wspólny kontener: `ui/empireDetailPanel.ts` / `ui/sidePanelHud.ts`. Zamykanie: przycisk „✕” w prawym górnym rogu panelu. **Kliknięcie w ✕ NIE jest udokumentowane:** w artefaktach tej rundy nie ma zrzutu ani logu po zamknięciu panelu — traktować jako niezweryfikowane.

- **Zrzut 04 (`P1-9-map-hud-04-panel-miasta.png`) pokazuje ZBIORCZY panel imperium, NIE panel pojedynczego miasta.** Nazwa pliku jest historyczna i nie oznacza panelu miasta. Widoczne: nagłówek „Rzymianie”, sekcja „MIASTA — PRODUKCJA” (`ui/empireDetailPanel.ts` l. 2003), „0 miast”, „Brak miast — załóż osiedle na mapie.” (l. 2007). Panel pojedynczego miasta NIE został zrzutowany — na starcie gracz nie ma miasta.
- **Armia (05):** „0 jednostek na mapie”, „Rekruci 0 / 0 · można werbować 0 jedn. (2000 rekr./szt.)”, „KOSZT ZŁOTA 0 złota / turę”, „KOSZT ŻYWNOŚCI”, sekcje „REKRUCI — PULA WERBU”, „PRODUKCJA JEDNOSTEK”, „Masowa rekrutacja” (W kolejce 0, Ukończone 0), „ZAOPATRZENIE WOJSKA” (Koszt żywności armii, Magazyn państwa 0 / 1000).

Pozostałe chipy (Skarbiec, Praca, Spichlerz itd.) otwierają analogiczne panele szczegółów; nie wszystkie zostały zrzutowane w tej rundzie.

## 6. Menu gry (pauza) (zrzut 06)

Otwierane przyciskiem MENU. Źródło: `ui/gamePauseMenu.ts` (`aria-label` „Menu gry”, l. 135; nagłówek „Menu gry” l. 154; przyciski l. 185–189).
Zawartość: „Gra jest wstrzymana. Wybierz akcję lub wróć do rozgrywki.”; suwaki z przełącznikami: Muzyka, Odgłosy natury, Odgłosy jednostek; pole „Autozapis co N tur” (wartość 1, rotacja 10 autozapisów); przyciski: „Wróć do gry”, „Zapisz grę”, „Wczytaj grę” (wyszarzony w tym stanie), „Rozpocznij nową grę”, „Przejdź do menu głównego”.

## 7. Nieobserwowane w tej rundzie

- Tooltip pola mapy, zaznaczenie jednostki, panel miasta (brak miasta na starcie), dialogi zakończenia tury, zakładanie miasta (klik na hex nie wykonano).
- Zawartość paneli Skarbiec/Praca/Spichlerz/Nauka/Surowce/Handel/Kultura/Religia/Obywatele — tylko wzmianka o istnieniu klikalnych chipów, bez zrzutów.
- **Religia:** chip NIE jest widoczny na zrzutach 01/02 (prawy klaster zasłonięty przez CIVPEDIA i MENU; po „Kulturze” widać tylko obcięty fragment). Opis chipa Religia pochodzi wyłącznie z kodu i jest niezweryfikowany wizualnie.
- **Handel:** chip jest na zrzucie 01 tylko częściowo („Har…”), zasłonięty przez baner „Epoka kamienia”. Opis niezweryfikowany wizualnie.
- **Chip „🌍 Inne cyw.” i pasek narzędzi Wydarzeń:** niewidoczne na zrzucie 01 (przykryte panelem „Miasto”); opis wyłącznie z kodu (`ui/sidePanelHud.ts` l. 718).
- **Zamknięcie panelu przez ✕** oraz czas generacji świata — brak artefaktów w tej rundzie (patrz §1 i §5).

## 8. Anomalie

- Konsola: 1 błąd `404 (Not Found)` — ten sam co w P1.3 i P1.5. URL zasobu nie zidentyfikowany w tej rundzie; nie blokuje gry. Do P1.16.
