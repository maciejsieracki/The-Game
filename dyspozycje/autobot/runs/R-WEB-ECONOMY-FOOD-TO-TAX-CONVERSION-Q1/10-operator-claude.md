STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-FOOD-TO-TAX-CONVERSION-Q1
GOAL: Reczna, jednorazowa zamiana Żywności z zapasu imperium na Podatek, analogicznie do zamiany Pracy na Podatek (wymaga Targowiska, nie uruchamia się automatycznie, nie schodzi poniżej 0).
ZMIANY/COMMIT: baza 1bc8ec66d (origin/main). Allowlista: gra/src/game/empire-food.ts (+convertFoodReserveToTax, foodTaxResultMessage, runManualFoodTaxAction), gra/src/main.ts (import + hooki w configureEmpireGlobalDefaults obok zamiany Pracy), gra/src/ui/empireDetailPanel.ts (blok „ZAMIANA ŻYWNOŚCI NA PODATEK” za blokiem Pracy), gra/data/econ-params.json (nowy klucz budynki.targowisko_zywnosc_na_podatek_kurs easy/normal/hard = 1), gra/tools/food-to-tax-conversion-test.cjs (nowy), raport. Commit: patrz SHA w odpowiedzi operatora.

Mapa ścieżki Pracy→Podatek (wzorzec): UI gra/src/ui/empireDetailPanel.ts (blok data-work-tax-convert, ~l.1507–1550); hook gra/src/main.ts ~l.29690–29735 (onConvertOwnerWorkToTax → runManualWorkTaxAction); logika gra/src/game/work-tax.ts (convertWorkPoolToTax, runManualWorkTaxAction); kolejka podatku pendingManualWorkTaxByOwner (main.ts ~l.15284, naliczenie ~l.23486 i ~l.43154, zapis meta ~l.41916, wczyt ~l.52250).

Żywność: pula = empireFoodStates[owner].zapasyPanstwa (odczyt getEmpireFoodReserve). Podatek trafia do TEJ SAMEJ kolejki co Praca, więc zapis/wczytanie i naliczenie na koniec tury nie wymagały zmian formatu zapisu. Mutacja zapasu idzie przez setReserve (klamra do 0) i markCityStateDirty (czyści _maxSafeRationCache). Kurs 1:1 domyślnie; właściciel nie podał kursu, parametr zostawiony do zmiany.
Typowa nadwyżka: cap Spichlerza 54 000 (z dispatchu) przy kursie 1:1 daje co najwyżej 54 000 Podatku przed korupcją/suwakiem silnika. Efekt po silniku: NIE ZMIERZONO.
AI: funkcja tylko dla człowieka (ownerCanConvertWorkToTax(ownerId, isHuman(ownerId), ...)); AI nie korzysta z zamiany Pracy ani Żywności (brak wywołań poza hookiem panelu).
Decyzja bez zmian: brak dodatkowego zabezpieczenia zapasu na utrzymanie (Praca też go nie ma); ryzyko: zamiana całego zapasu może wywołać głód wojska w następnej turze — do decyzji właściciela.

TESTY:
- npx tsc --noEmit (gra/): exit 0, 0 błędów.
- node tools/food-to-tax-conversion-test.cjs: 45 PASS / 0 FAIL (kurs 1:1, kurs 2:1, 0,5, 0; brak Targowiska; ilość > zapas; NaN; zapis/wczytanie kolejki; akcja z kolejnością markDirty przed refresh; mutacje kopii źródła: 3/3 wykryte).
- logic-test: 213/213 LOGIC OK.
- tech-tree-test: 20 pass / 0 fail.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33.
- unit-replace-test: 21/21 WSZYSTKIE TESTY ZIELONE.
- combat-test: All sanity checks passed.
- labor-to-tax-conversion-gold-test: 58 passed / 0 failed.
- work-tax-conversion-test: 10 assertions passed.
- git diff --check: czysto.
- Chromium (bundle poza repo, vite build --outDir w scratchpad): boot z ?civTest=1 — hook __civTest obecny, 0 pageerror, 1 console error (404 zasobu, nie z gry). Live zamiana w panelu (zmiana Żywności i Skarbca o oczekiwane liczby): NIE ZMIERZONO — nie zbudowano scenariusza (miasto z Targowiskiem, ustawienie zapasu, klik w panel, potwierdzenie confirm, odczyt HUD).

BLOKADY: dowód live zamiany w Chromium niezrobiony (patrz TESTY). Kurs Żywności = 1:1 bez decyzji właściciela. Brak zabezpieczenia zapasu na utrzymanie wojska.
RUNDY: 1/5
NASTĘPNY KROK: Final Control: przegląd diffu (empire-food.ts, main.ts ~l.29735+, empireDetailPanel.ts ~l.1560+), decyzja o kursie i zabezpieczeniu zapasu, scenariusz live w Chromium (miasto z Targowiskiem + zapas + klik w panel).
UWAGI-DLA-ORKIESTRATORA: W katalogu /home/user/The-Game/.claude/worktrees/ (poza worktree) zostawiłem logi: wf_32120a91-npm.log, wf_32120a91-tsc.log oraz logi testów wf_32120a91-*.log; w /tmp/claude-0/wf32120a91-bundle pusty katalog (błąd przy mkdir). Nie mogłem usunąć (zakaz rm). Do sprzątania. node_modules w worktree gra/ (npm ci --ignore-scripts) — do usunięcia po tematu.
DEPLOY/PUSH: NIE WYKONANO
