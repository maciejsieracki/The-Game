# Aktualny stan niezakończonych tematów

Odczyt: 2026-11-11, wznowienie w nowym środowisku. Repo `/workspace/The-Game`, baza `638e90bea`; zdalny main zgodny. Poprzednie cztery worktrees i niewypchnięte kandydaty nie są dostępne. Poprzednie wyniki w czacie są historią, nie nowymi zaliczonymi bramkami. Każdy temat jest odtwarzany i ponownie testowany.

| Temat | Potwierdzony etap bieżącego wznowienia | Operator / następny krok |
|---|---|---|
| Mury: palisada100 / kamienny150 / ceglany200, badania/karty/Civpedia | 1/11 | walls_resume; audyt i odtworzenie implementacji |
| Pomiń/AUTO oblężenia z wyłomem #202 | 1/11 | skip_resume; odtworzenie wspólnego zegara i rzeczywistych testów |
| Sojusznik: trwałe wezwanie do wojny | 1/11 | alliance_resume; odtworzenie trwałego inbox/history i testów |
| AI→gracz: cykliczny barter | 1/11 | trade_resume; odtworzenie fairness oraz naprawa wykonalności uczciwego drewno/żelazo |

Max4 tematy; role Operator→Evaluator→warunkowa Obrona→niezależny Final Control sekwencyjnie per temat, Luna high. Brak zadeklarowanego schedulera w tle. Raport nie zatrzymuje prac.

Ostatnia opublikowana Robocza: FALA617, commit554f5d5de, MD5 2b12c8176ee0b412fcd0b9a5ca392cdf. Granica−2/−3/−4, brąz25/50, konnica front/flanki/tył, koszty40/180/180/480, machiny oblężnicze, wojny epoki40/nonoverlap i pokój10tur są już opublikowane; nie otwierać ponownie.

Audyt PL Q3 chroniony na origin/codex/polish-ui-q3, odłożony dla murów. Dalsza kolejka: temat głównej armii AI wymaga sprawdzenia decyzji; duże imperium/Falanga/REPIN i #201 osobno, nie objęte tym wznowieniem czterech tematów.
