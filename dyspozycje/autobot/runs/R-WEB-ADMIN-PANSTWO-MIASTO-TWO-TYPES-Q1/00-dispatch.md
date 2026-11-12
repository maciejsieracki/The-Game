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
