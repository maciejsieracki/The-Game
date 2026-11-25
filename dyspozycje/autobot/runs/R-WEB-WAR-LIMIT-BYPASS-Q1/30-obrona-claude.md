STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-LIMIT-BYPASS-Q1
GOAL: Wojna wznawiana po rozejmie (declareWarAfterTruce) podlega limitowi wojen naturalnych, z wyjątkiem gracza jako deklarującego; wojna wymuszona (force=true) opisana z DECISION_REQUIRED, bez kodowania.
BAZA: cdc57e20ec596dcb3f4702c19bb12108ce2f68a9 (kandydat Operatora, detach); origin/main b610e71a6.

## Odpowiedzi na zarzuty Evaluatora (59cce65eb)

Zarzut 1 (mutant M2 przechodzi, test szuka tekstu 'return;'): PRZYJMUJĘ. Test zmieniony: komentarze `//` są usuwane przed sprawdzeniem, a sprawdzenie (b) wymaga `return;` wewnątrz bloku bramki (regex na blok `if (!graczDeklaruje && !warLimitAllowsDeclaration(a, b, typWojnyRozejm)) { ... }`).
- Wynik na poprawce: 6 PASS / 0 FAIL (`node gra/tools/war-limit-after-truce-test.cjs`, exit 0).
- Mutant M2 (`// return;` w odmowie) po zmianie: 5 PASS / 1 FAIL (FAIL na (b)).
- Mutant M1 (`if (false) {` zamiast bramki): 1 PASS / 5 FAIL.
- Mutacje w kopii w scratchpad, pliki repo nie zmienione przez mutanty.

Zarzut 2 (test tylko tekstowy, brak testu behawioralnego z asercją negatywną): PRZYJMUJĘ — behawioralnego testu NIE DODANO. Powód: brak node_modules w worktree, main.ts ~47k linii, diplomacy-war-limit.ts importuje JSON (`import ... from '*.json'`), a Node 22 nie ładuje tych importów bez bundlera; bundling w gra/ jest zakazany (npm run build/dev). NIE ZMIERZONO: test behawioralny na portach truceEndTickPair/truceEndToWarCore. Test źródłowy wzmocniony jak w pkt 1.

Zarzut 3 (brak cytatu reguły z rejestru): PRZYJMUJĘ — cytaty dodane poniżej (sekcja 1). Pełnego brzmienia decyzji właściciela z FALI 863 nie odczytano z rejestru w całości: NIE ZMIERZONO.

Zarzut 4 (brak wyjątku 'gracz deklarujący' w bramce declareWarAfterTruce): PRZYJMUJĘ — naprawione w kodzie (sekcja 2).

Zarzut 5 (odmowa daje pętlę ponowień bez limitu; nowa mechanika bez testu i pomiaru): PRZYJMUJĘ jako problem; NIE NAPRAWIONO w kodzie, bo wybór zachowania jest decyzją gry (patrz DECISION_REQUIRED B). Efekt w grze NIE ZMIERZONO.

## 1. Reguła limitu (cytaty)
- gra/src/game/diplomacy-war-limit.ts, nagłówek (reguła C, ABC 2026-11-18): "Reguła właściciela: maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja. Gracz jako DEKLARUJĄCY nie jest ograniczany (egzekwuje wywołujący w main.ts). Barbarzyńcy nie liczą się."
- WERSJE.md, ROBOCZA 22cadb41, 2026-11-25, FALA 896: "Wojny: limit wojen naturalnych obowiązuje także przy wciąganiu sojuszników" — sojusznik wciągany do wojny widzi wojnę oczekującą głównego agresora.
- WERSJE.md, ROBOCZA 25bd973d, 2026-11-18, FALA 863: "R-WEB-DIPLO-WAR-LIMIT-PLAYER-TARGET-Q1: wojna państwa-miasta przeciw graczowi przechodzi przez bramkę limitu wojen (za flagą limitWojenAktywny=false)".
- Z kodu: wyjątek force=true istnieje tylko w ownerDeclareWarOn (`if (!force && ...)`), czyli ścieżce wymuszonej. Brak wyjątku dla rozejmu, obrony i przejęcia miasta w bramce warLimitAllows.
- Wniosek: wojna po wygaśnięciu rozejmu to wojna naturalna wg reguły (rozejm nie jest wyjątkiem), więc bramka jest wymagana.

