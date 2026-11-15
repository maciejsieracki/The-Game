# R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 — Obrona (Operator, HAIKU), runda 2/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1
GOAL: oferty AI->gracz z ~0,89 do 3–6/100 tur bez spamu, bez obniżania uczciwości wyceny. NIE OSIĄGNIĘTY: zmierzone 0,22/100 tur. Do decyzji właściciela O1/O2/O3 (patrz 10-operator-claude.md, sekcja BLOKADY).
BAZA KODU: db887a9c1 (kandydat Operatora r2; kod gry = 359d2df9c). Ta obrona startuje od db887a9c1.
ZMIANY-COMMIT: 9ecf93179 (kod + testy; obrona), ten raport w osobnym commicie po nim.
- `gra/data/ai-params.json`: `propozycja_wymiany_surowcow_cooldown_tur` **5 → 15** (cofnięcie zmiany Operatora, wartość bazowa właściciela; przed 5, po 15).
- `gra/tools/ai-trade-proposal-branch-test.cjs`, `gra/tools/ai-trade-proposal-to-player-test.cjs`: asercje cooldownu przywrócone do 15 (identyczne z 359d2df9c).
- `gra/tools/ai-trade-offer-frequency-up-test.cjs`: przepisany (patrz zarzut 3).
- Nie zmieniano `gra/src/` (zero zmian w grze względem 359d2df9c).
- Narzędzia pomiarowe i evidence z rundy 2 zostają bez zmian (opis niżej, zarzut 4).

## ODPOWIEDZI NA ZARZUTY EVALUATORA

**Zarzut 1 (istotny, cooldown bez efektu): PRZYJMUJĘ.**
Poprawka: `ai-params.json` wraca do 15 (commit 9ecf93179). Dowód: `git diff 359d2df9c -- gra/data/ai-params.json` = pusty; `grep -A1 propozycja_wymiany_surowcow_cooldown_tur gra/data/ai-params.json` pokazuje `"wartosc": 15`. Powód: pomiar Evaluatora i Operatora (evidence/base-econ-cd15 vs evidence/cd5) daje identyczne 0/0/1 ofert; w ziarnach 1111 i 2222 `funnel.cdTurns=0` w obu wariantach, więc cooldown nie ogranicza. Zmiana tylko podnosiła sufit (20 zamiast ~6,7 ofert/100 tur/AI) bez korzyści. Zmiana wartości wymaga decyzji właściciela (O1/O2/O3).

**Zarzut 2 (istotny, przyczyna jest hipotezą): PRZYJMUJĘ jako zarzut o statusie dowodu; NIE wdrażam poprawki.**
- Przyjmuję: w 10-operator-claude.md przyczyna „pary nie trafiają na stół przez rozjazd wycen” jest NIE_ZMIERZONA. Nie przedstawiam jej jako ustalonej.
- Sprawdzenie kodu (ta obrona, `gra/src/main.ts` na db887a9c1): `pnBalanceOpts` (l. 20958) nie ma `tempoGry` ani `...proposalPnTurnsMultiplier(...)`; `pnOpts` wyboru pary (l. 24249–24256) je ma. Ponadto `pnBalanceOpts` używa `actionId: converted.actionId`, a `pnOpts` ma `actionId: 'handel'`. Ta druga różnica nie była wymieniona w raporcie Operatora i wymaga osobnego pomiaru.
- Nie wdrażam O1 (wyrównanie wycen): zmienia zachowanie bramki wejścia na stół w grze, a dispatch i 10-operator-claude.md wymagają na to zgody właściciela. Bez zgody i bez zmierzonego efektu nie ruszam kodu gry.
- Dług: rozkład odrzuceń po ziarnach (givePn > receivePn) nie został zmierzony; to zadanie dla rundy 3 po decyzji właściciela.

**Zarzut 3 (średni, test nie testuje zachowania): PRZYJMUJĘ — poprawka częściowa.**
Nowy `gra/tools/ai-trade-offer-frequency-up-test.cjs`:
- [1] strażnik wartości 15 (ai-params i ai.ts) — tylko jako ochrona przed nieplanowaną zmianą;
- [2] **zachowanie**: `canAiProposeResourceTrade` — tura +14 zablokowana, +15 dozwolona, brak poprzedniej propozycji dozwolona;
- [3] **zachowanie** przez `decideAIDiplomacy` (ai.ts): brak kontaktu, wojna, brak kandydata wymiany, partner AI-AI → brak komendy; tura 24 (14 tur po) zablokowana, tura 25 (15 tur po) dozwolona; pełne warunki → jedna komenda;
- [4] źródłowo (main.ts): bramka `!hasPendingBarter`, zapis cooldownu dopiero przy wstawieniu oferty na stół.
Nadal NIE_ZMIERZONO: zachowanie limitu „1 aktywna oferta” w pełnej grze (wymaga uruchomienia enqueue w main.ts). Test pkt [4] pozostaje źródłowy i jest to zaznaczone w nagłówku pliku.

