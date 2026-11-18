# R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1 — obrona (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tor AI↔AI, domyślnie wyłączony torAktywny=false)
TEMAT: R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1
GOAL: odpowiedź na 7 zarzutów Evaluatora (PASS-WITH-NOTES, commit bf56425e5 / 20-evaluator-claude.md) względem kandydata 48e5932dd; poprawki tylko tam, gdzie zarzut był trafny i poprawka nie wymaga decyzji produktowej.
ZMIANY-COMMIT: kod wyjściowy 48e5932dd; obrona = 2 pliki + ten raport:
- gra/src/main.ts: przywrócona oryginalna forma linii importu newGameMapDefaults (usunięta kosmetyka ze spacją; zarzut 6 PRZYJĘTY). Diff wobec fb5b2045 w main.ts: wyłącznie dodanie tickAiAiTreatyRequests / helperów / haka / wywołania (97 linii dodanych, 0 usuniętych).
- gra/tools/ai-ai-treaty-nap-wiring-test.cjs: nowa asercja B11 „ograniczenie” (Respekt 10, kara −30 => realna utrata Relacji 10; zarzut 1 udokumentowany liczbowo).
- dyspozycje/autobot/runs/R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1/30-obrona-claude.md.
- Nie zmieniono: ai-ai-treaty-tick.ts, ai-ai-treaty-params.json, ai-ai-treaty-evaluate.ts.

## Odpowiedzi na zarzuty

1. Kara −30 Relacji nie jest pełna przy Respekcie <30 — PRZYJMUJĘ (fakt potwierdzony w kodzie: applyAiAiNapBreachRelacja przelicza na Respekt z clamp 0..100). Kod NIE zmieniony: pełna kara wymaga decyzji, dokąd trafia reszta (np. do Zaufania = dodatkowa kara ponad P-4 −20). To decyzja właściciela, nie Operatora. Dowód: test B11 „ograniczenie” (Respekt 10 → utrata Relacji 10 z 30), PASS. DECYZJA DO ABC: A) zostawić i opisać; B) reszta do Zaufania.

2. Brak testu dynamicznego gałęzi kary w breakTreatiesOnWar — PRZYJMUJĘ jako NIE ZMIERZONO. Funkcja jest domknięciem wewnątrz boot() (main.ts), nie da się jej wywołać z testu statycznego. Nie dopisano testu live.

3. Wpięcie tickAiAiTreatyRequests w main.ts bez testu uruchomieniowego (hak aiAiTreatyTickForTest niewywołany) — PRZYJMUJĘ jako NIE ZMIERZONO. Brak wywołania w jakimkolwiek teście.

4. Brak pomiaru hash/determinizmu przy torAktywny=false — PRZYJMUJĘ jako NIE ZMIERZONO, z dowodem prób:
   - `npx tsc --noEmit` = 0; `npx vite build --outDir <scratchpad>/dist-cand` = OK (44,7 s, poza repo).
   - `node tools/determinism-save-load-resume-live.cjs --dist <dist-cand> --seed 2222 --mode A --n 2 --k 2` => `FATAL Error: endTurn timeout at turn 1` po 6 min 49 s. Ten sam bloker co w #418 (endTurn / bramka NNS). Nie zbudowano dist bazy fb5b2045, więc porównanie przed/po nie zostało wykonane.

5. Brak tabeli PRZED/PO bramek diplo — PRZYJMUJĘ jako NIE ZMIERZONO w tej rundzie. Ponownie uruchomiono tylko 5 bramek bazowych i test NAP (wyniki poniżej). Testy diplo (468/0, 50/0, 80/0, 42/0, 25/0, 21/0, 21/0, ai-test 297/0) nie zostały powtórzone po stronie obrony; zarzut 5 dotyczy dowodu PRZED, a zmiany od 48e5932 nie zmieniają zachowania (whitespace w importach, asercja w teście).

6. Kosmetyczna zmiana importu newGameMapDefaults poza allowlistą — PRZYJMUJĘ, naprawione (patrz ZMIANY-COMMIT).

7. Zdarzenie AI↔AI tylko w console.log — PRZYJMUJĘ jako uwagę dopuszczoną przez dispatch (nowe UI zakazane). Bez zmian. Decyzja potrzebna przed E6.

## Wyniki bramek (surowe wyjście, ta runda, commit po poprawkach)

- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST: 6/6 pass
- ai-ai-treaty-nap-wiring-test: WYNIK: ZIELONE, exit 0 (mutanty M1–M6 wykryte)

## Stan

RUNDY: 1/5 obrona (r1 Operator + r1 obrona). Dwie decyzje dla orkiestratora: (a) reszta clampu kary P-4 (zarzut 1); (b) bez dowodu live wiring/hash — wymagana naprawa harnessu determinizmu (endTurn timeout) przed etapem z pomiarem.
NASTĘPNY KROK: decyzja ABC w sprawie zarzutu 1; następnie Evaluator r2 albo osobny temat LIVE-DOWÓD (test dynamiczny tick+kara, hash 3 ziarna × 30 tur po naprawie harnessu).
DEPLOY/PUSH: NIE WYKONANO

Uwagi dla orkiestratora: w sesji obrony nie użyto `rm`; plik `/tmp/x` (wynik testu NAP) pozostał — do usunięcia przez orkiestratora. `gra/node_modules` (134 MB, git-ignorowany) zainstalowany `npm ci --ignore-scripts` do przebiegu bramek; sprzątanie po temacie wg zasad procesu.
