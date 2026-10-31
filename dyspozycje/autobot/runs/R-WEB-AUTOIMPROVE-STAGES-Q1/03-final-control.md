STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES-Q1
GOAL: auto-ulepszenia K1 (gracz „Żywność”), K2 (gracz „zrównoważone”) i K3 (AI) stawiają farmę, trzodę i irygację przy rzece oraz wycinają las bez tartaku na wycinanym heksie. Profile „surowce” i „infrastruktura” bez zmian.

WERDYKT PO ZARZUTACH (Final Control, runda 2/5, kod `b690e9e96`)
1. ODDAL (naprawione w R2). Limit `ceil(pop/10)` włącza tylko `limitForestKeysToMinimum` (K1/K2/K3). Domyślnie false (`auto-improvements.ts` ok. 718-721). Mutacja własna (domyślnie true = zachowanie R1) daje FAIL `[S] profil „surowce”: tartak 2 == 6`, czyli test (k) łapie regres.
2. ODDAL. Reguła „1 na 10 obywateli” istniała już w bazie (`lesneMin`). Operator ją tylko zawęził, a ABC-B zostaje otwarte (stara reguła do odpowiedzi właściciela). Dla profili spoza K1/K2/K3 zachowanie bazy. Pytanie ABC zadaje orkiestrator.
3. ODDAL (naprawione). `ai-ulepszenia-malo-budowane` 13/0 (baza 13/0).
4. ODDAL / DO DECYZJI CZŁOWIEKA (ABC-A, ABC-B). Z1a/Z1d/Z1g/Q2o czerwone też na bazie `4d1916f2c`. Zmierzyłem sam: baza tartak=6 (Z1a, Z1d), PO R2 tartak=10 (ścieżka bez etapów, w teście picker wywołany bez `foodImprovementStages`). To nie regresja bramki, a źródło to `tartak` w `ULEPSZENIA_FOCUS_ZYWNOSC` (decyzja ABC-A/B). Uwaga dla orkiestratora: liczba tartaków w tej ścieżce wzrosła z 6 do 10 względem bazy. Ścieżka nie jest etapowa, więc limit tam nie działa, jak w bazie. Z1a/Z1d/Z1g to testy z listy „czerwone na bazie, poza zakresem”, ale warto to jawnie zadać w ABC-B.
5. ODDAL. `ai.ts` zastąpienie zduplikowanej tablicy importem tej samej stałej, bez zmiany wartości, plik w allowliście.
6. ODDAL jako notatka (NIE_ZMIERZONO, brak Chromium, build w `gra/` zabroniony). Pomiar niedoboru na żywej grze zostaje dla orkiestratora/właściciela. Nie blokuje, bo logika K2/K3 działa na fikturach i nie zmienia progu.
7. ODDAL. Nowy test (k3) mierzy tartak na heksie centrum miasta (K2 [tartak, oboz_lowiecki], K3 [tartak]). Zgłoszone jako ABC-F. Obejście `nakladka='brak'` w `ai2-heks-po-heksie-test.cjs` scenariusz I jawnie udokumentowane.
Brak NAPRAW, więc PASS-WITH-NOTES.

TESTY (samodzielnie, na `b690e9e96`, symlink do cudzego node_modules, usunięty; worktree czysty)
- tsc EXIT=0
- wyrab-rzeka-krok0 3/0, wyrab-rzeka-r2 10/0, wyrab-rzeka-d1 2/0
- auto-improvements 45/0, ai-improvements 53/0, ai-food-improvement-priority-stages 13/0
- ai2-heks-po-heksie 36/0, hodowla-las 113/0
- diplomacy 148/0, war-era-counter 82/0, unit-owner-emblem-ring-civ-color 15/0
- autoimprove-stages-q1 111/0
- ai-ulepszenia-malo-budowane 13/0
- ai4-popyt-obywatele 46/4 (Z1a, Z1d, Z1g, Q2o), na bazie też czerwone (zmierzone)
- Mutacja własna (limit domyślnie włączony): 1 FAIL w teście (k)

DIFF DO ALLOWLISTY
Względem WIP `a4034f59f`, poza `dyspozycje/`: `terrain-improvements.json` (teksty), `ai.ts`, `auto-improvements.ts`, `main.ts`, `improvement-build.ts`, `ai2-heks-po-heksie-test.cjs`, `autoimprove-stages-q1-test.cjs`, `hodowla-las-test.cjs`. Wszystkie w allowliście. Zakazane ścieżki (`gra-robocza`, `WERSJE.md`, `rust-port`, `src-tauri`, `newGameFlow.ts`, `econ-params.json`) nietknięte. Zmiany `main.ts` i `improvement-build.ts` nie weryfikowane linia po linii poza diffem (stat: main.ts 13 linii).

BLOKADY / ABC DO ZADANIA PRZEZ ORKIESTRATORA (stare reguły zostają)
- A (K1): tartak/obóz w profilu „Żywność”. B (K2/K3): kiedy powstaje tartak. C (K2/K3): próg niedoboru. D (K2 vs K3): `maxItemsPerCity: 1`. E: lama na lesie. F (K2/K3): wykluczenie heksu centrum miasta.
- NIE_ZMIERZONO: niedobór i tick wycinki na żywej grze.