**Zarzut 4 (niski, porównywalność i etykiety): PRZYJMUJĘ jako fakt; nie przeliczam evidence.**
- Potwierdzam: w `evidence/base-econ-cd15/cell-s1111-r80.json` bucket to `noCdNoMeDeficit`, w `evidence/cd5/cell-s1111-r80.json` to `noCdPairNullBothSides`. Liczby dla tych samych tur są zgodne (14 = 14), ale etykiety są różne. Mapowanie: `noCdNoMeDeficit` (stara etykieta, bez `resourceDeficitKeysForOwner`) = `noCdPairNullBothSides` (nowa).
- Poprawka: nie przeliczam ponownie evidence bazy (NIE_ZMIERZONO), tylko zapisuję mapowanie tutaj.
- Agregat `cdBlockedPairOrProbe` z dispatchu nie istnieje w repo (potwierdzone wcześniej: grep 0 trafień).
- Obsługa bramki NNS (dosypania 27/23/28) nadal oznacza, że wynik 0,22 nie jest porównywalny z 0,89 z r4. Zapisane w 10-operator-claude.md.

**Zarzut 5 (niski, zakres pomiaru): PRZYJMUJĘ zakres niedoskonały; ODRZUCAM wymóg pomiaru relacji 20 i 50.**
- Przyjmuję: symulowana ekonomia (zapasy 400/0 przez `setStock`, bez produkcji i wielu miast) jest przybliżeniem realnej gospodarki. Zapisane jako NIE_ZMIERZONO.
- Odrzucam: dispatch (00-dispatch-DODATEK-claude.md, DODATEK 1, pkt 1) mówi wprost „relacje nie mają wpływu — nie mnóż”. Pomiar na jednej relacji (80) jest zgodny z dispatchem. Zmiana pomiaru w tym miejscu nie jest uprawniona.

## TESTY (surowe wyniki, ta obrona, na 9ecf93179)

- `node tools/ai-trade-offer-frequency-up-test.cjs` (w gra/): `=== ai-trade-offer-frequency-up-test: 17 pass, 0 fail ===`, exit 0.
- Mutacja (ai-params cooldown 15 → 5, `sed` na pierwszej wartości 15, potem przywrócone do 15): `=== ai-trade-offer-frequency-up-test: 13 pass, 4 fail ===`, exit 1 (FAIL: wartość 15 vs 5, AI_TRADE_BARTER_COOLDOWN_TURNS=5, FAIL „14. tura po propozycji zablokowana” i „tura 24 (14 tur po) zablokowane”). Dowód mutacyjny działa.
- `node tools/ai-trade-proposal-branch-test.cjs`: `10 passed, 0 failed`, exit 0.
- `node tools/ai-trade-proposal-to-player-test.cjs`: `25 assertions passed`, exit 0.
- Pięć bramek referencyjnych (exit kody z tej obrony): `logic-test` exit 0; `tech-tree-test` exit 0; `research-test` exit 0; `unit-replace-test` exit 0; `combat-test` exit 0.
- `npx tsc --noEmit` (gra/): exit 0.
- `git diff --check --cached` przed commitem: czysto.
- Znany dług (nie z tej rundy, nie naprawiany): `ai-trade-oneshot-overpay-limit-test` FAIL na bazie 359d2df9c (zgodnie z Evaluatorem).
- Pomiar w grze (10-operator, evidence) NIE powtarzany w tej obronie — NIE_ZMIERZONO.

## BLOKADY / DECYZJA WŁAŚCICIELA

GOAL (3–6/100 tur) nie osiągnięty; zmierzone 0,22/100 tur. Opcje z 10-operator-claude.md, z uwagami tej obrony:
- **O1** (wyrównanie wyceny wejścia na stół z wyborem pary: `tempoGry` + `proposalPnTurnsMultiplier` w `pnBalanceOpts`, ewentualnie `actionId`): wymaga zgody właściciela (zmienia bramkę w grze), potem runda 3 z pomiarem 3×150 tur i testem parytetu wyceny.
- **O2** (cooldown 5 bez O1): odrzucone w tej obronie — brak efektu, podnosi sufit spamu.
- **O3** (cooldown 15, zostaje): wdrożone w tym commicie jako stan obecny.
Wniosek o ryzyku spamu: limit 1 aktywnej oferty na AI zachowany w kodzie (źródłowo); odstęp = cooldown 15 tur; teoretyczny sufit ~6,7 ofert/100 tur/AI przy cooldownie 15; zmierzone 0,22.

## RUNDY

Runda 2/5 (obrona w obrębie tej rundy). Kolejna runda (3/5) dopiero po decyzji O1/O3.

## NASTĘPNY KROK

Orkiestrator (właściciel): decyzja O1 albo zamknięcie tematu z wynikiem 0,22/100 tur (O3). Evaluator/FC ponownie po zmianach w tej obronie. Integracja dopiero po decyzji.

## UWAGI-DLA-ORKIESTRATORA

- Wrażliwy dług: `ai-trade-oneshot-overpay-limit-test` czerwony na bazie (osobny temat testowy).
- Drobna różnica `actionId` (`converted.actionId` vs `'handel'`) między `pnBalanceOpts` a `pnOpts` (main.ts l. 20958 vs 24249) — do sprawdzenia w rundzie 3, jeśli zostanie wybrane O1.
- Dług Rust: REPIN ai-params (cooldown) dopiero, jeśli wartość zmieni się w integracji (obecnie bez zmiany względem bazy).

NIE_ZMIERZONO: efekt O1; rozkład odrzuceń po ziarnach; limit „1 aktywna oferta” w pełnej grze; relacje 20 i 50 (poza zakresem wg DODATEK 1); realizm ekonomii (symulowany).

DEPLOY/PUSH: NIE WYKONANO
