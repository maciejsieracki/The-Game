# DODATEK 2 orkiestratora — RUNDA 4/5 (R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1, 2026-11-12)
KANDYDAT STARTOWY: 6ea477041 (ten sam ID, ta sama gałąź robocza; NIE nowy temat). Operator startuje z 6ea477041.
DECYZJE WŁAŚCICIELA (ABC, 2026-11-12) — wiążące, nie do zmiany przez operatora:
- TOL = 2 (zmierzona wartość).
- TOL_RANK1 = 2 (zamiast 1; właściciel przyjął rekomendację — zapas o jedno pole).
- Kryterium 3 (strzelcy po wejściu wroga w zwarcie trzymają dystans) — w TEJ rundzie, bez osobnego tematu.
ZARZUTY FC ROUNDU 1 DO ZAMKNIĘCIA (każdy: test + mutacja, która go czerwieni):
1. Kryterium 3: test, że strzelec po wzwarciu utrzymuje odległość ≥ 2 pola od najbliższego wroga wręcz, gdy jest to możliwe i w zasięgu strzału. Sam mechanizm RANGED KITE nie wystarcza — test musi go wymuszać.
2. Test strzelców musi ODRÓŻNIAĆ bazę 81e357dee od poprawki (na bazie spread 0 nie może przejść). Jeśli to niemożliwe przy obecnym scenariuszu — zawęź kryterium 1 do machin i UDOKUMENTUJ to w raporcie.
4. Brak testu dla grupy bez piechoty lub z kontaktem tylko innej grupy — dopisz test.
5. AUTO=SKIP parity: poza zakresem tej rundy (limit 590 s). Zapisz jako NIE_ZMIERZONO, nie udawaj.
ZAKRES: tylko testy i poprawki zarzutów 1, 2, 4 oraz wartości TOL/TOL_RANK1 z decyzji. Nie zmieniaj reguł walki po kontakcie ani flank konnicy (554/578).
ALLOWLISTA: jak w DODATKU 1 + gra/tools/battle-mixed-army-advance-pace-test.cjs + ten katalog runs/.
ŚRODOWISKO: worktree, npm ci --ignore-scripts, zakaz npm run build/dev, tsc --noEmit, testy bitew z limitem 280 s. Nie integrujesz, nie pushujesz.
MODEL: Operator HAIKU 5.5 (runda 4; dwie porażki Haiku tego tematu NIE zaszły — FC był FAIL na zarzutach testowych, nie na bramce).
