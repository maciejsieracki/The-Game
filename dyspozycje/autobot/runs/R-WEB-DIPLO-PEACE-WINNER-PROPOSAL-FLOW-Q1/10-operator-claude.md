# R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 — Operator (runda 2 wg dispatchu; baza af97dd370)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1
GOAL: pkt 3 (konkretny powód odmowy z liczbami + zbadanie tabeli) — zbadane i pokryte testem tabelarycznym; pkt 2 (kierunek płatności) — DECISION_REQUIRED, bez zmiany kodu; dowód live Chromium — NIE ZMIERZONO.
ZMIANY-COMMIT: kod gry bez zmian (zmiana tylko testowa). Nowy plik `gra/tools/diplo-winner-proposal-table-test.cjs`, commit `e22c737271b575d3c0e8f2cb7f37227b8e47ff1a`. Ten raport jest w commicie następującym po nim.

## Tabela (evaluateProposal, akcja 'pokoj', wojna, zaufanie 0)

Pełna tabela: 60 wierszy (autor × adresat × tury 5/10/11 × miasta 0/1/3/6/8), wynik w `gra/tools/diplo-winner-proposal-table-test.cjs`.

| autor → adresat | tury 5 | tury 10 | tury 11 | zmęczenie (L) |
|---|---|---|---|---|
| gracz → silniejsza AI | odmowa: „dostępne po 10 turach” | odmowa: „Silniejsza AI wymaga miasta ≥ 4500 PW… miasta w ofercie warte 0 PN” (L 25%) | odmowa jak wyżej, ≥ 4350 PW (L 28%) | przy L 100% (8 miast) — accepted |
| gracz → słabsza AI | odmowa: „dostępne po 10 turach” | odmowa: „Brakuje 4050 PW… (baza 4500)” | odmowa: „Brakuje 3915 PW… (baza 4350)” | L 85%: „Brakuje 810 PW… (baza 900)”; L 100%: accepted |
| AI → gracz (AI autorem) | odmowa: „dostępne po 10 turach” | accepted (L 25–58%) | accepted | accepted (L 88–100%) |

Wnioski z tabeli:
1. Odmowa silniejszej AI ma konkretny powód z liczbami (cena miastem, wymagane PN, wartość miast w ofercie). Potwierdzone we wszystkich wierszach gracz→silniejsza.
2. Słabsza, zmęczona AI nie odrzuca propozycji gracza z powodów własnych. Blokuje wyłącznie bramka PW autora-gracza („Brakuje N PW … dopłać, by wysłać”), która zapada przy ujemnym bilansie. Przy L 100% (cena 0) pokój przechodzi.
3. Komunikat „Brakuje N PW” jest wewnętrznie spójny: N = wymagany bilans po rabacie relacji (≈ 90% bazy w tym fixture), a „baza” w nawiasie to wartość PRZED rabatem. Gracz widzi więc N inne niż bazę bez wyjaśnienia rabatu. Kierunek płatności (gracz dopłaca) to sprawa z pkt 2 — nie zmieniam.
4. AI-autor pokoju nie zależy od siły adresata (bramka r5 działa tylko gdy autor to gracz). Zgodne z kodem, nie błąd.

## Testy (surowe wyniki, ten commit)

- `npx tsc --noEmit` → exit 0
- `node tools/diplo-winner-proposal-table-test.cjs` → SUMA: PASS=41 FAIL=0 (nowy)
- `node tools/diplo-peace-winner-proposal-flow-test.cjs` → SUMA: PASS=49 FAIL=0
- diplomacy-locks-test → 88 passed, 0 failed
- diplo-peace-balance-accept-test → 32 pass / 0 fail
- diplo-peace-weaker-seeks-city-only-test → 35 pass / 0 fail
- diplo-war-peace-gate-test → 24 pass / 0 fail
- diplo-truce-r1-test → 31 pass / 0 fail
- logic-test → LOGIC OK (213/213); tech-tree-test → 20 pass, 0 fail; research-test → ALL GREEN; unit-replace-archer-slinger-test → 51 OK, 0 FAIL; combat-test → All sanity checks passed.
- Nie uruchomiono: weaker-seeks/main-guard/gate G/truce-r4 (znane czerwone przed zmianą, poza zakresem).
- Mutacja: nie wykonana (brak zmiany kodu gry do mutowania).

## BLOKADY / DECISION_REQUIRED

**DECISION_REQUIRED — kierunek płatności za pokój (GOAL pkt 2).** Bramka `diplomacy-proposals.ts` ~l.1670 nadal wymaga dopłaty od gracza-autora przy ujemnym bilansie PW; cytat ECHO 2026-09-07 w tym samym pliku ją uzasadnia, a dispatch każe ją usunąć. Opcje A (usunąć bramkę PW dla gracza, płaci przegrywający miastami; rekomendacja), B (zostawić + komunikat „dopłać N PW”), C (hybryda: bez dopłaty przy oddaniu miasta). Wymaga odpowiedzi właściciela; kod nietknięty.

- Dowód live Chromium (fixture wojna ≥11 tur, zmęczenie ~28%, przycisk wyszarzony + powód w UI): NIE ZMIERZONO — brak przygotowanego fixture i sterownika w tej rundzie; nie zaliczam.

## RUNDY / NASTĘPNY KROK

RUNDY: 2/5 (dispatch). Następny krok: Evaluator sprawdza tabelę i test; decyzja A/B/C z pkt 2 do właściciela; osobny temat na live Chromium po decyzji.
UWAGI-DLA-ORKIESTRATORA: `gra/node_modules` zainstalowane w worktree (`npm ci --ignore-scripts`, nie w commicie). Dysk `/`: 6,0 GB wolne przed testami. Nie tworzono sesji, zadań ani harmonogramów; nie integrowano, nie pushowano.

DEPLOY/PUSH: NIE WYKONANO