SHA KOŃCOWY DO INTEGRACJI: kod `b690e9e96` (plus commit tego raportu na nim).
KOLEJNOŚĆ: temat dotyczy wyłącznie `gra/`; `origin/rust-port/parity-v2` dotyka `rust-port/`, brak nakładania ścieżek. Zintegrować do `main` niezależnie, dowolnie przed lub po parity-v2. UWAGA: `origin/main` (93a6aba1d) ma od bazy `4d1916f2c` zmiany w `gra/` (spichlerz, 9 plików), więc integracja wymaga merge/rebase na aktualne main i ponownego uruchomienia bramek.

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (merge na aktualny main, bramki), potem pytania ABC A-F do właściciela.
DEPLOY-PUSH: NIE WYKONANO

---

# Final Control — RUNDA 3/5 (dopisek; sekcje R1/R2 powyzej bez zmian)

STATUS: PASS
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES-Q1
GOAL: K1 bez tartaku i obozu, tartak tylko przy niedoborze drewna (K2/K3), AI bez limitu 1/miasto, centrum miasta bez ulepszen (K2/K3).

ZMIANY/COMMIT: ocena `5ec54e611` (rodzic `4ea31fb63`, rodzic `4d9ed1810`). Raport Operatora `b0f728f82` lezy na `4ea31fb63`. `git diff --name-only 4d9ed1810 5ec54e611`: tylko `gra/src/game/ai.ts`, `gra/src/game/auto-improvements.ts`, 7x `gra/tools/*-test.cjs`, katalog runu — w allowliscie. `git diff --check` czysty. Zero zmian w main.ts, improvement-build.ts, JSON, gra-robocza, WERSJE.md.

TESTY (odtworzone przeze mnie na `5ec54e611`, npm ci): tsc EXIT=0; autoimprove-stages-q1 143/0; wyrab-rzeka-krok0 3/0; r2 10/0; d1 2/0; auto-improvements 45/0; ai-improvements 53/0; ai-food-improvement-priority-stages 13/0; ai2-heks-po-heksie 37/0; hodowla-las 113/0; ai-ulepszenia-malo-budowane 13/0; ai4-popyt-obywatele 50/0; spichlerz-hud-params-parity 66/0; diplomacy 148/0; war-era-counter 82/0; ring 15/0. Logi `gate-r3o-*`, `pomiar-r3o-*`, `mutacje-r3o-podloga0` maja po jednej linii `EXIT=`. Mutacje Evaluatora (usuniecie bramki tartaku -> 141/2), Operatora (MUT-A/B/D/F zabite) i Obrony (podloga 10->0 -> 3 FAIL) przyjete.

ORZECZENIE ZARZUTOW:
1. Kryterium osłabione (malo-budowane): ODDAL. Obrona zmierzyla (baza 5/5 wzrost; R3 z limitem 1 przywroconym 3/5; 15 ziaren 14/15, +34%) i obalila hipoteze „szum po D=B"; dodala sume PO >= 1.15x PRZED, mutacja podlogi 0 ja lapie. Zrodlem rozjazdu sa A/B/F (rozbicie osobno: NIE_ZMIERZONO). Spadek wzrostu per ziarno (5/5 -> 2/5 na domyslnych) jest opisany, suma rosnie — brak regresji funkcjonalnej.
2. Brak logu bazowego: ODDAL (dodane `pomiar-r3o-baza-4d9ed1810.txt`, `pomiar-r3o-limit1-przywrocony.txt`, `pomiar-r3o-15-ziaren-nowy.txt`). Kosmetyka: komentarz w tescie wskazuje `pomiar-r3-obrona-*.txt`, pliki to `pomiar-r3o-*.txt` — bez wplywu na zachowanie.
3. K1 centrum miasta: ODDAL jako luka dokumentacyjna. F=A wlasciciela dotyczy K2/K3; ZALOZENIE: K1 nie objety. Pytanie ABC (kontekst K1) dla orkiestratora: czy w profilu „Zywnosc" centrum miasta tez wylaczyc z farm/trzody/irygacji? Rekomendacja A. Nie blokuje.
4. Nieaktualne etykiety: ODDAL (naprawione przez Obrone).
Zadnego NAPRAW.

DO ABC ORKIESTRATORA (nie blokuja): (a) K1 centrum miasta; (b) niedobor prawie staly (live 100% tur u gracza, 2 ziarna): rekomendacja B — liczyc tylko surowce potrzebne kolejce budowy/rekrutacji; (c) czy niedobor ma otwierac tylko ulepszenia brakujacego surowca.

BLOKADY: brak. NIE_ZMIERZONO: wieloturowa wycinka gracza live; niedobor K3 live (FC nie uruchamial Chromium); rozbicie szumu malo-budowane na A/B/F.
RUNDY: 3/5
KOLEJNOSC INTEGRACJI: SHA kodu = `5ec54e611` (zawiera `4ea31fb63`); raport Operatora `b0f728f82` (same dokumenty) z worktree-wf_e42e840c-d08-1. Merge na `origin/main` `ac952c567` (baza runu `4d9ed1810`; pliki kodu/testow tematu nie zmienione w `4d9ed1810..ac952c567` — brak oczekiwanych konfliktow), po merge ponownie bramki. Wzgledem `origin/rust-port/parity-v2` (`44a3e9ccf`): niezalezne (temat webowy `gra/`) — kolejnosc dowolna.
DEPLOY/PUSH: NIE WYKONANO
