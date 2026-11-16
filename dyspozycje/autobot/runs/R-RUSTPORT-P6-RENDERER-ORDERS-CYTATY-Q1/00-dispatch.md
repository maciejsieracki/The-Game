# DISPATCH R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1 (runda 1) — poprawa cytatów linii pinu w `renderer/src/battle/orders.rs` (tylko komentarze)

DOMENA: RENDERER (komentarze źródłowe). MODEL: OPUS we wszystkich rolach (renderer — reguła właściciela).
BAZA: `origin/rust-port/parity-v2` = `7d8993c42` (zapisz SHA). Worktree detached. Pin: `07d2fbd72`.
ŹRÓDŁO: `dyspozycje/autobot/runs/R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1/02a-obrona.md`, §1 „Zarzut 3” — tabela docelowa (kolumna „poprawny zakres w pinie” i „treść wiersza”). Ta tabela jest wiążąca.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ.

## ZAKRES
1. W `rust-port/renderer/src/battle/orders.rs` zamień KAŻDY cytat `plik:linia` na numer z tabeli docelowej (funkcja i zakres w pinie `07d2fbd72`). Cytaty z `origin/main` lub `edb8fb56` usuń lub zastąp wskazaniem pinu.
2. Zweryfikuj każdy nowy numer: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'Np'` musi pokazać oczekiwaną treść.
3. Dopisz w nagłówku pliku jedną linię: „Numery linii wg pinu 07d2fbd72 (gra/src/battle/battleScene.ts)”.

## OGRANICZENIA
- Zmieniaj WYŁĄCZNIE komentarze (`//`, `///`, `/* */`). Zero zmian kodu. Sprawdź `git diff` — każda zmieniona linia musi być komentarzem.
- Jeśli któryś numer z tabeli nie zgadza się z pinem przy weryfikacji — zapisz BLOCK z dowodem, nie zgaduj.

## KRYTERIA KOŃCA
1. `cargo fmt --check` w `rust-port/renderer` EXIT 0 (bez kompilacji, bez cargo test — zmiana tylko komentarzy).
2. Tabela weryfikacji w raporcie: cytat (przed) | cytat (po) | treść w pinie (sed) | zgodne T/N.
3. Commit tylko w katalogu runu oraz w `rust-port/renderer/src/battle/orders.rs`, jawny `git add`. Bez push do parity.
4. Zero zmian poza tym plikiem i katalogiem runu.
