# R-WEB-DIPLO-ZERO-TRUST-TREATY-BREAK-PROTECTOR-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (nowa funkcja AI, za flagą OFF)
TEMAT: R-WEB-DIPLO-ZERO-TRUST-TREATY-BREAK-PROTECTOR-Q1
GOAL: Zaufanie 0 przez 5 tur → AI zrywa umowę handlową i NAP z partnerem (nie sojusz, nie wojnę) i szuka protektora (premia celu w torze sojuszy E3); za flagą `zeroZaufaniaAktywna=false`.
BAZA: 77b103c7f60ef1bb2d2d981d99bcc0ae11480d51 (origin/main, merge-base OK).

ZMIANY-COMMIT: kod w commicie operatora (SHA = czubek gałęzi detached, podany w odpowiedzi do orkiestratora). Allowlista:
- gra/data/diplomacy-zero-trust-params.json (nowy): `zeroZaufaniaAktywna: false`, `zeroZaufaniaProgTur: 5`.
- gra/src/game/diplomacy-zero-trust.ts (nowy, czysta logika): licznik per para AI→partner, próg, protektor (C1), rejestr zerwań, hak `setZeroTrustEnabledForTest`, `resetZeroTrustSession`.
- gra/src/game/ai-ai-alliance-tick.ts: opcjonalne `preferowanyCel(p,t)` dołączone do premii wyboru celu (tylko kolejność; progi E1 nietknięte).
- gra/src/main.ts: import; reset w `initAllAiOwnersForNewGame` i `prepareSessionForLoad`; `tickZeroTrustTreaties()` (C2, przez istniejące `breakTreatyVoluntarily(dealId, ai)`) wołane w fazie AI przed sojuszami; mapa preferencji w `tickAiAiAllianceRequests`; hak `__truceTestDebug.zeroTrustForTest`.
- gra/tools/diplomacy-zero-trust-unit-test.cjs (nowy).
- Nie tknięto: ai.ts, diplomacy.ts, gra-robocza, gra-kanon, WERSJE.md, rust-port.

TESTY (liczby z surowego wyjścia):
- `npx tsc --noEmit` (node_modules/typescript): exit 0.
- diplomacy-zero-trust-unit-test: PASS=28 FAIL=0 (nowy).
- Mutant progu `>=` → `>`: test czerwony (PASS=27 FAIL=1, exit 1). Przywrócono oryginał, znów 28/0.
- logic-test: LOGIC OK (213/213). tech-tree-test: 20 pass, 0 fail. research-test: 33/0.
- unit-replace-test: exit 0 (liczby nie odczytano z wyjścia).
- combat-test: exit 0 ("All sanity checks passed").
- diplomacy-test: 149 passed, 0 failed.
- diplomacy-harder-unit-test: PASS 50 FAIL 0.
- ai-ai-alliance-tick-test: suite 19/19 OK, mutants 8/8.
- `git diff --check`: czysto.
- NIE_ZMIERZONO: bieg dymny ≤30 tur seed 4242 z flagą ON (wymaga przeglądarki/civTest; nie uruchomiono). Pozostałe mutacje z dispatchu (reset, partner gracz/AI, C1 bez flagi toru) — nie wykonano; pokryte jedynie testami pozytywnymi.

ZAŁOŻENIA (luki rozstrzygnięte w kodzie):
1. Licznik per para jest kierunkowy (AI→partner). Relacja jest symetryczna, więc dwa liczniki AI-AI rosną równo.
2. Po zerwaniu licznik NIE jest zerowany (zeruje się tylko przy Zaufaniu > 0). Gdy AI podpisze nowe handel/NAP z tym samym partnerem przy Zaufaniu 0, zerwanie powtórzy się w tej samej turze.
3. Zerwanie idzie przez `breakTreatyVoluntarily(id, ai)`: kara Wiarygodności i okno N3 dotyczą inicjatora = AI (istniejąca ścieżka). Ta funkcja pokazuje ogólny podpowiedź „Zerwano traktat”; dla pary z graczem nadpisuję ją komunikatem „<cywilizacja> wypowiedziała umowę: zerowe zaufanie od 5 tur”. Dla pary AI-AI komunikat idzie tylko do konsoli (jak pozostałe zdarzenia AI↔AI). Brak nowego UI.
4. C1: protektor = najsilniejsza główna AI z `owners` inna niż p i niż partnerzy z licznikiem ≥1 (przy silniejszym partnerze). Premia łączy się z premią koalicji jako jedna flaga „premia” (wyprzedza willingness, jak dziś).
5. Stan licznika nie jest w SaveGame (decyzja ABC); reset przy nowej grze i wczytaniu.

BLOKADY: brak w kodzie. Flaga nie jest włączona domyślnie. Bieg dymny i pomiar ON/OFF do decyzji orkiestratora.

RUNDY: 1/5 (ostatni werdykt: brak; Operator).
NASTĘPNY KROK: Evaluator; bieg dymny flagi ON (≤30 tur, seed 4242) z hakiem `window.__truceTestDebug.zeroTrustForTest`.
DEPLOY/PUSH: NIE WYKONANO
