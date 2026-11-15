# R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-REPRO-Q1 — obrona (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (pomiar; kod gry NIETKNIĘTY — zmiany tylko w `gra/tools/`)
TEMAT: R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-REPRO-Q1
GOAL: (1) reprodukcja na poziomie sceny: ta sama armia w trybach AUTO / marsz do pola X / atak na cel, ≥3 ziarna;
(2) tabela tryb | heksy/rundę | ciosy/rundę | ruch niewykorzystany; (3) klasyfikacja względem decyzji A.
BAZA: `origin/main` = `affc50fa4` (worktree wystartowany z tej bazy; `0218ac0d9` jest jej przodkiem — sprawdzone `git merge-base --is-ancestor`). Zmiany nie dotykają `gra/src`.
KOMMIT KODU: `acc92b89e` (tylko `gra/tools/battle-manual-orders-full-move-repro-{browser-entry.ts,browser-entry.html,measure.cjs}`).
KOMMIT RAPORTU: patrz pole SHA w odpowiedzi strukturalnej (raport + `evidence-summary.json` w tym samym katalogu runu).

## Odpowiedź na zarzuty Evaluatora (20-evaluator-claude.md, e74b0f839)

| # | Zarzut | Werdykt | Dowód |
|---|---|---|---|
| 1 | Brak artefaktu tematu (`battle-manual-orders-full-move-repro-*`) | PRZYJMUJĘ — poprawka | Artefakt powstał: `acc92b89e` (3 pliki w `gra/tools/`). Wcześniej nie istniał. |
| 2 | Brak raportu Operatora | PRZYJMUJĘ | Ten plik (`30-obrona-claude.md`) + `evidence-summary.json`. Nazwa `10-operator` nie została użyta, bo dispatch dla obrony wskazuje `30-obrona-claude.md`. |
| 3 | Brak pomiaru z GOAL (1) | PRZYJMUJĘ — zmierzone | 9 przebiegów (3 tryby × 3 ziarna 1/2/3), `evidence-summary.json`, surowe wyjścia w logu driver-a. Każdy przebieg: `capped=true`, 9 rund, 60 jednostko-rund atakującego. |
| 4 | Brak tabeli i klasyfikacji | PRZYJMUJĘ — zrobione | Tabela i klasyfikacja poniżej. Klasyfikacja częściowo NIE_ROZSTRZYGNIĘTE (pytanie do właściciela). |
| 5 | Brak dowodu mutacyjnego / brak testu do zmutowania | ODRZUCAM w części mutacyjnej | Temat jest pomiarowy i wprost zabrania zmian kodu gry (dispatch: „NIE poprawiaj kodu”); dowód mutacyjny nie ma tu przedmiotu. Sonda jest sama w sobie testem dyskryminującym: wykrywa różnicę AUTO vs ręczny (heksy/rundę w ruchu 1,58 vs 1,00; ciosy po ruchu 5 vs 0 na 60 jednostko-rund). |
| 6 | Błędny SHA kandydata (`0218ac0d9` = deploy FALA 751) | PRZYJMUJĘ jako fakt | Potwierdzone: `0218ac0d9` zmienia tylko `dyspozycje/WERSJE.md` i `gra-robocza/*`. Praca tematu to `acc92b89e`, bazowana na `affc50fa4`. |

## Co zrobiono (kod, tylko `gra/tools/`)

- `battle-manual-orders-full-move-repro-browser-entry.ts` — sonda sceny (Chromium, prawdziwy `BattleScene`). Owija tylko metody: `_doMove`, `_doMeleeAttack`, `_doRangedAttack` (liczenie kroków i ciosów), `_beginTurn` (rozkazy i snapshot rundy), `_activateUnit` (moveLeft w chwili końca aktywacji; dodatkowo — patrz „Uwagi”).
- `battle-manual-orders-full-move-repro-measure.cjs` — driver: vite + playwright, tryby `auto|move|attack`, ziarna `RM_SEEDS`, cap rund `RM_CAP` (domyślnie 8), wyjście JSON.
- Brak zmian w `gra/src/`, brak zmian w `WERSJE.md`, manifestach, `gra-robocza/`, `rust-port/`. Brak `npm run build/dev`. Brak `git add -A`.

## Warunki pomiaru (jawnie)

