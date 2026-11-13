# Production remaining owner decisions — 2026-10-18

Run: `R-PR141-CODEX-F04-PRODUCTION-REMAINING-DECISIONS-20261018`  
Status: documentation of literal owner responses; no implementation or product acceptance.

## Q1 — `prod_szybkosc_jednostki_proc`

**Pytanie właścicielskie (literal):**

> prod_szybkosc_jednostki_proc: jak realizować ułamkowe tempo? Przy +20%, bazie 1 jednostki/turę i stale opłaconej kolejce: A daje 5 jednostek przez 5 tur, B daje 6. W B przenosimy tylko ułamek poniżej 1; pusta kolejka zeruje go, a zablokowany spawn nie bankuje całych jednostek.

**Odpowiedź właściciela (literal, 2026-10-18):**

> A — zaokrąglamy limit każdej tury w dół, bez przenoszenia.

**Zapis decyzji:** A wybrano: per-turn limit jest zaokrąglany w dół i nie ma przenoszenia ułamka. Jest to kontrakt semantyczny do implementacji w osobno autoryzowanym zakresie; ten wpis niczego nie podłącza ani nie zmienia.

## Q2 — `prod_rush_koszt_proc`

**Pytanie właścicielskie (literal):**

> prod_rush_koszt_proc: czy dodatnia wartość podnosi cenę przyspieszenia, czy daje rabat? Stosujemy ją do obecnej zaokrąglonej wyceny. Przy koszcie 101 i postępie 40,2 baza wynosi 61; +20% oznacza odpowiednio cenę 74 albo 49.

**Odpowiedź właściciela (literal, 2026-10-18):**

> musisz mi wyjasnic kontekst i lepiej opisac problem

**Zapis decyzji:** To prośba o dodatkowy kontekst, a nie wybór A/B ani zatwierdzenie polaryzacji. `prod_rush_koszt_proc` pozostaje semantycznie nierozstrzygnięte; nie należy przyjmować ani ceny 74, ani 49 jako zatwierdzonej. Następny pakiet wyjaśniający powinien pokazać obecną ścieżkę wyceny/przyspieszenia, co oznacza dodatnia wartość w źródłowej formule i classifier, przykład bazowej wyceny 61, wynik obu wariantów oraz konsekwencje dla gracza/AI. Po tym należy poprosić właściciela o osobny literalny wybór. Do czasu decyzji nie zmieniać obecnego harmful/UNWIRED metadata ani nie podłączać tego pola.

## Granice

Q1 jest decyzją kontraktową, nie implementacją. Q2 pozostaje pending. Żadne z tych zapisów nie zmienia zatwierdzonych 360 wartości surowych, pozostałych parametrów, classifier/ledger, produktu ani runtime acceptance.
