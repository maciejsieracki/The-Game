# R-RUSTPORT-P6-CRED-HAK-HOOK-R1 — hak P4 zarejestrujWypowiedzenie w produkcji (#120, #286, #350, #305)

STATUS: dispatch orkiestratora. Operator HAIKU, Obrona HAIKU, Evaluator i FC SONNET (engine, nie grafika).
DOMAIN: GAME=tak (wiarygodność dyplomatyczna, rejestr wypowiedzeń). Rozstrzygnięte przez web — bez pytania ABC.

## GOAL
Podpiąć `zarejestrujWypowiedzenie` (port już jest: `engine/src/domain/diplomacy_aggressor.rs`, funkcja
`zarejestrujWypowiedzenie` ~1949, `przyczynaWypowiedzenia` ~1826, `maCasusBelliAktywne` ~1944) do KAŻDEJ ścieżki
wypowiedzenia w produkcji. Web woła ją w czterech miejscach (pin `07d2fbd72`, `gra/src/main.ts`):
- `:11713` — hamulec (`zarejestrujWypowiedzenie(declarer, turn, 'hamulec')`),
- `:13177` — wypowiedzenie gracza (`ME()`, przyczyna z `przyczynaWypowiedzenia`),
- `:13221` — `ownerDeclareWarOn` (wypowiedzenie AI i inne; przyczyna jawna albo wyliczona),
- `:23816` — `wymuszona_inna` (sojusz).
Definicja w pinie: `gra/src/game/diplomacy.ts:2022`.

## STAN W PARITY (`c120f2373`) — DO NAPRAWY
- `engine/src/bridge.rs:311` oraz `:430`: `EngineCommand::DeclareWar` zwraca błąd „wiring stanu dyplomacji poza zakresem”.
  To jest luka: produkcja nie woła hooka. Usunąć stub i podpiąć właściwą ścieżkę (ten sam przepływ co web).
- Port `zarejestrujWypowiedzenie` istnieje, ale nie ma wołającego w produkcji (grep: tylko definicja/testy).

## ZAKRES
1. `bridge.rs`: zamienić oba stuby `DeclareWar` na wywołanie ścieżki gracza, która: (a) sprawdza pokój (`isPeaceLockedBetween` jak web),
   (b) liczy `zlamanieRozejmu`, `casusBelliAktywny`, (c) woła `zarejestrujWypowiedzenie(ME, turn, przyczyna)`.
2. `declare_forced_wars` / `declare_from_assignments` (#120): tam też woła `zarejestrujWypowiedzenie` z przyczyną jak w `:13221`.
3. Sojusz klastra: `:23816` → przyczyna `wymuszona_inna`.
4. Testy: (a) gracz wypowiada bez casus belli → flaga agresora; (b) z casus belli → brak flagi; (c) hamulec; (d) wymuszona_inna.
   Wektory: wyjście z pinu (generator `.mjs` przez TypeScript, jak w `p6_*_gen.mjs`) dla diplomacy.ts:2022 i trzech ścieżek.
5. Mutacje FAIL: (a) pominięcie hooka w `:13221`; (b) przyczyna zawsze `bez_powodu`; (c) brak sprawdzenia pokoju.

## ALLOWLISTA
`rust-port/engine/src/bridge.rs`, `rust-port/engine/src/domain/diplomacy_aggressor.rs` (tylko wiring, nie zmiana wzorów),
testy `p6_cred_hak_*`, generator `.mjs`, katalog runs. NIC więcej. Nie ruszać `gra/`.

## BRAMKI (EXIT 0)
`rust-port/engine`: `cargo fmt --check -p civ-engine`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test <nowy>`;
`cargo test --all-targets --no-fail-fast` (timeout 1700). Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` poza repo, usuń po bramkach. DYSK ≥ 8 GB przed startem (`df -h /`); inaczej BLOCK INFRA z liczbą GB.

## KRYTERIA KOŃCA
Zielone bramki, mutacje FAIL, stub `bridge.rs` usunięty, commit jawnym `git add`, bez `Cargo.lock`, trailer bez nazwy modelu (#289).
Raport `01-operator-r1.md`. Nie pushować do `rust-port/parity-v2`.
