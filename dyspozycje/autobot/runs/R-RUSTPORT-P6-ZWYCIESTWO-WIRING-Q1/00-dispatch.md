# DISPATCH R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (runda 1)

TEMAT: ZWYCIESTWO-WIRING (P6.19-C): wpięcie końca gry do stanu i pętli tury
DOMENA: GAME (implementacja). BAZA: `0ca58770e` (czubek `origin/rust-port/parity-v2`, pełny test 3284/0/1). Worktree na `wip/R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1`. Przed startem: `git checkout --detach 0ca58770e`.
Pin (tylko odczyt): `git show 07d2fbd72:<ścieżka>`.

## GOAL
Wpiąć moduł `victory.rs` (ZWYCIESTWO-IMPL, już na parity) do stanu gry i pętli tury: (a) flaga końca gry i `graczKiedysMialMiasto` w `PlayableState` (`playable.rs`), pole z `serde(default)`; (b) wywołanie `checkVictory` po turze tylko dla gracza 0 (pin `main.ts:43466-43483`); (c) odrzucanie komend po końcu gry (pin `main.ts:37997, 38043, 43827`); (d) resety przy nowej grze i wczytaniu (pin `main.ts:45160, 45431, 45686, 45920, 47333`); (e) ustawianie `graczKiedysMialMiasto` tam, gdzie pin to robi (`main.ts:16508, 17816, 36218, 45646, 45877-45878`, odczyt `43472`). Heurystyka odtwarzania z miast (`main.ts:46368-46370`) zostaje WYŁĄCZNIE jako ścieżka zgodności dla starych zapisów bez pola. Parytet z wersją webową: wdrażamy 1:1 wg pina `07d2fbd72` (`gra/src`). Nie zmieniać zachowania poza pinem. Odstępstwo od pina = FAIL. Decyzje orkiestratora: nauka nieosiągalna przy `NAUKA_WYMAGA_RAKIETY=true` (pin nigdy nie ustawia rakiety); UI ekranu zwycięstwa i hooki testowe poza zakresem.

## ALLOWLISTA
- `rust-port/engine/src/domain/playable.rs (pole flagi, odczyt/zapis, reset)`
- `rust-port/engine/src/domain/victory.rs (tylko jeśli potrzeba dostępu z pętli)`
- `rust-port/engine/src/domain/turn*.rs (wywołanie check po turze i odrzucanie komend po końcu gry — wskazać dokładny plik w raporcie)`
- `rust-port/engine/src/domain/save_load.rs (pole flagi z serde default, bez zmiany migracji)`
- `rust-port/engine/tests/p6_victory_wiring*.rs (NOWE)`
- `rust-port/engine/tests/p6_victory_wiring_gen.mjs (NOWY, wykonuje tekst pina)`
- `rust-port/engine/tests/p6_victory_wiring_vectors/** (NOWE)`
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: gra/**, Cargo.toml, Cargo.lock, push do parity, UI, hooki testowe, osłabianie asercji, #[ignore]. Zmiany poza wymienionymi plikami = FAIL.

## KRYTERIA KOŃCA
1) Wektory z pina (generator wykonuje tekst pina; SHA fragmentu w teście): scenariusze zwycięstwa dominacji, przegranej po eliminacji, odrzucenia komendy po końcu gry, reset po nowej grze. 2) Test: po końcu gry komenda jest odrzucana, zanim zmieni stan. 3) fmt, `clippy --all-targets -D warnings`, `cargo test --lib`, nowe testy zielone z kodami wyjścia. 4) Pełny `cargo test --no-fail-fast` przed FC: 0 failed.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Commit BEZ linii `Co-Authored-By` z nazwą modelu (CLAUDE.md), z `Claude-Session`. Pełna bramka przed commitem. RUNDY: 1/5.

---

## DODATEK r2 (po FC FAIL r1, 13.11)

**BAZA r2: `b3fcba586`** (kod operatora `52385c502` + dokument; potomek `0ca58770e`). Pierwszy krok: `git checkout --detach b3fcba586`. Świeże uruchomienie (bez cache r1).

### Przyczyna FAIL r1
1. Brak wektorów z pina (kryterium 1): testy wiringu są pisane ręcznie, bez generatora wykonującego pin.
2. Flaga `graczKiedysMialMiasto` ma `#[serde(skip)]` — po wczytaniu gracz bez miast traci przegraną. To odstępstwo od pina.
3. Brak wpięcia: ustawianie flagi przy zakładaniu/przejęciu miasta (pin `main.ts:16508, 17816, 36218, 45646, 45877-8`), druga ścieżka przegranej po utracie miasta (`main.ts:34018-34025`), reset przy wczytaniu (`main.ts:47333`).
4. Brak testu przegranej po eliminacji i test resetu był tautologiczny.

### Decyzje orkiestratora (parytet z pinem, bez pytania do właściciela)
- **Zapis flagi:** sprawdzić w pinie `gra/src/save.ts` (grep `graczKiedysMialMiasto`), czy pin serializuje to pole.
  - Jeśli TAK: odwzorować w Rust zapis (pole w kopercie zapisu). Jeśli golden `p6_unit_replace_l3_state` zmienia się wyłącznie przez to pole — rozszerzyć allowlistę o ten golden i zaktualizować go **tylko** o pole z pina.
  - Jeśli NIE: zostawić odtwarzanie heurystyką pina (`main.ts:46368-46370`) na wczytaniu, bez `serde(skip)` na polu używanym do oceny; usunąć martwy `Option`.
- **Allowlista r2 rozszerzona** o miejsca tworzenia i przejęcia miast w Rust (moduły, w których pin ustawia flagę) — tylko ustawianie flagi, bez zmiany innego zachowania.
- **Druga ścieżka przegranej** (`main.ts:34018-34025`) — wpiąć.

### Wymagania (kryteria r2)
1. **Generator** `rust-port/engine/tests/p6_victory_wiring_gen.mjs` wykonujący tekst pina (`checkVictory`, odrzucanie komend, reset, ścieżka utraty miasta), wektory w `p6_victory_wiring_vectors/**`, SHA fragmentu pina w teście. Asercje ręczne nie liczą się jako kryterium 1.
2. Testy: przegrana po eliminacji; przegrana po utracie wszystkich miast; wczytanie zapisu po zakończonej grze; zakładanie miasta w turze i utrata w tej samej turze (flaga ustawiona).
3. Potęgi: zbiory `potegiWszystkich` (pin `43448-43452`) porównać wektorem z `power_raw` — dopasować, jeśli się różnią.
4. `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, nowe testy — kody wyjścia.
5. **Pełny `cargo test --no-fail-fast`: 0 failed** (kod wyjścia w raporcie). Przy timeoucie narzędzia — w tle i odczyt logu.

### Zakazy
Bez osłabiania asercji, bez `#[ignore]`, bez usuwania testów. Zmiany spoza wskazanej allowlisty = FAIL, o ile nie są wymagane przez decyzje powyżej (wtedy opisać w raporcie).

### Gate dyskowy
Start dopiero przy ≥ 8 GB wolnego.
