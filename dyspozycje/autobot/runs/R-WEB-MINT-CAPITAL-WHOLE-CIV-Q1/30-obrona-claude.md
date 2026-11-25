# R-WEB-MINT-CAPITAL-WHOLE-CIV-Q1 — obrona Operatora (runda 2)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-MINT-CAPITAL-WHOLE-CIV-Q1
GOAL: Mennica w stolicy podnosi podatek wszystkich miast cywilizacji (przewodnik §49.3b), bez zmiany wartości bonusu; H2e zielony bez osłabiania asercji; nowy test negatywny i mutacja.
BAZA: origin/main 35f601ae304471593c4921a61bfecbddbb9de14a; kandydat Operatora r1 e07d05b1e41c300e61fa7efc7cd931d062f86e1b (checkout --detach).

## Ustalenia dochodzenia (zakres kodu)

- Bramka Mennicy jest już imperialna (zakres „cała cywilizacja”): `gra/src/game/turn-economy.ts` `ownersWithMennica()` (ok. l.258) zbiera właścicieli mających Mennicę w KTÓRYMKOLWIEK mieście; wynik `mennicaOwners` (l.2184, l.2828) ustawia `maMennicaBuiltEmpireWide` dla KAŻDEGO miasta właściciela (l.2281, l.2966). Ten sam union jest w `gra/src/ui/cityPanel.ts` ok. l.1514 (`ownerHasMennica`).
- Mnożnik wchodzi do podatku miasta w `gra/src/game/economy.ts` (`mennicaMnoznikForCiv`, l.796; użycie l.995) jako `maMennica` z `cityYieldPerTurn`.
- Wniosek: zasięg „całej cywilizacji” NIE wymaga zmiany kodu gry. Stan main nie jest zawężony do miasta lokalnego. Czerwień H2e na main wynikała z danych scenariusza testu (patrz niżej), a nie z zasięgu bonusu.
- Mutacja potwierdzająca (zawężenie do miasta lokalnego, `mennicaOwners.has(city.ownerId)` → `(builtByCity.get(city.id) ?? []).includes("mennica")`, obie linie l.2281 i l.2966 zastąpione): `trade-routes-income-test.cjs` → `FAIL: H2e ... (mint=2, noMint=2)`, wynik `134 passed, 1 failed`. Plik przywrócony (`git checkout --`), potem ponowny bieg: `135 passed, 0 failed`.

## Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 (fixture H2e: populacja pH2 4 → 8 zamiast naprawy kodu): PRZYJMUJĘ część dotyczącą opisu i ODRZUCAM zarzut o naprawie kodu z dowodem.**
- Dowód (temp kopia testu, tylko `secondOwnerCity.population` zmieniane, asercje bez zmian):
  - pop=4: `FAIL: H2e ... (mint=2, noMint=2)`
  - pop=5: `FAIL: H2e ... (mint=2, noMint=2)`
  - pop=6, 7, 8: H2e zielony.
- Przyczyna: przy małej populacji podatek miasta jest tak mały, że `floor()` i podział suwakami (30/60/10) zjadają mnożnik Mennicy (Evaluator: Nauka 3→5, Podatek 2→2). To jest zachowanie liczbowe silnika (zaokrąglanie), nie błąd zasięgu. Zmiana zaokrąglenia byłaby zmianą balansu → wg dispatchu DECISION_REQUIRED, nie kodowanie.
- Fixture zmieniony na pop 8 (zakres bezpieczny: pop ≥ 6). Asercje H2e nietknięte. Komentarz w teście opisuje powód.
- DECYZJA DLA WŁAŚCICIELA (jedno zdanie): przy populacji ≤ 5 Mennica w stolicy daje zerowy przyrost Podatku w innym mieście (zaokrąglenie), czy to ma być poprawione?

**Zarzut 2 (brak bramki „Mennica tylko w stolicy”; rozbieżność z §49.3b niezgłoszona): PRZYJMUJĘ jako zgłoszenie, ODRZUCAM jako zmianę kodu w tej rundzie.**
- Dowód braku bramki: `gra/data/buildings.json` (id `mennica`, l.913) nie ma warunku stolicy; `building-resource-gate.ts` (mennica: l.76, l.119, l.279–280, l.594–595) sprawdza tylko zasób (złoto) i technologię; `grep -i "capital|stolic"` w `cities.ts` przy budynkach: brak wyniku.
- Przewodnik §49.3b mówi o Mennicy „w stolicy”; komentarze kodu (`cityPanel.ts` l.1507–1509, `turn-economy.ts` l.254–257) mówią, że Mennica stoi „wyłącznie w stolicy (pytanie 70/B)”, ale ten warunek nie jest egzekwowany. Dopuszczenie Mennicy w innym mieście albo zakaz budowy to decyzja o regułach budowy → DECISION_REQUIRED (nie kodowane).

