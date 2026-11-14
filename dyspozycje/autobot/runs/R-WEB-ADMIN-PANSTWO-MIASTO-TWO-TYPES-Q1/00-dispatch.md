# R-WEB-ADMIN-PANSTWO-MIASTO-TWO-TYPES-Q1 — dispatch (zgłoszenie właściciela, potwierdzone 2026-11-12)

GAME. Baza: aeb52465e845d29acb5f7b628370789af399d673 (origin/main).

NAZWY I ZAKRES (potwierdzone przez właściciela):
- ADMINISTRATOR PAŃSTWA — przypisany do Państwa; sam wykonuje ulepszenia terenu na WSZYSTKICH terenach państwa, wszędzie tam, gdzie reguły budowy na to pozwalają.
- ADMINISTRATOR MIASTA — zatrudniany w konkretnym mieście; WYŁĄCZNIE buduje budynki w tym mieście.

PROBLEM: auto-ulepszenia działały tylko w mieście z zatrudnionym administratorem ulepszeń (Ateny), bo stan administratora ulepszeń jest per miasto (city.administratorUlepszen, city-administrator.ts; improvementAdministratorHire; refreshAdministratorState przebieg 2; isCityAutoImprovementAllowed w auto-build-gate.ts).

DOMYŚLNE DECYZJE (przyjęte, bo właściciel ich nie zakwestionował; zapisane do potwierdzenia w raporcie):
1. Tryb automatyzacji ustawiany dla miasta (Żywność/Surowce/Infra/Zrówn./Ręczny) wpływa na pola tego miasta; pola bez miasta mają tryb Państwa.
2. Migracja zapisów: administrator przypisany do miasta zamieniany na administratora Państwa (koszt raz).
3. Administrator Państwa nie wymaga budynku administracyjnego.

GOAL: administrator państwa zatrudniany/zwalniany w panelu Państwa; jeden koszt utrzymania na Państwo; auto-ulepszenia w każdym mieście gracza w trybie auto działają, gdy Państwo ma działającego administratora państwa (oprócz globalnej opcji „Administratorzy”); administrator miasta nadal buduje tylko budynki w swoim mieście; nazwy w tekstach dla gracza: „Administrator państwa” i „Administrator miasta”.

KRYTERIA KOŃCA (binarne):
1. Zatrudnienie administratora państwa nie jest w panelu miasta; jest w panelu Państwa.
2. Koszt utrzymania liczony raz na Państwo (test).
3. Miasto B bez własnego administratora w trybie auto dostaje ulepszenia terenu, gdy Państwo ma administratora państwa (test w silniku, nie tylko UI).
4. Administrator miasta buduje budynki tylko w swoim mieście (test).
5. Migracja zapisu z administratorem miasta (test).
6. Nazwy w tekstach dla gracza zaktualizowane (test tekstów).
7. tsc zielone; bramki referencyjne zielone; dowód w realnej grze (Chromium).

ALLOWLISTA: gra/src/game/city-administrator.ts, gra/src/game/auto-build-gate.ts, gra/src/main.ts (tylko wywołania bramki i stanu administratora), gra/src/ui/ (panel Państwa i tekst administratora), gra/data/city-administrator-params.json (tylko teksty opisów), nowe testy w gra/tools/. ZAKAZ: wszystko poza allowlistą, git add -A. (Uwaga: poprzedni kandydat 52c3cc000 zmieniał city-administrator-params.json poza allowlistą — ta zmiana wymaga potwierdzenia właściciela, nie jest częścią tego tematu.)

IZOLACJA: worktree na izolowanej gałęzi, baza aeb52465e845d29acb5f7b628370789af399d673.

ZAKAZ BEZWZGLĘDNY: npm run build / npm run dev w gra/. Dozwolone: tsc --noEmit; node tools/*-test.cjs.

## DODATEK orkiestratora — runda 2 (po BLOCK/FAIL r1, 2026-11-12)

Decyzja orkiestratora (wariant A): poszerzenie allowlisty o pliki wskazane przez Operatora i Evaluatora:
- gra/src/game/turn-economy.ts (utrzymanie administratorów liczone na Państwo; linie ok. 2423 i 3113 wołają totalAdministratorUpkeepForOwner),
- gra/src/game/cities.ts (pole City.administratorUlepszen — stan przeniesiony na właściciela),
- gra/tools/improvement-administrator-test.cjs (asercje per miasto → asercje per Państwo).

Założenia z rundy 1 przyjęte do rundy 2 (do potwierdzenia właściciela w raporcie):
Z1: koszt zatrudnienia 40 i utrzymanie 2 z sekcji administrator_ulepszen w JSON;
Z2: migracja zapisów bez ponownego kosztu;
Z3: AI bez bramki administratora (bez zmiany zachowania);
Z4: tryb automatyzacji per miasto (pola miasta) — pola bez miasta = tryb Państwa.

Kryteria z dispatchu r1 pozostają (1–8). Testy: tsc, 5 bramek referencyjnych, testy administratora, dowód w Chromium oznaczony NIE_ZMIERZONO, jeśli niewykonalny.
Warunek startu: wolne miejsce na dysku ≥ 6 GB.

## DECYZJA WŁAŚCICIELA (2026-11-12, ABC) — korekta Z4 i podział tematu

- Z4 ZMIENIONE: tryb automatyzacji jest JEDEN dla całego Państwa (nie per miasto). Tryby miast przestają wpływać na auto-ulepszenia; pola wszystkich miast i pola bez miasta mają jeden tryb Państwa.
- PODZIAŁ na dwa tematy:
  1. SILNIK (ten temat, #316): stan administratora Państwa, koszt utrzymania raz na Państwo, auto-ulepszenia w miastach gracza wg jednego trybu Państwa, migracja zapisu z administratora miasta, bramka auto-ulepszeń.
  2. PANEL I NAZWY (nowy temat, #327): zatrudnianie/zwalnianie administratora Państwa w panelu Państwa; nazwy „Administrator państwa” i „Administrator miasta” w tekstach dla gracza.

## DODATEK orkiestratora — runda 5 (ostatnia; po FC FAIL r4, 2026-11-12)

Baza rundy 5: c0e54a705 (kandydat obrony r4 z kodem 1003bdc98).
Jedyny zarzut do naprawy (Z4): tryb automatyzacji ma być JEDEN dla Państwa. Trzy miejsca w gra/src/main.ts nadal czytają focus, pracaAutoPercent i foodImprovementStages per miasto przez effectiveUlepszeniaForCity (ok. linii 40726, 40735, 40750) — zamienić na ulepszeniaEmpireForOwner(c.ownerId). Dodać w gra/tools/admin-panstwo-city-gate-test.cjs asercję, że override miasta nie zmienia wyboru automatu.
Allowlista rundy 5: gra/src/main.ts (tylko te trzy miejsca i wywołania potrzebne do nich), gra/tools/admin-panstwo-city-gate-test.cjs. Nie zmieniać panelu (#327), tekstów (#327), administrators-wizard-test.cjs.
Kryteria 1–8 z dispatchu r1 pozostają tam, gdzie dotyczą silnika. Panel i nazwy to #327 (nie blokują silnika).
Dowód w Chromium: NIE_ZMIERZONO jeśli niewykonalny.
