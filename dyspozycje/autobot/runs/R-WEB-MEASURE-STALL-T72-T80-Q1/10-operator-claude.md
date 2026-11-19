STATUS: BLOCK (częściowo: przyczyna t72 ustalona i naprawiona w narzędziu, nieprzetestowana na żywo; t80 NIE ZREPRODUKOWANA)
DOMAIN: GAME (diagnoza + narzędzia pomiarowe; błąd gry nie naprawiany)
TEMAT: R-WEB-MEASURE-STALL-T72-T80-Q1
GOAL: wyjaśnić i usunąć przyczyny zatrzymań biegów pomiarowych z autopilotem gracza (seed 4242 t72, seed 7 t80).
BAZA: 59d04b65cf5b33864f617d3675efdc68cb2091c5 (origin/main), worktree wf_bb6f0032-7be-1.

ZMIANY-COMMIT: gra/tools/measure-close-modals.cjs (nowy); gra/tools/ai-economy-measure-run.cjs (3 miejsca: selektor ✕ karty technologii w closeModalsInPage; podpięcie logu `[EndTurn] blocked` w attachDiagnostics; opcjonalne MEASURE_CHROME_ARGS w launch). Brak zmian w gra/src/**.

PRZYCZYNA (a), seed 4242 t72 — ZMIERZONE statycznie (dowód: /tmp/terr2-out/seed4242.summary.json, pole modal.dom):
- Aktualna karta technologii (gra/src/ui/techDiscoveryNotice.ts, showTechDiscoveryNoticeViaEntityCard, addTdnCloseButton) ma przycisk ✕ klasy `.tdn-entity-close` i NIE ma atrybutu data-act="close". Atrybut data-act="close" występuje tylko w przestarzałej ścieżce _legacyShowTechDiscoveryNotice.
- Runner szukał `[data-act="close"]`, nie znajdował przycisku, nic nie klikał: techNoticeClosed=0 przez cały bieg, canEnd=false przy otwartym hoście. DOM z dowodu (`tdn-entity-card-v2`) potwierdza wariant v2.
- Naprawa (tools only): selektor `.tdn-side-card .tdn-entity-close` (karta satelita pierwsza, jak gracz), potem `[data-act="close"], .tdn-entity-close`.

PRZYCZYNA (b), seed 7 t80 — NIE ZMIERZONO:
- Zrzut: modal wszystko false, battle wszystko false, pending 0, więc blokada spoza trzech modali i bitew. Kandydaci z canPlayerInitiateEndTurn (gra/src/main.ts, ok. l. 42569): pendingForcedPeaceTreaties (pokój wymuszony, nieobecny w zrzucie), hasBlockingAiTradeOfferForPlayer (oferta spoza filtru rejectAwaitingAiOffers), NNS po bypassie, galleryOn/gameOver/aiCmdResume.
- Runner nie logował powodu (console.warn `[EndTurn] blocked` nie był zbierany). DODANO log (attachEndTurnBlockLog): powód trafi do seedN.events.log przy następnym biegu.

PRÓBY ODTWORZENIA (ZMIERZONE):
- seed 7, świeży profil, bundle z origin/main (vite, poza repo): dochodzi do t66–t69 w ok. 460–540 s, bez stall. Dziennik blokad: awaitingFirstPlayerCity (start), NNS (dosypka obsłużona), endTurnInProgress (przejściowe).
- Wznowienie ze slotu (--every 10) kończy się crashem przeglądarki (Chromium "Target closed"; w jednym przypadku "Received signal 11") przy openGame, zanim gra wystartuje. Cztery próby: różne profile, kopia profilu, --start none, --mute-audio. Bez działającego wznowienia nie da się dojść do t80 w limicie 590 s na jedno Bash.
- Po naprawie selektora bieg do t72 (seed 4242) NIE wykonany: NIE ZMIERZONO. Brak dowodu na ≥5 tur za punktem zatrzymania dla żadnego ziarna.

TESTY: tsc --noEmit: exit 0. ai-economy-measure-hook-test: 23/23 zielone. node --check obu plików: OK. Bramki logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6 NIE URUCHOMIONO (zmiany tylko w tools/, bez gra/src).

BLOKADY: (1) wznowienie slotu crashuje Chromium w tym środowisku; (2) brak reprodukcji t80; (3) potwierdzenie naprawy t72 wymaga biegu ≥80 tur (fresh, ok. 10 min, kilka wywołań).

RUNDY: 1/5
NASTĘPNY KROK: (a) orkiestrator decyduje o rundzie 2: naprawa wznowienia (przyczyna crashu przy startGame na zapisanym profilu) albo bieg fresh ≥90 tur bez wznowienia ze slotu; (b) po biegu seed 7 do t80 odczytać `[EndTurn] blocked` z seedN.events.log; jeśli gra blokuje przez pendingForcedPeaceTreaties lub ofertę poza filtrem, DECISION_REQUIRED z nowym tematem R-WEB-*.

UWAGI-DLA-ORKIESTRATORA: kilka procesów chromium z user-data-dir /tmp/playwright_chromiumdev_profile-* działa poza tym worktree (nie moje, nie ruszane). Dane /tmp/terr2-out użyte tylko do odczytu.
DEPLOY/PUSH: NIE WYKONANO
