# DISPATCH R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1 (runda 1)

TEMAT: ZLOZE-WIRE-EXPIRE-TRIBUTE (#104 część 2, temat T1 z rozpoznania `R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2`): wpięcie deaktywacji grantów złóż (`zlozeGrants`) w produkcyjnej ścieżce tury dla (D1) wygasłych umów i (D6) zerwań za daninę.
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `6acb1d81b` (czubek `origin/rust-port/parity-v2`). PRZED pracą: `git merge-base --is-ancestor 6acb1d81b HEAD` musi być prawdą; inaczej przestaw na `6acb1d81b`. Gałąź robocza: `wip/R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — `runDiplomacyTurnTick` (ok. 24222–24240: pętla `dealsBeforeExpire`, wywołanie `zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, d.id)` ok. 24234) oraz obsługa trybutu (ok. 24270–24300: pętla `for (const id of broken)` z `deactivateZlozeGrantsForDeal` ok. 24292–24294). Funkcja pina: `git show 07d2fbd72:gra/src/game/diplomacy-pn-engine.ts` ok. 346–352.

## GOAL
Każda umowa, która znika w D1 (wygaśnięcie) lub w D6 (zerwanie za daninę, `res.broken`), przy usuwaniu z `work.diplomacy.deals` wygasza grant złoża z tym `deal_id` (`active = false`), jak pin. Pozostałe granty bez zmian. Bez zmiany kolejności D1..D7 i bez zmiany logiki wiarygodności.

## MIEJSCA W RUST (od bazy 6acb1d81b; zweryfikuj przed zmianą)
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs` ok. 918–925: D1, pętla `for d in &before` po `expire_deals(turn_u)`; po `report.expired_deals.push(d.id.clone())` dodaj deaktywację grantów dla `d.id` (metoda `work.diplomacy.deactivate_zloze_grants_for_deal(&d.id)` z `diplomacy.rs:1675`).
- `turn_war_dipl_steps.rs` ok. 956–962: D6, `work.diplomacy.deals.retain(|d| !res.broken.iter().any(...))`; dla KAŻDEGO `id` z `res.broken` (także bez pary w `tribute_break_pairs`) wywołaj deaktywację grantów PRZED lub zaraz po `retain`, zachowując kolejność jak pin (`main.ts` 24292–24294).
- Rust ma `res.broken` jako jedno miejsce (recon, poz. 4). Nie dziel na dwie ścieżki.

## ZAŁOŻENIA (zasada 9: parytet 1:1, nie pytać)
- Pin wywołuje deaktywację raz na id z `broken`; nie dubluj wywołań dla trybutu.
- Nie zmieniaj semantyki `expire_deals` ani `tick_diplomacy_payments`.

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs` (tylko wywołania deaktywacji w D1 i D6, bez zmian innych linii)
- `rust-port/engine/tests/p6_zloze_wire_expire_tribute.rs` (NOWY)
- `rust-port/engine/tests/p6_zloze_wire_expire_tribute_gen.mjs` (NOWY): wykonuje tekst pina `deactivateZlozeGrantsForDeal` (diplomacy-pn-engine.ts 346–352) w node na syntetycznej liście grantów i listach id; strażnik SHA-256 wyciętego fragmentu
- `rust-port/engine/tests/p6_zloze_wire_expire_tribute_vectors/vectors.json` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1/**`
ZAKAZ: `diplomacy.rs` (poza ewentualnym dopiskiem komentarza), `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `git add -A`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Produkcyjne wywołanie deaktywacji w D1 i D6 w `src/` (`git grep` z numerami linii); nie tylko w testach.
2. Test `p6_zloze_wire_expire_tribute.rs` uruchamia produkcyjną funkcję tury (`run_dipl_steps` lub odpowiednik z bazy) na fixturze z grantami powiązanymi z umowami; asercje `active` zgodne z wektorami z generatora (wykonującego pin); liczniki: co najmniej jeden grant wygaszony w D1 i co najmniej jeden w D6; co najmniej jeden grant aktywny bez powiązania pozostaje aktywny.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0 w `rust-port/engine` (z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_zloze_wire_expire_tribute`; `cargo test --test p6_wire_war_dipl_steps`; `cargo test --test p6_zloze_grants_state`; `cargo test --test p6_r7k7b_zloze_sync`.
5. `git diff --stat` tylko na allowliście; `git diff --check` czysty.

## RAPORT I COMMIT
`01-operator-r1.md` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1/`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (SHA, allowlista)/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit na `wip/…`, BEZ push do parity. Treść commita bez nazwy modelu; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
