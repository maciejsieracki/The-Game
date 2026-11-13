STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora z `02-evaluator.md` (commit `0cd6c2c34`, PASS-WITH-NOTES). Każdy zarzut: PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: SHA operatora badanego: `f9d5a2915`. Poprawki obrony: tylko `dyspozycje/rust-port/p6/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1-ROZPOZNANIE.md` oraz ten plik (allowlista). Commit obrony: SHA w sekcji „Commit” poniżej. Brak zmian w `src/**`, `tests/**`, `gra/**`, `Cargo.*`.
TESTY: NIE DOTYCZY (rozpoznanie, bez zmian kodu, cargo nie uruchomiono). Pomiar R1 wykonany skryptem Python na plikach wyeksportowanych przez `git show` (pin `07d2fbd72:gra/data/counters.json`, baza `5e8b116e8:rust-port/engine/data/derived/counter-multipliers.json`), skrypt i pliki w katalogu scratchpad, poza repo.
BLOKADY: (1) Zarzut 1 wymaga decyzji właściciela (T0) co do wiersza `falangite → spearman` (pin 1.30, Rust 1). Obrona nie rozstrzyga progu ani źródła danych. (2) Zarzut 1 wskazuje, że komentarz `combat.rs:185–187` jest nieprawdziwy. Poprawka komentarza wymaga zmiany `src/**`, a ta jest poza allowlistą tej rundy; przechodzi do T1.
RUNDY: 1/5 (obrona R2-Q1, runda 1 Operatora)
NASTĘPNY KROK: Evaluator r2 (weryfikacja poprawek w `ROZPOZNANIE.md` i tego pliku), następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO (brak push; commit lokalny na detached HEAD worktree `wf_2fc2f4dd-d01-3`).

## Odpowiedzi na zarzuty

### Zarzut 1 (ISTOTNY, R1 niezmierzone): PRZYJMUJĘ
- Dowód: skrypt emuluje `counterMultiplier` z pinu (`combat.ts:553–580`: filtr `Status=potwierdzone`, `Rodzaj=Atak`, dopasowanie substring w obie strony, alternatywy `/` w `Cel (typ)`, `1 + Bonus/100`, brak dopasowania = 1.0). Porównanie po 64 parach typów kanonicznych (`spearman, mount, distance, slinger, swordsman, falangite, offensive, naval`).
- Wynik: jedna rozbieżność, `falangite → spearman`: pin **1.30** (wiersz `Falangite | Spearman | +30%`, `counters.json`), Rust **1** (wpis jawny `{"atakujacy":"falangite","cel":"spearman","mnoznik":1}` w `counter-multipliers.json`). 63 pozostałe pary zgodne.
- Wariant dokładnego dopasowania po typie daje ten sam wynik (`exact-diffs` = ta sama para), więc przyczyną jest dana w macierzy, a nie metoda dopasowania.
- Komentarz `rust-port/engine/src/domain/combat.rs:185–187` („mirrors every confirmed attack counter”) jest nieprawdziwy dla tej pary. Potwierdzone.
- Poprawka: rozpoznanie zaktualizowane (§3 R1: wynik pomiaru zamiast NIE_ZMIERZONO; §5: pozostaje pytanie, czy wpis `1` jest błędem danych, czy decyzją; to decyzja właściciela T0). Komentarz w `src/**` nie jest zmieniany w tej rundzie (zakaz allowlisty) i trafia do T1.
- Commit: patrz sekcja „Commit”.

### Zarzut 2 (ŚREDNI, opis R1 (b) teoretyczny; Bonus parsowalny?): PRZYJMUJĘ
- Dowód: przy 8 typach kanonicznych substring i dopasowanie dokładne dają tę samą odpowiedź poza parą z zarzutu 1. Źródłem rozbieżności są dane, nie dopasowanie.
- Parsowalność: wszystkie 18 wartości `Bonus` w `counters.json` mają format `±NN%` (znak `−` i `+`); skrypt nie wywołał fallbacku `COUNTER_MULT` dla żadnej pary. Potwierdzone.
- Poprawka: R1 w `ROZPOZNANIE.md` opisuje to wprost („Wariant dokładnego dopasowania … daje ten sam wynik”).

### Zarzut 3 (ŚREDNI, „sprzeczność historii” źle postawiona): PRZYJMUJĘ
- Dowód: `git show 848e77a7e --stat` → `domain/combat.rs` +279, `tests/p6_combat_melee.rs` +162. `git show 848e77a7e -- rust-port/engine/src/domain/combat.rs | grep '^[-+]pub fn'` → jedyna zmiana funkcji to `+ pub fn resolve_melee_phase` (linia 141 diffu). `pub fn resolve` nie zmieniona.
- Faza dystansowa: osobny commit `83bc866e6` („R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1 r1: port fazy dystansowej resolveCombat”), `+ pub fn resolve_ranged_phase`, też bez zmiany `resolve`.
- `git log -- rust-port/engine/src/domain/combat.rs` na `f9d5a2915`: jedynym commitem z ID COMBAT-RESOLVE-PETLA jest `848e77a7e`.
- Poprawka: §1 pkt 2 ROZPOZNANIA przepisany. Rozbieżność to treść tematu #136 („port pętli dystansu do combat::resolve”) wobec stanu kodu. Rozstrzygnięcie zostaje dla orkiestratora, ale z dowodem, nie jako „do weryfikacji”.

