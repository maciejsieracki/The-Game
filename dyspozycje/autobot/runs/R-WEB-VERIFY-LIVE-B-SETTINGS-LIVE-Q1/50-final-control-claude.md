STATUS: PASS-WITH-NOTES
DOMAIN: GAME (weryfikacja; kod gry nietknięty)
TEMAT: R-WEB-VERIFY-LIVE-B-SETTINGS-LIVE-Q1
GOAL: niezależny werdykt Final Control dla kandydata 9efb78016dd2de3117de5a487dcecca038b6eefe (baza 7cf57083929dc8ca2c5f23d8b97e77271e641588).
ZMIANY-COMMIT: kandydat 9efb78016; baza jest przodkiem kandydata (merge-base --is-ancestor: tak). git diff --stat: 8 plików, +1132 (5x gra/tools/verify-live-*-test.cjs, analiza WERYFIKACJA-NA-ZYWO-USTAWIENIA-2026-11-20.md, 10-operator, 30-obrona). Wszystko w allowliście; gra/src, gra/data, istniejące testy nietknięte.
WERDYKTY PER ZARZUT:
1 (odtwarzalność) — ZASADNY, NAPRAWIONY: testy budują harness z commita do mkdtemp; brak odwołań do scratchpadu/b87-1 (grep). Wszystkie 5 testów uruchomione u mnie z czystego worktree b87-4 (node_modules z linku) i przeszły.
2 (brak nowej gry przez kreator) — ZASADNY, NIENAPRAWIONY, uczciwie oznaczony NIE ZMIERZONO/BLOKADA (applyMenuParams nie wystawiony; dispatch zabraniał nowych haków w main.ts). Akceptowalne jako nota, nie FAIL.
3 (Z-3 błędne) — ZASADNY, NAPRAWIONY: kurs czytany z econ-params.json przez resolveFoodTaxRate.
4 (brak mutacji food) — ZASADNY, NAPRAWIONY: MUTACJA food-rate-normal CZERWONA.
5 (utrzymanie w Pieniądzu) — ZASADNY, NIENAPRAWIONY (NIE ZMIERZONO, Z-4). Nota.
6 (round-trip zapisu wzrostu) — ZASADNY, NIENAPRAWIONY (NIE ZMIERZONO). Nota.
7 (porównanie z KOLEJKA-WEB DECYZJE) — ZASADNY, NIE SPRAWDZONO. Nota.
UWAGA DOKUMENTU: sekcja 4 analizy zawiera nieaktualne zdania ("kurs podawany przez test", "Mutacja: NIE ZMIERZONO") sprzeczne z naprawą (Z-3 w ZNALEZISKACH jest już poprawione). Kosmetyka, do poprawki w kolejnej rundzie dokumentacyjnej.
TESTY (surowe wyjście, własny bieg): tsc --noEmit exit 0; logic 213/213; tech-tree 20 pass 0 fail; research PASSED 33 FAILED 0; unit-replace 21/21; combat 6/6. verify-live: food-to-tax, diplo-war-level, growth-toggle, unit-cost-pace, improvement-cost-era — każdy "BAZA ZIELONA", mutacja CZERWONA (food-rate-normal; diplo-zdrada -40 != -50; growth-flat; units-brazcost; impcost-owner), "WSZYSTKIE ASERCJE ZIELONE", exit 0.
BLOKADY: NIE ZMIERZONO — start nowej gry przez kreator/applyMenuParams/tura/zapis z UI; utrzymanie w Pieniądzu; round-trip zapisu wzrostu surowców; wczytanie z localStorage po reloadzie; porównanie z KOLEJKA-WEB DECYZJE.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: integracja orkiestratora (dodane wyłącznie testy+dokumenty, ryzyko dla gry zerowe); osobne tematy: hak civTest dla applyMenuParams/kosztów, pomiar utrzymania, porównanie z DECYZJE, poprawka zdań w sekcji 4.
DEPLOY/PUSH: NIE WYKONANO
