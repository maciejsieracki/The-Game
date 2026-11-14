STATUS: PASS-WITH-NOTES (punkt 2 PASS; punkt 1 częściowo; punkt 3 NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1
GOAL: dowód w żywej grze (Chromium, bundle z vite build poza repo, ?civTest=1) dla trzech punktów NIE_ZMIERZONO: (1) W18 machiny oblężnicze na listach rekrutacji przed/po techu, (2) W24 lewy baner przy 1000x700 / 800x600 / 640x480, (3) straty zwycięzcy w bitwie ręcznej (≥5 bitew, porównanie z trybem auto „pewne”).
BAZA: origin/main 7aaa231d6 (detached HEAD w worktree wf_a2399dda-d3d-1). Bez zmian w gra/src i gra/data.

ZMIANY/COMMIT: pliki nowe (allowlista): gra/tools/live-verify-w18-w24-manual-losses-w18.cjs, gra/tools/live-verify-w18-w24-manual-losses-w24.cjs, dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1/10-operator-claude.md, .../evidence/ (JSON + 5 zrzutów PNG). SHA commita: patrz pole sha w odpowiedzi strukturalnej (commit po dopisaniu raportu). Build: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/claude-0/w18w24-build` (poza repo; wynik 14 676 914 B index.html + audio-pack-1/2/3.js). npm ci w gra/ (71 pakietów, node_modules ignorowany przez git).

TESTY (surowe wyniki z przebiegów):
- W24 (lewy baner .civ-hud-banner-left, przebieg z zamkniętym overlayem startowym; evidence/w24-lewy-baner.json):
  - 1000x700: innerW 1000, docScrollW 1000, hasHorizontalScroll false, leftBanner left 20 / right 370 (width 350), maxRight 370, overflowing [], klasa hud-left-fallback.
  - 800x600: innerW 800, docScrollW 800, hasHorizontalScroll false, leftBanner left 20 / right 270 (width 250), maxRight 270, overflowing [], fallback.
  - 640x480: innerW 640, docScrollW 640, hasHorizontalScroll false, leftBanner left 20 / right 190 (width 170), maxRight 190, overflowing [], fallback.
  - Zrzut 640x480 obejrzany: baner w lewym górnym rogu, 6 żetonów w układzie 3+3, cały w oknie, bez poziomego przewijania. Pod banerem widoczne menu boczne; na mapie wiszą dymki „Produkcja: Rzym” i „Ostia” (nie zasłaniają banera).
- W18 (panel „Rekrutacja — cała cywilizacja”, evidence/w18-rekrutacja.json):
  - PRZED techem (tura 1, start gry): lista = Rydwan (woły), Wojownik, Łucznik, Oszczepnik (4 pozycje, 4 przyciski „Rekrutuj”). Brak Tarana, Katapulty, Wieży oblężniczej (siegeHits = []).
  - PO window.__civTest.unlockAllTech(): lista bez zmian (te same 4 pozycje, siegeHits = []). Epoka nadal „Epoka brązu”.
  - Zrzuty obejrzane (evidence/w18-przed-tech-rekrutacja.png, evidence/w18-po-tech-rekrutacja.png): ten sam panel z czterema jednostkami; nie ma żadnej machiny. Na zrzucie „po” obok panelu otwarta jest też lista dyplomacji (pozostałość kliknięć, bez wpływu na pomiar).

NIE_ZMIERZONO / ograniczenia:
- W18 po odkryciu techu „Obróbka drewna” (Taran): NIE_ZMIERZONO w tym kontekście. Powód: w danych gry Taran ma tech „Obróbka drewna” (data/units.json, pozycja „Taran”), ale machiny oblężnicze nie są produkowane z panelu rekrutacji — budowa jest mechanizmem oblężenia (src/game/siegeMachines.ts; zob. #297: budowane tylko podczas oblężenia). Dlatego ani przed, ani po unlockAllTech nie pojawiają się w liście rekrutacji, a widoczność w panelu oblężenia wymaga aktywnego oblężenia, którego ten przebieg nie wywołał. Hak __civTest.unlockAllTech odblokowuje wszystkie techy, więc nie izoluje „Obróbki drewna”; nie dało się sprawdzić samego warunku techu dla Tarana. Wynik „po” jest więc NIE_ZMIERZONO, a nie PASS ani FAIL.
- W18 „wyższy tier” (Wieża oblężnicza/Katapulta): nie zmierzone z tego samego powodu (brak oblężenia).
- W24 nie obejmuje wariantów 1280/1024 px ani szerokich okien (poza zakresem dispatchu).
- Punkt 3 (straty zwycięzcy w bitwie RĘCZNEJ, ≥5 bitew, 1:1/1.5:1/2:1 w obu kierunkach, porównanie z trybem „pewne”): NIE_ZMIERZONO. Powód: w repo nie ma haka pozwalającego ustawić stosunek sił ani uruchomić bitwy ręcznej z dowolnymi armiami w żywej grze; dostępne presety (src/battle/testBattle.ts: maly, duzy, rzym_grecja, konnica, oblezenie, bitwa_duza_pole, oblezenie_duze) mają stałe składy, a przebieg bitwy ręcznej wymaga wielokrotnych klików w BattleScene. Nie wykonano; nie zgadywano wyników.
- Dispatch wspominał dodatek orkiestratora `00-dispatch-DODATEK-claude.md` na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0. Plik nie istnieje ani na tej gałęzi, ani na origin/main (sprawdzone git ls-tree i git show). Użyto dispatchu z commita be2ba2623 (origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0) i zasad z zadania.

BLOKADY: brak blokad technicznych dla punktów 2; punkty 1 (po techu) i 3 wymagają osobnego haka lub scenariusza (oblężenie / ustawiona armia i bitwa ręczna), ustalenie z orkiestratorem.

RUNDY: 1/5 (runda operatora, Haiku). Bez FAIL: nie stwierdzono defektu gry w zmierzonych punktach.

UWAGI-DLA-ORKIESTRATORA:
- Hak __civTest.unlockAllTech nie izoluje techu (nie da się wyłączyć pojedynczego). Do pełnego domknięcia W18 potrzebny hak „odkryj tech X” albo scenariusz z aktywnym oblężeniem.
- W probe ujawniono, że start gry przez __cityStateStartUnitsTestDebug.startNewGame otwiera nakładkę „Dyplomacja” (audiencja AI) — zamknięto ją przed pomiarem.
- Pliki w gra/tools są nowe i nie są częścią gra/src; nie dotykają produkcji.

NASTĘPNY KROK: (a) orkiestrator decyduje o haku „odkryj tech” lub scenariuszu oblężenia dla W18 po techu; (b) osobny temat dla punktu 3 (bitwa ręczna z ustawionym stosunkiem sił) — rekomendacja: dedykowany hook w gra/src/game/civ-test-hooks.ts za ?civTest=1, bo bez niego pomiar nie jest powtarzalny. Oba do rozstrzygnięcia przez FC/orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
