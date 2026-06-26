# CYWILIZACJE → MASTER : prośba do EKONOMIA — tempo produkcji nauki

Data: 2026-06-25 06:39 | Od: **CYWILIZACJE** | Dla: **EKONOMIA** (przez mastera) | Status: **PROŚBA**

## Kontekst
Drzewko technologii (`tech.json`) ma `Koszt nauki` per tech (~10–50; np. tanie Kamień 10–14, bramki: Brązownictwo 24, Waluta 50). Decyzja Macieja **1a = zostaw obecne koszty**. Żeby je później sensownie stroić (ile tur na technologię), potrzebuję od EKONOMII **punktu odniesienia: tempa produkcji Nauki**.

## Pytania do EKONOMIA
1. Ile **Nauki/turę** produkuje miasto wg modelu (`turn-economy.ts`/`economy.ts`) — bazowo i z czego się składa (udział strumienia z Handlu, `budynek_biblioteka_bonus_nauki` itd.)?
2. Rząd wielkości na wczesną grę: ile Nauki/turę ma gracz z **1 / 3 / 5 miastami**?
3. Czy jest globalny mnożnik tempa nauki (do strojenia) i gdzie?

## Po co
Dobiorę krzywą `Koszt nauki` tak, by 1. technologia zajmowała ~docelową liczbę tur. To kontrakt REFERENCYJNY — kosztów teraz nie zmieniam (1a).

## Zakres (3a)
Produkcja nauki = **EKONOMIA**; wydawanie (`research.ts`) = jej właściciel; **drzewko/koszty = CYWILIZACJE (ja)**. Proszę o odpowiedź przez mastera.
