STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1 (COMBAT-WEJSCIA #167, runda 2 rozpoznania)
GOAL: Tabela wejść fazy zwarcia z pinu `resolveCombat` (07d2fbd72, combat.ts:842+) względem bazy `5e8b116e8`, z rozbieżnościami semantycznymi i planem T0..T6.
ZMIANY/COMMIT: allowlista: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1-ROZPOZNANIE.md` (NOWY) + `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1/**`. Bez zmian w `src/`, `tests/`, `gra/`, `Cargo.*`. Commit: SHA w sekcji DEPLOY/PUSH poniżej (podany w odpowiedzi operatora). Brak push.
TESTY: NIE DOTYCZY (rozpoznanie bez zmian kodu; cargo nie uruchomiono).
BLOKADY: (1) Brak produkcyjnego portu orkiestratora `resolveCombat`: `combat::resolve` (combat.rs:379) deleguje do modelu siłowego `resolve_combat` (combat.rs:319); porty `ranged_phase` (combat.rs:1134) i `melee_phase` (combat.rs:1384) nie mają wołającego poza testami. (2) Rozbieżność historii: wpis #136 i commit 848e77a7e vs. niezmieniony `combat::resolve` w `5e8b116e8` — do rozstrzygnięcia przez orkiestratora. (3) R1 counterMultiplier wymaga decyzji właściciela (źródło: counters.json vs counter-multipliers.json) — T0 w planie. (4) NIE_ZMIERZONO: zawartość macierzy counter vs counters.json; pełne gałęzie rozpadu w fazie dystansowej; C-COMBAT-Q2 `defenderTerrainDefMultOverride` (brak w Rust, 0 trafień); szacunki rund w planie nie są pomiarem.
RUNDY: 1/5 (runda operatora R2-Q1; poprzednia R1 na złej bazie fc2ed160f, wnioski nieaktualne)
NASTĘPNY KROK: Evaluator weryfikuje tabelę wejść (plik:linia po obu stronach, 42 wiersze) i rozbieżności R1–R9; orkiestrator podejmuje decyzję T0 (kanoniczne źródło counter) i rozstrzyga sprzeczność #136 vs baza.
DEPLOY/PUSH: NIE WYKONANO
