STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B2-Q1
GOAL: Obrona Operatora (runda r2) na zarzuty Evaluatora r2 (02-evaluator-r2.md, commit e100c5794). Baza: ef8eeedc9; kod r2: 220b022cd; gałąź obrony: wip/R-RUSTPORT-P6-WIEZE-2B2-Q2-obrona (bez push).
ZMIANY/COMMIT: rust-port/engine/src/domain/siege_tactics_loop.rs (refaktor pomocników strzału wieży, zachowanie bez zmian), rust-port/engine/tests/p6_wieze_2b2.rs, rust-port/engine/tests/p6_wieze_2b2_gen.mjs, rust-port/engine/tests/p6_wieze_2b2_vectors/vectors.json (regeneracja), dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-2B2-Q1/02a-obrona.md. Cargo.lock NIE commitowany (untracked). gra/ nietknięte. SHA: patrz pole sha w odpowiedzi.
TESTY:
- cargo test --test p6_wieze_2b2: 12/12 ok (EXIT 0).
- Pełny cargo test --no-fail-fast (bez filtra): EXIT 0, suma passed=3380 failed=0 ignored=1 (log: scratchpad/fulltest-r2-obrona.log). Uwaga: pełny run wystartował przed korektą formatowania (rustfmt tests/p6_wieze_2b2.rs, tylko białe znaki).
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo fmt --check: EXIT 0 (po rustfmt na tests/p6_wieze_2b2.rs).
- Mutacje czerwone (EXIT 101 każda, kod produkcyjny przywracany po każdej):
  M1 szablon neutralny zamiast wiersza city_towers (tower_shot_from_row -> neutral): FAIL tower_shot_uses_shooter_row_from_city_towers, tower_setup_shooter_comes_from_city_towers_row.
  M2 opóźnienie trafienia 0 zamiast TOWER_FLY_MS: FAIL tower_hit_lands_after_tower_fly_ms, tower_fire_matches_pin_vectors.
  M3 zniszczona wieża strzela (usunięty guard wall_tile_rows): FAIL destroyed_tower_does_not_shoot, tower_fire_matches_pin_vectors.
- Generator odtwarza wektory: 240 przypadków, 105 strzałów (counts bez zmian), SHA-256 fragmentów pina beeb83309... zgodny.

## Odpowiedzi na zarzuty

1. Wejście do single_blow_full nie asertowane względem wektorów pina (expectStats, expectKategoria, expectRanged) -- PRZYJMUJĘ (naprawiono).
   Poprawka: (a) generator losuje jeden z 4 kształtów wiersza strzelca (cyklicznie, różne Typ/Health/health/brak Typu); (b) test pina buduje szablon ciosu z WIERSZA każdego przypadku (tower_shot_from_row), a nie ze stałego szablonu; (c) asercje na każdym strzale z wektora: tower_shooter_kategoria == expectKategoria, tower_shooter_hp == expectHp, tmpl.attacker.typ_nazwa == expectStats.Jednostka, tmpl.ranged == expectRanged (tmpl = szablon wchodzący do tower_blow_on_target, przed wymuszeniem ranged=true w tej funkcji).
   Przy okazji: generator dotąd używał stałej hp=10 w wywołaniu _fireOneTower. Pin liczy hp w _fireSiegeTowers (battleScene.ts:4212-4213): Number(Health ?? health ?? 1) || 1. Generator liczy teraz to samo wyrażenie. Stare expectHp (brak w pliku) byłoby fałszywe, więc to poprawka mojej poprzedniej rundy.

2. Asercja opóźnienia 380 ms jest tautologią (stała generatora vs stała Rust) -- PRZYJMUJĘ (naprawiono).
   Poprawka: opóźnienie mierzone w kolejce zegara, nie porównaniem stałych. Po pierwszym kroku przewijania (resume(.., 1)) wystrzał jest wykonany i TowerHit siedzi w clock.timers; asercja: due - now == opóźnienie. Test pina porównuje to z expectDelayMs z wektora. Mutacja M2 (delay 0) to wyłapuje.
   Fakt zmierzony przy okazji (nie ukryty): pierwszy krok przewijania przesuwa zegar do 16 ms i wystrzał następuje w tej klatce, więc due = 396 (16 + 380). Porównujemy więc opóźnienie od wystrzału, a nie od t=0. Trafienie stosowane przez pętlę po przewinięciu wypadło w klatce 400 ms (pomiar sondą): kwantyzacja klatek przewijania, nie błąd opóźnienia. Testy tego czasu nie asertują (NIE_ZMIERZONO jako kryterium czasu stosowania).

