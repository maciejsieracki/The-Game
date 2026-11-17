# R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1 — obrona Operatora r2 (odpowiedź na zarzuty Evaluatora, runda 2)

STATUS: DECISION_REQUIRED (zarzut 2: wariant żelaza; zarzut 3: Chromium NIE ZMIERZONO)
DOMAIN: GAME (Zastąp, AI-awans, tabela zamian, testy gra/tools)
TEMAT: R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1
GOAL: Procarz jako cel „Zastąp" dla wszystkich łuczników (Inkowie oba warianty, narodowi łucznicy), gracz i AI, pełny koszt; wariant żelaza do decyzji właściciela.
BAZA: c67967d1bb745aeae5b00ba7ea7d967538937b2a (kandydat r1/r2 Operatora), gałąź detached w worktree
ZMIANY-COMMIT: patrz sekcja „Commit" na końcu

## Odpowiedzi na zarzuty Evaluatora (d287afea)

| # | Zarzut (Evaluator) | Obrona (Operator r2) | Dowód |
|---|---|---|---|
| 1 | AI nie awansuje Łucznika nubijskiego/akadyjskiego/asyryjskiego (Brąz→Brąz) przez warunek epoki w `ai-era-unit-promotion.ts:60` | **PRZYJMUJĘ — naprawiono.** Dodano wąski wyjątek same-epoch: wyłącznie źródła `Łucznik nubijski/akadyjski/asyryjski` → cel `Procarz`. Pozostały warunek wzrostu epoki bez zmian dla wszystkich innych par. | `gra/src/game/ai-era-unit-promotion.ts`: `SAME_EPOCH_ARCHER_DOWNGRADE_SOURCES`, `isSameEpochArcherDowngrade`, warunek `if (!higherEpoch && !sameEpochArcherOk) return false;`. Test: `unit-replace-archer-slinger-test.cjs` blok 11 — AI nubijski/akadyjski/asyryjski → `ok`, Procarz, skarbiec 100→96, drewno 100→75 (wynik: OK). Bramka Koszar dla AI nubijskiego OK; bramka drewna dla AI nubijskiego OK; mutacja kopii (AI nubijski „—") → FAIL oczekiwane, `ok:false`. Zakres poza allowlistą: plik `ai-era-unit-promotion.ts` jest na liście plików do zbadania w dispatchu; decyzja właściciela 2026-11-17 („gracz i AI") obejmuje ten krok. ZAŁOŻENIE do FC: zakres pliku uznany za dopuszczony. |
| 2 | Wzmianka „jednostka żelaza” bez celu w danych; Procarz Brąz-only, a pojawia się w epoce Żelaza | **PRZYJMUJĘ jako obserwację, NIE dodaję celu.** Dane (units.json): jedyne jednostki dystansowe z `Dostępna w epokach` zawierającym Żelazo to trzy narodowe łuczniki (`Brąz;Żelazo`, Typ=Distance). Brak w danych jednostki Żelaza typu Distance/Slinger. Zgodnie z dispatchem (pkt b) NIE dodaję przejścia „do jednostki żelaza” bez jednoznacznego celu. | Tabela ustalenia (typ → cel dziś → cel proponowany): **Łucznik nubijski / akadyjski / asyryjski (Brąz;Żelazo)** → dziś Procarz (Brąz Standardowa) → cel do decyzji. **Procarz** → Brąz, nie ma celu w Żelazie. Decyzja A/B/C poniżej. |
| 3 | Kryterium (e): okno „Zastąp” z nowym przejściem w żywym Chromium NIE ZMIERZONO | **PRZYJMUJĘ jako NIE ZMIERZONO (otwarte).** Nie zbudowano gry: w `/tmp/claude-0/nm/node_modules` brak `vite` i `typescript`, więc nie da się wykonać `vite build` ani `tsc`. `/usr/bin/chromium` istnieje, ale bez buildu nie ma czego otworzyć. Nie podaję tego jako zmierzone. | Brak wyniku; wymagany pomiar po dostarczeniu środowiska (vite + typescript) albo w grze właściciela. |
| 4 | Oszczepnik (Estólica) potraktowany jako łucznik Inków bez potwierdzenia | **ODRZUCAM część dotyczącą Estólicy; PRZYJMUJĘ część dotyczącą pozostałych oszczepników.** Estólica (`Oszczepnik (Estólica)`) ma `Kultura: Inkowie` i jest dystansową jednostką Inków — mieści się w zakresie dispatchu („łuczników/dystansowych jednostek Inków”). Oszczepnik generyczny (bez Kultury) i Oszczepnik Zulu (Kultura: Zulusi) nie są Inkami — NIE dostają przejścia. | `units.json`: linia Estólicy `Kultura: "Inkowie"` (wiersz 1609–1611); Zulu/generyczny bez wpisu Inków. Asercje w teście blok 11: Estólica Brąz (Inkowie) → Procarz + Huaracoc; Rzym → bez Huaracoc; Kamień → brak. ZAŁOŻENIE: „wszyscy łucznicy” = łucznicy i dystansowi Inków + narodowi łucznicy; oszczepnicy poza Inkami pozostają poza zakresem. Do potwierdzenia przez właściciela (pozycja decyzji D). |
| 5 | Cienkie pokrycie testowe akadyjskiego/asyryjskiego (brak kosztu, bramki Koszar, mutacji) | **PRZYJMUJĘ — uzupełniono.** Dodano dla AI akadyjskiego i asyryjskiego asercję kosztu (96/75). Bramka Koszar i mutacja kopii dodane dla AI nubijskiego (reprezentant wyjątku). Gracz akadyjski/asyryjski: nadal tylko „Procarz na liście” (bez osobnej mutacji — zarzut częściowo zaakceptowany). | Wynik: `unit-replace-archer-slinger-test.cjs` 43 OK, 0 FAIL (było 38 OK). |
| 6 | Operator nie uruchomił pięciu bramek referencyjnych | **PRZYJMUJĘ — uruchomiono teraz** (liczby z surowego wyjścia, poniżej). Tsc: NIE ZMIERZONO (brak typescript w środowisku). | Patrz sekcja TESTY. |

