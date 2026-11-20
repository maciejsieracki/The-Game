STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zmiana kodu gry tylko hak ?civTest=1)
TEMAT: R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1
GOAL: pomiar skutku "Koszty jednostek" (Niski x1 vs Normalny x2) na liczbe jednostek AI, utrzymanie, skarbiec i glod; wniosek wobec progow (spadek >30% jednostek t90, >50% AI w deficycie).

ZMIANY/COMMIT: kandydat f002be705; baza 8f50028c35cf330a3d653e3c6fd717eefe770bf2 jest przodkiem (git merge-base --is-ancestor: OK).
git diff --stat (10 plikow, +278/-2): main.ts (+10, tylko hak civTest: setUnitCostPace/unitCostPaceState/zywnoscArmiiTura, tylko odczyt/ustawienie za ?civTest=1), ai-economy-measure-run.cjs (--pace, unitCostPace w rekordzie), ai-economy-measure-hook-test.cjs (+asercje), ai-economy-measure-README.md, POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md, runs/<ID>/{10,30,analyze-pace.cjs, 2x jsonl.gz}. Wszystko w allowliscie; brak gra/data, WERSJE.md, balansu, usuniec.

TESTY (wlasne, na detached f002be705, z surowego wyjscia):
- tsc --noEmit: EXIT 0
- logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6
- ai-economy-measure-hook-test (bundle vite zbudowany poza repo): PODSUMOWANIE 25/25 zielone, EXIT 0; asercje haka tempa (niski=168, wysoki=672 zywnosci armii) i zywnoscArmiiTura zielone
- analyze-pace.cjs na committowanych jsonl.gz: t90 jednostki Niski 465, Normalny 317 (-31,8%); wspolni t90 465 vs 315 (-32,3%); liczby zgodne z dokumentem. glodWojska=0 w sumie AI w t30/60/90 w obu przebiegach.
- Nie powtarzano 90-turowych przebiegow (NIE ZMIERZONO ponownie; polegam na committowanych danych + zgodnosci przeliczenia).

OCENA ZARZUTOW (bez etykiet rol):
1. Per epoka: obrona trafna, odtwarzalne teraz z jsonl (t90 Niski Braz 162/Zelazo 303; Normalny 191/126). Utrzymanie per epoka nie rozbite -> UWAGA, nie FAIL (dane sumaryczne pokrywaja dispatch co do progow).
2. Licznik rozwiazanych jednostek: niezmierzony, wymaga hooka w grze i nowego biegu. Uczciwie oznaczone NIE ZMIERZONO, proxy opisane jako nie-miara. ODDAL (uwaga): osobny temat.
3. Prog >30% przekroczony na jednym ziarnie, mechanizm i mnoznik NIE ZMIERZONO; obrona poprawila porownanie (wspolni wlasciciele) i skorygowala falszywe "0 glodu" (Normalny: glod u 1-4 z 41 AI w t2-23, ponizej progu 50%). Dispatch wymagal wskazania mechanizmu i mnoznika "jesli tak" - nie dostarczono; wniosek zastrzezony jako niepotwierdzony (jedno ziarno, szum t30 odwrotny). UWAGA.
4. Brak testu pinujacego: NAPRAWIONE, hook-test 25/25 (potwierdzone), mutacja dowodowa wg obrony 23/25 (nie powtorzona przeze mnie).
5. Odcinek bez flag Chromium i brak seed 7: ograniczenie, NIE ZMIERZONO; UWAGA.

BLOKADY: brak blokad technicznych. Braki merytoryczne (patrz UWAGI): licznik rozwiazan, mechanizm/mnoznik, seed 7.

RUNDY: Final Control po obronie r2 (1 FC).

UWAGI-DLA-ORKIESTRATORA:
- Wniosek "rozpad armii Normalny x2" NIE jest potwierdzony: jedno ziarno, zmienne zbiory wlascicieli; decyzja o korekcie mnoznika wymaga seed 7 / wiecej ziaren i licznika rekrutacji/rozwiazan (osobny temat z hakiem).
- Dokument wymienia "analyze-pace.cjs poza repo" w §6, a §7 wskazuje wersje w repo - drobna niespojnosc tekstowa, nieblokujaca.
- Pytanie ABC A (TREASURY) nadal czeka na dane skladu armii: czesciowo dostarczone (per epoka).

NASTEPNY KROK: integracja orkiestratora (merge f002be705 do main, bez zmiany wartosci gry; hak tylko civTest) -> READY_FOR_DEPLOY nie dotyczy (zmiana tylko pomiarowa), osobny temat na licznik rekrutacji/rozwiazan + seed 7.
DEPLOY/PUSH: NIE WYKONANO
