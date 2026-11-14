# R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 — Obrona Operatora, runda 3/5 (odpowiedź na zarzuty Evaluatora)

STATUS: DECISION_REQUIRED (bez zmiany wyniku pomiaru; zarzuty obsłużone: 5 PRZYJĘTE i wykonane, 2 PRZYJĘTE częściowo, 1 ODRZUCONE z dowodem; pkt 4 PRZYJĘTY jako otwarty, NIE_ZMIERZONO)
DOMAIN: GAME (oferty handlowe AI->gracz; kod gry bez zmian w tej obronie; zmiany: test regresji + poprawka raportu)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1
GOAL: bez zmiany celu z r3 (3–6 ofert/100 tur, bez spamu). Ta obrona NIE zmienia zachowania gry; domyka zarzuty do kodu testu i raportu oraz wyjaśnia przyczynę spadku liczby tur z parą.
BAZA: kandydat 86f4dc316 (operator r3); zarzuty dotyczą cffe589ab (raport Evaluatora).
ZMIANY-COMMIT: `gra/tools/ai-trade-offer-frequency-up-test.cjs` (scalenie testów r2+r3), `runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1/10-operator-claude.md` (poprawka liczb, lejka, białych znaków), `runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1/30-obrona-claude.md` (ten raport). Kod gry (`gra/src/main.ts`) NIE zmieniony względem 86f4dc316 (sprawdzone: `git diff 86f4dc316 -- gra/src/main.ts` puste). `gra/data/ai-params.json` NIE zmieniony. Commit: SHA w polu sha wyniku StructuredOutput.

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — konflikt integracyjny testów: PRZYJMUJĘ (poprawka wykonana)
- Próbowano `git merge d64cd5d46` (main z r2). Merge pociągnąłby całą różnicę main względem 6612d1596 (m.in. `dyspozycje/WERSJE.md`, `docs/encyklopedia/...`, runy innych tematów) — to poza allowlistą, więc merge przerwany (`git merge --abort`, bez commita).
- Zamiast tego scalono treść testów ręcznie: jeden plik `gra/tools/ai-trade-offer-frequency-up-test.cjs` zawiera [R2-1..R2-4] (cooldown=15, odstęp, bramki decideAIDiplomacy, limit/zapis cooldownu) z testu r2 oraz [R3-A], [R3-B] z r3. Jeden bundle esbuild (`ai.ts`, `diplomacy-economy.ts`, `diplomacy-pn-engine.ts`).
- Wynik na 86f4dc316: `=== ai-trade-offer-frequency-up-test: 28 pass, 0 fail ===` (exit 0).
- Konflikt add/add w `10-operator-claude.md` (r2 vs r3, ta sama nazwa pliku) NIE został rozstrzygnięty w tym commicie — rozstrzyga integrator (zalecane: dopisać treść r2 jako osobną sekcję tego samego pliku). Test i kod nie mają konfliktu (`git merge-tree` dotyczył tylko dwóch plików: test i 10-operator).

### Zarzut 2 — brak behawioralnego testu parytetu, limitu 1 oferty i odstępu: PRZYJMUJĘ CZĘŚCIOWO, ODRZUCAM reszta
- PRZYJĘTE: odstęp 15 tur jest teraz testowany behawioralnie ([R2-2]: `canAiProposeResourceTrade` dla tur +14 / +15) i bramki zachowania ([R2-3]: `decideAIDiplomacy` — kontakt, wojna, brak oferty, partner AI, 14 vs 15 tur). Parytet silnika wyceny: [R3-A] (ten sam payload per_turn daje PN x turnsMultiplier; opcje z mnożnikiem = opcje wyboru pary).
- ODRZUCONE: behawioralny test limitu „1 aktywna oferta” i parytetu „ta sama para → ta sama decyzja wyboru i enqueue”. Powód (dowód): enqueue i `hasPendingBarter` żyją w funkcji `boot()` w `gra/src/main.ts` (wywołanie `previewIncomingPlayerAccept` ok. linii 21037 i `enqueue` ok. 20958–21040 są wewnątrz zakresu `boot`), która NIE jest eksportowana — test węzłowy nie ma jak jej wywołać bez pełnej gry w przeglądarce (hooki `?civTest=1`). Zrobienie tego wymagałoby refaktoru `main.ts` poza zakresem r3. Dlatego: limit i parytet enqueue zostają źródłowe ([R2-4], [R3-B]) i NIE_ZMIERZONO na żywo; zachowanie w rozgrywce mierzy narzędzie pomiarowe.

