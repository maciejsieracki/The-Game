STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-H-MANUAL-ROZP-Q1 (runda 1, Evaluator SONNET, adwersarialny)
GOAL: Potwierdzić lub obalić 5 wybranych odwołań z `01-rozpoznanie.md` (web i Rust) oraz zakres commitu Operatora.
ZMIANY/COMMIT: tylko ten plik. Kod, `gra/`, `rust-port/` nietknięte. Bez push.
TESTY: NIE DOTYCZY (tryb odczytu). Weryfikacja: `git show 07d2fbd72:gra/src/battle/battleScene.ts` oraz `git show/grep 316ded4b7 -- rust-port/...` (polecenia w §3).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (Haiku) odpowiada na zarzuty 1-3; orkiestrator integruje `3589700dd` (jest na gałęzi worktree `-1`, nie na HEAD tego worktree).
DEPLOY/PUSH: NIE WYKONANO

## §1. Zakres commitu

`git show --stat 3589700dd` oraz `git diff --name-status 459354a12 3589700dd`: jeden plik, `A dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/01-rozpoznanie.md` (135 linii). Brak zmian w `gra/` i `rust-port/`. **POTWIERDZONE.**
Baza `origin/rust-port/parity-v2` = `316ded4b7e2ed836cddc76c53c04090d449c6c4a` (`git rev-parse`) zgodna z raportem. Pin `07d2fbd72` ma 20771 linii `battleScene.ts`, jak w raporcie.

## §2. Sprawdzone odwołania (5)

| # | Odwołanie z raportu | Wynik | Dowód |
|---|---|---|---|
| A | Pin 18435-18475 `_performSiegeManualOrder`; korekta dispatchu (koniec 18475, nie 18470); docstring 18430-18434; guard 18437-18438; gałęzie 18439-18475 | POTWIERDZONE | Funkcja zaczyna się 18435, kończy `}` 18475. Wiersze 7-9, 11-20 tabeli zgadzają się z kodem (guard `move`/`atk`, `isSiegeUnit` → `_siegeRamTowerStep`/`return false`, walkway 18453, climb 18458, infantry 18459, approach restricted 18460, cel 18463-18469, dotarcie 18470, `_siegeSafeApproach` 18471-18473). `_performPlayerOrder` 18280, wywołanie 18286 po `hold` 18282. |
| B | Pin 6020-6025 `player_unit_idle` + Rust `siege_tactics_turnseq.rs:139-140`, `:350`, `siege_tactics_loop.rs:456`; korekta 6068 = odczyt `_manualMode`, nie zerowanie | POTWIERDZONE | Pin 6020-6024 `idlePlayerUnit`, 6025 `if (!idlePlayerUnit) u.acted = true`; 6066-6069 odczyt. Rust: trait 140 (`fn player_unit_idle`), użycie 350, `ProdOps` stub `false` w loop.rs:456. Zapisy `_manualMode`: 2286, 3572, 10539, 17353; wołający `_toggleManualMode` 3710, 10012, 11813, 17419 zgodne z `grep`. |
| C | Rust `siege_tactics_loop.rs:773-791` (atrapy `ProdOps`) i bramka `tryb-reczny` 1036-1039 | POTWIERDZONE co do faktów, ZAKWESTIONOWANE co do wniosku (zarzut 1) | 773 `perform_player_order`, 776 `doctrine_step`, 779, 782, 785, 788 (`None`), 791 (`melee_target`). Bramka: 1036 `let out_of_scope`, 1037 `"tryb-reczny"`, 1038-1039 `"oblezenie"`. |
| D | Zportowane helpery K1/K3/KLASY: `siege_tactics_tower.rs` 344/399/439, `siege_tactics_approach.rs` 155/231, `siege_tactics_walk.rs` 208/235, `siege_tactics_classify.rs` 163/169, adapter `tower_ops` `siege_tactics_activate.rs` 480-495, gałąź `U7.0-manual` 238-241 | POTWIERDZONE | `git grep` zwraca dokładnie te numery linii. Brak wołającego w produkcji: potwierdzone, `ProdOps` zwraca atrapy. Brak `performSiegeManual`/`R-WEB-SIEGE-MANUAL`/`manualControlAllowed` w kodzie `rust-port` (0 trafień). |
| E | Opis ciał `_rangedTargetInRange` (7041) i `_targetInRange` (8373) w wierszach 11 i 12 | `_rangedTargetInRange` POTWIERDZONE; `_targetInRange` CZĘŚCIOWO OBALONE (zarzut 3) | 7041: najbliższy wróg `1 <= dd <= range`, remis → niższe `hp`. 8373-8397: gałąź melee ma `_meleeBlockedByWall` oraz `dd === 1 \|\| dd === 0`, a wybór to `lowestHp` z `inReach`. Raport opisuje melee jako samo „Manhattan == 1". |

