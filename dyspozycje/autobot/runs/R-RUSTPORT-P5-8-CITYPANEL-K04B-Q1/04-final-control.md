STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1
GOAL: batch 3 K04 (8 jednostek), 19/32 lacznie.
OCENIANY COMMIT: 3c8349fe (baza 57efd4b3, poprzednio zintegrowane 9d7a55d5 = origin/rust-port/parity-v2).

BRAMKI (wlasne, pin: git archive edb8fb56 poza repo):
- allowlista: git diff --name-only 9d7a55d5..3c8349fe = tylko pliki dozwolone (k04b-*.ts, types.ts i commands.ts jako dopiski, tools/dom-harness/*k04b*, PORTING-QUEUE.md, P5-8-K04B.md, runs/.../K04B-Q1). Zero gra/**, WERSJE.md, rust-port. git diff --check czysty.
- npm ci exit 0; npm run typecheck exit 0; npm run check: self-test 33/15 bledow 0, no-logic-imports 165 plikow 0 trafien, verify-pin-copies 435 niezgodnych 0.
- run-k04b-units: PRZYPADKI=98 OK=98 ROZNICA=0. mutate-k04b-units: MUTACJI=36 WYKRYTYCH=36 PRZEZYTYCH=0.
- regresja: run-k04-units 22/OK 21/ROZNICA 0/ZALOZONA 1; run-k04-units-b2 17/17.

ROZSTRZYGNIECIE ZARZUTOW:
1. Kontrakt komend: ODDAL. Obrona 3c8349fe: EnqueueBuildCommand = Extract<ProposedCommand,'enqueue_build_item'>, przeciaganie przez istniejace move_build (commands.ts, dopisek). Typy sa teraz spojne z katalogiem komend; ujednolicenie enqueue_build/enqueue_build_item jawnie w K04B-Z5, batch 4 / podpinanie kontrolera (nie blokuje kryteriow tematu).
2. DTO bez producenta / brak weryfikacji splitu: ODDAL. Ten sam stan co ownedLevels/upkeepById z K04 batch 2 (zintegrowany, zalozenia K04-Z3, K04B-Z1/Z2); weryfikacja splitu w UI = liczenie regul gry (P5.13). Zgodnosc z Rust NIE_ZMIERZONO, uczciwie wykazana.
3. Liczba przypadkow 97 vs 98: NAPRAW. Obrona deklaruje korekte w P5-8-K04B.md i PORTING-QUEUE.md. P5-8-K04B.md poprawiony (98), ale src-tauri/frontend-v2/PORTING-QUEUE.md:237 nadal: "run-k04b-units.mjs (97 przyp., 97 OK)". Wpis w rejestrze kolejki jest nieaktualny wobec zmierzonych 98 (kryterium: wpis w PORTING-QUEUE.md). Poprawka: jedna linia, zmienic 97 na 98 w obu miejscach linii 237.

WERDYKT: FAIL (jeden NAPRAW, kosmetyczny, dokumentacyjny; kod i bramki zielone). Wraca do Operatora (ten sam ID, runda 2), potem Evaluator i Final Control. Po poprawce jednej linii oczekiwany PASS.
SHA DO INTEGRACJI: brak (FAIL). Kandydat po poprawce: 3c8349fe + commit poprawki; kolejnosc: bezposrednio na origin/rust-port/parity-v2 = 9d7a55d5 (3c8349fe jest jego potomkiem, fast-forward, bez konfliktow z poprzednia integracja).
DEPLOY/PUSH: NIE WYKONANO