- Scena: `Rownina`, atakujący `Hastati:6` (gracz, strona atk), obrońcy `Hastati:6` (AI, strona def), HP 1×, bez wzmocnień.
- Jednostka: **Hastati, MP = 3** (dispatch wspominał „np. Wojownik, ruch 4” — ZAŁOŻENIE: Wojownik nie jest w presetach sondy `maly`, a Hastati jest tą samą klasą piechoty z zestawu pursuit-pace; zmierzony MP = 3).
- Tryby: `auto` = `skip()` (silnik steruje obiema stronami, jak w `battle-pursuit-pace-browser-entry.ts`); `move` = rozkaz `move` do kolumny `q + 6·kierunek` w tym samym rzędzie, nadany raz; `attack` = rozkaz `attack` na najbliższego żywego wroga (ponownie przy zniknięciu celu).
- Okno pomiaru: 9 rund (cap 8 + 1). Wszystkie przebiegi `capped=true`, żaden `timedOut`, `errors=[]`.
- Parametry czysto techniczne (NIE zmieniają logiki walki/ruchu): zegar wirtualny `speedMul=32` (bez tego headless daje ~2,7 s wirtualnej bitwy na 15 s), viewport 480×360, `setPixelRatio 0.1`.

## Tabela (średnia z 3 ziaren; zakres w nawiasach; 6 jednostek × 9 rund = 60 jednostko-rund na przebieg)

| tryb | heksy/rundę (wszystkie rundy) | heksy/rundę (tylko rundy z ruchem) | ciosy/rundę | ruch niewykorzystany (MP przy końcu aktywacji, jednostki, które się ruszyły) | przesunięcie q na jednostkę w 9 rundach |
|---|---|---|---|---|---|
| AUTO | 0,56 (0,47–0,62) | 1,58 (1,48–1,75) | 0,62 (0,57–0,72) | NIE_ZMIERZONO (brak zapisów końca aktywacji w AUTO) | 5,94 |
| RĘCZNY — marsz do pola X | 0,25 (0,22–0,27) | 1,00 (1,00–1,00) | 0,65 (0,63–0,68) | 2,09 (1,80–2,33) z MP 3 | 2,45 |
| RĘCZNY — atak na cel | 0,12 (0,10–0,13) | 1,00 (1,00–1,00) | 0,78 (0,77–0,80) | 2,75 (2,50, 3,00; ziarno 2 bez ruchu = brak próbki) | 1,17 |

Dodatkowo: w trybie AUTO **5 z 60** jednostko-rund łączy krok i cios w tej samej rundzie (ruch → cios → ruch dalej po zderzeniu, zgodnie z regułą FULL-MOVE); w trybach ręcznych **0 z 60** (w każdym ziarnie).

## Ustalenia mechaniki (z kodu i pomiaru)

1. Hipoteza operatora potwierdzona: w rozkazie `move` `_performPlayerOrder` wykonuje **jeden** `_doMove` na aktywację, po czym `done()`. Pomiar: 1,00 heks na każdą jednostkę ruszającą się w każdej rundzie, 3/3 ziarna.
2. Gdy jednostka ma wroga sąsiadującego, gałąź `move` (i `attack`) wykonuje `_doAttack` i kończy aktywację — **nie idzie dalej**. Stąd w ręcznym marszu ciosy powtarzają się co rundę przy tym samym hexie (33 → 33, 1 cios na rundę, 3 ziarna).
3. Ruch niewykorzystany: przy MP 3 i jednym kroku (koszt 1) zostaje ~2 MP, które przepadają (pomiar 2,09 średnio).
4. Obrońca w `_activateUnit` (produkcja, `battleScene.ts` ~6276): galąź doktryny AI jest pominięta, gdy `_manualMode=true` — **dla obu stron**. Zmierzone w sondzie bez obejścia: tura zatrzymuje się na `turIdx 7/12`, `busy=true`, zero timerów (nadal po 15 s). Sonda omija to przełączając flagę `_manualMode` na czas synchronicznego wejścia do `_activateUnit` dla strony `def` (tylko w sondzie). Czy tak samo dzieje się w **grze live** — NIE_ZMIERZONO (nie badano w przeglądarce z UI).

## Klasyfikacja (GOAL 3)

- **Część 1 — marsz ręczny = jeden krok na aktywację: ZGODNE z decyzją A** (2026-11-15: rozkaz ręczny = pierwszeństwo przed regułą pełnego ruchu). Pomiar: 1,00 heks/aktywację, 3/3 ziarna.
- **Część 2 — przepadek ~2 MP po kroku oraz brak kontynuacji ruchu po ciosie w rozkazie ręcznym: NIE_ROZSTRZYGNIĘTE → pytanie ABC do właściciela.** Decyzja A mówi „jeden krok/aktywację z założenia”, ale nie mówi wprost, czy reszta MP ma przepadać i czy cios ma kończyć aktywację. Nie rozstrzygam.

