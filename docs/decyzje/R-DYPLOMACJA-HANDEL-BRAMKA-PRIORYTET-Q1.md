# R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1 — priorytet bramek dla ofert `handel`

**Status:** 🟢 **ZAPISANA** · **B+C połączone** (2026-08-06)

## Sytuacja

Commit `b47a2e8` dodał `'handel'` do ogólnej bramki uczciwości (`proposerUnfairToPartnerGate`,
`gra/src/game/diplomacy-proposals.ts`), sprawdzanej PRZED specyficzną logiką case'u `'handel'`
(gdzie `tradeWillingnessBlocksAcceptance` sprawdza chęć partnera). Efekt: dla oferty jednocześnie
nieuczciwej i niechcianej gracz widzi tylko „Przewaga u Ciebie — oferta nieuczciwa", nigdy „Brak
chęci do handlu". Dwa istniejące testy (`diplomacy-proposal-test.cjs`,
`diplomacy-acceptance-points-test.cjs`) kodują dziś sprzeczne oczekiwania.

## ECHO

**Cytat Macieja:** „uczciwość handlu powinna być priorytetem, ale nie mniej jednak chęć do handlu
powinna być dodatkowym elementem, który tą uczciwość poprawia lub pogarsza. Dodatkowo gracz powinien
mieć świadomość dlaczego dane AI akceptuje lub nie akceptuje i z jakiego powodu dany kontrakt."

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1** | **B+C połączone, nie mechanicznie, tylko sensownie** | (1) Uczciwość (PW) zostaje GŁÓWNYM kryterium akceptacji — nie usuwać ogólnej bramki. (2) Chęć partnera do handlu (`tradeWillingnessBlocksAcceptance`) przestaje być osobną, wykluczającą bramką "przed" — zamiast tego staje się MODYFIKATOREM progu/wyniku uczciwości (np. niska chęć podnosi wymagany próg PW do akceptacji, wysoka chęć obniża). (3) Komunikat dla gracza zawsze pokazuje PRAWDZIWY, dokładny powód decyzji AI (nie generyczny jeden z dwóch tekstów) — precyzja wariantu C, ale zasilana połączonym wynikiem uczciwość+chęć z (2), nie osobnym, niezależnym sprawdzeniem. |

## Skutek (1–3 zdania)

Gracz zawsze widzi rzeczywisty powód (uczciwość i/lub niechęć, z realnymi liczbami), a mechanika
przestaje mieć dwie niezależne, czasem sprzeczne ścieżki decyzyjne — chęć do handlu wpływa na wynik
zamiast go całkowicie zastępować. To wymaga przeprojektowania kolejności/łączenia bramek w
`diplomacy-proposals.ts`, nie tylko wyboru jednej z dwóch istniejących ścieżek.

## Wdrożenie

Czeka na hasło **`działaj`** → AutoBot Operator (🟡 logika dyplomacji, wymaga zaktualizowania obu
sprzecznych dziś testów zgodnie z nowym, połączonym zachowaniem — nie tylko naprawy jednego kosztem
drugiego).
