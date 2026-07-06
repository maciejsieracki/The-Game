# B0.9 — Widok miasta: BRAK PLONÓW na polach + tryby automatyczne nie działają
Playtest Macieja 2026-07-05 wieczór (screeny: RZYM, pasek „Zarządzanie polami").
Wykonawca: Claude Code (Opus). Zasady z CLAUDE.md obowiązują (tsc=0, weryfikacja, backup, bez kanonu).

**Update 2026-07-05 ~17:20:** pkt 1 (plony 3D) — **FIX src** `showYields: true` w `main.ts`. Handoff integratora: `_handoff/MASTER-do-INTEGRATOR_B0.9-showYields-2026-07-05.md`.  
**Update 2026-07-05 ~17:30:** pkt 2 (tryby auto) — **FIX src** `onOkolicaFocusChange`: klik Żyw./Prod./Podat./Zrówn. zawsze włącza auto + przydział (wcześniej w trybie ręcznym tylko hint bez efektu).

## OBJAWY
1. W widoku miasta (Okolica / „Zarządzanie polami") heksy NIE pokazują plonów —
   brak ikon/liczb 🍞⚒💰 na polach. Nie wiadomo, co ile produkuje i które pole
   jest obsadzone. Widać tylko podświetlenie heksa miasta i jednego pola (zielony).
2. Pasek trybów: Żyw. / Prod. / Podat. / Zrówn. / Ręczny — działa TYLKO „Ręczny".
   Kliknięcie trybów automatycznych nie przydziela pól wg priorytetu (brak reakcji
   albo brak widocznego efektu).

## DIAGNOZA — OD CZEGO ZACZĄĆ (kolejność!)
1. **Konsola devtools (F12) przy otwartym widoku miasta** — najpierw sprawdzić, czy
   overlay plonów nie umiera na wyjątku (to najczęstszy powód „pustych" nakładek).
   Szczególnie: NaN/undefined w plonach po dzisiejszych zmianach danych.
2. Moduły podejrzane (w tej kolejności):
   - `src/render/cityOkolicaOverlay.ts` — rysowanie nakładki plonów per hex;
     sprawdzić, czy nakładka jest budowana i czy nie jest ukrywana przez
     zoomLod/styledDecor/fog (te systemy zmieniały się dziś — flaga widoczności
     grupy overlay mogła zostać objęta złym przełącznikiem).
   - `src/game/okolica.ts` — liczenie plonów pól; czy zwraca wartości (console.log
     dla 2-3 heksów; NaN → szukać źródła w danych ulepszeń/terenu).
   - `src/game/auto-manage.ts` + handler przycisków (bottomBarHud/cityPanel) — czy
     kliknięcie trybu w ogóle woła przydział; czy wynik przydziału zapisuje się
     do miasta i odświeża overlay (brak refreshu po zmianie = „nie działa").
3. Sprawdzić, czy to nie regres z dzisiejszych fixów cityPanel (P1: nazwy pól PL
   w UnitDef/BuildingDef) — jeśli plony czytają pola po starych kluczach
   (`zywnosc` vs `Żywność` itp.), wynik będzie undefined → puste ikony.

## WYMAGANY EFEKT (kryteria akceptacji)
1. Każde pole w zasięgu miasta pokazuje plony (ikony+liczby) oraz wyraźnie odróżnia
   pola OBSADZONE od nieobsadzonych; heks miasta pokazuje sumę.
2. Tryby Żyw./Prod./Podat./Zrówn. przydzielają pola automatycznie wg priorytetu
   natychmiast po kliknięciu (widoczna zmiana obsady + przeliczone sumy);
   „Ręczny" pozwala klikać pola jak dotąd; wybrany tryb zapamiętany per miasto.
3. Zmiana trybu/obsady odświeża overlay bez przeładowania widoku i bez laga
   (dirty-set — tylko heksy tego miasta, spójnie z A5 z master-planu).
4. Zero błędów w konsoli przy otwieraniu/zamykaniu widoku miasta i zmianie trybów.
5. `npx tsc --noEmit` = 0; playtest wizualny Macieja na RZYM (Super Huge).

## KONTEKST
Pasek trybów istnieje w UI (screeny), więc to spięcie logiki/danych/odświeżenia,
nie brak funkcji. Po naprawie dopisać wynik do RAPORTOWANIA w master-planie.
