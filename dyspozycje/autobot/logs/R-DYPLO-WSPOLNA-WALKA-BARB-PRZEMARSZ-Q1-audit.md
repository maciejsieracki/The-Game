# Raport Evaluatora — `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1`

Data: 2026-08-20
Zakres: niezależna korekta statusu Operatora i audyt rozjazdu dokumentacja ↔
implementacja.
Werdykt: **PARTIAL-PASS / BLOCK-ABC**

## Ustalenia

1. `docs/decyzje/R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1.md` formalnie zapisuje
   wybór właściciela `1A + 2A + 3A`.
2. Commit `93b0fbef` w worktree tematu zawiera produkcyjne zmiany w silniku,
   UI i teście kontraktowym. Nie jest to zmiana wyłącznie dokumentacyjna.
3. Poprzedni raport Operatora i ten audyt błędnie opisywały temat jako
   niezaimplementowany. Błąd został skorygowany w niezależnych artefaktach;
   formalnej decyzji właściciela nie przepisuję.
4. W decyzji 3A występuje kara `−15 Zaufania`, ale brak formalnego wyboru
   kolejności względem modyfikatora Wiarygodności. To jest realny blocker dla
   kontraktu liczbowego, nie blocker dla już zaimplementowanego zakresu 1A/2A/3A.

## Kontrola kompletności ABC dla kary

Raport Operatora zawiera osobne pytanie D z trzema rozłącznymi ścieżkami:

- **A:** dokładnie `−15` po wszystkich modyfikatorach;
- **B:** bazowe `−15` przed modyfikatorem Wiarygodności;
- **C:** inna reguła, wymagająca wzoru, zakresu stron, momentu naliczenia,
  kolejności, zaokrąglenia i clampowania.

Każdy wariant ma opis, co najmniej dwa argumenty „za” i dwa „przeciw”. Nie ma
wyboru ani rekomendacji za właściciela.

## Test i decyzja o bramce

Test kontraktowy z commita `93b0fbef` jest właściwy dla formalnie dostępnej
decyzji `1A/2A/3A`; nie rozszerzam go o nierozstrzygniętą semantykę kary.
Do czasu formalnego wyboru D status dla tej części to **BLOCK-ABC**. Nie wolno
zmieniać logiki, dopisywać asercji liczbowej dla D, deployować ani pushować.

## Weryfikacja artefaktów

- decyzja formalna: obecna;
- commit referencyjny: zidentyfikowany;
- artefakt Operatora: skorygowany do `IMPLEMENTACJA-OBSERWOWANA / BLOCK-ABC`;
- artefakt Evaluatora: skorygowany do `PARTIAL-PASS / BLOCK-ABC`;
- zmiany w `gra/`: brak;
- deploy/push: niewykonane.
