STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BREAK-TREATIES-STATUS-Q1 (BREAKTREATIES, #169) — obrona, runda 2
GOAL: po zarzutach Evaluatora (raport a99e96c79142341baf593973a15c093b31f2fbf1) wzmocnić test inwariantu statusu po wypowiedzeniu wojny tak, aby mutacje ME, MF, MB, MD były wykrywane, a zbiór BREAK_ON_WAR nie był kopią ręczną. Kod gry (src/) bez zmian. Wynik tematu bez zmian: brak błędu w ścieżkach produkcyjnych.
ZMIANY/COMMIT: baza c3c17aab7 (kandydat). Zmieniony plik: gra/tools/break-treaties-status-test.cjs; ten raport. Kod gry nietknięty. SHA: w polu sha zwrotki.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Test nadal czyta main.ts tekstowo (main.ts nie jest ładowalny w node; nie próbowano bundlować całego main.ts z zależnościami DOM, więc zachowania breakTreatiesOnWar NIE wykonano — NIE_ZMIERZONO). Dodano wykrywanie: mutacja ME (`if (!breakerIsPlayer) return;` przed usunięciem umów) — wykryta przez regułę „return przed usunięciem umów”; mutacja MF (filtr sojuszy w argumencie removeTreatiesById) — wykryta przez dokładną linię usunięcia i zakaz zmiany brokenIds.
2. PRZYJMUJĘ. Sekcja C wymaga, by applyDiploEventTracked(A,B,…,'wojna_wypowiedziana') i setDiploRelation(A,B,…) dotyczyły TEJ SAMEJ pary co argumenty wywołania breakTreatiesOnWar. Mutacja MB (odwrócona para w joinAllyToWar) wykryta.
3. PRZYJMUJĘ. Liczenie po wystąpieniach (nie po liniach), bez komentarzy. Mutacja MD (dwa wywołania w jednej linii) daje 7 wystąpień zamiast 6 i jest wykryta.
4. PRZYJMUJĘ. BREAK_KINDS nie jest przepisane ręcznie: test czyta deklarację `const BREAK_ON_WAR … new Set([…])` z gra/src/game/diplomacy-treaties.ts, mapuje tokeny RodzajTraktatu.X i literały; wymagane >= 8 tokenów i pełne rozpoznanie (wynik: 10 tokenów, wszystkie rozpoznane).
5. ODRZUCAM z dowodem. Dispatch (00-dispatch.md, sekcja „Binarne kryterium”) wymienia: tabelę ścieżek, test z mutacją czerwoną, błąd naprawiony lub „brak błędu”/DECISION_REQUIRED, zielone bramki. Dokument dyspozycje/analizy/BREAKTREATIES-2026-11-26.md figuruje tylko w allowliście (dozwolony, nie wymagany). Tabela ścieżek jest w 10-operator-claude.md.

TESTY:
- node tools/break-treaties-status-test.cjs (esbuild z katalogu tymczasowego poza repo, ESBUILD_PATH): PASS=38 FAIL=0, exit 0.
  Sekcje: A (logika, BREAK_ON_WAR ze źródła) pass; B pass; C/D (stan main.ts) pass; E: mutacje M1, M2, M3, M4, ME, MF, MB, MD — każda zastosowana i wykryta.
- Poprzednia wersja testu: PASS=18 (C/D/E tylko tekstowe, liczenie linii).
- Bramki ogólne (tsc, logic, tech-tree, research, combat, ai-test, war-rules-multiwar-main-guard, war-limit-truce-count, alliance-label-clean-test): NIE_ZMIERZONO — brak gra/node_modules w worktree; kod src/ nie zmieniony, więc nie wprowadzono regresji do sprawdzenia.
BLOKADY: brak. Test wymaga esbuild (ESBUILD_PATH albo npm install w gra/); nie instalowano do repo.
UWAGI-DLA-ORKIESTRATORA:
- Test nadal jest tekstowy dla main.ts (punkt 1 zarzutów). Test zachowania silnika wymagałby ładowalnego modułu gry; poza zakresem tego tematu.
- Linia main.ts 22919 (`if (brokenIds.length) activeDeals = removeTreatiesById(...)`) to inny punkt usuwania umów; nie badany.
- Hooki testowe ustawiające 'wojna' ręcznie (30838, 31401, 33731, 51256, 51750) — jeśli trafią do produkcji, inwariant wypadnie.
RUNDY: 2/5 (runda 1: PASS, commit c3c17aab7; runda 2: ta obrona)
NASTĘPNY KROK: Evaluator weryfikuje test (mutacje ME/MF/MB/MD); integrację testu decyduje orkiestrator po Final Control.
DEPLOY/PUSH: NIE WYKONANO
