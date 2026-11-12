# R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3 — raport Operatora (runda 2/5, naprawy po FC FAIL r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME-TEST (zmiana tylko w gra/tools/battle-attack-move-pointer-test.cjs + ten raport; zero zmian w gra/src, JSON, WERSJE.md, rust-port)
TEMAT: R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3
GOAL: dług testowy z FAL 651–658. Dla każdego z 12 testów: wynik, klasyfikacja (nieaktualny test | realny defekt | timeout środowiska), poprawka tylko przy klasyfikacji „nieaktualny test", bez osłabiania asercji.
BAZA: d0c667c856d4366f26634d403b7739672433e48c (kandydat FC r1), po `git merge origin/main` (6b9bcaf2b) → merge commit dd026d165. Kod testowany = dd026d165 + poprawka harnessu (commit SHA niżej).
ŚRODOWISKO: worktree wf_8be3657d-ef3-1 (detached HEAD); `npm ci --ignore-scripts` w gra/ (exit 0); brak `npm run build`/`dev`. Dysk „/" przed startem: 16 GB wolne. Load average w trakcie 2,5–8,6 (4 CPU).

## ZMIANY / COMMIT
- gra/tools/battle-attack-move-pointer-test.cjs: serwer statyczny zwraca **204** dla `/favicon.ico` (przed poprawką 404 liczone przez test jako błąd strony). Asercje bez zmian. Poprawka wg NAPRAW 1 (FC potwierdził 5/5 PASS dla kopii z 204).
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3/10-operator-claude.md: ten raport (runda 2, pełna tabela 12 testów).
- Uboczny efekt uruchomienia testu battle-ranged-approach-regression (zapisuje dowody do dyspozycje/.../R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1/evidence/): zmiany w tych plikach COFNIĘTE `git checkout --` przed commitem; nie są w commicie.
- Brak zmian w gra/src (`git status`: tylko battle-attack-move-pointer-test.cjs + raport).

## WYNIKI BRAMEK (surowe wyjście, uruchomione w tej rundzie)
- battle-attack-move-pointer-test: `[PASS] real pointer selected a production player unit`, `[PASS] Atakuj-marszem toolbar mode + ground pointer assigned exact empty waypoint`, `[PASS] ordinary empty-ground pointer retained plain Move`, `[PASS] enemy pointer click retained exact target Attack`, `[PASS] browser page has no errors` → EXIT 0, 117 s.
- battle-ranged-approach-regression-test: EXIT 0, 296 s (limit 590 s; JSON raport, bez FAIL/timeoutu aktywacji).
- tsc i pięć bramek referencyjnych (logic, tech-tree, research, unit-replace, combat): NIE_ZMIERZONO w tej rundzie. Runda 2 obrony podawała je dla fc88effc1 (zielone); nie powtarzałem ich na dd026d165 — do weryfikacji przez FC.

## TABELA 12 TESTÓW (test | wynik na bazie | wynik po poprawce | klasyfikacja)

„Na bazie" = wynik na bazie z rundy 1 (b0b0e3f86) lub rundy 2 obrony (fc88effc1), wskazany w nawiasie. „Po poprawce" = wynik w tej rundzie na dd026d165 (+ poprawka harnessu).

