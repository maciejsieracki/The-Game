# Final Control — R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1

**Werdykt: PASS-WITH-NOTES. Temat spełnia kryteria odbioru dla sprawdzonych ręcznych rozkazów i przechodzi do integracji.**

Final Control sprawdził artefakty Operatora R3 oraz niezależne raporty Evaluatora i Obrony. Poprzedni blocker R2 był wadą scenariusza testowego: rozkaz attack-march wydano po aktywacji aktora, a predykat mógł uznać wcześniejszy cios za nowy. R3 naprawia oba problemy i nie powtarza tego false positive.

W prawdziwym Chromium 28v28: pełna grupa 28 jednostek wykonała kolejkę, a jej ID zostały wyczyszczone; osiem jednostek zmieniło pozycję; podgrupa otrzymała rozkaz w kolejnym cyklu; dokładny klik przeciwnika zadał obrażenia HP 80→62. Attack-march wydano podczas kwalifikującej się aktywacji (`round=3`, `turnIdx=26`, indeks jednostki 27, `acted=false`). Świeże zdarzenie walki po rozkazie pokazuje atak i rout przeciwnika (`routed=true`, HP 1→1; to nie jest zabicie). W naturalnej aktywacji kolejnej rundy jednostka zachowała rozkaz i podeszła o jedno pole do pustego punktu (odległość 4→3). Test nie wymuszał tej aktywacji ani nie resetował jej `acted`. Błędy strony i konsoli: 0.

Dodatkowe potwierdzenie na aktualnym `main`: routing manual orders PASS; kontrakt wyboru bitwy 12/12; doktryna ranged/mounted 10/10; TypeScript PASS. Independent Evaluator: PASS-WITH-NOTES; Defense: PASS. Nie ma nowego potwierdzonego błędu produktu i nie ma nowej poprawki źródłowej do deployu.

**Uwaga zakresu testu:** osobny exact-target probe używa kontrolowanego fixture i resetuje `acted`; ograniczenie jest jawne i nie obejmuje attack-march. Wyniki potwierdzają wskazane scenariusze produkcyjnego UI i aktywacji, nie dowodzą zachowania każdej możliwej kombinacji armii/terenu.

**Release readback:** `gra-robocza/Gra-ROBOCZA.html` ma SHA-256 `f0fed0bddcf6fc76a6a50e63911504f5786f579f3c728a655404c6ff83fa6b4f`, 70,045,527 B. Manifest verifier i smoke PASS. Zawartość `battleScene.ts` w źródle Roboczej (`c46d6c47`) jest identyczna z `origin/main` (`0b26f675`) i R3 worktree: SHA-256 `62912413722edf4dd310eaa89d05c38938d9c405fa59b1a73d7d77c2bfb4d734`. Robocza już zawiera wdrożone zachowanie; etap 10 dla bieżącej dokumentacji i harnessu jest N/A, bo nie zmieniają builda gry.

Artefakty: `20-evaluator-r3.md`, `21-operator-response-r3.md`, `30-defense-r3.md`, `evidence/live-multicycle-r3/`.
