# DISPATCH R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1 (runda 1) — ROZPOZNANIE, BEZ ZMIAN KODU

TEMAT: R7K7C-WIRING (#106) — rozpoznanie: który element pina odpowiada `apply_dipl_deltas_to_state` i gdzie w `advance_turn` ma być wołany.
DOMENA: GAME (rozpoznanie, read-only).
Baza: `origin/rust-port/parity-v2` na chwilę startu (zapisz SHA w raporcie; oczekiwane `6acb1d81b`). Worktree detached z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts`, `gra/src/game/diplomacy-*.ts`, `gra/src/game/*.ts` (szukaj po treści: delta skarbca, praca, „aiSkarbiecByOwner”, „ownerPracaPool”, „applyDiplDeltas”, „dipl delta”).

## FAKTY ZNANE (sprawdź)
- Rust: `rust-port/engine/src/domain/turn_war_dipl_steps.rs` ok. 1031: `pub fn apply_dipl_deltas_to_state(state, treasury_deltas, praca_deltas) -> Result<(), WarTurnError>`. Komentarz nad funkcją mówi, że brak wpisu właściciela daje błąd, a pin czyta go jako 0 (`aiSkarbiecByOwner.get(id) ?? 0`); to odchylenie jest oznaczone jako otwarte (DECISION_REQUIRED).
- Rust: brak produkcyjnego wołającego `apply_dipl_deltas_to_state` (tylko definicja i testy) — potwierdź `git grep`.
- Rust: `rust-port/engine/src/domain/playable.rs` ok. 1105: `pub fn advance_turn(&mut self)` (fazy kolejki, migawki przed turą).

## GOAL
Ustal: (a) funkcja pina i jej dokładne miejsce w turze (który krok, która linia), (b) co dokładnie zapisuje (skarbiec gracza, skarbiec AI, praca), (c) czy wartości `undefined` → 0 są w pinie (dowód linii), (d) które miejsce w `advance_turn` odpowiada tej fazie i co trzeba zmienić, (e) jak wygląda test wektorowy (`≥150` z pinu, wg wymagania #106), (f) czy odchylenie „brak wpisu → błąd” jest zgodne z zasadą 9 (parytet 1:1) — zarekomenduj wariant z uzasadnieniem.

## KRYTERIA KOŃCA
1. Tabela: element pina → miejsce w pinie (plik:linia) → odpowiednik Rust (plik:linia) → wołany w produkcji (tak/nie, `git grep`).
2. Lista zmian potrzebnych do wpięcia (funkcja, faza, stan) z plik:linia.
3. Propozycja tematów wykonawczych: nazwa, allowlista, zależności (w tym: czy zależy od T1/T3 — te dotyczą ZLOZE, nie tej funkcji), szacunek rund.
4. Rekomendacja w sprawie „brak wpisu → błąd vs 0” (ABC: opis, za/przeciw, rekomendacja z uzasadnieniem). Jeśli pin wprost daje 0, rekomenduj parytet (0) i oznacz jako zgodne z zasadą 9.
5. Niepewne twierdzenia: NIE_ZMIERZONO. Zero zmian w `rust-port/**`, `gra/**`, testach.

## ALLOWLISTA (tylko ten raport)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1/**`
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1.md` (NOWY)
ZAKAZ: wszystko inne. Bez push do `parity-v2`. Commit na `wip/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1`, bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (SHA, allowlista)/TESTY: NIE DOTYCZY (read-only)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO.

## KOREKTA BAZY (orkiestrator, 15.11 UTC) — OBOWIĄZUJE ZAMIAST BAZY I POLECEŃ FETCH/CHECKOUT Z GÓRY
- Baza: `f7baa3848` (aktualny `origin/rust-port/parity-v2`, zawiera P4-1E). Wszystkie wcześniej podane bazy są jego przodkami.
- Worktree: `git worktree add --detach <ścieżka> f7baa3848`. Polecenia `git fetch origin rust-port-wip/...` z góry są nieaktualne i pomijane.
- Zakres, allowlista, bramki i tryb (kod/odczyt) bez zmian.
