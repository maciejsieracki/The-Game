STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTO-FORT-DIAG-Q1
GOAL: Zdiagnozować U-2 danymi i ocenić wg decyzji; naprawić U-3 (FAZA 0 stawia posterunek w całości w kole własnego fortu) z testem regresyjnym.
ZMIANY/COMMIT: kod+test: `f51bf056b` (baza kodu `a02d6bd30`; Operator `09fe841cd`, raport `45a98626f`). Ten raport: commit Final Control na wierzchu `f51bf056b` (SHA końcowy do integracji = HEAD tego brancha po tym commicie; sam kod identyczny z `f51bf056b`). Zmienione: `gra/src/game/auto-improvements.ts`, `gra/tools/auto-fort-diag-test.cjs`, pliki w katalogu runu. Allowlista czysta, `git diff --check` czysty.

WERDYKT ZARZUTÓW (dowód własny na detached `f51bf056b`):
1. U-2 NIEROZSTRZYGNIĘTE: ODDAL. Dispatch dopuszcza fixtury Node do czasu buildu orkiestratora, a Operatorowi zakazuje buildu; przyczyna w żywej grze = NIE_ZMIERZONO (uczciwie). Brak dowodu błędu, kod E-FORT niezmieniony, zgodnie z dispatchem. Pomiar żywy to krok orkiestratora.
2. U-3 tylko jedna kolejność: NAPRAWIONE przez Obronę (`auto-improvements.ts:1587-1605`, cofnięcie posterunku obejmowanego przez fort z tego samego wywołania: zwrot pracaLeft, globalSpent, placedThisCity, workingPlaced, koło w ownFortCircles). Przeczytałem logikę, księgowość spójna. Pomiar: z `auto-improvements.ts` z `09fe841cd` + nowy test D daje 2 FAIL (nested=1, n=2), z `f51bf056b` 17/0. Zarzut zamknięty.
3. Pełna rozłączność z pickFortClaims: ODDAL. Dispatch precyzuje regułę jako "koło w całości wewnątrz koła istniejącego/zaplanowanego fortu"; kandydat dający >=1 nowy heks ma powstawać (test C). Pełna rozłączność byłaby szersza niż zakres.
4. Pomiar B na HEAD: ODDAL; Obrona powtórzyła (5 pass / 12 fail na bazie), ja potwierdziłem niezależnie test D przeciw poprzedniemu kodowi.
Liczba NAPRAW: 0. Do decyzji człowieka: 0.

TESTY (własne, po `npm ci --ignore-scripts`): auto-fort-claim 63/0; autoimprove-stages-q1 302/0; auto-improvements 46/0; ai-improvements 56/0; autoimprove-live-hooks 37/0; auto-fort-diag 17/0; `tsc --noEmit` EXIT=0. Każdy `gate-*.txt` ma dokładnie jedną linię `EXIT=`. Żadna istniejąca asercja nie osłabiona (ai.ts, civ-test-hooks.ts nietknięte). `node_modules` usunięte.

BLOKADY: brak techniczny. Żywa weryfikacja wymaga buildu orkiestratora z SHA końcowym:
- `live-verify-autoimprove-fort.cjs 38 zrownowazone`; w drainDecisions filtrować `reason` zaczynające się od `e-fort` i `cityId==='city0'`, t3-t33 (uwaga: `slice(0,12)` może ucinać wpisy); odczytać bramkę i porównać z hipotezami (żywność w toku, ścieżka zapasowa, niedobór, sufit %).
- profil "infrastruktura", t3: brak posterunku obok fortu (ani w kolejności posterunek-pierwszy).
Jeśli żywy log pokaże, że bramka wstrzymuje fort wbrew decyzjom #24/#27, otworzyć nowy temat (ID z sufiksem).

RUNDY: 1/5 (FC po obronie r1)
NASTĘPNY KROK: integracja orkiestratora (cherry-pick/merge na main), build, żywy bieg powyżej.
KOLEJNOŚĆ względem origin/rust-port/parity-v2 (`9a6bf6eee`): zmiana dotyczy wyłącznie TS w `gra/` (gra-web), niezależna od `rust-port/**`. Integrować najpierw do main; parity-v2 nie jest warunkiem ani następstwem. Uwaga: parity-v2 różni się od `a02d6bd30` także w `gra/src/game/auto-improvements.ts` i `auto-fort-claim-test.cjs`, więc przy późniejszym zaciąganiu main do parity-v2 możliwy konflikt do ręcznego rozstrzygnięcia przez orkiestratora; ta paczka nie powinna czekać na parity-v2.
DEPLOY/PUSH: NIE WYKONANO
