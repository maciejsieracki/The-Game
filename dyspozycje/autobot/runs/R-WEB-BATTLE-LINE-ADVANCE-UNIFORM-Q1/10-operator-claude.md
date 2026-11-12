# R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1
GOAL: w Atak (doktryna steady) jednostki jednej rangi piechoty idą do przodu równo, aż napotkają przeszkodę/wroga; linia nie rozsypuje się i odzyskuje spójność po przeszkodzie.
BAZA: origin/main dee73a067 (worktree izolowany, `git checkout --detach origin/main`).

## Uwaga procesowa
`dyspozycje/autobot/runs/R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1/00-dispatch.md` NIE istnieje na origin/main (git show: path does not exist). Użyty był DODATEK z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (zawiera GOAL/ZADANIE/KRYTERIA/ALLOWLISTĘ). ZAŁOŻENIE: oryginalny dispatch = treść DODATKU.

## DIAGNOZA (przyczyna, zmierzona)
`_advanceStep` (battleScene.ts) wybiera dla każdej jednostki własny BFS do najbliższego wroga; jedyne ograniczenie `_compactAttackAllowsStep`/`compactLineAllowsAdvance` to „≤ własny postęp + 1" i „≤ postęp poprzedniej rangi". Nie ma żadnego ograniczenia WZGLĘDEM sąsiadów tej samej rangi, więc: (a) jednostki o większej puli ruchu uciekają do przodu, (b) jednostka obchodząca przeszkodę (skała/ściana) zostaje w tyle i NIGDY nie dogania, bo reszta idzie dalej tym samym tempem. Przyczyny uzupełniające: kolejność aktywacji i objazd zajętych pól przez własne jednostki.

## TABELA krok → rozrzut frontu (rank 0, max(q)-min(q), 9 jednostek, 14 rund; surowe dane: evidence/przed-poprawka.txt, evidence/po-poprawce.txt)
Silnik headless (produkcyjna pętla tury: _beginTurn → AUTO batch → _activateUnit → _advanceStep):

| scenariusz | przed: max rozrzut | przed: rozrzut na końcu okna podejścia | po: max rozrzut | po: koniec okna |
|---|---|---|---|---|
| open (bez przeszkód) | 0 | 0 | 0 | 0 |
| rocks (2x2 skała, atk i def) | atk 5 / def 8 | atk 5 / def 8 (nie wraca) | 2 / 2 | 0 / 0 |
| wall (ściana 5 pól, atk i def) | atk 8 / def 13 | 8 / 13 (nie wraca) | 2 / 2 | 0 / 1 |
| mixedSpeed (pula ruchu 3/2/2) | atk 13 / def 15 (rośnie bez granic) | 13 / 15 | 0 / 0 | 0 / 0 |
| frozen (1 jednostka zablokowana na stałe) | n/d | n/d | reszta linii: q=14 w rundzie 14 (anty-freeze) | |

Przykład (wall/atk, po poprawce): krok0 q=4×9 (0) → … max 2 → zbiera się do 0 po obejściu ściany; przed poprawką: `q=19,16,15,15,12,20,20,20,20` (rozrzut 8) — trwale.

Żywy Chromium (scena 3D, AUTO, Las, 16 Wojownik + 6 Łucznik vs 16 Wojownik, seed 1; evidence/line-browser-Las.json + PNG `line-before-…round6.png`, `line-after-…round6.png`): rozrzut frontu atakującego przed: 0,3,3,3,3,3,3,3,7,10 (rundy 1–10); po: 0,3,3,3,3,3,3,3,4,3. Uwaga: w tej scenie armie stykają się już w rundzie 2, więc pomiar dotyczy głównie fazy kontaktu; przy rundzie 9–10 przed poprawką front się rozjeżdża (7→10), po poprawce zostaje 3–4.

## ZMIANA (opcja A: tempo linii dostosowane do najwolniejszej jednostki rangi)
`gra/src/battle/battleScene.ts`:
- `_lineAdvanceCap(ru)` + `_lineAdvanceWithinCap(ru, col)`: dla piechoty wręcz (steady, nie konnica/strzelec/machina) kolumna docelowa ≤ (najmniej zaawansowana jednostka tej samej rangi i grupy) + (najmniejsza pula ruchu rangi). Sufit liczony z żywych pozycji; planowanie AUTO-batch pracuje na klonach stanu z początku fazy → ten sam obraz dla każdej jednostki (parytet AUTO/SKIP zachowany — oba używają `_advanceStep`).
- Jednostka na suficie CZEKA w miejscu (nie szuka kroków bocznych — te rozsypywały szyk i marnowały ruch; wykryte w pomiarze).
- Anty-freeze: jednostka w kontakcie z wrogiem nie wyznacza tempa; jednostka wyznaczająca tempo bez nowego postępu przez `LINE_ADVANCE_STALL_ROUNDS = 10` rund przestaje blokować linię. Licznik w `_lineAdvanceState` (po `bu.id`, bo planowanie pracuje na klonach — pierwsza wersja trzymała licznik na obiekcie jednostki i nie działała).
- Reset w `_resetBattleRuntimeState`. Pola leniwie inicjalizowane (stare harnessy Object.create bez konstruktora nie padają).
- Reguły walki po kontakcie, flanki konnicy (FALA 554/578), strzelcy (`_rangedAction`), `_resetSiegeForReplay` — NIE ruszane.