**Zarzut 3 (brak testu wariantu „cywilizacja z Mennicą poza stolicą”): PRZYJMUJĘ jako lukę, NIE DOPISUJĘ asercji w tej rundzie.**
- Asercja „Mennica poza stolicą nie działa na całą cywilizację” byłaby czerwona na obecnym kodzie (bonus jest imperialny z każdego miasta), a asercja odwrotna zakodowałaby niezdecydowaną regułę. Obie wymagają decyzji właściciela z zarzutu 2. Wariant pozostaje otwarty i jest wpisany do DECISION_REQUIRED.
- Mutację wymaganą w dispatchu (zawężenie → H2e czerwony) wykonano i udokumentowano powyżej.

## Zmiany (ZMIANY/COMMIT)

- Kod gry (`gra/src`): BEZ ZMIAN względem e07d05b1e.
- Test `gra/tools/trade-routes-income-test.cjs`: BEZ ZMIAN względem e07d05b1e (fixture pop 8 i H2g zostają; asercje H2e nietknięte).
- Ten raport: `dyspozycje/autobot/runs/R-WEB-MINT-CAPITAL-WHOLE-CIV-Q1/30-obrona-claude.md`.
- Commit: jedyny plik to raport (`git add` konkretnej ścieżki).

## TESTY (surowe wyniki)

- `node tools/trade-routes-income-test.cjs` (kandydat, po `npm install` w gra/): `135 passed, 0 failed`.
- Temp pop sweep: pop 4 i 5 → H2e FAIL; pop 6, 7, 8 → H2e zielony (plik temp usunięty).
- Mutacja lokalnego zasięgu: `134 passed, 1 failed` (FAIL: H2e), przywrócono, `135 passed, 0 failed`.
- NIE ZMIERZONO w tej rundzie: tsc, logic, tech-tree, research, unit-replace, combat, ai-test, era-war-pairing-alliance, ai-ai-alliance-surcharge i pozostałe testy ekonomii (kod gry nie zmieniony w rundzie 2, bramki z kandydata r1 nie były powtarzane).

## BLOKADY

- Decyzja właściciela 1: zaokrąglanie przy małej populacji (pop ≤ 5 → przyrost Podatku 0 od Mennicy stolicy w innym mieście). Konflikt: zostawić zaokrąglanie (test z pop 8) vs zmienić zaokrąglanie (zmiana balansu, poza zakresem tematu).
- Decyzja właściciela 2: czy Mennica może stać poza stolicą. Konflikt: §49.3b i komentarze kodu mówią „w stolicy”, dane budynku i bramki tego nie egzekwują; bez decyzji nie da się napisać asercji negatywnej bez wybierania reguły.

## RUNDY

2/5 (runda obrony po zarzutach Evaluatora r1).

## NASTĘPNY KROK

Orkiestrator: przekazać właścicielowi dwie decyzje (BLOKADY). Po decyzji 2 (Mennica tylko w stolicy → bramka w `building-resource-gate.ts`/`cities.ts`; lub dozwolona poza stolicą → asercja negatywna z przewodnikiem) otworzyć kolejną rundę Operatora. Po decyzji 1 (zmiana zaokrąglenia) otworzyć osobny temat z pełną bramką ekonomii.

## UWAGI-DLA-ORKIESTRATORA

- Główny wniosek: zakres „cała cywilizacja” jest już w kodzie (`ownersWithMennica`). Temat „Mennica w stolicy działa na całą cywilizację” (#84) może być w większej części zamknięty przez test i decyzje, bez zmiany kodu gry. Ocena należy do orkiestratora/FC.
- Plik `gra/tools/trade-routes-income-test.cjs` ma komentarz o populacji 8 — zgodny z dowodem (próg 5/6).
- Test wymaga `gra/node_modules` (esbuild) — zainstalowano lokalnie w worktree, katalog jest ignorowany przez git; usunięcie po bramkach zgodnie z dispatchem.

DEPLOY/PUSH: NIE WYKONANO
