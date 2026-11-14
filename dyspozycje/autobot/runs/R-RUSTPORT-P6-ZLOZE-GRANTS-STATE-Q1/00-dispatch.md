# DISPATCH R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1 (runda 1)

TEMAT: ZLOZE-GRANTS-STATE — model `zloze_grants` w `DiplomacyState` (wariant „a” z pytania ABC, zatwierdzony przez właściciela 14.11). Zadanie #104 (część 1 z 2).
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `a381dd13f` (czubek `origin/rust-port/parity-v2`, sprawdzone 14.11). Worktree na gałęzi `wip/R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1` z tego SHA. PRZED pracą: `git merge-base --is-ancestor a381dd13f HEAD` musi być prawdą; inaczej przestaw na `a381dd13f` i napisz to w raporcie.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/diplomacy-pn-engine.ts` (linie 115–124: `ZlozeGrant`; 331–344: `suspendZlozeGrantsForWar`; 346–352: `deactivateZlozeGrantsForDeal`); `git show 07d2fbd72:gra/src/main.ts` (ok. 12613–12621: push grantu `zloze`; 12707–12709: suspend przy wojnie; 22774, 23694, 24234, 24294: deactivate; 47251–47253: wczytanie zapisu).

## GOAL
Stan dyplomacji w Rust przechowuje granty złóż (`zlozeGrants` z pina) jako jawne pole, zgodne z zapisem webowym, i udostępnia dwie operacje stanu: wygaszenie grantów przy wojnie (`suspend`) i wygaszenie grantów przy wygaśnięciu umowy (`deactivate`). Wiring do ścieżki produkcyjnej tury/handlu NIE należy do tego tematu (zostaje w #104 jako część 2).

## ZMIANY (tylko to)
1. `rust-port/engine/src/domain/diplomacy.rs`:
   - `ZlozeGrant` (ok. linia 4195): dodaj `Serialize, Deserialize` oraz `#[serde(rename_all = "camelCase")]`, aby klucze JSON były jak na pinie (`granterOwnerId`, `granteeOwnerId`, `partnerId`, `zlozeId`, `hexKey`, `active`, `dealId`). `deal_id: Option<String>` ma pomijać klucz przy `None` (`#[serde(skip_serializing_if = "Option::is_none")]`), bo na pinie to `undefined`.
   - `DiplomacyState` (ok. linia 1652): dodaj pole `pub zloze_grants: Vec<ZlozeGrant>`. Kontener ma już `#[serde(default)]`, więc stare zapisy bez pola muszą wczytać się jako pusta lista.
   - Dodaj wolną funkcję `suspend_zloze_grants_for_war(grants: &[ZlozeGrant], owner_a, owner_b) -> Vec<ZlozeGrant>` — port pina 331–344 (wygasza tylko aktywne granty między parą w obu kierunkach; reszta bez zmian).
   - Dodaj metody na `DiplomacyState`: `suspend_zloze_grants_for_war(&mut self, owner_a, owner_b)` i `deactivate_zloze_grants_for_deal(&mut self, deal_id: &str)`, delegujące do funkcji wolnych (istniejąca `deactivate_zloze_grants_for_deal` ok. 4207 zostaje).
   - Komentarz ok. linii 4184–4186 („Bez migracji: zadnych nowych pol w stanie gry”) — zaktualizuj: pole dodane świadomie (decyzja właściciela, wariant a), z odniesieniem do tego dispatchu.
2. Nowy test `rust-port/engine/tests/p6_zloze_grants_state.rs`:
   - wektory wygenerowane z pinu przez generator `rust-port/engine/tests/p6_zloze_grants_state_gen.mjs` (wykonuje tekst pina z `git show 07d2fbd72:...`, NIE ręczne wartości); wynik w `rust-port/engine/tests/p6_zloze_grants_state_vectors/vectors.json`; strażnik SHA-256 pliku wejściowego pina, jak w `p6_r7k7b_zloze_sync_gen.mjs`.
   - testy: (a) suspend na wektorach pina (para w obu kierunkach, granty innych par nietknięte); (b) deactivate na wektorach; (c) kompatybilność zapisu: JSON BEZ pola `zloze_grants` wczytuje się z pustą listą; (d) round-trip z grantami zachowuje klucze camelCase i pomija `dealId` przy `None`; (e) liczniki niepustości > 0 (co najmniej jeden grant aktywny przed i nieaktywny po).
   - Brak `#[ignore]`, brak osłabionych asercji.

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/diplomacy.rs`
- `rust-port/engine/tests/p6_zloze_grants_state.rs` (NOWY)
- `rust-port/engine/tests/p6_zloze_grants_state_gen.mjs` (NOWY)
- `rust-port/engine/tests/p6_zloze_grants_state_vectors/vectors.json` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `diplomacy_basket.rs` (bez zmian: już przyjmuje `&mut Vec<ZlozeGrant>`), jakikolwiek wołający w `src/` poza `diplomacy.rs`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Pole `zloze_grants` istnieje; stary zapis bez pola wczytuje się (test c).
2. Suspend i deactivate zgodne z wektorami pina (test a, b); generator uruchomiony, SHA-256 zgodny.
3. Brak wołającego w produkcji jest DOZWOLONY w tym temacie (wiring = #104 część 2); raport musi to napisać wprost.
4. Bramki EXIT 0 (w `rust-port/engine`, z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<poza repo>`): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_zloze_grants_state`; `cargo test --test p6_r7k7b_zloze_sync` (regresja). Po bramkach usuń katalog `CARGO_TARGET_DIR`.
5. `git diff --stat` tylko na allowliście; `git diff --check` czysty.

## RAPORT
`01-operator-r1.md` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1/`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (SHA, allowlista)/TESTY (dokładne kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit kodu i raportu na `wip/R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1`, BEZ push do parity-v2.
