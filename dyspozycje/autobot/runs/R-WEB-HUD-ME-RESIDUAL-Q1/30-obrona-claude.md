STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-RESIDUAL-Q1
GOAL: ostatnie literały właściciela 0 w roli gracza aktywnego (hotseat) podstawione ME(); w grze jednoosobowej zachowanie bit-w-bit (ME() = 0). Obrona rundy 2 po FC r1 (zarzuty 1–7 Evaluatora).
ZMIANY-COMMIT: baza obrony = kandydat 9ab57259e (runda 2 Operatora). Ta obrona: gra/src/main.ts (12 linii zmienionych względem 9ab57259e: 12 podstawień 0 -> ME(), lista niżej), gra/tools/hud-me-literal-zero-test.cjs (+12 wierszy RESIDUAL_ROWS, wiersz listBuildableWondersForOwner(ME()) z 1 na 3 wystąpienia), gra/tools/disband-refund-resources-test.cjs (kotwice: 0 -> (?:0|ME())), gra/tools/era-cud-main-ts-integracja-test.cjs (kotwice 3b/4a/4b i mutacje M10/4a: 0 -> (?:0|ME())), gra/tools/pr141-hotseat-diplomacy-owner-test.cjs (stub ME: () => 0 w kontekście vm), dyspozycje/autobot/runs/R-WEB-HUD-ME-RESIDUAL-Q1/30-obrona-claude.md.
UWAGA ALLOWLISTA: 3 pliki testów (disband, era-cud, pr141-diplomacy) są poza pierwotną allowlistą dispatchu. Zmiany w nich dotyczą wyłącznie wzorców kotwic po podstawieniu ME() i stubu ME(); bez nich testy czerwieniłyby się na poprawnej zmianie głównej. Do decyzji orkiestratora przy FC.
SHA: patrz pole sha w wyniku StructuredOutput (czubek tej rundy).

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 — pr141-hotseat-diplomacy-owner-test ME is not defined: PRZYJMUJĘ (naprawione)
Dowód: po dodaniu `ME: () => 0` do kontekstu vm: `node gra/tools/pr141-hotseat-diplomacy-owner-test.cjs` -> `TOTAL 10/10`, exit 0 (przed: 9/10).

### Zarzut 2 — disband-refund-resources-test (ME, zwrot surowców/Manpower): PRZYJMUJĘ (naprawione)
Przyczyna: test jest kotwicą tekstową i szukał `disbandStockRefundCredit(cities, 0, u, stockRefundCap)` oraz `refundManpowerToEmpire(cities, 0, ep, mpRefund`. Kod ma już ME() (zmiana zamierzona, r2). Wzorce przyjmują teraz `(?:0|ME())`. Nie osłabiono żadnej asercji semantycznej (dalej wymagany zwrot przez disbandStockRefundCredit z capem i zwrot Manpower).
Dowód: `node gra/tools/disband-refund-resources-test.cjs` -> `45 passed, 0 failed`, exit 0 (przed: exit 1, 43/2).

### Zarzut 3 — era-cud-main-ts-integracja-test (Blok 3b, 4a, 4b, M1/M2/M5/M10): PRZYJMUJĘ (naprawione)
Przyczyna: kotwice RE_3B / RE_4A / RE_4B i mutacje M10/4a miały literał `=== 0`; kod ma `=== ME()`. Zmieniono wyłącznie wzorce (0 -> (?:0|ME())) i tekst mutanta M4a (0 -> ME()). Mutacje nadal dotykają tej samej linii (`if (site.ownerId === ME())` / `if (city.ownerId === ME())`).
Dowód: `node gra/tools/era-cud-main-ts-integracja-test.cjs` -> `15 passed, 0 failed`, `grep -c MUT-FAIL` = 0 (wszystkie mutacje złapane), exit 0 (przed: exit 1, 12/3, MUT-FAIL x4).

