# Final Control — R-AI-GENERAL-WAR-5TURN-ATTACK-Q1 — runda 5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-AI-GENERAL-WAR-5TURN-ATTACK-Q1
GOAL: Pięć pełnych tur EOT zbiórki bez ataku, następnie w szóstej pełnej turze EOT wspólny rozkaz i rzeczywisty ruch kwalifikującego się składu z fizycznym Generałem do osiągalnego lądem celu; lifecycle i save/load.
ZMIANY/COMMIT: kontrola kandydata w `/tmp/the-game-ai-five-turn-20261028`, baza/HEAD `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`; brak zmian produktu/testów przez Final Control. Werdykt dotyczy tego snapshotu.
TESTY: Final Control: Chromium live **24/24**, focused campaign **31/31**, army-consolidation E2E **6/6**, AI war-era **7/7**, TypeScript 5.9.3 exit 0, pełny Vite build 916 modułów exit 0, `git diff --check` PASS.
BLOKADY: brak zarzutów do naprawy ani decyzji właściciela. Morski transport i morski priorytet pozostają poza GOAL tej rundy.
RUNDY: 5/5.
NASTĘPNY KROK: integracja orkiestratora allowlist-only; po integracji osobna weryfikacja stanu bazowego i kolejnych bramek. Ten raport nie oznacza `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO.

## Tożsamość i ślad

- Dispatch r4 i r5, raporty Operatora r4/r5, Evaluatora r4/r5 oraz ID są w tym samym katalogu i zachowują pełne ID. GOAL r5 jest doprecyzowaniem zarzutu z r4 — test ma przejść przez sześć pełnych produkcyjnych EOT — bez zmiany pierwotnego celu pięciu tur zbiórki i ataku od tury szóstej.
- Evaluator r4: `FAIL` wyłącznie z powodu braku pięciu pełnych EOT przed atakiem. Operator r5 dodał przebieg EOT do live harnessu; Evaluator r5 uruchomił test niezależnie, raportuje `PASS` i brak zarzutów. Nie ma zarzutów wymagających obrony ani werdyktu `NAPRAW`/`DO DECYZJI CZŁOWIEKA`.
- Dyspozycja r5 dopuszcza live test, jego konfigurację i raporty rundy; pozostałe pliki produktu są dopuszczone tylko przy regresji wykazanej pełnym EOT. W porównaniu do snapshotu ocenionego w r4 zmieniły się dwa pliki live harnessu i konfiguracji; wcześniejsze trzy pliki źródłowe kampanii oraz focused test zachowują hashe z r4. Zbiór sześciu śledzonych zmian produktu/testów wobec bazy mieści się w allowliście r4, a delta r5 mieści się w allowliście r5. Brak claimu o morskiej kampanii.
- Rejestr prośb zawiera temat w nadrzędnym `R-CIV-ALL-TOPICS-ROBOCZA-20261027`; ten follow-up zachowuje ślad pod pełnym ID i zamyka wskazaną tam lukę dowodu live. Raport FC odpowiada stanowi tej rundy.
- To temat jednowęzłowy, więc nie ma rankingu najsłabszego węzła.

## Niezależna kontrola wytworu

Odczytałem i sprawdziłem raport Evaluatora r5 przed wydaniem werdyktu. Następnie uruchomiłem bramki na tym samym worktree:

- `node tools/ai-general-war-campaign-live-test.cjs`: **24 PASS / 0 FAIL**, Chromium, 57 s; pełne EOT: muster 1/5 turn 1→2, muster 2/5 2→3, muster 3/5 3→4, muster 4/5 4→5, muster 5/5 5→6 oraz atak 6/6 6→7. Każdy muster EOT zakończył się bez komendy ataku; wszystkie cztery jednostki pozostały zgrupowane. W szóstym EOT cały skład otrzymał ten sam `targetCityId`; executor zaakceptował **4/4** ruchy, a po EOT zmieniły się pozycje **4/4**. Przeglądarka nie zgłosiła page errors.
- `node tools/ai-general-war-campaign-test.cjs`: **31 PASS / 0 FAIL**; obejmuje wybór dalszej stolicy osiągalnej lądem, gdy bliższy cel ma `noPath`, stabilność celu, śmierć i wymianę Generała, anulowanie po pokoju oraz roundtrip save/load.
- `node tools/army-consolidation-e2e-test.cjs`: **6/6**; `node tools/ai-ofensywa-wojna-epoki-test.cjs`: **7/7**.
- `node ./node_modules/typescript/bin/tsc --noEmit --pretty false`: exit 0; wersja projektu **5.9.3**.
- `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-ai-general-war-product-build --emptyOutDir`: exit 0, **916 modułów**, output 69,925.85 kB. Build live harnessu także przeszedł przez Vite 5.4.21.
- `git diff --check 85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`: PASS. Lista zmian wobec bazy: `gra/src/game/ai-general-war-campaign.ts`, `gra/src/game/ai.ts`, `gra/src/main.ts`, oba pliki live harnessu i `gra/tools/ai-general-war-campaign-test.cjs`; wszystkie należą do allowlisty r4.
- SHA-256 `git diff --binary <baza>` przed testami i po wszystkich bramkach: **`4580f5205bf1862efdfd734e1702f46438aca602d9c53d8ecaea8f51838f2fb6`** — bez zmiany snapshotu podczas walidacji.

Hashe kluczowych plików po walidacji:

```text
gra/tools/ai-general-war-campaign-live-test.cjs       627226c31c0e7470770021058b864e515a49ef1c1719daab532e6d993ba1bf1e
gra/tools/ai-general-war-campaign-live.vite.config.ts 1f16591c2b8948ca9dfe932150d62704e1b0d53f1c546c9ad93dc2c8861e0b27
gra/src/game/ai.ts                                    6329b51aa7caa5fae584c28e301bb71d1c0da8965817f6465adde45b7153c220
gra/src/game/ai-general-war-campaign.ts                a136283e3cd758eccba2d3ff89b8c67daa70bc344722b14970aad9abb995ecec
gra/src/main.ts                                       e14df45f263cdb62bc60fb9729f4d40a79c5458fe133c07dcf3ef7e8b8f1250c
gra/tools/ai-general-war-campaign-test.cjs            2eaeb8a02caab3fd6f1c77e19101befe766a7d8f95b31c53e3ae2c69c45663a1
```

## Granice potwierdzenia

Live fixture używa małej mapy `Malenki`, seed `981042`, jednego rywala i syntetycznego land-connected terenu. Trzy jednostki składu są syntetycznym rosterem testowym; fizyczny General przechodzi przez produkcyjny zakup, kolejkę i spawn. Wszystkie cztery ruchy w szóstym EOT są jednak komendami rzeczywistego `decideAITurn`, wykonanymi przez `triggerPlayerEndTurn()` i produkcyjny executor. Śmierć wodza i pokój są sprawdzone w focused testach, a nie przez osobne browserowe cykle EOT; zapis kampanii przetrwał live roundtrip metadanych. Przebieg dowodzi osiągalnego celu lądowego w fixture i focused test sprawdza bliższy cel `noPath` kontra dalszy reachable-by-land. Nie rozszerzam wyniku na transport morski ani priorytet morski.

Werdykt agregatu: Evaluator nie zgłosił zarzutów, niezależne bramki FC przeszły, nie ma `NAPRAW` ani `DO DECYZJI CZŁOWIEKA`; **PASS, gotowość do integracji: TAK**. Ostateczna integracja, ustawienie statusu `READY_FOR_DEPLOY` i publikacja należą do orkiestratora po wykonaniu wymaganych kroków.
