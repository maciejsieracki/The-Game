# R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1 — DODATEK orkiestratora (runda 1)

Przeczytaj dispatch z gałęzi: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1/00-dispatch.md`.

## Decyzje właściciela (2026-11-13)
- Zmęczenie wojną ma dalej kończyć wojny po czasie (ABC B): poziom = tury/200 + 0,03·utracone miasta + stagnacja (od 30 tur, do 0,3); próg chęci pokoju 0,5; karencja po takim pokoju 40 tur (100 dla chronionego) — te mechaniki ZOSTAJĄ.
- Zmiana 1: miarą „kto przegrywa/silniejszy” jest SIŁA MILITARNA (computeMilitaryStrength / peaceStanceOf z kroku 4a), nie cały Power (dziś udział ≤ 45% z Power).
- Zmiana 2: przegrywający płaci WYŁĄCZNIE miastami (dziś: najpierw złoto i surowce, potem do 2 miast) — usunąć złoto i surowce z ofert zmęczenia; zostają miasta (do 2) w rosnącej kolejności ofert; cena miasta w PN jak dotąd.
- Zmiana 3: pokój wzajemny „bez zapłaty” przy równej sile i zmęczeniu ≥ 0,8 koliduje z regułą „słabsza płaci miastem” — usuń go (remis rozstrzyga deterministyczna reguła z kroku 2: ta strona jest „słabsza” i płaci miastem).
- Zmiana 4 (ABC A z 2026-11-13): słabsza strona z JEDNYM miastem (lub bez miasta do oddania) NIE może kupić pokoju do końca wojny — zmęczenie wojną tego nie obchodzi. „Ochrona przegrywającego” (zwycięzca musi przyjąć ofertę) zostaje, ale oferta musi zawierać miasto; przy jednym mmieście ochrona nie powoduje pokoju. Opisz w raporcie skutek (wojna do eliminacji lub do decyzji silniejszej strony).
- Zmiana 5: wymuszony pokój po limicie tur (diplomacy-ai-forced-peace.ts) zostaje tylko tam, gdzie płaci miastem według zmian 2–4.

## Wymagane
1. Wylistuj w raporcie wszystkie ścieżki zmęczenia (war-weariness.ts, offer-balance, forced-peace, ai.ts, proposals, main.ts) z plik:linia: co zmienione, co zostaje.
2. Nowy test gra/tools/diplo-weariness-city-only-test.cjs: (a) zmęczenie ≥ próg: przegrywający (wg siły militarnej) oferuje tylko miasta; (b) brak złota/surowców w ofertach; (c) pokój wzajemny bez zapłaty usunięty; (d) jedno miasto → brak pokoju; (e) ochrona z miastem; (f) karencja 40/100 nadal działa; (g) każda bramka pokryta mutacją, która czerwieni test behawioralny.
3. Istniejące testy zmęczenia (weariness-test ~96/0 i pochodne, ai-ai-nonnegative 20/0, ai-losing-war-asks-peace 12/0, diplo-war-peace-sim ≤ 3 FAIL) przepisane TYLKO w asercjach o starej regule; żaden nie osłabiony poza tym.

## Kryteria końca (binarne)
tsc 0; pięć bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; diplo-peace-weaker-seeks-city-only-test 32/0, diplo-peace-stance-wiring-test 10/0, diplo-peace-balance-accept-test 32/0, diplo-war-peace-main-guard-test 35/0, ai-test 297/0, diplomacy-test bez regresji; nowy test z mutacjami zielony.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.