Dlaczego opcja A (nie B – objazd i powrót): prostsza, deterministyczna, jedna reguła; B wymagałaby planowania powrotu do linii per jednostka i dawała ryzyko oscylacji.

## TESTY (liczby z surowego wyjścia)
- `node tools/battle-line-advance-uniform-test.cjs` (NOWY): 17 PASS / 0 FAIL na kodzie po zmianie. Próg tolerancji rozrzutu = 2 (= najmniejsza pula ruchu rangi), odzysk spójności (rozrzut ≤ 1) ≤ 3 rundy po minięciu przeszkody (zmierzone: 1 runda), anty-freeze: reszta linii q≥14 w rundzie 14 (zmierzone 14).
- Mutacja czerwieni test: ten sam test na kopii sceny sprzed zmiany (`SCENE_FILE=battleScene.orig-before.ts`): 14 FAIL (rocks, wall, mixedSpeed, oba boki). Czerwony ⇒ test wykrywa defekt.
- Dobór K=10: K=4 → rozrzut 4–6 (linia zostawia obchodzące jednostki), K=7 → wall/atk 4, K=8 → 2 ale granicznie (po zmianie pomiaru na „żywy" 4), K=10 → 2; K=14 anty-freeze za wolny (q=6 w r.14 w jednej wersji). Zależność: czekający liderzy zatykają pas objazdu.
- tsc --noEmit: czysto (brak wyjścia).
- Bramki referencyjne (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test): wszystkie rc=0.
- Bitwy/AI bitwy (≈49 skryptów battle-*, auto-battle-*, map-field-battle, cavalry-flank, siege-manual, endturn-battle, pre/post-battle, palisade): rc=0 oprócz 5 skryptów, które padają IDENTYCZNIE na kodzie bazowym (zmierzone na kopii origin/main): auto-battle-simultaneous-test (1 FAIL: dead/routed units), battle-attack-move-pointer-test (Playwright click), battle-dead-unit-disappearance-test, battle-natural-chariot-r5-test (Playwright click), pre-battle-save-test (import.meta w cjs). To dług sprzed zmiany, nie regresja.
- `battle-skip-equals-auto-resolve-test.cjs`: rc=0 (42 ok, 0 fail; czas wirtualny seed 7: auto=68096 ms, skip=68080 ms) — parytet AUTO=SKIP zachowany. `battle-skip-siege-parity-test`, `siege-manual-battle-behavior-test`: rc=0.
- `battle-cap-500-test.cjs`: rc=0 po poprawce harnessu (pętla testu nie tykała `roundNo`, silnik liczy sufit w rundach; bez tego sufit nie odświeżał kontaktu i bitwa 500v500 nie kończyła się w 150 turach). Dodano `scene.roundNo = turns + 1` w pętli (tools/battle-cap-500-test.cjs). Wynik: 54 tury (baza: 42), średnia 535 ms/turę, p95 1414 ms.
- `battle-ranged-approach-regression-test.cjs`: timeout 280 s także na kodzie bazowym (test Chromium z limitem środowiska) — NIE_ZMIERZONO czy zielony.
- Test przeglądarkowy: `tools/battle-line-advance-uniform-browser-test.cjs` (żywy Chromium, before/after).

## BLOKADY / ZAŁOŻENIA / DO ABC
- DECYZJA DO ROZWAŻENIA (nie blokuje): `LINE_ADVANCE_STALL_ROUNDS = 10` to próg czasowy (po ilu rundach zablokowana jednostka przestaje wstrzymywać linię); wyznaczony pomiarem, nie wybrany jako balans — jeśli właściciel woli krótsze czekanie, K=8 daje rozrzut do 4 w scenariuszu ściany.
- Zmiana wpływa na tempo natarcia (linia = tempo najwolniejszego): bitwa 500v500 54 tury vs 42 na bazie (harness bez konnicy/dystansu). Nie zmieniono żadnych liczb prędkości/balansu.
- Strzelcy/javelin (rangedBase, np. Hastati w tej grze) i konnica NIE są objęci sufitem — mają własną logikę (`_rangedAction`, `_cavalryAction`). Hastati mają rangedBase=true, więc natarcie samych Hastati nie jest wyrównywane tym sufitem (do rozważenia w osobnym temacie).
- Rust: dług REPIN (walka/ruch w bitwie taktycznej) — tylko wskazanie, nie dotykano rust-port.
- Konflikty przy integracji: temat W16 zmienia `_resetSiegeForReplay` w battleScene.ts; moja zmiana dotyka `_resetBattleRuntimeState` (2 linie) i okolic `_compactAttackAllowsStep`/`_advanceStep` — możliwy konflikt tekstowy do rozwiązania przy integracji.
- Pliki testowe `01-matrix.json` (R-BITWA-BTF-MIXED…) modyfikowane przez uruchamiane skrypty — cofnięte, niezacommitowane.

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (powtórzyć tabelę, mutację, parytet skip/auto na seedach; ocenić wybór K i pominięcie rangedBase/konnicy).
## DEPLOY/PUSH: NIE WYKONANO
