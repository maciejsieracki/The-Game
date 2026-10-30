# AutoBot dispatch — R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1

**Cel:** zweryfikować w prawdziwej bitwie Chromium wieloetapowe ręczne rozkazy dużej, mieszanej armii, w tym `atakuj-marszem` wydany podczas uprawnionej aktywacji, reakcję na napotkanego wroga i dalszy marsz do pustego heksu.

**Kryteria odbioru:** (1) produkcyjne kliknięcia wskazują jednostki, cel wroga i pusty heks; (2) pełna partia 28 jednostek przechodzi kolejkę, a kolejka się opróżnia; (3) exact-target atakuje wskazany cel; (4) attack-march zapisany przed aktywacją wykonuje nowy atak na zagrożenie na trasie, po czym zachowuje rozkaz i rusza w stronę punktu; (5) brak błędów strony/konsoli; (6) niezależny Evaluator, Obrona i Final Control zapisują swoje decyzje.

**Baza:** `main` / `origin/main` `0b26f675032818e7321d54dd4aeec81b1974d5cc`. Operator sprawdził, że źródło `gra/src/battle/battleScene.ts` ma identyczny SHA-256 w bazie oraz w testowym worktree: `62912413722edf4dd310eaa89d05c38938d9c405fa59b1a73d7d77c2bfb4d734`. Zakres jest walidacją istniejącego zachowania i trwałym testem regresyjnym; nie zakłada z góry zmiany produktu.

**Zależności/ograniczenia:** wcześniejsza runda R2 była nierozstrzygająca z powodu błędnego zegara testu. R3 musi sprawdzić `acted=false` i indeks tury przed kliknięciem oraz odróżnić świeże zdarzenie walki od wcześniejszego ataku.