## 2. declareWarAfterTruce — zmiana (gra/src/main.ts, truceEndPorts)
- Import: dodano `truceEndOfferTarget` z './game/diplomacy-peace-lock' (już eksportowane, linia ~189).
- Deklarujący wznowienia = `truceEndOfferTarget(meta.truceInitiatorId, a, b)` — strona niebędąca inicjatorem rozejmu; to ona przy odmowie wywołuje wojnę (truceEndTickPair / truceEndToWarCore).
- `graczDeklaruje = deklarujacy != null && isMe(deklarujacy)`. Gracz jako deklarujący nie jest ograniczany (zgodnie z nagłówkiem reguły C i pozostałymi bramkami `!isMe(...) &&`). Brak inicjatora (stare zapisy) → bramka stosowana.
- Bramka: `if (!graczDeklaruje && !warLimitAllowsDeclaration(a, b, typWojnyRozejm))` z typem z `getWarTypFromMeta(metaWznow)`.
- Odmowa: brak wojny, `truceUntilTurn: turn + 1`, `return`.
- Zgoda: bez zmian (`applyDiploEventTracked(... 'wojna_wypowiedziana')`).
- ZAŁOŻENIE: deklarujący wznowienia to adresat propozycji, bo odmowa adresata = wojna (truceEndTickPair). To jest wnioskowanie z kodu, nie potwierdzone w rejestrze.

## 3. force=true (bunt / przejęcie miasta) — DECISION_REQUIRED
- Ścieżka: triggerRebelProtectionWarConsequence (main.ts ~14380) → ownerDeclareWarOn(newOwner, rebelPrevOwnerId, force=true, 'wymuszona_inna'); bramka `!force && ...` jest pomijana, a typ wojny to 'naturalna'.
- Skutek: po przejęciu chronionego buntownika zwycięzca przejęcia albo poprzedni właściciel może mieć ponad limit wojen naturalnych (tylko przy ≥1 już istniejącej wojnie naturalnej tej cywilizacji). Częstość NIE ZMIERZONO.
- Konflikt (jedno zdanie na wariant):
  - A: wyjątek force=true zostaje (przejęcie miasta zawsze skuteczne; wojna wymuszona nie liczy się do limitu).
  - B: limit obowiązuje także dla wojny wymuszonej (przejęcie bez wojny, gdy limit jest zajęty).
- Nie kodowano. Decyzja właściciela wymagana.

## 4. DECISION_REQUIRED — zachowanie po odmowie wznowienia (zarzut 5)
- Przy odmowie rozejm dostaje truceUntilTurn = turn + 1, więc w kolejnej turze truceEndTickPair ponawia próbę. Dla celu-człowieka każda próba tworzy nową ofertę w skrzynce (enqueueOffer bez deduplikacji), dopóki slot wojny jest zajęty.
- Dla pary AI↔AI: ponawiana cicha próba bez limitu, bez wojny, bez oferty.
- Wariant A: ponawiać co turę (stan obecny; możliwe powtarzające się oferty dla gracza).
- Wariant B: brak ponowień; odmowa zostawia parę w stanie pokoju bez licznika rozejmu, aż do zwolnienia slotu lub wypowiedzenia (wymaga nowego stanu w silniku; większa zmiana).

## 5. Bramki
- gra/tools/war-limit-after-truce-test.cjs: 6 PASS / 0 FAIL (exit 0); mutanty M1 1/5, M2 5/1 (czerwone).
- gra/tools/war-rules-multiwar-main-guard-test.cjs: 21 PASS / 0 FAIL (zgodnie z dispatchem: 21/0).
- gra/tools/war-limit-ai-natural-test.cjs: 7 PASS / 0 FAIL (dispatch oczekiwał 15/0 — NIE ZMIERZONO różnicę; test uruchomiony bez builda, wynik z surowego wyjścia).
- gra/tools/alliance-war-obligation-test.cjs: NIE ZMIERZONO — kończy się błędem `Require stack` (moduł TS bez loadera); wymaga bundla.
- tsc, logic, tech-tree, research, unit-replace, combat, ai-test, era-war-pairing-alliance, diplomacy-war-limit-unit: NIE ZMIERZONO — brak node_modules w worktree; nie instalowano zależności, nie robiono builda/dev.
- `git diff --check`: czysto.
- Statycznie: `isMe(ownerId: number)` jest w zakresie boot() (linia ~14905), `getDiploPairMeta` (~12288), `turn` w zakresie; `truceInitiatorId?: number` w DiploPairMeta (diplomacy-pn-engine.ts:118). Typy zweryfikowane na czytaniu kodu, nie tsc.

## 6. UWAGI-DLA-ORKIESTRATORA
- Wątek 'gracz deklarujący': wybór adresata jako deklarującego to założenie (sekcja 2). Jeśli właściciel chce inną regułę (np. zawsze bramka także dla gracza), zmiana to jedna linia.
- Nowy test behawioralny na portach (truceEndTickPair/truceEndToWarCore + warLimitAllows) wymaga środowiska z bundlerem; warto zlecić osobnym tematem.
- Znalezisko poza zakresem: sam alliance-war-obligation-test.cjs nie działa bez bundla (Require stack); nie badałem dalej.

NASTĘPNY KROK: Evaluator — przegląd diffu main.ts (13 linii) i testu; decyzja force=true (DECISION_REQUIRED A/B) i wariant po odmowie (DECISION_REQUIRED A/B, sekcja 4).
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO
