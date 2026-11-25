# R-WEB-TEST-DEBT-Q14-D2 — Final Control (runda 2/5)

STATUS: FAIL
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D2
GOAL: klasyfikacja i naprawa STARY-PIN/HARNESS w 25 testach kat. D (2. połowa), bez osłabiania asercji, bramki zielone.
ZMIANY/COMMIT: kandydat 9d149cd9cc0ab2da3f1ffdecd72aad316f49ade2 (baza f96787fb7). merge-base --is-ancestor f96787fb7 -> 9d149cd9c: TAK. diff --stat: 4 pliki gra/tools/*-test.cjs + 2 raporty w runs/R-WEB-TEST-DEBT-Q14-D2. Zero zmian w gra/src i gra/data. Allowlista zachowana.

## Weryfikacja 4 napraw (własne uruchomienie, solo)
- json-descriptions-sync-test: exit 0, 19 pass / 0 fail. Wyjątek dla pwPrzezMoc/ogonPokoju (nowe sekcje, celowe); żadnej asercji nie usunięto. OK.
- plony-budynkow-test: exit 0, 68 passed / 0 failed. H0 liczone od puli Nauki (teren+budynek), procenty bez zmian; delta Targowiska 4->3 uzasadniona podziałem metodą największych reszt (zmiana oczekiwanej liczby, nie osłabienie; wyprowadzenie w komentarzu). Akceptowalne.
- rydwan-konnica-x2-test: exit 0, 13 jednostek, 548 asercji PASS. Jawna tabela DECYZJE_NADPISANIA z powołaniem na commity; pozostałe pola nadal sprawdzane x2. Pin opiera się na commitach, nie na zapisie decyzji w KOLEJKA-WEB (zob. UWAGI).
- wojna-wymuszona-parowanie-test: exit 0, 50 pass / 0 fail. S2/S7 para bronze wg reguły 8df9ac864; dodany negatywny S2b (moc dowodowa wzrosła). OK.

## Bramki (własne uruchomienie na kandydacie)
tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat OK; ai-test 297/0; era-war-pairing-alliance 19/0; ai-ai-alliance-surcharge ALL GREEN.

## Oceniane zarzuty
1. Brak zmian testów: nieaktualne dla 9d149cd9c, naprawiono 4 testy. Załatwione częściowo.
2. Brak analizy przyczyn (git log -S, diff pinów) dla 20 testów: PODTRZYMANY. Obrona sama przyznaje 19 testów NIE-ZMIERZONO. Moja wyrywkowa kontrola 6 z nich (drewno-gate, zelazo-gate, stone-research-costs, fair-play-tier-grid, manual-rebalance-owner-era, war-allin-capital) potwierdza: wszystkie nadal exit 1, a komunikaty FAIL wskazują konkretne pinowane wartości (np. stone-research-costs "four approved costs"; war-allin-capital hashe referencyjne; fair-play-tier-grid progi gór) — analiza była wykonalna w kilka minut, zgodnie z dispatchem.
3-4. json-descriptions i TypeError: załatwione (dowody wyżej).
5. Siedmiu kandydatów BŁĄD-GRY bez dowodu: PODTRZYMANY; nadal tylko kandydaci.
6. unit-stock-cost-test zielony bez wyjaśnienia: drobne, NIE-ZMIERZONO, nie blokuje.
7. BLOCK bez blokady technicznej: obrona zmieniła na FAIL — słusznie.

## Kryterium binarne
"Każdy z ~25 testów ma klasyfikację i status": NIESPEŁNIONE. 19 z 25 = NIE-ZMIERZONO bez próby ustalenia przyczyny; wiarygodna lista kandydatów BŁĄD-GRY nie powstała. Brak blokady technicznej, więc FAIL, nie BLOCK. 4 wykonane naprawy są poprawne i nadają się jako baza rundy 3.

BLOKADY: techniczna brak. Procesowa: 19 testów bez analizy przyczyn.
RUNDY: 2/5 (zostają 3). Ostatni werdykt: FAIL.
NASTĘPNY KROK: runda 3 Operatora do tego samego ID na bazie 9d149cd9c; 19 testów w 2-3 paczkach: git log -S na pinowanej wartości, diff pinu vs dane/kod, klasyfikacja z dowodem; kandydaci BŁĄD-GRY z minimalnym odtworzeniem i wskazaną regułą. NIE-ZMIERZONO tylko z notą "co sprawdzić" po realnej próbie. 4 naprawione testy zachować.

## UWAGI-DLA-ORKIESTRATORA
- Piny Rydwana egipskiego/Jeźdźca z oszczepami (fb17e765a) i woła (e06ad53c8d) opierają się na commitach; rozważ potwierdzenie w KOLEJKA-WEB.
- Kandydaci BŁĄD-GRY nadal niepotwierdzeni: drewno-gate, zelazo-gate, endturn-battle-deadlock-exec, eliminacja-lup-kwoty, rydwan-bierny-atak, surrender-rekrutacja, trade-routes-income.

DEPLOY/PUSH: NIE WYKONANO
