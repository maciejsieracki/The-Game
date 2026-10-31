STATUS: FAIL
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-AUTOIMPROVE-PRIORITY-Q1
GOAL: Objaw B (trzoda i irygacja po farmie) - przyczyna plik:linia + dowod z realnego przebiegu albo naprawa; D1/D3/D4 wlasciciela.
ZMIANY/COMMIT: SHA do oceny d2cdda7c5 (= 83d837412 + test D1; src identyczne z 83d837412). Kod R1/R2 w 607f636fe, 985358d2a (auto-improvements.ts +49/-10 wzgledem 4d1916f2c). Baza 4d1916f2c = origin/main (merge-base zweryfikowany). Allowlista zachowana: diff 4d1916f2c..d2cdda7c5 = gra/src/game/auto-improvements.ts, gra/tools/*, runs/R-WEB-AUTOIMPROVE-PRIORITY-Q1/**. Zero zmian poza lista.
TESTY (zmierzone przeze mnie na d2cdda7c5, npm ci --ignore-scripts, node_modules usuniete po): tsc --noEmit czysty; wyrab-rzeka-d1 2/0; wyrab-rzeka-krok0 3/0; wyrab-rzeka-r2 10/0; auto-improvements 45/0; ai-improvements 53/0. diplomacy/war-era-counter/ring: NIE_ZMIERZONO (brak zmian w src wzgledem R2; nie uruchamialem).

ROZSTRZYGNIECIE ZARZUTOW:
1. Objaw B nie odtworzony na realnej sciezce - NAPRAW (Obrona sama przyjela). Kryterium dispatchu: to nie jest PASS.
2. Rozjazd nazw tech - ODDAL: improvement-tech.ts:39 ma alias 'Irygacja' -> 'Gospodarka wodna' (zweryfikowane). Zbior tech: main.ts:35734 unlockedTechSetForOwner(hOid) vs :35776 player.zbadane - dla fotela 0 ten sam obiekt wg Obrony, ale NIE zmierzone w runtime; isImprovementAllowedForCiv, prevLayers, applyBuildRequest/canAddFoodLayer po stronie wykonania nadal bez pomiaru - to wchodzi do NAPRAW z pkt 1.
3. Trzoda: brak instrumentacji bramek na realnym stanie, brak naprawy/mutacji - NAPRAW.
4. Irygacja cap 33% x koszt 60 - tylko syntetycznie, hipoteza - NAPRAW (potwierdzic na realnym przebiegu).
5. D3 i D4 niewdrozone - NAPRAW. D1 wdrozony (riverKrok0Ok) i potwierdzony czerwony/zielony/mutacja (korekta Obrony przyjeta). Zasada dispatchu: przy konflikcie stara regula zostaje w spornym miejscu, reszta prac nie jest blokowana - D4 (kolejnosc E1-E4 + E5) da sie wdrozyc z etapowym limitem na ture bez czekania na Q3/Q4.
6. Q3/Q4 ABC - NAPRAW: Q4 pyta o rzecz juz rozstrzygnieta (D4=TAK) bez pomiaru, ktore asercje "kompleksowosc hexa" padaja; Q3 czesciowo dubluje D1/D3. Q1 (JSON bydlo wymaga zloza vs kod) i Q2 (cap 33% vs E4) sa realnymi konfliktami stara regula/nowa decyzja - zasadne jako ABC; pytania zadaje wylacznie orkiestrator (uwaga procesowa).
7. Bramki PRZED/PO dla diplomacy/war-era/ring - ODDAL: R3 bez zmian src, brak czego mierzyc.
8. Niespojnosc "zero zmian w src" - ODDAL (Obrona wyjasnila: dotyczy tylko 83d837412).

WERDYKT: FAIL (zarzuty 1,3,4,5(D3/D4),6 = NAPRAW).
BLOKADY: brak realnego przebiegu (symulacja tury sciezka main.ts:~35727 / Chromium); brak instrumentacji bramek; D3/D4 niewdrozone.
RUNDY: 4/5 (zostaje 1 runda - R5 musi domknac Objaw B pomiarem na realnym przebiegu ORAZ wdrozyc D4/D3 z testami czerwony/zielony/mutacja, albo LIMIT-5-EXCEEDED z decyzja wlasciciela).
NASTEPNY KROK: Operator R5 (to samo ID) -> Evaluator -> Final Control. Orkiestrator zadaje wlascicielowi tylko Q1 i Q2 (realne konflikty).
KOLEJNOSC INTEGRACJI: nic do integracji (FAIL). Po PASS: rebase na aktualny origin/main (baza 4d1916f2c); temat webowy dotyka tylko gra/ i dyspozycje/, rozlaczny z rust-port/ - nie zalezy od origin/rust-port/parity-v2 i nie powinien byc na niego laczony.
DEPLOY/PUSH: NIE WYKONANO
