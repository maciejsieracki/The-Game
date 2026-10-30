STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1
GOAL: P6.8D (podzial `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` §9/§11, partie 8D-P1 i 8D-P2) - port `gold-deficit.ts` (w tym `applyGoldDeficitHpLoss`), `mennica-zloto-grace.ts` i `wealth.ts` (w tym `wealthParamsWith*` - pokryte przez B3). Pin webu 91dc998a (git archive poza repo). Ten run (runda 3) wykonuje zakres z FC r2: gold-deficit -> mennica -> wealth -> applyGoldDeficitHpLoss.
ZMIANY/COMMIT:
- Baza: `origin/rust-port/parity-v2` = `a8f4c7ee` (detach w worktree), zawiera `a1924555`/`a2ce831f` (citizen, P1).
- `f1f83d37` feat(rust-port): P6.8D-P1/P2 gold-deficit + applyGoldDeficitHpLoss + mennica-zloto-grace.
- `fbc9e59d` feat(rust-port): P6.8D-P2 wealth.ts (load, cap, mnoznik, zadowolenie, rownowaga, prog, advanceWealth, freshWealthState).
- Allowlista (wykonana): `rust-port/engine/src/domain/turn_economy.rs` (nowe moduly `gold_deficit`, `mennica_zloto_grace`, `wealth`; helpery `js_max`/`js_min` ze semantyka JS); `rust-port/engine/tests/p6_8d_gold_deficit.rs`, `p6_8d_mennica_grace.rs`, `p6_8d_wealth.rs` (NOWE); `rust-port/engine/tests/p6_8d_vectors/{gold_deficit,mennica_zloto_grace,wealth}.json` (NOWE, z weba 91dc998a); run: `gen-p6-8d-gold-mennica-vectors.mjs`, `mut-gold-mennica.sh`, `gen-p6-8d-wealth-vectors.mjs`, `mut-wealth.sh`, ten raport.
- Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. `state.rs` NIE zmieniony (patrz BLOKADY). Push: NIE. Niescommitowane (lokalne, nie wchodza do commita): `rust-port/engine/Cargo.lock`, `rust-port/engine/target/`.
- Nazwa raportu: orkiestrator podal `01-operator-r1.md`, ale ten plik juz istnieje na galezi (r1). Nie nadpisywano go; raport tej rundy to `02-operator-r3.md`.

ZAKRES WYKONANY (symbole §11):
- gold-deficit.ts (8D-P1, 13 symboli realnych): buildGoldDeficitParams, freshGoldDeficitState, advanceGoldDeficit (+ _setLastGoldDeficitTicks jako czesc advance), clearLastGoldDeficitTicks, isGoldDeficit, isGoldDeficitStarving, getGoldDeficitCountdown, getLastGoldDeficitTick, applyGoldDeficitStatMultToCombatUnit, typy (GoldDeficitState/Params/Tick/TickResult, RawParamRow, Difficulty), round4 (jako js_round).
- applyGoldDeficitHpLoss (8D-P2): PORTOWANE.
- mennica-zloto-grace.ts (8D-P2, 7 symboli): MENNICA_ZLOTO_GRACE_TURNS, createMennicaZlotoGraceState/clear, ownerZlotoAccessForMennica (owner_zloto_access_for_mennica), prepareMennicaZlotoGraceForTick, finalizeMennicaZlotoGraceAfterTick, serialize/restore.
- wealth.ts (8D-P2): FALLBACK_WEALTH_PARAMS, WealthParams, loadWealthParams, wealthCap, wealthMnoznik, wealthZadowolenie (G6), wealthRownowaga, wealthProg, WealthState, advanceWealth, freshWealthState: PORTOWANE.
- wealthParamsWithCapModifier / wealthParamsWithMultiplierModifier: NIE powielone (dyspozycja). Pokrywa je B3 w `city_growth.rs` (`WealthModParams`, testy `p6_repin_b3_wealth`, pelny suite zielony).

