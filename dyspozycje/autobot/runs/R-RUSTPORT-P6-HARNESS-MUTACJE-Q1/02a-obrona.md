STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-HARNESS-MUTACJE-Q1
GOAL: Odpowiedz na 4 zarzuty Evaluatora (runda 1/5) do skryptu mutacyjnego ranged_phase; poprawki tylko w allowliscie (rust-port/engine/tests/p6_harness_mutacje.sh).
ZMIANY/COMMIT: baza 0a1f1b40a (commit Operatora), branch wf/R-RUSTPORT-P6-HARNESS-MUTACJE-Q1-defense-r1. Zmiana: skrypt p6_harness_mutacje.sh (guard niepelnej zamiany M2: funkcja armor_counts + flaga ARM_SWAP_OK) + ten plik. Commit: SHA w sekcji DEPLOY/PUSH ponizej. Allowlista zachowana (2 pliki w katalogu runs + skrypt). Cargo.lock nie commitowany. Nie pushowano.
TESTY: bash -n skryptu: PASS. Izolowany test guardu (kopia combat.rs z bazy cf281d785, mutacja M2 podawana bez cargo):
  - pelna zamiana: przed ATK/DEF = 1/1, po = 1/1, ARM_SWAP_OK=1 (PASS);
  - czesciowa (usunieto wystapienie attacker.armor, z linii 1223 pliku): przed = 0/1, po = 1/0, ARM_SWAP_OK=0 (BLAD, zamiast falszywego zabicia).
  NIE_ZMIERZONO: pelny przebieg cargo po zmianie (fmt/clippy/cargo test/p6_combat_harness oraz skrypt end-to-end). Zmiana dotyczy tylko logiki skryptu bash poza kodem produkcyjnym; wynik skryptu dla M1, M3, M4 nie ulega zmianie, a M2 dla pelnej zamiany daje ten sam mutant co w 01-operator-r1.md. Weryfikacja end-to-end do powtorzenia przez Evaluatora r2.
BLOKADY: M4 przezyl (zarzut 1) - luka wektorow, poprawka poza allowlista (patrz nizej).
RUNDY: 1/5 (Operator, obrona)
NASTEPNY KROK: Evaluator r2 - ponowny przebieg skryptu (bramki cargo) na commicie obrony; M4 zostaje jako znany przezyty mutant do COMBAT-HARNESS r2.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. M4 (zaokraglenie HP) przezyl - PRZYJMUJE (luka potwierdzona, poprawka poza allowlista)
- Dowod: `rust-port/engine/tests/p6_combat_harness_vectors/vectors.json` (w cf281d785) ma 1113 pol `damage` i 0 niecalkowitych skonczonych wartosci. Liczba 0..5 z zarzutu jest NIEDOKLADNA: wystepuja tez m.in. 22, 5.479601514525711e+306, `Infinity` i NaN. Zadna wartosc nie jest ulamkowa, wiec `.round()` jest tozsamosciowe na wszystkich wektorach i mutant M4 przezyje zgodnie z oczekiwaniem. Wniosek zarzutu (luka wektorow) jest prawdziwy; uzasadnienie liczbowe trzeba poprawic.
- Poprawka (wektory z ulamkowym `damage_exact`, zmiana generatora z pinu) wymaga zmian w `rust-port/engine/tests/p6_combat_harness_vectors/` i w tescie - poza allowlista tej rundy. Odlozona do COMBAT-HARNESS r2. Brak commita poprawki.

### 2. M2 (odwrocenie klucza) to interpretacja - PRZYJMUJE (zakres opisu), mutacja realna
- Przyjmuje sie, ze "odwrocenie klucza" jest interpretacja Operatora (dispatch jej nie precyzuje). Inne interpretacje (np. klucz RNG): NIE_ZMIERZONO.
- Dowod realnosci: w zakresie `ranged_phase` (base cf281d785, plik combat.rs) wystepuje dokladnie 1 `defender.armor,` (linia 1190, wymiana strzalu) i 1 `attacker.armor,` (linia 1223, kontrastrzal). M2 zamienia OBIE. Opis M2 w 01-operator-r1.md mowi o "strzale"; precyzyjnie to zamiana pancerza w strzale i w kontrastrzale. Zakres zostal doprecyzowany w tej odpowiedzi, nie w kodzie.
- Zabicie M2 (HARNESS=FAIL) przyjete z raportu Evaluatora; nie powtarzane tutaj (NIE_ZMIERZONO w tej rundzie).

### 3. Mutacje to sed na dopasowaniu tekstu - PRZYJMUJE CZESCIOWO (poprawka), ODRZUCAM zalozenie o calkowitym braku wykrycia
- ODRZUCAM w czesci dot. calkowitego braku zmiany: wszystkie wzorce wystepuja w zakresie (liczniki: `defender.armor,` 1; `attacker.armor,` 1; `let hit = roll < hit_pct;` 2; `if total_rounds > max_rounds {` 1; `hp -= damage_exact;` 2), wiec sed je trafia. Gdy sed nic nie zmieni, `cmp -s` (linia 119 skryptu) daje BLAD - to dziala.
- PRZYJMUJE w czesci dot. luki: `cmp` nie wykrywa CZESCIOWEGO zastosowania M2 (np. brak jednego wystapienia). Wtedy wymiana jest jednostronna i harness mogl by dac falszywe zabicie. Pokazane izolowanym testem: w pierwszej wersji guardu (porownanie licznikow przed/po) wariant czesciowy (przed 0/1, po 1/0) PRZECHODZIL - blad mojego guardu, wykryty w tescie.
- Poprawka (commit): guard wymaga oczekiwanego ksztaltu 1/1 przed i 1/1 po zamianie; w przeciwnym razie `BLAD: mutacja M2 niepelna`, combat.rs przywracany, mutant nie liczony jako zabity ani przezyty. Test: pelna 1/1->1/1 = PASS; czesciowa 0/1->1/0 = BLAD.
- Uwaga (NIE_ZMIERZONO): M1 i M4 zmieniaja obie wystapienia (`let hit = roll < hit_pct;` w strzale i kontrastrzale; `hp -= damage_exact;` dwa razy). To zakres szerszy niz "strzal", zgodny z tekstem skryptu; nie zmieniane w tej rundzie.

### 4. Allowlista zachowana - PRZYJMUJE (potwierdzone)
- Dowod: `git show --stat 0a1f1b40a`: 2 pliki zmienione, 179 insercji, 0 usuniec: `01-operator-r1.md` i `rust-port/engine/tests/p6_harness_mutacje.sh`. Brak zmian w combat.rs, gra/, data/, Cargo.toml, Cargo.lock.
- Brak #[ignore] i brak zmian asercji (commit nie dotyka plikow testow). Zaleznosc od W8: NIE_ZMIERZONO w tej rundzie.