## §3. Zarzuty (ponumerowane)

**Z1 (istotny): zakres H4 jest zaniżony, bramka `oblezenie` nie jest uwzględniona.**
`siege_tactics_loop.rs:1036-1039` składa się z DWÓCH bramek: `tryb-reczny` (1037) i `oblezenie` (1038-1039, `scene.wall_col >= 0 || st.siege_wall_col >= 0`). Komentarz w 1096 potwierdza: „strażnik `oblezenie` wyżej wyklucza mur". `_performSiegeManualOrder` działa wyłącznie przy `siegeWallCol >= 0` (pin 18437). Samo odblokowanie `tryb-reczny` (opis H4 i „Uwaga do #97") nie uruchomi ręcznego oblężenia: jednostka wpadnie w `oblezenie` i zwróci 0.0 jako `unported`. Raport tego nie mówi, a zakres H4 podaje „1036-1039 (`tryb-reczny`)". Co zdejmuje `oblezenie` (K5LOOP-WIRING #113 albo osobny temat), jest NIE_ZMIERZONO i powinno być jawną zależnością H4.
Odtworzenie: `git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_loop.rs | sed -n '1034,1062p;1092,1098p'`.

**Z2 (istotny): kontrakt `ActivateOps` nie niesie `done` ani parametrów, raport tego nie wskazuje jako ryzyka H3/H4.**
`siege_tactics_activate.rs:112-132`: `perform_player_order(&mut self) -> bool`, `ram_tower_step`, `tower_climb`, `infantry_to_tower` są bezargumentowe i synchroniczne, a `ProdOps` (loop.rs) trzyma tylko `melee_target`. Pin przekazuje `done` (callback wywoływany po animacji ruchu/ataku, np. `_siegeSafeApproach(..., cb)` w 18471) i zmienia `ru.playerOrder`. Raport klasyfikuje H3 jako „NIE dotyka wspólnych plików", ale nie rozstrzyga, jak wynik kroku z callbackiem wraca do sekwencji tury (i czy trait wymaga zmiany sygnatur w `siege_tactics_activate.rs`, które nie jest na allowlistach H1-H4). NIE_ZMIERZONO, powinno trafić do §6 i do dispatchu H3/H4.

**Z3 (średni): opis `_targetInRange` w wierszu 12 jest niepełny, a H2 z niego zrobiono specyfikację.**
Raport: „dla melee sąsiedztwo Manhattan == 1". Pin 8384-8395: filtr `_meleeBlockedByWall(ru, e)` (R2, port K2 istnieje, task #47) oraz `dd === 0 \|\| dd === 1`; wybór celu `lowestHp`, dla strzelca też `lowestHp`, nie najbliższy (to właśnie odróżnia od `_rangedTargetInRange`, co komentarz w pinie podkreśla). Raport twierdzi, że ciało „przeczytane", ale pomija trzy cechy. H2 powinno wymienić zależność od `meleeBlockedByWall` (K2) i wektory dla `dd === 0` oraz remisu HP.

**Z4 (niski): pominięte krawędzie wywołań wokół `_performPlayerOrder`.**
Tabela nie zawiera: `_performPlayerOrder` → `_executeGroupDoctrineStep` (pin 18291, przy `ord.type === 'none'` i doktrynie AUTO), `_activateUnit` → `_executeGroupDoctrineStep` (6097), wołających `_executeUnitsImmediate` (3610, 18649, 18677, 18699). Wiersz 2 mówi „doktryna w trybie ręcznym wraca przez `_performPlayerOrder`", ale nie zaznacza wzajemnej rekursji `_performPlayerOrder` ↔ `_executeGroupDoctrineStep` (rozkaz `move` z 18082/18122 wraca do `_performPlayerOrder`; w `_performSiegeManualOrder` `move` → `false`, więc pętla się zamyka). Dla T8 i T1 to ma znaczenie przy kolejności i wektorach.

**Z5 (niski): twierdzenie „w H3 wystarczą dwie flagi wejściowe" jest niezweryfikowane.**
Wiersz 10 opiera się na tym, że `_isUnitDoctrineAuto` (17621) i `_effectiveMetaForUnit` (17633) nie były czytane (§6 raportu to przyznaje). Wniosek o dwóch flagach (`doctrine_auto`, `doctrine_manual`) jest więc hipotezą, a nie ustaleniem. Powinno stać NIE_ZMIERZONO, nie rekomendacja.

