# R-WEB-SETTINGS-DEFAULT-FOOD-RATION-6-Q1 — obrona Operatora (claude), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-DEFAULT-FOOD-RATION-6-Q1
GOAL: nowa gra startuje z domyślnym wyżywieniem 6; nowe miasta bez własnego ustawienia dziedziczą 6; AI bez zmian (4); stare zapisy zachowują swoje wartości.
ZMIANY-COMMIT: kod kandydata 59a3b7187 bez zmian (baza tej obrony = 59a3b7187). Nowy commit obrony zmienia wyłącznie `gra/tools/default-food-ration-test.cjs` (dodany T6: 4 asercje tekstowe na seedy w `gra/src/main.ts`, odp. zarzut 2) i dodaje ten raport. SHA commitu obrony = pole `sha` w wyniku StructuredOutput. `gra/src/main.ts` NIE zmieniony w obronie.
TESTY (surowe liczby z tego worktree, po dodaniu T6):
- `node tools/default-food-ration-test.cjs`: `=== default-food-ration-test: 26 passed, 0 failed ===` (wcześniej 22/0 w ocenie Evaluatora; +4 = T6a/T6b/T6c/T6d).
- Mutacja T6: w `gra/src/main.ts` linia seedu AI `freshAiOwnerDefaultPoziomRacji()` zamieniona na `freshOwnerDefaultPoziomRacji()` => `FAIL: T6b`, `FAIL: T6d`, `24 passed, 2 failed`. Po mutacji `git checkout -- gra/src/main.ts`, `git status` czysty poza testem.
- Pozostałe bramki z oceny Evaluatora (tsc, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, mp-spawn 16/0, empire-city-defaults 53/0, population-growth-v85 50/0) NIE były powtórzone w tej rundzie: kod gry się nie zmienił, a worktree nie miał własnego `node_modules` (użyto symlinku, patrz UWAGI). Wyniki z oceny: NIE_ZMIERZONO w tej rundzie.
- hotseat-ustawienia-kopiowane-test: NIE_ZMIERZONO przeze mnie (patrz zarzut 6).
- `git diff --check`: wykonać przed commitem (wynik w sekcji commit poniżej).

## Odpowiedzi na zarzuty Evaluatora

1. (baza nieaktualna, konflikt w hotseat-ustawienia-kopiowane-test.cjs) — PRZYJMUJĘ jako wskazanie dla integracji, BEZ rebase'u tej rundy. Dowód: `git merge-tree --write-tree 8bb750767 59a3b7187` zwraca `CONFLICT (content): Merge conflict in gra/tools/hotseat-ustawienia-kopiowane-test.cjs` (jedyny wpis konfliktu w wyjściu). Rebase zmieniłby bazę wskazaną w dispatchu (59a3b7187) i wszedłby w rolę integracji, której Operator nie wykonuje. Integracja ma rozwiązać ten jeden hunk: asercje fotela 2 z main (praca 50, handel 30/60/10) + racja 6 z kandydata.

2. (brak testu na ścieżki main.ts) — PRZYJMUJĘ częściowo, dowód: T6 w `gra/tools/default-food-ration-test.cjs`. Test sprawdza tekst `gra/src/main.ts`: gracze w `initOwnerDefaultCityFields` dostają `freshOwnerDefaultPoziomRacji()` (6), AI w seedzie aiStartHexes dostają `freshAiOwnerDefaultPoziomRacji()` (4), seedCityOwnerDefaults dla nieobecnego ownera dostaje AI (4), i żadna ze ścieżek nie wpisuje 6 dla AI. Mutacja na ścieżce AI wykrywana (T6b, T6d). Granica: to regresja tekstowa, nie wykonanie. Zachowanie w grze (boot, hotseat) pozostaje NIE_ZMIERZONO, patrz zarzut 5.

