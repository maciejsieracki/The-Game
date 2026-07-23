# DYSPOZYCJA DLA CLAUDE DESIGN — 2026-07-23 (druga tura)

**Od:** integrator (sesja chmurowa) · **Zatwierdza:** Maciej
**Styl:** 1E (Painted Imperial) — tokeny WYŁĄCZNIE z `eksport/tokens.css` (jest już kanonem w repo).
**Format oddania (bez zmian):** ZIP → `_dist/<NAZWA>-<data>/` + `MANIFEST.txt` + `DYSPOZYCJA-WDROZENIE.md` + makieta `.dc.html` (wieloklatkowa) + aktualizacja huba START i `CANON.md`.

## STATUSY (żeby nie robić drugi raz)
- **PREBATTLE nakładka v1.1** — ODEBRANA, zainstalowana w kanonie repo, idzie do wdrożenia w kodzie. ZAMKNIĘTE.
- **eksport/** (tokens+ikony, 348 plików) — DOJECHAŁ. Zlecenie 2 ZAMKNIĘTE, dziękujemy.
- **POLE BITWY HUD TW-v5** — w trakcie wdrażania w kodzie (screeny porównawcze wyślemy). Nic nie trzeba.
- **DYPLOMACJA FINAL** — wdrożona 1:1. ZAMKNIĘTE.

## ZLECENIE 3 (GŁÓWNE): DRZEWKO TECHNOLOGII — graf drzewa badań
Kontekst: „Ekran Badania (1E)" w kanonie to LISTA/panel wyboru badań — brakuje ekranu GRAFU całego drzewa. To realna luka nr 1 z audytu makiet (`docs/ux/AUDYT-MOCKUPOW-2026-07-23.md` § „Prawdziwe luki UI").

Punkt wyjścia (stare makiety integratora, do dopracowania w stylu 1E):
- `Makieta-drzewko-technologii.html` (korzeń repo) — zakres Kamień+Brąz
- `UI/Makieta-drzewko-uklad-bez-przeciec.html` — układ krawędzi **BEZ PRZECIĘĆ** (wymóg, nie sugestia)

Dane gry (źródło prawdy struktury): `gra/data/tech.json` — technologie w 3 epokach (Kamień → Brąz → Żelazo), tiery 1–9, zależności (prerequisites), koszty Nauki, odblokowania (jednostki/budynki/ulepszenia). Ikony technologii i tierów: `eksport/icons/` (tier1–7) + `epoch-icon-map.json`.

Makieta — 3 klatki w 1 pliku `.dc.html`:
1. **PRZEGLĄD** — całe drzewo poziomo epokami (pasma/kolumny Kamień|Brąz|Żelazo), węzły z ikoną+nazwą, krawędzie bez przecięć; stany węzłów: ODKRYTA (złota) / DOSTĘPNA (jasna, klikalna) / ZABLOKOWANA (wyszarzona + kłódka z powodem: brak techa-rodzica) / W TRAKCIE (pierścień postępu % jak chip Nauki w HUD).
2. **TOOLTIP/KARTA WĘZŁA** — po najechaniu: nazwa, epoka+tier, koszt Nauki, tury do końca przy obecnym tempie, chipy odblokowań (jednostka/budynek/ulepszenie — ikony z `eksport/`), zależności.
3. **NAWIGACJA** — zoom/pan (drzewo szersze niż ekran), minimapa drzewa lub pasek epok jako szybki skok, „pokaż ścieżkę do X" (podświetlenie łańcucha zależności do wybranego techa).

Twarde zasady: tylko realne dane z `tech.json` (nie wymyślać techów) · krawędzie bez przecięć · czytelność przy ~60+ węzłach · spójność z „Ekran Badania (1E)" (ta sama typografia kart).

## ZLECENIE 4: CUDA ŚWIATA (Wonders)
Realna luka nr 2 z audytu — brak JAKIEGOKOLWIEK ekranu Cudów w kanonie.
Punkt wyjścia: `UI/Makieta-cuda.html` (jedyne źródło). Dane: `gra/data/wonders.json` (cuda z epokami wejścia, wymogami technologicznymi, kosztami budowy, efektami).

Makieta — 3 klatki:
1. **PRZEGLĄD** — galeria kart cudów (ikona/winieta, epoka, wymogi, efekt); stany: dostępny / zablokowany-brak-techa / W BUDOWIE u nas z postępem / ZBUDOWANY przez nas / PRZEPADŁ — zbudowany przez rywala (z nazwą cywilizacji).
2. **KARTA CUDU** — pełna: opis, efekt, koszt Pracy, gdzie budowany.
3. **POWIADOMIENIE „Cud ukończony"** — dwa warianty: nasz vs cudzy.

## ZLECENIE 5 (SYNC — bez projektowania, tylko dosłanie): 8 plików kanonu
`CANON.md` deklaruje te ekrany jako aktualny kanon, ale plików FIZYCZNIE NIE MA w repo — prosimy dołączyć do najbliższego ZIP-a:
`HUD Panele stany (1E)` · `HUD Jednostka wybrana (1E)` · `HUD Miasto wybrane (1E)` · `A-08 Tryb budowy ulepszeń (1E)` · `A-04 Panel heks kontekst (1E)` · `Jednostki — infografiki kanon v1 (1E)` · `Atlas ikon bitwy i jednostek (1E)` · `C-23 Szczegóły bitwy v1`.

Uwaga: **A-08** zamyka jednocześnie lukę nr 3 z audytu (placement/tryb budowy ulepszeń) — nie trzeba nowego zlecenia, wystarczy dosłać plik.

## Kolejność
Zlecenie 5 (najtańsze, samo dosłanie) → Zlecenie 3 (główne) → Zlecenie 4.