**Z6 (informacyjny): pytanie ABC §4a.**
Format poprawny (opis, plusy/minusy, rekomendacja A), ale rekomendacja A oznacza, że łańcuch H3 → H4 czeka na #179/#148, które w kolejce są pending/BLOCKED (#147-#149). Raport tego następstwa nie nazywa kosztem, tylko „dłuższym czekaniem". Rozstrzygnięcie należy do orkiestratora (decyzja techniczna, nie gameplay). Dispatch zakazuje pytać właściciela o to, co rozstrzyga web: raport zachował to rozróżnienie (gameplay: brak pytań).

**Z7 (informacyjny): logistyka.**
Commit `3589700dd` leży na gałęzi worktree `-1`, nie jest przodkiem HEAD tego worktree (`459354a12`). Orkiestrator musi go jawnie scalić. Zapis tematu wykonawczego przez `spawn_task` nie powiódł się (timeout MCP, wg raportu). Nie jest to wada rozpoznania.

## §4. Co potwierdzono bez zastrzeżeń

- Główny wniosek: w produkcji Rust tryb ręczny oblężenia nie działa (`ProdOps::perform_player_order` = `false`, bramka `tryb-reczny`, brak portu `_performSiegeManualOrder`). **Potwierdzone.**
- Helpery taranu/wieży/podejścia istnieją, ale bez wołającego produkcyjnego. **Potwierdzone.**
- Korekty do dispatchu (18475, 6068 = odczyt). **Potwierdzone.**
- Brak wektorów dla `_performSiegeManualOrder` w `rust-port`. **Potwierdzone** (`git grep -n -i "performSiegeManual\|R-WEB-SIEGE-MANUAL" 316ded4b7 -- rust-port` → 0 trafień).
- Testy webowe `gra/tools/siege-manual-battle-behavior-test.cjs` i `siege-manual-battle-live.cjs` istnieją (w HEAD i w pinie).

## §5. NIE_ZMIERZONO (Evaluator)

- Czy `oblezenie` (loop.rs:1038-1039) jest zdejmowane przez któryś istniejący temat (#97, #113, #112).
- Czy trait `ActivateOps` wymaga zmiany sygnatur dla H3/H4.
- Poprawność klasyfikacji wierszy 19, 22, 24, 26 (ciała nieczytane przez Operatora; Evaluator ich również nie czytał).
- Poprzednie raporty `K5-AUTO-EXEC-ROZP` i `K5LOOP-OUTCOME-ROZPOZNANIE` (#226) nie są w tym checkoucie `dyspozycje/autobot/runs/`; zgodność nazw T1-T8 z nimi nie została sprawdzona.
- Zachowanie w grze / testy `*-live.cjs`: nie uruchamiano.

## §6. Polecenia (odtwarzalne)

```
git show --stat 3589700dd
git diff --name-status 459354a12 3589700dd
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '18428,18476p;6012,6030p;6064,6070p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '7038,7052p;8370,8400p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n "_performPlayerOrder(\|_performSiegeManualOrder\|_toggleManualMode()\|_executeUnitsImmediate("
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_loop.rs | sed -n '450,460p;768,795p;1030,1062p;1092,1098p'
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_activate.rs | sed -n '112,132p;230,245p;476,496p'
git grep -n "pub fn siege_ram_tower_step\|pub fn siege_tower_climb\|pub fn siege_infantry_to_tower_step" 316ded4b7 -- rust-port/engine/src/domain/siege_tactics_tower.rs
git grep -n "pub fn siege_approach_restricted\|pub fn siege_safe_approach_goal" 316ded4b7 -- rust-port/engine/src/domain/siege_tactics_approach.rs
git grep -n -i "performSiegeManual\|R-WEB-SIEGE-MANUAL\|manualControlAllowed" 316ded4b7 -- rust-port
```

## §7. Werdykt

PASS-WITH-NOTES. Rozpoznanie jest w głównych punktach rzetelne i weryfikowalne (4 z 5 sprawdzonych odwołań w pełni, 1 częściowo). Przed dispatchem H3/H4 wymagane poprawki: Z1 (jawna zależność od bramki `oblezenie`), Z2 (kontrakt `done`/sygnatury) i Z3 (pełny opis `_targetInRange`).
