# R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1
GOAL: nowa gra startuje z podziałem Pracy Ulepszenia (pula) 50% / Budynki 50%; logika puli i budynków bez zmian; stare zapisy nie są migrowane.
BAZA: edaba111f3680868af2135e36dc3f1d6423e4068 (origin/main), checkout --detach w worktree `wf_13fd11a4-4b1-1`.

## Miejsce jednej prawdy
- Źródło: `gra/data/econ-params.json` → `ekonomia_miasta.suwak_praca_budynki_domyslnie` (easy/normal/hard).
- Przepływ: `buildEconParams` (`gra/src/game/turn-economy.ts`, `gra/src/game/economy.ts`) → `DEFAULT_PODZIAL_PRACY` (`gra/src/game/cities.ts`) → `freshOwnerDefaultPodzialPracy()` (`gra/src/game/empire-city-defaults.ts`) → seed ownera gracza w `gra/src/main.ts` (linia ~6322, ~6354, ~6431).
- AI nie zmienione: `AI_FIXED_PROCENT_BUDYNKI = 50` (`cities.ts`) już wcześniej dawało 50/50 AI; AI nie korzysta z wartości gracza.
- `suwak_praca_teren_domyslnie` (30) NIE zmienione (patrz UWAGI).

## Wartość PRZED → PO
- PRZED: budynki 70 / pula 30 (`suwak_praca_budynki_domyslnie` = 70, `DEFAULT_PODZIAL_PRACY` = 70). Potwierdzone mutacją: po ustawieniu 70 nowy test daje FAIL na 4 asercjach.
- PO: budynki 50 / pula 50 (wszystkie trzy poziomy trudności, `DEFAULT_PODZIAL_PRACY`, fallbacki w `economy.ts`/`turn-economy.ts`/`cityPanel.ts`).

