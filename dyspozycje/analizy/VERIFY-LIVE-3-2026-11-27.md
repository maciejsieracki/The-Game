# VERIFY-LIVE-3 (tag VLIVE3, temat R-WEB-VERIFY-LIVE-3-Q1) — pomiary na żywej grze

Data: 2026-11-27. Baza kodu: origin/main `3608af1ce2aae306c6fa2f77413f8817d2c7bed0`.
Żadna zmiana w `gra/src` ani w testach. Zmiany tylko: dane pomiarowe w `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-3-Q1/dane/` oraz ten dokument.

## Tabela

| Pomiar | Wynik | Poziom ustawień | NIE ZMIERZONO + powód |
|---|---|---|---|
| 1. Targowisko (Żywność → Podatek), jedna tura na żywo | NIE ZMIERZONO na żywo. Stała z danych: kurs 0,2 Podatku za 1 Żywności w każdym poziomie trudności (`data/econ-params.json`, `targowisko_zywnosc_na_podatek_kurs`: easy 0,2 / normal 0,2 / hard 0,2). Funkcja `resolveFoodTaxRate` (`src/game/empire-food.ts`) czyta tę wartość, więc kurs nie zależy od poziomu trudności. | Maksimum = hard (0,2 — ta sama wartość na wszystkich poziomach, nie ma innego maksimum) | Brak haka civTest, który uruchamia realną akcję zamiany (`onConvertOwnerFoodToTax` jest dostępna tylko z UI). Hak `adminSetup` mógłby postawić Targowisko w mieście, ale samej akcji nie uruchamia. Nie podjęto w tej rundzie. Hak `convertFoodToTax` w `__settingsLive` liczy regułę, ale nie zmienia stanu tury, więc nie jest pomiarem jednej tury. |
| 2. Cesja >1 miasta w pokoju, na żywo | NIE ZMIERZONO | Nie dotyczy (brak przebiegu) | Brak haka civTest, który składa negocjowany pokój z dodatkowymi miastami. Istniejący test `tools/peace-city-cession-negotiated-test.cjs` sprawdza logikę i okablowanie statycznie (bez Chromium), a nie przebieg w grze. Przebieg wymaga klikania w okno dyplomacji. Nie podjęto w tej rundzie. |
| 3. FORTRING: wpływ pierścienia (ON vs OFF) i round-trip zapisu | NIE ZMIERZONO (wynik częściowy, ON, do tury 34 z 60). We wszystkich 33 wierszach tur (t2–t34) `forts = 0`. Wpływu fortów nie da się zmierzyć, bo fortów nie było. Round-trip nie został wykonany (`roundTrip: null`). Wariant OFF nie został uruchomiony. | NIE spełnia maksimum (patrz powód) | (a) Bieg wystartował z ustawieniami domyślnymi: runner wywołuje `__nnsMeasureDebug.startGame({ seed })`, a ten hak ustawia poziom Normalny i koszty jednostek `niski`. Maksimum (Trudna, Wysoki ×4, Kultura trudna) wymagałoby zmiany runnera. (b) Brak haka, który wymusza postawienie fortu (`fortCount` tylko odczytuje). (c) Chromium zamykał stronę w 4 wywołaniach (rc=1, komunikat `Target page, context or browser has been closed`), każde wznowione ze slotu. Dane: `dane/fortring-on-seed4242.rows.jsonl` i `dane/fortring-on-seed4242.state.json`. |

## Dane FORTRING (wariant ON, seed 4242)

- Wiersze: 1 start (`ringOff: false`) + 33 tury (t2–t34), każda z `forts: 0`.
- Czas tury AI (z logu biegu): od około 10,5 s do około 34,8 s; pierwsza tura około 32,7 s, kolejne zwykle 12–15 s.
- Liczniki stanu: `gateBypass 1`, `battlesAuto 0`, `offersRejected 2`, `forcedPeaceAccepted 0`.

## Do rozstrzygnięcia przez orkiestratora (nie naprawiano)

- Czy fort może w ogóle powstać w tym ustawieniu (0 fortów przez 34 tury na seedzie 4242 przy ustawieniach domyślnych)? Obserwacja, nie potwierdzony błąd gry.
- Dla pełnego pomiaru FORTRING potrzebny jest: runner z ustawieniami maksymalnymi oraz hak wymuszający fort (dodatkowo do round-trip i wariantu OFF).
- Dla pomiaru 1 potrzebny jest hak wywołujący realną akcję zamiany Żywności na Podatek w jednej turze.
- Dla pomiaru 2 potrzebny jest hak lub skrypt przebiegu negocjacji pokoju z cesją dwóch miast.

## Bramki

Nie uruchomiono: nie zmieniono `gra/src` ani żadnego testu. Zgodnie z dispatchem bramki dotyczą zmian w kodzie.
