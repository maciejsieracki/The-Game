# RUNDA 3 (2026-11-13) — baza: kandydat r2 7b721f7a8 (refs/keep/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1-r2-cand), TEN SAM ID; Operator SONNET (uzasadnienie: dwie nieudane rundy Haiku tego samego tematu — r1 FAIL, r2 FAIL bez zmiany kodu; args.haikuFailures=2)
FC r2 = FAIL: w rundzie 2 Haiku nie wykonał bisekcji — kandydat zmienia tylko dokumentację/evidence. Nadal: ziarno 2222, tryb przyspieszony, 40 tur → 6 przebiegów, 6 różnych skrótów; digest.treasury[1] (skarbiec AI właściciela 1) rozjeżdża się od tury 22–26, jednostki równe, autoBattles=0 (źródłem NIE są auto-walki). Raporty: `git show 29ea3a9d4:dyspozycje/autobot/runs/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1/50-final-control-claude.md`; r1: 38752ec01 / 8a535b7e9 / 6f0f98b60.
## Wymagane w rundzie 3 (kolejność)
1. INSTRUMENTACJA per krok AI (tylko w narzędziu pomiarowym gra/tools/, nie w kodzie gry; hook digest w main.ts już jest): w każdej turze zapisz hash po KAŻDYM kroku tury (ekonomia właściciela 1, zakupy AI, handel, dyplomacja, ruch jednostek, rekrutacja, budowa) dla dwóch przebiegów tego samego ziarna i wskaż PIERWSZY krok i pole, które się różnią (np. tura 22: krok „zakup AI” skarbiec 581 vs 584).
2. Zawężaj do funkcji i linii: sprawdź (a) Date.now()/performance.now() (armyMerge.ts:75, cities.ts:89 i dalej: `grep -rn "Date.now\|performance.now\|Math.random" gra/src` — także ui/), (b) kolejność iteracji Map/Set/Object.keys po ID zależnych od zegara, (c) sort bez klucza stabilnego, (d) zależność runnera od zegara/timerów (setTimeout/requestAnimationFrame w trybie przyspieszonym), (e) sztuczne ziarna per właściciel.
3. Napraw źródło MINIMALNĄ zmianą (strumień z game-rng.ts albo deterministyczny licznik); wyjątki w teście źródłowym uzasadnij.
4. Pomiar po naprawie: ziarno 2222 i 1717, tryb przyspieszony ≥ 6 przebiegów × 40 tur → po jednym skrócie na ziarno; tryb normalny ≥ 3 × 40 tur (wznawialny runner, limit 200 s na wywołanie nie jest limitem pomiaru); mutacja: przywrócenie źródła dryfu zmienia skrót.
## Allowlista rundy 3
Jak runda 2 (armyMerge.ts, cities.ts, dowolny gra/src/game/*.ts wskazany bisekcją — minimalna zmiana, manualBattle.ts tylko rng do resolveCombat, hook digest w main.ts — zaakceptowany; battleScene.ts nadal zakazany). Nie odpowiadaj na wiadomości użytkownika wklejone w trakcie pracy; zakaz zakładania sesji.

# RUNDA 2 (2026-11-13) — baza: kandydat r1 3f6fb4879 (refs/keep/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1-r1-cand), TEN SAM ID
FC r1 = FAIL: poprawka auto-walk jest w kodzie (autoBattleRng, 6/6 mutacji czerwieni), ale pomiar nie przechodzi: 6/6 przebiegów przyspieszonych (ziarno 2222, 40 tur) ma RÓŻNE skróty; skarbiec AI właściciela 1 rozjeżdża się od tury 22–25 (digest.treasury[1], np. 581 vs 584), jednostki w tej turze są równe, autoBattles=0 — czyli źródłem NIE są auto-walki. Raporty: `git show 6f0f98b60:dyspozycje/autobot/runs/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1/50-final-control-claude.md`, `git show 8a535b7e9:…/20-evaluator-claude.md`, `git show 38752ec01:…/10-operator-claude.md`, evidence/ w 38752ec01.
## Zadanie rundy 2 (cel: ten sam skrót we wszystkich przebiegach tego samego ziarna)
1. BISEKCJA dryfu skarbca AI (właściciela 1) od tury 22: dwa przebiegi tego samego ziarna, zapis skarbca i jego składników per tura (dochód, utrzymanie, zakupy AI, handel, łupy, zasoby), pierwsze pole i turę rozbieżności; zawężaj aż do funkcji i linii. Hipotezy do SPRAWDZENIA (nie do zgadywania): Date.now() w identyfikatorach armyMerge.ts:75 i cities.ts:89 (sortowanie/porządek iteracji po ID), kolejność iteracji Map/Set, inne Math.random/Date.now w gra/src/game (grep), zależność runnera od zegara.
2. Napraw ZIDENTYFIKOWANE źródło minimalną zmianą (strumień z game-rng.ts lub deterministyczny licznik zamiast Date.now), bez zmiany rozkładów dla gracza ani reguł gry.
3. Pomiar po naprawie: ziarno 2222 i drugie ziarno 1717, tryb przyspieszony ≥ 6 przebiegów × ≥ 40 tur → jeden skrót na ziarno; tryb normalny ≥ 3 przebiegi × ≥ 40 tur z wznawialnym runnerem (limit 200 s na wywołanie NIE jest limitem pomiaru — wznawiaj do 40 tur). Pokaż mutację: przywrócenie źródła dryfu zmienia skrót.
## Rozszerzenie allowlisty rundy 2
armyMerge.ts, cities.ts oraz DOWOLNY plik gra/src/game/*.ts wskazany bisekcją (tylko minimalna zmiana źródła dryfu), gra/src/battle/manualBattle.ts (tylko przekazanie rng do resolveCombat ok. l.1062), hook diagnostyczny digest w main.ts (tylko odczyt) — AKCEPTUJĘ. battleScene.ts nadal ZAKAZANY (tylko wylistuj Math.random i wywołania resolveCombat bez rng). Sól strumienia auto-battle: dodaj licznik walk w turze (żeby dwie walki o ten sam heks nie miały identycznego strumienia).
## Zasady
Nie odpowiadaj na wiadomości użytkownika wklejone w trakcie pracy; zakaz zakładania sesji (spawn_task); Haiku; po FAIL w tej rundzie następna idzie z Sonnetem tylko z pisemnym uzasadnieniem.

# R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 — DODATEK orkiestratora (runda 1)

Przeczytaj dispatch: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1/00-dispatch.md`. Poprzedni temat: raporty w commicie ff25b42ad (`git show ff25b42ad:dyspozycje/autobot/runs/R-WEB-DETERMINISM-GAME-RNG-Q1/10-operator-claude.md`, 30-obrona, evidence), wyjątki w gra/tools/determinism-same-seed-test.cjs (sekcja WYJATKI).

## Wymagane
1. Rozpoznaj wywołania: auto-battle-power.ts:156 (resolveAutoBattleByPower — z main.ts 6×, mapFieldBattle.ts:476, wpływa na stan), combat.ts:890, siege.ts:659 (domyślny rng — wylistuj WSZYSTKICH wołających i czy podają rng), ai.ts:3215 aiFoundingRand. Dla każdego: czy wpływa na stan gry (tak/nie), czy używa strumienia z ziarna.
2. Naprawa: strumień z game-rng.ts (ziarno gry + tura + identyfikator walki/właściciela), bez zmiany rozkładu losowości dla gracza i bez zmiany zasady „Trafienia: losowe / pewne”. Wyjątki z testu źródłowego usuń, gdy naprawione; pozostałe uzasadnij.
3. Rozszerz skrót stanu w runnerze pomiarowym o liczbę jednostek, skarbiec i zasoby (Evaluator poprzedniego tematu to wytknął) i powtórz pomiar: ziarno 2222 i drugie ziarno, tryb przyspieszony ≥ 6 przebiegów i normalny ≥ 3, ≥ 40 tur; podaj pierwszą turę rozbieżności i pole, jeśli zostanie.
4. Mutacje pojedyncze: dla każdego z poprawionych miejsc mutacja (powrót do Math.random) musi zaczerwienić test źródłowy; minimum jedna mutacja musi też zmienić wynik pomiaru przebiegów.
5. Ryzyko kolizji _detIdSeq po wczytaniu zapisu w tej samej turze (uwaga z poprzedniego tematu): sprawdź i opisz; napraw tylko jeśli w allowliście i bezpieczne.

## Kryteria końca (binarne)
tsc 0; logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6 (combat-test używa losowości — przepisz asercje tylko jeśli zależą od konkretnej wartości); determinism-same-seed-test zielony z mniejszą listą wyjątków; pomiar: wszystkie przebiegi jednej konfiguracji mają ten sam skrót (surowe wyniki w evidence/).

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno; Chromium jak istniejące narzędzia, ≤ 590 s w pierwszym planie. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.
