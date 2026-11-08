STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-FORCED-WAR-MODULES-Q1
GOAL: Partia G3 (fale wojny wymuszonej + trigger/sweep jako funkcje czyste), 1:1 z webem, bez podpinania do tury.
ZMIANY/COMMIT: ocena 6ae83de79 (Operator r4; ancestor 9ef1026a0, 505631741, abc5f58b9 = origin/rust-port/parity-v2). 12 plikow, wszystkie w allowliscie; `git diff --check` czysto; zero zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri.

WERDYKTY PER ZARZUT (runda 3):
1. Niekompletny zakres (brak G3b): ODDAL. Dodano should_search_bronze/stone/iron i sweep_stale_forced_war_entries (war_forced_trigger.rs). Porownalem z main.ts (origin/main, 38863-38975, 11200-11260): warunki Krok A (wasPending/searchingAfterRest, poziom trudnosci != 1 dla Brazu i Kamienia, brak progu dla Zelaza, flagi epoki tylko dla Brazu/Zelaza, uzbrojenie Kamienia w tej turze) i kolejnosc sweepa Kamien/Zelazo/Braz, odpoczynek = turn + stala epoki, usuniecie fal pary - zgodne 1:1. Reszta petli ownerLoop (mutacje pending/era-enter, podpiecie fal, pula gracza, cooldown 20 tur w sciezce dyplomacji) to mutacje stanu closure'ow main.ts, a nie funkcje czyste; jawnie zgloszona jako BLOKADA/G3c i dotyczy podpinania do tury, wykluczonego w dispatchu ("Bez podpinania do tury").
2. Restore odstepstwa dla zepsutych danych: ODDAL. Dane z realnego serialize (plan -> serialize -> restore) odtwarzaja sie bez zmian (test g3b_restore_realistic_shape_roundtrip); rozbieznosc tylko dla recznie zepsutych zapisow, udokumentowana testem negatywnym g3b_restore_malformed_documented_divergence. Zalozenie do wiadomosci wlasciciela, nie wymaga zmiany kodu.
3. localeCompare: ODDAL (naprawione przez Operatora). compare_ids_icu odtwarza ICU dla alfabetu [A-Za-z0-9_-]; wektory idcmp 11 640 par z Node. SAMODZIELNIE: dodatkowo 30 000 losowych par (mieszana wielkosc liter, prefiksy, '_' i '-', dlugosc 1-7) wygenerowanych moim Node 22 vs compare_ids_icu: 0 rozbieznosci (plik tymczasowy usuniety, nie w commicie). Znaki spoza alfabetu: ZALOZENIE (bajtowo), id gry sa z alfabetu.
4. Budzet LOC / Cargo.lock: ODDAL. Przekroczenie to wektory (cases.json) i generator; modul ~239 linii, precedens G2a, zgloszone. Cargo.lock nieśledzony usuniety po bramkach.
Zero zarzutow NAPRAW -> PASS-WITH-NOTES.

TESTY (zweryfikowane samodzielnie, CARGO_TARGET_DIR w worktree, usuniety po bramkach):
- p6_forced_war_g3b: 6 passed; p6_forced_war_g3: 2 passed; p6_forced_war_g2: 3 passed; p6_forced_war_g1: 1 passed; --lib: 22 passed; 0 failed, 0 ignored.
- cargo clippy --all-targets -- -D warnings: czysto. rustfmt --check na war_forced_trigger.rs, war_forced_waves.rs, p6_forced_war_g3b.rs: czysto.
- NIE_ZMIERZONO: ponowne generowanie wektorow z gen_cases_g3b.mjs (brak wyodrebnionego gra/src, dysk), pelne cargo test po ~318 binarkach.

BLOKADY / ZALOZENIA DO WIADOMOSCI:
- G3c (opcjonalnie): mutacje pending/era-enter, wpis i prune fal w ownerLoop, pula gracza, cooldown 20 tur w lockTurnsOverride - dopiero przy podpinaniu do tury.
- Odstepstwo restore dla zepsutych zapisow; localeCompare poza alfabetem ID.
RUNDY: 4/5 (r4 Operatora; FC ocena po r4).
NASTEPNY KROK: integracja orkiestratora: SHA 6ae83de79 (wraz z tym raportem na commicie nastepnym, jesli zapisany) bezposrednio na origin/rust-port/parity-v2 = abc5f58b9 (fast-forward, rodzic zgodny; merge-base --is-ancestor abc5f58b9 6ae83de79 = tak). Przed integracja: git diff --stat abc5f58b9..<SHA>.
DEPLOY/PUSH: NIE WYKONANO