### Pytanie ABC do właściciela (dla części 2)

- **A (obecne zachowanie):** rozkaz ręczny = jeden krok lub jeden cios na aktywację; reszta MP przepada; po kontakcie cios kończy aktywację. Zgodne z pomiarem.
- **B (pełny ruch jak AUTO):** rozkaz ręczny `move`/`attack` wykorzystuje cały MP; przy dojściu do wroga cios, potem ruch dalej (reguła FULL-MOVE dla rozkazów ręcznych). Zmiana w `_performPlayerOrder` (wiele `_doMove` w aktywacji).
- **C (pełny ruch w marszu, cios na końcu ruchu):** marsz (bez kontaktu) zużywa cały MP do kroków; przy kontakcie cios na końcu ruchu — spójne z regułą „cios na końcu ruchu” z decyzji 2026-11-15 (#407), a rozkaz ręczny nadal ma pierwszeństwo przed doktryną.
- **Rekomendacja orkiestratora (nie decyduję):** **C** — najmniejsza zmiana, która usuwa przepadek ~2 MP podczas marszu i powtarzanie ciosu bez ruchu, a jednocześnie zachowuje decyzję A o pierwszeństwie rozkazu ręcznego.

## Ograniczenia i NIE_ZMIERZONO (jawnie)

- **Jedna scena** (6 Hastati vs 6 Hastati, Rownina). Armia mieszana (Hastati 8 + Łucznik 6 + Konnica 4 vs Hastati 14) NIE zmierzona — usunięta z matrycy przy budżecie czasu (~280 s na przebieg).
- **Brak powtórzenia tego samego ziarna** — determinizm przebiegu sondy NIE sprawdzony.
- **Brak pomiaru w grze live z UI** (dispatch dopuszcza headless scene-level; nie badano klikania).
- **AUTO: ruch niewykorzystany NIE zmierzony** (brak zapisów końca aktywacji w ścieżce FF).
- **Parametry techniczne sondy** (`speedMul 32`, viewport 480×360, obejście doktryny obrońcy) mogą wpływać na timing; logiki ruchu/walki nie zmieniają, ale nie porównano z przebiegiem bez nich poza pierwszymi rundami.
- **Wojownik (ruch 4) nie został zmierzony** — zastąpiony Hastati (MP 3).

## UWAGI-DLA-ORKIESTRATORA

- **Możliwy defekt produkcyjny (NIE_ZMIERZONO w grze live):** w `battleScene.ts` ~6276 galąź doktryny AI w `_activateUnit` jest pominięta przy `_manualMode=true` dla **wszystkich** stron. W sondzie bez obejścia obrońcy nie wykonują aktywacji i tura się nie domyka (zmierzone headless). Jeśli w grze live tryb ręczny z AI-przeciwnikiem działa, wyjaśnia to inna ścieżka (np. tryb wykonywany przez inny dispatcher) — tego nie sprawdzałem. Warto zweryfikować osobnym tematem na żywo, zanim ktokolwiek poprawi „ruch ręczny”.
- Ten pomiar nie zmienia kodu gry. Nie integrowałem, nie pushowałem, nie deployowałem.
- Obejście obrońcy i `speedMul` są tylko w sondzie `gra/tools/battle-manual-orders-full-move-repro-browser-entry.ts`.

## Gates (po `npm ci` w `gra/`, na HEAD `acc92b89e`)

- `node tools/logic-test.cjs` → exit 0, `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → exit 0, `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`
- `node tools/unit-replace-test.cjs` → exit 0, `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → exit 0, `COMBAT TEST: 6/6 pass`
- `npx tsc --noEmit` → exit 0
- `git diff --check` (staged, przed commitem kodu) → czysto

## Zrzuty / dowody

- Surowe JSON (rows, ends, attackLog) zostały w `/tmp/claude-0/.../scratchpad` i NIE są w repo. W repo: `evidence-summary.json` (summary + wynik + liczba rozkazów, per przebieg).
- Brak PNG — dowody zrzutów nie są wymagane przy pomiarze bez UI.

## NASTĘPNY KROK

Orkiestrator: (1) pytanie ABC do właściciela (część 2 — opcje A/B/C z rekomendacją C); (2) rozważyć osobny temat weryfikacji live: czy tryb ręczny z AI-przeciwnikiem się domyka (wpływ `_manualMode` na doktrynę obrońcy).

DEPLOY/PUSH: NIE WYKONANO
