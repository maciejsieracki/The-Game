# P1.9 — Ekran mapy, HUD, panele, tooltipy i menu w grze (żywy Chromium)

**Temat:** R-RUSTPORT-P1-9-MAP-HUD-PANELS-Q1 · **Runda:** 1/5 · **Pin:** `main` = `edb8fb56`

## 1. Metoda i dowody

- Izolacja: świeży klon repo w scratchpadzie sesji, `git checkout edb8fb56`, `npm ci` w `gra/`. Oryginalne repo `gra/**` nie zmienione.
- Vite bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5185 --strictPort`, PID 17268 (zapisany przez `$!`), `predev` pominięty.
- Ubicie: wyłącznie PID 17268 (`kill`), potwierdzone: proces nieobecny, `curl` na 5185 zwraca brak połączenia (exit 7).
- `git status gra/data` = 0 linii w klonie i w oryginalnym repo, przed i po sesji.
- Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, viewport 1600×900, Playwright z `gra/node_modules`.
- Ścieżka do rozgrywki: menu → ROZPOCZNIJ GRĘ → Rozpocznij konfigurację → Dalej → Dalej → krok ustawień (Rozmiar mapy: Malenki) → ◆ ROZPOCZNIJ GRE ◆. Generacja świata trwała 19 s (nakładka „Tworzenie świata”).
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
| Armia, Miasta, Obywatele, Kultura, Religia | Chipy: jednostki/rekruci, miasta, populacja, kultura, wierni | `ui/hud.ts` ok. l. 931 (Armia), 945 (Miasta), 955 (Obywatele) |
| Etykieta epoki („Epoka kamienia”) | Bieżąca epoka | `ui/hud.ts` |
| CIVPEDIA | Poradnik i encyklopedia | `ui/hud.ts` (przycisk górny prawy) |
| MENU („Menu główne”, klasa `b-menu`) | Otwiera menu gry (pauza) | `ui/hud.ts` ok. l. 1261 |
| Pasek dolny: „−  100%  +  ⛶”, „🌍 Inne cyw.”, „WYKONAJ”, „ZAKOŃCZ TURĘ” | Zoom i pełny ekran, widok innych cywilizacji, wykonanie akcji, koniec tury | `ui/hud.ts` |
| „WYDARZENIA” (prawy górny róg, pod MENU) | Lista zdarzeń tury; w stanie startowym „Brak wydarzeń w tej turze.” | `ui/hud.ts` |
| „TURA 1 · 4000 P.N.E.” (prawy dolny róg) | Numer tury i rok | `ui/hud.ts` |
| Mini-mapa i lewy pasek ikon | Podgląd mapy; przyciski otwierające panele (ikony w lewym pasku) | `ui/hud.ts`, `ui/sidePanelHud.ts` |
| Banner „ZAŁÓŻ MIASTO” + „Załóż miasto” (prawy górny) | Tryb zakładania pierwszego miasta | `ui/buildModeHud.ts` (l. 67, 75, 494) |

## 4. Tooltipy

- **Tooltip chipa HUD (zrzut 03):** po najechaniu na Skarbiec pojawia się dymek `#civ-hud-title-tip-el` z tekstem „Skarbiec — bilans na turę: … Kliknij po szczegóły.” Źródło: `ui/hudTitleTooltip.ts` (`TIP_ID`, l. 12); treść z `ui/hud.ts`.
- **Tooltip pola mapy:** NIE wywołany w tej rundzie (brak automatycznego najechania na pole z jednostką/miastem; na starcie brak obiektów). Nie opisano.

## 5. Panele boczne (zrzuty 04, 05)

Otwierane klikiem w chip HUD. Wspólny kontener: `ui/empireDetailPanel.ts` / `ui/sidePanelHud.ts`. Zamykanie: przycisk „✕” w prawym górnym rogu panelu (kliknięcie w ✕ potwierdzone w przebiegu).

- **Miasta — produkcja (04):** nagłówek „Rzymianie”, sekcja „MIASTA — PRODUKCJA”, „0 miast”, „Brak miast — załóż osiedle na mapie.”
- **Armia (05):** „0 jednostek na mapie”, „Rekruci 0 / 0 · można werbować 0 jedn. (2000 rekr./szt.)”, „KOSZT ZŁOTA 0 złota / turę”, „KOSZT ŻYWNOŚCI”, sekcje „REKRUCI — PULA WERBU”, „PRODUKCJA JEDNOSTEK”, „Masowa rekrutacja” (W kolejce 0, Ukończone 0), „ZAOPATRZENIE WOJSKA” (Koszt żywności armii, Magazyn państwa 0 / 1000).

Pozostałe chipy (Skarbiec, Praca, Spichlerz itd.) otwierają analogiczne panele szczegółów; nie wszystkie zostały zrzutowane w tej rundzie.

## 6. Menu gry (pauza) (zrzut 06)

Otwierane przyciskiem MENU. Źródło: `ui/gamePauseMenu.ts` (`aria-label` „Menu gry”, l. 135; nagłówek „Menu gry” l. 154; przyciski l. 185–189).
Zawartość: „Gra jest wstrzymana. Wybierz akcję lub wróć do rozgrywki.”; suwaki z przełącznikami: Muzyka, Odgłosy natury, Odgłosy jednostek; pole „Autozapis co N tur” (wartość 1, rotacja 10 autozapisów); przyciski: „Wróć do gry”, „Zapisz grę”, „Wczytaj grę” (wyszarzony w tym stanie), „Rozpocznij nową grę”, „Przejdź do menu głównego”.

## 7. Nieobserwowane w tej rundzie

- Tooltip pola mapy, zaznaczenie jednostki, panel miasta (brak miasta na starcie), dialogi zakończenia tury, zakładanie miasta (klik na hex nie wykonano).
- Zawartość paneli Skarbiec/Praca/Spichlerz/Nauka/Surowce/Handel/Kultura/Religia/Obywatele — tylko wzmianka o istnieniu klikalnych chipów, bez zrzutów.

## 8. Anomalie

- Konsola: 1 błąd `404 (Not Found)` — ten sam co w P1.3 i P1.5. URL zasobu nie zidentyfikowany w tej rundzie; nie blokuje gry. Do P1.16.
