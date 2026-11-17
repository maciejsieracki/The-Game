# R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1 — Operator, runda 2/5

STATUS: PASS-WITH-NOTES (pomiar wykonany; zakres pomiaru i ograniczenia opisane niżej)
DOMAIN: GAME (tylko hak testowy `?civTest` i narzędzie pomiarowe)
TEMAT: R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1
GOAL: (1) hak `__civTest.addUnit(owner,q,r,civilian,typeId)` z typem jednostki (r1, już w bazie 57748caa); (2) pomiar live Wojownik vs Wojownik 10 vs 10 w trybie ręcznym z rozkazami, AUTO i skip, ≥3 ziarna.
BAZA: 57748caaf79c633202be8d36ed8d199b87811688 (origin/main), detached worktree. Dispatch i DODATEK czytane z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.

## ZMIANY-COMMIT
- NOWY `gra/tools/live-verify-wojownik-r2.cjs` — driver pomiarowy (kopia r3 + przepisanie na Wojownika, probe haka addUnit).
- NOWY `dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/evidence-wojownik-r2.json` — surowe wyniki 9 uruchomień (3 ziarna × 3 tryby).
- ZAKTUALIZOWANY ten raport (poprzednia wersja r1 zachowana w historii gita, commit 57748caa).
- `gra/src/` bez zmian w tej rundzie (`git diff -- gra/src` puste; hak z r1 pozostaje jak był).
- Build i node_modules poza repo: `gra/node_modules` (ignorowane przez git) i bundle w `/tmp/ad1/dist` (poza repo).

## POMIAR — Wojownik vs Wojownik 10 vs 10 (ZMIERZONO, Chromium headless + xvfb-run, `?playtest=bitwa-duza&civTest=1`, hit=losowe)

Źródło liczb: surowy JSON `evidence-wojownik-r2.json` (pola `res`, `actions`, `trimInfo`).
Kolumny: zwycięzca (silnik), runda końca, straty atakującego (z 10), straty obrońcy (z 10), liczba rozkazów wydanych ręcznie.

| ziarno | tryb | zwycięzca | runda | straty atk | straty obr | pozostało obr | rozkazy ręczne |
|---|---|---|---|---|---|---|---|
| 1 | manual (rozkazy) | obrońca | 29 | 10/10 | 0/10 | 10 | 117 |
| 1 | AUTO (klawisz R) | obrońca | 18 | 10/10 | 1/10 | 9 | 0 |
| 1 | skip (Pomiń) | obrońca | 18 | 10/10 | 1/10 | 9 | 0 |
| 2 | manual (rozkazy) | obrońca | 28 | 10/10 | 0/10 | 10 | 120 |
| 2 | AUTO | obrońca | 23 | 10/10 | 3/10 | 7 | 0 |
| 2 | skip | obrońca | 22 | 10/10 | 3/10 | 7 | 0 |
| 3 | manual (rozkazy) | obrońca | 31 | 7/10 | 1/10 | 9 | 208 |
| 3 | AUTO | obrońca | 37 | 10/10 | 1/10 | 9 | 0 |
| 3 | skip | obrońca | 19 | 10/10 | 0/10 | 10 | 0 |

Podsumowanie (9 pomiarów, wszystkie `errors` puste, `hookProbe.ok` = true):
- Zwycięzca: obrońca we wszystkich 9 uruchomieniach. Atakujący w 8/9 przegrał całą armię (10/10); w manual s3 zostało 3 jednostki atakującego przy zwycięstwie obrońcy wg silnika (nie zbadano dlaczego).
- Straty zwycięzcy (obrońca): manual 0,0,1 (średnia 0,3); AUTO 1,3,1 (średnia 1,7); skip 1,3,0 (średnia 1,3).
- Rundy: manual 29/28/31; AUTO 18/23/37; skip 18/22/19.
- Ucieczki (rout): NIE ZMIERZONO — driver nie zapisuje liczby uciekinierów; w JSON jest tylko flaga `routed` dla żywych jednostek atakującego.

