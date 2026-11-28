STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDGATE-RATION-LEVER-Q1
GOAL: Niezależny końcowy werdykt dla kandydata a68ac73431df7583f27b3ee67dcf359356f685ed (baza c834d3eb868127d3fc5af9e2ee7a6a43565813a2): czy komunikat bramki „Zakończ turę" obiecywał niewykonalną obniżkę racji i czy poprawka jest poprawna.
ZMIERZONE-NA: HEAD = a68ac73431df7583f27b3ee67dcf359356f685ed; `git merge-base --is-ancestor c834d3eb8 a68ac7343` = tak.
ZMIANY/COMMIT: diff c834d3eb8..a68ac7343 (9 plików, +335/-1): kod gry TYLKO gra/src/main.ts (5 dodanych linii + 1 zmieniona: komentarz i `_nnsRacjeZysk = max(0, fZero.spichlerzPo - (_nnsHumanForecast.spichlerzPo + (_nnsAutoSpichlerzDelta ?? 0)))`); gra/tools/endgate-lever-baseline-test.cjs (nowy); dokument analizy BRAMKA-ZYWNOSCI-DZWIGNIA-RACJI-2026-11-28.md; runs/**: 10, 30, 31-*.txt, 32-*.txt. Poza allowlistą: brak (gra/data, WERSJE.md, rust-port, gra-robocza nietknięte). Miejsce wyliczenia extra.suwakZywnosc zmienione zgodnie z allowlistą (uzasadnione: no-negative-stocks.ts liczy tylko to, co dostaje).
OCENA ZARZUTÓW (bez etykiet ról):
1. Brak dowodu liczbowego: ODDALONY po obronie. Pomiar na żywo (seed 11, tax100, t16, maksimum) w 31-*/32-*: baza — dźwignia „obniżka racji +12", racje 1,5→0 przez automat, suwak min=max=0, prognoza −30→−18; poprawka — dźwigni brak, komunikat „zabraknie 18" + 32 = 14 spójny (po 2 rozwiązaniach jednostek canEnd=true). Surowe logi sprawdzone: zgodne z deklaracją.
2. Test tekstowy, (e) niezależny od poprawki: PRZYJĘTY przez obronę i skorygowany (b wzmocniony, e opisany jako strażnik). Moja mutacja: na bazowym main.ts test = 2 passed / 3 FAIL (a,b,c); z kandydatem = 5/0. Dowód naprawy = (a)–(c) + pomiar na żywo. Nota: test jest regexowy (main.ts nie importowalny) — ograniczenie znane i jawne.
3. Ścieżka AI: ODDALONY z dowodem kodu (rationZysk = project({rationsZero}) − cur, bez członu automatu; dźwignia stosowana realnie). Żywy pomiar AI NIE ZMIERZONO.
4. Pre-existing czerwony no-negative-stocks-endturn (f): POTWIERDZONY jako niezależny od zmiany: na bazowym main.ts 18/1 (f), na kandydacie 18/1 (f) — identycznie. Osobny temat.
KOD (przegląd): kontekst l. 24005–24075 — _nnsAutoSpichlerzDelta = fAuto − forecast (automat), ustawiany w blokach przed; `?? 0` przy braku automatu = zachowanie bazy; max(0,…) chroni przed ujemną dźwignią. Logika spójna z Dodatkiem 3 (najpierw automat, potem gracz). Brak widocznych skutków ubocznych.
TESTY (własne, surowe wyjście, npm ci w gra/): tsc --noEmit exit 0; endgate-lever-baseline 5/0; logic 213/213; ai-test 297/0; early-grace-15 33/0; no-negative-stocks-end-turn-gate-levers 34/0; no-negative-stocks-c2 44/0; no-negative-stocks 25/0; no-negative-stocks-projection 49/0; end-turn-gate-projection-only 49/0; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6; no-negative-stocks-endturn 18/1 ((f), pre-existing, identycznie na bazie). Mutacja (baza main.ts): endgate-lever 2 pass / 3 FAIL.
POZIOM TESTOWANIA: pomiar na żywo Operatora/obrony na maksimum konfiguracji (Trudny, Wysoki x4, tax100, ziarno 11); własnych pomiarów na żywo nie powtarzałem (zaufanie do surowych logów + zgodność z kodem i testami).
BLOKADY: brak. NIE ZMIERZONO: tury 17–30, inne ziarna/tryby podatku, ścieżka AI na żywo.
UWAGI-DLA-ORKIESTRATORA: (1) pre-existing czerwony test (f) w no-negative-stocks-endturn-test.cjs — osobny temat naprawy pinu. (2) Zmiana dotyka gra/src => wymaga FALI na ROBOCZĄ po integracji. (3) Po poprawce jedyne wyjście z blokady t16 to nadal rozwiązanie jednostek (zgodne z GRACE15FX, decyzja Q42 osobna).
RUNDY: FC po rundzie 2/5 (operator, obrona).
NASTĘPNY KROK: integracja orkiestratora (merge, bramki, rejestr); deploy na ROBOCZĄ osobną autoryzacją.
DEPLOY/PUSH: NIE WYKONANO