3. tower_setup_from_units nie ma wołającego w produkcji -- PRZYJMUJĘ (dług, NIE naprawiono w tej rundzie).
   Dowód: `grep` po src/ i tests/ pokazuje wołania wyłącznie w testach. Pin: `_fireSiegeTowers` ustawia towerShooterRow i towerRange (battleScene.ts:4167-4168) i tylko stąd startuje strzelanie wież. Podpięcie = temat K5-LOOP-WIRING (#113) i TOWER-TARGET/K5-LOOP-WIEZE-R2 (#116, #146).
   Wpis do rejestru musi dodać orkiestrator (REJESTR poza allowlistą Operatora). Proponowany wpis: `wieza-setup-wiring` -- tower_setup_from_units/tower_shot_from_row wpiąć w produkcyjne składanie SiegeEnv (pin battleScene.ts:4167-4168, 4212-4213); zależy od #113. Status: NIE zrobione.

4. Mapowanie Typ -> kategoria oraz hp = Health/health/1 nie są testowane względem pina -- PRZYJMUJĘ CZĘŚCIOWO.
   Zrobione: kategoria i HP z wektorów pina (4 kształty wierszy, 105 strzałów), również w tower_setup_shooter_comes_from_city_towers_row (pin_kategoria/pin_hp na 304 wierszach city_towers, pin_kategoria = String(Typ ?? 'Distance'), pin_hp = Number(Health ?? health ?? 1) || 1).
   NIE zrobione (dług, zmierzony rozjazd): Health jako napis. Pin: Number("10") = 10; Rust tower_shooter_hp: as_f64() na napisie = None -> 1. Różnica tylko dla napisowego Health/health; w wektorach pina nie występuje, w arkuszach jednostek nie zweryfikowano. Poprawka (r3): obsłużyć napisy jak JS Number (trim, pusty = 0, nie-liczba = NaN -> 1) w tower_shooter_hp i pin_hp, plus wektor z napisem. Status: NIE zrobione.

5. Czerwony przed zmianą to EXIT 101 z braku symbolu (czerwień kompilacyjna) -- PRZYJMUJĘ, z częściowym dowodem behawioralnym.
   Baza ef8eeedc9 nie ma tower_setup_from_units ani LoopTimer::TowerHit, więc prawdziwy czerwony przed zmianą byłby kompilacyjny. Dla czerwieni behawioralnej wykonano mutacje M1-M3 na kodzie r2 (tabela w TESTY). M1 odtwarza stan sprzed zmiany (strzelec z szablonu neutralnego). Pełnego czerwonego na bazie z tymczasowym stubem nie zrobiono (NIE_ZMIERZONO).

6. Pełny cargo test przerwany timeoutem 585 s -- PRZYJMUJĘ (naprawiono w zakresie weryfikacji).
   Pełny run z --no-fail-fast, bez filtra, w tle: EXIT 0, passed=3380 failed=0 ignored=1. Pozostałe bramki: clippy -D warnings EXIT 0, fmt --check EXIT 0. Zgodnie z dispatchem: CARGO_TARGET_DIR poza repo (scratchpad/tgt), usunięty po bramkach.

7. Pozycje z Evaluatora: destroyed proxy, hit_arc, first_blow, _resolveBlowOutcome, Cargo.lock -- ZAPIS, bez zarzutu do odpowiedzi: pozycja 7 Evaluatora to potwierdzenie zgodności (allowlista zachowana, brak #[ignore], brak osłabionych asercji). Bez zmian.

## Zmiana kodu produkcyjnego (jedyna, bez zmiany zachowania)
siege_tactics_loop.rs: tower_setup_from_units wyodrębnia pomocniki pub tower_shooter_kategoria, tower_shooter_hp, tower_shot_from_row (ten sam kod, ta sama wartość). Powód: bez tego kategoria/HP nie są obserwowalne przez publiczne API (zarzut 1, 4).

## Blokady (bez zmian względem r2, plus korekty)
(a) wynik liczbowy ciosu wieży z pina nie zweryfikowany (tylko parametry wejścia do single_blow_full); (b) hit_arc stałe Front (dług K5LOOP-FACING #107/#178); (c) first_blow_of_pair stałe true (ten sam dług); (d) efekty _resolveBlowOutcome nie portowane (#109/#147); (e) mody atakującego nie portowane; (f) Health jako napis: rozjazd zmierzony, NIE zrobione (pkt 4); (g) moment stosowania trafienia w klatce przewijania (400 ms w sondzie) nie asertowany; (h) destroyed jako proxy wall_tile_rows (dowód z pina w r1, przyjęte); (i) guard finished w planowaniu vs w tower_shoot (obserwowalnie równoważne); (j) wiring produkcyjny tower_setup (pkt 3).

NASTĘPNY KROK: Evaluator r3 na commicie obrony (pkt 1, 2, 4 częściowo, 5, 6). Orkiestrator: dopisać do REJESTR-RUST wpisy z pkt 3 i pkt 4(f).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na wip/R-RUSTPORT-P6-WIEZE-2B2-Q2-obrona, bez push; gałąź rust-port/parity-v2 nietknięta).
