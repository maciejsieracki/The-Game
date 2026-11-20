STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-VERIFY-LIVE-B2-CIVTEST-HOOK-AND-WIZARD-Q1
GOAL: hak __settingsLive (?civTest=1) + 5 testów verify-live z żywą grą przez realny doStartGame + sekcja 6 dokumentu z surowymi liczbami i TAK/NIE.
ZMIANY/COMMIT: kandydat d843b0f6d3d1f509b3a50ad652a9ef86d3560219; baza d42ec85605bc26a8cba70adfc1696504acab6f48 jest jego przodkiem (merge-base --is-ancestor: tak). git diff --stat: 9 plików, +552/-6: gra/src/main.ts (+75, tylko blok importów i blok ?civTest=1), 5x gra/tools/verify-live-*-test.cjs, dyspozycje/analizy/WERYFIKACJA-NA-ZYWO-USTAWIENIA-2026-11-20.md, runs/.../10-operator-claude.md, 30-obrona-claude.md. Zakres w allowliście tematu; brak zmian w danych gry i poza hakiem.
TESTY (własne uruchomienia na d843b0f6d, surowe):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-replace-full-cost 40/0; ai-unit-replace-same-rules 45/0
- verify-live-unit-cost-pace, growth-toggle, diplo-war-level, improvement-cost-era, food-to-tax: wszystkie exit 0; "BAZA ZIELONA", "MUTACJA ... CZERWONA", "ZYWA GRA ZIELONA". Liczby z gry: Procarz rekrutacja 16/32/64, utrzymanie Pieniądz 8/16/32, żywność 16/32/64; Konnica 176/352/704; dyplomacja kara 10/20/30, bonus 12/6/4; koszt pracy farma 40, kopalnie 88; round-trip before==after; kurs 0,2, enabled=false bez Targowiska.
- Piny main-guard: road-hook-mainguard 19/0; diplo-war-peace-main-guard 35/0; diplomacy-sensible-deals-main-guard 22/0; forced-war-bronze-main-guard exit 0; diplo-war-peace-d7 8/0; army-merge-besieger-only-move 8/0; resource-ledger-consume 30/0.
- war-rules-multiwar-main-guard: 18 PASS / 3 FAIL (exit 1). Znany dług poza tematem (TESTDEBTQ13 w toku, 18/3 odnotowane przed tą zmianą); zmiana dotyka tylko bloku ?civTest=1, więc niezwiązane. Nie porównywano na bazie własnym uruchomieniem: NIE ZMIERZONO.
- diplomacy-sensible-deals-live-test: 4 pass / 3 fail — NIE sprawdzano na bazie; plik nie jest zmieniany w tej gałęzi, test niezwiązany z hakiem (NIE ZMIERZONO jako dług bazy).
OCENA ZARZUTÓW:
1 (brak scenariuszy live) – ODDAL: obrona zasadna, 5 testów ma teraz żywą grę przez doStartGame z asercjami i mutacjami.
2 (sekcja 6 pusta) – ODDAL: tabele 6a–6f z surowymi liczbami i TAK/NIE (zweryfikowane z moimi uruchomieniami; liczby zgodne).
3 (SIGSEGV po reloadzie) – ODDAL z uwagą: obrona podała pomiar (reload->saveRoundTrip exit 0), SIGSEGV nie odtworzono; load aktywnej gry nie testowany; round-trip w tej samej stronie przechodzi.
4 (utrzymanie) – ODDAL: pieniadzUpkeep i resourceUpkeep w hooku i testach, wartości w tabeli.
5 (improvementWorkCost) – ODDAL: hak bierze id i czyta terrain-improvements.json funkcją gry.
6 (tempo AI na sztywno) – ODDAL: zaszyte 'niski' usunięte, hak używa kosztJednostekPaceUtrzymania(); tura AI NIE ZMIERZONO.
7 (zapis do slotu) – ODDAL: odstępstwo opisane w komentarzu i 6f, dispatch wymaga round-tripu, slot testowy tylko pod ?civTest=1.
8 (brak testu pinującego) – ODDAL z uwagą: kontrola negatywna w testach, pin-testy zielone; osobny test pinujący nie dodany (UWAGA).
9 (BLOCK R1) – ODDAL: zastąpiony rundą 2, zacommitowane, bramki zielone.
BLOKADY: brak blokujących. NIE ZMIERZONO: efektywne kary dyplomacji w turze; plon ulepszeń WŁ./WYŁ.; zamiana Żywność->Podatek 100->20 z Targowiskiem; tura AI; wczytanie aktywnej gry po reloadzie (SIGSEGV).
UWAGI-DLA-ORKIESTRATORA: (a) war-rules-multiwar-main-guard 18/3 -> TESTDEBTQ13; (b) utrzymanie Pieniądz jednostek skalowane epoką (Procarz 8/t przy Niski) do potwierdzenia z właścicielem; (c) rozważyć osobny test pinujący hak __settingsLive; (d) NIE ZMIERZONO punkty wyżej -> kolejny temat VERIFY-LIVE.
RUNDY: 2/5; werdykt FC: PASS-WITH-NOTES
NASTĘPNY KROK: integracja orkiestratora d843b0f6d do main (sprawdzić is-ancestor i diff --stat), potem READY_FOR_DEPLOY wg decyzji.
DEPLOY/PUSH: NIE WYKONANO
