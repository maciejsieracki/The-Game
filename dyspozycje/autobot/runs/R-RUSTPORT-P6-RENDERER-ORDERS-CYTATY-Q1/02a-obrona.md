# 02a — Obrona Operatora, R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL (komentarze źródłowe renderera)
TEMAT: R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1
GOAL: cytaty linii w `rust-port/renderer/src/battle/orders.rs` zgodne z pinem `07d2fbd72`
ZMIANY/COMMIT: `rust-port/renderer/src/battle/orders.rs` (wyłącznie komentarze) + ten plik; baza = commit Operatora `1d766e1da` (rodzic `7d8993c42`); lokalna gałąź `rust-port-wip/R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1-obrona-r1`
TESTY: patrz §Bramki
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Zarzut 1: hashe 601fc3baf i 96d088b4d w nagłówku. PRZYJMUJĘ

Dowód problemu: `git merge-base --is-ancestor 601fc3baf 07d2fbd72` i `... 96d088b4d 07d2fbd72` dają w obu przypadkach kod 1, czyli te commity NIE są przodkami pinu.

Poprawka: z nagłówka usunięto oba hashe. Zamiast nich jest wskazanie pinu:
"both behaviours are present in pin `07d2fbd72` (`:5994`, `:6013`, `:18682`)".
Sprawdzone przez `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '5994p;6013p;18682p'`:

- 5994: `if (cand && this._manualMode && this._queuedOrderUnitIds.delete(cand.bu.id)) {`
- 6013: `if (this._manualMode && this._queuedOrderUnitIds.delete(u.bu.id)) {`
- 18682: `private _issueBattleAttackMove(col: number, row: number, queueOnly: boolean): void {`

Odwołanie do `edb8fb56` zostaje bez zmian. Jest już opisane jako "not an ancestor of pin", co Evaluator potwierdził.

## Zarzut 2: komentarze w liniach 179 i 256 dłuższe niż 100 znaków. PRZYJMUJĘ

Poprawka: oba komentarze `///` zawinięto do 100 znaków lub mniej. Treść i numery (`:6013`, `:5994`, `:17410`, `:19095`) zostały bez zmian.
Po zmianie `grep '^.{101,}$'` znajduje w pliku tylko 3 wiersze tabeli markdown w nagłówku `//!` (wiersze 14, 15 i 17). Wiersza tabeli markdown nie da się zawinąć bez rozbicia tabeli w rustdoc, a zarzut tych wierszy nie obejmował.

## Zarzut 3: zakres `:5979-5993` zaczyna się od sygnatury funkcji. ODRZUCAM (bez zmian)

Dowód: Evaluator sam stwierdza, że zakres jest literalnie zgodny z wiążącą tabelą 02a (dispatch: "Ta tabela jest wiążąca"). Dispatch zabrania zgadywania numerów spoza tabeli. W pliku `:5979` jest podany jako początek `_activateNext`, a `:5993-5994` jako skan kandydatów. Wszystkie numery zgadzają się z pinem w sed (potwierdzenie Evaluatora). Zarzut nie wskazuje błędu.

## Bramki (po poprawkach)

- `cargo fmt --check` w `rust-port/renderer`: EXIT 0
- `git diff --check`: czysto
- liczba zmienionych linii niebędących komentarzem (`git diff -U0`, linie +/- bez `//`): 0
- bez kompilacji i bez `cargo test`, zgodnie z dispatchem (zmienione są tylko komentarze). Cargo.lock nie został zmieniony.
