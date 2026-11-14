# R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1 — obrona Operatora (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1
GOAL: stan pary: punkty wygranych bitew z bieżącej wojny (niski/wysoki id), reset przy wojnie, bonus trybutu 10 tur, czyste odczyty; bez podpięcia do decyzji AI/pokoju/UI. Obrona domyka zarzuty Evaluatora 1-3 WYŁĄCZNIE w pliku testu; kod gry (main.ts, engine, military-strength) bez zmian względem kandydata 5b807829d.
ZMIANY/COMMIT: baza 5b807829dd1d500384c0df8e3c3284237da80f2a (kandydat). Jedyna zmiana w tej rundzie: gra/tools/diplo-war-battle-counter-test.cjs (przepisana sekcja (g) i dopisane dwa checki (f)). Raport: dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1/30-obrona-claude.md. Commit: patrz pole sha w odpowiedzi (commit tego pliku testu i raportu). Allowlista zachowana.

## Odpowiedź na zarzuty Evaluatora (4931173461e33ca5e57b1d26e03f890f5b8074b1, 20-evaluator-claude.md)

- Zarzut 1 (mutacja „zapis tylko dla gracza” nie czerwieni testu; tautologia mutatedPlayerOnly): PRZYJMUJĘ. Usunięto funkcję mutatedPlayerOnly (nie dotykała main.ts). Zastąpiono kontrolą strukturalną wywołania w main.ts: `gateSlice` = fragment między `battlePowerPtsByOwner.set(winOid, …)` a `diploRecordWarBattlePoints(winOid, loserOid, pts)`; check wymaga braku `winOid ===/!== 0`, `isHuman`, `isMe` w tym fragmencie. Dowód mutacji M1 (patrz niżej): test czerwieni (32 PASS / 1 FAIL).
- Zarzut 2 (brak kontroli bramki wojny w diploRecordWarBattlePoints, mutacja M2 zielona): PRZYJMUJĘ. Dodano check: ciało funkcji `diploRecordWarBattlePoints` (wycinane licznikiem nawiasów) zawiera `getDiploRelation(winnerId, loserId).status !== 'wojna') return`. Dowód M2: test czerwieni (32 PASS / 1 FAIL). Dodano też check braku bramki właściciela w ciele tej funkcji.
- Zarzut 3 (test (f) to JSON.parse bez realnej ścieżki wczytania): CZĘŚCIOWO PRZYJMUJĘ. Realnego wczytania w node nie da się wykonać (main.ts to zamknięty boot() przeglądarkowy). Dodano dwa checki strukturalne: zapis `diplomacyPairMeta: Array.from(diplomacyPairMeta.entries())` oraz wczytanie `for (const [key, meta] of savedPairMeta) diplomacyPairMeta.set(key, meta)` (bez whitelisty pól, więc nowe pola przechodzą generycznie). Stary zapis bez pól nadal dowodzony przez pomocniki (0 / brak bonusu). ODRZUCAM twierdzenie, że to „nie dowodzi” nic ponad JSON: dowód jest teraz dwuwarstwowy (pomocnik + kontrola ścieżki w main.ts), ale nadal nie jest wykonaniem silnika. Pozostaje NIE_ZMIERZONO (patrz niżej).
- Dodatkowo (c) i (e): wzmocniono kontrolą blokową. Reset (c) sprawdzany w bloku `if (rel.status === 'wojna' && prevStatus !== 'wojna')` … `} else if (prevStatus === 'wojna' …`. Trybut (e): ciało diploGrantTributeBonusFor wywołuje grantTributeBonus(meta, receiverId, turn, loadMilitaryStrengthParams()), a gałąź `cywAction === 'trybut_zadanie'` (okno 400 znaków) wywołuje diploGrantTributeBonusFor(proposerId, responderId). Mutacja M3 czerwieni test (32 PASS / 1 FAIL).

## Mutacje-dowody (na roboczym drzewie, po każdej przywrócono `git checkout -- gra/src/main.ts`; po przywróceniu `git status` pokazuje tylko plik testu)

- M1 (`if (loserOid !== undefined && winOid === 0) diploRecordWarBattlePoints`): FAIL (g) „wywołanie zapisu bitwy NIE jest bramkowane właścicielem” → 32 PASS / 1 FAIL.
- M2 (usunięta linia `if (getDiploRelation(winnerId, loserId).status !== 'wojna') return;`): FAIL (g) „bramka wojny … w ciele” → 32 PASS / 1 FAIL.
- M3 (`diploGrantTributeBonusFor(responderId, proposerId)` w gałęzi trybut_zadanie): FAIL (e) „gałąź trybut_zadanie wywołuje …(proposerId, responderId)” → 32 PASS / 1 FAIL.

## TESTY (surowe wyniki, na końcowym stanie gra/)

- `npx tsc --noEmit`: exit 0
- `node tools/diplo-war-battle-counter-test.cjs`: 35 PASS / 0 FAIL, exit 0 (poprzednio 30; dodano 5 checków)
- `node tools/diplo-military-strength-test.cjs`: RESULT: 27 PASS / 0 FAIL, exit 0
- `node tools/diplomacy-test.cjs`: [diplomacy-test] 148 passed, 0 failed (total 148), exit 0
- `node tools/diplo-respect-military-events-test.cjs`: Wynik: 24 OK, 0 FAIL, exit 0
- `node tools/logic-test.cjs`: LOGIC OK (213/213), exit 0
- `node tools/tech-tree-test.cjs`: tech-tree-test: 20 pass, 0 fail, exit 0
- `node tools/research-test.cjs`: PASSED: 33 / FAILED: 0 / TOTAL: 33, exit 0
- `node tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
- `node tools/combat-test.cjs`: COMBAT TEST: 6/6 pass, exit 0
- `git diff --check`: czysty
- `npm ci --ignore-scripts` w gra/: exit 0 (bez build/dev)

## BLOKADY

Brak blokad technicznych. Dysk: po `npm ci` zostało 1,3 GB wolnego na / (97% zajęte) — poniżej progu 2 GB nie jesteśmy, ale blisko. Operator nie uruchamiał build ani dev.

## NIE_ZMIERZONO

- Żywa gra i realne wczytanie starego zapisu w silniku (boot() przeglądarkowy, brak hooka testowego). Ścieżka wczytania i zapisu jest sprawdzona tylko strukturalnie (patrz zarzut 3).
- Zachowanie przy bitwach wieloosobowych: loserOid brany z `defRoster[0]?.ownerId` / `atkRoster[0]?.ownerId`, tak jak w istniejącym Power (założenie, zgodne z kodem bitwy).
- Trybut AI↔AI: w kodzie nie ma takiej ścieżki (zgodnie z uwagą Evaluatora); bonus dotyczy tylko trybut_zadanie.
- Zapis do pary dla barbarzyńców i miast-państw w wojnie: bez konsumenta, zgodnie z założeniem Operatora.

## RUNDY

2/5 (runda 1 Operator; runda 1 obrony = ta). Ostatni werdykt Evaluatora: PASS-WITH-NOTES.

## NASTĘPNY KROK

Evaluator r2 (Sonnet) sprawdza, że checki (g) i (f) są realnie czerwone przy M1–M3 (dowody powyżej) i że zarzut 3 jest zamknięty wystarczająco. Potem Final Control. Nie integrować przed FC.

## DEPLOY/PUSH: NIE WYKONANO
