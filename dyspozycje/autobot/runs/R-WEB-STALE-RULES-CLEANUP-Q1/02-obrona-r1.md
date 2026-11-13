STATUS: PASS-WITH-NOTES
TEMAT: R-WEB-STALE-RULES-CLEANUP-Q1 (obrona r1)

Zarzut 1 (tooltip buildModeHud.ts:211): ODRZUCAM. Zmiana dotyczy literalu opisu `title`; dispatch dopuszcza "teksty opisow". `git grep "surowce, infra"` w gra/src i gra/tools: 0 trafien. Do swiadomego zatwierdzenia przez orkiestratora.

Zarzut 2 (M13): PRZYJMUJE. Pomiar: przy oknie t4-7 wszystkie 16 lasow jest wycietych w t0 i obsadzonych farmami w t1 (K2 i K3), wiec w t4 nie ma czego obsadzic. Dodano M13c-K2 (wolnoWycinac:false, las zostaje): farma w t0, tartak tylko w t4, po oknie zero. K3 tej sciezki nie przyjmuje.

Zarzut 3 (piny food-hodowla): ODRZUCAM. praca=4 jest w data/terrain-improvements.json od 297c60cc6; trzoda nie jest surowcem (#4, LIVESTOCK_NOT_RESOURCE). Dane bez zmian.

Zarzut 4 (pelnosc): ODRZUCAM jako niedowod. `git grep` fraz (centrum, zwykly heks, 1 na 10, max 3 na etap, promien 10, miekka rezerwacja, poza limitem) w 4 plikach src: kazde trafienie oznaczone NIEAKTUALNE/HISTORIA/decyzja.
