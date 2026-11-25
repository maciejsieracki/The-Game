STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; bez zmian w gra/src, gra/data, wiki i gra/tools poza wymienionymi plikami testów)
TEMAT: R-WEB-TEST-DEBT-Q14-B
GOAL: Obrona rundy 3 (odpowiedź na zarzuty 1–5 Evaluatora, commit c122cea4b). Baza: 27a4680758b9fe7058ec06fdb326901e5fbdbabc, kandydat 57f222f520033ec053b6239ed15fadb7095c077e.

ODPOWIEDZI NA ZARZUTY

Zarzut 1 (dyplo-bilans runda2, 6 FAIL): PRZYJĘTY, naprawiony.
  Przyczyny (klasyfikacja z dowodem na bieżącym kodzie):
  - (0e) STARY-PIN liczby: po R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1 (commit e27418db7) gałąź reject 'pokoj' znów zawiera `pwBalance: pokojPwBalance` -> 2 wystąpienia, nie 1. Pin zmieniony na 2.
  - (1-PRZED) STARY-PIN wartości: mutacja A na fixturze daje net=-2100 (nie -210); symptom (ujemny net przy canAccept=true) nadal odtworzony. Pin -> -2100.
  - (2-PRZED) STARY-PIN: symptom „dodatni bilans przy zablokowanym pakiecie granic” NIE odtwarza się na tym fixturze (mutacja A: net=-188, canAccept=false). Pin przyjmuje stan mutacji A. NIE ZMIERZONO na oryginalnym pakiecie ze zrzutu.
  - (5-REGRESJA/PLAYER) i (5-KONTROLA/PLAYER) STARY-PIN decyzji właściciela: runda 4 zniosła bramkę w obu kierunkach, ale e27418db7 (R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1, Maciej, ECHO 2026-09-07) przywrócił bramkę KIERUNKOWO dla gracza-AUTORA. Kod diplomacy-proposals.ts ~2171: `if (authorIsPlayer && pokojPwBalance < 0) return accepted:false`. Asercje zmienione na accepted:false + „Brakuje N PW”. (5-KONTROLA) mutE (bez pola pwBalance) nadal daje accepted:false -> blokada wynika z logiki, nie z pola.
  - (6-setup) HARNESS: brak fixtur dla 4 typów z AIDiplomacyCommand (oferuj_miasto_za_pokoj, zada_miasto_za_pokoj, zaproponuj_wymiane_cykliczna, zaproponuj_przemarsz). Dodane fixtury; (6-PO) przechodzi dla wszystkich 14 typów.
  Wynik: dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs -> PODSUMOWANIE: 24 PASS / 0 FAIL (przed: 18/6).

Zarzut 2 (dyplo-bilans runda3, 17 FAIL): PRZYJĘTY, naprawiony.
  Przyczyny:
  - Needle mutacji nie pasował do kodu (e27418db7 zmienił gałąź AI na `gapBasePn` + `relationTotal(relation)`; PRE_R4_BLOCK/POST_R4_RETURN zdezaktualizowane). Needle R2 (R2_AI_NEEDLE) przepisany na bieżący tekst; mutR2 przywraca formułę rundy 2 w gałęzi AI. Mutacja czerwona potwierdzona: pwBalance -554/-307/-31 (zła/neutralna/bardzo dobra), canAccept=false we wszystkich trzech.
  - Test 1 i 2: wartości PO re-pinowane do bieżącego kodu (zła -554, neutralna 0, bardzo dobra 554; dar 300: zła -254, neutralna 300, bardzo dobra 854). Dar 300 przy neutralnej w wersji rundy 2 = -7 (regresja odtworzona).
  - Test 3: STARY-PIN wobec R-DYPLO-POKOJ-KIERUNEK (e27418db7): gracz-AUTOR z pwBalance<0 -> accepted:false; (3b) = accepted === (pwBalance >= 0); (3c) kontrola: bramka realnie blokuje >=1 scenariusz (przed: anyAcceptedDiffered, tautologiczne po przywróceniu bramki w kodzie).
  - Test 4 (PROOF): needle swap naprawiony (R2_AI_NEEDLE). Zmierzone: swap pusty koszyk neutralna = -307 (bit-identyczny z R2); swap dar 300 neutralna = -607 (R2 = -7; gorzej). Wartości zapisane jako SWAP_4A_EXPECTED / SWAP_4B_EXPECTED.
  Wynik: dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs -> PODSUMOWANIE: 27 PASS / 0 FAIL (przed: 10/17).

