STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-UNDEPLOYED-UNITS-LOST-Q1
GOAL: Jednostki spoza limitu pola bitwy (120/strona) nie znikaja po bitwie; komunikat o rezerwie; test niezmiennika.
ZMIANY/COMMIT: weryfikowany 494c29b730650df8f357618b5dbb3837d8119315 (rodzic 693626f69, baza a66a8480c); ten plik dodany osobnym commitem na jego wierzchu.
TESTY (odtworzone przez FC na 494c29b73): battle-undeployed-units 35/0; post-battle-map 32/0; auto-battle-loss-audit 52/0; map-field-battle 24/0; siege-manual 40/0; pre-battle-defender-retreat OK; auto-battle-active-roster 6/0; logic-test 213/213; ai-test 274/20 (= baza); tsc --noEmit EXIT=0; git diff --check czysty. Mutacja: usuniecie battleEventLog w mapFieldBattle.ts -> 34/1, po przywroceniu 35/0.
ZARZUTY:
1 (slaby test auto) - ODDANE: obrona przyjela, lossAtkPct=0.6.
2 (brak e2e BattleScene) - ODDANE: asercje zrodlowe na battleScene.ts (slice + eventLog z this.atk/def); live NIE_ZMIERZONO (zakaz dev/build w dispatchu).
3 (mutacje) - ODDANE: trzy miejsca wg obrony, mapFieldBattle powtorzona przez FC.
4 (mapFieldBattle.ts poza allowlista) - ODDANE: ta sama wadliwa sciezka, kilka linii; odstepstwo ujawnione orkiestratorowi.
5 (wipeDefenderOnCityCenter usuwa rezerwe przy zdobyciu miasta) - DO DECYZJI CZLOWIEKA: istniejaca regula zdobycia miasta; pytanie ABC przez orkiestratora, nie blokuje.
6 (widocznosc hintu) - ODDANE: z-index 10030 ponad scena (9999); live NIE_ZMIERZONO; ograniczenie: hint odroczony w EOT traci flage aboveBattle.
7 (brak logow gate) - ODDANE: gate-*.txt w runie.
NAPRAW: brak.
BLOKADY: brak. NIE_ZMIERZONO: live Chromium. Migracja: utraconych juz jednostek nie da sie odzyskac z zapisow.
RUNDY: 3/5
KOLEJNOSC INTEGRACJI: baza a66a8480c jest w origin/main (7090824758); merge-base z origin/rust-port/parity-v2 = f4c89d008 (parity-v2 = 8bc2efcf8). Zmiana tylko gra/ (TS), rozlaczna z rust-port: integrowac do main po FC; parity-v2 niezalezne, REPIN po zmianach weba.
NASTEPNY KROK: integracja orkiestratora (494c29b73 + commit FC) -> READY_FOR_DEPLOY po zielonych bramkach.
DEPLOY/PUSH: NIE WYKONANO
