STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A4-Q1
GOAL: odpowiedź Operatora na zarzuty 1–6 wobec kodu 2f8b69ccd (klocek K5i-2a4: toCombatUnit + combatUnitFromDef + applyVeteranFrac/applyArmyHunger/applyGoldDeficit)
ZMIANY/COMMIT: kod Rust bez zmian (kod 2f8b69ccd). Zmiany w tym commicie: rename raportu 01-operator-r4.md -> 01-operator-r1.md (zarzut 4), korekta pola RUNDY (1/5), uzupełnienie raportu o pełną listę rozbieżności units.json (zarzut 5), ten plik. Gałąź obrony: rust-port-wip/SIEGE-TAKTYKA-K5I2A4-obrona (od f6f49894f). SHA commitu obrony: podany w odpowiedzi orkiestratorowi.
TESTY: nie uruchamiano ponownie (commit nie zmienia kodu Rust ani testów). Bramki z 01-operator-r1.md (kod 2f8b69ccd, EXIT=0) nie były re-run w tej rundzie: NIE_ZMIERZONO w tej rundzie.
BLOKADY: brak
RUNDY: 1/5 (obrona na 01-operator-r1.md, kod 2f8b69ccd)
NASTĘPNY KROK: Evaluator (ponowna ocena po obronie)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1. Test kompozycji porównuje dwa wywołania rustowego single_blow, nie z _singleBlow z pinu — ODRZUCAM zarzut jako wadę; opis faktu PRZYJMUJĘ
Fakty (przyjęte): `rust-port/engine/tests/p6_siege_tactics_inputs_unit.rs` (blok ~l. 607–639) wywołuje `single_blow` dwa razy: dla `CombatUnitModel` zbudowanego z Rust i dla modelu z wartości pinu. Nie ma w tym teście wywołania semantyki `_singleBlow` z pinu. Test dowodzi zgodności pól modelu zasilających `BlowInput`, a nie semantyki ciosu.
Dlaczego to nie jest wada klocka:
- Dispatch, kryterium (2): "wynik zgodny ze strukturą CombatUnit rdzenia K5I (test kompozycji: CombatUnit → single_blow na wektorach)". Test realizuje dokładnie tę definicję: kompozycja CombatUnit → BlowInput → single_blow, 1640 wywołań (820 trafień), identyczny wynik dla obu modeli.
- Składanie realnego BlowInput z pinu (wejścia `_singleBlow`) jest zakresem K5I2b (dispatch: "Składanie realnego BlowInput ... należy do K5I2b"; zadanie #83). Stałe w `blow_from_cu` (l. 175–184: `atk_shoot_acc: 0.0`, `def_final_obrona: 10.0`) są celowo stałymi testu i nie dotykają funkcji portowanych w tym klocku (toCombatUnit i zależności).
- NIE_ZMIERZONO: pin-side `single_blow` nie był wykonywany w tej rundzie; tej luki nie zamykam w tym temacie.

### Z2. Brak wołającego produkcyjnego poza testami — ODRZUCAM (zgodne z dispatchem)
Dowody:
- Dispatch: "Każda funkcja ma wołającego w teście wektorowym" oraz "klocek czysty"; wołający produkcyjny jest zadaniem K5I2b / K5-LOOP (zadania #83, #91 w planie).
- Funkcje są `pub fn` w `pub mod siege_tactics_inputs_unit` (`rust-port/engine/src/domain/mod.rs:104`), więc rustc/clippy nie zgłaszają martwego kodu; `clippy --all-targets -D warnings` przechodzi (EXIT=0 w 01-operator-r1.md).
- Wołający w teście: `kazda_jednostka_pinu_ma_wywolanie_to_combat_unit` (l. 731) oraz wektory `wektory_zgodne_z_pinem_i_pokrycie_galezi` (l. 288).

### Z3. UVal::Bool w polu liczbowym liczony jako 1/0, nie wg semantyki JS — ODRZUCAM (brak wpływu na wektory i dane)
Dowody:
- Sprawdzone: `gra/data/units.json` @07d2fbd72 ma 0 pól logicznych (skrypt node: `typeof v === "boolean"`, 75 jednostek, 0 trafień). Ścieżka `UVal::Bool` w polu liczbowym nie jest osiągalna z danych pinu, więc wektory jej nie dotykają.
- Semantyka: w JS `Number(true)=1`, `Number(false)=0`, więc mapowanie 1/0 zgadza się z koercją arytmetyczną. Reprezentacja tekstowa (`js_to_string`, l. 55) zwraca "true"/"false", zgodnie z JS.
- NIE_ZMIERZONO: nie przeglądałem każdej gałęzi pinu pod kątem porównań ścisłych (`===`) na wartościach logicznych z units.json; w danych pinu takie wartości nie występują, więc nie ma ścieżki do przetestowania.
- Pole `unbreakable` nie jest ustawiane przez `combatUnitFromDef` w pinie (`combat.ts:194–234`), więc jego pominięcie jest zgodne z pinem.

### Z4. Raport nazwany 01-operator-r4.md, dispatch mówił r1; uzasadnienie co do BTERRAIN_* — PRZYJMUJĘ (poprawka w tym commicie)
- Rename: `01-operator-r4.md` -> `01-operator-r1.md` (git mv). Pole RUNDY poprawione z "4/5" na "1/5".
- Uzasadnienie BTERRAIN_* (a1 nie definiuje kodów kafli, kolizji nie ma) — przyjęte jako poprawne; grep: stałe są tylko w `siege_tactics_inputs_pos.rs`. Pliki `siege_tactics_inputs_pos.rs` i `siege_tactics_blow_inputs.rs` nie zmieniane.

### Z5. Raport nie wypisuje rozbieżności units.json Rust vs pin (dispatch kazał wypisać); operator nie czytał engine/data — PRZYJMUJĘ (uzupełnione w raporcie)
Rozbieżności wypisane w `01-operator-r1.md` (sekcja „Uzupełnienie po zarzucie 5"). Porównanie: `gra/data/units.json` @07d2fbd72 vs `rust-port/engine/data/units.json` @2f8b69ccd, 75 vs 75 jednostek, dopasowanie po `Nazwa EN`, zbiory nazw identyczne. Łącznie 71 różnic pól:
- Liczbowe bojowe (Phalanx): Atak 7/6, Obrona 12/10, Przebicie 4/2, Bonus vs Spearman % 30/0, meleeAttack 7/5, meleeDefence 12/10, piercing 4/2 (pin/Rust).
- Epoka: Horseman i Chinese Cavalry — pin „Żelazo”, Rust „Brąz”.
- fieldPower (pochodne): 9 wierszy (Phalanx, Slinger, Slinger (Huaraca), Archer, Egyptian/Nubian/Sumerian/Akkadian/Assyrian Archer).
- Tekstowe/meta: Tech 27, Zastąp specjalnie 21, Top3 3, Historia 2.
Decyzja gameplay (zadanie 27) pozostaje otwarta i nie jest rozstrzygana w tym temacie. Wektory używają wyłącznie danych pinu. Dla kolejnych klocków (K5I2b / K5-LOOP) wołający produkcyjny nie może czytać Rust `units.json` dla Phalanxa i dwóch kawalerii, dopóki zadanie 27 nie zostanie rozstrzygnięte.

### Z6. Wektory pomijają pola Historia, Opis i Top3 z units.json — ODRZUCAM (zarzut bez wpływu na funkcje portu)
Dowody (grep w pinie, katalogi `gra/src/battle`, `gra/src/game`, `gra/src/data`):
- Brak odczytu `Top3` i pola `Historia` jednostki w ścieżkach toCombatUnit / combatUnitFromDef / applyXxxToCombatUnit / unitRowStat / combatStatField. Trafienia `Historia` w `gra/src/game/economy-upkeep.ts` i `terrain-improvements.ts` to komentarze, a `Opis` w `gra/src/game/diplomacy-audience-actions.ts:62,91` dotyczy wierszy dyplomacji, nie jednostek.
- Po stronie Rust `Top3`/`Historia` są w strukturach `data/buildings_tech.rs` (budynki/technologie), nie w ścieżce bojowej portu.
- Pominięcie jest zgodne z tym, co funkcje czytają; ewentualne ich użycie w przyszłości obejmie osobny klocek.

## Stan po obronie
- Kod K5I2a4 (2f8b69ccd) nie zmieniony.
- Przyjęte: Z4 (rename raportu, RUNDY), Z5 (lista rozbieżności w raporcie). Opis faktu z Z1 przyjęty, zarzut o wadę odrzucony.
- Odrzucone: Z1 (jako wada), Z2, Z3, Z6 (dowody powyżej).
- NIE_ZMIERZONO w tej rundzie: ponowne bramki Rust; pin-side `single_blow`; porównania ścisłe na wartościach logicznych w pinie.
