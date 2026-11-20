# R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1 — Final Control (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1
GOAL: domyslnie ON szesc flag dyplomacji zgodnie z danymi (decyzja 2026-11-19); poprawki zarzutow 1-5.
ZMIANY/COMMIT: kandydat 46a706e4e327311d449f45e11c0ba5aa5a7c90f5; merge-base --is-ancestor dc2f0fed0 -> TAK; diff --stat 28 plikow (dane JSON: opisy + flagi; src/game/*.ts glownie komentarze; diplomacy-harder.ts DIPLO_HARDER_ENABLED_DEFAULT = dane; main.ts hak setAll; testy; raporty). Nic poza allowlista (gra-robocza, WERSJE.md, rust-port nietkniete).

WERDYKT PER ZARZUT (kod kandydata):
1. Flaga twardej dyplomacji martwa — NAPRAWIONE: diplomacy-harder.ts:31 DIPLO_HARDER_ENABLED_DEFAULT = (HARDER_PARAMS.twardaDyplomacjaAktywna === true); dane true. Pozostale 5 flag czytaja dane wprost (ai-ai-alliance-tick.ts:47, ai-ai-coalition.ts:57, diplomacy-zero-trust.ts:30, diplomacy-alliance-strength.ts:29, diplomacy-war-limit.ts:43/60; limitWojenAktywny.wartosc=true; max 1+1 bez zmian).
2. Pin OFF — NAPRAWIONE: harder-unit 53/0 (pin ON + jawny hak OFF).
3. Pomiar niezgodny — CZESCIOWO: hak nie dotyka NAP, runner sprawdza pakiet 6 flag; pomiar ponowiony, ale NIEPELNY (seed 4242 t2-78, seed 7 t70, brak ramienia OFF, brak t90). ODDANE jako uwaga (limit 600 s narzedzia); nie podwaza poprawnosci wdrozenia flag.
4. setAll(false) = null — NAPRAWIONE: main.ts setAll uzywa jawnego boolean; all-flags-hook 35/0.
5. Komentarze/opisy — NAPRAWIONE; unit-replace 21/21 potwierdzone.

TESTY (wlasny przebieg na kandydacie, surowe wyniki): tsc 0 bledow; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 292/5 — te same 6 linii FAIL na bazie dc2f0fed0 (diff pusty = PRE-EXISTING); harder-unit 53/0; alliance-strength 34/0; zero-trust 44/0; war-limit 57/0; alliance-tick 19/19 mutanty 8/8; alliance-limit 4/4 + wiring 4/4; coalition ZIELONE; all-flags-hook 35/0. ai-ai-treaty-live-proof-breach-test: NIE ZMIERZONO przeze mnie (wymaga bundla; brak) — obrona podaje 12/0. Pomiar przegladarkowy nie powtarzany; ocena z artefaktow operatora (pomiar-ON-podsumowanie.txt: 0 wierszy NaN/Infinity, sojusze max 2/cywilizacje, rownolegle wojny max 2).

BLOKADY: brak blokad poprawnosci. Pelny pomiar 90 tur (seed 4242 i 7 do t90, ramie OFF) NIE ZMIERZONY.
RUNDY: 2/5 (FC)
UWAGI-DLA-ORKIESTRATORA: (a) pelny pomiar jako osobny etap z runnerem wznawialnym; (b) zaufanie sasiadow ~11-20 w t50 (rejestr OFF 28,5 -> ON 20,9) — do wiadomosci wlasciciela; (c) efekt zero zaufania liczbowo niezweryfikowany; (d) ai-test 5 porazek istnieje na main.
NASTEPNY KROK: integracja orkiestratora; pelny pomiar osobno.
DEPLOY/PUSH: NIE WYKONANO