## TESTY (liczby z surowego wyjścia, kandydat + zmiany r2)

Uruchomiono w `gra/` (node_modules = symlink do `/tmp/claude-0/nm/node_modules`, nie commitowany):

- `node tools/unit-replace-archer-slinger-test.cjs` → `[unit-replace-archer-slinger-test] 43 OK, 0 FAIL` (baza kandydata 38 OK; po r2 43 OK)
- `node tools/unit-replace-promotion-table-test.cjs` → `PASS: 30 wpisów źródłowych, 62 krawędzi, brak cykli`
- `node tools/ai-era-unit-promotion-test.cjs` → `AI era promotion + Ox metadata: 17 passed, 0 failed` (exit 0)
- `node tools/ai-unit-replace-same-rules-test.cjs` → `ai-unit-replace-same-rules: 45 passed, 0 failed`
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/unit-replace-full-cost-test.cjs` → `unit-replace pelny koszt: 39 passed, 1 failed` (dług bazowy, wg Evaluatora identycznie na 4183b861; NIE naprawiam tutaj)
- Mutacja: `units.json` z bazy 4183b861 podstawione tymczasowo → `archer-slinger` `33 OK, 10 FAIL` (m.in. nubijski/akadyjski/asyryjski/Estólica, AI nubijski, AI Estólica); `promotion-table` FAIL dla Łucznika asyryjskiego i Oszczepnika (Estólica). Po mutacji `units.json` przywrócony z kandydata (`git checkout --`).
- `tsc --noEmit`: NIE ZMIERZONO — w środowisku brak paczki `typescript` (i `vite`) w `/tmp/claude-0/nm`; `node` nie znajduje `typescript/bin/tsc`. Zmiana `.ts` jest mała (typy: `ReadonlySet<string>`, `string`), ale typecheck NIE został wykonany.
- Chromium (kryterium e): NIE ZMIERZONO (patrz zarzut 3).

## Zarzut 2 — decyzja do właściciela (DECISION_REQUIRED)

Pytanie ABC: co ma być celem „Zastąp” dla łuczników Brązu/Żelaza (nubijski, akadyjski, asyryjski) w epoce Żelaza?

- **A** — zostawić jak jest: Procarz (Brąz) również w Żelazie; bez zmian w danych. Rekomendacja Operatora: najmniejszy zakres, zgodny z dosłowną wypowiedzią „wszyscy łucznicy finalnie przechodzą na procarze”.
- **B** — dodać przejście łucznika Żelaza do innej jednostki Żelaza: w danych NIE MA dystansowej jednostki Żelaza; wymaga wskazania nazwy/typu (nie zgaduję).
- **C** — ograniczyć Procarz (cel) do epoki Brązu (`Dostępna w epokach`/bramka epoki w Zastąp), a łuczników Żelaza zostawić bez zamiany do czasu wskazania celu. To zmienia zachowanie w epoce Żelaza dla łuczników — wymaga decyzji.

Do decyzji (osobno): pozycja D — czy oszczepnicy poza Inkami (generyczny, Zulu) mają również dostać Procarza (obecnie NIE).

## Pozostałe otwarte luki (jawnie)

- Chromium (e): NIE ZMIERZONO.
- tsc: NIE ZMIERZONO.
- full-cost 39/1: dług bazowy, nie naprawiany w tym temacie.
- Rust REPIN tabeli zamian: dług (nie w zakresie).
- Wiki/Civpedia i wikiBundle: NIE zmieniano (zmiana nie dotyka tekstów wiki; wiki o zamianach opisuje regułę, nie listę par). Jeśli orkiestrator uzna, że wiki powinna wymieniać AI-wyjątek same-epoch, to osobny krok z regeneracją wikiBundle.

## NASTĘPNY KROK

Final Control: zweryfikować wyjątek `ai-era-unit-promotion.ts` względem allowlisty (ZAŁOŻENIE: dopuszczony); rozstrzygnąć A/B/C (zarzut 2) i pozycję D (oszczepnicy). Po decyzji właściciela ewentualnie osobny temat (B lub C) i Chromium/tsc w środowisku z vite+typescript.

## Commit

Commit zawiera: `gra/src/game/ai-era-unit-promotion.ts`, `gra/tools/unit-replace-archer-slinger-test.cjs`, ten plik. Nie dotyczy `gra/data/units.json` (bez zmian względem c67967d1), `wikiBundle` (bez zmian), `gra-robocza`, `WERSJE.md`.

DEPLOY/PUSH: NIE WYKONANO
RUNDY: 2/5 (obrona r2 po zarzutach r1 z werdyktem PASS-WITH-NOTES)