### Zarzut 4a (DROBNY, wiersz 39: trafienie obrońcy w linii 1170, nie 1171): ODRZUCAM
- Dowód: `git show 07d2fbd72:gra/src/game/combat.ts | grep -n 'const defHitPct'` → **linia 1171**: `const defHitPct = hitChanceTw(roundDefMelee, roundAtkObrona);`. Linia 1170 to komentarz `// Defender counter-attacks simultaneously`, bez wywołania `hitChanceTw` obrońcy. Wiersz 39 („1171”) jest poprawny. Nie zmieniano.

### Zarzut 4b (DROBNY, wiersz 42, zakres 1234–1240 uproszczony): PRZYJMUJĘ
- Dowód: `grep -n '^}'` w pinie → zamknięcie `resolveCombat` w linii **1251**; `return {` w linii 1243, `};`/`}` do 1251.
- Poprawka: wiersz 42 w tabeli zmieniony na `1234–1251 (return w 1243–1250, zamknięcie } w 1251)`. Nagłówek „resolveCombat 842–1251” również poprawiony.

### Zarzut 5 (DROBNY, ścieżki `combat.rs:N` dwuznaczne): PRZYJMUJĘ
- Dowód: `rust-port/engine/src/combat.rs` nie istnieje; istnieje `rust-port/engine/src/domain/combat.rs` oraz `rust-port/engine/tests/combat.rs`.
- Poprawka: w nagłówku `ROZPOZNANIE.md` dopisana konwencja ścieżek (`combat.rs` = `rust-port/engine/src/domain/combat.rs`, testy w `rust-port/engine/tests/*.rs`).

### Zarzut 6 (DROBNY, wiersz 3 pomija `domain/turn_economy.rs:637`): PRZYJMUJĘ
- Dowód: `grep -n 'fn apply_gold_deficit_stat_mult_to_combat_unit'` → `rust-port/engine/src/domain/turn_economy.rs:637` (`pub fn`, typ `GoldDeficitCombatStats`, komentarz „Web applyGoldDeficitStatMultToCombatUnit: mult poza (0,1) => bez zmian”) oraz `siege_tactics_inputs_unit.rs:368` (wrapper na `weaken_stats`, który wywołuje `gold_deficit_stats_mult`). Dwie implementacje o tej samej nazwie i sygnaturze wyglądającej podobnie.
- Poprawka: wiersz 3 w `ROZPOZNANIE.md` rozszerzony o duplikat z `turn_economy.rs:637`. Nie porównano semantyki bajt po bajcie (NIE_ZMIERZONO); oznaczone jako ryzyko jak R3.

### Zarzut 7 (DROBNY, brak SHA w DEPLOY/PUSH): PRZYJMUJĘ
- Poprawka: w nagłówku `ROZPOZNANIE.md` dodana linia `SHA operatora R1 (ZMIANY/COMMIT): f9d5a2915`. Odnośnie do `01-operator-r1.md` nie zmieniano pliku operatora (zachowana historia R1); SHA jest też w tym pliku.

### Zarzut 8 (INFORMACYJNY, wiersze 22, 24, 27, 28, R7/R8 NIE_ZMIERZONO; wskazanie pokrycia): PRZYJMUJĘ jako uwagę
- Dowód pokrycia (tylko wskazanie, bez czytania asercji): `git grep -l 'resolve_ranged_phase\|resolve_melee_phase' rust-port/engine/tests` zwraca `p6_combat_harness.rs`, `p6_combat_melee.rs`, `p6_ranged_damage_nan.rs`, `p6_repin_dystans_petla.rs`.
- Poprawka: dopisane w §5 `ROZPOZNANIE.md` jako wskazanie pokrycia. Wiersze 22, 24, 27, 28 nadal oznaczone NIE_ZMIERZONO (nie czytano asercji ani nie uruchomiono testów). Kryterium 1 dla pełnej gałęzi fazy dystansowej nadal nie jest spełnione i zostaje jako otwarte.

## Potwierdzone bez zmian (zgodnie z oceną Evaluatora)
- Baza `5e8b116e8` i allowlista (2 pliki dokumentacyjne), `git diff --check` czysty.
- `pub fn resolve` → `resolve_combat` (`domain/combat.rs:379` / `:319`).
- Brak produkcyjnego wołającego `resolve_ranged_phase` / `resolve_melee_phase` (tylko testy).
- `defenderTerrainDefMultOverride`: 0 trafień w `rust-port`.
- Wiersz 36 (`roundDefObrona`, martwa zmienna w pinie 1137) poprawny.

## Commit
Commit obrony: zapisany lokalnie na detached HEAD (SHA w odpowiedzi orkiestratorowi). Bez push.
