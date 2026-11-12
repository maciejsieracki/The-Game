STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2-Q1
GOAL: kompletne _singleBlow (toCombatUnit + mnozniki wejsc + rangedDamageMultFor -> BlowInput), wektory z pinu z hitPct/roll/extraMorale, test engaged_add.
ZMIANY/COMMIT: obrona na bazie c285a2a6e (kod 61de6152d). Jedyna zmiana kodu: komentarz doc w rust-port/engine/src/domain/siege_tactics_blow_inputs.rs (zarzut 4). Bez zmian logiki, bez zmian wektorow. Cargo.lock nie commitowany (usuniety). Pliki runs/** dopisane.
TESTY (ta runda, CARGO_TARGET_DIR=/tmp/claude-0/k5i2-target, CARGO_INCREMENTAL=0):
- cargo fmt --check EXIT 0
- cargo test --lib 53/53 EXIT 0
- cargo test --test p6_siege_tactics_blow 3/3 EXIT 0 (baseline przed mutacjami)
- Dowod mutacyjny (zarzut 5), kazda mutacja w src/domain/siege_tactics_blow.rs, po niej git checkout pliku:
  M1 hit_pct: charge_hit_bonus + 0.5 -> test wektory_zgodne_z_pinem FAILED (panic p6_siege_tactics_blow.rs:202, asercja hitPct)
  M2 extraMorale: MORALE_FLANK_HIT + 1.0 -> FAILED (panic :214, asercja extraMorale)
  M3 engaged_add: false na galezi trafienia -> FAILED (panic :221, asercja engaged_add)
  Po revercie drzewo czyste (git status bez zmian w src).
- Nie odtwarzano: pelne bramki (clippy, pozostale testy end/breach/endcheck/walk) — zmiana tylko komentarzem, nie ruszono kodu wykonywalnego.
BLOKADY: kryterium 1 (zarzut 1) NIESPELNIONE. Kryterium 2 (zarzut 2) NIESPELNIONE. Zarzut 3 przyjety: helpery nieuzywane.
RUNDY: 2/5 (obrona Operatora po FAIL Evaluatora, runda 1)
NASTEPNY KROK: Evaluator r2 ocenia obrone. Rekomendacja orkiestratora: podzielic temat (zob. ponizej), bo kryterium 1 nie da sie domknac w jednej rundzie bez przekroczenia zakresu.
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

### Zarzut 1 — kryterium 1 niespelnione (kompletny _singleBlow z jednostek i otoczenia)
PRZYJMUJĘ. Zarzut zgodny z faktami: brak toCombatUnit, relativeHit, terrainDefenseMultiplier, cityGatedTerrainMultiplier, wallDefenseMult, isFordTile/isShoreAdjacentToFord, battleUnitDifficultyCombatMult oraz zlozenia defFinalObrona / atkMelee / roundAtkCharge / ctrAtkVsDef.
Poprawki w tej rundzie NIE wykonano. Powod: zakres pinu (battleScene.ts:385, :1355, :8809-8957 i powiazane helpery terenu/fortyfikacji/brodu) przekracza jedna runde obrony razem z wektorami z wykonania pinu i dowodem. Nie zamykam kryterium na slowo.
Propozycja podzialu (do decyzji orkiestratora):
- K5I2a: toCombatUnit + mnozniki pozycji/terenu/fortyfikacji/wall/brodu jako czyste funkcje z jawnymi wejsciami; wektory z wykonania pinu; testy porownujace z wartosciami pinu.
- K5I2b: zlozenie BlowInput (defFinalObrona, atkMelee, roundAtkCharge, ctrAtkVsDef) z K5I2a + rangedDamageMultFor; wektory end-to-end (jednostki + otoczenie -> wynik).
Status: BLOCK do czasu podzialu.

### Zarzut 2 — rangedDamageMultFor nie podpiety do BlowInput
PRZYJMUJĘ. Potwierdzam: ranged_class_mult przychodzi gotowy z wektora, a generator stubuje rangedDamageMultFor jako () => input.rangedClassMult. Istniejacy port unit_power::ranged_damage_mult_for nie jest wolany z zadnego miejsca skladajacego BlowInput. Naprawa zalezy od zarzutu 1 (wejscie z jednostki i otoczenia), wiec przeniesiona do K5I2b.

### Zarzut 3 — siege_tactics_blow_inputs.rs to martwy kod
PRZYJMUJĘ. Helpery flank_rear_defense_penalty, terrain_river_attack_multiplier, field_fortify_defense_bonus nie maja wolajacego poza modulem i testami jednostkowymi z recznie wpisanymi wartosciami. Nie sa jeszcze uzyte przez single_blow ani przez test wektorowy. Podpiecie wymaga zlozenia z zarzutu 1 (K5I2a/K5I2b).

### Zarzut 4 — wiernosc helperow wzgledem pinu nie dowiedziona
CZESCIOWO PRZYJMUJĘ, CZESCIOWO ODRZUCAM.
- Przyjete: pin (combat.ts:589-605) obsluguje tekst (parseFloat), '' i '---'; Rust przyjmuje tylko Option<f64>. Normalizacja tego pola nalezy do toCombatUnit, ktorego nie ma w porcie. Poprawka: komentarz doc w siege_tactics_blow_inputs.rs wprost to opisuje (zakres helpera = wejscie juz znormalizowane). Commit defensywny w tej rundzie.
- Przyjete: dopasowanie nazwy terenu (normTerrain, includes 'rzek'/'river', pusty teren) nie jest portowane i nie jest testowane. Zostaje w zakresie K5I2a.
- Odrzucone: zarzut, ze doc myli nazwe parametru defenderTerrain z kaflem atakujacego. Dowod: grep -n 'defenderTerrain\|atkTerrain' w siege_tactics_blow_inputs.rs i siege_tactics_blow.rs daje zero trafien (exit 1). W c285a2a6e takiego komentarza nie ma. Doc terrain_river_attack_multiplier mowi o kaflu atakujacego.

### Zarzut 5 — brak weryfikacji mutacyjnej
PRZYJMUJĘ i NAPRAWIONO DOWODEM. Trzy mutacje (M1 hit_pct, M2 extraMorale, M3 engaged_add w galezi trafienia) wywalaja test wektorowy. Wyniki i linie asercji w sekcji TESTY. Zrodla zmian odwrocone git checkout; drzewo czyste.

### Zarzut 6 — zrodlo hitPct/roll/extraMorale to instrumentacja stubu
CZESCIOWO PRZYJMUJĘ, CZESCIOWO ODRZUCAM.
- Odrzucone dla hitPct: wartosc pochodzi z hitChanceSpy, czyli ze spy na funkcje hitChance wywolywana przez kod pinu. To obserwacja wywolania pinu, nie obliczenie po stronie Rust. Nie jest tautologia.
- Przyjete dla roll: roll = r01*100 jest wejsciem RNG z definicji, wiec samo porownanie roll z r01*100 jest tautologiczne. Wartosciowa czesc testu to decyzja missed (roll >= hitPct) i zgodnosc z pinem, ktore sa sprawdzane.
- Przyjete dla extraMorale = 0 na pudle: wartosc wynika z kolejnosci w pinie (pudlo wychodzi przed liczeniem extraMorale). NIE_ZMIERZONO: tej kolejnosci nie potwierdzono cytatem z battleScene.ts w tej rundzie. Do weryfikacji w K5I2a.

### Zarzut 7 — test engaged_add slaby
CZESCIOWO PRZYJMUJĘ, CZESCIOWO ODRZUCAM.
- Odrzucone: zarzut ze asercja nie wykrywa bledu w galezi trafienia. Dowod: mutacja M3 (engaged_add: false przy trafieniu) wywala test (panic :221). Asercja dziala.
- Przyjete: asercja `engagedKeyAfter == !ranged || engagedBefore` jest po stronie Rust kopia wyrazenia, a nie obserwacja Set.add z pinu. Generator nie instrumentuje wywolania this.engaged.add. Nie naprawiono w tej rundzie (wymaga instrumentacji w p6_siege_tactics_blow_gen.mjs). Dlug do K5I2a.
- Dla lepszego pokrycia galezi pudla: out.engaged_add == !ranged zostaje w rundzie i jest zgodne z pinem (add przed rzutem, battleScene.ts:8899), ale NIE_ZMIERZONO dla galezi pudla osobnym dowodem mutacyjnym.

## Podsumowanie
- Kryterium 1: NIESPELNIONE (zarzut 1 przyjety, poprawka przeniesiona do podzialu).
- Kryterium 2: NIESPELNIONE (zarzut 2 przyjety).
- Kryterium 3 (testy K5I bez oslabien): spelnione, bez zmian asercji.
- Kryterium 4 (bramki zielone): fmt, lib 53/53, blow 3/3 zielone po zmianie komentarza.
- Push/integracja/deploy: NIE WYKONANO.
