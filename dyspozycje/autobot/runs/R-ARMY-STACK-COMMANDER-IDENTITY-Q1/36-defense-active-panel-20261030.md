# Niezależna Obrona — aktywna karta Wodza/Generała

**Werdykt: PASS-WITH-NOTES.**

Obrona sprawdziła aktywną ścieżkę panelu oraz lokalny diff. Tylko jednostki z `isGeneral === true` dostają `★ Wódz`/`★ Generał`; zwykłe jednostki tego samego typu pozostają bez oznaczenia. `SidePanelHud` odczytuje `data-unit`, a callback przekazuje dokładne ID; w `main.ts` prowadzi ono do `selectPlayerUnit(id, true, unitSideDetailExpanded)`. Test 89 kart zawiera dwa kliknięcia dowódcy (Wódz/Generał), 88 zwykłych kart bez flagi; 8/8 Chromium, typecheck PASS.

Ograniczenie: nie uruchomiono pełnej kampanii i nie selekcjonowano dowódcy w żywym stanie świata. Nie wykryto błędu wymagającego korekty operatora. Niezależna Obrona akceptuje przekazanie do Final Control.
