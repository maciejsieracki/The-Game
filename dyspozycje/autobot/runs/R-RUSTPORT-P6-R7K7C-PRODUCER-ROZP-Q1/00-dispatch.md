# DISPATCH R-RUSTPORT-P6-R7K7C-PRODUCER-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (luka z #227)

TEMAT: producent wpisów skarbca AI i puli Pracy (`ai_treasury_by_owner`, `praca_pool_by_owner`). Rozpoznanie wykonuje zadanie #106 (R7K7C-WIRING): skąd w pinie powstaje wpis AI przy zapisie, a w Rust — czy istnieje producent. Bez tego wiring „brak wpisu = 0” maskuje lukę.
DOMENA: GAME (read-only). Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `1b8b67173` (= `origin/rust-port/parity-v2`). Worktree detached. ZERO zmian kodu.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## PIN (tylko odczyt, `git show 07d2fbd72:gra/src/...`)
`main.ts:22642` (`?? 0` i tworzenie wpisu przy zapisie), `main.ts:34865`, `:34877`, `:34864-34866`, `:34876-34878` (fotele człowieka), `grep -rn "aiSkarbiecByOwner\|ownerPracaPool\|praca" gra/src`.

## RUST (tylko odczyt, `git grep` na 1b8b67173)
`rust-port/engine/src/domain/turn_war_inputs.rs:713-714` (producent), `turn_war_dipl_steps.rs:1041,1049` (`apply_dipl_deltas_to_state`, `find(is_human)`), `playable.rs:960-979` (settery).

## KRYTERIA KOŃCA
1. Tabela: wpis w pinie (plik:linia) → kto go tworzy i kiedy → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista producentów wpisów AI, które trzeba dopisać w Rust (nazwa, faza, stan), z zależnościami.
3. Propozycja wdrożenia: nazwa tematu, allowlista, wektory (min. 3). Nie wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R7K7C-PRODUCER-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-PRODUCER-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
