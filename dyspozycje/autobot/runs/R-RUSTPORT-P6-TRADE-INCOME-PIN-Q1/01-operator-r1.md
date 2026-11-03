STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1
GOAL: `domain/trade.rs` 1:1 z pinem weba `4bbef081d` (krzywe `handel_szlaki`, x2 miedzy ownerami, `ceil/2`, `refresh_trade_routes`, przeplyw surowcow `main.ts:34470-34498`); spłata długu -Q7 pkt 1. Baza `b0057c1c9`.

ZMIANY/COMMIT: kod+dowody `f00d5aa9a` (WIP: `986c8fa1b`, `8459bbd25`); raport w kolejnym commicie.
* `trade.rs` (celowa zmiana zachowania, diff w commitach): dochód z krzywych, x2, `ceil/2`; sort kandydatów po dochodzie pinu + `locale_compare` (ICU, ASCII); `needPath=false` kończy po prefiltrze komponentów (web nie robi BFS); Tundra przejezdna (`trade-routes.ts:198-200`); budżet BFS `max(1,w+h)`; limity liczą wpisy listy; `territoryOwnerAt` (miasto>fort, `order`); ten sam heks przed granicą; `citiesHaveTradeConnection` z `needPath=true`; teksty diagnozy; loadery z `&Value`; przepływ i bonusy na `f64`.
* `turn_economy_inputs_trade.rs`: duplikat logiki usunięty, deleguje do `trade.rs` (jedno źródło prawdy); `p6_adv_q6_wire` nadal bit w bit.
* NOWE: `trade_flow_apply.rs` (+`pub mod`), `tests/p6_trade_pin.rs`, `tests/p6_trade_pin_vectors/trade.json` (5,8 MB), doc `P6-TRADE-INCOME-PIN.md` (tabela funkcji 100%, plik:linia, PRZED/PO).
* Regeneracja testów (uzasadnienie w doc sek. 3, asercji nie osłabiono): `tests/trade.rs` (krzywe pinu, `f64`, wymiary mapy), `tests/terrain_movement_fix.rs` (3 testy "Tundra blokuje trasę" odwrócone: pin przepuszcza Polarny). `gra/**`, `Cargo.toml`, `WERSJE.md` nietknięte.

TESTY:
* `p6_trade_pin`: 2/2, 59 190 sprawdzeń z URUCHOMIONEGO weba (esbuild w `/dev/shm`, `git archive 4bbef081d`): 62 scenariusze x 3 ticki (refresh, 23 070 połączeń ze ścieżkami, granica, diagnoza, limity, dochód, bonusy, granty, przepływ, sklejka magazynów, diff), 260 przypadków granicy, loadery, 2 500 par `localeCompare`.
* Weryfikator `python3 -I`: 57 807 sprawdzeń, 0 rozbieżności, kontrola negatywna 2/2 (`verify-output.txt`).
* Mutacje 54/54 zabite (SURVIVED 0, COMPILE 0), `mutacje-wynik.txt`. Pierwsza seria dała 3 ocalałe (ten sam heks, sąsiedzi prefiltra, kolejność fortów) — dodano wektory brzegowe i granicy, seria powtórzona w całości; NaN dystansu wykryty ręcznym testem (Rust `f64::min` ignoruje NaN) i naprawiony.
* Bramki (jedna linia `EXIT=`): fmt 0, clippy `-D warnings` 0, `git diff --check` 0, pełny `cargo test -j 2 --no-fail-fast` PO: 2059/0; PRZED na czystym `b0057c1c9`: 2057/0. Różnica nazw testów: 2 nowe + 4 przemianowane (te z sek. 3).

BLOKADY: brak.
NIE_ZMIERZONO: PRZED "rozbieżna" w tabeli to lektura starego kodu (stary Rust nie kompiluje się z nowymi wektorami); `localeCompare` dla identyfikatorów spoza ASCII; mutacje liczono na kodzie sprzed `cargo fmt`/`TRADE_TECH` (semantyka identyczna, kotwice sprawdzone ponownie, M44 powtórzona). Nieskomitowany `Cargo.lock` (artefakt cargo) pominięty.
ZAŁOŻENIA do akceptacji: Z2-Z7 w doc sek. 2 (m.in. `radius` węzła podaje wołający, `ownerResourceCap` jako domknięcie, tabela `trade-multipliers.json` zostawiona ze starym opisem "BEZ MECHANIKI" dla 2 wierszy).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 (sprawdzić: zgodność generatora z pinem, tabelę PRZED/PO, uzasadnienie odwrócenia testów Tundry, założenia Z2-Z7).
DEPLOY/PUSH: NIE WYKONANO
