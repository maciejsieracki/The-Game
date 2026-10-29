# Final Control — R-BITWA-ATAK-MARSZEM-HEX-Q1

Werdykt: **PASS-WITH-NOTES**, etap 8/11; integracja do wspólnego kandydata dalej wymagana.

## Weryfikacja

- Oceniony commit: `efe9ab1e`; Operator i Defense są opisani w `10-operator.md` i `21-operator-defense.md`; niezależna ewaluacja Defense PASS-WITH-NOTES w `22-evaluator-r2.md`.
- Niezależnie uruchomiłem `battle-attack-move-order-test.cjs`: PASS. Test pokrywa napotkanego wroga i wznowienie do waypointu, wyczerpaną amunicję, bloker terenu, ruch grupowy, kolejkę, anulowanie/zastąpienie oraz rozdział rozkazów Move/Attack.
- `battle-manual-choice-contract-test.cjs`: 9/9 PASS.
- `npm run typecheck`: PASS.
- `git diff --check 747ade419e9771f5a94eb1f82f174ceda100eaa1..HEAD`: PASS.
- Operator build: Vite PASS; operator i evaluator Chromium pointer PASS dla waypointu, zwykłego Move i exact-target Attack.

## Granice dowodu

- Chromium pointer harness ma jedną jednostkę na stronę. Grupa 42 jednostek jest pokryta testem kolejki/metod produkcyjnych, nie pointer-driven pełną bitwą.
- Aktywna scena taktyczna nie jest serializowana przez obecny zapis gry; wznowienie rozkazu po zapisie/wczytaniu leży poza tym zakresem.

Brak blokera dla zatwierdzonego zakresu rozkazu. Merge, deploy i push: niewykonane.
