STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza/projekt; bez zmian logiki gry)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: Zinwentaryzować forty/posterunki, opisać, gdzie AI je stawia i dlaczego rzadko; zaproponować mechanizm wyścigu o teren dla AI z wariantami, rekomendacją i pytaniami ABC.
ZMIANY-COMMIT: dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md (projekt, sekcje 1–8) + ten raport. Baza 64208a85b. SHA: patrz pole sha w wyniku.
TESTY: NIE ZMIERZONO. Pomiar przed zmianą (3 ziarna × ≥150 tur) nie został wykonany: harness wymaga ok. 2 min startu i 6–50 s/turę, a dispatch zabrania przebiegów w tle; wymaga to wielu wznowień. Bramki kodu nie były uruchamiane (żadnego dotknięcia main.ts ani kodu gry). Nie utworzono narzędzia gra/tools/territory-race-measure-run.cjs.
BLOKADY: brak blokad technicznych. Pomiar przeniesiony do kolejnej rundy (plan w sekcji 6 projektu). Koszt utrzymania fortów i posterunków NIE ZWERYFIKOWANO (brak pola w danych). Szczegóły UI budowy dla gracza NIE ZWERYFIKOWANO.
RUNDY: 1/5
NASTĘPNY KROK: (1) właściciel rozstrzyga P1–P5 z sekcji 7 projektu (rekomendacje: P1=A, P2=A, P3=A, P4=A, P5=A); (2) etap 0 — pomiar PRZED w kolejnej rundzie z planem z sekcji 6; (3) etap 1 wariantu C po zatwierdzeniu.
DEPLOY/PUSH: NIE WYKONANO

Kluczowe ustalenia (z kodu, plik:linia):
- Fort: epoka 3, Wojskowość, koszt 25, zasięg 5 (terrain-improvements.json:274). Posterunek: epoka 2, Obróbka drewna + Murarstwo, koszt 30, zasięg 3 (json:402).
- Spór terytorium: miasta przed fortami; fort vs fort wygrywa wcześniej zbudowany (src/map/territory.ts:122).
- AI, ścieżka 1: fort przez picker tylko po wyczerpaniu limitu miast (ai.ts:3017, auto-improvements.ts:643, 688).
- AI, ścieżka 2: planExpansionFortBuilding (ai.ts:3093): fort/posterunek tylko na heksie własnej, już stojącej jednostki; brak ruchu jednostek; maks. 1 posterunek na turę.
- Dlaczego rzadko: cztery bramki z kodu (limit miast, konieczność przypadkowej jednostki, technologie, budżet pracy). Hipoteza nie jest potwierdzona liczbą.

Rekomendacja: wariant C (etap 1 = wariant A bez ruchu, etap 2 = budowniczy z ruchem w zasięgu N kroków), po pomiarze PRZED.
