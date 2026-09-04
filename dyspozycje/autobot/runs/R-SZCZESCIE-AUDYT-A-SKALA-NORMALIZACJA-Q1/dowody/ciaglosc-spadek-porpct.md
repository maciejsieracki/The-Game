# Warunek 2 dispatchu (ciągłość) — pomiar na szerokiej siatce profili

Siatka: **7680 profili × 11 kroków populacji** (3 trudności × 5 epok {1,2,3,4,9} ×
8 wariantów liczby budynków {0,2,5,9,14,20,26,31} × 4 garnizony × 4 warianty Pałacu ×
wojna/pokój × 2 podziały handlu; do tego Ceramika, Spichlerz, Świątynia, Amfiteatr,
Sąd, Pretorium i kara za brak garnizonu włączane progowo).

Ta sama siatka policzona na dwóch wytworach tym samym kodem pomiarowym:

| wielkość (p.p. PorPct przy +1 mieszkańcu) | runda 1 jak oddana (próg liniowy 0,10/0,08 normal) | po poprawkach obrony (próg składany 0,048/0,041 normal) |
|---|---|---|
| max CAŁKOWITY spadek — **stan gry PRZED tym tematem** | 16,9 | 16,9 |
| max CAŁKOWITY spadek — po tym węźle | 20,0 | **18,4** |
| max DODATKOWY (różnica PO−PRZED, to widzi gracz) | 15,0 | **12,0** |
| max WŁASNY WKŁAD skalowania progu | 9,6 | **5,4** |

Najgorszy przypadek „dodatkowego" spadku po poprawkach:
`hard / epoka 1 / 14 budynków / garnizon 0 / Pałac II / pop 4→5` — PRZED 1,1 p.p. → PO 13,1 p.p.

## Rozkład tego najgorszego przypadku

„Dodatkowy" spadek **nie jest jedną wielkością** — składa się z dwóch części:

- **9,8 p.p. — urwisko licznika SPRZED tematu.** Zanik bonusu Osiedla powyżej pop 4
  (`pickOsiedlePopBonus`) i kara Zagęszczenia powyżej pop 5. Istnieje w `main` niezależnie
  od tego węzła; przy stojącym mianowniku miasto siedziało na capie 120% po OBU stronach
  kroku, więc urwisko było **niewidoczne**. Zmierzone jako spadek na stanie PRZED z capem
  podniesionym poza zasięg. To zakres **węzła C**, jawnie wyłączony z granic tego tematu.
- **2,2 p.p. — własny wkład skalowania progu** (13,1 − 1,1 − 9,8). To jedyna część
  podlegająca allowliście tego węzła.

Maksimum własnego wkładu na całej siatce to **5,4 p.p.** (`hard / epoka 2 / 26 budynków /
garnizon 1 / Pałac I / pop 6→7`) — i to jest wielkość, na którą asercjuje bramka
(`szczescie-skala-normalizacja-test.cjs` sekcja 4, limit 8 p.p.).

## Wniosek dla warunku 2

Warunek „miasto nie może z tury na turę spaść o kilkanaście procent porządku tylko dlatego,
że urosło" jest **spełniony dla tego, co ten węzeł wnosi** (5,4 p.p. maksimum), i **nie jest
spełniony dla sumy z węzłem C** (12,0 p.p.). Nie da się go domknąć wewnątrz tej allowlisty:
każde skalowanie mianownika wystarczające, żeby rozwinięte miasto przestało siedzieć na capie
120% (czyli żeby GOAL 2 w ogóle zadziałał), z definicji **odsłania** urwisko pop 4→5, które
cap dotąd zakrywał. Pozycja idzie do właściciela jako `DO DECYZJI CZŁOWIEKA`.
