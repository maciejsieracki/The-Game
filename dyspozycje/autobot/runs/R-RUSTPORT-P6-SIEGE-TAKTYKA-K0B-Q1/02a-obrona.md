# OBRONA Operatora — R-RUSTPORT-P6-SIEGE-TAKTYKA-K0B-Q1 (odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K0B-Q1
GOAL: port K0b (`_threatSlack`, `_siegeShooterThreats`, `_siegeApproachRestricted`) z wektorami z pinu 07d2fbd72; obrona na zarzuty 1–8 Evaluatora.
ZMIANY/COMMIT: kod operatora 4dc8e33ee (baza 4f16b5a1f); obrona = commit na tej gałęzi detached (SHA w raporcie orkiestratora). Zmienione pliki obrony: `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`, `rust-port/engine/tests/p6_siege_tactics_approach.rs`, ten plik. Cargo.lock NIE commitowany (untracked, `rust-port/engine/Cargo.lock`). Brak push, brak integracji, brak zmian w `gra/`, `origin/main`, `WERSJE.md`, `Cargo.toml`.
TESTY: po poprawkach (ten sam worktree, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usunięty po bramkach):
- `cargo fmt --check` EXIT 0 (po `rustfmt` jednego pliku testowego; pierwszy przebieg dał EXIT 1 wyłącznie na mojej nowej asercji i został naprawiony)
- `cargo clippy --all-targets -- -D warnings` EXIT 0
- `cargo test --lib` 48 passed, 0 failed
- `cargo test --test p6_siege_tactics_approach --test p6_siege_tactics_end`: approach 5 passed (było 4; +1 nowy test NaN), end 8 passed, 0 failed, 0 ignored
- Brak zmian w `p6_siege_tactics_end.rs`, wektorach i generatorze.
BLOKADY: patrz niżej (rozbieżność bazy do decyzji orkiestratora; zakres K0b bez wpięcia w produkcję).
RUNDY: 2/5 (runda 1 = `01-operator-r1.md`, obrona = runda 2 tego samego ID)
NASTĘPNY KROK: ponowna ocena Evaluatora i Final Control dla tego samego ID (po commicie obrony).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — wiersz 33.21 ma 7 kolumn zamiast 6
**PRZYJMUJĘ.** Dowód: `P6-SIEGE-TAKTYKA.md` wiersz 33.21 miał nadmiarowy `|` przed „Zagrożenia strzelców…”, więc liczba kolumn wynosiła 7 (nagłówek ma 6). Poprawka: usunięto nadmiarowy separator, treść „Zagrożenia strzelców do `_siegeApproachRestricted` (wiersz 19).” przeniesiono do kolumny „Uwagi”. Weryfikacja: `awk -F'|'` na wierszu daje 6 kolumn. Commit obrony.

### Zarzut 2 — wiersz 19 ma status PORTED, ale tekst mówi „Kandydat K2 tylko po rozbiciu” i „nie jest 2×2”
**PRZYJMUJĘ** (niespójność dokumentacji, nie kodu). Stan faktyczny: K0b portuje `siege_approach_restricted(ru, wall)` z jawnymi strukturami `ApproachUnit`/`ApproachWallState`; gałęzie (a)–(e) są rozbite na wejścia w tej samej funkcji i mają osobne wektory. Poprawka dokumentu:
- wiersz 19: zdanie o „kandydacie K2 tylko po rozbiciu” zastąpione stwierdzeniem, że gałęzie (a)–(e) są już rozbite w K0b, a wiersz nie wymaga dalszego rozbicia przed K2; zachowano informację, że wynik nie jest czystym boolem 2×2.
- wiersz K2 w §4: „NAJPIERW rozbić wiersz 19…” zastąpione stwierdzeniem, że rozbicie jest zrobione w K0b, a K2 zostaje jako ewentualny predykat (d)/(e) tylko jeśli K3 go wymaga.
Commit obrony.

### Zarzut 3 — wektory z ręcznego wycięcia JS, nie z esbuild; hash chroni bajty pinu, nie wierność wycięcia
**ODRZUCAM** jako błąd wymagający poprawki; **przyjmuję** notę o ograniczeniu.
- Dispatch dopuszcza wycięcie funkcji TS („wycięcie funkcji TS i wykonanie w node, esbuild poza repo”); esbuild nie jest zależnością w generatorze ani w repo.
- Generator `p6_siege_tactics_approach_gen.mjs:17,25-28` sprawdza SHA-256 wycinanych fragmentów pinu (`FRAGMENT_SHA256 = 1d9de41a…`) i przerywa przy niezgodności; wycięcie jest więc odtwarzalne bajt w bajt względem `git show 07d2fbd72`.
- Wierność logiki wycięcia wobec pinu została sprawdzona przez Evaluatora ręcznie (jego własny wynik: zgodne) i wektory są generowane przez wykonanie tych samych fragmentów w node, a nie przez ręczne liczenie.
- Ograniczenie (przyjęte, bez zmiany kodu): hash nie dowodzi semantycznej równoważności z całym `battleScene.ts`, tylko zgodności wyciętych bajtów. Pełny dowód wymagałby esbuild/testu na prawdziwej scenie, co jest poza zakresem K0b.

