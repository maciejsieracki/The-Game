STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1
GOAL: Krok 0+1 z planu implementacji (recon `R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1`
§6.1): wydzielić `runWorldEndTurn()` jako literalny copy-paste faz 7-14
`triggerPlayerEndTurn()` (bez zmiany semantyki), wołaną z tego samego miejsca co
dziś, oraz przenieść na jej początek trzy bloki "światowe" osadzone tekstowo w
bloku "gracza" (czyszczenie `st.bunt`, `evictForeignUnitsFromCityHexes()`, reset
ruchu wszystkich jednostek) — no-op behawioralny przy jednym fotelu, dowiedziony
przez bramkę hash-per-tura.

## Weryfikacja linii przed edycją (fresh grep, main.ts zmienił się od recon)

Recon (2026-09-07): `function triggerPlayerEndTurn` @ 28497, `turn++` @ 28647,
koniec funkcji @ 32966. Świeży grep (ta runda): deklaracja @ **28643** (+146),
`turn++` @ **28793** (+146, jedyne wystąpienie w pliku), koniec `try` przed
`catch` @ **33118** (`await yieldTurnTransitionUi();`), `} catch` @ **33119**,
`finally` @ **33121**, zamknięcie funkcji @ **33153** (długość 4510 linii —
main.ts urósł ~41 linii od recon poza samą funkcją, przesunięcie jednolite +146
w całym zakresie, potwierdzone re-odczytem treści na każdej granicy przed
edycją, nie samym numerem).

## Zmiany (allowlista: `gra/src/main.ts` wyłącznie)

1. Nowa funkcja `async function runWorldEndTurn(): Promise<void>` (main.ts:28643,
   sibling `triggerPlayerEndTurn` w tym samym domknięciu — dostęp do `turn`/`units`/
   `cities`/`cityOrderState` zachowany). Ciało: lokalne `const nextTurnNum = turn + 1;`
   (opcja (b) z recon — Zarzut 4 rundy 2 recon: `nextTurnNum` był deklarowany w bloku
   "gracza", martwy dla nowej funkcji najwyższego poziomu bez przeliczenia) + trzy
   przeniesione bloki + literalna treść faz 7-14 (dawne 28793-33118, dziś wewnątrz
   nowej funkcji) bez ŻADNEJ zmiany tekstu poza przeniesieniem.
2. Trzy bloki przeniesione z bloku "gracza" na sam początek `runWorldEndTurn()`,
   usunięte ze starej pozycji: czyszczenie `st.bunt` (Zarzut 1 rundy 2 recon,
   dawne main.ts:28671-28674), `evictForeignUnitsFromCityHexes()` (dawne main.ts:28773),
   reset ruchu wszystkich jednostek (`movedByPlayerThisTurn.clear()` + pętla
   `ruchLeft`/`replaceUsedThisTurn`/`retreatedThisTurn`, dawne main.ts:28777-28789).
3. Call-site: `triggerPlayerEndTurn()` woła teraz `await runWorldEndTurn();`
   (main.ts:33122) dokładnie w miejscu, gdzie dawniej zaczynał się `turn++`.
4. Zero zmian w trzech call-site'ach `triggerPlayerEndTurn()` (HUD, `__eraTestDebug.
   endTurn`, skrót „N") — nietknięte, funkcja nadal istnieje pod tą samą nazwą.

Weryfikacja mechaniczna (nie samo odczytanie kodu, reguła §anty-samooszukiwanie):
skryptem policzono, że nowy plik main.ts różni się od oryginału WYŁĄCZNIE
przeniesieniem dokładnie tych linii — suma zakresów oryginału pokrywa 1:1 nowy
plik plus 5 nowych linii (deklaracja funkcji, `nextTurnNum`, zamknięcie, blank,
`await runWorldEndTurn();`) minus 1 usunięta pusta linia kosmetyczna (delta +4,
potwierdzone `wc -l`: 36186→36190). Zero utraty/duplikacji treści.

BLOKADY: brak.

ZMIANY/COMMIT: `gra/src/main.ts` (patrz wyżej). Commit SHA — patrz `git log -1`
po zapisaniu tego raportu (ten sam commit obejmuje oba pliki z allowlisty:
main.ts + ten raport).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` (wersja 5.9.3, zweryfikowana
  `--version`; `node_modules` skopiowane z `/home/user/The-Game/gra` — identyczny
  `package-lock.json`, md5 zgodny): **0 błędów** PRZED zmianą i **0 błędów** PO
  zmianie.
- `xvfb-run -a node tools/hotseat-etap4-noop-test.cjs` (30 tur, hash SHA-256 stanu
  po każdej turze, `Math.random` zdeterminizowany mulberry32, seed 424242, dwa
  przebiegi A/B):
  - **PRZED zmianą (baseline, kod na `06c0eaa5`): PASS 30/30** identycznych hashy
    A vs B. Wszystkie 30 hashy zapisane w pełnej postaci (SHA-256, nie skrót).
  - **PO zmianie: PASS 30/30** identycznych hashy A vs B.
  - **Porównanie z baseline (wymóg dyspozycji, nie tylko A==B):** zweryfikowane
    programowo (`diff` na wyekstrahowanych liniach `tura N (turn=M): hash=...`),
    WSZYSTKIE 30 hashy identyczne z baseline — zarówno przebieg po-zmianie A, jak
    i przebieg po-zmianie B, linia po linii, `IDENTICAL` na obu porównaniach.
    Przykład: tura 1 = `5a812a3ce327...`, tura 15 = `eda5d87add4c...`,
    tura 30 = `96600506c3be...` — te same wartości w baseline i po zmianie.
  - console.error() gry: 7 w obu przebiegach, przed i po (te same, świadome logi
    „Wojna wymuszona DECISION_REQUIRED" — niezwiązane z tematem).
  - `jsExceptions`: 0/0 we wszystkich czterech przebiegach (baseline A/B, po-zmianie A/B).
- `git diff --check -- gra/src/main.ts`: czyste (brak białych znaków/końców linii).

RUNDY: 1/5

NASTĘPNY KROK: Operator → Evaluator → Final Control → integracja allowlist-only.
Po zielonym Etapie 4a: dispatch `R-HOTSEAT-ETAP4B-SPLIT-Q1` (Krok 2-5 z recon —
`endActiveHumanTurn()`, `advanceSeat()`, przepięcie trzech call-site'ów) jako
OSOBNY temat, poza zakresem tej rundy.

DEPLOY/PUSH: NIE WYKONANO
