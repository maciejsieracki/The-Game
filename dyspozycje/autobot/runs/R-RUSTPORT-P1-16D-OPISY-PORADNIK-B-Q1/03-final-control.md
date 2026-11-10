STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16D-OPISY-PORADNIK-B-Q1
GOAL: Status rozdziałów Poradnika 14/15/16 (nieprzeliczone) oraz 8 konkretnych pozycji z
`P1-16-EDGE-CASES.md` §9.5 (rozdz. 06/11/12/13/17/28/57/91) z dowodem na pinie edb8fb56.

RUNDY: 1/5 (Operator → Evaluator 6 zarzutów — błędny kierunek w B3 [Rzymianie −20% kosztu budynków
jest w rzeczywistości +20%, HARMFUL], brakujący werdykt B1(d), zła liczba wystąpień w B4 [7 nie 5],
pominięta pozycja „Rzymianie −5% korupcji" mimo rozbieżności, zły zakres stosunku w B7, brak
jawnego zakresu dla części A → Obrona 6×PRZYJMUJE → Final Control 6×ODDAL, zweryfikowane
niezależnie przez `git show`/grep na edb8fb56).

ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-B.md`. Usunięto przypadkowy
plik tymczasowy `.u.json` z katalogu runu (poza allowlistą, scratch artefakt agenta).

WYNIK (lista B, 8 pozycji — wszystkie NIEZGODNE/CZĘŚCIOWO, żadnej ZGODNEJ w całości):
- rozdz. 06 §35.3: NIEZGODNE (kolumny trudności bez odpowiednika w danych, SzMax z HANDOFF nie z
  danych — dane dają 30/50/70).
- rozdz. 11 „mur 5+3/poziom": NIEZGODNE (mury mają obronę 0 + bonus +200%, fraza nie istnieje na
  pinie).
- rozdz. 13: CZĘŚCIOWO (Rzymianie +35% odnowy i Chińczycy OK; Rzymianie „−20% kosztu budynków"
  NIEZGODNE w KIERUNKU — dane dają +20%, HARMFUL, brak konsumenta runtime; dodatkowo odkryto
  „Rzymianie −5% korupcji" też NIEZGODNE, dane=0).
- rozdz. 12 „próg ≥40": CZĘŚCIOWO (zgodne z danymi, ale 7 miejsc w tym samym rozdziale mówi „+20").
- rozdz. 17 „Spacja=Wykonaj": NIEZGODNE (sam Poradnik sprzeczny wewnętrznie; kod to cykl do
  następnej armii, `main.ts:36131`).
- rozdz. 28: NIEZGODNE (brak kopalni w epoce Kamień; Bydło praca 4 nie 3).
- rozdz. 57 „47/47 Moc w polu": NIEZGODNE. Przeliczono systematycznie 50 wierszy → 49 dopasowań w
  `units.json`, 1 zgodna (Miecznik galijski), 48 niezgodnych w stosunku 0,37-0,90, Kusznik brak w
  danych.
- rozdz. 91 Posąg Peruna: NIEZGODNE (dane: epoka 3/Żelazo, Poradnik inna epoka; koszt 140 zgodny).

Część A (rozdz. 14/15/16): kilkanaście twierdzeń zweryfikowanych (część NIEZGODNE: AI nauka/
produkcja Trudny, min. populacja AI, obca religia, Rzymianie korupcja; część ZGODNE). ~11 wierszy
NIEROZSTRZYGNIĘTY z braku dowodu w tej rundzie — to dozwolony status z legendy, jawnie wyznaczony
jako zakres ewentualnej kolejnej rundy, nie ukryty rozjazd.

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora. Opcjonalny osobny temat na dociągnięcie ~11 wierszy
NIEROZSTRZYGNIĘTY części A (niska wartość — nie blokuje P1, rozważyć razem z gate synthesis).
DEPLOY/PUSH: NIE WYKONANO