## ZMIANY-COMMIT
Commit: patrz pole `sha` w StructuredOutput (commit z kodem + raportem). Allowlista:
- `gra/data/econ-params.json` — wartość domyślna 70 → 50 (3 poziomy).
- `gra/src/game/cities.ts` — `DEFAULT_PODZIAL_PRACY.procentBudynki` 70 → 50 (+ komentarz).
- `gra/src/game/economy.ts`, `gra/src/game/turn-economy.ts` — fallback `suwak_praca_budynki_domyslnie` 70 → 50 (tylko gdy klucz brakuje).
- `gra/src/ui/cityPanel.ts` — lustro `DEFAULT_PODZIAL_PRACY` (ostateczny fallback UI, bez danych) 70 → 50. Poza ścisłą allowlistą (`game/*`), ale to ta sama wartość domyślna, nie logika.
- `gra/src/data/wikiBundle.json` — regeneracja WYŁĄCZNIE `node tools/bundle-wiki-for-game.cjs` (zmiana 1 linii, diff zgodny z edycją encyklopedii).
- `docs/encyklopedia/pojecia/suwak-pracy.md` — „domyślnie 50% budynki · 50% teren" (+ zdanie o dolnej granicy 50%).
- Testy zaktualizowane (wypisane, każdy):
  - `gra/tools/praca-jeden-podzial-kontrakt-test.cjs` — asercja „domyślny podział = 70" → 50; „10 Pracy domyślnie → 3 pula / 7 budynki" → 5 / 5 (przeliczone przez `splitPraca`). Wynik: 634 OK, 0 FAIL (było 631 OK, 3 FAIL).
  - `gra/tools/ai-praca-podzial-tura1-seed-test.cjs` — fixture „DEFAULT=70" i „fresh=70" → 50; scenariusz REGRES używa jawnego legacy seeda `{procentBudynki: 70}` (nie defaultu gracza). Wynik: 9 PASS, 0 FAIL (było 4 FAIL).
  - `gra/tools/hotseat-ustawienia-kopiowane-test.cjs` — fotel 1 ustawiany na 60 (zamiast 50, które stało się domyślne, więc test „niedomyślne" byłby pusty); fotel 2 oczekiwany = 50 (było 70); „seat1Still" = 60. Patrz BLOKADY — test nie dochodzi do tych asercji.
- NOWY `gra/tools/default-labor-split-test.cjs` — 16 asercji: JSON (easy/normal/hard = 50), `buildEconParams` (3 poziomy), `DEFAULT_PODZIAL_PRACY`, `freshOwnerDefaultPodzialPracy`, `clampPodzialPracyBudynkiPercent(undefined)`, nowe miasto bez override dziedziczy 50, sanity resolvera (globalna 60, override 80), stary zapis zachowuje swoją wartość (savedDefaults 70 → 70; override 60 → 60; stary format bez defaultów → 70).

## TESTY
Uruchomione z `gra/` (surowe wyjścia w scratchpadzie `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/`):
- `npx tsc --noEmit` → exit 0 (0 błędów).
- Bramki referencyjne (R-PROC-AUTOBOT §6):
  - `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
  - `node tools/tech-tree-test.cjs` → `20 pass, 0 fail`
  - `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
  - `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
  - `node tools/combat-test.cjs` → exit 0, `All sanity checks passed.`
  - `node tools/unit-power-test.cjs` → `6 pass, 0 fail`, exit 0
- Testy Pracy/podziału:
  - `empire-city-defaults-test.cjs` → exit 0 (bez zmian w kodzie testu; fixture-y z literałem 70 są wejściem, nie defaultem)
  - `praca-global-default-live-test.cjs` → `7 passed, 0 failed`
  - `praca-podzial-staly-50-50-test.cjs`, `praca-limit-50-test.cjs`, `praca-miasto-limit-50-test.cjs`, `praca-cap-migracja-luka-test.cjs` → exit 0
  - `default-labor-split-test.cjs` (nowy) → `16 pass, 0 fail`
  - MUTACJA (dowód czerwieni): `DEFAULT_PODZIAL_PRACY` = 70 → `12 pass, 4 fail` (FAIL: DEFAULT=50, fresh=50, clamp(undefined)=50, nowe miasto=50). Przywrócone do 50.
- Realna przeglądarka (Chromium headless, build `vite build --outDir <scratchpad>/dist`, bez `npm run build`):
  - menu, przed startem: `snapshotOwnerSettingsForTest(0).work` = `{"procentBudynki":50}`
  - nowa gra po starcie (`verify-default.cjs`): `snapshotOwnerSettingsForTest(0).work` = `{"procentBudynki":50}`; zrzut `…/scratchpad/new-game-after-start.png`
  - Uwaga: panel „Podział pracy" w grze nie został zrzucony i odczytany wzrokowo (NIE_ZMIERZONO w UI). Dowód wartości = odczyt runtime'owego stanu + zrzut ekranu po starcie.
- `hotseat-ustawienia-kopiowane-test.cjs` → exit 1: `locator.click` timeout czekając na `.civ-newgame .start` — test nie dochodzi do asercji o domyślnych wartościach. NIE_ZMIERZONO na bazie (nie uruchomiono base osobno); awaria wystąpiła w nawigacji kreatora, przed odczytem jakiejkolwiek wartości podziału.
- `git diff --check` → czysty.

## BLOKADY
- Brak blokad merytorycznych.
- Test hotseat (powyżej) nie przechodzi z powodu nawigacji kreatora; zmiany w nim są logiczne, ale nie zweryfikowane end-to-end.

## RUNDY
1/5. Wynik: PASS-WITH-NOTES (brak FAIL, brak BLOCK).

## UWAGI-DLA-ORKIESTRATORA
1. `suwak_praca_teren_domyslnie` = 30 (`econ-params.json`, `economy.ts:264`, `turn-economy.ts:344`) jest teraz niespójne z podziałem 50/50 (pula = 100 − budynki = 50, a pole „teren" nadal 30). Pole nie jest czytane w logice gry (grep: tylko przypisania). Nie zmieniałem — decyzja właściciela/Final Control.
2. Pozostają wzmianki „suwak pracy 70% budynki" jako zalecenie (nie jako default): `docs/encyklopedia/budynki/biblioteka.md:33`, `docs/encyklopedia/budynki/akademia.md:41`. Nie zmieniałem (to rady taktyczne); do decyzji.
3. Komentarze z liczbą 70 zostały w `gra/src/main.ts` (~6344, ~6354 — opis seedowania AI) i w `gra/tools/praca-global-default-live-test.cjs` (nagłówek) — tylko komentarze, nie ruszane (main.ts poza zakresem).
4. Porządki środowiskowe: (a) `gra/node_modules` zainstalowane przez `npm ci` w worktree (do usunięcia przy sprzątaniu); (b) katalog scratchpad z buildem `dist/` i skryptami weryfikacyjnymi; (c) przez pomyłkę w jednym poleceniu shell zapisał się plik `/a.out` w katalogu głównym systemu (przekierowanie do pustej zmiennej). Usunięcie zablokowało zabezpieczenie „rm" — Operator NIE usunął go; orkiestrator/właściciel powinien sprawdzić i usunąć `/a.out` ręcznie.
5. Dług Rust: nie znaleziono kopii wartości domyślnej w `rust-port/` (grep bez trafień) — NIE_ZMIERZONO na pełnym drzewie Rust; REPIN nie wymagany według tego grepa.
6. Wiki bundle zregenerowany narzędziem; nie edytowany ręcznie.
7. Nie wykonano: deploy, push na main, WERSJE.md, integracja (zgodnie z dispatchem).

NASTĘPNY KROK: Evaluator (SONNET) → Obrona (HAIKU) → Final Control (SONNET) na commicie z polem `sha`.
DEPLOY/PUSH: NIE WYKONANO
