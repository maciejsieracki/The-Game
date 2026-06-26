# Civ-UNITS — materialy zakresu JEDNOSTKI + BITWA

Folder zbiorczy na NIE-GROWE pliki lane UNITS (dokumentacja, panele Excel sterujace,
makiety jednostek/bitwy, galerie, rendery). Trzymaj tu przyszle dokumenty/panele/podglady UNITS.
Plik grywalny **Gra-podglad-BITWA.html** ZOSTAJE w roocie (uzytkownik otwiera go tam, przyszle buildy tam celuja).

Reorganizacja: 2026-06-24.

## Zawartosc tego folderu
- **Dokumentacja-UNITS-BITWA.md** — glowna dokumentacja zakresu jednostki + bitwa (parametry, dzialy, granica AI taktyczna/strategiczna).
- **Bitwa-parametry.xlsx** — panel ~85 parametrow bitwy (NIE czytany przez pipeline; panel referencyjny/sterujacy ludzko).
- **Macierz-walki-analiza.md** — analiza tekstowa counterow walki (towarzyszy Macierz-walki.xlsx, ktora zostala w roocie).
- **Galeria-jednostek-4widoki.html** — interaktywna galeria jednostek w 4 widokach (zywa, low-poly render).
- **Makieta-pasek-armii.html** — makieta paska/HUD armii.
- **Makieta-przed-bitwa.html** — makieta ekranu przed bitwa (styl dark+gold; src/ui/preBattle.ts wzoruje sie na niej tylko komentarzem, nie laduje pliku).
- **renders/** — PNG renderow typow jednostek (render_*.png): domyslny, konnica, lucznik, maczuga, miecznik, osadnik, oszczepnik, procarz, rydwan, super, topor, wlocznik.
- **Referencje-jednostek/** — README-referencje.md (notatki referencyjne do projektowania jednostek).
- **_archiwum/** — (pusty) na pliki historyczne/zastapione tego zakresu.

## Co ZOSTALO w roocie i dlaczego
- **Jednostki.xlsx** — PIPELINE-COUPLED: czytany przez gra/tools/export-data.py (-> units.json),
  oraz wymieniony w gen-dashboard.py i gen-panel-xlsx.py. NIE przenosic bez aktualizacji sciezek; do relokacji przez mastera.
- **Macierz-walki.xlsx** — PIPELINE-COUPLED: wymieniony w gen-dashboard.py i gen-panel-xlsx.py (panel "Countery walki"). Zostaje w roocie.
- **Gra-podglad-BITWA.html** — grywalny podglad bitwy; uzytkownik otwiera go w roocie, przyszle buildy tam celuja. Zostaje w roocie.

## _archiwum (historyczne)
- Brak. (Wczesniejsze makiety: Podglad-armii.html, Podglad-jednostka-roblox.html, Porownanie-jednostek-A-B.html
  juz wczesniej trafily do root/_archiwum/ — NIE ruszane.)

## Uwaga
Przyszle dokumenty/panele/podglady UNITS trzymaj w tym folderze.
Gra-podglad-BITWA.html zostaje w roocie jako grywalny podglad bitwy.
