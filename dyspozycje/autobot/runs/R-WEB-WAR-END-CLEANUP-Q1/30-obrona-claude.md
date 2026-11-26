# R-WEB-WAR-END-CLEANUP-Q1 — obrona Operatora (runda 2/5, HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (porządek kodu + test L6; zero zmian balansu i zachowania gry)
TEMAT: R-WEB-WAR-END-CLEANUP-Q1 (WARENDCLEAN, #127)
GOAL: (L6) warWearinessByPairKey czyszczony dla par wyeliminowanego właściciela — WYKONANE w kandydacie 510c9fea3, w tej rundzie wzmocniony test. (L2) martwe stałe i nieaktualne komentarze wojen epoki — NIE ZAMKNIĘTE: w allowliście nie ma żadnego martwego symbolu ani nieaktualnego komentarza; nieaktualne komentarze leżą w plikach spoza allowlisty (patrz odpowiedź na zarzut 1).
BAZA: 510c9fea3ae2c9255b9db4483dd45763c47daad3 (kandydat, detach); commit obrony nad nim.
ZMIANY/COMMIT: gra/tools/war-weariness-elimination-test.cjs (jedyna zmiana kodu tej rundy) + ten raport. Nie zmieniano gra/src, allowlisty ani wartości.

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 — L2 niewykonane, brak listy usuniętych symboli — PRZYJMUJĘ (stan faktyczny), bez zmiany kodu

Dowód przeszukania (grep w gra/src i gra/tools, stan 510c9fea3):
- `WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR` (forced-war-bronze.ts:100), `WOJNA_ZELAZO_WYMUSZONA_MAX_CZAS_TRWANIA_TUR` (forced-war-iron.ts:93), `WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR` (forced-war-stone.ts:32): NIE usunięte. Są przypięte testami (forced-war-bronze-test.cjs, forced-war-stone-test.cjs, forced-war-iron-test.cjs, forced-war-reguly-multi-turn-simulation-test.cjs, praca-podzial-staly-50-50-test.cjs; ostatni używa stałej jako WAR_END). Usunięcie oznaczałoby osłabienie asercji, czego dispatch zakazuje.
- `isForcedPeaceEligiblePair` (diplomacy-ai-forced-peace.ts:119) i `aiAiForcedPeacePairEligible` (main.ts:40782): żywe, bez wyłączeń epoki; wszystkie pola `ForcedPeacePairInput` używane.
- `maybeResolveRegularWarOnCityCapture` (main.ts:41146): żywa, komentarz z 2026-11-25 („wojny epoki kończą się tak samo jak klasyczne”) jest aktualny.
- `WAR_ERA_STONE` / `WAR_ERA_BRONZE` / `concurrentWarLimitForEra` (war-rules-multiwar.ts): używane w evaluateInterCivWarGate.
- Brak wystąpień `WAR_END_EXCLUDE` i `pominięte P12/P20` w allowliście.

Lista usuniętych symboli w tej rundzie: BRAK (żaden symbol nie był martwy w allowliście).

Nieaktualne komentarze poza allowlistą (NIE edytowano, bo złamałoby to allowlistę):
- gra/src/game/forced-war-iron.ts:34-38: fragment „Sztywny próg tury byłby tu bez sensu … [NIEAKTUALNE od 2026-09-03 …]”. Autor sam oznaczył go jako ślad historii decyzji, nie opis zachowania.
- gra/src/game/forced-war-bronze.ts:19: „2 miasta = koniec wojny” (wg raportu Operatora 10-operator-claude.md; w tej rundzie nie zweryfikowano linii ponownie).

Wniosek dla orkiestratora: L2 zamknie się wyłącznie przez (a) dopisanie `gra/src/game/forced-war-bronze.ts` i `gra/src/game/forced-war-iron.ts` do allowlisty, wyłącznie na komentarze (bez zmiany kodu i stałych), albo (b) zamknięcie L2 jako „zamierzone” z uzasadnieniem, że stałe są parametrem testów (R9). Decyzja należy do orkiestratora; ta runda jej nie podejmuje.

### Zarzut 2 — test L6 używa własnej kopii keyHasOwner — PRZYJMUJĘ i NAPRAWIONO

Zmiana w gra/tools/war-weariness-elimination-test.cjs: zamiast lokalnej kopii logika klucza jest wycinana wprost z ciała `diploPairKeyHasOwner` w gra/src/main.ts (regex na definicję, `new Function('key','ownerId', body)`). Test sprawdza najpierw, że ciało zostało znalezione (asercja „znaleziono ciało diploPairKeyHasOwner w main.ts”), a następnie dla pięciu par z właścicielem 5 wykonuje tę samą funkcję, którą wywołuje eliminateOwner. Rozjazd kopii z main.ts nie jest już możliwy bez zauważenia.

Ograniczenie, które zostaje: okablowanie w eliminateOwner nadal sprawdzane jest regexem (asercja 1). Jest to świadome — eliminateOwner jest domknięciem wewnątrz boot() i nie da się go wywołać z testu bez uruchomienia gry.

### Zarzut 3 — duchy w starych zapisach nie są czyszczone przy wczytaniu — PRZYJMUJĘ jako notę, BEZ zmiany

Dispatch wymaga zmiany „tylko wycieków/duchów przy eliminacji” (GOAL, pkt 2) i zakazuje zmiany zachowania poza tym. Czyszczenie przy wczytaniu zapisu (main.ts ok. 52583) to inna ścieżka i wymaga osobnej decyzji. Nie wprowadzano. Do rozważenia przez orkiestratora jako osobny temat, jeśli zapisy sprzed poprawki mają być sprzątane.

## Zmiana w tej rundzie

- gra/tools/war-weariness-elimination-test.cjs: lokalna kopia keyHasOwner zastąpiona funkcją wyciętą z main.ts (patrz zarzut 2); dodana asercja obecności ciała helpera; test liczy teraz 11 asercji.
- Nic innego nie zmieniono.

## TESTY (liczby z surowego wyjścia)

- `node tools/war-weariness-elimination-test.cjs` (stan po obronie) → `Wynik: 11 ok / 0 FAIL`, exit 0.
- Mutacja czerwona (kopia gra/src w gra/.mutsrc/src, z zakomentowanym wywołaniem `pruneWarWearinessPairs(warWearinessByPairKey…)` w main.ts; uruchomienie z AI_SRC_DIR) → `FAIL eliminateOwner wywołuje pruneWarWearinessPairs(...)`, `Wynik: 10 ok / 1 FAIL`, exit 1. Kopia usunięta po teście.
- `git diff --check` → czysto.
- Pozostałe bramki z poprzedniej rundy (tsc, logic 213, tech-tree 20, research 33, unit-replace, combat, ai-test 297/0, war-rules-multiwar-main-guard 21/0, era-war-end-like-classic 17/0, war-end-reason-log 41/0, forced-war-iron 54/0, era-war-bronze-player-target 45/0, diplo-forced-peace-pending 40/0, war-limit-truce-count 19/0) nie były ponownie uruchamiane w tej rundzie: zmiana dotyczy wyłącznie pliku testu .cjs, który nie wchodzi do bundla gry. Wynik poprzedniej rundy pozostaje dla kandydata 510c9fea3 (liczby z raportu 10-operator-claude.md, nie zweryfikowane ponownie tutaj).
- Nie uruchamiano `npm run build`/`dev` (zakaz).
- Instalacja zależności: `npm ci --ignore-scripts` w gra/ tego worktree (node_modules ignorowane przez git).

## BLOKADY

- L2 nie zamknięte w zakresie allowlisty — wymaga decyzji orkiestratora (zobacz zarzut 1).

## RUNDY

2/5 — poprzedni werdykt: Evaluator FAIL (L2 niewykonane; uwagi 2 i 3). Po tej rundzie: zarzut 2 naprawiony, zarzut 3 notowany, zarzut 1 przyjęty jako stan faktyczny bez zmiany allowlisty. Decyzja wymagana: TAK — zakres L2 (allowlista forced-war-bronze.ts / forced-war-iron.ts na same komentarze, albo zamknięcie L2 jako zamierzone).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wskazuje L2 w main.ts i war-rules-multiwar.ts, a analiza WOJNA-SCIEZKI-KONCA-2026-11-25.md lokalizuje nieaktualne komentarze w forced-war-*.ts. Rozbieżność dokumentu z allowlistą — prośba o decyzję.
- Ścieżka wczytania zapisu (main.ts ok. 52583) nie czyści warWearinessByPairKey — osobny temat, jeśli potrzebny.

## NASTĘPNY KROK

Evaluator: ponowny przegląd diffu (gra/tools/war-weariness-elimination-test.cjs), mutacja czerwona już wykonana (exit 1). Orkiestrator: decyzja o zakresie L2 (pkt 1 wyżej).

DEPLOY/PUSH: NIE WYKONANO
