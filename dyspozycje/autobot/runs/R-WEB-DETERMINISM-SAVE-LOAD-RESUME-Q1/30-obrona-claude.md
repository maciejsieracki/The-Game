# R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 — obrona Operatora, runda 2 (Claude, Haiku)

STATUS: PASS-WITH-NOTES (zarzuty 1-4 domknięte pomiarem live; zarzut 6 wymaga decyzji właściciela; zarzuty 5 i 7 zgłoszone, nie naprawione w tej rundzie)
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 (#373)
GOAL: wznowiona z zapisu gra ma dawać ten sam przebieg co gra nieprzerwana (to samo ziarno).
BAZA: 0bf7be4ef (kandydat runda 1). Dispatch: `f734ed0e6` (`00-dispatch.md`). Dodatek `00-dispatch-DODATEK-claude.md` nie istnieje na origin/main ani na gałęzi claude (zał.: dispatch z f734ed0e6, baza 85f7961b1).

## ZMIANY / COMMIT

- `gra/src/main.ts` — poza kandydatem 0bf7be4ef dodano WYŁĄCZNIE hak pomiarowy `window.__detHarness` (blok `if (...civTest=1...)` przed hakiem PRACA-POOL). Zachowanie gry bez `?civTest=1` bez zmian. Poprawka zapisu/odczytu (liczniki detIdSeq / autoBattleSeqTurn / autoBattleSeq) pochodzi z 0bf7be4ef i nie została zmieniona.
- `gra/tools/determinism-save-load-resume-live.cjs` — NOWE: pomiar live (headless Chromium, realny bundle): tryby A (gra nieprzerwana + zapis + K tur), B (świeża sesja, ten sam seed, realny `restoreGameFromSave`, K tur), C (jak B, ze zdjętymi polami meta = stary zapis) oraz `--compare`. Nie jest bramką (wymaga dist i przeglądarki); to źródło dowodu dla kryteriów (a)-(d).
- `gra/tools/determinism-save-load-resume-test.cjs` — bez zmian względem 0bf7be4ef (test źródłowy/regex, traktowany jako strażnik, nie jako dowód przebiegu).
- SHA: patrz pole `sha` w StructuredOutput (commit tej rundy na 0bf7be4ef).

## TESTY

### Metoda pomiaru (a)-(d)
- Bundle: `npx vite build` z KOPII `gra/` poza repo (`scratchpad/det/{base,cand,final}`), `base` = 85f7961b1 + hak, `cand` = 0bf7be4ef + hak, `final` = stan tej rundy (= commit). `npm run build` w repo nie był użyty.
- Scenariusz: Rzymianie, mapa Maly, `startNewGame({seed})` z `?civTest=1&civSeed=S`, `foundPlayerStartCity`, `disableVictoryCheckForTest`. Zapis w turze N=6 (`buildSaveGameSnapshot` → JSON), potem K=10 tur (tury 7-16). Wczytanie = `restoreGameFromSave(JSON.parse(snap))` w świeżej sesji o tym samym ziarnie.
- Digest po każdej turze: `units` i `cities` (pełny JSON, hash FNV-1a) bez pola `podzialPracy` miast (`fnvNoPP`), plus liczniki `detIdSeq`, `autoBattleSeqTurn/Seq`, `dipUnitSeq`. Pełny hash (z `podzialPracy`) też zapisany — patrz zarzut 2 niżej.
- Ziarna: 2222 i 4242. Każdy przebieg 0 błędów strony (`pageErrors=0` we wszystkich 14 uruchomieniach: base A/B, cand A/B/C, final A/B/C dla obu ziaren).

### (a) Tabela digestów tura po turze: nieprzerwana (A) vs wznowiona (B) — PRZED (baza 85f7961b1) i PO naprawie (0bf7be4ef / final)

Legenda: EQ = `fnvNoPP` identyczny, DIFF = różny. Kolumny: tura 7..16 (K=10). Zapis w turze 6.

| Ziarno | Wariant | restore detIdSeq (snap=4) | tury 7-13 | tury 14-16 | Wynik |
|---|---|---|---|---|---|
| 2222 | PRZED (base) | 2 (≠4) | EQ×7 | DIFF×3 | 7/10 |
| 4242 | PRZED (base) | 2 (≠4) | EQ×7 | DIFF×3 | 7/10 |
| 2222 | PO (final) | 4 (=4) | EQ×10 | — | 10/10 |
| 4242 | PO (final) | 4 (=4) | EQ×10 | — | 10/10 |

Szczegóły PO (final, ziarno 2222, `fnvNoPP` A = B): t7 3773dd57, t8 7dbd8a38, t9 bf853f11, t10 c2f3397, t11 678d8c6d, t12 4835e172, t13 7423adf, t14 9106b05b, t15 78fba6a5, t16 a83de30e (wszystkie EQ). Ziarno 4242: 10/10 EQ (A = B w każdej turze).
Przed naprawą rozjazd widać od tury 14: w tej turze gra dodaje jednostki i ID jest generowane z licznika (base: wznowiona od 2, nieprzerwana od 4).
Kontrola: A-run base i A-run final dają IDENTYCZNE digesty przez 16 tur na obu ziarnach — poprawka nie zmienia przebiegu gry nieprzerwanej.
Restore==snap: PRZED `restore` digest ≠ snap w polu detIdSeq (2 vs 4); PO: restore == snap (`fnvNoPP` i długość identyczne, detIdSeq 4 = 4).

### (b) Po naprawie digesty identyczne przez ≥10 tur dla ≥2 ziaren
- Ziarno 2222: 10/10 tur EQ (tury 7-16). Ziarno 4242: 10/10 tur EQ. Spełnione dla K=10 (wymóg ≥10).
- Ograniczenie zakresu (NIE_ZMIERZONO poza digestem): digest obejmuje jednostki i miasta (w tym surowce i ID); NIE obejmuje stanu dyplomacji, AI-closure, kolejek negocjacji, cooldownów i zmiennych w closure poza licznikami ID. Dowód = zgodność tego digestu, nie pełnej serializacji.

### (c) Stary zapis bez nowych pól wczytuje się bez błędu
- Tryb C (ziarno 2222): ze snapshotu usunięto `detIdSeq`, `autoBattleSeqTurn`, `autoBattleSeq`. Wynik: `pageErrors=0`, licznik po wczytaniu `detIdSeq=0` (domyślna wartość). Przebieg wznowiony: EQ 7/10 (jak PRZED, bo bez liczników nie da się odtworzyć ID — zgodnie z dispatchem „brak pola = dotychczasowe zachowanie”). Stary zapis działa; nie daje identycznego przebiegu, co jest jawnym ograniczeniem.

### (d) Mutacja (pominięcie zapisu pola) czerwieni test PRZEBIEGOWY
- Naturalna mutacja = baza 85f7961b1 (bez zapisu/odczytu liczników): test live daje DIFF w turach 14-16 na obu ziarnach (7/10). Test czerwienieje na przebiegu, nie na tekście źródła.
- Mutacja „odczyt = 0” nie była osobno uruchamiana (NIE_ZMIERZONO); pokryta w praktyce przypadkiem bazy (odczyt nie przywraca licznika → restoreIds=2).

### Bramki (final = commit tej rundy, kopia pomiarowa; liczby z surowego wyjścia)
- `tsc --noEmit` (gra/): exit 0
- determinism-save-load-resume-test: exit 0, 8 PASS / 0 FAIL
- determinism-same-seed-test: exit 0, 14 PASS / 0 FAIL
- logic-test: `LOGIC OK (213/213)`, exit 0
- tech-tree-test: `20 pass, 0 fail`, exit 0
- research-test: `ALL GREEN` (33/0), exit 0
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- combat-test: `All sanity checks passed.`, exit 0
- saveload-hud-cache-hotseat-wiring-test: `9 pass / 0 fail`, exit 0
- save-label-test: `OK`, exit 0; save-load-sort-test: `OK (4/4)`, exit 0
- Live (committed tool, final dist): 2222 A/B 10/10, 4242 A/B 10/10, C 7/10; pageErrors=0 wszędzie.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

1. (Tabela digestów tura po turze, przed/po) — PRZYJMUJĘ: tabela wyżej, dane z `scratchpad/det/{base-A,base-B,final-A,final-B}-{2222,4242}.json` (surowe rekordy). Dowód = wynik pomiaru live.
2. (Test tylko regexowy; brak dowodu przebiegowego (b)) — PRZYJMUJĘ: dodano `gra/tools/determinism-save-load-resume-live.cjs` (realny bundle, 2 ziarna, 10 tur, wynik 10/10). Test regex zostaje jako strażnik źródła, nie jako dowód.
3. (Brak testu restore na zapisie bez nowych pól) — PRZYJMUJĘ: tryb C live, pageErrors=0, detIdSeq=0 po wczytaniu, przebieg 7/10 (ograniczenie opisane).
4. (Mutacja czerwieni tylko test tekstowy) — PRZYJMUJĘ częściowo: naturalna mutacja (= baza bez zapisu) czerwieni test PRZEBIEGOWY (7/10, DIFF od tury 14). Osobna mutacja „odczyt=0” nie była uruchamiana live — NIE_ZMIERZONO.
5. (`_detIdSeq` nie zerowany przy „Nowa gra” w tej samej sesji) — ODRZUCAM w tej rundzie: naprawa wymagałaby zmiany w `doStartGame` (poza allowlistą dispatchu: „TYLKO ścieżka zapisu/wczytania, serializacja stanu i hook digest”). Potwierdzam fakt: `_detIdSeq` deklarowany tylko w l.2011, bez resetu w ścieżce nowej gry (grep: brak `_detIdSeq = 0` poza deklaracją). Zgłaszam jako osobny temat (patrz UWAGI).
6. (Walka taktyczna niezbadana) — ZBADANE, stan faktyczny poniżej; DECISION_REQUIRED (zmiana produktowa, nie w zakresie).
7. (`_dipUnitSeq` niezapisywany) — PRZYJMUJĘ jako fakt, NIE_ZMIERZONO wpływ: licznik nie jest w meta, jest zerowany w l.11442 (inna ścieżka resetu sesji), l.46484 (ścieżka resetu stanu AI, kontekst nie zweryfikowany co do nowej gry) i l.48783 (`restoreGameFromSave`). W scenariuszu 16 tur `dipSeq=0` cały czas (nie wystąpiły jednostki dyplomatyczne), więc ten przebieg nie testuje tego licznika. Ryzyko: po wczytaniu w turze, w której istnieją już `dip_<tura>_<n>`, licznik startuje od 0 → możliwa kolizja ID. Nie naprawiono (brak scenariusza runtime do weryfikacji; allowlista obejmuje ścieżkę zapisu, więc naprawa byłaby technicznie dozwolona — decyzja orkiestratora).

## WALKA TAKTYCZNA (część 2 dispatchu) — stan faktyczny
- Automatyczna (skip/auto): `gra/src/battle/battleScene.ts:20838` wywołuje `resolveCombat(cu_a, cu_d, {...})` BEZ `rng` (opcje: maxRounds, terrain, counters, bonusy; brak pola `rng`).
- Ręczna: `gra/src/battle/manualBattle.ts:1062` — `resolveCombat(cuA, cuD, {...})` BEZ `rng`.
- `gra/src/game/combat.ts:890`: `const rng = opts.rng ?? (() => Math.random());` — oba powyższe wołania trafiają więc na `Math.random` (niezależne od ziarna gry).
- Wniosek: wyniki walk TAKTYCZNYCH (ręcznych i pominięcia „Pomiń” w battleScene) NIE są zależne od ziarna. Walka automatyczna (`auto-battle-power.ts`) jest już na strumieniach ziarna (R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1).
- DECISION_REQUIRED: czy walka taktyczna na żywo ma być deterministyczna przy tym samym ziarnie? Zmiana = przekazanie `rng` ze strumienia ziarna do obu wywołań (poza allowlistą tego tematu: battleScene i manualBattle). Nie wykonano.

## NIE_ZMIERZONO (jawnie)
- Pełna serializacja stanu (AI-closure, dyplomacja, negocjacje, cooldowny) — digest ich nie obejmuje.
- Scenariusz z jednostkami dyplomatycznymi (`dipSeq>0`) i walką — poza 16-turowym przebiegiem.
- Mutacja „odczyt = 0” osobno (live).
- Przeglądarkowy pomiar UI wczytania (IndexedDB/plik slotu): restore wykonany przez realne `restoreGameFromSave` na JSON-klonie, bez zapisu do IndexedDB.

## RUNDY
Obrona runda 2 (obrona zarzutów rundy 1). Limit 5/5 nie przekroczony.

## UWAGI-DLA-ORKIESTRATORA
- U1 (zarzut 5, osobny temat, poza allowlistą tego tematu): reset `_detIdSeq` (i ewentualnie `_autoBattleSeqTurn/_autoBattleSeq`) przy „Nowa gra” w `doStartGame`; dwie kolejne nowe gry z tym samym ziarnem w jednej sesji dają inne ID.
- U2 (zarzut 7, osobny temat, w allowliście ścieżki zapisu): `_dipUnitSeq` zapisać w meta i przywrócić (domyślnie 0) — analogicznie do trzech liczników; wymaga scenariusza z jednostkami dyplomatycznymi do pomiaru.
- U3 (DECISION_REQUIRED): deterministyczność walki taktycznej (battleScene.ts:20838, manualBattle.ts:1062 → combat.ts:890).
- U4 (obserwacja, nie błąd potwierdzony): restore wpisuje `podzialPracy` (wartość domyślna `{procentBudynki:70}`) do miast, w których żywy stan go nie ma (różnica tylko w pełnym dumpie; digest bez tego pola = EQ). Semantyka: `delete c.podzialPracy` oznacza „śledzi wartość imperium” (cities.ts/main.ts ~6578-6596, ~9838). Czy restore powinien odtwarzać brak pola — NIE_ZMIERZONO.
- U5: test live wymaga zbudowanego dist (vite build w kopii); nie jest częścią `npm run` ani bramek repo.

NASTĘPNY KROK: Evaluator (runda 2) — ocena tabeli (a), dowodu (b)-(d) z plików live; decyzja orkiestratora w sprawie U1-U3.
DEPLOY/PUSH: NIE WYKONANO
