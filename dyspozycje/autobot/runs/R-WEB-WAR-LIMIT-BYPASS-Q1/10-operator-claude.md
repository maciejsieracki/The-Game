STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-LIMIT-BYPASS-Q1
GOAL: Wojna wznawiana po rozejmie (declareWarAfterTruce) podlega limitowi wojen naturalnych; wojna wymuszona (force=true) opisana, bez kodowania.
BAZA: b610e71a62f68c5c3052d456facc0deebd86af72 (origin/main), worktree detach.

## 1. Reguła limitu (cytat)
- gra/src/game/diplomacy-war-limit.ts (nagłówek, reguła C, ABC 2026-11-18): "maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja. Gracz jako DEKLARUJĄCY nie jest ograniczany (egzekwuje wywołujący w main.ts). Barbarzyńcy nie liczą się."
- warLimitAllows: odmowa, gdy ATAKUJĄCY lub OBROŃCA ma już tyle wojen danego typu, ile wynosi maksimum; flaga OFF = zawsze true.
- Brak w kodzie wyjątku dla rozejmu, obrony ani przejęcia miasta. Wyjątek force=true istnieje tylko w ownerDeclareWarOn (`if (!force && ...)`, main.ts ~14324) — to ścieżka wymuszona.
- Rejestru FALA 863/896 nie cytuję dosłownie (nie czytałem całych dispatchów WAR-LIMIT); reguła zacytowana z kodu modułu. NIE ZMIERZONO: pełne brzmienie decyzji właściciela z rejestru.

## 2. declareWarAfterTruce — zmiana (naprawa)
Mechanizm: rozejm (main.ts ~12935) ustawia status 'pokoj' + truceUntilTurn; podczas rozejmu para NIE jest liczona w warTypesForOwner (liczy tylko status 'wojna'). Po wygaśnięciu truceEndToWarCore -> ports.declareWarAfterTruce wracało do 'wojna' bez bramki. Skutek: w czasie rozejmu zwolniony slot naturalny, po wygaśnięciu druga wojna naturalna naraz.
Wniosek: wojna po rozejmie to wojna naturalna wg reguły (limit dotyczy każdej wojny naturalnej, rozejm nie jest wyjątkiem) -> dodano bramkę.
Zmiana w gra/src/main.ts (tylko declareWarAfterTruce w truceEndPorts, +10 linii):
- typ = getWarTypFromMeta(meta pary); bramka warLimitAllowsDeclaration(a, b, typ);
- odmowa: brak wojny, setDiploPairMeta z truceUntilTurn = turn + 1 (ponowna próba w kolejnej turze, bez wybuchu wojny; log console.debug z warLimitAllowsDeclaration);
- zgoda: bez zmian (applyDiploEventTracked 'wojna_wypowiedziana').

## 3. force=true (bunt / przejęcie miasta) — DECISION_REQUIRED
triggerRebelProtectionWarConsequence (main.ts ~14376) -> ownerDeclareWarOn(newOwner, rebelPrevOwnerId, force=true, 'wymuszona_inna') omija bramkę limitu. Może dać ponad limit wojen naturalnych dla zwycięzcy przejęcia lub poprzedniego właściciela przy przejęciu miasta chronionego buntownika.
Konflikt (jedno zdanie na wariant):
- A: wyjątek force=true zostaje (wojna wymuszona nie liczy się do limitu, przejęcie zawsze skuteczne).
- B: limit obowiązuje także dla wojny wymuszonej (przejęcie bez wojny, jeśli limit zablokowany).
Nie kodowano. Decyzja właściciela wymagana.

## 4. Test
gra/tools/war-limit-after-truce-test.cjs (nowy, bez zależności, czyta main.ts).
- Wynik na poprawce: 5 PASS / 0 FAIL (exit 0).
- Mutacja czerwona: bramka zastąpiona `if (false)`: 2 PASS / 3 FAIL. Przywrócono: 5/0.
- Test źródłowy, nie behawioralny w silniku (main.ts ~46k linii, brak node_modules w worktree). Behawioralny test silnika: NIE ZMIERZONO.

## 5. Bramki (gra/)
- tsc, logic, tech-tree, research, unit-replace, combat, ai-test, era-war-pairing-alliance, war-rules-multiwar(-main-guard), war-limit-ai-natural, diplomacy-war-limit-unit, alliance-war-obligation: NIE ZMIERZONO — brak node_modules w worktree; nie instalowano zależności, nie robiono builda/dev.
- Sprawdzenie statyczne: getWarTypFromMeta już importowany (main.ts ~1724); warLimitAllowsDeclaration (main.ts ~26086) i turn są w tym samym zakresie co truceEndPorts.

## 6. Uwagi dla orkiestratora (UWAGI-DLA-ORKIESTRATORA)
- Gracz jako strona wznowienia: bramka nie ma wyjątku dla gracza (wyjątek "gracz deklarujący" dotyczy wypowiedzenia). Czy wznowienie wojny z udziałem gracza ma być wolne — do potwierdzenia.
- Odmowa wznowienia przedłuża rozejm o 1 turę; przy celu-człowieku oferta pokoju ponowi się w kolejnej turze. Efekt w grze NIE ZMIERZONO.

NASTĘPNY KROK: Evaluator — przegląd diffu main.ts (10 linii) i decyzja force=true (DECISION_REQUIRED, A/B).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