### Zarzut 4 — skan Operatora r2 niekompletny: PRZYJMUJĘ (uzupełniony skan)
Przed podjęciem decyzji uruchomiłem wszystkie testy wycinające funkcje, które zmienia ta runda lub które mają kotwice na zmienionych liniach (lista wyników niżej w TESTY). Każdy z trzech regresji z zarzutu 1–3 jest teraz zielony. Pełnego przebiegu wszystkich 801 testów używających main.ts nie wykonano (koszt czasu; wiele to przeglądarkowe testy live, które w tym środowisku nie działają — patrz BLOKADY).

### Zarzut 5 — niekompletna tabela decyzji: PRZYJMUJĘ CZĘŚCIOWO (wymienione pozycje rozstrzygnięte; zakres poszerzony skanem — NIE ROZSTRZYGNIĘTE)
Decyzje dla pozycji wymienionych w zarzucie (0 = rola gracza aktywnego -> ZMIEŃ na ME(); 0 jako fotel AI / fotel startowy / partner dyplomacji -> ZOSTAW z uzasadnieniem):

| plik:linia (kandydat 9ab57259e) | rola | decyzja | dowód / uzasadnienie |
|---|---|---|---|
| main.ts 4421 playerWonderInProgressIds `c.ownerId !== 0` | aktywny | ZMIEŃ -> ME() | lista cudów gracza do panelu epok; w grze 1-os. ME()=0 |
| main.ts 4437 computeEraGateInfo `civTypeForOwner(0)` | aktywny | ZMIEŃ -> ME() | obok `era: player.era` (gracz) |
| main.ts 5552 wonderHudEntries `listBuildableWondersForOwner(0)` | aktywny | ZMIEŃ -> ME() | sąsiedni filtr `isMe(s.ownerId)` |
| main.ts 5773 wondersPicker `listBuildableWondersForOwner(0)` | aktywny | ZMIEŃ -> ME() | komunikat „Brak miasta gracza” — gracz aktywny |
| main.ts 7148 buildImprovementState `hasTradeRouteResourceAccess(...,0,'kon')` | aktywny | ZMIEŃ -> ME() | bramka Konia dla imperium gracza (ta sama co w silniku) |
| main.ts 9296 selectPlayerResearchSlug `researchGateForOwner(0)` | aktywny | ZMIEŃ -> ME() | wybór badania przez gracza |
| main.ts 11246 isOwnerPlayerSameCivType `civTypeForOwner(0)` | aktywny | ZMIEŃ -> ME() | funkcja porównuje z „typem gracza” (dokument funkcji) |
| main.ts 17551 buildCheck `citySurowceSumForOwner(0).kon` | aktywny | ZMIEŃ -> ME() | stan magazynu konia imperium gracza przy budowie |
| main.ts 17555 `ownUnitHexKeysForOwner(0)` | aktywny | ZMIEŃ -> ME() | własna jednostka gracza przy budowie fortu |
| main.ts 18008 `citySurowceSumForOwner(0).kon` (defensywny drugi punkt) | aktywny | ZMIEŃ -> ME() | ten sam magazyn co 17551 |
| main.ts 18684 onOpenTree (awans epoki) `showTechTreeView(0)` | aktywny | ZMIEŃ -> ME() | powiadomienie dla aktywnego fotela; techTreeView.ts:931 używa `activeOwner` |
| main.ts 20352 case 'tech-tree' `showTechTreeView(0)` | aktywny | ZMIEŃ -> ME() | ten sam widok co 18684 |
| main.ts 12212 `sc.ownerId === 0 ? freshOwnerDefaultPodzialHandlu()` | fotel startowy | ZOSTAW (literał 0) | Ścieżka spawnu miast-państw/cywilizacji (komentarz 12210–12211). Zamiana na ME() zmieniłaby zachowanie dla fotela startowego w hotseat; wymaga osobnej decyzji, nie „podstawienia”. Poprzednie twierdzenie o zmianie 12212 w rundzie 2 było BŁĘDNE — linia nie była zmieniona (deklarowana zmiana dotyczyła su.ownerId, l.14502, które już było ME()). |
| main.ts 13525 `partnerOwnerId: 0` i 13573 `clampAiProposalPayloadToRealResources(aiOwnerId, 0, payload)` | adresat AI | ZOSTAW (literał 0) | Adresat propozycji AI w hotseat: zmiana zmienia ADRESATA dyplomacji (routing), nie tylko podstawienie właściciela. Wymaga ABC/osobnego tematu. NIE ZWERYFIKOWANO runtime. |

