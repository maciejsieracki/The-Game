# R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1 — raport Obrony Operatora (runda 2, odpowiedź na zarzuty Evaluatora r1)

STATUS: PASS-WITH-NOTES (zarzuty 1 i 4 PRZYJĘTE z poprawką; zarzut 2 PRZYJĘTY częściowo, pomiar liczbowy NIE_ZMIERZONO; zarzut 3 PRZYJĘTY częściowo — test behawioralny dodany, ale nie dyskryminuje rw; zobacz §2)
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1
GOAL: (1) audyt ścieżek pokoju wg miary siły; (2) naprawa miary tam, gdzie sprzeczna z decyzją właściciela (siła militarna, nie rw/Power), progi bez zmian; (3) test z mutacją.
BAZA/KANDYDAT: f79d03f10 (start obrony; worktree przepięty na gałąź `obrona-peace-gate-q1` od f79d03f10).
ZMIANY-COMMIT: patrz sekcja „Commit" na końcu (SHA w polu sha odpowiedzi).
DEPLOY/PUSH: NIE WYKONANO

## 1. Odpowiedzi na zarzuty Evaluatora (217f176d3)

| Zarzut | Werdykt | Dowód / zmiana |
|---|---|---|
| 1. Bramka „AI proponuje pokój" (ai.ts) na rw | PRZYJĘTY, poprawiony | `gra/src/game/ai.ts:7169`: `(rw <= progPokojSlabosc \|\| peaceSignals.wantsPeace)` → `(peacePosMil === 'slabsza' \|\| peaceSignals.wantsPeace)`. `ai.ts:7175`: `weakerByPower = rw <= progPokojSlabosc` → `weakerByStrength = peacePosMil === 'slabsza'` (wybór rodzaju `aiTruceOrPeaceMode`). `ai.ts:7144–7145`: sygnały (a) `rw<=progPokojSlabosc` i (b) miasto + `rw<=progRwMiasta` wypadają z `peaceSignals` (filtr po reasons; zostają (d) pat, (e) zmęczenie, (c) zdrowie armii). Sygnał 'f' (słabsza militarnie) już istniał i pozostaje. Progi liczbowe bez zmian. |
| 2. DECISION_REQUIRED bez liczb; pkt B (buildProposalEvalContext) NIE_ZMIERZONO | PRZYJĘTY częściowo | Pkt B sprawdzony grepem (§3). Pomiar liczby propozycji w paśmie `pasmo` NIE_ZMIERZONO w pełnej grze; w siatce przypadków (§4) wyjścia przed i po zmianie identyczne. Nie eskaluję do właściciela, bo zmiana nie zmienia progów ani skali (dispatch wprost wskazuje „bramka rw zamiast peaceStanceOf" jako przykład naprawy). |
| 3. Test wyłącznie strukturalny; brak behawioralnego | PRZYJĘTY częściowo | Dodano kontrolę behawioralną (esbuild bundle ai.ts → decideAIDiplomacy), przypadki b1–b5. Przypadki b2–b5 są strażnikami (przechodzą też przed zmianą). Przypadek b1 NIE dyskryminuje rw — patrz §4. Dyskryminuje test strukturalny s1 (mutacja rw-bramki czerwieni go, §5). |
| 4. Martwe `winnerRw` w gateVerdict (main.ts:36680–36690) | ODRZUCAM usunięcie, PRZYJMUJĘ komentarz | Pole `rw` jest WYMAGANE typem `PeaceAiGateInput` (`diplomacy-war-peace-profile.ts:377`, plik poza allowlistą). Werdykt `evaluatePeaceAiGate` (`diplomacy-war-peace-profile.ts:421–450`) czyta tylko `pozycjaMilitarna` i `turnsAtWar`. Dodano komentarz w `main.ts:36680–36681` wyjaśniający to. |

## 2. Tabela ścieżek po naprawie (uzupełnienie tabeli z runy 1)

| Ścieżka | Miara po zmianie | Zgodność z decyzją |
|---|---|---|
| ai.ts:7169 bramka „AI proponuje pokój" (priorytet 2) | peacePosMil (siła militarna) + sygnały d/e/c | zgodna |
| ai.ts:7175 wybór rodzaju (`weaker`) | peacePosMil | zgodna |
| ai.ts:7144 sygnały pokoju (a),(b) | wypadły z bramki | zgodna (były Power) |
| ai.ts:7111/7141 powody (tekst) | tekst zawiera `pozycja=`, `respektWzgledny=` jako informacja | informacyjnie |
| ai.ts oddanie miasta (N1a, `peacePosMil === 'slabsza'`) | już siła | zgodna (bez zmian) |
| main.ts:36680–36690 gateVerdict AI↔AI | pozycja: siła; pole `rw` (Power) wymagane typem, nieczytane przez werdykt | zgodna w werdykcie; pole martwe (komentarz) |
| main.ts registerAiAiPeaceRequest / runAiAiPeaceTick | siła (z runy 1) | zgodna |
| diplomacy-proposals.ts `case 'pokoj'` (ok. l.1334–1400) | `ctx.warState.responderRw` przekazane do `evaluatePeaceAiGate`, którego werdykt nie czyta rw | zgodna (werdykt po pozycjaMilitarna) |
| main.ts:24885–24914 buildProposalEvalContext (pkt B) | `respektWzgledny` (Power) — patrz §3 | zgodna: nieczytane w ścieżce pokoju |

Pozostałe ścieżki bez zmian (ocena z runy 1): ai.ts:7011 pozycja, ai.ts:7357, wearyShare/loserDespair, war-weariness.ts, diplomacy-ai-forced-peace.ts (zależne od wywołującego), main.ts:11804.
Poza zakresem (uwaga dla orkiestratora): ai.ts:1890 `progUltimatumMilitaryRatio` na rw — ultimatum, nie pokój.

## 3. Pkt B — weryfikacja grepem (zarzut 2)

- `respektWzgledny` w `diplomacy-proposals.ts`: tylko deklaracja (`l.192–193`), ZERO odczytów → pole nie wpływa na żadną decyzję.
- `proposerRespekt` / `responderRespekt` (Power-based, `computeRespekt`, main.ts:24889–24890) czytane w `diplomacy-proposals.ts` tylko w: alians (`l.1231–1232`, `1270`), trybut (`1297–1305`), granice wojskowe (`1856`), wasal (`1903`). Brak odczytu w `case 'pokoj'/'rozejm'` (`l.1334+`).
- Ścieżka pokoju w ofertach czyta `ctx.warState.responderRw` (`l.1363`) → `evaluatePeaceAiGate`, której werdykt nie zależy od rw (`diplomacy-war-peace-profile.ts:421–450`).
- `isFeelingStronger` i `peaceBlockedByMilitaryAdvantage` (oparte o rw) nie mają wywołań poza `diplomacy-war-peace-profile.ts` (grep).
Wniosek: Power/respekt nie wpływa na akceptację pokoju w ofertach gracz↔AI ani AI↔AI. Pkt B zamknięty bez zmiany kodu.

## 4. Zachowanie bramki: pomiar (zarzut 2 i 3)

Skrypt jednorazowy (poza repo, `scratchpad/grid.cjs`): dwa bundle `decideAIDiplomacy` — wersja kandydata (militarna) i wersja z przywróconą bramką rw (mutant, tylko ta jedna linia).
Siatka: tura wojny t ∈ {7, 8, 9, 10, 12}; pary (silaAI, silaPlr, rw) ∈ {(110,100,0.20), (100,100,0.20), (80,100,0.90), (125,100,0.20)}; miasta 0 lub 6 (PN 1000, niezakazane). 40 przypadków.
Wynik: **wyjścia identyczne we wszystkich 40 przypadkach** (np. `oferuj_miasto_za_pokoj:rozejm` przy 100v100 z miastami w t=7–12; `-` bez miast).
Dodatkowo: t=20 (koniec zmęczenia): obie wersje → `zaproponuj_pokoj` (pokój bezwarunkowy, „koniec zmęczenia").
Interpretacja (ustalona w trakcie pomiaru, nie z założenia): w oknie, gdzie `aiPeaceTimeOk` jest spełnione, sygnał (e) zmęczenia już przekracza próg 0.4, więc bramka przechodzi także bez rw; rw-owy warunek nie dodaje wyjść. Zmiana jest więc strukturalnie zgodna z decyzją właściciela, a w zbadanej siatce NIE zmienia zachowania AI wobec gracza. Pełnej przestrzeni (wszystkie profile cywilizacji, wszystkie tury, pasmo z dodatkowymi sygnałami) NIE_ZMIERZONO.
Dlatego przypadek b1 w teście jest STRAŻNIKIEM, nie dyskryminatorem (nazwa i komentarz to mówią). Próba znalezienia przypadku dyskryminującego nie powiodła się w tej siatce.

## 5. Test i mutacja (c)

- `gra/tools/peace-gate-military-strength-test.cjs`: 14 PASS / 0 FAIL (p1–p3 strukturalne z runy 1; s1 — nowe: bramka i wybór rodzaju bez `rw <= progPokojSlabosc`; b1–b5 — behawioralne, strażnicze).
- Mutacja (scratch-kopia gra/ z przywróconą bramką `(rw <= progPokojSlabosc || peaceSignals.wantsPeace)`): test → **exit 1**, `FAIL: s1 ai.ts: bramka pokoju priorytet 2 używa peacePosMil…`, wynik 13 PASS / 1 FAIL. Mutacja czerwieni test.
- Mutacja z runy 1 (requesterShareOf wraca do Power) nadal czerwieni p1 (nie ponawiane w tej rundzie — kod main.ts w tej części bez zmian).

## 6. Dopasowane istniejące testy (tylko asercje zależne od miary; progi i testy nieosłabione)

- `gra/tools/diplo-truce-impl-test.cjs` — asercja E: `weakerByPower` → `weakerByStrength` / `peacePosMil === 'slabsza'`. Wynik: 94 PASS / 0 FAIL.
- `gra/tools/diplo-war-peace-main-guard-test.cjs` — `R3_COND` i mutant R3 zaktualizowane do nowego warunku. Wynik: 34 PASS / 1 FAIL (R6/ZT — ten sam FAIL na bazie f79d03f10, zmierzony w tej rundzie).
- `gra/tools/diplo-war-peace-sim-test.cjs` — mutant M_SIG zaktualizowany do `(peacePosMil === 'slabsza')`; asercja S1b: `sygnaly=a` → `pozycja=slabsza` (powód zmienił treść). Wynik: 19 PASS / 3 FAIL (S3, S4b, M_TUR — ten sam zestaw FAIL na bazie f79d03f10, zmierzony w tej rundzie).

## 7. Bramki (surowe wyjście, ta runda; node_modules zainstalowane `npm ci --ignore-scripts`; build/dev NIE uruchamiane)

- `node_modules/.bin/tsc --noEmit` → exit 0
- logic-test → `LOGIC OK (213/213)`
- tech-tree-test → `tech-tree-test: 20 pass, 0 fail`
- research-test → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- unit-replace-test → `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test → `COMBAT TEST: 6/6 pass`
- ai-test → `ai-test: 297 passed, 0 failed`
- diplomacy-test → `[diplomacy-test] 149 passed, 0 failed (total 149).`
- ai-war-weariness-peace-test → `PASS=99 FAIL=0`
- diplo-peace-balance-accept-test → `32 pass / 0 fail`
- diplo-peace-stance-wiring-test → `10 pass / 0 fail`
- diplo-peace-weaker-seeks-city-only-test → `29 pass / 3 fail` (h2, h4, h5 — ta sama treść FAIL co w runie 1: „pokój bezwarunkowy przy zmęczeniu 1.00"; wynik bazowy zmierzony przez Evaluatora na a99445016, w tej rundzie NIE ponownie zmierzony na bazie)
- diplo-war-peace-profile-unit-test → `198 pass / 0 fail` (ta runda, po zmianie ai.ts; nie zależy od bramki)
- pr141-ai-strategy-behavior-test → `17 passed, 2 failed` (FAIL: „high conquest profile declares war…", „risk 8 crosses war threshold…" — na bazie f79d03f10 identyczne 17/2, zmierzone w tej rundzie)
- peace-gate-military-strength-test → `Wynik: 14 PASS / 0 FAIL`
- `git diff --check` → czysto

## 8. Blokady

Brak blokad technicznych. NIE_ZMIERZONO: liczba propozycji pokoju wypadających w paśmie `pasmo` w pełnej grze (grid §4 jest wąski). Dług bazowy (h2/h4/h5, G-sim S3/S4b/M_TUR, R6/ZT, pr141 2 FAIL) — poza zakresem, do osobnych tematów.

## 9. UWAGI-DLA-ORKIESTRATORA

- Zmiana bramki nie zmieniła wyjść w zmierzonej siatce; jeśli właściciel chce pewności co do balansu, potrzebny pomiar w pełnej grze (wszystkie cywilizacje × tury 7–12 × pasmo). To jest zakres innego tematu, nie tej rundy.
- Test `diplo-war-peace-sim-test` ma 3 FAIL na bazie (już znane); nie naprawiano.
- Pole `winnerRw` w `gateVerdict` pozostaje (wymagane typem; zmiana typu leży poza allowlistą).

## Commit

Zmienione pliki (allowlista): `gra/src/game/ai.ts`, `gra/src/main.ts` (tylko komentarz), `gra/tools/peace-gate-military-strength-test.cjs`, `gra/tools/diplo-truce-impl-test.cjs`, `gra/tools/diplo-war-peace-main-guard-test.cjs`, `gra/tools/diplo-war-peace-sim-test.cjs`, `dyspozycje/autobot/runs/R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1/30-obrona-claude.md`.

NASTĘPNY KROK: Evaluator r2 (weryfikacja zarzutów 1–4 i mutacji s1) → Final Control.
RUNDY: 2/5 (obrona r2 po FAIL r1)
DEPLOY/PUSH: NIE WYKONANO
