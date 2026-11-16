# DISPATCH R-RUSTPORT-P6-ZLOZA-ROZP-Q1 (runda 1) — rozpoznanie wpięcia deactivate_zloze_grants i sync_relation_status (#300, #104/#172)

MODEL: HAIKU (Operator), SONNET (Evaluator). TYLKO ODCZYT, bez kodu, bez cargo.
BAZA: `origin/rust-port/parity-v2` = `0fccd8dbf`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt, web-first).

## PYTANIA
1. W pinie: gdzie są wołane `deactivateZlozeGrantsForDeal` / `syncRelationStatusFromDeals` (lub odpowiedniki nazw; `git grep -n` w `gra/src`, podaj plik:linia) i w jakiej fazie tury?
2. W Rust: gdzie są zdefiniowane `deactivate_zloze_grants_for_deal` i `sync_relation_status_from_deals`, kto je woła poza testami (`git grep -n ... 0fccd8dbf -- rust-port/engine/src ':!**/tests/**'`)?
3. Jaka jest lista wpięć do zrobienia (punkt wpięcia w turze, zależności od stanu), bez implementacji.
4. Czy #104 i #172 są już zrobione na parity (czy wołający produkcyjny istnieje)?

## WYJŚCIE
- `dyspozycje/rust-port/p6/ZLOZA-WIRING-ROZPOZNANIE.md` (NOWY): tabela pin ↔ Rust, status wpięcia (ZINTEGROWANE tylko przy wołającym produkcyjnym), lista kroków.
- Niepewne miejsca: NIE_ZMIERZONO. Commit jawnym git add, bez zmian kodu, bez push do parity.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/ZLOZA-WIRING-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZA-ROZP-Q1/**`