| # | Test (gra/tools/) | Wynik na bazie | Wynik po poprawce (ta runda) | Klasyfikacja |
|---|---|---|---|---|
| 1 | auto-battle-simultaneous-test | 28 pass / 1 FAIL (r1) | `auto-battle-simultaneous-test: 29 pass, 0 fail`, EXIT 0, 1 s | nieaktualny test (poprawka r1) |
| 2 | battle-attack-move-pointer-test | FAIL: 404 /favicon.ico liczony jako błąd strony (FC r1) | 5/5 `[PASS]`, EXIT 0, 117 s | harness — poprawka 204 dla favicon (NAPRAW 1) |
| 3 | battle-dead-unit-disappearance-test | FAIL: `occByKey.has('7,12')` (r1) | `battle-dead-unit-disappearance-test: PASS — killed unit detached immediately; routed unit still flees visibly`, EXIT 0, 1 s | nieaktualny test (poprawka r1) |
| 4 | battle-natural-chariot-r5-test | EXIT 2 `locator.click` „not stable" (obrona r2, fc88) | EXIT 0, 144 s, 0 linii `R5_FAIL` | timeout/niestabilność środowiska (pod obciążeniem); NIE odtworzone w tej rundzie; brak zmiany testu |
| 5 | pre-battle-save-test | crash bundlera (r1) | `pre-battle-save-test: OK`, EXIT 0, 2 s | nieaktualny test + brak shimów (poprawka r1) |
| 6 | battle-ranged-approach-regression-test | exit 124 po 280 s (dispatch); EXIT 1 `activation timeout atk/infantry/aggressive/1` 5 min 33 s (obrona r2, load ~14) | EXIT 0, 296 s (ponad 280 s, poniżej 590 s), JSON raport bez błędu aktywacji | timeout środowiska: limit 280 s za krótki na tę maszynę; zegar 12 s aktywacji pod obciążeniem nie odtworzony. Brak zmiany testu |
| 7 | hint-toast-zindex-empire-panel-test | 4 FAIL (regex, r1); exit 124 (280 s) | `18 pass · 0 fail`, EXIT 0, 274 s | nieaktualny test (poprawka r1) |
| 8 | load-fail-toast-zindex-test | 12 pass / 3 FAIL (r1) | `15 passed, 0 failed`, EXIT 0, 0 s | nieaktualny test (poprawka r1) |
| 9 | grupy-budynkow-test | 80 pass / 3 FAIL (r1) | `grupy-budynkow-test: 83 pass, 0 fail`, EXIT 0, 0 s | nieaktualny test (dane +1 budynek; poprawka r1) |
| 10 | mgla-sciezka-inwariant-test | 41 pass / 1 FAIL (r1) | `42 pass, 0 fail`, EXIT 0, 2 s | klasyfikacja nowych miejsc kopii sim/pos (poprawka r1, do potwierdzenia przez FC) |
| 11 | praca-jeden-podzial-kontrakt-test | 635 OK / 2 FAIL (r1) | `637 OK, 0 FAIL`, EXIT 0, 2 s | nieaktualny test (przesłanka: ceny z terrain-improvements.json; poprawka r2 obrony). UWAGA: forma asercji zmieniona z „zero" na „brak przekroczeń capu" — FC ma to ocenić |
| 12 | sidepanel-hud-deadzone-test | timeout 110 s (dispatch); obrona r2: EXIT 0, 43/0, 331 s | `43 pass · 0 fail`, EXIT 0, 233 s | timeout limitu 110 s za krótki (wynik zielony) |

## KLASYFIKACJA ROZSTRZYGNIĘTA (zamknięte z dowodem)
- Harness battle-attack-move-pointer: defekt był w harnessie (404 favicon), nie w grze — potwierdzone 5/5 PASS po poprawce.
- battle-ranged-approach-regression: w tej rundzie przeszedł (296 s). Ponieważ r2 obrony dała FAIL pod load ~14, klasyfikacja „timeout środowiska" jest uzasadniona obciążeniem, ale NIE jest dowiedziona w pełni (brak powtórzenia FAIL na tej samej maszynie).

## NIEROZSTRZYGNIĘTE / NOTY
- battle-natural-chariot-r5: obrona r2 zmierzyła EXIT 2 (`not stable`), ta runda EXIT 0. Niestabilność nie została wyjaśniona; test nie jest zmieniany. Wymaga powtórnego pomiaru pod obciążeniem przez orkiestratora, jeśli ma być zamknięta.
- Realny defekt gry: NIE wykazany dla żadnego z 12 testów. Nic nie dodano do gra/src ani do listy defektów.
- Mutacje grupy/mgla/pre-battle-save z r1: NIE_ZMIERZONO w tej rundzie (poza zakresem NAPRAW 1–3).
- Ranged-regression zapisuje dowody do śledzonych plików w dyspozycje/…/R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1/evidence/; po teście są modyfikowane — przywrócone, orkiestrator powinien o tym wiedzieć przy sprzątaniu.

## ZAŁOŻENIA (luki rozstrzygnięte założeniem)
- Wynik „na bazie" dla testów 2, 4, 6, 12 bierze pomiary z rundy 2 obrony (fc88effc1), bo na dd026d165 nie mierzyłem stanu sprzed poprawki.
- Kod z origin/main (6b9bcaf2b) połączony merge'em przed testami, zgodnie z DODATKIEM.

## BLOKADY
1. battle-natural-chariot-r5: niestabilność nie odtworzona i nie wyjaśniona (EXIT 2 w r2 obrony, EXIT 0 w tej rundzie).
2. Pięć bramek referencyjnych i tsc na dd026d165: NIE_ZMIERZONO w tej rundzie.
3. Forma asercji praca-jeden (zmiana w r2 obrony) do oceny przez FC.

## RUNDY
2/5 (runda 1 = Operator, FC FAIL; runda 2 = ta naprawa).

## NASTĘPNY KROK
- Evaluator: ponowna weryfikacja battle-attack-move-pointer (204 dla favicon) i praca-jeden (forma asercji).
- FC: potwierdzenie, że tabela 12 testów zgadza się z surowymi wynikami powyżej.
- Orkiestrator (poza tym tematem): decyzja o powtórnym pomiarze battle-natural-chariot-r5 pod obciążeniem.

DEPLOY/PUSH: NIE WYKONANO