### Zarzut 3 — pominięcie `trimProposalForZeroBalance` dla cyklicznej: PRZYJMUJĘ (bez zmiany kodu; ocena pozostaje decyzją właściciela)
Uczciwość po zmianie nadal chroniona przez (aktualne linie w `gra/src/main.ts`):
- 20992: `balancedPayload = clampedPayload` (tylko dla `zaproponuj_wymiane_cykliczna`; trim dla innych typów bez zmian);
- 21015–21016: filtr bilansu PW gracza (`aiProposalPlayerBenefitSurplus` z `pnCyclicOpts`);
- 21030–21032: `resolveProposalPn(balancedPayload, pnCyclicOpts)` + `handelFairnessGate(givePn, receivePn, …)` — bramka uczciwości;
- 21037: `previewIncomingPlayerAccept` — gracz nadal widzi podgląd „Przyjmij”;
- 24291: `fairnessGate` w `pickAiPlayerCyclicBarter` (wybór pary).
`aiOneshotHandelOverpaysPlayer` (`gra/src/game/diplomacy-proposals.ts`) NIE jest zmieniony w r3 (diff r3 dotyczy wyłącznie `main.ts`). Zgadzam się z oceną Evaluatora „ryzyko niskie”; nie zmieniam kodu.

### Zarzut 4 — spadek tur z parą (121–137 → 2–5 na 150): PRZYJMUJĘ jako otwarty problem; przyczyna wskazana kodowo, NIE_ZMIERZONO eksperymentem
- Fakt (dane z `evidence/r3-diag` i `evidence/r3-fix3`, pole `funnel`): baza 126/137/121 tur z parą poza cooldownem; po poprawce `noCdPair` = 0 na każdym ziarnie, `cdWithPair` = 2/5/3.
- Przyczyna (rozumowanie z kodu, nie zmierzone): wyszukiwanie pary (`pickAiPlayerCyclicBarter`) odbywa się PRZED wejściem na stół i PRZED `pnCyclicOpts`/bez-trimu. Jedyna zmiana r3 działająca na etapie wyszukiwania to dodatkowy warunek `payloadKeepsRealResourcesForPick` (`gra/src/main.ts` ok. 24297–24305, dołożony do `evaluateExactPayload`): para przechodzi tylko, gdy `clampNegotiationPayloadToRealResources` (z `turnsMult`=10) NIE zmienia koszyka. W scenariuszu ECON (zapasy gracza 400/0) ten clamp obcina stronę gracza, więc para odpada. Zmiany (a) i (b) nie mogą zmniejszyć liczby znalezionych par, bo działają po wyborze.
- NIE_ZMIERZONO: eksperyment „r3 bez warunku `payloadKeepsRealResourcesForPick`” NIE został wykonany w tej rundzie (wymagałby pomiaru >400 s); dlatego przyczynowość jest wnioskiem z kodu, nie z pomiaru. Dlaczego clamp obcina gracza w ECON, też NIE_ZMIERZONO.
- Konsekwencja dla decyzji (bez dostrajania): wybór pary sprawdza teraz wykonalność na cały czas wymiany — to uczciwe, ale ogranicza liczbę ofert. Opcje dla właściciela (jak w 10-operator-claude.md „DECYZJA”): C (mniejsza paczka zamiast odrzucania pary, nowy mechanizm, nie zmierzony) albo B (sprawdzać zasoby na 1 turę — zmiana reguły wykonalności, wymaga ABC).

### Zarzut 5 — liczby testu w raporcie są nieaktualne: PRZYJMUJĘ (poprawione)
Stare liczby (12 asercji, 4 OK/7 FAIL, 9 OK/2 FAIL) dotyczyły testu sprzed scalenia. Aktualne, z surowego wyjścia:
- kandydat 86f4dc316 (po scaleniu): `28 pass, 0 fail`, exit 0;
- baza 6612d1596 (`gra/src/main.ts` podmieniony na chwilę `git show 6612d1596:gra/src/main.ts`, potem `git checkout -- gra/src/main.ts`): `20 pass, 8 fail`, exit 1; wszystkie 8 FAIL to asercje [R3-B];
- mutacja (linia `resolveProposalPn(balancedPayload, pnCyclicOpts)` → `pnBalanceOpts`, potem przywrócenie): `26 pass, 2 fail`, exit 1 (FAIL: „bramka wejścia na stół … używa pnCyclicOpts”, „brak starej bramki na pnBalanceOpts”).
Poprawiono w `10-operator-claude.md`.

