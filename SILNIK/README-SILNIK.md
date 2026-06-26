# Katalog SILNIK — dokumentacja i panel sterowania działu „silnik"

Wszystko, za co odpowiada dział **SILNIK** (silnik / integracja / pętla tury / kanon), w jednym miejscu — żeby nie szukać po liście ~60 plików w roocie.

## Zawartość
- **`SILNIK-ARCHITEKTURA-DEWELOPER.md`** — pełna dokumentacja architektury silnika: bootstrap, pętla tury krok po kroku, moduły wpięte + kolejka wpięć (KROK 2–8), pipeline danych/parametrów, pipeline build/publikacji (vite single-file, obejścia OneDrive), reguły lane, status `order.ts`, interakcje międzydziałowe, słownik typów.
- **`SILNIK-parametry.xlsx`** — panel parametrów silnika (~155 pozycji w 7 arkuszach): klucz JSON, easy/normal/hard, jednostka, opis, plik źródłowy, status. Arkusz `ZASZYTE-w-kodzie` = parametry w TS do wyniesienia do JSON.

## Czego TU NIE MA — celowo (nie przenosić, bo zepsuje automatyzację)
- **Kanał z masterem:** `../dyspozycje/SILNIK.md` (dyspozycje od mastera) + `../dyspozycje/SILNIK-DO-MASTERA.md` (raporty). Stałe ścieżki — czyta je scheduled task `civ-silnik-self-check` i pisze tam master. Przeniesienie wymaga skoordynowanej zmiany promptu taska + odwołań.
- **Kanon gry:** `../gra/Gra-podglad.html` — publikuje SILNIK, ale to plik gry.
- **Backupy kanonu:** `../_backup/Gra-podglad.html.bak-*` — lifeline do recovery, zostają.
- **Kod silnika:** `../gra/src/main.ts` + wpięcia `../gra/src/game/*` — to kod gry, nie dokumentacja.

## Konwencja
Pozostałe działy trzymają swoje dokumenty/Excele w roocie. Ten katalog to propozycja porządku dla działu SILNIK — jeśli master zatwierdzi wzorzec, można go powielić dla wszystkich działów (po jednym katalogu na dział).
