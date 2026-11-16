# DISPATCH R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1 (runda 1) — rozpoznanie `_executeUnitsImmediate` przed portem (K5-AUTO-EXEC)

DOMENA: GAME (odczyt). MODEL: HAIKU (Operator, Obrona), SONNET (Evaluator, Final Control) — reguła projektu dla silnika.
TRYB: WYŁĄCZNIE ODCZYT. Nie pisz kodu, nie uruchamiaj cargo, nie zmieniaj `rust-port/` ani `gra/`. Jedyny zapis: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1/` (jawny `git add`).
BAZA: `origin/rust-port/parity-v2` = `474487792` (zapisz SHA w raporcie). Pin: `07d2fbd72` (`gra/src/battle/battleScene.ts`, tylko odczyt: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'A,Bp'`).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## CEL
Zanim powstanie port `_executeUnitsImmediate` (pin `:18578`), trzeba wiedzieć, od czego zależy. Zmapuj funkcję i wszystkie wywołania z pinu, każde zaklasyfikuj.

## ZAKRES
1. Odczytaj pełne ciało `_executeUnitsImmediate` (od `:18578` do końca funkcji) i rekurencyjnie każde wywołanie `this._*`, które dotyka stanu bitwy (np. `_findPlayerUnit`, `busy`, `_refreshQueuedOrderVisuals`, funkcje ruchu i ataku wywoływane z `runNext`). Zapisz plik:linia każdego.
2. Dla każdego wywołania podaj klasyfikację:
   - **PORT-JEST** — odpowiednik w `rust-port/engine/src` (podaj plik:linia),
   - **BRAK** — brak portu, logika gry (wymagany port),
   - **UI** — wyłącznie prezentacja/animacja/komunikat (poza zakresem silnika; wpisz jako NIE_ZMIERZONO z uzasadnieniem).
3. Zidentyfikuj zależność asynchroniczną: `runNext`, `busy`, callbacki animacji. Opisz, co z tego jest stanem gry (muszą być w silniku), a co tylko czasem (do pominięcia w porcie).
4. Zaproponuj podział na tematy portu (rozmiar: jeden temat = jedna funkcja logiki + wektory), z listą plików allowlisty na każdy.

## KRYTERIA KOŃCA
1. Raport `01-rozpoznanie.md` z tabelą: wywołanie | plik:linia pinu | klasyfikacja | odpowiednik Rust (plik:linia) lub BRAK | uwagi.
2. Każdy wpis z `git grep` w `rust-port/engine/src` (odtwarzalne polecenie w raporcie).
3. Sekcja „Propozycja podziału” z kolejnością tematów i allowlistami.
4. Commit tylko `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1/` (jawny `git add`), bez push do parity.
