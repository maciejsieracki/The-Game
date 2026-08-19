# R-EVENTY-WAZNE-KARTY-Q1 — formalny zakres kart blokujących

## Kontrakt

Karta wydarzenia blokuje **Zakończ turę** wyłącznie wtedy, gdy wymaga decyzji
gracza i producent ustawi `blocking: true`. Brak tego pola oznacza kartę
informacyjną: można ją kliknąć lub zamknąć, ale nie zatrzymuje tury.

## Zakres aktualnego kodu

| Sytuacja | ID / źródło | Blocking |
|---|---|---:|
| Ostrzeżenie buntu / trwający bunt | `revolt-warn-*`, `revolt-*` | tak |
| Pusta kolejka produkcji | `prod-empty-*` | tak |
| Oczekująca propozycja dyplomatyczna | `diplo-pend-*` | tak |
| Oczekująca pozycja stołu negocjacji | `negot-*` | tak |
| Wojna, era, eliminacja, edukacja, koniec tury, chatka, handel AI↔AI | pozostałe karty informacyjne | nie |

To jest zakres wdrożenia dla aktualnych producentów kart. Atak wroga,
oblężenie, wybór technologii, kryzys finansowy i wydarzenia losowe pozostają
poza implementacją, dopóki ich producent nie dostarczy osobnej ścieżki decyzji.

## Zasada implementacyjna

Logika bramy korzysta wyłącznie z pola `blocking`; nie klasyfikuje kart po
prefiksach ID i nie traktuje „wszystkiego poza chatką” jako ważnego.
