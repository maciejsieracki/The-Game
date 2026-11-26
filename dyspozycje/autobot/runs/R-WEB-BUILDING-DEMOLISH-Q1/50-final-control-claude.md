STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-DEMOLISH-Q1 (WYBURZ, #175)
GOAL: gracz wyburza swoje budynki z panelu miasta za zwrotem połowy surowców (w dół); AI bez zmian.
ZMIANY-COMMIT: kandydat 3a00fd6ca43e0cb0c61693ed8e3740009b90f699; baza 1bb77a7a0cf44ffc135c546b3d441c67dcff5516 jest przodkiem kandydata (merge-base --is-ancestor: tak). Diff 6 plików, +463/-0: gra/src/game/building-demolish.ts (nowy), gra/src/main.ts (import + hook onDemolishBuilding w 2 miejscach), gra/src/ui/cityPanel.ts (przycisk Wyburz + confirm z podglądem zwrotu), gra/tools/building-demolish-test.cjs (nowy), 2 raporty w runs/. Wszystko w allowliście; brak zmian gra-robocza/kanon/WERSJE/rust-port.
TESTY (własne, na 3a00fd6ca, npm ci --ignore-scripts, node_modules usunięte po pracy):
- tsc --noEmit: exit 0
- building-demolish-test: 36 pass / 0 fail
- mint-orphan-test: 28/0; mint-capital-only-test: 8/0
- logic-test: 213/213; tech-tree: 20/0; research: 33/33; unit-replace: 21/21; combat: 6/6; ai-test: 297 passed, 0 failed
- Mutacje własne: floor->ceil 32/4 (czerwona); usunięcie pominięcia zer 34/2 (czerwona); zwrot 100% (half=v) 24/12 (czerwona). Plik przywrócony.
OCENA ZARZUTÓW: 1 (floor/ceil) i 2 (zera) zasadne, naprawione w obronie, potwierdzone mutacją. 3 (wcięcie) naprawione. 4 (wyjątki strukturalne: Pałac/mury w oblężeniu): ODDAL jako uwaga; zadanie właściciela mówi o wyburzaniu KAŻDEGO budynku, brak blokady zgodny z odp. 22C; skutki uboczne Pałacu (hasPalac w conquest-stability, korupcja, ulepszenia) do decyzji właściciela wg zasad ABC, bez zmiany kodu. 5 (UI live): NIE ZMIERZONO; test okablowania jest źródłowy. Przegląd kodu: tail zawsze zawiera upSpan, więc przycisk jest przypięty do wiersza; przycisk tylko w trybie nie-compact; confirm podaje zwrot; AI nie ma ścieżki do hooka.
BLOKADY: brak technicznych. Przed deployem: (a) zrzut z żywego Chromium panelu z przyciskiem i confirm (granica §9 pkt 6a) - NIE ZMIERZONO; (b) decyzja właściciela o wyjątkach strukturalnych (Pałac I/II/III, cuda, mury w oblężeniu).
RUNDY: 1/5 (FC po obronie r1).
NASTĘPNY KROK: integracja orkiestratora; live w przeglądarce; pytanie ABC o Pałac (język skutków dla gracza).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: żadnych nowych sesji nie uruchomiono. Prośba o rzekach 1:4:16 z początku kontekstu dotyczy #160, nie tego tematu; zignorowana.
