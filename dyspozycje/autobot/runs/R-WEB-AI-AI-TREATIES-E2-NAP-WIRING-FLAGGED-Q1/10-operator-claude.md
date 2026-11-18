# R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tor AI↔AI, domyślnie wyłączony)
TEMAT: R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1
GOAL: NAP AI↔AI wpięty w turę za przełącznikiem `torAktywny=false`; dopłata D złotem; kara P-4; wygaśnięcie 15 tur.
BAZA: fb5b2045ad2d3c7c744b1b79ac3d583dd985483f (origin/main).

ZMIANY/COMMIT: pliki allowlisty:
- `gra/data/ai-ai-treaty-params.json`: pole `torAktywny: false`.
- `gra/src/game/ai-ai-treaty-tick.ts` (nowy): czysta logika kroku (`planAiAiNapTreatyTickFull`), kara P-4, przełącznik.
- `gra/src/main.ts`: import; `tickAiAiTreatyRequests()` wołane raz po `tickAiAiWarWeariness` (przed `scanAutoSiegesAfterAiTurn`); gałąź kary w `breakTreatiesOnWar` (tylko przy torze, tylko AI↔AI, nie `bezKary`); hak `__truceTestDebug.aiAiTreatyTickForTest`.
- `gra/tools/ai-ai-treaty-nap-wiring-test.cjs` (nowy).
- Nietknięte: `ai-ai-treaty-evaluate.ts`, `ai.ts`, `diplomacy-proposals.ts`, `treaty-payment.ts`, `peace-tail-payment.ts`, UI.
- Commit: SHA w polu `sha` odpowiedzi strukturalnej.

TESTY:
- `ai-ai-treaty-nap-wiring-test.cjs`: 43/43 sprawdzeń OK; mutanty M1–M6 wykryte (brak przelewu D, zamiana płatnika, brak obrony skarbca, długość NAP +1, brak blokady pary, brak obrony przed rozejmem).
- Bramki: `tsc --noEmit` 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6.
- Diplo (PO, bez tabeli PRZED — NIE ZMIERZONO na bazie): treaty-payment wiring 468/0; treaties-ai-parity 80/0; treaties-power-parity 50/0; peace-tail integration 42/0; peace-tail proposal 9/0; war-peace-sim 25/0; ai-ai-treaty-evaluate 21/0; alliance-gate 21/0; ai-test 297/0.
- determinism-same-seed (statyczne reguły RNG): PASS.
- NIE ZMIERZONO: hash stanu gry 3 ziarna × 30 tur z flagą false przed/po (brak uruchomienia gry headless); wiring w turze nie testowany na żywo (hak civTest dodany, niewywołany).

ZAŁOŻENIA (do weryfikacji przez orkiestratora):
1. Kara −30 Relacji: `relationScore = Zaufanie·mZ + Respekt·mR`, więc −30 Relacji przeliczono na Respekt (`delta/mnoznikRespektu`, clamp 0..100). Brak w kodzie innego mapowania.
2. Kara −20 Zaufania: nalicza już istniejące zdarzenie `zlamana_obietnica_ai` w `breakTreatiesOnWar` (dla każdego zerwanego traktatu). Nie dopisywano drugiego.
3. Zawarcie NAP: `syncRelationFromDeals` (status „pokoj”); zdarzenie tylko w logu konsoli, bez nowego UI.
4. Gotowość celu: `aiDiplomacyStance(...).willingnessAlly` z zastępczymi graczami i `turnsAtWar:0` (wzorzec sojuszy siostrzanych).
5. Granica: `ownersShareLandBorderLive`. Limit: jedna próba na proponenta na turę; pary nie powtarzają się w turze.
6. Wasal (deal `Wasalizacja`) wyłączony z kroku.

BLOKADY: brak. Test PASS, bramki zielone. Otwarte: pomiar ≥3×150 tur (E6) przed włączeniem na ROBOCZEJ; decyzja właściciela o mapowaniu P-4 (założenie 1).

RUNDY: 1/5, ostatni werdykt: PASS-WITH-NOTES.
NASTĘPNY KROK: Evaluator (kod + test), potem Final Control; integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

Ścieżki /tmp (do sprzątnięcia przez orkiestratora): /tmp/claude-npmci.log, /tmp/claude-tsc.log, /tmp/claude-tsc2.log, /tmp/claude-dbg.cjs, /tmp/claude-ai-test.log, /tmp/claude-det.log, /tmp/claude-diplo-*.log. Katalog `gra/node_modules` (ignorowany przez git) z `npm ci --ignore-scripts`.