ZALOZENIA (rozstrzygniete w dokumencie, bez pytan ABC):
1. Globalny `_lastTicks` (web) -> jawny `GoldDeficitRuntime` (`advance` ustawia stan, akcesory go czytaja).
2. `isCivilianUnit` liczy wolajacy i przekazuje w polu `civilian` (w wektorach liczone przez web `isCivilianUnit`).
3. Web `Map` (kolejnosc wstawiania) -> `BTreeMap`; serializacja posortowana po kluczu. Kolejnosc nie wplywa na zachowanie.
4. Web resolver z `prepareMennicaZlotoGraceForTick` -> `owner_zloto_access_for_mennica(owner, &state, has_now)` z tym samym stanem.
5. Wartosci nie-liczbowe w econ-params (stringi) -> `None` -> fallback (web: `Number.isFinite` / `typeof` => fallback). Zgodne z wektorami (`stringi`).
6. `prog_dezercji` web `null` i `undefined` -> `None` (oba zwracane bez zmian).
7. Web zwraca ten sam obiekt przy mult poza (0,1) - w Rust wartosc (kopia); wektory sprawdzaja wartosci, nie tozsamosc obiektu.
8. `getMaxHp` zakladane jako zwracajace liczbe dla kazdego typeId (web dla nieznanego typu zwraca undefined - sciezka nieportowana).
9. Wektory: liczby calkowite > 2^53 kodowane jako `$f` (serde_json bez `float_roundtrip` gubil 1 ULP przy ~1e22; wykryte na wektorach wealth, naprawione w generatorze, nie w kodzie portu).
10. JS `Math.min/max` (w tym znak zera) odtworzone lokalnie (`js_max`/`js_min` w turn_economy.rs), zamiast `f64::max/min` (ktore nie gwarantuja znaku -0).

TESTY (worktree, detach a8f4c7ee + 2 commity; CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0):
- Wektory (generator z URUCHOMIONEGO weba 91dc998a, `node --experimental-transform-types --import repin-b-loader-register.mjs`): gold_deficit: params=22, advance=40 sekwencji (kroki z perOwner/byOwner/states/akcesorami), statMult=88, hpLoss=120; mennica: 8 sekwencji + const + restoreClear/restoreNull; wealth: load=16, fn=1040, advance=36 sekwencji (w tym 1 przypieta z minPoziom undefined/1/null).
- `cargo test --test p6_8d_gold_deficit --test p6_8d_mennica_grace --test p6_8d_wealth`: 10 + 5 + 6 = 21 passed, 0 failed.
- `cargo test --no-fail-fast` (pelny suite engine): passed=1436, failed=0, EXIT 0 (poprzednio 1399 na starszej bazie; roznica = baza + nowe testy).
- `cargo fmt --all -- --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `git diff --check` (staged, oba commity): czysty.
- Mutacje gold-deficit + mennica (`mut-gold-mennica.sh`, 14 mutacji): 14 KILLED. Po drodze: MUT karencja `>=` na `>` z poczatku SURVIVED/NO-OP (wzorzec nie pasowal po rustfmt) - poprawiony wzorzec; MUT countdown bez `max(1)` SURVIVED (dla calkowitej karencji to mutant rownowazny) - dodane wektory z ulamkowa karencja 2.5 i 0.5, po czym KILLED.
- Mutacje wealth (`mut-wealth.sh`, 11 mutacji): 11 KILLED. MUT domyslnego minPoziom=1 SURVIVED -> dodana przypieta sekwencja (poziom 1, pula 0, minPoziom undefined/1/null), po czym KILLED.
- Mutanty rownowazne / nie testowane: `filter(is_finite)` w `load_wealth_params` - JSON nie niesie NaN, wiec mutant nie zmienia wyniku dla wejscia JSON (nie testowany).

BLOKADY / OTWARTE:
- `state.rs` (fragmenty wealth `:1661`, `:1759`, society-inputs) NIE podpiete pod nowe funkcje - integracja poza zakresem tego tematu (GOAL = port symboli). Wymaga osobnej partii przed uznaniem 8D za zintegrowane w grze.
- Srodowisko: w trakcie rundy dysk wolumenu /tmp zapchal sie (ENOSPC, 0 MB). Zwolniono WYLACZNIE pliki tej sesji: katalog `rust-port/engine/target/` tego worktree (~11 GB cache buildu, regenerowalny) oraz kopie `git archive` i wektory w scratchpadzie (regenerowalne). Nic poza worktree sesji nie zostalo usuniete.
- Brak push (zgodnie z dispatchem); integracja z `origin/rust-port/parity-v2` dopiero po Final Control (`INTEGRATION_PENDING`, nie `READY_FOR_DEPLOY`).

RUNDY: 3/5 (dispatch podaje 2/5 zuzyte; orkiestrator w tej turze podal "Runda 1/5" - rozbieznosc zgloszona; numeracja zgodna z FC r2: nastepna runda = 3).
NASTEPNY KROK: Evaluator (ten sam ID) na commitach f1f83d37 i fbc9e59d: przeglad zgodnosci z webem (wektory, mutacje, zalozenia 1-10), potem Final Control; osobna partia `state.rs` (wealth :1661/:1759, society-inputs) jako kolejny krok integracyjny.
DEPLOY/PUSH: NIE WYKONANO
