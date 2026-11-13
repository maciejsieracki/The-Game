# DISPATCH R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-Q1 (runda 1) — rozpoznanie zadania #135 (BEZ zmian kodu)

TEMAT: wejścia przed pętlą dystansu/zwarcia (#135): skąd na pinie pochodzą modyfikatory rundy (atkRoundMods / defRoundMods: cywilizacja, budynki, teren, różnica trudności) i czy Rust ma odpowiedniki.
DOMENA: GAME (rozpoznanie). BAZA: `fc2ed160f` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/combat.ts` (funkcje wywołujące resolveCombat oraz blok melee) oraz `gra/src/battle/battleScene.ts` (miejsca budujące mnożniki rundy).
Rust (tylko odczyt): `rust-port/engine/src/domain/combat.rs` (funkcja melee_phase, wejścia wstrzykiwane przez __modsAtk/__modsDef), `rust-port/engine/tests/p6_combat_melee*.rs`.

## GOAL
Dla każdego wejścia fazy zwarcia: źródło w pinie (plik:linia), wartość liczona przez kod pinu czy wstrzykiwana, odpowiednik w Rust (istnieje / brak / gdzie), oraz zależności od stanu gry. Zaproponuj minimalny plan portu wejść (pliki, wektory, ryzyka) i liczbę rund.

## ZAKRES
- Tylko czytanie i raport. Zero zmian w `rust-port/**`, `gra/**`, testach.
- Każde twierdzenie: plik:linia. Niepewne = NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-Q1.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-Q1/**`
ZAKAZ: `src/**`, `tests/**`, `gra/**`, `Cargo.toml`, push do parity.

## KRYTERIA KOŃCA
1. Tabela wejść: pin (plik:linia) → Rust (plik:linia lub brak) → kto liczy (pin/wstrzyknięcie) → zależności stanu.
2. Lista luk (dane, stan, funkcje) z plik:linia.
3. Plan wykonawczy: pliki, wektory, rundy, ryzyka.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (tylko dokument)/TESTY (NIE DOTYCZY)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
