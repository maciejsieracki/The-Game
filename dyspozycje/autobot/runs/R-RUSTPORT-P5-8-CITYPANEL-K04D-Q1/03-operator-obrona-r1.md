STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora r1 (verdict PASS-WITH-NOTES) dla K04D (7 kart TopBar).
BAZA: commit Operatora r1 `c04f7d50` (HEAD przed obroną, detached). Kod `7b27a5b1`, harness/raport `b4f7adce`, pomiary `c04f7d50`. Baza parity: `57242124` (przodek).
ZMIANY: wyłącznie `src-tauri/frontend-v2/tools/dom-harness/run-k04d-units.mjs` (+36 linii: 13 nowych wektorów, port reguł testowy) i `mutate-k04d-units.mjs` (+8 linii: 7 nowych mutacji). Zero zmian w `src/`, `gra/**`, rust-port, `WERSJE.md`, `package.json`.

## Odpowiedź na zarzuty

1. Nauka (osobny bank), moneySnap (k04d-gospodarka.ts:125) — PRZYJMUJĘ. Dodany wektor `zloto:snap-nauka` = "+4" (pin :5874). Mutacja zerowania `moneySnap.nauka` wykryta.
2. "→ z handlu (szac.)" (k04d-gospodarka.ts:192) — PRZYJMUJĘ. Wektor `nauka:z-handlu` = "~+6" (wyliczenie: netto=23 z nauka=7 i udział 30%, est.nauka=floor(23·30/100)=6, K01A `HANDEL_KORUPCJA_PCT_PLACEHOLDER`=5). Mutacja wyłączenia wiersza wykryta. Dodatkowo dodane wektory estymat Złota: `zloto:netto-szac` "~23 → split suwaków" i `zloto:do-skarbu` "~+11" (pin :5889-5890), mutacja +1 wykryta.
3. Auto-korekta Żywności (k04d-zycie.ts:64) — PRZYJMUJĘ. Wektory przy poziomRacji=5 > maxSafe=3: `zyw:auto-korekta` (tekst zgodny z pinem :5619-5620), `zyw:clamp-koszt` "−5 🍞/t (Wyżywienie 3)", `zyw:clamp-bilans` "+5 🍞/t", oraz `zyw:brak-auto-korekty` dla przypadku bez przycięcia. Mutacja `if (false)` wykryta.
4. Fallback `relSt?.udzialPct` (k04d-kultura.ts:83) — PRZYJMUJĘ. Wektory `rel:udzial-fallback-dto` ("55% ludności" przy braku empire.religionSharePct) i `rel:udzial-empire-pierwszy` ("70%" przy kolizji źródeł). Mutacje: usunięcie fallbacku i odwrócenie kolejności — obie wykryte.
5. Ludność przy przycięciu (K04D-Z3, pin :5722-5727) — PRZYJMUJĘ CZĘŚCIOWO. Dodane wektory UI przy przycięciu: `lud:clamp-bilans` "+5 🍞/t" (bilans z przyciętego foodSplit.total, pin :5736), `lud:clamp-wyzywienie` "5", `lud:clamp-tury-z-dto` "za ≈ 3 tury" (tury z DTO). Mutacja użycia nieprzyciętego bilansu wykryta. NIE_ZMIERZONO: zgodność `growth.turnsToNextCitizen` z DTO z lokalnym przeliczeniem pina (`growthGainPerTurnSlots` na przyciętym bd.total) wymaga testu po stronie silnika Rust. Poza allowlistą tego tematu. Ryzyko przeniesione na silnik, zapisane jako otwarte.
6. `panelInputs.k04d` nie wypełnione przez kontroler, `wireTopBarStatDetails` nie podpięte (K09) — PRZYJMUJĘ jako notatkę. Stan był zapisany jako NIE_ZROBIONE/NIE_ZMIERZONO w P5-8-K04D.md §6. Bez zmian kodu w tej rundzie (poza allowlistą obrony).
7. Pokrycie mutacyjne „17/17” zawyżało obraz — PRZYJMUJĘ. Stan obecny: 24/24 wykrytych (17 z r1 + 7 nowych, w tym 5 zarzutów Evaluatora). Uwaga: 24 mutacje to próbka punktów, nie pełne pokrycie wszystkich pól DTO kart K04D. Wcześniejsze „17/17” w `02-operator-pomiary-r1.md` jest zastąpione tym raportem.

## Wynik bramek (na HEAD obrony, po zmianach)

- `npm ci` (src-tauri/frontend-v2) EXIT 0.
- `npm run typecheck` EXIT 0.
- `npm run check` EXIT 0: self-test 33/15 błędów 0; check-no-logic-imports pliki=169 trafienia=0; verify-pin-copies pin=edb8fb56 plików=435 niezgodnych=0.
- `node tools/dom-harness/run-k04d-units.mjs` EXIT 0: wektory=80 zielone=80 bledne=0 jsdomErrors=0 (było 67).
- `node tools/dom-harness/mutate-k04d-units.mjs` EXIT 0: mutacje=24 wykryte=24 niewykryte=0 (było 17).
- Regresja K04C (`run-k04c-units.mjs`) nie była uruchamiana w tej rundzie: zmiany dotyczą wyłącznie `run-k04d-units.mjs` i `mutate-k04d-units.mjs`, a bundle K04C nie zawiera kart K04D. Wynik r1 84/84 pozostaje z `02-operator-pomiary-r1.md`.
- `git diff --check` EXIT 0. `git status`: tylko 2 pliki harnessu zmodyfikowane.

## Ważna zmiana techniczna harnessu

Ścieżka przycięcia (`clampedGrowthBreakdown`) wywołuje `reguly()` z `k01b-reguly.ts`, którego r1 nie wstrzykiwał. Dodano moduł do wejść bundla i testowy port z jedną metodą `rationGrowthPercent(level) = level − 4` (zgodne z fixture `growthBreakdown.racje = -1` przy poziomie 3). Pozostałe metody portu są celowo niezdefiniowane, więc ich wywołanie przerywa harness (EXIT 2), a nie maskuje błędu. Port testowy nie jest produkcyjnym portem kontrolera (jak w K01B).

## Co pozostaje NIE_ZMIERZONO

- Zgodność DTO z silnikiem Rust (`turnsToNextCitizen`, `fed`, `wyzwienieSummary`, `tick`, `moneySnap`, `podzialHandlu`) — po stronie silnika, poza tym tematem.
- Harness 1:1 z pinem na żywo (nie porównuje z działającym pinem; wartości są wypisane z kodu pinu z numerami linii).
- Podpięcie `panelInputs.k04d` i `wireTopBarStatDetails` (K09).

## Rekomendacja

PASS-WITH-NOTES. Zarzuty 1–4 i 7 zamknięte dowodem (wektory + mutacje). Zarzut 5 zamknięty na poziomie UI, pozostała część NIE_ZMIERZONO. Zarzut 6 przyjęty jako notatka.

NASTĘPNY KROK: Evaluator (re-weryfikacja r2 na nowym commicie), potem Final Control, potem integracja orkiestratora.
RUNDY: 1/5 (obrona w tej samej rundzie, bez zmiany ID tematu).
DEPLOY/PUSH: NIE WYKONANO
