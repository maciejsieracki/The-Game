STATUS: FAIL (Evaluator: 3 zarzuty istotne; werdykt końcowy należy do Final Control)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MANUAL-RNG-DETERMINISM-Q1
GOAL: walka ręczna i sceniczna używają deterministycznego generatora z ziarna gry (ten sam mechanizm co walki AUTO), bez zmian reguł/balansu.
ZMIANY/COMMIT: kandydat eb68e66d8ac331957edbcc44a0ddbc3d903c6818, baza fab9a9b75 (origin/main od tego czasu 501f78c08; kandydat nie jest rebase'owany, 2 commity dokumentacyjne różnicy). Ten raport jest jedynym plikiem dodanym przez Evaluatora.
ALLOWLISTA (git diff --name-only fab9a9b75..eb68e66d8): runs/.../10-operator-claude.md, gra/src/battle/battleScene.ts, gra/src/battle/manualBattle.ts, gra/src/main.ts, gra/tools/manual-battle-rng-determinism-test.cjs. Zgodne z intencją allowlisty (ścieżka w dispatchu wskazana jako src/ui/battleScene.ts, realny plik to src/battle/battleScene.ts; Operator zgłosił). Brak gra/data, WERSJE.md, rust-port/.

TESTY (odtworzone samodzielnie na kandydacie, gra/, npm ci):
- tsc --noEmit: exit 0
- git diff --check fab9a9b75..eb68e66d8: czysty
- manual-battle-rng-determinism-test.cjs: wszystkie PASS, exit 0
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass 0 fail; research-test: 33/0/33; unit-replace-test: 21/21; combat-test: 6/6 pass. Wszystkie exit 0. Brak czerwonych, więc nie było długu bazowego do rozróżniania.
- Dowód mutacyjny własny (kopia źródeł w scratchpad, MANUAL_RNG_ROOT): (a) _singleBlow z powrotem na Math.random() -> FAILED 1, exit 1; (b) usunięcie combatRng w 2 z 4 miejsc main.ts -> FAILED 2 (combatRng=2), exit 1. Test statyczny czerwienieje po cofnięciu poprawek. Deklarowanych 10 FAIL na bazie nie powtarzałem.
- NIE_ZMIERZONO: weryfikacja live (przeglądarka/__detHarness), wznowienie z zapisu po walce, niezależność kolejności wywołań _combatRng od czasu klatek.

ZARZUTY:
1. ISTOTNY: ścieżka walki ręcznej z mapy (mapFieldBattle.ts:532, deps.createBattleScene -> main.ts:38060 `new BattleScene(opts)`) NIE dostaje combatRng. Opts w mapFieldBattle.ts:532-566 nie zawierają combatRng, a wrapper main.ts:38060 przekazuje opts bez zmian, więc ta podstawowa ścieżka bitwy polowej nadal używa Math.random (domyślne _combatRng i resolveCombat w "Pomiń"). Test statyczny tego nie wykrywa (liczy tylko `combatRng: battleCombatRng()` w main.ts, próg >=4). GOAL niespełniony w pełni. Poprawka minimalna: wstrzyknąć combatRng w wrapperze main.ts:38060 (mieści się w allowliście "minimalne wejście generatora w main.ts") albo przekazać fabrykę przez deps.
2. ISTOTNY (kryterium 3 dispatchu): test regresji jest wyłącznie statycznym grepem źródeł. Dispatch wymaga "dwa uruchomienia tej samej walki ręcznej z tym samym stanem generatora dają identyczne wyniki"; testu behawioralnego brak. Zielony test nie dowodzi determinizmu (zarzut 1 jest tego dowodem: test zielony mimo niepodpiętej ścieżki). resolveCombat (combat.ts) jest czystą funkcją, więc test behawioralny z seeded rng w node (jak combat-test) był wykonalny; brak też jawnego NIE_ZMIERZONO z powodem.
3. ISTOTNY/NOTE (kryterium 4): weryfikacja live niewykonana; nie sprawdzono, czy kolejność wywołań _combatRng w pętli animacji (battleScene.ts ~9427/9473, requestAnimationFrame, speedMul) nie zależy od czasu klatek, co mogłoby podważać "ten sam wynik" nawet przy poprawnym ziarnie. Raport Operatora poprawnie oznacza to NIE_ZMIERZONO, ale bez analizy.
4. DROBNY: ManualBattle (manualBattle.ts) nie jest nigdzie instancjonowany w gra/src (potwierdzone grepem); zmiany tam są zgodne z dispatchem, ale bez efektu w grze.
5. DROBNY: gra/src/oblezenie/main.ts:46 (osobny entry) nadal bez combatRng; poza allowlistą.
6. DROBNY: brak testu migracji zapisu (stary zapis bez battleCombatSeq*). Odczyt w main.ts jest defensywny (domyślnie -1/0), więc ryzyko niskie.
7. DROBNY: kandydat oparty na fab9a9b75, main = 501f78c08; przy integracji sprawdzić merge main.ts.
Bez zastrzeżeń: allowlista, brak osłabionych istniejących testów (nie zmieniono żadnego istniejącego testu), sposób seeda gameStreamRng(_gameSeed, turn, 'battle-combat:'+licznik) zgodny z autoBattleRng, reset licznika co turę, tsc i 5 bramek zielone.

BLOKADY: brak technicznych.
RUNDY: Evaluator rundy 1/5.
NASTĘPNY KROK: Final Control; sugerowany FAIL -> Operator (to samo ID): zarzut 1 (podpięcie w main.ts:38060), zarzut 2 (test behawioralny na resolveCombat lub jawne NIE_ZMIERZONO).

UWAGI-DLA-ORKIESTRATORA:
- 00-dispatch.md nie istnieje na origin/main; jest tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.
DEPLOY/PUSH: NIE WYKONANO
