STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1
GOAL: Port 57 odroczonych jednostek K01 (pin `edb8fb56` gra/src/ui/cityPanel.ts) do src-tauri/frontend-v2/src/ui/cityPanel/k01b-*.ts; typy z game/data przez DTO, reguły przez port, bez importów logiki.
ZMIANY/COMMIT: baza origin/rust-port/parity-v2 b31cd50c (detached). Commity kodu:
- 751519fc T (26) + k01b-dto.ts + k01b-reguly.ts
- 61a820f5 R (15)
- 9ab13e45 F (6)
- e40f8ce8 DOM (10)
- 9a67233e docs: dyspozycje/rust-port/p5/P5-8-K01B.md, PORTING-QUEUE.md (dopisek)
- commit raportu: patrz wiadomość zwrotna (SHA raportu nie może być w samym raporcie)
Allowlista: src-tauri/frontend-v2/src/ui/cityPanel/k01b-* (nowe), dokumenty wyżej. Zero zmian w gra/**, rust-port poza branchem, WERSJE.md, package.json, tools/.
TESTY:
- npm ci: EXIT 0. npm run typecheck (tsc --noEmit): EXIT 0.
- npm run check: self-test 33/15; check-no-logic-imports 153 plików, trafień 0; verify-pin-copies 435, niezgodnych 0. EXIT 0.
- Kontrola wierności kopii (skrypt ad hoc): 681 linii pinu; 41 jednostek ma linie zmienione (renamy typów, reguły przez reguly().X, skrócone JSDoc). NIE_ZMIERZONO: pełna zgodność komentarzy.
- Harness DOM vs pin (wzór run-k01a.mjs): NIE_ZMIERZONO (dispatch: pomiary w kolejnej rundzie).
- Mutacje pól DTO: NIE_ZMIERZONO (kolejna runda).
- git diff --check: NIE_ZMIERZONO w tej rundzie (brak nagłówka; typecheck/check zielone).
BLOKADY: brak blokady technicznej. Luki rozstrzygnięte ZAŁOŻENIAMI K01B-Z1..Z7 (P5-8-K01B.md).
RUNDY: 1/5. Decyzja wymagana: NIE.
NASTĘPNY KROK: Evaluator, potem Final Control na commitach 751519fc..9a67233e. Osobno: harness DOM 57 jednostek vs pin i mutacje (kolejna runda Operator-pomiary); podłączenie CityPanelRulesPort w src/controller/** (poza tym tematem, wymaga osobnego tematu); zgodność CityProductionK/BuildingDefK z viewmodel/types.ts.
DEPLOY/PUSH: NIE WYKONANO
