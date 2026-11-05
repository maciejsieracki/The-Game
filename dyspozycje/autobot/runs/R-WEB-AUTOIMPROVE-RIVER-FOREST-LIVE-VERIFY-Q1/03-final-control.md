STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-RIVER-FOREST-LIVE-VERIFY-Q1
GOAL: Dowod w realnym endTurn (Chromium, ?civTest=1), ze las przy rzece na polu obywatela jest wycinany w pierwszej mozliwej turze, albo znalezienie i naprawa przyczyny.

ZMIANY/COMMIT: ocenianym SHA jest 7e6b27d98 (na d12585dac, baza ee269b6ed). Tylko dokumentacja, dowody i narzedzia testowe. Zero zmian w gra/src, gra-robocza, WERSJE.md, rust-port, src-tauri, battle. `git diff --check` czysty. Poza runem zmienione: gra/tools/autoimprove-river-forest-live-verify-q1-test.cjs (nowy test, ASSERT=1) i gra/tools/autoimprove-live-hooks-test.cjs (aktualizacja przestarzalej sondy importu, uzasadniona). SHA do integracji: SHA commitu z tym raportem (fc-r2), patrz raport koncowy.

WERDYKT PER ZARZUT
1. Allowlista (.cjs): ODDAL. Plik przemianowany na nowy test z asercjami; miesci sie w "NOWY test". Aktualizacja live-hooks-test uzasadniona.
2. Brak dowodow obsadzenia recznego: ODDAL. Zweryfikowane w evidence/: s18 Zywnosc forest: tura 1 rfCut=13, rfMissed=0 (30 tur). s18 Zrownowazone forest: tura 1 rfMissed=13 (layerCounts tartak=6), tura 2 rfCut=13. s7 Zrownowazone forest: tura 1 missed 9, tura 2 cut 9. Dane zgodne z obrona-r2. Liczby "306->286" wycofane. Przyczyna opoznienia (KROK 1 przed rzeczna wycinka, ok. auto-improvements.ts:879) pozostaje hipoteza, oznaczona jako taka.
3. GOAL dla AI: ODDAL (w czesci NIE_ZMIERZONO). Raport juz nie nazywa patcha "prawdziwym bledem"; wczesne chybienia AI w s18/s42 tura 1 = NIE_ZMIERZONO. Poprawka AI wymaga zmiany typu AITurnOpts w gra/src/game/ai.ts, ktorego nie ma na allowliscie; Operator slusznie nie zmienil go poza allowlista.
4. Brak naprawy: ODDAL / DO DECYZJI. Poprawka AI jest w proposed-ai-sibling-exclusion.patch i wymaga rozszerzenia allowlisty (decyzja orkiestratora). Auto-rozdzial obywateli na lesie (turn-economy.ts, okolica.ts) to decyzja produktowa wlasciciela. Zadanie 3 samo przewiduje zgloszenie opoznienia KROK 1 w BLOKADY jako decyzje wlasciciela.
5. Zakres pomiaru: ODDAL z NIE_ZMIERZONO (s42 Zrownowazone, Zrownowazone "po", 30-60 tur dla s7/s42 Zywnosc, plik:linia chybien gracza). Brak jest jawnie oznaczony, nie fabrykowany.
6. Regresje: ODDAL. 24 logi gate-*.txt + gate-tsc.txt, kazdy z jedna linia EXIT=0 (zweryfikowane). Pelny glob 25 testow EXIT=0 na drzewie bez patcha; cztery poprzednie timeouty przeszly przy dluzszym limicie (wolny Chromium, nie regresja). Patch nie jest w drzewie, wiec nie testowany. tsc: gra/src nietkniete wzgledem ee269b6ed, wynik EXIT=0 wazny.
7. Format logow/dlugosc: ODDAL. Jedna linia EXIT= w kazdym logu; 02-obrona-r2.md = 594 slowa. Uwaga: gate-raw/*.tail.log wspomniane w obronie NIE ma w commicie (brak surowych ogonow; nieistotne dla bramki). 01-operator-r1.md 639 slow to raport historyczny r1.

Brak zarzutu wymagajacego NAPRAW w ramach allowlisty -> PASS-WITH-NOTES.
Nie powtarzalem pomiarow Chromium (ok. 9 min na przebieg, bundle vite poza repo); orzeczenie na podstawie dowodow w repo i diffu.

TESTY: git diff --name-status ee269b6ed 7e6b27d98 (tylko runs/<ID>/** + 2 pliki gra/tools); git diff --check czysty; 25/25 gate EXIT=0 (czytane z plikow, nie odtwarzane).

BLOKADY (do orkiestratora/wlasciciela, nie blokuja integracji tego SHA):
1. AI: rozszerzyc allowliste o gra/src/game/ai.ts i osobny temat: zastosowac patch, RED/GREEN na aiRfPersistMissed (s7,s42,s18), zbadac wczesne chybienia AI (tura 1-7, s42).
2. Gracz: auto-rozdzial obywateli nie stawia ich na lesie rzecznym (s7/s42: 0 wycinek w 22 turach) - decyzja produktowa.
3. Zrownowazony: KROK 1 odracza wycinke rzeczna o 1 ture na starcie (2 z 2 seedow) - w granicy 1-2 tur z dispatchu; decyzja wlasciciela.

RUNDY: 2/5 (Final Control po obronie)
NASTEPNY KROK: integracja orkiestratora SHA fc-r2 do main (dokumentacja i narzedzia testowe; brak konfliktu z gra/src). Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezna - zmiana nie dotyka rust-port/ i nie wymaga repinu; najpierw main. Osobne tematy dla BLOKAD 1-3.
DEPLOY/PUSH: NIE WYKONANO
