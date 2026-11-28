STATUS: PASS-WITH-NOTES
DOMAIN: GAME-TEST (pomiar/testy; zero zmian gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q16C
GOAL: trzy czerwone testy (ai-wojny-cap-dwa-miasta, hotseat-drugi-fotel-tura, hotseat-etap4-noop) zielone albo sklasyfikowane A/B/C z dowodem; pytanie B (−11 → −108) zbadane bez poprawki gry.
ZMIANY/COMMIT: kandydat 01a63e95a1ef97c13117be0abee089e7ccf27d05; `git merge-base --is-ancestor 1e7cccfa7 01a63e95a` = TAK. `git diff --stat 1e7cccfa7..01a63e95a`: 15 plików, wszystkie w allowliście (gra/tools/hotseat-etap4-noop-test.cjs, gra/tools/tdq16c-*.cjs, dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16C/*.txt/md). `git diff gra/src gra/data` = 0 (pusty). Brak nieśledzonych śmieci po bramkach (git status czysty).
TESTY (własne uruchomienie FC na 01a63e95a, gra/, po npm ci --ignore-scripts):
- tsc --noEmit: RC 0
- logic-test: LOGIC OK (213/213)
- ai-test: 297 passed, 0 failed
- tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0
- hotseat-etap4-noop-test (live Chromium, ~12 min): NIE URUCHOMIONO ponownie przez FC; oceniono dowód runs/…/60 (FAIL 4/30 bez normalizacji), 61 (PASS 30/30, jsExc 0/0) i diff testu. Diff dodaje wyłącznie closeBattleOverlays (realny klik Auto/Kontynuuj; gra celowo blokuje zapis w trakcie bitwy, main.ts isSaveBlockedByBattle) i normalizeStackGroupClocks (tylko segment czasu Date.now() w stackGroupId; owner i licznik zostają porównywane). Asercje i próg 30/30 nietknięte: nie osłabia testu. Mutacje czerwone→zielone udokumentowane (bez closeBattleOverlays → BLOCK t23; bez normalizacji → 4/30).
- ai-wojny 22/0 i hotseat-drugi-fotel 5/5: już w main (125b7aa14), nie powtarzano.
OCENA ZARZUTU NR 1 (pytanie B nie zmierzone na maksimum / ziarnach 11 i 7): ODDAL jako uwagę, nie NAPRAW. Uzasadnienie: obrona przyjęła zarzut i wykonała pomiar na maksimum (Trudny, dyplomacja/kultura trudny, Koszty jednostek x4, Super Huge) na ziarnach 11 i 7 (runs/…/70–72, narzędzie tdq16c-pytb-max.cjs, PAGEERRORS 0). Skoku −108 nie odtworzono. To zadanie analityczne bez poprawki gry, więc otwarty status pytania B nie blokuje kryterium tematu (trzy testy zielone/sklasyfikowane, zero zmian gra/src). Dokument uczciwie oznacza NIE ZMIERZONO. Założenie: maksimum = Wysoki x4, Super Huge, Trudny; koszty budynków zostały na niski (wysoki niezmierzony).
BLOKADY: brak blokujących. UWAGI:
 1. Niespójność w dokumencie: sekcja 2 wciąż zawiera „Klasyfikacja: ZAMIERZONE”, a Stan wiążący i sekcja maksimum mówią, że wniosek nie jest potwierdzony (pytanie B otwarte jako sandbox-only). Wiążący jest Stan wiążący; sekcja 2 opisuje tylko arytmetykę sandboxu (pace niski, 3 jednostki).
 2. Ziarna 11 i 7 dają identyczne liczby (przyczyna niezbadana); scenariusz max (1 miasto, 2 jednostki, racja auto) nie jest odpowiednikiem sandboxu (3 jednostki, racja ręczna).
 3. etap4-noop działa na ustawieniach zaszytych w haku (pace niski), nie na maksimum; hak niedostępny bez zmiany gra/src.
RUNDY: FC 1 (po rundzie 3 Operatora i obronie r3, z limitu 5)
NASTĘPNY KROK: integracja orkiestratora (merge-tree 01a63e95a, bramki, rejestry) → READY_FOR_DEPLOY N/A (tylko testy/dokumentacja). Pytanie B pozostaje otwarte jako sandbox-only; powiązane z Q42 (CZEKA NA WŁAŚCICIELA).
DEPLOY/PUSH: NIE WYKONANO