### Zarzut 4 — brak wektorów NaN/Infinity dla `threat_slack`; `wall_col_ge0` liczone przez wołającego
**PRZYJMUJĘ** w części dotyczącej `threat_slack`; w części o `wall_col_ge0` **ODRZUCAM** jako ryzyko wymagające zmiany.
- Poprawka: dodano test `threat_slack_nan_propaguje_jak_math_min` w `p6_siege_tactics_approach.rs`. Oczekiwane wartości wyprowadzone z zachowania `Math.min` w node 22 (sprawdzone przed napisaniem testu): `Math.min(Infinity, NaN)` = NaN, `Math.min(0, NaN)` = NaN, `Math.min(0, Infinity)` = 0. Test pokrywa NaN w kolumnie, w zasięgu, w pozycji zagrożenia, NaN na dalszej pozycji listy oraz kontrolę z `-Infinity` zasięgu (wynik 0). Wynik: test zielony (approach 5 passed).
- `wall_col_ge0`: pole jest `bool` ustawiane przez wołającego. Semantyka pinu to `!(siegeWallCol >= 0)`; dla NaN `NaN >= 0` jest `false`, więc poprawny wołający liczy `x >= 0.0` (a nie `!(x < 0.0)`), co daje ten sam wynik co JS. Nie dodano testu tej konwencji, bo nie ma w Rust kodu wołającego (funkcja nie jest wpięta w produkcję, zob. zarzut 7). Konwencja jest opisana w dokumentacji pola. Ryzyko przyjęte jako notatka dla K2/K3.

### Zarzut 5 — `terrain_range` testowany jawnym wejściem; `_applyTerrainRange`, `canShoot`, `isSiegeUnit` nie są portowane
**ODRZUCAM.** Dowód i podstawa:
- Dispatch wymaga: „Zależności stanu (this._*) przekazuj jako jawne wejścia; nie stubuj po cichu” i kryterium (2) dopuszcza „jawnie rozbite na wejścia z uzasadnieniem w raporcie”.
- Plan `P6-SIEGE-TAKTYKA.md` wiersz 33.21 wprost mówi „wejścia jawne: … `terrain_range` (zamiast `_applyTerrainRange`)”; moduł `siege_tactics_approach.rs` ma to w opisie funkcji `siege_shooter_threats` i w nagłówku.
- Port `_applyTerrainRange` to osobny klocek (zależy od stanu terenu sceny); test sprawdzający prawdziwe `_applyTerrainRange` wymagałby jego portu, co wykracza poza K0b. Nie ma cichego stubu: wartości wejściowe są jawne w wektorach.

### Zarzut 6 — rozbieżność bazy (258afaf8f vs 4f16b5a1f)
**PRZYJMUJĘ jako fakt, bez zmiany kodu; decyzja integracyjna należy do orkiestratora.** Zweryfikowane:
- `origin/rust-port/parity-v2` = 258afaf8f (zawiera f207ea6b1, więc spełnia „f207ea6b1 lub nowszy”).
- Dispatch wskazuje bazę 4f16b5a1f. Ta gałąź ma 9 commitów ponad 258afaf8f (audyt taktyki FC/obrona r1–r5, w tym 392e2c6bf, d525c67a9, 4f16b5a1f).
- Kod operatora 4dc8e33ee = 4f16b5a1f + 1 commit K0b; 4dc8e33ee ma 10 commitów ponad 258afaf8f i 0 commitów poza nim w drugą stronę (`git rev-list --count 258afaf8f..4dc8e33ee` = 10).
- Plik `p6_siege_tactics_end.rs`, wektory końcowe i plan P6-SIEGE-TAKTYKA.md NIE istnieją w 258afaf8f (sprawdzone `git cat-file`), więc użycie 4f16b5a1f było konieczne dla kryterium (3).
- Operator nie pushował do `rust-port/parity-v2` i nie integrował. Orkiestrator musi zdecydować, czy integrować 4dc8e33ee z 9 commitami audytu (pierwsza gałąź wip) ponad parity-v2.

### Zarzut 7 — moduł nie wpięty w produkcję; `_siegeMoveRefused` (wiersz 29) i `_siegeSafeApproach` (wiersz 30) nie portowane
**ODRZUCAM** jako wykraczający poza zakres K0b. Dowód:
- Dispatch K0b: GOAL = „port 1:1 klocka K0b” (`_threatSlack`, `_siegeShooterThreats`, `_siegeApproachRestricted`); kryteria (1)–(4) nie wymagają wpięcia ani portu wierszy 29/30.
- Plan: wiersz 29 `_siegeMoveRefused` ma status BRAK, a wiersz 30 (`_siegeRamTowerStep` / `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` / `_siegeSafeApproach`) ma status BRAK i jest zaplanowany na K2/K4 — zgodnie z zakresem.
- `grep` po `rust-port/engine/src` potwierdza, że jedynym odwołaniem do modułu jest `domain/mod.rs:92` (rejestracja). To jest zamierzony stan K0b.
- Notatka: wpięcie w produkcję i porty wierszy 29/30 pozostają otwarte w planie (K2/K3/K4).

### Zarzut 8 — start na 7,8 GB wolnego dysku (próg 8 GB)
**PRZYJMUJĘ jako fakt procesowy, bez wpływu na kod.** Start był poniżej progu 8 GB z dispatchu, a bramki przeszły. Na dzień obrony po sprzątaniu target poza repo `df -h /` pokazuje 8,0 GB wolnego (31 GB użyte z 252 GB). `Cargo.lock` jest untracked i nie został zacommitowany. Notatka: przy kolejnych rundach Rust sprawdzać próg przed startem.

## Odtworzone bramki (po poprawkach obrony)
| Bramka | Wynik |
|---|---|
| cargo fmt --check | EXIT 0 |
| cargo clippy --all-targets -- -D warnings | EXIT 0 |
| cargo test --lib | 48 passed |
| cargo test --test p6_siege_tactics_approach | 5 passed (4 z rundy 1 + nowy test NaN) |
| cargo test --test p6_siege_tactics_end | 8 passed |

NIE_ZMIERZONO w tej rundzie: ponowne mutacje (zarzut Evaluatora z mutacjami nie był kwestionowany) i ponowne wygenerowanie wektorów przez node (generator nie był zmieniany).
