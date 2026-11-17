# R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1 — Final Control (runda r4/r5 wg FC), kandydat 6df5de75745319413cd97e29cefd10e5fde8833b

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (hak testowy ?civTest + narzędzia; produkcja bez zmian)
TEMAT: R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1
GOAL: hak `__civTest.addUnit` z opcjonalnym typeId + pomiar Wojownik vs Wojownik 10 vs 10 (ręczny/AUTO/skip, >=3 ziarna).
ZMIANY/COMMIT: kandydat 6df5de757 jest potomkiem bazy c6f28ce7e (`git merge-base --is-ancestor` = OK). Diff vs c6f28ce7e: tylko gra/tools/live-verify-wojownik-map-q1.cjs + raporty/evidence w runie. Diff vs 76a1739fd w gra/src: civ-test-hooks.ts (+4/-3), main.ts (+16/-1) — zgodne z odstępstwem z DODATKU 1. Integrować: 6df5de75745319413cd97e29cefd10e5fde8833b (+ ten raport).

TESTY (surowe, własne uruchomienie na 6df5de757):
- `tsc --noEmit -p .` EXIT 0
- civtest-addunit-typeid-test: 10/10 EXIT 0; mutacja (forwarder bez typeId w civ-test-hooks.ts) -> 9/10 (czerwony), plik przywrócony
- logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test "All sanity checks passed" (wszystkie EXIT 0; baza nie była potrzebna, brak czerwonych)
- build vite do /tmp/fc3/dist EXIT 0 (16,75 s); Chromium (xvfb) niezależne powtórzenie drivera, atk, auto+skip, ziarna 1-3, ścieżka mapowa, probe: Wojownik 10 vs 10, hp 22/22.

POMIAR (własne powtórzenie = identyczne z evidence-wojownik-map-r5.json), atakujący = gracz, trafienia losowe:
| ziarno | tryb | zwycięzca | rundy | atk wyeliminowani/pozostali | obr wyeliminowani/pozostali | ucieczki |
| 1 | auto=skip(klik UI) | atakujący (PAT po morale) | 26 | 6/4 | 7/3 | 0 |
| 2 | auto=skip | obrońca | 20 | 10/0 | 4/6 | 0 |
| 3 | auto=skip | obrońca | 18 | 10/0 | 1/9 | 0 |
Ręczny z rozkazami: NIE ZMIERZONO (BLOCK, bramka generała). Zamiana stron: NIE ZMIERZONO.

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Tryb ręczny: DO DECYZJI CZŁOWIEKA/ORKIESTRATORA. Podejście z DODATKU 2 wykonane, bramka `manualControlAllowed` wymaga isGeneral w stosie, a hak (isGeneral:false) i civTest nie pozwalają go ustawić bez zmiany gra/src. DODATEK 2 dopuszcza jawny BLOCK po 2 podejściach — spełnione. Nie jest to defekt kandydata.
2. Zamiana stron: ODDAL (NIE ZMIERZONO; AI nie da się zmusić do ataku bez nowego haka). Wynik dotyczy wyłącznie roli atakującego i nie dowodzi własności Wojownika samego w sobie.
3. Skip: NAPRAWIONE (klik w button[title="Pomin do wyniku"], pole skipClick=klik-ui). Zgodność auto=skip to ta sama ścieżka symulacji, nie niezależne potwierdzenie — odnotowane.
4. Ziarna: NAPRAWIONE (civSeed -> gameStreamRng); wyniki różne między ziarnami (26/20/18 rund), potwierdzone własnym przebiegiem.
5. Higiena: martwy kod usunięty, nagłówek sprostowany; probe bez typeId (pole nie istnieje w scenie), typ po nazwie/kategorii/hp (22/22; zgodność z units.json NIE ZWERYFIKOWANA); test haka statyczny (regex) + mutacja czerwona; main.ts +16/-1 przy limicie ok. 15 — nieistotne, akceptowane. Żaden punkt nie wymaga NAPRAW => brak FAIL.

BLOKADY: brak blokad kandydata; pomiar częściowy (ręczny i zamiana stron NIE ZMIERZONO).
UWAGI-DLA-ORKIESTRATORA: (a) obserwacja: w ziarnach 2 i 3 obrońca wygrywa wyraźnie (10/0 vs 4/6 i 1/9) przy symetrycznych składach — możliwa przewaga obrońcy (teren/rozstawienie), n=3, nie rozstrzygnięte; to materiał do #286/#489. (b) Ewentualny osobny temat: hak ustawiający isGeneral w stosie pomiarowym (zmiana src, wymaga zgody) dla pomiaru ręcznego, oraz hak wymuszający atak AI dla zamiany stron. (c) Pliki tymczasowe /tmp/fc3, /tmp/ad2 do sprzątnięcia.
RUNDY: FC po rundzie 4/5 tego ID.
NASTĘPNY KROK: integracja 6df5de757 przez orkiestratora (FALA przy zmianie main.ts), decyzja o (b).
DEPLOY/PUSH: NIE WYKONANO
