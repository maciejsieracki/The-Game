STATUS: PASS
DOMAIN: GAME
TEMAT: R-AI-PRACA-PODZIAL-STALY-50-50-Q1
GOAL: Sztywny, niedynamiczny `procentBudynki=50` jako stan standardowy dla AI
cywilizacji i miast-panstw (bez wplywu wojny/pokoju/fazy gry), ZASADA 3 zostaje
jako wyjatek na ture nadwyzki, gracz bez zmian.

## Krok 1 — zywa reprodukcja PRZED zmiana kodu
Nowy harness `gra/tools/praca-podzial-staly-50-50-test.cjs` wola PRAWDZIWY
`decideAIEconomySliders` (bundle esbuild, nie reimplementacja) przez 100 tur,
5 ziaren x 3 trudnosci, z oknem wojny 25 tur (`WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR`,
bezposrednie ustawienie `atWar=true`, metoda dopuszczona wprost w dispatchu).
URUCHOMIONY na niezmienionym kodzie: CZERWONY — AI cywilizacja glowna
`maxDuringWar=70`, miasto-panstwo `maxDuringWar=100` (pula spada do 0%). RECON
potwierdzony.

## Zmiany (allowlist)
- `gra/src/game/cities.ts`: nowa stala `AI_FIXED_PROCENT_BUDYNKI=50`.
- `gra/src/game/ai.ts`: `decideAIEconomySliders` — usunieto bloki
  early(40)/mid(50)/wojna(+krok do 100) dla `procentBudynki`; zastapione
  bezwarunkowym `if (procentBudynki !== AI_FIXED_PROCENT_BUDYNKI) { =50 }`
  POZA cooldownem `minOdstepTur` (stala nie oscyluje, nie potrzebuje wygaszania;
  konwerguje natychmiast, w tym w turze 1). `AI_MAJOR_EARLY_PROCENT_BUDYNKI`/
  `_MID_` zostaja wyeksportowane (uzywane gdzie indziej), ale przestaly byc
  celem tego pola.
- `gra/src/main.ts`: import `AI_FIXED_PROCENT_BUDYNKI`; ZASADA 3 (linia
  restauracji ok. 29705-29709) — fallback zmieniony z
  `DEFAULT_PODZIAL_PRACY.procentBudynki` (70, martwy dla AI po tej zmianie) na
  `AI_FIXED_PROCENT_BUDYNKI` (50). Zywo wykryte (nie zalozone): bez tej
  poprawki restauracja po ustaniu nadwyzki w swiezej sesji (aiSliderStateByOwner
  nie jest persistowany) wracalaby do 70, nie do 50 — dokladnie zakazane przez
  regule przeciw samooszukiwaniu. `opts.defensiveCopy` wykluczenie NIE ruszone.
  Krok 4 (seeding): zbadane strukturalnie — pierwszy przebieg suwaka (gate
  zawsze otwarty gdy `lastSliderChangeTurn===null`) nadpisuje 70→50 zanim
  jakakolwiek ekonomia AI jest mierzona (ten sam mechanizm, ktory prior temat
  R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 juz udokumentowal jako "efektywny baseline
  zawsze 50 niezaleznie od ery") — brak realnej potrzeby zmiany seedowania.
- `gra/tools/`: nowy plik `praca-podzial-staly-50-50-test.cjs` (bramka
  tematu, kryteria 1/2/5). Zaktualizowano `ai5-zasada3-harness.cjs` i
  `ev5-z3-fc2-kontrola.cjs` — dodano wstrzykniecie `AI_FIXED_PROCENT_BUDYNKI`
  do `new Function(...)` (bez tego: ReferenceError polykany przez try/catch
  ZASADY 3, przekierowanie po cichu nigdy sie nie cofa — dokladnie wzorzec
  opisany w istniejacym komentarzu o `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA`).
  `ai5-z3-fc2-probe.cjs` — zaktualizowano nota tresciowa (§13a), byla
  factually nieaktualna po fixie. `ai-major-economy-test.cjs` — 2 asercje
  (A, B) pinowaly stara dynamiczna wartosc 40; zmienione na 50 z uzasadnieniem
  w kodzie (kryterium 6).

## Krok 2 — zywa weryfikacja ZASADY 3 po zmianie
`ai4-popyt-obywatele-test.cjs::Z3l` (real main.ts blok przez harness): PRZED
mojej poprawki fallbacku: `procentBudynki 90->70` (STARA wartosc, zle).
PO poprawce fallbacku: `procentBudynki 90->50, pula imperium 50%` (PRAWIDLOWE
- Z3l/Z3m/`ev5-z3-fc2-kontrola`/`ai4-mutacje` wszystkie zielone, w tym mutacja
FC-2 (miasta-panstwa nadal wykluczone z ZASADY 3, `opts.defensiveCopy`
niezmieniony).

## Kryterium 5 — porownanie przed/po (ta sama symulacja)
PRZED (niezmieniony main): AI major maxDuringWar=70 (pool spada do 30%);
miasto-panstwo maxDuringWar=100 (pool 0%).
PO (po fixie): oba 50/50 kazda z 600 pomiarow tur (5 ziaren x 3 trudnosci x
100 tur dla major; 5 ziaren x 100 tur dla miasta-panstwa) — `minPoolDuringWar>=50`
w obu.

## TESTY
`npx tsc --noEmit`: 0 bledow. 5 bramek referencyjnych (§Bramki):
logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
unit-replace-test 13/13, combat-test 6/6 — wszystkie PASS.
Wszystkie testy z kryterium 6: `ai5-zasada3-harness` (uzywany, nie
uruchamiany bezposrednio), `ai5-z3-fc2-probe` PASS, `ev5-z3-fc2-kontrola`
PASS, `ai4-popyt-obywatele-test` 50/50, `ai4-mutacje` 18 dowodow/0
podejrzanych, `ai-ulepszenia-malo-budowane-test` 13/13,
`ai-praca-split-parity-test` 21/22 (1 FAIL PRE-ISTNIEJACY, zweryfikowany
`git stash` na niezmienionym kodzie — identyczny fail, temat
R-PRACA-JEDEN-PODZIAL-Q1, poza allowlista, NIE regresja tego runu),
`praca-limit-50-test` 34/34, `praca-miasto-limit-50-test` 33/33,
`praca-miasto-limit-50-cap-test` 50/50, `city-state-prod-audit-test` 17/17,
`praca-global-default-live-test` 7/7, `ai-major-economy-test` 33/33 (po
aktualizacji 2 asercji). Nowy `praca-podzial-staly-50-50-test` 6/6.
Kryterium 3 (gracz): `praca-jeden-podzial-kontrakt-test` 637/637 (kontrakt
UI/panele niezmieniony), `praca-panel-budowy-warstwa-real-render-test`
(Playwright, real Chromium) 28/28 — zero regresu gracza.

## BLOKADY
Brak w zakresie allowlisty. Poza zakresem: 1 pre-istniejacy FAIL w
`ai-praca-split-parity-test.cjs` (temat R-PRACA-JEDEN-PODZIAL-Q1, stary
straznik tekstowy `procentPuliImperiumForOwner(0)`), potwierdzony identyczny
na niezmienionym kodzie — zgloszony, nie naprawiony (poza allowlista tego
tematu).

## RUNDY: 1/5
## NASTEPNY KROK: Evaluator
## DEPLOY/PUSH: NIE WYKONANO
