STATUS: PASS
DOMAIN: GAME (WEB) — render mapy
TEMAT: R-WEB-HUNTING-CAMP-HILL-NO-FLATTEN-Q1
GOAL: Obóz łowiecki nie wypłaszcza wzgórza z lasem (wizualnie); wzgórze i las zostają jak przy tartaku, model obozu osadzony na stoku.

PRZYCZYNA (zmierzona w Chromium)
- Obóz wymaga na tym samym heksie wcześniejszego tartaku (gra/src/map/improvement-build.ts:644), więc warstwy = ['tartak','oboz_lowiecki'].
- `preservesHillRelief` używa `layers.every(preservesHillReliefKey)` (gra/src/game/relief-preserving-improvements.ts); whitelista miała `tartak`, ale NIE `oboz_lowiecki` -> false.
- gra/src/main.ts:15269 `keepsReliefUnderImprovement` -> false; gałąź `forestKeptUnderImprovement` w `syncImprovementDecorForHex` (main.ts ~15375) też false, bo `tartak` nie jest w ULEPSZENIA_ZYWNOSCIOWE -> `hideDecorAtHex` chowa kopiec i las. Tartak solo: whitelista true -> bez ukrywania. Zgadza się z diagnozą właściciela (tartak OK, obóz = „wzgórze znika wizualnie").
- Dane nietknięte: terenBazowy i nakladka bez zmian (zmierzone przed/po). Ścieżki zmieniające nakladkę: tylko wyrąb (main.ts:15230, 15441, 39551 — jawna wycinka, poza zakresem); żadna nie zmienia terenBazowy; syncHexUlepszenieFields (main.ts:14717) ustawia tylko pola ulepszenia. Migracja zapisu: NIE_ZMIERZONO osobno (grep `terenBazowy =` nie wskazuje ścieżki zmieniającej relief przy obozie).
- Poprzednia naprawa (LAS-ZNIKA) obejmowała obóz solo (gałąź forestKept), nie realny stos tartak+obóz — stąd regres.
- Inne ulepszenia: kopalnie (prefiks), kamieniołom, owce/lama/bydło, tartak już w whiteliście; tarasy wypłaszczają z założenia (bez zmian).

ZMIANY/COMMIT
- gra/src/game/relief-preserving-improvements.ts: 'oboz_lowiecki' w PRESERVES_HILL_RELIEF_EXPLICIT_KEYS + komentarz.
- NOWY gra/tools/hunting-camp-hill-no-flatten-test.cjs.
- Dowody: evidence/ (6 PNG 1280x720, każdy < 300 KB, results.json), gate-*.txt.
- SHA: w odpowiedzi orkiestratorowi (commit na branchu worktree; raport nie może zawierać własnego SHA).

TESTY
- hunting-camp-hill-no-flatten-test.cjs: 20 PASS / 0 FAIL (predykat 6 + Chromium 14). Wariant PRZED (mutacja w pamięci Vite, usunięcie wpisu): dekor lasu 3 -> 1 po obozie, keeps=false (RED); trzy obozy wszystkie wypłaszczają. PO: 3->3, keeps=true, sectorR 0.86 jak tartak, model na topY+0.01, 3 obozy OK, obóz solo OK, płaski heks z lasem bez zmian. Zrzuty: evidence/przed-2 (płaski ciemny heks) vs po-2 (wzgórze z drzewami).
- sawmill-hill-relief-test.cjs 8/8; tsc --noEmit EXIT=0.
- NIE_URUCHOMIONO: szersza seria `*oboz-lowiecki*`, `*render*`, `*improvement*`, `*terrain*` przed/po (limit czasu/dysku); zmiana to jeden wpis w zbiorze, dotyczy tylko heksów z obozem.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (niezależny bieg testu + szersza regresja). Po integracji: REPIN w LEDGER — rust-port/renderer/src/models/improvements/** ma odtworzyć „obóz łowiecki zachowuje relief wzgórza jak tartak".
DEPLOY-PUSH: NIE WYKONANO