### Zarzut 6 — opis lejka nieścisły: PRZYJMUJĘ (poprawione)
Lejek sumuje się dokładnie do 150 tur na ziarno: cdTurns + noCdPair + noCdNoPair = 150 (s1111: 15 + 0 + 135; s2222: 15 + 0 + 135; s3333: 30 + 0 + 120). noCdNoPair = noCdNoAiSurplus + noCdPairNullBothSides (s1111: 6 + 129; s2222: 7 + 128; s3333: 6 + 114). Zdanie „kategorie się nakładają” było błędne i zostało usunięte z `10-operator-claude.md`. Tabela w raporcie przepisana z pól JSON `funnel`.

### Zarzut 7 — białe znaki w `10-operator-claude.md:21`: PRZYJMUJĘ (naprawione)
Usunięto końcową spację w linii „Lejek po poprawce …”. `git diff --check 6612d1596 86f4dc316` wykazywało tylko tę linię; po poprawce sprawdzenie na zakończonym commicie ma być puste (wynik w sekcji TESTY).

### Zarzut 8 — wydajność `payloadKeepsRealResourcesForPick` nie zmierzona: PRZYJMUJĘ jako NIE_ZMIERZONO
Nie mierzono kosztu (clamp + `JSON.stringify` na kandydata) per tura per AI. Zostaje jako NIE_ZMIERZONO; nie ma dowodu regresji wydajności ani jego braku.

## TESTY (surowe wyniki w tej obronie)
- `./node_modules/.bin/tsc --noEmit` w `gra/` → exit 0, 0 linii wyjścia. (`npm ci` w worktree tylko do zainstalowania zależności do testów; nie uruchamiano `npm run build/dev`.)
- `node tools/ai-trade-offer-frequency-up-test.cjs` na 86f4dc316 → `28 pass, 0 fail`, exit 0.
- Baza i mutacja: patrz zarzut 5 (wartości z surowego wyjścia konsoli).
- `git diff --check` po commicie: patrz sekcja poniżej (uzupełnione przed commitem).
- Bramki referencyjne (logic, tech-tree, research, unit-replace, combat, ai-trade-proposal-branch, ai-trade-proposal-to-player) NIE powtórzone w tej obronie — kod gry nie zmieniał się względem 86f4dc316, a ich wyniki są w 10-operator-claude.md (z r3).
- Dług bazowy `ai-trade-oneshot-overpay-limit-test` (czerwony na bazie) — nie naprawiany (dispatch r3 pkt 5), tylko odnotowany.

## BLOKADY
- Konflikt add/add `10-operator-claude.md` (r2 vs r3) — do rozstrzygnięcia przez integratora.
- Decyzja właściciela A/B/C/D (DECISION_REQUIRED) — bez zmiany w tej obronie.
- NIE_ZMIERZONO: eksperyment bez warunku `payloadKeepsRealResourcesForPick`; przyczyna zaniku clampu w ECON; koszt wydajności; zachowanie limitu 1 oferty i odstępu na żywo.

## UWAGI-DLA-ORKIESTRATORA
- Merge `d64cd5d46` (main) do gałęzi przerwany — nie wykonany; integrator powinien zrobić merge z pełnym przeglądem diffu (`git merge-base --is-ancestor 86f4dc316 <SHA>`, zgodnie z zasadą 5 w CLAUDE.md).
- Dług `ai-trade-oneshot-overpay-limit-test` (czerwony) — osobny temat (zgłoszony także w KOLEJKA jako #379).

## RUNDY
3/5 (ta obrona nie otwiera nowej rundy Operatora).

## NASTĘPNY KROK
Evaluator: ponowna ocena 2 commitów (kod bez zmian + test scalony + poprawka raportu). Orkiestrator: decyzja właściciela A/B/C/D; ewentualnie osobny pomiar wariantu bez `payloadKeepsRealResourcesForPick` (NIE_ZMIERZONO), by potwierdzić przyczynę z zarzutu 4.

## DEPLOY/PUSH: NIE WYKONANO