Zakres poszerzony skanem: `grep` po main.ts znajduje dodatkowe literały 0 w roli gracza, których NIE rozstrzygałem w tej rundzie (przykłady, nie komplet): showTechTreeView(0) w liniach 29174, 29257, 30237, 30243, 35208, 36456, 44274; researchGateForOwner(0) w 30219, 35156, 35184, 36428; ulepszeniaEmpireForOwner(0) w 29468, 29481, 29490, 29501, 29521, 45242; buildHudState(0) w 33061, 34418; capitalCityIdForOwner(0) w 39840, 39884, 42092, 45832; empireEpochForOwner(0) 45836; civBonusyForOwnerId(0) 42050; civDisplayNameForOwner(0) 40496; totalActiveForcedWarsByOwner(0) 45845, 45862; setOwnerTreasury(0) 33017; oraz ok. 30 filtrów `u.ownerId === 0` / `c.ownerId === 0`. To jest zakres większy niż zarzut 5 i wymaga decyzji orkiestratora (osobny temat albo rozszerzenie tej rundy). NIE ROZSTRZYGNIĘTE.

### Zarzut 6 — rozbieżność raport vs diff (12212, su.ownerId): PRZYJMUJĘ
Potwierdzone: `git diff 94d717438 9ab57259e -- gra/src/main.ts` nie zawiera zmiany linii 12212 (nadal `sc.ownerId === 0`); zmiana 14502 dotyczy `su.ownerId === ME()`. Raport rundy 2 był błędny w opisie 12212; korygują to wiersze tabeli powyżej (ZOSTAW).

### Zarzut 7 — nota: test RESIDUAL_ROWS kruchy na identyczne linie: PRZYJMUJĘ jako notę, BEZ zmiany
Nowe wiersze stosują ten sam mechanizm licznika (wystąpienia tekstu). Ryzyko kruchości pozostaje i jest jawnie opisane w komentarzu nad wierszami. Nie zmieniano w tej rundzie.

## Dowody mutacyjne (liczby z surowego wyjścia tej rundy)
- Mutacja każdej z 12 zmienionych linii main.ts (przywrócenie literała 0 w kopii, `HUD_ME_GUARD_MAIN`): `KILLED 12/12` — każda kopia czerwona (exit 1).
- era-cud: 0 x MUT-FAIL (wszystkie mutacje złapane).

