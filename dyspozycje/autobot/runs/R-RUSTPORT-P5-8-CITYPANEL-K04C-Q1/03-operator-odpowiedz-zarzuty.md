STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1
GOAL: Batch 4a K04C (8 jednostek, pin edb8fb56) — odpowiedź Operatora na zarzuty Evaluatora (werdykt PASS-WITH-NOTES, baza commita Operatora 998bf48d).
BAZA ODTWORZENIA: 998bf48d (detached, worktree wf_03c48b0e-64b-4).

## Odpowiedzi na zarzuty

1. Zarzut: `P5-8-K04C.md` §4 podaje „76 wektorów”, harness ma 84. — PRZYJMUJĘ.
   Poprawka: §4 zmienione na „84 wektory (r1: 76, r2: +8)”; §5 bez zmian (już 84). Dowód: `dyspozycje/rust-port/p5/P5-8-K04C.md` §4, `node tools/dom-harness/run-k04c-units.mjs` → wektory=84 zielone=84.

2. Zarzut: allowlista nie obejmuje `src-tauri/frontend-v2/package.json` (skrypty `harness:k04c`, `harness:k04c:mutate`). — PRZYJMUJĘ, bez prośby o wyjątek.
   Poprawka: `package.json` cofnięte do bazy 9d7a55d5 (`git diff 9d7a55d5 -- src-tauri/frontend-v2/package.json` = pusty). Bramki uruchamiane wprost przez `node tools/dom-harness/run-k04c-units.mjs` i `node tools/dom-harness/mutate-k04c-units.mjs` (z `src-tauri/frontend-v2/`). Zaktualizowane odwołania: `P5-8-K04C.md` §4–5, `PORTING-QUEUE.md` (wpis K04C), `02-operator-pomiary-r2.md`. Nie zostało `npm run harness:k04c` w żadnym pliku allowlisty (weryfikacja: grep).

3. Zarzut: wektory i kod z jednej lektury pinu; 1:1 na żywo NIE_ZMIERZONO. — PRZYJMUJĘ (ograniczenie zapisane, bez zmiany kodu).
   Dowód spot-checku numerów linii: pin `gra/src/ui/cityPanel.ts` z `git archive edb8fb56` (wyjęty do `/tmp/claude-0/k04c-pin/gra/src/ui/cityPanel.ts`, poza repo) — linie 3497–3498 (`state.prawLines`), 3892 (`thresholds.find`), 3963 (`Dominująca`), 3966 (`Wpływ na Szczęście`), 4883 („Pula zamożności”), 5521 („Wyżywienie”), 5569 („Wojsko”) zgodne z cytowaniami w harnessie. Zgodność 1:1 na żywo pozostaje NIE_ZMIERZONO (`P5-8-K04C.md` §6).

4. Zarzut: zmiany API względem pinu (`religiaSzPunktyK`, `resolveEmpireSnapK`, `resolveCityHealthK`, hook bez lokalnego przeliczenia) oparte na założeniach K04C-Z3/Z6/Z7. — PRZYJMUJĘ jako udokumentowane ryzyko integracyjne; bez zmiany kodu w tym temacie.
   Dowód: tabela było/jest `P5-8-K04C.md` §1 (wiersze 5–7), założenia Z6 i Z7 w §2 (linie 28–29). Rekomendacja: osobny temat integracyjny (wpięcie `panelInputs.k04c` w controllerze i porównanie wartości DTO z silnikiem Rust).

5. Zarzut: controller nie wypełnia `panelInputs.k04c`, więc zgodność wartości DTO z silnikiem Rust NIE_ZMIERZONO. — PRZYJMUJĘ (ten sam stan co pkt 4; już w `P5-8-K04C.md` §6 i w `PORTING-QUEUE.md`). Kryteria tematu (dispatch, KRYTERIA) wymagają harnessu wektorów, mutacji i tabeli było/jest, a nie pomiaru DTO na żywo; wypełnienie `panelInputs.k04c` z silnika Rust wymagałoby zmian w `controller/` poza zakresem batcha 4a, więc pozostaje jako otwarte ryzyko.

## Bramki po poprawkach (ten sam worktree, po `npm ci` EXIT 0)
- `npm run typecheck` EXIT 0 (`02-logi/typecheck.txt`)
- `npm run check` EXIT 0: self-test 33/15, 0 trafień importów logiki (166 plików), pin copies 435, niezgodnych 0 (`02-logi/check.txt`)
- `node tools/dom-harness/run-k04c-units.mjs` EXIT 0: wektory=84 zielone=84 bledne=0 jsdomErrors=0 (`02-logi/run-k04c-units.txt`)
- `node tools/dom-harness/mutate-k04c-units.mjs` EXIT 0: mutacje=37 wykryte=37 niewykryte=0 (`02-logi/mutate-k04c-units.txt`)
- `git diff --check` EXIT 0
- Zakres diffu względem 9d7a55d5: zero zmian w `gra/**`, `rust-port`, `WERSJE.md`, `package.json`.

## Stan NIE_ZMIERZONO (bez zmian)
- Harness 1:1 z pinem na żywo.
- Zgodność DTO z silnikiem Rust (K04C-Z1..Z5); `wyzwienieSummary`, `bd` przycięty, `turnsToNextCitizen` względem ścieżki `reguly()`.

## Zapisy
Commit poprawek: patrz raport końcowy (SHA). Push: NIE WYKONANO.
