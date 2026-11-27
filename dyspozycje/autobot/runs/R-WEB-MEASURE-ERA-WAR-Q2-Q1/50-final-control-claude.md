STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar pod decyzje; zero zmian gra/src i gra/data)
TEMAT: R-WEB-MEASURE-ERA-WAR-Q2-Q1
GOAL: pomiar wojen epoki (seed 4242 i 7, poziom maksymalny „Trudna”, wojna epoki z graczem ON) i porównanie z regułami FALA 906/908 bez zmian kodu gry.
ZMIERZENIE KANDYDATA: 25460b96453a5ffdff4bd9f7d9b901f12538d39f (baza 01790e5531b82e985929d4f7dd76e6ce152e4316)
ZMIANY-COMMIT: `git merge-base --is-ancestor baza kandydat` = tak. `git diff --stat baza..kandydat`: 12 plików, 470 wstawień, 0 usunięć; tylko dyspozycje/analizy/WOJNY-EPOKI-Q2-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-Q2-Q1/** (10, 30, dane/*) i nowy gra/tools/era-war-q2-measure.cjs. Zmiany w gra/src i gra/data: 0. Allowlista zachowana (war-duration-measure.cjs niezmieniony).
TESTY:
- sha256sum -c dane/SHA256SUMS: 7/7 OK (surowe wyjście).
- Własna weryfikacja danych (python na warend.json.gz i jsonl.gz): wojny epoki (powod=wojna_epoki) seed 4242: 1-16 t71, 22-34 t79, 13-31 t80 (31-13), 7-10 t89, 28-37 t96; seed 7: 28-34 t74, 22-37 t80. Wejścia w Żelazo (ep==3, pierwsza tura) seed 4242: o1 t69, o6 t71, o12 t74, o2 t76, o8 t79, o11 t79, o5 t81, o7 t81, o13 t86, o3 t89, o10 t94, o4 t97, o9 t107; seed 7: o1 t71, o12 t72, o10 t74, o4 t75, o5 t76, o6 t76, o8 t78, o11 t82. Wojna 28-37 z t77 ma powod=null (naturalna), pokój t95 prosba_o_pokoj_ai (18 tur), wojna epoki t96, pokój t99 auto_pokoj_dwa_miasta (3 tury): zgodne z analizą po korekcie.
- Mapowanie id owner->civ w rekordach (o=28,37 itd.) w analizie używa tych samych numerów; wejścia 28→t94, 37→t86 potwierdzone przez obrońcę i spójne z Evaluatorem (nie powtarzałem mapowania numer->cywilizacja poza zgodnością numerów).
- tsc i 5 bramek referencyjnych: NIE URUCHOMIONO w tej rundzie (brak gra/node_modules, wolne ok. 329 MB dysku < 4–6 GB wymaganych). Uzasadnienie: różnica baza..kandydat nie dotyka gra/src ani gra/data (0 zmian), więc bramki bazy pozostają ważne; Evaluator odtworzył na 45ae0c9e1 (tsc 0, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, unit-power 6/0), ale nie są to moje własne uruchomienia.
- Runner na żywo (Chromium): NIE ZMIERZONO (dysk).
OCENA ZARZUTÓW (bez etykiet ról):
1. Wojna 28-37 jako żelazna od t77 — zarzut zasadny i naprawiony: dane potwierdzają wojnę naturalną t77 i wojnę epoki dopiero t96; zapis w analizie (§4.1, §5, §6 pkt 1) skorygowany, podział zgodne/rozbieżne poprawiony.
2. Werdykt NIEZGODNE wobec reguły 16A (#161) — zasadny i naprawiony: wszystkie 7 wojen epoki startuje w turze wejścia jednej ze stron; werdykt ZGODNE 7/7; kandydat BŁĄD-GRY odrzucony. Zastrzeżenie: rekord nie wskazuje, kto wypowiedział wojnę (wnioskowane); reguła 16A znana z rejestru zadań, nie z cytatu właściciela.
3. Seed 7 tylko do t84 — ograniczenie jawnie opisane (Chromium, 4 próby, zgodnie z limitem dispatchu), nie FAIL; wnioski po t84 opierają się na seedzie 4242 (zapisane w §7).
4. Braki formalne (tsc/bramki) — przyjęte jako nota; patrz TESTY.
BLOKADY: seed 7 poza t84; powód końca wojen z graczem (hak pomija pary z graczem); gracz nie wchodzi w Żelazo w 120 turach (przyczyna NIE ZMIERZONO); własne tsc/bramki NIE URUCHOMIONO (dysk).
RUNDY: FC po rundzie 2/5 (Evaluator FAIL -> obrona -> FC).
NASTĘPNY KROK: integracja orkiestratora (dokumenty i dane, bez deployu, bez zmiany gra/src).
UWAGI-DLA-ORKIESTRATORA: (1) przed integracją opcjonalnie uruchomić tsc na maszynie z miejscem; zmiana nie dotyka src. (2) Gracz pozostaje w Brązie 120 tur w autopilocie — sprawdzić, czy autopilot prowadzi badania (to może zaniżać liczbę wojen epoki z udziałem gracza w pomiarach). (3) Rozszerzyć __diploWarEndLog o pary z graczem (tylko civTest) — decyzja inżynierska.
DEPLOY/PUSH: NIE WYKONANO
