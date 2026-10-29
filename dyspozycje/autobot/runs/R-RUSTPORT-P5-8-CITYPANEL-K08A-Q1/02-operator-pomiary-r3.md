STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1
GOAL: Niezależna weryfikacja r3 (zarzut 1 FC r2: lustro K06A w `refreshCityPanelIfOpen`) na commicie kodu a42bab1b; pomiary, mutacje, bramki.
ZMIANY/COMMIT: baza e145d022 (detach; kod a42bab1b nietknięty). Zmiany tego etapu: `dyspozycje/rust-port/p5/P5-8-K08A.md` §9, `runs/…K08A-Q1/02-operator-pomiary-r3.md`, logi `runs/…K08A-Q1/r3-logi/pomiary-r4-*`. Kodu nie zmieniano. Commit: SHA w wiadomości orkiestratora (`git log -1`). `npm ci` tylko lokalnie (node_modules, ignorowane przez git).
TESTY: verify-k08a-copies EXIT 0 (15 bloków, 13 podstawień linii, OK). run-k08a-units EXIT 0: 48 wektorów, 0 różnic. mutate-k08a-units: 50 mutantów, 50 ZABITYCH (48 przez harness, 1 przez bramkę kopii, 1 przez wyjątek harnessu), 0 PRZEŻYŁO, 0 NIE_ZMIERZONO; wynik identyczny bajt w bajt z r3 (deterministyczny). `resolve-k06-nosync` zabity przez harness. npm run check EXIT 0 (self-test 33/15, pin-copies 435 plików, niezgodnych 0). npm run typecheck EXIT 0. `git diff --check` 249bca66..e145d022 EXIT 0. cargo fmt --check EXIT 0. Clippy/test cargo NIE uruchomiono: diff r3 nie zawiera plików `.rs` (zmiany wyłącznie TS/MJS/MD/logi).
BLOKADY: brak. Allowlista: wyłącznie `src-tauri/frontend-v2/{src/ui/cityPanel,tools}/**`, PORTING-QUEUE, dokument P5-8-K08A, run. Zero zmian w `gra/**`, `package.json`, `WERSJE.md`.
RUNDY: 3/5 (ten etap = pomiary r3, bez rundy).
NASTĘPNY KROK: Evaluator r3, potem Final Control r3 (ten sam ID K08A-Q1).
NOTATKI (nie blokują, do rozstrzygnięcia przy K09):
- N1: `resolveK08aActiveCity` synchronizuje K06A tylko gdy lustro K06A ma to samo `id` i nie null (`k08a-fundament.ts` ~l.82-90). Stan „K07A ustawione, K06A null” lub „różne id” nie jest naprawiany. W pinie jedno `activeCity`, więc ten stan nie powinien wystąpić; dotyczy wiązania kontrolera (NIE_ZMIERZONO).
- N2: rzutowanie `fresh as unknown as CityK06` (założenie K08A-Z4) — bez zmian.
- N3: `setK07aActiveCity` nie ma wywołań w kontrolerze poza testami; wiązanie lustr w K09 — NIE_ZMIERZONO.
