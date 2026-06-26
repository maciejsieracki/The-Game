# ZAPYTANIE UI -> CYWILIZACJE (przez Maciej): dane do panelu Dyplomacji + kreatora nowej gry  [2026-06-25]

UI ma: (a) stub panelu Dyplomacji (diplomacyPanel.ts) i (b) kreator nowej gry (newGameFlow.ts) czytajacy civs.json.

A. DYPLOMACJA (panel relacji):
1. Skala 5 TIEROW relacji — potwierdzcie nazwy + progi. UI przyjal ROBOCZO (z Dyplomacja-zasady):
   Wojna <15 / Wrogi <30 / Neutralny <60 / Przyjazny <120 / Sojusz >=120 (na ciagu Relacja 0..200).
   Czy to Wasza OFICJALNA skala (nazwy + progi)?
2. Jak UI dostanie relacje per rywal? Propozycja hak: getRelations() => [{ civ, tier:0..4, zaufanie?, respekt? }].
   Czy silnik mapuje Relacja 0..200 -> tier 0..4, czy UI ma mapowac po progach? Kto wlasciciel mapowania?
3. diplomacy.json — czy stamtad UI ma czytac progi/etykiety, czy dostanie gotowy tier od silnika?
4. Czy panel ma miec AKCJE dyplomatyczne (wypowiedz wojne, pakt, handel) w v0.1, czy tylko PODGLAD relacji?

B. KREATOR NOWEJ GRY (civs.json):
5. Czy civs.json jest KOMPLETNE i to ZRODLO PRAWDY listy cywilizacji? UI czyta pola: Cywilizacja,
   "Styl / charakter", "Jednostka specjalna", "Bonus startowy". Czy dojda jeszcze pola/emblematy/ikony
   per cywilizacja, ktorych UI ma uzyc (dzis emblemat = pierwsza litera nazwy)?

Po odpowiedzi: wpne realne dane w diplomacyPanel (przez getRelations) i dopiesze kreator nowej gry.
