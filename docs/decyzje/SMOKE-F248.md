# SMOKE F248 — Panel żetonów + garnizon lista + surowce Dostęp

**Data**: 2026-08-05  
**Commit**: `772bab7c` (gra-robocza/START.html)  
**Branch**: `cursor/smoke-f248-63a1`

## Status: PASS (AC 1-2), SKIP (AC 3)

---

## AC 1: Klik żetonów HUD → panel pokazuje TYLKO tę sekcję (R-PANEL-SPLIT)

**Status**: ✅ PASS

**Test**:
1. Uruchomiono nową grę z START.html
2. Kliknięto token "Surowce" w HUD
3. Otworzył się prawy panel pokazujący TYLKO sekcję Surowce (Rzymianie - Magazyn państwa)
4. Kliknięto token "Badania" (kolba) w lewym pasku
5. Otworzył się panel pokazujący TYLKO sekcję Badań (drzewo technologii)

**Wynik**: Panel poprawnie pokazuje tylko wybraną sekcję po kliknięciu żetonu HUD. Implementacja R-PANEL-SPLIT działa zgodnie z założeniami.

**Screenshot**: `/tmp/computer-use/e6219.webp` (panel Surowce)

---

## AC 2: Surowce → sekcja "Dostęp — nie magazynowane" z Ceramika/Sól/Koń/Złoto

**Status**: ✅ PASS

**Test**:
1. Kliknięto token "Surowce" w HUD
2. Panel pokazał dwie sekcje:
   - **MAGAZYNOWANE**: Drewno, Kamień, Glina, Ruda miedzi, Ruda żelaza, Cegła, Brąz, Żelazo, Stal (wszystkie 0/1000)
   - **DOSTĘP — NIE MAGAZYNOWANE**: 
     - Ceramika (BRAK)
     - Sól (BRAK)
     - Koń (BRAK)
     - Złoto (surowiec) (BRAK)

**Wynik**: Sekcja "Dostęp — nie magazynowane" istnieje i zawiera wszystkie wymagane surowce: Ceramika, Sól, Koń, Złoto (surowiec).

**Screenshot**: `/tmp/computer-use/e6219.webp`, `/tmp/computer-use/a7c59.webp`

---

## AC 3: Jednostka w garnizonie → lista Armie pokazuje + rozkaz ruchu budzi

**Status**: ⏭️ SKIP

**Powód**: Brak jednostek w garnizonie do przetestowania. W nowej grze:
- Nie założono jeszcze miasta
- Nie zrekrutowano żadnych jednostek
- Panel "ARMIE" istnieje i pokazuje komunikat: "Brak jednostek na mapie — zrekrutuj wojsko w mieście"

**Założenie miasta i rekrutacja jednostki wymagałyby**:
1. Założenia miasta (klik na hex)
2. Poczekania na produkcję jednostki (kilka tur)
3. Garnizonowania jednostki w mieście
4. Testowania budzenia rozkazem ruchu

Ze względu na czas i instrukcję "Jeśli UI nie da garnizonu szybko — zalicz 1+2 i zaznacz 3 SKIP z powodem", pomijam ten test.

**Screenshot**: `/tmp/computer-use/b4284.webp` (panel ARMIE - pusty)

---

## Podsumowanie

- ✅ AC 1: PASS - Panel żetonów HUD działa poprawnie (R-PANEL-SPLIT)
- ✅ AC 2: PASS - Sekcja "Dostęp — nie magazynowane" zawiera Ceramika/Sól/Koń/Złoto
- ⏭️ AC 3: SKIP - Brak jednostek w garnizonie do testowania (wymagałoby założenia miasta i rekrutacji)

**Ogólna ocena**: Funkcjonalność paneli zasobów i HUD działa zgodnie ze specyfikacją. Test garnizonu wymaga dłuższej sesji gry.

---

## Screenshoty

1. `/tmp/computer-use/e6219.webp` - Panel Surowce z sekcjami MAGAZYNOWANE i DOSTĘP — NIE MAGAZYNOWANE
2. `/tmp/computer-use/a7c59.webp` - Ten sam widok (potwierdzenie)
3. `/tmp/computer-use/ba46b.webp` - Panel Badania (test R-PANEL-SPLIT dla innego żetonu)
4. `/tmp/computer-use/b4284.webp` - Panel ARMIE (pusty, brak jednostek)

