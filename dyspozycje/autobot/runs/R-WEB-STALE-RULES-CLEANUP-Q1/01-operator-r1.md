STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — sprzątanie, zero zmiany logiki
TEMAT: R-WEB-STALE-RULES-CLEANUP-Q1
GOAL: usunąć z komentarzy, opisów i testów nieaktualne reguły sprzeczne z decyzjami właściciela (rejestr DECYZJE-WLASCICIELA-20261031-AUTOULEPSZENIA-FORTY.md, #1-#27). Baza origin/main 4bbef081d.
ZMIANY/COMMIT: SHA w sekcji końcowej (jeden commit, bez push). Pliki:
- gra/src/game/auto-improvements.ts (tylko komentarze): nagłówek pliku ze stanem zasad (#24, #10, #25, #8, #12, #11/#13); `maxItemsPerCity` (opisy PL/EN, przy FOOD_STAGE_MAX_ITEMS_PER_CITY i 5 komentarzy w ciele): stare „AI ustawia jawnie 1" → zdjęte (#10, ABC-D=B; potwierdza ai.ts:2655); opis stopnia E3 „poza limitem %" → odwołane (#24); opis „dostęp do wody" (ZAŁOŻENIE zamiast „do potwierdzenia ABC").
- gra/src/game/fort-territory.ts:2-7 (komentarz): „miękka rezerwacja / granice się nie przesuwają / promień 10" → posterunek r=3, fort r=5 twarde terytorium (#15-#17). `git grep` nie znalazł już innego „promień 10" w src poza wikiBundle.json (dane, nie ruszane).
- gra/src/types/resources.ts:18 (komentarz): „hodowla wymaga złoża startowego" → nie wymaga złoża/zasobów (#4).
- gra/src/ui/buildModeHud.ts:211 — JEDYNA zmiana niebędąca komentarzem: tekst `title` (tooltip) profilu „Zrównoważone": „żywność, surowce, infra" → „żywność; przy niedoborze tylko brakujący surowiec; drogi na końcu" (#7, #11, #13). To tekst opisu, nie klucz ani wartość danych; nie pinowany przez żaden test (git grep).
- gra/tools/food-hodowla-test.cjs: baza 20 OK/4 FAIL → 24 OK/0 FAIL. Piny starych reguł: bydło praca +3 → +4 (data/terrain-improvements.json bydlo.bonus.praca=4; ZAŁOŻENIE: brak decyzji w rejestrze, dane są źródłem prawdy), farma+bydło +3 → +7 (farma.praca=3 + bydło 4), etykieta „Trzoda (krowa/świnia)" jako aktywny dostęp (2 asercje) → odwrócone: brak etykiety (trzoda nie jest surowcem, resource-access.ts LIVESTOCK_NOT_RESOURCE; #4).
- gra/tools/verify-decisions-picker.cjs: M12/M12b przepisane wg #24 (sufit % tylko dla gracza; przy 10% z 400 = 40 trzoda (20) mieści się, irygacja (60) NIE; dodana kontrola dodatnia M12c: przy 100% irygacja budowana); M13 okno niedoboru t4-7 → t0-3 (stary scenariusz zakładał las stojący do t4, a #1/#3/#25 wycinają las pod farmy w t0-1, więc nie było czego obsadzić tartakiem; wolnoWycinac:false nie pomaga AI, bo ścieżka K3 tego nie przyjmuje); etykiety „R5 W TOKU" w M3/M4 → odwołanie do #25.
TESTY (PRZED → PO, node tools/<t>.cjs z gra/, tsc przez node ./node_modules/typescript/bin/tsc --noEmit):
- tsc: PO 0 (przed: nie mierzono osobno, kod bez zmian logiki)
- auto-improvements-test: 46/0 → 46/0
- ai-improvements-test: 56/0 → 56/0
- autoimprove-stages-q1-test: 302/0 → 302/0
- fort-outpost-hard-territory-test: 80/0 → 80/0
- auto-fort-claim-test: 63/0 → 63/0
- food-hodowla-test: 20 OK/4 FAIL → 24 OK/0 FAIL
- verify-decisions-picker: 21 ZGODNE/3 NIEZGODNE (M12b-K2, M13-K2, M13-K3) → 25 ZGODNE/0 NIEZGODNE (liczba wzrosła o M12c)
Dowód braku zmiany logiki: esbuild.transformSync(loader ts, legalComments none) starej (git show HEAD:) i nowej wersji — auto-improvements.ts, fort-territory.ts, resources.ts IDENTYCZNE; buildModeHud.ts różni się wyłącznie literałem tooltipa z linii 211. Skrypt: scratchpad strip.cjs.
BLOKADY: brak. Uwagi: (1) nie zmieniono gra-robocza/**, WERSJE.md, rust-port/**, brak npm run build/dev; npm ci --ignore-scripts w worktree, node_modules usunięte po pracy. (2) plik rejestru decyzji nie istnieje na main — odczytany z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie dodany do commita). (3) Pozostałe historyczne komentarze w auto-improvements.ts (opisy rund R-AI-WYRAB…, „lesneMin" oznaczone już wcześniej jako NIEAKTUALNE) zostawione jako historia; nie zmierzono, czy wszystkie 1800 linii są wolne od przestarzałych zdań — przejrzano frazy z dispatchu (1 na 10, max 3 na etap, centrum, tartak przy rzece, budżet %, zwykły heks) i maxItemsPerCity. (4) gra-robocza/Gra-ROBOCZA.html zawiera stary tooltip (artefakt wdrożeniowy, poza allowlistą — odświeży się przy deployu).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja diffu komentarzy, odtworzenie bramek, sprawdzenie, że tooltip buildModeHud.ts jest akceptowalny jako „tekst opisu").
DEPLOY/PUSH: NIE WYKONANO