3. (foundCity/foundCityAt dla ownera != 0 daje 4) — ODRZUCAM jako błąd w tej rundzie, z zastrzeżeniem. Dowód kolejności w `gra/src/main.ts`: fotel 2 jest dodawany do `humanSeats.humanOwnerIds` w l.11372-11374 (`plan.secondPlayerOwnerId`), a pola miast seedowane są dla `humanSeats.humanOwnerIds` w l.11502-11503 (`initOwnerDefaultCityFields`). Wewnątrz tej funkcji l.6338-6340 ustawia `ownerDefaultPoziomRacji.set(ownerId, freshOwnerDefaultPoziomRacji())` (6) dla każdego człowieka. Seed miasta l.6491 (`c.poziomRacji = ownerDefaultPoziomRacji.get(c.ownerId)!`) kopiuje tę wartość, więc miasto fotela 2 kończy na 6, nie na tymczasowym 4 z foundCity. Zastrzeżenie: kolejność l.11374 < l.11503 odczytana z kodu, nie uruchomiona w grze; NIE_ZMIERZONO w przeglądarce.

4. (main.ts:9250 fallback = 6 dla AI bez wpisu) — ODRZUCAM, dowód: fallback leży w `onPoziomRacjiOverrideToggle`, którego pierwszą linią jest `if (!city || city.ownerId !== 0) return;` (main.ts ok. l.9245-9248). Ścieżka jest więc osiągalna wyłącznie dla ownera 0 (gracza), gdzie 6 jest poprawne. Dla AI nie jest osiągalna, więc niespójność z AI=4 nie występuje. Kod bez zmian.

5. (brak realnej weryfikacji w Chromium) — NIE_ZMIERZONO, otwarte do wykonania przed deployem. Powód: wolne miejsce na `/` wynosi 3,4 GB (`df -h /`), a reguła procesu wymaga ≥4 GB dla tematów webowych; worktree nie miał `node_modules`, a zbudowanie gry i uruchomienie przeglądarki zużyłoby dysk poniżej progu. Chromium jest dostępny (`/usr/bin/chromium`). Do wykonania: zrzut panelu „Domyślne wyżywienie” = 6 w nowej grze oraz zrzut nowego miasta = 6.

6. (hotseat-ustawienia-kopiowane-test czerwony na bazie i kandydacie) — PRZYJMUJĘ jako informację o długu bazowym (#396). Nie zmierzyłem ponownie w tej rundzie (NIE_ZMIERZONO). Zmieniona asercja 4→6 w tym teście pozostaje niesprawdzona wykonaniem, co uwzględnia zarzut 5.

7. (docs/decyzje B-WYZYWIENIE-SLIDER-2026-07-30.md i P-MP-SPAWN-WYZYWIENIE.md podają 4) — ODRZUCAM zmianę. Dowód: są to rekordy decyzji (`docs/decyzje/`), poza allowlistą dispatchu, opisujące stan z dnia decyzji, nie aktualną specyfikację. W `docs/encyklopedia/pojecia/suwak-zywnosci.md` grep wartości domyślnej racji nie daje trafienia (trafienia dotyczą podziału żywności 70/30). `spichlerz.md` bez trafień na „domyśln”. Stąd `wikiBundle` nie wymaga regeneracji, zgodnie z oceną.

## BLOKADY
- Chromium: NIE_ZMIERZONO (zarzut 5), powód: dysk 3,4 GB < 4 GB.
- Konflikt integracyjny w hotseat-ustawienia-kopiowane-test.cjs (zarzut 1), do rozwiązania przy integracji.
- Test hotseat czerwony na bazie (dług #396).

RUNDY: 1/5
NASTĘPNY KROK: Final Control na commicie obrony (baza 59a3b7187 + commit testu T6). Integracja: rozwiązać konflikt hotseat na bieżącym main; wykonać weryfikację w Chromium przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
- W worktree `gra/node_modules` jest symlinkiem do `/home/user/The-Game/.claude/worktrees/wf_04a12900-c90-1/gra/node_modules` (tylko odczyt, do uruchomienia esbuild). Ignorowane przez git. Usunąć symlink przy sprzątaniu tego worktree, nie usuwać katalogu źródłowego.
- Test generuje pliki `gra/tools/.default-food-ration-entry.ts` i `.default-food-ration-bundle.cjs`; nie są śledzone przez git (ignorowane).
- Dług REPIN Rust: DEFAULT_POZIOM_RACJI 4→6 dla gracza (AI 4), jak w ocenie Evaluatora.