Zarzut 3 (A3 bez świeżego przebiegu live i bez mutacji toru): PRZYJĘTY, wykonany.
  - Świeży przebieg: ziarno 4242, 60 tur, resumed=false, bundle vite zbudowany poza repo (scratchpad .../q14d-live/dist, 08:53). Wynik: .../scratchpad/q14d-live/out3/ (seed4242.jsonl, .wiring.log, .events.log, .summary.json: endTurn 60, wallSec 249). Analizator: 4 OK / 0 FAIL. Linie sojuszu: „AI↔AI Sojusz Egipt(1)-Celtowie(13) (pełny, bezterminowy), dopłata 966 ¤ od Celtowie(13)” oraz „... Egipt(1)-Fenicjanie(22) ..., dopłata 431 ¤”.
  - Mutacja TORU (nie logu): w src/game/ai-ai-alliance-tick.ts linia 254 `const D = result.paymentGold;` -> `const D = 0;`, bundle zbudowany poza repo, świeży przebieg 60 tur (out-mut/, wallSec 246). Analizator: A3 FAIL (sojuszD [0,0], dopl 0), 3 OK / 1 FAIL, exit 1 -> asercja czerwona bez dopłaty D z toru. Plik src przywrócony z kopii (cmp identyczny; git diff src pusty).
  - NIE ZMIERZONO: skutek gry (balans) — to tylko dowód wiringu.

Zarzut 4 (A3 gałąź sojuszu słabsza niż NAP): PRZYJĘTY, poprawiony.
  Gałąź sojuszu wymaga teraz: sojusze.length >= 1 AND KAŻDY sojusz (pełny) niesie dopłatę D>0 w swojej linii AND liczba linii „dopłata N ¤ od …” >= liczby sojuszy. Dawne some(d>0) pozwalało na jeden sojusz z D i inne bez przelewu.
  Weryfikacja: świeży out3 -> 4 OK; mutant out-mut -> FAIL (3 OK / 1 FAIL).

Zarzut 5 (bramki nie ponowione): PRZYJĘTY, ponowione w tej rundzie (wszystkie zielone):
  - tsc --noEmit: exit 0
  - logic-test: LOGIC OK (213/213), exit 0
  - tech-tree-test: 20 pass, 0 fail
  - research-test: PASSED 33 / FAILED 0 / TOTAL 33
  - unit-replace-test: 21 [OK], 0 FAIL (grep liczby [OK]=21)
  - combat-test: COMBAT TEST 6/6 pass
  - ai-test: 297 passed, 0 failed
  - era-war-pairing-alliance-test: 19 pass, 0 fail
  - ai-ai-alliance-surcharge-test: RESULT: ALL GREEN (live + mutants detected)
  - dyplo runda2: 24/0; dyplo runda3: 27/0; ai-ai-treaty-live-proof-wiring: 4 OK / 0 FAIL (świeży przebieg).

ZMIANY/COMMIT (allowlista, git add tylko te ścieżki):
- gra/tools/dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs (re-pin + fixtury 4 typów; asercje nie osłabione)
- gra/tools/dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs (needle R2/swap, re-pin wartości, bramka kierunkowa)
- gra/tools/ai-ai-treaty-live-proof-wiring-test.cjs (A3: spójność gałęzi sojuszu)
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-B/30-obrona-claude.md (ten raport)
Brak zmian w gra/src, gra/data, wiki, gra/tools/ai-army-composition-per-civ*, hud-moc-warstwa*, climate-band-test. Mutacja toru w ai-ai-alliance-tick.ts była TYMCZASOWA i wycofana przed commitem.

TESTY: patrz ODPOWIEDZI NA ZARZUTY (surowe wyniki z przebiegów; logi w scratchpad: g-*.txt, r2b.txt, r3c.txt, q14d-live/mut-run.log).

BLOKADY:
- ai-army-composition-per-civ: 10 FAIL, nietknięte (czeka na decyzję właściciela, ABC).
- hud-moc-warstwa: 26/2, BŁĄD-GRY kandydat (literał 0 w gra/src main.ts:3140, :24044; R-WEB-HUD-ME-MIGRATION-Q1). Nietknięte.
- Dyplomacja (zarzut 2 STARY-PIN) — części pinów przyjmują stan kodu bieżącego, a nie historyczny zrzut; zaznaczone w komentarzach.

UWAGI-DLA-ORKIESTRATORA:
1. Pin (2-PRZED) dyplo-runda2: symptom ze zrzutu 2 (dodatni bilans przy zablokowanym pakiecie granic) nie reprodukuje się na obecnym fixturze. Decyzja ABC: czy pakiet ze zrzutu trzeba odtworzyć innym fixturem (NIE ZMIERZONO).
2. Kierunkowa bramka pokoju (e27418db7) jest zgodna z testem (5-REGRESJA/PLAYER) i (3b). Rundy 4 zalecenie „oba kierunki” jest nieaktualne dla gracza-autora — do potwierdzenia przez właściciela, jeśli dyspozycja rundy 4 nadal obowiązuje.
3. Dysk: po zakończeniu sprzątam node_modules (gra/) i dist w scratchpad; logi out3/out-mut zostają jako dowód.
4. Brak nowych sesji/zadań/harmonogramów. Brak run_in_background.

RUNDY: 3/5 (obrona rundy 3)
NASTĘPNY KROK: Evaluator rundy 3 na czubku tej gałęzi (commit wpisany w odpowiedzi Operatora jako sha).
DEPLOY/PUSH: NIE WYKONANO