## OGRANICZENIA POMIARU (uczciwie)
1. Hak `addUnit` z typeId NIE wstawia Wojownika do sceny bitwy. Preset `bitwa-duza` buduje roster z bloków (`playtestWalkaMapy.ts`, `buildBitwaDuzaPreset`) przed startem sceny; `addUnit` zmienia tylko mapowe `units` (to ZMIERZONO tylko pośrednio: probe zwrócił id dla `Wojownik` i null dla nieistniejącego typu; wpływu na scenę NIE zmierzono bezpośrednio). Dlatego driver przepisuje 10 jednostek atakującego (slot Hastati) i 10 obrońcy (slot Phalanx = Falanga) na Wojownika w scenie: `bu.nazwa`, `bu.stats` (wiersz Wojownik z `data/units.json`), `bu.hp = bu.maxHp = 22`. Walka czyta `bu.stats` przy każdym ataku (`toCombatUnit`), więc statystyki są realne; wizualnie jednostki zostają jako Hastati/Falanga (modele 3D nie zmieniono).
2. Pomiar jest na jednym presecie mapy (`bitwa-duza`, układ 10 vs 10 z bloków presetu), nie na prawdziwej mapie kampanii.
3. Przewaga obrońcy 9/9 nie została wyjaśniona (układ pozycji, flanka/tyły, kolejność tur — NIE ZBADANO). Nie należy z tego wnioskować o balansie Wojownika bez dalszej analizy.
4. Trzy ziarna, jeden tryb trafień (`losowe`). Tryb `pewne` nie był mierzony.
5. Haki i hit mode: `__civSetHitMode` ustawiany przez driver jak w r3.

## WALIDACJA HAKA (ZMIERZONO w live)
- Probe w Chromium: `__civTest.addUnit(0,0,0,false,'Wojownik')` → `civtest-0-0-0-0` (string), `addUnit(...,'NIE-ISTNIEJE-XYZ')` → `null`. Obie wartości zgodne z kryterium (a).
- Statyczny test `gra/tools/civtest-addunit-typeid-test.cjs`: 10/10.

## BRAMKI (surowe wyniki tej rundy)
- `cd gra && npx tsc --noEmit` → exit 0 (bez komunikatów).
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs` → `All sanity checks passed.`, exit 0.
- `node tools/civtest-addunit-typeid-test.cjs` → `ADDUNIT-TYPEID STATIC: 10/10`, exit 0.
- Build (dozwolony przez DODATEK, poza repo): `node ./node_modules/vite/bin/vite.js build --outDir /tmp/ad1/dist --emptyOutDir` → `built in 17.92s`, exit 0.
- `npm ci --ignore-scripts` w `gra/` → exit 0.
- `git diff -- gra/src` → puste (brak zmian w src w tej rundzie).

## BLOKADY
- Brak blokad technicznych. Ograniczenia pomiaru opisane wyżej (nie są blokadami).
- Decyzja dla orkiestratora: czy akceptujemy mechanizm "przepisanie jednostek w scenie" jako wystarczający dowód dla Wojownika (alternatywa: osobny hak wstawiający typ do roster bitwy — to już zmiana src poza allowlistą).

## RUNDY
2/5 (r1 BLOCK: brak pomiaru; r2 PASS-WITH-NOTES: pomiar 9/9 uruchomień, bramki zielone).

## UWAGI-DLA-ORKIESTRATORA
- DODATEK wskazywał `dyspozycje/.../00-dispatch-DODATEK-claude.md` jako istniejący w gałęzi — jest; nie zmieniano go.
- Nie tworzono sesji, zadań, tasków ani kart Suggested task (zakaz respektowany). Nie użyto run_in_background poza automatycznym przeniesieniem jednego długiego polecenia (pomiar), które zakończyło się kodem 0 i zostało odczytane z pliku wyników.
- Pliki tymczasowe poza repo: `/tmp/ad1/` (bundle, logi, wyniki surowe). Do sprzątania przez orkiestratora.
- Wskazanie na przewagę obrońcy 9/9 do decyzji: czy temat balansu Wojownika ma być osobny.

## NASTĘPNY KROK
Evaluator (SONNET): zweryfikować JSON `evidence-wojownik-r2.json` względem tabeli, sprawdzić bramki i zakres diffu (tylko `gra/tools/live-verify-wojownik-r2.cjs` i pliki raportu/evidence); ocenić, czy przepisanie w scenie spełnia kryterium (b).

DEPLOY/PUSH: NIE WYKONANO
