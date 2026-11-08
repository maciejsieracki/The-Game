# Dispatch — zwijanie pozycji parametrów cywilizacji

**Etap 1/11 — temat ponownie zarejestrowany.**

Wymaganie: każdy parametr cywilizacji w macierzy jest domyślnie zwinięty, a gracz może rozwinąć go do podglądu. Nawigacja kreatora „Dalej” pozostaje widoczna w przypiętej stopce.

## Operator R1 — audyt

Operator potwierdził, że aktywne wiersze `REAL_GAMEPLAY` renderują się w całości. Zwijany jest tylko cały panel profilu; test obecny nie sprawdza poszczególnych wierszy. Przyczyna jest odtworzona, więc temat przechodzi do **3/11**.

Zakres poprawki: accessible disclosure dla każdego wiersza; zachowanie filtrowania/wyszukiwania i liczników; domyślnie zwinięte wpisy; test Chromium dla rozwijania wpisu oraz widocznej nawigacji.

Następny krok: operator implementuje i testuje lokalnie. Evaluator i kolejne bramki nie zostały jeszcze uruchomione.
