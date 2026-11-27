STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1
GOAL: niezależny werdykt końcowy dla kandydata f11d84b33828290110caba57e2b6599baac95ee9 (baza 213cb0b30ae9484f7d036e52162edee68071f3d5): pomiar luk obrony startu wyłącznie na maksimum, zero zmian gra/src i gra/data.
ZMIANY/COMMIT: kandydat f11d84b33828290110caba57e2b6599baac95ee9. `git merge-base --is-ancestor 213cb0b30 f11d84b33` = TAK. `git diff --stat` baza..kandydat: 20 plików, +1339, wszystkie w allowliście (gra/tools/realdef-max-gaps.cjs, dyspozycje/analizy/OBRONA-STARTU-MAKSIMUM-LUKI-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1/**). `git diff` na gra/src i gra/data = puste. `git diff --check` = czysto. Ten raport: jedyny plik w commicie Final Control (SHA w polu report_sha wyniku).
TESTY (własne uruchomienia na kandydacie, po npm ci --ignore-scripts w gra/):
- npx tsc --noEmit: exit 0.
- node tools/logic-test.cjs: LOGIC OK (213/213), exit 0.
- node tools/ai-test.cjs: ai-test: 297 passed, 0 failed, exit 0.
- node --check gra/tools/realdef-max-gaps.cjs: OK.
- Pomiarów na żywo (Chromium) nie powtarzałem; dane oceniam z maxgaps*.jsonl i dokumentu. Spójność sprawdzona odczytem: maxgaps-p4.jsonl (4242: 7 tur, endClick ui/hook/hook/hook/ui/ui/ui; 7: 6 tur), p3: 778899 utrata t13 (12 wpisów), 11 t16 (15), 2024 t10 (9), barbarzyńcy wyłączeni 778899/11/2024 po 20 tur bez utraty. Linie kodu z dokumentu zgodne z kodem: playerStartUnitCount (ai-difficulty-bonus.ts: easy 2, normal 1, hard 0), grantPlayerStartUnits (main.ts ok. l.12124), sonda foreignNear hexDistance <= 3 (main.ts l.31722). Maksimum użyte zgodnie z regułą właściciela 2026-11-26 (Trudny, barbarzyńcy Trudny, koszty Wysoki x4, kultura trudny, dyplomacja trudna, suwak Skarb 100%); wariant "barbarzyńcy wyłączeni" wskazany wprost w dispatchu pkt 3.
OCENA ZARZUTÓW (bez etykiet ról):
1. Brak bramek u operatora: skutek zerowy, odtworzone zielone; ODDAL (uwaga procesowa, bramki podane w tym raporcie).
2. Fałszywe zdanie o sondzie: poprawione w dokumencie (sonda zwraca q,r; ograniczenie = promień 3); zweryfikowane w kodzie. ZAŁATWIONE.
3. Promień 5 i fale t15-20 z obrońcą: NIE ZMIERZONO, przyczyna prawdziwa (sonda zasięg 3, zmiana zakazana). Nie podjęto próby biegu z utrzymaniem obrońcy (np. rozwiązanie jednostki dźwignią). ODDAL jako luka pomiarowa, uczciwie oznaczona.
4. Drewno/handel/wioski: las zmierzony hakiem odczytowym (4242 r3 22/r5 36; 7 r3 11/r5 33), handel/wioski NIE ZMIERZONO bez prób; źródło +4 Drewna to hipoteza, w dokumencie tak nazwana. ODDAL.
5. Haki w UI: suwak = fizyczny klik myszą (30 -> 100, prognoza Skarbu +2 -> +8), tura = klik gdy przycisk aktywny, fallback hak z flagą endClick w każdym wierszu; otwarcie panelu hakiem (tylko wejście). Odstępstwo jawne w §0. ODDAL (uwaga).
6. Nauka t2-20 i kwota badań: NIE ZMIERZONO, jawnie. ODDAL.
7. Seed 7 deficyt Skarbu: uzupełnione w §9 pkt 7. ZAŁATWIONE.
8. Higiena runnera: nagłówek poprawiony, p2 oznaczony jako nieużywany. ZAŁATWIONE. Uwaga nowa: nagłówek runnera opisuje p3 jako klik myszą, a wiersze p3 w maxgaps.jsonl pochodzą ze starszej wersji (dispatchEvent); runner w kandydacie nie odtwarza dokładnie tych wierszy p3; dokument to ujawnia w §0.
9. SHA w raporcie operatora: SHA kandydata podane w wyniku i w tym raporcie. ZAŁATWIONE.
10. Tabela §6: rozdzielone utrata miasta i przeżycie t20. ZAŁATWIONE.
BLOKADY / NOTATKI (nie blokują; dane i wnioski są uczciwie oznaczone):
- p4 (klik UI) tylko dla 4242 i 7; 778899/11/2024 w p4 NIE ZMIERZONO (awaria Chromium, osierocone procesy), wyniki dla nich pochodzą z p3 (z hakiem tury).
- Barbarzyńcy w promieniu 5, fale t15-20 z obrońcą, handel/wioski jako źródło Drewna, promień pracy miasta, kwota Nauki: NIE ZMIERZONO.
- Drobne niespójności dokumentu: §2 pierwszy akapit nadal mówi "liczba heksów lasu NIE ZMIERZONO", a dalej podaje pomiar lasu; §7 wciąż zawiera zdania o haku endTurn i o promieniu 5, już uwzględnione w §9. Do uporządkowania przy integracji (bez wpływu na wnioski).
- Kandydat BŁĄD-GRY UI (niezweryfikowany ręcznie): "Zakończ turę" aria-disabled=true przy canEnd=true w t2-4 (4242 i 7).
- Wniosek dla gry (dane, nie rekomendacja balansu): na maksimum pasywny gracz traci miasto t10-t16 na 3 ziarnach bez Drewna; na 4242 i 7 jeden Łucznik kupiony w t5 blokuje "Zakończ turę" w t6-7 (żywność -15/-16 na turę). Startowy Wojownik: brak na Trudnym wynika z jawnej tabeli playerStartUnitCount (hard = 0).
RUNDY: Final Control 1/5 dla tej rundy.
NASTĘPNY KROK: integracja orkiestratora (dokument, runner, dane; bez deployu, brak zmian gra/src). Osobne tematy do decyzji orkiestratora: zasięg sondy wroga (gra/src), ręczna weryfikacja przycisku "Zakończ turę", dokończenie p4 dla 778899/11/2024 po posprzątaniu Chromium, ewentualny bieg fal t15-20 z dźwignią rozwiązania jednostki.
UWAGI-DLA-ORKIESTRATORA: pytanie ABC do właściciela (Drewno startowe / koszt utrzymania pierwszej jednostki / blokada tury po zakupie) dopiero po turnieju wg dispatchu; sformułować wg ZASAD ABC bez żargonu.
DEPLOY/PUSH: NIE WYKONANO
