STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1
GOAL: Obwódka medalionu właściciela na tabliczce jednostki ma barwę danej pełnej cywilizacji (ta sama liczba co obwódka heksu, `civColorFn` = `_resolveOwnerColor`). Miasto-państwo (srebro) i barbarzyńcy (czerwień) bez zmian. Brak/zła barwa → mosiądz.
ZMIANY/COMMIT: kod bez zmian względem 883afa6da (odtworzony przez `git reset --hard 883afa6da` w worktree -872-3, czysty przed resetem). Nowe pliki tylko w dowodach: dowody/tabliczki-portret-r2.png, dowody/build-portrait-preview.cjs, dowody/shot-portrait.cjs, ten raport. SHA commitu rundy 2: zob. sekcja COMMIT poniżej.
TESTY (odtworzone w worktree -872-3, baza 7164f7ca1 + 883afa6da):
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/unit-owner-emblem-ring-civ-color-test.cjs`: 15 passed, 0 failed.
- `node tools/commander-star-emblem-test.cjs`: 12 passed, 0 failed.
- Nowy dowód portretu (Chromium 149, /opt/pw-browsers, produkcyjne moduły unitStatPlate.ts + unitOwnerEmblem.ts, leaderPortraitUrl zwraca SVG-portret): piksele obwódki (64,10) = #1e5aa8 (grecy), #c41e3a (chinczycy), #d4a017 (inkowie) — ścieżka portretu używa ringColor; miasto-państwo #b9c8d8 i barbarzyńcy #c84040 bez zmian. Zrzut: dowody/tabliczki-portret-r2.png (lewy skraj obcięty kadrem podglądu; piksele nieobcięte).
- KOREKTA ETYKIET (r1 i skrypty podglądu): w r1 etykiety były błędne. Wg `gra/data/civs.json` (`ikonaId` → `kolorHex`): #c41e3a = **chinczycy** (nie „Persowie” — cywilizacji „persowie” w danych nie ma), #d4a017 = **inkowie** (nie „Celtowie”; celtowie = #3d6b35), #5c4033 = **asyria** (nie „ciemna cywilizacja”). Wartości hex są poprawne; błędne były nazwy.
- Kontrast (WCAG, tarcza rgba(12,17,26,0.92) ≈ #0c111a): asyria #5c4033 = 2.01:1; chinczycy #c41e3a = 3.24:1; grecy #1e5aa8 = 2.78:1; mosiądz #e8d88a = 13.16:1.
- Kolizja czerwieni (WCAG-owy stosunek jasności, nie ΔE; orientacyjnie): barbarzyńcy #c84040 vs chinczycy #c41e3a = 1.19; vs slowianie #b83232 = 1.20; vs fenicjanie #9b2335 = 1.59; vs rzymianie #8b1a1a = 1.89. Czerwone są też inne cywilizacje, więc zbieżność nie dotyczy tylko jednej.
- Mapowe obwódki dyplomatyczne: wojna = RELATION_BORDER_COLOR_WOJNA 0xff5252 (src/game/civ-visual.ts:84), nie #c84040.

BLOKADY I ODPOWIEDZI NA ZARZUTY EVALUATORA (r1 -> r2):
1. Zrzut z ŻYWEJ gry (≥3 właścicieli): PRZYJMUJĘ jako lukę niezamkniętą w tej rundzie. Nie wykonano live-scenariusza (vite build do scratch outDir + przejście kreatora i rozgrywka z ≥3 właścicielami wymaga osobnego skryptu klasy R-HOTSEAT-*-live-test). ZAŁOŻENIE: wiring `ringHex` w main.ts (`civRingHexFn`, l.3745 i pole l.9108) to jedna linijka przekazująca wynik tego samego `civColorFn`, który już rysuje obwódki heksów; pokryte testem źródłowym i tsc. Final Control: decyzja, czy wymagać żywego zrzutu przed READY_FOR_DEPLOY.
2. Zbieżność czerwieni (zarzut mówi „Persowie”; w danych takiej cywilizacji nie ma, chodzi o chinczycy #c41e3a): ODRZUCAM zmianę kodu. Barwa pochodzi z `civs.json` (`kolorHex`), a GOAL wymaga tej samej liczby co obwódka heksu. Barbarzyńcy są w GOAL wprost „BEZ ZMIAN”. Dowód: wyżej (1.19:1, także słowianie #b83232). Rozróżnienie: sygnet barbarzyńców to czaszka (`barbarianSigilSvg`), a nie sigil cywilizacji. Mapowa obwódka wojny barbarzyńców to inna barwa (#ff5252, civ-visual.ts:84). Czerwone są też rzymianie, fenicjanie i słowianie, więc to ryzyko danych, a nie błąd tego tematu. Zostaje jako ZAŁOŻENIE i uwaga dla orkiestratora (ewentualna zmiana kolorów cywilizacji to osobny temat danych).
3. Kontrast ciemnej barwy #5c4033 (2.01:1 na tarczy): ODRZUCAM poprawkę. Barwa jest identyczna z obwódką heksu (wymóg GOAL/kryterium 1), a zmiana zniekształciłaby tożsamość cywilizacji. Kryterium 4 wymagało sprawdzenia zrzutem: zrobione (dowody/tabliczki-po.png, 4. tabliczka; obwódka widoczna). Zostaje jako uwaga.
4. Glif zastępczy (drawFallbackGlyph) w ringColor, sygnet SVG w mosiądzu: ODRZUCAM zmianę. Zakres tematu to obwódka (pierścień). Glif jest tekstowym zastępnikiem, a nie obwódką. Sigil SVG zostaje mosiężny (ZAŁOŻENIE, bez zmiany).
5. Portret władcy z pierścieniem na wierzchu: PRZYJMUJĘ i ZAMYKAM dowodem: dowody/tabliczki-portret-r2.png + piksele (64,10) zgodne z ringHex dla trzech pełnych cywilizacji. Skrypt: dowody/build-portrait-preview.cjs.

COMMIT: zob. `git log -1` na gałęzi worktree-wf_37a45ada-872-3 (commit rundy 2: tylko dowody/ i ten raport; kod bez zmian).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) potwierdza pikseli portretu i decyzje 1-4; Final Control po PASS. Zamknięcie zarzutu 1 (żywa gra) wymaga decyzji Final Control/orkiestratora (ZAŁOŻENIE powyżej), a nie operatora.
DEPLOY/PUSH: NIE WYKONANO
