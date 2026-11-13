# DISPATCH R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1 (runda 1)

TEMAT: COMBAT-WEJSCIA (#167) — rozpoznanie, runda 2 (kontynuacja R1, FAIL FC na złej bazie)
DOMENA: GAME (rozpoznanie). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1`. Przed startem: `git checkout --detach 5e8b116e8` w worktree (ten SHA ma pierwszeństwo nad wszelkimi innymi).
Pin (tylko odczyt): `git show 07d2fbd72:<ścieżka>`.

## GOAL
Powtórzyć rozpoznanie wejść fazy zwarcia z pinu (`resolveCombat`, combat.ts:842+; wejścia przed pętlą dystansu) WZGLĘDEM BAZY `5e8b116e8`, gdzie port melee już jest (`combat.rs:1276 pub mod melee_phase`, `resolve_melee_phase`). Poprzednia runda (ID `R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-Q1`, baza fc2ed160f) padła na złej bazie — jej wnioski o „niezportowanym melee” są NIEAKTUALNE. Dla każdego wejścia: pin plik:linia → Rust plik:linia → status (jest/brak/częściowo/zgodny semantycznie). Wskazać rozbieżności semantyczne (np. counterMultiplier: pin filtruje counters.json, Rust używa canonical_type). Zaproposować plan T1..Tn z rundami.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1-ROZPOZNANIE.md (NOWY)`
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: `src/**`, `tests/**`, `gra/**`, `Cargo.*`, push do parity.

## KRYTERIA KOŃCA
1) Tabela wejść z dowodem plik:linia po obu stronach. 2) Lista rozbieżności semantycznych. 3) Plan wykonawczy z zależnościami; szacunek rund oznaczony jako szacunek, nie pomiar. 4) Niepewne = NIE_ZMIERZONO.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Bez zmian kodu. TESTY: NIE DOTYCZY. RUNDY: 1/5.