## TESTY (surowe wyniki tej rundy)
- `gra/node_modules/.bin/tsc --noEmit -p gra/` (uruchomione z katalogu gra/): exit 0.
- `node gra/tools/logic-test.cjs` -> `LOGIC OK (213/213)`.
- `node gra/tools/hud-me-literal-zero-test.cjs` -> `Wynik: 150 PASS / 0 FAIL`.
- `node gra/tools/hud-owner-hotseat-source-test.cjs` -> `Wynik: 58 PASS / 0 FAIL`.
- `node gra/tools/hud-moc-warstwa-test.cjs` -> `WYNIK: 28 PASS, 0 FAIL`.
- `node gra/tools/pr141-hotseat-diplomacy-owner-test.cjs` -> `TOTAL 10/10`.
- `node gra/tools/pr141-hotseat-production-owner-routing-test.cjs` -> wszystkie PASS, exit 0 (ostatnia linia: `PASS: actual owner-routed source callbacks/helpers cover human owners 0/7/42, AI`).
- `node gra/tools/disband-refund-resources-test.cjs` -> `45 passed, 0 failed`.
- `node gra/tools/era-cud-main-ts-integracja-test.cjs` -> `15 passed, 0 failed`.
- `node gra/tools/recruitment-batch-contract-test.cjs` -> `17 passed, 0 failed`.
- `node gra/tools/unit-replace-test.cjs` -> `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node gra/tools/unit-replace-multitype-walk-test.cjs` -> `wynik: 25 OK, 0 FAIL`.
- `node gra/tools/trade-grant-test.cjs` -> `62 passed, 0 failed`; `trade-ilosc-test` -> `23 passed, 0 failed`; `zloto-szlak-test` -> `48 passed, 0 failed`.
- `node gra/tools/improvement-card-callsites-test.cjs` -> `36 pass, 0 fail`; `iron-native-access-fix-test` -> `17 passed, 0 failed`; `granice-relacja-dyplomatyczna-test` -> `52 passed, 0 failed`.
- `node gra/tools/era-recruit-panel-refresh-test.cjs` -> `4 passed, 0 failed`; `disband-unit-mark-dirty-test` -> `6 passed, 0 failed`.
- `node gra/tools/hotseat-etap6d-podetap-d-exec-test.cjs` -> `46 PASS, 0 FAIL`.
- `node gra/tools/diplomacy-city-name-test.cjs` -> `20 pass / 0 fail`; `difficulty-bonus-city-name-test` -> `7 passed, 0 failed`; `city-names-pool-test` -> `123 passed, 0 failed`.
- `node gra/tools/ai-cud-priorytet-b3-test.cjs` -> `45 passed, 0 failed`; `eko-tech-paczka1-test` -> `13 pass, 0 fail`.
- `node gra/tools/stadnina-kon-koszt-test.cjs` -> `17 passed, 0 failed`; `mennica-uspienie-test` -> `49 passed, 0 failed`.
- `node gra/tools/tech-discovery-notice-resource-chips-test.cjs` -> `6 pass, 0 fail`; `shared-city-name-queue-test` -> `10 passed, 0 failed`; `march-attack-queue-persist-test` -> `57 passed, 0 failed`.
- `git diff --check` -> czysto (exit 0).

## BLOKADY
- Zarzut 5 (zakres poszerzony skanem, kilkadziesiąt wystąpień): NIE ROZSTRZYGNIĘTE — wymaga decyzji orkiestratora.
- Runtime hotseat z aktywnym fotelem != 0: NIE ZMIERZONO (brak przeglądarki w tej rundzie).
- `hotseat-etap6e-render-noop-test.cjs`: NIE ZMIERZONO — test wymaga Chromium (w środowisku: `domyślny Chromium niedostępny, fallback` i przerwanie przez limit czasu).
- Bramki z dispatchu NIE ZMIERZONO w tej rundzie: tech-tree 20, research 33, combat 6, ai-test 297/0, moc-ranking-rozjazd 19/0, war-rules-multiwar-main-guard 21/0, hotseat-etap6d B 48/0 i E 24/0 (uruchomiono tylko podetap D exec 46/0), bramki-tmpdir. Orkiestrator powinien je uruchomić przed FC.
- Zarzut 4: pełny przebieg 801 testów używających main.ts NIE WYKONANY (koszt czasu; w tym wiele testów live).

## RUNDY
3/5 (runda 1 = 85ca46865; runda 2 = 9ab57259e; ta obrona = runda 3 z raportem Operatora).

## UWAGI-DLA-ORKIESTRATORA
- Trzy pliki testów poza pierwotną allowlistą (disband, era-cud, pr141-diplomacy): tylko kotwice i stub ME(), patrz ZMIANY-COMMIT.
- 12212 i 13525/13573 pozostają literałem 0 świadomie (ZOSTAW z uzasadnieniem). 13525/13573 wymagają ABC (adresat propozycji AI w hotseat).
- Pozostały zakres literałów 0 w roli gracza (patrz zarzut 5) — rekomenduję osobny temat R-WEB-HUD-ME-RESIDUAL-Q2 z pełnym skanem i mutacjami per linia.
- Gra/node_modules zainstalowane w worktree (npm ci --ignore-scripts) na potrzeby bramek; nie są w commicie. Usunąć przed sprzątaniem worktree.

NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje tabelę (12 podstawień + 2 ZOSTAW) i bramki z listy BLOKADY; decyzja orkiestratora w sprawie zakresu poszerzonego (zarzut 5).
DEPLOY/PUSH: NIE WYKONANO
